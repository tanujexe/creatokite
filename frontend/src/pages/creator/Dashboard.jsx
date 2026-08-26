import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI, analyticsAPI, ecosystemAPI } from '../../api';
import { PageLoader, StatCard, StatusBadge, ScoreRing, Btn, WorkflowPipeline, ClayBlobIllustration } from '../../components/ui';
import { Target, TrendingUp, Wallet, Trophy, ArrowRight, Zap, Crown, ShieldCheck, Award, Sparkles, Eye, Activity } from 'lucide-react';
import CreatorShell from './CreatorShell';

const RANK_COLOR = { Bronze: '#b45309', Silver: '#64748b', Gold: 'var(--gold)', Platinum: '#0284c7', Diamond: '#7c3aed', Legend: 'var(--acc)' };

const formatStatCurrency = (val = 0) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) {
    const k = val / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `₹${val}`;
};

const CustomStatCard = ({ label, value, icon: Icon, color, trendText, iconBg }) => (
  <div style={{
    background: 'var(--s1, #161311)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '20px 22px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  }} className="hover-lift">
    <div style={{
      width: 38, height: 38, borderRadius: 12,
      background: iconBg || `${color}1A`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        fontSize: 28,
        fontWeight: 900,
        color: 'var(--t1)',
        lineHeight: 1.1,
        letterSpacing: '-0.02em'
      }}>
        {value}
      </div>
    </div>
    {trendText && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: trendText.includes('vs') ? '#10b981' : 'var(--t3)', fontWeight: 700 }}>
        {trendText.includes('vs') && <span style={{ fontSize: 13 }}>↗</span>}
        <span>{trendText}</span>
      </div>
    )}
  </div>
);

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [leaderboardRank, setLeaderboardRank] = useState(null);
  const [latestActivity, setLatestActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.creator(),
      campaignsAPI.myAssigned(),
      ecosystemAPI.getLeaderboards().catch(() => null),
      ecosystemAPI.getActivities().catch(() => null)
    ])
      .then(([a, c, lb, actRes]) => {
        setData(a);
        setCampaigns((c.campaigns || []).slice(0, 4));
        if (lb && lb.myRank) {
          setLeaderboardRank(lb.myRank);
        } else if (lb && (Array.isArray(lb.creators) || Array.isArray(lb.rankings))) {
          const list = lb.creators || lb.rankings || [];
          const idx = list.findIndex(r => String(r._id || r.userId) === String(user?._id));
          if (idx !== -1) setLeaderboardRank(idx + 1);
          else setLeaderboardRank(null);
        } else {
          setLeaderboardRank(null);
        }

        if (actRes && Array.isArray(actRes.activities) && actRes.activities.length > 0) {
          setLatestActivity(actRes.activities[0]);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) return <PageLoader />;

  return (
    <CreatorShell style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Aesthetic Hero Banner */}
      <div style={{
        backgroundImage: 'linear-gradient(135deg, rgba(20, 16, 14, 0.88) 0%, rgba(13, 10, 9, 0.94) 100%), url("/aesthetic-hero-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(230, 95, 43, 0.3)',
        borderRadius: 24,
        padding: '28px 32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.1)'
      }}>
        {/* Top-Right Action Button */}
        <div style={{ position: 'absolute', top: 22, right: 24, zIndex: 10 }}>
          <button
            onClick={() => navigate('/creator/assigned')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 99,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(230, 95, 43, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            View My Campaigns <ArrowRight size={14} />
          </button>
        </div>

        {/* Content Layout */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', zIndex: 2, position: 'relative' }}>
          {/* Left Welcome Content */}
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <ScoreRing score={user?.creatorScore || 513} size={80} color="var(--acc)" />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#A8A29E', fontWeight: 500 }}>Welcome back,</div>
                <h1 style={{ fontFamily: 'var(--fh)', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: '#FFFFFF', margin: '2px 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {user?.displayName || 'Creator'} <span style={{ fontSize: 26 }}>👋</span>
                </h1>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', lineHeight: 1.3 }}>
                  Create. Collaborate. Earn.
                </div>
                <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 2 }}>
                  Let's make your next campaign your best one yet.
                </div>
              </div>
            </div>

            {/* Sub-info & Streak */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
              <span style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 700 }}>
                {user?.niche || 'Tech'} - Level {user?.level || 1}
              </span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ fontSize: 12, color: '#F97316', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {user?.streak || 0}d streak 🔥
              </span>
            </div>

            {/* Power Score Progress Bar */}
            <div style={{ width: '100%', maxWidth: 460 }}>
              <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 99, overflow: 'hidden', padding: 1 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, ((user?.creatorScore || 513) / 1000) * 100)}%`,
                  background: 'linear-gradient(90deg, #E65F2B, #F97316)',
                  borderRadius: 99,
                  boxShadow: '0 0 12px rgba(230, 95, 43, 0.6)',
                  transition: 'width 1s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, marginTop: 6 }}>
                <span style={{ color: '#E65F2B' }}>{user?.creatorScore || 513} Power Score</span>
                <span style={{ color: '#64748B' }}>1000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <CustomStatCard label="Total Campaigns" value={data?.stats?.total ?? 0} icon={Target} color="#F97316" trendText={data?.stats?.totalTrendPct !== undefined ? `${data.stats.totalTrendPct >= 0 ? '+' : ''}${data.stats.totalTrendPct}% vs last month` : '⚡ Active campaigns'} iconBg="rgba(249, 115, 22, 0.14)" />
        <CustomStatCard label="Completed" value={data?.stats?.completed ?? 0} icon={Trophy} color="#E65F2B" trendText={data?.stats?.completedTrendPct !== undefined ? `${data.stats.completedTrendPct >= 0 ? '+' : ''}${data.stats.completedTrendPct}% vs last month` : '✔ Completed campaigns'} iconBg="rgba(230, 95, 43, 0.14)" />
        <CustomStatCard label="Total Earned" value={formatStatCurrency(data?.stats?.earned ?? 0)} icon={Wallet} color="#10B981" trendText={data?.stats?.earnedTrendPct !== undefined ? `${data.stats.earnedTrendPct >= 0 ? '+' : ''}${data.stats.earnedTrendPct}% vs last month` : '💰 Verified payout'} iconBg="rgba(16, 185, 129, 0.14)" />
        <CustomStatCard label="Leaderboard Rank" value={leaderboardRank ? `#${leaderboardRank}` : '#—'} icon={Crown} color="#8B5CF6" trendText={leaderboardRank ? `Top #${leaderboardRank} Rank` : 'Complete campaigns to rank'} iconBg="rgba(139, 92, 246, 0.14)" />
      </div>

      {/* Newest Activity Card published by Admin */}
      <div className="card" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 20,
        padding: '24px 28px',
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--fh)', fontSize: 16, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Zap size={18} color="var(--acc)" /> Newest Activity & Announcement
            </h3>
            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Published by Admin</span>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/creator/activities')} style={{ fontSize: 12, borderRadius: 8 }}>
            View Past Activities →
          </Btn>
        </div>

        {latestActivity ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 800,
                  background: 'rgba(230, 95, 43, 0.12)', color: 'var(--acc)',
                  border: '1px solid rgba(230, 95, 43, 0.25)', textTransform: 'uppercase'
                }}>
                  {latestActivity.isChallenge ? '🔥 Challenge' : `⚡ ${latestActivity.type || 'Activity'}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                  +{latestActivity.xpReward || 50} XP
                </span>
                {latestActivity.status && latestActivity.status !== 'none' && (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                    background: latestActivity.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(245,166,35,0.15)',
                    color: latestActivity.status === 'approved' ? '#16a34a' : 'var(--gold)'
                  }}>
                    {latestActivity.status.toUpperCase()}
                  </span>
                )}
              </div>
              <h4 style={{ fontFamily: 'var(--fh)', fontSize: 17, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
                {latestActivity.title}
              </h4>
              {(() => {
                const text = (latestActivity.description || '').trim();
                const parts = text.split(/(?:\r?\n|(?=[✨🚀🎁💛🌟🔗⌛🎯⚡👇👉▪✔•\-\*\d+\.]\s)|(?<=[.!?—])\s+)/).map(p => p.trim()).filter(Boolean);
                const mainIntro = parts[0] || text;
                const bulletItems = parts.slice(1, 3);

                const renderWithLinks = (str) => {
                  if (!str) return null;
                  const chunks = str.split(/(https?:\/\/[^\s]+)/g);
                  return chunks.map((chunk, i) => {
                    if (chunk.match(/^https?:\/\//)) {
                      return (
                        <a key={i} href={chunk} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--acc)', textDecoration: 'underline', fontWeight: 700, wordBreak: 'break-all' }}>
                          {chunk}
                        </a>
                      );
                    }
                    return chunk;
                  });
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                      {renderWithLinks(mainIntro)}
                    </p>
                    {bulletItems.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--t2)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--acc)', fontWeight: 800 }}>•</span>
                        <span style={{ flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{renderWithLinks(b)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <Btn variant="primary" onClick={() => navigate('/creator/activities')} style={{ height: 40, padding: '0 20px', borderRadius: 10, flexShrink: 0 }}>
              Participate Now <ArrowRight size={14} />
            </Btn>
          </div>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--t2)', fontSize: 13, fontWeight: 500 }}>
            🔔 No active announcements right now. Check past activities on the Activities page.
          </div>
        )}
      </div>


      {/* Aesthetic Creator DNA Profile Section */}
      {user?.dna && (() => {
        const dnaMetrics = [
          { k: 'reach', label: 'Reach', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.3)', icon: Eye, sub: 'Audience Spread' },
          { k: 'engagement', label: 'Engagement', color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.14)', border: 'rgba(255, 107, 53, 0.3)', icon: Zap, sub: 'Interaction Rate' },
          { k: 'reliability', label: 'Reliability', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.3)', icon: ShieldCheck, sub: 'Deadline Consistency' },
          { k: 'quality', label: 'Quality', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.3)', icon: Award, sub: 'Content Score' },
          { k: 'growth', label: 'Growth', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.14)', border: 'rgba(129, 140, 248, 0.3)', icon: TrendingUp, sub: 'Momentum Trend' },
          { k: 'authenticity', label: 'Authenticity', color: '#C084FC', bg: 'rgba(192, 132, 252, 0.14)', border: 'rgba(192, 132, 252, 0.3)', icon: Sparkles, sub: 'Trust & Originality' },
        ];

        const totalDna = Math.round(
          Object.values(user.dna).reduce((a, b) => a + (parseInt(b) || 0), 0) / dnaMetrics.length
        ) || 0;

        const dnaTier = totalDna >= 80 ? 'EXCELLENT DNA' : totalDna >= 60 ? 'STRONG DNA' : totalDna >= 40 ? 'BALANCED DNA' : 'BUILDING DNA';
        const dnaBadgeBg = totalDna >= 80 ? '#10B981' : totalDna >= 60 ? '#F59E0B' : totalDna >= 40 ? '#6366F1' : '#FF6B35';

        return (
          <div className="card hover-lift" style={{
            background: 'linear-gradient(135deg, rgba(28, 23, 20, 0.95) 0%, rgba(18, 14, 12, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: '28px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background Ambient Glow Orbs */}
            <div style={{
              position: 'absolute', top: -80, right: -80, width: 300, height: 300,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,95,43,0.15) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
              position: 'absolute', bottom: -80, left: -80, width: 280, height: 280,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 0
            }} />

            {/* Header Section */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flex: 1, minWidth: 260 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(230,95,43,0.25) 0%, rgba(168,85,247,0.25) 100%)',
                  border: '1px solid rgba(230,95,43,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  boxShadow: '0 6px 16px rgba(230, 95, 43, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)', flexShrink: 0
                }}>
                  🧬
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                      Creator DNA Profile
                    </h3>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                      background: 'rgba(230, 95, 43, 0.15)', color: '#FF7A45', border: '1px solid rgba(230, 95, 43, 0.4)',
                      letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(230, 95, 43, 0.15)'
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF7A45', boxShadow: '0 0 6px #FF7A45' }} />
                      AI Calculated
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 4 }}>
                    Comprehensive real-time performance & engagement metrics
                  </div>
                </div>
              </div>

              {/* Overall Score Badge Pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px',
                borderRadius: 16, background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', flexShrink: 0
              }}>
                <div>
                  <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontWeight: 800 }}>OVERALL INDEX</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--fd)', lineHeight: 1.1 }}>
                    {totalDna}<span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>/100</span>
                  </div>
                </div>
                <div style={{
                  padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                  color: '#FFFFFF', background: `linear-gradient(135deg, ${dnaBadgeBg}, ${dnaBadgeBg}CC)`,
                  boxShadow: `0 4px 14px ${dnaBadgeBg}40`,
                  letterSpacing: '0.04em', whiteSpace: 'nowrap'
                }}>
                  {dnaTier}
                </div>
              </div>
            </div>

            {/* Grid of Metric Cards - 3 in a row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, position: 'relative', zIndex: 1 }}>
              {dnaMetrics.map(({ k, label, color, bg, border, icon: Icon, sub }) => {
                const val = parseInt(user.dna[k]) || 0;
                const statusTag = val >= 80 ? 'Excellent' : val >= 60 ? 'Strong' : val >= 40 ? 'Good' : 'Building';

                return (
                  <div
                    key={k}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '16px 18px',
                      borderRadius: 18,
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = `${color}60`;
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.boxShadow = `0 12px 30px ${color}22`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${color}20` }}>
                          <Icon size={16} style={{ color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{label}</div>
                          <div style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 500, marginTop: 1 }}>{sub}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'var(--fd)' }}>{val}</span>
                        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>/100</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: 7, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 99, overflow: 'hidden', position: 'relative', marginTop: 12, padding: 0.5 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${val}%`,
                          background: `linear-gradient(90deg, ${color}AA, ${color})`,
                          borderRadius: 99,
                          boxShadow: `0 0 12px ${color}88`,
                          transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11 }}>
                      <span style={{ color: '#9CA3AF', fontWeight: 500, fontSize: 10.5 }}>Performance</span>
                      <span style={{
                        color, fontWeight: 800, fontSize: 10.5, padding: '2px 8px', borderRadius: 99,
                        background: `${color}1A`, border: `1px solid ${color}33`
                      }}>
                        {statusTag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}


      {/* Recent campaigns */}
      <div className="card" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        padding: 0,
        overflow: 'hidden',
        borderRadius: 20,
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 800 }}>Recent Campaign Assignments</h3>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/creator/assigned')}>See all →</Btn>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ClayBlobIllustration size={115} style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--t2)', fontSize: 13.5, marginBottom: 16, fontWeight: 500, maxWidth: 400, lineHeight: 1.5 }}>No campaigns yet. Keep your profile strong — admin assigns the best creators!</p>
            <Btn variant="secondary" size="sm" onClick={() => navigate('/creator/profile')}>Complete Profile →</Btn>
          </div>
        ) : (
          campaigns.map((c, i) => {
            const a = c.myAssignment;
            return (
              <div
                key={c._id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < campaigns.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'background 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 107, 87, 0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => navigate('/creator/assigned')}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', marginBottom: 4, fontFamily: 'var(--fh)' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{c.brandName}</span>
                    <span style={{ color: 'var(--t3)' }}>•</span>
                    <span style={{ fontFamily: 'var(--fd)', color: 'var(--acc2)', fontWeight: 600 }}>₹{(a?.paymentAlloc || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <StatusBadge status={a?.status || 'assigned'} />
              </div>
            );
          })
        )}
      </div>

      {/* XP Progress */}
      <div className="card" style={{
        background: 'linear-gradient(135deg,rgba(245,166,35,0.06),rgba(108,99,255,0.06))',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid rgba(245,166,35,0.20)',
        borderRadius: 20,
        padding: '20px 24px',
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--fh)', fontWeight: 800, fontSize: 16, color: 'var(--gold)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚡ {user?.xp?.toLocaleString('en-IN') || 0} XP · Level {user?.level || 1}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>Complete campaigns and submit on time to earn XP and climb ranks</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600 }}>Current Rank: #{leaderboardRank || data?.stats?.rank || 1}</div>
        </div>
      </div>
    </CreatorShell>
  );
}
