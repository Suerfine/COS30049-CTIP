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
  expected_completion_weeks: number;
  must_complete_in_weeks: number;
  badge_expire_in_months: number;
  cover_img_path: string;
  badge_img_path: string;
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

export const buildCourse = (
  overrides: CourseFactoryInput = {},
): CourseFactoryAttributes => {
  const expectedCompletionWeeks = faker.number.int({ min: 4, max: 16 });
  const hardLimitWeeks =
    expectedCompletionWeeks + faker.number.int({ min: 2, max: 12 });

  const defaultCourse: CourseFactoryAttributes = {
    title: buildUniqueCourseTitle(),
    description: faker.lorem.paragraph(),
    expected_completion_weeks: expectedCompletionWeeks,
    must_complete_in_weeks: hardLimitWeeks,
    badge_expire_in_months: faker.number.int({ min: 6, max: 36 }),
    cover_img_path: "public/dev/course_cover_placeholder.jpg",
    badge_img_path: "public/dev/course_badge_placeholder.png",
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

export const buildCourseGraph = (
  options: BuildCourseOptions = {},
): CourseFactoryResult => {
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
