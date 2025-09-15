const express = require('express');
const router = express.Router();

// Lightweight chat responder.
// For production, replace with a call to your AI provider or Python service.
router.post('/chat', async (req, res) => {
  try {
    const { message = '', mode = 'standard', context = {} } = req.body || {};

    const lower = String(message).toLowerCase();
    let answer = '';

    if (lower.includes('current') || lower.includes('currents')) {
      answer = 'Ocean currents are measured in knots and direction (e.g., SW 240°). I can fetch live data and summarize recent speed, direction shifts, and possible impacts on navigation.';
    } else if (lower.includes('weather') || lower.includes('forecast')) {
      answer = 'Weather outlook: temperature, humidity, pressure, wind, and precipitation risk. I can pull current conditions and a short-term forecast for your location.';
    } else if (lower.includes('satellite') || lower.includes('imagery')) {
      answer = 'Satellite imagery can reveal sea surface temperature, chlorophyll, and cloud cover. I can show recent tiles and interpret patterns.';
    } else if (lower.includes('report') || lower.includes('incident')) {
      answer = 'Reports module lets communities submit observations (flooding, erosion, debris) and view summaries. I can help you file or search reports.';
    } else if (lower.includes('analytics') || lower.includes('risk') || lower.includes('threat')) {
      answer = 'Analytics aggregates signals into a threat index (e.g., storm surge, erosion, navigation). I can explain the drivers and mitigation tips.';
    } else if (lower.includes('help') || lower.includes('how')) {
      answer = 'Ask me about currents, weather, satellite data, reports, or analytics. Try: "Show latest current speed near me" or "Forecast rain risk next 24h".';
    } else {
      answer = 'I can answer questions about coastal monitoring: currents, weather, satellite imagery, community reports, and risk analytics. What would you like to explore?';
    }

    // Return a simple JSON shape. Frontend will render with a typing effect.
    res.json({
      status: 'success',
      message: answer,
      mode,
      contextEcho: context || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Chat failed', error: error.message });
  }
});

module.exports = router;


