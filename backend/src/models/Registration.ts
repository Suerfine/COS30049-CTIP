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
import {
  decryptDeterministic,
  encryptDeterministic,
  transformWhereForEncryptedFields,
} from "../utils/encryption";

const REGISTRATION_ENCRYPTED_FIELD_CONTEXT = {
  firstname: "registration.firstname",
  lastname: "registration.lastname",
  identification: "registration.identification",
  personal_email: "registration.personal_email",
  tel: "registration.tel",
} as const;

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
  declare document_filepath: CreationOptional<string | null>;
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
      set(value: string) {
        const normalized = typeof value === "string" ? value.trim() : value;
        this.setDataValue(
          "firstname",
          encryptDeterministic(normalized, REGISTRATION_ENCRYPTED_FIELD_CONTEXT.firstname),
        );
      },
      get() {
        const raw = this.getDataValue("firstname");
        return decryptDeterministic(
          raw,
          REGISTRATION_ENCRYPTED_FIELD_CONTEXT.firstname,
        );
      },
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      set(value: string) {
        const normalized = typeof value === "string" ? value.trim() : value;
        this.setDataValue(
          "lastname",
          encryptDeterministic(normalized, REGISTRATION_ENCRYPTED_FIELD_CONTEXT.lastname),
        );
      },
      get() {
        const raw = this.getDataValue("lastname");
        return decryptDeterministic(raw, REGISTRATION_ENCRYPTED_FIELD_CONTEXT.lastname);
      },
    },
    identification: {
      type: DataTypes.STRING(30),
      allowNull: false,
      set(value: string) {
        const normalized = typeof value === "string" ? value.trim() : value;
        this.setDataValue(
          "identification",
          encryptDeterministic(
            normalized,
            REGISTRATION_ENCRYPTED_FIELD_CONTEXT.identification,
          ),
        );
      },
      get() {
        const raw = this.getDataValue("identification");
        return decryptDeterministic(
          raw,
          REGISTRATION_ENCRYPTED_FIELD_CONTEXT.identification,
        );
      },
    },
    personal_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(value: string) {
        const normalized =
          typeof value === "string" ? value.trim().toLowerCase() : value;
        this.setDataValue(
          "personal_email",
          encryptDeterministic(
            normalized,
            REGISTRATION_ENCRYPTED_FIELD_CONTEXT.personal_email,
          ),
        );
      },
      get() {
        const raw = this.getDataValue("personal_email");
        return decryptDeterministic(
          raw,
          REGISTRATION_ENCRYPTED_FIELD_CONTEXT.personal_email,
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
          encryptDeterministic(normalized, REGISTRATION_ENCRYPTED_FIELD_CONTEXT.tel),
        );
      },
      get() {
        const raw = this.getDataValue("tel");
        return decryptDeterministic(raw, REGISTRATION_ENCRYPTED_FIELD_CONTEXT.tel);
      },
    },
    document_filepath: {
      type: DataTypes.STRING(1024),
      allowNull: true,
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
    hooks: {
      beforeFind: (options) => {
        if (!options?.where) {
          return;
        }

        transformWhereForEncryptedFields(
          options.where as Record<string | symbol, unknown>,
          REGISTRATION_ENCRYPTED_FIELD_CONTEXT,
        );
      },
    },
  },
);

export default Registration;
