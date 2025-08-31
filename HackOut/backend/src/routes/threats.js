const express = require('express');
const aiService = require('../services/aiService');
const router = express.Router();

// @route   GET /api/threats/current
// @desc    Get current threat assessment
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const { lat = 19.0760, lon = 72.8777 } = req.query;
    
    // TODO: Implement AI threat assessment
    const threats = {
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      overallRisk: 'moderate',
      threats: [
        {
          type: 'coastal_flooding',
          severity: 3,
          probability: 0.4,
          description: 'Moderate risk of coastal flooding due to high tide'
        },
        {
          type: 'erosion',
          severity: 2,
          probability: 0.3,
          description: 'Low to moderate erosion risk'
        }
      ],
      timestamp: new Date().toISOString(),
      source: 'ai-assessment'
    };
    
    res.json({
      status: 'success',
      data: threats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/threats/assessment/:stationId
// @desc    Get threat assessment for specific station
// @access  Public
router.get('/assessment/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const assessment = {
      stationId,
      station: {
        id: stationId,
        name: `Station ${stationId}`,
        location: 'Cape Henry Area'
      },
      threats: [
        {
          type: 'coastal_flooding',
          severity: 2,
          probability: 0.3,
          description: `Moderate coastal flooding risk for station ${stationId}`
        },
        {
          type: 'storm_surge',
          severity: 3,
          probability: 0.4,
          description: 'Elevated storm surge potential'
        }
      ],
      overallRisk: 'moderate',
      timestamp: new Date().toISOString(),
      source: 'station-specific-assessment'
    };
    
    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/threats/ai-predict
// @desc    Get AI-powered threat predictions
// @access  Public
router.post('/ai-predict', async (req, res) => {
  try {
    const environmentalData = req.body;
    
    // Run AI ensemble prediction
    const prediction = await aiService.runEnsemblePrediction(environmentalData);
    
    if (prediction.status === 'success') {
      res.json({
        status: 'success',
        data: prediction.ensemble,
        message: 'AI threat prediction completed'
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'AI service unavailable',
        error: prediction.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/threats/coastal-prediction
// @desc    Predict specific coastal threats using AI
// @access  Public
router.post('/coastal-prediction', async (req, res) => {
  try {
    const environmentalData = req.body;
    
    const prediction = await aiService.predictCoastalThreats(environmentalData);
    
    if (prediction.status === 'success') {
      res.json({
        status: 'success',
        data: prediction.prediction,
        message: 'Coastal threat prediction completed'
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Failed to predict coastal threats',
        error: prediction.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/threats/algal-bloom
// @desc    Predict algal bloom using AI
// @access  Public
router.post('/algal-bloom', async (req, res) => {
  try {
    const waterQualityData = req.body;
    
    const prediction = await aiService.predictAlgalBloom(waterQualityData);
    
    if (prediction.status === 'success') {
      res.json({
        status: 'success',
        data: prediction.prediction,
        message: 'Algal bloom prediction completed'
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Failed to predict algal bloom',
        error: prediction.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/threats/mangrove-health
// @desc    Assess mangrove ecosystem health using AI
// @access  Public
router.post('/mangrove-health', async (req, res) => {
  try {
    const ecosystemData = req.body;
    
    const assessment = await aiService.assessMangroveHealth(ecosystemData);
    
    if (assessment.status === 'success') {
      res.json({
        status: 'success',
        data: assessment.assessment,
        message: 'Mangrove health assessment completed'
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Failed to assess mangrove health',
        error: assessment.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/threats/ai-status
// @desc    Get AI models status
// @access  Public
router.get('/ai-status', async (req, res) => {
  try {
    const status = await aiService.getModelStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/threats/history
// @desc    Get threat history
// @access  Public
router.get('/history', async (req, res) => {
  try {
    // TODO: Implement threat history
    res.json({
      status: 'success',
      data: [],
      message: 'Threat history endpoint - coming soon'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
