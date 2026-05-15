// Register and declare all the jobs in this file
import { CreateEventNotificationJob } from "./handlers/CreateEventNotificationJob";
import { UpdateEnrollmentStatusJob } from "./handlers/UpdateEnrollmentStatusJob";
export const jobs = [CreateEventNotificationJob, UpdateEnrollmentStatusJob];
