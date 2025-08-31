import React, { useState, useEffect } from 'react';

function BackendCheck() {
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          const data = await response.json();
          setStatus('Connected');
          setHealthData(data);
          setError(null);
        } else {
          setStatus('Error');
          setError(`Status: ${response.status} - ${response.statusText}`);
        }
      } catch (err) {
        setStatus('Failed');
        setError(`Connection Error: ${err.message}`);
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <div className="mt-5 p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Backend Connection:</h2>
      <div className="flex items-center mb-2">
        <div 
          className={`w-3 h-3 rounded-full mr-2 ${
            status === 'Connected' ? 'bg-green-500' : 
            status === 'Checking...' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        ></div>
        <span>{status}</span>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      
      {healthData && (
        <div className="mt-3">
          <h3 className="text-md font-medium">Backend Info:</h3>
          <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default BackendCheck;
