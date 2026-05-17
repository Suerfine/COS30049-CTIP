import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import {
  Course,
  CourseTag,
  Enrollment,
  Prerequisite,
  PrerequisiteGroup,
  Tag,
  User,
  Module,
} from "../models";
import sequelize from "../config/Database";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { CourseStatus } from "../enum/CourseStatus";
import {
  CourseResponse,
  CreateCourseRequest,
  PrerequisiteGroupResponse,
  PrerequisiteResponse,
  UpdateCourseRequest,
  UserCourseEnrollmentResponse,
} from "../types/Course";
import { ErrorResponse } from "../types/common";
import { getStorage } from "../services/storage";
import { logger } from "../utils/logger";
import { canUserEnrollCourse } from "../utils/canUserEnrollCourse";
import { EnrollmentResponse } from "../types/Enrollment";
import { fn, col } from "sequelize";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toCourseResponse(course: Course, req?: Request<any>): CourseResponse {
  const tagsRaw =
    ((course.toJSON() as { tags?: unknown }).tags as
      | Array<{
          id: number;
          title: string;
          type: string;
        }>
      | undefined) ?? [];
  const tags = tagsRaw.map((tag) => ({
    id: tag.id,
    title: tag.title,
    type: tag.type,
  }));

  const prerequisiteGroupsRaw =
    ((course.toJSON() as { prerequisite_groups?: unknown })
      .prerequisite_groups as
      | Array<{
          id: number;
          course_id: number;
          created_at: Date;
          updated_at: Date;
          prerequisites?: Array<{
            id: number;
            course_id: number;
            prerequisite_group_id: number;
            created_at: Date;
            updated_at: Date;
          }>;
        }>
      | undefined) ?? [];

  const prerequisite_groups: PrerequisiteGroupResponse[] =
    prerequisiteGroupsRaw.map((group) => {
      const prerequisites: PrerequisiteResponse[] = (
        group.prerequisites ?? []
      ).map((prerequisite) => ({
        id: prerequisite.id,
        course_id: prerequisite.course_id,
        prerequisite_group_id: prerequisite.prerequisite_group_id,
        created_at: prerequisite.created_at,
        updated_at: prerequisite.updated_at,
      }));

      return {
        id: group.id,
        course_id: group.course_id,
        created_at: group.created_at,
        updated_at: group.updated_at,
        prerequisites,
      };
    });

  // TODO: Calculate final_quiz_max_score, total_max_score based on user's quiz attempts and course modules when that functionality is implemented. For now, we will set them to random values and some Mock data.
  const final_quiz_max_score = 100;
  const total_max_score = 100;

  const badge_url =
    req && course.badge_img_path
      ? `${req.protocol}://${req.get("host")}${course.badge_img_path.startsWith("/") ? course.badge_img_path : `/${course.badge_img_path}`}`
      : null;
  const cover_url =
    req && course.cover_img_path
      ? `${req.protocol}://${req.get("host")}${course.cover_img_path.startsWith("/") ? course.cover_img_path : `/${course.cover_img_path}`}`
      : null;

  const module_count =
    Number((course as any).dataValues?.module_count ?? 0);

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    status: course.status,
    released_at: course.released_at,
    cost: Number(course.cost || 0),
    expected_completion_weeks: course.expected_completion_weeks,
    must_complete_in_weeks: course.must_complete_in_weeks,
    badge_expire_in_months: course.badge_expire_in_months,
    badge_img_url: badge_url,
    cover_img_url: cover_url,
    tags,
    prerequisite_groups,
    module_count,
    created_at: course.created_at,
    updated_at: course.updated_at,
    final_quiz_max_score: final_quiz_max_score,
    total_max_score: total_max_score,
  };
}

const COURSE_PREREQUISITE_INCLUDE = [
  {
    model: Tag,
    as: "tags",
    through: { attributes: [] },
  },
  {
    model: PrerequisiteGroup,
    as: "prerequisite_groups",
    include: [
      {
        model: Prerequisite,
        as: "prerequisites",
      },
    ],
  },
];

function parseCourseStatus(status: unknown): CourseStatus | undefined {
  if (status === undefined || status === null || status === "") {
    return undefined;
  }

  if (typeof status !== "string") {
    throw new Error("Course status must be a string");
  }

  if (!Object.values(CourseStatus).includes(status as CourseStatus)) {
    throw new Error("Invalid course status");
  }

  return status as CourseStatus;
}

function parseCourseReleasedAt(releasedAt: unknown): Date | null | undefined {
  if (releasedAt === undefined) {
    return undefined;
  }

  if (releasedAt === null || releasedAt === "") {
    return null;
  }

  const parsedDate =
    releasedAt instanceof Date ? releasedAt : new Date(String(releasedAt));

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("released_at must be a valid date");
  }

  return parsedDate;
}

/**
 * Helper function to validate the structure of prerequisite_course_ids input.
 * @param prerequisite_course_ids - The input to validate, expected to be a flat array of numbers (works like tag_ids).
 * @throws Will throw an error if the input is not in the expected format.
 */
async function _verify_prerequisite_course_ids_input(
  prerequisite_course_ids: unknown,
): Promise<void> {
  logger.debug("Verifying prerequisite course IDs", {
    prerequisite_course_ids,
  });

  if (typeof prerequisite_course_ids === "string") {
    const trimmed = prerequisite_course_ids.trim();
    if (trimmed === "") {
      prerequisite_course_ids = [];
    } else if (trimmed.startsWith("[")) {
      prerequisite_course_ids = JSON.parse(trimmed);
    } else if (trimmed.includes(",")) {
      prerequisite_course_ids = trimmed
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p !== "");
    } else {
      prerequisite_course_ids = [trimmed];
    }
  }

  if (!Array.isArray(prerequisite_course_ids)) {
    const error = "prerequisite_course_ids must be an array";
    logger.warn(error);
    throw new Error(error);
  }

  // Normalize to numbers and ensure uniqueness
  const ids = prerequisite_course_ids.map((id) => Number(id));
  for (const id of ids) {
    if (!Number.isInteger(id) || id <= 0) {
      const error = `Each course ID in prerequisite_course_ids must be a positive integer: ${id}`;
      logger.warn(error);
      throw new Error(error);
    }
  }

  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length !== ids.length) {
    const error = "prerequisite_course_ids must contain unique course IDs";
    logger.warn(error);
    throw new Error(error);
  }

  // Verify existence
  for (const courseId of uniqueIds) {
    const course = await Course.findByPk(Number(courseId));
    if (!course) {
      const error = `Course with ID ${courseId} does not exist`;
      logger.warn(error);
      throw new Error(error);
    }
  }

  logger.debug("Prerequisite course IDs verified successfully", { uniqueIds });
}

function parseTagIdsInput(value: unknown, fieldName: string): number[] {
  logger.debug(`Parsing ${fieldName}`, { value });

  if (value === undefined || value === null || value === "") {
    return [];
  }

  let parsedValue: unknown;
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      return [];
    }

    if (trimmedValue.startsWith("[")) {
      parsedValue = JSON.parse(trimmedValue);
    } else if (trimmedValue.includes(",")) {
      parsedValue = trimmedValue
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part !== "");
    } else {
      parsedValue = [trimmedValue];
    }
  } else if (Array.isArray(value)) {
    parsedValue = value;
  } else if (typeof value === "number") {
    parsedValue = [value];
  } else {
    const error = `${fieldName} must be an array of numbers`;
    logger.warn(error);
    throw new Error(error);
  }

  if (!Array.isArray(parsedValue)) {
    const error = `${fieldName} must be an array of numbers`;
    logger.warn(error);
    throw new Error(error);
  }

  const tagIds = parsedValue.map((id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      const error = `${fieldName} must contain valid positive integer IDs`;
      logger.warn(error);
      throw new Error(error);
    }
    return parsedId;
  });

  const uniqueIds = [...new Set(tagIds)];
  logger.debug(`${fieldName} parsed successfully`, { uniqueIds });
  return uniqueIds;
}

async function verifyTagIdsExist(tagIds: number[]): Promise<void> {
  logger.debug("Verifying tag IDs exist", { tagIds });

  if (tagIds.length === 0) {
    return;
  }

  const existingTags = await Tag.findAll({
    where: { id: tagIds },
    attributes: ["id"],
  });

  const existingIds = new Set(existingTags.map((tag) => tag.id));
  const missingTagIds = tagIds.filter((id) => !existingIds.has(id));

  if (missingTagIds.length > 0) {
    const error = `Tag(s) not found: ${missingTagIds.join(", ")}`;
    logger.warn(error);
    throw new Error(error);
  }

  logger.debug("All tag IDs verified successfully", { tagIds });
}

async function addCourseTags(
  courseId: number,
  tagIds: number[],
  transaction: any,
): Promise<void> {
  logger.debug("Adding course tags", { courseId, tagIds });

  if (tagIds.length === 0) {
    return;
  }

  const existingAssociations = await CourseTag.findAll({
    where: {
      course_id: courseId,
      tag_id: {
        [Op.in]: tagIds,
      },
    },
    transaction,
    paranoid: false,
  });

  const associationsByTagId = new Map(
    existingAssociations.map((association) => [
      association.tag_id,
      association,
    ]),
  );

  for (const tagId of tagIds) {
    const association = associationsByTagId.get(tagId);

    if (!association) {
      await CourseTag.create(
        {
          course_id: courseId,
          tag_id: tagId,
        },
        { transaction },
      );
      logger.debug("Created new course tag", { courseId, tagId });
      continue;
    }

    if (association.deleted_at) {
      await association.restore({ transaction });
      logger.debug("Restored course tag", { courseId, tagId });
    }
  }

  logger.debug("Course tags added successfully", {
    courseId,
    tagCount: tagIds.length,
  });
}

async function createPrerequisiteGroupsAndPrerequisites(
  courseId: number,
  prerequisite_course_ids: unknown,
  transaction: any,
): Promise<void> {
  logger.debug("Creating prerequisite groups and prerequisites", {
    courseId,
    prerequisite_course_ids,
  });

  if (typeof prerequisite_course_ids === "string") {
    const trimmed = prerequisite_course_ids.trim();
    if (trimmed === "") {
      prerequisite_course_ids = [];
    } else if (trimmed.startsWith("[")) {
      prerequisite_course_ids = JSON.parse(trimmed);
    } else if (trimmed.includes(",")) {
      prerequisite_course_ids = trimmed
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p !== "");
    } else {
      prerequisite_course_ids = [trimmed];
    }
  }

  const ids = Array.isArray(prerequisite_course_ids)
    ? prerequisite_course_ids.map((id) => Number(id))
    : [];

  if (ids.length === 0) {
    logger.debug("No prerequisites to create", { courseId });
    return;
  }

  const prerequisiteGroup = await PrerequisiteGroup.create(
    { course_id: courseId },
    { transaction },
  );
  logger.debug("Created prerequisite group", {
    courseId,
    groupId: prerequisiteGroup.id,
  });

  await Promise.all(
    ids.map((cid) =>
      Prerequisite.create(
        {
          course_id: Number(cid),
          prerequisite_group_id: prerequisiteGroup.id,
        },
        { transaction },
      ),
    ),
  );

  logger.debug("Prerequisites created successfully", {
    courseId,
    groupId: prerequisiteGroup.id,
    prerequisiteCount: ids.length,
  });
}

