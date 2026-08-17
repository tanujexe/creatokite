const express = require('express');
const { auth, adminOnly, superadminOnly, userHasRole } = require('../middleware/auth');
const {
  User,
  Campaign,
  Notification,
  Transaction,
  Activity,
  Submission,
  Lesson,
  LessonCompletion,
  Post,
  Comment,
  SystemLog
} = require('../models');
const { awardXP, getLevelTitle, awardBadge } = require('../services/scoring');

const router = express.Router();

const notify = async (userId, type, title, body, link='') => {
  try { await Notification.create({ user:userId, type, title, body, link }); } catch(e){}
};

/* ==========================================
   1. ACTIVITY HUB & CHALLENGES
   ========================================== */

/* GET /api/ecosystem/activities */
router.get('/activities', auth, async (req, res) => {
  try {
    const { type, isChallenge } = req.query;
    const q = {};
    if (!userHasRole(req.user, 'admin', 'superadmin')) {
      q.isActive = true;
    }
    if (type) q.type = type;
    if (isChallenge !== undefined) q.isChallenge = isChallenge === 'true';

    const activities = await Activity.find(q).sort({ createdAt: -1 });

    // Fetch user's submissions to mark completed ones
    const userSubmissions = await Submission.find({ creator: req.user._id });
    const submissionMap = {};
    userSubmissions.forEach(s => {
      submissionMap[s.activity.toString()] = s;
    });

    const result = activities.map(act => {
      const obj = act.toObject();
      const sub = submissionMap[act._id.toString()];
      obj.status = sub ? sub.status : 'none'; // 'none', 'pending', 'approved', 'rejected'
      if (sub) {
        obj.submission = {
          status: sub.status,
          rating: sub.rating,
          adminFeedback: sub.adminFeedback
        };
      }
      return obj;
    });

    res.json({ success: true, activities: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/activities/:id/submit */
router.post('/activities/:id/submit', auth, async (req, res) => {
  try {
    if (!userHasRole(req.user, 'creator')) return res.status(403).json({ success: false, message: 'Creators only' });
    const { submissionUrl = '', submissionNote = '' } = req.body;

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    // Check if duplicate submission
    const existing = await Submission.findOne({ creator: req.user._id, activity: activity._id, status: { $in: ['pending', 'approved'] } });
    if (existing) return res.status(400).json({ success: false, message: 'Submission already exists for this activity' });

    const submission = await Submission.create({
      creator: req.user._id,
      activity: activity._id,
      submissionUrl,
      submissionNote,
      status: 'pending'
    });

    // Notify admins of new submission
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id');
    await Promise.all(admins.map(a =>
      notify(a._id, 'submission_created', '📥 New Activity Submission', `${req.user.displayName} submitted: "${activity.title}"`, '/admin/dashboard')
    ));

    res.status(201).json({ success: true, submission });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/ecosystem/submissions */
router.get('/submissions', auth, async (req, res) => {
  try {
    const q = (userHasRole(req.user, 'creator') && !userHasRole(req.user, 'admin', 'superadmin')) ? { creator: req.user._id } : {};
    const submissions = await Submission.find(q)
      .populate('activity')
      .populate('creator', 'displayName email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, submissions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


/* ==========================================
   2. CREATOR ACADEMY
   ========================================== */

/* GET /api/ecosystem/academy/lessons */
router.get('/academy/lessons', auth, async (req, res) => {
  try {
    let lessons = await Lesson.find().sort({ category: 1, sortOrder: 1 });
    
    // Auto-seed V3 Academy Lessons if empty
    if (!lessons || lessons.length === 0) {
      const seedLessons = [
        {
          title: 'Mastering Instagram Algorithm 2026',
          category: 'Instagram Growth',
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          content: 'Understand watch time, saves, shares, and audio trending velocity to max out reach.',
          xpReward: 100,
          coinReward: 25,
          sortOrder: 1
        },
        {
          title: 'High-Converting Reel Editing Masterclass',
          category: 'Reel Editing',
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          content: 'Learn fast-paced hook editing, sound design, and text placement for viral reels.',
          xpReward: 120,
          coinReward: 30,
          sortOrder: 1
        },
        {
          title: 'Brand Pitching & Negotiation SOP',
          category: 'Brand Collaboration',
          type: 'quiz',
          content: 'How to pitch brands on CreatoKite and secure high-paying campaign assignments.',
          quizQuestions: [
            { question: 'What is CreatoKite core model?', options: ['Public Marketplace', 'AI Creator Ops Platform', 'Ad Network'], correctAnswer: 1 },
            { question: 'Who directly communicates with brands?', options: ['Creators', 'CreatoKite Admin/Team', 'No one'], correctAnswer: 1 }
          ],
          xpReward: 150,
          coinReward: 40,
          sortOrder: 1
        },
        {
          title: 'AI Tools for Creators & Content Automation',
          category: 'AI Tools',
          type: 'article',
          content: 'Leverage AI script writing, caption generation, and automated thumbnail creation.',
          xpReward: 80,
          coinReward: 20,
          sortOrder: 1
        }
      ];
      lessons = await Lesson.insertMany(seedLessons);
    }

    // Fetch completed lessons for the user safely
    const completed = await LessonCompletion.find({ creator: req.user._id });
    const completedSet = new Set(completed.filter(c => c && c.lesson).map(c => c.lesson.toString()));

    const result = lessons.map(les => {
      const obj = les.toObject();
      obj.isCompleted = completedSet.has(les._id.toString());
      return obj;
    });

    res.json({ success: true, lessons: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/ecosystem/academy/lessons/:id */
router.get('/academy/lessons/:id', auth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, lesson });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/academy/lessons/:id/complete */
router.post('/academy/lessons/:id/complete', auth, async (req, res) => {
  try {
    if (!userHasRole(req.user, 'creator')) return res.status(403).json({ success: false, message: 'Creators only' });
    const { quizAnswers = [] } = req.body;

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

    // Check if already completed
    const existing = await LessonCompletion.findOne({ creator: req.user._id, lesson: lesson._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already completed this lesson' });

    // Validate quiz if lesson type is quiz
    if (lesson.type === 'quiz' && lesson.quizQuestions?.length) {
      if (quizAnswers.length !== lesson.quizQuestions.length) {
        return res.status(400).json({ success: false, message: 'Please answer all questions' });
      }
      for (let i = 0; i < lesson.quizQuestions.length; i++) {
        if (quizAnswers[i] !== lesson.quizQuestions[i].correctAnswerIndex) {
          return res.status(400).json({ success: false, message: 'Incorrect answers. Please try again!' });
        }
      }
    }

    // Record completion
    await LessonCompletion.create({
      creator: req.user._id,
      lesson: lesson._id,
      category: lesson.category
    });

    // Award XP (to academyXp category) and Coins
    const xpReward = lesson.xpReward || 50;
    const coinReward = lesson.coinReward || 20;
    
    await awardXP(req.user._id, xpReward, 'academy');
    
    await User.findByIdAndUpdate(req.user._id, { $inc: { coins: coinReward } });

    // Check course category completion & award certification
    const lessonsInCat = await Lesson.countDocuments({ category: lesson.category });
    const userCompletionsInCat = await LessonCompletion.countDocuments({ creator: req.user._id, category: lesson.category });

    let newCertificate = null;
    if (lessonsInCat > 0 && lessonsInCat === userCompletionsInCat) {
      const certName = `${lesson.category} Certificate`;
      const url = `https://creatokite.com/certificates/${req.user._id}/${lesson.category.toLowerCase().replace(/\s+/g, '-')}`;
      
      const certObj = { name: certName, courseName: lesson.category, url, earnedAt: new Date() };
      
      await User.findByIdAndUpdate(req.user._id, {
        $push: { certificates: certObj }
      });
      newCertificate = certObj;

      await awardBadge(req.user, 'Academy Graduate');
      await notify(req.user._id, 'certification_earned', '🎓 Certificate Unlocked!', `You graduated the ${lesson.category} path and earned your certificate!`, '/creator/profile');
    }

    res.json({ success: true, message: 'Lesson completed successfully!', xpReward, coinReward, newCertificate });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


/* ==========================================
   3. COMMUNITY HUB
   ========================================== */

/* GET /api/ecosystem/community/posts */
router.get('/community/posts', auth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const q = {};
    if (category) q.category = category;
    if (search) q.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }];

    const posts = await Post.find(q)
      .populate('creator', 'displayName avatar handle rank role')
      .sort({ isAnnouncement: -1, createdAt: -1 })
      .limit(50);

    res.json({ success: true, posts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/community/posts */
router.post('/community/posts', auth, async (req, res) => {
  try {
    const { title, content, category = 'General', pollOptions = [], isAnnouncement = false } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content required' });

    // SuperAdmin / Admin only can make announcements
    const announceFlag = isAnnouncement && ['admin', 'superadmin'].includes(req.user.role);

    const post = await Post.create({
      creator: req.user._id,
      title,
      content,
      category,
      isAnnouncement: announceFlag,
      pollOptions: pollOptions.map(o => ({ text: o, votes: [] }))
    });

    // Award Community XP (10 XP, creators only, max 1 post daily XP)
    if (userHasRole(req.user, 'creator')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const postCountToday = await Post.countDocuments({ creator: req.user._id, createdAt: { $gte: today } });
      if (postCountToday <= 1) {
        await awardXP(req.user._id, 10, 'community');
        await awardBadge(req.user, 'Community Contributor');
      }
    }

    res.status(201).json({ success: true, post });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/community/posts/:id/like */
router.post('/community/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const likeIdx = post.likes.indexOf(req.user._id);
    if (likeIdx > -1) {
      post.likes.splice(likeIdx, 1);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/community/posts/:id/vote */
router.post('/community/posts/:id/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Remove user vote from all options
    post.pollOptions.forEach(opt => {
      const voteIdx = opt.votes.indexOf(req.user._id);
      if (voteIdx > -1) opt.votes.splice(voteIdx, 1);
    });

    // Add vote to optionIndex
    if (optionIndex !== undefined && optionIndex >= 0 && optionIndex < post.pollOptions.length) {
      post.pollOptions[optionIndex].votes.push(req.user._id);
    }
    await post.save();
    res.json({ success: true, pollOptions: post.pollOptions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/ecosystem/community/posts/:id/comments */
router.get('/community/posts/:id/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('sender', 'displayName avatar rank role')
      .sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/community/posts/:id/comments */
router.post('/community/posts/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({
      post: post._id,
      sender: req.user._id,
      text
    });

    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    // Award comment XP (5 XP, max 3 times daily)
    if (userHasRole(req.user, 'creator')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const commentsToday = await Comment.countDocuments({ sender: req.user._id, createdAt: { $gte: today } });
      if (commentsToday <= 3) {
        await awardXP(req.user._id, 5, 'community');
      }
    }

    res.status(201).json({ success: true, comment });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


/* ══════════════════════════════════════════════════════
   COMMUNITY MANAGEMENT — Admin / Team endpoints (NEW V2.5)
   ══════════════════════════════════════════════════════ */

/* DELETE /api/ecosystem/community/posts/:id */
router.delete('/community/posts/:id', auth, async (req, res) => {
  try {
    const isAdminOrTeam = userHasRole(req.user, 'admin', 'superadmin', 'team_member');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    // Owner or admin/team can delete
    if (!isAdminOrTeam && post.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    post.isDeleted = true;
    await post.save();
    res.json({ success: true, message: 'Post deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* PATCH /api/ecosystem/community/posts/:id/pin */
router.patch('/community/posts/:id/pin', auth, async (req, res) => {
  try {
    if (!userHasRole(req.user, 'admin', 'superadmin'))
      return res.status(403).json({ success: false, message: 'Admin only' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ success: true, isPinned: post.isPinned, message: post.isPinned ? 'Post pinned' : 'Post unpinned' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* PATCH /api/ecosystem/community/posts/:id/announce */
router.patch('/community/posts/:id/announce', auth, async (req, res) => {
  try {
    if (!userHasRole(req.user, 'admin', 'superadmin'))
      return res.status(403).json({ success: false, message: 'Admin only' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.isAnnouncement = !post.isAnnouncement;
    await post.save();
    res.json({ success: true, isAnnouncement: post.isAnnouncement });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* DELETE /api/ecosystem/community/comments/:id */
router.delete('/community/comments/:id', auth, async (req, res) => {
  try {
    const isAdminOrTeam = userHasRole(req.user, 'admin', 'superadmin', 'team_member');
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (!isAdminOrTeam && comment.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await Comment.findByIdAndDelete(req.params.id);
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/ecosystem/community/admin-posts — all posts for moderation (admin/team) */
router.get('/community/admin-posts', auth, async (req, res) => {
  try {
    if (!userHasRole(req.user, 'admin', 'superadmin', 'team_member'))
      return res.status(403).json({ success: false, message: 'Admin or Team access required' });
    const { search, page=1, limit=20, space } = req.query;
    const q = { isDeleted: { $ne: true } };
    if (search) q.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }];
    if (space) q.space = space;
    const [posts, total] = await Promise.all([
      Post.find(q)
        .populate('creator', 'displayName avatar handle rank role roles')
        .sort({ isPinned: -1, isAnnouncement: -1, createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Post.countDocuments(q),
    ]);
    res.json({ success: true, posts, total, pages: Math.ceil(total / +limit) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/ecosystem/community/analytics — community stats (admin/team) */
router.get('/community/analytics', auth, async (req, res) => {
  try {
    if (!userHasRole(req.user, 'admin', 'superadmin', 'team_member'))
      return res.status(403).json({ success: false, message: 'Admin or Team access required' });
    const today = new Date(); today.setHours(0,0,0,0);
    const week = new Date(today); week.setDate(week.getDate() - 7);
    const [totalPosts, totalComments, postsToday, postsThisWeek, topCreators] = await Promise.all([
      Post.countDocuments({ isDeleted: { $ne: true } }),
      Comment.countDocuments({}),
      Post.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: today } }),
      Post.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: week } }),
      Post.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$creator', postCount: { $sum: 1 }, totalLikes: { $sum: { $size: '$likes' } } } },
        { $sort: { postCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { postCount: 1, totalLikes: 1, 'user.displayName': 1, 'user.avatar': 1 } },
      ]),
    ]);
    res.json({ success: true, stats: { totalPosts, totalComments, postsToday, postsThisWeek }, topCreators });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ==========================================
   4. DYNAMIC LEADERBOARD SYSTEM (never store ranks)
   ========================================== */

/* GET /api/ecosystem/leaderboards */
router.get('/leaderboards', auth, async (req, res) => {
  try {
    const { tab = 'influence', page = 1, limit = 10 } = req.query;
    const filter = { role: 'creator', isBanned: false };

    const isAdmin = ['admin', 'superadmin', 'team_member'].includes(req.user?.role) ||
      (Array.isArray(req.user?.roles) && req.user.roles.some(r => ['admin', 'superadmin', 'team_member'].includes(r)));

    // Creators only see Top 10; Admins can paginate through all
    const effectiveLimit = isAdmin ? Math.min(Math.max(+limit || 10, 1), 100) : 10;
    const effectivePage = isAdmin ? Math.max(+page || 1, 1) : 1;

    let sortOption = {};
    if (tab === 'influence') {
      // Sort by creatorScore (reach, engagement, platforms)
      sortOption = { creatorScore: -1 };
    } else if (tab === 'activity') {
      sortOption = { xp: -1 };
    } else if (tab === 'campaign') {
      sortOption = { completedCampaigns: -1 };
    } else if (tab === 'reputation') {
      sortOption = { reputationScore: -1 };
    } else if (tab === 'trust') {
      sortOption = { 'trustScore.overall': -1 };
    } else if (tab === 'academy') {
      sortOption = { academyXp: -1 };
    } else if (tab === 'community') {
      sortOption = { communityXp: -1 };
    } else if (tab === 'referral') {
      sortOption = { referralCount: -1 };
    }

    const creators = await User.find(filter)
      .select('displayName handle avatar niche rank level creatorScore xp activityXp academyXp campaignXp communityXp trustScore reputationScore creatorPowerScore completedCampaigns platforms referralCount')
      .sort(sortOption)
      .skip((effectivePage - 1) * effectiveLimit)
      .limit(effectiveLimit);

    const dbTotal = await User.countDocuments(filter);
    const total = isAdmin ? dbTotal : Math.min(dbTotal, 10);
    const pages = isAdmin ? Math.ceil(dbTotal / effectiveLimit) : 1;

    res.json({
      success: true,
      creators,
      total,
      pages,
      page: effectivePage,
      isTop10Only: !isAdmin
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/ecosystem/hall-of-fame */
router.get('/hall-of-fame', auth, async (req, res) => {
  try {
    // Return top creators in different disciplines dynamically
    const filter = { role: 'creator', isBanned: false };
    const [topXP, topReputation, topTrust, topCampaigns] = await Promise.all([
      User.findOne(filter).sort({ xp: -1 }).select('displayName avatar handle niche level xp'),
      User.findOne(filter).sort({ reputationScore: -1 }).select('displayName avatar handle niche rank reputationScore'),
      User.findOne(filter).sort({ 'trustScore.overall': -1 }).select('displayName avatar handle niche rank trustScore'),
      User.findOne(filter).sort({ completedCampaigns: -1 }).select('displayName avatar handle niche completedCampaigns')
    ]);

    res.json({
      success: true,
      hof: {
        topXP,
        topReputation,
        topTrust,
        topCampaigns,
        topCreatorOfMonth: topReputation, // Map dynamically
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


/* ==========================================
   5. REFERRAL PROGRAM
   ========================================== */

/* GET /api/ecosystem/referrals */
router.get('/referrals', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user.referralCode) {
      // Create referral code if missing
      user.referralCode = `CK-${user.displayName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await user.save({ validateBeforeSave: false });
    }

    const referredUsers = await User.find({ referredBy: user._id })
      .select('displayName handle role avatar createdAt level');

    res.json({
      success: true,
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      referredUsers
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/referrals/redeem */
router.post('/referrals/redeem', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Referral code required' });

    const referrer = await User.findOne({ referralCode: code.toUpperCase().trim() });
    if (!referrer) return res.status(404).json({ success: false, message: 'Invalid referral code' });

    if (referrer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot refer yourself' });
    }

    const me = await User.findById(req.user._id);
    if (me.referredBy) return res.status(400).json({ success: false, message: 'Referral code already redeemed' });

    me.referredBy = referrer._id;
    await me.save({ validateBeforeSave: false });

    // Update referrer statistics
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    
    // Award Referrer 100 XP + 50 Creator Coins
    await awardXP(referrer._id, 100, 'activity');
    referrer.coins = (referrer.coins || 0) + 50;
    await awardBadge(referrer, 'Referral Master');
    await referrer.save({ validateBeforeSave: false });

    // Notify Referrer
    await notify(referrer._id, 'referral_success', '👥 New Referral Registered!', `${req.user.displayName} signed up using your code! +100 XP`, '/creator/profile');

    res.json({ success: true, message: 'Referral code redeemed successfully!' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


/* ==========================================
   6. CREATOR COINS SHOP
   ========================================== */

const SHOP_ITEMS = [
  { id: 'profile_boost', name: 'Profile Visibility Boost', desc: 'Prioritize your profile on brand searches for 7 days', cost: 150, category: 'Featured' },
  { id: 'premium_theme', name: 'Premium Theme Style', desc: 'Unlock customizable dark glassmorphism card theme skins', cost: 300, category: 'Cosmetic' },
  { id: 'feature_creator', name: 'Feature in Leaderboards', desc: 'Displays a star badge next to your rank for 14 days', cost: 250, category: 'Cosmetic' },
];

/* GET /api/ecosystem/coins/shop */
router.get('/coins/shop', auth, (req, res) => {
  res.json({ success: true, shopItems: SHOP_ITEMS, userCoins: req.user.coins || 0 });
});

/* POST /api/ecosystem/coins/purchase */
router.post('/coins/purchase', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const me = await User.findById(req.user._id);
    if ((me.coins || 0) < item.cost) {
      return res.status(400).json({ success: false, message: 'Insufficient Creator Coins' });
    }

    me.coins = me.coins - item.cost;
    
    // Grant benefit
    if (itemId === 'profile_boost') {
      me.creatorPowerScore = Math.min(100, (me.creatorPowerScore || 70) + 5);
      await User.findByIdAndUpdate(req.user._id, { $push: { trophies: { name: 'Featured Booster', icon: '🚀', earnedAt: new Date() } } });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $push: { trophies: { name: item.name, icon: '💎', earnedAt: new Date() } } });
    }

    await me.save({ validateBeforeSave: false });

    res.json({ success: true, message: `Successfully purchased ${item.name}!`, userCoins: me.coins });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


/* ==========================================
   7. AI ECOSYSTEM RECOMMENDATION ENGINE
   ========================================== */

/* GET /api/ecosystem/recommendations */
router.get('/recommendations', auth, async (req, res) => {
  try {
    if (!userHasRole(req.user, 'creator')) return res.status(403).json({ success: false, message: 'Creators only' });

    const niche = req.user.niche || 'Tech';

    // 1. Recommended Campaigns in Niche
    const campaigns = await Campaign.find({ niche, status: 'open', deadline: { $gte: new Date() } })
      .select('title budget platforms brandName deliverables deadline')
      .limit(3);

    // 2. Recommended Activities to complete
    const subList = await Submission.find({ creator: req.user._id }).select('activity');
    const compIds = subList.map(s => s.activity.toString());
    const activities = await Activity.find({ _id: { $nin: compIds }, isActive: true })
      .select('title description type xpReward isChallenge')
      .limit(3);

    // 3. Recommended Academy Lesson
    const complLessons = await LessonCompletion.find({ creator: req.user._id }).select('lesson');
    const complLessonIds = complLessons.map(l => l.lesson.toString());
    const lesson = await Lesson.findOne({ _id: { $nin: complLessonIds } })
      .select('title category type xpReward')
      .sort({ sortOrder: 1 });

    // 4. Collaborative Connections (Same niche top creators)
    const connections = await User.find({ role: 'creator', niche, _id: { $ne: req.user._id } })
      .select('displayName avatar handle rank level')
      .sort({ xp: -1 })
      .limit(3);

    res.json({
      success: true,
      recommendations: {
        campaigns,
        activities,
        lesson: lesson || null,
        connections
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


/* ==========================================
   8. ADMIN / SUPERADMIN DASHBOARD ACTIONS
   ========================================== */

/* GET /api/admin/submissions — List activity submissions for review */
const { teamOrAdmin } = require('../middleware/auth');
router.get('/admin/submissions', auth, teamOrAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    const submissions = await Submission.find(query)
      .populate('activity')
      .populate('creator', 'displayName email avatar niche handle socialUrls')
      .populate('reviewedBy', 'displayName avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, submissions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/admin/submissions/:id/review — Review activity submissions */
router.post('/admin/submissions/:id/review', auth, adminOnly, async (req, res) => {
  try {
    const { status, adminFeedback = '', rating = 5, customXp, customCoins } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const sub = await Submission.findById(req.params.id).populate('activity');
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.status !== 'pending') return res.status(400).json({ success: false, message: 'Submission already reviewed' });

    sub.status = status;
    sub.adminFeedback = adminFeedback;
    sub.rating = +rating || 5;
    sub.reviewedBy = req.user._id;
    sub.reviewedAt = new Date();
    await sub.save();

    const activity = sub.activity;

    if (status === 'approved') {
      // Award activity XP (awards category 'activity')
      const xpAward = customXp !== undefined && customXp !== '' ? +customXp : (activity.xpReward || 30);
      const coinReward = customCoins !== undefined && customCoins !== '' ? +customCoins : (activity.coinReward || 10);
      
      await awardXP(sub.creator, xpAward, 'activity');
      await User.findByIdAndUpdate(sub.creator, { $inc: { coins: coinReward } });

      // Award Badge if specified in activity
      if (activity.badgeReward) {
        const creator = await User.findById(sub.creator);
        await awardBadge(creator, activity.badgeReward);
        await creator.save({ validateBeforeSave: false });
      }

      await awardBadge(await User.findById(sub.creator), 'First Activity');

      await notify(sub.creator, 'activity_approved', '✅ Submission Approved!', `Your submission for "${activity.title}" was approved with a ${rating}/5 rating! +${xpAward} XP +${coinReward} Coins`, '/creator/profile');
    } else {
      await notify(sub.creator, 'activity_rejected', '❌ Submission Rejected', `Submission for "${activity.title}" rejected. Feedback: "${adminFeedback}"`, '/creator/profile');
    }

    // Log superadmin action
    await SystemLog.create({
      action: `REVIEW_ACTIVITY_SUBMISSION`,
      performedBy: req.user._id,
      details: `Submission of user ${sub.creator} for activity "${activity.title}" reviewed as ${status}. Rating: ${rating}/5.`
    });

    res.json({ success: true, submission: sub });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/ecosystem/admin/activities — Create new activity (Admin/SuperAdmin) */
router.post('/admin/activities', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, type, xpReward, coinReward, badgeReward, targetUrl, isChallenge, isActive } = req.body;
    if (!title || !description || !type) {
      return res.status(400).json({ success: false, message: 'Title, description, and type are required' });
    }
    const activity = await Activity.create({
      title, description, type,
      xpReward: +xpReward || 30,
      coinReward: +coinReward || 10,
      badgeReward: badgeReward || '',
      targetUrl: targetUrl || '',
      isChallenge: isChallenge === true || isChallenge === 'true',
      isActive: isActive !== false && isActive !== 'false'
    });
    
    await SystemLog.create({
      action: 'CREATE_ACTIVITY',
      performedBy: req.user._id,
      details: `Created new activity: "${title}" (${type})`
    });

    res.status(201).json({ success: true, activity });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* PUT /api/ecosystem/admin/activities/:id — Edit activity (Admin/SuperAdmin) */
router.put('/admin/activities/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, type, xpReward, coinReward, badgeReward, targetUrl, isChallenge, isActive } = req.body;
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    if (title !== undefined) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (type !== undefined) activity.type = type;
    if (xpReward !== undefined) activity.xpReward = +xpReward;
    if (coinReward !== undefined) activity.coinReward = +coinReward;
    if (badgeReward !== undefined) activity.badgeReward = badgeReward;
    if (targetUrl !== undefined) activity.targetUrl = targetUrl;
    if (isChallenge !== undefined) activity.isChallenge = isChallenge === true || isChallenge === 'true';
    if (isActive !== undefined) activity.isActive = isActive === true || isActive === 'true';

    await activity.save();

    await SystemLog.create({
      action: 'UPDATE_ACTIVITY',
      performedBy: req.user._id,
      details: `Updated activity: "${activity.title}"`
    });

    res.json({ success: true, activity });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* DELETE /api/ecosystem/admin/activities/:id — Delete activity (Admin/SuperAdmin) */
router.delete('/admin/activities/:id', auth, adminOnly, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    await SystemLog.create({
      action: 'DELETE_ACTIVITY',
      performedBy: req.user._id,
      details: `Deleted activity: "${activity.title}"`
    });

    res.json({ success: true, message: 'Activity successfully deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /api/admin/overrides — Direct overrides of coins, bans, and values (SuperAdmin only) */
router.post('/admin/overrides', auth, superadminOnly, async (req, res) => {
  try {
    const { userId, xp, coins, role, isBanned, banReason } = req.body;
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const updates = {};
    if (xp !== undefined) updates.xp = +xp;
    if (coins !== undefined) updates.coins = +coins;
    if (role !== undefined) updates.role = role;
    if (isBanned !== undefined) {
      updates.isBanned = isBanned === 'true' || isBanned === true;
      updates.banReason = banReason || '';
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
    
    // Log override
    await SystemLog.create({
      action: 'SUPERADMIN_OVERRIDE',
      performedBy: req.user._id,
      details: `SuperAdmin overrode user values for ${updated.displayName} (${updated.email}). Keys: ${Object.keys(updates).join(', ')}`
    });

    res.json({ success: true, user: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/admin/system-logs — Audit log view (SuperAdmin only) */
router.get('/admin/system-logs', auth, superadminOnly, async (req, res) => {
  try {
    const logs = await SystemLog.find()
      .populate('performedBy', 'displayName email role')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, logs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /api/admin/revenue — Platform Revenue and analytics distributions (SuperAdmin only) */
router.get('/admin/revenue', auth, superadminOnly, async (req, res) => {
  try {
    // Analytics & Revenue pipelines
    const campaignsCount = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'open' });
    
    // Sum budgets to compute mock commission
    const totalSpentAggr = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);
    const totalSpent = totalSpentAggr[0]?.total || 0;
    const platformCommission = totalSpent * 0.10; // 10% platform fee commission

    // User distributions
    const totalUsers = await User.countDocuments();
    const superadminsCount = await User.countDocuments({ role: 'superadmin' });
    const adminsCount = await User.countDocuments({ role: 'admin' });
    const brandsCount = await User.countDocuments({ role: 'brand' });
    const creatorsCount = await User.countDocuments({ role: 'creator' });

    // Activity completions
    const submissionsCount = await Submission.countDocuments();
    const approvedSubmissions = await Submission.countDocuments({ status: 'approved' });

    // Academy statistics
    const lessonsCount = await Lesson.countDocuments();
    const completionsCount = await LessonCompletion.countDocuments();

    res.json({
      success: true,
      stats: {
        campaignsCount,
        activeCampaigns,
        totalSpent,
        platformCommission,
        users: {
          totalUsers,
          superadminsCount,
          adminsCount,
          brandsCount,
          creatorsCount
        },
        activities: {
          submissionsCount,
          approvedSubmissions
        },
        academy: {
          lessonsCount,
          completionsCount
        }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
