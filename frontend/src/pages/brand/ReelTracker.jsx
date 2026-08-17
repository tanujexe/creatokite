import { useState, useEffect, useRef } from 'react';
import { reelsAPI, campaignsAPI } from '../../api';
import {
  Play, Heart, MessageCircle, TrendingUp, Plus, Trash2,
  RefreshCw, Search, ExternalLink, BarChart2, Zap, Clock,
  AlertTriangle, CheckCircle, Loader, X, Eye,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────
const fmt = n => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return String(n);
};
const ago = d => {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
const statusBadge = status => {
  const cfg = {
    queued:   { label:'Queued',   color:'#94a3b8', bg:'rgba(148,163,184,0.1)' },
    fetching: { label:'Fetching', color:'#60a5fa', bg:'rgba(96,165,250,0.1)'  },
    tracking: { label:'Tracking', color:'#34d399', bg:'rgba(52,211,153,0.1)'  },
    failed:   { label:'Failed',   color:'#f87171', bg:'rgba(248,113,113,0.1)' },
    private:  { label:'Private',  color:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  };
  const c = cfg[status] || cfg.queued;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 99, color: c.color, background: c.bg,
      border: `1px solid ${c.color}30`,
    }}>{c.label}</span>
  );
};

// ── StatCard ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}18`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ── TrackModal ───────────────────────────────────────────────
function TrackModal({ onClose, onTracked, campaigns = [] }) {
  const [url, setUrl]             = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading]     = useState(false);

  const handleTrack = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await reelsAPI.track({ url: url.trim(), campaignId: campaignId || undefined });
      toast.success('Reel added! Fetching metrics…');
      onTracked(res.reel);
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to track reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 18, padding: 28, width: '100%', maxWidth: 480,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>Track a Reel</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t3)' }}>
              Paste any public Instagram Reel URL
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)' }}>
            <X size={20}/>
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Instagram Reel URL *
          </label>
          <input
            autoFocus
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            placeholder="https://www.instagram.com/reel/ABC123/"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--t1)', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {campaigns.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Link to Campaign (optional)
            </label>
            <select
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--t1)', fontSize: 14, outline: 'none',
              }}
            >
              <option value="">— No campaign —</option>
              {campaigns.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{
          background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 18, fontSize: 12, color: 'var(--t3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} style={{ color: 'var(--gold)' }} />
            <span>Tracks views, likes, comments & engagement automatically every 15 min</span>
          </div>
        </div>

        <button
          onClick={handleTrack}
          disabled={loading || !url.trim()}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: loading || !url.trim() ? 'var(--border)' : 'linear-gradient(135deg,var(--p),var(--acc))',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading
            ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }}/> Tracking…</>
            : <><Plus size={16}/> Track Reel</>
          }
        </button>
      </div>
    </div>
  );
}

