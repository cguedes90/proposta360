const db = require('../config/database');

async function createTemplatesTable() {
  try {
    console.log('🚀 Criando tabela de templates...');

    // Tabela principal de templates
    await db.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        industry VARCHAR(100) NOT NULL,
        thumbnail_url VARCHAR(500),
        preview_url VARCHAR(500),
        is_premium BOOLEAN DEFAULT FALSE,
        price DECIMAL(10,2) DEFAULT 0,
        tags TEXT[],
        usage_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        created_by UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de conteúdo estruturado do template
    await db.query(`
      CREATE TABLE IF NOT EXISTS template_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
        section_type VARCHAR(100) NOT NULL,
        section_order INTEGER NOT NULL,
        content JSONB NOT NULL,
        styles JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de uso de templates pelos usuários
    await db.query(`
      CREATE TABLE IF NOT EXISTS template_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID REFERENCES templates(id),
        user_id UUID REFERENCES users(id),
        proposal_id UUID REFERENCES proposals(id),
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de avaliações de templates
    await db.query(`
      CREATE TABLE IF NOT EXISTS template_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID REFERENCES templates(id),
        user_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(template_id, user_id)
      )
    `);

    // Índices para performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_templates_industry ON templates(industry)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_templates_premium ON templates(is_premium)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_template_content_template_id ON template_content(template_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_template_usage_user_id ON template_usage(user_id)');

    console.log('✅ Tabelas de templates criadas com sucesso!');
    
    // Inserir templates iniciais
    await insertInitialTemplates();

  } catch (error) {
    console.error('❌ Erro ao criar tabelas de templates:', error);
  }
}

async function insertInitialTemplates() {
  console.log('📝 Inserindo templates iniciais...');

  const templates = [
    {
      name: 'Desenvolvimento de Website Profissional',
      description: 'Template completo para propostas de desenvolvimento web com seções otimizadas para conversão',
      category: 'technology',
      industry: 'Desenvolvimento Web',
      tags: ['website', 'desenvolvimento', 'e-commerce', 'responsivo'],
      thumbnail_url: '/images/templates/web-development-thumb.jpg',
      preview_url: '/templates/preview/web-development'
    },
    {
      name: 'Consultoria em Marketing Digital',
      description: 'Proposta estruturada para serviços de marketing digital com métricas e resultados esperados',
      category: 'marketing',
      industry: 'Marketing Digital',
      tags: ['marketing', 'digital', 'redes sociais', 'campanhas'],
      thumbnail_url: '/images/templates/marketing-thumb.jpg',
      preview_url: '/templates/preview/marketing'
    },
    {
      name: 'Serviços Jurídicos Empresariais',
      description: 'Template profissional para escritórios de advocacia com foco em serviços corporativos',
      category: 'legal',
      industry: 'Jurídico',
      tags: ['juridico', 'advocacia', 'consultoria', 'empresarial'],
      thumbnail_url: '/images/templates/legal-thumb.jpg',
      preview_url: '/templates/preview/legal'
    },
    {
      name: 'Design de Identidade Visual',
      description: 'Proposta completa para projetos de branding e identidade visual corporativa',
      category: 'design',
      industry: 'Design Gráfico',
      tags: ['design', 'branding', 'logo', 'identidade visual'],
      thumbnail_url: '/images/templates/design-thumb.jpg',
      preview_url: '/templates/preview/design'
    },
    {
      name: 'Consultoria Empresarial Estratégica',
      description: 'Template para consultorias de negócios com metodologia e cronograma detalhados',
      category: 'business',
      industry: 'Consultoria Empresarial',
      tags: ['consultoria', 'estrategia', 'negocios', 'processo'],
      thumbnail_url: '/images/templates/business-thumb.jpg',
      preview_url: '/templates/preview/business'
    }
  ];

  for (const template of templates) {
    try {
      const result = await db.query(`
        INSERT INTO templates (name, description, category, industry, tags, thumbnail_url, preview_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        template.name,
        template.description, 
        template.category,
        template.industry,
        template.tags,
        template.thumbnail_url,
        template.preview_url
      ]);

      const templateId = result.rows[0].id;
      console.log(`✅ Template "${template.name}" criado com ID: ${templateId}`);

      // Inserir conteúdo estruturado para cada template
      await insertTemplateContent(templateId, template.category);

    } catch (error) {
      console.error(`❌ Erro ao inserir template "${template.name}":`, error);
    }
  }
}

async function insertTemplateContent(templateId, category) {
  const contentSections = getTemplateContentByCategory(category);
  
  for (let i = 0; i < contentSections.length; i++) {
    const section = contentSections[i];
    
    await db.query(`
      INSERT INTO template_content (template_id, section_type, section_order, content, styles)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      templateId,
      section.type,
      i + 1,
      JSON.stringify(section.content),
      JSON.stringify(section.styles || {})
    ]);
  }
}

function getTemplateContentByCategory(category) {
  const baseStructure = [
    {
      type: 'hero',
      content: {
        title: 'Transforme Sua Visão em Realidade',
        subtitle: 'Solução completa e profissional para suas necessidades',
        ctaText: 'Aceitar Proposta',
        backgroundImage: '/images/hero-bg.jpg'
      },
      styles: {
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        textColor: '#ffffff',
        alignment: 'center'
      }
    },
    {
      type: 'company_info',
      content: {
        companyName: '{{COMPANY_NAME}}',
        description: 'Especialistas em entregar resultados excepcionais',
        logo: '/images/logo.png'
      },
      styles: {
        layout: 'side-by-side',
        backgroundColor: '#f8fafc'
      }
    },
    {
      type: 'services_grid',
      content: {
        title: 'Serviços Inclusos',
        services: []
      },
      styles: {
        columns: 3,
        spacing: '2rem'
      }
    },
    {
      type: 'investment_summary',
      content: {
        title: 'Resumo do Investimento',
        items: [],
        total: '{{TOTAL_AMOUNT}}',
        discount: 0
      },
      styles: {
        highlightColor: '#16a34a',
        borderColor: '#2563eb'
      }
    },
    {
      type: 'cta_final',
      content: {
        title: 'Pronto para Começar?',
        description: 'Aceite nossa proposta e vamos transformar sua ideia em realidade',
        primaryButton: 'Aceitar Proposta',
        secondaryButton: 'Agendar Conversa'
      },
      styles: {
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        textColor: '#ffffff'
      }
    }
  ];

  // Customizar serviços por categoria
  const servicesByCategory = {
    technology: [
      {
        icon: 'fas fa-code',
        title: 'Desenvolvimento Full-Stack',
        description: 'Sistema completo com frontend e backend modernos',
        price: 'R$ 15.000'
      },
      {
        icon: 'fas fa-mobile-alt',
        title: 'App Mobile Responsivo',
        description: 'Aplicação otimizada para dispositivos móveis',
        price: 'R$ 12.000'
      },
      {
        icon: 'fas fa-shield-alt',
        title: 'Segurança e Performance',
        description: 'Implementação de melhores práticas de segurança',
        price: 'R$ 5.000'
      }
    ],
    marketing: [
      {
        icon: 'fas fa-bullhorn',
        title: 'Estratégia Digital Completa',
        description: 'Planejamento estratégico para todas as plataformas',
        price: 'R$ 8.000'
      },
      {
        icon: 'fas fa-chart-line',
        title: 'Campanhas Pagas',
        description: 'Gestão profissional de Google Ads e Facebook Ads',
        price: 'R$ 6.000'
      },
      {
        icon: 'fas fa-users',
        title: 'Gestão de Redes Sociais',
        description: 'Conteúdo e engajamento nas principais redes',
        price: 'R$ 4.000'
      }
    ],
    legal: [
      {
        icon: 'fas fa-gavel',
        title: 'Consultoria Jurídica Especializada',
        description: 'Análise completa da situação legal da empresa',
        price: 'R$ 10.000'
      },
      {
        icon: 'fas fa-file-contract',
        title: 'Elaboração de Contratos',
        description: 'Documentos jurídicos personalizados e seguros',
        price: 'R$ 5.000'
      },
      {
        icon: 'fas fa-balance-scale',
        title: 'Representação Legal',
        description: 'Acompanhamento em processos e negociações',
        price: 'R$ 15.000'
      }
    ],
    design: [
      {
        icon: 'fas fa-palette',
        title: 'Identidade Visual Completa',
        description: 'Logo, cores, tipografia e manual de marca',
        price: 'R$ 8.000'
      },
      {
        icon: 'fas fa-paint-brush',
        title: 'Material Gráfico',
        description: 'Cartões, folders, banners e peças digitais',
        price: 'R$ 6.000'
      },
      {
        icon: 'fas fa-desktop',
        title: 'Design Digital',
        description: 'Layouts para web e redes sociais',
        price: 'R$ 4.000'
      }
    ],
    business: [
      {
        icon: 'fas fa-chart-pie',
        title: 'Análise Estratégica',
        description: 'Diagnóstico completo do negócio e oportunidades',
        price: 'R$ 12.000'
      },
      {
        icon: 'fas fa-cogs',
        title: 'Otimização de Processos',
        description: 'Melhoria da eficiência operacional',
        price: 'R$ 10.000'
      },
      {
        icon: 'fas fa-target',
        title: 'Plano de Crescimento',
        description: 'Estratégia detalhada para expansão do negócio',
        price: 'R$ 8.000'
      }
    ]
  };

  // Adicionar serviços específicos da categoria
  const services = servicesByCategory[category] || servicesByCategory.technology;
  baseStructure[2].content.services = services;

  // Calcular total baseado nos serviços
  const total = services.reduce((sum, service) => {
    const price = parseFloat(service.price.replace('R$ ', '').replace('.', ''));
    return sum + price;
  }, 0);

  baseStructure[3].content.total = `R$ ${total.toLocaleString('pt-BR')}`;
  baseStructure[3].content.items = services.map(service => ({
    name: service.title,
    price: service.price
  }));

  return baseStructure;
}

// Executar migration se chamado diretamente
if (require.main === module) {
  createTemplatesTable()
    .then(() => {
      console.log('🎉 Migration de templates concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro na migration:', error);
      process.exit(1);
    });
}

module.exports = { createTemplatesTable };