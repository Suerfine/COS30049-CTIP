import { faker } from "@faker-js/faker";
import {
  buildMessages,
  MessageFactoryAttributes,
  MessageFactoryInput,
  MessageFactoryUser,
} from "./MessageFactory";
import { CourseFactoryAttributes } from "./CourseFactory";

export type DiscussionFactoryAttributes = {
  id?: number;
  course_id?: number;
  user_id?: number;
  is_public: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type DiscussionFactoryInput = Partial<DiscussionFactoryAttributes>;

export type DiscussionFactoryResult = {
  discussion: DiscussionFactoryAttributes;
  messages: MessageFactoryAttributes[];
};

export type BuildDiscussionOptions = {
  users: MessageFactoryUser[];
  course: CourseFactoryAttributes;
  messagesPerDiscussion?: number;
  discussionOverrides?: DiscussionFactoryInput;
  messageOverrides?: MessageFactoryInput;
};

/**
 * Builds a single discussion with the given options.
 * @param options Build options including users, course, message count, and overrides
 * @returns Discussion attributes with associated messages
 */
export const buildDiscussion = (options: BuildDiscussionOptions): DiscussionFactoryResult => {
  const {
    users,
    course,
    messagesPerDiscussion = 5,
    discussionOverrides = {},
    messageOverrides = {},
  } = options;

  // Pick a random user for the discussion creator
  if (users.length === 0) {
    throw new Error("buildDiscussion requires at least one user in the users list");
  }

  const discussionCreatorId = faker.helpers.arrayElement(users).id;

  // Create the discussion first
  const defaultDiscussion: DiscussionFactoryAttributes = {
    course_id: course.id,
    user_id: discussionCreatorId,
    is_public: faker.datatype.boolean(),
  };

  const discussion: DiscussionFactoryAttributes = {
    ...defaultDiscussion,
    ...discussionOverrides,
    course_id: course.id,
    user_id: discussionCreatorId,
  };

  // Then create messages using the message factory
  const messages = buildMessages(messagesPerDiscussion, users, {
    discussion_id: discussion.id,
    ...messageOverrides,
  });

  return {
    discussion,
    messages,
  };
};

/**
 * Builds multiple discussions with the given options.
 * @param count Number of discussions to generate
 * @param options Build options including users, course, message count, and overrides
 * @returns Array of discussion results
 */
export const buildDiscussions = (
  count: number,
  options: BuildDiscussionOptions,
): DiscussionFactoryResult[] => {
  return Array.from({ length: count }, () => buildDiscussion(options));
};

export default {
  buildDiscussion,
  buildDiscussions,
};
