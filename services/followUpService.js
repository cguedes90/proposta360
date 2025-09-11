const db = require('../config/database');
const emailService = require('./emailService');

class FollowUpService {
    constructor() {
        this.isProcessing = false;
        this.interval = null;
    }

    // Iniciar processamento automático de follow-ups
    start() {
        if (this.interval) return;
        
        console.log('🔄 Iniciando serviço de follow-up automático...');
        
        // Processar a cada 5 minutos
        this.interval = setInterval(() => {
            this.processScheduledFollowUps();
        }, 5 * 60 * 1000);

        // Processar imediatamente
        this.processScheduledFollowUps();
    }

    // Parar processamento
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('⏹️ Serviço de follow-up parado.');
        }
    }

    // Processar follow-ups agendados
    async processScheduledFollowUps() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            console.log('📋 Processando follow-ups agendados...');
            
            const pendingFollowUps = await db.query(
                `SELECT fs.*, p.title as proposal_title, p.public_link, u.email as user_email, u.name as user_name
                 FROM follow_up_schedule fs
                 INNER JOIN proposals p ON fs.proposal_id = p.id
                 INNER JOIN users u ON p.user_id = u.id
                 WHERE fs.status = 'pending' 
                 AND fs.scheduled_for <= NOW()
                 AND fs.attempts < 3
                 ORDER BY fs.scheduled_for ASC
                 LIMIT 50`
            );

            console.log(`📨 Encontrados ${pendingFollowUps.rows.length} follow-ups para processar`);

            for (const followUp of pendingFollowUps.rows) {
                await this.processFollowUp(followUp);
            }

        } catch (error) {
            console.error('Erro ao processar follow-ups:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    // Processar um follow-up específico
    async processFollowUp(followUp) {
        try {
            console.log(`📤 Processando follow-up ${followUp.follow_up_type} para proposta ${followUp.proposal_title}`);

            // Atualizar tentativas
            await db.query(
                `UPDATE follow_up_schedule 
                 SET attempts = attempts + 1, last_attempt_at = NOW()
                 WHERE id = $1`,
                [followUp.id]
            );

            let success = false;

            switch (followUp.follow_up_type) {
                case 'email':
                    success = await this.sendEmailFollowUp(followUp);
                    break;
                case 'whatsapp':
                    success = await this.sendWhatsAppFollowUp(followUp);
                    break;
                case 'reminder':
                    success = await this.createReminder(followUp);
                    break;
                default:
                    console.warn(`Tipo de follow-up desconhecido: ${followUp.follow_up_type}`);
            }

            // Atualizar status
            const newStatus = success ? 'sent' : 'failed';
            await db.query(
                `UPDATE follow_up_schedule 
                 SET status = $1, updated_at = NOW()
                 WHERE id = $2`,
                [newStatus, followUp.id]
            );

            if (success) {
                console.log(`✅ Follow-up enviado com sucesso: ${followUp.id}`);
            } else {
                console.log(`❌ Falha ao enviar follow-up: ${followUp.id}`);
            }

        } catch (error) {
            console.error(`Erro ao processar follow-up ${followUp.id}:`, error);
            
            await db.query(
                `UPDATE follow_up_schedule 
                 SET status = 'failed', error_message = $1, updated_at = NOW()
                 WHERE id = $2`,
                [error.message, followUp.id]
            );
        }
    }

    // Enviar follow-up por email
    async sendEmailFollowUp(followUp) {
        try {
            const proposalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/proposta-cliente.html?proposal=${followUp.public_link}`;
            
            let subject, htmlContent;

            // Personalizar email baseado no tipo e condições
            const conditions = followUp.trigger_conditions || {};
            
            if (conditions.type === 'no_interaction') {
                subject = `Sua proposta "${followUp.proposal_title}" está aguardando feedback`;
                htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">📋 Lembrete sobre sua proposta</h2>
                        <p>Olá!</p>
                        <p>Notamos que sua proposta <strong>"${followUp.proposal_title}"</strong> foi visualizada, mas ainda não recebemos um feedback.</p>
                        <p>Gostaria de esclarecer alguma dúvida ou precisa de mais informações?</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${proposalUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                📖 Revisar Proposta
                            </a>
                        </p>
                        <p>Estamos à disposição para qualquer esclarecimento.</p>
                        <p>Atenciosamente,<br>${followUp.user_name}</p>
                    </div>
                `;
            } else if (conditions.type === 'engagement_drop') {
                subject = `Que tal revisitar nossa proposta?`;
                htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">🔄 Sua proposta continua disponível</h2>
                        <p>Olá!</p>
                        <p>Vimos que você mostrou interesse em nossa proposta <strong>"${followUp.proposal_title}"</strong>.</p>
                        <p>Caso tenha ficado alguma dúvida ou precise de ajustes, estamos aqui para ajudar!</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${proposalUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                ✨ Ver Proposta Atualizada
                            </a>
                        </p>
                        <p>Podemos agendar uma conversa para alinhar melhor suas necessidades?</p>
                        <p>Atenciosamente,<br>${followUp.user_name}</p>
                    </div>
                `;
            } else {
                // Follow-up personalizado
                subject = `Acompanhamento: ${followUp.proposal_title}`;
                htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">📧 Acompanhamento da proposta</h2>
                        <p>${followUp.message || 'Gostaríamos de saber sua opinião sobre nossa proposta.'}</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${proposalUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                📖 Acessar Proposta
                            </a>
                        </p>
                        <p>Atenciosamente,<br>${followUp.user_name}</p>
                    </div>
                `;
            }

            // Aqui você integraria com seu serviço de email real
            console.log(`📧 Enviando email para ${followUp.user_email}: ${subject}`);
            
            // Simular envio (substituir por integração real)
            return true;
            
        } catch (error) {
            console.error('Erro ao enviar email follow-up:', error);
            return false;
        }
    }

    // Enviar follow-up via WhatsApp
    async sendWhatsAppFollowUp(followUp) {
        try {
            const proposalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/proposta-cliente.html?proposal=${followUp.public_link}`;
            
            const message = followUp.message || 
                `Olá! Gostaria de saber se teve a oportunidade de revisar nossa proposta "${followUp.proposal_title}". 
                
Link: ${proposalUrl}

Estou à disposição para esclarecer qualquer dúvida! 😊`;

            // Aqui você integraria com API do WhatsApp Business
            console.log(`📱 Enviando WhatsApp: ${message}`);
            
            // Simular envio (substituir por integração real)
            return true;
            
        } catch (error) {
            console.error('Erro ao enviar WhatsApp follow-up:', error);
            return false;
        }
    }

    // Criar lembrete interno
    async createReminder(followUp) {
        try {
            // Criar notificação no sistema
            await db.query(
                `INSERT INTO notifications (user_id, type, title, message, data, created_at)
                 SELECT p.user_id, 'follow_up_reminder', $1, $2, $3, NOW()
                 FROM proposals p WHERE p.id = $4`,
                [
                    `Lembrete: ${followUp.proposal_title}`,
                    followUp.message || 'Lembrete sobre follow-up da proposta',
                    JSON.stringify({ 
                        proposalId: followUp.proposal_id,
                        followUpId: followUp.id 
                    }),
                    followUp.proposal_id
                ]
            );

            return true;
            
        } catch (error) {
            console.error('Erro ao criar lembrete:', error);
            return false;
        }
    }

    // Agendar follow-up automático baseado em condições
    async scheduleAutoFollowUp(proposalId, conditions) {
        try {
            let followUpType, scheduledFor, message;

            switch (conditions.trigger) {
                case 'no_interaction_24h':
                    followUpType = 'email';
                    scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
                    message = 'Follow-up automático: sem interação em 24h';
                    break;
                    
                case 'viewed_but_no_action_3d':
                    followUpType = 'email';
                    scheduledFor = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias
                    message = 'Follow-up automático: visualizado mas sem ação';
                    break;
                    
                case 'high_engagement_no_conversion':
                    followUpType = 'whatsapp';
                    scheduledFor = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
                    message = 'Follow-up automático: alto engajamento sem conversão';
                    break;
                    
                default:
                    return false;
            }

            await db.query(
                `INSERT INTO follow_up_schedule 
                 (proposal_id, follow_up_type, scheduled_for, message, trigger_conditions, status)
                 VALUES ($1, $2, $3, $4, $5, 'pending')`,
                [proposalId, followUpType, scheduledFor, message, JSON.stringify(conditions)]
            );

            console.log(`📅 Follow-up automático agendado: ${followUpType} em ${scheduledFor}`);
            return true;
            
        } catch (error) {
            console.error('Erro ao agendar follow-up automático:', error);
            return false;
        }
    }

    // Cancelar follow-ups pendentes
    async cancelFollowUps(proposalId, type = null) {
        try {
            let query = `UPDATE follow_up_schedule SET status = 'cancelled' WHERE proposal_id = $1 AND status = 'pending'`;
            const params = [proposalId];
            
            if (type) {
                query += ` AND follow_up_type = $2`;
                params.push(type);
            }
            
            const result = await db.query(query, params);
            console.log(`🚫 ${result.rowCount} follow-ups cancelados para proposta ${proposalId}`);
            
            return result.rowCount;
            
        } catch (error) {
            console.error('Erro ao cancelar follow-ups:', error);
            return 0;
        }
    }

    // Obter estatísticas de follow-up
    async getFollowUpStats(userId, period = 30) {
        try {
            const stats = await db.query(
                `SELECT 
                   fs.follow_up_type,
                   fs.status,
                   COUNT(*) as count,
                   AVG(fs.attempts) as avg_attempts
                 FROM follow_up_schedule fs
                 INNER JOIN proposals p ON fs.proposal_id = p.id
                 WHERE p.user_id = $1 
                 AND fs.created_at >= NOW() - INTERVAL '${period} days'
                 GROUP BY fs.follow_up_type, fs.status
                 ORDER BY count DESC`,
                [userId]
            );

            return stats.rows;
            
        } catch (error) {
            console.error('Erro ao obter estatísticas de follow-up:', error);
            return [];
        }
    }
}

module.exports = new FollowUpService();