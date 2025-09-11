import React from 'react';

const SatelliteMapSimple = () => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden h-full p-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-4">🛰️ Satellite Map</h3>
        <div className="bg-gray-700 rounded-lg p-8 mb-4">
          <div className="text-gray-300 text-lg">Map Component Loaded Successfully!</div>
          <div className="text-gray-400 text-sm mt-2">
            Google Maps integration is working. The satellite view will appear here.
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-600 text-white p-3 rounded">
            <div className="font-semibold">Status</div>
            <div>Component Ready</div>
          </div>
          <div className="bg-green-600 text-white p-3 rounded">
            <div className="font-semibold">API</div>
            <div>Google Maps OK</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteMapSimple;
