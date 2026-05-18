const pool = require('./db.js');
pool.query('ALTER TABLE profile MODIFY profile_picture LONGTEXT').then(() => {
  console.log('ALTER TABLE SUCCESS');
  process.exit(0);
}).catch(console.error);
