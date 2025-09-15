import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Volume2, Settings } from 'lucide-react';
import { useAuth } from '../store/hooks';
import { sendChatMessage } from '../services/chatService';

const ChatbotWidget = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm CTAS Assistant 🌊 I specialize in coastal threat assessment and monitoring. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
      coastalScore: 85
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [responseMode, setResponseMode] = useState('technical');
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Prefer quick FAQ answer if available
      const faq = getFAQAnswer(userMessage.text);
      const result = faq ? { message: faq } : await sendChatMessage({ text: userMessage.text, mode: responseMode, context: { user: user?.name || 'Guest' } });

      const responseText = result?.message || "I'm experiencing some technical difficulties. Please try again.";

      // Simulated streaming typing effect for a real-time feel
      let assembled = '';
      for (const ch of responseText) {
        assembled += ch;
        await new Promise((r) => setTimeout(r, 8));
      }

      const botMessage = {
        id: Date.now() + 1,
        text: assembled,
        isBot: true,
        timestamp: new Date(),
        coastalScore: 78
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm experiencing some technical difficulties. Please try again.",
        isBot: true,
        timestamp: new Date(),
        coastalScore: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // Simple FAQ mapping for common questions with formatted answers
  const getFAQAnswer = (question) => {
    const q = String(question).toLowerCase();
    const entries = [
      {
        match: ['what is ctas', 'about ctas', 'ctas'],
        text:
`CTAS (Coastal Threat Alert System)

- Purpose: Early warning for coastal communities
- Key modules: Currents, Weather, Satellite, Reports, Analytics
- Access: Dashboard tabs in the top navigation`
      },
      {
        match: ['how to see currents', 'currents', 'ocean current'],
        text:
`Currents – Quick steps:
1) Open Dashboard → Currents
2) Check live speed and direction
3) Click Refresh to update data`
      },
      {
        match: ['weather', 'forecast', 'rain'],
        text:
`Weather – You can view:
- Current conditions (temp, humidity, wind)
- 5‑day forecast and alerts
Go to Dashboard → Weather`
      },
      {
        match: ['tide', 'tides', 'water level'],
        text:
`Tides & Water Level – Options:
- View recent tide heights and trends
- Check next high/low tide times
Path: Dashboard → Weather (water level)`
      },
      {
        match: ['satellite', 'imagery'],
        text:
`Satellite – Explore:
- Sea surface temperature, chlorophyll, cloud cover
- Interactive Mapbox coastal monitor
Open Dashboard → Satellite`
      },
      {
        match: ['report', 'community'],
        text:
`Reports – Submit or review:
- Flooding, erosion, debris, observations
Path: Dashboard → Reports`
      },
      {
        match: ['analytics', 'risk', 'threat'],
        text:
`Analytics – Understand risk drivers:
- Storm surge, erosion, navigation, blue‑carbon
- Trend charts and summaries`
      },
      {
        match: ['flood', 'surge'],
        text:
`Flood/Surge – Quick guide:
1) Check Weather → Alerts for warnings
2) Open Analytics → Threat Index
3) Verify shelter locations on the map`
      },
      {
        match: ['erosion'],
        text:
`Coastal Erosion – What we show:
- Hotspots based on satellite change detection
- Recent shoreline shifts
- Community reports overlay`
      },
      {
        match: ['mangrove', 'blue carbon'],
        text:
`Blue‑Carbon/Mangroves – Insights:
- NDVI/health indicators
- Coverage change and alerts
Ask: "Show mangrove health this month"`
      },
      {
        match: ['shelter', 'evacuation'],
        text:
`Shelters & Safety – Steps:
1) Open map overlays → Shelters
2) Note nearest routes
3) Follow local authority guidance`
      },
      {
        match: ['data source', 'where data', 'source'],
        text:
`Data Sources:
- NOAA currents and water level
- OpenWeather for conditions/alerts
- NASA/ESA satellite imagery`
      },
      {
        match: ['how to report', 'file report', 'submit report'],
        text:
`Create a Report:
1) Go to Dashboard → Reports
2) Click "New Report"
3) Add photos, location, details → Submit`
      },
      {
        match: ['units', 'knots', 'km/h', 'convert'],
        text:
`Units quick reference:
- 1 knot ≈ 1.852 km/h
- 10 kts ≈ 18.5 km/h
- Directions are in degrees (0–360)`
      },
      {
        match: ['safety', 'tips'],
        text:
`Safety Tips:
- Avoid low‑lying coastal roads during surge
- Heed official warnings and SMS alerts
- Keep emergency kit and contacts ready`
      }
    ];

    for (const entry of entries) {
      if (entry.match.some(m => q.includes(m))) return entry.text;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 text-white bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl">🌊</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">CTAS Coastal Assistant</h3>
              <div className="flex items-center space-x-2 text-sm opacity-90">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">⚡ Technical Mode</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                const modes = ['technical', 'standard', 'public', 'emergency'];
                const currentIndex = modes.indexOf(responseMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                setResponseMode(modes[nextIndex]);
                
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
              <Settings className="w-4 h-4" />
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.isBot
                  ? 'bg-white text-gray-800 shadow-lg border border-blue-100'
                  : 'bg-blue-600 text-white shadow-lg'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>
              {message.isBot && (
                <div className="flex items-center mt-2 space-x-2">
                  <button
                    onClick={() => speakMessage(message.text)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Listen to message"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  {message.coastalScore && (
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Coastal Score: {message.coastalScore}%
                    </div>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-lg border border-blue-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-blue-100">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about coastal threats, monitoring data..."
              className="w-full p-3 pr-12 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors text-gray-400 hover:text-blue-500"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "🌊 Current coastal conditions",
            "🌀 Storm surge analysis", 
            "📊 Littoral transport data",
            "⚠️ Threat assessment",
            "🔍 Erosion metrics"
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => setInputText(action.replace(/[🌊🌀📊⚠️🔍] /, ''))}
              className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            By chatting, you agree to <a href="#" className="text-blue-500 hover:underline">CTAS Terms</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWidget;
