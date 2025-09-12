const db = require('../config/database');

class ShortLink {
  static async create(originalUrl, proposalId) {
    // Gerar código curto de 6 caracteres alfanuméricos
    const shortCode = this.generateShortCode();
    
    const result = await db.query(
      `INSERT INTO short_links (short_code, original_url, proposal_id, created_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [shortCode, originalUrl, proposalId]
    );
    
    return result.rows[0];
  }

  static async findByShortCode(shortCode) {
    const result = await db.query(
      `SELECT sl.*, p.title as proposal_title 
       FROM short_links sl 
       LEFT JOIN proposals p ON sl.proposal_id = p.id 
       WHERE sl.short_code = $1`,
      [shortCode]
    );
    
    return result.rows[0];
  }

  static async findByProposal(proposalId) {
    const result = await db.query(
      `SELECT * FROM short_links 
       WHERE proposal_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [proposalId]
    );
    
    return result.rows[0];
  }

  static async incrementClicks(shortCode) {
    const result = await db.query(
      `UPDATE short_links 
       SET clicks = clicks + 1, last_clicked_at = CURRENT_TIMESTAMP 
       WHERE short_code = $1 
       RETURNING *`,
      [shortCode]
    );
    
    return result.rows[0];
  }

  static generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async getOrCreateShortLink(proposalId, publicLink) {
    // Verificar se já existe um link curto para esta proposta
    const existingLink = await this.findByProposal(proposalId);
    
    if (existingLink) {
      return existingLink;
    }

    // Criar novo link curto
    const originalUrl = `https://proposta360.com.br/welcome?id=${publicLink}&return=/proposta/${publicLink}`;
    return await this.create(originalUrl, proposalId);
  }
}

module.exports = ShortLink;