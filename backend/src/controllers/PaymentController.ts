import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { paginateModel, formatPaginateResponse } from "../utils/paginate";
import { NextFunction, Request, Response } from "express";
import { Payment, Enrollment, User, Course } from "../models";
import sequelize from "../config/Database";
import { PaymentStatus } from "../enum/PaymentStatus";
import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import { UserRoles } from "../enum/UserRoles";
import {
  parseId,
  parseNumberField,
  parseOptionalText,
} from "../utils/parseRequest";
import { sendNotification } from "../utils/sendNotification";
import { NotificationCategory } from "../enum/NotificationCategory";
import { DiskStorageService } from "../services/storage/DiskStorageService";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function resolveStoredReceiptPath(storedPath: string): string | null {
  const backendRoot = path.resolve(__dirname, "../..");
  const allowedRoots = [
    path.resolve(backendRoot, "uploads"),
    path.resolve(backendRoot, "storage"),
  ];

  const normalizedStoredPath = storedPath
    .replace(/^https?:\/\/[^/]+\/?/i, "")
    .replace(/^\/+/, "");

  const candidates = [
    path.resolve(backendRoot, normalizedStoredPath),
    path.resolve(backendRoot, "storage", normalizedStoredPath),
  ];

  return (
    candidates.find((candidate) => {
      const isAllowed = allowedRoots.some(
        (root) =>
          candidate === root || candidate.startsWith(`${root}${path.sep}`),
      );
      return isAllowed && fs.existsSync(candidate);
    }) ?? null
  );
}

async function validatePayment(paymentIdRaw: string): Promise<Payment> {
  const paymentId = parseId(paymentIdRaw);
  if (paymentId === null) {
    throw new HttpError(400, "Invalid payment_id");
  }

  const payment = await Payment.findByPk(paymentId, {
    include: ["enrollment"],
  });

  if (!payment) {
    throw new HttpError(404, "Payment record not found");
  }

  return payment;
}

export const submitPayment = async (
  req: Request & { file?: { path: string } },
  res: Response,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    const enrollmentId = parseId(req.body.enrollment_id);
    const file = req.file;

    if (!enrollmentId) {
      throw new HttpError(400, "enrollment_id is required");
    }

    if (!file) {
      throw new HttpError(400, "receipt file is required");
    }

    const enrollment = await Enrollment.findByPk(enrollmentId, {
      include: [{ model: Course, as: "course" }],
      transaction,
    });

    if (!enrollment || !enrollment.course) {
      throw new HttpError(404, "Enrollment or Course not found");
    }

    const payment = await Payment.create(
      {
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        enrollment_id: enrollmentId,
        amount: enrollment.course.cost,

        receipt_filepath: file.path,

        status: PaymentStatus.PENDING,
      },
      { transaction },
    );

    await enrollment.update(
      {
        status: EnrollmentStatus.PENDING_PAYMENT,
      },
      { transaction },
    );

    await sendNotification(
      "admin",
      "Payment Awaiting Approval",
      `A payment receipt was submitted for "${enrollment.course.title}". Please review it for approval.`,
      transaction,
      undefined,
      false,
      NotificationCategory.PAYMENT_APPROVAL,
      "/payments",
    );

    await transaction.commit();

    return res.status(201).json(payment);
  } catch (err) {
    await transaction.rollback();
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const verifyPayment = async (
  req: Request<{ payment_id: string; status: string }>,
  res: Response,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    const payment = await validatePayment(req.params.payment_id);
    const statusFromUrl = req.params.status as PaymentStatus;

    const adminId = req.user?.id;
    const adminRemark = parseOptionalText(req.body.admin_remark);

    if (!adminId) {
      throw new HttpError(400, "admin_id is required for verification");
    }

    if (!Object.values(PaymentStatus).includes(statusFromUrl)) {
      throw new HttpError(400, "Invalid payment status provided in URL");
    }

    await payment.update(
      {
        status: statusFromUrl,
        admin_remark: adminRemark ?? null,
        processed_by_user_id: adminId,
        processed_at: new Date(),
      },
      { transaction },
    );

    const enrollment = await Enrollment.findByPk(payment.enrollment_id, {
      transaction,
    });
    if (!enrollment) {
      throw new HttpError(404, "Associated enrollment not found");
    }

    const newEnrollmentStatus =
      statusFromUrl === PaymentStatus.PAID
        ? EnrollmentStatus.APPLIED
        : EnrollmentStatus.REJECTED;

    await enrollment.update(
      {
        status: newEnrollmentStatus,
        enrolled_at:
          statusFromUrl === PaymentStatus.PAID
            ? new Date()
            : enrollment.enrolled_at,
      },
      { transaction },
    );

    if (statusFromUrl === PaymentStatus.PAID) {
      await sendNotification(
        "single",
        "Enrollment Approved",
        "Your course enrollment has been approved. You can now start learning.",
        transaction,
        enrollment.user_id,
        false,
        NotificationCategory.ENROLLMENT_SUCCESS,
        `/courses/${enrollment.course_id}`,
      );
    } else if (statusFromUrl === PaymentStatus.FAILED) {
      await sendNotification(
        "single",
        "Payment unsuccessful",
        adminRemark
          ? `Your payment was unsuccessful due to ${adminRemark}`
          : "Your payment was unsuccessful.",
        transaction,
        enrollment.user_id,
        false,
        NotificationCategory.PAYMENT_REJECTED,
        `/payments`,
      );
    }

    await transaction.commit();
    return res.json({
      message: `Payment verified as ${statusFromUrl} and Enrollment set to ${newEnrollmentStatus}`,
      payment,
    });
  } catch (err: any) {
    console.error("VERIFY PAYMENT ERROR:");
    console.error(err);
    console.error(err.message);
    console.error(err.parent);
    await transaction.rollback();
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const getAllPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;
    const status =
      typeof req.query.status === "string" ? req.query.status : "All";
    const whereClause: any = {};

    if (status !== "All") {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { "$user.firstname$": { [Op.like]: `%${search}%` } },
        { "$user.lastname$": { [Op.like]: `%${search}%` } },
        { "$course.course_code$": { [Op.like]: `%${search}%` } },
        { "$course.title$": { [Op.like]: `%${search}%` } },
      ];
    }

    const results = await paginateModel(
      Payment,
      { ...req.query },
      {
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstname", "lastname", "personal_email", "pfp_url"],
          },
          {
            model: Course,
            as: "course",
            attributes: ["id", "title"],
          },
        ],
        paranoid: true,
        subQuery: false,
      },
    );

    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;

    const formattedResponse = formatPaginateResponse(
      results.data.map((payment: any) => {
        const user = payment.user;
        const course = payment.course;

        return {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          receipt_filepath: payment.receipt_filepath
            ? `${req.protocol}://${req.get("host")}/${payment.receipt_filepath.replace(/^\/+/, "")}`
            : null,
          created_at: payment.created_at,
          admin_remark: payment.admin_remark,
          processed_at: payment.processed_at,
          processed_by_user_id: payment.processed_by_user_id,

          user_fullname: user
            ? `${user.firstname} ${user.lastname}`
            : "Unknown User",
          user_email: user?.personal_email,
          user_profile_img: user?.document_filepath,

          course_code: course?.course_code,
          course_title: course?.title,

          enrollment_id: payment.enrollment_id,
        };
      }),
      req.query,
      true,
      {
        page: results.page,
        size: results.size,
        totalElements: results.totalElements,
        totalPages: results.totalPages,
        baseUrl,
      },
    );

    return res.status(200).json(formattedResponse);
  } catch (err: any) {
    console.error("Payment List Fetch Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPaymentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      throw new HttpError(400, "Invalid payment_id");
    }

    const payment = await Payment.findByPk(id, {
      include: ["user", "course", "enrollment"],
    });

    if (!payment) {
      throw new HttpError(404, "Payment record not found");
    }

    return res.json(payment);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const downloadReceipt = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      throw new HttpError(400, "Invalid payment_id");
    }

    const payment = await Payment.findByPk(id);
    if (!payment) {
      throw new HttpError(404, "Payment record not found");
    }

    const isAdmin = req.user?.role === UserRoles.ADMIN;
    const isOwner = Number(req.user?.id) === Number(payment.user_id);
    if (!isAdmin && !isOwner) {
      throw new HttpError(403, "You are not allowed to download this receipt");
    }

    if (!payment.receipt_filepath) {
      throw new HttpError(404, "Receipt file not found");
    }

    const filePath = resolveStoredReceiptPath(payment.receipt_filepath);

    if (!filePath) {
      throw new HttpError(404, "Receipt file not found");
    }

    return res.download(filePath);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const getPaymentsByUser = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = parseId(req.params.userId);

    if (userId === null) {
      throw new HttpError(400, "Invalid user_id");
    }

    const payments = await Payment.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });

    return res.json(payments);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const getReceiptFile = async (
  req: Request<{ paymentId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const paymentId = parseId(req.params.paymentId);
    if (paymentId === null) {
      throw new HttpError(400, "Invalid payment_id");
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new HttpError(404, "Payment record not found");
    }

    if (!payment.receipt_filepath) {
      throw new HttpError(404, "Receipt file not found for this payment");
    }
    const storageService = new DiskStorageService();
    const fileExists = await storageService.exists(payment.receipt_filepath);
    if (!fileExists) {
      throw new HttpError(404, "Receipt file does not exist on server");
    }

    const fileBuffer = await storageService.retrieve(payment.receipt_filepath);
    const originalFilename = path.basename(payment.receipt_filepath);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalFilename}"`,
    );
    res.type(path.extname(originalFilename));
    return res.send(fileBuffer);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("Error retrieving receipt file:", err);
    next(err);
  }
};
