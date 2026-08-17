import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, MessageSquare, Radio, Activity, Users2, ArrowRight, Clock } from 'lucide-react';
import { workspaceAPI, tasksAPI } from '../../api';
import { StatCard, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

export default function TeamWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [feed,    setFeed]    = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([workspaceAPI.stats(), tasksAPI.list({ limit:5 })])
      .then(([s, t]) => { setStats(s.stats); setFeed(s.recentFeed||[]); setTasks(t.tasks||[]); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const QUICK = [
    { icon:CheckSquare,  label:'My Tasks',       path:'/team/tasks',      color:'#6366f1', desc:'Manage & track tasks'     },
    { icon:MessageSquare,label:'DM Tracker',      path:'/team/dm-tracker', color:'var(--acc)', desc:'Log daily DM activity' },
    { icon:Radio,        label:'Campaign Rooms',  path:'/admin/rooms',     color:'var(--p)',   desc:'Active campaign rooms'  },
    { icon:Users2,       label:'Team Directory',  path:'/team/directory',  color:'var(--gold)',desc:'View team members'      },
  ];

  const EV = { creator_joined:'👤',brand_joined:'🏢',campaign_created:'📣',campaign_approved:'✅',task_completed:'✔️',creator_submitted:'📤',creator_onboarded:'🎉',campaign_completed:'🏁' };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 style={{fontFamily:'var(--fd)',fontSize:'clamp(18px,4vw,24px)',fontWeight:800}}>👋 Welcome, {user?.displayName?.split(' ')[0]}</h1>
          <p style={{color:'var(--t2)',fontSize:13,marginTop:4}}>Team Workspace · {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
      </div>

      <div className="grid-4" style={{marginBottom:24}}>
        <StatCard label="Open Tasks"  value={stats?.myTasks||0}   icon={CheckSquare}   color="var(--p)"    />
        <StatCard label="Today's DMs" value={stats?.todayDMs||0}  icon={MessageSquare} color="var(--acc)"  />
        <StatCard label="Feed Events" value={feed.length}          icon={Activity}      color="#6366f1"     />
        <StatCard label="My Tasks"    value={tasks.length}         icon={CheckSquare}   color="var(--gold)" />
      </div>

      <div className="grid-2" style={{gap:20}}>
        <div className="card">
          <h3 style={{fontFamily:'var(--fd)',fontWeight:700,marginBottom:16}}>Quick Actions</h3>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {QUICK.map(q=>(
              <button key={q.path} onClick={()=>navigate(q.path)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:'var(--r)',background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',cursor:'pointer',textAlign:'left',transition:'all 0.18s',width:'100%'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=q.color;e.currentTarget.style.background='rgba(255,255,255,0.07)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='rgba(255,255,255,0.04)';}}
              >
                <div style={{width:38,height:38,borderRadius:'var(--r)',background:`${q.color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <q.icon size={18} style={{color:q.color}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:'var(--t1)'}}>{q.label}</div>
                  <div style={{fontSize:11,color:'var(--t3)'}}>{q.desc}</div>
                </div>
                <ArrowRight size={14} style={{color:'var(--t3)',flexShrink:0}}/>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{marginBottom:16}}>
            <h3 style={{fontFamily:'var(--fd)',fontWeight:700}}>Activity Feed</h3>
            <span style={{fontSize:11,color:'var(--t3)'}}>Platform events</span>
          </div>
          {feed.length===0 ? <EmptyState icon="📡" title="No activity yet" desc="Events appear here as the platform is used"/>
          : feed.map(ev=>(
            <div key={ev._id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontSize:18,lineHeight:1,flexShrink:0}}>{EV[ev.eventType]||'🔔'}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:'var(--t1)'}}>{ev.message}</div>
                <div style={{fontSize:10,color:'var(--t3)',marginTop:2,display:'flex',alignItems:'center',gap:4}}>
                  <Clock size={9}/>{new Date(ev.createdAt).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tasks.length>0 && (
        <div className="card" style={{marginTop:20}}>
          <div className="flex-between" style={{marginBottom:16}}>
            <h3 style={{fontFamily:'var(--fd)',fontWeight:700}}>My Active Tasks</h3>
            <button onClick={()=>navigate('/team/tasks')} className="btn btn-ghost btn-sm">View All <ArrowRight size={12}/></button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {tasks.map(t=>(
              <div key={t._id} onClick={()=>navigate('/team/tasks')} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:'var(--r)',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--p)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              >
                <CheckSquare size={15} style={{color:'#6366f1',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  {t.dueDate&&<div style={{fontSize:10,color:new Date(t.dueDate)<new Date()?'var(--rose)':'var(--t3)',marginTop:2}}>Due: {new Date(t.dueDate).toLocaleDateString()}</div>}
                </div>
                <span className={`badge ${t.priority==='urgent'?'badge-red':t.priority==='high'?'badge-gold':'badge-gray'}`} style={{fontSize:9}}>{t.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
