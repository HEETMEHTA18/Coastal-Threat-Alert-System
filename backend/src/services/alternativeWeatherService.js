// Alternative Weather Service using WeatherAPI.com
// Free tier: 1 million calls/month

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHERAPI_KEY; // Get from weatherapi.com
    this.baseUrl = 'http://api.weatherapi.com/v1';
  }

  async getCurrentWeather(location) {
    try {
      const response = await fetch(
        `${this.baseUrl}/current.json?key=${this.apiKey}&q=${location}&aqi=yes`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        location: data.location.name,
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        pressure: data.current.pressure_mb,
        visibility: data.current.vis_km,
        uvIndex: data.current.uv,
        airQuality: data.current.air_quality
      };
    } catch (error) {
      console.error('Weather service error:', error);
      throw error;
    }
  }

  async getForecast(location, days = 3) {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${location}&days=${days}&aqi=yes`
      );
      
      const data = await response.json();
      return data.forecast.forecastday;
    } catch (error) {
      console.error('Forecast service error:', error);
      throw error;
    }
  }

  async getMarineData(location) {
    try {
      const response = await fetch(
        `${this.baseUrl}/marine.json?key=${this.apiKey}&q=${location}&days=3`
      );
      
      const data = await response.json();
      return data.forecast.forecastday;
    } catch (error) {
      console.error('Marine service error:', error);
      throw error;
    }
  }
}

module.exports = WeatherService;
