import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.25;
    this.vy = -Math.random() * 0.3 - 0.1;
    this.size = Math.random() * 2.2 + 0.6;
    this.alpha = Math.random() * 0.25 + 0.08;
    this.color = Math.random() > 0.5
      ? `rgba(238, 120, 70, ` // soft warm coral peach
      : `rgba(220, 170, 95, `; // soft warm amber gold
    this.swaySpeed = Math.random() * 0.008 + 0.003;
    this.swayOffset = Math.random() * Math.PI * 2;
  }

  update(W, H) {
    this.y += this.vy;
    this.x += this.vx + Math.sin(Date.now() * this.swaySpeed + this.swayOffset) * 0.08;
    if (this.y < -10) { this.y = H + 10; this.x = Math.random() * W; }
    if (this.x < -10) this.x = W + 10;
    if (this.x > W + 10) this.x = -10;
  }

  draw(ctx) {
    ctx.fillStyle = this.color + this.alpha + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function StartupAnimation({ children }) {
  const [seen, setSeen] = useState(() => !!window.__creatokite_intro_seen);
  const [reveal, setReveal] = useState(() => !!window.__creatokite_intro_seen);
  const [animationDone, setAnimationDone] = useState(() => !!window.__creatokite_intro_seen);
  const [loadingPhrase, setLoadingPhrase] = useState("Calibrating Creator Score Database");
  const canvasRef = useRef(null);
  const particles = useRef([]);

  // Cycle loading phrases
  useEffect(() => {
    if (seen) return;
    const phrases = [
      "Calibrating Creator Score Database",
      "Verifying Brand Guidelines",
      "Analyzing Niche Engagement",
      "Matching Creator Power Scores",
      "Igniting Creative Synergy",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phrases.length;
      setLoadingPhrase(phrases[idx]);
    }, 500);
    return () => clearInterval(interval);
  }, [seen]);

  const handleComplete = () => {
    window.__creatokite_intro_seen = true;
    setReveal(true);
    setTimeout(() => {
      setAnimationDone(true);
      setSeen(true);
    }, 1000);
  };

  // Auto transition after 2.4s
  useEffect(() => {
    if (seen) return;
    const timer = setTimeout(handleComplete, 2400);
    return () => clearTimeout(timer);
  }, [seen]);

  // Canvas particle animation
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

    // Warm floating particles
    particles.current = Array.from(
      { length: 60 },
      () => new Particle(Math.random() * canvas.width, Math.random() * canvas.height)
    );

    let animId = null;
    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Dynamic canvas background based on active theme
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
      if (isDark) {
        grad.addColorStop(0, '#1C1917');
        grad.addColorStop(0.5, '#12100F');
        grad.addColorStop(1, '#0A0908');
      } else {
        grad.addColorStop(0, '#FFFDF9');
        grad.addColorStop(0.5, '#FAF6EE');
        grad.addColorStop(1, '#F4EDE2');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Update & draw particles
      particles.current.forEach(p => {
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

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '100vw', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Landing content — fades in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={reveal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', minHeight: '100vh', overflowX: 'hidden' }}
      >
        {children}
      </motion.div>

      {/* ── STARTUP OVERLAY ──────────────────────────── */}
      {!animationDone && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={reveal ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh',
            zIndex: 99999,
            overflow: 'hidden',
            pointerEvents: reveal ? 'none' : 'auto',
          }}
        >
          {/* Canvas for particle background */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
            }}
          />

          {/* Warm ambient soft peach glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(450px, 80vw)', height: 'min(450px, 80vh)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,120,60,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />

          {/* ── CENTER / RIGHT ALIGNED CONTENT ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: '50%',
              right: 'clamp(16px, 5vw, 48px)',
              left: 'auto',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: 'min(340px, calc(100% - 32px))',
              maxWidth: 'calc(100vw - 32px)',
              boxSizing: 'border-box',
              zIndex: 99995,
              pointerEvents: 'none',
            }}
          >
            {/* Logo mark */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                width: '100%',
              }}
            >
              <img
                src="/favicon.jpeg"
                alt=""
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  margin: '0 auto',
                  display: 'block',
                  boxShadow: '0 8px 24px rgba(230,95,43,0.12)',
                }}
              />
            </motion.div>

            {/* Brand name — Inter bold */}
            <motion.h1
              initial={{ letterSpacing: '-0.02em' }}
              animate={{ letterSpacing: '-0.01em' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                fontSize: 'clamp(26px, 5vw, 40px)',
                fontWeight: 800,
                fontFamily: 'Inter, sans-serif',
                color: '#2A2320',
                margin: '0 0 6px 0',
                padding: 0,
                textAlign: 'center',
                width: '100%',
                lineHeight: 1.1,
              }}
            >
              Creato<span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 600, color: 'var(--acc, #E65F2B)', marginLeft: 1 }}>Kite</span>
            </motion.h1>

            {/* Tagline — EB Garamond italic */}
            <p style={{
              fontFamily: '"EB Garamond", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 'clamp(13px, 2.5vw, 16px)',
              color: '#524542',
              opacity: 0.75,
              margin: '0 0 20px 0',
              padding: 0,
              textAlign: 'center',
              width: '100%',
              letterSpacing: '0.01em',
            }}>
              India's Intelligent Campaign OS
            </p>

            {/* Premium progress loader */}
            <div style={{ width: 'min(200px, 55vw)', margin: '0 auto 14px', display: 'flex', justifyContent: 'center' }}>
              {/* Track */}
              <div style={{
                height: 3,
                width: '100%',
                background: 'rgba(82, 69, 66, 0.08)',
                borderRadius: 99,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    height: '100%',
                    borderRadius: 99,
                    background: 'linear-gradient(90deg, rgba(230,95,43,0.4), rgba(230,95,43,0.9), #E65F2B)',
                    boxShadow: '0 0 10px rgba(230,95,43,0.25)',
                  }}
                />
              </div>
            </div>

            {/* Loading phrase */}
            <motion.p
              key={loadingPhrase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.6, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                fontSize: 'clamp(9px, 2vw, 11px)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: '#524542',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.4,
                textAlign: 'center',
                width: '100%',
                margin: 0,
              }}
            >
              {loadingPhrase}
            </motion.p>
          </motion.div>

          {/* Skip button — glassmorphic warm */}
          <button
            onClick={handleComplete}
            style={{
              position: 'absolute',
              top: 'clamp(14px, 3.5vw, 26px)',
              right: 'clamp(14px, 3.5vw, 26px)',
              zIndex: 99999,
              padding: 'clamp(6px, 2vw, 8px) clamp(14px, 3.5vw, 18px)',
              fontSize: 'clamp(9px, 2vw, 11px)',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              color: '#4A3E3D',
              opacity: 0.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'rgba(74, 62, 61, 0.04)',
              border: '1px solid rgba(74, 62, 61, 0.1)',
              borderRadius: 99,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(230, 95, 43, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(230, 95, 43, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '0.5';
              e.currentTarget.style.background = 'rgba(74, 62, 61, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(74, 62, 61, 0.1)';
            }}
          >
            Skip
          </button>
        </motion.div>
      )}
    </div>
  );
}
