/**
 * Coastal Chatbot Initialization Module
 * 
 * This module handles initialization of the chatbot with coastal data focus
 * and provides training methods to improve coastal expertise.
 */
import { evaluateCoastalScore } from './chatbotTrainer';

// Initial phrases to prime the chatbot with coastal focus
const coastalInitializationPhrases = [
  "The current tidal state indicates a king tide event with water levels 0.6m above MHHW.",
  "Our coastal sensors are detecting abnormal wave patterns with Hs values exceeding seasonal averages.",
  "Recent bathymetric surveys indicate significant changes in the nearshore morphology.",
  "Sea level anomaly detection algorithms have identified a non-storm related water level increase.",
  "Littoral transport rates have increased by 28% due to modified wave refraction patterns.",
  "Analyzing ADCIRC model outputs for potential coastal flooding during the upcoming spring tide.",
  "Remote sensing data confirms accelerated erosion rates along the barrier island system."
];

/**
 * Initializes the chatbot with coastal focus
 * This uses a priming technique to establish specialized context
 */
export const initializeCoastalChatbot = () => {
  console.log("Initializing CTAS chatbot with coastal expertise...");
  
  // Process initialization phrases to establish coastal context
  const scores = coastalInitializationPhrases.map(phrase => {
    return {
      phrase,
      evaluation: evaluateCoastalScore(phrase)
    };
  });
  
  // Calculate average coastal score
  const averageScore = scores.reduce((sum, item) => sum + item.evaluation.score, 0) / scores.length;
  
  console.log(`Coastal priming complete. Average coastal expertise score: ${averageScore.toFixed(1)}/100`);
  
  return {
    status: "initialized",
    coastalExpertiseScore: averageScore,
    coastalTermsLoaded: true,
    specializations: [
      "oceanographic_data",
      "coastal_morphology",
      "meteorological_analysis",
      "flood_risk_assessment",
      "coastal_vulnerability"
    ],
    initTime: new Date().toISOString()
  };
};

/**
 * Sets up specialized coastal response modes
 */
export const coastalResponseModes = {
  // Technical mode - highly specialized, data-focused
  technical: {
    name: "Technical Mode",
    description: "Provides detailed technical responses with specialized coastal terminology and data analysis",
    promptPrefix: "Respond with detailed technical coastal analysis using specialized terminology and precise measurements. Include relevant parameters and cite methodologies.",
    sample: "Analysis of nearshore morphodynamics indicates significant sediment transport in the littoral zone with net drift rates of 120 m³/day in the southward direction. Bathymetric surveys reveal a 0.8m scour trench adjacent to the groin field, likely due to wave-induced turbulence during recent high energy events. ADCIRC hydrodynamic modeling suggests potential for increased erosion during spring tide conditions coinciding with the forecasted extratropical system."
  },
  
  // Standard mode - balanced between technical and accessible
  standard: {
    name: "Standard Mode",
    description: "Balances technical accuracy with accessibility, suitable for informed stakeholders",
    promptPrefix: "Provide balanced coastal information with some technical terms but ensure clarity for non-specialists. Include key data points with context.",
    sample: "The shoreline is experiencing erosion at a rate of about 2 meters per year. This is happening because of stronger waves reaching the coast during storms and the rising sea levels. Our monitoring shows that during high tides, water levels are now reaching areas that were previously dry, which increases flooding risk. The most vulnerable areas are the low-lying sections near the inlet where wave energy is concentrated."
  },
  
  // Public mode - accessible for general audiences
  public: {
    name: "Public Mode",
    description: "Presents coastal information in accessible language for general public consumption",
    promptPrefix: "Translate complex coastal concepts into clear, accessible language without technical terminology. Focus on impacts and practical information.",
    sample: "The beach is washing away faster than normal, losing about 6 feet of sand each year. During storms, waves are coming higher up the beach than they used to, sometimes reaching the dunes. This means homes near the beach could face more flooding during big storms. The most at-risk areas are near the inlet, where waves are stronger. We recommend keeping at least 100 feet away from eroding dune edges during storms."
  },
  
  // Emergency mode - focused on critical information
  emergency: {
    name: "Emergency Mode",
    description: "Provides critical coastal threat information during emergencies",
    promptPrefix: "Provide critical coastal threat information in clear, direct language focused on safety. Prioritize actionable guidance, threat levels, and timelines.",
    sample: "🚨 URGENT: Coastal flooding expected in the next 3-6 hours. Water may reach 2-3 feet above ground in low-lying areas. Move to higher ground immediately if you're in a flood zone. Do not drive through flooded roads. Monitor emergency channels for evacuation notices. Conditions will be worst between 8:00-11:00 PM during high tide."
  }
};

/**
 * Coastal chatbot training data schema
 */
export const coastalTrainingSchema = {
  // Categories of coastal expertise for the chatbot
  categories: [
    {
      name: "Oceanographic Parameters",
      terms: ["tide", "wave height", "current", "sea level", "water level", "surge"],
      dataTypes: ["time series", "spatial distribution", "anomaly detection"],
      responseElements: ["measurement values", "trend analysis", "historical context"]
    },
    {
      name: "Coastal Morphology",
      terms: ["erosion", "accretion", "shoreline", "beach", "dune", "sediment"],
      dataTypes: ["rate calculations", "spatial patterns", "vulnerability assessment"],
      responseElements: ["change rates", "causal factors", "mitigation strategies"]
    },
    {
      name: "Weather & Climate",
      terms: ["storm", "hurricane", "wind", "pressure", "rainfall", "sea level rise"],
      dataTypes: ["forecasts", "historical records", "projections"],
      responseElements: ["warning indicators", "preparation advice", "impact assessment"]
    },
    {
      name: "Vulnerability & Risk",
      terms: ["vulnerability", "risk", "exposure", "adaptation", "resilience"],
      dataTypes: ["indices", "spatial mapping", "scenario planning"],
      responseElements: ["comparative analysis", "prioritization", "adaptation strategies"]
    }
  ],
  
  // Response structure guidance
  responseStructure: {
    technicalAssessment: [
      "Opening context statement",
      "Key parameters with values",
      "Analysis of significance",
      "Hazard/risk level",
      "Recommendations or next steps"
    ],
    monitoring: [
      "Status indicator",
      "Current measurements",
      "Trend information",
      "Anomaly detection",
      "Forecast if applicable"
    ],
    warning: [
      "Alert type and level",
      "Timeframe",
      "Affected areas",
      "Expected conditions",
      "Potential impacts",
      "Recommended actions"
    ],
    explanation: [
      "Concise definition",
      "Key processes",
      "Measurement methodology",
      "Relevant parameters",
      "Scientific context"
    ]
  }
};

export default {
  initializeCoastalChatbot,
  coastalResponseModes,
  coastalTrainingSchema
};
