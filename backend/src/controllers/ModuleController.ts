import { NextFunction, Request, Response } from "express";
import { Course, Module } from "../models";
import {
  CreateModuleRequest,
  ModuleResponse,
  UpdateModuleRequest,
} from "../types/Module";
import { toModuleResponse } from "../types/Module";
import {
  parseId,
  parseNumberField,
  parseOptionalText,
} from "../utils/parseRequest";

export const getAllModules = async (
  req: Request<{ course_Id: string }>,
  res: Response<ModuleResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const courseId = parseId(req.params.course_Id);
    if (courseId === null) {
      return res.status(400).json({ message: "Invalid course_Id" });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const modules = await Module.findAll({
      where: { course_id: courseId },
      order: [
        ["order", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.json(modules.map(toModuleResponse));
  } catch (err) {
    next(err);
  }
};

export const getModuleById = async (
  req: Request<{ course_Id: string; module_id: string }>,
  res: Response<ModuleResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const courseId = parseId(req.params.course_Id);
    const moduleId = parseId(req.params.module_id);

    if (courseId === null) {
      return res.status(400).json({ message: "Invalid course_Id" });
    }

    if (moduleId === null) {
      return res.status(400).json({ message: "Invalid module_id" });
    }

    const module = await Module.findOne({
      where: { id: moduleId, course_id: courseId },
    });

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    return res.json(toModuleResponse(module));
  } catch (err) {
    next(err);
  }
};

export const createModule = async (
  req: Request<{ course_Id: string }, {}, CreateModuleRequest>,
  res: Response<ModuleResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const body = (req.body ?? {}) as Partial<CreateModuleRequest>;

    //Checking if course exists before creating module
    const courseId = parseId(req.params.course_Id);
    if (courseId === null) {
      return res.status(400).json({ message: "Invalid course_Id" });
    }
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Validate and parse fields from the request body
    const order = parseNumberField(body.order);
    const completeByWeek = parseNumberField(body.complete_by_week);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = parseOptionalText(body.description);
    if (!title) {
      throw new Error("title is required");
    }
    if (order === null) {
      throw new Error("order is required");
    }
    if (completeByWeek === null) {
      throw new Error("complete_by_week is required");
    }

    // Check if the order is already in use within the same course
    if (await CheckIfOrderInUse(courseId, order)) {
      throw new Error(
        `Module order ${order} is already in use within this course`,
      );
    }

    const module = await Module.create({
      course_id: courseId,
      order,
      title,
      description,
      complete_by_week: completeByWeek,
    });

    return res.status(201).json(toModuleResponse(module));
  } catch (err) {
    return res.status(400).json({
      message: err instanceof Error ? err.message : "Module not found",
    });
  }
};

export const upsertModule = async (
  req: Request<
    { course_Id: string; module_id: string },
    {},
    UpdateModuleRequest
  >,
  res: Response<ModuleResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const body = (req.body ?? {}) as Partial<UpdateModuleRequest>;

    // Check if the module to update exists
    const module = await GetModule(req.params.course_Id, req.params.module_id);

    // Validate and prepare fields to update
    const updates: Partial<Module> = {};
    if (
      body.order !== undefined &&
      body.order !== null &&
      !(typeof body.order === "string" && body.order.trim() === "")
    ) {
      const order = parseNumberField(body.order);
      if (order === null) {
        throw new Error("order must be a number");
      }

      // Check if the new order is already in use within the same course (excluding the current module)
      if (
        order !== module.order &&
        (await CheckIfOrderInUse(module.course_id, order))
      ) {
        throw new Error(
          `Module order ${order} is already in use within this course`,
        );
      }
      updates.order = order;
    }
    if (typeof body.title === "string" && body.title.trim() !== "") {
      const title = body.title.trim();
      updates.title = title;
    }
    if (
      typeof body.description === "string" &&
      body.description.trim() !== ""
    ) {
      updates.description = parseOptionalText(body.description);
    }
    if (
      body.complete_by_week !== undefined &&
      body.complete_by_week !== null &&
      !(
        typeof body.complete_by_week === "string" &&
        body.complete_by_week.trim() === ""
      )
    ) {
      const completeByWeek = parseNumberField(body.complete_by_week);
      if (completeByWeek === null) {
        throw new Error("complete_by_week must be a number");
      }
      updates.complete_by_week = completeByWeek;
    }
    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields provided to update");
    }

    await module.update(updates);

    return res.json(toModuleResponse(module));
  } catch (err) {
    return res.status(400).json({
      message: err instanceof Error ? err.message : "Module not found",
    });
  }
};

export const deleteModule = async (
  req: Request<{ course_Id: string; module_id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const module = await GetModule(req.params.course_Id, req.params.module_id);

    await module.destroy();

    return res.json({ message: "Module deleted successfully" });
  } catch (err) {
    return res.status(400).json({
      message: err instanceof Error ? err.message : "Module not found",
    });
  }
};

async function GetModule(courseId: string, moduleId: string): Promise<Module> {
  const _courseId = parseId(courseId);
  const _moduleId = parseId(moduleId);
  if (_courseId === null) {
    throw new Error("Invalid course_Id");
  }
  if (_moduleId === null) {
    throw new Error("Invalid module_id");
  }
  const module = await Module.findOne({
    where: { id: _moduleId, course_id: _courseId },
  });
  if (!module) {
    throw new Error("Module not found");
  }
  return module;
}

/**
 * Checks if a module order is already in use within the same course.
 * @param courseId - The ID of the course to check within.
 * @param order - The module order to check for.
 * @returns A promise that resolves to true if the order is in use, or false if it is available.
 * @throws An error if the database query fails.
 */
async function CheckIfOrderInUse(
  courseId: number,
  order: number,
): Promise<boolean> {
  const existingModule = await Module.findOne({
    where: { course_id: courseId, order },
  });
  return existingModule !== null;
}
