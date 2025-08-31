// Redux Store Debug Component
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

function ReduxDebug() {
  const [expanded, setExpanded] = useState(false);
  const reduxState = useSelector((state) => state);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const checkForReduxErrors = () => {
      try {
        // Test if we can access the store properly
        if (!reduxState) {
          setErrorDetails('Redux state is undefined');
          return;
        }
        
        // Check if expected slices are present
        const missingSlices = [];
        ['auth', 'noaa', 'alerts', 'ui'].forEach(slice => {
          if (!reduxState[slice]) missingSlices.push(slice);
        });
        
        if (missingSlices.length > 0) {
          setErrorDetails(`Missing Redux slices: ${missingSlices.join(', ')}`);
          return;
        }
        
        setErrorDetails(null);
      } catch (error) {
        setErrorDetails(`Redux error: ${error.message}`);
      }
    };
    
    checkForReduxErrors();
  }, [reduxState]);

  const toggleExpanded = () => setExpanded(!expanded);

  if (errorDetails) {
    return (
      <div className="fixed bottom-0 right-0 bg-red-800 text-white p-4 m-4 rounded-lg shadow-lg z-50">
        <h3 className="text-lg font-bold">Redux Store Error</h3>
        <p>{errorDetails}</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 bg-slate-900 text-white p-2 m-4 rounded-lg shadow-lg z-50 max-w-md">
      <button 
        onClick={toggleExpanded}
        className="font-mono text-xs p-1 bg-blue-700 rounded"
      >
        {expanded ? 'Hide Redux Debug' : 'Show Redux Debug'}
      </button>
      
      {expanded && (
        <div className="mt-2 max-h-96 overflow-auto">
          <h3 className="text-sm font-bold">Redux Store Contents:</h3>
          <pre className="text-xs mt-1 bg-slate-800 p-2 rounded">
            {JSON.stringify(reduxState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ReduxDebug;
