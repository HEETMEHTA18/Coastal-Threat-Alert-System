// Authentication slice for user management
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store in localStorage
      localStorage.setItem('ctas_user', JSON.stringify(data.user));
      localStorage.setItem('ctas_token', data.token);
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, role = 'user' }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Store in localStorage
      localStorage.setItem('ctas_user', JSON.stringify(data.user));
      localStorage.setItem('ctas_token', data.token);
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear localStorage
      localStorage.removeItem('ctas_user');
      localStorage.removeItem('ctas_token');
      
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      
      // Also store in localStorage
      localStorage.setItem('ctas_user', JSON.stringify(user));
      localStorage.setItem('ctas_token', token);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Also clear from localStorage
      localStorage.removeItem('ctas_user');
      localStorage.removeItem('ctas_token');
    },
    initializeAuth: (state) => {
      // Check localStorage for existing auth
      const storedUser = localStorage.getItem('ctas_user');
      const storedToken = localStorage.getItem('ctas_token');
      
      console.log('🔐 InitializeAuth Debug:', { 
        storedUser: storedUser ? 'exists' : 'null', 
        storedToken: storedToken ? 'exists' : 'null',
        currentState: { user: state.user, isAuthenticated: state.isAuthenticated }
      });
      
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          state.user = parsedUser;
          state.token = storedToken;
          state.isAuthenticated = true;
          console.log('🔐 Auth initialized successfully:', { user: parsedUser, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to parse stored auth data:', error);
          localStorage.removeItem('ctas_user');
          localStorage.removeItem('ctas_token');
        }
      } else {
        console.log('🔐 No stored auth data found');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCredentials, clearCredentials, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
