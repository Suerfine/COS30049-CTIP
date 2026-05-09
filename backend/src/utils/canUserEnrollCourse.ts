import { Op } from "sequelize";
import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import {
  Course,
  Enrollment,
  Prerequisite,
  PrerequisiteGroup,
  User,
} from "../models";

export async function canUserEnrollCourse(
  user: User,
  course: Course,
): Promise<boolean> {
  // Check if the user has already enrolled in the course
  const enrollment = await Enrollment.findOne({
    where: {
      user_id: user.id,
      course_id: course.id,
    },
  });
  if (enrollment) return false;

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
