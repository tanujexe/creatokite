import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone, Search, Users, Clock, Radio, ChevronDown, Filter,
  AlertCircle, UserCheck, FileText, Activity, Trash2, AlertTriangle,
} from 'lucide-react';
import { adminAPI, roomsAPI } from '../../api';
import { Avatar, StatusBadge, WorkflowPipeline, EmptyState, PageLoader } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ALL_STATUSES = [
  '', 'brand_submitted', 'admin_review', 'ai_analyzing',
  'creators_assigned', 'in_progress', 'revision', 'completed', 'cancelled',
];

/* ── Campaign health ──────────────────────────────── */
function calcHealth(c) {
  let score = 100;
  const assigned = c.assignedCreators?.length || 0;
  const total    = c.totalSlots || 1;
  if ((assigned / total) < 0.5)  score -= 25;
  else if ((assigned / total) < 0.8) score -= 10;
  const d = c.daysLeft || 0;
  if (d < 1) score -= 30;
  else if (d < 3) score -= 15;
  else if (d < 7) score -= 5;
  if (c.workflowStatus === 'revision') score -= 15;
  if (c.workflowStatus === 'cancelled') score = 0;
  return Math.max(0, Math.min(100, score));
}

function HealthDot({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? 'var(--acc2)' : score >= 40 ? 'var(--gold)' : 'var(--rose)';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention';
  return (
    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }}/>
      <span style={{ color, fontWeight:600 }}>{label}</span>
    </span>
  );
}

export default function AdminCampaigns() {
  const { hasRole } = useAuth();
  const navigate    = useNavigate();
  const isAdmin     = hasRole('admin') || hasRole('superadmin');

  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const d = await adminAPI.campaigns({
        page: pg, limit: 15,
        search: search || undefined,
        workflowStatus: status || undefined,
      });
      setCampaigns(d.campaigns || []);
      setTotal(d.total || 0);
    } catch(e) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1); }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, status, load]);

  const updateStatus = async (id, ws) => {
    try {
      await adminAPI.updateCampaign(id, { workflowStatus: ws });
      setCampaigns(prev => prev.map(c => c._id === id ? { ...c, workflowStatus: ws } : c));
      toast.success('Status updated');
    } catch(e) { toast.error('Update failed'); }
  };

  const openRoom = async (campaign) => {
    if (campaign.roomId) { navigate(`/admin/room/${campaign.roomId}`); return; }
    try {
      const d = await roomsAPI.create({ campaignId: campaign._id });
      navigate(`/admin/room/${d.room._id}`);
    } catch(e) { toast.error('Could not open room'); }
  };

  const openWorkspace = (id) => {
    navigate(`/admin/campaigns/${id}/workspace`);
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:'clamp(18px,4vw,24px)', fontWeight:800, display:'flex', alignItems:'center', gap:10 }}>
            <Megaphone size={22} style={{ color:'var(--p)' }}/>
            {isAdmin ? 'Campaign Management' : 'My Assigned Campaigns'}
          </h1>
          <p style={{ color:'var(--t2)', fontSize:13, marginTop:4 }}>
            {total} campaign{total !== 1 ? 's' : ''} · {isAdmin ? 'Full workspace opens as dedicated page' : 'Your assigned campaign overview'}
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="card" style={{ padding:'10px 16px', marginBottom:16, background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--t2)' }}>
          <AlertCircle size={14} style={{ color:'#6366f1', flexShrink:0 }}/>
          Showing campaigns assigned to you. Contact your admin to be added to more.
        </div>
      )}

      {/* ── Filters ──────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1 1 200px', maxWidth:320 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            className="form-input"
            style={{ paddingLeft:30, height:38, fontSize:13 }}
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="form-input"
          style={{ width:'auto', height:38, fontSize:12, padding:'6px 10px' }}
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s} style={{ background:'var(--s2)' }}>
              {s ? s.replace(/_/g, ' ') : 'All Statuses'}
            </option>
          ))}
        </select>
      </div>

      {/* ── Campaign list ─────────────────────────────── */}
      {loading ? <PageLoader/>
        : campaigns.length === 0
          ? <EmptyState icon="📣" title={isAdmin ? 'No campaigns found' : 'No campaigns assigned'} desc="Try different filters"/>
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {campaigns.map(c => {
                const health = calcHealth(c);
                return (
                  <div key={c._id} className="card card-hover" style={{ padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Header Avatar, Title, Brand & Badges */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 200px', minWidth: 0 }}>
                        <Avatar src={c.brand?.avatar} name={c.brand?.displayName} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.title}
                          </h3>
                          <div style={{ fontSize: 12, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700 }}>{c.brand?.companyName || c.brand?.displayName}</span>
                            <span>·</span>
                            <span style={{ color: 'var(--acc)', fontWeight: 800 }}>₹{(c.budget || 0).toLocaleString('en-IN')}</span>
                            <span>·</span>
                            <span style={{ color: (c.daysLeft||0)<3 ? 'var(--rose)' : (c.daysLeft||0)<7 ? 'var(--gold)' : 'var(--t3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} />{c.daysLeft || 0}d left
                            </span>
                            <span>·</span>
                            <span style={{ color: 'var(--t3)' }}>{c.niche}</span>
                            <span>·</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <Users size={12} />{c.assignedCreators?.length || 0}/{c.totalSlots || 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                        <StatusBadge status={c.workflowStatus} />
                        <HealthDot score={health} />
                      </div>
                    </div>

                    {/* Workflow Stepper Wrapper */}
                    <div style={{ background: 'var(--s2)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <WorkflowPipeline status={c.workflowStatus} />
                    </div>

                    {/* Assigned Team Members Row */}
                    {(c.assignedTeamMembers || []).length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', gap: -6 }}>
                          {c.assignedTeamMembers.slice(0, 5).map(tm => (
                            <Avatar key={tm._id || tm} src={tm.avatar} name={tm.displayName} size={22} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Managing Team Ops</span>
                      </div>
                    )}

                    {/* Health Warning Alert Box */}
                    {health < 50 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.22)', borderRadius: 10, fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        Campaign health is low — open workspace to review status and take action.
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => openWorkspace(c._id)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: 12, gap: 6, padding: '8px 16px', borderRadius: 8, fontWeight: 700 }}
                      >
                        <FileText size={13} /> Open Workspace
                      </button>

                      {isAdmin && c.workflowStatus === 'brand_submitted' && (
                        <button
                          onClick={() => updateStatus(c._id, 'admin_review')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, fontWeight: 700 }}
                        >
                          Mark Under Review
                        </button>
                      )}

                      {['creators_assigned', 'in_progress'].includes(c.workflowStatus) && (
                        <button
                          onClick={() => openRoom(c)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 12, gap: 6, padding: '8px 16px', borderRadius: 8, fontWeight: 700 }}
                        >
                          <Radio size={13} /> Campaign Room
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {total > 15 && (
                <div style={{ display:'flex', gap:8, justifyContent:'center', padding:'8px 0' }}>
                  <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }} disabled={page === 1} className="btn btn-secondary btn-sm">← Prev</button>
                  <span style={{ padding:'6px 12px', fontSize:12, color:'var(--t2)' }}>{page} / {Math.ceil(total / 15)}</span>
                  <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={campaigns.length < 15} className="btn btn-secondary btn-sm">Next →</button>
                </div>
              )}
            </div>
          )
      }
    </div>
  );
}
