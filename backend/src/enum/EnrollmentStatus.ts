export enum EnrollmentStatus {
  IN_PROGRESS = "in_progress",
  // The park guide is still doing the course.

  IN_REVIEW = "in_review",
  // The park guide has completed the course and is waiting for admin to give approval.

  COMPLETED = "completed",
  // The park guide has completed the course and has been approved by admin with badge.

  FAILED = "failed",
  //The park guide was either unable to complete the course or failed the assessment and needs to retake the course.

  DROPPED = "dropped",
  // Park guide dropped the course midway.

  EXPIRED = "expired",
  // The park guide has completed the course but badge expired
}
