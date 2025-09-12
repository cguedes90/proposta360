const db = require('../config/database');

async function createPremiumTemplates() {
  try {
    console.log('🎨 Criando templates premium de design excepcional...');

    const premiumTemplates = [
      {
        name: 'Tesla - Transformação Digital Premium',
        description: 'Template inspirado na Tesla com design futurista, gradientes sofisticados e microanimações. Perfeito para projetos de tecnologia e inovação.',
        category: 'technology',
        industry: 'Tecnologia & Inovação',
        tags: ['premium', 'futurista', 'tecnologia', 'tesla-style', 'gradientes'],
        is_premium: true,
        price: 49.90,
        thumbnail_url: '/images/templates/tesla-tech-thumb.jpg'
      },
      {
        name: 'Apple - Consultoria Estratégica Elegante',
        description: 'Minimalismo Apple com espaços em branco perfeitos, tipografia limpa e elementos visuais sofisticados. Para consultorias de alto padrão.',
        category: 'business',
        industry: 'Consultoria Estratégica',
        tags: ['premium', 'minimalista', 'apple-style', 'elegante', 'clean'],
        is_premium: true,
        price: 59.90,
        thumbnail_url: '/images/templates/apple-business-thumb.jpg'
      },
      {
        name: 'Netflix - Marketing Digital Cinematográfico',
        description: 'Template com estética cinematográfica, cards dinâmicos e layout imersivo. Ideal para agências de marketing e produção de conteúdo.',
        category: 'marketing',
        industry: 'Marketing & Publicidade',
        tags: ['premium', 'cinematográfico', 'netflix-style', 'dinâmico', 'imersivo'],
        is_premium: true,
        price: 54.90,
        thumbnail_url: '/images/templates/netflix-marketing-thumb.jpg'
      },
      {
        name: 'Porsche - Design & Arquitetura Luxo',
        description: 'Luxo e sofisticação com paleta premium, materiais elegantes e layout refinado. Para projetos de design e arquitetura de alto padrão.',
        category: 'design',
        industry: 'Design & Arquitetura',
        tags: ['premium', 'luxo', 'porsche-style', 'sofisticado', 'refinado'],
        is_premium: true,
        price: 64.90,
        thumbnail_url: '/images/templates/porsche-design-thumb.jpg'
      },
      {
        name: 'Goldman Sachs - Jurídico Corporativo Elite',
        description: 'Seriedade e confiança com design corporativo premium, cores institucionais e layout executivo. Para grandes escritórios jurídicos.',
        category: 'legal',
        industry: 'Jurídico Corporativo',
        tags: ['premium', 'corporativo', 'goldman-style', 'executivo', 'institucional'],
        is_premium: true,
        price: 69.90,
        thumbnail_url: '/images/templates/goldman-legal-thumb.jpg'
      }
    ];

    for (const template of premiumTemplates) {
      const result = await db.query(`
        INSERT INTO templates (name, description, category, industry, tags, thumbnail_url, is_premium, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        template.name,
        template.description, 
        template.category,
        template.industry,
        template.tags,
        template.thumbnail_url,
        template.is_premium,
        template.price
      ]);

      const templateId = result.rows[0].id;
      console.log(`✨ Template premium "${template.name}" criado com ID: ${templateId}`);

      // Inserir conteúdo premium para cada template
      await insertPremiumContent(templateId, template.category, template.name);
    }

    console.log('🎉 Templates premium criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar templates premium:', error);
  }
}

async function insertPremiumContent(templateId, category, templateName) {
  const contentSections = getPremiumContentByCategory(category, templateName);
  
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

function getPremiumContentByCategory(category, templateName) {
  const baseStyles = getStylesByTemplate(templateName);
  
  const sections = [
    {
      type: 'hero_premium',
      content: {
        title: getHeroTitle(templateName),
        subtitle: getHeroSubtitle(templateName),
        ctaText: 'Descobrir Solução',
        backgroundVideo: getBackgroundVideo(templateName),
        particleEffect: true,
        animationType: 'fadeInScale'
      },
      styles: {
        ...baseStyles.hero,
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }
    },
    {
      type: 'company_showcase',
      content: {
        companyName: '{{COMPANY_NAME}}',
        tagline: getCompanyTagline(templateName),
        description: getCompanyDescription(templateName),
        metrics: getMetrics(category),
        logo: '/images/company-logo-premium.png',
        certifications: getCertifications(category)
      },
      styles: {
        ...baseStyles.company,
        padding: '8rem 0',
        background: baseStyles.company.background
      }
    },
    {
      type: 'services_premium_grid',
      content: {
        title: 'Soluções Exclusivas',
        subtitle: 'Metodologia comprovada, resultados extraordinários',
        services: getPremiumServices(category, templateName)
      },
      styles: {
        ...baseStyles.services,
        padding: '8rem 0'
      }
    },
    {
      type: 'methodology_section',
      content: {
        title: 'Nossa Metodologia',
        subtitle: 'Processo estruturado para resultados excepcionais',
        steps: getMethodologySteps(category)
      },
      styles: {
        ...baseStyles.methodology,
        padding: '8rem 0'
      }
    },
    {
      type: 'testimonials_carousel',
      content: {
        title: 'Casos de Sucesso',
        testimonials: getTestimonials(category)
      },
      styles: {
        ...baseStyles.testimonials,
        padding: '8rem 0'
      }
    },
    {
      type: 'investment_premium',
      content: {
        title: 'Investimento Estratégico',
        subtitle: 'Transparência total, valor excepcional',
        packages: getPremiumPackages(category),
        totalValue: '{{TOTAL_AMOUNT}}',
        paymentOptions: getPaymentOptions(),
        guarantee: '90 dias de garantia total'
      },
      styles: {
        ...baseStyles.investment,
        padding: '8rem 0'
      }
    },
    {
      type: 'timeline_section',
      content: {
        title: 'Cronograma de Entrega',
        subtitle: 'Marcos bem definidos, entregas pontuais',
        timeline: getTimeline(category)
      },
      styles: {
        ...baseStyles.timeline,
        padding: '8rem 0'
      }
    },
    {
      type: 'cta_premium_final',
      content: {
        title: getCTATitle(templateName),
        subtitle: getCTASubtitle(templateName),
        primaryButton: 'Iniciar Projeto',
        secondaryButton: 'Agendar Reunião',
        urgencyText: 'Apenas 3 vagas disponíveis este mês',
        bonuses: getBonuses(category)
      },
      styles: {
        ...baseStyles.cta,
        padding: '8rem 0',
        minHeight: '60vh'
      }
    }
  ];

  return sections;
}

function getStylesByTemplate(templateName) {
  if (templateName.includes('Tesla')) {
    return {
      hero: {
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #000000 100%)',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        position: 'relative',
        '::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }
      },
      company: {
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
        borderRadius: '0'
      },
      services: {
        background: '#ffffff',
        borderRadius: '0'
      },
      methodology: {
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        borderRadius: '0'
      },
      testimonials: {
        background: '#ffffff',
        borderRadius: '0'
      },
      investment: {
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: '#ffffff'
      },
      timeline: {
        background: '#f8fafc',
        borderRadius: '0'
      },
      cta: {
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
        color: '#ffffff'
      }
    };
  }
  
  if (templateName.includes('Apple')) {
    return {
      hero: {
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        color: '#1d1d1f',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      },
      company: {
        background: '#ffffff',
        borderRadius: '0'
      },
      services: {
        background: 'linear-gradient(180deg, #fbfbfb 0%, #ffffff 100%)',
        borderRadius: '0'
      },
      methodology: {
        background: '#f5f5f7',
        borderRadius: '0'
      },
      testimonials: {
        background: '#ffffff',
        borderRadius: '0'
      },
      investment: {
        background: 'linear-gradient(135deg, #1d1d1f 0%, #2d2d30 100%)',
        color: '#f5f5f7'
      },
      timeline: {
        background: '#fbfbfd',
        borderRadius: '0'
      },
      cta: {
        background: 'linear-gradient(135deg, #007aff 0%, #005ecb 100%)',
        color: '#ffffff'
      }
    };
  }
  
  if (templateName.includes('Netflix')) {
    return {
      hero: {
        background: 'linear-gradient(135deg, #141414 0%, #000000 100%)',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", Arial, sans-serif'
      },
      company: {
        background: 'linear-gradient(135deg, #221f1f 0%, #141414 100%)',
        color: '#ffffff'
      },
      services: {
        background: 'linear-gradient(135deg, #2a0d0d 0%, #141414 100%)',
        color: '#ffffff'
      },
      methodology: {
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        color: '#ffffff'
      },
      testimonials: {
        background: '#141414',
        color: '#ffffff'
      },
      investment: {
        background: 'linear-gradient(135deg, #831010 0%, #b91c1c 100%)',
        color: '#ffffff'
      },
      timeline: {
        background: 'linear-gradient(135deg, #292929 0%, #141414 100%)',
        color: '#ffffff'
      },
      cta: {
        background: 'linear-gradient(135deg, #dc143c 0%, #b91c1c 100%)',
        color: '#ffffff'
      }
    };
  }
  
  if (templateName.includes('Porsche')) {
    return {
      hero: {
        background: 'linear-gradient(135deg, #2c1810 0%, #1a0f08 100%)',
        color: '#d4af37'
      },
      company: {
        background: 'linear-gradient(180deg, #faf7f0 0%, #f5f2e8 100%)',
        color: '#2c1810'
      },
      services: {
        background: '#ffffff',
        color: '#2c1810'
      },
      methodology: {
        background: 'linear-gradient(135deg, #f8f5f0 0%, #f0ede5 100%)',
        color: '#2c1810'
      },
      testimonials: {
        background: '#2c1810',
        color: '#d4af37'
      },
      investment: {
        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
        color: '#2c1810'
      },
      timeline: {
        background: '#faf8f3',
        color: '#2c1810'
      },
      cta: {
        background: 'linear-gradient(135deg, #8b0000 0%, #660000 100%)',
        color: '#d4af37'
      }
    };
  }
  
  // Goldman Sachs style (default)
  return {
    hero: {
      background: 'linear-gradient(135deg, #003366 0%, #001a33 100%)',
      color: '#ffffff'
    },
    company: {
      background: '#f8fafb',
      color: '#003366'
    },
    services: {
      background: '#ffffff',
      color: '#003366'
    },
    methodology: {
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
      color: '#003366'
    },
    testimonials: {
      background: '#003366',
      color: '#ffffff'
    },
    investment: {
      background: 'linear-gradient(135deg, #1a365d 0%, #003366 100%)',
      color: '#ffffff'
    },
    timeline: {
      background: '#f7fafc',
      color: '#003366'
    },
    cta: {
      background: 'linear-gradient(135deg, #c6a86a 0%, #a0875c 100%)',
      color: '#003366'
    }
  };
}

function getHeroTitle(templateName) {
  const titles = {
    'Tesla': 'O Futuro da Tecnologia Começa Aqui',
    'Apple': 'Simplicidade. Elegância. Resultados.',
    'Netflix': 'Sua História Merece o Melhor',
    'Porsche': 'Excelência Sem Compromissos',
    'Goldman': 'Soluções Jurídicas de Elite'
  };
  
  for (const [key, title] of Object.entries(titles)) {
    if (templateName.includes(key)) return title;
  }
  return 'Transforme Sua Visão em Realidade';
}

function getHeroSubtitle(templateName) {
  const subtitles = {
    'Tesla': 'Soluções tecnológicas que redefinem possibilidades e criam o amanhã hoje',
    'Apple': 'Design intuitivo, funcionalidade perfeita, resultados extraordinários',
    'Netflix': 'Conteúdo premium, estratégias cinematográficas, audiência cativada',
    'Porsche': 'Projetos sob medida com a precisão alemã e elegância atemporal',
    'Goldman': 'Expertise jurídica institucional para decisões estratégicas'
  };
  
  for (const [key, subtitle] of Object.entries(subtitles)) {
    if (templateName.includes(key)) return subtitle;
  }
  return 'Solução completa e profissional para suas necessidades';
}

function getPremiumServices(category, templateName) {
  const servicesByTemplate = {
    'Tesla': [
      {
        icon: 'fas fa-rocket',
        title: 'Inovação Disruptiva',
        description: 'Tecnologias emergentes integradas com IA avançada para revolucionar seu mercado',
        features: ['Machine Learning', 'IoT Integration', 'Blockchain', 'AR/VR'],
        price: 'R$ 25.000',
        highlight: 'Exclusivo'
      },
      {
        icon: 'fas fa-brain',
        title: 'Inteligência Artificial',
        description: 'Sistemas inteligentes que aprendem e evoluem com seu negócio automaticamente',
        features: ['Deep Learning', 'NLP', 'Computer Vision', 'Predictive Analytics'],
        price: 'R$ 35.000',
        highlight: 'Premium'
      },
      {
        icon: 'fas fa-shield-alt',
        title: 'Segurança Quântica',
        description: 'Proteção de dados com criptografia quântica e protocolos militares',
        features: ['Quantum Encryption', 'Zero Trust', 'Biometric Auth', '24/7 Monitoring'],
        price: 'R$ 15.000',
        highlight: 'Enterprise'
      }
    ],
    'Apple': [
      {
        icon: 'fas fa-magic',
        title: 'Estratégia Minimalista',
        description: 'Simplicidade elegante que comunica valor e gera resultados mensuráveis',
        features: ['Design Thinking', 'User Experience', 'Brand Strategy', 'Market Position'],
        price: 'R$ 18.000',
        highlight: 'Signature'
      },
      {
        icon: 'fas fa-users',
        title: 'Experiência Premium',
        description: 'Jornada do cliente otimizada para conversão e fidelização duradoura',
        features: ['Customer Journey', 'Touchpoint Design', 'Loyalty Programs', 'Retention Strategy'],
        price: 'R$ 22.000',
        highlight: 'Elite'
      },
      {
        icon: 'fas fa-chart-line',
        title: 'Crescimento Sustentável',
        description: 'Escalabilidade inteligente com processos eficientes e automatizados',
        features: ['Process Optimization', 'Automation', 'KPI Dashboard', 'Growth Hacking'],
        price: 'R$ 16.000',
        highlight: 'Pro'
      }
    ],
    'Netflix': [
      {
        icon: 'fas fa-video',
        title: 'Storytelling Cinematográfico',
        description: 'Narrativas visuais que capturam atenção e convertem audiências globalmente',
        features: ['Video Production', 'Brand Storytelling', 'Content Strategy', 'Social Media'],
        price: 'R$ 28.000',
        highlight: 'Original'
      },
      {
        icon: 'fas fa-globe',
        title: 'Distribuição Global',
        description: 'Alcance mundial com estratégias localizadas para cada mercado específico',
        features: ['Global Reach', 'Localization', 'Multi-platform', 'Analytics'],
        price: 'R$ 32.000',
        highlight: 'Worldwide'
      },
      {
        icon: 'fas fa-star',
        title: 'Produção Premium',
        description: 'Conteúdo de alta qualidade com equipamentos profissionais e equipe especializada',
        features: ['4K Production', 'Professional Team', 'Post-production', 'Distribution'],
        price: 'R$ 45.000',
        highlight: 'Blockbuster'
      }
    ]
  };

  return servicesByTemplate[templateName.split(' - ')[0]] || servicesByTemplate['Tesla'];
}

function getMethodologySteps(category) {
  return [
    {
      step: '01',
      title: 'Diagnóstico Estratégico',
      description: 'Análise profunda do cenário atual e identificação de oportunidades',
      duration: '1-2 semanas',
      deliverables: ['Relatório de diagnóstico', 'Matriz SWOT', 'Mapeamento de processos']
    },
    {
      step: '02', 
      title: 'Planejamento Executivo',
      description: 'Estratégia detalhada com cronograma, recursos e métricas definidas',
      duration: '2-3 semanas',
      deliverables: ['Plano estratégico', 'Cronograma detalhado', 'Budget breakdown']
    },
    {
      step: '03',
      title: 'Implementação Ágil',
      description: 'Execução em sprints com entregas incrementais e feedback contínuo',
      duration: '8-12 semanas',
      deliverables: ['Entregas semanais', 'Relatórios de progresso', 'Ajustes iterativos']
    },
    {
      step: '04',
      title: 'Otimização Contínua',
      description: 'Monitoramento ativo e ajustes baseados em dados e performance',
      duration: 'Ongoing',
      deliverables: ['Dashboard de métricas', 'Relatórios mensais', 'Recomendações']
    }
  ];
}

function getTestimonials(category) {
  return [
    {
      name: 'Carlos Eduardo Silva',
      position: 'CEO, TechCorp Innovation',
      company: 'TechCorp',
      photo: '/images/testimonials/carlos.jpg',
      rating: 5,
      text: 'Resultados excepcionais! Nossa receita cresceu 340% em 6 meses. A metodologia é realmente diferenciada.',
      metrics: { revenue: '+340%', time: '6 meses' }
    },
    {
      name: 'Ana Paula Mendes',
      position: 'Diretora de Marketing, InnovaGroup',
      company: 'InnovaGroup',
      photo: '/images/testimonials/ana.jpg',
      rating: 5,
      text: 'Profissionalismo impecável. Entregaram muito além do esperado com qualidade premium.',
      metrics: { satisfaction: '98%', delivery: '2 semanas antes' }
    },
    {
      name: 'Roberto Fernandes',
      position: 'Founder, StartupSuccess',
      company: 'StartupSuccess',
      photo: '/images/testimonials/roberto.jpg',
      rating: 5,
      text: 'A melhor decisão que tomamos. ROI de 580% no primeiro ano. Recomendo sem hesitar.',
      metrics: { roi: '580%', period: '12 meses' }
    }
  ];
}

function getPremiumPackages(category) {
  return [
    {
      name: 'Essencial',
      description: 'Solução completa para começar com excelência',
      price: 'R$ 15.000',
      originalPrice: 'R$ 18.000',
      features: [
        'Estratégia personalizada',
        'Implementação completa',
        'Suporte por 3 meses',
        'Relatórios mensais',
        'Garantia de resultados'
      ],
      highlight: false
    },
    {
      name: 'Premium',
      description: 'Tudo do Essencial + recursos avançados',
      price: 'R$ 28.000',
      originalPrice: 'R$ 35.000',
      features: [
        'Tudo do Essencial',
        'Consultoria estratégica VIP',
        'Automações avançadas',
        'Suporte por 6 meses',
        'Otimizações contínuas',
        'Acesso prioritário ao time'
      ],
      highlight: true,
      badge: 'Mais Escolhido'
    },
    {
      name: 'Enterprise',
      description: 'Solução completa para grandes resultados',
      price: 'R$ 45.000',
      originalPrice: 'R$ 55.000',
      features: [
        'Tudo do Premium',
        'Implementação white-glove',
        'Gerente dedicado',
        'Suporte 24/7 por 12 meses',
        'Customizações exclusivas',
        'SLA garantido',
        'Integração completa'
      ],
      highlight: false,
      badge: 'Máximo ROI'
    }
  ];
}

// Helper functions continuam...
function getBackgroundVideo(templateName) {
  const videos = {
    'Tesla': '/videos/tech-innovation-bg.mp4',
    'Apple': '/videos/minimal-elegance-bg.mp4', 
    'Netflix': '/videos/cinematic-bg.mp4',
    'Porsche': '/videos/luxury-design-bg.mp4',
    'Goldman': '/videos/corporate-bg.mp4'
  };
  
  for (const [key, video] of Object.entries(videos)) {
    if (templateName.includes(key)) return video;
  }
  return '/videos/default-bg.mp4';
}

function getCompanyTagline(templateName) {
  const taglines = {
    'Tesla': 'Acelerando o Futuro',
    'Apple': 'Think Different', 
    'Netflix': 'Stories That Matter',
    'Porsche': 'Driven by Dreams',
    'Goldman': 'Excellence in Service'
  };
  
  for (const [key, tagline] of Object.entries(taglines)) {
    if (templateName.includes(key)) return tagline;
  }
  return 'Excelência em Resultados';
}

function getCompanyDescription(templateName) {
  const descriptions = {
    'Tesla': 'Pioneiros em inovação tecnológica, criamos soluções que transformam indústrias e definem o futuro dos negócios digitais.',
    'Apple': 'Simplicidade elegante encontra funcionalidade perfeita. Criamos experiências que as pessoas amam e empresas prosperam.',
    'Netflix': 'Especialistas em conteúdo que conecta. Transformamos ideias em narrativas poderosas que capturam audiências globais.',
    'Porsche': 'Excelência artesanal em cada detalhe. Criamos projetos sob medida com a precisão alemã e design atemporal.',
    'Goldman': 'Elite jurídica corporativa. Soluções estratégicas para decisões que moldam o futuro das organizações.'
  };
  
  for (const [key, desc] of Object.entries(descriptions)) {
    if (templateName.includes(key)) return desc;
  }
  return 'Especialistas em entregar resultados excepcionais através de soluções personalizadas e metodologia comprovada.';
}

function getMetrics(category) {
  const metricsByCategory = {
    technology: [
      { value: '500+', label: 'Projetos Entregues' },
      { value: '98%', label: 'Taxa de Sucesso' },
      { value: '24/7', label: 'Suporte Premium' }
    ],
    business: [
      { value: '200+', label: 'Empresas Transformadas' },
      { value: '340%', label: 'ROI Médio' },
      { value: '15', label: 'Anos de Experiência' }
    ],
    marketing: [
      { value: '1M+', label: 'Audiência Alcançada' },
      { value: '85%', label: 'Aumento em Conversões' },
      { value: '50+', label: 'Campanhas de Sucesso' }
    ]
  };
  
  return metricsByCategory[category] || metricsByCategory.technology;
}

function getCertifications(category) {
  const certsByCategory = {
    technology: ['ISO 27001', 'AWS Partner', 'Microsoft Gold', 'Google Cloud'],
    business: ['PMI Certified', 'Six Sigma', 'Lean Certified', 'MBA Programs'],
    marketing: ['Google Ads', 'Facebook Blueprint', 'HubSpot Certified', 'Content Marketing']
  };
  
  return certsByCategory[category] || [];
}

function getTimeline(category) {
  return [
    { phase: 'Kickoff', duration: '1 semana', description: 'Alinhamento estratégico e planejamento detalhado' },
    { phase: 'Desenvolvimento', duration: '6-8 semanas', description: 'Implementação com entregas semanais' },
    { phase: 'Testes', duration: '2 semanas', description: 'Validação e otimizações finais' },
    { phase: 'Go-Live', duration: '1 semana', description: 'Lançamento e acompanhamento inicial' }
  ];
}

function getPaymentOptions() {
  return [
    'À vista com 15% de desconto',
    '3x sem juros no cartão',
    'Parcelamento em até 12x',
    'PIX com 10% de desconto'
  ];
}

function getCTATitle(templateName) {
  const titles = {
    'Tesla': 'Pronto para o Futuro?',
    'Apple': 'Vamos Simplificar Juntos?',
    'Netflix': 'Sua História Começa Agora',
    'Porsche': 'Excelência Sem Limites',
    'Goldman': 'Decisões Estratégicas Aguardam'
  };
  
  for (const [key, title] of Object.entries(titles)) {
    if (templateName.includes(key)) return title;
  }
  return 'Pronto para Transformar?';
}

function getCTASubtitle(templateName) {
  const subtitles = {
    'Tesla': 'Junte-se às empresas que já estão construindo o amanhã',
    'Apple': 'Transforme complexidade em simplicidade elegante',
    'Netflix': 'Crie conteúdo que marca época e transforma audiências',
    'Porsche': 'Projetos sob medida com acabamento impecável',
    'Goldman': 'Soluções jurídicas de classe mundial para sua empresa'
  };
  
  for (const [key, subtitle] of Object.entries(subtitles)) {
    if (templateName.includes(key)) return subtitle;
  }
  return 'Aceite nossa proposta e vamos transformar sua visão em realidade';
}

function getBonuses(category) {
  const bonusByCategory = {
    technology: [
      'Consultoria em IA gratuita por 3 meses',
      'Setup de infraestrutura cloud incluso',
      'Treinamento da equipe sem custo adicional'
    ],
    business: [
      'Análise competitiva detalhada de brinde',
      'Workshop de liderança para executives',
      'Acesso vitalício à comunidade premium'
    ],
    marketing: [
      'Criação de 50 posts para redes sociais',
      'Análise de concorrência completa',
      'Setup de automação de marketing'
    ]
  };
  
  return bonusByCategory[category] || bonusByCategory.technology;
}

// Executar se chamado diretamente
if (require.main === module) {
  createPremiumTemplates()
    .then(() => {
      console.log('🎨 Templates premium criados com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro ao criar templates premium:', error);
      process.exit(1);
    });
}

module.exports = { createPremiumTemplates };