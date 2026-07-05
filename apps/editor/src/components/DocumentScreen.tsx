import { useEffect, useState } from "react";
import {
  FRED_SESSION_FILE_MARKER,
  FRED_VERSION,
  SessionFile,
  flattenParameters,
  saveJsonWithFeedback,
  styleDefToCss,
} from "@fred/shared";
import { useEditorStore } from "../store";
import { saveAutosave } from "../autosave";
import { UiPrefs, loadUiPrefs, saveUiPrefs } from "../uiPrefs";
import HeaderFooterView from "./HeaderFooterView";
import BlockView from "./BlockView";
import ParameterPanel from "./ParameterPanel";
import PhraseSidebar from "./PhraseSidebar";
import SearchBar from "./SearchBar";
import InlineParamEditor from "./InlineParamEditor";

export default function DocumentScreen() {
  const session = useEditorStore((s) => s.session);
  const mall = useEditorStore((s) => (session ? s.templates[session.templateId] : undefined));
  const organisations = useEditorStore((s) => s.organisations);
  const goToStart = useEditorStore((s) => s.goToStart);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const history = useEditorStore((s) => s.history);
  const future = useEditorStore((s) => s.future);
  const [sidebarTab, setSidebarTab] = useState<"parametrar" | "fraser">("parametrar");
  const [searchOpen, setSearchOpen] = useState(false);
  const [prefs, setPrefs] = useState<UiPrefs>(() => loadUiPrefs());
  const [inlineEdit, setInlineEdit] = useState<{ paramId: string; x: number; y: number } | null>(null);

  const updatePrefs = (patch: Partial<UiPrefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      saveUiPrefs(next);
      return next;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  useEffect(() => {
    if (!session) return;
    const timeout = setTimeout(() => saveAutosave(session), 800);
    return () => clearTimeout(timeout);
  }, [session]);

  if (!session || !mall) return null;
  const organisation = organisations.find((o) => o.id === session.organisationId);
  const sortedBlocks = [...session.usedBlocks].sort((a, b) => a.order - b.order);

  const handleSaveSession = () => {
    const payload: SessionFile = { marker: FRED_SESSION_FILE_MARKER, version: 1, session };
    void saveJsonWithFeedback(payload, `${session.id}.json`, "Dokumentet");
  };

  // Inline-läge (kravspec 2.2, V11): klick på en parameter-chip i dokumentet
  // öppnar den flytande redigeraren. Chips är contenteditable=false, så
  // klicket stör inte markören i redigerbara block.
  const handleDocumentClick = (e: React.MouseEvent) => {
    if (prefs.paramMode !== "inline") return;
    const chip = (e.target as HTMLElement).closest<HTMLElement>(".fred-param-chip");
    if (!chip?.dataset.paramId) return;
    const rect = chip.getBoundingClientRect();
    setInlineEdit({ paramId: chip.dataset.paramId, x: rect.left, y: rect.bottom });
  };

  const inlineDef = inlineEdit
    ? flattenParameters(mall.parameters).find((d) => d.id === inlineEdit.paramId)
    : undefined;

  const panelVisible = prefs.paramMode === "panel" || !prefs.panelHidden;

  const sidebar = panelVisible && (
    <div className={`sidebar ${prefs.panelSide === "left" ? "sidebar-left" : ""}`}>
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        <button
          className={sidebarTab === "parametrar" ? "primary" : ""}
          onClick={() => setSidebarTab("parametrar")}
        >
          Parametrar
        </button>
        <button className={sidebarTab === "fraser" ? "primary" : ""} onClick={() => setSidebarTab("fraser")}>
          Fraser
        </button>
      </div>
      {sidebarTab === "parametrar" ? <ParameterPanel /> : <PhraseSidebar />}
    </div>
  );

  return (
    <div className="editor-shell">
      {prefs.panelSide === "left" && sidebar}
      <div className="editor-main">
        <div className="editor-topbar">
          <button onClick={goToStart}>← Start</button>
          <span className="title">{mall.name}</span>
          <button
            onClick={() => updatePrefs({ paramMode: prefs.paramMode === "panel" ? "inline" : "panel" })}
            title="Växla var parametrar anges: i panelen eller direkt i dokumentet"
          >
            {prefs.paramMode === "panel" ? "✏ Inline-läge" : "🗂 Panel-läge"}
          </button>
          <button
            onClick={() => updatePrefs({ panelSide: prefs.panelSide === "right" ? "left" : "right" })}
            title="Flytta panelen till andra sidan"
          >
            ⇄ Panelsida
          </button>
          {/* Som i WASM-editorn: knappen finns alltid men är inaktiv i
              panel-läge, där panelen alltid visas. */}
          <button
            onClick={() => updatePrefs({ panelHidden: !prefs.panelHidden })}
            disabled={prefs.paramMode === "panel"}
            title={
              prefs.paramMode === "panel"
                ? "Panelen visas alltid i panel-läge"
                : "Visa eller dölj panelen"
            }
          >
            {prefs.panelHidden ? "◧ Visa panel" : "◨ Dölj panel"}
          </button>
          <button onClick={undo} disabled={history.length === 0} title="Ångra (Ctrl+Z)">↶ Ångra</button>
          <button onClick={redo} disabled={future.length === 0} title="Gör om (Ctrl+Y)">↷ Gör om</button>
          <button onClick={() => setSearchOpen(true)} title="Sök (Ctrl+F)">🔍 Sök</button>
          <button onClick={handleSaveSession}>💾 Spara dokument</button>
          <button className="primary" onClick={() => window.print()}>🖶 Skriv ut / PDF</button>
          <span className="app-version" title="Version">v{FRED_VERSION}</span>
        </div>
        <div className="editor-body" onClick={handleDocumentClick}>
          {/* Mallens defaultStyle sätts på sidan; block/fält utan egen stil ärver via CSS. */}
          <div
            className={`document-page ${prefs.paramMode === "inline" ? "inline-params" : ""}`}
            style={styleDefToCss(mall.defaultStyle)}
          >
            <HeaderFooterView fields={mall.headerFooter.headerFields} organisation={organisation} as="header" />
            {sortedBlocks.map((used, i) => {
              const blockDef = mall.blocks.find((b) => b.id === used.blockId);
              if (!blockDef) return null;
              return (
                <BlockView
                  key={used.instanceId}
                  instanceId={used.instanceId}
                  block={blockDef}
                  isFirst={i === 0}
                  isLast={i === sortedBlocks.length - 1}
                />
              );
            })}
            <HeaderFooterView fields={mall.headerFooter.footerFields} organisation={organisation} as="footer" />
          </div>
        </div>
      </div>
      {prefs.panelSide === "right" && sidebar}
      {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
      {inlineEdit && inlineDef && (
        <InlineParamEditor
          def={inlineDef}
          anchor={{ x: inlineEdit.x, y: inlineEdit.y }}
          onClose={() => setInlineEdit(null)}
        />
      )}
    </div>
  );
}
