// NOAA data slice for real-time ocean and weather data
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// OpenWeather API key (optional). If provided, some NOAA endpoints will fall back to OpenWeather
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || null;
// Simple mapping of known station ids to coordinates (extend as needed)
const STATION_COORDS = {
  cb0201: { lat: 36.9667, lon: -76.1167 }
};

// Use server-side proxy for OpenWeather when available to avoid exposing API key in the browser
async function fetchOpenWeatherCurrent(lat, lon) {
  const nodeBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001';
  const url = `${nodeBase.replace(/\/$/, '')}/api/openweather/current?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenWeather proxy responded ${res.status} ${text}`);
  }
  const payload = await res.json();
  if (payload.status !== 'success') throw new Error(payload.message || 'OpenWeather proxy error');
  // payload.data matches the server's getWeatherByCoordinates output
  return payload.data;
}

// Initial state
const initialState = {
  capeHenryData: null,
  currentData: null,
  currentsData: {},
  threatAssessment: null,
  serviceStatus: null,
  isLoading: false,
  error: null,
  lastUpdated: {
    capeHenry: 'fresh',
    current: 'fresh',
    threats: 'fresh'
  },
  capeHenryLastUpdated: null,
  currentLastUpdated: null,
  threatLastUpdated: null
};

// Async thunk for fetching Cape Henry analysis
export const fetchCapeHenryAnalysis = createAsyncThunk(
  'noaa/fetchCapeHenryAnalysis',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/noaa/cape-henry`);
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch Cape Henry data');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCurrentData = createAsyncThunk(
  'noaa/fetchCurrentData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/noaa/current`);
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch current data');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCurrentsData = createAsyncThunk(
  'noaa/fetchCurrentsData',
  // Accept either a stationId string or an object { stationId, lat, lon }
  async (arg = 'cb0201', { rejectWithValue }) => {
    const stationId = typeof arg === 'string' ? arg : (arg.stationId || 'cb0201');
    const lat = typeof arg === 'object' ? arg.lat : undefined;
    const lon = typeof arg === 'object' ? arg.lon : undefined;
    try {
      // Determine coordinates: prefer explicit lat/lon args, then station map
      let useLat = lat;
      let useLon = lon;
      if ((useLat === undefined || useLon === undefined) && STATION_COORDS[stationId]) {
        useLat = STATION_COORDS[stationId].lat;
        useLon = STATION_COORDS[stationId].lon;
      }

      // Prefer server-side proxy (via fetchOpenWeatherCurrent) when available; try it first and fall back to internal API
      if (useLat !== undefined && useLon !== undefined) {
        try {
          const ow = await fetchOpenWeatherCurrent(useLat, useLon);
          // Synthesize a currents-like object from available fields (wind as proxy)
          const data = {
            source: 'openweather-fallback',
            stationId,
            coords: { lat: useLat, lon: useLon },
            fetchedAt: new Date().toISOString(),
            wind: ow.wind || null,
            weather: ow.weather || null,
            main: ow.main || null,
            name: ow.name || null
          };
          return { stationId, data };
        } catch (err) {
          // Fall through to primary API if proxy/OpenWeather fails
          console.warn('OpenWeather proxy/fallback failed for currents:', err.message);
        }
      }

      const response = await fetch(`${API_BASE_URL}/noaa/currents/${stationId}`);
      if (!response.ok) {
        return rejectWithValue('Failed to fetch currents data');
      }

      const data = await response.json();
      return { stationId, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchThreatAssessment = createAsyncThunk(
  'noaa/fetchThreatAssessment',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { lat = 19.076, lon = 72.8777 } = params;
      // If OpenWeather API key configured, use it to compute a lightweight local threat assessment
      try {
        const ow = await fetchOpenWeatherCurrent(lat, lon);
          // Basic heuristics for threat levels using wind, rain, and weather conditions
          const windMs = ow.wind?.speed ?? 0; // m/s
          const rain = ow.rain?.['1h'] ?? ow.rain?.['3h'] ?? 0; // mm
          const weatherMain = (ow.weather && ow.weather[0] && ow.weather[0].main) || '';

          const threats = [];
          if (windMs >= 20) {
            threats.push({ type: 'extreme_wind', severity: 'high', detail: `Wind ${windMs} m/s` });
          } else if (windMs >= 10) {
            threats.push({ type: 'high_wind', severity: 'medium', detail: `Wind ${windMs} m/s` });
          }

          if (rain >= 20) {
            threats.push({ type: 'heavy_rain', severity: 'high', detail: `Rain ${rain} mm` });
          } else if (rain >= 2) {
            threats.push({ type: 'rain', severity: 'medium', detail: `Rain ${rain} mm` });
          }

          if (/thunderstorm/i.test(weatherMain)) {
            threats.push({ type: 'thunderstorm', severity: 'medium', detail: weatherMain });
          }

          const data = {
            source: 'openweather-proxy',
            coords: { lat, lon },
            fetchedAt: new Date().toISOString(),
            weather: ow,
            threats
          };

          return data;
      } catch (err) {
        console.warn('OpenWeather proxy/fallback failed for threat assessment:', err.message);
        // fall through to internal endpoint
      }

      const response = await fetch(`${API_BASE_URL}/threats/current?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        return rejectWithValue('Failed to fetch threat assessment');
      }

      const data = await response.json();
      return data.data; // Return the data object from the response
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchServiceStatus = createAsyncThunk(
  'noaa/fetchServiceStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/noaa/status`);
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch service status');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const testNoaaConnection = createAsyncThunk(
  'noaa/testConnection',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/noaa/test`);
      
      if (!response.ok) {
        return rejectWithValue('Failed to test NOAA connection');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// NOAA slice
const noaaSlice = createSlice({
  name: 'noaa',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearStationData: (state) => {
      state.currentsData = {};
      state.currentData = null;
      state.threatAssessment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Cape Henry Data
      .addCase(fetchCapeHenryAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCapeHenryAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.capeHenryData = action.payload;
        state.capeHenryLastUpdated = new Date().toISOString();
        state.lastUpdated.capeHenry = 'updated';
      })
      .addCase(fetchCapeHenryAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Current Data
      .addCase(fetchCurrentData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentData = action.payload;
        state.currentLastUpdated = new Date().toISOString();
        state.lastUpdated.current = 'updated';
      })
      .addCase(fetchCurrentData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Currents Data
      .addCase(fetchCurrentsData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentsData.fulfilled, (state, action) => {
        state.isLoading = false;
        const { stationId, data } = action.payload;
        // If data came from the OpenWeather proxy, normalize it into the
        // shape the UI expects: { observations: [...], station_info: {...} }
        if (data && typeof data === 'object' && data.source && data.source.toString().toLowerCase().includes('openweather')) {
          const wind = data.wind || {};
          const nowIso = new Date().toISOString();
          // Convert m/s to knots for display (1 m/s = 1.943844 knots)
          const speedMs = wind.speed ?? null;
          const speedKts = (typeof speedMs === 'number') ? +(speedMs * 1.943844).toFixed(2) : null;
          const direction = wind.deg ?? null;

          const newObservation = {
            // UI expects `timestamp` and `time` fields
            timestamp: nowIso,
            time: nowIso,
            // UI expects `speed_knots` and `direction_degrees`
            speed_knots: speedKts,
            speed_ms: speedMs,
            direction_degrees: direction,
            // keep a raw copy for debugging
            raw: data
          };

          const existing = state.currentsData[stationId] && typeof state.currentsData[stationId] === 'object'
            ? state.currentsData[stationId]
            : null;

          // Build or append to observations history, limiting to last 1440 entries (~24h at 1min)
          const maxHistory = 1440;
          let observations = [newObservation];
          if (existing && Array.isArray(existing.observations)) {
            observations = existing.observations.concat(newObservation).slice(-maxHistory);
          }

          const stationData = {
            source: data.source,
            station_info: {
              name: data.name || stationId,
              coords: data.coords || null
            },
            observations,
            // preserve the raw fields for any advanced UI usage
            raw: data
          };

          state.currentsData[stationId] = stationData;
        } else {
          // For non-proxy data, preserve existing history if present
          const existing = state.currentsData[stationId] && typeof state.currentsData[stationId] === 'object'
            ? state.currentsData[stationId]
            : null;

          // If the incoming data already has observations, append them
          if (data && data.observations && Array.isArray(data.observations)) {
            const maxHistory = 1440;
            const newObs = data.observations.slice(-maxHistory);
            const observations = existing && Array.isArray(existing.observations)
              ? existing.observations.concat(newObs).slice(-maxHistory)
              : newObs;

            state.currentsData[stationId] = {
              ...data,
              observations,
            };
          } else {
            state.currentsData[stationId] = data;
          }
        }
        state.currentLastUpdated = new Date().toISOString();
        state.lastUpdated.current = 'updated';
      })
      .addCase(fetchCurrentsData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Threat Assessment
      .addCase(fetchThreatAssessment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchThreatAssessment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.threatAssessment = action.payload;
        state.threatLastUpdated = new Date().toISOString();
        state.lastUpdated.threats = 'updated';
      })
      .addCase(fetchThreatAssessment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Service Status
      .addCase(fetchServiceStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceStatus = action.payload;
      })
      .addCase(fetchServiceStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Test Connection
      .addCase(testNoaaConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(testNoaaConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceStatus = action.payload;
      })
      .addCase(testNoaaConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearStationData } = noaaSlice.actions;

// Selectors
export const selectCapeHenryData = (state) => state.noaa.capeHenryData;
export const selectCurrentData = (state) => state.noaa.currentData;
export const selectCurrentsData = (state) => state.noaa.currentsData;
export const selectThreatAssessment = (state) => state.noaa.threatAssessment;
export const selectServiceStatus = (state) => state.noaa.serviceStatus;
export const selectNoaaLoading = (state) => state.noaa.isLoading;
export const selectNoaaError = (state) => state.noaa.error;
export const selectLastUpdated = (state) => state.noaa.lastUpdated;

export default noaaSlice.reducer;
