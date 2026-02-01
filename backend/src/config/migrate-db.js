const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'poster_db',
  user: process.env.DB_USER || 'poster_user',
  password: process.env.DB_PASSWORD || 'poster_password',
});

async function migrateDatabase() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db-migration.sql'), 'utf8');
    await pool.query(sql);
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
