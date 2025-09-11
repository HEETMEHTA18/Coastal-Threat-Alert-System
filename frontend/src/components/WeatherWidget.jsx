import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, CloudSnow, Wind, Droplets, Thermometer, Eye, MapPin, RefreshCw } from 'lucide-react';

const WEATHER_API_KEY =  import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

export default function WeatherWidget() {
  console.log('WeatherWidget rendering, API key:', !!WEATHER_API_KEY);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: 19.0760, lng: 72.8777, name: 'Mumbai' });

  const getWeatherIcon = (condition) => {
    const iconMap = {
      'clear sky': Sun,
      'few clouds': Cloud,
      'scattered clouds': Cloud,
      'broken clouds': Cloud,
      'shower rain': CloudRain,
      'rain': CloudRain,
      'thunderstorm': CloudRain,
      'snow': CloudSnow,
      'mist': Cloud
    };
    return iconMap[condition?.toLowerCase()] || Cloud;
  };

  const fetchWeather = async (lat, lng, locationName = '') => {
    if (!WEATHER_API_KEY) {
      console.error('Weather API key not configured');
      return;
    }

    setLoading(true);
    try {
      // Current weather
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`
      );
      const weatherData = await weatherRes.json();

      // 5-day forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`
      );
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(forecastData);
      setLocation({ lat, lng, name: locationName || weatherData.name });
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
    setLoading(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude, 'Your Location');
        },
        (error) => {
          console.error('Error getting location:', error);
          fetchWeather(location.lat, location.lng, 'Mumbai');
        }
      );
    } else {
      fetchWeather(location.lat, location.lng, 'Mumbai');
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  if (!WEATHER_API_KEY) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-xl p-6">
        <p className="text-red-200">Weather API key not configured. Please add REACT_APP_OPENWEATHERMAP_API_KEY to your .env file.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Current Weather</h2>
          <button 
            onClick={getCurrentLocation}
            disabled={loading}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white">Loading weather data...</p>
          </div>
        )}

        {weather && !loading && (
          <div className="space-y-4">
            {/* Location */}
            <div className="flex items-center space-x-2 text-blue-200">
              <MapPin className="w-4 h-4" />
              <span>{location.name}</span>
            </div>

            {/* Main Weather Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {React.createElement(getWeatherIcon(weather.weather?.[0]?.description), {
                  className: "w-16 h-16 text-yellow-400"
                })}
                <div>
                  <div className="text-4xl font-bold text-white">{Math.round(weather.main?.temp)}°C</div>
                  <div className="text-blue-200 capitalize">{weather.weather?.[0]?.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white">Feels like {Math.round(weather.main?.feels_like)}°C</div>
                <div className="text-blue-200">H: {Math.round(weather.main?.temp_max)}° L: {Math.round(weather.main?.temp_min)}°</div>
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Wind className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold">{weather.wind?.speed} m/s</div>
                <div className="text-blue-200 text-sm">Wind Speed</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold">{weather.main?.humidity}%</div>
                <div className="text-blue-200 text-sm">Humidity</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Thermometer className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold">{weather.main?.pressure} hPa</div>
                <div className="text-blue-200 text-sm">Pressure</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold">{(weather.visibility / 1000).toFixed(1)} km</div>
                <div className="text-blue-200 text-sm">Visibility</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5-Day Forecast */}
      {forecast && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">5-Day Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {forecast.list.filter((_, index) => index % 8 === 0).slice(0, 5).map((item, index) => {
              const date = new Date(item.dt * 1000);
              const IconComponent = getWeatherIcon(item.weather[0].description);
              return (
                <div key={index} className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-blue-200 text-sm mb-2">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <IconComponent className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">{Math.round(item.main.temp)}°</div>
                  <div className="text-blue-200 text-xs capitalize">{item.weather[0].description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
