const express = require('express');
const router = express.Router();
const EnhancedCoastalDataService = require('../services/enhancedCoastalDataService');

const enhancedCoastalService = new EnhancedCoastalDataService();

// Get enhanced coastal data for satellite visualization
router.get('/enhanced/:station?', async (req, res) => {
  try {
    const station = req.params.station || 'cb0201';
    const bounds = req.query.bounds ? JSON.parse(req.query.bounds) : null;
    
    console.log(`🌊 Enhanced coastal data request for station: ${station}`);
    
    const data = await enhancedCoastalService.getEnhancedCoastalData(station, bounds);
    
    res.json(data);
    
  } catch (error) {
    console.error('Enhanced coastal data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced coastal data',
      details: error.message
    });
  }
});

// Get real-time wave animation data
router.get('/waves/animation/:station?', async (req, res) => {
  try {
    const station = req.params.station || 'cb0201';
    const frameCount = parseInt(req.query.frames) || 60;
    
    console.log(`🌊 Wave animation request for station: ${station}, frames: ${frameCount}`);
    
    const waveData = await enhancedCoastalService.getWaveData(station);
    const currentData = await enhancedCoastalService.getCurrentData(station);
    
    const animationFrames = enhancedCoastalService.generateAnimationFrames(waveData, currentData);
    
    res.json({
      success: true,
      station_id: station,
      frame_count: animationFrames.length,
      frames: animationFrames,
      wave_data: waveData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Wave animation data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wave animation data',
      details: error.message
    });
  }
});

// Get heatmap data for temperature, waves, currents
router.get('/heatmap/:type/:station?', async (req, res) => {
  try {
    const type = req.params.type; // 'temperature', 'waves', 'currents'
    const station = req.params.station || 'cb0201';
    const resolution = parseFloat(req.query.resolution) || 0.02;
    
    console.log(`🗺️ Heatmap data request - Type: ${type}, Station: ${station}`);
    
    let heatmapData;
    
    switch (type) {
      case 'temperature':
        const tempData = await enhancedCoastalService.getTemperatureData(station);
        heatmapData = enhancedCoastalService.generateTemperatureGrid(station, tempData.base_temperature);
        break;
        
      case 'waves':
        const waveData = await enhancedCoastalService.getWaveData(station);
        heatmapData = enhancedCoastalService.generateHeatmapData(waveData, null, null);
        break;
        
      case 'currents':
        const currentData = await enhancedCoastalService.getCurrentData(station);
        heatmapData = enhancedCoastalService.generateHeatmapData(null, null, currentData);
        break;
        
      default:
        throw new Error(`Unknown heatmap type: ${type}`);
    }
    
    res.json({
      success: true,
      type: type,
      station_id: station,
      resolution: resolution,
      data: heatmapData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Heatmap data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch heatmap data',
      details: error.message
    });
  }
});

// Get buoy network data
router.get('/buoys/:bounds?', async (req, res) => {
  try {
    const bounds = req.params.bounds ? JSON.parse(req.params.bounds) : null;
    
    console.log(`🛟 Buoy network request for bounds:`, bounds);
    
    const buoyNetwork = await enhancedCoastalService.getBuoyNetwork(bounds);
    
    res.json({
      success: true,
      buoy_count: buoyNetwork.length,
      buoys: buoyNetwork,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Buoy network data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch buoy network data',
      details: error.message
    });
  }
});

// Get comprehensive environmental data summary
router.get('/environmental-summary/:station?', async (req, res) => {
  try {
    const station = req.params.station || 'cb0201';
    
    console.log(`🌍 Environmental summary request for station: ${station}`);
    
    const [waveData, tempData, currentData, windData, tideData] = await Promise.all([
      enhancedCoastalService.getWaveData(station),
      enhancedCoastalService.getTemperatureData(station),
      enhancedCoastalService.getCurrentData(station),
      enhancedCoastalService.getWindData(station),
      enhancedCoastalService.getTideData(station)
    ]);
    
    // Calculate environmental indices
    const environmentalSummary = {
      overall_conditions: calculateOverallConditions(waveData, windData, currentData),
      wave_conditions: categorizeWaveConditions(waveData),
      current_strength: categorizeCurrentStrength(currentData),
      wind_conditions: categorizeWindConditions(windData),
      temperature_status: categorizeTemperature(tempData),
      safety_assessment: assessSafety(waveData, windData, currentData),
      recommendations: generateRecommendations(waveData, windData, currentData)
    };
    
    res.json({
      success: true,
      station_id: station,
      timestamp: new Date().toISOString(),
      summary: environmentalSummary,
      raw_data: {
        waves: waveData,
        temperature: tempData,
        currents: currentData,
        wind: windData,
        tides: tideData.slice(0, 8) // Next 8 data points
      }
    });
    
  } catch (error) {
    console.error('Environmental summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate environmental summary',
      details: error.message
    });
  }
});

