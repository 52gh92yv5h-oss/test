import type { ParameterDef, ParameterValue } from "./types";

/** Plattar ut ett nästlat parameterträd till en lista, oavsett synlighet. */
export function flattenParameters(defs: ParameterDef[]): ParameterDef[] {
  const out: ParameterDef[] = [];
  for (const def of defs) {
    out.push(def);
    if (def.children?.length) {
      out.push(...flattenParameters(def.children));
    }
  }
  return out;
}

/** Ett barn är synligt bara om förälderns aktuella värde matchar showWhen. */
export function isParameterVisible(
  def: ParameterDef,
  parent: ParameterDef | undefined,
  values: Record<string, ParameterValue>
): boolean {
  if (!parent || def.showWhen === undefined) return true;
  return values[parent.id] === def.showWhen;
}

export function buildParentMap(defs: ParameterDef[]): Map<string, ParameterDef> {
  const map = new Map<string, ParameterDef>();
  const walk = (list: ParameterDef[], parent?: ParameterDef) => {
    for (const def of list) {
      if (parent) map.set(def.id, parent);
      if (def.children?.length) walk(def.children, def);
    }
  };
  walk(defs);
  return map;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatParameterValue(def: ParameterDef | undefined, value: ParameterValue): string {
  if (value === null || value === undefined || value === "") return "";
  if (!def) return String(value);
  switch (def.type) {
    case "boolean":
      return value ? "Ja" : "Nej";
    case "list": {
      const opt = def.options?.find((o) => o.value === value);
      return opt ? opt.label : String(value);
    }
    case "date": {
      const d = new Date(String(value));
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString("sv-SE");
    }
    default:
      return String(value);
  }
}

const PLACEHOLDER_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function extractPlaceholderIds(content: string): string[] {
  const ids = new Set<string>();
  for (const match of content.matchAll(PLACEHOLDER_RE)) ids.add(match[1]);
  return [...ids];
}

/**
 * Ersätter {{parameterId}}-platshållare i `content` med aktuella värden.
 * Detta är den globala uppdateringsmekanismen: samma parameter-id ger
 * samma text överallt i dokumentet.
 */
export function renderContent(
  content: string,
  values: Record<string, ParameterValue>,
  defs: ParameterDef[]
): string {
  const flat = flattenParameters(defs);
  const byId = new Map(flat.map((d) => [d.id, d]));
  return content.replace(PLACEHOLDER_RE, (_match, id: string) => {
    const def = byId.get(id);
    return escapeHtml(formatParameterValue(def, values[id]));
  });
}

const CHIP_CLASS = "fred-param-chip";

/**
 * Bygger HTML för ett redigerbart block där varje platshållare blir en
 * icke-redigerbar "chip" som kan uppdateras i efterhand utan att röra
 * användarens egen text runtomkring (global uppdatering, se 2.2).
 */
export function contentToChipHtml(
  content: string,
  values: Record<string, ParameterValue>,
  defs: ParameterDef[]
): string {
  const flat = flattenParameters(defs);
  const byId = new Map(flat.map((d) => [d.id, d]));
  return content.replace(PLACEHOLDER_RE, (_match, id: string) => {
    const def = byId.get(id);
    const text = escapeHtml(formatParameterValue(def, values[id]));
    return `<span class="${CHIP_CLASS}" contenteditable="false" data-param-id="${id}">${text}</span>`;
  });
}

/** Uppdaterar befintliga chips i DOM:en i stället för att skriva om hela blocket. */
export function updateChipValues(
  container: HTMLElement,
  values: Record<string, ParameterValue>,
  defs: ParameterDef[]
): void {
  const flat = flattenParameters(defs);
  const byId = new Map(flat.map((d) => [d.id, d]));
  container.querySelectorAll<HTMLElement>(`.${CHIP_CLASS}`).forEach((el) => {
    const id = el.dataset.paramId;
    if (!id) return;
    const def = byId.get(id);
    el.textContent = formatParameterValue(def, values[id]);
  });
}

export function defaultValuesFrom(defs: ParameterDef[]): Record<string, ParameterValue> {
  const flat = flattenParameters(defs);
  const values: Record<string, ParameterValue> = {};
  for (const def of flat) {
    values[def.id] = def.defaultValue ?? (def.type === "boolean" ? false : null);
  }
  return values;
}
