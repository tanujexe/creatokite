const jwt  = require('jsonwebtoken');
const { User, AuditLog } = require('../models');

const extractToken = req => {
  if (req.cookies?.ck_token) return req.cookies.ck_token;
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) return h.slice(7);
  return null;
};

async function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ success:false, message:'Authentication required.', code:'NO_TOKEN' });
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch(e) {
      if (e.name === 'TokenExpiredError') return res.status(401).json({ success:false, message:'Session expired.', code:'TOKEN_EXPIRED' });
      return res.status(401).json({ success:false, message:'Invalid token.', code:'TOKEN_INVALID' });
    }
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user)       return res.status(401).json({ success:false, message:'Account not found.', code:'USER_NOT_FOUND' });
    if (user.isBanned) return res.status(403).json({ success:false, message:`Account suspended${user.banReason ? ': ' + user.banReason : ''}`, code:'BANNED' });
    req.user = user;
    next();
  } catch(e) { console.error('[Auth]', e.message); res.status(500).json({ success:false, message:'Authentication error.' }); }
}

/* ─── V2 multi-role helpers ────────────────── */
const getUserRoles = u => u?.roles?.length ? u.roles : u?.role ? [u.role] : ['creator'];
const userHasRole  = (u, ...roles) => roles.some(r => getUserRoles(u).includes(r));

const adminOnly      = (req,res,next) => userHasRole(req.user,'admin','superadmin')              ? next() : res.status(403).json({success:false,message:'Admin access required.'});
const teamOrAdmin    = (req,res,next) => userHasRole(req.user,'admin','superadmin','team_member') ? next() : res.status(403).json({success:false,message:'Team or Admin access required.'});
const brandOnly      = (req,res,next) => userHasRole(req.user,'brand','admin','superadmin')      ? next() : res.status(403).json({success:false,message:'Brand access required.'});
const creatorOnly    = (req,res,next) => userHasRole(req.user,'creator','admin','superadmin')    ? next() : res.status(403).json({success:false,message:'Creator access required.'});
const superadminOnly = (req,res,next) => userHasRole(req.user,'superadmin')                      ? next() : res.status(403).json({success:false,message:'SuperAdmin access required.'});
const requireRole    = (...roles) => (req,res,next) => userHasRole(req.user,...roles) ? next() : res.status(403).json({success:false,message:`Role required: ${roles.join(' or ')}`});

const setAuthCookies = (res, token, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  const opts   = { httpOnly:true, secure:isProd, sameSite:isProd?'strict':'lax', path:'/' };
  res.cookie('ck_token',   token,        { ...opts, maxAge: 7*24*60*60*1000 });
  res.cookie('ck_refresh', refreshToken, { ...opts, maxAge:30*24*60*60*1000 });
};
const clearAuthCookies = res => {
  res.clearCookie('ck_token',   { httpOnly:true, path:'/' });
  res.clearCookie('ck_refresh', { httpOnly:true, path:'/' });
};

const audit = async (req, action, category='system', details={}, severity='low', targetUser=null, targetResource='') => {
  try {
    await AuditLog.create({ action, category, severity, performedBy:req.user._id, targetUser:targetUser||undefined, targetResource, details, ipAddress:req.ip||req.headers['x-forwarded-for']||'', userAgent:req.headers['user-agent']||'' });
  } catch(e) {}
};

module.exports = { auth, adminOnly, brandOnly, creatorOnly, superadminOnly, teamOrAdmin, requireRole, getUserRoles, userHasRole, setAuthCookies, clearAuthCookies, audit };
