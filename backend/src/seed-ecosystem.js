require('dotenv').config();
const mongoose = require('mongoose');
const { Activity, Lesson, User, Post, Comment } = require('./models');

const ACADEMY_CATEGORIES = [
  'Instagram Growth',
  'Content Creation',
  'Reel Editing',
  'Video Editing',
  'Brand Collaboration',
  'Negotiation',
  'Personal Branding',
  'Marketing',
  'Communication',
  'AI Tools'
];

async function seed() {
  console.log('🌱 Connecting to database for ecosystem seeding…');
  await mongoose.connect(process.env.MONGODB_URI);

  // Clear existing
  console.log('🧹 Clearing existing Activities and Lessons…');
  await Activity.deleteMany({});
  await Lesson.deleteMany({});
  await Post.deleteMany({ category: 'Announcements' });

  // ── Seed Activities ──────────────────────────────────────
  console.log('💡 Seeding Activities & Challenges…');
  await Activity.insertMany([
    // Daily
    {
      title: 'Daily Login Check-in',
      description: 'Check in to Creatokite daily to build your streak and earn easy XP.',
      type: 'daily',
      xpReward: 5,
      coinReward: 2,
      targetUrl: '/creator/dashboard'
    },
    {
      title: 'Academy Study',
      description: 'Read at least one article or watch one video lesson today in the Academy.',
      type: 'daily',
      xpReward: 10,
      coinReward: 5,
      targetUrl: '/creator/academy'
    },
    {
      title: 'Share Community Feedback',
      description: 'Leave a comment or ask a question in the Community forum today.',
      type: 'daily',
      xpReward: 10,
      coinReward: 5,
      targetUrl: '/creator/community'
    },
    // Weekly
    {
      title: 'Demo Reel Critique Challenge',
      description: 'Submit your latest draft reel link in the community and receive review feedback.',
      type: 'weekly',
      xpReward: 100,
      coinReward: 30,
      badgeReward: 'Community Contributor',
      isChallenge: true,
      targetUrl: '/creator/community'
    },
    {
      title: 'Organic Growth Boost Challenge',
      description: 'Increase your average engagement rate by 1% over the week. Submit screenshots of insights.',
      type: 'weekly',
      xpReward: 120,
      coinReward: 40,
      isChallenge: true
    },
    // Monthly
    {
      title: 'AI Video Editing Masterclass',
      description: 'Edit a 30-second product advertisement using only AI editing assistants. Submit the final draft URL.',
      type: 'monthly',
      xpReward: 250,
      coinReward: 100,
      badgeReward: 'Elite Creator',
      isChallenge: true
    },
    {
      title: 'Brand Simulation Proposal',
      description: 'Write a full campaign simulation proposal for a major athletic brand. Showcase strategy and storyboard.',
      type: 'monthly',
      xpReward: 300,
      coinReward: 120,
      isChallenge: true
    }
  ]);

  // ── Seed Lessons ─────────────────────────────────────────
  console.log('🎓 Seeding Academy path lessons…');
  const lessons = [];
  
  ACADEMY_CATEGORIES.forEach((cat, index) => {
    // Each category gets 1-2 lessons
    lessons.push({
      title: `Fundamentals of ${cat}`,
      category: cat,
      type: 'quiz',
      content: `Welcome to the core learning module for ${cat}. In this path, we study best practices, platform algorithms, design principles, and content delivery metrics. Focus on increasing visual retention and optimizing click-through metrics.`,
      quizQuestions: [
        {
          question: `What is the most critical metric for algorithmic reach in ${cat}?`,
          options: ['Total shares and watch retention', 'Number of hashtags used', 'Clicking refresh on your dashboard', 'Adding background sound tracks'],
          correctAnswerIndex: 0
        },
        {
          question: `How should you structure the first 3 seconds of your content in ${cat}?`,
          options: ['Show a long brand introduction', 'Use an immediate visual hook to retain attention', 'Request a follow and share', 'Show detailed credits'],
          correctAnswerIndex: 1
        }
      ],
      xpReward: 50,
      coinReward: 20,
      sortOrder: 1
    });

    lessons.push({
      title: `Advanced Strategies in ${cat}`,
      category: cat,
      type: 'article',
      content: `To achieve peak creator reputation and score on Creatokite, creators must apply advanced techniques in ${cat}. Optimize audience trust, collaborate with relevant creators, audit video edits for fast visual transitions, and deliver draft workflows strictly before client deadlines. Maintain standard brand safety guidelines.`,
      assignmentPrompt: `Write a 150-word synthesis detailing how you will apply these advanced strategies for a retail campaign in ${cat}.`,
      xpReward: 70,
      coinReward: 30,
      sortOrder: 2
    });
  });

  await Lesson.insertMany(lessons);

  // ── Seed community announcements ─────────────────────────
  console.log('📢 Seeding starting announcements…');
  const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
  if (admin) {
    await Post.create({
      creator: admin._id,
      title: '🚀 Creatokite Creator Academy & Community is Live!',
      content: 'Welcome to the brand new Creatokite! Complete daily and weekly challenges in the Activity tab to increase your Level, earn XP, unlock achievements, and earn virtual Creator Coins which you can redeem in the shop!',
      category: 'General',
      isAnnouncement: true
    });
  }

  // Update existing creators' referral codes
  console.log('🔗 Seeding referral codes for creators…');
  const creators = await User.find({ role: 'creator' });
  for (const c of creators) {
    c.referralCode = `CK-${c.displayName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    c.coins = 100; // start coins
    c.xp = 600; // start level 2
    c.level = 2;
    await c.save({ validateBeforeSave: false });
  }

  console.log('🎉 Ecosystem seeding complete! Connections established.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
