# 📚 Documentação da API

## Base URL
- **Desenvolvimento:** `http://localhost:3000/api`
- **Produção:** `https://seu-projeto.vercel.app/api`

## Autenticação

A maioria dos endpoints requer autenticação via JWT Bearer Token:

```javascript
headers: {
  'Authorization': 'Bearer seu_jwt_token_aqui'
}
```

---

## 🔐 Autenticação

### POST /auth/register
**Descrição:** Cadastrar novo usuário

**Body:**
```json
{
  "name": "Seu Nome",
  "email": "seu@email.com",
  "password": "suasenha123"
}
```

**Resposta:**
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid",
    "name": "Seu Nome",
    "email": "seu@email.com"
  },
  "token": "jwt_token"
}
```

### POST /auth/login
**Descrição:** Fazer login

**Body:**
```json
{
  "email": "seu@email.com",
  "password": "suasenha123"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid",
    "name": "Seu Nome",
    "email": "seu@email.com"
  },
  "token": "jwt_token"
}
```

### GET /auth/profile
**Descrição:** Buscar perfil do usuário logado
**Autenticação:** Obrigatória

---

## 📄 Propostas

### GET /proposals
**Descrição:** Listar propostas do usuário
**Autenticação:** Obrigatória

**Query Parameters:**
- `page` (optional): Número da página (default: 1)
- `limit` (optional): Items per page (default: 10)

### POST /proposals
**Descrição:** Criar nova proposta
**Autenticação:** Obrigatória

**Body:**
```json
{
  "title": "Proposta para Desenvolvimento de Site",
  "private_title": "Cliente XYZ - Website"
}
```

### GET /proposals/:id
**Descrição:** Buscar proposta específica com seções
**Autenticação:** Obrigatória

### PUT /proposals/:id
**Descrição:** Atualizar proposta
**Autenticação:** Obrigatória

**Body:**
```json
{
  "title": "Título atualizado",
  "private_title": "Título privado atualizado",
  "status": "active"
}
```

### DELETE /proposals/:id
**Descrição:** Excluir proposta
**Autenticação:** Obrigatória

### POST /proposals/:proposalId/sections
**Descrição:** Adicionar seção à proposta
**Autenticação:** Obrigatória

**Body:**
```json
{
  "sectionId": "uuid-da-secao",
  "orderIndex": 0
}
```

### DELETE /proposals/:proposalId/sections/:sectionId
**Descrição:** Remover seção da proposta
**Autenticação:** Obrigatória

### PUT /proposals/:proposalId/sections/reorder
**Descrição:** Reordenar seções da proposta
**Autenticação:** Obrigatória

**Body:**
```json
{
  "sectionsOrder": [
    { "sectionId": "uuid1", "orderIndex": 0 },
    { "sectionId": "uuid2", "orderIndex": 1 }
  ]
}
```

---

## 📝 Seções

### GET /sections
**Descrição:** Listar seções do usuário
**Autenticação:** Obrigatória

**Query Parameters:**
- `reusable` (optional): true/false - Filtrar por seções reutilizáveis

### POST /sections
**Descrição:** Criar nova seção
**Autenticação:** Obrigatória

**Body:**
```json
{
  "title": "Apresentação da Empresa",
  "type": "text|image|video|file|mixed",
  "content": {
    "text": "Conteúdo da seção...",
    "images": ["url1.jpg", "url2.jpg"],
    "videos": ["video1.mp4"],
    "files": ["documento.pdf"]
  },
  "is_reusable": true
}
```

### GET /sections/:id
**Descrição:** Buscar seção específica
**Autenticação:** Obrigatória

### PUT /sections/:id
**Descrição:** Atualizar seção
**Autenticação:** Obrigatória

### DELETE /sections/:id
**Descrição:** Excluir seção
**Autenticação:** Obrigatória

---

## 📎 Arquivos

### POST /files/upload
**Descrição:** Upload de arquivo único
**Autenticação:** Obrigatória
**Content-Type:** multipart/form-data

**Form Data:**
- `file`: Arquivo a ser enviado
- `sectionId` (optional): UUID da seção associada

**Resposta:**
```json
{
  "message": "Arquivo enviado com sucesso",
  "file": {
    "id": "uuid",
    "filename": "nome_unico.jpg",
    "original_name": "imagem.jpg",
    "file_type": "image",
    "file_size": 12345,
    "url": "/uploads/nome_unico.jpg"
  }
}
```

### POST /files/upload-multiple
**Descrição:** Upload de múltiplos arquivos
**Autenticação:** Obrigatória
**Content-Type:** multipart/form-data

**Form Data:**
- `files`: Array de arquivos (máximo 10)
- `sectionId` (optional): UUID da seção associada

### GET /files
**Descrição:** Listar arquivos do usuário
**Autenticação:** Obrigatória

**Query Parameters:**
- `sectionId` (optional): Filtrar por seção específica

### GET /files/:id
**Descrição:** Buscar arquivo específico
**Autenticação:** Obrigatória

### DELETE /files/:id
**Descrição:** Excluir arquivo
**Autenticação:** Obrigatória

---

## 🌐 Público (Sem Autenticação)

### GET /public/proposal/:publicLink
**Descrição:** Visualizar proposta pública

**Resposta:**
```json
{
  "proposal": {
    "id": "uuid",
    "title": "Título da Proposta",
    "sections": [
      {
        "id": "uuid",
        "title": "Seção 1",
        "type": "text",
        "content": {...},
        "files": [...]
      }
    ],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /public/proposal/:publicLink/track-section
**Descrição:** Rastrear visualização de seção

**Body:**
```json
{
  "sectionId": "uuid-da-secao",
  "timeSpent": 30
}
```

### POST /public/proposal/:publicLink/track-interaction
**Descrição:** Rastrear interação do usuário

**Body:**
```json
{
  "interactionType": "click|scroll|download|approval|rejection",
  "sectionId": "uuid-da-secao",
  "data": {
    "additional": "info"
  }
}
```

---

## 🔔 Notificações

### GET /notifications
**Descrição:** Listar notificações do usuário
**Autenticação:** Obrigatória

**Query Parameters:**
- `page` (optional): Número da página
- `limit` (optional): Items per page

### GET /notifications/unread-count
**Descrição:** Contagem de notificações não lidas
**Autenticação:** Obrigatória

### PUT /notifications/:id/read
**Descrição:** Marcar notificação como lida
**Autenticação:** Obrigatória

### PUT /notifications/mark-all-read
**Descrição:** Marcar todas as notificações como lidas
**Autenticação:** Obrigatória

### DELETE /notifications/:id
**Descrição:** Excluir notificação
**Autenticação:** Obrigatória

---

## 📊 Analytics

### GET /analytics/dashboard
**Descrição:** Overview geral do dashboard
**Autenticação:** Obrigatória

**Resposta:**
```json
{
  "overview": {
    "proposalsStats": {
      "total_proposals": 5,
      "draft_proposals": 2,
      "active_proposals": 3
    },
    "viewsStats": {
      "total_views": 25,
      "unique_visitors": 10,
      "avg_time_spent": 120
    },
    "recentActivity": [...],
    "topProposals": [...],
    "monthlyViews": [...]
  }
}
```

### GET /analytics/proposal/:id
**Descrição:** Analytics detalhado da proposta
**Autenticação:** Obrigatória

### GET /analytics/performance
**Descrição:** Performance das propostas
**Autenticação:** Obrigatória

**Query Parameters:**
- `period` (optional): Período em dias (default: 30)

### GET /analytics/proposal/:id/share-links
**Descrição:** Gerar links compartilháveis
**Autenticação:** Obrigatória

**Resposta:**
```json
{
  "shareLinks": {
    "direct": "https://app.com/proposta/uuid",
    "whatsapp": "https://wa.me/?text=...",
    "email": "mailto:?subject=...&body=..."
  }
}
```

---

## ❌ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Acesso negado |
| 404 | Não encontrado |
| 409 | Conflito (ex: email já existe) |
| 429 | Muitas requisições |
| 500 | Erro interno |

---

## 📋 Tipos de Arquivo Suportados

### Imagens
- JPG, JPEG
- PNG
- GIF
- WebP

### Vídeos
- MP4
- WebM
- OGG

### Documentos
- PDF
- DOC, DOCX
- PPT, PPTX
- TXT

### Limites
- Tamanho máximo: 10MB por arquivo
- Upload múltiplo: máximo 10 arquivos

---

## 🔧 Rate Limiting

- **Limite:** 100 requisições por 15 minutos (produção)
- **Limite:** 1000 requisições por 15 minutos (desenvolvimento)

---

## 📱 Exemplos de Uso

### Fluxo Completo: Criar Proposta

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@test.com', password: '123456' })
});
const { token } = await loginResponse.json();

// 2. Criar seção
const sectionResponse = await fetch('/api/sections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Apresentação',
    type: 'text',
    content: { text: 'Somos uma empresa...' },
    is_reusable: true
  })
});
const { section } = await sectionResponse.json();

// 3. Criar proposta
const proposalResponse = await fetch('/api/proposals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Proposta Website',
    private_title: 'Cliente ABC'
  })
});
const { proposal } = await proposalResponse.json();

// 4. Adicionar seção à proposta
await fetch(`/api/proposals/${proposal.id}/sections`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sectionId: section.id,
    orderIndex: 0
  })
});

// 5. Obter link compartilhável
const shareResponse = await fetch(`/api/analytics/proposal/${proposal.id}/share-links`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { shareLinks } = await shareResponse.json();

console.log('Link da proposta:', shareLinks.direct);
```