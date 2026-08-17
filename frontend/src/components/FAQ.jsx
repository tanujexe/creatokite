import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

const FAQS = [
  { q: 'What is Creatokite?', a: 'Creatokite is India\'s first AI-powered Creator Ecosystem Platform. It\'s not just a marketplace — it\'s a complete creator growth, learning, and reputation platform. Creators join to learn, participate in activities, build their reputation, and get matched with premium brand campaigns. Brands get curated, verified creators with real engagement.' },
  { q: 'How does the platform work?', a: 'The process is simple: (1) You register and build your creator profile, (2) Complete daily and weekly activities to earn XP and grow your ranking, (3) Learn through our Academy to build skills, (4) As your Creator Power Score improves, you become eligible for brand campaigns, (5) Campaigns are assigned by our AI and admin team — brands never contact you directly.' },
  { q: 'Who can join Creatokite?', a: 'Any content creator with an active social media presence can join. Whether you have 1,000 or 1,000,000 followers — we evaluate creators based on engagement quality, content authenticity, and growth consistency — not just follower count.' },
  { q: 'Is it free to join?', a: 'Yes, joining Creatokite as a creator is completely free. There are no subscription fees, no hidden charges. You earn rewards, XP, and payouts when you complete brand campaigns.' },
  { q: 'How long does account approval take?', a: 'Creator profiles are reviewed within 24–72 hours. Our admin team verifies your social accounts, checks engagement authenticity, and ensures your profile meets platform standards. You\'ll receive a notification once approved.' },
  { q: 'What do I need to get started?', a: 'You need: an active social media account (minimum 1,000 followers), an email address, and a completed profile with your niche, location, and platform links. The more complete your profile, the faster you\'ll get approved and the higher your initial score.' },
  { q: 'Can beginners join?', a: 'Absolutely. We welcome creators at every stage. Beginners start at Level 1 (Beginner) and grow through our activity and academy systems. Consistent participation matters more than follower count. Many of our top-ranked creators started from zero on our platform.' }
];

function FAQItem({ item, isOpen, onToggle, isLast }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        borderTop: '1px solid var(--line)',
        borderBottom: isLast ? '1px solid var(--line)' : 'none',
        background: 'transparent',
        transition: 'all 0.25s ease',
      }}
      className="faq-item-row"
    >
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 0',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: 'clamp(16px, 2.2vw, 20px)',
          fontWeight: 500,
          color: 'var(--ink)',
          lineHeight: 1.4,
          fontFamily: 'var(--fb)',
        }}>
          {item.q}
        </span>
        <span style={{
          flexShrink: 0,
          fontSize: '25px',
          color: 'var(--ink)',
          transform: isOpen ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.25s ease',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Plus size={22} />
        </span>
      </div>

      <div style={{
        height: height,
        overflow: 'hidden',
        transition: 'height 0.4s ease',
      }}>
        <div ref={bodyRef} style={{ padding: '0 45px 24px 0' }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (i) => setOpenIndex(prev => prev === i ? null : i);

  return (

    
    <section
      id="faq"
      style={{
        padding: '100px 0 150px',
        background: 'var(--paper)',
        position: 'relative',
        zIndex: 3,
        borderTop: '1px solid var(--line)',
      }}
    >
      <div className="wrap">
        <div className="section-top reveal">
          <h2 style={{ color: 'var(--ink)' }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--muted)' }}>
            Everything you need to know before making your first connection.{' '}
            <a href="mailto:creaotokite123@gmail.com" style={{ color: 'var(--acid)', borderBottom: '1px solid currentColor', paddingBottom: 2 }}>Contact our team.</a>
          </p>
        </div>

        <div className="faq-list" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          {FAQS.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => handleToggle(i)}
              isLast={i === FAQS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
