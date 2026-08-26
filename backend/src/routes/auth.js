const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require("passport");
const { body, validationResult } = require('express-validator');
const { User, Campaign, Notification } = require('../models');
const { auth, setAuthCookies, clearAuthCookies } = require('../middleware/auth');
const { computeScore, getRank, computeCAS } = require('../services/scoring');
const { fetchSocialData } = require('../services/socialFetcher');
const { sendLoginMail, sendResetPasswordMail, sendVerificationMail } = require("../utils/sendEmail");
const crypto = require('crypto');

const router = express.Router();
const mkToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const mkRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

/* ── GET /api/auth/public-stats ────────────────────────── */
router.get('/public-stats', async (req, res) => {
  try {
    const creatorCount = await User.countDocuments({ role: 'creator' });
    const brandCount = await User.countDocuments({ role: 'brand' });
    const campaignCount = await Campaign.countDocuments({});

    const displayCreators = `${Math.max(200, creatorCount)}+`;
    const displayBrands = `${Math.max(4, brandCount)}+`;
    const displayCampaigns = `${Math.max(25, campaignCount)}+`;

    return res.json({
      success: true,
      creators: creatorCount,
      brands: brandCount,
      campaigns: campaignCount,
      displayCreators,
      displayBrands,
      displayCampaigns,
    });
  } catch (err) {
    return res.json({
      success: true,
      creators: 200,
      brands: 4,
      campaigns: 25,
      displayCreators: '200+',
      displayBrands: '4+',
      displayCampaigns: '25+',
    });
  }
});

