const pool = require('./db');

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.query("ALTER TABLE notification ADD COLUMN type VARCHAR(20) DEFAULT 'system' AFTER user_id;");
    await connection.query("ALTER TABLE notification ADD COLUMN title VARCHAR(100) DEFAULT 'Notification' AFTER type;");
    await connection.query("ALTER TABLE notification ADD COLUMN is_read BOOLEAN DEFAULT FALSE AFTER sent_at;");
    // Also rename message to desc? Or just select message AS desc.
    console.log('Altered notification table');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error(e);
    }
  } finally {
    connection.release();
    process.exit();
  }
}

run();
