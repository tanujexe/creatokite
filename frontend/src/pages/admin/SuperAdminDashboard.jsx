import { useState, useEffect } from 'react';
import { ecosystemAPI, adminAPI } from '../../api';
import { PageLoader, Btn, StatCard, Avatar, Input, Textarea } from '../../components/ui';
import toast from 'react-hot-toast';
import { Shield, Coins, AlertOctagon, Settings, Database, Activity, FileText, Check, X, Plus, Search, Sparkles, ExternalLink, Award, Zap, CheckCircle2, XCircle, Trash2, Edit3, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SuperAdminDashboard({ initialTab = 'overview' }) {
  const { user } = useAuth();
  const isSuper = user?.role === 'superadmin';

  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control
  const [activeTab, setActiveTab] = useState(initialTab);

  // Activities state
  const [activities, setActivities] = useState([]);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actType, setActType] = useState('daily');
  const [actXp, setActXp] = useState('30');
  const [actCoins, setActCoins] = useState('10');
  const [actBadge, setActBadge] = useState('');
  const [actUrl, setActUrl] = useState('');
  const [actIsChallenge, setActIsChallenge] = useState(false);
  const [actIsActive, setActIsActive] = useState(true);
  const [savingActivity, setSavingActivity] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [actSearchQuery, setActSearchQuery] = useState('');
  const [actFilterCategory, setActFilterCategory] = useState('all');

  // Override form state
  const [overrideUserEmail, setOverrideUserEmail] = useState('');
  const [overrideXp, setOverrideXp] = useState('');
  const [overrideCoins, setOverrideCoins] = useState('');
  const [overrideRole, setOverrideRole] = useState('creator');
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [applyingOverride, setApplyingOverride] = useState(false);

  // Review states
  const [feedbackMap, setFeedbackMap] = useState({});
  const [ratingMap, setRatingMap] = useState({});
  const [xpMap, setXpMap] = useState({});
  const [coinsMap, setCoinsMap] = useState({});

  const fetchData = async () => {
    try {
      if (isSuper) {
        const [resStats, resSubs, resLogs] = await Promise.all([
          ecosystemAPI.getPlatformRevenue(),
          ecosystemAPI.getPendingSubmissions(),
          ecosystemAPI.getSystemLogs()
        ]);
        setStats(resStats.stats);
        setSubmissions(resSubs.submissions || []);
        setLogs(resLogs.logs || []);
      } else {
        const resSubs = await ecosystemAPI.getPendingSubmissions();
        setSubmissions(resSubs.submissions || []);
      }
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await ecosystemAPI.getActivities();
      setActivities(res.activities || []);
    } catch (e) {
      toast.error('Failed to load activities');
    }
  };

  useEffect(() => {
    fetchData();
    fetchActivities();
  }, []);

  const handleReview = async (subId, status) => {
    const feedback = feedbackMap[subId] || '';
    if (status === 'rejected' && !feedback) {
      toast.error('Please provide a feedback note for rejection');
      return;
    }
    const rating = ratingMap[subId] || 5;
    const customXp = xpMap[subId] !== undefined ? xpMap[subId] : '';
    const customCoins = coinsMap[subId] !== undefined ? coinsMap[subId] : '';

    try {
      await ecosystemAPI.reviewSubmission(subId, {
        status,
        adminFeedback: feedback,
        rating,
        customXp: customXp || undefined,
        customCoins: customCoins || undefined
      });
      toast.success(`Submission ${status} successfully!`);
      // Update local list
      setSubmissions(prev => prev.filter(s => s._id !== subId));
      fetchData(); // reload statistics
    } catch(e) {
      toast.error(e.response?.data?.message || 'Failed to review submission');
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideUserEmail) {
      toast.error('User email required');
      return;
    }
    setApplyingOverride(true);
    try {
      // Find user by email from all users first
      const usersRes = await adminAPI.users({ search: overrideUserEmail, limit: 1 });
      const target = usersRes.users?.[0];
      if (!target) {
        toast.error('User not found by that email');
        setApplyingOverride(false);
        return;
      }

      await ecosystemAPI.superadminOverride({
        userId: target._id,
        xp: overrideXp ? +overrideXp : undefined,
        coins: overrideCoins ? +overrideCoins : undefined,
        role: overrideRole || undefined,
        isBanned,
        banReason
      });

      toast.success(`Successfully updated override configs for ${target.displayName}!`);
      setOverrideUserEmail('');
      setOverrideXp('');
      setOverrideCoins('');
      setBanReason('');
      setIsBanned(false);
      fetchData();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Override error');
    } finally {
      setApplyingOverride(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await ecosystemAPI.deleteActivity(id);
      toast.success('Activity deleted successfully');
      fetchActivities();
    } catch (e) {
      toast.error('Failed to delete activity');
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!actTitle || !actDesc || !actType) {
      toast.error('Title, description, and type are required');
      return;
    }
    setSavingActivity(true);
    const data = {
      title: actTitle,
      description: actDesc,
      type: actType,
      xpReward: actXp ? +actXp : 30,
      coinReward: actCoins ? +actCoins : 10,
      badgeReward: actBadge,
      targetUrl: actUrl,
      isChallenge: actIsChallenge,
      isActive: actIsActive
    };
    try {
      if (editingActivityId) {
        await ecosystemAPI.updateActivity(editingActivityId, data);
        toast.success('Activity updated successfully!');
      } else {
        await ecosystemAPI.createActivity(data);
        toast.success('Activity launched successfully!');
      }
      // Reset form
      setEditingActivityId(null);
      setActTitle('');
      setActDesc('');
      setActType('daily');
      setActXp('30');
      setActCoins('10');
      setActBadge('');
      setActUrl('');
      setActIsChallenge(false);
      setActIsActive(true);
      
      fetchActivities();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to save activity');
    } finally {
      setSavingActivity(false);
    }
  };

  const startEditActivity = (act) => {
    setEditingActivityId(act._id);
    setActTitle(act.title || '');
    setActDesc(act.description || '');
    setActType(act.type || 'daily');
    setActXp(act.xpReward?.toString() || '30');
    setActCoins(act.coinReward?.toString() || '10');
    setActBadge(act.badgeReward || '');
    setActUrl(act.targetUrl || '');
    setActIsChallenge(!!act.isChallenge);
    setActIsActive(!!act.isActive);
    setShowActivityForm(true);
  };

  const handleToggleActivityStatus = async (act) => {
    try {
      await ecosystemAPI.updateActivity(act._id, { isActive: !act.isActive });
      toast.success(`Activity ${!act.isActive ? 'activated' : 'deactivated'}`);
      fetchActivities();
    } catch (e) {
      toast.error('Failed to toggle activity status');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header Banner */}
      <div style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(251,191,36,0.04))',
        border:'1px solid rgba(239,68,68,0.15)', borderRadius:16, padding:'22px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Shield size={18} style={{ color: isSuper ? 'var(--rose)' : 'var(--gold)' }} />
            <h2 style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:800 }}>
              {isSuper ? 'SuperAdmin Control Center' : 'Activity & Verification Hub'}
            </h2>
            <span className="badge badge-gold">{isSuper ? 'ROOT ACCESS' : 'ADMIN PORTAL'}</span>
          </div>
          <p style={{ color:'var(--t2)', fontSize:13 }}>
            {isSuper 
              ? 'Direct systems override, logs audits, platform settings control, and billing/commissions tracking.'
              : 'Launch new activities, edit challenges, delete previous events, and verify pending creator submissions.'
            }
          </p>
        </div>
      </div>

      {/* Stats Cards Grid (SuperAdmin Only) */}
      {isSuper && stats && (
        <div className="grid-4">
          <StatCard label="Total Budget Vol." value={`₹${((Number(stats.totalSpent) || 0) / 1000).toFixed(0)}K`} icon={Coins} color="var(--p2)" />
          <StatCard label="Platform 10% Fee" value={`₹${((Number(stats.platformCommission) || 0) / 1000).toFixed(1)}K`} icon={Shield} color="var(--acc2)" sub="Calculated Revenue" />
          <StatCard label="Active Campaigns" value={stats.activeCampaigns || 0} icon={Activity} color="var(--gold)" />
          <StatCard label="Total User Count" value={stats.users?.totalUsers || 0} icon={Database} color="var(--acc)" sub={`${stats.users?.creatorsCount || 0} Creators / ${stats.users?.brandsCount || 0} Brands`} />
        </div>
      )}

      {/* Mobile Select for Tabs */}
      <div className="show-mobile" style={{ display: 'none', marginBottom: 12 }}>
        <select
          value={activeTab}
          onChange={e => {
            setActiveTab(e.target.value);
            if (e.target.value === 'activities') fetchActivities();
          }}
          className="form-input"
          style={{ width: '100%', height: 42, fontSize: 13, fontWeight: 700, borderRadius: 10, background: 'var(--s2)', color: 'var(--t1)' }}
        >
          <option value="overview">🛡️ {isSuper ? 'System Overview & Controls' : 'Submissions Verification'}</option>
          <option value="activities">⚡ Activities Manager</option>
        </select>
      </div>

      {/* Desktop Tab Switcher */}
      <div className="hide-mobile" style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 10, overflowX: 'auto', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`chip ${activeTab === 'overview' ? 'active' : ''}`}
          style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <Shield size={14}/> {isSuper ? 'System Overview & Controls' : 'Submissions Verification'}
        </button>
        <button
          onClick={() => {
            setActiveTab('activities');
            fetchActivities();
          }}
          className={`chip ${activeTab === 'activities' ? 'active' : ''}`}
          style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <Activity size={14}/> Activities Manager
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className={isSuper ? 'rs-main-aside' : undefined} style={{ display:'grid', gridTemplateColumns: isSuper ? '1fr 360px' : '1fr', gap:16, alignItems:'start' }}>
          
          {/* Left Area (Submissions and Audit Logs) */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Pending Submissions */}
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:13 }}>
                Pending Tasks Verification ({submissions.length})
              </div>
              {submissions.length === 0 ? (
                <p style={{ padding:28, textAlign:'center', color:'var(--t3)', fontSize:12 }}>
                  All activity submissions are caught up! 🎉
                </p>
              ) : (
                submissions.map(sub => (
                  <div key={sub._id} style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Creator Info & Activity Tag Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px' }}>
                        <Avatar src={sub.creator?.avatar} name={sub.creator?.displayName} size={34} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{sub.creator?.displayName}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Niche: {sub.creator?.niche || 'Creator'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>
                          {sub.activity?.type || 'Daily'}
                        </span>
                        <span className="badge badge-green" style={{ fontSize: 11, fontWeight: 800 }}>
                          +{sub.activity?.xpReward || 30} XP
                        </span>
                      </div>
                    </div>

                    {/* Task Note & Attachment Link */}
                    <div style={{ fontSize: 12, background: 'var(--s2)', padding: 12, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 13 }}>Task: {sub.activity?.title}</div>
                      <div style={{ color: 'var(--t2)', lineHeight: 1.4 }}>{sub.submissionNote || 'No description note provided.'}</div>
                      {sub.submissionUrl && (
                        <div style={{ marginTop: 4 }}>
                          🔗 <a href={sub.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--acc)', textDecoration: 'underline', fontWeight: 600 }}>
                            View Submission Attachment
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Admin Review Control Box - Responsive Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                      <input
                        className="form-input"
                        style={{ width: '100%', height: 36, fontSize: 12 }}
                        placeholder="Add administrative review notes..."
                        value={feedbackMap[sub._id] || ''}
                        onChange={e => setFeedbackMap(prev => ({ ...prev, [sub._id]: e.target.value }))}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>Rating:</span>
                          <select
                            className="form-input"
                            style={{ flex: 1, height: 34, fontSize: 11, padding: '0 6px' }}
                            value={ratingMap[sub._id] || 5}
                            onChange={e => setRatingMap(prev => ({ ...prev, [sub._id]: +e.target.value }))}
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                            <option value={4}>⭐⭐⭐⭐ (4)</option>
                            <option value={3}>⭐⭐⭐ (3)</option>
                            <option value={2}>⭐⭐ (2)</option>
                            <option value={1}>⭐ (1)</option>
                          </select>
                        </div>

                        <input
                          className="form-input"
                          style={{ height: 34, fontSize: 11 }}
                          type="number"
                          placeholder={`XP (${sub.activity?.xpReward || 30})`}
                          value={xpMap[sub._id] || ''}
                          onChange={e => setXpMap(prev => ({ ...prev, [sub._id]: e.target.value }))}
                        />

                        <input
                          className="form-input"
                          style={{ height: 34, fontSize: 11 }}
                          type="number"
                          placeholder={`Coins (${sub.activity?.coinReward || 10})`}
                          value={coinsMap[sub._id] || ''}
                          onChange={e => setCoinsMap(prev => ({ ...prev, [sub._id]: e.target.value }))}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleReview(sub._id, 'approved')}
                          className="btn btn-primary btn-sm"
                          style={{ background: 'var(--acc2)', height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, padding: '0 16px', flex: '1 1 120px' }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReview(sub._id, 'rejected')}
                          className="btn btn-danger btn-sm"
                          style={{ height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, padding: '0 16px', flex: '1 1 120px' }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* System logs (SuperAdmin Only) */}
            {isSuper && (
              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
                  <FileText size={14}/> Audit Trail Logs
                </div>
                <div style={{ display:'flex', flexDirection:'column', maxHeight:300, overflowY:'auto' }}>
                  {logs.length === 0 ? (
                    <p style={{ padding:20, textAlign:'center', color:'var(--t3)', fontSize:12 }}>No logs generated yet.</p>
                  ) : (
                    logs.map(log => (
                      <div key={log._id} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', fontSize:11, lineHeight:1.4 }}>
                        <div className="flex-between" style={{ marginBottom:3 }}>
                          <span style={{ fontWeight:700, color:'var(--p2)' }}>{log.action}</span>
                          <span style={{ color:'var(--t3)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div style={{ color:'var(--t2)' }}>{log.details}</div>
                        <div style={{ color:'var(--t3)', marginTop:2 }}>By: {log.performedBy?.displayName} ({log.performedBy?.email})</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Area (Override panel - SuperAdmin Only) */}
          {isSuper && (
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                <Settings size={14} /> Quick Override Engine
              </h3>
              <form onSubmit={handleOverrideSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <Input label="Target User Email"
                  value={overrideUserEmail} onChange={e => setOverrideUserEmail(e.target.value)}
                  placeholder="e.g. creator1@demo.com" required />
                
                <div className="grid-2" style={{ gap:12 }}>
                  <Input label="Set Total XP" type="number"
                    value={overrideXp} onChange={e => setOverrideXp(e.target.value)}
                    placeholder="e.g. 1500" />
                  <Input label="Set Coins" type="number"
                    value={overrideCoins} onChange={e => setOverrideCoins(e.target.value)}
                    placeholder="e.g. 500" />
                </div>

                <div className="form-group">
                  <label className="form-label">Change Role</label>
                  <select className="form-input" value={overrideRole} onChange={e => setOverrideRole(e.target.value)}>
                    <option value="creator">Creator</option>
                    <option value="brand">Brand</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">SuperAdmin</option>
                  </select>
                </div>

                {/* Account Ban control */}
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                    <input type="checkbox" checked={isBanned} onChange={e => setIsBanned(e.target.checked)} />
                    <span style={{ fontSize:12, color:'var(--rose)', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                      <AlertOctagon size={13}/> Suspend / Ban Account
                    </span>
                  </label>
                  
                  {isBanned && (
                    <Textarea label="Ban Justification Reason"
                      value={banReason} onChange={e => setBanReason(e.target.value)}
                      placeholder="State policy violation details..." />
                  )}
                </div>

                <Btn variant="primary" type="submit" disabled={applyingOverride} style={{ marginTop:8 }}>
                  {applyingOverride ? 'Applying...' : 'Apply Root Override'}
                </Btn>
              </form>
            </div>
          )}

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Action Header & Search/Filter Controls Bar */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} style={{ color: 'var(--acc)' }} /> Ecosystem Activities & Challenges
                </h3>
                <p style={{ fontSize: 12, color: 'var(--t2)', margin: '3px 0 0 0' }}>
                  Manage daily tasks, weekly milestones, and special reward challenges for creators.
                </p>
              </div>

              <Btn
                variant="primary"
                onClick={() => {
                  if (showActivityForm && !editingActivityId) {
                    setShowActivityForm(false);
                  } else {
                    setEditingActivityId(null);
                    setActTitle('');
                    setActDesc('');
                    setActType('daily');
                    setActXp('30');
                    setActCoins('10');
                    setActBadge('');
                    setActUrl('');
                    setActIsChallenge(false);
                    setActIsActive(true);
                    setShowActivityForm(true);
                  }
                }}
                style={{ gap: 6, fontWeight: 700, padding: '10px 18px', borderRadius: 10 }}
              >
                {showActivityForm && !editingActivityId ? <X size={15} /> : <Plus size={15} />}
                {showActivityForm && !editingActivityId ? 'Close Panel' : 'Launch New Activity'}
              </Btn>
            </div>

            {/* Search & Filter Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 360 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                <input
                  type="text"
                  value={actSearchQuery}
                  onChange={e => setActSearchQuery(e.target.value)}
                  placeholder="Search by activity title, reward, or type..."
                  className="form-input"
                  style={{ paddingLeft: 34, height: 38, fontSize: 12.5, borderRadius: 10 }}
                />
              </div>

              {/* Mobile Filter Dropdown (visible on mobile / smaller devices) */}
              <div className="show-mobile" style={{ flex: '1 1 120px', minWidth: 120 }}>
                <select
                  className="form-input"
                  value={actFilterCategory}
                  onChange={e => setActFilterCategory(e.target.value)}
                  style={{ height: 38, fontSize: 12, borderRadius: 10, padding: '0 8px', fontWeight: 600 }}
                >
                  <option value="all">All Activities</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="challenge">Challenges</option>
                  <option value="active">Active Only</option>
                </select>
              </div>

              {/* Desktop Filter Buttons (visible on laptop / desktop) */}
              <div className="hide-mobile" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'All Activities' },
                  { key: 'daily', label: 'Daily' },
                  { key: 'weekly', label: 'Weekly' },
                  { key: 'monthly', label: 'Monthly' },
                  { key: 'challenge', label: 'Challenges' },
                  { key: 'active', label: 'Active Only' },
                ].map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActFilterCategory(cat.key)}
                    className={`btn btn-sm ${actFilterCategory === cat.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 11.5, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Collapsible Slide-Down Launch/Edit Activity Card Form */}
          {showActivityForm && (
            <div className="card page-enter" style={{ border: '2px solid var(--acc)', background: 'var(--s1)', padding: 22, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editingActivityId ? <Edit3 size={16} style={{ color: 'var(--gold)' }} /> : <Sparkles size={16} style={{ color: 'var(--acc)' }} />}
                  {editingActivityId ? 'Edit Activity Details' : 'Launch New Ecosystem Activity'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowActivityForm(false);
                    setEditingActivityId(null);
                  }}
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: 'var(--t2)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleActivitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid-2" style={{ gap: 14 }}>
                  <Input
                    label="Activity Title *"
                    value={actTitle}
                    onChange={e => setActTitle(e.target.value)}
                    placeholder="e.g. Share your setup video or story reel"
                    required
                  />
                  <div className="form-group">
                    <label className="form-label">Activity Type *</label>
                    <select className="form-input" value={actType} onChange={e => setActType(e.target.value)} style={{ height: 42 }}>
                      <option value="daily">Daily Activity</option>
                      <option value="weekly">Weekly Task</option>
                      <option value="monthly">Monthly Championship</option>
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Activity Description *"
                  value={actDesc}
                  onChange={e => setActDesc(e.target.value)}
                  placeholder="Explain clearly what steps the creator needs to perform and submit..."
                  required
                />

                <div className="grid-3" style={{ gap: 14 }}>
                  <Input
                    label="XP Reward *"
                    type="number"
                    value={actXp}
                    onChange={e => setActXp(e.target.value)}
                    placeholder="e.g. 30"
                    required
                  />
                  <Input
                    label="Coin Reward *"
                    type="number"
                    value={actCoins}
                    onChange={e => setActCoins(e.target.value)}
                    placeholder="e.g. 10"
                    required
                  />
                  <Input
                    label="Badge Reward (Optional)"
                    value={actBadge}
                    onChange={e => setActBadge(e.target.value)}
                    placeholder="e.g. Tech Guru"
                  />
                </div>

                <Input
                  label="Target Reference / Submission URL (Optional)"
                  value={actUrl}
                  onChange={e => setActUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                />

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={actIsChallenge} onChange={e => setActIsChallenge(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600 }}>Mark as Special Challenge</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={actIsActive} onChange={e => setActIsActive(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600 }}>Activity is Active (Visible to Creators)</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <Btn
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setShowActivityForm(false);
                      setEditingActivityId(null);
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn variant="primary" type="submit" disabled={savingActivity} style={{ padding: '10px 24px', fontWeight: 700 }}>
                    {savingActivity ? 'Saving...' : editingActivityId ? 'Save Changes' : '🚀 Launch Activity'}
                  </Btn>
                </div>
              </form>
            </div>
          )}

          {/* Activities Cards Grid */}
          {(() => {
            const filteredActivities = activities.filter(act => {
              const matchesSearch = !actSearchQuery || (
                (act.title || '').toLowerCase().includes(actSearchQuery.toLowerCase()) ||
                (act.description || '').toLowerCase().includes(actSearchQuery.toLowerCase())
              );
              if (!matchesSearch) return false;
              if (actFilterCategory === 'daily') return act.type === 'daily';
              if (actFilterCategory === 'weekly') return act.type === 'weekly';
              if (actFilterCategory === 'monthly') return act.type === 'monthly';
              if (actFilterCategory === 'challenge') return !!act.isChallenge;
              if (actFilterCategory === 'active') return !!act.isActive;
              return true;
            });

            if (filteredActivities.length === 0) {
              return (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <EmptyState
                    icon="🚀"
                    title="No Activities Found"
                    desc={actSearchQuery || actFilterCategory !== 'all' ? "Try clearing your search or category filter" : "Click '+ Launch New Activity' above to create your first ecosystem activity!"}
                  />
                </div>
              );
            }

            return (
              <div className="grid-2-mobile" style={{ gap: 16 }}>
                {filteredActivities.map(act => (
                  <div
                    key={act._id}
                    className="card card-hover"
                    style={{
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12,
                      position: 'relative',
                      borderLeft: act.isChallenge ? '4px solid var(--gold)' : act.isActive ? '4px solid var(--acc2)' : '4px solid var(--rose)',
                    }}
                  >
                    <div>
                      {/* Badge header */}
                      <div className="flex-between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>
                            {act.type}
                          </span>
                          {act.isChallenge && (
                            <span className="badge badge-gold" style={{ fontSize: 10, fontWeight: 700 }}>
                              🏆 CHALLENGE
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleToggleActivityStatus(act)}
                          className={`badge ${act.isActive ? 'badge-green' : 'badge-red'}`}
                          style={{ cursor: 'pointer', border: 'none', fontSize: 10, fontWeight: 700, padding: '3px 9px' }}
                          title="Click to toggle status"
                        >
                          {act.isActive ? '● ACTIVE' : '○ INACTIVE'}
                        </button>
                      </div>

                      <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                        {act.title}
                      </h4>
                      <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>
                        {act.description}
                      </p>
                    </div>

                    {/* Rewards & Actions Footer */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, fontWeight: 700 }}>
                        <span style={{ background: 'rgba(230, 95, 43, 0.1)', color: 'var(--acc)', padding: '3px 8px', borderRadius: 6 }}>
                          ⚡ {act.xpReward} XP
                        </span>
                        <span style={{ background: 'rgba(212, 162, 76, 0.1)', color: 'var(--gold)', padding: '3px 8px', borderRadius: 6 }}>
                          🪙 {act.coinReward} Coins
                        </span>
                        {act.badgeReward && (
                          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '3px 8px', borderRadius: 6 }}>
                            🏆 {act.badgeReward}
                          </span>
                        )}
                        {act.targetUrl && (
                          <a
                            href={act.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--p2)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            <ExternalLink size={12} /> Reference
                          </a>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => startEditActivity(act)}
                          className="btn btn-ghost btn-sm"
                          style={{ gap: 4, fontSize: 11.5, padding: '4px 10px' }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(act._id)}
                          className="btn btn-danger btn-sm"
                          style={{ gap: 4, fontSize: 11.5, padding: '4px 10px' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}
