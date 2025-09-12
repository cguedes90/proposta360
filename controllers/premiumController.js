const PremiumTemplate = require('../models/PremiumTemplate');

class PremiumController {
  
  // Adicionar template ao carrinho
  static async addToCart(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.id;

      const result = await PremiumTemplate.addToCart(userId, templateId);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  // Remover template do carrinho
  static async removeFromCart(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.id;

      const result = await PremiumTemplate.removeFromCart(userId, templateId);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  // Obter carrinho do usuário
  static async getCart(req, res) {
    try {
      const userId = req.user.id;
      const cart = await PremiumTemplate.getCart(userId);
      
      res.status(200).json({
        success: true,
        cart
      });
    } catch (error) {
      console.error('Erro ao obter carrinho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Aplicar cupom de desconto
  static async applyCoupon(req, res) {
    try {
      const { couponCode } = req.body;
      const userId = req.user.id;

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          message: 'Código do cupom é obrigatório'
        });
      }

      const result = await PremiumTemplate.applyCoupon(userId, couponCode.toUpperCase());
      
      res.status(200).json({
        success: true,
        coupon: result
      });
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Cupom inválido'
      });
    }
  }

  // Processar pagamento
  static async processPurchase(req, res) {
    try {
      const userId = req.user.id;
      const { paymentMethod, paymentId, couponCode } = req.body;

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Método de pagamento é obrigatório'
        });
      }

      const result = await PremiumTemplate.processPurchase(userId, {
        paymentMethod,
        paymentId: paymentId || `payment_${Date.now()}`,
        couponCode
      });
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao processar compra:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao processar pagamento'
      });
    }
  }

  // Obter templates comprados
  static async getPurchased(req, res) {
    try {
      const userId = req.user.id;
      const templates = await PremiumTemplate.getPurchased(userId);
      
      res.status(200).json({
        success: true,
        templates
      });
    } catch (error) {
      console.error('Erro ao obter templates comprados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar acesso a template
  static async checkAccess(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.id;

      const hasAccess = await PremiumTemplate.hasAccess(userId, templateId);
      
      res.status(200).json({
        success: true,
        hasAccess
      });
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Estatísticas de vendas (admin)
  static async getSalesStats(req, res) {
    try {
      // Verificar se é admin
      if (!req.user.is_admin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const stats = await PremiumTemplate.getSalesStats();
      
      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Simular pagamento PIX (para desenvolvimento)
  static async simulatePixPayment(req, res) {
    try {
      const userId = req.user.id;
      const cart = await PremiumTemplate.getCart(userId);
      
      if (cart.count === 0) {
        return res.status(400).json({
          success: false,
          message: 'Carrinho vazio'
        });
      }

      // Simular dados do PIX
      const pixData = {
        pixCode: `00020126580014br.gov.bcb.pix013625${Math.random().toString(36).substr(2, 9)}5204000053039865802BR5925PROPOSTA360 MARKETPLACE6009SAO PAULO62070503***6304${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        amount: parseFloat(cart.total),
        expiresIn: 600, // 10 minutos
        paymentId: `pix_${Date.now()}`
      };

      res.status(200).json({
        success: true,
        pixData,
        message: 'Código PIX gerado. Escaneie para pagar.'
      });
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Confirmar pagamento PIX (webhook simulado)
  static async confirmPixPayment(req, res) {
    try {
      const { paymentId } = req.body;
      const userId = req.user.id;

      // Simular confirmação do pagamento
      const result = await PremiumTemplate.processPurchase(userId, {
        paymentMethod: 'pix',
        paymentId: paymentId
      });

      res.status(200).json({
        success: true,
        message: 'Pagamento confirmado!',
        purchase: result
      });
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao confirmar pagamento'
      });
    }
  }
}

module.exports = PremiumController;