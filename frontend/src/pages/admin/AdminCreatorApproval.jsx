import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI } from '../../api';
import { PageLoader, Avatar, Btn, EmptyState, StatCard, getInstagramLink, getYouTubeLink, GmailIcon, InstagramIcon } from '../../components/ui';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, RefreshCw, Users, Shield, AlertTriangle, Star, ExternalLink, Instagram, Youtube, Mail } from 'lucide-react';

const BADGE_MAP = {
  ELITE: { color: '#fbbf24', cls: 'badge-gold' },
  VERIFIED: { color: 'var(--acc2)', cls: 'badge-green' },
  STANDARD: { color: 'var(--p2)', cls: 'badge-purple' },
  REVIEW: { color: 'var(--gold)', cls: 'badge-gold' },
};
const RISK_COLOR = { LOW: 'var(--acc2)', MEDIUM: 'var(--gold)', HIGH: 'var(--rose)' };
const VS_MAP = {
  pending: { label: 'Pending', cls: 'badge-gold' },
  approved: { label: 'Approved', cls: 'badge-green' },
  rejected: { label: 'Rejected', cls: 'badge-red' },
  none: { label: 'No Data', cls: 'badge-gray' },
};

function CASMini({ score = 0 }) {
  const color = score >= 75 ? 'var(--acc2)' : score >= 50 ? 'var(--gold)' : 'var(--rose)';
  const r = 16, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <svg width={48} height={48} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 24 24)" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, fontFamily: 'var(--fd)', color
      }}>{score}</div>
    </div>
  );
}

