import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import OneOnOneHub from './pages/OneOnOneHub';
import FeedbackForm from './pages/FeedbackForm';
import CoachingHub from './pages/CoachingHub';
import NetsArena from './pages/NetsArena';
import GoalsKPI from './pages/GoalsKPI';
import ManagersLab from './pages/ManagersLab';
import OrgHealth from './pages/OrgHealth';
import Messages from './pages/Messages';
import Survey from './pages/Survey';

// ─── Role Context ───
export const RoleContext = createContext();
export const useRole = () => useContext(RoleContext);

// ─── Theme Context ───
export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

function App() {
  const [role, setRole] = useState(() => localStorage.getItem('aos-role') || 'team_lead');
  const [theme, setTheme] = useState(() => localStorage.getItem('aos-theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('aos-role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('aos-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <RoleContext.Provider value={{ role, setRole }}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/one-on-one" element={<OneOnOneHub />} />
              <Route path="/one-on-one/feedback" element={<FeedbackForm />} />
              <Route path="/coaching" element={<CoachingHub />} />
              <Route path="/nets" element={<NetsArena />} />
              <Route path="/goals" element={<GoalsKPI />} />
              <Route path="/managers-lab" element={<ManagersLab />} />
              <Route path="/org-health" element={<OrgHealth />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/survey" element={<Survey />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </RoleContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;
