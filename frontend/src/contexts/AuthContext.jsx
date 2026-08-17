import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export function getDashboardPath(role) {
  if (role === 'superadmin') return '/superadmin/dashboard';
  if (role === 'admin')      return '/admin/dashboard';
  if (role === 'team_member')return '/team/workspace';
  if (role === 'brand')      return '/brand/dashboard';
  return '/creator/dashboard';
}

const AuthContext = createContext(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [viewAsUser,setViewAsUser]= useState(null);
  const initialized = useRef(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem('ck_token');
    localStorage.removeItem('ck_refresh');
    setUser(null); setViewAsUser(null);
  }, []);

  const saveSession = useCallback((token, refresh, userData) => {
    if (token)   localStorage.setItem('ck_token',   token);
    if (refresh) localStorage.setItem('ck_refresh', refresh);
    /* Normalise roles so rest of app always has roles[] */
    if (userData && !userData.roles?.length) userData.roles = [userData.role || 'creator'];
    if (userData && !userData.activeRole)    userData.activeRole = userData.role || 'creator';
    setUser(userData);
  }, []);

  /* Boot — check token on mount */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const token = localStorage.getItem('ck_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(d => {
        const u = d.user;
        if (!u.roles?.length) u.roles = [u.role || 'creator'];
        if (!u.activeRole)    u.activeRole = u.role || 'creator';
        setUser(u);
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  /* Background user sync for instant role updates */
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      authAPI.me()
        .then(d => {
          if (d.success && d.user) {
            const u = d.user;
            if (!u.roles?.length) u.roles = [u.role || 'creator'];
            if (!u.activeRole)    u.activeRole = u.role || 'creator';

            const oldRolesStr = JSON.stringify(user.roles || []);
            const newRolesStr = JSON.stringify(u.roles || []);
            const roleListChanged = oldRolesStr !== newRolesStr || user.role !== u.role;

            if (roleListChanged) {
              const preservedActiveRole = u.roles.includes(user.activeRole) ? user.activeRole : (u.activeRole || u.role || 'creator');
              const updatedUser = { ...u, activeRole: preservedActiveRole };
              setUser(updatedUser);
              toast.success(`🎉 Role changes applied! Active workspace: ${preservedActiveRole}`);
            }
          }
        })
        .catch(err => {
          console.error('[AuthSync] Background refresh failed:', err);
        });
    }, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email, password) => {
    const d = await authAPI.login({ email, password });
    if (!d.success) throw new Error(d.message || 'Login failed');
    saveSession(d.token, d.refreshToken, d.user);
    return d.user;
  }, [saveSession]);

  const register = useCallback(async (data) => {
    const d = await authAPI.register(data);
    if (!d.success) throw new Error(d.message || 'Registration failed');
    saveSession(d.token, d.refreshToken, d.user);
    return { user: d.user, socialResult: d.socialResult || null };
  }, [saveSession]);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch(e) {}
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const d = await authAPI.me();
    const u = d.user;
    if (!u.roles?.length) u.roles = [u.role || 'creator'];
    if (!u.activeRole)    u.activeRole = u.role || 'creator';
    setUser(u);
    return u;
  }, []);

  /* V2: switch workspace */
  const switchWorkspace = useCallback((role) => {
    setUser(prev => {
      if (!prev) return prev;
      const roles = prev.roles?.length ? prev.roles : [prev.role];
      if (!roles.includes(role) && prev.role !== 'superadmin') return prev;
      return { ...prev, activeRole: role };
    });
  }, []);

  /* V2: helpers */
  const getActiveRole = useCallback(() => {
    if (!user) return null;
    const roles = user.roles?.length ? user.roles : [user.role || 'creator'];
    if (user.activeRole && roles.includes(user.activeRole)) {
      return user.activeRole;
    }
    return user.role || 'creator';
  }, [user]);

  const getUserRoles = useCallback(() => {
    if (!user) return [];
    return user.roles?.length ? user.roles : [user.role || 'creator'];
  }, [user]);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    const roles = user.roles?.length ? user.roles : [user.role || 'creator'];
    return roles.includes(role) || roles.includes('superadmin');
  }, [user]);

  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    if (hasRole('superadmin') || hasRole('admin')) return true;
    return user.permissions?.[perm] === true;
  }, [user, hasRole]);

  const value = {
    user, loading, viewAsUser, setViewAsUser, setUser,
    login, register, logout, refreshUser,
    switchWorkspace, getActiveRole, getUserRoles, hasRole, hasPermission,
    getDashboardPath,
    isAdmin:       !!(user && hasRole('admin')),
    isSuperAdmin:  !!(user && hasRole('superadmin')),
    isBrand:       !!(user && hasRole('brand')),
    isCreator:     !!(user && hasRole('creator')),
    isTeam:        !!(user && hasRole('team_member')),
    activeRole:    user ? (user.activeRole || user.role || 'creator') : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
