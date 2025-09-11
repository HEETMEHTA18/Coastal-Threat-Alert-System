import React from 'react';
import { Link } from 'react-router-dom';
import CTASLogo from './CTASLogo';

const Navbar = () => (
  <nav className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 backdrop-blur-lg bg-opacity-60 shadow-lg flex items-center justify-between px-6 py-4 rounded-xl animate-gradient-move">
    <div className="flex items-center gap-3">
      <CTASLogo size="medium" />
      <span className="font-bold text-2xl text-white drop-shadow-lg tracking-wide">CTAS</span>
    </div>
    <div className="flex gap-6">
      <Link to="/" className="text-white font-semibold hover:text-cyan-200 transition">Dashboard</Link>
      <Link to="/alerts" className="text-white font-semibold hover:text-cyan-200 transition">Alerts</Link>
      <Link to="/mangrove" className="text-white font-semibold hover:text-cyan-200 transition">Mangrove Watch</Link>
      <Link to="/citizen" className="text-white font-semibold hover:text-cyan-200 transition">Citizen Reports</Link>
      <Link to="/reports" className="text-white font-semibold hover:text-cyan-200 transition">Reports</Link>
      <Link to="/settings" className="text-white font-semibold hover:text-cyan-200 transition">Settings</Link>
    </div>
  </nav>
);

export default Navbar;
