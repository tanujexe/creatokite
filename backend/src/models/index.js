const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ══════════════════════════════════════════════════════════
   USER — V2.5: multi-role, CRM, soft-delete, availability
   ══════════════════════════════════════════════════════════ */
const userSchema = new mongoose.Schema({
  displayName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  password: { type: String, default: '' },

  /* V1 compat */
  role: { type: String, enum: ['creator', 'brand', 'admin', 'superadmin', 'team_member'], default: 'creator' },
  /* V2 multi-role */
  roles: { type: [String], enum: ['creator', 'brand', 'admin', 'superadmin', 'team_member'], default: [] },
  activeRole: { type: String, enum: ['creator', 'brand', 'admin', 'superadmin', 'team_member', ''], default: 'creator' },

  avatar: { type: String, default: '' },
  handle: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  bio: { type: String, maxlength: 500, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  niche: { type: String, default: '' },
  subNiches: [String],
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: '' },
  emailVerificationExpires: { type: Date },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpires: { type: Date },
  provider: { type: String, default: 'local' },

  /* Creator Onboarding & CRM Specification Fields */
  city: { type: String, default: '' },
  avgViews: { type: Number, default: 0 },
  languages: { type: [String], default: ['English'] },
  isUgcCreator: { type: Boolean, default: false },
  isOnCamera: { type: Boolean, default: true },
  isBarterReady: { type: Boolean, default: true },
  audienceLocation: { type: String, default: 'India' },
  commercialRate: { type: Number, default: 0 },
  availabilityStatus: { type: String, enum: ['Available', 'Busy', 'On Leave'], default: 'Available' },
  previousCampaignsCount: { type: Number, default: 0 },
  reliabilityScore: { type: Number, default: 90, min: 0, max: 100 },
  onboardingCompleted: { type: Boolean, default: false },

  /* Social */
  platforms: {
    instagram: { followers: { type: Number, default: 0 }, engagement: { type: Number, default: 0 } },
    youtube: { followers: { type: Number, default: 0 }, engagement: { type: Number, default: 0 } },
    twitter: { followers: { type: Number, default: 0 }, engagement: { type: Number, default: 0 } },
    tiktok: { followers: { type: Number, default: 0 }, engagement: { type: Number, default: 0 } },
  },
  socialUrls: { instagram: { type: String, default: '' }, youtube: { type: String, default: '' } },

  /* CAS / Scores */
  casScore: { type: Number, default: 0 },
  casBreakdown: { engagement: { type: Number, default: 0 }, reach: { type: Number, default: 0 }, authenticity: { type: Number, default: 0 }, consistency: { type: Number, default: 0 }, growth: { type: Number, default: 0 }, brandSafety: { type: Number, default: 0 }, conversion: { type: Number, default: 0 }, contentQuality: { type: Number, default: 0 } },
  casRisk: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  casBadge: { type: String, enum: ['ELITE', 'VERIFIED', 'STANDARD', 'REVIEW'], default: 'REVIEW' },
  socialAnalyzed: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  verificationNote: { type: String, default: '' },
  analyzedAt: { type: Date },

  /* V3 Verification Tiers */
  creatorVerificationTier: { type: String, enum: ['Registered', 'Verified', 'Professional', 'Elite'], default: 'Registered' },
  brandVerificationTier: { type: String, enum: ['Registered', 'Verified', 'Trusted', 'Premium Partner'], default: 'Registered' },

  /* Gamification */
  creatorScore: { type: Number, default: 0, min: 0, max: 1000 },
  xp: { type: Number, default: 0 },
  seasonXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  rank: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'], default: 'Bronze' },
  streak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  badges: [{ name: String, icon: String, earnedAt: { type: Date, default: Date.now } }],
  dna: { reach: { type: Number, default: 0 }, engagement: { type: Number, default: 0 }, reliability: { type: Number, default: 100 }, quality: { type: Number, default: 50 }, growth: { type: Number, default: 0 }, authenticity: { type: Number, default: 80 } },

  /* Trust Score — V2.5 extended */
  trustScore: {
    overall: { type: Number, default: 70 },
    performance: { type: Number, default: 70 },
    delivery: { type: Number, default: 70 },
    growth: { type: Number, default: 70 },
    authenticity: { type: Number, default: 80 },
    fakePct: { type: Number, default: 0 },
    /* creator-specific */
    campaignCompletion: { type: Number, default: 100 },
    responseTime: { type: Number, default: 70 },
    acceptanceRate: { type: Number, default: 80 },
    submissionQuality: { type: Number, default: 70 },
    onTimeDelivery: { type: Number, default: 80 },
    /* brand-specific */
    paymentSpeed: { type: Number, default: 70 },
    communication: { type: Number, default: 70 },
    campaignSuccess: { type: Number, default: 70 },
    reliability: { type: Number, default: 70 },
  },

  totalCampaigns: { type: Number, default: 0 },
  completedCampaigns: { type: Number, default: 0 },
  declinedCampaigns: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 },
  acceptanceRate: { type: Number, default: 100 },
  avgResponseTime: { type: Number, default: 24 },
  totalEarnings: { type: Number, default: 0 },
  pendingEarnings: { type: Number, default: 0 },
  profileComplete: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },

  /* Brand */
  companyName: { type: String, default: '' },
  industry: { type: String, default: '' },
  totalSpent: { type: Number, default: 0 },
  brandRepScore: { type: Number, default: 80 },

  /* Coins / extras */
  activityXp: { type: Number, default: 0 }, academyXp: { type: Number, default: 0 },
  campaignXp: { type: Number, default: 0 }, communityXp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 }, highestStreak: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 0 }, creatorPowerScore: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, referralCount: { type: Number, default: 0 },
  certificates: [{ name: String, courseName: String, url: String, earnedAt: { type: Date, default: Date.now } }],
  trophies: [{ name: String, icon: String, earnedAt: { type: Date, default: Date.now } }],
  milestones: [{ name: String, description: String, earnedAt: { type: Date, default: Date.now } }],

  /* ════ V2.5: Creator CRM ════ */
  crmStatus: { type: String, enum: ['lead', 'contacted', 'interested', 'registered', 'verified', 'campaign_ready'], default: 'registered' },
  availability: { type: String, enum: ['available', 'busy', 'unavailable', 'vacation'], default: 'available' },
  assignedTeamMember: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastContactDate: { type: Date },
  nextFollowUpDate: { type: Date },
  followUpNotes: { type: String, default: '' },
  followUpStatus: { type: String, enum: ['pending', 'done', 'overdue'], default: 'pending' },
  crmTimeline: [{ event: String, note: { type: String, default: '' }, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now } }],

  /* ════ V2.5: Brand CRM ════ */
  brandCrmStatus: { type: String, enum: ['lead', 'contacted', 'meeting', 'negotiation', 'campaign_running', 'retained'], default: 'contacted' },
  meetingNotes: { type: String, default: '' },
  followUpDate: { type: Date },

  /* ════ V2.5: Team Member ════ */
  teamDepartment: { type: String, default: '' },
  teamTitle: { type: String, default: '' },
  promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  promotedAt: { type: Date },

  /* ════ V2.5: Granular Permissions ════ */
  permissions: {
    manage_campaigns: { type: Boolean, default: false },
    approve_creators: { type: Boolean, default: false },
    manage_brands: { type: Boolean, default: false },
    manage_team: { type: Boolean, default: false },
    send_notifications: { type: Boolean, default: false },
    view_analytics: { type: Boolean, default: false },
    manage_revenue: { type: Boolean, default: false },
  },

  /* ════ V2.5: Soft Delete ════ */
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  /* Saved filters */
  savedFilters: [{ name: String, type: { type: String, enum: ['creator', 'brand', 'campaign'] }, filters: { type: mongoose.Schema.Types.Mixed } }],

}, { timestamps: true });

