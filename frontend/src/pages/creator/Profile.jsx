import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, analyticsAPI } from '../../api';
import { Btn, Input, Textarea } from '../../components/ui';
import toast from 'react-hot-toast';
import { Zap, Send, CheckCircle, AlertTriangle, Clock, Save, Lock, Sparkles, User, Mail, Globe, MapPin, Trash2, Camera } from 'lucide-react';
import CreatorShell from './CreatorShell';

const NICHES = ['Tech','Beauty','Fashion','Fitness','Food','Travel','Gaming','Education','Finance','Lifestyle','Music','Art','Other'];

const STEPS = [
  { icon:'🔍', label:'Fetching social profile...'        },
  { icon:'📊', label:'Analyzing engagement metrics...'   },
  { icon:'👥', label:'Checking audience authenticity...' },
  { icon:'📈', label:'Calculating reach & growth...'     },
  { icon:'🛡️', label:'Running brand safety check...'    },
  { icon:'🤖', label:'Computing Creator Score...'        },
];

const SCORE_META = [
  { key:'engagement',    label:'Engagement Quality',  color:'var(--p2)'  },
  { key:'reach',         label:'Audience Reach',      color:'#a78bfa'    },
  { key:'authenticity',  label:'Authenticity',         color:'var(--acc2)'},
  { key:'consistency',   label:'Posting Consistency',  color:'var(--gold)'},
  { key:'growth',        label:'Growth Rate',          color:'#22d3ee'    },
  { key:'brandSafety',   label:'Brand Safety',         color:'var(--acc)' },
  { key:'conversion',    label:'Conversion Potential', color:'#fb923c'    },
  { key:'contentQuality',label:'Content Quality',      color:'#f472b6'    },
];

const BADGE_MAP = {
  ELITE:    { color:'#fbbf24',     bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)',  label:'⭐ ELITE'    },
  VERIFIED: { color:'var(--acc2)', bg:'rgba(249,182,55,0.08)',border:'rgba(249,182,55,0.2)',  label:'✔ VERIFIED'  },
  STANDARD: { color:'var(--p2)',   bg:'rgba(108,99,255,0.08)',border:'rgba(108,99,255,0.2)', label:'✦ STANDARD'  },
  REVIEW:   { color:'var(--gold)', bg:'rgba(245,166,35,0.08)',border:'rgba(245,166,35,0.2)', label:'⚠ REVIEW'   },
};
const RISK_CLR = { LOW:'var(--acc2)', MEDIUM:'var(--gold)', HIGH:'var(--rose)' };

function ScoreBar({ label, value=0, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12 }}>
        <span style={{ color:'var(--t2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight:700, color: 'var(--t1)' }}>{value}/100</span>
      </div>
      <div className="progress" style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
        <div className="progress-bar" style={{ width:`${value}%`, background:color, borderRadius: 99, transition:'width 1.2s ease' }}/>
      </div>
    </div>
  );
}

