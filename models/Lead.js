const db = require('../config/database');

class Lead {
  static async create(leadData) {
    const { 
      name, 
      email, 
      phone, 
      company, 
      subject, 
      message, 
      source = 'contact_form' 
    } = leadData;
    
    const result = await db.query(
      `INSERT INTO leads (name, email, phone, company, subject, message, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, email, phone, company, subject, message, source]
    );
    
    return result.rows[0];
  }

  static async createRegistrationLead(registrationData) {
    const {
      name,
      email,
      phone,
      whatsapp,
      company,
      cnpj,
      cpf,
      address,
      city,
      state,
      cep,
      plan_interest = 'free'
    } = registrationData;

    const result = await db.query(
      `INSERT INTO leads (
        name, email, phone, whatsapp, company, cnpj, cpf, 
        address, city, state, cep, plan_interest, source, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      RETURNING *`,
      [name, email, phone, whatsapp, company, cnpj, cpf, address, city, state, cep, plan_interest, 'registration_form']
    );

    return result.rows[0];
  }

  static async findAll(page = 1, limit = 20, source = null) {
    let query = `
      SELECT l.*, 
             CASE 
               WHEN u.id IS NOT NULL THEN 'converted'
               ELSE 'pending'
             END as status
      FROM leads l
      LEFT JOIN users u ON l.email = u.email
    `;
    
    const params = [];
    let paramIndex = 1;

    if (source) {
      query += ` WHERE l.source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    query += ` ORDER BY l.created_at DESC`;
    
    if (limit) {
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (page - 1) * limit);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN source = 'contact_form' THEN 1 END) as contact_leads,
        COUNT(CASE WHEN source = 'registration_form' THEN 1 END) as registration_leads,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as leads_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_this_month
      FROM leads
    `);

    const conversionResult = await db.query(`
      SELECT COUNT(*) as converted_leads
      FROM leads l
      INNER JOIN users u ON l.email = u.email
    `);

    return {
      ...result.rows[0],
      converted_leads: parseInt(conversionResult.rows[0].converted_leads),
      conversion_rate: result.rows[0].total_leads > 0 
        ? ((conversionResult.rows[0].converted_leads / result.rows[0].total_leads) * 100).toFixed(2)
        : 0
    };
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM leads WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  }

  static async updateStatus(id, status, notes = null) {
    const result = await db.query(
      `UPDATE leads 
       SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [status, notes, id]
    );
    
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM leads WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0];
  }
}

module.exports = Lead;