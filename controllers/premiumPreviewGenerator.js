class PremiumPreviewGenerator {
  static generatePreviewHtml(template) {
    const templateName = template.name.toLowerCase();
    
    if (templateName.includes('apple')) {
      return this.generateApplePreview(template);
    } else if (templateName.includes('tesla')) {
      return this.generateTeslaPreview(template);
    } else if (templateName.includes('goldman')) {
      return this.generateGoldmanPreview(template);
    } else if (templateName.includes('porsche')) {
      return this.generatePorschePreview(template);
    } else if (templateName.includes('netflix')) {
      return this.generateNetflixPreview(template);
    } else {
      return this.generateDefaultPreview(template);
    }
  }
  
  static generateApplePreview(template) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${template.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; background: #fafafa; }
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 0; }
    .preview-header { background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%); padding: 4rem 3rem; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .template-title { font-size: 3rem; color: #1d1d1f; margin-bottom: 1rem; font-weight: 600; letter-spacing: -0.02em; }
    .template-description { font-size: 1.3rem; color: #6e6e73; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
    .template-info { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; }
    .info-badge { background: #f5f5f7; color: #1d1d1f; padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 0.9rem; font-weight: 500; }
    .premium-badge { background: #007aff; color: white; }
    .preview-content { background: white; }
    .section { padding: 4rem 3rem; border-bottom: 1px solid #f5f5f7; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 2rem; color: #1d1d1f; margin-bottom: 1.5rem; font-weight: 600; }
    .placeholder-text { color: #6e6e73; line-height: 1.8; font-size: 1.1rem; }
    .cta-button { background: #007aff; color: white; padding: 1rem 2.5rem; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; margin-top: 2rem; transition: all 0.3s; }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1 class="template-title">${template.name}</h1>
      <p class="template-description">${template.description}</p>
      <div class="template-info">
        <span class="info-badge">Categoria: ${template.category}</span>
        <span class="info-badge">Indústria: ${template.industry}</span>
        <span class="info-badge premium-badge">Premium - R$ ${template.price}</span>
      </div>
    </div>
    
    <div class="preview-content">
      <div class="section">
        <h2 class="section-title">Inovação que Transforma</h2>
        <p class="placeholder-text">Estratégias elegantes e minimalistas que capturam a essência da sua marca com a sofisticação Apple. Design clean, funcionalidade intuitiva e resultados excepcionais.</p>
        <button class="cta-button">Aceitar Proposta</button>
      </div>
      
      <div class="section">
        <h2 class="section-title">Sobre Nossa Consultoria</h2>
        <p class="placeholder-text">Especializados em transformação digital com foco na experiência do usuário. Nossa abordagem minimalista e centrada no cliente garante soluções que realmente fazem a diferença.</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">Serviços Estratégicos</h2>
        <p class="placeholder-text">• Análise e diagnóstico estratégico<br>• Design de experiência do cliente<br>• Implementação de soluções inovadoras<br>• Otimização de processos digitais</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">Investimento Inteligente</h2>
        <p class="placeholder-text">Valores transparentes com foco no ROI. Pagamento flexível e garantia de resultados mensuráveis para o seu negócio.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
  
  static generateTeslaPreview(template) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${template.name}</title>
  <style>
    body { font-family: 'Gotham', Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%); color: white; }
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 0; }
    .preview-header { background: linear-gradient(45deg, #dc2626 0%, #991b1b 100%); padding: 4rem 3rem; text-align: center; position: relative; overflow: hidden; }
    .template-title { font-size: 3.5rem; color: white; margin-bottom: 1rem; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
    .template-description { font-size: 1.4rem; color: rgba(255,255,255,0.9); margin-bottom: 2rem; }
    .template-info { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .info-badge { background: rgba(255,255,255,0.2); color: white; padding: 0.8rem 1.5rem; border-radius: 25px; font-size: 0.9rem; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); }
    .premium-badge { background: linear-gradient(45deg, #fbbf24 0%, #f59e0b 100%); color: #1f2937; font-weight: 600; }
    .preview-content { background: #111; }
    .section { padding: 3rem; border-bottom: 1px solid #333; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); }
    .section:nth-child(even) { background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); }
    .section-title { font-size: 2.2rem; color: #dc2626; margin-bottom: 1.5rem; font-weight: 700; }
    .placeholder-text { color: #d1d5db; line-height: 1.8; font-size: 1.1rem; }
    .cta-button { background: linear-gradient(45deg, #dc2626 0%, #991b1b 100%); color: white; padding: 1.2rem 3rem; border: none; border-radius: 30px; font-size: 1.2rem; cursor: pointer; margin-top: 2rem; font-weight: 600; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4); }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1 class="template-title">${template.name}</h1>
      <p class="template-description">${template.description}</p>
      <div class="template-info">
        <span class="info-badge">Categoria: ${template.category}</span>
        <span class="info-badge">Indústria: ${template.industry}</span>
        <span class="info-badge premium-badge">Premium - R$ ${template.price}</span>
      </div>
    </div>
    
    <div class="preview-content">
      <div class="section">
        <h2 class="section-title">⚡ Transformação Digital Acelerada</h2>
        <p class="placeholder-text">Tecnologia de ponta que revoluciona seu negócio. Soluções inovadoras com design futurista e performance excepcional para empresas visionárias.</p>
        <button class="cta-button">Acelerar Transformação</button>
      </div>
      
      <div class="section">
        <h2 class="section-title">🚀 Nossa Visão</h2>
        <p class="placeholder-text">Pioneiros em inovação digital, combinamos inteligência artificial, automação avançada e design disruptivo para criar soluções que definem o futuro.</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">🔋 Tecnologias Avançadas</h2>
        <p class="placeholder-text">• Automação inteligente com IA<br>• Interface futurista e intuitiva<br>• Análise preditiva em tempo real<br>• Integração perfeita de sistemas</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">💎 Investimento Premium</h2>
        <p class="placeholder-text">Pacotes exclusivos com tecnologia de vanguarda. ROI garantido através de inovação que coloca sua empresa anos à frente da concorrência.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
  
  static generateGoldmanPreview(template) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${template.name}</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 0; background: #f8f6f0; color: #2c3e50; }
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 0; }
    .preview-header { background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%); padding: 4rem 3rem; text-align: center; color: white; }
    .template-title { font-size: 3rem; color: #f1c40f; margin-bottom: 1rem; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
    .template-description { font-size: 1.3rem; color: rgba(255,255,255,0.95); margin-bottom: 2rem; }
    .template-info { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .info-badge { background: rgba(255,255,255,0.15); color: white; padding: 0.8rem 1.5rem; border-radius: 6px; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.3); }
    .premium-badge { background: #f1c40f; color: #1e3a8a; font-weight: 600; }
    .preview-content { background: #ffffff; }
    .section { padding: 3rem; border-bottom: 2px solid #e5e7eb; }
    .section:nth-child(even) { background: #f8f9fa; }
    .section-title { font-size: 2.2rem; color: #1e3a8a; margin-bottom: 1.5rem; font-weight: 700; }
    .placeholder-text { color: #4b5563; line-height: 1.8; font-size: 1.1rem; }
    .cta-button { background: #1e3a8a; color: #f1c40f; padding: 1.2rem 2.5rem; border: 2px solid #f1c40f; border-radius: 6px; font-size: 1.1rem; cursor: pointer; margin-top: 2rem; font-weight: 600; }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1 class="template-title">${template.name}</h1>
      <p class="template-description">${template.description}</p>
      <div class="template-info">
        <span class="info-badge">Categoria: ${template.category}</span>
        <span class="info-badge">Indústria: ${template.industry}</span>
        <span class="info-badge premium-badge">Premium - R$ ${template.price}</span>
      </div>
    </div>
    
    <div class="preview-content">
      <div class="section">
        <h2 class="section-title">⚖️ Excelência Jurídica Corporativa</h2>
        <p class="placeholder-text">Soluções jurídicas de elite para grandes corporações. Nossa expertise combina tradição, inovação e resultados excepcionais no mais alto nível do mercado.</p>
        <button class="cta-button">Solicitar Consultoria</button>
      </div>
      
      <div class="section">
        <h2 class="section-title">🏛️ Tradição e Credibilidade</h2>
        <p class="placeholder-text">Décadas de experiência atendendo as maiores corporações do mercado. Nossa reputação é construída sobre resultados consistentes e relacionamentos duradouros.</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">📊 Serviços Corporativos Premium</h2>
        <p class="placeholder-text">• Consultoria estratégica empresarial<br>• Compliance e governança corporativa<br>• Fusões e aquisições complexas<br>• Litígios corporativos de alto valor</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">💼 Investimento Institucional</h2>
        <p class="placeholder-text">Honorários premium justificados pela qualidade excepcional e resultados superiores. Estrutura de cobrança transparente para grandes operações.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
  
  static generatePorschePreview(template) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${template.name}</title>
  <style>
    body { font-family: 'Porsche Next', Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #2d1b1b 0%, #1a0f0f 100%); color: #f5f5f5; }
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 0; }
    .preview-header { background: linear-gradient(45deg, #8b0000 0%, #dc143c 100%); padding: 4rem 3rem; text-align: center; position: relative; }
    .template-title { font-size: 3.2rem; color: #ffd700; margin-bottom: 1rem; font-weight: 700; letter-spacing: 0.05em; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); }
    .template-description { font-size: 1.3rem; color: rgba(255,255,255,0.9); margin-bottom: 2rem; font-style: italic; }
    .template-info { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .info-badge { background: rgba(255,215,0,0.2); color: #ffd700; padding: 0.8rem 1.5rem; border-radius: 4px; font-size: 0.9rem; border: 1px solid #ffd700; }
    .premium-badge { background: #ffd700; color: #8b0000; font-weight: 600; }
    .preview-content { background: #1a1a1a; }
    .section { padding: 3rem; border-bottom: 1px solid #444; background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%); }
    .section:nth-child(odd) { background: linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%); }
    .section-title { font-size: 2.1rem; color: #ffd700; margin-bottom: 1.5rem; font-weight: 700; }
    .placeholder-text { color: #e0e0e0; line-height: 1.8; font-size: 1.1rem; }
    .cta-button { background: linear-gradient(45deg, #ffd700 0%, #ffed4e 100%); color: #8b0000; padding: 1.2rem 2.8rem; border: none; border-radius: 4px; font-size: 1.1rem; cursor: pointer; margin-top: 2rem; font-weight: 700; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1 class="template-title">${template.name}</h1>
      <p class="template-description">${template.description}</p>
      <div class="template-info">
        <span class="info-badge">Categoria: ${template.category}</span>
        <span class="info-badge">Indústria: ${template.industry}</span>
        <span class="info-badge premium-badge">Premium - R$ ${template.price}</span>
      </div>
    </div>
    
    <div class="preview-content">
      <div class="section">
        <h2 class="section-title">🏎️ Design & Arquitetura de Luxo</h2>
        <p class="placeholder-text">Projetos exclusivos com a sofisticação e performance de uma Porsche. Cada detalhe é meticulosamente planejado para criar experiências extraordinárias e atemporais.</p>
        <button class="cta-button">Iniciar Projeto</button>
      </div>
      
      <div class="section">
        <h2 class="section-title">🏆 Excelência em Cada Detalhe</h2>
        <p class="placeholder-text">Nossa filosofia é baseada na perfeição alemã: precisão, qualidade superior e atenção obsessiva aos detalhes. Criamos espaços que são verdadeiras obras de arte funcionais.</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">✨ Serviços Premium</h2>
        <p class="placeholder-text">• Design arquitetônico exclusivo<br>• Interiores de alto padrão<br>• Consultoria em materiais nobres<br>• Acompanhamento personalizado</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">💎 Investimento de Elite</h2>
        <p class="placeholder-text">Valores condizentes com a exclusividade e qualidade superior. Financiamento flexível para projetos de grande porte com garantia de resultado excepcional.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
  
  static generateNetflixPreview(template) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${template.name}</title>
  <style>
    body { font-family: 'Netflix Sans', Arial, sans-serif; margin: 0; background: #141414; color: #ffffff; }
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 0; }
    .preview-header { background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 4rem 3rem; text-align: center; position: relative; }
    .template-title { font-size: 3.5rem; color: white; margin-bottom: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
    .template-description { font-size: 1.4rem; color: rgba(255,255,255,0.9); margin-bottom: 2rem; }
    .template-info { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .info-badge { background: rgba(255,255,255,0.2); color: white; padding: 0.8rem 1.5rem; border-radius: 20px; font-size: 0.9rem; backdrop-filter: blur(10px); }
    .premium-badge { background: #f5c518; color: #000; font-weight: 600; }
    .preview-content { background: #141414; }
    .section { padding: 3rem; border-bottom: 1px solid #333; }
    .section:nth-child(even) { background: #1a1a1a; }
    .section-title { font-size: 2.3rem; color: #e50914; margin-bottom: 1.5rem; font-weight: 700; }
    .placeholder-text { color: #d1d1d1; line-height: 1.8; font-size: 1.1rem; }
    .cta-button { background: #e50914; color: white; padding: 1.2rem 3rem; border: none; border-radius: 4px; font-size: 1.2rem; cursor: pointer; margin-top: 2rem; font-weight: 700; transition: all 0.3s; }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1 class="template-title">${template.name}</h1>
      <p class="template-description">${template.description}</p>
      <div class="template-info">
        <span class="info-badge">Categoria: ${template.category}</span>
        <span class="info-badge">Indústria: ${template.industry}</span>
        <span class="info-badge premium-badge">Premium - R$ ${template.price}</span>
      </div>
    </div>
    
    <div class="preview-content">
      <div class="section">
        <h2 class="section-title">🎬 Marketing Cinematográfico</h2>
        <p class="placeholder-text">Conte histórias envolventes que capturam a atenção do seu público como um blockbuster. Estratégias de marketing com narrativas poderosas e produção de alta qualidade.</p>
        <button class="cta-button">Play Agora</button>
      </div>
      
      <div class="section">
        <h2 class="section-title">🍿 Nossa Produtora</h2>
        <p class="placeholder-text">Especialistas em criar conteúdo viral e campanhas memoráveis. Nossa equipe combina criatividade cinematográfica com estratégia digital para resultados extraordinários.</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">🎭 Produções Originais</h2>
        <p class="placeholder-text">• Vídeos comerciais cinematográficos<br>• Campanhas de storytelling imersivo<br>• Conteúdo para redes sociais premium<br>• Estratégia de lançamento viral</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">🏆 Pacotes Exclusivos</h2>
        <p class="placeholder-text">Investimento em produção de alta qualidade com garantia de engajamento. Planos personalizados para marcas que querem se destacar no mercado.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
  
  static generateDefaultPreview(template) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${template.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f8fafc; }
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .preview-header { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .template-title { font-size: 2.5rem; color: #2563eb; margin-bottom: 0.5rem; }
    .template-description { font-size: 1.2rem; color: #64748b; margin-bottom: 1rem; }
    .template-info { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .info-badge { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; }
    .free-badge { background: #10b981; color: white; }
    .preview-content { background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .section { margin-bottom: 3rem; padding: 2rem; border-left: 4px solid #2563eb; background: #f8fafc; }
    .section-title { font-size: 1.5rem; color: #1e293b; margin-bottom: 1rem; }
    .placeholder-text { color: #64748b; line-height: 1.6; }
    .cta-button { background: #2563eb; color: white; padding: 1rem 2rem; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1 class="template-title">${template.name}</h1>
      <p class="template-description">${template.description}</p>
      <div class="template-info">
        <span class="info-badge">Categoria: ${template.category}</span>
        <span class="info-badge">Indústria: ${template.industry}</span>
        <span class="info-badge free-badge">Gratuito</span>
      </div>
    </div>
    
    <div class="preview-content">
      <div class="section">
        <h2 class="section-title">🎯 Seção Hero</h2>
        <p class="placeholder-text">Título impactante que chama atenção do cliente e destaca o valor da sua proposta.</p>
        <button class="cta-button">Aceitar Proposta</button>
      </div>
      
      <div class="section">
        <h2 class="section-title">🏢 Sobre a Empresa</h2>
        <p class="placeholder-text">Apresentação da sua empresa, credibilidade e diferenciação no mercado.</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">📋 Serviços Inclusos</h2>
        <p class="placeholder-text">Lista detalhada dos serviços que serão entregues com descrições claras.</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">💰 Investimento</h2>
        <p class="placeholder-text">Valor do projeto com opções de pagamento e condições comerciais.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

module.exports = PremiumPreviewGenerator;