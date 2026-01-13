import bcrypt from 'bcrypt';
import pool from '../config/database';

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...');

    // Check if admin user already exists
    const existingUser = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);

    if (existingUser.rows.length > 0) {
      console.log('✅ Admin user already exists');
    } else {
      // Create admin user
      const passwordHash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO users (username, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4)`,
        ['admin', passwordHash, 'admin', true]
      );
      console.log('✅ Admin user created (username: admin, password: admin123)');
    }

    // Add sample client
    const clientResult = await client.query(
      `INSERT INTO clients (client_code, name, industry, contact_person, contact_email)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (client_code) DO NOTHING
       RETURNING client_id`,
      ['C001', 'サンプル株式会社', 'IT', '山田太郎', 'yamada@example.com']
    );

    if (clientResult.rows.length > 0) {
      console.log('✅ Sample client created');
    }

    // Add sample employee
    const employeeResult = await client.query(
      `INSERT INTO employees (employee_code, name, department, position, standard_unit_cost)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_code) DO NOTHING
       RETURNING employee_id`,
      ['E001', '佐藤花子', '営業部', 'マネージャー', 5000]
    );

    if (employeeResult.rows.length > 0) {
      console.log('✅ Sample employee created');
    }

    console.log('�� Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
