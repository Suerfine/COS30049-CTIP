import { faker } from "@faker-js/faker";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/password";

const DEFAULT_PASSWORD: string = "password";

// Module-scoped cache that persists for the lifetime of the script
let usernameCache: Set<string> = new Set<string>();
let identificationCache: Set<string> = new Set<string>();
let personalEmailCache: Set<string> = new Set<string>();

export type UserFactoryAttributes = {
  id?: number;
  username: string;
  firstname: string;
  lastname: string;
  identification: string;
  personal_email: string;
  tel: string;
  role: UserRoles;
  password_hash: string;
  last_login_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type UserFactoryInput = Partial<UserFactoryAttributes> & {
  password?: string;
};

/**
 * Generates a single User attributes object for seeding purposes.
 * @param overrides Attributes to override
 * @returns User attributes object
 */
export const buildUser = (
  overrides: UserFactoryInput = {},
): UserFactoryAttributes => {
  const { password, ...restOverrides } = overrides;

  const defaultUser: UserFactoryAttributes = {
    username: `${faker.internet.displayName()}_${faker.number.int({ min: 100, max: 999 })}`,
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    identification: `${faker.string.alphanumeric(10).toUpperCase()}`,
    personal_email: faker.internet.email().toLowerCase(),
    tel: `+61${faker.string.numeric(9)}`,
    role: faker.helpers.arrayElement(Object.values(UserRoles)),
    password_hash: hashPassword(DEFAULT_PASSWORD),
    last_login_at: faker.helpers.arrayElement([
      null,
      faker.date.recent({ days: 30 }),
    ]),
  };

  const resolvedPasswordHash =
    typeof password === "string"
      ? hashPassword(password)
      : restOverrides.password_hash;

  return {
    ...defaultUser,
    ...restOverrides,
    password_hash: resolvedPasswordHash ?? defaultUser.password_hash,
  };
};

/**
 * Generates an array of unique User attributes for seeding purposes.
 * Uses a module-scoped cache to ensure uniqueness across multiple calls.
 * @param count Number of users to generate
 * @param overrides Attributes to override
 * @returns Array of unique User attributes
 */
export const buildUsers = (
  count: number,
  overrides: UserFactoryInput = {},
): UserFactoryAttributes[] => {
  const users: UserFactoryAttributes[] = [];

  for (let i = 0; i < count; i++) {
    let user = buildUser(overrides);

    while (
      usernameCache.has(user.username) ||
      identificationCache.has(user.identification) ||
      personalEmailCache.has(user.personal_email)
    ) {
      user = buildUser(overrides);
    }

    usernameCache.add(user.username);
    identificationCache.add(user.identification);
    personalEmailCache.add(user.personal_email);
    users.push(user);
  }

  return users;
};

/**
 * Resets the username cache. Useful for testing or resetting between seeder runs.
 */
export const resetUsernameCache = (): void => {
  usernameCache.clear();
  identificationCache.clear();
  personalEmailCache.clear();
};

export default {
  buildUser,
  buildUsers,
  resetUsernameCache,
};
