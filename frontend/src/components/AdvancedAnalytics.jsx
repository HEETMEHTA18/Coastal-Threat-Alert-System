import React, { useState, useEffect } from 'react';
import { 
  SeaLevelChart, 
  StormSurgeChart, 
  ErosionRiskRadar, 
  PollutionChart, 
  CommunityRiskChart,
  AlgalBloomChart 
} from './AnalyticsCharts';
import { 
  generateSeaLevelData,
  generateThreatPredictions,
  generatePollutionData,
  generateCommunityRiskData,
  calculateConfidenceScore,
  exportReport
} from '../services/analyticsService';

// AI Insights Component
const AIInsights = ({ insights, confidence }) => (
  <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        AI-Powered Insights
      </h3>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-400">Confidence:</span>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          confidence >= 0.8 ? 'bg-green-900 text-green-300' :
          confidence >= 0.6 ? 'bg-yellow-900 text-yellow-300' :
          'bg-red-900 text-red-300'
        }`}>
          {(confidence * 100).toFixed(0)}%
        </div>
      </div>
    </div>
    
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div key={index} className={`p-3 rounded border-l-4 ${
          insight.type === 'critical' ? 'bg-red-900/30 border-red-500 text-red-200' :
          insight.type === 'warning' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-200' :
          insight.type === 'info' ? 'bg-blue-900/30 border-blue-500 text-blue-200' :
          'bg-green-900/30 border-green-500 text-green-200'
        }`}>
          <div className="font-medium text-sm">{insight.title}</div>
          <div className="text-sm opacity-90">{insight.description}</div>
          {insight.recommendation && (
            <div className="text-xs mt-2 opacity-75 font-medium">
              💡 {insight.recommendation}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Risk Summary Cards
const RiskSummaryCard = ({ title, value, status, trend, icon }) => (
  <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          status === 'high' ? 'bg-red-900 text-red-300' :
          status === 'medium' ? 'bg-yellow-900 text-yellow-300' :
          'bg-green-900 text-green-300'
        }`}>
          {icon}
        </div>
        <div>
          <h4 className="text-white font-medium text-sm">{title}</h4>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
      <div className={`text-xs px-2 py-1 rounded ${
        trend === 'up' ? 'bg-red-900 text-red-300' :
        trend === 'down' ? 'bg-green-900 text-green-300' :
        'bg-gray-900 text-gray-300'
      }`}>
        {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→'} {trend}
      </div>
    </div>
  </div>
);

// Export Controls
const ExportControls = ({ onExport, isExporting }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={() => onExport('pdf')}
      disabled={isExporting}
      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-xs rounded transition-colors"
    >
      {isExporting ? '⏳' : '📄'} Export PDF
    </button>
    <button
      onClick={() => onExport('csv')}
      disabled={isExporting}
      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-xs rounded transition-colors"
    >
      {isExporting ? '⏳' : '📊'} Export CSV
    </button>
  </div>
);

