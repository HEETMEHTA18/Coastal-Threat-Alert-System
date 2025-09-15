import React, { useState, useEffect } from 'react';
import CTASLogo from './CTASLogo';

// Candidate filenames in public/ to try in order
const CANDIDATE_LOGOS = [
  '/ctas11.png',
  '/ctas11.jpg',
  '/ctas11.jpeg',
  '/CTAS_11.png',
  '/CTAS_12.png',
  '/logo.svg',
  '/logo.png'
];

const LogoFallback = ({ src, alt = 'CTAS', variant = 'icon', size = 'md', className = '' }) => {
  const [current, setCurrent] = useState(src || null);
  const [tried, setTried] = useState([]);
  const [failedAll, setFailedAll] = useState(false);

  useEffect(() => {
    if (src) {
      setCurrent(src);
      return;
    }

    // pick the first candidate that hasn't been tried
    const next = CANDIDATE_LOGOS.find((c) => !tried.includes(c));
    if (next) setCurrent(next);
    else setFailedAll(true);
  }, [src, tried]);

  if (failedAll) {
    return <CTASLogo variant={variant} size={size} className={className} />;
  }

  const handleError = () => {
    if (current) setTried((t) => Array.from(new Set([...t, current])));
  };

  // Slightly larger defaults for better visibility
  const sizePx = size === 'lg' ? 64 : size === 'md' ? 48 : 36;

  return (
    current ? (
      <img
        src={current}
        alt={alt}
        onError={handleError}
        className={`object-contain rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.25)] ${className}`}
        style={{ width: sizePx, height: sizePx, borderRadius: 12 }}
      />
    ) : (
      // while selecting, show the inline SVG fallback immediately to avoid layout shifting
      <CTASLogo variant={variant} size={size} className={className} />
    )
  );
};

export default LogoFallback;
