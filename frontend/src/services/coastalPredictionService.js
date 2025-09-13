// Simple geospatial utilities without Turf.js for initial implementation
// import turf from '@turf/turf';

class CoastalPredictionService {
  constructor() {
    this.coastalData = null;
    this.loadCoastalData();
  }

  async loadCoastalData() {
    try {
      const response = await fetch('/coastal-threat-predictions.json');
      this.coastalData = await response.json();
      console.log('✅ Coastal threat data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load coastal data:', error);
    }
  }

  /**
   * Analyze a selected area and return threat predictions
   * @param {Object} selectedArea - GeoJSON feature of the selected area
   * @returns {Promise<Object>} Prediction results
   */
  async analyzeArea(selectedArea) {
    if (!this.coastalData) {
      await this.loadCoastalData();
    }

    if (!this.coastalData) {
      throw new Error('Coastal data not available');
    }

    try {
      // Find intersecting threat zones
      const intersections = this.findIntersectingZones(selectedArea);
      
      // Calculate area metrics
      const areaMetrics = this.calculateAreaMetrics(selectedArea);
      
      // Generate comprehensive prediction
      const prediction = this.generateComprehensivePrediction(
        selectedArea, 
        intersections, 
        areaMetrics
      );

      return prediction;
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error('Failed to analyze selected area');
    }
  }

  /**
   * Find threat zones that intersect with the selected area
   * @param {Object} selectedArea - GeoJSON feature
   * @returns {Array} Array of intersecting threat zones
   */
  findIntersectingZones(selectedArea) {
    const intersections = [];

    this.coastalData.features.forEach(threatZone => {
      try {
        // Use simple bounding box intersection for now
        if (this.boundingBoxIntersect(selectedArea, threatZone)) {
          intersections.push({
            ...threatZone,
            overlapWithThreatZone: 50, // Estimated
            overlapWithSelectedArea: 50 // Estimated
          });
        }
      } catch (error) {
        console.error('Intersection check error:', error);
      }
    });

    return intersections;
  }

  /**
   * Fallback method for bounding box intersection
   */
  boundingBoxIntersect(area1, area2) {
    const bbox1 = this.getBounds(area1.geometry);
    const bbox2 = this.getBounds(area2.geometry);
    
    return !(bbox1.maxLng < bbox2.minLng || 
             bbox2.maxLng < bbox1.minLng || 
             bbox1.maxLat < bbox2.minLat || 
             bbox2.maxLat < bbox1.minLat);
  }

