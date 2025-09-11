// Redux store configuration for CTAS
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import noaaSlice from './slices/noaaSlice';
import alertSlice from './slices/alertSlice';
import uiSlice from './slices/uiSlice';

// Persist configuration
const persistConfig = {
  key: 'ctas-root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui slices
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authSlice,
  noaa: noaaSlice,
  alerts: alertSlice,
  ui: uiSlice,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these actions for serialization checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these paths in state for serialization checks
        ignoredPaths: ['noaa.currentData', 'noaa.capeHenryData'],
      },
    }),
  devTools: true,
});

// Export the configured store
export default store;
