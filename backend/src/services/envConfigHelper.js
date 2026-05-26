// Environment Configuration Helper
// Use this to update your .env file with a working API key

const fs = require('fs');
const path = require('path');

class EnvConfigHelper {
  constructor() {
    this.envPath = path.join(__dirname, '../../../.env');
  }

  updateAPIKey(apiKey) {
    try {
      console.log('📝 Updating .env file with new API key...');
      
      // Read current .env file
      let envContent = '';
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }
      
      // Update the canonical weather API key name.
      const lines = envContent.split('\n');
      let weatherKeyUpdated = false;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('WEATHER_API_KEY=')) {
          lines[i] = `WEATHER_API_KEY=${apiKey}`;
          weatherKeyUpdated = true;
        }
      }
      
      // If the key wasn't found, add it.
      if (!weatherKeyUpdated) {
        lines.push(`WEATHER_API_KEY=${apiKey}`);
      }
      
      // Write back to file
      fs.writeFileSync(this.envPath, lines.join('\n'));
      
      console.log('✅ .env file updated successfully!');
      console.log(`📍 API key set: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error updating .env file:', error.message);
      return false;
    }
  }

  validateEnvFile() {
    try {
      if (!fs.existsSync(this.envPath)) {
        console.log('⚠️ .env file not found. Creating one...');
        this.createDefaultEnvFile();
        return false;
      }
      
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const hasAPIKey = envContent.includes('WEATHER_API_KEY=') && !envContent.includes('WEATHER_API_KEY=your_weather_api_key_here');
      
      if (hasAPIKey) {
        const match = envContent.match(/WEATHER_API_KEY=([^\n\r]+)/);
        if (match && match[1].length > 10) {
          console.log('✅ Valid API key found in .env file');
          return match[1];
        }
      }
      
      console.log('⚠️ No valid API key found in .env file');
      return false;
    } catch (error) {
      console.error('❌ Error reading .env file:', error.message);
      return false;
    }
  }

  createDefaultEnvFile() {
    const defaultEnv = `# Environment Variables for CTAS
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/coastal-threat-db
REDIS_URL=redis://localhost:6379

# API Keys
WEATHER_API_KEY=your_weather_api_key_here
NASA_API_KEY=your_nasa_api_key_here
SENTINEL_API_KEY=your_sentinel_api_key_here

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password_here

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
`;

    try {
      fs.writeFileSync(this.envPath, defaultEnv);
      console.log('✅ Default .env file created');
      return true;
    } catch (error) {
      console.error('❌ Error creating .env file:', error.message);
      return false;
    }
  }

  showEnvStatus() {
    console.log('\n📋 ENVIRONMENT STATUS CHECK');
    console.log('=' .repeat(40));
    
    const apiKey = this.validateEnvFile();
    
    if (apiKey) {
      console.log(`✅ API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    } else {
      console.log('❌ No valid API key configured');
    }
    
    console.log(`📁 .env file location: ${this.envPath}`);
    console.log('=' .repeat(40));
    
    return apiKey;
  }
}

module.exports = EnvConfigHelper;
