const express = require('express');
const { KnowledgeArticle } = require('../models');
const { auth, teamOrAdmin, adminOnly } = require('../middleware/auth');
const router = express.Router();
router.use(auth);

router.get('/', async (req,res) => {
  try {
    const {category,search,page=1,limit=20} = req.query;
    const roles=req.user.roles?.length?req.user.roles:[req.user.role];
    const isAdminOrTeam=roles.some(r=>['admin','superadmin','team_member'].includes(r));
    const q={isPublished:true};
    if(!isAdminOrTeam) q.visibility={$in:['public',req.user.role]};
    if(category) q.category=category;
    if(search) q.$or=[{title:{$regex:search,$options:'i'}},{content:{$regex:search,$options:'i'}},{tags:{$in:[new RegExp(search,'i')]}}];
    const [articles,total] = await Promise.all([
      KnowledgeArticle.find(q).populate('author','displayName avatar').sort({isPinned:-1,createdAt:-1}).skip((+page-1)*+limit).limit(+limit),
      KnowledgeArticle.countDocuments(q),
    ]);
    res.json({success:true,articles,total,pages:Math.ceil(total/+limit)});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.get('/:id', async (req,res) => {
  try {
    const article = await KnowledgeArticle.findByIdAndUpdate(req.params.id,{$inc:{viewCount:1}},{new:true}).populate('author','displayName avatar');
    if(!article) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,article});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.post('/', teamOrAdmin, async (req,res) => {
  try {
    const {title,content,category='general',tags=[],visibility='team_only',isPublished=false} = req.body;
    const article = await KnowledgeArticle.create({title,content,category,tags,visibility,isPublished,author:req.user._id});
    res.status(201).json({success:true,article});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put('/:id', teamOrAdmin, async (req,res) => {
  try {
    const allowed=['title','content','category','tags','visibility','isPublished','isPinned'];
    const update={};
    allowed.forEach(k=>{if(req.body[k]!==undefined)update[k]=req.body[k];});
    const article = await KnowledgeArticle.findByIdAndUpdate(req.params.id,update,{new:true});
    if(!article) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,article});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.delete('/:id', adminOnly, async (req,res) => {
  try {
    await KnowledgeArticle.findByIdAndDelete(req.params.id);
    res.json({success:true,message:'Deleted'});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

module.exports = router;
