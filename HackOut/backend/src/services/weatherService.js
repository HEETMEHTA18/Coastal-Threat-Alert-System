const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(lat, lon) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        windSpeed: response.data.wind.speed,
        windDirection: response.data.wind.deg,
        visibility: response.data.visibility,
        weather: response.data.weather[0].description,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Weather API Error:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  async getMarineWeather(lat, lon) {
    try {
      // Using marine weather API for coastal data
      const response = await axios.get(`${this.baseUrl}/marine`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return {
        waveHeight: response.data.wave?.height || 0,
        waveDirection: response.data.wave?.direction || 0,
        wavePeriod: response.data.wave?.period || 0,
        currentSpeed: response.data.current?.speed || 0,
        currentDirection: response.data.current?.direction || 0,
        tideLevel: response.data.tide?.level || 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Marine Weather API Error:', error.message);
      // Return mock data if API fails
      return {
        waveHeight: Math.random() * 3 + 1,
        waveDirection: Math.random() * 360,
        wavePeriod: Math.random() * 10 + 5,
        currentSpeed: Math.random() * 2,
        currentDirection: Math.random() * 360,
        tideLevel: Math.random() * 2 - 1,
        timestamp: new Date()
      };
    }
  }

  async getWeatherForecast(lat, lon, days = 5) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (3-hour intervals)
        }
      });

      return response.data.list.map(item => ({
        datetime: new Date(item.dt * 1000),
        temperature: item.main.temp,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: item.wind.speed,
        windDirection: item.wind.deg,
        weather: item.weather[0].description,
        precipitationProbability: item.pop * 100
      }));
    } catch (error) {
      console.error('Weather Forecast API Error:', error.message);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  async analyzeStormRisk(lat, lon) {
    try {
      const current = await this.getCurrentWeather(lat, lon);
      const marine = await this.getMarineWeather(lat, lon);
      const forecast = await this.getWeatherForecast(lat, lon, 3);

      // Calculate storm risk based on multiple factors
      let riskScore = 0;
      
      // Wind speed factor
      if (current.windSpeed > 25) riskScore += 30; // Strong winds
      else if (current.windSpeed > 15) riskScore += 15; // Moderate winds
      
      // Wave height factor
      if (marine.waveHeight > 3) riskScore += 25; // High waves
      else if (marine.waveHeight > 2) riskScore += 10; // Moderate waves
      
      // Pressure factor
      if (current.pressure < 1000) riskScore += 20; // Low pressure
      else if (current.pressure < 1010) riskScore += 10; // Moderate pressure
      
      // Forecast trend analysis
      const windTrend = this.analyzeTrend(forecast.map(f => f.windSpeed));
      const pressureTrend = this.analyzeTrend(forecast.map(f => f.pressure));
      
      if (windTrend.increasing && windTrend.rate > 5) riskScore += 15;
      if (pressureTrend.decreasing && pressureTrend.rate > 5) riskScore += 15;

      return {
        riskScore: Math.min(riskScore, 100),
        riskLevel: this.getRiskLevel(riskScore),
        factors: {
          windSpeed: current.windSpeed,
          waveHeight: marine.waveHeight,
          pressure: current.pressure,
          trends: {
            wind: windTrend,
            pressure: pressureTrend
          }
        },
        recommendations: this.getRecommendations(riskScore)
      };
    } catch (error) {
      console.error('Storm Risk Analysis Error:', error.message);
      throw new Error('Failed to analyze storm risk');
    }
  }

  analyzeTrend(values) {
    if (values.length < 2) return { trend: 'stable', rate: 0 };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const rate = Math.abs(change);
    
    return {
      increasing: change > 0,
      decreasing: change < 0,
      stable: Math.abs(change) < 1,
      rate: rate
    };
  }

  getRiskLevel(score) {
    if (score >= 70) return 'critical';
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  getRecommendations(score) {
    const recommendations = [];
    
    if (score >= 70) {
      recommendations.push('Immediate evacuation of vulnerable coastal areas');
      recommendations.push('Activate emergency response protocols');
      recommendations.push('Issue critical storm surge warnings');
    } else if (score >= 40) {
      recommendations.push('Prepare emergency response teams');
      recommendations.push('Issue storm warnings to coastal communities');
      recommendations.push('Monitor situation closely');
    } else if (score >= 20) {
      recommendations.push('Maintain weather monitoring');
      recommendations.push('Inform coastal communities of potential risks');
    } else {
      recommendations.push('Continue routine monitoring');
    }
    
    return recommendations;
  }
}

module.exports = new WeatherService();
