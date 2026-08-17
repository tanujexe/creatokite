import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../contexts/AuthContext';
import FAQ from "../components/FAQ";
import SEO from '../components/common/SEO';


const WORDS = ['Campaigns', 'Creators', 'ROI', 'Impact'];

const FLOW = [
  { n: '01', t: 'Brand Submits Brief', d: 'Describe your goals, budget and audience. No creator browsing, no DMs, no spreadsheets.' },
  { n: '02', t: 'AI Analyzes & Matches', d: 'Our AI scores 12,000+ creators on 12 parameters — niche, engagement quality, authenticity, growth.' },
  { n: '03', t: 'Admin Curates & Assigns', d: 'Our team reviews AI suggestions, finalizes the mix, and assigns creators to your campaign.' },
  { n: '04', t: 'Creators Execute', d: 'Selected creators receive the brief, accept, create content, and submit through the platform.' },
  { n: '05', t: 'Live Analytics', d: 'Real-time tracking with AI insights. We optimize mid-campaign for maximum ROI.' },
];

const TESTIMONIALS = [
  {
    quote: '"CreatoKite made finding the right brand collaboration feel effortless — the brief matched me before I even had to pitch."',
    name: 'Riya Malhotra',
    role: 'Photographer, Fashion',
    theme: 'lavender',
    metricVal1: '85%',
    metricLbl1: 'faster matching',
    metricVal2: '12+',
    metricLbl2: 'campaigns done',
    photoBg: '#D6C8FF'
  },
  {
    quote: '"We filled six creator spots in four days without a single cold outreach message. That\'s never happened before."',
    name: 'Aarav Sen',
    role: 'Marketing Lead, Hearth',
    theme: 'cream',
    metricVal1: '4 days',
    metricLbl1: 'time to fill',
    metricVal2: '3.2x',
    metricLbl2: 'average ROI',
    photoBg: '#EED9C4'
  },
  {
    quote: '"I finally have a portfolio brands actually look at, not a media kit sitting in a folder no one opens."',
    name: 'Devika Rao',
    role: 'Filmmaker, Travel',
    theme: 'orange',
    metricVal1: '95%',
    metricLbl1: 'open rate',
    metricVal2: '2.5 hrs',
    metricLbl2: 'saved daily',
    photoBg: '#FFC4AD'
  },
  {
    quote: '"We achieved 3x ROI in our first campaign. The creator matching is incredibly precise and fast."',
    name: 'Siddharth Roy',
    role: 'Growth, Mono Labs',
    theme: 'lavender',
    metricVal1: '3x',
    metricLbl1: 'ROI yield',
    metricVal2: '100%',
    metricLbl2: 'safety match',
    photoBg: '#C3B9FF'
  },
  {
    quote: '"No more back-and-forth emails. Everything from brief acceptance to delivery happens inside the dashboard."',
    name: 'Tanya Goel',
    role: 'Tech Creator',
    theme: 'cream',
    metricVal1: '0',
    metricLbl1: 'emails sent',
    metricVal2: '14 hrs',
    metricLbl2: 'saved per campaign',
    photoBg: '#F3E9D2'
  },
  {
    quote: '"The analytics are real-time and action-oriented. Truly a game-changer for digital marketing teams."',
    name: 'Vikram Mehta',
    role: 'Director, Hearth Studio',
    theme: 'orange',
    metricVal1: '100%',
    metricLbl1: 'real-time stats',
    metricVal2: '2.8Cr+',
    metricLbl2: 'reach generated',
    photoBg: '#FFA285'
  }
];
const KiteIcon = () => (
  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ display: 'inline-block', margin: '0 20px', verticalAlign: 'middle' }}>
    <path d="M6 1 L11 6 L6 11 L1 6 Z" stroke="var(--acid)" strokeWidth="1.5" fill="rgba(227,107,57,0.15)" />
    <line x1="6" y1="1" x2="6" y2="11" stroke="var(--acid)" strokeWidth="0.8" />
    <line x1="1" y1="6" x2="11" y2="6" stroke="var(--acid)" strokeWidth="0.8" />
    <path d="M6 11 Q8 12.5 6 14" stroke="var(--acid)" strokeWidth="1" fill="none" />
  </svg>
);

