import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReduxDebug from './ReduxDebug';
import BackendCheck from './BackendCheck';

function TestPage() {
  const dispatch = useDispatch();
  const authState = useSelector(state => state.auth);
  const uiState = useSelector(state => state.ui);
  const noaaState = useSelector(state => state.noaa);
  const alertsState = useSelector(state => state.alerts);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1e40af', borderBottom: '2px solid #93c5fd', paddingBottom: '8px' }}>CTAS System Diagnostic</h1>
      <p>If you can see this page, the basic React rendering is working.</p>
      
      {/* Basic Environment Info */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Environment Diagnostics:</h2>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
          <li>Current Time: {new Date().toLocaleTimeString()}</li>
          <li>Build Mode: <b>{import.meta.env.MODE}</b></li>
          <li>Weather API Key: <b>{import.meta.env.VITE_OPENWEATHERMAP_API_KEY ? "Available" : "Missing"}</b></li>
        </ul>
      </div>
      
      {/* Backend Connectivity */}
      <BackendCheck />
      
      {/* Redux Store Status */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f4fe', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Redux Store Status:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: authState ? '#ecfdf5' : '#fee2e2', borderRadius: '4px' }}>
            <b>Auth Slice:</b> {authState ? "✅ Loaded" : "❌ Missing"}
          </div>
          <div style={{ padding: '10px', backgroundColor: uiState ? '#ecfdf5' : '#fee2e2', borderRadius: '4px' }}>
            <b>UI Slice:</b> {uiState ? "✅ Loaded" : "❌ Missing"}
          </div>
          <div style={{ padding: '10px', backgroundColor: noaaState ? '#ecfdf5' : '#fee2e2', borderRadius: '4px' }}>
            <b>NOAA Slice:</b> {noaaState ? "✅ Loaded" : "❌ Missing"}
          </div>
          <div style={{ padding: '10px', backgroundColor: alertsState ? '#ecfdf5' : '#fee2e2', borderRadius: '4px' }}>
            <b>Alerts Slice:</b> {alertsState ? "✅ Loaded" : "❌ Missing"}
          </div>
        </div>
        
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '15px', marginBottom: '8px' }}>Authentication Status:</h3>
        <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px' }}>
          <p><b>User:</b> {authState?.user ? JSON.stringify(authState.user.name) : "Not logged in"}</p>
          <p><b>Authenticated:</b> {authState?.isAuthenticated ? "Yes" : "No"}</p>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <a href="/" style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '10px' }}>
          Return to Home
        </a>
        <a href="/login" style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Go to Login
        </a>
      </div>
      
      {/* Full Redux debug panel */}
      <ReduxDebug />
    </div>
  );
}

export default TestPage;
