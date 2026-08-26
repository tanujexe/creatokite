import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui';
import {
  LayoutDashboard, Megaphone, Users, BarChart2, Trophy, PlusCircle, LogOut,
  TrendingUp, Wallet, Target, UserCheck, X, Play, Activity, CheckSquare,
  MessageSquare, BookOpen, DollarSign, Shield, Search, Users2, Repeat,
  ChevronDown, ChevronRight, Briefcase, Radio, UserCog, Settings,
  MessageCircle, Brain, Star, Zap, Home, Bell,
} from 'lucide-react';

/* ── Nav structure (grouped) ──────────────────────────── */
const NAV = {
  creator: [
    {
      group: null, items: [
        { to: '/creator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      group: 'My Work', items: [
        { to: '/creator/assigned', icon: Target, label: 'My Campaigns' },
        { to: '/creator/activities', icon: Play, label: 'Activities' },
        { to: '/opportunities', icon: Zap, label: 'Opportunities' },
        { to: '/creator/earnings', icon: Wallet, label: 'Earnings' },
      ]
    },
    {
      group: 'Growth', items: [
        { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
        { to: '/creator/leaderboard', icon: TrendingUp, label: 'Leaderboard' },
        { to: '/creator/analytics', icon: BarChart2, label: 'Analytics' },
      ]
    },
    {
      group: 'Community', items: [
        { to: '/creator/community', icon: Users, label: 'Community' },
      ]
    },
    {
      group: 'Account', items: [
        { to: '/creator/profile', icon: Settings, label: 'Profile' },
      ]
    },
  ],
  brand: [
    {
      group: null, items: [
        { to: '/brand/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      group: 'Campaigns', items: [
        { to: '/brand/campaigns/create', icon: PlusCircle, label: 'New Campaign' },
        { to: '/brand/campaigns', icon: Megaphone, label: 'My Campaigns' },
      ]
    },
    {
      group: 'Insights', items: [
        { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
        { to: '/brand/analytics', icon: BarChart2, label: 'Analytics' },
      ]
    },
    {
      group: 'Account', items: [
        { to: '/brand/profile', icon: Settings, label: 'Profile' },
      ]
    },
  ],
  team_member: [
    {
      group: null, items: [
        { to: '/team/workspace', icon: LayoutDashboard, label: 'Workspace' },
      ]
    },
    {
      group: 'Task Operations', items: [
        { to: '/team/tasks', icon: CheckSquare, label: 'Tasks' },
        { to: '/team/dm-tracker', icon: MessageSquare, label: 'DM Tracker' },
        { to: '/team/directory', icon: Users2, label: 'Team Directory' },
      ]
    },
    {
      group: 'Campaign Management', items: [
        { to: '/admin/rooms', icon: Radio, label: 'Campaign Rooms' },
        { to: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
        { to: '/admin/activities', icon: Activity, label: 'Activities' },
        { to: '/admin/opportunities', icon: Zap, label: 'Opportunities' },
        { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      ]
    },
    {
      group: 'CRM', items: [
        { to: '/admin/crm/creators', icon: Users2, label: 'Creator CRM' },
        { to: '/admin/crm/brands', icon: Briefcase, label: 'Brand CRM' },
        { to: '/admin/management', icon: Users2, label: 'Management' },
      ]
    },
    {
      group: 'Community', items: [
        { to: '/admin/community', icon: MessageCircle, label: 'Community' },
      ]
    },
    {
      group: 'Tools', items: [
        { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
        { to: '/team/search', icon: Search, label: 'Search' },
      ]
    },
  ],
  admin: [
    {
      group: null, items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      group: 'Campaign Management', items: [
        { to: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
        { to: '/admin/rooms', icon: Radio, label: 'Campaign Rooms', v2: true },
        { to: '/admin/activities', icon: Activity, label: 'Activity Hub' },
        { to: '/admin/opportunities', icon: Zap, label: 'Opportunities' },
        { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      ]
    },
    {
      group: 'Creator Management', items: [
        { to: '/admin/users', icon: Users, label: 'Users' },
        { to: '/admin/creator-approval', icon: UserCheck, label: 'Creator Approvals' },
        { to: '/admin/leaderboard', icon: Trophy, label: 'Leaderboards', v2: true },
        { to: '/admin/crm/creators', icon: Users2, label: 'Creator CRM', v2: true },
      ]
    },
    {
      group: 'Brand Management', items: [
        { to: '/admin/crm/brands', icon: Briefcase, label: 'Brand CRM', v2: true },
      ]
    },
    {
      group: 'Team Operations', items: [
        { to: '/admin/team-management', icon: Users2, label: 'Team Management', v2: true },
        { to: '/admin/management', icon: Users2, label: 'Management Hub' },
      ]
    },
    {
      group: 'Community', items: [
        { to: '/admin/community', icon: MessageCircle, label: 'Community', v2: true },
      ]
    },
    {
      group: 'Analytics & Reports', items: [
        { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
        { to: '/admin/revenue', icon: DollarSign, label: 'Revenue', v2: true },
        { to: '/admin/reels', icon: Play, label: 'Reel Analytics' },
      ]
    },
    {
      group: 'System', items: [
        { to: '/admin/roles', icon: UserCog, label: 'Role Manager', v2: true },
        { to: '/admin/audit', icon: Shield, label: 'Audit Logs', v2: true },
        { to: '/admin/knowledge', icon: BookOpen, label: 'Knowledge Base', v2: true },
        { to: '/admin/search', icon: Search, label: 'Search' },
      ]
    },
  ],
  superadmin: [
    {
      group: null, items: [
        { to: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Control Center' },
      ]
    },
    {
      group: 'Management', items: [
        { to: '/admin/team-management', icon: Users2, label: 'Team Management' },
        { to: '/admin/management', icon: Users2, label: 'Management Hub' },
        { to: '/admin/roles', icon: UserCog, label: 'Role Manager' },
        { to: '/admin/users', icon: Users, label: 'All Users' },
      ]
    },
    {
      group: 'Operations', items: [
        { to: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
        { to: '/admin/opportunities', icon: Zap, label: 'Opportunities' },
        { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
        { to: '/admin/community', icon: MessageCircle, label: 'Community' },
      ]
    },
    {
      group: 'Finance & Compliance', items: [
        { to: '/admin/revenue', icon: DollarSign, label: 'Revenue' },
        { to: '/admin/audit', icon: Shield, label: 'Audit Logs' },
      ]
    },
  ],
};

const ROLE_META = {
  creator: { color: 'var(--acc, #E65F2B)', label: 'Creator Studio' },
  brand: { color: 'var(--acc, #E65F2B)', label: 'Brand Portal' },
  team_member: { color: '#6366f1', label: 'Team Workspace' },
  admin: { color: 'var(--acc, #E65F2B)', label: 'Control Center' },
  superadmin: { color: 'var(--acc, #E65F2B)', label: 'SuperAdmin' },
};

function getIconAnimClass(Icon) {
  if (Icon === LayoutDashboard) return 'icon-dashboard';
  if (Icon === BookOpen) return 'icon-book';
  if (Icon === BarChart2 || Icon === TrendingUp) return 'icon-analytics';
  if (Icon === Settings || Icon === UserCog) return 'icon-gear';
  if (Icon === Bell) return 'icon-bell';
  if (Icon === Zap) return 'icon-zap';
  if (Icon === Target || Icon === Megaphone || Icon === PlusCircle) return 'icon-target';
  if (Icon === Wallet || Icon === DollarSign) return 'icon-wallet';
  if (Icon === Users || Icon === Users2 || Icon === MessageCircle || Icon === MessageSquare || Icon === UserCheck) return 'icon-users';
  if (Icon === Play || Icon === Activity || Icon === Radio || Icon === CheckSquare) return 'icon-activity';
  if (Icon === Trophy || Icon === Star || Icon === Shield || Icon === Briefcase) return 'icon-trophy';
  if (Icon === Home) return 'icon-home';
  return 'icon-default';
}

/* ── NavGroup component ─────────────────────────────── */
function NavGroup({ group, items, meta, onClose, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="nav-group">
      {group && (
        <div
          className="nav-group-label"
          onClick={() => setOpen(v => !v)}
        >
          <span>{group}</span>
          {open
            ? <ChevronDown size={10} style={{ flexShrink: 0 }} />
            : <ChevronRight size={10} style={{ flexShrink: 0 }} />
          }
        </div>
      )}
      {(group === null || open) && (
        <div className="nav-group-items">
          {items.map(item => {
            const Icon = item.icon;
            const animClass = getIconAnimClass(Icon);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={onClose}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(230, 95, 43, 0.14)' : undefined,
                  color: isActive ? 'var(--acc, #E65F2B)' : 'var(--t1, #2C2520)',
                  fontWeight: isActive ? 800 : 500,
                  border: isActive ? '1px solid rgba(230, 95, 43, 0.35)' : '1px solid transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(230, 95, 43, 0.08)' : undefined,
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={15}
                      className={`sidebar-icon ${animClass}`}
                      style={{ flexShrink: 0, color: isActive ? 'var(--acc, #E65F2B)' : 'var(--t2)' }}
                    />
                    <span className="nav-item-label" style={{ color: isActive ? 'var(--acc, #E65F2B)' : 'var(--t1, #2C2520)' }}>{item.label}</span>
                    {item.v2 && !isActive && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 8, color: 'var(--acc, #E65F2B)',
                        background: 'rgba(230, 95, 43, 0.14)', padding: '1px 5px',
                        borderRadius: 99, fontWeight: 700, flexShrink: 0,
                      }}>V2</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════════════════ */
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, getUserRoles, getActiveRole, switchWorkspace } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const currentPath = location.pathname;
  let activeRole = getActiveRole();
  if (currentPath.startsWith('/brand')) activeRole = 'brand';
  else if (currentPath.startsWith('/creator')) activeRole = 'creator';
  else if (currentPath.startsWith('/team')) activeRole = 'team_member';
  else if (currentPath.startsWith('/admin')) activeRole = 'admin';
  else if (currentPath.startsWith('/superadmin')) activeRole = 'superadmin';
  else activeRole = activeRole || user?.role || 'creator';

  const allRoles = getUserRoles();
  const hasMultiple = allRoles.length > 1;
  const navGroups = NAV[activeRole] || NAV.creator;
  const meta = ROLE_META[activeRole] || ROLE_META.creator;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const handleSwitch = (role) => {
    switchWorkspace(role);
    setShowSwitcher(false);
    onClose();
    const paths = {
      creator: '/creator/dashboard', brand: '/brand/dashboard',
      team_member: '/team/workspace', admin: '/admin/dashboard',
      superadmin: '/superadmin/dashboard',
    };
    navigate(paths[role] || '/');
  };

  return (
    <>
      <div className={`sidebar-overlay${isOpen ? ' visible' : ''}`} onClick={onClose} />
      <nav className={`sidebar${isOpen ? ' open' : ''}`}>

        {/* ── Logo ──────────────────────────────────── */}
        <div style={{
          padding: '14px 12px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => { onClose(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            title="Go to home page"
          >
            <img
              src="/logo.png" alt="CreatoKite"
              style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
              onError={e => { e.currentTarget.src = '/logo.jpeg'; }}
            />
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: '800', fontSize: 20, color: 'var(--t1)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Creato<span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc, #E65F2B)', marginLeft: 1 }}>Kite</span>
              </div>
              <div style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'inter', fontSize: 12.5, color: meta.color || 'var(--acc, #E65F2B)', marginTop: 2, textTransform: 'capitalize', letterSpacing: '0.04em', fontWeight: 700 }}>
                {meta.label}
              </div>
            </div>
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon show-mobile"
            style={{ color: 'var(--t2)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Workspace Switcher ─────────────────────── */}
        {hasMultiple && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <button
              onClick={() => setShowSwitcher(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', borderRadius: 'var(--r)',
                background: 'rgba(74,62,61,0.05)', border: '1px solid var(--border)',
                cursor: 'pointer', color: 'var(--t2)', fontSize: 11, fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Repeat size={11} style={{ color: meta.color }} />
                Switch Workspace
              </span>
              {showSwitcher ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {showSwitcher && (
              <div style={{
                marginTop: 4, background: 'var(--s1)', borderRadius: 'var(--r)',
                overflow: 'hidden', border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {allRoles.map(role => {
                  const rm = ROLE_META[role] || ROLE_META.creator;
                  const isActive = activeRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => handleSwitch(role)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 12px', background: isActive ? `${rm.color}15` : 'transparent',
                        border: 'none', cursor: 'pointer',
                        color: isActive ? rm.color : 'var(--t2)',
                        fontSize: 12, fontWeight: isActive ? 700 : 500,
                        textAlign: 'left', transition: 'all 0.12s',
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: rm.color, flexShrink: 0 }} />
                      {rm.label}
                      {isActive && (
                        <span style={{ marginLeft: 'auto', fontSize: 9, color: rm.color, fontWeight: 800 }}>
                          ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Nav items ─────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={({ isActive }) => ({
              background: isActive ? 'rgba(230, 95, 43, 0.14)' : undefined,
              color: isActive ? 'var(--acc, #E65F2B)' : 'var(--t1, #2C2520)',
              fontWeight: isActive ? 800 : 500,
              border: isActive ? '1px solid rgba(230, 95, 43, 0.35)' : '1px solid transparent',
              boxShadow: isActive ? '0 2px 8px rgba(230, 95, 43, 0.08)' : undefined,
              marginBottom: 2,
            })}
          >
            {({ isActive }) => (
              <>
                <Home size={15} className="sidebar-icon icon-home" style={{ flexShrink: 0, color: isActive ? 'var(--acc, #E65F2B)' : 'var(--t2)' }} />
                <span className="nav-item-label" style={{ color: isActive ? 'var(--acc, #E65F2B)' : 'var(--t1, #2C2520)' }}>Home</span>
              </>
            )}
          </NavLink>
          {navGroups.map((grp, idx) => (
            <NavGroup
              key={idx}
              group={grp.group}
              items={grp.items}
              meta={meta}
              onClose={onClose}
              defaultOpen={true}
            />
          ))}
        </div>

        {/* ── Creative User Card + Logout ─────────────────────── */}
        <div style={{ padding: '10px 10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(230, 95, 43, 0.08) 0%, rgba(212, 162, 76, 0.04) 100%), var(--s1, #FAF7F2)',
              marginBottom: 8,
              border: '1px solid rgba(230, 95, 43, 0.25)',
              boxShadow: '0 4px 14px rgba(230, 95, 43, 0.06)',
              transition: 'all 0.22s cubic-bezier(0.25, 1, 0.5, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(230, 95, 43, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(230, 95, 43, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(230, 95, 43, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(230, 95, 43, 0.25)';
            }}
          >
            {/* Glowing Avatar Container */}
            <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar src={user?.avatar} name={user?.displayName} size={32} />
              <div style={{
                position: 'absolute', inset: -2, borderRadius: '50%',
                border: '1.5px solid var(--acc, #E65F2B)', pointerEvents: 'none',
                opacity: 0.8
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: '800', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, marginBottom: 3 }}>
                {user?.displayName}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 99,
                background: 'rgba(230, 95, 43, 0.12)', border: '1px solid rgba(230, 95, 43, 0.28)',
                fontSize: 10, fontWeight: 800, color: 'var(--acc, #E65F2B)',
                textTransform: 'capitalize', letterSpacing: '0.02em',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--acc, #E65F2B)' }} />
                {activeRole?.replace('_', ' ')}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 12px',
              borderRadius: 10, background: 'rgba(230, 95, 43, 0.06)', border: '1px solid rgba(230, 95, 43, 0.16)', cursor: 'pointer',
              color: 'var(--acc, #E65F2B)', fontSize: 12, fontWeight: 700, transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(230, 95, 43, 0.14)';
              e.currentTarget.style.borderColor = 'rgba(230, 95, 43, 0.35)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(230, 95, 43, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(230, 95, 43, 0.15)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            <LogOut size={14} /><span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
