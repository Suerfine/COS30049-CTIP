import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import Enrollment from "./Enrollment";
import Element from "./Element";
import User from "./User";
import { encryptAssessmentData } from "../utils/assessmentData";
import { isRandomlyEncrypted } from "../utils/encryption";

class Submission extends Model<
  InferAttributes<Submission>,
  InferCreationAttributes<Submission>
> {
  declare id: CreationOptional<number>;
  declare enrollment_id: ForeignKey<Enrollment["id"]>;
  declare element_id: ForeignKey<Element["id"]>;
  declare submission_id: CreationOptional<ForeignKey<Submission["id"]> | null>;
  declare marked_by_user_id: CreationOptional<ForeignKey<User["id"]> | null>;
  declare data: string;
  declare earned_grade: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

Submission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    enrollment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "enrollments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    element_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "elements",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    submission_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "submissions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    marked_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
      set(value: unknown) {
        if (typeof value === "string" && isRandomlyEncrypted(value)) {
          this.setDataValue("data", value);
          return;
        }

        this.setDataValue("data", encryptAssessmentData(value));
      },
    },
    earned_grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "submissions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  },
);

export default Submission;
