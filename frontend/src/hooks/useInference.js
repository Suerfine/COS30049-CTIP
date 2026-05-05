import { useState, useEffect, useRef } from 'react';

export const useInference = (serverUrl) => {
  const [latestResult, setLatestResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket
    wsRef.current = new WebSocket(serverUrl);

    wsRef.current.onopen = () => setIsConnected(true);
    wsRef.current.onclose = () => setIsConnected(false);
    
    // Listen for the JSON results from the Python server
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLatestResult(data);
      } catch (e) {
        console.error("Failed to parse server response", e);
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [serverUrl]);

  // Function to send the image blob to the server
  const sendFrame = (blob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(blob);
    }
  };

  return { latestResult, isConnected, sendFrame };
};