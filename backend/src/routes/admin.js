const express = require('express');
const { Campaign, User, Notification, Transaction, FeedEvent, InternalNote, AuditLog, Task } = require('../models');
const { auth, adminOnly, teamOrAdmin, audit, getUserRoles } = require('../middleware/auth');
const { computeScore, getRank } = require('../services/scoring');
const {
  sendCreatorApprovedMail, sendCreatorRejectedMail,
  sendCampaignAssignedMail, sendRoleChangeMail, sendBroadcastMail,
} = require('../utils/sendEmail');

const router = express.Router();

// ✅ FIX: Use teamOrAdmin at router level so team members can access read routes
// Sensitive mutation routes have explicit adminOnly guards below
router.use(auth, teamOrAdmin);

const notify = async (uid, type, title, body, link = '') => {
  try { await Notification.create({ user: uid, type, title, body, link }); } catch (e) { }
};
const feed = async (eventType, actor, message, meta = {}) => {
  try { await FeedEvent.create({ eventType, actor, message, metadata: meta, visibleTo: 'team' }); } catch (e) { }
};

/* ══════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════ */
router.get('/dashboard', adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalCreators, totalBrands, totalTeam, totalCampaigns, pendingCampaigns, activeCampaigns, activeTasks, completedTasks, overdueTasks] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'brand' }, { roles: 'brand' }], isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'team_member' }, { roles: 'team_member' }], isDeleted: { $ne: true } }),
      Campaign.countDocuments({ isDeleted: { $ne: true } }),
      Campaign.countDocuments({ workflowStatus: { $in: ['brand_submitted', 'admin_review'] }, isDeleted: { $ne: true } }),
      Campaign.countDocuments({ workflowStatus: { $in: ['in_progress', 'creators_assigned'] }, isDeleted: { $ne: true } }),
      Task.countDocuments({ status: { $ne: 'done' }, isArchived: false, isDeleted: { $ne: true } }),
      Task.countDocuments({ status: 'done', isArchived: false, isDeleted: { $ne: true } }),
      Task.countDocuments({ status: { $ne: 'done' }, dueDate: { $lt: new Date() }, isArchived: false, isDeleted: { $ne: true } }),
    ]);
    const [recentCampaigns, recentUsers, txTotal] = await Promise.all([
      Campaign.find({ workflowStatus: { $in: ['brand_submitted', 'admin_review', 'creators_assigned', 'in_progress'] }, isDeleted: { $ne: true } }).populate('brand', 'displayName companyName avatar').sort({ createdAt: -1 }).limit(8).lean(),
      User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(8).select('displayName role roles niche createdAt avatar rank creatorScore').lean(),
      Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({ success: true, stats: { totalUsers, totalCreators, totalBrands, totalTeam, totalCampaigns, pendingCampaigns, activeCampaigns, activeTasks, completedTasks, overdueTasks, totalRevenue: txTotal[0]?.total || 0 }, recentCampaigns, recentUsers });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   USERS — admin only for mutations
   ══════════════════════════════════════════════════════ */
router.get('/users', adminOnly, async (req, res) => {
  try {
    const { role, search, niche, verified, page = 1, limit = 20, sort = 'newest' } = req.query;
    let q = { isDeleted: { $ne: true } };

    if (role) { q.$or = [{ role }, { roles: role }]; }

    if (niche) { q.niche = niche; }

    if (verified !== undefined && verified !== '') {
      q.isVerified = verified === 'true';
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchClause = {
        $or: [
          { displayName: searchRegex },
          { email: searchRegex }
        ]
      };
      if (q.$or) {
        q.$and = [
          { $or: q.$or },
          searchClause
        ];
        delete q.$or;
      } else {
        q.$or = searchClause.$or;
      }
    }

    const sortMap = { newest: { createdAt: -1 }, score: { creatorScore: -1 }, name: { displayName: 1 } };
    const [users, total] = await Promise.all([
      User.find(q).select('-password -refreshToken').sort(sortMap[sort] || sortMap.newest).skip((+page - 1) * +limit).limit(+limit),
      User.countDocuments(q),
    ]);
    res.json({ success: true, users, total, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /api/admin/creators/export-excel — export creators to CSV/Excel */
router.get('/creators/export-excel', async (req, res) => {
  try {
    const { city, niche, language, isUgcCreator, isOnCamera, availabilityStatus, search } = req.query;
    let q = { $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } };

    if (city) q.city = { $regex: city, $options: 'i' };
    if (niche) q.niche = niche;
    if (language) q.languages = { $in: [language] };
    if (isUgcCreator !== undefined && isUgcCreator !== '') q.isUgcCreator = isUgcCreator === 'true';
    if (isOnCamera !== undefined && isOnCamera !== '') q.isOnCamera = isOnCamera === 'true';
    if (availabilityStatus) q.availabilityStatus = availabilityStatus;

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      q.$and = [
        { $or: [{ displayName: searchRegex }, { email: searchRegex }, { handle: searchRegex }, { city: searchRegex }] }
      ];
    }

    const creators = await User.find(q).select('-password -refreshToken').sort({ createdAt: -1 });

    const headers = [
      'ID', 'Name', 'Email', 'Instagram Handle/URL', 'City', 'Niche', 'Followers',
      'Average Views', 'Engagement Rate (%)', 'Languages', 'UGC Creator', 'On-Camera',
      'Audience Location', 'Commercial Rate (INR)', 'Availability', 'Previous Campaigns',
      'Reliability Score', 'Verification Status', 'Created Date'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = creators.map(c => [
      escapeCsv(c._id),
      escapeCsv(c.displayName),
      escapeCsv(c.email),
      escapeCsv(c.instagramUrl || c.socialUrls?.instagram || (c.handle ? `@${c.handle}` : '')),
      escapeCsv(c.city || c.location || '—'),
      escapeCsv(c.niche || 'General'),
      c.platforms?.instagram?.followers || c.followers || 0,
      c.avgViews || 0,
      c.platforms?.instagram?.engagement || c.engagementRate || 0,
      escapeCsv(Array.isArray(c.languages) ? c.languages.join(', ') : (c.languages || 'English')),
      c.isUgcCreator ? 'Yes' : 'No',
      c.isOnCamera ? 'Yes' : 'No',
      escapeCsv(c.audienceLocation || 'India'),
      c.commercialRate || 0,
      escapeCsv(c.availabilityStatus || 'Available'),
      c.previousCampaignsCount || c.completedCampaigns || 0,
      c.reliabilityScore || 90,
      escapeCsv(c.isVerified ? 'Verified' : (c.verificationStatus || 'Registered')),
      escapeCsv(new Date(c.createdAt).toLocaleDateString('en-IN'))
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=creators_export_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (e) {
    console.error('Export Creators Excel Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/users/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken').populate('assignedTeamMember', 'displayName email avatar');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const [campaigns, notes] = await Promise.all([
      Campaign.find({ 'assignedCreators.creator': user._id }).select('title budget workflowStatus deadline').limit(10),
      InternalNote.find({ about: user._id, isDeleted: { $ne: true } }).populate('author', 'displayName avatar').sort({ createdAt: -1 }).limit(20),
    ]);
    res.json({ success: true, user, campaigns, notes });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/users/:id', adminOnly, async (req, res) => {
  try {
    const allowed = ['isVerified', 'isBanned', 'banReason', 'role', 'niche', 'companyName', 'displayName',
      'crmStatus', 'brandCrmStatus', 'assignedTeamMember', 'lastContactDate', 'meetingNotes', 'followUpDate',
      'teamDepartment', 'teamTitle', 'availability', 'nextFollowUpDate', 'followUpNotes'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password -refreshToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await audit(req, 'USER_UPDATED', 'user', { updated: Object.keys(update) }, 'low', user._id, `User:${user._id}`);
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── POST /api/admin/users/:id/sync-social — admin re-sync creator social data ── */
router.post('/users/:id/sync-social', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const targetIg = user.socialUrls?.instagram || user.instagramUrl || (user.handle ? `https://instagram.com/${user.handle}` : null);
    const targetYt = user.socialUrls?.youtube || user.youtubeUrl || null;

    if (!targetIg && !targetYt) {
      return res.status(400).json({ success: false, message: 'No social profile URL or Instagram handle found for this creator.' });
    }

    const { fetchSocialData } = require('../services/socialFetcher');
    const { computeCAS, computeScore, getRank } = require('../services/scoring');

    const { igData, ytData } = await fetchSocialData(targetIg, targetYt);

    if (!igData && !ytData) {
      return res.status(502).json({ success: false, message: 'Could not fetch live social data. Profile may be private or API limited.' });
    }

    const casResult = computeCAS({ igData, ytData, niche: user.niche || '' });

    const platformUpdate = {};
    if (igData) {
      platformUpdate['platforms.instagram.followers'] = igData.followers;
      platformUpdate['platforms.instagram.engagement'] = parseFloat((igData.er || 0).toFixed(2));
      if (igData.avatar) platformUpdate['avatar'] = igData.avatar;
      if (igData.bio) platformUpdate['bio'] = igData.bio;
    }
    if (ytData) {
      platformUpdate['platforms.youtube.followers'] = ytData.followers;
      platformUpdate['platforms.youtube.engagement'] = parseFloat((ytData.er || 0).toFixed(2));
    }

    const userObj = user.toObject();
    if (igData) {
      userObj.platforms = userObj.platforms || {};
      userObj.platforms.instagram = { followers: igData.followers, engagement: igData.er || 0 };
    }
    if (ytData) {
      userObj.platforms = userObj.platforms || {};
      userObj.platforms.youtube = { followers: ytData.followers, engagement: ytData.er || 0 };
    }

    const { total, dna } = computeScore(userObj);
    const rank = getRank(total);

    const updatedUser = await User.findByIdAndUpdate(user._id, {
      ...platformUpdate,
      casScore: casResult.cas,
      casBreakdown: casResult.scores,
      casRisk: casResult.riskLevel,
      casBadge: casResult.badge,
      socialAnalyzed: true,
      analyzedAt: new Date(),
      creatorScore: total,
      dna,
      rank
    }, { new: true }).select('-password -refreshToken');

    res.json({ success: true, message: 'Social profile re-synced successfully!', user: updatedUser });
  } catch (e) {
    console.error('[Admin Sync Social Error]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Role Promotion — admin only ──────────────────────── */
router.post('/users/:id/promote', adminOnly, async (req, res) => {
  try {
    const { addRole, removeRole } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    let roles = getUserRoles(user);

    if (addRole) {
      if (!['creator', 'brand', 'team_member', 'admin'].includes(addRole))
        return res.status(400).json({ success: false, message: 'Invalid role. Allowed: creator, brand, team_member, admin' });
      if (addRole === 'admin' && !getUserRoles(req.user).includes('superadmin'))
        return res.status(403).json({ success: false, message: 'Only SuperAdmin can promote to Admin' });
      if (!roles.includes(addRole)) roles.push(addRole);
    }
    if (removeRole) {
      roles = roles.filter(r => r !== removeRole);
      if (roles.length === 0) roles = ['creator'];
    }

    const primaryRole = roles.includes('superadmin') ? 'superadmin' : roles.includes('admin') ? 'admin' : roles.includes('team_member') ? 'team_member' : roles.includes('brand') ? 'brand' : 'creator';
    await User.findByIdAndUpdate(user._id, { roles, role: primaryRole, ...(addRole && { promotedBy: req.user._id, promotedAt: new Date() }) });
    const updated = await User.findById(user._id).select('-password -refreshToken');

    if (addRole) {
      await notify(user._id, 'role_change', '🎉 Role Updated', `You have been granted ${addRole} access on CreatoKite.`);
      await sendRoleChangeMail(user.email, user.displayName, addRole).catch(() => { });
      await feed('creator_promoted', req.user._id, `${user.displayName} promoted to ${addRole}`, { userId: user._id });
    }
    await audit(req, addRole ? 'ROLE_PROMOTED' : 'ROLE_REMOVED', 'role', { role: addRole || removeRole }, 'medium', user._id, `User:${user._id}`);

    // Emit real-time update via socket so the user sees it instantly without re-login
    const io = req.app.get('io');
    if (io && addRole) {
      io.to(`user:${user._id}`).emit('role_updated', { roles, role: primaryRole });
    }

    res.json({ success: true, user: updated, message: `Role ${addRole ? 'added' : 'removed'} successfully` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── View As ─────────────────────────────────────────── */
router.post('/users/:id/view-as', adminOnly, async (req, res) => {
  try {
    const target = await User.findById(req.params.id).select('-password -refreshToken');
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    await audit(req, 'VIEW_AS_USER', 'user', { targetId: target._id }, 'medium', target._id, `User:${target._id}`);
    res.json({ success: true, targetUser: target });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/users/:id/recalculate', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { total, dna } = computeScore(user);
    user.creatorScore = total; user.dna = dna; user.rank = getRank(total);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, score: total, rank: user.rank });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   CAMPAIGNS — team members can READ, admin can mutate
   ══════════════════════════════════════════════════════ */
router.get('/campaigns', async (req, res) => {
  try {
    const { status, workflowStatus, page = 1, limit = 15, search } = req.query;
    const isAdmin = getUserRoles(req.user).some(r => ['admin', 'superadmin'].includes(r));
    const q = { isDeleted: { $ne: true } };

    // ✅ FIX: Team members only see campaigns assigned to them
    if (!isAdmin) {
      q.assignedTeamMembers = req.user._id;
    }

    if (status) q.status = status;
    if (workflowStatus) q.workflowStatus = workflowStatus;
    if (search) q.title = { $regex: search, $options: 'i' };

    const [campaigns, total] = await Promise.all([
      Campaign.find(q)
        .populate('brand', 'displayName companyName avatar')
        .populate('assignedCreators.creator', 'displayName avatar handle niche creatorScore rank')
        .populate('assignedTeamMembers', 'displayName avatar role')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Campaign.countDocuments(q),
    ]);
    res.json({ success: true, campaigns, total, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/campaigns/pending', adminOnly, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ workflowStatus: { $in: ['brand_submitted', 'admin_review'] }, isDeleted: { $ne: true } }).populate('brand', 'displayName companyName avatar isVerified').sort({ isPremium: -1, createdAt: 1 }).limit(30);
    res.json({ success: true, campaigns });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* GET /admin/campaigns/:id — single campaign detail (admin + team) */
router.get('/campaigns/:id', async (req, res) => {
  try {
    const isAdmin = getUserRoles(req.user).some(r => ['admin', 'superadmin'].includes(r));
    const q = { _id: req.params.id, isDeleted: { $ne: true } };
    if (!isAdmin) q.assignedTeamMembers = req.user._id;

    const campaign = await Campaign.findOne(q)
      .populate('brand', 'displayName companyName avatar isVerified industry email')
      .populate('assignedCreators.creator', 'displayName avatar handle niche creatorScore rank platforms trustScore')
      .populate('assignedTeamMembers', 'displayName avatar role teamTitle')
      .populate('campaignOwner', 'displayName avatar')
      .populate('campaignManager', 'displayName avatar')
      .populate('adminReviewedBy', 'displayName avatar');

    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, campaign });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/campaigns/:id', adminOnly, async (req, res) => {
  try {
    const allowed = ['workflowStatus', 'status', 'adminReviewNote', 'isPremium', 'featured', 'campaignOwner', 'campaignManager', 'assignedTeamMembers'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    if (update.workflowStatus) { update.adminReviewedAt = new Date(); update.adminReviewedBy = req.user._id; }
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, update, { new: true }).populate('brand', 'displayName companyName email');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (update.workflowStatus === 'creators_assigned') {
      await notify(campaign.brand, 'campaign_approved', '✅ Campaign Approved', `Your campaign "${campaign.title}" has been approved!`, `/brand/campaigns/${campaign._id}`);
      await feed('campaign_approved', req.user._id, `Campaign "${campaign.title}" approved`, { campaignId: campaign._id });
    }
    // Notify assigned team members
    if (update.assignedTeamMembers?.length) {
      for (const tmId of update.assignedTeamMembers) {
        await notify(tmId, 'campaign_assigned', '📋 Campaign Assigned to You', `You have been assigned to manage "${campaign.title}"`, `/admin/campaigns`);
      }
    }
    await audit(req, 'CAMPAIGN_UPDATED', 'campaign', { updated: Object.keys(update) }, 'low', null, `Campaign:${campaign._id}`);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.to(`campaign:${campaign._id}`).emit('campaign_updated', { campaignId: campaign._id, update });

    res.json({ success: true, campaign });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/campaigns/:id/analyze', adminOnly, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    const creators = await User.find({ $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'approved', isVerified: true, isDeleted: { $ne: true } }).select('displayName niche creatorScore rank platforms trustScore').limit(200);
    const scored = creators.map(c => {
      let score = 0;
      if (c.niche && campaign.niche && c.niche.toLowerCase() === campaign.niche.toLowerCase()) score += 40;
      score += Math.min(30, (c.creatorScore / 1000) * 30);
      score += Math.min(20, (c.trustScore?.overall || 70) / 100 * 20);
      const tf = Object.values(c.platforms || {}).reduce((s, p) => s + (p.followers || 0), 0);
      score += Math.min(10, (tf / 100000) * 10);
      return { creator: c._id, matchScore: Math.round(score), reason: `Niche match + Score ${c.creatorScore}` };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    await Campaign.findByIdAndUpdate(req.params.id, {
      aiAnalysis: { analyzed: true, analyzedAt: new Date(), predictedReach: campaign.budget * 12, predictedROI: 2.4, estimatedEngagement: Math.round(campaign.budget * 0.48), riskLevel: 'low', confidence: 78, strategyBrief: `AI recommends ${campaign.niche} creators for optimal ROI.` },
      aiSuggestedCreators: scored, workflowStatus: 'ai_analyzing',
    });
    const updated = await Campaign.findById(req.params.id).populate('aiSuggestedCreators.creator', 'displayName avatar niche creatorScore rank');
    res.json({ success: true, campaign: updated, suggestions: scored });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/campaigns/:id/assign', adminOnly, async (req, res) => {
  try {
    const { creatorIds, paymentAllocs = {} } = req.body;
    if (!Array.isArray(creatorIds) || !creatorIds.length) return res.status(400).json({ success: false, message: 'creatorIds array required' });
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    const existing = new Set((campaign.assignedCreators || []).map(a => a.creator?.toString()));
    const toAdd = creatorIds.filter(id => !existing.has(id));
    campaign.assignedCreators.push(...toAdd.map(id => ({ creator: id, assignedAt: new Date(), assignedBy: req.user._id, paymentAlloc: paymentAllocs[id] || Math.floor(campaign.budget / creatorIds.length), aiMatchScore: campaign.aiSuggestedCreators?.find(s => s.creator?.toString() === id)?.matchScore || 0, status: 'assigned' })));
    campaign.workflowStatus = 'creators_assigned';
    campaign.filledSlots = campaign.assignedCreators.length;
    await campaign.save();

    // Auto-create campaign room
    const { CampaignRoom } = require('../models');
    let room = await CampaignRoom.findOne({ campaign: campaign._id });
    if (!room) {
      room = await CampaignRoom.create({ campaign: campaign._id, name: campaign.title, members: [{ user: campaign.brand, role: 'brand' }, { user: req.user._id, role: 'admin' }, ...toAdd.map(id => ({ user: id, role: 'creator' }))] });
      await Campaign.findByIdAndUpdate(campaign._id, { roomId: room._id });
    } else {
      const existIds = new Set(room.members.map(m => m.user?.toString()));
      const nm = toAdd.filter(id => !existIds.has(id)).map(id => ({ user: id, role: 'creator' }));
      if (nm.length) { room.members.push(...nm); await room.save(); }
    }

    // Notify & email creators
    const io = req.app.get('io');
    for (const id of toAdd) {
      await notify(id, 'campaign_assigned', '🎯 Campaign Assigned', `You've been assigned to "${campaign.title}". Check your dashboard!`, `/creator/assigned`);
      if (io) io.to(`user:${id}`).emit('notification', { type: 'campaign_assigned', title: '🎯 Campaign Assigned', body: `You've been assigned to "${campaign.title}"` });
      const creator = await User.findById(id).select('email displayName');
      if (creator?.email) await sendCampaignAssignedMail(creator.email, creator.displayName, campaign.title, campaign.deadline).catch(() => { });
    }

    await feed('creator_submitted', req.user._id, `${toAdd.length} creator(s) assigned to "${campaign.title}"`, { campaignId: campaign._id });
    await audit(req, 'CREATORS_ASSIGNED', 'campaign', { count: toAdd.length }, 'medium', null, `Campaign:${campaign._id}`);
    const updated = await Campaign.findById(campaign._id).populate('assignedCreators.creator', 'displayName avatar niche creatorScore rank');
    res.json({ success: true, campaign: updated, room });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/campaigns/:id/assign/:creatorId', adminOnly, async (req, res) => {
  try {
    const { status, adminNote, revisionNote, paymentAlloc } = req.body;
    const update = {};
    if (status) update['assignedCreators.$.status'] = status;
    if (adminNote) update['assignedCreators.$.adminNote'] = adminNote;
    if (revisionNote) update['assignedCreators.$.revisionNote'] = revisionNote;
    if (paymentAlloc) update['assignedCreators.$.paymentAlloc'] = paymentAlloc;
    if (status === 'completed') update['assignedCreators.$.completedAt'] = new Date();
    const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id, 'assignedCreators.creator': req.params.creatorId }, { $set: update }, { new: true });
    if (!campaign) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (status) {
      const msg = status === 'approved' ? `Your submission for "${campaign.title}" was approved! 🎉` : status === 'revision' ? `Revision requested for "${campaign.title}": ${revisionNote || ''}` : status === 'completed' ? `Campaign "${campaign.title}" marked complete.` : `Assignment status: ${status}`;
      await notify(req.params.creatorId, 'assignment_update', '📋 Assignment Update', msg, `/creator/assigned`);
      const io = req.app.get('io');
      if (io) io.to(`user:${req.params.creatorId}`).emit('notification', { type: 'assignment_update', title: '📋 Assignment Update', body: msg });
    }
    await audit(req, 'ASSIGNMENT_UPDATED', 'campaign', { status, creatorId: req.params.creatorId }, 'low', null, `Campaign:${campaign._id}`);
    res.json({ success: true, campaign });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── Remove creator from campaign ──────────────────── */
router.delete('/campaigns/:id/assign/:creatorId', adminOnly, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $pull: { assignedCreators: { creator: req.params.creatorId } } },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    campaign.filledSlots = campaign.assignedCreators.length;
    await campaign.save();
    await audit(req, 'CREATOR_REMOVED', 'campaign', { creatorId: req.params.creatorId }, 'low', null, `Campaign:${campaign._id}`);
    res.json({ success: true, campaign });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── Get all verified creators for assignment ───────── */
router.get('/creators/for-assignment', adminOnly, async (req, res) => {
  try {
    const { search, niche, page = 1, limit = 20 } = req.query;
    const q = { $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } };
    if (search) q.$or = [{ displayName: { $regex: search, $options: 'i' } }, { handle: { $regex: search, $options: 'i' } }];
    if (niche) q.niche = niche;
    const [creators, total] = await Promise.all([
      User.find(q).select('displayName avatar handle niche creatorScore rank platforms verificationStatus availability trustScore').sort({ creatorScore: -1 }).skip((+page - 1) * +limit).limit(+limit),
      User.countDocuments(q),
    ]);
    res.json({ success: true, creators, total, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   CREATOR APPROVALS — admin only
   ══════════════════════════════════════════════════════ */
router.get('/creators/pending', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const q = { $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'pending', isDeleted: { $ne: true } };
    const [creators, total] = await Promise.all([
      User.find(q).select('-password -refreshToken').sort({ createdAt: 1 }).skip((+page - 1) * +limit).limit(+limit),
      User.countDocuments(q),
    ]);
    res.json({ success: true, creators, total, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/creators/all', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    let q = { $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } };
    if (status) q = { $and: [{ $or: [{ role: 'creator' }, { roles: 'creator' }] }, { verificationStatus: status }, { isDeleted: { $ne: true } }] };
    if (search) q = { $and: [{ $or: [{ role: 'creator' }, { roles: 'creator' }] }, { $or: [{ displayName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }, { isDeleted: { $ne: true } }] };
    const [creators, total] = await Promise.all([
      User.find(q).select('-password -refreshToken').sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit),
      User.countDocuments(q),
    ]);
    res.json({ success: true, creators, total, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/creators/stats', async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'pending', isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'approved', isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'rejected', isDeleted: { $ne: true } }),
    ]);
    res.json({ success: true, stats: { total, pending, approved, rejected } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/creators/:id/approve', adminOnly, async (req, res) => {
  try {
    const { note = '' } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { verificationStatus: 'approved', verificationNote: note, isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Creator not found' });
    await notify(user._id, 'creator_approved', '✅ Profile Approved!', 'Your creator profile has been approved! You can now receive campaign assignments.', `/creator/dashboard`);
    const io = req.app.get('io');
    if (io) io.to(`user:${user._id}`).emit('notification', { type: 'creator_approved', title: '✅ Profile Approved!', body: 'Your creator profile has been approved!' });
    await sendCreatorApprovedMail(user.email, user.displayName).catch(() => { });
    await feed('creator_onboarded', req.user._id, `${user.displayName} approved as creator`, { userId: user._id });
    await audit(req, 'CREATOR_APPROVED', 'user', { note }, 'medium', user._id, `User:${user._id}`);
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/creators/:id/reject', adminOnly, async (req, res) => {
  try {
    const { note = '' } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { verificationStatus: 'rejected', verificationNote: note, isVerified: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Creator not found' });
    await notify(user._id, 'creator_rejected', 'Profile Review Update', `Your creator profile requires changes: ${note || 'Please update your profile.'}`, `/creator/profile`);
    await sendCreatorRejectedMail(user.email, user.displayName, note).catch(() => { });
    await audit(req, 'CREATOR_REJECTED', 'user', { note }, 'medium', user._id, `User:${user._id}`);
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});



/* ══════════════════════════════════════════════════════
   TRANSACTIONS — admin only
   ══════════════════════════════════════════════════════ */
router.get('/transactions', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const q = type ? { type } : {};
    const [txns, total] = await Promise.all([
      Transaction.find(q).populate('creator', 'displayName avatar').populate('brand', 'displayName companyName').sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit),
      Transaction.countDocuments(q),
    ]);
    res.json({ success: true, transactions: txns, total, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   ANALYTICS — admin only
   ══════════════════════════════════════════════════════ */
router.get('/analytics', adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalCreators, totalBrands, totalCampaigns, completedCampaigns, txTotal, monthlyUsers] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'brand' }, { roles: 'brand' }], isDeleted: { $ne: true } }),
      Campaign.countDocuments({ isDeleted: { $ne: true } }),
      Campaign.countDocuments({ workflowStatus: 'completed', isDeleted: { $ne: true } }),
      Transaction.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      User.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': -1, '_id.month': -1 } }, { $limit: 12 }]),
    ]);
    const revenueMap = {};
    txTotal.forEach(t => { revenueMap[t._id] = t.total; });
    res.json({ success: true, stats: { totalUsers, totalCreators, totalBrands, totalCampaigns, completedCampaigns, revenue: revenueMap }, monthlyUsers });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});


/* ══════════════════════════════════════════════════════
   V2.7 — LEADERBOARD SYSTEM
   ══════════════════════════════════════════════════════ */
router.get('/leaderboard', adminOnly, async (req, res) => {
  try {
    const { type = 'overall', page = 1, limit = 20, search } = req.query;
    const q = {
      $or: [{ role: 'creator' }, { roles: 'creator' }],
      isDeleted: { $ne: true },
    };
    if (search) {
      q.$and = [
        { $or: q.$or },
        { $or: [{ displayName: { $regex: search, $options: 'i' } }, { handle: { $regex: search, $options: 'i' } }] },
      ];
      delete q.$or;
    }

    const sortMap = {
      overall: { creatorScore: -1 },
      activity: { xp: -1 },
      engagement: { 'platforms.instagram.engagement': -1 },
      reliability: { 'trustScore.campaignCompletion': -1 },
      completion: { completedCampaigns: -1 },
      growth: { seasonXP: -1 },
    };

    const sort = sortMap[type] || sortMap.overall;

    const [creators, total] = await Promise.all([
      User.find(q)
        .select('displayName avatar handle niche creatorScore rank xp seasonXP platforms trustScore totalCampaigns completedCampaigns availability')
        .sort(sort)
        .skip((+page - 1) * +limit)
        .limit(+limit),
      User.countDocuments(q),
    ]);

    // Compute derived scores for response
    const enriched = creators.map(c => {
      const obj = c.toObject();
      const ts = obj.trustScore || {};

      // Engagement score: average across platforms
      let engagementScore = 0;
      let platCount = 0;
      if (obj.platforms?.instagram?.engagement) { engagementScore += obj.platforms.instagram.engagement; platCount++; }
      if (obj.platforms?.youtube?.engagement) { engagementScore += obj.platforms.youtube.engagement; platCount++; }
      obj.engagementScore = platCount ? +(engagementScore / platCount).toFixed(2) : 0;

      // Reliability score
      obj.reliabilityScore = ts.campaignCompletion || 0;

      return obj;
    });

    res.json({ success: true, creators: enriched, total, pages: Math.ceil(total / +limit), type });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   V2.7 — CREATOR INTELLIGENCE OVERVIEW
   ══════════════════════════════════════════════════════ */
router.get('/creator-intelligence', adminOnly, async (req, res) => {
  try {
    const [total, pending, approved, rejected, highScore, avgScore] = await Promise.all([
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'pending', isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'approved', isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], verificationStatus: 'rejected', isDeleted: { $ne: true } }),
      User.countDocuments({ $or: [{ role: 'creator' }, { roles: 'creator' }], creatorScore: { $gte: 800 }, isDeleted: { $ne: true } }),
      User.aggregate([
        { $match: { $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } } },
        { $group: { _id: null, avg: { $avg: '$creatorScore' } } },
      ]),
    ]);

    const topPerformers = await User.find({
      $or: [{ role: 'creator' }, { roles: 'creator' }],
      verificationStatus: 'approved',
      isDeleted: { $ne: true },
    })
      .select('displayName avatar handle niche creatorScore rank xp seasonXP platforms trustScore totalCampaigns completedCampaigns')
      .sort({ creatorScore: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        total, pending, approved, rejected, highScore,
        avgScore: Math.round(avgScore[0]?.avg || 0),
      },
      topPerformers,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   V2.7 — CAMPAIGN HEALTH SCORE
   ══════════════════════════════════════════════════════ */
router.get('/campaigns/:id/health', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('assignedCreators.creator', 'displayName creatorScore');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const assigned = campaign.assignedCreators?.length || 0;
    const total = campaign.totalSlots || 1;
    const fillPct = (assigned / total) * 100;
    const msLeft = new Date(campaign.deadline) - Date.now();
    const daysLeft = Math.max(0, Math.floor(msLeft / 86400000));
    const approved = (campaign.assignedCreators || []).filter(a => ['approved', 'completed'].includes(a.status)).length;
    const deliveryPct = assigned > 0 ? (approved / assigned) * 100 : 0;

    let score = 100;
    if (fillPct < 50) score -= 25;
    else if (fillPct < 80) score -= 10;
    if (daysLeft < 1) score -= 30;
    else if (daysLeft < 3) score -= 15;
    else if (daysLeft < 7) score -= 5;
    if (campaign.workflowStatus === 'revision') score -= 15;
    if (campaign.workflowStatus === 'cancelled') score = 0;
    if (deliveryPct < 30 && assigned > 0) score -= 20;
    else if (deliveryPct < 60 && assigned > 0) score -= 10;

    score = Math.max(0, Math.min(100, score));

    const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention';

    res.json({
      success: true,
      health: {
        score, label,
        fillPct: Math.round(fillPct),
        daysLeft,
        deliveryPct: Math.round(deliveryPct),
        assigned,
        totalSlots: total,
        workflowStatus: campaign.workflowStatus,
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   V2.7 — TOP PERFORMERS
   ══════════════════════════════════════════════════════ */
router.get('/creators/top-performers', adminOnly, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const creators = await User.find({
      $or: [{ role: 'creator' }, { roles: 'creator' }],
      verificationStatus: 'approved',
      isDeleted: { $ne: true },
    })
      .select('displayName avatar handle niche creatorScore rank xp seasonXP platforms trustScore totalCampaigns completedCampaigns availability')
      .sort({ creatorScore: -1 })
      .limit(+limit);
    res.json({ success: true, creators });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   V2.7 — TEAM MEMBERS (for workspace assignment)
   ══════════════════════════════════════════════════════ */
router.get('/team-members', adminOnly, async (req, res) => {
  try {
    const members = await User.find({
      $or: [{ role: 'team_member' }, { roles: 'team_member' }],
      isDeleted: { $ne: true },
    }).select('displayName avatar role teamTitle teamDepartment').sort({ displayName: 1 });
    res.json({ success: true, members });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ══════════════════════════════════════════════════════
   NOTIFICATION BROADCAST
   ══════════════════════════════════════════════════════ */
router.post('/broadcast', adminOnly, async (req, res) => {
  try {
    const {
      title,
      message,
      subtitle,
      targetAudience,
      targetUserIds = [],
      priority = 'Medium',
      category = 'General',
      ctaLabel,
      ctaUrl,
    } = req.body;

    let userIds = [];

    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      userIds = targetUserIds;
    } else {
      let q = { isDeleted: { $ne: true } };
      const aud = (targetAudience || '').toLowerCase();

      if (aud.includes('creator')) {
        q = { $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } };
      } else if (aud.includes('brand')) {
        q = { $or: [{ role: 'brand' }, { roles: 'brand' }], isDeleted: { $ne: true } };
      } else if (aud.includes('team')) {
        q = { $or: [{ role: 'team_member' }, { roles: 'team_member' }, { role: 'admin' }, { roles: 'admin' }, { role: 'superadmin' }, { roles: 'superadmin' }], isDeleted: { $ne: true } };
      } else if (aud.includes('verified')) {
        q = { isVerified: true, isDeleted: { $ne: true } };
      } else if (aud.includes('pending')) {
        q = { verificationStatus: 'pending', isDeleted: { $ne: true } };
      }

      let users = await User.find(q).select('_id email displayName');

      // Fallback 1: If no users matched specific role query filter, fetch all non-deleted users
      if (!users.length) {
        users = await User.find({ isDeleted: { $ne: true } }).select('_id email displayName');
      }

      // Fallback 2: Query all users without any query conditions
      if (!users.length) {
        users = await User.find({}).select('_id email displayName');
      }

      userIds = users.map(u => u._id.toString());
    }

    // Ultimate Fallback: Ensure userIds is never empty if logged in user exists
    if (!userIds.length && req.user?._id) {
      userIds = [req.user._id.toString()];
    }

    const notifDocs = userIds.map(uid => ({
      user: uid,
      type: category || 'broadcast',
      title: title || 'New Notification',
      body: message || subtitle || '',
      link: ctaUrl || '',
      read: false,
      createdAt: new Date(),
    }));

    await Notification.insertMany(notifDocs);

    // Emit real-time notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      userIds.forEach(uid => {
        io.to(`user:${uid}`).emit('notification', {
          type: category || 'broadcast',
          title: title || 'New Notification',
          body: message || subtitle || '',
          link: ctaUrl || '',
          createdAt: new Date().toISOString()
        });
      });
    }

    await audit(req, 'NOTIFICATION_BROADCAST', 'notification', { count: userIds.length, title, category }, 'medium', null, `Recipients:${userIds.length}`);

    res.json({ success: true, count: userIds.length, sent: userIds.length, message: `Notification dispatched to ${userIds.length} recipients` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
