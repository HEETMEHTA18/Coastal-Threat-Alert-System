import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, AlertTriangle, BarChart, Settings } from 'lucide-react';
import { useAuth, useAlerts, useDashboard } from '../store/hooks';
import { trainedCoastalResponse, evaluateCoastalScore } from '../utils/chatbotTrainer';
import { initializeCoastalChatbot, coastalResponseModes } from '../utils/chatbotInitializer';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm CTAS Assistant 🌊 I specialize in coastal threat assessment and monitoring. I can provide technical analysis of oceanographic conditions, erosion patterns, and flood risk metrics. How may I assist with your coastal data needs today?",
      isBot: true,
      timestamp: new Date(),
      coastalScore: 85, // High coastal score for initial message
      metadata: {
        coastalTerms: 6,
        technicalRating: "Excellent"
      }
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [responseMode, setResponseMode] = useState('technical'); // Default to technical mode
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const botConfig = useRef(null);

  // Get current app state for contextual responses
  const { user, isAuthenticated } = useAuth();
  const { alerts, unreadCount } = useAlerts();
  const { activeTab, unreadAlerts } = useDashboard();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Initialize coastal chatbot on first render
  useEffect(() => {
    if (!isInitialized) {
      console.log("Initializing coastal chatbot...");
      botConfig.current = initializeCoastalChatbot();
      setIsInitialized(true);
      console.log(`Chatbot initialized with coastal expertise score: ${botConfig.current.coastalExpertiseScore}`);
    }
  }, [isInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Store the input for processing
    const userQuery = inputText;

    // Simulate AI response with variable thinking time based on query complexity
    // More complex coastal queries take longer to "think about"
    const queryComplexity = userQuery.length / 20 + 
      (userQuery.toLowerCase().includes('coastal') ? 0.5 : 0) +
      (userQuery.toLowerCase().includes('technical') ? 0.5 : 0) +
      (userQuery.toLowerCase().includes('analysis') ? 0.7 : 0);
    
    const thinkingTime = 1000 + Math.min(3000, queryComplexity * 500);

    setTimeout(() => {
      const botResponse = generateBotResponse(userQuery);
      
      // Evaluate how coastal/technical the response is
      const evaluation = evaluateCoastalScore(botResponse);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
        coastalScore: evaluation.score,
        metadata: {
          coastalTerms: evaluation.termCount,
          technicalRating: evaluation.rating
        }
      }]);
      setIsTyping(false);
    }, thinkingTime);
  };

  // Enhanced coastal flood dataset
  const coastalFloodData = {
    riskFactors: {
      high: ['Norfolk, VA', 'Miami, FL', 'Charleston, SC', 'New Orleans, LA', 'Boston, MA'],
      moderate: ['Virginia Beach, VA', 'Outer Banks, NC', 'Galveston, TX', 'San Francisco, CA'],
      low: ['Myrtle Beach, SC', 'Ocean City, MD', 'Rehoboth Beach, DE']
    },
    floodTypes: {
      storm_surge: {
        description: "Ocean water pushed inland by storm winds",
        triggers: ["Hurricane winds >74mph", "Atmospheric pressure <980mb", "Low coastal elevation"],
        warning_time: "6-12 hours advance notice",
        severity_scale: "1-20 feet above normal tide levels"
      },
      coastal_flooding: {
        description: "Combination of high tides, rainfall, and drainage issues",
        triggers: ["Heavy rainfall >2 inches/hour", "Spring/King tides", "Poor drainage infrastructure"],
        warning_time: "2-6 hours advance notice", 
        severity_scale: "Minor (1-2ft) to Major (4+ ft) flooding"
      },
      flash_coastal: {
        description: "Rapid flooding from intense rainfall near coast",
        triggers: ["Intense rainfall >3 inches/hour", "Urban runoff", "Overwhelmed storm drains"],
        warning_time: "30 minutes - 2 hours",
        severity_scale: "Life-threatening in low-lying areas"
      }
    },
    historicalEvents: {
      "Hurricane Sandy 2012": "14-foot storm surge in NYC, $65B damage",
      "Hurricane Katrina 2005": "28-foot storm surge in Mississippi, 1,833 deaths",
      "Hurricane Florence 2018": "13-foot storm surge in NC, widespread coastal flooding",
      "King Tide Events": "Regular seasonal flooding in Miami, Norfolk, Charleston"
    },
    realTimeIndicators: {
      current: () => {
        // Simulate real-time data (would connect to actual APIs)
        const now = new Date();
        const tide = Math.sin(now.getHours() / 6 * Math.PI) * 2; // Simulated tide
        const pressure = 1013 + Math.random() * 20 - 10; // Random pressure
        const windSpeed = Math.random() * 40; // Random wind
        
        return {
          tideLevel: tide.toFixed(1),
          pressure: pressure.toFixed(0),
          windSpeed: windSpeed.toFixed(0),
          riskLevel: tide > 1.5 && pressure < 1000 && windSpeed > 25 ? 'HIGH' : 
                    tide > 1 || pressure < 1005 || windSpeed > 15 ? 'MODERATE' : 'LOW'
        };
      }
    }
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Check if user wants to change response mode
    if (input.includes('technical mode') || input.includes('expert mode')) {
      setResponseMode('technical');
      return `Response mode switched to TECHNICAL. I'll provide detailed coastal analysis with specialized terminology and precise measurements.`;
    } else if (input.includes('standard mode') || input.includes('normal mode')) {
      setResponseMode('standard');
      return `Response mode switched to STANDARD. I'll balance technical accuracy with accessibility in my coastal information.`;
    } else if (input.includes('public mode') || input.includes('simple mode')) {
      setResponseMode('public');
      return `Response mode switched to PUBLIC. I'll present coastal information in accessible language without technical terminology.`;
    } else if (input.includes('emergency mode')) {
      setResponseMode('emergency');
      return `🚨 EMERGENCY MODE ACTIVATED. I'll provide critical coastal threat information focused on safety and immediate actions.`;
    }
    
    // First, try to generate a specialized coastal response using our trained model
    let coastalResponse = trainedCoastalResponse(userInput);
    
    // Apply the current response mode formatting
    if (responseMode && coastalResponseModes[responseMode]) {
      const currentMode = coastalResponseModes[responseMode];
      console.log(`Applying ${currentMode.name} to response`);
      
      // In a real implementation, we would use the promptPrefix to modify the response
      // For demonstration purposes, we'll just use the trained response
    }
    
    // If the coastal response has a good score, use it
    const evaluation = evaluateCoastalScore(coastalResponse);
    
    // Use trained coastal response if score is Good or Excellent
    if (evaluation.score >= 60) {
      console.log(`Using coastal response with score: ${evaluation.score} (${evaluation.rating})`);
      return coastalResponse;
    }
    
    // Fallback to regular responses for common queries
    // Personalized greeting
    if (input.includes('hello') || input.includes('hi')) {
      const greeting = user ? `Hi ${user.name}! 👋` : "Hello there! 👋";
      return `${greeting} I'm your CTAS Assistant. I can help you with coastal threats, alerts, and emergency procedures. What would you like to know?`;
    }
    
    // Enhanced coastal flood specific responses
    if (input.includes('flood') || input.includes('flooding')) {
      const currentData = coastalFloodData.realTimeIndicators.current();
      if (input.includes('risk') || input.includes('current')) {
        return `🌊 **CURRENT FLOOD RISK ASSESSMENT**

**Current Conditions:**
• Tide Level: ${currentData.tideLevel}ft (${currentData.tideLevel > 1.5 ? 'Above Normal' : 'Normal'})
• Atmospheric Pressure: ${currentData.pressure}mb ${currentData.pressure < 1000 ? '⚠️ LOW' : '✅'}
• Wind Speed: ${currentData.windSpeed}mph ${currentData.windSpeed > 25 ? '⚠️ HIGH' : '✅'}

**Risk Level: ${currentData.riskLevel}** ${currentData.riskLevel === 'HIGH' ? '🚨' : currentData.riskLevel === 'MODERATE' ? '⚠️' : '✅'}

${currentData.riskLevel === 'HIGH' ? 
  '🚨 **HIGH RISK**: Avoid low-lying coastal areas. Monitor emergency alerts!' :
  currentData.riskLevel === 'MODERATE' ? 
  '⚠️ **MODERATE RISK**: Stay alert, avoid unnecessary coastal travel.' :
  '✅ **LOW RISK**: Normal coastal conditions, minimal flood threat.'
}

Would you like specific flood preparedness tips?`;
      }
      
      if (input.includes('type') || input.includes('kind')) {
        return `🌊 **TYPES OF COASTAL FLOODING**

**1. Storm Surge** 🌀
${coastalFloodData.floodTypes.storm_surge.description}
• Warning Time: ${coastalFloodData.floodTypes.storm_surge.warning_time}
• Severity: ${coastalFloodData.floodTypes.storm_surge.severity_scale}

**2. Coastal Flooding** 🌧️
${coastalFloodData.floodTypes.coastal_flooding.description}  
• Warning Time: ${coastalFloodData.floodTypes.coastal_flooding.warning_time}
• Severity: ${coastalFloodData.floodTypes.coastal_flooding.severity_scale}

**3. Flash Coastal Flooding** ⚡
${coastalFloodData.floodTypes.flash_coastal.description}
• Warning Time: ${coastalFloodData.floodTypes.flash_coastal.warning_time}
• Severity: ${coastalFloodData.floodTypes.flash_coastal.severity_scale}

Need specific info about any flood type?`;
      }
      
      if (input.includes('history') || input.includes('past') || input.includes('historical')) {
        return `📚 **MAJOR COASTAL FLOOD EVENTS**

${Object.entries(coastalFloodData.historicalEvents).map(([event, details]) => 
  `**${event}**: ${details}`
).join('\n\n')}

These events highlight the importance of early warning systems like CTAS. Would you like preparedness tips based on these lessons?`;
      }
      
      return `🌊 I can help with coastal flooding information! Ask me about:

• **Current flood risk** in your area
• **Types of coastal flooding** and their characteristics  
• **Historical flood events** and lessons learned
• **Flood preparedness** and evacuation procedures
• **Real-time monitoring** data and alerts

What specific flooding information do you need?`;
    }

    // Enhanced location-based flood risk assessment
    if (input.includes('location') || input.includes('area') || input.includes('region')) {
      if (input.includes('risk') || input.includes('flood')) {
        // Check if user mentioned a specific location
        const mentionedLocation = Object.values(coastalFloodData.riskFactors).flat()
          .find(location => input.includes(location.toLowerCase().split(',')[0].toLowerCase()));
        
        if (mentionedLocation) {
          const riskLevel = Object.entries(coastalFloodData.riskFactors)
            .find(([level, locations]) => locations.includes(mentionedLocation))?.[0];
          
          return `📍 **FLOOD RISK FOR ${mentionedLocation.toUpperCase()}**

**Risk Level: ${riskLevel?.toUpperCase() || 'UNKNOWN'}** ${riskLevel === 'high' ? '🚨' : riskLevel === 'moderate' ? '⚠️' : '✅'}

${riskLevel === 'high' ? 
  '🚨 **HIGH RISK AREA** - This location experiences frequent coastal flooding due to low elevation, exposure to storm surge, and tidal influences. Emergency preparedness is critical!' :
  riskLevel === 'moderate' ? 
  '⚠️ **MODERATE RISK AREA** - Occasional flooding during storms and high tides. Stay informed about weather conditions and have evacuation plans ready.' :
  '✅ **LOWER RISK AREA** - Less frequent flooding, but still monitor conditions during major storms.'
}

Would you like specific evacuation routes and emergency procedures for this area?`;
        }
      }
      
      return `📍 I can provide location-specific flood risk assessments! Our system covers:

**HIGH RISK AREAS** 🚨: ${coastalFloodData.riskFactors.high.join(', ')}
**MODERATE RISK** ⚠️: ${coastalFloodData.riskFactors.moderate.join(', ')}  
**LOWER RISK** ✅: ${coastalFloodData.riskFactors.low.join(', ')}

Share your location (city/state) and I'll give you targeted flood risk information and safety recommendations!`;
    }

    // Context-aware responses using current app state
    if (input.includes('alert') && unreadAlerts > 0) {
      return `🚨 You have ${unreadAlerts} unread alert${unreadAlerts > 1 ? 's' : ''}! Check your alerts tab for details. Would you like me to help you set up SMS notifications for future alerts?`;
    }
    
    if (input.includes('alert') && unreadAlerts === 0) {
      return "✅ Great news! No active alerts for your area right now. I'm continuously monitoring for any threats. Would you like me to set up proactive notifications?";
    }
    
    // Dashboard-specific responses
    if (input.includes('dashboard') || input.includes('overview') || input.includes('explain')) {
      return `📊 You're currently viewing the ${activeTab} tab. I can help you navigate to different sections or explain the data you're seeing. What would you like to explore?`;
    }
    
    // Coastal threat specific responses
    if (input.includes('sea level') || input.includes('water level')) {
      return "🌊 Current sea level readings show normal conditions. I'm monitoring for any anomalies using our AI detection system. Would you like me to set up alerts for your specific location?";
    }
    
    if (input.includes('hurricane') || input.includes('storm') || input.includes('cyclone')) {
      return "🌀 I'm tracking weather patterns using satellite data and NOAA feeds. No immediate hurricane threats detected, but I'll notify you instantly if conditions change. Stay prepared with our emergency kit recommendations!";
    }
    
    if (input.includes('emergency') || input.includes('evacuation')) {
      return "🆘 For immediate emergencies, call 911. For coastal evacuation info:\\n📱 Sign up for local emergency alerts\\n🚗 Know your evacuation routes\\n🎒 Keep emergency supplies ready\\n\\nWould you like me to help you prepare an emergency plan?";
    }
    
    if (input.includes('sms') || input.includes('text') || input.includes('notification')) {
      return "📱 I can help you set up SMS alerts! You'll get instant notifications for:\\n🌊 Sea level anomalies\\n🌀 Storm warnings\\n🚨 Emergency evacuations\\n\\nShall I guide you through the setup process?";
    }
    
    if (input.includes('weather') || input.includes('forecast')) {
      return "🌤️ Current weather conditions are stable. Wind speeds are within normal range. I'm analyzing multiple data sources including satellite imagery and oceanographic sensors. Any specific weather concerns?";
    }
    
    if (input.includes('anomaly') || input.includes('unusual') || input.includes('ai')) {
      return "🤖 My AI systems are continuously analyzing sensor data for unusual patterns. I use machine learning to detect:\\n📊 Statistical anomalies\\n🌊 Unusual tide patterns\\n💨 Wind speed variations\\n\\nCurrent status: All systems normal ✅";
    }
    
    if (input.includes('satellite') || input.includes('map')) {
      return "🛰️ I have access to real-time satellite imagery and mapping data. I can help you:\\n🗺️ View threat locations\\n📍 Track storm movements\\n🔍 Analyze coastal changes\\n\\nSwitch to the satellite tab to explore the interactive map!";
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return `I'm your 24/7 coastal safety assistant! I can help with:

🌊 **Monitoring**: Sea level, storms, anomalies
🚨 **Alerts**: Real-time notifications and SMS setup  
📊 **Data**: Explain dashboard readings and trends
🗺️ **Navigation**: Guide you through CTAS features
🆘 **Emergency**: Safety procedures and evacuation info
🤖 **AI Insights**: Anomaly detection and predictions

${user ? `Welcome ${user.name}!` : 'Login for personalized alerts!'} What would you like to explore?`;
    }
    
    if (input.includes('thanks') || input.includes('thank you')) {
      return "You're very welcome! 😊 I'm here 24/7 to help keep coastal communities safe. Remember to stay alert and prepared! Is there anything else I can help you with?";
    }
    
    if (input.includes('login') || input.includes('account')) {
      if (isAuthenticated) {
        return `✅ You're logged in as ${user?.name || 'User'}! This gives you access to personalized alerts and settings. Need help with your account preferences?`;
      } else {
        return "🔐 You're not logged in yet. Logging in allows you to:\\n📱 Set up personalized SMS alerts\\n💾 Save your preferences\\n📊 Access detailed reports\\n\\nWould you like me to guide you to the login page?";
      }
    }
    
    // Location-specific responses
    if (input.includes('location') || input.includes('area') || input.includes('region')) {
      return "📍 I can provide location-specific threat assessments! Our system covers major coastal areas. Share your location (city/state) and I'll give you targeted information about local threats and evacuation routes.";
    }
    
    // Data and analytics
    if (input.includes('data') || input.includes('analytics') || input.includes('report')) {
      return "📈 I have access to comprehensive coastal data:\\n🌊 Real-time oceanographic data\\n🌡️ Temperature and salinity readings\\n💨 Wind and wave measurements\\n📊 Historical trend analysis\\n\\nWhat specific data would you like to explore?";
    }
    
    // Default responses with personality
    const defaultResponses = [
      "I'm analyzing coastal data for you... 🤔 Could you be more specific? Try asking about sea levels, storms, alerts, or emergency procedures!",
      "That's an interesting question! 🌊 I specialize in coastal safety - ask me about weather patterns, threat assessments, or how to stay prepared!",
      "I'm here to help with coastal threats and safety! 🛟 Try asking about alerts, emergency procedures, or our monitoring systems.",
      "I'm your coastal guardian assistant! 🏖️ Ask me about anything related to sea levels, storms, evacuation plans, or safety tips!"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input functionality would be implemented here
  };

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            <MessageCircle className="w-7 h-7" />
            {(unreadAlerts > 0 || !isAuthenticated) && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce border-2 border-white">
                {unreadAlerts > 0 ? (unreadAlerts > 9 ? '9+' : unreadAlerts) : '!'}
              </div>
            )}
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
          </button>
          
          {/* Floating notification bubble */}
          <div className="absolute bottom-20 right-0 bg-white text-gray-800 px-4 py-3 rounded-xl shadow-2xl max-w-60 animate-bounce border border-blue-200"
               style={{
                 boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 0 15px rgba(59, 130, 246, 0.2)'
               }}>
            <div className="text-sm font-medium">
              {unreadAlerts > 0 
                ? `⚠️ ${unreadAlerts} new alert${unreadAlerts > 1 ? 's' : ''}! Need help?` 
                : user 
                  ? `Hi ${user.name}! Ask me anything! 🌊`
                  : "Hi! Need help with coastal threats? 🌊"
              }
            </div>
            <div className="absolute bottom-0 right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white transform translate-y-full"></div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-blue-200"
             style={{
               boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 30px rgba(59, 130, 246, 0.3)'
             }}>
          {/* Header */}
          <div className="p-4 text-white relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)'
               }}>
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full transform -translate-x-16 -translate-y-16 animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full transform translate-x-12 translate-y-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                {/* Enhanced mascot avatar */}
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce"
                     style={{ animationDuration: '2s' }}>
                  <span className="text-2xl">🌊</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">CTAS Coastal Assistant</h3>
                  <div className="flex items-center space-x-2 text-sm opacity-90">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">
                      {responseMode === 'technical' && 'Technical Mode'}
                      {responseMode === 'standard' && 'Standard Mode'}
                      {responseMode === 'public' && 'Public Mode'}
                      {responseMode === 'emergency' && '🚨 Emergency Mode'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {/* Mode selector button */}
                <button
                  onClick={() => {
                    // Simple mode rotation
                    const modes = ['technical', 'standard', 'public', 'emergency'];
                    const currentIndex = modes.indexOf(responseMode);
                    const nextIndex = (currentIndex + 1) % modes.length;
                    setResponseMode(modes[nextIndex]);
                    
                    // Add system message about mode change
                    setMessages(prev => [...prev, {
                      id: Date.now(),
                      text: `Mode changed to ${modes[nextIndex].toUpperCase()}`,
                      isBot: true,
                      isSystem: true,
                      timestamp: new Date()
                    }]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Change response mode"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors transform hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] ${message.isBot ? 'order-2' : ''}`}>
                  {message.isBot && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-sm">🤖</span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">CTAS Assistant</span>
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-2xl ${
                      message.isBot
                        ? 'bg-white text-gray-800 shadow-lg border border-blue-100'
                        : 'text-white shadow-lg'
                    }`}
                    style={message.isBot ? {
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                    } : {
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    {message.isBot && (
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          onClick={() => speakMessage(message.text)}
                          className="p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Listen to message"
                        >
                          <Volume2 className="w-3 h-3 text-blue-500" />
                        </button>
                        
                        {/* Display coastal expertise indicators if available */}
                        {message.coastalScore && (
                          <div className="flex items-center space-x-1" 
                               title={`Technical rating: ${message.metadata?.technicalRating || 'Standard'}`}>
                            {message.coastalScore >= 80 && (
                              <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium flex items-center">
                                <BarChart className="w-2 h-2 mr-1" />Expert
                              </span>
                            )}
                            {message.coastalScore >= 60 && message.coastalScore < 80 && (
                              <span className="px-1 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium flex items-center">
                                <BarChart className="w-2 h-2 mr-1" />Technical
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-blue-100"
                     style={{
                       boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                     }}>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-blue-600 font-medium ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-blue-100">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about coastal threats, weather alerts..."
                  className="w-full p-3 pr-12 border-2 border-blue-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows="1"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={toggleVoiceInput}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                    isListening ? 'text-red-500 bg-red-100 animate-pulse' : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title="Voice input"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="p-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                style={{
                  background: inputText.trim() 
                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
                    : 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
                  color: inputText.trim() ? 'white' : '#9CA3AF',
                  boxShadow: inputText.trim() 
                    ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Quick Actions - Enhanced with coastal technical terms */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                "🌊 Current coastal conditions",
                "🌀 Storm surge analysis", 
                "📊 Littoral transport data",
                "�️ Shoreline erosion metrics",
                "� Sea level anomalies",
                "🔍 Bathymetric analysis",
                "⚠️ Coastal vulnerability index"
              ].map((action) => (
                <button
                  key={action}
                  onClick={() => setInputText(action.slice(2).trim())}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-full transition-all duration-200 border border-blue-200 hover:border-blue-300 transform hover:scale-105 font-medium"
                >
                  {action}
                </button>
              ))}
            </div>
            
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500">
                By chatting, you agree to{' '}
                <a href="#" className="text-blue-500 hover:underline font-medium">CTAS Terms</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
