const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'contato@inovamentelabs.com.br',
        pass: 'RhK9YTxG8wue'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verificar conexão
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Serviço de email conectado com sucesso (Zoho Mail)');
    } catch (error) {
      console.error('❌ Erro ao conectar com serviço de email:', error);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: '"PropostasWin" <contato@inovamentelabs.com.br>',
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }

  // Email de boas-vindas
  async sendWelcomeEmail(user) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao PropostasWin!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .welcome-title { font-size: 24px; color: #1e293b; margin-bottom: 20px; }
            .text { color: #64748b; line-height: 1.6; margin-bottom: 20px; }
            .features { background: #f8fafc; padding: 30px; border-radius: 12px; margin: 30px 0; }
            .feature { display: flex; align-items: center; margin-bottom: 15px; }
            .feature-icon { background: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; }
            .cta-button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #1e293b; color: #94a3b8; padding: 30px; text-align: center; font-size: 14px; }
            .plan-badge { background: ${user.plan === 'premium' ? '#16a34a' : '#64748b'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚀 PropostasWin</div>
                <div>Propostas que Facilitam a Decisão de Compra</div>
            </div>
            
            <div class="content">
                <h1 class="welcome-title">Bem-vindo, ${user.name}!</h1>
                
                <p class="text">
                    É um prazer tê-lo conosco! Sua conta foi criada com sucesso e você já pode começar a criar propostas profissionais que convertem.
                </p>
                
                <div style="text-align: center; margin: 20px 0;">
                    <span class="plan-badge">Plano ${user.plan === 'premium' ? 'Premium' : 'Free'}</span>
                </div>
                
                <div class="features">
                    <h3 style="color: #1e293b; margin-bottom: 20px;">O que você pode fazer agora:</h3>
                    
                    <div class="feature">
                        <div class="feature-icon">✓</div>
                        <div>
                            <strong>Criar propostas interativas</strong><br>
                            <small style="color: #64748b;">Use nosso editor visual para criar propostas profissionais</small>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">📊</div>
                        <div>
                            <strong>Acompanhar engajamento</strong><br>
                            <small style="color: #64748b;">Veja quando e como seus clientes interagem com as propostas</small>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">🔔</div>
                        <div>
                            <strong>Receber notificações</strong><br>
                            <small style="color: #64748b;">Seja alertado sobre visualizações, aprovações e feedback</small>
                        </div>
                    </div>
                    
                    ${user.plan === 'free' ? `
                    <div class="feature">
                        <div class="feature-icon">⚡</div>
                        <div>
                            <strong>Limite do plano Free</strong><br>
                            <small style="color: #64748b;">Você pode criar até 1 proposta por mês</small>
                        </div>
                    </div>
                    ` : `
                    <div class="feature">
                        <div class="feature-icon">🎯</div>
                        <div>
                            <strong>Plano Premium Ativo</strong><br>
                            <small style="color: #64748b;">Crie até 70 propostas por mês + recursos avançados</small>
                        </div>
                    </div>
                    `}
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/dashboard" class="cta-button">
                        Começar a Criar Propostas
                    </a>
                </div>
                
                <p class="text">
                    Se você tiver alguma dúvida, não hesite em entrar em contato conosco. Estamos aqui para ajudar você a ter sucesso!
                </p>
                
                <p class="text" style="margin-top: 30px;">
                    <strong>Dicas para começar:</strong><br>
                    1. Explore os templates disponíveis<br>
                    2. Adicione sua marca e informações<br>
                    3. Teste com um cliente piloto<br>
                    4. Acompanhe as métricas de engajamento
                </p>
            </div>
            
            <div class="footer">
                <div>PropostasWin - Propostas que facilitam a decisão de compra</div>
                <div style="margin-top: 10px;">
                    <a href="mailto:contato@inovamentelabs.com.br" style="color: #94a3b8;">contato@inovamentelabs.com.br</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: '🎉 Bem-vindo ao PropostasWin - Sua conta foi criada!',
      html
    });
  }

  // Email de reset de senha
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password?token=${resetToken}`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset de Senha - PropostasWin</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #1e293b; color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .title { font-size: 24px; color: #1e293b; margin-bottom: 20px; }
            .text { color: #64748b; line-height: 1.6; margin-bottom: 20px; }
            .reset-button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #1e293b; color: #94a3b8; padding: 30px; text-align: center; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 PropostasWin</div>
                <div>Solicitação de Reset de Senha</div>
            </div>
            
            <div class="content">
                <h1 class="title">Reset de Senha Solicitado</h1>
                
                <p class="text">
                    Olá, ${user.name}!
                </p>
                
                <p class="text">
                    Recebemos uma solicitação para redefinir a senha da sua conta no PropostasWin. 
                    Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha.
                </p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">
                        Redefinir Minha Senha
                    </a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Atenção:</strong><br>
                    • Este link expira em 1 hora por segurança<br>
                    • Se você não solicitou este reset, ignore este email<br>
                    • Nunca compartilhe este link com outras pessoas
                </div>
                
                <p class="text">
                    Caso o botão não funcione, você pode copiar e colar o link abaixo no seu navegador:
                </p>
                
                <p style="word-break: break-all; background: #f8fafc; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px;">
                    ${resetUrl}
                </p>
                
                <p class="text">
                    Se você não solicitou esta alteração ou tem alguma dúvida sobre a segurança da sua conta, 
                    entre em contato conosco imediatamente.
                </p>
            </div>
            
            <div class="footer">
                <div>PropostasWin - Propostas que facilitam a decisão de compra</div>
                <div style="margin-top: 10px;">
                    <a href="mailto:contato@inovamentelabs.com.br" style="color: #94a3b8;">contato@inovamentelabs.com.br</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: '🔐 Reset de Senha - PropostasWin',
      html
    });
  }

  // Email de notificação de proposta
  async sendProposalNotificationEmail(user, proposal, notification) {
    const proposalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/proposta/${proposal.publicLink}`;
    
    let notificationTitle = '';
    let notificationIcon = '';
    let notificationColor = '#2563eb';
    
    switch (notification.type) {
      case 'proposal_viewed':
        notificationTitle = 'Proposta Visualizada';
        notificationIcon = '👀';
        notificationColor = '#2563eb';
        break;
      case 'proposal_approved':
        notificationTitle = 'Proposta Aprovada';
        notificationIcon = '✅';
        notificationColor = '#16a34a';
        break;
      case 'proposal_rejected':
        notificationTitle = 'Proposta Rejeitada';
        notificationIcon = '❌';
        notificationColor = '#dc2626';
        break;
      case 'proposal_feedback':
        notificationTitle = 'Feedback Recebido';
        notificationIcon = '💬';
        notificationColor = '#f59e0b';
        break;
      case 'proposal_downloaded':
        notificationTitle = 'Proposta Baixada';
        notificationIcon = '📥';
        notificationColor = '#8b5cf6';
        break;
      default:
        notificationTitle = 'Nova Atividade';
        notificationIcon = '🔔';
        notificationColor = '#2563eb';
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notificationTitle} - PropostasWin</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: ${notificationColor}; color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .notification-title { font-size: 24px; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
            .text { color: #64748b; line-height: 1.6; margin-bottom: 20px; }
            .proposal-info { background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${notificationColor}; }
            .view-button { display: inline-block; background: ${notificationColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #1e293b; color: #94a3b8; padding: 30px; text-align: center; font-size: 14px; }
            .timestamp { color: #94a3b8; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚀 PropostasWin</div>
                <div>Notificação de Proposta</div>
            </div>
            
            <div class="content">
                <h1 class="notification-title">
                    <span>${notificationIcon}</span>
                    ${notificationTitle}
                </h1>
                
                <p class="text">
                    Olá, ${user.name}!
                </p>
                
                <p class="text">
                    ${notification.message}
                </p>
                
                <div class="proposal-info">
                    <h3 style="color: #1e293b; margin: 0 0 10px 0;">📋 ${proposal.title}</h3>
                    <p style="color: #64748b; margin: 0 0 5px 0;">Cliente: ${proposal.clientName || 'Não informado'}</p>
                    <p class="timestamp">Data: ${new Date().toLocaleString('pt-BR')}</p>
                    
                    ${notification.data ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        <strong>Detalhes adicionais:</strong><br>
                        ${JSON.stringify(notification.data, null, 2).replace(/[{}",]/g, '').replace(/\n/g, '<br>')}
                    </div>
                    ` : ''}
                </div>
                
                <div style="text-align: center;">
                    <a href="${proposalUrl}" class="view-button">
                        Ver Proposta Completa
                    </a>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/dashboard" style="color: ${notificationColor}; text-decoration: none;">
                        Acessar Dashboard
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <div>PropostasWin - Propostas que facilitam a decisão de compra</div>
                <div style="margin-top: 10px;">
                    <a href="mailto:contato@inovamentelabs.com.br" style="color: #94a3b8;">contato@inovamentelabs.com.br</a>
                </div>
                <div style="margin-top: 15px; font-size: 12px;">
                    Para parar de receber estas notificações, 
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/dashboard#configuracoes" style="color: #94a3b8;">
                        clique aqui
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: `${notificationIcon} ${notificationTitle} - ${proposal.title}`,
      html
    });
  }

  // Métodos de compatibilidade com código existente
  async sendProposalViewNotification(userEmail, proposalTitle, publicLink) {
    return await this.sendEmail({
      to: userEmail,
      subject: `📧 Sua proposta "${proposalTitle}" foi visualizada!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Boa notícia!</h2>
          <p>Sua proposta <strong>"${proposalTitle}"</strong> acaba de ser visualizada!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">O que isso significa?</h3>
            <ul style="color: #6b7280;">
              <li>Alguém acessou o link da sua proposta</li>
              <li>O cliente está interessado no seu trabalho</li>
              <li>É uma oportunidade para acompanhar o progresso</li>
            </ul>
          </div>
          
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Analytics da Proposta
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">
            PropostasWin - Sistema automatizado
          </p>
        </div>
      `
    });
  }

  async sendProposalApprovalNotification(userEmail, proposalTitle, publicLink) {
    return await this.sendEmail({
      to: userEmail,
      subject: `🎊 Proposta "${proposalTitle}" foi APROVADA!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">🎊 PARABÉNS!</h2>
          <p>Sua proposta <strong>"${proposalTitle}"</strong> foi <strong style="color: #16a34a;">APROVADA</strong> pelo cliente!</p>
          
          <div style="background: #f0f9f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #16a34a; margin-top: 0;">✅ Próximos passos:</h3>
            <ul style="color: #374151;">
              <li>Entre em contato com o cliente para finalizar os detalhes</li>
              <li>Prepare o contrato ou acordo de trabalho</li>
              <li>Defina prazos e formas de pagamento</li>
            </ul>
          </div>
          
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/dashboard" 
               style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Detalhes da Aprovação
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">
            PropostasWin - Sistema automatizado
          </p>
        </div>
      `
    });
  }

  async sendSectionViewNotification(userEmail, proposalTitle, sectionTitle) {
    return await this.sendEmail({
      to: userEmail,
      subject: `📖 Cliente está lendo sua proposta "${proposalTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📖 Cliente engajado!</h2>
          <p>O cliente está lendo atentamente sua proposta <strong>"${proposalTitle}"</strong>.</p>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;">
              <strong>Seção visualizada:</strong> ${sectionTitle || 'Seção da proposta'}
            </p>
          </div>
          
          <p style="color: #6b7280;">
            Isso demonstra interesse genuíno. Continue acompanhando o progresso!
          </p>
          
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acompanhar Progresso
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">
            PropostasWin - Sistema automatizado
          </p>
        </div>
      `
    });
  }

  // Utilitário para converter HTML em texto simples
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}

module.exports = new EmailService();