const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

async function createSuperAdmin() {
  try {
    const email = 'admin@propostaswin.com';
    const password = 'SuperAdmin123!';
    const name = 'Super Administrador';

    // Check if super admin already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('Super admin already exists!');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create super admin user
    const userId = uuidv4();
    const result = await db.query(`
      INSERT INTO users (id, name, email, password, role, plan, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [userId, name, email, hashedPassword, 'super_admin', 'premium']);

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: super_admin');
    console.log('');
    console.log('You can now login at /dashboard and access admin panel at /admin');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    process.exit(0);
  }
}

createSuperAdmin();