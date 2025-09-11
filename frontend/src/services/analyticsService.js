// CTAS Analytics Service with Sample Data
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';  
  
export const generateSeaLevelData = () => {
  const today = new Date();
  const data = [];
  
  // Generate 30 days of sea level data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseLevel = 2.1; // Base sea level in meters
    const tideVariation = Math.sin((i * Math.PI) / 12) * 1.5; // Tidal variation
    const randomNoise = (Math.random() - 0.5) * 0.3; // Random fluctuation
    const climateAnomaly = i < 7 ? Math.random() * 0.4 : 0; // Recent anomalies
    
    data.push({
      date: date.toISOString().split('T')[0],
      level: baseLevel + tideVariation + randomNoise + climateAnomaly,
      predicted: i === 0,
      confidence: i === 0 ? 0.85 : 1.0,
      anomaly: climateAnomaly > 0.2
    });
  }
  
  return data;
};  
  
export const generateThreatPredictions = () => {
  return {
    stormSurge: {
      probability: 0.42,
      nextPeak: '2025-09-02T14:30:00Z',
      affectedAreas: ['Mumbai Coast', 'Gujarat Shoreline', 'Konkan Coast'],
      severity: 'high',
      maxHeight: 3.2, // meters
      duration: 6 // hours
    },
    algalBloom: {
      probability: 0.68,
      peakPeriod: '2025-09-05 to 2025-09-15',
      affectedWaters: ['Arabian Sea', 'Kerala Backwaters', 'Goan Coast'],
      toxicityLevel: 'moderate',
      species: ['Noctiluca scintillans', 'Trichodesmium'],
      area: 1200 // sq km
    },
    coastalErosion: {
      rate: 2.8, // meters per year
      affectedLength: 67.3, // kilometers
      criticalZones: ['Kerala Backwaters', 'Tamil Nadu Coast', 'Sundarbans'],
      riskLevel: 'high',
      hotspots: [
        { location: 'Mumbai Coast', risk: 0.89, trend: 'increasing', erosionRate: 3.1 },
        { location: 'Goa Beaches', risk: 0.74, trend: 'stable', erosionRate: 1.8 },
        { location: 'Kerala Backwaters', risk: 0.93, trend: 'increasing', erosionRate: 4.2 },
        { location: 'Gujarat Coast', risk: 0.61, trend: 'decreasing', erosionRate: 1.2 }
      ]
    },
    cycloneRisk: {
      probability: 0.35,
      season: 'Post-Monsoon',
      expectedIntensity: 'Category 2-3',
      likelyPath: ['Bay of Bengal', 'Eastern Coast'],
      peakMonths: ['October', 'November']
    }
  };
};  
  
export const generatePollutionData = () => {
  const locations = ['Mumbai', 'Chennai', 'Kochi', 'Visakhapatnam', 'Goa', 'Mangalore'];
  
  return locations.map((location, index) => ({
    location,
    coordinates: {
      lat: 19.0760 + (index * 2.5),
      lng: 72.8777 + (index * 1.2)
    },
    waterQuality: {
      ph: 7.2 + Math.random() * 1.0,
      dissolvedOxygen: 5.5 + Math.random() * 2.5,
      turbidity: 10 + Math.random() * 25,
      temperature: 26 + Math.random() * 6,
      salinity: 34 + Math.random() * 2
    },
    pollutants: {
      oilSpills: Math.floor(Math.random() * 8),
      chemicalPollution: Math.floor(Math.random() * 12),
      plasticDebris: Math.floor(Math.random() * 25),
      industrialWaste: Math.floor(Math.random() * 6),
      sewageDischarge: Math.floor(Math.random() * 15)
    },
    airQuality: {
      pm25: 25 + Math.random() * 45,
      pm10: 40 + Math.random() * 70,
      no2: 20 + Math.random() * 35,
      so2: 8 + Math.random() * 18,
      ozone: 80 + Math.random() * 40
    },
    riskScore: Math.floor(60 + Math.random() * 40),
    lastUpdated: new Date().toISOString()
  }));
};  