function RejectModal({ creator, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const handle = async () => {
    setSaving(true);
    await onConfirm(note || 'Profile does not meet quality standards.');
    setSaving(false);
    onClose();
  };
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'var(--s)', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%',
        border: '1px solid var(--border2)'
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Reject {creator?.displayName}?</h3>
        <p style={{ color: 'var(--t2)', fontSize: 12, marginBottom: 14 }}>Provide a reason — the creator will be notified.</p>
        <textarea className="form-input" value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. Engagement too low, suspicious follower spikes…"
          style={{ minHeight: 80, marginBottom: 14, width: '100%', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="danger" onClick={handle} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Rejecting…' : 'Reject Creator'}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminCreatorApproval() {
  const [creators, setCreators] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // pending | all
  const [riskFilter, setRiskFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [acting, setActing] = useState({}); // { [id]: true }
  const [rejectTarget, setRejectTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15, riskLevel: riskFilter || undefined };
    const call = tab === 'pending'
      ? adminAPI.creatorsPending(params)
      : adminAPI.creatorsAll({ ...params, verificationStatus: '' });
    call
      .then(d => { setCreators(d.creators || []); setTotal(d.total || 0); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [tab, page, riskFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminAPI.creatorsStats()
      .then(d => setStats(d.stats))
      .catch(() => { });
  }, []);

  const approve = async (id) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await adminAPI.creatorApprove(id);
      toast.success('Creator approved & notified! ✔');
      load();
    } catch (e) { toast.error('Approve failed'); }
    finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const reject = async (id, note) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await adminAPI.creatorReject(id, { note });
      toast.success('Creator rejected & notified.');
      load();
    } catch (e) { toast.error('Reject failed'); }
    finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const [bulkSyncing, setBulkSyncing] = useState(false);

  const handleBulkSync = async () => {
    if (!window.confirm("⚡ Are you sure you want to bulk re-sync live Instagram & social metrics for ALL active creators?")) return;
    setBulkSyncing(true);
    try {
      const data = await adminAPI.bulkSyncSocial();
      toast.success(data.message || `Bulk sync finished! Updated ${data.successCount} creators.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Bulk sync failed.');
    } finally {
      setBulkSyncing(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,217,255,0.04))',
        border: '1px solid rgba(108,99,255,0.2)', borderRadius: 16, padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: 18 }}>Creator AI Approval Center</h2>
            {stats?.pending > 0 && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.25)', fontWeight: 700
              }}>
                {stats.pending} PENDING
              </span>
            )}
          </div>
          <p style={{ color: 'var(--t2)', fontSize: 13, margin: 0 }}>
            AI auto-analyzes each creator's social profiles. You only approve or reject.
          </p>
        </div>
        <button
          onClick={handleBulkSync}
          disabled={bulkSyncing}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px',
            borderRadius: 10, background: bulkSyncing ? 'var(--s2)' : 'linear-gradient(135deg, #FF7A3D 0%, #E65F2B 100%)',
            color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: bulkSyncing ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(230,95,43,0.3)', transition: 'all 0.15s'
          }}
        >
          <RefreshCw size={14} style={bulkSyncing ? { animation: 'spin 1s linear infinite' } : {}} />
          {bulkSyncing ? 'Bulk Re-syncing All Creators…' : '⚡ Bulk Sync All Creator Profiles'}
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid-4">
          <StatCard label="Pending Approval" value={stats.pending || 0} icon={Shield} color="var(--gold)" sub="Need review" />
          <StatCard label="Approved" value={stats.approved || 0} icon={CheckCircle} color="var(--acc2)" />
          <StatCard label="High Risk" value={stats.highRisk || 0} icon={AlertTriangle} color="var(--rose)" sub="Flag for rejection" />
          <StatCard label="Avg CAS Score" value={`${stats.avgCas || 82}/100`} icon={Star} color="var(--p2)" sub="Platform average" />
        </div>
      )}

      {/* Tabs + filters */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['pending', 'all'].map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`btn btn-${tab === t ? 'primary' : 'secondary'} btn-sm`}
              style={{ textTransform: 'capitalize' }}>{t === 'pending' ? `⏳ Pending${stats?.pending ? ` (${stats.pending})` : ''}` : '📋 All Creators'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-input" style={{ width: 140 }} value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1); }}>
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
          <Btn variant="secondary" size="sm" onClick={load}><RefreshCw size={12} /></Btn>
        </div>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : creators.length === 0 ? (
        <EmptyState icon={tab === 'pending' ? '🎉' : '👥'}
          title={tab === 'pending' ? 'All caught up!' : 'No creators found'}
          desc={tab === 'pending' ? 'No creators waiting for approval.' : 'Try changing filters.'} />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>CAS Score</th>
                  <th>Risk</th>
                  <th>Badge</th>
                  <th>Followers</th>
                  <th>Status</th>
                  <th>Analyzed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map(c => {
                  const bm = BADGE_MAP[c.casBadge] || BADGE_MAP.REVIEW;
                  const vs = VS_MAP[c.verificationStatus] || VS_MAP.none;
                  const igF = c.platforms?.instagram?.followers || 0;
                  const ytF = c.platforms?.youtube?.followers || 0;
                  const totalF = igF + ytF;
                  const isExpanded = expandedId === c._id;

                  const igRaw = c.socialUrls?.instagram || c.platforms?.instagram?.profileUrl || c.platforms?.instagram?.username || c.instagramHandle || c.instagram;
                  const ytRaw = c.socialUrls?.youtube || c.platforms?.youtube?.profileUrl || c.platforms?.youtube?.username || c.youtubeHandle || c.youtube;
                  const igData = getInstagramLink(igRaw);
                  const ytData = getYouTubeLink(ytRaw);

                  return [
                    <tr key={c._id} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      {/* Creator */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar src={c.avatar} name={c.displayName} size={34} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {igData ? (
                                <a
                                  href={igData.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: 'var(--t1)',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title={`Open ${igData.handle} on Instagram`}
                                >
                                  <span>{c.displayName}</span>
                                  <InstagramIcon size={14} />
                                </a>
                              ) : (
                                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>{c.displayName}</div>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                              {c.email ? (
                                <a
                                  href={`mailto:${c.email}`}
                                  onClick={e => e.stopPropagation()}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--acc)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
                                  title={`Send email to ${c.email}`}
                                  style={{ color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <GmailIcon size={13} />
                                  <span>{c.email}</span>
                                </a>
                              ) : null}
                              {c.phone ? ` • 📞 ${c.phone}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* CAS Ring */}
                      <td><CASMini score={c.casScore || 0} /></td>
                      {/* Risk */}
                      <td>
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                          color: RISK_COLOR[c.casRisk] || 'var(--t2)', fontWeight: 700
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: RISK_COLOR[c.casRisk] || 'gray', display: 'inline-block' }} />
                          {c.casRisk || '—'}
                        </span>
                      </td>
                      {/* Badge */}
                      <td><span className={`badge ${bm.cls}`}>{c.casBadge || '—'}</span></td>
                      {/* Followers */}
                      <td style={{ fontSize: 12, color: 'var(--t2)' }}>
                        {totalF > 0 || igData || ytData ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {igData ? (
                              <a
                                href={igData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{
                                  fontSize: 11.5,
                                  color: '#e1306c',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                              >
                                <Instagram size={13} style={{ flexShrink: 0 }} />
                                <span>{igF > 0 ? igF.toLocaleString('en-IN') : igData.handle}</span>
                                <ExternalLink size={10} style={{ opacity: 0.8 }} />
                              </a>
                            ) : igF > 0 ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#e1306c', fontWeight: 600 }}>
                                <Instagram size={13} style={{ flexShrink: 0 }} />
                                <span>{igF.toLocaleString('en-IN')}</span>
                              </div>
                            ) : null}

                            {ytData ? (
                              <a
                                href={ytData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{
                                  fontSize: 11.5,
                                  color: '#ef4444',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                              >
                                <Youtube size={13} style={{ flexShrink: 0 }} />
                                <span>{ytF > 0 ? ytF.toLocaleString('en-IN') : ytData.handle}</span>
                                <ExternalLink size={10} style={{ opacity: 0.8 }} />
                              </a>
                            ) : ytF > 0 ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#ef4444', fontWeight: 600 }}>
                                <Youtube size={13} style={{ flexShrink: 0 }} />
                                <span>{ytF.toLocaleString('en-IN')}</span>
                              </div>
                            ) : null}
                          </div>
                        ) : '—'}
                      </td>
                      {/* Status */}
                      <td><span className={`badge ${vs.cls}`}>{vs.label}</span></td>
                      {/* Date */}
                      <td style={{ fontSize: 11, color: 'var(--t3)' }}>
                        {c.analyzedAt ? new Date(c.analyzedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button title="See score breakdown"
                            onClick={() => setExpandedId(isExpanded ? null : c._id)}
                            style={{
                              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                              borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: 'var(--t2)', display: 'flex'
                            }}>
                            <Eye size={13} />
                          </button>
                          {c.verificationStatus === 'pending' && <>
                            <button title="Approve" disabled={acting[c._id]}
                              onClick={() => approve(c._id)}
                              style={{
                                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                                borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--acc2)', display: 'flex',
                                opacity: acting[c._id] ? 0.5 : 1
                              }}>
                              <CheckCircle size={13} />
                            </button>
                            <button title="Reject" disabled={acting[c._id]}
                              onClick={() => setRejectTarget(c)}
                              style={{
                                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                                borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--rose)', display: 'flex',
                                opacity: acting[c._id] ? 0.5 : 1
                              }}>
                              <XCircle size={13} />
                            </button>
                          </>}
                          {c.verificationStatus === 'rejected' && (
                            <Btn variant="ghost" size="sm" onClick={() => approve(c._id)} disabled={acting[c._id]}>
                              Re-approve
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>,
                    /* Expanded score breakdown row */
                    isExpanded && (
                      <tr key={`${c._id}-expand`}>
                        <td colSpan={8} style={{ background: 'rgba(108,99,255,0.03)', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Score Breakdown Grid */}
                            <div className="rs-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                              {[
                                ['Engagement', c.casBreakdown?.engagement, 'var(--p2)', '#6366f1'],
                                ['Reach', c.casBreakdown?.reach, '#a78bfa', '#8b5cf6'],
                                ['Authenticity', c.casBreakdown?.authenticity, 'var(--acc2)', '#10b981'],
                                ['Consistency', c.casBreakdown?.consistency, 'var(--gold)', '#f59e0b'],
                                ['Growth', c.casBreakdown?.growth, '#22d3ee', '#06b6d4'],
                                ['Brand Safety', c.casBreakdown?.brandSafety, 'var(--acc)', '#E65F2B'],
                                ['Conversion', c.casBreakdown?.conversion, '#fb923c', '#f97316'],
                                ['Content Qual.', c.casBreakdown?.contentQuality, '#f472b6', '#ec4899'],
                              ].map(([lbl, val, col, gradCol]) => (
                                <div key={lbl} style={{
                                  background: 'var(--s1)',
                                  borderRadius: 14,
                                  padding: '12px 16px',
                                  border: '1px solid var(--border)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                }}>
                                  <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600, marginBottom: 6 }}>{lbl}</div>
                                  <div style={{ height: 6, background: 'rgba(120, 120, 120, 0.12)', borderRadius: 99, marginBottom: 8, overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${val || 0}%`,
                                      background: `linear-gradient(90deg, ${col}, ${gradCol || col})`,
                                      borderRadius: 99,
                                      boxShadow: `0 0 8px ${col}50`,
                                      transition: 'width 0.8s ease'
                                    }} />
                                  </div>
                                  <div style={{ fontSize: 16, fontWeight: 900, color: col, fontFamily: 'var(--fd)' }}>
                                    {val || 0}<span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 500 }}>/100</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Social Links Toolbar */}
                            <div style={{
                              padding: '12px 16px',
                              borderRadius: 14,
                              background: 'var(--s2)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 14,
                              flexWrap: 'wrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                {c.email && (
                                  <a
                                    href={`mailto:${c.email}`}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 14px',
                                      borderRadius: 99,
                                      background: 'rgba(99, 102, 241, 0.15)',
                                      border: '1px solid rgba(99, 102, 241, 0.35)',
                                      color: '#6366f1',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.12)',
                                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.28)';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                                      e.currentTarget.style.transform = 'none';
                                    }}
                                    title={`Send email to ${c.email}`}
                                  >
                                    <span>✉️</span>
                                    <span>Email: <strong>{c.email}</strong></span>
                                    <ExternalLink size={12} style={{ opacity: 0.9 }} />
                                  </a>
                                )}

                                {c.phone && (
                                  <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    📞 Phone: <strong style={{ color: 'var(--t1)' }}>{c.phone}</strong>
                                  </span>
                                )}

                                {/* Working Instagram Link */}
                                {igData && (
                                  <a
                                    href={igData.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 14px',
                                      borderRadius: 99,
                                      background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.15), rgba(253, 29, 29, 0.15))',
                                      border: '1px solid rgba(225, 48, 108, 0.35)',
                                      color: '#e1306c',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 8px rgba(225, 48, 108, 0.12)',
                                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(225, 48, 108, 0.28), rgba(253, 29, 29, 0.28))';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(225, 48, 108, 0.15), rgba(253, 29, 29, 0.15))';
                                      e.currentTarget.style.transform = 'none';
                                    }}
                                  >
                                    <Instagram size={14} style={{ flexShrink: 0 }} />
                                    <span>Instagram: <strong>{igData.handle}</strong></span>
                                    <ExternalLink size={12} style={{ opacity: 0.9 }} />
                                  </a>
                                )}

                                {/* Working YouTube Link */}
                                {ytData && (
                                  <a
                                    href={ytData.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 14px',
                                      borderRadius: 99,
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      border: '1px solid rgba(239, 68, 68, 0.35)',
                                      color: '#ef4444',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.12)',
                                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                      e.currentTarget.style.transform = 'none';
                                    }}
                                  >
                                    <Youtube size={14} style={{ flexShrink: 0 }} />
                                    <span>YouTube: <strong>{ytData.handle}</strong></span>
                                    <ExternalLink size={12} style={{ opacity: 0.9 }} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Btn variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--t2)' }}>
            Page {page} of {Math.ceil(total / 15)}
          </span>
          <Btn variant="secondary" size="sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</Btn>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal creator={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={note => reject(rejectTarget._id, note)} />
      )}
    </div>
  );
}
