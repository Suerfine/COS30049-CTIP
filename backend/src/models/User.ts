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
import {
  decryptDeterministic,
  encryptDeterministic,
  transformWhereForEncryptedFields,
} from "../utils/encryption";

const USER_ENCRYPTED_FIELD_CONTEXT = {
  identification: "user.identification",
  personal_email: "user.personal_email",
  tel: "user.tel",
} as const;

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare username: string;
  declare firstname: string;
  declare lastname: string;
  declare identification: string;
  declare personal_email: string;
  declare tel: string;
  declare role: UserRoles;
  declare password_hash: string;
  declare pfp_url: CreationOptional<string | null>;
  declare totp_secret: CreationOptional<string | null>;
  declare totp_enabled: CreationOptional<boolean>;
  declare must_change_password: CreationOptional<boolean>;
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
      unique: true,
      set(value: string) {
        const normalized = typeof value === "string" ? value.trim() : value;
        this.setDataValue(
          "identification",
          encryptDeterministic(
            normalized,
            USER_ENCRYPTED_FIELD_CONTEXT.identification,
          ),
        );
      },
      get() {
        const raw = this.getDataValue("identification");
        return decryptDeterministic(
          raw,
          USER_ENCRYPTED_FIELD_CONTEXT.identification,
        );
      },
    },
    personal_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      set(value: string) {
        const normalized =
          typeof value === "string" ? value.trim().toLowerCase() : value;
        this.setDataValue(
          "personal_email",
          encryptDeterministic(
            normalized,
            USER_ENCRYPTED_FIELD_CONTEXT.personal_email,
          ),
        );
      },
      get() {
        const raw = this.getDataValue("personal_email");
        return decryptDeterministic(
          raw,
          USER_ENCRYPTED_FIELD_CONTEXT.personal_email,
        );
      },
    },
    tel: {
      type: DataTypes.STRING(30),
      allowNull: false,
      set(value: string) {
        const normalized = typeof value === "string" ? value.trim() : value;
        this.setDataValue(
          "tel",
          encryptDeterministic(normalized, USER_ENCRYPTED_FIELD_CONTEXT.tel),
        );
      },
      get() {
        const raw = this.getDataValue("tel");
        return decryptDeterministic(raw, USER_ENCRYPTED_FIELD_CONTEXT.tel);
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRoles)),
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pfp_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    totp_secret: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
    },
    totp_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    must_change_password: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
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
        if (typeof user.firstname === "string") {
          user.firstname = user.firstname.trim();
        }
        if (typeof user.lastname === "string") {
          user.lastname = user.lastname.trim();
        }
        if (typeof user.identification === "string") {
          user.identification = user.identification.trim();
        }
        if (typeof user.personal_email === "string") {
          user.personal_email = user.personal_email.trim().toLowerCase();
        }
        if (typeof user.tel === "string") {
          user.tel = user.tel.trim();
        }
      },
      beforeFind: (options) => {
        if (!options?.where) {
          return;
        }

        transformWhereForEncryptedFields(
          options.where as Record<string | symbol, unknown>,
          USER_ENCRYPTED_FIELD_CONTEXT,
        );
      },
      beforeSave: async (user) => {
        const uniqueFields = [
          {
            field: "username",
            value: user.username,
            message: "Username already exists",
          },
          {
            field: "identification",
            value: user.identification,
            message: "Identification already exists",
          },
          {
            field: "personal_email",
            value: user.personal_email,
            message: "Personal email already exists",
          },
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
