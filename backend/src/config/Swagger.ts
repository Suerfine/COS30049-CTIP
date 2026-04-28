import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { UserRoles } from "../enum/UserRoles";
import { RegistrationStatus } from "../enum/RegistrationStatus";

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
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Registrations",
        description: "Registration management endpoints",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
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
            document: {
              type: "string",
              format: "binary",
              description: "Optional registration document file",
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
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../routes/*.js"),
    path.join(process.cwd(), "src/routes/*.ts"),
    path.join(process.cwd(), "dist/src/routes/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
