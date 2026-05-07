import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import { Enrollment } from "../models";

/**
 * Determines the new status of an enrollment based on various factors such as the
 * current date, course start and end dates, and any other relevant conditions.
 * Returns the new status that the enrollment should be updated to.
 * @param enrollment
 */
export async function updateUserCourseEnrollmentStatus(
  enrollment: Enrollment,
): Promise<EnrollmentStatus> {
  let newStatus = enrollment.status;
  // If the enrollment is already completed, we can check if the completion date has expired and update the status to expired if necessary
  if (newStatus === EnrollmentStatus.COMPLETED) {
    if (enrollment.badge_expire_at && enrollment.badge_expire_at < new Date()) {
      newStatus = EnrollmentStatus.EXPIRED;
    }
  }
  return newStatus;
}
