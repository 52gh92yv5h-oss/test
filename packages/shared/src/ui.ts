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
 * Sista utväg när varken filsystem-API, delning eller nedladdning fungerar
 * (t.ex. äldre iOS där en nedladdningslänk bara öppnar texten i en ny flik).
 * Visar innehållet i en markerbar ruta så att användaren garanterat kan
 * kopiera det och spara manuellt.
 */
export function presentTextForManualSave(text: string, filename: string): void {
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
  heading.textContent = "Spara filen manuellt";
  Object.assign(heading.style, { margin: "0", fontSize: "18px" } as CSSStyleDeclaration);

  const info = document.createElement("p");
  info.textContent =
    `Din webbläsare kan inte spara filer automatiskt. Kopiera texten nedan och ` +
    `klistra in den i en ny fil med namnet "${filename}" (t.ex. i appen Filer eller Anteckningar).`;
  Object.assign(info.style, { margin: "0", fontSize: "13px", color: "#555" } as CSSStyleDeclaration);

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.readOnly = true;
  Object.assign(ta.style, {
    width: "100%",
    flex: "1",
    minHeight: "180px",
    fontFamily: "ui-monospace, Menlo, Consolas, monospace",
    fontSize: "12px",
    border: "1px solid #d8dbe0",
    borderRadius: "6px",
    padding: "8px",
    resize: "vertical",
    whiteSpace: "pre",
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

  const copyBtn = mkButton("Kopiera text", true);
  copyBtn.onclick = async () => {
    const ok = await copyText(text);
    showToast(ok ? "Texten kopierad" : "Kunde inte kopiera – markera och kopiera manuellt", {
      variant: ok ? "success" : "error",
    });
  };

  const downloadBtn = mkButton("Ladda ner ändå", false);
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
  };

  const closeBtn = mkButton("Stäng", false);
  closeBtn.onclick = close;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  buttons.append(copyBtn, downloadBtn, closeBtn);
  panel.append(heading, info, ta, buttons);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  ta.focus();
  ta.select();
}
