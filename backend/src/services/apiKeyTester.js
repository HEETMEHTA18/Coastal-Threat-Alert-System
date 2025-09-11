// API Key Tester Tool
// Run this to test your OpenWeatherMap API key

const OpenWeatherMapService = require('./openWeatherMapService');

class APIKeyTester {
  static async testKey(apiKey) {
    console.log('\n🔍 TESTING OPENWEATHERMAP API KEY');
    console.log('=' .repeat(50));
    console.log(`Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log('=' .repeat(50));
    
    try {
      const weatherService = new OpenWeatherMapService(apiKey);
      
      // Test 1: Basic API key validation
      console.log('\n📋 Test 1: API Key Validation');
      const keyTest = await weatherService.testAPIKey();
      
      if (keyTest.status !== 'success') {
        console.log('\n❌ API KEY TEST FAILED');
        console.log(`Error: ${keyTest.message}`);
        if (keyTest.suggestions) {
          console.log('\n💡 Suggestions:');
          keyTest.suggestions.forEach((suggestion, index) => {
            console.log(`${index + 1}. ${suggestion}`);
          });
        }
        return false;
      }
      
      console.log('✅ API Key validation passed!');
      
      // Test 2: Current weather
      console.log('\n📋 Test 2: Current Weather Data');
      const currentWeather = await weatherService.getCurrentWeather('Mumbai');
      console.log(`✅ Current weather: ${currentWeather.temperature}°C, ${currentWeather.description}`);
      
      // Test 3: Weather forecast
      console.log('\n� Test 3: Weather Forecast');
      const forecast = await weatherService.getForecast('Mumbai', 3);
      console.log(`✅ 3-day forecast: ${forecast.length} days retrieved`);
      console.log(`   Tomorrow: ${forecast[1]?.maxTemp}°C max, ${forecast[1]?.condition}`);
      
      // Test 4: Geocoding
      console.log('\n� Test 4: Geocoding Service');
      const coordinates = await weatherService.getCoordinates('Mumbai');
      console.log(`✅ Coordinates: ${coordinates.lat}, ${coordinates.lon}`);
      
      // Test 5: Weather by coordinates
      console.log('\n📋 Test 5: Weather by Coordinates');
      const coordWeather = await weatherService.getWeatherByCoordinates(coordinates.lat, coordinates.lon);
      console.log(`✅ Weather by coords: ${coordWeather.temperature}°C`);
      
      // Test 6: UV Index
      console.log('\n📋 Test 6: UV Index');
      try {
        const uvData = await weatherService.getUVIndex(coordinates.lat, coordinates.lon);
        console.log(`✅ UV Index: ${uvData.uvIndex} (${uvData.uvLevel})`);
      } catch (uvError) {
        console.log(`⚠️ UV Index: ${uvError.message} (may require subscription)`);
      }
      
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('Your API key is working perfectly!');
      
      return {
        status: 'success',
        apiKeyValid: true,
        testResults: {
          currentWeather: currentWeather,
          forecast: forecast.slice(0, 2),
          coordinates: coordinates
        }
      };
      
    } catch (error) {
      console.log('\n❌ API KEY TEST FAILED');
      console.log(`Error: ${error.message}`);
      
      if (error.message.includes('401')) {
        console.log('\n💡 Common solutions for "Invalid API key":');
        console.log('1. Wait 10-60 minutes for new API keys to activate');
        console.log('2. Check if you copied the full API key correctly');
        console.log('3. Verify your email address on OpenWeatherMap');
        console.log('4. Generate a new API key from your dashboard');
      }
      
      return {
        status: 'error',
        error: error.message,
        apiKeyValid: false
      };
    }
  }
  
  static async quickTest(apiKey) {
    console.log(`\n⚡ Quick testing API key: ${apiKey.substring(0, 8)}...`);
    
    try {
      const url = `http://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ WORKING! Temperature in ${data.name}: ${Math.round(data.main.temp - 273.15)}°C`);
        return true;
      } else {
        const errorData = await response.json();
        console.log(`❌ NOT WORKING! Error: ${errorData.message}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      return false;
    }
  }
}

// If running this file directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n🔑 API Key Tester');
    console.log('Usage: node apiKeyTester.js <your_api_key>');
    console.log('Example: node apiKeyTester.js a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
    console.log('\nOr set environment variable:');
    console.log('OPENWEATHER_API_KEY=your_key node apiKeyTester.js');
    process.exit(1);
  }
  
  const apiKey = args[0] || process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key provided');
    process.exit(1);
  }
  
  // Run comprehensive test
  APIKeyTester.testKey(apiKey)
    .then(result => {
      if (result.status === 'success') {
        console.log('\n✅ Your API key is ready to use in your CTAS project!');
        process.exit(0);
      } else {
        console.log('\n❌ Please fix the API key issues and try again.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.log('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = APIKeyTester;
