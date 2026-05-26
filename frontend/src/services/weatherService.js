import apiCache from '../utils/apiCache';
import requestDebouncer from '../utils/requestDebounce';

// Weather Service for real-time weather data integration
class WeatherService {
  constructor() {
    // Prefer server-side proxy to avoid exposing API keys in the browser.
    // Use the canonical env var name used elsewhere in the frontend
    this.apiKey = import.meta.env.VITE_WEATHER_API_KEY || '';
    this.nodeBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cacheTTL = {
      current: 5 * 60 * 1000, // 5 minutes for current weather
      forecast: 30 * 60 * 1000, // 30 minutes for forecast
      historical: 60 * 60 * 1000 // 1 hour for historical data
    };
  }

  /**
   * Get current weather for coordinates
   */
  async getCurrentWeather(lat, lon) {
    // Check cache first
    const cacheKey = `weather_current_${lat}_${lon}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Debounce request
    const requestKey = requestDebouncer.generateKey(`/api/openweather/current`, 'GET', { lat, lon });
    
    return requestDebouncer.debounce(requestKey, async () => {
      try {
        console.debug && console.debug('weatherService.getCurrentWeather called', { lat, lon });
        // Use server-side proxy only. The backend owns WEATHER_API_KEY and returns
        // the normalized OpenWeather response shape used by the widget.
        const proxyUrl = `${this.nodeBase.replace(/\/$/, '')}/api/openweather/current?lat=${lat}&lon=${lon}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`OpenWeather proxy responded ${response.status} ${text}`);
        }

        const payload = await response.json();
        console.debug && console.debug('weatherService proxy response for current:', payload);
        if (payload && payload.status === 'success' && payload.data) {
          const data = payload.data.main && payload.data.weather
            ? payload.data
            : this.formatCurrentWeather(payload.data);
          apiCache.set(cacheKey, data, this.cacheTTL.current);
          return data;
        }

        throw new Error(payload?.message || 'OpenWeather proxy returned no data');
      } catch (error) {
        console.error('Failed to fetch current weather:', error);
        return null;
      }
    });
  }

  /**
   * Get 5-day weather forecast
   */
  async getWeatherForecast(lat, lon) {
    // Check cache first
    const cacheKey = `weather_forecast_${lat}_${lon}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Debounce request
    const requestKey = requestDebouncer.generateKey(`/api/openweather/forecast`, 'GET', { lat, lon });
    
    return requestDebouncer.debounce(requestKey, async () => {
      try {
        console.debug && console.debug('weatherService.getWeatherForecast called', { lat, lon });
        // Use server-side proxy only.
        const proxyUrl = `${this.nodeBase.replace(/\/$/, '')}/api/openweather/forecast?lat=${lat}&lon=${lon}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`OpenWeather forecast proxy responded ${response.status} ${text}`);
        }

        const payload = await response.json();
        console.debug && console.debug('weatherService proxy response for forecast:', payload);
        if (payload && payload.status === 'success' && payload.data) {
          const formatted = Array.isArray(payload.data) ? payload.data : this.formatForecast(payload.data);
          apiCache.set(cacheKey, formatted, this.cacheTTL.forecast);
          return formatted;
        }

        throw new Error(payload?.message || 'OpenWeather forecast proxy returned no data');
    } catch (error) {
      console.error('Failed to fetch weather forecast:', error);
      return null;
    }
    });
  }

  /**
   * Get weather alerts if available
   */
  async getWeatherAlerts(lat, lon) {
    try {
      const proxyUrl = `${this.nodeBase.replace(/\/$/, '')}/api/openweather/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`OpenWeather onecall proxy responded ${response.status} ${text}`);
      }

      const payload = await response.json();
      if (payload && payload.status === 'success' && payload.data) {
        return payload.data.alerts || [];
      }

      throw new Error(payload?.message || 'OpenWeather onecall proxy returned no data');
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