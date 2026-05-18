const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '../../backend');
const envPath = path.join(backendDir, '.env');

if (!fs.existsSync(envPath)) {
  console.error('ERROR: backend/.env not found.');
  console.error('Copy backend/.env.example to backend/.env and configure it.');
  process.exit(1);
}

require('dotenv').config({ path: envPath });

function parseBooleanFlag(value) {
  if (!value) return false;
  return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
}

if (!parseBooleanFlag(process.env.HTTPS_ENABLED)) {
  console.warn('HTTPS_ENABLED is not true in backend/.env — proxy not started.');
  process.exit(0);
}

const certPath = path.resolve(backendDir, process.env.HTTPS_CERT_PATH.trim());
const keyPath = path.resolve(backendDir, process.env.HTTPS_KEY_PATH.trim());

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('ERROR: Certificate files not found:');
  console.error('  cert:', certPath);
  console.error('  key: ', keyPath);
  console.error('Run mkcert to generate them — see backend/README.md for instructions.');
  process.exit(1);
}

console.log('Starting HTTPS proxy: https://localhost:8443 -> http://localhost:8081');

const proxy = spawn(
  'npx',
  ['local-ssl-proxy', '--source', '8443', '--target', '8081', '--cert', certPath, '--key', keyPath],
  { stdio: 'inherit', shell: true }
);

proxy.on('close', (code) => process.exit(code));
