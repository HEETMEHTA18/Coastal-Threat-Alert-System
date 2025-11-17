import React, { Suspense } from 'react';
import { SkeletonCard, SkeletonWeather, SkeletonMap, SkeletonTable } from './SkeletonLoaders';
import EnhancedLoader from './EnhancedLoader';

/**
 * Lazy-loaded component wrappers with fallback UI
 * Improves initial load time by code splitting
 */

// Lazy load heavy components
export const LazyWeatherWidget = React.lazy(() => 
  import('./WeatherWidget').catch(() => ({
    default: () => <div className="p-4 text-red-500">Failed to load weather widget</div>
  }))
);

export const LazyMapboxSatelliteMap = React.lazy(() => 
  import('./MapboxSatelliteMap').catch(() => ({
    default: () => <div className="p-4 text-red-500">Failed to load map</div>
  }))
);

export const LazyMapboxCoastalMonitor = React.lazy(() => 
  import('./MapboxCoastalMonitor').catch(() => ({
    default: () => <div className="p-4 text-red-500">Failed to load coastal monitor</div>
  }))
);

export const LazyCommunityReports = React.lazy(() => 
  import('./CommunityReports').catch(() => ({
    default: () => <div className="p-4 text-red-500">Failed to load reports</div>
  }))
);

export const LazyAnalyticsPage = React.lazy(() => 
  import('./AnalyticsPage').catch(() => ({
    default: () => <div className="p-4 text-red-500">Failed to load analytics</div>
  }))
);

export const LazyChatbotWidget = React.lazy(() => 
  import('./ChatbotWidget').catch(() => ({
    default: () => <div className="p-4 text-red-500">Failed to load chatbot</div>
  }))
);

/**
 * Wrapper components with appropriate loading states
 */
export const WeatherWidgetWrapper = (props) => (
  <Suspense fallback={<SkeletonWeather />}>
    <LazyWeatherWidget {...props} />
  </Suspense>
);

export const MapWrapper = (props) => (
  <Suspense fallback={<SkeletonMap />}>
    <LazyMapboxSatelliteMap {...props} />
  </Suspense>
);

export const CoastalMonitorWrapper = (props) => (
  <Suspense fallback={<SkeletonMap />}>
    <LazyMapboxCoastalMonitor {...props} />
  </Suspense>
);

export const CommunityReportsWrapper = (props) => (
  <Suspense fallback={<SkeletonTable rows={5} columns={4} />}>
    <LazyCommunityReports {...props} />
  </Suspense>
);

export const AnalyticsWrapper = (props) => (
  <Suspense fallback={<EnhancedLoader type="shimmer" message="Loading analytics..." />}>
    <LazyAnalyticsPage {...props} />
  </Suspense>
);

export const ChatbotWrapper = (props) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-4">
      <div className="animate-pulse">
        <div className="h-8 w-8 bg-blue-200 rounded-full" />
      </div>
    </div>
  }>
    <LazyChatbotWidget {...props} />
  </Suspense>
);

/**
 * Generic lazy loading wrapper
 */
export const LazyComponent = ({ 
  importFunc, 
  fallback = <EnhancedLoader type="wave" />,
  errorFallback = <div className="p-4 text-red-500">Failed to load component</div>
}) => {
  const Component = React.lazy(() => 
    importFunc().catch(() => ({
      default: () => errorFallback
    }))
  );

  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
};

export default {
  WeatherWidget: WeatherWidgetWrapper,
  Map: MapWrapper,
  CoastalMonitor: CoastalMonitorWrapper,
  CommunityReports: CommunityReportsWrapper,
  Analytics: AnalyticsWrapper,
  Chatbot: ChatbotWrapper
};
