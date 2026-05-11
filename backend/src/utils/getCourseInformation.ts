/**
 * This is a utilitiy function to extract all the text relevant to a course from the database.
 * The purpose of this function is to provide the AI chatbot with contextual information to
 * what the user is asking about.
 */
import { Element, Module, Page } from "../models";
import Course from "../models/Course";

export const getCourseInformationString = async (
  courseId: number,
): Promise<string> => {
  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return "Course information not found.";
    }

    let res = `
            # Course Information
            *Course Title:* ${course.title}
            *Course Description:* ${course.description}
            *Course Cost:* $${course.cost}
            *Expected Completion Time:* ${course.expected_completion_weeks ? course.expected_completion_weeks + " weeks" : "No expected completion time"}
            *Must Complete In:* ${course.must_complete_in_weeks ? course.must_complete_in_weeks + " weeks" : "No must complete time"}
            *Badge Expire In:* ${course.badge_expire_in_months} months
            ---
            `;
    const modules = await Module.findAll({ where: { course_id: course.id } });
    for (const module of modules) {
      res += `
        ## Module ${module.order}: ${module.title}
        *Description:* ${module.description || "No description"}
        *Complete By Week:* ${module.complete_by_week}
        ---`;
      const pages = await Page.findAll({ where: { module_id: module.id } });
      for (const page of pages) {
        res += `
            ### Page ${page.order}: ${page.title}
            *Page ID:* ${page.id}
            *Description:* ${page.description || "No description"}
            *Passing_score:* ${page.passing_score || "No passing score"}
            *Max Tries:* ${page.max_tries || "No max tries"}
            *Final Quiz:* ${page.final_quiz ? "Yes" : "No"}
            ---`;
        const elements = await Element.findAll({ where: { page_id: page.id } });
        for (const element of elements) {
          res += `
            #### Page ${page.order} Element ${element.order}
            *Type:* ${element.type}
            *Content:* ${JSON.stringify(element.content) || "No content"}
            ---`;
        }
      }
    }

    return res;
  } catch (err) {
    console.error("Error fetching course information:", err);
    throw err;
  }
};
