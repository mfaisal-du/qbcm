import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'com_question_bank',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function reseedStatuses() {
  try {
    const connection = await pool.getConnection();

    // Get all questions
    const [questions] = await connection.query('SELECT id FROM questions');
    
    console.log(`Found ${questions.length} questions. Updating statuses...`);

    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    // Distribute statuses: 50% approved, 20% rejected, 30% pending
    for (let i = 0; i < questions.length; i++) {
      const id = questions[i].id;
      const random = Math.random();
      let status = 'pending';
      
      if (random < 0.5) {
        status = 'approved';
        approvedCount++;
      } else if (random < 0.7) {
        status = 'rejected';
        rejectedCount++;
      } else {
        status = 'pending';
        pendingCount++;
      }

      // Update question status
      await connection.query(
        'UPDATE questions SET status = ? WHERE id = ?',
        [status, id]
      );

      if ((i + 1) % 100 === 0) {
        console.log(`  Processed ${i + 1}/${questions.length} questions...`);
      }
    }

    console.log('\n✓ Status update complete!');
    console.log(`  Approved: ${approvedCount} (${Math.round((approvedCount / questions.length) * 100)}%)`);
    console.log(`  Rejected: ${rejectedCount} (${Math.round((rejectedCount / questions.length) * 100)}%)`);
    console.log(`  Pending: ${pendingCount} (${Math.round((pendingCount / questions.length) * 100)}%)`);

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error reseeding statuses:', error);
    process.exit(1);
  }
}

reseedStatuses();
