import { create } from "zustand";
import {
  CategoryNode,
  ConfigFile,
  FRED_CONFIG_FILE_MARKER,
  Mall,
  Organisation,
  newId,
  saveSharedConfig,
} from "@fred/shared";

export function emptyHierarchy(): CategoryNode {
  return { id: "root", name: "Mallar", children: [], templateIds: [] };
}

export function emptyMall(): Mall {
  const now = new Date().toISOString();
  return {
    id: newId("mall"),
    name: "Ny mall",
    description: "",
    categoryId: null,
    orgScope: { mode: "all" },
    headerFooter: { headerFields: [], footerFields: [] },
    parameters: [],
    blocks: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface ConfiguratorState {
  organisations: Organisation[];
  hierarchy: CategoryNode;
  mallar: Mall[];
  selectedMallId: string | null;

  setOrganisations: (orgs: Organisation[]) => void;
  addOrganisation: (org: Organisation) => void;
  updateOrganisation: (id: string, patch: Partial<Organisation>) => void;
  removeOrganisation: (id: string) => void;
  setHierarchy: (root: CategoryNode) => void;

  addMall: () => void;
  duplicateMall: (id: string) => void;
  removeMall: (id: string) => void;
  selectMall: (id: string | null) => void;
  /** Patchar den valda mallen (motsvarar tidigare updateMall). */
  updateMall: (patch: Partial<Mall>) => void;

  /** Ersätter hela arbetsytan med innehållet i en konfigurationsfil. */
  loadConfig: (config: ConfigFile) => void;
  /** Nollställer arbetsytan till en tom konfiguration. */
  newConfig: () => void;
  /**
   * Slår ihop en fördefinierad bunt (t.ex. Sveriges myndighetsmallar) med
   * arbetsytan. Dedupar på id: befintliga organisationer/mallar med samma
   * id ersätts inte. Buntens hierarkigrenar läggs till under roten om de
   * inte redan finns.
   */
  mergeBundle: (bundle: ConfigFile) => void;
}

/** Bygger den enhetliga konfigurationsfilen från aktuellt tillstånd. */
export function toConfigFile(s: {
  organisations: Organisation[];
  hierarchy: CategoryNode;
  mallar: Mall[];
}): ConfigFile {
  return {
    marker: FRED_CONFIG_FILE_MARKER,
    version: 1,
    organisations: s.organisations,
    hierarchy: s.hierarchy,
    mallar: s.mallar,
  };
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  organisations: [],
  hierarchy: emptyHierarchy(),
  mallar: [],
  selectedMallId: null,

  setOrganisations: (organisations) => set({ organisations }),
  addOrganisation: (org) =>
    set((s) => ({ organisations: [...s.organisations, org] })),
  updateOrganisation: (id, patch) =>
    set((s) => ({
      organisations: s.organisations.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),
  removeOrganisation: (id) =>
    set((s) => ({ organisations: s.organisations.filter((o) => o.id !== id) })),
  setHierarchy: (hierarchy) => set({ hierarchy }),

  addMall: () => {
    const mall = emptyMall();
    set((s) => ({ mallar: [...s.mallar, mall], selectedMallId: mall.id }));
  },
  duplicateMall: (id) => {
    const src = get().mallar.find((m) => m.id === id);
    if (!src) return;
    const now = new Date().toISOString();
    const copy: Mall = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId("mall"),
      name: `${src.name} (kopia)`,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ mallar: [...s.mallar, copy], selectedMallId: copy.id }));
  },
  removeMall: (id) =>
    set((s) => ({
      mallar: s.mallar.filter((m) => m.id !== id),
      selectedMallId: s.selectedMallId === id ? null : s.selectedMallId,
    })),
  selectMall: (selectedMallId) => set({ selectedMallId }),
  updateMall: (patch) =>
    set((s) => ({
      mallar: s.mallar.map((m) =>
        m.id === s.selectedMallId
          ? { ...m, ...patch, updatedAt: new Date().toISOString() }
          : m,
      ),
    })),

  loadConfig: (config) =>
    set({
      organisations: config.organisations,
      hierarchy: config.hierarchy,
      mallar: config.mallar,
      selectedMallId: config.mallar[0]?.id ?? null,
    }),
  newConfig: () =>
    set({
      organisations: [],
      hierarchy: emptyHierarchy(),
      mallar: [],
      selectedMallId: null,
    }),
  mergeBundle: (bundle) =>
    set((s) => {
      const orgIds = new Set(s.organisations.map((o) => o.id));
      const mallIds = new Set(s.mallar.map((m) => m.id));
      const childIds = new Set(s.hierarchy.children.map((c) => c.id));
      return {
        organisations: [
          ...s.organisations,
          ...bundle.organisations.filter((o) => !orgIds.has(o.id)),
        ],
        mallar: [...s.mallar, ...bundle.mallar.filter((m) => !mallIds.has(m.id))],
        hierarchy: {
          ...s.hierarchy,
          children: [
            ...s.hierarchy.children,
            ...bundle.hierarchy.children.filter((c) => !childIds.has(c.id)),
          ],
        },
      };
    }),
}));

// Delad localStorage-buffert (kravspec V12): varje ändring i Konfiguratorn
// speglas (debounce 800 ms) till den nyckel Editorn läser vid start.
// Fungerar när båda apparna körs från samma webbursprung; filexport är
// den portabla vägen som alltid fungerar.
let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
useConfiguratorStore.subscribe((state) => {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    saveSharedConfig(toConfigFile(state));
  }, 800);
});
