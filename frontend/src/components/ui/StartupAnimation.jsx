import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ShieldCheck, Activity } from 'lucide-react';

class Particle {
  constructor(W, H) {
    this.reset(W, H);
  }

  reset(W, H) {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.size = Math.random() * 2.4 + 1;
    this.alpha = Math.random() * 0.4 + 0.15;
    this.color = Math.random() > 0.4 ? '230, 95, 43' : '245, 166, 35'; // Coral orange vs warm gold
  }

  update(W, H) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
      this.reset(W, H);
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgba(${this.color}, 0.5)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export default function StartupAnimation({ children }) {
  const [seen, setSeen] = useState(() => !!window.__creatokite_intro_seen);
  const [reveal, setReveal] = useState(() => !!window.__creatokite_intro_seen);
  const [animationDone, setAnimationDone] = useState(() => !!window.__creatokite_intro_seen);
  const [progress, setProgress] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const canvasRef = useRef(null);

  const phrases = [
    { text: "Initializing AI Campaign Engine", icon: Zap },
    { text: "Verifying Creator Authenticity & CAS", icon: ShieldCheck },
    { text: "Optimizing Niche Engagement Metrics", icon: Activity },
    { text: "Igniting Creative Synergy", icon: Sparkles },
  ];

  // Progress bar & phrases interval
  useEffect(() => {
    if (seen) return;

    const start = Date.now();
    const duration = 2400;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 30) setPhraseIdx(0);
      else if (pct < 60) setPhraseIdx(1);
      else if (pct < 85) setPhraseIdx(2);
      else setPhraseIdx(3);

      if (pct >= 100) {
        clearInterval(interval);
        handleComplete();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [seen]);

  const handleComplete = () => {
    window.__creatokite_intro_seen = true;
    setReveal(true);
    setTimeout(() => {
      setAnimationDone(true);
      setSeen(true);
    }, 900);
  };

  // Canvas interactive particle animation with network lines
  useEffect(() => {
    if (seen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const particles = Array.from({ length: 65 }, () => new Particle(canvas.width, canvas.height));

    let animId = null;
    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Single Signature Warm Porcelain Theme Radial Gradient
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
      bgGrad.addColorStop(0, '#FAF7F2');
      bgGrad.addColorStop(0.5, '#F7F1E7');
      bgGrad.addColorStop(1, '#EFE7D8');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(229, 91, 43, ${0.14 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Update & render particles
      particles.forEach(p => {
        p.update(W, H);
        p.draw(ctx);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [seen]);

  if (seen) return <>{children}</>;

  const ActiveIcon = phrases[phraseIdx]?.icon || Sparkles;

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Underlying Landing Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={reveal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', minHeight: '100vh', overflowX: 'hidden' }}
      >
        {children}
      </motion.div>

      {/* ── OVERLAY INTRO ANIMATION ──────────────────────────── */}
      {!animationDone && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={reveal ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: reveal ? 'none' : 'auto',
            background: '#FAF7F2',
          }}
        >
          {/* Animated Background Canvas */}
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

          {/* Glowing Ambient Radial Backdrop */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(600px, 90vw)',
            height: 'min(600px, 90vh)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(229, 91, 43, 0.12) 0%, rgba(245, 166, 35, 0.04) 45%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }} />

          {/* Top-Right Porcelain Skip Button */}
          <button
            onClick={handleComplete}
            style={{
              position: 'absolute',
              top: 28,
              right: 28,
              zIndex: 100000,
              padding: '8px 22px',
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#374151',
              background: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 99,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E55B2B';
              e.currentTarget.style.borderColor = '#E55B2B';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.color = '#374151';
            }}
          >
            <span>Skip</span>
            <span style={{ fontSize: 10, opacity: 0.7 }}>➔</span>
          </button>

          {/* ── CENTERED HERO STARTUP CONTENT ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              zIndex: 99995,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
              maxWidth: 520,
              padding: '0 24px',
              boxSizing: 'border-box',
            }}
          >
            {/* Glowing Logo Container with Pulsing Halo */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'relative', marginBottom: 24 }}
            >
              {/* Rotating Conic Ring */}
              <div style={{
                position: 'absolute',
                inset: -6,
                borderRadius: 24,
                background: 'conic-gradient(from 0deg, #E55B2B, #F5A623, #E55B2B)',
                filter: 'blur(8px)',
                opacity: 0.5,
                animation: 'spinRing 4s linear infinite',
              }} />
              <style>{`@keyframes spinRing { to { transform: rotate(360deg); } }`}</style>

              {/* Logo Box - Porcelain Styling */}
              <div style={{
                position: 'relative',
                width: 72,
                height: 72,
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid rgba(229, 91, 43, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 16px 35px -8px rgba(229, 91, 43, 0.2), 0 2px 6px rgba(0,0,0,0.04)',
              }}>
                <img
                  src="/logo.png"
                  alt="CreatoKite"
                  style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'contain' }}
                  onError={e => { e.currentTarget.src = '/logo.jpeg'; }}
                />
              </div>
            </motion.div>

            {/* Badge pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                borderRadius: 99,
                background: 'rgba(229, 91, 43, 0.08)',
                border: '1px solid rgba(229, 91, 43, 0.2)',
                color: '#E55B2B',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              <Sparkles size={12} />
              <span>AI Creator Operating System</span>
            </motion.div>

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(36px, 6vw, 50px)',
              fontWeight: 900,
              fontFamily: '"Figtree", sans-serif',
              letterSpacing: '-0.03em',
              color: '#111827',
              margin: '0 0 8px 0',
              lineHeight: 1.05,
            }}>
              Creato<span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 400, color: '#E55B2B', marginLeft: 2 }}>Kite</span>
            </h1>

            {/* Subtitle - High Contrast Charcoal */}
            <p style={{
              fontFamily: '"EB Garamond", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 'clamp(17px, 3vw, 21px)',
              color: '#4B5563',
              margin: '0 0 28px 0',
              letterSpacing: '0.01em',
              fontWeight: 500,
            }}>
              India's Intelligent Campaign Operating System
            </p>

            {/* Loading Meter Container - White Porcelain Box */}
            <div style={{
              width: '100%',
              maxWidth: 340,
              background: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 20,
              padding: '18px 24px',
              boxShadow: '0 16px 40px -10px rgba(229, 91, 43, 0.12), 0 2px 8px rgba(0,0,0,0.03)',
              marginBottom: 18
            }}>
              {/* Progress & Percentage Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  LOADING SYSTEM
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, fontFamily: '"Figtree", sans-serif', color: '#E55B2B' }}>
                  {progress}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div style={{ height: 6, background: 'rgba(229, 91, 43, 0.12)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: '#E55B2B',
                    borderRadius: 99,
                    boxShadow: '0 0 10px rgba(229, 91, 43, 0.4)',
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
            </div>

            {/* Dynamic Status Phrase */}
            <div style={{ minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={phraseIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontSize: 13, fontWeight: 600 }}
                >
                  <ActiveIcon size={14} style={{ color: '#E55B2B' }} />
                  <span>{phrases[phraseIdx]?.text}</span>
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

