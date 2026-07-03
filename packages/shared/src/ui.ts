// Ramverksfria UI-hjälpare (ren DOM) som kan användas av både React-apparna
// och andra klienter. Ingen extern resurs eller inline-<script> krävs –
// stilar sätts via element.style så att de fungerar även under strikt CSP.

export type ToastVariant = "success" | "error" | "info";

function ensureToastHost(): HTMLElement {
  let host = document.getElementById("fred-toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "fred-toast-host";
    Object.assign(host.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "center",
      zIndex: "2147483647",
      pointerEvents: "none",
    } as CSSStyleDeclaration);
    document.body.appendChild(host);
  }
  return host;
}

const TOAST_COLORS: Record<ToastVariant, string> = {
  success: "#1f7a44",
  error: "#b3261e",
  info: "#23303f",
};

/** Visar en tillfällig avisering längst ned på skärmen. */
export function showToast(
  message: string,
  opts: { variant?: ToastVariant; durationMs?: number } = {},
): void {
  if (typeof document === "undefined") return;
  const { variant = "success", durationMs = 2600 } = opts;
  const host = ensureToastHost();
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.textContent = message;
  Object.assign(el.style, {
    background: TOAST_COLORS[variant],
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    maxWidth: "90vw",
    textAlign: "center",
    opacity: "0",
    transform: "translateY(8px)",
    transition: "opacity .18s ease, transform .18s ease",
  } as CSSStyleDeclaration);
  host.appendChild(el);
  // Tvinga fram en layout innan in-animeringen.
  void el.offsetHeight;
  el.style.opacity = "1";
  el.style.transform = "translateY(0)";
  window.setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    window.setTimeout(() => el.remove(), 220);
  }, durationMs);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Faller igenom till execCommand nedan (t.ex. file:// eller osäker kontext).
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Spara-dialog för miljöer där ingen tyst spar-metod är pålitlig (iOS/iPadOS
 * och inbäddade iframes som artifact-visningen, där webbläsaren kan blockera
 * File System API, Web Share och nedladdningar var för sig). Varje metod
 * triggas av sin egen knapp – med egen användargest – och misslyckanden
 * visas synligt i dialogen i stället för att kedjan faller tyst.
 */
export function presentSaveDialog(text: string, filename: string): void {
  if (typeof document === "undefined") return;

  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: "2147483647",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  } as CSSStyleDeclaration);

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "#fff",
    color: "#23272f",
    borderRadius: "10px",
    padding: "20px",
    width: "min(560px, 100%)",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  } as CSSStyleDeclaration);

  const heading = document.createElement("h2");
  heading.textContent = `Spara ${filename}`;
  Object.assign(heading.style, { margin: "0", fontSize: "18px" } as CSSStyleDeclaration);

  const info = document.createElement("p");
  info.textContent =
    "Välj hur du vill spara filen. På iPad/iPhone fungerar Dela bäst " +
    "(välj ”Spara i Filer” i delningsarket). Om inget annat fungerar kan du " +
    "alltid kopiera texten och klistra in den i en ny fil.";
  Object.assign(info.style, { margin: "0", fontSize: "13px", color: "#555" } as CSSStyleDeclaration);

  const status = document.createElement("p");
  Object.assign(status.style, {
    margin: "0",
    fontSize: "13px",
    color: "#b3261e",
    minHeight: "1em",
  } as CSSStyleDeclaration);
  const setStatus = (msg: string, ok = false) => {
    status.textContent = msg;
    status.style.color = ok ? "#1f7a44" : "#b3261e";
  };

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.readOnly = true;
  Object.assign(ta.style, {
    width: "100%",
    flex: "1",
    minHeight: "140px",
    fontFamily: "ui-monospace, Menlo, Consolas, monospace",
    fontSize: "12px",
    border: "1px solid #d8dbe0",
    borderRadius: "6px",
    padding: "8px",
    resize: "vertical",
    whiteSpace: "pre",
    display: "none",
  } as CSSStyleDeclaration);

  const buttons = document.createElement("div");
  Object.assign(buttons.style, {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  } as CSSStyleDeclaration);

  const mkButton = (label: string, primary: boolean) => {
    const b = document.createElement("button");
    b.textContent = label;
    Object.assign(b.style, {
      cursor: "pointer",
      border: primary ? "1px solid #2f5d9f" : "1px solid #d8dbe0",
      background: primary ? "#2f5d9f" : "#fff",
      color: primary ? "#fff" : "#23272f",
      borderRadius: "6px",
      padding: "8px 14px",
      fontSize: "14px",
    } as CSSStyleDeclaration);
    return b;
  };

  const close = () => overlay.remove();

  // Dela – visas bara om webbläsaren accepterar att dela filen.
  const shareFile = [
    new File([text], filename, { type: "application/json" }),
    new File([text], filename, { type: "text/plain" }),
  ].find((f) => {
    try {
      return navigator.canShare?.({ files: [f] }) ?? false;
    } catch {
      return false;
    }
  });
  if (shareFile && navigator.share) {
    const shareBtn = mkButton("Dela…", true);
    shareBtn.onclick = () => {
      navigator
        .share!({ files: [shareFile] })
        .then(() => {
          showToast(`${filename} skickades till Dela – välj var den ska sparas`, { variant: "success" });
          close();
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return; // användaren stängde delningsarket
          setStatus("Delning tillåts inte här – prova Ladda ner eller Kopiera text.");
        });
    };
    buttons.appendChild(shareBtn);
  }

  const downloadBtn = mkButton("Ladda ner", !shareFile);
  downloadBtn.onclick = () => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("Nedladdning startad – kontrollera Hämtade filer. Kom inget? Använd Kopiera text.", true);
  };
  buttons.appendChild(downloadBtn);

  const copyBtn = mkButton("Kopiera text", false);
  copyBtn.onclick = async () => {
    ta.style.display = "block";
    ta.focus();
    ta.select();
    const ok = await copyText(text);
    setStatus(
      ok
        ? `Texten kopierad – klistra in i en ny fil med namnet "${filename}".`
        : "Kunde inte kopiera automatiskt – markera texten och kopiera manuellt.",
      ok,
    );
  };
  buttons.appendChild(copyBtn);

  const closeBtn = mkButton("Stäng", false);
  closeBtn.onclick = close;
  buttons.appendChild(closeBtn);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  panel.append(heading, info, status, ta, buttons);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}
