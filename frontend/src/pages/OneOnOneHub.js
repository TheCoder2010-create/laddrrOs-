import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Video, Plus, Calendar, FileText, Clock, Users, ChevronRight, Loader2, X } from 'lucide-react';

function BriefingModal({ session, onClose }) {
  const [packet, setPacket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('supervisor');

  useEffect(() => {
    api.getBriefingPacket({ session_id: session.session_id, employee_id: session.employee_id })
      .then(r => setPacket(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div data-testid="briefing-modal" className="relative w-full max-w-lg h-full overflow-y-auto animate-slide-in" 
        style={{ background: 'var(--surface)' }} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="font-heading font-bold text-lg" style={{ color: 'var(--text)' }}>Briefing Packet</h3>
          <button data-testid="close-briefing" onClick={onClose} className="p-1 rounded hover:opacity-70"><X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div>
        ) : packet ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              {['supervisor', 'employee', 'actions'].map(t => (
                <button key={t} onClick={() => setTab(t)} data-testid={`briefing-tab-${t}`}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{ background: tab === t ? 'var(--primary)' : 'var(--bg)', color: tab === t ? '#fff' : 'var(--text-secondary)' }}>
                  {t === 'supervisor' ? 'For Supervisor' : t === 'employee' ? 'For Employee' : 'Action Items'}
                </button>
              ))}
            </div>
            {tab === 'supervisor' && packet.for_supervisor && (
              <div className="space-y-3">
                <div><h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Key Discussion Points</h4>
                  <ul className="space-y-1">{(packet.for_supervisor.key_discussion_points || []).map((p, i) => <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text)' }}><span style={{ color: 'var(--accent)' }}>-</span>{p}</li>)}</ul>
                </div>
                <div><h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Suggested Questions</h4>
                  <ul className="space-y-1">{(packet.for_supervisor.suggested_questions || []).map((q, i) => <li key={i} className="text-sm p-2 rounded ai-glow" style={{ color: 'var(--text)' }}>{q}</li>)}</ul>
                </div>
              </div>
            )}
            {tab === 'employee' && packet.for_employee && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--text)' }}>{packet.for_employee.motivational_summary}</p>
                <div><h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Talking Points</h4>
                  <ul className="space-y-1">{(packet.for_employee.suggested_talking_points || []).map((p, i) => <li key={i} className="text-sm" style={{ color: 'var(--text)' }}>- {p}</li>)}</ul>
                </div>
              </div>
            )}
            {tab === 'actions' && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--text)' }}>{packet.last_sessions_summary}</p>
                {packet.action_items_breakdown?.pending?.length > 0 && (
                  <div><h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#F59E0B' }}>Pending</h4>
                    {packet.action_items_breakdown.pending.map((a, i) => <div key={i} className="text-sm p-2 rounded mb-1" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{a.task || a}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : <p className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Failed to load briefing packet.</p>}
      </div>
    </div>
  );
}

function ScheduleModal({ onClose, onCreated }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: '', employee_name: '', date: '', meeting_location: 'office' });

  useEffect(() => { api.getUsers().then(r => setEmployees(r.data.filter(u => u.role === 'employee'))).catch(console.error); }, []);

  const submit = () => {
    if (!form.employee_id || !form.date) return;
    api.createSession(form).then(r => { onCreated(r.data); onClose(); }).catch(console.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div data-testid="schedule-modal" className="relative w-full max-w-md rounded-md p-6 animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Schedule 1-on-1</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-secondary)' }}>Employee</label>
            <select data-testid="schedule-employee" value={form.employee_id} onChange={e => {
              const emp = employees.find(em => em.user_id === e.target.value);
              setForm({ ...form, employee_id: e.target.value, employee_name: emp?.name || '' });
            }} className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-secondary)' }}>Date & Time</label>
            <input data-testid="schedule-date" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-secondary)' }}>Location</label>
            <select data-testid="schedule-location" value={form.meeting_location} onChange={e => setForm({ ...form, meeting_location: e.target.value })}
              className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              <option value="office">Office</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button data-testid="schedule-cancel" onClick={onClose} className="flex-1 px-4 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Cancel</button>
          <button data-testid="schedule-confirm" onClick={submit} className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>Schedule</button>
        </div>
      </div>
    </div>
  );
}

function VideoMeetingModal({ meeting, onClose }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      <div className="flex-1 flex items-center justify-center relative">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-heading font-bold text-white" style={{ background: 'var(--primary)' }}>
            {meeting.employee_name?.charAt(0)}
          </div>
          <p className="text-white text-lg font-heading font-bold">{meeting.employee_name}</p>
          <p className="text-gray-400 text-sm mt-1">Video Meeting (MOCKED - Daily.co key required)</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 p-6 bg-gray-900/80">
        <button data-testid="meeting-mute" onClick={() => setMuted(!muted)} className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${muted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
          {muted ? 'X' : 'M'}
        </button>
        <button data-testid="meeting-video" onClick={() => setVideoOff(!videoOff)} className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${videoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
          V
        </button>
        <button data-testid="meeting-end" onClick={onClose} className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-red-600 hover:bg-red-700 transition-all">
          End
        </button>
      </div>
    </div>
  );
}

export default function OneOnOneHub() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [briefingSession, setBriefingSession] = useState(null);
  const [videoMeeting, setVideoMeeting] = useState(null);

  useEffect(() => {
    api.getSessions().then(r => setSessions(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter(s => s.status === 'upcoming');
  const completed = sessions.filter(s => s.status === 'completed');

  return (
    <div data-testid="one-on-one-hub" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>1-on-1 Hub</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage meetings, feedback, and AI analysis</p>
        </div>
        <div className="flex gap-2">
          <button data-testid="schedule-meeting-btn" onClick={() => setShowSchedule(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-all active:scale-95" style={{ background: 'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Upcoming Meetings ({upcoming.length})</h3>
            {upcoming.map(s => (
              <div key={s.session_id} className="p-4 rounded-md transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-heading font-bold" style={{ background: 'var(--accent)' }}>
                    {s.employee_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.employee_name}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Clock className="w-3 h-3" /> {new Date(s.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button data-testid={`briefing-btn-${s.session_id}`} onClick={() => setBriefingSession(s)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all" style={{ background: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                      <FileText className="w-3.5 h-3.5 inline mr-1" />Briefing
                    </button>
                    <button data-testid={`join-meeting-btn-${s.session_id}`} onClick={() => setVideoMeeting(s)} className="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all active:scale-95" style={{ background: '#10B981' }}>
                      <Video className="w-3.5 h-3.5 inline mr-1" />Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No upcoming meetings scheduled.</p>}
          </div>

          <div className="md:col-span-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Completed Sessions ({completed.length})</h3>
            {completed.map(s => (
              <div key={s.session_id} className="p-4 rounded-md cursor-pointer transition-all hover:shadow-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                onClick={() => navigate(`/one-on-one/feedback?session=${s.session_id}&employee=${s.employee_id}&name=${s.employee_name}`)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-heading font-bold" style={{ background: 'var(--primary)' }}>
                    {s.employee_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.employee_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(s.date).toLocaleDateString()}</p>
                  </div>
                  {s.analysis ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#10B98120', color: '#10B981' }}>Analyzed</span>
                  ) : (
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </div>
              </div>
            ))}
            <button data-testid="new-feedback-btn" onClick={() => navigate('/one-on-one/feedback')} className="w-full p-3 rounded-md text-sm font-medium text-center transition-all" style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px dashed var(--border)' }}>
              + New Feedback Entry
            </button>
          </div>
        </div>
      )}

      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} onCreated={s => setSessions([...sessions, s])} />}
      {briefingSession && <BriefingModal session={briefingSession} onClose={() => setBriefingSession(null)} />}
      {videoMeeting && <VideoMeetingModal meeting={videoMeeting} onClose={() => setVideoMeeting(null)} />}
    </div>
  );
}
