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
  switch (type) {
    case ElementTypes.TEXT: {
      const topics = [
        "Conservation Alert: Reforestation in Zone E requires planting native dipterocarp species.",
        "Habitat Restoration: Monitor seedling survival rates in the mangrove nursery.",
        "Wildlife Monitoring: Deploy camera traps for nocturnal animals.",
        "Pollination Study: Track bee activity in forest zones.",
      ];
      return {
        text: faker.helpers.arrayElement(topics),
      };
    }

    case ElementTypes.IMAGE: {
      return {
        url: faker.image.urlLoremFlickr({ category: "nature" }),
        caption: faker.lorem.sentence(),
      };
    }

    case ElementTypes.VIDEO: {
      const videos = [
        {
          url: "https://www.youtube.com/watch?v=MFQS7kOCwoI",
          transcript: "Orangutan conservation in Borneo.",
        },
        {
          url: "https://www.youtube.com/watch?v=eYd1_RxVAS4",
          transcript: "Mangrove restoration in Sarawak.",
        },
      ];
      return faker.helpers.arrayElement(videos);
    }

    case ElementTypes.FILE: {
      return {
        file_name: "Training_Manual.pdf",
        file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        description: "Official training manual.",
      };
    }

    case ElementTypes.QUIZ_OBJECTIVE: {
      const options = faker.helpers.multiple(
        () => faker.lorem.words(2),
        { count: 4 }
      );

      return {
        question: faker.lorem.sentence(),
        options,
        answer: faker.helpers.arrayElement(options),
      };
    }

    case ElementTypes.WORKSHOP: {
      return {
        title: faker.company.name(),
        description: faker.lorem.sentences(2),
        location: faker.location.city(),
        link: faker.internet.url(),
        sessions: [
          {
            date: faker.date.future().toISOString().split("T")[0],
            startTime: "10:00 AM",
            endTime: "12:00 PM",
          },
          {
            date: faker.date.future().toISOString().split("T")[0],
            startTime: "02:00 PM",
            endTime: "04:00 PM",
          },
        ],
      };
    }

    default:
      throw new Error(`Unhandled element type: ${type}`);
  }
};

export const buildElement = (
  overrides: ElementFactoryInput = {}
): ElementFactoryAttributes => {
  const type =
    overrides.type ??
    faker.helpers.arrayElement(Object.values(ElementTypes));

  return {
    order: faker.number.int({ min: 1, max: 20 }),
    type,
    content: overrides.content ?? buildContentByType(type),
    score: 1,
    ...overrides,
  };
};

export const buildElements = (
  count: number,
  overrides: ElementFactoryInput = {}
): ElementFactoryAttributes[] => {
  return Array.from({ length: count }, (_, index) =>
    buildElement({
      order: index + 1,
      ...overrides,
    })
  );
};

export default {
  buildElement,
  buildElements,
};