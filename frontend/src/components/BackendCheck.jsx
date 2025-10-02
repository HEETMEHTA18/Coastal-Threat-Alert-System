import React, { useState, useEffect, useCallback } from 'react';

function BackendCheck() {
  const [nodeStatus, setNodeStatus] = useState('Checking...');
  const [aiStatus, setAiStatus] = useState('Checking...');
  const [nodeHealth, setNodeHealth] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [error, setError] = useState(null);

  const normalizeBase = (raw, defaultBase) => {
    const base = raw || defaultBase;
    return base.replace(/\/$/, '');
  };

  const checkHealth = useCallback(async () => {
    setError(null);
    setNodeStatus('Checking...');
    setAiStatus('Checking...');
    setNodeHealth(null);
    setAiHealth(null);

    const nodeBase = normalizeBase(import.meta.env.VITE_NODE_API_URL, 'http://localhost:3001');
    const aiBase = normalizeBase(import.meta.env.VITE_API_URL, 'http://localhost:8000');

  const nodeUrl = `${nodeBase}/health`;
  // Try both /api/health and /health for the AI service (mounting differences)
  const aiUrls = [`${aiBase}/health`];

    // Node health
    try {
      const res = await fetch(nodeUrl, { cache: 'no-store' });
      if (res.ok) {
        setNodeStatus('Connected');
        setNodeHealth(await res.json());
      } else {
        setNodeStatus('Error');
        setError(prev => prev ? prev + ` | Node status: ${res.status}` : `Node status: ${res.status}`);
      }
    } catch (err) {
      setNodeStatus('Failed');
      setError(prev => prev ? prev + ` | Node error: ${err.message}` : `Node error: ${err.message}`);
    }

    // AI health (try fallbacks)
    let aiChecked = false;
    for (const u of aiUrls) {
      try {
        const res = await fetch(u, { cache: 'no-store' });
        if (res.ok) {
          setAiStatus('Connected');
          setAiHealth(await res.json());
          aiChecked = true;
          break;
        } else {
          setAiStatus('Error');
          setError(prev => prev ? prev + ` | AI status: ${res.status}` : `AI status: ${res.status}`);
        }
      } catch (err) {
        setAiStatus('Failed');
        setError(prev => prev ? prev + ` | AI error: ${err.message}` : `AI error: ${err.message}`);
      }
    }

    if (!aiChecked && !nodeHealth && !aiHealth) {
      // If nothing succeeded, keep a generic error message
      setError(prev => prev || 'Unable to reach backend services.');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="mt-5 p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Backend Monitoring</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Node API</h3>
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${nodeStatus === 'Connected' ? 'bg-green-500' : nodeStatus === 'Checking...' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span>{nodeStatus}</span>
          </div>
          {nodeHealth && <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(nodeHealth, null, 2)}</pre>}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">AI / Prediction API</h3>
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${aiStatus === 'Connected' ? 'bg-green-500' : aiStatus === 'Checking...' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span>{aiStatus}</span>
          </div>
          {aiHealth && <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(aiHealth, null, 2)}</pre>}
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-3">
          {error}
        </div>
      )}

      <div className="mt-3">
        <button onClick={checkHealth} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Refresh</button>
      </div>
    </div>
  );
}

export default BackendCheck;
