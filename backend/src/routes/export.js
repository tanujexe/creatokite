const express = require('express');
const { User, Campaign, Task, Notification, Transaction } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();
router.use(auth, adminOnly);

const toCSV = (rows, keys) => [
  keys.join(','),
  ...rows.map(r => keys.map(k => JSON.stringify(String(r[k]??'').replace(/"/g,'""'))).join(',')),
].join('\n');

/* GET /api/export/:type?format=json|csv */
router.get('/:type', async (req, res) => {
  const { type } = req.params;
  const fmt = req.query.format || 'json';

  try {
    let data = [], filename = type, keys = [];

    if (type === 'users') {
      data = await User.find({ isDeleted:{$ne:true} }).select('-password -refreshToken').lean();
      keys = ['displayName','email','role','niche','creatorScore','verificationStatus','crmStatus','totalCampaigns','createdAt'];
    } else if (type === 'campaigns') {
      data = await Campaign.find({ isDeleted:{$ne:true} }).populate('brand','displayName companyName email').lean();
      keys = ['title','brandName','niche','budget','workflowStatus','status','deadline','createdAt'];
    } else if (type === 'tasks') {
      data = await Task.find({ isDeleted:{$ne:true} }).lean();
      keys = ['title','status','priority','dueDate','createdAt'];
    } else if (type === 'transactions') {
      data = await Transaction.find().lean();
      keys = ['type','amount','currency','status','createdAt'];
    } else {
      return res.status(400).json({ success:false, message:'Invalid type. Use: users|campaigns|tasks|transactions' });
    }

    if (fmt === 'csv') {
      const flat = data.map(d => {
        const out = {};
        keys.forEach(k => {
          let v = d[k];
          if (v instanceof Date || (typeof v === 'string' && /^\d{4}-/.test(v))) v = new Date(v).toLocaleDateString();
          if (typeof v === 'object') v = JSON.stringify(v);
          out[k] = v ?? '';
        });
        return out;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}-${Date.now()}.csv"`);
      return res.send(toCSV(flat, keys));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-${Date.now()}.json"`);
    res.json({ success:true, type, count:data.length, exportedAt:new Date(), data });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
