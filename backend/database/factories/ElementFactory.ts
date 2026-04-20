import { faker } from "@faker-js/faker";

export type ElementType = "text" | "image" | "video" | "quiz";

export type ElementFactoryAttributes = {
  id?: number;
  page_id?: number;
  order: number;
  type: ElementType;
  content: Record<string, unknown>;
  score?: number | null;
  max_tries?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type ElementFactoryInput = Partial<ElementFactoryAttributes>;

const buildContentByType = (type: ElementType): Record<string, unknown> => {
  if (type === "text") {
    return {
      text: faker.lorem.paragraph(),
    };
  }

  if (type === "image") {
    return {
      url: faker.image.urlLoremFlickr({ category: "nature" }),
      caption: faker.lorem.sentence(),
    };
  }

  if (type === "video") {
    return {
      url: faker.internet.url(),
      transcript: faker.lorem.sentences(2),
    };
  }

  const options = faker.helpers.multiple(() => faker.lorem.words(2), { count: 4 });
  const answer = faker.helpers.arrayElement(options);

  return {
    question: faker.lorem.sentence(),
    options,
    answer,
  };
};

export const buildElement = (overrides: ElementFactoryInput = {}): ElementFactoryAttributes => {
  const type = overrides.type ?? faker.helpers.arrayElement(["text", "image", "video", "quiz"]);

  const defaultElement: ElementFactoryAttributes = {
    order: faker.number.int({ min: 1, max: 20 }),
    type,
    content: buildContentByType(type),
    score: 1,
    max_tries: 3,
  };

  return {
    ...defaultElement,
    ...overrides,
  };
};

export const buildElements = (
  count: number,
  overrides: ElementFactoryInput = {},
): ElementFactoryAttributes[] => {
  return Array.from({ length: count }, (_, index) =>
    buildElement({
      order: index + 1,
      ...overrides,
    }),
  );
};

export default {
  buildElement,
  buildElements,
};
