const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class File {
  static async create(fileData) {
    const { user_id, section_id, filename, original_name, file_type, file_size, file_path } = fileData;
    
    const result = await db.query(
      `INSERT INTO files (user_id, section_id, filename, original_name, file_type, file_size, file_path) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [user_id, section_id, filename, original_name, file_type, file_size, file_path]
    );
    
    return result.rows[0];
  }
  
  static async findByUser(userId) {
    const result = await db.query(
      'SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows;
  }
  
  static async findBySection(sectionId) {
    const result = await db.query(
      'SELECT * FROM files WHERE section_id = $1 ORDER BY created_at ASC',
      [sectionId]
    );
    
    return result.rows;
  }
  
  static async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM files WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return result.rows[0];
  }
  
  static async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM files WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows[0]) {
      try {
        await fs.unlink(result.rows[0].file_path);
      } catch (error) {
        console.error('Erro ao deletar arquivo físico:', error);
      }
    }
    
    return result.rows[0];
  }
  
  static async deleteBySection(sectionId) {
    const result = await db.query(
      'DELETE FROM files WHERE section_id = $1 RETURNING *',
      [sectionId]
    );
    
    for (const file of result.rows) {
      try {
        await fs.unlink(file.file_path);
      } catch (error) {
        console.error('Erro ao deletar arquivo físico:', error);
      }
    }
    
    return result.rows;
  }
  
  static getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
    return 'file';
  }
  
  static getPublicUrl(filename) {
    return `/uploads/${filename}`;
  }
}

module.exports = File;