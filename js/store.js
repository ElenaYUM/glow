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
    slides: "glow_slides_v1",
    cats: "glow_cats_v2",       // теперь хранит полный список категорий с подкатегориями
    reviews: "glow_reviews_v1", // отзывы покупателей
    blog: "glow_blog_v1",       // статьи блога
    admin: "glow_admin_session",
  };

  const FREE_SHIPPING_FROM = 3000; // Br — порог бесплатной доставки
  const SHIPPING_COST = 290;       // Br — стоимость доставки ниже порога
  const PROMOS = { GLOW10: 10, SEOUL15: 15, BEAUTY: 5 }; // промокоды → % скидки

  const ADMIN_PASSWORD = "Yum30555"; // пароль админки

  /* ---------- Категории магазина (с подкатегориями) ---------- */
  const SEED_CATEGORIES = [
    { id: "c1", name: "Уход за лицом",          icon: "🧴", image: "", subs: ["Тонеры", "Сыворотки и эссенции", "Кремы для лица", "Маски", "Очищение", "Патчи для глаз", "Солнцезащита (SPF)", "Пилинги и скрабы"] },
    { id: "c2", name: "Уход за волосами",       icon: "💇", image: "", subs: ["Шампуни", "Маски и бальзамы", "Несмываемый уход", "Стайлинг"] },
    { id: "c3", name: "Уход за телом",          icon: "🧼", image: "", subs: ["Гели для душа", "Лосьоны и кремы", "Скрабы для тела", "Дезодоранты"] },
    { id: "c4", name: "Декоративная косметика", icon: "💄", image: "", subs: ["Губы", "Глаза", "Лицо", "Брови"] },
    { id: "c5", name: "Наборы",                 icon: "🎁", image: "", subs: [] },
    { id: "c6", name: "Сертификаты",            icon: "🎟️", image: "", subs: [] },
  ];

  /* ---------- Слайды главного баннера ---------- */
  const SEED_SLIDES = [
    { id:"s1", tone:"t1", emoji:"💆‍♀️", image:"", title:"GLOW", pill:"full-size в подарок", subtitle:"при покупке от 15 000 Br", btn:"в каталог", link:"#catalog" },
    { id:"s2", tone:"t2", emoji:"💄", image:"", title:"−30%", pill:"сезон распродаж", subtitle:"на бестселлеры COSRX, Anua и Beauty of Joseon", btn:"смотреть акции", link:"#sale" },
    { id:"s3", tone:"t3", emoji:"✨", image:"", title:"Наборы", pill:"готовый ритуал ухода", subtitle:"тонер, сыворотка, крем и SPF со скидкой до 25%", btn:"выбрать набор", link:"#catalog" },
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
    { id:"p1",  name:"Advanced Snail 96 Mucin Power Essence", brand:"COSRX", category:"Уход за лицом", subcategory:"Сыворотки и эссенции", price:1690, oldPrice:0,    rating:4.9, reviews:312, emoji:"🐌", gradient:TONES.blush, badge:"BESTSELLER", description:"Восстанавливающая эссенция с 96% муцина улитки.", stock:24 },
    { id:"p2",  name:"Glow Deep Serum Rice + Alpha Arbutin",  brand:"Beauty of Joseon", category:"Уход за лицом", subcategory:"Сыворотки и эссенции", price:1290, oldPrice:1690, rating:4.8, reviews:241, emoji:"🌾", gradient:TONES.sand,  badge:"NEW", description:"Сыворотка с рисом и арбутином для ровного тона.", stock:31 },
    { id:"p3",  name:"Cream Skin Toner & Moisturizer",        brand:"Laneige", category:"Уход за лицом", subcategory:"Тонеры", price:2390, oldPrice:0,    rating:4.7, reviews:128, emoji:"💧", gradient:TONES.mist,  badge:"", description:"Тонер-молочко 2-в-1: увлажняет и смягчает кожу.", stock:18 },
    { id:"p4",  name:"Heartleaf 77% Soothing Toner",          brand:"Anua", category:"Уход за лицом", subcategory:"Тонеры", price:1490, oldPrice:1790, rating:4.9, reviews:402, emoji:"🍃", gradient:TONES.sage,  badge:"BESTSELLER", description:"Успокаивающий тонер для чувствительной кожи.", stock:40 },
    { id:"p5",  name:"AHA·BHA·PHA 30 Days Miracle Toner",     brand:"Some By Mi", category:"Уход за лицом", subcategory:"Тонеры", price:1390, oldPrice:0, rating:4.6, reviews:97, emoji:"✦", gradient:TONES.grey,  badge:"", description:"Кислотный тонер против несовершенств.", stock:22 },
    { id:"p6",  name:"Birch Juice Moisturizing Sunscreen SPF50+", brand:"Round Lab", category:"Уход за лицом", subcategory:"Солнцезащита (SPF)", price:1590, oldPrice:0, rating:4.8, reviews:176, emoji:"☀", gradient:TONES.stone, badge:"NEW", description:"Увлажняющий санскрин без белёсости.", stock:27 },
    { id:"p7",  name:"Dive-In Low Molecular Hyaluronic Serum", brand:"Torriden", category:"Уход за лицом", subcategory:"Сыворотки и эссенции", price:1190, oldPrice:1490, rating:4.8, reviews:215, emoji:"💧", gradient:TONES.mist, badge:"", description:"Сыворотка с 5 видами гиалуроновой кислоты.", stock:35 },
    { id:"p8",  name:"Zero Pore Pad 2.0",                     brand:"Numbuzin", category:"Уход за лицом", subcategory:"Пилинги и скрабы", price:1790, oldPrice:0, rating:4.7, reviews:88, emoji:"◍", gradient:TONES.blush, badge:"BESTSELLER", description:"Пады для сужения пор и отшелушивания.", stock:16 },
    { id:"p9",  name:"Green Tea Seed Hyaluronic Cream",       brand:"Innisfree", category:"Уход за лицом", subcategory:"Кремы для лица", price:1990, oldPrice:2390, rating:4.6, reviews:143, emoji:"🍵", gradient:TONES.sage, badge:"", description:"Питательный крем с зелёным чаем Чеджу.", stock:29 },
    { id:"p10", name:"Collagen Niacinamide Sheet Mask",       brand:"Medicube", category:"Уход за лицом", subcategory:"Маски", price:990,  oldPrice:1290, rating:4.7, reviews:264, emoji:"❑", gradient:TONES.clay, badge:"NEW", description:"Тканевая маска с коллагеном и ниацинамидом.", stock:50 },
    { id:"p11", name:"Perfect Serum Original Repair",         brand:"Mise en Scene", category:"Уход за волосами", subcategory:"Несмываемый уход", price:1090, oldPrice:0, rating:4.8, reviews:189, emoji:"💇", gradient:TONES.sand, badge:"BESTSELLER", description:"Несмываемая сыворотка для повреждённых волос.", stock:38 },
    { id:"p12", name:"Damage Care Repair Hair Mask",          brand:"Daeng Gi Meo Ri", category:"Уход за волосами", subcategory:"Маски и бальзамы", price:1450, oldPrice:1850, rating:4.6, reviews:74, emoji:"🧴", gradient:TONES.grey, badge:"", description:"Глубоко восстанавливающая маска для волос.", stock:21 },
    { id:"p13", name:"Ceramide Ato Concentrate Lotion",       brand:"Illiyoon", category:"Уход за телом", subcategory:"Лосьоны и кремы", price:1290, oldPrice:0, rating:4.9, reviews:356, emoji:"🧼", gradient:TONES.mist, badge:"BESTSELLER", description:"Лосьон для тела с керамидами, для сухой кожи.", stock:44 },
    { id:"p14", name:"Rice Daily Body Wash",                  brand:"Round Lab", category:"Уход за телом", subcategory:"Гели для душа", price:890, oldPrice:1190, rating:4.7, reviews:62, emoji:"🛁", gradient:TONES.sand, badge:"NEW", description:"Мягкий гель для душа с экстрактом риса.", stock:33 },
    { id:"p15", name:"Juicy Lasting Tint",                    brand:"rom&nd", category:"Декоративная косметика", subcategory:"Губы", price:790, oldPrice:0, rating:4.9, reviews:421, emoji:"💄", gradient:TONES.blush, badge:"BESTSELLER", description:"Стойкий тинт для губ с сочным финишем.", stock:60 },
    { id:"p16", name:"Better Than Eyes Palette",              brand:"rom&nd", category:"Декоративная косметика", subcategory:"Глаза", price:1690, oldPrice:1990, rating:4.8, reviews:97, emoji:"🎨", gradient:TONES.clay, badge:"", description:"Палетка теней из 10 оттенков.", stock:19 },
    { id:"p17", name:"GLOW Starter Routine Set",              brand:"GLOW", category:"Наборы", subcategory:"", price:3990, oldPrice:5200, rating:5.0, reviews:54, emoji:"🎁", gradient:TONES.stone, badge:"NEW", description:"Стартовый набор ухода: тонер, сыворотка, крем, SPF.", stock:15 },
    { id:"p18", name:"Подарочный сертификат GLOW",            brand:"GLOW", category:"Сертификаты", subcategory:"", price:2000, oldPrice:0, rating:5.0, reviews:23, emoji:"🎟️", gradient:TONES.grey, badge:"", description:"Электронный сертификат на любую сумму.", stock:999 },
  ];

  /* ---------- Отзывы покупателей ---------- */
  const SEED_REVIEWS = [
    { id:"r1", name:"Алина К.", city:"Минск", rating:5, avatar:"🙋‍♀️", text:"Заказываю уже третий раз. Всё оригинал, упаковано идеально, доставка быстрая. Кожа реально стала лучше с эссенцией COSRX!" },
    { id:"r2", name:"Дарья М.", city:"Гомель", rating:5, avatar:"👩", text:"Влюбилась в тонер Anua. Менеджер помог подобрать уход под мою чувствительную кожу. Сервис на высоте, рекомендую!" },
    { id:"r3", name:"Ольга В.", city:"Брест", rating:5, avatar:"🧑", text:"Брала набор в подарок сестре — она в восторге. Красивая упаковка, приятные сэмплы в комплекте. Спасибо GLOW!" },
  ];

  /* ---------- Блог ---------- */
  const SEED_BLOG = [
    { id:"b1", date:"12 июня 2026", title:"Корейский уход за кожей: 10 шагов простым языком", excerpt:"Разбираем, что и в каком порядке наносить, чтобы кожа сияла.", emoji:"📖", cover:"linear-gradient(120deg,#fdeef0,#f8dfe3)", image:"",
      body:"Корейский уход славится многоступенчатостью, но это не значит, что нужно наносить десять средств каждый день. Базовая рутина — это очищение, тонизирование, увлажнение и защита от солнца.\n\nУтром достаточно умыться мягкой пенкой, нанести тонер, сыворотку, увлажняющий крем и обязательно SPF. Вечером добавляется этап снятия макияжа гидрофильным маслом и, при желании, маска или кислотный тонер 1–2 раза в неделю.\n\nГлавное правило — наносить средства от самой лёгкой текстуры к самой плотной и давать каждому слою впитаться 30–60 секунд." },
    { id:"b2", date:"5 июня 2026", title:"Муцин улитки: чем полезен и кому подойдёт", excerpt:"Главный ингредиент K-beauty и как его правильно использовать.", emoji:"🧪", cover:"linear-gradient(120deg,#f3f0ec,#e9e2d6)", image:"",
      body:"Муцин улитки — это секрет, богатый гиалуроновой кислотой, гликопротеинами, пептидами и антиоксидантами. Он увлажняет, ускоряет восстановление кожи и помогает выровнять тон.\n\nЛучше всего муцин работает в формате эссенции или сыворотки, нанесённой на влажную кожу после тонера. Подходит практически всем типам кожи, включая чувствительную.\n\nЕсли у вас аллергия на морепродукты — это не противопоказание, но первый раз стоит протестировать средство на небольшом участке." },
    { id:"b3", date:"28 мая 2026", title:"SPF каждый день: выбираем санскрин без белёсости", excerpt:"Сравниваем популярные корейские солнцезащитные средства.", emoji:"☀️", cover:"linear-gradient(120deg,#eef1f3,#dfe7ea)", image:"",
      body:"Солнцезащита — самый важный шаг ухода, который замедляет фотостарение и защищает от пигментации. Корейские санскрины ценят за лёгкие текстуры без липкости и белёсого следа.\n\nИщите маркировку SPF50+ PA++++ — это максимальная защита от UVB и UVA лучей. Химические фильтры дают наиболее прозрачный финиш, минеральные — мягче для чувствительной кожи.\n\nНаносите санскрин последним шагом утреннего ухода и обновляйте каждые 2–3 часа при активном пребывании на солнце." },
  ];

  /* ---------- Утилиты ---------- */
  const read = (key, fb) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const write = (key, v) => localStorage.setItem(key, JSON.stringify(v));

  /* ============================================================
     ОБЩАЯ БАЗА В GITHUB
     Данные хранятся в файлах data/*.json репозитория.
     Чтение — публично (raw.githubusercontent), работает везде, даже из file://.
     Запись — через токен (Contents API), токен только в браузере владельца.
     localStorage используется как быстрый локальный кэш.
     ============================================================ */
  const GH_DEFAULT = { owner: "ElenaYUM", repo: "glow", branch: "main" };
  const GH_TOKEN_KEY = "glow_gh_token";
  const GH_CFG_KEY = "glow_gh_cfg";
  // dataset → { file: путь в репозитории, key: ключ кэша }
  const DATASETS = {
    products: { file: "data/products.json",   key: KEYS.products },
    cats:     { file: "data/categories.json", key: KEYS.cats },
    reviews:  { file: "data/reviews.json",     key: KEYS.reviews },
    blog:     { file: "data/blog.json",        key: KEYS.blog },
    slides:   { file: "data/slides.json",      key: KEYS.slides },
  };

  function ghConfig() { return { ...GH_DEFAULT, ...read(GH_CFG_KEY, {}) }; }
  function setGhConfig(cfg) { write(GH_CFG_KEY, { owner: (cfg.owner || "").trim(), repo: (cfg.repo || "").trim(), branch: (cfg.branch || "main").trim() }); }
  function ghToken() { return localStorage.getItem(GH_TOKEN_KEY) || ""; }
  function setGhToken(t) { if (t) localStorage.setItem(GH_TOKEN_KEY, t.trim()); else localStorage.removeItem(GH_TOKEN_KEY); }
  function hasToken() { return !!ghToken(); }

  function ghHeaders() { return { Authorization: `Bearer ${ghToken()}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" }; }
  function b64(str) { return btoa(unescape(encodeURIComponent(str))); } // безопасно для кириллицы

  // прочитать один файл из GitHub (raw, без авторизации)
  async function ghPull(dataset) {
    const c = ghConfig(), d = DATASETS[dataset];
    const url = `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch}/${d.file}?t=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }
  // подтянуть все данные из GitHub в локальный кэш (молча падает, если файла/сети нет)
  async function pullAll() {
    const results = await Promise.allSettled(Object.keys(DATASETS).map(async (ds) => {
      const data = await ghPull(ds);
      if (Array.isArray(data)) write(DATASETS[ds].key, data);
    }));
    return results.filter((r) => r.status === "fulfilled").length;
  }
  // записать текущий кэш набора данных в файл репозитория (нужен токен)
  async function ghPush(dataset, message) {
    if (!hasToken()) throw new Error("Не подключён GitHub-токен");
    const c = ghConfig(), d = DATASETS[dataset];
    const content = localStorage.getItem(d.key) || "[]";
    const pretty = JSON.stringify(JSON.parse(content), null, 2) + "\n";
    const api = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${d.file}`;
    let sha;
    const head = await fetch(`${api}?ref=${c.branch}`, { headers: ghHeaders() });
    if (head.ok) { sha = (await head.json()).sha; }
    const body = { message: message || `GLOW: обновление ${d.file}`, content: b64(pretty), branch: c.branch };
    if (sha) body.sha = sha;
    const put = await fetch(api, { method: "PUT", headers: ghHeaders(), body: JSON.stringify(body) });
    if (!put.ok) { const e = await put.json().catch(() => ({})); throw new Error(e.message || ("HTTP " + put.status)); }
    return true;
  }
  // выгрузить сразу несколько наборов
  async function ghPushMany(datasets, message) {
    for (const ds of datasets) await ghPush(ds, message);
    return true;
  }
  // проверить токен и доступ к репозиторию
  async function ghTest() {
    if (!hasToken()) throw new Error("Введите токен");
    const c = ghConfig();
    const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}`, { headers: ghHeaders() });
    if (r.status === 401) throw new Error("Токен неверный или истёк");
    if (r.status === 404) throw new Error("Репозиторий не найден или нет доступа");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    return { repo: j.full_name, canPush: !!(j.permissions && j.permissions.push) };
  }
  // стартовая синхронизация витрины/админки
  async function boot() { try { await pullAll(); } catch { /* офлайн — работаем из кэша */ } }

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
      name: d.name, brand: d.brand, category: d.category, subcategory: d.subcategory || "",
      price: Number(d.price) || 0, oldPrice: Number(d.oldPrice) || 0,
      rating: Number(d.rating) || 5, reviews: Number(d.reviews) || 0,
      emoji: d.emoji || "🧴", gradient: d.gradient || TONES.stone,
      photos: Array.isArray(d.photos) ? d.photos.filter(Boolean) : [],
      badge: d.badge || "", description: d.description || "", stock: Number(d.stock) || 0,
    });
    saveProducts(products);
  }
  function updateProduct(id, d) {
    const products = getProducts();
    const i = products.findIndex((p) => p.id === id);
    if (i === -1) return null;
    products[i] = { ...products[i], ...d,
      subcategory: d.subcategory || "",
      price: Number(d.price), oldPrice: Number(d.oldPrice) || 0,
      rating: Number(d.rating) || products[i].rating, reviews: Number(d.reviews) || 0,
      photos: Array.isArray(d.photos) ? d.photos.filter(Boolean) : (products[i].photos || []),
      stock: Number(d.stock) };
    saveProducts(products);
    return products[i];
  }
  function deleteProduct(id) { saveProducts(getProducts().filter((p) => p.id !== id)); }
  function resetProducts() { write(KEYS.products, SEED_PRODUCTS); }
  function countByCategory(key) { return getProducts().filter((p) => p.category === key).length; }
  function countBySub(catKey, sub) { return getProducts().filter((p) => p.category === catKey && p.subcategory === sub).length; }

  /* ---------- Категории и подкатегории (полностью редактируемы из админки) ---------- */
  function getCategoriesRaw() {
    let c = read(KEYS.cats, null);
    if (!c || !Array.isArray(c)) { c = SEED_CATEGORIES.map((x) => ({ ...x, subs: [...x.subs] })); write(KEYS.cats, c); }
    return c;
  }
  function saveCategories(c) { write(KEYS.cats, c); }
  // публичная форма: добавляем алиас key = name для совместимости с витриной
  function getCategories() {
    return getCategoriesRaw().map((c) => ({ id: c.id, key: c.name, name: c.name, icon: c.icon || "🧴", image: c.image || "", subs: c.subs || [] }));
  }
  function getSubcategories(catName) {
    const c = getCategoriesRaw().find((x) => x.name === catName);
    return c ? (c.subs || []) : [];
  }
  function addCategory(name, icon) {
    const list = getCategoriesRaw();
    const nm = (name || "").trim();
    if (!nm || list.some((c) => c.name === nm)) return false;
    list.push({ id: "c" + Date.now(), name: nm, icon: icon || "🏷️", image: "", subs: [] });
    saveCategories(list); return true;
  }
  function renameCategory(id, newName) {
    const list = getCategoriesRaw();
    const c = list.find((x) => x.id === id);
    const nm = (newName || "").trim();
    if (!c || !nm || (nm !== c.name && list.some((x) => x.name === nm))) return false;
    const old = c.name; c.name = nm;
    saveCategories(list);
    if (old !== nm) { // перенести товары на новое имя категории
      const products = getProducts();
      products.forEach((p) => { if (p.category === old) p.category = nm; });
      saveProducts(products);
    }
    return true;
  }
  function updateCategoryMeta(id, d) {
    const list = getCategoriesRaw();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    if (d.icon !== undefined) c.icon = d.icon || "🏷️";
    if (d.image !== undefined) c.image = d.image || "";
    saveCategories(list);
  }
  function deleteCategory(id) { saveCategories(getCategoriesRaw().filter((c) => c.id !== id)); }
  function addSubcategory(id, sub) {
    const list = getCategoriesRaw();
    const c = list.find((x) => x.id === id);
    const s = (sub || "").trim();
    if (!c || !s || c.subs.includes(s)) return false;
    c.subs.push(s); saveCategories(list); return true;
  }
  function renameSubcategory(id, oldSub, newSub) {
    const list = getCategoriesRaw();
    const c = list.find((x) => x.id === id);
    const s = (newSub || "").trim();
    if (!c || !s || (s !== oldSub && c.subs.includes(s))) return false;
    const i = c.subs.indexOf(oldSub);
    if (i === -1) return false;
    c.subs[i] = s; saveCategories(list);
    if (oldSub !== s) { // перенести товары
      const products = getProducts();
      products.forEach((p) => { if (p.category === c.name && p.subcategory === oldSub) p.subcategory = s; });
      saveProducts(products);
    }
    return true;
  }
  function deleteSubcategory(id, sub) {
    const list = getCategoriesRaw();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    c.subs = c.subs.filter((s) => s !== sub);
    saveCategories(list);
  }
  function resetCategories() { write(KEYS.cats, SEED_CATEGORIES.map((x) => ({ ...x, subs: [...x.subs] }))); }

  /* ---------- Слайды ---------- */
  function getSlides() { let s = read(KEYS.slides, null); if (!s) { s = SEED_SLIDES; write(KEYS.slides, s); } return s; }
  function saveSlides(s) { write(KEYS.slides, s); }
  function addSlide(d) {
    const s = getSlides();
    s.push({ id: "s" + Date.now(), tone: d.tone || "t1", emoji: d.emoji || "✨", image: d.image || "",
      title: d.title || "", pill: d.pill || "", subtitle: d.subtitle || "", btn: d.btn || "в каталог", link: d.link || "#catalog" });
    saveSlides(s);
  }
  function updateSlide(id, d) {
    const s = getSlides(); const i = s.findIndex((x) => x.id === id);
    if (i < 0) return; s[i] = { ...s[i], ...d }; saveSlides(s);
  }
  function deleteSlide(id) { saveSlides(getSlides().filter((x) => x.id !== id)); }
  function resetSlides() { write(KEYS.slides, SEED_SLIDES); }
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

  /* ---------- Отзывы ---------- */
  const AVATARS = ["🙋‍♀️", "👩", "🧑", "👧", "🙎‍♀️", "💁‍♀️", "👱‍♀️", "🧖‍♀️"];
  function getReviews() { let r = read(KEYS.reviews, null); if (!r) { r = SEED_REVIEWS; write(KEYS.reviews, r); } return r; }
  function saveReviews(r) { write(KEYS.reviews, r); }
  function addReview(d) {
    const reviews = getReviews();
    const rating = Math.min(5, Math.max(1, Number(d.rating) || 5));
    reviews.unshift({
      id: "r" + Date.now(),
      name: (d.name || "Аноним").trim(),
      city: (d.city || "").trim(),
      rating,
      text: (d.text || "").trim(),
      avatar: d.avatar || AVATARS[reviews.length % AVATARS.length],
    });
    saveReviews(reviews);
    return reviews[0];
  }
  function deleteReview(id) { saveReviews(getReviews().filter((r) => r.id !== id)); }
  function resetReviews() { write(KEYS.reviews, SEED_REVIEWS); }
  function reviewsAverage() {
    const r = getReviews();
    if (!r.length) return 0;
    return r.reduce((s, x) => s + Number(x.rating || 0), 0) / r.length;
  }

  /* ---------- Блог ---------- */
  function getBlog() { let b = read(KEYS.blog, null); if (!b) { b = SEED_BLOG; write(KEYS.blog, b); } return b; }
  function saveBlog(b) { write(KEYS.blog, b); }
  function addPost(d) {
    const blog = getBlog();
    blog.unshift({
      id: "b" + Date.now(),
      date: (d.date || "").trim() || new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
      title: (d.title || "").trim(),
      excerpt: (d.excerpt || "").trim(),
      body: (d.body || "").trim(),
      emoji: d.emoji || "📝",
      cover: d.cover || "linear-gradient(120deg,#fdeef0,#f8dfe3)",
      image: d.image || "",
    });
    saveBlog(blog);
  }
  function updatePost(id, d) {
    const blog = getBlog();
    const i = blog.findIndex((p) => p.id === id);
    if (i === -1) return null;
    blog[i] = { ...blog[i], ...d,
      title: (d.title || "").trim(), excerpt: (d.excerpt || "").trim(),
      body: (d.body || "").trim(), date: (d.date || blog[i].date).trim(),
      image: d.image !== undefined ? d.image : blog[i].image };
    saveBlog(blog);
    return blog[i];
  }
  function deletePost(id) { saveBlog(getBlog().filter((p) => p.id !== id)); }
  function resetBlog() { write(KEYS.blog, SEED_BLOG); }
  function getPost(id) { return getBlog().find((p) => p.id === id) || null; }

  /* ---------- Админ ---------- */
  function login(pw) { if (pw === ADMIN_PASSWORD) { sessionStorage.setItem(KEYS.admin, "1"); return true; } return false; }
  function isAdmin() { return sessionStorage.getItem(KEYS.admin) === "1"; }
  function logout() { sessionStorage.removeItem(KEYS.admin); }

  function formatPrice(n) { return new Intl.NumberFormat("ru-RU").format(n) + " Br"; }

  return {
    TONES,
    getProducts, saveProducts, addProduct, updateProduct, deleteProduct,
    resetProducts, countByCategory, countBySub, discountPercent,
    getCategories, getSubcategories, addCategory, renameCategory,
    updateCategoryMeta, deleteCategory, addSubcategory, renameSubcategory,
    deleteSubcategory, resetCategories,
    getSlides, saveSlides, addSlide, updateSlide, deleteSlide, resetSlides,
    getCart, addToCart, setQty, removeFromCart, clearCart,
    cartCount, cartDetailed, cartTotal, cartSavings, shippingInfo,
    getWishlist, toggleWishlist, inWishlist, wishlistCount, wishlistProducts,
    validatePromo, getOrders, saveOrder,
    getReviews, addReview, deleteReview, resetReviews, reviewsAverage,
    getBlog, getPost, addPost, updatePost, deletePost, resetBlog,
    login, isAdmin, logout, formatPrice,
    // GitHub-хранилище
    boot, pullAll, ghPull, ghPush, ghPushMany, ghTest,
    ghConfig, setGhConfig, ghToken, setGhToken, hasToken,
  };
})();
