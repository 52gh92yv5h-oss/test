import { create } from "zustand";
import {
  CategoryNode,
  ContentBlock,
  DocumentSession,
  Mall,
  Organisation,
  ParameterValue,
} from "@fred/shared";
import { createSession, insertFreeBlockInstance } from "./sessionEngine";
import { BUILTIN_MALL, BUILTIN_ORGANISATION } from "./builtin";

type Screen = "start" | "document";

const HISTORY_LIMIT = 50;

/** Parametrar en extern applikation kan starta Fred Editor med, se krav-avsnitt 4. */
export interface PendingLaunch {
  templateId: string;
  organisationId?: string;
  values?: Record<string, ParameterValue>;
}

interface EditorState {
  organisations: Organisation[];
  templates: Record<string, Mall>;
  hierarchy: CategoryNode | null;
  session: DocumentSession | null;
  screen: Screen;
  history: DocumentSession[];
  future: DocumentSession[];
  pendingLaunch: PendingLaunch | null;

  loadOrganisations: (orgs: Organisation[]) => void;
  loadTemplate: (mall: Mall) => void;
  loadHierarchy: (root: CategoryNode) => void;
  setPendingLaunch: (launch: PendingLaunch | null) => void;

  startNewSession: (templateId: string, organisationId: string) => void;
  openSession: (session: DocumentSession) => void;
  goToStart: () => void;

  updateParameterValue: (id: string, value: ParameterValue) => void;
  setHeaderFooterText: (fieldId: string, value: string) => void;
  insertFreeBlock: (blockId: string) => void;
  removeUsedBlock: (instanceId: string) => void;
  moveUsedBlock: (instanceId: string, dir: -1 | 1) => void;
  setUserContent: (instanceId: string, html: string) => void;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
}

function snapshot(session: DocumentSession): DocumentSession {
  return JSON.parse(JSON.stringify(session));
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Den inbyggda standardmallen (Exempelbolaget AB, kravspec V11) är alltid
  // tillgänglig; inlästa filer läggs till utan att skriva över den.
  organisations: [BUILTIN_ORGANISATION],
  templates: { [BUILTIN_MALL.id]: BUILTIN_MALL },
  hierarchy: null,
  session: null,
  screen: "start",
  history: [],
  future: [],
  pendingLaunch: null,

  loadOrganisations: (organisations) =>
    set({
      organisations: [
        BUILTIN_ORGANISATION,
        ...organisations.filter((o) => o.id !== BUILTIN_ORGANISATION.id),
      ],
    }),
  loadTemplate: (mall) => {
    set((s) => ({ templates: { ...s.templates, [mall.id]: mall } }));
    const { pendingLaunch, organisations } = get();
    if (pendingLaunch && pendingLaunch.templateId === mall.id) {
      const orgId = pendingLaunch.organisationId ?? organisations[0]?.id ?? "";
      get().startNewSession(mall.id, orgId);
      if (pendingLaunch.values) {
        for (const [id, value] of Object.entries(pendingLaunch.values)) {
          set((s) => {
            if (!s.session) return s;
            return { session: { ...s.session, parameterValues: { ...s.session.parameterValues, [id]: value } } };
          });
        }
      }
      set({ pendingLaunch: null });
    }
  },
  loadHierarchy: (hierarchy) => set({ hierarchy }),
  setPendingLaunch: (pendingLaunch) => set({ pendingLaunch }),

  startNewSession: (templateId, organisationId) => {
    const mall = get().templates[templateId];
    if (!mall) return;
    set({ session: createSession(mall, organisationId), screen: "document", history: [], future: [] });
  },
  openSession: (session) => set({ session, screen: "document", history: [], future: [] }),
  goToStart: () => set({ screen: "start", session: null, history: [], future: [] }),

  commitHistory: () => {
    const { session, history } = get();
    if (!session) return;
    const next = [...history, snapshot(session)].slice(-HISTORY_LIMIT);
    set({ history: next, future: [] });
  },

  updateParameterValue: (id, value) => {
    get().commitHistory();
    set((s) => {
      if (!s.session) return s;
      return {
        session: {
          ...s.session,
          parameterValues: { ...s.session.parameterValues, [id]: value },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setHeaderFooterText: (fieldId, value) => {
    set((s) => {
      if (!s.session) return s;
      return {
        session: {
          ...s.session,
          headerFooterValues: { ...s.session.headerFooterValues, [fieldId]: value },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  insertFreeBlock: (blockId) => {
    const { session, templates } = get();
    if (!session) return;
    const mall = templates[session.templateId];
    if (!mall) return;
    const block = mall.blocks.find((b): b is ContentBlock => b.id === blockId);
    if (!block) return;
    get().commitHistory();
    set({ session: insertFreeBlockInstance(session, mall, block) });
  },

  removeUsedBlock: (instanceId) => {
    get().commitHistory();
    set((s) => {
      if (!s.session) return s;
      const { [instanceId]: _removed, ...userContent } = s.session.userContent;
      return {
        session: {
          ...s.session,
          usedBlocks: s.session.usedBlocks.filter((b) => b.instanceId !== instanceId),
          userContent,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  moveUsedBlock: (instanceId, dir) => {
    get().commitHistory();
    set((s) => {
      if (!s.session) return s;
      const sorted = [...s.session.usedBlocks].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((b) => b.instanceId === instanceId);
      const targetIdx = idx + dir;
      if (idx < 0 || targetIdx < 0 || targetIdx >= sorted.length) return s;
      const a = sorted[idx];
      const b = sorted[targetIdx];
      const usedBlocks = s.session.usedBlocks.map((blk) => {
        if (blk.instanceId === a.instanceId) return { ...blk, order: b.order };
        if (blk.instanceId === b.instanceId) return { ...blk, order: a.order };
        return blk;
      });
      return { session: { ...s.session, usedBlocks, updatedAt: new Date().toISOString() } };
    });
  },

  setUserContent: (instanceId, html) => {
    set((s) => {
      if (!s.session) return s;
      return {
        session: {
          ...s.session,
          userContent: { ...s.session.userContent, [instanceId]: html },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  undo: () => {
    const { session, history, future } = get();
    if (!session || history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      session: previous,
      history: history.slice(0, -1),
      future: [snapshot(session), ...future].slice(0, HISTORY_LIMIT),
    });
  },

  redo: () => {
    const { session, history, future } = get();
    if (!session || future.length === 0) return;
    const next = future[0];
    set({
      session: next,
      future: future.slice(1),
      history: [...history, snapshot(session)].slice(-HISTORY_LIMIT),
    });
  },
}));
