import { Op } from "sequelize";
import { CronJobDefinition } from "../types";
import { Event, Notification } from "../../models";

export const _exampleJob: CronJobDefinition = {
  name: "EXAMPLE-JOB",
  category: "daily",
  schedule: "0 8 * * *", // Format: minute hour day month dayOfWeek
  run: async () => {
    // Implementation for the job's task
  },
};
