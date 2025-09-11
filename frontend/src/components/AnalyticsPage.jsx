import React, { useState, useEffect } from 'react';
import Chart from './Chart';
import { Activity, BarChart, ArrowUpCircle, AlertTriangle, Droplets, Wind, CloudSun } from 'lucide-react';

const AnalyticsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [timeFrame, setTimeFrame] = useState('month');
  const [anomalyCount, setAnomalyCount] = useState(0);
  
  useEffect(() => {
    // Fetch and parse CSV data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get the CSV data from the public folder
        const response = await fetch('/Dataset_for_chatbot.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        
        // Create parsed data objects with appropriate type conversions
        const parsedData = rows.slice(1).filter(row => row.trim()).map(row => {
          const values = row.split(',');
          const dataObj = {};
          headers.forEach((header, index) => {
            // Convert numeric values to numbers
            if (['water_level_m', 'wind_speed_m_s', 'air_pressure_hpa', 'chlorophyll_mg_m3'].includes(header)) {
              dataObj[header] = parseFloat(values[index]);
            } else {
              dataObj[header] = values[index];
            }
          });
          return dataObj;
        });
        
        // Get unique stations
        const uniqueStations = [...new Set(parsedData.map(item => item.station_id))];
        setStations(uniqueStations);
        setSelectedStation(uniqueStations[0]);
        
        // Count anomalies
        const anomalies = parsedData.filter(item => item.anomaly === '1').length;
        setAnomalyCount(anomalies);
        
        setData(parsedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Function to prepare chart data based on the selected time frame and parameter
  const prepareChartData = (parameter) => {
    if (!selectedStation || !data.length) return [];
    
    const filteredData = data.filter(item => item.station_id === selectedStation);
    
    // Apply time frame filtering
    let timeFilteredData = filteredData;
    if (timeFrame === 'month') {
      // Get last 30 records as a simple approximation
      timeFilteredData = filteredData.slice(-30);
    } else if (timeFrame === 'week') {
      // Get last 7 records
      timeFilteredData = filteredData.slice(-7);
    } else if (timeFrame === 'year') {
      // Get records with 30-day interval
      timeFilteredData = filteredData.filter((_, index) => index % 30 === 0);
    }
    
    // Format data for the chart
    return timeFilteredData.map(item => ({
      name: item.date,
      value: parseFloat(item[parameter])
    }));
  };
  
  // Stats summary calculation
  const calculateStats = () => {
    if (!selectedStation || !data.length) {
      return {
        avgWaterLevel: 0,
        avgWindSpeed: 0,
        avgChlorophyll: 0,
        maxWaterLevel: 0,
        maxWindSpeed: 0
      };
    }
    
    const stationData = data.filter(item => item.station_id === selectedStation);
    
    const waterLevels = stationData.map(item => parseFloat(item.water_level_m));
    const windSpeeds = stationData.map(item => parseFloat(item.wind_speed_m_s));
    const chlorophyllLevels = stationData.map(item => parseFloat(item.chlorophyll_mg_m3));
    
    return {
      avgWaterLevel: (waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length).toFixed(2),
      avgWindSpeed: (windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length).toFixed(2),
      avgChlorophyll: (chlorophyllLevels.reduce((a, b) => a + b, 0) / chlorophyllLevels.length).toFixed(3),
      maxWaterLevel: Math.max(...waterLevels).toFixed(2),
      maxWindSpeed: Math.max(...windSpeeds).toFixed(2)
    };
  };
  
  const stats = calculateStats();
  
  if (loading) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 flex items-center justify-center h-96">
        <div className="text-white">Loading analytics data...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center">
            <BarChart className="mr-3 text-blue-400" size={24} />
            Coastal Analytics Dashboard
          </h2>
          
          <div className="flex space-x-4">
            <select
              className="bg-slate-700/70 text-white rounded-lg px-3 py-2 border border-slate-600"
              onChange={(e) => setSelectedStation(e.target.value)}
              value={selectedStation || ''}
            >
              {stations.map(station => (
                <option key={station} value={station}>
                  Station ID: {station}
                </option>
              ))}
            </select>
            
            <div className="flex rounded-lg overflow-hidden">
              {['week', 'month', 'year'].map((frame) => (
                <button
                  key={frame}
                  className={`px-3 py-2 text-sm ${timeFrame === frame 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/70 text-slate-300 hover:bg-slate-600/80'}`}
                  onClick={() => setTimeFrame(frame)}
                >
                  {frame.charAt(0).toUpperCase() + frame.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Total Anomalies</p>
                <p className="text-white text-2xl font-semibold">{anomalyCount}</p>
              </div>
              <AlertTriangle className="text-amber-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Avg Water Level</p>
                <p className="text-white text-2xl font-semibold">{stats.avgWaterLevel}m</p>
              </div>
              <Droplets className="text-blue-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-4 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Max Water Level</p>
                <p className="text-white text-2xl font-semibold">{stats.maxWaterLevel}m</p>
              </div>
              <ArrowUpCircle className="text-violet-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Avg Wind Speed</p>
                <p className="text-white text-2xl font-semibold">{stats.avgWindSpeed} m/s</p>
              </div>
              <Wind className="text-amber-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-teal-500/20 to-green-500/20 rounded-xl p-4 border border-teal-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Avg Chlorophyll</p>
                <p className="text-white text-2xl font-semibold">{stats.avgChlorophyll} mg/m³</p>
              </div>
              <CloudSun className="text-teal-400" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Droplets className="text-blue-400 mr-2" size={20} />
              Water Level Over Time
            </h3>
            <span className="text-xs text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-700/30">
              Avg: {stats.avgWaterLevel}m
            </span>
          </div>
          <Chart 
            data={prepareChartData('water_level_m')}
            color="#3b82f6"
            title={`Water Level Measurements (${timeFrame})`}
            avgLine={true}
          />
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Wind className="text-amber-400 mr-2" size={20} />
              Wind Speed Trends
            </h3>
            <span className="text-xs text-amber-400 bg-amber-900/30 px-3 py-1 rounded-full border border-amber-700/30">
              Avg: {stats.avgWindSpeed} m/s
            </span>
          </div>
          <Chart 
            data={prepareChartData('wind_speed_m_s')}
            color="#f59e0b"
            title={`Wind Speed Measurements (${timeFrame})`}
            avgLine={true}
          />
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Activity className="text-pink-400 mr-2" size={20} />
              Air Pressure Analysis
            </h3>
          </div>
          <Chart 
            data={prepareChartData('air_pressure_hpa')}
            color="#ec4899"
            title={`Atmospheric Pressure Measurements (${timeFrame})`}
            avgLine={true}
          />
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CloudSun className="text-emerald-400 mr-2" size={20} />
              Chlorophyll Concentration
            </h3>
            <span className="text-xs text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-700/30">
              Avg: {stats.avgChlorophyll} mg/m³
            </span>
          </div>
          <Chart 
            data={prepareChartData('chlorophyll_mg_m3')}
            color="#10b981"
            title={`Chlorophyll Measurements (${timeFrame})`}
            avgLine={true}
          />
        </div>
      </div>
      
      {/* Anomaly Detection */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <AlertTriangle className="text-red-400 mr-2" size={20} />
            Anomaly Detection Timeline
          </h3>
          <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-medium border border-red-500/30">
            {anomalyCount} anomalies detected
          </span>
        </div>
        
        <div className="relative mb-6">
          <div className="h-20 bg-slate-700/50 rounded-lg relative">
            {/* Timeline base */}
            <div className="absolute left-0 right-0 h-1 bg-slate-600 top-1/2"></div>
            
            {/* Data points */}
            {data
              .filter(item => item.station_id === selectedStation)
              .slice(-100)  // Show last 100 data points
              .map((item, index) => {
                const position = (index / 100) * 100;
                return (
                  <div key={index}>
                    {/* Normal point */}
                    <div 
                      className={`absolute w-1 h-1 rounded-full ${item.anomaly === '1' ? 'bg-red-500' : 'bg-blue-400/50'}`}
                      style={{ 
                        left: `${position}%`, 
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                    
                    {/* Anomaly spike */}
                    {item.anomaly === '1' && (
                      <div className="absolute" style={{ left: `${position}%`, top: '0' }}>
                        <div 
                          className="w-1 bg-red-500"
                          style={{ 
                            height: '40px',
                            transform: 'translateX(-50%)'
                          }}
                        />
                        <div 
                          className="absolute w-4 h-4 bg-red-500 rounded-full animate-pulse"
                          style={{ 
                            top: '-5px',
                            left: '-5px',
                          }}
                          title={`Anomaly on ${item.date}: Water level: ${typeof item.water_level_m === 'number' ? item.water_level_m.toFixed(2) : item.water_level_m}m, Wind speed: ${typeof item.wind_speed_m_s === 'number' ? item.wind_speed_m_s.toFixed(2) : item.wind_speed_m_s} m/s`}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-xs text-slate-400">100 days ago</div>
            <div className="text-xs text-slate-400">Today</div>
          </div>
        </div>
        
        {/* Anomaly insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="text-red-400 mr-3 mt-1" size={20} />
              <div>
                <h4 className="text-red-300 font-medium">Anomaly Detection</h4>
                <p className="text-slate-300 text-sm mt-1">
                  The system has detected {anomalyCount} anomalies in the dataset. These represent 
                  unusual patterns that may indicate coastal threats, storms, or other significant events.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <div className="flex items-start">
              <Activity className="text-blue-400 mr-3 mt-1" size={20} />
              <div>
                <h4 className="text-blue-300 font-medium">Risk Analysis</h4>
                <p className="text-slate-300 text-sm mt-1">
                  Anomaly frequency: {((anomalyCount / data.length) * 100).toFixed(2)}% of data points.
                  Most anomalies correlate with water levels exceeding {stats.maxWaterLevel}m and 
                  wind speeds above {stats.maxWindSpeed}m/s.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Table Sample */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Activity className="text-cyan-400 mr-2" size={20} />
            Recent Data Points
          </h3>
          <select
            className="bg-slate-700/70 text-white rounded-lg px-3 py-1 border border-slate-600 text-sm"
            onChange={(e) => {
              // This would filter by different criteria in a real app
            }}
            defaultValue="all"
          >
            <option value="all">All Data</option>
            <option value="anomaly">Anomalies Only</option>
            <option value="highWater">High Water Level</option>
            <option value="highWind">High Wind Speed</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Droplets className="mr-1" size={14} />
                    <span>Water Level (m)</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Wind className="mr-1" size={14} />
                    <span>Wind Speed (m/s)</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Air Pressure (hPa)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Chlorophyll (mg/m³)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/20 divide-y divide-slate-700">
              {data
                .filter(item => item.station_id === selectedStation)
                .slice(-10)  // Show only the last 10 records
                .reverse()   // Show newest first
                .map((item, index) => (
                  <tr key={index} className={item.anomaly === '1' ? 'bg-red-900/20' : ''}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-200">{item.date}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">
                      <div className={`font-medium ${parseFloat(item.water_level_m) > stats.avgWaterLevel ? 'text-blue-300' : 'text-slate-200'}`}>
                        {typeof item.water_level_m === 'number' ? item.water_level_m.toFixed(3) : parseFloat(item.water_level_m).toFixed(3)}
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">
                      <div className={`font-medium ${parseFloat(item.wind_speed_m_s) > stats.avgWindSpeed ? 'text-amber-300' : 'text-slate-200'}`}>
                        {typeof item.wind_speed_m_s === 'number' ? item.wind_speed_m_s.toFixed(2) : parseFloat(item.wind_speed_m_s).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-200">
                      {typeof item.air_pressure_hpa === 'number' ? item.air_pressure_hpa.toFixed(1) : parseFloat(item.air_pressure_hpa).toFixed(1)}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-200">
                      {typeof item.chlorophyll_mg_m3 === 'number' ? item.chlorophyll_mg_m3.toFixed(3) : parseFloat(item.chlorophyll_mg_m3).toFixed(3)}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">
                      {item.anomaly === '1' ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-red-900/40 text-red-300 border border-red-700/30">
                          <AlertTriangle className="mr-1" size={12} />
                          Anomaly
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-900/40 text-green-300 border border-green-700/30">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end mt-4">
          <div className="text-slate-400 text-sm">
            Showing latest 10 readings out of {data.filter(item => item.station_id === selectedStation).length} records
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
