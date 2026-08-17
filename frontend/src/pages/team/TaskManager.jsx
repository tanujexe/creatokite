import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Clock, Trash2, Send, ChevronDown, Filter, Bell } from 'lucide-react';
import { tasksAPI, adminAPI, workspaceAPI } from '../../api';
import { Modal, EmptyState, Avatar, PageLoader } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLS = [
  { key:'backlog',     label:'Backlog',     color:'var(--t3)'   },
  { key:'todo',        label:'To Do',       color:'var(--gold)' },
  { key:'in_progress', label:'In Progress', color:'#6366f1'     },
  { key:'review',      label:'In Review',   color:'var(--acc)'  },
  { key:'done',        label:'Done',        color:'var(--acc2)' },
  { key:'blocked',     label:'Blocked',     color:'var(--rose)' },
];

const PRI_OPT = ['low','medium','high','urgent'];
const PRI_CLR = { low:'var(--t3)', medium:'var(--gold)', high:'var(--p)', urgent:'var(--rose)' };

const EMPTY_FORM = {
  title: '', description: '', priority: 'medium',
  assignedTo: [], dueDate: '', tags: '', campaign: '',
};

export default function TaskManager() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin');

  const [tasks,      setTasks]      = useState([]);
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [comments,   setComments]   = useState({});
  const [expanded,   setExpanded]   = useState({});

  const canCreate = isAdmin || hasRole('team_member');

  /* ── Load team members for assignment ─────────────── */
  useEffect(() => {
    if (!canCreate) return;
    const fetchMembers = isAdmin
      ? adminAPI.users({ role:'team_member', limit:50 }).then(d => d.users || [])
      : workspaceAPI.team().then(d => d.members || []);
    fetchMembers.then(setMembers).catch(() => {});
  }, [isAdmin, canCreate]);

  /* ── Load tasks ───────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit:100 };
      if (filter === 'mine')    params.assignedTo = user._id;
      if (filter === 'created') params.createdBy  = user._id;
      const d = await tasksAPI.list(params);
      setTasks(d.tasks || []);
    } catch(e) { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filter, user._id]);

  useEffect(() => { load(); }, [filter, load]);

  /* ── Create task ──────────────────────────────────── */
  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await tasksAPI.create({
        ...form,
        assignedTo: form.assignedTo,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('✅ Task created!');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to create task'); }
    finally { setSaving(false); }
  };

  /* ── Change status ────────────────────────────────── */
  const handleStatus = async (id, status) => {
    try {
      await tasksAPI.update(id, { status });
      setTasks(prev => prev.map(t => t._id===id ? { ...t, status } : t));
      if (status === 'done') toast.success('Task marked done! ✅');
    } catch(e) { toast.error('Update failed'); }
  };

  /* ── Delete task ──────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!confirm('Archive this task?')) return;
    try {
      await tasksAPI.delete(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Archived');
    } catch(e) { toast.error('Failed'); }
  };

  /* ── Add comment ──────────────────────────────────── */
  const handleComment = async (taskId) => {
    const text = comments[taskId]?.trim();
    if (!text) return;
    try {
      await tasksAPI.comment(taskId, { text });
      setComments(p => ({ ...p, [taskId]: '' }));
      load();
    } catch(e) { toast.error('Comment failed'); }
  };

  /* ── Toggle assignee ──────────────────────────────── */
  const toggleAssignee = (memberId) => {
    setForm(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberId)
        ? prev.assignedTo.filter(id => id !== memberId)
        : [...prev.assignedTo, memberId],
    }));
  };

  /* ── Group by status ──────────────────────────────── */
  const grouped = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const totalByFilter = {
    all: tasks.length,
    mine: tasks.filter(t => (t.assignedTo||[]).some(u => (u._id||u)===user._id)).length,
    created: tasks.filter(t => (t.createdBy?._id||t.createdBy)===user._id).length,
  };

  if (loading) return <PageLoader/>;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:'clamp(18px,4vw,24px)', fontWeight:800 }}>
            Task Manager
          </h1>
          <p style={{ color:'var(--t2)', fontSize:13, marginTop:4 }}>
            {tasks.length} tasks · {isAdmin ? 'Assign and track team tasks' : 'Your task board'}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {(['all','mine','created']).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`}>
              {f==='all' ? `All (${totalByFilter.all})` : f==='mine' ? `Mine (${totalByFilter.mine})` : `Created (${totalByFilter.created})`}
            </button>
          ))}
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">
              <Plus size={13}/>New Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {tasks.length === 0 ? (
        <EmptyState icon="✅" title="No tasks found" desc={isAdmin ? 'Create the first task for your team' : 'No tasks assigned to you yet'}/>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14, alignItems:'start' }}>
          {STATUS_COLS.map(col => (
            <div key={col.key} className="card" style={{ padding:'14px 12px' }}>
              {/* Column header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:col.color, flexShrink:0 }}/>
                  <span style={{ fontWeight:700, fontSize:12, color:'var(--t1)' }}>{col.label}</span>
                </div>
                <span style={{ fontSize:11, color:'var(--t3)', background:'rgba(255,255,255,0.06)', padding:'2px 7px', borderRadius:99 }}>{grouped[col.key]?.length||0}</span>
              </div>

              {/* Task cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, minHeight:40 }}>
                {(grouped[col.key]||[]).map(task => (
                  <div key={task._id}
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px', transition:'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor=col.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                  >
                    {/* Title + priority */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
                      <div style={{ flex:1, fontSize:12, fontWeight:600, color:'var(--t1)', lineHeight:1.4 }}>{task.title}</div>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:PRI_CLR[task.priority]||'var(--t3)', flexShrink:0, marginTop:3 }}/>
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color: new Date(task.dueDate)<new Date()&&task.status!=='done'?'var(--rose)':'var(--t3)', marginTop:5 }}>
                        <Clock size={9}/>{new Date(task.dueDate).toLocaleDateString('en-IN')}
                      </div>
                    )}

                    {/* Assignees */}
                    {(task.assignedTo||[]).length > 0 && (
                      <div style={{ display:'flex', gap:3, marginTop:6, flexWrap:'wrap', alignItems:'center' }}>
                        {task.assignedTo.slice(0,4).map(u => (
                          <Avatar key={u._id||u} src={u.avatar} name={u.displayName} size={18} style={{ border:'1.5px solid var(--border)' }}/>
                        ))}
                        {task.assignedTo.length > 4 && <span style={{ fontSize:9, color:'var(--t3)' }}>+{task.assignedTo.length-4}</span>}
                      </div>
                    )}

                    {/* Tags */}
                    {(task.tags||[]).length > 0 && (
                      <div style={{ display:'flex', gap:3, marginTop:5, flexWrap:'wrap' }}>
                        {task.tags.slice(0,2).map(tag => (
                          <span key={tag} style={{ fontSize:9, padding:'1px 5px', borderRadius:99, background:'rgba(255,107,87,0.1)', color:'var(--p)', fontWeight:600 }}>{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:3, marginTop:8, flexWrap:'wrap' }}>
                      {STATUS_COLS.filter(s => s.key !== col.key).slice(0,3).map(s => (
                        <button key={s.key} onClick={() => handleStatus(task._id, s.key)}
                          style={{ fontSize:9, padding:'2px 5px', borderRadius:99, border:`1px solid ${s.color}30`, color:s.color, background:`${s.color}10`, cursor:'pointer', whiteSpace:'nowrap' }}>
                          →{s.label}
                        </button>
                      ))}
                      {isAdmin && (
                        <button onClick={() => handleDelete(task._id)}
                          style={{ fontSize:9, padding:'2px 5px', borderRadius:99, border:'1px solid rgba(232,93,69,0.3)', color:'var(--rose)', background:'rgba(232,93,69,0.08)', cursor:'pointer', marginLeft:'auto' }}>
                          <Trash2 size={8}/>
                        </button>
                      )}
                    </div>

                    {/* Inline comment */}
                    <div style={{ marginTop:8, display:'flex', gap:5 }}>
                      <input
                        value={comments[task._id]||''}
                        onChange={e => setComments(p => ({ ...p, [task._id]: e.target.value }))}
                        placeholder="Add comment…"
                        style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', fontSize:10, color:'var(--t1)', outline:'none' }}
                        onKeyDown={e => { if (e.key==='Enter') handleComment(task._id); }}
                      />
                      <button onClick={() => handleComment(task._id)}
                        style={{ background:'var(--p)', border:'none', borderRadius:6, padding:'4px 7px', cursor:'pointer', color:'#fff', flexShrink:0 }}>
                        <Send size={9}/>
                      </button>
                    </div>
                    {(task.comments||[]).length > 0 && (
                      <div style={{ marginTop:4, fontSize:10, color:'var(--t3)' }}>
                        💬 {task.comments.length} comment{task.comments.length>1?'s':''}
                      </div>
                    )}
                  </div>
                ))}
                {(grouped[col.key]||[]).length === 0 && (
                  <div style={{ padding:'12px 6px', textAlign:'center', color:'var(--t3)', fontSize:11, opacity:0.5 }}>Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Task Modal ─────────────────────────── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(EMPTY_FORM); }} title="Create New Task" maxWidth={500}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="What needs to be done?"/>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Optional details…" style={{ minHeight:70, resize:'vertical' }}/>
          </div>

          <div className="rs-cols-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm(p=>({...p,priority:e.target.value}))}>
                {PRI_OPT.map(v => (
                  <option key={v} value={v} style={{ background:'var(--s2)' }}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>
                ))}
              </select>
            </div>
            {/* Due date */}
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(p=>({...p,dueDate:e.target.value}))}/>
            </div>
          </div>

          {/* Assign to — admin sees team member checkboxes */}
          <div className="form-group">
            <label className="form-label">
              Assign To {form.assignedTo.length > 0 && <span style={{ color:'var(--p)', fontWeight:700 }}>({form.assignedTo.length} selected)</span>}
            </label>
            {members.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--t3)', padding:'8px 0' }}>No team members found</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:180, overflowY:'auto', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:8 }}>
                {members.map(m => {
                  const isSelected = form.assignedTo.includes(m._id);
                  return (
                    <label key={m._id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:'var(--r)', cursor:'pointer', background: isSelected ? 'rgba(255,107,87,0.06)' : 'transparent', border:`1px solid ${isSelected?'var(--p)':'transparent'}`, transition:'all 0.1s' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleAssignee(m._id)} style={{ flexShrink:0 }}/>
                      <Avatar src={m.avatar} name={m.displayName} size={22}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:isSelected?700:400, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.displayName}</div>
                        <div style={{ fontSize:10, color:'var(--t3)' }}>{m.teamTitle || m.role || 'Team Member'}</div>
                      </div>
                      {isSelected && <span style={{ fontSize:9, color:'var(--p)', fontWeight:700, flexShrink:0 }}>✓</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags <span style={{ color:'var(--t3)', fontWeight:400 }}>(comma separated)</span></label>
            <input className="form-input" value={form.tags} onChange={e => setForm(p=>({...p,tags:e.target.value}))} placeholder="outreach, campaign, follow-up"/>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', borderTop:'1px solid var(--border)', paddingTop:12 }}>
            <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreate} className="btn btn-primary" disabled={saving || !form.title.trim()}>
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
