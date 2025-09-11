const { validationResult } = require('express-validator');
const Proposal = require('../models/Proposal');
const Section = require('../models/Section');
const User = require('../models/User');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification');

const createProposal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar limite de propostas do usuário
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const proposalsThisMonth = await User.getProposalsThisMonth(user.id);
    const proposalsLimit = user.plan === 'premium' ? 50 : 1;

    if (proposalsThisMonth >= proposalsLimit) {
      return res.status(403).json({ 
        error: `Limite de propostas atingido para o plano ${user.plan}`,
        limit: proposalsLimit,
        current: proposalsThisMonth,
        message: user.plan === 'free' 
          ? 'Faça upgrade para o plano Premium para criar mais propostas' 
          : 'Você atingiu o limite mensal de propostas do plano Premium'
      });
    }

    const proposal = await Proposal.create(req.user.id, req.body);
    
    res.status(201).json({
      message: 'Proposta criada com sucesso',
      proposal,
      remaining: proposalsLimit - proposalsThisMonth - 1
    });
  } catch (error) {
    console.error('Erro ao criar proposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getProposals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const proposals = await Proposal.findByUser(req.user.id, page, limit);
    
    res.json({ proposals });
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getProposal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proposal = await Proposal.getWithSections(id, req.user.id);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    res.json({ proposal });
  } catch (error) {
    console.error('Erro ao buscar proposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const updateProposal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    const proposal = await Proposal.update(id, req.user.id, req.body);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    res.json({
      message: 'Proposta atualizada com sucesso',
      proposal
    });
  } catch (error) {
    console.error('Erro ao atualizar proposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proposal = await Proposal.delete(id, req.user.id);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    res.json({ message: 'Proposta excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir proposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const addSectionToProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { sectionId, orderIndex } = req.body;
    
    const proposal = await Proposal.findById(proposalId, req.user.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    const section = await Section.findById(sectionId, req.user.id);
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }
    
    await Section.addToProposal(proposalId, sectionId, orderIndex);
    
    res.json({ message: 'Seção adicionada à proposta com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar seção à proposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const removeSectionFromProposal = async (req, res) => {
  try {
    const { proposalId, sectionId } = req.params;
    
    const proposal = await Proposal.findById(proposalId, req.user.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    await Section.removeFromProposal(proposalId, sectionId);
    
    res.json({ message: 'Seção removida da proposta com sucesso' });
  } catch (error) {
    console.error('Erro ao remover seção da proposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const reorderSections = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { sectionsOrder } = req.body;
    
    const proposal = await Proposal.findById(proposalId, req.user.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    await Section.reorderInProposal(proposalId, sectionsOrder);
    
    res.json({ message: 'Ordem das seções atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar seções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createProposal,
  getProposals,
  getProposal,
  updateProposal,
  deleteProposal,
  addSectionToProposal,
  removeSectionFromProposal,
  reorderSections
};