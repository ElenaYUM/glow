/* ============================================================
   GLOW — логика админ-панели
   ============================================================ */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const EMOJIS = ["🧴","💧","✦","🌾","🍃","🍵","☀","💄","🎨","🎁","🎟️","💇","🧼","🛁","◍","❑","❖","🐌","🌸","💗"];
  const GRADS = Object.values(GLOW.TONES);

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="ic">✔</span><span>${msg}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), 3300);
  }

  /* ---------- Гейт ---------- */
  function showGate() { $("#gate").style.display = "grid"; $("#app").style.display = "none"; setTimeout(() => $("#gatePass").focus(), 150); }
  function showApp() { $("#gate").style.display = "none"; $("#app").style.display = "block"; renderAll(); }

  /* ---------- Статистика ---------- */
  function renderStats() {
    const products = GLOW.getProducts();
    const totalStock = products.reduce((s, p) => s + Number(p.stock || 0), 0);
    const value = products.reduce((s, p) => s + p.price * Number(p.stock || 0), 0);
    const onSale = products.filter((p) => GLOW.discountPercent(p) > 0).length;
    const cards = [
      { ic: "📦", num: products.length, lbl: "Товаров в каталоге" },
      { ic: "🔥", num: onSale, lbl: "Товаров со скидкой" },
      { ic: "🧮", num: totalStock, lbl: "Единиц на складе" },
      { ic: "💰", num: GLOW.formatPrice(value), lbl: "Стоимость склада" },
    ];
    $("#stats").innerHTML = cards.map((c) => `<div class="stat-card"><div class="ic">${c.ic}</div><div class="num">${c.num}</div><div class="lbl">${c.lbl}</div></div>`).join("");
  }

  /* ---------- Категории в select ---------- */
  function renderCatSelect() {
    $("#f_category").innerHTML = GLOW.getCategories().map((c) => `<option value="${c.key}">${c.key}</option>`).join("");
  }

  /* ---------- Палитры ---------- */
  function renderPickers() {
    const ep = $("#emojiPick");
    ep.innerHTML = EMOJIS.map((e) => `<button type="button" data-emoji="${e}">${e}</button>`).join("");
    $$("button", ep).forEach((b) => b.addEventListener("click", () => {
      $("#f_emoji").value = b.dataset.emoji;
      $$("button", ep).forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
    }));
    const gp = $("#gradPick");
    gp.innerHTML = GRADS.map((g) => `<button type="button" data-grad="${g}" style="background:${g}"></button>`).join("");
    $$("button", gp).forEach((b) => b.addEventListener("click", () => {
      $("#f_gradient").value = b.dataset.grad;
      $$("button", gp).forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
    }));
  }
  function selectPicker(emoji, grad) {
    $("#f_emoji").value = emoji || EMOJIS[0];
    $("#f_gradient").value = grad || GRADS[0];
    $$("#emojiPick button").forEach((b) => b.classList.toggle("sel", b.dataset.emoji === $("#f_emoji").value));
    $$("#gradPick button").forEach((b) => b.classList.toggle("sel", b.dataset.grad === $("#f_gradient").value));
  }

  /* ---------- Список ---------- */
  function renderList(filter = "") {
    const list = $("#pList");
    let products = GLOW.getProducts();
    if (filter) {
      const q = filter.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (!products.length) { list.innerHTML = `<div class="empty-list">Ничего не найдено 🫧</div>`; return; }
    list.innerHTML = products.map((p) => {
      const old = p.oldPrice > p.price ? `<span class="old">${GLOW.formatPrice(p.oldPrice)}</span>` : "";
      const badge = p.badge === "BESTSELLER" ? " · ХИТ" : p.badge === "NEW" ? " · NEW" : "";
      return `
      <div class="p-row" data-id="${p.id}">
        <div class="pic" style="background:${p.gradient}">${p.emoji}</div>
        <div class="nm">
          <b>${p.name}</b>
          <span>${p.brand}</span>
          <small>${p.category}${badge} · <span class="star">★</span> ${p.rating.toFixed(1)} (${p.reviews})</small>
        </div>
        <div class="pp"><b>${GLOW.formatPrice(p.price)}</b>${old}<small>${p.stock > 0 ? p.stock + " шт" : "нет в наличии"}</small></div>
        <div class="acts">
          <button class="edit" data-edit="${p.id}" title="Редактировать">✏️</button>
          <button class="del" data-del="${p.id}" title="Удалить">🗑</button>
        </div>
      </div>`;
    }).join("");
    $$("[data-edit]", list).forEach((b) => b.addEventListener("click", () => startEdit(b.dataset.edit)));
    $$("[data-del]", list).forEach((b) => b.addEventListener("click", () => {
      const p = GLOW.getProducts().find((x) => x.id === b.dataset.del);
      if (confirm(`Удалить «${p.name}»?`)) { GLOW.deleteProduct(b.dataset.del); renderAll(); toast("Товар удалён"); }
    }));
  }

  /* ---------- Редактирование ---------- */
  function startEdit(id) {
    const p = GLOW.getProducts().find((x) => x.id === id);
    if (!p) return;
    $("#editId").value = p.id;
    $("#f_name").value = p.name;
    $("#f_brand").value = p.brand;
    $("#f_category").value = p.category;
    $("#f_price").value = p.price;
    $("#f_oldPrice").value = p.oldPrice || "";
    $("#f_stock").value = p.stock;
    $("#f_rating").value = p.rating;
    $("#f_reviews").value = p.reviews;
    $("#f_desc").value = p.description || "";
    $("#f_badge").value = p.badge || "";
    selectPicker(p.emoji, p.gradient);
    $("#formTitle").textContent = "Редактирование";
    $("#submitBtn").textContent = "Сохранить изменения";
    $("#cancelEdit").style.display = "block";
    $(".panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function resetForm() {
    $("#productForm").reset();
    $("#editId").value = "";
    renderCatSelect();
    selectPicker(EMOJIS[0], GRADS[0]);
    $("#formTitle").textContent = "Новый товар";
    $("#submitBtn").textContent = "Добавить товар";
    $("#cancelEdit").style.display = "none";
  }

  function renderAll() { renderStats(); renderCatSelect(); renderList($("#search").value); }

  /* ---------- Инициализация ---------- */
  function init() {
    renderPickers();
    renderCatSelect();
    selectPicker(EMOJIS[0], GRADS[0]);

    if (GLOW.isAdmin()) showApp(); else showGate();

    $("#gateForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (GLOW.login($("#gatePass").value)) { toast("Добро пожаловать 👑"); showApp(); }
      else { $("#gateErr").textContent = "Неверный пароль."; $("#gatePass").value = ""; $("#gatePass").focus(); }
    });

    $("#logoutBtn").addEventListener("click", () => { GLOW.logout(); showGate(); });

    $("#productForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const data = {
        name: $("#f_name").value.trim(),
        brand: $("#f_brand").value.trim(),
        category: $("#f_category").value,
        price: $("#f_price").value,
        oldPrice: $("#f_oldPrice").value,
        stock: $("#f_stock").value,
        rating: $("#f_rating").value,
        reviews: $("#f_reviews").value,
        description: $("#f_desc").value.trim(),
        badge: $("#f_badge").value,
        emoji: $("#f_emoji").value,
        gradient: $("#f_gradient").value,
      };
      const editId = $("#editId").value;
      if (editId) { GLOW.updateProduct(editId, data); toast("Изменения сохранены ✨"); }
      else { GLOW.addProduct(data); toast("Товар добавлен в каталог 🎉"); }
      resetForm();
      renderAll();
    });

    $("#cancelEdit").addEventListener("click", resetForm);
    $("#search").addEventListener("input", (e) => renderList(e.target.value));
    $("#resetBtn").addEventListener("click", () => {
      if (confirm("Вернуть стандартный каталог? Все ваши изменения будут потеряны.")) {
        GLOW.resetProducts(); renderAll(); toast("Каталог сброшен к стандартному");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
