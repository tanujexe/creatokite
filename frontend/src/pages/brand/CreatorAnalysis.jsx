// ═══════════════════════════════════════════════════════════════
// pages/brand/CreatorAnalysis.jsx
// Creator Engagement Analysis — Brand + Admin tool
// Paste any Instagram or YouTube URL → get full public metrics,
// CAS score, engagement breakdown, radar chart, benchmark
// ═══════════════════════════════════════════════════════════════
import { useState, useRef } from 'react';
import { analyticsAPI } from '../../api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Search, Instagram, Youtube, Zap, Shield, TrendingUp,
  Users, Eye, Heart, MessageCircle, RefreshCw, Star,
  AlertTriangle, CheckCircle, Activity, Award, Copy,
  ExternalLink,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────
const fmt = n => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return String(n);
};
const pct = n => `${(+n || 0).toFixed(2)}%`;

const BADGE_CFG = {
  ELITE:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',    label: 'ELITE',    icon: Star,          desc: 'Top-tier creator, auto-approved for campaigns' },
  VERIFIED: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',    label: 'VERIFIED', icon: CheckCircle,   desc: 'Strong metrics, suitable for most campaigns'   },
  STANDARD: { color: '#818cf8', bg: 'rgba(129,140,248,0.12)',   label: 'STANDARD', icon: Shield,       desc: 'Good baseline, review for niche fit'            },
  REVIEW:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',    label: 'REVIEW',   icon: AlertTriangle, desc: 'Needs manual review before onboarding'         },
};
const RISK_CFG = {
  LOW:    { color: '#34d399', label: 'LOW RISK',    icon: CheckCircle  },
  MEDIUM: { color: '#f59e0b', label: 'MED RISK',    icon: AlertTriangle },
  HIGH:   { color: '#f87171', label: 'HIGH RISK',   icon: AlertTriangle },
};
const SCORE_META = [
  { key: 'engagement',     label: 'Engagement',   color: '#818cf8' },
  { key: 'reach',          label: 'Reach',        color: '#a78bfa' },
  { key: 'authenticity',   label: 'Authenticity', color: '#34d399' },
  { key: 'consistency',    label: 'Consistency',  color: '#fbbf24' },
  { key: 'growth',         label: 'Growth',       color: '#22d3ee' },
  { key: 'brandSafety',    label: 'Brand Safety', color: '#4ade80' },
  { key: 'conversion',     label: 'Conversion',   color: '#fb923c' },
  { key: 'contentQuality', label: 'Content',      color: '#f472b6' },
];

// ── CAS Ring ─────────────────────────────────────────────────
function CASRing({ score = 0 }) {
  const r = 54, circ = 2 * Math.PI * r;
  const fill = (Math.min(score, 100) / 100) * circ;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ position: 'relative', width: 148, height: 148 }}>
      <svg width={148} height={148} viewBox="0 0 148 148">
        <circle cx={74} cy={74} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10}/>
        <circle cx={74} cy={74} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 74 74)"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 36, fontWeight: 900, fontFamily: 'var(--fd)', color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 700, letterSpacing: 1.5, marginTop: 2 }}>CAS SCORE</span>
      </div>
    </div>
  );
}

// ── Score Bar ─────────────────────────────────────────────────
function ScoreBar({ label, value, color }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}/100</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 99, transition: 'width 1.2s ease' }}/>
      </div>
    </div>
  );
}

// ── Stat Chip ─────────────────────────────────────────────────
function Stat({ icon: Icon, label, value, color = 'var(--p2)' }) {
  return (
    <div style={{
      background: 'var(--s2)', borderRadius: 12, padding: '14px 16px',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--fd)' }}>{value}</div>
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8,
      padding: '9px 14px', fontSize: 12,
    }}>
      {label && <p style={{ color: 'var(--t2)', marginBottom: 4 }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill, fontWeight: 700 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Platform Tag ──────────────────────────────────────────────
function PlatformTag({ platform }) {
  const isIG = platform === 'instagram';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: isIG ? 'rgba(225,48,108,0.12)' : 'rgba(255,0,0,0.10)',
      color: isIG ? '#e1306c' : '#ff4444',
      border: `1px solid ${isIG ? 'rgba(225,48,108,0.25)' : 'rgba(255,68,68,0.25)'}`,
    }}>
      {isIG ? <Instagram size={11}/> : <Youtube size={11}/>}
      {isIG ? 'Instagram' : 'YouTube'}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
export default function CreatorAnalysis() {
  const [igUrl,    setIgUrl]    = useState('');
  const [ytUrl,    setYtUrl]    = useState('');
  const [niche,    setNiche]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [copied,   setCopied]   = useState(false);
  const resultRef = useRef(null);

  const handleAnalyze = async () => {
    if (!igUrl.trim() && !ytUrl.trim()) {
      setError('Please enter at least one social profile URL.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await analyticsAPI.analyzeCreator({
        instagramUrl: igUrl.trim(),
        youtubeUrl:   ytUrl.trim(),
        niche:        niche.trim(),
      });
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setError(e?.response?.data?.message || 'Analysis failed. Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = result ? JSON.stringify({
      username: result.profile.username,
      platform: result.profile.platform,
      followers: result.profile.followers,
      er: result.profile.er,
      cas: result.cas,
      badge: result.badge,
      risk: result.riskLevel,
      scores: result.scores,
    }, null, 2) : '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Radar data ───────────────────────────────────────────
  const radarData = result
    ? SCORE_META.map(m => ({ subject: m.label, score: result.scores?.[m.key] || 0 }))
    : [];

  const barData = result
    ? SCORE_META.map(m => ({ name: m.label.slice(0, 7), score: result.scores?.[m.key] || 0, fill: m.color }))
    : [];

  const badgeCfg = result ? (BADGE_CFG[result.badge] || BADGE_CFG.REVIEW) : null;
  const riskCfg  = result ? (RISK_CFG[result.riskLevel] || RISK_CFG.MEDIUM) : null;
  const p        = result?.profile || {};

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ── Header ────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,var(--p),var(--acc))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} style={{ color: '#fff' }}/>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
              Creator Engagement Analysis
            </h2>
            <p style={{ color: 'var(--t3)', fontSize: 12, marginTop: 3 }}>
              Analyze any public Instagram or YouTube profile instantly — no login needed
            </p>
          </div>
        </div>
      </div>

      {/* ── Input Card ────────────────────────────────── */}
      <div className="card" style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(108,99,255,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Search size={15} style={{ color: 'var(--p2)' }}/>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>Paste Creator Profile URL</h3>
        </div>

        <div className="rs-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Instagram */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Instagram size={12} style={{ color: '#e1306c' }}/> Instagram Profile URL
            </label>
            <input
              className="input"
              placeholder="https://instagram.com/username"
              value={igUrl}
              onChange={e => setIgUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              style={{ width: '100%' }}
            />
          </div>
          {/* YouTube */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Youtube size={12} style={{ color: '#ff4444' }}/> YouTube Channel URL
            </label>
            <input
              className="input"
              placeholder="https://youtube.com/@channel"
              value={ytUrl}
              onChange={e => setYtUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6, display: 'block' }}>
              Niche (optional — improves Brand Safety score)
            </label>
            <input
              className="input"
              placeholder="e.g. fitness, tech, beauty..."
              value={niche}
              onChange={e => setNiche(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={loading}
            style={{ height: 42, paddingInline: 24, flexShrink: 0 }}
          >
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }}/> Analyzing…</>
              : <><Zap size={14}/> Analyze Creator</>
            }
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={14}/> {error}
          </div>
        )}

        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--t3)', lineHeight: 1.6, display:'flex', alignItems:'center', gap:4 }}>
          <Zap size={11} style={{ color: 'var(--gold)' }} /> Uses only <strong>public</strong> profile data. No Instagram login or OAuth required.
          Analysis typically takes 5–15 seconds.
        </p>
      </div>

      {/* ── Loading skeleton ──────────────────────────── */}
      {loading && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--s2)', animation: 'pulse 1.5s ease infinite' }}/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 14, background: 'var(--s2)', borderRadius: 6, width: '40%', animation: 'pulse 1.5s ease infinite' }}/>
              <div style={{ height: 10, background: 'var(--s2)', borderRadius: 6, width: '25%', animation: 'pulse 1.5s ease infinite' }}/>
            </div>
            <div style={{ width: 148, height: 148, borderRadius: '50%', background: 'var(--s2)', animation: 'pulse 1.5s ease infinite' }}/>
          </div>
          <div className="rs-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[...Array(4)].map((_,i) => (
              <div key={i} style={{ height: 70, background: 'var(--s2)', borderRadius: 10, animation: 'pulse 1.5s ease infinite' }}/>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          RESULTS
      ══════════════════════════════════════════════════ */}
      {result && !loading && (
        <div ref={resultRef} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Profile Header ──────────────────────────── */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(52,211,153,0.05))',
            border: '1px solid rgba(108,99,255,0.2)',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 }}>
              {/* Avatar + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 240 }}>
                {p.thumbnail
                  ? <img src={p.thumbnail} alt={p.username}
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
                        border: '2px solid rgba(108,99,255,0.3)' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  : <div style={{ width: 64, height: 64, borderRadius: '50%',
                      background: 'linear-gradient(135deg,var(--p),var(--acc))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 700, color: '#fff' }}>
                      {(p.username || '?')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--fd)', color: 'var(--t1)' }}>
                      @{p.username}
                    </span>
                    <PlatformTag platform={p.platform}/>
                    {p.isReal ? (
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                        color: '#34d399', background: 'rgba(52,211,153,0.1)',
                        border: '1px solid rgba(52,211,153,0.2)',
                        display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        <CheckCircle size={10} /> LIVE DATA
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                        color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        <AlertTriangle size={10} /> ESTIMATED DATA
                      </span>
                    )}
                  </div>
                  {p.biography && (
                    <p style={{ fontSize: 12, color: 'var(--t2)', maxWidth: 380, lineHeight: 1.5, marginBottom: 6 }}>
                      {p.biography.slice(0, 120)}{p.biography.length > 120 ? '…' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                      color: badgeCfg.color, background: badgeCfg.bg,
                      border: `1px solid ${badgeCfg.color}30`,
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      {badgeCfg.icon && <badgeCfg.icon size={10} />}
                      {badgeCfg.label}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                      color: riskCfg.color, background: `${riskCfg.color}15`,
                      border: `1px solid ${riskCfg.color}30`,
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      {riskCfg.icon && <riskCfg.icon size={10} />}
                      {riskCfg.label}
                    </span>
                    {result.autoApprove && (
                      <span style={{
                        fontSize: 10, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                        color: '#4ade80', background: 'rgba(74,222,128,0.1)',
                        border: '1px solid rgba(74,222,128,0.25)',
                        display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        <Zap size={10} /> Auto-Approve Eligible
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CAS Ring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <CASRing score={result.cas} />
                <p style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center', maxWidth: 130, lineHeight: 1.5 }}>
                  {badgeCfg.desc}
                </p>
              </div>

              {/* Copy button */}
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn btn-ghost btn-sm" onClick={handleCopy}
                  title="Copy analysis JSON">
                  <Copy size={13}/>
                  {copied ? 'Copied!' : 'Copy Report'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Core Metrics ────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            <Stat icon={Users}         label="Followers"      value={fmt(p.followers)}    color="var(--p2)"    />
            <Stat icon={Eye}           label="Avg Views"      value={fmt(p.avgViews)}     color="#22d3ee"      />
            <Stat icon={Heart}         label="Avg Likes"      value={fmt(p.avgLikes)}     color="#f472b6"      />
            <Stat icon={MessageCircle} label="Avg Comments"   value={fmt(p.avgComments)}  color="#a78bfa"      />
            <Stat icon={TrendingUp}    label="Eng. Rate"      value={pct(p.er)}           color="var(--acc2)"  />
            <Stat icon={Activity}      label="Posts/Week"     value={(p.postsPerWeek||0).toFixed(1)} color="var(--gold)" />
          </div>

          {/* ── CAS Breakdown + Charts ───────────────────── */}
          <div className="rs-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Score Bars */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Award size={14} style={{ color: 'var(--p2)' }}/>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>Score Breakdown</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCORE_META.map(m => (
                  <ScoreBar key={m.key} label={m.label} value={result.scores?.[m.key] || 0} color={m.color}/>
                ))}
              </div>
            </div>

            {/* Radar */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Star size={14} style={{ color: 'var(--gold)' }}/>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>CAS Radar</h3>
              </div>
              <div style={{ flex: 1, minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)"/>
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--t3)' }}/>
                    <Radar name="Score" dataKey="score"
                      stroke="var(--p2)" fill="var(--p2)" fillOpacity={0.18}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Bar chart of scores ──────────────────────── */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <BarChart size={14} style={{ color: 'var(--acc2)' }}/>
              <h3 style={{ fontSize: 13, fontWeight: 700 }}>Score Comparison (Bar)</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--t3)' }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--t3)' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip />}/>
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <rect key={index}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Platform detail cards ────────────────────── */}
          {(result.profile.igData || result.profile.ytData) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
              {result.profile.igData && (
                <div className="card" style={{ border: '1px solid rgba(225,48,108,0.15)', background: 'rgba(225,48,108,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Instagram size={15} style={{ color: '#e1306c' }}/>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>Instagram Detail</h3>
                  </div>
                  <div className="rs-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      ['Followers',   fmt(result.profile.igData.followers)],
                      ['Avg Views',   fmt(result.profile.igData.avgViews)],
                      ['Avg Likes',   fmt(result.profile.igData.avgLikes)],
                      ['Avg Comments',fmt(result.profile.igData.avgComments)],
                      ['Eng Rate',    pct(result.profile.igData.er)],
                      ['Posts/Week',  (result.profile.igData.postsPerWeek||0).toFixed(1)],
                      ['Total Posts', fmt(result.profile.igData.totalPosts)],
                      ['Following',   fmt(result.profile.igData.followingCount)],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: 'var(--s2)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e1306c' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.profile.ytData && (
                <div className="card" style={{ border: '1px solid rgba(255,68,68,0.15)', background: 'rgba(255,68,68,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Youtube size={15} style={{ color: '#ff4444' }}/>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>YouTube Detail</h3>
                  </div>
                  <div className="rs-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      ['Subscribers',  fmt(result.profile.ytData.subscribers)],
                      ['Avg Views',    fmt(result.profile.ytData.avgViews)],
                      ['Avg Likes',    fmt(result.profile.ytData.avgLikes)],
                      ['Avg Comments', fmt(result.profile.ytData.avgComments)],
                      ['Eng Rate',     pct(result.profile.ytData.er)],
                      ['Posts/Week',   (result.profile.ytData.postsPerWeek||0).toFixed(1)],
                      ['Total Videos', fmt(result.profile.ytData.totalVideos)],
                      ['Channel',      result.profile.ytData.channelTitle?.slice(0,15)||'—'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: 'var(--s2)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#ff4444' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Recommendation box ──────────────────────── */}
          <div className="card" style={{
            background: result.autoApprove
              ? 'linear-gradient(135deg,rgba(74,222,128,0.07),rgba(52,211,153,0.04))'
              : result.riskLevel === 'HIGH'
                ? 'linear-gradient(135deg,rgba(248,113,113,0.07),rgba(239,68,68,0.03))'
                : 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(251,191,36,0.03))',
            border: `1px solid ${result.autoApprove ? 'rgba(74,222,128,0.2)' : result.riskLevel === 'HIGH' ? 'rgba(248,113,113,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {result.autoApprove ? (
                  <Target size={24} style={{ color: '#4ade80' }} />
                ) : result.riskLevel === 'HIGH' ? (
                  <AlertTriangle size={24} style={{ color: '#f87171' }} />
                ) : (
                  <ClipboardList size={24} style={{ color: '#f59e0b' }} />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
                  {result.autoApprove
                    ? 'Recommended — Eligible for immediate campaign assignment'
                    : result.riskLevel === 'HIGH'
                      ? 'High Risk — Manual review strongly advised'
                      : 'Review Advised — Verify niche alignment before assigning'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>
                  CAS: <strong style={{ color: 'var(--t1)' }}>{result.cas}/100</strong> &nbsp;|&nbsp;
                  Badge: <strong style={{ color: badgeCfg.color }}>{badgeCfg.label}</strong> &nbsp;|&nbsp;
                  Risk: <strong style={{ color: riskCfg.color }}>{riskCfg.label}</strong>
                  {result.autoApprove && (
                    <> &nbsp;|&nbsp; <strong style={{ color: '#4ade80' }}>Auto-Approve Threshold Met ✓</strong></>
                  )}
                </p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6, lineHeight: 1.6 }}>
                  Engagement rate of <strong>{pct(p.er)}</strong> with{' '}
                  <strong>{fmt(p.followers)}</strong> followers.
                  {p.er >= 3 ? ' Strong organic engagement — audience is genuinely interested.' : ''}
                  {p.er < 1 && p.followers > 50000 ? ' Low ER relative to follower count — possible inflated following.' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* ── Re-analyze button ────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>
              <RefreshCw size={13}/> Analyze Another Creator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
