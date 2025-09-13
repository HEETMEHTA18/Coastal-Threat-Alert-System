import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Waves, Thermometer, Navigation, Radar, Settings, 
  Eye, EyeOff, Layers, Play, Pause, RotateCcw,
  MapPin, Zap, Activity
} from 'lucide-react';

// Set Mapbox access token with validation
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiaGVldDExMSIsImEiOiJjbWZnemgzMGYwNjBoMm1zZ2Q5anZ3OGl3In0.NYVLSvDvQrspx-Adgb0FkQ';

// Validate token format
if (!MAPBOX_TOKEN || !MAPBOX_TOKEN.startsWith('pk.')) {
  console.warn('⚠️ Invalid or missing Mapbox access token');
}

mapboxgl.accessToken = MAPBOX_TOKEN;

const EnhancedSatelliteMap = () => {
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [animationPlaying, setAnimationPlaying] = useState(true);
  const [layerVisibility, setLayerVisibility] = useState({
    waves: true,
    temperature: false,
    currents: false,
    weather: false,
    buoys: true,
    erosion: false
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

  // Map style options with fallbacks
  const mapStyles = [
    'mapbox://styles/mapbox/satellite-streets-v12',
    'mapbox://styles/mapbox/satellite-v9',
    'mapbox://styles/mapbox/outdoors-v12',
    'mapbox://styles/mapbox/streets-v12'
  ];

  // Retry map initialization
  const initializeMap = (styleIndex = 0) => {
    if (!mapContainer.current) return;

    try {
      console.log(`🗺️ Initializing Enhanced Satellite Map (attempt ${retryCount + 1})...`);
      console.log(`📍 Using map style: ${mapStyles[styleIndex]}`);

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyles[styleIndex],
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
            addBuoyMarkers(mapInstance);
            
            console.log('✅ All layers added successfully');
            setMap(mapInstance);
            setIsLoading(false);
            setError(null);
            setRetryCount(0);
            
            // Start animation after layers are added
            setTimeout(() => {
              startWaveAnimation(mapInstance);
              
              // Validate map components after initialization
              setTimeout(() => {
                const validation = validateMapComponents(mapInstance);
                if (validation.errors.length > 0) {
                  console.warn('⚠️ Map validation issues:', validation.errors);
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
    
    // Fixed coordinates for Indian coastal stations - these will NOT move
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
        id: 'okha_port', 
        name: 'Okha Port - Dwarka', 
        coords: [69.0781, 22.4821], // Fixed coordinates
        waveHeight: 2.1, 
        period: 8.7,
        type: 'fishing_port',
        state: 'Gujarat'
      },
      { 
        id: 'jamnagar_coast', 
        name: 'Jamnagar Coastal Station', 
        coords: [70.0661, 22.4707], // Fixed coordinates
        waveHeight: 2.0, 
        period: 8.4,
        type: 'monitoring_station',
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
      },
      { 
        id: 'alibaug_coast', 
        name: 'Alibaug Coastal Monitor', 
        coords: [72.8717, 18.6414], // Fixed coordinates
        waveHeight: 2.2, 
        period: 8.9,
        type: 'coastal_monitor',
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

  // Add weather radar layer
  const addWeatherRadarLayer = (mapInstance) => {
    try {
      console.log('🌦️ Adding weather radar layer...');
      
      // Check if the map instance is valid
      if (!mapInstance || !mapInstance.isStyleLoaded()) {
        console.warn('Map not ready for weather radar layer');
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
    
    const animate = () => {
      if (!animationPlaying) {
        animationFrame.current = requestAnimationFrame(animate);
        return;
      }

      waveAnimationTime.current += 0.01; // Slower animation for better performance
      frameCount++;
      
      // Update wave heatmap with time-based animation (every frame for smooth motion)
      if (mapInstance.getSource('wave-heatmap')) {
        const animatedWaveData = generateWaveData(waveAnimationTime.current);
        mapInstance.getSource('wave-heatmap').setData({
          type: 'FeatureCollection',
          features: animatedWaveData
        });
      }
      
      // Update temperature data less frequently (every 5 seconds)
      if (frameCount % 300 === 0) { // Approximately every 5 seconds at 60fps
        if (mapInstance.getSource('temperature')) {
          const updatedTempData = generateTemperatureData();
          mapInstance.getSource('temperature').setData({
            type: 'FeatureCollection',
            features: updatedTempData
          });
        }
      }
      
      // Update current data even less frequently (every 10 seconds)
      if (frameCount % 600 === 0) { // Approximately every 10 seconds at 60fps
        if (mapInstance.getSource('current-flow')) {
          const updatedCurrentData = generateCurrentData();
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
  const generateWaveData = (time = 0) => {
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
    
    console.log(`🌊 Generated ${features.length} optimized wave data points`);
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
        weather: ['weather-radar-layer']
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
              console.warn(`Layer ${layerId} not found`);
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
      
      {/* Floating Layer Control Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm rounded-xl px-6 py-3 text-white shadow-lg border border-slate-700/50 z-50">
        <div className="flex items-center space-x-6">
          {/* Wave Heatmap Toggle */}
          <button
            onClick={() => toggleLayer('waves')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              layerVisibility.waves 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
            title="Toggle Wave Heatmap Layer"
          >
            <Waves className="w-4 h-4" />
            <span className="text-sm font-medium">Waves</span>
            {layerVisibility.waves && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
          </button>

          {/* Temperature Toggle */}
          <button
            onClick={() => toggleLayer('temperature')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              layerVisibility.temperature 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
            title="Toggle Sea Temperature Layer"
          >
            <Thermometer className="w-4 h-4" />
            <span className="text-sm font-medium">Temperature</span>
            {layerVisibility.temperature && <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>}
          </button>

          {/* Current Flow Toggle */}
          <button
            onClick={() => toggleLayer('currents')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              layerVisibility.currents 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
            title="Toggle Ocean Current Flow Layer"
          >
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-medium">Currents</span>
            {layerVisibility.currents && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
          </button>

          {/* Weather Radar Toggle */}
          <button
            onClick={() => toggleLayer('weather')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              layerVisibility.weather 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
            title="Toggle Weather Radar Layer"
          >
            <Radar className="w-4 h-4" />
            <span className="text-sm font-medium">Radar</span>
            {layerVisibility.weather && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>}
          </button>

          {/* Animation Toggle */}
          <div className="h-6 w-px bg-slate-600"></div>
          <button
            onClick={toggleAnimation}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              animationPlaying 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
            title={animationPlaying ? "Pause Animation" : "Start Animation"}
          >
            {animationPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm font-medium">Animation</span>
          </button>
        </div>
        
        {/* Active Layer Count */}
        <div className="mt-2 text-center">
          <span className="text-xs text-slate-400">
            {Object.values(layerVisibility).filter(v => v).length} layers active
          </span>
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

      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-64">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-blue-400" />
          Data Layers
        </h3>
        
        {/* Layer Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Waves className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm">Wave Heatmap</span>
            </div>
            <button
              onClick={() => toggleLayer('waves')}
              className={`p-1 rounded ${layerVisibility.waves ? 'text-green-400' : 'text-slate-500'}`}
            >
              {layerVisibility.waves ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Thermometer className="w-4 h-4 mr-2 text-red-400" />
              <span className="text-sm">Sea Temperature</span>
            </div>
            <button
              onClick={() => toggleLayer('temperature')}
              className={`p-1 rounded ${layerVisibility.temperature ? 'text-green-400' : 'text-slate-500'}`}
            >
              {layerVisibility.temperature ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Navigation className="w-4 h-4 mr-2 text-green-400" />
              <span className="text-sm">Current Flow</span>
            </div>
            <button
              onClick={() => toggleLayer('currents')}
              className={`p-1 rounded ${layerVisibility.currents ? 'text-green-400' : 'text-slate-500'}`}
            >
              {layerVisibility.currents ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Radar className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-sm">Weather Radar</span>
            </div>
            <button
              onClick={() => toggleLayer('weather')}
              className={`p-1 rounded ${layerVisibility.weather ? 'text-green-400' : 'text-slate-500'}`}
            >
              {layerVisibility.weather ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Animation Control */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm">Wave Animation</span>
            <button
              onClick={toggleAnimation}
              className={`p-2 rounded-lg ${animationPlaying ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}
            >
              {animationPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Legend for Arabian Sea */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 text-white">
        <h4 className="text-sm font-semibold mb-3">🇮🇳 Arabian Sea Conditions</h4>
        
        {/* Wave Height Scale */}
        <div className="mb-3">
          <h5 className="text-xs font-medium mb-2">Wave Height (m)</h5>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>0-1.5m</span>
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>1.5-2.5m</span>
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>2.5-3.5m</span>
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>3.5m+</span>
          </div>
        </div>

        {/* Temperature Scale */}
        <div className="mb-3">
          <h5 className="text-xs font-medium mb-2">Sea Temperature (°C)</h5>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span>22-24°</span>
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span>24-27°</span>
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span>27-30°</span>
            <div className="w-4 h-4 bg-red-400 rounded"></div>
            <span>30°+</span>
          </div>
        </div>

        {/* Station Types */}
        <div>
          <h5 className="text-xs font-medium mb-2">Monitoring Stations</h5>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center">
              <span className="mr-1">🏗️</span>
              <span>Major Port</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">🎣</span>
              <span>Fishing Port</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">🛢️</span>
              <span>Offshore</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">📡</span>
              <span>Monitor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS for Indian coastal stations */}
      <style jsx>{`
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