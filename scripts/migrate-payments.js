const db = require('../config/database');

async function createPaymentTables() {
  try {
    console.log('💳 Criando tabelas de pagamento...');

    // Tabela de pedidos de pagamento
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        preference_id VARCHAR(255),
        payment_id VARCHAR(255),
        items JSONB NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'mercado_pago',
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Tabela de webhooks recebidos (para auditoria)
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_type VARCHAR(50),
        payment_id VARCHAR(255),
        external_reference VARCHAR(255),
        status VARCHAR(50),
        webhook_data JSONB,
        processed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_payment_orders_payment_id ON payment_orders(payment_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment_id ON payment_webhooks(payment_id)');

    console.log('✅ Tabelas de pagamento criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas de pagamento:', error);
    throw error;
  }
}

// Executar migration se chamado diretamente
if (require.main === module) {
  createPaymentTables()
    .then(() => {
      console.log('🎉 Migration de pagamentos concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro na migration:', error);
      process.exit(1);
    });
}

module.exports = { createPaymentTables };