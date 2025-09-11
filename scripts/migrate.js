const db = require('../config/database');

async function createTables() {
  try {
    await db.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        private_title VARCHAR(255),
        public_link UUID UNIQUE DEFAULT uuid_generate_v4(),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        content JSONB,
        is_reusable BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS proposal_sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
        section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS proposal_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
        viewer_ip VARCHAR(45),
        viewer_user_agent TEXT,
        sections_viewed JSONB DEFAULT '[]',
        time_spent INTEGER DEFAULT 0,
        first_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS proposal_interactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
        view_id UUID REFERENCES proposal_views(id) ON DELETE CASCADE,
        interaction_type VARCHAR(50) NOT NULL,
        section_id UUID,
        interaction_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        sent_email BOOLEAN DEFAULT false,
        sent_whatsapp BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
      CREATE INDEX IF NOT EXISTS idx_proposals_public_link ON proposals(public_link);
      CREATE INDEX IF NOT EXISTS idx_sections_user_id ON sections(user_id);
      CREATE INDEX IF NOT EXISTS idx_proposal_sections_proposal_id ON proposal_sections(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_files_section_id ON files(section_id);
      CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal_id ON proposal_views(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);

    console.log('✅ Todas as tabelas foram criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    await db.pool.end();
  }
}

if (require.main === module) {
  createTables();
}

module.exports = { createTables };