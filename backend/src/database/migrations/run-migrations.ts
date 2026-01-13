import fs from 'fs';
import path from 'path';
import pool from '../../config/database';

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migrations...');

    const migrationFile = path.join(__dirname, '001_create_tables.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
