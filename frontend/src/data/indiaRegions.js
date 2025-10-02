// India regions and helper functions for map components
// Provides a default "All India" bounds and a few example coastal regions.
export const INDIA_BOUNDS = [[68.0, 6.5], [97.5, 37.1]]; // SW, NE (lng,lat)

export const REGIONS = [
  {
    id: 'all-india',
    name: 'All India',
    bounds: INDIA_BOUNDS,
    feature: {
      type: 'Feature',
      properties: { id: 'all-india', name: 'All India' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [68.0, 6.5], [97.5, 6.5], [97.5, 37.1], [68.0, 37.1], [68.0, 6.5]
        ]]
      }
    }
  },
  {
    id: 'west-coast-maharashtra',
    name: 'Maharashtra Coast',
    bounds: [[72.2, 16.5], [73.5, 21.5]],
    color: '#0ea5a4',
    centroid: [72.9, 19.0],
    feature: {
      type: 'Feature',
      properties: { id: 'west-coast-maharashtra', name: 'Maharashtra Coast', color: '#0ea5a4' },
      geometry: { type: 'Polygon', coordinates: [[[72.2,16.5],[73.5,16.5],[73.5,21.5],[72.2,21.5],[72.2,16.5]]] }
    }
  },
  {
    id: 'gujarat-coast',
    name: 'Gujarat Coast',
    bounds: [[68.0, 20.0], [73.5, 24.5]],
    color: '#ef4444',
    centroid: [71.0, 22.0],
    feature: {
      type: 'Feature',
      properties: { id: 'gujarat-coast', name: 'Gujarat Coast', color: '#ef4444' },
      geometry: { type: 'Polygon', coordinates: [[[68.0,20.0],[73.5,20.0],[73.5,24.5],[68.0,24.5],[68.0,20.0]]] }
    }
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans (West Bengal)',
    bounds: [[88.0, 21.3], [89.4, 22.4]],
    color: '#f59e0b',
    centroid: [88.85, 21.9],
    feature: {
      type: 'Feature',
      properties: { id: 'sundarbans', name: 'Sundarbans', color: '#f59e0b' },
      geometry: { type: 'Polygon', coordinates: [[[88.5,21.5],[89.2,21.5],[89.2,22.3],[88.5,22.3],[88.5,21.5]]] }
    }
  },
  {
    id: 'chennai-coast',
    name: 'Chennai Coast',
    bounds: [[80.05,12.6],[80.45,13.4]],
    color: '#06b6d4',
    centroid: [80.25, 13.0],
    feature: {
      type: 'Feature',
      properties: { id: 'chennai-coast', name: 'Chennai Coast', color: '#06b6d4' },
      geometry: { type: 'Polygon', coordinates: [[[80.15,12.8],[80.35,12.8],[80.35,13.2],[80.15,13.2],[80.15,12.8]]] }
    }
  }
];

export function getRegionById(id) {
  return REGIONS.find(r => r.id === id) || REGIONS[0];
}

export function getRegionsGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: REGIONS.map(r => r.feature)
  };
}

export function getRegionColors() {
  return REGIONS.reduce((acc, r) => {
    acc[r.id] = r.color || '#60a5fa';
    return acc;
  }, {});
}
