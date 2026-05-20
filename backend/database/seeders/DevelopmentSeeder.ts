import "dotenv/config";
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
import SensorLog from "../../src/models/SensorLogs";
import Notification from "../../src/models/Notification";
import Discussion from "../../src/models/Discussion";
import Message from "../../src/models/Messages";
import { SensorStatus } from "../../src/enum/SensorStatus";
import { buildEvents } from "../factories/EventFactory";
import Event from "../../src/models/Event";
import Payment from "../../src/models/Payment";
import { buildPayment } from "../factories/PaymentFactory";
import { EnrollmentStatus } from "../../src/enum/EnrollmentStatus";
import { buildSubmission } from "../factories/SubmissionFactory";
import Submission from "../../src/models/Submissions";

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
import { buildComplianceEvents } from "../factories/AnomalyEventFactory";
import AnomalyEvent from "../../src/models/AnomalyEvent";
import ArModel from "../../src/models/ArModel";
import "../../src/models";
import { PaymentStatus } from "../../src/enum/PaymentStatus";
import { CourseStatus } from "../../src/enum/CourseStatus";
import { RegistrationStatus } from "../../src/enum/RegistrationStatus";
import { EventStatus } from "../../src/enum/EventStatus";
import { EventType } from "../../src/enum/EventType";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MS_PER_DAY);
const DEMO_AI_ANOMALY_FRAME_BASE64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAVEAEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEAMQAAAB9A//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IR//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z";

export async function runSeeders(
  user_admin_count: number = 5,
  user_park_guide_count: number = 10,
  course_count: number = 8,
): Promise<void> {
  // Clear existing data
  await sequelize.drop();
  await sequelize.sync();

  // Default Admin user
  const adminUser = buildUser({
    id: 260000, //Fixed ID for admin user to be used in test cases
    firstname: "Admin",
    lastname: "Admin",
    identification: "admin",
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
    identification: "park.guide",
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

  // Creating dummy todo list (event) for users
  const eventPerUser = 5;

  const allUsers = [
    createdAdminUser,
    ...createdAdminUsers.map((u) => ({ id: u.id })),
    ...createdParkGuideUsers.map((u) => ({ id: u.id })),
  ];

  for (const user of allUsers) {
    const events = buildEvents(eventPerUser, {
      user_id: user.id,
    });

    for (const [index, event] of events.entries()) {
      await Event.create({
        ...event,
        type:
          index === 0 || index === 2 ? EventType.WORKSHOP : EventType.NORMAL,
        status:
          index === 1 || index === 2
            ? EventStatus.COMPLETED
            : EventStatus.PENDING,
      } as any);
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

    const isReleased = i < 4 ? true : faker.datatype.boolean();

    const createdCourse = await Course.create({
      ...courseGraph.course,
      status: isReleased ? CourseStatus.RELEASED : CourseStatus.UNRELEASED,
    });
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

  // Seed compliance events for park guides
  console.log("🔍 Seeding Compliance Events...");
  const eventTypesPerUser = 3; // Number of compliance events per user
  for (const parkGuideUser of createdParkGuideUsers) {
    const complianceEvents = buildComplianceEvents(
      parkGuideUser.id,
      eventTypesPerUser,
    );

    for (const event of complianceEvents) {
      await AnomalyEvent.create(event);
    }
  }
  console.log(
    `✅ Created ${createdParkGuideUsers.length * eventTypesPerUser} compliance events`,
  );

  await AnomalyEvent.create({
    user_id: createdParkGuideUser.id,
    event_type: "plucking_plants",
    location: "Bako National Park - Boardwalk Entrance",
    metadata: {
      source: "ai_camera",
      camera_name: "Demo AI Camera - Boardwalk Entrance",
      detection_confidence: 0.94,
      frame_number: 1284,
      pose_keypoints_detected: 15,
      evidence_label: "AI demo anomaly with photo evidence",
    },
    latitude: 1.5572,
    longitude: 110.3441,
    is_resolved: false,
    resolved_at: null,
    annotated_frame_base64: DEMO_AI_ANOMALY_FRAME_BASE64,
    created_at: addDays(new Date(), -1),
    updated_at: addDays(new Date(), -1),
  });
  console.log("Seeded demo AI anomaly with photo evidence");

  if (courses.length > 0) {
    for (const parkGuideUser of createdParkGuideUsers) {
      // Only get released courses
      const releasedCourses: EnrollmentFactoryCourse[] = [];

      for (const courseInfo of courses) {
        const dbCourse = await Course.findByPk(courseInfo.id);

        if (dbCourse?.status === "released") {
          releasedCourses.push(courseInfo);
        }
      }

      // Skip if no released courses
      if (releasedCourses.length === 0) {
        continue;
      }

      // Randomly assign released courses only
      const maxCoursesForUser = Math.min(2, releasedCourses.length);

      const courseCountForUser = faker.number.int({
        min: 1,
        max: maxCoursesForUser,
      });

      const selectedCourses = faker.helpers
        .shuffle(releasedCourses)
        .slice(0, courseCountForUser);

      for (const courseInfo of selectedCourses) {
        const dbCourse = await Course.findByPk(courseInfo.id);

        if (!dbCourse) continue;

        const isApproved = faker.datatype.boolean(0.7);

        const finalEnrollmentStatus = isApproved
          ? EnrollmentStatus.IN_PROGRESS
          : EnrollmentStatus.PENDING_PAYMENT;

        const finalPaymentStatus = isApproved
          ? PaymentStatus.PAID
          : PaymentStatus.PENDING;

        const enrollmentData = await buildEnrollment({
          user: parkGuideUser,
          course: courseInfo,
          adminUsers: createdAdminUsers,
        });

        const createdEnrollment = await Enrollment.create({
          ...enrollmentData.enrollment,
          status: finalEnrollmentStatus,
        });

        const paymentData = buildPayment({
          user_id: parkGuideUser.id,
          course_id: dbCourse.id,
          enrollment_id: createdEnrollment.id,
          amount: dbCourse.cost,
        });

        await Payment.create({
          ...paymentData,
          status: finalPaymentStatus,
          processed_by_user_id: isApproved ? createdAdminUser.id : null,
          processed_at: isApproved ? new Date() : null,
          admin_remark: isApproved ? "Automated seed approval" : null,
        });
      }
    }
  }

  const releasedCourses = await Course.findAll({
    where: { status: CourseStatus.RELEASED },
    order: [["id", "ASC"]],
    limit: 3,
  });

  if (releasedCourses.length > 0) {
    const now = new Date();
    const learningCourse = releasedCourses[0];
    const paymentCourse = releasedCourses[1] ?? releasedCourses[0];
    const completedCourse = releasedCourses[2] ?? releasedCourses[0];

    const inProgressEnrollment = await Enrollment.create({
      user_id: createdParkGuideUser.id,
      course_id: learningCourse.id,
      status: EnrollmentStatus.IN_PROGRESS,
      enrolled_at: addDays(
        now,
        -(Number(learningCourse.must_complete_in_weeks) * 7 - 7),
      ),
    });

    await Payment.create({
      ...buildPayment({
        user_id: createdParkGuideUser.id,
        course_id: learningCourse.id,
        enrollment_id: inProgressEnrollment.id,
        amount: learningCourse.cost,
      }),
      status: PaymentStatus.PAID,
      processed_by_user_id: createdAdminUser.id,
      processed_at: addDays(now, -2),
      admin_remark: "Receipt verified for UAT scenario",
    });

    const pendingPaymentEnrollment = await Enrollment.create({
      user_id: createdParkGuideUser.id,
      course_id: paymentCourse.id,
      status: EnrollmentStatus.PENDING_PAYMENT,
      enrolled_at: addDays(now, -1),
    });

    await Payment.create({
      ...buildPayment({
        user_id: createdParkGuideUser.id,
        course_id: paymentCourse.id,
        enrollment_id: pendingPaymentEnrollment.id,
        amount: paymentCourse.cost,
      }),
      status: PaymentStatus.PENDING,
    });

    const completedEnrollment = await Enrollment.create({
      user_id: createdParkGuideUser.id,
      course_id: completedCourse.id,
      status: EnrollmentStatus.COMPLETED,
      enrolled_at: addDays(now, -45),
      completed_at: addDays(now, -7),
      badge_expire_at: addDays(now, 365),
    });

    await Payment.create({
      ...buildPayment({
        user_id: createdParkGuideUser.id,
        course_id: completedCourse.id,
        enrollment_id: completedEnrollment.id,
        amount: completedCourse.cost,
      }),
      status: PaymentStatus.PAID,
      processed_by_user_id: createdAdminUser.id,
      processed_at: addDays(now, -44),
      admin_remark: "Receipt verified for completed UAT course",
    });

    const targetModules = await Module.findAll({
      where: { course_id: completedCourse.id },
    });

    for (const mod of targetModules) {
      const targetPages = await Page.findAll({
        where: { module_id: mod.id },
      });

      for (const pg of targetPages) {
        const targetElements = await Element.findAll({
          where: { page_id: pg.id },
        });

        for (const element of targetElements) {
          const submissionMockAttributes = buildSubmission({
            enrollment_id: completedEnrollment.id,
            element_id: element.id,
            elementType: element.type as any,
            maxScore: element.score || 1,
          });

          await Submission.create({
            ...submissionMockAttributes,
            created_at: addDays(now, -10),
            updated_at: addDays(now, -10),
          });
        }
      }
    }

    const todoStartsTomorrow = await Event.create({
      user_id: createdParkGuideUser.id,
      title: "Review visitor safety checklist",
      description: "Prepare field safety notes before the next guided tour.",
      event_start_at: addDays(now, 1),
      event_end_at: addDays(now, 1),
      type: EventType.NORMAL,
      status: EventStatus.PENDING,
      period_frequency: 0,
      period_unit: "day",
    });

    await Event.bulkCreate([
      {
        user_id: createdParkGuideUser.id,
        title: "Attend mangrove restoration workshop",
        description:
          "Join the practical restoration workshop and review the field checklist.",
        event_start_at: addDays(now, 3),
        event_end_at: addDays(now, 3),
        type: EventType.WORKSHOP,
        status: EventStatus.PENDING,
        period_frequency: 0,
        period_unit: "day",
      },
      {
        user_id: createdParkGuideUser.id,
        title: "Submit completed patrol report",
        description: "Upload the final patrol notes from the previous route.",
        event_start_at: addDays(now, -3),
        event_end_at: addDays(now, -3),
        type: EventType.NORMAL,
        status: EventStatus.COMPLETED,
        period_frequency: 0,
        period_unit: "day",
      },
      {
        user_id: createdParkGuideUser.id,
        title: "Complete workshop reflection",
        description:
          "Record key takeaways from the recent conservation workshop.",
        event_start_at: addDays(now, -5),
        event_end_at: addDays(now, -5),
        type: EventType.WORKSHOP,
        status: EventStatus.COMPLETED,
        period_frequency: 0,
        period_unit: "day",
      },
    ]);

    const publicDiscussion = await Discussion.create({
      course_id: learningCourse.id,
      user_id: createdAdminUser.id,
      title: "Wildlife handling during guided tours",
      is_public: true,
    });

    const privateDiscussion = await Discussion.create({
      course_id: learningCourse.id,
      user_id: createdParkGuideUser.id,
      title: "Question about private trail briefing",
      is_public: false,
    });

    await Message.bulkCreate([
      {
        discussion_id: publicDiscussion.id,
        user_id: createdAdminUser.id,
        content:
          "Please share examples of safe wildlife observation practices from your field experience.",
      },
      {
        discussion_id: publicDiscussion.id,
        user_id: createdParkGuideUser.id,
        content:
          "I would keep visitors at a safe distance and avoid disturbing nesting areas.",
      },
      {
        discussion_id: privateDiscussion.id,
        user_id: createdParkGuideUser.id,
        content:
          "Could I get feedback on the route briefing before tomorrow's guided walk?",
      },
      {
        discussion_id: privateDiscussion.id,
        user_id: createdAdminUser.id,
        content:
          "Yes. Please emphasize weather changes, hydration, and the restricted nesting zone.",
      },
    ]);

    await Registration.create({
      user_id: null,
      reviewed_by_user_id: null,
      status: RegistrationStatus.PENDING,
      firstname: "Alya",
      lastname: "Rahman",
      identification: "UAT-REG-001",
      personal_email: "alya.rahman.uat@example.com",
      tel: "0123456789",
      document_filepath: "public\\dev\\dummy_resume.pdf",
      admin_remark: null,
      reviewed_at: null,
    });

    await Notification.bulkCreate([
      {
        user_id: createdParkGuideUser.id,
        title: "New Public Discussion",
        message: `A new discussion channel "${publicDiscussion.title}" has been created in ${learningCourse.title} Course. Check it out now!`,
        url: `/courses/${learningCourse.id}/discussion/${publicDiscussion.id}`,
        dismissed_at: null,
      },
      {
        user_id: createdParkGuideUser.id,
        title: "Enrollment Approved",
        message:
          "Your course enrollment has been approved. You can now start learning.",
        url: `/courses/${learningCourse.id}`,
        dismissed_at: null,
      },
      {
        user_id: createdParkGuideUser.id,
        title: "New Badge Awarded",
        message: `You received a new badge for completing "${completedCourse.title}".`,
        url: "/badges",
        dismissed_at: null,
      },
      {
        user_id: createdParkGuideUser.id,
        title: "Todo Starts Tomorrow",
        message: `"${todoStartsTomorrow.title}" starts on ${todoStartsTomorrow.event_start_at.toLocaleDateString()}.`,
        url: "/calendar",
        dismissed_at: null,
      },
      {
        user_id: createdParkGuideUser.id,
        title: "Course Due in 7 Days",
        message: `"${learningCourse.title}" must be completed soon.`,
        url: `/courses/${learningCourse.id}`,
        dismissed_at: null,
      },
      {
        user_id: createdAdminUser.id,
        title: "New Park Guide Registration",
        message:
          'A new park guide registration from "Alya Rahman" is awaiting review.',
        url: "/registrations",
        dismissed_at: null,
      },
      {
        user_id: createdAdminUser.id,
        title: "Payment Awaiting Approval",
        message: `A payment receipt was submitted for "${paymentCourse.title}". Please review it for approval.`,
        url: "/payments",
        dismissed_at: null,
      },
      {
        user_id: createdAdminUser.id,
        title: "New Public Discussion",
        message: `A new discussion channel "${publicDiscussion.title}" has been created in ${learningCourse.title} Course. Please review it as soon as possible.`,
        url: `/courses/${learningCourse.id}/discussion/${publicDiscussion.id}`,
        dismissed_at: null,
      },
      {
        user_id: createdAdminUser.id,
        title: "New Anomaly Detected",
        message:
          "A new anomaly event was detected and requires administrative review.",
        url: "/anomaly-events",
        dismissed_at: null,
      },
    ]);
  }
  // Seed default AR models from default_ar / default_pattern directories
  console.log("Seeding default AR models...");
  const defaultArModels = [
    {
      title: "Map",
      description: "A 3D model of a map.",
      model_path: "public/dev/map.glb",
      model_format: "glb",
      model_size_bytes: 256288,
      mime_type: "model/gltf-binary",
      original_filename: "map.glb",
      pattern_path: "public/dev/pattern-SFC_Logo.patt",
    },
    {
      title: "Plant",
      description: "A 3D model of plant.",
      model_path: "public/dev/tropical_plant.glb",
      model_format: "glb",
      model_size_bytes: 105468804,
      mime_type: "model/gltf-binary",
      original_filename: "plant.glb",
      pattern_path: "public/dev/pattern-SFC_Logo.patt",
    },
    {
      title: "Orangutan",
      description: "A 3D model of an orangutan.",
      model_path: "public/dev/orangutan_test.glb",
      model_format: "glb",
      model_size_bytes: 10323468,
      mime_type: "model/gltf-binary",
      original_filename: "orangutan_test.glb",
      pattern_path: "public/dev/pattern-SFC_Logo.patt",
    },
  ];

  for (const arModelData of defaultArModels) {
    await ArModel.create({
      ...arModelData,
      created_by_user_id: createdAdminUser.id,
    });
  }
  console.log(`✅ Seeded ${defaultArModels.length} default AR models`);

  // Seed sensors for IoT monitoring
  console.log("Seeding sensors...");
  const sensors = [
    {
      id: 1,
      name: "Fire & Smoke Detector - Park A Zone 1",
      type: "gas_temp",
      longitude: 101.6869,
      latitude: 3.139,
      location: "Kuala Lumpur City Park, Zone 1",
      current_status: SensorStatus.ALERTING,
    },
    {
      id: 2,
      name: "Motion Radar - Park A Zone 1",
      type: "motion",
      longitude: 101.6869,
      latitude: 3.139,
      location: "Kuala Lumpur City Park, Zone 1",
      current_status: SensorStatus.NORMAL,
    },
    {
      id: 3,
      name: "Acoustic Monitor - Park A Zone 1",
      type: "acoustic",
      longitude: 101.6869,
      latitude: 3.139,
      location: "Kuala Lumpur City Park, Zone 1",
      current_status: SensorStatus.NORMAL,
    },
    {
      id: 4,
      name: "Ultrasonic Level Sensor - Park A Zone 2",
      type: "ultrasonic",
      longitude: 110.3566,
      latitude: 1.5324,
      location: "Bako National Park, Zone 2",
      current_status: SensorStatus.NORMAL,
    },
    {
      id: 5,
      name: "Smoking Detector - Park A Zone 1",
      type: "gas_temp",
      longitude: 101.6869,
      latitude: 3.139,
      location: "Kuala Lumpur City Park, Zone 1",
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

  const demoIotSensor = await Sensor.findByPk(1);
  if (demoIotSensor) {
    const demoIotSensorData = {
      temperature_celsius: 86.4,
      smoke_ppm: 428,
      humidity_percent: 31,
      battery_percent: 88,
      event_type: "forest_fire",
      severity: "high",
      threshold_exceeded: ["temperature_celsius", "smoke_ppm"],
    };
    const demoIotLog = await SensorLog.create({
      sensor_id: demoIotSensor.id,
      status: SensorStatus.ALERTING,
      data: demoIotSensorData as any,
      created_at: addDays(new Date(), -1),
    });

    await AnomalyEvent.create({
      user_id: createdParkGuideUser.id,
      event_type: "forest_fire",
      location: "Bako National Park - Demo Cam Alpha",
      metadata: {
        source: "iot_sensor",
        sensor_id: demoIotSensor.id,
        sensor_name: demoIotSensor.name,
        sensor_type: demoIotSensor.type,
        sensor_status: SensorStatus.ALERTING,
        sensor_log_id: demoIotLog.id,
        sensor_data: demoIotSensorData,
        evidence_label: "IoT demo anomaly with sensor readings",
      },
      latitude: Number(demoIotSensor.latitude),
      longitude: Number(demoIotSensor.longitude),
      is_resolved: false,
      resolved_at: null,
      annotated_frame_base64: null,
      created_at: addDays(new Date(), -1),
      updated_at: addDays(new Date(), -1),
    });
    console.log("Seeded demo IoT anomaly with sensor readings");
  }
  console.log("Sensors seeded successfully");
}

export async function runDevelopmentSeeder(): Promise<void> {
  await runSeeders();
}

export default runSeeders;

// Running the seeder directly in cli
const isDirectExecution =
  typeof process.argv[1] === "string" &&
  process.argv[1].includes("DevelopmentSeeder.ts");
if (isDirectExecution) {
  runDevelopmentSeeder().catch((error: unknown) => {
    console.error("Development seeder failed:", error);
    process.exit(1);
  });
}
