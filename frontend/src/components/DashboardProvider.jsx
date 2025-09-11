// Dashboard data provider for real-time updates
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { testNoaaConnection, fetchCapeHenryData, fetchCurrentsData } from '../store/slices/noaaSlice';
import { setOnlineStatus } from '../store/slices/uiSlice';

const DashboardProvider = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Test connections and fetch initial data when dashboard loads
    const initializeDashboard = async () => {
      try {
        // Set online status based on navigator
        console.log('Setting online status:', navigator.onLine);
        dispatch(setOnlineStatus(navigator.onLine));
        
        // Test NOAA connection
        console.log('Testing NOAA connection...');
        const result = await dispatch(testNoaaConnection()).unwrap();
        console.log('NOAA connection test result:', result);
        
        // Fetch initial data
        dispatch(fetchCapeHenryData());
        dispatch(fetchCurrentsData('cb0102'));
        
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
      }
    };

    initializeDashboard();

    // Set up online/offline listeners
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return children;
};

export default DashboardProvider;
