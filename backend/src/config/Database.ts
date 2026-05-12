import path from "path";
import { Sequelize } from "sequelize";

const dialect = (process.env.DB_DIALECT || "sqlite").toLowerCase();

let sequelize: Sequelize;

if (dialect === "sqlite") {
  const storagePath = path.resolve(
    __dirname,
    "../../",
    process.env.DB_STORAGE || "storage/dev_db.sqlite",
  );

  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: storagePath,
  });
} else if (dialect === "mysql") {
  sequelize = new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
  });
} else {
  throw new Error(`Unsupported DB_DIALECT: ${dialect}. Use sqlite or mysql.`);
}

export default sequelize;
