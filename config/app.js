const config = {
  // URL base da aplicação
  APP_URL: process.env.APP_URL || 'https://proposta360.com.br',
  
  // URLs específicas
  PROPOSAL_BASE_URL: process.env.PROPOSAL_BASE_URL || 'https://proposta360.com.br/proposta',
  
  // Configurações de notificação
  NOTIFICATION_SETTINGS: {
    EMAIL_ON_VIEW: true,
    DASHBOARD_NOTIFICATION: true
  },
  
  // Configurações de tracking
  TRACKING_SETTINGS: {
    ENABLED: true,
    TRACK_SCROLL: true,
    TRACK_TIME: true,
    TRACK_SECTIONS: true
  }
};

module.exports = config;