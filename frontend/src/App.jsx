import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './router/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { StartupAnimation } from './components/ui';

/* ── Auth ──────────────────────────────────────────── */
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LoginSuccess from './pages/LoginSuccess';

/* ── Creator ───────────────────────────────────────── */
import CreatorDashboard from './pages/creator/Dashboard';
import AssignedCampaigns from './pages/creator/AssignedCampaigns';
import CreatorAnalytics from './pages/creator/CreatorInsights';
import CreatorEarnings from './pages/creator/Earnings';
import Leaderboard from './pages/creator/Leaderboard';
import CreatorProfile from './pages/creator/Profile';
import Activities from './pages/creator/Activities';
import Academy from './pages/creator/Academy';
import Community from './pages/creator/Community';

/* ── Brand ─────────────────────────────────────────── */
import BrandDashboard from './pages/brand/BrandDashboard';
import CreateCampaign from './pages/brand/CreateCampaign';
import BrandCampaigns from './pages/brand/BrandCampaigns';
import BrandAnalytics from './pages/brand/BrandInsights';
import CampaignDetail from './pages/brand/CampaignDetail';
import BrandProfile from './pages/brand/Profile';
import ReelTracker from './pages/brand/ReelTracker';

/* ── Admin ─────────────────────────────────────────── */
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminInsights';
import AdminCreatorApproval from './pages/admin/AdminCreatorApproval';
import AdminReelAnalytics from './pages/admin/AdminReelStats';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import CampaignRooms from './pages/admin/CampaignRooms';
import CreatorCRM from './pages/admin/CreatorCRM';
import BrandCRM from './pages/admin/BrandCRM';
import RevenueDashboard from './pages/admin/RevenueDashboard';
import AuditLogs from './pages/admin/AuditLogs';
import RoleManager from './pages/admin/RoleManager';
import KnowledgeBase from './pages/admin/KnowledgeBase';
import TeamManagement from './pages/admin/TeamManagement';
import TeamMemberDetail from './pages/admin/TeamMemberDetail';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';
import CreatorIntelligence from './pages/admin/CreatorIntelligence';
import CampaignWorkspacePage from './pages/admin/CampaignWorkspacePage';

/* ── Team ──────────────────────────────────────────── */
import TeamWorkspace from './pages/team/TeamWorkspace';
import TaskManager from './pages/team/TaskManager';
import DMTracker from './pages/team/DMTracker';
import TeamDirectory from './pages/team/TeamDirectory';

/* ── Shared ────────────────────────────────────────── */
import CampaignRoom from './pages/shared/CampaignRoom';
import UniversalSearch from './pages/shared/UniversalSearch';
import CommunityAdmin from './pages/shared/CommunityAdmin';
import Opportunities from './pages/shared/Opportunities';
import OpportunityAdmin from './pages/admin/OpportunityAdmin';
import ManagementHub from './pages/admin/ManagementHub';
import NotificationCenter from './pages/admin/NotificationCenter';
import DynamicSEO from './components/common/DynamicSEO';

export default function App() {
  return (
    <>
      <DynamicSEO />
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
  </>
  );
}
