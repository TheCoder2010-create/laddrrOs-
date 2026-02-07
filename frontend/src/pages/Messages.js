import React, { useState, useEffect } from 'react';
import { useRole } from '../App';
import api from '../services/api';
import { MessageSquare, Loader2, Send, AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

function CaseCard({ case_item, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [responseText, setResponseText] = useState('');
  const { role } = useRole();
  
  const statusColors = {
    pending_supervisor: '#F59E0B', pending_employee: '#0EA5E9', pending_am: '#8B5CF6',
    pending_manager: '#EF4444', pending_hr: '#EF4444', resolved: '#10B981',
    pending_supervisor_retry: '#F59E0B', pending_final_hr: '#EF4444'
  };
  const color = statusColors[case_item.status] || 'var(--text-secondary)';

  const getActions = () => {
    const actions = [];
    if (case_item.status === 'pending_supervisor' && (role === 'team_lead' || role === 'manager')) {
      actions.push({ key: 'supervisor_respond', label: 'Respond', color: 'var(--primary)' });
    }
    if (case_item.status === 'pending_employee' && role === 'employee') {
      actions.push({ key: 'employee_satisfied', label: 'Satisfied', color: '#10B981' });
      actions.push({ key: 'employee_not_satisfied', label: 'Not Satisfied', color: '#EF4444' });
    }
    if (case_item.status === 'pending_am' && role === 'am') {
      actions.push({ key: 'am_coach_supervisor', label: 'Coach Supervisor', color: 'var(--primary)' });
      actions.push({ key: 'am_address_directly', label: 'Address Directly', color: '#10B981' });
    }
    if (case_item.status === 'pending_hr' && role === 'hr_head') {
      actions.push({ key: 'hr_address', label: 'Address', color: 'var(--primary)' });
      actions.push({ key: 'hr_final', label: 'Final Decision', color: '#EF4444' });
    }
    return actions;
  };

  const actions = getActions();

  return (
    <div className="rounded-md" style={{ background: 'var(--surface)', border: `1px solid ${color}30` }}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4" style={{ color }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{case_item.insight?.summary || 'Critical Insight'}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Level {case_item.current_level} | {case_item.status?.replace(/_/g, ' ')}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>
            {case_item.status === 'resolved' ? 'Resolved' : `L${case_item.current_level}`}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Timeline */}
          {case_item.timeline?.length > 0 && (
            <div className="pt-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Timeline</h4>
              {case_item.timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Clock className="w-3 h-3 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <span style={{ color: 'var(--text)' }}>{t.action}</span>
                    {t.response && <p style={{ color: 'var(--text-secondary)' }}>{t.response}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="space-y-2">
              <textarea data-testid={`case-response-${case_item.case_id}`} value={responseText} onChange={e => setResponseText(e.target.value)}
                rows={2} placeholder="Your response..." className="w-full px-3 py-2 rounded-md text-sm resize-none"
                style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              <div className="flex gap-2">
                {actions.map(a => (
                  <button key={a.key} data-testid={`case-action-${a.key}`}
                    onClick={() => { onAction(case_item.case_id, a.key, responseText); setResponseText(''); }}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: a.color }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Messages() {
  const { role } = useRole();
  const [cases, setCases] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCriticalCases(), api.getMessages(role)])
      .then(([c, m]) => { setCases(c.data); setMessages(m.data); })
      .finally(() => setLoading(false));
  }, [role]);

  const handleCaseAction = async (caseId, action, responseText) => {
    const r = await api.criticalCaseAction(caseId, { action, response_text: responseText });
    setCases(c => c.map(x => x.case_id === caseId ? r.data : x));
  };

  const respondToMessage = async (messageId, text) => {
    const r = await api.respondToMessage(messageId, { action: 'respond', response_text: text });
    setMessages(m => m.map(x => x.message_id === messageId ? r.data : x));
  };

  const openCases = cases.filter(c => c.status !== 'resolved');
  const resolvedCases = cases.filter(c => c.status === 'resolved');
  const pendingMessages = messages.filter(m => m.status === 'pending');

  return (
    <div data-testid="messages-page" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Messages & Cases</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage escalation cases and pulse survey responses</p>
      </div>

      {loading ? <div className="flex justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            {/* Open Cases */}
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Open Cases ({openCases.length})</h3>
            {openCases.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No open cases.</p> :
              openCases.map(c => <CaseCard key={c.case_id} case_item={c} onAction={handleCaseAction} />)}

            {resolvedCases.length > 0 && (
              <>
                <h3 className="text-sm font-semibold uppercase tracking-widest pt-4" style={{ color: 'var(--text-secondary)' }}>Resolved ({resolvedCases.length})</h3>
                {resolvedCases.map(c => <CaseCard key={c.case_id} case_item={c} onAction={handleCaseAction} />)}
              </>
            )}
          </div>

          <div className="md:col-span-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Pulse Survey Questions ({pendingMessages.length})</h3>
            {pendingMessages.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No pending messages.</p> :
              pendingMessages.map(m => (
                <PulseMessageCard key={m.message_id} message={m} onRespond={respondToMessage} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PulseMessageCard({ message, onRespond }) {
  const [text, setText] = useState('');
  return (
    <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>{message.question}</p>
      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>From: Org Health Survey</p>
      {message.status === 'pending' ? (
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Your response..."
            className="flex-1 px-3 py-1.5 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          <button data-testid={`respond-msg-${message.message_id}`} onClick={() => { onRespond(message.message_id, text); setText(''); }}
            className="px-3 py-1.5 rounded-md text-white" style={{ background: 'var(--primary)' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs" style={{ color: '#10B981' }}>
          <CheckCircle className="w-3 h-3" /> Responded
        </div>
      )}
    </div>
  );
}
