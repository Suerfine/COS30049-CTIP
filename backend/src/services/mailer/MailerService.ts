export type RegistrationEmailInput = {
  to: string;
  firstname: string;
  lastname: string;
};

export type RegistrationApprovalEmailInput = RegistrationEmailInput & {
  accountEmail: string;
  password: string;
};

export type RegistrationRejectionEmailInput = RegistrationEmailInput & {
  reason?: string | null;
};

export type PasswordResetEmailInput = RegistrationEmailInput & {
  resetUrl: string;
};

export type EmailData = {
  html: string;
  subject: string;
};

export interface MailerService {
  sendRegistrationApprovedEmail(
    input: RegistrationApprovalEmailInput,
  ): Promise<void>;
  sendRegistrationRejectedEmail(
    input: RegistrationRejectionEmailInput,
  ): Promise<void>;
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
  sendPasswordChangedEmail(input: RegistrationEmailInput): Promise<void>;
  generateRandomPassword(): string;
  generateSfcEmail(userId: string | number): string;
}
