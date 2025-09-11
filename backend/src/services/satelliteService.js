const axios = require('axios');

class SatelliteService {
  constructor() {
    this.sentinelApiKey = process.env.SENTINEL_API_KEY;
    this.nasaApiKey = process.env.NASA_API_KEY;
    this.eosdisUrl = 'https://earthdata.nasa.gov/eosdis';
  }

  async getMangroveHealth(lat, lon, radius = 10) {
    try {
      // Simulated satellite analysis for mangrove health
      // In production, this would connect to actual satellite APIs
      const healthMetrics = await this.analyzeLandCover(lat, lon, radius);
      
      return {
        area: healthMetrics.mangroveArea,
        healthIndex: healthMetrics.ndvi, // Normalized Difference Vegetation Index
        changeRate: healthMetrics.changeRate,
        threatLevel: this.assessMangroveThreats(healthMetrics),
        lastUpdated: new Date(),
        coverage: {
          healthy: healthMetrics.healthyCoverage,
          stressed: healthMetrics.stressedCoverage,
          damaged: healthMetrics.damagedCoverage
        },
        threats: healthMetrics.detectedThreats
      };
    } catch (error) {
      console.error('Satellite Service Error:', error.message);
      throw new Error('Failed to analyze mangrove health');
    }
  }

  async analyzeLandCover(lat, lon, radius) {
    // Simulate satellite data analysis
    // In production, this would process actual satellite imagery
    const baseHealth = 0.7 + Math.random() * 0.3;
    const changeRate = (Math.random() - 0.5) * 10; // -5% to +5% change
    
    return {
      mangroveArea: 1500 + Math.random() * 500, // hectares
      ndvi: baseHealth,
      changeRate: changeRate,
      healthyCoverage: Math.max(0, baseHealth * 100 + Math.random() * 10),
      stressedCoverage: Math.max(0, (1 - baseHealth) * 50 + Math.random() * 10),
      damagedCoverage: Math.max(0, (1 - baseHealth) * 30 + Math.random() * 5),
      detectedThreats: this.generateThreatDetection()
    };
  }

  generateThreatDetection() {
    const threats = [];
    const possibleThreats = [
      'illegal_logging',
      'aquaculture_expansion',
      'urban_development',
      'pollution_discharge',
      'coastal_erosion',
      'sedimentation'
    ];

    // Randomly detect 0-3 threats
    const threatCount = Math.floor(Math.random() * 4);
    for (let i = 0; i < threatCount; i++) {
      const threat = possibleThreats[Math.floor(Math.random() * possibleThreats.length)];
      if (!threats.includes(threat)) {
        threats.push(threat);
      }
    }

    return threats;
  }

  assessMangroveThreats(metrics) {
    let threatLevel = 'low';
    
    if (metrics.ndvi < 0.5 || metrics.changeRate < -3) {
      threatLevel = 'high';
    } else if (metrics.ndvi < 0.7 || metrics.changeRate < -1) {
      threatLevel = 'medium';
    }
    
    if (metrics.detectedThreats.length > 2) {
      threatLevel = 'high';
    } else if (metrics.detectedThreats.length > 0) {
      threatLevel = threatLevel === 'low' ? 'medium' : threatLevel;
    }
    
    return threatLevel;
  }

  async getCoastalErosion(lat, lon, timeRange = '1year') {
    try {
      // Simulate coastal erosion analysis from satellite imagery
      const erosionData = {
        shorelineChange: (Math.random() - 0.7) * 50, // meters per year
        erosionRate: Math.random() * 5, // meters per year
        sedimentMovement: {
          direction: Math.random() * 360, // degrees
          intensity: Math.random() * 100 // percentage
        },
        vulnerabilityScore: Math.random() * 100,
        affectedLength: Math.random() * 5000, // meters of coastline
        lastUpdated: new Date()
      };

      return {
        ...erosionData,
        riskLevel: this.assessErosionRisk(erosionData),
        predictions: await this.predictErosionTrend(erosionData)
      };
    } catch (error) {
      console.error('Coastal Erosion Analysis Error:', error.message);
      throw new Error('Failed to analyze coastal erosion');
    }
  }

