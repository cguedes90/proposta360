const { validationResult } = require('express-validator');
const User = require('../models/User');
const Lead = require('../models/Lead');
const db = require('../config/database');

// Middleware para verificar se é super admin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas super admins podem acessar.' });
  }
  next();
};

const getDashboardStats = async (req, res) => {
  try {
    // Stats de usuários
    const userStats = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_users,
        COUNT(CASE WHEN plan = 'premium' THEN 1 END) as premium_users,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as users_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as users_this_month
      FROM users
      WHERE role != 'super_admin'
    `);

    // Stats de propostas
    const proposalStats = await db.query(`
      SELECT 
        COUNT(*) as total_proposals,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as proposals_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as proposals_this_month
      FROM proposals
    `);

    // Stats de leads
    const leadStats = await Lead.getStats();

    res.json({
      users: userStats.rows[0],
      proposals: proposalStats.rows[0],
      leads: leadStats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    let query = `
      SELECT 
        u.id, u.name, u.email, u.plan, u.role, u.created_at,
        COUNT(p.id) as total_proposals,
        COUNT(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as proposals_this_month
      FROM users u
      LEFT JOIN proposals p ON u.id = p.user_id
      WHERE u.role != 'super_admin'
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY u.id, u.name, u.email, u.plan, u.role, u.created_at`;
    query += ` ORDER BY u.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    params.push(limit, (page - 1) * limit);

    const result = await db.query(query, params);

    // Contar total para paginação
    let countQuery = `SELECT COUNT(*) FROM users WHERE role != 'super_admin'`;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (name ILIKE $1 OR email ILIKE $1)`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const updateUserPlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { plan } = req.body;

    const user = await User.updatePlan(userId, plan);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Plano do usuário atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar plano do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const result = await db.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, plan',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Role do usuário atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar role do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getAllLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const source = req.query.source || null;

    const leads = await Lead.findAll(page, limit, source);

    // Contar total para paginação
    let countQuery = 'SELECT COUNT(*) FROM leads';
    const countParams = [];
    
    if (source) {
      countQuery += ' WHERE source = $1';
      countParams.push(source);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalLeads = parseInt(countResult.rows[0].count);

    res.json({
      leads,
      pagination: {
        page,
        limit,
        total: totalLeads,
        pages: Math.ceil(totalLeads / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status, notes } = req.body;

    const lead = await Lead.updateStatus(leadId, status, notes);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({
      message: 'Status do lead atualizado com sucesso',
      lead
    });
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se o usuário existe e não é super admin
    const userCheck = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (userCheck.rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'Não é possível excluir super admin' });
    }

    // Deletar o usuário (cascade irá remover propostas relacionadas)
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.delete(leadId);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ message: 'Lead excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  requireSuperAdmin,
  getDashboardStats,
  getAllUsers,
  updateUserPlan,
  updateUserRole,
  getAllLeads,
  updateLeadStatus,
  deleteUser,
  deleteLead
};