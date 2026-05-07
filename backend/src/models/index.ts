import User from "./User";
import Course from "./Course";
import Module from "./Module";
import Page from "./Page";
import Element from "./Element";
import Enrollment from "./Enrollment";
import Event from "./Event";
import Registration from "./Registration";
import Submission from "./Submissions";
import Discussion from "./Discussion";
import Message from "./Messages";
import Tag from "./Tag";
import Notification from "./Notification";
import CourseTag from "./CourseTag";
import Sensor from "./Sensor";
import SensorLog from "./SensorLogs";
import PrerequisiteGroup from "./PrerequisiteGroup";
import Prerequisite from "./Prerequisite";
import { RegistrationStatus } from "../enum/RegistrationStatus";

// Associations
Course.hasMany(Module, { foreignKey: "course_id", as: "modules" });
Module.belongsTo(Course, { foreignKey: "course_id", as: "course" });

Module.hasMany(Page, { foreignKey: "module_id", as: "pages" });
Page.belongsTo(Module, { foreignKey: "module_id", as: "module" });

Page.hasMany(Element, { foreignKey: "page_id", as: "elements" });
Element.belongsTo(Page, { foreignKey: "page_id", as: "page" });

User.hasMany(Enrollment, { foreignKey: "user_id", as: "enrollments" });
Enrollment.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: "user_id",
  otherKey: "course_id",
  as: "enrolled_courses",
});
Course.belongsToMany(User, {
  through: Enrollment,
  foreignKey: "course_id",
  otherKey: "user_id",
  as: "enrolled_users",
});
Course.hasMany(Enrollment, { foreignKey: "course_id", as: "enrollments" });
Enrollment.belongsTo(Course, { foreignKey: "course_id", as: "course" });

Event.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Event, { foreignKey: "user_id", as: "events" });

User.hasMany(Registration, {
  foreignKey: "reviewed_by_user_id",
  as: "reviewed_registrations",
});
Registration.belongsTo(User, {
  foreignKey: "reviewed_by_user_id",
  as: "reviewed_by",
});

User.hasMany(Registration, { foreignKey: "user_id", as: "registrations" });
Registration.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasOne(Registration, {
  foreignKey: "user_id",
  as: "accepted_registration",
  scope: { status: RegistrationStatus.APPROVED },
});

Enrollment.hasMany(Submission, {
  foreignKey: "enrollment_id",
  as: "submissions",
});
Submission.belongsTo(Enrollment, {
  foreignKey: "enrollment_id",
  as: "enrollment",
});

Element.hasMany(Submission, { foreignKey: "element_id", as: "submissions" });
Submission.belongsTo(Element, { foreignKey: "element_id", as: "element" });

Submission.hasMany(Submission, {
  foreignKey: "submission_id",
  as: "child_submissions",
});
Submission.belongsTo(Submission, {
  foreignKey: "submission_id",
  as: "parent_submission",
});

User.hasMany(Submission, {
  foreignKey: "marked_by_user_id",
  as: "marked_submissions",
});
Submission.belongsTo(User, {
  foreignKey: "marked_by_user_id",
  as: "marked_by",
});

Course.hasMany(Discussion, { foreignKey: "course_id", as: "discussions" });
Discussion.belongsTo(Course, { foreignKey: "course_id", as: "course" });

User.hasMany(Discussion, { foreignKey: "user_id", as: "discussions" });
Discussion.belongsTo(User, { foreignKey: "user_id", as: "user" });

Discussion.hasMany(Message, { foreignKey: "discussion_id", as: "messages" });
Message.belongsTo(Discussion, {
  foreignKey: "discussion_id",
  as: "discussion",
});

User.hasMany(Message, { foreignKey: "user_id", as: "messages" });
Message.belongsTo(User, { foreignKey: "user_id", as: "user" });

Course.belongsToMany(Tag, {
  through: CourseTag,
  foreignKey: "course_id",
  otherKey: "tag_id",
  as: "tags",
});
Tag.belongsToMany(Course, {
  through: CourseTag,
  foreignKey: "tag_id",
  otherKey: "course_id",
  as: "courses",
});

Course.hasMany(PrerequisiteGroup, {
  foreignKey: "course_id",
  as: "prerequisite_groups",
});
PrerequisiteGroup.belongsTo(Course, { foreignKey: "course_id", as: "course" });

PrerequisiteGroup.hasMany(Prerequisite, {
  foreignKey: "prerequisite_group_id",
  as: "prerequisites",
});
Prerequisite.belongsTo(PrerequisiteGroup, {
  foreignKey: "prerequisite_group_id",
  as: "prerequisite_group",
});

Prerequisite.belongsTo(Course, {
  foreignKey: "course_id",
  as: "prerequisite_course",
});
Course.hasMany(Prerequisite, {
  foreignKey: "course_id",
  as: "prerequisite_of",
});

User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

Sensor.hasMany(SensorLog, { foreignKey: "sensor_id", as: "logs" });
SensorLog.belongsTo(Sensor, { foreignKey: "sensor_id", as: "sensor" });

Enrollment.belongsTo(Course, { foreignKey: 'course_id' });
Course.hasMany(Enrollment, { foreignKey: 'course_id' });
Page.hasMany(Element, { foreignKey: 'page_id' });

export {
  User,
  Course,
  Module,
  Page,
  Element,
  Enrollment,
  Registration,
  Submission,
  Discussion,
  Message,
  Tag,
  CourseTag,
  PrerequisiteGroup,
  Prerequisite,
  Event,
  Notification,
  Sensor,
  SensorLog,
};
