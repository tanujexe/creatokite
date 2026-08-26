import { useState, useRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';
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
  brand_submitted: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)', label: 'Submitted' },
  admin_review: { bg: 'rgba(212,162,76,0.12)', color: '#f59e0b', border: 'rgba(212,162,76,0.25)', label: 'Under Review' },
  ai_analyzing: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)', label: 'AI Analyzing' },
  creators_assigned: { bg: 'rgba(124,139,90,0.12)', color: '#7C8B5A', border: 'rgba(124,139,90,0.25)', label: 'Creators Assigned' },
  in_progress: { bg: 'rgba(230,95,43,0.12)', color: '#E65F2B', border: 'rgba(230,95,43,0.25)', label: 'In Progress' },
  revision: { bg: 'rgba(212,162,76,0.12)', color: '#f59e0b', border: 'rgba(212,162,76,0.25)', label: 'Revision' },
  completed: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Completed' },
  cancelled: { bg: 'rgba(232,93,69,0.10)', color: '#E65F2B', border: 'rgba(232,93,69,0.20)', label: 'Cancelled' },
  approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)', label: 'Approved' },
  pending: { bg: 'rgba(212,162,76,0.12)', color: '#f59e0b', border: 'rgba(212,162,76,0.25)', label: 'Pending' },
  rejected: { bg: 'rgba(232,93,69,0.10)', color: '#E65F2B', border: 'rgba(232,93,69,0.20)', label: 'Rejected' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: 'rgba(255,255,255,0.07)', color: 'var(--t3)', border: 'transparent', label: status || 'Unknown' };
  const isPulsing = ['in_progress', 'ai_analyzing', 'admin_review', 'pending', 'brand_submitted', 'creators_assigned'].includes(status);

  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {isPulsing && (
        <span className="badge-pulse-dot" style={{ background: s.color }} />
      )}
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   WORKFLOW PIPELINE
   ══════════════════════════════════════════════════════ */
const STEPS = [
  { key: 'brand_submitted', label: 'Submitted' },
  { key: 'admin_review', label: 'Review' },
  { key: 'ai_analyzing', label: 'AI' },
  { key: 'creators_assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Complete' },
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
      padding: '8px 0',
    }}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
            {/* Step Circle & Text Label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                background: done
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : active
                    ? 'linear-gradient(135deg, #E65F2B, #FF8552)'
                    : 'var(--s2, #26221F)',
                color: done || active ? '#ffffff' : 'var(--t3)',
                boxShadow: active
                  ? '0 0 16px rgba(230, 95, 43, 0.5), 0 0 4px rgba(255,255,255,0.8)'
                  : done
                    ? '0 0 10px rgba(16, 185, 129, 0.3)'
                    : 'none',
                border: active ? '2px solid #ffffff' : '1px solid var(--border)',
                transform: active ? 'scale(1.15)' : 'scale(1)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10,
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
                height: 3,
                margin: '0 6px',
                marginBottom: 16,
                borderRadius: 99,
                background: done
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : i === currentIdx
                    ? 'linear-gradient(90deg, #E65F2B, var(--border))'
                    : 'var(--border)',
                transition: 'background 0.3s ease',
                minWidth: 10,
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
      className={`stat-card hover-lift${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : undefined,
        padding: '20px 22px',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        boxShadow: 'var(--glass-shadow)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative accent glow spot */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: 70,
        height: 70,
        borderRadius: '50%',
        background: `${color}15`,
        filter: 'blur(15px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, position: 'relative', zIndex: 1 }}>
        {Icon && (
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `${color}1A`, border: `1px solid ${color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: `0 4px 12px ${color}20`,
          }}>
            <Icon size={18} style={{ color }} />
          </div>
        )}
        <div className="stat-value" style={{ color: 'var(--t1)', margin: 0, lineHeight: 1, fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 800 }}>
          {value}
        </div>
      </div>
      <div className="stat-label" style={{ fontWeight: 700, fontSize: 13, color: 'var(--t2)', position: 'relative', zIndex: 1 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, position: 'relative', zIndex: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

import { ClayBlobIllustration } from './ClayBlobIllustration';
export { ClayBlobIllustration };

/* ══════════════════════════════════════════════════════
   EMPTY STATE
   ══════════════════════════════════════════════════════ */
export function EmptyState({ icon, title = 'Nothing here', desc = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <ClayBlobIllustration size={115} />
      </div>
      <div className="empty-title">{title}</div>
      {desc && <p className="empty-desc">{desc}</p>}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE LOADER
   ══════════════════════════════════════════════════════ */
export function PageLoader() {
  return (
    <div className="page-loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 14 }}>
      <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2.5px solid rgba(229, 91, 43, 0.12)',
          borderTopColor: '#E65F2B',
          animation: 'spin 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        }} />
        <img
          src="/logo.png"
          alt="CreatoKite"
          onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }}
          style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }}
        />
      </div>
      <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'var(--t3)', letterSpacing: '0.02em' }}>Loading…</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SKELETON CARD
   ══════════════════════════════════════════════════════ */
export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 24, width: '35%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '45%' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════ */
export function Modal({ open, onClose, title, children, maxWidth = 560, fullscreenMobile = true }) {
  if (!open) return null;
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(25, 20, 18, 0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-modal"
        style={{
          width: '100%', maxWidth, maxHeight: '90vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          borderRadius: 20, border: '1.5px solid var(--border2, rgba(230, 95, 43, 0.25))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          animation: 'scaleIn 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 800, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%', margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(230,95,43,0.08)', border: '1px solid rgba(230,95,43,0.2)',
              borderRadius: 10, cursor: 'pointer', color: 'var(--acc, #E65F2B)', fontSize: 18,
              lineHeight: 1, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════
   CONFIRM DIALOG
   ══════════════════════════════════════════════════════ */
export function Confirm({ open, onClose, onConfirm, title = 'Are you sure?', desc = '', confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={400}>
      {desc && <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16, lineHeight: 1.6 }}>{desc}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
    <div style={{ height, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB BAR
   ══════════════════════════════════════════════════════ */
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '10px 16px', fontSize: 12, fontWeight: active === t.key ? 700 : 500,
            color: active === t.key ? 'var(--p)' : 'var(--t2)',
            background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            borderBottom: `2px solid ${active === t.key ? 'var(--p)' : 'transparent'}`,
            transition: 'all 0.12s',
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
    <div className="app-loading-overlay" style={{ background: '#FAF5EC' }}>
      <img src="/logo.png" alt="CreatoKite" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} style={{ width: 36, height: 36, borderRadius: 8, marginBottom: 16, boxShadow: '0 6px 20px rgba(230,95,43,0.12)', objectFit: 'contain' }} />
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2.5px solid rgba(74, 62, 61, 0.08)',
        borderTopColor: '#E65F2B',
        animation: 'spin 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        marginBottom: 12,
      }} />
      <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#4A3E3D', opacity: 0.5, letterSpacing: '0.03em' }}>Loading your workspace…</span>
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
      <select ref={ref} className={`form-input ${className}`} style={{ cursor: 'pointer' }} {...props}>
        {children}
      </select>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
});

export function ScoreRing({ score = 0, size = 80, max = 1000, color = 'var(--p)' }) {
  const r = 34, circ = 2 * Math.PI * r, fill = (score / max) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, borderRadius: '50%', overflow: 'hidden' }}>
      <svg width={size} height={size} viewBox="0 0 80 80" style={{ display: 'block' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border2)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color }}>
        {score}
      </div>
    </div>
  );
}

export function TrustScore({ score = 70, size = 'sm' }) {
  const color = score >= 80 ? 'var(--acc2)' : score >= 60 ? 'var(--gold)' : 'var(--rose)';
  if (size === 'sm') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 28 }}>{score}</span>
    </div>
  );
  return <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--fd)' }}>{score}<span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 400 }}>/100</span></span>;
}

export function SearchBar({ value, onChange, placeholder = 'Search…', style = {} }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 14 }}>🔍</span>
      <input value={value} onChange={onChange} placeholder={placeholder} className="form-input" style={{ paddingLeft: 36 }} />
    </div>
  );
}

export function DeliverableRow({ creator, status, submittedAt, paymentAlloc }) {
  const STATUS_C = { assigned: 'var(--t3)', accepted: 'var(--gold)', in_progress: '#6366f1', submitted: 'var(--p)', approved: 'var(--acc2)', completed: 'var(--acc2)', published: 'var(--acc2)', declined: 'var(--rose)', revision: 'var(--gold)' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
      <Avatar src={creator?.avatar} name={creator?.displayName} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{creator?.displayName || 'Creator'}</div>
        {submittedAt && <div style={{ fontSize: 10, color: 'var(--t3)' }}>Submitted {new Date(submittedAt).toLocaleDateString()}</div>}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_C[status] || 'var(--t3)', background: `${STATUS_C[status] || 'var(--t3)'}15`, padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>{status?.replace('_', ' ')}</span>
      {paymentAlloc > 0 && <span style={{ fontSize: 11, color: 'var(--acc2)', fontFamily: 'var(--fd)', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>₹{paymentAlloc.toLocaleString('en-IN')}</span>}
    </div>
  );
}

export function getInstagramLink(val) {
  if (!val) return null;
  let raw = String(val).trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    let clean = raw.replace(/[?#].*$/, '');
    let match = clean.match(/instagram\.com\/([^/]+)/i);
    let handle = match && match[1] && !['p', 'reel', 'reels', 'stories'].includes(match[1].toLowerCase()) ? `@${match[1]}` : '@instagram';
    return { url: raw, handle, raw };
  }

  let handle = raw;
  if (handle.startsWith('@')) handle = handle.slice(1);
  handle = handle.replace(/\/.*$/, '').trim();
  if (!handle) return null;

  return {
    url: `https://www.instagram.com/${handle}/`,
    handle: `@${handle}`,
    raw
  };
}

export function getYouTubeLink(val) {
  if (!val) return null;
  let raw = String(val).trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    let clean = raw.replace(/[?#].*$/, '');
    let match = clean.match(/youtube\.com\/@?([^/]+)/i);
    let handle = match && match[1] ? `@${match[1]}` : '@youtube';
    return { url: raw, handle, raw };
  }

  let handle = raw;
  if (handle.startsWith('@')) handle = handle.slice(1);
  handle = handle.replace(/\/.*$/, '').trim();
  if (!handle) return null;

  return {
    url: `https://www.youtube.com/@${handle}`,
    handle: `@${handle}`,
    raw
  };
}

export function GmailIcon({ size = 14, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <path fill="#4285F4" d="M22 6v12c0 1.1-.9 2-2 2h-3V11l-5 3.5L7 11v9H4c-1.1 0-2-.9-2-2V6c0-.4.1-.7.4-1L12 11.5 21.6 5c.3.3.4.6.4 1z" />
      <path fill="#34A853" d="M22 6l-10 6.5L2 6V5c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v1z" />
      <path fill="#EA4335" d="M12 12.5L2 5c.3-.6.9-1 1.6-1h16.8c.7 0 1.3.4 1.6 1L12 12.5z" />
      <path fill="#FBBC04" d="M2 5.5L12 12l10-6.5c-.3-.3-.7-.5-1.2-.5H3.2c-.5 0-.9.2-1.2.5z" opacity="0.4" />
    </svg>
  );
}

export function InstagramIcon({ size = 14, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <radialGradient id="ig-official-grad" cx="0.3" cy="1.05" r="1.15">
        <stop offset="0" stopColor="#833ab4" />
        <stop offset="0.5" stopColor="#fd1d1d" />
        <stop offset="1" stopColor="#fcb045" />
      </radialGradient>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-official-grad)" />
      <path fill="none" stroke="#ffffff" strokeWidth="2" d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="#ffffff" />
    </svg>
  );
}

export function renderTextWithLinks(text, options = {}) {
  if (!text) return null;
  const str = String(text);
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = str.split(urlRegex);

  return parts.map((part, idx) => {
    if (part.match(/^https?:\/\//i)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            color: options.color || 'var(--acc, #E65F2B)',
            textDecoration: 'underline',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            ...options.style
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function RenderTextWithLinks({ text, options = {}, style = {}, className = '' }) {
  if (!text) return null;
  return (
    <span className={className} style={{ wordBreak: 'break-word', ...style }}>
      {renderTextWithLinks(text, options)}
    </span>
  );
}

export { default as StartupAnimation } from './StartupAnimation';



