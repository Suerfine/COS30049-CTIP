import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

const certsDir = path.resolve(__dirname, "../../certs");
const defaultKeyPath = path.join(certsDir, "server.key");
const defaultCertPath = path.join(certsDir, "server.crt");

function resolveCertificateFiles() {
  if (fs.existsSync(defaultKeyPath) && fs.existsSync(defaultCertPath)) {
    return {
      keyPath: defaultKeyPath,
      certPath: defaultCertPath,
    };
  }

  if (!fs.existsSync(certsDir)) {
    return null;
  }

  const keyFile = fs
    .readdirSync(certsDir)
    .find((file) => file.endsWith("-key.pem"));

  if (!keyFile) {
    return null;
  }

  const certFile = keyFile.replace(/-key\.pem$/, ".pem");
  const keyPath = path.join(certsDir, keyFile);
  const certPath = path.join(certsDir, certFile);

  if (!fs.existsSync(certPath)) {
    return null;
  }

  return { keyPath, certPath };
}

const certificateFiles = resolveCertificateFiles();
const certFilesAvailable = Boolean(certificateFiles);
const keyPath = certificateFiles?.keyPath ?? defaultKeyPath;
const certPath = certificateFiles?.certPath ?? defaultCertPath;

function startHttpsServer(app: express.Application, port = 0) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  return new Promise<{ server: https.Server; port: number }>(
    (resolve, reject) => {
      const server = https.createServer(options, app);
      server.once("error", reject);
      server.listen(port, () => {
        const address = server.address();
        resolve({
          server,
          port: typeof address === "object" ? (address?.port ?? 0) : 0,
        });
      });
    },
  );
}

function startHttpServer(app: express.Application, port = 0) {
  return new Promise<{ server: http.Server; port: number }>(
    (resolve, reject) => {
      const server = http.createServer(app);
      server.once("error", reject);
      server.listen(port, () => {
        const address = server.address();
        resolve({
          server,
          port: typeof address === "object" ? (address?.port ?? 0) : 0,
        });
      });
    },
  );
}

function stopServer(server: http.Server | https.Server) {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}

function httpsGet(url: string) {
  return new Promise<{
    statusCode?: number;
    headers: http.IncomingHttpHeaders;
    body: string;
  }>((resolve, reject) => {
    const req = https.get(url, { rejectUnauthorized: false }, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });
    req.on("error", reject);
  });
}

function httpGet(url: string) {
  return new Promise<{
    statusCode?: number;
    headers: http.IncomingHttpHeaders;
  }>((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.on("error", reject);
  });
}

function buildApp({
  httpsEnabled = true,
  forceRedirect = false,
  httpsPort = null,
}: {
  httpsEnabled?: boolean;
  forceRedirect?: boolean;
  httpsPort?: number | null;
} = {}) {
  const app = express();

  if (forceRedirect && httpsPort) {
    app.use((req, res, next) => {
      if (req.secure) {
        next();
        return;
      }
      res.redirect(
        301,
        `https://${req.hostname}:${httpsPort}${req.originalUrl}`,
      );
    });
  }

  if (httpsEnabled) {
    app.use((req, res, next) => {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
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

const describeTls = certFilesAvailable ? describe : describe.skip;

describeTls("TLS certificate integration", () => {
  let httpsServer: https.Server;
  let httpsPort: number;
  let httpServer: http.Server;
  let httpPort: number;

  beforeAll(async () => {
    ({ server: httpsServer, port: httpsPort } = await startHttpsServer(
      buildApp({ httpsEnabled: true, forceRedirect: true }),
    ));

    ({ server: httpServer, port: httpPort } = await startHttpServer(
      buildApp({ httpsEnabled: false, forceRedirect: true, httpsPort }),
    ));
  });

  afterAll(async () => {
    if (httpsServer) {
      await stopServer(httpsServer);
    }
    if (httpServer) {
      await stopServer(httpServer);
    }
  });

  it("accepts HTTPS connections", async () => {
    const { statusCode } = await httpsGet(
      `https://localhost:${httpsPort}/api/security/transport`,
    );
    expect(statusCode).toBe(200);
  });

  it("reports HTTPS transport and tlsEnabled", async () => {
    const { body } = await httpsGet(
      `https://localhost:${httpsPort}/api/security/transport`,
    );
    const json = JSON.parse(body);

    expect(json.transport).toBe("HTTPS");
    expect(json.tlsEnabled).toBe(true);
    expect(json.hstsEnabled).toBe(true);
  });

  it("returns Strict-Transport-Security with expected directives", async () => {
    const { headers } = await httpsGet(
      `https://localhost:${httpsPort}/api/security/transport`,
    );
    const hsts = headers["strict-transport-security"];

    expect(hsts).toBeTruthy();
    expect(hsts).toMatch(/max-age=\d+/);
    expect(hsts).toMatch(/includeSubDomains/);

    const maxAge = parseInt(
      String(hsts).match(/max-age=(\d+)/)?.[1] ?? "0",
      10,
    );
    expect(maxAge).toBeGreaterThanOrEqual(31536000);
  });

  it("redirects HTTP requests to HTTPS", async () => {
    const { statusCode, headers } = await httpGet(
      `http://localhost:${httpPort}/api/security/transport`,
    );

    expect(statusCode).toBe(301);
    expect(String(headers.location).startsWith("https://")).toBe(true);
  });
});
