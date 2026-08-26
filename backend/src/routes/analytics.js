// ─────────────────────────────────────────────────────────
// routes/analytics.js  —  Analytics + Creator Social Connect
// ─────────────────────────────────────────────────────────
const express = require('express');
const { Campaign, User, Notification } = require('../models');
const { auth } = require('../middleware/auth');
const { computeScore, getRank, computeCAS } = require('../services/scoring');
const { fetchSocialData } = require('../services/socialFetcher');

const router = express.Router();
router.use(auth);

/* ── GET /api/analytics/brand ────────────────────────── */
router.get('/brand', async (req, res) => {
  try {
    if (!['brand','admin'].includes(req.user.role))
      return res.status(403).json({ success:false, message:'Brand only' });
    const campaigns = await Campaign.find({ brand:req.user._id });
    const totalSpent = campaigns.reduce((s,c)=>s+c.budget,0);
    const active = campaigns.filter(c=>['in_progress','creators_assigned'].includes(c.workflowStatus)).length;
    const completed = campaigns.filter(c=>c.workflowStatus==='completed').length;
    const totalCreators = campaigns.reduce((s,c)=>s+(c.assignedCreators?.length||0),0);
    const nicheMap = {};
    campaigns.forEach(c=>{ nicheMap[c.niche]=(nicheMap[c.niche]||0)+1; });
    const nicheBreakdown = Object.entries(nicheMap).map(([niche,count])=>({ niche,count })).sort((a,b)=>b.count-a.count);
    const trend = [];
    for (let i=5;i>=0;i--) {
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const m=d.toLocaleString('default',{month:'short'});
      const count=campaigns.filter(c=>{const cd=new Date(c.createdAt);return cd.getMonth()===d.getMonth()&&cd.getFullYear()===d.getFullYear();}).length;
      trend.push({ month:m, campaigns:count });
    }
    res.json({ success:true, stats:{ totalCampaigns:campaigns.length,active,completed,totalSpent,totalCreators }, nicheBreakdown, trend });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── GET /api/analytics/creator ─────────────────────── */
router.get('/creator', async (req, res) => {
  try {
    if (req.user.role !== 'creator') return res.status(403).json({ success: false, message: 'Creators only' });
    const campaigns = await Campaign.find({ 'assignedCreators.creator': req.user._id });
    const myData = campaigns.map(c => ({
      title: c.title, niche: c.niche, budget: c.budget, workflowStatus: c.workflowStatus,
      createdAt: c.createdAt,
      assignment: c.assignedCreators.find(a => a.creator?.toString() === req.user._id.toString()),
    }));
    const completed = myData.filter(c => ['approved', 'completed'].includes(c.assignment?.status));
    const earned = completed.reduce((s, c) => s + (c.assignment?.paymentAlloc || 0), 0);
    const pending = myData.filter(c => ['assigned', 'accepted', 'in_progress', 'submitted'].includes(c.assignment?.status));

    // Live Month-over-Month Trend Calculations
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthCampaigns = campaigns.filter(c => new Date(c.createdAt) >= startOfThisMonth).length;
    const lastMonthCampaigns = campaigns.filter(c => {
      const d = new Date(c.createdAt);
      return d >= startOfLastMonth && d < startOfThisMonth;
    }).length;
    const totalTrendPct = lastMonthCampaigns > 0
      ? Math.round(((thisMonthCampaigns - lastMonthCampaigns) / lastMonthCampaigns) * 100)
      : (thisMonthCampaigns > 0 ? 100 : 0);

    const completedThisMonth = myData.filter(c => ['approved', 'completed'].includes(c.assignment?.status) && new Date(c.assignment?.updatedAt || c.createdAt) >= startOfThisMonth).length;
    const completedLastMonth = myData.filter(c => {
      const status = c.assignment?.status;
      const d = new Date(c.assignment?.updatedAt || c.createdAt);
      return ['approved', 'completed'].includes(status) && d >= startOfLastMonth && d < startOfThisMonth;
    }).length;
    const completedTrendPct = completedLastMonth > 0
      ? Math.round(((completedThisMonth - completedLastMonth) / completedLastMonth) * 100)
      : (completedThisMonth > 0 ? 100 : 0);

    const earnedThisMonth = myData
      .filter(c => ['approved', 'completed'].includes(c.assignment?.status) && new Date(c.assignment?.updatedAt || c.createdAt) >= startOfThisMonth)
      .reduce((s, c) => s + (c.assignment?.paymentAlloc || 0), 0);
    const earnedLastMonth = myData
      .filter(c => {
        const status = c.assignment?.status;
        const d = new Date(c.assignment?.updatedAt || c.createdAt);
        return ['approved', 'completed'].includes(status) && d >= startOfLastMonth && d < startOfThisMonth;
      })
      .reduce((s, c) => s + (c.assignment?.paymentAlloc || 0), 0);
    const earnedTrendPct = earnedLastMonth > 0
      ? Math.round(((earnedThisMonth - earnedLastMonth) / earnedLastMonth) * 100)
      : (earnedThisMonth > 0 ? 100 : 0);

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const m = d.toLocaleString('default', { month: 'short' });
      const count = campaigns.filter(c => { const cd = new Date(c.createdAt); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).length;
      trend.push({ month: m, assignments: count });
    }
    res.json({
      success: true,
      stats: {
        total: campaigns.length,
        completed: completed.length,
        pending: pending.length,
        earned,
        successRate: campaigns.length ? Math.round((completed.length / campaigns.length) * 100) : 100,
        totalTrendPct,
        completedTrendPct,
        earnedTrendPct
      },
      campaigns: myData,
      trend
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── POST /api/analytics/creator/connect ─────────────── */
/* Creator submits social URLs → system auto-fetches data, calculates CAS, saves, submits for admin approval */
router.post('/creator/connect', async (req, res) => {
  try {
    if (req.user.role!=='creator')
      return res.status(403).json({ success:false, message:'Creators only' });

    let { instagramUrl='', youtubeUrl='' } = req.body;
    if (!instagramUrl && !youtubeUrl) {
      instagramUrl = req.user.socialUrls?.instagram || (req.user.handle ? `https://instagram.com/${req.user.handle}` : '');
      youtubeUrl = req.user.socialUrls?.youtube || '';
    }
    if (!instagramUrl && !youtubeUrl)
      return res.status(400).json({ success:false, message:'Provide at least one social URL or Instagram handle.' });

    // 0. Enforce 30-day re-fetch limit for non-admin users
    const isSystemAdmin = req.user.role === 'admin' || req.user.role === 'superadmin' || (req.user.roles && (req.user.roles.includes('admin') || req.user.roles.includes('superadmin')));
    const lastFetch = req.user.lastSocialRefetchAt || req.user.analyzedAt;

    if (!isSystemAdmin && lastFetch) {
      const now = new Date();
      const timeDiffMs = now.getTime() - new Date(lastFetch).getTime();
      const daysPassed = timeDiffMs / (1000 * 60 * 60 * 24);
      if (daysPassed < 30) {
        const daysRemaining = Math.ceil(30 - daysPassed);
        return res.status(429).json({
          success: false,
          code: 'REFETCH_COOLDOWN_ACTIVE',
          daysRemaining,
          message: `Instagram profile re-fetch can only be performed once every 30 days. You can re-fetch again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
        });
      }
    }

    // 1. Fetch live social data
    const { igData, ytData } = await fetchSocialData(instagramUrl||null, youtubeUrl||null);
    if (!igData && !ytData)
      return res.status(502).json({ success:false, message:'Could not fetch data. Check URLs and try again.' });

    // 2. Compute CAS score
    const niche = req.user.niche || '';
    const casResult = computeCAS({ igData, ytData, niche });

    // 3. Update platform follower counts from real data (feeds existing score engine)
    const platformUpdate = {};
    if (igData) {
      const igER = igData.er || 0;
      platformUpdate['platforms.instagram.followers']  = igData.followers;
      platformUpdate['platforms.instagram.engagement'] = parseFloat(igER.toFixed(2));
    }
    if (ytData) {
      const ytER = ytData.er || 0;
      platformUpdate['platforms.youtube.followers']  = ytData.followers;
      platformUpdate['platforms.youtube.engagement'] = parseFloat(ytER.toFixed(2));
    }

    // 4. Compute updated 1000-pt score using new platform data
    const userCopy = req.user.toObject();
    if (igData) { userCopy.platforms.instagram.followers=igData.followers; userCopy.platforms.instagram.engagement=igData.er||0; }
    if (ytData) { userCopy.platforms.youtube.followers=ytData.followers;   userCopy.platforms.youtube.engagement=ytData.er||0;   }
    const { total, dna } = computeScore(userCopy);
    const rank = getRank(total);

    // 5. Persist everything
    await User.findByIdAndUpdate(req.user._id, {
      ...platformUpdate,
      'socialUrls.instagram': instagramUrl,
      'socialUrls.youtube':   youtubeUrl,
      casScore:      casResult.cas,
      casBreakdown:  casResult.scores,
      casRisk:       casResult.riskLevel,
      casBadge:      casResult.badge,
      socialAnalyzed:true,
      analyzedAt:          new Date(),
      lastSocialRefetchAt: new Date(),
      // Auto-approve elite creators; otherwise set to pending
      verificationStatus: casResult.autoApprove ? 'approved' : 'pending',
      isVerified:    casResult.autoApprove ? true : req.user.isVerified,
      creatorScore:  total,
      dna,
      rank,
    });

    // 6. Notify admins if not auto-approved
    if (!casResult.autoApprove) {
      const admins = await User.find({ role:'admin' }).select('_id');
      await Promise.all(admins.map(a =>
        Notification.create({ user:a._id, type:'creator_approval',
          title:'🆕 Creator Pending Approval', body:`${req.user.displayName} submitted for verification. CAS: ${casResult.cas}/100, Risk: ${casResult.riskLevel}`,
          link:'/admin/creator-approval' })
      ));
    }

    return res.json({
      success: true,
      cas:        casResult.cas,
      scores:     casResult.scores,
      riskLevel:  casResult.riskLevel,
      badge:      casResult.badge,
      autoApprove:casResult.autoApprove,
      creatorScore: total,
      rank,
      igData,
      ytData,
      message: casResult.autoApprove
        ? '🎉 Auto-approved! Your CAS score qualifies you for immediate access.'
        : '✅ Analysis done! Your profile is pending admin review.',
    });
  } catch(e) {
    console.error('[Creator Connect]', e);
    res.status(500).json({ success:false, message:e.message||'Analysis failed' });
  }
});

/* ── GET /api/analytics/creator/cas ─────────────────── */
/* Creator fetches their own CAS data */
router.get('/creator/cas', async (req, res) => {
  try {
    if (req.user.role!=='creator') return res.status(403).json({ success:false, message:'Creators only' });
    const user = await User.findById(req.user._id).select('casScore casBreakdown casRisk casBadge socialAnalyzed analyzedAt lastSocialRefetchAt verificationStatus socialUrls creatorScore rank platforms');
    return res.json({ success:true, ...user.toObject() });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── POST /api/analytics/analyze  ────────────────────────
   Brand/Admin: analyze ANY creator by Instagram or YouTube URL.
   Uses the existing fetchSocialData + computeCAS pipeline.
   No login required for the fetched creator — public data only.
─────────────────────────────────────────────────────────── */
router.post('/analyze', async (req, res) => {
  try {
    if (!['brand','admin'].includes(req.user.role))
      return res.status(403).json({ success:false, message:'Brand or Admin only' });

    const { instagramUrl='', youtubeUrl='' } = req.body;
    if (!instagramUrl && !youtubeUrl)
      return res.status(400).json({ success:false, message:'Provide at least one social URL.' });

    // Fetch live public data
    const { igData, ytData } = await fetchSocialData(
      instagramUrl || null,
      youtubeUrl   || null
    );

    if (!igData && !ytData)
      return res.status(502).json({
        success: false,
        message: 'Could not fetch public data. Check the URL and try again.',
      });

    // Compute CAS using the same engine as creator self-analysis
    const niche = req.body.niche || '';
    const casResult = computeCAS({ igData, ytData, niche });

    // Build a unified profile summary
    const isEstimated = igData?._isEstimated || false;
    const profile = {
      username:     igData?.username     || ytData?.channelTitle || 'Unknown',
      platform:     igData && ytData ? 'both' : igData ? 'instagram' : 'youtube',
      thumbnail:    igData?.profilePic   || igData?.thumbnail    || ytData?.thumbnail    || '',
      followers:    igData?.followers    || ytData?.subscribers  || 0,
      avgViews:     igData?.avgViews     || ytData?.avgViews     || 0,
      avgLikes:     igData?.avgLikes     || ytData?.avgLikes     || 0,
      avgComments:  igData?.avgComments  || ytData?.avgComments  || 0,
      er:           igData?.er           || ytData?.er           || 0,
      postsPerWeek: igData?.postsPerWeek || ytData?.postsPerWeek || 0,
      totalPosts:   igData?.totalPosts   || ytData?.totalVideos  || 0,
      isReal:       !isEstimated,
      isEstimated,
      biography:    igData?.biography    || '',
      followingCount: igData?.followingCount || igData?.following || 0,
      igData, ytData,
    };

    return res.json({
      success: true,
      profile,
      cas:        casResult.cas,
      scores:     casResult.scores,
      riskLevel:  casResult.riskLevel,
      badge:      casResult.badge,
      autoApprove:casResult.autoApprove,
      isEstimated,
    });
  } catch(e) {
    console.error('[Analyze Creator]', e);
    res.status(500).json({ success:false, message: e.message || 'Analysis failed' });
  }
});

/* ── GET /api/analytics/analyze/registered  ──────────────
   Brand/Admin: fetch CAS data of registered creators for comparison.
─────────────────────────────────────────────────────────── */
router.get('/analyze/registered', async (req, res) => {
  try {
    if (!['brand','admin'].includes(req.user.role))
      return res.status(403).json({ success:false, message:'Brand or Admin only' });

    const { niche='', minCAS=0, limit=20 } = req.query;
    const filter = { role:'creator', socialAnalyzed:true };
    if (niche) filter.niche = new RegExp(niche,'i');
    if (+minCAS > 0) filter.casScore = { $gte: +minCAS };

    const creators = await User.find(filter)
      .select('displayName handle avatar niche casScore casBadge casRisk casBreakdown platforms verificationStatus totalCampaigns completedCampaigns creatorScore rank')
      .sort({ casScore:-1 })
      .limit(+limit);

    return res.json({ success:true, creators });
  } catch(e) {
    res.status(500).json({ success:false, message:e.message });
  }
});

/* ── POST /api/analytics/creator/request-reanalysis ──────
   Creator requests admin to re-analyze their social profile.
   No re-fetch happens here — just sends a notification to all admins.
─────────────────────────────────────────────────────────── */
router.post('/creator/request-reanalysis', auth, async (req, res) => {
  try {
    if (req.user.role !== 'creator')
      return res.status(403).json({ success:false, message:'Creators only' });

    if (!req.user.socialAnalyzed)
      return res.status(400).json({ success:false, message:'Submit your social profile first before requesting re-analysis.' });

    // Notify all admins
    const admins = await User.find({ role:'admin' }).select('_id');
    await Promise.all(admins.map(a =>
      Notification.create({
        user:  a._id,
        type:  'creator_approval',
        title: '🔄 Re-analysis Requested',
        body:  `${req.user.displayName} has requested a re-analysis of their social profile. Current CAS: ${req.user.casScore || 0}/100.`,
        link:  '/admin/creator-approval',
      })
    ));

    return res.json({ success:true, message:'Re-analysis request sent to admin.' });
  } catch(e) {
    console.error('[Request Reanalysis]', e);
    res.status(500).json({ success:false, message:e.message || 'Request failed' });
  }
});

module.exports = router;
