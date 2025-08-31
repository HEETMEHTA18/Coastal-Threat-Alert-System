/**
 * CTAS Chatbot Training Module
 * 
 * This module contains functionality for training the CTAS chatbot
 * to focus on coastal data, terminology, and threat assessment.
 */

import { 
  oceanographicTerms, 
  coastalMorphology,
  meteorologicalTerms,
  coastalFloodTerminology,
  scientificStandards,
  vulnerabilityMetrics,
  coastalModels,
  responseTemplates,
  historicalEvents,
  coastalThreats
} from './coastalKnowledgeBase';

// Sample data for training and simulation
const sampleMonitoringStations = [
  { id: 'CB0102', name: 'Virginia Beach', lat: 36.8516, lng: -75.9792 },
  { id: 'CB0224', name: 'Outer Banks', lat: 35.2226, lng: -75.6429 },
  { id: 'CB0347', name: 'Charleston Harbor', lat: 32.7765, lng: -79.9311 },
  { id: 'CB0458', name: 'Miami Beach', lat: 25.7907, lng: -80.1300 },
  { id: 'CB0569', name: 'Galveston Bay', lat: 29.3013, lng: -94.7977 },
  { id: 'CB0672', name: 'San Diego', lat: 32.7157, lng: -117.1611 }
];

// Sample real-time data generator
const generateStationData = (stationId) => {
  const now = new Date();
  // Simulated, but with realistic values
  const baseWaterLevel = 1 + Math.sin(now.getHours() / 6 * Math.PI) * 0.8; // Tidal cycle
  const anomaly = Math.random() > 0.9 ? (Math.random() * 0.4) : 0; // Occasional anomalies
  const pressure = 1013 + Math.random() * 20 - 10; // Random pressure around normal
  const windSpeed = 5 + Math.random() * 15; // Random wind 5-20 knots
  const waveHeight = 0.5 + Math.random() * (windSpeed / 10); // Wave height related to wind
  
  return {
    stationId,
    timestamp: now.toISOString(),
    waterLevel: (baseWaterLevel + anomaly).toFixed(2),
    datum: "NAVD88",
    meanWaterLevel: 1.0,
    waveHeight: waveHeight.toFixed(1),
    wavePeriod: (4 + Math.random() * 8).toFixed(1),
    waveDirection: Math.floor(Math.random() * 360),
    pressure: Math.floor(pressure),
    windSpeed: Math.floor(windSpeed),
    windDirection: Math.floor(Math.random() * 360),
    waterTemp: (20 + Math.random() * 5).toFixed(1),
    turbidity: Math.floor(Math.random() * 20),
    currentSpeed: (Math.random() * 2).toFixed(1),
    currentDirection: Math.floor(Math.random() * 360),
    tidalStage: baseWaterLevel > 1 ? "Flood" : "Ebb",
    percentOfRange: Math.floor(Math.abs(baseWaterLevel - 1) / 0.8 * 100),
    anomaly: anomaly > 0.2 ? "Significant water level anomaly detected" : null,
    littoralDirection: Math.random() > 0.5 ? "Northward" : "Southward",
    transportRate: Math.floor(100 + Math.random() * 400),
    hazardLevel: 
      pressure < 1000 && windSpeed > 15 ? "HIGH" :
      pressure < 1005 || windSpeed > 10 ? "MODERATE" : "LOW",
    hazardAssessment: 
      pressure < 1000 && windSpeed > 15 ? 
        "Strong onshore flow with low pressure system creating elevated water levels and wave conditions." :
      pressure < 1005 || windSpeed > 10 ?
        "Moderate coastal conditions with potential for minor coastal flooding during high tide." :
        "Stable coastal conditions with minimal hazard potential.",
    isOperational: Math.random() > 0.05, // 5% chance station is offline
    lastUpdate: now.toISOString(),
    waterLevelTrend: (Math.random() * 0.2 - 0.1).toFixed(2),
    pressureTrend: (Math.random() * 4 - 2).toFixed(1)
  };
};

// Sample warning data generator
const generateWarning = () => {
  const now = new Date();
  const endTime = new Date(now);
  endTime.setHours(now.getHours() + Math.floor(Math.random() * 24) + 6);
  
  const types = ["Coastal Flood Warning", "High Surf Advisory", "Storm Surge Watch", "Rip Current Statement"];
  const levels = ["Minor", "Moderate", "Major"];
  const areas = [
    "Virginia Beach to Outer Banks",
    "Charleston Harbor and vicinity",
    "Miami-Dade Coastal Zone",
    "Galveston Bay and Bolivar Peninsula",
    "San Diego County Coastal Areas"
  ];
  
  const type = types[Math.floor(Math.random() * types.length)];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const selectedAreas = [];
  const areaCount = Math.floor(Math.random() * 3) + 1;
  
  // Select random areas without duplicates
  while (selectedAreas.length < areaCount) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    if (!selectedAreas.includes(area)) {
      selectedAreas.push(area);
    }
  }
  
  const impacts = [
    "Inundation of low-lying properties and roadways near the waterfront",
    "Beach erosion and dune overwash likely",
    "Strong rip currents creating dangerous swimming conditions",
    "Moderate coastal flooding expected during high tide cycles",
    "Wave action overtopping seawalls and coastal structures"
  ];
  
  const actions = [
    "Move to higher ground if in a flood-prone area",
    "Secure loose objects that could be blown by wind",
    "Do not drive through flooded roadways",
    "Heed all evacuation orders from local officials",
    "Stay away from beaches and shorelines during high surf",
    "Monitor NOAA Weather Radio for updates"
  ];
  
  // Select random impacts and actions
  const selectedImpacts = [];
  const impactCount = Math.floor(Math.random() * 3) + 1;
  while (selectedImpacts.length < impactCount) {
    const impact = impacts[Math.floor(Math.random() * impacts.length)];
    if (!selectedImpacts.includes(impact)) {
      selectedImpacts.push(impact);
    }
  }
  
  const selectedActions = [];
  const actionCount = Math.floor(Math.random() * 3) + 2;
  while (selectedActions.length < actionCount) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    if (!selectedActions.includes(action)) {
      selectedActions.push(action);
    }
  }
  
  return {
    type,
    level,
    startTime: now.toLocaleString(),
    endTime: endTime.toLocaleString(),
    areas: selectedAreas,
    expectedConditions: level === "Major" 
      ? "Water levels 2-4 feet above ground level in vulnerable areas" 
      : level === "Moderate"
      ? "Water levels 1-2 feet above ground level in vulnerable areas"
      : "Minor coastal flooding in low-lying areas",
    impacts: selectedImpacts,
    actions: selectedActions,
    confidence: Math.floor(Math.random() * 20) + 80, // 80-99%
    source: "NOAA / National Weather Service"
  };
};