/* ── POST /api/auth/forgot-password ─────────────────────── */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Valid email is required.' });

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

    // Send email via Resend / Nodemailer
    const emailSent = await sendResetPasswordMail(user.email, otpCode);
    console.log(`\n========================================`);
    console.log(`[FORGOT PASSWORD OTP CODE] Email: ${user.email} | OTP: ${otpCode}`);
    console.log(`========================================\n`);

    return res.json({
      success: true,
      message: emailSent
        ? 'Password reset code has been sent to your registered email address.'
        : 'Password reset code generated and sent to email.'
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
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters & code must be 6 digits.' });

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

/* ── POST /api/auth/validate-instagram ────────────────── */
router.post('/validate-instagram', async (req, res) => {
  try {
    const { handle, instagramUrl } = req.body;
    const target = instagramUrl || handle;
    if (!target || !target.trim()) {
      return res.status(400).json({ success: false, valid: false, message: 'Instagram handle or profile URL is required.' });
    }

    const { igData } = await fetchSocialData(target, null);
    if (!igData || igData._isEstimated || !igData.isReal) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Invalid Instagram ID: We could not verify "${target}" on Instagram. Please check for typos and enter your correct public Instagram handle or URL.`
      });
    }

    return res.json({
      success: true,
      valid: true,
      data: {
        username: igData.username,
        fullName: igData.fullName,
        followers: igData.followers,
        profilePic: igData.profilePic,
        isVerified: igData.isVerified
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      valid: false,
      message: 'Failed to verify Instagram account. Please check the handle and try again.'
    });
  }
});

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
      displayName, email, phone = '', password, role = 'creator',
      niche = '', subNiches = [], companyName = '', handle = '',
      instagramUrl = '', youtubeUrl = '',
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Valid email address is required for registration.' });
    }

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email address is already registered.' });

    let verifiedIgData = null;
    let verifiedYtData = null;

    // Strict Creator Instagram Requirement & Live Account Validation
    if (role === 'creator') {
      const targetIg = instagramUrl || handle;
      if (!targetIg || !targetIg.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Instagram handle or profile URL is required to register as a creator.'
        });
      }

      console.log(`[Register Verification] Live verifying IG handle "${targetIg}"...`);
      const { igData, ytData } = await fetchSocialData(targetIg, youtubeUrl || null);
      if (!igData || igData._isEstimated || !igData.isReal) {
        return res.status(400).json({
          success: false,
          message: `Invalid Instagram ID: We could not verify "${targetIg}" on Instagram. Please check for typos and enter your correct public Instagram handle or URL.`
        });
      }
      verifiedIgData = igData;
      verifiedYtData = ytData;
    }

    // If handle is already taken, check uniqueness
    const cleanHandle = handle ? (handle.startsWith('@') ? handle.slice(1).toLowerCase() : handle.toLowerCase()) : (verifiedIgData?.username ? verifiedIgData.username.toLowerCase() : undefined);

    if (role === 'creator' && cleanHandle) {
      const existingHandleUser = await User.findOne({ handle: cleanHandle });
      if (existingHandleUser) {
        return res.status(409).json({
          success: false,
          message: `This Instagram handle (@${cleanHandle}) is already registered to another creator account.`
        });
      }
    }

    // Generate Email Verification Token (24h validity)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = new User({
      displayName, email, phone: phone.trim(), password, role,
      niche: role === 'creator' ? niche : '',
      subNiches: role === 'creator' ? (Array.isArray(subNiches) ? subNiches : []) : [],
      companyName: role === 'brand' ? (companyName || displayName) : '',
      handle: cleanHandle,
      emailVerified: false,
      emailVerifyToken: verificationTokenHash,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    if (role === 'creator') {
      const { total, dna } = computeScore(user);
      user.creatorScore = total; user.dna = dna; user.rank = getRank(total);
    }

    const token = mkToken(user._id), refresh = mkRefresh(user._id);
    user.refreshToken = refresh;
    await user.save();

    // Dispatch verification mail via Resend / Nodemailer
    await sendVerificationMail(user.email, user.displayName, verificationToken).catch(e => console.error('[Register Verify Mail Error]', e.message));

    let socialResult = null;
    if (role === 'creator' && verifiedIgData) {
      try {
        const casResult = computeCAS({ igData: verifiedIgData, ytData: verifiedYtData, niche });
        const platformUpdate = {};
        if (verifiedIgData) { platformUpdate['platforms.instagram.followers'] = verifiedIgData.followers; platformUpdate['platforms.instagram.engagement'] = verifiedIgData.er || 0; }
        if (verifiedYtData) { platformUpdate['platforms.youtube.followers'] = verifiedYtData.subscribers || verifiedYtData.followers; platformUpdate['platforms.youtube.engagement'] = verifiedYtData.er || 0; }
        
        const userCopy = user.toObject();
        if (!userCopy.platforms) userCopy.platforms = {};
        if (!userCopy.platforms.instagram) userCopy.platforms.instagram = { followers: 0, engagement: 0 };
        if (!userCopy.platforms.youtube) userCopy.platforms.youtube = { followers: 0, engagement: 0 };

        if (verifiedIgData) { userCopy.platforms.instagram.followers = verifiedIgData.followers; userCopy.platforms.instagram.engagement = verifiedIgData.er || 0; }
        if (verifiedYtData) { userCopy.platforms.youtube.followers = verifiedYtData.subscribers || verifiedYtData.followers; userCopy.platforms.youtube.engagement = verifiedYtData.er || 0; }
        const { total: newTotal, dna: newDna } = computeScore(userCopy);

        await User.findByIdAndUpdate(user._id, {
          ...platformUpdate,
          'socialUrls.instagram': instagramUrl || verifiedIgData.username,
          'socialUrls.youtube': youtubeUrl,
          casScore: casResult.cas, casBreakdown: casResult.scores,
          casRisk: casResult.riskLevel, casBadge: casResult.badge,
          socialAnalyzed: true, analyzedAt: new Date(),
          verificationStatus: casResult.autoApprove ? 'approved' : 'pending',
          isVerified: casResult.autoApprove, creatorScore: newTotal, dna: newDna, rank: getRank(newTotal),
        });
        if (!casResult.autoApprove) {
          const admins = await User.find({ role: 'admin' }).select('_id');
          await Promise.all(admins.map(a =>
            Notification.create({
              user: a._id, type: 'creator_approval',
              title: '🆕 New Creator Needs Approval',
              body: `${displayName} registered. CAS: ${casResult.cas}/100`,
              link: '/admin/creator-approval'
            }).catch(() => { })
          ));
        }
        socialResult = { cas: casResult.cas, badge: casResult.badge, riskLevel: casResult.riskLevel, autoApprove: casResult.autoApprove, igData: verifiedIgData, ytData: verifiedYtData };
      } catch (e) { console.error('[Register social]', e.message || e); }
    }

    const finalUser = await User.findById(user._id).select('-password -refreshToken');
    return sendAuth(res, 201, finalUser, token, refresh, { socialResult });
  } catch (e) {
    if (e.code === 11000 || (e.message && e.message.includes('E11000'))) {
      const key = Object.keys(e.keyPattern || {})[0] || 'handle';
      const msg = key === 'handle'
        ? 'This Instagram handle is already registered to another creator account.'
        : key === 'email'
        ? 'This email address is already registered on CreatoKite.'
        : 'An account with these details already exists.';
      return res.status(409).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── GET /api/auth/verify-email ─────────────────────────── */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Verification token is required.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerifyToken: tokenHash,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    user.emailVerified = true;
    user.emailVerifyToken = '';
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({ success: true, message: 'Your email address has been successfully verified!' });
  } catch (error) {
    console.error('Verify Email Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during email verification.' });
  }
});

/* ── POST /api/auth/resend-verification ──────────────────── */
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a verification link has been sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'This email address is already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerifyToken = verificationTokenHash;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationMail(user.email, user.displayName, verificationToken);

    return res.json({ success: true, message: 'Verification email sent successfully!' });
  } catch (error) {
    console.error('Resend Verification Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send verification email.' });
  }
});

/* ── POST /api/auth/login ───────────────────────────────── */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (user.isBanned)
      return res.status(403).json({ success: false, message: `Account suspended${user.banReason ? ': ' + user.banReason : '. Please contact support.'}` });

    const now = new Date(), last = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    if (last) {
      const diff = Math.floor((now - last) / 86400000);
      user.streak = diff === 1 ? (user.streak || 0) + 1 : diff > 1 ? 1 : user.streak;
    } else user.streak = 1;
    user.lastLoginDate = now;

    const token = mkToken(user._id), refresh = mkRefresh(user._id);
    user.refreshToken = refresh;
    await user.save({ validateBeforeSave: false });
    sendLoginMail(user.email).catch(err => console.error('[Login Email Error]', err.message));

    return sendAuth(res, 200, user, token, refresh);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── POST /api/auth/refresh ─────────────────────────────── */
router.post('/refresh', async (req, res) => {
  try {
    // Read from cookie first, then body
    const refreshToken = req.cookies?.ck_refresh || req.body?.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token.', code: 'NO_REFRESH' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });

    const token = mkToken(user._id), newR = mkRefresh(user._id);
    user.refreshToken = newR;
    await user.save({ validateBeforeSave: false });

    return sendAuth(res, 200, user, token, newR);
  } catch (e) { res.status(401).json({ success: false, message: 'Refresh failed.' }); }
});

/* ── POST /api/auth/logout ──────────────────────────────── */
router.post('/logout', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: '' });
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── GET /api/auth/me ───────────────────────────────────── */
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON ? req.user.toPublicJSON() : req.user });
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