export default function Landing() {
  const nav = useNavigate();
  const { user } = useAuth();
  const dashboardPath = user ? getDashboardPath(user.activeRole || user.role || 'creator') : null;

  const [wordIdx, setWordIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resizing to toggle parallax off on mobile viewports
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Rotating hero word
  useEffect(() => {
    const t = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  // Sticky nav scrolling threshold
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll reveal IntersectionObserver trigger
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
        }
      });
    }, { threshold: 0.12 });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const [scrollYOffset, setScrollYOffset] = useState(0);

  // Parallax scroll effect for campaign section
  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById('campaigns');
      if (el) {
        const rect = el.getBoundingClientRect();
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        setScrollYOffset(clampedProgress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [splitScrollProgress, setSplitScrollProgress] = useState(0);

  // Parallax scroll effect for split panels
  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById('split-section');
      if (el) {
        const rect = el.getBoundingClientRect();
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        setSplitScrollProgress(clampedProgress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [testimonialScrollProgress, setTestimonialScrollProgress] = useState(0);

  // Parallax scroll effect for testimonials folding cards
  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById('testimonials');
      if (el) {
        const rect = el.getBoundingClientRect();
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        setTestimonialScrollProgress(clampedProgress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div id="landing-page-root">
      <SEO 
        title="Creatokite — #1 UGC Agency, Brand & Dealer Creator Community Platform"
        description="Creatokite is the ultimate AI-powered UGC agency platform connecting top brands, dealer networks, and creator communities for high-ROI video campaigns."
        keywords="UGC Agency, Brand Creator Marketing, Dealer Creator Network, Creator Community, UGC Video Platform, Influencer Campaign OS, Creatokite"
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "UGC Agency & Creator Campaign Platform",
          "provider": {
            "@type": "Organization",
            "name": "Creatokite",
            "url": "https://creatokite.com"
          },
          "serviceType": "UGC Agency & Creator Community OS",
          "areaServed": "Global",
          "description": "Connecting top brands, dealers, and creator communities with AI-driven matching and campaign management."
        }}
      />
      {/* Dynamically load the Google fonts inside the DOM wrapper */}

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700;800&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" />

      {/* ── NAVIGATION BAR ─────────────────────────────────── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="wrap navin">
          <a className="logo" href="#" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>
            Creato<span>Kite</span>
          </a>
          <div className="mobile-links-menu" style={{ display: mobileMenuOpen ? 'flex' : '' }}>
            <a href="#campaigns" onClick={(e) => { e.preventDefault(); scrollToSection('campaigns'); }}>Explore</a>
            <a href="#creator-split" onClick={(e) => { e.preventDefault(); scrollToSection('creator-split'); }}>For Creators</a>
            <a href="#brand-split" onClick={(e) => { e.preventDefault(); scrollToSection('brand-split'); }}>For Brands</a>
            <a href="#campaigns" onClick={(e) => { e.preventDefault(); scrollToSection('campaigns'); }}>Campaigns</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
            <hr style={{ width: '100%', border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '10px 0' }} />
            {user ? (
              <button className="cta" style={{ width: '100%' }} onClick={() => { setMobileMenuOpen(false); nav(dashboardPath); }}>Dashboard ↗</button>
            ) : (
              <>
                <a href="#login" style={{ textAlign: 'center', display: 'block', padding: '10px 0' }} onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); nav('/login'); }}>Login</a>
                <button className="cta" style={{ width: '100%', marginTop: '5px' }} onClick={() => { setMobileMenuOpen(false); setRoleModalOpen(true); }}>Join CreatoKite ↗</button>
              </>
            )}
          </div>
          <div className="navright">
            {user ? (
              <button className="cta" onClick={() => nav(dashboardPath)}>Dashboard ↗</button>
            ) : (
              <>
                <a className="login" href="#login" onClick={(e) => { e.preventDefault(); nav('/login'); }}>Login</a>
                <button className="cta" onClick={() => setRoleModalOpen(true)}>Join CreatoKite ↗</button>
              </>
            )}
            <button className="menu" onClick={toggleMobileMenu}>☰</button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ───────────────────────────────────── */}
      <header className="hero" id="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="reveal reveal-delay-1 eyebrow">A collaboration platform for creative people</div>
            <h1 className="reveal reveal-delay-2 hero-title-serif">
              Where<br />
              creators meet<br />
              <em>brands.</em>
            </h1>
            <p className="reveal reveal-delay-3 hero-copy" style={{ maxWidth: '440px' }}>
              No cold DMs, no vague briefs. CreatoKite matches your creative identity to campaigns that actually fit, and gives brands a direct line to people who make work worth sharing
            </p>
            <div className="reveal reveal-delay-4 actions">
              <button className="cta" onClick={() => nav('/register?role=brand')}>Launch a Campaign ↗</button>
              <button className="ghost" onClick={() => nav('/register?role=creator')}>Join as Creator</button>
            </div>
          </div>
          <div className="hero-art reveal">
            <div className="art-paper"></div>
            <div className="art-image" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#111216', position: 'absolute' }}>
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }}></span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', fontFamily: 'var(--fb)' }}>CAMPAIGN MATCH OS</span>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--acid)', background: 'rgba(227, 107, 57, 0.1)', padding: '2px 8px', borderRadius: '99px', fontWeight: 700, fontFamily: 'var(--fb)' }}>AI MATCH V3.0</span>
              </div>

              {/* Creator Match Card Mockup */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, justifyContent: 'center' }}>
                {/* Score badge absolute top right */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'linear-gradient(135deg, #FF8D50, #E36B39)', color: '#FFFFFF', padding: '6px 12px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 15px rgba(227,107,57,0.2)', flexShrink: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>98%</div>
                  <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontFamily: 'var(--fb)' }}>Match</div>
                </div>

                {/* Profile info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #E36B39, #FFE3D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111216', fontSize: '20px', fontWeight: 'bold' }}>👤</div>
                  <div>
                    <h4 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, margin: 0, fontFamily: 'var(--fb)' }}>Riya Malhotra</h4>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', margin: 0, fontFamily: 'var(--fb)' }}>Fashion & Travel UGC Creator</p>
                  </div>
                </div>

                {/* Match criteria tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: '10px', padding: '4px 8px', borderRadius: '8px', fontWeight: 600, fontFamily: 'var(--fb)' }}>High Engagement (8.5%)</span>
                  <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: '10px', padding: '4px 8px', borderRadius: '8px', fontWeight: 600, fontFamily: 'var(--fb)' }}>Gen-Z Reach</span>
                </div>

                {/* Progress bar info */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontFamily: 'var(--fb)' }}>
                    <span>Audience Fit Score</span>
                    <span>96%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '96%', height: '100%', background: 'var(--acid)' }}></div>
                  </div>
                </div>
              </div>

              {/* Subtitle / Activity Feed row */}
              <div style={{ background: 'rgba(227, 107, 57, 0.05)', border: '1px dashed rgba(227,107,57,0.2)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--fb)' }}>Mono Labs Campaign</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', fontFamily: 'var(--fb)' }}>Brief accepted. Creator matched.</div>
                </div>
                <span style={{ fontSize: '14px' }}>⚡</span>
              </div>
            </div>
            <div className="orbit">make it<br />worth seeing</div>
            <div className="sticker">Creativity<br />first</div>
          </div>
        </div>
      </header>

      {/* ── MARQUEE DIVIDER 1 ───────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track">
          <span>CREATE <KiteIcon /> COLLABORATE <KiteIcon /> INSPIRE <KiteIcon /> BUILD <KiteIcon /> CREATE <KiteIcon /> COLLABORATE <KiteIcon /> INSPIRE <KiteIcon /> BUILD <KiteIcon /> CREATE <KiteIcon /> COLLABORATE <KiteIcon /> INSPIRE <KiteIcon /> BUILD <KiteIcon /></span>
          <span>CREATE <KiteIcon /> COLLABORATE <KiteIcon /> INSPIRE <KiteIcon /> BUILD <KiteIcon /> CREATE <KiteIcon /> COLLABORATE <KiteIcon /> INSPIRE <KiteIcon /> BUILD <KiteIcon /> CREATE <KiteIcon /> COLLABORATE <KiteIcon /> INSPIRE <KiteIcon /> BUILD <KiteIcon /></span>
        </div>
      </div>

      {/* ── STATEMENT SECTION ───────────────────────────────── */}
      <section className="statement" id="about">
        <div className="wrap reveal">
          <div className="small">The idea</div>
          <h2>Creativity deserves <em>better</em> collaborations.</h2>
        </div>
      </section>

      {/* ── PROCESS SECTION ─────────────────────────────────── */}
      <section className="process" id="how-it-works">
        <div className="wrap">
          <div className="section-top reveal">
            <h2>How it<br />works.</h2>
            <p>No complicated layers. Find the right people, make something good, and let the work speak for itself.</p>
          </div>
          <div className="steps">
            {FLOW.map((step) => (
              <div key={step.n} className="step reveal">
                <div className="num">{step.n}</div>
                <h3>{step.t}</h3>
                <p>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTRAST SPLIT PANELS ────────────────────────────── */}
      <div className="split">
        <div className="panel creator" id="creator-split">
          <div className="label">For creators</div>
          <div>
            <h2>Your creativity<br />is your <em>currency.</em></h2>
            <p>Discover relevant campaigns, showcase your creative identity and build relationships with brands that get what you do.</p>
          </div>
          <a className="under" href="#" onClick={(e) => { e.preventDefault(); nav('/register?role=creator'); }}>Join as a Creator ↗</a>
        </div>
        <div className="panel brand" id="brand-split">
          <div className="label">For brands</div>
          <div>
            <h2>Find the people who make your <em>brand matter.</em></h2>
            <p>Discover creative talent, launch campaigns and build authentic work with creators your audience already trusts.</p>
          </div>
          <a className="under" href="#" onClick={(e) => { e.preventDefault(); nav('/register?role=brand'); }}>Create a Campaign ↗</a>
        </div>
      </div>

      {/* ── CAMPAIGNS SECTION ───────────────────────────────── */}
      <section className="campaigns" id="campaigns">
        <div className="wrap">
          <div className="section-top reveal">
            <h2>Campaigns<br />worth making.</h2>
            <p>A few examples of the kind of creative briefs waiting to be discovered.</p>
          </div>
          <div className="campaign-layout">
            <article className="campaign big one reveal" style={{ transform: `translateX(${(1 - scrollYOffset) * -50}px)`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <span className="tag">Fashion · Open</span>
              <div className="card-mockup">
                <div className="mock-row">
                  <div className="mock-avatar"></div>
                  <div className="mock-info">
                    <span className="mock-name">Ananya Sharma</span>
                    <span className="mock-niche">Fashion & Styling</span>
                  </div>
                  <span className="mock-score">98% Match</span>
                </div>
                <div className="mock-row">
                  <div className="mock-avatar" style={{ background: '#E36B39' }}></div>
                  <div className="mock-info">
                    <span className="mock-name">Kabir Mehta</span>
                    <span className="mock-niche">Creative Direction</span>
                  </div>
                  <span className="mock-score">96% Match</span>
                </div>
                <div className="mock-row">
                  <div className="mock-avatar"></div>
                  <div className="mock-info">
                    <span className="mock-name">Riya Sen</span>
                    <span className="mock-niche">Editorial Photography</span>
                  </div>
                  <span className="mock-score">94% Match</span>
                </div>
              </div>
              <div>
                <h3>Rework the everyday.</h3>
                <div className="campaign-meta">
                  <span>North Studio</span>
                  <span>12 creators</span>
                </div>
              </div>
            </article>
            <div style={{ display: 'grid', gap: '20px', transform: `translateX(${(1 - scrollYOffset) * 50}px)`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <article className="campaign two reveal">
                <span className="tag">Lifestyle · New</span>
                <div className="card-mockup-mini">
                  <div className="mock-stat-bar">
                    <div className="bar-fill" style={{ width: '85%' }}></div>
                  </div>
                  <div className="mock-stat-labels">
                    <span>Engagement</span>
                    <span>8.2%</span>
                  </div>
                </div>
                <div>
                  <h3>Slow mornings.</h3>
                  <div className="campaign-meta">
                    <span>Good Ground</span>
                    <span>8 creators</span>
                  </div>
                </div>
              </article>
              <article className="campaign three reveal">
                <span className="tag">Technology · Open</span>
                <div className="card-mockup-mini">
                  <div className="mock-tag-list">
                    <span className="mini-badge">AI Match</span>
                    <span className="mini-badge">Tech</span>
                    <span className="mini-badge">Reviews</span>
                  </div>
                </div>
                <div>
                  <h3>Future, in your hands.</h3>
                  <div className="campaign-meta">
                    <span>Mono Labs</span>
                    <span>15 creators</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE DIVIDER 2 ───────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track">
          <span>FASHION <KiteIcon /> BEAUTY <KiteIcon /> TECHNOLOGY <KiteIcon /> LIFESTYLE <KiteIcon /> GAMING <KiteIcon /> FOOD <KiteIcon /> TRAVEL <KiteIcon /> ART <KiteIcon /> FASHION <KiteIcon /> BEAUTY <KiteIcon /> TECHNOLOGY <KiteIcon /> LIFESTYLE <KiteIcon /> GAMING <KiteIcon /> FOOD <KiteIcon /> TRAVEL <KiteIcon /> ART <KiteIcon /></span>
          <span>FASHION <KiteIcon /> BEAUTY <KiteIcon /> TECHNOLOGY <KiteIcon /> LIFESTYLE <KiteIcon /> GAMING <KiteIcon /> FOOD <KiteIcon /> TRAVEL <KiteIcon /> ART <KiteIcon /> FASHION <KiteIcon /> BEAUTY <KiteIcon /> TECHNOLOGY <KiteIcon /> LIFESTYLE <KiteIcon /> GAMING <KiteIcon /> FOOD <KiteIcon /> TRAVEL <KiteIcon /> ART <KiteIcon /></span>
        </div>
      </div>

      {/* ── STATS BLOCK ─────────────────────────────────────── */}
      <div className="wrap" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="stats reveal">
          <div className="stat">
            <strong>12,000+</strong>
            <span>Creators</span>
          </div>
          <div className="stat">
            <strong>847</strong>
            <span>Campaigns</span>
          </div>
          <div className="stat">
            <strong>₹2Cr+</strong>
            <span>Paid Out</span>
          </div>
          <div className="stat">
            <strong>320%</strong>
            <span>Avg ROI</span>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS SECTION ────────────────────────────── */}
      <section className="testimonials-section" id="testimonials">
        <div className="wrap">
          <div className="eyebrow-container reveal">
            <span className="eyebrow-line"></span>
            <span className="eyebrow-text">WHAT PEOPLE SAY</span>
          </div>
        </div>
        <div className="testimonial-marquee-container">
          {/* Row 1: Sliding Left */}
          <div className="testimonial-marquee-row left">
            <div className="testimonial-marquee-track">
              {TESTIMONIALS.map((t, idx) => (
                <div key={`left-1-${idx}`} className={`testimonial-card-v2 ${t.theme}`} style={{ transform: isMobile ? 'none' : `perspective(1000px) rotateY(${(1 - testimonialScrollProgress) * 15}deg) scale(${0.97 + (testimonialScrollProgress * 0.03)})`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div className="testimonial-left-panel">
                    <div>
                      <div className="author-name-v2">{t.name}</div>
                      <blockquote className="testimonial-quote-v2">{t.quote}</blockquote>
                    </div>
                    <div className="testimonial-metrics-grid">
                      <div className="metric-col">
                        <strong>{t.metricVal1}</strong>
                        <span>{t.metricLbl1}</span>
                      </div>
                      <div className="metric-col">
                        <strong>{t.metricVal2}</strong>
                        <span>{t.metricLbl2}</span>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-right-panel">
                    <div className="creator-photo-placeholder" style={{ backgroundColor: t.photoBg }}>
                      <span className="photo-label">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
              {TESTIMONIALS.map((t, idx) => (
                <div key={`left-2-${idx}`} className={`testimonial-card-v2 ${t.theme}`} style={{ transform: isMobile ? 'none' : `perspective(1000px) rotateY(${(1 - testimonialScrollProgress) * 15}deg) scale(${0.97 + (testimonialScrollProgress * 0.03)})`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div className="testimonial-left-panel">
                    <div>
                      <div className="author-name-v2">{t.name}</div>
                      <blockquote className="testimonial-quote-v2">{t.quote}</blockquote>
                    </div>
                    <div className="testimonial-metrics-grid">
                      <div className="metric-col">
                        <strong>{t.metricVal1}</strong>
                        <span>{t.metricLbl1}</span>
                      </div>
                      <div className="metric-col">
                        <strong>{t.metricVal2}</strong>
                        <span>{t.metricLbl2}</span>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-right-panel">
                    <div className="creator-photo-placeholder" style={{ backgroundColor: t.photoBg }}>
                      <span className="photo-label">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Sliding Right */}
          <div className="testimonial-marquee-row right">
            <div className="testimonial-marquee-track">
              {[...TESTIMONIALS].reverse().map((t, idx) => (
                <div key={`right-1-${idx}`} className={`testimonial-card-v2 ${t.theme}`} style={{ transform: isMobile ? 'none' : `perspective(1000px) rotateY(${(1 - testimonialScrollProgress) * -15}deg) scale(${0.97 + (testimonialScrollProgress * 0.03)})`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div className="testimonial-left-panel">
                    <div>
                      <div className="author-name-v2">{t.name}</div>
                      <blockquote className="testimonial-quote-v2">{t.quote}</blockquote>
                    </div>
                    <div className="testimonial-metrics-grid">
                      <div className="metric-col">
                        <strong>{t.metricVal1}</strong>
                        <span>{t.metricLbl1}</span>
                      </div>
                      <div className="metric-col">
                        <strong>{t.metricVal2}</strong>
                        <span>{t.metricLbl2}</span>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-right-panel">
                    <div className="creator-photo-placeholder" style={{ backgroundColor: t.photoBg }}>
                      <span className="photo-label">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
              {[...TESTIMONIALS].reverse().map((t, idx) => (
                <div key={`right-2-${idx}`} className={`testimonial-card-v2 ${t.theme}`} style={{ transform: isMobile ? 'none' : `perspective(1000px) rotateY(${(1 - testimonialScrollProgress) * -15}deg) scale(${0.97 + (testimonialScrollProgress * 0.03)})`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div className="testimonial-left-panel">
                    <div>
                      <div className="author-name-v2">{t.name}</div>
                      <blockquote className="testimonial-quote-v2">{t.quote}</blockquote>
                    </div>
                    <div className="testimonial-metrics-grid">
                      <div className="metric-col">
                        <strong>{t.metricVal1}</strong>
                        <span>{t.metricLbl1}</span>
                      </div>
                      <div className="metric-col">
                        <strong>{t.metricVal2}</strong>
                        <span>{t.metricLbl2}</span>
                      </div>
                    </div>
                  </div>
                  <div className="testimonial-right-panel">
                    <div className="creator-photo-placeholder" style={{ backgroundColor: t.photoBg }}>
                      <span className="photo-label">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ─────────────────────────────────────── */}
      <FAQ />

      {/* ── FINAL CTA SECTION ────────────────────────────────── */}
      <section className="final" id="join">
        <div className="wrap reveal">
          <div className="eyebrow" style={{ color: 'var(--muted)' }}>Your next move</div>
          <h2>Make something
            <br /><em>worth talking about.</em></h2>
          <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: '1.6', maxWidth: '520px', margin: '20px 0 45px' }}>
            Join a trusted ecosystem handling verified Indian creators and high-growth brand campaigns in one automated platform.
          </p>
          <div className="actions">
            <button className="cta" onClick={() => nav('/register?role=creator')}>Join as Creator</button>
            <button className="ghost" style={{ color: 'var(--ink)', borderColor: 'var(--line)' }} onClick={() => nav('/register?role=brand')}>Connect as Brand</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER SECTION ───────────────────────────────────── */}
      <footer id="login">
        <div className="wrap">
          <div className="footgrid">
            <div>
              <div className="footlogo">Creato<span>Kite</span></div>
              <p style={{ color: 'var(--muted)', maxWidth: '250px', lineHeight: 1.5, fontSize: '13px', margin: '15px 0 0' }}>
                India's first intelligent creator campaign engine. Built for performance marketing and authentic creator matching.
              </p>
            </div>
            <div>
              <h4>Platform</h4>
              <a href="#campaigns" onClick={(e) => { e.preventDefault(); scrollToSection('campaigns'); }}>Features</a>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How it Works</a>
              <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>FAQ</a>
            </div>
            <div>
              <h4>Resources</h4>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>Creator Academy</a>
              <a href="mailto:creaotokite123@gmail.com">Help Desk</a>
              <a href="mailto:creaotokite123@gmail.com">Contact Support</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Security Info</a>
            </div>
          </div>
          <div className="bottom">
            <span>© 2026 CreatoKite — AI-Powered Creator Platform. Made in India.</span>
            <span>Designed for high-growth performance brands.</span>
          </div>
        </div>
      </footer>

      {/* ── ROLE SELECTION MODAL ────────────────────────────── */}
      {roleModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 17, 23, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 'clamp(10px, 4vw, 20px)',
        }} onClick={() => setRoleModalOpen(false)}>
          <div style={{
            background: 'var(--paper2)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 'clamp(20px, 5vw, 35px)',
            position: 'relative',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button style={{
              position: 'absolute',
              top: 'clamp(12px, 3vw, 20px)',
              right: 'clamp(12px, 3vw, 20px)',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--muted)',
              cursor: 'pointer',
              lineHeight: 1,
            }} onClick={() => setRoleModalOpen(false)}>×</button>

            <h3 style={{
              fontSize: 'clamp(26px, 6vw, 36px)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '0 0 6px 0',
              textAlign: 'center',
              letterSpacing: '-0.5px',
            }}>
              Join <span style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 500, color: 'var(--acid)' }}>CreatoKite</span>
            </h3>
            <p style={{
              fontSize: '15px',
              fontFamily: '"EB Garamond", Georgia, serif',
              fontStyle: 'italic',
              color: 'var(--muted)',
              textAlign: 'center',
              margin: '0 0 30px 0',
            }}>
              Select your path to get started with the platform
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(12px, 3.5vw, 20px)',
            }} className="grid-2-mobile">
              {/* Creator Card */}
              <div
                className="role-card"
                onClick={() => {
                  setRoleModalOpen(false);
                  nav('/register?role=creator');
                }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: 'clamp(20px, 4vw, 32px)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 'clamp(180px, 35vh, 220px)',
                }}
              >
                <h4 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px', margin: '0 0 10px 0', color: 'var(--ink)' }}>I'm a Creator</h4>
                <p style={{ fontSize: '12.5px', fontFamily: 'Inter, sans-serif', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  Apply to campaigns, build your portfolio, and work with premium brands.
                </p>
              </div>

              {/* Brand Card */}
              <div
                className="role-card"
                onClick={() => {
                  setRoleModalOpen(false);
                  nav('/register?role=brand');
                }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: 'clamp(20px, 4vw, 32px)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 'clamp(180px, 35vh, 220px)',
                }}
              >
                <h4 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px', margin: '0 0 10px 0', color: 'var(--ink)' }}>I'm a Brand</h4>
                <p style={{ fontSize: '12.5px', fontFamily: 'Inter, sans-serif', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  Launch campaign briefs, match with verified creators, and track live ROI.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS overrides */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');

        :root {
          --paper: #F9F5EE;
          --paper2: #EFEAE0;
          --ink: #121214;
          --muted: #6B6A66;
          --line: rgba(18, 18, 20, 0.08);
          --acid: #E36B39;
          --red: #E36B39;
          --blue: #1D1E22;
          --p: #E36B39;
          --fb: "Figtree", sans-serif;
        }

        #landing-page-root {
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        #landing-page-root .role-card {
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;
        }
        #landing-page-root .role-card:hover {
          transform: translateY(-5px) !important;
          border-color: var(--acid) !important;
          background: rgba(227, 107, 57, 0.04) !important;
          box-shadow: 0 15px 30px rgba(0,0,0,0.3) !important;
        }

        .mobile-links-menu {
          display: none;
        }

        /* Responsive links dropdown dark themed colors */
        @media(max-width: 1100px) {
          .mobile-links-menu {
            position: absolute !important;
            top: calc(100% + 10px) !important;
            left: 16px !important;
            right: 16px !important;
            padding: 24px !important;
            flex-direction: column !important;
            border-radius: 24px !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.25) !important;
            gap: 18px !important;
            z-index: 1001 !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            background: rgba(18, 18, 20, 0.96) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .nav.scrolled .mobile-links-menu {
            left: 0 !important;
            right: 0 !important;
          }
          .mobile-links-menu a {
            color: rgba(255, 255, 255, 0.9) !important;
            font-size: 15px !important;
            font-weight: 600 !important;
          }
        }

        #landing-page-root,
        #landing-page-root h1,
        #landing-page-root h2,
        #landing-page-root h3,
        #landing-page-root h4,
        #landing-page-root h5,
        #landing-page-root h6,
        #landing-page-root p,
        #landing-page-root a,
        #landing-page-root button,
        #landing-page-root div,
        #landing-page-root span,
        #landing-page-root article,
        #landing-page-root nav {
          font-family: "Figtree", sans-serif !important;
        }

        #landing-page-root em,
        #landing-page-root .logo span,
        #landing-page-root .orbit,
        #landing-page-root .marquee i,
        #landing-page-root .quote {
          font-family: "EB Garamond", Georgia, serif !important;
        }

        #landing-page-root a {
          text-decoration: none;
          color: inherit;
        }

        #landing-page-root button {
          font: inherit;
        }

        .wrap {
          max-width: 1240px;
          margin: auto;
          padding: 0 28px;
        }

        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 22px 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          color: #FFFFFF;
        }

        .nav.scrolled {
          top: 15px !important;
          left: 50% !important;
          right: auto !important;
          transform: translateX(-50%) !important;
          width: calc(100% - 48px) !important;
          max-width: 1200px !important;
          background: rgba(18, 18, 20, 0.8) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 9999px !important;
          color: #FFFFFF !important;
          padding: 10px 0 !important;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15) !important;
        }

        .nav.scrolled .navin {
          padding: 0 32px !important;
        }

        .nav.scrolled .logo {
          color: #FFFFFF !important;
        }

        .nav.scrolled .links a {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .nav.scrolled .links a:after {
          background: #FFFFFF;
        }

        .nav.scrolled .navright .login {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        .nav.scrolled .cta {
          background: var(--acid) !important;
          color: #FFFFFF !important;
          border-color: var(--acid) !important;
        }

        .nav.scrolled .cta:hover {
          background: transparent !important;
          color: var(--ink) !important;
        }

        .navin {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-weight: 700 !important;
          letter-spacing: -.05em !important;
          font-size: 26px !important;
          color: #FFFFFF;
          transition: color 0.3s ease;
        }

        .logo span {
          font-style: italic !important;
          font-weight: 500 !important;
          color: var(--acid) !important;
        }

        .links {
          display: flex;
          gap: 32px;
          font-size: 14px;
          font-weight: 500;
        }

        .links a {
          position: relative;
          color: rgba(255, 255, 255, 0.8);
          transition: color 0.3s ease;
        }

        .links a:hover {
          color: #FFFFFF !important;
        }

        .links a:after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -5px;
          width: 0;
          height: 2px;
          background: #FFFFFF;
          transition: .25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .links a:hover:after {
          width: 100%;
        }

        .navright {
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .navright .login {
          color: rgba(255, 255, 255, 0.8);
          transition: color 0.3s ease;
        }

        .navright .login:hover {
          color: #FFFFFF;
        }

        .cta {
          background: var(--acid) !important;
          color: #FFFFFF !important;
          border: 1px solid var(--acid) !important;
          padding: 10px 22px !important;
          border-radius: 9999px !important;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          font-weight: 600 !important;
          letter-spacing: -0.01em;
        }

        .cta:hover {
          background: transparent !important;
          color: var(--acid) !important;
          transform: translateY(-1px);
        }

        .menu {
          display: none;
          background: none;
          border: 0;
          font-size: 25px;
          color: inherit;
          cursor: pointer;
        }

        .hero {
          min-height: auto;
          padding-top: 180px;
          padding-bottom: 100px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at 80% 30%, rgba(227, 107, 57, 0.12) 0%, rgba(29, 30, 34, 0.2) 50%, transparent 100%), #0C0C0E !important;
          color: #FFFFFF !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
        }

        .eyebrow {
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: .15em !important;
          color: rgba(255, 255, 255, 0.5) !important;
          margin-bottom: 24px !important;
          font-weight: 600;
        }

        #landing-page-root .hero h1.hero-title-serif {
          font-family: "Figtree", sans-serif !important;
          font-size: clamp(55px, 6.5vw, 95px) !important;
          line-height: 0.95 !important;
          letter-spacing: -0.05em !important;
          margin: 0 0 24px 0 !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
        }

        #landing-page-root .hero h1.hero-title-serif em {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          letter-spacing: -0.03em !important;
          color: var(--acid) !important;
        }

        .hero-copy {
          max-width: 460px !important;
          margin: 0 0 35px 0 !important;
          font-size: 17px !important;
          line-height: 1.6 !important;
          color: rgba(255, 255, 255, 0.7) !important;
          font-weight: 400;
        }

        .actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .hero .cta {
          background: var(--acid) !important;
          border-color: var(--acid) !important;
          color: #FFFFFF !important;
        }

        .hero .cta:hover {
          background: transparent !important;
          border-color: #FFFFFF !important;
          color: #FFFFFF !important;
          box-shadow: 0 8px 25px rgba(227, 107, 57, 0.2) !important;
        }

        .ghost {
          border: 1px solid var(--line) !important;
          padding: 10px 22px !important;
          background: transparent !important;
          border-radius: 9999px !important;
          cursor: pointer;
          color: var(--ink) !important;
          font-weight: 600 !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .ghost:hover {
          background: var(--ink) !important;
          color: var(--paper) !important;
          border-color: var(--ink) !important;
          transform: translateY(-1px);
        }

        .hero .ghost {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: #FFFFFF !important;
        }

        .hero .ghost:hover {
          background: #FFFFFF !important;
          color: #0C0C0E !important;
          border-color: #FFFFFF !important;
          transform: translateY(-1px);
        }

        .hero-art {
          height: 540px;
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes pulseFlow {
          0% { stroke-dashoffset: 210; }
          100% { stroke-dashoffset: 0; }
        }

        .pulse-path {
          animation: pulseFlow 4s linear infinite;
        }

        @keyframes floatArt {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        @keyframes floatPaper {
          0% { transform: translate(-10px, -15px) rotate(2deg); }
          50% { transform: translate(-12px, -20px) rotate(2.5deg); }
          100% { transform: translate(-10px, -15px) rotate(2deg); }
        }

        .art-paper {
          position: absolute;
          width: 85%;
          height: 380px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
          transform: translate(-10px, -15px);
          z-index: 1;
          animation: floatPaper 8s ease-in-out infinite;
        }

        .art-image {
          position: absolute;
          width: 80%;
          height: 360px;
          background: #141417;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
          z-index: 2;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          padding: 24px;
          animation: floatArt 8s ease-in-out infinite;
        }

        /* Ambient matched glow for Wispr Flow theme */
        .art-image:before {
          content: "";
          position: absolute;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(227, 107, 57, 0.18) 0%, transparent 70%);
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .art-image:after {
          content: "";
        }

        .node {
          position: absolute;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 16px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 13px;
          z-index: 10;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
        }

        .node-left {
          left: 24px;
          top: 130px;
        }

        .node-right {
          right: 24px;
          top: 130px;
        }

        .node:after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--acid);
          right: -3px;
          top: 50%;
          transform: translateY(-50%);
          box-shadow: 0 0 8px var(--acid);
        }

        .node-right:after {
          left: -3px;
          right: auto;
        }

        .orbit {
          position: absolute;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          padding: 12px 24px;
          right: -10px;
          bottom: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(20, 20, 22, 0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #FFFFFF !important;
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic;
          font-size: 18px;
          z-index: 3;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease;
        }

        .orbit:hover {
          transform: scale(1.05) rotate(-3deg);
        }

        .sticker {
          position: absolute;
          left: -15px;
          top: 50px;
          background: var(--acid);
          padding: 10px 20px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .1em;
          z-index: 3;
          box-shadow: 0 10px 30px rgba(227, 107, 57, 0.3);
          transition: transform 0.3s ease;
        }

        .sticker:hover {
          transform: scale(1.05) rotate(3deg);
        }

        .marquee {
          overflow: hidden;
          border-bottom: 1px solid var(--line);
          background: var(--ink);
          color: var(--paper);
          white-space: nowrap;
        }

        .marquee-track {
          display: inline-block;
          padding: 18px 0;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .15em;
          animation: slide 30s linear infinite;
        }

        .marquee i {
          font-size: 16px;
          margin: 0 24px;
          color: var(--acid);
        }

        @keyframes slide {
          to { transform: translateX(-50%) }
        }

        .statement {
          padding: 140px 0;
        }

        .statement .small {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: .15em;
          color: var(--acid);
          font-weight: 700;
        }

        #landing-page-root .statement h2 {
          font-size: clamp(48px, 6.5vw, 92px) !important;
          line-height: 1.05 !important;
          letter-spacing: -.05em !important;
          max-width: 1100px !important;
          margin: 24px 0 0 !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 600 !important;
        }

        #landing-page-root .statement h2 em {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          color: var(--acid);
        }

        .process {
          padding: 120px 0;
          border-top: 1px solid var(--line);
        }

        .section-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 65px;
          gap: 20px;
        }

        #landing-page-root .section-top h2 {
          font-size: clamp(40px, 5.5vw, 64px) !important;
          line-height: 1.05 !important;
          letter-spacing: -.04em !important;
          margin: 0 !important;
          font-weight: 700 !important;
          font-family: "Figtree", sans-serif !important;
        }

        .section-top p {
          max-width: 330px;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.6;
        }

        .steps {
          border-top: 1px solid var(--line);
        }

        .step {
          display: grid;
          grid-template-columns: 80px 1fr 1.2fr;
          gap: 40px;
          padding: 35px 0;
          border-bottom: 1px solid var(--line);
          align-items: flex-start;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .step:hover {
          padding-left: 16px !important;
          background: rgba(227, 107, 57, 0.02) !important;
        }

        .num {
          font-family: "EB Garamond", Georgia, serif !important;
          font-size: 26px;
          font-style: italic;
          color: var(--acid);
          font-weight: 500;
          line-height: 1;
        }

        #landing-page-root .step h3 {
          font-size: 28px !important;
          margin: 0 !important;
          letter-spacing: -.03em !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
        }

        .step p {
          margin: 0;
          color: var(--muted);
          font-size: 15px;
          max-width: 440px;
          line-height: 1.6 !important;
        }

        .split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 120px;
          border-top-left-radius: 32px;
          border-top-right-radius: 32px;
          border-bottom-left-radius: 32px;
          border-bottom-right-radius: 32px;
          overflow: hidden;
        }

        .panel {
          min-height: 600px;
          padding: 100px 8vw;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .creator {
          background: var(--paper);
          color: var(--ink);
        }

        .brand {
          background: var(--ink);
          color: var(--paper);
          border-left: 1px solid var(--line);
        }

        .panel .label {
          font-size: 12px;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--acid);
          font-weight: 700;
        }

        #landing-page-root .panel h2 {
          font-size: clamp(48px, 5.5vw, 80px) !important;
          line-height: 1.05 !important;
          letter-spacing: -.05em !important;
          margin: 30px 0 !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 700 !important;
        }

        #landing-page-root .panel h2 em {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
        }

        .panel p {
          max-width: 400px;
          line-height: 1.6;
          color: var(--muted);
          font-size: 16px;
        }

        .brand p {
          color: rgba(250, 249, 246, 0.7);
        }

        .under {
          align-self: flex-start;
          border-bottom: 2px solid var(--acid);
          padding-bottom: 6px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: inherit;
          transition: all 0.3s ease;
        }

        .under:hover {
          color: var(--acid) !important;
          padding-left: 5px;
        }

        /* ── Campaigns Section Styling ── */
        #landing-page-root .campaigns {
          padding: 140px 0 !important;
        }

        #landing-page-root .campaign-layout {
          display: grid !important;
          grid-template-columns: 1.4fr .8fr !important;
          gap: 24px !important;
        }

        #landing-page-root .campaign {
          position: relative !important;
          overflow: hidden !important;
          padding: 40px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          border: 1px solid var(--line) !important;
          border-radius: 16px !important;
          background: var(--paper2) !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.02) !important;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        #landing-page-root .campaign:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05) !important;
        }

        #landing-page-root .campaign.big {
          min-height: 580px !important;
        }

        /* Mockup Element Styling */
        .card-mockup {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin: 30px 0;
        }

        .mock-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 12px;
        }

        .mock-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .mock-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--ink);
          flex-shrink: 0;
        }

        .mock-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .mock-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
        }

        .mock-niche {
          font-size: 12px;
          color: var(--muted);
          margin-top: 1px;
        }

        .mock-score {
          font-size: 11px;
          font-weight: 700;
          color: var(--acid);
          background: rgba(227, 107, 57, 0.08);
          padding: 4px 10px;
          border-radius: 99px;
          font-family: "Figtree", sans-serif !important;
        }

        .card-mockup-mini {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 18px;
          margin: 20px 0;
        }

        .mock-stat-bar {
          height: 8px;
          background: var(--line);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .bar-fill {
          height: 100%;
          background: var(--acid);
          border-radius: 4px;
        }

        .mock-stat-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink);
        }

        .mock-tag-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mini-badge {
          font-size: 11px;
          font-weight: 700;
          background: var(--line);
          color: var(--ink);
          padding: 6px 12px;
          border-radius: 8px;
        }

        #landing-page-root .campaign > * {
          position: relative !important;
          z-index: 1 !important;
        }

        /* ── CARD CONTENT COLOR & WEIGHT OVERRIDES ── */
        #landing-page-root .campaign h3 {
          color: var(--ink) !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 700 !important;
          font-size: 38px !important;
          line-height: 1.1 !important;
          letter-spacing: -.04em !important;
          max-width: 380px !important;
          margin: 0 !important;
          position: relative !important;
          z-index: 10 !important;
        }

        #landing-page-root .campaign .campaign-meta span {
          color: var(--muted) !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 700 !important;
        }

        #landing-page-root .campaign .tag {
          background: var(--paper) !important;
          color: var(--ink) !important;
          border: 1px solid var(--line) !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 700 !important;
          padding: 7px 11px !important;
          border-radius: 9999px !important;
          align-self: flex-start !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: .08em !important;
          position: relative !important;
          z-index: 10 !important;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .stat {
          background: var(--paper2);
          border: 1px solid var(--line) !important;
          border-radius: 16px;
          padding: 45px 30px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .stat:hover {
          transform: translateY(-6px) !important;
          background: #FFFFFF !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04) !important;
          border-color: var(--acid) !important;
        }

        #landing-page-root .stat strong {
          font-size: 56px !important;
          letter-spacing: -.03em !important;
          font-weight: 800 !important;
          background: linear-gradient(135deg, #FF8D50 0%, #E36B39 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          display: inline-block !important;
          font-family: "Space Grotesk", sans-serif !important;
          transition: all 0.3s ease;
        }

        .stat:hover strong {
          background: linear-gradient(135deg, #E36B39 0%, #FF8D50 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          transform: translateY(-2px);
        }

        .stat span {
          display: block;
          margin-top: 12px;
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        #landing-page-root .testimonials-section {
          background: var(--paper2) !important;
          color: var(--ink) !important;
          padding: 140px 0 !important;
          border-top-left-radius: 80px;
          border-top-right-radius: 80px;
          overflow: hidden;
          margin-top: 60px;
        }

        #landing-page-root .eyebrow-container {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin-bottom: 60px !important;
        }

        #landing-page-root .eyebrow-line {
          width: 40px !important;
          height: 2px !important;
          background: var(--acid) !important;
        }

        #landing-page-root .eyebrow-text {
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: .15em !important;
          color: var(--acid) !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 700 !important;
        }

        /* Testimonial Infinite Marquee Styles */
        .testimonial-marquee-container {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 28px;
          margin-top: 50px;
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
        }

        .testimonial-marquee-row {
          display: flex;
          width: 100%;
          overflow: hidden;
        }

        .testimonial-marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          will-change: transform;
        }

        .testimonial-marquee-row.left .testimonial-marquee-track {
          animation: marqueeLeft 35s linear infinite;
        }

        .testimonial-marquee-row.right .testimonial-marquee-track {
          animation: marqueeRight 35s linear infinite;
        }

        .testimonial-marquee-track:hover {
          animation-play-state: paused !important;
        }

        .testimonial-card-v2 {
          flex-shrink: 0;
          width: 650px;
          border-radius: 28px;
          padding: 35px;
          border: 1px solid var(--line);
          display: flex !important;
          flex-direction: row !important;
          gap: 28px;
          min-height: 290px;
          text-align: left;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }        @media(max-width: 768px) {
          .testimonial-card-v2 {
            width: calc(100vw - 32px) !important;
            max-width: 500px !important;
            flex-direction: column !important;
            min-height: auto !important;
            padding: 24px !important;
            gap: 20px !important;
            border-radius: 16px !important;
          }
          .testimonial-right-panel {
            height: 160px !important;
            width: 100% !important;
            border-radius: 12px !important;
          }
          .testimonial-marquee-container {
            width: 100% !important;
            left: auto !important;
            right: auto !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            overflow-x: hidden !important;
          }
        }
        .testimonial-card-v2:hover {
          transform: scale(1.01) translateY(-2px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.05);
          cursor: pointer;
        }

        /* Split Panels */
        .testimonial-left-panel {
          flex: 1.3;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }

        .testimonial-right-panel {
          flex: 0.7;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
        }

        .creator-photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          padding: 16px;
          position: relative;
          min-height: 180px;
        }

        .photo-label {
          font-family: "Figtree", sans-serif !important;
          font-size: 10px;
          font-weight: 700;
          color: var(--ink);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: rgba(255, 255, 255, 0.85);
          padding: 5px 12px;
          border-radius: 99px;
          backdrop-filter: blur(4px);
        }

        /* Metrics grid column styles */
        .testimonial-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          border-top: 1px dashed rgba(18, 18, 20, 0.08);
          padding-top: 18px;
          margin-top: 10px;
        }

        .metric-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-col strong {
          font-family: "Figtree", sans-serif !important;
          font-size: 26px;
          font-weight: 800;
          color: var(--ink);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .metric-col span {
          font-family: "Figtree", sans-serif !important;
          font-size: 11px;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Pastel Themes matching references */
        .testimonial-card-v2.lavender {
          background: #EAE6FF !important;
          border-color: rgba(90, 80, 200, 0.12) !important;
        }

        .testimonial-card-v2.cream {
          background: #FAF7F0 !important;
          border-color: var(--line) !important;
        }

        .testimonial-card-v2.orange {
          background: #FFEBE3 !important;
          border-color: rgba(227, 107, 57, 0.12) !important;
        }

        .testimonial-quote-v2 {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-size: 20px !important;
          line-height: 1.4 !important;
          color: var(--ink) !important;
          margin: 12px 0 20px 0 !important;
          font-weight: 400 !important;
        }

        .author-name-v2 {
          font-family: "Figtree", sans-serif !important;
          font-weight: 800;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink);
        }

        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .faq {
          padding: 90px 0 150px;
          border-top: 1px solid var(--line);
        }

        .faq-list {
          max-width: 900px;
          margin: 60px auto 0;
        }

        .faq-item {
          border-top: 1px solid var(--line);
        }

        .faq-item:last-child {
          border-bottom: 1px solid var(--line);
        }

        .faq-q {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
          cursor: pointer;
          font-size: 20px;
        }

        .plus {
          font-size: 25px;
          transition: .25s;
        }

        .faq-a {
          max-height: 0;
          overflow: hidden;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
          transition: max-height .4s ease;
        }

        .faq-a p {
          padding: 0 45px 24px 0;
          margin: 0;
        }

        .faq-item.open .faq-a {
          max-height: 150px;
        }

        .faq-item.open .plus {
          transform: rotate(45deg);
        }

        .final {
          background: #0C0C0E !important;
          color: #FFFFFF !important;
          padding: 140px 0;
          border-top-left-radius: 80px;
          border-top-right-radius: 80px;
          overflow: hidden;
        }

        #landing-page-root .final h2 {
          font-size: clamp(48px, 6.5vw, 92px) !important;
          line-height: 1.05 !important;
          letter-spacing: -.05em !important;
          max-width: 1000px !important;
          margin: 0 0 40px !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 700 !important;
        }

        #landing-page-root .final h2 em {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          color: var(--acid) !important;
        }

        .final .cta {
          background: var(--acid) !important;
          color: #FFFFFF !important;
          border-color: var(--acid) !important;
        }

        .final .cta:hover {
          background: transparent !important;
          color: #FFFFFF !important;
          border-color: #FFFFFF !important;
        }

        .final .ghost {
          border-color: rgba(255, 255, 255, 0.15) !important;
          color: #FFFFFF !important;
        }

        .final .ghost:hover {
          background: #FFFFFF !important;
          color: #0C0C0E !important;
          border-color: #FFFFFF !important;
        }

        footer {
          background: #0C0C0E !important;
          color: rgba(255, 255, 255, 0.8) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 100px 0 50px;
        }

        .footgrid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 45px;
          transition: all 0.3s ease;
        }

        .footlogo {
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -.05em;
          color: #FFFFFF;
        }

        .footlogo span {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic;
          font-weight: 400;
          color: var(--acid);
        }

        footer h4 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: .15em;
          color: var(--acid);
          margin: 0 0 24px;
          font-weight: 700;
        }

        footer a {
          display: block;
          font-size: 15px;
          margin: 14px 0;
          color: rgba(255, 255, 255, 0.6) !important;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        footer a:hover {
          color: #FFFFFF !important;
          transform: translateX(4px);
        }

        .bottom {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 80px;
          padding-top: 28px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .reveal.show {
          opacity: 1;
          transform: translateY(0) !important;
        }

        .reveal-delay-1 {
          transition-delay: 0.1s !important;
        }
        .reveal-delay-2 {
          transition-delay: 0.22s !important;
        }
        .reveal-delay-3 {
          transition-delay: 0.34s !important;
        }
        .reveal-delay-4 {
          transition-delay: 0.46s !important;
        }

        /* Staggered card reveal animation + slide & tilt shake effect */
        #landing-page-root .campaign.reveal {
          opacity: 0 !important;
          transform: translateY(45px) rotate(1.2deg) !important;
          transition: opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1), transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        #landing-page-root .campaign.reveal.show {
          opacity: 1 !important;
          transform: translateY(0) rotate(0deg) !important;
        }

        #landing-page-root .campaign.one.reveal {
          transition-delay: 0.05s !important;
        }
        #landing-page-root .campaign.two.reveal {
          transition-delay: 0.25s !important;
        }
        #landing-page-root .campaign.three.reveal {
          transition-delay: 0.45s !important;
        }

        /* FAQ Category filters horizontal scroll on mobile */
        .faq-categories-container {
          display: flex !important;
          gap: 6px !important;
          flex-wrap: wrap !important;
        }

        @media (max-width: 768px) {
          .faq-categories-container {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 8px !important;
            width: 100% !important;
            scrollbar-width: none !important;
          }
          .faq-categories-container::-webkit-scrollbar {
            display: none !important;
          }
          .faq-categories-container button {
            flex-shrink: 0 !important;
          }
        }

        /* ── RESPONSIVENESS OVERRIDES (MAX-WIDTH: 1100PX) ── */
        @media(max-width:1100px){
          .links, .navright .login { display: none; }
          .menu { display: block; }

          .nav.scrolled {
            width: calc(100% - 32px) !important;
            top: 12px !important;
            border-radius: 9999px !important;
            padding: 8px 0 !important;
          }
          .nav.scrolled .navin {
            padding: 0 24px !important;
          }
          .hero { min-height: auto; padding-top: 120px; padding-bottom: 70px; }
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-art { height: 520px; max-width: 480px; margin: 0 auto; }
          .art-image { right: 35px; width: 82%; height: 420px; }
          .art-paper { right: 10px; width: 90%; height: 450px; }
          .orbit { right: -5px; }
          .sticker { left: 0; }
          
          .step { grid-template-columns: 60px 1fr; gap: 15px; }
          .step p { grid-column: 2; }
          #landing-page-root .step h3 { font-size: 26px !important; }
          
          #landing-page-root .split {
            grid-template-columns: 1fr !important;
            margin-top: 100px !important;
            border-top-left-radius: 16px !important;
            border-top-right-radius: 16px !important;
            border-bottom-left-radius: 16px !important;
            border-bottom-right-radius: 16px !important;
          }
          #landing-page-root .panel { min-height: 560px !important; padding: 60px 28px !important; }
          #landing-page-root .campaign-layout { grid-template-columns: 1fr !important; }
          #landing-page-root .campaign { min-height: 280px !important; }
          #landing-page-root .campaign.big { min-height: 280px !important; }
          #landing-page-root .campaign.two { min-height: 280px !important; }
          #landing-page-root .campaign.three { min-height: 280px !important; }
          #landing-page-root .stats { grid-template-columns: 1fr 1fr !important; }
          #landing-page-root .stat:nth-child(2) { border-right: 0 !important; }
          #landing-page-root .stat:nth-child(-n+2) { border-bottom: 1px solid var(--line) !important; }
          #landing-page-root .footgrid { grid-template-columns: 1fr 1fr !important; }
          #landing-page-root .testimonials-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }

        /* ── RESPONSIVENESS OVERRIDES (MAX-WIDTH: 600PX) ── */
        @media(max-width: 600px){
          .wrap { padding: 0 20px; }
          .navright .cta, .navright .login { display: none !important; }
          #landing-page-root .testimonials-section,
          #landing-page-root .final {
            border-top-left-radius: 24px !important;
            border-top-right-radius: 24px !important;
            padding: 80px 0 !important;
          }
          #landing-page-root .campaign {
            border-radius: 12px !important;
          }
          #landing-page-root .stat {
            border-radius: 12px !important;
          }
          #landing-page-root .hero h1.hero-title-serif {
            font-size: clamp(48px, 13vw, 76px) !important;
            line-height: 1.05 !important;
            letter-spacing: -0.06em !important;
          }
          #landing-page-root .actions {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 12px !important;
          }
          #landing-page-root .actions .cta,
          #landing-page-root .actions .ghost {
            width: 100% !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: nowrap !important;
            padding: 14px 24px !important;
            font-size: 15px !important;
          }
          .hero-art { height: 440px; }
          .art-image { width: 80%; height: 370px; right: 20px; }
          .art-paper { width: 88%; height: 395px; right: 0; }
          .art-image:before { width: 170px; height: 250px; left: 60px; top: 65px; }
          .orbit { width: 115px; height: 115px; font-size: 14px; bottom: 25px; }
          .sticker { width: 82px; height: 82px; font-size: 9px; bottom: 20px; }
          .statement { padding: 80px 0; }
          #landing-page-root .statement h2 { font-size: clamp(28px, 8.5vw, 42px) !important; line-height: 0.95 !important; }
          .section-top { display: block; }
          .section-top h2 { font-size: clamp(28px, 8vw, 40px) !important; margin-bottom: 20px; }
          .step { grid-template-columns: 45px 1fr; gap: 15px; }
          .step p { grid-column: 2; }
          #landing-page-root .step h3 { font-size: 22px !important; }
          #landing-page-root .panel { min-height: 380px !important; padding: 45px 24px !important; }
          #landing-page-root .panel h2 { font-size: clamp(32px, 8vw, 54px) !important; margin: 20px 0 !important; }
          #landing-page-root .campaigns { padding: 80px 0 !important; }
          #landing-page-root .campaign h3 { font-size: clamp(24px, 6vw, 32px) !important; }
          #landing-page-root .campaign .campaign-meta { flex-wrap: wrap !important; gap: 8px !important; }
          #landing-page-root .campaign.one:before { width: 240px !important; height: 320px !important; right: 20px !important; top: 50px !important; }
          #landing-page-root .campaign.two:before { width: 160px !important; height: 210px !important; right: 20px !important; top: 30px !important; }
          #landing-page-root .campaign.three:before { width: 200px !important; height: 130px !important; right: 10px !important; bottom: 20px !important; }
          #landing-page-root .stat strong { font-size: 40px !important; }
          #landing-page-root .stat { padding: 35px 15px !important; }
          #landing-page-root .testimonials-section { padding: 80px 0 !important; }
          #landing-page-root .testimonial-quote { font-size: clamp(16px, 4.5vw, 19px) !important; }
          .faq { padding: 70px 0 100px; }
          .final { padding: 80px 0; }
          #landing-page-root .final h2 { font-size: clamp(34px, 9.5vw, 56px) !important; line-height: 0.9 !important; margin-bottom: 30px !important; }
          #landing-page-root .footgrid {
            grid-template-columns: 1fr !important;
            text-align: center !important;
            gap: 40px !important;
          }
          #landing-page-root .footgrid p {
            margin: 15px auto 0 !important;
          }
          #landing-page-root .bottom {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
          }
          .bottom span { display: block; margin-top: 4px; }
        }

        /* ── RESPONSIVENESS OVERRIDES (MAX-WIDTH: 480PX) ── */
        @media(max-width: 480px){
          #landing-page-root .stats {
            grid-template-columns: 1fr !important;
          }
          #landing-page-root .stat {
            border-right: 0 !important;
            border-bottom: 1px solid var(--line) !important;
          }
          #landing-page-root .stat:last-child {
            border-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
