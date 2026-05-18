const pool = require('./db');
pool.query("SELECT u.user_id FROM `USER` u JOIN `ROLE` r ON u.role_id = r.role_id WHERE r.role_name = 'admin'")
  .then(([r]) => console.log(r))
  .catch(console.log)
  .finally(() => process.exit(0));
