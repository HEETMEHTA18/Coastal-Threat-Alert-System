import React from 'react';

const CTASLogo = ({ variant = 'icon', size = 'md', inverted = true, className = '' }) => {
  // Size mapping (pixel sizes used for inline SVG viewport)
  const map = {
    sm: { box: 36, icon: 20, text: 'text-sm' },
    md: { box: 52, icon: 28, text: 'text-base' },
    lg: { box: 68, icon: 36, text: 'text-lg' }
  };
  const cfg = typeof size === 'number' ? { box: size, icon: Math.round(size * 0.55), text: 'text-base' } : (map[size] || map.md);

  // Inline SVG ensures crisp rendering at any device pixel ratio without external images.
  const IconSVG = (
    <svg width={cfg.box} height={cfg.box} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ctasGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="ctasInner" x1="0" x2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* outer rounded square with soft gradient */}
      <rect x="2" y="2" width="60" height="60" rx="14" ry="14" fill="url(#ctasGrad)" />

      {/* subtle inner wave (white translucent) */}
      <path d="M8 40c6-8 18-10 28-6s18 6 20 6" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

      {/* lighthouse simplified icon */}
      <g transform="translate(34,12) scale(0.9)">
        <rect x="-2" y="8" width="6" height="16" rx="1" fill="#fff" opacity="0.95" />
        <path d="M-4 8 L8 8 L4 2 L-2 2 Z" fill="#f97373" />
        <rect x="0" y="2" width="2" height="4" fill="#fff" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} style={{ width: cfg.box, height: cfg.box }}>
        {IconSVG}
      </div>
    );
  }

  // lockup: icon + label (CTAS)
  return (
    <div className={`inline-flex items-center ${className}`}>
      <div style={{ width: cfg.box, height: cfg.box }} className="flex items-center justify-center mr-3">
        {IconSVG}
      </div>
      <div className="leading-none">
        <div className={`font-extrabold tracking-tight ${cfg.text}`} style={{ color: 'white' }}>CTAS</div>
        <div className="text-xs text-slate-200">Coastal Monitoring</div>
      </div>
    </div>
  );
};

export default CTASLogo;