// Main Analytics Dashboard
const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    seaLevel: [],
    stormSurge: { dates: [], probability: [] },
    erosionRisk: [],
    pollution: [],
    communityRisk: [],
    algalBloom: { riskIndex: [], waterTemp: [], chlorophyll: [] }
  });

  const [insights, setInsights] = useState([]);
  const [confidence, setConfidence] = useState(0);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      try {
        const [seaLevelData, threatData, pollutionData, communityData] = await Promise.all([
          generateSeaLevelData(),
          generateThreatPredictions(),
          generatePollutionData(),
          generateCommunityRiskData()
        ]);

        const confidenceScore = calculateConfidenceScore();

        // Generate AI insights based on data
        const aiInsights = [
          {
            type: 'critical',
            title: 'Storm Surge Alert',
            description: 'High probability storm surge expected in 3-5 days. Coastal communities should prepare.',
            recommendation: 'Issue evacuation advisory for zones with >70% surge probability'
          },
          {
            type: 'warning',
            title: 'Algal Bloom Risk Increasing',
            description: 'Water temperature and nutrient levels indicate elevated algal bloom risk.',
            recommendation: 'Monitor shellfish beds and issue water quality advisories'
          },
          {
            type: 'info',
            title: 'Sea Level Trend Analysis',
            description: 'Sea levels are 15% above seasonal average, consistent with climate projections.',
            recommendation: 'Update long-term infrastructure planning models'
          },
          {
            type: 'positive',
            title: 'Pollution Levels Stable',
            description: 'Water quality indicators show improvement over the past 30 days.',
            recommendation: 'Continue current environmental protection measures'
          }
        ];

        setData({
          seaLevel: seaLevelData,
          stormSurge: threatData.stormSurge,
          erosionRisk: [
            { location: 'North Coast', risk: 0.75 },
            { location: 'East Bay', risk: 0.45 },
            { location: 'South Shore', risk: 0.85 },
            { location: 'West Harbor', risk: 0.35 },
            { location: 'Central Beach', risk: 0.65 }
          ],
          pollution: pollutionData,
          waterQuality: pollutionData,
          communityRisk: communityData,
          algalBloom: {
            riskIndex: [0.3, 0.4, 0.55, 0.7, 0.8, 0.75, 0.6],
            waterTemp: [18, 19, 21, 23, 25, 24, 22],
            chlorophyll: [2.1, 2.8, 3.5, 4.2, 5.1, 4.8, 3.9]
          }
        });

        setInsights(aiInsights);
        setConfidence(confidenceScore);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [timeRange]);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      await exportReport(data, insights, format);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'threats', name: 'Threat Analysis', icon: '⚠️' },
    { id: 'environment', name: 'Environmental', icon: '🌊' },
    { id: 'community', name: 'Community Risk', icon: '🏘️' }
  ];

  const riskSummaryData = [
    {
      title: 'Storm Surge Risk',
      value: '68%',
      status: 'high',
      trend: 'up',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
    },
    {
      title: 'Algal Bloom Index',
      value: '4.2',
      status: 'medium',
      trend: 'up',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
    },
    {
      title: 'Water Quality',
      value: 'Good',
      status: 'low',
      trend: 'stable',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" /></svg>
    },
    {
      title: 'Community Risk',
      value: '2.8M',
      status: 'medium',
      trend: 'down',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-slate-400">Loading advanced analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Advanced Coastal Analytics</h2>
          <p className="text-slate-400 text-sm">AI-powered insights for coastal threat assessment and disaster preparedness</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <ExportControls onExport={handleExport} isExporting={isExporting} />
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskSummaryData.map((item, index) => (
          <RiskSummaryCard key={index} {...item} />
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-600">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                <h4 className="text-white font-medium mb-3">Sea Level Trends</h4>
                <SeaLevelChart data={data.seaLevel} />
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                <h4 className="text-white font-medium mb-3">Algal Bloom Analysis</h4>
                <AlgalBloomChart data={data.algalBloom} />
              </div>
            </div>
            <AIInsights insights={insights} confidence={confidence} />
          </>
        )}

        {activeTab === 'threats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <h4 className="text-white font-medium mb-3">Storm Surge Forecast</h4>
              <StormSurgeChart data={data.stormSurge} />
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <h4 className="text-white font-medium mb-3">Erosion Risk Assessment</h4>
              <ErosionRiskRadar data={data.erosionRisk} />
            </div>
          </div>
        )}

        {activeTab === 'environment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <h4 className="text-white font-medium mb-3">Pollution Distribution</h4>
              <PollutionChart data={data.pollution} />
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <h4 className="text-white font-medium mb-3">Water Quality Trends</h4>
              <PollutionChart data={data.waterQuality} />
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <h4 className="text-white font-medium mb-3">Community Risk Assessment</h4>
              <CommunityRiskChart data={data.communityRisk} />
            </div>
            <AIInsights 
              insights={insights.filter(i => i.title.includes('Community') || i.title.includes('Storm Surge'))} 
              confidence={confidence} 
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-400">
            Last updated: {new Date().toLocaleString()} • Data sources: NOAA, NASA, OpenWeatherMap
          </div>
          <div className="text-slate-400">
            AI Model Confidence: <span className="text-blue-400 font-medium">{(confidence * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
