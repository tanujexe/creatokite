const express = require('express');
const { AuditLog } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();
router.use(auth, adminOnly);

router.get('/', async (req,res) => {
  try {
    const {category,severity,userId,page=1,limit=30,from,to} = req.query;
    const q={};
    if(category) q.category=category;
    if(severity) q.severity=severity;
    if(userId) q.performedBy=userId;
    if(from||to){ q.createdAt={}; if(from)q.createdAt.$gte=new Date(from); if(to)q.createdAt.$lte=new Date(to); }
    const [logs,total] = await Promise.all([
      AuditLog.find(q).populate('performedBy','displayName email avatar').populate('targetUser','displayName email').sort({createdAt:-1}).skip((+page-1)*+limit).limit(+limit),
      AuditLog.countDocuments(q),
    ]);
    res.json({success:true,logs,total,pages:Math.ceil(total/+limit)});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.get('/stats', async (req,res) => {
  try {
    const [byCategory,bySeverity] = await Promise.all([
      AuditLog.aggregate([{$group:{_id:'$category',count:{$sum:1}}},{$sort:{count:-1}}]),
      AuditLog.aggregate([{$group:{_id:'$severity',count:{$sum:1}}}]),
    ]);
    const recent = await AuditLog.find().populate('performedBy','displayName').sort({createdAt:-1}).limit(10);
    res.json({success:true,byCategory,bySeverity,recent});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

module.exports = router;
