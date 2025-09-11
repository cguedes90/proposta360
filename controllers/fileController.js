const File = require('../models/File');
const Section = require('../models/Section');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { sectionId } = req.body;
    
    if (sectionId) {
      const section = await Section.findById(sectionId, req.user.id);
      if (!section) {
        return res.status(404).json({ error: 'Seção não encontrada' });
      }
    }

    const fileData = {
      user_id: req.user.id,
      section_id: sectionId || null,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_type: File.getFileType(req.file.mimetype),
      file_size: req.file.size,
      file_path: req.file.path
    };

    const file = await File.create(fileData);
    
    res.status(201).json({
      message: 'Arquivo enviado com sucesso',
      file: {
        ...file,
        url: File.getPublicUrl(file.filename)
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { sectionId } = req.body;
    
    if (sectionId) {
      const section = await Section.findById(sectionId, req.user.id);
      if (!section) {
        return res.status(404).json({ error: 'Seção não encontrada' });
      }
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileData = {
        user_id: req.user.id,
        section_id: sectionId || null,
        filename: file.filename,
        original_name: file.originalname,
        file_type: File.getFileType(file.mimetype),
        file_size: file.size,
        file_path: file.path
      };

      const savedFile = await File.create(fileData);
      uploadedFiles.push({
        ...savedFile,
        url: File.getPublicUrl(savedFile.filename)
      });
    }
    
    res.status(201).json({
      message: 'Arquivos enviados com sucesso',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Erro no upload múltiplo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getFiles = async (req, res) => {
  try {
    const { sectionId } = req.query;
    
    let files;
    if (sectionId) {
      files = await File.findBySection(sectionId);
    } else {
      files = await File.findByUser(req.user.id);
    }
    
    const filesWithUrls = files.map(file => ({
      ...file,
      url: File.getPublicUrl(file.filename)
    }));
    
    res.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await File.findById(id, req.user.id);
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    res.json({
      file: {
        ...file,
        url: File.getPublicUrl(file.filename)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await File.delete(id, req.user.id);
    
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    res.json({ message: 'Arquivo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  getFiles,
  getFile,
  deleteFile
};