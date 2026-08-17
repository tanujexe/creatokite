const express = require('express');
const { Transaction, Campaign, User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();
router.use(auth, adminOnly);

router.get('/', async (req,res) => {
  try {
    const [totalRevenue,byType,monthly,topCampaigns,pendingPayouts] = await Promise.all([
      Transaction.aggregate([{$match:{status:'success'}},{$group:{_id:null,total:{$sum:'$amount'}}}]),
      Transaction.aggregate([{$group:{_id:'$type',total:{$sum:'$amount'},count:{$sum:1}}}]),
      Transaction.aggregate([{$match:{status:'success'}},{$group:{_id:{year:{$year:'$createdAt'},month:{$month:'$createdAt'}},revenue:{$sum:'$amount'}}},{$sort:{'_id.year':-1,'_id.month':-1}},{$limit:12}]),
      Campaign.find({workflowStatus:'completed'}).select('title budget brandName').sort({budget:-1}).limit(10),
      Transaction.countDocuments({status:'pending',type:'payout'}),
    ]);
    const revenueMap={};
    byType.forEach(t=>{revenueMap[t._id]={total:t.total,count:t.count};});
    res.json({success:true,totalRevenue:totalRevenue[0]?.total||0,byType:revenueMap,monthly,topCampaigns,pendingPayouts});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

router.get('/metrics', async (req,res) => {
  try {
    const now=new Date();
    const startOfMonth=new Date(now.getFullYear(),now.getMonth(),1);
    const [thisMonth,allTime,creatorPayouts] = await Promise.all([
      Transaction.aggregate([{$match:{status:'success',createdAt:{$gte:startOfMonth}}},{$group:{_id:null,total:{$sum:'$amount'}}}]),
      Transaction.aggregate([{$match:{status:'success'}},{$group:{_id:null,total:{$sum:'$amount'}}}]),
      Transaction.aggregate([{$match:{type:'payout',status:'success'}},{$group:{_id:null,total:{$sum:'$amount'}}}]),
    ]);
    res.json({success:true,metrics:{thisMonth:thisMonth[0]?.total||0,allTime:allTime[0]?.total||0,creatorPayouts:creatorPayouts[0]?.total||0}});
  } catch(e){res.status(500).json({success:false,message:e.message});}
});

module.exports = router;
