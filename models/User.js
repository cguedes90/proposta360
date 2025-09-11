const bcrypt = require('bcryptjs');
const db = require('../config/database');

class User {
  static async create(userData) {
    const { name, email, password, plan = 'free' } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await db.query(
      'INSERT INTO users (name, email, password, plan) VALUES ($1, $2, $3, $4) RETURNING id, name, email, plan, created_at',
      [name, email, hashedPassword, plan]
    );
    
    return result.rows[0];
  }
  
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0];
  }
  
  static async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, plan, created_at FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  }
  
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [hashedPassword, userId]
    );
    
    return result.rows[0];
  }

  static async savePasswordResetToken(userId, token, expiry) {
    const result = await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id',
      [token, expiry, userId]
    );
    
    return result.rows[0];
  }

  static async findByResetToken(token) {
    const result = await db.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    
    return result.rows[0];
  }

  static async clearPasswordResetToken(userId) {
    const result = await db.query(
      'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [userId]
    );
    
    return result.rows[0];
  }

  static async getProposalsThisMonth(userId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db.query(
      'SELECT COUNT(*) as count FROM proposals WHERE user_id = $1 AND created_at >= $2',
      [userId, startOfMonth]
    );
    
    return parseInt(result.rows[0].count);
  }

  static async updatePlan(userId, newPlan) {
    if (!['free', 'premium'].includes(newPlan)) {
      throw new Error('Plano inválido');
    }

    const result = await db.query(
      'UPDATE users SET plan = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, plan',
      [newPlan, userId]
    );
    
    return result.rows[0];
  }
}

module.exports = User;