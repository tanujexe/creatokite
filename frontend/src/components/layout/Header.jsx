import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Sun, Moon, Menu, Search, X, Eye, LogOut,
  CheckCheck, Brain, Trophy, Home,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usersAPI, searchAPI } from '../../api';
import { Avatar } from '../ui';
import { io as socketIO } from 'socket.io-client';
import toast from 'react-hot-toast';

const TITLES = {
  /* Creator */
  '/creator/dashboard': 'Dashboard', '/creator/assigned': 'My Campaigns',
  '/creator/analytics': 'Analytics', '/creator/earnings': 'Earnings',
  '/creator/leaderboard': 'Leaderboard', '/creator/profile': 'Profile',
  '/creator/activities': 'Activity Hub', '/creator/academy': 'Academy',
  '/creator/community': 'Community',
  /* Brand */
  '/brand/dashboard': 'Dashboard', '/brand/campaigns/create': 'New Campaign',
  '/brand/campaigns': 'My Campaigns', '/brand/analytics': 'Analytics',
  '/brand/profile': 'Profile', '/brand/reels': 'Reel Tracker',
  /* Admin */
  '/admin/dashboard': 'Admin Dashboard', '/admin/campaigns': 'Campaign Management',
  '/admin/users': 'Users', '/admin/analytics': 'Analytics',
  '/admin/creator-approval': 'Creator Approvals', '/admin/activities': 'Activity Hub',
  '/admin/reels': 'Reel Analytics', '/admin/rooms': 'Campaign Rooms',
  '/admin/crm/creators': 'Creator CRM', '/admin/crm/brands': 'Brand CRM',
  '/admin/revenue': 'Revenue Dashboard', '/admin/audit': 'Audit Logs',
  '/admin/roles': 'Role Manager', '/admin/knowledge': 'Knowledge Base',
  '/admin/search': 'Search', '/admin/community': 'Community Management',
  '/admin/team-management': 'Team Management',
  /* V2.7 new */
  '/admin/leaderboard': 'Creator Leaderboards',
  '/admin/creator-intelligence': 'Creator Intelligence',
  /* V3 features */
  '/opportunities': 'Opportunities',
  '/knowledge': 'Knowledge Base',
  '/activities': 'Activities',
  '/admin/opportunities': 'Opportunity Admin',
  '/admin/management': 'Management Hub',
  '/admin/notifications': 'Notification Center',
  /* Team */
  '/team/workspace': 'Team Workspace', '/team/tasks': 'Task Manager',
  '/team/dm-tracker': 'DM Tracker', '/team/directory': 'Team Directory',
  '/team/search': 'Search', '/team/community': 'Community',
  /* SuperAdmin */
  '/superadmin/dashboard': 'SuperAdmin Control Center',
};

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

/* ── Notification type icons ────────────────────────── */
const NOTIF_ICON = {
  campaign_assigned: '🎯',
  creator_approved: '✅',
  creator_rejected: '❌',
  assignment_update: '📋',
  role_change: '🎉',
  system: '🔔',
  broadcast: '📢',
  task_due: '⏰',
  submission: '📤',
  default: '🔔',
};

