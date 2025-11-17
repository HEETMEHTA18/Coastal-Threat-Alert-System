import React from 'react';

/**
 * Skeleton Loader Components
 * Professional loading placeholders for various UI elements
 */

// Base skeleton component
export const Skeleton = ({ className = '', variant = 'default', animated = true }) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700 rounded";
  const animationClasses = animated ? "animate-pulse" : "";
  
  const variants = {
    default: "h-4 w-full",
    text: "h-4 w-3/4",
    title: "h-6 w-1/2",
    circle: "h-12 w-12 rounded-full",
    rectangular: "h-48 w-full",
    card: "h-64 w-full rounded-lg"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${animationClasses} ${className}`} />
  );
};

// Text line skeleton
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <Skeleton 
        key={i} 
        variant="text"
        className={i === lines - 1 && lines > 1 ? 'w-1/2' : 'w-full'}
      />
    ))}
  </div>
);

// Card skeleton
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circle" className="h-12 w-12" />
      <div className="flex-1">
        <Skeleton variant="title" className="mb-2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

// Weather widget skeleton
export const SkeletonWeather = () => (
  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-xl">
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1">
        <Skeleton className="h-8 w-32 mb-2 bg-white/30" />
        <Skeleton className="h-4 w-24 bg-white/20" />
      </div>
      <Skeleton variant="circle" className="h-16 w-16 bg-white/30" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="text-center">
          <Skeleton className="h-3 w-16 mb-2 mx-auto bg-white/20" />
          <Skeleton className="h-5 w-12 mx-auto bg-white/30" />
        </div>
      ))}
    </div>
  </div>
);

// Map skeleton
export const SkeletonMap = () => (
  <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
    <div className="h-[500px] w-full opacity-30">
      <div className="grid grid-cols-4 gap-1 h-full">
        {[...Array(16)].map((_, i) => (
          <Skeleton key={i} className="h-full" animated={false} />
        ))}
      </div>
    </div>
  </div>
);

// Dashboard grid skeleton
export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton variant="title" className="w-48 h-8" />
      <Skeleton className="w-32 h-10 rounded-lg" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <SkeletonCard key={i} />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonWeather />
      <SkeletonMap />
    </div>
  </div>
);

// Table skeleton
export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// List skeleton
export const SkeletonList = ({ items = 5 }) => (
  <div className="space-y-3">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <Skeleton variant="circle" className="h-10 w-10 flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Chart skeleton
export const SkeletonChart = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <Skeleton variant="title" className="w-40" />
      <Skeleton className="w-24 h-8 rounded" />
    </div>
    <div className="h-64 flex items-end justify-around gap-2">
      {[...Array(7)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="w-full"
          style={{ height: `${30 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  </div>
);

// Shimmer effect wrapper
export const ShimmerWrapper = ({ children, isLoading, fallback }) => {
  if (isLoading) {
    return fallback || <Skeleton className="h-full w-full" />;
  }
  return children;
};

export default Skeleton;
