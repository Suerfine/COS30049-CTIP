import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/src/tests/**/*.test.ts",
    "**/tests/**/*.test.ts",
  ],
};

export default config;
