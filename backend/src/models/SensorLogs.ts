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
import Registration from "./Registration";
import Sensor from "./Sensor";

class SensorLog extends Model<
  InferAttributes<SensorLog>,
  InferCreationAttributes<SensorLog>
> {
  declare id: CreationOptional<number>;
  declare sensor_id: ForeignKey<Sensor["id"]>;
  declare status: SensorStatus;
  declare data: JSON;
  declare created_at: CreationOptional<Date>;
}

SensorLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sensor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sensors",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SensorStatus)),
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { sequelize, tableName: "sensor_logs", timestamps: false },
);
export default SensorLog;
