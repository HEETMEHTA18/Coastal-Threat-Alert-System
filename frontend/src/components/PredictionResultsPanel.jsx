import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Waves,
  MapPin,
  Calendar,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  Activity,
  Zap,
  Eye,
  FileText
} from 'lucide-react';

const PredictionResultsPanel = ({ predictions, onExport, onClose }) => {
  const [expandedPrediction, setExpandedPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  if (!predictions || predictions.length === 0) {
    return null;
  }

  const getThreatLevelColor = (level) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white'
    };
    return colors[level] || colors.low;
  };

  const getRiskLevelBadge = (level) => {
    const badges = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return badges[level] || badges.low;
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const PredictionOverview = ({ prediction }) => (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-red-600 text-sm font-medium">Flood Risk</div>
              <div className="text-lg font-bold text-red-800">
                {formatPercentage(prediction.predictions?.floodRisk?.probability || 0)}
              </div>
            </div>
            <Waves className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-600 text-sm font-medium">Storm Surge</div>
              <div className="text-lg font-bold text-orange-800">
                {formatPercentage(prediction.predictions?.stormSurgeRisk?.probability || 0)}
              </div>
            </div>
            <Activity className="h-6 w-6 text-orange-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-sm font-medium">Population at Risk</div>
              <div className="text-lg font-bold text-blue-800">
                {(prediction.estimatedPopulationAtRisk || 0).toLocaleString()}
              </div>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-600 text-sm font-medium">Confidence</div>
              <div className="text-lg font-bold text-purple-800">
                {formatPercentage(prediction.predictionConfidence || 0)}
              </div>
            </div>
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Risk Assessment Chart */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Risk Assessment Breakdown</h4>
        <div className="space-y-3">
          {prediction.riskScores && Object.entries(prediction.riskScores).map(([risk, score]) => (
            <div key={risk} className="flex items-center space-x-3">
              <div className="w-20 text-sm capitalize">{risk}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    score >= 0.8 ? 'bg-red-500' :
                    score >= 0.6 ? 'bg-orange-500' :
                    score >= 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm text-right">{formatPercentage(score)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ImpactAssessment = ({ prediction }) => (
    <div className="space-y-4">
      {prediction.impactAssessment && (
        <>
          {/* Infrastructure Impact */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Infrastructure Impact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Impact Level</div>
                <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  getRiskLevelBadge(prediction.impactAssessment.infrastructure?.level)
                }`}>
                  {prediction.impactAssessment.infrastructure?.level?.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Affected Area</div>
                <div className="font-medium">{prediction.impactAssessment.infrastructure?.affectedArea}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600">Transportation Impact</div>
                <div className="font-medium">{prediction.impactAssessment.infrastructure?.transportationImpact}</div>
              </div>
            </div>
          </div>

          {/* Economic Impact */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Economic Impact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Estimated Loss</div>
                <div className="text-lg font-bold text-red-600">
                  {prediction.impactAssessment.economic?.estimatedLoss}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Business Impact</div>
                <div className="font-medium">{prediction.impactAssessment.economic?.businessImpact}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tourism Impact</div>
                <div className="font-medium">{prediction.impactAssessment.economic?.tourismImpact}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Agriculture Impact</div>
                <div className="font-medium">{prediction.impactAssessment.economic?.agricultureImpact}</div>
              </div>
            </div>
          </div>

          {/* Social Impact */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Social Impact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Displacement Risk</div>
                <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  getRiskLevelBadge(prediction.impactAssessment.social?.displacementRisk)
                }`}>
                  {prediction.impactAssessment.social?.displacementRisk?.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Vulnerable Populations</div>
                <div className="font-medium">
                  {(prediction.impactAssessment.social?.vulnerablePopulations || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Health Risks</div>
                <div className="font-medium">{prediction.impactAssessment.social?.healthRisks}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const Recommendations = ({ prediction }) => (
    <div className="space-y-4">
      {/* Priority Recommendations */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Priority Recommendations</h4>
        <div className="space-y-2">
          {prediction.recommendations?.slice(0, 5).map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-2 bg-blue-50 rounded">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 text-sm">{rec}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Actions */}
      {prediction.emergencyActions && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <h4 className="font-semibold mb-3 text-red-800 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Actions
          </h4>
          <div className="space-y-2">
            {prediction.emergencyActions.map((action, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  !
                </div>
                <div className="flex-1 text-sm text-red-800">{action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Limitations */}
      {prediction.limitations && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3 text-gray-700 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Analysis Limitations
          </h4>
          <ul className="space-y-1">
            {prediction.limitations.map((limitation, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2">•</span>
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const TechnicalDetails = ({ prediction }) => (
    <div className="space-y-4">
      {/* Area Information */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Area Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Area Size</div>
            <div className="font-medium">{prediction.areaMetrics?.areaKm2?.toFixed(2)} km²</div>
          </div>
          <div>
            <div className="text-gray-600">Perimeter</div>
            <div className="font-medium">{prediction.areaMetrics?.perimeterKm?.toFixed(2)} km</div>
          </div>
          <div>
            <div className="text-gray-600">Center Coordinates</div>
            <div className="font-medium">
              {prediction.areaMetrics?.center?.map(c => c.toFixed(4)).join(', ')}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Coast Distance</div>
            <div className="font-medium">{prediction.nearestCoastDistance}</div>
          </div>
        </div>
      </div>

      {/* Climate Factors */}
      {prediction.climateFactors && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Climate Context</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Climate Zone</div>
              <div className="font-medium">{prediction.climateFactors.zone}</div>
            </div>
            <div>
              <div className="text-gray-600">Monsoon Season</div>
              <div className="font-medium">{prediction.climateFactors.monsoon}</div>
            </div>
            <div>
              <div className="text-gray-600">Cyclone Risk</div>
              <div className="font-medium">{prediction.climateFactors.cycloneRisk}</div>
            </div>
            <div>
              <div className="text-gray-600">Extreme Weather</div>
              <div className="font-medium">{prediction.climateFactors.extremeWeather}</div>
            </div>
          </div>
        </div>
      )}

      {/* Intersecting Zones */}
      {prediction.intersectingZones?.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Intersecting Threat Zones</h4>
          <div className="space-y-2">
            {prediction.intersectingZones.map((zone, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="font-medium">{zone.name}</div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    getThreatLevelColor(zone.threatLevel)
                  }`}>
                    {zone.threatLevel?.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {zone.overlapPercentage?.toFixed(0)}% overlap
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Quality */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Data Quality & Confidence</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Prediction Confidence</div>
            <div className="font-medium">{formatPercentage(prediction.predictionConfidence)}</div>
          </div>
          <div>
            <div className="text-gray-600">Data Quality</div>
            <div className="font-medium capitalize">{prediction.dataQuality}</div>
          </div>
          <div>
            <div className="text-gray-600">Analysis Time</div>
            <div className="font-medium">
              {new Date(prediction.analysisTimestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold">Coastal Threat Analysis Results</h2>
            <p className="text-gray-600">{predictions.length} area(s) analyzed</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExport(predictions)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {predictions.map((prediction, index) => (
            <div key={prediction.areaId} className="mb-6 last:mb-0">
              {/* Prediction Header */}
              <div className="border border-gray-200 rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => setExpandedPrediction(
                    expandedPrediction === prediction.areaId ? null : prediction.areaId
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-semibold">Area {index + 1}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getThreatLevelColor(prediction.threatLevel)
                    }`}>
                      {prediction.threatLevel?.toUpperCase()} THREAT
                    </div>
                    <div className="text-sm text-gray-600">
                      {prediction.areaMetrics?.areaKm2?.toFixed(1)} km² • 
                      {formatPercentage(prediction.predictionConfidence)} confidence
                    </div>
                  </div>
                  {expandedPrediction === prediction.areaId ? 
                    <ChevronUp size={20} /> : <ChevronDown size={20} />
                  }
                </div>

                {/* Expanded Content */}
                {expandedPrediction === prediction.areaId && (
                  <div className="border-t border-gray-200">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                      {[
                        { id: 'overview', label: 'Overview', icon: Eye },
                        { id: 'impact', label: 'Impact', icon: TrendingUp },
                        { id: 'recommendations', label: 'Actions', icon: FileText },
                        { id: 'technical', label: 'Technical', icon: Info }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 ${
                            activeTab === tab.id 
                              ? 'border-blue-500 text-blue-600 bg-blue-50' 
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <tab.icon size={16} />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                      {activeTab === 'overview' && <PredictionOverview prediction={prediction} />}
                      {activeTab === 'impact' && <ImpactAssessment prediction={prediction} />}
                      {activeTab === 'recommendations' && <Recommendations prediction={prediction} />}
                      {activeTab === 'technical' && <TechnicalDetails prediction={prediction} />}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictionResultsPanel;