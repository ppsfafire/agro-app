# AgroFamília Backend API

Backend completo para o app AgroFamília com autenticação, produtos, pedidos e usuários.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **SQLite** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **CORS** - Cross-origin resource sharing

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## 🔧 Instalação

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp config.env .env
# Edite o arquivo .env conforme necessário
```

3. **Inicializar banco de dados:**
```bash
npm run init-db
```

4. **Iniciar servidor:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Endpoints da API

### Autenticação (`/api/auth`)

- `POST /register` - Registrar usuário
- `POST /login` - Fazer login
- `GET /verify` - Verificar token

### Produtos (`/api/products`)

- `GET /` - Listar produtos
- `GET /:id` - Buscar produto por ID
- `POST /` - Criar produto (produtores)
- `PUT /:id` - Atualizar produto (dono)
- `DELETE /:id` - Deletar produto (dono)
- `GET /categories/list` - Listar categorias

### Pedidos (`/api/orders`)

- `POST /` - Criar pedido
- `GET /my-orders` - Listar pedidos do usuário
- `GET /:id` - Buscar pedido por ID
- `PATCH /:id/status` - Atualizar status
- `GET /producer/orders` - Pedidos para produtores

### Usuários (`/api/users`)

- `GET /profile` - Perfil do usuário
- `PUT /profile` - Atualizar perfil
- `PUT /change-password` - Alterar senha
- `GET /stats` - Estatísticas do usuário
- `GET /my-products` - Produtos do produtor

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas, inclua o header:

```
Authorization: Bearer <seu-token>
```

## 🗄️ Estrutura do Banco

### Tabelas principais:

- **users** - Usuários (consumidores e produtores)
- **products** - Produtos disponíveis
- **orders** - Pedidos realizados
- **order_items** - Itens de cada pedido
- **categories** - Categorias de produtos

## 🌐 Configuração para Snack Expo

Para usar com Snack Expo, configure a URL da API:

```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // Desenvolvimento local
// ou
const API_BASE_URL = 'https://seu-servidor.com/api'; // Produção
```

## 📝 Exemplos de Uso

### Login
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@email.com',
    password: '123456'
  })
});
```

### Listar Produtos
```javascript
const response = await fetch('http://localhost:3000/api/products');
const data = await response.json();
```

### Criar Pedido (com autenticação)
```javascript
const response = await fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [
      { product_id: 1, quantity: 2 },
      { product_id: 3, quantity: 1 }
    ],
    delivery_address: 'Rua Exemplo, 123',
    notes: 'Entregar após 18h'
  })
});
```

## 🛠️ Scripts Disponíveis

- `npm start` - Iniciar servidor
- `npm run dev` - Iniciar em modo desenvolvimento
- `npm run init-db` - Inicializar banco de dados

## 📊 Dados de Exemplo

O script de inicialização cria:

- 1 usuário produtor (joao@agrofamilia.com / 123456)
- 5 produtos de exemplo
- 6 categorias de produtos

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- JWT para autenticação
- Validação de entrada
- Controle de acesso baseado em roles

## 🚀 Deploy

Para produção, considere:

1. Usar um banco PostgreSQL ou MySQL
2. Configurar HTTPS
3. Usar variáveis de ambiente seguras
4. Implementar rate limiting
5. Configurar logs adequados 