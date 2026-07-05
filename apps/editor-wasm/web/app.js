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
    let buffer;
    if (embedded) {
      try {
        const res = await fetch("data:application/wasm;base64," + embedded);
        buffer = await res.arrayBuffer();
      } catch {
        // Vissa inbäddade miljöer (strikt CSP) tillåter inte data:-hämtning.
        const bin = atob(embedded);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        buffer = bytes.buffer;
      }
    } else {
      const res = await fetch("../engine/target/wasm32-unknown-unknown/release/fred_engine.wasm");
      buffer = await res.arrayBuffer();
    }
    const { instance } = await WebAssembly.instantiate(buffer, {});
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

  // ============ Parameterläge (kravspec 2.2, V11) ============
  // paramMode: "inline" (fält i löptexten) eller "panel" (sidopanel).
  // panelSide: "left"/"right". panelHidden gäller endast inline-läget.
  const PREFS_KEY = "fred-wasm-ui-prefs";
  let uiPrefs = { paramMode: "inline", panelSide: "right", panelHidden: true };
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    if (saved.paramMode === "panel") uiPrefs.paramMode = "panel";
    if (saved.panelSide === "left") uiPrefs.panelSide = "left";
    if (typeof saved.panelHidden === "boolean") uiPrefs.panelHidden = saved.panelHidden;
  } catch { /* trasig lagring – kör standardvärden */ }

  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(uiPrefs)); } catch { /* lagring avstängd */ }
  }

  function applyUiPrefs() {
    document.body.classList.toggle("param-mode-panel", uiPrefs.paramMode === "panel");
    document.body.classList.toggle("pane-left", uiPrefs.panelSide === "left");
    const paneVisible = uiPrefs.paramMode === "panel" || !uiPrefs.panelHidden;
    $("parampane").hidden = !paneVisible || !model;
    const modeLabel = $("parammode-label");
    if (modeLabel) modeLabel.innerHTML = uiPrefs.paramMode === "inline" ? "Panel-<br>läge" : "Inline-<br>läge";
    const paneLabel = $("parampane-label");
    if (paneLabel) paneLabel.innerHTML = uiPrefs.panelHidden ? "Visa<br>panel" : "Dölj<br>panel";
    const paneBtn = $("act-parampane");
    if (paneBtn) paneBtn.disabled = uiPrefs.paramMode === "panel"; // alltid synlig i panel-läge
    if (paneVisible && model) renderParamPane();
  }

  /** Bygger parameterpanelen från motorns rendermodell. */
  function renderParamPane() {
    const host = $("pp-list");
    if (!host || !model) return;
    host.innerHTML = "";
    const params = model.doc.params.filter((p) => p.visible !== false);
    if (!params.length) {
      host.innerHTML = '<p style="color:#605e5c;font-size:12px">Mallen har inga parametrar.</p>';
      return;
    }
    for (const p of params) {
      const row = document.createElement("div");
      row.className = "pp-row";
      const label = document.createElement("label");
      label.textContent = p.label;
      row.appendChild(label);
      let input;
      if (p.type === "boolean") {
        input = document.createElement("select");
        input.innerHTML = '<option value="false">Nej</option><option value="true">Ja</option>';
        input.value = String(p.value === true);
        input.addEventListener("change", () => setFromPane(p.id, input.value === "true"));
      } else if (p.type === "list") {
        input = document.createElement("select");
        input.innerHTML = '<option value="">(välj)</option>' +
          (p.options || []).map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
        input.value = p.value == null ? "" : String(p.value);
        input.addEventListener("change", () => setFromPane(p.id, input.value || null));
      } else {
        input = document.createElement("input");
        input.type = p.type === "number" ? "number" : p.type === "date" ? "date" : "text";
        input.value = p.value == null ? "" : String(p.value);
        input.addEventListener("change", () => {
          const v = input.value === "" ? null : (p.type === "number" ? Number(input.value) : input.value);
          setFromPane(p.id, v);
        });
      }
      input.dataset.paramId = p.id;
      row.appendChild(input);
      host.appendChild(row);
    }
  }

  function setFromPane(id, value) {
    const res = fred({ cmd: "set_param", id, value });
    if (!res.ok) { toast(res.error); return; }
    model = res;
    syncChips();
    updateQat();
    scheduleAutosave();
    renderParamPane(); // synlighet för nästlade parametrar kan ha ändrats
  }

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

  // Sant på iOS/iPadOS där en nedladdningslänk inte tillförlitligt sparar filen.
  function isDownloadUnreliable() {
    const ua = navigator.userAgent || "", plat = navigator.platform || "";
    const iOS = /iP(hone|ad|od)/.test(ua) || /iP(hone|ad|od)/.test(plat);
    const iPadOS = /Mac/.test(plat) && (navigator.maxTouchPoints || 0) > 1; // iPadOS 13+ maskerar sig som macOS
    return iOS || iPadOS;
  }

  // Sant när appen körs inbäddad i en annan sida (t.ex. artifact-visning).
  // Sandboxade iframes kan blockera Web Share och nedladdningar var för sig.
  function isEmbedded() {
    try { return window.self !== window.top; } catch { return true; }
  }

  function triggerDownload(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  // Spara-dialog för osäkra miljöer (iOS/iPadOS eller inbäddad iframe):
  // varje metod triggas av sin egen knapp med egen användargest, och
  // misslyckanden visas synligt i stället för att kedjan faller tyst.
  function saveDialog(filename, text) {
    const shareFile = (navigator.canShare && navigator.share)
      ? [
          new File([text], filename, { type: "application/json" }),
          new File([text], filename, { type: "text/plain" }),
        ].find((f) => { try { return navigator.canShare({ files: [f] }); } catch { return false; } })
      : null;

    const buttons = [];
    if (shareFile) {
      buttons.push({
        label: "Dela…", primary: true,
        onClick: (d) => {
          navigator.share({ files: [shareFile] })
            .then(() => {
              toast(`${filename} skickades till Dela – välj var den ska sparas.`);
              const scrim = d.closest(".dlg-scrim");
              if (scrim) scrim.remove();
            })
            .catch((err) => {
              if (err && err.name === "AbortError") return; // användaren stängde delningsarket
              const st = d.querySelector("#save-status");
              if (st) st.textContent = "Delning tillåts inte här – prova Ladda ner eller Kopiera text.";
            });
          return false; // dialogen stängs av handlern ovan vid lyckad delning
        },
      });
    }
    buttons.push({
      label: "Ladda ner", primary: !shareFile,
      onClick: (d) => {
        triggerDownload(filename, text);
        const st = d.querySelector("#save-status");
        if (st) { st.textContent = "Nedladdning startad – kontrollera Hämtade filer. Kom inget? Använd Kopiera text."; st.style.color = "#1f7a44"; }
        return false;
      },
    });
    buttons.push({
      label: "Kopiera text",
      onClick: (d) => {
        const ta = d.querySelector("#save-text");
        ta.style.display = "block";
        ta.focus(); ta.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        if (!ok && navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Texten kopierad"));
        const st = d.querySelector("#save-status");
        if (st) {
          st.textContent = ok
            ? `Texten kopierad – klistra in i en ny fil med namnet "${filename}".`
            : "Markera texten och kopiera manuellt.";
          st.style.color = ok ? "#1f7a44" : "#b3261e";
        }
        return false;
      },
    });
    buttons.push({ label: "Stäng" });

    showDialog({
      title: `Spara ${filename}`,
      body: `<p style="margin:0 0 8px;font-size:13px;color:#555">Välj hur du vill spara filen. På iPad/iPhone fungerar Dela bäst (välj &rdquo;Spara i Filer&rdquo;). Om inget annat fungerar kan du alltid kopiera texten.</p>
             <p id="save-status" style="margin:0 0 8px;font-size:13px;color:#b3261e;min-height:1em"></p>
             <textarea id="save-text" readonly style="display:none;width:100%;min-height:140px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;white-space:pre">${esc(text)}</textarea>`,
      buttons,
    });
  }

  /** @returns {Promise<"downloaded"|"dialog">} */
  async function download(filename, text) {
    if (!isEmbedded() && !isDownloadUnreliable()) {
      triggerDownload(filename, text);
      return "downloaded";
    }
    saveDialog(filename, text);
    return "dialog";
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
    // En mall hör till en kategori via sitt categoryId eller genom att vara
    // placerad i kategorins templateIds i hierarkin.
    const activeCat = cats.find((c) => c.id === activeCategory) ?? null;
    const visible = mallar.filter(
      (m) => !activeCat || m.categoryId === activeCat.id || (activeCat.templateIds || []).includes(m.id)
    );
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
    if (!visible.length) grid.innerHTML = '<p style="color:#605e5c;font-size:13px">Inga mallar i den här kategorin. Öppna en konfigurationsfil under Öppna filer.</p>';

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
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith(DOC_KEY)) continue;
        try { out.push(JSON.parse(localStorage.getItem(key))); } catch { /* hoppa över trasiga poster */ }
      }
    } catch { /* lagring avstängd (t.ex. inbäddad miljö) – ingen senaste-lista */ }
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
    $("parampane").hidden = true;
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

    // 3x3-matris (kravspec 2.1): fält placeras i celler kolumn x rad;
    // fält utan position hamnar i vänster/mitt, flera fält i samma cell staplas.
    const hf = (fields, host) => {
      host.innerHTML = "";
      const cells = new Map();
      for (const row of ["top", "middle", "bottom"]) {
        for (const col of ["left", "center", "right"]) {
          const cell = document.createElement("div");
          cell.className = `hf-cell hf-col-${col} hf-row-${row}`;
          cells.set(`${col}/${row}`, cell);
          host.appendChild(cell);
        }
      }
      for (const f of fields) {
        let d;
        if (f.kind === "logo") {
          d = document.createElement("span");
          d.className = "hf-logo";
          if (f.logo) d.innerHTML = `<img src="${f.logo}" alt="Logotyp">`;
        } else if (f.kind === "organisation") {
          d = document.createElement("span");
          d.className = "hf-org";
          d.textContent = f.text || "";
        } else {
          d = document.createElement("span");
          d.className = "hf-text";
          d.contentEditable = "true";
          d.dataset.fieldId = f.id;
          d.dataset.ph = f.label || "Text";
          d.textContent = f.text || "";
        }
        // Fältets typografi (kravspec 6.0); oangivet ärvs från dokumentet.
        if (f.styleCss) d.style.cssText = f.styleCss;
        cells.get(`${f.col || "left"}/${f.row || "middle"}`).appendChild(d);
      }
    };
    hf(doc.header, $("page-header"));
    hf(doc.footer, $("page-footer"));

    // Mallens standardtypografi på sidan; block/fält utan egen stil ärver.
    $("page").style.cssText = doc.defaultStyleCss || "";

    const host = $("doc-blocks");
    host.innerHTML = "";
    for (const block of doc.blocks) {
      const sec = document.createElement("section");
      sec.className = "doc-block " + (block.editable ? "editable" : "locked");
      sec.dataset.instanceId = block.instanceId;
      if (!block.editable) sec.tabIndex = -1; // gör låsta block fokuserbara så blockverktygen nås via tryck på touchskärm
      const lockIcon = block.editable ? "" : '<svg viewBox="0 0 24 24"><path d="M6 10V7a6 6 0 1 1 12 0v3h1v11H5V10zm2 0h8V7a4 4 0 1 0-8 0z"/></svg> ';
      sec.innerHTML = `
        <div class="block-tools" contenteditable="false">
          <span class="tag">${lockIcon}${esc(block.title)}${block.editable ? "" : " (låst)"}</span>
          <button data-act="up" title="Flytta upp">▲</button>
          <button data-act="down" title="Flytta ned">▼</button>
          <button data-act="remove" title="Ta bort block">✕</button>
        </div>
        <div class="block-body"${block.editable ? ' contenteditable="true" spellcheck="true"' : ""}></div>`;
      const body = sec.querySelector(".block-body");
      body.innerHTML = block.html;
      // Blockets typografi (kravspec 6.0); oangivet ärvs från dokumentet.
      if (block.styleCss) body.style.cssText = block.styleCss;
      host.appendChild(sec);
    }

    syncChips();
    updateQat();
    updateStatus();
    applyUiPrefs();
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
    if (!$("parampane").hidden) renderParamPane();
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
  on("act-parammode", () => {
    uiPrefs.paramMode = uiPrefs.paramMode === "inline" ? "panel" : "inline";
    savePrefs();
    applyUiPrefs();
  });
  on("act-paramside", () => {
    uiPrefs.panelSide = uiPrefs.panelSide === "right" ? "left" : "right";
    savePrefs();
    applyUiPrefs();
  });
  on("act-parampane", () => {
    uiPrefs.panelHidden = !uiPrefs.panelHidden;
    savePrefs();
    applyUiPrefs();
  });
  on("act-find", () => toggleNavpane(true));
  on("act-replace", () => openReplaceDialog());
  on("title-search", () => toggleNavpane(true));

  // ===================== Ångra / gör om / spara =====================

  function doUndo() { flushAll(); refreshFull(fred({ cmd: "undo" })); }
  function doRedo() { flushAll(); refreshFull(fred({ cmd: "redo" })); }

  async function saveToFile() {
    flushAll();
    const res = fred({ cmd: "save_session" });
    if (!res.ok) { toast(res.error); return; }
    // Chromium ignorerar download-attributet för blob-URL:er med icke-ASCII-tecken.
    const name = (model.doc.templateName || "dokument")
      .toLowerCase()
      .replace(/[åä]/g, "a").replace(/ö/g, "o")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "dokument";
    const method = await download(`${name}.fred.json`, JSON.stringify(res.file, null, 2));
    if (method === "downloaded") toast("Dokumentet har sparats som fil.");
    // "dialog": spara-dialogen ger själv återkoppling per vald metod.
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
          <dt>Motor</dt><dd>fred-engine (WebAssembly)</dd>
          <dt>Version</dt><dd>${esc(window.FRED_APP_VERSION ? "v" + window.FRED_APP_VERSION : "–")}</dd></dl>`);
        break;
      }
      case "new":
        h1.textContent = "Nytt";
        main.appendChild(bsRow("Gå till startsidan", "Välj mall och skapa ett nytt dokument.", () => leaveEditor()));
        break;
      case "open":
        h1.textContent = "Öppna";
        main.appendChild(bsRow("Öppna dokument", "Fortsätt arbeta med en sparad .fred.json-fil.", () => { $("backstage").hidden = true; openSessionFile(); }));
        main.appendChild(bsRow("Öppna konfigurationsfil", "Läs in organisationer, hierarki och mallar från en fred-konfiguration.json.", () => { $("backstage").hidden = true; openConfigFile(); }));
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
      if (!mall) { toast("Läs in dokumentets mall först (Öppna konfigurationsfil)."); return; }
      const res = fred({ cmd: "open_session", mall, session, seed: Date.now() });
      if (!res.ok) { toast(res.error); return; }
      currentMall = mall;
      enterEditor(res);
    });
  }

  // Enhetlig konfigurationsfil (kravspec V12): organisationer, hierarki och
  // samtliga mallar i en fil. Inbyggd demo-data behålls; filens innehåll
  // vinner vid krockande id:n.
  function openConfigFile() {
    pickFile((data) => {
      if (data?.marker !== "fred-konfiguration" ||
          !Array.isArray(data.organisations) || !Array.isArray(data.mallar)) {
        toast("Filen är inte en Fred-konfigurationsfil.");
        return;
      }
      const orgIds = new Set(data.organisations.map((o) => o.id));
      organisations = [...organisations.filter((o) => !orgIds.has(o.id)), ...data.organisations];
      const mallIds = new Set(data.mallar.map((m) => m.id));
      mallar = [...mallar.filter((m) => !mallIds.has(m.id)), ...data.mallar];
      if (data.hierarchy) hierarchy = data.hierarchy;
      activeCategory = null;
      fred({ cmd: "load_organisations", organisations });
      toast(`Konfiguration inläst: ${data.organisations.length} organisation(er), ${data.mallar.length} mall(ar).`);
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
  on("open-config-btn", openConfigFile);
  on("open-import-btn", openImportFile);
  on("rail-open", () => openSessionFile());
  on("rail-new", () => window.scrollTo(0, 0));
  on("rail-home", () => renderStart());

  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".menu") && !e.target.closest(".fred-cc")) closeMenus();
  });

  window.addEventListener("resize", updateStatusSoon);

  // iOS Safari kan lämna fönstret panorerat efter att skärmtangentbordet
  // stängts – dra tillbaka layouten så att dokumentet går att rulla igen.
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    });
  }

  // ===================== Start & extern applikationsstart =====================

  await initWasm();
  // Hämta motorns version (från engine/Cargo.toml) och visa den i gränssnittet.
  const pong = fred({ cmd: "ping" });
  const appVersion = pong.ok && pong.version ? pong.version : "";
  if (appVersion) {
    const label = `Fred Editor v${appVersion}`;
    const startEl = $("start-version");
    if (startEl) startEl.textContent = label;
    const sbEl = $("sb-version");
    if (sbEl) sbEl.textContent = `v${appVersion}`;
    window.FRED_APP_VERSION = appVersion;
  }
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
