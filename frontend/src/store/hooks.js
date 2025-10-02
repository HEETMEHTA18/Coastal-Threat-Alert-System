// Redux hooks for typed usage and convenience
import { useDispatch, useSelector } from 'react-redux';

// Typed hooks for better development experience
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Auth hooks
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    token: auth.token,
    dispatch,
  };
};

// NOAA data hooks
export const useNoaaData = () => {
  const noaa = useAppSelector((state) => state.noaa);
  const dispatch = useAppDispatch();
  
  return {
    capeHenryData: noaa.capeHenryData,
    currentData: noaa.currentData,
    currentsData: noaa.currentsData,
    threatAssessment: noaa.threatAssessment,
    serviceStatus: noaa.serviceStatus,
    connectionStatus: noaa.connectionStatus,
    isLoading: noaa.isLoading,
    error: noaa.error,
    dataFreshness: noaa.dataFreshness,
    lastUpdated: {
      capeHenry: noaa.capeHenryLastUpdated,
      currents: noaa.currentLastUpdated,
      threats: noaa.threatLastUpdated,
    },
    dispatch,
  };
};

// Alerts hooks
export const useAlerts = () => {
  const alerts = useAppSelector((state) => state.alerts);
  const dispatch = useAppDispatch();
  
  return {
    alerts: alerts.alerts,
    unreadCount: alerts.unreadCount,
    isLoading: alerts.isLoading,
    error: alerts.error,
    filters: alerts.filters,
    notifications: alerts.notifications,
    autoAlerts: alerts.autoAlerts,
    lastFetch: alerts.lastFetch,
    dispatch,
  };
};

// UI hooks
export const useUI = () => {
  const ui = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();
  
  return {
    currentView: ui.currentView,
    previousView: ui.previousView,
    dashboard: ui.dashboard,
    modals: ui.modals,
    loading: ui.loading,
    theme: ui.theme,
    notifications: ui.notifications,
    map: ui.map,
    dataDisplay: ui.dataDisplay,
    performance: ui.performance,
    connection: ui.connection,
    tour: ui.tour,
    errors: ui.errors,
    search: ui.search,
    dispatch,
  };
};

// Combined hooks for specific use cases
export const useDashboard = () => {
  const { dashboard, currentView, loading } = useUI();
  const { isAuthenticated } = useAuth();
  const { connectionStatus } = useNoaaData();
  const { unreadCount } = useAlerts();
  
  return {
    isOnDashboard: currentView === 'dashboard',
    isAuthenticated,
    sidebarCollapsed: dashboard.sidebarCollapsed,
    activeTab: dashboard.activeTab,
    gridLayout: dashboard.gridLayout,
    refreshInterval: dashboard.refreshInterval,
    autoRefresh: dashboard.autoRefresh,
    isLoading: loading.dashboard,
    connectionStatus,
    unreadAlerts: unreadCount,
  };
};

export const useTheme = () => {
  const { theme, dispatch } = useUI();
  
  return {
    mode: theme.mode,
    accentColor: theme.accentColor,
    fontSize: theme.fontSize,
    animations: theme.animations,
    soundEffects: theme.soundEffects,
    dispatch,
  };
};

export const useNotifications = () => {
  const { notifications: uiNotifications, dispatch: uiDispatch } = useUI();
  const { notifications: alertNotifications, dispatch: alertDispatch } = useAlerts();
  
  return {
    ui: uiNotifications,
    alerts: alertNotifications,
    uiDispatch,
    alertDispatch,
  };
};

export const useCurrentData = () => {
  const { currentsData, isLoading, error, dataFreshness } = useNoaaData();
  // Get data for the cb0201 station (Chesapeake Bay Bridge Tunnel)
  const stationData = currentsData?.['cb0201'] || {};
  
  // Extract latest observation from the observations array
  const observations = stationData.observations || [];
  const latestObservation = observations.length > 0 ? observations[observations.length - 1] : null;

  // Compute freshness (minutes) from latest observation timestamp if available
  let freshnessMinutes = null;
  try {
    if (latestObservation && (latestObservation.timestamp || latestObservation.time)) {
      const ts = new Date(latestObservation.timestamp || latestObservation.time);
      if (!Number.isNaN(ts.getTime())) {
        freshnessMinutes = Math.round((Date.now() - ts.getTime()) / 60000);
      }
    }
  } catch (err) {
    freshnessMinutes = null;
  }

  return {
    data: stationData,
    isLoading: isLoading,
    error: error,
    freshness: typeof freshnessMinutes === 'number' ? freshnessMinutes : null,
    hasData: !!stationData && Object.keys(stationData).length > 0,
    latest: latestObservation,
    history: observations,
    station: stationData.station_info ?? null,
    // Add any other fields with safe defaults
    dataOutage: stationData.dataOutage ?? null,
  };
};

export const useThreatAssessment = () => {
  const { threatAssessment, isLoading, errors, dataFreshness } = useNoaaData();
  
  return {
    assessment: threatAssessment,
    isLoading: isLoading.threats,
    error: errors.threats,
    freshness: dataFreshness.threats,
    hasAssessment: !!threatAssessment,
    overallThreat: threatAssessment?.overall,
    ripCurrentRisk: threatAssessment?.ripCurrentRisk,
    navigationRisk: threatAssessment?.navigationRisk,
    details: threatAssessment?.details,
  };
};

export const useConnectionStatus = () => {
  const { connectionStatus, isLoading } = useNoaaData();
  const { online, syncStatus } = useUI().connection;
  
  return {
    noaaConnection: connectionStatus,
    isTestingConnection: isLoading.connection,
    isOnline: online,
    syncStatus,
    isConnected: online && connectionStatus === 'connected',
  };
};

// Selector hooks for filtered data
export const useFilteredAlerts = (filters = {}) => {
  return useAppSelector((state) => {
    let filteredAlerts = state.alerts.alerts;
    
    // Apply severity filter
    if (filters.severity && filters.severity !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
    }
    
    // Apply type filter
    if (filters.type && filters.type !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
    }
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'unread') {
        filteredAlerts = filteredAlerts.filter(alert => !alert.read);
      } else if (filters.status === 'read') {
        filteredAlerts = filteredAlerts.filter(alert => alert.read);
      }
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      const ranges = {
        '1h': 1 * 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      
      const cutoff = new Date(now.getTime() - ranges[filters.dateRange]);
      filteredAlerts = filteredAlerts.filter(
        alert => new Date(alert.timestamp) >= cutoff
      );
    }
    
    return filteredAlerts;
  });
};

export const useRecentCurrentData = (hours = 24) => {
  return useAppSelector((state) => {
    const currentData = state.noaa.currentData;
    if (!currentData?.history) return [];
    
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return currentData.history.filter(
      record => new Date(record.timestamp) >= cutoff
    );
  });
};
