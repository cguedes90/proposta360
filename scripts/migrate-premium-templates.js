const db = require('../config/database');

async function createPremiumTemplateSystem() {
  try {
    console.log('🚀 Criando sistema de templates premium...');

    // Tabela de compras de templates
    await db.query(`
      CREATE TABLE IF NOT EXISTS template_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
        purchase_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_id VARCHAR(255),
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        UNIQUE(user_id, template_id)
      )
    `);

    // Tabela de carrinho de compras
    await db.query(`
      CREATE TABLE IF NOT EXISTS shopping_cart (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, template_id)
      )
    `);

    // Tabela de cupons de desconto
    await db.query(`
      CREATE TABLE IF NOT EXISTS discount_coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10,2) NOT NULL,
        min_purchase_amount DECIMAL(10,2) DEFAULT 0,
        max_uses INTEGER DEFAULT 1,
        current_uses INTEGER DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de uso de cupons
    await db.query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coupon_id UUID REFERENCES discount_coupons(id),
        user_id UUID REFERENCES users(id),
        purchase_id UUID REFERENCES template_purchases(id),
        discount_applied DECIMAL(10,2),
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_template_purchases_user_id ON template_purchases(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_template_purchases_status ON template_purchases(payment_status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON shopping_cart(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coupons_code ON discount_coupons(code)');

    console.log('✅ Sistema de templates premium criado com sucesso!');
    
    // Inserir cupons iniciais
    await insertInitialCoupons();

  } catch (error) {
    console.error('❌ Erro ao criar sistema premium:', error);
    throw error;
  }
}

async function insertInitialCoupons() {
  console.log('🎟️ Inserindo cupons promocionais...');

  const coupons = [
    {
      code: 'WELCOME10',
      description: 'Desconto de 10% para novos usuários',
      discount_type: 'percentage',
      discount_value: 10.00,
      min_purchase_amount: 50.00,
      max_uses: 1000,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    },
    {
      code: 'PREMIUM50',
      description: 'R$ 50 off em compras acima de R$ 200',
      discount_type: 'fixed',
      discount_value: 50.00,
      min_purchase_amount: 200.00,
      max_uses: 500,
      valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 dias
    },
    {
      code: 'BLACKFRIDAY',
      description: 'Black Friday - 30% off em todos os templates premium',
      discount_type: 'percentage',
      discount_value: 30.00,
      min_purchase_amount: 0,
      max_uses: 10000,
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    }
  ];

  for (const coupon of coupons) {
    try {
      await db.query(`
        INSERT INTO discount_coupons (code, description, discount_type, discount_value, min_purchase_amount, max_uses, valid_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (code) DO NOTHING
      `, [
        coupon.code,
        coupon.description,
        coupon.discount_type,
        coupon.discount_value,
        coupon.min_purchase_amount,
        coupon.max_uses,
        coupon.valid_until
      ]);
      
      console.log(`✅ Cupom "${coupon.code}" criado`);
    } catch (error) {
      console.error(`❌ Erro ao criar cupom "${coupon.code}":`, error);
    }
  }
}

// Executar migration se chamado diretamente
if (require.main === module) {
  createPremiumTemplateSystem()
    .then(() => {
      console.log('🎉 Sistema premium de templates configurado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro na configuração:', error);
      process.exit(1);
    });
}

module.exports = { createPremiumTemplateSystem };