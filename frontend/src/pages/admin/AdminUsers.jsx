import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Eye, UserCog, Ban, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../api';
import { Avatar, StatusBadge, EmptyState, PageLoader, Modal } from '../../components/ui';
import toast from 'react-hot-toast';

const ROLES = ['', 'creator', 'brand', 'team_member', 'admin', 'superadmin'];

const NICHES = ['Tech', 'Beauty', 'Fashion', 'Fitness', 'Food', 'Travel', 'Gaming', 'Education', 'Finance', 'Lifestyle', 'Music', 'Art', 'Other'];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [niche, setNiche] = useState('');
  const [verified, setVerified] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [banning, setBanning] = useState(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const d = await adminAPI.users({
        page: pg,
        limit: 20,
        search: search || undefined,
        role: role || undefined,
        niche: niche || undefined,
        verified: verified || undefined
      });
      setUsers(d.users || []); setTotal(d.total || 0);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, role, niche, verified]);

  useEffect(() => {
    const t = setTimeout(() => load(1), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, role, niche, verified, load]);

  const toggleBan = async (u) => {
    setBanning(u._id);
    try {
      await adminAPI.updateUser(u._id, { isBanned: !u.isBanned });
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isBanned: !u.isBanned } : x));
      toast.success(u.isBanned ? 'User unbanned' : 'User banned');
    } catch (e) { toast.error('Failed'); }
    finally { setBanning(null); }
  };

  const recalc = async (id) => {
    try { await adminAPI.recalcScore(id); toast.success('Score recalculated'); } catch (e) { toast.error('Failed'); }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} style={{ color: 'var(--p)' }} />User Management
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13, marginTop: 4 }}>{total} users · Manage accounts and roles</p>
        </div>
        <button onClick={() => navigate('/admin/roles')} className="btn btn-primary btn-sm">
          <UserCog size={13} />Role Manager
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or email…" className="form-input" style={{ paddingLeft: 30, height: 36, fontSize: 12 }} />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="form-input" style={{ width: 'auto', height: 36, fontSize: 12, padding: '6px 10px' }}>
          {ROLES.map(r => <option key={r} value={r} style={{ background: 'var(--s2)' }}>{r || 'All Roles'}</option>)}
        </select>
        <select value={niche} onChange={e => setNiche(e.target.value)} className="form-input" style={{ width: 'auto', height: 36, fontSize: 12, padding: '6px 10px' }}>
          <option value="" style={{ background: 'var(--s2)' }}>All Niches</option>
          {NICHES.map(n => <option key={n} value={n} style={{ background: 'var(--s2)' }}>{n}</option>)}
        </select>
        <select value={verified} onChange={e => setVerified(e.target.value)} className="form-input" style={{ width: 'auto', height: 36, fontSize: 12, padding: '6px 10px' }}>
          <option value="" style={{ background: 'var(--s2)' }}>All Verification</option>
          <option value="true" style={{ background: 'var(--s2)' }}>Verified Only</option>
          <option value="false" style={{ background: 'var(--s2)' }}>Unverified Only</option>
        </select>
        {(search || role || niche || verified) && (
          <button onClick={() => { setSearch(''); setRole(''); setNiche(''); setVerified(''); }} className="btn btn-ghost btn-sm" style={{ height: 36, fontSize: 11, padding: '0 12px' }}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? <PageLoader />
        : users.length === 0 ? <EmptyState icon="👤" title="No users found" desc="Try different filters" />
          : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', minWidth: 680 }}>
                <thead>
                  <tr><th>User</th><th>Role(s)</th><th>Niche / Company</th><th>Status</th><th>Score</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ opacity: u.isBanned ? 0.55 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar src={u.avatar} name={u.displayName} size={32} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{u.displayName}</div>
                            <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                              {u.email ? (
                                <a
                                  href={`mailto:${u.email}`}
                                  onClick={e => e.stopPropagation()}
                                  style={{ color: 'var(--t3)', textDecoration: 'none' }}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--acc)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
                                  title={`Send email to ${u.email}`}
                                >
                                  {u.email}
                                </a>
                              ) : '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {(u.roles?.length ? u.roles : [u.role]).map(r => (
                            <span key={r} className={`badge badge-${r === 'admin' ? 'gold' : r === 'superadmin' ? 'red' : r === 'brand' ? 'blue' : r === 'team_member' ? 'indigo' : 'green'}`} style={{ fontSize: 9 }}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{u.niche || u.companyName || '—'}</td>
                      <td>
                        <span className={`badge ${u.isBanned ? 'badge-red' : u.isVerified ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                          {u.isBanned ? 'Banned' : u.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 13, color: 'var(--p)' }}>{u.creatorScore || 0}</td>
                      <td style={{ fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setSelected(u)} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 6px' }} title="Details"><Eye size={11} /></button>
                          <button onClick={() => navigate('/admin/roles')} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 6px' }} title="Manage roles"><UserCog size={11} /></button>
                          <button onClick={() => toggleBan(u)} disabled={banning === u._id} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 6px', color: 'var(--rose)' }} title={u.isBanned ? 'Unban' : 'Ban'}>
                            <Ban size={11} />
                          </button>
                          {(u.role === 'creator' || u.roles?.includes('creator')) && (
                            <button onClick={() => recalc(u._id)} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 6px', color: 'var(--gold)' }} title="Recalculate score"><RefreshCw size={11} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{users.length} of {total}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setPage(p => Math.max(1, p - 1)); load(page - 1); }} disabled={page === 1} className="btn btn-secondary btn-sm">Prev</button>
                  <button onClick={() => { setPage(p => p + 1); load(page + 1); }} disabled={users.length < 20} className="btn btn-secondary btn-sm">Next</button>
                </div>
              </div>
            )}
          </div>}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.displayName || 'User Details'} maxWidth={460} fullscreenMobile={false}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* User Header Profile Card */}
            <div style={{
              display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(230,95,43,0.08) 0%, rgba(212,162,76,0.04) 100%), var(--s1, #FAF7F2)',
              border: '1px solid rgba(230, 95, 43, 0.25)',
              boxShadow: '0 4px 14px rgba(230, 95, 43, 0.06)'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar src={selected.avatar} name={selected.displayName} size={52} />
                <div style={{
                  position: 'absolute', inset: -2, borderRadius: '50%',
                  border: '1.5px solid var(--acc, #E65F2B)', pointerEvents: 'none',
                  opacity: 0.8
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', fontFamily: "'Inter', sans-serif", lineHeight: 1.2 }}>
                  {selected.displayName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2, fontWeight: 500 }}>
                  {selected.email}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {(selected.roles?.length ? selected.roles : [selected.role]).map(r => (
                    <span
                      key={r}
                      style={{
                        padding: '2.5px 9px', borderRadius: 99,
                        background: r === 'admin' ? 'rgba(212, 162, 76, 0.16)' : r === 'brand' ? 'rgba(59, 130, 246, 0.16)' : r === 'team_member' ? 'rgba(99, 102, 241, 0.16)' : 'rgba(230, 95, 43, 0.14)',
                        color: r === 'admin' ? 'var(--gold)' : r === 'brand' ? '#2563eb' : r === 'team_member' ? '#4f46e5' : 'var(--acc)',
                        border: `1px solid ${r === 'admin' ? 'rgba(212, 162, 76, 0.35)' : r === 'brand' ? 'rgba(59, 130, 246, 0.35)' : r === 'team_member' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(230, 95, 43, 0.35)'}`,
                        fontSize: 10.5, fontWeight: 800, textTransform: 'capitalize', letterSpacing: '0.02em'
                      }}
                    >
                      {r.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid-2" style={{ gap: 10 }}>
              {[
                ['Phone', selected.phone || '—'],
                ['Niche', selected.niche || '—'],
                ['Score', selected.creatorScore || 0],
                ['Rank', selected.rank || '—'],
                ['Campaigns', selected.totalCampaigns || 0],
                ['Joined', new Date(selected.createdAt).toLocaleDateString()],
                ['Status', selected.verificationStatus || '—']
              ].map(([l, v]) => (
                <div key={l} style={{
                  padding: '10px 14px', background: 'var(--s2)', borderRadius: 12,
                  border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => { setSelected(null); navigate('/admin/roles'); }}
                className="tactile-btn-new-campaign"
                style={{ flex: 1, justifyContent: 'center', fontSize: 12.5 }}
              >
                <UserCog size={14} /> Manage Roles
              </button>
              <button
                onClick={() => toggleBan(selected)}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 14,
                  background: selected.isBanned ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.12)',
                  color: selected.isBanned ? '#16a34a' : '#dc2626',
                  border: `1.5px solid ${selected.isBanned ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  fontWeight: 800, fontSize: 12.5, cursor: 'pointer', transition: 'all 0.18s'
                }}
              >
                <Ban size={14} /> {selected.isBanned ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
