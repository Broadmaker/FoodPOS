import * as SQLite from 'expo-sqlite';

let db = null;

// ─── OPEN / INIT ──────────────────────────────────────────────────────────────
export const getDatabase = () => {
  if (!db) {
    db = SQLite.openDatabaseSync('foodpos.db');
  }
  return db;
};

export const initDatabase = async () => {
  const database = getDatabase();

  // Categories
  database.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🍽️',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Menu Items
  database.execSync(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      category_id INTEGER,
      image_emoji TEXT DEFAULT '🍽️',
      image_uri TEXT DEFAULT NULL,
      is_available INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      stock INTEGER DEFAULT -1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // Orders
  database.execSync(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'pending',
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      amount_tendered REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      cash_amount REAL DEFAULT 0,
      gcash_amount REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      cashier TEXT DEFAULT 'Staff',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
  `);

  // Order Items
  database.execSync(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal REAL NOT NULL,
      notes TEXT DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );
  `);

  // Staff
  database.execSync(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier',
      pin TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Settings
  database.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed if empty
  await seedIfEmpty(database);
  seedStaffIfEmpty();
  // Migration: add image_uri column if it doesn't exist
  try {
    database.execSync('ALTER TABLE menu_items ADD COLUMN image_uri TEXT DEFAULT NULL');
  } catch (_) { /* column already exists */ }
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const seedIfEmpty = async (database) => {
  const cats = database.getAllSync('SELECT COUNT(*) as count FROM categories');
  if (cats[0].count > 0) return;

  // Seed categories — Café / Fast Food / Carinderia mix
  const categories = [
    { name: 'Rice Meals', icon: '🍚', sort_order: 1 },
    { name: 'Silog', icon: '🍳', sort_order: 2 },
    { name: 'Snacks', icon: '🍟', sort_order: 3 },
    { name: 'Coffee', icon: '☕', sort_order: 4 },
    { name: 'Drinks', icon: '🥤', sort_order: 5 },
    { name: 'Desserts', icon: '🍰', sort_order: 6 },
    { name: 'Extras', icon: '➕', sort_order: 7 },
  ];

  categories.forEach((cat) => {
    database.runSync(
      'INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)',
      [cat.name, cat.icon, cat.sort_order]
    );
  });

  // Seed menu items
  const items = [
    // Rice Meals (cat 1) — Carinderia staples
    { name: 'Chicken Adobo', description: 'Classic adobo sa puti o toyo, with steamed rice', price: 85, category_id: 1, image_emoji: '🍗', is_featured: 1 },
    { name: 'Pork Sinigang', description: 'Sour tamarind broth with pork ribs', price: 95, category_id: 1, image_emoji: '🍲', is_featured: 1 },
    { name: 'Beef Caldereta', description: 'Rich tomato & liver spread beef stew', price: 115, category_id: 1, image_emoji: '🥩' },
    { name: 'Fried Tilapia', description: 'Crispy whole tilapia with garlic rice', price: 75, category_id: 1, image_emoji: '🐟' },
    { name: 'Pork BBQ + Rice', description: 'Grilled pork BBQ (2 sticks) with sinangag', price: 85, category_id: 1, image_emoji: '🍖', is_featured: 1 },
    { name: 'Chopsuey', description: 'Stir-fried mixed veggies with pork', price: 70, category_id: 1, image_emoji: '🥦' },

    // Silog (cat 2) — Café / Fast Food breakfast
    { name: 'Tapsilog', description: 'Beef tapa + sinangag + itlog', price: 85, category_id: 2, image_emoji: '🍳', is_featured: 1 },
    { name: 'Longsilog', description: 'Longganisa + sinangag + itlog', price: 80, category_id: 2, image_emoji: '🌭' },
    { name: 'Bangsilog', description: 'Bangus belly + sinangag + itlog', price: 90, category_id: 2, image_emoji: '🐠' },
    { name: 'Hotsilog', description: 'Hotdog + sinangag + itlog', price: 65, category_id: 2, image_emoji: '🥚' },
    { name: 'Cornsilog', description: 'Corned beef + sinangag + itlog', price: 75, category_id: 2, image_emoji: '🥫' },

    // Snacks (cat 3) — Fast food / Carinderia
    { name: 'Lumpia Shanghai', description: 'Crispy pork spring rolls (5 pcs)', price: 45, category_id: 3, image_emoji: '🌯' },
    { name: 'Kwek-Kwek', description: 'Deep-fried quail eggs in orange batter (5 pcs)', price: 30, category_id: 3, image_emoji: '🍡' },
    { name: 'French Fries', description: 'Crispy salted fries', price: 45, category_id: 3, image_emoji: '🍟' },
    { name: 'Tokwa\'t Baboy', description: 'Fried tofu and pork ear with spiced vinegar', price: 55, category_id: 3, image_emoji: '🫕' },
    { name: 'Fishball (10 pcs)', description: 'Fried fishball with sweet chili sauce', price: 25, category_id: 3, image_emoji: '🐠', is_featured: 1 },

    // Coffee (cat 4) — Café
    { name: 'Brewed Coffee', description: 'Hot or iced drip-brewed coffee', price: 55, category_id: 4, image_emoji: '☕', is_featured: 1 },
    { name: 'Iced Americano', description: 'Espresso shots over ice', price: 75, category_id: 4, image_emoji: '🧊' },
    { name: 'Café Latte', description: 'Espresso with steamed milk', price: 95, category_id: 4, image_emoji: '🥛', is_featured: 1 },
    { name: 'Caramel Macchiato', description: 'Vanilla latte with caramel drizzle', price: 105, category_id: 4, image_emoji: '🍯' },
    { name: 'Spanish Latte', description: 'Espresso with condensed milk', price: 100, category_id: 4, image_emoji: '☕' },
    { name: '3-in-1 Coffee', description: 'Classic instant 3-in-1 sachet', price: 25, category_id: 4, image_emoji: '🫙' },

    // Drinks (cat 5)
    { name: 'Sago\'t Gulaman', description: 'Brown sugar syrup with sago and gulaman', price: 35, category_id: 5, image_emoji: '🧋', is_featured: 1 },
    { name: 'Buko Juice', description: 'Fresh young coconut juice', price: 45, category_id: 5, image_emoji: '🥥' },
    { name: 'Calamansi Juice', description: 'Fresh-squeezed calamansi lemonade', price: 40, category_id: 5, image_emoji: '🍋' },
    { name: 'Softdrink Regular', description: 'Coke, Sprite, or Royal (8oz)', price: 30, category_id: 5, image_emoji: '🥤' },
    { name: 'Bottled Water', description: '500ml mineral water', price: 20, category_id: 5, image_emoji: '💧' },
    { name: 'Iced Tea', description: 'Sweetened black iced tea (large)', price: 35, category_id: 5, image_emoji: '🫖' },

    // Desserts (cat 6)
    { name: 'Halo-Halo', description: 'Shaved ice with mixed beans, gulaman & leche flan', price: 75, category_id: 6, image_emoji: '🍧', is_featured: 1 },
    { name: 'Leche Flan', description: 'Classic steamed caramel custard', price: 55, category_id: 6, image_emoji: '🍮' },
    { name: 'Mais con Yelo', description: 'Sweet corn with shaved ice and milk', price: 40, category_id: 6, image_emoji: '🌽' },

    // Extras (cat 7)
    { name: 'Extra Rice', description: 'Plain steamed white rice', price: 15, category_id: 7, image_emoji: '🍚' },
    { name: 'Extra Egg', description: 'Fried or sunny side up', price: 15, category_id: 7, image_emoji: '🥚' },
    { name: 'Extra Sauce', description: 'Gravy, atsara, or dipping sauce', price: 10, category_id: 7, image_emoji: '🥄' },
  ];

  items.forEach((item) => {
    database.runSync(
      `INSERT INTO menu_items (name, description, price, category_id, image_emoji, is_featured)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item.name, item.description, item.price, item.category_id, item.image_emoji, item.is_featured || 0]
    );
  });

  // Default settings
  const defaults = [
    ['shop_name', 'My Food Shop'],
    ['shop_address', '123 Main Street'],
    ['shop_phone', '09XX-XXX-XXXX'],
    ['tax_rate', '0'],
    ['currency', '₱'],
    ['receipt_footer', 'Thank you for dining with us!'],
    ['cashier_name', 'Staff'],
  ];
  defaults.forEach(([key, value]) => {
    database.runSync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  });
};

// ─── STAFF ────────────────────────────────────────────────────────────────────
// Simple 4-digit PIN stored as plain string (no sensitive data risk for local POS)
export const getStaff = () => {
  const database = getDatabase();
  return database.getAllSync('SELECT * FROM staff WHERE is_active = 1 ORDER BY role DESC, name ASC');
};

export const getStaffById = (id) => {
  const database = getDatabase();
  return database.getFirstSync('SELECT * FROM staff WHERE id = ?', [id]);
};

export const verifyPin = (id, pin) => {
  const database = getDatabase();
  const staff = database.getFirstSync('SELECT * FROM staff WHERE id = ? AND pin = ? AND is_active = 1', [id, pin]);
  return staff || null;
};

export const addStaff = (name, role, pin) => {
  const database = getDatabase();
  return database.runSync(
    'INSERT INTO staff (name, role, pin) VALUES (?, ?, ?)',
    [name, role, pin]
  );
};

export const updateStaff = (id, name, role, pin) => {
  const database = getDatabase();
  if (pin) {
    return database.runSync('UPDATE staff SET name=?, role=?, pin=? WHERE id=?', [name, role, pin, id]);
  }
  return database.runSync('UPDATE staff SET name=?, role=? WHERE id=?', [name, role, id]);
};

export const deleteStaff = (id) => {
  const database = getDatabase();
  return database.runSync('UPDATE staff SET is_active = 0 WHERE id = ?', [id]);
};

export const seedStaffIfEmpty = () => {
  const database = getDatabase();
  const count = database.getFirstSync('SELECT COUNT(*) as count FROM staff');
  if (count.count > 0) return;
  // Default admin: PIN 1234, Default cashier: PIN 0000
  database.runSync("INSERT INTO staff (name, role, pin) VALUES ('Admin', 'admin', '1234')");
  database.runSync("INSERT INTO staff (name, role, pin) VALUES ('Staff', 'cashier', '0000')");
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const getCategories = () => {
  const database = getDatabase();
  return database.getAllSync('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC');
};

export const addCategory = (name, icon = '🍽️') => {
  const database = getDatabase();
  return database.runSync('INSERT INTO categories (name, icon) VALUES (?, ?)', [name, icon]);
};

export const updateCategory = (id, name, icon) => {
  const database = getDatabase();
  return database.runSync('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [name, icon, id]);
};

export const deleteCategory = (id) => {
  const database = getDatabase();
  database.runSync('UPDATE menu_items SET category_id = NULL WHERE category_id = ?', [id]);
  return database.runSync('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
};

export const getCategoryItemCount = (id) => {
  const database = getDatabase();
  const row = database.getFirstSync(
    'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ? AND is_available = 1',
    [id]
  );
  return row?.count || 0;
};

export const reorderCategory = (id, direction, allCategories) => {
  const database = getDatabase();
  const idx = allCategories.findIndex(c => c.id === id);
  if (idx < 0) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= allCategories.length) return;
  const a = allCategories[idx];
  const b = allCategories[swapIdx];
  database.runSync('UPDATE categories SET sort_order = ? WHERE id = ?', [b.sort_order, a.id]);
  database.runSync('UPDATE categories SET sort_order = ? WHERE id = ?', [a.sort_order, b.id]);
};

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────
export const getMenuItems = (categoryId = null) => {
  const database = getDatabase();
  if (categoryId) {
    return database.getAllSync(
      'SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.category_id = ? AND mi.is_available = 1 ORDER BY mi.name ASC',
      [categoryId]
    );
  }
  return database.getAllSync(
    'SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.is_available = 1 ORDER BY mi.name ASC'
  );
};

export const searchMenuItems = (query) => {
  const database = getDatabase();
  return database.getAllSync(
    'SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.name LIKE ? AND mi.is_available = 1 ORDER BY mi.name ASC',
    [`%${query}%`]
  );
};

export const addMenuItem = (item) => {
  const database = getDatabase();
  return database.runSync(
    `INSERT INTO menu_items (name, description, price, category_id, image_emoji, image_uri, is_available, is_featured, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.name, item.description || '', item.price, item.category_id, item.image_emoji || null, item.image_uri || null, item.is_available ? 1 : 0, item.is_featured ? 1 : 0, item.stock || -1]
  );
};

export const updateMenuItem = (id, item) => {
  const database = getDatabase();
  return database.runSync(
    `UPDATE menu_items SET name=?, description=?, price=?, category_id=?, image_emoji=?, image_uri=?, is_available=?, is_featured=?, updated_at=datetime('now') WHERE id=?`,
    [item.name, item.description, item.price, item.category_id, item.image_emoji || null, item.image_uri || null, item.is_available ? 1 : 0, item.is_featured ? 1 : 0, id]
  );
};

export const deleteMenuItem = (id) => {
  const database = getDatabase();
  return database.runSync('UPDATE menu_items SET is_available = 0 WHERE id = ?', [id]);
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────
const generateOrderNumber = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = Date.now().toString().slice(-5);
  return `ORD-${date}-${time}`;
};

export const createOrder = (orderData, items) => {
  const database = getDatabase();
  const orderNumber = generateOrderNumber();

  const orderResult = database.runSync(
    `INSERT INTO orders (order_number, status, subtotal, discount, tax, total, payment_method, amount_tendered, change_amount, cash_amount, gcash_amount, notes, cashier, completed_at, created_at)
     VALUES (?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderNumber,
      orderData.subtotal,
      orderData.discount || 0,
      orderData.tax || 0,
      orderData.total,
      orderData.paymentMethod,
      orderData.amountTendered || orderData.total,
      orderData.changeAmount || 0,
      orderData.cashAmount || 0,
      orderData.gcashAmount || 0,
      orderData.notes || '',
      orderData.cashier || 'Staff',
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  );

  const orderId = orderResult.lastInsertRowId;

  items.forEach((item) => {
    database.runSync(
      `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, subtotal, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity, item.notes || '']
    );
  });

  return { orderId, orderNumber };
};

export const getOrders = (limit = 50, offset = 0) => {
  const database = getDatabase();
  return database.getAllSync(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
};

export const getOrderById = (id) => {
  const database = getDatabase();
  const order = database.getFirstSync('SELECT * FROM orders WHERE id = ?', [id]);
  if (order) {
    order.items = database.getAllSync('SELECT * FROM order_items WHERE order_id = ?', [id]);
  }
  return order;
};

export const voidOrder = (id) => {
  const database = getDatabase();
  return database.runSync("UPDATE orders SET status = 'voided' WHERE id = ?", [id]);
};

// ─── DASHBOARD / REPORTS ──────────────────────────────────────────────────────
export const getDailySummary = (date = null) => {
  const database = getDatabase();
  const targetDate = date || new Date().toISOString().slice(0, 10);

  const summary = database.getFirstSync(
    `SELECT
       COUNT(*) as total_orders,
       SUM(total) as total_sales,
       SUM(discount) as total_discounts,
       AVG(total) as avg_order_value
     FROM orders
     WHERE DATE(created_at) = ? AND status = 'completed'`,
    [targetDate]
  );

  const byPayment = database.getAllSync(
    `SELECT payment_method, COUNT(*) as count, SUM(total) as total
     FROM orders WHERE DATE(created_at) = ? AND status = 'completed'
     GROUP BY payment_method`,
    [targetDate]
  );

  const topItems = database.getAllSync(
    `SELECT oi.name, SUM(oi.quantity) as qty_sold, SUM(oi.subtotal) as total_sales
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE DATE(o.created_at) = ? AND o.status = 'completed'
     GROUP BY oi.name
     ORDER BY qty_sold DESC LIMIT 5`,
    [targetDate]
  );

  const hourlySales = database.getAllSync(
    `SELECT strftime('%H', created_at) as hour, COUNT(*) as orders, SUM(total) as sales
     FROM orders WHERE DATE(created_at) = ? AND status = 'completed'
     GROUP BY hour ORDER BY hour`,
    [targetDate]
  );

  return { summary, byPayment, topItems, hourlySales, date: targetDate };
};

export const getWeeklySummary = () => {
  const database = getDatabase();
  return database.getAllSync(
    `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total) as sales
     FROM orders WHERE created_at >= datetime('now', '-7 days') AND status = 'completed'
     GROUP BY DATE(created_at) ORDER BY date ASC`
  );
};

// ─── ORDERS — FILTERED QUERIES ───────────────────────────────────────────────
export const getOrdersFiltered = ({ search = '', dateFrom = null, dateTo = null, paymentMethod = null, status = null, limit = 100 } = {}) => {
  const database = getDatabase();
  let where = [];
  let params = [];

  if (search.trim()) {
    where.push("order_number LIKE ?");
    params.push(`%${search.trim()}%`);
  }
  if (dateFrom) { where.push("DATE(created_at) >= ?"); params.push(dateFrom); }
  if (dateTo)   { where.push("DATE(created_at) <= ?"); params.push(dateTo); }
  if (paymentMethod) { where.push("payment_method = ?"); params.push(paymentMethod); }
  if (status)   { where.push("status = ?"); params.push(status); }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  params.push(limit);

  return database.getAllSync(
    `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ?`,
    params
  );
};

export const getOrdersDateRange = (dateFrom, dateTo) => {
  const database = getDatabase();
  return database.getAllSync(
    `SELECT * FROM orders WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC`,
    [dateFrom, dateTo]
  );
};

// ─── DASHBOARD — EXTENDED REPORTS ────────────────────────────────────────────
export const getMonthlySummary = () => {
  const database = getDatabase();
  return database.getAllSync(
    `SELECT 
       strftime('%Y-%m', created_at) as month,
       COUNT(*) as orders,
       SUM(total) as sales,
       AVG(total) as avg_order
     FROM orders
     WHERE created_at >= datetime('now', '-6 months') AND status = 'completed'
     GROUP BY month ORDER BY month ASC`
  );
};

export const getWeeklySalesDetails = () => {
  const database = getDatabase();
  return database.getAllSync(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as orders,
       SUM(total) as sales,
       SUM(discount) as discounts
     FROM orders
     WHERE created_at >= datetime('now', '-7 days') AND status = 'completed'
     GROUP BY DATE(created_at) ORDER BY date ASC`
  );
};

export const getTopItemsRange = (dateFrom, dateTo, limit = 10) => {
  const database = getDatabase();
  return database.getAllSync(
    `SELECT oi.name, SUM(oi.quantity) as qty_sold, SUM(oi.subtotal) as total_sales
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE DATE(o.created_at) BETWEEN ? AND ? AND o.status = 'completed'
     GROUP BY oi.name ORDER BY qty_sold DESC LIMIT ?`,
    [dateFrom, dateTo, limit]
  );
};

export const getSalesSummaryRange = (dateFrom, dateTo) => {
  const database = getDatabase();
  const summary = database.getFirstSync(
    `SELECT COUNT(*) as total_orders, SUM(total) as total_sales,
            SUM(discount) as total_discounts, AVG(total) as avg_order_value
     FROM orders WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'`,
    [dateFrom, dateTo]
  );
  const byPayment = database.getAllSync(
    `SELECT payment_method, COUNT(*) as count, SUM(total) as total
     FROM orders WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
     GROUP BY payment_method`,
    [dateFrom, dateTo]
  );
  const byDay = database.getAllSync(
    `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total) as sales
     FROM orders WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [dateFrom, dateTo]
  );
  return { summary, byPayment, byDay };
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export const getSetting = (key) => {
  const database = getDatabase();
  const row = database.getFirstSync('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
};

export const getSettings = () => {
  const database = getDatabase();
  const rows = database.getAllSync('SELECT * FROM settings');
  return rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
};

export const setSetting = (key, value) => {
  const database = getDatabase();
  return database.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
};