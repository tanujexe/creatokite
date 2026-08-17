import { useState, useEffect } from 'react';
import { MessageSquare, Plus, TrendingUp, Users, BarChart2, Calendar } from 'lucide-react';
import { workspaceAPI } from '../../api';
import { StatCard, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DMTracker() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin');
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState([]);
  const [tab, setTab]         = useState('my');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    creatorDMs: '', brandDMs: '', repliesReceived: '', interestedLeads: '', notes: '',
    creatorLinks: [], brandLinks: [],
  });
  const [newCreatorLink, setNewCreatorLink] = useState({ name:'', profileUrl:'', notes:'' });
  const [newBrandLink,   setNewBrandLink]   = useState({ name:'', profileUrl:'', notes:'' });

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    try {
      if (tab==='all' && isAdmin) {
        const d = await workspaceAPI.allDMReports();
        setSummary(d.summary||[]); setReports(d.reports||[]);
      } else {
        const d = await workspaceAPI.myDMReports();
        setReports(d.reports||[]);
      }
    } catch(e) {} finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true);
    try {
      await workspaceAPI.submitDMReport({
        ...form,
        creatorDMs: +form.creatorDMs||0,
        brandDMs: +form.brandDMs||0,
        repliesReceived: +form.repliesReceived||0,
        interestedLeads: +form.interestedLeads||0,
      });
      toast.success('DM report saved! ✅');
      setForm({date:new Date().toISOString().split('T')[0],creatorDMs:'',brandDMs:'',repliesReceived:'',interestedLeads:'',notes:'',creatorLinks:[],brandLinks:[]});
      load();
    } catch(e) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }

  const totalCreatorDMs = reports.reduce((s,r)=>s+(r.creatorDMs||0),0);
  const totalBrandDMs   = reports.reduce((s,r)=>s+(r.brandDMs||0),0);
  const totalLeads      = reports.reduce((s,r)=>s+(r.interestedLeads||0),0);
  const totalReplies    = reports.reduce((s,r)=>s+(r.repliesReceived||0),0);

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 style={{fontFamily:'var(--fd)',fontSize:'clamp(18px,4vw,24px)',fontWeight:800}}>DM Tracker</h1>
          <p style={{color:'var(--t2)',fontSize:13,marginTop:4}}>Log daily outreach activity · Track leads and responses</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setTab('my')} className={`btn btn-sm ${tab==='my'?'btn-primary':'btn-secondary'}`}>My Reports</button>
          {isAdmin && <button onClick={()=>setTab('all')} className={`btn btn-sm ${tab==='all'?'btn-primary':'btn-secondary'}`}>Team Overview</button>}
        </div>
      </div>

      {/* Stats */}
      {tab==='my' && (
        <div className="grid-4" style={{marginBottom:24}}>
          <StatCard label="Total Creator DMs" value={totalCreatorDMs} icon={Users}        color="var(--p)"    />
          <StatCard label="Total Brand DMs"   value={totalBrandDMs}   icon={MessageSquare} color="var(--acc)"  />
          <StatCard label="Total Replies"     value={totalReplies}    icon={TrendingUp}    color="#6366f1"     />
          <StatCard label="Interested Leads"  value={totalLeads}      icon={BarChart2}     color="var(--gold)" />
        </div>
      )}

      {/* Team Summary (admin) */}
      {tab==='all' && summary.length>0 && (
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{fontFamily:'var(--fd)',fontWeight:700,marginBottom:14}}>Team Performance Summary</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Creator DMs</th><th>Brand DMs</th><th>Replies</th><th>Leads</th><th>Reports</th></tr></thead>
              <tbody>
                {summary.map((s,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{s.member?.displayName||'—'}</td>
                    <td>{s.totalCreatorDMs}</td><td>{s.totalBrandDMs}</td>
                    <td>{s.totalReplies}</td><td style={{color:'var(--acc)',fontWeight:600}}>{s.totalLeads}</td>
                    <td>{s.reportCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid-2" style={{gap:20,alignItems:'start'}}>
        {/* Log Today's DMs */}
        <div className="card">
          <h3 style={{fontFamily:'var(--fd)',fontWeight:700,marginBottom:16}}>Log Today's Activity</h3>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
            <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div className="grid-2" style={{gap:10}}>
              <div className="form-group"><label className="form-label">Creator DMs Sent</label><input type="number" min="0" className="form-input" value={form.creatorDMs} onChange={e=>setForm(p=>({...p,creatorDMs:e.target.value}))} placeholder="0"/></div>
              <div className="form-group"><label className="form-label">Brand DMs Sent</label><input type="number" min="0" className="form-input" value={form.brandDMs} onChange={e=>setForm(p=>({...p,brandDMs:e.target.value}))} placeholder="0"/></div>
              <div className="form-group"><label className="form-label">Replies Received</label><input type="number" min="0" className="form-input" value={form.repliesReceived} onChange={e=>setForm(p=>({...p,repliesReceived:e.target.value}))} placeholder="0"/></div>
              <div className="form-group"><label className="form-label">Interested Leads</label><input type="number" min="0" className="form-input" value={form.interestedLeads} onChange={e=>setForm(p=>({...p,interestedLeads:e.target.value}))} placeholder="0"/></div>
            </div>
            {/* Creator Links */}
            <div className="form-group">
              <label className="form-label">Creator Profile Links</label>
              {form.creatorLinks.map((cl,i)=>(
                <div key={i} style={{display:'flex',gap:6,marginBottom:4,alignItems:'center'}}>
                  <span style={{fontSize:11,color:'var(--t2)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cl.name||cl.profileUrl}</span>
                  <button type="button" onClick={()=>setForm(p=>({...p,creatorLinks:p.creatorLinks.filter((_,j)=>j!==i)}))} style={{background:'none',border:'none',color:'var(--rose)',cursor:'pointer',fontSize:14}}>×</button>
                </div>
              ))}
              <div style={{display:'flex',gap:6}}>
                <input value={newCreatorLink.name} onChange={e=>setNewCreatorLink(p=>({...p,name:e.target.value}))} placeholder="Name" className="form-input" style={{flex:'0 0 90px',padding:'6px 8px',fontSize:11}}/>
                <input value={newCreatorLink.profileUrl} onChange={e=>setNewCreatorLink(p=>({...p,profileUrl:e.target.value}))} placeholder="Profile URL" className="form-input" style={{flex:1,padding:'6px 8px',fontSize:11}}/>
                <button type="button" onClick={()=>{if(newCreatorLink.profileUrl){setForm(p=>({...p,creatorLinks:[...p.creatorLinks,newCreatorLink]}));setNewCreatorLink({name:'',profileUrl:'',notes:''});}}} style={{background:'var(--acc)',border:'none',borderRadius:'var(--r)',padding:'6px 10px',cursor:'pointer',color:'#fff',fontSize:11,whiteSpace:'nowrap'}}>+ Add</button>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input form-textarea" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Any observations, hot leads, follow-ups…" style={{minHeight:60}}/></div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save Report'}</button>
          </form>
        </div>

        {/* Past Reports */}
        <div className="card">
          <h3 style={{fontFamily:'var(--fd)',fontWeight:700,marginBottom:14}}>Past Reports</h3>
          {loading ? <div className="page-loader" style={{minHeight:100}}><div className="spinner"/></div>
          : reports.length===0 ? <EmptyState icon="📊" title="No reports yet" desc="Log your first DM activity above"/>
          : reports.slice(0,20).map(r=>(
            <div key={r._id} style={{padding:'12px 14px',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <Calendar size={13} style={{color:'var(--t3)'}}/>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{new Date(r.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
                </div>
                {tab==='all'&&r.teamMember&&<span style={{fontSize:11,color:'var(--t3)'}}>{r.teamMember.displayName}</span>}
              </div>
              <div className="rs-cols-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                {[['Creator DMs',r.creatorDMs,'var(--p)'],['Brand DMs',r.brandDMs,'var(--acc)'],['Replies',r.repliesReceived,'#6366f1'],['Leads',r.interestedLeads,'var(--gold)']].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:'center',padding:'6px 4px',background:'rgba(255,255,255,0.04)',borderRadius:'var(--r)'}}>
                    <div style={{fontSize:16,fontWeight:800,fontFamily:'var(--fd)',color:c}}>{v||0}</div>
                    <div style={{fontSize:9,color:'var(--t3)'}}>{l}</div>
                  </div>
                ))}
              </div>
              {r.notes&&<div style={{marginTop:8,fontSize:11,color:'var(--t2)',padding:'6px 8px',background:'rgba(255,255,255,0.03)',borderRadius:'var(--r)',borderLeft:'2px solid var(--border)'}}>{r.notes}</div>}
              {r.creatorLinks?.length>0&&(
                <div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>Creator Links ({r.creatorLinks.length})</div>
                  {r.creatorLinks.map((cl,i)=><div key={i} style={{fontSize:11,color:'var(--p)'}}><a href={cl.profileUrl} target="_blank" rel="noopener noreferrer">{cl.name||cl.profileUrl}</a></div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
