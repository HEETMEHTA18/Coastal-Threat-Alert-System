import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Settings,
  RefreshCw,
  Waves,
  Wind,
  Thermometer,
  Gauge,
  Zap
} from 'lucide-react';

// Simulated real-time data hook
const useRealTimeData = (endpoint, interval = 30000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // In production, this would be actual API calls
        const response = await simulateApiCall(endpoint);
        setData(response);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [endpoint, interval]);

  return { data, loading, error, lastUpdated };
};

// Simulate API calls with realistic coastal data
const simulateApiCall = async (endpoint) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
  const now = new Date();
  const baseData = {
    timestamp: now.toISOString(),
    location: { lat: 36.8468, lon: -76.2852 }, // Norfolk, VA
  };

  switch (endpoint) {
    case 'threats':
      return {
        ...baseData,
        currentThreats: [
          {
            id: 'threat_1',
            type: 'coastal_flooding',
            severity: 'moderate',
            location: 'Norfolk Harbor',
            probability: 0.65,
            estimatedImpact: 'Minor flooding in low-lying areas',
            timeToImpact: '2-4 hours'
          },
          {
            id: 'threat_2',
            type: 'algal_bloom',
            severity: 'low',
            location: 'Chesapeake Bay',
            probability: 0.35,
            estimatedImpact: 'Water quality concerns',
            timeToImpact: '12-24 hours'
          }
        ],
        riskLevel: 'moderate',
        overallScore: 42
      };

    case 'environmental':
      return {
        ...baseData,
        oceanData: {
          waveHeight: 1.2 + Math.sin(Date.now() / 100000) * 0.5,
          currentSpeed: 0.8 + Math.random() * 0.4,
          currentDirection: 135 + Math.random() * 30,
          waterTemperature: 22.5 + Math.random() * 2,
          salinity: 34.2 + Math.random() * 0.8,
          tideLevel: Math.sin(Date.now() / 200000) * 1.5,
          visibility: 15 + Math.random() * 5
        },
        weatherData: {
          temperature: 18 + Math.random() * 5,
          windSpeed: 12 + Math.random() * 8,
          windDirection: 220 + Math.random() * 40,
          humidity: 65 + Math.random() * 20,
          pressure: 1013 + Math.random() * 10,
          visibility: 20 + Math.random() * 10,
          condition: 'partly_cloudy'
        },
        airQuality: {
          aqi: 45 + Math.random() * 20,
          pm25: 12 + Math.random() * 8,
          ozone: 0.065 + Math.random() * 0.02
        }
      };

    case 'ecosystem':
      return {
        ...baseData,
        mangroveHealth: {
          overallScore: 78 + Math.random() * 10,
          ndvi: 0.72 + Math.random() * 0.05,
          biomass: 145 + Math.random() * 20,
          biodiversityIndex: 0.82 + Math.random() * 0.1,
          threats: ['coastal_development', 'pollution'],
          carbonSequestration: 12.5 + Math.random() * 2
        },
        waterQuality: {
          pH: 8.1 + Math.random() * 0.2,
          dissolvedOxygen: 7.2 + Math.random() * 0.8,
          turbidity: 5.5 + Math.random() * 2,
          nitrates: 2.1 + Math.random() * 0.8,
          phosphates: 0.45 + Math.random() * 0.2,
          chlorophyll: 8.5 + Math.random() * 3
        }
      };

    default:
      return baseData;
  }
};

