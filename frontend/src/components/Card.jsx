import React from 'react';

const Card = ({ title, children, critical }) => (
  <div className={`p-6 rounded-2xl shadow-xl bg-white/30 backdrop-blur-lg border border-white/20 ${critical ? 'animate-pulse border-red-500' : ''} transition-all duration-300`}>
    <h3 className={`text-xl font-bold mb-2 ${critical ? 'text-red-600' : 'text-blue-700'}`}>{title}</h3>
    <div>{children}</div>
  </div>
);

export default Card;