  /**
   * Get bounding box for geometry
   */
  getBounds(geometry) {
    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    const processCoords = (coords) => {
      coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
          processCoords(coord);
        } else {
          minLng = Math.min(minLng, coord[0]);
          maxLng = Math.max(maxLng, coord[0]);
          minLat = Math.min(minLat, coord[1]);
          maxLat = Math.max(maxLat, coord[1]);
        }
      });
    };

    processCoords(geometry.coordinates);
    return { minLng, minLat, maxLng, maxLat };
  }

  /**
   * Calculate metrics for the selected area
   * @param {Object} selectedArea - GeoJSON feature
   * @returns {Object} Area metrics
   */
  calculateAreaMetrics(selectedArea) {
    try {
      const bounds = this.getBounds(selectedArea.geometry);
      
      // Simple area calculation (approximate)
      const latDiff = bounds.maxLat - bounds.minLat;
      const lngDiff = bounds.maxLng - bounds.minLng;
      const area = latDiff * lngDiff * 111 * 111; // Rough conversion to km²
      
      const center = [
        (bounds.minLng + bounds.maxLng) / 2,
        (bounds.minLat + bounds.maxLat) / 2
      ];

      return {
        area: area * 1000000, // Convert to square meters
        areaKm2: area,
        bbox: [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat],
        center: center,
        perimeterKm: (latDiff + lngDiff) * 111 * 2, // Approximate perimeter
        coordinates: selectedArea.geometry.coordinates
      };
    } catch (error) {
      console.error('Metrics calculation error:', error);
      return {
        area: 0,
        areaKm2: 0,
        bbox: [0, 0, 0, 0],
        center: [0, 0],
        perimeterKm: 0
      };
    }
  }

  /**
   * Generate comprehensive prediction based on analysis
   * @param {Object} selectedArea - GeoJSON feature
   * @param {Array} intersections - Intersecting threat zones
   * @param {Object} areaMetrics - Calculated area metrics
   * @returns {Object} Comprehensive prediction
   */
  generateComprehensivePrediction(selectedArea, intersections, areaMetrics) {
    if (intersections.length === 0) {
      return this.generateLowRiskPrediction(selectedArea, areaMetrics);
    }

    // Calculate weighted averages based on intersection areas
    const totalIntersectionArea = intersections.reduce((sum, intersection) => 
      sum + (intersection.intersectionArea || 0), 0);

    let weightedFloodRisk = 0;
    let weightedStormSurgeRisk = 0;
    let weightedCoastalErosion = 0;
    let weightedSeaLevelRise = 0;
    let totalPopulationAtRisk = 0;
    let maxThreatLevel = 'low';
    let weightedConfidence = 0;

    const allRecommendations = [];
    const intersectingZones = [];

    intersections.forEach(intersection => {
      const props = intersection.properties;
      const weight = (intersection.intersectionArea || 1) / totalIntersectionArea || 1;

      weightedFloodRisk += props.flood_risk * weight;
      weightedStormSurgeRisk += props.storm_surge_risk * weight;
      weightedCoastalErosion += props.coastal_erosion * weight;
      weightedSeaLevelRise += props.sea_level_rise * weight;
      weightedConfidence += props.prediction_confidence * weight;

        // Calculate population at risk based on area overlap
        const estimatedAreaRatio = (intersection.overlapWithSelectedArea || 50) / 100;
        totalPopulationAtRisk += props.population_at_risk * estimatedAreaRatio;      // Track highest threat level
      const threatLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
      if (threatLevels[props.threat_level] > threatLevels[maxThreatLevel]) {
        maxThreatLevel = props.threat_level;
      }

      allRecommendations.push(...(props.recommendations || []));
      intersectingZones.push({
        name: props.name,
        threatLevel: props.threat_level,
        overlapPercentage: intersection.overlapWithSelectedArea || 0
      });
    });

    // Generate risk scores
    const riskScores = this.calculateRiskScores({
      floodRisk: weightedFloodRisk,
      stormSurgeRisk: weightedStormSurgeRisk,
      coastalErosion: weightedCoastalErosion,
      seaLevelRise: weightedSeaLevelRise,
      areaSize: areaMetrics.areaKm2
    });

    // Get unique recommendations prioritized by frequency
    const recommendationCounts = {};
    allRecommendations.forEach(rec => {
      recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
    });

    const prioritizedRecommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([rec]) => rec);

    // Generate impact assessment
    const impactAssessment = this.generateImpactAssessment(
      riskScores, 
      totalPopulationAtRisk, 
      areaMetrics
    );

    return {
      areaId: selectedArea.id || `area_${Date.now()}`,
      analysisTimestamp: new Date().toISOString(),
      
      // Area Information
      areaMetrics,
      
      // Risk Assessment
      threatLevel: maxThreatLevel,
      riskScores,
      overallRiskScore: this.calculateOverallRiskScore(riskScores),
      
      // Detailed Predictions
      predictions: {
        floodRisk: {
          probability: weightedFloodRisk,
          level: this.getRiskLevel(weightedFloodRisk),
          description: this.getFloodRiskDescription(weightedFloodRisk)
        },
        stormSurgeRisk: {
          probability: weightedStormSurgeRisk,
          level: this.getRiskLevel(weightedStormSurgeRisk),
          description: this.getStormSurgeDescription(weightedStormSurgeRisk)
        },
        coastalErosion: {
          probability: weightedCoastalErosion,
          level: this.getRiskLevel(weightedCoastalErosion),
          description: this.getErosionDescription(weightedCoastalErosion)
        },
        seaLevelRise: {
          expectedRise: weightedSeaLevelRise,
          timeframe: '2050',
          description: this.getSeaLevelDescription(weightedSeaLevelRise)
        }
      },
      
      // Impact Assessment
      impactAssessment,
      estimatedPopulationAtRisk: Math.round(totalPopulationAtRisk),
      
      // Intersecting Zones
      intersectingZones,
      
      // Recommendations
      recommendations: prioritizedRecommendations,
      emergencyActions: this.getEmergencyActions(maxThreatLevel),
      
      // Confidence and Metadata
      predictionConfidence: weightedConfidence,
      dataQuality: this.assessDataQuality(intersections),
      limitations: this.getAnalysisLimitations(),
      
      // Additional Context
      nearestCoastDistance: this.estimateCoastDistance(areaMetrics.center),
      climateFactors: this.getClimateFactors(areaMetrics.center)
    };
  }

  generateLowRiskPrediction(selectedArea, areaMetrics) {
    return {
      areaId: selectedArea.id || `area_${Date.now()}`,
      analysisTimestamp: new Date().toISOString(),
      areaMetrics,
      threatLevel: 'low',
      overallRiskScore: 0.15,
      predictions: {
        floodRisk: {
          probability: 0.1,
          level: 'low',
          description: 'Minimal flood risk detected in this area'
        },
        stormSurgeRisk: {
          probability: 0.05,
          level: 'low',
          description: 'Low storm surge impact expected'
        }
      },
      recommendations: [
        'Monitor coastal conditions regularly',
        'Maintain emergency preparedness plans',
        'Consider climate change adaptation strategies'
      ],
      predictionConfidence: 0.7,
      intersectingZones: [],
      estimatedPopulationAtRisk: 0
    };
  }

  calculateRiskScores(risks) {
    return {
      flood: risks.floodRisk,
      stormSurge: risks.stormSurgeRisk,
      erosion: risks.coastalErosion,
      seaLevel: risks.seaLevelRise,
      combined: (risks.floodRisk + risks.stormSurgeRisk + risks.coastalErosion + risks.seaLevelRise) / 4
    };
  }

  calculateOverallRiskScore(riskScores) {
    // Weighted combination of different risk factors
    return (
      riskScores.flood * 0.3 +
      riskScores.stormSurge * 0.3 +
      riskScores.erosion * 0.2 +
      riskScores.seaLevel * 0.2
    );
  }

  getRiskLevel(probability) {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.3) return 'medium';
    return 'low';
  }

  getFloodRiskDescription(risk) {
    if (risk >= 0.8) return 'Severe flooding likely during extreme weather events';
    if (risk >= 0.6) return 'Significant flood risk during storm seasons';
    if (risk >= 0.3) return 'Moderate flooding possible during heavy rainfall';
    return 'Low flood risk under normal conditions';
  }

  getStormSurgeDescription(risk) {
    if (risk >= 0.8) return 'Critical storm surge threat during cyclones';
    if (risk >= 0.6) return 'High storm surge risk during severe weather';
    if (risk >= 0.3) return 'Moderate storm surge impact possible';
    return 'Low storm surge risk';
  }

  getErosionDescription(erosion) {
    if (erosion >= 0.8) return 'Severe coastal erosion expected';
    if (erosion >= 0.6) return 'Significant shoreline retreat likely';
    if (erosion >= 0.3) return 'Moderate erosion over time';
    return 'Minimal erosion expected';
  }

  getSeaLevelDescription(rise) {
    if (rise >= 0.15) return `Significant sea level rise of ${(rise * 100).toFixed(0)}cm expected by 2050`;
    if (rise >= 0.1) return `Moderate sea level rise of ${(rise * 100).toFixed(0)}cm expected by 2050`;
    return `Minimal sea level rise of ${(rise * 100).toFixed(0)}cm expected by 2050`;
  }

  generateImpactAssessment(riskScores, populationAtRisk, areaMetrics) {
    const infrastructure = this.assessInfrastructureImpact(riskScores, areaMetrics);
    const economic = this.assessEconomicImpact(riskScores, areaMetrics, populationAtRisk);
    const environmental = this.assessEnvironmentalImpact(riskScores, areaMetrics);

    return {
      infrastructure,
      economic,
      environmental,
      social: {
        displacementRisk: populationAtRisk > 10000 ? 'high' : populationAtRisk > 1000 ? 'medium' : 'low',
        vulnerablePopulations: Math.round(populationAtRisk * 0.3), // Estimated vulnerable population
        healthRisks: riskScores.combined > 0.6 ? 'significant' : 'moderate'
      }
    };
  }

  assessInfrastructureImpact(riskScores, areaMetrics) {
    const combinedRisk = riskScores.combined;
    return {
      level: combinedRisk > 0.7 ? 'critical' : combinedRisk > 0.4 ? 'high' : 'moderate',
      affectedArea: `${areaMetrics.areaKm2.toFixed(1)} km²`,
      criticalInfrastructure: combinedRisk > 0.6 ? 'At severe risk' : 'Manageable risk',
      transportationImpact: combinedRisk > 0.5 ? 'Major disruptions expected' : 'Minor disruptions possible'
    };
  }

  assessEconomicImpact(riskScores, areaMetrics, populationAtRisk) {
    const baseImpact = riskScores.combined * areaMetrics.areaKm2 * 1000000; // Simplified calculation
    return {
      estimatedLoss: `$${(baseImpact / 1000000).toFixed(1)}M`,
      businessImpact: riskScores.combined > 0.6 ? 'Severe disruption' : 'Moderate impact',
      tourismImpact: riskScores.erosion > 0.6 ? 'Significant negative impact' : 'Minor impact',
      agricultureImpact: riskScores.seaLevel > 0.1 ? 'Saltwater intrusion risk' : 'Minimal impact'
    };
  }

  assessEnvironmentalImpact(riskScores, areaMetrics) {
    return {
      ecosystemThreat: riskScores.combined > 0.6 ? 'severe' : 'moderate',
      habitatLoss: `${(areaMetrics.areaKm2 * riskScores.combined * 0.5).toFixed(1)} km² at risk`,
      waterQuality: riskScores.flood > 0.5 ? 'Contamination risk' : 'Stable',
      biodiversity: riskScores.erosion > 0.6 ? 'High impact on coastal species' : 'Moderate impact'
    };
  }

  getEmergencyActions(threatLevel) {
    const actions = {
      critical: [
        'Activate emergency response protocols immediately',
        'Evacuate vulnerable populations',
        'Deploy emergency resources',
        'Coordinate with disaster management authorities'
      ],
      high: [
        'Implement early warning systems',
        'Prepare evacuation routes',
        'Stock emergency supplies',
        'Monitor weather conditions closely'
      ],
      medium: [
        'Review emergency plans',
        'Educate community on risks',
        'Maintain emergency kits',
        'Monitor situation regularly'
      ],
      low: [
        'Maintain awareness of conditions',
        'Keep emergency contacts updated',
        'Review insurance coverage'
      ]
    };
    return actions[threatLevel] || actions.low;
  }

  assessDataQuality(intersections) {
    if (intersections.length === 0) return 'limited';
    
    const avgConfidence = intersections.reduce((sum, intersection) => 
      sum + intersection.properties.prediction_confidence, 0) / intersections.length;
    
    if (avgConfidence > 0.8) return 'high';
    if (avgConfidence > 0.6) return 'good';
    if (avgConfidence > 0.4) return 'moderate';
    return 'limited';
  }

  getAnalysisLimitations() {
    return [
      'Predictions based on historical data and current models',
      'Local microclimates may affect accuracy',
      'Real-time conditions may vary from predictions',
      'Regular updates recommended for changing conditions'
    ];
  }

  estimateCoastDistance(center) {
    // Simplified distance calculation - in a real app, you'd use proper coastline data
    const [lng, lat] = center;
    
    // Basic estimation for Indian coastline
    if (lat > 20 && lng < 75) return '< 50 km'; // Western coast
    if (lat < 20 && lng > 75) return '< 100 km'; // Eastern coast
    if (lng > 85) return '< 25 km'; // Bay of Bengal
    
    return 'Inland location';
  }

  getClimateFactors(center) {
    const [lng, lat] = center;
    
    // Simplified climate zone classification for India
    if (lat > 23) {
      return {
        zone: 'Northern India',
        monsoon: 'July-September',
        cycloneRisk: 'Low',
        extremeWeather: 'Heat waves, flash floods'
      };
    } else if (lng < 77) {
      return {
        zone: 'Western Coast',
        monsoon: 'June-September',
        cycloneRisk: 'Moderate',
        extremeWeather: 'Arabian Sea cyclones'
      };
    } else {
      return {
        zone: 'Eastern Coast',
        monsoon: 'June-September, October-December',
        cycloneRisk: 'High',
        extremeWeather: 'Bay of Bengal cyclones'
      };
    }
  }

  /**
   * Batch analyze multiple areas
   * @param {Array} areas - Array of GeoJSON features
   * @returns {Promise<Array>} Array of predictions
   */
  async batchAnalyze(areas) {
    const predictions = [];
    
    for (const area of areas) {
      try {
        const prediction = await this.analyzeArea(area);
        predictions.push(prediction);
      } catch (error) {
        console.error(`Failed to analyze area ${area.id}:`, error);
        predictions.push({
          areaId: area.id,
          error: error.message,
          analysisTimestamp: new Date().toISOString()
        });
      }
    }
    
    return predictions;
  }
}

// Create and export singleton instance
const coastalPredictionService = new CoastalPredictionService();
export default coastalPredictionService;