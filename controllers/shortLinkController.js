const ShortLink = require('../models/ShortLink');

class ShortLinkController {
  // Redirecionar link curto
  static async redirect(req, res) {
    try {
      const { shortCode } = req.params;
      
      const shortLink = await ShortLink.findByShortCode(shortCode);
      
      if (!shortLink) {
        return res.status(404).json({ error: 'Link não encontrado' });
      }

      // Incrementar contador de cliques
      await ShortLink.incrementClicks(shortCode);

      // Redirecionar para a URL original
      res.redirect(shortLink.original_url);

    } catch (error) {
      console.error('Erro ao redirecionar link curto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter ou criar link curto para uma proposta
  static async getShortLink(req, res) {
    try {
      const { proposalId } = req.params;
      const userId = req.user?.id;

      // Verificar se o usuário tem acesso à proposta
      const Proposal = require('../models/Proposal');
      const proposal = await Proposal.findById(proposalId, userId);
      
      if (!proposal) {
        return res.status(404).json({ error: 'Proposta não encontrada' });
      }

      // Obter ou criar link curto
      const shortLink = await ShortLink.getOrCreateShortLink(proposalId, proposal.public_link);

      res.json({
        shortCode: shortLink.short_code,
        shortUrl: `https://proposta360.com.br/p/${shortLink.short_code}`,
        originalUrl: shortLink.original_url,
        clicks: shortLink.clicks,
        createdAt: shortLink.created_at
      });

    } catch (error) {
      console.error('Erro ao obter link curto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter estatísticas do link
  static async getStats(req, res) {
    try {
      const { shortCode } = req.params;
      const userId = req.user?.id;
      
      const shortLink = await ShortLink.findByShortCode(shortCode);
      
      if (!shortLink) {
        return res.status(404).json({ error: 'Link não encontrado' });
      }

      // Verificar se o usuário tem acesso (através da proposta)
      if (shortLink.proposal_id) {
        const Proposal = require('../models/Proposal');
        const proposal = await Proposal.findById(shortLink.proposal_id, userId);
        
        if (!proposal) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }

      res.json({
        shortCode: shortLink.short_code,
        clicks: shortLink.clicks,
        createdAt: shortLink.created_at,
        lastClickedAt: shortLink.last_clicked_at,
        proposalTitle: shortLink.proposal_title || 'Proposta'
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas do link:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = ShortLinkController;