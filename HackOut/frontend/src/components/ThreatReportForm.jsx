import React, { useState } from 'react';
import { AlertTriangle, MapPin, User, Phone, Mail, Building, MessageSquare, Thermometer, Wind, Eye } from 'lucide-react';

const initialState = {
  title: '',
  description: '',
  status: 'ACTIVE',
  severity: 'Medium',
  type: 'Coastal Emergency',
  location: '',
  reporter: '',
  phone: '',
  email: '',
  organization: '',
  alertRadius: 5,
  media: [],
  weather: {
    windSpeed: '',
    temperature: '',
    visibility: ''
  }
};

const types = [
  'Severe Weather',
  'Coastal Emergency', 
  'Infrastructure Damage',
  'Marine Incident',
  'Environmental Hazard'
];
const severities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['ACTIVE', 'INVESTIGATING', 'RESOLVED'];

export default function ThreatReportForm({ onSubmit, onClose }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    const { name, value, type } = e.target;
    setForm(f => ({ 
      ...f, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleWeatherChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, weather: { ...f.weather, [name]: value } }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/threatReports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        setTimeout(() => {
          setForm(initialState);
          setSuccess(false);
          if (onSubmit) onSubmit(data);
        }, 2000);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Error submitting report. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-green-500/20 border border-green-500 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-green-400 mb-2">Report Submitted Successfully!</h2>
        <p className="text-green-200">Your threat report has been received and will be reviewed by our team.</p>
      </div>
    );
  }

  return (
    <form className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-orange-400" />
          New Threat Report
        </h2>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Report Title *</label>
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              required 
              placeholder="Brief description of the threat"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
            />
          </div>
          
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Location *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="location" 
                value={form.location} 
                onChange={handleChange} 
                required 
                placeholder="Specific location or landmark"
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Threat Type *</label>
            <select 
              name="type" 
              value={form.type} 
              onChange={handleChange} 
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {types.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Severity Level *</label>
            <select 
              name="severity" 
              value={form.severity} 
              onChange={handleChange} 
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {severities.map(s => (
                <option key={s} value={s} className="bg-slate-800">{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-blue-200 text-sm font-medium mb-2">Detailed Description *</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              required 
              placeholder="Provide detailed information about the threat, current conditions, and any immediate concerns..."
              rows={4}
              className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none" 
            />
          </div>
        </div>
      </div>

      {/* Reporter Information */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Reporter Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="reporter" 
                value={form.reporter} 
                onChange={handleChange} 
                required 
                placeholder="Your full name"
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
                placeholder="+1234567890"
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="email" 
                type="email"
                value={form.email} 
                onChange={handleChange} 
                placeholder="your.email@example.com"
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Organization</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="organization" 
                value={form.organization} 
                onChange={handleChange} 
                placeholder="Coast Guard, Local Authority, etc."
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weather Conditions */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Current Weather Conditions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Wind Speed (km/h)</label>
            <div className="relative">
              <Wind className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="windSpeed" 
                type="number"
                value={form.weather.windSpeed} 
                onChange={handleWeatherChange} 
                placeholder="25"
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Temperature (°C)</label>
            <div className="relative">
              <Thermometer className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="temperature" 
                type="number"
                value={form.weather.temperature} 
                onChange={handleWeatherChange} 
                placeholder="28"
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">Visibility (km)</label>
            <div className="relative">
              <Eye className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
              <input 
                name="visibility" 
                type="number"
                value={form.weather.visibility} 
                onChange={handleWeatherChange} 
                placeholder="10"
                className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Alert Settings</h3>
        
        <div>
          <label className="block text-blue-200 text-sm font-medium mb-2">SMS Alert Radius (km)</label>
          <input 
            name="alertRadius" 
            type="number" 
            value={form.alertRadius} 
            onChange={handleChange} 
            min={1} 
            max={100} 
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
          />
          <p className="text-blue-300 text-xs mt-1">People within this radius will receive SMS alerts</p>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Submitting Report...
          </div>
        ) : (
          'Submit Threat Report'
        )}
      </button>
    </form>
  );
}
