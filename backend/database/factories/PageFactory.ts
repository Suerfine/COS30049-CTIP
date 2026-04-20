import { faker } from "@faker-js/faker";
import { buildElements, ElementFactoryAttributes, ElementFactoryInput } from "./ElementFactory";

let pageTitleCache: Set<string> = new Set<string>();

const resolveCount = (base: number, variance: number = 0): number => {
  if (variance <= 0) {
    return base;
  }

  const delta = faker.number.int({ min: -variance, max: variance });
  return Math.max(1, base + delta);
};

export type PageFactoryAttributes = {
  id?: number;
  module_id?: number;
  order: number;
  title: string;
  description?: string | null;
  passing_score: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type PageFactoryInput = Partial<PageFactoryAttributes>;

export type BuildPageOptions = {
  pageOverrides?: PageFactoryInput;
  elementOverrides?: ElementFactoryInput;
  elementsPerPage?: number;
  elementsVariance?: number;
};

export type PageFactoryResult = {
  page: PageFactoryAttributes;
  elements: ElementFactoryAttributes[];
};

const buildUniquePageTitle = (): string => {
  let title = faker.lorem.words({ min: 2, max: 5 });

  while (pageTitleCache.has(title)) {
    title = faker.lorem.words({ min: 2, max: 5 });
  }

  pageTitleCache.add(title);
  return title;
};

export const buildPage = (overrides: PageFactoryInput = {}): PageFactoryAttributes => {
  const defaultPage: PageFactoryAttributes = {
    order: faker.number.int({ min: 1, max: 20 }),
    title: buildUniquePageTitle(),
    description: faker.lorem.sentences(2),
    passing_score: 1,
  };

  const resolvedPage = {
    ...defaultPage,
    ...overrides,
  };

  pageTitleCache.add(resolvedPage.title);

  return resolvedPage;
};

export const buildPages = (
  count: number,
  overrides: PageFactoryInput = {},
): PageFactoryAttributes[] => {
  return Array.from({ length: count }, (_, index) =>
    buildPage({
      order: index + 1,
      ...overrides,
    }),
  );
};

export const buildPageGraph = (options: BuildPageOptions = {}): PageFactoryResult => {
  const {
    pageOverrides = {},
    elementOverrides = {},
    elementsPerPage = 4,
    elementsVariance = 0,
  } = options;

  const page = buildPage(pageOverrides);
  const elementCount = resolveCount(elementsPerPage, elementsVariance);

  const elements = buildElements(elementCount, elementOverrides).map((element, index) => ({
    ...element,
    order: index + 1,
  }));

  return {
    page,
    elements,
  };
};

export const resetPageFactoryCache = (): void => {
  pageTitleCache.clear();
};

export default {
  buildPage,
  buildPages,
  buildPageGraph,
  resetPageFactoryCache,
};
