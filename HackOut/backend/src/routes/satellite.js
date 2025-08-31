const express = require('express');
const NASAEarthDataService = require('../services/nasaEarthDataService');
const router = express.Router();

// Initialize NASA service
let nasaService;
try {
  nasaService = new NASAEarthDataService(process.env.NASA_EARTHDATA_TOKEN);
} catch (error) {
  console.error('⚠️ NASA Earth Data service not available:', error.message);
  nasaService = null;
}

// Test NASA API connection
router.get('/test-nasa', async (req, res) => {
  try {
    if (!nasaService) {
      return res.status(503).json({
        status: 'error',
        message: 'NASA Earth Data service not initialized',
        suggestion: 'Check NASA_EARTHDATA_TOKEN in environment variables'
      });
    }

    const testResult = await nasaService.testConnection();
    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search satellite data
router.get('/search', async (req, res) => {
  try {
    const { lat, lon, startDate, endDate, maxResults = 10 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    if (nasaService) {
      const satelliteData = await nasaService.searchSatelliteData({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        startDate,
        endDate,
        maxResults: parseInt(maxResults)
      });
      
      res.json(satelliteData);
    } else {
      // Fallback to mock data
      const mockData = {
        status: 'success',
        totalResults: 5,
        data: [
          {
            id: 'mock-satellite-1',
            title: 'MODIS/Terra Surface Reflectance',
            summary: 'Mock satellite data for coastal monitoring',
            updated: new Date().toISOString(),
            coordinates: {
              center: { lat: parseFloat(lat), lon: parseFloat(lon) }
            },
            cloudCover: Math.floor(Math.random() * 30),
            dataFormat: 'HDF',
            size: '250 MB'
          }
        ],
        source: 'mock-fallback'
      };
      
      res.json(mockData);
    }
  } catch (error) {
    console.error('Satellite search error:', error);
    res.status(500).json({ 
      error: 'Failed to search satellite data',
      details: error.message 
    });
  }
});

// @route   GET /api/satellite/imagery
// @desc    Get satellite imagery data
// @access  Public
router.get('/imagery', async (req, res) => {
  try {
    const { lat, lon, zoom = 10 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // Mock satellite imagery data (enhanced)
    const mockImageryData = {
      coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
      zoom: parseInt(zoom),
      tileUrl: `https://api.satellite-provider.com/tiles/${zoom}/${lat}/${lon}`,
      timestamp: new Date().toISOString(),
      resolution: '10m',
      cloudCover: Math.floor(Math.random() * 30),
      quality: 'high',
      bands: ['RGB', 'NIR', 'SWIR'],
      metadata: {
        satellite: 'Sentinel-2',
        acquisitionDate: new Date().toISOString().split('T')[0],
        processingLevel: 'L2A'
      },
      nasaAvailable: !!nasaService
    };

    res.json({
      status: 'success',
      data: mockImageryData
    });
  } catch (error) {
    console.error('Satellite imagery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch satellite imagery',
      details: error.message 
    });
  }
});

// Landsat data endpoint
router.get('/landsat', async (req, res) => {
  try {
    const { lat, lon, date } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    if (nasaService) {
      const landsatData = await nasaService.getLandsatData({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        date
      });
      
      res.json(landsatData);
    } else {
      // Mock Landsat data fallback
      const mockLandsatData = {
        status: 'success',
        data: {
          coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
          acquisitionDate: date || new Date().toISOString().split('T')[0],
          scene: 'LC08_L1TP_147047_20240829_20240829_02_T1',
          cloudCover: Math.floor(Math.random() * 30),
          bands: {
            'band1': 'Coastal Aerosol',
            'band2': 'Blue',
            'band3': 'Green',
            'band4': 'Red',
            'band5': 'Near Infrared (NIR)',
            'band6': 'Shortwave Infrared (SWIR) 1',
            'band7': 'Shortwave Infrared (SWIR) 2'
          },
          downloadUrl: 'https://earthexplorer.usgs.gov/download/...',
          fileSize: '1.2 GB',
          format: 'GeoTIFF',
          source: 'mock-fallback'
        }
      };
      
      res.json(mockLandsatData);
    }
  } catch (error) {
    console.error('Landsat data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Landsat data',
      details: error.message 
    });
  }
});

// Ocean data endpoint with NASA integration
router.get('/ocean', async (req, res) => {
  try {
    const { lat, lon, startDate, endDate } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    if (nasaService) {
      const oceanData = await nasaService.getOceanData({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        startDate,
        endDate
      });
      
      res.json(oceanData);
    } else {
      // Mock ocean data fallback
      const mockOceanData = {
        status: 'success',
        data: {
          coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
          seaSurfaceTemperature: 26.5 + (Math.random() - 0.5) * 4,
          chlorophyllConcentration: Math.random() * 2,
          oceanColor: ['blue', 'blue-green', 'green'][Math.floor(Math.random() * 3)],
          salinity: 35 + (Math.random() - 0.5) * 2,
          waveHeight: Math.random() * 3,
          currentSpeed: Math.random() * 1.5,
          timestamp: new Date().toISOString(),
          satellite: 'MODIS Aqua (Mock)',
          dataQuality: 'simulated',
          source: 'mock-fallback'
        }
      };
      
      res.json(mockOceanData);
    }
  } catch (error) {
    console.error('Ocean data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ocean data',
      details: error.message 
    });
  }
});

module.exports = router;
