// Lokal filhantering. Fred gör aldrig nätverksanrop - allt sker via
// File System Access API (Chromium desktop) eller klassisk nedladdning.
// I miljöer där ingen tyst metod är pålitlig (iOS/iPadOS samt inbäddade
// iframes som artifact-visningen på claude.ai) visas i stället en
// spara-dialog där användaren själv väljer Dela / Ladda ner / Kopiera
// och varje metod ger synlig återkoppling.

import { presentSaveDialog, showToast } from "./ui";

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
};

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: {
      types?: { description: string; accept: Record<string, string[]> }[];
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

const JSON_TYPE = {
  description: "JSON-fil",
  accept: { "application/json": [".json"] },
};

/**
 * Hur en spara-operation faktiskt utfördes, så att anroparen kan ge korrekt
 * återkoppling.
 * - `filesystem`  – sparad direkt till disk via File System Access API.
 * - `downloaded`  – nedladdad via webbläsaren.
 * - `dialog`      – spara-dialogen visades; den ger själv återkoppling
 *                   per metod (Dela / Ladda ner / Kopiera).
 * - `cancelled`   – användaren avbröt spara-dialogen.
 */
export type SaveMethod = "filesystem" | "downloaded" | "dialog" | "cancelled";

/** Sant på iOS/iPadOS där en nedladdningslänk inte är ett tillförlitligt sätt att spara. */
function isDownloadUnreliable(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const iOS = /iP(hone|ad|od)/.test(ua) || /iP(hone|ad|od)/.test(platform);
  // iPadOS 13+ maskerar sig som macOS men har pekskärm.
  const iPadOS = /Mac/.test(platform) && (navigator.maxTouchPoints ?? 0) > 1;
  return iOS || iPadOS;
}

/**
 * Sant när appen körs inbäddad i en annan sida (t.ex. artifact-visningen på
 * claude.ai). Sandboxade iframes kan blockera File System API, Web Share och
 * nedladdningar var för sig – där ska spara-dialogen användas så att varje
 * misslyckande blir synligt i stället för tyst.
 */
function isEmbedded(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true; // cross-origin-åtkomst till window.top kastar => inbäddad
  }
}

function triggerDownload(text: string, suggestedName: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sparar godtycklig data som en lokal JSON-fil och rapporterar hur det gick.
 * I pålitliga miljöer sker sparandet tyst (filsystem-dialog eller
 * nedladdning); i osäkra miljöer (iOS/iPadOS eller inbäddad iframe) visas
 * spara-dialogen där användaren väljer metod med synlig återkoppling.
 * Använd {@link saveJsonWithFeedback} för färdiga toast-meddelanden.
 */
export async function saveJsonToLocalFile(
  data: unknown,
  suggestedName: string,
): Promise<SaveMethod> {
  const text = JSON.stringify(data, null, 2);
  const embedded = isEmbedded();

  // File System Access API blockeras i cross-origin-iframes – hoppa över den
  // direkt i inbäddat läge så att användaren inte möts av ett tyst fel.
  if (!embedded && typeof window !== "undefined" && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types: [JSON_TYPE] });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return "filesystem";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Faller igenom till nästa metod om API:et strular.
    }
  }

  if (embedded || isDownloadUnreliable()) {
    presentSaveDialog(text, suggestedName);
    return "dialog";
  }

  triggerDownload(text, suggestedName);
  return "downloaded";
}

/**
 * Sparar och visar en toast med tydlig återkoppling. `label` är en kort,
 * läsbar beskrivning av vad som sparades, t.ex. "Mallen" eller "Dokumentet".
 */
export async function saveJsonWithFeedback(
  data: unknown,
  suggestedName: string,
  label = "Filen",
): Promise<SaveMethod> {
  const method = await saveJsonToLocalFile(data, suggestedName);
  switch (method) {
    case "filesystem":
      showToast(`${label} sparades (${suggestedName})`, { variant: "success" });
      break;
    case "downloaded":
      showToast(`${label} laddades ner (${suggestedName})`, { variant: "success" });
      break;
    case "dialog":
      // Spara-dialogen ger själv återkoppling per vald metod.
      break;
    case "cancelled":
      // Ingen återkoppling – användaren avbröt medvetet.
      break;
  }
  return method;
}

export async function openJsonFromLocalFile<T>(): Promise<T | null> {
  if (typeof window !== "undefined" && window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [JSON_TYPE],
        multiple: false,
      });
      const file = await handle.getFile();
      const text = await file.text();
      return JSON.parse(text) as T;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
    }
  }
  return openJsonViaInput<T>();
}

function openJsonViaInput<T>(): Promise<T | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const text = await file.text();
      try {
        resolve(JSON.parse(text) as T);
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
