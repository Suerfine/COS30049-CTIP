require('dotenv').config();

const dialect = (process.env.DB_DIALECT || 'sqlite').toLowerCase();

const baseConfig = {
  dialect: dialect,
};

let config;

if (dialect === 'sqlite') {
  config = {
    ...baseConfig,
    storage: process.env.DB_STORAGE || './storage/dev_db.sqlite',
  };
} else if (dialect === 'mysql') {
  config = {
    ...baseConfig,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
  };
} else {
  throw new Error(`Unsupported DB_DIALECT: ${dialect}. Use sqlite or mysql.`);
}

module.exports = {
  development: config,
  test: config,
  production: config,
};
