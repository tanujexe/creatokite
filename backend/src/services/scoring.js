// ─────────────────────────────────────────────────────────
// scoring.js  —  Creator Score + CAS engine + reputation & trust engines
// ─────────────────────────────────────────────────────────
const { User, Notification, LessonCompletion, Post, Comment } = require('../models');

// LEVEL mapping titles
const LEVEL_TITLES = [
  'Beginner',          // Level 1
  'Rising Creator',    // Level 2
  'Skilled Creator',   // Level 3
  'Influencer',        // Level 4
  'Professional',      // Level 5
  'Elite',             // Level 6
  'Master Creator',    // Level 7
  'Legend'             // Level 8+
];

function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level, 8) - 1] || 'Legend';
}

function getBadgeIcon(name) {
  const icons = {
    'First Login': '🔑',
    'First Activity': '🏃',
    'First Campaign': '🎯',
    '7 Day Streak': '🔥',
    '30 Day Streak': '⚡',
    '100 Day Streak': '👑',
    'Referral Master': '👥',
    'Top Creator': '⭐',
    'Academy Graduate': '🎓',
    'Community Contributor': '💬',
    'Campaign Champion': '🏆',
    'Elite Creator': '💎',
    'Legend Creator': '🌌',
  };
  return icons[name] || '🎖️';
}

async function awardBadge(user, badgeName) {
  if (!user.badges) user.badges = [];
  if (user.badges.some(b => b.name === badgeName)) return; // already awarded
  user.badges.push({ name: badgeName, icon: getBadgeIcon(badgeName), earnedAt: new Date() });
  try {
    await Notification.create({
      user: user._id,
      type: 'badge_earned',
      title: '🏆 New Badge Earned!',
      body: `Congratulations! You unlocked the "${badgeName}" badge!`,
      link: '/creator/profile'
    });
  } catch(e) {}
}

/* ── Trust Engine ────────────────────────────────────────── */
function computeTrust(user) {
  let trust = 70; // baseline
  if (user.isVerified) trust += 10;
  
  const completionRate = user.successRate || 100;
  trust += (completionRate - 90) * 0.5; // bonus/penalty for completion
  
  // Check account age in days
  const ageInDays = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) || 1;
  trust += Math.min(10, Math.floor(ageInDays / 30) * 2); // loyalty bonus
  
  return Math.min(100, Math.max(0, Math.round(trust)));
}

/* ── Reputation Engine ───────────────────────────────────── */
async function computeReputation(user) {
  const campaignSuccess = user.successRate || 100;
  const trust = user.trustScore?.overall || 70;
  
  // Activity score: based on completed campaigns & daily activity participation
  const activityVal = Math.min(100, ((user.completedCampaigns || 0) * 10) + 10);
  
  // Academy score: based on completed lessons
  const completionsCount = await LessonCompletion.countDocuments({ creator: user._id });
  const academyVal = Math.min(100, completionsCount * 10);
  
  // Community score: based on posts and comments count
  const [postsCount, commentsCount] = await Promise.all([
    Post.countDocuments({ creator: user._id }),
    Comment.countDocuments({ sender: user._id })
  ]);
  const communityVal = Math.min(100, (postsCount * 8) + (commentsCount * 3));
  
  // Profile completeness: user.profileComplete (0-100)
  const profileCompleteVal = user.profileComplete || 0;
  
  const rep = (campaignSuccess * 0.40) +
              (trust * 0.20) +
              (activityVal * 0.15) +
              (academyVal * 0.10) +
              (communityVal * 0.10) +
              (profileCompleteVal * 0.05);
              
  return Math.min(100, Math.max(0, Math.round(rep)));
}

/* ── Creator Power Score ─────────────────────────────────── */
function computeCreatorPowerScore(user) {
  const p = user.platforms || {};
  const totalFollowers = (p.instagram?.followers||0)+(p.youtube?.followers||0)+(p.twitter?.followers||0);
  const avgEngagement  = [(p.instagram?.engagement||0),(p.youtube?.engagement||0),(p.twitter?.engagement||0)].reduce((a,b)=>a+b,0)/3;
  
  const followersScore = Math.min(100, (totalFollowers / 100000) * 100);
  const engagementScore = Math.min(100, (avgEngagement / 10) * 100);
  const trustScoreVal = user.trustScore?.overall || 70;
  const campaignSuccess = user.successRate || 100;
  const activityVal = Math.min(100, ((user.completedCampaigns || 0) * 5) + 10);
  
  const power = (followersScore * 0.20) +
                (engagementScore * 0.20) +
                (trustScoreVal * 0.25) +
                (campaignSuccess * 0.25) +
                (activityVal * 0.10);
                
  return Math.min(100, Math.max(0, Math.round(power)));
}

/* ── Existing score (0–1000) ──────────────────────────── */
function computeScore(user) {
  const p = user.platforms || {};
  const totalFollowers = (p.instagram?.followers||0)+(p.youtube?.followers||0)+(p.twitter?.followers||0);
  const avgEngagement  = [(p.instagram?.engagement||0),(p.youtube?.engagement||0),(p.twitter?.engagement||0)].reduce((a,b)=>a+b,0)/3;

  const reach       = Math.min(1,totalFollowers/500000)*250;
  const engagement  = Math.min(1,avgEngagement/10)*250;
  const reliability = ((user.successRate||100)/100)*200;
  const activity    = Math.min(1,(user.completedCampaigns||0)/30)*150;
  const growth      = Math.min(1,(user.seasonXP||0)/5000)*50;
  const auth        = Math.min(1,(user.profileComplete||0)/100)*100;

  const total = Math.min(1000,Math.round(reach+engagement+reliability+activity+growth+auth));
  const dna = {
    reach:       Math.round(Math.min(100,totalFollowers/5000)),
    engagement:  Math.round(Math.min(100,avgEngagement*10)),
    reliability: Math.round(user.successRate||100),
    quality:     Math.round(user.profileComplete||0),
    growth:      Math.round(Math.min(100,(user.seasonXP||0)/50)),
    authenticity:Math.round(80-(user.trustScore?.fakePct||0)),
  };
  return { total, dna };
}

function getRank(score) {
  if (score>=900) return 'Legend';
  if (score>=750) return 'Diamond';
  if (score>=600) return 'Platinum';
  if (score>=400) return 'Gold';
  if (score>=200) return 'Silver';
  return 'Bronze';
}

/* ── CAS helpers (0–100 each) ─────────────────────────── */
const clamp = (v,mn=0,mx=100) => Math.max(mn,Math.min(mx,v));

function casEngagement(followers, avgLikes, avgComments, avgShares=0, avgSaves=0, platform='instagram') {
  const weighted = avgLikes + avgComments*3 + avgShares*5 + avgSaves*4;
  const rawER = (weighted / Math.max(followers,1))*100;

  let threshold;
  if (platform === 'youtube') {
    threshold = followers > 10_000_000 ? 0.5
              : followers > 1_000_000  ? 1.0
              : followers > 100_000    ? 2.0
              :                          4.0;
  } else {
    threshold = 8;
  }
  return clamp(Math.round(rawER >= threshold ? 100 : rawER <= 0 ? 0 : (rawER / threshold) * 100));
}
function casReach(avgViews, followers) {
  const ratio = avgViews / Math.max(followers,1);
  return clamp(Math.round(ratio>=1?100:ratio<=0?0:ratio*100));
}
function casAuthenticity(followers, avgLikes, avgComments, followingCount=0) {
  let s = 100;
  const er = ((avgLikes+avgComments)/Math.max(followers,1))*100;
  if (followers>100000&&er<0.5)  s-=30;
  else if (followers>50000&&er<1) s-=15;
  else if (er<0.5) s-=20;
  const fr = followingCount/Math.max(followers,1);
  if (fr>2) s-=20; else if (fr>1) s-=10;
  const cr = avgComments/Math.max(avgLikes,1);
  if (cr<0.005&&followers>10000) s-=15;
  return clamp(Math.round(s));
}
function casConsistency(postsPerWeek) {
  if (postsPerWeek>=3&&postsPerWeek<=7) return 100;
  if (postsPerWeek>=1) return Math.round(70+(postsPerWeek-1)*15);
  if (postsPerWeek>0)  return Math.round(postsPerWeek*70);
  return 20;
}
function casGrowth(er) {
  if (er>=8) return 100; if (er>=5) return 85;
  if (er>=3) return 70;  if (er>=1) return 55;
  return 35;
}
function casBrandSafety(niche='') {
  const safe = ['fitness','food','travel','tech','education','fashion','beauty','lifestyle'];
  const hit  = safe.some(n=>niche.toLowerCase().includes(n));
  return hit ? 90 : 75;
}
function casConversion(avgSaves=0, avgLikes, niche='') {
  const ratio = avgSaves/Math.max(avgLikes,1);
  let s = clamp(Math.round(ratio*200));
  const hi = ['fashion','beauty','fitness','food','tech','gadget'];
  if (hi.some(n=>niche.toLowerCase().includes(n))) s=Math.min(100,s+15);
  return s||50;
}
function casContentQuality(avgViews, followers) {
  const r = avgViews/Math.max(followers,1);
  if (r>=0.5) return 100; if (r>=0.2) return 85;
  if (r>=0.1) return 70;  if (r>=0.05) return 55;
  return 40;
}

