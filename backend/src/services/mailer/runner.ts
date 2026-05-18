/**
 * Test script for development purposes to manually send email using the
 * terminal.
 */

import readline from "readline";
import dotenv from "dotenv";
dotenv.config();
import { getMailer } from "./index";
import {
  buildRegistrationApprovedEmail,
  buildRegistrationRejectedEmail,
  buildPasswordResetEmail,
  buildPasswordChangeEmail,
} from "./templates";
import {
  RegistrationApprovalEmailInput,
  RegistrationRejectionEmailInput,
  PasswordResetEmailInput,
  RegistrationEmailInput,
} from "./MailerService";

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) =>
    rl.question(prompt, (ans) => resolve(ans.trim())),
  );
}

async function run(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Select email to send:");
  console.log("1) Registration approved");
  console.log("2) Registration rejected");
  console.log("3) Password reset");
  console.log("4) Password changed");

  const choice = await question(rl, "Enter choice (1-4): ");

  const mailer = getMailer();

  try {
    if (choice === "1") {
      const to = await question(rl, "To (email): ");
      const firstname = await question(rl, "First name: ");
      const lastname = await question(rl, "Last name: ");
      const accountEmail = await question(rl, "Account email: ");
      let password = await question(
        rl,
        "Password (type GEN to auto-generate): ",
      );
      if (password.toUpperCase() === "GEN") {
        password = mailer.generateRandomPassword();
      }

      const input: RegistrationApprovalEmailInput = {
        to,
        firstname,
        lastname,
        accountEmail,
        password,
      };

      const action =
        (await question(rl, "Preview or Send? (p/s) [p]: ")) || "p";
      if (action.toLowerCase().startsWith("p")) {
        const data = buildRegistrationApprovedEmail(input);
        console.log("Subject:", data.subject);
        console.log("HTML:\n", data.html);
      } else {
        await mailer.sendRegistrationApprovedEmail(input);
        console.log(
          "Sent registration approved email (or skipped if SMTP not configured).",
        );
      }
    } else if (choice === "2") {
      const to = await question(rl, "To (email): ");
      const firstname = await question(rl, "First name: ");
      const lastname = await question(rl, "Last name: ");
      const reason = await question(rl, "Reason (optional): ");

      const input: RegistrationRejectionEmailInput = {
        to,
        firstname,
        lastname,
        reason: reason || null,
      };

      const action =
        (await question(rl, "Preview or Send? (p/s) [p]: ")) || "p";
      if (action.toLowerCase().startsWith("p")) {
        const data = buildRegistrationRejectedEmail(input);
        console.log("Subject:", data.subject);
        console.log("HTML:\n", data.html);
      } else {
        await mailer.sendRegistrationRejectedEmail(input);
        console.log(
          "Sent registration rejected email (or skipped if SMTP not configured).",
        );
      }
    } else if (choice === "3") {
      const to = await question(rl, "To (email): ");
      const firstname = await question(rl, "First name: ");
      const lastname = await question(rl, "Last name: ");
      const resetUrl = await question(rl, "Reset URL: ");

      const input: PasswordResetEmailInput = {
        to,
        firstname,
        lastname,
        resetUrl,
      };

      const action =
        (await question(rl, "Preview or Send? (p/s) [p]: ")) || "p";
      if (action.toLowerCase().startsWith("p")) {
        const data = buildPasswordResetEmail(input);
        console.log("Subject:", data.subject);
        console.log("HTML:\n", data.html);
      } else {
        await mailer.sendPasswordResetEmail(input);
        console.log(
          "Sent password reset email (or skipped if SMTP not configured).",
        );
      }
    } else if (choice === "4") {
      const to = await question(rl, "To (email): ");
      const firstname = await question(rl, "First name: ");
      const lastname = await question(rl, "Last name: ");

      const input: RegistrationEmailInput = { to, firstname, lastname };

      const action =
        (await question(rl, "Preview or Send? (p/s) [p]: ")) || "p";
      if (action.toLowerCase().startsWith("p")) {
        const data = buildPasswordChangeEmail(input);
        console.log("Subject:", data.subject);
        console.log("HTML:\n", data.html);
      } else {
        await mailer.sendPasswordChangedEmail(input);
        console.log(
          "Sent password changed email (or skipped if SMTP not configured).",
        );
      }
    } else {
      console.log("Unknown choice. Exiting.");
    }
  } catch (err) {
    console.error("Error while sending/previewing email:", err);
  } finally {
    rl.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
