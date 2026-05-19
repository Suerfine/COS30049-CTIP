const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const db = new sqlite3.Database('./storage/dev_db.sqlite');

// Get the latest user
db.get('SELECT id, identification, password_hash FROM users ORDER BY id DESC LIMIT 1', (err, user) => {
  if (err) throw err;
  
  console.log(`\nTesting user: ${user.identification}`);
  console.log(`Current hash: ${user.password_hash.substring(0, 30)}...`);
  
  rl.question('\nWhat password did you set during reset? ', (password) => {
    const isValid = bcrypt.compareSync(password, user.password_hash);
    console.log(`\nPassword verification result: ${isValid}`);
    
    if (!isValid) {
      console.log('The password does NOT match the hash.');
      console.log('This means either:');
      console.log('1. You entered a different password');
      console.log('2. The reset endpoint is saving the wrong password');
    } else {
      console.log('The password DOES match! Try logging in again.');
    }
    
    db.close();
    rl.close();
  });
});
