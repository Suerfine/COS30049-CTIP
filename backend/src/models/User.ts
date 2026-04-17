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
  declare role: UserRoles;
  declare password_hash: string;
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
    role: {
        type: DataTypes.ENUM(...Object.values(UserRoles)),
        allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
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
      },
      beforeSave: async (user) => {
        if (!user.changed("username")) {
          return;
        }

        const existingUser = await User.findOne({
          where: { username: user.username },
          paranoid: false,
        });

        if (existingUser && existingUser.id !== user.id) {
          throw new ValidationError("Username already exists", []);
        }
      },
    },
  },
);

export default User;
