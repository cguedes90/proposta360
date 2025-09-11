const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const emailService = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, plan = 'free' } = req.body;

    // Validar plano
    if (!['free', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'Plano inválido. Use "free" ou "premium"' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email já está em uso' });
    }

    const user = await User.create({ name, email, password, plan });
    const token = generateToken(user.id);

    // Enviar email de boas-vindas
    try {
      await emailService.sendWelcomeEmail({
        name: user.name,
        email: user.email,
        plan: user.plan
      });
      console.log('📧 Email de boas-vindas enviado para:', user.email);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de boas-vindas:', emailError);
      // Não interrompe o registro se o email falhar
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        proposalsThisMonth: 0,
        proposalsLimit: user.plan === 'premium' ? 70 : 1
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getProfile = async (req, res) => {
  try {
    // Buscar dados atualizados do usuário incluindo plano e limite de propostas
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Contar propostas do mês atual
    const proposalsThisMonth = await User.getProposalsThisMonth(user.id);
    const proposalsLimit = user.plan === 'premium' ? 70 : 1;

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        proposalsThisMonth,
        proposalsLimit,
        canCreateProposal: proposalsThisMonth < proposalsLimit
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Por segurança, não revelamos se o email existe ou não
      return res.json({ 
        message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.' 
      });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await User.savePasswordResetToken(user.id, resetToken, resetTokenExpiry);

    // Enviar email de reset
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      console.log('📧 Email de reset de senha enviado para:', user.email);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de reset:', emailError);
      return res.status(500).json({ error: 'Erro ao enviar email de reset' });
    }

    res.json({ 
      message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.' 
    });
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Verificar token e expiração
    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar senha
    await User.updatePassword(user.id, newPassword);

    // Limpar token de reset
    await User.clearPasswordResetToken(user.id);

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const checkProposalLimit = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const proposalsThisMonth = await User.getProposalsThisMonth(user.id);
    const proposalsLimit = user.plan === 'premium' ? 70 : 1;
    const canCreateProposal = proposalsThisMonth < proposalsLimit;

    res.json({
      plan: user.plan,
      proposalsThisMonth,
      proposalsLimit,
      canCreateProposal,
      message: canCreateProposal 
        ? 'Você pode criar uma nova proposta' 
        : `Limite de propostas atingido para o plano ${user.plan}. ${user.plan === 'free' ? 'Considere fazer upgrade para o plano Premium.' : ''}`
    });
  } catch (error) {
    console.error('Erro ao verificar limite de propostas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  requestPasswordReset,
  resetPassword,
  checkProposalLimit
};