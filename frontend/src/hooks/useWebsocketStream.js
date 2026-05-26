import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { receiveLiveUpdate, setConnectionStatus } from '../store/slices/noaaSlice';
import { API_CONFIG } from '../config/apiConfig';
import { useAuth } from '../store/hooks';

export const useWebsocketStream = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    // Only connect if the user is authenticated to secure resources
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      setStatus('disconnected');
      dispatch(setConnectionStatus('disconnected'));
      return;
    }

    const getWsUrl = () => {
      const nodeApi = API_CONFIG.NODE_API || 'http://localhost:3001';
      try {
        const url = new URL(nodeApi);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${url.host}`;
      } catch (e) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}`;
      }
    };

    const connect = () => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        return;
      }

      setStatus('connecting');
      dispatch(setConnectionStatus('connecting'));
      const wsUrl = getWsUrl();
      console.log(`🔌 Connecting to CTAS Live Streaming WebSocket at: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('⚡ Connected to CTAS WebSocket Stream');
        setStatus('connected');
        dispatch(setConnectionStatus('connected'));
        reconnectAttemptsRef.current = 0;
        
        // Setup simple heartbeat ping every 30 seconds
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'live_update' || payload.type === 'initial_data') {
            dispatch(receiveLiveUpdate(payload));
          } else if (payload.type === 'pong') {
            // Heartbeat response
          }
        } catch (err) {
          console.warn('⚠️ Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket connection closed: code=${event.code}, reason=${event.reason}`);
        setStatus('disconnected');
        dispatch(setConnectionStatus('disconnected'));
        
        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        
        console.log(`⏳ Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      ws.onerror = (err) => {
        console.error('❌ WebSocket encountered error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, dispatch]);

  return status;
};

export default useWebsocketStream;
