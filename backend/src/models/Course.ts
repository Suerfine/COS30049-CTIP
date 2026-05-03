import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import { CourseStatus } from "../enum/CourseStatus";

const _DEFAULT_COURSE_EXPECTED_COMPLETION_WEEKS = Number.parseInt(
  process.env.DEFAULT_COURSE_EXPECTED_COMPLETION_WEEKS ?? "6",
  10,
);
const _DEFAULT_COURSE_MUST_COMPLETE_IN_WEEKS = Number.parseInt(
  process.env.DEFAULT_COURSE_MUST_COMPLETE_IN_WEEKS ?? "12",
  10,
);
const _DEFAULT_COURSE_BADGE_EXPIRE_IN_MONTHS = Number.parseInt(
  process.env.DEFAULT_COURSE_BADGE_EXPIRE_IN_MONTHS ?? "24",
  10,
);

class Course extends Model<
  InferAttributes<Course>,
  InferCreationAttributes<Course>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: CreationOptional<string | null>;
  declare status: CreationOptional<CourseStatus>;
  declare released_at: CreationOptional<Date | null>;
  declare expected_completion_weeks: CreationOptional<number | null>;
  declare must_complete_in_weeks: CreationOptional<number | null>;
  declare badge_expire_in_months: number;
  declare cover_img_path: CreationOptional<string>;
  declare badge_img_path: CreationOptional<string>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

Course.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CourseStatus)),
      allowNull: false,
      defaultValue: CourseStatus.UNRELEASED,
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    expected_completion_weeks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: _DEFAULT_COURSE_EXPECTED_COMPLETION_WEEKS,
    },
    must_complete_in_weeks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: _DEFAULT_COURSE_MUST_COMPLETE_IN_WEEKS,
    },
    badge_expire_in_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: _DEFAULT_COURSE_BADGE_EXPIRE_IN_MONTHS,
    },
    badge_img_path: {
      type: DataTypes.STRING(512),
    },
    cover_img_path: {
      type: DataTypes.STRING(512),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "courses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  },
);

export default Course;
