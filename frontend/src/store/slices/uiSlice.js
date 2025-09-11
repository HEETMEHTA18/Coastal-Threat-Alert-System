// UI slice for managing interface state and user preferences
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Current view management
  currentView: 'landing', // 'landing', 'auth', 'dashboard'
  previousView: null,
  // Connection status
  online: true,
  syncStatus: 'idle', // 'idle', 'syncing', 'error'
  
  // Dashboard layout
  dashboard: {
    sidebarCollapsed: false,

    activeTab: 'satellite', // 'overview', 'currents', 'weather', 'reports', 'satellite'

    gridLayout: 'default', // 'default', 'compact', 'expanded'
    refreshInterval: 300000, // 5 minutes in milliseconds
    autoRefresh: true,
  },
  
  // Modal states
  modals: {
    alertDetail: { open: false, alertId: null },
    reportCreation: { open: false, type: null },
    settings: { open: false, tab: 'general' },
    noaaDataDetail: { open: false, dataType: null },
    threatAssessment: { open: false, stationId: null },
  },
  
  // Loading states for different UI components
  loading: {
    app: true,
    dashboard: false,
    weatherWidget: false,
    currentWidget: false,
    mapWidget: false,
  },
  
  // Theme and display preferences
  theme: {
    mode: 'dark', // 'light', 'dark', 'auto'
    accentColor: 'blue', // 'blue', 'cyan', 'green', 'orange', 'red'
    fontSize: 'medium', // 'small', 'medium', 'large'
    animations: true,
    soundEffects: true,
  },
  
  // Notification preferences
  notifications: {
    position: 'top-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    duration: 5000, // milliseconds
    showTimestamp: true,
    maxVisible: 3,
  },
  
  // Map preferences
  map: {
    zoom: 10,
    center: { lat: 36.9594, lng: -76.0128 }, // Cape Henry
    style: 'satellite', // 'satellite', 'terrain', 'roadmap'
    showCurrents: true,
    showWeatherStations: true,
    showThreatZones: true,
    animateMarkers: true,
  },
  
  // Data display preferences
  dataDisplay: {
    units: 'metric', // 'metric', 'imperial'
    timezone: 'local', // 'local', 'utc'
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '24h', // '12h', '24h'
    decimalPlaces: 2,
  },
  
  // Performance settings
  performance: {
    enableAnimations: true,
    enableCharts: true,
    maxDataPoints: 100,
    compressionLevel: 'medium', // 'low', 'medium', 'high'
  },
  
  // Connection status
  connection: {
    online: true,
    lastSync: null,
    syncStatus: 'idle', // 'idle', 'syncing', 'error'
  },
  
  // Tour and help
  tour: {
    completed: false,
    currentStep: 0,
    skipped: false,
  },
  
  // Error tracking
  errors: {
    global: null,
    network: null,
    api: null,
  },
  
  // Search and filters
  search: {
    query: '',
    filters: {
      dateRange: '24h', // '1h', '6h', '24h', '7d', '30d'
      dataTypes: ['all'], // 'all', 'currents', 'weather', 'threats'
      severity: ['all'], // 'all', 'low', 'medium', 'high', 'critical'
    },
    results: [],
    isSearching: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // View management
    setCurrentView: (state, action) => {
      state.previousView = state.currentView;
      state.currentView = action.payload;
    },
    
    goToPreviousView: (state) => {
      if (state.previousView) {
        const temp = state.currentView;
        state.currentView = state.previousView;
        state.previousView = temp;
      }
    },
    
    // Dashboard layout
    toggleSidebar: (state) => {
      state.dashboard.sidebarCollapsed = !state.dashboard.sidebarCollapsed;
    },
    
    setActiveTab: (state, action) => {
      state.dashboard.activeTab = action.payload;
    },
    
    setGridLayout: (state, action) => {
      state.dashboard.gridLayout = action.payload;
    },
    
    setRefreshInterval: (state, action) => {
      state.dashboard.refreshInterval = action.payload;
    },
    
    toggleAutoRefresh: (state) => {
      state.dashboard.autoRefresh = !state.dashboard.autoRefresh;
    },
    
    // Modal management
    openModal: (state, action) => {
      const { modalName, data = {} } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = { open: true, ...data };
      }
    },
    
    closeModal: (state, action) => {
      const { modalName } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = { open: false };
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName] = { open: false };
      });
    },
    
    // Loading states
    setLoading: (state, action) => {
      const { component, isLoading } = action.payload;
      if (state.loading.hasOwnProperty(component)) {
        state.loading[component] = isLoading;
      }
    },
    
    setAppLoading: (state, action) => {
      state.loading.app = action.payload;
    },
    
    // Theme management
    setThemeMode: (state, action) => {
      state.theme.mode = action.payload;
    },
    
    setAccentColor: (state, action) => {
      state.theme.accentColor = action.payload;
    },
    
    setFontSize: (state, action) => {
      state.theme.fontSize = action.payload;
    },
    
    toggleAnimations: (state) => {
      state.theme.animations = !state.theme.animations;
    },
    
    toggleSoundEffects: (state) => {
      state.theme.soundEffects = !state.theme.soundEffects;
    },
    
    // Notification preferences
    setNotificationPosition: (state, action) => {
      state.notifications.position = action.payload;
    },
    
    setNotificationDuration: (state, action) => {
      state.notifications.duration = action.payload;
    },
    
    // Map preferences
    setMapZoom: (state, action) => {
      state.map.zoom = action.payload;
    },
    
    setMapCenter: (state, action) => {
      state.map.center = action.payload;
    },
    
    setMapStyle: (state, action) => {
      state.map.style = action.payload;
    },
    
    toggleMapLayer: (state, action) => {
      const { layer } = action.payload;
      if (state.map.hasOwnProperty(layer)) {
        state.map[layer] = !state.map[layer];
      }
    },
    
    // Data display preferences
    setUnits: (state, action) => {
      state.dataDisplay.units = action.payload;
    },
    
    setTimezone: (state, action) => {
      state.dataDisplay.timezone = action.payload;
    },
    
    setDateFormat: (state, action) => {
      state.dataDisplay.dateFormat = action.payload;
    },
    
    setTimeFormat: (state, action) => {
      state.dataDisplay.timeFormat = action.payload;
    },
    
    setOnlineStatus: (state, action) => {
      state.online = action.payload;
    },
    
    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
    },
    
    // Connection status
    setOnlineStatus: (state, action) => {
      state.connection.online = action.payload;
    },
    
    setSyncStatus: (state, action) => {
      state.connection.syncStatus = action.payload;
      if (action.payload === 'syncing') {
        state.connection.lastSync = new Date().toISOString();
      }
    },
    
    // Tour management
    setTourStep: (state, action) => {
      state.tour.currentStep = action.payload;
    },
    
    completeTour: (state) => {
      state.tour.completed = true;
      state.tour.currentStep = 0;
    },
    
    skipTour: (state) => {
      state.tour.skipped = true;
      state.tour.completed = true;
    },
    
    resetTour: (state) => {
      state.tour.completed = false;
      state.tour.currentStep = 0;
      state.tour.skipped = false;
    },
    
    // Error management
    setGlobalError: (state, action) => {
      state.errors.global = action.payload;
    },
    
    setNetworkError: (state, action) => {
      state.errors.network = action.payload;
    },
    
    setApiError: (state, action) => {
      state.errors.api = action.payload;
    },
    
    clearErrors: (state) => {
      state.errors.global = null;
      state.errors.network = null;
      state.errors.api = null;
    },
    
    // Search and filters
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    
    setSearchFilter: (state, action) => {
      const { filterType, value } = action.payload;
      if (state.search.filters.hasOwnProperty(filterType)) {
        state.search.filters[filterType] = value;
      }
    },
    
    setSearchResults: (state, action) => {
      state.search.results = action.payload;
    },
    
    setSearching: (state, action) => {
      state.search.isSearching = action.payload;
    },
    
    clearSearch: (state) => {
      state.search.query = '';
      state.search.results = [];
      state.search.isSearching = false;
    },
    
    // Bulk preferences update
    updatePreferences: (state, action) => {
      const { section, preferences } = action.payload;
      if (state[section]) {
        state[section] = { ...state[section], ...preferences };
      }
    },
    
    // Reset to defaults
    resetToDefaults: (state) => {
      return { ...initialState, currentView: state.currentView };
    },
  },
});

export const {
  setCurrentView,
  goToPreviousView,
  toggleSidebar,
  setActiveTab,
  setGridLayout,
  setRefreshInterval,
  toggleAutoRefresh,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setAppLoading,
  setThemeMode,
  setAccentColor,
  setFontSize,
  toggleAnimations,
  toggleSoundEffects,
  setNotificationPosition,
  setNotificationDuration,
  setMapZoom,
  setMapCenter,
  setMapStyle,
  toggleMapLayer,
  setUnits,
  setTimezone,
  setDateFormat,
  setTimeFormat,
  setOnlineStatus,
  setSyncStatus,
  setTourStep,
  completeTour,
  skipTour,
  resetTour,
  setGlobalError,
  setNetworkError,
  setApiError,
  clearErrors,
  setSearchQuery,
  setSearchFilter,
  setSearchResults,
  setSearching,
  clearSearch,
  updatePreferences,
  resetToDefaults,
} = uiSlice.actions;

export default uiSlice.reducer;
