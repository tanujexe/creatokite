const express = require('express');
const { DMReport, Task, FeedEvent, User, Campaign } = require('../models');
const { auth, teamOrAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(auth, teamOrAdmin);

/* ── Activity Feed ───────────────────────────────────────── */
router.get('/feed', async (req,res) => {
  try {
    const {page=1,limit=30} = req.query;
    const events = await FeedEvent.find({visibleTo:{$in:['team','all']}})
      .populate('actor','displayName avatar').populate('campaign','title')
      .sort({createdAt:-1}).skip((+page-1)*+limit).limit(+limit);
    const total = await FeedEvent.countDocuments({visibleTo:{$in:['team','all']}});
    res.json({success:true,events,total,pages:Math.ceil(total/+limit)});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* ── DM Tracker ──────────────────────────────────────────── */
router.get('/dm-reports', async (req,res) => {
  try {
    const {memberId,from,to,page=1,limit=20} = req.query;
    const q={};
    if(memberId) q.teamMember=memberId;
    else q.teamMember=req.user._id; // own reports by default
    if(from||to){ q.date={}; if(from)q.date.$gte=new Date(from); if(to)q.date.$lte=new Date(to); }
    const [reports,total] = await Promise.all([
      DMReport.find(q).populate('teamMember','displayName avatar').sort({date:-1}).skip((+page-1)*+limit).limit(+limit),
      DMReport.countDocuments(q),
    ]);
    res.json({success:true,reports,total,pages:Math.ceil(total/+limit)});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.get('/dm-reports/all', async (req,res) => {
  try {
    const {from,to} = req.query;
    const q={};
    if(from||to){ q.date={}; if(from)q.date.$gte=new Date(from); if(to)q.date.$lte=new Date(to); }
    const reports = await DMReport.find(q).populate('teamMember','displayName avatar').sort({date:-1}).limit(100);
    /* Aggregate by member */
    const byMember={};
    reports.forEach(r=>{
      const id=r.teamMember?._id.toString();
      if(!byMember[id]) byMember[id]={member:r.teamMember,totalCreatorDMs:0,totalBrandDMs:0,totalReplies:0,totalLeads:0,reportCount:0};
      byMember[id].totalCreatorDMs+=r.creatorDMs||0;
      byMember[id].totalBrandDMs+=r.brandDMs||0;
      byMember[id].totalReplies+=r.repliesReceived||0;
      byMember[id].totalLeads+=r.interestedLeads||0;
      byMember[id].reportCount++;
    });
    res.json({success:true,reports,summary:Object.values(byMember)});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.post('/dm-reports', async (req,res) => {
  try {
    const {date,creatorDMs=0,brandDMs=0,profileLinks=[],repliesReceived=0,interestedLeads=0,notes='',creatorLinks=[],brandLinks=[]} = req.body;
    if(!date) return res.status(400).json({success:false,message:'Date required'});
    /* Upsert for same day */
    const report = await DMReport.findOneAndUpdate(
      {teamMember:req.user._id,date:new Date(date)},
      {teamMember:req.user._id,date:new Date(date),creatorDMs,brandDMs,profileLinks,repliesReceived,interestedLeads,notes,creatorLinks,brandLinks},
      {upsert:true,new:true}
    ).populate('teamMember','displayName avatar');

    if (creatorDMs > 0) {
      // Find the oldest active task assigned to this user that has an outreach goal
      const task = await Task.findOne({
        assignedTo: req.user._id,
        status: { $ne: 'done' },
        isArchived: false,
        'outreachGoal.targetDMs': { $gt: 0 }
      });
      if (task) {
        task.outreachGoal.currentDMs = (task.outreachGoal.currentDMs || 0) + Number(creatorDMs);
        if (task.outreachGoal.currentDMs >= task.outreachGoal.targetDMs) {
          task.status = 'done';
          task.completedAt = new Date();
        }
        await task.save();

        try {
          await FeedEvent.create({
            eventType: task.status === 'done' ? 'task_completed' : 'new_achievement',
            actor: req.user._id,
            task: task._id,
            message: `Updated outreach task "${task.title}": ${task.outreachGoal.currentDMs}/${task.outreachGoal.targetDMs} DMs sent.`,
            visibleTo: 'team'
          });
        } catch(feErr) {}
      }
    }

    res.status(201).json({success:true,report});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* ── Team Directory ──────────────────────────────────────── */
router.get('/team', async (req,res) => {
  try {
    const members = await User.find({$or:[{role:{$in:['admin','superadmin','team_member']}},{roles:{$in:['admin','superadmin','team_member']}}]})
      .select('displayName email avatar role roles teamDepartment teamTitle createdAt').sort({createdAt:-1});
    res.json({success:true,members});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* ── My assigned campaigns ───────────────────────────────── */
router.get('/assigned-campaigns', async (req,res) => {
  try {
    const campaigns = await Campaign.find({assignedTeamMembers:req.user._id}).populate('brand','displayName companyName avatar').sort({createdAt:-1}).limit(20);
    res.json({success:true,campaigns});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* ── Workspace Stats ─────────────────────────────────────── */
router.get('/stats', async (req,res) => {
  try {
    const [myTasks,pendingDMs,recentFeed] = await Promise.all([
      Task.countDocuments({assignedTo:req.user._id,isArchived:false,status:{$ne:'done'}}),
      DMReport.findOne({teamMember:req.user._id}).sort({date:-1}),
      FeedEvent.find({visibleTo:{$in:['team','all']}}).sort({createdAt:-1}).limit(5),
    ]);
    res.json({success:true,stats:{myTasks,todayDMs:pendingDMs?.creatorDMs||0},recentFeed});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

module.exports = router;
