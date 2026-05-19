import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import { SensorStatus } from "../enum/SensorStatus";
class Sensor extends Model<
  InferAttributes<Sensor>,
  InferCreationAttributes<Sensor>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare type: string;
  declare longitude: number;
  declare latitude: number;
  declare current_status: SensorStatus;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}
Sensor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    current_status: {
      type: DataTypes.ENUM(...Object.values(SensorStatus)),
      allowNull: false,
      defaultValue: SensorStatus.DEACTIVATED,
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
  { sequelize, tableName: "sensors", timestamps: false },
);
export default Sensor;
