import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Users, Info, Radio, CheckCircle, XCircle, AlertCircle, UploadCloud, Package } from 'lucide-react';
import { roomsAPI } from '../../api';
import { Avatar, EmptyState, PageLoader, DeliverableRow, StatusBadge, Modal } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ROLE_CLR = { brand:'#3b82f6', creator:'#7C8B5A', team_member:'#6366f1', admin:'#D4A24C', superadmin:'#E65F2B' };

function SubmitWorkModal({ open, onClose, onSubmit, saving }) {
  const [form, setForm] = useState({ instagramUrl:'', driveUrl:'', youtubeUrl:'', captionText:'', notes:'' });
  const upd = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const handle = e => { e.preventDefault(); onSubmit(form); };
  return (
    <Modal open={open} onClose={onClose} title="📤 Submit Your Work" maxWidth={480}>
      <form onSubmit={handle} style={{display:'flex',flexDirection:'column',gap:12}}>
        <div className="form-group"><label className="form-label">Instagram Reel URL</label><input className="form-input" value={form.instagramUrl} onChange={upd('instagramUrl')} placeholder="https://www.instagram.com/reel/..."/></div>
        <div className="form-group"><label className="form-label">Google Drive URL</label><input className="form-input" value={form.driveUrl} onChange={upd('driveUrl')} placeholder="https://drive.google.com/..."/></div>
        <div className="form-group"><label className="form-label">YouTube URL</label><input className="form-input" value={form.youtubeUrl} onChange={upd('youtubeUrl')} placeholder="https://youtube.com/..."/></div>
        <div className="form-group"><label className="form-label">Caption Text</label><textarea className="form-input form-textarea" value={form.captionText} onChange={upd('captionText')} placeholder="Your caption…" style={{minHeight:70}}/></div>
        <div className="form-group"><label className="form-label">Notes for Reviewer</label><input className="form-input" value={form.notes} onChange={upd('notes')} placeholder="Any additional notes…"/></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving||(!form.instagramUrl&&!form.driveUrl&&!form.youtubeUrl)}>{saving?'Submitting…':'Submit Work'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function CampaignRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole, getUserRoles } = useAuth();
  const [room,        setRoom]        = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [deliverables,setDeliverables]= useState(null);
  const [delStats,    setDelStats]    = useState(null);
  const [text,        setText]        = useState('');
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [activeTab,   setActiveTab]   = useState('chat');
  const [showInfo,    setShowInfo]    = useState(false);
  const [showSubmit,  setShowSubmit]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const bottomRef = useRef(null);

  const roles = getUserRoles();
  const isAdminOrTeam = roles.some(r=>['admin','superadmin','team_member'].includes(r));
  const isCreator     = hasRole('creator');

  const loadRoom = useCallback(async () => {
    try {
      const [rd, md] = await Promise.all([roomsAPI.get(id), roomsAPI.messages(id)]);
      setRoom(rd.room); setMessages(md.messages||[]);
    } catch(e) { toast.error('Could not load room'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  useEffect(() => {
    if (activeTab==='deliverables' && !deliverables) {
      roomsAPI.deliverables(id).then(d=>{setDeliverables(d.deliverables||[]);setDelStats(d.stats);}).catch(()=>{});
    }
  }, [activeTab, id, deliverables]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const d = await roomsAPI.send(id, { text:text.trim() });
      setMessages(prev=>[...prev, d.message]);
      setText('');
    } catch(e) { toast.error(e.response?.data?.message||'Failed to send'); }
    finally { setSending(false); }
  };

  const handleSubmitWork = async (form) => {
    setSubmitting(true);
    try {
      const d = await roomsAPI.submit(id, form);
      setMessages(prev=>[...prev, d.message]);
      setShowSubmit(false);
      toast.success('Work submitted! ✅ Waiting for review.');
    } catch(e) { toast.error(e.response?.data?.message||'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleReview = async (creatorId, action, note='') => {
    try {
      await roomsAPI.reviewSubmission(id, creatorId, action, { note });
      toast.success(action==='approve'?'Submission approved! ✅':'Changes requested');
      setDeliverables(null); // reload
      loadRoom();
    } catch(e) { toast.error('Action failed'); }
  };

  if (loading) return <PageLoader />;
  if (!room)   return <EmptyState icon="🔒" title="Room not found" desc="You may not have access to this campaign room" />;

  const mySlot = room.campaign?.assignedCreators?.find(s=>s.creator?._id?.toString()===user?._id?.toString()||s.creator?.toString()===user?._id?.toString());

  return (
    <div className="room-layout">
      {/* Room Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'var(--s1)',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <button onClick={()=>navigate(-1)} className="btn btn-ghost btn-icon"><ArrowLeft size={16}/></button>
        <div style={{width:34,height:34,borderRadius:'var(--r)',background:'linear-gradient(135deg,var(--p),var(--acc))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Radio size={15} style={{color:'#fff'}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:8}}>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{room.name}</span>
            {room.campaign?.requiresAdsRights && (
              <span style={{fontSize:9.5,fontWeight:700,background:'rgba(230,95,43,0.15)',color:'#E65F2B',border:'1px solid rgba(230,95,43,0.3)',padding:'2px 8px',borderRadius:99,flexShrink:0}}>
                ⚡ Ad Rights Included
              </span>
            )}
          </div>
          <div style={{fontSize:10,color:'var(--t3)'}}>{room.members?.length||0} members · {room.campaign?.workflowStatus?.replace(/_/g,' ')||'active'}</div>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:4}}>
          {['chat','deliverables'].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} className={`btn btn-sm ${activeTab===t?'btn-primary':'btn-secondary'}`} style={{fontSize:11,padding:'4px 10px',textTransform:'capitalize'}}>
              {t==='deliverables'?<><Package size={11}/> Track</>:t}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowInfo(v=>!v)} className="btn btn-ghost btn-icon"><Info size={15}/></button>
      </div>

      {/* Deliverables Tab */}
      {activeTab==='deliverables' && (
        <div style={{flex:1,overflowY:'auto',padding:16}}>
          {delStats && (
            <div className="grid-4" style={{marginBottom:16,gap:12}}>
              {[['Total',delStats.total,'var(--t2)'],['Pending',delStats.pending,'var(--gold)'],['Submitted',delStats.submitted,'var(--p)'],['Approved',delStats.approved,'var(--acc2)']].map(([l,v,c])=>(
                <div key={l} className="card" style={{padding:'12px 14px',textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--fd)',color:c}}>{v||0}</div>
                  <div style={{fontSize:11,color:'var(--t2)'}}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {!deliverables ? <PageLoader/>
          : deliverables.length===0 ? <EmptyState icon="📋" title="No creators assigned yet"/>
          : <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:600}}>Creator Deliverables</div>
            {deliverables.map((d,i)=>(
              <div key={i}>
                <DeliverableRow creator={d.creator} status={d.status} submittedAt={d.submittedAt} approvedAt={d.approvedAt} paymentAlloc={d.paymentAlloc}/>
                {isAdminOrTeam && d.status==='submitted' && (
                  <div style={{display:'flex',gap:8,padding:'6px 14px 10px',paddingLeft:58}}>
                    <button onClick={()=>handleReview(d.creator?._id,'approve')} className="btn btn-sm" style={{fontSize:10,background:'rgba(124,139,90,0.15)',color:'var(--acc2)',border:'1px solid rgba(124,139,90,0.25)'}}>
                      <CheckCircle size={11}/>Approve
                    </button>
                    <button onClick={()=>{const n=prompt('Enter revision notes:');if(n)handleReview(d.creator?._id,'request_changes',n);}} className="btn btn-sm" style={{fontSize:10,background:'rgba(212,162,76,0.12)',color:'var(--gold)',border:'1px solid rgba(212,162,76,0.25)'}}>
                      <AlertCircle size={11}/>Request Changes
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab==='chat' && (
        <>
          <div className="room-messages" style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
            {messages.length===0 && <div style={{textAlign:'center',padding:40,color:'var(--t3)',fontSize:13}}><Radio size={32} style={{color:'var(--border)',margin:'0 auto 8px',display:'block'}}/>Start the conversation!</div>}
            {messages.map((msg,i)=>{
              const isMe = msg.sender?._id===user?._id || msg.sender===user?._id;
              const memberRole = room.members?.find(m=>m.user?._id?.toString()===(msg.sender?._id||msg.sender)?.toString())?.role||'creator';
              const isSystem = msg.type==='system';
              if (isSystem) return (
                <div key={msg._id||i} style={{textAlign:'center',padding:'4px 12px'}}>
                  <span style={{fontSize:11,color:'var(--t3)',background:'var(--border)',padding:'3px 10px',borderRadius:99}}>{msg.text}</span>
                </div>
              );
              const isSubmission = msg.type==='submission';
              return (
                <div key={msg._id||i} style={{display:'flex',alignItems:'flex-end',gap:8,flexDirection:isMe?'row-reverse':'row'}}>
                  {!isMe && <Avatar src={msg.sender?.avatar} name={msg.sender?.displayName} size={28} style={{flexShrink:0}}/>}
                  <div style={{maxWidth:'72%'}}>
                    {!isMe && <div style={{fontSize:10,color:ROLE_CLR[memberRole]||'var(--t3)',marginBottom:3,paddingLeft:4,fontWeight:600}}>{msg.sender?.displayName||'User'} · <span style={{color:'var(--t3)',fontWeight:400}}>{memberRole}</span></div>}
                    <div style={{background:isSubmission?'rgba(99,102,241,0.12)':isMe?'linear-gradient(135deg,var(--p),var(--acc))':'rgba(255,255,255,0.07)',borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',padding:'10px 14px',fontSize:13,color:isMe?'#fff':'var(--t1)',border:isMe||isSubmission?'none':`1px solid var(--border)`,lineHeight:1.5,borderLeft:isSubmission?'3px solid #6366f1':undefined}}>
                      {msg.text}
                      {isSubmission && msg.submission && (
                        <div style={{marginTop:8,fontSize:11}}>
                          {msg.submission.instagramUrl && <div><a href={msg.submission.instagramUrl} target="_blank" rel="noopener noreferrer" style={{color:'#818cf8'}}>📱 Instagram Reel</a></div>}
                          {msg.submission.driveUrl     && <div><a href={msg.submission.driveUrl}     target="_blank" rel="noopener noreferrer" style={{color:'#818cf8'}}>📁 Drive Link</a></div>}
                          {msg.submission.youtubeUrl   && <div><a href={msg.submission.youtubeUrl}   target="_blank" rel="noopener noreferrer" style={{color:'#818cf8'}}>▶️ YouTube</a></div>}
                          {msg.submission.captionText  && <div style={{marginTop:4,color:'rgba(255,255,255,0.7)',fontSize:10}}>Caption: {msg.submission.captionText}</div>}
                        </div>
                      )}
                    </div>
                    <div style={{fontSize:9,color:'var(--t3)',marginTop:3,textAlign:isMe?'right':'left',padding:`0 ${isMe?4:4}px`}}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Input bar */}
          <div className="room-input-bar">
            {isCreator && (
              <button onClick={()=>setShowSubmit(true)} className="btn btn-secondary btn-sm" style={{flexShrink:0,fontSize:11}} title="Submit your work">
                <UploadCloud size={13}/>Submit Work
              </button>
            )}
            <form onSubmit={send} style={{display:'flex',gap:8,flex:1}}>
              <input value={text} onChange={e=>setText(e.target.value)}
                placeholder={`Message ${room.name}…`}
                style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'9px 14px',fontSize:13,color:'var(--t1)',outline:'none'}}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(e);}}}
              />
              <button type="submit" disabled={!text.trim()||sending} className="btn btn-primary" style={{flexShrink:0,padding:'9px 14px'}}>
                <Send size={14}/>
              </button>
            </form>
          </div>
        </>
      )}

      {/* Members panel */}
      {showInfo && (
        <div className="room-members-panel" style={{position:'absolute',right:0,top:0,bottom:0,background:'var(--s2)',borderLeft:'1px solid var(--border)',overflowY:'auto',padding:'14px',zIndex:10,width:200,animation:'fadeIn 0.15s'}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span><Users size={13} style={{marginRight:5,verticalAlign:'middle'}}/>Members</span>
            <button onClick={()=>setShowInfo(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:18}}>×</button>
          </div>
          {room.members?.map((m,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
              <Avatar src={m.user?.avatar} name={m.user?.displayName} size={26}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,fontWeight:500,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.user?.displayName||'—'}</div>
                <div style={{fontSize:9,color:ROLE_CLR[m.role]||'var(--t3)'}}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubmitWorkModal open={showSubmit} onClose={()=>setShowSubmit(false)} onSubmit={handleSubmitWork} saving={submitting}/>
    </div>
  );
}
