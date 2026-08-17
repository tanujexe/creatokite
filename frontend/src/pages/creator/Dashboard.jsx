import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI, analyticsAPI, ecosystemAPI } from '../../api';
import { PageLoader, StatCard, StatusBadge, ScoreRing, Btn, WorkflowPipeline } from '../../components/ui';
import { Target, TrendingUp, Wallet, Trophy, ArrowRight, Zap, Crown } from 'lucide-react';
import CreatorShell from './CreatorShell';

const RANK_COLOR = { Bronze:'#b45309', Silver:'#64748b', Gold:'var(--gold)', Platinum:'#0284c7', Diamond:'#7c3aed', Legend:'var(--acc)' };

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

const CustomStatCard = ({ label, value, icon: Icon, color }) => (
  <div style={{
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
    borderRadius: 16,
    padding: '20px 20px 18px',
    boxShadow: 'var(--glass-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.24s ease, box-shadow 0.24s ease',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.borderColor = `${color}40`;
    e.currentTarget.style.boxShadow = `0 12px 30px ${color}10, var(--glass-shadow)`;
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.borderColor = 'var(--glass-border)';
    e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
  }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, letterSpacing: 0.3 }}>{label}</span>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
    </div>
    <div style={{
      fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      fontSize: 26,
      fontWeight: 800,
      color: 'var(--t1)',
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      fontFeatureSettings: '"tnum" on, "lnum" on',
    }}>
      {value}
    </div>
  </div>
);

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [data, setData]   = useState(null);
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) return <PageLoader />;

  return (
    <CreatorShell style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Hero card */}
      <div style={{
        background:'var(--glass-bg)',
        backdropFilter:'var(--glass-blur)',
        WebkitBackdropFilter:'var(--glass-blur)',
        border:'1px solid var(--glass-border)',
        borderRadius:20,
        padding:'26px 30px',
        display:'flex',
        gap:24,
        alignItems:'center',
        flexWrap:'wrap',
        boxShadow: 'var(--glass-shadow), 0 8px 32px rgba(108,99,255,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background gradient */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '60%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255, 107, 87, 0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ flexShrink: 0 }}>
              <ScoreRing score={user?.creatorScore || 0} size={72} color="var(--p2)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                <h2 style={{ fontFamily:"var(--fh)", fontSize:'clamp(24px, 5.5vw, 32px)', fontWeight:900, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--t1)', margin: 0 }}>
                  {user?.displayName}
                </h2>
                {leaderboardRank ? (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 99,
                    background: 'rgba(230, 95, 43, 0.12)', color: 'var(--acc)',
                    border: '1px solid rgba(230, 95, 43, 0.3)', fontWeight: 800, letterSpacing: 0.3,
                    display: 'inline-flex', alignItems: 'center', gap: 3
                  }}>
                    🏆 Rank #{leaderboardRank}
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize:11.5, color:'var(--t2)', marginBottom:6, fontWeight: 500 }}>
                {user?.niche || 'Creator'} · Level {user?.level || 1} · {user?.streak || 0}d streak 🔥
              </div>
              <div style={{ display:'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ height:6, background:'rgba(120,120,120,0.15)', borderRadius:100, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100, (user?.creatorScore || 0) / 10)}%`, background:'var(--grad-p)', borderRadius:100, boxShadow: '0 0 10px rgba(255,107,87,0.3)', transition:'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--t3)', fontWeight: 600, letterSpacing: 0.2, marginTop: 1 }}>
                  <span>{user?.creatorScore || 0} Power Score</span>
                  <span>1000 MAX</span>
                </div>
              </div>
            </div>
          </div>

          <Btn variant="primary" onClick={() => navigate('/creator/assigned')} style={{ height: 42, padding: '0 20px', borderRadius: 10, flexShrink: 0 }}>
            View My Campaigns <ArrowRight size={14} />
          </Btn>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <CustomStatCard label="Total Campaigns" value={data?.stats?.total || 0}     icon={Target}     color="var(--p2)" />
        <CustomStatCard label="Completed"        value={data?.stats?.completed || 0} icon={Trophy}     color="var(--acc2)" />
        <CustomStatCard label="Total Earned"     value={formatStatCurrency(data?.stats?.earned)} icon={Wallet} color="var(--gold)" />
        <CustomStatCard label="Leaderboard Rank" value={leaderboardRank ? `#${leaderboardRank}` : '—'} icon={Crown} color="var(--acc)" />
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
                const text = (latestActivity.description || '').replace(/https?:\/\/[^\s]+/g, '').trim();
                const parts = text.split(/(?:\r?\n|(?=[✨🚀🎁💛🌟🔗⌛🎯⚡👇👉▪✔•\-\*\d+\.]\s)|(?<=[.!?—])\s+)/).map(p => p.trim()).filter(Boolean);
                const mainIntro = parts[0] || text;
                const bulletItems = parts.slice(1, 3);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                      {mainIntro}
                    </p>
                    {bulletItems.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--t2)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--acc)', fontWeight: 800 }}>•</span>
                        <span style={{ flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{b}</span>
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


      {/* DNA Bars */}
      {user?.dna && (
        <div className="card" style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 20,
          padding: 24,
          boxShadow: 'var(--glass-shadow)'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:12 }}>
            <h3 style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:800, display:'flex', alignItems:'center', gap:6 }}>🧬 Creator DNA</h3>
            <span style={{ fontSize:11, color:'var(--t3)', fontWeight:500 }}>AI-calculated performance profile</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {[
              { k:'reach',       label:'Reach',        color:'#E73F1E' },
              { k:'engagement',  label:'Engagement',   color:'#FB6C00' },
              { k:'reliability', label:'Reliability',  color:'#F9B637' },
              { k:'quality',     label:'Quality',      color:'#E65F2B' },
              { k:'growth',      label:'Growth',       color:'#FB6C00' },
              { k:'authenticity',label:'Authenticity', color:'#E73F1E' },
            ].map(({ k, label, color }) => {
              const val = user.dna[k] || 0;
              return (
                <div key={k} style={{ background:'var(--s1)', padding:'14px 16px', borderRadius:14, border:'1px solid var(--border)', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div className="flex-between" style={{ marginBottom:8, fontSize:13 }}>
                    <span style={{ color:'var(--t1)', fontWeight:700 }}>{label}</span>
                    <span style={{ color, fontWeight:800, fontFamily: 'var(--fd)' }}>{val}</span>
                  </div>
                  <div style={{ height:8, background:'rgba(120,120,120,0.12)', borderRadius:100, overflow:'hidden', position:'relative' }}>
                    <div style={{ height:'100%', width:`${val}%`, background:color, borderRadius:100, boxShadow:`0 0 8px ${color}40`, transition:'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


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
        <div className="flex-between" style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:800 }}>Recent Campaign Assignments</h3>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/creator/assigned')}>See all →</Btn>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
            <p style={{ color:'var(--t2)', fontSize:13, marginBottom:16, fontWeight: 500 }}>No campaigns yet. Keep your profile strong — admin assigns the best creators!</p>
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
        background:'linear-gradient(135deg,rgba(245,166,35,0.06),rgba(108,99,255,0.06))',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border:'1px solid rgba(245,166,35,0.20)',
        borderRadius:20,
        padding:'20px 24px',
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:'var(--fh)', fontWeight:800, fontSize:16, color:'var(--gold)', marginBottom:4, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚡ {user?.xp?.toLocaleString('en-IN') || 0} XP · Level {user?.level || 1}
            </div>
            <div style={{ fontSize:12, color:'var(--t2)', fontWeight: 500 }}>Complete campaigns and submit on time to earn XP and climb ranks</div>
          </div>
          <div style={{ fontSize:12, color:'var(--t3)', fontWeight: 600 }}>Current Rank: #{leaderboardRank || data?.stats?.rank || 1}</div>
        </div>
      </div>
    </CreatorShell>
  );
}
