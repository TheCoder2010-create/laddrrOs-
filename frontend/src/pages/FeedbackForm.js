import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft, Send, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';

function AnalysisReport({ analysis }) {
  const [expandedSections, setExpandedSections] = useState({ supervisor: true, swot: true });
  const toggle = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  if (!analysis) return null;

  const ScoreGauge = ({ label, value, max = 10 }) => {
    const pct = (value / max) * 100;
    const color = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
    return (
      <div className="text-center p-4 rounded-md" style={{ background: 'var(--bg)' }}>
        <div className="relative w-16 h-16 mx-auto mb-2">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-heading font-bold text-lg" style={{ color: 'var(--text)' }}>{value}</div>
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
    );
  };

  return (
    <div data-testid="analysis-report" className="space-y-6 animate-fade-in">
      <div className="ai-glow rounded-md p-4" style={{ border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>AI Analysis Complete</h3>
        <div className="grid grid-cols-2 gap-4">
          <ScoreGauge label="Leadership" value={analysis.leadership_score || 0} />
          <ScoreGauge label="Effectiveness" value={analysis.effectiveness_score || 0} />
        </div>
      </div>

      {/* Summaries */}
      <div className="space-y-3">
        <button onClick={() => toggle('supervisor')} className="w-full flex items-center justify-between p-3 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Supervisor Summary</span>
          {expandedSections.supervisor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.supervisor && (
          <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{analysis.supervisor_summary}</p>
            {analysis.employee_summary && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Employee Summary</span>
                <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--text)' }}>{analysis.employee_summary}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SWOT */}
      {analysis.swot_analysis && (
        <div>
          <button onClick={() => toggle('swot')} className="w-full flex items-center justify-between p-3 rounded-md mb-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>SWOT Analysis</span>
            {expandedSections.swot ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.swot && (
            <div className="grid grid-cols-2 gap-3">
              {[['strengths', '#10B981', 'Strengths'], ['weaknesses', '#EF4444', 'Weaknesses'], ['opportunities', '#0EA5E9', 'Opportunities'], ['threats', '#F59E0B', 'Threats']].map(([key, color, label]) => (
                <div key={key} className="p-3 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${color}` }}>
                  <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color }}>{label}</h4>
                  <ul className="space-y-1">{(analysis.swot_analysis[key] || []).map((item, i) => <li key={i} className="text-xs" style={{ color: 'var(--text)' }}>- {item}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strengths Observed */}
      {analysis.strengths_observed?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Strengths Observed</h3>
          <div className="space-y-2">
            {analysis.strengths_observed.map((s, i) => (
              <div key={i} className="p-3 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: '#10B981' }}>{s.action}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {analysis.action_items?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Action Items</h3>
          <div className="space-y-2">
            {analysis.action_items.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: a.priority === 'high' ? '#EF4444' : a.priority === 'medium' ? '#F59E0B' : '#10B981' }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{a.task}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Owner: {a.owner} | Due: {a.due_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Signals */}
      {analysis.missed_signals?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#F59E0B' }}>Missed Signals</h3>
          <div className="space-y-2">
            {analysis.missed_signals.map((m, i) => (
              <div key={i} className="p-3 rounded-md" style={{ background: '#F59E0B08', border: '1px solid #F59E0B30' }}>
                <p className="text-sm font-medium" style={{ color: '#F59E0B' }}>{m.signal}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{m.context}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>Follow-up: {m.suggested_follow_up}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Insight */}
      {analysis.critical_coaching_insight && (
        <div className="p-4 rounded-md" style={{ background: '#EF444410', border: '1px solid #EF444440' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#EF4444' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#EF4444' }}>Critical Coaching Insight</h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{analysis.critical_coaching_insight.summary}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Action: {analysis.critical_coaching_insight.suggested_immediate_action}</p>
        </div>
      )}

      {/* Coaching Recommendations */}
      {analysis.coaching_recommendations?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Coaching Recommendations</h3>
          <div className="space-y-2">
            {analysis.coaching_recommendations.map((r, i) => (
              <div key={i} className="p-3 rounded-md ai-glow" style={{ border: '1px solid var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.title}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
                {r.recommended_resource && (
                  <p className="text-xs mt-2 font-medium" style={{ color: 'var(--accent)' }}>
                    {r.recommended_resource.type}: {r.recommended_resource.title} {r.recommended_resource.author ? `by ${r.recommended_resource.author}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedbackForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [form, setForm] = useState({
    session_id: searchParams.get('session') || '',
    employee_id: searchParams.get('employee') || '',
    employee_name: searchParams.get('name') || '',
    meeting_location: 'office',
    feedback_tone: 3,
    reception_quality: 3,
    growth_trajectory: 'growing',
    stress_signs: [],
    expressed_aspirations: '',
    appreciation_given: false,
    detailed_notes: '',
    transcript: '',
  });

  useEffect(() => { api.getUsers().then(r => setEmployees(r.data.filter(u => u.role === 'employee'))); }, []);

  // Check if session already has analysis
  useEffect(() => {
    if (form.session_id) {
      api.getSession(form.session_id).then(r => { if (r.data.analysis) setAnalysis(r.data.analysis); }).catch(() => {});
    }
  }, [form.session_id]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const submit = async () => {
    if (!form.employee_id) return;
    setSubmitting(true);
    try {
      const r = await api.submitFeedback(form);
      if (r.data.analysis) setAnalysis(r.data.analysis);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const stressList = ['Fatigue', 'Frustration', 'Disengagement', 'Anxiety', 'Overwhelm', 'Conflict'];

  if (analysis) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <button data-testid="back-to-hub" onClick={() => navigate('/one-on-one')} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Hub
      </button>
      <AnalysisReport analysis={analysis} />
    </div>
  );

  return (
    <div data-testid="feedback-form" className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate('/one-on-one')} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Hub
      </button>

      <div>
        <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>1-on-1 Feedback</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Capture meeting feedback for AI analysis</p>
      </div>

      <div className="space-y-5 p-6 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {/* Employee */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Employee</label>
          <select data-testid="feedback-employee" value={form.employee_id} onChange={e => {
            const emp = employees.find(em => em.user_id === e.target.value);
            update('employee_id', e.target.value); update('employee_name', emp?.name || '');
          }} className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Meeting Location</label>
          <div className="flex gap-2">
            {['office', 'remote', 'hybrid'].map(loc => (
              <button key={loc} data-testid={`location-${loc}`} onClick={() => update('meeting_location', loc)}
                className="flex-1 px-3 py-2 rounded-md text-sm font-medium capitalize transition-all"
                style={{ background: form.meeting_location === loc ? 'var(--primary)' : 'var(--bg)', color: form.meeting_location === loc ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Feedback Tone ({form.feedback_tone}/5)</label>
            <input data-testid="feedback-tone" type="range" min="1" max="5" value={form.feedback_tone} onChange={e => update('feedback_tone', +e.target.value)} className="w-full accent-indigo-600" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reception Quality ({form.reception_quality}/5)</label>
            <input data-testid="reception-quality" type="range" min="1" max="5" value={form.reception_quality} onChange={e => update('reception_quality', +e.target.value)} className="w-full accent-indigo-600" />
          </div>
        </div>

        {/* Growth */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Growth Trajectory</label>
          <div className="flex gap-2">
            {['declining', 'stagnant', 'growing', 'excelling'].map(g => (
              <button key={g} data-testid={`growth-${g}`} onClick={() => update('growth_trajectory', g)}
                className="flex-1 px-2 py-2 rounded-md text-xs font-medium capitalize transition-all"
                style={{ background: form.growth_trajectory === g ? 'var(--primary)' : 'var(--bg)', color: form.growth_trajectory === g ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Stress Signs */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Stress Signs</label>
          <div className="flex flex-wrap gap-2">
            {stressList.map(s => (
              <button key={s} data-testid={`stress-${s.toLowerCase()}`} onClick={() => update('stress_signs', form.stress_signs.includes(s) ? form.stress_signs.filter(x => x !== s) : [...form.stress_signs, s])}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{ background: form.stress_signs.includes(s) ? '#F59E0B20' : 'var(--bg)', color: form.stress_signs.includes(s) ? '#F59E0B' : 'var(--text-secondary)', border: `1px solid ${form.stress_signs.includes(s) ? '#F59E0B40' : 'var(--border)'}` }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Appreciation */}
        <div className="flex items-center gap-3">
          <button data-testid="appreciation-toggle" onClick={() => update('appreciation_given', !form.appreciation_given)}
            className="w-10 h-6 rounded-full transition-all relative" style={{ background: form.appreciation_given ? 'var(--primary)' : 'var(--border)' }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: form.appreciation_given ? '18px' : '2px' }} />
          </button>
          <span className="text-sm" style={{ color: 'var(--text)' }}>Appreciation Given</span>
        </div>

        {/* Aspirations */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Expressed Aspirations</label>
          <input data-testid="aspirations-input" type="text" value={form.expressed_aspirations} onChange={e => update('expressed_aspirations', e.target.value)}
            placeholder="Any career goals or aspirations mentioned..."
            className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Detailed Notes</label>
          <textarea data-testid="detailed-notes" value={form.detailed_notes} onChange={e => update('detailed_notes', e.target.value)}
            rows={4} placeholder="Capture key discussion points, observations, and context..."
            className="w-full px-3 py-2 rounded-md text-sm resize-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        </div>

        {/* Transcript */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Meeting Transcript (optional)</label>
          <textarea data-testid="transcript-input" value={form.transcript} onChange={e => update('transcript', e.target.value)}
            rows={3} placeholder="Paste meeting transcript or key quotes..."
            className="w-full px-3 py-2 rounded-md text-sm resize-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        </div>
      </div>

      <button data-testid="submit-feedback" onClick={submit} disabled={submitting || !form.employee_id}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--primary)' }}>
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</> : <><Send className="w-4 h-4" /> Submit & Analyze</>}
      </button>
    </div>
  );
}
