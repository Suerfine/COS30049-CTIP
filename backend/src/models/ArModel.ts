import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import User from "./User";

class ArModel extends Model<InferAttributes<ArModel>, InferCreationAttributes<ArModel>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: CreationOptional<string | null>;
  declare model_path: string;
  declare model_format: string;
  declare model_size_bytes: number;
  declare mime_type: string;
  declare original_filename: string;
  declare pattern_path: CreationOptional<string | null>;
  declare created_by_user_id: CreationOptional<ForeignKey<User["id"]> | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

ArModel.init(
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
    model_path: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    model_format: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    model_size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    pattern_path: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
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
    tableName: "ar_models",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  },
);

export default ArModel;
