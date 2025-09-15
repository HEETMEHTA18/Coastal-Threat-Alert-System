// Ocean Currents and Tides Service
// Fetches data from NOAA APIs for ocean currents and tidal information

class OceanCurrentsService {
  constructor() {
    // NOAA API endpoints for currents and tides
    this.currentStationsAPI = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
    this.stationsListAPI = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json';
    
    // Rate limiting
    this.lastApiCall = 0;
    this.minApiInterval = 10000; // Minimum 10 seconds between API calls
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes cache
    
    // Indian Ocean and coastal current monitoring stations - reduced to 3 main stations
    this.indianOceanStations = [
      {
        id: 'mumbai_port',
        name: 'Mumbai Port Current Monitor',
        lat: 18.9220,
        lng: 72.8347,
        type: 'current',
        noaaId: 'DEMO_MUMBAI_PORT' // Use demo data for Indian waters
      },
      {
        id: 'kandla_port',
        name: 'Kandla Port Current Monitor',
        lat: 23.0300,
        lng: 70.2167,
        type: 'current',
        noaaId: 'DEMO_INDIAN_STATION' // Use demo data for Indian waters
      },
      {
        id: 'mumbai_offshore',
        name: 'Mumbai Offshore Platform',
        lat: 19.2500,
        lng: 72.6500,
        type: 'current',
        noaaId: 'DEMO_OFFSHORE_PLATFORM' // Use demo data for Indian waters
      }
    ];

    // Tidal stations for Indian coastal areas - reduced to 2 main stations
    this.tidalStations = [
      {
        id: 'mumbai_tide',
        name: 'Mumbai High/Low Tide',
        lat: 19.0760,
        lng: 72.8777,
        noaaId: 'DEMO_MUMBAI_TIDE' // Use demo data for Indian waters
      },
      {
        id: 'kandla_tide',
        name: 'Kandla Port Tide',
        lat: 23.0300,
        lng: 70.2167,
        noaaId: 'DEMO_KANDLA_TIDE' // Use demo data for Indian waters
      }
    ];
  }

  // Parse NOAA XML current data (like the sample provided)
  parseCurrentsXML(xmlString) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      const metadata = xmlDoc.querySelector('metadata');
      const observations = xmlDoc.querySelectorAll('cu');
      
      const stationInfo = {
        id: metadata?.getAttribute('id') || 'unknown',
        name: metadata?.getAttribute('name') || 'Unknown Station',
        lat: parseFloat(metadata?.getAttribute('lat')) || 0,
        lng: parseFloat(metadata?.getAttribute('lon')) || 0
      };

      const currentData = Array.from(observations).map(obs => ({
        timestamp: obs.getAttribute('t'),
        speed: parseFloat(obs.getAttribute('s')), // knots
        direction: parseInt(obs.getAttribute('d')), // degrees
        bin: parseInt(obs.getAttribute('b')) // depth bin
      }));

