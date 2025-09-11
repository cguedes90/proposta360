const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration(migrationFile) {
  try {
    console.log(`🔄 Executando migração: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    const client = await pool.connect();
    
    try {
      await client.query(migrationSQL);
      console.log(`✅ Migração executada com sucesso: ${migrationFile}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Erro ao executar migração ${migrationFile}:`, error);
    throw error;
  }
}

async function main() {
  try {
    await runMigration('004_create_leads_table.sql');
    console.log('🎉 Migração de leads executada com sucesso!');
  } catch (error) {
    console.error('💥 Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMigration };