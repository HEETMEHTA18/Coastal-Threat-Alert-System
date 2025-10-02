import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Waves, Thermometer, Navigation, Radar, Settings, 
  Eye, EyeOff, Layers, Play, Pause, RotateCcw,
  MapPin, Zap, Activity, Menu, X, Shield
} from 'lucide-react';

import FallbackMap from './FallbackMap';

// Read Mapbox access token from env (no hard-coded fallback)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
import { INDIA_BOUNDS } from '../data/indiaRegions';
if (!MAPBOX_TOKEN) {
  console.warn('⚠️ VITE_MAPBOX_ACCESS_TOKEN is not set for EnhancedSatelliteMap');
}
mapboxgl.accessToken = MAPBOX_TOKEN || '';

const EnhancedSatelliteMap = () => {
  // If token missing, render fallback to avoid repeated Mapbox initialization errors
    const hasMapboxToken = !!(MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.'));
    if (!hasMapboxToken) {
      // Helpful UX: show console instructions to set token and restart dev server
      if (import.meta.env.DEV) {
        console.warn('Mapbox token not configured. To enable maps set VITE_MAPBOX_ACCESS_TOKEN in `frontend/.env` and restart the dev server.');
      }
      return <FallbackMap />;
    }
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [currentMapStyle, setCurrentMapStyle] = useState(0); // Track current map style
  const [animationPlaying, setAnimationPlaying] = useState(true);
  const [isControlsVisible, setIsControlsVisible] = useState(false); // Unified controls state
  const [isLegendExpanded, setIsLegendExpanded] = useState(false); // Legend expansion state
  const [layerVisibility, setLayerVisibility] = useState({
    waves: true,
    temperature: false,
    currents: false,
    weather: false,
    buoys: true,
    erosion: false,
    threats: true // Add threat zones control (visible by default to showcase global coverage)
  });
  
  const mapContainer = useRef(null);
  const animationFrame = useRef(null);
  const waveAnimationTime = useRef(0);

  // Gujarat and Mumbai coastal focus area (Arabian Sea) with optimized coverage
  const centerCoordinates = [72.8777, 19.0760]; // Mumbai coordinates
  const initialZoom = 8; // Restored to focus on key area

  // Optimized regional bounds for memory efficiency
  const regionalBounds = {
    north: 23.0, // Reduced from 25.0 for better performance
    south: 17.0, // Reduced from 15.0 for better performance
    east: 74.0,  // Reduced from 75.0 for better performance
    west: 69.0   // Reduced from 67.0 for better performance
  };

  // Map style options with fallbacks and descriptive names
  const mapStyles = [
    { url: 'mapbox://styles/mapbox/satellite-streets-v12', name: 'Satellite + Streets' },
    { url: 'mapbox://styles/mapbox/satellite-v9', name: 'Satellite Only' },
    { url: 'mapbox://styles/mapbox/outdoors-v12', name: 'Terrain View' },
    { url: 'mapbox://styles/mapbox/streets-v12', name: 'Street Map' }
  ];

  // Retry map initialization
  const initializeMap = (styleIndex = 0) => {
    if (!mapContainer.current) return;

    try {
      console.log(`🗺️ Initializing Enhanced Satellite Map (attempt ${retryCount + 1})...`);
      console.log(`📍 Using map style: ${mapStyles[styleIndex].name} - ${mapStyles[styleIndex].url}`);

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyles[styleIndex].url,
        center: centerCoordinates,
        zoom: initialZoom,
        bearing: 0,
        pitch: 45, // 3D tilt for better visualization
        antialias: true,
        preserveDrawingBuffer: true, // Help with rendering issues
        attributionControl: false // Remove to reduce clutter
      });

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      mapInstance.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

      mapInstance.on('load', () => {
        console.log('🎯 Map loaded successfully, adding enhanced layers...');
        
        // Wait a moment to ensure map is fully loaded, then add layers on top
        setTimeout(() => {
          try {
            // Add data sources and layers in proper order (bottom to top)
            addWeatherRadarLayer(mapInstance);
            addWaveHeatmapLayer(mapInstance);
            addTemperatureLayer(mapInstance);
            addCurrentFlowLayer(mapInstance);
            addMultiCountryThreatData(mapInstance); // Add multi-country threat zones
            addBuoyMarkers(mapInstance);
            
            console.log('✅ All layers added successfully');
            setMap(mapInstance);
            setIsLoading(false);
            setError(null);
            setRetryCount(0);

            // Fit to India for default full-country view
            try { mapInstance.fitBounds(INDIA_BOUNDS, { padding: 60, duration: 1000 }); } catch(e) {}
            
            // Start animation after layers are added
            setTimeout(() => {
              startWaveAnimation(mapInstance);
              
              // Validate map components after initialization
              setTimeout(() => {
                const validation = validateMapComponents(mapInstance);
                if (validation.errors.length > 0) {
                  // Only show validation warnings in development
                  if (import.meta.env.DEV) {
                    console.warn('⚠️ Map validation issues:', validation.errors);
                  }
                } else {
                  console.log('✅ All map components validated successfully');
                }
              }, 1500); // Additional delay for full component loading
            }, 200);
          } catch (layerError) {
            console.error('❌ Error adding layers:', layerError);
            setError('Failed to add map layers. Please try refreshing.');
            setIsLoading(false);
          }
        }, 100);
      });

      mapInstance.on('error', (e) => {
        console.error('❌ Mapbox error:', e.error);
        
        // Try next style if current one fails
        if (styleIndex < mapStyles.length - 1) {
          console.log(`🔄 Trying fallback map style...`);
          setTimeout(() => {
            initializeMap(styleIndex + 1);
          }, 1000);
        } else if (retryCount < 3) {
          // Retry with first style
          console.log(`🔄 Retrying map initialization (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            initializeMap(0);
          }, 2000);
        } else {
          setError('Failed to load map. Please check your internet connection and refresh the page.');
          setIsLoading(false);
        }
      });

      // Add style load error handling
      mapInstance.on('styledata', () => {
        console.log('✅ Map style loaded successfully');
      });

    } catch (error) {
      console.error('❌ Map initialization error:', error);
      
      if (retryCount < 3) {
        console.log(`🔄 Retrying map initialization (${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          initializeMap(styleIndex);
        }, 2000);
      } else {
        setError(`Failed to initialize map: ${error.message}`);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initialize map with retry mechanism
    initializeMap();

    return () => {
      console.log('🧹 Cleaning up map resources...');
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      
      if (map) {
        // Clean up event listeners
        map.off();
        
        // Remove all sources and layers
        const layers = ['wave-heatmap-layer', 'wave-contours', 'temperature-heatmap', 'current-arrows', 'weather-radar-layer'];
        const sources = ['wave-heatmap', 'temperature', 'current-flow', 'weather-radar'];
        
        layers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });
        
        sources.forEach(sourceId => {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        });
        
        // Remove map instance
        map.remove();
      }
      
      // Clear any remaining references
      setMap(null);
    };
  }, []);


  // Add animated wave heatmap layer
  const addWaveHeatmapLayer = (mapInstance) => {
    try {
      // Generate synthetic wave data for Arabian Sea area
      const waveData = generateWaveData();
      
      mapInstance.addSource('wave-heatmap', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: waveData
        }
      });

      // Add heatmap layer
      mapInstance.addLayer({
        id: 'wave-heatmap-layer',
        type: 'heatmap',
        source: 'wave-heatmap',
        layout: {
          visibility: 'visible' // Waves start visible by default
        },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'wave_height'],
            0, 0,
            5, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgb(0, 150, 255)',
            0.4, 'rgb(0, 255, 150)',
            0.6, 'rgb(255, 255, 0)',
            0.8, 'rgb(255, 150, 0)',
            1, 'rgb(255, 0, 0)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 20,
            15, 40
          ],
          'heatmap-opacity': 0.7
        }
      }); // No beforeId - places on top

      // Add wave contour lines
      mapInstance.addLayer({
        id: 'wave-contours',
        type: 'line',
        source: 'wave-heatmap',
        layout: {
          visibility: 'visible' // Contours start visible by default
        },
        paint: {
          'line-color': [
            'interpolate',
            ['linear'],
            ['get', 'wave_height'],
            0, '#00ffff',
            2, '#00ff00',
            4, '#ffff00',
            6, '#ff0000'
          ],
          'line-width': 2,
          'line-opacity': 0.6
        }
      }); // No beforeId - places on top
      
      console.log('✅ Wave heatmap layers added successfully');
    } catch (error) {
      console.error('❌ Error adding wave heatmap layers:', error);
    }
  };

  // Add animated current flow layer
  const addCurrentFlowLayer = (mapInstance) => {
    try {
      console.log('🌊 Adding current flow layer...');
      
      const currentData = generateCurrentData();
      
      mapInstance.addSource('current-flow', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: currentData
        }
      });

      // Check if custom arrow icon exists, if not use a simple symbol
      const iconExists = mapInstance.hasImage('custom-arrow');
      
      if (!iconExists) {
        // Create a simple arrow using text symbol as fallback
        mapInstance.addLayer({
          id: 'current-arrows',
          type: 'symbol',
          source: 'current-flow',
          layout: {
            'text-field': '→',
            'text-size': 16,
            'text-rotate': ['get', 'direction'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'visibility': 'none' // Always start hidden
          },
          paint: {
            'text-color': '#00ff88',
            'text-opacity': 0.8
          }
        });
      } else {
        // Use icon if available
        mapInstance.addLayer({
          id: 'current-arrows',
          type: 'symbol',
          source: 'current-flow',
          layout: {
            'icon-image': 'custom-arrow',
            'icon-size': [
              'interpolate',
              ['linear'],
              ['get', 'speed'],
              0, 0.5,
              3, 1.5
            ],
            'icon-rotate': ['get', 'direction'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'visibility': 'none' // Always start hidden
          },
          paint: {
            'icon-opacity': 0.8
          }
        });
      }
      
      console.log('✅ Current flow layer added successfully');
    } catch (error) {
      console.error('❌ Error adding current flow layer:', error);
    }
  };

  // Add Indian coastal monitoring stations
  const addBuoyMarkers = (mapInstance) => {
    console.log('🏭 Adding fixed coastal station markers...');
    
    // Fixed coordinates for Indian coastal stations - reduced to 3 main stations
    const indianCoastalStations = [
      { 
        id: 'mumbai_port', 
        name: 'Mumbai Port - Gateway of India', 
        coords: [72.8347, 18.9220], // Fixed coordinates
        waveHeight: 2.3, 
        period: 9.2,
        type: 'major_port',
        state: 'Maharashtra'
      },
      { 
        id: 'kandla_port', 
        name: 'Kandla Port - Gujarat', 
        coords: [70.2167, 23.0333], // Fixed coordinates
        waveHeight: 1.9, 
        period: 8.1,
        type: 'major_port',
        state: 'Gujarat'
      },
      { 
        id: 'mumbai_offshore', 
        name: 'Mumbai Offshore Platform', 
        coords: [72.6500, 19.2500], // Fixed coordinates
        waveHeight: 2.8, 
        period: 10.1,
        type: 'offshore_platform',
        state: 'Maharashtra'
      }
    ];

    // Store markers to prevent duplication
    const stationMarkers = [];

    indianCoastalStations.forEach(station => {
      console.log(`📍 Adding fixed station: ${station.name} at [${station.coords[0]}, ${station.coords[1]}]`);
      
      // Create FIXED marker element with no movement animations
      const el = document.createElement('div');
      el.className = 'indian-buoy-marker-fixed';
      el.id = `station-${station.id}`;
      
      // Station type icons
      const getStationIcon = (type) => {
        switch(type) {
          case 'major_port': return '🏗️';
          case 'fishing_port': return '🎣';
          case 'offshore_platform': return '🛢️';
          case 'coastal_monitor': return '📡';
          case 'monitoring_station': return '🌊';
          default: return '📍';
        }
      };
      
      el.innerHTML = `
        <div class="indian-station-indicator-fixed">
          <div class="station-pulse-fixed ${station.type}"></div>
          <div class="station-icon-fixed">${getStationIcon(station.type)}</div>
          <div class="station-data-fixed">
            <div class="wave-height">${station.waveHeight}m</div>
            <div class="wave-period">${station.period}s</div>
            <div class="station-state">${station.state}</div>
          </div>
        </div>
      `;

      // Create marker with LOCKED position - will NOT move
      const marker = new mapboxgl.Marker(el)
        .setLngLat(station.coords) // Fixed coordinates - no updates
        .setPopup(new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false 
        }).setHTML(`
          <div class="indian-station-popup">
            <h3>${station.name}</h3>
            <div class="station-details">
              <p><strong>🌍 Coordinates:</strong> ${station.coords[1].toFixed(4)}°N, ${station.coords[0].toFixed(4)}°E</p>
              <p><strong>🏛️ State:</strong> ${station.state}</p>
              <p><strong>⚓ Type:</strong> ${station.type.replace('_', ' ').toUpperCase()}</p>
              <p><strong>🌊 Wave Height:</strong> ${station.waveHeight}m</p>
              <p><strong>⏱️ Wave Period:</strong> ${station.period}s</p>
              <p><strong>🟢 Status:</strong> <span class="status-active">Operational</span></p>
              <p><strong>🌊 Region:</strong> Arabian Sea</p>
              <p><strong>📍 Position:</strong> FIXED - No Movement</p>
            </div>
          </div>
        `))
        .addTo(mapInstance);
        
      stationMarkers.push(marker);
      console.log(`✅ Fixed station marker added: ${station.name}`);
    });
    
    console.log(`🎯 Total ${stationMarkers.length} fixed coastal stations added to map`);
  };

  // Add temperature layer
  const addTemperatureLayer = (mapInstance) => {
    try {
      const tempData = generateTemperatureData();
      
      mapInstance.addSource('temperature', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: tempData
        }
      });

      mapInstance.addLayer({
        id: 'temperature-heatmap',
        type: 'heatmap',
        source: 'temperature',
        layout: {
          visibility: 'none' // Always start hidden
        },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'temperature'],
            15, 0,
            25, 1
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.3, 'rgb(0, 100, 255)',
            0.5, 'rgb(0, 255, 100)',
            0.7, 'rgb(255, 255, 0)',
            0.9, 'rgb(255, 100, 0)',
            1, 'rgb(255, 0, 0)'
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.6
        }
      }); // No beforeId - places on top
      
      console.log('✅ Temperature layer added successfully');
    } catch (error) {
      console.error('❌ Error adding temperature layer:', error);
    }
  };

  // Add multi-country coastal threat data layers
  const addMultiCountryThreatData = (mapInstance) => {
    try {
      console.log('🌍 Adding multi-country coastal threat data layers...');
      
      // Multi-country coastal threat zones - Indian Ocean Region
      const multiCountryThreatZones = {
        type: 'FeatureCollection',
        features: [
          // India - Gujarat Coast (High Risk)
          {
            type: 'Feature',
            properties: {
              country: 'India',
              region: 'Gujarat Coast',
              threatLevel: 'high',
              riskType: 'cyclone_surge',
              description: 'High risk cyclone and storm surge area',
              population: 2500000,
              economicValue: 45000000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [68.8, 23.5], [70.2, 23.5], [70.2, 22.0], [68.8, 22.0], [68.8, 23.5]
              ]]
            }
          },
          // India - Mumbai Coast (Critical)
          {
            type: 'Feature',
            properties: {
              country: 'India',
              region: 'Mumbai Metropolitan',
              threatLevel: 'critical',
              riskType: 'sea_level_rise',
              description: 'Critical sea level rise and coastal erosion zone',
              population: 12500000,
              economicValue: 120000000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [72.6, 19.3], [73.1, 19.3], [73.1, 18.8], [72.6, 18.8], [72.6, 19.3]
              ]]
            }
          },
          // UAE - Dubai Coast (High Risk)
          {
            type: 'Feature',
            properties: {
              country: 'United Arab Emirates',
              region: 'Dubai Coast',
              threatLevel: 'high',
              riskType: 'coastal_erosion',
              description: 'Artificial islands and coastal development at risk',
              population: 3500000,
              economicValue: 85000000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [54.8, 25.4], [55.6, 25.4], [55.6, 24.8], [54.8, 24.8], [54.8, 25.4]
              ]]
            }
          },
          // Oman - Muscat Coast (Medium Risk)
          {
            type: 'Feature',
            properties: {
              country: 'Oman',
              region: 'Muscat Governorate',
              threatLevel: 'medium',
              riskType: 'storm_surge',
              description: 'Moderate storm surge and coastal flooding risk',
              population: 1650000,
              economicValue: 28000000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [58.2, 23.8], [59.2, 23.8], [59.2, 23.2], [58.2, 23.2], [58.2, 23.8]
              ]]
            }
          },
          // Yemen - Aden Coast (High Risk)
          {
            type: 'Feature',
            properties: {
              country: 'Yemen',
              region: 'Aden Governorate',
              threatLevel: 'high',
              riskType: 'extreme_weather',
              description: 'Extreme weather events and sea level rise',
              population: 950000,
              economicValue: 8500000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [44.8, 13.0], [45.5, 13.0], [45.5, 12.5], [44.8, 12.5], [44.8, 13.0]
              ]]
            }
          },
          // Somalia - Mogadishu Coast (Critical)
          {
            type: 'Feature',
            properties: {
              country: 'Somalia',
              region: 'Banadir Region',
              threatLevel: 'critical',
              riskType: 'sea_level_rise',
              description: 'Critical vulnerability to sea level rise',
              population: 2400000,
              economicValue: 3200000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [45.0, 2.3], [45.6, 2.3], [45.6, 1.8], [45.0, 1.8], [45.0, 2.3]
              ]]
            }
          },
          // Kenya - Mombasa Coast (Medium Risk)
          {
            type: 'Feature',
            properties: {
              country: 'Kenya',
              region: 'Mombasa County',
              threatLevel: 'medium',
              riskType: 'coastal_erosion',
              description: 'Coastal erosion and coral reef degradation',
              population: 1350000,
              economicValue: 12000000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [39.5, -3.8], [40.2, -3.8], [40.2, -4.3], [39.5, -4.3], [39.5, -3.8]
              ]]
            }
          },
          // Sri Lanka - Colombo Coast (High Risk)
          {
            type: 'Feature',
            properties: {
              country: 'Sri Lanka',
              region: 'Western Province',
              threatLevel: 'high',
              riskType: 'tsunami_risk',
              description: 'High tsunami and monsoon flooding risk',
              population: 5850000,
              economicValue: 35000000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [79.6, 7.2], [80.2, 7.2], [80.2, 6.6], [79.6, 6.6], [79.6, 7.2]
              ]]
            }
          },
          // Maldives - Male Region (Critical)
          {
            type: 'Feature',
            properties: {
              country: 'Maldives',
              region: 'North Male Atoll',
              threatLevel: 'critical',
              riskType: 'sea_level_rise',
              description: 'Extreme vulnerability - entire nation at risk',
              population: 540000,
              economicValue: 5400000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [73.2, 4.5], [73.8, 4.5], [73.8, 3.8], [73.2, 3.8], [73.2, 4.5]
              ]]
            }
          },
          // Bangladesh - Chittagong Coast (Critical)
          {
            type: 'Feature',
            properties: {
              country: 'Bangladesh',
              region: 'Chittagong Division',
              threatLevel: 'critical',
              riskType: 'cyclone_surge',
              description: 'Extreme cyclone and flood vulnerability',
              population: 32000000,
              economicValue: 48000000000
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [91.5, 22.8], [92.5, 22.8], [92.5, 21.8], [91.5, 21.8], [91.5, 22.8]
              ]]
            }
          }
        ]
      };

      // Add the multi-country threat zones source
      mapInstance.addSource('multi-country-threats', {
        type: 'geojson',
        data: multiCountryThreatZones
      });

      // Add threat zone fill layer with country-specific styling
      mapInstance.addLayer({
        id: 'multi-country-threat-zones',
        type: 'fill',
        source: 'multi-country-threats',
        layout: {
          visibility: 'visible' // Start visible to showcase global coverage
        },
        paint: {
          'fill-color': [
            'match',
            ['get', 'threatLevel'],
            'critical', '#dc2626', // Red for critical
            'high', '#ea580c',     // Orange-red for high
            'medium', '#d97706',   // Orange for medium
            'low', '#059669',      // Green for low
            '#6b7280'              // Gray for unknown
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'country'], 'India'], 0.6,  // Higher opacity for India
            0.4  // Lower opacity for other countries
          ]
        }
      });

      // Add threat zone borders with country-specific styling
      mapInstance.addLayer({
        id: 'multi-country-threat-borders',
        type: 'line',
        source: 'multi-country-threats',
        layout: {
          visibility: 'visible'
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'threatLevel'],
            'critical', '#ffffff',
            'high', '#f3f4f6',
            'medium', '#e5e7eb',
            'low', '#d1d5db',
            '#9ca3af'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'country'], 'India'], 3,  // Thicker borders for India
            2  // Standard borders for other countries
          ],
          'line-opacity': 0.8
        }
      });

      // Add country labels
      mapInstance.addLayer({
        id: 'country-labels',
        type: 'symbol',
        source: 'multi-country-threats',
        layout: {
          'text-field': ['concat', ['get', 'country'], '\n', ['get', 'region']],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': [
            'case',
            ['==', ['get', 'country'], 'India'], 14,  // Larger text for India
            12  // Standard size for other countries
          ],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-padding': 2,
          visibility: 'visible'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
          'text-opacity': 0.9
        }
      });

      // Add click event for detailed threat information
      mapInstance.on('click', 'multi-country-threat-zones', (e) => {
        const properties = e.features[0].properties;
        
        const popupContent = `
          <div style="min-width: 280px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px;">
              🌍 ${properties.country}
            </h3>
            <div style="space-y: 8px;">
              <p style="margin: 6px 0; color: #374151;"><strong>📍 Region:</strong> ${properties.region}</p>
              <p style="margin: 6px 0; color: #374151;"><strong>⚠️ Threat Level:</strong> 
                <span style="color: ${properties.threatLevel === 'critical' ? '#dc2626' : properties.threatLevel === 'high' ? '#ea580c' : '#d97706'}; font-weight: bold; text-transform: uppercase;">
                  ${properties.threatLevel}
                </span>
              </p>
              <p style="margin: 6px 0; color: #374151;"><strong>🌊 Risk Type:</strong> ${properties.riskType.replace('_', ' ').toUpperCase()}</p>
              <p style="margin: 6px 0; color: #374151;"><strong>📝 Description:</strong> ${properties.description}</p>
              <p style="margin: 6px 0; color: #374151;"><strong>👥 Population at Risk:</strong> ${(properties.population / 1000000).toFixed(1)}M people</p>
              <p style="margin: 6px 0; color: #374151;"><strong>💰 Economic Value:</strong> $${(properties.economicValue / 1000000000).toFixed(1)}B USD</p>
              <div style="margin-top: 12px; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                  🔄 Real-time monitoring • 📊 AI-powered risk assessment
                </p>
              </div>
            </div>
          </div>
        `;

        new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false })
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(mapInstance);
      });

      // Change cursor on hover
      mapInstance.on('mouseenter', 'multi-country-threat-zones', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'multi-country-threat-zones', () => {
        mapInstance.getCanvas().style.cursor = '';
      });

      console.log('✅ Multi-country coastal threat data layers added successfully');
    } catch (error) {
      console.error('❌ Error adding multi-country threat data:', error);
    }
  };

  // Add weather radar layer
  const addWeatherRadarLayer = (mapInstance) => {
    try {
      console.log('🌦️ Adding weather radar layer...');
      
      // Check if the map instance is valid
      if (!mapInstance || !mapInstance.isStyleLoaded()) {
        if (import.meta.env.DEV) {
          console.warn('Map not ready for weather radar layer');
        }
        return;
      }
      
      // Use a more reliable radar source
      mapInstance.addSource('weather-radar', {
        type: 'raster',
        tiles: [
          'https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/256/1_1.png'
        ],
        tileSize: 256,
        maxzoom: 12, // Limit max zoom to prevent issues
        attribution: 'Weather data © RainViewer'
      });

      mapInstance.addLayer({
        id: 'weather-radar-layer',
        type: 'raster',
        source: 'weather-radar',
        layout: {
          visibility: 'none' // Always start hidden to prevent initial loading issues
        },
        paint: {
          'raster-opacity': 0.6,
          'raster-fade-duration': 300
        }
      }); // No beforeId - places on top
      
      console.log('✅ Weather radar layer added successfully');
    } catch (error) {
      console.error('❌ Error adding weather radar layer:', error);
      // Don't throw error, just log it so other layers can still load
    }
  };

  // Comprehensive map validation function
  const validateMapComponents = (mapInstance) => {
    console.log('🔍 Validating map components...');
    
    const validation = {
      mapLoaded: false,
      tokensValid: false,
      layersAdded: false,
      sourcesAdded: false,
      errors: []
    };

    try {
      // Check map instance
      validation.mapLoaded = mapInstance && mapInstance.isStyleLoaded();
      
      // Check token validation
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      validation.tokensValid = token && token.startsWith('pk.');
      
      // Check sources
      const expectedSources = ['wave-heatmap', 'temperature-heatmap', 'current-flow', 'weather-radar'];
      const addedSources = expectedSources.filter(source => mapInstance.getSource(source));
      validation.sourcesAdded = addedSources.length === expectedSources.length;
      
      // Check layers
      const expectedLayers = ['wave-heatmap-layer', 'temperature-heatmap-layer', 'current-arrows', 'weather-radar-layer'];
      const addedLayers = expectedLayers.filter(layer => mapInstance.getLayer(layer));
      validation.layersAdded = addedLayers.length === expectedLayers.length;
      
      console.log('📊 Validation Results:', {
        mapLoaded: validation.mapLoaded,
        tokensValid: validation.tokensValid,
        sourcesAdded: `${addedSources.length}/${expectedSources.length}`,
        layersAdded: `${addedLayers.length}/${expectedLayers.length}`,
        addedSources,
        addedLayers
      });
      
      if (!validation.tokensValid) {
        validation.errors.push('Invalid Mapbox token - check VITE_MAPBOX_ACCESS_TOKEN');
      }
      if (!validation.sourcesAdded) {
        validation.errors.push(`Missing sources: ${expectedSources.filter(s => !addedSources.includes(s))}`);
      }
      if (!validation.layersAdded) {
        validation.errors.push(`Missing layers: ${expectedLayers.filter(l => !addedLayers.includes(l))}`);
      }
      
    } catch (error) {
      validation.errors.push(`Validation error: ${error.message}`);
      console.error('❌ Map validation failed:', error);
    }
    
    return validation;
  };

  // Start enhanced wave animation with memory-efficient updates
  const startWaveAnimation = (mapInstance) => {
    let frameCount = 0; // Track animation frames
    let lastLogTime = 0; // Track last console log time
    
    const animate = () => {
      if (!animationPlaying) {
        animationFrame.current = requestAnimationFrame(animate);
        return;
      }

      waveAnimationTime.current += 0.01; // Slower animation for better performance
      frameCount++;
      const currentTime = Date.now();
      
      // Update wave heatmap with time-based animation (every frame for smooth motion)
      if (mapInstance.getSource('wave-heatmap')) {
        // Pass current time to control logging frequency
        const shouldLog = currentTime - lastLogTime > 1000; // Log at most once per second
        if (shouldLog) lastLogTime = currentTime;
        
        const animatedWaveData = generateWaveData(waveAnimationTime.current, frameCount, shouldLog);
        mapInstance.getSource('wave-heatmap').setData({
          type: 'FeatureCollection',
          features: animatedWaveData
        });
      }
      
      // Update temperature data less frequently (every 5 seconds)
      if (frameCount % 300 === 0) { // Approximately every 5 seconds at 60fps
        if (mapInstance.getSource('temperature')) {
          const updatedTempData = generateTemperatureData(frameCount);
          mapInstance.getSource('temperature').setData({
            type: 'FeatureCollection',
            features: updatedTempData
          });
        }
      }
      
      // Update current data even less frequently (every 10 seconds)
      if (frameCount % 600 === 0) { // Approximately every 10 seconds at 60fps
        if (mapInstance.getSource('current-flow')) {
          const updatedCurrentData = generateCurrentData(frameCount);
          mapInstance.getSource('current-flow').setData({
            type: 'FeatureCollection',
            features: updatedCurrentData
          });
        }
      }
      
      // Reset frame counter to prevent overflow
      if (frameCount > 3600) { // Reset every minute
        frameCount = 0;
      }

      animationFrame.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  // Generate dynamic synthetic wave data for Indian coastal regions (optimized for memory)
  const generateWaveData = (time = 0, frameCount = 0, shouldLog = false) => {
    const features = [];
    
    // Reduced bounds to focus on key areas and reduce memory usage
    const optimizedBounds = {
      north: 23.0,  // Reduced from 25.0
      south: 17.0,  // Reduced from 15.0
      east: 74.0,   // Reduced from 75.0
      west: 69.0    // Reduced from 67.0
    };
    
    // Current date for seasonal variations
    const currentMonth = new Date().getMonth(); // 0-11
    const monsoonSeason = currentMonth >= 5 && currentMonth <= 9; // June to October
    
    // Significantly reduced grid resolution for memory efficiency
    const step = 0.05; // Increased from 0.015 to reduce data points by ~90%
    
    for (let lat = optimizedBounds.south; lat <= optimizedBounds.north; lat += step) {
      for (let lng = optimizedBounds.west; lng <= optimizedBounds.east; lng += step) {
        
        // Skip some points randomly to further reduce density
        if (Math.random() > 0.6) continue; // Skip 40% of points
        
        // Define multiple regional centers for wave patterns
        const mumbaiDistance = Math.sqrt(Math.pow(lat - 19.0760, 2) + Math.pow(lng - 72.8777, 2));
        const gujaratDistance = Math.sqrt(Math.pow(lat - 22.2587, 2) + Math.pow(lng - 71.1924, 2));
        
        // Simplified regional wave characteristics
        let baseWaveHeight = 1.8; // Base wave height
        let waveVariation = 0;
        
        // Arabian Sea (West Coast) patterns - simplified
        if (lng < 73.0) {
          const monsoonIntensity = monsoonSeason ? 2.0 : 1.0;
          
          // Simplified wave pattern
          const wavePattern = Math.sin(mumbaiDistance * 6 + time) * Math.cos(gujaratDistance * 8 + time * 0.8);
          
          waveVariation = wavePattern * monsoonIntensity;
          baseWaveHeight = 2.0 + (Math.random() - 0.5) * 0.8; // Reduced randomness
          
        } else {
          // Coastal transition zone - simplified
          const coastalPattern = Math.sin(lat * 12 + lng * 10 + time) * 0.6;
          waveVariation = coastalPattern;
          baseWaveHeight = 1.5 + (Math.random() - 0.5) * 0.5;
        }
        
        // Simplified temporal and spatial noise
        const temporalNoise = (Math.random() - 0.5) * 0.4;
        
        // Calculate final wave height
        let finalWaveHeight = Math.abs(baseWaveHeight + waveVariation + temporalNoise);
        
        // Clamp to realistic values
        finalWaveHeight = Math.max(0.8, Math.min(4.5, finalWaveHeight));
        
        // Only include marine areas (simplified check)
        const isMarineArea = lng < 73.2 && lat < 23.0;
        
        if (isMarineArea) {
          features.push({
            type: 'Feature',
            properties: {
              wave_height: Math.round(finalWaveHeight * 10) / 10, // Round to 1 decimal
              region: 'arabian_sea'
            },
            geometry: {
              type: 'Point',
              coordinates: [Math.round(lng * 100) / 100, Math.round(lat * 100) / 100] // Round coordinates
            }
          });
        }
      }
    }
    
    // Only log occasionally to reduce console spam
    if (shouldLog) {
      console.log(`🌊 Generated ${features.length} optimized wave data points`);
    }
    return features;
  };

  // Generate dynamic current data for Indian coastal regions (memory optimized)
  const generateCurrentData = () => {
    const features = [];
    
    // Optimized bounds for memory efficiency
    const currentBounds = {
      north: 23.0,  // Reduced from 25.0
      south: 17.0,  // Reduced from 15.0
      east: 74.0,   // Reduced from 75.0
      west: 69.0    // Reduced from 67.0
    };
    
    // Seasonal current patterns
    const currentMonth = new Date().getMonth();
    const isSouthwestMonsoon = currentMonth >= 5 && currentMonth <= 9;
    
    // Reduced number of current vectors for better performance
    const maxPoints = 40; // Reduced from 120
    
    for (let i = 0; i < maxPoints; i++) {
      const lng = currentBounds.west + Math.random() * (currentBounds.east - currentBounds.west);
      const lat = currentBounds.south + Math.random() * (currentBounds.north - currentBounds.south);
      
      let currentSpeed = 0.8; // Base current speed (m/s)
      let currentDirection = 180; // Base direction (degrees)
      
      // Simplified regional current patterns
      if (lng < 73.0) {
        // Arabian Sea currents
        
        if (isSouthwestMonsoon) {
          // Southwest Monsoon Current (June-October)
          currentDirection = 45 + Math.random() * 45; // Northeast direction
          currentSpeed = 1.0 + Math.random() * 1.0; // Moderate monsoon currents
        } else {
          // Winter patterns
          currentDirection = 220 + Math.random() * 60; // Southwest direction
          currentSpeed = 0.6 + Math.random() * 0.8; // Moderate winter currents
        }
        
        // Gujarat coastal adjustment
        if (lat > 21.0) {
          currentDirection = 270 + Math.random() * 60; // Westward from Gujarat coast
          currentSpeed = 0.5 + Math.random() * 0.6;
        }
        
      } else {
        // Coastal transition waters - simplified patterns
        currentDirection = 90 + Math.random() * 180; // Variable directions
        currentSpeed = 0.4 + Math.random() * 0.8;
      }
      
      // Simplified tidal influences
      const hour = new Date().getHours();
      const tidalFactor = Math.sin(hour * 0.5) * 0.2; // Reduced tidal effect
      currentSpeed += Math.abs(tidalFactor);
      
      // Simplified random variations
      currentSpeed += (Math.random() - 0.5) * 0.3;
      currentDirection += (Math.random() - 0.5) * 20;
      
      // Clamp values to realistic ranges
      currentSpeed = Math.max(0.2, Math.min(2.5, currentSpeed)); // 0.2-2.5 m/s
      currentDirection = ((currentDirection % 360) + 360) % 360; // Normalize to 0-360°
      
      // Only include marine areas (simplified check)
      const isMarineArea = lng < 73.2 && lat < 23.0;
      
      if (isMarineArea) {
        features.push({
          type: 'Feature',
          properties: {
            speed: Math.round(currentSpeed * 10) / 10, // Round to 1 decimal
            direction: Math.round(currentDirection), // Round to nearest degree
            region: 'arabian_sea'
          },
          geometry: {
            type: 'Point',
            coordinates: [Math.round(lng * 100) / 100, Math.round(lat * 100) / 100] // Round coordinates
          }
        });
      }
    }
    
    console.log(`🌊 Generated ${features.length} optimized current data points`);
    return features;
  };

  // Generate dynamic temperature data for Indian coastal regions (memory optimized)
  const generateTemperatureData = () => {
    const features = [];
    
    // Optimized bounds for memory efficiency
    const tempBounds = {
      north: 23.0,  // Reduced from 25.0
      south: 17.0,  // Reduced from 15.0
      east: 74.0,   // Reduced from 75.0
      west: 69.0    // Reduced from 67.0
    };
    
    // Seasonal temperature variations
    const currentMonth = new Date().getMonth();
    const isSummer = currentMonth >= 3 && currentMonth <= 5;
    const isMonsoon = currentMonth >= 5 && currentMonth <= 9;
    const isWinter = currentMonth >= 11 || currentMonth <= 2;
    
    // Reduced number of temperature points for better performance
    const maxPoints = 80; // Reduced from 300
    
    for (let i = 0; i < maxPoints; i++) {
      const lng = tempBounds.west + Math.random() * (tempBounds.east - tempBounds.west);
      const lat = tempBounds.south + Math.random() * (tempBounds.north - tempBounds.south);
      
      // Simplified regional base temperatures
      let baseTemperature = 26.5; // Default Arabian Sea temperature
      
      // Simplified regional temperature variations
      if (lng < 73.0) {
        // Arabian Sea temperatures
        baseTemperature = 27.0;
        
        // Simplified latitude effect
        const latitudeEffect = (lat - 20.0) * -0.4;
        baseTemperature += latitudeEffect;
        
      } else {
        // Coastal transition waters
        baseTemperature = 26.0;
        const coastalVariation = (Math.random() - 0.5) * 1.0;
        baseTemperature += coastalVariation;
      }
      
      // Simplified seasonal adjustments
      if (isSummer) {
        baseTemperature += 1.5 + Math.random() * 1.0;
      } else if (isMonsoon) {
        baseTemperature -= 0.5 + Math.random() * 0.5;
      } else if (isWinter) {
        baseTemperature -= 1.0 + Math.random() * 0.5;
      }
      
      // Simplified variations
      const variation = (Math.random() - 0.5) * 2.0;
      let finalTemperature = baseTemperature + variation;
      
      // Clamp to realistic ranges
      finalTemperature = Math.max(22.0, Math.min(32.0, finalTemperature));
      
      // Only include marine areas (simplified check)
      const isMarineArea = lng < 73.2 && lat < 23.0;
      
      if (isMarineArea) {
        features.push({
          type: 'Feature',
          properties: {
            temperature: Math.round(finalTemperature * 10) / 10, // Round to 1 decimal
            region: 'arabian_sea'
          },
          geometry: {
            type: 'Point',
            coordinates: [Math.round(lng * 100) / 100, Math.round(lat * 100) / 100] // Round coordinates
          }
        });
      }
    }
    
    console.log(`🌡️ Generated ${features.length} optimized temperature data points`);
    return features;
  };

  // Toggle layer visibility
  const toggleLayer = (layerName) => {
    if (!map) {
      console.warn('Map not initialized');
      return;
    }
    
    try {
      // Preserve current map state to prevent shifts
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const currentBearing = map.getBearing();
      const currentPitch = map.getPitch();
      
      const newVisibility = !layerVisibility[layerName];
      setLayerVisibility(prev => ({
        ...prev,
        [layerName]: newVisibility
      }));

      const layerIds = {
        waves: ['wave-heatmap-layer', 'wave-contours'],
        temperature: ['temperature-heatmap'],
        currents: ['current-arrows'],
        weather: ['weather-radar-layer'],
        threats: ['multi-country-threat-zones', 'multi-country-threat-borders', 'country-labels']
      };

      if (layerIds[layerName]) {
        layerIds[layerName].forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(
                layerId, 
                'visibility', 
                newVisibility ? 'visible' : 'none'
              );
            } else {
              // Only log missing layers in development mode
              if (import.meta.env.DEV) {
                console.warn(`Layer ${layerId} not found`);
              }
            }
          } catch (layerError) {
            console.error(`Error toggling layer ${layerId}:`, layerError);
          }
        });
      }
      
      // Restore map state if it has changed (prevent unwanted shifts)
      const tolerance = 0.0001; // Small tolerance for floating point comparison
      if (
        Math.abs(map.getCenter().lng - currentCenter.lng) > tolerance ||
        Math.abs(map.getCenter().lat - currentCenter.lat) > tolerance ||
        Math.abs(map.getZoom() - currentZoom) > 0.01 ||
        Math.abs(map.getBearing() - currentBearing) > 0.1 ||
        Math.abs(map.getPitch() - currentPitch) > 0.1
      ) {
        console.log('🔄 Restoring map position after layer toggle');
        map.jumpTo({
          center: currentCenter,
          zoom: currentZoom,
          bearing: currentBearing,
          pitch: currentPitch
        });
      }
      
      console.log(`✅ Successfully toggled ${layerName} layer: ${newVisibility ? 'visible' : 'hidden'}`);
    } catch (error) {
      console.error(`❌ Error toggling layer ${layerName}:`, error);
      // Revert the visibility state if there was an error
      setLayerVisibility(prev => ({
        ...prev,
        [layerName]: !layerVisibility[layerName]
      }));
    }
  };

  // Toggle animation
  const toggleAnimation = () => {
    setAnimationPlaying(!animationPlaying);
  };

  // Switch map style
  const switchMapStyle = () => {
    if (!map) return;
    
    const nextStyleIndex = (currentMapStyle + 1) % mapStyles.length;
    setCurrentMapStyle(nextStyleIndex);
    
    try {
      console.log(`🔄 Switching to: ${mapStyles[nextStyleIndex].name}`);
      map.setStyle(mapStyles[nextStyleIndex].url);
      
      // Re-add all layers after style change
      map.once('styledata', () => {
        setTimeout(() => {
          addWeatherRadarLayer(map);
          addWaveHeatmapLayer(map);
          addTemperatureLayer(map);
          addCurrentFlowLayer(map);
          addBuoyMarkers(map);
          console.log('✅ Layers re-added after style change');
        }, 500);
      });
    } catch (error) {
      console.error('❌ Error switching map style:', error);
    }
  };

  // Quick zoom presets
  const zoomPresets = {
    mumbai: { center: [72.8777, 19.0760], zoom: 12, name: 'Mumbai Coast' },
    gujarat: { center: [70.2167, 22.5], zoom: 10, name: 'Gujarat Coast' },
    arabianSea: { center: [71.5, 20.5], zoom: 8, name: 'Arabian Sea' },
    fullView: { center: [71.5, 20], zoom: 6, name: 'Full Region' }
  };

  const quickZoom = (preset) => {
    if (!map) return;
    
    map.flyTo({
      center: zoomPresets[preset].center,
      zoom: zoomPresets[preset].zoom,
      duration: 1500,
      essential: true
    });
  };

  // Toggle unified controls (both sidebar and floating controls)
  const toggleControls = () => {
    setIsControlsVisible(!isControlsVisible);
  };

  // Toggle legend expansion
  const toggleLegend = () => {
    setIsLegendExpanded(!isLegendExpanded);
  };

  // Retry function for manual retry
  const retryMapLoad = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    
    // Clear existing map if any
    if (map) {
      map.remove();
      setMap(null);
    }
    
    // Retry after a short delay
    setTimeout(() => {
      initializeMap();
    }, 500);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white relative">
        <div className="text-center max-w-md mx-auto p-6">
          <Zap className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-4">Map Loading Error</h3>
          <p className="text-slate-300 mb-6 text-sm leading-relaxed">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={retryMapLoad}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Loading Map</span>
            </button>
            
            <div className="text-xs text-slate-400 space-y-1">
              <p>• Check your internet connection</p>
              <p>• Ensure Mapbox services are accessible</p>
              <p>• Try refreshing the page</p>
            </div>
          </div>
          
          {retryCount > 0 && (
            <div className="mt-4 p-3 bg-slate-800 rounded-lg text-xs text-slate-300">
              Retry attempt: {retryCount}/3
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Unified Controls Backdrop */}
      {isControlsVisible && (
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={toggleControls}
        />
      )}

      {/* Unified Controls Toggle Button */}
      <button
        onClick={toggleControls}
        className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-sm p-3 rounded-xl text-white shadow-2xl border border-slate-700/50 z-50 touch-manipulation transition-all duration-300"
        title={isControlsVisible ? "Hide Controls" : "Show Controls"}
      >
        {isControlsVisible ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Controls Available Indicator - Shows when controls are hidden */}
      {!isControlsVisible && (
        <div className="absolute top-4 right-4 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-lg text-blue-400 text-xs font-medium border border-blue-500/30 z-40 animate-pulse">
          <Menu className="w-4 h-4 inline mr-2" />
          Tap menu to access controls
        </div>
      )}
      
      {/* Enhanced Floating Control Bar - Conditionally Visible */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 z-50 max-w-[95vw] lg:max-w-4xl transition-all duration-300 ${
        isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        {/* Main Controls Row */}
        <div className="flex items-center justify-center px-2 sm:px-6 py-3 sm:py-4 space-x-2 sm:space-x-8 overflow-x-auto">
          {/* Wave Heatmap Toggle */}
          <button
            onClick={() => toggleLayer('waves')}
            className={`flex flex-col items-center space-y-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 min-h-[70px] sm:min-h-[80px] min-w-[55px] sm:min-w-[80px] flex-shrink-0 ${
              layerVisibility.waves 
                ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50 shadow-blue-500/25' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border-2 border-transparent'
            }`}
            title="Toggle Wave Heatmap Layer"
          >
            <div className="relative">
              <Waves className="w-4 h-4 sm:w-6 sm:h-6" />
              {layerVisibility.waves && <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse"></div>}
            </div>
            <span className="text-xs font-medium text-center leading-tight">Wave<br className="hidden sm:block"/>Heat</span>
          </button>

          {/* Temperature Toggle */}
          <button
            onClick={() => toggleLayer('temperature')}
            className={`flex flex-col items-center space-y-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 min-h-[70px] sm:min-h-[80px] min-w-[55px] sm:min-w-[80px] flex-shrink-0 ${
              layerVisibility.temperature 
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 shadow-red-500/25' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border-2 border-transparent'
            }`}
            title="Toggle Sea Temperature Layer"
          >
            <div className="relative">
              <Thermometer className="w-4 h-4 sm:w-6 sm:h-6" />
              {layerVisibility.temperature && <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-pulse"></div>}
            </div>
            <span className="text-xs font-medium text-center leading-tight">Sea<br className="hidden sm:block"/>Temp</span>
          </button>

          {/* Current Flow Toggle */}
          <button
            onClick={() => toggleLayer('currents')}
            className={`flex flex-col items-center space-y-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 min-h-[70px] sm:min-h-[80px] min-w-[55px] sm:min-w-[80px] flex-shrink-0 ${
              layerVisibility.currents 
                ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 shadow-green-500/25' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border-2 border-transparent'
            }`}
            title="Toggle Ocean Current Flow Layer"
          >
            <div className="relative">
              <Navigation className="w-4 h-4 sm:w-6 sm:h-6" />
              {layerVisibility.currents && <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>}
            </div>
            <span className="text-xs font-medium text-center leading-tight">Current<br className="hidden sm:block"/>Flow</span>
          </button>

          {/* Weather Radar Toggle */}
          <button
            onClick={() => toggleLayer('weather')}
            className={`flex flex-col items-center space-y-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 min-h-[70px] sm:min-h-[80px] min-w-[55px] sm:min-w-[80px] flex-shrink-0 ${
              layerVisibility.weather 
                ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50 shadow-purple-500/25' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border-2 border-transparent'
            }`}
            title="Toggle Weather Radar Layer"
          >
            <div className="relative">
              <Radar className="w-4 h-4 sm:w-6 sm:h-6" />
              {layerVisibility.weather && <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-purple-400 rounded-full animate-pulse"></div>}
            </div>
            <span className="text-xs font-medium text-center leading-tight">Weather<br className="hidden sm:block"/>Radar</span>
          </button>

          {/* Multi-Country Threat Zones Toggle */}
          <button
            onClick={() => toggleLayer('threats')}
            className={`flex flex-col items-center space-y-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 min-h-[70px] sm:min-h-[80px] min-w-[55px] sm:min-w-[80px] flex-shrink-0 ${
              layerVisibility.threats 
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 shadow-red-500/25' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border-2 border-transparent'
            }`}
            title="Toggle Multi-Country Coastal Threat Zones"
          >
            <div className="relative">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6" />
              {layerVisibility.threats && <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-pulse"></div>}
            </div>
            <span className="text-xs font-medium text-center leading-tight">Global<br className="hidden sm:block"/>Threats</span>
          </button>

          {/* Separator - Hidden on mobile */}
          <div className="hidden sm:block h-12 w-px bg-slate-600"></div>

          {/* Animation Toggle */}
          <button
            onClick={toggleAnimation}
            className={`flex flex-col items-center space-y-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 min-h-[70px] sm:min-h-[80px] min-w-[55px] sm:min-w-[80px] flex-shrink-0 ${
              animationPlaying 
                ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 shadow-emerald-500/25' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border-2 border-transparent'
            }`}
            title={animationPlaying ? "Pause Animation" : "Start Animation"}
          >
            <div className="relative">
              {animationPlaying ? <Pause className="w-4 h-4 sm:w-6 sm:h-6" /> : <Play className="w-4 h-4 sm:w-6 sm:h-6" />}
              {animationPlaying && <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse"></div>}
            </div>
            <span className="text-xs font-medium text-center leading-tight">Wave<br className="hidden sm:block"/>Anim</span>
          </button>
        </div>
        
        {/* Status Bar */}
        <div className="bg-slate-800/80 px-3 sm:px-6 py-2 rounded-b-xl border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>
              {Object.values(layerVisibility).filter(v => v).length} of 4 layers active
            </span>
            <span className="hidden sm:inline">Arabian Sea • Real-time Data</span>
            <span className="sm:hidden">Real-time</span>
          </div>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white">
          <div className="text-center">
            <Activity className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
            <p>Loading Enhanced Satellite View...</p>
          </div>
        </div>
      )}

      {/* Draw & Report control removed from Satellite view; available in Overview (SimpleInteractiveMap) */}

      {/* Unified Side Control Panel */}
      <div className={`absolute top-20 left-4 bg-slate-900/95 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-white shadow-2xl border border-slate-700/50 max-w-72 z-40 
                      transition-all duration-300 ease-in-out w-64 sm:w-auto ${
                        isControlsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
                      }`}>
        <h3 className="text-sm font-semibold mb-3 sm:mb-4 flex items-center text-blue-400">
          <Layers className="w-4 h-4 mr-2" />
          Map Controls
        </h3>
        
        {/* Map Style Switcher */}
        <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Map Style</span>
            <button
              onClick={switchMapStyle}
              className="px-2 sm:px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded-lg transition-colors touch-manipulation min-h-[32px]"
            >
              Switch
            </button>
          </div>
          <div className="text-xs text-slate-400">{mapStyles[currentMapStyle].name}</div>
        </div>

        {/* Quick Zoom Presets */}
        <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-slate-700">
          <h4 className="text-xs font-medium text-slate-300 mb-2">Quick Zoom</h4>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(zoomPresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  quickZoom(key);
                  // Auto-close controls after selection
                  setTimeout(() => setIsControlsVisible(false), 1000);
                }}
                className="px-2 py-1 bg-slate-700/70 hover:bg-slate-600 text-xs rounded transition-colors touch-manipulation min-h-[32px]"
                title={`Zoom to ${preset.name}`}
              >
                {preset.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        
        {/* Layer Status */}
        <div>
          <h4 className="text-xs font-medium text-slate-300 mb-2 sm:mb-3">Layer Status</h4>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Waves className="w-3 h-3 mr-2 text-blue-400" />
                <span>Waves</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${layerVisibility.waves ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Thermometer className="w-3 h-3 mr-2 text-red-400" />
                <span>Temperature</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${layerVisibility.temperature ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Navigation className="w-3 h-3 mr-2 text-green-400" />
                <span>Currents</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${layerVisibility.currents ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Radar className="w-3 h-3 mr-2 text-purple-400" />
                <span>Weather</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${layerVisibility.weather ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>
          </div>
        </div>

        {/* Animation Status */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span>Animation</span>
            <div className={`w-2 h-2 rounded-full ${animationPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
          </div>
        </div>
      </div>

      {/* Compact Mobile-Friendly Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-sm rounded-lg text-white shadow-xl border border-slate-700/50 z-40 max-w-[280px] sm:max-w-none">
        {/* Compact Header */}
        <div 
          className="flex items-center justify-between p-2 sm:p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={toggleLegend}
        >
          <div className="flex items-center space-x-2">
            <h4 className="text-xs sm:text-sm font-semibold">🇮🇳 Arabian Sea</h4>
            <div className="flex space-x-1">
              {/* Quick status indicators */}
              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Waves Active"></div>
              <div className={`w-2 h-2 rounded-full ${layerVisibility.temperature ? 'bg-red-400' : 'bg-slate-600'}`} title="Temperature"></div>
              <div className={`w-2 h-2 rounded-full ${layerVisibility.currents ? 'bg-green-400' : 'bg-slate-600'}`} title="Currents"></div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-400">Info</span>
            <div className="transition-transform duration-200" style={{transform: isLegendExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}>
              ▼
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        <div className={`transition-all duration-300 overflow-hidden ${isLegendExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-2 sm:p-3 pt-0 space-y-2 sm:space-y-3">
            {/* Compact Wave Height Scale */}
            <div>
              <h5 className="text-xs font-medium mb-1 text-slate-300">Wave Height (m)</h5>
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-2 gap-1 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>0-1.5</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>1.5-2.5</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>2.5-3.5</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>3.5m+</span>
                </div>
              </div>
            </div>

            {/* Compact Temperature Scale */}
            <div>
              <h5 className="text-xs font-medium mb-1 text-slate-300">Sea Temperature (°C)</h5>
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-2 gap-1 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>22-24°</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span>24-27°</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                  <span>27-30°</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span>30°+</span>
                </div>
              </div>
            </div>

            {/* Compact Station Types */}
            <div>
              <h5 className="text-xs font-medium mb-1 text-slate-300">Stations</h5>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center space-x-1">
                  <span>🏗️</span>
                  <span>Port</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🎣</span>
                  <span>Fishing</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🛢️</span>
                  <span>Offshore</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>�</span>
                  <span>Monitor</span>
                </div>
              </div>
            </div>

            {/* Global Threat Levels */}
            <div>
              <h5 className="text-xs font-medium mb-1 text-slate-300">Global Threat Levels</h5>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span>Critical</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-400 rounded"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span>Low</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">10 countries monitored</p>
            </div>

            {/* Real-time Data Indicator */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-700">
              <span className="text-xs text-slate-400">Real-time Data</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS for Indian coastal stations */}
      <style>{`
        /* Fixed station markers - NO movement animations */
        .indian-buoy-marker-fixed {
          position: relative;
          cursor: pointer;
        }
        
        .indian-station-indicator-fixed {
          position: relative;
          text-align: center;
        }
        
        .station-pulse-fixed {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 35px;
          height: 35px;
          border: 2px solid #00ff88;
          border-radius: 50%;
          animation: pulse-only 2.5s infinite; /* Only pulse, no movement */
        }
        
        .station-pulse-fixed.major_port {
          border-color: #ff6b35;
          animation-duration: 2s;
        }
        
        .station-pulse-fixed.offshore_platform {
          border-color: #4ecdc4;
          animation-duration: 3s;
        }
        
        .station-pulse-fixed.coastal_monitor {
          border-color: #45b7d1;
          animation-duration: 2.2s;
        }
        
        .station-icon-fixed {
          font-size: 22px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          /* NO floating animation - stays fixed */
        }
        
        .station-data-fixed {
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 50, 80, 0.95));
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          /* NO floating animation - stays fixed */
        }
        
        @keyframes pulse-only {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.2);
            opacity: 0;
          }
        }

        .indian-buoy-marker {
          position: relative;
        }
        
        .indian-station-indicator {
          position: relative;
          text-align: center;
        }
        
        .station-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 35px;
          height: 35px;
          border: 2px solid #00ff88;
          border-radius: 50%;
          animation: indian-pulse 2.5s infinite;
        }
        
        .station-pulse.major_port {
          border-color: #ff6b35;
          animation-duration: 2s;
        }
        
        .station-pulse.offshore_platform {
          border-color: #4ecdc4;
          animation-duration: 3s;
        }
        
        .station-pulse.coastal_monitor {
          border-color: #45b7d1;
          animation-duration: 2.2s;
        }
        
        .station-icon {
          font-size: 22px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }
        
        .station-data {
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 50, 80, 0.95));
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
        }
        
        .station-state {
          color: #ffa726;
          font-weight: bold;
          margin-top: 2px;
        }
        
        @keyframes indian-pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.2);
            opacity: 0;
          }
        }
        
        .indian-station-popup {
          min-width: 280px;
        }
        
        .indian-station-popup h3 {
          margin: 0 0 12px 0;
          color: #2c5aa0;
          font-size: 16px;
          border-bottom: 2px solid #ff9933;
          padding-bottom: 6px;
        }
        
        .station-details {
          line-height: 1.6;
        }
        
        .station-details p {
          margin: 6px 0;
          color: #333;
        }
        
        .status-active {
          color: #00aa44;
          font-weight: bold;
        }
        
        /* Legacy buoy marker styles for compatibility */
        .buoy-marker {
          position: relative;
        }
        
        .buoy-indicator {
          position: relative;
          text-align: center;
        }
        
        .buoy-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 30px;
          border: 2px solid #00ff88;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .buoy-icon {
          font-size: 20px;
          position: relative;
          z-index: 1;
        }
        
        .buoy-data {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        
        .buoy-popup h3 {
          margin: 0 0 8px 0;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default EnhancedSatelliteMap;