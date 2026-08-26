import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Pin, Trash2, Megaphone, Search, BarChart2, Users, RefreshCw, Send, Shield } from 'lucide-react';
import { ecosystemAPI } from '../../api';
import { Avatar, EmptyState, PageLoader, Modal, renderTextWithLinks } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/* ── Stat card ────────────────────────────────────────── */
function StatCard({ icon, label, value, color='var(--acc)' }) {
  return (
    <div className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, borderRadius: 16 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:22, fontWeight:850, color, fontFamily:'var(--fd)', lineHeight:1.1 }}>{(value || 0).toLocaleString('en-IN')}</div>
        <div style={{ fontSize:12, color:'var(--t2)', marginTop:3, fontWeight:500 }}>{label}</div>
      </div>
    </div>
  );
}

const cleanText = (str) => {
  if (!str) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
};

/* ── Post card ────────────────────────────────────────── */
function PostCard({ post, onDelete, onPin, onAnnounce, onDeleteComment, isAdmin, expandedId, setExpandedId }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const isExpanded = expandedId === post._id;

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const d = await ecosystemAPI.getComments(post._id);
      setComments(d.comments || []);
    } catch(e) {}
    finally { setLoadingComments(false); }
  }, [post._id]);

  const toggleExpand = () => {
    setExpandedId(isExpanded ? null : post._id);
    if (!isExpanded) loadComments();
  };

  const creator = post.creator;
  const creatorRoles = creator?.roles || (creator?.role ? [creator.role] : []);
  const isCreatorAdmin = creatorRoles.some(r => ['admin','superadmin','team_member'].includes(r));

  return (
    <div className="card" style={{ 
      padding:0, 
      overflow:'hidden', 
      borderRadius:16,
      border: post.isPinned ? '1.5px solid var(--gold)' : post.isAnnouncement ? '1.5px solid var(--acc)' : '1px solid var(--border)',
      background: 'var(--s1)'
    }}>
      {/* Post badges */}
      {(post.isPinned || post.isAnnouncement) && (
        <div style={{ padding:'6px 16px', background: post.isAnnouncement ? 'rgba(230,95,43,0.1)' : 'rgba(212,162,76,0.1)', borderBottom:'1px solid var(--border)', display:'flex', gap:10, alignItems:'center' }}>
          {post.isPinned && <span style={{ fontSize:11, color:'var(--gold)', fontWeight:800, display:'flex', alignItems:'center', gap:4 }}><Pin size={11}/>Pinned Post</span>}
          {post.isAnnouncement && <span style={{ fontSize:11, color:'var(--acc)', fontWeight:800, display:'flex', alignItems:'center', gap:4 }}><Megaphone size={11}/>Announcement</span>}
        </div>
      )}

      <div style={{ padding:'18px 20px' }}>
        {/* Author Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flex:'1 1 200px', minWidth:0 }}>
            <Avatar src={creator?.avatar} name={creator?.displayName} size={40}/>
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {cleanText(creator?.displayName || 'Community Member')}
                </span>
                {isCreatorAdmin && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'rgba(230,95,43,0.14)', color:'var(--acc)', fontWeight:800 }}>Staff</span>}
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'rgba(124,139,90,0.14)', color:'var(--acc2)', fontWeight:700 }}>{creator?.rank || 'Creator'}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--t3)', marginTop:2, whiteSpace:'nowrap' }}>
                {new Date(post.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>
          </div>

          {/* Admin action buttons */}
          <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap' }}>
            {isAdmin && (
              <>
                <button onClick={() => onPin(post._id)} title={post.isPinned?'Unpin':'Pin'}
                  style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${post.isPinned?'var(--gold)':'var(--border)'}`, background:post.isPinned?'rgba(212,162,76,0.14)':'transparent', cursor:'pointer', color:post.isPinned?'var(--gold)':'var(--t2)', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                  <Pin size={12}/>{post.isPinned?'Unpin':'Pin'}
                </button>
                <button onClick={() => onAnnounce(post._id)} title={post.isAnnouncement?'Unannounce':'Make Announcement'}
                  style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${post.isAnnouncement?'var(--acc)':'var(--border)'}`, background:post.isAnnouncement?'rgba(230,95,43,0.12)':'transparent', cursor:'pointer', color:post.isAnnouncement?'var(--acc)':'var(--t2)', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                  <Megaphone size={12}/>{post.isAnnouncement?'Unannounce':'Announce'}
                </button>
              </>
            )}
            <button onClick={() => onDelete(post._id)} title="Delete post"
              style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(232,93,69,0.3)', background:'rgba(232,93,69,0.08)', cursor:'pointer', color:'var(--rose)', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
              <Trash2 size={12}/>Delete
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'var(--t1)', marginBottom:6, lineHeight:1.3 }}>
            {cleanText(post.title)}
          </div>
          <div style={{ fontSize:13.5, color:'var(--t2)', lineHeight:1.6, whiteSpace:'pre-line', wordBreak: 'break-word' }}>
            {renderTextWithLinks(cleanText(post.content))}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, fontSize:12, color:'var(--t3)', paddingTop:12, borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontWeight:700, color:'var(--t1)' }}>❤️ {(post.likes||[]).length} Likes</span>
            <span style={{ fontWeight:700, color:'var(--t1)' }}>💬 {post.commentsCount || 0} Comments</span>
            {post.category && (
              <span style={{ background:'rgba(230,95,43,0.12)', color:'var(--acc)', padding:'3px 10px', borderRadius:99, fontWeight:800, fontSize:10 }}>
                {post.category}
              </span>
            )}
          </div>

          <button onClick={toggleExpand}
            style={{ fontSize:12, color:'var(--acc)', background:'none', border:'none', cursor:'pointer', fontWeight:800, padding:0 }}>
            {isExpanded ? 'Hide Comments ▲' : `View Comments (${post.commentsCount||0}) ▼`}
          </button>
        </div>

        {/* Comments section */}
        {isExpanded && (
          <div style={{ marginTop:14, borderTop:'1px solid var(--border)', paddingTop:12 }}>
            {loadingComments ? (
              <div style={{ textAlign:'center', padding:'12px 0', color:'var(--t3)', fontSize:12 }}>Loading comments…</div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign:'center', padding:'12px 0', color:'var(--t3)', fontSize:12 }}>No comments on this post yet.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {comments.map(comment => (
                  <div key={comment._id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'6px 0' }}>
                    <Avatar src={comment.sender?.avatar} name={comment.sender?.displayName} size={26}/>
                    <div style={{ flex:1, background:'var(--s2)', borderRadius:10, padding:'8px 12px' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)', marginBottom:2 }}>{cleanText(comment.sender?.displayName)}</div>
                      <div style={{ fontSize:12.5, color:'var(--t2)', lineHeight:1.5, wordBreak: 'break-word' }}>{renderTextWithLinks(cleanText(comment.text))}</div>
                    </div>
                    <button onClick={() => onDeleteComment(comment._id, post._id)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--rose)', padding:4, flexShrink:0 }} title="Delete comment">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════ */
export default function CommunityAdmin() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin');

  const [posts,       setPosts]       = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [expandedId,  setExpandedId]  = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [form,        setForm]        = useState({ title:'', content:'', category:'General', isAnnouncement:false });
  const [saving,      setSaving]      = useState(false);

  const categories = ['All', 'Announcement', 'General', 'Tips', 'Showcase', 'Question', 'News'];

  /* Load posts */
  const loadPosts = useCallback(async (pg=1) => {
    setLoading(true);
    try {
      const d = await ecosystemAPI.getAdminPosts({ page:pg, limit:15, search:search||undefined });
      let list = d.posts || [];
      if (selectedCat !== 'All') {
        list = list.filter(p => p.category === selectedCat || (selectedCat === 'Announcement' && p.isAnnouncement));
      }
      setPosts(list);
      setTotal(d.total || 0);
    } catch(e) { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [search, selectedCat]);

  /* Load community analytics */
  const loadStats = useCallback(async () => {
    try {
      const d = await ecosystemAPI.getCommunityAnalytics();
      setStats(d.stats);
    } catch(e) {}
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadPosts(1); }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, selectedCat, loadPosts]);

  /* Actions */
  const handleDelete = async (postId) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await ecosystemAPI.deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success('Post deleted');
      loadStats();
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  const handlePin = async (postId) => {
    try {
      const d = await ecosystemAPI.pinPost(postId);
      setPosts(prev => prev.map(p => p._id===postId ? { ...p, isPinned:d.isPinned } : p));
      toast.success(d.isPinned ? 'Post pinned 📌' : 'Post unpinned');
    } catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleAnnounce = async (postId) => {
    try {
      const d = await ecosystemAPI.announcePost(postId);
      setPosts(prev => prev.map(p => p._id===postId ? { ...p, isAnnouncement:d.isAnnouncement } : p));
      toast.success(d.isAnnouncement ? 'Marked as announcement 📢' : 'Announcement removed');
    } catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await ecosystemAPI.deleteComment(commentId);
      setPosts(prev => prev.map(p => p._id===postId ? { ...p, commentsCount: Math.max(0,(p.commentsCount||1)-1) } : p));
      toast.success('Comment deleted');
    } catch(e) { toast.error('Failed to delete comment'); }
  };

  const handleCreatePost = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content required');
    setSaving(true);
    try {
      await ecosystemAPI.createPost(form);
      toast.success('Post created!');
      setShowCreate(false);
      setForm({ title:'', content:'', category:'General', isAnnouncement:false });
      loadPosts(1);
      loadStats();
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to create post'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-enter">
      {/* ── Community Management Header ────────────────── */}
      <div 
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
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: 'rgba(230,95,43,0.14)', color: 'var(--acc)', border: '1px solid rgba(230,95,43,0.3)', textTransform: 'uppercase' }}>
              Moderation Hub
            </span>
            <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>
              {total} Total Posts
            </span>
          </div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={28} style={{ color: 'var(--acc)' }} /> Community <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc)', fontSize: '1.2em' }}>Management</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13.5, margin: '4px 0 0 0', fontWeight: 500 }}>
            Moderate creator discussions, announce community updates, and manage comments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { loadPosts(page); loadStats(); }} className="btn btn-secondary btn-sm" style={{ padding: '10px 16px', borderRadius: 10, fontWeight: 700 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm" style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}>
              <Send size={14} /> Post Announcement
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-2-mobile" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 }}>
          <StatCard icon="📝" label="Total Community Posts" value={stats.totalPosts} color="var(--acc)"/>
          <StatCard icon="💬" label="Total User Comments" value={stats.totalComments} color="var(--gold)"/>
          <StatCard icon="📅" label="Posts Today" value={stats.postsToday} color="#10b981"/>
          <StatCard icon="📈" label="Posts This Week" value={stats.postsThisWeek} color="#6366f1"/>
        </div>
      )}

      {/* Category Pills & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search posts or creators..." 
            className="form-input" 
            style={{ paddingLeft: 36, height: 40, fontSize: 13, borderRadius: 10 }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const isActive = selectedCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  background: isActive ? 'var(--acc)' : 'var(--s2)',
                  color: isActive ? '#ffffff' : 'var(--t2)',
                  border: isActive ? '1px solid var(--acc)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info banner for team members */}
      {!isAdmin && (
        <div className="card" style={{ padding:'12px 16px', marginBottom:20, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius: 12, display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--t1)' }}>
          <Shield size={16} style={{ color:'#6366f1', flexShrink:0 }}/>
          <span>You can moderate, delete, and manage community posts and comments. Pinning and announcement toggles are reserved for admins.</span>
        </div>
      )}

      {/* Posts List */}
      {loading ? <PageLoader/>
        : posts.length === 0
          ? <EmptyState icon="💬" title="No community posts found" desc={search || selectedCat !== 'All' ? 'Try adjusting your filters or search' : 'The creator community is quiet right now.'}/>
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onAnnounce={handleAnnounce}
                  onDeleteComment={handleDeleteComment}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                />
              ))}

              {/* Pagination */}
              {total > 15 && (
                <div style={{ display:'flex', gap:10, justifyContent:'center', alignItems: 'center', padding:'16px 0' }}>
                  <button onClick={() => { const p = Math.max(1,page-1); setPage(p); loadPosts(p); }} disabled={page===1} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', borderRadius: 8 }}>← Prev</button>
                  <span style={{ fontSize:13, fontWeight: 700, color:'var(--t1)' }}>Page {page} of {Math.ceil(total/15)}</span>
                  <button onClick={() => { const p = page+1; setPage(p); loadPosts(p); }} disabled={posts.length<15} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', borderRadius: 8 }}>Next →</button>
                </div>
              )}
            </div>
          )
      }

      {/* Create Announcement Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm({ title:'', content:'', category:'General', isAnnouncement:false }); }} title="📢 Create Post / Announcement" maxWidth={520}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight:700 }}>Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Announcement or discussion title..." style={{ height:42, borderRadius:10 }}/>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight:700 }}>Content *</label>
            <textarea className="form-input" value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))} placeholder="Write your message to the creator community..." style={{ minHeight:120, resize:'vertical', borderRadius:10 }}/>
          </div>
          <div className="rs-cols-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight:700 }}>Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} style={{ height:42, borderRadius:10 }}>
                {['General','Announcement','Tips','Showcase','Question','News'].map(c => (
                  <option key={c} value={c} style={{ background:'var(--s2)' }}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight:700 }}>Post Option</label>
              <label style={{ display:'flex', alignItems:'center', gap:10, height:42, padding:'0 12px', borderRadius:10, border:`1.5px solid ${form.isAnnouncement?'var(--acc)':'var(--border)'}`, cursor:'pointer', background:form.isAnnouncement?'rgba(230,95,43,0.1)':'transparent', transition:'all 0.18s ease' }}>
                <input type="checkbox" checked={form.isAnnouncement} onChange={e => setForm(p=>({...p,isAnnouncement:e.target.checked}))}/>
                <span style={{ fontSize:13, color:form.isAnnouncement?'var(--acc)':'var(--t1)', fontWeight:form.isAnnouncement?800:600 }}>📢 Announcement</span>
              </label>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'flex-end', borderTop:'1px solid var(--border)', paddingTop:16 }}>
            <button onClick={() => setShowCreate(false)} className="btn btn-secondary" style={{ borderRadius:10, padding:'10px 18px' }}>Cancel</button>
            <button onClick={handleCreatePost} disabled={saving || !form.title.trim() || !form.content.trim()} className="btn btn-primary" style={{ borderRadius:10, padding:'10px 20px', fontWeight:750 }}>
              {saving ? 'Posting…' : 'Post to Community'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
