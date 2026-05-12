const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const test = require("node:test");
const express = require("express");

// Uses the project's own development certs so the test reflects real server config
const certsDir = path.resolve(__dirname, "../certs");
const keyPath = path.join(certsDir, "server.key");
const certPath = path.join(certsDir, "server.crt");

// ─── helpers ────────────────────────────────────────────────────────────────

function startHttpsServer(app, port = 0) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  return new Promise((resolve, reject) => {
    const server = https.createServer(options, app);
    server.once("error", reject);
    server.listen(port, () => resolve({ server, port: server.address().port }));
  });
}

function startHttpServer(app, port = 0) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.once("error", reject);
    server.listen(port, () => resolve({ server, port: server.address().port }));
  });
}

function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

// rejectUnauthorized: false is intentional — the test cert is self-signed (mkcert dev cert).
// We are testing TLS connectivity and headers, not CA trust chain.
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { rejectUnauthorized: false }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () =>
        resolve({ statusCode: res.statusCode, headers: res.headers, body }),
      );
    });
    req.on("error", reject);
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.on("error", reject);
  });
}

// ─── fixtures ───────────────────────────────────────────────────────────────

function buildApp({ httpsEnabled = true, forceRedirect = false, httpsPort = null } = {}) {
  const app = express();

  if (forceRedirect && httpsPort) {
    app.use((req, res, next) => {
      if (req.secure) return next();
      res.redirect(301, `https://${req.hostname}:${httpsPort}${req.originalUrl}`);
    });
  }

  if (httpsEnabled) {
    app.use((req, res, next) => {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      next();
    });
  }

  app.get("/api/security/transport", (req, res) => {
    res.json({
      transport: httpsEnabled ? "HTTPS" : "HTTP",
      tlsEnabled: httpsEnabled,
      redirectToHttps: forceRedirect,
      hstsEnabled: httpsEnabled,
      requestSecure: req.secure,
    });
  });

  return app;
}

// ─── lifecycle ──────────────────────────────────────────────────────────────

let httpsServer, httpsPort;
let httpServer, httpPort;

test.before(async () => {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    throw new Error(
      `TLS certs not found at ${certsDir}. Run mkcert to generate them.`,
    );
  }

  ({ server: httpsServer, port: httpsPort } = await startHttpsServer(
    buildApp({ httpsEnabled: true, forceRedirect: true }),
  ));

  // HTTP server for redirect test — must know the HTTPS port first
  ({ server: httpServer, port: httpPort } = await startHttpServer(
    buildApp({ httpsEnabled: false, forceRedirect: true, httpsPort }),
  ));
});

test.after(async () => {
  await stopServer(httpsServer);
  await stopServer(httpServer);
});

// ─── tests ──────────────────────────────────────────────────────────────────

test("TLS: server accepts HTTPS connection (TLS handshake succeeds)", async () => {
  const { statusCode } = await httpsGet(
    `https://localhost:${httpsPort}/api/security/transport`,
  );
  assert.equal(statusCode, 200, "Expected 200 over HTTPS");
});

test("TLS: /api/security/transport reports HTTPS transport and tlsEnabled", async () => {
  const { body } = await httpsGet(
    `https://localhost:${httpsPort}/api/security/transport`,
  );
  const json = JSON.parse(body);
  assert.equal(json.transport, "HTTPS");
  assert.equal(json.tlsEnabled, true);
  assert.equal(json.hstsEnabled, true);
});

test("TLS: Strict-Transport-Security header present with correct directives", async () => {
  const { headers } = await httpsGet(
    `https://localhost:${httpsPort}/api/security/transport`,
  );
  const hsts = headers["strict-transport-security"];
  assert.ok(hsts, "Strict-Transport-Security header must be present for browser padlock");
  assert.match(hsts, /max-age=\d+/, "Must include max-age directive");
  assert.match(hsts, /includeSubDomains/, "Must include includeSubDomains directive");
  assert.ok(
    parseInt(hsts.match(/max-age=(\d+)/)?.[1] ?? "0", 10) >= 31536000,
    "max-age should be at least one year (31536000 seconds)",
  );
});

test("TLS: HTTP request is redirected to HTTPS with 301", async () => {
  const { statusCode, headers } = await httpGet(
    `http://localhost:${httpPort}/api/security/transport`,
  );
  assert.equal(statusCode, 301, "HTTP must redirect to HTTPS");
  assert.ok(
    headers.location?.startsWith("https://"),
    `Redirect location must use https://, got: ${headers.location}`,
  );
});
