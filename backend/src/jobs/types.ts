// jobs/types.ts
export type JobCategory = "daily" | "weekly" | "8days";

export interface CronJobDefinition {
  name: string;
  category: JobCategory;
  schedule: string;
  run: () => Promise<void>;
}
