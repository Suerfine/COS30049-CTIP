// Unified HTTPS dev proxy on port 8443.
//
// Why this exists:
//   When devices on the LAN load the web app from https://<host>:8443 (Metro)
//   and the bundled JS then tries to fetch https://<host>:5000/api/... the
//   browser silently blocks the cross-origin request, because it has only
//   trusted the mkcert cert for port 8443 (one click-through per origin).
//
//   Routing /api/* through the same 8443 origin keeps everything single-origin:
//   one cert prompt, no cross-origin headaches.
//
//   /api/*  -> backend (5000)
//   /*      -> Metro web bundler (8081)
//   Upgrades for both are forwarded so Metro HMR keeps working.

const fs = require('fs');
const path = require('path');
const https = require('https');
const httpProxy = require('http-proxy');

const backendDir = path.resolve(__dirname, '../../backend');
const backendEnv = path.join(backendDir, '.env');

if (!fs.existsSync(backendEnv)) {
  console.error('ERROR: backend/.env not found. Copy backend/.env.example first.');
  process.exit(1);
}

require('dotenv').config({ path: backendEnv });
const frontendEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(frontendEnv)) {
  require('dotenv').config({ path: frontendEnv });
}

function parseBooleanFlag(value) {
  if (!value) return false;
  return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
}

if (!parseBooleanFlag(process.env.HTTPS_ENABLED)) {
  console.warn('HTTPS_ENABLED is not true in backend/.env - proxy not started.');
  process.exit(0);
}

function stripQuotes(s) {
  return s ? s.trim().replace(/^"|"$/g, '') : s;
}

const certPath = path.resolve(backendDir, stripQuotes(process.env.HTTPS_CERT_PATH));
const keyPath  = path.resolve(backendDir, stripQuotes(process.env.HTTPS_KEY_PATH));

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('ERROR: Certificate files not found:');
  console.error('  cert:', certPath);
  console.error('  key: ', keyPath);
  console.error('Run scripts/lan-setup.ps1 to regenerate them for your current LAN IP.');
  process.exit(1);
}

const PROXY_PORT     = Number(process.env.HTTPS_PROXY_PORT) || 8443;
const METRO_TARGET   = `http://localhost:${process.env.METRO_PORT || 8081}`;
const BACKEND_PORT   = Number(process.env.PORT) || 5000;
const BACKEND_TARGET = parseBooleanFlag(process.env.HTTPS_ENABLED)
  ? `https://localhost:${BACKEND_PORT}`
  : `http://localhost:${BACKEND_PORT}`;

const apiProxy = httpProxy.createProxyServer({
  target: BACKEND_TARGET,
  secure: false,        // backend cert is for the LAN IP, not "localhost"
  changeOrigin: true,
  ws: true,
});

const webProxy = httpProxy.createProxyServer({
  target: METRO_TARGET,
  ws: true,
});

function logProxyError(label) {
  return (err, req, res) => {
    console.error(`[${label} proxy error]`, err.message);
    if (res && typeof res.writeHead === 'function' && !res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Bad gateway (${label})`);
    }
  };
}
apiProxy.on('error', logProxyError('api'));
webProxy.on('error', logProxyError('metro'));

const server = https.createServer(
  {
    cert: fs.readFileSync(certPath),
    key:  fs.readFileSync(keyPath),
  },
  (req, res) => {
    if (req.url.startsWith('/api')) {
      apiProxy.web(req, res);
    } else {
      webProxy.web(req, res);
    }
  },
);

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/api')) {
    apiProxy.ws(req, socket, head);
  } else {
    webProxy.ws(req, socket, head);
  }
});

const lanIp = process.env.LAN_IP || process.env.EXPO_PUBLIC_API_HOST || '<host-ip>';

server.listen(PROXY_PORT, () => {
  console.log(`Unified HTTPS proxy on https://${lanIp}:${PROXY_PORT}`);
  console.log(`  /api/*  -> ${BACKEND_TARGET}`);
  console.log(`  /*      -> ${METRO_TARGET}`);
});
