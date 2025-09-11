const db = require('../config/database');

class NotificationService {
  static async create(userId, notificationData) {
    try {
      const { type, title, message, data = {}, proposalId = null } = notificationData;
      
      const result = await db.query(
        `INSERT INTO notifications (user_id, proposal_id, type, title, message, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [userId, proposalId, type, title, message]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const result = await db.query(
        `UPDATE notifications 
         SET read = true 
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [notificationId, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return null;
    }
  }

  static async getByUser(userId, limit = 20) {
    try {
      const result = await db.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      return [];
    }
  }

  static async getUnreadCount(userId) {
    try {
      const result = await db.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE user_id = $1 AND read = false`,
        [userId]
      );
      
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }
}

module.exports = NotificationService;