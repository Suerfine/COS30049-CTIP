/**
 * Checks if a user can enroll in a unit based on their current enrollments and the unit's prerequisites.
 */
import { User } from "../models";

export async function canEnrollUnit(
  user: User,
  unitId: number,
): Promise<boolean> {
  // TODO: Implement logic to check if the user meets the prerequisites for the unit
  return true;
}
