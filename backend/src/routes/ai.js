const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

// Helper to flat-map questionnaire answers
const getRolePermissions = (role) => {
  return {
    canCreateAlerts: role === 'admin' || role === 'operator',
    canAcknowledgeAlerts: role === 'admin' || role === 'operator',
    canGenerateReports: true,
    canManageUsers: role === 'admin',
    canViewDashboard: true,
    canAccessAPI: role === 'admin' || role === 'operator'
  };
};

// POST /api/ai/predict_alert - Predict alert (mocked or routed to mock server)
router.post('/predict_alert', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Call mock AI service if available, otherwise return mock data
    try {
      const response = await axios.post(`${process.env.AI_API_URL || 'http://127.0.0.1:8000'}/api/predict_alert`, {
        latitude,
        longitude
      }, { timeout: 2000 });
      return res.json(response.data);
    } catch (e) {
      // Fallback local prediction
      const rainProb = Math.round(Math.random() * 30);
      const mockPrediction = {
        type: 'prediction',
        payload: {
          rain_predicted: Math.random() > 0.7,
          rain_probability: rainProb,
          temperature_predicted: Math.round(20 + Math.random() * 15),
          humidity_predicted: Math.round(40 + Math.random() * 40),
          water_level_predicted: Math.round((1 + Math.random() * 2) * 10) / 10,
          location: { latitude, longitude }
        },
        probability: rainProb / 100,
        timestamp: new Date().toISOString()
      };
      res.json(mockPrediction);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Prediction service temporarily unavailable',
      details: error.message
    });
  }
});

// POST /api/ai/chat - Gemini RAG Chatbot
router.post('/chat', async (req, res) => {
  try {
    const { message = '', mode = 'standard', context = {} } = req.body || {};
    const lower = String(message).toLowerCase();
    
    // Fetch live relational context from PostgreSQL for RAG
    let activeReportsText = '';
    try {
      const recentReports = await prisma.environmentalReport.findMany({
        where: { status: { in: ['active', 'investigating'] } },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      if (recentReports.length > 0) {
        activeReportsText += 'Recent Coastal Reports:\n' + recentReports.map(r => 
          `- [${r.reportType.toUpperCase()}] ${r.title} (${r.location}) - Severity: ${r.severity}`
        ).join('\n') + '\n';
      }
    } catch (dbErr) {
      console.warn('RAG database retrieval failed, bypassing context:', dbErr.message);
    }

    // Augment RAG context with locally stored community reports (fallback when DB not available)
    try {
      const uploadsPath = require('path').join(__dirname, '..', '..', 'uploads', 'reports.json');
      if (require('fs').existsSync(uploadsPath)) {
        const localReports = JSON.parse(require('fs').readFileSync(uploadsPath));
        // Simple keyword match scoring between message and report title/description
        const tokens = String(message).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        const scored = localReports.map(r => {
          const hay = ((r.title || '') + ' ' + (r.description || '')).toLowerCase();
          let score = 0;
          for (const t of tokens) {
            if (hay.includes(t)) score += 1;
          }
          return { report: r, score };
        }).filter(s => s.score > 0).sort((a,b) => b.score - a.score).slice(0,5);

        if (scored.length > 0) {
          activeReportsText += '\nNearby Community Reports (matching query):\n' + scored.map(s => `- ${s.report.title} (${s.report.location ? JSON.stringify(s.report.location) : 'unspecified'}) - ${s.report.severity}`).join('\n') + '\n';
        }
      }
    } catch (e) {
      // don't block chat if local report indexing fails
      console.warn('Local report RAG augmentation failed:', e.message);
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // Restrict chatbot to coastal domain only. Quick classifier: if user query doesn't mention coastal topics, politely decline.
    const coastalKeywords = ['coast', 'coastal', 'ocean', 'sea', 'marine', 'wave', 'tide', 'mangrove', 'erosion', 'flood', 'buoy', 'current', 'salinity', 'pollution', 'beach', 'harbor', 'port', 'swell', 'surge', 'storm', 'satellite'];
    const lowerMsg = String(message || '').toLowerCase();
    const isCoastalQuery = coastalKeywords.some(k => lowerMsg.includes(k));
    if (!isCoastalQuery && lowerMsg.trim().length > 0) {
      return res.json({
        status: 'declined',
        message: "I can only provide information about coastal monitoring, marine conditions, coastal hazards, and related topics. Please rephrase your question to be about oceans, coasts, buoys, tides, waves, mangroves, or coastal reports."
      });
    }

    // Try vector RAG using lightweight local embeddings table if available
    const useVectorRAG = true;
        try {
          // helper for simple embedding (must match ingestion script)
          const simpleEmbedding = (text, dim = 64) => {
            const vec = new Array(dim).fill(0);
            const tokens = String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
            tokens.forEach((t, idx) => {
              const h = Array.from(t).reduce((a,c)=>a+c.charCodeAt(0),0);
              vec[idx % dim] += (h % 100) / 100.0;
            });
            const norm = Math.sqrt(vec.reduce((s,v)=>s+v*v,0)) || 1;
            return vec.map(v=>v / norm);
          };

          // Check if embeddings table exists
          const tableExists = await prisma.$queryRaw`SELECT to_regclass('public."ReportEmbeddingVector"') IS NOT NULL as exists`;
          if (tableExists && tableExists.length && tableExists[0].exists) {
            // compute query embedding
            const qemb = simpleEmbedding(message, 64);
            // fetch all embeddings
            const rows = await prisma.$queryRaw`SELECT "reportId" as report_id, embedding FROM "ReportEmbeddingVector"`;
            // compute cosine similarity in JS
            const scored = rows.map(r => {
              const emb = r.embedding;
              if (!emb || emb.length !== qemb.length) return { id: r.report_id, score: 0 };
              const dot = emb.reduce((s,v,i)=>s + v * qemb[i], 0);
              const normA = Math.sqrt(emb.reduce((s,v)=>s + v*v,0)) || 1;
              const normB = Math.sqrt(qemb.reduce((s,v)=>s + v*v,0)) || 1;
              const score = dot / (normA * normB);
              return { id: r.report_id, score };
            }).sort((a,b) => b.score - a.score).slice(0,5);

            if (scored.length > 0) {
              // fetch report titles for top matches
              const ids = scored.map(s => s.id);
              const matched = await prisma.environmentalReport.findMany({ where: { id: { in: ids } }, take: 5 });
              if (matched.length) {
                activeReportsText += '\nVector-matched Reports:\n' + matched.map(m => `- [${m.reportType}] ${m.title} (${m.location || m.latitude + ',' + m.longitude}) - Severity: ${m.severity}`).join('\n') + '\n';
              }
            }
          }
        } catch (vecErr) {
          console.warn('Vector RAG check failed:', vecErr.message);
        }

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      console.log('🤖 Sending query to Google Gemini API...');

      const systemInstruction = `You are Coastal Guardian AI, a domain-specific assistant limited to coastal and marine monitoring. Only answer questions about coastal monitoring, ocean conditions, tides, waves, buoys, satellite coastal imagery, mangroves, erosion, pollution, and community reports. If the user's question is outside these topics, reply with a short sentence asking them to rephrase as a coastal question. Use RAG context provided, cite recent reports when relevant, and always include a brief safety recommendation if the user's query implies risk. Keep answers factual, concise, and do not hallucinate measurements. If you are unsure, indicate uncertainty and suggest next steps (e.g., field sampling, contacting local authorities).`;

      const promptText = `${activeReportsText ? `Live context:\n${activeReportsText}\n` : ''}User: ${message}\nRespond concisely as a coastal monitoring expert.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

      const response = await axios.post(url, {
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        // Request JSON/text output with limited length
        generationConfig: { maxOutputTokens: 512 }
      }, { timeout: 20000 });

      const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

      return res.json({ status: 'success', message: answer, mode, timestamp: new Date().toISOString() });
    }

    // Fallback: Rule-based local responder
    console.log('🔌 Gemini API key not found. Using local chatbot mapping.');
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
      answer = 'I can answer questions about coastal monitoring: currents, weather, satellite imagery, community reports, and risk analytics. Please configure a `GEMINI_API_KEY` for fully intelligent responses!';
    }

    res.json({
      status: 'success',
      message: answer,
      mode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat endpoint error:', error.message);
    res.status(500).json({ status: 'error', message: 'Chat failed', error: error.message });
  }
});

// POST /api/ai/analyze-report - Multimodal Environmental Report Analyzer
router.post('/analyze-report', async (req, res) => {
  try {
    const { imageBase64, imagePath, reportText = '' } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;

    let base64Data = imageBase64;
    let mimeType = 'image/jpeg';

    if (imagePath && fs.existsSync(imagePath)) {
      base64Data = fs.readFileSync(imagePath).toString('base64');
      const ext = path.extname(imagePath).toLowerCase();
      mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    }

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && base64Data) {
      console.log('🤖 Sending multimodal image analysis request to Gemini...');
      
      const prompt = `Analyze this image of a coastal, marine, or shoreline environment. 
      Analyze the details alongside the user description: "${reportText}".
      
      Detect if any of the following issues are visible or described:
      - "water_pollution"
      - "illegal_dumping"
      - "mangrove_destruction"
      - "flood_risks"
      - "coastal_damage"
      - "water_stagnation"
      - "garbage_accumulation"
      
      Determine a severityScore (from 0 to 100, where 0 is pristine and 100 is immediate emergency).
      Formulate a detailed suggestedAction for safety or clean-up crews.
      Write a concise analysisSummary of your findings.
      
      Format your response EXACTLY as a valid JSON object matching this structure:
      {
        "severityScore": 75,
        "detectedIssues": ["water_pollution", "garbage_accumulation"],
        "suggestedAction": "Deploy immediate containment barriers and schedule clean-up crews.",
        "analysisSummary": "Visible garbage piles and dark water runoff observed near the shoreline."
      }`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

      const response = await axios.post(url, {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }, { timeout: 20000 });

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          success: true,
          analysis: {
            severityScore: parsed.severityScore || 50,
            detectedIssues: parsed.detectedIssues || [],
            suggestedAction: parsed.suggestedAction || 'Monitor and report any secondary indicators.',
            analysisSummary: parsed.analysisSummary || 'Image successfully analyzed by Gemini.'
          }
        });
      }
    }

    // Fallback: Rule-based analysis if Gemini or image is missing
    console.log('🔌 Gemini API key or image data missing. Using text-based rule analysis.');
    const detectedIssues = [];
    const textLower = reportText.toLowerCase();

    if (textLower.includes('pollut') || textLower.includes('chemical') || textLower.includes('oil')) {
      detectedIssues.push('water_pollution');
    }
    if (textLower.includes('dump') || textLower.includes('trash') || textLower.includes('waste')) {
      detectedIssues.push('illegal_dumping');
    }
    if (textLower.includes('mangrove') || textLower.includes('deforest') || textLower.includes('cutting')) {
      detectedIssues.push('mangrove_destruction');
    }
    if (textLower.includes('flood') || textLower.includes('water rise') || textLower.includes('submerg')) {
      detectedIssues.push('flood_risks');
    }
    if (textLower.includes('stagnant') || textLower.includes('smell') || textLower.includes('mosquito')) {
      detectedIssues.push('water_stagnation');
    }
    if (textLower.includes('garbage') || textLower.includes('plastic') || textLower.includes('debris')) {
      detectedIssues.push('garbage_accumulation');
    }

    let severityScore = 20;
    if (detectedIssues.length > 0) {
      severityScore = Math.min(100, detectedIssues.length * 25);
    }

    const suggestions = {
      water_pollution: 'Avoid contact with water. Notify maritime department.',
      illegal_dumping: 'Do not approach dump site. Log coordinates and contact local authorities.',
      mangrove_destruction: 'Report illegal tree clearing or dredging to forestry division.',
      flood_risks: 'Secure household equipment. Prepare to move to high elevation.',
      water_stagnation: 'Apply biological larvicide and clear blockages in tidal channels.',
      garbage_accumulation: 'Organize a community cleanup or schedule municipal collection.'
    };

    const action = detectedIssues.map(issue => suggestions[issue]).join(' ') || 'Regular coastal surveillance suggested.';

    res.json({
      success: true,
      analysis: {
        severityScore,
        detectedIssues,
        suggestedAction: action,
        analysisSummary: detectedIssues.length > 0 
          ? `Text analysis flagged the following indicators: ${detectedIssues.join(', ')}.`
          : 'Surveillance report contains typical coastal baselines.'
      }
    });

  } catch (error) {
    console.error('Image analysis endpoint error:', error.message);
    res.status(500).json({ success: false, message: 'AI Analysis failed', error: error.message });
  }
});

// POST /api/ai/questionnaire/submit - Survey submit & score
router.post('/questionnaire/submit', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) {
      return res.status(400).json({ status: 'error', message: 'Answers are required' });
    }

    // 1. Calculate a deterministic safety vulnerability score (0 to 100)
    let score = 0;
    
    // Proximity to shoreline (0 to 25 points)
    const proximity = Number(answers.proximity);
    if (proximity < 100) score += 25;
    else if (proximity < 500) score += 15;
    else if (proximity < 1000) score += 5;

    // Elevation (0 to 25 points)
    const elevation = Number(answers.elevation);
    if (elevation < 2) score += 25;
    else if (elevation < 5) score += 15;
    else if (elevation < 10) score += 5;

    // Slope type (0 to 10 points)
    if (answers.slope === 'steep') score += 10;
    else if (answers.slope === 'moderate') score += 5;

    // Natural barriers (absence adds to threat score: 0 to 20 points)
    if (!answers.mangroves) score += 8;
    if (!answers.reefs) score += 6;
    if (!answers.dunes) score += 6;

    // Human defences (0 to 10 points)
    if (answers.defenses === 'none') score += 10;
    else if (answers.defenses === 'breakwater') score += 6;
    else if (answers.defenses === 'seawall') score += 3;

    // Flooding history (0 to 10 points)
    if (answers.floodHistory === 'frequent') score += 10;
    else if (answers.floodHistory === 'seasonal') score += 7;
    else if (answers.floodHistory === 'rare') score += 3;

    // Erosion history (0 to 10 points)
    if (answers.erosionHistory === 'rapid') score += 10;
    else if (answers.erosionHistory === 'slow') score += 5;

    // Adjust for preparedness plan (-10 mitigation credit)
    if (answers.preparedness) {
      score = Math.max(0, score - 10);
    }

    // Ensure score is capped at 100
    score = Math.min(100, score);

    // Determine Risk Level
    let riskLevel = 'Low';
    if (score >= 75) riskLevel = 'Critical';
    else if (score >= 50) riskLevel = 'High';
    else if (score >= 25) riskLevel = 'Moderate';

    // 2. Generate AI recommendation and assessment
    let assessment = '';
    let recommendations = [];

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      try {
        console.log('🤖 Invoking Gemini to analyze coastal questionnaire...');
        const prompt = `Analyze this coastal vulnerability survey and respond with a JSON object.
        - Distance to shoreline: ${proximity} meters
        - Elevation: ${elevation} meters above sea level
        - Terrain slope: ${answers.slope}
        - Mangroves present: ${answers.mangroves ? 'Yes' : 'No'}
        - Coral reefs present: ${answers.reefs ? 'Yes' : 'No'}
        - Sand dunes present: ${answers.dunes ? 'Yes' : 'No'}
        - Man-made defense: ${answers.defenses}
        - Household preparedness plan: ${answers.preparedness ? 'Yes' : 'No'}
        - Local shelter access: ${answers.shelterAccess ? 'Yes' : 'No'}
        - Flooding history: ${answers.floodHistory}
        - Erosion history: ${answers.erosionHistory}
        - Computed Risk Score: ${score}/100
        - Risk Level: ${riskLevel}

        Formulate 1 paragraph of customized scientific vulnerability assessment, and exactly 3 highly specific recommendations. 
        Each recommendation must have a 'title', a detailed 'description', and a 'category' ('infrastructure', 'community', or 'natural_barriers').
        Format your response EXACTLY as a valid JSON object matching this structure:
        {
          "assessment": "Detailed assessment text here...",
          "recommendations": [
            { "title": "Recommendation 1", "description": "Details...", "category": "category" },
            { "title": "Recommendation 2", "description": "Details...", "category": "category" },
            { "title": "Recommendation 3", "description": "Details...", "category": "category" }
          ]
        }`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const response = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        }, { timeout: 15000 });

        const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          assessment = parsed.assessment;
          recommendations = parsed.recommendations;
        }
      } catch (err) {
        console.warn('Gemini questionnaire analysis failed, using fallback generator:', err.message);
      }
    }

    // 3. Fallback to pre-defined templates if Gemini fails or is missing
    if (!assessment || recommendations.length === 0) {
      if (riskLevel === 'Critical' || riskLevel === 'High') {
        assessment = `Your coastal site shows high vulnerability due to low elevation (${elevation}m) and close proximity to the shore (${proximity}m). The absence of robust natural protections increases hazard risks from storms and tides.`;
        recommendations = [
          {
            title: 'Deploy Engineered Defense Measures',
            description: 'Consider building or reinforcing seawalls, revetments, or breakwaters to absorb wave impact.',
            category: 'infrastructure'
          },
          {
            title: 'Restore Local Mangrove Habitats',
            description: 'Re-establish native mangrove belts or wetland vegetation along the tidal flats to reduce storm surge impacts.',
            category: 'natural_barriers'
          },
          {
            title: 'Establish Community Evacuation Protocols',
            description: 'Conduct emergency drills and mapping exercises with local leaders to coordinate rapid storm exits.',
            category: 'community'
          }
        ];
      } else {
        assessment = `Your coastal site maintains a moderate to safe status. Elevated location (${elevation}m) and adequate barriers shield the area from average wave energies.`;
        recommendations = [
          {
            title: 'Monitor High-Tide Erosion Rates',
            description: 'Set up seasonal measuring posts to track sand and soil movement along the coast.',
            category: 'infrastructure'
          },
          {
            title: 'Implement Dune Stabilization',
            description: 'Plant native grass species to anchor existing sand dunes and prevent wind-driven erosion.',
            category: 'natural_barriers'
          },
          {
            title: 'Draft Family Response Manuals',
            description: 'Distribute disaster response kits and resource list guidelines to all local households.',
            category: 'community'
          }
        ];
      }
    }

    // 4. Save to Database using Prisma
    const questionnaire = await prisma.questionnaire.create({
      data: {
        id: require('crypto').randomUUID(),
        userId: req.user.userId,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
        score,
        riskLevel,
        assessment,
        recommendations: JSON.stringify(recommendations)
      }
    });

    // Format output
    questionnaire.answers = JSON.parse(questionnaire.answers);
    questionnaire.recommendations = JSON.parse(questionnaire.recommendations);

    res.status(201).json({ status: 'success', data: questionnaire });

  } catch (error) {
    console.error('Questionnaire submit error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to process assessment', error: error.message });
  }
});

// GET /api/ai/questionnaire/history - Fetch survey history
router.get('/questionnaire/history', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.questionnaire.findMany({
      where: { userId: req.user.userId }
    });
    
    res.json({ status: 'success', data: history });
  } catch (error) {
    console.error('History fetch error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch assessment history', error: error.message });
  }
});

module.exports = router;
