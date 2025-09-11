# 🚀 Construtor de Propostas

Sistema completo para criação, gestão e análise de propostas comerciais com Node.js, PostgreSQL e deploy no Vercel.

## ✨ Funcionalidades

- **🔐 Autenticação Completa**: Sistema de cadastro e login com JWT
- **📄 Construtor de Propostas**: Crie propostas profissionais com seções personalizáveis
- **📎 Upload de Arquivos**: Suporte para PDF, DOC, imagens e vídeos
- **🔗 Links Compartilháveis**: Cada proposta gera um link único para compartilhamento
- **📊 Analytics Avançado**: Rastreamento detalhado de visualizações e interações
- **🔔 Notificações**: Sistema automático de notificações por email e WhatsApp
- **📱 Seções Reutilizáveis**: Crie uma vez, use em várias propostas

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL (Neon)
- **Autenticação**: JWT
- **Upload**: Multer
- **Email**: Nodemailer
- **Deploy**: Vercel

## 🚀 Instalação

1. **Clone o projeto:**
```bash
git clone <seu-repositorio>
cd propostas
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- Database URL (já configurada com Neon)
- JWT Secret
- Credenciais SMTP para email
- API do WhatsApp (opcional)

4. **Execute as migrations:**
```bash
npm run migrate
```

5. **Inicie o servidor:**
```bash
npm run dev
```

## 📋 Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3000

# Database (já configurado)
DATABASE_URL=postgresql://neondb_owner:npg_XVFy9I0CjLfo@ep-rapid-butterfly-acsgiwq8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT
JWT_SECRET=sua_chave_secreta_muito_forte_aqui_123456789

# Email (configure com seus dados)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app

# WhatsApp (opcional)
WHATSAPP_API_URL=
WHATSAPP_TOKEN=

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📚 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário

### Propostas
- `GET /api/proposals` - Listar propostas
- `POST /api/proposals` - Criar proposta
- `GET /api/proposals/:id` - Buscar proposta
- `PUT /api/proposals/:id` - Atualizar proposta
- `DELETE /api/proposals/:id` - Excluir proposta

### Seções
- `GET /api/sections` - Listar seções
- `POST /api/sections` - Criar seção
- `PUT /api/sections/:id` - Atualizar seção
- `DELETE /api/sections/:id` - Excluir seção

### Arquivos
- `POST /api/files/upload` - Upload de arquivo único
- `POST /api/files/upload-multiple` - Upload múltiplo
- `GET /api/files` - Listar arquivos
- `DELETE /api/files/:id` - Excluir arquivo

### Público (sem autenticação)
- `GET /api/public/proposal/:publicLink` - Visualizar proposta
- `POST /api/public/proposal/:publicLink/track-section` - Rastrear seção
- `POST /api/public/proposal/:publicLink/track-interaction` - Rastrear interação

### Analytics
- `GET /api/analytics/dashboard` - Overview do dashboard
- `GET /api/analytics/proposal/:id` - Analytics da proposta
- `GET /api/analytics/proposal/:id/share-links` - Links compartilháveis

### Notificações
- `GET /api/notifications` - Listar notificações
- `PUT /api/notifications/:id/read` - Marcar como lida
- `DELETE /api/notifications/:id` - Excluir notificação

## 🎯 Como Usar

### 1. Cadastro e Login
```javascript
// Cadastro
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Seu Nome',
    email: 'seu@email.com',
    password: 'suasenha123'
  })
});
```

### 2. Criar Seção
```javascript
const section = await fetch('/api/sections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Apresentação da Empresa',
    type: 'text',
    content: {
      text: 'Somos uma empresa especializada...',
      images: ['url1.jpg', 'url2.jpg']
    },
    is_reusable: true
  })
});
```

### 3. Criar Proposta
```javascript
const proposal = await fetch('/api/proposals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Proposta para Desenvolvimento de Site',
    private_title: 'Cliente XYZ - Website'
  })
});
```

### 4. Adicionar Seções à Proposta
```javascript
await fetch(`/api/proposals/${proposalId}/sections`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sectionId: 'uuid-da-secao',
    orderIndex: 0
  })
});
```

## 🚀 Deploy no Vercel

1. **Conecte seu repositório ao Vercel**

2. **Configure as variáveis de ambiente no Vercel:**
   - Todas as variáveis do arquivo `.env`
   - `FRONTEND_URL` com a URL do Vercel

3. **Deploy automático:**
```bash
git add .
git commit -m "Sistema completo de propostas"
git push origin main
```

4. **Execute as migrations após o deploy:**
   - Use o terminal do Vercel ou uma função serverless para executar as migrations

## 📊 Estrutura do Banco

```sql
users              # Usuários do sistema
proposals          # Propostas criadas
sections           # Seções de conteúdo reutilizáveis
proposal_sections  # Relacionamento proposta-seções
files              # Arquivos uploadados
proposal_views     # Visualizações das propostas
proposal_interactions # Interações com as propostas
notifications      # Sistema de notificações
```

## 🔧 Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento
npm start          # Servidor de produção
npm run migrate    # Executar migrations do banco
npm run build      # Build (compatível com Vercel)
```

## 📱 Tipos de Conteúdo Suportados

- **Texto**: Apresentações, descrições, termos
- **Imagens**: JPG, PNG, GIF, WebP
- **Vídeos**: MP4, WebM, OGG
- **Documentos**: PDF, DOC, DOCX, PPT, PPTX
- **Misto**: Combinação de todos os tipos

## 🔔 Sistema de Notificações

O sistema notifica automaticamente quando:
- Uma proposta é visualizada pela primeira vez
- Uma seção específica é lida
- Uma proposta é aprovada/rejeitada
- Há novas interações com a proposta

## 📈 Analytics Disponíveis

- **Visualizações totais e únicas**
- **Tempo médio de permanência**
- **Seções mais visualizadas**
- **Timeline de atividades**
- **Taxa de aprovação**
- **Relatórios de performance**

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato ou abra uma issue no repositório.

---

**Feito com ❤️ usando Node.js, PostgreSQL e muito café ☕**