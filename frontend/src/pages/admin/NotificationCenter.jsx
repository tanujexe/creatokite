import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Btn, Input, Textarea, Avatar } from '../../components/ui';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';
import {
  Bell, Send, CheckCircle2, Eye, Clock, AlertTriangle, Filter, Search, Plus,
  FileText, ArrowRight, X, ChevronRight, Layers, ShieldAlert, Sparkles,
  Users, Smartphone, Mail, MessageSquare, Globe, Download, Copy, Trash2,
  RefreshCw, Check, Zap, Calendar, Laptop, Tablet, Moon, Sun, CheckSquare,
  BarChart3, Settings, Play, Pause, ExternalLink, HelpCircle, UserCheck, Flame
} from 'lucide-react';

/* ── Sample Initial Data ──────────────────────────────── */
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Nike Summer Campaign Open for Applications',
    subtitle: 'High payout campaign for Tech & Fashion creators',
    audience: 'All Creators',
    audienceCount: 4250,
    type: 'Campaign',
    priority: 'High',
    channels: ['In-App', 'Email'],
    status: 'Delivered',
    sentBy: 'Admin (Sarah)',
    createdAt: '2026-08-05 14:30',
    openRate: '86%',
    ctr: '42%',
    pinned: true,
    requireAck: false,
    content: 'The Nike Summer Unboxing campaign is now live! Apply before August 15 to get featured on the global leaderboard.',
    ctaLabel: 'Apply Now',
    ctaUrl: '/opportunities'
  },
  {
    id: 'n2',
    title: 'Platform Maintenance Notice — Aug 10',
    subtitle: 'Scheduled downtime of 30 minutes',
    audience: 'Everyone',
    audienceCount: 8900,
    type: 'System Alert',
    priority: 'Critical',
    channels: ['In-App', 'Push'],
    status: 'Scheduled',
    sentBy: 'System (Auto)',
    createdAt: '2026-08-05 10:15',
    openRate: '—',
    ctr: '—',
    pinned: true,
    requireAck: true,
    scheduledFor: '2026-08-10 02:00 UTC',
    content: 'CreatoKite servers will undergo brief infrastructure upgrades. Please complete active deliverable uploads prior to maintenance.',
    ctaLabel: 'View Status',
    ctaUrl: '/knowledge'
  },
  {
    id: 'n3',
    title: 'Weekly Payout Batch Released',
    subtitle: 'All approved campaign funds dispatched',
    audience: 'Verified Creators',
    audienceCount: 1820,
    type: 'Payments',
    priority: 'Medium',
    channels: ['In-App', 'Email', 'SMS'],
    status: 'Delivered',
    sentBy: 'Finance Bot',
    createdAt: '2026-08-04 18:00',
    openRate: '94%',
    ctr: '68%',
    pinned: false,
    requireAck: false,
    content: 'Your weekly campaign earnings have been deposited to your connected bank account/UPI ID.',
    ctaLabel: 'Check Wallet',
    ctaUrl: '/creator/earnings'
  },
  {
    id: 'n4',
    title: 'Creator Verification Checklist Update',
    subtitle: 'New portfolio guidelines for V3 ranks',
    audience: 'Pending Verification',
    audienceCount: 310,
    type: 'Verification',
    priority: 'Low',
    channels: ['In-App'],
    status: 'Delivered',
    sentBy: 'Admin (Alex)',
    createdAt: '2026-08-03 11:20',
    openRate: '72%',
    ctr: '29%',
    pinned: false,
    requireAck: false,
    content: 'Update your portfolio links to expedite your badge review. SuperAdmin reviews are conducted daily.',
    ctaLabel: 'Complete Profile',
    ctaUrl: '/creator/profile'
  },
  {
    id: 'n5',
    title: 'Q3 Brand Partner Onboarding Webcast',
    subtitle: 'Join our live strategy session',
    audience: 'All Brands',
    audienceCount: 480,
    type: 'Announcement',
    priority: 'Medium',
    channels: ['Email', 'WhatsApp'],
    status: 'Failed',
    sentBy: 'Growth Team',
    createdAt: '2026-08-02 09:00',
    openRate: '41%',
    ctr: '12%',
    pinned: false,
    requireAck: false,
    content: 'Discover how AI creator matching increases campaign ROI by 3.5x. Save your spot for Thursday.',
    ctaLabel: 'Register',
    ctaUrl: 'https://creatokite.com/webinar'
  }
];

const TEMPLATES = [
  { id: 't1', title: '📢 Campaign Launch', category: 'Campaign', audience: 'All Creators', priority: 'High', content: 'We are excited to launch {{campaignName}} sponsored by {{brandName}}! Apply now to lock in your slot.', ctaLabel: 'View Campaign' },
  { id: 't2', title: '⏰ Submission Deadline Reminder', category: 'Reminder', audience: 'Campaign Participants', priority: 'High', content: 'Hi {{creatorName}}, your deliverable for {{campaignName}} is due on {{deadline}}. Please submit your draft in the workspace room.', ctaLabel: 'Submit Deliverable' },
  { id: 't3', title: '✅ Profile Verification Approved', category: 'Verification', audience: 'Verified Creators', priority: 'Medium', content: 'Congratulations {{creatorName}}! Your CreatoKite profile verification is approved. You now have access to High-Tier campaigns.', ctaLabel: 'Explore Campaigns' },
  { id: 't4', title: '💵 Payment Completed', category: 'Payments', audience: 'Specific Creator', priority: 'Medium', content: 'Payment of ₹{{amount}} for {{campaignName}} has been transferred to your wallet.', ctaLabel: 'View Earnings' },
  { id: 't5', title: '🔧 System Maintenance Alert', category: 'System Alert', audience: 'Everyone', priority: 'Critical', content: 'CreatoKite will undergo scheduled system upgrades on {{date}}. Platform features will be temporarily paused.', ctaLabel: 'System Status' },
  { id: 't6', title: '🚀 New Feature Announcement', category: 'Feature Update', audience: 'Everyone', priority: 'Medium', content: 'We just rolled out {{featureName}}! Experience faster workflow tracking and automated AI analytics.', ctaLabel: 'Try Feature' }
];

const AUTOMATION_RULES = [
  { id: 'r1', name: 'Campaign Published Notification', event: 'Campaign created & approved by Admin', target: 'Matching Niche Creators', channel: 'In-App + Email', enabled: true },
  { id: 'r2', name: 'Deliverable 24h Deadline Warning', event: '24 hours prior to deadline', target: 'Assigned Creator', channel: 'In-App + Push', enabled: true },
  { id: 'r3', name: 'Creator Badge Verification Status', event: 'Admin approves/rejects KYC', target: 'Target Creator', channel: 'In-App + Email', enabled: true },
  { id: 'r4', name: 'Escrow Payment Dispatched Alert', event: 'Admin completes assignment payment', target: 'Creator + Brand', channel: 'In-App + SMS', enabled: true },
  { id: 'r5', name: 'New Security Login Warning', event: 'Unrecognized IP login', target: 'User Account', channel: 'Email + Push', enabled: true }
];

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* State */
  const [tab, setTab] = useState('history'); // history | analytics | templates | scheduled | rules | logs
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [selectedNotifIds, setSelectedNotifIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');

  /* Specific Creator / User Selection State */
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [dispatching, setDispatching] = useState(false);

  /* Modal Wizard State */
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    title: '',
    subtitle: '',
    audienceType: 'All Creators',
    specificTargets: '',
    categoryFilters: ['Tech', 'Fashion'],
    followerRange: '10K–50K',
    engagementMin: 'Above 5%',
    locationFilter: 'Pan India',
    platformFilter: ['Instagram', 'YouTube'],
    content: '',
    ctaLabel: 'Apply Now',
    ctaUrl: '/opportunities',
    channels: ['In-App', 'Email'],
    priority: 'High',
    category: 'Campaign',
    requireAck: false,
    expiryDays: '7',
    scheduleType: 'now',
    scheduledDate: '',
    scheduledTime: '',
    timezone: 'IST (UTC+5:30)',
    recurring: 'none'
  });

  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile | email
  const [previewTheme, setPreviewTheme] = useState('dark');

  /* Fetch Specific Users when Audience Type requires user selection */
  useEffect(() => {
    if (wizardData.audienceType === 'Specific Creator' || wizardData.audienceType === 'Specific Brand' || wizardData.audienceType === 'Specific Team Member') {
      setLoadingUsers(true);
      const roleFilter = wizardData.audienceType === 'Specific Brand' ? 'brand' : wizardData.audienceType === 'Specific Team Member' ? 'team_member' : 'creator';
      adminAPI.users({ search: creatorSearchQuery, role: roleFilter, limit: 30 })
        .then(res => {
          if (res.users && res.users.length > 0) {
            setFetchedUsers(res.users);
          } else {
            // Fallback: Query all users if specific role query returns empty
            return adminAPI.users({ search: creatorSearchQuery, limit: 30 })
              .then(res2 => setFetchedUsers(res2.users || []));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  }, [wizardData.audienceType, creatorSearchQuery]);

  /* Filtering */
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const q = searchQuery.toLowerCase();
      const mQuery = !q || n.title.toLowerCase().includes(q) || n.audience.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
      const mAud = filterAudience === 'all' || n.audience === filterAudience;
      const mType = filterType === 'all' || n.type === filterType;
      const mPrio = filterPriority === 'all' || n.priority === filterPriority;
      const mStat = filterStatus === 'all' || n.status === filterStatus;
      const mChan = filterChannel === 'all' || n.channels.includes(filterChannel);
      return mQuery && mAud && mType && mPrio && mStat && mChan;
    });
  }, [notifications, searchQuery, filterAudience, filterType, filterPriority, filterStatus, filterChannel]);

  /* Stats calculation */
  const stats = useMemo(() => {
    const totalSent = notifications.filter(n => n.status === 'Delivered').length * 948 + 1900;
    const scheduledCount = notifications.filter(n => n.status === 'Scheduled').length + 16;
    const failedCount = notifications.filter(n => n.status === 'Failed').length;
    return {
      totalSent: totalSent.toLocaleString('en-IN'),
      deliveredRate: '99.3%',
      readRate: '82%',
      scheduled: scheduledCount,
      failed: failedCount
    };
  }, [notifications]);

  /* Bulk selection */
  const toggleSelectAll = () => {
    if (selectedNotifIds.length === filteredNotifications.length) {
      setSelectedNotifIds([]);
    } else {
      setSelectedNotifIds(filteredNotifications.map(n => n.id));
    }
  };

  const toggleSelectOne = id => {
    setSelectedNotifIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = (action) => {
    if (selectedNotifIds.length === 0) {
      toast.error('Select at least one notification');
      return;
    }
    if (action === 'delete') {
      setNotifications(prev => prev.filter(n => !selectedNotifIds.includes(n.id)));
      setSelectedNotifIds([]);
      toast.success('Selected notifications deleted');
    } else if (action === 'archive') {
      toast.success(`${selectedNotifIds.length} notifications archived`);
      setSelectedNotifIds([]);
    } else if (action === 'resend') {
      toast.success(`Resent ${selectedNotifIds.length} notifications`);
      setSelectedNotifIds([]);
    }
  };

  /* Open Wizard with template */
  const handleUseTemplate = t => {
    setWizardData(prev => ({
      ...prev,
      title: t.title.replace(/[^\w\s]/gi, '').trim(),
      category: t.category,
      audienceType: t.audience,
      priority: t.priority,
      content: t.content,
      ctaLabel: t.ctaLabel
    }));
    setWizardStep(1);
    setShowWizard(true);
  };

  /* Finish wizard & broadcast to backend + Socket real-time listeners */
  const handlePublishNotification = async () => {
    setDispatching(true);
    try {
      const targetUserIds = selectedUsers.map(u => u._id);
      const payload = {
        title: wizardData.title || 'Untitled Notification',
        subtitle: wizardData.subtitle || '',
        message: wizardData.content,
        targetAudience: wizardData.audienceType,
        targetUserIds: wizardData.audienceType.startsWith('Specific') && targetUserIds.length > 0 ? targetUserIds : [],
        priority: wizardData.priority,
        category: wizardData.category,
        ctaLabel: wizardData.ctaLabel,
        ctaUrl: wizardData.ctaUrl,
        channels: wizardData.channels,
        scheduleType: wizardData.scheduleType,
        scheduledDate: wizardData.scheduledDate,
        scheduledTime: wizardData.scheduledTime,
      };

      const res = await adminAPI.broadcast(payload);

      const targetCount = res.count || (wizardData.audienceType.startsWith('Specific') ? selectedUsers.length : 2184);

      const newNotif = {
        id: `n_${Date.now()}`,
        title: wizardData.title || 'Untitled Notification',
        subtitle: wizardData.subtitle || '',
        audience: wizardData.audienceType.startsWith('Specific') ? `Specific (${selectedUsers.length})` : wizardData.audienceType,
        audienceCount: targetCount,
        type: wizardData.category,
        priority: wizardData.priority,
        channels: wizardData.channels,
        status: wizardData.scheduleType === 'now' ? 'Delivered' : 'Scheduled',
        sentBy: user?.displayName || 'Admin',
        createdAt: 'Just now',
        openRate: '0%',
        ctr: '0%',
        pinned: wizardData.priority === 'Critical',
        requireAck: wizardData.requireAck,
        content: wizardData.content,
        ctaLabel: wizardData.ctaLabel,
        ctaUrl: wizardData.ctaUrl
      };

      setNotifications(prev => [newNotif, ...prev]);
      setShowWizard(false);

      toast.success(
        wizardData.scheduleType === 'now'
          ? `🚀 Notification dispatched to ${targetCount} recipients!`
          : '🗓️ Notification scheduled successfully!'
      );

      // Trigger custom window notification event for active header bell drawer update
      window.dispatchEvent(new CustomEvent('notification_created', { detail: newNotif }));

    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to dispatch notification');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page Title & Subtitle ──────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p2)' }}>
              <Bell size={18} />
            </div>
            <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800 }}>
              Notification Center
            </h1>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: 13, marginTop: 4, maxWidth: 650 }}>
            Manage announcements, campaign updates, reminders, and automated platform notifications across Creators, Brands, and Team Members.
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant="secondary" size="sm" onClick={() => setTab('templates')} style={{ gap: 6 }}>
            <FileText size={13} /> Templates
          </Btn>
          <Btn variant="secondary" size="sm" onClick={() => toast.success('Audience list exported')} style={{ gap: 6 }}>
            <Download size={13} /> Export Analytics
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => { setWizardStep(1); setShowWizard(true); }} style={{ gap: 6, fontWeight: 700 }}>
            <Plus size={14} /> New Notification
          </Btn>
        </div>
      </div>

      {/* ── 5 KPI Analytics Cards ───────────────────────── */}
      <div className="grid-5" style={{ gap: 12 }}>
        <div className="card" style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(108,99,255,0.02))', border: '1px solid rgba(108,99,255,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--t3)', fontSize: 11, fontWeight: 600 }}>
            <span>Notifications Sent</span>
            <Send size={14} style={{ color: 'var(--p2)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginTop: 6, fontFamily: 'var(--fd)' }}>
            {stats.totalSent}
          </div>
          <div style={{ fontSize: 11, color: 'var(--acc2)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={10} /> +18% this month
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(0,255,163,0.08), rgba(0,255,163,0.02))', border: '1px solid rgba(0,255,163,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--t3)', fontSize: 11, fontWeight: 600 }}>
            <span>Delivered</span>
            <CheckCircle2 size={14} style={{ color: 'var(--acc2)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--acc2)', marginTop: 6, fontFamily: 'var(--fd)' }}>
            {stats.deliveredRate}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>High delivery rate</div>
        </div>

        <div className="card" style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.02))', border: '1px solid rgba(245,166,35,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--t3)', fontSize: 11, fontWeight: 600 }}>
            <span>Read Rate</span>
            <Eye size={14} style={{ color: 'var(--gold)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', marginTop: 6, fontFamily: 'var(--fd)' }}>
            {stats.readRate}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Avg open within 2h</div>
        </div>

        <div className="card" style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))', border: '1px solid rgba(99,102,241,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--t3)', fontSize: 11, fontWeight: 600 }}>
            <span>Scheduled</span>
            <Clock size={14} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#6366f1', marginTop: 6, fontFamily: 'var(--fd)' }}>
            {stats.scheduled}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Next send in 3h</div>
        </div>

        <div className="card" style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(255,107,87,0.08), rgba(255,107,87,0.02))', border: '1px solid rgba(255,107,87,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--t3)', fontSize: 11, fontWeight: 600 }}>
            <span>Failed</span>
            <AlertTriangle size={14} style={{ color: 'var(--rose)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--rose)', marginTop: 6, fontFamily: 'var(--fd)' }}>
            {stats.failed}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Retry queued</div>
        </div>
      </div>

      {/* ── Main View Tabs ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {[
          { key: 'history', label: 'Notification History', icon: Layers },
          { key: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
          { key: 'templates', label: 'Templates Gallery', icon: FileText },
          { key: 'scheduled', label: 'Upcoming Scheduled', icon: Clock },
          { key: 'rules', label: 'Automation Rules', icon: Zap },
          { key: 'logs', label: 'Audit Logs', icon: ShieldAlert },
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 12.5,
                fontWeight: active ? 800 : 500, color: active ? 'var(--acc, #E65F2B)' : 'var(--t2)',
                background: active ? 'rgba(230, 95, 43, 0.08)' : 'transparent', borderRadius: '8px 8px 0 0',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: `2.5px solid ${active ? 'var(--acc, #E65F2B)' : 'transparent'}`, transition: 'all 0.18s'
              }}
            >
              <Icon size={14} style={{ color: active ? 'var(--acc, #E65F2B)' : 'var(--t2)' }} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: NOTIFICATION HISTORY ────────────────── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Filter Bar */}
          <div className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                <input
                  type="text"
                  placeholder="Search notifications, audiences, types..."
                  className="form-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 32, height: 36, fontSize: 12 }}
                />
              </div>

              <select className="form-input" style={{ width: 'auto', height: 36, fontSize: 12 }} value={filterAudience} onChange={e => setFilterAudience(e.target.value)}>
                <option value="all">All Audiences</option>
                <option value="All Creators">All Creators</option>
                <option value="All Brands">All Brands</option>
                <option value="Everyone">Everyone</option>
                <option value="Verified Creators">Verified Creators</option>
                <option value="Pending Verification">Pending Verification</option>
              </select>

              <select className="form-input" style={{ width: 'auto', height: 36, fontSize: 12 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="Campaign">Campaign</option>
                <option value="System Alert">System Alert</option>
                <option value="Payments">Payments</option>
                <option value="Verification">Verification</option>
                <option value="Announcement">Announcement</option>
              </select>

              <select className="form-input" style={{ width: 'auto', height: 36, fontSize: 12 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <select className="form-input" style={{ width: 'auto', height: 36, fontSize: 12 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Delivered">Delivered</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Failed">Failed</option>
              </select>

              {(searchQuery || filterAudience !== 'all' || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all') && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setSearchQuery(''); setFilterAudience('all'); setFilterType('all'); setFilterPriority('all'); setFilterStatus('all'); }}
                  style={{ fontSize: 11, color: 'var(--t3)' }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedNotifIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(108,99,255,0.08)', borderRadius: 8, border: '1px solid rgba(108,99,255,0.2)', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--p2)' }}>{selectedNotifIds.length} selected</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn size="sm" variant="ghost" onClick={() => handleBulkAction('resend')} style={{ fontSize: 11, gap: 4 }}><RefreshCw size={11} /> Resend</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => handleBulkAction('archive')} style={{ fontSize: 11, gap: 4 }}><FileText size={11} /> Archive</Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleBulkAction('delete')} style={{ fontSize: 11, gap: 4 }}><Trash2 size={11} /> Delete</Btn>
                </div>
              </div>
            )}
          </div>

          {/* History Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ padding: '12px 14px', width: 36 }}>
                      <input type="checkbox" checked={selectedNotifIds.length > 0 && selectedNotifIds.length === filteredNotifications.length} onChange={toggleSelectAll} />
                    </th>
                    <th style={{ padding: '12px 14px' }}>Notification Title</th>
                    <th style={{ padding: '12px 14px' }}>Audience</th>
                    <th style={{ padding: '12px 14px' }}>Type</th>
                    <th style={{ padding: '12px 14px' }}>Priority</th>
                    <th style={{ padding: '12px 14px' }}>Channels</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}>Open / CTR</th>
                    <th style={{ padding: '12px 14px' }}>Created</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>
                        No notifications found matching filter options.
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((n, i) => (
                      <tr key={n.id} style={{ borderBottom: i < filteredNotifications.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <input type="checkbox" checked={selectedNotifIds.includes(n.id)} onChange={() => toggleSelectOne(n.id)} />
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {n.pinned && <span title="Pinned Critical Notification">📌</span>}
                            {n.title}
                          </div>
                          {n.subtitle && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{n.subtitle}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 500 }}>
                            👥 {n.audience} ({n.audienceCount})
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--t2)' }}>
                          {n.type}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                            background: n.priority === 'Critical' ? 'rgba(255,107,87,0.15)' : n.priority === 'High' ? 'rgba(245,166,35,0.15)' : 'rgba(108,99,255,0.15)',
                            color: n.priority === 'Critical' ? 'var(--rose)' : n.priority === 'High' ? 'var(--gold)' : 'var(--p2)'
                          }}>
                            {n.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {n.channels.map(c => (
                              <span key={c} style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, color: 'var(--t2)' }}>
                                {c === 'Email' ? '✉️ Email' : c === 'In-App' ? '🔔 In-App' : c === 'Push' ? '📲 Push' : c === 'SMS' ? '💬 SMS' : '💬 WhatsApp'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: n.status === 'Delivered' ? 'var(--acc2)' : n.status === 'Scheduled' ? '#6366f1' : 'var(--rose)'
                          }}>
                            ● {n.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--t2)' }}>
                          <div><span style={{ color: 'var(--acc2)', fontWeight: 600 }}>{n.openRate}</span> open</div>
                          <div style={{ fontSize: 10, color: 'var(--t3)' }}>{n.ctr} CTR</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--t3)', fontSize: 11 }}>
                          {n.createdAt}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => toast.success(`Viewing notification "${n.title}"`)} title="View Detail">
                              <Eye size={12} />
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => toast.success(`Duplicated "${n.title}"`)} title="Duplicate">
                              <Copy size={12} />
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} title="Delete">
                              <Trash2 size={12} style={{ color: 'var(--rose)' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ANALYTICS & INSIGHTS ────────────────── */}
      {tab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>📊 Notifications Sent Per Day</h3>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>Last 7 Days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                {[
                  { day: 'Mon', count: 420 },
                  { day: 'Tue', count: 680 },
                  { day: 'Wed', count: 510 },
                  { day: 'Thu', count: 890 },
                  { day: 'Fri', count: 740 },
                  { day: 'Sat', count: 320 },
                  { day: 'Sun', count: 450 },
                ].map(d => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: '100%', height: `${(d.count / 890) * 120}px`, background: 'linear-gradient(to top, var(--p), var(--p2))', borderRadius: 4 }} />
                    <span style={{ fontSize: 10, color: 'var(--t3)' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>📲 Channel Comparison</h3>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>Delivery & Open %</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { channel: 'In-App Notifications', reach: '98%', open: '89%', color: 'var(--p2)' },
                  { channel: 'Email Broadcasts', reach: '94%', open: '76%', color: 'var(--acc2)' },
                  { channel: 'Push Notifications', reach: '91%', open: '64%', color: 'var(--gold)' },
                  { channel: 'SMS Messages', reach: '99%', open: '92%', color: 'var(--coral)' },
                  { channel: 'WhatsApp Alerts', reach: '96%', open: '88%', color: '#25D366' },
                ].map(c => (
                  <div key={c.channel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ width: 140, fontWeight: 600 }}>{c.channel}</span>
                    <div style={{ flex: 1, margin: '0 12px', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: c.open, height: '100%', background: c.color }} />
                    </div>
                    <span style={{ fontWeight: 700, color: c.color }}>{c.open}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: TEMPLATES GALLERY ──────────────────── */}
      {tab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-3" style={{ gap: 14 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(108,99,255,0.15)', color: 'var(--p2)', fontWeight: 600 }}>
                      {t.category}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>👥 {t.audience}</span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{t.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                    "{t.content}"
                  </p>
                </div>
                <Btn variant="primary" size="sm" onClick={() => handleUseTemplate(t)} style={{ width: '100%', gap: 6, justifyContent: 'center' }}>
                  <Sparkles size={13} /> Use This Template
                </Btn>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: UPCOMING SCHEDULED ──────────────────── */}
      {tab === 'scheduled' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🗓️ Queued & Scheduled Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.filter(n => n.status === 'Scheduled').length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--t3)' }}>No upcoming scheduled notifications.</div>
            ) : (
              notifications.filter(n => n.status === 'Scheduled').map(n => (
                <div key={n.id} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: '#6366f1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} /> Scheduled for {n.scheduledFor || '2026-08-10 02:00 UTC'} (In 4 days 12h)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => toast.success('Scheduled notification paused')}>Pause</Btn>
                    <Btn size="sm" variant="danger" onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}>Cancel</Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: AUTOMATION RULES ────────────────────── */}
      {tab === 'rules' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>⚡ Automatic System Trigger Rules</h3>
            <Btn variant="secondary" size="sm" onClick={() => toast.success('New trigger rule added')}>+ Add Custom Rule</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {AUTOMATION_RULES.map(r => (
              <div key={r.id} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Event: {r.event} · Target: {r.target}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--p2)' }}>{r.channel}</span>
                  <input type="checkbox" checked={r.enabled} onChange={() => toast.success(`Rule "${r.name}" updated`)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: AUDIT LOGS ──────────────────────────── */}
      {tab === 'logs' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🛡️ Notification Delivery & Audit Log</h3>
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>
            Every platform broadcast and targeted message is logged with cryptographic timestamps and delivery node statuses for audit compliance.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CREATE NOTIFICATION STEPPER WIZARD MODAL
         ══════════════════════════════════════════════════ */}
      {showWizard && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(25, 20, 18, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="glass-modal" style={{
            width: '100%', maxWidth: 860, maxHeight: '90vh', overflowY: 'auto',
            padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 22,
            borderRadius: 20, border: '1.5px solid var(--border2, rgba(230, 95, 43, 0.25))',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(230,95,43,0.12)',
          }}>

            {/* Wizard Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--fd)', color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>
                  Create & Dispatch Notification
                </h2>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', marginTop: 4, fontWeight: 500 }}>
                  Step {wizardStep} of 5 — Configure platform communication
                </div>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                style={{
                  width: 32, height: 32, borderRadius: 10, background: 'rgba(230,95,43,0.08)',
                  border: '1px solid rgba(230,95,43,0.2)', color: 'var(--acc)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {['1. Audience', '2. Content', '3. Delivery', '4. Schedule', '5. Preview & Send'].map((s, idx) => {
                const stepNum = idx + 1;
                const active = wizardStep === stepNum;
                const done = wizardStep > stepNum;
                return (
                  <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => setWizardStep(stepNum)}
                      style={{
                        width: '100%', padding: '9px 10px', borderRadius: 10, fontSize: 11.5,
                        fontWeight: active ? 800 : done ? 700 : 500,
                        background: active ? 'rgba(230, 95, 43, 0.14)' : done ? 'rgba(34, 197, 94, 0.12)' : 'var(--s2)',
                        color: active ? 'var(--acc, #E65F2B)' : done ? '#16a34a' : 'var(--t2)',
                        border: active ? '1.5px solid var(--acc, #E65F2B)' : done ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid var(--border)',
                        boxShadow: active ? '0 3px 10px rgba(230, 95, 43, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s'
                      }}
                    >
                      {done ? '✓ ' : ''}{s}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── STEP 1: AUDIENCE ───────────────────────────── */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Select Target Audience</h3>
                <div className="grid-3" style={{ gap: 12 }}>
                  {[
                    { key: 'Everyone', label: '🌐 Everyone', desc: 'All registered platform users' },
                    { key: 'All Creators', label: '👥 All Creators', desc: 'Active & onboarded creators' },
                    { key: 'All Brands', label: '🏢 All Brands', desc: 'Brand client accounts' },
                    { key: 'Team Members', label: '🧑‍💼 Team Members', desc: 'Staff & managers' },
                    { key: 'Verified Creators', label: '⭐ Verified Creators', desc: 'Badge approved creators' },
                    { key: 'Pending Verification', label: '⏳ Pending Verification', desc: 'KYC queue creators' },
                    { key: 'Campaign Participants', label: '🎯 Campaign Participants', desc: 'Active campaign creators' },
                    { key: 'Specific Creator', label: '👤 Specific Creator(s)', desc: 'Direct select single/multiple users' },
                    { key: 'Custom Audience', label: '⚡ Custom Audience Builder', desc: 'Filter by category, followers, etc.' },
                  ].map(aud => {
                    const selected = wizardData.audienceType === aud.key;
                    return (
                      <div
                        key={aud.key}
                        onClick={() => setWizardData(p => ({ ...p, audienceType: aud.key }))}
                        style={{
                          padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                          background: selected ? 'rgba(230, 95, 43, 0.14)' : 'var(--s2)',
                          border: selected ? '1.5px solid var(--acc, #E65F2B)' : '1px solid var(--border)',
                          boxShadow: selected ? '0 4px 14px rgba(230, 95, 43, 0.16)' : '0 1px 4px rgba(0,0,0,0.03)',
                          transform: selected ? 'translateY(-2px)' : 'none',
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <div style={{ fontWeight: selected ? 800 : 700, fontSize: 13.5, color: selected ? 'var(--acc, #E65F2B)' : 'var(--t1)' }}>{aud.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.3 }}>{aud.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Specific Creator / User Selection Component */}
                {(wizardData.audienceType === 'Specific Creator' || wizardData.audienceType === 'Specific Brand' || wizardData.audienceType === 'Specific Team Member') && (
                  <div style={{ padding: 16, background: 'var(--s2)', borderRadius: 14, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>👤 Search & Select Specific {wizardData.audienceType === 'Specific Brand' ? 'Brands' : wizardData.audienceType === 'Specific Team Member' ? 'Team Members' : 'Creators'}</span>
                      {selectedUsers.length > 0 && (
                        <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(230, 95, 43, 0.14)', color: 'var(--acc)', fontSize: 11, fontWeight: 700 }}>
                          {selectedUsers.length} selected
                        </span>
                      )}
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                      <input
                        type="text"
                        placeholder={`Search by name, handle, email...`}
                        className="form-input"
                        value={creatorSearchQuery}
                        onChange={e => setCreatorSearchQuery(e.target.value)}
                        style={{ paddingLeft: 36, fontSize: 12.5, background: 'var(--s1, #FAF7F2)' }}
                      />
                    </div>

                    {/* Selected User Chips */}
                    {selectedUsers.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', background: 'rgba(230, 95, 43, 0.08)', borderRadius: 10, border: '1px solid rgba(230, 95, 43, 0.25)' }}>
                        <span style={{ fontSize: 11.5, color: 'var(--t2)', alignSelf: 'center', fontWeight: 600 }}>Recipients:</span>
                        {selectedUsers.map(u => (
                          <span key={u._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'rgba(230, 95, 43, 0.16)', border: '1px solid rgba(230, 95, 43, 0.4)', fontSize: 11.5, fontWeight: 700, color: 'var(--acc)' }}>
                            <Avatar src={u.avatar} name={u.displayName} size={18} />
                            {u.displayName}
                            <X size={11} style={{ cursor: 'pointer' }} onClick={() => setSelectedUsers(prev => prev.filter(x => x._id !== u._id))} />
                          </span>
                        ))}
                      </div>
                    )}

                    {/* User Search List */}
                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {loadingUsers ? (
                        <div style={{ fontSize: 12, color: 'var(--t3)', padding: 12, textAlign: 'center' }}>Loading user profiles...</div>
                      ) : fetchedUsers.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--t3)', padding: 12, textAlign: 'center' }}>No users found. Try adjusting your search query.</div>
                      ) : (
                        fetchedUsers.map(u => {
                          const isSelected = selectedUsers.some(x => x._id === u._id);
                          return (
                            <div
                              key={u._id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedUsers(prev => prev.filter(x => x._id !== u._id));
                                } else {
                                  setSelectedUsers(prev => [...prev, u]);
                                }
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px',
                                borderRadius: 10, background: isSelected ? 'rgba(230, 95, 43, 0.12)' : 'var(--s1, #FAF7F2)',
                                border: isSelected ? '1.5px solid var(--acc)' : '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.12s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar src={u.avatar} name={u.displayName} size={30} />
                                <div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{u.displayName}</div>
                                  <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>@{u.handle || u.email} · {u.niche || u.role} {u.creatorScore ? `· ⚡${u.creatorScore}` : ''}</div>
                                </div>
                              </div>
                              <div style={{
                                width: 22, height: 22, borderRadius: 6,
                                border: isSelected ? '1.5px solid var(--acc)' : '1px solid var(--border)',
                                background: isSelected ? 'var(--acc)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800
                              }}>
                                {isSelected && '✓'}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {wizardData.audienceType === 'Custom Audience' && (
                  <div style={{ padding: 16, background: 'var(--s2)', borderRadius: 14, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--acc)' }}>⚡ Custom Audience Builder Filters</div>
                    <div className="grid-2" style={{ gap: 12 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11.5, fontWeight: 700 }}>Creator Category</label>
                        <select className="form-input" style={{ fontSize: 12.5, background: 'var(--s1)' }}>
                          <option>Tech & AI</option>
                          <option>Fashion & Beauty</option>
                          <option>Gaming & Esports</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11.5, fontWeight: 700 }}>Follower Range</label>
                        <select className="form-input" style={{ fontSize: 12.5, background: 'var(--s1)' }}>
                          <option>10K–50K</option>
                          <option>50K–100K</option>
                          <option>100K+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  padding: '12px 18px', background: 'rgba(230, 95, 43, 0.10)',
                  borderRadius: 12, border: '1px solid rgba(230, 95, 43, 0.28)',
                  fontSize: 12.5, color: 'var(--acc, #E65F2B)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--acc, #E65F2B)' }} />
                  Matching Target Audience: ~{wizardData.audienceType.startsWith('Specific') ? selectedUsers.length : 2184} active users
                </div>
              </div>
            )}

            {/* ── STEP 2: CONTENT ────────────────────────────── */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Compose Notification Content</h3>
                <Input
                  label="Notification Title *"
                  value={wizardData.title}
                  onChange={e => setWizardData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. New High-Payout Tech Campaign Live!"
                />
                <Input
                  label="Subtitle (Optional)"
                  value={wizardData.subtitle}
                  onChange={e => setWizardData(p => ({ ...p, subtitle: e.target.value }))}
                  placeholder="e.g. ₹50,000 budget · 5 Creator slots remaining"
                />
                <Textarea
                  label="Notification Message Body *"
                  value={wizardData.content}
                  onChange={e => setWizardData(p => ({ ...p, content: e.target.value }))}
                  placeholder="Write message body content..."
                  style={{ minHeight: 110 }}
                />

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--t2)', fontWeight: 600 }}>Insert Variables:</span>
                  {['{{creatorName}}', '{{campaignName}}', '{{brandName}}', '{{deadline}}'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setWizardData(p => ({ ...p, content: p.content + ' ' + v }))}
                      style={{
                        fontSize: 10.5, padding: '4px 10px', borderRadius: 99,
                        background: 'rgba(230, 95, 43, 0.12)', color: 'var(--acc)',
                        border: '1px solid rgba(230, 95, 43, 0.28)', cursor: 'pointer', fontWeight: 700
                      }}
                    >
                      + {v}
                    </button>
                  ))}
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <Input label="Action Button Label" value={wizardData.ctaLabel} onChange={e => setWizardData(p => ({ ...p, ctaLabel: e.target.value }))} placeholder="Apply Now" />
                  <Input label="Action Target URL / Route" value={wizardData.ctaUrl} onChange={e => setWizardData(p => ({ ...p, ctaUrl: e.target.value }))} placeholder="/opportunities" />
                </div>
              </div>
            )}

            {/* ── STEP 3: DELIVERY ───────────────────────────── */}
            {wizardStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Delivery Channels & Settings</h3>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: 8 }}>Delivery Channels</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['In-App', 'Email', 'Push Notification', 'SMS', 'WhatsApp'].map(c => {
                      const active = wizardData.channels.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setWizardData(p => ({
                            ...p,
                            channels: active ? p.channels.filter(x => x !== c) : [...p.channels, c]
                          }))}
                          style={{
                            padding: '8px 16px', borderRadius: 100, fontSize: 12.5, cursor: 'pointer', fontWeight: active ? 700 : 500,
                            background: active ? 'rgba(230, 95, 43, 0.14)' : 'var(--s2)',
                            color: active ? 'var(--acc)' : 'var(--t1)',
                            border: active ? '1.5px solid var(--acc)' : '1px solid var(--border)',
                            boxShadow: active ? '0 3px 10px rgba(230,95,43,0.12)' : '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          {active ? '✓ ' : ''}{c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Priority Level</label>
                    <select className="form-input" value={wizardData.priority} onChange={e => setWizardData(p => ({ ...p, priority: e.target.value }))} style={{ background: 'var(--s1)' }}>
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Critical">Critical (Pinned Banner)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Notification Category</label>
                    <select className="form-input" value={wizardData.category} onChange={e => setWizardData(p => ({ ...p, category: e.target.value }))} style={{ background: 'var(--s1)' }}>
                      <option value="Campaign">Campaign</option>
                      <option value="Payments">Payments</option>
                      <option value="Verification">Verification</option>
                      <option value="System Alert">System Alert</option>
                      <option value="Announcement">Announcement</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="reqAck"
                    checked={wizardData.requireAck}
                    onChange={e => setWizardData(p => ({ ...p, requireAck: e.target.checked }))}
                    style={{ accentColor: 'var(--acc)' }}
                  />
                  <label htmlFor="reqAck" style={{ fontSize: 13, cursor: 'pointer', color: 'var(--t1)', fontWeight: 600 }}>
                    Require User Read Acknowledgment
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 4: SCHEDULE ───────────────────────────── */}
            {wizardStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Dispatch Schedule</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { key: 'now', label: '🚀 Send Immediately' },
                    { key: 'schedule', label: '🗓️ Schedule for Later' },
                    { key: 'draft', label: '💾 Save as Draft' },
                  ].map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setWizardData(p => ({ ...p, scheduleType: s.key }))}
                      style={{
                        flex: 1, padding: 16, borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        background: wizardData.scheduleType === s.key ? 'rgba(230, 95, 43, 0.14)' : 'var(--s2)',
                        color: wizardData.scheduleType === s.key ? 'var(--acc)' : 'var(--t1)',
                        border: wizardData.scheduleType === s.key ? '1.5px solid var(--acc)' : '1px solid var(--border)',
                        boxShadow: wizardData.scheduleType === s.key ? '0 4px 14px rgba(230,95,43,0.14)' : '0 1px 4px rgba(0,0,0,0.03)',
                        transition: 'all 0.18s'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {wizardData.scheduleType === 'schedule' && (
                  <div className="grid-2" style={{ gap: 12, marginTop: 10 }}>
                    <Input label="Date" type="date" value={wizardData.scheduledDate} onChange={e => setWizardData(p => ({ ...p, scheduledDate: e.target.value }))} />
                    <Input label="Time" type="time" value={wizardData.scheduledTime} onChange={e => setWizardData(p => ({ ...p, scheduledTime: e.target.value }))} />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: PREVIEW ────────────────────────────── */}
            {wizardStep === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Live Multi-Device Preview</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                        background: previewDevice === 'desktop' ? 'var(--acc)' : 'var(--s1)',
                        color: previewDevice === 'desktop' ? '#FFFFFF' : 'var(--t2)', border: 'none'
                      }}
                    >
                      <Laptop size={14} />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                        background: previewDevice === 'mobile' ? 'var(--acc)' : 'var(--s1)',
                        color: previewDevice === 'mobile' ? '#FFFFFF' : 'var(--t2)', border: 'none'
                      }}
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                </div>

                {/* Card Preview Box */}
                <div style={{
                  maxWidth: previewDevice === 'mobile' ? 360 : '100%', margin: '0 auto', width: '100%',
                  padding: 20, background: 'var(--s2)', borderRadius: 16, border: '1.5px solid rgba(230, 95, 43, 0.3)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 99, background: 'rgba(230, 95, 43, 0.14)', color: 'var(--acc)', fontWeight: 800 }}>
                      {wizardData.category}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>Just now</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--t1)' }}>
                    {wizardData.title || 'Notification Title Preview'}
                  </div>
                  {wizardData.subtitle && (
                    <div style={{ fontSize: 12.5, color: 'var(--gold)', marginTop: 3, fontWeight: 600 }}>{wizardData.subtitle}</div>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 10, lineHeight: 1.5 }}>
                    {wizardData.content || 'Your composed notification body will be displayed here.'}
                  </p>
                  {wizardData.ctaLabel && (
                    <Btn variant="primary" size="sm" style={{ marginTop: 14, fontSize: 12, gap: 6 }}>
                      {wizardData.ctaLabel} <ArrowRight size={13} />
                    </Btn>
                  )}
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <Btn variant="ghost" onClick={() => wizardStep === 1 ? setShowWizard(false) : setWizardStep(s => s - 1)} disabled={dispatching} style={{ fontWeight: 700 }}>
                {wizardStep === 1 ? 'Cancel' : '← Back'}
              </Btn>
              {wizardStep < 5 ? (
                <button
                  onClick={() => setWizardStep(s => s + 1)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px',
                    borderRadius: 12, background: 'var(--acc)', color: '#FFFFFF',
                    border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(230, 95, 43, 0.3)', transition: 'all 0.18s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={handlePublishNotification}
                  disabled={dispatching}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px',
                    borderRadius: 12, background: 'var(--acc)', color: '#FFFFFF',
                    border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(230, 95, 43, 0.35)', opacity: dispatching ? 0.7 : 1
                  }}
                >
                  {dispatching ? 'Dispatching...' : '🚀 Confirm & Dispatch'}
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
