import { useState, useEffect, useCallback } from 'react';
import { Users2, Search, Calendar, Clock, Download, Instagram, ExternalLink, RefreshCw, Mail } from 'lucide-react';
import { crmAPI, workspaceAPI, adminAPI } from '../../api';
import { Avatar, Modal, EmptyState, PageLoader, TrustScore, getInstagramLink, getYouTubeLink, GmailIcon, InstagramIcon } from '../../components/ui';
import toast from 'react-hot-toast';

const CRM_STATUSES = [
  { key: 'lead', color: 'var(--t3)' }, { key: 'contacted', color: 'var(--gold)' }, { key: 'interested', color: 'var(--acc)' },
  { key: 'registered', color: '#6366f1' }, { key: 'verified', color: 'var(--acc2)' }, { key: 'campaign_ready', color: 'var(--p)' },
];
const AVAIL = [{ key: 'available', color: 'var(--acc2)' }, { key: 'busy', color: 'var(--gold)' }, { key: 'unavailable', color: 'var(--rose)' }, { key: 'vacation', color: '#818cf8' }];

const NICHES = ['Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel', 'Gaming', 'Education', 'Finance', 'Lifestyle'];

export default function CreatorCRM() {
  const [creators, setCreators] = useState([]);
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [avFilter, setAvFilter] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [barterFilter, setBarterFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [saving, setSaving] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await crmAPI.creators({
        search: search || undefined,
        status: filter || undefined,
        availability: avFilter || undefined,
        niche: nicheFilter || undefined,
        isBarterReady: barterFilter || undefined,
        limit: 50
      });
      setCreators(d.creators || []); setTotal(d.total || 0);
    } catch (e) { } finally { setLoading(false); }
  }, [search, filter, avFilter, nicheFilter, barterFilter]);

  useEffect(() => { const t = setTimeout(load, search ? 400 : 0); return () => clearTimeout(t); }, [search, filter, avFilter, nicheFilter, barterFilter, load]);
  useEffect(() => { workspaceAPI.team().then(d => setMembers(d.members || [])).catch(() => { }); }, []);

  const handleExportExcel = () => {
    const BASE = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (nicheFilter) params.append('niche', nicheFilter);
    if (filter) params.append('status', filter);
    if (avFilter) params.append('availabilityStatus', avFilter);
    if (barterFilter) params.append('isBarterReady', barterFilter);
    window.open(`${BASE}/admin/creators/export-excel?${params.toString()}`, '_blank');
  };

  const [syncingSocial, setSyncingSocial] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);

  const handleBulkSyncSocial = async () => {
    if (!window.confirm("⚡ Are you sure you want to bulk re-sync live Instagram & social metrics for ALL active creators? This will update follower counts, engagement rates, and CAS scores across all IDs.")) return;

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

  const handleSyncCreatorSocial = async (creatorId) => {
    setSyncingSocial(true);
    try {
      const data = await adminAPI.syncSocial(creatorId);
      if (data.success) {
        setSelected(data.user);
        toast.success('Social profile metrics & follower data re-synced successfully!');
        load();
      } else {
        toast.error(data.message || 'Sync failed.');
      }
    } catch (e) {
      toast.error('Error syncing social data: ' + (e.response?.data?.message || e.message));
    } finally {
      setSyncingSocial(false);
    }
  };

  const openCreator = async (c) => {
    setSelected(c); setFollowUpDate(c.nextFollowUpDate ? new Date(c.nextFollowUpDate).toISOString().split('T')[0] : '');
    setFollowUpNotes(c.followUpNotes || '');
    const d = await crmAPI.getNotes(c._id).catch(() => ({ notes: [] }));
    setNotes(d.notes || []);
  };

  const handleStatusChange = async (id, crmStatus) => {
    try { await crmAPI.updateCreator(id, { crmStatus }); setCreators(prev => prev.map(c => c._id === id ? { ...c, crmStatus } : c)); toast.success('Updated'); }
    catch (e) { toast.error('Failed'); }
  };

  const handleAvailabilityChange = async (id, availability) => {
    try { await crmAPI.updateCreator(id, { availability }); setCreators(prev => prev.map(c => c._id === id ? { ...c, availability } : c)); toast.success('Updated'); }
    catch (e) { toast.error('Failed'); }
  };

  const handleAssign = async (id, assignedTeamMember) => {
    try { await crmAPI.updateCreator(id, { assignedTeamMember: assignedTeamMember || null }); toast.success('Assigned'); }
    catch (e) { toast.error('Failed'); }
  };

  const handleSaveFollowUp = async () => {
    if (!selected) return;
    try {
      await crmAPI.updateCreator(selected._id, { nextFollowUpDate: followUpDate || undefined, followUpNotes });
      setCreators(prev => prev.map(c => c._id === selected._id ? { ...c, nextFollowUpDate: followUpDate, followUpNotes } : c));
      toast.success('Follow-up saved ✅');
    } catch (e) { toast.error('Failed'); }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selected) return;
    setSaving(true);
    try {
      const d = await crmAPI.addNote({ about: selected._id, text: noteText, noteType });
      setNotes(prev => [d.note, ...prev]); setNoteText(''); toast.success('Note added');
    } catch (e) { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const statusFor = k => CRM_STATUSES.find(s => s.key === k) || CRM_STATUSES[0];
  const availFor = k => AVAIL.find(a => a.key === k) || AVAIL[0];

  return (
    <div className="page-enter">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}><Users2 size={22} style={{ color: 'var(--acc2)' }} />Creator CRM</h1>
          <p style={{ color: 'var(--t2)', fontSize: 13, marginTop: 4 }}>Track relationships, availability & pipeline · {total} creators</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleBulkSyncSocial}
            disabled={bulkSyncing}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              borderRadius: 10, background: bulkSyncing ? 'var(--s2)' : 'linear-gradient(135deg, #FF7A3D 0%, #E65F2B 100%)', color: '#FFF',
              border: 'none', fontWeight: 700, fontSize: 12.5, cursor: bulkSyncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(230,95,43,0.3)', transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={15} style={bulkSyncing ? { animation: 'spin 1s linear infinite' } : {}} />
            {bulkSyncing ? 'Re-syncing All Creators…' : '⚡ Bulk Sync All Creator Profiles'}
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              borderRadius: 10, background: 'var(--s2)', color: 'var(--t1)',
              border: '1px solid var(--border)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Download size={15} /> Export Creator Database (Excel/CSV)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators by name, city, handle..." className="form-input" style={{ paddingLeft: 30, fontSize: 12, height: 36 }} />
        </div>
        <select value={nicheFilter} onChange={e => setNicheFilter(e.target.value)} className="form-input" style={{ flex: '1 1 120px', minWidth: 110, maxWidth: 160, fontSize: 12, padding: '6px 10px', height: 36 }}>
          <option value="" style={{ background: 'var(--s2)' }}>All Niches</option>
          {NICHES.map(n => <option key={n} value={n} style={{ background: 'var(--s2)' }}>{n}</option>)}
        </select>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="form-input" style={{ flex: '1 1 130px', minWidth: 120, maxWidth: 160, fontSize: 12, padding: '6px 10px', height: 36 }}>
          <option value="" style={{ background: 'var(--s2)' }}>All Statuses</option>
          {CRM_STATUSES.map(s => <option key={s.key} value={s.key} style={{ background: 'var(--s2)' }}>{s.key.replace('_', ' ')}</option>)}
        </select>
        <select value={barterFilter} onChange={e => setBarterFilter(e.target.value)} className="form-input" style={{ flex: '1 1 130px', minWidth: 120, maxWidth: 160, fontSize: 12, padding: '6px 10px', height: 36 }}>
          <option value="" style={{ background: 'var(--s2)' }}>All Barter Status</option>
          <option value="true" style={{ background: 'var(--s2)' }}>🎁 Barter Ready (Yes)</option>
          <option value="false" style={{ background: 'var(--s2)' }}>💼 Paid Only (No)</option>
        </select>
      </div>

      {loading ? <PageLoader />
        : creators.length === 0 ? <EmptyState icon="👤" title="No creators found" desc="Adjust your filters or search query" />
          : <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: '100%' }}>
            <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>Niche</th>
                    <th>Location</th>
                    <th>Followers</th>
                    <th>CRM Status</th>
                    <th>Assigned To</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map(c => {
                    const st = statusFor(c.crmStatus || 'registered');
                    const igRaw = c.socialUrls?.instagram || c.platforms?.instagram?.profileUrl || c.platforms?.instagram?.username || c.instagramHandle || c.instagram;
                    const igData = getInstagramLink(igRaw);
                    return (
                      <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => openCreator(c)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar src={c.avatar} name={c.displayName} size={34} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                                  {c.displayName}
                                </span>
                                {igData && (
                                  <a
                                    href={igData.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    title={`Open ${igData.handle} on Instagram`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none', color: '#e1306c', fontSize: 11, fontWeight: 700, flexShrink: 0 }}
                                  >
                                    <InstagramIcon size={13} />
                                    <span style={{ fontSize: 10.5 }}>{igData.handle}</span>
                                  </a>
                                )}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                                {c.email ? (
                                  <a
                                    href={`mailto:${c.email}`}
                                    onClick={e => e.stopPropagation()}
                                    style={{ color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                    title={`Email ${c.email}`}
                                  >
                                    <GmailIcon size={12} />
                                    <span>{c.email}</span>
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)' }}>{c.niche || 'General'}</td>
                        <td style={{ fontSize: 11, color: 'var(--t2)' }}>{c.city || c.location || '—'}</td>
                        <td>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t1)' }}>{(c.platforms?.instagram?.followers || c.followers || 0).toLocaleString()}</span>
                        </td>
                        <td>
                          <select value={c.crmStatus || 'registered'} onChange={e => { e.stopPropagation(); handleStatusChange(c._id, e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'transparent', border: `1px solid ${st.color}40`, borderRadius: 99, padding: '3px 8px', fontSize: 10, color: st.color, cursor: 'pointer', outline: 'none' }}>
                            {CRM_STATUSES.map(s => <option key={s.key} value={s.key} style={{ background: 'var(--s2)', color: 'var(--t1)' }}>{s.key.replace('_', ' ')}</option>)}
                          </select>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select defaultValue={c.assignedTeamMember?._id || c.assignedTeamMember || ''} onChange={e => handleAssign(c._id, e.target.value)}
                            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '3px 8px', fontSize: 10, color: 'var(--t2)', cursor: 'pointer', outline: 'none', maxWidth: 110 }}>
                            <option value="" style={{ background: 'var(--s2)' }}>Unassigned</option>
                            {members.map(m => <option key={m._id} value={m._id} style={{ background: 'var(--s2)' }}>{m.displayName}</option>)}
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}><button onClick={(e) => { e.stopPropagation(); openCreator(c); }} className="btn btn-secondary btn-sm" style={{ fontSize: 11, fontWeight: 700 }}>View Profile</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>}

      {/* Full Creator Profile & Notes Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="" maxWidth={680}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Inter, sans-serif' }}>

            {/* Header Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <Avatar src={selected.avatar} name={selected.displayName} size={56} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{selected.displayName}</h3>
                  {selected.isVerified && <span style={{ background: 'rgba(230,95,43,0.12)', color: 'var(--acc)', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>✓ Verified Creator</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                  {selected.email ? (
                    <a
                      href={`mailto:${selected.email}`}
                      onClick={e => e.stopPropagation()}
                      style={{ color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--acc)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
                      title={`Send email to ${selected.email}`}
                    >
                      <GmailIcon size={13} />
                      <span>{selected.email}</span>
                    </a>
                  ) : null}
                  {selected.handle ? ` • @${selected.handle}` : ''}
                </div>
                {selected.bio && <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 6, marginBottom: 0, lineHeight: 1.4 }}>{selected.bio}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSyncCreatorSocial(selected._id)}
                  disabled={syncingSocial}
                  style={{
                    padding: '7px 14px', background: 'var(--acc, #E65F2B)', color: '#fff',
                    border: 'none', borderRadius: 10, fontSize: 11.5, fontWeight: 700,
                    cursor: syncingSocial ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  <RefreshCw size={13} className={syncingSocial ? 'spin' : ''} />
                  {syncingSocial ? 'Syncing...' : 'Sync Social Stats'}
                </button>

                {(() => {
                  const ig = getInstagramLink(selected.instagramUrl || selected.socialUrls?.instagram || selected.handle || selected.instagram);
                  if (!ig) return null;
                  return (
                    <a
                      href={ig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '7px 14px', background: 'linear-gradient(135deg,#e1306c,#f77737)', color: '#fff', borderRadius: 10, fontSize: 11.5, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(225, 48, 108, 0.25)' }}
                    >
                      <Instagram size={14} /> {ig.handle} <ExternalLink size={11} />
                    </a>
                  );
                })()}
              </div>
            </div>

            {/* 15 Specification Fields Grid */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Creator Specifications</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Phone Number</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>{selected.phone || '—'}</div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>City / Location</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>{selected.city || selected.location || 'Not specified'}</div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>All Niche(s)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc)', marginTop: 2 }}>
                    {selected.subNiches?.length ? selected.subNiches.join(', ') : (selected.niche || 'General')}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Open for Barter</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected.isBarterReady !== false ? '#16a34a' : 'var(--rose)', marginTop: 2 }}>
                    {selected.isBarterReady !== false ? '🎁 Yes (Open)' : '💼 No (Paid Only)'}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Followers Count</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', marginTop: 2 }}>
                    {(selected.platforms?.instagram?.followers || selected.followers || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Average Views</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
                    {(selected.avgViews || 0).toLocaleString()} views
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Engagement Rate</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
                    {selected.platforms?.instagram?.engagement || selected.engagementRate || 0}%
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Commercial Rate (₹)</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--acc)', marginTop: 2 }}>
                    ₹{(selected.commercialRate || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Languages</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
                    {Array.isArray(selected.languages) ? selected.languages.join(', ') : (selected.languages || 'English')}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>UGC Creator</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: selected.isUgcCreator ? '#16a34a' : 'var(--t3)', marginTop: 2 }}>
                    {selected.isUgcCreator ? '✓ Yes' : 'No'}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>On-Camera Comfort</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: selected.isOnCamera ? '#16a34a' : 'var(--t3)', marginTop: 2 }}>
                    {selected.isOnCamera ? '✓ Yes' : 'No'}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Audience Location</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
                    {selected.audienceLocation || 'India'}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Previous Campaigns</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
                    {selected.previousCampaignsCount || selected.completedCampaigns || 0} Done
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>Reliability Score</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--acc)', marginTop: 2 }}>
                    {selected.reliabilityScore || 90}/100
                  </div>
                </div>

              </div>
            </div>

            {/* Follow-up section */}
            <div style={{ padding: '14px 16px', background: 'rgba(212,162,76,0.06)', borderRadius: 14, border: '1px solid rgba(212,162,76,0.2)' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--gold)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} /> Follow-Up Scheduler
              </div>
              <div className="grid-2" style={{ gap: 10 }}>
                <div className="form-group"><label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Next Follow-Up Date</label><input type="date" className="form-input" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} /></div>
                <div className="form-group"><label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Follow-up Notes</label><input className="form-input" value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} placeholder="What to discuss…" /></div>
              </div>
              <button onClick={handleSaveFollowUp} className="btn btn-secondary btn-sm" style={{ marginTop: 10, fontWeight: 700 }}>Save Follow-Up Date</button>
            </div>

            {/* Internal notes */}
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Internal Team Notes <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}>(Hidden from creator)</span></div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select value={noteType} onChange={e => setNoteType(e.target.value)} className="form-input" style={{ width: 110, fontSize: 11 }}>
                  {['general', 'positive', 'follow_up', 'warning', 'contact', 'performance'].map(t => <option key={t} value={t} style={{ background: 'var(--s2)' }}>{t.replace('_', ' ')}</option>)}
                </select>
                <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write internal note…" className="form-input" style={{ flex: 1, fontSize: 12 }} onKeyDown={e => { if (e.key === 'Enter') addNote(); }} />
                <button onClick={addNote} className="btn btn-primary btn-sm" disabled={saving || !noteText.trim()}>Add Note</button>
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notes.length === 0 && <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: 12 }}>No internal notes yet.</div>}
                {notes.map(n => (
                  <div key={n._id} style={{ padding: '8px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)', borderLeft: `3.5px solid ${n.noteType === 'warning' ? 'var(--rose)' : n.noteType === 'positive' ? 'var(--acc2)' : n.noteType === 'follow_up' ? 'var(--gold)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--t3)', fontWeight: 800 }}>{n.noteType?.replace('_', ' ')}</span>
                      <span style={{ fontSize: 9.5, color: 'var(--t3)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t1)', lineHeight: 1.5 }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>— {n.author?.displayName}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
