import React, { useState } from 'react';
import { 
  MapPin, 
  Satellite, 
  AlertTriangle, 
  Shield,
  Navigation,
  Cloud,
  Waves,
  Users,
  Clock
} from 'lucide-react';

const SimpleMapboxFallback = () => {
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    console.log('Attempting to get current location in fallback...');
    
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setError("Geolocation is not supported by this browser");
      return;
    }

    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    console.log('Requesting geolocation permission...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained in fallback:', position.coords);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLoading(false);
        
        // Find nearest threat zone
        const nearest = findNearestThreatZone(latitude, longitude);
        if (nearest) {
          setSelectedThreat(nearest);
        }
      },
      (error) => {
        console.error('Geolocation error in fallback:', error);
        setLoading(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setPermissionDenied(true);
            setError("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("An unknown error occurred while retrieving location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find nearest threat zone to user location
  const findNearestThreatZone = (userLat, userLng) => {
    let nearestZone = null;
    let minDistance = Infinity;

    threatZones.forEach(zone => {
      const distance = calculateDistance(userLat, userLng, zone.coordinates[1], zone.coordinates[0]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = { ...zone, distanceFromUser: distance };
      }
    });

    return nearestZone;
  };

  // Auto-detect location on component mount
  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  // Sample threat data for demonstration
  const threatZones = [
    {
      id: 1,
      name: "Mumbai High Risk Zone",
      threatLevel: "critical",
      riskScore: 85,
      population: 150000,
      location: "Mumbai, Maharashtra",
      coordinates: [72.8777, 19.0760],
      alerts: ["Storm surge warning", "High tide alert"],
      description: "Critical coastal flooding risk due to high tide and storm surge conditions."
    },
    {
      id: 2,
      name: "Chennai Marina Beach Alert",
      threatLevel: "high", 
      riskScore: 75,
      population: 120000,
      location: "Chennai, Tamil Nadu",
      coordinates: [80.2785, 13.0475],
      alerts: ["Cyclone watch", "Heavy rainfall"],
      description: "High risk of coastal flooding and cyclone impact."
    },
    {
      id: 3,
      name: "Kerala Backwater Region",
      threatLevel: "medium",
      riskScore: 55,
      population: 85000,
      location: "Kochi, Kerala", 
      coordinates: [76.2673, 9.9312],
      alerts: ["Saltwater intrusion monitoring"],
      description: "Medium risk of saltwater intrusion in backwater areas."
    }
  ];

  const getThreatColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500 border-red-600';
      case 'high': return 'bg-orange-500 border-orange-600'; 
      case 'medium': return 'bg-yellow-500 border-yellow-600';
      default: return 'bg-green-500 border-green-600';
    }
  };

  const getThreatTextColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-800';
      case 'high': return 'text-orange-800';
      case 'medium': return 'text-yellow-800'; 
      default: return 'text-green-800';
    }
  };

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Satellite className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold">Coastal Threat Monitoring</h2>
          </div>
          <div className="flex items-center gap-2">
            {userLocation && (
              <div className="text-sm text-green-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </div>
            )}
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>Get Location</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
            {permissionDenied && (
              <div className="mt-2 text-xs text-red-600">
                <p><strong>To enable location:</strong></p>
                <p>1. Click the location icon in your browser's address bar</p>
                <p>2. Select "Allow" for location permissions</p>
                <p>3. Refresh this page</p>
              </div>
            )}
          </div>
        )}
        
        {/* Success Message */}
        {userLocation && selectedThreat && selectedThreat.distanceFromUser && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center text-green-800">
              <Shield className="h-4 w-4 mr-2" />
              <span className="text-sm">
                Nearest threat zone: <strong>{selectedThreat.name}</strong> 
                ({selectedThreat.distanceFromUser.toFixed(1)}km away)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-5rem)]">
        {/* Threat Zones List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg overflow-y-auto">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            Active Threat Zones
          </h3>
          
          <div className="space-y-3">
            {threatZones.map((zone) => (
              <div 
                key={zone.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedThreat?.id === zone.id ? 'ring-2 ring-blue-500' : ''
                } ${getThreatColor(zone.threatLevel)} bg-opacity-10`}
                onClick={() => setSelectedThreat(zone)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">{zone.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatColor(zone.threatLevel)} text-white`}>
                    {zone.threatLevel.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {zone.location}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-blue-600" />
                    <span>{zone.population.toLocaleString()} at risk</span>
                  </div>
                  <div className="flex items-center">
                    <Waves className="h-4 w-4 mr-1 text-blue-600" />
                    <span>{zone.riskScore}% risk score</span>
                  </div>
                </div>
                
                {zone.alerts.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-gray-700">Active Alerts:</div>
                    {zone.alerts.map((alert, idx) => (
                      <div key={idx} className="text-xs text-red-600 flex items-center mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {alert}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detailed View */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          {selectedThreat ? (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                Threat Details: {selectedThreat.name}
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getThreatColor(selectedThreat.threatLevel)} bg-opacity-20`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Threat Level</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getThreatColor(selectedThreat.threatLevel)} text-white`}>
                      {selectedThreat.threatLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedThreat.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-blue-600 font-medium">Population at Risk</div>
                    <div className="text-xl font-bold">{selectedThreat.population.toLocaleString()}</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <div className="text-sm text-orange-600 font-medium">Risk Score</div>
                    <div className="text-xl font-bold">{selectedThreat.riskScore}%</div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Active Alerts
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {selectedThreat.alerts.map((alert, idx) => (
                      <li key={idx}>{alert}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-800 mb-2">Location Information</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Location:</strong> {selectedThreat.location}</div>
                    <div><strong>Coordinates:</strong> {selectedThreat.coordinates[1].toFixed(4)}, {selectedThreat.coordinates[0].toFixed(4)}</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Recommended Actions</h4>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    {selectedThreat.threatLevel === 'critical' && (
                      <>
                        <li>Immediate evacuation may be required</li>
                        <li>Move to higher ground</li>
                        <li>Follow official evacuation routes</li>
                      </>
                    )}
                    {selectedThreat.threatLevel === 'high' && (
                      <>
                        <li>Prepare for potential evacuation</li>
                        <li>Monitor weather updates closely</li>
                        <li>Secure loose objects</li>
                      </>
                    )}
                    {selectedThreat.threatLevel === 'medium' && (
                      <>
                        <li>Stay informed about weather conditions</li>
                        <li>Review emergency plans</li>
                        <li>Check emergency supplies</li>
                      </>
                    )}
                    <li>Contact local emergency services if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Threat Zone</h3>
                <p className="text-gray-500">Click on a threat zone from the list to view detailed information and recommendations.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-medium mb-2">Threat Levels</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Critical Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Low Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapboxFallback;