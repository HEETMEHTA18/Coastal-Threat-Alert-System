import React from 'react';

const CTASLogo = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8 text-lg',
    medium: 'w-10 h-10 text-xl',
    large: 'w-12 h-12 text-2xl',
    xl: 'w-16 h-16 text-3xl'
  };

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ${sizeClasses[size]} ${className}`}>
      <span className="text-white font-bold" role="img" aria-label="Wave">🌊</span>
    </div>
  );
};

export default CTASLogo;
