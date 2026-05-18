import { NodemailerService } from "./NodemailerService";
import { MailerService } from "./MailerService";

let mailer: MailerService;

export const getMailer = (): MailerService => {
  if (!mailer) {
    mailer = new NodemailerService();
  }
  return mailer;
};

export { NodemailerService } from "./NodemailerService";
export type {
  MailerService,
  RegistrationEmailInput,
  RegistrationApprovalEmailInput as ApprovalEmailInput,
  RegistrationRejectionEmailInput as RejectionEmailInput,
  PasswordResetEmailInput,
} from "./MailerService";
