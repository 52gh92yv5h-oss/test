import { useState } from "react";

declare global {
  interface Window {
    find?: (
      searchString: string,
      caseSensitive?: boolean,
      backwards?: boolean,
      wrapAround?: boolean,
      wholeWord?: boolean,
      searchInFrames?: boolean,
      showDialog?: boolean
    ) => boolean;
  }
}

function isEditableSelection(): boolean {
  const sel = window.getSelection();
  const node = sel?.anchorNode;
  if (!node) return false;
  const el = node instanceof HTMLElement ? node : node.parentElement;
  const editableAncestor = el?.closest<HTMLElement>(".fred-block-content");
  return Boolean(editableAncestor?.isContentEditable);
}

export default function SearchBar({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [status, setStatus] = useState("");
  const supported = typeof window.find === "function";

  const findNext = (backwards = false) => {
    if (!term || !window.find) return;
    const found = window.find(term, false, backwards, true);
    setStatus(found ? "" : "Inga fler träffar");
  };

  const replaceOne = () => {
    if (!term) return;
    const sel = window.getSelection();
    const hasMatch = sel && sel.toString().toLowerCase() === term.toLowerCase();
    if (hasMatch && isEditableSelection()) {
      document.execCommand("insertText", false, replaceTerm);
      findNext();
    } else {
      findNext();
    }
  };

  const replaceAll = () => {
    if (!term || !window.find) return;
    let count = 0;
    let guard = 0;
    // Börja om från dokumentets topp.
    window.getSelection()?.collapseToStart();
    while (window.find(term, false, false, false) && guard < 2000) {
      guard += 1;
      if (isEditableSelection()) {
        document.execCommand("insertText", false, replaceTerm);
        count += 1;
      }
    }
    setStatus(`${count} ersättning(ar) gjorda`);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 300,
        background: "#fff",
        border: "1px solid #d8dbe0",
        borderRadius: 6,
        padding: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {!supported && (
        <p className="muted" style={{ maxWidth: 260 }}>
          Sök/ersätt kräver en Chromium-baserad webbläsare (Chrome/Edge).
        </p>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          placeholder="Sök"
          value={term}
          autoFocus
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && findNext()}
        />
        <button onClick={() => findNext(false)}>Nästa</button>
        <button onClick={() => findNext(true)}>Föregående</button>
        <button onClick={onClose}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          placeholder="Ersätt med"
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
        />
        <button onClick={replaceOne}>Ersätt</button>
        <button onClick={replaceAll}>Ersätt alla</button>
      </div>
      {status && <span className="muted">{status}</span>}
    </div>
  );
}