/* Indexes */
userSchema.index({ creatorScore: -1 }); userSchema.index({ role: 1 }); userSchema.index({ roles: 1 });
userSchema.index({ niche: 1 }); userSchema.index({ verificationStatus: 1 }); userSchema.index({ isDeleted: 1 });
userSchema.index({ crmStatus: 1 }); userSchema.index({ brandCrmStatus: 1 }); userSchema.index({ assignedTeamMember: 1 });
userSchema.index({ availability: 1 }); userSchema.index({ nextFollowUpDate: 1 });
userSchema.index({ 'trustScore.overall': -1 });
userSchema.index({ role: 1, isDeleted: 1, casScore: -1 });
userSchema.index({ activeRole: 1, isDeleted: 1 });

userSchema.pre('validate', function (next) {
  if (!this.roles || this.roles.length === 0) {
    this.roles = [this.role || 'creator'];
  }
  if (this.isNew && this.role && this.role !== 'creator' && (this.activeRole === 'creator' || !this.activeRole)) {
    this.activeRole = this.role;
  }
  if (!this.activeRole || this.activeRole === '') {
    this.activeRole = this.role || 'creator';
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12); next();
});
userSchema.methods.comparePassword = function (c) { return bcrypt.compare(c, this.password); };
userSchema.methods.toPublicJSON = function () {
  const o = this.toObject(); delete o.password; delete o.refreshToken; delete o.__v; return o;
};
userSchema.methods.getRoles = function () { return this.roles?.length ? this.roles : [this.role || 'creator']; };
userSchema.methods.hasRole = function (r) { return this.getRoles().includes(r); };


