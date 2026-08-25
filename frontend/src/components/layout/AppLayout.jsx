import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';

const SPRINKLE_COLORS = [
  'rgba(255, 133, 111, 0.35)',   // soft coral
  'rgba(255, 107, 87, 0.25)',    // muted primary
  'rgba(212, 162, 76, 0.3)',     // warm gold
  'rgba(143, 186, 116, 0.25)',   // sage green
  'rgba(255, 164, 148, 0.22)',   // blush pink
];

function GlobalBackgroundElements() {
  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => {
      const col = SPRINKLE_COLORS[i % SPRINKLE_COLORS.length];
      const size = 2 + Math.random() * 4;
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size,
        color: col,
        blur: size > 4 ? 2 : size > 3 ? 1 : 0,
        dur: 8 + Math.random() * 12,
        delay: Math.random() * -16,
        drift: 20 + Math.random() * 40,
        rot: Math.round(-20 + Math.random() * 40),
      };
    })
  ).current;

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: 0.85 }}>
      {/* Background Kites */}
      {particles.map(p => (
        <div
          key={p.id}
          className="hero-sprinkle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size * 3.5,
            height: p.size * 4.5,
            color: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
            transform: `rotate(${p.rot}deg)`,
            opacity: 0.65
          }}
        >
          <svg viewBox="0 0 24 30" width="100%" height="100%" fill="currentColor">
            {/* Diamond Body */}
            <path d="M 12 2 L 20 10 L 12 18 L 4 10 Z" />
            {/* Crossbar Lines */}
            <path d="M 4 10 L 20 10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <path d="M 12 2 L 12 18" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            {/* Curved Tail Thread */}
            <path d="M 12 18 Q 9 22 13 26 T 11 30" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
          </svg>
        </div>
      ))}

      {/* Soothing Ambient Glow Orbs */}
      <div style={{
        position: 'absolute', top: '20%', right: '10%',
        width: '280px', height: '280px',
        background: 'radial-gradient(circle, rgba(212, 162, 76, 0.03) 0%, transparent 70%)',
        filter: 'blur(45px)', zIndex: 0,
        animation: 'sprinkleOrb 16s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '10%',
        width: '240px', height: '240px',
        background: 'radial-gradient(circle, rgba(255, 107, 87, 0.02) 0%, transparent 70%)',
        filter: 'blur(35px)', zIndex: 0,
        animation: 'sprinkleOrb 18s ease-in-out 3s infinite alternate-reverse',
      }} />
    </div>
  );
}


export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  /* Close sidebar & scroll top on route change */
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      setSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  /* ESC closes sidebar */
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  /* Lock body scroll on mobile when sidebar open */
  useEffect(() => {
    const lock = sidebarOpen && window.innerWidth < 768;
    document.body.style.overflow = lock ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const { getActiveRole } = useAuth();
  const activeRole = getActiveRole();
  const isCreator = activeRole === 'creator';

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const isBrand = activeRole === 'brand';

  return (
    <div className={`app-layout ${isBrand ? 'brand-portal' : ''}`}>
      {/* Render background elements for Creator and Brand roles */}
      {(isCreator || isBrand) && <GlobalBackgroundElements />}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="main-area" style={{ position: 'relative', zIndex: 1 }}>
        <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className="page-content" key={location.pathname}>
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
