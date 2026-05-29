import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import Course from "./Course";

class PrerequisiteGroup extends Model<
  InferAttributes<PrerequisiteGroup>,
  InferCreationAttributes<PrerequisiteGroup>
> {
  declare id: CreationOptional<number>;
  declare course_id: ForeignKey<Course["id"]>;
}

PrerequisiteGroup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
  },
  {
    sequelize,
    tableName: "prerequisite_groups",
    timestamps: true,
    paranoid: false,
  },
);

export default PrerequisiteGroup;
