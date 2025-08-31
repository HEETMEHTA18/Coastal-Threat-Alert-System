import React, { useState, useEffect, useRef } from 'react';

const SatelliteMapWorking = () => {
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const geocoder = useRef(null);

  useEffect(() => {
    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDzSyOCYorH5j3BdRESxMvjQx5-ShAfM1w&libraries=geometry';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      initMap();
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (window.initGoogleMap) {
        delete window.initGoogleMap;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    
    try {
      // Use window.google instead of google to avoid undefined errors
      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not available');
        setError('Google Maps API not available');
        setIsLoading(false);
        return;
      }
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 }, // Center on India
        zoom: 5,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      });
      
      // Initialize geocoder
      geocoder.current = new google.maps.Geocoder();
      
      setMap(mapInstance);
      setIsLoading(false);
      
      // Add Indian coastal areas
      addIndianCoastalAreas(mapInstance);
      
      // Try to get user's current location
      getUserLocation(mapInstance);
      
    } catch (err) {
      setError('Failed to initialize map: ' + err.message);
      setIsLoading(false);
    }
  };

  const addIndianCoastalAreas = (mapInstance) => {
    // Array of major Indian coastal areas with coordinates
    const indianCoastalAreas = [
      { 
        position: { lat: 18.9256, lng: 72.8245 }, 
        title: 'Mumbai', 
        description: 'Maharashtra\'s coastal capital with significant port facilities',
        color: '#e53935' // Red
      },
      { 
        position: { lat: 13.0827, lng: 80.2707 }, 
        title: 'Chennai', 
        description: 'Capital of Tamil Nadu with one of India\'s largest ports',
        color: '#fb8c00' // Orange
      },
      { 
        position: { lat: 22.5726, lng: 88.3639 }, 
        title: 'Kolkata', 
        description: 'Port city on the Bay of Bengal delta',
        color: '#43a047' // Green
      },
      { 
        position: { lat: 15.4989, lng: 73.8278 }, 
        title: 'Goa', 
        description: 'Popular coastal state with beautiful beaches',
        color: '#1e88e5' // Blue
      },
      { 
        position: { lat: 9.9252, lng: 76.2673 }, 
        title: 'Kochi', 
        description: 'Major port city in Kerala with historic significance',
        color: '#8e24aa' // Purple
      },
      { 
        position: { lat: 17.6868, lng: 83.2185 }, 
        title: 'Visakhapatnam', 
        description: 'Major port and industrial center in Andhra Pradesh',
        color: '#d81b60' // Pink
      },
      { 
        position: { lat: 11.9416, lng: 79.8083 }, 
        title: 'Pondicherry', 
        description: 'Former French colony with distinctive coastal architecture',
        color: '#00897b' // Teal
      },
      { 
        position: { lat: 16.5062, lng: 80.6480 }, 
        title: 'Vijayawada', 
        description: 'Commercial center in Andhra Pradesh',
        color: '#f4511e' // Deep Orange
      },
      { 
        position: { lat: 20.2961, lng: 85.8245 }, 
        title: 'Puri', 
        description: 'Coastal temple town in Odisha',
        color: '#6d4c41' // Brown
      },
      { 
        position: { lat: 8.0883, lng: 77.5385 }, 
        title: 'Kanyakumari', 
        description: 'Southernmost tip of mainland India',
        color: '#546e7a' // Blue Grey
      }
    ];

    // Add markers for each coastal area
    indianCoastalAreas.forEach(location => {
      addMarker(
        location.position,
        location.title,
        location.color,
        mapInstance,
        location.description
      );
    });

    // Set bounds to focus on India
    const bounds = new window.google.maps.LatLngBounds();
    indianCoastalAreas.forEach(location => {
      bounds.extend(location.position);
    });
    mapInstance.fitBounds(bounds);
  };

  const getUserLocation = (mapInstance) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setUserLocation(userPos);
          
          // Add user location marker
          addMarker(
            userPos,
            'Your Current Location',
            '#10b981',
            mapInstance
          );
          
          // Optional: Center map on user location
          // mapInstance.setCenter(userPos);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  };

  const addMarker = (position, title, color, mapInstance, description) => {
    console.log('🎯 Adding marker:', { position, title, color });
    
    try {
      const marker = new window.google.maps.Marker({
        position: position,
        map: mapInstance,
        title: title,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodeURIComponent(color)}'%3e%3cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3e%3c/svg%3e`,
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 240px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${title}</h3>
            ${description ? `<p style="margin: 0 0 8px 0; color: #555; font-size: 14px;">${description}</p>` : ''}
            <p style="margin: 0; color: #666; font-size: 13px;">
              <strong>Coordinates:</strong><br>
              Latitude: ${position.lat.toFixed(6)}<br>
              Longitude: ${position.lng.toFixed(6)}
            </p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <small style="color: #888;">Indian Coastal Monitoring • CTAS</small>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close any open info windows
        markers.forEach(({ infoWindow: iw }) => {
          if (iw) iw.close();
        });
        infoWindow.open(mapInstance, marker);
      });

      // Make marker draggable for user convenience
      marker.setDraggable(true);
      
      marker.addListener('dragend', (event) => {
        const newPos = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        
        // Update info window content with new coordinates
        infoWindow.setContent(`
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${title} (Moved)</h3>
            <p style="margin: 0; color: #666; font-size: 13px;">
              <strong>New Coordinates:</strong><br>
              Latitude: ${newPos.lat.toFixed(6)}<br>
              Longitude: ${newPos.lng.toFixed(6)}
            </p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <small style="color: #888;">Marker was dragged to this position</small>
            </div>
          </div>
        `);
      });

      const markerData = { marker, infoWindow, title, position };
      setMarkers(prev => {
        const newMarkers = [...prev, markerData];
        console.log('📍 Total markers now:', newMarkers.length);
        return newMarkers;
      });
      
      console.log('✅ Marker successfully added');
      return marker;
      
    } catch (error) {
      console.error('❌ Error adding marker:', error);
      return null;
    }
  };

  const searchForLocation = async () => {
    if (!searchLocation.trim() || !geocoder.current || !map) {
      console.log('Search conditions not met:', { 
        searchLocation: searchLocation.trim(), 
        geocoder: !!geocoder.current, 
        map: !!map 
      });
      return;
    }

    console.log('🔍 Searching for location:', searchLocation);

    try {
      const result = await new Promise((resolve, reject) => {
        geocoder.current.geocode(
          { address: searchLocation },
          (results, status) => {
            console.log('Geocoding status:', status);
            console.log('Geocoding results:', results);
            
            if (status === 'OK' && results && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      const position = {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng()
      };

      console.log('📍 Found location:', position);
      console.log('📍 Address:', result.formatted_address);

      // Add marker for searched location
      const newMarker = addMarker(
        position,
        `📍 ${result.formatted_address}`,
        '#ef4444',
        map
      );

      console.log('✅ Marker added:', newMarker);

      // Center and zoom to the new location
      map.setCenter(position);
      map.setZoom(14);

      setSearchLocation(''); // Clear search input
      
    } catch (error) {
      console.error('❌ Search error:', error);
      alert(`Location not found: ${error.message}. Please try a different search term.`);
    }
  };

  const clearAllMarkers = () => {
    markers.forEach(({ marker }) => {
      marker.setMap(null);
    });
    setMarkers([]);
    
    // Re-add default Miami marker
    if (map) {
      addMarker(
        { lat: 25.7617, lng: -80.1918 },
        'Miami, FL - Default Location',
        '#2563eb',
        map
      );
    }
  };

  const goToUserLocation = () => {
    if (userLocation && map) {
      map.setCenter(userLocation);
      map.setZoom(15);
    } else {
      getUserLocation(map);
    }
  };

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden h-full p-6">
        <div className="text-center text-red-400">
          <div className="text-2xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Map Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden h-full">
      {/* Header with Search */}
      <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">🛰️ Satellite Map</h3>
            <div className="text-sm text-gray-300">
              📍 {markers.length} location(s) marked
            </div>
          </div>
          
          {/* Location Search */}
          <div className="flex space-x-2">
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchForLocation()}
                placeholder="Search for any location (e.g., New York, Tokyo, coordinates...)"
                className="flex-1 px-3 py-2 bg-gray-600 text-white placeholder-gray-400 rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                onClick={searchForLocation}
                disabled={!searchLocation.trim() || !map}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm font-medium"
              >
                🔍 Search
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={goToUserLocation}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                title="Go to my location"
              >
                📍 My Location
              </button>
              <button
                onClick={clearAllMarkers}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                title="Clear all markers"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative h-full">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-300">Loading map...</p>
            </div>
          </div>
        )}

        {/* Location Info Panel */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded max-w-xs">
          <h4 className="font-semibold mb-2">🌍 Location Info</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span>Default Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span>Searched Location</span>
            </div>
          </div>
          {userLocation && (
            <div className="mt-2 pt-2 border-t border-gray-600 text-xs">
              <div>Your coordinates:</div>
              <div>Lat: {userLocation.lat.toFixed(4)}</div>
              <div>Lng: {userLocation.lng.toFixed(4)}</div>
            </div>
          )}
        </div>

        {/* Quick Location Buttons */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {[
            { name: 'Miami', coords: { lat: 25.7617, lng: -80.1918 } },
            { name: 'New York', coords: { lat: 40.7128, lng: -74.0060 } },
            { name: 'Los Angeles', coords: { lat: 34.0522, lng: -118.2437 } },
            { name: 'Tokyo', coords: { lat: 35.6762, lng: 139.6503 } }
          ].map((location) => (
            <button
              key={location.name}
              onClick={() => {
                if (map) {
                  map.setCenter(location.coords);
                  map.setZoom(12);
                  addMarker(location.coords, `🏙️ ${location.name}`, '#f59e0b', map);
                }
              }}
              className="px-3 py-1 bg-black bg-opacity-70 text-white text-xs rounded hover:bg-opacity-90"
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SatelliteMapWorking;
