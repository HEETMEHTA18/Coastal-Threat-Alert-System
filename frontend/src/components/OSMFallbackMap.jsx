import React from 'react';

// Very small no-dependency fallback map using OpenStreetMap embed iframe.
// Keeps UX functional when Mapbox token is missing in dev environments.
const OSMFallbackMap = ({ center = [72.8777, 19.0760], zoom = 8, width = '100%', height = '480px' }) => {
  // center is [lng, lat] to match Mapbox conventions used elsewhere
  const lon = Number(center[0]);
  const lat = Number(center[1]);
  // Build a small bbox around the center to show a reasonable zoom area
  const delta = 0.5 / Math.max(1, zoom / 6);
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div style={{ width, height, borderRadius: 12, overflow: 'hidden', background: '#e6f2ff' }}>
      <iframe
        title="OSM Fallback Map"
        src={src}
        style={{ width: '100%', height: '100%', border: 0 }}
        loading="lazy"
      />
      <div style={{ position: 'absolute', right: 12, bottom: 12, background: 'rgba(255,255,255,0.85)', padding: '6px 8px', borderRadius: 8, fontSize: 12 }}>
        <strong>Map</strong> • OpenStreetMap (fallback)
      </div>
    </div>
  );
};

export default OSMFallbackMap;
