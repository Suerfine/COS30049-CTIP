import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import { Course, Discussion, Enrollment, Module, Page, User } from "../models";
import { UserRoles } from "../enum/UserRoles";

type SearchResult = {
  id: string;
  type: "course" | "module" | "page" | "discussion";
  title: string;
  category: string;
  description: string;
  url: string;
  enrollmentId: number;
  enrollmentStatus: string;
};

const toLikeQuery = (query: string) => `%${query.replace(/[%_]/g, "\\$&")}%`;

export const searchParkGuide = async (
  req: Request,
  res: Response<{ data: SearchResult[] } | { message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== UserRoles.PARK_GUIDE) {
      return res.status(403).json({ message: "Park guide search only" });
    }

    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query.length < 2) {
      return res.json({ data: [] });
    }

    const likeQuery = toLikeQuery(query);
    const enrollments = await Enrollment.findAll({
      where: { user_id: req.user.id },
      attributes: ["id", "course_id", "status"],
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "title"],
        },
      ],
      limit: 100,
    });

    const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.course_id))];
    if (courseIds.length === 0) {
      return res.json({ data: [] });
    }
    const enrollmentByCourseId = new Map(
      enrollments.map((enrollment) => [
        Number(enrollment.course_id),
        {
          id: Number(enrollment.id),
          status: String(enrollment.status),
        },
      ]),
    );

    const [courses, modules, pages, discussions] = await Promise.all([
      Course.findAll({
        where: {
          id: { [Op.in]: courseIds },
          [Op.or]: [
            { title: { [Op.like]: likeQuery } },
            { description: { [Op.like]: likeQuery } },
          ],
        },
        attributes: ["id", "title", "description"],
        limit: 8,
      }),
      Module.findAll({
        where: {
          course_id: { [Op.in]: courseIds },
          [Op.or]: [
            { title: { [Op.like]: likeQuery } },
            { description: { [Op.like]: likeQuery } },
          ],
        },
        attributes: ["id", "course_id", "title", "description"],
        include: [{ model: Course, as: "course", attributes: ["title"] }],
        limit: 8,
      }),
      Page.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: likeQuery } },
            { description: { [Op.like]: likeQuery } },
          ],
        },
        attributes: ["id", "module_id", "title", "description", "final_quiz"],
        include: [
          {
            model: Module,
            as: "module",
            attributes: ["id", "course_id", "title"],
            where: { course_id: { [Op.in]: courseIds } },
            include: [{ model: Course, as: "course", attributes: ["title"] }],
          },
        ],
        limit: 8,
      }),
      Discussion.findAll({
        where: {
          course_id: { [Op.in]: courseIds },
          title: { [Op.like]: likeQuery },
          [Op.or]: [
            { is_public: true },
            { user_id: req.user.id },
            { "$user.role$": UserRoles.ADMIN },
          ],
        },
        attributes: ["id", "course_id", "title", "is_public"],
        include: [
          { model: User, as: "user", attributes: ["role"] },
          { model: Course, as: "course", attributes: ["title"] },
        ],
        limit: 8,
      }),
    ]);

    const results: SearchResult[] = [
      ...courses.map((course: any) => ({
        id: `course-${course.id}`,
        type: "course" as const,
        title: course.title,
        category: "Courses",
        description: course.description || "Open enrolled course",
        url: `/courses/${course.id}`,
        enrollmentId: enrollmentByCourseId.get(Number(course.id))!.id,
        enrollmentStatus: enrollmentByCourseId.get(Number(course.id))!.status,
      })),
      ...modules.map((module: any) => ({
        id: `module-${module.id}`,
        type: "module" as const,
        title: module.title,
        category: "Course modules",
        description: `${module.course?.title || "Course"} > Module`,
        url: `/courses/${module.course_id}`,
        enrollmentId: enrollmentByCourseId.get(Number(module.course_id))!.id,
        enrollmentStatus: enrollmentByCourseId.get(Number(module.course_id))!.status,
      })),
      ...pages.map((page: any) => ({
        id: `page-${page.id}`,
        type: "page" as const,
        title: page.title,
        category: page.final_quiz ? "Course quizzes" : "Course pages",
        description: `${page.module?.course?.title || "Course"} > ${page.module?.title || "Module"}`,
        url: `/courses/${page.module?.course_id}`,
        enrollmentId: enrollmentByCourseId.get(Number(page.module?.course_id))!.id,
        enrollmentStatus: enrollmentByCourseId.get(Number(page.module?.course_id))!.status,
      })),
      ...discussions.map((discussion: any) => ({
        id: `discussion-${discussion.id}`,
        type: "discussion" as const,
        title: discussion.title,
        category: "Discussions",
        description: `${discussion.course?.title || "Course"} > Discussion`,
        url: `/courses/${discussion.course_id}/discussion/${discussion.id}`,
        enrollmentId: enrollmentByCourseId.get(Number(discussion.course_id))!.id,
        enrollmentStatus: enrollmentByCourseId.get(Number(discussion.course_id))!.status,
      })),
    ].slice(0, 20);

    return res.json({ data: results });
  } catch (err) {
    next(err);
  }
};
