const db = require('../config/database');

async function createShortLinksTable() {
  try {
    console.log('Criando tabela de links curtos...');

    // Extensão UUID se não existir
    await db.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Tabela de links curtos
    await db.query(`
      CREATE TABLE IF NOT EXISTS short_links (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        short_code VARCHAR(10) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
        clicks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_clicked_at TIMESTAMP
      )
    `);

    // Índices para performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(short_code);
      CREATE INDEX IF NOT EXISTS idx_short_links_proposal ON short_links(proposal_id);
    `);

    console.log('Tabela de links curtos criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela de links curtos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createShortLinksTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createShortLinksTable;