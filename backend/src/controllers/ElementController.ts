import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Course, Module, Page, Element } from "../models";
import {
  CreateElementRequest,
  ElementResponse,
  UpdateElementRequest,
  BulkCreateElementRequest,
  BulkUpdateElementRequest,
  toElementResponse,
} from "../types/Element";
import {
  parseId,
  parseNumberField,
  parseOptionalText,
  parseJsonField,
} from "../utils/parseRequest";
import { ElementTypes } from "../enum/ElementTypes";
import { PRIVATE_UPLOAD_STORAGE_PATH } from "../middelware/PrivateDocumentUpload";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function validateCourseModuleAndPage(
  courseIdRaw: string,
  moduleIdRaw: string,
  pageIdRaw: string,
): Promise<{
  courseId: number;
  moduleId: number;
  pageId: number;
  course: Course;
  module: Module;
  page: Page;
}> {
  const courseId = parseId(courseIdRaw);
  const moduleId = parseId(moduleIdRaw);
  const pageId = parseId(pageIdRaw);

  if (courseId === null) {
    throw new HttpError(400, "Invalid course_Id");
  }

  if (moduleId === null) {
    throw new HttpError(400, "Invalid module_id");
  }

  if (pageId === null) {
    throw new HttpError(400, "Invalid page_id");
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

  const page = await Page.findOne({
    where: { id: pageId, module_id: moduleId },
  });
  if (!page) {
    throw new HttpError(404, "Page not found");
  }

  return { courseId, moduleId, pageId, course, module, page };
}

async function validateElementType(type: string): Promise<ElementTypes> {
  if (!Object.values(ElementTypes).includes(type as ElementTypes)) {
    throw new HttpError(
      400,
      `Invalid element type. Allowed types: ${Object.values(ElementTypes).join(", ")}`,
    );
  }

  return type as ElementTypes;
}

export const getAllElements = async (
  req: Request<{ course_Id: string; module_id: string; page_id: string }>,
  res: Response<ElementResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );

    const elements = await Element.findAll({
      where: { page_id: pageId },
      order: [
        ["order", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.json(elements.map(toElementResponse));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const getElementById = async (
  req: Request<{
    course_Id: string;
    module_id: string;
    page_id: string;
    element_id: string;
  }>,
  res: Response<ElementResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );
    const elementId = parseId(req.params.element_id);

    if (elementId === null) {
      throw new HttpError(400, "Invalid element_id");
    }

    const element = await Element.findOne({
      where: { id: elementId, page_id: pageId },
    });

    if (!element) {
      throw new HttpError(404, "Element not found");
    }

    return res.json(toElementResponse(element));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const createElement = async (
  req: Request<
    { course_Id: string; module_id: string; page_id: string },
    {},
    CreateElementRequest
  > & { file?: Express.Multer.File },
  res: Response<ElementResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );
    const body = (req.body ?? {}) as Partial<CreateElementRequest>;

    const order = parseNumberField(body.order);
    const score = parseNumberField(body.score);

    if (order === null) {
      throw new HttpError(400, "order is required and must be a valid number");
    }

    if (!body.type || typeof body.type !== "string") {
      throw new HttpError(400, "type is required and must be a string");
    }

    // Validate element type
    const elementType = await validateElementType(body.type);

    // Validate and prepare content
    let content = parseJsonField(body.content);
    if (content === null) {
      throw new HttpError(400, "content must be a valid JSON object");
    }

    const element = await Element.create({
      page_id: pageId,
      order,
      type: elementType,
      content,
      score: score ?? null,
      file_id: req.file ? path.parse(req.file.filename).name : null,
    });

    return res.status(201).json(toElementResponse(element));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const bulkCreateElements = async (
  req: Request<
    { course_Id: string; module_id: string; page_id: string },
    {},
    BulkCreateElementRequest
  >,
  res: Response<ElementResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );
    const body = (req.body ?? {}) as Partial<BulkCreateElementRequest>;

    if (!Array.isArray(body.elements)) {
      throw new HttpError(400, "elements must be an array");
    }

    if (body.elements.length === 0) {
      throw new HttpError(400, "elements array cannot be empty");
    }

    // Build a map of uploaded files by index for easy lookup
    const fileMap: Record<number, Express.Multer.File> = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file, index) => {
        fileMap[index] = file;
      });
    }

    const createdElements: Element[] = [];

    for (let i = 0; i < body.elements.length; i++) {
      const elementReq = body.elements[i];

      const order = parseNumberField(elementReq.order);
      const score = parseNumberField(elementReq.score);

      if (order === null) {
        throw new HttpError(
          400,
          `Element ${i}: order is required and must be a valid number`,
        );
      }

      if (!elementReq.type || typeof elementReq.type !== "string") {
        throw new HttpError(
          400,
          `Element ${i}: type is required and must be a string`,
        );
      }

      // Validate element type
      const elementType = await validateElementType(elementReq.type);

      // Validate and prepare content
      let contentData = parseJsonField(elementReq.content);
      if (contentData === null) {
        throw new HttpError(
          400,
          `Element ${i}: content must be a valid JSON object`,
        );
      }

      const element = await Element.create({
        page_id: pageId,
        order,
        type: elementType,
        content: contentData,
        score: score ?? null,
        file_id: fileMap[i] ? path.parse(fileMap[i].filename).name : null,
      });

      createdElements.push(element);
    }

    return res.status(201).json(createdElements.map(toElementResponse));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const updateElement = async (
  req: Request<
    {
      course_Id: string;
      module_id: string;
      page_id: string;
      element_id: string;
    },
    {},
    UpdateElementRequest
  > & { file?: Express.Multer.File },
  res: Response<ElementResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );
    const elementId = parseId(req.params.element_id);
    const body = (req.body ?? {}) as Partial<UpdateElementRequest>;

    if (elementId === null) {
      throw new HttpError(400, "Invalid element_id");
    }

    const element = await Element.findOne({
      where: { id: elementId, page_id: pageId },
    });

    if (!element) {
      throw new HttpError(404, "Element not found");
    }

    const order = parseNumberField(body.order);
    const score = parseNumberField(body.score);

    const updates: Partial<Element> = {};

    if (order !== null && order !== undefined) {
      updates.order = order;
    }

    if (score !== null && score !== undefined) {
      updates.score = score;
    }

    if (body.content !== undefined) {
      const newContent = parseJsonField(body.content);
      if (newContent === null) {
        throw new HttpError(400, "content must be a valid JSON object");
      }

      updates.content = newContent;
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, "No valid fields provided for update");
    }

    // Handle file updates for FILE type elements
    if (req.file && element.type === ElementTypes.FILE) {
      updates.file_id = path.parse(req.file.filename).name;
    }

    await element.update(updates);

    const updatedElement = await Element.findByPk(elementId);

    if (!updatedElement) {
      throw new HttpError(404, "Element not found");
    }

    return res.json(toElementResponse(updatedElement));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const bulkUpdateElements = async (
  req: Request<
    { course_Id: string; module_id: string; page_id: string },
    {},
    BulkUpdateElementRequest
  >,
  res: Response<ElementResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );
    const body = (req.body ?? {}) as Partial<BulkUpdateElementRequest>;

    if (!Array.isArray(body.elements)) {
      throw new HttpError(400, "elements must be an array");
    }

    if (body.elements.length === 0) {
      throw new HttpError(400, "elements array cannot be empty");
    }

    // Build a map of uploaded files by element id for easy lookup
    const fileMap: Record<number, Express.Multer.File> = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        // Try to extract element id from field name (e.g., "elements[0][file]" -> 0)
        const match = file.fieldname?.match(/elements\[(\d+)\]/);
        if (match) {
          fileMap[parseInt(match[1], 10)] = file;
        }
      });
    }

    const updatedElements: Element[] = [];

    for (let i = 0; i < body.elements.length; i++) {
      const elementReq = body.elements[i];

      const elementId = parseNumberField(elementReq.id);

      if (elementId === null) {
        throw new HttpError(
          400,
          `Element ${i}: id is required and must be a valid number`,
        );
      }

      const element = await Element.findOne({
        where: { id: elementId, page_id: pageId },
      });

      if (!element) {
        throw new HttpError(400, `Element ${i}: Element not found`);
      }

      const order = parseNumberField(elementReq.order);
      const score = parseNumberField(elementReq.score);

      const updates: Partial<Element> = {};

      if (order !== null && order !== undefined) {
        updates.order = order;
      }

      if (score !== null && score !== undefined) {
        updates.score = score;
      }

      if (elementReq.content !== undefined) {
        const newContent = parseJsonField(elementReq.content);
        if (newContent === null) {
          throw new HttpError(
            400,
            `Element ${i}: content must be a valid JSON object`,
          );
        }

        updates.content = newContent;
      }

      if (Object.keys(updates).length === 0) {
        throw new HttpError(
          400,
          `Element ${i}: No valid fields provided for update`,
        );
      }

      // Handle file updates for FILE type elements
      if (fileMap[i] && element.type === ElementTypes.FILE) {
        updates.file_id = path.parse(fileMap[i].filename).name;
      }

      await element.update(updates);
      updatedElements.push(element);
    }

    const refreshedElements = await Element.findAll({
      where: {
        id: updatedElements.map((e) => e.id),
      },
    });

    return res.json(refreshedElements.map(toElementResponse));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const deleteElement = async (
  req: Request<{
    course_Id: string;
    module_id: string;
    page_id: string;
    element_id: string;
  }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );
    const elementId = parseId(req.params.element_id);

    if (elementId === null) {
      throw new HttpError(400, "Invalid element_id");
    }

    const element = await Element.findOne({
      where: { id: elementId, page_id: pageId },
    });

    if (!element) {
      throw new HttpError(404, "Element not found");
    }

    const deletedCount = await Element.destroy({
      where: { id: elementId },
    });

    if (deletedCount === 0) {
      throw new HttpError(404, "Element not found");
    }

    return res.json({ message: "Element deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const getElementFile = async (
  req: Request<{
    course_Id: string;
    module_id: string;
    page_id: string;
    element_id: string;
  }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { pageId } = await validateCourseModuleAndPage(
      req.params.course_Id,
      req.params.module_id,
      req.params.page_id,
    );
    const elementId = parseId(req.params.element_id);

    if (elementId === null) {
      throw new HttpError(400, "Invalid element_id");
    }

    const element = await Element.findOne({
      where: { id: elementId, page_id: pageId },
    });

    if (!element) {
      throw new HttpError(404, "Element not found");
    }

    if (!element.file_id) {
      throw new HttpError(404, "Element does not have an associated file");
    }

    // Find the file - it could have any extension
    const uploadsDir = path.join(
      PRIVATE_UPLOAD_STORAGE_PATH,
      "elements/documents",
    );
    const files = fs.readdirSync(uploadsDir);
    const fileWithId = files.find(
      (f) => path.parse(f).name === element.file_id,
    );

    if (!fileWithId) {
      throw new HttpError(404, "File not found");
    }

    const filePath = path.join(uploadsDir, fileWithId);

    // Check if file exists and is accessible
    if (!fs.existsSync(filePath)) {
      throw new HttpError(404, "File not found");
    }

    // Send the file
    return res.download(filePath);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const getCourseWorkshopsSummary = async (
  req: Request<{ course_Id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if course_Id is valid
    const courseId = parseId(req.params.course_Id);
    if (courseId === null) {
      throw new HttpError(400, "Invalid course_Id");
    }

    // Look for elements with type WORKSHOP in the course
    const workshops = await Element.findAll({
      where: {
        type: ElementTypes.WORKSHOP,
      },
      include: [
        {
          model: Page,
          as: "page",
          required: true,
          include: [
            {
              model: Module,
              as: "module",
              required: true,
              where: { course_id: courseId },
              attributes: [], // We don't need any fields from Module
            },
          ],
          attributes: [], // We don't need any fields from Page
        },
      ],
    });

    return res.json(workshops.map(toElementResponse));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const joinWorkshop = async (
  req: Request<{ course_Id: string; element_id: string }>,
  res: Response<
    { message: string; element: ElementResponse } | { message: string }
  >,
  next: NextFunction,
) => {
  try {
    // Check if course_Id is valid
    const courseId = parseId(req.params.course_Id);
    if (courseId === null) {
      throw new HttpError(400, "Invalid course_Id");
    }

    // Check if element_id is valid
    const elementId = parseId(req.params.element_id);
    if (elementId === null) {
      throw new HttpError(400, "Invalid element_id");
    }
    const element = await Element.findOne({
      where: {
        id: elementId,
        type: ElementTypes.WORKSHOP,
      },
      include: [
        {
          model: Page,
          as: "page",
          required: true,
          include: [
            {
              model: Module,
              as: "module",
              required: true,
              where: { course_id: courseId },
              attributes: [], // We don't need any fields from Module
            },
          ],
          attributes: [], // We don't need any fields from Page
        },
      ],
    });
    if (!element) {
      throw new HttpError(404, "Workshop not found in the specified course");
    }

    // TODO: Implement the logic to add the user to the workshop's participant list.

    return res.json({
      message: "Joined workshop successfully",
      element: toElementResponse(element),
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};
