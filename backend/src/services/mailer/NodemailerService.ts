import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  MailerService,
  RegistrationEmailInput,
  RegistrationApprovalEmailInput,
  RegistrationRejectionEmailInput,
  PasswordResetEmailInput,
} from "./MailerService";
import {
  buildRegistrationApprovedEmail,
  buildRegistrationRejectedEmail,
  buildPasswordResetEmail,
  buildPasswordChangeEmail,
} from "./templates";
import dotenv from "dotenv";
dotenv.config();

function isTestingMode(): boolean {
  return process.env.NODE_ENV === "test" || process.env.TESTING_MODE === "true";
}

function getMailerConfig() {
  if (isTestingMode()) {
    return null;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
    from,
  };
}

export class NodemailerService implements MailerService {
  private transporter: ReturnType<typeof nodemailer.createTransport> | null;
  private from: string | null;

  constructor() {
    const config = getMailerConfig();

    if (!config) {
      this.transporter = null;
      this.from = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      });
      this.from = config.from;
    }
  }

  generateRandomPassword(): string {
    return `SFC-${crypto.randomBytes(6).toString("base64url")}`;
  }

  generateSfcEmail(userId: string | number): string {
    return `${userId}@sfc.gov.my`;
  }

  async sendRegistrationApprovedEmail(
    input: RegistrationApprovalEmailInput,
  ): Promise<void> {
    if (!this.transporter || !this.from) {
      console.warn(
        "SMTP is not configured; skipped registration approval email.",
      );
      return;
    }

    const email_data = buildRegistrationApprovedEmail(input);
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: email_data.subject,
      html: email_data.html,
    });
  }

  async sendRegistrationRejectedEmail(
    input: RegistrationRejectionEmailInput,
  ): Promise<void> {
    if (!this.transporter || !this.from) {
      console.warn(
        "SMTP is not configured; skipped registration rejection email.",
      );
      return;
    }

    const email_data = buildRegistrationRejectedEmail(input);
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: email_data.subject,
      html: email_data.html,
    });
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    if (!this.transporter || !this.from) {
      console.warn("SMTP is not configured; skipped password reset email.");
      return;
    }

    const email_data = buildPasswordResetEmail(input);
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: email_data.subject,
      html: email_data.html,
    });
  }

  async sendPasswordChangedEmail(input: RegistrationEmailInput): Promise<void> {
    if (!this.transporter || !this.from) {
      console.warn("SMTP is not configured; skipped password changed email.");
      return;
    }

    const email_data = buildPasswordChangeEmail(input);
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: email_data.subject,
      html: email_data.html,
    });
  }
}
