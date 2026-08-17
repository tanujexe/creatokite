const express = require('express');
const { auth, adminOnly, audit } = require('../middleware/auth');
const { User, Task, Notification, FeedEvent, DMReport } = require('../models');
const router = express.Router();

router.use(auth, adminOnly);

const notify = async (uid, type, title, body, link = '') => {
  try {
    await Notification.create({ user: uid, type, title, body, link });
  } catch (e) {
    console.error('[Notification Error]', e.message);
  }
};

/* ── 1. GET /members ─────────────────────────────────────── */
router.get('/members', async (req, res) => {
  try {
    const members = await User.find({
      $or: [
        { role: { $in: ['admin', 'superadmin', 'team_member'] } },
        { roles: { $in: ['admin', 'superadmin', 'team_member'] } }
      ],
      isDeleted: { $ne: true }
    }).select('displayName email avatar role roles teamDepartment teamTitle availability createdAt lastLoginDate');

    const now = new Date();
    const result = await Promise.all(members.map(async (m) => {
      const memberObj = m.toObject();
      const [total, inProgress, completed, overdue] = await Promise.all([
        Task.countDocuments({ assignedTo: m._id, isArchived: false, isDeleted: { $ne: true } }),
        Task.countDocuments({ assignedTo: m._id, status: 'in_progress', isArchived: false, isDeleted: { $ne: true } }),
        Task.countDocuments({ assignedTo: m._id, status: 'done', isArchived: false, isDeleted: { $ne: true } }),
        Task.countDocuments({
          assignedTo: m._id,
          status: { $ne: 'done' },
          dueDate: { $lt: now },
          isArchived: false,
          isDeleted: { $ne: true }
        })
      ]);
      memberObj.stats = { total, inProgress, completed, overdue };
      return memberObj;
    }));

    res.json({ success: true, members: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── 2. GET /members/:id ─────────────────────────────────── */
router.get('/members/:id', async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).select('-password -refreshToken');
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });

    const now = new Date();
    const [total, inProgress, completed, overdue] = await Promise.all([
      Task.countDocuments({ assignedTo: member._id, isArchived: false, isDeleted: { $ne: true } }),
      Task.countDocuments({ assignedTo: member._id, status: 'in_progress', isArchived: false, isDeleted: { $ne: true } }),
      Task.countDocuments({ assignedTo: member._id, status: 'done', isArchived: false, isDeleted: { $ne: true } }),
      Task.countDocuments({
        assignedTo: member._id,
        status: { $ne: 'done' },
        dueDate: { $lt: now },
        isArchived: false,
        isDeleted: { $ne: true }
      })
    ]);

    const tasks = await Task.find({ assignedTo: member._id, isArchived: false, isDeleted: { $ne: true } })
      .populate('assignedBy', 'displayName avatar')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    // Timeline calculations: Feed events (actor) and DM Reports (teamMember)
    const [feedEvents, dmReports] = await Promise.all([
      FeedEvent.find({ actor: member._id }).populate('campaign', 'title').sort({ createdAt: -1 }).limit(30),
      DMReport.find({ teamMember: member._id }).sort({ date: -1 }).limit(30)
    ]);

    const timeline = [];
    feedEvents.forEach(e => {
      timeline.push({
        type: 'activity',
        date: e.createdAt,
        message: e.message,
        details: e.metadata || {}
      });
    });

    dmReports.forEach(r => {
      timeline.push({
        type: 'dm',
        date: r.date,
        message: `Submitted DM Outreach report: ${r.creatorDMs || 0} DMs sent to creators, ${r.brandDMs || 0} DMs sent to brands.`,
        details: { replies: r.repliesReceived, leads: r.interestedLeads }
      });
    });

    // Sort timeline by date descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      member,
      stats: { total, inProgress, completed, overdue },
      tasks,
      timeline: timeline.slice(0, 40)
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── 3. GET /tasks (Global Task Center) ──────────────────── */
router.get('/tasks', async (req, res) => {
  try {
    const { status, priority, assignedTo, department, search, page = 1, limit = 20 } = req.query;
    const q = { isArchived: false, isDeleted: { $ne: true } };

    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (assignedTo) q.assignedTo = assignedTo;
    if (department) q.department = department;
    if (search) q.title = { $regex: search, $options: 'i' };

    const [tasks, total] = await Promise.all([
      Task.find(q)
        .populate('assignedTo', 'displayName avatar role')
        .populate('assignedBy', 'displayName avatar')
        .populate('campaign', 'title')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Task.countDocuments(q)
    ]);

    res.json({
      success: true,
      tasks,
      total,
      pages: Math.ceil(total / +limit),
      page: +page
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── 4. POST /tasks (Assign Task) ────────────────────────── */
router.post('/tasks', async (req, res) => {
  try {
    const { title, description = '', priority = 'medium', assignedTo = [], campaign, dueDate, department = '', targetDMs = 0 } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required' });

    const task = await Task.create({
      title,
      description,
      priority,
      assignedTo,
      assignedBy: req.user._id,
      campaign: campaign || undefined,
      dueDate: dueDate || undefined,
      department,
      outreachGoal: {
        targetDMs: +targetDMs || 0,
        currentDMs: 0
      }
    });

    // Notify all assigned members
    for (const uid of assignedTo) {
      await notify(uid, 'task_assigned', '📋 New Task Assigned', `"${title}" has been assigned to you by ${req.user.displayName}.`, '/team/tasks');
    }

    try {
      await FeedEvent.create({
        eventType: 'task_completed', // Using task_completed or achievements for tracking tasks
        actor: req.user._id,
        message: `Task "${title}" created and assigned by Admin.`,
        visibleTo: 'team'
      });
    } catch (feErr) {}

    await audit(req, 'TASK_CREATED', 'task', { title, assignedTo }, 'low', null, `Task:${task._id}`);

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'displayName avatar email role')
      .populate('assignedBy', 'displayName avatar');

    res.status(201).json({ success: true, task: populated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── 5. PUT /tasks/:id (Edit & Reassign Task) ────────────── */
router.put('/tasks/:id', async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, department, targetDMs } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const oldAssigned = new Set((task.assignedTo || []).map(id => id.toString()));

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      task.status = status;
      if (status === 'done') {
        task.completedAt = new Date();
        // Notify assigner
        await notify(task.assignedBy, 'task_completed', '✅ Task Completed', `Task "${task.title}" has been marked as complete.`, '/admin/team-management');
      }
    }
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;
    if (department !== undefined) task.department = department;
    
    if (targetDMs !== undefined) {
      task.outreachGoal = {
        targetDMs: +targetDMs || 0,
        currentDMs: task.outreachGoal?.currentDMs || 0
      };
    }

    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo;
      // Find new assignees to notify
      const newAssignees = assignedTo.filter(id => !oldAssigned.has(id.toString()));
      for (const uid of newAssignees) {
        await notify(uid, 'task_reassigned', '🔄 Task Reassigned to You', `Task "${task.title}" is now assigned to you.`, '/team/tasks');
      }
    }

    await task.save();
    await audit(req, 'TASK_UPDATED', 'task', { title: task.title, status: task.status }, 'low', null, `Task:${task._id}`);

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'displayName avatar email role')
      .populate('assignedBy', 'displayName avatar')
      .populate('campaign', 'title');

    res.json({ success: true, task: populated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── 6. DELETE /tasks/:id (Delete Task) ──────────────────── */
router.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await audit(req, 'TASK_DELETED', 'task', { title: task.title }, 'medium', null, `Task:${task._id}`);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── 7. GET /activity (Team Activity Center) ─────────────── */
router.get('/activity', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [feedEvents, dmReports] = await Promise.all([
      FeedEvent.find({ visibleTo: { $in: ['team', 'all'] } })
        .populate('actor', 'displayName avatar role')
        .populate('campaign', 'title')
        .sort({ createdAt: -1 })
        .limit(+limit),
      DMReport.find()
        .populate('teamMember', 'displayName avatar role')
        .sort({ date: -1 })
        .limit(+limit)
    ]);

    const timeline = [];
    feedEvents.forEach(e => {
      timeline.push({
        _id: e._id,
        type: 'activity',
        date: e.createdAt,
        user: e.actor,
        message: e.message,
        details: e.metadata || {}
      });
    });

    dmReports.forEach(r => {
      timeline.push({
        _id: r._id,
        type: 'dm',
        date: r.date,
        user: r.teamMember,
        message: `Submitted daily DM report: ${r.creatorDMs || 0} DMs sent to creators, ${r.brandDMs || 0} DMs sent to brands.`,
        details: { replies: r.repliesReceived, leads: r.interestedLeads }
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    const paginatedTimeline = timeline.slice((+page - 1) * +limit, +page * +limit);

    res.json({
      success: true,
      events: paginatedTimeline,
      total: timeline.length,
      pages: Math.ceil(timeline.length / +limit),
      page: +page
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── 8. GET /analytics (Team Performance Analytics) ──────── */
router.get('/analytics', async (req, res) => {
  try {
    const [activeTasks, completedTasks, completedTasksWithTimes] = await Promise.all([
      Task.countDocuments({ status: { $ne: 'done' }, isArchived: false, isDeleted: { $ne: true } }),
      Task.countDocuments({ status: 'done', isArchived: false, isDeleted: { $ne: true } }),
      Task.find({ status: 'done', completedAt: { $exists: true }, isDeleted: { $ne: true } }).select('createdAt completedAt')
    ]);

    // Average Completion Time in Hours
    let averageCompletionTime = 0;
    if (completedTasksWithTimes.length > 0) {
      const totalTime = completedTasksWithTimes.reduce((sum, task) => {
        const diff = new Date(task.completedAt) - new Date(task.createdAt);
        return sum + diff;
      }, 0);
      averageCompletionTime = Math.round((totalTime / completedTasksWithTimes.length) / (1000 * 60 * 60)); // In Hours
    }

    // Member Metrics
    const members = await User.find({
      $or: [
        { role: { $in: ['admin', 'superadmin', 'team_member'] } },
        { roles: { $in: ['admin', 'superadmin', 'team_member'] } }
      ],
      isDeleted: { $ne: true }
    }).select('displayName email avatar role teamDepartment teamTitle');

    const now = new Date();
    const memberMetrics = await Promise.all(members.map(async (m) => {
      const [assigned, completed, overdue] = await Promise.all([
        Task.countDocuments({ assignedTo: m._id, isArchived: false, isDeleted: { $ne: true } }),
        Task.countDocuments({ assignedTo: m._id, status: 'done', isArchived: false, isDeleted: { $ne: true } }),
        Task.countDocuments({
          assignedTo: m._id,
          status: { $ne: 'done' },
          dueDate: { $lt: now },
          isArchived: false,
          isDeleted: { $ne: true }
        })
      ]);
      const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      return {
        member: m,
        assigned,
        completed,
        overdue,
        completionRate
      };
    }));

    res.json({
      success: true,
      stats: {
        activeTasks,
        completedTasks,
        averageCompletionTime
      },
      memberMetrics
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
