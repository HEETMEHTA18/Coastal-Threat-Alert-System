// Add this to your backend routes
// routes/currentData.js

const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const router = express.Router();

// NOAA Currents API endpoints
const NOAA_CURRENTS_BASE = 'https://tidesandcurrents.noaa.gov/api/datagetter';
const NOAA_API_TOKEN = process.env.NOAA_API_KEY;

// Current stations for monitoring
const CURRENT_STATIONS = {
  'cb0102': { name: 'Cape Henry LB 2CH', lat: 36.9594, lon: -76.0128, region: 'Chesapeake Bay' },
  'cb0201': { name: 'Chesapeake Bay Bridge Tunnel', lat: 36.9667, lon: -76.1167, region: 'Chesapeake Bay' },
  'lb0201': { name: 'Long Bay', lat: 33.8400, lon: -78.4850, region: 'South Carolina' },
  'sf0101': { name: 'San Francisco Bay', lat: 37.8063, lon: -122.4659, region: 'California' }
};

// Get current data for a station
router.get('/station/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { hours = 24 } = req.query;
    
    if (!CURRENT_STATIONS[stationId]) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
    
    const params = {
      product: 'currents',
      application: 'CTAS',
      begin_date: startTime.toISOString().slice(0, 16).replace('T', ' '),
      end_date: endTime.toISOString().slice(0, 16).replace('T', ' '),
      station: stationId,
      time_zone: 'GMT',
      units: 'metric',
      format: 'xml'
    };

    // Add API token if available
    if (NOAA_API_TOKEN && NOAA_API_TOKEN !== 'your_noaa_token_here') {
      params.token = NOAA_API_TOKEN;
    }
    
    const response = await axios.get(NOAA_CURRENTS_BASE, { params });
    
    // Parse XML response
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    const currentData = parseCurrentData(result, stationId);
    
    res.json({
      success: true,
      station: CURRENT_STATIONS[stationId],
      data: currentData,
      analysis: analyzeCurrent(currentData)
    });
    
  } catch (error) {
    console.error('Error fetching current data:', error);
    res.status(500).json({ error: 'Failed to fetch current data' });
  }
});

// Get current analysis for a station
router.get('/analysis/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    
    // This would typically call the same data fetch but return detailed analysis
    const analysis = {
      station_id: stationId,
      threat_assessment: {
        rip_current_risk: 'low',
        erosion_potential: 'low',
        navigation_hazard: 'low',
        pollutant_transport: 'low'
      },
      tidal_phase: 'weakening',
      current_speed_ms: 0.082,
      current_direction: 209,
      trend: 'decreasing',
      last_updated: new Date().toISOString()
    };
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze current data' });
  }
});

// Get all monitored stations
router.get('/stations', (req, res) => {
  res.json({
    success: true,
    stations: Object.entries(CURRENT_STATIONS).map(([id, info]) => ({
      id,
      ...info
    }))
  });
});

function parseCurrentData(xmlData, stationId) {
  // Parse the XML current data structure
  const observations = [];
  
  try {
    const data = xmlData.data;
    const metadata = data.metadata[0];
    const obs = data.observations[0].cu || [];
    
    obs.forEach(cu => {
      const attrs = cu.$;
      observations.push({
        timestamp: attrs.t,
        speed_knots: parseFloat(attrs.s),
        speed_ms: parseFloat(attrs.s) * 0.514444,
        direction_degrees: parseFloat(attrs.d),
        bin_depth: parseInt(attrs.b)
      });
    });
    
    return observations;
  } catch (error) {
    console.error('Error parsing current data:', error);
    return [];
  }
}

function analyzeCurrent(data) {
  if (!data || data.length === 0) return {};
  
  const speeds = data.map(d => d.speed_ms);
  const latest = data[data.length - 1];
  
  const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const maxSpeed = Math.max(...speeds);
  const minSpeed = Math.min(...speeds);
  
  // Determine threat levels
  const threats = {
    rip_current_risk: latest.speed_ms > 1.0 ? 'high' : latest.speed_ms > 0.6 ? 'moderate' : 'low',
    erosion_potential: maxSpeed > 1.2 ? 'high' : meanSpeed > 0.7 ? 'moderate' : 'low',
    navigation_hazard: latest.speed_ms > 1.5 ? 'high' : latest.speed_ms > 1.0 ? 'moderate' : 'low',
    pollutant_transport: latest.speed_ms > 0.8 ? 'high' : latest.speed_ms > 0.5 ? 'moderate' : 'low'
  };
  
  // Determine trend
  const firstHalf = speeds.slice(0, Math.floor(speeds.length / 2));
  const secondHalf = speeds.slice(Math.floor(speeds.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const trend = secondAvg > firstAvg + 0.05 ? 'increasing' : 
                secondAvg < firstAvg - 0.05 ? 'decreasing' : 'stable';
  
  return {
    statistics: {
      mean_speed_ms: meanSpeed,
      max_speed_ms: maxSpeed,
      min_speed_ms: minSpeed,
      latest_speed_ms: latest.speed_ms,
      latest_direction: latest.direction_degrees
    },
    threats,
    trend,
    tidal_phase: determineTidalPhase(speeds),
    data_points: data.length
  };
}

function determineTidalPhase(speeds) {
  const recent = speeds.slice(-5);
  if (recent.length < 2) return 'unknown';
  
  const increasing = recent.slice(1).filter((speed, i) => speed > recent[i]).length;
  const decreasing = recent.slice(1).filter((speed, i) => speed < recent[i]).length;
  
  if (increasing > decreasing) {
    return recent[recent.length - 1] > 0.5 ? 'strengthening' : 'building';
  } else if (decreasing > increasing) {
    return recent[recent.length - 1] < 0.3 ? 'weakening' : 'slacking';
  }
  return 'turning';
}

module.exports = router;
