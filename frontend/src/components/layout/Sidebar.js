import React from 'react';
import { useRole, useTheme } from '../../App';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MessageSquare, Target, FlaskConical,
  HeartPulse, ClipboardCheck, Sparkles, Sun, Moon, ChevronDown,
  Video, BookOpen
} from 'lucide-react';

const ROLES = [
  { value: 'employee', label: 'Employee', color: '#10B981' },
  { value: 'team_lead', label: 'Team Lead', color: '#0EA5E9' },
  { value: 'am', label: 'Area Manager', color: '#F59E0B' },
  { value: 'manager', label: 'Manager', color: '#8B5CF6' },
  { value: 'hr_head', label: 'HR Head', color: '#EF4444' },
];

const getNavItems = (role) => {
  const items = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: 'all' },
    { path: '/one-on-one', icon: Video, label: '1-on-1 Hub', roles: ['team_lead', 'am', 'manager'] },
    { path: '/coaching', icon: BookOpen, label: 'Coaching', roles: 'all' },
    { path: '/nets', icon: Sparkles, label: 'Nets Arena', roles: 'all' },
    { path: '/messages', icon: MessageSquare, label: 'Messages', roles: 'all' },
    { path: '/goals', icon: Target, label: 'Goals & KPI', roles: ['manager', 'hr_head'] },
    { path: '/managers-lab', icon: FlaskConical, label: "Manager's Lab", roles: ['manager'] },
    { path: '/org-health', icon: HeartPulse, label: 'Org Health', roles: ['hr_head'] },
    { path: '/survey', icon: ClipboardCheck, label: 'Survey', roles: ['employee', 'team_lead'] },
  ];
  return items.filter(i => i.roles === 'all' || i.roles.includes(role));
};

export default function Sidebar({ collapsed, onToggle }) {
  const { role, setRole } = useRole();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleOpen, setRoleOpen] = React.useState(false);
  const navItems = getNavItems(role);
  const currentRole = ROLES.find(r => r.value === role);

  return (
    <aside
      data-testid="sidebar"
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm text-white" style={{ background: 'var(--primary)' }}>
          L
        </div>
        {!collapsed && (
          <span className="font-heading font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            Laddrr
          </span>
        )}
      </div>

      {/* Role Switcher */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="relative">
            <button
              data-testid="role-switcher"
              onClick={() => setRoleOpen(!roleOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all hover:opacity-80"
              style={{ background: `${currentRole?.color}15`, color: currentRole?.color }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: currentRole?.color }} />
              {currentRole?.label}
              <ChevronDown className="w-4 h-4 ml-auto" />
            </button>
            {roleOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-md shadow-xl z-50 py-1 overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    data-testid={`role-option-${r.value}`}
                    onClick={() => { setRole(r.value); setRoleOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:opacity-80 transition-all"
                    style={{
                      color: r.value === role ? r.color : 'var(--text)',
                      background: r.value === role ? `${r.color}10` : 'transparent'
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              data-testid={`nav-${item.path.replace(/\//g, '-').slice(1) || 'dashboard'}`}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                active
                  ? 'text-white shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          data-testid="theme-toggle"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>
      </div>
    </aside>
  );
}
