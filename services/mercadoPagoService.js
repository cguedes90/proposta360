const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

class MercadoPagoService {
  constructor() {
    // Configurar com as credenciais (será configurado via ENV)
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc'
      }
    });
    
    this.payment = new Payment(this.client);
    this.preference = new Preference(this.client);
  }

  // Criar preferência de pagamento (para checkout)
  async createPreference(orderData) {
    try {
      const { items, payer, metadata } = orderData;

      const preferenceData = {
        items: items.map(item => ({
          id: item.template_id,
          title: item.name,
          description: item.description,
          category_id: item.category,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(item.price)
        })),
        payer: {
          name: payer.name,
          surname: payer.surname || '',
          email: payer.email,
          phone: {
            area_code: payer.area_code || '11',
            number: payer.phone || '999999999'
          }
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/marketplace?payment=success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/marketplace?payment=failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/marketplace?payment=pending`
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        },
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/payments/webhook`,
        external_reference: metadata.order_id,
        metadata: {
          user_id: metadata.user_id,
          order_id: metadata.order_id,
          templates: metadata.template_ids
        }
      };

      const preference = await this.preference.create({ body: preferenceData });
      
      return {
        success: true,
        preference_id: preference.id,
        init_point: preference.init_point, // URL para redirecionar o usuário
        sandbox_init_point: preference.sandbox_init_point // URL para testes
      };

    } catch (error) {
      console.error('Erro ao criar preferência Mercado Pago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar pagamento PIX direto
  async createPixPayment(paymentData) {
    try {
      const { amount, description, payer, metadata } = paymentData;

      const payment = await this.payment.create({
        body: {
          transaction_amount: parseFloat(amount),
          description: description,
          payment_method_id: 'pix',
          payer: {
            email: payer.email,
            first_name: payer.name,
            last_name: payer.surname || '',
            identification: {
              type: payer.document_type || 'CPF',
              number: payer.document_number || '12345678909'
            }
          },
          external_reference: metadata.order_id,
          metadata: {
            user_id: metadata.user_id,
            order_id: metadata.order_id,
            templates: metadata.template_ids
          }
        }
      });

      return {
        success: true,
        payment_id: payment.id,
        status: payment.status,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url
      };

    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar status do pagamento
  async getPaymentStatus(paymentId) {
    try {
      const payment = await this.payment.get({ id: paymentId });
      
      return {
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          transaction_amount: payment.transaction_amount,
          currency_id: payment.currency_id,
          date_created: payment.date_created,
          date_approved: payment.date_approved,
          external_reference: payment.external_reference,
          metadata: payment.metadata
        }
      };

    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar webhook do Mercado Pago
  async processWebhook(webhookData) {
    try {
      const { action, api_version, data, date_created, id, live_mode, type, user_id } = webhookData;

      // Só processar notificações de pagamento
      if (type !== 'payment') {
        return { success: true, message: 'Tipo de notificação ignorado' };
      }

      const paymentId = data.id;
      const paymentInfo = await this.getPaymentStatus(paymentId);

      if (!paymentInfo.success) {
        throw new Error('Erro ao obter informações do pagamento');
      }

      return {
        success: true,
        payment: paymentInfo.payment,
        should_process: paymentInfo.payment.status === 'approved'
      };

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar configuração
  isConfigured() {
    return !!process.env.MERCADO_PAGO_ACCESS_TOKEN;
  }

  // Obter modo (sandbox ou produção)
  getMode() {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    return token.includes('TEST') ? 'sandbox' : 'production';
  }
}

module.exports = MercadoPagoService;