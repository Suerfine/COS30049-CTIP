import { faker } from "@faker-js/faker";

const TAG_TYPES = ["category", "location"] as const;
type TagType = typeof TAG_TYPES[number];

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
  let type: TagType;
  let title: string;
  let key: string;

  do {
    type = faker.helpers.arrayElement(TAG_TYPES);

    if (type === "location") {
      title = faker.location.city();
    } else {
      title = faker.word.words({ count: { min: 1, max: 2 } }); 
    }

    key = `${type}:${title.toLowerCase()}`;
  } while (tagKeyCache.has(key));

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
