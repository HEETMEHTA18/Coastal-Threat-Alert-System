// Enhanced NOAA API Service with your API token
// backend/services/noaaService.js

const axios = require('axios');
const xml2js = require('xml2js');

class NOAAService {
  constructor() {
    this.baseURL = 'https://tidesandcurrents.noaa.gov/api/datagetter';
    this.apiToken = process.env.NOAA_API_KEY; // caWAvqgssoThmindCpCOzjFDMKNkzvqq
    this.weatherBaseURL = 'https://www.ncdc.noaa.gov/cdo-web/api/v2';
    
    // Enhanced station list with your token access
    this.stations = {
      // Current monitoring stations
      'cb0102': { 
        name: 'Cape Henry LB 2CH', 
        lat: 36.9594, 
        lon: -76.0128, 
        type: 'current',
        region: 'Chesapeake Bay',
        products: ['currents', 'water_level', 'water_temperature']
      },
      'cb0201': { 
        name: 'Chesapeake Bay Bridge Tunnel', 
        lat: 36.9667, 
        lon: -76.1167, 
        type: 'current',
        region: 'Chesapeake Bay',
        products: ['currents', 'water_level']
      },
      
      // Water level stations (tide gauges)
      '8518750': { 
        name: 'The Battery, NY', 
        lat: 40.7000, 
        lon: -74.0142, 
        type: 'water_level',
        region: 'New York Harbor',
        products: ['water_level', 'predictions', 'air_temperature', 'water_temperature', 'wind']
      },
      '8570283': { 
        name: 'Sewells Point, VA', 
        lat: 36.9467, 
        lon: -76.3300, 
        type: 'water_level',
        region: 'Chesapeake Bay',
        products: ['water_level', 'predictions', 'currents', 'water_temperature']
      },
      '8723214': { 
        name: 'Virginia Key, FL', 
        lat: 25.7317, 
        lon: -80.1583, 
        type: 'water_level',
        region: 'South Florida',
        products: ['water_level', 'predictions', 'water_temperature', 'air_temperature']
      },
      
      // Meteorological stations
      'DRYF1': { 
        name: 'Dry Tortugas, FL', 
        lat: 24.6280, 
        lon: -82.9200, 
        type: 'meteorological',
        region: 'Florida Keys',
        products: ['air_temperature', 'barometric_pressure', 'wind', 'visibility']
      }
    };
  }

  // Build API request with authentication
  buildRequest(product, stationId, options = {}) {
    const station = this.stations[stationId];
    if (!station) {
      throw new Error(`Unknown station: ${stationId}`);
    }

    if (!station.products.includes(product)) {
      throw new Error(`Station ${stationId} does not support product: ${product}`);
    }

    const params = {
      product: product,
      application: 'CTAS_Coastal_Monitoring',
      station: stationId,
      time_zone: options.timeZone || 'GMT',
      units: options.units || 'metric',
      format: options.format || 'json',
      ...options
    };

    // Add your API token for enhanced access
    if (this.apiToken && this.apiToken !== 'your_noaa_token_here') {
      params.token = this.apiToken;
    }

    // Add date range if provided
    if (options.startDate && options.endDate) {
      params.begin_date = options.startDate;
      params.end_date = options.endDate;
    } else if (options.hoursBack) {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (options.hoursBack * 60 * 60 * 1000));
      params.begin_date = this.formatDate(startTime);
      params.end_date = this.formatDate(endTime);
    }

    return params;
  }

  formatDate(date) {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }

  // Get current data (your Cape Henry example)
  async getCurrentData(stationId = 'cb0102', hoursBack = 24) {
    try {
      const params = this.buildRequest('currents', stationId, { hoursBack });
      const response = await axios.get(this.baseURL, { params });
      
      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return this.parseCurrentData(response.data, stationId);
    } catch (error) {
      console.error('Error fetching current data:', error);
      throw error;
    }
  }

  // Get water level data (tide information)
  async getWaterLevelData(stationId = '8518750', hoursBack = 24) {
    try {
      const params = this.buildRequest('water_level', stationId, { hoursBack });
      const response = await axios.get(this.baseURL, { params });
      
      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return this.parseWaterLevelData(response.data, stationId);
    } catch (error) {
      console.error('Error fetching water level data:', error);
      throw error;
    }
  }

  // Get meteorological data
  async getMeteorologicalData(stationId = 'DRYF1', hoursBack = 24) {
    try {
      const weatherParams = this.buildRequest('air_temperature', stationId, { hoursBack });
      const windParams = this.buildRequest('wind', stationId, { hoursBack });
      const pressureParams = this.buildRequest('barometric_pressure', stationId, { hoursBack });

      const [tempResponse, windResponse, pressureResponse] = await Promise.allSettled([
        axios.get(this.baseURL, { params: weatherParams }),
        axios.get(this.baseURL, { params: windParams }),
        axios.get(this.baseURL, { params: pressureParams })
      ]);

      return this.parseMeteorologicalData({
        temperature: tempResponse.status === 'fulfilled' ? tempResponse.value.data : null,
        wind: windResponse.status === 'fulfilled' ? windResponse.value.data : null,
        pressure: pressureResponse.status === 'fulfilled' ? pressureResponse.value.data : null
      }, stationId);
    } catch (error) {
      console.error('Error fetching meteorological data:', error);
      throw error;
    }
  }

  // Get comprehensive station data
  async getStationData(stationId, hoursBack = 24) {
    const station = this.stations[stationId];
    if (!station) {
      throw new Error(`Unknown station: ${stationId}`);
    }

    const results = {
      station_info: station,
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Fetch available products for this station
    const promises = station.products.map(async (product) => {
      try {
        const params = this.buildRequest(product, stationId, { hoursBack });
        const response = await axios.get(this.baseURL, { params });
        return { product, data: response.data };
      } catch (error) {
        console.warn(`Failed to fetch ${product} for station ${stationId}:`, error.message);
        return { product, data: null, error: error.message };
      }
    });

    const responses = await Promise.allSettled(promises);
    
    responses.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { product, data, error } = result.value;
        results.data[product] = error ? { error } : this.parseProductData(product, data, stationId);
      }
    });

    return results;
  }

  // Parse current data
  parseCurrentData(data, stationId) {
    if (!data.data || !Array.isArray(data.data)) {
      return { observations: [], analysis: null };
    }

    const observations = data.data.map(item => ({
      timestamp: item.t,
      speed_knots: parseFloat(item.s),
      speed_ms: parseFloat(item.s) * 0.514444,
      direction_degrees: parseFloat(item.d),
      bin_depth: parseInt(item.b || 1)
    }));

    return {
      station_id: stationId,
      station_info: this.stations[stationId],
      observations,
      analysis: this.analyzeCurrentData(observations)
    };
  }

  // Parse water level data
  parseWaterLevelData(data, stationId) {
    if (!data.data || !Array.isArray(data.data)) {
      return { observations: [], analysis: null };
    }

    const observations = data.data.map(item => ({
      timestamp: item.t,
      water_level: parseFloat(item.v),
      quality: item.q || 'v' // v=verified, p=preliminary
    }));

    return {
      station_id: stationId,
      station_info: this.stations[stationId],
      observations,
      analysis: this.analyzeWaterLevelData(observations)
    };
  }

  // Parse meteorological data
  parseMeteorologicalData(dataSet, stationId) {
    const parsed = {
      station_id: stationId,
      station_info: this.stations[stationId],
      observations: []
    };

    // Combine all meteorological data by timestamp
    const timeMap = new Map();

    // Process temperature data
    if (dataSet.temperature?.data) {
      dataSet.temperature.data.forEach(item => {
        const timestamp = item.t;
        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, { timestamp });
        }
        timeMap.get(timestamp).air_temperature = parseFloat(item.v);
      });
    }

    // Process wind data
    if (dataSet.wind?.data) {
      dataSet.wind.data.forEach(item => {
        const timestamp = item.t;
        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, { timestamp });
        }
        timeMap.get(timestamp).wind_speed = parseFloat(item.s);
        timeMap.get(timestamp).wind_direction = parseFloat(item.d);
        timeMap.get(timestamp).wind_gust = parseFloat(item.g);
      });
    }

    // Process pressure data
    if (dataSet.pressure?.data) {
      dataSet.pressure.data.forEach(item => {
        const timestamp = item.t;
        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, { timestamp });
        }
        timeMap.get(timestamp).barometric_pressure = parseFloat(item.v);
      });
    }

    parsed.observations = Array.from(timeMap.values()).sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    return parsed;
  }

  // Generic product data parser
  parseProductData(product, data, stationId) {
    switch (product) {
      case 'currents':
        return this.parseCurrentData(data, stationId);
      case 'water_level':
        return this.parseWaterLevelData(data, stationId);
      case 'air_temperature':
      case 'wind':
      case 'barometric_pressure':
        return { product, data: data.data || [] };
      default:
        return { product, raw_data: data };
    }
  }

  // Analyze current data for threats
  analyzeCurrentData(observations) {
    if (!observations || observations.length === 0) {
      return null;
    }

    const speeds = observations.map(obs => obs.speed_ms);
    const latest = observations[observations.length - 1];
    
    const stats = {
      mean_speed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
      max_speed: Math.max(...speeds),
      min_speed: Math.min(...speeds),
      current_speed: latest.speed_ms,
      current_direction: latest.direction_degrees
    };

    // Threat assessment
    const threats = {
      rip_current: stats.current_speed > 1.0 ? 'high' : stats.current_speed > 0.6 ? 'moderate' : 'low',
      navigation: stats.current_speed > 1.5 ? 'high' : stats.current_speed > 1.0 ? 'moderate' : 'low',
      erosion: stats.max_speed > 1.2 ? 'high' : stats.mean_speed > 0.7 ? 'moderate' : 'low',
      pollution_transport: stats.current_speed > 0.8 ? 'high' : stats.current_speed > 0.5 ? 'moderate' : 'low'
    };

    return { statistics: stats, threats, data_points: observations.length };
  }

  // Analyze water level data
  analyzeWaterLevelData(observations) {
    if (!observations || observations.length === 0) {
      return null;
    }

    const levels = observations.map(obs => obs.water_level);
    const latest = observations[observations.length - 1];
    
    const stats = {
      mean_level: levels.reduce((a, b) => a + b, 0) / levels.length,
      max_level: Math.max(...levels),
      min_level: Math.min(...levels),
      current_level: latest.water_level,
      range: Math.max(...levels) - Math.min(...levels)
    };

    // Simple trend analysis
    const recentLevels = levels.slice(-6); // Last 6 measurements
    const trend = recentLevels[recentLevels.length - 1] - recentLevels[0];
    
    return { 
      statistics: stats, 
      trend: trend > 0.1 ? 'rising' : trend < -0.1 ? 'falling' : 'stable',
      tidal_range: stats.range,
      data_points: observations.length 
    };
  }

  // Get available stations
  getStations() {
    return Object.entries(this.stations).map(([id, info]) => ({
      id,
      ...info
    }));
  }

  // Test API connectivity with your token
  async testConnection() {
    try {
      const params = {
        product: 'water_level',
        application: 'CTAS_Test',
        station: '8518750', // The Battery, NY - reliable station
        date: 'latest',
        time_zone: 'GMT',
        units: 'metric',
        format: 'json'
      };

      if (this.apiToken && this.apiToken !== 'your_noaa_token_here') {
        params.token = this.apiToken;
      }

      const response = await axios.get(this.baseURL, { params });
      
      return {
        success: true,
        authenticated: !!this.apiToken,
        api_token_used: !!params.token,
        station_responded: !!response.data.data,
        response_size: response.data.data?.length || 0,
        test_timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        authenticated: !!this.apiToken,
        test_timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new NOAAService();
