const WebSocket = require('ws');
const { prisma } = require('../lib/db');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.intervalId = null;
    this.dbBackoffUntil = 0;
    this.dbErrorNotified = false;
  }

  initialize(server) {
    console.log('🔌 Initializing WebSocket Server...');
    
    // Attach ws to the HTTP server
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws) => {
      console.log('⚡ New WebSocket client connected');
      this.clients.add(ws);

      // Send initial data immediately on connection
      this.sendInitialData(ws);

      ws.on('message', (message) => {
        try {
          const payload = JSON.parse(message);
          console.log('📥 Received WS message:', payload);

          if (payload.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch (err) {
          console.warn('⚠️ Non-JSON WS message received:', message.toString());
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('❌ WebSocket client error:', err.message);
        this.clients.delete(ws);
      });
    });

    // Start broadcasting sensor stream updates every 5 seconds
    this.startStreaming();
  }

  async sendInitialData(ws) {
    try {
      const recentTides = await prisma.tidalData.findMany({ take: 10 });
      const recentMetrics = await prisma.environmentalMetric.findMany({ take: 10 });
      
      ws.send(JSON.stringify({
        type: 'initial_data',
        tides: recentTides,
        metrics: recentMetrics,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      console.error('❌ Failed to send initial WS data:', err.message);
    }
  }

  startStreaming() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(async () => {
      if (this.clients.size === 0) return; // Only process and save if there are active listeners
      if (Date.now() < this.dbBackoffUntil) return;

      try {
        // 1. Generate & Insert EnvironmentalMetric
        const newMetric = await prisma.environmentalMetric.create({
          data: {
            locationId: 'loc-chesapeake',
            waterTemp: parseFloat((15 + Math.random() * 5).toFixed(2)), // 15 - 20 C
            salinity: parseFloat((30 + Math.random() * 3).toFixed(2)), // 30 - 33 ppt
            chlorophyll: parseFloat((0.2 + Math.random() * 1.5).toFixed(2)), // ug/L
            turbidity: parseFloat((1.0 + Math.random() * 4.0).toFixed(2)), // NTU
            pH: parseFloat((7.8 + Math.random() * 0.6).toFixed(2)), // 7.8 - 8.4
            dissolvedOxygen: parseFloat((6.0 + Math.random() * 3.0).toFixed(2)), // mg/L
            windSpeed: parseFloat((5 + Math.random() * 15).toFixed(2)), // knots
            waveHeight: parseFloat((0.5 + Math.random() * 2.0).toFixed(2)), // meters
            timestamp: new Date()
          }
        });

        // 2. Generate & Insert TidalData
        const newTide = await prisma.tidalData.create({
          data: {
            stationId: 'cb0201',
            stationName: 'Chesapeake Bay Bridge Tunnel',
            waterLevel: parseFloat((1.2 + Math.sin(Date.now() / 3600000) * 0.8).toFixed(3)), // tide cycle simulation
            tideLevel: parseFloat((1.0 + Math.sin(Date.now() / 3600000) * 0.7).toFixed(3)),
            timestamp: new Date()
          }
        });

        console.log(`📡 WS Broadcast: Saved new metric & tide data. Active clients: ${this.clients.size}`);

        // 3. Broadcast to all clients
        const payload = JSON.stringify({
          type: 'live_update',
          tide: newTide,
          metric: newMetric,
          timestamp: new Date().toISOString()
        });

        for (const client of this.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
      } catch (err) {
        // Reduce startup noise when Neon DNS/network is temporarily unavailable.
        // Back off for 30s and retry later.
        this.dbBackoffUntil = Date.now() + 30 * 1000;
        if (!this.dbErrorNotified) {
          console.warn('⚠️ WS streaming paused due to database connectivity issue:', err.message);
          this.dbErrorNotified = true;
        }
      }
    }, 5000);
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }
}

module.exports = new WebSocketService();
