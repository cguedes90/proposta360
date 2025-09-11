const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ProposalVisitor {
  static async create(visitorData) {
    const { fullName, cpf, position, company, proposalId } = visitorData;
    const token = uuidv4();
    
    const result = await db.query(
      `INSERT INTO proposal_visitors (proposal_id, full_name, cpf, position, company, access_token, first_visit_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [proposalId, fullName, cpf, position, company, token]
    );
    
    return result.rows[0];
  }

  static async findByToken(token) {
    const result = await db.query(
      `SELECT pv.*, p.title as proposal_title, p.user_id as proposal_owner_id,
              u.name as proposal_owner_name, u.email as proposal_owner_email
       FROM proposal_visitors pv
       INNER JOIN proposals p ON pv.proposal_id = p.id
       INNER JOIN users u ON p.user_id = u.id
       WHERE pv.access_token = $1`,
      [token]
    );
    
    return result.rows[0];
  }

  static async findByProposal(proposalId) {
    const result = await db.query(
      `SELECT * FROM proposal_visitors 
       WHERE proposal_id = $1 
       ORDER BY first_visit_at DESC`,
      [proposalId]
    );
    
    return result.rows;
  }

  static async updateLastActivity(token) {
    const result = await db.query(
      `UPDATE proposal_visitors 
       SET last_activity_at = CURRENT_TIMESTAMP 
       WHERE access_token = $1 
       RETURNING *`,
      [token]
    );
    
    return result.rows[0];
  }

  static async findExisting(cpf, proposalId) {
    const result = await db.query(
      `SELECT * FROM proposal_visitors 
       WHERE cpf = $1 AND proposal_id = $2`,
      [cpf, proposalId]
    );
    
    return result.rows[0];
  }

  static async updateExisting(id, updates) {
    const { fullName, position, company } = updates;
    const result = await db.query(
      `UPDATE proposal_visitors 
       SET full_name = $2, position = $3, company = $4, last_activity_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id, fullName, position, company]
    );
    
    return result.rows[0];
  }
}

module.exports = ProposalVisitor;