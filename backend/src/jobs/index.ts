// jobs/index.ts
import cron from "node-cron";
import { jobs } from "./registry";

const category = process.argv[2];

export function registerJobs(): void {
  for (const job of jobs) {
    cron.schedule(job.schedule, async () => {
      console.log(`[JOB START] ${job.name}`);

      try {
        await job.run();
        console.log(`[JOB SUCCESS] ${job.name}`);
      } catch (err) {
        console.error(`[JOB FAILED] ${job.name}`, err);
      }
    });

    console.log(`Registered ${job.name}`);
  }
}

// Run the registerJobs function if this file is executed directly
if (require.main === module) {
  registerJobs();
}