      return {
        station: stationInfo,
        currents: currentData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing currents XML:', error);
      return null;
    }
  }

  // Find nearest station to user coordinates
  findNearestStation(userLat, userLng, stations = null) {
    const stationsToSearch = stations || this.indianOceanStations;
    let nearest = null;
    let minDistance = Infinity;

    stationsToSearch.forEach(station => {
      const distance = this.calculateDistance(userLat, userLng, station.lat, station.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...station, distance };
      }
    });

    return nearest;
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Rate limiting helper
  async rateLimitedFetch(url, options = {}) {
    const cacheKey = url;
    const now = Date.now();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      console.log('🔄 Returning cached NOAA data');
      return cached.response;
    }
    
    // Check rate limit
    const timeSinceLastCall = now - this.lastApiCall;
    if (timeSinceLastCall < this.minApiInterval) {
      const waitTime = this.minApiInterval - timeSinceLastCall;
      console.log(`⏱️ Rate limiting NOAA API call, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastApiCall = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 10000 // 10 second timeout
      });
      
      // Cache successful responses
      if (response.ok) {
        this.cache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now()
        });
      }
      
      return response;
    } catch (error) {
      console.warn('Rate limited fetch failed:', error.message);
      throw error;
    }
  }

  // Test connection to NOAA API
  async testConnection() {
    try {
      // Use a known valid water level station instead of current station for testing
      const response = await this.rateLimitedFetch(`${this.currentStationsAPI}?product=water_level&station=8570283&date=latest&datum=MLLW&time_zone=gmt&units=metric&format=json`);
      
      if (!response.ok) {
        console.warn('NOAA API returned status:', response.status);
        return false;
      }
      
      const data = await response.json();
      return data && !data.error;
    } catch (error) {
      console.warn('NOAA API connection test failed:', error.message);
      return false;
    }
  }

  // Fetch current data for a specific station
  async fetchCurrentData(stationId, hoursBack = 24) {
    try {
      // Use demo data immediately for Indian coastal stations
      if (stationId.startsWith('DEMO_')) {
        console.log(`🌊 Using demo data for Indian station: ${stationId}`);
        return this.generateDemoCurrentData(stationId);
      }

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (hoursBack * 60 * 60 * 1000));
      
      const params = new URLSearchParams({
        product: 'currents',
        station: stationId,
        begin_date: startDate.toISOString().slice(0, 10).replace(/-/g, ''),
        end_date: endDate.toISOString().slice(0, 10).replace(/-/g, ''),
        datum: 'MLLW',
        time_zone: 'gmt',
        units: 'metric',
        format: 'json'
      });

      const response = await this.rateLimitedFetch(`${this.currentStationsAPI}?${params}`);
      
      if (!response.ok) {
        console.warn(`NOAA API error for station ${stationId}: ${response.status} - Using demo data`);
        return this.generateDemoCurrentData(stationId);
      }
      
      const data = await response.json();
      return this.processCurrentData(data);
    } catch (error) {
      console.warn(`Error fetching current data for station ${stationId}: ${error.message} - Using demo data`);
      return this.generateDemoCurrentData(stationId);
    }
  }

  // Fetch tidal data
  async fetchTidalData(stationId, days = 7) {
    try {
      // Use demo data immediately for Indian coastal stations
      if (stationId.startsWith('DEMO_')) {
        console.log(`🌊 Using demo tidal data for Indian station: ${stationId}`);
        return this.generateDemoTidalData(stationId);
      }

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const params = new URLSearchParams({
        product: 'predictions',
        station: stationId,
        begin_date: this.formatDate(startDate),
        end_date: this.formatDate(endDate),
        datum: 'MLLW',
        time_zone: 'lst_ldt',
        units: 'metric',
        format: 'json',
        application: 'coastal_threat_assessment'
      });

      const response = await this.rateLimitedFetch(`${this.currentStationsAPI}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        return this.processTidalData(data);
      } else {
        console.warn(`NOAA Tidal API error for station ${stationId}:`, response.status);
        return this.generateDemoTidalData(stationId);
      }
    } catch (error) {
      console.warn('Error fetching tidal data:', error.message);
      return this.generateDemoTidalData(stationId);
    }
  }

  // Process tidal data to find high/low tides
  processTidalData(data) {
    if (!data.predictions) return null;

    const predictions = data.predictions.map(p => ({
      time: new Date(p.t),
      height: parseFloat(p.v)
    }));

    // Find high and low tides
    const tides = [];
    for (let i = 1; i < predictions.length - 1; i++) {
      const prev = predictions[i - 1];
      const current = predictions[i];
      const next = predictions[i + 1];

      if (current.height > prev.height && current.height > next.height) {
        tides.push({ ...current, type: 'high' });
      } else if (current.height < prev.height && current.height < next.height) {
        tides.push({ ...current, type: 'low' });
      }
    }

    return {
      predictions: predictions,
      tides: tides,
      lastUpdated: new Date().toISOString()
    };
  }

  // Generate demo current data based on the sample XML provided
  generateDemoCurrentData(stationId) {
    const station = this.indianOceanStations.find(s => s.noaaId === stationId) || 
                   this.indianOceanStations[0];
    
    const now = new Date();
    const currents = [];
    
    // Generate 24 hours of sample data similar to the XML sample
    for (let i = 0; i < 144; i++) { // Every 10 minutes for 24 hours
      const time = new Date(now.getTime() - (i * 10 * 60 * 1000));
      
      // Simulate tidal current patterns
      const tidePhase = (time.getHours() + time.getMinutes() / 60) * Math.PI / 6;
      const baseSpeed = 1.2 + Math.sin(tidePhase) * 0.8; // 0.4 to 2.0 knots
      const direction = 95 + Math.sin(tidePhase * 2) * 30; // Varying direction
      
      currents.push({
        timestamp: time.toISOString().slice(0, 16).replace('T', ' '),
        speed: Math.max(0, baseSpeed + (Math.random() - 0.5) * 0.3),
        direction: Math.round(direction + (Math.random() - 0.5) * 20),
        bin: 4
      });
    }

    return {
      station: {
        id: station.id,
        name: station.name,
        lat: station.lat,
        lng: station.lng
      },
      currents: currents.reverse(), // Most recent first
      lastUpdated: new Date().toISOString()
    };
  }

  // Generate demo tidal data
  generateDemoTidalData(stationId) {
    const station = this.tidalStations.find(s => s.noaaId === stationId) ||
                   this.tidalStations[0];
    
    const now = new Date();
    const predictions = [];
    const tides = [];
    
    // Generate tidal predictions for next 7 days
    for (let i = 0; i < 7 * 24 * 4; i++) { // Every 15 minutes
      const time = new Date(now.getTime() + (i * 15 * 60 * 1000));
      const tidePhase = (time.getTime() / (12.42 * 60 * 60 * 1000)) * 2 * Math.PI; // 12.42 hour tidal cycle
      const height = 2.5 + Math.sin(tidePhase) * 1.8; // 0.7m to 4.3m range
      
      predictions.push({
        time: time,
        height: height
      });
    }

    // Find high and low tides from predictions
    for (let i = 6; i < predictions.length - 6; i++) {
      const current = predictions[i];
      const surrounding = predictions.slice(i - 6, i + 7);
      const maxHeight = Math.max(...surrounding.map(p => p.height));
      const minHeight = Math.min(...surrounding.map(p => p.height));
      
      if (current.height === maxHeight) {
        tides.push({ ...current, type: 'high' });
      } else if (current.height === minHeight) {
        tides.push({ ...current, type: 'low' });
      }
    }

    return {
      station: station,
      predictions: predictions,
      tides: tides.slice(0, 28), // Next 2 weeks of high/low tides
      lastUpdated: new Date().toISOString()
    };
  }

  // Format date for NOAA API
  formatDate(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  // Get all available stations
  getAvailableStations() {
    return {
      currents: this.indianOceanStations,
      tides: this.tidalStations
    };
  }

  // Get current conditions summary for a location
  async getCurrentConditions(lat, lng) {
    // Find nearest stations for both currents and tides
    const nearestCurrent = this.findNearestStation(lat, lng, this.indianOceanStations);
    const nearestTide = this.findNearestStation(lat, lng, this.tidalStations);
    
    console.log(`Finding currents for location: ${lat}, ${lng}`);
    console.log(`Nearest current station: ${nearestCurrent.name} (${nearestCurrent.distance?.toFixed(1)}km away)`);
    console.log(`Nearest tide station: ${nearestTide.name} (${nearestTide.distance?.toFixed(1)}km away)`);
    
    try {
      const [currentData, tidalData] = await Promise.all([
        this.fetchCurrentData(nearestCurrent.noaaId, 6), // Last 6 hours
        this.fetchTidalData(nearestTide.noaaId, 1) // Next 24 hours
      ]);

      return {
        location: { lat, lng },
        currents: currentData,
        tides: tidalData,
        nearestStations: {
          current: nearestCurrent,
          tide: nearestTide
        },
        connectionStatus: 'connected'
      };
    } catch (error) {
      console.error('Error fetching ocean conditions:', error);
      return {
        location: { lat, lng },
        currents: this.generateDemoCurrentData(nearestCurrent.noaaId),
        tides: this.generateDemoTidalData(nearestTide.noaaId),
        nearestStations: {
          current: nearestCurrent,
          tide: nearestTide
        },
        connectionStatus: 'error'
      };
    }
  }
}

export default OceanCurrentsService;