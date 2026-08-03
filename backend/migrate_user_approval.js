import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function migrateUserApprovals() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'com_question_bank'
  });

  try {
    console.log('Starting user approval migration...');

    const alterStatements = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS isApproved TINYINT(1) NOT NULL DEFAULT 1",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS approvedBy INT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS approvedAt TIMESTAMP NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS mustChangePassword TINYINT(1) NOT NULL DEFAULT 0",
      "CREATE INDEX IF NOT EXISTS idx_isApproved ON users(isApproved)",
      "ALTER TABLE users ADD CONSTRAINT fk_users_approvedBy FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL"
    ];

    for (const sql of alterStatements) {
      try {
        await pool.execute(sql);
        console.log('✓ ' + sql.substring(0, 70) + '...');
      } catch (error) {
        const duplicateForeignKeyError = error?.errno === 121 || (error?.message || '').includes('Duplicate key on write or update');
        if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_FK_DUP_NAME' || duplicateForeignKeyError) {
          console.log('• Already applied: ' + sql.substring(0, 70) + '...');
        } else {
          throw error;
        }
      }
    }

    await pool.execute(
      "UPDATE users SET isApproved = 1, approvedAt = COALESCE(approvedAt, NOW()) WHERE role IN ('super_admin', 'administrator', 'reviewer')"
    );
    console.log('✓ Ensured privileged/reviewer accounts are approved');

    console.log('User approval migration completed successfully.');
    await pool.end();
  } catch (error) {
    console.error('User approval migration failed:', error.message);
    process.exit(1);
  }
}

migrateUserApprovals();
