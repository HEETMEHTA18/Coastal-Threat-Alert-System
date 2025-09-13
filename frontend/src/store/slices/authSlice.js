// Authentication slice for user management
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to generate name from email
const generateNameFromEmail = (email) => {
  if (!email) return 'User';
  
  // Extract the part before @ symbol
  const localPart = email.split('@')[0];
  
  // Split by common separators (dots, underscores, numbers)
  let nameParts = localPart.split(/[._\d]+/).filter(part => part.length > 0);
  
  // Capitalize each part
  nameParts = nameParts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
  
  // Join with space, default to "User" if no valid parts
  return nameParts.length > 0 ? nameParts.join(' ') : 'User';
};

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
      
      // If the backend doesn't provide a name, generate it from email
      if (!data.user.name || data.user.name === 'User' || data.user.name === '') {
        data.user.name = generateNameFromEmail(data.user.email);
      }
      
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
          // If user doesn't have a proper name, generate it from email
          if (!parsedUser.name || parsedUser.name === 'User' || parsedUser.name === 'Guest User') {
            parsedUser.name = generateNameFromEmail(parsedUser.email);
          }
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
        console.log('🔐 No stored auth data found - user needs to login');
        // Don't set demo user automatically - let user login first
      }
    },

    // Set demo user (for development/demo purposes)
    setDemoUser: (state) => {
      const demoEmail = 'john.doe@coastal-alert.com';
      const generatedName = generateNameFromEmail(demoEmail);
      
      const demoUser = {
        id: 'demo-user-001',
        name: generatedName, // Generated from email
        email: demoEmail,
        role: 'analyst',
        department: 'Coastal Monitoring',
        location: 'Mumbai, Maharashtra',
        avatar: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        preferences: {
          theme: 'dark',
          notifications: true,
          units: 'metric'
        }
      };
      state.user = demoUser;
      state.isAuthenticated = true;
    },

    // Update user profile information
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        
        // Update localStorage with new user data
        localStorage.setItem('ctas_user', JSON.stringify(state.user));
      }
    },

    // Generate name from email
    generateNameFromEmail: (email) => {
      if (!email) return 'User';
      
      // Extract the part before @
      const username = email.split('@')[0];
      
      // Split by common separators and capitalize each part
      const nameParts = username
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .filter(part => part.length > 0);
      
      return nameParts.join(' ') || 'User';
    },

    // Set user from login with name generation
    setUserFromLogin: (state, action) => {
      const { email, ...userData } = action.payload;
      
      // Generate name from email if no name provided
      const generatedName = generateNameFromEmail(email);
      
      const user = {
        ...userData,
        email,
        name: userData.name || generatedName,
        id: userData.id || `user-${Date.now()}`,
        role: userData.role || 'user',
        createdAt: userData.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      state.user = user;
      state.isAuthenticated = true;
      
      // Store in localStorage
      localStorage.setItem('ctas_user', JSON.stringify(user));
      
      console.log('🔐 User set from login:', { user, generatedName });
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

export const { clearError, setCredentials, clearCredentials, initializeAuth, setDemoUser, updateUserProfile, setUserFromLogin } = authSlice.actions;
export { generateNameFromEmail }; // Export the helper function
export default authSlice.reducer;
