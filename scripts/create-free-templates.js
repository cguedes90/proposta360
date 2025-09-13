const db = require('../config/database');

async function createFreeTemplates() {
  console.log('🆓 Criando templates gratuitos funcionais...');

  const templates = [
    {
      name: 'Template Básico - Serviços Gerais',
      description: 'Template simples e funcional para qualquer tipo de serviço. Estrutura clean e profissional.',
      category: 'business',
      industry: 'Serviços Gerais',
      tags: ['básico', 'simples', 'funcional', 'universal'],
      is_premium: false,
      price: 0
    },
    {
      name: 'Consultoria Empresarial Simples',
      description: 'Template prático para consultorias com seções essenciais e layout organizado.',
      category: 'business', 
      industry: 'Consultoria',
      tags: ['consultoria', 'empresarial', 'organizado', 'prático'],
      is_premium: false,
      price: 0
    },
    {
      name: 'Desenvolvimento Web Básico',
      description: 'Template funcional para propostas de desenvolvimento com estrutura técnica clara.',
      category: 'technology',
      industry: 'Tecnologia',
      tags: ['desenvolvimento', 'web', 'técnico', 'claro'],
      is_premium: false,
      price: 0
    },
    {
      name: 'Marketing Digital Essencial',
      description: 'Template direto ao ponto para serviços de marketing com foco em resultados.',
      category: 'marketing',
      industry: 'Marketing',
      tags: ['marketing', 'digital', 'resultados', 'essencial'],
      is_premium: false,
      price: 0
    },
    {
      name: 'Design Gráfico Funcional',
      description: 'Template prático para designers com portfolio e processo de trabalho bem definidos.',
      category: 'design',
      industry: 'Design',
      tags: ['design', 'gráfico', 'portfolio', 'processo'],
      is_premium: false,
      price: 0
    }
  ];

  for (const template of templates) {
    try {
      const result = await db.query(`
        INSERT INTO templates (name, description, category, industry, tags, is_premium, price, thumbnail_url, preview_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        template.name,
        template.description,
        template.category,
        template.industry,
        template.tags,
        template.is_premium,
        template.price,
        `/images/templates/free-${template.category}-thumb.jpg`,
        `/templates/preview/free-${template.category}`
      ]);

      const templateId = result.rows[0].id;
      console.log(`✅ Template gratuito "${template.name}" criado com ID: ${templateId}`);

      // Inserir conteúdo funcional para cada template
      await insertFreeTemplateContent(templateId, template.category, template.name);

    } catch (error) {
      console.error(`❌ Erro ao criar template "${template.name}":`, error);
    }
  }
}

async function insertFreeTemplateContent(templateId, category, templateName) {
  const contentStructures = getFreeContentByCategory(category, templateName);
  
  for (let i = 0; i < contentStructures.length; i++) {
    const section = contentStructures[i];
    
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

function getFreeContentByCategory(category, templateName) {
  // Estrutura base funcional
  const baseStructure = [
    {
      type: 'hero_simple',
      content: {
        title: templateName,
        subtitle: 'Proposta profissional para seus projetos',
        ctaText: 'Aceitar Proposta'
      },
      styles: {
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        alignment: 'center'
      }
    },
    {
      type: 'about_company',
      content: {
        title: 'Sobre Nós',
        description: 'Somos especialistas em entregar resultados de qualidade com foco na satisfação do cliente.',
        highlights: [
          'Experiência comprovada no mercado',
          'Atendimento personalizado',
          'Resultados garantidos'
        ]
      },
      styles: {
        layout: 'text-left',
        backgroundColor: '#ffffff'
      }
    },
    {
      type: 'services_list',
      content: {
        title: 'Nossos Serviços',
        services: []
      },
      styles: {
        listStyle: 'bullet',
        spacing: '1rem'
      }
    },
    {
      type: 'process',
      content: {
        title: 'Como Trabalhamos',
        steps: [
          {
            number: 1,
            title: 'Análise',
            description: 'Entendemos suas necessidades'
          },
          {
            number: 2,
            title: 'Planejamento',
            description: 'Criamos a estratégia ideal'
          },
          {
            number: 3,
            title: 'Execução',
            description: 'Colocamos tudo em prática'
          },
          {
            number: 4,
            title: 'Entrega',
            description: 'Resultados de qualidade'
          }
        ]
      },
      styles: {
        layout: 'steps',
        accentColor: '#2563eb'
      }
    },
    {
      type: 'pricing_simple',
      content: {
        title: 'Investimento',
        description: 'Valor total do projeto',
        price: 'R$ {{TOTAL_VALUE}}',
        paymentOptions: [
          '50% na assinatura do contrato',
          '50% na entrega final'
        ]
      },
      styles: {
        highlightColor: '#16a34a',
        layout: 'centered'
      }
    },
    {
      type: 'contact_cta',
      content: {
        title: 'Pronto para Começar?',
        description: 'Entre em contato para aceitar esta proposta',
        primaryButton: 'Aceitar Proposta',
        contact: {
          email: '{{COMPANY_EMAIL}}',
          phone: '{{COMPANY_PHONE}}'
        }
      },
      styles: {
        backgroundColor: '#2563eb',
        textColor: '#ffffff'
      }
    }
  ];

  // Customizar serviços por categoria
  const servicesByCategory = {
    business: [
      'Diagnóstico empresarial completo',
      'Análise de processos internos',
      'Plano de melhorias detalhado',
      'Acompanhamento da implementação'
    ],
    technology: [
      'Desenvolvimento de website responsivo',
      'Sistema de gerenciamento de conteúdo',
      'Otimização para motores de busca (SEO)',
      'Suporte técnico por 3 meses'
    ],
    marketing: [
      'Estratégia de marketing digital',
      'Criação de campanhas publicitárias',
      'Gestão de redes sociais',
      'Relatórios mensais de performance'
    ],
    design: [
      'Criação de identidade visual',
      'Design de materiais gráficos',
      'Manual de aplicação da marca',
      'Arquivos em alta resolução'
    ]
  };

  const services = servicesByCategory[category] || servicesByCategory.business;
  baseStructure[2].content.services = services.map(service => ({
    name: service,
    included: true
  }));

  return baseStructure;
}

// Executar criação se chamado diretamente
if (require.main === module) {
  createFreeTemplates()
    .then(() => {
      console.log('🎉 Templates gratuitos criados com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro na criação:', error);
      process.exit(1);
    });
}

module.exports = { createFreeTemplates };