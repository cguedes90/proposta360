const db = require('../config/database');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

class Notification {
  static async create(notificationData) {
    const { user_id, proposal_id, type, title, message } = notificationData;
    
    const result = await db.query(
      `INSERT INTO notifications (user_id, proposal_id, type, title, message) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, proposal_id, type, title, message]
    );
    
    const notification = result.rows[0];
    
    await this.sendNotification(notification.id);
    
    return notification;
  }
  
  static async findByUser(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT n.*, p.title as proposal_title 
       FROM notifications n
       LEFT JOIN proposals p ON n.proposal_id = p.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }
  
  static async markAsRead(id, userId) {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    return result.rows[0];
  }
  
  static async markAllAsRead(userId) {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false RETURNING count(*)',
      [userId]
    );
    
    return result.rows[0];
  }
  
  static async getUnreadCount(userId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    
    return parseInt(result.rows[0].count);
  }
  
  static async sendNotification(notificationId) {
    try {
      const result = await db.query(
        `SELECT n.*, u.email, u.name, p.title as proposal_title, p.public_link
         FROM notifications n
         INNER JOIN users u ON n.user_id = u.id
         LEFT JOIN proposals p ON n.proposal_id = p.id
         WHERE n.id = $1`,
        [notificationId]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const notification = result.rows[0];
      let emailSent = false;
      let whatsappSent = false;
      
      switch (notification.type) {
        case 'view':
          emailSent = await emailService.sendProposalViewNotification(
            notification.email,
            notification.proposal_title,
            notification.public_link
          );
          break;
          
        case 'approval':
          emailSent = await emailService.sendProposalApprovalNotification(
            notification.email,
            notification.proposal_title,
            notification.public_link
          );
          break;
          
        case 'section_view':
          emailSent = await emailService.sendSectionViewNotification(
            notification.email,
            notification.proposal_title
          );
          break;
      }
      
      await db.query(
        'UPDATE notifications SET sent_email = $1, sent_whatsapp = $2 WHERE id = $3',
        [emailSent, whatsappSent, notificationId]
      );
      
      return { emailSent, whatsappSent };
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  }
  
  static async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    return result.rows[0];
  }
}

module.exports = Notification;