function computeCAS({ igData, ytData, niche='' }) {
  const platform   = ytData && !igData ? 'youtube' : 'instagram';
  const followers  = Math.max(igData?.followers||0, ytData?.followers||0);
  const avgLikes   = Math.max(igData?.avgLikes||0,  ytData?.avgLikes||0);
  const avgComments= Math.max(igData?.avgComments||0,ytData?.avgComments||0);
  const avgViews   = Math.max(igData?.avgViews||0,  ytData?.avgViews||0);
  const postsPerWeek = igData?.postsPerWeek||ytData?.postsPerWeek||2;
  const er         = igData?.er||ytData?.er||0;

  const scores = {
    engagement:    casEngagement(followers, avgLikes, avgComments, 0, 0, platform),
    reach:         casReach(avgViews, followers),
    authenticity:  casAuthenticity(followers, avgLikes, avgComments),
    consistency:   casConsistency(postsPerWeek),
    growth:        casGrowth(er),
    brandSafety:   casBrandSafety(niche),
    conversion:    casConversion(0, avgLikes, niche),
    contentQuality:casContentQuality(avgViews, followers),
  };

  const cas = Math.round(
    scores.engagement    * 0.20 +
    scores.reach         * 0.15 +
    scores.authenticity  * 0.15 +
    scores.consistency   * 0.10 +
    scores.growth        * 0.10 +
    scores.brandSafety   * 0.10 +
    scores.conversion    * 0.10 +
    scores.contentQuality* 0.10
  );

  const avgAuth = (scores.authenticity + scores.engagement) / 2;
  const riskLevel = avgAuth>=75?'LOW':avgAuth>=50?'MEDIUM':'HIGH';
  const badge     = cas>=90?'ELITE':cas>=75?'VERIFIED':cas>=50?'STANDARD':'REVIEW';
  const autoApprove = cas>=75 && riskLevel==='LOW';

  return { cas, scores, riskLevel, badge, autoApprove };
}

/* ── checkStreakMilestones ─────────────────────────────── */
async function checkStreakMilestones(user) {
  const streak = user.streak || 0;
  if (streak === 3) {
    user.xp = (user.xp||0) + 10;
    user.coins = (user.coins||0) + 5;
  } else if (streak === 7) {
    user.xp = (user.xp||0) + 50;
    user.coins = (user.coins||0) + 20;
    await awardBadge(user, '7 Day Streak');
  } else if (streak === 15) {
    user.xp = (user.xp||0) + 100;
    user.coins = (user.coins||0) + 50;
  } else if (streak === 30) {
    user.xp = (user.xp||0) + 200;
    user.coins = (user.coins||0) + 100;
    await awardBadge(user, '30 Day Streak');
  } else if (streak === 60) {
    user.xp = (user.xp||0) + 300;
    user.coins = (user.coins||0) + 150;
  } else if (streak === 100) {
    user.xp = (user.xp||0) + 500;
    user.coins = (user.coins||0) + 250;
    await awardBadge(user, '100 Day Streak');
  }
}

/* ── awardXP ──────────────────────────────────────────── */
async function awardXP(userId, amount, category = 'activity') {
  try {
    const user = await User.findById(userId);
    if (!user||user.role!=='creator') return null;

    user.xp = (user.xp||0)+amount;
    user.seasonXP = (user.seasonXP||0)+amount;

    const xpKey = `${category}Xp`;
    if (user[xpKey] !== undefined) {
      user[xpKey] = (user[xpKey]||0) + amount;
    }

    const oldLevel = user.level || 1;
    const newLevel = Math.floor(user.xp/500)+1;

    if (newLevel > oldLevel) {
      user.level = newLevel;
      const coinReward = newLevel * 50;
      user.coins = (user.coins||0) + coinReward;
      
      try {
        await Notification.create({
          user: user._id,
          type: 'level_up',
          title: `🚀 Leveled Up to Level ${newLevel}!`,
          body: `Congratulations! You reached Level ${newLevel} (${getLevelTitle(newLevel)}). You received ${coinReward} Creator Coins!`,
          link: '/creator/dashboard'
        });
      } catch(ne) {}
    }

    if (user.completedCampaigns >= 1) await awardBadge(user, 'First Campaign');
    if (user.completedCampaigns >= 10) await awardBadge(user, 'Campaign Champion');
    if (user.xp >= 5000) await awardBadge(user, 'Top Creator');
    if (user.level >= 6) await awardBadge(user, 'Elite Creator');
    if (user.level >= 8) await awardBadge(user, 'Legend Creator');

    user.trustScore = user.trustScore || {};
    user.trustScore.overall = computeTrust(user);
    user.reputationScore = await computeReputation(user);
    user.creatorPowerScore = computeCreatorPowerScore(user);

    const { total, dna } = computeScore(user);
    user.creatorScore=total; user.dna=dna; user.rank=getRank(total);
    await user.save({ validateBeforeSave:false });
    return { score:total, rank:user.rank, reputation:user.reputationScore, level:user.level };
  } catch(e){ console.error('awardXP error:',e.message); return null; }
}

async function recalculateAllScores() {
  const creators = await User.find({ role:'creator' });
  for (const u of creators) {
    try {
      u.trustScore = u.trustScore || {};
      u.trustScore.overall = computeTrust(u);
      u.reputationScore = await computeReputation(u);
      u.creatorPowerScore = computeCreatorPowerScore(u);
      
      const { total, dna } = computeScore(u);
      u.creatorScore=total; u.dna=dna; u.rank=getRank(total);
      await u.save({ validateBeforeSave:false });
    } catch(e){}
  }
  console.log(`✅ Recalculated scores, reputation, and trust for ${creators.length} creators`);
}

module.exports = {
  computeScore,
  getRank,
  awardXP,
  recalculateAllScores,
  computeCAS,
  getLevelTitle,
  awardBadge,
  checkStreakMilestones
};