export default function Header({ onMenuToggle }) {
  const { user, viewAsUser, setViewAsUser, logout, getActiveRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showN, setShowN] = useState(false);
  const [showU, setShowU] = useState(false);
  const [showS, setShowS] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [sLoading, setSLoading] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);
  const debRef = useRef(null);
  const socketRef = useRef(null);
  const pollerRef = useRef(null);

  const pathname = location.pathname;
  let activeRole = getActiveRole();
  if (pathname.startsWith('/brand')) activeRole = 'brand';
  else if (pathname.startsWith('/creator')) activeRole = 'creator';
  else if (pathname.startsWith('/team')) activeRole = 'team_member';
  else if (pathname.startsWith('/admin')) activeRole = 'admin';
  else if (pathname.startsWith('/superadmin')) activeRole = 'superadmin';
  else activeRole = activeRole || user?.role || 'creator';

  /* Dynamic title: workspace page gets campaign id from path */
  let title = TITLES[pathname] || 'CreatoKite';
  if (pathname.includes('/workspace')) title = 'Campaign Workspace';
  if (pathname.includes('/admin/campaigns/') && pathname.includes('/workspace')) title = 'Campaign Workspace';

  /* ── Load notifications ─────────────────────────── */
  const loadNotifs = useCallback(async (silent = false) => {
    try {
      const d = await usersAPI.notifications();
      setNotifs(d.notifications || []);
      setUnread(d.unread || 0);
    } catch (e) {
      if (!silent) console.warn('[Notifs] load failed');
    }
  }, []);

  useEffect(() => { if (user) loadNotifs(); }, [user, loadNotifs]);

  /* Background poll every 30s */
  useEffect(() => {
    if (!user) return;
    pollerRef.current = setInterval(() => loadNotifs(true), 30000);
    return () => clearInterval(pollerRef.current);
  }, [user, loadNotifs]);

  /* Listen for local notification broadcasts (Notification Center) */
  useEffect(() => {
    const handleNotifCreated = () => {
      if (user) loadNotifs(true);
    };
    window.addEventListener('notification_created', handleNotifCreated);
    return () => window.removeEventListener('notification_created', handleNotifCreated);
  }, [user, loadNotifs]);

  /* ── Socket.io real-time ─────────────────────────── */
  useEffect(() => {
    if (!user?._id) return;
    const socket = socketIO(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      autoConnect: true,
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on('connect_error', () => { }); // Silent catch on dev websocket connect

    socket.on('connect', () => { socket.emit('join:user', user._id); });

    socket.on('notification', (data) => {
      const n = {
        _id: Date.now().toString(),
        title: data.title || 'Notification',
        body: data.body || '',
        type: data.type || 'system',
        link: data.link || '',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifs(prev => [n, ...prev]);
      setUnread(prev => prev + 1);
      toast(
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{NOTIF_ICON[n.type] || NOTIF_ICON.default}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{n.title}</div>
            {n.body && <div style={{ fontSize: 11, opacity: 0.8 }}>{n.body.slice(0, 60)}{n.body.length > 60 ? '…' : ''}</div>}
          </div>
        </div>,
        { duration: 4500, style: { background: 'var(--s1)', color: 'var(--t1)', border: '1px solid var(--border)' } }
      );
    });

    socket.on('role_updated', () => {
      toast.success('🎉 Your roles have been updated! Refreshing…');
      window.dispatchEvent(new CustomEvent('ck_role_updated'));
    });

    return () => {
      socket.off('notification');
      socket.off('role_updated');
      socket.disconnect();
    };
  }, [user?._id]);

  /* ── Outside click ───────────────────────────────── */
  useEffect(() => {
    const fn = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowN(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowU(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) { setShowS(false); setQuery(''); setResults(null); }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* ── Debounced global search ─────────────────────── */
  useEffect(() => {
    if (!query || query.length < 2) { setResults(null); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setSLoading(true);
      try { const d = await searchAPI.query(query); setResults(d.results); }
      catch (e) { }
      finally { setSLoading(false); }
    }, 380);
    return () => clearTimeout(debRef.current);
  }, [query]);

  const openNotifs = async () => {
    setShowN(v => !v); setShowU(false); setShowS(false);
    if (!showN && unread > 0) {
      await usersAPI.readNotifs().catch(() => { });
      setUnread(0);
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await usersAPI.deleteNotif(id);
      setNotifs(prev => prev.filter(n => n._id !== id));
    } catch (e) { }
  };

  const clearAll = async (e) => {
    e.stopPropagation();
    try { await usersAPI.clearAllNotifs(); setNotifs([]); setUnread(0); } catch (e) { }
  };

  const exitViewAs = () => { setViewAsUser(null); navigate('/admin/dashboard'); };

  const searchPath = {
    creator: '/creator/search', brand: '/brand/search',
    team_member: '/team/search', admin: '/admin/search',
  }[activeRole] || '/admin/search';
  const showSearch = activeRole === 'team_member' || activeRole === 'admin' || activeRole === 'superadmin';

  const totalResults = results ? Object.values(results).reduce((s, a) => s + (a?.length || 0), 0) : 0;

  return (
    <>
      {/* ── View-as banner ─────────────────────────── */}
      {viewAsUser && (
        <div style={{
          background: 'linear-gradient(90deg,#f59e0b,#d97706)', color: '#000',
          padding: '6px 16px', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 60, position: 'sticky', top: 0,
        }}>
          <span><Eye size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            Viewing as: <strong>{viewAsUser.displayName}</strong> ({viewAsUser.role})
          </span>
          <button onClick={exitViewAs} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={10} />Exit
          </button>
        </div>
      )}

      <header className="top-header">
        {/* ── Hamburger (mobile only) ─────────────── */}
        <button
          className="header-menu-toggle show-mobile btn btn-ghost btn-icon"
          onClick={onMenuToggle}
          style={{ color: 'var(--t1)', flexShrink: 0 }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* ── Page title ──────────────────────────── */}
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 800,
          fontSize: 'clamp(15px,3.5vw,17px)', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t1)',
          letterSpacing: '-0.02em'
        }}>
          {title}
        </span>

        {/* ── Creator score chip ───────────────────── */}
        {activeRole === 'creator' && (
          <div
            className="score-chip hide-mobile"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px',
              background: 'var(--s1)', border: '1px solid var(--border)',
              borderRadius: 99, fontSize: 12.5, flexShrink: 0,
              boxShadow: 'var(--glass-shadow)', transition: 'all 0.2s'
            }}
          >
            <span style={{ color: 'var(--acc)', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif' }}>
              ⚡ {user?.creatorScore || 0}
            </span>
            <span style={{ color: 'var(--t3)', fontWeight: 600 }}>·</span>
            <span style={{ color: 'var(--gold, #D97706)', fontWeight: 800, fontSize: 12, letterSpacing: 0.2 }}>
              {user?.rank || 'Silver'}
            </span>
          </div>
        )}

        {/* ── Home (landing page) ─────────────────── */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: 38, height: 38, borderRadius: 12, background: 'var(--s1)',
            border: '1px solid var(--border)', color: 'var(--t1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
            boxShadow: 'var(--glass-shadow)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'var(--acc)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--s1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          title="Home"
          aria-label="Go to home page"
        >
          <Home size={17} />
        </button>

        {/* ── Admin quick links (desktop) ──────────── */}
        {(activeRole === 'admin' || activeRole === 'superadmin') && (
          <div className="hide-mobile" style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => navigate('/admin/leaderboard')}
              style={{
                width: 38, height: 38, borderRadius: 12, background: 'var(--s1)',
                border: '1px solid var(--border)', color: 'var(--t1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                boxShadow: 'var(--glass-shadow)'
              }}
              title="Leaderboards"
            >
              <Trophy size={16} style={{ color: '#D97706' }} />
            </button>
          </div>
        )}

        {/* ── Global Search ────────────────────────── */}
        {showSearch && (
          <div ref={searchRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { setShowS(v => !v); setShowN(false); setShowU(false); }}
              style={{
                width: 38, height: 38, borderRadius: 12, background: 'var(--s1)',
                border: '1px solid var(--border)', color: 'var(--t1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                boxShadow: 'var(--glass-shadow)'
              }}
              title="Search"
            >
              <Search size={16} />
            </button>

            {showS && (
              <div className="search-dropdown glass-modal">
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search creators, campaigns, tasks…"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--t1)', fontSize: 13, minWidth: 0 }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && query.length >= 2) {
                        navigate(`${searchPath}?q=${encodeURIComponent(query)}`);
                        setShowS(false); setQuery('');
                      }
                      if (e.key === 'Escape') { setShowS(false); setQuery(''); }
                    }}
                  />
                  {query && (
                    <button onClick={() => { setQuery(''); setResults(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                {sLoading && <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--t3)' }}>Searching…</div>}

                {results && !sLoading && (
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {totalResults === 0
                      ? <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>No results for "{query}"</div>
                      : Object.entries(results).map(([type, items]) =>
                        items?.length ? (
                          <div key={type}>
                            <div style={{ padding: '8px 14px 4px', fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                              {type}
                            </div>
                            {items.map(item => (
                              <div
                                key={item._id}
                                onClick={() => { setShowS(false); setQuery(''); }}
                                style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,87,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                              >
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--p),var(--acc))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                  {((item.displayName || item.title || '?')[0] || '?').toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ color: 'var(--t1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.displayName || item.title}
                                  </div>
                                  <div style={{ color: 'var(--t3)', fontSize: 10 }}>
                                    {item.email || item.niche || item.status || ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null
                      )
                    }
                  </div>
                )}
                {!query && <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>Type to search creators, campaigns, tasks…</div>}
              </div>
            )}
          </div>
        )}

        {/* ── Theme toggle ─────────────────────────── */}
        <button
          onClick={toggleTheme}
          style={{
            width: 38, height: 38, borderRadius: 12, background: 'var(--s1)',
            border: '1px solid var(--border)', color: 'var(--t1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
            boxShadow: 'var(--glass-shadow)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'var(--acc)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--s1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} style={{ color: '#D97706' }} /> : <Moon size={17} style={{ color: 'var(--t1)' }} />}
        </button>

        {/* ── Notifications ────────────────────────── */}
        <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={openNotifs}
            style={{
              width: 38, height: 38, borderRadius: 12, background: 'var(--s1)',
              border: '1px solid var(--border)', color: 'var(--t1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
              position: 'relative', boxShadow: 'var(--glass-shadow)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'var(--acc)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--s1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3,
                minWidth: 16, height: 16, borderRadius: 99,
                background: 'var(--acc)', color: '#fff',
                fontSize: 9.5, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', border: '2px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(230,95,43,0.4)',
                animation: 'pulse 2s infinite',
              }}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {showN && (
            <div className="glass-modal notif-dropdown" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={14} style={{ color: 'var(--p)' }} />
                  Notifications
                  {unread > 0 && <span style={{ background: 'var(--rose)', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 99, fontWeight: 800 }}>{unread}</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {notifs.length > 0 && (
                    <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 4 }}>
                      <CheckCheck size={12} />Clear all
                    </button>
                  )}
                  <button onClick={() => setShowN(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                    <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500 }}>All caught up!</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>No new notifications</div>
                  </div>
                ) : notifs.slice(0, 40).map(n => (
                  <div
                    key={n._id}
                    onClick={() => { setShowN(false); if (n.link) navigate(n.link); }}
                    style={{
                      padding: '10px 16px', borderBottom: '1px solid var(--border)',
                      cursor: n.link ? 'pointer' : 'default',
                      background: n.read ? '' : 'rgba(255,107,87,0.04)',
                      display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? '' : 'rgba(255,107,87,0.04)'}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{NOTIF_ICON[n.type] || NOTIF_ICON.default}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: 'var(--t1)', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {n.body}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button onClick={e => deleteNotif(e, n._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2, flexShrink: 0, fontSize: 16, lineHeight: 1, opacity: 0.5 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Avatar / user menu ───────────────────── */}
        <div ref={userRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => { setShowU(v => !v); setShowN(false); setShowS(false); }}
            style={{
              width: 36, height: 36, borderRadius: 99, background: 'none',
              border: '2px solid #FFFFFF', padding: 0, cursor: 'pointer', flexShrink: 0,
              transition: 'transform 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Avatar src={user?.avatar} name={user?.displayName} size={32} />
          </button>

          {showU && (
            <div className="glass-modal" style={{ position: 'fixed', right: 12, top: 'calc(var(--header-h) + 8px)', width: 200, zIndex: 500, animation: 'scaleIn 0.15s ease', transformOrigin: 'top right', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{user?.email}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(user?.roles?.length ? user.roles : [user?.role]).map(r => (
                    <span key={r} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9.5, padding: '2px 8px', borderRadius: 99, background: 'rgba(230,95,43,0.12)', color: 'var(--p)', border: '1px solid rgba(230,95,43,0.2)', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>{r}</span>
                  ))}
                </div>
              </div>
              {(activeRole === 'creator' || activeRole === 'brand') && (
                <button
                  onClick={() => { setShowU(false); navigate(activeRole === 'creator' ? '/creator/profile' : '/brand/profile'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t2)', fontSize: 12, transition: 'background 0.12s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,87,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Profile Settings
                </button>
              )}
              <button
                onClick={async () => { setShowU(false); await logout(); navigate('/login'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose)', fontSize: 12, transition: 'background 0.12s', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,87,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={12} />Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
