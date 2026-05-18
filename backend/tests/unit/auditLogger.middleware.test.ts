import { EventEmitter } from "node:events";
import { describe, expect, it } from "@jest/globals";
import { auditLogger } from "../../src/middelware/AuditLogger";
import { AuditLog, User } from "../../src/models";
import { UserRoles } from "../../src/enum/UserRoles";

class MockResponse extends EventEmitter {
  statusCode = 200;
  private headers: Record<string, string> = {};
  body: unknown;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  get(headerName: string) {
    return this.headers[String(headerName).toLowerCase()];
  }

  set(headerName: string, value: string) {
    this.headers[String(headerName).toLowerCase()] = value;
    return this;
  }

  json(payload: unknown) {
    this.body = payload;
    return this;
  }

  send(payload: unknown) {
    this.body = payload;
    return this;
  }
}

async function createUser() {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return User.create({
    username: `audit-user-${unique}`,
    firstname: "Audit",
    lastname: "Tester",
    identification: `A-${unique}`,
    personal_email: `audit-${unique}@example.com`,
    tel: "0100000000",
    role: UserRoles.ADMIN,
    password_hash: "hash",
    last_login_at: null,
  });
}

function waitForAuditWrite() {
  return new Promise((resolve) => {
    setTimeout(resolve, 25);
  });
}

describe("auditLogger middleware", () => {
  it("includes expected audit_logs columns", async () => {
    const requiredColumns = [
      "id",
      "user_id",
      "event_type",
      "action",
      "resource_type",
      "resource_id",
      "method",
      "path",
      "status_code",
      "ip_address",
      "user_agent",
      "request_data",
      "response_data",
      "created_at",
      "updated_at",
    ];

    const columns = Object.keys((AuditLog as any).rawAttributes);
    for (const column of requiredColumns) {
      expect(columns).toContain(column);
    }
  });

  it("writes an audit row for a request lifecycle", async () => {
    const user = await createUser();
    const req = {
      method: "GET",
      path: "/users/me",
      originalUrl: "/api/users/me",
      params: {},
      query: {},
      body: {},
      user,
      ip: "127.0.0.1",
      headers: {},
      get: (name: string) => {
        if (String(name).toLowerCase() === "user-agent") {
          return "audit-test-agent";
        }
        return undefined;
      },
    } as any;

    const res = new MockResponse() as any;

    await new Promise<void>((resolve, reject) => {
      auditLogger(req, res, (err?: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    res.status(200).json({ message: "ok" });
    res.emit("finish");

    await waitForAuditWrite();

    const log = await AuditLog.findOne({ order: [["id", "DESC"]] });
    expect(log).not.toBeNull();
    expect(log?.user_id).toBe(user.id);
    expect(log?.action).toBe("READ");
    expect(log?.method).toBe("GET");
    expect(log?.path).toBe("/api/users/me");
    expect(log?.status_code).toBe(200);
    expect(log?.event_type).toBe("SENSITIVE_DATA_READ");
  });

  it("sanitizes sensitive request and response fields", async () => {
    const user = await createUser();
    const req = {
      method: "POST",
      path: "/reset-password",
      originalUrl: "/api/reset-password",
      params: {},
      query: {},
      body: {
        email: "private@example.com",
        password: "PlainText123!",
        tel: "0123456789",
        token: "raw-reset-token",
        note: "safe-field",
      },
      user,
      ip: "127.0.0.1",
      headers: {},
      get: (name: string) => {
        if (String(name).toLowerCase() === "user-agent") {
          return "audit-test-agent";
        }
        return undefined;
      },
    } as any;

    const res = new MockResponse() as any;

    await new Promise<void>((resolve, reject) => {
      auditLogger(req, res, (err?: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    res.status(200).json({
      message: "Password reset successfully",
      token: "response-token",
      email: "private@example.com",
    });
    res.emit("finish");

    await waitForAuditWrite();

    const log = await AuditLog.findOne({ order: [["id", "DESC"]] });
    expect(log).not.toBeNull();
    expect(log?.event_type).toBe("PASSWORD_RESET_COMPLETE");
    expect(log?.action).toBe("CREATE");

    const requestBody = (log?.request_data as any)?.body;
    const responseData = log?.response_data as any;

    expect(requestBody.note).toBe("safe-field");
    expect(requestBody.password).toBe("***REDACTED***");
    expect(requestBody.token).toBe("***REDACTED***");
    expect(requestBody.tel).toBe("***6789");
    expect(requestBody.email).toBe("pr***@example.com");

    expect(responseData.token).toBe("***REDACTED***");
    expect(responseData.email).toBe("pr***@example.com");
  });
});
