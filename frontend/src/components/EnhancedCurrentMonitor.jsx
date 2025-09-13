// Enhanced CurrentMonitor component with educational content about ocean and coastal currents
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Activity, MapPin, Clock, AlertTriangle, RefreshCw, Wifi, WifiOff, 
  Info, ChevronDown, ChevronUp, Waves, Navigation, BookOpen, 
  Compass, Thermometer, Wind, Anchor, BarChart3
} from 'lucide-react';
import { useCurrentData, useConnectionStatus, useUI, useNoaaData } from '../store/hooks';
import { fetchCurrentsData, fetchThreatAssessment, clearStationData } from '../store/slices/noaaSlice';

const EnhancedCurrentMonitor = ({ className = '' }) => {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const [expandedSection, setExpandedSection] = useState(null);
  
  const { data, isLoading, error, freshness, hasData, latest, station } = useCurrentData();
  const { isConnected, noaaConnection } = useConnectionStatus();
  const { dashboard } = useUI();

  // Debug logging
  console.log('EnhancedCurrentMonitor - Debug Info:', {
    data,
    isLoading,
    error,
    hasData,
    latest,
    station,
    'data.observations': data?.observations,
    'data.latest': data?.latest,
    'data keys': Object.keys(data || {}),
    'latest observation': latest,
    'station_info': data?.station_info
  });

  // Also log the raw currentsData to see what's actually stored
  const { currentsData } = useNoaaData();
  console.log('Raw currentsData from Redux:', currentsData);

  // Auto-refresh based on user preferences
  useEffect(() => {
    if (dashboard.autoRefresh && dashboard.refreshInterval) {
      intervalRef.current = setInterval(() => {
        dispatch(fetchCurrentsData('cb0201'));
      }, dashboard.refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch, dashboard.autoRefresh, dashboard.refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    // Clear any old cached data first
    dispatch(clearStationData());
    // Then fetch new data
    setTimeout(() => {
      dispatch(fetchCurrentsData('cb0201'));
      dispatch(fetchThreatAssessment('cb0201'));
    }, 100);
  }, [dispatch]);

  const handleManualRefresh = () => {
    console.log('Manual refresh triggered - fetching cb0201 data');
    dispatch(fetchCurrentsData('cb0201'));
    dispatch(fetchThreatAssessment('cb0201'));
  };

  const formatSpeed = (speed) => {
    if (!speed) return 'N/A';
    return `${speed.toFixed(1)} kts`;
  };

  const formatDirection = (direction) => {
    if (!direction) return 'N/A';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(direction / 22.5) % 16;
    return `${direction}° ${directions[index]}`;
  };

  const getCurrentStrengthCategory = (speed) => {
    if (!speed) return { category: 'Unknown', color: 'text-slate-400', bgColor: 'bg-slate-500/20' };
    if (speed < 0.5) return { category: 'Weak', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    if (speed < 1.0) return { category: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    if (speed < 2.0) return { category: 'Strong', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
    return { category: 'Very Strong', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  };

  const getThreatColor = (speed) => {
    if (!speed) return 'text-gray-400';
    if (speed < 1.0) return 'text-green-400';
    if (speed < 2.0) return 'text-yellow-400';
    if (speed < 3.0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDataFreshnessColor = (minutes) => {
    if (minutes === null) return 'text-gray-400';
    if (minutes < 10) return 'text-green-400';
    if (minutes < 30) return 'text-yellow-400';
    if (minutes < 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Educational content sections
  const currentEducationSections = [
    {
      id: 'ocean-currents',
      title: 'Understanding Ocean Currents',
      icon: Waves,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Ocean currents are continuous, directed movements of seawater that flow throughout the world's oceans. 
            They play a crucial role in marine navigation, coastal safety, and marine ecosystem health.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Wind className="w-4 h-4 text-blue-400" />
                <h4 className="font-semibold text-blue-400">Surface Currents</h4>
              </div>
              <p className="text-sm text-slate-300">
                Driven by wind patterns and the Coriolis effect. These affect the top 400 meters of ocean water 
                and are crucial for coastal activities and marine transportation.
              </p>
              <div className="mt-2 text-xs text-blue-300">
                <strong>Typical speeds:</strong> 0.1 - 2.5 knots
              </div>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="w-4 h-4 text-purple-400" />
                <h4 className="font-semibold text-purple-400">Deep Water Currents</h4>
              </div>
              <p className="text-sm text-slate-300">
                Driven by density differences due to temperature and salinity variations. They circulate 
                throughout the ocean basins and affect global climate patterns.
              </p>
              <div className="mt-2 text-xs text-purple-300">
                <strong>Typical speeds:</strong> 0.01 - 0.1 knots
              </div>
            </div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Did You Know?
            </h4>
            <p className="text-sm text-slate-300">
              The Gulf Stream, one of the strongest ocean currents, can reach speeds of up to 5.6 mph (2.5 m/s) 
              and transports 30 million cubic meters of water per second - equivalent to 150 times the flow of the Amazon River!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'coastal-currents',
      title: 'Coastal Current Systems',
      icon: Navigation,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Coastal currents are influenced by local factors including tides, wind, seafloor topography, 
            and freshwater inflow from rivers. Understanding these patterns is vital for coastal safety.
          </p>
          <div className="space-y-3">
            <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-emerald-400 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Tidal Currents
                </h4>
                <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded">Predictable</span>
              </div>
              <p className="text-sm text-slate-300">
                Periodic horizontal movements of water associated with the rise and fall of tides. 
                These can reach speeds of 2-3 knots in coastal areas.
              </p>
            </div>
            <div className="bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-cyan-400 flex items-center">
                  <Compass className="w-4 h-4 mr-2" />
                  Longshore Currents
                </h4>
                <span className="text-xs text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded">Parallel to Shore</span>
              </div>
              <p className="text-sm text-slate-300">
                Flow parallel to the shoreline, created by waves approaching the beach at an angle. 
                Important for sediment transport and beach formation.
              </p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-amber-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Rip Currents
                </h4>
                <span className="text-xs text-amber-300 bg-amber-500/20 px-2 py-1 rounded">Dangerous</span>
              </div>
              <p className="text-sm text-slate-300">
                Narrow channels of fast-moving water flowing away from shore. Can be dangerous for swimmers 
                but are important for beach water circulation.
              </p>
            </div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-200 mb-2">Chesapeake Bay Currents</h4>
            <p className="text-sm text-slate-300 mb-2">
              Our monitoring station at Cape Henry tracks currents in the Chesapeake Bay mouth, where:
            </p>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Tidal currents dominate with a semi-diurnal pattern (two high/low tides per day)</li>
              <li>• Maximum speeds typically occur during spring tides (new/full moon)</li>
              <li>• Wind-driven currents can significantly modify tidal patterns</li>
              <li>• Fresh water outflow creates complex density-driven circulation</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'current-safety',
      title: 'Current Safety & Impact',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Understanding current patterns is essential for maritime safety, coastal management, 
            and environmental protection. Strong currents can pose significant risks.
          </p>
          
          {/* Safety Guidelines */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
              <div className="text-green-400 font-bold text-lg">&lt; 1.0 kts</div>
              <div className="text-xs text-green-300 font-medium">Safe</div>
              <div className="text-xs text-slate-400 mt-1">Generally safe for swimming</div>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 text-center">
              <div className="text-orange-400 font-bold text-lg">1.0-2.0 kts</div>
              <div className="text-xs text-orange-300 font-medium">Caution</div>
              <div className="text-xs text-slate-400 mt-1">Strong swimmers only</div>
            </div>
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
              <div className="text-red-400 font-bold text-lg">&gt; 2.0 kts</div>
              <div className="text-xs text-red-300 font-medium">Dangerous</div>
              <div className="text-xs text-slate-400 mt-1">Avoid water activities</div>
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-200 mb-3 flex items-center">
              <Anchor className="w-4 h-4 mr-2" />
              Environmental & Economic Impact
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-slate-300 font-medium mb-2">Marine Ecosystem</h5>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Nutrient distribution and mixing</li>
                  <li>• Larval fish and plankton transport</li>
                  <li>• Oxygen circulation in deep waters</li>
                  <li>• Marine debris and pollution dispersion</li>
                </ul>
              </div>
              <div>
                <h5 className="text-slate-300 font-medium mb-2">Coastal Management</h5>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Sediment transport and beach evolution</li>
                  <li>• Coastal erosion and accretion patterns</li>
                  <li>• Harbor and port navigation safety</li>
                  <li>• Renewable energy (tidal power) potential</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Emergency Information */}
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <h4 className="font-semibold text-red-400 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Guidelines
            </h4>
            <div className="text-sm text-slate-300 space-y-2">
              <p><strong>If caught in a strong current:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Don't fight directly against the current</li>
                <li>• Swim parallel to shore to escape rip currents</li>
                <li>• Signal for help and stay calm</li>
                <li>• Float on your back to conserve energy</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Educational Content Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Ocean & Coastal Currents
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Understanding water movement for coastal safety
          </p>
        </div>
      </div>
      
      {/* Educational Content Sections */}
      <div className="space-y-4">
        {currentEducationSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          return (
            <div 
              key={section.id} 
              className="rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderWidth: '1px',
                borderColor: 'var(--card-border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between transition-all duration-300"
                style={{
                  backgroundColor: isExpanded ? 'var(--surface-secondary)' : 'transparent',
                }}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-blue-400" />
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {section.title}
                  </h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-6">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Current Data Section */}
      <div 
        className="rounded-xl transition-all duration-300 hover:scale-[1.02]"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderWidth: '1px',
          borderColor: 'var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div 
          className="px-6 py-4"
          style={{
            borderBottomWidth: '1px',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <div>
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Live Current Monitoring
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Chesapeake Bay Bridge Tunnel - Current Monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isConnected && <WifiOff className="w-4 h-4 text-red-400" />}
              {isConnected && <Wifi className="w-4 h-4 text-green-400" />}
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Connection Error</span>
              </div>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !hasData && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
              <p style={{ color: 'var(--text-secondary)' }}>Loading current data...</p>
            </div>
          )}

          {/* Current Data Display */}
          {hasData && latest && (
            <div className="space-y-4">
              {/* Main Current Reading */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-700/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatSpeed(latest.speed_knots)}
                  </div>
                  <div className="text-sm text-slate-400 mb-2">Current Speed</div>
                  <div className={`text-xs px-2 py-1 rounded ${getCurrentStrengthCategory(latest.speed_knots).bgColor} ${getCurrentStrengthCategory(latest.speed_knots).color}`}>
                    {getCurrentStrengthCategory(latest.speed_knots).category}
                  </div>
                </div>
                
                <div className="bg-slate-700/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatDirection(latest.direction_degrees)}
                  </div>
                  <div className="text-sm text-slate-400">Current Direction</div>
                </div>
                
                <div className="bg-slate-700/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {latest.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : 'N/A'}
                  </div>
                  <div className="text-sm text-slate-400 mb-2">Last Updated</div>
                  {freshness !== null && (
                    <div className={`text-xs ${getDataFreshnessColor(freshness)}`}>
                      {freshness < 60 ? `${freshness}m ago` : `${Math.round(freshness/60)}h ago`}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Historical Statistics */}
              {data.observations && data.observations.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-200 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      24-Hour Current Analysis
                    </h4>
                    <span className="text-xs text-slate-400">
                      {data.observations.length} records
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
                      <div className="text-lg font-bold text-green-400">
                        {formatSpeed(Math.max(...data.observations.map(r => r.speed_knots || 0)))}
                      </div>
                      <div className="text-xs text-green-300 font-medium">Peak Speed</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {(() => {
                          const maxRecord = data.observations.find(r => r.speed_knots === Math.max(...data.observations.map(o => o.speed_knots || 0)));
                          return maxRecord ? new Date(maxRecord.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {formatSpeed(data.observations.reduce((sum, r) => sum + (r.speed_knots || 0), 0) / data.observations.length)}
                      </div>
                      <div className="text-xs text-blue-300 font-medium">Average</div>
                      <div className="text-xs text-slate-400 mt-1">24-hour mean</div>
                    </div>
                    
                    <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 text-center">
                      <div className="text-lg font-bold text-orange-400">
                        {formatSpeed(Math.min(...data.observations.map(r => r.speed_knots || 0)))}
                      </div>
                      <div className="text-xs text-orange-300 font-medium">Minimum</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {(() => {
                          const minRecord = data.observations.find(r => r.speed_knots === Math.min(...data.observations.map(o => o.speed_knots || 0)));
                          return minRecord ? new Date(minRecord.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 text-center">
                      <div className="text-lg font-bold text-purple-400">
                        {(() => {
                          const strongCurrents = data.observations.filter(r => (r.speed_knots || 0) > 20);
                          return Math.round((strongCurrents.length / data.observations.length) * 100);
                        })()}%
                      </div>
                      <div className="text-xs text-purple-300 font-medium">Strong Currents</div>
                      <div className="text-xs text-slate-400 mt-1">&gt;20 kts events</div>
                    </div>
                  </div>

                  {/* Current Strength Distribution */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <h5 className="font-medium text-slate-200 mb-3">Current Strength Distribution (24 Hours)</h5>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {(() => {
                        const weak = data.observations.filter(r => (r.speed_knots || 0) < 10).length;
                        const moderate = data.observations.filter(r => (r.speed_knots || 0) >= 10 && (r.speed_knots || 0) < 20).length;
                        const strong = data.observations.filter(r => (r.speed_knots || 0) >= 20 && (r.speed_knots || 0) < 30).length;
                        const veryStrong = data.observations.filter(r => (r.speed_knots || 0) >= 30).length;
                        const total = data.observations.length;
                        
                        return (
                          <>
                            <div className="text-center">
                              <div className="text-green-400 font-bold">{Math.round((weak/total)*100)}%</div>
                              <div className="text-green-300">Weak</div>
                              <div className="text-slate-400">&lt;10 kts</div>
                            </div>
                            <div className="text-center">
                              <div className="text-yellow-400 font-bold">{Math.round((moderate/total)*100)}%</div>
                              <div className="text-yellow-300">Moderate</div>
                              <div className="text-slate-400">10-20 kts</div>
                            </div>
                            <div className="text-center">
                              <div className="text-orange-400 font-bold">{Math.round((strong/total)*100)}%</div>
                              <div className="text-orange-300">Strong</div>
                              <div className="text-slate-400">20-30 kts</div>
                            </div>
                            <div className="text-center">
                              <div className="text-red-400 font-bold">{Math.round((veryStrong/total)*100)}%</div>
                              <div className="text-red-300">Very Strong</div>
                              <div className="text-slate-400">&gt;30 kts</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Recent Peaks */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <h5 className="font-medium text-slate-200 mb-3">Notable Current Events (Last 24 Hours)</h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(() => {
                        const peakEvents = data.observations
                          .filter(r => (r.speed_knots || 0) > 25)
                          .sort((a, b) => (b.speed_knots || 0) - (a.speed_knots || 0))
                          .slice(0, 6);
                        
                        return peakEvents.map((event, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-slate-300">
                              {new Date(event.timestamp).toLocaleString([], {
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute:'2-digit'
                              })}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold ${event.speed_knots > 35 ? 'text-red-400' : event.speed_knots > 30 ? 'text-orange-400' : 'text-yellow-400'}`}>
                                {formatSpeed(event.speed_knots)}
                              </span>
                              <span className="text-slate-400">
                                {formatDirection(event.direction_degrees)}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                      {data.observations.filter(r => (r.speed_knots || 0) > 25).length === 0 && (
                        <div className="text-slate-400 text-sm text-center py-2">
                          No major current events (&gt;25 kts) in the last 24 hours
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Data State */}
          {!hasData && !isLoading && !error && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-3">No current data available</p>
              <button
                onClick={handleManualRefresh}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                Load Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCurrentMonitor;
