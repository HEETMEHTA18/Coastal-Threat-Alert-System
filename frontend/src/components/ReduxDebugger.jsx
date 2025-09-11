import React from 'react';
import { useSelector } from 'react-redux';

const ReduxDebugger = () => {
  // Get the entire Redux state
  const reduxState = useSelector(state => state);
  
  return (
    <div className="bg-slate-800 text-white p-4 rounded-md shadow-lg max-w-4xl mx-auto my-4 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Redux State Debugger</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 text-cyan-400">UI Slice</h3>
        <pre className="bg-slate-900 p-3 rounded text-sm overflow-auto max-h-60">
          {JSON.stringify(reduxState.ui || {}, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 text-cyan-400">Auth Slice</h3>
        <pre className="bg-slate-900 p-3 rounded text-sm overflow-auto max-h-60">
          {JSON.stringify(reduxState.auth || {}, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 text-cyan-400">NOAA Slice</h3>
        <pre className="bg-slate-900 p-3 rounded text-sm overflow-auto max-h-60">
          {JSON.stringify(reduxState.noaa || {}, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 text-cyan-400">Alerts Slice</h3>
        <pre className="bg-slate-900 p-3 rounded text-sm overflow-auto max-h-60">
          {JSON.stringify(reduxState.alerts || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ReduxDebugger;
