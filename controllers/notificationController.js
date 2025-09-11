const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const notifications = await Notification.findByUser(req.user.id, page, limit);
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({ 
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.markAsRead(id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    res.json({ 
      message: 'Notificação marcada como lida',
      notification 
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.delete(id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    res.json({ message: 'Notificação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erro ao buscar contagem de não lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Server-Sent Events para notificações em tempo real
const connectRealTime = (req, res) => {
  try {
    // Configurar headers para SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const userId = req.user.id;
    
    // Adicionar conexão ao serviço de tempo real
    const realTimeService = require('../services/realTimeNotificationService');
    realTimeService.addConnection(userId, res);

    // Enviar ping inicial
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Conectado com sucesso' })}\n\n`);

  } catch (error) {
    console.error('Erro ao conectar SSE:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Enviar notificação de teste
const sendTestNotification = async (req, res) => {
  try {
    const realTimeService = require('../services/realTimeNotificationService');
    
    await realTimeService.notifyUser(req.user.id, {
      type: 'test',
      title: '🧪 Notificação de Teste',
      message: 'Esta é uma notificação de teste do sistema em tempo real!',
      data: { timestamp: new Date().toISOString() }
    });

    res.json({ message: 'Notificação de teste enviada!' });
  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  connectRealTime,
  sendTestNotification
};