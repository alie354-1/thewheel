import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

// Get database connection details from environment variables
const pool = new Pool({
  host: process.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0] + '.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.VITE_SUPABASE_ANON_KEY,
  ssl: true
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of executed migrations
    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedMigrationNames = executedMigrations.map(row => row.name);

    // Get all migration files
    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const sql = readFileSync(join(migrationsDir, file), 'utf8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    }

    console.log('All migrations completed successfully');
  } finally {
    client.release();
  }
}

migrate().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});