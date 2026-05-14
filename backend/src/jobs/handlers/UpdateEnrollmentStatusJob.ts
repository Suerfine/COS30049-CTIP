import { Op } from "sequelize";
import { CronJobDefinition } from "../types";
import { Course, Enrollment, Event, Notification } from "../../models";
import getNewEnrollmentStatus from "../../utils/getNewEnrollmentStatus";
import sequelize from "../../config/Database";

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

    try {
      // For each enrollment, check if the status needs to be updated and update it accordingly
      for (const enrollment of enrollments) {
        const { status: newStatus } = await getNewEnrollmentStatus(enrollment);
        if (newStatus !== enrollment.status) {
          await enrollment.update({ status: newStatus }, { transaction });
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating enrollment statuses:", error);
    }
  },
};
