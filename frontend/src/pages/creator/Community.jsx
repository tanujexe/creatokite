import { useState, useEffect } from 'react';
import { ecosystemAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader, Btn, Avatar, Input, Textarea, renderTextWithLinks } from '../../components/ui';
import toast from 'react-hot-toast';
import { MessageSquare, ThumbsUp, Send, Share2, Plus, Sparkles, Megaphone } from 'lucide-react';
import CreatorShell from './CreatorShell';

const CATEGORIES = ['General', 'Knowledge Sharing', 'Q&A', 'Feedback'];

function decodeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  
  // Create post states
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postCat, setPostCat] = useState('General');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  // Comments state
  const [activePostId, setActivePostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPosts = () => {
    ecosystemAPI.getPosts({
      category: category === 'all' ? undefined : category,
      search: search || undefined
    })
      .then(d => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, [category, search]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }
    setCreating(true);
    
    // Filter out blank poll options
    const activePolls = pollOptions.filter(o => o.trim() !== '');

    try {
      await ecosystemAPI.createPost({
        title,
        content,
        category: postCat,
        pollOptions: activePolls.length > 0 ? activePolls : undefined
      });
      toast.success('Post created! +10 XP awarded.');
      setShowCreate(false);
      setTitle('');
      setContent('');
      setPollOptions(['', '']);
      fetchPosts();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const res = await ecosystemAPI.likePost(id);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, likes: res.likes } : p));
    } catch(e) {}
  };

  const handleVote = async (postId, optionIndex) => {
    try {
      const res = await ecosystemAPI.votePoll(postId, { optionIndex });
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, pollOptions: res.pollOptions } : p));
      toast.success('Vote counted!');
    } catch(e) {}
  };

  const openComments = async (postId) => {
    setActivePostId(postId);
    setCommentText('');
    try {
      const res = await ecosystemAPI.getComments(postId);
      setComments(res.comments || []);
    } catch(e) {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await ecosystemAPI.addComment(activePostId, { text: commentText });
      setComments(prev => [...prev, res.comment]);
      setCommentText('');
      setPosts(prev => prev.map(p => p._id === activePostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      toast.success('Comment added!');
    } catch(err) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading && posts.length === 0) return <PageLoader />;

  return (
    <CreatorShell className="rs-main-aside" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
      
      {/* Social Feed (Left Column) */}
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Search and Action Bar */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <input className="form-input" style={{ flex:1, minWidth:200, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }}
            placeholder="🔍 Search posts or discussions..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <Btn variant="primary" style={{ display:'flex', alignItems:'center', gap:6, height: 40, borderRadius: 10, padding: '0 20px' }} onClick={() => setShowCreate(true)}>
            <Plus size={15}/> Create Post
          </Btn>
        </div>

        {/* Create Post Card Toggle */}
        {showCreate && (
          <div className="card" style={{ border:'1px solid rgba(108,99,255,0.22)', background:'var(--glass-bg)', backdropFilter:'var(--glass-blur)', WebkitBackdropFilter:'var(--glass-blur)', borderRadius: 20, padding: 24, boxShadow: 'var(--glass-shadow)' }}>
            <h3 style={{ fontSize:15, fontWeight:800, marginBottom:16, fontFamily: 'var(--fh)' }}>New Discussion</h3>
            <form onSubmit={handleCreatePost} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="grid-2" style={{ gap:16 }}>
                <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="What is on your mind?" />
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, display: 'block' }}>Category</label>
                  <select className="form-input" value={postCat} onChange={e => setPostCat(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Textarea label="Discussion Content" value={content} onChange={e => setContent(e.target.value)} placeholder="Share your experience, ask questions, or link guides..." style={{ minHeight:100 }} />
              
              {/* Optional Poll Fields */}
              <div style={{ background:'rgba(255,255,255,0.01)', padding:16, borderRadius:12, border:'1px solid var(--border)' }}>
                <h4 style={{ fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:12, textTransform: 'uppercase', letterSpacing: 0.3 }}>📊 Create a Poll (Optional)</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {pollOptions.map((opt, oIdx) => (
                    <input key={oIdx} className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)', fontSize:12 }}
                      placeholder={`Option ${oIdx+1}`} value={opt}
                      onChange={e => {
                        const copy = [...pollOptions];
                        copy[oIdx] = e.target.value;
                        setPollOptions(copy);
                      }} />
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize:11, alignSelf:'flex-start', border: '1px dashed var(--border)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => setPollOptions(prev => [...prev, ''])}>
                    + Add Option
                  </button>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
                <Btn variant="secondary" type="button" onClick={() => setShowCreate(false)} style={{ height: 34, borderRadius: 8, padding: '0 16px' }}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={creating} style={{ height: 34, borderRadius: 8, padding: '0 16px' }}>
                  {creating ? 'Posting...' : 'Publish Post'}
                </Btn>
              </div>
            </form>
          </div>
        )}

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="card" style={{ padding:40, textAlign:'center', color:'var(--t3)', borderRadius: 20, fontWeight: 500 }}>
            No discussions found. Start a new conversation!
          </div>
        ) : (
          posts.map(post => {
            const hasLiked = post.likes?.includes(user?._id);
            const totalVotes = post.pollOptions?.reduce((s, o) => s + (o.votes?.length || 0), 0) || 0;

            return (
              <div key={post._id} style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: post.isAnnouncement ? '1px solid rgba(255,107,87,0.25)' : '1px solid var(--glass-border)',
                borderRadius: 20,
                padding: 24,
                boxShadow: 'var(--glass-shadow)',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                {/* Author Info */}
                {(() => {
                  const isOfficial = post.creator?.role === 'superadmin' || post.creator?.role === 'admin' || post.isAnnouncement;
                  const authorAvatar = isOfficial ? '/logo.jpeg' : post.creator?.avatar;
                  const authorName   = isOfficial ? 'CreatoKite' : post.creator?.displayName;
                  const authorHandle = isOfficial ? 'creatokite' : (post.creator?.handle || 'creator');

                  return (
                    <div className="flex-between" style={{ marginBottom:14, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <Avatar src={authorAvatar} name={authorName} size={40} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6, color: 'var(--t1)', fontFamily: 'var(--fh)' }}>
                            {authorName}
                            {isOfficial ? (
                              <span style={{ fontSize:9, padding: '2px 8px', borderRadius: 99, background: 'rgba(230,95,43,0.12)', color: 'var(--acc)', border: '1px solid rgba(230,95,43,0.25)', fontWeight: 800 }}>
                                OFFICIAL
                              </span>
                            ) : null}
                          </div>
                          <div style={{ fontSize:11, color:'var(--t3)', fontWeight: 500 }}>
                            @{authorHandle} {isOfficial ? '· Official Team' : `· ${post.creator?.rank || 'Bronze'}`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {post.isAnnouncement && (
                          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, padding: '3px 9px', borderRadius: 99, background: 'rgba(212,162,76,0.15)', color: 'var(--gold)', border: '1px solid rgba(212,162,76,0.25)', fontWeight: 800 }}>
                            <Megaphone size={10} /> ANNOUNCEMENT
                          </span>
                        )}
                        <span style={{ fontSize:9, padding: '3px 9px', borderRadius: 99, background: 'rgba(74,62,61,0.06)', color: 'var(--t2)', border: '1px solid var(--border)', fontWeight: 700 }}>{post.category}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Content */}
                <h3 style={{ fontSize:15, fontWeight:800, marginBottom:10, color:'var(--t1)', fontFamily: 'var(--fh)' }}>{decodeHTML(post.title)}</h3>
                <div style={{ fontSize:12.5, color:'var(--t2)', lineHeight:1.6, whiteSpace:'pre-line', marginBottom:18, fontWeight: 500, wordBreak: 'break-word' }}>
                  {renderTextWithLinks(decodeHTML(post.content))}
                </div>

                {/* Optional Poll Rendering */}
                {post.pollOptions && post.pollOptions.length > 0 && (
                  <div style={{ background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', padding:16, borderRadius:12, marginBottom:18, display:'flex', flexDirection:'column', gap:10 }}>
                    {post.pollOptions.map((opt, oIdx) => {
                      const voteCount = opt.votes?.length || 0;
                      const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                      const hasVoted = opt.votes?.includes(user?._id);

                      return (
                        <div key={oIdx} onClick={() => handleVote(post._id, oIdx)}
                          style={{
                            position:'relative', display:'flex', justifyContent:'space-between',
                            padding:'12px 14px', border:'1px solid var(--border)', borderRadius:10,
                            cursor:'pointer', background:'var(--bg)', overflow:'hidden', transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--p2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          {/* Progress bar fill background */}
                          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, background:'rgba(108,99,255,0.08)', transition:'width 0.3s' }}/>
                          <span style={{ fontSize:12, fontWeight: hasVoted ? 700 : 500, zIndex:1, display:'flex', alignItems:'center', gap:6 }}>
                            {hasVoted && '✓ '} {opt.text}
                          </span>
                          <span style={{ fontSize:11, color:'var(--t3)', zIndex:1, fontWeight: 600, fontFamily: 'var(--fd)' }}>
                            {voteCount} vote{voteCount !== 1 ? 's' : ''} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions Footer */}
                <div style={{ display:'flex', gap:20, borderTop:'1px solid var(--border)', paddingTop:14, fontSize:12, color:'var(--t3)' }}>
                  <button onClick={() => handleLike(post._id)}
                    style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color: hasLiked ? 'var(--p2)' : 'var(--t3)', fontWeight: 600 }}>
                    <ThumbsUp size={14} /> {post.likes?.length || 0} Likes
                  </button>
                  <button onClick={() => openComments(post._id)}
                    style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'var(--t3)', fontWeight: 600 }}>
                    <MessageSquare size={14} /> {post.commentsCount || 0} Comments
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Side Filters & Comments Drawer (Right Column) */}
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Category Filter Card */}
        <div className="card" style={{ borderRadius: 20, padding: 20 }}>
          <h3 style={{ fontSize:13, fontWeight:800, marginBottom:14, fontFamily: 'var(--fh)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Category Filters</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={() => setCategory('all')}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10, fontSize: 12,
                border: category === 'all' ? '1px solid var(--acc)' : '1px solid var(--border)',
                background: category === 'all' ? 'var(--acc)' : 'var(--s1)',
                color: category === 'all' ? '#FFFFFF' : 'var(--t2)',
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: category === 'all' ? '0 4px 14px rgba(230, 95, 43, 0.25)' : 'none'
              }}
              onMouseEnter={e => { if(category !== 'all') e.currentTarget.style.background = 'rgba(230,95,43,0.08)'; }}
              onMouseLeave={e => { if(category !== 'all') e.currentTarget.style.background = 'var(--s1)'; }}
            >
              🌎 All Discussions
            </button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10, fontSize: 12,
                  border: category === c ? '1px solid var(--acc)' : '1px solid var(--border)',
                  background: category === c ? 'var(--acc)' : 'var(--s1)',
                  color: category === c ? '#FFFFFF' : 'var(--t2)',
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: category === c ? '0 4px 14px rgba(230, 95, 43, 0.25)' : 'none'
                }}
                onMouseEnter={e => { if(category !== c) e.currentTarget.style.background = 'rgba(230,95,43,0.08)'; }}
                onMouseLeave={e => { if(category !== c) e.currentTarget.style.background = 'var(--s1)'; }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Comments Side Drawer */}
        {activePostId && (
          <div className="card" style={{ animation:'fadeUp 0.15s', borderRadius: 20, padding: 20, border: '1px solid rgba(108,99,255,0.18)' }}>
            <div className="flex-between" style={{ marginBottom:14, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <h3 style={{ fontSize:13, fontWeight:800, fontFamily: 'var(--fh)' }}>Comments ({comments.length})</h3>
              <button onClick={() => setActivePostId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>Close</button>
            </div>
            
            {/* List */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:280, overflowY:'auto', marginBottom:14, paddingRight:4 }}>
              {comments.length === 0 ? (
                <p style={{ color:'var(--t3)', fontSize:12, textAlign:'center', padding:10, fontWeight: 500 }}>Be the first to leave a comment!</p>
              ) : (
                comments.map(c => (
                  <div key={c._id} style={{ display:'flex', gap:10, background:'var(--s2)', padding:12, borderRadius:10, border:'1px solid var(--border)' }}>
                    <Avatar src={c.sender?.avatar} name={c.sender?.displayName} size={28} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:800, color: 'var(--t1)', fontFamily: 'var(--fh)' }}>{c.sender?.displayName}</div>
                      <div style={{ fontSize:11, color:'var(--t2)', marginTop:4, wordBreak:'break-word', lineHeight: 1.4, fontWeight: 500 }}>{renderTextWithLinks(decodeHTML(c.text))}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddComment} style={{ display:'flex', gap:8 }}>
              <input className="form-input" style={{ flex:1, height:36, fontSize:12, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }}
                value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="Add a reply..." />
              <button type="submit" disabled={submittingComment} style={{ height:36, width:36, borderRadius: 8, border: 'none', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Send size={13} />
              </button>
            </form>
          </div>
        )}
      </div>

    </CreatorShell>
  );
}
