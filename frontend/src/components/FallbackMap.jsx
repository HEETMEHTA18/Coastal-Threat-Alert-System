import React, { useState } from 'react';
import { 
  Map,
  Activity,
  AlertTriangle,
  Info,
  Waves,
  Users,
  MapPin
} from 'lucide-react';

const FallbackMap = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);

  const coastalRegions = [
    {
      id: 1,
      name: "Mumbai Coastal Zone",
      threatLevel: "high",
      floodRisk: 0.8,
      stormSurgeRisk: 0.9,
      populationAtRisk: 125000,
      coordinates: [72.8777, 19.0760],
      description: "Critical urban coastal zone with high flood and storm surge risks"
    },
    {
      id: 2,
      name: "Chennai Coastal Corridor",
      threatLevel: "critical",
      floodRisk: 0.85,
      stormSurgeRisk: 0.95,
      populationAtRisk: 200000,
      coordinates: [80.2707, 13.0827],
      description: "Extreme cyclone risk area with critical infrastructure vulnerability"
    },
    {
      id: 3,
      name: "Goa Beaches",
      threatLevel: "medium",
      floodRisk: 0.5,
      stormSurgeRisk: 0.6,
      populationAtRisk: 45000,
      coordinates: [73.8567, 15.2993],
      description: "Tourism-dependent coastal area with moderate erosion risks"
    },
    {
      id: 4,
      name: "Kerala Backwaters",
      threatLevel: "medium",
      floodRisk: 0.6,
      stormSurgeRisk: 0.4,
      populationAtRisk: 85000,
      coordinates: [76.2711, 9.9312],
      description: "Saltwater intrusion affecting agriculture and ecosystems"
    },
    {
      id: 5,
      name: "Odisha Cyclone Zone",
      threatLevel: "critical",
      floodRisk: 0.95,
      stormSurgeRisk: 0.98,
      populationAtRisk: 350000,
      coordinates: [85.8245, 20.9517],
      description: "Extreme cyclone frequency with massive displacement risk"
    }
  ];

  const getThreatColor = (level) => {
    const colors = {
      critical: 'bg-red-500 border-red-600',
      high: 'bg-orange-500 border-orange-600',
      medium: 'bg-yellow-500 border-yellow-600',
      low: 'bg-green-500 border-green-600'
    };
    return colors[level] || colors.low;
  };

  const getThreatTextColor = (level) => {
    const colors = {
      critical: 'text-red-800 bg-red-100',
      high: 'text-orange-800 bg-orange-100',
      medium: 'text-yellow-800 bg-yellow-100',
      low: 'text-green-800 bg-green-100'
    };
    return colors[level] || colors.low;
  };

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <h2 className="text-lg font-bold flex items-center mb-2">
            <Map className="mr-2 h-5 w-5 text-blue-600" />
            Interactive Coastal Threat Analysis
          </h2>
          <p className="text-sm text-gray-600">
            Click on regions below to analyze coastal threats. This is a simplified view - full map functionality available when dependencies are loaded.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-32 pb-8 px-4 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Regions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {coastalRegions.map((region) => (
              <div
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 border-l-4 ${getThreatColor(region.threatLevel)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{region.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatTextColor(region.threatLevel)}`}>
                    {region.threatLevel.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{region.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Waves className="mr-1 h-4 w-4" />
                      Flood Risk
                    </span>
                    <span className="font-medium">{(region.floodRisk * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Activity className="mr-1 h-4 w-4" />
                      Storm Surge
                    </span>
                    <span className="font-medium">{(region.stormSurgeRisk * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      At Risk
                    </span>
                    <span className="font-medium">{region.populationAtRisk.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      Location
                    </span>
                    <span className="font-medium text-xs">
                      {region.coordinates[1].toFixed(2)}, {region.coordinates[0].toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Region Details */}
          {selectedRegion && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Detailed Analysis: {selectedRegion.name}</h3>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Metrics */}
                <div>
                  <h4 className="font-semibold mb-3">Risk Assessment</h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Flood Risk</span>
                        <span className="text-sm">{(selectedRegion.floodRisk * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedRegion.floodRisk * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Storm Surge Risk</span>
                        <span className="text-sm">{(selectedRegion.stormSurgeRisk * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${selectedRegion.stormSurgeRisk * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {selectedRegion.threatLevel === 'critical' && (
                      <>
                        <div className="bg-red-50 border border-red-200 p-3 rounded">
                          <span className="text-red-800 text-sm">• Immediate evacuation planning required</span>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-3 rounded">
                          <span className="text-red-800 text-sm">• Deploy emergency response teams</span>
                        </div>
                      </>
                    )}
                    
                    {selectedRegion.threatLevel === 'high' && (
                      <>
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                          <span className="text-orange-800 text-sm">• Strengthen coastal defenses</span>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                          <span className="text-orange-800 text-sm">• Implement early warning systems</span>
                        </div>
                      </>
                    )}
                    
                    {selectedRegion.threatLevel === 'medium' && (
                      <>
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                          <span className="text-yellow-800 text-sm">• Monitor conditions regularly</span>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                          <span className="text-yellow-800 text-sm">• Develop adaptation strategies</span>
                        </div>
                      </>
                    )}
                    
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                      <span className="text-blue-800 text-sm">• Community awareness programs</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                      <span className="text-blue-800 text-sm">• Infrastructure resilience upgrades</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-md">
        <div className="flex items-center text-sm text-gray-600">
          <Info className="mr-2 h-4 w-4" />
          <span>Click regions above for detailed coastal threat analysis</span>
        </div>
      </div>
    </div>
  );
};

export default FallbackMap;