import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const CurrentMonitor = ({ stationId = 'cb0102' }) => {
  const [currentData, setCurrentData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [stationId]);

  const fetchCurrentData = async () => {
    try {
      setLoading(true);
      const [dataResponse, analysisResponse] = await Promise.all([
        apiService.getCurrentData(stationId, 6), // Last 6 hours
        apiService.getCurrentAnalysis(stationId)
      ]);
      
      setCurrentData(dataResponse);
      setAnalysis(analysisResponse);
      setError(null);
    } catch (err) {
      setError('Failed to fetch current data');
      console.error('Current data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getThreatColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getThreatIcon = (level) => {
    switch (level) {
      case 'high': return '🔴';
      case 'moderate': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <div>
            <h3 className="font-bold">Current Data Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const station = currentData?.station;
  const latest = currentData?.data?.[currentData.data.length - 1];
  const threats = analysis?.threat_assessment || {};
  const stats = analysis?.statistics || {};

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          🌊 Current Conditions
          <span className="ml-2 text-sm font-normal text-gray-500">
            {station?.name}
          </span>
        </h3>
        <p className="text-sm text-gray-600">
          {station?.lat?.toFixed(4)}°N, {station?.lon?.toFixed(4)}°W
        </p>
      </div>

      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Current Speed */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Speed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {latest.speed_knots?.toFixed(2)} <span className="text-sm font-normal">knots</span>
                </p>
                <p className="text-sm text-gray-500">
                  {latest.speed_ms?.toFixed(3)} m/s
                </p>
              </div>
              <div className="text-3xl">🏄‍♂️</div>
            </div>
          </div>

          {/* Current Direction */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Direction</p>
                <p className="text-2xl font-bold text-green-600">
                  {latest.direction_degrees?.toFixed(0)}° 
                  <span className="text-sm font-normal ml-1">
                    ({formatDirection(latest.direction_degrees)})
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  Depth Bin: {latest.bin_depth}
                </p>
              </div>
              <div className="text-3xl">🧭</div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="text-center">
            <p className="text-xs text-gray-500">Mean Speed</p>
            <p className="font-bold text-gray-700">{stats.mean_speed_ms?.toFixed(3)} m/s</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Max Speed</p>
            <p className="font-bold text-gray-700">{stats.max_speed_ms?.toFixed(3)} m/s</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Trend</p>
            <p className="font-bold text-gray-700 capitalize">{analysis?.trend}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Tidal Phase</p>
            <p className="font-bold text-gray-700 capitalize">{analysis?.tidal_phase}</p>
          </div>
        </div>
      )}

      {/* Threat Assessment */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Threat Assessment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(threats).map(([threat, level]) => (
            <div key={threat} className={`rounded-lg px-3 py-2 text-sm ${getThreatColor(level)}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {threat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="flex items-center">
                  {getThreatIcon(level)}
                  <span className="ml-1 font-bold uppercase">{level}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-400 text-center mt-4">
        Last updated: {latest ? new Date(latest.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
};

export default CurrentMonitor;