// Sample scientific explanation generator
const generateExplanation = (topic) => {
  const explanations = {
    "storm surge": {
      summary: "Storm surge is an abnormal rise of water generated by a storm, over and above predicted astronomical tides. It's produced by water being pushed toward the shore by the force of winds moving around the storm.",
      processes: [
        { 
          name: "Wind stress", 
          description: "Friction between wind and water surface transferring momentum to the water body" 
        },
        { 
          name: "Inverse barometer effect", 
          description: "Low atmospheric pressure causing water levels to rise (approximately 1cm per 1hPa drop below standard pressure)" 
        },
        { 
          name: "Bathymetric amplification", 
          description: "Shallowing water depths causing surge height to increase as it approaches shore" 
        },
        { 
          name: "Coriolis effect", 
          description: "Earth's rotation influencing the direction of water movement" 
        }
      ],
      methodology: "Storm surge is measured as the difference between observed water level and predicted tide. Predictions use numerical models like SLOSH and ADCIRC that simulate complex interactions between wind, pressure, bathymetry, and coastal features.",
      parameters: [
        { 
          name: "Wind Speed", 
          description: "Velocity of wind over water surface", 
          units: "knots or m/s" 
        },
        { 
          name: "Wind Duration", 
          description: "Length of time wind blows in consistent direction", 
          units: "hours" 
        },
        { 
          name: "Wind Fetch", 
          description: "Distance wind blows over water surface", 
          units: "km" 
        },
        { 
          name: "Central Pressure", 
          description: "Air pressure at storm center", 
          units: "hPa or mb" 
        },
        { 
          name: "Storm Forward Speed", 
          description: "Velocity of storm system movement", 
          units: "knots or km/h" 
        },
        { 
          name: "Coastal Bathymetry", 
          description: "Underwater depth profile approaching shore", 
          units: "m" 
        },
        { 
          name: "Coastal Topography", 
          description: "Land elevation profile", 
          units: "m above datum" 
        }
      ],
      references: [
        "NOAA National Hurricane Center Storm Surge Overview",
        "IPCC Special Report on the Ocean and Cryosphere in a Changing Climate (2019)",
        "Coastal Engineering Manual (US Army Corps of Engineers)",
        "Journal of Physical Oceanography: 'Modeling Storm Surge in the Atlantic Basin'"
      ]
    },
    "coastal erosion": {
      summary: "Coastal erosion is the process by which local sea level rise, strong wave action, and coastal flooding wear down or carry away rocks, soils, and sands along the coast. It's a natural process that can be exacerbated by human activities and climate change.",
      processes: [
        { 
          name: "Hydraulic action", 
          description: "Force of water compressed in cracks causing breakdown of material" 
        },
        { 
          name: "Abrasion", 
          description: "Sediment carried by waves acting as sandpaper on coastal features" 
        },
        { 
          name: "Attrition", 
          description: "Sediment particles colliding and breaking into smaller pieces" 
        },
        { 
          name: "Solution", 
          description: "Chemical dissolution of soluble rocks by seawater" 
        },
        { 
          name: "Longshore drift", 
          description: "Transport of sediment parallel to the shore due to oblique wave approach" 
        }
      ],
      methodology: "Coastal erosion is measured through repeated surveys using LiDAR, photogrammetry, satellite imagery analysis, beach profiles, and fixed monitoring stations. Digital shoreline analysis software compares positions over time to calculate rates of change.",
      parameters: [
        { 
          name: "Shoreline Position", 
          description: "Location of land-water interface", 
          units: "m from reference" 
        },
        { 
          name: "Erosion Rate", 
          description: "Speed of shoreline retreat", 
          units: "m/year" 
        },
        { 
          name: "Wave Energy", 
          description: "Force exerted by waves on shoreline", 
          units: "J/m²" 
        },
        { 
          name: "Sediment Budget", 
          description: "Balance of sediment inputs and outputs", 
          units: "m³/year" 
        },
        { 
          name: "Beach Slope", 
          description: "Gradient of beach face", 
          units: "degrees or ratio" 
        },
        { 
          name: "Sediment Size", 
          description: "Diameter of sediment particles", 
          units: "mm" 
        }
      ],
      references: [
        "USGS National Assessment of Shoreline Change",
        "Coastal Engineering Manual (US Army Corps of Engineers)",
        "Journal of Coastal Research: 'Global Patterns of Beach Erosion and Accretion'",
        "Shore Protection Manual (US Army Corps of Engineers)",
        "Coastal Erosion: Processes, Patterns and Prediction (Springer)"
      ]
    },
    "sea level rise": {
      summary: "Sea level rise is the increase in the global mean sea level caused primarily by thermal expansion of seawater as it warms and increased water mass from melting ice sheets and glaciers. Regional sea level changes can differ from the global average due to local factors.",
      processes: [
        { 
          name: "Thermal expansion", 
          description: "Seawater expanding as it warms, contributing about 1/3 of observed sea level rise" 
        },
        { 
          name: "Ice sheet melting", 
          description: "Water from melting Greenland and Antarctic ice sheets entering the ocean" 
        },
        { 
          name: "Glacier retreat", 
          description: "Water from melting mountain glaciers and ice caps entering the ocean" 
        },
        { 
          name: "Land water storage changes", 
          description: "Alterations in water stored on land in reservoirs, groundwater, etc." 
        },
        { 
          name: "Vertical land movement", 
          description: "Local uplift or subsidence affecting relative sea level" 
        },
        { 
          name: "Oceanographic factors", 
          description: "Changes in currents, winds, and atmospheric pressure affecting regional sea levels" 
        }
      ],
      methodology: "Sea level is measured via tide gauges (historical record) and satellite altimetry (since 1993). Global reconstructions combine these datasets with geological evidence. Future projections use process-based models accounting for emissions scenarios and ice sheet dynamics.",
      parameters: [
        { 
          name: "Global Mean Sea Level (GMSL)", 
          description: "Average height of ocean surface worldwide", 
          units: "mm/year" 
        },
        { 
          name: "Relative Sea Level", 
          description: "Sea level relative to local land elevation", 
          units: "mm/year" 
        },
        { 
          name: "Thermal Expansion", 
          description: "Volume increase due to ocean warming", 
          units: "mm/year" 
        },
        { 
          name: "Ice Mass Loss", 
          description: "Contribution from ice sheets and glaciers", 
          units: "Gt/year or mm/year SLE" 
        },
        { 
          name: "Vertical Land Movement", 
          description: "Rate of land uplift or subsidence", 
          units: "mm/year" 
        }
      ],
      references: [
        "IPCC Sixth Assessment Report (2021)",
        "NOAA Sea Level Rise Technical Report (2022)",
        "NASA Sea Level Portal",
        "Journal of Climate: 'Understanding Sea Level Rise and Variability'",
        "U.S. Global Change Research Program: Climate Science Special Report"
      ]
    },
  };
  
  return explanations[topic.toLowerCase()] || {
    summary: "This topic relates to coastal processes and threats monitored by CTAS.",
    processes: [
      { name: "Natural processes", description: "Physical, chemical, and biological processes affecting coastal zones" },
      { name: "Anthropogenic factors", description: "Human influences on coastal systems" }
    ],
    methodology: "CTAS uses multi-sensor data integration and advanced analytics to monitor this phenomenon.",
    parameters: [
      { name: "Monitoring parameters", description: "Key indicators tracked by sensors", units: "various" }
    ],
    references: [
      "CTAS Technical Documentation",
      "Coastal Monitoring Best Practices Guide"
    ]
  };
};

/**
 * Pattern recognition for coastal terminology
 * Maps user input patterns to technical coastal terminology
 */
export const coastalPatternMatcher = (input) => {
  const inputLower = input.toLowerCase();
  const patterns = [
    // Oceanographic terms
    { regex: /\b(tide|tidal|high water|low water)\b/, category: 'oceanographic', subtype: 'tidal' },
    { regex: /\b(wave|swell|surf|crest|period)\b/, category: 'oceanographic', subtype: 'wave' },
    { regex: /\b(current|circulation|transport|flow)\b/, category: 'oceanographic', subtype: 'current' },
    
    // Coastal morphology
    { regex: /\b(beach|shore|dune|cliff|spit|barrier island)\b/, category: 'morphology', subtype: 'features' },
    { regex: /\b(erosion|accretion|scour|sediment|drift|overwash)\b/, category: 'morphology', subtype: 'processes' },
    
    // Weather/meteorological
    { regex: /\b(pressure|wind|storm|hurricane|cyclone|front)\b/, category: 'meteorological', subtype: 'general' },
    { regex: /\b(hurricane|cyclone|typhoon|tropical storm|eye)\b/, category: 'meteorological', subtype: 'cyclonic' },
    
    // Flooding
    { regex: /\b(flood|inundation|submerg|overflow|surge|submerged)\b/, category: 'flooding', subtype: 'types' },
    { regex: /\b(water level|stage|datum|peak|depth)\b/, category: 'flooding', subtype: 'indicators' },
    
    // Standards & units
    { regex: /\b(navd88|ngvd29|wgs84|datum)\b/, category: 'standards', subtype: 'datums' },
    { regex: /\b(meter|foot|knot|pascal|bar|mile)\b/, category: 'standards', subtype: 'units' },
    
    // Vulnerability assessment
    { regex: /\b(vulnerability|resilience|adaptation|exposure|sensitivity)\b/, category: 'vulnerability', subtype: 'parameters' },
    { regex: /\b(index|cvi|sovi|risk score|exposure index)\b/, category: 'vulnerability', subtype: 'indices' },
    
    // Models and analysis
    { regex: /\b(model|simulation|adcirc|swan|slosh|delft3d|fvcom)\b/, category: 'models', subtype: 'hydrodynamic' },
    { regex: /\b(statistical|probability|return period|monte carlo|extreme value)\b/, category: 'models', subtype: 'statistical' },
    { regex: /\b(machine learning|ai|neural network|lstm|cnn|prediction)\b/, category: 'models', subtype: 'ai' },
    
    // Location patterns
    { regex: /\b(location|area|region|zone|where)\b/, category: 'location', subtype: 'general' },
    
    // Threat types
    { regex: /\b(threat|hazard|risk|danger|warning|alert)\b/, category: 'threats', subtype: 'general' },
    { regex: /\b(erosion|retreating|washing away|losing beach)\b/, category: 'threats', subtype: 'erosion' },
    { regex: /\b(flood|flooding|inundation|submerged|underwater)\b/, category: 'threats', subtype: 'flooding' },
    { regex: /\b(sea level rise|rising seas|higher water|permanent inundation)\b/, category: 'threats', subtype: 'sealevelrise' }
  ];
  
  // Find all matching patterns
  const matches = patterns.filter(pattern => pattern.regex.test(inputLower));
  
  return matches.length > 0 ? matches : [{ category: 'general', subtype: 'inquiry' }];
};

/**
 * Coastal data retriever
 * Gets relevant data based on identified patterns
 */
export const getCoastalData = (patterns) => {
  const data = {};
  
  // Process each identified pattern
  patterns.forEach(pattern => {
    switch(pattern.category) {
      case 'oceanographic':
        if (pattern.subtype === 'tidal') {
          data.tidalTerminology = oceanographicTerms.tidal;
        } else if (pattern.subtype === 'wave') {
          data.waveTerminology = oceanographicTerms.wave;
        } else if (pattern.subtype === 'current') {
          data.currentTerminology = oceanographicTerms.current;
        }
        break;
        
      case 'morphology':
        if (pattern.subtype === 'features') {
          data.coastalFeatures = coastalMorphology.features;
        } else if (pattern.subtype === 'processes') {
          data.morphologicalProcesses = coastalMorphology.processes;
        }
        break;
        
      case 'meteorological':
        if (pattern.subtype === 'general') {
          data.meteorologicalTerms = meteorologicalTerms.general;
        } else if (pattern.subtype === 'cyclonic') {
          data.cycloneTerminology = meteorologicalTerms.cyclonic;
        }
        break;
        
      case 'flooding':
        if (pattern.subtype === 'types') {
          data.floodTypes = coastalFloodTerminology.types;
        } else if (pattern.subtype === 'indicators') {
          data.floodIndicators = coastalFloodTerminology.indicators;
        }
        break;
        
      case 'location':
        // Get random station for demo
        const locationStation = sampleMonitoringStations[
          Math.floor(Math.random() * sampleMonitoringStations.length)
        ];
        data.locationData = {
          station: locationStation,
          measurements: generateStationData(locationStation.id)
        };
        break;
        
      case 'threats':
        if (pattern.subtype === 'erosion') {
          data.erosionData = coastalThreats.erosion;
        } else if (pattern.subtype === 'flooding') {
          data.floodingData = coastalThreats.flooding;
        } else if (pattern.subtype === 'sealevelrise') {
          data.sealevelData = coastalThreats.sealevelRise;
        } else {
          // General threat - provide a warning
          data.warningData = generateWarning();
        }
        break;
        
      case 'models':
        if (pattern.subtype === 'hydrodynamic') {
          data.hydrodynamicModels = coastalModels.hydrodynamic;
        } else if (pattern.subtype === 'statistical') {
          data.statisticalMethods = coastalModels.statistical;
        } else if (pattern.subtype === 'ai') {
          data.aiModels = coastalModels.ai;
        }
        break;
        
      default:
        // For general inquiries, provide monitoring status
        const defaultStation = sampleMonitoringStations[
          Math.floor(Math.random() * sampleMonitoringStations.length)
        ];
        data.generalData = {
          station: defaultStation,
          measurements: generateStationData(defaultStation.id)
        };
    }
  });
  
  return data;
};

/**
 * Generate response using templates based on identified patterns and retrieved data
 */
