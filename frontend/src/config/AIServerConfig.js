/**
 * AI Server Configuration
 * 
 * This file contains the configuration for connecting to the ParkGuard AI inference server.
 * Update these values with your development environment settings.
 */

export const AI_SERVER_CONFIG = {
  // IP address of your development machine running the AI server
  // Find your IP: Open PowerShell and run `ipconfig`
  // Look for "IPv4 Address" on your WiFi adapter (e.g., 192.168.1.100)
  HOST: '192.168.1.100',
  
  // Port where the FastAPI server is running (default: 8000)
  PORT: 8000,
  
  // Default user ID for compliance event logging
  // This can be overridden at runtime or per-session
  DEFAULT_USER_ID: 1,
};

/**
 * Constructs a WebSocket URL for the AI inference endpoint
 * @param {string} host - Server host/IP address
 * @param {number} port - Server port
 * @param {number} userId - User ID for compliance tracking
 * @returns {string} WebSocket URL
 */
export const buildAIServerURL = (host, port, userId) => {
  return `ws://${host}:${port}/ws/detect?user_id=${userId}`;
};

/**
 * Constructs an HTTP URL for REST API calls to the AI server
 * @param {string} host - Server host/IP address
 * @param {number} port - Server port
 * @param {string} endpoint - API endpoint (e.g., '/health')
 * @returns {string} HTTP URL
 */
export const buildAIServerHTTPURL = (host, port, endpoint) => {
  return `http://${host}:${port}${endpoint}`;
};
