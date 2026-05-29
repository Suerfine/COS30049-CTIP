import { faker } from "@faker-js/faker";
import { PaymentStatus } from "../../src/enum/PaymentStatus";

export type PaymentFactoryInput = {
  user_id: number;
  course_id: number;
  enrollment_id: number;
  amount: number;
};

export const buildPayment = (input: PaymentFactoryInput) => {
  return {
    user_id: input.user_id,
    course_id: input.course_id,
    enrollment_id: input.enrollment_id,
    amount: input.amount,
    receipt_filepath: "public/dev/seed_receipt.jpg",
    status: PaymentStatus.PENDING,
    admin_remark: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
};