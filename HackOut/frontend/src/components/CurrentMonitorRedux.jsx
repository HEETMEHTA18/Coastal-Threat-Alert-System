// Enhanced CurrentMonitor component using Redux
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Activity, MapPin, Clock, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useCurrentData, useConnectionStatus, useUI } from '../store/hooks';
import { fetchCurrentsData, fetchThreatAssessment } from '../store/slices/noaaSlice';

const CurrentMonitor = ({ className = '' }) => {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  
  const { data, isLoading, error, freshness, hasData, latest, station } = useCurrentData();
  const { isConnected, noaaConnection } = useConnectionStatus();
  const { dashboard } = useUI();

  // Auto-refresh based on user preferences
  useEffect(() => {
    if (dashboard.autoRefresh && dashboard.refreshInterval) {
      intervalRef.current = setInterval(() => {
        dispatch(fetchCurrentsData({ stationId: 'cb0102' }));
      }, dashboard.refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch, dashboard.autoRefresh, dashboard.refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    dispatch(fetchCurrentsData({ stationId: 'cb0102' }));
    dispatch(fetchThreatAssessment({ stationId: 'cb0102' }));
  }, [dispatch]);

  const handleManualRefresh = () => {
    dispatch(fetchCurrentsData({ stationId: 'cb0102' }));
  };

  const formatSpeed = (speed) => {
    if (!speed) return 'N/A';
    return `${speed.toFixed(1)} kts`;
  };

  const formatDirection = (direction) => {
    if (!direction) return 'N/A';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(direction / 22.5) % 16;
    return `${direction}° ${directions[index]}`;
  };

  const getThreatColor = (speed) => {
    if (!speed) return 'text-gray-400';
    if (speed < 1.0) return 'text-green-400';
    if (speed < 2.0) return 'text-yellow-400';
    if (speed < 3.0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getThreatLevel = (speed) => {
    if (!speed) return 'Unknown';
    if (speed < 1.0) return 'Low';
    if (speed < 2.0) return 'Moderate';
    if (speed < 3.0) return 'High';
    return 'Critical';
  };

  const getDataFreshnessColor = (minutes) => {
    if (minutes === null) return 'text-gray-400';
    if (minutes < 10) return 'text-green-400';
    if (minutes < 30) return 'text-yellow-400';
    if (minutes < 60) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Current Monitor</h3>
            <p className="text-sm text-slate-400">Cape Henry Station</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {noaaConnection}
            </span>
          </div>
          
          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !hasData && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400">Loading current data...</p>
        </div>
      )}

      {/* Data Display */}
      {hasData && latest && (
        <div className="space-y-4">
          {/* Current Speed and Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400">Current Speed</span>
              </div>
              <div className={`text-2xl font-bold ${getThreatColor(latest.speed)}`}>
                {formatSpeed(latest.speed)}
              </div>
              <div className={`text-xs mt-1 ${getThreatColor(latest.speed)}`}>
                {getThreatLevel(latest.speed)} Risk
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400">Direction</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatDirection(latest.direction)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Current flow
              </div>
            </div>
          </div>

          {/* Station Info */}
          {station && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400">Station Info</span>
              </div>
              <div className="text-white font-medium">{station.name}</div>
              <div className="text-sm text-slate-400">
                {station.lat}°N, {Math.abs(station.lon)}°W
              </div>
            </div>
          )}

          {/* Data Freshness */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Last updated:</span>
              <span className={getDataFreshnessColor(freshness)}>
                {freshness !== null ? `${freshness} min ago` : 'Just now'}
              </span>
            </div>
            
            {dashboard.autoRefresh && (
              <div className="text-slate-400">
                Auto-refresh: {Math.floor(dashboard.refreshInterval / 60000)}min
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {data.history && data.history.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/50">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {data.history.length}
                </div>
                <div className="text-xs text-slate-400">Records</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {formatSpeed(Math.max(...data.history.map(r => r.speed || 0)))}
                </div>
                <div className="text-xs text-slate-400">Max Speed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {formatSpeed(data.history.reduce((sum, r) => sum + (r.speed || 0), 0) / data.history.length)}
                </div>
                <div className="text-xs text-slate-400">Avg Speed</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!hasData && !isLoading && !error && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No current data available</p>
          <button
            onClick={handleManualRefresh}
            className="mt-3 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            Load Data
          </button>
        </div>
      )}
    </div>
  );
};

export default CurrentMonitor;
