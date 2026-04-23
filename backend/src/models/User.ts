import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ValidationError,
} from "sequelize";
import sequelize from "../config/Database";
import { UserRoles } from "../enum/UserRoles";

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare username: string;
  declare identification: string;
  declare personal_email: string;
  declare role: UserRoles;
  declare password_hash: string;
  declare last_login_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    identification: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    personal_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    role: {
        type: DataTypes.ENUM(...Object.values(UserRoles)),
        allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
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
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
    hooks: {
      beforeValidate: (user) => {
        if (typeof user.username === "string") {
          user.username = user.username.trim();
        }
        if (typeof user.identification === "string") {
          user.identification = user.identification.trim();
        }
        if (typeof user.personal_email === "string") {
          user.personal_email = user.personal_email.trim().toLowerCase();
        }
      },
      beforeSave: async (user) => {
        const uniqueFields = [
          { field: "username", value: user.username, message: "Username already exists" },
          { field: "identification", value: user.identification, message: "Identification already exists" },
          { field: "personal_email", value: user.personal_email, message: "Personal email already exists" },
        ] as const;

        for (const uniqueField of uniqueFields) {
          if (!user.changed(uniqueField.field)) {
            continue;
          }

          const existingUser = await User.findOne({
            where: { [uniqueField.field]: uniqueField.value },
            paranoid: false,
          });

          if (existingUser && existingUser.id !== user.id) {
            throw new ValidationError(uniqueField.message, []);
          }
        }
      },
    },
  },
);

export default User;
