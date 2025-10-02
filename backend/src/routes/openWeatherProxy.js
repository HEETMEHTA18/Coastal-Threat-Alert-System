const express = require('express');
const router = express.Router();
const OpenWeatherMapService = require('../services/openWeatherMapService');

// Initialize service with server-side API key
const apiKey = process.env.OPENWEATHER_API_KEY || null;
let weatherService = null;
if (apiKey) {
  try {
    weatherService = new OpenWeatherMapService(apiKey);
  } catch (err) {
    console.warn('OpenWeather service initialization failed:', err.message);
    weatherService = null;
  }
}
const isDev = process.env.NODE_ENV !== 'production';
console.debug && console.debug('openWeatherProxy initialized. hasKey=', !!apiKey, 'serviceReady=', !!weatherService);

// GET /api/openweather/test
router.get('/test', async (req, res) => {
  if (!weatherService) return res.status(400).json({ status: 'error', message: 'OpenWeather API not configured on server' });
  try {
    const result = await weatherService.testAPIKey();
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/openweather/status
// Lightweight endpoint for local debugging: reports whether the proxy was initialized and whether an API key is present.
router.get('/status', (req, res) => {
  try {
    const configured = !!weatherService;
    const hasKey = !!process.env.OPENWEATHER_API_KEY;
    res.json({ status: 'success', configured, hasKey });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/openweather/current?lat=..&lon=..
router.get('/current', async (req, res) => {
  if (!weatherService) return res.status(400).json({ status: 'error', message: 'OpenWeather API not configured on server' });
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ status: 'error', message: 'lat and lon query params required' });
  try {
    const data = await weatherService.getWeatherByCoordinates(lat, lon);
    res.json({ status: 'success', data });
  } catch (err) {
    // Log full error for server-side debugging
    console.error('OpenWeather /current proxy error:', err && err.stack ? err.stack : err);
    const provider = err && err.response ? { status: err.response.status, data: err.response.data } : null;
    const payload = { status: 'error', message: err.message };
    if (isDev && provider) payload.provider = provider;
    res.status(502).json(payload);
  }
});

// GET /api/openweather/forecast?lat=..&lon=..&days=..
router.get('/forecast', async (req, res) => {
  if (!weatherService) return res.status(400).json({ status: 'error', message: 'OpenWeather API not configured on server' });
  const { lat, lon, days = 5 } = req.query;
  if (!lat || !lon) return res.status(400).json({ status: 'error', message: 'lat and lon query params required' });
  try {
    const data = await weatherService.getForecastByCoordinates ? await weatherService.getForecastByCoordinates(lat, lon, days) : await weatherService.getForecast(lat, days);
    res.json({ status: 'success', data });
  } catch (err) {
    console.error('OpenWeather /forecast proxy error:', err && err.stack ? err.stack : err);
    const provider = err && err.response ? { status: err.response.status, data: err.response.data } : null;
    const payload = { status: 'error', message: err.message };
    if (isDev && provider) payload.provider = provider;
    res.status(502).json(payload);
  }
});

// GET /api/openweather/onecall?lat=..&lon=..&exclude=..
router.get('/onecall', async (req, res) => {
  if (!weatherService) return res.status(400).json({ status: 'error', message: 'OpenWeather API not configured on server' });
  const { lat, lon, exclude } = req.query;
  if (!lat || !lon) return res.status(400).json({ status: 'error', message: 'lat and lon query params required' });
  try {
    // The service exposes oneCallUrl and may have a method; fall back to getForecast if missing
    if (weatherService.getOneCall) {
      const data = await weatherService.getOneCall(lat, lon, exclude);
      res.json({ status: 'success', data });
    } else {
      // Fallback: use getWeatherByCoordinates as minimal response
      const data = await weatherService.getWeatherByCoordinates(lat, lon);
      res.json({ status: 'success', data });
    }
  } catch (err) {
    console.error('OpenWeather /onecall proxy error:', err && err.stack ? err.stack : err);
    const provider = err && err.response ? { status: err.response.status, data: err.response.data } : null;
    const payload = { status: 'error', message: err.message };
    if (isDev && provider) payload.provider = provider;
    res.status(502).json(payload);
  }
});

module.exports = router;
