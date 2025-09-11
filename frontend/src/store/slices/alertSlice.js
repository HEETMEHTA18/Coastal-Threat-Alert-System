// Alerts slice for threat notifications and user alerts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  alerts: [],
  isLoading: false,
  error: null,
};

// Async thunks for API calls
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('ctas_token');
      if (!token) {
        return rejectWithValue('No authentication token');
      }

      const response = await fetch('http://localhost:5000/api/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        return rejectWithValue('Failed to fetch alerts');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (alertData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('ctas_token');
      if (!token) {
        return rejectWithValue('No authentication token');
      }

      const response = await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(alertData)
      });
      
      if (!response.ok) {
        return rejectWithValue('Failed to create alert');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    // Simple reducers for direct state updates
    setAlerts: (state, action) => {
      state.alerts = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addAlert: (state, action) => {
      state.alerts.push(action.payload);
    },
    addLocalAlert: (state, action) => {
      state.alerts.push(action.payload);
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create alert
      .addCase(createAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts.push(action.payload);
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setAlerts, setLoading, setError, addAlert, addLocalAlert, removeAlert } = alertsSlice.actions;
export default alertsSlice.reducer;
