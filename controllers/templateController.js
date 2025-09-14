const Template = require('../models/Template');
const db = require('../config/database');
const PremiumPreviewGenerator = require('./premiumPreviewGenerator');

class TemplateController {
  // Listar todos os templates
  static async index(req, res) {
    try {
      const { 
        category, 
        industry, 
        isPremium, 
        premium,
        tags, 
        limit = 50,
        popular = false 
      } = req.query;

      let templates;

      if (popular === 'true') {
        templates = await Template.findPopular(parseInt(limit));
      } else {
        const filters = {};
        
        if (category) filters.category = category;
        if (industry) filters.industry = industry;
        if (isPremium !== undefined) filters.isPremium = isPremium === 'true';
        if (premium !== undefined) filters.isPremium = premium === 'true';
        if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
        if (limit) filters.limit = parseInt(limit);

        templates = await Template.findAll(filters);
      }

      // Organizar por categorias para facilitar exibição
      const categorizedTemplates = templates.reduce((acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          templates,
          categorized: categorizedTemplates,
          total: templates.length
        }
      });

    } catch (error) {
      console.error('Erro ao listar templates:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar template por ID
  static async show(req, res) {
    try {
      const { id } = req.params;
      
      const template = await Template.findById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template não encontrado'
        });
      }

      // Buscar estatísticas do template
      const stats = await Template.getStats(id);
      
      // Buscar reviews recentes
      const reviews = await Template.getReviews(id, 5);

      res.json({
        success: true,
        data: {
          ...template,
          stats,
          recent_reviews: reviews
        }
      });

    } catch (error) {
      console.error('Erro ao buscar template:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar templates por categoria
  static async byCategory(req, res) {
    try {
      const { category } = req.params;
      const { limit = 20 } = req.query;

      const templates = await Template.findByCategory(category, parseInt(limit));

      res.json({
        success: true,
        data: {
          category,
          templates,
          total: templates.length
        }
      });

    } catch (error) {
      console.error('Erro ao buscar templates por categoria:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Templates recomendados para o usuário
  static async recommended(req, res) {
    try {
      const userId = req.user?.id;
      const { limit = 5 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      const templates = await Template.findRecommended(userId, parseInt(limit));

      res.json({
        success: true,
        data: {
          templates,
          total: templates.length
        }
      });

    } catch (error) {
      console.error('Erro ao buscar templates recomendados:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Clonar template para nova proposta
  static async clone(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user?.id;
      const { 
        proposalId, 
        customizations = {},
        proposalTitle 
      } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      if (!proposalId) {
        return res.status(400).json({
          success: false,
          error: 'ID da proposta é obrigatório'
        });
      }

      const clonedTemplate = await Template.cloneForProposal(
        templateId, 
        proposalId, 
        userId, 
        customizations
      );

      res.json({
        success: true,
        message: 'Template clonado com sucesso',
        data: {
          ...clonedTemplate,
          proposalId,
          proposalTitle
        }
      });

    } catch (error) {
      console.error('Erro ao clonar template:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      });
    }
  }

  // Avaliar template
  static async rate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user?.id;
      const { rating, review } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating deve ser um número entre 1 e 5'
        });
      }

      const templateRating = await Template.rateTemplate(
        templateId, 
        userId, 
        rating, 
        review
      );

      res.json({
        success: true,
        message: 'Avaliação registrada com sucesso',
        data: templateRating
      });

    } catch (error) {
      console.error('Erro ao avaliar template:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Buscar estatísticas detalhadas
  static async stats(req, res) {
    try {
      const { templateId } = req.params;
      
      const stats = await Template.getStats(templateId);
      const reviews = await Template.getReviews(templateId, 20);

      res.json({
        success: true,
        data: {
          stats,
          reviews
        }
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Preview do template (página pública)
  static async preview(req, res) {
    try {
      const { templateId } = req.params;
      
      const template = await Template.findById(templateId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template não encontrado'
        });
      }

      // Renderizar preview HTML personalizado
      const previewHtml = PremiumPreviewGenerator.generatePreviewHtml(template);

      res.setHeader('Content-Type', 'text/html');
      res.send(previewHtml);

    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Gerar preview HTML simples
  static generateSimplePreviewHtml(template) {
    return `
      <!DOCTYPE html>
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
              ${template.is_premium ? '<span class="info-badge" style="background: #f59e0b;">Premium</span>' : '<span class="info-badge" style="background: #10b981;">Gratuito</span>'}
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
            
            <div class="section">
              <h2 class="section-title">🚀 Próximos Passos</h2>
              <p class="placeholder-text">Call-to-action final para fechar a proposta e iniciar o projeto.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Gerar HTML do preview
  static async generatePreviewHtml(template) {
    const sections = template.content.map(section => {
      switch (section.section_type) {
        case 'hero':
          return `
            <section class="hero-section" style="background: ${section.styles?.background || '#2563eb'}; color: ${section.styles?.textColor || '#ffffff'}; padding: 4rem 0; text-align: ${section.styles?.alignment || 'center'};">
              <div class="container">
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">${section.content.title}</h1>
                <p style="font-size: 1.3rem; margin-bottom: 2rem;">${section.content.subtitle}</p>
                <button style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 1rem 2rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer;">
                  ${section.content.ctaText}
                </button>
              </div>
            </section>
          `;
        
        case 'company_info':
          return `
            <section class="company-section" style="background: ${section.styles?.backgroundColor || '#f8fafc'}; padding: 3rem 0;">
              <div class="container">
                <div style="display: flex; align-items: center; gap: 2rem; max-width: 800px; margin: 0 auto;">
                  <div style="flex: 1;">
                    <h2 style="color: #2563eb; font-size: 2rem; margin-bottom: 1rem;">${section.content.companyName}</h2>
                    <p style="color: #64748b; font-size: 1.1rem; line-height: 1.6;">${section.content.description}</p>
                  </div>
                  <div>
                    <div style="width: 120px; height: 120px; background: #e2e8f0; border-radius: 15px; display: flex; align-items: center; justify-content: center;">
                      <i class="fas fa-building" style="font-size: 3rem; color: #2563eb;"></i>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          `;
        
        case 'services_grid':
          const servicesHtml = section.content.services.map(service => `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 15px; padding: 2rem; text-align: center;">
              <i class="${service.icon}" style="font-size: 2.5rem; color: #2563eb; margin-bottom: 1.5rem;"></i>
              <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: #1e293b;">${service.title}</h3>
              <p style="color: #64748b; margin-bottom: 1.5rem; line-height: 1.6;">${service.description}</p>
              <div style="font-weight: 700; font-size: 1.2rem; color: #2563eb;">${service.price}</div>
            </div>
          `).join('');
          
          return `
            <section class="services-section" style="padding: 4rem 0; background: white;">
              <div class="container">
                <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem; color: #1e293b;">${section.content.title}</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto;">
                  ${servicesHtml}
                </div>
              </div>
            </section>
          `;
        
        case 'investment_summary':
          const itemsHtml = section.content.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0;">
              <span>${item.name}</span>
              <strong>${item.price}</strong>
            </div>
          `).join('');
          
          return `
            <section class="investment-section" style="padding: 4rem 0; background: #f8fafc;">
              <div class="container">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; border-left: 5px solid ${section.styles?.borderColor || '#2563eb'};">
                  <div style="padding: 2rem;">
                    <h3 style="font-size: 1.8rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                      <i class="fas fa-calculator"></i>
                      ${section.content.title}
                    </h3>
                    <div>
                      ${itemsHtml}
                    </div>
                  </div>
                  <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 1.5rem 2rem; border-radius: 0 0 15px 15px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 1.3rem;">
                    <span>Total do Investimento</span>
                    <span>${section.content.total}</span>
                  </div>
                </div>
              </div>
            </section>
          `;
        
        case 'cta_final':
          return `
            <section class="cta-section" style="background: ${section.styles?.background || 'linear-gradient(135deg, #2563eb, #1d4ed8)'}; color: ${section.styles?.textColor || 'white'}; padding: 4rem 0; text-align: center;">
              <div class="container">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">${section.content.title}</h2>
                <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">${section.content.description}</p>
                <div style="display: flex; gap: 1rem; justify-content: center; align-items: center; flex-wrap: wrap;">
                  <button style="background: white; color: #2563eb; border: none; padding: 1rem 2rem; border-radius: 10px; font-weight: 600; font-size: 1.1rem; cursor: pointer;">
                    ${section.content.primaryButton}
                  </button>
                  <button style="background: transparent; color: white; border: 2px solid white; padding: 1rem 2rem; border-radius: 10px; font-weight: 600; font-size: 1.1rem; cursor: pointer;">
                    ${section.content.secondaryButton}
                  </button>
                </div>
              </div>
            </section>
          `;
        
        default:
          return '';
      }
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview: ${template.name}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
          
          /* Responsive */
          @media (max-width: 768px) {
            .container { padding: 0 1rem; }
            h1 { font-size: 2rem !important; }
            h2 { font-size: 1.8rem !important; }
            .services-section > .container > div { grid-template-columns: 1fr !important; }
          }
        </style>
      </head>
      <body>
        ${sections}
        
        <div style="position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 1rem; border-radius: 10px; font-size: 0.9rem;">
          📋 Preview: ${template.name}
        </div>
      </body>
      </html>
    `;
  }

  // Buscar categorias disponíveis
  static async categories(req, res) {
    try {
      const result = await db.query(`
        SELECT 
          category,
          COUNT(*) as template_count,
          STRING_AGG(DISTINCT industry, ', ') as industries
        FROM templates 
        WHERE is_active = true 
        GROUP BY category 
        ORDER BY template_count DESC
      `);

      const categories = result.rows.map(row => ({
        name: row.category,
        display_name: this.getCategoryDisplayName(row.category),
        template_count: parseInt(row.template_count),
        industries: row.industries.split(', ')
      }));

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Helper para nomes de categorias
  static getCategoryDisplayName(category) {
    const names = {
      technology: 'Tecnologia',
      marketing: 'Marketing',
      legal: 'Jurídico',
      design: 'Design',
      business: 'Consultoria',
      finance: 'Financeiro',
      health: 'Saúde',
      education: 'Educação'
    };
    
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }
}

module.exports = TemplateController;