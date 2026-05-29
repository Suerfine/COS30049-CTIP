export const AES256_ENCRYPTED_FIELDS = {
  user: ["identification", "personal_email", "tel"],
  registration: [
    "firstname",
    "lastname",
    "identification",
    "personal_email",
    "tel",
  ],
} as const;

export const SENSITIVE_LOG_KEYWORDS = [
  "password",
  "token",
  "secret",
  "authorization",
  "firstname",
  "lastname",
  "identification",
  "personal_email",
  "email",
  "tel",
  "phone",
];
