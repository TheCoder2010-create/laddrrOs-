import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { HeartPulse, Plus, Loader2, CheckCircle, Send, Sparkles, ChevronRight, X, BarChart3 } from 'lucide-react';

export default function OrgHealth() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [objective, setObjective] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPulse, setGeneratingPulse] = useState(false);

  useEffect(() => { api.getSurveys().then(r => setSurveys(r.data)).finally(() => setLoading(false)); }, []);

  const createSurvey = async () => {
    if (!objective.trim()) return;
    setCreating(true);
    try {
      const r = await api.createSurvey({ objective });
      setSurveys([...surveys, r.data]);
      setShowCreate(false);
      setObjective('');
      setSelectedSurvey(r.data);
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const deploySurvey = (surveyId) => {
    api.deploySurvey(surveyId, {}).then(r => {
      setSurveys(s => s.map(x => x.survey_id === surveyId ? r.data : x));
      if (selectedSurvey?.survey_id === surveyId) setSelectedSurvey(r.data);
    });
  };

  const analyzeSurvey = async (surveyId) => {
    setAnalyzing(true);
    try {
      const r = await api.analyzeSurvey(surveyId);
      const updated = { ...selectedSurvey, analysis: r.data };
      setSelectedSurvey(updated);
      setSurveys(s => s.map(x => x.survey_id === surveyId ? updated : x));
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const genPulse = async (surveyId) => {
    setGeneratingPulse(true);
    try {
      const r = await api.generatePulse(surveyId);
      const updated = { ...selectedSurvey, leadership_pulse: r.data };
      setSelectedSurvey(updated);
      setSurveys(s => s.map(x => x.survey_id === surveyId ? updated : x));
    } catch (e) { console.error(e); }
    setGeneratingPulse(false);
  };

  const sendPulse = async (surveyId) => {
    if (!selectedSurvey?.leadership_pulse) return;
    await api.sendPulse(surveyId, { survey_id: surveyId, questions: selectedSurvey.leadership_pulse });
    alert('Pulse questions sent to leaders!');
  };

  return (
    <div data-testid="org-health" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Org Health & Surveys</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Create and analyze anonymous organizational surveys</p>
        </div>
        <button data-testid="create-survey-btn" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" /> New Survey
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Survey List */}
        <div className="md:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Surveys</h3>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} /> :
            surveys.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No surveys yet.</p> :
            surveys.map(s => (
              <button key={s.survey_id} data-testid={`survey-item-${s.survey_id}`} onClick={() => setSelectedSurvey(s)}
                className="w-full text-left p-3 rounded-md transition-all" style={{ background: selectedSurvey?.survey_id === s.survey_id ? 'var(--primary)' : 'var(--surface)', color: selectedSurvey?.survey_id === s.survey_id ? '#fff' : 'var(--text)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-medium truncate">{s.objective}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.status === 'active' ? '#10B98120' : s.status === 'draft' ? '#F59E0B20' : '#3B82F620', color: s.status === 'active' ? '#10B981' : s.status === 'draft' ? '#F59E0B' : '#3B82F6' }}>{s.status}</span>
                  <span className="text-xs opacity-70">{s.questions?.length || 0} questions</span>
                </div>
              </button>
            ))
          }
        </div>

        {/* Survey Detail */}
        <div className="md:col-span-8">
          {selectedSurvey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-bold" style={{ color: 'var(--text)' }}>Survey Details</h3>
                  <div className="flex gap-2">
                    {selectedSurvey.status === 'draft' && (
                      <button data-testid="deploy-survey" onClick={() => deploySurvey(selectedSurvey.survey_id)} className="px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: '#10B981' }}>Deploy</button>
                    )}
                    {selectedSurvey.status === 'active' && !selectedSurvey.analysis && (
                      <button data-testid="analyze-survey" onClick={() => analyzeSurvey(selectedSurvey.survey_id)} disabled={analyzing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50" style={{ background: 'var(--accent)' }}>
                        {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />} Analyze
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{selectedSurvey.objective}</p>

                {/* Questions */}
                {selectedSurvey.questions?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Questions</h4>
                    {(Array.isArray(selectedSurvey.questions) ? selectedSurvey.questions : []).map((q, i) => (
                      <div key={i} className="p-2 rounded text-sm" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                        {typeof q === 'string' ? q : q.question || JSON.stringify(q)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analysis */}
              {selectedSurvey.analysis && (
                <div className="p-4 rounded-md ai-glow" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--accent)' }}><Sparkles className="w-4 h-4" /> Analysis Results</h4>
                    {!selectedSurvey.leadership_pulse && (
                      <button data-testid="generate-pulse" onClick={() => genPulse(selectedSurvey.survey_id)} disabled={generatingPulse}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50" style={{ background: 'var(--primary)' }}>
                        {generatingPulse ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Generate Pulse
                      </button>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>Sentiment: <strong>{selectedSurvey.analysis.overall_sentiment}</strong> ({selectedSurvey.analysis.sentiment_score}/10)</p>
                  {selectedSurvey.analysis.key_themes?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedSurvey.analysis.key_themes.map((t, i) => (
                        <div key={i} className="text-xs p-1.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                          <strong>{typeof t === 'string' ? t : t.theme}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedSurvey.analysis.areas_of_concern?.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Concerns:</span>
                      {selectedSurvey.analysis.areas_of_concern.map((c, i) => <p key={i} className="text-xs" style={{ color: 'var(--text)' }}>- {c}</p>)}
                    </div>
                  )}
                </div>
              )}

              {/* Leadership Pulse */}
              {selectedSurvey.leadership_pulse && (
                <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Leadership Pulse Questions</h4>
                    <button data-testid="send-pulse" onClick={() => sendPulse(selectedSurvey.survey_id)} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: '#10B981' }}>
                      <Send className="w-3 h-3" /> Send to Leaders
                    </button>
                  </div>
                  {Object.entries(selectedSurvey.leadership_pulse).map(([role, questions]) => (
                    Array.isArray(questions) && questions.length > 0 && (
                      <div key={role} className="mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{role.replace(/_/g, ' ')}</span>
                        {questions.map((q, i) => <p key={i} className="text-sm ml-2 mt-1" style={{ color: 'var(--text)' }}>- {q}</p>)}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select a survey to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div data-testid="create-survey-modal" className="relative w-full max-w-md rounded-md p-6 animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-bold mb-4" style={{ color: 'var(--text)' }}>Create New Survey</h3>
            <textarea data-testid="survey-objective" value={objective} onChange={e => setObjective(e.target.value)} rows={4}
              placeholder="What is the objective of this survey? e.g., 'Understand employee satisfaction with remote work policies'"
              className="w-full px-3 py-2 rounded-md text-sm resize-none" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>AI will generate relevant questions based on your objective.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button data-testid="confirm-create-survey" onClick={createSurvey} disabled={creating || !objective.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm text-white disabled:opacity-50" style={{ background: 'var(--primary)' }}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
