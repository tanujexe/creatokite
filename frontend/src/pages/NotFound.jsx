import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Compass, ArrowLeft, Home, Search, Sparkles, Rocket, Globe,
  ShieldAlert, HelpCircle, Layers, Flame, FileText, ChevronRight
} from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dots, setDots] = useState('');

  // Animated ellipsis for signal lost effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const role = user?.role || 'creator';
    if (role === 'admin' || role === 'team_member') {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/creator/dashboard?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Determine smart dashboard link based on role
  const getHomePath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'brand':
        return '/brand/dashboard';
      case 'team_member':
        return '/team/workspace';
      case 'superadmin':
        return '/superadmin/dashboard';
      default:
        return '/creator/dashboard';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0D0B0A)',
      color: 'var(--t1, #F5F2F0)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      padding: '32px 16px'
    }}>
      {/* ── Dynamic Ambient Background Glows ── */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(230,95,43,0.18) 0%, rgba(108,99,255,0.12) 50%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,162,76,0.15) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* ── Main Glass Card Container ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 680,
        width: '100%',
        background: 'rgba(25, 20, 18, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 28,
        border: '1.5px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(230,95,43,0.15)',
        padding: '48px 36px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24
      }}>

        {/* Floating Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 99,
          background: 'rgba(255,107,87,0.12)',
          border: '1px solid rgba(255,107,87,0.25)',
          color: 'var(--rose, #FF6B57)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--rose, #FF6B57)',
            boxShadow: '0 0 10px var(--rose, #FF6B57)',
            display: 'inline-block'
          }} />
          Signal Lost 404{dots}
        </div>

        {/* Creative Floating 404 Hero Display */}
        <div style={{ position: 'relative', userSelect: 'none', margin: '8px 0' }}>
          <h1 style={{
            fontSize: 'clamp(80px, 16vw, 130px)',
            fontWeight: 900,
            lineHeight: 0.9,
            margin: 0,
            background: 'linear-gradient(135deg, #FFF 20%, rgba(255,255,255,0.4) 60%, var(--acc, #E65F2B) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.05em',
            filter: 'drop-shadow(0 10px 30px rgba(230,95,43,0.2))'
          }}>
            404
          </h1>
          <Sparkles
            size={28}
            style={{
              position: 'absolute',
              top: '-10px',
              right: '10px',
              color: 'var(--gold, #D4A24C)',
              animation: 'pulse 2s infinite ease-in-out'
            }}
          />
          <Compass
            size={24}
            style={{
              position: 'absolute',
              bottom: '0px',
              left: '10px',
              color: 'var(--p2, #6C63FF)',
              opacity: 0.8
            }}
          />
        </div>

        {/* Text Details */}
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
            Page Off the Grid
          </h2>
          <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.6, margin: 0 }}>
            The page you are looking for does not exist or may have been moved.
          </p>
        </div>

        {/* Direct Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ width: '100%', maxWidth: 460, marginTop: 4 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border, rgba(255,255,255,0.12))',
            borderRadius: 14,
            padding: '4px 6px 4px 14px',
            transition: 'border 0.2s',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <Search size={16} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search campaigns, creators, or pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--t1)',
                fontSize: 13.5,
                padding: '10px 10px',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                gap: 4,
                flexShrink: 0
              }}
            >
              Search <ChevronRight size={13} />
            </button>
          </div>
        </form>

        {/* Quick Destination Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          width: '100%',
          marginTop: 8
        }}>
          <button
            onClick={() => navigate(getHomePath())}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border, rgba(255,255,255,0.08))',
              color: 'var(--t1)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              transition: 'transform 0.15s, background 0.15s'
            }}
            className="hover-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--acc, #E65F2B)', fontWeight: 700, fontSize: 13 }}>
              <Home size={16} /> Main Dashboard
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Return to your active workspace hub</div>
          </button>

          <button
            onClick={() => navigate(user?.role === 'admin' ? '/admin/campaigns' : '/opportunities')}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border, rgba(255,255,255,0.08))',
              color: 'var(--t1)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              transition: 'transform 0.15s, background 0.15s'
            }}
            className="hover-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold, #D4A24C)', fontWeight: 700, fontSize: 13 }}>
              <Flame size={16} /> Active Campaigns
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Explore open brand collaborations</div>
          </button>

          <button
            onClick={() => navigate(user?.role === 'admin' ? '/admin/knowledge' : '/creator/academy')}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border, rgba(255,255,255,0.08))',
              color: 'var(--t1)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              transition: 'transform 0.15s, background 0.15s'
            }}
            className="hover-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--p2, #6C63FF)', fontWeight: 700, fontSize: 13 }}>
              <FileText size={16} /> Knowledge Base
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Read guides, tutorials & docs</div>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justify: 'center',
          flexWrap: 'wrap',
          width: '100%',
          marginTop: 8,
          paddingTop: 16,
          borderTop: '1px solid var(--border, rgba(255,255,255,0.08))'
        }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: '10px 20px',
              gap: 8,
              borderRadius: 12,
              flex: '1 1 140px'
            }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          <button
            onClick={() => navigate(getHomePath())}
            className="btn btn-primary"
            style={{
              fontSize: 13,
              fontWeight: 800,
              padding: '10px 22px',
              gap: 8,
              borderRadius: 12,
              flex: '1 1 160px'
            }}
          >
            <Home size={16} /> Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
