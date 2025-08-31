// API Service for CTAS Frontend
// Connects to backend services for real data

const API_BASE_URL = 'http://localhost:5000/api';

class CTASApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic fetch wrapper with error handling
  async fetchAPI(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Weather Services
  async getCurrentWeather(lat = 19.0760, lon = 72.8777) {
    return this.fetchAPI(`/weather/current?lat=${lat}&lon=${lon}`);
  }

  async getForecast(lat = 19.0760, lon = 72.8777, days = 5) {
    return this.fetchAPI(`/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`);
  }

  async getWeatherAlerts(lat = 19.0760, lon = 72.8777) {
    return this.fetchAPI(`/weather/alerts?lat=${lat}&lon=${lon}`);
  }

  // NASA Satellite Services
  async testNASAConnection() {
    return this.fetchAPI('/satellite/test-nasa');
  }

  async searchSatelliteData(lat = 19.0760, lon = 72.8777, maxResults = 10) {
    return this.fetchAPI(`/satellite/search?lat=${lat}&lon=${lon}&maxResults=${maxResults}`);
  }

  async getSatelliteImagery(lat = 19.0760, lon = 72.8777, zoom = 10) {
    return this.fetchAPI(`/satellite/imagery?lat=${lat}&lon=${lon}&zoom=${zoom}`);
  }

  async getOceanData(lat = 19.0760, lon = 72.8777) {
    return this.fetchAPI(`/satellite/ocean?lat=${lat}&lon=${lon}`);
  }

  async getLandsatData(lat = 19.0760, lon = 72.8777, date = null) {
    const dateParam = date ? `&date=${date}` : '';
    return this.fetchAPI(`/satellite/landsat?lat=${lat}&lon=${lon}${dateParam}`);
  }

  // Threat Assessment Services
  async getThreatLevel(lat = 19.0760, lon = 72.8777) {
    return this.fetchAPI(`/threats/level?lat=${lat}&lon=${lon}`);
  }

  async getCoastalThreats(lat = 19.0760, lon = 72.8777) {
    return this.fetchAPI(`/threats/coastal?lat=${lat}&lon=${lon}`);
  }

  async getPrediction(lat = 19.0760, lon = 72.8777, days = 7) {
    return this.fetchAPI(`/threats/prediction?lat=${lat}&lon=${lon}&days=${days}`);
  }

  // Reports Services
  async getReports(limit = 10) {
    return this.fetchAPI(`/reports?limit=${limit}`);
  }

  async createReport(reportData) {
    return this.fetchAPI('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReportById(id) {
    return this.fetchAPI(`/reports/${id}`);
  }

  // Alert Services
  async getAlerts(limit = 10) {
    return this.fetchAPI(`/alerts?limit=${limit}`);
  }

  // Current Data Services (NOAA Real-time)
  async getCurrentData(stationId = 'cb0102', hours = 24) {
    return this.fetchAPI(`/noaa/currents/${stationId}?hours=${hours}`);
  }

  async getCurrentAnalysis(stationId = 'cb0102') {
    return this.fetchAPI(`/noaa/station/${stationId}?hours=12`);
  }

  async getAllCurrentStations() {
    return this.fetchAPI('/noaa/stations');
  }

  async getCurrentThreats(stationId = 'cb0102') {
    return this.fetchAPI(`/noaa/threats/${stationId}`);
  }

  // Enhanced NOAA Services with your API token
  async getCapeHenryData(hours = 6) {
    return this.fetchAPI(`/noaa/cape-henry?hours=${hours}`);
  }

  async getWaterLevelData(stationId = '8518750', hours = 24) {
    return this.fetchAPI(`/noaa/water-level/${stationId}?hours=${hours}`);
  }

  async getNoaaWeatherData(stationId = 'DRYF1', hours = 24) {
    return this.fetchAPI(`/noaa/weather/${stationId}?hours=${hours}`);
  }

  async testNoaaConnection() {
    return this.fetchAPI('/noaa/test');
  }

  async createAlert(alertData) {
    return this.fetchAPI('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  // User Services (for authentication)
  async registerUser(userData) {
    return this.fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async loginUser(credentials) {
    return this.fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    const token = localStorage.getItem('ctas_token');
    if (!token) throw new Error('No authentication token');

    return this.fetchAPI('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Health Check
  async healthCheck() {
    return this.fetchAPI('/health');
  }

  // Demo data generators for development
  generateMockCoastalData() {
    return {
      status: 'success',
      data: {
        currentThreats: [
          {
            id: 1,
            type: 'Storm Surge',
            severity: 'High',
            probability: 85,
            timeToImpact: '6 hours',
            affectedAreas: ['Mumbai Coast', 'Worli', 'Marine Drive'],
            description: 'High tide combined with strong winds may cause coastal flooding'
          },
          {
            id: 2,
            type: 'Coastal Erosion',
            severity: 'Medium',
            probability: 60,
            timeToImpact: '2 days',
            affectedAreas: ['Juhu Beach', 'Versova'],
            description: 'Accelerated erosion due to recent weather patterns'
          },
          {
            id: 3,
            type: 'Mangrove Degradation',
            severity: 'Medium',
            probability: 70,
            timeToImpact: 'Ongoing',
            affectedAreas: ['Mahim Creek', 'Thane Creek'],
            description: 'Satellite data shows declining mangrove coverage'
          }
        ],
        statistics: {
          totalThreats: 3,
          highSeverity: 1,
          mediumSeverity: 2,
          lowSeverity: 0,
          lastUpdated: new Date().toISOString()
        }
      }
    };
  }

  generateMockWeatherData() {
    return {
      status: 'success',
      data: {
        current: {
          temperature: 28.5,
          humidity: 78,
          windSpeed: 12.3,
          windDirection: 'SW',
          pressure: 1013.2,
          visibility: 10,
          uvIndex: 6,
          conditions: 'Partly Cloudy',
          icon: 'partly-cloudy'
        },
        forecast: [
          { day: 'Today', high: 30, low: 25, conditions: 'Partly Cloudy', precipitation: 20 },
          { day: 'Tomorrow', high: 29, low: 24, conditions: 'Thunderstorms', precipitation: 80 },
          { day: 'Sat', high: 27, low: 23, conditions: 'Heavy Rain', precipitation: 90 },
          { day: 'Sun', high: 28, low: 24, conditions: 'Showers', precipitation: 60 },
          { day: 'Mon', high: 31, low: 26, conditions: 'Sunny', precipitation: 10 }
        ],
        alerts: [
          {
            type: 'Cyclone Watch',
            severity: 'High',
            message: 'Tropical cyclone forming in Arabian Sea. Monitor conditions.',
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    };
  }
}

// Create and export singleton instance
const apiService = new CTASApiService();
export default apiService;
