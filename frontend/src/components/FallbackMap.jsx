import React from 'react';
import { Info, MapPin } from 'lucide-react';
import OSMFallbackMap from './OSMFallbackMap';

const FallbackMap = ({ center = [72.8777, 19.0760], zoom = 5 }) => (
  <div className="relative h-full w-full bg-slate-100">
    <OSMFallbackMap center={center} zoom={zoom} height="100%" />
    <div className="absolute left-4 top-4 max-w-md rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Live Map Fallback</h2>
          <p className="mt-1 text-sm text-slate-600">
            OpenStreetMap is displayed while the primary Mapbox layer or live coastal feeds are unavailable.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <Info className="h-4 w-4 text-slate-400" />
        Configure `VITE_MAPBOX_ACCESS_TOKEN` and backend API URLs to enable all operational layers.
      </div>
    </div>
  </div>
);

export default FallbackMap;
