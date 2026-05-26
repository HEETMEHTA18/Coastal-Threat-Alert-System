import React, { useState, useEffect } from 'react';
import { 
  Activity, Satellite, CloudRain, Waves, BarChart, 
  Users, MapPin, RefreshCw, Settings, LogOut, User as UserIcon, 
  ChevronDown, Smartphone, Menu, X, MessageCircle, Sparkles,
  AlertTriangle, ShieldCheck, Radio, Gauge, Database, Compass
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAuth, useUI, useDashboard, useConnectionStatus } from '../store/hooks';
import { setActiveTab, toggleSidebar, openModal } from '../store/slices/uiSlice';
import { logoutUser } from '../store/slices/authSlice';
import DashboardProvider from './DashboardProvider';
import EnhancedCurrentMonitor from './EnhancedCurrentMonitor';
import WeatherWidget from './WeatherWidget';
import EnhancedSatelliteMap from './EnhancedSatelliteMap';
import MapboxSatelliteMap from './MapboxSatelliteMap';
import MapboxCoastalMonitor from './MapboxCoastalMonitor';
import MapErrorBoundary from './MapErrorBoundary';
import CommunityReports from './CommunityReports';
import CommunityReportForm from './CommunityReportForm';
import ChatbotWidget from './ChatbotWidget';
import AnalyticsPage from './AnalyticsPage';
import CurrentMonitorService from '../services/currentMonitorService';
import SimpleSettingsModal from './SimpleSettingsModal';
import UserProfileDisplay from './UserProfileDisplay';
import LogoFallback from './LogoFallback';
import AIQuestionnaire from './AIQuestionnaire';


