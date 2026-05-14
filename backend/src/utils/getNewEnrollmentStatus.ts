import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import { PaymentStatus } from "../enum/PaymentStatus";
import {
  Course,
  Element,
  Enrollment,
  Module,
  Page,
  Submission,
  Payment,
} from "../models";

/**
 * Reades the current enrollment and its asociated models to determine the new enrollment status.
 */
async function getNewEnrollmentStatus(
  enrollment: Enrollment,
): Promise<{ status: EnrollmentStatus; message: string }> {
  let newStatus: EnrollmentStatus = enrollment.status;
  let message = "Enrollment status not updated.";
  switch (enrollment.status) {
    case EnrollmentStatus.PENDING_PAYMENT:
      // Check if the enrollment has a successful payment. If it does, update the enrollment status to applied.
      const payment = await Payment.findOne({
        where: { enrollment_id: enrollment.id, status: PaymentStatus.PAID },
      });
      if (payment) {
        newStatus = EnrollmentStatus.APPLIED;
        message = "Payment successful. Enrollment status updated to applied.";
      }
      break;
    case EnrollmentStatus.APPLIED:
    // In this state user has paid but waiting for admin to approve their registration
    case EnrollmentStatus.IN_PROGRESS:
      // Get the course and its modules to check if all modules have been completed.
      const course = await Course.findByPk(enrollment.course_id);
      if (!course) {
        throw new Error("Course not found");
      }
      const modules = await Module.findAll({
        where: { course_id: enrollment.course_id },
      });
      for (const module of modules) {
        const pages = await Page.findAll({ where: { module_id: module.id } });
        for (const page of pages) {
          let pageScore = 0;
          const elements = await Element.findAll({
            where: { page_id: page.id },
          });
          for (const element of elements) {
            // Skip elements that have no score check
            if (element.score === null) continue;

            // Get the latest submission for the element and check if it has been completed.
            const submission = await Submission.findOne({
              where: { enrollment_id: enrollment.id, element_id: element.id },
              order: [["created_at", "DESC"]],
            });

            // If there is no submission for the element, the course is still in progress.
            if (!submission) {
              // Check if it has limit the mximum number of weeks to complete the course. If it has, the enrollment has failed. If not, the enrollment is still in progress.
              if (
                course.must_complete_in_weeks &&
                enrollment.enrolled_at &&
                new Date(
                  enrollment.enrolled_at.getTime() +
                    course.must_complete_in_weeks * 7 * 24 * 60 * 60 * 1000,
                ) < new Date()
              ) {
                return {
                  status: EnrollmentStatus.FAILED,
                  message:
                    "Not all elements have been completed but the course completion deadline has passed.",
                };
              }
              return {
                status: EnrollmentStatus.IN_PROGRESS,
                message: "Course is still in progress.",
              };
            }

            // If there was a submission add its score to the page score.
            pageScore += submission.earned_grade;
          }

          // If the page score is greater than the total score for the page, continue to check the next page.
          if (pageScore > page.passing_score) continue;

          // Since, the page score is less than the total score for the page check if it has hit max weeks.
          if (
            course.must_complete_in_weeks &&
            enrollment.enrolled_at &&
            new Date(
              enrollment.enrolled_at.getTime() +
                course.must_complete_in_weeks * 7 * 24 * 60 * 60 * 1000,
            ) < new Date()
          ) {
            return {
              status: EnrollmentStatus.FAILED,
              message:
                "Not all elements have been completed but the course completion deadline has passed.",
            };
          }

          // Also check if max attempts have been reached for the page (if applicable).
          if (page.max_tries) {
            const attempts = await Submission.count({
              where: {
                enrollment_id: enrollment.id,
                element_id: elements.map((e) => e.id),
              },
            });
            if (attempts >= page.max_tries) {
              return {
                status: EnrollmentStatus.FAILED,
                message: `Maximum number of attempts for page ${page.title} has been reached.`,
              };
            }
          }
        }
      }

      // At this point all modules have been completed, so the enrollment is now ready to be reviewed by admin.
      newStatus = EnrollmentStatus.IN_REVIEW;
      break;
    case EnrollmentStatus.COMPLETED:
      // If the course enrollment has been completed. Check if the badge has expired.
      if (
        enrollment.badge_expire_at &&
        enrollment.badge_expire_at < new Date()
      ) {
        newStatus = EnrollmentStatus.EXPIRED;
      }
      break;
    default:
      newStatus = enrollment.status;
  }
  return {
    status: newStatus,
    message: "Enrollment status updated successfully.",
  };
}
export default getNewEnrollmentStatus;
