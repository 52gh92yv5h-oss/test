// Lokal filhantering. Fred gör aldrig nätverksanrop - allt sker via
// File System Access API (Chromium) med fallback till klassisk
// nedladdning/uppladdning i webbläsare som saknar stöd.

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

export async function saveJsonToLocalFile(data: unknown, suggestedName: string): Promise<void> {
  const text = JSON.stringify(data, null, 2);
  if (typeof window !== "undefined" && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [JSON_TYPE],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Faller igenom till nedladdningsmetoden nedan om API:et strular.
    }
  }
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
