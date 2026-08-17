import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader, StatCard } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Target, Wallet, TrendingUp, Star, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreatorShell from './CreatorShell';

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'var(--t2)', marginBottom:4 }}>{label}</p>
      {payload.map(p=><p key={p.name} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const BADGE_MAP = {
  ELITE:    { color:'#fbbf24', label:'⭐ ELITE' },
  VERIFIED: { color:'var(--acc2)', label:'✔ VERIFIED' },
  STANDARD: { color:'var(--p2)',   label:'✦ STANDARD' },
  REVIEW:   { color:'var(--gold)', label:'⚠ REVIEW' },
};
const RISK_COLOR = { LOW:'var(--acc2)', MEDIUM:'var(--gold)', HIGH:'var(--rose)' };

const SCORE_META = [
  { key:'engagement',    label:'Engagement',  color:'var(--p2)'  },
  { key:'reach',         label:'Reach',       color:'#a78bfa'    },
  { key:'authenticity',  label:'Authenticity',color:'var(--acc2)'},
  { key:'consistency',   label:'Consistency', color:'var(--gold)'},
  { key:'growth',        label:'Growth',      color:'#22d3ee'    },
  { key:'brandSafety',   label:'Brand Safety',color:'var(--acc)' },
  { key:'conversion',    label:'Conversion',  color:'#fb923c'    },
  { key:'contentQuality',label:'Content',     color:'#f472b6'    },
];

function CASRingLarge({ score=0, badge='REVIEW' }) {
  const bm = BADGE_MAP[badge]||BADGE_MAP.REVIEW;
  const r=50, circ=2*Math.PI*r, fill=(score/100)*circ;
  const color = score>=75?'var(--acc2)':score>=50?'var(--gold)':'var(--rose)';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ position:'relative', width:140, height:140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9"/>
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 70 70)" style={{ transition:'stroke-dasharray 1.5s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:34, fontWeight:900, fontFamily:"'Plus Jakarta Sans', 'Inter', sans-serif", letterSpacing:'-0.03em', color }}>{score}</span>
          <span style={{ fontSize:10, color:'var(--t3)', fontWeight:600, letterSpacing:1 }}>CAS SCORE</span>
        </div>
      </div>
      <span style={{ fontSize:11, padding:'3px 12px', borderRadius:99, fontWeight:800,
        color:bm.color, background:`${bm.color}15`, border:`1px solid ${bm.color}30` }}>{bm.label}</span>
    </div>
  );
}

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

export default function CreatorAnalytics() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData]     = useState(null);
  const [casData, setCasData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.creator(),
      user?.socialAnalyzed ? analyticsAPI.creatorCAS() : Promise.resolve(null),
    ]).then(([d, cas]) => {
      setData(d);
      if (cas) setCasData(cas);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [user?.socialAnalyzed]);

  if (loading) return <PageLoader />;
  const s = data?.stats || {};
  const trend = data?.trend || [];

  const radarData = casData ? SCORE_META.map(m=>({ subject:m.label, score:casData.casBreakdown?.[m.key]||0 })) : [];

  return (
    <CreatorShell style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontFamily:'var(--fh)', fontWeight:800, fontSize:22, letterSpacing: '-0.02em', color: 'var(--t1)', marginBottom:4 }}>My Analytics</h2>
        <p style={{ color:'var(--t2)', fontSize:13, fontWeight: 500 }}>Your campaign performance and Creator Automation Score.</p>
      </div>

      <div className="grid-4">
        <CustomStatCard label="Total Campaigns" value={s.total||0}      icon={Target}    color="var(--p2)"  />
        <CustomStatCard label="Completed"       value={s.completed||0}  icon={Star}      color="var(--acc2)"/>
        <CustomStatCard label="Total Earned"    value={formatStatCurrency(s.earned)} icon={Wallet} color="var(--gold)"/>
        <CustomStatCard label="Success Rate"    value={`${s.successRate||100}%`} icon={TrendingUp} color="var(--acc)"/>
      </div>

      {/* ── CAS SECTION ─────────────────────────────── */}
      {casData ? (
        <div className="card" style={{ border:'1px solid rgba(108,99,255,0.18)', background:'var(--glass-bg)', backdropFilter:'var(--glass-blur)', WebkitBackdropFilter:'var(--glass-blur)', borderRadius: 20, boxShadow: 'var(--glass-shadow)', padding: 26 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            <Zap size={18} style={{ color:'var(--p2)' }}/>
            <h3 style={{ fontSize:15, fontWeight:800, fontFamily: 'var(--fh)' }}>Creator Automation Score</h3>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:6,
              background:'rgba(108,99,255,0.10)', color:'var(--p2)',
              border:'1px solid rgba(108,99,255,0.20)', fontWeight:700, letterSpacing: 0.3 }}>AI-POWERED</span>
            {casData.verificationStatus && (
              <span style={{ marginLeft:'auto', fontSize:11, padding:'3px 12px', borderRadius:8, fontWeight:700,
                color:casData.verificationStatus==='approved'?'var(--acc2)':casData.verificationStatus==='pending'?'var(--gold)':'var(--rose)',
                background:casData.verificationStatus==='approved'?'rgba(249,182,55,0.08)':casData.verificationStatus==='pending'?'rgba(245,166,35,0.08)':'rgba(248,113,113,0.08)',
                border: `1px solid ${casData.verificationStatus==='approved'?'rgba(249,182,55,0.2)':casData.verificationStatus==='pending'?'rgba(245,166,35,0.2)':'rgba(248,113,113,0.2)'}`
              }}>
                {casData.verificationStatus==='approved'?'✔ Verified':casData.verificationStatus==='pending'?'⏳ Pending Review':'✕ Not Approved'}
              </span>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:28, alignItems:'start' }}>
            {/* Ring + risk */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18, background: 'rgba(255,255,255,0.01)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
              <CASRingLarge score={casData.casScore||0} badge={casData.casBadge} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Level</div>
                <span style={{ fontWeight:800, fontSize:12, color:RISK_COLOR[casData.casRisk]||'var(--t2)',
                  background:`${RISK_COLOR[casData.casRisk]||'gray'}12`,
                  border: `1px solid ${RISK_COLOR[casData.casRisk]||'gray'}28`,
                  padding:'4px 14px', borderRadius:6 }}>{casData.casRisk||'—'}</span>
              </div>
              {casData.analyzedAt && (
                <div style={{ fontSize:10, color:'var(--t3)', fontWeight: 500 }}>
                  Analyzed {new Date(casData.analyzedAt).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>

            {/* Radar + bar grid */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {radarData.length>0 && (
                <div style={{ height:220, display:'flex', justifyContent:'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:'var(--t3)', fontFamily:'var(--fh)', fontWeight: 600 }}/>
                      <Radar name="Score" dataKey="score" stroke="var(--p2)" fill="var(--p2)" fillOpacity={0.10}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="rs-cols-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {SCORE_META.map(m=>(
                  <div key={m.key} style={{ background:'rgba(255,255,255,0.01)', borderRadius:12, padding:'12px 14px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:10, color:'var(--t3)', marginBottom:6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</div>
                    <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:100, marginBottom:8 }}>
                      <div style={{ height:'100%', width:`${casData.casBreakdown?.[m.key]||0}%`, background:m.color, borderRadius:100, transition:'width 1s' }}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:800, color:m.color, fontFamily: 'var(--fd)' }}>{casData.casBreakdown?.[m.key]||0}/100</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Not yet analyzed — prompt */
        <div style={{
          padding:'42px 28px', background:'rgba(230,95,43,0.04)', border:'1px dashed rgba(230,95,43,0.25)',
          borderRadius:22, textAlign:'center', display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'rgba(230,95,43,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            border: '1px solid rgba(230,95,43,0.25)'
          }}>
            <Zap size={24} style={{ color: 'var(--acc)' }} />
          </div>
          <h3 style={{ fontSize:18, fontWeight:800, marginBottom:8, fontFamily: 'var(--fh)', color: 'var(--t1)', letterSpacing: '-0.02em' }}>Get Your AI Creator Score</h3>
          <p style={{ color:'var(--t2)', fontSize:13.5, marginBottom:22, maxWidth:440, margin:'0 auto 22px', fontWeight: 500, lineHeight: 1.6 }}>
            Connect your Instagram or YouTube to calculate your Creator Automation Score and submit for instant brand verification.
          </p>
          <button className="btn btn-primary" onClick={() => nav('/creator/profile')} style={{ height: 42, borderRadius: 12, padding: '0 24px', fontSize: 13, fontWeight: 700 }}>
            ⚡ Connect Social Profile
          </button>
        </div>
      )}

      {/* Campaign trend chart */}
      {trend.length>0 && (
        <div className="card" style={{ borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:800, marginBottom:20 }}>Campaign Assignments Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--t3)', fontFamily:'var(--fh)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--t3)', fontFamily:'var(--fd)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="assignments" stroke="var(--p2)" strokeWidth={3} dot={{ fill:'var(--p2)', strokeWidth:0, r:5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign history table */}
      {data?.campaigns?.length>0 && (
        <div className="card" style={{ padding:0, overflow:'hidden', borderRadius:20 }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:800, fontFamily: 'var(--fh)' }}>Campaign History</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.campaigns.map((c,i)=>(
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < data.campaigns.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 107, 87, 0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', fontFamily: 'var(--fh)' }}>{c.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{c.assignment?.status || '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{c.niche}</span>
                  <span style={{ color:'var(--acc2)', fontWeight:800, fontFamily: 'var(--fd)', fontSize: 13 }}>₹{(c.assignment?.paymentAlloc||0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </CreatorShell>
  );
}
