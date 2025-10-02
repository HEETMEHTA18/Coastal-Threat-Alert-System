import React, { useEffect, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import mapboxgl from 'mapbox-gl';

// MapDrawReportControl
// Props:
// - map: mapbox-gl map instance
// - backendUrl: endpoint to POST GeoJSON to (default '/get-region-data')
// - className: optional wrapper class
// - position: map control position string (top-right, top-left, etc.)
