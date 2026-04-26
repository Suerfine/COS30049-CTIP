import { faker } from "@faker-js/faker";

const TAG_TYPES = ["category", "difficulty", "topic"] as const;

let tagKeyCache: Set<string> = new Set<string>();

export type TagFactoryAttributes = {
  id?: number;
  title: string;
  type: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type TagFactoryInput = Partial<TagFactoryAttributes>;

const buildUniqueTag = (): Pick<TagFactoryAttributes, "title" | "type"> => {
  let type = faker.helpers.arrayElement(TAG_TYPES);
  let title = faker.word.words({ count: { min: 1, max: 2 } });
  let key = `${type}:${title.toLowerCase()}`;

  while (tagKeyCache.has(key)) {
    type = faker.helpers.arrayElement(TAG_TYPES);
    title = faker.word.words({ count: { min: 1, max: 2 } });
    key = `${type}:${title.toLowerCase()}`;
  }

  tagKeyCache.add(key);
  return { title, type };
};

export const buildTag = (overrides: TagFactoryInput = {}): TagFactoryAttributes => {
  const uniqueTag = buildUniqueTag();

  return {
    ...uniqueTag,
    ...overrides,
  };
};

export const buildTags = (count: number, overrides: TagFactoryInput = {}): TagFactoryAttributes[] => {
  return Array.from({ length: count }, () => buildTag(overrides));
};

export const resetTagFactoryCache = (): void => {
  tagKeyCache.clear();
};

export default {
  buildTag,
  buildTags,
  resetTagFactoryCache,
};
