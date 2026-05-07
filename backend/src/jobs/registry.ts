// Register and declare all the jobs in this file
import { CreateEventNotificationJob } from "./handlers/createEventNotificationJob";
import { UpdateEnrollmentStatusJob } from "./handlers/UpdateEnrollmentStatusJob";
export const jobs = [CreateEventNotificationJob, UpdateEnrollmentStatusJob];
