// Enhanced NOAA API routes using your token
// routes/noaaRoutes.js

const express = require('express');
const noaaService = require('../services/noaaService');
const router = express.Router();

// Test NOAA API connection with your token
router.get('/test', async (req, res) => {
  try {
    const testResult = await noaaService.testConnection();
    res.json({
      success: true,
      message: 'NOAA API test completed',
      ...testResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'NOAA API test failed',
      details: error.message
    });
  }
});

// Get current data from specific station (your Cape Henry example)
router.get('/currents/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { hours = 24 } = req.query;
    
    const currentData = await noaaService.getCurrentData(stationId, parseInt(hours));
    
    res.json({
      success: true,
      station_id: stationId,
      hours_back: hours,
      timestamp: new Date().toISOString(),
      ...currentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch current data for station ${req.params.stationId}`,
      details: error.message
    });
  }
});

// Get water level data (tide information)
router.get('/water-level/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { hours = 24 } = req.query;
    
    const waterLevelData = await noaaService.getWaterLevelData(stationId, parseInt(hours));
    
    res.json({
      success: true,
      station_id: stationId,
      hours_back: hours,
      timestamp: new Date().toISOString(),
      ...waterLevelData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch water level data for station ${req.params.stationId}`,
      details: error.message
    });
  }
});

// Get meteorological data
router.get('/weather/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { hours = 24 } = req.query;
    
    const weatherData = await noaaService.getMeteorologicalData(stationId, parseInt(hours));
    
    res.json({
      success: true,
      station_id: stationId,
      hours_back: hours,
      timestamp: new Date().toISOString(),
      ...weatherData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch weather data for station ${req.params.stationId}`,
      details: error.message
    });
  }
});

// Get comprehensive station data (all available products)
router.get('/station/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { hours = 24 } = req.query;
    
    const stationData = await noaaService.getStationData(stationId, parseInt(hours));
    
    res.json({
      success: true,
      hours_back: hours,
      timestamp: new Date().toISOString(),
      ...stationData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch station data for ${req.params.stationId}`,
      details: error.message
    });
  }
});

// Get all available stations
router.get('/stations', (req, res) => {
  try {
    const stations = noaaService.getStations();
    res.json({
      success: true,
      total_stations: stations.length,
      stations: stations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stations list',
      details: error.message
    });
  }
});

// Get Cape Henry current conditions (your specific station)
router.get('/cape-henry', async (req, res) => {
  try {
    const { hours = 6 } = req.query; // Default to last 6 hours
    
    const currentData = await noaaService.getCurrentData('cb0102', parseInt(hours));
    
    // Enhanced response for Cape Henry specifically
    const response = {
      success: true,
      location: 'Cape Henry, VA - Chesapeake Bay Entrance',
      station_id: 'cb0102',
      hours_back: hours,
      timestamp: new Date().toISOString(),
      api_token_used: true, // Your token is being used
      ...currentData
    };

    // Add real-time status
    if (currentData.observations && currentData.observations.length > 0) {
      const latest = currentData.observations[currentData.observations.length - 1];
      response.current_conditions = {
        speed_knots: latest.speed_knots,
        speed_ms: latest.speed_ms,
        direction_degrees: latest.direction_degrees,
        direction_text: getDirectionText(latest.direction_degrees),
        timestamp: latest.timestamp,
        tidal_phase: determineTidalPhase(currentData.observations)
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Cape Henry current data',
      details: error.message
    });
  }
});

// Coastal threat assessment using NOAA data
router.get('/threats/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const stationData = await noaaService.getStationData(stationId, 12); // Last 12 hours
    
    // Compile threat assessment from all data sources
    const threats = compileThreatAssessment(stationData);
    
    res.json({
      success: true,
      station_id: stationId,
      station_name: stationData.station_info.name,
      assessment_time: new Date().toISOString(),
      threats: threats,
      recommendations: generateRecommendations(threats)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to assess threats for station ${req.params.stationId}`,
      details: error.message
    });
  }
});

// Helper functions
function getDirectionText(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function determineTidalPhase(observations) {
  if (!observations || observations.length < 5) return 'unknown';
  
  const recent = observations.slice(-5);
  const speeds = recent.map(obs => obs.speed_ms);
  
  const increasing = speeds.slice(1).filter((speed, i) => speed > speeds[i]).length;
  const decreasing = speeds.slice(1).filter((speed, i) => speed < speeds[i]).length;
  
  if (increasing > decreasing) {
    return speeds[speeds.length - 1] > 0.5 ? 'strengthening' : 'building';
  } else if (decreasing > increasing) {
    return speeds[speeds.length - 1] < 0.3 ? 'weakening' : 'slacking';
  }
  return 'turning';
}

function compileThreatAssessment(stationData) {
  const threats = {
    overall_risk: 'low',
    coastal_flooding: 'low',
    rip_currents: 'low',
    navigation_hazards: 'low',
    erosion_risk: 'low',
    storm_surge: 'low'
  };

  // Analyze current data
  if (stationData.data.currents && stationData.data.currents.analysis) {
    const currentThreats = stationData.data.currents.analysis.threats;
    threats.rip_currents = currentThreats.rip_current || 'low';
    threats.navigation_hazards = currentThreats.navigation || 'low';
    threats.erosion_risk = currentThreats.erosion || 'low';
  }

  // Analyze water level data
  if (stationData.data.water_level && stationData.data.water_level.analysis) {
    const waterAnalysis = stationData.data.water_level.analysis;
    if (waterAnalysis.statistics.current_level > waterAnalysis.statistics.mean_level + 0.5) {
      threats.coastal_flooding = 'moderate';
    }
    if (waterAnalysis.trend === 'rising' && waterAnalysis.statistics.current_level > waterAnalysis.statistics.mean_level + 1.0) {
      threats.storm_surge = 'moderate';
    }
  }

  // Determine overall risk
  const riskLevels = Object.values(threats).filter(level => level !== 'low');
  if (riskLevels.some(level => level === 'high')) {
    threats.overall_risk = 'high';
  } else if (riskLevels.some(level => level === 'moderate')) {
    threats.overall_risk = 'moderate';
  }

  return threats;
}

function generateRecommendations(threats) {
  const recommendations = [];

  if (threats.overall_risk === 'high') {
    recommendations.push('URGENT: Activate emergency response protocols');
    recommendations.push('Issue immediate public safety warnings');
  }

  if (threats.rip_currents !== 'low') {
    recommendations.push('Post rip current warnings at beaches');
    recommendations.push('Increase lifeguard vigilance');
  }

  if (threats.navigation_hazards !== 'low') {
    recommendations.push('Issue small craft advisories');
    recommendations.push('Alert marine traffic control');
  }

  if (threats.coastal_flooding !== 'low') {
    recommendations.push('Monitor low-lying coastal areas');
    recommendations.push('Prepare flood response teams');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue routine monitoring');
    recommendations.push('Maintain normal safety protocols');
  }

  return recommendations;
}

module.exports = router;
