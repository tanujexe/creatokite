const express = require('express');
const { CampaignRoom, RoomMessage, Campaign, Notification } = require('../models');
const { auth, getUserRoles } = require('../middleware/auth');
const { sendSubmissionMail, sendSubmissionApprovedMail, sendSubmissionRejectedMail } = require('../utils/sendEmail');
const router = express.Router();
router.use(auth);

const canAccessRoom = async (req, roomId) => {
  const room = await CampaignRoom.findById(roomId);
  if (!room) return { allowed:false, room:null };
  const roles = getUserRoles(req.user);
  const isAdminOrTeam = roles.some(r=>['admin','superadmin','team_member'].includes(r));
  const isMember = room.members.some(m=>m.user?.toString()===req.user._id.toString());
  return { allowed: isMember||isAdminOrTeam, room };
};

/* GET /api/rooms — my rooms */
router.get('/', async (req,res) => {
  try {
    const rooms = await CampaignRoom.find({ 'members.user':req.user._id, isActive:true })
      .populate('campaign','title budget workflowStatus deadline brandName')
      .sort({ lastMessageAt:-1, createdAt:-1 }).limit(50);
    res.json({ success:true, rooms });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/rooms/all */
router.get('/all', async (req,res) => {
  try {
    const roles = getUserRoles(req.user);
    if (!roles.some(r=>['admin','superadmin','team_member'].includes(r))) return res.status(403).json({ success:false, message:'Access denied' });
    const rooms = await CampaignRoom.find({ isActive:true })
      .populate('campaign','title budget workflowStatus deadline brandName').sort({ lastMessageAt:-1 }).limit(100);
    res.json({ success:true, rooms });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/rooms/:id */
router.get('/:id', async (req,res) => {
  try {
    const { allowed, room: roomRaw } = await canAccessRoom(req, req.params.id);
    if (!roomRaw) return res.status(404).json({ success:false, message:'Room not found' });
    if (!allowed) return res.status(403).json({ success:false, message:'Not a member' });
    const room = await CampaignRoom.findById(req.params.id)
      .populate('campaign','title budget workflowStatus deadline brandName brandLogo deliverables assignedCreators')
      .populate('members.user','displayName avatar role roles niche verificationStatus');
    res.json({ success:true, room });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/rooms/:id/messages */
router.get('/:id/messages', async (req,res) => {
  try {
    const { allowed } = await canAccessRoom(req, req.params.id);
    if (!allowed) return res.status(403).json({ success:false, message:'Access denied' });
    const { page=1, limit=60, channelType='campaign_discussion' } = req.query;

    const roles = getUserRoles(req.user);
    const isAdminOrTeam = roles.some(r=>['admin','superadmin','team_member'].includes(r));
    
    // Internal discussion is strictly hidden from Creators and Brands
    if (channelType === 'internal_discussion' && !isAdminOrTeam) {
      return res.status(403).json({ success:false, message:'Internal discussion is strictly restricted to Team Members and Admins.' });
    }

    const query = { room:req.params.id, isDeleted:false, channelType: channelType || 'campaign_discussion' };

    const messages = await RoomMessage.find(query)
      .populate('sender','displayName avatar role roles')
      .populate('replyTo','text sender')
      .sort({ createdAt:1 }).skip((+page-1)*+limit).limit(+limit);
    const total = await RoomMessage.countDocuments(query);
    res.json({ success:true, messages, total, channelType });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* POST /api/rooms/:id/messages */
router.post('/:id/messages', async (req,res) => {
  try {
    const { allowed, room } = await canAccessRoom(req, req.params.id);
    if (!room) return res.status(404).json({ success:false, message:'Room not found' });
    if (!allowed) return res.status(403).json({ success:false, message:'Access denied' });

    const { text, type='text', attachments=[], replyTo, submission, channelType='campaign_discussion' } = req.body;
    const roles = getUserRoles(req.user);
    const isAdminOrTeam = roles.some(r=>['admin','superadmin','team_member'].includes(r));

    if (channelType === 'internal_discussion' && !isAdminOrTeam) {
      return res.status(403).json({ success:false, message:'Only Team Members and Admins can post to internal discussion.' });
    }

    if (!text&&!attachments.length&&!submission) return res.status(400).json({ success:false, message:'Content required' });
    const msg = await RoomMessage.create({
      room:req.params.id,
      sender:req.user._id,
      text,
      type,
      attachments,
      replyTo:replyTo||undefined,
      submission:submission||undefined,
      channelType: channelType || 'campaign_discussion'
    });
    await CampaignRoom.findByIdAndUpdate(req.params.id, { lastMessageAt:new Date() });
    const populated = await RoomMessage.findById(msg._id).populate('sender','displayName avatar role roles').populate('replyTo','text sender');
    const io = req.app.get('io');
    if (io) io.to(`room:${req.params.id}`).emit('room:message', populated);
    res.status(201).json({ success:true, message:populated });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* POST /api/rooms/:id/submit — creator submits work */
router.post('/:id/submit', async (req,res) => {
  try {
    const { instagramUrl='', driveUrl='', youtubeUrl='', captionText='', notes='' } = req.body;
    const { allowed, room } = await canAccessRoom(req, req.params.id);
    if (!allowed) return res.status(403).json({ success:false, message:'Access denied' });

    /* Post submission as a special message */
    const msg = await RoomMessage.create({
      room: req.params.id,
      sender: req.user._id,
      type: 'submission',
      text: `📤 Submitted work for review`,
      submission: { instagramUrl, driveUrl, youtubeUrl, captionText, notes, status:'submitted' },
    });

    /* Update campaign creator slot */
    const campaign = await require('../models').Campaign.findOneAndUpdate(
      { roomId:req.params.id, 'assignedCreators.creator':req.user._id },
      { $set:{ 'assignedCreators.$.submissionStatus':'submitted', 'assignedCreators.$.status':'submitted',
                'assignedCreators.$.submissionUrl':instagramUrl||driveUrl||youtubeUrl,
                'assignedCreators.$.driveUrl':driveUrl, 'assignedCreators.$.youtubeUrl':youtubeUrl,
                'assignedCreators.$.captionText':captionText, 'assignedCreators.$.submissionNote':notes,
                'assignedCreators.$.submittedAt':new Date() } },
      { new:true }
    ).populate('assignedTeamMembers','email displayName').populate('campaignOwner','email displayName').populate('brand','email displayName');

    await CampaignRoom.findByIdAndUpdate(req.params.id, { lastMessageAt:new Date() });
    const populated = await RoomMessage.findById(msg._id).populate('sender','displayName avatar role roles');
    const io = req.app.get('io');
    if (io) io.to(`room:${req.params.id}`).emit('room:message', populated);

    /* Notify admins/team */
    if (campaign) {
      const admins = await require('../models').User.find({ $or:[{role:{$in:['admin','superadmin']}},{roles:{$in:['admin','superadmin']}}] }).select('email displayName');
      for (const a of admins) {
        await Notification.create({ user:a._id, type:'submission', title:'📤 New Submission', body:`${req.user.displayName} submitted for "${campaign.title}"`, link:`/admin/room/${req.params.id}` });
        if (a.email) await sendSubmissionMail(a.email, req.user.displayName, campaign.title);
      }
    }
    res.status(201).json({ success:true, message:populated });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PATCH /api/rooms/:id/submission/:creatorId/:action — admin approve/reject */
router.patch('/:id/submission/:creatorId/:action', async (req,res) => {
  try {
    const roles = getUserRoles(req.user);
    if (!roles.some(r=>['admin','superadmin','team_member'].includes(r))) return res.status(403).json({ success:false, message:'Access denied' });
    const { action } = req.params;
    const { note='' } = req.body;
    if (!['approve','reject','request_changes'].includes(action)) return res.status(400).json({ success:false, message:'Invalid action' });

    const statusMap = { approve:'approved', reject:'rejected', request_changes:'revision' };
    const submissionStatusMap = { approve:'approved', reject:'approved', request_changes:'changes_requested' };

    const campaign = await require('../models').Campaign.findOneAndUpdate(
      { roomId:req.params.id, 'assignedCreators.creator':req.params.creatorId },
      { $set:{ 'assignedCreators.$.status':statusMap[action], 'assignedCreators.$.submissionStatus':submissionStatusMap[action], 'assignedCreators.$.revisionNote':note, ...( action==='approve'?{ 'assignedCreators.$.approvedAt':new Date() }:{} ) } },
      { new:true }
    ).populate('assignedCreators.creator','email displayName');

    if (!campaign) return res.status(404).json({ success:false, message:'Not found' });

    /* Post system message */
    const sysMsg = await RoomMessage.create({
      room:req.params.id, sender:req.user._id, type:'system',
      text: action==='approve'?`✅ Submission approved`:`action==='reject'?'❌ Submission rejected':⚠️ Changes requested${note?`: ${note}`:''}`,
    });
    const io = req.app.get('io');
    if (io) io.to(`room:${req.params.id}`).emit('room:message', sysMsg);
    await CampaignRoom.findByIdAndUpdate(req.params.id, { lastMessageAt:new Date() });

    /* Email creator */
    const slot = campaign.assignedCreators.find(s=>s.creator?._id.toString()===req.params.creatorId);
    if (slot?.creator) {
      if (action==='approve') await sendSubmissionApprovedMail(slot.creator.email, slot.creator.displayName, campaign.title);
      else await sendSubmissionRejectedMail(slot.creator.email, slot.creator.displayName, campaign.title, note);
      await Notification.create({ user:req.params.creatorId, type:'submission_update', title:action==='approve'?'✅ Submission Approved':'⚠️ Changes Requested', body:action==='approve'?`Your submission for "${campaign.title}" was approved!`:`Changes requested for "${campaign.title}"${note?`: ${note}`:''}`, link:`/creator/assigned` });
    }
    res.json({ success:true, campaign });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/rooms/:id/deliverables — tracker */
router.get('/:id/deliverables', async (req,res) => {
  try {
    const { allowed } = await canAccessRoom(req, req.params.id);
    if (!allowed) return res.status(403).json({ success:false, message:'Access denied' });
    const campaign = await require('../models').Campaign.findOne({ roomId:req.params.id })
      .populate('assignedCreators.creator','displayName avatar niche handle').lean();
    if (!campaign) return res.status(404).json({ success:false, message:'Campaign not found' });
    const deliverables = (campaign.assignedCreators||[]).map(slot => ({
      creator:    slot.creator,
      status:     slot.status,
      submissionStatus: slot.submissionStatus||'draft',
      paymentAlloc: slot.paymentAlloc,
      submittedAt: slot.submittedAt,
      approvedAt:  slot.approvedAt,
      publishedAt: slot.publishedAt,
      submissionUrl: slot.submissionUrl,
      revisionCount: slot.revisionCount,
    }));
    const stats = {
      total:     deliverables.length,
      pending:   deliverables.filter(d=>['assigned','accepted'].includes(d.status)).length,
      submitted: deliverables.filter(d=>d.status==='submitted').length,
      approved:  deliverables.filter(d=>['approved','completed'].includes(d.status)).length,
      published: deliverables.filter(d=>d.status==='published').length,
      completion: campaign.assignedCreators?.length ? Math.round(deliverables.filter(d=>['approved','completed','published'].includes(d.status)).length/deliverables.length*100) : 0,
    };
    res.json({ success:true, deliverables, stats, campaign:{ title:campaign.title, deadline:campaign.deadline, budget:campaign.budget } });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* POST /api/rooms — create room */
router.post('/', async (req,res) => {
  try {
    const roles = getUserRoles(req.user);
    if (!roles.some(r=>['admin','superadmin','team_member'].includes(r))) return res.status(403).json({ success:false, message:'Access denied' });
    const { campaignId, memberIds=[] } = req.body;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ success:false, message:'Campaign not found' });
    const existing = await CampaignRoom.findOne({ campaign:campaignId });
    if (existing) return res.json({ success:true, room:existing, message:'Room already exists' });
    const members = [{ user:req.user._id,role:'admin' }, ...memberIds.map(id=>({ user:id,role:'team_member' }))];
    const room = await CampaignRoom.create({ campaign:campaignId, name:campaign.title, members });
    await Campaign.findByIdAndUpdate(campaignId, { roomId:room._id });
    res.status(201).json({ success:true, room });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* POST /api/rooms/:id/members */
router.post('/:id/members', async (req,res) => {
  try {
    const roles = getUserRoles(req.user);
    if (!roles.some(r=>['admin','superadmin','team_member'].includes(r))) return res.status(403).json({ success:false, message:'Access denied' });
    const { userId, role='team_member' } = req.body;
    const room = await CampaignRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success:false, message:'Not found' });
    const alreadyIn = room.members.some(m=>m.user?.toString()===userId);
    if (!alreadyIn) { room.members.push({ user:userId, role }); await room.save(); }
    res.json({ success:true, room });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
