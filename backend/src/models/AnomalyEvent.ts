import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";

class AnomalyEvent extends Model<
  InferAttributes<AnomalyEvent>,
  InferCreationAttributes<AnomalyEvent>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare event_type:
    | "touching_plant"
    | "touching_animal"
    | "plucking_plants"
    | "hitting_animal"
    | "extended_plant_touch"
    | "extended_animal_touch"
    | "forest_fire"
    | "flooding"
    | "loud_noise"
    | "trespassing";
  declare metadata: CreationOptional<Record<string, any> | null>;
  declare latitude: CreationOptional<number | null>;
  declare longitude: CreationOptional<number | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

AnomalyEvent.init(
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
    event_type: {
      type: DataTypes.ENUM(
        "touching_plant",
        "touching_animal",
        "plucking_plants",
        "hitting_animal",
        "extended_plant_touch",
        "extended_animal_touch",
        "forest_fire",
        "flooding",
        "loud_noise",
        "trespassing"
      ),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional frame analysis data (pose keypoints, detection confidence, etc.)",
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
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
    tableName: "compliance_events",
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

export default AnomalyEvent;
