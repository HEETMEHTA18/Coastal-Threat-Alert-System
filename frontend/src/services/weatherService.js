// Weather Service for real-time weather data integration
class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather for coordinates
   */
  async getCurrentWeather(lat, lon) {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.formatCurrentWeather(data);
    } catch (error) {
      console.error('Failed to fetch current weather:', error);
      return null;
    }
  }

  /**
   * Get 5-day weather forecast
   */
  async getWeatherForecast(lat, lon) {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.formatForecast(data);
    } catch (error) {
      console.error('Failed to fetch weather forecast:', error);
      return null;
    }
  }

  /**
   * Get weather alerts if available
   */
  async getWeatherAlerts(lat, lon) {
    try {
      const response = await fetch(
        `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily`
      );
      
      if (!response.ok) {
        throw new Error(`Alerts API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.alerts || [];
    } catch (error) {
      console.error('Failed to fetch weather alerts:', error);
      return [];
    }
  }

  /**
   * Format current weather data
   */
  formatCurrentWeather(data) {
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind?.speed || 0,
      windDirection: data.wind?.deg || 0,
      visibility: data.visibility / 1000, // Convert to km
      description: data.weather[0]?.description || 'Unknown',
      main: data.weather[0]?.main || 'Unknown',
      icon: data.weather[0]?.icon || '01d',
      cloudiness: data.clouds?.all || 0,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
      location: {
        name: data.name,
        country: data.sys.country
      },
      timestamp: new Date()
    };
  }

  /**
   * Format forecast data
   */
  formatForecast(data) {
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: new Date(item.dt * 1000),
          temperatures: [],
          conditions: [],
          precipitation: 0,
          windSpeeds: [],
          humidity: []
        };
      }
      
      dailyForecasts[date].temperatures.push(item.main.temp);
      dailyForecasts[date].conditions.push(item.weather[0]);
      dailyForecasts[date].precipitation += item.rain?.['3h'] || 0;
      dailyForecasts[date].windSpeeds.push(item.wind?.speed || 0);
      dailyForecasts[date].humidity.push(item.main.humidity);
    });

    return Object.values(dailyForecasts).slice(0, 5).map(day => ({
      date: day.date,
      tempMin: Math.round(Math.min(...day.temperatures)),
      tempMax: Math.round(Math.max(...day.temperatures)),
      avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      maxWindSpeed: Math.round(Math.max(...day.windSpeeds)),
      precipitation: Math.round(day.precipitation * 10) / 10,
      mainCondition: this.getMostFrequentCondition(day.conditions),
      icon: day.conditions[0]?.icon || '01d'
    }));
  }

  /**
   * Get most frequent weather condition for the day
   */
  getMostFrequentCondition(conditions) {
    const counts = {};
    conditions.forEach(condition => {
      counts[condition.main] = (counts[condition.main] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => 
      counts[a] > counts[b] ? a : b
    );
  }

  /**
   * Assess weather-related coastal threats
   */
  assessWeatherThreats(currentWeather, forecast) {
    const threats = {
      level: 'low',
      factors: [],
      recommendations: [],
      score: 0
    };

    // High wind threat
    if (currentWeather.windSpeed > 15) {
      threats.factors.push(`High winds: ${currentWeather.windSpeed} m/s`);
      threats.score += 30;
      threats.recommendations.push('Avoid coastal areas due to high winds');
    }

    // Storm threat based on weather conditions
    if (['Thunderstorm', 'Squall'].includes(currentWeather.main)) {
      threats.factors.push(`Storm conditions: ${currentWeather.description}`);
      threats.score += 40;
      threats.recommendations.push('Severe weather - stay indoors');
    }

    // Heavy rain threat
    const heavyRainDays = forecast.filter(day => day.precipitation > 5).length;
    if (heavyRainDays > 2) {
      threats.factors.push(`Heavy rain expected: ${heavyRainDays} days`);
      threats.score += 25;
      threats.recommendations.push('Flooding risk due to heavy rainfall');
    }

    // Low pressure threat (cyclone risk)
    if (currentWeather.pressure < 1000) {
      threats.factors.push(`Low pressure: ${currentWeather.pressure} hPa`);
      threats.score += 35;
      threats.recommendations.push('Low pressure system - monitor for cyclone development');
    }

    // High humidity (storm formation)
    if (currentWeather.humidity > 85) {
      threats.factors.push(`High humidity: ${currentWeather.humidity}%`);
      threats.score += 15;
      threats.recommendations.push('High humidity may lead to storm formation');
    }

    // Determine threat level
    if (threats.score >= 60) {
      threats.level = 'critical';
    } else if (threats.score >= 40) {
      threats.level = 'high';
    } else if (threats.score >= 20) {
      threats.level = 'medium';
    }

    return threats;
  }

  /**
   * Get wind direction name
   */
  getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Check if weather conditions are favorable for coastal activities
   */
  isCoastalActivitySafe(currentWeather, threats) {
    const unsafe = [
      currentWeather.windSpeed > 10,
      ['Thunderstorm', 'Squall', 'Rain'].includes(currentWeather.main),
      threats.level === 'high' || threats.level === 'critical',
      currentWeather.visibility < 5
    ];

    return {
      safe: !unsafe.some(condition => condition),
      reasons: [
        currentWeather.windSpeed > 10 ? 'High winds' : null,
        ['Thunderstorm', 'Squall', 'Rain'].includes(currentWeather.main) ? 'Poor weather conditions' : null,
        threats.level === 'high' || threats.level === 'critical' ? 'High threat level' : null,
        currentWeather.visibility < 5 ? 'Poor visibility' : null
      ].filter(Boolean)
    };
  }
}

export default new WeatherService();