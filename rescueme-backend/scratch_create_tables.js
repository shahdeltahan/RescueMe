const pool = require('./db');

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS volunteer_assignment (
          assignment_id INT AUTO_INCREMENT PRIMARY KEY,
          volunteer_id INT NOT NULL,
          campaign_id INT,
          event_type_id INT,
          assigned_at DATETIME NOT NULL,
          FOREIGN KEY (campaign_id) REFERENCES campaign(campaign_id),
          FOREIGN KEY (event_type_id) REFERENCES event_type(event_type_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS volunteer_status (
          status_id INT AUTO_INCREMENT PRIMARY KEY,
          volunteer_id INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          updated_at DATETIME NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS volunteer_case_assignment (
        assignment_id INT AUTO_INCREMENT PRIMARY KEY,
        volunteer_id INT NOT NULL,
        report_id INT NOT NULL,
        progress_status VARCHAR(50) DEFAULT 'in-progress',
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL,
        FOREIGN KEY (volunteer_id) REFERENCES user(user_id) ON DELETE CASCADE,
        FOREIGN KEY (report_id) REFERENCES case_report(report_id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS volunteer_task (
        task_id INT AUTO_INCREMENT PRIMARY KEY,
        volunteer_id INT NOT NULL,
        task_text VARCHAR(255) NOT NULL,
        priority VARCHAR(20) DEFAULT 'Med',
        is_done BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (volunteer_id) REFERENCES user(user_id) ON DELETE CASCADE
      )
    `);

    console.log('Tables created');
  } catch(e) {
    console.error(e);
  } finally {
    connection.release();
    process.exit();
  }
}

run();
