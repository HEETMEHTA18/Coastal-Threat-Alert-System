// Current Monitor Service
// Connects dashboard status to ocean currents service

import OceanCurrentsService from './oceanCurrentsService';

class CurrentMonitorService {
  constructor() {
    this.oceanService = new OceanCurrentsService();
    this.isConnected = false;
    this.currentData = null;
    this.location = null;
    this.refreshInterval = null;
    this.listeners = [];
  }

  // Initialize with user location
  async initialize(userLocation) {
    this.location = userLocation;
    await this.testConnection();
    this.startAutoRefresh();
    return this.isConnected;
  }

  // Test connection to ocean currents service
  async testConnection() {
    try {
      const connected = await this.oceanService.testConnection();
      this.isConnected = connected;
      this.notifyListeners({ type: 'connectionStatus', connected: this.isConnected });
      return connected;
    } catch (error) {
      console.error('Current Monitor connection test failed:', error);
      this.isConnected = false;
      this.notifyListeners({ type: 'connectionStatus', connected: false });
      return false;
    }
  }

  // Get current conditions for user location
  async getCurrentData(lat = null, lng = null) {
    try {
      const location = { lat: lat || this.location?.lat, lng: lng || this.location?.lng };
      
      if (!location.lat || !location.lng) {
        throw new Error('Location not available');
      }

      const data = await this.oceanService.getCurrentConditions(location.lat, location.lng);
      this.currentData = data;
      this.isConnected = data.connectionStatus === 'connected';
      
      this.notifyListeners({ 
        type: 'dataUpdate', 
        data: this.currentData,
        connected: this.isConnected 
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching current data:', error);
      this.isConnected = false;
      this.notifyListeners({ type: 'error', error: error.message });
      return null;
    }
  }

  // Get live current stats for dashboard
  getLiveStats() {
    if (!this.currentData?.currents?.currents?.length) {
      return {
        speed: 0,
        direction: 0,
        directionText: 'N/A',
        station: 'No Data',
        lastUpdate: null,
        connected: false
      };
    }

    const latest = this.currentData.currents.currents[0];
    const station = this.currentData.nearestStations?.current;
    
    return {
      speed: latest.speed || 0,
      direction: latest.direction || 0,
      directionText: this.formatDirection(latest.direction || 0),
      station: station?.name || 'Unknown Station',
      lastUpdate: latest.timestamp,
      connected: this.isConnected,
      distance: station?.distance?.toFixed(1) || 'N/A'
    };
  }

  // Format direction degrees to compass direction
  formatDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Start auto refresh
  startAutoRefresh(intervalMs = 60000) { // 1 minute default
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(async () => {
      if (this.location) {
        await this.getCurrentData();
      }
    }, intervalMs);
  }

  // Stop auto refresh
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Add listener for status updates
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in Current Monitor listener:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    this.stopAutoRefresh();
    this.listeners = [];
  }
}

export default CurrentMonitorService;