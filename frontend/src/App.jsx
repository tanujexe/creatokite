import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './router/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { StartupAnimation } from './components/ui';
import DynamicSEO from './components/common/DynamicSEO';

/* ── Lazy Loaded Pages ─────────────────────────────── */

/* ── Auth ── */
const Landing      = lazy(() => import('./pages/Landing'));
const Login        = lazy(() => import('./pages/auth/Login'));
const Register     = lazy(() => import('./pages/auth/Register'));
const LoginSuccess = lazy(() => import('./pages/LoginSuccess'));

/* ── Creator ── */
const CreatorDashboard  = lazy(() => import('./pages/creator/Dashboard'));
const AssignedCampaigns = lazy(() => import('./pages/creator/AssignedCampaigns'));
const CreatorAnalytics  = lazy(() => import('./pages/creator/CreatorInsights'));
const CreatorEarnings   = lazy(() => import('./pages/creator/Earnings'));
const Leaderboard       = lazy(() => import('./pages/creator/Leaderboard'));
const CreatorProfile    = lazy(() => import('./pages/creator/Profile'));
const Activities        = lazy(() => import('./pages/creator/Activities'));
const Academy           = lazy(() => import('./pages/creator/Academy'));
const Community         = lazy(() => import('./pages/creator/Community'));

/* ── Brand ── */
const BrandDashboard  = lazy(() => import('./pages/brand/BrandDashboard'));
const CreateCampaign  = lazy(() => import('./pages/brand/CreateCampaign'));
const BrandCampaigns  = lazy(() => import('./pages/brand/BrandCampaigns'));
const BrandAnalytics  = lazy(() => import('./pages/brand/BrandInsights'));
const CampaignDetail  = lazy(() => import('./pages/brand/CampaignDetail'));
const BrandProfile    = lazy(() => import('./pages/brand/Profile'));
const ReelTracker     = lazy(() => import('./pages/brand/ReelTracker'));

/* ── Admin ── */
const AdminDashboard        = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCampaigns        = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminUsers            = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnalytics        = lazy(() => import('./pages/admin/AdminInsights'));
const AdminCreatorApproval = lazy(() => import('./pages/admin/AdminCreatorApproval'));
const AdminReelAnalytics    = lazy(() => import('./pages/admin/AdminReelStats'));
const SuperAdminDashboard   = lazy(() => import('./pages/admin/SuperAdminDashboard'));
const CampaignRooms         = lazy(() => import('./pages/admin/CampaignRooms'));
const CreatorCRM            = lazy(() => import('./pages/admin/CreatorCRM'));
const BrandCRM              = lazy(() => import('./pages/admin/BrandCRM'));
const RevenueDashboard      = lazy(() => import('./pages/admin/RevenueDashboard'));
const AuditLogs             = lazy(() => import('./pages/admin/AuditLogs'));
const RoleManager           = lazy(() => import('./pages/admin/RoleManager'));
const KnowledgeBase         = lazy(() => import('./pages/admin/KnowledgeBase'));
const TeamManagement        = lazy(() => import('./pages/admin/TeamManagement'));
const TeamMemberDetail      = lazy(() => import('./pages/admin/TeamMemberDetail'));
const AdminLeaderboard      = lazy(() => import('./pages/admin/AdminLeaderboard'));
const CreatorIntelligence   = lazy(() => import('./pages/admin/CreatorIntelligence'));
const CampaignWorkspacePage = lazy(() => import('./pages/admin/CampaignWorkspacePage'));

/* ── Team ── */
const TeamWorkspace = lazy(() => import('./pages/team/TeamWorkspace'));
const TaskManager   = lazy(() => import('./pages/team/TaskManager'));
const DMTracker     = lazy(() => import('./pages/team/DMTracker'));
const TeamDirectory = lazy(() => import('./pages/team/TeamDirectory'));

/* ── Shared ── */
const CampaignRoom       = lazy(() => import('./pages/shared/CampaignRoom'));
const UniversalSearch    = lazy(() => import('./pages/shared/UniversalSearch'));
const CommunityAdmin     = lazy(() => import('./pages/shared/CommunityAdmin'));
const Opportunities      = lazy(() => import('./pages/shared/Opportunities'));
const OpportunityAdmin   = lazy(() => import('./pages/admin/OpportunityAdmin'));
const ManagementHub      = lazy(() => import('./pages/admin/ManagementHub'));
const NotificationCenter = lazy(() => import('./pages/admin/NotificationCenter'));

