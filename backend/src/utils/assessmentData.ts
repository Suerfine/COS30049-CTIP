import { UserRoles } from "../enum/UserRoles";
import { decryptRandom, encryptRandom } from "./encryption";

const ASSESSMENT_CONTEXT = "submission.assessment_data";

export function encryptAssessmentData(data: unknown): string {
  return encryptRandom(JSON.stringify(data ?? {}), ASSESSMENT_CONTEXT);
}

export function decryptAssessmentDataForRole(
  encryptedData: string,
  role: UserRoles | undefined,
): Record<string, unknown> {
  if (role !== UserRoles.ADMIN) {
    throw new Error("Forbidden: only admins can decrypt assessment data");
  }

  const decrypted = decryptRandom(encryptedData, ASSESSMENT_CONTEXT);
  const parsed = JSON.parse(decrypted);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid assessment data format");
  }

  return parsed as Record<string, unknown>;
}
