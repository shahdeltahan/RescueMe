const pool = require('./db');

async function run() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'adoption_request' AND COLUMN_NAME = 'animal_id'`);
    console.log(rows);
    if(rows.length > 0 && rows[0].CONSTRAINT_NAME !== 'PRIMARY') {
        const cname = rows[0].CONSTRAINT_NAME;
        await connection.query(`ALTER TABLE adoption_request DROP FOREIGN KEY ${cname}`);
        await connection.query('ALTER TABLE adoption_request CHANGE animal_id report_id INT NOT NULL;');
        await connection.query('ALTER TABLE adoption_request ADD FOREIGN KEY (report_id) REFERENCES case_report(report_id) ON DELETE CASCADE;');
        console.log('Altered table adoption_request successfully.');
    }
  } catch(e) {
    console.error(e);
  } finally {
    connection.release();
    process.exit();
  }
}

run();
