#!/usr/bin/env node
const os = require("os");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function getLocalPrivateIPv4() {
  const nets = os.networkInterfaces();
  // Prefer common private ranges
  const isPrivate = (ip) =>
    /^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal && isPrivate(net.address)) {
        return net.address;
      }
    }
  }

  // Fallback to first non-internal IPv4
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "127.0.0.1";
}

function main() {
  const ip = getLocalPrivateIPv4();
  const certDir = path.join(__dirname, "..", "certs");
  fs.mkdirSync(certDir, { recursive: true });

  const certFile = path.join(certDir, "cert.pem");
  const keyFile = path.join(certDir, "key.pem");

  console.log(`Using IP: ${ip}`);
  console.log(`Writing cert -> ${certFile}`);
  console.log(`Writing key  -> ${keyFile}`);

  const args = [
    "-cert-file",
    certFile,
    "-key-file",
    keyFile,
    ip,
    "localhost",
    "127.0.0.1",
  ];

  const res = spawnSync("mkcert", args, { stdio: "inherit" });
  if (res.error) {
    console.error("Failed to run mkcert:", res.error);
    process.exit(1);
  }

  if (res.status !== 0) {
    process.exit(res.status);
  }

  console.log("mkcert completed successfully.");
}

if (require.main === module) {
  main();
}
