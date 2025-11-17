import React from 'react';

const EnhancedLoader = ({ message = 'Loading...', type = 'wave' }) => {
  if (type === 'wave') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="loading-wave">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        {message && (
          <p className="text-white/80 text-sm font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (type === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
        </div>
        {message && (
          <p className="text-white/80 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (type === 'ocean') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Animated Ocean Wave */}
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl animate-wave">🌊</span>
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/50 animate-pulse"></div>
        </div>
        
        {/* Gradient Text */}
        {message && (
          <p className="gradient-text text-lg font-bold">
            {message}
          </p>
        )}
        
        {/* Loading Dots */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  // Default shimmer type
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="shimmer h-16 w-64 rounded-lg"></div>
      <div className="shimmer h-4 w-48 rounded-lg"></div>
      <div className="shimmer h-4 w-32 rounded-lg"></div>
    </div>
  );
};

export default EnhancedLoader;
