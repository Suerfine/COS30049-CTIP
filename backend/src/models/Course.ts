import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";

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
  declare expected_completion_weeks: number;
  declare must_complete_in_weeks: number;
  declare badge_expire_in_months: CreationOptional<number>;
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
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
      allowNull: true,
      defaultValue: _DEFAULT_COURSE_BADGE_EXPIRE_IN_MONTHS,
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
