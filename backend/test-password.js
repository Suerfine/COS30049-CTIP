const bcrypt = require('bcryptjs');

const password = 'Nurfawzia80*';
const hash = '$2b$12$XH6gsqBlyZMc5TsZPvZdru8.jGUzphVOw/u.1QwXLs8arri1Jf.gO';

const isValid = bcrypt.compareSync(password, hash);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log(`Match result: ${isValid}`);

// Also test hashing it to see what we get
const newHash = bcrypt.hashSync(password, 12);
console.log(`\nNew hash if we hash this password: ${newHash}`);
console.log(`Would this new hash match the password? ${bcrypt.compareSync(password, newHash)}`);
