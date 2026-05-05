import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import {
  Course,
  CourseTag,
  Prerequisite,
  PrerequisiteGroup,
  Tag,
  User,
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
} from "../types/Course";
import { ErrorResponse } from "../types/common";
import { getStorage } from "../services/storage";

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

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    status: course.status,
    released_at: course.released_at,
    expected_completion_weeks: course.expected_completion_weeks,
    must_complete_in_weeks: course.must_complete_in_weeks,
    badge_expire_in_months: course.badge_expire_in_months,
    badge_img_url: badge_url,
    cover_img_url: cover_url,
    tags,
    prerequisite_groups,
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
 * @param prerequisite_course_ids - The input to validate, expected to be an array of arrays of numbers.
 * @throws Will throw an error if the input is not in the expected format.
 */
async function _verify_prerequisite_course_ids_input(
  prerequisite_course_ids: unknown,
): Promise<void> {
  if (typeof prerequisite_course_ids === "string") {
    prerequisite_course_ids = JSON.parse(prerequisite_course_ids);
  }

  if (!Array.isArray(prerequisite_course_ids)) {
    throw new Error("prerequisite_course_ids must be an array");
  }

  for (const group of prerequisite_course_ids) {
    if (!Array.isArray(group)) {
      throw new Error("Each group of prerequisite_course_ids must be an array");
    }

    for (const courseId of group) {
      // Making sure every id in the group is unique within the group
      const uniqueIds = new Set(group);
      if (uniqueIds.size !== group.length) {
        throw new Error(
          "Each group of prerequisite_course_ids must contain unique course IDs",
        );
      }
      // Checking if each courseID in the group is a number
      if (typeof courseId !== "number" || isNaN(courseId)) {
        throw new Error(
          "Each course ID in prerequisite_course_ids must be a number" +
            JSON.stringify(courseId),
        );
      }

      //checking if the courseId exists in the database
      const course = await Course.findByPk(Number(courseId));
      if (!course) {
        throw new Error(`Course with ID ${courseId} does not exist`);
      }
    }
  }
}

function parseTagIdsInput(value: unknown, fieldName: string): number[] {
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
    throw new Error(`${fieldName} must be an array of numbers`);
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error(`${fieldName} must be an array of numbers`);
  }

  const tagIds = parsedValue.map((id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new Error(`${fieldName} must contain valid positive integer IDs`);
    }
    return parsedId;
  });

  return [...new Set(tagIds)];
}

async function verifyTagIdsExist(tagIds: number[]): Promise<void> {
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
    throw new Error(`Tag(s) not found: ${missingTagIds.join(", ")}`);
  }
}

async function addCourseTags(
  courseId: number,
  tagIds: number[],
  transaction: any,
): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const existingAssociations = await CourseTag.findAll({
    where: {
      course_id: courseId,
      tag_id: tagIds,
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
      continue;
    }

    if (association.deleted_at) {
      await association.restore({ transaction });
    }
  }
}

async function removeCourseTags(
  courseId: number,
  tagIds: number[],
  transaction: any,
): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  await CourseTag.destroy({
    where: {
      course_id: courseId,
      tag_id: tagIds,
    },
    transaction,
  });
}

async function createPrerequisiteGroupsAndPrerequisites(
  courseId: number,
  prerequisite_course_ids: number[][],
  transaction: any,
): Promise<void> {
  if (typeof prerequisite_course_ids === "string") {
    prerequisite_course_ids = JSON.parse(prerequisite_course_ids);
  }

  for (const group of prerequisite_course_ids) {
    const prerequisiteGroup = await PrerequisiteGroup.create(
      { course_id: courseId },
      { transaction },
    );

    await Promise.all(
      group.map((courseId) =>
        Prerequisite.create(
          {
            course_id: Number(courseId),
            prerequisite_group_id: prerequisiteGroup.id,
          },
          { transaction },
        ),
      ),
    );
  }
}

export const createCourse = async (
  req: Request<{}, {}, CreateCourseRequest>,
  res: Response<CourseResponse | ErrorResponse>,
  next: NextFunction,
) => {
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
    const course = await Course.create(
      {
        title: req.body.title,
        description: req.body.description ?? null,
        status: CourseStatus.UNRELEASED,
        released_at: null,
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

    if (coverFile) {
      const ext = coverFile.originalname.split(".").pop();
      const savedPath = await storage.save({
        buffer: coverFile.buffer,
        filename: `cover_${course.id}.${ext}`,
        mimeType: coverFile.mimetype,
        folder: "public",
        subfolder: "courses/covers",
      });
      course.cover_img_path = savedPath;
    }

    if (badgeFile) {
      const ext = badgeFile.originalname.split(".").pop();
      const savedPath = await storage.save({
        buffer: badgeFile.buffer,
        filename: `badge_${course.id}.${ext}`,
        mimeType: badgeFile.mimetype,
        folder: "public",
        subfolder: "courses/badges",
      });
      course.badge_img_path = savedPath;
    }

    await course.save({ transaction });
    await transaction.commit();

    //Returning the created course with its prerequisite groups and courses
    const createdCourse = await Course.findByPk(course.id, {
      include: COURSE_PREREQUISITE_INCLUDE,
    });
    if (!createdCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(201).json(toCourseResponse(createdCourse, req));
  } catch (err) {
    await transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getAllCourses = async (
  req: Request<PaginateRequestParams & { tags?: string | string[] }>,
  res: Response<PaginateResponse<CourseResponse>>,
  next: NextFunction,
) => {
  try {
    const isDeletedRaw = req.query.isDeleted;
    const includeDeleted =
      (typeof isDeletedRaw === "string" &&
        isDeletedRaw.toLowerCase() === "true") ||
      (typeof isDeletedRaw === "boolean" && isDeletedRaw === true);

    const courses = await paginateModel(Course, req.query, {
      paranoid: !includeDeleted,
      include: COURSE_PREREQUISITE_INCLUDE,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formattedResponse = formatPaginateResponse(
      courses.data.map((c) => toCourseResponse(c, req)),
      req.query,
      true,
      {
        page: courses.page,
        size: courses.size,
        totalElements: courses.totalElements,
        totalPages: courses.totalPages,
        baseUrl,
      },
    );

    return res.json(formattedResponse);
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (
  req: Request<{ id: string }>,
  res: Response<CourseResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: COURSE_PREREQUISITE_INCLUDE,
    });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json(toCourseResponse(course, req));
  } catch (err) {
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
  let transaction = await sequelize.transaction();
  try {
    // Check if the course exists or not
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      throw new HttpError(404, "Course does not exist");
    }

    // Validate and apply the updates from the request body and file
    const updates: Partial<Course> = {};
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
    }
    if (
      Object.keys(updates).length === 0 &&
      req.body.prerequisite_course_ids === undefined &&
      req.body.tag_ids === undefined
    ) {
      throw new Error("No valid fields provided for update");
    }
    await course.update(updates, { transaction });

    // Handle prerequisite courses updates if provided
    if (req.body.prerequisite_course_ids !== undefined) {
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

    //Delete tags that are not in the tagIds list
    CourseTag.destroy({
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

    const updatedCourse = await Course.findByPk(req.params.id, {
      include: COURSE_PREREQUISITE_INCLUDE,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json(toCourseResponse(updatedCourse, req));
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
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
  try {
    const deletedCount = await Course.destroy({ where: { id: req.params.id } });

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({ message: "Course deleted successfully" });
  } catch (err) {
    next(err);
  }
};
