import { faker } from "@faker-js/faker";

export type MessageFactoryAttributes = {
  id?: number;
  discussion_id?: number;
  user_id?: number;
  content: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type MessageFactoryInput = Partial<MessageFactoryAttributes>;

export type MessageFactoryUser = {
  id: number;
};

const pickRandomUserId = (users: MessageFactoryUser[]): number => {
  if (users.length === 0) {
    throw new Error("MessageFactory requires at least one user in the users list");
  }

  const selectedUser = faker.helpers.arrayElement(users);
  return selectedUser.id;
};

/**
 * Builds a single message with the given users and overrides.
 * @param users List of users to select from when assigning a user_id to the message.
 * @param overrides List of attributes to override the default generated values for the message.
 * @returns Generated message attributes with applied overrides.
 */
export const buildMessage = (
  users: MessageFactoryUser[],
  overrides: MessageFactoryInput = {},
): MessageFactoryAttributes => {
  const selectedUserId = pickRandomUserId(users);

  const defaultMessage: MessageFactoryAttributes = {
    user_id: selectedUserId,
    content: faker.lorem.sentences({ min: 1, max: 3 }),
  };

  return {
    ...defaultMessage,
    ...overrides,
    user_id: selectedUserId,
  };
};

/**
 * Builds an array of messages with the given count, users, and overrides.
 * @param count Number of messages to generate.
 * @param users List of users to select from when assigning a user_id to the messages.
 * @param overrides List of attributes to override the default generated values for the messages.
 * @returns Array of generated message attributes with applied overrides.
 */
export const buildMessages = (
  count: number,
  users: MessageFactoryUser[],
  overrides: MessageFactoryInput = {},
): MessageFactoryAttributes[] => {
  return Array.from({ length: count }, () => buildMessage(users, overrides));
};

export default {
  buildMessage,
  buildMessages,
};
