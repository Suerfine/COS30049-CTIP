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

const quizBank = (moduleTitle: string) => [
  {
    question: `What is the primary objective of ${moduleTitle}?`,
    options: ["Safety", "Efficiency", "Monitoring", "All of the above"],
    answer: "All of the above"
  },
  {
    question: `Which action is essential for ${moduleTitle} compliance?`,
    options: ["Ignore alerts", "Strict adherence", "Delay reporting", "Random checks"],
    answer: "Strict adherence"
  },
  {
    question: `What should be prioritized in ${moduleTitle}?`,
    options: ["Risk control", "Speed only", "Cost cutting", "Ignoring data"],
    answer: "Risk control"
  },
  {
    question: `How often should ${moduleTitle} protocols be reviewed?`,
    options: ["Daily", "Weekly", "Monthly", "Annually"],
    answer: "Weekly"
  },
  {
    question: `Which system supports ${moduleTitle} monitoring?`,
    options: ["Manual logs", "Automated system", "Paper records", "None"],
    answer: "Automated system"
  },
  {
    question: `What indicates a failure in ${moduleTitle}?`,
    options: ["Anomaly detection", "No logs", "System alerts", "All of the above"],
    answer: "All of the above"
  },
  {
    question: `Who is responsible for ${moduleTitle} compliance?`,
    options: ["All staff", "Managers only", "External auditors", "No one"],
    answer: "All staff"
  },
  {
    question: `What is the first response in ${moduleTitle} issues?`,
    options: ["Ignore", "Report immediately", "Wait", "Delete logs"],
    answer: "Report immediately"
  },
  {
    question: `Which tool is used in ${moduleTitle}?`,
    options: ["Monitoring dashboard", "Spreadsheet only", "Manual paper", "Email only"],
    answer: "Monitoring dashboard"
  },
  {
    question: `What improves ${moduleTitle} efficiency?`,
    options: ["Automation", "Delay", "Manual errors", "None"],
    answer: "Automation"
  },
  {
    question: `What is a key risk in ${moduleTitle}?`,
    options: ["Data loss", "Over-reporting", "Clean logs", "Automation"],
    answer: "Data loss"
  },
  {
    question: `How should ${moduleTitle} incidents be recorded?`,
    options: ["Immediately", "Weekly batch", "Never", "Optional"],
    answer: "Immediately"
  },
  {
    question: `Which improves decision-making in ${moduleTitle}?`,
    options: ["Data analysis", "Guessing", "Ignoring data", "Random choice"],
    answer: "Data analysis"
  },
  {
    question: `What ensures success in ${moduleTitle}?`,
    options: ["Consistency", "Negligence", "Random actions", "Delays"],
    answer: "Consistency"
  },
  {
    question: `Final validation for ${moduleTitle} requires?`,
    options: ["Full audit", "No review", "Partial logs", "Skipping checks"],
    answer: "Full audit"
  }
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

    let pageElements: any[] = [];

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
    }

    else if (isLastPage) {
      const questions = faker.helpers
        .shuffle(quizBank(module.title))
        .slice(0, 15);

      const passingScore = Math.ceil(questions.length * 0.7);

      pageElements = questions.map((q, i) =>
        buildElement({
          order: i + 1,
          type: ElementTypes.QUIZ_OBJECTIVE,
          content: q,
          score: 1,
        })
      );

      return {
        page: {
          order: index + 1,
          title: "Final Assessment",
          final_quiz: 1,
          passing_score: passingScore,
          ...pageOverrides,
        },
        elements: pageElements,
      };
    }

    else {
      pageElements = buildElements(elementsPerPage, elementOverrides);
    }

    return {
      page: {
        order: index + 1,
        title: faker.commerce.productName(),
        final_quiz: 0, 
        passing_score: pageElements.length,
        ...pageOverrides,
      },
      elements: pageElements,
    };
  });

  return {
    module,
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
