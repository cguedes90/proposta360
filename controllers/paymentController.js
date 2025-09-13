const MercadoPagoService = require('../services/mercadoPagoService');
const PremiumTemplate = require('../models/PremiumTemplate');
const db = require('../config/database');

class PaymentController {
  constructor() {
    this.mercadoPago = new MercadoPagoService();
  }

  // Criar preferência de pagamento
  async createPreference(req, res) {
    try {
      const userId = req.user.id;
      const { payer_info } = req.body;

      // Verificar se Mercado Pago está configurado
      if (!this.mercadoPago.isConfigured()) {
        return res.status(500).json({
          success: false,
          message: 'Sistema de pagamento não configurado. Entre em contato com o suporte.'
        });
      }

      // Obter carrinho do usuário
      const cart = await PremiumTemplate.getCart(userId);
      
      if (cart.count === 0) {
        return res.status(400).json({
          success: false,
          message: 'Carrinho vazio'
        });
      }

      // Gerar ID do pedido
      const orderId = `order_${Date.now()}_${userId}`;

      // Preparar dados para Mercado Pago
      const orderData = {
        items: cart.items.map(item => ({
          template_id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price
        })),
        payer: {
          name: payer_info.name || req.user.name || 'Cliente',
          surname: payer_info.surname || '',
          email: payer_info.email || req.user.email,
          phone: payer_info.phone || '',
          area_code: payer_info.area_code || '11'
        },
        metadata: {
          user_id: userId,
          order_id: orderId,
          template_ids: cart.items.map(item => item.id)
        }
      };

      // Criar preferência no Mercado Pago
      const preference = await this.mercadoPago.createPreference(orderData);

      if (!preference.success) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar pagamento: ' + preference.error
        });
      }

      // Salvar pedido no banco temporariamente
      await db.query(`
        INSERT INTO payment_orders (
          id, user_id, preference_id, items, total_amount, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        ON CONFLICT (id) DO UPDATE SET
          preference_id = $3,
          items = $4,
          total_amount = $5,
          updated_at = NOW()
      `, [
        orderId,
        userId,
        preference.preference_id,
        JSON.stringify(cart.items),
        parseFloat(cart.total)
      ]);

      res.json({
        success: true,
        order_id: orderId,
        preference_id: preference.preference_id,
        init_point: this.mercadoPago.getMode() === 'sandbox' 
          ? preference.sandbox_init_point 
          : preference.init_point,
        mode: this.mercadoPago.getMode()
      });

    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar pagamento PIX direto
  async createPixPayment(req, res) {
    try {
      const userId = req.user.id;
      const { payer_info } = req.body;

      if (!this.mercadoPago.isConfigured()) {
        return res.status(500).json({
          success: false,
          message: 'Sistema de pagamento não configurado'
        });
      }

      const cart = await PremiumTemplate.getCart(userId);
      
      if (cart.count === 0) {
        return res.status(400).json({
          success: false,
          message: 'Carrinho vazio'
        });
      }

      const orderId = `pix_${Date.now()}_${userId}`;

      const paymentData = {
        amount: cart.total,
        description: `Templates Premium - ${cart.count} item(s)`,
        payer: {
          name: payer_info.name || req.user.name || 'Cliente',
          surname: payer_info.surname || '',
          email: payer_info.email || req.user.email,
          document_type: 'CPF',
          document_number: payer_info.document || '12345678909'
        },
        metadata: {
          user_id: userId,
          order_id: orderId,
          template_ids: cart.items.map(item => item.id)
        }
      };

      const payment = await this.mercadoPago.createPixPayment(paymentData);

      if (!payment.success) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar PIX: ' + payment.error
        });
      }

      // Salvar pagamento PIX no banco
      await db.query(`
        INSERT INTO payment_orders (
          id, user_id, payment_id, items, total_amount, payment_method, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'pix', 'pending', NOW())
        ON CONFLICT (id) DO UPDATE SET
          payment_id = $3,
          items = $4,
          total_amount = $5,
          updated_at = NOW()
      `, [
        orderId,
        userId,
        payment.payment_id,
        JSON.stringify(cart.items),
        parseFloat(cart.total)
      ]);

      res.json({
        success: true,
        order_id: orderId,
        payment_id: payment.payment_id,
        qr_code: payment.qr_code,
        qr_code_base64: payment.qr_code_base64,
        ticket_url: payment.ticket_url,
        status: payment.status
      });

    } catch (error) {
      console.error('Erro ao criar PIX:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Webhook do Mercado Pago
  async webhook(req, res) {
    try {
      console.log('📨 Webhook recebido:', req.body);

      const webhookResult = await this.mercadoPago.processWebhook(req.body);

      if (!webhookResult.success) {
        console.error('Erro ao processar webhook:', webhookResult.error);
        return res.status(400).json({ error: webhookResult.error });
      }

      // Se pagamento foi aprovado, processar liberação
      if (webhookResult.should_process) {
        await this.processApprovedPayment(webhookResult.payment);
      }

      res.status(200).json({ success: true });

    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).json({ error: 'Erro interno' });
    }
  }

  // Processar pagamento aprovado
  async processApprovedPayment(paymentInfo) {
    try {
      const externalRef = paymentInfo.external_reference;
      const paymentId = paymentInfo.id;

      console.log(`✅ Processando pagamento aprovado: ${paymentId}`);

      // Buscar pedido no banco
      const orderResult = await db.query(`
        SELECT * FROM payment_orders 
        WHERE id = $1 OR payment_id = $2::text
      `, [externalRef, paymentId]);

      if (orderResult.rows.length === 0) {
        throw new Error('Pedido não encontrado');
      }

      const order = orderResult.rows[0];
      const items = JSON.parse(order.items);

      // Iniciar transação
      await db.query('BEGIN');

      // Criar registros de compra para cada template
      for (const item of items) {
        await db.query(`
          INSERT INTO template_purchases (
            user_id, template_id, purchase_amount, payment_method, 
            payment_status, payment_id, purchased_at
          )
          VALUES ($1, $2, $3, 'mercado_pago', 'completed', $4, NOW())
          ON CONFLICT (user_id, template_id) DO UPDATE SET
            payment_status = 'completed',
            payment_id = $4,
            purchased_at = NOW()
        `, [order.user_id, item.id, item.price, paymentId]);
      }

      // Atualizar status do pedido
      await db.query(`
        UPDATE payment_orders 
        SET status = 'completed', payment_id = $1, completed_at = NOW()
        WHERE id = $2
      `, [paymentId, order.id]);

      // Limpar carrinho do usuário
      await db.query('DELETE FROM shopping_cart WHERE user_id = $1', [order.user_id]);

      await db.query('COMMIT');

      console.log(`🎉 Pagamento processado com sucesso para usuário ${order.user_id}`);

      // Aqui você pode adicionar envio de email, notificações, etc.

    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Erro ao processar pagamento aprovado:', error);
      throw error;
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(req, res) {
    try {
      const { payment_id } = req.params;
      
      const payment = await this.mercadoPago.getPaymentStatus(payment_id);
      
      if (!payment.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao verificar pagamento'
        });
      }

      res.json({
        success: true,
        payment: payment.payment
      });

    } catch (error) {
      console.error('Erro ao verificar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = PaymentController;