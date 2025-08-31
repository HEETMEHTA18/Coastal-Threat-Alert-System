import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const WEATHER_API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;



const containerStyle = {
  width: '100%',
  height: '400px'
};
const defaultCenter = {
  lat: 19.0760, // Mumbai
  lng: 72.8777
};

export default function WeatherMapWidget() {
  const [selected, setSelected] = useState(defaultCenter);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const fetchWeather = async (lat, lng) => {
    if (!WEATHER_API_KEY) {
      console.error('Weather API key not configured');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`);
      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
    setLoading(false);
  };

  // Get user's current location and fetch weather on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelected({ lat: latitude, lng: longitude });
          fetchWeather(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to default location (Mumbai)
          fetchWeather(defaultCenter.lat, defaultCenter.lng);
        }
      );
    } else {
      // Fallback to default location
      fetchWeather(defaultCenter.lat, defaultCenter.lng);
    }
  }, []);

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelected({ lat, lng });
    fetchWeather(lat, lng);
  };

  return (
    <div className="bg-white/30 backdrop-blur-lg p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Weather by Location</h2>
      
      {loadError && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-200">Error loading Google Maps. Please check your API key.</p>
        </div>
      )}
      
      {!WEATHER_API_KEY && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-4">
          <p className="text-yellow-200">Weather API key not configured. Please add REACT_APP_OPENWEATHERMAP_API_KEY to your .env file.</p>
        </div>
      )}
      
      {isLoaded && GOOGLE_MAPS_API_KEY && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={selected}
          zoom={10}
          onClick={handleMapClick}
        >
          <Marker position={selected} />
        </GoogleMap>
      )}
      
      {!isLoaded && !loadError && (
        <div className="h-96 bg-gray-700 rounded-lg flex items-center justify-center">
          <p className="text-white">Loading map...</p>
        </div>
      )}
      
      {loading && (
        <div className="mt-4 text-center">
          <p className="text-white">Loading weather data...</p>
        </div>
      )}
      
      {weather && (
        <div className="mt-4 bg-white/20 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">Weather Details</h3>
          <div className="grid grid-cols-2 gap-4 text-white">
            <div>Location: {weather.name || `${selected.lat.toFixed(2)}, ${selected.lng.toFixed(2)}`}</div>
            <div>Temperature: {weather.main?.temp}°C</div>
            <div>Humidity: {weather.main?.humidity}%</div>
            <div>Wind Speed: {weather.wind?.speed} m/s</div>
            <div>Condition: {weather.weather?.[0]?.description}</div>
            <div>Feels like: {weather.main?.feels_like}°C</div>
          </div>
        </div>
      )}
      
      <div className="text-xs text-blue-200 mt-2">
        {isLoaded ? "Click on the map to select a location." : "Map requires Google Maps API key to function."}
      </div>
    </div>
  );
}
