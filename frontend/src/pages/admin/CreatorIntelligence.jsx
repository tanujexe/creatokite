import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, TrendingUp, Star, Zap, CheckCircle2, Heart,
  Users, BarChart2, Trophy, Crown, ArrowRight, Search,
  ChevronRight, Activity, Target,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { adminAPI } from '../../api';
import { Avatar, PageLoader, EmptyState, SkeletonCard } from '../../components/ui';
import toast from 'react-hot-toast';

/* ── Overall Creator Score Calculator ──────────────── */
function calcOverallScore(c) {
  const ts = c.trustScore || {};
  const reliability  = (ts.campaignCompletion || 50) * 0.25;
  const engagement   = Math.min(100, (c.platforms?.instagram?.engagement || c.platforms?.youtube?.engagement || 0) * 10) * 0.20;
  const completion   = Math.min(100, (c.completedCampaigns || 0) / Math.max(1, c.totalCampaigns || 1) * 100) * 0.20;
  const activity     = Math.min(100, (c.xp || 0) / 100) * 0.15;
  const growth       = Math.min(100, (c.seasonXP || 0) / 50) * 0.10;
  const baseScore    = (c.creatorScore || 0) / 10 * 0.10;
  return Math.round(reliability + engagement + completion + activity + growth + baseScore);
}

/* ── Rec badges ─────────────────────────────────────── */
function Badges({ c }) {
  const ts = c.trustScore || {};
  const list = [];
  if ((c.creatorScore || 0) >= 800)          list.push({ cls:'rec-badge-top-perf', label:'🏆 Top Performer'    });
  if ((ts.campaignCompletion || 0) >= 90)    list.push({ cls:'rec-badge-reliable', label:`✅ ${ts.campaignCompletion}% Reliable` });
  if ((c.platforms?.instagram?.engagement||0) >= 5) list.push({ cls:'rec-badge-top-eng', label:'❤️ Top Engagement'  });
  if ((c.seasonXP || 0) >= 2000)             list.push({ cls:'rec-badge-growing',  label:'📈 Rising Creator'    });
  if ((c.xp || 0) >= 5000)                  list.push({ cls:'rec-badge-activity',  label:'⚡ High Activity'     });
  if (c.rank === 'Diamond' || c.rank === 'Legend') list.push({ cls:'rec-badge-ai', label:`💎 ${c.rank}`        });
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
      {list.slice(0, 3).map((b, i) => <span key={i} className={`rec-badge ${b.cls}`}>{b.label}</span>)}
    </div>
  );
}

