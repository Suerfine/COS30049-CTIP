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
import PrerequisiteGroup from "./PrerequisiteGroup";

class Prerequisite extends Model<
  InferAttributes<Prerequisite>,
  InferCreationAttributes<Prerequisite>
> {
  declare id: CreationOptional<number>;
  declare course_id: ForeignKey<Course["id"]>;
  declare prerequisite_group_id: ForeignKey<PrerequisiteGroup["id"]>;
}

Prerequisite.init(
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
    prerequisite_group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "prerequisite_groups",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "prerequisites",
    timestamps: true,
    paranoid: false,
  },
);

export default Prerequisite;
