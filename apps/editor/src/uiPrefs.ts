// Användarens gränssnittsval (kravspec 2.2, V11): var parametrar anges
// (inline i dokumentet eller i panelen), panelens sida samt om panelen är
// dold i inline-läge. Sparas lokalt per användare i localStorage.

export type ParamMode = "panel" | "inline";
export type PanelSide = "left" | "right";

export interface UiPrefs {
  paramMode: ParamMode;
  panelSide: PanelSide;
  /** Gäller endast i inline-läge; i panel-läge visas panelen alltid. */
  panelHidden: boolean;
}

const KEY = "fred-editor-ui-prefs";

export const DEFAULT_PREFS: UiPrefs = {
  paramMode: "panel",
  panelSide: "right",
  panelHidden: false,
};

export function loadUiPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      paramMode: parsed.paramMode === "inline" ? "inline" : "panel",
      panelSide: parsed.panelSide === "left" ? "left" : "right",
      panelHidden: Boolean(parsed.panelHidden),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveUiPrefs(prefs: UiPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // lagring avstängd – valen gäller då bara innevarande session
  }
}
