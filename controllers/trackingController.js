const ProposalVisitor = require('../models/ProposalVisitor');
const ProposalTracking = require('../models/ProposalTracking');
const Proposal = require('../models/Proposal');
const emailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');

class TrackingController {
  // Registrar visitante
  static async registerVisitor(req, res) {
    try {
      const { fullName, cpf, position, company, proposalId } = req.body;

      // Verificar se a proposta existe
      const proposal = await Proposal.findByPublicLink(proposalId);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposta não encontrada' });
      }

      // Verificar se o visitante já existe (por CPF e proposta)
      const existingVisitor = await ProposalVisitor.findExisting(cpf, proposal.id);
      
      let visitor;
      if (existingVisitor) {
        // Atualizar dados do visitante existente
        visitor = await ProposalVisitor.updateExisting(existingVisitor.id, {
          fullName, position, company
        });
      } else {
        // Criar novo visitante
        visitor = await ProposalVisitor.create({
          fullName,
          cpf,
          position,
          company,
          proposalId: proposal.id
        });

        // Notificar o criador da proposta sobre o novo visitante
        await TrackingController.notifyProposalOwner(proposal, visitor, 'new_visitor');
      }

      // Log da primeira interação
      await ProposalTracking.logPageView(visitor.id, proposal.id, 'welcome_page');

      res.json({
        success: true,
        token: visitor.access_token,
        message: 'Visitante registrado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao registrar visitante:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Registrar interação
  static async logInteraction(req, res) {
    try {
      const { visitorToken, eventType, eventData, sectionId, timeSpent, scrollPercentage } = req.body;

      // Verificar visitante
      const visitor = await ProposalVisitor.findByToken(visitorToken);
      if (!visitor) {
        return res.status(404).json({ error: 'Visitante não encontrado' });
      }

      // Atualizar última atividade
      await ProposalVisitor.updateLastActivity(visitorToken);

      // Registrar interação
      await ProposalTracking.logInteraction({
        visitorId: visitor.id,
        proposalId: visitor.proposal_id,
        eventType,
        eventData,
        sectionId,
        timeSpent,
        scrollPercentage
      });

      // Notificar em tempo real para o dashboard
      if (eventType === 'page_view' && eventData.page === 'proposal_main') {
        await TrackingController.notifyProposalOwner(
          { id: visitor.proposal_id, title: visitor.proposal_title, user_id: visitor.proposal_owner_id },
          visitor,
          'proposal_view'
        );
      }

      res.json({ success: true });

    } catch (error) {
      console.error('Erro ao registrar interação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter analytics da proposta
  static async getProposalAnalytics(req, res) {
    try {
      const { proposalId } = req.params;
      const userId = req.user.id;

      // Verificar se o usuário é dono da proposta
      const proposal = await Proposal.findById(proposalId, userId);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposta não encontrada' });
      }

      const analytics = await ProposalTracking.getProposalAnalytics(proposalId);

      res.json(analytics);

    } catch (error) {
      console.error('Erro ao obter analytics:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter visitantes em tempo real
  static async getRealtimeVisitors(req, res) {
    try {
      const { proposalId } = req.params;
      const userId = req.user.id;

      // Verificar se o usuário é dono da proposta
      const proposal = await Proposal.findById(proposalId, userId);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposta não encontrada' });
      }

      const visitors = await ProposalTracking.getRealtimeVisitors(proposalId);

      res.json(visitors);

    } catch (error) {
      console.error('Erro ao obter visitantes em tempo real:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Notificar o dono da proposta
  static async notifyProposalOwner(proposal, visitor, type) {
    try {
      let title, message;

      switch (type) {
        case 'new_visitor':
          title = '🎯 Novo visitante na sua proposta!';
          message = `${visitor.full_name}${visitor.company ? ` da ${visitor.company}` : ''} acessou a proposta "${proposal.title}"`;
          break;
        case 'proposal_view':
          title = '👀 Proposta sendo visualizada!';
          message = `${visitor.full_name}${visitor.company ? ` da ${visitor.company}` : ''} está visualizando a proposta "${proposal.title}"`;
          break;
        default:
          return;
      }

      // Notificação no dashboard
      if (NotificationService.create) {
        await NotificationService.create(proposal.user_id || proposal.proposal_owner_id, {
          type: 'proposal_visitor',
          title,
          message,
          data: {
            proposalId: proposal.id,
            visitorId: visitor.id,
            visitorName: visitor.full_name,
            visitorCompany: visitor.company
          }
        });
      }

      // Email para o criador
      const ownerEmail = proposal.proposal_owner_email || await TrackingController.getOwnerEmail(proposal.user_id || proposal.proposal_owner_id);
      if (ownerEmail) {
        await emailService.sendVisitorNotification(ownerEmail, {
          proposalTitle: proposal.title,
          visitorName: visitor.full_name,
          visitorCompany: visitor.company,
          visitorPosition: visitor.position,
          notificationType: type,
          dashboardUrl: 'https://proposta360.com.br/dashboard'
        });
      }

    } catch (error) {
      console.error('Erro ao notificar dono da proposta:', error);
    }
  }

  // Obter email do dono (helper)
  static async getOwnerEmail(userId) {
    try {
      const db = require('../config/database');
      const result = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
      return result.rows[0]?.email;
    } catch (error) {
      console.error('Erro ao obter email do usuário:', error);
      return null;
    }
  }
}

module.exports = TrackingController;