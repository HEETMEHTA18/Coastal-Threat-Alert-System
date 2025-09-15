import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CTASLogo from './CTASLogo';
import LogoFallback from './LogoFallback';
import { useAuth } from '../store/hooks';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goTo = (pathIfAuthed) => {
    if (isAuthenticated) {
      navigate(pathIfAuthed);
    } else {
      navigate('/login', { state: { from: pathIfAuthed } });
    }
  };

  const goToDashboardTab = (tab) => {
    const path = `/dashboard${tab === 'overview' ? '' : `/${tab}`}`;
    goTo(path);
  };

  return (
  <nav className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 backdrop-blur-lg bg-opacity-60 shadow-lg flex items-center justify-between px-6 py-4 rounded-xl animate-gradient-move">
  <div className="flex items-center gap-3">
  <LogoFallback size="lg" />
      <span className="font-bold text-2xl text-white drop-shadow-lg tracking-wide">CTAS</span>
    </div>
    <div className="flex gap-6 items-center">
      <button onClick={() => goToDashboardTab('overview')} className="text-white font-semibold hover:text-cyan-200 transition">Overview</button>
      <button onClick={() => goToDashboardTab('currents')} className="text-white font-semibold hover:text-cyan-200 transition">Currents</button>
      <button onClick={() => goToDashboardTab('weather')} className="text-white font-semibold hover:text-cyan-200 transition">Weather</button>
      <button onClick={() => goToDashboardTab('satellite')} className="text-white font-semibold hover:text-cyan-200 transition">Satellite</button>
      <button onClick={() => goToDashboardTab('reports')} className="text-white font-semibold hover:text-cyan-200 transition">Reports</button>
      <button onClick={() => goToDashboardTab('analytics')} className="text-white font-semibold hover:text-cyan-200 transition">Analytics</button>
      <span className="opacity-40 text-white">|</span>
      <button onClick={() => goTo('/settings')} className="text-white font-semibold hover:text-cyan-200 transition">Settings</button>
    </div>
  </nav>
  );
};

export default Navbar;
