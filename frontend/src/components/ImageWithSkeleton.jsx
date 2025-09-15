import React from 'react';

const ImageWithSkeleton = ({ item, alt, width = 210, height = 118, className = '' }) => {
  // If `item` is provided, render the image; otherwise render a Tailwind-based skeleton box
  return item ? (
    <img
      loading="lazy"
      style={{ width, height, objectFit: 'cover' }}
      alt={alt || item.title}
      src={item.src}
      className={`rounded-lg shadow-md ${className}`}
    />
  ) : (
    <div
      role="img"
      aria-label="image placeholder"
      className={`rounded-lg bg-slate-700/40 animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
};

export default ImageWithSkeleton;
