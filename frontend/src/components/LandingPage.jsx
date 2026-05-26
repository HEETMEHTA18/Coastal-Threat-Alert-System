import React, { useState, useCallback, useEffect } from 'react';
import LogoFallback from './LogoFallback';
import { 
  ChevronRight, Play, BarChart3, Shield, Users, Globe, 
  AlertTriangle, Waves, Zap, Award, TrendingUp, MapPin, 
  LogIn, UserPlus, Sparkles, Compass
} from 'lucide-react';
import { useAuth } from '../store/hooks';
import { useNavigate } from 'react-router-dom';

import HeroScene from './Visuals/HeroScene';

const LandingPage = ({ onGetStarted, onLogin, onRegister }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [navLoading, setNavLoading] = useState(true);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Shield,
      title: "Real-time Threat Detection",
      description: "AI-powered analysis of environmental data to detect coastal threats before they become critical.",
      color: "from-red-500/10 to-pink-500/10 text-red-700 border-red-200",
      metric: "24/7",
      metricLabel: "Continuous Monitoring"
    },
    {
      icon: Sparkles,
      title: "AI Safety Assessments",
      description: "Evaluate shoreline vulnerability instantly using our interactive Gemini-powered risk index questionnaire.",
      color: "from-cyan-500/10 to-blue-500/10 text-cyan-700 border-cyan-200",
      metric: "Instant",
      metricLabel: "Custom AI Reports"
    },
    {
      icon: Globe,
      title: "Blue Carbon Protection",
      description: "Monitor and protect vital mangrove ecosystems and coastal wetlands using satellite imagery.",
      color: "from-emerald-500/10 to-green-500/10 text-emerald-700 border-emerald-200",
      metric: "50+",
      metricLabel: "Data Sources"
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "Machine learning models that identify patterns, predict wave levels, and forecast rainfall.",
      color: "from-purple-500/10 to-violet-500/10 text-purple-700 border-purple-200",
      metric: "98.7%",
      metricLabel: "Prediction Accuracy"
    }
  ];

  const impactStats = [
    { icon: AlertTriangle, value: "247", label: "Threats Detected", color: "text-red-600" },
    { icon: Compass, value: "15+", label: "Coastal Cities", color: "text-emerald-600" },
    { icon: Award, value: "98.7%", label: "Accuracy Rate", color: "text-amber-600" },
    { icon: TrendingUp, value: "1.2M+", label: "Lives Protected", color: "text-cyan-600" }
  ];

  const testimonials = [
    {
      text: "CTAS helped us prepare for Cyclone Tauktae with 72-hour advance warning. Our community was ready.",
      author: "Dr. Priya Sharma",
      role: "Marine Biologist, Mumbai",
      location: "Mumbai Coast"
    },
    {
      text: "The mangrove monitoring features saved our blue carbon project. Real-time alerts make all the difference.",
      author: "Rajesh Kumar",
      role: "Environmental Officer",
      location: "Sundarbans"
    },
    {
      text: "As a fisherman, knowing when it's safe to go out to sea has changed everything for my family's safety.",
      author: "Mohammed Ali",
      role: "Local Fisherman",
      location: "Kerala Coast"
    }
  ];

  // Rotate stats every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % impactStats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Trigger mount animations
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Navbar skeleton loading effect
  useEffect(() => {
    const t = setTimeout(() => setNavLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const handleCardHover = useCallback((index) => {
    setHoveredCard(index);
  }, []);

  const handleCardLeave = useCallback(() => {
    setHoveredCard(null);
  }, []);

  // Auth-aware navigation helpers for dashboard tabs
  const goTo = (pathIfAuthed) => {
    if (isAuthenticated) {
      navigate(pathIfAuthed);
    } else {
      navigate('/login', { state: { from: pathIfAuthed } });
    }
  };

  const goToDashboardTab = (tab) => {
    const path = `/dashboard${tab === 'overview' ? '' : `/${tab}`}`;
    goTo(path);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 relative overflow-hidden font-sans">
      {/* Background Gradients & Dynamic Water-Tree Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft breathing nature blobs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-teal-200/20 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute top-[30%] -right-20 w-[550px] h-[550px] bg-cyan-200/25 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-20 left-[10%] w-[600px] h-[600px] bg-emerald-200/15 rounded-full blur-[140px] animate-pulse"></div>
        
        {/* Animated Parallax Water Waves - Top/Middle System */}
        <div className="absolute inset-x-0 top-[15%] w-full overflow-hidden pointer-events-none z-0" style={{ height: '300px' }}>
          <svg className="w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
              <path id="gentle-wave-1" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z" />
            </defs>
            <g className="parallax-waves">
              <use href="#gentle-wave-1" x="48" y="0" fill="rgba(6, 182, 212, 0.12)" className="animate-wave-flow-1" />
              <use href="#gentle-wave-1" x="48" y="3" fill="rgba(13, 148, 136, 0.08)" className="animate-wave-flow-2" />
              <use href="#gentle-wave-1" x="48" y="5" fill="rgba(16, 185, 129, 0.06)" className="animate-wave-flow-3" />
              <use href="#gentle-wave-1" x="48" y="7" fill="rgba(14, 165, 233, 0.10)" className="animate-wave-flow-4" />
            </g>
          </svg>
        </div>

        {/* Animated Parallax Water Waves - Bottom System */}
        <div className="absolute inset-x-0 bottom-0 w-full overflow-hidden pointer-events-none z-0" style={{ height: '350px' }}>
          <svg className="w-full h-full opacity-65" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
              <path id="gentle-wave-2" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z" />
            </defs>
            <g className="parallax-waves">
              <use href="#gentle-wave-2" x="48" y="0" fill="rgba(6, 182, 212, 0.18)" className="animate-wave-flow-1" />
              <use href="#gentle-wave-2" x="48" y="3" fill="rgba(13, 148, 136, 0.12)" className="animate-wave-flow-2" />
              <use href="#gentle-wave-2" x="48" y="5" fill="rgba(16, 185, 129, 0.10)" className="animate-wave-flow-3" />
              <use href="#gentle-wave-2" x="48" y="7" fill="rgba(14, 165, 233, 0.22)" className="animate-wave-flow-4" />
            </g>
          </svg>
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.12),rgba(255,255,255,0))]"></div>
      </div>

      {/* Navigation - Glassmorphic Pill */}
      <nav className="relative z-10 p-4 sm:p-6" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/75 backdrop-blur-md border border-slate-200/80 rounded-[24px] px-6 py-4 shadow-xl shadow-slate-100/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <LogoFallback variant="icon" size="lg" />
                  <span className="text-slate-900 font-black tracking-wider text-xl hidden sm:inline bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">CTAS</span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-8">
                {navLoading ? (
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-4 w-16 bg-slate-200/65 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <>
                    <button onClick={() => goToDashboardTab('currents')} className="text-slate-800 hover:text-cyan-700 font-extrabold text-sm transition-all hover:scale-105 hover:drop-shadow-sm">Currents</button>
                    <button onClick={() => goToDashboardTab('weather')} className="text-slate-800 hover:text-cyan-700 font-extrabold text-sm transition-all hover:scale-105 hover:drop-shadow-sm">Weather</button>
                    <button onClick={() => goToDashboardTab('satellite')} className="text-slate-800 hover:text-cyan-700 font-extrabold text-sm transition-all hover:scale-105 hover:drop-shadow-sm">Satellite</button>
                    <button onClick={() => goToDashboardTab('reports')} className="text-slate-800 hover:text-cyan-700 font-extrabold text-sm transition-all hover:scale-105 hover:drop-shadow-sm">Reports</button>
                    <button onClick={() => goToDashboardTab('analytics')} className="text-slate-800 hover:text-cyan-700 font-extrabold text-sm transition-all hover:scale-105 hover:drop-shadow-sm">Analytics</button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {navLoading ? (
                  <div className="h-9 w-24 bg-slate-200/65 rounded-xl animate-pulse"></div>
                ) : (
                  <>
                    <button
                      onClick={() => (onLogin ? onLogin() : window.location.assign('/login'))}
                      className="text-slate-850 hover:text-slate-950 px-4 py-2 text-sm font-extrabold transition-all"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => (onRegister ? onRegister() : window.location.assign('/register'))}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-md text-sm font-black hover:scale-105 hover:bg-slate-800 transition-all"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16 sm:mb-24">
          <div className="lg:col-span-7 text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-300 bg-teal-50/80 text-teal-850 text-xs font-bold mb-6 animate-pulse">
              <Shield className="w-3.5 h-3.5" />
              <span>AI-Driven Early Warning System</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-none">
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Coastal Guardian
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-8 font-light leading-relaxed">
              Protecting vulnerable shorelines, ecosystems, and local communities using advanced satellite monitoring and interactive risk diagnostics.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 items-center">
              <button 
                onClick={onRegister || onGetStarted}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 focus:ring-2 focus:ring-slate-900"
                aria-label="Create new account and get started"
              >
                <UserPlus className="w-5 h-5" />
                <span>Get Started Free</span>
              </button>
              
              <button 
                onClick={onLogin || onGetStarted}
                className="bg-white border-2 border-slate-950 text-slate-950 px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-50 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 focus:ring-2 focus:ring-slate-950"
                aria-label="Sign in to existing account"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 w-full h-[400px] lg:h-[450px]">
            <HeroScene />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-24 px-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group relative bg-white/75 backdrop-blur-md border border-slate-200/80 rounded-[28px] p-8 hover:border-cyan-300 shadow-md shadow-slate-100/50 hover:shadow-xl hover:shadow-cyan-100/40 transition-all duration-500 transform ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                } hover:scale-105 hover:-translate-y-2 cursor-pointer`}
                style={{ transitionDelay: `${index * 80}ms` }}
                onMouseEnter={() => handleCardHover(index)}
                onMouseLeave={handleCardLeave}
                tabIndex={0}
                role="article"
                aria-labelledby={`feature-title-${index}`}
              >
                {/* Icon Container */}
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-200/60`}>
                  <Icon className="w-7 h-7" aria-hidden="true" />
                </div>
                
                <h3 
                  id={`feature-title-${index}`}
                  className="text-xl font-bold text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors"
                >
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed text-sm group-hover:text-slate-800 transition-colors mb-8">
                  {feature.description}
                </p>

                {/* Metric Display */}
                <div className="border-t border-slate-200 pt-4 text-left">
                  <div className="text-2xl font-black text-slate-850 group-hover:text-cyan-600 transition-colors">
                    {feature.metric}
                  </div>
                  <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider mt-0.5">
                    {feature.metricLabel}
                  </div>
                </div>

                {hoveredCard === index && (
                  <div className="absolute inset-0 bg-cyan-50/50 rounded-[28px] border border-cyan-400/30 -z-10 animate-pulse-glow pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Impact Statistics Section */}
        <div className="bg-white/75 backdrop-blur-md border border-slate-200 rounded-[36px] p-8 sm:p-12 mx-4 mb-24 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 w-24 h-24 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 text-center mb-12 tracking-tight">Our Environmental Footprint</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {impactStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="group cursor-pointer transition-all duration-300 hover:scale-105" role="button" tabIndex={0}>
                  <div className="flex justify-center mb-3">
                    <Icon className={`w-8 h-8 ${stat.color} group-hover:scale-110 transition-transform`} />
                  </div>
                  <div className={`text-3xl sm:text-5xl font-black mb-2 group-hover:scale-110 transition-all ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-slate-600 font-semibold text-sm sm:text-base">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Status Banner */}
        <div className="bg-white/75 backdrop-blur-md border border-slate-200 rounded-2xl p-5 mx-4 mb-24 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-slate-800 font-bold text-sm">System Status: Active</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
            <div className="text-slate-600 text-sm">
              <span className="font-bold text-slate-900">{impactStats[currentStatIndex].value}</span> {impactStats[currentStatIndex].label}
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>
            <div className="hidden md:flex items-center space-x-2 text-slate-600 text-sm">
              <Waves className="w-4 h-4 text-blue-600" />
              <span>Monitoring 15+ coastal regions in India</span>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mx-4 mb-24">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 text-center mb-12 tracking-tight">Voices from the Field</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/75 backdrop-blur-md rounded-[24px] p-8 border border-slate-200/80 hover:bg-slate-50/50 hover:border-cyan-300 transition-all duration-300 shadow-md flex flex-col justify-between">
                <div className="text-slate-700 text-base italic leading-relaxed mb-6">
                  "{testimonial.text}"
                </div>
                <div className="border-t border-slate-200 pt-5">
                  <div className="text-slate-900 font-extrabold text-sm">{testimonial.author}</div>
                  <div className="text-cyan-600 text-xs font-bold mt-0.5">{testimonial.role}</div>
                  <div className="text-slate-500 text-xs flex items-center mt-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {testimonial.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white/75 backdrop-blur-md rounded-[32px] p-8 sm:p-12 border border-slate-200 mx-4 mb-16 shadow-md">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 text-center mb-12 tracking-tight">Our Core Ecosystem</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                <Zap className="w-8 h-8 text-purple-700" />
              </div>
              <div className="text-slate-900 font-bold text-sm">Machine Learning</div>
              <div className="text-slate-500 text-xs mt-1">Spatio-temporal Models</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                <Globe className="w-8 h-8 text-blue-700" />
              </div>
              <div className="text-slate-900 font-bold text-sm">Satellite Imagery</div>
              <div className="text-slate-500 text-xs mt-1">ESA Sentinel & Landsat</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                <Waves className="w-8 h-8 text-emerald-700" />
              </div>
              <div className="text-slate-900 font-bold text-sm">Live Wave Sensors</div>
              <div className="text-slate-500 text-xs mt-1">IoT Telemetry Feeds</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                <AlertTriangle className="w-8 h-8 text-orange-700" />
              </div>
              <div className="text-slate-900 font-bold text-sm">Intelligent Alerts</div>
              <div className="text-slate-500 text-xs mt-1">SMS, Push, & Broadcast</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 text-center pb-20 px-4">
        <div className="max-w-4xl mx-auto bg-white/75 backdrop-blur-md rounded-[32px] p-8 sm:p-16 border border-slate-200 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100/30 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-none">Ready to protect your coast?</h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Join municipal leaders, oceanographers, and coastal citizens worldwide in monitoring and safeguarding shorelines.
          </p>
          <button 
            onClick={onRegister || onGetStarted}
            className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4.5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Create account and get started with coastal threat monitoring system"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
