export enum EnrollmentStatus {
  // The park guide has applied for the course but has yet for admin to approve the enrollment.
  APPLIED = "applied",

  // The park guide has been approved by admin and is currently taking the course.
  IN_PROGRESS = "in_progress",

  // The park guide has completed the course and is waiting for admin to review the completion.
  IN_REVIEW = "in_review",

  // The park guide has completed the course and is waiting for admin to review the completion.
  COMPLETED = "completed",

  // The park guide was either unable to complete the course or failed the assessment and needs to retake the course.
  FAILED = "failed",

  // The park guide has dropped the course midway.
  DROPPED = "dropped",

  // The admin has rejected the park guide's application to enroll in the course.
  REJECTED = "rejected",

  // The park guide has completed the course but badge expired
  EXPIRED = "expired",
}
