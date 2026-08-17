import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, MessageSquare, ArrowRight, Search, Shield, Sparkles, Filter } from 'lucide-react';
import { roomsAPI } from '../../api';
import { EmptyState, Avatar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLOR = {
  brand_submitted: 'var(--gold)',
  admin_review: 'var(--p)',
  creators_assigned: '#6366f1',
  in_progress: 'var(--acc2)',
  completed: 'var(--t3)',
  cancelled: 'var(--rose)'
};

export default function CampaignRooms() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdminOrTeam = hasRole('admin') || hasRole('superadmin') || hasRole('team_member');
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    const fn = isAdminOrTeam ? roomsAPI.listAll : roomsAPI.list;
    fn()
      .then(d => setRooms(d.rooms || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdminOrTeam]);

  const filtered = rooms.filter(r => 
    !search || 
    r.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.campaign?.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header Banner */}
      <div 
        className="admin-header-banner card"
        style={{
          background: 'linear-gradient(135deg, rgba(230, 95, 43, 0.10), rgba(212, 162, 76, 0.05))',
          border: '1px solid rgba(230, 95, 43, 0.2)',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
              background: 'rgba(230, 95, 43, 0.14)', color: 'var(--acc)',
              border: '1px solid rgba(230, 95, 43, 0.25)', textTransform: 'uppercase', letterSpacing: 0.6
            }}>
              📻 Live Collaboration Hub
            </span>
          </div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(17px, 3.2vw, 21px)', fontWeight: 900, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} style={{ color: 'var(--acc)' }} /> Campaign <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc)', fontSize: '1.2em' }}>Collaboration Rooms</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 11.5, margin: '2px 0 0 0', fontWeight: 500 }}>
            Dedicated operational workspaces for creators, brands, and admins — replacing informal WhatsApp groups.
          </p>
        </div>
      </div>

      {/* Search & Rooms Count Bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms by campaign or brand..."
            className="form-input"
            style={{ paddingLeft: 34, height: 38, fontSize: 12.5, borderRadius: 10 }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>
          Showing <strong>{filtered.length}</strong> active room{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <EmptyState
            icon="📻"
            title="No Campaign Rooms Found"
            desc="Rooms are automatically created when creators are assigned to active brand campaigns."
          />
        </div>
      ) : (
        /* Rooms Grid (2x2 on Mobile/Tablet via global.css grid-3) */
        <div className="grid-3" style={{ gap: 12 }}>
          {filtered.map(r => {
            const status = r.campaign?.workflowStatus || 'in_progress';
            const statusColor = STATUS_COLOR[status] || 'var(--acc2)';

            return (
              <div
                key={r._id}
                className="card card-hover"
                style={{
                  cursor: 'pointer',
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  minWidth: 0,
                  height: '100%',
                }}
                onClick={() => navigate(`/admin/room/${r._id}`)}
              >
                {/* Top Row: Icon & Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--acc), #F97316)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(230, 95, 43, 0.22)',
                  }}>
                    <Radio size={16} style={{ color: '#fff' }} />
                  </div>

                  <span
                    className="badge"
                    style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 99,
                      background: `${statusColor}14`,
                      color: statusColor,
                      border: `1px solid ${statusColor}35`,
                      letterSpacing: 0.4,
                      maxWidth: '65%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Middle: Title & Budget */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: 'var(--t1)',
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {r.name || r.campaign?.title || 'Campaign Room'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc)' }}>
                    Budget: ₹{(r.campaign?.budget || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Structured Footer: Left Stacked Meta & Right Action Circle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border)',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: 'var(--t1)' }}>
                      <Users size={11} style={{ color: 'var(--acc)' }} />
                      {r.members?.length || 0} Member{r.members?.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--t3)', fontWeight: 500 }}>
                      <MessageSquare size={10} />
                      {r.lastMessageAt ? new Date(r.lastMessageAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No msgs'}
                    </div>
                  </div>

                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(230, 95, 43, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(230, 95, 43, 0.3)', flexShrink: 0
                  }}>
                    <ArrowRight size={12} style={{ color: 'var(--acc)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