/* ── Creator card ───────────────────────────────────── */
function CreatorCard({ c, rank, highlight }) {
  const ocs = calcOverallScore(c);
  const ts  = c.trustScore || {};
  const navigate = useNavigate();
  return (
    <div
      className="card card-hover"
      style={{ padding:'14px 16px', cursor:'pointer', border: highlight ? '1px solid rgba(212,162,76,0.35)' : undefined }}
      onClick={() => navigate('/admin/users')}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        {rank && (
          <div style={{
            width:24, height:24, borderRadius:'50%', flexShrink:0, marginTop:4,
            background: rank <= 3 ? `linear-gradient(135deg,${rank===1?'#FFD700,#FFA500':rank===2?'#C0C0C0,#A8A8A8':'#CD7F32,#A0522D'})` : 'rgba(255,255,255,0.07)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:10, fontWeight:700, color: rank <= 3 ? (rank===2?'#404040':'#7a4500') : 'var(--t3)',
          }}>
            {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
          </div>
        )}
        <Avatar src={c.avatar} name={c.displayName} size={40}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>{c.displayName}</span>
            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:99, background:'rgba(255,107,87,0.1)', color:'var(--p)', fontWeight:600 }}>
              ⚡ {c.creatorScore || 0}
            </span>
          </div>
          <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>
            {c.niche || 'Creator'} {c.handle ? `· @${c.handle}` : ''}
          </div>
          <Badges c={c}/>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--gold)', fontFamily:'var(--fd)' }}>
            {ocs}
          </div>
          <div style={{ fontSize:9, color:'var(--t3)' }}>OCS</div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="rs-cols-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:12, borderTop:'1px solid var(--border)', paddingTop:10 }}>
        {[
          { label:'Campaigns',   value: c.totalCampaigns || 0,                 color:'var(--p)'    },
          { label:'Reliability', value: `${ts.campaignCompletion || 0}%`,       color:'var(--acc2)' },
          { label:'Engagement',  value: `${(c.platforms?.instagram?.engagement || 0).toFixed(1)}%`, color:'#e11d48' },
          { label:'XP',          value: c.xp || 0,                             color:'var(--gold)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:s.color, fontFamily:'var(--fd)' }}>{s.value}</div>
            <div style={{ fontSize:9, color:'var(--t3)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Radar chart for top creator ────────────────────── */
function CreatorRadar({ creator }) {
  const ts = creator.trustScore || {};
  const data = [
    { metric:'Reliability',  value: ts.campaignCompletion || 0 },
    { metric:'Engagement',   value: Math.min(100, (creator.platforms?.instagram?.engagement||0)*10) },
    { metric:'Activity',     value: Math.min(100, (creator.xp||0)/100) },
    { metric:'Growth',       value: Math.min(100, (creator.seasonXP||0)/50) },
    { metric:'Delivery',     value: ts.onTimeDelivery || 0 },
    { metric:'Quality',      value: ts.submissionQuality || 0 },
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--border)"/>
        <PolarAngleAxis dataKey="metric" tick={{ fontSize:10, fill:'var(--t3)' }}/>
        <PolarRadiusAxis tick={{ fontSize:8, fill:'var(--t3)' }} domain={[0,100]}/>
        <Radar dataKey="value" stroke="var(--p)" fill="var(--p)" fillOpacity={0.18} strokeWidth={2}/>
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ═════════════════════════════════════════════════════
   TABS
   ═════════════════════════════════════════════════════ */
const TABS = [
  { key:'overview',   label:'Overview',       icon:Brain    },
  { key:'top',        label:'Top Performers', icon:Crown    },
  { key:'rising',     label:'Rising Creators',icon:TrendingUp},
  { key:'reliability',label:'Reliability',    icon:CheckCircle2},
  { key:'engagement', label:'Engagement',     icon:Heart    },
];

export default function CreatorIntelligence() {
  const [tab,        setTab]        = useState('overview');
  const [data,       setData]       = useState(null);
  const [creators,   setCreators]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      adminAPI.creatorsStats(),
      adminAPI.leaderboard({ type:'overall', limit:20 }).catch(() => ({ creators:[] })),
    ]).then(([stats, lb]) => {
      setData(stats.stats || stats);
      setCreators(lb.creators || []);
    }).catch(() => toast.error('Failed to load creator intelligence'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const typeMap = { top:'overall', rising:'growth', reliability:'reliability', engagement:'engagement' };
    if (tab === 'overview') return;
    const type = typeMap[tab] || 'overall';
    setLoading(true);
    adminAPI.leaderboard({ type, limit:20, search: search||undefined })
      .then(d => setCreators(d.creators || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, search]);

  const ttStyle = { background:'var(--s2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12, color:'var(--t1)' };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:'clamp(18px,4vw,24px)', fontWeight:800, display:'flex', alignItems:'center', gap:10 }}>
            <Brain size={22} style={{ color:'#8b5cf6' }}/>
            Creator Intelligence
          </h1>
          <p style={{ color:'var(--t2)', fontSize:13, marginTop:4 }}>
            Deep visibility into creator performance, growth, and reliability
          </p>
        </div>
        <button onClick={() => navigate('/admin/leaderboard')} className="btn btn-secondary btn-sm" style={{ gap:6 }}>
          <Trophy size={13}/> View Leaderboards
        </button>
      </div>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:20, overflowX:'auto' }}>
        {TABS.map(t => {
          const TIcon = t.icon;
          const isActive = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'10px 14px',
                fontSize:12, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--p)' : 'var(--t2)',
                background:'transparent', border:'none',
                borderBottom:`2px solid ${isActive ? 'var(--p)' : 'transparent'}`,
                cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap',
              }}>
              <TIcon size={13}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview ─────────────────────────────────── */}
      {tab === 'overview' && (
        <div>
          {/* Top stat cards */}
          <div className="grid-4" style={{ marginBottom:24 }}>
            {[
              { label:'Total Creators',    value: data?.total || 0,    icon:Users,       color:'var(--p)'    },
              { label:'Approved',          value: data?.approved || 0, icon:CheckCircle2,color:'var(--acc2)' },
              { label:'Pending Review',    value: data?.pending || 0,  icon:Target,      color:'var(--gold)' },
              { label:'Rejected',          value: data?.rejected || 0, icon:Activity,    color:'var(--rose)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ width:32, height:32, borderRadius:'var(--r)', background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <s.icon size={15} style={{ color:s.color }}/>
                  </div>
                </div>
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Top 3 + radar */}
          {creators.length >= 3 && (
            <>
              <h2 style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:800, color:'var(--t2)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>
                Top 3 Performers
              </h2>
              <div className="grid-3" style={{ marginBottom:24 }}>
                {creators.slice(0, 3).map((c, i) => (
                  <div key={c._id} className="card" style={{ padding:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:20 }}>{['🥇','🥈','🥉'][i]}</span>
                      <Avatar src={c.avatar} name={c.displayName} size={36}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {c.displayName}
                        </div>
                        <div style={{ fontSize:10, color:'var(--t3)' }}>{c.niche || 'Creator'}</div>
                      </div>
                    </div>
                    <CreatorRadar creator={c}/>
                    <div style={{ textAlign:'center', marginTop:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--gold)', fontFamily:'var(--fd)' }}>
                        OCS: {calcOverallScore(c)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Quick links */}
          <h2 style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:800, color:'var(--t2)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>
            Intelligence Sections
          </h2>
          <div className="grid-2" style={{ gap:12 }}>
            {[
              { label:'Top Performers',    desc:'Creators with highest overall scores',      icon:Crown,       tab:'top',         color:'var(--gold)' },
              { label:'Rising Creators',   desc:'Fastest growing creators this season',       icon:TrendingUp,  tab:'rising',      color:'#10b981'    },
              { label:'Most Reliable',     desc:'Creators with best delivery & completion',   icon:CheckCircle2,tab:'reliability', color:'var(--acc2)' },
              { label:'Top Engagement',    desc:'Creators driving the most engagement',       icon:Heart,       tab:'engagement',  color:'#e11d48'    },
            ].map(s => (
              <div
                key={s.label}
                className="card card-hover"
                style={{ padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}
                onClick={() => setTab(s.tab)}
              >
                <div style={{ width:40, height:40, borderRadius:'var(--r)', background:`${s.color}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <s.icon size={18} style={{ color:s.color }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>{s.label}</div>
                  <div style={{ fontSize:11, color:'var(--t3)' }}>{s.desc}</div>
                </div>
                <ChevronRight size={14} style={{ color:'var(--t3)', flexShrink:0 }}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Other tabs: creator lists ─────────────────── */}
      {tab !== 'overview' && (
        <div>
          <div style={{ position:'relative', marginBottom:16, maxWidth:360 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search creators…"
              className="form-input"
              style={{ paddingLeft:30, height:36, fontSize:12 }}
            />
          </div>
          {loading
            ? <PageLoader/>
            : creators.length === 0
              ? <EmptyState icon="🔍" title="No creators found" desc="Try a different search"/>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {creators.map((c, i) => (
                    <CreatorCard
                      key={c._id}
                      c={c}
                      rank={i + 1}
                      highlight={i < 3}
                    />
                  ))}
                </div>
              )
          }
        </div>
      )}
    </div>
  );
}
