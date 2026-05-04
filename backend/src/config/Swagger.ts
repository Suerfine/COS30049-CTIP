import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { CourseStatus } from "../enum/CourseStatus";
import { UserRoles } from "../enum/UserRoles";
import { RegistrationStatus } from "../enum/RegistrationStatus";
import { auth } from "../middelware/Auth";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "COS30049 CTIP API",
      version: "1.0.0",
      description: "API documentation for the CTIP backend service.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Registrations",
        description: "Registration management endpoints",
      },
      {
        name: "Courses",
        description: "Course management endpoints",
      },
      {
        name: "Modules",
        description: "Module management endpoints",
      },
      {
        name: "Pages",
        description: "Page management endpoints",
      },
      {
        name: "Elements",
        description: "Element management endpoints",
      },
    ],
    components: {
      securitySchemes: {
        OAuth2: {
          type: "oauth2",
          flows: {
            password: {
              tokenUrl: "/api/token",
              scopes: {
                all: "Access to all protected resources",
              },
            },
          },
        },
      },
      schemas: {
        CreateUserRequest: {
          type: "object",
          required: [
            "username",
            "firstname",
            "lastname",
            "password",
            "role",
            "identification",
            "personal_email",
            "tel",
          ],
          properties: {
            username: { type: "string", example: "john.doe" },
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            password: { type: "string", example: "securepassword123" },
            role: {
              type: "string",
              enum: Object.values(UserRoles),
              example: UserRoles.PARK_GUIDE,
            },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            tel: { type: "string", maxLength: 30, example: "+610412345678" },
            pfp: {
              type: "string",
              format: "binary",
              description: "Optional profile image file",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "john.doe" },
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            role: { type: "string", example: "ADMIN" },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            tel: { type: "string", maxLength: 30, example: "+610412345678" },
            last_login_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-04-24T08:00:00.000Z",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            username: { type: "string", example: "john.doe" },
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            password: { type: "string", example: "securepassword123" },
            role: {
              type: "string",
              enum: Object.values(UserRoles),
              example: UserRoles.PARK_GUIDE,
            },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            tel: { type: "string", maxLength: 30, example: "+610412345678" },
            pfp: {
              type: "string",
              format: "binary",
              description: "Optional profile image file",
            },
          },
        },
        Registration: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            user_id: { type: "integer", nullable: true },
            reviewed_by_user_id: {
              type: "integer",
              nullable: true,
              example: 1,
            },
            status: {
              type: "string",
              enum: Object.values(RegistrationStatus),
              example: RegistrationStatus.PENDING,
            },
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            tel: { type: "string", example: "+610412345678" },
            document_filepath: {
              type: "string",
              nullable: true,
              example:
                "C:/Users/User/Documents/COS30049-CTIP/backend/storage/uploads/private/registrations/8b89f43a-9bb4-47ca-a269-f0554e651067.pdf",
            },
            admin_remark: {
              type: "string",
              nullable: true,
              example: "Pending identity verification",
            },
            reviewed_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-04-24T08:00:00.000Z",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        CreateRegistrationRequest: {
          type: "object",
          required: [
            "firstname",
            "lastname",
            "identification",
            "personal_email",
            "tel",
          ],
          properties: {
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            tel: { type: "string", example: "+610412345678" },
            document: {
              type: "string",
              format: "binary",
              description: "Optional registration document file",
            },
          },
        },
        UpdateRegistrationRequest: {
          type: "object",
          properties: {
            user_id: { type: "integer", example: 2 },
            reviewed_by_user_id: {
              type: "integer",
              nullable: true,
              example: 1,
            },
            status: {
              type: "string",
              enum: Object.values(RegistrationStatus),
              example: RegistrationStatus.APPROVED,
            },
            firstname: { type: "string", example: "John" },
            lastname: { type: "string", example: "Doe" },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            tel: { type: "string", example: "+610412345678" },
            document: {
              type: "string",
              format: "binary",
              description: "Optional registration document file",
            },
            admin_remark: {
              type: "string",
              nullable: true,
              example: "Approved",
            },
            reviewed_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        Course: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Wildlife Safety Basics" },
            description: {
              type: "string",
              nullable: true,
              example: "Introduction to wildlife safety procedures.",
            },
            status: {
              type: "string",
              enum: Object.values(CourseStatus),
              example: CourseStatus.UNRELEASED,
            },
            released_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: null,
            },
            expected_completion_weeks: {
              type: "integer",
              nullable: true,
              example: 6,
            },
            must_complete_in_weeks: {
              type: "integer",
              nullable: true,
              example: 8,
            },
            badge_expire_in_months: {
              type: "integer",
              example: 24,
            },
            badge_path_id: {
              type: "string",
              nullable: true,
              example:
                "C:/Users/User/Documents/COS30049-CTIP/backend/storage/uploads/private/courses/badges/8b89f43a-9bb4-47ca-a269-f0554e651067.png",
            },
            prerequisite_groups: {
              type: "array",
              items: {
                $ref: "#/components/schemas/PrerequisiteGroup",
              },
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        Prerequisite: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            course_id: { type: "integer", example: 2 },
            prerequisite_group_id: { type: "integer", example: 1 },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        PrerequisiteGroup: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            course_id: { type: "integer", example: 10 },
            prerequisites: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Prerequisite",
              },
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        CreateCourseRequest: {
          type: "object",
          required: ["title", "badge"],
          properties: {
            title: { type: "string", example: "Wildlife Safety Basics" },
            description: {
              type: "string",
              nullable: true,
              example: "Introduction to wildlife safety procedures.",
            },
            expected_completion_weeks: {
              type: "integer",
              example: 6,
            },
            must_complete_in_weeks: {
              type: "integer",
              example: 8,
            },
            badge_expire_in_months: {
              type: "integer",
              example: 24,
            },
            prerequisite_course_ids: {
              type: "array",
              description:
                "Array of prerequisite groups. Each inner array represents OR logic; groups represent AND logic.",
              items: {
                type: "array",
                items: {
                  type: "integer",
                  example: 2,
                },
              },
              example: [[2, 3], [4]],
            },
            badge: {
              type: "string",
              format: "binary",
              description: "Course badge image file",
              nullable: false,
              MimeTypeArray: ["image/jpeg", "image/png", "image/gif"],
              required: true,
            },
            cover: {
              type: "string",
              format: "binary",
              description: "Course cover image file",
              nullable: false,
              MimeTypeArray: ["image/jpeg", "image/png", "image/gif"],
              required: true,
            },
          },
        },
        UpdateCourseRequest: {
          type: "object",
          properties: {
            title: { type: "string", example: "Advanced Wildlife Safety" },
            description: {
              type: "string",
              nullable: true,
              example: "Updated course description.",
            },
            status: {
              type: "string",
              enum: Object.values(CourseStatus),
              example: CourseStatus.RELEASED,
            },
            released_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-04-24T08:00:00.000Z",
            },
            expected_completion_weeks: {
              type: "integer",
              nullable: true,
              example: 7,
            },
            must_complete_in_weeks: {
              type: "integer",
              nullable: true,
              example: 10,
            },
            badge_expire_in_months: {
              type: "integer",
              example: 24,
            },
            prerequisite_course_ids: {
              type: "array",
              description:
                "Array of prerequisite groups. Each inner array represents OR logic; groups represent AND logic.",
              items: {
                type: "array",
                items: {
                  type: "integer",
                  example: 2,
                },
              },
              example: [[2, 3], [4]],
            },
            badge: {
              type: "string",
              format: "binary",
              description: "Course badge image file",
            },
            cover: {
              type: "string",
              format: "binary",
              description: "Course cover image file",
            },
          },
        },
        Module: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            course_id: { type: "integer", example: 10 },
            order: { type: "integer", example: 1 },
            title: { type: "string", example: "Introduction" },
            description: {
              type: "string",
              nullable: true,
              example: "Overview of this course module.",
            },
            complete_by_week: { type: "integer", example: 2 },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        CreateModuleRequest: {
          type: "object",
          required: ["order", "title", "complete_by_week"],
          properties: {
            order: {
              type: "integer",
              example: 1,
              description: "Display order of the module within a course.",
            },
            title: { type: "string", example: "Introduction" },
            description: {
              type: "string",
              nullable: true,
              example: "Overview and learning outcomes.",
            },
            complete_by_week: {
              type: "integer",
              example: 2,
              description: "Recommended completion week for this module.",
            },
          },
        },
        UpdateModuleRequest: {
          type: "object",
          properties: {
            order: {
              type: "integer",
              example: 2,
              description: "Updated display order within the course.",
            },
            title: { type: "string", example: "Module Introduction" },
            description: {
              type: "string",
              nullable: true,
              example: "Updated module description.",
            },
            complete_by_week: {
              type: "integer",
              example: 3,
              description: "Updated recommended completion week.",
            },
          },
        },
        Page: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            module_id: { type: "integer", example: 10 },
            order: { type: "integer", example: 1 },
            title: { type: "string", example: "Quiz" },
            description: {
              type: "string",
              nullable: true,
              example: "Final assessment quiz.",
            },
            passing_score: { type: "integer", example: 70 },
            max_tries: {
              type: "integer",
              nullable: true,
              example: 3,
            },
            final_quiz: {
              type: "boolean",
              example: true,
              description: "Whether this page is a final quiz.",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        CreatePageRequest: {
          type: "object",
          required: ["order", "title", "passing_score"],
          properties: {
            order: {
              type: "integer",
              example: 1,
              description: "Display order of the page within a module.",
            },
            title: { type: "string", example: "Quiz" },
            description: {
              type: "string",
              nullable: true,
              example: "Final assessment quiz.",
            },
            passing_score: {
              type: "integer",
              example: 70,
              description: "Minimum score required to pass this page.",
            },
            max_tries: {
              type: "integer",
              nullable: true,
              example: 3,
              description: "Maximum number of attempts allowed.",
            },
            final_quiz: {
              type: "boolean",
              example: true,
              description: "Whether this page is a final quiz.",
            },
          },
        },
        UpdatePageRequest: {
          type: "object",
          properties: {
            order: {
              type: "integer",
              example: 2,
              description: "Updated display order within the module.",
            },
            title: { type: "string", example: "Final Assessment" },
            description: {
              type: "string",
              nullable: true,
              example: "Updated page description.",
            },
            passing_score: {
              type: "integer",
              example: 75,
              description: "Updated minimum passing score.",
            },
            max_tries: {
              type: "integer",
              nullable: true,
              example: 5,
              description: "Updated maximum number of attempts.",
            },
            final_quiz: {
              type: "boolean",
              example: false,
              description: "Whether this page is a final quiz.",
            },
          },
        },
        Element: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            page_id: { type: "integer", example: 10 },
            order: { type: "integer", example: 1 },
            type: {
              type: "string",
              enum: ["text", "image", "video", "file", "quiz_objective"],
              example: "text",
              description: "Type of element.",
            },
            content: {
              type: "object",
              example: {
                text: "Element content",
              },
              description: "JSON content of the element.",
            },
            score: {
              type: "integer",
              nullable: true,
              example: 10,
              description: "Points associated with this element.",
            },
            file_id: {
              type: "string",
              nullable: true,
              example: "550e8400-e29b-41d4-a716-446655440000",
              description:
                "UUID of the uploaded file (internal use only, read-only)",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-24T08:00:00.000Z",
            },
          },
        },
        CreateElementRequest: {
          type: "object",
          required: ["order", "type", "content"],
          properties: {
            order: {
              type: "integer",
              example: 1,
              description: "Display order of the element within a page.",
            },
            type: {
              type: "string",
              enum: ["text", "image", "video", "file", "quiz_objective"],
              example: "text",
              description: "Type of element.",
            },
            content: {
              type: "string",
              example: '{"text":"Element content"}',
              description:
                "JSON content of the element, sent as a JSON string in form-data.",
            },
            score: {
              type: "integer",
              nullable: true,
              example: 10,
              description: "Points associated with this element.",
            },
            file: {
              type: "string",
              format: "binary",
              description: "Optional document file for FILE type elements.",
            },
          },
        },
        UpdateElementRequest: {
          type: "object",
          properties: {
            order: {
              type: "integer",
              example: 2,
              description: "Updated display order within the page.",
            },
            content: {
              type: "string",
              example: '{"text":"Updated element content"}',
              description:
                "Updated JSON content of the element, sent as a JSON string in form-data.",
            },
            score: {
              type: "integer",
              nullable: true,
              example: 15,
              description: "Updated points associated with this element.",
            },
            file: {
              type: "string",
              format: "binary",
              description:
                "Optional updated document file for FILE type elements.",
            },
          },
        },
        BulkCreateElementRequest: {
          type: "object",
          required: ["elements"],
          properties: {
            elements: {
              type: "array",
              items: {
                $ref: "#/components/schemas/CreateElementRequest",
              },
              description: "Array of elements to create.",
            },
          },
        },
        BulkUpdateElementRequest: {
          type: "object",
          required: ["elements"],
          properties: {
            elements: {
              type: "array",
              items: {
                type: "object",
                required: ["id"],
                properties: {
                  id: {
                    type: "integer",
                    example: 1,
                    description: "ID of the element to update.",
                  },
                  order: {
                    type: "integer",
                    example: 2,
                    description: "Updated display order.",
                  },
                  content: {
                    type: "string",
                    example: '{"text":"Updated content"}',
                    description:
                      "Updated JSON content, sent as a JSON string in form-data.",
                  },
                  score: {
                    type: "integer",
                    nullable: true,
                    description: "Updated points.",
                  },
                },
              },
              description: "Array of elements to update.",
            },
          },
        },
        RejectRegistrationRequest: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              example: "Identity documents were incomplete.",
            },
          },
        },
        ApproveRegistrationResponse: {
          type: "object",
          properties: {
            registration: {
              $ref: "#/components/schemas/Registration",
            },
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 2 },
                username: { type: "string", example: "johndoe" },
                firstname: { type: "string", example: "John" },
                lastname: { type: "string", example: "Doe" },
                identification: { type: "string", example: "S1234567" },
                personal_email: {
                  type: "string",
                  format: "email",
                  example: "john.doe@example.com",
                },
                role: {
                  type: "string",
                  example: UserRoles.PARK_GUIDE,
                },
                created_at: {
                  type: "string",
                  format: "date-time",
                  example: "2026-04-24T08:00:00.000Z",
                },
                updated_at: {
                  type: "string",
                  format: "date-time",
                  example: "2026-04-24T08:00:00.000Z",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "User not found" },
          },
        },
      },
    },
    security: [{ OAuth2: ["all"] }],
  },
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../routes/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
