const express = require('express');
const { Task, User, Notification, FeedEvent } = require('../models');
const { auth, teamOrAdmin, audit } = require('../middleware/auth');
const router = express.Router();
router.use(auth, teamOrAdmin);

const notify = async (uid,type,title,body,link='') => { try{await Notification.create({user:uid,type,title,body,link});}catch(e){} };

/* GET /api/tasks */
router.get('/', async (req,res) => {
  try {
    const {status,priority,assignedTo,campaign,page=1,limit=20,search} = req.query;
    const q={isArchived:false};
    if(status)     q.status=status;
    if(priority)   q.priority=priority;
    if(campaign)   q.campaign=campaign;
    if(assignedTo) q.assignedTo=assignedTo;
    else if(!req.query.all) q.$or=[{assignedTo:req.user._id},{assignedBy:req.user._id}];
    if(search) q.title={$regex:search,$options:'i'};
    const [tasks,total] = await Promise.all([
      Task.find(q).populate('assignedTo','displayName avatar role').populate('assignedBy','displayName avatar').populate('campaign','title').sort({createdAt:-1}).skip((+page-1)*+limit).limit(+limit),
      Task.countDocuments(q),
    ]);
    res.json({success:true,tasks,total,pages:Math.ceil(total/+limit)});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* POST /api/tasks */
router.post('/', async (req,res) => {
  try {
    const {title,description='',priority='medium',assignedTo=[],campaign,dueDate,tags=[]} = req.body;
    if(!title) return res.status(400).json({success:false,message:'Title required'});
    const task = await Task.create({title,description,priority,assignedTo,campaign:campaign||undefined,dueDate:dueDate||undefined,tags,assignedBy:req.user._id});
    for(const uid of assignedTo){
      await notify(uid,'task_assigned','📋 Task Assigned',`"${title}" has been assigned to you.`,`/team/tasks`);
    }
    try{await FeedEvent.create({eventType:'task_completed',actor:req.user._id,message:`Task "${title}" created`,visibleTo:'team'});}catch(e){}
    await audit(req,'TASK_CREATED','task',{title},'low',null,`Task:${task._id}`);
    const populated = await Task.findById(task._id).populate('assignedTo','displayName avatar').populate('assignedBy','displayName avatar');
    res.status(201).json({success:true,task:populated});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* GET /api/tasks/:id */
router.get('/:id', async (req,res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo','displayName avatar email').populate('assignedBy','displayName avatar').populate('campaign','title').populate('comments.author','displayName avatar');
    if(!task) return res.status(404).json({success:false,message:'Task not found'});
    res.json({success:true,task});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* PUT /api/tasks/:id */
router.put('/:id', async (req,res) => {
  try {
    const allowed=['title','description','status','priority','assignedTo','dueDate','tags'];
    const update={};
    allowed.forEach(k=>{if(req.body[k]!==undefined)update[k]=req.body[k];});
    if(update.status==='done') update.completedAt=new Date();
    const task = await Task.findByIdAndUpdate(req.params.id,update,{new:true}).populate('assignedTo','displayName avatar').populate('assignedBy','displayName avatar');
    if(!task) return res.status(404).json({success:false,message:'Task not found'});
    if(update.status==='done'){
      try{await FeedEvent.create({eventType:'task_completed',actor:req.user._id,task:task._id,message:`Task "${task.title}" completed`,visibleTo:'team'});}catch(e){}
    }
    await audit(req,'TASK_UPDATED','task',{updated:Object.keys(update),status:update.status},'low',null,`Task:${task._id}`);
    res.json({success:true,task});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* DELETE /api/tasks/:id */
router.delete('/:id', async (req,res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id,{isArchived:true});
    res.json({success:true,message:'Task archived'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* POST /api/tasks/:id/comment */
router.post('/:id/comment', async (req,res) => {
  try {
    const {text} = req.body;
    if(!text) return res.status(400).json({success:false,message:'Text required'});
    const task = await Task.findByIdAndUpdate(req.params.id,{$push:{comments:{author:req.user._id,text,createdAt:new Date()}}},{new:true}).populate('comments.author','displayName avatar');
    if(!task) return res.status(404).json({success:false,message:'Task not found'});
    res.json({success:true,task});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* PATCH /api/tasks/:id/subtask/:subId */
router.patch('/:id/subtask/:subId', async (req,res) => {
  try {
    const {completed} = req.body;
    const task = await Task.findOneAndUpdate({_id:req.params.id,'subtasks._id':req.params.subId},{$set:{'subtasks.$.completed':completed,'subtasks.$.completedAt':completed?new Date():null,'subtasks.$.completedBy':completed?req.user._id:null}},{new:true});
    if(!task) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,task});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

/* GET /api/tasks/stats/me */
router.get('/stats/me', async (req,res) => {
  try {
    const [total,todo,inProgress,done,overdue] = await Promise.all([
      Task.countDocuments({assignedTo:req.user._id,isArchived:false}),
      Task.countDocuments({assignedTo:req.user._id,isArchived:false,status:'todo'}),
      Task.countDocuments({assignedTo:req.user._id,isArchived:false,status:'in_progress'}),
      Task.countDocuments({assignedTo:req.user._id,isArchived:false,status:'done'}),
      Task.countDocuments({assignedTo:req.user._id,isArchived:false,status:{$nin:['done']},dueDate:{$lt:new Date()}}),
    ]);
    res.json({success:true,stats:{total,todo,inProgress,done,overdue}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

module.exports = router;