// ── ReelDetailModal ──────────────────────────────────────────
function ReelDetailModal({ reel, onClose }) {
  const chartData = (reel.history || [])
    .slice(-48)
    .map(h => ({
      time: new Date(h.capturedAt).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }),
      views:      h.views,
      likes:      h.likes,
      comments:   h.comments,
      engagement: h.engagement,
    }));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto',
    }} onClick={onClose}>
      <div style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:18, padding:28, width:'100%', maxWidth:700,
        maxHeight:'90vh', overflowY:'auto',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', gap:16, marginBottom:20 }}>
          {reel.thumbnail && (
            <img src={reel.thumbnail} alt="" style={{ width:80, height:80, borderRadius:12, objectFit:'cover', flexShrink:0 }}
              onError={e => e.target.style.display='none'} />
          )}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontWeight:800, fontSize:16, color:'var(--t1)' }}>
                @{reel.username || 'Unknown'}
              </span>
              {statusBadge(reel.status)}
            </div>
            <p style={{ fontSize:13, color:'var(--t2)', margin:'0 0 8px', lineHeight:1.5 }}>
              {reel.caption?.slice(0,150) || 'No caption'}{reel.caption?.length > 150 ? '…' : ''}
            </p>
            <a href={reel.url} target="_blank" rel="noreferrer"
              style={{ fontSize:12, color:'var(--p)', display:'flex', alignItems:'center', gap:4 }}>
              <ExternalLink size={12}/> Open on Instagram
            </a>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', alignSelf:'flex-start' }}>
            <X size={20}/>
          </button>
        </div>

        {/* Metrics */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }} className="rs-cols-4">
          {[
            { icon: Eye,          label:'Views',      value: fmt(reel.views),      color:'#60a5fa' },
            { icon: Heart,        label:'Likes',      value: fmt(reel.likes),      color:'#f472b6' },
            { icon: MessageCircle,label:'Comments',   value: fmt(reel.comments),   color:'#a78bfa' },
            { icon: TrendingUp,   label:'Engagement', value: `${reel.engagement}%`,color:'#34d399' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              background:'var(--bg)', border:'1px solid var(--border)',
              borderRadius:12, padding:'12px 16px', textAlign:'center',
            }}>
              <Icon size={16} color={color} style={{ marginBottom:6 }} />
              <div style={{ fontSize:18, fontWeight:800, color:'var(--t1)' }}>{value}</div>
              <div style={{ fontSize:11, color:'var(--t3)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div>
            <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:'var(--t2)' }}>Growth History</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fontSize:10, fill:'var(--t3)' }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize:10, fill:'var(--t3)' }} />
                <Tooltip
                  contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:8 }}
                  formatter={(v, n) => [fmt(v), n]}
                />
                <Line type="monotone" dataKey="views"    stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="likes"    stroke="#f472b6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="comments" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ fontSize:11, color:'var(--t3)', marginTop:16, textAlign:'center' }}>
          Last updated: {ago(reel.lastFetchedAt)} · Source: {reel.dataSource || 'unknown'}
          {reel.dataSource === 'estimated' && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'var(--gold)', marginLeft:8 }}>
              <AlertTriangle size={11} /> Estimated data
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ReelTracker Page ─────────────────────────────────────
export default function ReelTracker() {
  const [reels,    setReels]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showTrack,setShowTrack]= useState(false);
  const [detail,   setDetail]   = useState(null);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [myCampaigns, setMyCampaigns] = useState([]);

  // Load assigned campaigns for linking
  useEffect(() => {
    campaignsAPI.myAssigned()
      .then(d => setMyCampaigns(d.assignments || d.campaigns || []))
      .catch(() => {});
  }, []);

  const load = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const [r, st] = await Promise.all([
        reelsAPI.list({ page: p, limit: 20, search: s }),
        reelsAPI.stats(),
      ]);
      setReels(r.reels);
      setTotal(r.total);
      setStats(st.stats);
    } catch (e) {
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Live updates via socket
  useEffect(() => {
    // poll every 30s as fallback
    const interval = setInterval(() => load(page, search), 30000);
    return () => clearInterval(interval);
  }, [page, search]);

  const handleSearch = v => {
    setSearch(v);
    setPage(1);
    load(1, v);
  };

  const handleDelete = async id => {
    if (!confirm('Remove this reel?')) return;
    try {
      await reelsAPI.delete(id);
      setReels(r => r.filter(x => x._id !== id));
      toast.success('Reel removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`Remove ${selected.size} reels?`)) return;
    try {
      await reelsAPI.bulkDelete([...selected]);
      setReels(r => r.filter(x => !selected.has(x._id)));
      setSelected(new Set());
      toast.success(`${selected.size} reels removed`);
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleRefresh = async (id, e) => {
    e.stopPropagation();
    try {
      await reelsAPI.refresh(id);
      toast.success('Refresh triggered!');
    } catch { toast.error('Failed to refresh'); }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:44, height:44, borderRadius:12,
            background:'linear-gradient(135deg,var(--p),var(--acc))',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Play size={20} color="#fff" fill="#fff"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--t1)' }}>Reel Tracker</h1>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'var(--t3)' }}>
              Track public Instagram Reel metrics over time
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowTrack(true)}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'10px 18px', borderRadius:10, border:'none',
            background:'linear-gradient(135deg,var(--p),var(--acc))',
            color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
          }}
        >
          <Plus size={16}/> Track Reel
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
          <StatCard icon={Play}          label="Total Reels"    value={stats.total}              color="#60a5fa"/>
          <StatCard icon={CheckCircle}   label="Tracking"       value={stats.tracking}           color="#34d399"/>
          <StatCard icon={Eye}           label="Total Views"    value={fmt(stats.totalViews)}    color="#a78bfa"/>
          <StatCard icon={Heart}         label="Total Likes"    value={fmt(stats.totalLikes)}    color="#f472b6"/>
          <StatCard icon={TrendingUp}    label="Avg Engagement" value={`${stats.avgEngagement}%`}color="#fb923c"/>
          <StatCard icon={AlertTriangle} label="Failed"         value={stats.failed}             color="#f87171"/>
        </div>
      )}

      {/* Search + Bulk */}
      <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
        <div style={{ flex:1, position:'relative' }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by username, caption, shortcode…"
            style={{
              width:'100%', padding:'9px 12px 9px 34px', borderRadius:10,
              border:'1px solid var(--border)', background:'var(--card)',
              color:'var(--t1)', fontSize:13, outline:'none', boxSizing:'border-box',
            }}
          />
        </div>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete} style={{
            display:'flex', alignItems:'center', gap:6, padding:'9px 14px',
            borderRadius:10, border:'1px solid rgba(248,113,113,0.3)',
            background:'rgba(248,113,113,0.1)', color:'#f87171',
            fontWeight:600, fontSize:13, cursor:'pointer',
          }}>
            <Trash2 size={14}/> Delete ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>
            <Loader size={24} style={{ animation:'spin 1s linear infinite', marginBottom:8 }}/>
            <div>Loading reels…</div>
          </div>
        ) : reels.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <Play size={40} color="var(--t3)" style={{ marginBottom:12 }}/>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--t1)', marginBottom:6 }}>No reels tracked yet</div>
            <div style={{ fontSize:13, color:'var(--t3)', marginBottom:20 }}>Paste an Instagram Reel URL to start tracking</div>
            <button onClick={() => setShowTrack(true)} style={{
              padding:'10px 20px', borderRadius:10, border:'none',
              background:'linear-gradient(135deg,var(--p),var(--acc))',
              color:'#fff', fontWeight:700, cursor:'pointer',
            }}>
              Track your first reel
            </button>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--t3)', fontWeight:600, width:32 }}>
                    <input type="checkbox"
                      checked={selected.size === reels.length && reels.length > 0}
                      onChange={() => setSelected(selected.size === reels.length ? new Set() : new Set(reels.map(r => r._id)))}
                    />
                  </th>
                  {['Reel','Creator','Views','Likes','Comments','Eng%','Status','Updated',''].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--t3)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reels.map(reel => (
                  <tr key={reel._id}
                    onClick={() => setDetail(reel)}
                    style={{
                      borderBottom:'1px solid var(--border)', cursor:'pointer',
                      transition:'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <td style={{ padding:'12px 14px' }}>
                      <input type="checkbox" checked={selected.has(reel._id)}
                        onChange={e => toggleSelect(reel._id, e)} onClick={e => e.stopPropagation()}/>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {reel.thumbnail ? (
                          <img src={reel.thumbnail} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', flexShrink:0 }}
                            onError={e => e.target.style.display='none'}/>
                        ) : (
                          <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Play size={14} color="var(--t3)"/>
                          </div>
                        )}
                        <div style={{ maxWidth:180 }}>
                          <div style={{ fontSize:12, color:'var(--t2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {reel.caption?.slice(0,60) || reel.shortcode}
                          </div>
                          <a href={reel.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize:10, color:'var(--p)', display:'flex', alignItems:'center', gap:2 }}>
                            <ExternalLink size={9}/> {reel.shortcode}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:13, color:'var(--t1)', fontWeight:600 }}>
                      @{reel.username || '—'}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:700, color:'#60a5fa' }}>
                        <Eye size={12}/> {fmt(reel.views)}
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:700, color:'#f472b6' }}>
                        <Heart size={12}/> {fmt(reel.likes)}
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:700, color:'#a78bfa' }}>
                        <MessageCircle size={12}/> {fmt(reel.comments)}
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:13, fontWeight:700, color:'#34d399' }}>
                      {reel.engagement}%
                    </td>
                    <td style={{ padding:'12px 14px' }}>{statusBadge(reel.status)}</td>
                    <td style={{ padding:'12px 14px', fontSize:11, color:'var(--t3)', whiteSpace:'nowrap' }}>
                      {ago(reel.lastFetchedAt)}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={e => handleRefresh(reel._id, e)} title="Refresh"
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:4 }}>
                          <RefreshCw size={14}/>
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(reel._id); }} title="Remove"
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', padding:4 }}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
          {Array.from({ length: Math.ceil(total/20) }, (_, i) => i+1).map(p => (
            <button key={p} onClick={() => { setPage(p); load(p); }}
              style={{
                width:32, height:32, borderRadius:8, border:'1px solid var(--border)',
                background: p === page ? 'var(--p)' : 'var(--card)',
                color: p === page ? '#fff' : 'var(--t2)',
                fontWeight:600, fontSize:13, cursor:'pointer',
              }}>{p}</button>
          ))}
        </div>
      )}

      {/* Modals */}
      {showTrack && (
        <TrackModal
          onClose={() => setShowTrack(false)}
          onTracked={reel => { setReels(r => [reel, ...r]); load(); }}
          campaigns={myCampaigns}
        />
      )}
      {detail && (
        <ReelDetailModal reel={detail} onClose={() => setDetail(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
