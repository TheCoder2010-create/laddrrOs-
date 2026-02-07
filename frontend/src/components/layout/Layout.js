import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      {/* Mobile toggle */}
      <button
        data-testid="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Menu className="w-5 h-5" style={{ color: 'var(--text)' }} />
      </button>

      <main
        className={`transition-all duration-300 min-h-screen ${
          collapsed ? 'ml-[68px]' : 'ml-[260px]'
        }`}
      >
        <div className="p-6 md:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
