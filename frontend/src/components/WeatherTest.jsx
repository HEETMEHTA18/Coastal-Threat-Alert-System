import React, { useState, useEffect } from 'react';

const WeatherTest = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testWeatherAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '';
      const lat = 19.0760; // Mumbai
      const lng = 72.8777;
      
      console.log('Testing weather API...');
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
      );
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Weather API response:', data);
      setWeatherData(data);
      
    } catch (error) {
      console.error('Weather API error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testWeatherAPI();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-bold mb-2">Weather API Test</h3>
      
      <button 
        onClick={testWeatherAPI}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Weather API'}
      </button>
      
      {error && (
        <div className="p-2 bg-red-100 border border-red-400 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {weatherData && (
        <div className="space-y-2">
          <div><strong>Location:</strong> {weatherData.name}</div>
          <div><strong>Temperature:</strong> {weatherData.main?.temp}°C</div>
          <div><strong>Conditions:</strong> {weatherData.weather?.[0]?.description}</div>
          <div><strong>Wind:</strong> {weatherData.wind?.speed} m/s</div>
          <div><strong>Humidity:</strong> {weatherData.main?.humidity}%</div>
          <div><strong>Pressure:</strong> {weatherData.main?.pressure} hPa</div>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Loading weather data...
        </div>
      )}
    </div>
  );
};

export default WeatherTest;