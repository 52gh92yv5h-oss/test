/* Fred Editor – JavaScript-skal ovanpå WebAssembly-motorn (fred-engine).
 * Skalet ritar Word-gränssnittet och skickar varje redigering till motorn,
 * som äger allt dokumenttillstånd (parametrar, block, historik, sessionsfil). */
(async function () {
  "use strict";

  // ===================== WASM-brygga =====================

  let wasm;
  async function initWasm() {
    // I den paketerade appen ligger motorn som base64 i ett <template>-element
    // och läses in som en vanlig resurs via data-URL (fungerar från file://).
    // Under utveckling hämtas .wasm-filen från Rust-byggkatalogen i stället.
    const holder = document.getElementById("fred-wasm-data");
    const embedded = (holder?.content?.textContent ?? holder?.textContent ?? "").trim();
    const src = embedded
      ? "data:application/wasm;base64," + embedded
      : "../engine/target/wasm32-unknown-unknown/release/fred_engine.wasm";
    const res = await fetch(src);
    const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), {});
    wasm = instance.exports;
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /** Skickar ett kommando till motorn. JSON in, JSON ut – synkront. */
  function fred(req) {
    if (!req.now) req.now = new Date().toISOString();
    const bytes = enc.encode(JSON.stringify(req));
    const inPtr = wasm.fred_alloc(bytes.length);
    new Uint8Array(wasm.memory.buffer, inPtr, bytes.length).set(bytes);
    const outPtr = wasm.fred_cmd(inPtr, bytes.length);
    wasm.fred_free(inPtr, bytes.length);
    const len = new DataView(wasm.memory.buffer).getUint32(outPtr, true);
    const json = dec.decode(new Uint8Array(wasm.memory.buffer, outPtr + 4, len));
    wasm.fred_free(outPtr, 4 + len);
    const res = JSON.parse(json);
    if (!res.ok && res.error) console.warn("fred-engine:", res.error, req.cmd);
    return res;
  }

  // ===================== Tillstånd =====================

  const $ = (id) => document.getElementById(id);
  const demo = window.FRED_DEMO || { organisations: [], mallar: [], hierarchy: null };

  let organisations = [...demo.organisations];
  let mallar = [...demo.mallar];
  let hierarchy = demo.hierarchy;
  let currentMall = null;
  let model = null; // senaste rendermodellen från motorn (model.doc)
  let pendingImport = null; // importfil som väntar på att ett dokument skapas
  let zoom = 100;
  let activeCategory = null;

  const DOC_KEY = "fred-doc-";
  const RECENT_LIMIT = 8;

  // ===================== Småhjälpare =====================

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function toast(msg, ms = 2400) {
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  function closeMenus() {
    document.querySelectorAll(".menu").forEach((m) => m.remove());
  }

  /** Enkel popover-meny förankrad vid en rektangel (Word-galleri/dropdown). */
  function showMenu(rect, items, title) {
    closeMenus();
    const menu = document.createElement("div");
    menu.className = "menu";
    if (title) {
      const t = document.createElement("div");
      t.className = "menu-title";
      t.textContent = title;
      menu.appendChild(t);
    }
    for (const item of items) {
      const btn = document.createElement("button");
      btn.className = "item" + (item.selected ? " sel" : "");
      btn.innerHTML = esc(item.label) + (item.sub ? `<span class="sub">${esc(item.sub)}</span>` : "");
      btn.addEventListener("click", () => {
        closeMenus();
        item.onPick();
      });
      menu.appendChild(btn);
    }
    document.body.appendChild(menu);
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    menu.style.left = Math.min(rect.left, innerWidth - mw - 8) + "px";
    menu.style.top = (rect.bottom + mh + 8 > innerHeight ? rect.top - mh - 4 : rect.bottom + 4) + "px";
    return menu;
  }

  function showDialog({ title, body, buttons }) {
    const scrim = document.createElement("div");
    scrim.className = "dlg-scrim";
    const dlg = document.createElement("div");
    dlg.className = "dlg";
    dlg.innerHTML = `<header>${esc(title)}</header><div class="dlg-body">${body}</div><footer></footer>`;
    const foot = dlg.querySelector("footer");
    for (const b of buttons) {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      if (b.primary) btn.className = "primary";
      btn.addEventListener("click", () => {
        if (b.onClick && b.onClick(dlg) === false) return;
        scrim.remove();
      });
      foot.appendChild(btn);
    }
    scrim.appendChild(dlg);
    scrim.addEventListener("mousedown", (e) => { if (e.target === scrim) scrim.remove(); });
    document.body.appendChild(scrim);
    const first = dlg.querySelector("input,select");
    if (first) first.focus();
    return dlg;
  }

  function download(filename, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function pickFile(onLoaded) {
    const input = $("file-input");
    input.onchange = () => {
      const file = input.files[0];
      input.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          onLoaded(JSON.parse(reader.result), file.name);
        } catch {
          toast("Filen kunde inte läsas som JSON.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ===================== Startskärm =====================

  function greeting() {
    const h = new Date().getHours();
    return h < 10 ? "God morgon" : h < 18 ? "God dag" : "God kväll";
  }

  function categoriesOf(node, out = []) {
    if (!node) return out;
    for (const child of node.children || []) {
      out.push(child);
      categoriesOf(child, out);
    }
    return out;
  }

  function allowedOrgs(mall) {
    const scope = mall.orgScope || { mode: "all" };
    if (scope.mode === "specific") return organisations.filter((o) => o.id === scope.organisationId);
    if (scope.mode === "selected") return organisations.filter((o) => (scope.organisationIds || []).includes(o.id));
    return organisations;
  }

  function renderStart() {
    $("greeting").textContent = greeting();

    const cats = categoriesOf(hierarchy);
    const chips = $("cat-chips");
    chips.innerHTML = "";
    const mkChip = (label, id) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.className = (activeCategory === id) ? "on" : "";
      b.addEventListener("click", () => { activeCategory = id; renderStart(); });
      chips.appendChild(b);
    };
    mkChip("Alla", null);
    cats.forEach((c) => mkChip(c.name, c.id));

    const grid = $("tpl-grid");
    grid.innerHTML = "";
    const visible = mallar.filter((m) => !activeCategory || m.categoryId === activeCategory);
    for (const mall of visible) {
      const card = document.createElement("button");
      card.className = "tpl-card";
      card.innerHTML = `
        <div class="tpl-thumb">
          <div class="t-title">${esc(mall.name)}</div>
          <div class="t-line"></div><div class="t-field"></div><br>
          <div class="t-line"></div><div class="t-line"></div><div class="t-line short"></div><br>
          <div class="t-field"></div> <div class="t-field"></div>
          <div class="t-line"></div><div class="t-line short"></div>
        </div>
        <div class="tpl-name">${esc(mall.name)}</div>
        <div class="tpl-desc">${esc(mall.description || "")}</div>`;
      card.addEventListener("click", () => newDocumentFlow(mall));
      grid.appendChild(card);
    }
    if (!visible.length) grid.innerHTML = '<p style="color:#605e5c;font-size:13px">Inga mallar i den här kategorin. Läs in mallfiler under Öppna filer.</p>';

    const recent = $("recent-list");
    recent.innerHTML = "";
    const docs = recentDocs();
    if (!docs.length) recent.innerHTML = '<p style="color:#605e5c;font-size:13px">Inga senaste dokument ännu.</p>';
    for (const entry of docs) {
      const b = document.createElement("button");
      b.className = "recent-item";
      b.innerHTML = `
        <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="5" fill="#185ABD"/><text x="16" y="23" font-family="Georgia" font-size="19" fill="#fff" text-anchor="middle">F</text></svg>
        <span><span class="ri-name">${esc(entry.session.templateName)}</span><br>
        <span class="ri-sub">Ändrad ${new Date(entry.savedAt).toLocaleString("sv-SE")}</span></span>`;
      b.addEventListener("click", () => resumeDocument(entry));
      recent.appendChild(b);
    }
  }

  function recentDocs() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith(DOC_KEY)) continue;
      try { out.push(JSON.parse(localStorage.getItem(key))); } catch { /* hoppa över trasiga poster */ }
    }
    return out.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
  }

  function newDocumentFlow(mall, presetOrgId, presetValues) {
    const orgs = allowedOrgs(mall);
    if (!orgs.length) { toast("Ingen organisation är behörig för den här mallen."); return; }
    const importValues = presetValues || (pendingImport ? pendingImport.values : undefined);
    const importOrg = presetOrgId || (pendingImport ? pendingImport.organisationId : undefined);
    const start = (orgId) => {
      pendingImport = null;
      startSession(mall, orgId, importValues);
    };
    if (importOrg && orgs.some((o) => o.id === importOrg)) return start(importOrg);
    if (orgs.length === 1) return start(orgs[0].id);
    showDialog({
      title: "Välj organisation",
      body: `<p>Vilken organisation utfärdar dokumentet?</p>
             <label>Organisation</label>
             <select id="org-pick">${orgs.map((o) => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join("")}</select>`,
      buttons: [
        { label: "Avbryt" },
        { label: "Skapa", primary: true, onClick: (dlg) => start(dlg.querySelector("#org-pick").value) },
      ],
    });
  }

  function resumeDocument(entry) {
    const mall = entry.mall || mallar.find((m) => m.id === entry.session.templateId);
    if (!mall) { toast("Mallen för dokumentet saknas."); return; }
    const res = fred({ cmd: "open_session", mall, session: entry.session, seed: Date.now() });
    if (!res.ok) { toast(res.error); return; }
    currentMall = mall;
    enterEditor(res);
  }

  function startSession(mall, orgId, values) {
    const res = fred({ cmd: "new_session", mall, organisationId: orgId, seed: Date.now(), values: values || null });
    if (!res.ok) { toast(res.error); return; }
    currentMall = mall;
    enterEditor(res);
  }

  // ===================== Dokumentvy =====================

  function enterEditor(res) {
    model = res;
    $("start-screen").hidden = true;
    $("editor-screen").hidden = false;
    $("backstage").hidden = true;
    renderDoc();
    autosave();
  }

  function leaveEditor() {
    flushAll();
    autosave();
    model = null;
    currentMall = null;
    $("editor-screen").hidden = true;
    $("backstage").hidden = true;
    $("start-screen").hidden = false;
    clearHighlights();
    renderStart();
  }

  const paramById = () => new Map(model.doc.params.map((p) => [p.id, p]));

  /** Ritar om hela dokumentet från motorns rendermodell. */
  function renderDoc() {
    const doc = model.doc;
    $("doc-title").textContent = `${doc.templateName} – Fred`;

    const hf = (fields, host) => {
      host.innerHTML = "";
      for (const f of fields) {
        if (f.kind === "logo") {
          const d = document.createElement("span");
          d.className = "hf-logo";
          if (f.logo) d.innerHTML = `<img src="${f.logo}" alt="Logotyp">`;
          host.appendChild(d);
        } else if (f.kind === "organisation") {
          const d = document.createElement("span");
          d.className = "hf-org";
          d.textContent = f.text || "";
          host.appendChild(d);
        } else {
          const d = document.createElement("span");
          d.className = "hf-text";
          d.contentEditable = "true";
          d.dataset.fieldId = f.id;
          d.dataset.ph = f.label || "Text";
          d.textContent = f.text || "";
          host.appendChild(d);
        }
      }
    };
    hf(doc.header, $("page-header"));
    hf(doc.footer, $("page-footer"));

    const host = $("doc-blocks");
    host.innerHTML = "";
    for (const block of doc.blocks) {
      const sec = document.createElement("section");
      sec.className = "doc-block " + (block.editable ? "editable" : "locked");
      sec.dataset.instanceId = block.instanceId;
      const lockIcon = block.editable ? "" : '<svg viewBox="0 0 24 24"><path d="M6 10V7a6 6 0 1 1 12 0v3h1v11H5V10zm2 0h8V7a4 4 0 1 0-8 0z"/></svg> ';
      sec.innerHTML = `
        <div class="block-tools" contenteditable="false">
          <span class="tag">${lockIcon}${esc(block.title)}${block.editable ? "" : " (låst)"}</span>
          <button data-act="up" title="Flytta upp">▲</button>
          <button data-act="down" title="Flytta ned">▼</button>
          <button data-act="remove" title="Ta bort block">✕</button>
        </div>
        <div class="block-body"${block.editable ? ' contenteditable="true" spellcheck="true"' : ""}></div>`;
      sec.querySelector(".block-body").innerHTML = block.html;
      host.appendChild(sec);
    }

    syncChips();
    updateQat();
    updateStatus();
  }

  /** Global uppdatering: speglar motorns parametervärden i alla inline-fält. */
  function syncChips() {
    const params = paramById();
    document.querySelectorAll("#page .fred-cc").forEach((chip) => {
      const p = params.get(chip.dataset.paramId);
      if (!p) return;
      chip.classList.toggle("fred-cc-hidden", p.visible === false);
      chip.dataset.ph = p.label;
      if (!chip.classList.contains("editing") && chip.textContent !== p.display) {
        chip.textContent = p.display;
      }
    });
  }

  function updateQat() {
    $("qat-undo").disabled = !model?.doc.canUndo;
    $("qat-redo").disabled = !model?.doc.canRedo;
  }

  function refresh(res) {
    if (!res.ok) { toast(res.error); return false; }
    model = res;
    syncChips();
    updateQat();
    scheduleAutosave();
    return true;
  }

  function refreshFull(res) {
    if (!res.ok) { toast(res.error); return false; }
    model = res;
    clearHighlights();
    renderDoc();
    scheduleAutosave();
    return true;
  }

  // ===================== Skrivande i redigerbara block =====================

  const dirty = new Map(); // instanceId -> timeout
  let typingBurst = false;

  /** Läser blockets HTML rensad från sökmarkeringar och redigeringstillstånd. */
  function cleanHtml(body) {
    const clone = body.cloneNode(true);
    clone.querySelectorAll("mark.fred-hit").forEach((m) => m.replaceWith(...m.childNodes));
    clone.querySelectorAll(".fred-cc").forEach((cc) => {
      cc.classList.remove("editing");
      cc.setAttribute("contenteditable", "false");
    });
    clone.querySelectorAll(".block-tools").forEach((t) => t.remove());
    clone.normalize();
    return clone.innerHTML;
  }

  function flushBlock(instanceId) {
    const timer = dirty.get(instanceId);
    if (timer !== undefined) { clearTimeout(timer); dirty.delete(instanceId); }
    const sec = document.querySelector(`.doc-block[data-instance-id="${CSS.escape(instanceId)}"]`);
    if (!sec || !model) return;
    fred({ cmd: "set_user_content", instanceId, html: cleanHtml(sec.querySelector(".block-body")) });
  }

  function flushAll() {
    for (const id of [...dirty.keys()]) flushBlock(id);
    typingBurst = false;
  }

  $("doc-blocks").addEventListener("beforeinput", (e) => {
    if (e.target.closest(".fred-cc")) return;
    if (!typingBurst) { fred({ cmd: "commit" }); typingBurst = true; }
  });

  $("doc-blocks").addEventListener("input", (e) => {
    if (e.target.closest(".fred-cc")) return;
    const sec = e.target.closest(".doc-block");
    if (!sec) return;
    const id = sec.dataset.instanceId;
    clearTimeout(dirty.get(id));
    dirty.set(id, setTimeout(() => { flushBlock(id); scheduleAutosave(); updateQat(); }, 500));
    updateStatusSoon();
  });

  $("doc-blocks").addEventListener("focusout", () => { typingBurst = false; });

  // Blockverktyg (flytta/ta bort) – knappar i hörnet av varje block.
  $("doc-blocks").addEventListener("click", (e) => {
    const btn = e.target.closest(".block-tools button");
    if (!btn) return;
    const sec = e.target.closest(".doc-block");
    const instanceId = sec.dataset.instanceId;
    flushAll();
    if (btn.dataset.act === "up") refreshFull(fred({ cmd: "move_block", instanceId, dir: -1 }));
    else if (btn.dataset.act === "down") refreshFull(fred({ cmd: "move_block", instanceId, dir: 1 }));
    else if (btn.dataset.act === "remove") refreshFull(fred({ cmd: "remove_block", instanceId }));
  });

  // ===================== Inline-parametrar (innehållskontroller) =====================

  let activeChip = null;

  document.querySelector("#page").addEventListener("mousedown", (e) => {
    const chip = e.target.closest(".fred-cc");
    if (!chip) return;
    const type = chip.dataset.type;
    if (type === "list" || type === "boolean" || type === "date") {
      e.preventDefault();
      openChipMenu(chip);
    } else if (chip !== activeChip) {
      // Text/nummer: gör fältet skrivbart på plats.
      beginChipEdit(chip);
    }
  });

  function beginChipEdit(chip) {
    endChipEdit();
    fred({ cmd: "commit" }); // historikpunkt innan ändringen
    activeChip = chip;
    chip.classList.add("editing");
    chip.setAttribute("contenteditable", "true");
    setTimeout(() => {
      chip.focus();
      if (chip.textContent) {
        const range = document.createRange();
        range.selectNodeContents(chip);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  }

  function endChipEdit() {
    if (!activeChip) return;
    const chip = activeChip;
    activeChip = null;
    chip.classList.remove("editing");
    chip.setAttribute("contenteditable", "false");
    const p = paramById().get(chip.dataset.paramId);
    let value = chip.textContent;
    if (p && p.type === "number" && value.trim() !== "" && !Number.isNaN(Number(value.replace(",", ".")))) {
      value = Number(value.replace(",", "."));
    }
    if (value === "") value = null;
    refresh(fred({ cmd: "set_param_live", id: chip.dataset.paramId, value }));
  }

  document.querySelector("#page").addEventListener("input", (e) => {
    const chip = e.target.closest?.(".fred-cc");
    if (!chip || chip !== activeChip) return;
    // Global uppdatering medan man skriver: alla andra förekomster följer med direkt.
    const res = fred({ cmd: "set_param_live", id: chip.dataset.paramId, value: chip.textContent });
    if (res.ok) { model = res; syncChips(); scheduleAutosave(); }
  });

  document.querySelector("#page").addEventListener("focusout", (e) => {
    if (e.target.closest?.(".fred-cc") === activeChip && activeChip) endChipEdit();
  });

  document.querySelector("#page").addEventListener("keydown", (e) => {
    const chip = e.target.closest?.(".fred-cc");
    if (chip && chip === activeChip && (e.key === "Enter" || e.key === "Tab" || e.key === "Escape")) {
      e.preventDefault();
      endChipEdit();
    }
  });

  function openChipMenu(chip) {
    const p = paramById().get(chip.dataset.paramId);
    if (!p) return;
    const rect = chip.getBoundingClientRect();
    const setValue = (value) => refresh(fred({ cmd: "set_param", id: p.id, value }));

    if (p.type === "list") {
      showMenu(rect, (p.options || []).map((o) => ({
        label: o.label,
        selected: p.value === o.value,
        onPick: () => setValue(o.value),
      })), p.label);
    } else if (p.type === "boolean") {
      showMenu(rect, [
        { label: "Ja", selected: p.value === true, onPick: () => setValue(true) },
        { label: "Nej", selected: p.value !== true, onPick: () => setValue(false) },
      ], p.label);
    } else if (p.type === "date") {
      closeMenus();
      const menu = document.createElement("div");
      menu.className = "menu";
      menu.innerHTML = `<div class="menu-title">${esc(p.label)}</div>
        <div style="padding:6px 10px"><input type="date" value="${esc(p.value || "")}" style="font-size:13px;padding:4px;border:1px solid #c8c6c4;border-radius:2px"></div>`;
      const clear = document.createElement("button");
      clear.className = "item";
      clear.textContent = "Rensa datum";
      clear.addEventListener("click", () => { closeMenus(); setValue(null); });
      menu.appendChild(clear);
      document.body.appendChild(menu);
      menu.style.left = Math.min(rect.left, innerWidth - menu.offsetWidth - 8) + "px";
      menu.style.top = rect.bottom + 4 + "px";
      const input = menu.querySelector("input");
      input.focus();
      input.addEventListener("change", () => { closeMenus(); setValue(input.value || null); });
    }
  }

  // ===================== Sidhuvud/sidfot =====================

  let hfTimer = null;
  ["page-header", "page-footer"].forEach((id) => {
    $(id).addEventListener("input", (e) => {
      const field = e.target.closest(".hf-text");
      if (!field) return;
      clearTimeout(hfTimer);
      hfTimer = setTimeout(() => {
        fred({ cmd: "set_header_footer", fieldId: field.dataset.fieldId, value: field.textContent });
        scheduleAutosave();
      }, 400);
    });
  });

  // ===================== Menyfliksområdet =====================

  document.querySelectorAll("#ribbon-tabs .tab[data-panel]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#ribbon-tabs .tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".ribbon").forEach((r) => (r.hidden = r.id !== tab.dataset.panel));
    });
  });

  function exec(command, value = null) {
    document.execCommand("styleWithCSS", false, command === "fontName");
    document.execCommand(command, false, value);
  }

  const on = (id, fn) => $(id).addEventListener("click", fn);

  on("act-bold", () => exec("bold"));
  on("act-italic", () => exec("italic"));
  on("act-underline", () => exec("underline"));
  on("act-clear", () => exec("removeFormat"));
  on("act-ul", () => exec("insertUnorderedList"));
  on("act-ol", () => exec("insertOrderedList"));
  on("act-left", () => exec("justifyLeft"));
  on("act-center", () => exec("justifyCenter"));
  on("act-right", () => exec("justifyRight"));
  on("act-cut", () => exec("cut"));
  on("act-copy", () => exec("copy"));
  on("act-paste", async () => {
    try {
      const text = await navigator.clipboard.readText();
      exec("insertText", text);
    } catch {
      toast("Klistra in med Ctrl+V.");
    }
  });

  document.querySelectorAll(".style-chip").forEach((chip) => {
    chip.addEventListener("click", () => exec("formatBlock", "<" + chip.dataset.style + ">"));
  });

  $("font-name").addEventListener("change", (e) => exec("fontName", e.target.value));
  $("font-size").addEventListener("change", (e) => {
    // execCommand saknar punktstorlekar: använd storlek 7 som markör och skriv om till pt.
    document.execCommand("fontSize", false, "7");
    document.querySelectorAll('#doc-blocks font[size="7"]').forEach((f) => {
      const span = document.createElement("span");
      span.style.fontSize = e.target.value + "pt";
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
  });

  on("act-pagebreak", () => {
    exec("insertHTML", '<hr class="page-break">');
  });

  on("act-phrases", (e) => {
    const rect = $("act-phrases").getBoundingClientRect();
    const phrases = model?.doc.freePhrases || [];
    if (!phrases.length) { toast("Mallen har inga fria fraser."); return; }
    showMenu(rect, phrases.map((f) => ({
      label: f.title,
      sub: f.preview,
      onPick: () => {
        flushAll();
        const focused = document.activeElement?.closest?.(".doc-block");
        const res = fred({ cmd: "insert_free_block", blockId: f.blockId, afterInstanceId: focused?.dataset.instanceId });
        if (refreshFull(res) && res.insertedInstanceId) {
          const sec = document.querySelector(`.doc-block[data-instance-id="${CSS.escape(res.insertedInstanceId)}"]`);
          sec?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      },
    })), "Infoga fras");
    e.stopPropagation();
  });

  on("act-header", () => { $("page-header").querySelector(".hf-text")?.focus(); $("page-header").scrollIntoView({ behavior: "smooth", block: "center" }); });
  on("act-footer", () => { $("page-footer").querySelector(".hf-text")?.focus(); $("page-footer").scrollIntoView({ behavior: "smooth", block: "center" }); });

  on("act-wordcount", () => {
    const text = $("doc-blocks").innerText || "";
    const words = (text.match(/\S+/g) || []).length;
    const chars = text.replace(/\s/g, "").length;
    showDialog({
      title: "Ordantal",
      body: `<p style="margin-bottom:8px">Statistik för dokumentet:</p>
             <p>Ord: <b>${words}</b><br>Tecken (utan blanksteg): <b>${chars}</b><br>
             Tecken (med blanksteg): <b>${text.replace(/\n/g, "").length}</b><br>
             Block: <b>${model?.doc.blocks.length ?? 0}</b></p>`,
      buttons: [{ label: "Stäng", primary: true }],
    });
  });

  on("act-selectall", () => {
    const range = document.createRange();
    range.selectNodeContents($("doc-blocks"));
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });

  on("act-navpane", () => toggleNavpane());
  on("act-find", () => toggleNavpane(true));
  on("act-replace", () => openReplaceDialog());
  on("title-search", () => toggleNavpane(true));

  // ===================== Ångra / gör om / spara =====================

  function doUndo() { flushAll(); refreshFull(fred({ cmd: "undo" })); }
  function doRedo() { flushAll(); refreshFull(fred({ cmd: "redo" })); }

  function saveToFile() {
    flushAll();
    const res = fred({ cmd: "save_session" });
    if (!res.ok) { toast(res.error); return; }
    // Chromium ignorerar download-attributet för blob-URL:er med icke-ASCII-tecken.
    const name = (model.doc.templateName || "dokument")
      .toLowerCase()
      .replace(/[åä]/g, "a").replace(/ö/g, "o")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "dokument";
    download(`${name}.fred.json`, JSON.stringify(res.file, null, 2));
    toast("Dokumentet har sparats som fil.");
  }

  on("qat-undo", doUndo);
  on("qat-redo", doRedo);
  on("qat-save", saveToFile);

  document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey && !e.metaKey) {
      if (e.key === "Escape") { closeMenus(); }
      return;
    }
    const inEditor = !$("editor-screen").hidden && $("backstage").hidden;
    if (!inEditor) return;
    const key = e.key.toLowerCase();
    if (key === "z") { e.preventDefault(); doUndo(); }
    else if (key === "y") { e.preventDefault(); doRedo(); }
    else if (key === "s") { e.preventDefault(); saveToFile(); }
    else if (key === "f") { e.preventDefault(); toggleNavpane(true); }
    else if (key === "h") { e.preventDefault(); openReplaceDialog(); }
    else if (key === "b") { e.preventDefault(); exec("bold"); }
    else if (key === "i") { e.preventDefault(); exec("italic"); }
    else if (key === "u") { e.preventDefault(); exec("underline"); }
    else if (key === "p") { e.preventDefault(); window.print(); }
  });

  // ===================== Sök (navigeringsfönstret) =====================

  let hits = [];
  let hitIndex = -1;

  function toggleNavpane(open) {
    const pane = $("navpane");
    const show = open === undefined ? pane.hidden : open;
    pane.hidden = !show;
    if (show) $("nav-input").focus();
    else clearHighlights();
  }

  $("nav-close").addEventListener("click", () => toggleNavpane(false));

  function clearHighlights() {
    document.querySelectorAll("mark.fred-hit").forEach((m) => {
      const parent = m.parentNode;
      m.replaceWith(...m.childNodes);
      parent.normalize();
    });
    hits = [];
    hitIndex = -1;
  }

  function runSearch(query) {
    clearHighlights();
    const resultsEl = $("nav-results");
    if (!query) { resultsEl.textContent = "Skriv för att söka i dokumentet."; return; }
    const q = query.toLowerCase();
    const walker = document.createTreeWalker($("doc-blocks"), NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement.closest(".fred-cc, .block-tools, mark") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const node of textNodes) {
      let text = node.nodeValue;
      let idx = text.toLowerCase().indexOf(q);
      let current = node;
      while (idx !== -1) {
        const matchNode = current.splitText(idx);
        const rest = matchNode.splitText(query.length);
        const mark = document.createElement("mark");
        mark.className = "fred-hit";
        matchNode.replaceWith(mark);
        mark.appendChild(matchNode);
        hits.push(mark);
        current = rest;
        text = current.nodeValue;
        idx = text.toLowerCase().indexOf(q);
      }
    }

    resultsEl.innerHTML = "";
    if (!hits.length) { resultsEl.textContent = "Inga träffar."; return; }
    const info = document.createElement("p");
    info.style.cssText = "margin:2px 0 8px";
    info.textContent = `${hits.length} träffar`;
    resultsEl.appendChild(info);
    hits.forEach((mark, i) => {
      const div = document.createElement("div");
      div.className = "hit";
      const ctx = mark.parentElement.textContent;
      const at = ctx.toLowerCase().indexOf(q);
      div.textContent = (at > 30 ? "…" : "") + ctx.slice(Math.max(0, at - 30), at + query.length + 60);
      div.addEventListener("click", () => gotoHit(i));
      resultsEl.appendChild(div);
    });
    gotoHit(0);
  }

  function gotoHit(i) {
    if (!hits.length) return;
    hitIndex = ((i % hits.length) + hits.length) % hits.length;
    hits.forEach((h, j) => h.classList.toggle("cur", j === hitIndex));
    document.querySelectorAll("#nav-results .hit").forEach((h, j) => h.classList.toggle("cur", j === hitIndex));
    hits[hitIndex].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  let searchTimer = null;
  $("nav-input").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(e.target.value), 250);
  });
  $("nav-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") gotoHit(hitIndex + (e.shiftKey ? -1 : 1));
    if (e.key === "Escape") { $("navpane").hidden = true; clearHighlights(); }
  });
  $("nav-prev").addEventListener("click", () => gotoHit(hitIndex - 1));
  $("nav-next").addEventListener("click", () => gotoHit(hitIndex + 1));

  function openReplaceDialog() {
    const initial = $("nav-input").value;
    showDialog({
      title: "Sök och ersätt",
      body: `<label>Sök efter</label><input type="text" id="rp-find" value="${esc(initial)}">
             <label>Ersätt med</label><input type="text" id="rp-with">
             <p style="margin-top:10px;color:#605e5c">Ersätter i all redigerbar text. Låsta block och parameterfält påverkas inte.</p>`,
      buttons: [
        { label: "Avbryt" },
        {
          label: "Ersätt alla", primary: true,
          onClick: (dlg) => {
            const find = dlg.querySelector("#rp-find").value;
            if (!find) return false;
            flushAll();
            const res = fred({ cmd: "replace_all", search: find, replace: dlg.querySelector("#rp-with").value });
            if (refreshFull(res)) toast(`${res.replacedCount} ersättningar gjorda.`);
          },
        },
      ],
    });
  }

  // ===================== Statusfält & zoom =====================

  let statusTimer = null;
  function updateStatusSoon() { clearTimeout(statusTimer); statusTimer = setTimeout(updateStatus, 300); }

  function updateStatus() {
    if ($("editor-screen").hidden) return;
    const text = $("doc-blocks").innerText || "";
    const words = (text.match(/\S+/g) || []).length;
    $("sb-words").textContent = `${words} ord`;
    const pagePx = 297 * (96 / 25.4);
    const pages = Math.max(1, Math.ceil($("page").offsetHeight / pagePx));
    $("sb-page").textContent = `Sida 1 av ${pages}`;
  }

  function setZoom(z) {
    zoom = Math.min(200, Math.max(50, z));
    $("zoomwrap").style.transform = zoom === 100 ? "" : `scale(${zoom / 100})`;
    $("zoom-range").value = zoom;
    $("zoom-val").textContent = `${zoom} %`;
  }
  $("zoom-range").addEventListener("input", (e) => setZoom(Number(e.target.value)));
  on("zoom-minus", () => setZoom(zoom - 10));
  on("zoom-plus", () => setZoom(zoom + 10));
  on("act-zoom100", () => setZoom(100));
  on("act-zoomin", () => setZoom(zoom + 10));
  on("act-zoomout", () => setZoom(zoom - 10));

  // ===================== Autosparning =====================

  let autosaveTimer = null;
  function scheduleAutosave() { clearTimeout(autosaveTimer); autosaveTimer = setTimeout(autosave, 800); }

  function autosave() {
    if (!model || !currentMall) return;
    const res = fred({ cmd: "save_session" });
    if (!res.ok) return;
    const entry = { savedAt: new Date().toISOString(), mall: currentMall, session: res.file.session };
    try {
      localStorage.setItem(DOC_KEY + res.file.session.id, JSON.stringify(entry));
      const all = recentDocs();
      for (const old of all.slice(RECENT_LIMIT)) localStorage.removeItem(DOC_KEY + old.session.id);
      const el = $("sb-saved");
      el.textContent = "✓ Sparat";
      setTimeout(() => { el.textContent = ""; }, 1500);
    } catch { /* localStorage fullt – autosparning hoppar över tyst */ }
  }

  window.addEventListener("beforeunload", () => { flushAll(); autosave(); });

  // ===================== Arkiv (backstage) =====================

  on("tab-arkiv", () => { flushAll(); showBackstage("info"); });
  on("bs-back", () => { $("backstage").hidden = true; });

  document.querySelectorAll(".bs-item").forEach((item) => {
    item.addEventListener("click", () => showBackstage(item.dataset.bs));
  });

  function bsRow(title, sub, onClick) {
    const row = document.createElement("div");
    row.className = "bs-row";
    row.innerHTML = `<svg viewBox="0 0 24 24"><path d="M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9zM13 3v6h6"/></svg>
      <span><span class="r-t">${esc(title)}</span><br><span class="r-s">${esc(sub)}</span></span>`;
    row.addEventListener("click", onClick);
    return row;
  }

  function showBackstage(section) {
    $("backstage").hidden = false;
    const main = $("bs-main");
    main.innerHTML = "";
    const h1 = document.createElement("h1");
    main.appendChild(h1);
    const doc = model?.doc;

    switch (section) {
      case "info": {
        h1.textContent = "Info";
        const org = doc?.organisation;
        main.insertAdjacentHTML("beforeend", `<dl class="bs-info">
          <dt>Dokument</dt><dd>${esc(doc?.templateName || "–")}</dd>
          <dt>Mall</dt><dd>${esc(currentMall?.name || "–")} (${esc(currentMall?.id || "")})</dd>
          <dt>Utfärdande organisation</dt><dd>${esc(org?.name || "–")}</dd>
          <dt>Senast ändrat</dt><dd>${doc?.updatedAt ? new Date(doc.updatedAt).toLocaleString("sv-SE") : "–"}</dd>
          <dt>Motor</dt><dd>fred-engine (WebAssembly)</dd></dl>`);
        break;
      }
      case "new":
        h1.textContent = "Nytt";
        main.appendChild(bsRow("Gå till startsidan", "Välj mall och skapa ett nytt dokument.", () => leaveEditor()));
        break;
      case "open":
        h1.textContent = "Öppna";
        main.appendChild(bsRow("Öppna dokument", "Fortsätt arbeta med en sparad .fred.json-fil.", () => { $("backstage").hidden = true; openSessionFile(); }));
        main.appendChild(bsRow("Importera uppgifter", "Fyll i parametrar från en JSON-importfil.", () => { $("backstage").hidden = true; openImportFile(); }));
        break;
      case "save":
      case "saveas":
        h1.textContent = section === "save" ? "Spara" : "Spara som";
        main.appendChild(bsRow("Spara som lokal fil", "Dokumentet sparas som JSON och kan öppnas igen senare.", () => { $("backstage").hidden = true; saveToFile(); }));
        break;
      case "print":
        h1.textContent = "Skriv ut";
        main.appendChild(bsRow("Skriv ut", "Öppnar utskriftsdialogen. Dokumentet skrivs ut som det ser ut på sidan.", () => { $("backstage").hidden = true; setTimeout(() => window.print(), 100); }));
        break;
      case "export":
        h1.textContent = "Exportera";
        main.appendChild(bsRow("Skapa PDF", 'Välj "Spara som PDF" som skrivare i utskriftsdialogen.', () => { $("backstage").hidden = true; setTimeout(() => window.print(), 100); }));
        break;
      case "close":
        $("backstage").hidden = true;
        leaveEditor();
        break;
    }
  }

  // ===================== Filhantering =====================

  function openSessionFile() {
    pickFile((data) => {
      const session = data.marker === "fred-session" ? data.session : data.templateId ? data : null;
      if (!session) { toast("Filen är inte en Fred-dokumentfil."); return; }
      const mall = mallar.find((m) => m.id === session.templateId);
      if (!mall) { toast("Läs in dokumentets mall först (Läs in mall)."); return; }
      const res = fred({ cmd: "open_session", mall, session, seed: Date.now() });
      if (!res.ok) { toast(res.error); return; }
      currentMall = mall;
      enterEditor(res);
    });
  }

  function openMallFile() {
    pickFile((data) => {
      const mall = data.marker === "fred-mall" ? data.mall : data.blocks ? data : null;
      if (!mall) { toast("Filen är inte en Fred-mall."); return; }
      mallar = [...mallar.filter((m) => m.id !== mall.id), mall];
      toast(`Mallen "${mall.name}" har lästs in.`);
      renderStart();
    });
  }

  function openOrgsFile() {
    pickFile((data) => {
      const orgs = data.marker === "fred-organisationer" ? data.organisations : Array.isArray(data) ? data : null;
      if (!orgs) { toast("Filen är inte en organisationsfil."); return; }
      organisations = orgs;
      fred({ cmd: "load_organisations", organisations });
      toast(`${orgs.length} organisationer inlästa.`);
      renderStart();
    });
  }

  function openImportFile() {
    pickFile((data) => {
      const values = data.values || (data.marker ? null : data);
      if (!values || typeof values !== "object") { toast("Filen innehåller inga parametervärden."); return; }
      if (model) {
        // Ett dokument är öppet: uppdatera parametrarna direkt (globalt).
        fred({ cmd: "commit" });
        let last = null;
        for (const [id, value] of Object.entries(values)) last = fred({ cmd: "set_param_live", id, value });
        if (last) refresh(last);
        toast("Uppgifterna har importerats till dokumentet.");
      } else {
        pendingImport = { values, organisationId: data.organisationId };
        toast("Uppgifter importerade – de fylls i när du skapar ett dokument.");
      }
    });
  }

  on("open-session-btn", openSessionFile);
  on("open-mall-btn", openMallFile);
  on("open-orgs-btn", openOrgsFile);
  on("open-import-btn", openImportFile);
  on("rail-open", () => openSessionFile());
  on("rail-new", () => window.scrollTo(0, 0));
  on("rail-home", () => renderStart());

  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".menu") && !e.target.closest(".fred-cc")) closeMenus();
  });

  window.addEventListener("resize", updateStatusSoon);

  // ===================== Start & extern applikationsstart =====================

  await initWasm();
  fred({ cmd: "load_organisations", organisations });
  renderStart();

  // Extern applikation kan starta Fred med ?mall=<id>&org=<id>&data=<json>
  // (kravspecifikationen avsnitt 4: programmatisk initiering).
  const params = new URLSearchParams(location.search);
  const launchMallId = params.get("mall") || params.get("template");
  if (launchMallId) {
    const mall = mallar.find((m) => m.id === launchMallId);
    if (mall) {
      let values;
      try { values = params.get("data") ? JSON.parse(params.get("data")) : undefined; } catch { values = undefined; }
      newDocumentFlow(mall, params.get("org") || undefined, values);
    } else {
      toast(`Mallen "${launchMallId}" hittades inte.`);
    }
  }
})();