export const generateCommunityRiskData = () => {
  return [
    {
      zone: 'High Risk Coastal Areas',
      population: 2.4,
      communities: ['Mumbai Fishing Villages', 'Chennai Port Area', 'Kochi Backwaters'],
      infrastructureVulnerability: 0.82,
      riskScore: 0.89,
      evacuationCapacity: 0.65,
      communicationCoverage: 0.78,
      emergencyServices: 0.71,
      color: '#dc2626',
      threats: ['Storm Surge', 'Coastal Flooding', 'Erosion']
    },
    {
      zone: 'Medium Risk Areas',
      population: 4.1,
      communities: ['Goa Beach Towns', 'Mangalore Suburbs', 'Pondicherry Coast'],
      infrastructureVulnerability: 0.58,
      riskScore: 0.64,
      evacuationCapacity: 0.80,
      communicationCoverage: 0.85,
      emergencyServices: 0.82,
      color: '#ea580c',
      threats: ['Cyclone', 'Flooding', 'Pollution']
    },
    {
      zone: 'Low Risk Areas',
      population: 6.7,
      communities: ['Interior Towns', 'Hill Stations', 'Protected Areas'],
      infrastructureVulnerability: 0.28,
      riskScore: 0.35,
      evacuationCapacity: 0.92,
      communicationCoverage: 0.94,
      emergencyServices: 0.88,
      color: '#16a34a',
      threats: ['Flash Floods', 'Landslides']
    },
    {
      zone: 'Protected Zones',
      population: 0.8,
      communities: ['Marine Sanctuaries', 'National Parks', 'Research Stations'],
      infrastructureVulnerability: 0.12,
      riskScore: 0.20,
      evacuationCapacity: 0.98,
      communicationCoverage: 0.96,
      emergencyServices: 0.94,
      color: '#2563eb',
      threats: ['Ecological Disruption']
    }
  ];
};

export const generateHistoricalData = () => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
  
  return {
    seaLevelTrend: years.map(year => ({
      year,
      avgLevel: 2.0 + (year - (currentYear - 9)) * 0.05 + Math.random() * 0.15,
      anomalies: Math.floor(Math.random() * 8),
      extremeEvents: Math.floor(Math.random() * 4)
    })),
    cycloneHistory: years.map(year => ({
      year,
      count: Math.floor(Math.random() * 6),
      category3Plus: Math.floor(Math.random() * 3),
      damages: Math.floor(Math.random() * 500) * 1000000 // in USD
    })),
    temperatureAnomaly: years.map(year => ({
      year,
      seaTemp: 27.5 + Math.random() * 2.5,
      anomaly: -1.0 + Math.random() * 2.0
    }))
  };
};

export const calculateConfidenceScore = (dataType = 'overall', factors = {}) => {
  const baseScores = {
    stormSurge: 0.87,
    seaLevel: 0.94,
    algalBloom: 0.81,
    pollution: 0.89,
    erosion: 0.83,
    cyclone: 0.76,
    overall: 0.85
  };

  let confidence = baseScores[dataType] || 0.75;
  
  // Adjust based on data quality factors
  if (factors.dataAge > 24) confidence *= 0.96; // Older data
  if (factors.sensorCount < 5) confidence *= 0.92; // Fewer sensors
  if (factors.weatherConditions === 'poor') confidence *= 0.88; // Bad conditions
  if (factors.satelliteData === true) confidence *= 1.05; // Satellite validation
  
  return Math.max(0.5, Math.min(1.0, confidence));
};

export const generateAnalyticsReport = async () => {
  const reportData = {
    timestamp: new Date().toISOString(),
    reportId: `CTAS-${Date.now()}`,
    seaLevelData: generateSeaLevelData(),
    threatPredictions: generateThreatPredictions(),
    pollutionAnalysis: generatePollutionData(),
    communityRisk: generateCommunityRiskData(),
    historicalData: generateHistoricalData(),
    recommendations: generateRecommendations(),
    confidence: {
      overall: calculateConfidenceScore('overall'),
      dataQuality: 0.91,
      predictionAccuracy: 0.78,
      sensorReliability: 0.85
    },
    summary: {
      highRiskAreas: 4,
      activeThreat: 'Storm Surge',
      peopleAtRisk: 240000,
      recommendedActions: 6
    }
  };

  return reportData;
};

