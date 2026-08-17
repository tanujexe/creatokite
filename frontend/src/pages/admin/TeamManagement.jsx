import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckSquare, Activity, BarChart2, Plus, Calendar,
  AlertCircle, Edit, Trash2, ArrowRight, Check, Clock, Eye, AlertOctagon, RefreshCw
} from 'lucide-react';
import { teamManagementAPI, campaignsAPI } from '../../api';
import { PageLoader, Btn, StatCard, Avatar, StatusBadge, EmptyState, Modal, Input, Textarea, Select, ProgressBar, SearchBar } from '../../components/ui';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  low: 'var(--green)',
  medium: 'var(--gold)',
  high: 'var(--rose)',
  urgent: 'var(--rose)'
};

const STATUS_COLORS = {
  todo: 'var(--gold)',
  in_progress: '#3b82f6',
  review: '#6366f1',
  done: 'var(--acc2)',
  blocked: 'var(--rose)',
  backlog: 'var(--t3)'
};

export default function TeamManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  // Filter states (Task Center)
  const [filterMember, setFilterMember] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  // Form states
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: [], // array of IDs
    dueDate: '',
    campaign: '',
    department: '',
    targetDMs: 0
  });

  const [reassignTaskData, setReassignTaskData] = useState(null); // task to reassign
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, tasksRes, campaignsRes, analyticsRes] = await Promise.all([
        teamManagementAPI.getMembers(),
        teamManagementAPI.getTasks({ all: true }),
        campaignsAPI.list({ limit: 100 }),
        teamManagementAPI.getAnalytics()
      ]);
      setMembers(membersRes.members || []);
      setTasks(tasksRes.tasks || []);
      setCampaigns(campaignsRes.campaigns || []);
      setAnalytics({
        stats: analyticsRes.stats,
        memberMetrics: analyticsRes.memberMetrics || []
      });
    } catch (e) {
      toast.error('Failed to load team management data');
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const actRes = await teamManagementAPI.getActivity({ limit: 30 });
      setActivities(actRes.events || []);
    } catch (e) {
      toast.error('Failed to load activity logs');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity-center') {
      loadActivity();
    }
  }, [activeTab]);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title) {
      toast.error('Task title is required');
      return;
    }
    try {
      if (editingTask) {
        const res = await teamManagementAPI.updateTask(editingTask._id, taskForm);
        toast.success('Task updated successfully!');
        setTasks(prev => prev.map(t => t._id === editingTask._id ? res.task : t));
      } else {
        const res = await teamManagementAPI.createTask(taskForm);
        toast.success('Task assigned successfully!');
        setTasks(prev => [res.task, ...prev]);
      }
      setTaskModalOpen(false);
      resetTaskForm();
      // Reload stats/members
      const membersRes = await teamManagementAPI.getMembers();
      setMembers(membersRes.members || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const resetTaskForm = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: [],
      dueDate: '',
      campaign: '',
      department: '',
      targetDMs: 0
    });
  };

  const openCreateTask = (assignedMemberId = null) => {
    resetTaskForm();
    if (assignedMemberId) {
      setTaskForm(prev => ({ ...prev, assignedTo: [assignedMemberId] }));
    }
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      assignedTo: (task.assignedTo || []).map(u => u._id || u),
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      campaign: task.campaign?._id || task.campaign || '',
      department: task.department || '',
      targetDMs: task.outreachGoal?.targetDMs || 0
    });
    setTaskModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await teamManagementAPI.deleteTask(id);
      toast.success('Task deleted successfully!');
      setTasks(prev => prev.filter(t => t._id !== id));
      const membersRes = await teamManagementAPI.getMembers();
      setMembers(membersRes.members || []);
    } catch (e) {
      toast.error('Failed to delete task');
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!newAssigneeId) {
      toast.error('Please select a team member');
      return;
    }
    try {
      const res = await teamManagementAPI.updateTask(reassignTaskData._id, {
        assignedTo: [newAssigneeId]
      });
      toast.success('Task reassigned successfully!');
      setTasks(prev => prev.map(t => t._id === reassignTaskData._id ? res.task : t));
      setReassignModalOpen(false);
      setReassignTaskData(null);
      setNewAssigneeId('');
      // Reload members stats
      const membersRes = await teamManagementAPI.getMembers();
      setMembers(membersRes.members || []);
    } catch (e) {
      toast.error('Reassignment failed');
    }
  };

  const toggleHighPriority = async (task) => {
    try {
      const newPriority = task.priority === 'high' ? 'medium' : 'high';
      const res = await teamManagementAPI.updateTask(task._id, { priority: newPriority });
      toast.success(`Task marked as ${newPriority} priority!`);
      setTasks(prev => prev.map(t => t._id === task._id ? res.task : t));
    } catch (e) {
      toast.error('Failed to update priority');
    }
  };

  const toggleTaskStatus = async (task, newStatus) => {
    try {
      const res = await teamManagementAPI.updateTask(task._id, { status: newStatus });
      toast.success(`Task status updated to ${newStatus}!`);
      setTasks(prev => prev.map(t => t._id === task._id ? res.task : t));
      // Reload overview
      const membersRes = await teamManagementAPI.getMembers();
      setMembers(membersRes.members || []);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filterMember && !t.assignedTo?.some(u => u._id === filterMember)) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterDept && t.department?.toLowerCase() !== filterDept.toLowerCase()) return false;
    if (taskSearch && !t.title.toLowerCase().includes(taskSearch.toLowerCase())) return false;
    return true;
  });

  // Overdue tasks list
  const now = new Date();
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);

  if (loading) return <PageLoader />;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(212,162,76,0.04))',
        border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '22px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Users size={18} style={{ color: 'var(--p)' }} />
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: 18, fontWeight: 800 }}>Team Management Dashboard</h2>
            <span className="badge badge-indigo">ADMIN PORTAL</span>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: 13 }}>
            Monitor and manage team metrics, global tasks, log histories, performance insights, and automate workflows.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => loadData()} variant="ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', height: 36 }}>
            <RefreshCw size={13} /> Refresh
          </Btn>
          <Btn onClick={() => openCreateTask()} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36 }}>
            <Plus size={14} /> Assign New Task
          </Btn>
        </div>
      </div>

      {/* Overdue Alert Widget */}
      {overdueTasks.length > 0 && (
        <div style={{
          background: 'rgba(232,93,69,0.06)',
          border: '1px solid rgba(232,93,69,0.2)',
          borderRadius: 12,
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--rose)', fontWeight: 700, fontSize: 13 }}>
            <AlertOctagon size={16} />
            Overdue Tasks Warning ({overdueTasks.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {overdueTasks.slice(0, 3).map(ot => {
              const daysOverdue = Math.ceil((now - new Date(ot.dueDate)) / (1000 * 60 * 60 * 24));
              const assignee = ot.assignedTo?.[0]?.displayName || 'Unassigned';
              return (
                <div key={ot._id} className="flex-between" style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{ot.title}</span>
                    <span style={{ color: 'var(--t3)' }}>·</span>
                    <span style={{ color: 'var(--t2)' }}>Assigned to: <strong>{assignee}</strong></span>
                  </div>
                  <span style={{ color: 'var(--rose)', fontWeight: 600 }}>{daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue</span>
                </div>
              );
            })}
            {overdueTasks.length > 3 && (
              <button onClick={() => { setActiveTab('task-center'); setFilterStatus('todo'); }} style={{ background: 'none', border: 'none', color: 'var(--p2)', cursor: 'pointer', fontSize: 11, fontWeight: 600, textAlign: 'left', width: 'fit-content' }}>
                View all overdue tasks →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button onClick={() => setActiveTab('overview')} className={`chip ${activeTab === 'overview' ? 'active' : ''}`} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={14} /> Team Members ({members.length})
        </button>
        <button onClick={() => setActiveTab('task-center')} className={`chip ${activeTab === 'task-center' ? 'active' : ''}`} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckSquare size={14} /> Global Task Center ({filteredTasks.length})
        </button>
        <button onClick={() => setActiveTab('activity-center')} className={`chip ${activeTab === 'activity-center' ? 'active' : ''}`} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} /> Team Activity Center
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`chip ${activeTab === 'analytics' ? 'active' : ''}`} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={14} /> Performance Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
            All Active Team Members
          </div>
          {members.length === 0 ? (
            <EmptyState icon="👥" title="No team members found" desc="Team directory is empty." />
          ) : (
            <div className="rs-data-grid-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr', padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>
                <div>Member</div>
                <div>Role / Department</div>
                <div>Status</div>
                <div>Active Tasks Summary</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>

              {members.map(m => {
                const totalActive = (m.stats?.inProgress || 0) + (m.stats?.total - m.stats?.completed - m.stats?.inProgress || 0);
                return (
                  <div key={m._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr', padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={m.avatar} name={m.displayName} size={32} />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{m.displayName}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.email}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>{m.role?.replace('_', ' ')}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.teamDepartment || 'General'}</div>
                    </div>
                    <div>
                      <StatusBadge status={m.availability || 'available'} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-blue" style={{ fontSize: 9 }}>In Progress: {m.stats?.inProgress || 0}</span>
                      <span className="badge badge-green" style={{ fontSize: 9 }}>Done: {m.stats?.completed || 0}</span>
                      {m.stats?.overdue > 0 && (
                        <span className="badge badge-red" style={{ fontSize: 9, fontWeight: 700 }}>Overdue: {m.stats.overdue}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/admin/team-management/${m._id}`)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} /> Details
                      </button>
                      <button onClick={() => openCreateTask(m._id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Plus size={12} /> Assign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'task-center' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters Bar */}
          <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 18px', alignItems: 'center' }}>
            <SearchBar value={taskSearch} onChange={e => setTaskSearch(e.target.value)} placeholder="Search tasks by title..." style={{ flex: 1, minWidth: 200 }} />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: 140, height: 38, fontSize: 12, padding: '0 8px' }} value={filterMember} onChange={e => setFilterMember(e.target.value)}>
                <option value="">Filter Assignee</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.displayName}</option>
                ))}
              </select>

              <select className="form-input" style={{ width: 130, height: 38, fontSize: 12, padding: '0 8px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Filter Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="done">Completed</option>
                <option value="blocked">Blocked</option>
              </select>

              <select className="form-input" style={{ width: 130, height: 38, fontSize: 12, padding: '0 8px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">Filter Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select className="form-input" style={{ width: 140, height: 38, fontSize: 12, padding: '0 8px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="">Filter Department</option>
                <option value="outreach">Outreach</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="support">Support</option>
                <option value="management">Management</option>
              </select>

              {(filterMember || filterStatus || filterPriority || filterDept || taskSearch) && (
                <button onClick={() => { setFilterMember(''); setFilterStatus(''); setFilterPriority(''); setFilterDept(''); setTaskSearch(''); }} className="btn btn-ghost btn-sm" style={{ padding: '0 10px', height: 38, fontSize: 11 }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tasks List Board */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Global Tasks ({filteredTasks.length})</span>
            </div>

            {filteredTasks.length === 0 ? (
              <EmptyState icon="📋" title="No tasks found" desc="Adjust your filters or assign a new task." />
            ) : (
              <div className="rs-data-grid-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.2fr', padding: '10px 18px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>
                  <div>Task Title & Campaign</div>
                  <div>Assigned To</div>
                  <div>Department</div>
                  <div>Priority / Status</div>
                  <div>Outreach Goal (DMs)</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {filteredTasks.map(t => {
                  const isOverdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now;
                  const isHigh = t.priority === 'high' || t.priority === 'urgent';
                  return (
                    <div key={t._id} style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.2fr', padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 12.5,
                      background: isOverdue ? 'rgba(232,93,69,0.02)' : ''
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{t.title}</span>
                          {isOverdue && <span style={{ color: 'var(--rose)', fontSize: 9, fontWeight: 700, background: 'rgba(232,93,69,0.1)', padding: '1px 5px', borderRadius: 4 }}>OVERDUE</span>}
                          {isHigh && <span style={{ color: 'var(--rose)', fontSize: 9, fontWeight: 700, background: 'rgba(232,93,69,0.1)', padding: '1px 5px', borderRadius: 4 }}>HIGH</span>}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>
                          {t.campaign?.title ? `Campaign: ${t.campaign.title}` : 'General Admin Task'}
                          {t.dueDate && ` · Due: ${new Date(t.dueDate).toLocaleDateString('en-IN')}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar src={t.assignedTo?.[0]?.avatar} name={t.assignedTo?.[0]?.displayName} size={24} />
                        <span style={{ fontWeight: 500 }}>{t.assignedTo?.[0]?.displayName || 'Unassigned'}</span>
                      </div>

                      <div style={{ color: 'var(--t2)', textTransform: 'capitalize' }}>
                        {t.department || 'General'}
                      </div>

                      <div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, color: PRIORITY_COLORS[t.priority], background: `${PRIORITY_COLORS[t.priority]}15`, padding: '2px 6px', borderRadius: 99, fontWeight: 700, border: `1px solid ${PRIORITY_COLORS[t.priority]}30` }}>
                            {t.priority}
                          </span>
                          <span style={{ fontSize: 9, color: STATUS_COLORS[t.status], background: `${STATUS_COLORS[t.status]}15`, padding: '2px 6px', borderRadius: 99, fontWeight: 700, border: `1px solid ${STATUS_COLORS[t.status]}30` }}>
                            {t.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div>
                        {t.outreachGoal?.targetDMs > 0 ? (
                          <div style={{ width: '90%' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--acc2)', marginBottom: 2 }}>
                              {t.outreachGoal.currentDMs} / {t.outreachGoal.targetDMs} DMs
                            </div>
                            <ProgressBar value={t.outreachGoal.currentDMs} max={t.outreachGoal.targetDMs} color="var(--acc2)" height={3} />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--t3)', fontSize: 11 }}>—</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <select className="form-input" style={{ width: 85, height: 26, fontSize: 10, padding: '0 4px', background: 'var(--s1)', border: '1px solid var(--border)' }} value={t.status} onChange={e => toggleTaskStatus(t, e.target.value)}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        <button onClick={() => { setReassignTaskData(t); setReassignModalOpen(true); }} className="btn btn-ghost btn-sm" style={{ padding: 4, height: 26 }} title="Reassign">
                          🔄
                        </button>
                        <button onClick={() => openEditTask(t)} className="btn btn-ghost btn-sm" style={{ padding: 4, height: 26 }} title="Edit">
                          <Edit size={12} />
                        </button>
                        <button onClick={() => handleDeleteTask(t._id)} className="btn btn-ghost btn-sm" style={{ padding: 4, height: 26, color: 'var(--rose)' }} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity-center' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
            Live Team Operations Feed
          </div>
          {activities.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>
              No operations activity logged yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 600, overflowY: 'auto' }}>
              {activities.map(a => (
                <div key={a._id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar src={a.user?.avatar} name={a.user?.displayName} size={28} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{a.user?.displayName || 'System'}</span>
                      <span style={{ color: 'var(--t3)', fontSize: 10 }}>{new Date(a.date).toLocaleString()}</span>
                    </div>
                    <p style={{ color: 'var(--t2)', marginTop: 4, lineHeight: 1.4 }}>{a.message}</p>
                    {a.type === 'dm' && a.details && (
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--acc2)', fontWeight: 600, marginTop: 4 }}>
                        <span>Replies: {a.details.replies || 0}</span>
                        <span>·</span>
                        <span>Leads: {a.details.leads || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats Cards */}
          <div className="grid-3">
            <StatCard label="Team Active Tasks" value={analytics.stats?.activeTasks || 0} icon={CheckSquare} color="var(--p)" />
            <StatCard label="Tasks Completed" value={analytics.stats?.completedTasks || 0} icon={Check} color="var(--acc2)" />
            <StatCard label="Average Completion Time" value={`${analytics.stats?.averageCompletionTime || 0} Hours`} icon={Clock} color="var(--gold)" />
          </div>

          {/* Member Metrics Card */}
          <div className="card rs-data-grid-wrap" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
              Member Metrics Performance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', padding: '10px 18px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', minWidth: 720 }}>
              <div>Member</div>
              <div>Assigned Tasks</div>
              <div>Completed Tasks</div>
              <div>Overdue Tasks</div>
              <div>Completion Rate</div>
            </div>
            {analytics.memberMetrics.map(mm => (
              <div key={mm.member._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', padding: '12px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 12.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar src={mm.member.avatar} name={mm.member.displayName} size={28} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{mm.member.displayName}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{mm.member.teamTitle || 'Team Member'}</div>
                  </div>
                </div>
                <div>{mm.assigned}</div>
                <div style={{ color: 'var(--acc2)', fontWeight: 600 }}>{mm.completed}</div>
                <div style={{ color: mm.overdue > 0 ? 'var(--rose)' : 'var(--t3)', fontWeight: 600 }}>{mm.overdue}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={mm.completionRate} max={100} color="var(--p)" height={4} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--p2)', minWidth: 28 }}>{mm.completionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Creation/Editing Modal */}
      <Modal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} title={editingTask ? 'Edit Task Details' : 'Assign New Task'}>
        <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Task Title" value={taskForm.title} onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Outreach 50 creators" required />
          <Textarea label="Task Description" value={taskForm.description} onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Add specific checklist or target notes..." />

          <div className="grid-2" style={{ gap: 12 }}>
            <Select label="Priority" value={taskForm.priority} onChange={e => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>

            <Input label="Due Date" type="date" value={taskForm.dueDate} onChange={e => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))} />
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <Select label="Assign To" value={taskForm.assignedTo[0] || ''} onChange={e => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value ? [e.target.value] : [] }))} required>
              <option value="">Select Member</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.displayName}</option>
              ))}
            </Select>

            <Select label="Linked Campaign (Optional)" value={taskForm.campaign} onChange={e => setTaskForm(prev => ({ ...prev, campaign: e.target.value }))}>
              <option value="">No Campaign Link</option>
              {campaigns.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </Select>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <Select label="Department/Category" value={taskForm.department} onChange={e => setTaskForm(prev => ({ ...prev, department: e.target.value }))}>
              <option value="">Select Department</option>
              <option value="outreach">Outreach</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="support">Support</option>
              <option value="management">Management</option>
            </Select>

            <Input label="Outreach Goal: Target DMs (Optional)" type="number" value={taskForm.targetDMs} onChange={e => setTaskForm(prev => ({ ...prev, targetDMs: e.target.value }))} placeholder="e.g. 100 DMs target" hint="Will automatically link progress from DM reports" />
          </div>

          <Btn variant="primary" type="submit" style={{ marginTop: 10 }}>
            {editingTask ? 'Save Task Updates' : 'Assign Task'}
          </Btn>
        </form>
      </Modal>

      {/* Task Reassignment Modal */}
      <Modal open={reassignModalOpen} onClose={() => setReassignModalOpen(false)} title="Reassign Task Ownership">
        <form onSubmit={handleReassign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>
            Reassign task: <strong>{reassignTaskData?.title}</strong>. Task ownership will update instantly.
          </p>

          <Select label="Assign to New Member" value={newAssigneeId} onChange={e => setNewAssigneeId(e.target.value)} required>
            <option value="">Select Member</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>{m.displayName}</option>
            ))}
          </Select>

          <Btn variant="primary" type="submit">
            Confirm Reassignment
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
