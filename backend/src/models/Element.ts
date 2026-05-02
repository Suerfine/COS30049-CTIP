import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import Page from "./Page";
import { ElementTypes } from "../enum/ElementTypes";

class Element extends Model<
  InferAttributes<Element>,
  InferCreationAttributes<Element>
> {
  declare id: CreationOptional<number>;
  declare page_id: ForeignKey<Page["id"]>;
  declare order: number;
  declare type: ElementTypes;
  declare content: Record<string, unknown>;
  declare score: CreationOptional<number | null>;
  declare file_id: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

Element.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    page_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "pages",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ElementTypes)),
      allowNull: false,
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    file_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      comment:
        "Internal use only - stores UUID of uploaded file, not modifiable by users",
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
    tableName: "elements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  },
);

export default Element;
