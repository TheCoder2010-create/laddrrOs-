import React, { useState, useEffect } from 'react';
import { useRole } from '../App';
import api from '../services/api';
import { BookOpen, Target, CheckCircle, X, Loader2, Plus, ChevronRight, Sparkles, Calendar, Clock } from 'lucide-react';

function AcceptModal({ goal, onClose, onAccepted }) {
  const [dates, setDates] = useState({ start_date: '', target_end_date: '' });
  const submit = () => {
    api.acceptGoal(goal.goal_id, dates).then(r => { onAccepted(r.data); onClose(); });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div data-testid="accept-goal-modal" className="relative w-full max-w-sm rounded-md p-6 animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-bold mb-4" style={{ color: 'var(--text)' }}>Accept Goal</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{goal.title}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
            <input type="date" value={dates.start_date} onChange={e => setDates({ ...dates, start_date: e.target.value })}
              className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-secondary)' }}>Target End Date</label>
            <input type="date" value={dates.target_end_date} onChange={e => setDates({ ...dates, target_end_date: e.target.value })}
              className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button data-testid="confirm-accept-goal" onClick={submit} className="flex-1 px-4 py-2 rounded-md text-sm text-white" style={{ background: '#10B981' }}>Accept</button>
        </div>
      </div>
    </div>
  );
}

function DeclineModal({ goal, onClose, onDeclined }) {
  const [reason, setReason] = useState('');
  const submit = () => {
    if (!reason.trim()) return;
    api.declineGoal(goal.goal_id, { goal_id: goal.goal_id, reason }).then(r => { onDeclined(r.data); onClose(); });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div data-testid="decline-goal-modal" className="relative w-full max-w-sm rounded-md p-6 animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-bold mb-4" style={{ color: 'var(--text)' }}>Decline Recommendation</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{goal.title}</p>
        <textarea data-testid="decline-reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Why are you declining? (required)"
          className="w-full px-3 py-2 rounded-md text-sm resize-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button data-testid="confirm-decline-goal" onClick={submit} className="flex-1 px-4 py-2 rounded-md text-sm text-white" style={{ background: '#EF4444' }}>Decline</button>
        </div>
      </div>
    </div>
  );
}

function ProgressModal({ goal, onClose, onUpdated }) {
  const [progress, setProgress] = useState(goal.progress || 0);
  const [notes, setNotes] = useState('');
  const submit = () => {
    api.updateGoalProgress(goal.goal_id, { progress, notes }).then(r => { onUpdated(r.data); onClose(); });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div data-testid="progress-modal" className="relative w-full max-w-sm rounded-md p-6 animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-bold mb-4" style={{ color: 'var(--text)' }}>Update Progress</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{goal.title}</p>
        <div className="mb-3">
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Progress: {progress}%</label>
          <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(+e.target.value)} className="w-full accent-indigo-600" />
        </div>
        <textarea data-testid="progress-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Check-in notes..."
          className="w-full px-3 py-2 rounded-md text-sm resize-none mb-4" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        <button data-testid="save-progress" onClick={submit} className="w-full px-4 py-2 rounded-md text-sm text-white" style={{ background: 'var(--primary)' }}>Save Check-in</button>
      </div>
    </div>
  );
}

function CoachingFeedbackModal({ goal, onClose }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getCoachingFeedback({ goal_description: goal.title + ' - ' + goal.description, situation: '', check_ins: goal.check_ins || [] })
      .then(r => setFeedback(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [goal]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div data-testid="coaching-feedback-modal" className="relative w-full max-w-lg rounded-md p-6 max-h-[80vh] overflow-y-auto animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold" style={{ color: 'var(--text)' }}>AI Coaching Feedback</h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div> :
          feedback ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{feedback.feedback}</p>
              {feedback.specific_advice?.length > 0 && (
                <div><h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>Specific Advice</h4>
                  <ul className="space-y-1">{feedback.specific_advice.map((a, i) => <li key={i} className="text-sm" style={{ color: 'var(--text)' }}>- {a}</li>)}</ul>
                </div>
              )}
              {feedback.resource_suggestions?.length > 0 && (
                <div><h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>Resources</h4>
                  <ul className="space-y-1">{feedback.resource_suggestions.map((r, i) => <li key={i} className="text-sm" style={{ color: 'var(--text)' }}>- {r}</li>)}</ul>
                </div>
              )}
            </div>
          ) : <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Could not load feedback.</p>
        }
      </div>
    </div>
  );
}

