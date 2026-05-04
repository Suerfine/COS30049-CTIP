import { NextFunction, Request, Response } from "express";
import { Course, Module, Page } from "../models";
import {
  CreatePageRequest,
  PageResponse,
  UpdatePageRequest,
  toPageResponse,
} from "../types/Page";
import {
  parseId,
  parseNumberField,
  parseOptionalText,
  parseBooleanField,
} from "../utils/parseRequest";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Helper function to validate course_Id and module_id from request parameters, and to check if the corresponding course and module exist. Throws HttpError with appropriate status code and message if any validation fails.
 * @param courseIdRaw The raw course_Id from request parameters
 * @param moduleIdRaw The raw module_id from request parameters
 * @returns A promise resolving to an object containing the validated course and module information
 */
async function validateCourseAndModule(
  courseIdRaw: string,
  moduleIdRaw: string,
): Promise<{
  courseId: number;
  moduleId: number;
  course: Course;
  module: Module;
}> {
  const courseId = parseId(courseIdRaw);
  const moduleId = parseId(moduleIdRaw);

  if (courseId === null) {
    throw new HttpError(400, "Invalid course_Id");
  }

  if (moduleId === null) {
    throw new HttpError(400, "Invalid module_id");
  }

  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new HttpError(404, "Course not found");
  }

  const module = await Module.findOne({
    where: { id: moduleId, course_id: courseId },
  });
  if (!module) {
    throw new HttpError(404, "Module not found");
  }

  return { courseId, moduleId, course, module };
}

export const getAllPages = async (
  req: Request<{ course_Id: string; module_id: string }>,
  res: Response<PageResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { moduleId } = await validateCourseAndModule(
      req.params.course_Id,
      req.params.module_id,
    );

    const pages = await Page.findAll({
      where: { module_id: moduleId },
      order: [
        ["order", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.json(pages.map(toPageResponse));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const getPageById = async (
  req: Request<{ page_id: string }>,
  res: Response<PageResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Validated and retrieve the page based on id
    const pageId = parseId(req.params.page_id);
    if (pageId === null) {
      throw new HttpError(400, "Invalid page_id");
    }
    const page = await Page.findByPk(pageId);

    if (!page) {
      throw new HttpError(404, "Page not found");
    }

    return res.json(toPageResponse(page));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const createPage = async (
  req: Request<{ course_Id: string; module_id: string }, {}, CreatePageRequest>,
  res: Response<PageResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { moduleId } = await validateCourseAndModule(
      req.params.course_Id,
      req.params.module_id,
    );
    const body = (req.body ?? {}) as Partial<CreatePageRequest>;

    const order = parseNumberField(body.order);
    const passingScore = parseNumberField(body.passing_score);
    const maxTries = parseNumberField(body.max_tries);
    const finalQuiz =
      body.final_quiz === undefined
        ? false
        : parseBooleanField(body.final_quiz);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = parseOptionalText(body.description);

    if (!title) {
      throw new HttpError(400, "title is required");
    }

    if (order === null) {
      throw new HttpError(400, "order is required and must be a valid number");
    }

    if (passingScore === null) {
      throw new HttpError(
        400,
        "passing_score is required and must be a valid number",
      );
    }

    if (finalQuiz === null) {
      throw new HttpError(400, "final_quiz must be a boolean value");
    }

    const page = await Page.create({
      module_id: moduleId,
      order,
      title,
      description: description ?? null,
      passing_score: passingScore,
      max_tries: maxTries ?? 3,
      final_quiz: finalQuiz,
    });

    return res.status(201).json(toPageResponse(page));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const upsertPage = async (
  req: Request<{ page_id: string }, {}, UpdatePageRequest>,
  res: Response<PageResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const pageId = parseId(req.params.page_id);

    //Retrieve the page based on id and module_id to ensure it exists and belongs to the correct module
    if (pageId === null) {
      throw new HttpError(400, "Invalid page_id");
    }
    const page = await Page.findByPk(pageId);
    if (!page) {
      throw new HttpError(404, "Page not found");
    }

    // Parse and validate the fields from request body. We will only update the fields that are provided in the request body, and ignore any fields that are not provided or are invalid. If no valid fields are provided, we will return a 400 error.
    const body = (req.body ?? {}) as Partial<UpdatePageRequest>;
    const order = parseNumberField(body.order);
    const passingScore = parseNumberField(body.passing_score);
    const maxTries = parseNumberField(body.max_tries);
    const finalQuiz =
      body.final_quiz !== undefined
        ? parseBooleanField(body.final_quiz)
        : undefined;
    const title =
      typeof body.title === "string" ? body.title.trim() : undefined;
    const description =
      body.description !== undefined
        ? parseOptionalText(body.description)
        : undefined;
    const updates: Partial<Page> = {};
    if (order !== null && order !== undefined) {
      updates.order = order;
    }
    if (title !== undefined && title !== "") {
      updates.title = title;
    }
    if (description !== undefined) {
      updates.description = description ?? null;
    }
    if (passingScore !== null && passingScore !== undefined) {
      updates.passing_score = passingScore;
    }
    if (maxTries !== null && maxTries !== undefined) {
      updates.max_tries = maxTries;
    }
    if (body.final_quiz !== undefined) {
      if (finalQuiz === null) {
        throw new HttpError(400, "final_quiz must be a boolean value");
      }

      updates.final_quiz = finalQuiz;
    }
    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, "No valid fields provided for update");
    }

    await page.update(updates);
    const updatedPage = await Page.findByPk(pageId);

    if (!updatedPage) {
      throw new HttpError(404, "Page not found");
    }

    return res.json(toPageResponse(updatedPage));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const deletePage = async (
  req: Request<{ page_id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    // Validated and retrieve the page based on id
    const pageId = parseId(req.params.page_id);
    if (pageId === null) {
      throw new HttpError(400, "Invalid page_id");
    }

    // Soft delete the page by setting deleted_at timestamp
    const deletedCount = await Page.destroy({
      where: { id: pageId },
    });
    if (deletedCount === 0) {
      throw new HttpError(404, "Page not found");
    }

    return res.json({ message: "Page deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};
