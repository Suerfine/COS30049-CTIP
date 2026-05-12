import { afterAll, afterEach, beforeAll } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hashPassword } from "../src/utils/password";

const testStorageDir = path.join(os.tmpdir(), "cos30049-ctip-tests");
const testStoragePath = path.join(testStorageDir, `jest-${process.pid}.sqlite`);

fs.mkdirSync(testStorageDir, { recursive: true });
if (fs.existsSync(testStoragePath)) {
  fs.unlinkSync(testStoragePath);
}

process.env.NODE_ENV = "test";
process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = testStoragePath;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";

const sequelize = require("../src/config/Database").default;
require("../src/models");

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
});

afterAll(async () => {
  await sequelize.close();
  if (fs.existsSync(testStoragePath)) {
    fs.unlinkSync(testStoragePath);
  }
});
