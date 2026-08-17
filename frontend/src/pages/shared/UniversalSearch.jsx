import { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Megaphone, CheckSquare, FileText } from 'lucide-react';
import { searchAPI } from '../../api';
import { Avatar } from '../../components/ui';

const TYPE_ICON = { creators:Users, brands:Users, campaigns:Megaphone, tasks:CheckSquare, posts:FileText, users:Users };
const TYPE_CLR  = { creators:'var(--acc2)', brands:'#3b82f6', campaigns:'var(--p)', tasks:'#6366f1', posts:'var(--acc)', users:'var(--gold)' };

export default function UniversalSearch() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults(null); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try { const d = await searchAPI.query(query); setResults(d.results); }
      catch(e) { setResults(null); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(debounce.current);
  }, [query]);

  const totalResults = results ? Object.values(results).reduce((s, a) => s + (a?.length||0), 0) : 0;

  return (
    <div className="page-enter" style={{maxWidth:720,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:'clamp(20px,5vw,28px)',marginBottom:8}}>🔍 Search Everything</h1>
        <p style={{color:'var(--t2)',fontSize:13}}>Creators, brands, campaigns, tasks, community posts — all in one place</p>
      </div>

      <div style={{position:'relative',marginBottom:24}}>
        <Search size={18} style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
        <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search creators, campaigns, tasks…"
          style={{width:'100%',background:'var(--s2)',border:'2px solid var(--border)',borderRadius:12,padding:'14px 44px 14px 48px',fontSize:15,color:'var(--t1)',outline:'none',transition:'border-color 0.2s',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='var(--p)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
        {query && <button onClick={()=>{setQuery('');setResults(null);}} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--t3)',padding:4,display:'flex'}}><X size={16}/></button>}
      </div>

      {loading && <div style={{textAlign:'center',padding:40,color:'var(--t3)',fontSize:13}}>Searching…</div>}

      {!loading && results && totalResults===0 && (
        <div style={{textAlign:'center',padding:48}}>
          <div style={{fontSize:48,marginBottom:12}}>🔎</div>
          <div style={{fontSize:16,fontWeight:600,color:'var(--t1)',marginBottom:6}}>No results for "{query}"</div>
          <div style={{fontSize:13,color:'var(--t3)'}}>Try different keywords or check spelling</div>
        </div>
      )}

      {!loading && results && totalResults>0 && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          {Object.entries(results).map(([type, items]) => {
            if (!items?.length) return null;
            const Icon = TYPE_ICON[type]||Search;
            const color = TYPE_CLR[type]||'var(--t2)';
            return (
              <div key={type}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <Icon size={14} style={{color}}/>
                  <span style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color}}>{type}</span>
                  <span style={{fontSize:11,color:'var(--t3)'}}>({items.length})</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {items.map(item=>(
                    <div key={item._id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--s2)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',transition:'all 0.15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.transform='translateX(4px)';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateX(0)';}}
                    >
                      <div style={{width:36,height:36,borderRadius:8,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {item.avatar ? <Avatar src={item.avatar} name={item.displayName||item.title} size={36} style={{borderRadius:8}}/> : <Icon size={16} style={{color}}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.displayName||item.title||'—'}</div>
                        <div style={{fontSize:11,color:'var(--t3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.email||item.niche||item.status||item.space||''}</div>
                      </div>
                      {item.creatorScore!=null && <span style={{fontSize:12,fontWeight:700,color:'var(--p)',fontFamily:'var(--fd)'}}>⚡{item.creatorScore}</span>}
                      {item.budget!=null && <span style={{fontSize:12,fontWeight:700,color:'var(--acc2)',fontFamily:'var(--fd)'}}>₹{item.budget?.toLocaleString('en-IN')}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!query && (
        <div style={{textAlign:'center',padding:48,color:'var(--t3)'}}>
          <Search size={40} style={{marginBottom:12,opacity:0.3,display:'block',margin:'0 auto 12px'}}/>
          <div style={{fontSize:14}}>Start typing to search the platform</div>
          <div style={{fontSize:12,marginTop:8,opacity:0.7}}>Creators · Brands · Campaigns · Tasks · Posts</div>
        </div>
      )}
    </div>
  );
}
