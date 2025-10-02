import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import FallbackMap from './FallbackMap';
import OSMFallbackMap from './OSMFallbackMap';
import { 
  Map, 
  Square, 
  Circle, 
  Polygon, 
  Trash2, 
  Download,
  AlertTriangle,
  Info,
  Activity,
  BarChart3
} from 'lucide-react';

// Read Mapbox token from env without fallback
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
import { INDIA_BOUNDS } from '../data/indiaRegions';

const SimpleInteractiveMap = () => {
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [coastalData, setCoastalData] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const mapContainer = useRef(null);

  // Load coastal threat data
  useEffect(() => {
    const loadCoastalData = async () => {
      try {
        const response = await fetch('/coastal-threat-predictions.json');
        const data = await response.json();
        setCoastalData(data);
        console.log('✅ Coastal data loaded:', data);
      } catch (error) {
        console.error('❌ Failed to load coastal data:', error);
        // Fallback to demo data
        setCoastalData({
          type: "FeatureCollection",
          features: []
        });
      }
    };
    loadCoastalData();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    // If token missing, show FallbackMap instead of initializing mapbox
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token missing: rendering FallbackMap.');
      setIsLoading(false);
      setError('Mapbox token not configured');
      return;
    }

    try {
      console.log('🗺️ Initializing Interactive Coastal Map...');
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Initialize Mapbox map
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [78.9629, 20.5937], // India center
        zoom: 5,
        bearing: 0,
        pitch: 0
      });

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      mapInstance.addControl(new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
      }), 'bottom-left');

      mapInstance.on('load', () => {
        console.log('✅ Map loaded successfully');
        
        // Add coastal threat zones layer
        if (coastalData && coastalData.features?.length > 0) {
          mapInstance.addSource('coastal-threats', {
            type: 'geojson',
            data: coastalData
          });

          // Add threat zones fill layer
          mapInstance.addLayer({
            id: 'threat-zones-fill',
            type: 'fill',
            source: 'coastal-threats',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'threat_level'], 'critical'], '#dc2626',
                ['==', ['get', 'threat_level'], 'high'], '#ea580c',
                ['==', ['get', 'threat_level'], 'medium'], '#d97706',
                '#16a34a'
              ],
              'fill-opacity': 0.3
            }
          });

          // Add threat zones outline layer
          mapInstance.addLayer({
            id: 'threat-zones-outline',
            type: 'line',
            source: 'coastal-threats',
            paint: {
              'line-color': [
                'case',
                ['==', ['get', 'threat_level'], 'critical'], '#dc2626',
                ['==', ['get', 'threat_level'], 'high'], '#ea580c',
                ['==', ['get', 'threat_level'], 'medium'], '#d97706',
                '#16a34a'
              ],
              'line-width': 2
            }
          });

          // Add click handler for threat zones
          mapInstance.on('click', 'threat-zones-fill', (e) => {
            const properties = e.features[0].properties;
            showThreatZonePopup(mapInstance, e.lngLat, properties);
          });

          // Change cursor on hover
          mapInstance.on('mouseenter', 'threat-zones-fill', () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });

          mapInstance.on('mouseleave', 'threat-zones-fill', () => {
            mapInstance.getCanvas().style.cursor = '';
          });
        }

        // Add click handler for general map clicks
        mapInstance.on('click', (e) => {
          setClickedCoords(e.lngLat);
          generateClickPrediction(e.lngLat);
        });

        // Fit to India by default
        try { mapInstance.fitBounds(INDIA_BOUNDS, { padding: 40, duration: 800 }); } catch (e) {}
        setIsLoading(false);
      });

      mapInstance.on('error', (e) => {
        console.error('❌ Map error:', e);
        setError('Map failed to load properly');
        setIsLoading(false);
      });

      setMap(mapInstance);

      return () => mapInstance.remove();
    } catch (error) {
      console.error('❌ Map initialization error:', error);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  }, [coastalData]);

  const showThreatZonePopup = (mapInstance, lngLat, properties) => {
    const popup = new mapboxgl.Popup()
      .setLngLat(lngLat)
      .setHTML(`
        <div class="p-3 max-w-sm">
          <h3 class="font-bold text-lg mb-2">${properties.name}</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Threat Level:</span>
              <span class="px-2 py-1 rounded text-xs font-medium
                ${properties.threat_level === 'critical' ? 'bg-red-100 text-red-800' :
                  properties.threat_level === 'high' ? 'bg-orange-100 text-orange-800' :
                  properties.threat_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'}">
                ${properties.threat_level.toUpperCase()}
              </span>
            </div>
            <div class="text-sm">
              <strong>Flood Risk:</strong> ${(properties.flood_risk * 100).toFixed(0)}%
            </div>
            <div class="text-sm">
              <strong>Storm Surge Risk:</strong> ${(properties.storm_surge_risk * 100).toFixed(0)}%
            </div>
            <div class="text-sm">
              <strong>Population at Risk:</strong> ${properties.population_at_risk.toLocaleString()}
            </div>
            <div class="text-sm mt-2">
              <strong>Predicted Impact:</strong><br/>
              ${properties.predicted_impact}
            </div>
          </div>
        </div>
      `)
      .addTo(mapInstance);
  };

  const generateClickPrediction = (lngLat) => {
    if (!coastalData || !coastalData.features) return;

    // Find nearby threat zones
    const nearbyZones = coastalData.features.filter(feature => {
      if (!feature.geometry || !feature.geometry.coordinates) return false;
      
      // Simple distance check (this is a simplified version)
      const coords = feature.geometry.coordinates[0];
      if (!coords || !coords[0]) return false;
      
      const zoneLng = coords[0][0];
      const zoneLat = coords[0][1];
      
      const distance = Math.sqrt(
        Math.pow(zoneLng - lngLat.lng, 2) + Math.pow(zoneLat - lngLat.lat, 2)
      );
      
      return distance < 2; // Within ~2 degrees
    });

    if (nearbyZones.length > 0) {
      const prediction = {
        id: Date.now(),
        coordinates: [lngLat.lng, lngLat.lat],
        timestamp: new Date().toISOString(),
        nearbyZones: nearbyZones.map(zone => zone.properties.name),
        threatLevel: nearbyZones[0].properties.threat_level,
        floodRisk: nearbyZones[0].properties.flood_risk,
        stormSurgeRisk: nearbyZones[0].properties.storm_surge_risk,
        populationAtRisk: nearbyZones[0].properties.population_at_risk,
        recommendations: nearbyZones[0].properties.recommendations.slice(0, 3)
      };

      setPredictions(prev => [...prev.slice(-4), prediction]); // Keep last 5 predictions
    }
  };

  const clearPredictions = () => {
    setPredictions([]);
    setClickedCoords(null);
  };

  const exportPredictions = () => {
    const data = {
      predictions,
      exportedAt: new Date().toISOString(),
      totalPredictions: predictions.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coastal-predictions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    if (error === 'Mapbox token not configured') {
      return <OSMFallbackMap />;
    }

    return (
      <div className="h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Map Error</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Interactive Coastal Map...</p>
          </div>
        </div>
      )}

      {/* Simple Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium">Click anywhere on the map for analysis</div>
          {predictions.length > 0 && (
            <button
              onClick={clearPredictions}
              className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
              title="Clear Predictions"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Map Draw + Report control removed */}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
        <h4 className="font-semibold mb-2 flex items-center">
          <Info size={16} className="mr-2" />
          Threat Levels
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 opacity-30 mr-2 rounded"></div>
            <span>Critical Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-600 opacity-30 mr-2 rounded"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-600 opacity-30 mr-2 rounded"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 opacity-30 mr-2 rounded"></div>
            <span>Low Risk</span>
          </div>
        </div>
      </div>

      {/* Predictions Panel */}
      {predictions.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-md max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center">
              <Activity size={16} className="mr-2" />
              Point Analysis ({predictions.length})
            </h4>
            <button
              onClick={exportPredictions}
              className="p-1 rounded hover:bg-gray-100"
              title="Export Predictions"
            >
              <Download size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            {predictions.map((prediction, index) => (
              <div key={prediction.id} className="border rounded p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Point {index + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium
                    ${prediction.threatLevel === 'critical' ? 'bg-red-100 text-red-800' :
                      prediction.threatLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                      prediction.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}`}>
                    {prediction.threatLevel?.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Coordinates:</strong> {prediction.coordinates[1].toFixed(4)}, {prediction.coordinates[0].toFixed(4)}
                  </div>
                  <div>
                    <strong>Flood Risk:</strong> {(prediction.floodRisk * 100).toFixed(0)}%
                  </div>
                  <div>
                    <strong>Storm Surge Risk:</strong> {(prediction.stormSurgeRisk * 100).toFixed(0)}%
                  </div>
                  
                  {prediction.nearbyZones?.length > 0 && (
                    <div>
                      <strong>Nearby Zones:</strong>
                      <ul className="list-disc list-inside text-xs mt-1">
                        {prediction.nearbyZones.map((zone, i) => (
                          <li key={i}>{zone}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {prediction.recommendations?.length > 0 && (
                    <div>
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside text-xs mt-1">
                        {prediction.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {predictions.length === 0 && !isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 rounded-lg p-6 text-center z-10 max-w-md">
          <h3 className="font-semibold mb-2">Coastal Threat Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click anywhere on the map to get coastal threat predictions for that location. 
            Colored zones show existing threat data.
          </p>
          <div className="text-xs text-gray-500">
            Click on colored zones for detailed information
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleInteractiveMap;