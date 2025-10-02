// Weather Service for real-time weather data integration
class WeatherService {
  constructor() {
    // Prefer server-side proxy to avoid exposing API keys in the browser.
    this.nodeBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001';
  // Use the canonical env var name used elsewhere in the frontend
  this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather for coordinates
   */
  async getCurrentWeather(lat, lon) {
    try {
      console.debug && console.debug('weatherService.getCurrentWeather called', { lat, lon });
      // Try server-side proxy first
      const proxyUrl = `${this.nodeBase.replace(/\/$/, '')}/api/openweather/current?lat=${lat}&lon=${lon}`;
      let response;
      try {
        response = await fetch(proxyUrl);
        if (response.ok) {
          const payload = await response.json();
          console.debug && console.debug('weatherService proxy response for current:', payload);
          if (payload && payload.status === 'success' && payload.data) {
              // If proxy returns a normalized OpenWeather-like object, return it as-is
              if (payload.data.main && payload.data.weather) {
                return payload.data;
              }
              // Otherwise attempt to format a compatible shape
              if (payload.data) return this.formatCurrentWeather(payload.data);
          }
        }
        // if proxy returns non-OK, fall back to direct call
      } catch (err) {
        // proxy failed, will fall back to client-side call
        console.warn('OpenWeather proxy failed, falling back to direct API:', err.message);
      }

      // Fallback: direct client-side call (requires API key)
      if (!this.apiKey) {
        throw new Error('No OpenWeather API key configured for direct client calls');
      }
      response = await fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
  const data = await response.json();
  // Direct client call returns OpenWeather raw object - return it directly so UI can read `main`, `weather`, `wind`.
  return data;
    } catch (error) {
      console.error('Failed to fetch current weather:', error);
        console.debug && console.debug('weatherService falling back to client-side API for current weather');
      return null;
    }
  }

  /**
   * Get 5-day weather forecast
   */
  async getWeatherForecast(lat, lon) {
    try {
      console.debug && console.debug('weatherService.getWeatherForecast called', { lat, lon });
      // Try proxy
      const proxyUrl = `${this.nodeBase.replace(/\/$/, '')}/api/openweather/forecast?lat=${lat}&lon=${lon}`;
      let response;
      try {
        response = await fetch(proxyUrl);
        if (response.ok) {
          const payload = await response.json();
          console.debug && console.debug('weatherService proxy response for forecast:', payload);
          if (payload && payload.status === 'success' && payload.data) {
              // Proxy may return either raw OpenWeather response (with `.list`) or
              // a pre-processed array of daily forecasts. Support both shapes.
              if (Array.isArray(payload.data)) {
                // Already-processed days array
                return payload.data;
              }
              if (Array.isArray(payload.data.list)) {
                return this.formatForecast(payload.data);
              }
              console.warn('OpenWeather proxy returned unexpected shape for forecast', payload.data);
              // fall through to client fallback
            }
        }
      } catch (err) {
        console.warn('OpenWeather forecast proxy failed, fallback to client:', err.message);
      }

      if (!this.apiKey) {
        throw new Error('No OpenWeather API key configured for direct client calls');
      }
      response = await fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
      
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
      const proxyUrl = `${this.nodeBase.replace(/\/$/, '')}/api/openweather/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily`;
      let response;
      try {
        response = await fetch(proxyUrl);
        if (response.ok) {
          const payload = await response.json();
          if (payload && payload.status === 'success' && payload.data) {
            return payload.data.alerts || [];
          }
        }
      } catch (err) {
        console.warn('OpenWeather onecall proxy failed, fallback to client:', err.message);
      }

      if (!this.apiKey) {
        throw new Error('No OpenWeather API key configured for direct client calls');
      }
      response = await fetch(`${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily`);
      
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
    const main = data.main || {};
    const wind = data.wind || {};
    const sys = data.sys || {};
    const weatherArr = Array.isArray(data.weather) ? data.weather : [];
    const firstWeather = weatherArr[0] || {};

    return {
      temperature: Number.isFinite(main.temp) ? Math.round(main.temp) : null,
      feelsLike: Number.isFinite(main.feels_like) ? Math.round(main.feels_like) : null,
      humidity: main.humidity ?? null,
      pressure: main.pressure ?? null,
      windSpeed: wind.speed ?? 0,
      windDirection: wind.deg ?? 0,
      visibility: (data.visibility != null) ? (data.visibility / 1000) : null, // Convert to km
      description: firstWeather.description || 'Unknown',
      main: firstWeather.main || 'Unknown',
      icon: firstWeather.icon || '01d',
      cloudiness: data.clouds?.all || 0,
      sunrise: sys.sunrise ? new Date(sys.sunrise * 1000) : null,
      sunset: sys.sunset ? new Date(sys.sunset * 1000) : null,
      location: {
        name: data.name || (data.location && data.location.name) || 'Unknown',
        country: sys.country || (data.location && data.location.country) || ''
      },
      timestamp: new Date()
    };
  }

  /**
   * Format forecast data
   */
  formatForecast(data) {
    // If the data is already an array of forecast-day objects (from our proxy),
    // assume it's ready to use and return the first 5 days.
    if (Array.isArray(data) && data.length > 0 && data[0].date) {
      return data.slice(0, 5);
    }
    const dailyForecasts = {};
    const list = Array.isArray(data?.list) ? data.list : [];

    list.forEach(item => {
      const date = item && item.dt ? new Date(item.dt * 1000).toDateString() : (new Date()).toDateString();
      
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
      
      if (item && item.main && typeof item.main.temp === 'number') dailyForecasts[date].temperatures.push(item.main.temp);
      if (item && Array.isArray(item.weather) && item.weather[0]) dailyForecasts[date].conditions.push(item.weather[0]);
      dailyForecasts[date].precipitation += (item && item.rain && (item.rain['3h'] || 0)) || 0;
      if (item && item.wind && typeof item.wind.speed === 'number') dailyForecasts[date].windSpeeds.push(item.wind.speed);
      if (item && item.main && typeof item.main.humidity === 'number') dailyForecasts[date].humidity.push(item.main.humidity);
    });

    const days = Object.values(dailyForecasts).slice(0, 5).map(day => {
      const temps = day.temperatures || [];
      const hums = day.humidity || [];
      const winds = day.windSpeeds || [];

      return {
        date: day.date,
        tempMin: temps.length ? Math.round(Math.min(...temps)) : null,
        tempMax: temps.length ? Math.round(Math.max(...temps)) : null,
        avgHumidity: hums.length ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : null,
        maxWindSpeed: winds.length ? Math.round(Math.max(...winds)) : null,
        precipitation: Math.round(day.precipitation * 10) / 10,
        mainCondition: this.getMostFrequentCondition(day.conditions || []),
        icon: (day.conditions && day.conditions[0] && day.conditions[0].icon) ? day.conditions[0].icon : '01d'
      };
    });

    return days;
  }

  /**
   * Get most frequent weather condition for the day
   */
  getMostFrequentCondition(conditions) {
    const counts = {};
    if (!Array.isArray(conditions) || conditions.length === 0) return '';
    conditions.forEach(condition => {
      if (!condition || !condition.main) return;
      counts[condition.main] = (counts[condition.main] || 0) + 1;
    });

    const keys = Object.keys(counts);
    if (keys.length === 0) return '';
    return keys.reduce((a, b) => (counts[a] > counts[b] ? a : b));
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