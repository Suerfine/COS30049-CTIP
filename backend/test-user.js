const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./storage/dev_db.sqlite');

// Find the user with identification starting with 050812
db.all('SELECT id, identification, password_hash FROM users ORDER BY id DESC LIMIT 1', (err, rows) => {
  if (err) throw err;
  
  console.log('Latest user in DB:', rows[0]);
  
  if (rows[0]) {
    // Try to verify with a test password
    const testPassword = 'Test@12345';
    const isValid = bcrypt.compareSync(testPassword, rows[0].password_hash);
    console.log(`Password hash valid: ${isValid}`);
    console.log(`Hash format: ${rows[0].password_hash.substring(0, 10)}...`);
  }
  
  db.close();
});
