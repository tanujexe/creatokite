import { useState, useEffect } from 'react';
import { ecosystemAPI } from '../../api';
import { PageLoader, Btn, Input, Textarea } from '../../components/ui';
import toast from 'react-hot-toast';
import { Award, BookOpen, CheckCircle, GraduationCap, Play, HelpCircle } from 'lucide-react';
import CreatorShell from './CreatorShell';

const CATEGORIES = [
  'Instagram Growth',
  'Content Creation',
  'Reel Editing',
  'Video Editing',
  'Brand Collaboration',
  'Negotiation',
  'Personal Branding',
  'Marketing',
  'Communication',
  'AI Tools'
];

export default function Academy() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [activeLesson, setActiveLesson] = useState(null);
  
  // Quiz / Assignment states
  const [quizAnswers, setQuizAnswers] = useState({});
  const [assignmentText, setAssignmentText] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchLessons = () => {
    setLoading(true);
    ecosystemAPI.getLessons()
      .then(d => {
        setLessons(d.lessons || []);
        // Set first lesson if not set
        const catLessons = (d.lessons || []).filter(l => l.category === selectedCat);
        if (catLessons.length > 0 && !activeLesson) {
          setActiveLesson(catLessons[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLessons();
  }, [selectedCat]);

  const selectCategory = (cat) => {
    setSelectedCat(cat);
    setActiveLesson(null);
    setQuizAnswers({});
    setAssignmentText('');
  };

  const selectLesson = (les) => {
    setActiveLesson(les);
    setQuizAnswers({});
    setAssignmentText('');
  };

  const handleQuizAnswer = (qIdx, optIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitCompletion = async (e) => {
    e.preventDefault();
    if (!activeLesson) return;
    
    let answersArray = [];
    if (activeLesson.type === 'quiz' && activeLesson.quizQuestions?.length) {
      // Validate all answered
      const unanswered = activeLesson.quizQuestions.some((_, i) => quizAnswers[i] === undefined);
      if (unanswered) {
        toast.error('Please answer all questions before submitting.');
        return;
      }
      // Form array
      answersArray = activeLesson.quizQuestions.map((_, i) => quizAnswers[i]);
    }

    if (activeLesson.type === 'assignment' && !assignmentText) {
      toast.error('Please submit your assignment response text.');
      return;
    }

    setCompleting(true);
    try {
      const res = await ecosystemAPI.completeLesson(activeLesson._id, {
        quizAnswers: answersArray,
        assignmentText
      });
      toast.success(res.message || 'Lesson completed!');
      if (res.newCertificate) {
        toast.success(`🎓 Certification Earned: ${res.newCertificate.name}! Check your profile.`, { duration: 6000 });
      }
      fetchLessons();
      // Auto advance or reload
      setActiveLesson(prev => ({ ...prev, isCompleted: true }));
    } catch(err) {
      toast.error(err.response?.data?.message || 'Completion failed. Check answers and try again.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading && lessons.length === 0) return <PageLoader />;

  const catLessons = lessons.filter(l => l.category === selectedCat);
  const completedCount = catLessons.filter(l => l.isCompleted).length;
  const progressPercent = catLessons.length > 0 ? Math.round((completedCount / catLessons.length) * 100) : 0;

  return (
    <CreatorShell className="rs-sidebar-content" style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:24 }}>
      
      {/* Sidebar Categories */}
      <div style={{
        display:'flex',
        flexDirection:'column',
        gap:12,
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 20,
        padding: 20,
        boxShadow: 'var(--glass-shadow)',
        alignSelf: 'start'
      }}>
        <h3 style={{ fontFamily: 'var(--fh)', fontSize:12, fontWeight:800, padding:'0 4px 10px', borderBottom:'1px solid var(--border)', color:'var(--t1)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Learning Paths
        </h3>
        <div className="custom-scroll" style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:'68vh', overflowY:'auto', paddingRight: 4 }}>
          {CATEGORIES.map(cat => {
            const isSel = selectedCat === cat;
            const totalInCat = lessons.filter(l => l.category === cat);
            const compInCat = totalInCat.filter(l => l.isCompleted).length;
            const isFinished = totalInCat.length > 0 && totalInCat.length === compInCat;

            return (
              <button key={cat} onClick={() => selectCategory(cat)}
                style={{
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'start',
                  gap:6,
                  padding:'12px 14px',
                  borderRadius:12,
                  border:'none',
                  cursor:'pointer',
                  background: isSel ? 'var(--s1)' : 'transparent',
                  color: isSel ? 'var(--p)' : 'var(--t2)',
                  borderLeft: isSel ? '4px solid var(--p)' : '4px solid transparent',
                  boxShadow: isSel ? 'var(--shadow-sm)' : 'none',
                  textAlign:'left',
                  transition:'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  width: '100%',
                }}
                onMouseEnter={e => { if(!isSel) e.currentTarget.style.background = 'rgba(255, 107, 87, 0.05)'; }}
                onMouseLeave={e => { if(!isSel) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:8, fontFamily: 'var(--fh)' }}>
                  {isFinished ? <GraduationCap size={15} color="var(--acc2)"/> : <BookOpen size={14}/>}
                  {cat}
                </div>
                <div style={{ fontSize:10, color:'var(--t3)', fontWeight: 600, paddingLeft: 22 }}>
                  {compInCat}/{totalInCat.length} completed
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Study Arena */}
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Course Banner */}
        <div className="card" style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: 'var(--glass-shadow)'
        }}>
          <div>
            <h2 style={{ fontFamily:'var(--fh)', fontSize:20, fontWeight:800, color: 'var(--t1)', marginBottom:4 }}>{selectedCat} Path</h2>
            <p style={{ fontSize:12, color:'var(--t2)', fontWeight: 500 }}>Complete all modules in this path to unlock your official path certificate!</p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--acc2)', fontFamily: 'var(--fd)' }}>{progressPercent}% Complete</div>
            <div style={{ width:140, height:6, background:'rgba(255,255,255,0.06)', borderRadius:100, overflow:'hidden', marginTop:6 }}>
              <div style={{ height:'100%', width:`${progressPercent}%`, background:'var(--grad-p)', borderRadius:100, boxShadow: '0 0 8px var(--p)' }}/>
            </div>
          </div>
        </div>

        <div className="rs-sidebar-content" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20, alignItems:'start' }}>
          {/* Lessons List in Category */}
          <div className="card" style={{
            padding:'18px 16px',
            display:'flex',
            flexDirection:'column',
            gap:10,
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            boxShadow: 'var(--glass-shadow)'
          }}>
            <h4 style={{ fontSize:11, fontWeight:800, color:'var(--t3)', padding:'0 4px 8px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Modules</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {catLessons.map((les, idx) => {
                const isActive = activeLesson?._id === les._id;
                return (
                  <div key={les._id} onClick={() => selectLesson(les)}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      gap:10,
                      padding:'10px 12px',
                      borderRadius:10,
                      cursor:'pointer',
                      background: isActive ? 'var(--s1)' : 'transparent',
                      border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.22s ease',
                    }}
                    onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'rgba(255, 107, 87, 0.04)'; }}
                    onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {les.isCompleted ? (
                      <CheckCircle size={14} color="var(--acc2)" style={{ flexShrink:0 }} />
                    ) : (
                      <HelpCircle size={14} color="var(--t3)" style={{ flexShrink:0 }} />
                    )}
                    <span style={{ fontSize:12, color:isActive ? 'var(--t1)' : 'var(--t2)', fontWeight: isActive?700:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily: 'var(--fh)' }}>
                      {idx+1}. {les.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Lesson Reader */}
          {activeLesson ? (
            <div className="card" style={{
              display:'flex',
              flexDirection:'column',
              gap:24,
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              borderRadius: 20,
              padding: 28,
              boxShadow: 'var(--glass-shadow)'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:10, flexWrap: 'wrap', gap: 10 }}>
                  <span className="badge badge-purple" style={{ textTransform:'uppercase', fontSize:9, fontWeight: 700, padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--fh)' }}>{activeLesson.type}</span>
                  <div style={{ fontSize:11, color:'var(--t2)', fontWeight: 600, fontFamily: 'var(--fd)' }}>Reward: <span style={{ color: 'var(--p)' }}>+{activeLesson.xpReward} XP</span> / <span style={{ color: 'var(--gold)' }}>+{activeLesson.coinReward} Coins</span></div>
                </div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'var(--t1)', fontFamily: 'var(--fh)', letterSpacing: '-0.01em' }}>{activeLesson.title}</h3>
              </div>

              {/* Content */}
              <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.75, background:'var(--s2)', padding:20, borderRadius:16, border:'1px solid var(--border)', fontWeight: 500 }}>
                {activeLesson.content}
              </div>

              {/* Task Quiz / Assignment submission */}
              {activeLesson.isCompleted ? (
                <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--acc2)', fontSize:13, fontWeight:700, padding:'14px 18px', borderRadius:12, background:'rgba(249,182,55,0.06)', border: '1px solid rgba(249,182,55,0.18)' }}>
                  <CheckCircle size={18}/> Lesson Completed! Reward XP & Coins have been successfully added to your account.
                </div>
              ) : (
                <form onSubmit={submitCompletion} style={{ borderTop:'1px solid var(--border)', paddingTop:24, display:'flex', flexDirection:'column', gap:24 }}>
                  {activeLesson.type === 'quiz' && activeLesson.quizQuestions?.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
                      {activeLesson.quizQuestions.map((q, qIdx) => (
                        <div key={qIdx} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                          <div style={{ fontSize:14, fontWeight:700, fontFamily: 'var(--fh)', color: 'var(--t1)' }}>Q{qIdx+1}. {q.question}</div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10 }}>
                            {q.options.map((opt, optIdx) => {
                              const isChecked = quizAnswers[qIdx] === optIdx;
                              return (
                                <label key={optIdx}
                                  style={{
                                    display:'flex',
                                    alignItems:'center',
                                    gap:12,
                                    padding:'14px 16px',
                                    borderRadius:12,
                                    border:'1px solid var(--border)',
                                    cursor:'pointer',
                                    background: isChecked ? 'rgba(255,107,87,0.04)' : 'var(--s1)',
                                    borderColor: isChecked ? 'var(--p2)' : 'var(--border)',
                                    boxShadow: isChecked ? '0 4px 12px rgba(255,107,87,0.05)' : 'none',
                                    transition: 'all 0.22s ease',
                                    fontWeight: isChecked ? 600 : 500,
                                    color: isChecked ? 'var(--t1)' : 'var(--t2)'
                                  }}
                                  onMouseEnter={e => { if(!isChecked) e.currentTarget.style.background = 'rgba(255, 107, 87, 0.03)'; }}
                                  onMouseLeave={e => { if(!isChecked) e.currentTarget.style.background = 'var(--s1)'; }}
                                >
                                  <input type="radio" name={`q_${qIdx}`} checked={isChecked}
                                    onChange={() => handleQuizAnswer(qIdx, optIdx)}
                                    style={{ display:'none' }} />
                                  <div style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    border: isChecked ? '5px solid var(--p)' : '2px solid var(--t3)',
                                    background: isChecked ? '#fff' : 'transparent',
                                    flexShrink: 0,
                                    transition: 'all 0.2s'
                                  }} />
                                  <span style={{ fontSize:12.5 }}>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeLesson.type === 'article' && activeLesson.assignmentPrompt && (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      <label className="form-label" style={{ fontWeight:800, fontSize: 13, fontFamily: 'var(--fh)' }}>📝 Practical Assignment Prompt</label>
                      <p style={{ fontSize:12, color:'var(--t2)', marginBottom:8, fontWeight: 500 }}>{activeLesson.assignmentPrompt}</p>
                      <textarea value={assignmentText} onChange={e => setAssignmentText(e.target.value)}
                        placeholder="Write your assignment essay response here (min 50 words)..."
                        style={{ minHeight:120, width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--s1)', color: 'var(--t1)' }} />
                    </div>
                  )}

                  <Btn variant="primary" type="submit" disabled={completing} style={{ alignSelf:'flex-end', height: 40, borderRadius: 10, padding: '0 24px', fontWeight: 700 }}>
                    {completing ? 'Completing Path...' : 'Submit Answers'}
                  </Btn>
                </form>
              )}
            </div>
          ) : (
            <div className="card" style={{
              padding: 48,
              textAlign: 'center',
              color: 'var(--t3)',
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              borderRadius: 20,
              boxShadow: 'var(--glass-shadow)',
              fontWeight: 600,
              fontSize: 13
            }}>
              Select a module from the list to start studying!
            </div>
          )}
        </div>
      </div>
    </CreatorShell>
  );
}
