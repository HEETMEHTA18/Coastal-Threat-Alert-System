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
import OSMFallbackMap from './OSMFallbackMap';
import OceanCurrentsPanel from './OceanCurrentsPanel';
import CurrentsVisualizationService from '../services/currentsVisualizationService';
import nodeAxios from '../services/nodeAxiosInstance';
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
  // Default to world view unless user location is provided
  const [lng, setLng] = useState(0);
  const [lat, setLat] = useState(0);
  const [zoom, setZoom] = useState(1.5);
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
  const [coastalThreatData, setCoastalThreatData] = useState({ type: 'FeatureCollection', features: [] });
  const hasMapboxToken = !!(MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.'));

  // Try to fetch enhanced coastal features from backend for global coverage
  useEffect(() => {
    const fetchEnhanced = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/enhanced-coastal/enhanced' );
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.data) {
          setCoastalThreatData(json.data);
        }
      } catch (err) {
        // ignore - backend may not provide global dataset
      }
    };
    fetchEnhanced();
  }, []);

  // Attempt to get precise browser geolocation for better map centering
  useEffect(() => {
    if (providedUserLocation) {
      setUserLocation(providedUserLocation);
      setLng(providedUserLocation.lng ?? providedUserLocation.longitude ?? 0);
      setLat(providedUserLocation.lat ?? providedUserLocation.latitude ?? 0);
      setZoom(10);
      return;
    }

    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });
        setLng(longitude);
        setLat(latitude);
        setZoom(9);
      }, (err) => {
        setLocationError(err.message || 'Geolocation failed');
      }, { maximumAge: 5 * 60 * 1000, timeout: 5000 });
    }
  }, [providedUserLocation]);

  // Handle map click for ocean current data
  const handleMapClick = (e) => {
    setSelectedCoordinates({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng
    });
    setIsOceanPanelOpen(true);
    // Broadcast selected coordinates so forms can pick them up
    try {
      window.dispatchEvent(new CustomEvent('map:coordinate-selected', { detail: { latitude: e.lngLat.lat, longitude: e.lngLat.lng } }));
    } catch (err) {
      // ignore
    }
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

  const addLiveCommunityReportMarkers = async (mapInstance) => {
    try {
      const response = await nodeAxios.get('/community-reports');
      const reports = response.data?.reports || [];

      reports.forEach((report) => {
        const latitude = Number(report.latitude ?? report.coordinates?.lat);
        const longitude = Number(report.longitude ?? report.coordinates?.lng);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const el = document.createElement('div');
        const severityColors = {
          critical: '#dc2626',
          high: '#f97316',
          medium: '#eab308',
          low: '#2563eb'
        };
        const color = severityColors[report.severity?.toLowerCase()] || '#2563eb';

        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '999px';
        el.style.backgroundColor = color;
        el.style.border = '2px solid #ffffff';
        el.style.boxShadow = '0 8px 18px rgba(15, 23, 42, 0.28)';
        el.style.cursor = 'pointer';

        const popupContent = `
          <div style="color:#0f172a; min-width:220px; font-family:Inter, system-ui, sans-serif;">
            <h3 style="margin:0 0 6px; font-size:14px; font-weight:800;">${report.title || 'Community report'}</h3>
            <p style="margin:0 0 8px; font-size:12px; color:#475569;">${report.location || 'Location not specified'}</p>
            <div style="display:flex; gap:6px; flex-wrap:wrap; font-size:11px;">
              <span style="background:${color}1f; color:${color}; padding:3px 7px; border-radius:999px; font-weight:700;">${(report.severity || 'medium').toUpperCase()}</span>
              <span style="background:#f1f5f9; color:#334155; padding:3px 7px; border-radius:999px; font-weight:700;">${(report.reportType || 'report').toUpperCase()}</span>
            </div>
          </div>
        `;

        new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(popupContent))
          .addTo(mapInstance);
      });
    } catch (error) {
      console.warn('Could not load community report markers:', error.message);
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
    if (!hasMapboxToken || mapError) return undefined;
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

      // Add click handler for ocean currents
      map.current.on('click', handleMapClick);
      addLiveCommunityReportMarkers(map.current);

      // Setup buoy and heatmap sources (will be populated after moveend)
      if (!map.current.getSource('buoys')) {
        map.current.addSource('buoys', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.current.addLayer({
          id: 'buoys-layer',
          type: 'circle',
          source: 'buoys',
          paint: {
            'circle-radius': 6,
            'circle-color': '#0ea5a4',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
          }
        });
      }

      if (!map.current.getSource('coastal-heatmap')) {
        map.current.addSource('coastal-heatmap', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.current.addLayer({
          id: 'coastal-heatmap-layer',
          type: 'heatmap',
          source: 'coastal-heatmap',
          paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,255,0)', 0.2, 'royalblue', 0.4, 'cyan', 0.6, 'yellow', 0.8, 'orange', 1, 'red'],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20]
          }
        });
      }

      // Fetch buoys/heatmap on viewport change (moveend)
      const handleMoveEnd = async () => {
        if (!map.current) return;
        const boundsObj = map.current.getBounds();
        const bounds = {
          sw: { lng: boundsObj.getSouthWest().lng, lat: boundsObj.getSouthWest().lat },
          ne: { lng: boundsObj.getNorthEast().lng, lat: boundsObj.getNorthEast().lat }
        };

        // Fetch buoys
        try {
          const buoysRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/enhanced-coastal/buoys?bounds=' + encodeURIComponent(JSON.stringify(bounds)));
          if (buoysRes.ok) {
            const buoysJson = await buoysRes.json();
            const features = (buoysJson.buoys || []).map(b => ({ type: 'Feature', properties: { id: b.id, name: b.name, type: b.type, state: b.state }, geometry: { type: 'Point', coordinates: b.coordinates } }));
            const fc = { type: 'FeatureCollection', features };
            try { map.current.getSource('buoys').setData(fc); } catch (e) { }
          }
        } catch (e) { }

        // Fetch heatmap (waves)
        try {
          const heatRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/enhanced-coastal/heatmap/waves?bounds=' + encodeURIComponent(JSON.stringify(bounds)));
          if (heatRes.ok) {
            const heatJson = await heatRes.json();
            const points = (heatJson.data || heatJson.heatmap_data || []).map(p => ({ type: 'Feature', properties: { intensity: p.intensity || p.wave_height || 1 }, geometry: { type: 'Point', coordinates: p.coordinates } }));
            const fc2 = { type: 'FeatureCollection', features: points };
            try { map.current.getSource('coastal-heatmap').setData(fc2); } catch (e) { }
          }
        } catch (e) { }
      };

      map.current.on('moveend', handleMoveEnd);
      // Trigger initial load
      setTimeout(handleMoveEnd, 800);

      // draw/report tool initialization removed — mount it separately using MapDrawReportControl

      // Add popup interactions
      map.current.on('click', 'threat-zones-fill', (e) => {
        const properties = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(createThreatZonePopup(properties))
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
  }, [hasMapboxToken, mapError]);

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

  if (!hasMapboxToken || mapError) {
    const center = userLocation?.lng && userLocation?.lat ? [userLocation.lng, userLocation.lat] : [72.8777, 19.0760];
    return <OSMFallbackMap center={center} zoom={userLocation ? 9 : 5} height="100%" />;
  }

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
