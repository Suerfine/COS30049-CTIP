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
      const topics = [
        "Conservation Alert: Reforestation in Zone E requires planting native dipterocarp species to restore canopy cover.",
        "Habitat Restoration: Monitor seedling survival rates in the mangrove nursery every two weeks.",
        "Botanical Survey: Document medicinal plant species along the Northern Corridor trail.",
        "Flora Protection: Restrict visitor access during orchid blooming season to prevent trampling.",
        "Soil Health: Regularly test pH levels in reforested plots to ensure optimal growth conditions.",
        "Tree Census: Update the digital dashboard with annual counts of endangered hardwood species.",
        "Nursery Protocol: Calibrate irrigation systems to maintain consistent moisture for saplings.",
        "Invasive Species: Remove fast‑spreading vines that threaten native undergrowth in Zone B.",
        "Pollination Study: Track bee activity around flowering shrubs to assess ecosystem health.",
        "Climate Adaptation: Introduce drought‑resistant species in areas prone to seasonal water stress.",

        // Animal Conservation
        "Wildlife Monitoring: Deploy camera traps to record nocturnal activity of clouded leopards.",
        "Animal Welfare: Ensure feeding stations for hornbills are stocked during dry months.",
        "Migration Tracking: Fit GPS collars on elephants to study seasonal movement patterns.",
        "Nest Protection: Restrict human access near turtle nesting sites during hatching season.",
        "Health Check: Conduct quarterly veterinary assessments of rescued orangutans.",
        "Anti‑Poaching: Integrate drone surveillance with ranger patrols in high‑risk zones.",
        "Habitat Use: Record daily sightings of proboscis monkeys to map their range.",
        "Aquatic Life: Monitor fish populations in tributaries to detect biodiversity shifts.",
        "Species Recovery: Support breeding programs for critically endangered pangolins.",
        "Noise Control: Limit vehicle access in sensitive areas to reduce stress on wildlife."
      ];
    const baseText = faker.helpers.arrayElement(topics);
      return { text: `${baseText}\n` };
  }

  if (type === ElementTypes.IMAGE) {
    const categories = ["plants", "animals", "forest", "wildlife"];
    const chosenCategory = faker.helpers.arrayElement(categories);

    const captions = [
      "Rainforest canopy survey: dipterocarp growth analysis.",
      "Orchid bloom monitoring in protected forest zones.",
      "Proboscis monkey sighting during river patrol.",
      "Elephant migration tracking via GPS collars.",
      "Mangrove seedling survival study in Zone C.",
      "Clouded leopard nocturnal activity: infrared capture.",
      "Bee pollination study: activity around flowering shrubs.",
      "Turtle nesting site: restricted access observation."
    ];

    return {
      url: faker.image.urlLoremFlickr({ category: chosenCategory }),
      caption: faker.helpers.arrayElement(captions)
    };
  }

  if (type === ElementTypes.VIDEO) {
    const videos = [
      {
        url: "https://www.youtube.com/watch?v=MFQS7kOCwoI",
        transcript: "This documentary highlights orangutan conservation efforts in Borneo, focusing on habitat restoration and rescue programs."
      },
      {
        url: "https://www.youtube.com/watch?v=eYd1_RxVAS4",
        transcript: "An educational video on mangrove reforestation projects in Sarawak, explaining their role in protecting biodiversity and coastal resilience."
      },
      {
        url: "https://www.youtube.com/watch?v=xVRIRTQR6qU",
        transcript: "A training session for rangers on monitoring proboscis monkey populations using GPS and camera traps."
      },
      {
        url: "https://www.youtube.com/watch?v=xk9rsfXtmOI",
        transcript: "This awareness video covers turtle nesting site protection and the importance of restricting human access during hatching season."
      },
      {
        url: "https://www.youtube.com/watch?v=rOALjGOUtoY",
        transcript: "A conservation lecture on the role of bees and pollinators in sustaining rainforest ecosystems."
      },
      {
        url: "https://www.youtube.com/watch?v=3A3ZzY9rjJw",
        transcript: "A documentary on rainforest canopy studies, focusing on dipterocarp tree growth and long-term monitoring."
      },
      {
        url: "https://www.youtube.com/watch?v=2X9fN3G8d0w",
        transcript: "Educational content on mangrove reforestation projects in Sarawak, highlighting coastal resilience and biodiversity protection."
      },
      {
        url: "https://www.youtube.com/watch?v=7kVhZ9dQwYc",
        transcript: "Awareness video covering turtle nesting site protection and the importance of restricting human access during hatching season."
      },
      {
        url: "https://www.youtube.com/watch?v=9mZkY8fQwXc",
        transcript: "Conservation lecture on the role of bees and pollinators in sustaining rainforest ecosystems."
      }
    ];


    return faker.helpers.arrayElement(videos);
  }


  if (type === ElementTypes.FILE) {
    const filePool = [
      {
        name: "Sarawak_Forestry_SOP.pdf",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        desc: "Standard Operating Procedures for field rangers."
      },
      {
        name: "Deep_Learning_Benchmark_v1.pdf",
        url: "https://arxiv.org/pdf/1704.04503.pdf",
        desc: "Technical documentation for spatiotemporal modeling."
      },
      {
        name: "IoT_Sensor_Calibration.docx",
        url: "https://calibre-ebook.com/downloads/demos/demo.docx",
        desc: "Calibration manual for DHT22 and MQ-3 sensors."
      }
    ];

    const selectedFile = faker.helpers.arrayElement(filePool);

    return {
      file_name: selectedFile.name,
      file_url: selectedFile.url,
      description: selectedFile.desc,
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
    content: overrides.content ?? buildContentByType(type),
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
