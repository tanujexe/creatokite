export function ClayBlobIllustration({ size = 110, style = {} }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', ...style }}>
      <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes sparkleRise {
            0% {
              transform: translateY(6px) scale(0.7);
              opacity: 0.15;
            }
            45% {
              transform: translateY(-5px) scale(1.15);
              opacity: 0.95;
            }
            85% {
              transform: translateY(-16px) scale(0.8);
              opacity: 0.5;
            }
            100% {
              transform: translateY(-22px) scale(0.4);
              opacity: 0;
            }
          }

          @keyframes blobSoftFloat {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-3px);
            }
          }

          .clay-blob-body {
            animation: blobSoftFloat 4s ease-in-out infinite;
          }

          .sparkle-up-1 {
            animation: sparkleRise 2.4s cubic-bezier(0.35, 0, 0.25, 1) infinite 0s;
          }
          .sparkle-up-2 {
            animation: sparkleRise 2.8s cubic-bezier(0.35, 0, 0.25, 1) infinite 0.7s;
          }
          .sparkle-up-3 {
            animation: sparkleRise 2.2s cubic-bezier(0.35, 0, 0.25, 1) infinite 1.4s;
          }
          .sparkle-up-4 {
            animation: sparkleRise 2.6s cubic-bezier(0.35, 0, 0.25, 1) infinite 0.35s;
          }
          .sparkle-up-5 {
            animation: sparkleRise 3.0s cubic-bezier(0.35, 0, 0.25, 1) infinite 1.05s;
          }
        `}</style>
        <defs>
          {/* Main Clay Body Gradient */}
          <linearGradient id="clayBodyGrad" x1="40" y1="20" x2="120" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FAF4EC" />
            <stop offset="45%" stopColor="#F2E6D8" />
            <stop offset="100%" stopColor="#E3D1BE" />
          </linearGradient>

          {/* Clay Inner Shadow Gradient */}
          <linearGradient id="clayShadowGrad" x1="80" y1="50" x2="80" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(195, 172, 150, 0)" />
            <stop offset="100%" stopColor="rgba(145, 120, 98, 0.35)" />
          </linearGradient>

          {/* Accent Coral Clay Ribbon */}
          <linearGradient id="coralAccent" x1="50" y1="40" x2="110" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A45" />
            <stop offset="60%" stopColor="#E65F2B" />
            <stop offset="100%" stopColor="#C04818" />
          </linearGradient>

          {/* Glossy Highlight */}
          <linearGradient id="glossHighlight" x1="70" y1="25" x2="90" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Soft Ground Shadow Filter */}
          <filter id="clayGroundShadow" x="20" y="90" width="120" height="25" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* ── Ground Shadow ── */}
        <ellipse cx="80" cy="102" rx="42" ry="7" fill="rgba(25, 20, 15, 0.22)" filter="url(#clayGroundShadow)" />

        {/* ── Animated Clay Mound / Blob Form ── */}
        <g className="clay-blob-body">
          {/* ── Main Soft Clay Mound ── */}
          <path
            d="M80 22C105 22 128 38 126 62C124 86 102 98 78 98C52 98 34 84 34 60C34 36 55 22 80 22Z"
            fill="url(#clayBodyGrad)"
          />

          {/* ── Clay Shading Layer ── */}
          <path
            d="M80 22C105 22 128 38 126 62C124 86 102 98 78 98C52 98 34 84 34 60C34 36 55 22 80 22Z"
            fill="url(#clayShadowGrad)"
          />

          {/* ── Organic Secondary Fold (Clay Ribbon / Curve) ── */}
          <path
            d="M52 68C64 54 94 52 110 68C116 74 114 84 104 88C90 94 62 94 48 82C44 78 46 72 52 68Z"
            fill="url(#coralAccent)"
          />

          {/* ── Top Glossy Reflection ── */}
          <ellipse cx="72" cy="38" rx="20" ry="10" transform="rotate(-15 72 38)" fill="url(#glossHighlight)" />
          <ellipse cx="62" cy="32" rx="6" ry="3" transform="rotate(-15 62 32)" fill="#FFFFFF" fillOpacity="0.85" />
        </g>

        {/* ── Floating Sparkle Star 1 (Top Right) — Upward Motion ── */}
        <g className="sparkle-up-1">
          <g transform="translate(125, 22)">
            <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="#E65F2B" opacity="0.85" />
          </g>
        </g>

        {/* ── Floating Sparkle Star 2 (Top Left) — Upward Motion ── */}
        <g className="sparkle-up-2">
          <g transform="translate(28, 28) scale(0.75)">
            <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="#D4A24C" opacity="0.8" />
          </g>
        </g>

        {/* ── Small Floating Dot 1 — Upward Motion ── */}
        <g className="sparkle-up-3">
          <circle cx="134" cy="48" r="2" fill="#D4A24C" opacity="0.6" />
        </g>

        {/* ── Small Floating Dot 2 — Upward Motion ── */}
        <g className="sparkle-up-4">
          <circle cx="22" cy="56" r="1.8" fill="#E65F2B" opacity="0.6" />
        </g>

        {/* ── Plus Sparkle (Top Center) — Upward Motion ── */}
        <g className="sparkle-up-5">
          <path d="M84 10V16M81 13H87" stroke="#D4A24C" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
}
