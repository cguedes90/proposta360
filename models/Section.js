const db = require('../config/database');

class Section {
  static async create(userId, sectionData) {
    const { title, type, content, is_reusable = false } = sectionData;
    
    const result = await db.query(
      `INSERT INTO sections (user_id, title, type, content, is_reusable) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, title, type, JSON.stringify(content), is_reusable]
    );
    
    return result.rows[0];
  }
  
  static async findByUser(userId, isReusable = null) {
    let query = 'SELECT * FROM sections WHERE user_id = $1';
    const params = [userId];
    
    if (isReusable !== null) {
      query += ' AND is_reusable = $2';
      params.push(isReusable);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  static async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM sections WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return result.rows[0];
  }
  
  static async update(id, userId, updates) {
    const setFields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'content') {
          setFields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          setFields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
        paramCount++;
      }
    });
    
    values.push(userId, id);
    
    const result = await db.query(
      `UPDATE sections 
       SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount} AND id = $${paramCount + 1}
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  }
  
  static async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM sections WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    return result.rows[0];
  }
  
  static async addToProposal(proposalId, sectionId, orderIndex) {
    const result = await db.query(
      `INSERT INTO proposal_sections (proposal_id, section_id, order_index) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [proposalId, sectionId, orderIndex]
    );
    
    return result.rows[0];
  }
  
  static async removeFromProposal(proposalId, sectionId) {
    const result = await db.query(
      'DELETE FROM proposal_sections WHERE proposal_id = $1 AND section_id = $2 RETURNING *',
      [proposalId, sectionId]
    );
    
    return result.rows[0];
  }
  
  static async reorderInProposal(proposalId, sectionsOrder) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const { sectionId, orderIndex } of sectionsOrder) {
        await client.query(
          'UPDATE proposal_sections SET order_index = $1 WHERE proposal_id = $2 AND section_id = $3',
          [orderIndex, proposalId, sectionId]
        );
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Section;