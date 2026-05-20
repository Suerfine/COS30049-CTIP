/**
 * AI Server Configuration
 * 
 * This file contains the configuration for connecting to the ParkGuard AI inference server.
 * Update these values with your development environment settings.
 */

// Resolved from env so the LAN-setup script can point these at the host laptop's
// current WiFi IP without editing source. Falls back to the API host (the AI
// server runs on the same machine as the backend in dev).
export const AI_SERVER_CONFIG = {
  HOST:
    process.env.EXPO_PUBLIC_AI_HOST ||
    process.env.EXPO_PUBLIC_API_HOST ||
    '192.168.1.100',
  PORT: Number(process.env.EXPO_PUBLIC_AI_PORT) || 8000,
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
