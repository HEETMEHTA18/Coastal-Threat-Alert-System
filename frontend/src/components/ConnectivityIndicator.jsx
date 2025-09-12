// Simple connectivity status indicator component
import React from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';
import { useConnectionStatus } from '../store/hooks';

const ConnectivityIndicator = ({ showText = true, size = 'small' }) => {
  const { isConnected, syncStatus, isOnline } = useConnectionStatus();

  const iconSize = size === 'large' ? 'w-6 h-6' : 'w-4 h-4';
  const textSize = size === 'large' ? 'text-base' : 'text-sm';

  const getStatusColor = () => {
    if (syncStatus === 'syncing') return 'text-yellow-400';
    if (isConnected) return 'text-green-400';
    return 'text-red-400';
  };

  const getStatusIcon = () => {
    if (syncStatus === 'syncing') {
      return <Loader className={`${iconSize} animate-spin`} />;
    }
    if (isConnected) {
      return <Wifi className={iconSize} />;
    }
    return <WifiOff className={iconSize} />;
  };

  const getStatusText = () => {
    if (syncStatus === 'syncing') return 'Connecting...';
    if (isConnected) return 'Connected';
    if (isOnline) return 'Server Offline';
    return 'No Internet';
  };

  return (
    <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
      {getStatusIcon()}
      {showText && (
        <span className={`${textSize} font-medium`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default ConnectivityIndicator;