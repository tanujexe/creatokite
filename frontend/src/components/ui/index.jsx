import { useState, useRef, forwardRef } from 'react';
import {
  Users, Activity, User,
  DollarSign, BarChart2, TrendingUp,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   AVATAR
   ══════════════════════════════════════════════════════ */
export function Avatar({ src, name = '?', size = 36, style: s = {} }) {
  const [imgError, setImgError] = useState(false);
  const prevSrcRef = useRef(src);

  if (prevSrcRef.current !== src) {
    prevSrcRef.current = src;
    setImgError(false);
  }

  const cleanName = (name || '').trim();
  const initials = cleanName ? cleanName.slice(0, 2).toUpperCase() : '';
  const colors = [
    'linear-gradient(135deg,#E65F2B,#FF8552)',
    'linear-gradient(135deg,#E65F2B,#F5A623)',
    'linear-gradient(135deg,#D4A24C,#E65F2B)',
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#10b981,#0ea5e9)',
  ];
  const idx = cleanName ? Math.abs(cleanName.charCodeAt(0)) % colors.length : 0;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
          ...s
        }}
      />
    );
  }

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: '#ffffff',
        fontSize: Math.max(10, size * 0.38),
        background: colors[idx],
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        ...s
      }}
    >
      {initials ? (
        initials
      ) : (
        <User size={Math.max(12, size * 0.5)} color="#ffffff" style={{ opacity: 0.9 }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STATUS BADGE
   ══════════════════════════════════════════════════════ */
const STATUS_STYLES = {
  brand_submitted:   { bg:'rgba(59,130,246,0.12)', color:'#60a5fa', border:'rgba(59,130,246,0.25)',  label:'Submitted'         },
  admin_review:      { bg:'rgba(212,162,76,0.12)', color:'#f59e0b', border:'rgba(212,162,76,0.25)', label:'Under Review'      },
  ai_analyzing:      { bg:'rgba(99,102,241,0.12)', color:'#818cf8', border:'rgba(99,102,241,0.25)', label:'AI Analyzing'      },
  creators_assigned: { bg:'rgba(124,139,90,0.12)', color:'#7C8B5A', border:'rgba(124,139,90,0.25)', label:'Creators Assigned' },
  in_progress:       { bg:'rgba(230,95,43,0.12)', color:'#E65F2B', border:'rgba(230,95,43,0.25)', label:'In Progress'       },
  revision:          { bg:'rgba(212,162,76,0.12)', color:'#f59e0b', border:'rgba(212,162,76,0.25)', label:'Revision'          },
  completed:         { bg:'rgba(16,185,129,0.12)', color:'#10b981', border:'rgba(16,185,129,0.25)', label:'Completed'         },
  cancelled:         { bg:'rgba(232,93,69,0.10)',  color:'#E65F2B', border:'rgba(232,93,69,0.20)',  label:'Cancelled'         },
  approved:          { bg:'rgba(16,185,129,0.12)', color:'#10b981', border:'rgba(16,185,129,0.25)', label:'Approved'          },
  pending:           { bg:'rgba(212,162,76,0.12)', color:'#f59e0b', border:'rgba(212,162,76,0.25)', label:'Pending'           },
  rejected:          { bg:'rgba(232,93,69,0.10)',  color:'#E65F2B', border:'rgba(232,93,69,0.20)',  label:'Rejected'          },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg:'rgba(255,255,255,0.07)', color:'var(--t3)', border:'transparent', label: status || 'Unknown' };
  return (
    <span style={{
      fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99,
      background: s.bg, color: s.color, border:`1px solid ${s.border}`,
      textTransform:'uppercase', letterSpacing:0.4, whiteSpace:'nowrap',
    }}>
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   WORKFLOW PIPELINE
   ══════════════════════════════════════════════════════ */
const STEPS = [
  { key:'brand_submitted',   label:'Submitted'         },
  { key:'admin_review',      label:'Review'            },
  { key:'ai_analyzing',      label:'AI'                },
  { key:'creators_assigned', label:'Assigned'          },
  { key:'in_progress',       label:'In Progress'       },
  { key:'completed',         label:'Complete'          },
];

export function WorkflowPipeline({ status }) {
  const currentIdx = Math.max(0, STEPS.findIndex(s => s.key === status));
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      padding: '4px 0',
    }}>
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
            {/* Step Circle & Text Label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                transition: 'all 0.25s ease',
                background: done ? 'var(--acc2, #10b981)' : active ? 'var(--acc, #E65F2B)' : 'var(--s2, #26221F)',
                color: done || active ? '#ffffff' : 'var(--t3)',
                boxShadow: active ? '0 0 10px rgba(230, 95, 43, 0.4)' : 'none',
                border: active ? '2px solid rgba(255,255,255,0.6)' : '1px solid var(--border)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 9,
                color: active ? 'var(--acc, #E65F2B)' : done ? 'var(--acc2, #10b981)' : 'var(--t3)',
                fontWeight: active ? 800 : 500,
                whiteSpace: 'nowrap',
                letterSpacing: -0.2,
              }}>
                {step.label}
              </span>
            </div>

            {/* Connecting Bar Line between steps */}
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                margin: '0 4px',
                marginBottom: 14,
                background: done ? 'var(--acc2, #10b981)' : 'var(--border)',
                transition: 'background 0.3s ease',
                minWidth: 8,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STAT CARD
   ══════════════════════════════════════════════════════ */
const ICON_MAP = {
  users: Users, activity: Activity, campaigns: BarChart2,
  revenue: DollarSign, growth: TrendingUp,
};

export function StatCard({ label, value, icon: Icon, color = 'var(--p)', sub, onClick }) {
  return (
    <div
      className={`stat-card${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        {Icon && (
          <div style={{ width:32, height:32, borderRadius:'var(--r)', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   EMPTY STATE
   ══════════════════════════════════════════════════════ */
export function EmptyState({ icon = '🔍', title = 'Nothing here', desc = '', action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <div className="empty-title">{title}</div>
      {desc && <p className="empty-desc">{desc}</p>}
      {action && <div style={{ marginTop:8 }}>{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE LOADER
   ══════════════════════════════════════════════════════ */
export function PageLoader() {
  return (
    <div className="page-loader">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(74, 62, 61, 0.08)',
          borderTopColor: '#E65F2B',
          animation: 'spin 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        }} />
        <span style={{ fontSize:12, fontFamily:'Inter, sans-serif', fontWeight:500, color:'#4A3E3D', opacity: 0.55, letterSpacing:'0.03em' }}>Loading…</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SKELETON CARD
   ══════════════════════════════════════════════════════ */
export function SkeletonCard() {
  return (
    <div className="card" style={{ padding:20 }}>
      <div className="skeleton" style={{ height:14, width:'60%', marginBottom:10 }}/>
      <div className="skeleton" style={{ height:24, width:'35%', marginBottom:8 }}/>
      <div className="skeleton" style={{ height:10, width:'45%' }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════ */
export function Modal({ open, onClose, title, children, maxWidth = 560, fullscreenMobile = true }) {
  if (!open) return null;
  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:900,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding: fullscreenMobile ? 0 : 16,
        animation:'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-modal modal-mobile-sheet"
        style={{
          width:'100%', maxWidth, maxHeight:'90vh',
          overflow:'hidden', display:'flex', flexDirection:'column',
          animation:'scaleIn 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h3 style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'80%' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:20, lineHeight:1, padding:'0 2px', flexShrink:0 }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding:'16px 18px', overflowY:'auto', flex:1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CONFIRM DIALOG
   ══════════════════════════════════════════════════════ */
export function Confirm({ open, onClose, onConfirm, title = 'Are you sure?', desc = '', confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={400}>
      {desc && <p style={{ fontSize:13, color:'var(--t2)', marginBottom:16, lineHeight:1.6 }}>{desc}</p>}
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════
   PROGRESS BAR
   ══════════════════════════════════════════════════════ */
export function ProgressBar({ value = 0, max = 100, color = 'var(--p)', height = 5 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:4, transition:'width 0.6s ease' }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB BAR
   ══════════════════════════════════════════════════════ */
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding:'10px 16px', fontSize:12, fontWeight: active === t.key ? 700 : 500,
            color: active === t.key ? 'var(--p)' : 'var(--t2)',
            background:'transparent', border:'none', cursor:'pointer', whiteSpace:'nowrap',
            borderBottom:`2px solid ${active === t.key ? 'var(--p)' : 'transparent'}`,
            transition:'all 0.12s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function AppLoader() {
  return (
    <div className="app-loading-overlay" style={{ background:'#FAF5EC' }}>
      <img src="/favicon.jpeg" alt="" style={{ width:36, height:36, borderRadius:8, marginBottom:16, boxShadow:'0 6px 20px rgba(230,95,43,0.12)' }} />
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2.5px solid rgba(74, 62, 61, 0.08)',
        borderTopColor: '#E65F2B',
        animation: 'spin 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        marginBottom: 12,
      }} />
      <span style={{ fontSize:12, fontFamily:'Inter, sans-serif', fontWeight:500, color:'#4A3E3D', opacity:0.5, letterSpacing:'0.03em' }}>Loading your workspace…</span>
    </div>
  );
}

export function Spinner({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `${Math.max(2, size * 0.08)}px solid rgba(74, 62, 61, 0.08)`,
      borderTopColor: '#E65F2B',
      animation: 'spin 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
    }} />
  );
}

export function Btn({ variant = 'secondary', size = '', className = '', loading = false, children, ...props }) {
  return (
    <button className={`btn btn-${variant}${size ? ` btn-${size}` : ''} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}

export const Input = forwardRef(function Input({ label, hint, error, className = '', ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input ref={ref} className={`form-input${error ? ' border-rose' : ''} ${className}`} {...props} />
      {hint && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, className = '', ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea ref={ref} className={`form-input form-textarea ${className}`} {...props} />
      {hint && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, hint, children, className = '', ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select ref={ref} className={`form-input ${className}`} style={{ cursor:'pointer' }} {...props}>
        {children}
      </select>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
});

export function ScoreRing({ score = 0, size = 80, max = 1000, color = 'var(--p)' }) {
  const r = 34, circ = 2 * Math.PI * r, fill = (score / max) * circ;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0, borderRadius: '50%', overflow: 'hidden' }}>
      <svg width={size} height={size} viewBox="0 0 80 80" style={{ display: 'block' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border2)" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" style={{ transition:'stroke-dasharray 0.8s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color }}>
        {score}
      </div>
    </div>
  );
}

export function TrustScore({ score = 70, size = 'sm' }) {
  const color = score >= 80 ? 'var(--acc2)' : score >= 60 ? 'var(--gold)' : 'var(--rose)';
  if (size === 'sm') return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${score}%`, height:'100%', background:color, borderRadius:2, transition:'width 0.6s ease' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, color, minWidth:28 }}>{score}</span>
    </div>
  );
  return <span style={{ fontSize:13, fontWeight:700, color, fontFamily:'var(--fd)' }}>{score}<span style={{ fontSize:10, color:'var(--t3)', fontWeight:400 }}>/100</span></span>;
}

export function SearchBar({ value, onChange, placeholder = 'Search…', style = {} }) {
  return (
    <div style={{ position:'relative', ...style }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', fontSize:14 }}>🔍</span>
      <input value={value} onChange={onChange} placeholder={placeholder} className="form-input" style={{ paddingLeft:36 }} />
    </div>
  );
}

export function DeliverableRow({ creator, status, submittedAt, paymentAlloc }) {
  const STATUS_C = { assigned:'var(--t3)', accepted:'var(--gold)', in_progress:'#6366f1', submitted:'var(--p)', approved:'var(--acc2)', completed:'var(--acc2)', published:'var(--acc2)', declined:'var(--rose)', revision:'var(--gold)' };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
      <Avatar src={creator?.avatar} name={creator?.displayName} size={30} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{creator?.displayName || 'Creator'}</div>
        {submittedAt && <div style={{ fontSize:10, color:'var(--t3)' }}>Submitted {new Date(submittedAt).toLocaleDateString()}</div>}
      </div>
      <span style={{ fontSize:11, fontWeight:700, color:STATUS_C[status] || 'var(--t3)', background:`${STATUS_C[status] || 'var(--t3)'}15`, padding:'3px 8px', borderRadius:99, whiteSpace:'nowrap' }}>{status?.replace('_', ' ')}</span>
      {paymentAlloc > 0 && <span style={{ fontSize:11, color:'var(--acc2)', fontFamily:'var(--fd)', fontWeight:700, minWidth:60, textAlign:'right' }}>₹{paymentAlloc.toLocaleString('en-IN')}</span>}
    </div>
  );
}

export { default as StartupAnimation } from './StartupAnimation';


