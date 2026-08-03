import mysql from 'mysql2/promise';

const run = async () => {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'com_question_bank'
  });

  console.log('Connected. Fixing empty statuses...');

  // Set all empty/null status questions to 'active' (they were approved or pending before migration)
  const [r1] = await c.execute("UPDATE questions SET status = 'active' WHERE status = '' OR status IS NULL");
  console.log(`Fixed ${r1.affectedRows} empty-status questions -> active`);

  // Mark questions with usage as 'used'
  const [r2] = await c.execute("UPDATE questions SET status = 'used' WHERE status = 'active' AND usageCount > 0");
  console.log(`Marked ${r2.affectedRows} questions with usage -> used`);

  // Show final counts
  const [stats] = await c.execute('SELECT status, COUNT(*) as cnt FROM questions GROUP BY status');
  console.log('\nFinal status counts:');
  stats.forEach(s => console.log(`  ${s.status || '(empty)'}: ${s.cnt}`));

  await c.end();
  console.log('\nDone!');
};

run();
