import React, { useState, useEffect } from 'react';
import weatherService from '../services/weatherService';
import { 
  MapPin,
  Activity,
  AlertTriangle,
  Info,
  Waves,
  Users,
  Navigation,
  RefreshCw,
  Shield,
  Eye,
  Clock,
  Cloud,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Moon
} from 'lucide-react';

const LocationBasedThreatAnalysis = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [weatherThreats, setWeatherThreats] = useState([]);
  const [historicalAlerts, setHistoricalAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Comprehensive coastal threat database
  const coastalThreatDatabase = [
    {
      id: 1,
      name: "Mumbai Metropolitan Area",
      center: [72.8777, 19.0760],
      radius: 50, // km
      threatLevel: "high",
      floodRisk: 0.8,
      stormSurgeRisk: 0.9,
      coastalErosion: 0.7,
      seaLevelRise: 0.15,
      populationAtRisk: 125000,
      nearestCoast: "Arabian Sea - 5km",
      lastUpdated: "2025-09-10T10:00:00Z",
      predictions: {
        next24h: "High tide expected with moderate flood risk",
        next7days: "Monsoon activity may increase flooding",
        seasonal: "Peak storm season - October to December"
      },
      recommendations: [
        "Avoid low-lying coastal areas during high tide",
        "Keep emergency supplies ready",
        "Monitor weather alerts regularly",
        "Have evacuation route planned"
      ],
      emergencyContacts: [
        "Mumbai Disaster Management: 108",
        "Coast Guard: 1554",
        "Fire Brigade: 101"
      ]
    },
    {
      id: 2,
      name: "Chennai Coastal Region",
      center: [80.2707, 13.0827],
      radius: 40,
      threatLevel: "critical",
      floodRisk: 0.85,
      stormSurgeRisk: 0.95,
      coastalErosion: 0.6,
      seaLevelRise: 0.18,
      populationAtRisk: 200000,
      nearestCoast: "Bay of Bengal - 3km",
      lastUpdated: "2025-09-11T08:15:00Z",
      predictions: {
        next24h: "Cyclone watch in effect - avoid coastal areas",
        next7days: "Severe weather expected mid-week",
        seasonal: "Peak cyclone season - active monitoring required"
      },
      recommendations: [
        "Immediate evacuation if cyclone warning issued",
        "Secure all loose objects",
        "Stock food and water for 3+ days",
        "Stay away from beaches and low areas"
      ],
      emergencyContacts: [
        "Chennai Emergency: 1077",
        "Cyclone Warning: 044-28541993",
        "Coast Guard: 1554"
      ]
    },
    {
      id: 3,
      name: "Goa Coastal Strip",
      center: [73.8567, 15.2993],
      radius: 30,
      threatLevel: "medium",
      floodRisk: 0.5,
      stormSurgeRisk: 0.6,
      coastalErosion: 0.8,
      seaLevelRise: 0.12,
      populationAtRisk: 45000,
      nearestCoast: "Arabian Sea - 2km",
      lastUpdated: "2025-09-09T14:30:00Z",
      predictions: {
        next24h: "Normal conditions with moderate waves",
        next7days: "Beach erosion monitoring ongoing",
        seasonal: "Monsoon retreat - generally stable"
      },
      recommendations: [
        "Beach activities safe with normal precautions",
        "Monitor erosion in vulnerable areas",
        "Follow local tourism safety guidelines",
        "Be aware of strong currents during monsoon"
      ],
      emergencyContacts: [
        "Goa Emergency: 108",
        "Tourist Helpline: 0832-2437728",
        "Coast Guard: 1554"
      ]
    },
    {
      id: 4,
      name: "Kerala Backwater Region",
      center: [76.2711, 9.9312],
      radius: 35,
      threatLevel: "medium",
      floodRisk: 0.6,
      stormSurgeRisk: 0.4,
      coastalErosion: 0.5,
      seaLevelRise: 0.10,
      populationAtRisk: 85000,
      nearestCoast: "Arabian Sea - 8km",
      lastUpdated: "2025-09-08T16:45:00Z",
      predictions: {
        next24h: "Saltwater intrusion monitoring active",
        next7days: "Normal backwater levels expected",
        seasonal: "Post-monsoon stability improving"
      },
      recommendations: [
        "Monitor well water salinity",
        "Protect agricultural areas from saltwater",
        "Maintain traditional coastal protection",
        "Support mangrove conservation efforts"
      ],
      emergencyContacts: [
        "Kerala Emergency: 108",
        "Disaster Management: 0471-2721566",
        "Coast Guard: 1554"
      ]
    },
    {
      id: 5,
      name: "Odisha Cyclone Corridor",
      center: [85.8245, 20.9517],
      radius: 60,
      threatLevel: "critical",
      floodRisk: 0.95,
      stormSurgeRisk: 0.98,
      coastalErosion: 0.85,
      seaLevelRise: 0.20,
      populationAtRisk: 350000,
      nearestCoast: "Bay of Bengal - 12km",
      lastUpdated: "2025-09-12T06:30:00Z",
      predictions: {
        next24h: "High alert - cyclone formation possible",
        next7days: "Extreme weather monitoring continues",
        seasonal: "Most vulnerable period - maximum preparedness required"
      },
      recommendations: [
        "Evacuate coastal villages if warned",
        "Prepare cyclone shelters",
        "Ensure emergency communication systems",
        "Coordinate with disaster management teams"
      ],
      emergencyContacts: [
        "Odisha Emergency: 108",
        "Cyclone Warning: 0674-2534016",
        "NDRF: 011-26701247"
      ]
    },
    {
      id: 6,
      name: "Gujarat Industrial Coast",
      center: [72.1000, 21.7500],
      radius: 45,
      threatLevel: "medium",
      floodRisk: 0.4,
      stormSurgeRisk: 0.5,
      coastalErosion: 0.3,
      seaLevelRise: 0.08,
      populationAtRisk: 95000,
      nearestCoast: "Arabian Sea - 15km",
      lastUpdated: "2025-09-12T12:00:00Z",
      predictions: {
        next24h: "Industrial pollution monitoring active",
        next7days: "Normal coastal conditions",
        seasonal: "Stable period with routine monitoring"
      },
      recommendations: [
        "Monitor industrial discharge impacts",
        "Maintain port infrastructure protection",
        "Regular environmental assessments",
        "Worker safety in coastal industries"
      ],
      emergencyContacts: [
        "Gujarat Emergency: 108",
        "Port Authority: 079-22500000",
        "Pollution Control: 079-23258547"
      ]
    }
  ];

  // Historical alerts database for coastal regions
  const historicalAlertsDatabase = [
    {
      id: 1,
      region: "Mumbai Metropolitan Area",
      coordinates: [72.8777, 19.0760],
      alerts: [
        {
          date: "2025-09-10",
          time: "14:30",
          type: "High Tide Alert",
          severity: "medium",
          description: "Unusually high tide levels expected along Mumbai coastline",
          impact: "Minor flooding in low-lying coastal areas",
          duration: "4 hours",
          status: "resolved"
        },
        {
          date: "2025-09-08",
          time: "22:15",
          type: "Storm Surge Warning",
          severity: "high",
          description: "Severe weather system approaching from Arabian Sea",
          impact: "Potential flooding up to 2km inland",
          duration: "12 hours",
          status: "resolved"
        },
        {
          date: "2025-09-05",
          time: "11:00",
          type: "Cyclone Watch",
          severity: "critical",
          description: "Tropical cyclone formation detected 200km offshore",
          impact: "Extreme weather conditions, potential evacuation required",
          duration: "48 hours",
          status: "resolved"
        }
      ]
    },
    {
      id: 2,
      region: "Chennai Coastal Zone",
      coordinates: [80.2707, 13.0827],
      alerts: [
        {
          date: "2025-09-11",
          time: "09:45",
          type: "Coastal Erosion Alert",
          severity: "medium",
          description: "Accelerated erosion detected at Marina Beach",
          impact: "Infrastructure damage risk, beach access restricted",
          duration: "ongoing",
          status: "active"
        },
        {
          date: "2025-09-07",
          time: "16:20",
          type: "Flash Flood Warning",
          severity: "high",
          description: "Heavy rainfall causing urban coastal flooding",
          impact: "Transportation disruption, waterlogging in 15 areas",
          duration: "8 hours",
          status: "resolved"
        }
      ]
    },
    {
      id: 3,
      region: "Kolkata Delta Region",
      coordinates: [88.3639, 22.5726],
      alerts: [
        {
          date: "2025-09-09",
          time: "06:00",
          type: "Mangrove Degradation Alert",
          severity: "medium",
          description: "Rapid mangrove loss detected in Sundarbans buffer zone",
          impact: "Reduced natural protection against storm surges",
          duration: "ongoing",
          status: "monitoring"
        },
        {
          date: "2025-09-06",
          time: "19:30",
          type: "Salwater Intrusion Warning",
          severity: "high",
          description: "Saltwater contamination spreading inland",
          impact: "Agricultural damage, freshwater source contamination",
          duration: "72 hours",
          status: "resolved"
        }
      ]
    },
    {
      id: 4,
      region: "Kerala Backwaters",
      coordinates: [76.2711, 9.9312],
      alerts: [
        {
          date: "2025-09-12",
          time: "12:15",
          type: "Sea Level Rise Alert",
          severity: "medium",
          description: "Above-normal sea level recorded at multiple stations",
          impact: "Increased risk of coastal inundation",
          duration: "24 hours",
          status: "active"
        },
        {
          date: "2025-09-04",
          time: "08:30",
          type: "Extreme Weather Warning",
          severity: "critical",
          description: "Category 2 cyclone making landfall near Kochi",
          impact: "Severe damage expected, mass evacuation initiated",
          duration: "36 hours",
          status: "resolved"
        }
      ]
    },
    {
      id: 5,
      region: "Odisha Cyclone Corridor",
      coordinates: [85.8245, 20.9517],
      alerts: [
        {
          date: "2025-09-11",
          time: "23:45",
          type: "Super Cyclone Alert",
          severity: "critical",
          description: "Very severe cyclonic storm intensifying over Bay of Bengal",
          impact: "Catastrophic damage potential, immediate evacuation required",
          duration: "60 hours",
          status: "active"
        },
        {
          date: "2025-09-03",
          time: "14:00",
          type: "Storm Surge Alert",
          severity: "high",
          description: "4-meter storm surge heights predicted",
          impact: "Coastal villages at extreme risk",
          duration: "18 hours",
          status: "resolved"
        }
      ]
    },
    {
      id: 6,
      region: "Gujarat Industrial Coast",
      coordinates: [72.1000, 21.7500],
      alerts: [
        {
          date: "2025-09-10",
          time: "10:20",
          type: "Industrial Pollution Alert",
          severity: "medium",
          description: "Chemical discharge detected affecting coastal waters",
          impact: "Marine ecosystem damage, fishing restrictions",
          duration: "ongoing",
          status: "monitoring"
        },
        {
          date: "2025-09-01",
          time: "17:00",
          type: "Port Infrastructure Warning",
          severity: "high",
          description: "Structural damage to breakwater from recent storms",
          impact: "Reduced coastal protection capacity",
          duration: "ongoing",
          status: "repair_in_progress"
        }
      ]
    }
  ];

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch historical alerts for user location
  const fetchHistoricalAlerts = (lat, lng) => {
    console.log('Fetching historical alerts for location:', lat, lng);
    
    // Find the closest region with historical data
    let closestRegion = null;
    let minDistance = Infinity;
    
    historicalAlertsDatabase.forEach(region => {
      const distance = calculateDistance(lat, lng, region.coordinates[1], region.coordinates[0]);
      if (distance < minDistance) {
        minDistance = distance;
        closestRegion = region;
      }
    });
    
    if (closestRegion && minDistance <= 100) { // Within 100km
      // Sort alerts by date (newest first) and add distance info
      const sortedAlerts = closestRegion.alerts
        .map(alert => ({
          ...alert,
          region: closestRegion.region,
          distanceFromUser: minDistance.toFixed(1)
        }))
        .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
      
      setHistoricalAlerts(sortedAlerts);
      console.log('Historical alerts found:', sortedAlerts.length);
    } else {
      // No nearby alerts, set demo alerts for safety awareness
      setHistoricalAlerts([
        {
          date: "2025-09-12",
          time: "10:00",
          type: "General Coastal Alert",
          severity: "low",
          description: "No recent alerts in your immediate area",
          impact: "Continue monitoring weather conditions",
          duration: "ongoing",
          status: "monitoring",
          region: "Your Area",
          distanceFromUser: "0.0"
        }
      ]);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    console.log('Attempting to get current location...');
    
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setError("Geolocation is not supported by this browser");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    console.log('Requesting geolocation permission...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', position.coords);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        analyzeThreatForLocation(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setPermissionDenied(true);
            setError("Location access denied. Please enable location permissions and refresh the page.");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable. Please check your device settings.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred while retrieving location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Manual location input handler
  const handleManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid latitude and longitude values");
      return;
    }
    
    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90");
      return;
    }
    
    if (lng < -180 || lng > 180) {
      setError("Longitude must be between -180 and 180");
      return;
    }
    
    console.log('Using manual location:', lat, lng);
    setUserLocation({ lat, lng });
    setShowManualInput(false);
    setError(null);
    analyzeThreatForLocation(lat, lng);
  };

  // Demo location (Mumbai for testing)
  const useDemoLocation = () => {
    console.log('Using demo location: Mumbai');
    const demoLat = 19.0760;
    const demoLng = 72.8777;
    setUserLocation({ lat: demoLat, lng: demoLng });
    setError(null);
    analyzeThreatForLocation(demoLat, demoLng);
  };

  // Analyze threat for specific location
  const analyzeThreatForLocation = async (lat, lng) => {
    setLoading(true);
    setError(null);
    console.log('Analyzing threat for location:', lat, lng);
    
    try {
      // Get weather data first (with error handling)
      let currentWeather = null;
      let forecast = null;
      let threats = [];

      try {
        console.log('Fetching weather data...');
        const weatherPromises = await Promise.allSettled([
          weatherService.getCurrentWeather(lat, lng),
          weatherService.getWeatherForecast(lat, lng)
        ]);

        if (weatherPromises[0].status === 'fulfilled') {
          currentWeather = weatherPromises[0].value;
          setWeatherData(currentWeather);
          console.log('Weather data received:', currentWeather);
        } else {
          console.warn('Failed to get current weather:', weatherPromises[0].reason);
        }

        if (weatherPromises[1].status === 'fulfilled') {
          forecast = weatherPromises[1].value;
          setWeatherForecast(forecast);
        } else {
          console.warn('Failed to get weather forecast:', weatherPromises[1].reason);
        }

        // Assess weather-related threats
        if (currentWeather) {
          threats = weatherService.assessWeatherThreats(currentWeather, forecast);
          setWeatherThreats(threats);
          console.log('Weather threats assessed:', threats);
        }
      } catch (weatherError) {
        console.warn('Weather service error:', weatherError);
        // Continue without weather data
      }

      // Find nearest coastal threat zone
      let nearestZone = null;
      let minDistance = Infinity;

      coastalThreatDatabase.forEach(zone => {
        const distance = calculateDistance(lat, lng, zone.center[1], zone.center[0]);
        
        if (distance <= zone.radius && distance < minDistance) {
          minDistance = distance;
          nearestZone = { ...zone, distanceFromUser: distance };
        }
      });

      // If no zone found within radius, find the closest one
      if (!nearestZone) {
        coastalThreatDatabase.forEach(zone => {
          const distance = calculateDistance(lat, lng, zone.center[1], zone.center[0]);
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestZone = { 
              ...zone, 
              distanceFromUser: distance,
              isOutsideRadius: true 
            };
          }
        });
      }

      if (nearestZone) {
        // Enhance data with user-specific information and weather data
        const enhancedData = {
          ...nearestZone,
          userCoordinates: { lat, lng },
          analysisTime: new Date().toISOString(),
          isInHighRiskZone: minDistance <= nearestZone.radius && nearestZone.threatLevel === 'critical',
          personalizedRisk: calculatePersonalizedRisk(nearestZone, minDistance, threats),
          weatherData: currentWeather,
          weatherForecast: forecast,
          weatherThreats: threats
        };

        setLocationData(enhancedData);
        console.log('Location analysis complete:', enhancedData);
      } else {
        setLocationData({
          userCoordinates: { lat, lng },
          analysisTime: new Date().toISOString(),
          noThreatData: true,
          weatherData: currentWeather,
          weatherForecast: forecast,
          message: "No coastal threat data available for your location"
        });
      }

      // Fetch historical alerts for this location
      fetchHistoricalAlerts(lat, lng);
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze location data. Please try again.');
    }

    setLoading(false);
  };

  // Calculate personalized risk based on distance, zone data, and weather
  const calculatePersonalizedRisk = (zone, distance, weatherThreats = []) => {
    const baseRisk = (zone.floodRisk + zone.stormSurgeRisk + zone.coastalErosion) / 3;
    
    // Reduce risk based on distance from zone center
    const distanceFactor = Math.max(0, 1 - (distance / zone.radius));
    let personalizedRisk = baseRisk * distanceFactor;

    // Weather enhancement factor
    let weatherMultiplier = 1;
    if (weatherThreats && weatherThreats.length > 0) {
      weatherThreats.forEach(threat => {
        switch (threat.severity) {
          case 'high':
            weatherMultiplier += 0.2;
            break;
          case 'medium':
            weatherMultiplier += 0.1;
            break;
          case 'low':
            weatherMultiplier += 0.05;
            break;
        }
      });
    }

    personalizedRisk = Math.min(personalizedRisk * weatherMultiplier, 1);

    return {
      overallRisk: personalizedRisk,
      riskLevel: personalizedRisk > 0.7 ? 'high' : personalizedRisk > 0.4 ? 'medium' : 'low',
      immediateAction: personalizedRisk > 0.8,
      description: getPersonalizedRiskDescription(personalizedRisk, distance, zone.threatLevel, weatherThreats),
      weatherEnhanced: weatherThreats && weatherThreats.length > 0
    };
  };

  const getPersonalizedRiskDescription = (risk, distance, zoneThreat, weatherThreats = []) => {
    const weatherWarning = weatherThreats && weatherThreats.length > 0 
      ? ` Weather alerts active: ${weatherThreats.map(t => t.type).join(', ')}.`
      : '';
    
    if (risk > 0.8) return `IMMEDIATE RISK: You are in a high-threat coastal zone. Take precautions now.${weatherWarning}`;
    if (risk > 0.6) return `HIGH RISK: You are ${distance.toFixed(1)}km from a ${zoneThreat} threat zone. Stay alert.${weatherWarning}`;
    if (risk > 0.3) return `MODERATE RISK: You are ${distance.toFixed(1)}km from coastal threats. Monitor conditions.${weatherWarning}`;
    return `LOW RISK: You are ${distance.toFixed(1)}km from the nearest coastal threat zone.${weatherWarning}`;
  };

  const getThreatColor = (level) => {
    const colors = {
      critical: 'bg-red-500 border-red-600 text-white',
      high: 'bg-orange-500 border-orange-600 text-white',
      medium: 'bg-yellow-500 border-yellow-600 text-white',
      low: 'bg-green-500 border-green-600 text-white'
    };
    return colors[level] || colors.low;
  };

  const getRiskBadgeColor = (level) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[level] || colors.low;
  };

  // Auto-detect location on component mount
  useEffect(() => {
    console.log('Component mounted, attempting to get location...');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, showing manual input options');
      setError("Geolocation is not supported by this browser. Please use manual input or demo location.");
      return;
    }
    
    // Try to get location
    getCurrentLocation();
  }, []);

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-4 overflow-y-auto">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center mb-2">
              <Navigation className="mr-2 h-5 w-5 text-blue-600" />
              Your Location Threat Analysis
            </h2>
            <p className="text-sm text-gray-600">
              Real-time coastal threat assessment based on your current location
            </p>
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Locating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Location</h3>
          <p className="text-gray-600">Getting your coordinates and checking coastal threat data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-800">Location Access Error</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          {permissionDenied && (
            <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>To enable location access:</strong><br/>
                1. Click the location icon in your browser's address bar<br/>
                2. Select "Allow" for location permissions<br/>
                3. Refresh this page
              </p>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enter Location Manually
              </button>
              <button
                onClick={useDemoLocation}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Use Demo Location (Mumbai)
              </button>
            </div>

            {/* Manual Location Input */}
            {showManualInput && (
              <div className="bg-white border border-gray-300 rounded p-4 space-y-3">
                <h4 className="font-semibold text-gray-800">Enter Your Coordinates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g., 19.0760"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g., 72.8777"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleManualLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Analyze This Location
                </button>
                <p className="text-xs text-gray-500">
                  You can find your coordinates using Google Maps or any GPS app
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial State - No Location Yet */}
      {!loading && !error && !locationData && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-4">Get Your Location-Based Threat Analysis</h3>
          <p className="text-gray-600 mb-6">
            We need your location to provide personalized coastal threat information and weather data for your area.
          </p>
          <div className="space-y-3">
            <button
              onClick={getCurrentLocation}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Allow Location Access
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowManualInput(true)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Enter Manually
              </button>
              <button
                onClick={useDemoLocation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Use Demo (Mumbai)
              </button>
            </div>
            
            {/* Manual Location Input for initial state */}
            {showManualInput && (
              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-3 text-left">
                <h4 className="font-semibold text-gray-800">Enter Your Coordinates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g., 19.0760"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g., 72.8777"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleManualLocation}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Analyze This Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Data Display */}
      {locationData && !loading && !error && (
        <div className="space-y-6">
          {/* Current Location Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                Your Current Location
              </h3>
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(locationData.analysisTime).toLocaleString()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Latitude</div>
                <div className="font-semibold">{locationData.userCoordinates.lat.toFixed(6)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Longitude</div>
                <div className="font-semibold">{locationData.userCoordinates.lng.toFixed(6)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Distance to Coast</div>
                <div className="font-semibold">{locationData.nearestCoast || 'Calculating...'}</div>
              </div>
            </div>

            {locationData.distanceFromUser && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-800">
                  <strong>Nearest Threat Zone:</strong> {locationData.name} 
                  ({locationData.distanceFromUser.toFixed(1)}km away)
                  {locationData.isOutsideRadius && (
                    <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">(Outside primary risk zone)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* No Threat Data */}
          {locationData.noThreatData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Safe Location</h3>
              <p className="text-green-700">{locationData.message}</p>
            </div>
          )}

          {/* Personalized Risk Assessment */}
          {locationData.personalizedRisk && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Activity className="h-5 w-5 text-orange-600 mr-2" />
                Your Personal Risk Assessment
              </h3>
              
              <div className={`p-4 rounded-lg border-2 ${getRiskBadgeColor(locationData.personalizedRisk.riskLevel)} mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Overall Risk Level</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium">
                    {locationData.personalizedRisk.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm">{locationData.personalizedRisk.description}</p>
              </div>

              {locationData.personalizedRisk.immediateAction && (
                <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg mb-4">
                  <div className="flex items-center text-red-800 font-semibold mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    IMMEDIATE ACTION REQUIRED
                  </div>
                  <p className="text-red-700">You are in a high-risk area. Follow emergency recommendations immediately.</p>
                </div>
              )}

              {/* Risk Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600 flex items-center">
                      <Waves className="mr-1 h-4 w-4" />
                      Flood Risk
                    </span>
                    <span className="font-semibold">{(locationData.floodRisk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-600 flex items-center">
                      <Activity className="mr-1 h-4 w-4" />
                      Storm Surge
                    </span>
                    <span className="font-semibold">{(locationData.stormSurgeRisk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600 flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      People at Risk
                    </span>
                    <span className="font-semibold">{locationData.populationAtRisk?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weather Information */}
          {weatherData && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Cloud className="h-5 w-5 text-blue-600 mr-2" />
                Current Weather Conditions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Temperature</div>
                  <div className="font-semibold text-lg">{Math.round(weatherData.main.temp)}°C</div>
                  <div className="text-xs text-blue-500">Feels like {Math.round(weatherData.main.feels_like)}°C</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Humidity</div>
                  <div className="font-semibold text-lg">{weatherData.main.humidity}%</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-yellow-600">Wind Speed</div>
                  <div className="font-semibold text-lg">{weatherData.wind?.speed || 'N/A'} m/s</div>
                  {weatherData.wind?.deg && (
                    <div className="text-xs text-yellow-500">{weatherData.wind.deg}° direction</div>
                  )}
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600">Pressure</div>
                  <div className="font-semibold text-lg">{weatherData.main.pressure} hPa</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className="text-sm text-gray-600">Conditions:</div>
                  <div className="ml-2 font-medium">{weatherData.weather[0].description}</div>
                </div>
                <div className="text-xs text-gray-500">
                  Updated: {new Date(weatherData.dt * 1000).toLocaleTimeString()}
                </div>
              </div>

              {/* Weather Threats */}
              {weatherThreats && weatherThreats.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                    Weather Alerts
                  </h4>
                  <div className="space-y-2">
                    {weatherThreats.map((threat, index) => (
                      <div key={index} className={`p-3 rounded border-l-4 ${
                        threat.severity === 'high' ? 'bg-red-50 border-red-400' :
                        threat.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-blue-50 border-blue-400'
                      }`}>
                        <div className="font-medium">{threat.type}</div>
                        <div className="text-sm text-gray-600">{threat.description}</div>
                        {threat.recommendation && (
                          <div className="text-sm font-medium mt-1">Recommendation: {threat.recommendation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Predictions & Forecasts */}
          {locationData.predictions && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Eye className="h-5 w-5 text-purple-600 mr-2" />
                Threat Predictions for Your Area
              </h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="font-semibold text-red-800">Next 24 Hours</div>
                  <div className="text-red-700">{locationData.predictions.next24h}</div>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="font-semibold text-orange-800">Next 7 Days</div>
                  <div className="text-orange-700">{locationData.predictions.next7days}</div>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="font-semibold text-blue-800">Seasonal Outlook</div>
                  <div className="text-blue-700">{locationData.predictions.seasonal}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {locationData.recommendations && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                Personalized Recommendations
              </h3>
              
              <div className="space-y-3">
                {locationData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-green-800">{rec}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Alerts */}
          {historicalAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Clock className="h-5 w-5 text-orange-600 mr-2" />
                Past Alerts & Safety History
                <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                  {historicalAlerts.length} alerts
                </span>
              </h3>
              
              <div className="space-y-4">
                {historicalAlerts.slice(0, 5).map((alert, index) => {
                  const severityColors = {
                    critical: 'border-red-500 bg-red-50',
                    high: 'border-orange-500 bg-orange-50',
                    medium: 'border-yellow-500 bg-yellow-50',
                    low: 'border-green-500 bg-green-50'
                  };
                  
                  const statusColors = {
                    active: 'bg-red-100 text-red-800',
                    resolved: 'bg-green-100 text-green-800',
                    monitoring: 'bg-blue-100 text-blue-800',
                    repair_in_progress: 'bg-orange-100 text-orange-800'
                  };

                  return (
                    <div key={index} className={`border-l-4 p-4 rounded-r ${severityColors[alert.severity] || 'border-gray-500 bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{alert.type}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[alert.status] || 'bg-gray-100 text-gray-800'}`}>
                              {alert.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Impact:</strong> {alert.impact}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>📅 {alert.date} at {alert.time}</span>
                            <span>⏱️ Duration: {alert.duration}</span>
                            <span>📍 {alert.distanceFromUser}km from you</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {alert.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                          {alert.severity === 'high' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                          {alert.severity === 'medium' && <Info className="h-5 w-5 text-yellow-500" />}
                          {alert.severity === 'low' && <Shield className="h-5 w-5 text-green-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {historicalAlerts.length > 5 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500">
                      Showing recent 5 alerts out of {historicalAlerts.length} total
                    </span>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-800">
                    <strong>💡 Safety Tip:</strong> Stay informed about past incidents to better prepare for future threats. 
                    Review patterns in alert frequency and types for your area.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contacts */}
          {locationData.emergencyContacts && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Contacts for Your Area
              </h3>
              
              <div className="space-y-2">
                {locationData.emergencyContacts.map((contact, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-red-300">
                    <div className="font-semibold text-red-800">{contact}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                <div className="text-sm text-red-800">
                  <strong>In case of emergency:</strong> Call the appropriate number above or dial 112 for general emergency services.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationBasedThreatAnalysis;