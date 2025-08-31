/**
 * Coastal Threat Assessment System (CTAS) Knowledge Base
 * Specialized coastal terminology, data patterns, and technical information
 */

// Oceanographic Terminology Database
export const oceanographicTerms = {
  // Tidal Terminology
  tidal: {
    "amphidromic point": "A point in the ocean where there is almost no tidal range",
    "astronomical tide": "The tide levels resulting from gravitational effects of the moon, sun, and planets",
    "bathymetry": "The measurement of depth of water in oceans, seas, or lakes",
    "diurnal tide": "A tide with one high water and one low water in a tidal day",
    "ebb tide": "The receding or outgoing tide, when water levels fall",
    "flood tide": "The incoming or rising tide, when water levels rise",
    "HAT (Highest Astronomical Tide)": "The highest tide level predicted to occur under average meteorological conditions",
    "king tide": "Exceptionally high tides occurring during new or full moons",
    "LAT (Lowest Astronomical Tide)": "The lowest tide level predicted to occur under average meteorological conditions",
    "MHHW (Mean Higher High Water)": "The average of the higher high water height each tidal day",
    "MLLW (Mean Lower Low Water)": "The average of the lower low water height each tidal day",
    "MSL (Mean Sea Level)": "The arithmetic mean of hourly water heights observed over a specific 19-year period",
    "neap tide": "Tides with the smallest range occurring during quarter moons",
    "semidiurnal tide": "A tide with two high waters and two low waters in a tidal day",
    "spring tide": "Tides with the largest range occurring during new and full moons",
    "storm surge": "Abnormal rise of water above predicted astronomical tides due to storm forces",
    "tidal datum": "A standard elevation defined by a certain phase of the tide, used as references for measurements",
    "tidal prism": "The volume of water exchanged between a coastal basin and the open sea during a tidal cycle",
    "tidal range": "The vertical difference between high tide and low tide"
  },

  // Wave Mechanics
  wave: {
    "breaking wave": "A wave that becomes unstable and collapses as it approaches shore",
    "crest": "The highest point of a wave",
    "fetch": "The distance over which wind blows to generate waves",
    "Hs (significant wave height)": "The average height of the highest one-third of waves in a wave spectrum",
    "longshore current": "Current flowing parallel to the shore within the surf zone",
    "rip current": "Strong, localized, narrow currents flowing seaward from the shore",
    "swell": "Waves that have traveled out of the area where they were generated",
    "Tp (peak period)": "The wave period associated with the most energetic waves in a spectrum",
    "trough": "The lowest point of a wave",
    "wave period": "The time taken for two successive wave crests to pass a fixed point",
    "wave run-up": "The maximum vertical extent of wave uprush on a beach or structure",
    "wave setup": "Elevation of the water level at the shoreline due to breaking waves",
    "wave spectrum": "Distribution of wave energy as a function of frequency or wavelength"
  },

  // Current Dynamics
  current: {
    "advection": "Horizontal transport of water, heat, or dissolved substances",
    "eddy": "Circular movement of water counter to the main current",
    "geostrophic current": "Current resulting from balance between pressure gradient and Coriolis forces",
    "gyre": "Large system of rotating ocean currents",
    "littoral current": "Nearshore currents running parallel to the shoreline",
    "longshore transport": "Movement of sediment along the coast by currents",
    "meridional circulation": "North-south movement of ocean water",
    "residual current": "Net water movement over one or more tidal cycles after removing tidal fluctuations",
    "thermohaline circulation": "Global ocean circulation driven by density differences due to temperature and salinity",
    "upwelling": "Process where deep, cold water rises toward the surface",
    "zonal circulation": "East-west movement of ocean water"
  }
};

// Coastal Morphology Database
export const coastalMorphology = {
  features: {
    "backshore": "The zone of a beach extending from the limit of high water to the coastline",
    "barrier island": "Elongated offshore island running parallel to the coast",
    "beach berm": "Nearly horizontal platform formed on the beach by wave deposition",
    "beach face": "The sloping section of beach normally exposed to wave action",
    "coastal dunes": "Sand deposits formed by aeolian (wind) processes above the high tide line",
    "delta": "Deposit of sediment formed where a river flows into a standing body of water",
    "estuary": "Semi-enclosed coastal body of water with connection to the sea and freshwater input",
    "foreshore": "The part of the shore lying between high and low water marks",
    "headland": "A high point of land projecting into a body of water",
    "inlet": "Narrow water passage between islands or connecting two larger bodies of water",
    "lagoon": "Shallow body of water separated from the sea by barrier islands or reefs",
    "littoral zone": "The area between high and low water marks plus the zone affected by wave action",
    "nearshore": "The zone extending from the shoreline to just beyond the breaker zone",
    "offshore": "The zone beyond the nearshore zone where wave-induced sediment transport ceases",
    "salt marsh": "Coastal wetland regularly flooded by saltwater, dominated by halophytic plants",
    "sea cliff": "A cliff formed by wave erosion along a coastline",
    "spit": "A long, narrow accumulation of sand or gravel projecting from land into water",
    "swash zone": "Area of shore face alternately covered and exposed by wave run-up and backwash",
    "tombolo": "Sand or gravel bar connecting an island to the mainland or another island"
  },
  processes: {
    "accretion": "The gradual addition of new land to old by deposition of sediment",
    "coastal squeeze": "Loss of coastal habitats due to sea level rise and hard coastal defenses",
    "erosion": "The removal of beach or dune sediments by wave or current action",
    "longshore drift": "The movement of material along a coast by waves that approach at an angle",
    "overwash": "The flow of water and sediment over the crest of a beach during high wave conditions",
    "scour": "Localized erosion due to fast-flowing water, often around structures",
    "sediment transport": "The movement of solid particles by water or wind",
    "shoreline retreat": "The landward movement of a shoreline over time due to erosion"
  }
};

// Meteorological Terminology
export const meteorologicalTerms = {
  general: {
    "atmospheric pressure": "The pressure exerted by the weight of the atmosphere",
    "barometric pressure": "Atmospheric pressure as indicated by a barometer",
    "coastal convergence zone": "Area where different air masses meet near the coast, causing rising air",
    "extratropical cyclone": "A large-scale storm that transfers energy from warm to cold regions",
    "front": "Boundary between two air masses of different densities",
    "isobar": "Line on a map connecting points of equal atmospheric pressure",
    "jet stream": "Fast flowing, narrow air currents found in the upper atmosphere",
    "mesoscale": "Weather systems smaller than synoptic scale but larger than microscale",
    "relative humidity": "The ratio of water vapor present in air to the amount needed for saturation",
    "synoptic scale": "Large-scale weather patterns spanning hundreds to thousands of kilometers"
  },
  cyclonic: {
    "eye": "The calm center of a tropical cyclone",
    "eyewall": "The ring of thunderstorms surrounding the eye of a tropical cyclone",
    "hurricane": "Tropical cyclone with sustained winds of at least 74 mph (Atlantic basin)",
    "Saffir-Simpson scale": "Scale categorizing hurricanes from 1-5 based on sustained wind speed",
    "storm surge": "Abnormal rise in sea level during a storm",
    "storm tide": "Combination of storm surge and normal tide",
    "tropical depression": "Tropical cyclone with sustained surface winds below 39 mph",
    "tropical storm": "Tropical cyclone with sustained surface winds of 39-73 mph",
    "typhoon": "Tropical cyclone in the western North Pacific with sustained winds of at least 74 mph"
  }
};

// Coastal Flood Terminology
export const coastalFloodTerminology = {
  types: {
    "coastal flooding": "Flooding along coastal areas due to high tides, storm surge, or heavy rainfall",
    "compound flooding": "Flooding caused by multiple simultaneous hazards (e.g., storm surge and rainfall)",
    "flash flooding": "Rapid flooding caused by heavy rainfall over a short time period",
    "groundwater inundation": "Flooding due to elevated groundwater tables in coastal areas",
    "king tide flooding": "Flooding that occurs during king tides without storm influence",
    "nuisance flooding": "Minor, recurrent flooding causing public inconvenience",
    "overflow flooding": "Flooding that occurs when water levels exceed containment structures",
    "pluvial flooding": "Surface flooding caused by intense rainfall exceeding drainage capacity",
    "storm surge flooding": "Flooding caused by abnormal rise of water due to storm forces",
    "tidal flooding": "Flooding that occurs primarily due to high astronomical tides"
  },
  indicators: {
    "bankfull stage": "Water level at which a stream fills its channel and begins to overflow",
    "datum": "Reference point for measuring water levels and elevations",
    "flood peak": "Maximum height of a flood wave as it passes a location",
    "flood stage": "Water elevation at which significant inundation occurs in the area",
    "inundation depth": "The height of floodwater above ground level",
    "major flooding": "Extensive inundation, significant evacuations, and major property damage",
    "minor flooding": "Minimal or no property damage, but potentially some public threat",
    "moderate flooding": "Some inundation of structures and roads, evacuations may be required",
    "recurrence interval": "Average time between flood events of a certain magnitude",
    "stillwater elevation": "Water level without the influence of waves",
    "water level anomaly": "Difference between observed and predicted water levels"
  }
};

// Scientific Measurement Standards
export const scientificStandards = {
  datums: {
    "NAVD88": "North American Vertical Datum of 1988, a fixed reference for elevations",
    "NGVD29": "National Geodetic Vertical Datum of 1929, an older reference system",
    "WGS84": "World Geodetic System 1984, standard for cartography and satellite navigation",
    "local tidal datums": "Reference levels derived from tide observations at a location"
  },
  units: {
    "feet (ft)": "Imperial unit of length (0.3048 meters)",
    "hectopascal (hPa)": "Unit of pressure equal to 100 pascals",
    "knot": "Nautical unit of speed equal to one nautical mile per hour (1.852 km/h)",
    "meter (m)": "SI base unit of length",
    "millibar (mb)": "Unit of pressure equal to 100 pascals",
    "nautical mile": "Unit of length used in maritime contexts (1.852 kilometers)"
  }
};

// Coastal Vulnerability Metrics
export const vulnerabilityMetrics = {
  indices: {
    "CVI (Coastal Vulnerability Index)": "A relative measure of coastal vulnerability to future sea-level rise",
    "SLR (Sea Level Rise) impact potential": "Assessment of potential impacts from different sea level rise scenarios",
    "SoVI (Social Vulnerability Index)": "Index identifying communities that may need support in preparation for hazards",
    "wave exposure index": "Measure of an area's exposure to wave energy"
  },
  parameters: {
    "adaptive capacity": "The ability of a system to adjust to climate change to moderate damages",
    "exposure": "The presence of people, assets, or systems in places that could be adversely affected",
    "resilience": "The ability to prepare for, respond to, and recover from hazards",
    "sensitivity": "The degree to which a system is affected by climate variability or change",
    "vulnerability": "The propensity or predisposition to be adversely affected"
  }
};

// Models & Analysis Methods
export const coastalModels = {
  hydrodynamic: {
    "ADCIRC": "Advanced Circulation model for oceanic, coastal, and estuarine waters",
    "Delft3D": "Open source modeling suite for hydrodynamics, sediment transport, and morphology",
    "FVCOM": "Finite Volume Community Ocean Model for coastal ocean and estuaries",
    "MIKE21": "Professional modeling system for 2D free-surface flows",
    "SCHISM": "Semi-implicit Cross-scale Hydroscience Integrated System Model",
    "SLOSH": "Sea, Lake, and Overland Surges from Hurricanes model",
    "SWAN": "Simulating Waves Nearshore, a spectral wave model",
    "TUFLOW": "Two-dimensional Unsteady FLOW model",
    "WaveWatch III": "NOAA wave prediction model for global and regional scales"
  },
  statistical: {
    "EOF (Empirical Orthogonal Function)": "Statistical technique to identify patterns in data",
    "extreme value analysis": "Statistical methods for estimating probability of rare events",
    "Monte Carlo simulation": "Computational algorithm using repeated random sampling",
    "PCA (Principal Component Analysis)": "Technique to reduce dimensionality while preserving variance",
    "return period analysis": "Statistical method to estimate recurrence of events"
  },
  ai: {
    "ARIMA": "AutoRegressive Integrated Moving Average for time series forecasting",
    "CNN (Convolutional Neural Networks)": "Deep learning algorithm for spatial data analysis",
    "LSTM (Long Short-Term Memory)": "Recurrent neural network for sequential data prediction",
    "ML (Machine Learning)": "Algorithms that improve through experience without explicit programming",
    "random forest": "Ensemble learning method using multiple decision trees"
  }
};

// Technical Response Templates
export const responseTemplates = {
  // Technical assessment response pattern
  technicalAssessment: (location, data) => `
**COASTAL CONDITION ASSESSMENT: ${location.toUpperCase()}**

**OBSERVATIONAL PARAMETERS:**
• Water Level: ${data.waterLevel}m ${data.waterLevel > data.meanWaterLevel ? 'above' : 'below'} ${data.datum}
• Wave Conditions: Hs=${data.waveHeight}m, Tp=${data.wavePeriod}s, Dir=${data.waveDirection}°
• Atmospheric: ${data.pressure}hPa ${data.pressure < 1000 ? '(LOW)' : ''}, winds ${data.windSpeed}kts from ${data.windDirection}

**ANALYSIS:**
• Tidal Stage: ${data.tidalStage} (${data.percentOfRange}% of tidal range)
• Anomaly Detection: ${data.anomaly ? `⚠️ ${data.anomaly}` : '✓ Within normal parameters'}
• Littoral Transport: ${data.littoralDirection} at approx. ${data.transportRate}m³/day

**${data.hazardLevel} HAZARD LEVEL ${data.hazardLevel === 'HIGH' ? '🚨' : data.hazardLevel === 'MODERATE' ? '⚠️' : '✅'}**
${data.hazardAssessment}
`,
  
  // Monitoring status template
  monitoringStatus: (station, data) => `
**STATION ${station} MONITORING STATUS:**

${data.isOperational ? '✅ OPERATIONAL' : '❌ OFFLINE'} | Last Update: ${data.lastUpdate}

**REAL-TIME MEASUREMENTS:**
• Water Level: ${data.waterLevel}m ${data.datum}
• Wave Parameters: ${data.waveHeight}m @ ${data.wavePeriod}s
• Current: ${data.currentSpeed}kts ${data.currentDirection}
• Water Temperature: ${data.waterTemp}°C
• Turbidity: ${data.turbidity} NTU

**TRENDS (24H):**
• Water Level: ${data.waterLevelTrend > 0 ? '↗' : data.waterLevelTrend < 0 ? '↘' : '→'} ${Math.abs(data.waterLevelTrend)}m
• Pressure: ${data.pressureTrend > 0 ? '↗' : data.pressureTrend < 0 ? '↘' : '→'} ${Math.abs(data.pressureTrend)}hPa
`,
  
  // Warning message template
  warningMessage: (warning) => `
🚨 **${warning.type.toUpperCase()} - ${warning.level.toUpperCase()}**

**VALID:** ${warning.startTime} to ${warning.endTime}

**AFFECTED AREAS:**
${warning.areas.map(area => `• ${area}`).join('\n')}

**EXPECTED CONDITIONS:**
• ${warning.expectedConditions}

**POTENTIAL IMPACTS:**
${warning.impacts.map(impact => `• ${impact}`).join('\n')}

**RECOMMENDED ACTIONS:**
${warning.actions.map(action => `• ${action}`).join('\n')}

**CONFIDENCE:** ${warning.confidence}%
**SOURCE:** ${warning.source}
`,

  // Scientific explanation template
  scientificExplanation: (topic, explanation) => `
**${topic.toUpperCase()} - SCIENTIFIC EXPLANATION**

${explanation.summary}

**KEY PROCESSES:**
${explanation.processes.map(process => `• ${process.name}: ${process.description}`).join('\n')}

**MEASUREMENT METHODOLOGY:**
${explanation.methodology}

**RELEVANT PARAMETERS:**
${explanation.parameters.map(param => `• ${param.name}: ${param.description} [${param.units}]`).join('\n')}

**REFERENCES:**
${explanation.references.map(ref => `• ${ref}`).join('\n')}
`
};

