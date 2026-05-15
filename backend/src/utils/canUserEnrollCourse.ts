import { Op } from "sequelize";
import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import {
  Course,
  Enrollment,
  Prerequisite,
  PrerequisiteGroup,
  User,
} from "../models";

/**
 * Utility function to check if a user can enroll in a course based on their
 * enrollment history and course prerequisites.
 *
 * It firsct checks if the user has a previous enrollment for the course. If
 * they do, it only allows them to enroll again if their latest enrollment is
 * in a final state (expired, dropped, failed, rejected). After that, it makes
 * the prerequisite checks to make sure that the user has completed the
 * necessary courses to enroll in the course.
 * @param user
 * @param course
 * @returns
 */
export async function canUserEnrollCourse(
  user: User,
  course: Course,
): Promise<boolean> {
  // Get the latest enrollment of the user for this course
  const enrollment = await Enrollment.findOne({
    where: {
      user_id: user.id,
      course_id: course.id,
    },
    order: [["created_at", "DESC"]],
  });

  // Check if the user has previous enrollment. If they have only let them reenroll if their latest enrollment is in a final state (expired, dropped, failed, rejected)
  if (
    enrollment &&
    ![
      EnrollmentStatus.EXPIRED,
      EnrollmentStatus.DROPPED,
      EnrollmentStatus.FAILED,
      EnrollmentStatus.REJECTED,
    ].includes(enrollment.status)
  ) {
    return false;
  }

  // Get Prerequisites for the course
  const prerequisiteGroups = await PrerequisiteGroup.findAll({
    where: {
      course_id: course.id,
    },
  });

  for (const prerequisiteGroup of prerequisiteGroups) {
    // Get all prerequisites in the group
    const prerequisites = await Prerequisite.findAll({
      where: {
        prerequisite_group_id: prerequisiteGroup.id,
      },
    });
    const prerequisiteCourseIds = prerequisites.map(
      (prerequisite) => prerequisite.course_id,
    );

    // For each prerequisite group at least one of the courses in the group must be completed
    const completedPrerequisite = await Enrollment.findOne({
      where: {
        status: {
          [Op.in]: [EnrollmentStatus.COMPLETED, EnrollmentStatus.EXPIRED],
        },
        user_id: user.id,
        course_id: {
          [Op.in]: prerequisiteCourseIds,
        },
      },
    });

    // If no prerequisite in the group is completed, the user cannot enroll in the course
    if (!completedPrerequisite) {
      return false;
    }
  }
  return true;
}
