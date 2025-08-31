import React from 'react';

const AlertBox = ({ message, critical }) => (
  <div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg bg-gradient-to-r from-red-500 via-yellow-400 to-blue-400 text-white font-bold ${critical ? 'animate-pulse border-2 border-red-600' : ''}`}>
    <span className="material-icons">warning</span>
    <span>{message}</span>
  </div>
);

export default AlertBox;
