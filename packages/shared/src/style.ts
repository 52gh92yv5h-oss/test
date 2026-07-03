import { StyleDef } from "./types";

/**
 * Slår ihop en stil med dess fallback (mallens defaultStyle) attribut för
 * attribut, enligt arvsregeln i kravspec 6.0.
 */
export function mergeStyle(
  style: StyleDef | undefined,
  fallback: StyleDef | undefined,
): StyleDef {
  return { ...(fallback ?? {}), ...(style ?? {}) };
}

export interface CssStyleProps {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

/**
 * Konverterar en Stildefinition (med ev. fallback) till CSS-egenskaper som
 * kan användas som React `style`-objekt eller serialiseras till inline-CSS.
 */
export function styleDefToCss(
  style: StyleDef | undefined,
  fallback?: StyleDef,
): CssStyleProps {
  const merged = mergeStyle(style, fallback);
  const css: CssStyleProps = {};
  if (merged.fontFamily) css.fontFamily = merged.fontFamily;
  if (merged.fontSizePt != null) css.fontSize = `${merged.fontSizePt}pt`;
  if (merged.bold != null) css.fontWeight = merged.bold ? "bold" : "normal";
  if (merged.italic != null) css.fontStyle = merged.italic ? "italic" : "normal";
  if (merged.underline != null)
    css.textDecoration = merged.underline ? "underline" : "none";
  return css;
}
