import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Users, Megaphone, CheckCircle, DollarSign, Clock, UserCheck, TrendingUp,
  Radio, Calendar, ArrowRight, Bell, CheckSquare, AlertOctagon, Brain,
  Trophy, Zap, Activity, AlertTriangle, Heart, Target, ChevronRight,
} from 'lucide-react';
import { adminAPI, crmAPI } from '../../api';
import { StatCard, Avatar, StatusBadge, WorkflowPipeline, SkeletonCard, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

/* ── Campaign health calculator ─────────────────────── */
function calcHealth(c) {
  let score = 100;
  const assigned = c.assignedCreators?.length || 0;
  const total    = c.totalSlots || 1;
  const fillPct  = (assigned / total) * 100;
  const daysLeft = c.daysLeft || 0;

  if (fillPct < 50)  score -= 25;
  else if (fillPct < 80) score -= 10;

  if (daysLeft < 1)  score -= 30;
  else if (daysLeft < 3) score -= 15;
  else if (daysLeft < 7) score -= 5;

  if (c.workflowStatus === 'revision') score -= 15;
  if (c.workflowStatus === 'cancelled') score = 0;

  const approvedCount = (c.assignedCreators || []).filter(a => a.status === 'approved' || a.status === 'completed').length;
  if (assigned > 0) {
    const deliveryRate = approvedCount / assigned;
    if (deliveryRate < 0.3) score -= 20;
    else if (deliveryRate < 0.6) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function healthLabel(score) {
  if (score >= 80) return { cls:'health-excellent', label:'Excellent' };
  if (score >= 60) return { cls:'health-good',      label:'Good'      };
  if (score >= 40) return { cls:'health-fair',      label:'Fair'      };
  return                  { cls:'health-poor',      label:'Needs Attention' };
}

/* ── Quick Access Widget ────────────────────────────── */
function QuickWidget({ icon: Icon, label, value, sub, color, to, urgent }) {
  const navigate = useNavigate();
  return (
    <div
      className="quick-widget"
      onClick={() => navigate(to)}
      style={{ borderTop: urgent ? `2px solid ${color}` : undefined }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          width:36, height:36, borderRadius:'var(--r)',
          background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          <Icon size={16} style={{ color }} />
        </div>
        <ChevronRight size={13} style={{ color:'var(--t3)' }} />
      </div>
      <div style={{ fontFamily:'var(--fd)', fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'var(--t1)', lineHeight:1, marginTop:4 }}>
        {value}
      </div>
      <div style={{ fontSize:12, color:'var(--t2)', fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color: urgent ? color : 'var(--t3)', fontWeight: urgent ? 700 : 400 }}>{sub}</div>}
    </div>
  );
}

/* ── Campaign Health Card ───────────────────────────── */
function CampaignHealthCard({ c }) {
  const navigate = useNavigate();
  const score = calcHealth(c);
  const { cls, label } = healthLabel(score);

  return (
    <div
      className="card card-hover"
      style={{ padding:'12px 14px', cursor:'pointer' }}
      onClick={() => navigate('/admin/campaigns')}
    >
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div className={`health-score-circle ${cls}`}>
          {score}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {c.title}
          </div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>
            {c.brand?.companyName || c.brand?.displayName} · {c.assignedCreators?.length || 0}/{c.totalSlots || 1} creators
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
            <span style={{
              fontSize:9, padding:'2px 7px', borderRadius:99, fontWeight:700,
              background: score >= 80 ? 'rgba(16,185,129,0.12)' : score >= 60 ? 'rgba(124,139,90,0.12)' : score >= 40 ? 'rgba(212,162,76,0.12)' : 'rgba(232,93,69,0.10)',
              color: score >= 80 ? '#10b981' : score >= 60 ? 'var(--acc2)' : score >= 40 ? 'var(--gold)' : 'var(--rose)',
            }}>
              {label}
            </span>
            <span style={{ fontSize:10, color: c.daysLeft < 3 ? 'var(--rose)' : 'var(--t3)' }}>
              <Clock size={9} style={{ display:'inline', marginRight:3 }}/>
              {c.daysLeft || 0}d left
            </span>
            <StatusBadge status={c.workflowStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}

const GrowthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{
      background: 'var(--s1, #1C1917)',
      border: '1px solid var(--border2, rgba(230, 95, 43, 0.3))',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--acc, #E65F2B)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📈</span> {val?.toLocaleString()} New User{val !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats,     setStats]     = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [users,     setUsers]     = useState([]);
  const [followups, setFollowups] = useState({ today:[], overdue:[] });
  const [monthly,   setMonthly]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.dashboard(),
      adminAPI.analytics(),
      crmAPI.followups().catch(() => ({ today:[], overdue:[] })),
    ]).then(([db, an, fu]) => {
      setStats(db.stats);
      setCampaigns(db.recentCampaigns || []);
      setUsers(db.recentUsers || []);
      setFollowups({ today: fu.today || [], overdue: fu.overdue || [] });
      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chart = (an.monthlyUsers || []).map(m => {
        const mNum = parseInt(m._id?.month) || 1;
        const mName = MONTH_NAMES[mNum - 1] || `${m._id?.month}`;
        const yr = String(m._id?.year || '').slice(-2);
        return {
          name: `${mName} '${yr}`,
          users: m.count,
        };
      }).reverse();
      setMonthly(chart);
    }).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, []);

  const ttStyle = { background:'var(--s2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12, color:'var(--t1)' };

  if (loading) return (
    <div className="page-enter">
      <div className="page-header"><div style={{ height:32, width:200 }} className="skeleton"/></div>
      <div className="grid-4" style={{ marginBottom:24 }}>{[1,2,3,4].map(i => <SkeletonCard key={i}/>)}</div>
      <div className="grid-2">{[1,2].map(i => <SkeletonCard key={i}/>)}</div>
    </div>
  );

  const totalFollowupsAlert = (followups.today?.length || 0) + (followups.overdue?.length || 0);
  const activeCampaignsList = campaigns.filter(c => ['creators_assigned','in_progress'].includes(c.workflowStatus));
  const healthCritical = activeCampaignsList.filter(c => calcHealth(c) < 50);

  return (
    <div className="page-enter">
      {/* ── Admin Dashboard Header Banner ───────────────── */}
      <div 
        className="admin-header-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(230, 95, 43, 0.12), rgba(212, 162, 76, 0.08))',
          border: '1px solid rgba(230, 95, 43, 0.25)',
          borderRadius: 20,
          padding: '24px clamp(20px, 4vw, 32px)',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
              background: 'rgba(34, 197, 94, 0.14)', color: '#16a34a',
              border: '1px solid rgba(34, 197, 94, 0.3)', textTransform: 'uppercase', letterSpacing: 0.8
            }}>
              🟢 System Active
            </span>
            <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.02em', margin: 0 }}>
            Control Center <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc)', fontSize: '1.2em' }}>Dashboard</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13.5, margin: '4px 0 0 0', fontWeight: 500 }}>
            Monitor real-time campaign health, creator approvals, and brand activities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {healthCritical.length > 0 && (
            <button onClick={() => navigate('/admin/campaigns')} className="btn btn-danger btn-sm" style={{ gap: 6, padding: '10px 16px', borderRadius: 10, fontWeight: 700 }}>
              <AlertTriangle size={14} />
              {healthCritical.length} Critical Campaign{healthCritical.length !== 1 ? 's' : ''}
            </button>
          )}
          {totalFollowupsAlert > 0 && (
            <button onClick={() => navigate('/admin/crm/creators')} className="btn btn-primary btn-sm" style={{ gap: 6, padding: '10px 16px', borderRadius: 10, fontWeight: 700 }}>
              <Bell size={14} />
              {totalFollowupsAlert} Follow-up{totalFollowupsAlert > 1 ? 's' : ''} Due
            </button>
          )}
          <button onClick={() => navigate('/admin/campaigns')} className="btn btn-secondary btn-sm" style={{ gap: 6, padding: '10px 16px', borderRadius: 10, fontWeight: 700 }}>
            <Megaphone size={14} /> Manage Campaigns
          </button>
        </div>
      </div>

      {/* ── Quick Access Operations Grid ────────────────── */}
      <div
        className="quick-widgets-grid"
        style={{ marginBottom: 28 }}
      >
        <QuickWidget icon={Activity} label="Active Campaigns" value={stats?.activeCampaigns || 0} color="var(--acc)" to="/admin/campaigns" />
        <QuickWidget icon={Clock} label="Pending Review" value={stats?.pendingCampaigns || 0} color="var(--gold)" to="/admin/campaigns" urgent={stats?.pendingCampaigns > 0} sub={stats?.pendingCampaigns > 0 ? 'Needs action' : 'All reviewed'} />
        <QuickWidget icon={UserCheck} label="Creator Approval" value={stats?.creatorsPending || 0} color="#10b981" to="/admin/creator-approval" urgent={stats?.creatorsPending > 0} sub={stats?.creatorsPending > 0 ? 'Verification queue' : 'Clean'} />
        <QuickWidget icon={Users} label="Total Creators" value={stats?.totalCreators || 0} color="#6366f1" to="/admin/users" />
        <QuickWidget icon={Megaphone} label="Total Brands" value={stats?.totalBrands || 0} color="#3b82f6" to="/admin/crm/brands" />
        <QuickWidget icon={Trophy} label="Leaderboard" value="Top 10" color="var(--gold)" to="/admin/leaderboard" />
      </div>

      {/* ── Platform High Level Overview ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 13, fontWeight: 850, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Platform Overview
        </h2>
      </div>
      <div className="grid-2-mobile" style={{ marginBottom: 28, gap: 14 }}>
        <StatCard label="Total Users" value={(stats?.totalUsers || 0).toLocaleString('en-IN')} icon={Users} color="var(--p)" />
        <StatCard label="Total Campaigns" value={(stats?.totalCampaigns || 0).toLocaleString('en-IN')} icon={Megaphone} color="var(--acc)" />
        <StatCard label="Total Platform Revenue" value={`₹${(Number(stats?.totalRevenue) || 0).toLocaleString('en-IN')}`} icon={DollarSign} color="var(--gold)" />
        <StatCard label="Active Team Ops" value={stats?.totalTeam || 0} icon={Users} color="#6366f1" />
      </div>

      {/* ── Campaign Health Monitor Section ──────────────── */}
      {activeCampaignsList.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: 13, fontWeight: 850, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Campaign Health Monitor
            </h2>
            <button onClick={() => navigate('/admin/campaigns')} className="btn btn-ghost btn-sm" style={{ fontSize: 12, fontWeight: 700 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {activeCampaignsList.slice(0, 6).map(c => (
              <CampaignHealthCard key={c._id} c={c} />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* User Growth Chart */}
        <div className="card hover-lift" style={{
          padding: 22,
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 20,
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 800, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <TrendingUp size={18} color="var(--acc)" /> Monthly User Growth
              </h3>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2, fontWeight: 500 }}>
                Platform creator & brand signup trajectory
              </p>
            </div>
            {monthly.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                background: 'rgba(230, 95, 43, 0.12)', color: 'var(--acc)',
                border: '1px solid rgba(230, 95, 43, 0.25)',
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                🔥 {monthly.reduce((a, b) => a + (b.users || 0), 0)} Total
              </span>
            )}
          </div>

          {monthly.length === 0 ? (
            <EmptyState icon="📈" title="No growth data yet" desc="Platform signups will render here" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--acc, #E65F2B)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--gold, #D4A24C)" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--t2)', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--t3)', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<GrowthTooltip />} cursor={{ fill: 'rgba(230, 95, 43, 0.08)' }} />
                <Bar
                  dataKey="users"
                  fill="url(#userGrowthGrad)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Follow-ups Due */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:14 }}>
            <h3 style={{ fontFamily:'var(--fd)', fontWeight:700 }}>
              <Calendar size={15} style={{ color:'var(--gold)', marginRight:6, verticalAlign:'middle' }}/>
              Follow-ups Due
            </h3>
            <button onClick={() => navigate('/admin/crm/creators')} className="btn btn-ghost btn-sm" style={{ fontSize:11 }}>
              CRM <ArrowRight size={11}/>
            </button>
          </div>
          {followups.overdue?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--rose)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>
                ⚠️ Overdue ({followups.overdue.length})
              </div>
              {followups.overdue.slice(0, 3).map(u => (
                <div key={u._id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'rgba(232,93,69,0.06)', borderRadius:'var(--r)', border:'1px solid rgba(232,93,69,0.15)', marginBottom:5 }}>
                  <Avatar src={u.avatar} name={u.displayName} size={26}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {u.displayName}
                    </div>
                    <div style={{ fontSize:10, color:'var(--rose)' }}>
                      Due: {new Date(u.nextFollowUpDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {followups.today?.length > 0 && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>
                Today ({followups.today.length})
              </div>
              {followups.today.slice(0, 3).map(u => (
                <div key={u._id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'rgba(212,162,76,0.06)', borderRadius:'var(--r)', border:'1px solid rgba(212,162,76,0.15)', marginBottom:5 }}>
                  <Avatar src={u.avatar} name={u.displayName} size={26}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {u.displayName}
                    </div>
                    <div style={{ fontSize:10, color:'var(--t2)' }}>
                      {u.followUpNotes || 'Follow up today'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!followups.today?.length && !followups.overdue?.length && (
            <EmptyState icon="✅" title="All clear!" desc="No follow-ups due today"/>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Recent Campaigns */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:14 }}>
            <h3 style={{ fontFamily:'var(--fd)', fontWeight:700 }}>Recent Campaigns</h3>
            <button onClick={() => navigate('/admin/campaigns')} className="btn btn-ghost btn-sm" style={{ fontSize:11 }}>
              All <ArrowRight size={11}/>
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {campaigns.slice(0, 5).map(c => (
              <div key={c._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <Avatar src={c.brand?.avatar} name={c.brand?.displayName} size={28}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize:10, color:'var(--t3)' }}>
                    {c.brand?.companyName || c.brand?.displayName} · ₹{(c.budget || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <StatusBadge status={c.workflowStatus}/>
              </div>
            ))}
          </div>
          {campaigns.length === 0 && <EmptyState icon="📣" title="No campaigns" desc="Campaigns will appear here"/>}
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:14 }}>
            <h3 style={{ fontFamily:'var(--fd)', fontWeight:700 }}>Recent Users</h3>
            <button onClick={() => navigate('/admin/users')} className="btn btn-ghost btn-sm" style={{ fontSize:11 }}>
              All <ArrowRight size={11}/>
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {users.slice(0, 5).map(u => (
              <div key={u._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <Avatar src={u.avatar} name={u.displayName} size={28}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {u.displayName}
                  </div>
                  <div style={{ fontSize:10, color:'var(--t3)' }}>
                    {u.role} {u.niche ? `· ${u.niche}` : ''}
                  </div>
                </div>
                {(u.role === 'creator' || u.roles?.includes('creator')) && (
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--p)', fontFamily:'var(--fd)' }}>
                    ⚡{u.creatorScore || 0}
                  </span>
                )}
              </div>
            ))}
          </div>
          {users.length === 0 && <EmptyState icon="👥" title="No users" desc="Users will appear here"/>}
        </div>
      </div>
    </div>
  );
}
