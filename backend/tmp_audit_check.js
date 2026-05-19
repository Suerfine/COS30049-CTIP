const {Sequelize} = require("sequelize");
const s = new Sequelize({dialect: "sqlite", storage: "./storage/dev_db.sqlite", logging: false});
(async ()=>{
  const [rows] = await s.query("SELECT id, event_type, path, status_code, request_data, response_data, created_at FROM audit_logs ORDER BY id DESC LIMIT 5;");
  console.log(JSON.stringify(rows, null, 2));
  await s.close();
})().catch(e=>{console.error(e); process.exit(1);});
