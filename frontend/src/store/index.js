// Redux store configuration for CTAS
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import noaaReducer from './slices/noaaSlice';
import alertReducer from './slices/alertSlice';
import uiReducer from './slices/uiSlice';

// Persist configuration
const persistConfig = {
  key: 'ctas-root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui slices
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  noaa: noaaReducer,
  alerts: alertReducer,
  ui: uiReducer,
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

export const persistor = persistStore(store);

// Export the configured store
export default store;
