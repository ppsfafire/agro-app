const { run } = require('../database/database');

async function initDatabase() {
  try {
    console.log('🗄️ Inicializando banco de dados...');

    // Tabela de usuários
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        is_producer BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de produtos
    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        unit TEXT DEFAULT 'kg',
        stock_quantity REAL DEFAULT 0,
        producer_id INTEGER,
        image_url TEXT,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producer_id) REFERENCES users (id)
      )
    `);

    // Tabela de pedidos
    await run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        delivery_address TEXT,
        delivery_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Tabela de itens do pedido
    await run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Tabela de categorias
    await run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabelas criadas com sucesso!');

    // Inserir dados de exemplo
    await insertSampleData();
    
    console.log('✅ Dados de exemplo inseridos!');
    console.log('🎉 Banco de dados inicializado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  }
}

async function insertSampleData() {
  try {
    // Inserir categorias
    const categories = [
      'Frutas',
      'Verduras',
      'Legumes',
      'Tubérculos',
      'Ervas',
      'Orgânicos'
    ];

    for (const category of categories) {
      await run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category]);
    }

    // Inserir usuário produtor de exemplo
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const producer = await run(`
      INSERT OR IGNORE INTO users (name, email, password, phone, address, is_producer) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['João Silva', 'joao@agrofamilia.com', hashedPassword, '(81) 99999-9999', 'Zona Rural, Recife-PE', 1]);

    // Inserir produtos de exemplo
    const products = [
      {
        name: 'Tomate',
        description: 'Tomate orgânico fresco da horta',
        price: 2.50,
        category: 'Legumes',
        unit: 'kg',
        stock_quantity: 50,
        image_url: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400'
      },
      {
        name: 'Alface',
        description: 'Alface crespa hidropônica',
        price: 1.80,
        category: 'Verduras',
        unit: 'unidade',
        stock_quantity: 30,
        image_url: 'https://images.unsplash.com/photo-1622205313162-be1d5716a43b?w=400'
      },
      {
        name: 'Cenoura',
        description: 'Cenoura orgânica da terra',
        price: 3.20,
        category: 'Tubérculos',
        unit: 'kg',
        stock_quantity: 25,
        image_url: 'https://images.unsplash.com/photo-1447175008436-1701707d5dd6?w=400'
      },
      {
        name: 'Banana',
        description: 'Banana prata da região',
        price: 4.50,
        category: 'Frutas',
        unit: 'kg',
        stock_quantity: 40,
        image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'
      },
      {
        name: 'Manjericão',
        description: 'Manjericão fresco da horta',
        price: 2.00,
        category: 'Ervas',
        unit: 'maço',
        stock_quantity: 15,
        image_url: 'https://images.unsplash.com/photo-1618377382884-c6c037513c6c?w=400'
      }
    ];

    for (const product of products) {
      await run(`
        INSERT OR IGNORE INTO products (name, description, price, category, unit, stock_quantity, image_url, producer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [product.name, product.description, product.price, product.category, product.unit, product.stock_quantity, product.image_url]);
    }

  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase }; 