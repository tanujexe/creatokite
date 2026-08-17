import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, AlertTriangle } from 'lucide-react';
import { auditAPI } from '../../api';
import { Avatar, EmptyState } from '../../components/ui';

const SEV_CLR = { low:'var(--t3)', medium:'var(--gold)', high:'var(--p)', critical:'var(--rose)' };
const CAT_ICON = { user:'👤', campaign:'📣', task:'✅', role:'🔑', payment:'💳', auth:'🔐', system:'⚙️', crm:'📊', notification:'🔔' };

export default function AuditLogs() {
  const [logs,     setLogs]     = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [page,     setPage]     = useState(1);

  const load = useCallback(async (pg=1) => {
    setLoading(true);
    try {
      const [ld, sd] = await Promise.all([
        auditAPI.list({ category:category||undefined, severity:severity||undefined, from:from||undefined, to:to||undefined, page:pg, limit:30 }),
        pg===1 ? auditAPI.stats() : Promise.resolve(null),
      ]);
      setLogs(ld.logs||[]); setTotal(ld.total||0);
      if (sd) setStats(sd);
    } catch(e) {} finally { setLoading(false); }
  }, [category, severity, from, to]);

  useEffect(() => { load(1); }, [category, severity, from, to]);

  const CATEGORIES = ['','user','campaign','task','role','payment','auth','system','crm','notification'];
  const SEVERITIES = ['','low','medium','high','critical'];

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 style={{fontFamily:'var(--fd)',fontSize:'clamp(18px,4vw,24px)',fontWeight:800,display:'flex',alignItems:'center',gap:10}}><Shield size={22} style={{color:'var(--gold)'}}/>Audit Logs</h1>
          <p style={{color:'var(--t2)',fontSize:13,marginTop:4}}>Track every critical action on the platform · {total} events</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
          {stats.bySeverity?.map(s=>(
            <div key={s._id} style={{padding:'8px 14px',background:'rgba(255,255,255,0.04)',borderRadius:'var(--r)',border:`1px solid ${SEV_CLR[s._id]||'var(--border)'}30`,display:'flex',gap:8,alignItems:'center'}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:SEV_CLR[s._id]||'var(--t3)',flexShrink:0}}/>
              <span style={{fontSize:12,color:'var(--t1)',fontWeight:600,textTransform:'capitalize'}}>{s._id}</span>
              <span style={{fontSize:12,color:'var(--t3)'}}>{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="form-input" style={{width:'auto',fontSize:12,padding:'6px 10px'}}>
          {CATEGORIES.map(c=><option key={c} value={c} style={{background:'var(--s2)'}}>{c||'All Categories'}</option>)}
        </select>
        <select value={severity} onChange={e=>setSeverity(e.target.value)} className="form-input" style={{width:'auto',fontSize:12,padding:'6px 10px'}}>
          {SEVERITIES.map(s=><option key={s} value={s} style={{background:'var(--s2)'}}>{s||'All Severities'}</option>)}
        </select>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="form-input" style={{width:'auto',fontSize:12}}/>
        <input type="date" value={to}   onChange={e=>setTo(e.target.value)}   className="form-input" style={{width:'auto',fontSize:12}}/>
        <button onClick={()=>{setCategory('');setSeverity('');setFrom('');setTo('');}} className="btn btn-secondary btn-sm">Reset</button>
      </div>

      {loading ? <div className="page-loader"><div className="spinner"/></div>
      : logs.length===0 ? <EmptyState icon="📋" title="No logs found" desc="Adjust filters to see audit events"/>
      : <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Action</th><th>Category</th><th>By</th><th>Target</th><th>Severity</th><th>IP</th></tr></thead>
            <tbody>
              {logs.map(l=>(
                <tr key={l._id}>
                  <td style={{fontSize:11,color:'var(--t3)',whiteSpace:'nowrap'}}>{new Date(l.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                  <td style={{fontWeight:600,fontSize:12,color:'var(--t1)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.action?.replace(/_/g,' ')}</td>
                  <td><span style={{fontSize:11}}>{CAT_ICON[l.category]||'⚙️'} <span style={{color:'var(--t2)'}}>{l.category}</span></span></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <Avatar src={l.performedBy?.avatar} name={l.performedBy?.displayName} size={20}/>
                      <span style={{fontSize:11,color:'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:100}}>{l.performedBy?.displayName||'—'}</span>
                    </div>
                  </td>
                  <td style={{fontSize:11,color:'var(--t3)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.targetUser?.displayName||l.targetResource||'—'}</td>
                  <td><span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:`${SEV_CLR[l.severity]||'var(--t3)'}18`,color:SEV_CLR[l.severity]||'var(--t3)',border:`1px solid ${SEV_CLR[l.severity]||'var(--t3)'}30`,fontWeight:600}}>{l.severity}</span></td>
                  <td style={{fontSize:10,color:'var(--t3)',fontFamily:'monospace'}}>{l.ipAddress||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total>30 && (
          <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--t3)'}}>Showing {logs.length} of {total}</span>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>{setPage(p=>Math.max(1,p-1));load(page-1);}} disabled={page===1} className="btn btn-secondary btn-sm">Prev</button>
              <button onClick={()=>{setPage(p=>p+1);load(page+1);}} disabled={logs.length<30} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
