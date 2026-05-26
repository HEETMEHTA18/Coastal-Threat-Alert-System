const axios = require('axios');

class EnhancedCoastalDataService {
  constructor() {
    this.noaaApiKey = process.env.NOAA_API_KEY;
    this.noaaBaseUrl = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
    this.waveDataCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get comprehensive coastal data for enhanced satellite view
  async getEnhancedCoastalData(station = 'cb0201', bounds = null) {
    try {
      console.log(`🌊 Fetching enhanced coastal data for station: ${station}`);
      
      const data = await Promise.all([
        this.getWaveData(station),
        this.getTemperatureData(station),
        this.getCurrentData(station),
        this.getWindData(station),
        this.getTideData(station),
        this.getBuoyNetwork(bounds)
      ]);

      const [waveData, tempData, currentData, windData, tideData, buoyNetwork] = data;

      return {
        success: true,
        station_id: station,
        timestamp: new Date().toISOString(),
        location: this.getStationInfo(station),
        wave_data: waveData,
        temperature_data: tempData,
        current_data: currentData,
        wind_data: windData,
        tide_data: tideData,
        buoy_network: buoyNetwork,
        heatmap_data: this.generateHeatmapData(waveData, tempData, currentData),
        animation_frames: this.generateAnimationFrames(waveData, currentData)
      };

    } catch (error) {
      console.error('Enhanced Coastal Data Service Error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback_data: this.getFallbackData(station)
      };
    }
  }

  // Get wave height and frequency data
  async getWaveData(station) {
    try {
      // NOAA doesn't have direct wave data for all stations, so we'll simulate based on conditions
      const params = {
        product: 'water_level',
        station: station,
        date: 'latest',
        datum: 'MLLW',
        time_zone: 'gmt',
        units: 'metric',
        format: 'json'
      };

      const response = await axios.get(this.noaaBaseUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data) {
        const waterLevel = parseFloat(response.data.data[0]?.v || 0);
        
        // Simulate wave data based on water level variations and station location
        return this.simulateWaveData(station, waterLevel);
      }

      return this.getDefaultWaveData();

    } catch (error) {
      console.error('Wave data fetch error:', error.message);
      return this.getDefaultWaveData();
    }
  }

  // Get sea surface temperature data
  async getTemperatureData(station) {
    try {
      const params = {
        product: 'water_temperature',
        station: station,
        date: 'latest',
        time_zone: 'gmt',
        units: 'metric',
        format: 'json'
      };

      const response = await axios.get(this.noaaBaseUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data) {
        const temperature = parseFloat(response.data.data[0]?.v || 20);
        return this.generateTemperatureGrid(station, temperature);
      }

      return this.getDefaultTemperatureData();

    } catch (error) {
      console.error('Temperature data fetch error:', error.message);
      return this.getDefaultTemperatureData();
    }
  }

  // Get current data (we already have this, but enhance it)
  async getCurrentData(station) {
    try {
      const params = {
        product: 'currents',
        station: station,
        date: 'latest',
        datum: 'MLLW',
        time_zone: 'gmt',
        units: 'metric',
        format: 'json'
      };

      const response = await axios.get(this.noaaBaseUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data) {
        return this.enhanceCurrentData(response.data.data);
      }

      return this.getDefaultCurrentData();

    } catch (error) {
      console.error('Current data fetch error:', error.message);
      return this.getDefaultCurrentData();
    }
  }

  // Get wind data
  async getWindData(station) {
    try {
      const params = {
        product: 'wind',
        station: station,
        date: 'latest',
        time_zone: 'gmt',
        units: 'metric',
        format: 'json'
      };

      const response = await axios.get(this.noaaBaseUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.data) {
        const windData = response.data.data[0];
        return {
          speed: parseFloat(windData.s || 0),
          direction: parseFloat(windData.d || 0),
          gust: parseFloat(windData.g || 0),
          timestamp: windData.t
        };
      }

      return { speed: 5, direction: 180, gust: 8, timestamp: new Date().toISOString() };

    } catch (error) {
      console.error('Wind data fetch error:', error.message);
      return { speed: 5, direction: 180, gust: 8, timestamp: new Date().toISOString() };
    }
  }

  // Get tide data
  async getTideData(station) {
    try {
      const params = {
        product: 'predictions',
        station: station,
        begin_date: new Date().toISOString().split('T')[0],
        range: 24,
        datum: 'MLLW',
        time_zone: 'gmt',
        units: 'metric',
        format: 'json'
      };

      const response = await axios.get(this.noaaBaseUrl, { params, timeout: 10000 });
      
      if (response.data && response.data.predictions) {
        return response.data.predictions.slice(0, 48); // Next 48 hours
      }

      return this.getDefaultTideData();

    } catch (error) {
      console.error('Tide data fetch error:', error.message);
      return this.getDefaultTideData();
    }
  }

  // Get buoy network data for Indian coastal areas
  async getBuoyNetwork(bounds) {
    // If viewport bounds provided, attempt to load real buoy/station catalog from NOAA NDBC
    if (bounds && bounds.sw && bounds.ne) {
      try {
        const sw = bounds.sw; const ne = bounds.ne;
        const bbox = { minLat: Math.min(sw.lat, ne.lat), maxLat: Math.max(sw.lat, ne.lat), minLng: Math.min(sw.lng, ne.lng), maxLng: Math.max(sw.lng, ne.lng) };

        // Fetch station table from NDBC (public text list)
        const axios = require('axios');
        const stationsTxtUrl = 'https://www.ndbc.noaa.gov/data/stations/station_table.txt';
        const resp = await axios.get(stationsTxtUrl, { timeout: 10000 });
        const lines = String(resp.data || '').split(/\r?\n/).filter(l => l.trim().length > 0);
        const stations = [];
        for (const line of lines) {
          // Each line typically has station id, latitude, longitude, etc. We'll extract first token and the first two floats we find
          const tokens = line.trim().split(/\s+/);
          if (tokens.length < 3) continue;
          const id = tokens[0];
          // find floats in the line for lat/lon
          const floatMatches = line.match(/-?\d+\.\d+/g);
          if (!floatMatches || floatMatches.length < 2) continue;
          const lat = parseFloat(floatMatches[0]);
          const lng = parseFloat(floatMatches[1]);
          if (isNaN(lat) || isNaN(lng)) continue;
          // filter by bbox
          if (lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng) {
            stations.push({ id, name: tokens.slice(1,4).join(' '), coordinates: [lng, lat] });
          }
        }

        // If stations found, enrich them with a quick realtime fetch if possible, otherwise simulated data
        const enriched = [];
        for (const s of stations.slice(0, 120)) { // cap to 120 stations to avoid flooding
          let data = null;
          try {
            // try realtime2 text feed for station
            const stationDataUrl = `https://www.ndbc.noaa.gov/data/realtime2/${s.id}.txt`;
            const dresp = await axios.get(stationDataUrl, { timeout: 5000 });
            // simple parsing: the last non-header line contains last values; we won't attempt full column mapping here
            const dlines = String(dresp.data || '').split(/\r?\n/).filter(l => l.trim().length > 0);
            const last = dlines[dlines.length - 1] || '';
            data = this.parseRealtimeLine(last) || null;
          } catch (e) {
            // ignore realtime fetch failures - we'll simulate a lightweight observation
            data = null;
          }

          enriched.push({
            id: s.id,
            name: s.name || s.id,
            coordinates: s.coordinates,
            type: 'ndbc_station',
            state: 'catalog',
            region: s.coordinates[1] >= 0 ? 'northern' : 'southern',
            status: 'operational',
            data: data || this.generateIndianCoastalData('buoy', 'global'),
            environmental_conditions: this.getRegionalConditions(s.coordinates[1] >= 0 ? 'northern' : 'southern'),
            last_updated: new Date().toISOString()
          });
        }

        if (enriched.length > 0) return enriched;
      } catch (err) {
        // If NOAA fetch fails, fall back to viewport-simulated buoys
        console.warn('NDBC station fetch failed or timed out:', err.message);
      }

      // viewport-simulated buoys fallback
      const sw = bounds.sw; const ne = bounds.ne;
      const latSpan = Math.abs(ne.lat - sw.lat);
      const lngSpan = Math.abs(ne.lng - sw.lng);
      const approxCount = Math.min(60, Math.max(6, Math.round((latSpan * lngSpan) * 8)));
      const buoys = [];
      for (let i = 0; i < approxCount; i++) {
        const lat = sw.lat + Math.random() * latSpan;
        const lng = sw.lng + Math.random() * lngSpan;
        const id = `b_${Math.random().toString(36).substr(2,8)}`;
        const region = (lat > 0) ? 'northern' : 'southern';
        const type = Math.random() > 0.7 ? 'offshore_platform' : (Math.random() > 0.5 ? 'monitoring_station' : 'buoy');
        buoys.push({
          id,
          name: `Buoy ${id}`,
          coordinates: [lng, lat],
          type,
          state: 'dynamic',
          region,
          status: 'operational',
          data: this.generateIndianCoastalData(type, region),
          environmental_conditions: this.getRegionalConditions(region),
          last_updated: new Date().toISOString()
        });
      }
      return buoys;
    }

    // Fallback: return a set of predefined Indian stations
    const indianCoastalStations = [
      {
        id: 'mumbai_port',
        name: 'Mumbai Port - Gateway of India',
        coordinates: [72.8347, 18.9220],
        type: 'major_port',
        state: 'Maharashtra',
        region: 'arabian_sea',
        status: 'operational'
      },
      {
        id: 'kandla_port',
        name: 'Kandla Port - Gujarat',
        coordinates: [70.2167, 23.0333],
        type: 'major_port',
        state: 'Gujarat',
        region: 'gulf_of_kutch',
        status: 'operational'
      },
      {
        id: 'okha_port',
        name: 'Okha Port - Dwarka',
        coordinates: [69.0781, 22.4821],
        type: 'fishing_port',
        state: 'Gujarat',
        region: 'arabian_sea',
        status: 'operational'
      }
    ];
    return indianCoastalStations.map(station => ({
      ...station,
      data: this.generateIndianCoastalData(station.type, station.region),
      environmental_conditions: this.getRegionalConditions(station.region),
      last_updated: new Date().toISOString()
    }));
  }

  // Generate heatmap data for visualization
  generateHeatmapData(waveData, tempData, currentData) {
    const heatmapPoints = [];
    
    // Create grid of data points for heatmap
    const bounds = {
      north: 37.2,
      south: 36.7,
      east: -75.8,
      west: -76.5
    };

    const gridSize = 0.02; // Degree spacing
    
    for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
      for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
        const point = {
          coordinates: [lng, lat],
          wave_height: this.interpolateWaveHeight(lng, lat, waveData),
          temperature: this.interpolateTemperature(lng, lat, tempData),
          current_speed: this.interpolateCurrentSpeed(lng, lat, currentData),
          intensity: this.calculateIntensity(lng, lat, waveData, tempData, currentData)
        };
        
        heatmapPoints.push(point);
      }
    }

