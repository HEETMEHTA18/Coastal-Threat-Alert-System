import React, { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, User, Calendar, Phone, Mail, Building, RefreshCw, Filter } from 'lucide-react';

export default function ThreatReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/threatReports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getSeverityColor = (severity) => {
    const colors = {
      'Low': 'bg-green-500/20 text-green-300 border-green-500',
      'Medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500', 
      'High': 'bg-orange-500/20 text-orange-300 border-orange-500',
      'Critical': 'bg-red-500/20 text-red-300 border-red-500'
    };
    return colors[severity] || colors.Medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-red-500/20 text-red-300 border-red-500',
      'INVESTIGATING': 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
      'RESOLVED': 'bg-green-500/20 text-green-300 border-green-500'
    };
    return colors[status] || colors.ACTIVE;
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading threat reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-orange-400" />
          Threat Reports ({filteredReports.length})
        </h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:ring-2 focus:ring-blue-400"
            >
              <option value="all" className="bg-slate-800">All Reports</option>
              <option value="ACTIVE" className="bg-slate-800">Active</option>
              <option value="INVESTIGATING" className="bg-slate-800">Investigating</option>
              <option value="RESOLVED" className="bg-slate-800">Resolved</option>
            </select>
          </div>
          
          <button 
            onClick={fetchReports}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No threat reports found.</p>
          <p className="text-gray-500 text-sm">Submit a new report to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div key={report._id} className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{report.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  
                  <p className="text-blue-200 mb-3">{report.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-blue-300">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{report.location}</span>
                    </div>
                    
                    <div className="flex items-center text-blue-300">
                      <User className="w-4 h-4 mr-2" />
                      <span>{report.reporter}</span>
                      {report.organization && <span className="ml-1">({report.organization})</span>}
                    </div>
                    
                    <div className="flex items-center text-blue-300">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center text-blue-300">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span>{report.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {(report.phone || report.email) && (
                <div className="border-t border-white/20 pt-4 mt-4">
                  <h4 className="text-white font-medium mb-2">Contact Information</h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {report.phone && (
                      <div className="flex items-center text-blue-300">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{report.phone}</span>
                      </div>
                    )}
                    {report.email && (
                      <div className="flex items-center text-blue-300">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{report.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weather Conditions */}
              {(report.weather?.windSpeed || report.weather?.temperature || report.weather?.visibility) && (
                <div className="border-t border-white/20 pt-4 mt-4">
                  <h4 className="text-white font-medium mb-2">Weather Conditions</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {report.weather.windSpeed && (
                      <div className="text-blue-300">
                        <span className="font-medium">Wind:</span> {report.weather.windSpeed} km/h
                      </div>
                    )}
                    {report.weather.temperature && (
                      <div className="text-blue-300">
                        <span className="font-medium">Temp:</span> {report.weather.temperature}°C
                      </div>
                    )}
                    {report.weather.visibility && (
                      <div className="text-blue-300">
                        <span className="font-medium">Visibility:</span> {report.weather.visibility} km
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Alert Info */}
              <div className="border-t border-white/20 pt-4 mt-4 flex items-center justify-between text-sm">
                <div className="text-blue-300">
                  <span className="font-medium">Alert Radius:</span> {report.alertRadius} km
                </div>
                <div className="text-blue-300">
                  <span className="font-medium">SMS Sent:</span> {report.smsSent || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
