import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ThreatReportForm from './ThreatReportForm';
import ThreatReportsList from './ThreatReportsList';

export default function ThreatMonitoringPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshList, setRefreshList] = useState(0);

  const handleReportSubmitted = () => {
    setShowForm(false);
    setRefreshList(prev => prev + 1); // Trigger refresh of reports list
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Report Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Threat Monitoring</h1>
          <p className="text-blue-200">Monitor and report coastal threats in real-time</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>New Report</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ThreatReportForm 
              onSubmit={handleReportSubmitted}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Reports List */}
      <ThreatReportsList key={refreshList} />
    </div>
  );
}
