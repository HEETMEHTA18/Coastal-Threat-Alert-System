// Ocean Currents Visualization Service
// Adds visual arrows and speed indicators for ocean currents on Mapbox

class CurrentsVisualizationService {
  constructor(map) {
    this.map = map;
    this.currentArrows = [];
    this.isVisualizationActive = false;
  }

  // Add current arrows visualization to the map
  addCurrentsVisualization(currentsData) {
    if (!currentsData || !currentsData.currents || !this.map) return;

    this.clearCurrentsVisualization();
    
    const station = currentsData.station;
    const recentCurrents = currentsData.currents.slice(0, 1); // Most recent reading
    
    if (recentCurrents.length === 0) return;

    const current = recentCurrents[0];
    
    // Create arrow GeoJSON feature
    const arrowFeature = this.createCurrentArrow(
      station.lng, 
      station.lat, 
      current.speed, 
      current.direction
    );

    // Add source for current arrows
    if (!this.map.getSource('current-arrows')) {
      this.map.addSource('current-arrows', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [arrowFeature]
        }
      });

      // Add arrow layer
      this.map.addLayer({
        id: 'current-arrows',
        type: 'symbol',
        source: 'current-arrows',
        layout: {
          'icon-image': 'arrow-icon',
          'icon-size': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, 0.3,
            1, 0.5,
            2, 0.8,
            3, 1.2
          ],
          'icon-rotate': ['get', 'direction'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        },
        paint: {
          'icon-opacity': 0.8
        }
      });

      // Add speed circle layer
      this.map.addLayer({
        id: 'current-speed-circles',
        type: 'circle',
        source: 'current-arrows',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, 5,
            1, 10,
            2, 15,
            3, 20
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, '#3b82f6',
            1, '#10b981',
            2, '#f59e0b',
            3, '#ef4444'
          ],
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, '#3b82f6',
            1, '#10b981',
            2, '#f59e0b',
            3, '#ef4444'
          ],
          'circle-stroke-opacity': 0.8
        }
      });

      this.createArrowIcon();
    } else {
      // Update existing source
      this.map.getSource('current-arrows').setData({
        type: 'FeatureCollection',
        features: [arrowFeature]
      });
    }

    this.isVisualizationActive = true;
  }

  // Create arrow feature for current direction and speed
  createCurrentArrow(lng, lat, speed, direction) {
    return {
      type: 'Feature',
      properties: {
        speed: speed,
        direction: direction,
        speedKnots: speed.toFixed(1),
        directionDegrees: direction
      },
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    };
  }

  // Create arrow icon for current direction
  createArrowIcon() {
    if (this.map.hasImage('arrow-icon')) return;

    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Set arrow style
    ctx.fillStyle = '#1e40af';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Draw arrow pointing up (will be rotated by map)
    ctx.beginPath();
    ctx.moveTo(size/2, 4); // Arrow tip
    ctx.lineTo(size/2 - 8, size/2 + 4); // Left wing
    ctx.lineTo(size/2 - 4, size/2 + 4); // Left wing inner
    ctx.lineTo(size/2 - 4, size - 4); // Left side of shaft
    ctx.lineTo(size/2 + 4, size - 4); // Right side of shaft
    ctx.lineTo(size/2 + 4, size/2 + 4); // Right wing inner
    ctx.lineTo(size/2 + 8, size/2 + 4); // Right wing
    ctx.closePath();

    // Fill and stroke the arrow
    ctx.fill();
    ctx.stroke();

    // Add the icon to the map
    this.map.addImage('arrow-icon', canvas);
  }

  // Add multiple current stations visualization
  addMultipleCurrentsVisualization(stationsData) {
    if (!stationsData || stationsData.length === 0) return;

    this.clearCurrentsVisualization();

    const features = stationsData.map(stationData => {
      if (!stationData.currents || stationData.currents.length === 0) return null;
      
      const current = stationData.currents[0]; // Most recent
      return this.createCurrentArrow(
        stationData.station.lng,
        stationData.station.lat,
        current.speed,
        current.direction
      );
    }).filter(feature => feature !== null);

    if (features.length === 0) return;

    // Add source for multiple current arrows
    if (!this.map.getSource('current-arrows')) {
      this.map.addSource('current-arrows', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      this.createArrowIcon();

      // Add layers (same as single station)
      this.map.addLayer({
        id: 'current-arrows',
        type: 'symbol',
        source: 'current-arrows',
        layout: {
          'icon-image': 'arrow-icon',
          'icon-size': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, 0.3,
            1, 0.5,
            2, 0.8,
            3, 1.2
          ],
          'icon-rotate': ['get', 'direction'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        },
        paint: {
          'icon-opacity': 0.8
        }
      });

      this.map.addLayer({
        id: 'current-speed-circles',
        type: 'circle',
        source: 'current-arrows',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, 5,
            1, 10,
            2, 15,
            3, 20
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, '#3b82f6',
            1, '#10b981',
            2, '#f59e0b',
            3, '#ef4444'
          ],
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0, '#3b82f6',
            1, '#10b981',
            2, '#f59e0b',
            3, '#ef4444'
          ],
          'circle-stroke-opacity': 0.8
        }
      });
    } else {
      this.map.getSource('current-arrows').setData({
        type: 'FeatureCollection',
        features: features
      });
    }

    this.isVisualizationActive = true;
  }

  // Clear currents visualization
  clearCurrentsVisualization() {
    if (this.map.getLayer('current-arrows')) {
      this.map.removeLayer('current-arrows');
    }
    if (this.map.getLayer('current-speed-circles')) {
      this.map.removeLayer('current-speed-circles');
    }
    if (this.map.getSource('current-arrows')) {
      this.map.removeSource('current-arrows');
    }
    this.isVisualizationActive = false;
  }

  // Toggle currents visualization
  toggleVisualization() {
    if (this.isVisualizationActive) {
      this.clearCurrentsVisualization();
    } else {
      // Re-fetch and display current data
      this.fetchAndDisplayCurrents();
    }
  }

  // Fetch current data for all Indian coastal stations and display
  async fetchAndDisplayCurrents() {
    try {
      const oceanService = new (await import('./oceanCurrentsService.js')).default();
      const stations = oceanService.getAvailableStations().currents;
      
      const stationsData = await Promise.all(
        stations.slice(0, 3).map(async station => { // Limit to first 3 stations
          const data = await oceanService.fetchCurrentData(station.noaaId, 1);
          return data;
        })
      );

      this.addMultipleCurrentsVisualization(stationsData.filter(data => data !== null));
    } catch (error) {
      console.error('Error fetching currents for visualization:', error);
    }
  }

  // Update visualization with new data
  updateVisualization(newData) {
    if (Array.isArray(newData)) {
      this.addMultipleCurrentsVisualization(newData);
    } else {
      this.addCurrentsVisualization(newData);
    }
  }

  // Get visualization status
  isActive() {
    return this.isVisualizationActive;
  }

  // Add popup interaction for current arrows
  addCurrentPopups() {
    if (!this.map.getLayer('current-arrows')) return;

    this.map.on('click', 'current-arrows', (e) => {
      const properties = e.features[0].properties;
      const popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="current-popup">
            <h3 class="font-bold text-lg mb-2">Ocean Current</h3>
            <div class="space-y-1">
              <div class="text-sm">
                <strong>Speed:</strong> ${properties.speedKnots} knots
              </div>
              <div class="text-sm">
                <strong>Direction:</strong> ${properties.directionDegrees}°
              </div>
              <div class="text-sm">
                <strong>Cardinal:</strong> ${this.degreesToCardinal(properties.directionDegrees)}
              </div>
            </div>
          </div>
        `)
        .addTo(this.map);
    });

    // Change cursor on hover
    this.map.on('mouseenter', 'current-arrows', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'current-arrows', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  // Convert degrees to cardinal direction
  degreesToCardinal(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }
}

export default CurrentsVisualizationService;