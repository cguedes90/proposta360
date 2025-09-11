const { validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const emailService = require('../services/emailService');

const createContactLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, company, subject, message } = req.body;

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      subject,
      message,
      source: 'contact_form'
    });

    // Enviar notificação por email para o admin (opcional)
    try {
      await emailService.sendEmail({
        to: 'contato@inovamentelabs.com.br',
        subject: `📢 Novo lead capturado: ${name}`,
        html: `
          <h2>Novo Lead do Formulário de Contato</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
          <p><strong>Empresa:</strong> ${company || 'Não informado'}</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${message}</p>
          <hr>
          <p><small>Proposta360 - Sistema de Captura de Leads</small></p>
        `
      });
    } catch (emailError) {
      console.error('❌ Erro ao enviar notificação de lead:', emailError);
    }

    res.status(201).json({
      message: 'Obrigado pelo contato! Retornaremos em breve.',
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email
      }
    });
  } catch (error) {
    console.error('Erro ao criar lead de contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const createRegistrationLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      whatsapp,
      company,
      cnpj,
      cpf,
      address,
      city,
      state,
      cep,
      plan_interest
    } = req.body;

    const lead = await Lead.createRegistrationLead({
      name,
      email,
      phone,
      whatsapp,
      company,
      cnpj,
      cpf,
      address,
      city,
      state,
      cep,
      plan_interest
    });

    // Enviar email de agradecimento para o lead (não crítico - não deve falhar o cadastro)
    try {
      await emailService.sendEmail({
        to: email,
        subject: '🎉 Pré-cadastro realizado com sucesso - Proposta360',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <style>
                  body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
                  .content { padding: 30px; }
                  .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
              </style>
          </head>
          <body>
              <div class="header">
                  <h1>🚀 Proposta360</h1>
                  <p>Pré-cadastro Realizado com Sucesso!</p>
              </div>
              
              <div class="content">
                  <h2>Olá, ${name}!</h2>
                  
                  <p>Obrigado pelo seu interesse no Proposta360! Recebemos seu pré-cadastro com sucesso.</p>
                  
                  <p><strong>Seus dados:</strong></p>
                  <ul>
                      <li>Nome: ${name}</li>
                      <li>Email: ${email}</li>
                      <li>Empresa: ${company || 'Não informado'}</li>
                      <li>Plano de interesse: ${plan_interest === 'premium' ? 'Premium' : 'Free'}</li>
                  </ul>
                  
                  <p>Em breve nossa equipe entrará em contato para finalizar seu cadastro e apresentar todas as funcionalidades da plataforma.</p>
                  
                  <p>Enquanto isso, fique atento ao seu email para mais informações!</p>
              </div>
              
              <div class="footer">
                  <p>Proposta360 - Propostas que facilitam a decisão de compra</p>
                  <p>contato@inovamentelabs.com.br</p>
                  <p><a href="https://www.inovamentelabs.com.br" style="color: #666; text-decoration: none;">Desenvolvido por InovaMente Labs</a></p>
              </div>
          </body>
          </html>
        `
      });
      console.log('📧 Email de agradecimento enviado para:', email);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de agradecimento (não crítico):', emailError.message);
    }

    // Notificar admin sobre novo pré-cadastro (não crítico - não deve falhar o cadastro)
    try {
      await emailService.sendEmail({
        to: 'contato@inovamentelabs.com.br',
        subject: `🎯 Novo pré-cadastro: ${name} (${company || 'Sem empresa'})`,
        html: `
          <h2>Novo Pré-Cadastro Recebido</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
          <p><strong>WhatsApp:</strong> ${whatsapp || 'Não informado'}</p>
          <p><strong>Empresa:</strong> ${company || 'Não informado'}</p>
          <p><strong>CNPJ:</strong> ${cnpj || 'Não informado'}</p>
          <p><strong>CPF:</strong> ${cpf || 'Não informado'}</p>
          <p><strong>Endereço:</strong> ${address || 'Não informado'}</p>
          <p><strong>Cidade/Estado:</strong> ${city || 'Não informado'} - ${state || 'Não informado'}</p>
          <p><strong>CEP:</strong> ${cep || 'Não informado'}</p>
          <p><strong>Plano de interesse:</strong> ${plan_interest === 'premium' ? 'Premium' : 'Free'}</p>
          <hr>
          <p><small>Proposta360 - Sistema de Pré-Cadastro</small></p>
        `
      });
      console.log('📧 Email de notificação admin enviado');
    } catch (emailError) {
      console.error('❌ Erro ao enviar notificação de pré-cadastro (não crítico):', emailError.message);
    }

    res.status(201).json({
      message: 'Pré-cadastro realizado com sucesso! Em breve entraremos em contato.',
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        plan_interest: lead.plan_interest
      }
    });
  } catch (error) {
    console.error('Erro ao criar lead de pré-cadastro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  createContactLead,
  createRegistrationLead
};