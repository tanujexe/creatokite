import React from 'react';

/**
 * 1. OFFICIAL CREATOKITE ICON (Using User's High-Res Icon Image)
 */
export const CreatoKiteIcon = ({ size = 32, className = '', style = {} }) => {
  return (
    <img
      src="/logo.png"
      alt="CreatoKite Logo"
      className={`creatokite-icon-mark ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: 6,
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
      onError={(e) => {
        if (!e.currentTarget.src.includes('/logo.jpeg')) {
          e.currentTarget.src = '/logo.jpeg';
        }
      }}
    />
  );
};

/**
 * 2. SINGLE COLOR BLACK ICON
 */
export const CreatoKiteMonochromeIcon = ({ size = 32, color = 'var(--t1, #111827)', className = '', style = {} }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`creatokite-icon-mono ${className}`}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <path d="M 24 30 C 10 42 12 66 26 78 C 36 84 48 85 58 78 C 38 72 32 54 44 38 Z" fill={color} />
      <path d="M 24 28 L 88 18 L 48 46 Z" fill={color} />
      <path d="M 48 46 L 80 86 L 56 82 Z" fill={color} />
    </svg>
  );
};

/**
 * 3. STYLIZED CREATOKITE WORDMARK: C R E ▲ T O K I T E
 */
export const CreatoKiteWordmark = ({ size = 20, color, style = {} }) => {
  const textColor = color || 'var(--t1, #111827)';
  return (
    <span
      style={{
        fontFamily: '"Figtree", "Inter", system-ui, sans-serif',
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ color: textColor }}>CRE</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', margin: '0 1px' }}>
        <svg width={size * 0.72} height={size * 0.8} viewBox="0 0 20 22" fill="none">
          <path d="M10 2L19 20H1L10 2Z" fill={textColor} />
          <polygon points="10,9 15,18 5,18" fill="#D97706" />
        </svg>
      </span>
      <span style={{ color: textColor }}>TO</span>
      <span style={{ color: '#D97706', marginLeft: '0.12em', fontWeight: 900 }}>KITE</span>
    </span>
  );
};

/**
 * 4. UNIVERSAL BRAND LOGO COMPONENT
 * Renders Official Icon + Wordmark
 */
export const CreatoKiteLogo = ({
  variant = 'full',
  iconSize = 32,
  textSize = 20,
  color,
  className = '',
  style = {},
  onClick,
}) => {
  if (variant === 'icon') {
    return <CreatoKiteIcon size={iconSize} className={className} style={style} />;
  }

  if (variant === 'monochrome') {
    return <CreatoKiteMonochromeIcon size={iconSize} color={color} className={className} style={style} />;
  }

  if (variant === 'wordmark') {
    return <CreatoKiteWordmark size={textSize} color={color} style={style} />;
  }

  // Full Logo
  return (
    <div
      className={`creatokite-logo-full ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        textDecoration: 'none',
        ...style,
      }}
    >
      <CreatoKiteIcon size={iconSize} />
      <CreatoKiteWordmark size={textSize} color={color} />
    </div>
  );
};

export default CreatoKiteLogo;