/* ══════════════════════════════════════════════════════════
   CAMPAIGN — V2.5
   ══════════════════════════════════════════════════════════ */
const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, maxlength: 2000 },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brandName: { type: String, required: true },
  brandLogo: { type: String, default: '' },
  niche: { type: String, required: true },
  tags: [String],
  deliverables: [String],
  contentGuidelines: { type: String, default: '' },
  budget: { type: Number, required: true, min: 500 },
  budgetType: { type: String, enum: ['fixed', 'per_post', 'negotiable'], default: 'fixed' },
  requiresAdsRights: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  minFollowers: { type: Number, default: 1000 },
  minEngagement: { type: Number, default: 0 },
  platforms: [String],
  targetRegions: [String],
  totalSlots: { type: Number, default: 5, min: 1 },
  filledSlots: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'open', 'paused', 'completed', 'cancelled'], default: 'open' },
  deadline: { type: Date, required: true },
  views: { type: Number, default: 0 },
  trackingCode: { type: String, unique: true, sparse: true },
  campaignGoal: { type: String, default: '' },
  targetAudience: { type: String, default: '' },
  kpiTargets: { reach: { type: Number, default: 0 }, impressions: { type: Number, default: 0 }, engagement: { type: Number, default: 0 }, conversions: { type: Number, default: 0 } },

  /* V3 Campaign & Reward Types */
  dealType: { type: String, enum: ['paid', 'barter', 'hybrid'], default: 'paid' },
  barterProduct: { type: String, default: '' },
  barterValue: { type: Number, default: 0 },
  barterDelivery: { type: String, default: '' },
  campaignType: { type: String, enum: ['client', 'platform'], default: 'client' },
  categoryType: { type: String, enum: ['sponsored', 'contest', 'spotlight', 'recruitment', 'partner', 'community', 'internal'], default: 'sponsored' },
  rewardType: { type: String, enum: ['paid', 'reward', 'paid_reward'], default: 'paid' },
  rewardDetails: { money: { type: Number, default: 0 }, xp: { type: Number, default: 0 }, badge: { type: String, default: '' }, certificate: { type: String, default: '' }, feature: { type: String, default: '' }, gift: { type: String, default: '' }, customNote: { type: String, default: '' } },
  prProductInfo: { productName: { type: String, default: '' }, shippingRequired: { type: Boolean, default: false }, guidelines: { type: String, default: '' }, sampleUrl: { type: String, default: '' } },

  workflowStatus: {
    type: String,
    enum: ['brand_submitted', 'admin_review', 'ai_analyzing', 'creators_assigned', 'in_progress', 'revision', 'completed', 'cancelled'],
    default: 'brand_submitted',
  },

  aiAnalysis: { analyzed: { type: Boolean, default: false }, analyzedAt: { type: Date }, strategyBrief: { type: String, default: '' }, predictedReach: { type: Number, default: 0 }, predictedROI: { type: Number, default: 0 }, estimatedEngagement: { type: Number, default: 0 }, riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }, confidence: { type: Number, default: 0 } },

  /* ── V2.5: enriched creator slots ── */
  assignedCreators: [{
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentAlloc: { type: Number, default: 0 },
    aiMatchScore: { type: Number, default: 0 },
    /* V2.5 assignment lifecycle */
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'declined', 'in_progress', 'submitted', 'revision', 'approved', 'rejected', 'completed', 'published'],
      default: 'assigned',
    },
    respondedAt: { type: Date },
    submissionUrl: { type: String, default: '' },
    submissionNote: { type: String, default: '' },
    captionText: { type: String, default: '' },
    driveUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    publishedAt: { type: Date },
    revisionNote: { type: String, default: '' },
    revisionCount: { type: Number, default: 0 },
    completedAt: { type: Date },
    adminNote: { type: String, default: '' },
    submissionStatus: { type: String, enum: ['draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'published'], default: 'draft' },
  }],

  aiSuggestedCreators: [{ creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, matchScore: { type: Number, default: 0 }, reason: { type: String, default: '' } }],

  totalPostViews: { type: Number, default: 0 },
  totalPostLikes: { type: Number, default: 0 },
  estimatedReach: { type: Number, default: 0 },
  estimatedROI: { type: Number, default: 0 },
  adminReviewNote: { type: String, default: '' },
  adminReviewedAt: { type: Date },
  adminReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  /* ── V2.5: Team assignment ── */
  campaignOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  campaignManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTeamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignRoom' },

  /* Soft delete */
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

