import User from "./User";
import Course from "./Course";
import Module from "./Module";
import Page from "./Page";
import Element from "./Element";
import Enrollment from "./Enrollment";

// Associations
Course.hasMany(Module, { foreignKey: "course_id", as: "modules" });
Module.belongsTo(Course, { foreignKey: "course_id", as: "course" });

Module.hasMany(Page, { foreignKey: "module_id", as: "pages" });
Page.belongsTo(Module, { foreignKey: "module_id", as: "module" });

Page.hasMany(Element, { foreignKey: "page_id", as: "elements" });
Element.belongsTo(Page, { foreignKey: "page_id", as: "page" });

User.hasMany(Enrollment, { foreignKey: "user_id", as: "enrollments" });
Enrollment.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.belongsToMany(Course, { through: Enrollment, foreignKey: "user_id", otherKey: "course_id", as: "enrolled_courses" });
Course.belongsToMany(User, { through: Enrollment, foreignKey: "course_id", otherKey: "user_id", as: "enrolled_users" });
Course.hasMany(Enrollment, { foreignKey: "course_id", as: "enrollments" });
Enrollment.belongsTo(Course, { foreignKey: "course_id", as: "course" });

export { User, Course, Module, Page, Element, Enrollment };