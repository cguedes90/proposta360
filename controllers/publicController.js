const Proposal = require('../models/Proposal');
const User = require('../models/User');
const emailService = require('../services/emailService');
const db = require('../config/database');

const getPublicProposal = async (req, res) => {
  try {
    const { publicLink } = req.params;
    
    const proposal = await Proposal.findByPublicLink(publicLink);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    const sectionsResult = await db.query(
      `SELECT s.id, s.title, s.type, s.content, ps.order_index,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', f.id,
                    'filename', f.filename,
                    'original_name', f.original_name,
                    'file_type', f.file_type,
                    'url', '/uploads/' || f.filename
                  )
                ) FILTER (WHERE f.id IS NOT NULL), '[]'
              ) as files
       FROM sections s
       INNER JOIN proposal_sections ps ON s.id = ps.section_id
       LEFT JOIN files f ON s.id = f.section_id
       WHERE ps.proposal_id = $1
       GROUP BY s.id, s.title, s.type, s.content, ps.order_index
       ORDER BY ps.order_index ASC`,
      [proposal.id]
    );
    
    const userAgent = req.get('User-Agent');
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    let viewRecord = await db.query(
      'SELECT * FROM proposal_views WHERE proposal_id = $1 AND viewer_ip = $2',
      [proposal.id, clientIp]
    );
    
    if (viewRecord.rows.length === 0) {
      viewRecord = await db.query(
        `INSERT INTO proposal_views (proposal_id, viewer_ip, viewer_user_agent) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [proposal.id, clientIp, userAgent]
      );
      
      await createNotification(proposal.user_id, proposal.id, 'view', 'Nova visualização', 
        'Sua proposta foi visualizada pela primeira vez');
      
      // Enviar notificação por email
      try {
        const user = await User.findById(proposal.user_id);
        if (user) {
          await emailService.sendProposalViewNotification(
            user.email, 
            proposal.title, 
            proposal.public_link
          );
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de visualização:', emailError);
      }
    } else {
      await db.query(
        'UPDATE proposal_views SET last_viewed_at = CURRENT_TIMESTAMP WHERE id = $1',
        [viewRecord.rows[0].id]
      );
    }
    
    res.json({
      proposal: {
        id: proposal.id,
        title: proposal.title,
        sections: sectionsResult.rows,
        created_at: proposal.created_at
      }
    });
  } catch (error) {
    console.error('Erro ao buscar proposta pública:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const trackSectionView = async (req, res) => {
  try {
    const { publicLink } = req.params;
    const { sectionId, timeSpent } = req.body;
    
    const proposal = await Proposal.findByPublicLink(publicLink);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    const viewRecord = await db.query(
      'SELECT * FROM proposal_views WHERE proposal_id = $1 AND viewer_ip = $2',
      [proposal.id, clientIp]
    );
    
    if (viewRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão de visualização não encontrada' });
    }
    
    const currentSections = viewRecord.rows[0].sections_viewed || [];
    
    if (!currentSections.includes(sectionId)) {
      currentSections.push(sectionId);
      
      await db.query(
        `UPDATE proposal_views 
         SET sections_viewed = $1, time_spent = time_spent + $2, last_viewed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [JSON.stringify(currentSections), timeSpent || 0, viewRecord.rows[0].id]
      );
      
      await db.query(
        `INSERT INTO proposal_interactions (proposal_id, view_id, interaction_type, section_id, interaction_data)
         VALUES ($1, $2, $3, $4, $5)`,
        [proposal.id, viewRecord.rows[0].id, 'section_view', sectionId, JSON.stringify({ timeSpent })]
      );
      
      await createNotification(proposal.user_id, proposal.id, 'section_view', 
        'Seção visualizada', `Uma seção da sua proposta foi visualizada`);
      
      // Enviar notificação por email para visualização de seção
      try {
        const user = await User.findById(proposal.user_id);
        if (user) {
          await emailService.sendSectionViewNotification(
            user.email, 
            proposal.title, 
            `Seção ID: ${sectionId}`
          );
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de seção visualizada:', emailError);
      }
    }
    
    res.json({ message: 'Visualização registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const trackInteraction = async (req, res) => {
  try {
    const { publicLink } = req.params;
    const { interactionType, sectionId, data } = req.body;
    
    const proposal = await Proposal.findByPublicLink(publicLink);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    const viewRecord = await db.query(
      'SELECT * FROM proposal_views WHERE proposal_id = $1 AND viewer_ip = $2',
      [proposal.id, clientIp]
    );
    
    if (viewRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão de visualização não encontrada' });
    }
    
    await db.query(
      `INSERT INTO proposal_interactions (proposal_id, view_id, interaction_type, section_id, interaction_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [proposal.id, viewRecord.rows[0].id, interactionType, sectionId, JSON.stringify(data)]
    );
    
    if (interactionType === 'approval') {
      await createNotification(proposal.user_id, proposal.id, 'approval', 
        'Proposta aprovada!', 'Sua proposta foi aprovada pelo cliente');
      
      // Enviar notificação por email para aprovação
      try {
        const user = await User.findById(proposal.user_id);
        if (user) {
          await emailService.sendProposalApprovalNotification(
            user.email, 
            proposal.title, 
            proposal.public_link
          );
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de aprovação:', emailError);
      }
    }
    
    res.json({ message: 'Interação registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar interação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

async function createNotification(userId, proposalId, type, title, message) {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, proposal_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, proposalId, type, title, message]
    );
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}

module.exports = {
  getPublicProposal,
  trackSectionView,
  trackInteraction
};