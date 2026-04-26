import { faker } from "@faker-js/faker";
import { ElementTypes } from "../../src/enum/ElementTypes";

export type ElementFactoryAttributes = {
  id?: number;
  page_id?: number;
  order: number;
  type: ElementTypes;
  content: Record<string, unknown>;
  score?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type ElementFactoryInput = Partial<ElementFactoryAttributes>;

const buildContentByType = (type: ElementTypes): Record<string, unknown> => {
  if (type === ElementTypes.TEXT) {
    return {
      text: faker.lorem.paragraph(),
    };
  }

  if (type === ElementTypes.IMAGE) {
    return {
      url: faker.image.urlLoremFlickr({ category: "nature" }),
      caption: faker.lorem.sentence(),
    };
  }

  if (type === ElementTypes.VIDEO) {
    return {
      url: faker.internet.url(),
      transcript: faker.lorem.sentences(2),
    };
  }

  if (type === ElementTypes.FILE) {
    return {
      file_name: faker.system.fileName(),
      file_url: faker.internet.url(),
      description: faker.lorem.sentence(),
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
  const type = overrides.type ?? faker.helpers.arrayElement(Object.values(ElementTypes));

  const defaultElement: ElementFactoryAttributes = {
    order: faker.number.int({ min: 1, max: 20 }),
    type,
    content: buildContentByType(type),
    score: 1,
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
