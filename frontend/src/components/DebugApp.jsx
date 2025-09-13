import React, { useEffect, useState } from 'react';

const DebugApp = () => {
  const [debugInfo, setDebugInfo] = useState({
    reactVersion: React.version,
    apiUrl: import.meta.env.VITE_API_URL || 'Not set',
    mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? 'Set' : 'Not set',
    currentUrl: window.location.href,
    userAgent: navigator.userAgent,
    localStorage: {},
    errors: []
  });

  useEffect(() => {
    try {
      // Check localStorage
      const lsKeys = ['ctas_user', 'ctas_token', 'session_start'];
      const lsData = {};
      lsKeys.forEach(key => {
        lsData[key] = localStorage.getItem(key) ? 'Present' : 'Not found';
      });

      setDebugInfo(prev => ({
        ...prev,
        localStorage: lsData
      }));

      console.log('🐛 Debug App mounted successfully');
    } catch (error) {
      console.error('🐛 Debug App error:', error);
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, error.message]
      }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">🐛 CTAS Debug Information</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Environment Info */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Environment</h2>
            <div className="space-y-2">
              <p><strong>React Version:</strong> {debugInfo.reactVersion}</p>
              <p><strong>API URL:</strong> {debugInfo.apiUrl}</p>
              <p><strong>Mapbox Token:</strong> {debugInfo.mapboxToken}</p>
              <p><strong>Current URL:</strong> {debugInfo.currentUrl}</p>
            </div>
          </div>

          {/* LocalStorage Info */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-400">LocalStorage</h2>
            <div className="space-y-2">
              {Object.entries(debugInfo.localStorage).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value}</p>
              ))}
            </div>
          </div>

          {/* Browser Info */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">Browser</h2>
            <div className="space-y-2">
              <p><strong>User Agent:</strong> {debugInfo.userAgent.substring(0, 100)}...</p>
              <p><strong>Viewport:</strong> {window.innerWidth} x {window.innerHeight}</p>
            </div>
          </div>

          {/* Errors */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Errors</h2>
            {debugInfo.errors.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.errors.map((error, index) => (
                  <p key={index} className="text-red-300">{error}</p>
                ))}
              </div>
            ) : (
              <p className="text-green-300">No errors detected</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
          >
            Go to Landing Page
          </button>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugApp;