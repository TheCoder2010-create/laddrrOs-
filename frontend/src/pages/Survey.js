import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ClipboardCheck, Loader2, Send, CheckCircle } from 'lucide-react';

export default function Survey() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getSurveys().then(r => {
      const active = r.data.filter(s => s.status === 'active');
      setSurveys(active);
      if (active.length > 0) setSelectedSurvey(active[0]);
    }).finally(() => setLoading(false));
  }, []);

  const submitSurvey = async () => {
    if (!selectedSurvey) return;
    setSubmitting(true);
    const responseList = Object.entries(responses).map(([idx, answer]) => ({
      question_index: parseInt(idx),
      question: selectedSurvey.questions[parseInt(idx)]?.question || selectedSurvey.questions[parseInt(idx)],
      answer
    }));
    try {
      await api.respondToSurvey(selectedSurvey.survey_id, { survey_id: selectedSurvey.survey_id, responses: responseList });
      setSubmitted(true);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div data-testid="survey-submitted" className="max-w-xl mx-auto text-center py-20 animate-fade-in">
      <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
      <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text)' }}>Thank You!</h2>
      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Your anonymous response has been recorded.</p>
    </div>
  );

  return (
    <div data-testid="survey-page" className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Active Surveys</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your responses are anonymous</p>
      </div>

      {loading ? <div className="flex justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div> :
        !selectedSurvey ? (
          <div className="text-center py-16 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No active surveys at the moment.</p>
          </div>
        ) : (
          <div className="p-6 rounded-md space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-heading font-bold" style={{ color: 'var(--text)' }}>{selectedSurvey.objective}</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>All responses are anonymous and confidential.</p>
            </div>
            <div className="space-y-4">
              {(selectedSurvey.questions || []).map((q, i) => {
                const questionText = typeof q === 'string' ? q : q.question || '';
                const qType = typeof q === 'object' ? q.question_type : 'text';
                return (
                  <div key={i} className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>{i + 1}. {questionText}</label>
                    {qType === 'scale' ? (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} data-testid={`survey-q${i}-scale-${n}`} onClick={() => setResponses({ ...responses, [i]: n })}
                            className="w-10 h-10 rounded-md text-sm font-medium transition-all"
                            style={{ background: responses[i] === n ? 'var(--primary)' : 'var(--bg)', color: responses[i] === n ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea data-testid={`survey-q${i}-text`} value={responses[i] || ''} onChange={e => setResponses({ ...responses, [i]: e.target.value })}
                        rows={2} placeholder="Your anonymous response..."
                        className="w-full px-3 py-2 rounded-md text-sm resize-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
                    )}
                  </div>
                );
              })}
            </div>
            <button data-testid="submit-survey" onClick={submitSurvey} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-medium text-white transition-all disabled:opacity-50" style={{ background: 'var(--primary)' }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Anonymous Response
            </button>
          </div>
        )
      }
    </div>
  );
}
