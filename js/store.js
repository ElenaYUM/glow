/* ============================================================
   GLOW — общий слой данных (хранилище)
   localStorage: товары и корзина сохраняются между страницами.
   ============================================================ */

const GLOW = (() => {
  const KEYS = {
    products: "glow_products_v3",
    cart: "glow_cart_v3",
    wishlist: "glow_wishlist_v1",
    orders: "glow_orders_v1",
    admin: "glow_admin_session",
  };

  const FREE_SHIPPING_FROM = 3000; // ₽ — порог бесплатной доставки
  const SHIPPING_COST = 290;       // ₽ — стоимость доставки ниже порога
  const PROMOS = { GLOW10: 10, SEOUL15: 15, BEAUTY: 5 }; // промокоды → % скидки

  const ADMIN_PASSWORD = "glow2026"; // демо-пароль админки

  /* ---------- 6 категорий магазина ---------- */
  const CATEGORIES = [
    { key: "Уход за лицом",          icon: "🧴" },
    { key: "Уход за волосами",       icon: "💇" },
    { key: "Уход за телом",          icon: "🧼" },
    { key: "Декоративная косметика", icon: "💄" },
    { key: "Наборы",                 icon: "🎁" },
    { key: "Сертификаты",            icon: "🎟️" },
  ];

  /* ---------- Приглушённые тона «упаковки» ---------- */
  const TONES = {
    stone: "linear-gradient(160deg,#f3f1ee,#e7e2da)",
    sand:  "linear-gradient(160deg,#f4ede2,#ece0cf)",
    grey:  "linear-gradient(160deg,#f0f0f1,#e3e4e6)",
    blush: "linear-gradient(160deg,#f6edec,#eedcdb)",
    clay:  "linear-gradient(160deg,#f0e8e3,#e2d6cd)",
    sage:  "linear-gradient(160deg,#eef1ec,#dee5db)",
    mist:  "linear-gradient(160deg,#eef2f3,#dde6e8)",
  };

  /* ---------- Каталог ---------- */
  const SEED_PRODUCTS = [
    { id:"p1",  name:"Advanced Snail 96 Mucin Power Essence", brand:"COSRX", category:"Уход за лицом", price:1690, oldPrice:0,    rating:4.9, reviews:312, emoji:"🐌", gradient:TONES.blush, badge:"BESTSELLER", description:"Восстанавливающая эссенция с 96% муцина улитки.", stock:24 },
    { id:"p2",  name:"Glow Deep Serum Rice + Alpha Arbutin",  brand:"Beauty of Joseon", category:"Уход за лицом", price:1290, oldPrice:1690, rating:4.8, reviews:241, emoji:"🌾", gradient:TONES.sand,  badge:"NEW", description:"Сыворотка с рисом и арбутином для ровного тона.", stock:31 },
    { id:"p3",  name:"Cream Skin Toner & Moisturizer",        brand:"Laneige", category:"Уход за лицом", price:2390, oldPrice:0,    rating:4.7, reviews:128, emoji:"💧", gradient:TONES.mist,  badge:"", description:"Тонер-молочко 2-в-1: увлажняет и смягчает кожу.", stock:18 },
    { id:"p4",  name:"Heartleaf 77% Soothing Toner",          brand:"Anua", category:"Уход за лицом", price:1490, oldPrice:1790, rating:4.9, reviews:402, emoji:"🍃", gradient:TONES.sage,  badge:"BESTSELLER", description:"Успокаивающий тонер для чувствительной кожи.", stock:40 },
    { id:"p5",  name:"AHA·BHA·PHA 30 Days Miracle Toner",     brand:"Some By Mi", category:"Уход за лицом", price:1390, oldPrice:0, rating:4.6, reviews:97, emoji:"✦", gradient:TONES.grey,  badge:"", description:"Кислотный тонер против несовершенств.", stock:22 },
    { id:"p6",  name:"Birch Juice Moisturizing Sunscreen SPF50+", brand:"Round Lab", category:"Уход за лицом", price:1590, oldPrice:0, rating:4.8, reviews:176, emoji:"☀", gradient:TONES.stone, badge:"NEW", description:"Увлажняющий санскрин без белёсости.", stock:27 },
    { id:"p7",  name:"Dive-In Low Molecular Hyaluronic Serum", brand:"Torriden", category:"Уход за лицом", price:1190, oldPrice:1490, rating:4.8, reviews:215, emoji:"💧", gradient:TONES.mist, badge:"", description:"Сыворотка с 5 видами гиалуроновой кислоты.", stock:35 },
    { id:"p8",  name:"Zero Pore Pad 2.0",                     brand:"Numbuzin", category:"Уход за лицом", price:1790, oldPrice:0, rating:4.7, reviews:88, emoji:"◍", gradient:TONES.blush, badge:"BESTSELLER", description:"Пады для сужения пор и отшелушивания.", stock:16 },
    { id:"p9",  name:"Green Tea Seed Hyaluronic Cream",       brand:"Innisfree", category:"Уход за лицом", price:1990, oldPrice:2390, rating:4.6, reviews:143, emoji:"🍵", gradient:TONES.sage, badge:"", description:"Питательный крем с зелёным чаем Чеджу.", stock:29 },
    { id:"p10", name:"Collagen Niacinamide Sheet Mask",       brand:"Medicube", category:"Уход за лицом", price:990,  oldPrice:1290, rating:4.7, reviews:264, emoji:"❑", gradient:TONES.clay, badge:"NEW", description:"Тканевая маска с коллагеном и ниацинамидом.", stock:50 },
    { id:"p11", name:"Perfect Serum Original Repair",         brand:"Mise en Scene", category:"Уход за волосами", price:1090, oldPrice:0, rating:4.8, reviews:189, emoji:"💇", gradient:TONES.sand, badge:"BESTSELLER", description:"Несмываемая сыворотка для повреждённых волос.", stock:38 },
    { id:"p12", name:"Damage Care Repair Hair Mask",          brand:"Daeng Gi Meo Ri", category:"Уход за волосами", price:1450, oldPrice:1850, rating:4.6, reviews:74, emoji:"🧴", gradient:TONES.grey, badge:"", description:"Глубоко восстанавливающая маска для волос.", stock:21 },
    { id:"p13", name:"Ceramide Ato Concentrate Lotion",       brand:"Illiyoon", category:"Уход за телом", price:1290, oldPrice:0, rating:4.9, reviews:356, emoji:"🧼", gradient:TONES.mist, badge:"BESTSELLER", description:"Лосьон для тела с керамидами, для сухой кожи.", stock:44 },
    { id:"p14", name:"Rice Daily Body Wash",                  brand:"Round Lab", category:"Уход за телом", price:890, oldPrice:1190, rating:4.7, reviews:62, emoji:"🛁", gradient:TONES.sand, badge:"NEW", description:"Мягкий гель для душа с экстрактом риса.", stock:33 },
    { id:"p15", name:"Juicy Lasting Tint",                    brand:"rom&nd", category:"Декоративная косметика", price:790, oldPrice:0, rating:4.9, reviews:421, emoji:"💄", gradient:TONES.blush, badge:"BESTSELLER", description:"Стойкий тинт для губ с сочным финишем.", stock:60 },
    { id:"p16", name:"Better Than Eyes Palette",              brand:"rom&nd", category:"Декоративная косметика", price:1690, oldPrice:1990, rating:4.8, reviews:97, emoji:"🎨", gradient:TONES.clay, badge:"", description:"Палетка теней из 10 оттенков.", stock:19 },
    { id:"p17", name:"GLOW Starter Routine Set",              brand:"GLOW", category:"Наборы", price:3990, oldPrice:5200, rating:5.0, reviews:54, emoji:"🎁", gradient:TONES.stone, badge:"NEW", description:"Стартовый набор ухода: тонер, сыворотка, крем, SPF.", stock:15 },
    { id:"p18", name:"Подарочный сертификат GLOW",            brand:"GLOW", category:"Сертификаты", price:2000, oldPrice:0, rating:5.0, reviews:23, emoji:"🎟️", gradient:TONES.grey, badge:"", description:"Электронный сертификат на любую сумму.", stock:999 },
  ];

  /* ---------- Утилиты ---------- */
  const read = (key, fb) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const write = (key, v) => localStorage.setItem(key, JSON.stringify(v));

  /* ---------- Товары ---------- */
  function getProducts() {
    let p = read(KEYS.products, null);
    if (!p) { p = SEED_PRODUCTS; write(KEYS.products, p); }
    return p;
  }
  function saveProducts(p) { write(KEYS.products, p); }
  function addProduct(d) {
    const products = getProducts();
    products.unshift({
      id: "p" + Date.now(),
      name: d.name, brand: d.brand, category: d.category,
      price: Number(d.price) || 0, oldPrice: Number(d.oldPrice) || 0,
      rating: Number(d.rating) || 5, reviews: Number(d.reviews) || 0,
      emoji: d.emoji || "🧴", gradient: d.gradient || TONES.stone,
      badge: d.badge || "", description: d.description || "", stock: Number(d.stock) || 0,
    });
    saveProducts(products);
  }
  function updateProduct(id, d) {
    const products = getProducts();
    const i = products.findIndex((p) => p.id === id);
    if (i === -1) return null;
    products[i] = { ...products[i], ...d,
      price: Number(d.price), oldPrice: Number(d.oldPrice) || 0,
      rating: Number(d.rating) || products[i].rating, reviews: Number(d.reviews) || 0,
      stock: Number(d.stock) };
    saveProducts(products);
    return products[i];
  }
  function deleteProduct(id) { saveProducts(getProducts().filter((p) => p.id !== id)); }
  function resetProducts() { write(KEYS.products, SEED_PRODUCTS); }
  function getCategories() { return CATEGORIES; }
  function countByCategory(key) { return getProducts().filter((p) => p.category === key).length; }
  function discountPercent(p) { return p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }

  /* ---------- Корзина ---------- */
  function getCart() { return read(KEYS.cart, []); }
  function saveCart(c) { write(KEYS.cart, c); }
  function addToCart(id, qty = 1) {
    const c = getCart();
    const it = c.find((i) => i.id === id);
    if (it) it.qty += qty; else c.push({ id, qty });
    saveCart(c); return c;
  }
  function setQty(id, qty) {
    let c = getCart();
    if (qty <= 0) c = c.filter((i) => i.id !== id);
    else { const it = c.find((i) => i.id === id); if (it) it.qty = qty; }
    saveCart(c); return c;
  }
  function removeFromCart(id) { const c = getCart().filter((i) => i.id !== id); saveCart(c); return c; }
  function clearCart() { saveCart([]); }
  function cartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }
  function cartDetailed() {
    const products = getProducts();
    return getCart().map((i) => {
      const p = products.find((pr) => pr.id === i.id);
      return p ? { ...p, qty: i.qty, total: p.price * i.qty } : null;
    }).filter(Boolean);
  }
  function cartTotal() { return cartDetailed().reduce((s, i) => s + i.total, 0); }
  function cartSavings() {
    return cartDetailed().reduce((s, i) => s + (i.oldPrice > i.price ? (i.oldPrice - i.price) * i.qty : 0), 0);
  }
  function shippingInfo() {
    const total = cartTotal();
    const free = total >= FREE_SHIPPING_FROM || total === 0;
    return { total, free, threshold: FREE_SHIPPING_FROM, cost: free ? 0 : SHIPPING_COST,
      remain: Math.max(0, FREE_SHIPPING_FROM - total), progress: Math.min(1, total / FREE_SHIPPING_FROM) };
  }

  /* ---------- Избранное ---------- */
  function getWishlist() { return read(KEYS.wishlist, []); }
  function toggleWishlist(id) {
    let w = getWishlist();
    if (w.includes(id)) w = w.filter((x) => x !== id); else w.push(id);
    write(KEYS.wishlist, w); return w;
  }
  function inWishlist(id) { return getWishlist().includes(id); }
  function wishlistCount() { return getWishlist().length; }
  function wishlistProducts() {
    const p = getProducts();
    return getWishlist().map((id) => p.find((x) => x.id === id)).filter(Boolean);
  }

  /* ---------- Промокоды ---------- */
  function validatePromo(code) {
    const c = (code || "").trim().toUpperCase();
    return PROMOS[c] ? { valid: true, code: c, percent: PROMOS[c] } : { valid: false };
  }

  /* ---------- Заказы ---------- */
  function getOrders() { return read(KEYS.orders, []); }
  function saveOrder(data) {
    const orders = getOrders();
    const order = { ...data, num: "GL-" + (1001 + orders.length), createdAt: new Date().toLocaleString("ru-RU") };
    orders.unshift(order);
    write(KEYS.orders, orders);
    return order;
  }

  /* ---------- Админ ---------- */
  function login(pw) { if (pw === ADMIN_PASSWORD) { sessionStorage.setItem(KEYS.admin, "1"); return true; } return false; }
  function isAdmin() { return sessionStorage.getItem(KEYS.admin) === "1"; }
  function logout() { sessionStorage.removeItem(KEYS.admin); }

  function formatPrice(n) { return new Intl.NumberFormat("ru-RU").format(n) + " ₽"; }

  return {
    TONES, CATEGORIES,
    getProducts, saveProducts, addProduct, updateProduct, deleteProduct,
    resetProducts, getCategories, countByCategory, discountPercent,
    getCart, addToCart, setQty, removeFromCart, clearCart,
    cartCount, cartDetailed, cartTotal, cartSavings, shippingInfo,
    getWishlist, toggleWishlist, inWishlist, wishlistCount, wishlistProducts,
    validatePromo, getOrders, saveOrder,
    login, isAdmin, logout, formatPrice,
  };
})();
