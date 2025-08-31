// NOAA data slice for ocean and weather data
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  capeHenryData: null,
  currentData: null,
  threatAssessment: null,
  connectionStatus: 'unknown', // 'connected', 'disconnected', 'unknown'
  isLoading: false,
  error: null,
  errors: {},
  dataFreshness: {
    capeHenry: 'fresh', // 'fresh', 'stale', 'outdated'
    currents: 'fresh',
    threats: 'fresh'
  },
  capeHenryLastUpdated: null,
  currentLastUpdated: null,
  threatLastUpdated: null
};

// Async thunks for API calls
export const fetchCapeHenryData = createAsyncThunk(
  'noaa/fetchCapeHenry',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/noaa/cape-henry');
      
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
  'noaa/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/noaa/current');
      
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
  async ({ stationId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/noaa/currents/${stationId}`);
      
      if (!response.ok) {
        return rejectWithValue(`Failed to fetch currents data for station ${stationId}`);
      }
      
      const data = await response.json();
      return { data, stationId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchThreatAssessment = createAsyncThunk(
  'noaa/fetchThreatAssessment',
  async ({ stationId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/threats/assessment/${stationId}`);
      
      if (!response.ok) {
        return rejectWithValue(`Failed to fetch threat assessment for station ${stationId}`);
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
      const response = await fetch('http://localhost:5000/api/noaa/status');
      
      if (!response.ok) {
        return rejectWithValue('NOAA API connection failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const noaaSlice = createSlice({
  name: 'noaa',
  initialState,
  reducers: {
    // Simple reducers for direct state updates
    setCapeHenryData: (state, action) => {
      state.capeHenryData = action.payload;
      state.capeHenryLastUpdated = new Date().toISOString();
    },
    setCurrentData: (state, action) => {
      state.currentData = action.payload;
      state.currentLastUpdated = new Date().toISOString();
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    updateDataFreshness: (state) => {
      // Calculate data freshness based on last updated timestamps
      const now = new Date();
      
      if (state.capeHenryLastUpdated) {
        const capeHenryTime = new Date(state.capeHenryLastUpdated);
        const diffMinutes = (now - capeHenryTime) / (1000 * 60);
        
        if (diffMinutes < 30) {
          state.dataFreshness.capeHenry = 'fresh';
        } else if (diffMinutes < 60) {
          state.dataFreshness.capeHenry = 'stale';
        } else {
          state.dataFreshness.capeHenry = 'outdated';
        }
      }
      
      if (state.currentLastUpdated) {
        const currentTime = new Date(state.currentLastUpdated);
        const diffMinutes = (now - currentTime) / (1000 * 60);
        
        if (diffMinutes < 30) {
          state.dataFreshness.currents = 'fresh';
        } else if (diffMinutes < 60) {
          state.dataFreshness.currents = 'stale';
        } else {
          state.dataFreshness.currents = 'outdated';
        }
      }
      
      if (state.threatLastUpdated) {
        const threatTime = new Date(state.threatLastUpdated);
        const diffMinutes = (now - threatTime) / (1000 * 60);
        
        if (diffMinutes < 30) {
          state.dataFreshness.threats = 'fresh';
        } else if (diffMinutes < 60) {
          state.dataFreshness.threats = 'stale';
        } else {
          state.dataFreshness.threats = 'outdated';
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Cape Henry data
      .addCase(fetchCapeHenryData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCapeHenryData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.capeHenryData = action.payload;
        state.capeHenryLastUpdated = new Date().toISOString();
        state.errors.capeHenry = null;
      })
      .addCase(fetchCapeHenryData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.errors.capeHenry = action.payload;
      })
      // Current data
      .addCase(fetchCurrentData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentData = action.payload;
        state.currentLastUpdated = new Date().toISOString();
        state.errors.current = null;
      })
      .addCase(fetchCurrentData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.errors.current = action.payload;
      })
      // Currents data by station
      .addCase(fetchCurrentsData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentsData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentData = action.payload.data;
        state.currentLastUpdated = new Date().toISOString();
        state.errors.currents = null;
      })
      .addCase(fetchCurrentsData.rejected, (state, action) => {
        state.isLoading = false;
        state.errors.currents = action.payload;
      })
      // Threat assessment
      .addCase(fetchThreatAssessment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchThreatAssessment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.threatAssessment = action.payload;
        state.threatLastUpdated = new Date().toISOString();
        state.errors.threat = null;
      })
      .addCase(fetchThreatAssessment.rejected, (state, action) => {
        state.isLoading = false;
        state.errors.threat = action.payload;
      })
      // Connection test
      .addCase(testNoaaConnection.pending, (state) => {
        state.connectionStatus = 'testing';
      })
      .addCase(testNoaaConnection.fulfilled, (state) => {
        state.connectionStatus = 'connected';
      })
      .addCase(testNoaaConnection.rejected, (state) => {
        state.connectionStatus = 'disconnected';
      });
  },
});

export const { 
  setCapeHenryData, 
  setCurrentData, 
  setLoading, 
  setError, 
  setConnectionStatus,
  updateDataFreshness 
} = noaaSlice.actions;

export default noaaSlice.reducer;