    return heatmapPoints;
  }

  // Generate animation frames for wave propagation
  generateAnimationFrames(waveData, currentData) {
    const frames = [];
    const frameCount = 60; // 60 frames for smooth animation
    
    for (let frame = 0; frame < frameCount; frame++) {
      const time = (frame / frameCount) * Math.PI * 2;
      
      frames.push({
        frame_id: frame,
        timestamp: Date.now() + (frame * 100), // 100ms per frame
        wave_field: this.generateWaveField(time, waveData),
        current_vectors: this.generateCurrentVectors(time, currentData)
      });
    }

    return frames;
  }

  // Simulate wave data based on station conditions
  simulateWaveData(station, waterLevel) {
    const stationInfo = this.getStationInfo(station);
    const baseWaveHeight = 1.5 + Math.random() * 2; // 1.5-3.5m base
    
    return {
      significant_height: baseWaveHeight,
      dominant_period: 7 + Math.random() * 5, // 7-12 seconds
      average_period: 6 + Math.random() * 3,
      peak_direction: 120 + Math.random() * 120, // 120-240 degrees
      water_level_influence: Math.abs(waterLevel) * 0.1,
      station_info: stationInfo,
      quality: 'simulated'
    };
  }

  // Parse a realtime station line (very lightweight best-effort)
  parseRealtimeLine(line) {
    try {
      if (!line || typeof line !== 'string') return null;
      const parts = line.trim().split(/\s+/);
      // find numeric tokens
      const nums = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));
      if (nums.length < 1) return null;
      const wave_height = nums[0];
      return {
        wave_height: wave_height || 0,
        wave_period: nums[1] || null,
        wave_direction: nums[2] || null,
        wind_speed: nums[3] || null,
        wind_direction: nums[4] || null,
        raw: line
      };
    } catch (e) {
      return null;
    }
  }

  // Generate temperature grid
  generateTemperatureGrid(station, baseTemp) {
    const grid = [];
    const variation = 3; // ±3°C variation
    
    for (let i = 0; i < 100; i++) {
      grid.push({
        temperature: baseTemp + (Math.random() - 0.5) * variation,
        coordinates: this.generateRandomCoordinate(station),
        depth: Math.random() * 10 // 0-10m depth
      });
    }

    return {
      base_temperature: baseTemp,
      grid_points: grid,
      variation_range: variation,
      unit: 'celsius'
    };
  }

  // Enhance current data with vectors
  enhanceCurrentData(rawData) {
    if (!rawData || rawData.length === 0) {
      return this.getDefaultCurrentData();
    }

    const latest = rawData[rawData.length - 1];
    
    return {
      current_speed: parseFloat(latest.s || 0),
      current_direction: parseFloat(latest.d || 0),
      speed_knots: parseFloat(latest.s || 0) * 1.94384, // m/s to knots
      vectors: this.generateCurrentVectors(0, { speed: latest.s, direction: latest.d }),
      timestamp: latest.t,
      quality: 'measured'
    };
  }

  // Generate Indian coastal-specific data
  generateIndianCoastalData(type, region) {
    const baseData = this.generateBuoyData(type);
    
    // Add region-specific characteristics
    const regionalModifiers = {
      'arabian_sea': {
        wave_height_factor: 1.2,
        temperature_offset: 2.5,
        current_strength: 1.1
      },
      'gulf_of_kutch': {
        wave_height_factor: 0.8,
        temperature_offset: 1.0,
        current_strength: 0.9
      }
    };
    
    const modifier = regionalModifiers[region] || regionalModifiers['arabian_sea'];
    
    // Apply regional modifications
    if (baseData.wave_height) {
      baseData.wave_height *= modifier.wave_height_factor;
    }
    if (baseData.current_speed) {
      baseData.current_speed *= modifier.current_strength;
    }
    
    // Add monsoon influence (seasonal effect)
    const monsoonFactor = this.getMonsoonInfluence();
    
    return {
      ...baseData,
      monsoon_influence: monsoonFactor,
      region: region,
      salinity: 35.0 + Math.random() * 2, // Arabian Sea salinity
      turbidity: Math.random() * 5, // Water clarity
      fishing_conditions: this.assessFishingConditions(baseData, monsoonFactor),
      navigation_safety: this.assessNavigationSafety(baseData, region)
    };
  }

  // Get regional environmental conditions
  getRegionalConditions(region) {
    const conditions = {
      'arabian_sea': {
        typical_wave_range: '1.5-3.5m',
        temperature_range: '24-30°C',
        monsoon_season: 'June-September',
        primary_currents: 'Southwest Monsoon Current',
        fishing_seasons: ['October-May'],
        navigation_notes: 'Rough seas during monsoon'
      },
      'gulf_of_kutch': {
        typical_wave_range: '0.8-2.2m',
        temperature_range: '22-28°C',
        monsoon_season: 'June-September',
        primary_currents: 'Tidal currents predominant',
        fishing_seasons: ['November-March'],
        navigation_notes: 'Shallow waters, tidal effects significant'
      }
    };
    
    return conditions[region] || conditions['arabian_sea'];
  }

  // Calculate monsoon influence factor
  getMonsoonInfluence() {
    const currentMonth = new Date().getMonth(); // 0-11
    
    // Monsoon season: June(5) to September(8)
    if (currentMonth >= 5 && currentMonth <= 8) {
      // Peak monsoon
      return {
        season: 'monsoon',
        intensity: 0.8 + Math.random() * 0.4, // 0.8-1.2
        wave_amplification: 1.5,
        current_intensification: 1.3,
        weather_severity: 'high'
      };
    } else if (currentMonth === 4 || currentMonth === 9) {
      // Pre/Post monsoon
      return {
        season: 'transition',
        intensity: 0.4 + Math.random() * 0.3, // 0.4-0.7
        wave_amplification: 1.1,
        current_intensification: 1.1,
        weather_severity: 'moderate'
      };
    } else {
      // Winter/Post-monsoon (calm season)
      return {
        season: 'calm',
        intensity: 0.2 + Math.random() * 0.2, // 0.2-0.4
        wave_amplification: 0.8,
        current_intensification: 0.9,
        weather_severity: 'low'
      };
    }
  }

  // Assess fishing conditions
  assessFishingConditions(data, monsoonFactor) {
    let score = 70; // Base score
    
    // Wave height impact
    if (data.wave_height > 3) score -= 30;
    else if (data.wave_height > 2) score -= 15;
    else if (data.wave_height < 1) score += 10;
    
    // Current speed impact
    if (data.current_speed > 2) score -= 20;
    else if (data.current_speed < 0.5) score -= 10; // Too calm also bad
    
    // Monsoon impact
    if (monsoonFactor.season === 'monsoon') score -= 40;
    else if (monsoonFactor.season === 'calm') score += 20;
    
    // Wind impact (if available)
    if (data.wind_speed > 15) score -= 25;
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      score: score,
      category: score > 70 ? 'excellent' : score > 50 ? 'good' : score > 30 ? 'fair' : 'poor',
      recommendations: this.getFishingRecommendations(score, monsoonFactor)
    };
  }

  // Assess navigation safety
  assessNavigationSafety(data, region) {
    let riskLevel = 'low';
    const risks = [];
    
    if (data.wave_height > 3.5) {
      riskLevel = 'high';
      risks.push('Very high waves');
    } else if (data.wave_height > 2.5) {
      riskLevel = 'medium';
      risks.push('High waves');
    }
    
    if (data.current_speed > 2.5) {
      riskLevel = 'high';
      risks.push('Strong currents');
    }
    
    if (data.wind_speed > 20) {
      riskLevel = 'high';
      risks.push('Strong winds');
    }
    
    if (region === 'gulf_of_kutch') {
      risks.push('Shallow waters - check tides');
    }
    
    return {
      risk_level: riskLevel,
      risks: risks,
      recommendations: this.getNavigationRecommendations(riskLevel, risks, region)
    };
  }

  // Get fishing recommendations
  getFishingRecommendations(score, monsoonFactor) {
    const recommendations = [];
    
    if (score > 70) {
      recommendations.push('Excellent conditions for fishing');
      recommendations.push('All vessel sizes can operate safely');
    } else if (score > 50) {
      recommendations.push('Good conditions for experienced fishermen');
      recommendations.push('Medium to large vessels recommended');
    } else if (score > 30) {
      recommendations.push('Caution advised - only experienced crews');
      recommendations.push('Large vessels only');
    } else {
      recommendations.push('Poor conditions - avoid fishing activities');
      recommendations.push('Wait for weather improvement');
    }
    
    if (monsoonFactor.season === 'monsoon') {
      recommendations.push('Monsoon season - exercise extreme caution');
    }
    
    return recommendations;
  }

  // Get navigation recommendations
  getNavigationRecommendations(riskLevel, risks, region) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'high':
        recommendations.push('High risk - avoid unnecessary navigation');
        recommendations.push('Large vessels only with experienced crew');
        recommendations.push('Monitor weather updates continuously');
        break;
      case 'medium':
        recommendations.push('Moderate risk - exercise caution');
        recommendations.push('Medium to large vessels recommended');
        recommendations.push('Check weather before departure');
        break;
      default:
        recommendations.push('Generally safe for navigation');
        recommendations.push('Standard precautions apply');
    }
    
    if (region === 'gulf_of_kutch') {
      recommendations.push('Check tidal charts - shallow waters');
      recommendations.push('Local pilot recommended for large vessels');
    }
    
    return recommendations;
  }

  // Interpolation functions for heatmap
  interpolateWaveHeight(lng, lat, waveData) {
    // Simple distance-based interpolation
    const baseHeight = waveData?.significant_height || 2;
    const noise = (Math.sin(lat * 10) * Math.cos(lng * 10)) * 0.5;
    return Math.max(0, baseHeight + noise);
  }

  interpolateTemperature(lng, lat, tempData) {
    const baseTemp = tempData?.base_temperature || 20;
    const gradient = (lat - 36.9) * 2; // Temperature gradient with latitude
    return baseTemp + gradient + Math.random() * 2 - 1;
  }

  interpolateCurrentSpeed(lng, lat, currentData) {
    const baseSpeed = currentData?.current_speed || 1;
    const channelEffect = Math.exp(-Math.pow((lng + 76.1167) * 20, 2)) * 2; // Channel amplification
    return Math.max(0, baseSpeed + channelEffect);
  }

  calculateIntensity(lng, lat, waveData, tempData, currentData) {
    const waveIntensity = this.interpolateWaveHeight(lng, lat, waveData) / 5;
    const currentIntensity = this.interpolateCurrentSpeed(lng, lat, currentData) / 3;
    return Math.min(1, (waveIntensity + currentIntensity) / 2);
  }

  // Generate wave field for animation
  generateWaveField(time, waveData) {
    const field = [];
    const waveLength = 100; // meters
    const frequency = 0.1; // Hz
    
    for (let i = 0; i < 50; i++) {
      const x = (i - 25) * 10; // Position in meters
      const amplitude = waveData?.significant_height || 2;
      const waveHeight = amplitude * Math.sin(2 * Math.PI * (frequency * time - x / waveLength));
      
      field.push({
        position: x,
        height: waveHeight,
        steepness: Math.cos(2 * Math.PI * (frequency * time - x / waveLength))
      });
    }
    
    return field;
  }

  // Generate current vectors for animation
  generateCurrentVectors(time, currentData) {
    const vectors = [];
    const baseSpeed = currentData?.current_speed || 1;
    const baseDirection = currentData?.current_direction || 180;
    
    for (let i = 0; i < 20; i++) {
      const angle = (baseDirection + Math.sin(time + i) * 30) * Math.PI / 180;
      const speed = baseSpeed * (0.8 + Math.sin(time * 2 + i) * 0.4);
      
      vectors.push({
        id: i,
        start: this.generateRandomCoordinate('cb0201'),
        velocity: {
          u: speed * Math.sin(angle),
          v: speed * Math.cos(angle)
        },
        magnitude: speed
      });
    }
    
    return vectors;
  }

  // Generate buoy-specific data
  generateBuoyData(type) {
    switch (type) {
      case 'wave':
      case 'major_port':
      case 'fishing_port':
        return {
          wave_height: 1.8 + Math.random() * 2.5, // 1.8-4.3m for Arabian Sea
          wave_period: 7 + Math.random() * 5, // 7-12 seconds
          wave_direction: 180 + Math.random() * 120, // SW to NW
          wind_speed: 8 + Math.random() * 12,
          wind_direction: 200 + Math.random() * 80
        };
      case 'current':
      case 'coastal_monitor':
        return {
          current_speed: 0.5 + Math.random() * 2.5, // 0.5-3.0 m/s
          current_direction: Math.random() * 360,
          water_temperature: 24 + Math.random() * 6 // 24-30°C
        };
      case 'meteorological':
      case 'monitoring_station':
        return {
          wind_speed: 5 + Math.random() * 15,
          wind_direction: Math.random() * 360,
          air_temperature: 25 + Math.random() * 10, // 25-35°C for Indian coast
          barometric_pressure: 1008 + Math.random() * 12, // Tropical range
          humidity: 65 + Math.random() * 25 // 65-90% humidity
        };
      case 'offshore_platform':
        return {
          wave_height: 2.2 + Math.random() * 2.8, // Higher waves offshore
          wave_period: 8 + Math.random() * 6,
          current_speed: 1.0 + Math.random() * 2.0,
          wind_speed: 10 + Math.random() * 18,
          water_temperature: 26 + Math.random() * 4
        };
      default:
        return {
          status: 'operational',
          last_maintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
  }

  // Utility functions
  getStationInfo(station) {
    const indianStations = {
      'mumbai_port': {
        name: 'Mumbai Port - Gateway of India',
        lat: 18.9220,
        lon: 72.8347,
        type: 'major_port',
        region: 'Arabian Sea',
        state: 'Maharashtra'
      },
      'kandla_port': {
        name: 'Kandla Port - Gujarat',
        lat: 23.0333,
        lon: 70.2167,
        type: 'major_port',
        region: 'Gulf of Kutch',
        state: 'Gujarat'
      },
      'okha_port': {
        name: 'Okha Port - Dwarka',
        lat: 22.4821,
        lon: 69.0781,
        type: 'fishing_port',
        region: 'Arabian Sea',
        state: 'Gujarat'
      }
    };
    
    // Legacy stations for backward compatibility
    const legacyStations = {
      'cb0201': {
        name: 'Chesapeake Bay Bridge Tunnel',
        lat: 36.9667,
        lon: -76.1167,
        type: 'current',
        region: 'Chesapeake Bay'
      }
    };
    
    return indianStations[station] || legacyStations[station] || indianStations['mumbai_port'];
  }

  generateRandomCoordinate(station) {
    const info = this.getStationInfo(station);
    const radius = 0.15; // ±0.15 degrees for larger coverage
    
    return [
      info.lon + (Math.random() - 0.5) * radius,
      info.lat + (Math.random() - 0.5) * radius
    ];
  }

  getFallbackData(station) {
    return {
      station_id: station,
      timestamp: new Date().toISOString(),
      message: 'Using simulated data - external services unavailable',
      wave_data: this.getDefaultWaveData(),
      temperature_data: this.getDefaultTemperatureData(),
      current_data: this.getDefaultCurrentData()
    };
  }

  getDefaultWaveData() {
    return {
      significant_height: 2.1,
      dominant_period: 8.5,
      average_period: 7.2,
      peak_direction: 180,
      quality: 'default'
    };
  }

  getDefaultTemperatureData() {
    return {
      base_temperature: 20,
      grid_points: [],
      variation_range: 2,
      unit: 'celsius'
    };
  }

  getDefaultCurrentData() {
    return {
      current_speed: 1.5,
      current_direction: 180,
      speed_knots: 2.9,
      vectors: [],
      quality: 'default'
    };
  }

  getDefaultTideData() {
    const predictions = [];
    const now = new Date();
    
    for (let i = 0; i < 48; i++) {
      const time = new Date(now.getTime() + i * 30 * 60 * 1000); // Every 30 minutes
      const tideHeight = Math.sin(i * Math.PI / 12) * 1.5; // Simple sine wave
      
      predictions.push({
        t: time.toISOString(),
        v: tideHeight.toFixed(3)
      });
    }
    
    return predictions;
  }
}

module.exports = EnhancedCoastalDataService;