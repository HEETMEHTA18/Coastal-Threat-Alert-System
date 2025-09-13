# Mapbox Studio Dataset Upload Guide

This guide explains how to upload your coastal threat data to Mapbox Studio to create professional tilesets and custom styles.

## 📁 Datasets to Upload

### 1. Coastal Threat Zones (coastal-threat-zones.geojson)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Mumbai High Risk Zone",
        "threatLevel": "critical",
        "riskScore": 0.85,
        "floodRisk": 0.9,
        "stormSurgeRisk": 0.8,
        "coastalErosion": 0.3,
        "seaLevelRise": 0.15,
        "population": 150000,
        "lastUpdated": "2025-09-12T17:00:00Z",
        "alerts": ["Storm surge warning", "High tide alert"],
        "recommendations": ["Evacuate low-lying areas", "Move to higher ground"],
        "emergencyContacts": ["Mumbai Emergency: 108", "Coast Guard: 1554"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [72.8100, 19.0200],
          [72.9000, 19.0200],
          [72.9000, 19.1000],
          [72.8100, 19.1000],
          [72.8100, 19.0200]
        ]]
      }
    }
  ]
}
```

### 2. Emergency Shelters (emergency-shelters.geojson)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Bandra Community Center",
        "capacity": 500,
        "type": "Community Center",
        "address": "Bandra West, Mumbai, Maharashtra",
        "contact": "+91-22-2640-3456",
        "facilities": ["Medical Aid", "Food", "Communications", "Generators"],
        "accessibility": "Wheelchair accessible",
        "operatingStatus": "Active",
        "lastInspected": "2025-09-01"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [72.8401, 19.0596]
      }
    }
  ]
}
```

### 3. Early Warning Sensors (warning-sensors.geojson)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "sensorId": "MUM-001",
        "type": "Tidal Gauge",
        "status": "Active",
        "lastReading": "2025-09-12T16:30:00Z",
        "waterLevel": 2.45,
        "alertThreshold": 3.0,
        "battery": 85,
        "dataFrequency": "5 minutes"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [72.8777, 19.0760]
      }
    }
  ]
}
```

## 🔧 Step-by-Step Upload Process

### Step 1: Create Mapbox Account
1. Go to [mapbox.com](https://mapbox.com)
2. Create account and verify email
3. Get your access token from [Account Dashboard](https://account.mapbox.com)

### Step 2: Upload Data to Studio
1. Go to [Mapbox Studio](https://studio.mapbox.com)
2. Click **Tilesets** in sidebar
3. Click **New tileset** → **Upload file**
4. Upload each GeoJSON file (max 300MB per file)
5. Configure tileset settings:
   - **Name**: Descriptive name (e.g., "CTAS Coastal Threat Zones")
   - **Map ID**: Auto-generated unique identifier
   - **Zoom levels**: 0-14 for regional view, 0-18 for detailed view

### Step 3: Create Custom Style
1. Click **Styles** in sidebar
2. Click **New style** → **Blank** or **Satellite**
3. Name your style (e.g., "CTAS Coastal Monitoring")
4. Add your tilesets as layers:

#### Threat Zones Layer Configuration:
```json
{
  "id": "threat-zones-fill",
  "type": "fill",
  "source": "coastal-threat-zones-tileset-id",
  "paint": {
    "fill-color": [
      "case",
      ["==", ["get", "threatLevel"], "critical"], "#dc2626",
      ["==", ["get", "threatLevel"], "high"], "#ea580c", 
      ["==", ["get", "threatLevel"], "medium"], "#d97706",
      "#16a34a"
    ],
    "fill-opacity": 0.6
  }
}
```

#### Shelter Layer Configuration:
```json
{
  "id": "emergency-shelters",
  "type": "circle", 
  "source": "emergency-shelters-tileset-id",
  "paint": {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8, 4,
      14, 8
    ],
    "circle-color": "#22c55e",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2
  }
}
```

### Step 4: Configure Interactivity
1. In Style editor, select layer
2. Click **Select data** → Add hover/click interactions
3. Configure popup templates:

```json
{
  "name": "{{name}}",
  "threatLevel": "{{threatLevel}}",
  "population": "{{population}}",
  "alerts": "{{alerts}}"
}
```

### Step 5: Update Component with Style URL
Replace the style URL in `MapboxCoastalMonitor.jsx`:

```javascript
// Replace this line:
style: `mapbox://styles/mapbox/${mapStyle}`,

// With your custom style:
style: 'mapbox://styles/YOUR_USERNAME/YOUR_STYLE_ID',
```

## 🎨 Style Customization Options

### Color Schemes for Threat Levels:
- **Critical**: `#dc2626` (Red)
- **High**: `#ea580c` (Orange) 
- **Medium**: `#d97706` (Yellow)
- **Low**: `#16a34a` (Green)

### Symbol Options for Shelters:
- **Circle**: Simple circular markers
- **Icon**: Custom shelter icons (upload SVG/PNG)
- **3D**: Extrude buildings for 3D effect

### Zoom-Based Styling:
```json
{
  "circle-radius": [
    "interpolate", 
    ["linear"],
    ["zoom"],
    5, 2,    // Zoom 5: 2px radius
    10, 6,   // Zoom 10: 6px radius  
    15, 12   // Zoom 15: 12px radius
  ]
}
```

## 📊 Data-Driven Styling

### Risk Score Based Colors:
```json
{
  "fill-color": [
    "interpolate",
    ["linear"],
    ["get", "riskScore"],
    0, "#16a34a",
    0.5, "#d97706", 
    0.8, "#ea580c",
    1, "#dc2626"
  ]
}
```

### Population Density Visualization:
```json
{
  "circle-radius": [
    "interpolate",
    ["linear"],
    ["get", "population"],
    0, 4,
    50000, 8,
    100000, 12,
    200000, 16
  ]
}
```

## 🔄 Update Process

### Option 1: Replace Tileset Data
1. Go to **Tilesets** → Select tileset
2. Click **Replace** → Upload new GeoJSON
3. Confirm replacement
4. Style automatically updates

### Option 2: Version Control
1. Upload as new tileset with version suffix
2. Update source in style editor
3. Publish new style version

## 🚀 Integration Code

### Using Custom Style in React Component:
```javascript
// Initialize map with custom style
map.current = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/YOUR_USERNAME/YOUR_STYLE_ID',
  center: [lng, lat],
  zoom: zoom,
  projection: 'globe'
});

// Add interactivity for tilesets
map.current.on('click', 'threat-zones-layer', (e) => {
  // Handle click events
  const properties = e.features[0].properties;
  // Create popup or update UI
});
```

## 📈 Performance Optimization

### Tileset Optimization:
- **Simplify geometry** for lower zoom levels
- **Remove unnecessary properties** for performance
- **Use appropriate zoom ranges** (0-14 for regional, 15-18 for detailed)

### Layer Optimization:
- **Use expressions** instead of multiple layers
- **Filter by zoom** to show/hide detailed features
- **Cluster points** at lower zoom levels

## 🔒 Security & Access

### Access Tokens:
- **Public token**: For client-side applications (restricted by URL)
- **Secret token**: For server-side uploads and management
- **Scoped tokens**: Limit access to specific APIs/styles

### URL Restrictions:
Add your domain to token restrictions:
- `https://yourdomain.com/*`
- `http://localhost:*` (for development)

This comprehensive setup will give you professional-grade coastal monitoring maps with real-time data integration!