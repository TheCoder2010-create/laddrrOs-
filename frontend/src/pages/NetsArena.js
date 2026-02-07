import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, Send, Lightbulb, X, Loader2, Award, ArrowLeft, ChevronRight } from 'lucide-react';

function ScoreGauge({ label, value, max = 10 }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="text-center">
      <div className="relative w-14 h-14 mx-auto mb-1">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-heading font-bold" style={{ color: 'var(--text)' }}>{value}</div>
      </div>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function Scorecard({ scorecard, messages, onBack }) {
  if (!scorecard) return null;
  const scores = scorecard.scores || {};

  return (
    <div data-testid="nets-scorecard" className="space-y-6 animate-fade-in">
      <button data-testid="scorecard-back" onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> New Practice
      </button>
      <div className="flex items-center gap-2">
        <Award className="w-6 h-6" style={{ color: 'var(--primary)' }} />
        <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text)' }}>Practice Scorecard</h2>
      </div>

      <div className="grid grid-cols-4 gap-4 p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <ScoreGauge label="Clarity" value={scores.clarity || 0} />
        <ScoreGauge label="Empathy" value={scores.empathy || 0} />
        <ScoreGauge label="Assertive" value={scores.assertiveness || 0} />
        <ScoreGauge label="Overall" value={scores.overall || 0} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#10B981' }}>Strengths</h4>
          <ul className="space-y-1">{(scorecard.strengths || []).map((s, i) => <li key={i} className="text-sm" style={{ color: 'var(--text)' }}>- {s}</li>)}</ul>
        </div>
        <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#F59E0B' }}>Gaps</h4>
          <ul className="space-y-1">{(scorecard.gaps || []).map((g, i) => <li key={i} className="text-sm" style={{ color: 'var(--text)' }}>- {g}</li>)}</ul>
        </div>
      </div>

      {/* Annotated Conversation */}
      {scorecard.annotated_conversation?.length > 0 && (
        <div className="p-4 rounded-md space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Annotated Conversation</h4>
          {scorecard.annotated_conversation.map((turn, i) => (
            <div key={i} className={`flex flex-col ${turn.speaker === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${turn.speaker === 'user' ? '' : ''}`}
                style={{ background: turn.speaker === 'user' ? 'var(--primary)' : 'var(--bg)', color: turn.speaker === 'user' ? '#fff' : 'var(--text)' }}>
                {turn.message}
              </div>
              {turn.feedback && (
                <div className="mt-1 px-2 py-1 rounded text-xs max-w-[80%]"
                  style={{ background: turn.feedback.type === 'positive' ? '#10B98115' : '#EF444415', color: turn.feedback.type === 'positive' ? '#10B981' : '#EF4444' }}>
                  {turn.feedback.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Key Takeaways */}
      {scorecard.key_takeaways?.length > 0 && (
        <div className="p-4 rounded-md ai-glow" style={{ border: '1px solid var(--border)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>Key Takeaways</h4>
          <ul className="space-y-1">{scorecard.key_takeaways.map((t, i) => <li key={i} className="text-sm" style={{ color: 'var(--text)' }}>- {t}</li>)}</ul>
        </div>
      )}

      {/* Practice Recommendations */}
      {scorecard.practice_recommendations?.length > 0 && (
        <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Practice Recommendations</h4>
          <ul className="space-y-1">{scorecard.practice_recommendations.map((r, i) => <li key={i} className="text-sm" style={{ color: 'var(--text)' }}>- {r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export default function NetsArena() {
  const [phase, setPhase] = useState('setup');
  const [scenario, setScenario] = useState('');
  const [persona, setPersona] = useState('Team Lead');
  const [difficulty, setDifficulty] = useState('neutral');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  const [nudge, setNudge] = useState(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [ending, setEnding] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const getSuggestion = async () => {
    setLoadingSuggest(true);
    try {
      const r = await api.suggestScenario({ user_role: 'team_lead' });
      setScenario(r.data.scenario || '');
      if (r.data.suggested_persona) setPersona(r.data.suggested_persona);
      if (r.data.suggested_difficulty) setDifficulty(r.data.suggested_difficulty);
    } catch (e) { console.error(e); }
    setLoadingSuggest(false);
  };

  const startSession = async () => {
    if (!scenario.trim()) return;
    const r = await api.startNets({ scenario, persona, difficulty });
    setSessionId(r.data.session_id);
    setPhase('chat');
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      const r = await api.netsChat({ session_id: sessionId, message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: r.data.response }]);
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const requestNudge = async () => {
    try {
      const r = await api.getNetsNudge({ session_id: sessionId });
      setNudge(r.data);
      setTimeout(() => setNudge(null), 10000);
    } catch (e) { console.error(e); }
  };

  const endSession = async () => {
    setEnding(true);
    try {
      const r = await api.endNets({ session_id: sessionId });
      setScorecard(r.data);
      setPhase('scorecard');
    } catch (e) { console.error(e); }
    setEnding(false);
  };

  const resetSession = () => {
    setPhase('setup'); setScenario(''); setMessages([]); setSessionId(null); setScorecard(null);
  };

  if (phase === 'scorecard') return (
    <div className="max-w-3xl mx-auto"><Scorecard scorecard={scorecard} messages={messages} onBack={resetSession} /></div>
  );

  if (phase === 'chat') return (
    <div data-testid="nets-chat" className="flex flex-col h-[calc(100vh-120px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-heading font-bold" style={{ color: 'var(--text)' }}>Practice: {persona}</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Difficulty: {difficulty} | Turns: {messages.filter(m => m.role === 'user').length}</p>
        </div>
        <div className="flex gap-2">
          <button data-testid="nudge-btn" onClick={requestNudge} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30' }}>
            <Lightbulb className="w-3.5 h-3.5" /> Nudge
          </button>
          <button data-testid="end-practice-btn" onClick={endSession} disabled={ending || messages.length < 2}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50" style={{ background: '#EF4444' }}>
            {ending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} End Practice
          </button>
        </div>
      </div>

      {/* Nudge Toast */}
      {nudge && (
        <div className="mb-3 p-3 rounded-md animate-fade-in" style={{ background: '#F59E0B15', border: '1px solid #F59E0B30' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: '#F59E0B' }} />
              <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Nudge</span>
            </div>
            <button onClick={() => setNudge(null)}><X className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} /></button>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{nudge.nudge}</p>
          {nudge.specific_suggestion && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>Try: {nudge.specific_suggestion}</p>}
        </div>
      )}

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        <div className="p-3 rounded-md text-xs text-center" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
          Scenario: {scenario}
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-lg text-sm leading-relaxed`}
              style={{ background: m.role === 'user' ? 'var(--primary)' : 'var(--surface)', color: m.role === 'user' ? '#fff' : 'var(--text)', border: m.role === 'user' ? 'none' : '1px solid var(--border)' }}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex gap-1"><div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '0ms' }} /><div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '150ms' }} /><div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '300ms' }} /></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <input data-testid="nets-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your response..." className="flex-1 px-4 py-2.5 rounded-md text-sm" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        <button data-testid="nets-send" onClick={sendMessage} disabled={sending || !input.trim()}
          className="px-4 py-2.5 rounded-md text-white transition-all active:scale-95 disabled:opacity-50" style={{ background: 'var(--primary)' }}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Setup Phase
  return (
    <div data-testid="nets-setup" className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Nets Practice Arena</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Practice difficult conversations with AI personas</p>
      </div>

      <div className="p-6 rounded-md space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Scenario</label>
            <button data-testid="suggest-scenario" onClick={getSuggestion} disabled={loadingSuggest}
              className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
              {loadingSuggest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Suggest
            </button>
          </div>
          <textarea data-testid="scenario-input" value={scenario} onChange={e => setScenario(e.target.value)} rows={3}
            placeholder="Describe the scenario you want to practice..."
            className="w-full px-3 py-2 rounded-md text-sm resize-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Persona</label>
          <div className="grid grid-cols-4 gap-2">
            {['Team Lead', 'Manager', 'Senior Leader', 'Direct Report'].map(p => (
              <button key={p} data-testid={`persona-${p.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setPersona(p)}
                className="px-3 py-2 rounded-md text-xs font-medium transition-all"
                style={{ background: persona === p ? 'var(--primary)' : 'var(--bg)', color: persona === p ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {['friendly', 'neutral', 'challenging', 'strict'].map(d => {
              const colors = { friendly: '#10B981', neutral: '#3B82F6', challenging: '#F59E0B', strict: '#EF4444' };
              return (
                <button key={d} data-testid={`difficulty-${d}`} onClick={() => setDifficulty(d)}
                  className="px-3 py-2 rounded-md text-xs font-medium capitalize transition-all"
                  style={{ background: difficulty === d ? `${colors[d]}20` : 'var(--bg)', color: difficulty === d ? colors[d] : 'var(--text-secondary)', border: `1px solid ${difficulty === d ? `${colors[d]}40` : 'var(--border)'}` }}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button data-testid="start-practice" onClick={startSession} disabled={!scenario.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50" style={{ background: 'var(--primary)' }}>
        <Sparkles className="w-4 h-4" /> Start Practice Session
      </button>
    </div>
  );
}
