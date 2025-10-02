import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  MapPin, 
  Satellite, 
  Layers, 
  AlertTriangle, 
  Shield, 
  Navigation,
  Settings,
  Info,
  Home,
  Waves,
  Cloud,
  Thermometer,
  Wind,
  Droplets,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  Menu
} from 'lucide-react';
import weatherService from '../services/weatherService';
import FallbackMap from './FallbackMap';
import OSMFallbackMap from './OSMFallbackMap';
import OceanCurrentsPanel from './OceanCurrentsPanel';
import CurrentsVisualizationService from '../services/currentsVisualizationService';
import { REGIONS, INDIA_BOUNDS, getRegionsGeoJSON, getRegionById } from '../data/indiaRegions';

// Mapbox access token from environment variables (build-time). The app expects a
// public Mapbox token defined in `frontend/.env` as `VITE_MAPBOX_ACCESS_TOKEN`.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!MAPBOX_TOKEN && import.meta.env.DEV) {
  console.warn('⚠️ VITE_MAPBOX_ACCESS_TOKEN is not set. Mapbox features will be disabled until you set it and restart the dev server.');
}
mapboxgl.accessToken = MAPBOX_TOKEN || '';

const MapboxCoastalMonitor = ({ userLocation: providedUserLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(72.8777); // Mumbai default
  const [lat, setLat] = useState(19.0760);
  const [zoom, setZoom] = useState(10);
  const [mapStyle, setMapStyle] = useState('satellite-v9');
  const [showLayers, setShowLayers] = useState(true);
  const [userLocation, setUserLocation] = useState(providedUserLocation || null);
  const [threatZones, setThreatZones] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isOceanPanelOpen, setIsOceanPanelOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [currentsVisualization, setCurrentsVisualization] = useState(null);
  const [showCurrentArrows, setShowCurrentArrows] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState('all-india');
  const [mapReady, setMapReady] = useState(false);

  // If no build-time token is present, show the non-Mapbox fallback UI to avoid runtime errors.
  if ((!MAPBOX_TOKEN || !MAPBOX_TOKEN.startsWith('pk.')) || mapError) {
    return <FallbackMap />;
  }

  // Coastal threat zones data with real Indian coastal examples
  const coastalThreatData = {
    "type": "FeatureCollection",
    "features": [
      // CRITICAL RISK ZONES
      {
        "type": "Feature",
        "properties": {
          "name": "Sundarbans Delta (West Bengal)",
          "threatLevel": "critical",
          "category": "Sea Level Rise & Erosion",
          "riskScore": 0.95,
          "floodRisk": 0.9,
          "stormSurgeRisk": 0.95,
          "erosionRisk": 0.9,
          "population": 4500000,
          "description": "World's largest mangrove forest facing severe sea level rise and cyclone threats",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Extreme cyclone vulnerability", "Rapid erosion", "Saltwater intrusion"],
          "examples": ["Ghoramara Island disappearing", "Mousuni Island shrinking", "Regular super cyclones"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [88.5000, 21.5000],
            [89.2000, 21.5000],
            [89.2000, 22.3000],
            [88.5000, 22.3000],
            [88.5000, 21.5000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Mumbai Metropolitan Coast",
          "threatLevel": "critical",
          "category": "Urban Flooding & Storm Surge",
          "riskScore": 0.88,
          "floodRisk": 0.9,
          "stormSurgeRisk": 0.85,
          "erosionRisk": 0.7,
          "population": 12500000,
          "description": "Densely populated megacity highly vulnerable to sea level rise and extreme weather",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Urban heat island effect", "Extreme rainfall flooding", "High tide inundation"],
          "examples": ["2005 Mumbai floods", "Worli-Bandra flooding", "Mithi River overflow"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [72.7500, 18.9000],
            [72.9500, 18.9000],
            [72.9500, 19.2000],
            [72.7500, 19.2000],
            [72.7500, 18.9000]
          ]]
        }
      },
      // HIGH RISK ZONES
      {
        "type": "Feature",
        "properties": {
          "name": "Chennai-Mahabalipuram Coast",
          "threatLevel": "high",
          "category": "Storm Surge & Erosion",
          "riskScore": 0.78,
          "floodRisk": 0.8,
          "stormSurgeRisk": 0.85,
          "erosionRisk": 0.75,
          "population": 8500000,
          "description": "Major coastal city with increasing cyclone intensity and sea level rise",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Northeast monsoon flooding", "Coastal erosion", "Cyclone vulnerability"],
          "examples": ["Cyclone Vardah (2016)", "Marina Beach erosion", "Ennore Creek pollution"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [80.1500, 12.8000],
            [80.3500, 12.8000],
            [80.3500, 13.2000],
            [80.1500, 13.2000],
            [80.1500, 12.8000]
          ]]
        }
      },
      // MEDIUM RISK ZONES  
      {
        "type": "Feature",
        "properties": {
          "name": "Goa Coastal Belt",
          "threatLevel": "medium",
          "category": "Tourism & Development Pressure",
          "riskScore": 0.58,
          "floodRisk": 0.6,
          "stormSurgeRisk": 0.5,
          "erosionRisk": 0.65,
          "population": 800000,
          "description": "Popular tourist destination facing development pressure and moderate climate risks",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Beach erosion", "Tourism pollution", "Monsoon flooding"],
          "examples": ["Baga Beach erosion", "Mandovi pollution", "Seasonal flooding"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [73.7000, 15.2000],
            [74.0000, 15.2000],
            [74.0000, 15.6000],
            [73.7000, 15.6000],
            [73.7000, 15.2000]
          ]]
        }
      }
    ]
  };

  // Emergency shelter locations across Indian coastal states
  const emergencyShelterData = {
    "type": "FeatureCollection",
    "features": [
      // West Bengal Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Digha Cyclone Shelter",
          "type": "emergency_shelter",
          "capacity": 5000,
          "facilities": ["Medical aid", "Food distribution", "Communication center"],
          "contact": "+91-3220-267001"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [87.5127, 21.6288]
        }
      },
      // Maharashtra Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Bandra Emergency Shelter",
          "type": "emergency_shelter",
          "capacity": 6000,
          "facilities": ["Multi-story shelter", "Medical wing", "Rescue coordination"],
          "contact": "+91-22-26515151"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [72.8397, 19.0596]
        }
      },
      // Tamil Nadu Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Marina Beach Relief Center",
          "type": "emergency_shelter",
          "capacity": 7000,
          "facilities": ["Large auditorium", "Medical facility", "Food distribution"],
          "contact": "+91-44-28460000"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [80.2785, 13.0475]
        }
      },
      // Kerala Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Kochi Emergency Response Center",
          "type": "emergency_shelter",
          "capacity": 4500,
          "facilities": ["Naval coordination", "Medical facility", "Helicopter landing"],
          "contact": "+91-484-2668221"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [76.2673, 9.9312]
        }
      }
    ]
  };

  // Handle map click for ocean current data
  const handleMapClick = (e) => {
    setSelectedCoordinates({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng
    });
    setIsOceanPanelOpen(true);
  };

  // Toggle current arrows visualization
  const toggleCurrentArrows = async () => {
    if (!currentsVisualization) return;
    
    if (showCurrentArrows) {
      currentsVisualization.clearCurrentsVisualization();
      setShowCurrentArrows(false);
    } else {
      await currentsVisualization.fetchAndDisplayCurrents();
      setShowCurrentArrows(true);
    }
  };

  // Weather monitoring function
  const fetchWeatherData = async (latitude, longitude) => {
    if (!latitude || !longitude) return;
    
    setIsLoading(true);
    try {
      const data = await weatherService.getCurrentWeather(latitude, longitude);
      setWeatherData(data);
      setLocationError(null);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setLocationError('Failed to fetch weather data');
    } finally {
      setIsLoading(false);
    }
  };

  // Update userLocation when prop changes
  useEffect(() => {
    if (providedUserLocation && providedUserLocation.lat && providedUserLocation.lng) {
      setUserLocation(providedUserLocation);
      // Update map center if map is initialized
      if (map.current && map.current.isStyleLoaded()) {
        map.current.flyTo({
          center: [providedUserLocation.lng, providedUserLocation.lat],
          zoom: 12,
          duration: 2000
        });
      }
    }
  }, [providedUserLocation]);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: [lng, lat],
      zoom: zoom,
      projection: 'mercator'
    });

    map.current.on('load', () => {
      // mark map ready so React can mount controls that depend on the map
      try { setMapReady(true); } catch (e) {}
      // Initialize currents visualization service
      const visualizationService = new CurrentsVisualizationService(map.current);
      setCurrentsVisualization(visualizationService);

      // Add a regions source and render colored partitions with subtle fills + outlines
      map.current.addSource('india-regions', {
        type: 'geojson',
        data: getRegionsGeoJSON()
      });

      // Partition fill using feature-state color (we'll set paint to read 'color' property)
      map.current.addLayer({
        id: 'india-regions-partition',
        type: 'fill',
        source: 'india-regions',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#60a5fa'],
          'fill-opacity': 0.18
        }
      });

      // Outline
      map.current.addLayer({
        id: 'india-regions-outline',
        type: 'line',
        source: 'india-regions',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#06b6d4'],
          'line-width': 2,
          'line-opacity': 0.95
        }
      });

      // Selected region highlight (draw above region outline)
      map.current.addLayer({
        id: 'india-region-highlight',
        type: 'line',
        source: 'india-regions',
        paint: {
          'line-color': '#ffffff',
          'line-width': 4,
          'line-opacity': 0.95
        }
      }, 'india-regions-outline');

      // Initially set highlight filter to selectedRegionId
      try {
        map.current.setFilter('india-region-highlight', ['==', ['get', 'id'], selectedRegionId]);
      } catch (e) {}

      // Add a symbol layer for region labels (we'll add points later as a separate source)
      const labelFeatures = REGIONS.map(r => ({
        type: 'Feature',
        properties: { id: r.id, name: r.name, color: r.color || '#60a5fa' },
        geometry: {
          type: 'Point',
          coordinates: r.centroid || [ (r.bounds[0][0]+r.bounds[1][0])/2, (r.bounds[0][1]+r.bounds[1][1])/2 ]
        }
      }));

      map.current.addSource('india-region-labels', { type: 'geojson', data: { type: 'FeatureCollection', features: labelFeatures } });

      map.current.addLayer({
        id: 'india-region-labels',
        type: 'symbol',
        source: 'india-region-labels',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, 0.6],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Add threat zones source
      map.current.addSource('threat-zones', {
        'type': 'geojson',
        'data': coastalThreatData
      });

      // Add threat zones layers
      map.current.addLayer({
        'id': 'threat-zones-fill',
        'type': 'fill',
        'source': 'threat-zones',
        'paint': {
          'fill-color': [
            'match',
            ['get', 'threatLevel'],
            'critical', '#dc2626',
            'high', '#f97316',
            'medium', '#eab308',
            'low', '#22c55e',
            '#6b7280'
          ],
          'fill-opacity': 0.3
        }
      });

      map.current.addLayer({
        'id': 'threat-zones-outline',
        'type': 'line',
        'source': 'threat-zones',
        'paint': {
          'line-color': [
            'match',
            ['get', 'threatLevel'],
            'critical', '#dc2626',
            'high', '#f97316', 
            'medium', '#eab308',
            'low', '#22c55e',
            '#6b7280'
          ],
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      // Add emergency shelters
      map.current.addSource('shelters', {
        'type': 'geojson',
        'data': emergencyShelterData
      });

      map.current.addLayer({
        'id': 'shelters',
        'type': 'circle',
        'source': 'shelters',
        'paint': {
          'circle-radius': 8,
          'circle-color': '#10b981',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      // Add click handler for ocean currents
      map.current.on('click', handleMapClick);

      // draw/report tool initialization removed — mount it separately using MapDrawReportControl

      // Add popup interactions
      map.current.on('click', 'threat-zones-fill', (e) => {
        const properties = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(createThreatZonePopup(properties))
          .addTo(map.current);
      });

      map.current.on('click', 'shelters', (e) => {
        const properties = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(createShelterPopup(properties))
          .addTo(map.current);
      });

      // Add current arrows popup interactions
      visualizationService.addCurrentPopups();

      // Change cursor on hover
      map.current.on('mouseenter', 'threat-zones-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'threat-zones-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });

      // Click on a region partition to select it
      map.current.on('click', 'india-regions-partition', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        const id = props.id || props.name;
        if (id) {
          setSelectedRegionId(id);
          const region = getRegionById(id);
          if (region && region.bounds) {
            map.current.fitBounds(region.bounds, { padding: 40, duration: 800 });
          }
        }
      });
    });

    // Fit to selected region initially (All India)
    try {
      map.current.fitBounds(INDIA_BOUNDS, { padding: 40, duration: 1000 });
    } catch (e) {
      console.warn('Could not fit bounds to India on init', e);
    }

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 600000
      },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: true
    });
    map.current.addControl(geolocate, 'top-right');

    // Handle geolocate events
    geolocate.on('geolocate', (e) => {
      console.log('User location found:', e.coords);
      setUserLocation([e.coords.longitude, e.coords.latitude]);
      fetchWeatherData(e.coords.latitude, e.coords.longitude);
      setLocationError(null);
    });

    geolocate.on('error', (e) => {
      console.error('Geolocation error:', e);
      setLocationError('Unable to access location. Please enable location services.');
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
      setMapError('Failed to load map. Please check your internet connection and try again.');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update highlight filter when selectedRegionId changes
  useEffect(() => {
    // Ensure map and style are loaded before calling getStyle or setFilter
    if (!map.current) return;

    const applyFilter = () => {
      try {
        // Only set filter if layer exists
        const style = map.current.isStyleLoaded && map.current.isStyleLoaded();
        if (!style) return;
        const layers = map.current.getStyle && typeof map.current.getStyle === 'function'
          ? (() => { try { return map.current.getStyle().layers || []; } catch (e) { return []; } })()
          : [];
        const layerExists = layers.some(l => l.id === 'india-region-highlight');
        if (layerExists) {
          map.current.setFilter('india-region-highlight', ['==', ['get', 'id'], selectedRegionId]);
        }
      } catch (e) {
        // ignore transient errors while style or layer is not yet ready
      }
    };

    // Apply immediately (if possible)
    applyFilter();

    // Also attempt again after a short delay in case style was still loading
    const t = setTimeout(applyFilter, 500);
    return () => clearTimeout(t);
  }, [selectedRegionId]);

  // Create threat zone popup content
  const createThreatZonePopup = (properties) => {
    return `
      <div class="threat-popup">
        <h3 class="font-bold text-lg mb-2">${properties.name}</h3>
        <div class="mb-2">
          <span class="inline-block px-2 py-1 rounded text-xs font-semibold ${
            properties.threatLevel === 'critical' ? 'bg-red-100 text-red-800' :
            properties.threatLevel === 'high' ? 'bg-orange-100 text-orange-800' :
            properties.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }">${properties.threatLevel.toUpperCase()}</span>
        </div>
        <p class="text-sm text-gray-600 mb-3">${properties.description}</p>
        <div class="space-y-2">
          <div class="text-sm">
            <strong>Category:</strong> ${properties.category}
          </div>
          <div class="text-sm">
            <strong>Population at Risk:</strong> ${properties.population?.toLocaleString()}
          </div>
          <div class="text-sm">
            <strong>Risk Score:</strong> ${(properties.riskScore * 100).toFixed(0)}%
          </div>
        </div>
        ${properties.examples ? `
          <div class="mt-3">
            <strong class="text-sm">Examples:</strong>
            <ul class="text-xs text-gray-600 mt-1">
              ${properties.examples.map(example => `<li>• ${example}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Create shelter popup content
  const createShelterPopup = (properties) => {
    return `
      <div class="shelter-popup">
        <h3 class="font-bold text-lg mb-2">${properties.name}</h3>
        <div class="space-y-2">
          <div class="text-sm">
            <strong>Capacity:</strong> ${properties.capacity} people
          </div>
          <div class="text-sm">
            <strong>Contact:</strong> ${properties.contact}
          </div>
          <div class="text-sm">
            <strong>Facilities:</strong>
            <ul class="text-xs mt-1">
              ${properties.facilities.map(facility => `<li>• ${facility}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <div className="relative w-full h-full bg-gray-900">
  {/* Map Container */}
  {/* ensure map canvas sits below modal/dialog layers by forcing a low z-index */}
  <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Toggle Panel Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="absolute top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-white/20"
      >
        {isPanelOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Ocean Currents Button */}
      <button
        onClick={() => setIsOceanPanelOpen(true)}
        className="absolute top-4 left-20 z-50 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white p-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-white/20"
        title="View Ocean Currents & Tides"
      >
        <Waves className="h-5 w-5" />
      </button>

      {/* Current Arrows Toggle Button */}
      <button
        onClick={toggleCurrentArrows}
        className={`absolute top-4 left-36 z-50 ${
          showCurrentArrows 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' 
            : 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700'
        } text-white p-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-white/20`}
        title={showCurrentArrows ? "Hide Current Arrows" : "Show Current Arrows"}
      >
        <Navigation className="h-5 w-5" />
      </button>

      {/* Control Panel */}
      {isPanelOpen && (
        <div className="absolute top-4 left-4 z-40 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 ml-16">
          {/* Panel content here - same as before */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Coastal Threat Monitor</h2>
            </div>
            
            {/* Weather Display */}
            {weatherData && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Current Weather</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-red-500" />
                    <span>{weatherData.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="h-3 w-3 text-gray-500" />
                    <span>{weatherData.windSpeed} km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-blue-500" />
                    <span>{weatherData.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-500" />
                    <span>{weatherData.pressure} hPa</span>
                  </div>
                </div>
              </div>
            )}

            {/* Coordinate Display */}
            <div className="text-sm text-gray-600 mb-4">
              <div>Longitude: {lng}</div>
              <div>Latitude: {lat}</div>
              <div>Zoom: {zoom}</div>
            </div>

            {/* Region selector */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600">Region</label>
              <select
                value={selectedRegionId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedRegionId(id);
                  const region = getRegionById(id);
                  if (map.current && region && region.bounds) {
                    map.current.fitBounds(region.bounds, { padding: 40, duration: 800 });
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-200 p-2 text-sm"
              >
                {REGIONS.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Region legend */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600">Legend</label>
              <div className="mt-2 space-y-2">
                {REGIONS.filter(r => r.id !== 'all-india').map(r => (
                  <div key={r.id} className="flex items-center gap-2">
                    <div style={{ width: 16, height: 12, background: r.color || '#60a5fa', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                    <div className="text-xs text-gray-700">{r.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Messages */}
            {locationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{locationError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ocean Currents Panel */}
      <OceanCurrentsPanel 
        isOpen={isOceanPanelOpen}
        onClose={() => setIsOceanPanelOpen(false)}
        location={selectedCoordinates}
      />

      {/* draw/report control intentionally not mounted here; use main Mapbox view for drawing to avoid map-container warnings */}

      {/* Threat Levels Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Threat Levels</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded transition-colors">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-700">Critical Risk</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded transition-colors">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-xs text-gray-700">High Risk</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded transition-colors">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-xs text-gray-700">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded transition-colors">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-700">Emergency Shelter</span>
          </div>
          {showCurrentArrows && (
            <div className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded transition-colors">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-700">Current Arrows</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapboxCoastalMonitor;