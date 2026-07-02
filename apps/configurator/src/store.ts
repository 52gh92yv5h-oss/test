import { create } from "zustand";
import {
  CategoryNode,
  Mall,
  Organisation,
  newId,
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
  mall: Mall;
  setOrganisations: (orgs: Organisation[]) => void;
  addOrganisation: (org: Organisation) => void;
  updateOrganisation: (id: string, patch: Partial<Organisation>) => void;
  removeOrganisation: (id: string) => void;
  setHierarchy: (root: CategoryNode) => void;
  setMall: (mall: Mall) => void;
  updateMall: (patch: Partial<Mall>) => void;
  resetMall: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  organisations: [],
  hierarchy: emptyHierarchy(),
  mall: emptyMall(),
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
  setMall: (mall) => set({ mall }),
  updateMall: (patch) =>
    set((s) => ({ mall: { ...s.mall, ...patch, updatedAt: new Date().toISOString() } })),
  resetMall: () => set({ mall: emptyMall() }),
}));
