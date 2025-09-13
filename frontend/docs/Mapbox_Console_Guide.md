# 🌊 Mapbox Console Guide for Coastal Threat Alert System (CTAS)

## 🚀 Getting Started

### Step 1: Create Mapbox Account
1. Go to: https://account.mapbox.com/auth/signup/
2. Sign up with email or GitHub
3. Verify email address

### Step 2: Access Tokens (MOST IMPORTANT)
```
🔗 Direct Link: https://account.mapbox.com/access-tokens/

What you'll find:
├── Default public token (pk.ey...)
├── Create new token button
├── Token permissions/scopes
└── Usage statistics
```

**For CTAS, copy your public token to:**
```bash
# Add to frontend/.env
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoieour-username-here...
```

## 🎨 Mapbox Studio (Design & Data)

### Map Styles Section
```
🔗 Link: https://studio.mapbox.com/styles/

Available Styles for CTAS:
├── 🛰️ Satellite Streets (satellite-streets-v12)
├── 🌍 Satellite (satellite-v9)
├── 🗺️ Outdoors (outdoors-v12)
├── 🌊 Navigation (navigation-preview-day-v4)
└── 🎨 Custom styles (create your own)
```

### Datasets Section 
```
🔗 Link: https://studio.mapbox.com/datasets/

Upload Your Coastal Data:
├── 📍 Emergency Shelter Locations (.geojson)
├── 🌊 Coastal Risk Zones (.geojson)
├── 🚨 Evacuation Routes (.geojson)
├── 🏥 Hospital Locations (.csv with lat/lng)
└── 🌡️ Weather Station Data (.geojson)
```

### Tilesets Section
```
🔗 Link: https://studio.mapbox.com/tilesets/

Convert Data to Map Layers:
├── Vector tiles (for interactive features)
├── Raster tiles (for imagery)
├── Custom styling rules
└── Performance optimization
```

## 📊 Analytics & Usage

### Account Dashboard
```
🔗 Link: https://account.mapbox.com/

Monitor Your Usage:
├── 📈 Monthly API requests (50,000 free)
├── 🗺️ Map loads tracking
├── 🔍 Geocoding requests
├── 🧭 Directions API calls
└── 💰 Billing information
```

## 🛰️ What's Available for Coastal Monitoring

### Satellite Imagery
```
✅ High-resolution satellite views
✅ Updated imagery (varies by location)
✅ Street overlay option
✅ 3D terrain visualization
✅ Custom zoom levels (0-22)
```

### Weather Integration (3rd Party)
```
🌡️ OpenWeatherMap integration
🌧️ Weather radar overlays
🌊 Ocean current data (NOAA)
⚡ Storm tracking
🌪️ Hurricane paths
```

### Marine Features
```
🚢 Port and harbor data
🏖️ Coastline boundaries
🌊 Bathymetry (ocean depth)
⛵ Navigation markers
🚨 Maritime emergency zones
```

## 💰 Pricing Breakdown (2025)

### Free Tier (Perfect for Development)
```
Monthly Limits:
├── 50,000 map loads
├── 100,000 geocoding requests
├── 100,000 directions requests
├── 50 GB tileset storage
└── All basic map styles
```

### Pay-as-you-Scale
```
Overage Pricing:
├── Map loads: $5 per 1,000 additional
├── Geocoding: $0.50 per 1,000 additional  
├── Directions: $0.50 per 1,000 additional
└── Storage: $0.50 per GB monthly
```

## 🔧 CTAS Implementation Steps

### 1. Get Your Token
```bash
# Visit: https://account.mapbox.com/access-tokens/
# Copy the default public token (starts with pk.ey)
# Add to your .env file
```

### 2. Install Mapbox GL JS
```bash
npm install mapbox-gl
```

### 3. Basic Implementation
```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'YOUR_TOKEN_HERE';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [72.8777, 19.0760], // Mumbai
  zoom: 10
});
```

## 🎯 Recommended Setup for CTAS

### Essential Features to Enable:
```
✅ Satellite imagery (primary view)
✅ Geocoding (location search)
✅ Custom markers (threat indicators)
✅ GeoJSON layers (risk zones)
✅ Popup notifications
✅ User location tracking
✅ Offline map caching
```

### Data Sources to Integrate:
```
🌊 NOAA Ocean Data
🌡️ OpenWeatherMap
🛰️ NASA Earth Data  
📡 Local weather stations
🚨 Emergency services APIs
```

## 🔍 Finding Specific Features

### Custom Map Styles
```
Path: Studio → Styles → New Style
Options:
├── Start from template
├── Upload custom data
├── Modify existing style
└── Share with team
```

### Data Upload
```
Path: Studio → Datasets → New Dataset
Formats:
├── GeoJSON (.geojson)
├── CSV with coordinates
├── Shapefile (.shp)
├── KML/KMZ
└── GPX tracks
```

### API Documentation
```
🔗 docs.mapbox.com/api/
Sections:
├── Maps API (display maps)
├── Geocoding API (search)
├── Directions API (routing)
├── Matrix API (travel times)
└── Vision API (AR features)
```

This should give you everything you need to navigate Mapbox Console and implement the perfect mapping solution for your Coastal Threat Alert System!