export const generateRecommendations = () => {
  return [
    {
      id: 1,
      priority: 'critical',
      category: 'Storm Surge',
      title: 'Immediate evacuation alert for Mumbai and Gujarat Coast',
      description: 'Storm surge probability of 42% detected for September 2nd. Expected surge height of 3.2 meters.',
      action: 'Issue immediate community alerts, activate evacuation centers, and deploy emergency response teams',
      timeline: 'Next 48 hours',
      affectedPopulation: 150000,
      estimatedCost: 2500000
    },
    {
      id: 2,
      priority: 'high',
      category: 'Algal Bloom',
      title: 'Algal bloom monitoring in Kerala waters',
      description: 'High probability (68%) of algal bloom development. Noctiluca scintillans detected.',
      action: 'Restrict fishing activities, monitor water quality, issue health advisories to coastal communities',
      timeline: 'Next 2 weeks',
      affectedPopulation: 45000,
      estimatedCost: 800000
    },
    {
      id: 3,
      priority: 'high',
      category: 'Coastal Erosion',
      title: 'Critical erosion at Kerala Backwaters',
      description: 'Erosion rate of 4.2 meters/year detected - 93% above normal levels',
      action: 'Deploy coastal protection measures, relocate vulnerable infrastructure, implement sand nourishment',
      timeline: 'Next 3 months',
      affectedPopulation: 25000,
      estimatedCost: 5000000
    },
    {
      id: 4,
      priority: 'medium',
      category: 'Pollution',
      title: 'Industrial waste discharge monitoring',
      description: 'Elevated chemical pollution levels detected in Mumbai and Chennai coastal areas',
      action: 'Increase industrial monitoring, enforce discharge regulations, conduct water quality assessments',
      timeline: 'Ongoing',
      affectedPopulation: 75000,
      estimatedCost: 1200000
    },
    {
      id: 5,
      priority: 'medium',
      category: 'Cyclone Preparedness',
      title: 'Pre-monsoon cyclone preparation',
      description: 'Category 2-3 cyclone risk (35%) expected during post-monsoon season',
      action: 'Update evacuation plans, strengthen infrastructure, conduct community drills',
      timeline: 'Next 6 months',
      affectedPopulation: 500000,
      estimatedCost: 3000000
    },
    {
      id: 6,
      priority: 'low',
      category: 'Marine Conservation',
      title: 'Plastic debris cleanup initiative',
      description: 'Increasing plastic pollution affecting marine ecosystems',
      action: 'Organize beach cleanups, implement plastic ban enforcement, promote awareness campaigns',
      timeline: 'Ongoing',
      affectedPopulation: 1000000,
      estimatedCost: 600000
    }
  ];
};

export const exportReport = async (format = 'json') => {
  const data = await generateAnalyticsReport();
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'pdf') {
    return {
      filename: `CTAS-Analytics-Report-${timestamp}.pdf`,
      data: data,
      format: 'pdf',
      pages: 12,
      size: '2.1 MB'
    };
  } else if (format === 'csv') {
    return {
      filename: `CTAS-Data-Export-${timestamp}.csv`,
      data: data.seaLevelData,
      format: 'csv',
      rows: data.seaLevelData.length,
      size: '45 KB'
    };
  } else if (format === 'excel') {
    return {
      filename: `CTAS-Complete-Analysis-${timestamp}.xlsx`,
      data: data,
      format: 'excel',
      sheets: 6,
      size: '890 KB'
    };
  } else {
    return {
      filename: `CTAS-Report-${timestamp}.json`,
      data: JSON.stringify(data, null, 2),
      format: 'json',
      size: '156 KB'
    };
  }
};
  
export default {  
  generateSeaLevelData,  
  generateThreatPredictions,  
  generatePollutionData,
  generateCommunityRiskData,
  calculateConfidenceScore,
  exportReport
}; 
