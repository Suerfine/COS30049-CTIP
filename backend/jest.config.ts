export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/src/tests/**/*.test.ts",
    "**/test/**/*.test.js",
  ],
};
