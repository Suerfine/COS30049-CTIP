import { Op } from "sequelize";
import { CronJobDefinition } from "../types";
import { Course, Enrollment, Event, Notification } from "../../models";
import { updateUserCourseEnrollmentStatus } from "../../utils/updateUserCourseEnrollmentStatus";

/**
 * This job runs daily 00:00 to check for any enrollment status updates for
 * users and sends notifications if necessary.
 */
export const UpdateEnrollmentStatusJob: CronJobDefinition = {
  name: "update-enrollment-status",
  category: "daily",
  schedule: "0 0 * * *",
  run: async () => {
    // NOTE: This retrieval retrieves all. Consider implemeting a logic to only retrieve enrollments that are due for status updates.
    const enrollments = await Enrollment.findAll();

    // For each enrollment, check if the status needs to be updated and update it accordingly
    for (const enrollment of enrollments) {
      const newStatus = await updateUserCourseEnrollmentStatus(enrollment);
      if (newStatus !== enrollment.status) {
        await enrollment.update({ status: newStatus });
        const courseTitle = await Course.findByPk(enrollment.course_id).then(
          (course) => course?.title,
        );
        Notification.create({
          user_id: enrollment.user_id,
          title: "Course Status Update",
          message: `Your enrollment for course "${courseTitle}" has been updated to ${newStatus}.`,
        });
      }
    }
  },
};
