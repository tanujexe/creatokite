// ═══════════════════════════════════════════════════════════════
// routes/reels.js — Reel tracking API
// ═══════════════════════════════════════════════════════════════
const router  = require('express').Router();
const { auth } = require('../middleware/auth');
const Reel    = require('../models/Reel');
const { scrapeReel, extractShortcode } = require('../services/reelScraper');
const { refreshDueReels } = require('../services/reelTracker');

// All routes require login
router.use(auth);

/* ── POST /api/reels/track ─────────────────────────────────── */
router.post('/track', async (req, res) => {
  try {
    const { url: rawUrl } = req.body;
    if (!rawUrl) return res.status(400).json({ success: false, message: 'URL required' });

    // Decode HTML entities
    const url = rawUrl.replace(/&#x2F;/g, '/').replace(/&#x2f;/g, '/').replace(/&amp;/g, '&').trim();

    const shortcode = extractShortcode(url);
    if (!shortcode)
      return res.status(400).json({ success: false, message: 'Invalid Instagram Reel URL' });

    // Duplicate check
    const existing = await Reel.findOne({ shortcode });
    if (existing) {
      // If added by same user, just return it
      if (existing.addedBy.toString() === req.user._id.toString())
        return res.json({ success: true, reel: existing, message: 'Already tracking this reel' });
    }

    // Create reel
    const reel = await Reel.create({
      url:        `https://www.instagram.com/reel/${shortcode}/`,
      shortcode,
      addedBy:    req.user._id,
      campaignId: req.body.campaignId || null,
      status:     'queued',
      nextFetchAt: new Date(),
    });

    // Trigger immediate fetch in background
    setImmediate(async () => {
      try {
        const data = await scrapeReel(shortcode);
        reel.views       = data.views;
        reel.likes       = data.likes;
        reel.comments    = data.comments;
        reel.engagement  = data.engagement;
        reel.username    = data.username   || '';
        reel.fullName    = data.fullName   || '';
        reel.caption     = data.caption    || '';
        reel.thumbnail   = data.thumbnail  || '';
        reel.publishedAt = data.publishedAt|| null;
        reel.dataSource  = data.source;
        reel.status      = 'tracking';
        reel.lastFetchedAt = new Date();
        reel.history.push({
          views: data.views, likes: data.likes,
          comments: data.comments, engagement: data.engagement,
        });
        reel.scheduleNext();
        await reel.save();

        // Emit to user
        const io = req.app.get('io');
        if (io) io.to(`user:${req.user._id}`).emit('reel:updated', {
          _id: reel._id, ...data, status: 'tracking',
        });
      } catch (e) {
        reel.status     = 'failed';
        reel.failReason = e.message;
        await reel.save();
      }
    });

    res.status(201).json({ success: true, reel, message: 'Reel queued for tracking!' });
  } catch (e) {
    console.error('[Reels/track]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── GET /api/reels ────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', sort = '-createdAt' } = req.query;
    const filter = { addedBy: req.user._id };

    if (search) {
      filter.$or = [
        { username: new RegExp(search, 'i') },
        { caption:  new RegExp(search, 'i') },
        { shortcode:new RegExp(search, 'i') },
      ];
    }
    if (status) filter.status = status;

    const [reels, total] = await Promise.all([
      Reel.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(+limit)
        .select('-history'), // exclude history for list view
      Reel.countDocuments(filter),
    ]);

    res.json({ success: true, reels, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── GET /api/reels/stats ──────────────────────────────────── */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const [total, tracking, failed, reels] = await Promise.all([
      Reel.countDocuments({ addedBy: userId }),
      Reel.countDocuments({ addedBy: userId, status: 'tracking' }),
      Reel.countDocuments({ addedBy: userId, status: 'failed' }),
      Reel.find({ addedBy: userId, status: 'tracking' })
        .select('views likes comments engagement velocity username')
        .limit(100),
    ]);

    const totalViews    = reels.reduce((a, r) => a + r.views,    0);
    const totalLikes    = reels.reduce((a, r) => a + r.likes,    0);
    const totalComments = reels.reduce((a, r) => a + r.comments, 0);
    const avgEngagement = reels.length
      ? parseFloat((reels.reduce((a, r) => a + r.engagement, 0) / reels.length).toFixed(2))
      : 0;

    // Creator leaderboard
    const creatorMap = {};
    reels.forEach(r => {
      if (!r.username) return;
      if (!creatorMap[r.username]) creatorMap[r.username] = { views: 0, likes: 0, reels: 0 };
      creatorMap[r.username].views += r.views;
      creatorMap[r.username].likes += r.likes;
      creatorMap[r.username].reels += 1;
    });
    const topCreators = Object.entries(creatorMap)
      .map(([username, s]) => ({ username, ...s }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    res.json({
      success: true,
      stats: { total, tracking, failed, totalViews, totalLikes, totalComments, avgEngagement },
      topCreators,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── GET /api/reels/:id ────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const reel = await Reel.findOne({ _id: req.params.id, addedBy: req.user._id });
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, reel });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── POST /api/reels/:id/refresh ───────────────────────────── */
router.post('/:id/refresh', async (req, res) => {
  try {
    const filter = ['admin', 'superadmin'].includes(req.user.role) ? { _id: req.params.id } : { _id: req.params.id, addedBy: req.user._id };
    const reel = await Reel.findOne(filter);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    reel.status = 'fetching';
    reel.fetchAttempts += 1;
    await reel.save();

    try {
      const data = await scrapeReel(reel.shortcode);
      
      let velocity = 0;
      if (reel.history.length > 0) {
        const last = reel.history[reel.history.length - 1];
        const hrs = (Date.now() - new Date(last.capturedAt).getTime()) / 3600000;
        const gained = Math.max(0, data.views - last.views);
        velocity = hrs > 0 ? Math.round(gained / hrs) : 0;
      }

      reel.history.push({
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        engagement: data.engagement,
        capturedAt: new Date(),
      });
      if (reel.history.length > 500) reel.history.shift();

      reel.views = data.views;
      reel.likes = data.likes;
      reel.comments = data.comments;
      reel.engagement = data.engagement;
      reel.velocity = velocity;
      reel.dataSource = data.source;
      reel.status = 'tracking';
      reel.failReason = '';
      reel.lastFetchedAt = new Date();
      if (data.username && !reel.username) reel.username = data.username;
      if (data.fullName && !reel.fullName) reel.fullName = data.fullName;
      if (data.caption && !reel.caption) reel.caption = data.caption;
      if (data.thumbnail && !reel.thumbnail) reel.thumbnail = data.thumbnail;
      if (data.publishedAt && !reel.publishedAt) reel.publishedAt = data.publishedAt;

      reel.scheduleNext();
      await reel.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${reel.addedBy}`).emit('reel:updated', {
          _id: reel._id, views: reel.views, likes: reel.likes,
          comments: reel.comments, engagement: reel.engagement,
          velocity: reel.velocity, status: reel.status,
        });
      }

      res.json({ success: true, message: 'Reel metrics refreshed successfully!', reel });
    } catch (err) {
      reel.status = 'failed';
      reel.failReason = err.message;
      await reel.save();
      res.status(502).json({ success: false, message: `Scraping failed: ${err.message}`, reel });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── DELETE /api/reels/:id ─────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    await Reel.deleteOne({ _id: req.params.id, addedBy: req.user._id });
    res.json({ success: true, message: 'Reel removed' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── DELETE /api/reels/bulk ────────────────────────────────── */
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    await Reel.deleteMany({ _id: { $in: ids }, addedBy: req.user._id });
    res.json({ success: true, message: `${ids.length} reels removed` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── GET /api/reels/campaign/:campaignId ───────────────────
   Admin/Brand sees all reels for a campaign
   Also auto-tracks any untracked submission URLs
─────────────────────────────────────────────────────────── */
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { Campaign } = require('../models/index');
    const { scrapeReel, extractShortcode } = require('../services/reelScraper');

    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ success:false, message:'Campaign not found' });

    const isBrand = campaign.brand.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isBrand && !isAdmin)
      return res.status(403).json({ success:false, message:'Access denied' });

    // Auto-track any submitted Instagram URLs not yet tracked
    const assigned = campaign.assignedCreators || [];
    for (const a of assigned) {
      if (!a.submissionUrl) continue;
      if (!/instagram\.com\/(reel|p|tv)\//i.test(a.submissionUrl)) continue;
      const shortcode = extractShortcode(a.submissionUrl);
      if (!shortcode) continue;
      const exists = await Reel.findOne({ shortcode });
      if (!exists) {
        try {
          const data = await scrapeReel(shortcode);
          await Reel.create({
            url:         `https://www.instagram.com/reel/${shortcode}/`,
            shortcode,
            addedBy:     a.creator,
            campaignId:  req.params.campaignId,
            status:      'tracking',
            views:       data.views,
            likes:       data.likes,
            comments:    data.comments,
            engagement:  data.engagement,
            username:    data.username    || '',
            caption:     data.caption     || '',
            thumbnail:   data.thumbnail   || '',
            publishedAt: data.publishedAt || null,
            dataSource:  data.source,
            lastFetchedAt: new Date(),
            history: [{ views: data.views, likes: data.likes, comments: data.comments, engagement: data.engagement }],
          });
          console.log(`[CampaignReels] Auto-tracked ${shortcode} for campaign ${req.params.campaignId}`);
        } catch(e) {
          console.error('[CampaignReels] Auto-track failed:', e.message);
          // Still create reel with 0s so it shows up in UI
          await Reel.create({
            url:        `https://www.instagram.com/reel/${shortcode}/`,
            shortcode,
            addedBy:    a.creator,
            campaignId: req.params.campaignId,
            status:     'failed',
            failReason: e.message,
            dataSource: 'unknown',
          }).catch(() => {});
        }
      } else if (!exists.campaignId) {
        exists.campaignId = req.params.campaignId;
        await exists.save();
      }
    }

    // Now fetch all linked reels
    const reels = await Reel.find({ campaignId: req.params.campaignId })
      .select('-history')
      .populate('addedBy', 'displayName avatar handle');

    const totalViews    = reels.reduce((a, r) => a + r.views,    0);
    const totalLikes    = reels.reduce((a, r) => a + r.likes,    0);
    const totalComments = reels.reduce((a, r) => a + r.comments, 0);
    const avgEngagement = reels.length
      ? parseFloat((reels.reduce((a, r) => a + r.engagement, 0) / reels.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      reels,
      summary: { totalViews, totalLikes, totalComments, avgEngagement, totalReels: reels.length },
    });
  } catch (e) {
    res.status(500).json({ success:false, message: e.message });
  }
});

module.exports = router;
