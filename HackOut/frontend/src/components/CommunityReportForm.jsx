import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertTriangle, MapPin, Send, Users, Phone, MessageSquare, 
  Camera, Upload, X, CheckCircle, Clock, Waves, Wind, 
  Thermometer, Eye, Navigation, Save, Share2, Bell
} from 'lucide-react';

const CommunityReportForm = ({ onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    reportType: initialData?.reportType || 'weather',
    severity: initialData?.severity || 'medium',
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    coordinates: initialData?.coordinates || { lat: null, lng: null },
    contactInfo: {
      name: '',
      phone: '',
      email: '',
      organization: ''
    },
    weatherConditions: {
      windSpeed: initialData?.weatherConditions?.windSpeed || '',
      waveHeight: initialData?.weatherConditions?.waveHeight || '',
      temperature: initialData?.weatherConditions?.temperature || '',
      visibility: initialData?.weatherConditions?.visibility || '',
      precipitation: '',
      pressure: ''
    },
    emergencyDetails: {
      immediateRisk: false,
      affectedArea: '',
      estimatedPeople: '',
      evacuationNeeded: false,
      infrastructureDamage: false
    },
    media: [],
    notifications: {
      smsRadius: 5, // km
      urgentAlert: false,
      authorities: true,
      community: true
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [gettingLocation, setGettingLocation] = useState(false);
  const fileInputRef = useRef(null);

  const reportTypes = [
    { id: 'weather', label: 'Severe Weather', icon: Wind, description: 'Storm, high winds, heavy rain' },
    { id: 'coastal', label: 'Coastal Emergency', icon: Waves, description: 'Flooding, erosion, storm surge' },
    { id: 'infrastructure', label: 'Infrastructure Damage', icon: AlertTriangle, description: 'Road closures, utility outages' },
    { id: 'marine', label: 'Marine Incident', icon: Navigation, description: 'Boat distress, water rescue needed' },
    { id: 'environmental', label: 'Environmental Hazard', icon: Eye, description: 'Pollution, wildlife concerns' }
  ];

  const severityLevels = [
    { id: 'low', label: 'Low', color: 'bg-green-500', description: 'Monitor situation' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-500', description: 'Take precautions' },
    { id: 'high', label: 'High', color: 'bg-orange-500', description: 'Immediate action needed' },
    { id: 'critical', label: 'Critical', color: 'bg-red-500', description: 'Emergency response required' }
  ];

  // Get user's current location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          setGettingLocation(false);
          
          // Reverse geocoding to get address
          if (window.google && window.google.maps) {
            const geocoder = new google.maps.Geocoder();
            const latLng = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            geocoder.geocode({ location: latLng }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setFormData(prev => ({
                  ...prev,
                  location: results[0].formatted_address
                }));
              }
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setGettingLocation(false);
          alert('Unable to get your location. Please enter manually.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setGettingLocation(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValid = file.size <= 10 * 1024 * 1024; // 10MB limit
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isValid && (isImage || isVideo);
    });

    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video'
      }))]
    }));
  };

  // Remove uploaded file
  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.contactInfo.name.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.contactInfo.phone.trim()) newErrors.contactPhone = 'Phone number is required';

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.contactInfo.phone && !phoneRegex.test(formData.contactInfo.phone.replace(/\s/g, ''))) {
      newErrors.contactPhone = 'Invalid phone number format';
    }

    // Critical reports require more details
    if (formData.severity === 'critical') {
      if (!formData.emergencyDetails.affectedArea.trim()) {
        newErrors.affectedArea = 'Affected area description required for critical reports';
      }
      if (!formData.emergencyDetails.estimatedPeople.trim()) {
        newErrors.estimatedPeople = 'Estimated affected people required for critical reports';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Create form data with file uploads
      const formDataToSubmit = new FormData();
      
      // Add report ID and timestamp
      const completeFormData = {
        ...formData,
        media: undefined // Remove media from JSON, will be added separately
      };
      
      // Prepare data for submission
      formDataToSubmit.append('reportData', JSON.stringify(completeFormData));

      // Add media files if any
      formData.media.forEach((media) => {
        formDataToSubmit.append('media', media.file);
      });

      // Send to backend API
      const response = await fetch('/api/community-reports', {
        method: 'POST',
        body: formDataToSubmit,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      const result = await response.json();
      
      // Show success message
      setShowSuccess(true);

      setTimeout(() => {
        if (onSubmit) onSubmit(result.report);
        if (onClose) onClose();
      }, 3000);

    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send SMS notifications to nearby people
  const sendSMSNotifications = async () => {
    try {
      const smsData = {
        location: formData.coordinates,
        radius: formData.notifications.smsRadius,
        message: generateSMSMessage(),
        severity: formData.severity,
        urgentAlert: formData.notifications.urgentAlert
      };

      // Simulate SMS API call
      console.log('Sending SMS notifications:', smsData);
      
      // In real implementation, this would call your SMS service
      // await fetch('/api/send-sms-alerts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(smsData)
      // });

    } catch (error) {
      console.error('SMS notification error:', error);
    }
  };

  // Generate SMS message based on report
  const generateSMSMessage = () => {
    const urgencyPrefix = formData.severity === 'critical' ? '🚨 URGENT: ' : 
                         formData.severity === 'high' ? '⚠️ ALERT: ' : '📢 NOTICE: ';
    
    const location = formData.location.split(',')[0]; // Get main location
    
    return `${urgencyPrefix}${formData.title} reported near ${location}. ${formData.description.substring(0, 100)}${formData.description.length > 100 ? '...' : ''} Stay safe and follow local advisories. Report ID: ${Date.now()}`;
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Report Submitted Successfully!</h3>
          <p className="text-gray-300 mb-4">
            Your community report has been submitted and nearby residents have been notified via SMS.
          </p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">
              📱 SMS alerts sent to ~{Math.round(formData.notifications.smsRadius * formData.notifications.smsRadius * 3.14 / 10)} people within {formData.notifications.smsRadius}km
            </p>
          </div>
          <button
            onClick={() => onClose && onClose()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full mx-4 my-8">
        {/* Header */}
        <div className="bg-gray-700 px-6 py-4 rounded-t-xl border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-bold flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <span>Community Emergency Report</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center space-x-4 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 3 && <div className={`w-12 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-600'
                }`} />}
              </div>
            ))}
          </div>
          <div className="flex space-x-16 mt-2 text-xs text-gray-400">
            <span>Report Details</span>
            <span>Contact & Location</span>
            <span>Emergency Info</span>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Report Type and Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-3">Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <div
                        key={type.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.reportType === type.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, reportType: type.id }))}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="w-6 h-6 text-blue-400" />
                          <div>
                            <h3 className="text-white font-semibold">{type.label}</h3>
                            <p className="text-gray-400 text-sm">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-3">Severity Level</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {severityLevels.map((level) => (
                    <div
                      key={level.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.severity === level.id
                          ? 'border-white bg-white/10'
                          : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, severity: level.id }))}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                        <span className="text-white font-medium">{level.label}</span>
                      </div>
                      <p className="text-gray-400 text-xs">{level.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Report Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the situation"
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Detailed Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about what you observed, current conditions, and any immediate concerns..."
                  rows="5"
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Weather conditions for weather reports */}
              {formData.reportType === 'weather' && (
                <div>
                  <label className="block text-white font-semibold mb-3">Current Weather Conditions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Wind Speed (km/h)</label>
                      <input
                        type="number"
                        value={formData.weatherConditions.windSpeed}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          weatherConditions: { ...prev.weatherConditions, windSpeed: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Temperature (°C)</label>
                      <input
                        type="number"
                        value={formData.weatherConditions.temperature}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          weatherConditions: { ...prev.weatherConditions, temperature: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Visibility (km)</label>
                      <input
                        type="number"
                        value={formData.weatherConditions.visibility}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          weatherConditions: { ...prev.weatherConditions, visibility: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Media Upload */}
              <div>
                <label className="block text-white font-semibold mb-3">Photos/Videos (Optional)</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Upload Media
                    </button>
                    <p className="text-gray-400 text-sm mt-2">
                      Upload photos or videos to help illustrate the situation (Max 10MB each)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Media Preview */}
                  {formData.media.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {formData.media.map((media, index) => (
                        <div key={index} className="relative group">
                          {media.type === 'image' ? (
                            <img
                              src={media.preview}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={media.preview}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          )}
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information and Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.contactInfo.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, name: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                        errors.contactName ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    {errors.contactName && <p className="text-red-400 text-sm mt-1">{errors.contactName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.contactInfo.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, phone: e.target.value }
                      }))}
                      placeholder="+1234567890"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                        errors.contactPhone ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    {errors.contactPhone && <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Email (Optional)</label>
                    <input
                      type="email"
                      value={formData.contactInfo.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: e.target.value }
                      }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Organization (Optional)</label>
                    <input
                      type="text"
                      value={formData.contactInfo.organization}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, organization: e.target.value }
                      }))}
                      placeholder="e.g., Coast Guard, Local Fisherman, etc."
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Location Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Location Description *</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter specific address or landmark"
                        className={`flex-1 px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                          errors.location ? 'border-red-500' : 'border-gray-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <MapPin className="w-5 h-5" />
                        <span>{gettingLocation ? 'Getting...' : 'Use My Location'}</span>
                      </button>
                    </div>
                    {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
                  </div>

                  {formData.coordinates.lat && formData.coordinates.lng && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-green-400 text-sm">
                        📍 Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">SMS Alert Radius</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={formData.notifications.smsRadius}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, smsRadius: parseInt(e.target.value) }
                        }))}
                        className="flex-1"
                      />
                      <span className="text-white font-medium min-w-0">{formData.notifications.smsRadius} km</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      People within this radius will receive SMS alerts
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.notifications.urgentAlert}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, urgentAlert: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Send urgent alert (immediate SMS)</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.notifications.authorities}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, authorities: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Notify local authorities</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.notifications.community}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, community: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Notify community members</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Details and Final Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Emergency Assessment */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Emergency Assessment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Affected Area Description</label>
                    <textarea
                      value={formData.emergencyDetails.affectedArea}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyDetails: { ...prev.emergencyDetails, affectedArea: e.target.value }
                      }))}
                      placeholder="Describe the geographic area affected (e.g., 2-block radius, entire coastline, specific neighborhoods)"
                      rows="3"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none ${
                        errors.affectedArea ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    {errors.affectedArea && <p className="text-red-400 text-sm mt-1">{errors.affectedArea}</p>}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Estimated People Affected</label>
                    <input
                      type="text"
                      value={formData.emergencyDetails.estimatedPeople}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyDetails: { ...prev.emergencyDetails, estimatedPeople: e.target.value }
                      }))}
                      placeholder="e.g., 50-100 people, entire neighborhood, unknown"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${
                        errors.estimatedPeople ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    {errors.estimatedPeople && <p className="text-red-400 text-sm mt-1">{errors.estimatedPeople}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.emergencyDetails.immediateRisk}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyDetails: { ...prev.emergencyDetails, immediateRisk: e.target.checked }
                        }))}
                        className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                      />
                      <span className="text-white">Immediate risk to life and safety</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.emergencyDetails.evacuationNeeded}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyDetails: { ...prev.emergencyDetails, evacuationNeeded: e.target.checked }
                        }))}
                        className="w-5 h-5 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                      />
                      <span className="text-white">Evacuation may be necessary</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.emergencyDetails.infrastructureDamage}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyDetails: { ...prev.emergencyDetails, infrastructureDamage: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-white">Infrastructure damage reported</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Report Summary */}
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Report Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Report Type:</p>
                    <p className="text-white font-medium">{reportTypes.find(t => t.id === formData.reportType)?.label}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Severity:</p>
                    <p className="text-white font-medium capitalize">{formData.severity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Location:</p>
                    <p className="text-white font-medium">{formData.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Reporter:</p>
                    <p className="text-white font-medium">{formData.contactInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">SMS Radius:</p>
                    <p className="text-white font-medium">{formData.notifications.smsRadius} km</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Media Attachments:</p>
                    <p className="text-white font-medium">{formData.media.length} files</p>
                  </div>
                </div>

                {/* Preview SMS Message */}
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">SMS Message Preview:</p>
                  <p className="text-white text-sm">{generateSMSMessage()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation buttons */}
        <div className="bg-gray-700 px-6 py-4 rounded-b-xl border-t border-gray-600">
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-8 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Report & Send Alerts</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityReportForm;
