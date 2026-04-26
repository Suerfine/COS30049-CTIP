import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/Database";
import { RegistrationStatus } from "../enum/RegistrationStatus";
import User from "./User";

class Registration extends Model<
  InferAttributes<Registration>,
  InferCreationAttributes<Registration>
> {
  declare id: CreationOptional<number>;
  declare user_id: CreationOptional<ForeignKey<User["id"]> | null>;
  declare reviewed_by_user_id: CreationOptional<ForeignKey<User["id"]> | null>;
  declare status: RegistrationStatus;
  declare firstname: string;
  declare lastname: string;
  declare identification: string;
  declare personal_email: string;
  declare tel: string;
  declare admin_remark: CreationOptional<string | null>;
  declare reviewed_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

Registration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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
    status: {
      type: DataTypes.ENUM(...Object.values(RegistrationStatus)),
      allowNull: false,
      defaultValue: RegistrationStatus.PENDING,
    },
    firstname: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    identification: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    personal_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tel: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    admin_remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
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
    tableName: "registrations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  },
);

export default Registration;
