import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, XCircle, UploadCloud, MessageSquare, Clock, DollarSign } from 'lucide-react';
import { campaignsAPI, roomsAPI } from '../../api';
import { PageLoader, EmptyState, StatusBadge, Modal } from '../../components/ui';
import toast from 'react-hot-toast';
import CreatorShell from './CreatorShell';

const STATUS_CLR = { assigned:'var(--gold)',accepted:'var(--acc2)',declined:'var(--rose)',in_progress:'#6366f1',submitted:'var(--p)',revision:'var(--gold)',approved:'var(--acc2)',completed:'var(--acc2)' };

export default function AssignedCampaigns() {
  const navigate  = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [showSubmit,setShowSubmit]= useState(false);
  const [subForm,   setSubForm]   = useState({ submissionUrl:'', submissionNote:'' });
  const [submitting,setSubmitting]= useState(false);

  useEffect(() => {
    campaignsAPI.myAssigned()
      .then(d => setCampaigns(d.campaigns||[]))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, []);

  const respond = async (campaignId, response) => {
    setActing(campaignId + response);
    try {
      await campaignsAPI.respond(campaignId, response);
      setCampaigns(prev => prev.map(c => c._id===campaignId ? {...c, mySlot:{...c.mySlot, status:response==='accept'?'accepted':'declined'}} : c));
      toast.success(response==='accept'?'Campaign accepted! ✅':'Campaign declined');
    } catch(e) { toast.error(e.response?.data?.message||'Action failed'); }
    finally { setActing(null); }
  };

  const submitWork = async () => {
    if (!subForm.submissionUrl) return toast.error('Please enter a URL');
    setSubmitting(true);
    try {
      await campaignsAPI.submitWork(selected._id, subForm);
      setCampaigns(prev => prev.map(c => c._id===selected._id ? {...c,mySlot:{...c.mySlot,status:'submitted'}} : c));
      setShowSubmit(false); setSubForm({submissionUrl:'',submissionNote:''});
      toast.success('Work submitted! 📤');
    } catch(e) { toast.error(e.response?.data?.message||'Submit failed'); }
    finally { setSubmitting(false); }
  };

  const openRoom = async (campaign) => {
    if (campaign.roomId) { navigate(`/creator/room/${campaign.roomId}`); return; }
    try { const d = await roomsAPI.list(); const room = d.rooms?.find(r=>r.campaign?._id===campaign._id||r.campaign===campaign._id); if(room) navigate(`/creator/room/${room._id}`); else toast('Room not yet created'); }
    catch(e) { toast.error('Could not find room'); }
  };

  if (loading) return <PageLoader/>;

  return (
    <CreatorShell>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{fontFamily:"var(--fh)",fontSize:'clamp(30px,4.5vw,36px)',fontWeight:800,display:'flex',alignItems:'center',gap:10,letterSpacing: '-0.02em'}}>
            <Target size={24} style={{color:'var(--p)'}}/>My Campaigns
          </h1>
          <p style={{color:'var(--t2)',fontSize:13,marginTop:4,fontWeight: 500}}>{campaigns.length} campaign{campaigns.length!==1?'s':''} assigned to you</p>
        </div>
      </div>

      {campaigns.length===0
        ? <EmptyState icon="🎯" title="No campaigns yet" desc="You'll see campaigns here when the team assigns them to you"/>
        : <div style={{display:'flex',flexDirection:'column',gap:20}}>
          {campaigns.map(c => {
            const slot = c.mySlot || {};
            const statusColor = STATUS_CLR[slot.status]||'var(--t3)';
            const canRespond  = slot.status==='assigned';
            const canSubmit   = ['accepted','in_progress','revision'].includes(slot.status);
            const hasRoom     = !!c.roomId;
            const daysLeft    = c.deadline ? Math.max(0,Math.ceil((new Date(c.deadline)-new Date())/86400000)) : null;
            return (
              <div
                key={c._id}
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  border: '1px solid var(--glass-border)',
                  borderLeft: `4px solid ${statusColor}`,
                  borderRadius: 16,
                  padding: '24px 28px',
                  boxShadow: 'var(--glass-shadow)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.24s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 12px 30px ${statusColor}08, var(--glass-shadow)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                }}
              >
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                      <h3 style={{fontFamily:'var(--fh)',fontSize:17,fontWeight:800,color:'var(--t1)',letterSpacing: '-0.015em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</h3>
                      <span className="badge" style={{fontSize:10,background:`${statusColor}10`,color:statusColor,border:`1px solid ${statusColor}28`,padding:'2px 8px',borderRadius:4,fontWeight:700,textTransform:'uppercase',letterSpacing:0.3}}>{slot.status?.replace(/_/g,' ')||'assigned'}</span>
                    </div>
                    <div style={{fontSize:12,color:'var(--t2)',marginBottom:10,fontWeight: 500}}>{c.brandName} · {c.niche}</div>
                    <div style={{display:'flex',gap:20,flexWrap:'wrap',fontSize:12,color:'var(--t2)',fontWeight: 500}}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><DollarSign size={13} style={{color:'var(--acc2)'}}/>₹{(slot.paymentAlloc||0).toLocaleString('en-IN')}</span>
                      {daysLeft!==null && <span style={{display:'flex',alignItems:'center',gap:4,color:daysLeft<3?'var(--rose)':daysLeft<7?'var(--gold)':'var(--t2)',fontWeight:daysLeft<3?700:500}}><Clock size={13}/>{daysLeft}d left</span>}
                      <span style={{fontSize:11,color:'var(--t3)',fontWeight: 600}}>{c.platforms?.join(', ')||'—'}</span>
                    </div>
                  </div>
                </div>

                {/* Deliverables */}
                {c.deliverables?.length>0 && (
                  <div style={{padding:'10px 14px',background:'rgba(255,255,255,0.01)',borderRadius:10,border:'1px solid var(--border)'}}>
                    <div style={{fontSize:10,color:'var(--t3)',marginBottom:6,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Deliverables Required</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{c.deliverables.map((d,i)=><span key={i} className="badge badge-gray" style={{fontSize:11,padding:'3px 8px',borderRadius:4,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',color:'var(--t2)',fontWeight:600}}>{d}</span>)}</div>
                  </div>
                )}

                {/* Revision note */}
                {slot.revisionNote && (
                  <div style={{padding:'10px 14px',background:'rgba(212,162,76,0.05)',borderRadius:10,borderLeft:'3px solid var(--gold)',border:'1px solid rgba(212,162,76,0.15)',fontSize:12,color:'var(--t2)',fontWeight: 500}}>
                    <strong style={{color:'var(--gold)',fontWeight: 700}}>Revision needed: </strong>{slot.revisionNote}
                  </div>
                )}

                {/* Actions */}
                <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:4}}>
                  {canRespond && (
                    <>
                      <button onClick={()=>respond(c._id,'accept')} disabled={!!acting} className="btn btn-primary btn-sm" style={{fontSize:12,height:34,borderRadius:8,padding:'0 16px'}}>
                        <CheckCircle size={14}/>{acting===c._id+'accept'?'Accepting…':'Accept Campaign'}
                      </button>
                      <button onClick={()=>respond(c._id,'decline')} disabled={!!acting} className="btn btn-danger btn-sm" style={{fontSize:12,height:34,borderRadius:8,padding:'0 16px'}}>
                        <XCircle size={14}/>{acting===c._id+'decline'?'Declining…':'Decline'}
                      </button>
                    </>
                  )}
                  {canSubmit && (
                    <button onClick={()=>{setSelected(c);setShowSubmit(true);}} className="btn btn-secondary btn-sm" style={{fontSize:12,height:34,borderRadius:8,padding:'0 16px'}}>
                      <UploadCloud size={14}/>Submit Work
                    </button>
                  )}
                  <button onClick={()=>openRoom(c)} className="btn btn-secondary btn-sm" style={{fontSize:12,height:34,borderRadius:8,padding:'0 16px'}}>
                    <MessageSquare size={14}/>{hasRoom?'Open Room':'View Room'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      }

      {/* Submit Modal */}
      <Modal open={showSubmit} onClose={()=>setShowSubmit(false)} title="Submit Your Work" maxWidth={440}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, display: 'block' }}>Content URL *</label>
            <input className="form-input" value={subForm.submissionUrl} onChange={e=>setSubForm(p=>({...p,submissionUrl:e.target.value}))} placeholder="Instagram reel / Drive / YouTube URL" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }}/>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, display: 'block' }}>Notes</label>
            <textarea className="form-input form-textarea" value={subForm.submissionNote} onChange={e=>setSubForm(p=>({...p,submissionNote:e.target.value}))} placeholder="Any notes for the reviewer…" style={{minHeight:80, width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)'}}/>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
            <button onClick={()=>setShowSubmit(false)} className="btn btn-secondary btn-sm" style={{height:34,borderRadius:8,padding:'0 16px'}}>Cancel</button>
            <button onClick={submitWork} disabled={submitting||!subForm.submissionUrl} className="btn btn-primary btn-sm" style={{height:34,borderRadius:8,padding:'0 16px'}}>{submitting?'Submitting…':'Submit'}</button>
          </div>
        </div>
      </Modal>
    </CreatorShell>
  );
}
