import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Radio, Users, Crown, Brain, Zap, Heart, CheckCircle2,
  TrendingUp, Search, Trash2, RefreshCw, Filter, Star, Clock, ChevronDown,
  CheckSquare, BarChart2, Activity, X,
} from 'lucide-react';
import { adminAPI, roomsAPI } from '../../api';
import { Avatar, StatusBadge, WorkflowPipeline, EmptyState, PageLoader } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/* ── Recommendation badges ──────────────────────────── */
function RecBadges({ c, source }) {
  const ts = c.trustScore || {};
  const badges = [];
  if (source === 'ai')          badges.push({ cls:'rec-badge-ai',       label:'🤖 AI Match'         });
  if (source === 'leaderboard') badges.push({ cls:'rec-badge-top-perf', label:'🏆 Leaderboard Pick'  });
  if ((ts.campaignCompletion||0) >= 90) badges.push({ cls:'rec-badge-reliable', label:`✅ ${ts.campaignCompletion}% Reliable` });
  if ((c.platforms?.instagram?.engagement||0) >= 5) badges.push({ cls:'rec-badge-top-eng', label:'❤️ Top Engagement' });
  if ((c.xp||0) >= 5000)       badges.push({ cls:'rec-badge-activity',  label:'⚡ High Activity'    });
  if ((c.seasonXP||0) >= 2000) badges.push({ cls:'rec-badge-growing',   label:'📈 Rising Creator'   });
  return (
    <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginTop:3 }}>
      {badges.slice(0, 3).map((b, i) => <span key={i} className={`rec-badge ${b.cls}`}>{b.label}</span>)}
    </div>
  );
}

/* ── Creator selector row ───────────────────────────── */
function SelectorRow({ c, source, isAssigned, isPicked, onToggle, matchScore }) {
  return (
    <label
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
        borderRadius:'var(--r)', cursor: isAssigned ? 'not-allowed' : 'pointer',
        border:`1px solid ${isPicked ? 'var(--p)' : 'var(--border)'}`,
        background: isAssigned ? 'rgba(255,255,255,0.02)' : isPicked ? 'rgba(255,107,87,0.05)' : 'transparent',
        transition:'all 0.12s', opacity: isAssigned ? 0.55 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={isPicked || isAssigned}
        disabled={isAssigned}
        onChange={e => { if (!isAssigned) onToggle(c._id, e.target.checked); }}
        style={{ flexShrink:0 }}
      />
      <Avatar src={c.avatar} name={c.displayName} size={32}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--t1)' }}>{c.displayName}</span>
          <span style={{ fontSize:9, padding:'1px 5px', borderRadius:99, background:'rgba(255,107,87,0.1)', color:'var(--p)', fontWeight:700 }}>
            ⚡{c.creatorScore || 0}
          </span>
          {c.rank && (
            <span style={{ fontSize:9, color:'var(--t3)' }}>{c.rank}</span>
          )}
        </div>
        <div style={{ fontSize:10, color:'var(--t3)', marginBottom:2 }}>{c.niche || 'Creator'}</div>
        <RecBadges c={c} source={source}/>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        {matchScore != null && (
          <div style={{ fontSize:14, fontWeight:800, color:'var(--acc2)', fontFamily:'var(--fd)' }}>
            {matchScore}%
            <div style={{ fontSize:9, color:'var(--t3)', fontWeight:400 }}>AI match</div>
          </div>
        )}
        {isAssigned && <span style={{ fontSize:9, color:'var(--acc)', fontWeight:700 }}>ASSIGNED</span>}
        {c.availability === 'available' && !isAssigned && (
          <span style={{ fontSize:9, color:'var(--acc2)', background:'rgba(124,139,90,0.1)', padding:'2px 5px', borderRadius:99, fontWeight:600 }}>Free</span>
        )}
      </div>
    </label>
  );
}