/* ── Creative Brand Loading Fallback ── */
const PageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    position: 'relative',
    padding: '40px 20px',
  }}>
    <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer counter-clockwise ring */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: '2.5px solid rgba(229, 91, 43, 0.12)',
        borderTopColor: '#E55B2B',
        borderRightColor: '#F5A623',
        animation: 'spinReverse 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
      }} />

      {/* Inner clockwise ring */}
      <div style={{
        position: 'absolute',
        inset: 8,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: '#E55B2B',
        animation: 'spinClockwise 0.8s linear infinite',
      }} />

      <img
        src="/logo.png"
        alt="CreatoKite"
        style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain' }}
        onError={e => { e.currentTarget.src = '/logo.jpeg'; }}
      />
    </div>

    <span style={{
      marginTop: 18,
      fontSize: 12,
      fontFamily: '"Figtree", sans-serif',
      fontWeight: 700,
      color: '#E55B2B',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>
      Loading CreatoKite…
    </span>

    <style>{`
      @keyframes spinClockwise { to { transform: rotate(360deg); } }
      @keyframes spinReverse { to { transform: rotate(-360deg); } }
    `}</style>
  </div>
);

export default function App() {
  return (
    <>
      <DynamicSEO />
      <Suspense fallback={<PageLoader />}>

      <Routes>
      {/* ── Public ──────────────────────────────────── */}
      <Route path="/"              element={<StartupAnimation><Landing /></StartupAnimation>} />
      <Route path="/login"         element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"      element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/login-success" element={<LoginSuccess />} />

      {/* ── Shared: All Authenticated Roles ─────────── */}
      <Route element={<ProtectedRoute roles={['admin', 'team_member', 'superadmin', 'creator', 'brand']}><AppLayout /></ProtectedRoute>}>
        <Route path="/opportunities"       element={<Opportunities />} />
        <Route path="/knowledge"           element={<KnowledgeBase />} />
        <Route path="/activities"          element={<Activities />} />
        <Route path="/creator/academy"     element={<Academy />} />
        <Route path="/creator/activities"  element={<Activities />} />
        <Route path="/leaderboard"         element={<Leaderboard />} />
      </Route>

      {/* ── Creator ─────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['creator']}><AppLayout /></ProtectedRoute>}>
        <Route path="/creator/dashboard"   element={<CreatorDashboard />} />
        <Route path="/creator/assigned"    element={<AssignedCampaigns />} />
        <Route path="/creator/analytics"   element={<CreatorAnalytics />} />
        <Route path="/creator/earnings"    element={<CreatorEarnings />} />
        <Route path="/creator/leaderboard" element={<Leaderboard />} />
        <Route path="/creator/profile"     element={<CreatorProfile />} />
        <Route path="/creator/community"   element={<Community />} />
        <Route path="/creator/room/:id"    element={<CampaignRoom />} />
        <Route path="/creator/search"      element={<UniversalSearch />} />
      </Route>

      {/* ── Brand ───────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['brand']}><AppLayout /></ProtectedRoute>}>
        <Route path="/brand/dashboard"        element={<BrandDashboard />} />
        <Route path="/brand/campaigns/create" element={<CreateCampaign />} />
        <Route path="/brand/campaigns"        element={<BrandCampaigns />} />
        <Route path="/brand/campaigns/:id"    element={<CampaignDetail />} />
        <Route path="/brand/analytics"        element={<BrandAnalytics />} />
        <Route path="/brand/profile"          element={<BrandProfile />} />
        <Route path="/brand/reels"            element={<ReelTracker />} />
        <Route path="/brand/room/:id"         element={<CampaignRoom />} />
      </Route>

      {/* ── Shared: Admin + Team Member ─────────────── */}
      <Route element={<ProtectedRoute roles={['admin', 'team_member']}><AppLayout /></ProtectedRoute>}>
        <Route path="/admin/campaigns"              element={<AdminCampaigns />} />
        <Route path="/admin/campaigns/create"       element={<CreateCampaign />} />
        <Route path="/admin/campaigns/:id/workspace" element={<CampaignWorkspacePage />} />
        <Route path="/admin/rooms"                  element={<CampaignRooms />} />
        <Route path="/admin/room/:id"               element={<CampaignRoom />} />
        <Route path="/admin/crm/creators"           element={<CreatorCRM />} />
        <Route path="/admin/crm/brands"             element={<BrandCRM />} />
        <Route path="/admin/community"              element={<CommunityAdmin />} />
        <Route path="/team/community"               element={<CommunityAdmin />} />
        <Route path="/admin/activities"             element={<SuperAdminDashboard initialTab="activities" />} />
        <Route path="/admin/opportunities"          element={<OpportunityAdmin />} />
        <Route path="/admin/management"             element={<ManagementHub />} />
        <Route path="/admin/notifications"          element={<NotificationCenter />} />
      </Route>

      {/* ── Admin Only ──────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['admin']}><AppLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard"                element={<AdminDashboard />} />
        <Route path="/admin/users"                    element={<AdminUsers />} />
        <Route path="/admin/analytics"                element={<AdminAnalytics />} />
        <Route path="/admin/creator-approval"         element={<AdminCreatorApproval />} />
        <Route path="/admin/reels"                    element={<AdminReelAnalytics />} />
        <Route path="/admin/revenue"                  element={<RevenueDashboard />} />
        <Route path="/admin/audit"                    element={<AuditLogs />} />
        <Route path="/admin/roles"                    element={<RoleManager />} />
        <Route path="/admin/knowledge"                element={<KnowledgeBase />} />
        <Route path="/admin/team-management"          element={<TeamManagement />} />
        <Route path="/admin/team-management/:id"      element={<TeamMemberDetail />} />
        <Route path="/admin/search"                   element={<UniversalSearch />} />
        {/* ── V2.7 New Routes ─────────────────────── */}
        <Route path="/admin/leaderboard"              element={<AdminLeaderboard />} />
        <Route path="/admin/creator-intelligence"     element={<CreatorIntelligence />} />
      </Route>

      {/* ── Team ────────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['team_member']}><AppLayout /></ProtectedRoute>}>
        <Route path="/team/workspace"  element={<TeamWorkspace />} />
        <Route path="/team/tasks"      element={<TaskManager />} />
        <Route path="/team/dm-tracker" element={<DMTracker />} />
        <Route path="/team/directory"  element={<TeamDirectory />} />
        <Route path="/team/room/:id"   element={<CampaignRoom />} />
        <Route path="/team/search"     element={<UniversalSearch />} />
      </Route>

      {/* ── SuperAdmin ──────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['superadmin']}><AppLayout /></ProtectedRoute>}>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  </>
  );
}