// Helper functions for environmental assessment
function calculateOverallConditions(waveData, windData, currentData) {
  const waveScore = Math.min(100, (waveData.significant_height / 4) * 100);
  const windScore = Math.min(100, (windData.speed / 20) * 100);
  const currentScore = Math.min(100, (currentData.current_speed / 3) * 100);
  
  const overallScore = (waveScore + windScore + currentScore) / 3;
  
  if (overallScore < 30) return { level: 'calm', score: overallScore, color: 'green' };
  if (overallScore < 60) return { level: 'moderate', score: overallScore, color: 'yellow' };
  if (overallScore < 80) return { level: 'rough', score: overallScore, color: 'orange' };
  return { level: 'severe', score: overallScore, color: 'red' };
}

function categorizeWaveConditions(waveData) {
  const height = waveData.significant_height;
  
  if (height < 1) return { category: 'calm', description: 'Smooth seas', risk: 'low' };
  if (height < 2) return { category: 'slight', description: 'Small waves', risk: 'low' };
  if (height < 3) return { category: 'moderate', description: 'Moderate waves', risk: 'medium' };
  if (height < 4) return { category: 'rough', description: 'Large waves', risk: 'high' };
  return { category: 'very_rough', description: 'Very large waves', risk: 'very_high' };
}

function categorizeCurrentStrength(currentData) {
  const speed = currentData.current_speed;
  
  if (speed < 0.5) return { category: 'weak', description: 'Minimal current', risk: 'low' };
  if (speed < 1.0) return { category: 'moderate', description: 'Moderate current', risk: 'medium' };
  if (speed < 2.0) return { category: 'strong', description: 'Strong current', risk: 'high' };
  return { category: 'very_strong', description: 'Very strong current', risk: 'very_high' };
}

function categorizeWindConditions(windData) {
  const speed = windData.speed;
  
  if (speed < 5) return { category: 'light', description: 'Light winds', risk: 'low' };
  if (speed < 10) return { category: 'moderate', description: 'Moderate winds', risk: 'low' };
  if (speed < 15) return { category: 'fresh', description: 'Fresh winds', risk: 'medium' };
  if (speed < 20) return { category: 'strong', description: 'Strong winds', risk: 'high' };
  return { category: 'gale', description: 'Gale force winds', risk: 'very_high' };
}

function categorizeTemperature(tempData) {
  const temp = tempData.base_temperature;
  
  if (temp < 10) return { category: 'cold', description: 'Cold water', comfort: 'poor' };
  if (temp < 18) return { category: 'cool', description: 'Cool water', comfort: 'fair' };
  if (temp < 24) return { category: 'moderate', description: 'Moderate temperature', comfort: 'good' };
  if (temp < 28) return { category: 'warm', description: 'Warm water', comfort: 'excellent' };
  return { category: 'hot', description: 'Very warm water', comfort: 'good' };
}

function assessSafety(waveData, windData, currentData) {
  const waveRisk = waveData.significant_height > 3 ? 'high' : waveData.significant_height > 2 ? 'medium' : 'low';
  const windRisk = windData.speed > 15 ? 'high' : windData.speed > 10 ? 'medium' : 'low';
  const currentRisk = currentData.current_speed > 2 ? 'high' : currentData.current_speed > 1 ? 'medium' : 'low';
  
  const risks = [waveRisk, windRisk, currentRisk];
  const highRiskCount = risks.filter(r => r === 'high').length;
  const mediumRiskCount = risks.filter(r => r === 'medium').length;
  
  if (highRiskCount > 0) {
    return { 
      level: 'high_risk', 
      description: 'Dangerous conditions - avoid water activities',
      color: 'red'
    };
  } else if (mediumRiskCount >= 2) {
    return { 
      level: 'medium_risk', 
      description: 'Caution advised - experienced users only',
      color: 'orange'
    };
  } else if (mediumRiskCount > 0) {
    return { 
      level: 'low_risk', 
      description: 'Generally safe with normal precautions',
      color: 'yellow'
    };
  }
  
  return { 
    level: 'safe', 
    description: 'Good conditions for water activities',
    color: 'green'
  };
}

function generateRecommendations(waveData, windData, currentData) {
  const recommendations = [];
  
  if (waveData.significant_height > 2.5) {
    recommendations.push('Large waves present - small craft should exercise caution');
  }
  
  if (currentData.current_speed > 1.5) {
    recommendations.push('Strong currents detected - be aware of drift');
  }
  
  if (windData.speed > 12) {
    recommendations.push('Strong winds - consider postponing small boat activities');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Good conditions for most water activities');
  }
  
  return recommendations;
}

module.exports = router;