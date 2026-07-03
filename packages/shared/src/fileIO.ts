// Lokal filhantering. Fred gör aldrig nätverksanrop - allt sker via
// File System Access API (Chromium) med fallback till Web Share API
// (iOS/iPadOS Safari, där varken File System Access API eller
// <a download> ger ett tillförlitligt sätt att spara filen), därefter
// klassisk nedladdning och som sista utväg en manuell kopiera-ruta.

import { presentTextForManualSave, showToast } from "./ui";

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
 * - `shared`      – skickad till delningsarket (användaren valde destination).
 * - `downloaded`  – nedladdad via webbläsaren.
 * - `manual`      – ingen automatisk metod fanns; kopiera-ruta visades.
 * - `cancelled`   – användaren avbröt spara-dialogen/delningen.
 */
export type SaveMethod = "filesystem" | "shared" | "downloaded" | "manual" | "cancelled";

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
 * iOS/iPadOS Safari saknar File System Access API, och `<a download>` med en
 * Blob-URL öppnar där ofta bara texten i en ny flik i stället för att spara.
 * Web Share API med en `File` låter användaren spara till appen Filer via
 * delningsarket. Vissa iOS-versioner vägrar dela filer med typen
 * `application/json`, så vi försöker även med `text/plain` (filnamnet med
 * ändelsen `.json` bevaras ändå).
 */
async function trySaveViaShare(
  text: string,
  suggestedName: string,
): Promise<"shared" | "cancelled" | "unavailable"> {
  if (typeof navigator === "undefined" || !navigator.canShare || !navigator.share) {
    return "unavailable";
  }
  const candidates = [
    new File([text], suggestedName, { type: "application/json" }),
    new File([text], suggestedName, { type: "text/plain" }),
  ];
  const file = candidates.find((f) => {
    try {
      return navigator.canShare!({ files: [f] });
    } catch {
      return false;
    }
  });
  if (!file) return "unavailable";
  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "unavailable";
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
 * Visar ingen UI själv (utom den manuella kopiera-rutan när inget annat
 * fungerar) – använd {@link saveJsonWithFeedback} för färdig återkoppling.
 */
export async function saveJsonToLocalFile(
  data: unknown,
  suggestedName: string,
): Promise<SaveMethod> {
  const text = JSON.stringify(data, null, 2);

  if (typeof window !== "undefined" && window.showSaveFilePicker) {
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

  const share = await trySaveViaShare(text, suggestedName);
  if (share === "shared") return "shared";
  if (share === "cancelled") return "cancelled";

  // Ingen delning tillgänglig. På iOS är en nedladdningslänk opålitlig –
  // visa i stället en kopiera-ruta så att data garanterat kan sparas.
  if (isDownloadUnreliable()) {
    presentTextForManualSave(text, suggestedName);
    return "manual";
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
    case "shared":
      showToast(`${label} skickades till Dela – välj var den ska sparas`, { variant: "success" });
      break;
    case "downloaded":
      showToast(`${label} laddades ner (${suggestedName})`, { variant: "success" });
      break;
    case "manual":
      showToast("Kopiera texten för att spara filen", { variant: "info" });
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
