const db = require('../config/database');

class RealTimeNotificationService {
    constructor() {
        this.connections = new Map(); // userId -> Set of connections
    }

    // Adicionar conexão de um usuário
    addConnection(userId, connection) {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set());
        }
        
        this.connections.get(userId).add(connection);
        
        console.log(`📡 Usuário ${userId} conectado para notificações em tempo real. Total conexões: ${this.connections.get(userId).size}`);
        
        // Configurar eventos de fechamento
        connection.on('close', () => {
            this.removeConnection(userId, connection);
        });
        
        connection.on('error', (error) => {
            console.error(`Erro na conexão SSE do usuário ${userId}:`, error);
            this.removeConnection(userId, connection);
        });

        // Enviar mensagem de boas-vindas
        this.sendToConnection(connection, {
            type: 'connected',
            message: 'Conectado às notificações em tempo real',
            timestamp: new Date().toISOString()
        });

        // Enviar notificações não lidas
        this.sendUnreadNotifications(userId, connection);
    }

    // Remover conexão de um usuário
    removeConnection(userId, connection) {
        if (this.connections.has(userId)) {
            this.connections.get(userId).delete(connection);
            
            if (this.connections.get(userId).size === 0) {
                this.connections.delete(userId);
            }
            
            console.log(`📡 Usuário ${userId} desconectado. Conexões restantes: ${this.connections.get(userId)?.size || 0}`);
        }
    }

    // Enviar notificação para um usuário específico
    async notifyUser(userId, notification) {
        try {
            // Salvar no banco
            const result = await db.query(
                `INSERT INTO notifications (user_id, type, title, message, data, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 RETURNING *`,
                [userId, notification.type, notification.title, notification.message, JSON.stringify(notification.data || {})]
            );

            const savedNotification = result.rows[0];
            
            // Enviar para conexões ativas
            if (this.connections.has(userId)) {
                const connections = this.connections.get(userId);
                
                for (const connection of connections) {
                    this.sendToConnection(connection, {
                        type: 'notification',
                        notification: {
                            id: savedNotification.id,
                            type: savedNotification.type,
                            title: savedNotification.title,
                            message: savedNotification.message,
                            data: savedNotification.data,
                            created_at: savedNotification.created_at,
                            read_at: savedNotification.read_at
                        },
                        timestamp: new Date().toISOString()
                    });
                }
                
                console.log(`📨 Notificação enviada para usuário ${userId}: ${notification.title}`);
            }

            return savedNotification;
            
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            throw error;
        }
    }

    // Enviar para múltiplos usuários
    async notifyMultipleUsers(userIds, notification) {
        const promises = userIds.map(userId => this.notifyUser(userId, notification));
        return Promise.all(promises);
    }

    // Broadcast para todos os usuários conectados
    broadcastToAll(data) {
        for (const [userId, connections] of this.connections) {
            for (const connection of connections) {
                this.sendToConnection(connection, {
                    type: 'broadcast',
                    data,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        console.log(`📢 Broadcast enviado para ${this.connections.size} usuários`);
    }

    // Enviar dados para uma conexão específica
    sendToConnection(connection, data) {
        try {
            const eventData = `data: ${JSON.stringify(data)}\n\n`;
            connection.write(eventData);
        } catch (error) {
            console.error('Erro ao enviar dados SSE:', error);
        }
    }

    // Enviar notificações não lidas para uma nova conexão
    async sendUnreadNotifications(userId, connection) {
        try {
            const result = await db.query(
                `SELECT * FROM notifications 
                 WHERE user_id = $1 AND read_at IS NULL 
                 ORDER BY created_at DESC 
                 LIMIT 10`,
                [userId]
            );

            if (result.rows.length > 0) {
                this.sendToConnection(connection, {
                    type: 'unread_notifications',
                    notifications: result.rows,
                    count: result.rows.length,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('Erro ao enviar notificações não lidas:', error);
        }
    }

    // Notificar sobre visualização de proposta
    async notifyProposalViewed(proposalId, viewerInfo) {
        try {
            const proposalResult = await db.query(
                'SELECT user_id, title FROM proposals WHERE id = $1',
                [proposalId]
            );

            if (proposalResult.rows.length === 0) return;

            const { user_id, title } = proposalResult.rows[0];
            
            await this.notifyUser(user_id, {
                type: 'proposal_viewed',
                title: '👀 Proposta Visualizada',
                message: `Sua proposta "${title}" foi visualizada!`,
                data: {
                    proposalId,
                    proposalTitle: title,
                    viewerIp: viewerInfo.ip,
                    viewerUserAgent: viewerInfo.userAgent,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erro ao notificar visualização:', error);
        }
    }

    // Notificar sobre feedback/aprovação
    async notifyProposalFeedback(proposalId, feedbackType, comment = null) {
        try {
            const proposalResult = await db.query(
                'SELECT user_id, title FROM proposals WHERE id = $1',
                [proposalId]
            );

            if (proposalResult.rows.length === 0) return;

            const { user_id, title } = proposalResult.rows[0];
            
            let notificationTitle, notificationMessage;
            
            switch (feedbackType) {
                case 'approved':
                    notificationTitle = '🎉 Proposta Aprovada!';
                    notificationMessage = `Parabéns! Sua proposta "${title}" foi aprovada!`;
                    break;
                case 'rejected':
                    notificationTitle = '❌ Proposta Rejeitada';
                    notificationMessage = `Sua proposta "${title}" foi rejeitada.`;
                    break;
                case 'meeting_request':
                    notificationTitle = '📅 Solicitação de Reunião';
                    notificationMessage = `Cliente solicitou reunião sobre a proposta "${title}".`;
                    break;
                default:
                    notificationTitle = '💬 Novo Feedback';
                    notificationMessage = `Novo feedback na proposta "${title}".`;
            }

            await this.notifyUser(user_id, {
                type: 'proposal_feedback',
                title: notificationTitle,
                message: notificationMessage,
                data: {
                    proposalId,
                    proposalTitle: title,
                    feedbackType,
                    comment,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erro ao notificar feedback:', error);
        }
    }

    // Notificar sobre seção visualizada
    async notifySectionViewed(proposalId, sectionTitle, viewerInfo) {
        try {
            const proposalResult = await db.query(
                'SELECT user_id, title FROM proposals WHERE id = $1',
                [proposalId]
            );

            if (proposalResult.rows.length === 0) return;

            const { user_id, title } = proposalResult.rows[0];
            
            await this.notifyUser(user_id, {
                type: 'section_viewed',
                title: '📖 Seção Visualizada',
                message: `Cliente está lendo "${sectionTitle}" da proposta "${title}".`,
                data: {
                    proposalId,
                    proposalTitle: title,
                    sectionTitle,
                    viewerIp: viewerInfo.ip,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erro ao notificar visualização de seção:', error);
        }
    }

    // Notificar sobre download de arquivo
    async notifyFileDownload(proposalId, fileName, viewerInfo) {
        try {
            const proposalResult = await db.query(
                'SELECT user_id, title FROM proposals WHERE id = $1',
                [proposalId]
            );

            if (proposalResult.rows.length === 0) return;

            const { user_id, title } = proposalResult.rows[0];
            
            await this.notifyUser(user_id, {
                type: 'file_download',
                title: '📥 Arquivo Baixado',
                message: `Cliente baixou o arquivo "${fileName}" da proposta "${title}".`,
                data: {
                    proposalId,
                    proposalTitle: title,
                    fileName,
                    viewerIp: viewerInfo.ip,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erro ao notificar download:', error);
        }
    }

    // Notificar sobre follow-up enviado
    async notifyFollowUpSent(proposalId, followUpType) {
        try {
            const proposalResult = await db.query(
                'SELECT user_id, title FROM proposals WHERE id = $1',
                [proposalId]
            );

            if (proposalResult.rows.length === 0) return;

            const { user_id, title } = proposalResult.rows[0];
            
            await this.notifyUser(user_id, {
                type: 'follow_up_sent',
                title: '📤 Follow-up Enviado',
                message: `Follow-up ${followUpType} enviado para a proposta "${title}".`,
                data: {
                    proposalId,
                    proposalTitle: title,
                    followUpType,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erro ao notificar follow-up:', error);
        }
    }

    // Obter estatísticas de conexões
    getConnectionStats() {
        const totalConnections = Array.from(this.connections.values())
            .reduce((total, connectionSet) => total + connectionSet.size, 0);
            
        return {
            connectedUsers: this.connections.size,
            totalConnections,
            userConnections: Array.from(this.connections.entries()).map(([userId, connections]) => ({
                userId,
                connectionCount: connections.size
            }))
        };
    }

    // Limpar conexões órfãs (cleanup)
    cleanup() {
        for (const [userId, connections] of this.connections) {
            for (const connection of connections) {
                if (connection.destroyed || connection.writableEnded) {
                    this.removeConnection(userId, connection);
                }
            }
        }
    }

    // Manter conexões vivas com ping
    startKeepAlive() {
        setInterval(() => {
            for (const [userId, connections] of this.connections) {
                for (const connection of connections) {
                    this.sendToConnection(connection, {
                        type: 'ping',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }, 30000); // A cada 30 segundos
    }
}

// Singleton instance
const realTimeNotificationService = new RealTimeNotificationService();

module.exports = realTimeNotificationService;