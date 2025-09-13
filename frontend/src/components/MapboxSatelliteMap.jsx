import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaGVldDExMSIsImEiOiJjbWZnemgzMGYwNjBoMm1zZ2Q5anZ3OGl3In0.NYVLSvDvQrspx-Adgb0FkQ';

const MapboxSatelliteMap = () => {
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [markers, setMarkers] = useState([]);
  const mapContainer = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      console.log('🗺️ Initializing Mapbox map...');
      console.log('🔑 Mapbox token:', mapboxgl.accessToken ? 'Set' : 'Missing');

      // Initialize Mapbox map
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite view
        center: [72.8777, 19.0760], // Mumbai coordinates (lng, lat)
        zoom: 10,
        bearing: 0,
        pitch: 0
      });

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add fullscreen control
      mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Add scale control
      mapInstance.addControl(new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
      }), 'bottom-left');

      // Add geolocate control
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      mapInstance.addControl(geolocate, 'top-right');

      mapInstance.on('load', () => {
        setIsLoading(false);
        console.log('🗺️ Mapbox map loaded successfully');

        // Add coastal threat data layers
        addThreatDataLayers(mapInstance);
      });

      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

      setMap(mapInstance);

      return () => {
        if (mapInstance) {
          mapInstance.remove();
        }
      };
    } catch (err) {
      console.error('❌ Error initializing Mapbox:', err);
      setError('Failed to initialize Mapbox map: ' + err.message);
      setIsLoading(false);
    }
  }, []);

  const addThreatDataLayers = (mapInstance) => {
    // Add coastal threat zones
    mapInstance.addSource('threat-zones', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              threatLevel: 'high',
              description: 'High risk coastal area'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [72.8200, 19.0200],
                [72.8600, 19.0200],
                [72.8600, 19.0600],
                [72.8200, 19.0600],
                [72.8200, 19.0200]
              ]]
            }
          }
        ]
      }
    });

    // Add threat zone layer
    mapInstance.addLayer({
      id: 'threat-zones-layer',
      type: 'fill',
      source: 'threat-zones',
      paint: {
        'fill-color': [
          'match',
          ['get', 'threatLevel'],
          'high', '#ef4444',
          'medium', '#f59e0b',
          'low', '#10b981',
          '#6b7280'
        ],
        'fill-opacity': 0.4
      }
    });

    // Add threat zone borders
    mapInstance.addLayer({
      id: 'threat-zones-border',
      type: 'line',
      source: 'threat-zones',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2
      }
    });
  };

  const handleSearchLocation = async (query) => {
    if (!query.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=1`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        // Fly to location
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 2000
        });

        // Add marker
        addMarker(lng, lat, data.features[0].place_name);
      } else {
        setError('Location not found');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to search location');
    } finally {
      setIsLoading(false);
    }
  };

  const addMarker = (lng, lat, title = 'Location') => {
    if (!map) return;

    // Create custom marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.innerHTML = `
      <div style="
        background: #ef4444;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        cursor: pointer;
      "></div>
    `;

    // Create marker
    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([lng, lat])
      .addTo(map);

    // Add popup
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #1f2937; font-weight: bold;">${title}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</p>
        </div>
      `);

    marker.setPopup(popup);
    setMarkers(prev => [...prev, marker]);
  };

  const clearMarkers = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-red-400">
        <div className="text-center">
          <p className="text-lg font-semibold">Map Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation(searchQuery)}
          placeholder="Search location..."
          className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSearchLocation(searchQuery)}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
        >
          Search
        </button>
        <button
          onClick={clearMarkers}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
        >
          Clear
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center z-20">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading Map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapboxSatelliteMap;