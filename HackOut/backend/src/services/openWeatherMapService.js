// Real OpenWeatherMap API Service
// Use this with your actual API key from openweathermap.org

class OpenWeatherMapService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'http://api.openweathermap.org/data/2.5';
    this.oneCallUrl = 'https://api.openweathermap.org/data/3.0/onecall';
    this.geoUrl = 'http://api.openweathermap.org/geo/1.0';
    
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key is required');
    }
    
    console.log(`🌤️ OpenWeatherMap Service initialized with API key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  }

  async getCurrentWeather(city = 'Mumbai') {
    try {
      const url = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`;
      console.log(`🔍 Fetching current weather for ${city}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenWeatherMap API Error ${response.status}: ${errorData.message}`);
      }
      
      const data = await response.json();
      
      return {
        location: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        visibility: data.visibility / 1000, // Convert to km
        cloudiness: data.clouds.all,
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString(),
        coordinates: {
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        timestamp: new Date().toISOString(),
        source: 'openweathermap',
        apiKeyUsed: true
      };
    } catch (error) {
      console.error('Current weather error:', error.message);
      throw error;
    }
  }

  async getForecast(city = 'Mumbai', days = 5) {
    try {
      const url = `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`;
      console.log(`📅 Fetching ${days}-day forecast for ${city}...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenWeatherMap API Error ${response.status}: ${errorData.message}`);
      }
      
      const data = await response.json();
      
      // Group forecasts by day
      const dailyForecasts = {};
      
      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyForecasts[date]) {
          dailyForecasts[date] = {
            date: date,
            temps: [],
            conditions: [],
            humidity: [],
            pressure: [],
            windSpeed: [],
            precipitation: 0
          };
        }
        
        dailyForecasts[date].temps.push(item.main.temp);
        dailyForecasts[date].conditions.push(item.weather[0].description);
        dailyForecasts[date].humidity.push(item.main.humidity);
        dailyForecasts[date].pressure.push(item.main.pressure);
        dailyForecasts[date].windSpeed.push(item.wind.speed);
        
        if (item.rain) {
          dailyForecasts[date].precipitation += item.rain['3h'] || 0;
        }
      });
      
      // Process daily data
      const forecast = Object.values(dailyForecasts).slice(0, days).map(day => ({
        date: day.date,
        maxTemp: Math.round(Math.max(...day.temps)),
        minTemp: Math.round(Math.min(...day.temps)),
        avgTemp: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
        condition: day.conditions[0], // Most common condition
        humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
        pressure: Math.round(day.pressure.reduce((a, b) => a + b, 0) / day.pressure.length),
        windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length),
        precipitation: Math.round(day.precipitation * 10) / 10
      }));
      
      return forecast;
    } catch (error) {
      console.error('Forecast error:', error.message);
      throw error;
    }
  }

  async getCoordinates(city) {
    try {
      const url = `${this.geoUrl}/direct?q=${city}&limit=1&appid=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Geocoding API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error(`City "${city}" not found`);
      }
      
      return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name,
        country: data[0].country,
        state: data[0].state
      };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw error;
    }
  }

  async getWeatherByCoordinates(lat, lon) {
    try {
      const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      console.log(`🌍 Fetching weather for coordinates: ${lat}, ${lon}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenWeatherMap API Error ${response.status}: ${errorData.message}`);
      }
      
      const data = await response.json();
      
      return {
        location: data.name || 'Unknown Location',
        coordinates: { lat: data.coord.lat, lon: data.coord.lon },
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        timestamp: new Date().toISOString(),
        source: 'openweathermap'
      };
    } catch (error) {
      console.error('Weather by coordinates error:', error.message);
      throw error;
    }
  }

  async getUVIndex(lat, lon) {
    try {
      const url = `${this.baseUrl}/uvi?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`UV Index API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        uvIndex: data.value,
        uvLevel: this.getUVLevel(data.value),
        coordinates: { lat: lat, lon: lon },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('UV Index error:', error.message);
      throw error;
    }
  }

  getUVLevel(uvIndex) {
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
  }

  async testAPIKey() {
    try {
      console.log('🧪 Testing OpenWeatherMap API key...');
      
      const testUrl = `${this.baseUrl}/weather?q=London&appid=${this.apiKey}`;
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Key is WORKING!');
        console.log(`📍 Test Location: ${data.name}, ${data.sys.country}`);
        console.log(`🌡️ Temperature: ${Math.round(data.main.temp - 273.15)}°C`);
        console.log(`🌤️ Weather: ${data.weather[0].description}`);
        
        return {
          status: 'success',
          message: 'API key is working perfectly!',
          testData: {
            location: data.name,
            temperature: Math.round(data.main.temp - 273.15),
            condition: data.weather[0].description
          }
        };
      } else {
        const errorData = await response.json();
        console.log('❌ API Key is NOT WORKING');
        console.log(`Error: ${errorData.message}`);
        
        return {
          status: 'error',
          message: errorData.message,
          code: errorData.cod,
          suggestions: this.getErrorSuggestions(errorData.cod)
        };
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
      return {
        status: 'network_error',
        message: error.message
      };
    }
  }

  getErrorSuggestions(errorCode) {
    switch (errorCode) {
      case 401:
        return [
          'Check if your API key is correct',
          'Wait 10-60 minutes for new API keys to activate',
          'Verify your email address',
          'Generate a new API key from your dashboard'
        ];
      case 404:
        return [
          'Check the city name spelling',
          'Try using coordinates instead',
          'Use full city name with country code'
        ];
      case 429:
        return [
          'You have exceeded the API call limit',
          'Wait for the rate limit to reset',
          'Consider upgrading your plan'
        ];
      default:
        return ['Check OpenWeatherMap documentation for error details'];
    }
  }
}

module.exports = OpenWeatherMapService;
