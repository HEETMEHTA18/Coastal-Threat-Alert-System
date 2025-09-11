import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, Play, BarChart3, Shield, Users, Globe, AlertTriangle, Waves, Zap, Award, TrendingUp, MapPin } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);

  const features = [
    {
      icon: Shield,
      title: "Real-time Threat Detection",
      description: "AI-powered analysis of environmental data to detect coastal threats before they become critical",
      color: "from-red-500 to-pink-500",
      metric: "24/7",
      metricLabel: "Continuous Monitoring"
    },
    {
      icon: Globe,
      title: "Blue Carbon Protection",
      description: "Monitor and protect vital mangrove ecosystems and coastal wetlands using satellite imagery",
      color: "from-green-500 to-emerald-500",
      metric: "50+",
      metricLabel: "Data Sources"
    },
    {
      icon: Users,
      title: "Community Alerts",
      description: "Multi-channel alert system reaching coastal communities through SMS, app notifications, and web",
      color: "from-blue-500 to-cyan-500",
      metric: "95%",
      metricLabel: "Prediction Accuracy"
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "Machine learning models that identify patterns and predict environmental threats",
      color: "from-purple-500 to-violet-500",
      metric: "1M+",
      metricLabel: "Lives Protected"
    }
  ];

  const impactStats = [
    { icon: AlertTriangle, value: "247", label: "Threats Detected", color: "text-red-400" },
    { icon: MapPin, value: "15+", label: "Coastal Cities", color: "text-green-400" },
    { icon: Award, value: "98.7%", label: "Accuracy Rate", color: "text-yellow-400" },
    { icon: TrendingUp, value: "1.2M", label: "Lives Protected", color: "text-blue-400" }
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

  const handleCardHover = useCallback((index) => {
    setHoveredCard(index);
  }, []);

  const handleCardLeave = useCallback(() => {
    setHoveredCard(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-4 sm:p-6" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl" role="img" aria-label="Wave">🌊</span>
            </div>
            <span className="text-white font-bold text-xl sm:text-2xl">CTAS</span>
          </div>
          <button 
            onClick={onGetStarted}
            className="bg-white/10 backdrop-blur-lg text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Access dashboard"
          >
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Start</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-32">
        <div className="text-center mb-16 sm:mb-20">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-black text-white mb-6 sm:mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Coastal
            </span>
            <br />
            <span className="text-white drop-shadow-2xl">Threat Alert</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              System
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-cyan-100 mb-4 sm:mb-6 font-light max-w-4xl mx-auto leading-relaxed px-4">
            Protecting coastal communities with AI-powered early warning systems
          </p>
          
          <p className="text-base sm:text-lg text-cyan-200 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Real-time monitoring, predictive analytics, and community alerts for storm surges, 
            coastal erosion, and blue carbon ecosystem protection
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
            <button 
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Get started with CTAS threat monitoring"
            >
              <span>Get Started</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              className="group bg-white/10 backdrop-blur-lg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg border border-white/30 hover:bg-white/20 transition-all duration-300 flex items-center space-x-2 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Watch a demonstration of the system"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20 px-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
              onMouseEnter={() => handleCardHover(index)}
              onMouseLeave={handleCardLeave}
              onFocus={() => handleCardHover(index)}
              onBlur={handleCardLeave}
              tabIndex={0}
              role="article"
              aria-labelledby={`feature-title-${index}`}
            >
              <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" aria-hidden="true" />
              </div>
              
              <h3 
                id={`feature-title-${index}`}
                className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 group-hover:text-cyan-300 transition-colors"
              >
                {feature.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base group-hover:text-white transition-colors mb-4">
                {feature.description}
              </p>

              {/* Metric Display */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white mb-1 group-hover:text-cyan-400 transition-colors">
                  {feature.metric}
                </div>
                <div className="text-cyan-200 font-medium text-sm">
                  {feature.metricLabel}
                </div>
              </div>

              {hoveredCard === index && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border border-cyan-400/30 -z-10 animate-pulse"></div>
              )}
            </div>
          ))}
        </div>

        {/* Impact Statistics Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/10 mx-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {impactStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="group cursor-pointer transition-all duration-300 hover:scale-105" role="button" tabIndex={0}>
                  <div className="flex justify-center mb-3">
                    <Icon className={`w-8 h-8 ${stat.color} group-hover:scale-110 transition-transform`} />
                  </div>
                  <div className={`text-3xl sm:text-4xl md:text-5xl font-black mb-2 sm:mb-3 group-hover:scale-110 transition-all ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-cyan-200 font-medium text-sm sm:text-base">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Status Banner */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mx-4 mb-16">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold">System Status: Active</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-white/20"></div>
            <div className="text-cyan-200">
              <span className="font-semibold">{impactStats[currentStatIndex].value}</span> {impactStats[currentStatIndex].label}
            </div>
            <div className="hidden md:block w-px h-6 bg-white/20"></div>
            <div className="hidden md:flex items-center space-x-2 text-cyan-200">
              <Waves className="w-4 h-4" />
              <span>Monitoring 15+ coastal regions</span>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mx-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">Trusted by Coastal Communities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="text-cyan-100 text-lg mb-4 leading-relaxed">
                  "{testimonial.text}"
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white font-semibold">{testimonial.author}</div>
                  <div className="text-cyan-200 text-sm">{testimonial.role}</div>
                  <div className="text-cyan-300 text-xs flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {testimonial.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/10 mx-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8">Powered by Advanced Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="text-white font-semibold">Machine Learning</div>
              <div className="text-cyan-200 text-sm">Advanced AI Models</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-white font-semibold">Satellite Data</div>
              <div className="text-cyan-200 text-sm">NASA & ESA Sources</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Waves className="w-8 h-8 text-white" />
              </div>
              <div className="text-white font-semibold">Ocean Sensors</div>
              <div className="text-cyan-200 text-sm">IoT Network</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div className="text-white font-semibold">Real-time Alerts</div>
              <div className="text-cyan-200 text-sm">Instant Notifications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 text-center pb-8 sm:pb-12 px-4">
        <div className="bg-gradient-to-r from-blue-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Ready to protect your coast?</h2>
          <p className="text-cyan-200 mb-4 sm:mb-6 text-sm sm:text-base">Join the next generation of coastal threat monitoring</p>
          <button 
            onClick={onGetStarted}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Get started with coastal threat monitoring system"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
