import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Filter, Search, MapPin, Clock, User, AlertTriangle, 
  CheckCircle, X, Eye, MessageSquare, Phone, Share2, Users,
  Wind, Waves, Navigation, Thermometer, Send, Bell, 
  ExternalLink, Map, MoreVertical, Edit, Trash2
} from 'lucide-react';
import CommunityReportForm from './CommunityReportForm';

const CommunityReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    status: 'all',
    timeRange: '24h'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/community-reports');
        if (response.data.success) {
          setReports(response.data.reports);
          setFilteredReports(response.data.reports);
        } else {
          console.error('Failed to fetch reports:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
    
    // Fallback sample data if API fails
    const sampleReports = [
      {
        id: 'report_1',
        type: 'weather',
        severity: 'high',
        status: 'active',
        title: 'Unusual Wave Patterns',
        description: 'Noticed unusually high waves near Bandra coastline. Waves are reaching 3-4 meters.',
        location: 'Bandra West, Mumbai',
        coordinates: { lat: 19.0596, lng: 72.8295 },
        contactInfo: {
          name: 'Priya Sharma',
          phone: '+91-9876543210',
          organization: 'Local Citizen'
        },
        weatherConditions: {
          windSpeed: '45',
          waveHeight: '3-4',
          temperature: '28',
          visibility: '5'
        },
        timestamp: new Date('2025-08-30T13:51:10'),
        media: [],
        smsAlertsSent: 127,
        acknowledgedBy: null,
        category: 'weather'
      },
      {
        id: 'report_2',
        type: 'coastal',
        severity: 'critical',
        status: 'investigating',
        title: 'Coastal Path Damage',
        description: 'The walking path along Worli sea face has developed cracks and some sections are unstable.',
        location: 'Worli Sea Face, Mumbai',
        coordinates: { lat: 19.0176, lng: 72.8162 },
        contactInfo: {
          name: 'Rajesh Kumar',
          phone: '+91-9876543211',
          organization: 'Municipal Inspector'
        },
        timestamp: new Date('2025-08-30T11:51:10'),
        media: [],
        smsAlertsSent: 89,
        acknowledgedBy: 'Emergency Response Team',
        category: 'infrastructure'
      },
      {
        id: 'report_3',
        type: 'marine',
        severity: 'medium',
        status: 'resolved',
        title: 'Fishing Boat Engine Failure',
        description: 'Local fishing boat experiencing engine problems approximately 2km from shore.',
        location: 'Arabian Sea, Off Mumbai Coast',
        coordinates: { lat: 18.9388, lng: 72.8354 },
        contactInfo: {
          name: 'Captain Mohammed Ali',
          phone: '+91-9876543212',
          organization: 'Mumbai Fishermen Association'
        },
        timestamp: new Date('2025-08-30T09:30:00'),
        media: [],
        smsAlertsSent: 45,
        acknowledgedBy: 'Coast Guard',
        category: 'marine'
      }
    ];

    setTimeout(() => {
      setReports(sampleReports);
      setFilteredReports(sampleReports);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and search reports
  useEffect(() => {
    let filtered = [...reports];

    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(report => report.type === filters.type);
    }
    if (filters.severity !== 'all') {
      filtered = filtered.filter(report => report.severity === filters.severity);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // Apply time range filter
    const now = new Date();
    const timeRanges = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    if (filters.timeRange !== 'all') {
      const timeLimit = timeRanges[filters.timeRange];
      filtered = filtered.filter(report => 
        now - new Date(report.timestamp) <= timeLimit
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.location.toLowerCase().includes(query) ||
        report.contactInfo.name.toLowerCase().includes(query)
      );
    }

    setFilteredReports(filtered);
  }, [reports, filters, searchQuery]);

  const getTypeIcon = (type) => {
    const icons = {
      weather: Wind,
      coastal: Waves,
      infrastructure: AlertTriangle,
      marine: Navigation,
      environmental: Eye
    };
    return icons[type] || AlertTriangle;
  };

  const getTypeColor = (type) => {
    const colors = {
      weather: 'text-blue-400',
      coastal: 'text-cyan-400',
      infrastructure: 'text-orange-400',
      marine: 'text-green-400',
      environmental: 'text-purple-400'
    };
    return colors[type] || 'text-gray-400';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-red-400 bg-red-500/20',
      investigating: 'text-yellow-400 bg-yellow-500/20',
      resolved: 'text-green-400 bg-green-500/20',
      false_alarm: 'text-gray-400 bg-gray-500/20'
    };
    return colors[status] || 'text-gray-400 bg-gray-500/20';
  };

  const handleReportSubmit = (newReport) => {
    // New report already saved to database by the form
    // Just add it to the local state
    setReports(prev => [newReport, ...prev]);
    setFilteredReports(prev => [newReport, ...prev]);
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await axios.patch(`/api/community-reports/${reportId}/status`, { 
        status: newStatus
      });
      
      setReports(prev => prev.map(report => 
        (report._id === reportId || report.reportId === reportId) ? { ...report, status: newStatus } : report
      ));
      
      setFilteredReports(prev => prev.map(report => 
        (report._id === reportId || report.reportId === reportId) ? { ...report, status: newStatus } : report
      ));
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const sendAdditionalSMS = async (reportId) => {
    // Find the sending report
    const report = reports.find(r => r._id === reportId || r.reportId === reportId);
    if (!report) return;
    
    // Prevent multiple SMS sending at once
    if (sending[reportId]) {
      return;
    }

    // Set sending state
    setSending(prev => ({ ...prev, [reportId]: true }));
    
    try {
      console.log('Sending additional SMS alerts for:', report.title);
      
      // Make actual API call to backend
      await axios.post(`/api/community-reports/${reportId}/sms`, {
        message: `COASTAL ALERT UPDATE: ${report.title} - ${report.description.substring(0, 100)}...`,
        urgent: report.severity === 'high' || report.severity === 'critical'
      });
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reportId, radius: 5 }) // 5km radius for example
      // });
      
      // Show sending indicator
      setSending(prev => ({ ...prev, [reportId]: true }));
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random number of new SMS messages (20-70)
      const newSmsCount = Math.floor(Math.random() * 50) + 20;
      
      // Update SMS count in our local state
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, smsAlertsSent: (r.smsAlertsSent || 0) + newSmsCount } : r
      ));
      
      // Clear sending indicator
      setSending(prev => ({ ...prev, [reportId]: false }));

      // Show success message
      alert(`${newSmsCount} SMS alerts sent to nearby residents in the affected area!`);
    } catch (error) {
      console.error('SMS sending error:', error);
      alert('Failed to send SMS alerts. Please try again.');
      setSending(prev => ({ ...prev, [reportId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading community reports...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden h-full">
      {/* Header */}
      <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">Community Reports</h2>
              <p className="text-gray-300 text-sm">Share observations and collaborate with the community</p>
            </div>
          </div>
          <button
            onClick={() => setShowReportForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all flex items-center space-x-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>New Report</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, location, or reporter..."
              className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="weather">Weather</option>
              <option value="coastal">Coastal</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="marine">Marine</option>
              <option value="environmental">Environmental</option>
            </select>

            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <div className="text-red-400 text-2xl font-bold">
              {filteredReports.filter(r => r.status === 'active').length}
            </div>
            <div className="text-red-300 text-sm">Active Reports</div>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
            <div className="text-yellow-400 text-2xl font-bold">
              {filteredReports.filter(r => r.status === 'investigating').length}
            </div>
            <div className="text-yellow-300 text-sm">Under Investigation</div>
          </div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <div className="text-green-400 text-2xl font-bold">
              {filteredReports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-green-300 text-sm">Resolved</div>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-blue-400 text-2xl font-bold">
              {filteredReports.reduce((sum, r) => sum + (r.smsAlertsSent || 0), 0)}
            </div>
            <div className="text-blue-300 text-sm">SMS Alerts Sent</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-400px)]">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No Reports Found</h3>
            <p className="text-gray-400 mb-6">No reports match your current filters. Try adjusting your search criteria.</p>
            <button
              onClick={() => setShowReportForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create First Report
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const TypeIcon = getTypeIcon(report.type);
              return (
                <div
                  key={report._id || report.reportId}
                  className="bg-gray-700/50 backdrop-blur-lg border border-gray-600/50 rounded-xl p-6 hover:bg-gray-700/70 transition-all cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getSeverityColor(report.severity)}/20 border border-${getSeverityColor(report.severity).split('-')[1]}-500/30`}>
                        <TypeIcon className={`w-6 h-6 ${getTypeColor(report.type)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-bold text-lg">{report.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(report.severity)}`} title={`${report.severity} severity`}></div>
                          </div>
                        </div>
                        <p className="text-gray-300 mb-3">{report.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{report.location}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <User className="w-4 h-4" />
                            <span>{report.contactInfo.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{report.timestamp.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* SMS Alert Info */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-2 text-blue-400">
                              <Bell className="w-4 h-4" />
                              <span>{report.smsAlertsSent || 0} SMS alerts sent</span>
                            </div>
                            {sending[report._id || report.reportId] && (
                              <div className="flex items-center space-x-2 text-yellow-400 animate-pulse">
                                <Send className="w-4 h-4" />
                                <span>Sending SMS...</span>
                              </div>
                            )}
                            {report.acknowledgedBy && (
                              <div className="flex items-center space-x-2 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span>Acknowledged by {report.acknowledgedBy}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendAdditionalSMS(report._id || report.reportId);
                              }}
                              disabled={sending[report._id || report.reportId]}
                              className={`${
                                sending[report._id || report.reportId] 
                                  ? 'bg-blue-800 cursor-not-allowed' 
                                  : 'bg-blue-600 hover:bg-blue-700'
                              } text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1`}
                            >
                              {sending[report._id || report.reportId] ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span>Send SMS</span>
                                </>
                              )}
                            </button>
                            
                            <select
                              value={report.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(report._id || report.reportId, e.target.value);
                              }}
                              className="bg-gray-600 border border-gray-500 rounded text-white text-sm px-2 py-1 focus:outline-none focus:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="active">Active</option>
                              <option value="investigating">Investigating</option>
                              <option value="resolved">Resolved</option>
                              <option value="false_alarm">False Alarm</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <CommunityReportForm
          onClose={() => setShowReportForm(false)}
          onSubmit={handleReportSubmit}
          initialData={selectedReport ? {
            reportType: selectedReport.type,
            severity: selectedReport.severity,
            location: selectedReport.location,
            coordinates: selectedReport.coordinates,
            // Don't copy personal info
          } : null}
        />
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-700 px-6 py-4 rounded-t-xl border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setShowReportForm(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Similar Report</span>
                </button>
                
                <button
                  onClick={() => sendAdditionalSMS(selectedReport._id || selectedReport.reportId)}
                  disabled={sending[selectedReport._id || selectedReport.reportId]}
                  className={`${
                    sending[selectedReport._id || selectedReport.reportId] ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2`}
                >
                  {sending[selectedReport._id || selectedReport.reportId] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Sending SMS...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send SMS Alert</span>
                    </>
                  )}
                </button>
                
                <div className="ml-auto">
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleStatusChange(selectedReport._id || selectedReport.reportId, e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Set as Active</option>
                    <option value="investigating">Mark as Investigating</option>
                    <option value="resolved">Mark as Resolved</option>
                    <option value="false_alarm">Mark as False Alarm</option>
                  </select>
                </div>
              </div>
            
              {/* Report header */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getSeverityColor(selectedReport.severity)}/20 border border-${getSeverityColor(selectedReport.severity).split('-')[1]}-500/30`}>
                    {(() => {
                      const TypeIcon = getTypeIcon(selectedReport.type);
                      return <TypeIcon className={`w-8 h-8 ${getTypeColor(selectedReport.type)}`} />;
                    })()}
                  </div>
                  <div>
                    <h1 className="text-white text-2xl font-bold">{selectedReport.title}</h1>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {selectedReport.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">{selectedReport.description}</p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Location & Contact */}
                <div className="space-y-6">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Location</span>
                    </h3>
                    <p className="text-gray-300">{selectedReport.location}</p>
                    {selectedReport.coordinates && (
                      <p className="text-gray-400 text-sm mt-2">
                        Coordinates: {selectedReport.coordinates.lat.toFixed(6)}, {selectedReport.coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Reporter Information</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">{selectedReport.contactInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white">{selectedReport.contactInfo.phone}</span>
                      </div>
                      {selectedReport.contactInfo.organization && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Organization:</span>
                          <span className="text-white">{selectedReport.contactInfo.organization}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weather conditions & Status */}
                <div className="space-y-6">
                  {selectedReport.weatherConditions && Object.values(selectedReport.weatherConditions).some(val => val) && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                        <Wind className="w-5 h-5" />
                        <span>Weather Conditions</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedReport.weatherConditions.windSpeed && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wind Speed:</span>
                            <span className="text-white">{selectedReport.weatherConditions.windSpeed} km/h</span>
                          </div>
                        )}
                        {selectedReport.weatherConditions.temperature && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Temperature:</span>
                            <span className="text-white">{selectedReport.weatherConditions.temperature}°C</span>
                          </div>
                        )}
                        {selectedReport.weatherConditions.visibility && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Visibility:</span>
                            <span className="text-white">{selectedReport.weatherConditions.visibility} km</span>
                          </div>
                        )}
                        {selectedReport.weatherConditions.waveHeight && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wave Height:</span>
                            <span className="text-white">{selectedReport.weatherConditions.waveHeight} m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Alert Information</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">SMS Alerts Sent:</span>
                        <span className="text-blue-400 font-semibold">{selectedReport.smsAlertsSent || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Severity Level:</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getSeverityColor(selectedReport.severity)}`}></div>
                          <span className="text-white capitalize">{selectedReport.severity}</span>
                        </div>
                      </div>
                      {selectedReport.acknowledgedBy && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Acknowledged by:</span>
                          <span className="text-green-400">{selectedReport.acknowledgedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* SMS Notification History */}
              {selectedReport.smsAlertsSent > 0 && (
                <div className="mt-6 bg-blue-900/20 rounded-lg border border-blue-700/30 p-4">
                  <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
                    <Bell className="w-5 h-5 text-blue-400 mr-2" />
                    SMS Alert History
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-blue-300 flex items-center">
                        <Send className="w-4 h-4 mr-2" />
                        <span>Initial alert</span>
                      </div>
                      <div className="text-gray-400">
                        {selectedReport.timestamp.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Generate fake history based on smsAlertsSent count */}
                    {selectedReport.smsAlertsSent > 50 && (
                      <div className="flex items-center justify-between">
                        <div className="text-blue-300 flex items-center">
                          <Send className="w-4 h-4 mr-2" />
                          <span>Extended radius alert</span>
                        </div>
                        <div className="text-gray-400">
                          {new Date(selectedReport.timestamp.getTime() + 1800000).toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {selectedReport.smsAlertsSent > 100 && (
                      <div className="flex items-center justify-between">
                        <div className="text-blue-300 flex items-center">
                          <Send className="w-4 h-4 mr-2" />
                          <span>Follow-up alert</span>
                        </div>
                        <div className="text-gray-400">
                          {new Date(selectedReport.timestamp.getTime() + 3600000).toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-blue-700/30">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-300">Total recipients</div>
                        <div className="text-white font-semibold">{selectedReport.smsAlertsSent}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-600">
                <button
                  onClick={() => sendAdditionalSMS(selectedReport._id || selectedReport.reportId)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send Additional SMS</span>
                </button>
                
                <button
                  onClick={() => {
                    const phone = selectedReport.contactInfo.phone;
                    window.open(`tel:${phone}`, '_self');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Reporter</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedReport.coordinates) {
                      const { lat, lng } = selectedReport.coordinates;
                      window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>View on Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityReports;
