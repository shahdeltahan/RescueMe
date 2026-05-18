const pool = require('./db');

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [reports] = await connection.query("SELECT report_id FROM CASE_REPORT WHERE animal_type IS NULL OR trim(animal_type) = '' OR animal_type = 'Unknown Animal'");
    
    if (reports.length > 0) {
      const reportIds = reports.map(r => r.report_id);
      
      // Delete from ANIMAL
      await connection.query("DELETE FROM ANIMAL WHERE report_id IN (?)", [reportIds]);
      
      // Delete from REPORT_LOCATION
      await connection.query("DELETE FROM REPORT_LOCATION WHERE report_id IN (?)", [reportIds]);

      // Delete from CASE_REPORT
      const [res] = await connection.query("DELETE FROM CASE_REPORT WHERE report_id IN (?)", [reportIds]);
      
      console.log('Deleted rows:', res.affectedRows);
    } else {
      console.log('No unknown animals found.');
    }

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    console.error(e);
  } finally {
    connection.release();
    process.exit();
  }
}

run();