export const createCourse = async (
  req: Request<{}, {}, CreateCourseRequest>,
  res: Response<CourseResponse | ErrorResponse>,
  next: NextFunction,
) => {
  logger.info("Creating new course", { title: req.body.title });
  const transaction = await sequelize.transaction();
  try {
    const tagIds = parseTagIdsInput(req.body.tag_ids, "tag_ids");
    await verifyTagIdsExist(tagIds);

    // Validate if the prerequisite_course_ids is a valid array of courses
    if (req.body.prerequisite_course_ids) {
      await _verify_prerequisite_course_ids_input(
        req.body.prerequisite_course_ids,
      );
    }

    // Construct the course data from the request body and file
    const costValue = Number(req.body.cost ?? 0);
    if (Number.isNaN(costValue)) {
      throw new HttpError(400, "Cost must be a valid number");
    }

    const course = await Course.create(
      {
        title: req.body.title,
        description: req.body.description ?? null,
        status: CourseStatus.UNRELEASED,
        released_at: null,
        cost: costValue,
        expected_completion_weeks: req.body.expected_completion_weeks ?? null,
        must_complete_in_weeks: req.body.must_complete_in_weeks ?? null,
        badge_expire_in_months:
          req.body.badge_expire_in_months ??
          parseInt(
            process.env.DEFAULT_COURSE_BADGE_EXPIRE_IN_MONTHS ?? "24",
            10,
          ),
        cover_img_path: "",
        badge_img_path: "",
      },
      { transaction },
    );
    logger.debug("Course record created", {
      courseId: course.id,
      title: course.title,
    });

    // Create the related prerequisite courses associations after the course is created
    if (req.body.prerequisite_course_ids) {
      await createPrerequisiteGroupsAndPrerequisites(
        course.id,
        req.body.prerequisite_course_ids,
        transaction,
      );
    }

    await addCourseTags(course.id, tagIds, transaction);

    // Handle course cover and badge images from multipart field uploads.
    const storage = getStorage();
    const uploadedFiles: { [fieldname: string]: Express.Multer.File[] } =
      req.files && !Array.isArray(req.files) ? req.files : {};
    const coverFile = uploadedFiles.cover?.[0];
    const badgeFile = uploadedFiles.badge?.[0];

    // Save a cover image when one is provided. Cover images are optional for course creation.
    if (coverFile) {
      logger.debug("Saving course cover image", {
        courseId: course.id,
        fileName: coverFile.originalname,
      });
      const ext = coverFile.originalname.split(".").pop();
      const savedPath = await storage.save({
        buffer: coverFile.buffer,
        filename: `cover_${course.id}.${ext}`,
        mimeType: coverFile.mimetype,
        folder: "public",
        subfolder: "courses/covers",
      });
      course.cover_img_path = savedPath;
      logger.debug("Course cover image saved", {
        courseId: course.id,
        path: savedPath,
      });
    }

    if (badgeFile) {
      logger.debug("Saving course badge image", {
        courseId: course.id,
        fileName: badgeFile.originalname,
      });
      const ext = badgeFile.originalname.split(".").pop();
      const savedPath = await storage.save({
        buffer: badgeFile.buffer,
        filename: `badge_${course.id}.${ext}`,
        mimeType: badgeFile.mimetype,
        folder: "public",
        subfolder: "courses/badges",
      });
      course.badge_img_path = savedPath;
      logger.debug("Course badge image saved", {
        courseId: course.id,
        path: savedPath,
      });
    } else {
      throw new HttpError(400, "Badge image is required for course creation");
    }

    await course.save({ transaction });
    await transaction.commit();
    logger.info("Course created successfully", {
      courseId: course.id,
      title: course.title,
    });

    //Returning the created course with its prerequisite groups and courses
    const createdCourse = await Course.findByPk(course.id, {
      include: COURSE_PREREQUISITE_INCLUDE,
    });
    if (!createdCourse) {
      logger.error("Created course not found during retrieval", {
        courseId: course.id,
      });
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(201).json(toCourseResponse(createdCourse, req));
  } catch (err) {
    await transaction.rollback();
    logger.error("Error creating course", {
      error: err instanceof Error ? err.message : String(err),
    });
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getAllCourses = async (
  req: Request<PaginateRequestParams & { tags?: string | string[] }>,
  res: Response<PaginateResponse<CourseResponse> | ErrorResponse>,
  next: NextFunction,
) => {
  logger.info("Fetching all courses", {
    page: req.query.page,
    size: req.query.size,
  });

  try {
    const isDeletedRaw = req.query.isDeleted;

    const includeDeleted =
      (typeof isDeletedRaw === "string" &&
        isDeletedRaw.toLowerCase() === "true") ||
      (typeof isDeletedRaw === "boolean" && isDeletedRaw === true);

    // STEP 1: pagination + module COUNT
    const coursesPaginated = await paginateModel(Course, req.query, {
      paranoid: !includeDeleted,
      include: [
        {
          model: Module,
          as: "modules",
          attributes: [],
        },
      ],
      attributes: {
        include: [[fn("COUNT", col("modules.id")), "module_count"]],
      },
      group: ["Course.id"],
      subQuery: false,
    });

    const courseIds = coursesPaginated.data.map((c) => c.id);

    // STEP 2: full data fetch (tags + prerequisites)
    const courses = await Course.findAll({
      where: { id: courseIds },
      include: COURSE_PREREQUISITE_INCLUDE,
      paranoid: !includeDeleted,
    });

    // STEP 3: build module count map (FIXED)
    const moduleCountMap = new Map(
      coursesPaginated.data.map((c) => [
        c.id,
        Number((c as any).dataValues?.module_count ?? 0),
      ]),
    );

    // STEP 4: inject module_count correctly (FIXED)
    courses.forEach((course) => {
      (course as any).dataValues.module_count =
        moduleCountMap.get(course.id) || 0;
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    const formattedResponse = formatPaginateResponse(
      courses.map((c) => toCourseResponse(c, req)),
      req.query,
      true,
      {
        page: coursesPaginated.page,
        size: coursesPaginated.size,
        totalElements: coursesPaginated.totalElements,
        totalPages: coursesPaginated.totalPages,
        baseUrl,
      },
    );

    return res.json(formattedResponse);
  } catch (err) {
    logger.error("Error fetching all courses", {
      error: err instanceof Error ? err.message : String(err),
    });
    next(err);
  }
};

/**
 * Retrieve all courses that a user could/currently enroll in
 */
export const getAllUserCourses = async (
  req: Request<PaginateRequestParams & { tags?: string | string[] }>,
  res: Response<PaginateResponse<UserCourseEnrollmentResponse> | ErrorResponse>,
  next: NextFunction,
) => {
  logger.info("Fetching all user courses", { userId: req.user?.id });

  try {
    let responseData: UserCourseEnrollmentResponse[] = [];

    const courses = await Course.findAll({
      where: {
        status: CourseStatus.RELEASED,
      },
      include: [
        {
          model: PrerequisiteGroup,
          as: "prerequisite_groups",
          include: [{ model: Prerequisite, as: "prerequisites" }],
        },
        { model: Tag, as: "tags" },
        {
          model: Module,
          as: "modules",
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(DISTINCT m.id)
              FROM modules m
              WHERE m.course_id = Course.id
            )`),
            "module_count",
          ],
        ],
      },
      group: ["Course.id"],
      subQuery: false,
    });

    const moduleCountMap = new Map(
      courses.map((c) => [
        c.id,
        Number((c as any).dataValues?.module_count ?? 0),
      ]),
    );

    for (const course of courses) {
      let canEnroll = await canUserEnrollCourse(req.user!, course);

      const enrollment = await Enrollment.findOne({
        where: {
          user_id: req.user!.id,
          course_id: course.id,
        },
        order: [["created_at", "DESC"]],
      });

      let enrollmentResponse: EnrollmentResponse | null = null;

      if (enrollment) {
        enrollmentResponse = {
          id: enrollment.id,
          user_id: enrollment.user_id,
          course_id: enrollment.course_id,
          status: enrollment.status,
          enrolled_at: enrollment.enrolled_at,
          completed_at: enrollment.completed_at,
          reviewed_by_user_id: enrollment.reviewed_by_user_id,
          reviewed_at: enrollment.reviewed_at,
          reviewed_comment: enrollment.reviewed_comment,
          badge_expire_at: enrollment.badge_expire_at,
          created_at: enrollment.created_at,
          updated_at: enrollment.updated_at,
        };
      }

      responseData.push({
        ...toCourseResponse(course, req),
        module_count: moduleCountMap.get(course.id) || 0, 
        status: enrollment ? enrollment.status : null,
        is_enrollable: canEnroll.allowed,
        enrollment: enrollmentResponse,
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    const formattedResponse = formatPaginateResponse(
      responseData,
      req.query,
      true,
      {
        page: 1,
        size: responseData.length,
        totalElements: responseData.length,
        totalPages: 1,
        baseUrl,
      },
    );

    logger.info("User courses fetched successfully", {
      userId: req.user!.id,
      totalCourses: responseData.length,
    });

    return res.json(formattedResponse);
  } catch (err) {
    logger.error("Error fetching user courses", {
      userId: req.user?.id,
      error: err instanceof Error ? err.message : String(err),
    });

    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getCourseById = async (
  req: Request<{ id: string }>,
  res: Response<CourseResponse | { message: string }>,
  next: NextFunction,
) => {
  logger.info("Fetching course by ID", { courseId: req.params.id });
  try {
    const course = await Course.findByPk(req.params.id, {
      include: COURSE_PREREQUISITE_INCLUDE,
    });
    if (!course) {
      logger.warn("Course not found", { courseId: req.params.id });
      return res.status(404).json({ message: "Course not found" });
    }

    logger.info("Course fetched successfully", {
      courseId: course.id,
      title: course.title,
    });
    return res.json(toCourseResponse(course, req));
  } catch (err) {
    logger.error("Error fetching course by ID", {
      courseId: req.params.id,
      error: err instanceof Error ? err.message : String(err),
    });
    next(err);
  }
};

export const upsertCourse = async (
  req: Request<{ id: string }, {}, UpdateCourseRequest> & {
    file?: Express.Multer.File;
  },
  res: Response<CourseResponse | { message: string }>,
  next: NextFunction,
) => {
  logger.info("Updating course", { courseId: req.params.id });
  let transaction = await sequelize.transaction();
  try {
    // Check if the course exists or not
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      logger.warn("Course not found for update", { courseId: req.params.id });
      throw new HttpError(404, "Course does not exist");
    }

    logger.debug("Preparing course updates", { courseId: course.id });

    // Validate and apply the updates from the request body and file
    const updates: Partial<Course> = {};
    if (req.body.cost !== undefined && req.body.cost !== null) {
      const costValue = Number(req.body.cost);
      if (Number.isNaN(costValue)) {
        throw new HttpError(400, "Cost must be a valid number");
      }
      updates.cost = costValue;
    }
    const status = parseCourseStatus(req.body.status);
    const releasedAtInput = parseCourseReleasedAt(req.body.released_at);
    if (typeof req.body.title === "string" && req.body.title.trim() !== "") {
      updates.title = req.body.title;
    }
    if (req.body.description !== undefined) {
      updates.description = req.body.description;
    }
    if (typeof req.body.expected_completion_weeks === "number") {
      updates.expected_completion_weeks = req.body.expected_completion_weeks;
    }
    if (typeof req.body.must_complete_in_weeks === "number") {
      updates.must_complete_in_weeks = req.body.must_complete_in_weeks;
    }
    if (typeof req.body.badge_expire_in_months === "number") {
      updates.badge_expire_in_months = req.body.badge_expire_in_months;
    }

    //TODO: Update the status validation logic
    if (status !== undefined) {
      updates.status = status;
      if (releasedAtInput !== undefined) {
        updates.released_at = releasedAtInput;
      } else if (status === CourseStatus.RELEASED) {
        updates.released_at = course.released_at ?? new Date();
      } else {
        updates.released_at = null;
      }
    } else if (releasedAtInput !== undefined) {
      updates.released_at = releasedAtInput;
    }

    //TODO: Handle cover image uploads
    if (req.file) {
      logger.debug("Saving course badge image during update", {
        courseId: course.id,
        fileName: req.file.originalname,
      });
      const storage = getStorage();
      const ext = req.file.originalname.split(".").pop();
      const savedPath = await storage.save({
        buffer: req.file.buffer,
        filename: `badge_${course.id}.${ext}`,
        mimeType: req.file.mimetype,
        folder: "public",
        subfolder: "courses/badges",
      });
      updates.badge_img_path = savedPath;
      logger.debug("Course badge image saved during update", {
        courseId: course.id,
        path: savedPath,
      });
    }
    if (
      Object.keys(updates).length === 0 &&
      req.body.prerequisite_course_ids === undefined &&
      req.body.tag_ids === undefined
    ) {
      logger.warn("No valid fields provided for update", {
        courseId: req.params.id,
      });
      throw new Error("No valid fields provided for update");
    }
    await course.update(updates, { transaction });
    logger.debug("Course basic fields updated", {
      courseId: course.id,
      updatedFields: Object.keys(updates),
    });

    // Handle prerequisite courses updates if provided
    if (req.body.prerequisite_course_ids !== undefined) {
      logger.debug("Updating course prerequisites", { courseId: course.id });
      await _verify_prerequisite_course_ids_input(
        req.body.prerequisite_course_ids,
      );

      // Delete existing prerequisite groups and prerequisites
      await PrerequisiteGroup.destroy({
        where: { course_id: course.id },
        transaction,
      });

      await createPrerequisiteGroupsAndPrerequisites(
        course.id,
        req.body.prerequisite_course_ids,
        transaction,
      );
    }

    //Handle course tags updates if provided
    const tagIds = parseTagIdsInput(req.body.tag_ids, "tag_ids");
    logger.debug("Updating course tags", {
      courseId: course.id,
      tagCount: tagIds.length,
    });

    //Delete tags that are not in the tagIds list
    await CourseTag.destroy({
      where: {
        course_id: course.id,
        tag_id: {
          [Op.notIn]: tagIds,
        },
      },
      transaction,
    });

    // Add new tags that are in the tagIds list but not currently associated with the course
    await addCourseTags(course.id, tagIds, transaction);

    await transaction.commit();
    logger.debug("Course update transaction committed", {
      courseId: course.id,
    });

    const updatedCourse = await Course.findByPk(req.params.id, {
      include: COURSE_PREREQUISITE_INCLUDE,
    });

    if (!updatedCourse) {
      logger.error("Updated course not found during retrieval", {
        courseId: req.params.id,
      });
      return res.status(404).json({ message: "Course not found" });
    }

    logger.info("Course updated successfully", {
      courseId: updatedCourse.id,
      title: updatedCourse.title,
    });
    return res.json(toCourseResponse(updatedCourse, req));
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
    logger.error("Error updating course", {
      courseId: req.params.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return res.status(400).json({
      message: err instanceof Error ? err.message : "Invalid request data",
    });
  }
};

export const deleteCourse = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  logger.info("Deleting course", { courseId: req.params.id });
  try {
    const deletedCount = await Course.destroy({ where: { id: req.params.id } });

    if (deletedCount === 0) {
      logger.warn("Course not found for deletion", { courseId: req.params.id });
      return res.status(404).json({ message: "Course not found" });
    }

    logger.info("Course deleted successfully", { courseId: req.params.id });
    return res.json({ message: "Course deleted successfully" });
  } catch (err) {
    logger.error("Error deleting course", {
      courseId: req.params.id,
      error: err instanceof Error ? err.message : String(err),
    });
    next(err);
  }
};
