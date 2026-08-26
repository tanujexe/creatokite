const express = require('express');
const { User, InternalNote, FeedEvent, Campaign } = require('../models');
const { auth, teamOrAdmin, audit } = require('../middleware/auth');
const { sendFollowUpReminderMail } = require('../utils/sendEmail');
const router = express.Router();
router.use(auth, teamOrAdmin);

/* ══ Creator CRM ══════════════════════════════════════════ */
router.get('/creators', async (req,res) => {
  try {
    const { status, assignedTo, search, availability, niche, city, minFollowers, maxFollowers, isBarterReady, page=1, limit=50, sort='newest' } = req.query;
    const q = { $or:[{role:'creator'},{roles:'creator'}], isDeleted:{$ne:true} };

    if (status)       q.crmStatus    = status;
    if (availability) q.availability = availability;
    if (assignedTo)   q.assignedTeamMember = assignedTo;
    if (niche)        q.niche        = niche;
    if (city)         q.$or          = [{ city: { $regex: city, $options: 'i' } }, { location: { $regex: city, $options: 'i' } }];
    if (isBarterReady !== undefined && isBarterReady !== '') q.isBarterReady = isBarterReady === 'true';

    if (minFollowers || maxFollowers) {
      q['platforms.instagram.followers'] = {};
      if (minFollowers) q['platforms.instagram.followers'].$gte = +minFollowers;
      if (maxFollowers) q['platforms.instagram.followers'].$lte = +maxFollowers;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = [
        { displayName: searchRegex },
        { email: searchRegex },
        { handle: searchRegex },
        { niche: searchRegex },
        { city: searchRegex },
        { location: searchRegex },
        { audienceLocation: searchRegex }
      ];
      if (q.$or) {
        q.$and = [{ $or: q.$or }, { $or: searchConditions }];
        delete q.$or;
      } else {
        q.$or = searchConditions;
      }
    }

    const sortMap = { newest:{createdAt:-1}, score:{creatorScore:-1}, name:{displayName:1}, trust:{'trustScore.overall':-1} };
    const [creators,total] = await Promise.all([
      User.find(q).select('-password -refreshToken').populate('assignedTeamMember','displayName avatar email').sort(sortMap[sort]||sortMap.newest).skip((+page-1)*+limit).limit(+limit),
      User.countDocuments(q),
    ]);
    res.json({ success:true, creators, total, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/crm/creators/export-excel — Export Creator details to CSV/Excel */
router.get('/creators/export-excel', async (req, res) => {
  try {
    const { status, search, niche, availability, isBarterReady } = req.query;
    const q = { $or: [{ role: 'creator' }, { roles: 'creator' }], isDeleted: { $ne: true } };

    if (status) q.crmStatus = status;
    if (availability) q.availability = availability;
    if (niche) q.niche = niche;
    if (isBarterReady !== undefined && isBarterReady !== '') q.isBarterReady = isBarterReady === 'true';

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      q.$and = [
        { $or: [{ role: 'creator' }, { roles: 'creator' }] },
        { $or: [{ displayName: searchRegex }, { email: searchRegex }, { phone: searchRegex }, { handle: searchRegex }, { niche: searchRegex }] }
      ];
    }

    const creators = await User.find(q).populate('assignedTeamMember', 'displayName email').sort({ createdAt: -1 });

    const headers = [
      'Creator ID', 'Full Name', 'Email', 'Phone Number', 'Instagram Handle',
      'Instagram Profile URL', 'Primary Niche', 'All Selected Niches', 'City / Location',
      'Followers', 'Avg Views', 'Commercial Rate (INR)', 'Barter Deals Ready', 'CAS Score', 'Pipeline Status',
      'Availability', 'Assigned Team Member', 'Created Date'
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
      escapeCsv(c.phone || '—'),
      escapeCsv(c.handle ? `@${c.handle}` : '—'),
      escapeCsv(c.socialUrls?.instagram || (c.handle ? `https://instagram.com/${c.handle}` : '—')),
      escapeCsv(c.niche || '—'),
      escapeCsv(c.subNiches?.length ? c.subNiches.join('; ') : (c.niche || '—')),
      escapeCsv(c.city || c.location || '—'),
      c.platforms?.instagram?.followers || c.followers || 0,
      c.avgViews || 0,
      c.commercialRate || 0,
      escapeCsv(c.isBarterReady !== false ? 'Yes' : 'No'),
      c.casScore || 0,
      escapeCsv(c.crmStatus || 'Lead'),
      escapeCsv(c.availability || 'Available'),
      escapeCsv(c.assignedTeamMember?.displayName || 'Unassigned'),
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

router.put('/creators/:id', async (req,res) => {
  try {
    const allowed = ['crmStatus','assignedTeamMember','lastContactDate','nextFollowUpDate','followUpNotes','followUpStatus','availability','creatorVerificationTier'];
    const update = {};
    allowed.forEach(k => { if(req.body[k]!==undefined) update[k]=req.body[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new:true }).select('-password -refreshToken');
    if (!user) return res.status(404).json({ success:false, message:'Not found' });
    if (update.crmStatus) {
      await User.findByIdAndUpdate(user._id, { $push:{ crmTimeline:{ event:`Status → ${update.crmStatus}`, by:req.user._id, at:new Date() } } });
    }
    await audit(req,'CRM_CREATOR_UPDATED','crm',{updated:Object.keys(update)},'low',user._id,`User:${user._id}`);
    res.json({ success:true, user });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── Follow-ups ── */
router.get('/followups', async (req,res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today); week.setDate(week.getDate()+7);

    const [todayDue, upcoming, overdue] = await Promise.all([
      User.find({ nextFollowUpDate:{ $gte:today, $lt:new Date(today.getTime()+86400000) }, isDeleted:{$ne:true}, $or:[{role:'creator'},{roles:'creator'},{role:'brand'},{roles:'brand'}] }).select('displayName email avatar niche crmStatus brandCrmStatus role roles nextFollowUpDate followUpNotes assignedTeamMember').populate('assignedTeamMember','displayName').limit(30),
      User.find({ nextFollowUpDate:{ $gte:new Date(today.getTime()+86400000), $lt:week }, isDeleted:{$ne:true} }).select('displayName email avatar niche role roles nextFollowUpDate assignedTeamMember').populate('assignedTeamMember','displayName').limit(30),
      User.find({ nextFollowUpDate:{ $lt:today }, followUpStatus:{ $ne:'done' }, isDeleted:{$ne:true} }).select('displayName email avatar niche role roles nextFollowUpDate followUpNotes assignedTeamMember').populate('assignedTeamMember','displayName').limit(30),
    ]);
    res.json({ success:true, today:todayDue, upcoming, overdue });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.patch('/followups/:id/done', async (req,res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { followUpStatus:'done' }, { new:true }).select('displayName followUpStatus');
    res.json({ success:true, user });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ══ Brand CRM ════════════════════════════════════════════ */
router.get('/brands', async (req,res) => {
  try {
    const { status, assignedTo, search, page=1, limit=50 } = req.query;
    const q = { $or:[{role:'brand'},{roles:'brand'}], isDeleted:{$ne:true} };
    if (status)     q.brandCrmStatus = status;
    if (assignedTo) q.assignedTeamMember = assignedTo;
    if (search) {
      q.$and = [
        { $or:[{role:'brand'},{roles:'brand'}] },
        { $or:[{displayName:{$regex:search,$options:'i'}},{companyName:{$regex:search,$options:'i'}},{email:{$regex:search,$options:'i'}}] },
      ];
      delete q.$or;
    }
    const [brands,total] = await Promise.all([
      User.find(q).select('displayName email companyName industry avatar brandCrmStatus website socialUrls platforms brandVerificationTier totalSpent assignedTeamMember meetingNotes lastContactDate nextFollowUpDate createdAt').populate('assignedTeamMember','displayName avatar').sort({ createdAt:-1 }).skip((+page-1)*+limit).limit(+limit),
      User.countDocuments(q),
    ]);
    res.json({ success:true, brands, total, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/crm/brands/export-excel — Export Brand CRM data to CSV/Excel */
router.get('/brands/export-excel', async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = { $or: [{ role: 'brand' }, { roles: 'brand' }], isDeleted: { $ne: true } };

    if (status) q.brandCrmStatus = status;
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      q.$and = [
        { $or: [{ displayName: searchRegex }, { companyName: searchRegex }, { email: searchRegex }, { industry: searchRegex }] }
      ];
    }

    const brands = await User.find(q).populate('assignedTeamMember', 'displayName email').sort({ createdAt: -1 });

    const headers = [
      'Brand ID', 'Company Name', 'Contact Name', 'Email', 'Industry', 'Website',
      'Pipeline Stage', 'Assigned Team Member', 'Total Spent (INR)', 'Meeting Notes',
      'Next Follow-Up Date', 'Created Date'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = brands.map(b => [
      escapeCsv(b._id),
      escapeCsv(b.companyName || b.displayName),
      escapeCsv(b.displayName),
      escapeCsv(b.email),
      escapeCsv(b.industry || 'General'),
      escapeCsv(b.website || '—'),
      escapeCsv(b.brandCrmStatus || 'Lead'),
      escapeCsv(b.assignedTeamMember?.displayName || 'Unassigned'),
      b.totalSpent || 0,
      escapeCsv(b.meetingNotes || ''),
      escapeCsv(b.nextFollowUpDate ? new Date(b.nextFollowUpDate).toLocaleDateString('en-IN') : '—'),
      escapeCsv(new Date(b.createdAt).toLocaleDateString('en-IN'))
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=brands_crm_export_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch(e) {
    console.error('Export Brands Excel Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/brands/:id', async (req,res) => {
  try {
    const allowed = ['brandCrmStatus','assignedTeamMember','meetingNotes','followUpDate','nextFollowUpDate','followUpNotes','followUpStatus'];
    const update = {};
    allowed.forEach(k => { if(req.body[k]!==undefined) update[k]=req.body[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new:true }).select('-password -refreshToken');
    if (!user) return res.status(404).json({ success:false, message:'Not found' });
    await audit(req,'CRM_BRAND_UPDATED','crm',{updated:Object.keys(update)},'low',user._id,`User:${user._id}`);
    res.json({ success:true, user });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ══ Internal Notes ════════════════════════════════════════ */
router.get('/notes/:userId', async (req,res) => {
  try {
    const notes = await InternalNote.find({ about:req.params.userId, isDeleted:{$ne:true} }).populate('author','displayName avatar').sort({createdAt:-1});
    res.json({ success:true, notes });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/notes', async (req,res) => {
  try {
    const { about, text, noteType='general', campaign } = req.body;
    if (!about||!text) return res.status(400).json({ success:false, message:'about and text required' });
    const note = await InternalNote.create({ about, text, noteType, author:req.user._id, campaign:campaign||undefined });
    const populated = await InternalNote.findById(note._id).populate('author','displayName avatar');
    await audit(req,'NOTE_ADDED','crm',{noteType},'low',null,`User:${about}`);
    res.status(201).json({ success:true, note:populated });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.delete('/notes/:id', async (req,res) => {
  try {
    await InternalNote.findByIdAndUpdate(req.params.id, { isDeleted:true });
    res.json({ success:true, message:'Deleted' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ══ Saved Filters ════════════════════════════════════════ */
router.post('/saved-filters', async (req,res) => {
  try {
    const { name, type, filters } = req.body;
    if (!name||!type) return res.status(400).json({ success:false, message:'name and type required' });
    await User.findByIdAndUpdate(req.user._id, { $push:{ savedFilters:{ name,type,filters } } });
    res.json({ success:true, message:'Filter saved' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.delete('/saved-filters/:filterId', async (req,res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull:{ savedFilters:{ _id:req.params.filterId } } });
    res.json({ success:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ══ CRM Stats ════════════════════════════════════════════ */
router.get('/stats', async (req,res) => {
  try {
    const [creatorsByStatus, brandsByStatus, availabilityBreakdown] = await Promise.all([
      User.aggregate([{ $match:{ $or:[{role:'creator'},{roles:'creator'}],isDeleted:{$ne:true} } },{ $group:{ _id:'$crmStatus',count:{$sum:1} } }]),
      User.aggregate([{ $match:{ $or:[{role:'brand'},{roles:'brand'}],isDeleted:{$ne:true} } },{ $group:{ _id:'$brandCrmStatus',count:{$sum:1} } }]),
      User.aggregate([{ $match:{ $or:[{role:'creator'},{roles:'creator'}],isDeleted:{$ne:true} } },{ $group:{ _id:'$availability',count:{$sum:1} } }]),
    ]);
    res.json({ success:true, creatorsByStatus, brandsByStatus, availabilityBreakdown });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
