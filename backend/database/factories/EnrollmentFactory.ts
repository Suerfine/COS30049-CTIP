import { faker } from "@faker-js/faker";
import { EnrollmentStatus } from "../../src/enum/EnrollmentStatus";
import { UserRoles } from "../../src/enum/UserRoles";
import User from "../../src/models/User";
import { buildUser } from "./UserFactory";

export type EnrollmentFactoryUser = {
  id: number;
  created_at?: Date | null;
};

export type EnrollmentFactoryCourse = {
  id: number;
  created_at?: Date | null;
};

export type EnrollmentFactoryAttributes = {
  id?: number;
  user_id: number;
  course_id: number;
  status: EnrollmentStatus;
  enrolled_date: Date;
  completed_date: Date | null;
  reviewed_by_user_id: number | null;
  review_date: Date | null;
  review_comment: string | null;
  expired_date: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type EnrollmentFactoryInput = Partial<EnrollmentFactoryAttributes>;

export type BuildEnrollmentOptions = {
  user: EnrollmentFactoryUser;
  course: EnrollmentFactoryCourse;
  adminUsers?: EnrollmentFactoryUser[];
  enrollmentOverrides?: EnrollmentFactoryInput;
};

export type EnrollmentFactoryResult = {
  enrollment: EnrollmentFactoryAttributes;
  adminUser?: EnrollmentFactoryUser;
};

const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const addYears = (date: Date, years: number): Date => {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + years);
  return nextDate;
};

const getLatestDate = (dates: Array<Date | null | undefined>): Date => {
  const resolvedDates = dates.filter((date): date is Date => date instanceof Date);

  if (resolvedDates.length === 0) {
    return new Date();
  }

  return resolvedDates.reduce((latest, current) => (current > latest ? current : latest));
};

const getRandomDateBetween = (start: Date, end: Date): Date => {
  const safeStart = start.getTime() <= end.getTime() ? start : end;
  const safeEnd = start.getTime() <= end.getTime() ? end : start;

  return faker.date.between({ from: safeStart, to: safeEnd });
};

const resolveAdminUser = async (adminUsers: EnrollmentFactoryUser[] = []): Promise<EnrollmentFactoryUser> => {
  if (adminUsers.length > 0) {
    const selectedAdmin = faker.helpers.arrayElement(adminUsers);

    if (typeof selectedAdmin.id === "number") {
      return selectedAdmin;
    }
  }

  const createdAdmin = await User.create(
    buildUser({
      role: UserRoles.ADMIN,
    }),
  );

  return {
    id: createdAdmin.id,
    created_at: createdAdmin.created_at,
  };
};

export const buildEnrollment = async (
  options: BuildEnrollmentOptions,
): Promise<EnrollmentFactoryResult> => {
  const {
    user,
    course,
    adminUsers = [],
    enrollmentOverrides = {},
  } = options;

  const status = enrollmentOverrides.status ?? EnrollmentStatus.IN_PROGRESS;
  const baseEnrollmentDate = getLatestDate([user.created_at, course.created_at]);
  const enrolledDate =
    enrollmentOverrides.enrolled_date instanceof Date
      ? enrollmentOverrides.enrolled_date > baseEnrollmentDate
        ? enrollmentOverrides.enrolled_date
        : getRandomDateBetween(addDays(baseEnrollmentDate, 1), addDays(baseEnrollmentDate, 30))
      : getRandomDateBetween(addDays(baseEnrollmentDate, 1), addDays(baseEnrollmentDate, 30));

  const expiredDate = addYears(enrolledDate, 3);
  const baseEnrollment: EnrollmentFactoryAttributes = {
    user_id: user.id,
    course_id: course.id,
    status,
    enrolled_date: enrolledDate,
    completed_date: null,
    reviewed_by_user_id: null,
    review_date: null,
    review_comment: faker.lorem.sentence(),
    expired_date: expiredDate,
  };

  const enrollment: EnrollmentFactoryAttributes = {
    ...baseEnrollment,
    ...enrollmentOverrides,
    user_id: user.id,
    course_id: course.id,
    enrolled_date: enrolledDate,
    expired_date: expiredDate,
  };

  if (status === EnrollmentStatus.COMPLETED) {
    const adminUser = await resolveAdminUser(adminUsers);
    const reviewDate =
      enrollmentOverrides.review_date instanceof Date && enrollmentOverrides.review_date > enrolledDate
        ? enrollmentOverrides.review_date
        : getRandomDateBetween(addDays(enrolledDate, 1), addDays(enrolledDate, 30));
    const completedDate =
      enrollmentOverrides.completed_date instanceof Date && enrollmentOverrides.completed_date > reviewDate
        ? enrollmentOverrides.completed_date
        : getRandomDateBetween(addDays(reviewDate, 1), addDays(reviewDate, 60));

    return {
      adminUser,
      enrollment: {
        ...enrollment,
        status: EnrollmentStatus.COMPLETED,
        reviewed_by_user_id: adminUser.id,
        review_date: reviewDate,
        completed_date: completedDate,
      },
    };
  }

  return {
    enrollment: {
      ...enrollment,
      status: EnrollmentStatus.IN_PROGRESS,
      reviewed_by_user_id: null,
      review_date: null,
      completed_date: null,
    },
  };
};

export const buildEnrollments = async (
  count: number,
  options: BuildEnrollmentOptions,
): Promise<EnrollmentFactoryResult[]> => {
  return Promise.all(Array.from({ length: count }, () => buildEnrollment(options)));
};

export default {
  buildEnrollment,
  buildEnrollments,
};
