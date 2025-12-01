import { pool } from "../config/database";
import bcrypt from "bcryptjs";

async function seedFakeOrder() {
  console.log("🌱 Gerando dados de teste (Seed Inteligente)...");

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ---------------------------------------------------------
    // 1. USUÁRIO (Busca ou Cria)
    // ---------------------------------------------------------
    console.log("👤 Verificando Cliente...");
    let userId;
    const [users]: any = await conn.execute("SELECT id FROM users WHERE email = 'cliente@teste.com'");
    
    if (users.length > 0) {
      userId = users[0].id;
      console.log(`   -> Cliente já existe (ID: ${userId})`);
    } else {
      const passHash = await bcrypt.hash("123456", 10);
      const [res]: any = await conn.execute(
        `INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
         VALUES ('Cliente Teste', 'cliente@teste.com', ?, 'CUSTOMER', NOW(), NOW())`,
        [passHash]
      );
      userId = res.insertId;
      console.log(`   -> Cliente criado (ID: ${userId})`);
    }

    // ---------------------------------------------------------
    // 2. CATEGORIA (Busca ou Cria)
    // ---------------------------------------------------------
    console.log("📂 Verificando Categoria...");
    let categoryId;
    const [cats]: any = await conn.execute("SELECT id FROM categories WHERE slug = 'teste-cat'");

    if (cats.length > 0) {
      categoryId = cats[0].id;
      console.log(`   -> Categoria já existe (ID: ${categoryId})`);
    } else {
      const [res]: any = await conn.execute(
        `INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
         VALUES ('Categoria Teste', 'teste-cat', 'Categoria para testes', 1, NOW(), NOW())`
      );
      categoryId = res.insertId;
      console.log(`   -> Categoria criada (ID: ${categoryId})`);
    }

    // ---------------------------------------------------------
    // 3. TAMANHO (Busca ou Cria)
    // ---------------------------------------------------------
    console.log("📏 Verificando Tamanho...");
    let sizeId;
    const [sizes]: any = await conn.execute("SELECT id FROM sizes WHERE code = 'UNI'");

    if (sizes.length > 0) {
      sizeId = sizes[0].id;
      console.log(`   -> Tamanho já existe (ID: ${sizeId})`);
    } else {
      const [res]: any = await conn.execute(
        `INSERT INTO sizes (name, code, sort_order) VALUES ('Tamanho Único', 'UNI', 1)`
      );
      sizeId = res.insertId;
      console.log(`   -> Tamanho criado (ID: ${sizeId})`);
    }

    // ---------------------------------------------------------
    // 4. COR (Busca ou Cria)
    // ---------------------------------------------------------
    console.log("🎨 Verificando Cor...");
    let colorId;
    const [colors]: any = await conn.execute("SELECT id FROM colors WHERE code = 'PRETO'");

    if (colors.length > 0) {
      colorId = colors[0].id;
      console.log(`   -> Cor já existe (ID: ${colorId})`);
    } else {
      const [res]: any = await conn.execute(
        `INSERT INTO colors (name, code, hex_code) VALUES ('Preto', 'PRETO', '#000000')`
      );
      colorId = res.insertId;
      console.log(`   -> Cor criada (ID: ${colorId})`);
    }

    // ---------------------------------------------------------
    // 5. PRODUTO (Busca ou Cria)
    // ---------------------------------------------------------
    console.log("👕 Verificando Produto...");
    let productId;
    const [prods]: any = await conn.execute("SELECT id FROM products WHERE slug = 'produto-exemplo'");

    if (prods.length > 0) {
      productId = prods[0].id;
      console.log(`   -> Produto já existe (ID: ${productId})`);
    } else {
      const [res]: any = await conn.execute(
        `INSERT INTO products (category_id, name, slug, description, price, status, is_featured, created_at, updated_at)
         VALUES (?, 'Produto Exemplo', 'produto-exemplo', 'Descrição do produto', 150.00, 'ACTIVE', 1, NOW(), NOW())`,
        [categoryId]
      );
      productId = res.insertId;
      console.log(`   -> Produto criado (ID: ${productId})`);
    }

    // ---------------------------------------------------------
    // 6. VARIANTE (Busca ou Cria)
    // ---------------------------------------------------------
    console.log("📦 Verificando Variante...");
    let variantId;
    const [vars]: any = await conn.execute(
      "SELECT id FROM product_variants WHERE product_id = ? AND size_id = ? AND color_id = ?",
      [productId, sizeId, colorId]
    );

    if (vars.length > 0) {
      variantId = vars[0].id;
      console.log(`   -> Variante já existe (ID: ${variantId})`);
    } else {
      const [res]: any = await conn.execute(
        `INSERT INTO product_variants (product_id, size_id, color_id, sku, stock, price, created_at, updated_at)
         VALUES (?, ?, ?, 'SKU-TEST-001', 100, 150.00, NOW(), NOW())`, 
        [productId, sizeId, colorId]
      );
      variantId = res.insertId;
      console.log(`   -> Variante criada (ID: ${variantId})`);
    }

    // ---------------------------------------------------------
    // 7. PEDIDO (Sempre cria um novo)
    // ---------------------------------------------------------
    console.log("🧾 Criando Novo Pedido...");
    const orderNumber = "ORD-" + Math.floor(Math.random() * 1000000);
    
    const [orderRes]: any = await conn.execute(
      `INSERT INTO orders 
       (user_id, order_number, status, payment_status, shipping_type, subtotal_amount, shipping_amount, total_amount, created_at, updated_at)
       VALUES (?, ?, 'PENDING', 'PENDING', 'DELIVERY', 150.00, 20.00, 170.00, NOW(), NOW())`,
      [userId, orderNumber]
    );
    const orderId = orderRes.insertId;

    // Itens
    await conn.execute(
      `INSERT INTO order_items (order_id, product_id, product_variant_id, product_name_snapshot, product_slug_snapshot, quantity, unit_price, total_price)
       VALUES (?, ?, ?, 'Produto Exemplo', 'produto-exemplo', 1, 150.00, 150.00)`,
      [orderId, productId, variantId]
    );

    // Envio (CORRIGIDO: ADICIONADO 'neighborhood')
    await conn.execute(
      `INSERT INTO order_shipping (order_id, recipient_name, phone, street, number, neighborhood, city, state, zip_code, country, shipping_method)
       VALUES (?, 'Cliente Teste', '11999999999', 'Rua Exemplo', '123', 'Centro', 'São Paulo', 'SP', '01000-000', 'BR', 'standard')`,
      [orderId]
    );

    await conn.commit();
    console.log(`✅ SUCESSO! Pedido criado com ID: ${orderId} | Número: ${orderNumber}`);

  } catch (error) {
    await conn.rollback();
    console.error("❌ Erro ao rodar seed:", error);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedFakeOrder();