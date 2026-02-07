import React, { useState, useEffect } from 'react';
import { useRole } from '../App';
import api from '../services/api';
import {
  Users, TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle,
  Target, Sparkles, Video, BookOpen, ChevronRight, ArrowUpRight
} from 'lucide-react';

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-amber-500" />;
};

function ScoreCard({ label, value, trend, max = 100 }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="p-4 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <TrendIcon trend={trend} />
      </div>
      <div className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>{value}</div>
      <div className="mt-2 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function InsightCarousel({ insights }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!insights?.length) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % insights.length), 8000);
    return () => clearInterval(timer);
  }, [insights]);

  if (!insights?.length) return null;
  return (
    <div data-testid="insight-carousel" className="col-span-full">
      <div className="ai-glow rounded-md p-6" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>AI Insight</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          {insights[current]?.insight || insights[current]}
        </p>
        <div className="flex gap-1.5 mt-4">
          {insights.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'w-6' : ''}`}
              style={{ background: i === current ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MeetingCard({ meeting }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-md transition-all hover:opacity-80" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: '#0EA5E920' }}>
        <Video className="w-5 h-5" style={{ color: 'var(--accent)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{meeting.employee_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: meeting.status === 'upcoming' ? '#0EA5E920' : '#10B98120', color: meeting.status === 'upcoming' ? '#0EA5E9' : '#10B981' }}>
        {meeting.status}
      </span>
    </div>
  );
}

function TeamMemberCard({ member }) {
  return (
    <div className="p-4 rounded-md transition-all hover:shadow-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm text-white" style={{ background: 'var(--primary)' }}>
          {member.name?.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{member.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{member.team}</p>
        </div>
      </div>
      {member.scores && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(member.scores).map(([k, v]) => (
            <div key={k} className="text-center p-1.5 rounded" style={{ background: 'var(--bg)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}</div>
              <div className="text-sm font-bold font-heading" style={{ color: v >= 80 ? '#10B981' : v >= 60 ? '#F59E0B' : '#EF4444' }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { role } = useRole();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getDashboard(role).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [role]);

  if (loading) return (
    <div data-testid="dashboard-loading" className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
    </div>
  );

  const roleLabels = { employee: 'Employee', team_lead: 'Team Lead', am: 'Area Manager', manager: 'Manager', hr_head: 'HR Head' };

  return (
    <div data-testid="dashboard" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>
          {roleLabels[role]} Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Welcome back. Here's your overview.
        </p>
      </div>

      {/* Employee Dashboard */}
      {role === 'employee' && data?.employees && (
        <>
          {data.insights?.length > 0 && <InsightCarousel insights={data.insights} />}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.employees[0]?.scores && Object.entries(data.employees[0].scores).map(([k, v]) => (
              <ScoreCard key={k} label={k.replace(/_/g, ' ')} value={v} trend={data.employees[0]?.trends?.[k]} />
            ))}
          </div>
        </>
      )}

      {/* Team Lead Dashboard */}
      {role === 'team_lead' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Team Size</span>
              </div>
              <div className="text-3xl font-heading font-bold" style={{ color: 'var(--text)' }}>{data?.team_members?.length || 0}</div>
            </div>
            <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Upcoming 1-on-1s</span>
              </div>
              <div className="text-3xl font-heading font-bold" style={{ color: 'var(--text)' }}>{data?.upcoming_meetings?.length || 0}</div>
            </div>
            <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Open Cases</span>
              </div>
              <div className="text-3xl font-heading font-bold" style={{ color: 'var(--text)' }}>{data?.pending_cases?.length || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Upcoming Meetings</h3>
              {data?.upcoming_meetings?.map((m, i) => <MeetingCard key={i} meeting={m} />)}
              {!data?.upcoming_meetings?.length && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No upcoming meetings</p>}
            </div>
            <div className="md:col-span-7">
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Team Members</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data?.team_members?.map((m, i) => <TeamMemberCard key={i} member={m} />)}
              </div>
            </div>
          </div>
        </>
      )}

      {/* AM Dashboard */}
      {role === 'am' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Team Leads</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.team_leads?.length || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Escalated Cases</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.pending_cases?.length || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Pending Reviews</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.pending_reviews?.length || 0}</div>
          </div>
        </div>
      )}

      {/* Manager Dashboard */}
      {role === 'manager' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Total Users</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.all_users?.length || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Escalations</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.pending_cases?.length || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>KPI Frameworks</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.frameworks?.length || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Nominations</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.nominations?.length || 0}</div>
          </div>
        </div>
      )}

      {/* HR Head Dashboard */}
      {role === 'hr_head' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Total Employees</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.org_health?.total_employees || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Active Surveys</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.org_health?.active_surveys || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>HR Cases</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.pending_cases?.length || 0}</div>
          </div>
          <div className="p-5 rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>All Surveys</span>
            <div className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--text)' }}>{data?.surveys?.length || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}
