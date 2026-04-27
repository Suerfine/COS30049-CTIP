const {Sequelize}=require("sequelize");
const s=new Sequelize({dialect:"sqlite",storage:"./storage/dev_db.sqlite",logging:false});
(async()=>{
  const [rows]=await s.query("SELECT username, personal_email, role FROM users WHERE deleted_at IS NULL ORDER BY id;");
  for (const r of rows) console.log(r.username+"|"+r.personal_email+"|"+r.role);
  await s.close();
})().catch(e=>{console.error(e); process.exit(1);});
