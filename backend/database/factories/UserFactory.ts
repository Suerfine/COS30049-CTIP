import { faker } from "@faker-js/faker";
import { UserRoles } from "../../src/enum/UserRoles";
import { hashPassword } from "../../src/utils/Password";

const DEFAULT_PASSWORD: string = "password";

// Module-scoped cache that persists for the lifetime of the script
let usernameCache: Set<string> = new Set<string>();

export type UserFactoryAttributes = {
	id?: number;
	username: string;
	role: UserRoles;
	password_hash: string;
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
export const buildUser = (overrides: UserFactoryInput = {}): UserFactoryAttributes => {
	const { password, ...restOverrides } = overrides;

	const defaultUser: UserFactoryAttributes = {
		username: `${faker.internet.displayName()}_${faker.number.int({ min: 100, max: 999 })}`,
		role: faker.helpers.arrayElement(Object.values(UserRoles)),
		password_hash: hashPassword(DEFAULT_PASSWORD),
	};

	const resolvedPasswordHash =
		typeof password === "string" ? hashPassword(password) : restOverrides.password_hash;

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

		while (usernameCache.has(user.username)) {
			user = buildUser(overrides);
		}

		usernameCache.add(user.username);
		users.push(user);
	}

	return users;
};

/**
 * Resets the username cache. Useful for testing or resetting between seeder runs.
 */
export const resetUsernameCache = (): void => {
	usernameCache.clear();
};

export default {
	buildUser,
	buildUsers,
	resetUsernameCache,
};
