import { afterAll, afterEach, beforeAll, jest } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hashPassword } from "../src/utils/password";

const testStorageDir = path.join(os.tmpdir(), "cos30049-ctip-tests");
const testStoragePath = path.join(testStorageDir, `jest-${process.pid}.sqlite`);
let fileStoragePath: string;

fs.mkdirSync(testStorageDir, { recursive: true });
if (fs.existsSync(testStoragePath)) {
  fs.unlinkSync(testStoragePath);
}

process.env.NODE_ENV = "test";
process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = testStoragePath;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";
process.env.SHOULD_INSTRUMENT_ROUTES = "false";

fileStoragePath = path.resolve(process.cwd(), "storage", "test");
fs.rmSync(fileStoragePath, { recursive: true, force: true });
fs.mkdirSync(fileStoragePath, { recursive: true });

const sequelize = require("../src/config/Database").default;
require("../src/models");

jest.setTimeout(30000);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  for (const model of Object.values(sequelize.models) as any[]) {
    await model.destroy({
      where: {},
      truncate: true,
      force: true,
    });
  }

  fs.rmSync(fileStoragePath, { recursive: true, force: true });
  fs.mkdirSync(fileStoragePath, { recursive: true });
});

afterAll(async () => {
  await sequelize.close();
  if (fs.existsSync(testStoragePath)) {
    fs.unlinkSync(testStoragePath);
  }

  fs.rmSync(fileStoragePath, { recursive: true, force: true });
});
