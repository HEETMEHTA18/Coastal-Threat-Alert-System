import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Volume2, Settings } from 'lucide-react';
import { useAuth } from '../store/hooks';
import { sendChatMessage } from '../services/chatService';
import { getAlertPrediction } from '../services/alertPredictionService';
import { getWeatherPrediction } from '../services/weatherPredictionService';

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
  const utteranceRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ensure speech stops when widget unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

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
      // If user asks for a prediction, call the prediction API
      // Example: if the message contains 'predict' or 'alert', use static demo values
      const lower = userMessage.text.toLowerCase();


      // Unified prediction intent (weather, rain, forecast, currents)
      if (lower.includes('weather') || lower.includes('forecast') || lower.includes('rain') || lower.includes('current')) {
        // Try to get user's location from browser if available
        let lat = 19.0760;
        let lon = 72.8777;
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            lat = position.coords.latitude;
            lon = position.coords.longitude;
            await fetchAlertPrediction(lat, lon);
          }, async () => {
            await fetchAlertPrediction(lat, lon);
          });
        } else {
          await fetchAlertPrediction(lat, lon);
        }
        async function fetchAlertPrediction(lat, lon) {
          try {
            const result = await getAlertPrediction({ latitude: lat, longitude: lon });

            // Build a structured message payload for the UI
            const payload = {
              rain_predicted: result.rain_predicted ?? null,
              rain_probability: result.rain_probability ?? null,
              temperature_predicted: result.temperature_predicted ?? null,
              humidity_predicted: result.humidity_predicted ?? null,
              water_level_predicted: result.water_level_predicted ?? null,
              alerts: Array.isArray(result.alerts) ? result.alerts : [],
              features_used: result.features_used || null,
              _source: result._source || 'unknown'
            };

            setMessages(prev => [...prev, {
              id: Date.now() + 3,
              text: '', // text will be rendered from payload
              isBot: true,
              timestamp: new Date(),
              coastalScore: 80,
              type: 'prediction',
              payload
            }]);

            // Also try to fetch a short forecast (next 6 hours) to provide context; this remains optional
            try {
              const forecast = await getWeatherPrediction({ latitude: lat, longitude: lon });
              if (Array.isArray(forecast) && forecast.length > 0) {
                const next6 = forecast.slice(0, 6).map(h => ({
                  timestamp: h.timestamp,
                  temperature: h.temperature,
                  humidity: h.humidity,
                  rain_probability: h.rain_probability
                }));
                setMessages(prev => [...prev, {
                  id: Date.now() + 4,
                  text: '',
                  isBot: true,
                  timestamp: new Date(),
                  type: 'forecast_summary',
                  payload: { hours: next6 }
                }]);
              }
            } catch (ferr) {
              // ignore forecast errors for the primary alert card
            }

          } catch (err) {
            const extra = err.body ? ` | body: ${JSON.stringify(err.body)}` : (err.request ? ' | no-response' : '');
            setMessages(prev => [...prev, {
              id: Date.now() + 3,
              text: `Prediction error: ${err.message}${extra}`,
              isBot: true,
              timestamp: new Date(),
              coastalScore: 0
            }]);
          }
        }
        setIsTyping(false);
        return;
      }

      // Prefer quick FAQ answer if available
      const faq = getFAQAnswer(userMessage.text);
      if (faq) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: faq,
          isBot: true,
          timestamp: new Date(),
          coastalScore: 78
        }]);
        return;
      }

      // If user asks for a prediction, call the prediction API
      // Example: if the message contains 'predict' or 'alert', use static demo values
      // Build prediction input; attempt to get the user's current coordinates
      let predLat = 19.0760;
      let predLon = 72.8777;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          predLat = pos.coords.latitude;
          predLon = pos.coords.longitude;
        } catch (e) {
          // If geolocation fails or times out, fall back to defaults
        }
      }

      const predictionInput = {
        // include lat/lon so backend pydantic schema accepts the request
        latitude: predLat,
        longitude: predLon,
        water_level_m: 1.5,
        wind_speed_m_s: 5.0,
        air_pressure_hpa: 1012,
        chlorophyll_mg_m3: 0.8,
        rainfall: 0.0
      };
      try {
        const result = await getAlertPrediction(predictionInput);
        
        // Build a structured message payload for the UI (same as fetchAlertPrediction)
        const payload = {
          rain_predicted: result.rain_predicted ?? null,
          rain_probability: result.rain_probability ?? null,
          temperature_predicted: result.temperature_predicted ?? null,
          humidity_predicted: result.humidity_predicted ?? null,
          water_level_predicted: result.water_level_predicted ?? null,
          alerts: Array.isArray(result.alerts) ? result.alerts : [],
          features_used: result.features_used || null,
          _source: result._source || 'unknown'
        };

        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          text: '', // text will be rendered from payload
          isBot: true,
          timestamp: new Date(),
          coastalScore: result.anomaly === 1 ? 100 : 80,
          type: 'prediction',
          payload
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          text: `Prediction error: ${err.message}`,
          isBot: true,
          timestamp: new Date(),
          coastalScore: 0
        }]);
      }
      return;

      // Otherwise, fallback to normal chat
      const result = await sendChatMessage({ text: userMessage.text, mode: responseMode, context: { user: user?.name || 'Guest' } });
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

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  };

  const speakMessage = (messageOrText) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    // Stop any current speech
    stopSpeech();

    let text = '';
    if (typeof messageOrText === 'string') {
      text = messageOrText;
    } else if (messageOrText && messageOrText.type === 'prediction' && messageOrText.payload) {
      const p = messageOrText.payload;
      // Temperature is already in Celsius from the API, no need to convert
      const tempC = p.temperature_predicted != null && !Number.isNaN(p.temperature_predicted) 
        ? Math.round(Number(p.temperature_predicted) * 10) / 10 
        : null;
      const rainPct = p.rain_probability != null ? Math.round(p.rain_probability * 100) : (p.rain_predicted ? 100 : 0);
      text = `Prediction and alerts. Rain: ${p.rain_predicted ? 'Yes' : 'No'} (${rainPct} percent). ` +
             `Temperature: ${tempC != null ? tempC + ' degrees Celsius' : 'N A'}. ` +
             `Humidity: ${p.humidity_predicted != null ? Math.round(p.humidity_predicted) + ' percent' : 'N A'}. ` +
             `Water level: ${p.water_level_predicted != null ? p.water_level_predicted + ' meters' : 'N A'}.`;
    } else if (messageOrText && messageOrText.type === 'forecast_summary' && messageOrText.payload && Array.isArray(messageOrText.payload.hours)) {
      const hours = messageOrText.payload.hours.slice(0, 6);
      text = 'Forecast for the next ' + hours.length + ' hours. ';
      for (const h of hours) {
        const t = h.temperature != null ? `${Math.round((h.temperature - 273.15) * 10) / 10} degrees` : 'N A';
        const hp = h.humidity != null ? `${Math.round(h.humidity)} percent` : 'N A';
        const rp = h.rain_probability != null ? `${Math.round(h.rain_probability * 100)} percent` : 'N A';
        const timeLabel = new Date(h.timestamp).toLocaleTimeString();
        text += `${timeLabel}: ${t}, humidity ${hp}, rain ${rp}. `;
      }
    } else if (messageOrText && messageOrText.text) {
      text = messageOrText.text;
    } else {
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => {
        utteranceRef.current = null;
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
        setIsSpeaking(false);
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch (e) {
      // ignore TTS errors
      utteranceRef.current = null;
      setIsSpeaking(false);
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

            <button
              onClick={async () => {
                // ping the backend via the Vite proxy
                try {
                  const res = await fetch('/api/ping');
                  const body = await res.json().catch(() => null);
                  setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: body && body.message ? `Backend: ${body.message}` : `Backend responded: ${res.status} ${res.statusText}`,
                    isBot: true,
                    isSystem: true,
                    timestamp: new Date()
                  }]);
                } catch (e) {
                  setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: `Backend ping failed: ${e.message}`,
                    isBot: true,
                    isSystem: true,
                    timestamp: new Date()
                  }]);
                }
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Ping backend"
            >
              <span className="text-sm">Ping</span>
            </button>

            {onClose && (
              <button
                onClick={() => { stopSpeech(); onClose && onClose(); }}
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
              {/* Render structured prediction/forecast types specially */}
              {message.type === 'prediction' && message.payload ? (
                (() => {
                  const p = message.payload;
                  // Temperature is already in Celsius from the API, no need to convert from Kelvin
                  const tempC = (t) => (t == null || Number.isNaN(t) ? 'N/A' : `${Math.round(Number(t) * 10) / 10}°C`);
                  const pct = (v) => (v == null || Number.isNaN(v) ? 'N/A' : `${Math.round((Number(v) * 1000)) / 10}%`);
                  return (
                    <div>
                      <div className="font-semibold flex items-center justify-between">
                        <span>Prediction & Alerts</span>
                        <span className="text-xs text-gray-500">{p._source === 'proxy' ? 'proxy' : p._source === 'direct' ? 'direct' : 'backend'}</span>
                      </div>
                      {p.structured_alerts && p.structured_alerts.length > 0 ? (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="font-bold text-yellow-800">⚠️ Alerts</div>
                          <ul className="list-none ml-0 mt-1 text-sm space-y-1">
                            {p.structured_alerts.map((a, i) => (
                              <li key={i} className="flex items-start space-x-2">
                                <div className={`px-2 py-1 rounded text-white text-xs ${a.severity === 'critical' ? 'bg-red-600' : a.severity === 'warn' ? 'bg-yellow-600 text-black' : 'bg-gray-400'}`}>
                                  {a.severity.toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{a.text}</div>
                                  {a.suggested_action ? <div className="text-xs text-gray-700">Action: {a.suggested_action}</div> : null}
                                  {a.model_meta && Object.keys(a.model_meta).length > 0 ? <div className="text-xs text-gray-500">Model: {a.model_meta.model || a.model_meta.model_name || a.model_meta.model || 'unknown'}</div> : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : p.alerts && p.alerts.length > 0 ? (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="font-bold text-yellow-800">⚠️ Alerts</div>
                          <ul className="list-disc ml-5 mt-1 text-sm">
                            {p.alerts.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-600">No critical alerts.</div>
                      )}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Rain:</strong> {p.rain_predicted ? 'Yes' : 'No'} ({pct(p.rain_probability)})</div>
                        <div><strong>Temp:</strong> {tempC(p.temperature_predicted)}</div>
                        <div><strong>Humidity:</strong> {p.humidity_predicted != null ? `${Math.round(p.humidity_predicted)}%` : 'N/A'}</div>
                        <div><strong>Water:</strong> {p.water_level_predicted != null ? `${Math.round(p.water_level_predicted * 100) / 100} m` : 'N/A'}</div>
                      </div>
                      {p.features_used ? (
                        <div className="mt-2 text-xs text-gray-500">Lat: {p.features_used.latitude ?? 'N/A'}, Lon: {p.features_used.longitude ?? 'N/A'}</div>
                      ) : null}
                    </div>
                  );
                })()
              ) : message.type === 'forecast_summary' && message.payload ? (
                (() => {
                  const hours = message.payload.hours || [];
                  return (
                    <div>
                      <div className="font-semibold">Forecast (next {hours.length}h)</div>
                      <div className="mt-2 text-sm grid grid-cols-1 gap-2">
                        {hours.map((h, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-700">
                            <div>{new Date(h.timestamp).toLocaleTimeString()}</div>
                            <div>{(h.temperature != null) ? `${Math.round((h.temperature - 273.15) * 10) / 10}°C` : 'N/A'}</div>
                            <div>{h.humidity != null ? `${Math.round(h.humidity)}%` : 'N/A'}</div>
                            <div>{h.rain_probability != null ? `${Math.round(h.rain_probability * 100)}%` : 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()
              ) : (
                <p className="text-sm whitespace-pre-line">{message.text}</p>
              )}
              {message.isBot && (
                <div className="flex items-center mt-2 space-x-2">
                    <button
                      onClick={() => speakMessage(message.type ? message : message.text)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title={isSpeaking ? 'Stop speaking' : 'Listen to message'}
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

          {/* Live data quick action */}
          <button
            key="live-data"
            onClick={async () => {
              setIsTyping(true);
              // Request geolocation and fetch alert + forecast
              let lat = 19.0760;
              let lon = 72.8777;
              if (navigator.geolocation) {
                try {
                  const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
                  lat = pos.coords.latitude;
                  lon = pos.coords.longitude;
                } catch (e) {
                  // user denied or timeout, keep defaults
                }
              }
              try {
                const result = await getAlertPrediction({ latitude: lat, longitude: lon });
                const payload = {
                  rain_predicted: result.rain_predicted ?? null,
                  rain_probability: result.rain_probability ?? null,
                  temperature_predicted: result.temperature_predicted ?? null,
                  humidity_predicted: result.humidity_predicted ?? null,
                  water_level_predicted: result.water_level_predicted ?? null,
                  alerts: Array.isArray(result.alerts) ? result.alerts : [],
                  features_used: result.features_used || null,
                  _source: result._source || 'unknown'
                };
                setMessages(prev => [...prev, {
                  id: Date.now() + 5,
                  text: '',
                  isBot: true,
                  timestamp: new Date(),
                  coastalScore: 80,
                  type: 'prediction',
                  payload
                }]);

                // fetch forecast as well
                try {
                  const forecast = await getWeatherPrediction({ latitude: lat, longitude: lon });
                  if (forecast && Array.isArray(forecast.hours ? forecast.forecast : forecast)) {
                    const hours = forecast.hours ? forecast.forecast : forecast;
                    const next6 = hours.slice(0, 6).map(h => ({ timestamp: h.timestamp, temperature: h.temperature, humidity: h.humidity, rain_probability: h.rain_probability }));
                    setMessages(prev => [...prev, {
                      id: Date.now() + 6,
                      text: '',
                      isBot: true,
                      timestamp: new Date(),
                      type: 'forecast_summary',
                      payload: { hours: next6 }
                    }]);
                  }
                } catch (ferr) {
                  // ignore forecast errors
                }
              } catch (err) {
                setMessages(prev => [...prev, {
                  id: Date.now() + 5,
                  text: `Live prediction error: ${err.message}`,
                  isBot: true,
                  timestamp: new Date(),
                  coastalScore: 0
                }]);
              } finally {
                setIsTyping(false);
              }
            }}
            className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-100 transition-colors"
          >
            🔄 Live data
          </button>
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
