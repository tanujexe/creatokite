const express = require('express');
const jwt     = require('jsonwebtoken');
const passport = require("passport");
const { body, validationResult } = require('express-validator');
const { User, Notification }     = require('../models');
const { auth, setAuthCookies, clearAuthCookies } = require('../middleware/auth');
const { computeScore, getRank, computeCAS }       = require('../services/scoring');
const { fetchSocialData }                          = require('../services/socialFetcher');
const { sendLoginMail, sendResetPasswordMail } = require("../utils/sendEmail");
const crypto = require('crypto');

const router    = express.Router();
const mkToken   = id => jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN        || '7d'  });
const mkRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

/* ── POST /api/auth/forgot-password ─────────────────────── */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, message: 'Valid email is required.' });

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal user existence for security
      return res.json({ success: true, message: 'If an account exists for this email, password reset code has been sent.' });
    }

    // Generate 6-digit OTP Code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save({ validateBeforeSave: false });

    // Send email via Nodemailer Gmail SMTP
    const emailSent = await sendResetPasswordMail(user.email, otpCode);
    console.log(`\n========================================`);
    console.log(`[FORGOT PASSWORD OTP CODE] Email: ${user.email} | OTP: ${otpCode}`);
    console.log(`========================================\n`);

    return res.json({
      success: true,
      message: emailSent
        ? 'Password reset code has been sent to your registered email address.'
        : `Password reset code generated: ${otpCode} (SMTP skipped in local environment)`,
      otp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error sending password reset code.' });
  }
});

/* ── POST /api/auth/reset-password ──────────────────────── */
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, message: 'Password must be at least 6 characters & code must be 6 digits.' });

    const { email, otp, newPassword } = req.body;
    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset code.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = '';
    user.resetPasswordExpires = undefined;

    const token = mkToken(user._id);
    const refresh = mkRefresh(user._id);
    user.refreshToken = refresh;

    await user.save();

    return sendAuth(res, 200, user, token, refresh, { message: 'Password reset successfully!' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

const sendAuth = (res, statusCode, user, token, refresh, extra = {}) => {
  // Set httpOnly secure cookies
  setAuthCookies(res, token, refresh);
  // Also return in body so frontend can read user data
  res.status(statusCode).json({
    success: true,
    token,               // still returned for non-browser clients / dev
    refreshToken: refresh,
    user: user.toPublicJSON ? user.toPublicJSON() : user,
    ...extra,
  });
};

/* ── POST /api/auth/register ────────────────────────────── */
router.post('/register', [
  body('displayName').trim().notEmpty().withMessage('Full Name is required').isLength({ min: 2, max: 60 }).withMessage('Full Name must be 2 to 60 characters'),
  body('email').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['creator', 'brand']).withMessage('Invalid account role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errMsg = errors.array().map(e => e.msg).join(', ');
      console.log('[REGISTER 400 VALIDATION ERROR]:', errors.array(), req.body);
      return res.status(400).json({ success: false, message: errMsg, errors: errors.array() });
    }

    const {
      displayName, email, password, role='creator',
      niche='', subNiches=[], companyName='', handle='',
      instagramUrl='', youtubeUrl='',
    } = req.body;

    if (await User.findOne({ email }))
      return res.status(409).json({ success:false, message:'Email already registered.' });
    // If handle is already taken, just ignore it — don't block registration
    const handleAvailable = handle ? !(await User.findOne({ handle: handle.toLowerCase() })) : false;

    const user = new User({
      displayName, email, password, role,
      niche:       role==='creator' ? niche : '',
      subNiches:   role==='creator' ? (Array.isArray(subNiches) ? subNiches : []) : [],
      companyName: role==='brand' ? (companyName||displayName) : '',
      handle:      (handle && handleAvailable) ? handle.toLowerCase() : undefined,
    });

    if (role==='creator') {
      const { total, dna } = computeScore(user);
      user.creatorScore=total; user.dna=dna; user.rank=getRank(total);
    }

    const token=mkToken(user._id), refresh=mkRefresh(user._id);
    user.refreshToken=refresh;
    await user.save();

    let socialResult = null;
    if (role==='creator' && (instagramUrl || youtubeUrl)) {
      try {
        const { igData, ytData } = await fetchSocialData(instagramUrl||null, youtubeUrl||null);
        if (igData || ytData) {
          const casResult = computeCAS({ igData, ytData, niche });
          const platformUpdate = {};
          if (igData) { platformUpdate['platforms.instagram.followers']=igData.followers; platformUpdate['platforms.instagram.engagement']=igData.er||0; }
          if (ytData) { platformUpdate['platforms.youtube.followers']=ytData.subscribers||ytData.followers; platformUpdate['platforms.youtube.engagement']=ytData.er||0; }
          const userCopy = user.toObject();
          if (igData) { userCopy.platforms.instagram.followers=igData.followers; userCopy.platforms.instagram.engagement=igData.er||0; }
          if (ytData) { userCopy.platforms.youtube.followers=ytData.subscribers||ytData.followers; userCopy.platforms.youtube.engagement=ytData.er||0; }
          const { total:newTotal, dna:newDna } = computeScore(userCopy);
          await User.findByIdAndUpdate(user._id, {
            ...platformUpdate,
            'socialUrls.instagram': instagramUrl,
            'socialUrls.youtube':   youtubeUrl,
            casScore:casResult.cas, casBreakdown:casResult.scores,
            casRisk:casResult.riskLevel, casBadge:casResult.badge,
            socialAnalyzed:true, analyzedAt:new Date(),
            verificationStatus: casResult.autoApprove ? 'approved' : 'pending',
            isVerified:casResult.autoApprove, creatorScore:newTotal, dna:newDna, rank:getRank(newTotal),
          });
          if (!casResult.autoApprove) {
            const admins = await User.find({ role:'admin' }).select('_id');
            await Promise.all(admins.map(a =>
              Notification.create({ user:a._id, type:'creator_approval',
                title:'🆕 New Creator Needs Approval',
                body:`${displayName} registered. CAS: ${casResult.cas}/100`,
                link:'/admin/creator-approval' }).catch(()=>{})
            ));
          }
          socialResult = { cas:casResult.cas, badge:casResult.badge, riskLevel:casResult.riskLevel, autoApprove:casResult.autoApprove };
        }
      } catch(e) { console.error('[Register social]', e.message); }
    }

    const finalUser = await User.findById(user._id).select('-password -refreshToken');
    return sendAuth(res, 201, finalUser, token, refresh, { socialResult });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── POST /api/auth/login ───────────────────────────────── */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, errors:errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success:false, message:'Invalid email or password.' });
    if (user.isBanned)
      return res.status(403).json({ success:false, message:`Account suspended: ${user.banReason}` });

    const now=new Date(), last=user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    if (last) {
      const diff=Math.floor((now-last)/86400000);
      user.streak = diff===1 ? (user.streak||0)+1 : diff>1 ? 1 : user.streak;
    } else user.streak=1;
    user.lastLoginDate=now;

    const token=mkToken(user._id), refresh=mkRefresh(user._id);
    user.refreshToken=refresh;
    await user.save({ validateBeforeSave:false });
    await sendLoginMail(user.email);

    return sendAuth(res, 200, user, token, refresh);
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── POST /api/auth/refresh ─────────────────────────────── */
router.post('/refresh', async (req, res) => {
  try {
    // Read from cookie first, then body
    const refreshToken = req.cookies?.ck_refresh || req.body?.refreshToken;
    if (!refreshToken) return res.status(401).json({ success:false, message:'No refresh token.', code:'NO_REFRESH' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success:false, message:'Invalid refresh token.' });

    const token=mkToken(user._id), newR=mkRefresh(user._id);
    user.refreshToken=newR;
    await user.save({ validateBeforeSave:false });

    return sendAuth(res, 200, user, token, newR);
  } catch(e) { res.status(401).json({ success:false, message:'Refresh failed.' }); }
});

/* ── POST /api/auth/logout ──────────────────────────────── */
router.post('/logout', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken:'' });
    clearAuthCookies(res);
    res.json({ success:true, message:'Logged out.' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── GET /api/auth/me ───────────────────────────────────── */
router.get('/me', auth, (req, res) => {
  res.json({ success:true, user:req.user.toPublicJSON ? req.user.toPublicJSON() : req.user });
});
/* ── GOOGLE LOGIN ───────────────────────────── */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);

/* ── GOOGLE CALLBACK ───────────────────────── */

router.get(
  "/google/callback",

  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),

  async (req, res) => {
    try {

      const token = mkToken(req.user._id);

      const refresh = mkRefresh(req.user._id);

      req.user.refreshToken = refresh;

      await req.user.save({
        validateBeforeSave: false,
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      return res.redirect(
        `${clientUrl}/login-success?token=${token}`
      );

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);
module.exports = router;
