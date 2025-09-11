const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Proposal {
  static async create(userId, proposalData) {
    const { title, private_title, content, status = 'draft' } = proposalData;
    const publicLink = uuidv4();
    
    const result = await db.query(
      `INSERT INTO proposals (user_id, title, private_title, public_link, content, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, title, private_title, publicLink, content, status]
    );
    
    return result.rows[0];
  }
  
  static async findByUser(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT p.*, 
              COUNT(ps.id) as section_count,
              COUNT(pv.id) as view_count
       FROM proposals p
       LEFT JOIN proposal_sections ps ON p.id = ps.proposal_id
       LEFT JOIN proposal_views pv ON p.id = pv.proposal_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }
  
  static async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM proposals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return result.rows[0];
  }
  
  static async findByPublicLink(publicLink) {
    const result = await db.query(
      'SELECT * FROM proposals WHERE public_link = $1',
      [publicLink]
    );
    
    return result.rows[0];
  }
  
  static async update(id, userId, updates) {
    const setFields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        setFields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });
    
    if (setFields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    values.push(userId, id);
    
    const result = await db.query(
      `UPDATE proposals 
       SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount} AND id = $${paramCount + 1}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  }
  
  static async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM proposals WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    return result.rows[0];
  }
  
  static async getWithSections(id, userId) {
    const proposal = await this.findById(id, userId);
    if (!proposal) return null;
    
    const sectionsResult = await db.query(
      `SELECT s.*, ps.order_index
       FROM sections s
       INNER JOIN proposal_sections ps ON s.id = ps.section_id
       WHERE ps.proposal_id = $1
       ORDER BY ps.order_index ASC`,
      [id]
    );
    
    proposal.sections = sectionsResult.rows;
    return proposal;
  }
}

module.exports = Proposal;