const InteractiveDashboard = ({ onLogout, initialTab = 'overview' }) => {
  const dispatch = useDispatch();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mapProvider, setMapProvider] = useState('coastal');
  const [currentMonitor, setCurrentMonitor] = useState(null);
  const [currentStats, setCurrentStats] = useState({
    speed: 0,
    direction: 0,
    directionText: 'N/A',
    station: 'Awaiting live station',
    connected: false,
    lastUpdate: null,
    distance: null
  });
  const [userLocation, setUserLocation] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🎯 InteractiveDashboard mounted');
    console.log('🤖 Initial chatbot state:', isChatbotOpen);
  }, []);

  useEffect(() => {
    console.log('🤖 Chatbot state changed to:', isChatbotOpen);
  }, [isChatbotOpen]);

  const { user, isAuthenticated } = useAuth();
  const { isConnected, syncStatus } = useConnectionStatus();
  const { 
    activeTab, 
    sidebarCollapsed, 
    isLoading
  } = useDashboard();
  const { modals } = useUI();

  // Initialize Current Monitor Service
  useEffect(() => {
    const initCurrentMonitor = async () => {
      try {
        // Get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setUserLocation(location);
              
              // Initialize Current Monitor Service
              const monitor = new CurrentMonitorService();
              await monitor.initialize(location);
              
              // Add listener for updates
              monitor.addListener((event) => {
                if (event.type === 'dataUpdate' || event.type === 'connectionStatus') {
                  setCurrentStats(monitor.getLiveStats());
                }
              });
              
              setCurrentMonitor(monitor);
              setCurrentStats(monitor.getLiveStats());
            },
            async (error) => {
              console.error('Geolocation error, trying IP fallback:', error);
              let fallbackLocation = { lat: 19.0760, lng: 72.8777 };
              
              try {
                const ipResponse = await fetch('https://ipapi.co/json/');
                if (ipResponse.ok) {
                  const ipData = await ipResponse.json();
                  if (ipData.latitude && ipData.longitude) {
                    fallbackLocation = { lat: ipData.latitude, lng: ipData.longitude };
                    console.log('📍 Fetched IP Geolocation:', fallbackLocation);
                  }
                }
              } catch (ipError) {
                console.error('IP Geolocation failed:', ipError);
              }
              
              setUserLocation(fallbackLocation);
              
              try {
                const monitor = new CurrentMonitorService();
                await monitor.initialize(fallbackLocation);
                
                monitor.addListener((event) => {
                  if (event.type === 'dataUpdate' || event.type === 'connectionStatus') {
                    setCurrentStats(monitor.getLiveStats());
                  }
                });
                
                setCurrentMonitor(monitor);
                setCurrentStats(monitor.getLiveStats());
              } catch (monitorError) {
                console.warn('Current monitor initialization failed, using demo data:', monitorError);
                // Keep the demo data from initial state
              }
            }
          );
        }
      } catch (error) {
        console.error('Error initializing Current Monitor:', error);
      }
    };

    initCurrentMonitor();

    return () => {
      if (currentMonitor) {
        currentMonitor.destroy();
      }
    };
  }, []);
  
  // Set initial tab from props if provided
  useEffect(() => {
    if (initialTab) {
      dispatch(setActiveTab(initialTab));
    }
  }, [initialTab, dispatch]);

  const getAllowedTabs = (role) => {
    switch (role) {
      case 'viewer':
        return ['overview', 'currents', 'weather', 'satellite'];
      case 'community_leader':
        return ['overview', 'currents', 'weather', 'satellite', 'reports'];
      case 'operator':
        return ['overview', 'currents', 'weather', 'satellite', 'reports', 'analytics', 'assessment'];
      default:
        return ['overview', 'currents', 'weather', 'satellite'];
    }
  };

  const allowedTabs = getAllowedTabs(user?.role || 'viewer');
  const commandMetrics = [
    { label: 'Threat posture', value: currentStats.connected ? 'Guarded' : 'Degraded', tone: currentStats.connected ? 'text-emerald-500' : 'text-red-500', icon: ShieldCheck },
    { label: 'Live feeds', value: currentStats.connected ? '5 online' : 'Limited', tone: currentStats.connected ? 'text-cyan-500' : 'text-amber-500', icon: Radio },
    { label: 'Response window', value: currentStats.speed > 2 ? 'Short' : 'Stable', tone: currentStats.speed > 2 ? 'text-orange-500' : 'text-emerald-500', icon: Gauge },
    { label: 'Data confidence', value: userLocation ? 'Local' : 'Regional', tone: 'text-sky-500', icon: Database },
  ];

  const riskSignals = [
    { label: 'Current drift', value: `${currentStats.speed.toFixed(1)} kts ${currentStats.directionText}`, status: currentStats.speed > 2 ? 'watch' : 'normal' },
    { label: 'Nearest station', value: currentStats.station, status: currentStats.connected ? 'normal' : 'watch' },
    { label: 'Coverage mode', value: userLocation ? 'Location-aware' : 'Mumbai fallback', status: userLocation ? 'normal' : 'watch' },
  ];

  const advancedAdditions = [
    'AI-assisted risk scoring across weather, current, report, and satellite layers',
    'Incident verification, escalation, and response coordination workflow',
    'Evacuation zone intelligence with shelter capacity and route status',
    'Community reporting designed for low-connectivity coastal regions',
  ];

  // Enforce role-based access for tabs
  useEffect(() => {
    const allowed = getAllowedTabs(user?.role || 'viewer');
    if (!allowed.includes(activeTab)) {
      console.log(`🛡️ Access denied to tab '${activeTab}' for role '${user?.role || 'viewer'}'. Redirecting to '${allowed[0]}'...`);
      dispatch(setActiveTab(allowed[0] || 'overview'));
    }
  }, [user?.role, activeTab, dispatch]);

  // Function to get user initials
  const getUserInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return 'U';
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
    // Update URL without full page reload
    window.history.pushState({}, '', `/dashboard/${tab === 'overview' ? '' : tab}`);
  };

  const handleSidebarToggle = () => {
    if (isMobileView) {
      setMobileOpen((s) => !s);
    } else {
      dispatch(toggleSidebar());
    }
  };

  const handleLogout = () => {
    // Just navigate to logout page - don't clear auth state yet
    onLogout();
  };

  const handleOpenSettings = () => {
    console.log('🔧 Opening settings modal');
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    console.log('🔧 Closing settings modal');
    setIsSettingsOpen(false);
  };

  const handleToggleChatbot = () => {
    console.log('🤖 Chatbot button clicked! Current state:', isChatbotOpen);
    setIsChatbotOpen(!isChatbotOpen);
    console.log('🤖 Setting chatbot open to:', !isChatbotOpen);
  };

  const handleOpenNotifications = () => {
    dispatch(openModal({ modalName: 'alertDetail' }));
  };

  // Handle manual refresh of current data
  const handleRefreshCurrents = async () => {
    if (currentMonitor && userLocation) {
      try {
        await currentMonitor.getCurrentData(userLocation.lat, userLocation.lng);
        setCurrentStats(currentMonitor.getLiveStats());
      } catch (error) {
        console.error('Error refreshing current data:', error);
      }
    }
  };

  // Handle location permission request
  const handleRequestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          
          if (currentMonitor) {
            await currentMonitor.initialize(location);
            setCurrentStats(currentMonitor.getLiveStats());
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setCurrentStats(prev => ({ 
            ...prev, 
            station: 'Location permission denied',
            connected: false 
          }));
        }
      );
    }
  };

  const getTabIcon = (tabName) => {
    const icons = {
      overview: Activity,
      currents: Waves,
      weather: CloudRain,
      satellite: Satellite,
      reports: Users,
      analytics: BarChart,
      assessment: Sparkles,
    };
    return icons[tabName] || Activity;
  };


  const renderTabContent = () => {
    if (!allowedTabs.includes(activeTab)) {
      return null;
    }
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <section className="coastal-panel-strong p-5">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div className="min-w-0">
                  <p className="command-kicker">Coastal Guardian Command</p>
                  <h1 style={{ color: 'var(--text-primary)' }} className="mt-1 text-2xl md:text-3xl font-black">
                    Coastal Threat Intelligence Platform
                  </h1>
                  <p style={{ color: 'var(--text-secondary)' }} className="mt-2 max-w-3xl text-sm md:text-base">
                    Real-time coastal conditions, satellite observations, community reports, and response insights in one operational view.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:min-w-[620px] gap-3">
                  {commandMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.label} className="rounded-lg border p-3" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--surface-overlay)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <Icon className={`w-4 h-4 ${metric.tone}`} />
                          <span className={`text-xs font-black ${metric.tone}`}>{metric.value}</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)' }} className="mt-2 text-xs font-semibold">{metric.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
            {/* Satellite Map - Large, Left Side */}
            <div className="lg:col-span-3 relative">
              <div 
                className="card-theme rounded-xl p-6 transition-all duration-300 relative"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  minHeight: '800px',
                  height: 'fit-content',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex flex-col space-y-4 mb-4 relative z-10">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold flex items-center relative text-positioning-fix">
                      <Satellite className="w-6 h-6 text-teal-500 mr-2" />
                      Coastal Operations Map
                    </h3>
                    <span className="status-pill">
                      <span className={`w-2 h-2 rounded-full ${currentStats.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {currentStats.connected ? 'Live monitoring' : 'Regional view'}
                    </span>
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4 relative">
                    {/* Map Provider Toggle */}
                    <div className="flex items-center space-x-2 flex-wrap">
                      <button
                        onClick={() => setMapProvider('coastal')}
                        className={`px-3 py-1 text-xs rounded-full transition-all whitespace-nowrap ${
                          mapProvider === 'coastal' 
                            ? 'text-white font-extrabold shadow-sm' 
                            : 'hover:opacity-90'
                        }`}
                        style={{
                          backgroundColor: mapProvider === 'coastal' ? 'var(--accent-color)' : 'var(--surface-sunken)',
                          color: mapProvider === 'coastal' ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        Live Map
                      </button>
                      <button
                        onClick={() => setMapProvider('mapbox')}
                        className={`px-3 py-1 text-xs rounded-full transition-all whitespace-nowrap ${
                          mapProvider === 'mapbox' 
                            ? 'text-white font-extrabold shadow-sm' 
                            : 'hover:opacity-90'
                        }`}
                        style={{
                          backgroundColor: mapProvider === 'mapbox' ? 'var(--accent-color)' : 'var(--surface-sunken)',
                          color: mapProvider === 'mapbox' ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        Mapbox
                      </button>
                    </div>
                    
                    {/* Description Text */}
                    <div style={{ color: 'var(--text-muted)' }} className="text-sm text-right sm:text-left sm:max-w-md relative">
                      {mapProvider === 'coastal' ? 'Operational coastal monitoring layer' :
                       mapProvider === 'mapbox' ? 'Satellite basemap and observation layer' :
                       "Coastal monitoring layer"}
                    </div>
                  </div>
                </div>
                <div className="h-[650px] sm:h-[700px] lg:h-[720px] w-full overflow-hidden rounded-lg">
                  <MapErrorBoundary>
                    {mapProvider === 'coastal' ? (
                      <MapboxCoastalMonitor userLocation={userLocation} />
                    ) : mapProvider === 'mapbox' ? (
                      <MapboxSatelliteMap />
                    ) : (
                      <MapboxCoastalMonitor userLocation={userLocation} />
                    )}
                  </MapErrorBoundary>
                </div>
              </div>
            </div>

            {/* Quick Stats and Other Components - Right Side */}
            <div className="lg:col-span-1 space-y-6 relative">
              {/* Quick Stats */}
              <div 
                className="card-theme rounded-xl p-6 transition-all duration-300 relative"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{ color: 'var(--text-primary)', position: 'relative', zIndex: 1 }} className="text-lg font-bold mb-4 flex items-center text-positioning-fix">
                  <Activity className="w-5 h-5 text-cyan-500 mr-2" />
                  Risk Intelligence
                </h3>
                <div className="space-y-3 relative z-1 text-positioning-fix">
                  <div className="flex justify-between items-center text-positioning-fix">
                    <span style={{ color: 'var(--text-muted)' }} className="flex items-center font-medium text-positioning-fix">
                      <div className={`w-2 h-2 rounded-full mr-2 ${currentStats.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                      Ocean Data
                    </span>
                    <span className={`font-semibold text-positioning-fix ${currentStats.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {currentStats.connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-positioning-fix">
                    <span style={{ color: 'var(--text-muted)' }} className="text-positioning-fix">Current Speed</span>
                    <span className="font-semibold text-blue-400 text-positioning-fix">
                      {currentStats.speed.toFixed(1)} kts
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-positioning-fix">
                    <span style={{ color: 'var(--text-muted)' }} className="text-positioning-fix">Direction</span>
                    <span className="font-semibold text-cyan-400 text-positioning-fix">
                      {currentStats.directionText} ({currentStats.direction}°)
                    </span>
                  </div>
                  <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--card-border)' }}>
                    <div style={{ color: 'var(--text-muted)' }} className="text-xs mb-2">
                      Station: {currentStats.station}
                    </div>
                    {userLocation && (
                      <>
                        <div style={{ color: 'var(--text-muted)' }} className="text-xs mb-2">
                          Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </div>
                        {currentStats.distance && (
                          <div style={{ color: 'var(--text-muted)' }} className="text-xs mb-2">
                            Distance: {currentStats.distance}km
                          </div>
                        )}
                      </>
                    )}
                    <div style={{ color: 'var(--text-muted)' }} className="text-xs">
                      Updated: {currentStats.lastUpdate ? new Date(currentStats.lastUpdate).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="coastal-panel p-4">
                <h3 style={{ color: 'var(--text-primary)' }} className="text-base font-bold mb-3 flex items-center">
                  <Compass className="w-5 h-5 text-teal-500 mr-2" />
                  Signal Board
                </h3>
                <div className="space-y-3">
                  {riskSignals.map((signal) => (
                    <div key={signal.label} className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--card-border)' }}>
                      <div>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold">{signal.label}</p>
                        <p style={{ color: 'var(--text-primary)' }} className="text-sm font-bold mt-0.5">{signal.value}</p>
                      </div>
                      <span className={`text-xs font-black ${signal.status === 'normal' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {signal.status === 'normal' ? 'OK' : 'WATCH'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Monitor - Compact */}
              <div 
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold flex items-center">
                    <Waves className="w-5 h-5 text-blue-400 mr-2" />
                    Current Monitor
                  </h3>
                  <button
                    onClick={handleRefreshCurrents}
                    className="p-1 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--surface-sunken)' }}
                    title="Refresh current data"
                  >
                    <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{currentStats.station}</span>
                    <span className={`${currentStats.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {currentStats.connected ? 'connected' : 'disconnected'}
                    </span>
                  </div>
                  {!currentStats.connected ? (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-red-400 text-sm">
                        <div className="flex items-center">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {currentStats.station === 'Location unavailable' ? 'Enable location access for local monitoring' : 'Live ocean current feed unavailable'}
                        </div>
                        {currentStats.station === 'Location unavailable' && (
                          <button
                            onClick={handleRequestLocation}
                            className="px-3 py-1.5 text-white text-xs font-extrabold rounded-lg shadow transition-all hover:scale-105"
                            style={{ backgroundColor: 'var(--accent-color)' }}
                          >
                            Allow Location
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-green-400 text-sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Connected and monitoring
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Speed:</span>
                            <span style={{ color: 'var(--text-primary)' }} className="ml-1">{currentStats.speed.toFixed(1)} kts</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Direction:</span>
                            <span style={{ color: 'var(--text-primary)' }} className="ml-1">{currentStats.directionText}</span>
                          </div>
                        </div>
                        {currentStats.distance && (
                          <div style={{ color: 'var(--text-muted)' }} className="text-xs">
                            Station: {currentStats.distance}km away
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>


              <div className="coastal-panel p-4">
                <h3 style={{ color: 'var(--text-primary)' }} className="text-base font-bold mb-3 flex items-center">
                  <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
                  Operational Capabilities
                </h3>
                <div className="space-y-2">
                  {advancedAdditions.map((item) => (
                    <div key={item} className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-teal-500 shrink-0"></span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            </div>
          </div>
        );
      
      case 'currents':
        return (
          <div className="space-y-6">
            <EnhancedCurrentMonitor />
          </div>
        );
      
      case 'weather':
        return <WeatherWidget />;
      
      case 'satellite':
        // Use Enhanced Satellite Map with animations and heatmaps
        return (
          <div 
            className="rounded-xl border p-6 transition-all duration-300"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold flex items-center">
                <Satellite className="w-6 h-6 text-green-500 mr-2" />
                Indian Coastal Monitoring - Gujarat and Mumbai
              </h3>
              <div style={{ color: 'var(--text-muted)' }} className="text-sm font-medium">
                Arabian Sea real-time satellite with animated heatmaps
              </div>
            </div>
            <div className="h-[720px] rounded-lg overflow-hidden">
              <EnhancedSatelliteMap />
            </div>
          </div>
        );
      
      case 'reports':
        return <CommunityReports />;
        
      case 'analytics':
        return <AnalyticsPage />;

      case 'assessment':
        return <AIQuestionnaire />;

        
      default:
        return (
          <div 
            className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--card-bg)',
              backdropFilter: 'blur(12px)',
              borderWidth: '1px',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Overview
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Select a tab to view detailed data and analytics
            </p>
          </div>
        );
    }
  };

  // Handle window resize for responsive layout with improved mobile support
  useEffect(() => {
    let timeout = null;
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      // only update when crossing breakpoint to avoid unnecessary rerenders
      setIsMobileView((prev) => {
        if (prev !== isMobile) return isMobile;
        return prev;
      });

      // Auto-collapse sidebar on mobile by default for better UX
      if (isMobile && !sidebarCollapsed && !mobileOpen) {
        dispatch(toggleSidebar());
      }
    };

    const debounced = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleResize, 120);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', debounced);

    // Handle orientation change on mobile devices
    const onOrientation = () => setTimeout(handleResize, 120);
    window.addEventListener('orientationchange', onOrientation);

    return () => {
      window.removeEventListener('resize', debounced);
      window.removeEventListener('orientationchange', onOrientation);
      clearTimeout(timeout);
    };
  }, [dispatch, sidebarCollapsed, mobileOpen]);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (isMobileView && mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isMobileView, mobileOpen]);

  return (
    <DashboardProvider>
      <div 
        className="min-h-screen relative gradient-overlay coastal-command-shell"
      >
  {/* Sidebar */}
  <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${!isMobileView ? (sidebarCollapsed ? 'w-20' : 'w-72') : 'w-72'} ${isMobileView ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}>
          {/* Sidebar Content */}
          <div 
            className="h-full backdrop-blur-sm flex flex-col overflow-hidden sidebar-theme"
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--sidebar-shadow)',
            }}
          >
            {/* Sidebar Header */}
            {isMobileView && mobileOpen && (
              <div className="p-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <LogoFallback size="md" alt="CTAS" />
                  <h3 style={{ color: 'var(--text-primary)' }} className="font-bold">CTAS</h3>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg"
                  aria-label="Close navigation"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {!isMobileView && (
              <div 
                className="p-4 border-b"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
                    <LogoFallback size="md" alt="CTAS" />
                    {!sidebarCollapsed && (
                      <div className="ml-3">
                        <h2 style={{ color: 'var(--text-primary)' }} className="font-bold text-lg">CTAS</h2>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Coastal Threat Alert System</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSidebarToggle}
                    className="p-1 rounded transition-colors"
                    style={{
                      color: 'var(--text-muted)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--sidebar-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <ChevronDown className={`w-6 h-6 transform transition-transform ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'currents', label: 'Currents', icon: Waves },
                { id: 'weather', label: 'Weather', icon: CloudRain },
                { id: 'satellite', label: 'Satellite', icon: Satellite },
                { id: 'reports', label: 'Reports', icon: Users },
                { id: 'analytics', label: 'Analytics', icon: BarChart },
                { id: 'assessment', label: 'AI Assessment', icon: Sparkles },
              ].filter((tab) => allowedTabs.includes(tab.id)).map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                    key={tab.id}
                    onClick={() => {
                      handleTabChange(tab.id);
                      if (isMobileView && mobileOpen) setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 touch-manipulation min-h-[56px] ${sidebarCollapsed && !isMobileView ? 'justify-center' : ''}`}
                    style={{
                      backgroundColor: activeTab === tab.id ? 'var(--sidebar-active)' : 'transparent',
                      color: activeTab === tab.id ? '#ffffff' : 'var(--sidebar-text)'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.backgroundColor = 'var(--sidebar-hover)';
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = 'var(--sidebar-text)';
                      }
                    }}
                    aria-label={`Navigate to ${tab.label}`}
                  >
                    <Icon className={`${isMobileView ? 'w-6 h-6' : 'w-7 h-7'}`} />
                    {(!sidebarCollapsed || isMobileView) && (
                      <span className="font-medium">{tab.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Report Incident button for sidebar */}
            {(!sidebarCollapsed || isMobileView) ? (
              <div className="p-4">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-extrabold shadow-lg shadow-red-950/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <span>Report Incident</span>
                </button>
              </div>
            ) : (
              <div className="p-4 flex justify-center">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-950/20 transition-all duration-200"
                  aria-label="Report Incident"
                >
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </button>
              </div>
            )}

            {/* Desktop User Menu */}
            {!isMobileView && (
              <div 
                className="absolute bottom-0 left-0 right-0 p-4 border-t"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
                    style={{
                      color: 'var(--sidebar-text)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--sidebar-hover)';
                      e.target.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'var(--sidebar-text)';
                    }}
                  >
                    <UserProfileDisplay variant={sidebarCollapsed ? 'avatar-only' : 'compact'} />
                    {!sidebarCollapsed && (
                      <ChevronDown className="w-5 h-5 ml-auto" />
                    )}
                  </button>
                  
                  {showUserMenu && (
                    <div 
                      className={`absolute ${sidebarCollapsed ? 'left-full ml-2' : 'left-0'} bottom-full mb-2 w-64 rounded-xl border z-50 overflow-hidden backdrop-blur-md transition-all duration-300`}
                      style={{
                        backgroundColor: 'var(--surface-elevated)',
                        borderColor: 'var(--card-border)',
                        boxShadow: 'var(--card-hover-shadow)',
                      }}
                    >
                      <div 
                        className="p-4 border-b"
                        style={{
                          borderColor: 'var(--border-color)',
                          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))'
                        }}
                      >
                        <UserProfileDisplay variant="full" />
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={handleOpenSettings}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:scale-[1.02] font-medium"
                          style={{
                            color: 'var(--text-secondary)',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-tertiary)';
                            e.target.style.color = 'var(--text-primary)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 group hover:scale-[1.02] font-medium"
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile User Menu */}
            {isMobileView && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-700/50 rounded-lg"
                  >
                    <UserProfileDisplay variant="compact" />
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  </button>
                  
                  {showUserMenu && (
                    <div 
                      className="absolute left-0 bottom-full mb-2 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden backdrop-blur-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <div 
                        className="p-4 border-b"
                        style={{
                          borderColor: 'var(--border-color)',
                          background: 'linear-gradient(to right, var(--bg-tertiary), var(--bg-secondary))'
                        }}
                      >
                        <UserProfileDisplay variant="full" />
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={handleOpenSettings}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:scale-[1.02]"
                          style={{
                            color: 'var(--text-secondary)',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--bg-tertiary)';
                            e.target.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                          <span className="font-medium">Settings</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all duration-200 group hover:scale-[1.02]"
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`transition-all duration-300 ${sidebarCollapsed && !isMobileView ? 'ml-20' : 'ml-0 md:ml-72'}`}>
          <div className="min-h-screen flex flex-col relative">
            {/* Mobile Header */}
            {isMobileView && (
              <header 
                className="backdrop-blur-sm border-b p-4 flex items-center justify-between sticky top-0 z-30"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center">
                  <button
                    onClick={handleSidebarToggle}
                    className="p-3 mr-3 rounded-xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
                    style={{
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                  <div className="flex items-center">
                    <LogoFallback size="sm" alt="CTAS" />
                    <h2 style={{ color: 'var(--text-primary)' }} className="font-bold text-lg ml-2">CTAS</h2>
                  </div>
                </div>
                {/* Mobile Report Button */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 touch-manipulation min-h-[32px]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  <span>Report</span>
                </button>
              </header>
            )}

            {/* Content */}
            <main className="flex-1 p-6 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading dashboard...</p>
                  </div>
                </div>
              ) : (
                renderTabContent()
              )}
            </main>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileView && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={handleSidebarToggle}
          />
        )}

        {/* Chatbot Interface - Right Side */}
        {isChatbotOpen && (
          <div className="fixed right-4 bottom-20 top-20 w-80 z-40">
            <ChatbotWidget onClose={() => setIsChatbotOpen(false)} />
          </div>
        )}
      </div>

      {/* Floating Greeting Bubble */}
      {!isChatbotOpen && (
        <div className="fixed bottom-28 right-4 z-[9998] animate-bounce">
          <div 
            className="bg-white rounded-xl px-3 py-2 shadow-xl border border-blue-200 max-w-48"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              boxShadow: '0 15px 35px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.15)'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">👋</span>
              <div>
                  <p className="text-gray-800 text-sm font-semibold">
                  CTAS Assistant
                </p>
                <p className="text-blue-600 text-xs font-medium">
                  Ask for coastal risk guidance
                </p>
              </div>
            </div>
            {/* Speech bubble arrow */}
            <div 
              className="absolute bottom-0 right-6 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #f0f9ff',
                transform: 'translateY(100%)'
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Chatbot Toggle Button */}
      <button
        onClick={handleToggleChatbot}
        className="fixed bottom-6 right-6 w-16 h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center z-[9999] transition-all duration-300 hover:scale-110 border-2 border-slate-700"
        title="Open CTAS Assistant"
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.4), 0 0 0 2px rgba(148, 163, 184, 0.3)',
          animation: 'pulse 2s infinite'
        }}
      >
        <MessageCircle className="w-8 h-8" />
      </button>
      
      {/* Simple Settings Modal */}
      <SimpleSettingsModal 
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
      
      {/* Community Report Submission Modal */}
      {showReportModal && (
        <CommunityReportForm 
          onClose={() => setShowReportModal(false)}
          onSubmit={(report) => {
            console.log('Report submitted successfully from modal:', report);
            setShowReportModal(false);
          }}
          initialData={false}
        />
      )}
      
      {/* Overview Page Layout Fix Styles */}
      <style>{`
        /* Chatbot button pulse animation */
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(147, 197, 253, 0.5), 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(147, 197, 253, 0.7), 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }

        /* Greeting bubble animations */
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes gentleBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        /* Apply animations to greeting bubble */
        .fixed.bottom-28.right-4 {
          animation: slideInRight 0.8s ease-out, gentleBounce 2s ease-in-out 1s infinite;
        }

        /* Ensure stable text positioning */
        .card-theme {
          position: relative;
          isolation: isolate;
        }
        
        /* Fix text positioning issues */
        .text-positioning-fix {
          position: relative;
          z-index: 1;
          transform: translateZ(0);
          will-change: auto;
        }
        
        /* Grid layout stability */
        .grid {
          contain: layout;
        }
        
        .grid > div {
          position: relative;
          contain: layout style;
        }
        
        /* Ensure flex containers maintain proper positioning */
        .flex {
          position: relative;
        }
        
        /* Prevent any text shifting in space-y containers */
        .space-y-3 > *,
        .space-y-4 > *,
        .space-y-6 > * {
          position: relative;
          transform: translateZ(0);
        }
        
        /* Button positioning fix */
        button {
          position: relative;
          z-index: 1;
        }
        
        /* Icon positioning */
        svg {
          position: relative;
        }
      `}</style>
    </DashboardProvider>
  );
};

export default InteractiveDashboard;
