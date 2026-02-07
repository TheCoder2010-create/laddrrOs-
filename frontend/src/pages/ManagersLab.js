import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FlaskConical, UserPlus, Loader2, Award, BookOpen } from 'lucide-react';

export default function ManagersLab() {
  const [tab, setTab] = useState('interviewer');
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNominate, setShowNominate] = useState(false);
  const [form, setForm] = useState({ nominee_name: '', target_role: '', program_type: 'interviewer' });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    Promise.all([api.getNominations(), api.getUsers()])
      .then(([n, u]) => { setNominations(n.data); setEmployees(u.data.filter(x => x.role === 'employee' || x.role === 'team_lead')); })
      .finally(() => setLoading(false));
  }, []);

  const nominate = () => {
    if (!form.nominee_name) return;
    api.createNomination({ ...form, program_type: tab }).then(r => {
      setNominations([...nominations, r.data]); setShowNominate(false); setForm({ nominee_name: '', target_role: '', program_type: tab });
    });
  };

  const filtered = nominations.filter(n => n.program_type === tab);

  return (
    <div data-testid="managers-lab" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Manager's Lab</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Develop and certify your team members</p>
        </div>
        <button data-testid="nominate-btn" onClick={() => setShowNominate(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
          <UserPlus className="w-4 h-4" /> Nominate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['interviewer', 'Interviewer Lab', FlaskConical], ['leadership', 'Leadership Dev', BookOpen]].map(([key, label, Icon]) => (
          <button key={key} data-testid={`lab-tab-${key}`} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{ background: tab === key ? 'var(--primary)' : 'var(--bg)', color: tab === key ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div> : (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Award className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No nominations yet for {tab === 'interviewer' ? 'Interviewer Lab' : 'Leadership Development'}.</p>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Name', 'Target Role', 'Status', 'Pre-Score', 'Post-Score', 'Progress'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-widest px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(n => (
                    <tr key={n.nomination_id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>{n.nominee_name}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{n.target_role || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: n.status === 'certified' ? '#10B98120' : n.status === 'in_progress' ? '#0EA5E920' : '#F59E0B20',
                            color: n.status === 'certified' ? '#10B981' : n.status === 'in_progress' ? '#0EA5E9' : '#F59E0B' }}>
                          {n.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{n.pre_score ?? '-'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{n.post_score ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="w-20 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${n.progress}%`, background: 'var(--primary)' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Nominate Modal */}
      {showNominate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowNominate(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div data-testid="nominate-modal" className="relative w-full max-w-sm rounded-md p-6 animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-bold mb-4" style={{ color: 'var(--text)' }}>Nominate for {tab === 'interviewer' ? 'Interviewer Lab' : 'Leadership Dev'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase block mb-1" style={{ color: 'var(--text-secondary)' }}>Employee</label>
                <select data-testid="nominate-employee" value={form.nominee_name} onChange={e => setForm({ ...form, nominee_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e.user_id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase block mb-1" style={{ color: 'var(--text-secondary)' }}>Target Role</label>
                <input data-testid="nominate-role" value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })} placeholder="e.g., Senior Engineer"
                  className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowNominate(false)} className="flex-1 px-4 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button data-testid="confirm-nominate" onClick={nominate} className="flex-1 px-4 py-2 rounded-md text-sm text-white" style={{ background: 'var(--primary)' }}>Nominate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
