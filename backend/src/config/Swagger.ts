import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

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
          required: ["username", "password", "role"],
          properties: {
            username: { type: "string", example: "john.doe" },
            password: { type: "string", example: "securepassword123" },
            role: { type: "string", example: "Park Ranger" },
            registration_id: { type: "integer", example: 10 },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "john.doe" },
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
            password: { type: "string", example: "securepassword123" },
            role: { type: "string", example: "Park Ranger" },
            identification: { type: "string", example: "S1234567" },
            personal_email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
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
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
