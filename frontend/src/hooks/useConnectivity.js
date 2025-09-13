// Custom hook for monitoring internet connectivity
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setOnlineStatus, setSyncStatus } from '../store/slices/uiSlice';

export const useInternetConnectivity = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Function to check backend connectivity
    const checkBackendConnectivity = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('✅ Backend connection successful');
          return true;
        } else {
          console.log('❌ Backend connection failed with status:', response.status);
          return false;
        }
      } catch (error) {
        console.log('❌ Backend connectivity check failed:', error.message);
        return false;
      }
    };

    // Function to check actual internet connectivity (not just network interface)
    const checkInternetConnectivity = async () => {
      try {
        // Update sync status to show we're checking
        dispatch(setSyncStatus('syncing'));

        // Try to ping a reliable service first
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // If internet is available, also check backend
        const backendConnected = await checkBackendConnectivity();
        
        // Set status based on both internet and backend connectivity
        const isFullyConnected = backendConnected;
        dispatch(setOnlineStatus(isFullyConnected));
        dispatch(setSyncStatus(isFullyConnected ? 'synced' : 'offline'));
        
        console.log(`🌐 Connectivity Status: Internet ✅, Backend ${backendConnected ? '✅' : '❌'}`);
        return isFullyConnected;
      } catch (error) {
        console.log('❌ Internet connectivity check failed:', error.message);
        dispatch(setOnlineStatus(false));
        dispatch(setSyncStatus('offline'));
        return false;
      }
    };

    // Function to handle online/offline events
    const handleOnline = () => {
      console.log('Browser detected online');
      // Double-check with actual connectivity test
      checkInternetConnectivity();
    };

    const handleOffline = () => {
      console.log('Browser detected offline');
      dispatch(setOnlineStatus(false));
      dispatch(setSyncStatus('offline'));
    };

    // Set initial status based on navigator.onLine
    if (navigator.onLine) {
      checkInternetConnectivity();
    } else {
      dispatch(setOnlineStatus(false));
      dispatch(setSyncStatus('offline'));
    }

    // Add event listeners for online/offline detection
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up periodic connectivity checks (every 30 seconds when online)
    const connectivityInterval = setInterval(() => {
      if (navigator.onLine) {
        checkInternetConnectivity();
      }
    }, 30000); // Check every 30 seconds

    // Listen for Redux auth actions to trigger connectivity check
    const handleStorageChange = (e) => {
      if (e.key === 'ctas_token' && e.newValue) {
        // User just logged in, check connectivity
        setTimeout(() => checkInternetConnectivity(), 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(connectivityInterval);
    };
  }, [dispatch]);
};

// Additional hook for checking backend API connectivity
export const useBackendConnectivity = () => {
  const dispatch = useDispatch();

  const checkBackendConnection = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('Backend connection successful');
        return true;
      } else {
        console.log('Backend connection failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.log('Backend connectivity check failed:', error.message);
      return false;
    }
  };

  return { checkBackendConnection };
};