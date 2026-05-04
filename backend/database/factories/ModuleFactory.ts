import { faker } from "@faker-js/faker";
import {
  buildPageGraph,
  BuildPageOptions,
  PageFactoryAttributes,
  PageFactoryInput,
  PageFactoryResult,
} from "./PageFactory";
import { ElementFactoryInput, buildElements, buildElement } from "./ElementFactory";
import { ElementTypes } from "../../src/enum/ElementTypes";

const moduleTopics = [
  "Wildlife Conservation Fundamentals",
  "Forest Ecosystem Management Strategies",
  "Biodiversity Monitoring and Assessment",
  "Environmental Protection Protocols",
  "Sustainable Forestry Practices",
  "Habitat Restoration and Recovery",
  "Climate Change Impact Studies",
  "Endangered Species Protection Programs",
  "Ecosystem Balance and Interactions",
  "Protected Area Management Systems",
  "Wetland Conservation and Restoration",
  "Marine Ecosystem Conservation",
  "Coral Reef Protection Strategies",
  "Invasive Species Control Methods",
  "Carbon Sequestration in Forests",

  "Wildlife Tracking and GPS Monitoring",
  "Animal Behavior Observation Techniques",
  "Camera Trap Survey Methodology",
  "Population Census and Data Collection",
  "Human-Wildlife Conflict Management",
  "Wildlife Health and Disease Control",
  "Species Migration Pattern Analysis",
  "Field Research Safety Protocols",
  "Biodiversity Data Analysis Systems",
  "Conservation Field Reporting Standards",

  "Environmental Sensor Networks and IoT Monitoring",
  "Remote Sensing for Ecosystem Mapping",
  "Drone-Based Wildlife Surveillance",
  "Geographic Information Systems (GIS) in Conservation",
  "AI Applications in Biodiversity Prediction",
  "Smart Forest Monitoring Systems",
  "Climate Data Analytics and Modeling",
  "Environmental Risk Assessment Systems",
  "Digital Conservation Dashboards",
  "Real-Time Ecosystem Alert Systems"
];


let moduleTitleCache: Set<string> = new Set<string>();

const resolveCount = (base: number, variance: number = 0): number => {
  if (variance <= 0) {
    return base;
  }

  const delta = faker.number.int({ min: -variance, max: variance });
  return Math.max(1, base + delta);
};

export type ModuleFactoryAttributes = {
  id?: number;
  course_id?: number;
  order: number;
  title: string;
  description?: string | null;
  complete_by_week: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type ModuleFactoryInput = Partial<ModuleFactoryAttributes>;

export type BuildModuleOptions = {
  moduleOverrides?: ModuleFactoryInput;
  pageOverrides?: PageFactoryInput;
  elementOverrides?: ElementFactoryInput;
  pagesPerModule?: number;
  pagesVariance?: number;
  elementsPerPage?: number;
  elementsVariance?: number;
};

export type ModuleFactoryResult = {
  module: ModuleFactoryAttributes;
  pages: PageFactoryResult[];
};

export const buildModule = (overrides: ModuleFactoryInput = {}): ModuleFactoryAttributes => {
  const defaultModule: ModuleFactoryAttributes = {
    order: faker.number.int({ min: 1, max: 12 }),
    title: faker.helpers.arrayElement(moduleTopics),
    description: faker.lorem.sentences(2),
    complete_by_week: 1,
  };

  const resolvedModule = {
    ...defaultModule,
    ...overrides,
  };

  moduleTitleCache.add(resolvedModule.title);

  return resolvedModule;
};

export const buildModules = (
  count: number,
  overrides: ModuleFactoryInput = {},
): ModuleFactoryAttributes[] => {
  return Array.from({ length: count }, (_, index) =>
    buildModule({
      order: index + 1,
      ...overrides,
    }),
  );
};

export const buildModuleGraph = (options: BuildModuleOptions = {}): ModuleFactoryResult => {
  const {
    moduleOverrides = {},
    pageOverrides = {},
    elementOverrides = {},
    pagesPerModule = 5,
    pagesVariance = 0,
    elementsPerPage = 4,
  } = options;

  const module = buildModule(moduleOverrides);
  const pageCount = resolveCount(pagesPerModule, pagesVariance);

  const pages = Array.from({ length: pageCount }, (_, index) => {
    const isFirstPage = index === 0;
    const isLastPage = index === pageCount - 1;

    let pageElements;

    if (isFirstPage) {
      pageElements = [
        buildElement({
          order: 1,
          type: ElementTypes.TEXT,
          content: { 
            text: `# Welcome to ${module.title}\n\nThis module covers essential protocols for ${faker.commerce.department()}. Please review the introductory video and imagery below.` 
          }
        }),
        buildElement({
          order: 2,
          type: ElementTypes.VIDEO,
          content: {
            url: "https://www.youtube.com/embed/wYHDhdyxtco?si=16HIURVE1zs76A7W",
            transcript: "Introduction to SFC safety and conservation standards."
          }
        }),
        buildElement({
          order: 3,
          type: ElementTypes.IMAGE,
          content: {
            url: `https://picsum.photos/seed/${faker.string.numeric(5)}/800/400`,
            caption: "Overview of the conservation zone."
          }
        })
      ];
    } else if (isLastPage) {
      pageElements = [
        buildElement({
          order: 1,
          type: ElementTypes.QUIZ_OBJECTIVE,
          content: {
            question: `Which protocol is most critical for the management of ${module.title}?`,
            options: ["Strict Adherence", "Standard Reporting", "Anomaly Detection", "All of the above"],
            answer: "All of the above"
          }
        })
      ];
    } else {
      pageElements = buildElements(elementsPerPage, elementOverrides);
    }

    return {
      page: {
        order: index + 1,
        title: isFirstPage ? "Introduction" : isLastPage ? "Final Assessment" : faker.commerce.productName(),
        ...pageOverrides,
      },
      elements: pageElements,
    };
  });

  return {
    module: module,
    pages: pages as PageFactoryResult[], 
  };
};

export const resetModuleFactoryCache = (): void => {
  moduleTitleCache.clear();
};

export default {
  buildModule,
  buildModules,
  buildModuleGraph,
  resetModuleFactoryCache,
};
