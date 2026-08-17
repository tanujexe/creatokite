import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ecosystemAPI } from '../../api';
import { PageLoader, Avatar, Btn } from '../../components/ui';
import {
  Trophy, Shield, Zap, Sparkles, MessageSquare, Star,
  Dumbbell, Target, Gem, GraduationCap, Users, Lightbulb
} from 'lucide-react';
import CreatorShell from './CreatorShell';

const RANK_COLORS = { Bronze:'#cd7f32', Silver:'#c0c0c0', Gold:'var(--gold)', Platinum:'#a8d8ea', Diamond:'var(--p2)', Legend:'var(--acc)' };

const TABS = [
  { key: 'influence',  label: 'Influence',   Icon: Star,          desc: 'Rank by followers, reach, and engagement' },
  { key: 'activity',   label: 'Activity',    Icon: Dumbbell,      desc: 'Rank by total XP, activities completed, and streak milestones' },
  { key: 'campaign',   label: 'Campaigns',   Icon: Target,        desc: 'Rank by campaign completion and brand review scores' },
  { key: 'reputation', label: 'Reputation',  Icon: Gem,           desc: 'Rank by campaign success, academy work, and community posts' },
  { key: 'trust',      label: 'Trust Score', Icon: Shield,        desc: 'Rank by deadline compliance, response time, and brand rates' },
  { key: 'academy',    label: 'Academy',     Icon: GraduationCap, desc: 'Rank by Academy XP and certificates unlocked' },
  { key: 'community',  label: 'Community',   Icon: MessageSquare, desc: 'Rank by posts, replies, and community likes' },
  { key: 'referral',   label: 'Referrals',   Icon: Users,         desc: 'Rank by total referrals invited' },
];

const MEDAL_COLORS = { 1: 'var(--gold)', 2: '#c0c0c0', 3: '#cd7f32' };

export default function Leaderboard() {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [hof, setHof]             = useState(null);
  const [tab, setTab]             = useState('influence');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages]= useState(1);
  const [loading, setLoading]     = useState(true);

  const fetchLeaderboards = () => {
    setLoading(true);
    ecosystemAPI.getLeaderboards({ tab, page, limit: 10 })
      .then(d => {
        setCreators(d.creators || []);
        setTotalPages(d.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Load HOF once on mount
    ecosystemAPI.getHallOfFame()
      .then(d => setHof(d.hof || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLeaderboards();
  }, [tab, page]);

  const selectTab = (tKey) => {
    setTab(tKey);
    setPage(1);
  };

  const getMetricDisplay = (c) => {
    if (tab === 'influence') return `${c.creatorScore || 0} Score`;
    if (tab === 'activity') return `${c.xp || 0} XP`;
    if (tab === 'campaign') return `${c.completedCampaigns || 0} Campaigns`;
    if (tab === 'reputation') return `${c.reputationScore || 0}% Rep`;
    if (tab === 'trust') return `${c.trustScore?.overall || 70}% Trust`;
    if (tab === 'academy') return `${c.academyXp || 0} XP`;
    if (tab === 'community') return `${c.communityXp || 0} XP`;
    if (tab === 'referral') return `${c.referralCount || 0} Invited`;
    return '';
  };

  return (
    <CreatorShell style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Title */}
      <div className="flex-between">
        <div>
          <h2 style={{ fontWeight:800, fontSize:24, color: 'var(--t1)', marginBottom:4, display:'flex', alignItems:'center', gap:10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily:"var(--fh)", fontWeight:800, fontSize:32, letterSpacing:'-0.02em', color:'var(--t1)' }}>Creatokite Leaderboards</span>
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: 'rgba(230,95,43,0.12)', color: 'var(--acc)', fontWeight: 800, letterSpacing: 0.5, border: '1px solid rgba(230,95,43,0.25)' }}>
              TOP 10
            </span>
          </h2>
          <p style={{ color:'var(--t2)', fontSize:12, fontWeight: 500 }}>Top 10 creator rankings across all categories. Work your way into the Top 10 to boost brand visibility!</p>
        </div>
      </div>

      {/* Hall of Fame Banner */}
      {hof && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <h3 style={{ fontSize:12, fontWeight:700, color:'var(--t3)', display:'flex', alignItems:'center', gap:6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <Sparkles size={15} color="var(--gold)" /> Hall of Fame
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
            {[
              { title: 'Top Creator of Month', data: hof.topCreatorOfMonth, score: `${hof.topCreatorOfMonth?.reputationScore || 85}% Reputation`, icon: Star, color: 'var(--gold)' },
              { title: 'Highest XP Master', data: hof.topXP, score: `${hof.topXP?.xp || 0} XP`, icon: Zap, color: 'var(--p)' },
              { title: 'Most Trusted Creator', data: hof.topTrust, score: `${hof.topTrust?.trustScore?.overall || 70}% Trust`, icon: Shield, color: 'var(--acc2)' },
              { title: 'Campaign Champion', data: hof.topCampaigns, score: `${hof.topCampaigns?.completedCampaigns || 0} Campaigns`, icon: Trophy, color: 'var(--acc)' }
            ].map(({ title: t, data: d, score: sc, icon: Icon, color }) => d && (
              <div key={t} style={{
                background:'var(--glass-bg)',
                backdropFilter:'var(--glass-blur)',
                WebkitBackdropFilter:'var(--glass-blur)',
                border:'1px solid var(--glass-border)',
                borderRadius:16,
                padding:'16px 18px',
                display:'flex',
                alignItems:'center',
                gap:14,
                boxShadow:'var(--glass-shadow)',
                transition:'transform 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width:38, height:38, borderRadius:'50%', background:`${color}12`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ minWidth:0, flex: 1 }}>
                  <div style={{ fontSize:10, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{t}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--t1)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--fh)' }}>
                    {d.displayName}
                  </div>
                  <div style={{ fontSize:11, color:color, fontWeight:600, marginTop:1 }}>{sc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Category Tabs */}
      <div className="rs-chip-row" style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, borderBottom:'1px solid var(--border)', flexWrap: 'nowrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => selectTab(t.key)}
            className={`chip${tab === t.key ? ' active' : ''}`}
            style={{
              fontSize:12,
              padding:'8px 14px',
              borderRadius:10,
              background: tab === t.key ? 'var(--acc)' : 'var(--s1)',
              color: tab === t.key ? '#FFFFFF' : 'var(--t2)',
              border: tab === t.key ? '1px solid var(--acc)' : '1px solid var(--border)',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => { if(tab !== t.key) e.currentTarget.style.background = 'rgba(255,107,87,0.08)'; }}
            onMouseLeave={e => { if(tab !== t.key) e.currentTarget.style.background = 'var(--s1)'; }}
          >
            {t.key === 'influence'
              ? <span style={{ fontSize:13 }}>⭐</span>
              : <t.Icon size={13} />
            }
            {t.label}
          </button>
        ))}
      </div>

      <p style={{ color:'var(--t2)', fontSize:12, marginTop:-12, fontWeight: 500, display:'flex', alignItems:'center', gap:6 }}>
        <Lightbulb size={13} color="var(--gold)" />
        {TABS.find(t => t.key === tab)?.desc}
      </p>

      {/* Logged in creator Top 10 status banner */}
      {user && (() => {
        const myIndex = creators.findIndex(c => (c._id || c.userId) === user._id);
        if (myIndex !== -1) {
          const myRankNum = myIndex + 1;
          return (
            <div style={{
              background: 'linear-gradient(135deg, rgba(230, 95, 43, 0.14) 0%, rgba(212, 162, 76, 0.1) 100%)',
              border: '1px solid rgba(230, 95, 43, 0.35)',
              borderRadius: 16,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              boxShadow: '0 4px 20px rgba(230, 95, 43, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'var(--acc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: '0 2px 10px rgba(230, 95, 43, 0.4)'
                }}>
                  🔥
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>
                    Congratulations! You are Ranked <span style={{ color: 'var(--acc)', fontSize: 16, fontWeight: 900 }}>#{myRankNum}</span> in the Top 10!
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500, marginTop: 2 }}>
                    Your profile is highlighted below and receiving elevated campaign matching visibility from brands.
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '5px 14px',
                borderRadius: 99,
                background: 'var(--acc)',
                color: '#ffffff',
                letterSpacing: 0.5,
                boxShadow: '0 2px 10px rgba(230,95,43,0.35)'
              }}>
                TOP 10 CREATOR
              </span>
            </div>
          );
        }
        return null;
      })()}

      {/* Main Leaderboard Table */}
      {loading ? (
        <PageLoader />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ padding:0, overflow:'hidden', borderRadius:20 }}>
            {creators.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'var(--t2)', fontSize:13, fontWeight: 500 }}>No creators found.</div>
            ) : creators.map((c, i) => {
              const isMe = (c._id || c.userId) === user?._id;
              const rc   = RANK_COLORS[c.rank] || 'var(--p2)';
              const globalRank = (page - 1) * 10 + i + 1;

              return (
                <div key={c._id} style={{
                  display:'flex', alignItems:'center', gap:16, padding:'16px 20px',
                  margin: isMe ? '4px 6px' : '0',
                  borderRadius: isMe ? 14 : 0,
                  borderBottom: (!isMe && i < creators.length - 1) ? '1px solid var(--border)' : 'none',
                  background: isMe
                    ? 'linear-gradient(90deg, rgba(230,95,43,0.16) 0%, rgba(212,162,76,0.1) 50%, rgba(230,95,43,0.04) 100%)'
                    : 'transparent',
                  border: isMe ? '1.5px solid rgba(230,95,43,0.4)' : undefined,
                  borderLeft: isMe ? '4px solid var(--acc)' : '4px solid transparent',
                  boxShadow: isMe ? '0 4px 20px rgba(230,95,43,0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  zIndex: isMe ? 2 : 1,
                }}
                onMouseEnter={e => { if(!isMe) e.currentTarget.style.background = 'rgba(255, 107, 87, 0.03)'; }}
                onMouseLeave={e => { if(!isMe) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Rank badge */}
                  <div style={{ width:32, textAlign:'center', flexShrink:0, display:'flex', justifyContent:'center' }}>
                    {globalRank <= 3 ? (
                      <span style={{ fontSize:20 }}>
                        {globalRank===1?'🥇':globalRank===2?'🥈':'🥉'}
                      </span>
                    ) : (
                      <span style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:13, color: isMe ? 'var(--acc)' : 'var(--t3)' }}>
                        #{globalRank}
                      </span>
                    )}
                  </div>
                  
                  <Avatar src={c.avatar} name={c.displayName} size={40} style={isMe ? { border: '2px solid var(--acc)' } : {}} />
                  
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--fh)', color: 'var(--t1)' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.displayName}</span>
                      {isMe && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: 'var(--acc)',
                          color: '#ffffff',
                          letterSpacing: 0.5,
                          boxShadow: '0 2px 8px rgba(230,95,43,0.35)',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          ✨ YOU
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: isMe ? 'var(--t1)' : 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isMe ? 600 : 500 }}>
                      {c.niche || 'General'} · Level {c.level || 1} · {c.completedCampaigns || 0} campaigns
                    </div>
                  </div>
                  
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:15, color: isMe ? 'var(--acc)' : 'var(--t1)' }}>
                      {getMetricDisplay(c)}
                    </div>
                    <div style={{ fontSize:10, color: isMe ? 'var(--acc)' : 'var(--t3)', fontWeight:700, marginTop:2, textTransform: 'uppercase', letterSpacing: 0.3 }}>Rank #{globalRank}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div style={{ display:'flex', justifyItems:'center', justifyContent:'center', gap:12, marginTop:10 }}>
              <Btn variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ borderRadius: 8 }}>
                Previous
              </Btn>
              <span style={{ fontSize:12, color:'var(--t2)', display:'flex', alignItems:'center', fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>
              <Btn variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ borderRadius: 8 }}>
                Next
              </Btn>
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', fontWeight: 600, marginTop: 4 }}>
              🏆 Showing Top 10 Creators in {TABS.find(t => t.key === tab)?.label || 'Category'}
            </div>
          )}
        </div>
      )}
    </CreatorShell>
  );
}
