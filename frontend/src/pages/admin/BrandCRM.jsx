import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Search, Download, Calendar, ExternalLink } from 'lucide-react';
import { crmAPI, workspaceAPI } from '../../api';
import { Avatar, Modal, EmptyState, PageLoader, GmailIcon } from '../../components/ui';
import toast from 'react-hot-toast';

const BRAND_STATUSES = [
  { key: 'lead', label: 'Lead', color: 'var(--t3)' },
  { key: 'contacted', label: 'Contacted', color: 'var(--gold)' },
  { key: 'meeting', label: 'Meeting', color: 'var(--acc)' },
  { key: 'negotiation', label: 'Negotiation', color: '#6366f1' },
  { key: 'campaign_running', label: 'Campaign Running', color: 'var(--p)' },
  { key: 'retained', label: 'Retained', color: 'var(--acc2)' },
];

export default function BrandCRM() {
  const [brands, setBrands] = useState([]);
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await crmAPI.brands({ search, status: filter === 'all' ? undefined : filter, limit: 50 });
      setBrands(d.brands || []); setTotal(d.total || 0);
    } catch (e) { } finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { const t = setTimeout(load, search ? 400 : 0); return () => clearTimeout(t); }, [search, filter, load]);
  useEffect(() => { workspaceAPI.team().then(d => setMembers(d.members || [])).catch(() => { }); }, []);

  const handleExportExcel = () => {
    const BASE = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filter !== 'all') params.append('status', filter);
    window.open(`${BASE}/crm/brands/export-excel?${params.toString()}`, '_blank');
  };

  const openBrand = async (b) => {
    setSelected(b);
    setMeetingNotes(b.meetingNotes || '');
    setFollowUpDate(b.nextFollowUpDate ? new Date(b.nextFollowUpDate).toISOString().split('T')[0] : '');
    const d = await crmAPI.getNotes(b._id).catch(() => ({ notes: [] }));
    setNotes(d.notes || []);
  };

  const handleStatus = async (brandId, status) => {
    try { await crmAPI.updateBrand(brandId, { brandCrmStatus: status }); setBrands(prev => prev.map(b => b._id === brandId ? { ...b, brandCrmStatus: status } : b)); toast.success('Updated'); }
    catch (e) { toast.error('Failed'); }
  };

  const handleAssign = async (brandId, memberId) => {
    try { await crmAPI.updateBrand(brandId, { assignedTeamMember: memberId || null }); toast.success('Assigned'); }
    catch (e) { toast.error('Failed'); }
  };

  const saveMeetingNotes = async () => {
    if (!selected) return;
    setSavingMeeting(true);
    try {
      await crmAPI.updateBrand(selected._id, { meetingNotes, nextFollowUpDate: followUpDate || undefined });
      toast.success('Meeting notes & follow-up saved');
    } catch (e) { toast.error('Failed'); }
    finally { setSavingMeeting(false); }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selected) return;
    setSavingNote(true);
    try {
      const d = await crmAPI.addNote({ about: selected._id, text: noteText, noteType });
      setNotes(prev => [d.note, ...prev]); setNoteText(''); toast.success('Note added');
    } catch (e) { toast.error('Failed'); }
    finally { setSavingNote(false); }
  };

  const statusFor = (key) => BRAND_STATUSES.find(s => s.key === key) || BRAND_STATUSES[0];

  return (
    <div className="page-enter">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}><Briefcase size={22} style={{ color: '#3b82f6' }} />Brand CRM</h1>
          <p style={{ color: 'var(--t2)', fontSize: 13, marginTop: 4 }}>Manage brand relationships, meetings & notes · {total} brands</p>
        </div>
        <button
          onClick={handleExportExcel}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
            borderRadius: 10, background: 'var(--acc)', color: '#FFF',
            border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(230,95,43,0.3)', transition: 'all 0.15s'
          }}
        >
          <Download size={15} /> Export Brand Database (Excel/CSV)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'All' }, ...BRAND_STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} className={`btn btn-sm ${filter === s.key ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 11, whiteSpace: 'nowrap', color: filter === s.key ? undefined : s.color, borderColor: filter === s.key ? undefined : s.color }}>{s.label}</button>
        ))}
      </div>

      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 16 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands by company, contact, email..." className="form-input" style={{ paddingLeft: 30, fontSize: 12 }} />
      </div>

      {loading ? <PageLoader />
        : brands.length === 0 ? <EmptyState icon="🏢" title="No brands found" desc="Brands appear here once registered" />
          : (
            <>
              {/* Desktop Table View */}
              <div className="card hide-mobile" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Brand / Client</th><th>Industry</th><th>Pipeline Stage</th><th>Assigned To</th><th>Follow-Up</th><th>Total Spent</th><th></th></tr></thead>
                    <tbody>
                      {brands.map(b => {
                        const st = statusFor(b.brandCrmStatus || 'lead');
                        return (
                          <tr key={b._id} style={{ cursor: 'pointer' }} onClick={() => openBrand(b)}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar src={b.avatar} name={b.companyName || b.displayName} size={32} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{b.companyName || b.displayName}</div>
                                  {b.email && (
                                    <a
                                      href={`mailto:${b.email}`}
                                      onClick={e => e.stopPropagation()}
                                      style={{ fontSize: 10.5, color: 'var(--t3)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, display: 'inline-block' }}
                                    >
                                      {b.email}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)' }}>{b.industry || 'General'}</td>
                            <td>
                              <select value={b.brandCrmStatus || 'lead'} onChange={e => { e.stopPropagation(); handleStatus(b._id, e.target.value); }} onClick={e => e.stopPropagation()} style={{ background: 'transparent', border: `1px solid ${st.color}40`, borderRadius: 99, padding: '3px 8px', fontSize: 10, color: st.color, cursor: 'pointer', outline: 'none' }}>
                                {BRAND_STATUSES.map(s => <option key={s.key} value={s.key} style={{ background: 'var(--s2)', color: 'var(--t1)' }}>{s.label}</option>)}
                              </select>
                            </td>
                            <td onClick={e => e.stopPropagation()}>
                              <select value={b.assignedTeamMember?._id || b.assignedTeamMember || ''} onChange={e => handleAssign(b._id, e.target.value)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '3px 8px', fontSize: 10, color: 'var(--t2)', cursor: 'pointer', outline: 'none', maxWidth: 120 }}>
                                <option value="" style={{ background: 'var(--s2)' }}>Unassigned</option>
                                {members.map(m => <option key={m._id} value={m._id} style={{ background: 'var(--s2)' }}>{m.displayName}</option>)}
                              </select>
                            </td>
                            <td style={{ fontSize: 11, color: b.nextFollowUpDate && new Date(b.nextFollowUpDate) < new Date() ? 'var(--rose)' : 'var(--t3)' }}>{b.nextFollowUpDate ? new Date(b.nextFollowUpDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--acc)', fontSize: 13 }}>₹{(b.totalSpent || 0).toLocaleString('en-IN')}</td>
                            <td><button onClick={(e) => { e.stopPropagation(); openBrand(b); }} className="btn btn-secondary btn-sm" style={{ fontSize: 11, fontWeight: 700 }}>View Profile</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Single-View Responsive Cards (NO HORIZONTAL SCROLL NEEDED!) */}
              <div className="show-mobile" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
                {brands.map(b => {
                  const st = statusFor(b.brandCrmStatus || 'lead');
                  return (
                    <div
                      key={b._id}
                      className="card"
                      onClick={() => openBrand(b)}
                      style={{ padding: '16px', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--s1)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      {/* Top Header: Avatar + Company Name + Email */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <Avatar src={b.avatar} name={b.companyName || b.displayName} size={40} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--t1)', wordBreak: 'break-word' }}>
                              {b.companyName || b.displayName}
                            </div>
                            {b.email && (
                              <a
                                href={`mailto:${b.email}`}
                                onClick={e => e.stopPropagation()}
                                style={{ fontSize: 11.5, color: 'var(--t2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, wordBreak: 'break-all' }}
                                title={`Send email to ${b.email}`}
                              >
                                <GmailIcon size={12} />
                                <span>{b.email}</span>
                              </a>
                            )}
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--acc)', fontSize: 13, flexShrink: 0 }}>
                          ₹{(b.totalSpent || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Details Row: Industry + Follow-Up */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '10px 0', borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', fontSize: 12 }}>
                        <div>Industry: <strong style={{ color: 'var(--p2)' }}>{b.industry || 'General'}</strong></div>
                        <div>Follow-Up: <strong style={{ color: b.nextFollowUpDate && new Date(b.nextFollowUpDate) < new Date() ? 'var(--rose)' : 'var(--t1)' }}>{b.nextFollowUpDate ? new Date(b.nextFollowUpDate).toLocaleDateString('en-IN') : '—'}</strong></div>
                      </div>

                      {/* Footer Row: Pipeline Stage Dropdown + View Profile */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }} onClick={e => e.stopPropagation()}>
                        <select
                          value={b.brandCrmStatus || 'lead'}
                          onChange={e => { e.stopPropagation(); handleStatus(b._id, e.target.value); }}
                          style={{ background: 'transparent', border: `1px solid ${st.color}40`, borderRadius: 99, padding: '4px 10px', fontSize: 11, color: st.color, cursor: 'pointer', outline: 'none', fontWeight: 700 }}
                        >
                          {BRAND_STATUSES.map(s => <option key={s.key} value={s.key} style={{ background: 'var(--s2)', color: 'var(--t1)' }}>{s.label}</option>)}
                        </select>

                        <button onClick={(e) => { e.stopPropagation(); openBrand(b); }} className="btn btn-secondary btn-sm" style={{ fontSize: 11.5, fontWeight: 700, padding: '6px 12px' }}>
                          Profile Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

      {/* Brand Profile & Notes Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="" maxWidth={620}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Inter, sans-serif' }}>

            {/* Header Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <Avatar src={selected.avatar} name={selected.companyName || selected.displayName} size={56} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{selected.companyName || selected.displayName}</h3>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>Contact: <strong>{selected.displayName}</strong></span>
                  {selected.email && (
                    <a
                      href={`mailto:${selected.email}`}
                      style={{ color: 'var(--acc2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                      title={`Send email to ${selected.email}`}
                    >
                      <GmailIcon size={13} />
                      <span>{selected.email}</span>
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc)', background: 'rgba(230,95,43,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                    {selected.industry || 'General Industry'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>
                    Total Spent: ₹{(selected.totalSpent || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              {selected.website && (
                <a href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`} target="_blank" rel="noreferrer" style={{ padding: '7px 14px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--t1)', borderRadius: 10, fontSize: 11.5, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Website <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Follow-up & Meeting Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5, fontWeight: 700 }}>Next Follow-Up Date</label>
                <input type="date" className="form-input" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={{ maxWidth: 200 }} />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11.5, fontWeight: 700 }}>Client Meeting & Proposal Notes</label>
                <textarea className="form-input form-textarea" value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="Record client meeting outcomes, contract deals, budget proposals…" style={{ minHeight: 90, fontSize: 12.5 }} />
                <button onClick={saveMeetingNotes} className="btn btn-primary btn-sm" disabled={savingMeeting} style={{ marginTop: 8, fontWeight: 700 }}>
                  {savingMeeting ? 'Saving…' : 'Save Meeting & Follow-Up Notes'}
                </button>
              </div>
            </div>

            {/* Internal Team Notes */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Internal Team Notes <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}>(Hidden from brand)</span></div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select value={noteType} onChange={e => setNoteType(e.target.value)} className="form-input" style={{ width: 120, fontSize: 11 }}>
                  {['general', 'positive', 'follow_up', 'warning', 'contact'].map(t => <option key={t} value={t} style={{ background: 'var(--s2)' }}>{t.replace('_', ' ')}</option>)}
                </select>
                <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write internal note…" className="form-input" style={{ flex: 1, fontSize: 12 }} onKeyDown={e => { if (e.key === 'Enter') addNote(); }} />
                <button onClick={addNote} className="btn btn-primary btn-sm" disabled={savingNote || !noteText.trim()}>Add Note</button>
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notes.length === 0 && <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: 12 }}>No internal notes yet.</div>}
                {notes.map(n => (
                  <div key={n._id} style={{ padding: '8px 12px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--t1)' }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>by {n.author?.displayName} · {new Date(n.createdAt).toLocaleDateString()}</div>
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
