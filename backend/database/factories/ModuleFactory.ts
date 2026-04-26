import { faker } from "@faker-js/faker";
import {
  buildPageGraph,
  BuildPageOptions,
  PageFactoryAttributes,
  PageFactoryInput,
  PageFactoryResult,
} from "./PageFactory";
import { ElementFactoryInput } from "./ElementFactory";

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

const buildUniqueModuleTitle = (): string => {
  let title = faker.lorem.words({ min: 2, max: 4 });

  while (moduleTitleCache.has(title)) {
    title = faker.lorem.words({ min: 2, max: 4 });
  }

  moduleTitleCache.add(title);
  return title;
};

export const buildModule = (overrides: ModuleFactoryInput = {}): ModuleFactoryAttributes => {
  const defaultModule: ModuleFactoryAttributes = {
    order: faker.number.int({ min: 1, max: 12 }),
    title: buildUniqueModuleTitle(),
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
    elementsVariance = 0,
  } = options;

  const module = buildModule(moduleOverrides);
  const pageCount = resolveCount(pagesPerModule, pagesVariance);

  const pages = Array.from({ length: pageCount }, (_, index) =>
    buildPageGraph({
      pageOverrides: {
        order: index + 1,
        ...pageOverrides,
      },
      elementOverrides,
      elementsPerPage,
      elementsVariance,
    }),
  );

  return {
    module,
    pages,
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
