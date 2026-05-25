#!/usr/bin/env node
/**
 * Helper script to run tsnode vs compiled scripts based on NODE_ENV.
 */

const { spawnSync } = require("child_process");

const scriptName = process.argv[2];
const forwardedArgs = process.argv.slice(3);
const isProduction = ["production", "prod"].includes(
  (process.env.NODE_ENV || "").toLowerCase(),
);

const productionTargets = {
  "seed:dev": "seed:prod",
  "seed:staging": "seed:staging:prod",
  jobs: "jobs:prod",
  "jobs:run": "jobs:run:prod",
  zawarudo: "zawarudo:prod",
  "mailer:run": "mailer:run:prod",
};

const developmentCommands = {
  "seed:dev": ["ts-node", ["database/seeders/DevelopmentSeeder.ts"]],
  "seed:staging": ["ts-node", ["database/seeders/DevelopmentSeeder.ts"]],
  jobs: ["ts-node", ["src/jobs/index.ts"]],
  "jobs:run": ["ts-node", ["src/jobs/run.ts"]],
  zawarudo: ["ts-node", ["tests/helper/offsetDatabaseTime.ts"]],
  "mailer:run": ["ts-node", ["src/services/mailer/runner.ts"]],
};

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  process.exit(result.status ?? 1);
}

if (!scriptName) {
  console.error("Usage: node scripts/run-script-by-env.js <script-name>");
  process.exit(1);
}

if (isProduction) {
  const productionScript = productionTargets[scriptName];
  if (!productionScript) {
    console.error(`No production target configured for ${scriptName}`);
    process.exit(1);
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  run(npmCommand, ["run", productionScript, "--", ...forwardedArgs]);
}

const developmentCommand = developmentCommands[scriptName];
if (!developmentCommand) {
  console.error(`No development command configured for ${scriptName}`);
  process.exit(1);
}

run(developmentCommand[0], [...developmentCommand[1], ...forwardedArgs]);
