import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ecosystemAPI } from '../../api';
import { PageLoader, Btn, StatusBadge, Input, Textarea, renderTextWithLinks } from '../../components/ui';
import toast from 'react-hot-toast';
import { Target, Award, Play, AlertCircle, Calendar, LayoutGrid, RefreshCw, Trophy } from 'lucide-react';
import CreatorShell from './CreatorShell';

function decodeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseDescriptionToBullets(rawText) {
  if (!rawText) return { intro: '', bullets: [], links: [] };
  let text = decodeHTML(rawText);

  // Extract URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const links = [];
  text = text.replace(urlRegex, (match) => {
    const cleanUrl = match.replace(/[.,;!?]+$/, '');
    links.push(cleanUrl);
    return '';
  });

  text = text.trim();

  // Split into segments by newlines or emoji bullet indicators
  let segments = text.split(/(?:\r?\n|(?=[✨🚀🎁💛🌟🔗⌛🎯⚡👇👉▪✔•\-\*\d+\.]\s))/g)
    .map(s => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    const block = segments[0] || text;
    segments = block.split(/(?<=[.!?—])\s+|(?=[✨🚀🎁💛🌟🔗⌛🎯⚡👇👉])/g)
      .map(s => s.trim())
      .filter(Boolean);
  }

  let intro = '';
  const bullets = [];

  segments.forEach((seg, i) => {
    let cleaned = seg.replace(/^[•\-\*\d\.\s\t]+/, '').trim();
    if (!cleaned) return;

    if (i === 0 && !seg.match(/^[✨🚀🎁💛🌟🔗⌛🎯⚡👇👉•\-]/) && cleaned.length > 15) {
      intro = cleaned;
    } else {
      bullets.push(cleaned);
    }
  });

  if (!intro && bullets.length > 0) {
    intro = bullets.shift();
  }

  return { intro, bullets, links };
}

function FormattedBulletDescription({ text, isCompact = false, onShowMore }) {
  const { intro, bullets, links } = parseDescriptionToBullets(text);
  const displayBullets = isCompact ? bullets.slice(0, 3) : bullets;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0 12px' }}>
      {intro && (
        <p style={{
          fontSize: 13,
          color: 'var(--t1)',
          lineHeight: 1.5,
          fontWeight: 600,
          margin: 0,
          marginBottom: bullets.length > 0 ? 4 : 0
        }}>
          {renderTextWithLinks(intro)}
        </p>
      )}

      {displayBullets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 2 }}>
          {displayBullets.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.45 }}>
              <span style={{
                color: 'var(--acc)',
                fontWeight: 800,
                fontSize: 14,
                lineHeight: 1,
                marginTop: 2,
                flexShrink: 0
              }}>•</span>
              <span style={{ flex: 1, wordBreak: 'break-word' }}>{renderTextWithLinks(item)}</span>
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(230,95,43,0.1)',
                border: '1px solid rgba(230,95,43,0.25)',
                color: 'var(--acc)',
                fontSize: 11.5,
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s',
                wordBreak: 'break-all'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,95,43,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,95,43,0.1)'}
            >
              🔗 {link.length > 35 ? link.substring(0, 35) + '...' : link} ↗
            </a>
          ))}
        </div>
      )}

      {isCompact && onShowMore && (
        <button
          onClick={onShowMore}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 0 0',
            color: 'var(--acc)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          View Full Details & Guidelines →
        </button>
      )}
    </div>
  );
}


