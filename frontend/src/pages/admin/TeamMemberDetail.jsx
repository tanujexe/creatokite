import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckSquare, Activity, Plus, Calendar,
  AlertCircle, Edit, Trash2, Check, Clock, AlertOctagon, RefreshCw, User, Mail, Briefcase, Zap
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

export default function TeamMemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Member states
  const [member, setMember] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // Reference tables for modals
  const [members, setMembers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // Filters for member task list
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
    assignedTo: [id], // pre-filled with current member ID
    dueDate: '',
    campaign: '',
    department: '',
    targetDMs: 0
  });

  const [reassignTaskData, setReassignTaskData] = useState(null);
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [memberRes, membersRes, campaignsRes] = await Promise.all([
        teamManagementAPI.getMember(id),
        teamManagementAPI.getMembers(),
        campaignsAPI.list({ limit: 100 })
      ]);
      setMember(memberRes.member);
      setStats(memberRes.stats);
      setTasks(memberRes.tasks || []);
      setTimeline(memberRes.timeline || []);

      setMembers(membersRes.members || []);
      setCampaigns(campaignsRes.campaigns || []);
    } catch (e) {
      toast.error('Failed to load team member details');
      navigate('/admin/team-management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

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
      // Reload stats
      const memberRes = await teamManagementAPI.getMember(id);
      setStats(memberRes.stats);
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
      assignedTo: [id],
      dueDate: '',
      campaign: '',
      department: '',
      targetDMs: 0
    });
  };

  const openCreateTask = () => {
    resetTaskForm();
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

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await teamManagementAPI.deleteTask(taskId);
      toast.success('Task deleted successfully!');
      setTasks(prev => prev.filter(t => t._id !== taskId));
      const memberRes = await teamManagementAPI.getMember(id);
      setStats(memberRes.stats);
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
      await teamManagementAPI.updateTask(reassignTaskData._id, {
        assignedTo: [newAssigneeId]
      });
      toast.success('Task reassigned successfully!');
      setReassignModalOpen(false);
      setReassignTaskData(null);
      setNewAssigneeId('');
      // Reload member data since the task is no longer assigned to this member
      loadData();
    } catch (e) {
      toast.error('Reassignment failed');
    }
  };

  const toggleTaskStatus = async (task, newStatus) => {
    try {
      const res = await teamManagementAPI.updateTask(task._id, { status: newStatus });
      toast.success(`Task status updated to ${newStatus}!`);
      setTasks(prev => prev.map(t => t._id === task._id ? res.task : t));
      const memberRes = await teamManagementAPI.getMember(id);
      setStats(memberRes.stats);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterDept && t.department?.toLowerCase() !== filterDept.toLowerCase()) return false;
    if (taskSearch && !t.title.toLowerCase().includes(taskSearch.toLowerCase())) return false;
    return true;
  });

  const now = new Date();

  if (loading) return <PageLoader />;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back button */}
      <div>
        <Btn onClick={() => navigate('/admin/team-management')} variant="ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', height: 36, width: 'fit-content' }}>
          <ChevronLeft size={16} /> Back to Directory
        </Btn>
      </div>

      {/* Profile Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(212,162,76,0.04))',
        border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '24px 28px',
        display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <Avatar src={member.avatar} name={member.displayName} size={64} style={{ border: '2px solid var(--p)' }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 800 }}>{member.displayName}</h2>
            <StatusBadge status={member.availability || 'available'} />
          </div>
          
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--t2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} style={{ color: 'var(--t3)' }} />
              {member.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={13} style={{ color: 'var(--t3)' }} />
              <span style={{ textTransform: 'capitalize' }}>{member.role?.replace('_', ' ')}</span>
              {member.teamTitle && ` (${member.teamTitle})`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} style={{ color: 'var(--t3)' }} />
              Department: <strong>{member.teamDepartment || 'General'}</strong>
            </div>
          </div>
          
          {member.lastLoginDate && (
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
              Last login: {new Date(member.lastLoginDate).toLocaleString('en-IN')}
            </div>
          )}
        </div>
        <div>
          <Btn onClick={() => loadData()} variant="ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', height: 36 }}>
            <RefreshCw size={13} /> Reload
          </Btn>
        </div>
      </div>

      {/* Member Task Stats Row */}
      <div className="grid-4">
        <StatCard label="Total Assigned Tasks" value={stats?.total || 0} icon={CheckSquare} color="var(--p)" />
        <StatCard label="Tasks Completed" value={stats?.completed || 0} icon={Check} color="var(--acc2)" />
        <StatCard label="Tasks In Progress" value={stats?.inProgress || 0} icon={Clock} color="var(--gold)" />
        <StatCard label="Overdue Tasks" value={stats?.overdue || 0} icon={AlertOctagon} color={stats?.overdue > 0 ? 'var(--rose)' : 'var(--t3)'} />
      </div>

      {/* Main Panel Content: Tasks & Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 20, alignItems: 'flex-start' }} className="responsive-grid rs-main-aside">
        
        {/* Left Column: Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Tasks Filters Card */}
          <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 18px', alignItems: 'center', justifyContent: 'space-between' }}>
            <SearchBar value={taskSearch} onChange={e => setTaskSearch(e.target.value)} placeholder="Search tasks..." style={{ flex: 1, minWidth: 180 }} />
            
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: 120, height: 38, fontSize: 11, padding: '0 8px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Completed</option>
                <option value="blocked">Blocked</option>
              </select>

              <select className="form-input" style={{ width: 120, height: 38, fontSize: 11, padding: '0 8px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select className="form-input" style={{ width: 130, height: 38, fontSize: 11, padding: '0 8px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="">Department</option>
                <option value="outreach">Outreach</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="support">Support</option>
                <option value="management">Management</option>
              </select>

              {(filterStatus || filterPriority || filterDept || taskSearch) && (
                <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterDept(''); setTaskSearch(''); }} className="btn btn-ghost btn-sm" style={{ padding: '0 10px', height: 38, fontSize: 11 }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tasks List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Assigned Tasks ({filteredTasks.length})</span>
              <Btn onClick={openCreateTask} variant="primary" size="sm" style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, fontSize: 11 }}>
                <Plus size={12} /> Assign Task
              </Btn>
            </div>

            {filteredTasks.length === 0 ? (
              <EmptyState icon="📋" title="No tasks found" desc="This member has no active tasks matching your filter criteria." />
            ) : (
              <div className="rs-data-grid-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr', padding: '10px 18px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>
                  <div>Task Detail</div>
                  <div>Category</div>
                  <div>Outreach / Goal</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {filteredTasks.map(t => {
                  const isOverdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now;
                  const isHigh = t.priority === 'high' || t.priority === 'urgent';
                  return (
                    <div key={t._id} style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr', padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 12.5,
                      background: isOverdue ? 'rgba(232,93,69,0.02)' : ''
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{t.title}</span>
                          {isOverdue && <span style={{ color: 'var(--rose)', fontSize: 8, fontWeight: 700, background: 'rgba(232,93,69,0.1)', padding: '1px 4px', borderRadius: 4 }}>OVERDUE</span>}
                          {isHigh && <span style={{ color: 'var(--rose)', fontSize: 8, fontWeight: 700, background: 'rgba(232,93,69,0.1)', padding: '1px 4px', borderRadius: 4 }}>HIGH</span>}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>
                          {t.campaign?.title ? `Campaign: ${t.campaign.title}` : 'General Admin Task'}
                          {t.dueDate && ` · Due: ${new Date(t.dueDate).toLocaleDateString('en-IN')}`}
                        </div>
                      </div>

                      <div style={{ color: 'var(--t2)', textTransform: 'capitalize' }}>
                        {t.department || 'General'}
                      </div>

                      <div>
                        {t.outreachGoal?.targetDMs > 0 ? (
                          <div style={{ width: '90%' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--acc2)', marginBottom: 2 }}>
                              {t.outreachGoal.currentDMs} / {t.outreachGoal.targetDMs} DMs
                            </div>
                            <ProgressBar value={t.outreachGoal.currentDMs} max={t.outreachGoal.targetDMs} color="var(--acc2)" height={3} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 9, color: PRIORITY_COLORS[t.priority], background: `${PRIORITY_COLORS[t.priority]}15`, padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>
                              {t.priority}
                            </span>
                            <span style={{ fontSize: 9, color: STATUS_COLORS[t.status], background: `${STATUS_COLORS[t.status]}15`, padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>
                              {t.status?.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
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
                          <Edit size={11} />
                        </button>
                        <button onClick={() => handleDeleteTask(t._id)} className="btn btn-ghost btn-sm" style={{ padding: 4, height: 26, color: 'var(--rose)' }} title="Delete">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline / Activity Feed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={14} style={{ color: 'var(--p)' }} />
            <span>Activity Timeline</span>
          </div>

          {timeline.length === 0 ? (
            <p style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>
              No operations activity logged yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 650, overflowY: 'auto', padding: '18px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, borderLeft: '2px solid var(--border)', paddingLeft: 18, position: 'relative' }}>
                {timeline.map((item, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    {/* Circle Bullet */}
                    <div style={{
                      position: 'absolute',
                      left: -27,
                      top: 2,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: item.type === 'dm' ? 'var(--acc2)' : 'var(--p)',
                      border: '3px solid var(--s2)'
                    }} />

                    <div>
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 500 }}>
                          {new Date(item.date).toLocaleString('en-IN')}
                        </span>
                        {item.type === 'dm' && (
                          <span className="badge badge-green" style={{ fontSize: 9 }}>DM TRACKER</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.4, margin: 0 }}>
                        {item.message}
                      </p>
                      {item.type === 'dm' && item.details && (
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--acc2)', fontWeight: 600, marginTop: 4 }}>
                          <span>Replies: {item.details.replies || 0}</span>
                          <span>·</span>
                          <span>Interested Leads: {item.details.leads || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
            <Select label="Assign To" value={taskForm.assignedTo[0] || ''} onChange={e => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value ? [e.target.value] : [] }))} required disabled>
              <option value={member._id}>{member.displayName}</option>
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
            {members.filter(m => m._id !== member._id).map(m => (
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
