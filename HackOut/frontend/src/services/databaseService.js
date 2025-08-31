// Database service for CTAS - handles all database operations
class DatabaseService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.token = localStorage.getItem('ctas_token');
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // User Management
  async createUser(userData) {
    return this.apiCall('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        organization: userData.organization,
        location: userData.location,
        permissions: this.getDefaultPermissions(userData.role)
      })
    });
  }

  async authenticateUser(email, password) {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getUserProfile(userId) {
    return this.apiCall(`/users/${userId}`);
  }

  async updateUserProfile(userId, updateData) {
    return this.apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  getDefaultPermissions(role) {
    const permissions = {
      citizen: ['view_dashboard', 'create_reports', 'view_alerts'],
      official: ['view_dashboard', 'create_reports', 'view_alerts', 'manage_alerts', 'verify_reports'],
      researcher: ['view_dashboard', 'create_reports', 'view_alerts', 'access_raw_data', 'export_data'],
      emergency: ['view_dashboard', 'create_reports', 'view_alerts', 'manage_alerts', 'emergency_broadcast']
    };
    return permissions[role] || permissions.citizen;
  }

  // Weather Data Management
  async saveWeatherData(weatherData) {
    return this.apiCall('/weather', {
      method: 'POST',
      body: JSON.stringify({
        location: weatherData.location,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        pressure: weatherData.pressure,
        visibility: weatherData.visibility,
        precipitation: weatherData.precipitation,
        condition: weatherData.condition,
        timestamp: new Date(),
        source: weatherData.source || 'OpenWeatherMap'
      })
    });
  }

  async getWeatherHistory(location, startDate, endDate) {
    const params = new URLSearchParams({
      location,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    return this.apiCall(`/weather/history?${params}`);
  }

  async getWeatherAlerts(location) {
    return this.apiCall(`/weather/alerts?location=${encodeURIComponent(location)}`);
  }

  // Threat Management
  async createThreatAlert(threatData) {
    return this.apiCall('/threats', {
      method: 'POST',
      body: JSON.stringify({
        type: threatData.type,
        severity: threatData.severity,
        location: threatData.location,
        coordinates: threatData.coordinates,
        description: threatData.description,
        affectedArea: threatData.affectedArea,
        estimatedImpact: threatData.estimatedImpact,
        recommendedActions: threatData.recommendedActions,
        createdBy: threatData.createdBy,
        status: 'active',
        timestamp: new Date()
      })
    });
  }

  async updateThreatStatus(threatId, status, notes) {
    return this.apiCall(`/threats/${threatId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, updatedAt: new Date() })
    });
  }

  async getActiveThreats(location) {
    return this.apiCall(`/threats/active?location=${encodeURIComponent(location)}`);
  }

  async getThreatHistory(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.apiCall(`/threats/history?${params}`);
  }

  // Satellite Data Management
  async saveSatelliteData(satelliteData) {
    return this.apiCall('/satellite', {
      method: 'POST',
      body: JSON.stringify({
        satellite: satelliteData.satellite,
        imageUrl: satelliteData.imageUrl,
        captureDate: satelliteData.captureDate,
        location: satelliteData.location,
        coordinates: satelliteData.coordinates,
        resolution: satelliteData.resolution,
        cloudCover: satelliteData.cloudCover,
        analysisResults: satelliteData.analysisResults,
        metadata: satelliteData.metadata
      })
    });
  }

  async getSatelliteImages(location, dateRange) {
    const params = new URLSearchParams({
      location,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString()
    });
    return this.apiCall(`/satellite/images?${params}`);
  }

  // Community Reports Management
  async createCommunityReport(reportData) {
    return this.apiCall('/reports', {
      method: 'POST',
      body: JSON.stringify({
        type: reportData.type,
        title: reportData.title,
        description: reportData.description,
        location: reportData.location,
        coordinates: reportData.coordinates,
        severity: reportData.severity,
        category: reportData.category,
        authorId: reportData.authorId,
        media: reportData.media,
        status: 'pending',
        verified: false,
        timestamp: new Date()
      })
    });
  }

  async getCommunityReports(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.apiCall(`/reports?${params}`);
  }

  async verifyReport(reportId, verifierId, notes) {
    return this.apiCall(`/reports/${reportId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({
        verified: true,
        verifiedBy: verifierId,
        verificationNotes: notes,
        verifiedAt: new Date()
      })
    });
  }

  async likeReport(reportId, userId) {
    return this.apiCall(`/reports/${reportId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async addReportComment(reportId, userId, comment) {
    return this.apiCall(`/reports/${reportId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        comment,
        timestamp: new Date()
      })
    });
  }

  // Media Management
  async uploadMedia(file, type, reportId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('reportId', reportId);

    return this.apiCall('/media/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      body: formData
    });
  }

  async getMediaFile(mediaId) {
    return this.apiCall(`/media/${mediaId}`);
  }

  // Alert Management
  async createAlert(alertData) {
    return this.apiCall('/alerts', {
      method: 'POST',
      body: JSON.stringify({
        type: alertData.type,
        title: alertData.title,
        message: alertData.message,
        severity: alertData.severity,
        location: alertData.location,
        targetAudience: alertData.targetAudience,
        channels: alertData.channels, // ['sms', 'email', 'push', 'web']
        expiresAt: alertData.expiresAt,
        createdBy: alertData.createdBy,
        active: true,
        timestamp: new Date()
      })
    });
  }

  async getAlerts(location, userId) {
    const params = new URLSearchParams({ location, userId });
    return this.apiCall(`/alerts?${params}`);
  }

  async markAlertRead(alertId, userId) {
    return this.apiCall(`/alerts/${alertId}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId, readAt: new Date() })
    });
  }

  // Analytics and Statistics
  async getDashboardStats(location, timeRange) {
    const params = new URLSearchParams({
      location,
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    });
    return this.apiCall(`/analytics/dashboard?${params}`);
  }

  async getThreatTrends(location, period) {
    return this.apiCall(`/analytics/threats/trends?location=${encodeURIComponent(location)}&period=${period}`);
  }

  async getWeatherTrends(location, period) {
    return this.apiCall(`/analytics/weather/trends?location=${encodeURIComponent(location)}&period=${period}`);
  }

  async getCommunityEngagement(timeRange) {
    const params = new URLSearchParams({
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    });
    return this.apiCall(`/analytics/community?${params}`);
  }

  // Location Management
  async saveUserLocation(userId, location) {
    return this.apiCall(`/users/${userId}/location`, {
      method: 'PUT',
      body: JSON.stringify({
        address: location.address,
        coordinates: location.coordinates,
        timezone: location.timezone,
        updatedAt: new Date()
      })
    });
  }

  async getNearbyUsers(coordinates, radius) {
    const params = new URLSearchParams({
      lat: coordinates.lat,
      lng: coordinates.lng,
      radius: radius.toString()
    });
    return this.apiCall(`/users/nearby?${params}`);
  }

  // Notification Management
  async createNotification(notificationData) {
    return this.apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        read: false,
        timestamp: new Date()
      })
    });
  }

  async getUserNotifications(userId, limit = 50) {
    return this.apiCall(`/users/${userId}/notifications?limit=${limit}`);
  }

  async markNotificationRead(notificationId) {
    return this.apiCall(`/notifications/${notificationId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ readAt: new Date() })
    });
  }

  // Batch Operations
  async batchCreateReports(reports) {
    return this.apiCall('/reports/batch', {
      method: 'POST',
      body: JSON.stringify({ reports })
    });
  }

  async batchUpdateThreats(updates) {
    return this.apiCall('/threats/batch', {
      method: 'PUT',
      body: JSON.stringify({ updates })
    });
  }

  // Data Export
  async exportData(type, filters, format = 'json') {
    const params = new URLSearchParams({
      type,
      format,
      ...filters
    });
    return this.apiCall(`/export?${params}`);
  }

  // Sync for Offline Support
  async syncOfflineData(offlineData) {
    return this.apiCall('/sync', {
      method: 'POST',
      body: JSON.stringify(offlineData)
    });
  }

  async getOfflineData(lastSyncTime) {
    return this.apiCall(`/sync/data?lastSync=${lastSyncTime.toISOString()}`);
  }

  // Health Check
  async healthCheck() {
    return this.apiCall('/health');
  }

  // Update token after authentication
  updateToken(token) {
    this.token = token;
    localStorage.setItem('ctas_token', token);
  }

  // Clear token on logout
  clearToken() {
    this.token = null;
    localStorage.removeItem('ctas_token');
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;
