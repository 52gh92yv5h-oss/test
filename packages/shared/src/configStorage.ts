import { ConfigFile, FRED_CONFIG_FILE_MARKER } from "./types";

/**
 * Delad localStorage-nyckel som Konfiguratorn skriver till och Editorn
 * läser från (kravspec V12). Fungerar bara när båda apparna körs från
 * samma webbursprung (protokoll+domän+port) - t.ex. samma GitHub
 * Pages-domän. Fungerar INTE mellan Claude-artifacts (egen URL per app)
 * eller i Windows-appen (egen virtuell WebView2-host). Filexport/import
 * (se fileIO.ts) är den portabla vägen som alltid fungerar.
 */
export const FRED_CONFIG_STORAGE_KEY = "fred-shared-config";

export function loadSharedConfig(): ConfigFile | null {
  try {
    const raw = localStorage.getItem(FRED_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConfigFile;
    if (parsed?.marker !== FRED_CONFIG_FILE_MARKER) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSharedConfig(config: ConfigFile): void {
  try {
    localStorage.setItem(FRED_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Lagring avstängd eller full - Konfiguratorns nedladdningsbara fil
    // förblir den auktoritativa vägen, så vi hoppar bara över bufferten.
  }
}
