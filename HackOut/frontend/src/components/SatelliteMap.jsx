import React, { useState, useEffect, useRef } from 'react';

// Use the SatelliteMapWorking component instead since it's working correctly
// This component now works the same way as SatelliteMapWorking
const SatelliteMap = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  
  // Map center coordinates (Miami, FL)
  const mapCenter = { lat: 25.7617, lng: -80.1918 };
  
  useEffect(() => {
    // Initialize map when component mounts
    initMap();
    
    // Cleanup function
    return () => {
      if (markers.length > 0) {
        markers.forEach(marker => {
          if (marker && marker.setMap) marker.setMap(null);
        });
        setMarkers([]);
      }
    };
  }, []);
  
  // Initialize the Google Maps
  const initMap = () => {
    // Check if the map is already initialized
    if (map) return;
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      createMap();
      return;
    }
    
    // If Google Maps script is not loaded, create it
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDzSyOCYorH5j3BdRESxMvjQx5-ShAfM1w&libraries=geometry';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps script loaded');
      createMap();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps API');
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
  };
  
  // Create the map instance
  const createMap = () => {
    try {
      if (!mapRef.current || !window.google || !window.google.maps) {
        console.error('❌ Map container or Google Maps not available');
        setError('Map initialization failed');
        setIsLoading(false);
        return;
      }
      
      // Create map instance
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 10,
        mapTypeId: window.google.maps.MapTypeId.SATELLITE,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      });
      
      console.log('✅ Map instance created successfully');
      setMap(mapInstance);
      setIsLoading(false);
      
      // Add sample markers
      addSampleMarkers(mapInstance);
      
    } catch (err) {
      console.error('💥 Error creating map:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  // Add sample markers to the map
  const addSampleMarkers = (mapInstance) => {
    const threatLocations = [
      { 
        position: { lat: 25.7617, lng: -80.1918 },
        title: 'Miami Beach - High Tide Warning',
        color: '#f59e0b' // Amber
      },
      {
        position: { lat: 25.7742, lng: -80.1324 },
        title: 'Virginia Key - Storm Surge Risk',
        color: '#ef4444' // Red
      },
      {
        position: { lat: 25.8654, lng: -80.1228 },
        title: 'Sunny Isles - Coastal Erosion',
        color: '#10b981' // Green
      },
      {
        position: { lat: 25.7725, lng: -80.1323 },
        title: 'Biscayne Bay - Water Quality Alert',
        color: '#3b82f6' // Blue
      }
    ];
    
    // Add each marker to the map
    threatLocations.forEach(location => {
      addMarker(location.position, location.title, location.color, mapInstance);
    });
  };
  
  // Add a marker to the map
  const addMarker = (position, title, color, mapInstance) => {
    console.log('🎯 Adding marker:', { position, title, color });
    
    try {
      const marker = new window.google.maps.Marker({
        position: position,
        map: mapInstance,
        title: title,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10,
        }
      });
      
      // Add click event listener
      window.google.maps.event.addListener(marker, 'click', () => {
        // Create an info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div class="info-window">
            <h3 class="font-bold">${title}</h3>
            <p class="mt-2">Detected at ${new Date().toLocaleString()}</p>
            <div class="mt-2 p-2 bg-blue-50 rounded">
              <span class="font-semibold">Status:</span> Active
            </div>
          </div>`
        });
        
        infoWindow.open(mapInstance, marker);
      });
      
      // Store the marker
      setMarkers(prev => [...prev, marker]);
      console.log('✅ Marker successfully added');
      console.log('📍 Total markers now:', markers.length + 1);
      
      return marker;
    } catch (err) {
      console.error('❌ Error adding marker:', err);
      return null;
    }
  };
              clearInterval(checkInterval);
              resolve(window.google.maps);
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for Google Maps API'));
          }, 10000);
          
          return;
        }

        // Start loading
        googleMapsLoading = true;
        console.log('📡 Loading Google Maps API script...');
        setLoadingStatus('Downloading Google Maps script...');
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDzSyOCYorH5j3BdRESxMvjQx5-ShAfM1w&libraries=geometry&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('📜 Google Maps script loaded');
          setLoadingStatus('Google Maps script loaded, initializing...');
          
          // Wait a bit for the API to fully initialize
          setTimeout(() => {
            if (window.google && window.google.maps) {
              console.log('✅ Google Maps API available');
              googleMapsLoaded = true;
              googleMapsLoading = false;
              resolve(window.google.maps);
            } else {
              console.error('❌ Google Maps API not available after script load');
              googleMapsLoading = false;
              reject(new Error('Google Maps API failed to initialize'));
            }
          }, 500);
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load Google Maps script');
          googleMapsLoading = false;
          reject(new Error('Failed to load Google Maps script'));
        };
        
        document.head.appendChild(script);
      });
    };

    loadGoogleMaps()
      .then((google) => {
        console.log('🎉 Google Maps API loaded successfully, initializing map...');
        setLoadingStatus('Creating map instance...');
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          initializeMap(google);
        }, 100);
      })
      .catch((error) => {
        console.error('💥 Error loading Google Maps:', error);
        setLoadingError(error.message);
        setLoadingStatus('Error: ' + error.message);
      });

    // Cleanup function
    return () => {
      if (markers.length > 0) {
        markers.forEach(marker => {
          if (marker.setMap) marker.setMap(null);
        });
      }
    };
  }, []);

  // Initialize the map
  const initializeMap = (google) => {
    console.log('🗺️ Initializing map, mapRef.current:', !!mapRef.current);
    if (!mapRef.current) {
      console.error('❌ Map container not available');
      return;
    }

    try {
      console.log('🎯 Creating Google Maps instance...');
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_CENTER,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.TERRAIN
          ]
        },
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true
      });

      console.log('✅ Map instance created successfully');
      setMap(mapInstance);
      setLoadingStatus('Map loaded successfully!');
      
      // Add sample markers
      addMarkersToMap(mapInstance, google);
    } catch (error) {
      console.error('💥 Error creating map:', error);
      setLoadingError('Error creating map: ' + error.message);
    }
  };

  // Add markers to the map
  const addMarkersToMap = (mapInstance, google) => {
    const newMarkers = [];

    // Sample threat markers
    const sampleThreats = [
      {
        id: 1,
        type: 'Hurricane',
        severity: 'high',
        lat: mapCenter.lat + 0.05,
        lng: mapCenter.lng + 0.05,
        title: 'Hurricane Warning'
      },
      {
        id: 2,
        type: 'Storm Surge',
        severity: 'medium',
        lat: mapCenter.lat - 0.03,
        lng: mapCenter.lng + 0.02,
        title: 'Storm Surge Alert'
      },
      {
        id: 3,
        type: 'Coastal Flooding',
        severity: 'low',
        lat: mapCenter.lat + 0.02,
        lng: mapCenter.lng - 0.04,
        title: 'Coastal Flood Warning'
      }
    ];

    sampleThreats.forEach((threat) => {
      const marker = new google.maps.Marker({
        position: { lat: threat.lat, lng: threat.lng },
        map: mapInstance,
        title: threat.title,
        icon: {
          url: getMarkerIcon(threat.severity),
          scaledSize: new google.maps.Size(30, 30)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${threat.title}</h3>
            <p style="margin: 0; color: #666;">Type: ${threat.type}</p>
            <p style="margin: 0; color: #666;">Severity: ${threat.severity}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  };

  // Get marker icon based on severity
  const getMarkerIcon = (severity) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };
    
    const color = colors[severity] || '#6b7280';
    
    return `data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodeURIComponent(color)}'%3e%3cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3e%3c/svg%3e`;
  };

  // Change map layer
  const changeMapLayer = (layerType) => {
    if (!map) return;
    setSelectedLayer(layerType);
    
    switch (layerType) {
      case 'satellite':
        map.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
        break;
      case 'hybrid':
        map.setMapTypeId(window.google.maps.MapTypeId.HYBRID);
        break;
      case 'terrain':
        map.setMapTypeId(window.google.maps.MapTypeId.TERRAIN);
        break;
      case 'roadmap':
        map.setMapTypeId(window.google.maps.MapTypeId.ROADMAP);
        break;
      default:
        map.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden h-full">
      {/* Header */}
      <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">🛰️ Coastal Monitoring Satellite View</h3>
          <div className="flex space-x-2">
            {['satellite', 'hybrid', 'terrain', 'roadmap'].map((layer) => (
              <button
                key={layer}
                onClick={() => changeMapLayer(layer)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedLayer === layer
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
              >
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: 'calc(100% - 60px)' }}>
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        />
        
        {/* Loading overlay */}
        {!map && !loadingError && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300 text-lg">{loadingStatus}</p>
              <p className="text-gray-500 text-sm mt-2">This may take a few moments...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {loadingError && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-red-400">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-lg font-semibold mb-2">Map Loading Error</p>
              <p className="text-sm mb-4">{loadingError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded">
          <h4 className="font-semibold mb-2">🌊 Threat Levels</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span>High Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Low Risk</span>
            </div>
          </div>
        </div>

        {/* Map Stats */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded">
          <div className="text-sm">
            <div>📍 Active Threats: {markers.length}</div>
            <div>🗺️ View: {selectedLayer}</div>
            <div>📡 Status: {map ? 'Connected' : 'Loading...'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteMap;
