import { Btn } from '../../components/ui';

/** Shared page header for creator workspace */
export function CreatorPageHeader({
  eyebrow,
  title,
  desc,
  actions,
  icon: Icon,
}) {
  return (
    <div className="ck-page-header">
      <div style={{ minWidth: 0, flex: 1 }}>
        {eyebrow && (
          <div className="ck-page-eyebrow">
            {Icon ? <Icon size={12} /> : null}
            {eyebrow}
          </div>
        )}
        <h1 className="ck-page-title">{title}</h1>
        {desc && <p className="ck-page-desc">{desc}</p>}
      </div>
      {actions && <div className="ck-page-actions">{actions}</div>}
    </div>
  );
}

export function CreatorStat({ label, value, icon: Icon, color = 'var(--p)', sub }) {
  return (
    <div
      className="ck-stat"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.boxShadow = `0 12px 28px ${color}12, var(--glass-shadow)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
      }}
    >
      <div className="ck-stat__top">
        <span className="ck-stat__label">{label}</span>
        {Icon && (
          <div className="ck-stat__icon" style={{ background: `${color}14` }}>
            <Icon size={15} color={color} />
          </div>
        )}
      </div>
      <div className="ck-stat__value">{value}</div>
      {sub && <div className="ck-stat__sub">{sub}</div>}
    </div>
  );
}

export function CreatorEmpty({ icon: Icon, title, desc, actionLabel, onAction }) {
  return (
    <div className="ck-empty">
      {Icon && (
        <div className="ck-empty__icon">
          <Icon size={22} />
        </div>
      )}
      <div className="ck-empty__title">{title}</div>
      {desc && <p className="ck-empty__desc">{desc}</p>}
      {actionLabel && onAction && (
        <Btn variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Btn>
      )}
    </div>
  );
}

export function CreatorSection({ title, meta, action, children, flush }) {
  return (
    <div className={`ck-card${flush ? ' ck-card--flush' : ''}`}>
      {(title || action || meta) && (
        <div className={flush ? 'ck-card__head' : undefined} style={flush ? undefined : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            {title && <h3 className="ck-card__title">{title}</h3>}
            {meta && <div className="ck-card__meta" style={{ marginTop: 2 }}>{meta}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