/* ── Unified Creator Selector ───────────────────────── */
function UnifiedCreatorSelector({ campaign, onAssign, onAnalyze, analyzing }) {
  const [allCreators,  setAllCreators]  = useState([]);
  const [lbCreators,   setLbCreators]   = useState([]);
  const [search,       setSearch]       = useState('');
  const [crPage,       setCrPage]       = useState(1);
  const [crTotal,      setCrTotal]      = useState(0);
  const [crLoading,    setCrLoading]    = useState(false);
  const [pickedIds,    setPickedIds]    = useState([]);
  const [pickedSource, setPickedSource] = useState({}); // id -> source label
  const [activeSection,setActiveSection]= useState('ai');

  const aiSuggests   = campaign?.aiSuggestedCreators || [];
  const alreadyAssigned = new Set((campaign?.assignedCreators||[]).map(a => a.creator?._id?.toString() || a.creator?.toString()));

  const loadCreators = useCallback(async (pg = 1, q = '') => {
    setCrLoading(true);
    try {
      const d = await adminAPI.creatorsForAssign({ page:pg, limit:12, search: q||undefined });
      setAllCreators(d.creators || []);
      setCrTotal(d.total || 0);
    } catch(e) {}
    finally { setCrLoading(false); }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const d = await adminAPI.leaderboard({ type:'overall', limit:12 });
      setLbCreators(d.creators || []);
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (activeSection === 'all') loadCreators(crPage, search);
  }, [activeSection, crPage, search, loadCreators]);

  useEffect(() => {
    if (activeSection === 'leaderboard') loadLeaderboard();
  }, [activeSection, loadLeaderboard]);

  useEffect(() => {
    if (activeSection !== 'all') return;
    const t = setTimeout(() => { setCrPage(1); loadCreators(1, search); }, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, loadCreators]);

  const toggle = (id, checked, source) => {
    setPickedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    setPickedSource(prev => {
      const next = { ...prev };
      if (checked) next[id] = source; else delete next[id];
      return next;
    });
  };

  // Group selected by source
  const selectionSummary = Object.entries(
    pickedIds.reduce((acc, id) => {
      const src = pickedSource[id] || 'Manual';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {})
  );

  const sections = [
    { key:'ai',          label:'🤖 AI Recommendations',   count: aiSuggests.length },
    { key:'leaderboard', label:'🏆 Leaderboard Creators',  count: lbCreators.length },
    { key:'all',         label:'👥 All Creators',          count: crTotal || null   },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Section tabs */}
      <div style={{ display:'flex', gap:6, overflowX:'auto' }}>
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer',
              borderRadius:10, whiteSpace:'nowrap',
              background: activeSection === s.key ? 'var(--acc)' : 'var(--s1)',
              color: activeSection === s.key ? '#ffffff' : 'var(--t2)',
              border: activeSection === s.key ? '1px solid var(--acc)' : '1px solid var(--border)',
              boxShadow: activeSection === s.key ? '0 2px 10px rgba(230,95,43,0.35)' : 'none',
              transition:'all 0.18s ease',
            }}
          >
            {s.label}{s.count != null ? ` (${s.count})` : ''}
          </button>
        ))}
      </div>

      {/* ── AI Section ───────────────────────────────── */}
      {activeSection === 'ai' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:11, color:'var(--t3)' }}>
              {aiSuggests.length === 0 ? 'Run AI analysis to get smart creator recommendations' : `${aiSuggests.length} AI-matched creators`}
            </span>
            <button onClick={onAnalyze} className="btn btn-secondary btn-sm" disabled={analyzing} style={{ fontSize:10 }}>
              <RefreshCw size={10}/>{analyzing ? 'Analyzing…' : aiSuggests.length ? 'Re-analyze' : 'Run AI Analysis'}
            </button>
          </div>
          {aiSuggests.length === 0
            ? <div style={{ textAlign:'center', padding:'20px 0', color:'var(--t3)', fontSize:12 }}>Click "Run AI Analysis" above to get recommendations</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
              {aiSuggests.map(s => {
                const c = s.creator; if (!c) return null;
                const cId = c._id?.toString();
                return <SelectorRow key={cId} c={c} source="ai" isAssigned={alreadyAssigned.has(cId)} isPicked={pickedIds.includes(cId)} onToggle={(id, checked) => toggle(id, checked, 'AI Recommendation')} matchScore={s.matchScore}/>;
              })}
            </div>
          }
        </div>
      )}

      {/* ── Leaderboard Section ──────────────────────── */}
      {activeSection === 'leaderboard' && (
        <div>
          <div style={{ fontSize:11, color:'var(--t3)', marginBottom:10 }}>
            Top-ranked creators by overall score — proven performers
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
            {['overall','reliability','engagement','activity'].map(lt => (
              <button key={lt} onClick={() => adminAPI.leaderboard({ type:lt, limit:12 }).then(d => setLbCreators(d.creators||[]))}
                style={{ padding:'4px 10px', fontSize:10, fontWeight:600, border:'1px solid var(--border)', borderRadius:100, background:'var(--glass-bg)', color:'var(--t2)', cursor:'pointer' }}>
                {lt}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
            {lbCreators.map((c, i) => (
              <SelectorRow key={c._id?.toString() || `lb-${i}`} c={c} source="leaderboard" isAssigned={alreadyAssigned.has(c._id)} isPicked={pickedIds.includes(c._id)} onToggle={(id, checked) => toggle(id, checked, 'Leaderboard')}/>
            ))}
          </div>
        </div>
      )}

      {/* ── All Creators Section ─────────────────────── */}
      {activeSection === 'all' && (
        <div>
          <div style={{ position:'relative', marginBottom:10 }}>
            <Search size={12} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or handle…" className="form-input" style={{ paddingLeft:28, height:34, fontSize:12 }}/>
          </div>
          {crLoading
            ? <div style={{ textAlign:'center', padding:16, color:'var(--t3)', fontSize:12 }}>Loading…</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
              {allCreators.map((c, i) => (
                <SelectorRow key={c._id?.toString() || `all-${i}`} c={c} source="manual" isAssigned={alreadyAssigned.has(c._id)} isPicked={pickedIds.includes(c._id)} onToggle={(id, checked) => toggle(id, checked, 'Manual')}/>
              ))}
              {allCreators.length === 0 && <div style={{ textAlign:'center', padding:12, color:'var(--t3)', fontSize:12 }}>No creators found</div>}
            </div>
          }
        </div>
      )}

      {/* ── Selection summary & assign button ────────── */}
      {pickedIds.length > 0 && (
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--t1)', marginBottom:6 }}>
              Selected: {pickedIds.length} creator{pickedIds.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {selectionSummary.map(([src, cnt]) => (
                <span key={src} style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(255,107,87,0.10)', color:'var(--p)', border:'1px solid rgba(255,107,87,0.2)', fontWeight:600 }}>
                  {cnt} from {src}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setPickedIds([]); setPickedSource({}); }} className="btn btn-secondary btn-sm">
              Clear Selection
            </button>
            <button onClick={() => onAssign(pickedIds)} className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:'center' }}>
              Assign {pickedIds.length} Creator{pickedIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CAMPAIGN WORKSPACE — FULL PAGE
   ══════════════════════════════════════════════════════ */
const STATUS_NEXT = {
  brand_submitted:   'admin_review',
  admin_review:      'creators_assigned',
  creators_assigned: 'in_progress',
  in_progress:       'completed',
};

export default function CampaignWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin');

  const [campaign,     setCampaign]     = useState(null);
  const [teamMembers,  setTeamMembers]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('overview');
  const [saving,       setSaving]       = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [tmPicked,     setTmPicked]     = useState([]);
  const [note,         setNote]         = useState('');

  const loadCampaign = useCallback(async () => {
    try {
      const d = await adminAPI.getCampaign(id);
      setCampaign(d.campaign);
      setTmPicked((d.campaign?.assignedTeamMembers || []).map(t => t._id || t));
    } catch(e) {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
    if (isAdmin) {
      adminAPI.users({ role:'team_member', limit:50 }).then(d => setTeamMembers(d.users || [])).catch(() => {});
    }
  }, [loadCampaign, isAdmin]);

  const handleStatusUpdate = async (ws) => {
    setSaving(true);
    try {
      await adminAPI.updateCampaign(campaign._id, { workflowStatus: ws });
      toast.success('Status updated');
      loadCampaign();
    } catch(e) { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleAssign = async (ids) => {
    const alreadyAssigned = new Set((campaign?.assignedCreators||[]).map(a => a.creator?._id?.toString() || a.creator?.toString()));
    const toAssign = ids.filter(id => !alreadyAssigned.has(id));
    if (!toAssign.length) return toast.error('All selected creators already assigned');
    setSaving(true);
    try {
      await adminAPI.assignCreators(campaign._id, { creatorIds: toAssign });
      toast.success(`✅ ${toAssign.length} creator(s) assigned`);
      loadCampaign();
    } catch(e) { toast.error(e.response?.data?.message || 'Assignment failed'); }
    finally { setSaving(false); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const d = await adminAPI.analyzeAI(campaign._id);
      toast.success('AI analysis complete');
      setCampaign(prev => ({ ...prev, aiSuggestedCreators: d.campaign?.aiSuggestedCreators || [] }));
    } catch(e) { toast.error('Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const handleRemoveCreator = async (creatorId) => {
    if (!confirm('Remove this creator?')) return;
    try {
      await adminAPI.removeCreator(campaign._id, creatorId);
      toast.success('Creator removed');
      loadCampaign();
    } catch(e) { toast.error('Failed'); }
  };

  const handleAssignmentStatus = async (creatorId, status) => {
    try {
      await adminAPI.updateAssignment(campaign._id, creatorId, { status, adminNote: note });
      toast.success('Updated');
      setNote('');
      loadCampaign();
    } catch(e) { toast.error('Failed'); }
  };

  const handleTeamUpdate = async () => {
    setSaving(true);
    try {
      await adminAPI.updateCampaign(campaign._id, { assignedTeamMembers: tmPicked });
      toast.success('Team updated');
    } catch(e) { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const openRoom = async () => {
    if (campaign.roomId) { navigate(`/admin/room/${campaign.roomId}`); return; }
    try {
      const d = await roomsAPI.create({ campaignId: campaign._id });
      navigate(`/admin/room/${d.room._id}`);
    } catch(e) { toast.error('Could not open room'); }
  };

  if (loading) return <PageLoader/>;
  if (!campaign) return <EmptyState icon="🔍" title="Campaign not found" desc="This campaign may have been deleted"/>;

  const tabs = [
    { key:'overview',  label:'Overview',  icon:'📋' },
    { key:'creators',  label:'Creators',  icon:'👥' },
    ...(isAdmin ? [{ key:'assign', label:'Assign Creators', icon:'➕' }] : []),
    ...(isAdmin ? [{ key:'team',   label:'Team',   icon:'🧑‍💼' }] : []),
    { key:'activity',  label:'Activity',  icon:'📊' },
  ];

  return (
    <div className="page-enter">
      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <button
          onClick={() => navigate('/admin/campaigns')}
          className="btn btn-secondary btn-sm"
          style={{ gap:6, flexShrink:0 }}
        >
          <ArrowLeft size={13}/>Back
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:'clamp(16px,4vw,22px)', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {campaign.title}
          </h1>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:2 }}>
            <StatusBadge status={campaign.workflowStatus}/>
            <span style={{ fontSize:11, color:'var(--t3)' }}>
              {campaign.brand?.companyName || campaign.brand?.displayName}
            </span>
            <span style={{ fontSize:11, color:'var(--acc2)', fontWeight:600 }}>
              ₹{(campaign.budget||0).toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize:11, color: (campaign.daysLeft||0) < 3 ? 'var(--rose)' : 'var(--t3)', display:'flex', alignItems:'center', gap:3 }}>
              <Clock size={10}/>{campaign.daysLeft || 0}d left
            </span>
          </div>
        </div>
        {isAdmin && ['creators_assigned','in_progress'].includes(campaign.workflowStatus) && (
          <button onClick={openRoom} className="btn btn-primary btn-sm" style={{ gap:6, flexShrink:0 }}>
            <Radio size={13}/>Campaign Room
          </button>
        )}
      </div>

      {/* ── Workflow pipeline ────────────────────────── */}
      <div className="card" style={{ marginBottom:20, padding:'14px 20px' }}>
        <WorkflowPipeline status={campaign.workflowStatus}/>
        {isAdmin && STATUS_NEXT[campaign.workflowStatus] && (
          <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
            <button
              onClick={() => handleStatusUpdate(STATUS_NEXT[campaign.workflowStatus])}
              className="btn btn-primary btn-sm" disabled={saving}
            >
              ➡️ Move to {STATUS_NEXT[campaign.workflowStatus]?.replace(/_/g, ' ')}
            </button>
            {campaign.workflowStatus !== 'completed' && campaign.workflowStatus !== 'cancelled' && (
              <button onClick={() => handleStatusUpdate('cancelled')} className="btn btn-danger btn-sm">
                Cancel Campaign
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:20, overflowX:'auto' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:'10px 16px', fontSize:12, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--acc)' : 'var(--t2)',
              background:'transparent', border:'none', cursor:'pointer', whiteSpace:'nowrap',
              borderBottom:`2px solid ${tab === t.key ? 'var(--acc)' : 'transparent'}`,
              transition:'all 0.12s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding:20 }}>

        {/* ── Overview ─────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
              {[
                { label:'Budget',   value:`₹${(campaign.budget||0).toLocaleString('en-IN')}`,                 color:'var(--acc2)' },
                { label:'Creators', value:`${campaign.assignedCreators?.length||0}/${campaign.totalSlots||1}`, color:'var(--gold)' },
                { label:'Days Left',value:`${campaign.daysLeft||0}d`,                                          color:(campaign.daysLeft||0)<3?'var(--rose)':'var(--t2)' },
                { label:'Niche',    value: campaign.niche || 'N/A',                                            color:'var(--p)'    },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding:'12px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:s.color, fontFamily:'var(--fd)' }}>{s.value}</div>
                  <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {campaign.brief && (
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--t2)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.8 }}>Campaign Brief</div>
                <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.7 }}>{campaign.brief}</p>
              </div>
            )}

            <div className="grid-2" style={{ gap:12 }}>
              <div className="card" style={{ padding:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Brand</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Avatar src={campaign.brand?.avatar} name={campaign.brand?.displayName} size={32}/>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{campaign.brand?.companyName || campaign.brand?.displayName}</div>
                    <div style={{ fontSize:10, color:'var(--t3)' }}>{campaign.niche}</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Deadline</div>
                <div style={{ fontSize:14, fontWeight:700 }}>
                  {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'Not set'}
                </div>
                <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{campaign.targetAudience || 'All audiences'}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Creators ─────────────────────────────────── */}
        {tab === 'creators' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--t1)', marginBottom:4 }}>
              {campaign.assignedCreators?.length || 0} creator{(campaign.assignedCreators?.length || 0) !== 1 ? 's' : ''} assigned
            </div>
            {(campaign.assignedCreators||[]).length === 0
              ? <EmptyState icon="👥" title="No creators assigned" desc={isAdmin ? "Use the Assign Creators tab" : "Admin will assign creators"}/>
              : (campaign.assignedCreators||[]).map(a => {
                  const c = a.creator; if (!c) return null;
                  return (
                    <div key={c._id} className="card" style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <Avatar src={c.avatar} name={c.displayName} size={38}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{c.displayName}</div>
                          <div style={{ fontSize:11, color:'var(--t3)' }}>{c.niche} · ⚡{c.creatorScore||0} · {c.rank}</div>
                        </div>
                        <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap' }}>
                          <span style={{ fontSize:10, padding:'3px 8px', borderRadius:99, fontWeight:600,
                            background: a.status==='approved'?'rgba(124,139,90,0.15)':a.status==='completed'?'rgba(124,139,90,0.2)':a.status==='revision'?'rgba(212,162,76,0.15)':'rgba(255,255,255,0.07)',
                            color: a.status==='approved'?'var(--acc)':a.status==='completed'?'var(--acc2)':a.status==='revision'?'var(--gold)':'var(--t3)',
                          }}>
                            {a.status || 'assigned'}
                          </span>
                          {isAdmin && a.status === 'submitted' && (
                            <>
                              <button onClick={() => handleAssignmentStatus(c._id, 'approved')} className="btn btn-sm" style={{ fontSize:10, background:'rgba(124,139,90,0.15)', color:'var(--acc)', border:'1px solid rgba(124,139,90,0.3)', padding:'3px 8px', minHeight:'unset' }}>✅ Approve</button>
                              <button onClick={() => handleAssignmentStatus(c._id, 'revision')} className="btn btn-sm" style={{ fontSize:10, background:'rgba(212,162,76,0.12)', color:'var(--gold)', border:'1px solid rgba(212,162,76,0.3)', padding:'3px 8px', minHeight:'unset' }}>🔄 Revision</button>
                            </>
                          )}
                          {isAdmin && (
                            <button onClick={() => handleRemoveCreator(c._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:4 }}>
                              <Trash2 size={12}/>
                            </button>
                          )}
                        </div>
                      </div>
                      {a.paymentAlloc > 0 && (
                        <div style={{ fontSize:11, color:'var(--acc2)', marginTop:6, fontWeight:600 }}>
                          💰 ₹{a.paymentAlloc.toLocaleString('en-IN')} allocated
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── Assign Creators — Unified Panel ────────── */}
        {tab === 'assign' && isAdmin && (
          <UnifiedCreatorSelector
            campaign={campaign}
            onAssign={handleAssign}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
          />
        )}

        {/* ── Team ─────────────────────────────────────── */}
        {tab === 'team' && isAdmin && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:12, color:'var(--t2)', marginBottom:4 }}>
              Select team members to manage this campaign:
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:360, overflowY:'auto' }}>
              {teamMembers.length === 0
                ? <EmptyState icon="👥" title="No team members found" desc="Add team members via Role Manager"/>
                : teamMembers.map(m => {
                    const isPicked = tmPicked.includes(m._id);
                    return (
                      <label key={m._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--r)', cursor:'pointer', border:`1px solid ${isPicked?'var(--p)':'var(--border)'}`, background:isPicked?'rgba(255,107,87,0.05)':'transparent', transition:'all 0.12s' }}>
                        <input type="checkbox" checked={isPicked} onChange={e => setTmPicked(prev => e.target.checked ? [...prev, m._id] : prev.filter(x => x !== m._id))}/>
                        <Avatar src={m.avatar} name={m.displayName} size={30}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600 }}>{m.displayName}</div>
                          <div style={{ fontSize:10, color:'var(--t3)' }}>{m.teamTitle || 'Team Member'}</div>
                        </div>
                      </label>
                    );
                  })
              }
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid var(--border)' }}>
              <button onClick={handleTeamUpdate} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? 'Saving…' : 'Save Team'}
              </button>
            </div>
          </div>
        )}

        {/* ── Activity ─────────────────────────────────── */}
        {tab === 'activity' && (
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {[
              { icon:'📋', label:'Campaign created',             time: campaign.createdAt            },
              ...(campaign.adminReviewedAt ? [{ icon:'✅', label:'Admin reviewed', time: campaign.adminReviewedAt }] : []),
              { icon:'📊', label:`Status: ${campaign.workflowStatus?.replace(/_/g,' ')}`, time: campaign.updatedAt },
              ...((campaign.assignedCreators||[]).map(a => ({ icon:'👤', label:`${a.creator?.displayName || 'Creator'} assigned`, time: a.assignedAt }))),
            ].sort((a,b) => new Date(b.time||0) - new Date(a.time||0)).map((ev, i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{ev.icon}</span>
                <div>
                  <div style={{ fontSize:12, color:'var(--t1)', fontWeight:500 }}>{ev.label}</div>
                  {ev.time && <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{new Date(ev.time).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
