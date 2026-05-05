import { useState, useEffect, useRef, useCallback } from 'react';

// How long to wait between reconnect attempts (ms). Grows with each failed attempt.
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

// Candidate hosts to probe during IP rediscovery (scans common subnets + localhost)
const DISCOVERY_CANDIDATES = [
  'localhost',
  '127.0.0.1',
  '192.168.0',   // subnet prefix — will scan .1 → .15
  '192.168.1',
  '172.17.0',
  '10.0.0',
];

const DISCOVERY_PORT = '8000';
const DISCOVERY_TIMEOUT_MS = 1500;

/**
 * Probes a single host:port for the /health endpoint.
 * Returns the host string if reachable, null otherwise.
 */
async function probeHost(host, port) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);
  try {
    const res = await fetch(`http://${host}:${port}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (res.ok) return host;
  } catch {
    // timeout or refused — expected for wrong hosts
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Scans all candidate hosts in parallel and returns the first one that responds.
 * For subnet prefixes (e.g. '192.168.1') it probes .1 through .15.
 */
async function discoverServerHost(port = DISCOVERY_PORT) {
  const candidates = [];

  for (const entry of DISCOVERY_CANDIDATES) {
    if (entry.split('.').length === 3) {
      // It's a subnet prefix — expand to .1 → .15
      for (let i = 1; i <= 15; i++) {
        candidates.push(`${entry}.${i}`);
      }
    } else {
      candidates.push(entry);
    }
  }

  // Race all probes — resolve with the winner, or null if all fail
  return new Promise((resolve) => {
    let settled = false;
    let pending = candidates.length;

    candidates.forEach((host) => {
      probeHost(host, port).then((result) => {
        pending--;
        if (result && !settled) {
          settled = true;
          resolve(result);
        } else if (pending === 0 && !settled) {
          resolve(null); // all failed
        }
      });
    });
  });
}

/**
 * useInference
 *
 * Manages the WebSocket lifecycle with automatic reconnection and IP rediscovery.
 *
 * @param {string} initialUrl  - The starting WebSocket URL (ws://host:port/ws/detect?user_id=X)
 * @param {string} userId      - User ID to append on reconnect after rediscovery
 */
export const useInference = (initialUrl, userId = '1') => {
  const [latestResult, setLatestResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting' | 'discovering' | 'failed'
  const [activeUrl, setActiveUrl] = useState(initialUrl);

  const wsRef          = useRef(null);
  const attemptRef     = useRef(0);        // reconnect attempt counter
  const reconnTimerRef = useRef(null);     // setTimeout handle
  const mountedRef     = useRef(true);     // guard against state updates after unmount
  const activeUrlRef   = useRef(initialUrl); // always holds latest URL for closures

  // Keep ref in sync with state
  useEffect(() => { activeUrlRef.current = activeUrl; }, [activeUrl]);

  const clearReconnTimer = () => {
    if (reconnTimerRef.current) {
      clearTimeout(reconnTimerRef.current);
      reconnTimerRef.current = null;
    }
  };

  /**
   * Extracts port, path and query from a ws:// URL so we can rebuild it
   * after discovering a new IP.
   */
  const parseWsUrl = (url) => {
    try {
      const match = url.match(/^ws:\/\/[^:]+:(\d+)(\/[^?]*)(\?.*)?$/);
      if (match) return { port: match[1], path: match[2], query: match[3] || '' };
    } catch {}
    return { port: DISCOVERY_PORT, path: '/ws/detect', query: `?user_id=${userId}` };
  };

  /**
   * Core: open a WebSocket to `url`, wire up handlers.
   * On disconnect, schedules scheduleReconnect().
   */
  const connect = useCallback((url) => {
    if (!mountedRef.current) return;

    // Tear down any existing socket first
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent double-scheduling
      wsRef.current.close();
      wsRef.current = null;
    }

    console.log(`[useInference] Connecting to ${url}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      console.log('[useInference] Connected');
      attemptRef.current = 0; // reset backoff on success
      setIsConnected(true);
      setConnectionStatus('connected');
      setActiveUrl(url);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        setLatestResult(JSON.parse(event.data));
      } catch (e) {
        console.error('[useInference] Parse error:', e);
      }
    };

    ws.onerror = (e) => {
      // onerror always fires before onclose — log only, let onclose handle retry
      console.warn('[useInference] WebSocket error:', e?.message ?? e);
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      console.warn(`[useInference] Disconnected (code=${event.code})`);
      setIsConnected(false);
      scheduleReconnect();
    };
  }, []); // stable reference

  /**
   * Schedules the next reconnect attempt with exponential backoff.
   * On every other attempt it runs IP rediscovery first in case the host changed.
   */
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    clearReconnTimer();

    const attempt = attemptRef.current;
    attemptRef.current += 1;
    const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];

    console.log(`[useInference] Reconnect attempt #${attempt + 1} in ${delay}ms`);
    setConnectionStatus('reconnecting');

    reconnTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      // Every 2nd attempt: rediscover the server IP in case it changed
      const shouldDiscover = attempt % 2 === 1;

      if (shouldDiscover) {
        setConnectionStatus('discovering');
        console.log('[useInference] Running IP rediscovery...');

        const { port, path, query } = parseWsUrl(activeUrlRef.current);
        const newHost = await discoverServerHost(port);

        if (!mountedRef.current) return;

        if (newHost) {
          const newUrl = `ws://${newHost}:${port}${path}${query}`;
          console.log(`[useInference] Discovered new host: ${newHost}`);
          connect(newUrl);
        } else {
          console.warn('[useInference] Discovery failed — retrying last known URL');
          connect(activeUrlRef.current);
        }
      } else {
        // Odd attempts: retry the last known URL immediately (fast path)
        connect(activeUrlRef.current);
      }
    }, delay);
  }, [connect]);

  // Initial connection on mount / when initialUrl prop changes
  useEffect(() => {
    mountedRef.current = true;
    attemptRef.current = 0;
    connect(initialUrl);

    return () => {
      mountedRef.current = false;
      clearReconnTimer();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [initialUrl]);

  const sendFrame = useCallback((blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(blob);
    }
  }, []);

  return {
    latestResult,
    isConnected,
    connectionStatus, // 'connecting' | 'connected' | 'reconnecting' | 'discovering' | 'failed'
    activeUrl,        // which URL is actually live right now
    sendFrame,
  };
};