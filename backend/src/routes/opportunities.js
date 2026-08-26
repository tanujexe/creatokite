const express = require('express');
const { Opportunity, User } = require('../models');
const { auth, teamOrAdmin, audit } = require('../middleware/auth');

const router = express.Router();

/* GET /api/opportunities - Active published opportunities */
router.get('/', async (req, res) => {
  try {
    const { category, search, page=1, limit=12 } = req.query;
    const query = { status: 'published' };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } }
      ];
    }
    const opportunities = await Opportunity.find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate('brand', 'displayName companyName avatar');

    const total = await Opportunity.countDocuments(query);
    res.json({ success: true, opportunities, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/opportunities/admin - List all opportunities for Admin/Team */
router.get('/admin', auth, teamOrAdmin, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({})
      .sort({ createdAt: -1 })
      .populate('brand', 'displayName companyName avatar')
      .populate('createdBy', 'displayName email');

    res.json({ success: true, opportunities });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/opportunities - Create new opportunity */
router.post('/', auth, teamOrAdmin, async (req, res) => {
  try {
    const { title, description, banner, brand, brandName, category, reward, requiresAdsRights = false, deadline, applicationLink, status } = req.body;
    if (!title || !applicationLink) {
      return res.status(400).json({ success: false, message: 'Title and application link are required.' });
    }

    const opportunity = await Opportunity.create({
      title,
      description: description || '',
      banner: banner || '',
      brand: brand || undefined,
      brandName: brandName || '',
      category: category || 'ugc_hiring',
      reward: reward || '',
      requiresAdsRights: Boolean(requiresAdsRights),
      deadline: deadline ? new Date(deadline) : undefined,
      applicationLink,
      status: status || 'published',
      createdBy: req.user._id
    });

    await audit(req, 'create_opportunity', 'crm', { opportunityId: opportunity._id, title }, 'low', null, opportunity._id.toString());

    res.status(201).json({ success: true, opportunity, message: 'Opportunity published successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* PUT /api/opportunities/:id - Update opportunity */
router.put('/:id', auth, teamOrAdmin, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!opportunity) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

    await audit(req, 'update_opportunity', 'crm', { opportunityId: opportunity._id }, 'low', null, opportunity._id.toString());

    res.json({ success: true, opportunity, message: 'Opportunity updated successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* DELETE /api/opportunities/:id - Delete opportunity */
router.delete('/:id', auth, teamOrAdmin, async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opportunity) return res.status(404).json({ success: false, message: 'Opportunity not found.' });

    await audit(req, 'delete_opportunity', 'crm', { opportunityId: req.params.id }, 'low', null, req.params.id);

    res.json({ success: true, message: 'Opportunity deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