// Historical coastal events database
export const historicalEvents = {
  hurricanes: [
    {
      name: "Hurricane Katrina",
      year: 2005,
      category: 5,
      impact: "28-foot storm surge, levee failures, 1,833 deaths, $125B damage",
      lessons: "Improved evacuation procedures, levee redesign, better emergency communications"
    },
    {
      name: "Hurricane Sandy",
      year: 2012,
      category: 3,
      impact: "14-foot storm surge in NYC, 233 deaths, $68.7B damage",
      lessons: "Enhanced coastal protection infrastructure, improved storm prediction models"
    },
    {
      name: "Hurricane Harvey",
      year: 2017,
      category: 4,
      impact: "Extreme rainfall (60 inches), catastrophic flooding, $125B damage",
      lessons: "Improved flood risk mapping, compound flood event modeling"
    },
    {
      name: "Hurricane Maria",
      year: 2017,
      category: 5,
      impact: "Devastated Puerto Rico, 2,975 deaths, $90B damage",
      lessons: "Critical infrastructure resilience, improved disaster response"
    },
    {
      name: "Hurricane Ian",
      year: 2022,
      category: 5,
      impact: "15-foot storm surge in Florida, 157 deaths, $113B damage",
      lessons: "Enhanced early warning systems, evacuation planning improvements"
    }
  ],
  
  tsunamis: [
    {
      name: "Indian Ocean Tsunami",
      year: 2004,
      trigger: "9.1 magnitude submarine earthquake",
      impact: "Waves up to 30m, 230,000 deaths across 14 countries",
      lessons: "Global tsunami warning system development, coastal evacuation planning"
    },
    {
      name: "Japan Tohoku Tsunami",
      year: 2011,
      trigger: "9.0 magnitude submarine earthquake",
      impact: "Wave heights up to 40m, 18,000 deaths, nuclear disaster",
      lessons: "Improved sea wall design, nuclear safety protocols"
    }
  ],
  
  sealevelEvents: [
    {
      name: "Miami King Tide Flooding",
      years: "2015-Present",
      impact: "Regular flooding of streets during highest tides",
      adaptation: "Raised roads, improved drainage, pumping stations"
    },
    {
      name: "Venice Acqua Alta",
      year: 2019,
      impact: "187cm flood height, 80% of city flooded",
      adaptation: "MOSE barrier system implemented to protect lagoon"
    }
  ]
};

// Common coastal threat patterns
export const coastalThreats = {
  erosion: {
    indicators: [
      "Shoreline retreat exceeding historical averages",
      "Vegetation line recession",
      "Exposure of previously buried structures",
      "Formation of scarps on dunes",
      "Loss of beach width during normal conditions"
    ],
    causes: [
      "Sea level rise accelerating erosion rates",
      "Increased storm frequency/intensity",
      "Interruption of natural sediment transport",
      "Hardened shorelines causing adjacent erosion",
      "Reduced sediment supply from rivers"
    ],
    mitigations: [
      "Beach nourishment projects",
      "Living shoreline implementation",
      "Managed retreat strategies",
      "Offshore breakwaters",
      "Dune restoration and stabilization"
    ]
  },
  
  flooding: {
    types: [
      "Tidal flooding (astronomically driven)",
      "Storm surge (wind-driven)",
      "Rainfall/runoff (precipitation-driven)",
      "Groundwater (subsurface-driven)",
      "Compound flooding (multiple sources)"
    ],
    indicators: [
      "Increasing frequency of flood events",
      "Higher flood depths for equivalent storm conditions",
      "Expanded flood zones",
      "Extended flood durations",
      "New areas experiencing flooding"
    ],
    mitigations: [
      "Elevation of structures",
      "Strategic retreat from high-risk areas",
      "Improved drainage systems",
      "Nature-based solutions",
      "Flood barriers and pump systems"
    ]
  },
  
  sealevelRise: {
    indicators: [
      "Higher high tide levels",
      "Saltwater intrusion into groundwater",
      "Coastal ecosystem migration",
      "Increased nuisance flooding frequency",
      "Infrastructure impacts at lower storm intensities"
    ],
    projections: {
      "2050_low": "0.3 meters global mean sea level rise",
      "2050_intermediate": "0.5 meters global mean sea level rise",
      "2050_high": "0.8 meters global mean sea level rise",
      "2100_low": "0.6 meters global mean sea level rise",
      "2100_intermediate": "1.0 meters global mean sea level rise",
      "2100_high": "2.0 meters global mean sea level rise"
    },
    adaptations: [
      "Coastal vulnerability assessments",
      "Adaptation planning",
      "Building code modifications",
      "Natural infrastructure enhancement",
      "Managed retreat strategies"
    ]
  }
};
