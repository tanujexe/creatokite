require('dotenv').config();
const REQUIRED = ['MONGODB_URI','JWT_SECRET','JWT_REFRESH_SECRET','CLIENT_URL'];
const missing  = REQUIRED.filter(k => !process.env[k]);
if (missing.length) { console.error('❌ Missing env vars:', missing.join(', ')); process.exit(1); }

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cors        = require('cors');
const compression = require('compression');
const morgan      = require('morgan');
const cookieParser= require('cookie-parser');
const mongoose    = require('mongoose');
const passport    = require('passport');
require('./config/passport');

const connectDB  = require('./config/db');
const { helmetConfig, globalLimiter, authLimiter, sanitize, xssClean, httpsRedirect, secureHeaders } = require('./middleware/security');

const app    = express();
app.use(passport.initialize());
const server = http.createServer(app);
const CLIENT = process.env.CLIENT_URL;

/* ── Socket.io with performance opts ── */
const io = new Server(server, {
  cors: { origin: CLIENT, methods:['GET','POST'], credentials:true },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket','polling'],
  allowEIO3: true,
});
app.set('io', io);
io.on('connection', socket => {
  socket.on('join:user', id   => { if(id) socket.join(`user:${id}`); });
  socket.on('join:room', room => { if(room) socket.join(`room:${room}`); });
  socket.on('leave:room',room => { if(room) socket.leave(`room:${room}`); });
  socket.on('disconnect', () => {});
});

/* ── Security ── */
app.set('trust proxy', 1);
app.use(httpsRedirect);
app.use(helmetConfig);
app.use(secureHeaders);
app.use(cors({
  origin: CLIENT, credentials:true,
  methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders:['Content-Type','Authorization'],
}));
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true, limit:'10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET||process.env.JWT_SECRET));
app.use(sanitize);
app.use(xssClean);
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

/* ── Rate limiting ── */
app.use('/api/', globalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

/* ── V1 Routes ── */
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/admin/team-management', require('./routes/teamManagement'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reels',     require('./routes/reels'));
app.use('/api/ecosystem', require('./routes/ecosystem'));

/* ── V2/V2.5 Routes ── */
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/rooms',     require('./routes/rooms'));
app.use('/api/workspace', require('./routes/workspace'));
app.use('/api/crm',       require('./routes/crm'));
app.use('/api/search',    require('./routes/search'));
app.use('/api/audit',     require('./routes/audit'));
app.use('/api/revenue',   require('./routes/revenue'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/export',    require('./routes/export'));

/* ── V3 Routes ── */
app.use('/api/opportunities', require('./routes/opportunities'));

/* ── Health ── */
app.get('/health', (_req, res) => res.json({ status:'ok', version:'3.0.0', ts:new Date().toISOString() }));

/* ── 404 ── */
app.use((_req, res) => res.status(404).json({ success:false, message:'Route not found' }));

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status||500).json({ success:false, message: process.env.NODE_ENV==='production'?'Server error':err.message });
});

/* ── Cron jobs ── */
const scheduleCrons = () => {
  try {
    const cron = require('node-cron');
    const { recalculateAllScores } = require('./services/scoring');
    /* Recalculate scores at 3am */
    cron.schedule('0 3 * * *', () => { console.log('[Cron] Recalculating scores'); recalculateAllScores(); });
    /* Follow-up reminders at 9am */
    cron.schedule('0 9 * * *', async () => {
      try {
        const { User } = require('./models');
        const { sendFollowUpReminderMail } = require('./utils/sendEmail');
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
        const due = await User.find({ nextFollowUpDate:{ $gte:today, $lt:tomorrow }, isDeleted:{$ne:true} }).select('assignedTeamMember email displayName followUpNotes nextFollowUpDate').populate('assignedTeamMember','email displayName');
        for (const u of due) {
          if (u.assignedTeamMember?.email) {
            await sendFollowUpReminderMail(u.assignedTeamMember.email, u.assignedTeamMember.displayName, u.displayName, u.followUpNotes);
          }
        }
        console.log(`[Cron] Sent ${due.length} follow-up reminders`);

        // ── Overdue & Deadline Approaching Tasks Check ──
        try {
          const { Task, Notification } = require('./models');
          const now = new Date();
          const tomorrowStart = new Date(now);
          tomorrowStart.setDate(tomorrowStart.getDate() + 1);
          tomorrowStart.setHours(0, 0, 0, 0);
          const tomorrowEnd = new Date(tomorrowStart);
          tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

          const activeTasks = await Task.find({
            status: { $ne: 'done' },
            isArchived: false,
            isDeleted: { $ne: true },
            dueDate: { $exists: true }
          });

          for (const task of activeTasks) {
            const due = new Date(task.dueDate);
            if (due < now) {
              for (const uid of task.assignedTo) {
                const existingNotif = await Notification.findOne({
                  user: uid,
                  type: 'task_overdue',
                  body: { $regex: task.title, $options: 'i' }
                });
                if (!existingNotif) {
                  await Notification.create({
                    user: uid,
                    type: 'task_overdue',
                    title: '⚠️ Task Overdue!',
                    body: `Task "${task.title}" was due on ${due.toLocaleDateString('en-IN')}. Please complete it.`,
                    link: '/team/tasks'
                  });
                }
              }
            } else if (due >= tomorrowStart && due < tomorrowEnd) {
              for (const uid of task.assignedTo) {
                const existingNotif = await Notification.findOne({
                  user: uid,
                  type: 'task_deadline_approaching',
                  body: { $regex: task.title, $options: 'i' }
                });
                if (!existingNotif) {
                  await Notification.create({
                    user: uid,
                    type: 'task_deadline_approaching',
                    title: '⏰ Deadline Approaching',
                    body: `Task "${task.title}" is due tomorrow!`,
                    link: '/team/tasks'
                  });
                }
              }
            }
          }
        } catch (taskCronErr) {
          console.error('[Cron tasks check error]', taskCronErr.message);
        }
      } catch(e) { console.error('[Cron follow-up]', e.message); }
    });
    console.log('[Cron] Scheduled ✓');
  } catch(e) { console.log('[Cron] Skipped:', e.message); }
};

/* ── Start ── */
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 CreatoKite V2.5 · Port ${PORT} · ${process.env.NODE_ENV}`);
    console.log(`   CORS   → ${CLIENT}`);
    console.log(`   Health → http://localhost:${PORT}/health\n`);
    try { const { startTracker } = require('./services/reelTracker'); startTracker(io); } catch(e) {}
    scheduleCrons();
  });
}).catch(err => { console.error('DB connect failed:', err); process.exit(1); });

/* Graceful shutdown */
process.on('SIGTERM', () => { server.close(() => { mongoose.connection.close(); process.exit(0); }); });
module.exports = app;
