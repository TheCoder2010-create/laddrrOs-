import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Target, Plus, Upload, Loader2, ChevronRight, Settings } from 'lucide-react';

export default function GoalsKPI() {
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    methodology: 'okr', review_frequency: 'quarterly', tracking_level: 'team',
    review_groups: [{ role: 'employee', headcount: 10, kpi_categories: [{ name: 'Project Delivery', weightage: 40, thresholds: { poor: 30, average: 50, good: 70, excellent: 90 } }, { name: 'Goal Completion', weightage: 30, thresholds: { poor: 25, average: 50, good: 75, excellent: 90 } }, { name: 'Communication', weightage: 30, thresholds: { poor: 30, average: 55, good: 75, excellent: 90 } }] }]
  });

  useEffect(() => { api.getFrameworks().then(r => setFrameworks(r.data)).finally(() => setLoading(false)); }, []);

  const totalWeight = form.review_groups[0]?.kpi_categories.reduce((s, k) => s + k.weightage, 0) || 0;

  const addKPI = () => {
    const groups = [...form.review_groups];
    groups[0].kpi_categories.push({ name: '', weightage: 0, thresholds: { poor: 30, average: 50, good: 70, excellent: 90 } });
    setForm({ ...form, review_groups: groups });
  };

  const updateKPI = (idx, field, value) => {
    const groups = [...form.review_groups];
    if (field === 'weightage') value = parseInt(value) || 0;
    groups[0].kpi_categories[idx][field] = value;
    setForm({ ...form, review_groups: groups });
  };

  const removeKPI = (idx) => {
    const groups = [...form.review_groups];
    groups[0].kpi_categories.splice(idx, 1);
    setForm({ ...form, review_groups: groups });
  };

  const saveFramework = () => {
    api.createFramework(form).then(r => { setFrameworks([...frameworks, r.data]); setShowWizard(false); setStep(1); });
  };

  return (
    <div data-testid="goals-kpi" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Goals & KPI Framework</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Configure performance frameworks and KPIs</p>
        </div>
        <button data-testid="new-framework-btn" onClick={() => setShowWizard(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" /> New Framework
        </button>
      </div>

      {/* Existing Frameworks */}
      {loading ? <div className="flex justify-center h-40"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} /></div> : (
        <>
          {frameworks.length === 0 && !showWizard && (
            <div className="text-center py-16 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No frameworks configured yet.</p>
              <button onClick={() => setShowWizard(true)} className="mt-3 px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>Set Up Framework</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.map(fw => (
              <div key={fw.framework_id} className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-medium uppercase" style={{ color: 'var(--text)' }}>{fw.methodology}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: '#10B98120', color: '#10B981' }}>{fw.status}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Review: {fw.review_frequency} | Level: {fw.tracking_level}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Groups: {fw.review_groups?.length || 0}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Wizard */}
      {showWizard && (
        <div className="p-6 rounded-md space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Progress */}
          <div className="flex gap-1">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: s <= step ? 'var(--primary)' : 'var(--border)' }} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-heading font-bold" style={{ color: 'var(--text)' }}>Step 1: Framework Selection</h3>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Methodology</label>
                <div className="grid grid-cols-4 gap-2">
                  {[['bell_curve', 'Bell Curve'], ['9_box', '9-Box Grid'], ['okr', 'OKR'], ['custom', 'Custom']].map(([val, label]) => (
                    <button key={val} data-testid={`method-${val}`} onClick={() => setForm({ ...form, methodology: val })}
                      className="px-3 py-3 rounded-md text-xs font-medium transition-all"
                      style={{ background: form.methodology === val ? 'var(--primary)' : 'var(--bg)', color: form.methodology === val ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Review Frequency</label>
                  <select data-testid="review-frequency" value={form.review_frequency} onChange={e => setForm({ ...form, review_frequency: e.target.value })}
                    className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="semi_annual">Semi-Annual</option><option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tracking Level</label>
                  <select data-testid="tracking-level" value={form.tracking_level} onChange={e => setForm({ ...form, tracking_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    <option value="site">Site</option><option value="department">Department</option><option value="team">Team</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-heading font-bold" style={{ color: 'var(--text)' }}>Step 2: KPI Categories</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: totalWeight === 100 ? '#10B981' : '#EF4444' }}>Total Weight: {totalWeight}% {totalWeight === 100 ? '(Valid)' : '(Must equal 100%)'}</span>
                <button data-testid="add-kpi" onClick={addKPI} className="text-xs font-medium" style={{ color: 'var(--accent)' }}><Plus className="w-3.5 h-3.5 inline" /> Add KPI</button>
              </div>
              <div className="space-y-3">
                {form.review_groups[0]?.kpi_categories.map((kpi, idx) => (
                  <div key={idx} className="p-3 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
                        <input data-testid={`kpi-name-${idx}`} value={kpi.name} onChange={e => updateKPI(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 rounded text-sm" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }} />
                      </div>
                      <div className="w-24">
                        <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Weight %</label>
                        <input data-testid={`kpi-weight-${idx}`} type="number" value={kpi.weightage} onChange={e => updateKPI(idx, 'weightage', e.target.value)}
                          className="w-full px-2 py-1.5 rounded text-sm" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }} />
                      </div>
                      <button onClick={() => removeKPI(idx)} className="text-xs pb-1.5" style={{ color: '#EF4444' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-heading font-bold" style={{ color: 'var(--text)' }}>Step 3: Review & Confirm</h3>
              <div className="p-4 rounded-md" style={{ background: 'var(--bg)' }}>
                <p className="text-sm" style={{ color: 'var(--text)' }}>Methodology: <strong>{form.methodology}</strong></p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>Frequency: <strong>{form.review_frequency}</strong></p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>Level: <strong>{form.tracking_level}</strong></p>
                <div className="mt-3">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>KPIs:</p>
                  {form.review_groups[0]?.kpi_categories.map((k, i) => (
                    <p key={i} className="text-sm" style={{ color: 'var(--text)' }}>{k.name}: {k.weightage}%</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Back</button>}
            <div className="flex-1" />
            <button onClick={() => setShowWizard(false)} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>Cancel</button>
            {step < 3 ? (
              <button data-testid="wizard-next" onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-md text-sm text-white" style={{ background: 'var(--primary)' }}>Next</button>
            ) : (
              <button data-testid="save-framework" onClick={saveFramework} className="px-4 py-2 rounded-md text-sm text-white" style={{ background: '#10B981' }}>Save Framework</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
