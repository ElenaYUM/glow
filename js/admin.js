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

  /* ============================================================
     УПРАВЛЕНИЕ САЙТОМ: вкладки, фото, слайдер, категории
     ============================================================ */

  // загрузка фото с устройства + сжатие (чтобы влезало в localStorage)
  function readImageResized(file, maxW, cb) {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(cv.toDataURL("image/jpeg", 0.82));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function initTabs() {
    $$(".atab").forEach((t) => t.addEventListener("click", () => {
      $$(".atab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      $$(".tabpane").forEach((p) => (p.hidden = true));
      $("#tab-" + t.dataset.tab).hidden = false;
    }));
  }

  /* ---------- Слайдер ---------- */
  function setSlidePreview(url) {
    const prev = $("#s_prev");
    if (url) { prev.style.backgroundImage = `url('${url}')`; prev.textContent = ""; }
    else { prev.style.backgroundImage = ""; prev.textContent = "нет фото"; }
  }
  function renderSlideList() {
    const list = $("#slideList"), slides = GLOW.getSlides();
    if (!slides.length) { list.innerHTML = `<div class="empty-list">Слайдов нет — добавьте первый.</div>`; return; }
    list.innerHTML = slides.map((s, i) => `
      <div class="p-row slide-row" data-id="${s.id}">
        <div class="pic" ${s.image ? `style="background-image:url('${s.image}')"` : `style="background:var(--bg-soft)"`}>${s.image ? "" : (s.emoji || "✦")}</div>
        <div class="nm"><b>${s.title || "(без заголовка)"}</b><span>слайд ${i + 1}</span><small>${s.pill || "—"}</small></div>
        <div class="pp"><small>${s.image ? "📷 фото" : "эмодзи"}</small></div>
        <div class="acts">
          <button class="edit" data-edit="${s.id}" title="Редактировать">✏️</button>
          <button class="del" data-del="${s.id}" title="Удалить">🗑</button>
        </div>
      </div>`).join("");
    $$("[data-edit]", list).forEach((b) => b.addEventListener("click", () => editSlide(b.dataset.edit)));
    $$("[data-del]", list).forEach((b) => b.addEventListener("click", () => {
      if (confirm("Удалить слайд?")) { GLOW.deleteSlide(b.dataset.del); renderSlideList(); toast("Слайд удалён"); }
    }));
  }
  function editSlide(id) {
    const s = GLOW.getSlides().find((x) => x.id === id);
    if (!s) return;
    $("#s_id").value = s.id; $("#s_title").value = s.title; $("#s_pill").value = s.pill;
    $("#s_subtitle").value = s.subtitle; $("#s_btn").value = s.btn; $("#s_link").value = s.link;
    $("#s_tone").value = s.tone; $("#s_emoji").value = s.emoji; $("#s_image").value = s.image || ""; $("#s_url").value = "";
    setSlidePreview(s.image);
    $("#slideFormTitle").textContent = "Редактирование слайда";
    $("#slideSubmit").textContent = "Сохранить слайд";
    $("#slideCancel").style.display = "block";
    $("#slideFormTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetSlideForm() {
    $("#slideForm").reset(); $("#s_id").value = ""; $("#s_image").value = ""; setSlidePreview("");
    $("#slideFormTitle").textContent = "Новый слайд"; $("#slideSubmit").textContent = "Добавить слайд";
    $("#slideCancel").style.display = "none";
  }
  function initSlides() {
    renderSlideList(); setSlidePreview("");
    $("#s_file").addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      readImageResized(f, 900, (url) => { $("#s_image").value = url; $("#s_url").value = ""; setSlidePreview(url); });
    });
    $("#s_url").addEventListener("input", (e) => { const v = e.target.value.trim(); if (v) { $("#s_image").value = v; setSlidePreview(v); } });
    $("#s_clear").addEventListener("click", () => { $("#s_image").value = ""; $("#s_url").value = ""; setSlidePreview(""); });
    $("#slideForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const data = { title: $("#s_title").value.trim(), pill: $("#s_pill").value.trim(), subtitle: $("#s_subtitle").value.trim(),
        btn: $("#s_btn").value.trim() || "в каталог", link: $("#s_link").value.trim() || "#catalog",
        tone: $("#s_tone").value, emoji: $("#s_emoji").value.trim(), image: $("#s_image").value };
      const id = $("#s_id").value;
      try {
        if (id) { GLOW.updateSlide(id, data); toast("Слайд сохранён ✨"); }
        else { GLOW.addSlide(data); toast("Слайд добавлен 🎉"); }
      } catch (err) { toast("Не удалось сохранить — фото слишком большое"); return; }
      resetSlideForm(); renderSlideList();
    });
    $("#slideCancel").addEventListener("click", resetSlideForm);
    $("#slideReset").addEventListener("click", () => { if (confirm("Сбросить слайдер к стандартному?")) { GLOW.resetSlides(); renderSlideList(); resetSlideForm(); toast("Слайдер сброшен"); } });
  }

  /* ---------- Категории ---------- */
  function renderCatEdit() {
    const grid = $("#catEditGrid");
    grid.innerHTML = GLOW.getCategories().map((c) => `
      <div class="cat-edit-card" data-key="${c.key}">
        <div class="cc-prev" ${c.image ? `style="background-image:url('${c.image}')"` : ""}>${c.image ? "" : c.icon}</div>
        <h4>${c.key}</h4>
        <div class="field"><label>Эмодзи (если без фото)</label><input type="text" class="cc-emoji" value="${c.image ? "" : c.icon}" placeholder="🧴" /></div>
        <input type="hidden" class="cc-image" value="${c.image || ""}" />
        <input type="url" class="cc-url" placeholder="ссылка на фото https://…" style="margin-bottom:.6rem" />
        <div class="cc-actions">
          <label class="btn btn-line file-btn">📁 Фото<input type="file" class="cc-file" accept="image/*" hidden /></label>
          <button class="btn btn-red cc-save" type="button">Сохранить</button>
        </div>
        <button class="btn-mini cc-clear" type="button" style="margin-top:.5rem">Убрать фото</button>
      </div>`).join("");
    $$(".cat-edit-card", grid).forEach((card) => {
      const key = card.dataset.key;
      const prev = $(".cc-prev", card), imageInput = $(".cc-image", card), emojiInput = $(".cc-emoji", card), urlInput = $(".cc-url", card);
      const setPrev = () => {
        if (imageInput.value) { prev.style.backgroundImage = `url('${imageInput.value}')`; prev.textContent = ""; }
        else { prev.style.backgroundImage = ""; prev.textContent = emojiInput.value || "🧴"; }
      };
      $(".cc-file", card).addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; readImageResized(f, 600, (url) => { imageInput.value = url; urlInput.value = ""; setPrev(); }); });
      urlInput.addEventListener("input", () => { if (urlInput.value.trim()) { imageInput.value = urlInput.value.trim(); setPrev(); } });
      emojiInput.addEventListener("input", setPrev);
      $(".cc-clear", card).addEventListener("click", () => { imageInput.value = ""; urlInput.value = ""; setPrev(); });
      $(".cc-save", card).addEventListener("click", () => {
        try { GLOW.updateCategory(key, { icon: emojiInput.value.trim() || "🧴", image: imageInput.value }); toast(`«${key}» обновлена ✨`); renderCatEdit(); }
        catch (err) { toast("Не удалось сохранить — фото слишком большое"); }
      });
    });
  }
  function initCats() {
    renderCatEdit();
    $("#catsReset").addEventListener("click", () => { if (confirm("Сбросить иконки и фото категорий?")) { GLOW.resetCategories(); renderCatEdit(); toast("Категории сброшены"); } });
  }

  /* ---------- Инициализация ---------- */
  function init() {
    renderPickers();
    renderCatSelect();
    selectPicker(EMOJIS[0], GRADS[0]);
    initTabs();
    initSlides();
    initCats();

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
