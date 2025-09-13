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
import SimpleMapboxFallback from './SimpleMapboxFallback';
import OceanCurrentsPanel from './OceanCurrentsPanel';

// Mapbox access token from environment variables
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const MapboxCoastalMonitor = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(72.8777); // Mumbai default
  const [lat, setLat] = useState(19.0760);
  const [zoom, setZoom] = useState(10);
  const [mapStyle, setMapStyle] = useState('satellite-v9');
  const [showLayers, setShowLayers] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [threatZones, setThreatZones] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isOceanPanelOpen, setIsOceanPanelOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  // Check if Mapbox token is available
  const hasMapboxToken = mapboxgl.accessToken && mapboxgl.accessToken !== 'undefined';

  // Show fallback component if no token or if map initialization failed
  if (!hasMapboxToken || mapError) {
    return <SimpleMapboxFallback />;
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
          "name": "Puri-Konark Coast (Odisha)",
          "threatLevel": "critical",
          "category": "Cyclone Corridor",
          "riskScore": 0.92,
          "floodRisk": 0.85,
          "stormSurgeRisk": 0.95,
          "erosionRisk": 0.8,
          "population": 300000,
          "description": "Most cyclone-prone area in India with frequent super cyclones",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Super cyclone zone", "Storm surge up to 7m", "Coastal erosion"],
          "examples": ["Cyclone Fani (2019)", "1999 Super Cyclone", "Frequent evacuations"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [85.7000, 19.7000],
            [86.2000, 19.7000],
            [86.2000, 20.0000],
            [85.7000, 20.0000],
            [85.7000, 19.7000]
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
      {
        "type": "Feature",
        "properties": {
          "name": "Kochi-Alappuzha Backwaters",
          "threatLevel": "high",
          "category": "Saltwater Intrusion",
          "riskScore": 0.75,
          "floodRisk": 0.8,
          "stormSurgeRisk": 0.7,
          "erosionRisk": 0.65,
          "population": 2100000,
          "description": "Unique backwater ecosystem threatened by saltwater intrusion and extreme rainfall",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Saltwater intrusion", "Extreme monsoon flooding", "Ecosystem degradation"],
          "examples": ["2018 Kerala floods", "Vembanad Lake salinity", "Coconut grove loss"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [76.1000, 9.4000],
            [76.4000, 9.4000],
            [76.4000, 10.0000],
            [76.1000, 10.0000],
            [76.1000, 9.4000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Visakhapatnam Industrial Coast",
          "threatLevel": "high",
          "category": "Industrial & Port Risks",
          "riskScore": 0.72,
          "floodRisk": 0.7,
          "stormSurgeRisk": 0.75,
          "erosionRisk": 0.6,
          "population": 2500000,
          "description": "Major port city with industrial pollution and cyclone exposure",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Industrial pollution", "Port infrastructure risk", "Cyclone exposure"],
          "examples": ["Vizag gas leak (2020)", "Cyclone Hudhud (2014)", "Beach pollution"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [83.2000, 17.6000],
            [83.4000, 17.6000],
            [83.4000, 17.8000],
            [83.2000, 17.8000],
            [83.2000, 17.6000]
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
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Mangalore-Udupi Coast",
          "threatLevel": "medium",
          "category": "Monsoon Flooding",
          "riskScore": 0.55,
          "floodRisk": 0.7,
          "stormSurgeRisk": 0.4,
          "erosionRisk": 0.5,
          "population": 1200000,
          "description": "Western Ghats coastal region with intense monsoon and moderate risks",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Heavy monsoon rains", "River flooding", "Landslide risk"],
          "examples": ["Netravati floods", "Coastal highway damage", "Port congestion"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [74.7000, 12.8000],
            [74.9000, 12.8000],
            [74.9000, 13.4000],
            [74.7000, 13.4000],
            [74.7000, 12.8000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Puducherry-Cuddalore Coast",
          "threatLevel": "medium",
          "category": "Cyclone & Erosion",
          "riskScore": 0.62,
          "floodRisk": 0.65,
          "stormSurgeRisk": 0.7,
          "erosionRisk": 0.6,
          "population": 950000,
          "description": "Former French colony facing moderate cyclone and erosion risks",
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Cyclone season", "Beach erosion", "Fishing village threats"],
          "examples": ["Cyclone Gaja impact", "Promenade flooding", "Fishing harbor damage"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [79.8000, 11.7000],
            [80.0000, 11.7000],
            [80.0000, 12.0000],
            [79.8000, 12.0000],
            [79.8000, 11.7000]
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
          "state": "West Bengal",
          "district": "East Midnapore",
          "contact": "+91-3220-267001"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [87.5127, 21.6288]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Kakdwip Emergency Center",
          "type": "emergency_shelter",
          "capacity": 3000,
          "facilities": ["Boat rescue", "Medical facility", "Temporary housing"],
          "state": "West Bengal",
          "district": "South 24 Parganas",
          "contact": "+91-3210-255003"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [88.1827, 21.8588]
        }
      },
      // Odisha Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Puri Jagannath Relief Center",
          "type": "emergency_shelter",
          "capacity": 8000,
          "facilities": ["Mass shelter", "Food kitchen", "Medical camp", "Helicopter pad"],
          "state": "Odisha",
          "district": "Puri",
          "contact": "+91-6752-222644"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [85.8312, 19.8135]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Paradip Port Emergency Base",
          "type": "emergency_shelter",
          "capacity": 4000,
          "facilities": ["Coast guard station", "Medical facility", "Communication hub"],
          "state": "Odisha",
          "district": "Jagatsinghpur",
          "contact": "+91-6722-262626"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [86.6094, 20.2648]
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
          "state": "Maharashtra",
          "district": "Mumbai Suburban",
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
          "state": "Tamil Nadu",
          "district": "Chennai",
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
          "state": "Kerala",
          "district": "Ernakulam",
          "contact": "+91-484-2668221"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [76.2673, 9.9312]
        }
      },
      // Andhra Pradesh Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Visakhapatnam Port Emergency Center",
          "type": "emergency_shelter",
          "capacity": 5500,
          "facilities": ["Port facility", "Medical center", "Coast guard coordination"],
          "state": "Andhra Pradesh",
          "district": "Visakhapatnam",
          "contact": "+91-891-2884000"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [83.3007, 17.7231]
        }
      },
      // Goa Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Panaji Disaster Management Center",
          "type": "emergency_shelter",
          "capacity": 2000,
          "facilities": ["State headquarters", "Medical facility", "Tourist assistance"],
          "state": "Goa",
          "district": "North Goa",
          "contact": "+91-832-2419747"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [73.8278, 15.4989]
        }
      },
      // Karnataka Shelters
      {
        "type": "Feature",
        "properties": {
          "name": "Mangalore Emergency Response Base",
          "type": "emergency_shelter",
          "capacity": 3200,
          "facilities": ["Port coordination", "Medical facility", "Rescue boats"],
          "state": "Karnataka",
          "district": "Dakshina Kannada",
          "contact": "+91-824-2220000"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [74.8560, 12.9141]
        }
      }
    ]
  };
            [80.3000, 13.0500],
            [80.3000, 13.1000],
            [80.2500, 13.1000],
            [80.2500, 13.0500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Kerala Backwater Monitoring Zone",
          "threatLevel": "medium",
          "riskScore": 0.55,
          "floodRisk": 0.6,
          "stormSurgeRisk": 0.5,
          "population": 85000,
          "lastUpdated": "2025-09-12T17:00:00Z",
          "alerts": ["Saltwater intrusion monitoring"],
          "shelters": ["Kochi Relief Center", "Alleppey Community Hall"]
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [76.2000, 9.9000],
            [76.3000, 9.9000],
            [76.3000, 10.0000],
            [76.2000, 10.0000],
            [76.2000, 9.9000]
          ]]
        }
      }
    ]
  };

  // Emergency shelter locations
  const emergencyShelters = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Bandra Community Center",
          "capacity": 500,
          "type": "Community Center",
          "contact": "+91-22-2640-3456",
          "facilities": ["Medical Aid", "Food", "Communications"]
        },
        "geometry": {
          "type": "Point",
          "coordinates": [72.8401, 19.0596]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Marina Beach Emergency Center",
          "capacity": 800,
          "type": "Emergency Center",
          "contact": "+91-44-2841-2345",
          "facilities": ["Medical Aid", "Food", "Rescue Equipment"]
        },
        "geometry": {
          "type": "Point",
          "coordinates": [80.2785, 13.0475]
        }
      }
    ]
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: [lng, lat],
        zoom: zoom,
        projection: 'globe' // Enable globe projection for satellite view
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map. Please check your internet connection and try again.');
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
        setLocationError('Unable to access your location. Please enable location permissions.');
      });

      // Automatically trigger location detection after map loads
      setTimeout(() => {
        try {
          geolocate.trigger();
        } catch (err) {
          console.log('Auto-location trigger failed, user can click the button manually');
          // If auto-location fails, fetch weather for default location (Mumbai)
          fetchWeatherData(lat, lng);
        }
      }, 1000);

      // Also fetch weather for default location immediately
      fetchWeatherData(lat, lng);

    // Set fog for satellite view
    map.current.on('style.load', () => {
      map.current.setFog({}); // Add atmospheric fog for globe view
      
      // Add coastal threat zones layer
      map.current.addSource('threat-zones', {
        'type': 'geojson',
        'data': coastalThreatData
      });

      // Add threat zones polygons
      map.current.addLayer({
        'id': 'threat-zones-fill',
        'type': 'fill',
        'source': 'threat-zones',
        'paint': {
          'fill-color': [
            'case',
            ['==', ['get', 'threatLevel'], 'critical'], '#dc2626',
            ['==', ['get', 'threatLevel'], 'high'], '#ea580c',
            ['==', ['get', 'threatLevel'], 'medium'], '#d97706',
            '#16a34a'
          ],
          'fill-opacity': 0.3
        }
      });

      // Add threat zones borders
      map.current.addLayer({
        'id': 'threat-zones-border',
        'type': 'line',
        'source': 'threat-zones',
        'paint': {
          'line-color': [
            'case',
            ['==', ['get', 'threatLevel'], 'critical'], '#dc2626',
            ['==', ['get', 'threatLevel'], 'high'], '#ea580c',
            ['==', ['get', 'threatLevel'], 'medium'], '#d97706',
            '#16a34a'
          ],
          'line-width': 2
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
          'circle-color': '#22c55e',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      // Add shelter labels
      map.current.addLayer({
        'id': 'shelter-labels',
        'type': 'symbol',
        'source': 'shelters',
        'layout': {
          'text-field': ['get', 'name'],
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-size': 12
        },
        'paint': {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
    });

    // Handle map clicks for threat zones
    map.current.on('click', 'threat-zones-fill', (e) => {
      const properties = e.features[0].properties;
      setSelectedLocation({
        type: 'threat-zone',
        data: properties,
        coordinates: e.lngLat
      });
      
      // Create popup
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(createThreatZonePopup(properties))
        .addTo(map.current);
    });

    // Handle map clicks for shelters
    map.current.on('click', 'shelters', (e) => {
      const properties = e.features[0].properties;
      setSelectedLocation({
        type: 'shelter',
        data: properties,
        coordinates: e.lngLat
      });
      
      // Create popup
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(createShelterPopup(properties))
        .addTo(map.current);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'threat-zones-fill', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'threat-zones-fill', () => {
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', 'shelters', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'shelters', () => {
      map.current.getCanvas().style.cursor = '';
    });

    // Update coordinates display
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map. Please check your Mapbox token and try again.');
    }
  }, []);

  // Create threat zone popup content
  const createThreatZonePopup = (properties) => {
    return `
      <div class="p-4 max-w-sm">
        <h3 class="font-bold text-lg mb-2">${properties.name}</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Threat Level:</span>
            <span class="px-2 py-1 rounded text-xs font-medium ${
              properties.threatLevel === 'critical' ? 'bg-red-500 text-white' :
              properties.threatLevel === 'high' ? 'bg-orange-500 text-white' :
              'bg-yellow-500 text-white'
            }">${properties.threatLevel.toUpperCase()}</span>
          </div>
          <div class="flex justify-between">
            <span>Risk Score:</span>
            <span class="font-semibold">${(properties.riskScore * 100).toFixed(0)}%</span>
          </div>
          <div class="flex justify-between">
            <span>Population at Risk:</span>
            <span class="font-semibold">${properties.population.toLocaleString()}</span>
          </div>
          <div class="mt-3">
            <strong>Active Alerts:</strong>
            <ul class="list-disc list-inside text-sm mt-1">
              ${JSON.parse(properties.alerts || '[]').map(alert => `<li>${alert}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  };

  // Create shelter popup content
  const createShelterPopup = (properties) => {
    return `
      <div class="p-4 max-w-sm">
        <h3 class="font-bold text-lg mb-2">${properties.name}</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Type:</span>
            <span class="font-semibold">${properties.type}</span>
          </div>
          <div class="flex justify-between">
            <span>Capacity:</span>
            <span class="font-semibold">${properties.capacity} people</span>
          </div>
          <div class="flex justify-between">
            <span>Contact:</span>
            <span class="font-semibold">${properties.contact}</span>
          </div>
          <div class="mt-3">
            <strong>Facilities:</strong>
            <ul class="list-disc list-inside text-sm mt-1">
              ${JSON.parse(properties.facilities || '[]').map(facility => `<li>${facility}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  };

  // Fetch weather data for user location
  const fetchWeatherData = async (latitude, longitude) => {
    console.log('Fetching weather data for:', latitude, longitude);
    setIsLoading(true);
    setWeatherData(null); // Clear previous data
    
    try {
      // Test direct API call
      const apiKey = '28f50b598197a700d0fdee8fd331f99c';
      const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      console.log('API URL:', testUrl);
      
      const directResponse = await fetch(testUrl);
      const directData = await directResponse.json();
      console.log('Direct API response:', directData);
      
      if (directResponse.ok) {
        // Set weather data directly from API response
        setWeatherData(directData);
        console.log('Weather data set successfully:', directData);
      } else {
        console.error('API Error:', directData);
        throw new Error(`API Error: ${directData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Change map style
  const changeMapStyle = (style) => {
    setMapStyle(style);
    if (map.current) {
      map.current.setStyle(`mapbox://styles/mapbox/${style}`);
      
      // Re-add layers after style change
      map.current.once('style.load', () => {
        if (style === 'satellite-v9') {
          map.current.setFog({}); // Add fog for satellite view
        }
        // Re-add all custom layers here
        // This would be handled automatically if using Mapbox Studio tilesets
      });
    }
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId) => {
    if (map.current && map.current.getLayer(layerId)) {
      const visibility = map.current.getLayoutProperty(layerId, 'visibility');
      map.current.setLayoutProperty(
        layerId,
        'visibility',
        visibility === 'visible' ? 'none' : 'visible'
      );
    }
  };

  // Fetch weather data on component mount
  useEffect(() => {
    console.log('Component mounted, fetching weather data for default location');
    
    // Add global test function
    window.testWeather = async () => {
      console.log('Testing weather API directly...');
      try {
        const response = await fetch('https://api.openweathermap.org/data/2.5/weather?lat=19.0760&lon=72.8777&appid=28f50b598197a700d0fdee8fd331f99c&units=metric');
        const data = await response.json();
        console.log('Test weather response:', data);
        return data;
      } catch (error) {
        console.error('Test weather error:', error);
        return null;
      }
    };
    
    fetchWeatherData(lat, lng);
  }, []); // Run once on mount

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Control Panel */}
      <div className={`
        absolute top-4 left-4 transition-all duration-300 ease-in-out
        bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20
        ${isPanelOpen 
          ? 'max-w-sm p-5' 
          : 'w-14 h-14 p-0 hover:shadow-2xl'
        }
      `}>
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className={`
            absolute z-10 transition-all duration-300 ease-in-out
            ${isPanelOpen 
              ? 'top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white border border-gray-200 shadow-sm' 
              : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-700 shadow-lg'
            }
            rounded-full flex items-center justify-center
            hover:scale-110 active:scale-95
            backdrop-blur-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          `}
          title={isPanelOpen ? 'Minimize Panel' : 'Open Control Panel'}
        >
          {isPanelOpen ? (
            <X className="h-4 w-4 text-gray-700 transition-transform duration-200" />
          ) : (
            <Menu className="h-5 w-5 text-white transition-transform duration-200" />
          )}
        </button>

        {/* Panel Content */}
        {isPanelOpen && (
          <div className="animate-in fade-in-0 duration-200">
            <div className="pr-10 mb-4"> {/* Add padding to avoid overlap with close button */}
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Satellite className="h-5 w-5 text-blue-600" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Coastal Monitor
                </span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Real-time coastal threat analysis</p>
            </div>

        {/* Location Status */}
        {userLocation && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
            <div className="flex items-center text-green-800">
              <Navigation className="h-4 w-4 mr-1" />
              <span>Location: {userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)}</span>
            </div>
          </div>
        )}

        {/* Location Error */}
        {locationError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>{locationError}</span>
            </div>
            <div className="mt-1 text-xs text-red-600">
              Click the location button (📍) on the map to try again.
            </div>
          </div>
        )}

        {/* Weather Refresh Button */}
        <div className="mb-4">
          <button
            onClick={() => fetchWeatherData(lat, lng)}
            disabled={isLoading}
            className="
              w-full flex items-center justify-center px-4 py-3 
              bg-gradient-to-r from-blue-600 to-blue-700 
              hover:from-blue-700 hover:to-blue-800
              disabled:from-gray-400 disabled:to-gray-500
              text-white rounded-xl shadow-lg hover:shadow-xl
              transition-all duration-300 ease-in-out
              transform hover:scale-[1.02] active:scale-[0.98]
              font-medium text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            "
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Updating Weather...</span>
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                <span>Refresh Weather Data</span>
              </>
            )}
          </button>
        </div>

        {/* Map Style Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Map Style</label>
          <select
            value={mapStyle}
            onChange={(e) => changeMapStyle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="satellite-v9">Satellite</option>
            <option value="satellite-streets-v12">Satellite Streets</option>
            <option value="streets-v12">Streets</option>
            <option value="outdoors-v12">Outdoors</option>
            <option value="dark-v11">Dark</option>
          </select>
        </div>

        {/* Layer Controls */}
        <div className="mb-4">
          <label className="flex items-center text-sm font-medium mb-2">
            <Layers className="h-4 w-4 mr-1" />
            Layers
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                onChange={() => toggleLayerVisibility('threat-zones-fill')}
                className="mr-2"
              />
              <span className="text-sm">Threat Zones</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                onChange={() => toggleLayerVisibility('shelters')}
                className="mr-2"
              />
              <span className="text-sm">Emergency Shelters</span>
            </label>
          </div>
        </div>

        {/* Coordinates Display */}
        <div className="text-xs text-gray-600 border-t pt-2">
          <div>Longitude: {lng}</div>
          <div>Latitude: {lat}</div>
          <div>Zoom: {zoom}</div>
        </div>

        {/* Weather Info */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Cloud className="h-4 w-4 mr-1" />
            Current Weather
          </h3>
          {isLoading ? (
            <div className="text-xs text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading weather data...
            </div>
          ) : weatherData ? (
            <div className="text-xs space-y-1">
              <div className="flex items-center">
                <Thermometer className="h-3 w-3 mr-1 text-red-500" />
                Temperature: {weatherData.main?.temp ? Math.round(weatherData.main.temp) : 'N/A'}°C
              </div>
              <div className="flex items-center">
                <Cloud className="h-3 w-3 mr-1 text-gray-500" />
                Conditions: {weatherData.weather?.[0]?.description || 'N/A'}
              </div>
              <div className="flex items-center">
                <Wind className="h-3 w-3 mr-1 text-blue-500" />
                Wind: {weatherData.wind?.speed || 'N/A'} m/s
              </div>
              <div className="flex items-center">
                <Droplets className="h-3 w-3 mr-1 text-blue-400" />
                Humidity: {weatherData.main?.humidity || 'N/A'}%
              </div>
              {weatherData.main?.pressure && (
                <div className="flex items-center">
                  <Activity className="h-3 w-3 mr-1 text-purple-500" />
                  Pressure: {weatherData.main.pressure} hPa
                </div>
              )}
              {weatherData.main?.feels_like && (
                <div className="flex items-center">
                  <Thermometer className="h-3 w-3 mr-1 text-orange-500" />
                  Feels like: {Math.round(weatherData.main.feels_like)}°C
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                Location: {weatherData.name || 'Unknown'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              <div>Click "Refresh Weather" to get weather data</div>
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div>Debug Info:</div>
                <div>Lat: {lat}, Lng: {lng}</div>
                <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>Data: {weatherData ? 'Available' : 'None'}</div>
              </div>
            </div>
          )}
        </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-5">
        <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
          <Shield className="h-4 w-4 mr-2 text-blue-600" />
          Threat Levels
        </h3>
        <div className="space-y-2">
          <div className="flex items-center py-1 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-4 h-4 bg-red-600 rounded-md mr-3 shadow-sm"></div>
            <span className="text-gray-700 font-medium">Critical Risk</span>
          </div>
          <div className="flex items-center py-1 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-4 h-4 bg-orange-600 rounded-md mr-3 shadow-sm"></div>
            <span className="text-gray-700 font-medium">High Risk</span>
          </div>
          <div className="flex items-center py-1 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-4 h-4 bg-yellow-600 rounded-md mr-3 shadow-sm"></div>
            <span className="text-gray-700 font-medium">Medium Risk</span>
          </div>
          <div className="flex items-center py-1 px-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-4 h-4 bg-green-600 rounded-md mr-3 shadow-sm"></div>
            <span className="text-gray-700 font-medium">Emergency Shelter</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-16 bg-blue-600 text-white p-3 rounded-lg shadow-lg max-w-xs">
        <div className="text-sm">
          <div className="font-medium mb-1">🗺️ Interactive Coastal Map</div>
          <div>• Click threat zones for details</div>
          <div>• Click shelters for info</div>
          <div>• Use location button to center on you</div>
        </div>
      </div>
    </div>
  );
};

export default MapboxCoastalMonitor;