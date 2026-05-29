import { Op } from "sequelize";
import { CronJobDefinition } from "../types";
import { Course, Enrollment, Event, Notification } from "../../models";
import getNewEnrollmentStatus from "../../utils/getNewEnrollmentStatus";
import sequelize from "../../config/Database";
import { EnrollmentStatus } from "../../enum/EnrollmentStatus";
import { sendNotification } from "../../utils/sendNotification";
import { NotificationCategory } from "../../enum/NotificationCategory";
import { logger } from "../../utils/logger";

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
    const transaction = await sequelize.transaction();
    let statusTransitionCounts: Record<string, number> = {};

    try {
      // For each enrollment, check if the status needs to be updated and update it accordingly
      for (const enrollment of enrollments) {
        const { status: newStatus } = await getNewEnrollmentStatus(enrollment);
        if (newStatus === enrollment.status) {
          continue;
        }

        // Count the status transition for logging
        const transitionKey = `${enrollment.status} -> ${newStatus}`;
        statusTransitionCounts[transitionKey] =
          (statusTransitionCounts[transitionKey] || 0) + 1;

        // Create notifications depending on the new state of the enrollment.
        switch (newStatus) {
          case EnrollmentStatus.EXPIRED:
            const course = await Course.findByPk(enrollment.course_id);
            await sendNotification(
              "single",
              "Enrollment expired",
              `Your badge for ${course?.title} has expired.`,
              transaction,
              enrollment.user_id,
              true,
              NotificationCategory.COURSE_EXPIRY,
            );
        }
        await enrollment.update({ status: newStatus }, { transaction });
        logger.info(
          `Enrollment ${enrollment.id} status updated to ${newStatus}`,
        ); // Log the enrollment status update
      }
      // Log the summary of status transitions
      for (const [transition, count] of Object.entries(
        statusTransitionCounts,
      )) {
        logger.info(`Status transition ${transition}: ${count} enrollments`);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error("Error updating enrollment statuses:", error);
    }
  },
};