export const generateCoastalResponse = (patterns, data, userInput) => {
  // Check for specific scientific explanation requests
  if (userInput.toLowerCase().includes('explain') || userInput.toLowerCase().includes('how does')) {
    for (const topic of ['storm surge', 'coastal erosion', 'sea level rise']) {
      if (userInput.toLowerCase().includes(topic)) {
        const explanation = generateExplanation(topic);
        return responseTemplates.scientificExplanation(topic, explanation);
      }
    }
  }
  
  // Technical assessment for location-specific inquiries
  if (data.locationData) {
    return responseTemplates.technicalAssessment(
      data.locationData.station.name,
      data.locationData.measurements
    );
  }
  
  // Warning message for threat inquiries
  if (data.warningData) {
    return responseTemplates.warningMessage(data.warningData);
  }
  
  // Monitoring status for general inquiries
  if (data.generalData) {
    return responseTemplates.monitoringStatus(
      data.generalData.station.id,
      data.generalData.measurements
    );
  }
  
  // If no specific template applies, generate a generic coastal response
  return `I can provide specialized coastal data analysis for:

🌊 **Oceanographic Parameters**: Tides, waves, currents, water levels
🏝️ **Coastal Morphology**: Shoreline change, erosion rates, sediment transport
🌀 **Meteorological Factors**: Storms, pressure systems, wind patterns
🚨 **Hazard Assessment**: Flooding, erosion threats, sea level rise impacts

What specific coastal information would you like to analyze?`;
};

/**
 * Main coastal chatbot training function
 * This processes user input and generates coastal-focused responses
 */
export const trainedCoastalResponse = (userInput) => {
  // Step 1: Identify patterns in user input
  const patterns = coastalPatternMatcher(userInput);
  
  // Step 2: Retrieve relevant coastal data based on patterns
  const data = getCoastalData(patterns);
  
  // Step 3: Generate specialized coastal response
  return generateCoastalResponse(patterns, data, userInput);
};

/**
 * Function to evaluate how "coastal" a response is
 * Higher score indicates more coastal terminology and relevant content
 */
export const evaluateCoastalScore = (text) => {
  const coastalTerms = [
    ...Object.keys(oceanographicTerms.tidal),
    ...Object.keys(oceanographicTerms.wave),
    ...Object.keys(oceanographicTerms.current),
    ...Object.keys(coastalMorphology.features),
    ...Object.keys(coastalMorphology.processes),
    ...Object.keys(meteorologicalTerms.general),
    ...Object.keys(meteorologicalTerms.cyclonic),
    ...Object.keys(coastalFloodTerminology.types),
    ...Object.keys(coastalFloodTerminology.indicators)
  ];
  
  // Count coastal terms in the text
  let coastalTermCount = 0;
  const textLower = text.toLowerCase();
  
  coastalTerms.forEach(term => {
    if (textLower.includes(term.toLowerCase())) {
      coastalTermCount++;
    }
  });
  
  // Count coastal patterns
  const coastalPatterns = [
    /\b(tide|tidal|wave|current|beach|shore|erosion|accretion|flood|surge)\b/gi,
    /\b(water level|storm surge|sea level rise|coastal hazard|littoral|nearshore)\b/gi,
    /\b(dune|barrier island|inlet|estuary|salt marsh|mangrove|coral reef)\b/gi,
    /\b(meters|feet|knots|navd88|mhhw|mllw|datum)\b/gi
  ];
  
  let patternMatchCount = 0;
  coastalPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      patternMatchCount += matches.length;
    }
  });
  
  // Calculate coastal score (0-100)
  const baseScore = Math.min(100, coastalTermCount * 5 + patternMatchCount * 3);
  
  return {
    score: baseScore,
    rating: baseScore >= 80 ? "Excellent" : 
            baseScore >= 60 ? "Good" : 
            baseScore >= 40 ? "Moderate" : 
            baseScore >= 20 ? "Low" : "Very Low",
    termCount: coastalTermCount,
    patternCount: patternMatchCount
  };
};

// Export all functions for use in the chatbot
export default {
  trainedCoastalResponse,
  evaluateCoastalScore,
  coastalPatternMatcher,
  getCoastalData,
  generateCoastalResponse,
  generateWarning,
  generateStationData,
  sampleMonitoringStations
};
