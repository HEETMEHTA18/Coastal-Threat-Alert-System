import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, MapPin, TrendingUp, Info, ArrowLeft, 
  ArrowRight, CheckCircle2, ChevronRight, Activity, 
  HelpCircle, FileText, ClipboardList, RefreshCw, AlertTriangle
} from 'lucide-react';
import { submitQuestionnaire, getQuestionnaireHistory } from '../services/questionnaireService';
import toast from 'react-hot-toast';

const AIQuestionnaire = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);
  
  // Questionnaire state
  const [answers, setAnswers] = useState({
    proximity: 250, // meters
    elevation: 3,   // meters
    slope: 'flat',
    mangroves: false,
    reefs: false,
    dunes: false,
    shelterAccess: false,
    defenses: 'none',
    preparedness: false,
    floodHistory: 'never',
    erosionHistory: 'none'
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await getQuestionnaireHistory();
      if (res.status === 'success') {
        setHistory(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxToggle = (field) => {
    setAnswers(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await submitQuestionnaire(answers);
      if (res.status === 'success') {
        setResult(res.data);
        toast.success('Assessment completed successfully!');
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit assessment.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-500 border-red-500 bg-red-500/10 shadow-red-500/25';
      case 'High': return 'text-orange-500 border-orange-500 bg-orange-500/10 shadow-orange-500/25';
      case 'Moderate': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10 shadow-yellow-500/25';
      default: return 'text-green-500 border-green-500 bg-green-500/10 shadow-green-500/25';
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'infrastructure': return '🧱';
      case 'natural_barriers': return '🌱';
      default: return '👥';
    }
  };

  const resetForm = () => {
    setResult(null);
    setStep(1);
    setAnswers({
      proximity: 250,
      elevation: 3,
      slope: 'flat',
      mangroves: false,
      reefs: false,
      dunes: false,
      shelterAccess: false,
      defenses: 'none',
      preparedness: false,
      floodHistory: 'never',
      erosionHistory: 'none'
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-6">
      {/* Top Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 animate-pulse" />
          AI Safety & Risk Assessment
        </h2>
        <p className="text-slate-400 text-sm sm:text-lg mt-2 max-w-2xl mx-auto">
          Evaluate your local coastal vulnerability. Get instant risk scores, automated environmental profiles, and AI-tailored defense recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Panel (Survey or Results) */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="backdrop-blur-md bg-slate-900/60 rounded-3xl border border-slate-700/50 p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
              {/* Animated Accent Blobs */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Progress Tracker */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Step {step} of 4</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        step === i ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Survey Steps Content */}
              <div className="min-h-[350px]">
                {step === 1 && (
                  <div className="space-y-6 animate-scale-in">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-cyan-400" />
                      1. Site Geography & Elevation
                    </h3>
                    <p className="text-slate-400 text-sm">Specify the proximity to the coast and topography of your area.</p>
                    
                    {/* Proximity Slider */}
                    <div>
                      <div className="flex justify-between items-center text-sm font-semibold mb-2">
                        <label className="text-slate-300">Distance to Shoreline</label>
                        <span className="text-cyan-400">{answers.proximity} meters</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="2000" 
                        step="10"
                        value={answers.proximity}
                        onChange={(e) => handleInputChange('proximity', e.target.value)}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Very Near (10m)</span>
                        <span>Safe Buffer (2km)</span>
                      </div>
                    </div>

                    {/* Elevation Slider */}
                    <div>
                      <div className="flex justify-between items-center text-sm font-semibold mb-2">
                        <label className="text-slate-300">Elevation above Sea Level</label>
                        <span className="text-cyan-400">{answers.elevation} meters</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        value={answers.elevation}
                        onChange={(e) => handleInputChange('elevation', e.target.value)}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Sea level (0m)</span>
                        <span>Highlands (50m)</span>
                      </div>
                    </div>

                    {/* Slope Select */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Topography/Slope</label>
                      <select 
                        value={answers.slope} 
                        onChange={(e) => handleInputChange('slope', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="flat">Flat Plain (Highest surge risk)</option>
                        <option value="moderate">Gentle/Moderate Slope</option>
                        <option value="steep">Steep Cliffs (Risk of landslide, lower surge risk)</option>
                      </select>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-scale-in">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <Activity className="w-6 h-6 text-cyan-400" />
                      2. Natural Protections & Defenses
                    </h3>
                    <p className="text-slate-400 text-sm">Identify natural ecological barriers active in your coastal region.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mangroves */}
                      <button 
                        type="button"
                        onClick={() => handleCheckboxToggle('mangroves')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          answers.mangroves 
                            ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                            : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${answers.mangroves ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'}`}>
                          {answers.mangroves && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Mangrove Forests</p>
                          <p className="text-xs text-slate-400">Absorbs storm surge & prevents erosion</p>
                        </div>
                      </button>

                      {/* Reefs */}
                      <button 
                        type="button"
                        onClick={() => handleCheckboxToggle('reefs')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          answers.reefs 
                            ? 'bg-blue-500/20 border-blue-500 text-white' 
                            : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${answers.reefs ? 'border-blue-500 bg-blue-500' : 'border-slate-500'}`}>
                          {answers.reefs && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Coral Reefs / Sandbars</p>
                          <p className="text-xs text-slate-400">Reduces wave energy incoming offshore</p>
                        </div>
                      </button>

                      {/* Dunes */}
                      <button 
                        type="button"
                        onClick={() => handleCheckboxToggle('dunes')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          answers.dunes 
                            ? 'bg-yellow-500/20 border-yellow-500 text-white' 
                            : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${answers.dunes ? 'border-yellow-500 bg-yellow-500' : 'border-slate-500'}`}>
                          {answers.dunes && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Natural Sand Dunes</p>
                          <p className="text-xs text-slate-400">Blocks tidal crests and wind force</p>
                        </div>
                      </button>

                      {/* Local shelter access */}
                      <button 
                        type="button"
                        onClick={() => handleCheckboxToggle('shelterAccess')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          answers.shelterAccess 
                            ? 'bg-purple-500/20 border-purple-500 text-white' 
                            : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${answers.shelterAccess ? 'border-purple-500 bg-purple-500' : 'border-slate-500'}`}>
                          {answers.shelterAccess && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Emergency Shelter Access</p>
                          <p className="text-xs text-slate-400">Designated shelter within 1km radius</p>
                        </div>
                      </button>
                    </div>

                    {/* Man-made Defenses */}
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Man-made Shoreline Barriers</label>
                      <select 
                        value={answers.defenses} 
                        onChange={(e) => handleInputChange('defenses', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="none">No barriers (Purely exposed)</option>
                        <option value="seawall">Seawall / Dyke structure</option>
                        <option value="breakwater">Offshore Breakwaters / Groynes</option>
                        <option value="natural">Soft defenses (Vegetated dunes / rip-rap)</option>
                      </select>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-scale-in">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-cyan-400" />
                      3. Hazard & Event History
                    </h3>
                    <p className="text-slate-400 text-sm">Record past occurrences of floods or beach displacement.</p>

                    {/* Flooding History */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Frequency of Flooding</label>
                      <select 
                        value={answers.floodHistory} 
                        onChange={(e) => handleInputChange('floodHistory', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="never">Never (Historically dry)</option>
                        <option value="rare">Rarely (Only during extreme cyclonic storms)</option>
                        <option value="seasonal">Seasonally (Floods during monsoons/spring tides)</option>
                        <option value="frequent">Frequently (Floods multiple times a year)</option>
                      </select>
                    </div>

                    {/* Erosion Speed */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Shoreline Displacement / Erosion</label>
                      <select 
                        value={answers.erosionHistory} 
                        onChange={(e) => handleInputChange('erosionHistory', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      >
                        <option value="none">Stable coastline (No erosion)</option>
                        <option value="slow">Slow erosion (Gradual loss over years)</option>
                        <option value="rapid">Rapid erosion (Noticeable beach loss/collapsing shores)</option>
                      </select>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 animate-scale-in">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                      4. Household Preparedness
                    </h3>
                    <p className="text-slate-400 text-sm">Confirm readiness plans and check emergency compliance.</p>

                    {/* Emergency Plan Toggle */}
                    <button 
                      type="button"
                      onClick={() => handleCheckboxToggle('preparedness')}
                      className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all text-left ${
                        answers.preparedness 
                          ? 'bg-cyan-500/20 border-cyan-500 text-white' 
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${answers.preparedness ? 'bg-cyan-400 text-slate-900' : 'bg-slate-800 border border-slate-600'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">Emergency Plan & Disaster Kits</p>
                          <p className="text-xs text-slate-400">Survival kits, first-aid, power banks, and exits ready</p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${answers.preparedness ? 'bg-cyan-400' : 'bg-slate-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${answers.preparedness ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex gap-3">
                      <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Completing this survey submits your local stats to our backend, where a calculated vulnerability index and custom AI-modeled mitigating recommendations are built. You can save, download, or retry your analysis at any time.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep(prev => prev - 1)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                    step === 1 
                      ? 'text-slate-600 cursor-not-allowed' 
                      : 'text-white bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev + 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold bg-slate-900 hover:bg-slate-800 text-white hover:scale-105 transition-all shadow-md"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white hover:scale-105 transition-all disabled:opacity-50 shadow-md"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Submit & Analyze
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Analysis Results Screen */
            <div className="backdrop-blur-md bg-slate-900/60 rounded-3xl border border-slate-700/50 p-6 sm:p-8 shadow-2xl space-y-8 animate-scale-in relative">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">Vulnerability Index Analysis</h3>
                  <p className="text-slate-400 text-xs mt-1">Submitted on {new Date(result.createdAt).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Survey
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Dial Gauge */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* SVG Radial Progress */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="68" 
                        className="stroke-slate-800" 
                        strokeWidth="10" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="68" 
                        className={`transition-all duration-1000 ${
                          result.riskLevel === 'Critical' ? 'stroke-red-500' :
                          result.riskLevel === 'High' ? 'stroke-orange-500' :
                          result.riskLevel === 'Moderate' ? 'stroke-yellow-500' : 'stroke-green-500'
                        }`} 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray={427}
                        strokeDashoffset={427 - (427 * result.score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black text-white">{result.score}</span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Risk Index</span>
                    </div>
                  </div>
                </div>

                {/* Risk Metadata */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Assessed Threat Level</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-4 py-1.5 rounded-full border font-black text-sm uppercase tracking-wide shadow-lg ${getRiskColor(result.riskLevel)}`}>
                        {result.riskLevel}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Expert Assessment</span>
                    <p className="text-slate-200 text-sm leading-relaxed mt-1">{result.assessment}</p>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations List */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-400" />
                  Mitigation Action Plan
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {result.recommendations?.map((rec, i) => (
                    <div 
                      key={i} 
                      className="bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 rounded-2xl p-5 flex gap-4 transition-all"
                    >
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-xl shrink-0">
                        {getCategoryEmoji(rec.category)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Category: {rec.category?.replace('_', ' ')}</span>
                        <h5 className="font-bold text-white text-base">{rec.title}</h5>
                        <p className="text-slate-300 text-sm leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="backdrop-blur-md bg-slate-900/60 rounded-3xl border border-slate-700/50 p-6 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Past Assessments
            </h3>

            {historyLoading ? (
              <div className="flex flex-col items-center py-8">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                <span className="text-slate-400 text-xs">Retrieving history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No past assessments found.</p>
                <p>Complete the survey to save reports.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => {
                      setResult(item);
                      setActiveHistoryItem(item._id);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      result && result._id === item._id 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase ${getRiskColor(item.riskLevel)}`}>
                          {item.riskLevel}
                        </span>
                        <span className="text-white font-bold text-sm">Score: {item.score}</span>
                      </div>
                      <span className="text-slate-400 text-[10px] mt-1 block">
                        {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            )}

            {/* SaaS Readiness Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">Premium SaaS Feature</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Enterprise tenants can configure automated PDF export, scheduled alerts, and map overlays. Read <span className="text-cyan-400 underline">saas_readiness.md</span> to activate.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuestionnaire;
