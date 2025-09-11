import React from 'react';
import WeatherWidget from './WeatherWidget';

export default function WeatherPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Weather Monitoring</h1>
          <p className="text-blue-200 text-lg">Real-time coastal threat monitoring</p>
        </div>
        
        {/* Weather Widget */}
        <WeatherWidget />
      </div>
    </div>
  );
}
