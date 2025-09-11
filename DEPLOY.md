# 🚀 Guia de Deploy para o Vercel

## Passos para Deploy

### 1. Preparação do Repositório

```bash
# Inicializar git (se ainda não foi feito)
git init
git add .
git commit -m "Sistema completo de propostas"

# Conectar com GitHub
git remote add origin https://github.com/seu-usuario/construtor-propostas.git
git branch -M main
git push -u origin main
```

### 2. Configurar no Vercel

1. **Acesse [vercel.com](https://vercel.com) e faça login**

2. **Import do projeto:**
   - Clique em "New Project"
   - Conecte seu GitHub e selecione o repositório
   - Configure as settings do projeto

3. **Variáveis de Ambiente:**
   No dashboard do Vercel, vá em Settings > Environment Variables e adicione:

   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://neondb_owner:npg_XVFy9I0CjLfo@ep-rapid-butterfly-acsgiwq8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=sua_chave_secreta_muito_forte_aqui_123456789
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seu_email@gmail.com
   SMTP_PASSWORD=sua_senha_de_app
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   FRONTEND_URL=https://seu-projeto.vercel.app
   ```

### 3. Configuração do Gmail

Para usar o sistema de notificações por email:

1. **Ativar 2FA no Gmail**
2. **Gerar senha de app:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Email" e gere uma senha
   - Use essa senha no `SMTP_PASSWORD`

### 4. Deploy

```bash
# Deploy manual (opcional, Vercel faz automático)
npm install -g vercel
vercel --prod
```

### 5. Executar Migrations

Após o primeiro deploy, execute as migrations:

**Opção 1 - Via API:**
Crie um arquivo `api/migrate.js`:

```javascript
const { createTables } = require('../scripts/migrate');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await createTables();
      res.status(200).json({ message: 'Migrations executadas com sucesso' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

Depois acesse: `https://seu-projeto.vercel.app/api/migrate` com POST

**Opção 2 - Via Terminal Local:**
```bash
DATABASE_URL=sua_connection_string npm run migrate
```

### 6. Configurar Domínio Personalizado (Opcional)

1. **No Vercel Dashboard:**
   - Vá em Settings > Domains
   - Adicione seu domínio personalizado
   - Configure os DNS records

2. **Atualizar variável FRONTEND_URL:**
   ```
   FRONTEND_URL=https://seudominio.com
   ```

### 7. Monitoramento

**Logs:**
- Acesse Function Logs no dashboard do Vercel
- Configure alertas para erros

**Analytics:**
- Ative Vercel Analytics se necessário
- Configure monitoring de performance

## Estrutura para Vercel

O projeto já está configurado com:

- ✅ `vercel.json` - Configuração de rotas
- ✅ `package.json` - Scripts e dependências
- ✅ Estrutura serverless-friendly
- ✅ Tratamento de errors e logs
- ✅ CORS configurado para produção

## URLs Importantes Após Deploy

- **API Health:** `https://seu-projeto.vercel.app/api/health`
- **Documentação:** `https://seu-projeto.vercel.app/api/`
- **Upload Endpoint:** `https://seu-projeto.vercel.app/api/files/upload`
- **Proposta Pública:** `https://seu-projeto.vercel.app/api/public/proposal/UUID`

## Troubleshooting

### Problema: Timeout nas funções
**Solução:** Vercel Hobby plan tem timeout de 10s. Para production, considere upgrade.

### Problema: Uploads não funcionam
**Solução:** Vercel não suporta filesystem persistente. Configure cloud storage (AWS S3, Cloudinary).

### Problema: Banco de dados offline
**Solução:** Verifique se a connection string do Neon está correta nas variáveis de ambiente.

### Problema: CORS errors
**Solução:** Verifique se `FRONTEND_URL` está correto nas variáveis de ambiente.

## Próximos Passos Recomendados

1. **Configurar Storage em Nuvem** (S3, Cloudinary)
2. **Implementar CDN** para arquivos estáticos
3. **Configurar Monitoring** (Sentry, LogRocket)
4. **Setup CI/CD** avançado
5. **Implementar Tests** automatizados
6. **Configurar Backup** do banco de dados

## Comandos Úteis

```bash
# Ver logs em tempo real
vercel logs

# Rollback para deploy anterior
vercel rollback

# Informações do deployment
vercel inspect

# Preview deployment
vercel --prod=false
```