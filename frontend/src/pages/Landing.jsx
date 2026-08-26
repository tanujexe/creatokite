import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../contexts/AuthContext';
import FAQ from "../components/FAQ";
import SEO from '../components/common/SEO';
import { Sparkles, ArrowRight } from 'lucide-react';
import api from '../api';


const WORDS = ['Campaigns', 'Creators', 'ROI', 'Impact'];

const FLOW = [
  { n: '01', t: 'Brand Submits Brief', d: 'Describe your goals, budget and audience. No creator browsing, no DMs, no spreadsheets.' },
  { n: '02', t: 'AI Analyzes & Matches', d: 'Our AI scores 200+ creators on 12 parameters — niche, engagement quality, authenticity, growth.' },
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
  const [stats, setStats] = useState({
    displayCreators: '200+',
    displayBrands: '4+',
    displayCampaigns: '25+',
  });

  useEffect(() => {
    api.get('/auth/public-stats')
      .then(res => {
        if (res.data?.success) {
          setStats({
            displayCreators: res.data.displayCreators || '200+',
            displayBrands: res.data.displayBrands || '4+',
            displayCampaigns: res.data.displayCampaigns || '25+',
          });
        }
      })
      .catch(() => { });
  }, []);

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

          {/* Desktop Navigation Links */}
          <div className="links">
            <a href="#campaigns" onClick={(e) => { e.preventDefault(); scrollToSection('campaigns'); }}>Explore</a>
            <a href="#creator-split" onClick={(e) => { e.preventDefault(); scrollToSection('creator-split'); }}>For Creators</a>
            <a href="#brand-split" onClick={(e) => { e.preventDefault(); scrollToSection('brand-split'); }}>For Brands</a>
            <a href="#campaigns" onClick={(e) => { e.preventDefault(); scrollToSection('campaigns'); }}>Campaigns</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
          </div>

          {/* Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <div className="mobile-links-menu">
              <a href="#campaigns" onClick={(e) => { e.preventDefault(); scrollToSection('campaigns'); }}>Explore</a>
              <a href="#creator-split" onClick={(e) => { e.preventDefault(); scrollToSection('creator-split'); }}>For Creators</a>
              <a href="#brand-split" onClick={(e) => { e.preventDefault(); scrollToSection('brand-split'); }}>For Brands</a>
              <a href="#campaigns" onClick={(e) => { e.preventDefault(); scrollToSection('campaigns'); }}>Campaigns</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
              <hr style={{ width: '100%', border: '0', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '10px 0' }} />
              {user ? (
                <button className="cta" style={{ width: '100%' }} onClick={() => { setMobileMenuOpen(false); nav(dashboardPath); }}>Dashboard ↗</button>
              ) : (
                <>
                  <a href="#login" style={{ textAlign: 'center', display: 'block', padding: '10px 0' }} onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); nav('/login'); }}>Login</a>
                  <button className="cta" style={{ width: '100%', marginTop: '5px' }} onClick={() => { setMobileMenuOpen(false); setRoleModalOpen(true); }}>Join CreatoKite ↗</button>
                </>
              )}
            </div>
          )}

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
          {/* Left Column Content */}
          <div className="hero-content">
            <div className="reveal reveal-delay-1 hero-badge-wrapper">
              <span className="hero-pill-badge">FOR BRANDS & CREATORS</span>
            </div>

            <h1 className="reveal reveal-delay-2 hero-title-serif">
              Where<br />
              creators meet<br />
              <em>brands.</em>
            </h1>

            <p className="reveal reveal-delay-3 hero-copy">
              CreatoKite connects brands with the right creators to build impactful collaborations that drive real results. Smart matching. Clear workflow. Measurable impact.
            </p>

            <div className="reveal reveal-delay-4 hero-actions">
              <button className="cta-primary" onClick={() => nav('/register?role=brand')}>
                Launch a Campaign <span className="btn-arrow">→</span>
              </button>
              <button className="cta-secondary" onClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                <span className="play-icon-circle">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                    <path d="M9 6L1.5 10.3301L1.5 1.66987L9 6Z" fill="#1F2937" />
                  </svg>
                </span>
                Watch How It Works
              </button>
            </div>

            {/* Social Proof Footer */}
            <div className="reveal reveal-delay-5 hero-social-proof">
              <div className="avatar-stack">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" alt="Creator 1" className="avatar-img" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" alt="Creator 2" className="avatar-img" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" alt="Creator 3" className="avatar-img" />
              </div>
              <span className="social-proof-text">
                Trusted by <strong>{stats.displayCreators}</strong> creators & <strong>{stats.displayBrands}</strong> brands
              </span>
            </div>
          </div>

          {/* Right Column Visual Cards Composition */}
          <div className="hero-art-container reveal">
            {/* Background Organic Design (Blob Shapes, Dotted Grid & Swirl Line) */}
            <div className="hero-blob-backdrop">
              <svg viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="blob-svg">
                <defs>
                  <linearGradient id="hero-outer-blob-grad" x1="100" y1="50" x2="450" y2="480" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FAF0E8" />
                    <stop offset="0.5" stopColor="#F8E5D8" />
                    <stop offset="1" stopColor="#F5DCCA" />
                  </linearGradient>
                  <linearGradient id="hero-inner-blob-grad" x1="150" y1="100" x2="420" y2="420" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FCECE2" />
                    <stop offset="1" stopColor="#F7DFCE" />
                  </linearGradient>
                </defs>

                {/* Outer Large Organic Fluid Blob Shape */}
                <path
                  d="M 290,25 C 380,20 480,75 490,175 C 500,275 455,360 395,430 C 315,505 185,485 105,430 C 25,375 -15,265 25,165 C 65,65 180,30 290,25 Z"
                  fill="url(#hero-outer-blob-grad)"
                  fillOpacity="0.88"
                />

                {/* Inner Layered Accent Blob */}
                <path
                  d="M 250,55 C 330,45 420,105 420,195 C 420,285 360,375 280,405 C 200,435 125,385 95,315 C 65,245 85,165 145,105 C 185,65 210,60 250,55 Z"
                  fill="url(#hero-inner-blob-grad)"
                  fillOpacity="0.7"
                />

                {/* Delicate Dotted Grid Pattern Matrix */}
                <g opacity="0.35" fill="#E55B2B">
                  <circle cx="280" cy="100" r="1.8" />
                  <circle cx="295" cy="100" r="1.8" />
                  <circle cx="310" cy="100" r="1.8" />
                  <circle cx="325" cy="100" r="1.8" />

                  <circle cx="280" cy="115" r="1.8" />
                  <circle cx="295" cy="115" r="1.8" />
                  <circle cx="310" cy="115" r="1.8" />
                  <circle cx="325" cy="115" r="1.8" />

                  <circle cx="280" cy="130" r="1.8" />
                  <circle cx="295" cy="130" r="1.8" />
                  <circle cx="310" cy="130" r="1.8" />
                  <circle cx="325" cy="130" r="1.8" />

                  <circle cx="280" cy="145" r="1.8" />
                  <circle cx="295" cy="145" r="1.8" />
                  <circle cx="310" cy="145" r="1.8" />
                  <circle cx="325" cy="145" r="1.8" />
                </g>

                {/* Organic Orange Swooping Line with Curly Loop */}
                <path
                  d="M 370,110 C 230,125 90,185 65,305 C 45,395 90,435 110,375 C 122,335 84,335 79,380 C 74,420 104,435 109,405"
                  stroke="#E86C44"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.8"
                />
              </svg>

              {/* Four-Pointed Spark Star */}
              <div className="hero-spark-star">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2 L17.5 10.5 L26 14 L17.5 17.5 L14 26 L10.5 17.5 L2 14 L10.5 10.5 Z" fill="none" stroke="#E86C44" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Overlapping Floating Cards */}
            <div className="hero-cards-wrapper">

              {/* Card 1: Top-Left Creator Card (Female) */}
              <div className="hero-card card-creator-top float-anim-1">
                <div className="creator-img-wrapper">
                  <img src="/assets/hero_creator_female.jpg" alt="Creator Riya" className="creator-photo" />
                  <span className="card-tag tag-orange">Creator</span>
                  <div className="card-stats-row">
                    <div className="stat-pill">
                      <span className="heart-icon">♥</span> 120K
                    </div>
                    <div className="stat-pill">
                      <span className="star-icon">★</span> 4.8
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Center Floating Campaign Card */}
              <div className="hero-card card-campaign-center float-anim-2">
                <div className="campaign-card-header">
                  <div className="header-left">
                    <div className="new-camp-icon-bg">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="2" width="10" height="10" rx="2" stroke="#E55B2B" strokeWidth="1.5" />
                        <path d="M5 7H9M7 5V9" stroke="#E55B2B" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="new-camp-title">New Campaign</span>
                  </div>
                  <span className="status-badge-active">Active</span>
                </div>

                <div className="campaign-card-body">
                  <h4 className="campaign-name">Skincare Launch</h4>
                  <p className="campaign-category">Lifestyle • Instagram</p>

                  <div className="progress-container">
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: '76%' }}></div>
                    </div>
                    <span className="progress-text">76%</span>
                  </div>

                  <div className="campaign-card-divider"></div>

                  <div className="campaign-metrics-grid">
                    <div className="metric-item">
                      <span className="metric-label">Budget</span>
                      <span className="metric-value">₹2,50,000</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Applications</span>
                      <span className="metric-value">128</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Floating Action Circle Button */}
              <div className="hero-card card-action-circle float-anim-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>

              {/* Card 4: Match Notification Pill */}
              <div className="hero-card card-match-pill float-anim-4">
                <div className="match-check-circle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="match-info">
                  <div className="match-title">Perfect Match Found</div>
                  <div className="match-sub">High engagement. Great fit.</div>
                </div>
                <div className="match-chevron">›</div>
              </div>

              {/* Card 5: Bottom-Right Creator Card (Male) */}
              <div className="hero-card card-creator-bottom float-anim-5">
                <div className="creator-img-wrapper">
                  <img src="/assets/hero_creator_male.jpg" alt="Creator Alex" className="creator-photo" />
                  <span className="card-tag tag-dark">Creator</span>
                  <div className="card-stats-row">
                    <div className="stat-pill">
                      <span className="heart-icon">♥</span> 85K
                    </div>
                    <div className="stat-pill">
                      <span className="star-icon">★</span> 4.7
                    </div>
                  </div>
                </div>
              </div>

            </div>
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

      {/* ── CAMPAIGNS SECTION (REDESIGNED EXPLICITLY TO MATCH REFERENCE) ── */}
      <section className="campaigns-spotlight-section" id="campaigns">
        <div className="wrap">
          {/* Header Row */}
          <div className="spotlight-header reveal">
            <div className="spotlight-header-left">
              <span className="spotlight-badge">
                <span className="badge-dot">●</span> CAMPAIGN SPOTLIGHT
              </span>
              <h2 className="spotlight-title">
                Campaigns<br />
                worth <em>making.</em>
              </h2>
              <p className="spotlight-sub">
                Discover and collaborate on creative briefs across fashion, lifestyle, technology and more.
              </p>
            </div>

            <div className="spotlight-header-right">
              <div className="spark-circle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="#E55B2B" />
                </svg>
              </div>
              <div className="spark-text">
                Real briefs. Real creators.<br />Real impact.
              </div>
            </div>
          </div>

          {/* Cards Grid Split Layout */}
          <div className="spotlight-cards-grid">

            {/* Left Tall Card: FASHION */}
            <div className="spotlight-card card-fashion reveal">
              <div className="card-top-tag">
                <span className="pill-tag tag-fashion">FASHION • OPEN</span>
              </div>

              {/* Inner White Creator Match Card */}
              <div className="fashion-inner-card">
                <div className="match-row">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" alt="Ananya" className="match-avatar" />
                  <div className="match-info">
                    <div className="match-name">Ananya Sharma</div>
                    <div className="match-niche">Fashion & Styling</div>
                  </div>
                  <span className="match-score-pill">95% Match</span>
                </div>

                <div className="match-row">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" alt="Kabir" className="match-avatar" />
                  <div className="match-info">
                    <div className="match-name">Kabir Mehta</div>
                    <div className="match-niche">Creative Direction</div>
                  </div>
                  <span className="match-score-pill">93% Match</span>
                </div>

                <div className="match-row">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" alt="Riya" className="match-avatar" />
                  <div className="match-info">
                    <div className="match-name">Riya Sen</div>
                    <div className="match-niche">Editorial Photography</div>
                  </div>
                  <span className="match-score-pill">91% Match</span>
                </div>
              </div>

              {/* Bottom Content & Graphic */}
              <div className="fashion-card-bottom">
                <div className="fashion-bottom-left">
                  <div className="action-circle-btn" onClick={() => nav('/register?role=creator')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </div>
                  <h3 className="card-heading">Rework the everyday.</h3>
                  <p className="card-studio-sub">North Studio12 creators</p>
                </div>

                <div className="fashion-bottom-graphic">
                  <img src="/assets/campaign_arch_3d.jpg" alt="3D Arch" className="arch-graphic-img" />
                </div>
              </div>
            </div>

            {/* Right Column Stack (Lifestyle + Technology) */}
            <div className="spotlight-right-column">

              {/* Top-Right Card: LIFESTYLE */}
              <div className="spotlight-card card-lifestyle reveal">
                <div className="lifestyle-top-row">
                  <span className="pill-tag tag-lifestyle">LIFESTYLE • NEW</span>

                  {/* Engagement Bar inside */}
                  <div className="lifestyle-bar-wrapper">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: '82%' }}></div>
                    </div>
                    <div className="bar-text-row">
                      <span>Engagement</span>
                      <strong>82%</strong>
                    </div>
                  </div>
                </div>

                <div className="lifestyle-main-content">
                  <div className="content-text-left">
                    <div className="icon-circle sun-icon-bg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E55B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                    </div>
                    <h3 className="card-heading">Slow mornings.</h3>
                    <p className="card-studio-sub">Good Ground8 creators</p>
                  </div>

                  <div className="lifestyle-graphic-right">
                    <img src="/assets/campaign_lifestyle_mug.jpg" alt="Lifestyle Mug" className="mug-graphic-img" />
                  </div>
                </div>
              </div>

              {/* Bottom-Right Card: TECHNOLOGY */}
              <div className="spotlight-card card-technology reveal">
                <div className="tech-top-row">
                  <span className="pill-tag tag-tech">TECHNOLOGY • OPEN</span>

                  {/* Filter tags */}
                  <div className="tech-tag-filters">
                    <span className="filter-pill purple-pill">✦ AI Match</span>
                    <span className="filter-pill white-pill">Tech</span>
                    <span className="filter-pill white-pill">Reviews</span>
                  </div>
                </div>

                <div className="tech-main-content">
                  <div className="content-text-left">
                    <div className="icon-circle bolt-icon-bg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    </div>
                    <h3 className="card-heading">Future, in your hands.</h3>
                    <p className="card-studio-sub">Mono Labs15 creators</p>
                  </div>

                  <div className="tech-graphic-right">
                    <img src="/assets/campaign_purple_glass.jpg" alt="Purple Glass 3D" className="glass-graphic-img" />
                  </div>
                </div>
              </div>

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

      {/* ── STATS BLOCK (REDESIGNED CARDS) ───────────────────── */}
      <section className="stats-section" id="impact-stats">
        <div className="wrap">
          <div className="stats-cards-grid reveal">

            {/* Card 1: CREATORS */}
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E55B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>

              <div className="stat-val">{stats.displayCreators}</div>
              <div className="stat-divider-line"></div>

              <div className="stat-label">CREATORS</div>
              <p className="stat-sub">Verified creators onboarded</p>

              {/* Bottom Graphic: Soft Wave Curve */}
              <div className="stat-bg-graphic graphic-wave">
                <svg viewBox="0 0 240 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 45 C 50 65 100 25 180 55 C 210 65 230 40 240 30 L 240 70 L 0 70 Z" fill="url(#stat-wave-grad)" />
                  <path d="M0 45 C 50 65 100 25 180 55 C 210 65 230 40 240 30" stroke="#E55B2B" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
                  <defs>
                    <linearGradient id="stat-wave-grad" x1="0" y1="30" x2="0" y2="70" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E55B2B" stopOpacity="0.2" />
                      <stop offset="1" stopColor="#E55B2B" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Card 2: BRANDS */}
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E55B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3l3-2 3 2"></path>
                </svg>
              </div>

              <div className="stat-val">{stats.displayBrands}</div>
              <div className="stat-divider-line"></div>

              <div className="stat-label">BRANDS</div>
              <p className="stat-sub">Active brands & agency partners</p>

              {/* Bottom Graphic: Rising Bar Chart Columns */}
              <div className="stat-bg-graphic graphic-bars">
                <div className="bar-col bar-1"></div>
                <div className="bar-col bar-2"></div>
                <div className="bar-col bar-3"></div>
                <div className="bar-col bar-4"></div>
                <div className="bar-col bar-5"></div>
              </div>
            </div>

            {/* Card 3: CAMPAIGNS */}
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E55B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </div>

              <div className="stat-val">{stats.displayCampaigns}</div>
              <div className="stat-divider-line"></div>

              <div className="stat-label">CAMPAIGNS</div>
              <p className="stat-sub">Successful campaigns launched</p>

              {/* Bottom Graphic: Dual Smooth Sine Lines */}
              <div className="stat-bg-graphic graphic-lines">
                <svg viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 50 Q 60 10 120 40 T 240 20" stroke="#E55B2B" strokeWidth="1.5" strokeOpacity="0.45" fill="none" />
                  <path d="M0 35 Q 70 55 140 25 T 240 45" stroke="#E55B2B" strokeWidth="1" strokeOpacity="0.25" fill="none" />
                </svg>
              </div>
            </div>

            {/* Card 4: AVG ROI */}
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E55B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>

              <div className="stat-val">320%</div>
              <div className="stat-divider-line"></div>

              <div className="stat-label">AVG ROI</div>
              <p className="stat-sub">Average return on investment</p>

              {/* Bottom Graphic: Growth Exponential Line + Gradient Area */}
              <div className="stat-bg-graphic graphic-growth">
                <svg viewBox="0 0 240 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 60 Q 120 55 230 10 L 230 65 L 0 65 Z" fill="url(#roi-growth-grad)" />
                  <path d="M 0 60 Q 120 55 230 10" stroke="#E55B2B" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <circle cx="230" cy="10" r="4.5" fill="#E55B2B" />
                  <circle cx="230" cy="10" r="8" fill="#E55B2B" fillOpacity="0.25" />
                  <defs>
                    <linearGradient id="roi-growth-grad" x1="0" y1="10" x2="0" y2="65" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E55B2B" stopOpacity="0.2" />
                      <stop offset="1" stopColor="#E55B2B" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

          </div>
        </div>
      </section>

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
          <div className="final-centered-card">
            <div className="final-ambient-glow" />

            <h2>
              Make something <br />
              <em>worth talking about.</em>
            </h2>

            <p className="final-subtext">
              Join a trusted ecosystem handling verified Indian creators and high-growth brand campaigns in one automated platform.
            </p>

            <div className="final-actions-row">
              <button className="final-primary-btn" onClick={() => nav('/register?role=creator')}>
                <span>Join as Creator</span>
                <ArrowRight size={16} />
              </button>
              <button className="final-secondary-btn" onClick={() => nav('/register?role=brand')}>
                <span>Connect as Brand</span>
              </button>
            </div>

            <div className="final-trust-bar">
              <div className="trust-item">
                <strong>12,500+</strong>
                <span>Verified Creators</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <strong>₹4.2Cr+</strong>
                <span>Campaign Value</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <strong>98.4%</strong>
                <span>Match Accuracy</span>
              </div>
            </div>
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
          --paper: #FAF7F2;
          --paper2: #FAF7F2;
          --ink: #111827;
          --muted: #6B7280;
          --line: rgba(17, 24, 39, 0.08);
          --acid: #E55B2B;
          --red: #E55B2B;
          --blue: #111827;
          --p: #E55B2B;
          --fb: "Figtree", sans-serif;
          color-scheme: light !important;
        }

        #landing-page-root {
          background: #FAF7F2 !important;
          color: #111827 !important;
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
          color: #111827;
        }

        .navin {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .logo {
          font-weight: 800 !important;
          letter-spacing: -0.04em !important;
          font-size: 24px !important;
          color: #111827 !important;
          text-decoration: none;
          display: flex;
          align-items: center;
        }

        .logo span {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 500 !important;
          color: #E55B2B !important;
        }

        .links {
          display: flex;
          align-items: center;
          gap: 32px;
          font-size: 14px;
          font-weight: 500;
        }

        .links a {
          position: relative;
          color: #4B5563 !important;
          text-decoration: none;
          transition: color 0.25s ease;
        }

        .links a:hover {
          color: #111827 !important;
        }

        .links a:after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -4px;
          width: 0;
          height: 2px;
          background: #E55B2B;
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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
          color: #4B5563 !important;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.25s ease;
        }

        .navright .login:hover {
          color: #111827 !important;
        }

        .cta {
          background: #E55B2B !important;
          color: #FFFFFF !important;
          border: 1px solid #E55B2B !important;
          padding: 10px 22px !important;
          border-radius: 9999px !important;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          font-weight: 600 !important;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 14px rgba(229, 91, 43, 0.25);
        }

        .cta:hover {
          background: #D44A1B !important;
          border-color: #D44A1B !important;
          transform: translateY(-1px);
        }

        .menu {
          display: none;
          background: none;
          border: 0;
          font-size: 24px;
          color: #111827;
          cursor: pointer;
        }

        .mobile-links-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #FFFFFF;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          padding: 20px 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .nav.scrolled {
          top: 15px !important;
          left: 50% !important;
          right: auto !important;
          transform: translateX(-50%) !important;
          width: calc(100% - 48px) !important;
          max-width: 1200px !important;
          background: rgba(255, 255, 255, 0.92) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-radius: 9999px !important;
          color: #111827 !important;
          padding: 10px 0 !important;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08) !important;
        }

        .nav.scrolled .navin {
          padding: 0 32px !important;
        }

        .nav.scrolled .logo {
          color: #111827 !important;
        }

        .nav.scrolled .links a {
          color: #374151 !important;
        }

        .nav.scrolled .links a:after {
          background: #E55B2B;
        }

        .nav.scrolled .navright .login {
          color: #374151 !important;
        }

        .nav.scrolled .cta {
          background: #E55B2B !important;
          color: #FFFFFF !important;
          border-color: #E55B2B !important;
        }

        .nav.scrolled .cta:hover {
          background: #D44A1B !important;
          color: #FFFFFF !important;
        }

        .hero {
          background: #FAF7F2 !important;
          color: #111827 !important;
          padding-top: 150px;
          padding-bottom: 90px;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 40px;
          align-items: center;
        }

        /* Pill Badge */
        .hero-pill-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(229, 91, 43, 0.06);
          border: 1px solid rgba(229, 91, 43, 0.2);
          color: #E55B2B;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        /* Heading */
        #landing-page-root .hero h1.hero-title-serif {
          font-family: "EB Garamond", Georgia, serif !important;
          font-size: clamp(48px, 5.8vw, 76px) !important;
          line-height: 1.06 !important;
          letter-spacing: -0.02em !important;
          margin: 0 0 24px 0 !important;
          font-weight: 400 !important;
          color: #111827 !important;
        }

        #landing-page-root .hero h1.hero-title-serif em {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          color: #E55B2B !important;
        }

        /* Hero Subhead */
        .hero-copy {
          max-width: 450px !important;
          margin: 0 0 32px 0 !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          color: #4B5563 !important;
          font-weight: 400;
        }

        /* Buttons Row */
        .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 40px;
        }

        .cta-primary {
          background: #E55B2B;
          color: #FFFFFF;
          border: none;
          padding: 14px 28px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px -5px rgba(229, 91, 43, 0.4);
          transition: all 0.3s ease;
        }

        .cta-primary:hover {
          background: #D44A1B;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -5px rgba(229, 91, 43, 0.5);
        }

        .cta-secondary {
          background: #FFFFFF;
          color: #1F2937;
          border: 1px solid #E5E7EB;
          padding: 13px 24px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
        }

        .cta-secondary:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
          transform: translateY(-1px);
        }

        .play-icon-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid #D1D5DB;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 2px;
        }

        /* Social Proof Footer */
        .hero-social-proof {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar-stack {
          display: flex;
          align-items: center;
        }

        .avatar-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #FAF7F2;
          object-fit: cover;
          margin-left: -10px;
        }

        .avatar-img:first-child {
          margin-left: 0;
        }

        .social-proof-text {
          font-size: 13px;
          color: #6B7280;
          font-weight: 500;
        }

        .social-proof-text strong {
          color: #E55B2B;
          font-weight: 700;
        }

        /* Hero Art Right Column Container */
        .hero-art-container {
          position: relative;
          width: 100%;
          height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Backdrop Shapes */
        .hero-blob-backdrop {
          position: absolute;
          width: 110%;
          height: 110%;
          top: -5%;
          right: -5%;
          pointer-events: none;
          z-index: 1;
        }

        .blob-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 15px 30px rgba(229, 91, 43, 0.06));
        }

        .hero-spark-star {
          position: absolute;
          top: 35px;
          right: 55px;
          z-index: 2;
          animation: pulseSpark 4s infinite ease-in-out;
        }

        @keyframes pulseSpark {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.75; }
          50% { transform: scale(1.15) rotate(15deg); opacity: 1; }
        }

        /* Overlapping Cards Container */
        .hero-cards-wrapper {
          position: relative;
          width: 520px;
          height: 480px;
          z-index: 2;
        }

        .hero-card {
          position: absolute;
          border-radius: 20px;
          background: #FFFFFF;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-card:hover {
          transform: translateY(-4px) scale(1.02);
          z-index: 30 !important;
        }

        /* Card 1: Top Left Creator Card */
        .card-creator-top {
          top: 10px;
          left: 35px;
          width: 200px;
          height: 240px;
          z-index: 3;
          overflow: hidden;
        }

        .creator-img-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .creator-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-tag {
          position: absolute;
          top: 12px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .tag-orange {
          left: 12px;
          background: #E55B2B;
          color: #FFFFFF;
        }

        .tag-dark {
          right: 12px;
          background: #18181B;
          color: #FFFFFF;
        }

        .card-stats-row {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: flex;
          gap: 6px;
        }

        .stat-pill {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #111827;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .heart-icon {
          color: #EF4444;
          font-size: 10px;
        }

        .star-icon {
          color: #F59E0B;
          font-size: 10px;
        }

        /* Card 2: Center Floating Campaign Card */
        .card-campaign-center {
          top: 45px;
          right: 35px;
          width: 310px;
          padding: 20px;
          z-index: 10;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .campaign-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .new-camp-icon-bg {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #FDF2EA;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .new-camp-title {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .status-badge-active {
          background: #ECFDF5;
          color: #10B981;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .campaign-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2px 0;
        }

        .campaign-category {
          font-size: 12px;
          color: #6B7280;
          margin: 0 0 16px 0;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .progress-bar-track {
          flex: 1;
          height: 6px;
          background: #F3F4F6;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: #E55B2B;
          border-radius: 999px;
        }

        .progress-text {
          font-size: 11px;
          font-weight: 700;
          color: #4B5563;
        }

        .campaign-card-divider {
          height: 1px;
          background: #F3F4F6;
          margin-bottom: 14px;
        }

        .campaign-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .metric-label {
          display: block;
          font-size: 11px;
          color: #9CA3AF;
          margin-bottom: 2px;
        }

        .metric-value {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        /* Card 3: Floating Action Circle Button */
        .card-action-circle {
          top: 75px;
          right: 0px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #18181B;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 15;
          box-shadow: 0 10px 25px rgba(0,0,0,0.18);
          cursor: pointer;
        }

        /* Card 4: Match Notification Pill */
        .card-match-pill {
          bottom: 75px;
          left: 115px;
          padding: 12px 18px;
          border-radius: 16px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.04);
        }

        .match-check-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #E55B2B;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .match-title {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }

        .match-sub {
          font-size: 11px;
          color: #6B7280;
          margin-top: 1px;
        }

        .match-chevron {
          font-size: 18px;
          color: #9CA3AF;
          margin-left: 6px;
        }

        /* Card 5: Bottom-Right Creator Card */
        .card-creator-bottom {
          bottom: 20px;
          right: 15px;
          width: 190px;
          height: 220px;
          z-index: 5;
          overflow: hidden;
        }

        /* Floating Micro-Animations */
        @keyframes floatSlow1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatSlow3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .float-anim-1 { animation: floatSlow1 6s infinite ease-in-out; }
        .float-anim-2 { animation: floatSlow2 7s infinite ease-in-out 1s; }
        .float-anim-3 { animation: floatSlow3 5s infinite ease-in-out 0.5s; }
        .float-anim-4 { animation: floatSlow1 6.5s infinite ease-in-out 1.5s; }
        .float-anim-5 { animation: floatSlow2 7.5s infinite ease-in-out 2s; }

        /* ── IMPACT STATS CARDS SECTION (RESERVED HIGH FIDELITY DESIGN) ── */
        .stats-section {
          padding: 100px 0 60px 0;
          background: #FAF7F2;
        }

        .stats-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .stat-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 36px 20px 0 20px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          height: 350px;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease;
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 25px 45px -12px rgba(229, 91, 43, 0.15), 0 4px 12px rgba(0, 0, 0, 0.03);
          border-color: rgba(229, 91, 43, 0.3);
        }

        .stat-icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, #FDF1EA 0%, #FFF8F3 100%);
          border: 1px solid rgba(229, 91, 43, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(229, 91, 43, 0.08);
          flex-shrink: 0;
        }

        .stat-val {
          font-family: "Figtree", sans-serif !important;
          font-size: clamp(32px, 3.2vw, 42px);
          font-weight: 800;
          color: #E55B2B;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .stat-divider-line {
          width: 24px;
          height: 3px;
          background: #E55B2B;
          border-radius: 99px;
          margin: 14px auto 14px auto;
          opacity: 0.85;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #111827;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .stat-sub {
          font-size: 13px;
          color: #6B7280;
          margin: 0;
          line-height: 1.4;
          max-width: 170px;
          font-weight: 400;
        }

        /* Bottom Graphic Elements */
        .stat-bg-graphic {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          pointer-events: none;
        }

        .stat-bg-graphic svg {
          width: 100%;
          display: block;
        }

        /* Card 2 Bars Graphic */
        .graphic-bars {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 8px;
          height: 48px;
          padding-bottom: 8px;
        }

        .bar-col {
          width: 14px;
          border-radius: 4px 4px 0 0;
          background: rgba(229, 91, 43, 0.15);
          transition: height 0.3s ease, background 0.3s ease;
        }

        .bar-1 { height: 12px; }
        .bar-2 { height: 20px; }
        .bar-3 { height: 28px; }
        .bar-4 { height: 36px; }
        .bar-5 { height: 48px; background: #E55B2B; box-shadow: 0 -2px 10px rgba(229, 91, 43, 0.4); }

        /* Ensure Stat Cards ALWAYS render crisp porcelain white in all light/dark themes */
        .stats-section {
          background: #FAF7F2 !important;
          color: #111827 !important;
          padding: 80px 0 60px 0 !important;
        }

        .stat-card {
          background: #FFFFFF !important;
          color: #111827 !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02) !important;
        }

        .stat-val {
          color: #E55B2B !important;
        }

        .stats-section .stat-card .stat-label,
        .stat-card .stat-label,
        .stat-label {
          color: #111827 !important;
          font-weight: 800 !important;
          opacity: 1 !important;
        }

        .stats-section .stat-card .stat-sub,
        .stat-card .stat-sub,
        .stat-sub {
          color: #4B5563 !important;
          font-weight: 500 !important;
          opacity: 1 !important;
        }

        /* ── CAMPAIGNS SPOTLIGHT SECTION STYLES ── */
        .campaigns-spotlight-section {
          padding: 120px 0 !important;
          background: #FAF7F2 !important;
          color: #111827 !important;
        }

        .spotlight-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 50px;
        }

        .spotlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(229, 91, 43, 0.08);
          color: #E55B2B;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .badge-dot {
          font-size: 8px;
        }

        #landing-page-root .spotlight-title {
          font-family: "Figtree", sans-serif !important;
          font-size: clamp(38px, 4.2vw, 54px) !important;
          font-weight: 800 !important;
          line-height: 1.08 !important;
          color: #111827 !important;
          letter-spacing: -0.03em !important;
          margin: 0 0 16px 0 !important;
        }

        #landing-page-root .spotlight-title em {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          color: #E55B2B !important;
        }

        .spotlight-sub {
          font-size: 16px;
          color: #6B7280;
          max-width: 480px;
          line-height: 1.5;
          margin: 0;
        }

        .spotlight-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFFFFF;
          padding: 12px 20px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
        }

        .spark-circle-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #FDF1EA;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spark-text {
          font-size: 12px;
          line-height: 1.3;
          color: #374151;
          font-weight: 600;
        }

        /* 3-Card Grid Split Layout */
        .spotlight-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: 28px;
        }

        .spotlight-card {
          border-radius: 24px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .spotlight-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08);
        }

        /* Card 1: Fashion (Left Tall) */
        .card-fashion {
          background: linear-gradient(135deg, #FAF5EE 0%, #F7EFE4 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 540px;
        }

        .pill-tag {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          background: #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .tag-fashion { color: #E55B2B; }
        .tag-lifestyle { color: #E55B2B; }
        .tag-tech { color: #7C3AED; }

        .fashion-inner-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 16px 20px;
          margin: 24px 0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
        }

        .match-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #F3F4F6;
        }

        .match-row:last-child {
          border-bottom: none;
        }

        .match-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .match-info {
          flex: 1;
          margin-left: 12px;
        }

        .match-name {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
        }

        .match-niche {
          font-size: 11px;
          color: #6B7280;
        }

        .match-score-pill {
          background: #FDF2EA;
          color: #E55B2B;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .fashion-card-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          position: relative;
          min-height: 160px;
          margin-top: 24px;
        }

        .fashion-bottom-left {
          position: relative;
          z-index: 5;
          max-width: 58%;
        }

        .action-circle-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #E55B2B;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 8px 20px rgba(229, 91, 43, 0.35);
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .action-circle-btn:hover {
          transform: scale(1.08);
        }

        .card-heading {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .card-studio-sub {
          font-size: 13px;
          color: #6B7280;
          margin: 0;
        }

        .arch-graphic-img {
          width: 170px;
          height: 170px;
          object-fit: cover;
          border-radius: 20px 0 0 0;
          position: absolute;
          bottom: -32px;
          right: -32px;
          z-index: 1;
          pointer-events: none;
          box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.05);
        }

        /* Right Column (Stack) */
        .spotlight-right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Card 2: Lifestyle */
        .card-lifestyle {
          background: linear-gradient(135deg, #FFF5ED 0%, #FDF0E6 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 258px;
          position: relative;
        }

        .lifestyle-top-row, .tech-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 5;
        }

        .lifestyle-bar-wrapper {
          background: #FFFFFF;
          padding: 8px 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 210px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .bar-track {
          height: 5px;
          background: #F3F4F6;
          border-radius: 999px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: #E55B2B;
          border-radius: 999px;
        }

        .bar-text-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6B7280;
        }

        .lifestyle-main-content, .tech-main-content {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          position: relative;
          z-index: 5;
          min-height: 110px;
          margin-top: 16px;
        }

        .content-text-left {
          position: relative;
          z-index: 5;
          max-width: 58%;
        }

        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .sun-icon-bg {
          background: #FFFFFF;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .mug-graphic-img, .glass-graphic-img {
          width: 140px;
          height: 140px;
          object-fit: cover;
          border-radius: 20px 0 0 0;
          position: absolute;
          bottom: -32px;
          right: -32px;
          z-index: 1;
          pointer-events: none;
          box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.04);
        }

        /* Card 3: Technology */
        .card-technology {
          background: linear-gradient(135deg, #F3F0FF 0%, #EBE5FF 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 258px;
          position: relative;
        }

        .tech-tag-filters {
          display: flex;
          gap: 6px;
        }

        .filter-pill {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }

        .purple-pill {
          background: rgba(124, 58, 237, 0.1);
          color: #7C3AED;
        }

        .white-pill {
          background: #FFFFFF;
          color: #374151;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }

        .bolt-icon-bg {
          background: #FFFFFF;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
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
          padding: 130px 0 !important;
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
          padding: 110px 0 120px 0 !important;
          border-top-left-radius: 60px;
          border-top-right-radius: 60px;
          overflow: hidden;
          margin-top: 70px !important;
        }

        #landing-page-root .eyebrow-container {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin-bottom: 36px !important;
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
          margin-top: 32px;
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
          padding: 130px 0 130px !important;
          border-top: 1px solid var(--line);
        }

        .faq-list {
          max-width: 900px;
          margin: 60px auto 0 !important;
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

        /* ── CENTERED FINAL CTA SECTION STYLES ── */
        .final {
          background: #0C0C0E !important;
          color: #FFFFFF !important;
          padding: 130px 0 !important;
          border-top-left-radius: 60px;
          border-top-right-radius: 60px;
          overflow: hidden;
          position: relative;
        }

        .final-centered-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
          z-index: 5;
        }

        .final-ambient-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(229, 91, 43, 0.18) 0%, rgba(245, 166, 35, 0.05) 50%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .final-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(229, 91, 43, 0.12);
          border: 1px solid rgba(229, 91, 43, 0.25);
          color: #E55B2B;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        #landing-page-root .final h2 {
          font-size: clamp(42px, 5.5vw, 76px) !important;
          line-height: 1.05 !important;
          letter-spacing: -0.03em !important;
          margin: 0 0 20px 0 !important;
          font-family: "Figtree", sans-serif !important;
          font-weight: 800 !important;
          color: #FFFFFF !important;
          text-align: center !important;
        }

        #landing-page-root .final h2 em {
          font-family: "EB Garamond", Georgia, serif !important;
          font-style: italic !important;
          font-weight: 400 !important;
          color: #E55B2B !important;
        }

        .final-subtext {
          color: rgba(255, 255, 255, 0.7);
          font-size: 17px;
          line-height: 1.6;
          max-width: 580px;
          margin: 0 0 36px 0;
          text-align: center;
        }

        .final-actions-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }

        .final-primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          border-radius: 999px;
          background: #E55B2B;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(229, 91, 43, 0.4);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .final-primary-btn:hover {
          transform: translateY(-3px);
          background: #F06837;
          box-shadow: 0 16px 32px rgba(229, 91, 43, 0.5);
        }

        .final-secondary-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .final-secondary-btn:hover {
          background: #FFFFFF;
          color: #0C0C0E;
          border-color: #FFFFFF;
          transform: translateY(-3px);
        }

        .final-trust-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          padding-top: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 720px;
        }

        .trust-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .trust-item strong {
          font-size: 20px;
          font-weight: 800;
          color: #FFFFFF;
        }

        .trust-item span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 3px;
        }

        .trust-divider {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.12);
        }

        /* Right Column Creative Card Styles */
        .final-right-creative-card {
          position: relative;
        }

        .creative-card-glow {
          position: absolute;
          inset: -20px;
          border-radius: 36px;
          background: radial-gradient(circle, rgba(229, 91, 43, 0.25) 0%, rgba(245, 166, 35, 0.08) 50%, transparent 70%);
          filter: blur(40px);
          pointer-events: none;
        }

        .creative-glass-card {
          position: relative;
          background: linear-gradient(145deg, rgba(30, 27, 36, 0.8) 0%, rgba(18, 16, 22, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px);
        }

        .glass-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 20px;
        }

        .window-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot-red { background: #FF5F56; }
        .dot-yellow { background: #FFBD2E; }
        .dot-green { background: #27C93F; }

        .live-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          color: #E55B2B;
          letter-spacing: 0.08em;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #E55B2B;
          box-shadow: 0 0 8px #E55B2B;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

        .stream-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .stream-title {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .stream-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .creator-stream-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 12px 14px;
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }

        .creator-stream-item.active-glow {
          background: rgba(229, 91, 43, 0.08);
          border-color: rgba(229, 91, 43, 0.25);
          box-shadow: 0 8px 20px rgba(229, 91, 43, 0.12);
        }

        .stream-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
        }

        .stream-info {
          flex: 1;
        }

        .stream-name {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .stream-meta {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }

        .stream-badge {
          font-size: 11px;
          font-weight: 700;
          color: #10B981;
          background: rgba(16, 185, 129, 0.12);
          padding: 4px 10px;
          border-radius: 999px;
        }

        .orange-badge {
          color: #E55B2B;
          background: rgba(229, 91, 43, 0.15);
        }

        .glass-stat-row {
          display: flex;
          justify-content: space-between;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .g-stat {
          display: flex;
          flex-direction: column;
        }

        .g-lbl {
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .g-val {
          font-size: 12.5px;
          font-weight: 700;
          color: #FFFFFF;
          margin-top: 2px;
        }

        .align-right { text-align: right; }

        footer {
          background: #0C0C0E !important;
          color: rgba(255, 255, 255, 0.8) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 100px 0 50px !important;
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
          margin-top: 40px !important;
          padding-top: 24px;
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
          .links, .navright .login { display: none !important; }
          .menu { display: block !important; }

          .nav.scrolled {
            width: calc(100% - 32px) !important;
            top: 12px !important;
            border-radius: 9999px !important;
            padding: 8px 0 !important;
          }
          .nav.scrolled .navin {
            padding: 0 24px !important;
          }
          .hero { min-height: auto; padding-top: 120px; padding-bottom: 60px; }
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-art-container { height: 440px; max-width: 100%; margin: 0 auto; overflow: hidden; }
          .hero-cards-wrapper { transform: scale(0.85); transform-origin: center center; }

          .spotlight-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .final-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .final-trust-bar {
            flex-wrap: wrap !important;
            gap: 16px !important;
          }
          .card-fashion {
            min-height: auto !important;
          }
          .spotlight-header {
            flex-direction: column !important;
            gap: 20px !important;
          }

          .stats-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }

          .step { grid-template-columns: 60px 1fr; gap: 15px; }
          .step p { grid-column: 2; }
          #landing-page-root .step h3 { font-size: 26px !important; }
          
          #landing-page-root .split {
            grid-template-columns: 1fr !important;
            margin-top: 80px !important;
          }
          #landing-page-root .panel { min-height: 480px !important; padding: 50px 24px !important; }
          #landing-page-root .footgrid { grid-template-columns: 1fr 1fr !important; }
        }

        /* ── RESPONSIVENESS OVERRIDES (MAX-WIDTH: 600PX) ── */
        @media(max-width: 600px){
          .wrap { padding: 0 16px; }
          .navright .cta, .navright .login { display: none !important; }
          
          .hero { padding-top: 90px; padding-bottom: 20px; overflow: hidden; }
          .hero-art-container {
            height: 360px !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 15px auto 0 auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            overflow: visible !important;
          }
          .hero-cards-wrapper {
            position: absolute !important;
            left: 50% !important;
            top: 52% !important;
            transform: translate(-50%, -50%) scale(0.56) !important;
            transform-origin: center center !important;
            margin: 0 !important;
            width: 520px !important;
            height: 480px !important;
          }
          .hero-blob-backdrop {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(0.80) !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          .hero-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .cta-primary, .cta-secondary {
            width: 100% !important;
            justify-content: center !important;
            padding: 14px 20px !important;
            font-size: 15px !important;
          }

          .hero-social-proof {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }

          #landing-page-root .hero h1.hero-title-serif {
            font-size: clamp(36px, 10.5vw, 52px) !important;
            line-height: 1.08 !important;
            font-weight: 700 !important;
          }
          #landing-page-root .hero h1.hero-title-serif em {
            font-weight: 700 !important;
          }

        @media(max-width: 440px){
          .hero-art-container {
            height: 310px !important;
          }
          .hero-cards-wrapper {
            transform: translate(-50%, -50%) scale(0.48) !important;
            top: 52% !important;
          }
        }

          /* How It Works Steps on Mobile */
          .step {
            grid-template-columns: 40px 1fr !important;
            gap: 12px !important;
            padding: 24px 0 !important;
          }
          .step h3 {
            font-size: 20px !important;
            grid-column: 2 !important;
          }
          .step p {
            grid-column: 2 !important;
            font-size: 14px !important;
            margin-top: 4px !important;
          }

          .spotlight-card {
            padding: 20px !important;
          }

          /* On mobile, use 3D graphics as rich vivid background images */
          .card-fashion {
            background: linear-gradient(135deg, rgba(250, 245, 238, 0.75) 0%, rgba(247, 239, 228, 0.45) 100%), url('/assets/campaign_arch_3d.jpg') center center / cover no-repeat !important;
          }

          .card-lifestyle {
            background: linear-gradient(135deg, rgba(255, 245, 237, 0.75) 0%, rgba(253, 240, 230, 0.45) 100%), url('/assets/campaign_lifestyle_mug.jpg') center right / cover no-repeat !important;
          }

          .card-technology {
            background: linear-gradient(135deg, rgba(243, 240, 255, 0.75) 0%, rgba(235, 229, 255, 0.45) 100%), url('/assets/campaign_purple_glass.jpg') center right / cover no-repeat !important;
          }

          .arch-graphic-img, .mug-graphic-img, .glass-graphic-img {
            display: none !important;
          }

          .fashion-card-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
            min-height: auto !important;
            margin-top: 20px !important;
            gap: 12px !important;
          }

          .fashion-bottom-left, .content-text-left {
            max-width: 100% !important;
            width: 100% !important;
            position: relative !important;
            z-index: 5 !important;
          }

          .lifestyle-top-row, .tech-top-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .lifestyle-bar-wrapper {
            width: 100% !important;
          }

          .lifestyle-main-content, .tech-main-content {
            flex-direction: column !important;
            align-items: flex-start !important;
            min-height: auto !important;
            margin-top: 16px !important;
            gap: 12px !important;
          }

          .stats-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .stat-card {
            height: auto !important;
            padding: 30px 16px 40px 16px !important;
          }
          .stat-sub {
            color: #4B5563 !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            opacity: 1 !important;
          }

          /* Testimonials & FAQ on Mobile */
          .testimonial-card-v2 {
            width: 290px !important;
            max-width: 82vw !important;
            padding: 18px !important;
            flex-direction: column !important;
          }

          .testimonial-marquee-container {
            width: 100% !important;
            left: 0 !important;
            right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          #landing-page-root .testimonials-section,
          #landing-page-root .final {
            border-top-left-radius: 24px !important;
            border-top-right-radius: 24px !important;
            padding: 60px 0 !important;
          }

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
        }`}</style>
    </div>
  );
}
