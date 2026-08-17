import { useState, useEffect } from 'react';
import { workspaceAPI } from '../../api';
import { Avatar, EmptyState } from '../../components/ui';

export default function TeamDirectory() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { workspaceAPI.team().then(d=>setMembers(d.members||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  return (
    <div className="page-enter">
      <div className="page-header"><h1 style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:'clamp(18px,4vw,24px)'}}>Team Directory</h1></div>
      {members.length===0 ? <EmptyState icon="👥" title="No team members yet" desc="Admins can promote users to team members"/> :
      <div className="grid-3">
        {members.map(m=>(
          <div key={m._id} className="card" style={{display:'flex',alignItems:'center',gap:12}}>
            <Avatar src={m.avatar} name={m.displayName} size={44}/>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.displayName}</div>
              <div style={{fontSize:11,color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</div>
              {m.teamTitle&&<div style={{fontSize:11,color:'var(--t2)',marginTop:2}}>{m.teamTitle}</div>}
              <div style={{marginTop:6,display:'flex',gap:4,flexWrap:'wrap'}}>
                {(m.roles?.length?m.roles:[m.role]).map(r=><span key={r} className={`badge badge-${r==='admin'?'gold':r==='superadmin'?'red':r==='team_member'?'purple':'gray'}`} style={{fontSize:9}}>{r}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
