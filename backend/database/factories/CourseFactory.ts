import { faker } from "@faker-js/faker";
import {
  buildModuleGraph,
  ModuleFactoryAttributes,
  ModuleFactoryInput,
  ModuleFactoryResult,
} from "./ModuleFactory";
import { PageFactoryInput } from "./PageFactory";
import { ElementFactoryInput } from "./ElementFactory";

let courseTitleCache: Set<string> = new Set<string>();

const resolveCount = (base: number, variance: number = 0): number => {
  if (variance <= 0) {
    return base;
  }

  const delta = faker.number.int({ min: -variance, max: variance });
  return Math.max(1, base + delta);
};

export type CourseFactoryAttributes = {
  id?: number;
  title: string;
  description?: string | null;
  badge_img?: string | null;
  course_weeks: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type CourseFactoryInput = Partial<CourseFactoryAttributes>;

export type BuildCourseOptions = {
  courseOverrides?: CourseFactoryInput;
  moduleOverrides?: ModuleFactoryInput;
  pageOverrides?: PageFactoryInput;
  elementOverrides?: ElementFactoryInput;
  modulesPerCourse?: number;
  modulesVariance?: number;
  pagesPerModule?: number;
  pagesVariance?: number;
  elementsPerPage?: number;
  elementsVariance?: number;
};

export type CourseFactoryResult = {
  course: CourseFactoryAttributes;
  modules: ModuleFactoryResult[];
};

const buildUniqueCourseTitle = (): string => {
  let title = faker.company.catchPhrase();

  while (courseTitleCache.has(title)) {
    title = faker.company.catchPhrase();
  }

  courseTitleCache.add(title);
  return title;
};

export const buildCourse = (overrides: CourseFactoryInput = {}): CourseFactoryAttributes => {
  const defaultCourse: CourseFactoryAttributes = {
    title: buildUniqueCourseTitle(),
    description: faker.lorem.paragraph(),
    badge_img: faker.image.urlPicsumPhotos(),
    course_weeks: 1,
  };

  const resolvedCourse = {
    ...defaultCourse,
    ...overrides,
  };

  courseTitleCache.add(resolvedCourse.title);

  return resolvedCourse;
};

export const buildCourses = (
  count: number,
  overrides: CourseFactoryInput = {},
): CourseFactoryAttributes[] => {
  return Array.from({ length: count }, () => buildCourse(overrides));
};

export const buildCourseGraph = (options: BuildCourseOptions = {}): CourseFactoryResult => {
  const {
    courseOverrides = {},
    moduleOverrides = {},
    pageOverrides = {},
    elementOverrides = {},
    modulesPerCourse = 6,
    modulesVariance = 0,
    pagesPerModule = 5,
    pagesVariance = 0,
    elementsPerPage = 4,
    elementsVariance = 0,
  } = options;

  const course = buildCourse(courseOverrides);
  const moduleCount = resolveCount(modulesPerCourse, modulesVariance);

  const modules = Array.from({ length: moduleCount }, (_, index) =>
    buildModuleGraph({
      moduleOverrides: {
        order: index + 1,
        complete_by_week: 1,
        ...moduleOverrides,
      },
      pageOverrides,
      elementOverrides: {
        score: 1,
        ...elementOverrides,
      },
      pagesPerModule,
      pagesVariance,
      elementsPerPage,
      elementsVariance,
    }),
  );

  return {
    course,
    modules,
  };
};

export const resetCourseFactoryCache = (): void => {
  courseTitleCache.clear();
};

export default {
  buildCourse,
  buildCourses,
  buildCourseGraph,
  resetCourseFactoryCache,
};
