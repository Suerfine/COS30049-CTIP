import { faker } from "@faker-js/faker";
import { RegistrationStatus } from "../../src/enum/RegistrationStatus";

const DUMMY_DOCUMENT_PATH = "public\\dev\\dummy_resume.pdf";

export type RegistrationFactoryUser = {
  id: number;
  created_at?: Date | null;
};

export type RegistrationFactoryAdminUser = {
  id: number;
  created_at?: Date | null;
};

export type RegistrationFactoryAttributes = {
  id?: number;
  user_id: number;
  reviewed_by_user_id: number | null;
  status: RegistrationStatus;
  firstname: string;
  lastname: string;
  identification: string;
  personal_email: string;
  document_filepath: string | null;
  tel: string;
  admin_remark: string | null;
  reviewed_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type RegistrationFactoryInput = Partial<RegistrationFactoryAttributes>;

export type BuildRegistrationOptions = {
  user: RegistrationFactoryUser;
  adminUser: RegistrationFactoryAdminUser;
  status?: RegistrationStatus;
  registrationOverrides?: RegistrationFactoryInput;
};

export type RegistrationHistoryResult = {
  latestRegistration: RegistrationFactoryAttributes;
  failedRegistrations: RegistrationFactoryAttributes[];
  registrations: RegistrationFactoryAttributes[];
};

export type BuildRegistrationHistoryOptions = {
  user: RegistrationFactoryUser;
  adminUser: RegistrationFactoryAdminUser;
  failedAttemptsCount?: number;
  latestRegistrationOverrides?: RegistrationFactoryInput;
  failedRegistrationOverrides?: RegistrationFactoryInput;
};

const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const resolveBaseDate = (
  user: RegistrationFactoryUser,
  adminUser: RegistrationFactoryAdminUser,
): Date => {
  const candidates = [user.created_at, adminUser.created_at].filter(
    (date): date is Date => date instanceof Date,
  );

  if (candidates.length === 0) {
    return new Date();
  }

  return candidates.reduce((latest, current) =>
    current > latest ? current : latest,
  );
};

const buildRegistrationData = (): Omit<
  RegistrationFactoryAttributes,
  | "id"
  | "user_id"
  | "reviewed_by_user_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "deleted_at"
> => {
  return {
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    identification: faker.string.alphanumeric(10).toUpperCase(),
    personal_email: faker.internet.email().toLowerCase(),
    tel: faker.phone.number(),
    admin_remark: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    reviewed_at: null,
    document_filepath: DUMMY_DOCUMENT_PATH,
  };
};

export const buildRegistration = (
  options: BuildRegistrationOptions,
): RegistrationFactoryAttributes => {
  const {
    user,
    adminUser,
    status = RegistrationStatus.APPROVED,
    registrationOverrides = {},
  } = options;

  const baseDate = resolveBaseDate(user, adminUser);
  const createdAt =
    registrationOverrides.created_at instanceof Date
      ? registrationOverrides.created_at
      : addDays(baseDate, faker.number.int({ min: 1, max: 30 }));

  const resolvedStatus = registrationOverrides.status ?? status;
  const reviewedByUserId =
    resolvedStatus === RegistrationStatus.PENDING ? null : adminUser.id;
  const reviewedAt =
    resolvedStatus === RegistrationStatus.PENDING
      ? null
      : addDays(createdAt, faker.number.int({ min: 0, max: 3 }));

  const baseRegistration: RegistrationFactoryAttributes = {
    user_id: user.id,
    reviewed_by_user_id: reviewedByUserId,
    status: resolvedStatus,
    ...buildRegistrationData(),
    ...registrationOverrides,
  };

  return {
    ...baseRegistration,
    user_id: user.id,
    reviewed_by_user_id: reviewedByUserId,
    status: resolvedStatus,
    reviewed_at:
      registrationOverrides.reviewed_at === undefined
        ? reviewedAt
        : registrationOverrides.reviewed_at,
    created_at: createdAt,
    updated_at:
      registrationOverrides.updated_at instanceof Date
        ? registrationOverrides.updated_at
        : createdAt,
    document_filepath:
      registrationOverrides.document_filepath ?? DUMMY_DOCUMENT_PATH,
  };
};

export const buildRegistrationHistory = (
  options: BuildRegistrationHistoryOptions,
): RegistrationHistoryResult => {
  const {
    user,
    adminUser,
    failedAttemptsCount = 0,
    latestRegistrationOverrides = {},
    failedRegistrationOverrides = {},
  } = options;

  const baseDate = resolveBaseDate(user, adminUser);
  const failedRegistrations = Array.from(
    { length: failedAttemptsCount },
    (_, index) => {
      return buildRegistration({
        user,
        adminUser,
        status: RegistrationStatus.REJECTED,
        registrationOverrides: {
          ...failedRegistrationOverrides,
          created_at: addDays(baseDate, index + 1),
          updated_at: addDays(baseDate, index + 1),
        },
      });
    },
  );

  const latestRegistration = buildRegistration({
    user,
    adminUser,
    status: RegistrationStatus.APPROVED,
    registrationOverrides: {
      ...latestRegistrationOverrides,
      created_at: addDays(baseDate, failedAttemptsCount + 1),
      updated_at: addDays(baseDate, failedAttemptsCount + 1),
    },
  });

  return {
    latestRegistration,
    failedRegistrations,
    registrations: [...failedRegistrations, latestRegistration],
  };
};

export default {
  buildRegistration,
  buildRegistrationHistory,
};
