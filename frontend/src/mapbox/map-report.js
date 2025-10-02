// Minimal Mapbox + Mapbox Draw helper to capture polygon GeoJSON and POST to backend
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// Usage: initMapReport({ map, onResult }) where `map` is a mapbox-gl Map instance.
export function initMapReport({ map, onResult = console.log, backendUrl = '/get-region-data' }) {
  if (!map) throw new Error('map instance required');

  // Add draw control
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true
    },
    defaultMode: 'draw_polygon'
  });

  map.addControl(draw, 'top-left');

  // Helper to POST GeoJSON feature collection to backend
  async function postGeoJSON(geojson) {
    try {
      const resp = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geojson })
      });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const json = await resp.json();
      onResult(json);
      // Optionally show a simple popup on map
      if (json && json.summary) {
        const center = geojson.features[0].geometry.coordinates[0][0];
        new mapboxgl.Popup().setLngLat(center).setHTML(`<pre style="max-width:300px">${JSON.stringify(json.summary,null,2)}</pre>`).addTo(map);
      }
    } catch (err) {
      console.error('Error posting geojson to backend', err);
      onResult({ error: err.message });
    }
  }

  // When a polygon is created or updated, send it
  map.on('draw.create', (e) => {
    const features = draw.getAll();
    if (!features || !features.features || features.features.length === 0) return;
    // send feature collection
    postGeoJSON(features);
  });

  map.on('draw.update', (e) => {
    const features = draw.getAll();
    if (!features || !features.features || features.features.length === 0) return;
    postGeoJSON(features);
  });

  map.on('draw.delete', (e) => {
    // remove any result popups if desired
  });

  return {
    drawControl: draw,
    destroy: () => {
      map.off('draw.create');
      map.off('draw.update');
      map.removeControl(draw);
    }
  };
}
