import { useState, useEffect, useCallback } from 'react';
import { UserCog, Shield, Users, Search, ChevronDown, Check, X, Eye, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../api';
import { Avatar, Modal, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ALL_ROLES = [
  { key:'creator',     label:'Creator',      color:'var(--acc2)',  desc:'Access creator workspace, campaigns, earnings'   },
  { key:'brand',       label:'Brand',        color:'#3b82f6',      desc:'Access brand portal, campaign creation'           },
  { key:'team_member', label:'Team Member',  color:'#6366f1',      desc:'Access team workspace, tasks, DM tracker, rooms'  },
  { key:'admin',       label:'Admin',        color:'var(--gold)',   desc:'Full admin control panel access'                  },
];

const BADGE = { creator:'badge-green', brand:'badge-blue', team_member:'badge-purple', admin:'badge-gold', superadmin:'badge-red' };

export default function RoleManager() {
  const { user: me, hasRole } = useAuth();
  const isSuperAdmin = hasRole('superadmin');

  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [userNotes, setUserNotes]   = useState('');

  const load = useCallback(async (pg=1) => {
    setLoading(true);
    try {
      const d = await adminAPI.users({ page:pg, limit:20, search, role: filter==='all'?undefined:filter });
      setUsers(d.users||[]); setTotal(d.total||0);
    } catch(e) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { const t = setTimeout(()=>load(1), search?400:0); return ()=>clearTimeout(t); }, [search, filter, load]);

  const getUserRoles = (u) => u.roles?.length ? u.roles : [u.role||'creator'];

  const handleAddRole = async (userId, role, userName) => {
    if (role==='admin' && !isSuperAdmin) return toast.error('Only SuperAdmin can promote to Admin');
    setSaving(`${userId}-add-${role}`);
    try {
      const d = await adminAPI.promoteUser(userId, { addRole: role });
      toast.success(`✅ ${userName} is now ${role}`);
      setUsers(prev => prev.map(u => u._id===userId ? d.user : u));
      if (selected?._id===userId) setSelected(d.user);
    } catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(null); }
  };

  const handleRemoveRole = async (userId, role, userName) => {
    if (!confirm(`Remove ${role} role from ${userName}?`)) return;
    setSaving(`${userId}-remove-${role}`);
    try {
      const d = await adminAPI.promoteUser(userId, { removeRole: role });
      toast.success(`Removed ${role} from ${userName}`);
      setUsers(prev => prev.map(u => u._id===userId ? d.user : u));
      if (selected?._id===userId) setSelected(d.user);
    } catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(null); }
  };

  const handleViewAs = async (userId) => {
    try {
      const d = await adminAPI.viewAs(userId);
      toast.success(`Now previewing as ${d.targetUser.displayName}`);
    } catch(e) { toast.error('Failed'); }
  };

  const openDetail = (u) => { setSelected(u); setShowDetail(true); };

  const filterTabs = [
    { key:'all',         label:'All Users'   },
    { key:'creator',     label:'Creators'    },
    { key:'brand',       label:'Brands'      },
    { key:'team_member', label:'Team Members'},
    { key:'admin',       label:'Admins'      },
  ];

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 style={{fontFamily:'var(--fd)',fontSize:'clamp(18px,4vw,24px)',fontWeight:800,display:'flex',alignItems:'center',gap:10}}>
            <UserCog size={22} style={{color:'var(--gold)'}}/>Role Manager
          </h1>
          <p style={{color:'var(--t2)',fontSize:13,marginTop:4}}>
            Promote users to Team Member · Manage multi-role access · {total} users
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'var(--r)',padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'flex-start',gap:10}}>
        <AlertCircle size={16} style={{color:'#6366f1',flexShrink:0,marginTop:2}}/>
        <div style={{fontSize:12,color:'var(--t2)',lineHeight:1.6}}>
          <strong style={{color:'var(--t1)'}}>How roles work:</strong> A user can have multiple roles simultaneously. A creator can also be a team member. 
          Use the <strong>+</strong> button to add a role, and <strong>×</strong> to remove one. 
          {!isSuperAdmin && <span style={{color:'var(--gold)'}}> Admin role promotion requires SuperAdmin access.</span>}
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 200px',maxWidth:320}}>
          <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…" className="form-input" style={{paddingLeft:30,height:36,fontSize:12}}/>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {filterTabs.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11.5, whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {loading ? <div className="page-loader" style={{minHeight:200}}><div className="spinner"/></div>
        : users.length===0 ? <EmptyState icon="👤" title="No users found" desc="Try a different search or filter"/>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Current Roles</th>
                  <th>Add Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roles = getUserRoles(u);
                  const isSelf = u._id === me?._id;
                  return (
                    <tr key={u._id} style={{opacity: u.isBanned?0.5:1}}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <Avatar src={u.avatar} name={u.displayName} size={34}/>
                          <div style={{minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:13,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{u.displayName} {isSelf&&<span style={{fontSize:9,color:'var(--t3)'}}>(you)</span>}</div>
                            <div style={{fontSize:11,color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap',minWidth:160}}>
                          {roles.map(r => (
                            <span key={r} className={`badge ${BADGE[r]||'badge-gray'}`} style={{display:'flex',alignItems:'center',gap:3,paddingRight:4,fontSize:10}}>
                              {r}
                              {!isSelf && r!=='superadmin' && (
                                <button onClick={()=>handleRemoveRole(u._id,r,u.displayName)} disabled={!!saving} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',lineHeight:1,opacity:0.7}}><X size={9}/></button>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap',minWidth:180}}>
                          {ALL_ROLES.filter(r => !roles.includes(r.key) && (r.key!=='admin'||isSuperAdmin)).map(r => (
                            <button key={r.key} onClick={()=>handleAddRole(u._id,r.key,u.displayName)}
                              disabled={saving===`${u._id}-add-${r.key}`}
                              title={r.desc}
                              style={{fontSize:10,padding:'3px 8px',borderRadius:99,border:`1px solid ${r.color}40`,color:r.color,background:`${r.color}10`,cursor:'pointer',display:'flex',alignItems:'center',gap:3,transition:'all 0.15s',whiteSpace:'nowrap'}}
                              onMouseEnter={e=>{e.currentTarget.style.background=`${r.color}25`;}}
                              onMouseLeave={e=>{e.currentTarget.style.background=`${r.color}10`;}}
                            >
                              {saving===`${u._id}-add-${r.key}` ? '…' : <><span style={{fontSize:12,lineHeight:1}}>+</span>{r.label}</>}
                            </button>
                          ))}
                          {ALL_ROLES.filter(r=>!roles.includes(r.key)).length===0 && <span style={{fontSize:11,color:'var(--t3)'}}>All roles assigned</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.isVerified?'badge-green':u.isBanned?'badge-red':'badge-gray'}`} style={{fontSize:10}}>
                          {u.isBanned?'Banned':u.isVerified?'Verified':'Unverified'}
                        </span>
                      </td>
                      <td style={{fontSize:11,color:'var(--t3)',whiteSpace:'nowrap'}}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>openDetail(u)} className="btn btn-ghost btn-sm" title="View details" style={{padding:'3px 8px',fontSize:11}}>
                            <Eye size={11}/> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,justifyContent:'space-between'}}>
            <span style={{fontSize:12,color:'var(--t3)'}}>Showing {users.length} of {total}</span>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>{setPage(p=>Math.max(1,p-1));load(page-1);}} disabled={page===1} className="btn btn-secondary btn-sm">Prev</button>
              <button onClick={()=>{setPage(p=>p+1);load(page+1);}} disabled={users.length<20} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Role Details for each role */}
      <div style={{marginTop:20,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
        {ALL_ROLES.map(r=>(
          <div key={r.key} className="card" style={{padding:'14px 16px',borderLeft:`3px solid ${r.color}`}}>
            <div style={{fontWeight:700,fontSize:13,color:r.color,marginBottom:4}}>{r.label}</div>
            <div style={{fontSize:11,color:'var(--t2)',lineHeight:1.6}}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* User Detail Modal */}
      <Modal open={showDetail} onClose={()=>setShowDetail(false)} title={`User: ${selected?.displayName}`} maxWidth={500}>
        {selected && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <Avatar src={selected.avatar} name={selected.displayName} size={52}/>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:'var(--t1)'}}>{selected.displayName}</div>
                <div style={{fontSize:12,color:'var(--t3)'}}>{selected.email}</div>
                <div style={{marginTop:6,display:'flex',gap:4,flexWrap:'wrap'}}>
                  {getUserRoles(selected).map(r=><span key={r} className={`badge ${BADGE[r]||'badge-gray'}`} style={{fontSize:10}}>{r}</span>)}
                </div>
              </div>
            </div>

            <div className="rs-cols-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['Joined',new Date(selected.createdAt).toLocaleDateString()],['Niche',selected.niche||'—'],['Score',selected.creatorScore||0],['Rank',selected.rank||'—'],['Campaigns',selected.totalCampaigns||0],['Status',selected.verificationStatus||'—']].map(([l,v])=>(
                <div key={l} style={{padding:'8px 10px',background:'rgba(255,255,255,0.04)',borderRadius:'var(--r)'}}>
                  <div style={{fontSize:10,color:'var(--t3)'}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--t1)',marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>Manage Roles</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {ALL_ROLES.map(r=>{
                  const has = getUserRoles(selected).includes(r.key);
                  return (
                    <button key={r.key} onClick={()=> has ? handleRemoveRole(selected._id,r.key,selected.displayName) : handleAddRole(selected._id,r.key,selected.displayName)}
                      disabled={(r.key==='admin'&&!isSuperAdmin)||selected._id===me?._id}
                      style={{padding:'7px 14px',borderRadius:99,border:`1.5px solid ${r.color}`,color:has?'#fff':r.color,background:has?r.color:`${r.color}10`,cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5,transition:'all 0.15s',opacity:(r.key==='admin'&&!isSuperAdmin)||selected._id===me?._id?0.4:1}}
                    >
                      {has ? <><Check size={11}/>Remove {r.label}</> : <>+ Add {r.label}</>}
                    </button>
                  );
                })}
              </div>
              {!isSuperAdmin && <p style={{fontSize:10,color:'var(--t3)',marginTop:6}}>* Admin promotion requires SuperAdmin access</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