export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('daily');
  const [showModal, setShowModal] = useState(false);
  const [selectedAct, setSelectedAct] = useState(null);
  const [detailAct, setDetailAct] = useState(null);

  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (detailAct || showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [detailAct, showModal]);

  const fetchActivities = () => {
    setLoading(true);
    ecosystemAPI.getActivities()
      .then(d => setActivities(d.activities || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const openSubmitModal = (act) => {
    setSelectedAct(act);
    setUrl('');
    setNote('');
    setShowModal(true);
  };

  const submitActivity = async (e) => {
    e.preventDefault();
    if (!note && !url) {
      toast.error('Please provide a URL or note for submission');
      return;
    }
    setSubmitting(true);
    try {
      await ecosystemAPI.submitActivity(selectedAct._id, { submissionUrl: url, submissionNote: note });
      toast.success('Activity submitted successfully for review!');
      setShowModal(false);
      fetchActivities(); // reload statuses
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const filtered = activities.filter(a => {
    if (filter === 'challenges') return a.isChallenge;
    return a.type === filter && !a.isChallenge;
  });

  return (
    <CreatorShell style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 20,
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: 'var(--glass-shadow)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background light */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '50%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(124, 139, 90, 0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: 'var(--fh)', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--t1)' }}>Activity Hub</h2>
            <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)' }}>GAMIFIED</span>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: 13, fontWeight: 500 }}>Complete daily tasks, learning quizzes, and monthly challenges to level up and earn Creator Coins!</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rs-chip-row" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, borderBottom: '1px solid var(--border)', flexWrap: 'nowrap' }}>
        {[
          { key: 'daily', label: 'Daily Activities', Icon: LayoutGrid, emoji: null },
          { key: 'weekly', label: 'Weekly Tasks', Icon: RefreshCw, emoji: null },
          { key: 'monthly', label: 'Monthly Championships', Icon: Trophy, emoji: null },
          { key: 'challenges', label: 'Special Challenges', Icon: null, emoji: '🔥' },
        ].map(({ key: k, label: l, Icon, emoji }) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`chip${filter === k ? ' active' : ''}`}
            style={{
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 10,
              background: filter === k ? 'var(--acc)' : 'var(--s1)',
              color: filter === k ? '#FFFFFF' : 'var(--t2)',
              border: filter === k ? '1px solid var(--acc)' : '1px solid var(--border)',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => { if (filter !== k) e.currentTarget.style.background = 'rgba(255,107,87,0.08)'; }}
            onMouseLeave={e => { if (filter !== k) e.currentTarget.style.background = 'var(--s1)'; }}
          >
            {emoji
              ? <span style={{ fontSize: 14 }}>{emoji}</span>
              : <Icon size={13} />
            }
            {l}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', borderRadius: 20 }}>
          <AlertCircle size={28} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--t2)' }}>No activities active in this category currently. Check back later!</div>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 20 }}>
          {filtered.map(act => (
            <div
              key={act._id}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: act.isChallenge ? '1px solid rgba(108,99,255,0.25)' : '1px solid var(--glass-border)',
                borderRadius: 16,
                padding: 24,
                boxShadow: 'var(--glass-shadow)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.24s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 30px rgba(108,99,255,0.05), var(--glass-shadow)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
              }}
            >
              <div>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <span style={{
                    textTransform: 'uppercase', fontSize: 10, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 99,
                    background: 'rgba(230,95,43,0.1)', color: 'var(--acc)',
                    border: '1px solid rgba(230,95,43,0.2)',
                    letterSpacing: '0.04em'
                  }}>{act.type}</span>
                  {act.status !== 'none' && (
                    <span style={{
                      fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 700,
                      background: act.status === 'approved' ? 'rgba(34,197,94,0.1)' : act.status === 'pending' ? 'rgba(212,162,76,0.15)' : 'rgba(239,68,68,0.1)',
                      color: act.status === 'approved' ? '#16a34a' : act.status === 'pending' ? 'var(--gold)' : '#dc2626',
                      border: act.status === 'approved' ? '1px solid rgba(34,197,94,0.2)' : act.status === 'pending' ? '1px solid rgba(212,162,76,0.3)' : '1px solid rgba(239,68,68,0.2)',
                    }}>
                      {act.status === 'approved' ? '✓ Approved' : act.status === 'pending' ? '⏳ Pending Review' : '✕ Rejected'}
                    </span>
                  )}
                </div>
                <h3
                  onClick={() => setDetailAct(act)}
                  style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: 'var(--t1)', fontFamily: 'var(--fh)', lineHeight: 1.3, cursor: 'pointer' }}
                >
                  {act.title}
                </h3>

                {/* Formatted description with bullet points */}
                <FormattedBulletDescription
                  text={act.description}
                  isCompact={true}
                  onShowMore={() => setDetailAct(act)}
                />

                {act.status !== 'none' && act.submission && (
                  <div style={{
                    marginTop: 12,
                    marginBottom: 16,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(74,62,61,0.04)',
                    border: '1px solid var(--border)',
                    fontSize: 11,
                    fontWeight: 500
                  }}>
                    {act.submission.rating !== undefined && act.status === 'approved' && (
                      <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ⭐ {act.submission.rating}/5 Rating
                      </div>
                    )}
                    {act.submission.adminFeedback && (
                      <div style={{ color: 'var(--t2)', lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 700, color: 'var(--t1)' }}>Feedback: </span>
                        "{act.submission.adminFeedback}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--t1)', background: 'rgba(74,62,61,0.06)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>⚡ {act.xpReward} XP</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', background: 'rgba(212,162,76,0.1)', border: '1px solid rgba(212,162,76,0.22)', padding: '4px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>🪙 {act.coinReward} Coins</div>
                </div>

                {act.status === 'approved' ? (
                  <button disabled style={{ background: 'transparent', border: 'none', color: '#16a34a', fontWeight: 700, fontSize: 12 }}>✓ Completed</button>
                ) : act.status === 'pending' ? (
                  <button disabled style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontWeight: 700, fontSize: 12 }}>⏳ Under Review</button>
                ) : (
                  <Btn variant="primary" size="sm" onClick={() => openSubmitModal(act)} style={{ height: 34, borderRadius: 10, padding: '0 14px', fontSize: 11, fontWeight: 700 }}>
                    {act.status === 'rejected' ? 'Re-Submit' : 'Submit Activity'}
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FULL ACTIVITY DETAIL POPUP MODAL ────────────────── */}
      {detailAct && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16, backdropFilter: 'blur(8px)',
          overflowY: 'auto'
        }} onClick={() => setDetailAct(null)}>
          <div
            className="glass-modal"
            style={{
              width: '100%', maxWidth: 540, animation: 'fadeUp 0.18s ease-out',
              padding: 28, borderRadius: 24, background: 'var(--s1)',
              border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              maxHeight: '90vh', overflowY: 'auto', margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div>
                <span style={{
                  textTransform: 'uppercase', fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 99,
                  background: 'rgba(230,95,43,0.1)', color: 'var(--acc)',
                  border: '1px solid rgba(230,95,43,0.2)', letterSpacing: '0.04em'
                }}>{detailAct.type}</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--fh)', color: 'var(--t1)', marginTop: 8 }}>{detailAct.title}</h3>
              </div>
              <button onClick={() => setDetailAct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 24, padding: 0 }}>×</button>
            </div>

            {/* Rewards Pill */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t1)', background: 'rgba(74,62,61,0.06)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 5 }}>⚡ {detailAct.xpReward} XP</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)', background: 'rgba(212,162,76,0.1)', border: '1px solid rgba(212,162,76,0.22)', padding: '5px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 5 }}>🪙 {detailAct.coinReward} Coins</div>
            </div>

            {/* Formatted Full Description */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Guidelines & Requirements</h4>
              <div style={{ background: 'rgba(74,62,61,0.03)', padding: 18, borderRadius: 16, border: '1px solid var(--border)' }}>
                <FormattedBulletDescription text={detailAct.description} isCompact={false} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn variant="secondary" onClick={() => setDetailAct(null)} style={{ height: 38, borderRadius: 10, padding: '0 18px' }}>Close</Btn>
              {detailAct.status !== 'approved' && detailAct.status !== 'pending' && (
                <Btn variant="primary" onClick={() => { setDetailAct(null); openSubmitModal(detailAct); }} style={{ height: 38, borderRadius: 10, padding: '0 20px', fontWeight: 700 }}>
                  {detailAct.status === 'rejected' ? 'Re-Submit Activity' : 'Submit Activity'}
                </Btn>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Submission Modal */}
      {showModal && selectedAct && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16, backdropFilter: 'blur(6px)',
          overflowY: 'auto'
        }}>
          <div className="glass-modal" style={{ width: '100%', maxWidth: 480, animation: 'fadeUp 0.15s', padding: 24, borderRadius: 20, margin: 'auto', background: 'var(--s1)' }}>
            <div className="flex-between" style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--fh)' }}>Submit {selectedAct.title}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 22, padding: 0 }}>×</button>
            </div>

            <form onSubmit={submitActivity} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, fontWeight: 500 }}>
                {decodeHTML(selectedAct.description)}
              </p>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, display: 'block' }}>Submission URL (e.g. Instagram Reel, Drive Link)</label>
                <input className="form-input" placeholder="https://instagram.com/reel/..." value={url} onChange={e => setUrl(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, display: 'block' }}>Submission Note / Answers</label>
                <textarea className="form-input form-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Explain your work, or answer the prompts here..." style={{ minHeight: 90, width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <Btn variant="secondary" type="button" onClick={() => setShowModal(false)} style={{ height: 34, borderRadius: 8, padding: '0 16px' }}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={submitting} style={{ height: 34, borderRadius: 8, padding: '0 16px' }}>
                  {submitting ? 'Submitting...' : 'Submit Draft'}
                </Btn>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </CreatorShell>
  );
}