export default function CoachingHub() {
  const { role } = useRole();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptGoal, setAcceptGoal] = useState(null);
  const [declineGoal, setDeclineGoal] = useState(null);
  const [progressGoal, setProgressGoal] = useState(null);
  const [feedbackGoal, setFeedbackGoal] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '' });

  useEffect(() => {
    api.getGoals().then(r => setGoals(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const refreshGoal = (updated) => setGoals(g => g.map(x => x.goal_id === updated.goal_id ? updated : x));

  const pending = goals.filter(g => g.status === 'pending');
  const active = goals.filter(g => g.status === 'active');
  const amReview = goals.filter(g => g.status === 'pending_am_review');
  const createGoal = () => {
    if (!newGoal.title) return;
    api.createGoal({ ...newGoal, source: 'custom' }).then(r => { setGoals([...goals, r.data]); setShowCreate(false); setNewGoal({ title: '', description: '' }); });
  };

  return (
    <div data-testid="coaching-hub" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Coaching & Development</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage recommendations, goals, and progress</p>
        </div>
        <button data-testid="create-goal-btn" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" /> Custom Goal
        </button>
      </div>

      {loading ? <div className="flex justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div> : (
        <div className="space-y-8">
          {/* Pending Recommendations */}
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>Pending Recommendations ({pending.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pending.map(g => (
                  <div key={g.goal_id} className="p-4 rounded-md ai-glow" style={{ border: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.title}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{g.description}</p>
                        {g.resource && <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>{g.resource.type}: {g.resource.title}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button data-testid={`accept-goal-${g.goal_id}`} onClick={() => setAcceptGoal(g)} className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: '#10B981' }}>Accept</button>
                      <button data-testid={`decline-goal-${g.goal_id}`} onClick={() => setDeclineGoal(g)} className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: 'var(--bg)', color: '#EF4444', border: '1px solid #EF444440' }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AM Review Section */}
          {role === 'am' && amReview.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#F59E0B' }}>Pending Your Review ({amReview.length})</h3>
              <div className="space-y-3">
                {amReview.map(g => (
                  <div key={g.goal_id} className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid #F59E0B40' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Decline reason: {g.decline_reason}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => api.amReviewGoal(g.goal_id, { action: 'approve_decline' }).then(r => refreshGoal(r.data))}
                        className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Approve Decline</button>
                      <button onClick={() => api.amReviewGoal(g.goal_id, { action: 'uphold_ai' }).then(r => refreshGoal(r.data))}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: 'var(--primary)' }}>Uphold AI</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Development Plan */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Active Development Plan ({active.length})</h3>
            {active.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No active goals yet.</p> : (
              <div className="space-y-3">
                {active.map(g => {
                  const pct = g.progress || 0;
                  const color = pct >= 75 ? '#10B981' : pct >= 40 ? '#F59E0B' : 'var(--primary)';
                  return (
                    <div key={g.goal_id} className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" style={{ color }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.title}</p>
                          </div>
                          <p className="text-xs mt-1 ml-6" style={{ color: 'var(--text-secondary)' }}>{g.description}</p>
                          {g.resource && <p className="text-xs mt-1 ml-6" style={{ color: 'var(--accent)' }}>{g.resource.type}: {g.resource.title}</p>}
                          {g.target_end_date && (
                            <p className="text-xs mt-1 ml-6 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                              <Calendar className="w-3 h-3" /> Due: {g.target_end_date}
                            </p>
                          )}
                        </div>
                        <span className="text-lg font-heading font-bold" style={{ color }}>{pct}%</span>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button data-testid={`update-progress-${g.goal_id}`} onClick={() => setProgressGoal(g)} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>Update Progress</button>
                        <button data-testid={`ai-coaching-${g.goal_id}`} onClick={() => setFeedbackGoal(g)} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: 'var(--accent)15', color: 'var(--accent)', border: '1px solid var(--accent)30' }}>
                          <Sparkles className="w-3 h-3 inline mr-1" />AI Coaching
                        </button>
                      </div>
                      {g.check_ins?.length > 0 && (
                        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Recent Check-ins</span>
                          {g.check_ins.slice(-3).reverse().map((c, i) => (
                            <div key={i} className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                              <Clock className="w-3 h-3" /> {c.progress}% - {c.notes || 'No notes'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {acceptGoal && <AcceptModal goal={acceptGoal} onClose={() => setAcceptGoal(null)} onAccepted={refreshGoal} />}
      {declineGoal && <DeclineModal goal={declineGoal} onClose={() => setDeclineGoal(null)} onDeclined={refreshGoal} />}
      {progressGoal && <ProgressModal goal={progressGoal} onClose={() => setProgressGoal(null)} onUpdated={refreshGoal} />}
      {feedbackGoal && <CoachingFeedbackModal goal={feedbackGoal} onClose={() => setFeedbackGoal(null)} />}

      {/* Create Goal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div data-testid="create-goal-modal" className="relative w-full max-w-sm rounded-md p-6 animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-bold mb-4" style={{ color: 'var(--text)' }}>Create Custom Goal</h3>
            <div className="space-y-3">
              <input data-testid="new-goal-title" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="Goal title"
                className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              <textarea data-testid="new-goal-description" value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Goal description" rows={3}
                className="w-full px-3 py-2 rounded-md text-sm resize-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button data-testid="confirm-create-goal" onClick={createGoal} className="flex-1 px-4 py-2 rounded-md text-sm text-white" style={{ background: 'var(--primary)' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
