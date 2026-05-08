import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import User from "./User";
import Course from "./Course";

class Enrollment extends Model<
  InferAttributes<Enrollment>,
  InferCreationAttributes<Enrollment>
> {
  declare id: CreationOptional<number>;
  declare user_id: ForeignKey<User["id"]>;
  declare course_id: ForeignKey<Course["id"]>;
  declare status: EnrollmentStatus;
  declare enrolled_at: CreationOptional<Date>;
  declare completed_at: CreationOptional<Date | null>;
  declare reviewed_by_user_id: CreationOptional<ForeignKey<User["id"]> | null>;
  declare reviewed_at: CreationOptional<Date | null>;
  declare reviewed_comment: CreationOptional<string | null>;
  declare badge_expire_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "courses",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EnrollmentStatus)),
      allowNull: false,
      defaultValue: EnrollmentStatus.IN_PROGRESS,
    },
    enrolled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    badge_expire_at: {
      type: DataTypes.DATE,
      allowNull: true, // Set to null if it wont ever expire
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
    tableName: "enrollments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  },
);

export default Enrollment;
