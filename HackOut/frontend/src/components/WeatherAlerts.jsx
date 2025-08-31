import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell, Wind, Droplets, Thermometer, Eye, Navigation, Clock } from 'lucide-react';

const WeatherAlerts = ({ weatherData, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    if (weatherData) {
      generateAlerts(weatherData);
    }
  }, [weatherData]);

  const generateAlerts = (data) => {
    const newAlerts = [];
    const current = data.current || {};

    // High wind speed alert
    if (current.windSpeed > 25) {
      newAlerts.push({
        id: 'wind_high',
        type: 'warning',
        title: 'High Wind Advisory',
        message: `Wind speeds of ${current.windSpeed} km/h detected. Potential for coastal damage.`,
        severity: current.windSpeed > 40 ? 'critical' : 'warning',
        icon: Wind,
        timestamp: new Date(),
        actions: ['Monitor coastline', 'Secure loose objects', 'Avoid water activities']
      });
    }

    // Heavy precipitation alert
    if (current.precipitation > 10) {
      newAlerts.push({
        id: 'rain_heavy',
        type: 'warning',
        title: 'Heavy Rainfall Warning',
        message: `${current.precipitation}mm of rain detected. Risk of coastal flooding.`,
        severity: current.precipitation > 25 ? 'critical' : 'warning',
        icon: Droplets,
        timestamp: new Date(),
        actions: ['Monitor drainage systems', 'Prepare sandbags', 'Avoid low-lying areas']
      });
    }

    // Temperature extreme alert
    if (current.temperature > 35 || current.temperature < 5) {
      newAlerts.push({
        id: 'temp_extreme',
        type: current.temperature > 35 ? 'heat' : 'cold',
        title: current.temperature > 35 ? 'Extreme Heat Warning' : 'Cold Weather Alert',
        message: `Temperature of ${current.temperature}°C may affect coastal ecosystems.`,
        severity: 'warning',
        icon: Thermometer,
        timestamp: new Date(),
        actions: ['Monitor marine life', 'Check water quality', 'Protect vulnerable species']
      });
    }

    // Low visibility alert
    if (current.visibility < 5) {
      newAlerts.push({
        id: 'visibility_low',
        type: 'warning',
        title: 'Low Visibility Alert',
        message: `Visibility reduced to ${current.visibility}km. Maritime navigation hazard.`,
        severity: 'warning',
        icon: Eye,
        timestamp: new Date(),
        actions: ['Restrict boat traffic', 'Use navigation aids', 'Increase safety measures']
      });
    }

    // Storm surge prediction
    if (current.pressure < 1000) {
      newAlerts.push({
        id: 'pressure_low',
        type: 'critical',
        title: 'Storm Surge Risk',
        message: `Low pressure system (${current.pressure}hPa) detected. Potential storm surge threat.`,
        severity: 'critical',
        icon: AlertTriangle,
        timestamp: new Date(),
        actions: ['Evacuate low areas', 'Close coastal roads', 'Activate emergency protocols']
      });
    }

    setAlerts(newAlerts);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'warning': return 'from-yellow-500 to-orange-500';
      case 'info': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 border-blue-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  if (!alerts.length) {
    return (
      <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-green-400 text-xl font-bold mb-2">All Clear</h3>
        <p className="text-green-200">No active weather alerts for your area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span>Active Weather Alerts ({alerts.length})</span>
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Alert Cards */}
        <div className="space-y-3">
          {alerts.map((alert) => {
            const IconComponent = alert.icon;
            return (
              <div
                key={alert.id}
                className={`${getSeverityBg(alert.severity)} backdrop-blur-lg rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02]`}
                onClick={() => setActiveAlert(activeAlert === alert.id ? null : alert.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getSeverityColor(alert.severity)} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{alert.title}</h3>
                      <p className="text-gray-300 text-sm">{alert.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{alert.timestamp.toLocaleTimeString()}</span>
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="text-white/60 hover:text-white">
                    <Navigation className={`w-4 h-4 transition-transform ${
                      activeAlert === alert.id ? 'rotate-90' : ''
                    }`} />
                  </button>
                </div>

                {/* Expanded Alert Details */}
                {activeAlert === alert.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-white font-semibold mb-2">Recommended Actions:</h4>
                    <ul className="space-y-1">
                      {alert.actions.map((action, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex space-x-2 mt-4">
                      <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm transition-colors">
                        Share Alert
                      </button>
                      <button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-lg text-sm transition-colors">
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Wind className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm font-medium">Wind</span>
          </div>
          <p className="text-white text-lg font-bold">{weatherData?.current?.windSpeed || 0} km/h</p>
        </div>
        
        <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-white text-sm font-medium">Rain</span>
          </div>
          <p className="text-white text-lg font-bold">{weatherData?.current?.precipitation || 0} mm</p>
        </div>
        
        <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-red-400" />
            <span className="text-white text-sm font-medium">Temp</span>
          </div>
          <p className="text-white text-lg font-bold">{weatherData?.current?.temperature || 0}°C</p>
        </div>
        
        <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-medium">Visibility</span>
          </div>
          <p className="text-white text-lg font-bold">{weatherData?.current?.visibility || 0} km</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherAlerts;
