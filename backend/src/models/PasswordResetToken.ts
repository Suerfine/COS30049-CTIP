import { Model, DataTypes } from "sequelize";
import sequelize from "../config/Database";

class PasswordResetToken extends Model {
  public id!: number;
  public user_id!: number;
  public token_hash!: string;
  public expires_at!: Date;
  public used_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    token_hash: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "password_reset_tokens",
    sequelize,
    underscored: true,
    timestamps: true,
  },
);

export default PasswordResetToken;
