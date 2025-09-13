import React, { useState, useEffect } from 'react';
import { Waves, TrendingUp, Navigation, Clock, MapPin, Activity } from 'lucide-react';
import OceanCurrentsService from '../services/oceanCurrentsService';

const OceanCurrentsPanel = ({ isOpen, onClose, location }) => {
  const [currentData, setCurrentData] = useState(null);
  const [tidalData, setTidalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('currents');
  const [selectedStation, setSelectedStation] = useState(null);

  const oceansService = new OceanCurrentsService();

  useEffect(() => {
    if (isOpen && location) {
      fetchOceanData();
    }
  }, [isOpen, location]);

  const fetchOceanData = async () => {
    setLoading(true);
    try {
      const data = await oceansService.getCurrentConditions(location.lat, location.lng);
      setCurrentData(data.currents);
      setTidalData(data.tides);
      setSelectedStation(data.nearestStations);
    } catch (error) {
      console.error('Error fetching ocean data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getCurrentSpeed = () => {
    if (!currentData?.currents?.length) return 0;
    return currentData.currents[0]?.speed || 0;
  };

  const getCurrentDirection = () => {
    if (!currentData?.currents?.length) return 0;
    return currentData.currents[0]?.direction || 0;
  };

  const getNextTide = () => {
    if (!tidalData?.tides?.length) return null;
    const now = new Date();
    return tidalData.tides.find(tide => new Date(tide.time) > now);
  };

  const getTideStatus = () => {
    const nextTide = getNextTide();
    if (!nextTide) return 'Unknown';
    
    const timeToTide = new Date(nextTide.time) - new Date();
    const hoursToTide = Math.round(timeToTide / (1000 * 60 * 60 * 10)) / 10;
    
    return `${nextTide.type === 'high' ? 'High' : 'Low'} tide in ${hoursToTide}h`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 w-96 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Ocean Conditions</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1 rounded"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('currents')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'currents'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Currents
        </button>
        <button
          onClick={() => setActiveTab('tides')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'tides'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Tides
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading ocean data...</span>
          </div>
        ) : (
          <>
            {activeTab === 'currents' && (
              <div className="space-y-4">
                {/* Current Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Speed</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700">
                      {getCurrentSpeed().toFixed(1)} kts
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-gray-700">Direction</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-700">
                      {getCurrentDirection()}° {formatDirection(getCurrentDirection())}
                    </div>
                  </div>
                </div>

                {/* Station Info */}
                {selectedStation?.current && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Monitoring Station</span>
                    </div>
                    <div className="text-sm text-gray-800">{selectedStation.current.name}</div>
                    <div className="text-xs text-gray-500">
                      {selectedStation.current.lat.toFixed(4)}°, {selectedStation.current.lng.toFixed(4)}°
                    </div>
                  </div>
                )}

                {/* Recent Current Data */}
                {currentData?.currents && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Measurements</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentData.currents.slice(0, 12).map((current, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                          <div className="text-xs text-gray-600">
                            {new Date(current.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-blue-600">
                              {current.speed.toFixed(1)} kts
                            </span>
                            <span className="text-sm text-emerald-600">
                              {current.direction}° {formatDirection(current.direction)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tides' && (
              <div className="space-y-4">
                {/* Tide Status */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Current Status</span>
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {getTideStatus()}
                  </div>
                </div>

                {/* Station Info */}
                {selectedStation?.tide && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Tide Station</span>
                    </div>
                    <div className="text-sm text-gray-800">{selectedStation.tide.name}</div>
                    <div className="text-xs text-gray-500">
                      {selectedStation.tide.lat.toFixed(4)}°, {selectedStation.tide.lng.toFixed(4)}°
                    </div>
                  </div>
                )}

                {/* Upcoming Tides */}
                {tidalData?.tides && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Upcoming Tides</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {tidalData.tides.slice(0, 8).map((tide, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              tide.type === 'high' ? 'bg-blue-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-xs text-gray-600">
                              {new Date(tide.time).toLocaleDateString()} {new Date(tide.time).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              tide.type === 'high' ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {tide.type === 'high' ? 'High' : 'Low'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {tide.height.toFixed(1)}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Last Updated */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OceanCurrentsPanel;