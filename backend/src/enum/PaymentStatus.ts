export enum PaymentStatus {
    PENDING = "pending",
    // After user paid the amount fee for enrollment

    PAID = "paid",
    // After admin accepted the payment

    FAILED = "failed",
    // After admin rejected the payment

    REFUNDED = "refunded",
    // After admin rejected the enrollment, it auto refund the fee
}