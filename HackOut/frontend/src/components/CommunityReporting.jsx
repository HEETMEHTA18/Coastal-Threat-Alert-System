import React, { useState, useEffect } from 'react';
import { MessageCircle, Camera, MapPin, AlertTriangle, Users, Send, Heart, MessageSquare, Share, Filter, Plus, Image, Video, Mic } from 'lucide-react';

const CommunityReporting = ({ user, onSubmitReport }) => {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    type: 'observation',
    title: '',
    description: '',
    location: '',
    severity: 'low',
    category: 'general',
    media: []
  });
  const [showReportForm, setShowReportForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isRecording, setIsRecording] = useState(false);

  const reportTypes = [
    { id: 'observation', name: 'General Observation', icon: MessageCircle, color: 'blue' },
    { id: 'threat', name: 'Threat Alert', icon: AlertTriangle, color: 'red' },
    { id: 'damage', name: 'Damage Report', icon: Camera, color: 'orange' },
    { id: 'assistance', name: 'Need Assistance', icon: Users, color: 'purple' }
  ];

  const categories = [
    'general', 'erosion', 'flooding', 'wildlife', 'pollution', 'infrastructure', 'weather', 'emergency'
  ];

  const severityLevels = [
    { id: 'low', name: 'Low', color: 'green' },
    { id: 'medium', name: 'Medium', color: 'yellow' },
    { id: 'high', name: 'High', color: 'red' },
    { id: 'critical', name: 'Critical', color: 'purple' }
  ];

  useEffect(() => {
    // Load mock community reports
    loadCommunityReports();
  }, []);

  const loadCommunityReports = () => {
    const mockReports = [
      {
        id: 1,
        type: 'threat',
        title: 'Unusual Wave Patterns',
        description: 'Noticed unusually high waves near Bandra coastline. Waves are reaching 3-4 meters.',
        location: 'Bandra West, Mumbai',
        severity: 'medium',
        category: 'weather',
        author: {
          name: 'Priya Sharma',
          role: 'citizen',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya'
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 12,
        comments: 5,
        verified: false,
        media: [
          { type: 'image', url: '/api/placeholder/300/200', caption: 'High waves at Bandra' }
        ]
      },
      {
        id: 2,
        type: 'damage',
        title: 'Coastal Path Damage',
        description: 'The walking path along Worli sea face has developed cracks and some sections are unstable.',
        location: 'Worli Sea Face, Mumbai',
        severity: 'high',
        category: 'infrastructure',
        author: {
          name: 'Rajesh Kumar',
          role: 'official',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh'
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        likes: 28,
        comments: 12,
        verified: true,
        media: [
          { type: 'image', url: '/api/placeholder/300/200', caption: 'Damaged pathway' },
          { type: 'image', url: '/api/placeholder/300/200', caption: 'Close-up of cracks' }
        ]
      },
      {
        id: 3,
        type: 'observation',
        title: 'Marine Life Sighting',
        description: 'Spotted a group of dolphins near Gateway of India this morning. They seemed healthy and active.',
        location: 'Gateway of India, Mumbai',
        severity: 'low',
        category: 'wildlife',
        author: {
          name: 'Anita Desai',
          role: 'researcher',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anita'
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        likes: 45,
        comments: 18,
        verified: true,
        media: [
          { type: 'video', url: '/api/placeholder/300/200', caption: 'Dolphins near Gateway' }
        ]
      }
    ];
    setReports(mockReports);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    const report = {
      id: Date.now(),
      ...newReport,
      author: {
        name: user?.name || 'Anonymous',
        role: user?.role || 'citizen',
        avatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous'
      },
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      verified: false
    };

    setReports([report, ...reports]);
    setNewReport({
      type: 'observation',
      title: '',
      description: '',
      location: '',
      severity: 'low',
      category: 'general',
      media: []
    });
    setShowReportForm(false);

    if (onSubmitReport) {
      onSubmitReport(report);
    }
  };

  const handleLike = (reportId) => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, likes: report.likes + 1 }
        : report
    ));
  };

  const handleMediaUpload = (type) => {
    // Mock media upload
    const mockMedia = {
      type,
      url: '/api/placeholder/300/200',
      caption: `${type} uploaded by user`
    };
    setNewReport({
      ...newReport,
      media: [...newReport.media, mockMedia]
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-purple-400 bg-purple-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeColor = (type) => {
    const typeObj = reportTypes.find(t => t.id === type);
    switch (typeObj?.color) {
      case 'red': return 'text-red-400 bg-red-500/20';
      case 'orange': return 'text-orange-400 bg-orange-500/20';
      case 'purple': return 'text-purple-400 bg-purple-500/20';
      case 'blue': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.type === filter || report.category === filter || report.severity === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">Community Reports</h2>
              <p className="text-gray-400">Share observations and collaborate with the community</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowReportForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all' ? 'bg-blue-500/30 text-blue-400' : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            All Reports
          </button>
          {reportTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === type.id ? getTypeColor(type.id) : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* New Report Form */}
      {showReportForm && (
        <div className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-4">Submit New Report</h3>
          
          <form onSubmit={handleSubmitReport} className="space-y-4">
            {/* Report Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Report Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {reportTypes.map(type => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setNewReport({...newReport, type: type.id})}
                      className={`p-3 rounded-lg border transition-all ${
                        newReport.type === type.id
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-white/20 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <IconComponent className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-xs">{type.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={newReport.title}
                  onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the issue"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  required
                  value={newReport.location}
                  onChange={(e) => setNewReport({...newReport, location: e.target.value})}
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Specific location or area"
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Description</label>
              <textarea
                required
                rows={3}
                value={newReport.description}
                onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of what you observed"
              />
            </div>

            {/* Category and Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Category</label>
                <select
                  value={newReport.category}
                  onChange={(e) => setNewReport({...newReport, category: e.target.value})}
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-gray-800">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Severity</label>
                <select
                  value={newReport.severity}
                  onChange={(e) => setNewReport({...newReport, severity: e.target.value})}
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {severityLevels.map(level => (
                    <option key={level.id} value={level.id} className="bg-gray-800">
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Add Media</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleMediaUpload('image')}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  <Image className="w-4 h-4" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMediaUpload('video')}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                >
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecording(!isRecording);
                    if (!isRecording) {
                      setTimeout(() => {
                        setIsRecording(false);
                        handleMediaUpload('audio');
                      }, 3000);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-500/30 text-red-400 animate-pulse' 
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{isRecording ? 'Recording...' : 'Audio'}</span>
                </button>
              </div>
            </div>

            {/* Media Preview */}
            {newReport.media.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {newReport.media.map((media, index) => (
                  <div key={index} className="relative bg-white/10 rounded-lg p-2">
                    <div className="w-full h-20 bg-gray-600 rounded flex items-center justify-center">
                      {media.type === 'image' && <Image className="w-8 h-8 text-white" />}
                      {media.type === 'video' && <Video className="w-8 h-8 text-white" />}
                      {media.type === 'audio' && <Mic className="w-8 h-8 text-white" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{media.caption}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:scale-105 transition-transform flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map(report => {
          const reportType = reportTypes.find(t => t.id === report.type);
          const IconComponent = reportType?.icon || MessageCircle;
          
          return (
            <div key={report.id} className="bg-black/20 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              {/* Report Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={report.author.avatar}
                    alt={report.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-bold">{report.title}</h3>
                      {report.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {report.author.name} • {report.author.role} • {report.timestamp.toLocaleString()}
                    </p>
                    <p className="text-gray-300 flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{report.location}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${getTypeColor(report.type)}`}>
                    {reportType?.name}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(report.severity)}`}>
                    {report.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Report Content */}
              <p className="text-gray-300 mb-4">{report.description}</p>

              {/* Media */}
              {report.media && report.media.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {report.media.map((media, index) => (
                    <div key={index} className="relative bg-gray-700 rounded-lg overflow-hidden">
                      <div className="w-full h-32 bg-gray-600 flex items-center justify-center">
                        {media.type === 'image' && <Image className="w-8 h-8 text-white" />}
                        {media.type === 'video' && <Video className="w-8 h-8 text-white" />}
                        {media.type === 'audio' && <Mic className="w-8 h-8 text-white" />}
                      </div>
                      {media.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                          <p className="text-white text-xs">{media.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Report Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(report.id)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    <span>{report.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    <span>{report.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                    <Share className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
                
                <div className="text-gray-400 text-sm">
                  Category: {report.category}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityReporting;
