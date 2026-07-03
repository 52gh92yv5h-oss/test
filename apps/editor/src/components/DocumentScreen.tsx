import { useEffect, useState } from "react";
import {
  FRED_SESSION_FILE_MARKER,
  FRED_VERSION,
  SessionFile,
  saveJsonWithFeedback,
  styleDefToCss,
} from "@fred/shared";
import { useEditorStore } from "../store";
import { saveAutosave } from "../autosave";
import HeaderFooterView from "./HeaderFooterView";
import BlockView from "./BlockView";
import ParameterPanel from "./ParameterPanel";
import PhraseSidebar from "./PhraseSidebar";
import SearchBar from "./SearchBar";

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

  return (
    <div className="editor-shell">
      <div className="editor-main">
        <div className="editor-topbar">
          <button onClick={goToStart}>← Start</button>
          <span className="title">{mall.name}</span>
          <button onClick={undo} disabled={history.length === 0} title="Ångra (Ctrl+Z)">↶ Ångra</button>
          <button onClick={redo} disabled={future.length === 0} title="Gör om (Ctrl+Y)">↷ Gör om</button>
          <button onClick={() => setSearchOpen(true)} title="Sök (Ctrl+F)">🔍 Sök</button>
          <button onClick={handleSaveSession}>💾 Spara dokument</button>
          <button className="primary" onClick={() => window.print()}>🖶 Skriv ut / PDF</button>
          <span className="app-version" title="Version">v{FRED_VERSION}</span>
        </div>
        <div className="editor-body">
          {/* Mallens defaultStyle sätts på sidan; block/fält utan egen stil ärver via CSS. */}
          <div className="document-page" style={styleDefToCss(mall.defaultStyle)}>
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
      <div className="sidebar">
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
      {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
