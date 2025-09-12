const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const proposalRoutes = require('./routes/proposals');
const sectionRoutes = require('./routes/sections');
const fileRoutes = require('./routes/files');
const publicRoutes = require('./routes/public');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const leadRoutes = require('./routes/leads');
const adminRoutes = require('./routes/admin');
const trackingRoutes = require('./routes/tracking');
const shortLinkRoutes = require('./routes/shortlinks');
const templateRoutes = require('./routes/templates');

// Serviços
const followUpService = require('./services/followUpService');

const app = express();
const PORT = process.env.PORT || 3000;

// Helmet removido temporariamente para desenvolvimento
// app.use(helmet());

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://your-vercel-domain.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  }
});

app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Redirects before static files
app.get('/landing.html', (req, res) => {
  res.redirect(301, '/');
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracking', trackingRoutes);

// Rotas de links curtos (antes das rotas HTML para interceptar /p/*)
app.use('/p', shortLinkRoutes);
app.use('/api/shortlinks', shortLinkRoutes);

// Rotas de templates
app.use('/api/templates', templateRoutes);

// Rotas para páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

app.get('/proposta/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'proposta-demo.html'));
});

app.get('/proposta/:publicLink', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'proposta.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

app.get('/tutorial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutorial.html'));
});

app.get('/templates', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'templates.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    method: req.method,
    path: req.path
  });
});

app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📁 Documentação da API disponível em: http://localhost:${PORT}/api/`);
    
    // Inicializar serviços em background REATIVADOS
    try {
      followUpService.start();
      console.log(`🚀 Serviços de background REATIVADOS - Analytics Premium Ativo`);
    } catch (error) {
      console.error('❌ Erro ao inicializar serviços:', error);
    }
  });
}

// Para Vercel (serverless)
module.exports = app;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, parando serviços...');
  followUpService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, parando serviços...');
  followUpService.stop();
  process.exit(0);
});