  assessErosionRisk(data) {
    if (data.erosionRate > 3 || data.vulnerabilityScore > 70) {
      return 'critical';
    } else if (data.erosionRate > 1.5 || data.vulnerabilityScore > 40) {
      return 'high';
    } else if (data.erosionRate > 0.5 || data.vulnerabilityScore > 20) {
      return 'medium';
    }
    return 'low';
  }

  async predictErosionTrend(currentData) {
    // Simple trend prediction based on current erosion rate
    const predictions = [];
    const currentRate = currentData.erosionRate;
    
    for (let months = 3; months <= 24; months += 3) {
      predictions.push({
        timeframe: `${months} months`,
        expectedErosion: currentRate * (months / 12),
        confidence: Math.max(20, 90 - (months / 12) * 10) // Confidence decreases over time
      });
    }
    
    return predictions;
  }

  async detectIllegalActivities(lat, lon, radius = 20) {
    try {
      // Simulate detection of illegal activities from satellite imagery
      const activities = [];
      
      // Random detection of various illegal activities
      const possibleActivities = [
        {
          type: 'illegal_dumping',
          confidence: Math.random() * 100,
          location: { lat: lat + (Math.random() - 0.5) * 0.1, lon: lon + (Math.random() - 0.5) * 0.1 },
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        },
        {
          type: 'unauthorized_construction',
          confidence: Math.random() * 100,
          location: { lat: lat + (Math.random() - 0.5) * 0.1, lon: lon + (Math.random() - 0.5) * 0.1 },
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        },
        {
          type: 'illegal_fishing',
          confidence: Math.random() * 100,
          location: { lat: lat + (Math.random() - 0.5) * 0.1, lon: lon + (Math.random() - 0.5) * 0.1 },
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        }
      ];

      // Randomly include some activities
      possibleActivities.forEach(activity => {
        if (Math.random() > 0.7) { // 30% chance of detection
          activities.push({
            ...activity,
            detectedAt: new Date(),
            id: Date.now() + Math.random()
          });
        }
      });

      return {
        totalDetected: activities.length,
        activities: activities,
        riskAssessment: this.assessActivityRisk(activities),
        recommendations: this.getActivityRecommendations(activities)
      };
    } catch (error) {
      console.error('Illegal Activity Detection Error:', error.message);
      throw new Error('Failed to detect illegal activities');
    }
  }

  assessActivityRisk(activities) {
    if (activities.length === 0) return 'low';
    
    const highSeverityCount = activities.filter(a => a.severity === 'high').length;
    const mediumSeverityCount = activities.filter(a => a.severity === 'medium').length;
    
    if (highSeverityCount > 0 || activities.length > 3) {
      return 'critical';
    } else if (mediumSeverityCount > 1 || activities.length > 1) {
      return 'high';
    } else {
      return 'medium';
    }
  }

  getActivityRecommendations(activities) {
    const recommendations = [];
    
    activities.forEach(activity => {
      switch(activity.type) {
        case 'illegal_dumping':
          recommendations.push('Deploy patrol teams to suspected dumping sites');
          recommendations.push('Install monitoring cameras in vulnerable areas');
          break;
        case 'unauthorized_construction':
          recommendations.push('Contact local authorities for immediate inspection');
          recommendations.push('Issue stop-work orders if necessary');
          break;
        case 'illegal_fishing':
          recommendations.push('Alert coast guard and marine patrol units');
          recommendations.push('Increase surveillance in fishing zones');
          break;
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  async getWaterQuality(lat, lon) {
    try {
      // Simulate water quality analysis from satellite data
      return {
        turbidity: Math.random() * 50, // NTU
        chlorophyll: Math.random() * 20, // mg/m³
        suspendedSediments: Math.random() * 100, // mg/L
        temperature: 25 + Math.random() * 10, // °C
        oxygenLevel: 6 + Math.random() * 4, // mg/L
        pHLevel: 7.5 + (Math.random() - 0.5) * 1.5,
        pollutionIndex: Math.random() * 100,
        qualityRating: ['excellent', 'good', 'fair', 'poor'][Math.floor(Math.random() * 4)],
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Water Quality Analysis Error:', error.message);
      throw new Error('Failed to analyze water quality');
    }
  }
}

module.exports = new SatelliteService();
