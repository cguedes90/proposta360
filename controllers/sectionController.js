const { validationResult } = require('express-validator');
const Section = require('../models/Section');

const createSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const section = await Section.create(req.user.id, req.body);
    
    res.status(201).json({
      message: 'Seção criada com sucesso',
      section
    });
  } catch (error) {
    console.error('Erro ao criar seção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getSections = async (req, res) => {
  try {
    const { reusable } = req.query;
    let isReusable = null;
    
    if (reusable === 'true') isReusable = true;
    if (reusable === 'false') isReusable = false;
    
    const sections = await Section.findByUser(req.user.id, isReusable);
    
    res.json({ sections });
  } catch (error) {
    console.error('Erro ao buscar seções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getSection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const section = await Section.findById(id, req.user.id);
    
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }
    
    res.json({ section });
  } catch (error) {
    console.error('Erro ao buscar seção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const updateSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    const section = await Section.update(id, req.user.id, req.body);
    
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }
    
    res.json({
      message: 'Seção atualizada com sucesso',
      section
    });
  } catch (error) {
    console.error('Erro ao atualizar seção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const section = await Section.delete(id, req.user.id);
    
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada' });
    }
    
    res.json({ message: 'Seção excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir seção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createSection,
  getSections,
  getSection,
  updateSection,
  deleteSection
};