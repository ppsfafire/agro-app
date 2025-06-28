# 🌱 AgroFamília App (Supabase Edition)

Este app agora utiliza **Supabase** como backend, sem necessidade de rodar servidor local ou banco de dados no seu computador. Funciona 100% no Expo Snack, emulador ou dispositivo real.

## 🚀 Como usar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Abra o projeto no Expo Go, Snack ou emulador.
3. O app já está configurado para acessar o Supabase:
   - URL: https://jqrjcnxwdsrojflxtiii.supabase.co
   - anon key: (já configurada no código)

## 📦 Estrutura de dados
O app espera as seguintes tabelas no Supabase:
- **users**: usuários (campos: id, name, email, password, etc)
- **products**: produtos (campos: id, name, description, price, stock_quantity, etc)
- **orders**: pedidos
- **order_items**: itens do pedido

> **Dica:** Você pode criar as tabelas facilmente pelo dashboard do Supabase.

## 🛠️ Como adaptar telas e serviços
- Toda a lógica de autenticação, listagem de produtos, pedidos, etc, agora usa Supabase diretamente.
- Veja o arquivo `services/supabase.js` para detalhes da conexão.

## 🔑 Segurança
- Nunca exponha a service key do Supabase no app, use sempre a anon key.
- Regras de Row Level Security (RLS) devem ser configuradas no Supabase para proteger os dados.

## 📋 Exemplo de uso do Supabase
```js
import { supabase } from './services/supabase';

// Buscar produtos
const { data, error } = await supabase.from('products').select('*');

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});
```

## 📝 Observações
- O app está pronto para uso em produção ou testes, sem dependências locais.
- Para customizar, basta alterar as queries do Supabase conforme sua estrutura de dados.

---

**Desenvolvido para a Agricultura Familiar, agora 100% cloud!**
