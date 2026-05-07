// jobs/run.ts
import { jobs } from "./registry";

async function main() {
  const jobName = process.argv[2];

  if (!jobName) {
    console.error("Missing job name");
    process.exit(1);
  }

  // Special case to list all jobs
  if (jobName === "--list") {
    console.table(
      jobs.map((j) => ({
        name: j.name,
        category: j.category,
        schedule: j.schedule,
      })),
    );

    process.exit(0);
  }

  const job = jobs.find((j) => j.name === jobName);
  if (!job) {
    console.error(`Job not found: ${jobName}`);
    process.exit(1);
  }

  console.log(`Running ${job.name}...`);

  try {
    await job.run();

    console.log(`Completed ${job.name}`);
  } catch (err) {
    console.error(`Failed ${job.name}`, err);
  }
}

main();
