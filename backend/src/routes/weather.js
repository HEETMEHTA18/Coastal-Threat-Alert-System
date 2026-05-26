const express = require('express');
const router = express.Router();

const resolveWeatherKey = () => process.env.WEATHER_API_KEY || null;

// @route   GET /api/weather/current
// @desc    Get current weather
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const { city = 'Mumbai' } = req.query;
    
    // Use OpenWeatherMap service if API key is available
    const weatherKey = resolveWeatherKey();
    if (weatherKey && weatherKey !== 'your_weather_api_key_here') {
      const OpenWeatherMapService = require('../services/openWeatherMapService');
      const weatherService = new OpenWeatherMapService(weatherKey);
      
      const weather = await weatherService.getCurrentWeather(city);
      return res.json({
        status: 'success',
        data: weather,
        source: 'openweathermap'
      });
    }
    
    res.status(400).json({
      status: 'error',
      message: 'WEATHER_API_KEY is not configured on the server'
    });
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/weather/forecast
// @desc    Get weather forecast
// @access  Public
router.get('/forecast', async (req, res) => {
  try {
    const { city = 'Mumbai', days = 5 } = req.query;
    
    // Use OpenWeatherMap service if API key is available
    const weatherKey = resolveWeatherKey();
    if (weatherKey && weatherKey !== 'your_weather_api_key_here') {
      const OpenWeatherMapService = require('../services/openWeatherMapService');
      const weatherService = new OpenWeatherMapService(weatherKey);
      
      const forecast = await weatherService.getForecast(city, parseInt(days));
      return res.json({
        status: 'success',
        data: forecast,
        source: 'openweathermap'
      });
    }
    
    res.status(400).json({
      status: 'error',
      message: 'WEATHER_API_KEY is not configured on the server'
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/weather/marine
// @desc    Get marine weather data
// @access  Public
router.get('/marine', async (req, res) => {
  try {
    const { location = 'Arabian Sea', lat = 19.0760, lon = 72.8777 } = req.query;
    
    const FreeWeatherService = require('../services/freeWeatherService');
    const freeService = new FreeWeatherService();
    
    const marineData = await freeService.getMarineData(parseFloat(lat), parseFloat(lon), location);
    
    res.json({
      status: 'success',
      data: marineData,
      source: 'marine-service'
    });
  } catch (error) {
    console.error('Marine weather error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