campaignSchema.index({ workflowStatus: 1 }); campaignSchema.index({ status: 1, deadline: 1 }); campaignSchema.index({ niche: 1 }); campaignSchema.index({ brand: 1 }); campaignSchema.index({ isDeleted: 1 }); campaignSchema.index({ 'assignedCreators.creator': 1 });
campaignSchema.index({ status: 1, brand: 1, isDeleted: 1, createdAt: -1 });
campaignSchema.index({ isDeleted: 1, createdAt: -1 });
campaignSchema.virtual('daysLeft').get(function () { return Math.max(0, Math.ceil((this.deadline - new Date()) / 86400000)); });
campaignSchema.virtual('assignedCount').get(function () { return this.assignedCreators?.length || 0; });
campaignSchema.virtual('completionPct').get(function () {
  const slots = this.assignedCreators || [];
  if (!slots.length) return 0;
  const done = slots.filter(s => ['approved', 'completed', 'published'].includes(s.status)).length;
  return Math.round((done / slots.length) * 100);
});


/* ════ NOTIFICATION V2.5 ════ */
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  link: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isDeleted: 1 });

notificationSchema.post('save', async function (doc) {
  try {
    if (doc.read || doc.isDeleted) return;

    const NotificationModel = mongoose.model('Notification');
    const unreadCount = await NotificationModel.countDocuments({
      user: doc.user,
      read: false,
      isDeleted: { $ne: true }
    });

    if (unreadCount === 5) {
      const User = mongoose.model('User');
      const user = await User.findById(doc.user);
      if (user && user.role === 'creator' && user.email) {
        const { sendPendingNotificationsMail } = require('../utils/sendEmail');
        await sendPendingNotificationsMail(user.email, user.displayName, unreadCount);
      }
    }
  } catch (error) {
    console.error('Error checking unread notifications for email:', error);
  }
});



/* ════ TRANSACTION ════ */
const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['payment', 'refund', 'payout', 'escrow_fund', 'escrow_release'], required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  notes: { type: String, default: '' },
}, { timestamps: true });
transactionSchema.index({ creator: 1, createdAt: -1 }); transactionSchema.index({ brand: 1, createdAt: -1 });


/* ════ CHAT / MESSAGE ════ */
const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  lastMessage: { type: String, default: '' }, lastMessageAt: { type: Date },
}, { timestamps: true });
chatSchema.index({ participants: 1 });

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, maxlength: 5000 },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  read: { type: Boolean, default: false },
}, { timestamps: true });
messageSchema.index({ chat: 1, createdAt: -1 });


/* ════ ACTIVITY / SUBMISSION / LESSON ════ */
const activitySchema = new mongoose.Schema({
  title: { type: String, required: true }, description: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly', 'special', 'community', 'learning', 'referral', 'platform'], required: true },
  xpReward: { type: Number, default: 30 }, coinReward: { type: Number, default: 10 }, badgeReward: { type: String, default: '' },
  targetUrl: { type: String, default: '' }, isChallenge: { type: Boolean, default: false }, isActive: { type: Boolean, default: true },
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  submissionUrl: { type: String, default: '' }, submissionNote: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rating: { type: Number, default: 5 }, adminFeedback: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reviewedAt: { type: Date },
}, { timestamps: true });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true }, category: { type: String, required: true },
  type: { type: String, enum: ['video', 'article', 'quiz', 'assignment'], required: true },
  content: { type: String, required: true },
  quizQuestions: [{ question: String, options: [String], correctAnswerIndex: Number }],
  assignmentPrompt: { type: String, default: '' }, xpReward: { type: Number, default: 50 },
  coinReward: { type: Number, default: 20 }, sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const lessonCompletionSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  category: { type: String, required: true }, completedAt: { type: Date, default: Date.now },
});


/* ════ COMMUNITY POST / COMMENT ════ */
const postSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true }, content: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentsCount: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  space: { type: String, enum: ['general', 'creator_hub', 'brand_hub', 'team_hub', 'announcements', 'campaign_rooms'], default: 'general' },
  pollOptions: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  isAnnouncement: { type: Boolean, default: false }, isPinned: { type: Boolean, default: false },
  /* V2.5 */
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
postSchema.index({ space: 1, createdAt: -1 }); postSchema.index({ isPinned: -1 }); postSchema.index({ isDeleted: 1 });

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const systemLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: String, default: '' }, timestamp: { type: Date, default: Date.now },
});


/* ════ TASK — V2.5 ════ */
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 2000 },
  status: { type: String, enum: ['backlog', 'todo', 'in_progress', 'review', 'done', 'blocked'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  tags: [String],
  department: { type: String, default: '' },
  outreachGoal: {
    targetDMs: { type: Number, default: 0 },
    currentDMs: { type: Number, default: 0 }
  },
  subtasks: [{ title: { type: String, required: true }, completed: { type: Boolean, default: false }, completedAt: { type: Date }, completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  comments: [{ author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, text: { type: String, required: true, maxlength: 1000 }, createdAt: { type: Date, default: Date.now } }],
  attachments: [{ name: String, url: String, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, uploadedAt: { type: Date, default: Date.now } }],
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
taskSchema.index({ assignedTo: 1, status: 1 }); taskSchema.index({ campaign: 1 }); taskSchema.index({ assignedBy: 1, createdAt: -1 }); taskSchema.index({ isDeleted: 1 });


/* ════ CAMPAIGN ROOM — V2.5 ════ */
const campaignRoomSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },
  name: { type: String, required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['brand', 'creator', 'team_member', 'admin'], default: 'creator' },
    joinedAt: { type: Date, default: Date.now },
    canPost: { type: Boolean, default: true },
  }],
  isActive: { type: Boolean, default: true },
  pinnedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomMessage' },
  lastMessageAt: { type: Date },
  settings: {
    brandCanSeeCreators: { type: Boolean, default: false },
    allowCreatorComments: { type: Boolean, default: true },
  },
}, { timestamps: true });
campaignRoomSchema.index({ 'members.user': 1 });


const roomMessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignRoom', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, maxlength: 5000 },
  type: { type: String, enum: ['text', 'system', 'file', 'update', 'approval', 'submission'], default: 'text' },
  attachments: [{ name: String, url: String, size: Number, mimeType: String }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomMessage' },
  isDeleted: { type: Boolean, default: false },
  reactions: [{ emoji: String, users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  /* V3: Channel Type for Discussion Module (internal vs campaign discussion) */
  channelType: { type: String, enum: ['campaign_discussion', 'internal_discussion'], default: 'campaign_discussion' },
  /* V2.5: submission data embedded in message */
  submission: {
    instagramUrl: String, driveUrl: String, youtubeUrl: String,
    captionText: String, notes: String,
    status: { type: String, enum: ['submitted', 'under_review', 'changes_requested', 'approved', 'published'], default: 'submitted' },
  },
}, { timestamps: true });
roomMessageSchema.index({ room: 1, createdAt: -1 });


/* ════ DM REPORT ════ */
const dmReportSchema = new mongoose.Schema({
  teamMember: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  creatorDMs: { type: Number, default: 0 },
  brandDMs: { type: Number, default: 0 },
  profileLinks: [String],
  repliesReceived: { type: Number, default: 0 },
  interestedLeads: { type: Number, default: 0 },
  notes: { type: String, default: '', maxlength: 1000 },
  creatorLinks: [{ name: String, profileUrl: String, notes: String }],
  brandLinks: [{ name: String, profileUrl: String, notes: String }],
}, { timestamps: true });
dmReportSchema.index({ teamMember: 1, date: -1 }); dmReportSchema.index({ date: -1 });


/* ════ INTERNAL NOTE ════ */
const internalNoteSchema = new mongoose.Schema({
  about: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 2000 },
  noteType: { type: String, enum: ['general', 'performance', 'follow_up', 'warning', 'positive', 'contact'], default: 'general' },
  isPrivate: { type: Boolean, default: false },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
internalNoteSchema.index({ about: 1, createdAt: -1 });


/* ════ AUDIT LOG ════ */
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  category: { type: String, enum: ['user', 'campaign', 'task', 'notification', 'role', 'payment', 'auth', 'system', 'crm'], default: 'system' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetResource: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
}, { timestamps: true });
auditLogSchema.index({ performedBy: 1, createdAt: -1 }); auditLogSchema.index({ category: 1, createdAt: -1 }); auditLogSchema.index({ createdAt: -1 });


/* ════ KNOWLEDGE BASE ════ */
const knowledgeArticleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  category: { type: String, enum: ['sop', 'training', 'creator_outreach', 'brand_outreach', 'campaign_guide', 'internal', 'general'], default: 'general' },
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visibility: { type: String, enum: ['admin_only', 'team_only', 'creator', 'brand', 'public'], default: 'team_only' },
  isPublished: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
knowledgeArticleSchema.index({ category: 1, isPublished: 1 }); knowledgeArticleSchema.index({ tags: 1 });


/* ════ ACTIVITY FEED ════ */
const feedEventSchema = new mongoose.Schema({
  eventType: { type: String, enum: ['creator_joined', 'brand_joined', 'campaign_created', 'campaign_approved', 'task_completed', 'creator_submitted', 'creator_onboarded', 'brand_onboarded', 'campaign_completed', 'creator_promoted', 'new_achievement', 'note_added', 'user_banned', 'campaign_cancelled', 'creator_accepted', 'creator_declined', 'submission_approved'], required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  visibleTo: { type: String, enum: ['admin', 'team', 'all'], default: 'team' },
}, { timestamps: true });
feedEventSchema.index({ createdAt: -1 }); feedEventSchema.index({ visibleTo: 1, createdAt: -1 });


/* ════ V3 OPPORTUNITIES ════ */
const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  banner: { type: String, default: '' },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  brandName: { type: String, default: '' },
  category: { type: String, enum: ['ugc_hiring', 'campus_ambassador', 'product_seeding', 'affiliate', 'event', 'survey', 'creator_hunt'], default: 'ugc_hiring' },
  reward: { type: String, default: '' },
  requiresAdsRights: { type: Boolean, default: false },
  deadline: { type: Date },
  applicationLink: { type: String, required: true },
  status: { type: String, enum: ['published', 'draft', 'closed'], default: 'published' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
opportunitySchema.index({ status: 1, deadline: 1 });

/* ════ EXPORTS ════ */
module.exports = {
  User: mongoose.model('User', userSchema),
  Campaign: mongoose.model('Campaign', campaignSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Chat: mongoose.model('Chat', chatSchema),
  Message: mongoose.model('Message', messageSchema),
  Activity: mongoose.model('Activity', activitySchema),
  Submission: mongoose.model('Submission', submissionSchema),
  Lesson: mongoose.model('Lesson', lessonSchema),
  LessonCompletion: mongoose.model('LessonCompletion', lessonCompletionSchema),
  Post: mongoose.model('Post', postSchema),
  Comment: mongoose.model('Comment', commentSchema),
  SystemLog: mongoose.model('SystemLog', systemLogSchema),
  Task: mongoose.model('Task', taskSchema),
  CampaignRoom: mongoose.model('CampaignRoom', campaignRoomSchema),
  RoomMessage: mongoose.model('RoomMessage', roomMessageSchema),
  DMReport: mongoose.model('DMReport', dmReportSchema),
  InternalNote: mongoose.model('InternalNote', internalNoteSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  KnowledgeArticle: mongoose.model('KnowledgeArticle', knowledgeArticleSchema),
  FeedEvent: mongoose.model('FeedEvent', feedEventSchema),
  Opportunity: mongoose.model('Opportunity', opportunitySchema),
};
