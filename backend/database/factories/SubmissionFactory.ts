import { faker } from "@faker-js/faker";

export type SubmissionFactoryAttributes = {
  id?: number;
  enrollment_id: number;
  element_id: number;
  submission_id?: number | null;
  marked_by_user_id?: number | null;
  content: Record<string, unknown>;
  marking_remark?: string | null;
  earned_grade: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type SubmissionFactoryInput = Partial<SubmissionFactoryAttributes> & {
  enrollment_id: number;
  element_id: number;
  elementType: "text" | "image" | "video" | "quiz_objective" | "workshop";
  maxScore: number;
};

/**
 * Builds a clean mock submission record tailored directly to the Element Type
 */
export const buildSubmission = (
  input: SubmissionFactoryInput,
): SubmissionFactoryAttributes => {
  const { enrollment_id, element_id, elementType, maxScore, ...overrides } = input;

  let contentData: Record<string, unknown> = {};
  let earnedGrade = 0;
  let remark: string | null = null;

  // Generate realistic historical metadata based on element behaviors
  switch (elementType) {
    case "text":
    case "image":
      contentData = { viewed: true, duration_seconds: faker.number.int({ min: 10, max: 120 }) };
      earnedGrade = maxScore; // Viewing structural blocks grants full baseline points
      break;

    case "video":
      contentData = { watched: true, completed: true, continuous_playback: true };
      earnedGrade = maxScore;
      break;

    case "quiz_objective":
      contentData = {
        selected: "Option A", // Placeholder variant option
        isCorrect: true,     // Force correctness for the "Completed" scenario pathway
      };
      earnedGrade = maxScore;
      remark = "Automated correct factory check";
      break;

    case "workshop":
      contentData = {
        user_id: faker.number.int({ min: 1, max: 50 }),
        session_date: faker.date.future().toLocaleDateString(),
        session_time: "09:00 AM — 12:00 PM",
        location: "Kubah National Park HQ",
        auto_add_todo: true,
      };
      earnedGrade = maxScore;
      break;

    default:
      contentData = { completed: true };
      earnedGrade = maxScore;
  }

  const defaultSubmission: SubmissionFactoryAttributes = {
    enrollment_id,
    element_id,
    submission_id: null,
    marked_by_user_id: null,
    content: contentData,
    marking_remark: remark,
    earned_grade: earnedGrade,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return {
    ...defaultSubmission,
    ...overrides,
  };
};

export default {
  buildSubmission,
};