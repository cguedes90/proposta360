const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL;
    this.token = process.env.WHATSAPP_TOKEN;
  }

  async sendMessage(phoneNumber, message) {
    if (!this.apiUrl || !this.token) {
      console.warn('WhatsApp API não configurada');
      return false;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return false;
    }
  }

  async sendProposalViewNotification(phoneNumber, proposalTitle) {
    const message = `🎉 *Boa notícia!*

Sua proposta *"${proposalTitle}"* acaba de ser visualizada!

📊 Isso significa que alguém está interessado no seu trabalho. 

Acesse o dashboard para ver mais detalhes: ${process.env.FRONTEND_URL}/dashboard

_Construtor de Propostas - Notificação automática_`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendProposalApprovalNotification(phoneNumber, proposalTitle) {
    const message = `🎊 *PARABÉNS!*

Sua proposta *"${proposalTitle}"* foi *APROVADA* pelo cliente! ✅

🚀 Próximos passos:
• Entre em contato com o cliente
• Prepare o contrato
• Defina prazos e pagamento

Ver detalhes: ${process.env.FRONTEND_URL}/dashboard

_Construtor de Propostas - Notificação automática_`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendSectionViewNotification(phoneNumber, proposalTitle, sectionTitle) {
    const message = `📖 *Cliente engajado!*

O cliente está lendo sua proposta *"${proposalTitle}"*

📄 Seção visualizada: ${sectionTitle || 'Seção da proposta'}

Continue acompanhando o progresso: ${process.env.FRONTEND_URL}/dashboard

_Construtor de Propostas - Notificação automática_`;

    return await this.sendMessage(phoneNumber, message);
  }
}

module.exports = new WhatsAppService();