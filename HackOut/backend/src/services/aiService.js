const axios = require('axios');

class AIService {
  constructor() {
    this.aiServiceURL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Test AI service connection
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.aiServiceURL}/health`, {
        timeout: this.timeout
      });
      return {
        status: 'success',
        data: response.data,
        message: 'AI service is operational'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'AI service unavailable',
        error: error.message
      };
    }
  }

  /**
   * Predict coastal threats using AI model
   * @param {Object} environmentalData - Environmental sensor data
   * @returns {Promise<Object>} Threat prediction results
   */
  async predictCoastalThreats(environmentalData) {
    try {
      const payload = {
        wave_height: environmentalData.waveHeight || 1.5,
        wind_speed: environmentalData.windSpeed || 15,
        atmospheric_pressure: environmentalData.pressure || 1013,
        tide_level: environmentalData.tideLevel || 0,
        water_temperature: environmentalData.waterTemp || 25,
        rainfall_24h: environmentalData.rainfall || 10,
        storm_distance: environmentalData.stormDistance || 1000,
        moon_phase: environmentalData.moonPhase || 0.5,
        season: environmentalData.season || 1,
        coastal_elevation: environmentalData.elevation || 5,
        vegetation_cover: environmentalData.vegetation || 0.6,
        human_population: environmentalData.population || 10000
      };

      const response = await axios.post(
        `${this.aiServiceURL}/predict/coastal-threat`,
        payload,
        { timeout: this.timeout }
      );

      return {
        status: 'success',
        prediction: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Coastal threat prediction failed:', error.message);
      return {
        status: 'error',
        message: 'Failed to predict coastal threats',
        error: error.message
      };
    }
  }

  /**
   * Assess mangrove ecosystem health using AI
   * @param {Object} ecosystemData - Ecosystem monitoring data
   * @returns {Promise<Object>} Health assessment results
   */
  async assessMangroveHealth(ecosystemData) {
    try {
      const payload = {
        ndvi: ecosystemData.ndvi || 0.7,
        chlorophyll: ecosystemData.chlorophyll || 10,
        water_temp: ecosystemData.waterTemp || 27,
        salinity: ecosystemData.salinity || 35,
        turbidity: ecosystemData.turbidity || 5,
        rainfall: ecosystemData.rainfall || 100,
        tidal_range: ecosystemData.tidalRange || 1.5,
        distance_to_shore: ecosystemData.distanceToShore || 1,
        human_activity_index: ecosystemData.humanActivity || 30
      };

      const response = await axios.post(
        `${this.aiServiceURL}/predict/mangrove-health`,
        payload,
        { timeout: this.timeout }
      );

      return {
        status: 'success',
        assessment: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Mangrove health assessment failed:', error.message);
      return {
        status: 'error',
        message: 'Failed to assess mangrove health',
        error: error.message
      };
    }
  }

  /**
   * Predict algal bloom occurrence
   * @param {Object} waterQualityData - Water quality measurements
   * @returns {Promise<Object>} Bloom prediction results
   */
  async predictAlgalBloom(waterQualityData) {
    try {
      const payload = {
        water_temperature: waterQualityData.temperature || 25,
        chlorophyll_a: waterQualityData.chlorophyll || 8,
        dissolved_oxygen: waterQualityData.oxygen || 7,
        ph_level: waterQualityData.ph || 8.1,
        turbidity: waterQualityData.turbidity || 5,
        nitrate_nitrogen: waterQualityData.nitrates || 2,
        phosphate_phosphorus: waterQualityData.phosphates || 0.5,
        salinity: waterQualityData.salinity || 35,
        solar_radiation: waterQualityData.solarRadiation || 300,
        wind_speed: waterQualityData.windSpeed || 8,
        rainfall_7d: waterQualityData.rainfall7d || 15,
        water_depth: waterQualityData.depth || 20,
        current_velocity: waterQualityData.currentVelocity || 0.3,
        upwelling_index: waterQualityData.upwelling || 0,
        sea_surface_height: waterQualityData.seaHeight || 0,
        human_activity_index: waterQualityData.humanActivity || 30
      };

      const response = await axios.post(
        `${this.aiServiceURL}/predict/algal-bloom`,
        payload,
        { timeout: this.timeout }
      );

      return {
        status: 'success',
        prediction: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Algal bloom prediction failed:', error.message);
      return {
        status: 'error',
        message: 'Failed to predict algal bloom',
        error: error.message
      };
    }
  }

  /**
   * Run ensemble prediction using multiple AI models
   * @param {Object} fullEnvironmentalData - Complete environmental dataset
   * @returns {Promise<Object>} Ensemble prediction results
   */
  async runEnsemblePrediction(fullEnvironmentalData) {
    try {
      const payload = {
        location: {
          latitude: fullEnvironmentalData.lat || 19.0760,
          longitude: fullEnvironmentalData.lon || 72.8777
        },
        environmental_data: {
          wave_height: fullEnvironmentalData.waveHeight || 1.5,
          wind_speed: fullEnvironmentalData.windSpeed || 15,
          atmospheric_pressure: fullEnvironmentalData.pressure || 1013,
          water_temperature: fullEnvironmentalData.waterTemp || 25,
          chlorophyll_a: fullEnvironmentalData.chlorophyll || 8,
          dissolved_oxygen: fullEnvironmentalData.oxygen || 7,
          ph_level: fullEnvironmentalData.ph || 8.1,
          salinity: fullEnvironmentalData.salinity || 35,
          ndvi: fullEnvironmentalData.ndvi || 0.7,
          turbidity: fullEnvironmentalData.turbidity || 5,
          rainfall_24h: fullEnvironmentalData.rainfall || 10,
          human_activity_index: fullEnvironmentalData.humanActivity || 30
        },
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.aiServiceURL}/predict/ensemble`,
        payload,
        { timeout: this.timeout }
      );

      return {
        status: 'success',
        ensemble: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Ensemble prediction failed:', error.message);
      return {
        status: 'error',
        message: 'Failed to run ensemble prediction',
        error: error.message
      };
    }
  }

  /**
   * Get AI model status and capabilities
   */
  async getModelStatus() {
    try {
      const response = await axios.get(`${this.aiServiceURL}/models/status`, {
        timeout: this.timeout
      });
      return {
        status: 'success',
        models: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to get model status',
        error: error.message
      };
    }
  }
}

module.exports = new AIService();
