const db = require('../config/database');

async function migrateTrackingTables() {
  try {
    console.log('Criando tabelas de tracking...');

    // Extensão UUID se não existir
    await db.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Tabela de visitantes das propostas
    await db.query(`
      CREATE TABLE IF NOT EXISTS proposal_visitors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) NOT NULL,
        position VARCHAR(255),
        company VARCHAR(255),
        access_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
        first_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de interações dos visitantes
    await db.query(`
      CREATE TABLE IF NOT EXISTS proposal_visitor_interactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        visitor_id UUID NOT NULL REFERENCES proposal_visitors(id) ON DELETE CASCADE,
        proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        section_id UUID,
        time_spent INTEGER, -- em segundos
        scroll_percentage INTEGER, -- 0-100
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_proposal_visitors_proposal_id ON proposal_visitors(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_proposal_visitors_access_token ON proposal_visitors(access_token);
      CREATE INDEX IF NOT EXISTS idx_proposal_visitor_interactions_visitor_id ON proposal_visitor_interactions(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_proposal_visitor_interactions_proposal_id ON proposal_visitor_interactions(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_proposal_visitor_interactions_event_type ON proposal_visitor_interactions(event_type);
      CREATE INDEX IF NOT EXISTS idx_proposal_visitor_interactions_created_at ON proposal_visitor_interactions(created_at);
    `);

    console.log('Tabelas de tracking criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas de tracking:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateTrackingTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrateTrackingTables;