const db = require('../config/database');

class Template {
  // Buscar todos os templates ativos
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        t.*,
        COUNT(tu.id) as usage_count,
        AVG(tr.rating) as avg_rating,
        COUNT(tr.id) as review_count
      FROM templates t
      LEFT JOIN template_usage tu ON t.id = tu.template_id
      LEFT JOIN template_ratings tr ON t.id = tr.template_id
      WHERE t.is_active = true
    `;
    
    const params = [];
    let paramIndex = 1;

    // Filtros opcionais
    if (filters.category) {
      query += ` AND t.category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.industry) {
      query += ` AND t.industry = $${paramIndex}`;
      params.push(filters.industry);
      paramIndex++;
    }

    if (filters.isPremium !== undefined) {
      query += ` AND t.is_premium = $${paramIndex}`;
      params.push(filters.isPremium);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND t.tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    query += `
      GROUP BY t.id
      ORDER BY usage_count DESC, t.created_at DESC
    `;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  // Buscar template por ID com conteúdo
  static async findById(id) {
    const templateQuery = `
      SELECT 
        t.*,
        COUNT(tu.id) as usage_count,
        AVG(tr.rating) as avg_rating,
        COUNT(tr.id) as review_count
      FROM templates t
      LEFT JOIN template_usage tu ON t.id = tu.template_id
      LEFT JOIN template_ratings tr ON t.id = tr.template_id
      WHERE t.id = $1 AND t.is_active = true
      GROUP BY t.id
    `;

    const contentQuery = `
      SELECT * FROM template_content 
      WHERE template_id = $1 
      ORDER BY section_order ASC
    `;

    const templateResult = await db.query(templateQuery, [id]);
    const contentResult = await db.query(contentQuery, [id]);

    if (templateResult.rows.length === 0) {
      return null;
    }

    const template = templateResult.rows[0];
    template.content = contentResult.rows;

    return template;
  }

  // Criar novo template
  static async create(templateData, userId = null) {
    const {
      name,
      description,
      category,
      industry,
      tags,
      thumbnail_url,
      preview_url,
      is_premium = false,
      price = 0,
      content = []
    } = templateData;

    try {
      await db.query('BEGIN');

      // Inserir template principal
      const templateResult = await db.query(`
        INSERT INTO templates (
          name, description, category, industry, tags, 
          thumbnail_url, preview_url, is_premium, price, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        name, description, category, industry, tags,
        thumbnail_url, preview_url, is_premium, price, userId
      ]);

      const template = templateResult.rows[0];

      // Inserir conteúdo do template
      if (content.length > 0) {
        for (let i = 0; i < content.length; i++) {
          const section = content[i];
          await db.query(`
            INSERT INTO template_content (
              template_id, section_type, section_order, content, styles
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            template.id,
            section.type,
            i + 1,
            JSON.stringify(section.content),
            JSON.stringify(section.styles || {})
          ]);
        }
      }

      await db.query('COMMIT');
      return await this.findById(template.id);

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  // Registrar uso de template
  static async recordUsage(templateId, userId, proposalId) {
    await db.query(`
      INSERT INTO template_usage (template_id, user_id, proposal_id)
      VALUES ($1, $2, $3)
    `, [templateId, userId, proposalId]);

    // Atualizar contador de uso
    await db.query(`
      UPDATE templates 
      SET usage_count = usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [templateId]);
  }

  // Avaliar template
  static async rateTemplate(templateId, userId, rating, review = null) {
    const result = await db.query(`
      INSERT INTO template_ratings (template_id, user_id, rating, review)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (template_id, user_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        review = EXCLUDED.review,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [templateId, userId, rating, review]);

    // Recalcular rating médio
    await this.updateAverageRating(templateId);

    return result.rows[0];
  }

  // Atualizar rating médio
  static async updateAverageRating(templateId) {
    await db.query(`
      UPDATE templates 
      SET rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM template_ratings 
        WHERE template_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [templateId]);
  }

  // Buscar templates populares
  static async findPopular(limit = 10) {
    const result = await db.query(`
      SELECT 
        t.*,
        COUNT(tu.id) as usage_count,
        AVG(tr.rating) as avg_rating
      FROM templates t
      LEFT JOIN template_usage tu ON t.id = tu.template_id
      LEFT JOIN template_ratings tr ON t.id = tr.template_id
      WHERE t.is_active = true
      GROUP BY t.id
      HAVING COUNT(tu.id) > 0
      ORDER BY usage_count DESC, avg_rating DESC NULLS LAST
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // Buscar templates por categoria
  static async findByCategory(category, limit = 20) {
    return await this.findAll({ category, limit });
  }

  // Buscar templates recomendados para usuário
  static async findRecommended(userId, limit = 5) {
    // Buscar baseado no histórico de uso do usuário
    const result = await db.query(`
      WITH user_categories AS (
        SELECT DISTINCT t.category, COUNT(*) as usage_count
        FROM template_usage tu
        JOIN templates t ON tu.template_id = t.id
        WHERE tu.user_id = $1
        GROUP BY t.category
        ORDER BY usage_count DESC
        LIMIT 3
      )
      SELECT DISTINCT t.*, 
             COUNT(tu.id) as usage_count,
             AVG(tr.rating) as avg_rating
      FROM templates t
      LEFT JOIN template_usage tu ON t.id = tu.template_id
      LEFT JOIN template_ratings tr ON t.id = tr.template_id
      WHERE t.is_active = true
        AND t.category IN (SELECT category FROM user_categories)
        AND t.id NOT IN (
          SELECT template_id 
          FROM template_usage 
          WHERE user_id = $1
        )
      GROUP BY t.id
      ORDER BY avg_rating DESC NULLS LAST, usage_count DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  // Buscar estatísticas do template
  static async getStats(templateId) {
    const result = await db.query(`
      SELECT 
        COUNT(tu.id) as total_uses,
        COUNT(DISTINCT tu.user_id) as unique_users,
        AVG(tr.rating) as avg_rating,
        COUNT(tr.id) as total_reviews,
        COUNT(CASE WHEN tr.rating >= 4 THEN 1 END) as positive_reviews
      FROM templates t
      LEFT JOIN template_usage tu ON t.id = tu.template_id
      LEFT JOIN template_ratings tr ON t.id = tr.template_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [templateId]);

    return result.rows[0] || {};
  }

  // Clonar template para proposta
  static async cloneForProposal(templateId, proposalId, userId, customizations = {}) {
    try {
      await db.query('BEGIN');

      const template = await this.findById(templateId);
      if (!template) {
        throw new Error('Template não encontrado');
      }

      // Registrar uso
      await this.recordUsage(templateId, userId, proposalId);

      // Processar conteúdo do template
      const processedContent = template.content.map(section => {
        let content = { ...section.content };
        
        // Aplicar customizações
        if (customizations.companyName) {
          content = JSON.parse(
            JSON.stringify(content).replace(/\{\{COMPANY_NAME\}\}/g, customizations.companyName)
          );
        }
        
        if (customizations.totalAmount) {
          content = JSON.parse(
            JSON.stringify(content).replace(/\{\{TOTAL_AMOUNT\}\}/g, customizations.totalAmount)
          );
        }

        // Aplicar outras customizações
        Object.keys(customizations).forEach(key => {
          if (typeof customizations[key] === 'string') {
            content = JSON.parse(
              JSON.stringify(content).replace(
                new RegExp(`\\{\\{${key.toUpperCase()}\\}\\}`, 'g'), 
                customizations[key]
              )
            );
          }
        });

        return {
          ...section,
          content
        };
      });

      await db.query('COMMIT');

      return {
        templateId,
        templateName: template.name,
        content: processedContent,
        metadata: {
          category: template.category,
          industry: template.industry,
          clonedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  // Atualizar template
  static async update(id, updateData) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (['name', 'description', 'category', 'industry', 'tags', 'thumbnail_url', 'preview_url', 'is_premium', 'price', 'is_active'].includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE templates 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Deletar template (soft delete)
  static async delete(id) {
    const result = await db.query(`
      UPDATE templates 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }

  // Buscar reviews do template
  static async getReviews(templateId, limit = 10) {
    const result = await db.query(`
      SELECT 
        tr.*,
        u.name as user_name,
        u.email as user_email
      FROM template_ratings tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.template_id = $1 AND tr.review IS NOT NULL
      ORDER BY tr.created_at DESC
      LIMIT $2
    `, [templateId, limit]);

    return result.rows;
  }
}

module.exports = Template;