function CASRing({ cas=0, badge='REVIEW' }) {
  const bm  = BADGE_MAP[badge] || BADGE_MAP.REVIEW;
  const col = cas>=75?'var(--acc2)':cas>=50?'var(--gold)':'var(--rose)';
  const r=38, circ=2*Math.PI*r;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:110, height:110 }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="7"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke={col} strokeWidth="7"
            strokeDasharray={`${(cas/100)*circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 55 55)" style={{ transition:'stroke-dasharray 1.5s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:26, fontWeight:900, fontFamily:'var(--fd)', color:col }}>{cas}</span>
          <span style={{ fontSize:9, color:'var(--t3)', fontWeight:600, letterSpacing:1 }}>CAS</span>
        </div>
      </div>
      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, fontWeight:800, letterSpacing:0.5,
        color:bm.color, background:bm.bg, border:`1px solid ${bm.border}` }}>{bm.label}</span>
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    displayName: user?.displayName||'',
    email:       user?.email||'',
    bio:         user?.bio||'',
    location:    user?.location||'',
    website:     user?.website||'',
    niche:       user?.niche||'',
    avatar:      user?.avatar||'',
  });

  const [igUrl, setIgUrl]     = useState(user?.socialUrls?.instagram||'');
  const [ytUrl, setYtUrl]     = useState(user?.socialUrls?.youtube||'');

  // Sync user details on mount or change
  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName||'',
        email:       user.email||'',
        bio:         user.bio||'',
        location:    user.location||'',
        website:     user.website||'',
        niche:       user.niche||'',
        avatar:      user.avatar||'',
      });
      setIgUrl(user.socialUrls?.instagram||'');
      setYtUrl(user.socialUrls?.youtube||'');
    }
  }, [user]);

  const [analyzing, setAnalyzing] = useState(false);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [casData,   setCasData]   = useState(null);
  const [requestingReanalysis, setRequestingReanalysis] = useState(false);
  const [reanalysisRequested,  setReanalysisRequested]  = useState(false);

  // Load existing CAS on mount
  useEffect(() => {
    if (user?.socialAnalyzed) {
      analyticsAPI.creatorCAS()
        .then(d => setCasData(d))
        .catch(() => {});
    }
  }, [user?.socialAnalyzed]);

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(form);
      await refreshUser();
      toast.success('Profile saved!');
    } catch(e) { toast.error(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ WARNING: Deleting your account will permanently remove all your settings, matches, and profile data from Creatokite. This action cannot be undone.\n\nAre you sure you want to delete your account?")) {
      try {
        await usersAPI.deleteAccount();
        toast.success('Account successfully deleted.');
        localStorage.removeItem('ck_token');
        localStorage.removeItem('ck_refresh');
        setUser(null);
        navigate('/login');
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  const analyzeProfile = async () => {
    if (!igUrl && !ytUrl) {
      toast.error('Enter at least one social URL (Instagram or YouTube).');
      return;
    }
    setAnalyzing(true);
    setStepIdx(0);
    setCasData(null);

    const interval = setInterval(() => {
      setStepIdx(p => p < STEPS.length-1 ? p+1 : p);
    }, 900);

    try {
      const data = await analyticsAPI.connectSocial({ instagramUrl:igUrl, youtubeUrl:ytUrl });
      clearInterval(interval);
      await new Promise(r => setTimeout(r, 400));
      setCasData(data);
      await refreshUser();
      toast.success(data.autoApprove ? '🎉 Auto-approved! Excellent score.' : '✅ Analysis done. Pending admin review.');
    } catch(e) {
      clearInterval(interval);
      const rawMsg = e.response?.data?.message || e.message || '';
      const isScraperNoise = /instaloader|subprocess|python|method\s*[0-9]/i.test(rawMsg);
      const displayMsg = isScraperNoise
        ? 'Could not fetch profile data. Check your Instagram URL and try again.'
        : rawMsg || 'Analysis failed. Check your URLs and try again.';
      toast.error(displayMsg);
    } finally { setAnalyzing(false); }
  };

  const handleRequestReanalysis = async () => {
    if (reanalysisRequested) return;
    setRequestingReanalysis(true);
    try {
      await analyticsAPI.requestReanalysis();
      setReanalysisRequested(true);
      toast.success('✅ Re-analysis request sent to admin!');
    } catch(e) {
      toast.error(e.response?.data?.message || 'Request failed. Try again.');
    } finally {
      setRequestingReanalysis(false);
    }
  };

  const complete = user?.profileComplete || 0;
  const vs       = user?.verificationStatus || 'none';
  const vstatus = {
    none:     { label:'Not submitted',  color:'var(--t3)',    Icon:null },
    pending:  { label:'Pending review', color:'var(--gold)',  Icon:Clock },
    approved: { label:'Verified ✔',    color:'var(--acc2)', Icon:CheckCircle },
    rejected: { label:'Not approved',  color:'var(--rose)', Icon:AlertTriangle },
  }[vs];

  return (
    <CreatorShell style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap:'wrap', gap:16, alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily:'Inter, sans-serif', fontWeight:800, fontSize: 'clamp(24px, 4vw, 32px)', letterSpacing: '-0.02em', color: 'var(--t1)', marginBottom:4 }}>My Profile</h2>
          <p style={{ color:'var(--t2)', fontSize:13.5, fontWeight: 500 }}>Keep your profile complete and social profiles fresh for better campaign matches.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 12, padding: '0 24px',
            background: 'var(--acc)', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5,
            cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(230,95,43,0.3)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e85d45'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--acc)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Completeness bar */}
      <div style={{
        padding: '20px 24px',
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div className="flex-between" style={{ marginBottom:10, fontSize:13 }}>
          <span style={{ color: 'var(--acc)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} /> Profile Completeness
          </span>
          <span style={{ fontWeight:900, fontSize: 16, color: 'var(--t1)' }}>{complete}%</span>
        </div>
        <div style={{ height: 10, background: 'var(--s2)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ height:'100%', width:`${complete}%`, background:'linear-gradient(90deg, #E65F2B 0%, #F5A623 100%)', borderRadius: 99, transition:'width 1s ease' }}/>
        </div>
        {complete < 80 && (
          <div style={{ fontSize:12, color: 'var(--t2)', marginTop: 10, fontWeight: 500 }}>
            💡 Add bio, location, and social profiles to increase your score and unlock higher paying brand campaigns.
          </div>
        )}
      </div>

      {/* ── SOCIAL INTELLIGENCE ───────────────────────────────── */}
      <div style={{
        border: '1px solid rgba(230, 95, 43, 0.25)',
        background: 'var(--s1)',
        borderRadius: 20,
        boxShadow: 'var(--glass-shadow)',
        padding: '26px clamp(18px, 3vw, 28px)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap: 'wrap' }}>
          <Zap size={20} style={{ color:'var(--acc)' }}/>
          <h3 style={{ fontSize:17, fontWeight:800, color: 'var(--t1)', margin: 0 }}>Creator Automation Score (CAS)</h3>
          <span style={{ fontSize:10, padding:'3px 10px', borderRadius:99,
            background:'rgba(230,95,43,0.12)', color:'var(--acc)', border:'1px solid rgba(230,95,43,0.3)', fontWeight:800, letterSpacing: 0.5 }}>AI-POWERED</span>
        </div>
        <p style={{ color:'var(--t2)', fontSize:13, marginBottom:16, fontWeight: 500 }}>
          Paste your social URLs — AI fetches real followers, likes, engagement automatically. No manual entry needed.
        </p>

        {/* Verification status */}
        {vstatus && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
            borderRadius:99, fontSize:11.5, fontWeight:700, marginBottom:18,
            color:vstatus.color, background:`${vstatus.color}14`, border:`1px solid ${vstatus.color}30` }}>
            {vstatus.Icon && <vstatus.Icon size={14}/>}
            Verification Status: {vstatus.label}
            {user?.verificationNote && <span style={{ color:'var(--t2)', fontWeight:400 }}> — {user.verificationNote}</span>}
          </div>
        )}

        {/* URL inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 6, display: 'block', color: 'var(--t2)' }}>📸 Instagram URL or @username</label>
            <input
              placeholder="instagram.com/yourhandle or @handle"
              value={igUrl} onChange={e=>setIgUrl(e.target.value)} disabled={analyzing}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)',
                fontSize: 13.5, outline: 'none', transition: 'all 0.2s'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 6, display: 'block', color: 'var(--t2)' }}>▶ YouTube URL or @channel</label>
            <input
              placeholder="youtube.com/@yourchannel"
              value={ytUrl} onChange={e=>setYtUrl(e.target.value)} disabled={analyzing}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)',
                fontSize: 13.5, outline: 'none', transition: 'all 0.2s'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
        </div>

        {/* Show fetch button only if not yet analyzed */}
        {!user?.socialAnalyzed && (
          <button
            onClick={analyzeProfile}
            disabled={analyzing}
            style={{
              display:'inline-flex', alignItems:'center', gap:8, height: 42, borderRadius: 12, padding: '0 24px',
              background: 'var(--acc)', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5,
              cursor: analyzing ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(230,95,43,0.3)'
            }}
          >
            <Zap size={15} style={analyzing ? { animation:'spin 1s linear infinite' } : {}}/>
            {analyzing ? 'Analyzing…' : 'Auto-Fetch & Submit for Approval'}
          </button>
        )}

        {/* Analysis steps animation */}
        {analyzing && (
          <div style={{ marginTop:16, padding:20, background:'var(--s2)', borderRadius:14, border:'1px solid var(--border)' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                opacity:i<=stepIdx?1:0.25, transition:'opacity 0.4s' }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:12.5, fontWeight:i===stepIdx?800:500,
                  color:i<stepIdx?'var(--acc2)':i===stepIdx?'var(--acc)':'var(--t2)', transition:'color 0.3s' }}>
                  {i<stepIdx?'✓ ':i===stepIdx?'→ ':''}{s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CAS Result */}
        {casData && !analyzing && (
          <div style={{ marginTop:20 }}>
            <div style={{ padding:'12px 16px', borderRadius:12, marginBottom:20, fontSize:12.5, lineHeight:1.6,
              background:casData.autoApprove?'rgba(249,182,55,0.08)':'rgba(230,95,43,0.08)',
              border:`1px solid ${casData.autoApprove?'rgba(249,182,55,0.25)':'rgba(230,95,43,0.25)'}`,
              color:casData.autoApprove?'var(--acc2)':'var(--acc)', fontWeight: 600 }}>
              {casData.message}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
              {/* Ring */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, background: 'var(--s2)', padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
                <CASRing cas={casData.cas} badge={casData.badge}/>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--t2)', marginBottom:6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Level</div>
                  <span style={{ fontWeight:800, color:RISK_CLR[casData.riskLevel]||'var(--t1)',
                    background:`${RISK_CLR[casData.riskLevel]||'gray'}14`, border: `1px solid ${RISK_CLR[casData.riskLevel]||'gray'}30`, padding:'4px 14px', borderRadius:99, fontSize:11 }}>
                    {casData.riskLevel}
                  </span>
                </div>

                {/* Fetched data cards */}
                {[casData.igData, casData.ytData].filter(Boolean).map((d,i)=>(
                  <div key={i} style={{ width:'100%', background:'var(--s1)', borderRadius:12,
                    padding:14, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:12, color:'var(--acc)', fontWeight:800, marginBottom:10 }}>
                      {d.platform==='instagram'?'📸 Instagram':'▶ YouTube'}
                      {!d.isReal&&<span style={{ color:'var(--gold)', marginLeft:4, fontSize:10, fontWeight:400 }}>(estimated)</span>}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        ['Followers',    (d.followers||d.subscribers||0).toLocaleString('en-IN')],
                        ['Avg Likes',    (d.avgLikes||0).toLocaleString('en-IN')],
                        ['Avg Comments', (d.avgComments||0).toLocaleString('en-IN')],
                        ['Eng. Rate',    `${d.er||0}%`],
                      ].map(([lbl,val])=>(
                        <div key={lbl} style={{ background:'var(--s2)', borderRadius:8, padding:'8px 10px', textAlign:'center', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize:13.5, fontWeight:800, color:'var(--t1)' }}>{val}</div>
                          <div style={{ fontSize:10, color:'var(--t2)', marginTop: 2, fontWeight: 600 }}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Score breakdown */}
              <div style={{ background: 'var(--s2)', padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
                <p style={{ fontSize:11, color:'var(--t2)', fontWeight:800, letterSpacing:0.5, marginBottom:16, textTransform: 'uppercase' }}>Score Breakdown</p>
                {SCORE_META.map(m=>(
                  <ScoreBar key={m.key} label={m.label} value={casData.scores?.[m.key]||0} color={m.color}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Already analyzed — show quick summary with re-analysis request */}
        {user?.socialAnalyzed && !casData && !analyzing && (
          <div style={{ marginTop:16, padding:'16px 20px', background:'var(--s2)', borderRadius:16,
            border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize:11.5, color:'var(--t2)', marginBottom:4, fontWeight: 600 }}>Current CAS Score</div>
              <div style={{ fontSize:26, fontWeight:900, fontFamily:'Inter, sans-serif',
                color:user.casScore>=75?'var(--acc2)':user.casScore>=50?'var(--gold)':'var(--rose)' }}>
                {user.casScore}/100
                <span style={{ fontSize:12.5, color:'var(--t2)', fontWeight:600, marginLeft:8 }}>({user.casBadge})</span>
              </div>
              {user.analyzedAt && (
                <div style={{ fontSize:11.5, color:'var(--t2)', marginTop:4, fontWeight: 500 }}>
                  Last fetched: {new Date(user.analyzedAt).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
            <button
              onClick={handleRequestReanalysis}
              disabled={requestingReanalysis || reanalysisRequested}
              style={{
                display:'inline-flex', alignItems:'center', gap:6, height:38, borderRadius:10, padding: '0 18px',
                background: reanalysisRequested ? 'var(--s2)' : 'var(--s1)',
                border: '1px solid var(--border)', color: 'var(--t1)', fontWeight: 700, fontSize: 12.5,
                cursor: (requestingReanalysis || reanalysisRequested) ? 'not-allowed' : 'pointer'
              }}
            >
              {reanalysisRequested
                ? <><CheckCircle size={14} color="var(--acc)"/> Re-analysis Requested</>
                : requestingReanalysis
                  ? 'Sending…'
                  : <><Send size={14}/> Request Re-analysis</>}
            </button>
          </div>
        )}
      </div>

      {/* ── AUTO-FETCHED PLATFORM STATS (read-only display) ──── */}
      {(user?.platforms?.instagram?.followers > 0 || user?.platforms?.youtube?.followers > 0) && (
        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 24,
          boxShadow: 'var(--glass-shadow)'
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize:15, fontWeight:800, color: 'var(--t1)', margin: 0 }}>Platform Stats (Auto-fetched)</h3>
            <span style={{ fontSize:11, color:'var(--t2)', background:'var(--s2)',
              padding:'4px 12px', borderRadius:99, border:'1px solid var(--border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={12} /> Read-only — updated by AI
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {[
              { platform:'instagram', icon:'📸', label:'Instagram', f:user.platforms?.instagram?.followers||0, e:user.platforms?.instagram?.engagement||0 },
              { platform:'youtube',   icon:'▶️', label:'YouTube',   f:user.platforms?.youtube?.followers||0,   e:user.platforms?.youtube?.engagement||0 },
            ].filter(p=>p.f>0).map(p=>(
              <div key={p.platform} style={{ background:'var(--s2)', borderRadius:14, padding:18, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:14, fontWeight:800, marginBottom:12, color:'var(--t1)' }}>{p.icon} {p.label}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ fontSize:12.5, color:'var(--t2)', fontWeight: 500 }}>
                    <span style={{ fontWeight:900, color:'var(--t1)', fontSize:18, fontFamily: 'Inter, sans-serif' }}>{p.f.toLocaleString('en-IN')}</span>
                    <span style={{ marginLeft:6 }}>followers</span>
                  </div>
                  <div style={{ fontSize:12.5, color:'var(--t2)', fontWeight: 500 }}>
                    <span style={{ fontWeight:900, color:'var(--acc)', fontSize:18, fontFamily: 'Inter, sans-serif' }}>{p.e}%</span>
                    <span style={{ marginLeft:6 }}>engagement</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BASIC INFO ────────────────────────────────────────── */}
      <div style={{
        display:'flex',
        flexDirection:'column',
        gap:18,
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 24,
        boxShadow: 'var(--glass-shadow)'
      }}>
        <h3 style={{ fontSize:15, fontWeight:800, color: 'var(--t1)', margin: 0 }}>Basic Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Display Name *</label>
            <input
              value={form.displayName} onChange={upd('displayName')} required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span>Email Address</span>
              <span style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Lock size={10} /> Locked</span>
            </label>
            <input
              value={form.email} readOnly disabled
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t3)', fontSize: 13.5, cursor: 'not-allowed', fontWeight: 600, opacity: 0.7 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Avatar URL</label>
            <input
              value={form.avatar} onChange={upd('avatar')} placeholder="https://example.com/photo.jpg"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Primary Niche</label>
            <select
              value={form.niche} onChange={upd('niche')}
              style={{
                width: '100%', padding: '12px 36px 12px 14px', appearance:'none', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)',
                fontSize: 13.5, cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="" style={{ background: 'var(--s1)', color: 'var(--t1)' }}>Select niche…</option>
              {NICHES.map(n=><option key={n} value={n} style={{ background: 'var(--s1)', color: 'var(--t1)' }}>{n}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Bio</label>
          <textarea
            value={form.bio} onChange={upd('bio')} placeholder="Tell brands about yourself, your audience and content style…"
            style={{ width: '100%', minHeight: 90, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none', resize: 'vertical' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Location / City</label>
            <input
              value={form.location} onChange={upd('location')} placeholder="Mumbai, India"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Website / Portfolio</label>
            <input
              value={form.website} onChange={upd('website')} placeholder="https://yoursite.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.background = 'var(--s1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)'; }}
            />
          </div>
        </div>
      </div>

      {/* ── DANGER ZONE ────────────────────────────────────────── */}
      <div style={{
        border: '1px solid rgba(239, 68, 68, 0.3)',
        background: 'rgba(239, 68, 68, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 8px 30px rgba(239,68,68,0.05)'
      }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:'var(--rose)', display:'flex', alignItems:'center', gap:8, margin: 0 }}>
          <AlertTriangle size={18} /> Danger Zone
        </h3>
        <p style={{ color:'var(--t2)', fontSize:13, lineHeight:1.6, fontWeight: 500, margin: 0 }}>
          Once you delete your account, there is no going back. All campaigns, settings, and profile details will be permanently removed.
        </p>
        <div>
          <button
            onClick={handleDeleteAccount}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px',
              borderRadius: 10, background: '#EF4444', color: '#FFFFFF', border: 'none',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
            }}
          >
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </CreatorShell>
  );
}