// Interactive Map Component
const InteractiveMap = ({ data, selectedLocation, onLocationSelect }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    // In a real implementation, this would initialize a map library like Leaflet or Mapbox
    if (mapRef.current) {
      // Simulate map updates
      const mapElement = mapRef.current;
      mapElement.style.background = `linear-gradient(135deg, 
        rgba(59, 130, 246, 0.1) 0%, 
        rgba(16, 185, 129, 0.1) 50%, 
        rgba(239, 68, 68, 0.1) 100%)`;
    }
  }, [data]);

  const locations = [
    { id: 'norfolk', name: 'Norfolk Harbor', lat: 36.8468, lon: -76.2852, threats: 2, severity: 'moderate' },
    { id: 'virginia_beach', name: 'Virginia Beach', lat: 36.8529, lon: -75.9780, threats: 1, severity: 'low' },
    { id: 'chesapeake', name: 'Chesapeake Bay', lat: 37.0000, lon: -76.0000, threats: 3, severity: 'high' },
    { id: 'hampton', name: 'Hampton Roads', lat: 36.8879, lon: -76.2906, threats: 1, severity: 'low' }
  ];

  return (
    <div className="relative">
      <div 
        ref={mapRef}
        className="w-full h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border border-white/20 relative overflow-hidden"
      >
        {/* Map overlay with location markers */}
        {locations.map((location) => (
          <div
            key={location.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
              selectedLocation?.id === location.id ? 'z-20 scale-125' : 'z-10'
            }`}
            style={{
              left: `${((location.lon + 76.3) / 1.3) * 100}%`,
              top: `${((37.2 - location.lat) / 0.4) * 100}%`
            }}
            onClick={() => onLocationSelect(location)}
          >
            <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-lg ${
              location.severity === 'high' ? 'bg-red-500' :
              location.severity === 'moderate' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                location.severity === 'high' ? 'bg-red-700' :
                location.severity === 'moderate' ? 'bg-yellow-700' :
                'bg-green-700'
              }`} />
              
              {/* Pulse animation for active threats */}
              {location.threats > 0 && (
                <div className={`absolute inset-0 rounded-full animate-ping ${
                  location.severity === 'high' ? 'bg-red-400' :
                  location.severity === 'moderate' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`} />
              )}
            </div>
            
            {/* Location label */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-800 whitespace-nowrap shadow-md">
              {location.name}
              {location.threats > 0 && (
                <span className={`ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                  location.severity === 'high' ? 'bg-red-100 text-red-800' :
                  location.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {location.threats}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Selected location info panel */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedLocation.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Threats:</span>
                <span className="font-medium">{selectedLocation.threats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Level:</span>
                <span className={`font-medium capitalize ${
                  selectedLocation.severity === 'high' ? 'text-red-600' :
                  selectedLocation.severity === 'moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {selectedLocation.severity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-mono text-xs">
                  {selectedLocation.lat.toFixed(3)}, {selectedLocation.lon.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition-colors">
          <Settings className="h-4 w-4 text-gray-600" />
        </button>
        <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition-colors">
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

// Real-time Chart Component
const RealTimeChart = ({ title, data, color = "blue", icon: Icon, unit = "" }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (data !== null && data !== undefined) {
      const now = Date.now();
      setHistory(prev => {
        const newHistory = [...prev, { time: now, value: data }].slice(-20); // Keep last 20 points
        return newHistory;
      });
    }
  }, [data]);

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
      red: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' },
      yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-600' },
      purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600' }
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(color);
  const maxValue = Math.max(...history.map(h => h.value), 1);
  const minValue = Math.min(...history.map(h => h.value), 0);
  const range = maxValue - minValue || 1;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className={`h-5 w-5 ${colorClasses.text}`} />}
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${colorClasses.text}`}>
            {data?.toFixed(1)}{unit}
          </div>
        </div>
      </div>
      
      {/* Mini chart */}
      <div className="relative h-16 w-full">
        <svg viewBox="0 0 100 30" className="w-full h-full">
          {history.length > 1 && (
            <>
              {/* Chart area */}
              <path
                d={`M ${history.map((point, index) => 
                  `${(index / (history.length - 1)) * 100},${30 - ((point.value - minValue) / range) * 25}`
                ).join(' L ')}`}
                fill="none"
                stroke={`rgb(${color === 'blue' ? '59 130 246' : color === 'green' ? '16 185 129' : color === 'red' ? '239 68 68' : color === 'yellow' ? '245 158 11' : '147 51 234'})`}
                strokeWidth="1.5"
                className="drop-shadow-sm"
              />
              
              {/* Fill area */}
              <path
                d={`M 0,30 ${history.map((point, index) => 
                  `L ${(index / (history.length - 1)) * 100},${30 - ((point.value - minValue) / range) * 25}`
                ).join(' ')} L 100,30 Z`}
                fill={`url(#gradient-${color})`}
                className="opacity-20"
              />
              
              {/* Current point */}
              <circle
                cx="100"
                cy={30 - ((data - minValue) / range) * 25}
                r="1.5"
                fill={`rgb(${color === 'blue' ? '59 130 246' : color === 'green' ? '16 185 129' : color === 'red' ? '239 68 68' : color === 'yellow' ? '245 158 11' : '147 51 234'})`}
                className="drop-shadow-sm"
              >
                <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={`rgb(${color === 'blue' ? '59 130 246' : color === 'green' ? '16 185 129' : color === 'red' ? '239 68 68' : color === 'yellow' ? '245 158 11' : '147 51 234'})`} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Trend indicator */}
      <div className="mt-2 flex items-center justify-between text-xs text-white/70">
        <span>Last 10 min</span>
        {history.length > 1 && (
          <div className="flex items-center space-x-1">
            <TrendingUp className={`h-3 w-3 ${
              history[history.length - 1]?.value > history[history.length - 2]?.value 
                ? 'text-green-400' : 'text-red-400'
            }`} />
            <span className={
              history[history.length - 1]?.value > history[history.length - 2]?.value 
                ? 'text-green-400' : 'text-red-400'
            }>
              {((history[history.length - 1]?.value - history[history.length - 2]?.value) || 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Threat Alert Card
const ThreatAlertCard = ({ threat, onViewDetails }) => {
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 bg-orange-500/10';
      case 'moderate':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getSeverityIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'coastal_flooding':
        return <Waves className="h-5 w-5" />;
      case 'storm_surge':
        return <Activity className="h-5 w-5" />;
      case 'algal_bloom':
        return <Zap className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-xl border ${getSeverityColor(threat.severity)} p-4 hover:bg-white/15 transition-colors cursor-pointer`}
         onClick={() => onViewDetails(threat)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getSeverityColor(threat.severity)} border-none`}>
            {getSeverityIcon(threat.type)}
          </div>
          <div>
            <h3 className="text-white font-medium capitalize">
              {threat.type.replace('_', ' ')}
            </h3>
            <p className="text-white/70 text-sm">{threat.location}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold">
            {(threat.probability * 100).toFixed(0)}%
          </div>
          <div className="text-white/70 text-xs capitalize">
            {threat.severity}
          </div>
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        <p className="text-white/80 text-sm">{threat.estimatedImpact}</p>
        <div className="flex justify-between items-center text-xs text-white/60">
          <span>Time to Impact:</span>
          <span className="font-medium">{threat.timeToImpact}</span>
        </div>
      </div>
    </div>
  );
};

// Main Real-Time Dashboard Component
const RealTimeDashboard = ({ user }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data hooks
  const { data: threatData, loading: threatsLoading, lastUpdated: threatsUpdated } = useRealTimeData('threats', 30000);
  const { data: envData, loading: envLoading, lastUpdated: envUpdated } = useRealTimeData('environmental', 10000);
  const { data: ecoData, loading: ecoLoading, lastUpdated: ecoUpdated } = useRealTimeData('ecosystem', 60000);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleThreatDetails = (threat) => {
    setSelectedThreat(threat);
    // In a real app, this might open a modal or navigate to a detailed view
    console.log('View threat details:', threat);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🌊 Real-Time Coastal Monitoring</h1>
            <p className="text-white/70">Live threat assessment and environmental monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-white/70 text-sm">
              <div>Welcome back, {user?.name || 'User'}</div>
              <div>Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70'
              }`}
            >
              <RefreshCw className={`h-5 w-5 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Interactive Map Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MapPin className="h-6 w-6 mr-2" />
              Threat Overview Map
            </h2>
            <div className="flex items-center space-x-4 text-sm text-white/70">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>High Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Moderate Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Low Risk</span>
              </div>
            </div>
          </div>
          <InteractiveMap 
            data={threatData}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        {/* Real-time Environmental Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RealTimeChart 
            title="Wave Height"
            data={envData?.oceanData?.waveHeight}
            color="blue"
            icon={Waves}
            unit="m"
          />
          <RealTimeChart 
            title="Wind Speed"
            data={envData?.weatherData?.windSpeed}
            color="green"
            icon={Wind}
            unit=" km/h"
          />
          <RealTimeChart 
            title="Water Temperature"
            data={envData?.oceanData?.waterTemperature}
            color="red"
            icon={Thermometer}
            unit="°C"
          />
          <RealTimeChart 
            title="Current Speed"
            data={envData?.oceanData?.currentSpeed}
            color="purple"
            icon={Gauge}
            unit=" m/s"
          />
        </div>

        {/* Current Threats */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Active Threats
            </h2>
            {threatData && (
              <div className="text-sm text-white/70">
                Risk Level: <span className={`font-semibold ${
                  threatData.riskLevel === 'high' ? 'text-red-400' :
                  threatData.riskLevel === 'moderate' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {threatData.riskLevel?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {threatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 text-white/70 animate-spin" />
            </div>
          ) : threatData?.currentThreats?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {threatData.currentThreats.map(threat => (
                <ThreatAlertCard 
                  key={threat.id}
                  threat={threat}
                  onViewDetails={handleThreatDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">No active threats detected</p>
              <p className="text-white/50 text-sm">System monitoring normally</p>
            </div>
          )}
        </div>

        {/* Ecosystem Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Mangrove Health</h3>
            {ecoData?.mangroveHealth && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Overall Score</span>
                  <span className="text-2xl font-bold text-green-400">
                    {ecoData.mangroveHealth.overallScore.toFixed(0)}/100
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">NDVI</span>
                    <span className="text-white">{ecoData.mangroveHealth.ndvi.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Biomass</span>
                    <span className="text-white">{ecoData.mangroveHealth.biomass.toFixed(0)} kg/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Biodiversity</span>
                    <span className="text-white">{ecoData.mangroveHealth.biodiversityIndex.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Water Quality</h3>
            {ecoData?.waterQuality && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">pH Level</span>
                  <span className="text-white">{ecoData.waterQuality.pH.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Dissolved O₂</span>
                  <span className="text-white">{ecoData.waterQuality.dissolvedOxygen.toFixed(1)} mg/L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Turbidity</span>
                  <span className="text-white">{ecoData.waterQuality.turbidity.toFixed(1)} NTU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Nitrates</span>
                  <span className="text-white">{ecoData.waterQuality.nitrates.toFixed(1)} mg/L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Chlorophyll</span>
                  <span className="text-white">{ecoData.waterQuality.chlorophyll.toFixed(1)} μg/L</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Sources Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Data Source Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-white font-medium">NOAA Sensors</div>
                <div className="text-white/60 text-sm">Last update: {threatsUpdated?.toLocaleTimeString()}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-white font-medium">Weather Station</div>
                <div className="text-white/60 text-sm">Last update: {envUpdated?.toLocaleTimeString()}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-white font-medium">Satellite Data</div>
                <div className="text-white/60 text-sm">Last update: {ecoUpdated?.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
