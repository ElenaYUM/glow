/* ============================================================
   GLOW — логика админ-панели
   ============================================================ */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const EMOJIS = ["🧴","💧","✦","🌾","🍃","🍵","☀","💄","🎨","🎁","🎟️","💇","🧼","🛁","◍","❑","❖","🐌","🌸","💗"];
  const GRADS = Object.values(GLOW.TONES);
  const BLOG_COVERS = [
    "linear-gradient(120deg,#fdeef0,#f8dfe3)",
    "linear-gradient(120deg,#f3f0ec,#e9e2d6)",
    "linear-gradient(120deg,#eef1f3,#dfe7ea)",
    "linear-gradient(120deg,#eef1ec,#dee5db)",
    "linear-gradient(120deg,#f0e8e3,#e2d6cd)",
    "linear-gradient(120deg,#f0f0f1,#e3e4e6)",
  ];

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="ic">✔</span><span>${msg}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), 3300);
  }

  /* ---------- Гейт ---------- */
  function showGate() { $("#gate").style.display = "grid"; $("#app").style.display = "none"; setTimeout(() => $("#gatePass").focus(), 150); }
  async function showApp() {
    $("#gate").style.display = "none"; $("#app").style.display = "block";
    renderAllTabs();                         // мгновенно из локального кэша
    renderConnStatus();
    if (GLOW.hasToken() || true) {           // подтянуть свежие данные из GitHub
      await GLOW.boot();
      renderAllTabs();
    }
  }
  function renderAllTabs() {
    renderAll();
    if ($("#slideList")) renderSlideList();
    if ($("#catEditGrid")) renderCatEdit();
    if ($("#reviewList")) renderReviewList();
    if ($("#postList")) renderPostList();
  }

  /* ---------- Сохранение в GitHub ---------- */
  async function pushNow(datasets, label) {
    if (!GLOW.hasToken()) {
      toast("⚠️ Сохранено только на этом устройстве. Подключите GitHub во вкладке «🔗 Подключение».");
      return false;
    }
    toast("Сохранение в GitHub…");
    try { await GLOW.ghPushMany(datasets, label); toast("Сохранено в GitHub ✓"); return true; }
    catch (e) { toast("GitHub: " + e.message); return false; }
  }

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
  function renderCatSelect(keepCat, keepSub) {
    const cats = GLOW.getCategories();
    const sel = $("#f_category");
    const current = keepCat || sel.value || (cats[0] && cats[0].key);
    sel.innerHTML = cats.map((c) => `<option value="${c.key}">${c.key}</option>`).join("");
    if (current && cats.some((c) => c.key === current)) sel.value = current;
    renderSubSelect(sel.value, keepSub);
  }
  function renderSubSelect(catName, keepSub) {
    const sub = $("#f_subcategory");
    if (!sub) return;
    const subs = GLOW.getSubcategories(catName);
    sub.innerHTML = `<option value="">— без подкатегории —</option>` + subs.map((s) => `<option value="${s}">${s}</option>`).join("");
    if (keepSub && subs.includes(keepSub)) sub.value = keepSub;
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
      const sub = p.subcategory ? ` › ${p.subcategory}` : "";
      const photos = Array.isArray(p.photos) ? p.photos.filter(Boolean) : [];
      const pic = photos.length
        ? `<div class="pic" style="background-image:url('${photos[0]}');background-size:cover;background-position:center">${photos.length > 1 ? `<span class="pic-count">${photos.length}</span>` : ""}</div>`
        : `<div class="pic" style="background:${p.gradient}">${p.emoji}</div>`;
      return `
      <div class="p-row" data-id="${p.id}">
        ${pic}
        <div class="nm">
          <b>${p.name}</b>
          <span>${p.brand}</span>
          <small>${p.category}${sub}${badge} · <span class="star">★</span> ${p.rating.toFixed(1)} (${p.reviews})</small>
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
      if (confirm(`Удалить «${p.name}»?`)) { GLOW.deleteProduct(b.dataset.del); renderAll(); toast("Товар удалён"); pushNow(["products"], "GLOW: удалён товар"); }
    }));
  }

  /* ---------- Редактирование ---------- */
  function startEdit(id) {
    const p = GLOW.getProducts().find((x) => x.id === id);
    if (!p) return;
    $("#editId").value = p.id;
    $("#f_name").value = p.name;
    $("#f_brand").value = p.brand;
    renderCatSelect(p.category, p.subcategory);
    $("#f_category").value = p.category;
    renderSubSelect(p.category, p.subcategory);
    $("#f_price").value = p.price;
    $("#f_oldPrice").value = p.oldPrice || "";
    $("#f_stock").value = p.stock;
    $("#f_rating").value = p.rating;
    $("#f_reviews").value = p.reviews;
    $("#f_desc").value = p.description || "";
    $("#f_badge").value = p.badge || "";
    selectPicker(p.emoji, p.gradient);
    currentPhotos = Array.isArray(p.photos) ? p.photos.slice() : [];
    renderPhotoGrid();
    $("#formTitle").textContent = "Редактирование";
    $("#submitBtn").textContent = "Сохранить изменения";
    $("#cancelEdit").style.display = "block";
    $(".panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function resetForm() {
    $("#productForm").reset();
    $("#editId").value = "";
    renderCatSelect();
    renderSubSelect($("#f_category").value);
    selectPicker(EMOJIS[0], GRADS[0]);
    currentPhotos = [];
    renderPhotoGrid();
    $("#formTitle").textContent = "Новый товар";
    $("#submitBtn").textContent = "Добавить товар";
    $("#cancelEdit").style.display = "none";
  }

  function renderAll() { renderStats(); renderCatSelect(); renderList($("#search").value); }

  /* ---------- Фотографии товара (галерея) ---------- */
  let currentPhotos = [];   // редактируемый список фото текущего товара (короткие URL)
  let dragFrom = null;      // индекс перетаскиваемого фото
  let uploadSeq = 0;        // счётчик заглушек «идёт загрузка»
  const isUploading = (s) => typeof s === "string" && s.startsWith("__uploading__");

  function renderPhotoGrid() {
    const grid = $("#photoGrid");
    if (!grid) return;
    if (!currentPhotos.length) {
      grid.innerHTML = `<div class="photo-empty">Фото ещё нет. Пока в каталоге показывается иконка — загрузите фото или добавьте ссылку.</div>`;
      return;
    }
    const last = currentPhotos.length - 1;
    grid.innerHTML = currentPhotos.map((src, i) => {
      if (isUploading(src)) {
        return `<div class="photo-cell uploading"><div class="photo-loading"><span class="spin"></span>загрузка…</div></div>`;
      }
      return `
      <div class="photo-cell" draggable="true" data-i="${i}">
        <img src="${src}" alt="фото ${i + 1}" />
        ${i === 0 ? `<span class="photo-main">главное</span>` : ""}
        <div class="photo-ops">
          <button type="button" class="pop mv" data-i="${i}" data-dir="-1" title="Левее" ${i === 0 ? "disabled" : ""}>◀</button>
          <button type="button" class="pop mv" data-i="${i}" data-dir="1" title="Правее" ${i === last ? "disabled" : ""}>▶</button>
          <button type="button" class="pop del" data-i="${i}" title="Удалить">✕</button>
        </div>
      </div>`;
    }).join("");
    $$(".mv", grid).forEach((b) => b.addEventListener("click", () => movePhoto(+b.dataset.i, +b.dataset.dir)));
    $$(".photo-cell .del", grid).forEach((b) => b.addEventListener("click", () => { currentPhotos.splice(+b.dataset.i, 1); renderPhotoGrid(); }));
    bindPhotoDnD(grid);
  }
  // Залить фото в репозиторий и подставить короткую ссылку (вместо тяжёлого base64).
  async function addPhotoFromDataUrl(dataUrl, nameHint) {
    if (!GLOW.hasToken()) {
      // без токена — держим локально, только на этом устройстве
      currentPhotos.push(dataUrl); renderPhotoGrid();
      toast("⚠️ Фото сохранится только на этом устройстве. Подключите GitHub во вкладке «🔗 Подключение».");
      return;
    }
    const ph = "__uploading__" + (uploadSeq++);
    currentPhotos.push(ph); renderPhotoGrid();
    try {
      const url = await GLOW.ghUploadImage(dataUrl, nameHint);
      const i = currentPhotos.indexOf(ph);
      if (i !== -1) currentPhotos[i] = url; else currentPhotos.push(url);
      renderPhotoGrid();
    } catch (err) {
      const i = currentPhotos.indexOf(ph);
      if (i !== -1) currentPhotos.splice(i, 1);
      renderPhotoGrid();
      toast("Не удалось загрузить фото: " + err.message);
    }
  }
  function movePhoto(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= currentPhotos.length) return;
    [currentPhotos[i], currentPhotos[j]] = [currentPhotos[j], currentPhotos[i]];
    renderPhotoGrid();
  }
  function bindPhotoDnD(grid) {
    $$(".photo-cell", grid).forEach((cell) => {
      cell.addEventListener("dragstart", () => { dragFrom = +cell.dataset.i; cell.classList.add("dragging"); });
      cell.addEventListener("dragend", () => { dragFrom = null; $$(".photo-cell", grid).forEach((c) => c.classList.remove("dragging", "drop-target")); });
      cell.addEventListener("dragover", (e) => { e.preventDefault(); cell.classList.add("drop-target"); });
      cell.addEventListener("dragleave", () => cell.classList.remove("drop-target"));
      cell.addEventListener("drop", (e) => {
        e.preventDefault(); cell.classList.remove("drop-target");
        const to = +cell.dataset.i;
        if (dragFrom === null || dragFrom === to) return;
        const [moved] = currentPhotos.splice(dragFrom, 1);
        currentPhotos.splice(to, 0, moved);
        renderPhotoGrid();
      });
    });
  }
  function initPhotos() {
    renderPhotoGrid();
    $("#f_photoFile").addEventListener("change", (e) => {
      [...e.target.files].forEach((f) => readImageResized(f, 1000, (dataUrl) => addPhotoFromDataUrl(dataUrl, f.name)));
      e.target.value = "";
    });
    const addUrl = () => {
      const v = $("#f_photoUrl").value.trim();
      if (!v) return;
      currentPhotos.push(v); $("#f_photoUrl").value = ""; renderPhotoGrid();
    };
    $("#f_photoUrlAdd").addEventListener("click", addUrl);
    $("#f_photoUrl").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } });
  }

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
      if (confirm("Удалить слайд?")) { GLOW.deleteSlide(b.dataset.del); renderSlideList(); toast("Слайд удалён"); pushNow(["slides"], "GLOW: слайдер"); }
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
      pushNow(["slides"], "GLOW: слайдер");
    });
    $("#slideCancel").addEventListener("click", resetSlideForm);
    $("#slideReset").addEventListener("click", () => { if (confirm("Сбросить слайдер к стандартному?")) { GLOW.resetSlides(); renderSlideList(); resetSlideForm(); toast("Слайдер сброшен"); pushNow(["slides"], "GLOW: сброс слайдера"); } });
  }

  /* ---------- Категории и подкатегории ---------- */
  function renderCatEdit() {
    const grid = $("#catEditGrid");
    grid.innerHTML = GLOW.getCategories().map((c) => `
      <div class="cat-edit-card" data-id="${c.id}" data-key="${c.key}">
        <div class="cc-prev" ${c.image ? `style="background-image:url('${c.image}')"` : ""}>${c.image ? "" : c.icon}</div>
        <div class="field"><label>Название категории</label>
          <div class="cc-name-row">
            <input type="text" class="cc-name" value="${c.key}" />
            <button class="btn-mini cc-rename" type="button">Переименовать</button>
          </div>
        </div>
        <div class="field"><label>Эмодзи (если без фото)</label><input type="text" class="cc-emoji" value="${c.image ? "" : c.icon}" placeholder="🧴" /></div>
        <input type="hidden" class="cc-image" value="${c.image || ""}" />
        <input type="url" class="cc-url" placeholder="ссылка на фото https://…" style="margin-bottom:.6rem" />
        <div class="cc-actions">
          <label class="btn btn-line file-btn">📁 Фото<input type="file" class="cc-file" accept="image/*" hidden /></label>
          <button class="btn btn-red cc-save" type="button">Сохранить вид</button>
        </div>
        <button class="btn-mini cc-clear" type="button" style="margin-top:.5rem">Убрать фото</button>

        <div class="subs-block">
          <label>Подкатегории</label>
          <div class="subs-list">
            ${c.subs.length ? c.subs.map((s) => `
              <div class="sub-row" data-sub="${s}">
                <input type="text" class="sub-name" value="${s}" />
                <button class="sub-rename" type="button" title="Переименовать">✏️</button>
                <button class="sub-del" type="button" title="Удалить">🗑</button>
              </div>`).join("") : `<div class="subs-empty">пока нет подкатегорий</div>`}
          </div>
          <form class="add-sub-row">
            <input type="text" class="new-sub" placeholder="Новая подкатегория" />
            <button class="btn-mini add-sub-btn" type="submit">+ Добавить</button>
          </form>
        </div>

        <button class="btn-danger cc-delete" type="button" style="margin-top:1rem;width:100%">Удалить категорию</button>
      </div>`).join("");

    $$(".cat-edit-card", grid).forEach((card) => {
      const id = card.dataset.id, key = card.dataset.key;
      const prev = $(".cc-prev", card), imageInput = $(".cc-image", card), emojiInput = $(".cc-emoji", card), urlInput = $(".cc-url", card);
      const setPrev = () => {
        if (imageInput.value) { prev.style.backgroundImage = `url('${imageInput.value}')`; prev.textContent = ""; }
        else { prev.style.backgroundImage = ""; prev.textContent = emojiInput.value || "🏷️"; }
      };
      $(".cc-file", card).addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; readImageResized(f, 600, (url) => { imageInput.value = url; urlInput.value = ""; setPrev(); }); });
      urlInput.addEventListener("input", () => { if (urlInput.value.trim()) { imageInput.value = urlInput.value.trim(); setPrev(); } });
      emojiInput.addEventListener("input", setPrev);
      $(".cc-clear", card).addEventListener("click", () => { imageInput.value = ""; urlInput.value = ""; setPrev(); });
      $(".cc-save", card).addEventListener("click", () => {
        try { GLOW.updateCategoryMeta(id, { icon: emojiInput.value.trim() || "🏷️", image: imageInput.value }); toast(`«${key}» обновлена ✨`); renderCatEdit(); renderCatSelect(); pushNow(["cats"], "GLOW: категории"); }
        catch (err) { toast("Не удалось сохранить — фото слишком большое"); }
      });
      // переименование категории
      $(".cc-rename", card).addEventListener("click", () => {
        const nm = $(".cc-name", card).value.trim();
        if (!nm) { toast("Введите название"); return; }
        if (GLOW.renameCategory(id, nm)) { toast("Категория переименована ✏️"); renderCatEdit(); renderCatSelect(); pushNow(["cats", "products"], "GLOW: переименована категория"); }
        else { toast("Такое название уже есть"); }
      });
      // удаление категории
      $(".cc-delete", card).addEventListener("click", () => {
        if (confirm(`Удалить категорию «${key}»? Товары останутся, но без этой категории.`)) {
          GLOW.deleteCategory(id); toast("Категория удалена"); renderCatEdit(); renderCatSelect(); pushNow(["cats"], "GLOW: удалена категория");
        }
      });
      // подкатегории: переименование/удаление
      $$(".sub-row", card).forEach((row) => {
        const oldSub = row.dataset.sub;
        $(".sub-rename", row).addEventListener("click", () => {
          const nm = $(".sub-name", row).value.trim();
          if (!nm) { toast("Введите название"); return; }
          if (GLOW.renameSubcategory(id, oldSub, nm)) { toast("Подкатегория переименована"); renderCatEdit(); renderCatSelect(); pushNow(["cats", "products"], "GLOW: переименована подкатегория"); }
          else { toast("Такая подкатегория уже есть"); }
        });
        $(".sub-del", row).addEventListener("click", () => {
          if (confirm(`Удалить подкатегорию «${oldSub}»?`)) { GLOW.deleteSubcategory(id, oldSub); toast("Подкатегория удалена"); renderCatEdit(); renderCatSelect(); pushNow(["cats"], "GLOW: удалена подкатегория"); }
        });
      });
      // добавление подкатегории
      $(".add-sub-row", card).addEventListener("submit", (e) => {
        e.preventDefault();
        const nm = $(".new-sub", card).value.trim();
        if (!nm) return;
        if (GLOW.addSubcategory(id, nm)) { toast("Подкатегория добавлена ✨"); renderCatEdit(); renderCatSelect(); pushNow(["cats"], "GLOW: добавлена подкатегория"); }
        else { toast("Такая подкатегория уже есть"); }
      });
    });
  }
  function initCats() {
    renderCatEdit();
    $("#addCatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const nm = $("#newCatName").value.trim();
      const ic = $("#newCatIcon").value.trim();
      if (!nm) return;
      if (GLOW.addCategory(nm, ic)) { $("#addCatForm").reset(); toast(`Категория «${nm}» добавлена 🎉`); renderCatEdit(); renderCatSelect(); pushNow(["cats"], "GLOW: добавлена категория"); }
      else { toast("Такая категория уже есть"); }
    });
    $("#catsReset").addEventListener("click", () => { if (confirm("Сбросить категории и подкатегории к стандартным?")) { GLOW.resetCategories(); renderCatEdit(); renderCatSelect(); toast("Категории сброшены"); pushNow(["cats"], "GLOW: сброс категорий"); } });
  }

  /* ---------- Отзывы ---------- */
  function renderReviewList() {
    const list = $("#reviewList"), reviews = GLOW.getReviews();
    if (!reviews.length) { list.innerHTML = `<div class="empty-list">Отзывов пока нет.</div>`; return; }
    list.innerHTML = reviews.map((r) => `
      <div class="p-row" data-id="${r.id}">
        <div class="pic" style="background:var(--pink-soft)">${r.avatar || "💬"}</div>
        <div class="nm">
          <b>${r.name} <span class="star">${"★".repeat(r.rating)}</span></b>
          <span>${r.city || "—"}</span>
          <small style="white-space:normal">${r.text}</small>
        </div>
        <div class="acts">
          <button class="del" data-del="${r.id}" title="Удалить">🗑</button>
        </div>
      </div>`).join("");
    $$("[data-del]", list).forEach((b) => b.addEventListener("click", () => {
      if (confirm("Удалить этот отзыв?")) { GLOW.deleteReview(b.dataset.del); renderReviewList(); toast("Отзыв удалён"); pushNow(["reviews"], "GLOW: отзывы"); }
    }));
  }
  function initReviews() {
    renderReviewList();
    $("#adminReviewForm").addEventListener("submit", (e) => {
      e.preventDefault();
      GLOW.addReview({ name: $("#ar_name").value, city: $("#ar_city").value, rating: $("#ar_rating").value, text: $("#ar_text").value });
      $("#adminReviewForm").reset(); $("#ar_rating").value = 5;
      renderReviewList(); toast("Отзыв опубликован 💬");
      pushNow(["reviews"], "GLOW: отзывы");
    });
    $("#reviewsReset").addEventListener("click", () => { if (confirm("Сбросить отзывы к стандартным?")) { GLOW.resetReviews(); renderReviewList(); toast("Отзывы сброшены"); pushNow(["reviews"], "GLOW: сброс отзывов"); } });
  }

  /* ---------- Блог ---------- */
  function setPostPreview(url, emoji, cover) {
    const prev = $("#b_prev");
    if (url) { prev.style.backgroundImage = `url('${url}')`; prev.textContent = ""; prev.style.background = ""; prev.style.backgroundImage = `url('${url}')`; prev.style.backgroundSize = "cover"; prev.style.backgroundPosition = "center"; }
    else { prev.style.backgroundImage = ""; prev.style.background = cover || BLOG_COVERS[0]; prev.textContent = emoji || "📝"; }
  }
  function renderCoverPick() {
    const cp = $("#coverPick");
    cp.innerHTML = BLOG_COVERS.map((g) => `<button type="button" data-cover="${g}" style="background:${g}"></button>`).join("");
    $$("button", cp).forEach((b) => b.addEventListener("click", () => {
      $("#b_cover").value = b.dataset.cover;
      $$("button", cp).forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
      if (!$("#b_image").value) setPostPreview("", $("#b_emoji").value, b.dataset.cover);
    }));
  }
  function selectCover(cover) {
    const val = cover || BLOG_COVERS[0];
    $("#b_cover").value = val;
    $$("#coverPick button").forEach((b) => b.classList.toggle("sel", b.dataset.cover === val));
  }
  function renderPostList() {
    const list = $("#postList"), posts = GLOW.getBlog();
    if (!posts.length) { list.innerHTML = `<div class="empty-list">Статей пока нет — добавьте первую.</div>`; return; }
    list.innerHTML = posts.map((p) => `
      <div class="p-row" data-id="${p.id}">
        <div class="pic" ${p.image ? `style="background-image:url('${p.image}');background-size:cover;background-position:center"` : `style="background:${p.cover}"`}>${p.image ? "" : (p.emoji || "📝")}</div>
        <div class="nm">
          <b>${p.title}</b>
          <span>${p.date}</span>
          <small style="white-space:normal">${p.excerpt || ""}</small>
        </div>
        <div class="acts">
          <button class="edit" data-edit="${p.id}" title="Редактировать">✏️</button>
          <button class="del" data-del="${p.id}" title="Удалить">🗑</button>
        </div>
      </div>`).join("");
    $$("[data-edit]", list).forEach((b) => b.addEventListener("click", () => editPost(b.dataset.edit)));
    $$("[data-del]", list).forEach((b) => b.addEventListener("click", () => {
      if (confirm("Удалить статью?")) { GLOW.deletePost(b.dataset.del); renderPostList(); resetPostForm(); toast("Статья удалена"); pushNow(["blog"], "GLOW: блог"); }
    }));
  }
  function editPost(id) {
    const p = GLOW.getPost(id);
    if (!p) return;
    $("#b_id").value = p.id; $("#b_title").value = p.title; $("#b_date").value = p.date;
    $("#b_emoji").value = p.emoji || ""; $("#b_excerpt").value = p.excerpt || ""; $("#b_body").value = p.body || "";
    $("#b_image").value = p.image || ""; $("#b_url").value = "";
    selectCover(p.cover);
    setPostPreview(p.image, p.emoji, p.cover);
    $("#postFormTitle").textContent = "Редактирование статьи";
    $("#postSubmit").textContent = "Сохранить статью";
    $("#postCancel").style.display = "block";
    $("#postFormTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetPostForm() {
    $("#postForm").reset(); $("#b_id").value = ""; $("#b_image").value = "";
    selectCover(BLOG_COVERS[0]); setPostPreview("", "📝", BLOG_COVERS[0]);
    $("#postFormTitle").textContent = "Новая статья";
    $("#postSubmit").textContent = "Добавить статью";
    $("#postCancel").style.display = "none";
  }
  function initBlog() {
    renderCoverPick(); selectCover(BLOG_COVERS[0]); setPostPreview("", "📝", BLOG_COVERS[0]);
    renderPostList();
    $("#b_emoji").addEventListener("input", () => { if (!$("#b_image").value) setPostPreview("", $("#b_emoji").value, $("#b_cover").value); });
    $("#b_file").addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      readImageResized(f, 900, (url) => { $("#b_image").value = url; $("#b_url").value = ""; setPostPreview(url); });
    });
    $("#b_url").addEventListener("input", (e) => { const v = e.target.value.trim(); if (v) { $("#b_image").value = v; setPostPreview(v); } });
    $("#b_clear").addEventListener("click", () => { $("#b_image").value = ""; $("#b_url").value = ""; setPostPreview("", $("#b_emoji").value, $("#b_cover").value); });
    $("#postForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const data = {
        title: $("#b_title").value.trim(), date: $("#b_date").value.trim(),
        emoji: $("#b_emoji").value.trim() || "📝", excerpt: $("#b_excerpt").value.trim(),
        body: $("#b_body").value.trim(), cover: $("#b_cover").value || BLOG_COVERS[0], image: $("#b_image").value,
      };
      const id = $("#b_id").value;
      try {
        if (id) { GLOW.updatePost(id, data); toast("Статья сохранена ✨"); }
        else { GLOW.addPost(data); toast("Статья добавлена 🎉"); }
      } catch (err) { toast("Не удалось сохранить — фото слишком большое"); return; }
      resetPostForm(); renderPostList();
      pushNow(["blog"], "GLOW: блог");
    });
    $("#postCancel").addEventListener("click", resetPostForm);
    $("#blogReset").addEventListener("click", () => { if (confirm("Сбросить блог к стандартному?")) { GLOW.resetBlog(); renderPostList(); resetPostForm(); toast("Блог сброшен"); pushNow(["blog"], "GLOW: сброс блога"); } });
  }

  /* ---------- Подключение к GitHub ---------- */
  function renderConnStatus() {
    const el = $("#connStatus");
    if (!el) return;
    if (!GLOW.hasToken()) { el.className = "conn-status off"; el.textContent = "Не подключено — изменения сохраняются только на этом устройстве"; return; }
    el.className = "conn-status checking"; el.textContent = "Проверяю подключение…";
    GLOW.ghTest().then((r) => {
      if (r.canPush) { el.className = "conn-status on"; el.textContent = `Подключено ✓  ${r.repo} (есть права на запись)`; }
      else { el.className = "conn-status off"; el.textContent = `Подключено к ${r.repo}, но нет прав на запись. Дайте токену доступ Contents: Read and write.`; }
    }).catch((e) => { el.className = "conn-status off"; el.textContent = "Ошибка: " + e.message; });
  }
  function fillConnForm() {
    const c = GLOW.ghConfig();
    $("#gh_owner").value = c.owner; $("#gh_repo").value = c.repo; $("#gh_branch").value = c.branch;
    $("#gh_token").value = ""; $("#gh_token").placeholder = GLOW.hasToken() ? "•••••••• (токен сохранён)" : "github_pat_…  или  ghp_…";
  }
  function initConn() {
    fillConnForm();
    $("#connForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      GLOW.setGhConfig({ owner: $("#gh_owner").value, repo: $("#gh_repo").value, branch: $("#gh_branch").value });
      const tok = $("#gh_token").value.trim();
      if (tok) GLOW.setGhToken(tok);
      $("#gh_token").value = "";
      if (!GLOW.hasToken()) { toast("Введите токен"); renderConnStatus(); return; }
      toast("Проверяю подключение…");
      try {
        const r = await GLOW.ghTest();
        toast(r.canPush ? "Подключено ✓" : "Подключено, но без прав на запись");
      } catch (err) { toast("Ошибка: " + err.message); }
      fillConnForm(); renderConnStatus();
    });
    $("#pullBtn").addEventListener("click", async () => {
      toast("Загрузка с GitHub…");
      const n = await GLOW.pullAll();
      renderAllTabs();
      toast(n ? `Загружено наборов данных: ${n} ✓` : "Не удалось загрузить (нет файлов или сети)");
    });
    $("#pushAllBtn").addEventListener("click", async () => {
      if (!GLOW.hasToken()) { toast("Сначала сохраните токен"); return; }
      if (!confirm("Выгрузить все текущие данные (товары, категории, отзывы, блог, слайдер) в GitHub?")) return;
      toast("Выгрузка в GitHub…");
      try { await GLOW.ghPushMany(["products", "cats", "reviews", "blog", "slides"], "GLOW: первичная выгрузка данных"); toast("Все данные выгружены в GitHub ✓"); renderConnStatus(); }
      catch (e) { toast("GitHub: " + e.message); }
    });
  }

  /* ---------- Инициализация ---------- */
  function init() {
    renderPickers();
    renderCatSelect();
    selectPicker(EMOJIS[0], GRADS[0]);
    initPhotos();
    $("#f_category").addEventListener("change", () => renderSubSelect($("#f_category").value));
    initTabs();
    initSlides();
    initCats();
    initReviews();
    initBlog();
    initConn();

    if (GLOW.isAdmin()) showApp(); else showGate();

    $("#gateForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (GLOW.login($("#gatePass").value)) { toast("Добро пожаловать 👑"); showApp(); }
      else { $("#gateErr").textContent = "Неверный пароль."; $("#gatePass").value = ""; $("#gatePass").focus(); }
    });

    $("#logoutBtn").addEventListener("click", () => { GLOW.logout(); showGate(); });

    $("#productForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (currentPhotos.some(isUploading)) { toast("Подождите — фото ещё загружаются…"); return; }
      const data = {
        name: $("#f_name").value.trim(),
        brand: $("#f_brand").value.trim(),
        category: $("#f_category").value,
        subcategory: $("#f_subcategory").value,
        price: $("#f_price").value,
        oldPrice: $("#f_oldPrice").value,
        stock: $("#f_stock").value,
        rating: $("#f_rating").value,
        reviews: $("#f_reviews").value,
        description: $("#f_desc").value.trim(),
        badge: $("#f_badge").value,
        emoji: $("#f_emoji").value,
        gradient: $("#f_gradient").value,
        photos: currentPhotos.filter((s) => s && !isUploading(s)),
      };
      const editId = $("#editId").value;
      try {
        if (editId) { GLOW.updateProduct(editId, data); toast("Изменения сохранены ✨"); }
        else { GLOW.addProduct(data); toast("Товар добавлен в каталог 🎉"); }
      } catch (err) { toast("Не удалось сохранить — фотографий слишком много или они слишком большие"); return; }
      resetForm();
      renderAll();
      pushNow(["products"], "GLOW: товары");
    });

    $("#cancelEdit").addEventListener("click", resetForm);
    $("#search").addEventListener("input", (e) => renderList(e.target.value));
    $("#resetBtn").addEventListener("click", () => {
      if (confirm("Вернуть стандартный каталог? Все ваши изменения будут потеряны.")) {
        GLOW.resetProducts(); renderAll(); toast("Каталог сброшен к стандартному"); pushNow(["products"], "GLOW: сброс каталога");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
