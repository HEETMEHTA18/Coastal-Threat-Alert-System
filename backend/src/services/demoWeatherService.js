// Demo Weather Service for Testing (No API Key Required)
class DemoWeatherService {
  constructor() {
    console.log('🌤️ Using Demo Weather Service - No API key required');
  }

  async getCurrentWeather(location = 'Mumbai') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return realistic demo data
    return {
      location: location,
      temperature: Math.floor(Math.random() * 10) + 25, // 25-35°C
      condition: this.getRandomCondition(),
      humidity: Math.floor(Math.random() * 30) + 60, // 60-90%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
      visibility: Math.floor(Math.random() * 5) + 5, // 5-10 km
      uvIndex: Math.floor(Math.random() * 8) + 2, // 2-10
      timestamp: new Date().toISOString(),
      source: 'demo'
    };
  }

  async getForecast(location = 'Mumbai', days = 5) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const forecast = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        maxTemp: Math.floor(Math.random() * 8) + 28,
        minTemp: Math.floor(Math.random() * 5) + 22,
        condition: this.getRandomCondition(),
        chanceOfRain: Math.floor(Math.random() * 100),
        windSpeed: Math.floor(Math.random() * 15) + 5
      });
    }
    
    return forecast;
  }

  async getMarineData(location = 'Arabian Sea') {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      location: location,
      waveHeight: (Math.random() * 3 + 0.5).toFixed(1), // 0.5-3.5m
      waterTemp: Math.floor(Math.random() * 5) + 26, // 26-31°C
      tideLevel: (Math.random() * 2 - 1).toFixed(2), // -1 to +1m
      salinity: (Math.random() * 2 + 34).toFixed(1), // 34-36 ppt
      currentSpeed: (Math.random() * 1.5).toFixed(1), // 0-1.5 m/s
      visibility: Math.floor(Math.random() * 10) + 5, // 5-15 km
      timestamp: new Date().toISOString(),
      source: 'demo'
    };
  }

  getRandomCondition() {
    const conditions = [
      'Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain',
      'Heavy Rain', 'Thunderstorm', 'Misty', 'Clear'
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  // Method to test API connectivity
  async testConnection() {
    return {
      status: 'success',
      message: 'Demo weather service is working',
      timestamp: new Date().toISOString(),
      apiKeyRequired: false
    };
  }
}

module.exports = DemoWeatherService;
