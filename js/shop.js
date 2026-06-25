/* ============================================================
   GLOW — логика витрины (e-commerce)
   Быстрый просмотр · избранное · сортировка · «показать ещё»
   оформление заказа · промокоды · бесплатная доставка
   ============================================================ */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const STEP = 8; // сколько товаров показывать за один раз
  let activeCategory = "Все";
  let searchQuery = "";
  let sortMode = "popular";
  let visible = STEP;
  let promo = null; // применённый промокод при оформлении

  /* ---------- Тост ---------- */
  function toast(msg, icon = "✔") {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="ic">${icon}</span><span>${msg}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), 3300);
  }

  const stars = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

  /* ---------- Карточка товара ---------- */
  function cardHTML(p) {
    const out = p.stock <= 0;
    const disc = GLOW.discountPercent(p);
    const fav = GLOW.inWishlist(p.id);
    const badges = [];
    if (p.badge === "BESTSELLER") badges.push(`<span class="tag hit">ХИТ</span>`);
    if (p.badge === "NEW") badges.push(`<span class="tag new">NEW</span>`);
    if (disc > 0) badges.push(`<span class="tag sale">−${disc}%</span>`);
    const priceBlock = disc > 0
      ? `<span class="price sale">${GLOW.formatPrice(p.price)}</span><span class="old-price">${GLOW.formatPrice(p.oldPrice)}</span>`
      : `<span class="price">${GLOW.formatPrice(p.price)}</span>`;
    return `
      <article class="card reveal ${out ? "stock-out" : ""}" data-id="${p.id}">
        <div class="card-media" style="background:${p.gradient}">
          <div class="badges">${badges.join("")}</div>
          <button class="wish ${fav ? "on" : ""}" data-wish="${p.id}" title="В избранное">${fav ? "♥" : "♡"}</button>
          <span class="ico" data-view="${p.id}">${p.emoji}</span>
          <button class="view-btn" data-view="${p.id}">Быстрый просмотр</button>
        </div>
        <div class="card-body">
          <span class="card-brand">${p.brand}</span>
          <h3 class="card-name" data-view="${p.id}">${p.name}</h3>
          <div class="rating"><span class="stars">${stars(p.rating)}</span><span>${p.rating.toFixed(1)}</span><span class="rev">· ${p.reviews}</span></div>
          <div class="price-row">${priceBlock}</div>
          <div class="card-actions">
            <button class="add-cart" data-add="${p.id}">${out ? "Нет в наличии" : "В корзину"}</button>
            <button class="quick" data-view="${p.id}" title="Подробнее">👁</button>
          </div>
        </div>
      </article>`;
  }

  function bindCards(scope) {
    $$("[data-add]", scope).forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = GLOW.getProducts().find((x) => x.id === b.dataset.add);
      if (!p || p.stock <= 0) return;
      GLOW.addToCart(p.id, 1); updateCartCount(true); toast(`«${p.name}» в корзине`);
    }));
    $$("[data-view]", scope).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openQuickView(b.dataset.view); }));
    $$("[data-wish]", scope).forEach((w) => w.addEventListener("click", (e) => {
      e.stopPropagation(); toggleWish(w.dataset.wish);
    }));
  }

  function toggleWish(id) {
    GLOW.toggleWishlist(id);
    const on = GLOW.inWishlist(id);
    updateWishCount();
    toast(on ? "Добавлено в избранное 💛" : "Удалено из избранного");
    if (activeCategory === "Избранное") renderCatalog();
    else { // обновить иконки на всех карточках с этим id
      $$(`[data-wish="${id}"]`).forEach((w) => { w.classList.toggle("on", on); w.textContent = on ? "♥" : "♡"; });
    }
    // обновить иконку в быстром просмотре, если открыт
    const qvWish = $("#quickModal [data-wish]");
    if (qvWish && qvWish.dataset.wish === id) { qvWish.classList.toggle("on", on); qvWish.innerHTML = on ? "♥ В избранном" : "♡ В избранное"; }
  }

  /* ---------- Сортировка ---------- */
  function sortItems(items) {
    const a = [...items];
    switch (sortMode) {
      case "cheap": return a.sort((x, y) => x.price - y.price);
      case "expensive": return a.sort((x, y) => y.price - x.price);
      case "rating": return a.sort((x, y) => y.rating - x.rating);
      case "new": return a.sort((x, y) => (y.badge === "NEW") - (x.badge === "NEW"));
      case "discount": return a.sort((x, y) => GLOW.discountPercent(y) - GLOW.discountPercent(x));
      default: return a.sort((x, y) => y.reviews - x.reviews); // popular
    }
  }

  /* ---------- Навигация / категории ---------- */
  function renderCatNav() {
    const nav = $("#catnav");
    nav.innerHTML =
      `<a href="#sale" class="hot">Акции</a><a href="#new">Новинки</a>` +
      GLOW.getCategories().map((c) => `<a href="#catalog" data-cat="${c.key}">${c.key}</a>`).join("") +
      `<a href="#brands">Бренды</a><a href="#blog">Блог</a>`;
    $$("[data-cat]", nav).forEach((a) => a.addEventListener("click", () => setCategory(a.dataset.cat)));
  }
  function renderCatGrid() {
    $("#catGrid").innerHTML = GLOW.getCategories().map((c) => `
      <button class="cat-tile reveal" data-cat="${c.key}">
        <div class="ic">${c.icon}</div><b>${c.key}</b><span>${GLOW.countByCategory(c.key)} товаров</span>
      </button>`).join("");
    $$("[data-cat]", $("#catGrid")).forEach((b) => b.addEventListener("click", () => setCategory(b.dataset.cat)));
  }
  function renderFooterCats() {
    $("#footCats").innerHTML = GLOW.getCategories().map((c) => `<li><a href="#catalog" data-cat="${c.key}">${c.key}</a></li>`).join("");
    $$("[data-cat]", $("#footCats")).forEach((a) => a.addEventListener("click", () => setCategory(a.dataset.cat)));
  }
  function setCategory(cat) {
    activeCategory = cat; searchQuery = ""; visible = STEP;
    $("#searchInput").value = "";
    renderFilters(); renderCatalog();
    $("#catalog").scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- Фильтры ---------- */
  function renderFilters() {
    const cats = ["Все", ...GLOW.getCategories().map((c) => c.key)];
    const wc = GLOW.wishlistCount();
    let html = cats.map((c) => `<button class="chip ${c === activeCategory ? "active" : ""}" data-f="${c}">${c}</button>`).join("");
    if (wc > 0) html += `<button class="chip fav ${activeCategory === "Избранное" ? "active" : ""}" data-f="Избранное">♥ Избранное (${wc})</button>`;
    const box = $("#filters");
    box.innerHTML = html;
    $$(".chip", box).forEach((ch) => ch.addEventListener("click", () => {
      activeCategory = ch.dataset.f; visible = STEP; renderFilters(); renderCatalog();
    }));
  }

  /* ---------- Секции ---------- */
  function renderSale() {
    const items = sortItems(GLOW.getProducts().filter((p) => GLOW.discountPercent(p) > 0)).slice(0, 4);
    $("#saleGrid").innerHTML = items.map(cardHTML).join(""); bindCards($("#saleGrid"));
  }
  function renderNew() {
    const items = GLOW.getProducts().filter((p) => p.badge === "NEW").slice(0, 4);
    $("#newGrid").innerHTML = items.map(cardHTML).join(""); bindCards($("#newGrid"));
  }
  function getCatalogItems() {
    let items = activeCategory === "Избранное" ? GLOW.wishlistProducts() : GLOW.getProducts();
    if (activeCategory !== "Все" && activeCategory !== "Избранное") items = items.filter((p) => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    return sortItems(items);
  }
  function renderCatalog() {
    const all = getCatalogItems();
    const shown = all.slice(0, visible);
    const grid = $("#products");
    $("#catCount").textContent = `${all.length} товаров`;
    if (!all.length) {
      grid.innerHTML = `<p class="empty-cat">Ничего не найдено 🫧<br/><span>Попробуйте другой запрос или категорию.</span></p>`;
      $("#loadMore").style.display = "none"; return;
    }
    grid.innerHTML = shown.map(cardHTML).join(""); bindCards(grid);
    $("#loadMore").style.display = all.length > visible ? "inline-flex" : "none";
    $("#loadMore").textContent = `Показать ещё (${all.length - visible})`;
    observeReveal();
  }

  /* ---------- Счётчики ---------- */
  function updateCartCount(bump = false) {
    const n = GLOW.cartCount(), el = $("#cartCount");
    el.textContent = n; el.classList.toggle("show", n > 0);
    if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  }
  function updateWishCount() {
    const n = GLOW.wishlistCount(), el = $("#wishCount");
    el.textContent = n; el.classList.toggle("show", n > 0);
    renderFilters();
  }

  /* ---------- Корзина ---------- */
  function openCart() { renderCart(); $("#overlay").classList.add("open"); $("#drawer").classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeCart() { $("#overlay").classList.remove("open"); $("#drawer").classList.remove("open"); document.body.style.overflow = ""; }
  function renderCart() {
    const body = $("#cartBody"), foot = $("#cartFoot"), items = GLOW.cartDetailed();
    if (!items.length) {
      body.innerHTML = `<div class="cart-empty"><div class="big">🧺</div><p>Корзина пуста.<br/>Самое время выбрать уход ✨</p></div>`;
      foot.style.display = "none"; return;
    }
    const ship = GLOW.shippingInfo();
    const shipBar = ship.free
      ? `<div class="ship-bar done">🎉 Поздравляем! Доставка <b>бесплатно</b><div class="bar"><i style="width:100%"></i></div></div>`
      : `<div class="ship-bar">До бесплатной доставки осталось <b>${GLOW.formatPrice(ship.remain)}</b><div class="bar"><i style="width:${ship.progress * 100}%"></i></div></div>`;
    body.innerHTML = shipBar + items.map((p) => {
      const old = p.oldPrice > p.price ? `<small>${GLOW.formatPrice(p.oldPrice * p.qty)}</small>` : "";
      return `
      <div class="cart-item" data-id="${p.id}">
        <div class="thumb" style="background:${p.gradient}">${p.emoji}</div>
        <div class="info">
          <span class="br">${p.brand}</span><b>${p.name}</b>
          <div class="pr">${GLOW.formatPrice(p.price * p.qty)} ${old}</div>
          <div class="qty"><button data-dec="${p.id}">−</button><span>${p.qty}</span><button data-inc="${p.id}">+</button></div>
        </div>
        <button class="remove" data-rm="${p.id}" title="Удалить">🗑</button>
      </div>`;
    }).join("");
    foot.style.display = "block";
    const save = GLOW.cartSavings();
    $("#sumCount").textContent = GLOW.cartCount() + " шт";
    $("#saveRow").style.display = save > 0 ? "flex" : "none";
    $("#sumSave").textContent = "−" + GLOW.formatPrice(save);
    $("#sumShip").textContent = ship.free ? "Бесплатно" : GLOW.formatPrice(ship.cost);
    $("#sumTotal").textContent = GLOW.formatPrice(ship.total + ship.cost);

    $$("[data-inc]", body).forEach((b) => b.addEventListener("click", () => { const it = GLOW.getCart().find((i) => i.id === b.dataset.inc); GLOW.setQty(b.dataset.inc, (it ? it.qty : 0) + 1); renderCart(); updateCartCount(true); }));
    $$("[data-dec]", body).forEach((b) => b.addEventListener("click", () => { const it = GLOW.getCart().find((i) => i.id === b.dataset.dec); GLOW.setQty(b.dataset.dec, (it ? it.qty : 0) - 1); renderCart(); updateCartCount(true); }));
    $$("[data-rm]", body).forEach((b) => b.addEventListener("click", () => { GLOW.removeFromCart(b.dataset.rm); renderCart(); updateCartCount(true); toast("Товар удалён"); }));
  }

  /* ---------- Быстрый просмотр ---------- */
  function openQuickView(id) {
    const p = GLOW.getProducts().find((x) => x.id === id);
    if (!p) return;
    let qty = 1;
    const disc = GLOW.discountPercent(p);
    const fav = GLOW.inWishlist(p.id);
    const priceBlock = disc > 0
      ? `<span class="price sale">${GLOW.formatPrice(p.price)}</span><span class="old-price">${GLOW.formatPrice(p.oldPrice)}</span><span class="tag sale">−${disc}%</span>`
      : `<span class="price">${GLOW.formatPrice(p.price)}</span>`;
    $("#quickModal .modal-card").innerHTML = `
      <button class="qv-close" id="qvClose">✕</button>
      <div class="qv-media" style="background:${p.gradient}"><span>${p.emoji}</span></div>
      <div class="qv-info">
        <span class="card-brand">${p.brand}</span>
        <h3>${p.name}</h3>
        <div class="rating"><span class="stars">${stars(p.rating)}</span><span>${p.rating.toFixed(1)}</span><span class="rev">· ${p.reviews} отзывов</span></div>
        <div class="price-row">${priceBlock}</div>
        <p class="qv-desc">${p.description || ""}</p>
        <div class="qv-meta"><span>Категория: <b>${p.category}</b></span><span>${p.stock > 0 ? "В наличии: " + p.stock + " шт" : "Нет в наличии"}</span></div>
        <div class="qv-buy">
          <div class="qty"><button id="qvDec">−</button><span id="qvQty">1</span><button id="qvInc">+</button></div>
          <button class="btn btn-red" id="qvAdd" ${p.stock <= 0 ? "disabled" : ""}>В корзину</button>
          <button class="wish-lg ${fav ? "on" : ""}" data-wish="${p.id}">${fav ? "♥ В избранном" : "♡ В избранное"}</button>
        </div>
      </div>`;
    $("#quickModal").classList.add("open"); document.body.style.overflow = "hidden";
    const sync = () => { $("#qvQty").textContent = qty; };
    $("#qvDec").onclick = () => { qty = Math.max(1, qty - 1); sync(); };
    $("#qvInc").onclick = () => { qty = Math.min(p.stock || 99, qty + 1); sync(); };
    $("#qvAdd").onclick = () => { if (p.stock <= 0) return; GLOW.addToCart(p.id, qty); updateCartCount(true); closeQuickView(); openCart(); toast(`«${p.name}» ×${qty} в корзине`); };
    $("#qvClose").onclick = closeQuickView;
    $("#quickModal [data-wish]").onclick = (e) => { toggleWish(e.currentTarget.dataset.wish); };
  }
  function closeQuickView() { $("#quickModal").classList.remove("open"); document.body.style.overflow = ""; }

  /* ---------- Оформление заказа ---------- */
  function openCheckout() {
    if (!GLOW.cartCount()) { toast("Корзина пуста"); return; }
    promo = null;
    $("#coForm").reset();
    $("#promoMsg").textContent = "";
    $("#orderSuccess").style.display = "none";
    $("#coForm").style.display = "block";
    renderCheckoutSummary();
    closeCart();
    $("#checkoutModal").classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeCheckout() { $("#checkoutModal").classList.remove("open"); document.body.style.overflow = ""; }
  function renderCheckoutSummary() {
    const ship = GLOW.shippingInfo();
    const subtotal = ship.total;
    const promoDisc = promo ? Math.round(subtotal * promo.percent / 100) : 0;
    const total = subtotal - promoDisc + ship.cost;
    $("#coSummary").innerHTML = `
      <div class="sum-row"><span>Товары (${GLOW.cartCount()} шт)</span><span>${GLOW.formatPrice(subtotal)}</span></div>
      ${promo ? `<div class="sum-row save"><span>Промокод ${promo.code} (−${promo.percent}%)</span><span>−${GLOW.formatPrice(promoDisc)}</span></div>` : ""}
      <div class="sum-row"><span>Доставка</span><span>${ship.free ? "Бесплатно" : GLOW.formatPrice(ship.cost)}</span></div>
      <div class="sum-row total"><span>Итого</span><span>${GLOW.formatPrice(total)}</span></div>`;
    return { subtotal, promoDisc, shipping: ship.cost, total };
  }

  /* ---------- Слайдер ---------- */
  function initSlider() {
    const slides = $("#slides"), count = slides.children.length;
    let idx = 0, timer;
    const dots = $("#slideDots");
    dots.innerHTML = Array.from({ length: count }, (_, i) => `<button data-s="${i}"></button>`).join("");
    const dotEls = $$("button", dots);
    function go(i) { idx = (i + count) % count; slides.style.transform = `translateX(-${idx * 100}%)`; dotEls.forEach((d, k) => d.classList.toggle("active", k === idx)); restartBar(); }
    function restartBar() { const bar = $("#slideBar"); if (!bar) return; bar.style.transition = "none"; bar.style.width = "0%"; void bar.offsetWidth; bar.style.transition = "width 5.5s linear"; bar.style.width = "100%"; }
    function auto() { clearInterval(timer); timer = setInterval(() => go(idx + 1), 5500); restartBar(); }
    dotEls.forEach((d) => d.addEventListener("click", () => { go(+d.dataset.s); auto(); }));
    $("#slidePrev").addEventListener("click", () => { go(idx - 1); auto(); });
    $("#slideNext").addEventListener("click", () => { go(idx + 1); auto(); });
    go(0); auto();
  }

  /* ---------- Появление ---------- */
  let io;
  function observeReveal() {
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.1 });
    $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  /* ---------- Админ-модалка ---------- */
  function openAdminModal() {
    if (GLOW.isAdmin()) { window.location.href = "admin.html"; return; }
    $("#adminModal").classList.add("open"); setTimeout(() => $("#adminPass").focus(), 200);
  }
  function closeAdminModal() { $("#adminModal").classList.remove("open"); $("#adminErr").textContent = ""; $("#adminPass").value = ""; }

  /* ---------- Инициализация ---------- */
  function init() {
    renderCatNav(); renderCatGrid(); renderFooterCats();
    renderFilters(); renderSale(); renderNew(); renderCatalog();
    updateCartCount(); updateWishCount(); initSlider(); observeReveal();

    $("#cartBtn").addEventListener("click", openCart);
    $("#closeCart").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);
    $("#checkoutBtn").addEventListener("click", openCheckout);

    // быстрый просмотр — закрытие
    $("#quickModal").addEventListener("click", (e) => { if (e.target.id === "quickModal") closeQuickView(); });

    // оформление заказа
    $("#coClose").addEventListener("click", closeCheckout);
    $("#checkoutModal").addEventListener("click", (e) => { if (e.target.id === "checkoutModal") closeCheckout(); });
    $("#promoApply").addEventListener("click", () => {
      const res = GLOW.validatePromo($("#promoInput").value);
      if (res.valid) { promo = res; $("#promoMsg").textContent = `Промокод применён: −${res.percent}%`; $("#promoMsg").className = "promo-msg ok"; }
      else { promo = null; $("#promoMsg").textContent = "Промокод не найден"; $("#promoMsg").className = "promo-msg bad"; }
      renderCheckoutSummary();
    });
    $("#coForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const totals = renderCheckoutSummary();
      const customer = {
        name: $("#coName").value.trim(), phone: $("#coPhone").value.trim(),
        city: $("#coCity").value.trim(), address: $("#coAddress").value.trim(),
        delivery: $("#coDelivery").value, comment: $("#coComment").value.trim(),
      };
      const order = GLOW.saveOrder({ items: GLOW.cartDetailed(), ...totals, promo: promo ? promo.code : null, customer });
      GLOW.clearCart(); updateCartCount(true);
      $("#coForm").style.display = "none";
      $("#orderSuccess").style.display = "block";
      $("#orderNum").textContent = order.num;
      $("#orderTotal").textContent = GLOW.formatPrice(order.total);
    });

    // поиск
    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault(); searchQuery = $("#searchInput").value.trim(); activeCategory = "Все"; visible = STEP;
      renderFilters(); renderCatalog(); $("#catalog").scrollIntoView({ behavior: "smooth" });
    });
    // живой поиск
    $("#searchInput").addEventListener("input", (e) => { searchQuery = e.target.value.trim(); if (activeCategory === "Избранное") activeCategory = "Все"; visible = STEP; renderCatalog(); });

    // сортировка + показать ещё
    $("#sortSelect").addEventListener("change", (e) => { sortMode = e.target.value; visible = STEP; renderCatalog(); });
    $("#loadMore").addEventListener("click", () => { visible += STEP; renderCatalog(); });

    // избранное
    $("#wishBtn").addEventListener("click", () => {
      if (!GLOW.wishlistCount()) { toast("В избранном пока пусто 🤍"); return; }
      activeCategory = "Избранное"; searchQuery = ""; $("#searchInput").value = ""; visible = STEP;
      renderFilters(); renderCatalog(); $("#catalog").scrollIntoView({ behavior: "smooth" });
    });

    // админ
    $("#adminBtn").addEventListener("click", openAdminModal);
    $("#adminModal").addEventListener("click", (e) => { if (e.target.id === "adminModal") closeAdminModal(); });
    $("#adminForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (GLOW.login($("#adminPass").value)) { toast("Добро пожаловать в админку 👑"); setTimeout(() => (window.location.href = "admin.html"), 500); }
      else { $("#adminErr").textContent = "Неверный пароль. Попробуйте ещё раз."; $("#adminPass").value = ""; $("#adminPass").focus(); }
    });

    $("#subForm").addEventListener("submit", (e) => { e.preventDefault(); e.target.reset(); toast("Готово! Промокод GLOW10 отправлен на почту 📩"); });

    // кнопка наверх + тень шапки
    const toTop = $("#toTop");
    window.addEventListener("scroll", () => {
      $("#header").classList.toggle("scrolled", window.scrollY > 10);
      toTop.classList.toggle("show", window.scrollY > 600);
    });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); closeAdminModal(); closeQuickView(); closeCheckout(); } });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
