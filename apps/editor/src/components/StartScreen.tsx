import { useState } from "react";
import {
  CategoryNode,
  ConfigFile,
  FRED_CONFIG_FILE_MARKER,
  FRED_SESSION_FILE_MARKER,
  FRED_VERSION,
  Mall,
  Organisation,
  SessionFile,
  openJsonFromLocalFile,
  showToast,
} from "@fred/shared";
import { useEditorStore } from "../store";
import { listAutosaves } from "../autosave";

function templateAllowedForOrg(mall: Mall, organisationId: string | undefined): boolean {
  if (mall.orgScope.mode === "all") return true;
  if (!organisationId) return true;
  if (mall.orgScope.mode === "specific") return mall.orgScope.organisationId === organisationId;
  return mall.orgScope.organisationIds.includes(organisationId);
}

// Samma hälsning som WASM-editorns startskärm.
function greeting(): string {
  const h = new Date().getHours();
  return h < 10 ? "God morgon" : h < 18 ? "God dag" : "God kväll";
}

// Alla kategorier under roten, som chips (samma som WASM-editorns categoriesOf).
function categoriesOf(node: CategoryNode | null, out: CategoryNode[] = []): CategoryNode[] {
  if (!node) return out;
  for (const child of node.children) {
    out.push(child);
    categoriesOf(child, out);
  }
  return out;
}

// En mall hör till en kategori via sitt categoryId eller genom att vara
// placerad i kategorins templateIds i hierarkin.
function mallInCategory(mall: Mall, cat: CategoryNode): boolean {
  return mall.categoryId === cat.id || cat.templateIds.includes(mall.id);
}

/** Mallkort med dokument-miniatyr – samma utseende som WASM-editorn. */
function TemplateCard({ mall, onPick }: { mall: Mall; onPick: (mall: Mall) => void }) {
  return (
    <button className="tpl-card" onClick={() => onPick(mall)}>
      <div className="tpl-thumb">
        <div className="t-title">{mall.name}</div>
        <div className="t-line" /><div className="t-field" /><br />
        <div className="t-line" /><div className="t-line" /><div className="t-line short" /><br />
        <div className="t-field" /> <div className="t-field" />
        <div className="t-line" /><div className="t-line short" />
      </div>
      <div className="tpl-name">{mall.name}</div>
      <div className="tpl-desc">{mall.description}</div>
    </button>
  );
}

/** Organisationsval när mallen gäller flera organisationer (som WASM-dialogen). */
function OrgPickDialog({
  orgs,
  onPick,
  onClose,
}: {
  orgs: Organisation[];
  onPick: (orgId: string) => void;
  onClose: () => void;
}) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  return (
    <div className="dlg-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg">
        <header>Välj organisation</header>
        <div className="dlg-body">
          <p>Vilken organisation utfärdar dokumentet?</p>
          <label>Organisation</label>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} autoFocus>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <footer>
          <button onClick={onClose}>Avbryt</button>
          <button className="primary" onClick={() => onPick(orgId)}>Skapa</button>
        </footer>
      </div>
    </div>
  );
}

export default function StartScreen() {
  const organisations = useEditorStore((s) => s.organisations);
  const templates = useEditorStore((s) => s.templates);
  const hierarchy = useEditorStore((s) => s.hierarchy);
  const loadConfigFile = useEditorStore((s) => s.loadConfigFile);
  const startNewSession = useEditorStore((s) => s.startNewSession);
  const openSession = useEditorStore((s) => s.openSession);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orgPick, setOrgPick] = useState<{ mall: Mall; orgs: Organisation[] } | null>(null);

  const handleOpenConfig = async () => {
    const data = await openJsonFromLocalFile<ConfigFile>();
    if (!data) return;
    if (data.marker !== FRED_CONFIG_FILE_MARKER) {
      showToast("Filen är inte en Fred-konfigurationsfil.");
      return;
    }
    loadConfigFile(data);
    showToast(
      `Konfiguration inläst: ${data.organisations.length} organisation(er), ${data.mallar.length} mall(ar).`
    );
  };

  const handleOpenSession = async () => {
    const data = await openJsonFromLocalFile<SessionFile>();
    if (data?.marker === FRED_SESSION_FILE_MARKER) openSession(data.session);
  };

  // Mallval som i WASM-editorn: klick på kortet startar direkt om bara en
  // organisation är behörig, annars visas organisationsvalet i en dialog.
  const handlePickTemplate = (mall: Mall) => {
    const eligible = organisations.filter((o) => templateAllowedForOrg(mall, o.id));
    if (eligible.length === 0) {
      showToast("Ingen organisation är behörig för den här mallen.");
      return;
    }
    if (eligible.length === 1) {
      startNewSession(mall.id, eligible[0].id);
      return;
    }
    setOrgPick({ mall, orgs: eligible });
  };

  const allTemplates = Object.values(templates);
  const categories = categoriesOf(hierarchy);
  const activeCat = categories.find((c) => c.id === activeCategory) ?? null;
  const visible = allTemplates.filter((m) => !activeCat || mallInCategory(m, activeCat));
  const autosaves = listAutosaves();

  return (
    <div className="start-screen">
      <h1>{greeting()}</h1>
      <div className="app-version">Fred Editor v{FRED_VERSION}</div>

      <h2>Nytt dokument</h2>
      <div className="cat-chips">
        <button className={activeCategory === null ? "on" : ""} onClick={() => setActiveCategory(null)}>
          Alla
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={activeCategory === cat.id ? "on" : ""}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="tpl-grid">
        {visible.map((mall) => (
          <TemplateCard key={mall.id} mall={mall} onPick={handlePickTemplate} />
        ))}
        {visible.length === 0 && (
          <p className="muted">Inga mallar i den här kategorin. Öppna en konfigurationsfil under Öppna filer.</p>
        )}
      </div>

      <h2>Senaste</h2>
      <div className="recent-list">
        {autosaves.length === 0 && <p className="muted">Inga senaste dokument ännu.</p>}
        {autosaves.map((s) => {
          const hasTemplate = Boolean(templates[s.templateId]);
          return (
            <button
              key={s.id}
              className="recent-item"
              disabled={!hasTemplate}
              title={hasTemplate ? "" : "Öppna motsvarande konfigurationsfil först"}
              onClick={() => openSession(s)}
            >
              <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="5" fill="#2f5d9f" /><text x="16" y="23" fontFamily="Georgia" fontSize="19" fill="#fff" textAnchor="middle">F</text></svg>
              <span>
                <span className="ri-name">{s.templateName}</span><br />
                <span className="ri-sub">Ändrad {new Date(s.updatedAt).toLocaleString("sv-SE")}</span>
              </span>
            </button>
          );
        })}
      </div>

      <h2>Öppna filer</h2>
      <div className="open-actions">
        <button onClick={handleOpenSession}>Öppna dokument (.json)…</button>
        <button onClick={handleOpenConfig}>Öppna konfigurationsfil…</button>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        En konfigurationsfil innehåller organisationer, mallhierarki och samtliga mallar.
        Om Konfiguratorn körs i samma webbläsare läses dess konfiguration in automatiskt.
        Organisationer: {organisations.length} · Mallar: {allTemplates.length}
      </p>

      {orgPick && (
        <OrgPickDialog
          orgs={orgPick.orgs}
          onPick={(orgId) => {
            startNewSession(orgPick.mall.id, orgId);
            setOrgPick(null);
          }}
          onClose={() => setOrgPick(null)}
        />
      )}
    </div>
  );
}
