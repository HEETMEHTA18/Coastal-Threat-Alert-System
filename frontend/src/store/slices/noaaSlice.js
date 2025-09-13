// NOAA data slice for real-time ocean and weather data
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  async (stationId = 'cb0201', { rejectWithValue }) => {
    try {
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
  async (stationId = 'cb0201', { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/noaa/threats/${stationId}`);
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch threat assessment');
      }
      
      const data = await response.json();
      return data;
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
        state.currentsData[stationId] = data;
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
