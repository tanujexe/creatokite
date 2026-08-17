const express = require('express');
const { User, Campaign, Task, Post } = require('../models');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.use(auth);

router.get('/', async (req,res) => {
  try {
    const {q,type} = req.query;
    if(!q||q.trim().length<2) return res.status(400).json({success:false,message:'Query min 2 chars'});
    const rx={$regex:q.trim(),$options:'i'};
    const roles=req.user.roles?.length?req.user.roles:[req.user.role];
    const isAdminOrTeam=roles.some(r=>['admin','superadmin','team_member'].includes(r));
    const results={};

    if(!type||type==='creators'){
      if(isAdminOrTeam){
        results.creators=await User.find({$or:[{role:'creator'},{roles:'creator'}],$or:[{displayName:rx},{email:rx},{niche:rx}]})
          .select('displayName email avatar niche creatorScore rank verificationStatus crmStatus').limit(8);
      }
    }
    if(!type||type==='brands'){
      if(isAdminOrTeam){
        results.brands=await User.find({$or:[{role:'brand'},{roles:'brand'}],$or:[{displayName:rx},{companyName:rx},{email:rx}]})
          .select('displayName email companyName avatar industry brandCrmStatus').limit(8);
      }
    }
    if(!type||type==='campaigns'){
      results.campaigns=await Campaign.find({$or:[{title:rx},{description:rx},{niche:rx}]})
        .select('title niche budget workflowStatus deadline brandName').limit(8);
    }
    if((!type||type==='tasks')&&isAdminOrTeam){
      results.tasks=await Task.find({$or:[{title:rx},{description:rx}],isArchived:false})
        .select('title status priority dueDate').limit(8);
    }
    if(!type||type==='posts'){
      results.posts=await Post.find({$or:[{title:rx},{content:rx}]})
        .populate('creator','displayName avatar').select('title space createdAt').limit(8);
    }
    if((!type||type==='users')&&isAdminOrTeam){
      results.users=await User.find({$or:[{displayName:rx},{email:rx}]})
        .select('displayName email avatar role roles').limit(8);
    }
    res.json({success:true,results,query:q});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

module.exports = router;
