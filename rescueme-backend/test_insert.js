const pool = require('./db');
pool.query("INSERT INTO notification (user_id, type, title, message, sent_at, is_read) VALUES (11, 'alert', 'Test Notification', 'This is a test notification specifically for the account shh.', NOW(), 0)")
  .then(() => console.log('Done'))
  .catch(console.log)
  .finally(() => process.exit(0));
