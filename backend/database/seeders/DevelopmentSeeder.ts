import sequelize from "../../src/config/Database";
import { faker } from "@faker-js/faker";
import { UserRoles } from "../../src/enum/UserRoles";
import "../../src/models"; // Importing models for syncing database
import User from "../../src/models/User";
import Course from "../../src/models/Course";
import Tag from "../../src/models/Tag";
import CourseTag from "../../src/models/CourseTag";
import Enrollment from "../../src/models/Enrollment";
import Registration from "../../src/models/Registration";
import Module from "../../src/models/Module";
import Page from "../../src/models/Page";
import Element from "../../src/models/Element";
import Sensor from "../../src/models/Sensor";
import { SensorStatus } from "../../src/enum/SensorStatus";
import {
  buildUser,
  buildUsers,
  UserFactoryAttributes,
} from "../factories/UserFactory";
import { buildCourseGraph } from "../factories/CourseFactory";
import { buildTags, TagFactoryAttributes } from "../factories/TagFactory";
import {
  buildEnrollment,
  EnrollmentFactoryUser,
  EnrollmentFactoryCourse,
} from "../factories/EnrollmentFactory";
import { buildRegistrationHistory } from "../factories/RegistrationFactory";
import "../../src/models";

export async function runSeeders(
  user_admin_count: number = 5,
  user_park_guide_count: number = 10,
  course_count: number = 5,
): Promise<void> {
  // Clear existing data
  await sequelize.drop();
  await sequelize.sync();

  // Default Admin user
  const adminUser = buildUser({
    id: 260000, //Fixed ID for admin user to be used in test cases
    firstname: "Admin",
    lastname: "Admin",
    personal_email: "admin@sfc.gov.my",
    username: "admin",
    password: "admin",
    role: UserRoles.ADMIN,
  });
  const createdAdminUser = await User.create(adminUser);

  //Default user for park guide role
  const parkGuideUser = buildUser({
    firstname: "Park",
    lastname: "Guide",
    personal_email: "park.guide@sfc.gov.my",
    username: "park.guide",
    password: "park.guide",
    role: UserRoles.PARK_GUIDE,
  });
  const createdParkGuideUser = await User.create(parkGuideUser);

  // Creating the users
  const adminUsers: UserFactoryAttributes[] = buildUsers(user_admin_count, {
    role: UserRoles.ADMIN,
  });
  const createdAdminUsers: EnrollmentFactoryUser[] = [
    {
      id: createdAdminUser.id,
      created_at: createdAdminUser.created_at,
    },
  ];
  for (const user of adminUsers) {
    const createdUser = await User.create(user);
    createdAdminUsers.push({
      id: createdUser.id,
      created_at: createdUser.created_at,
    });
  }
  const parkGuideUsers: UserFactoryAttributes[] = buildUsers(
    user_park_guide_count,
    { role: UserRoles.PARK_GUIDE },
  );
  const createdParkGuideUsers: EnrollmentFactoryUser[] = [];
  for (const user of parkGuideUsers) {
    const createdUser = await User.create(user);
    createdParkGuideUsers.push({
      id: createdUser.id,
      created_at: createdUser.created_at,
    });
  }

  for (const parkGuideUser of createdParkGuideUsers) {
    const selectedAdmin = faker.helpers.arrayElement(createdAdminUsers);
    const registrationHistory = buildRegistrationHistory({
      user: parkGuideUser,
      adminUser: selectedAdmin,
      failedAttemptsCount: faker.number.int({ min: 0, max: 2 }),
    });

    for (const registration of registrationHistory.registrations) {
      await Registration.create(registration);
    }
  }

  // Creating courses with modules, pages, and elements
  const tags: TagFactoryAttributes[] = buildTags(15);
  const createdTags = [] as Array<{ id: number }>;

  for (const tag of tags) {
    const createdTag = await Tag.create(tag);
    createdTags.push({ id: createdTag.id });
  }

  const courses: EnrollmentFactoryCourse[] = [];
  for (let i = 0; i < course_count; i++) {
    const courseGraph = buildCourseGraph({
      modulesPerCourse: 6,
      modulesVariance: 2,
      pagesPerModule: 5,
      pagesVariance: 1,
      elementsPerPage: 4,
      elementsVariance: 1,
    });

    const createdCourse = await Course.create(courseGraph.course);
    courses.push({
      id: createdCourse.id,
      created_at: createdCourse.created_at,
    });

    const selectedTagCount = Math.min(
      createdTags.length,
      faker.number.int({ min: 2, max: 5 }),
    );
    const selectedTags = faker.helpers
      .shuffle(createdTags)
      .slice(0, selectedTagCount);

    for (const tag of selectedTags) {
      await CourseTag.create({
        course_id: createdCourse.id,
        tag_id: tag.id,
      });
    }

    for (const moduleGraph of courseGraph.modules) {
      const createdModule = await Module.create({
        ...moduleGraph.module,
        course_id: createdCourse.id,
      });

      for (const pageGraph of moduleGraph.pages) {
        const createdPage = await Page.create({
          ...pageGraph.page,
          module_id: createdModule.id,
        });

        for (const element of pageGraph.elements) {
          await Element.create({
            ...element,
            page_id: createdPage.id,
          });
        }
      }
    }
  }

  // Enroll users in courses
  if (courses.length > 0) {
    for (const parkGuideUser of createdParkGuideUsers) {
      const maxCoursesForUser = Math.min(2, courses.length);
      const courseCountForUser = faker.number.int({
        min: 1,
        max: maxCoursesForUser,
      });
      const selectedCourses = faker.helpers
        .shuffle(courses)
        .slice(0, courseCountForUser);

      for (const course of selectedCourses) {
        const enrollment = await buildEnrollment({
          user: parkGuideUser,
          course,
          adminUsers: createdAdminUsers,
        });

        await Enrollment.create(enrollment.enrollment);
      }
    }
  }

  // Seed sensors for IoT monitoring
  console.log("Seeding sensors...");
  const sensors = [
    {
      id: 1,
      name: "Fire & Smoke Detector - Park A Zone 1",
      type: "gas_temp",
      location: "3.1390,101.6869", // Kuala Lumpur coordinates as example
      current_status: SensorStatus.NORMAL,
    },
    {
      id: 2,
      name: "Motion Radar - Park A Zone 1",
      type: "microwave",
      location: "3.1390,101.6869",
      current_status: SensorStatus.NORMAL,
    },
    {
      id: 3,
      name: "Acoustic Monitor - Park A Zone 1",
      type: "acoustic",
      location: "3.1390,101.6869",
      current_status: SensorStatus.NORMAL,
    },
    {
      id: 4,
      name: "Ultrasonic Level Sensor - Park A Zone 1",
      type: "ultrasonic",
      location: "3.1390,101.6869",
      current_status: SensorStatus.NORMAL,
    },
  ];

  for (const sensorData of sensors) {
    await Sensor.create({
      ...sensorData,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
  console.log("Sensors seeded successfully");
}

export async function runDevelopmentSeeder(): Promise<void> {
  await runSeeders();
}

export default runSeeders;

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  process.argv[1].includes("DevelopmentSeeder.ts");

if (isDirectExecution) {
  runDevelopmentSeeder().catch((error: unknown) => {
    console.error("Development seeder failed:", error);
    process.exit(1);
  });
}
