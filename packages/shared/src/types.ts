// Informationsmodell enligt Fred-kravspecifikationen, avsnitt 6.

/**
 * Stildefinition enligt kravspec 6.0. Alla attribut valfria; utelämnat
 * attribut ärvs från nivån ovanför (fält/block -> mallens defaultStyle ->
 * systemets grundstil).
 */
export interface StyleDef {
  fontFamily?: string;
  fontSizePt?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type HFCol = "left" | "center" | "right";
export type HFRow = "top" | "middle" | "bottom";

export interface HFPosition {
  col: HFCol;
  row: HFRow;
}

export interface Organisation {
  id: string;
  name: string;
  /** Data-URL (base64) till logotypen, lagras lokalt i JSON. */
  logoDataUrl?: string;
  /** Varifrån logotypen hämtats (t.ex. Wikimedia-filtitel eller "egendesignad"). */
  logoSource?: string;
  /** Logotypens licens (t.ex. "Public domain", "CC BY-SA 4.0", "CC0"). */
  logoLicense?: string;
}

export type ParameterType = "text" | "date" | "number" | "boolean" | "list";

export interface ParameterOption {
  value: string;
  label: string;
}

export type ParameterValue = string | number | boolean | null;

/**
 * Parametrar kan nästlas: ett barn visas bara när förälderns värde matchar
 * `showWhen`. Detta ger den "flernivåstruktur" som kravspecen efterfrågar
 * utan att kräva ett generellt uttrycksspråk.
 */
export interface ParameterDef {
  id: string;
  label: string;
  type: ParameterType;
  defaultValue?: ParameterValue;
  options?: ParameterOption[]; // används för type === "list"
  children?: ParameterDef[];
  showWhen?: ParameterValue;
}

export type BlockType = "locked" | "editable";
export type BlockPlacement = "fixed" | "free";

/** Villkor som styr om ett block visas i dokumentet (kravspec V13). */
export interface BlockCondition {
  /** Parametern vars värde villkoret prövas mot. */
  parameterId: string;
  /** Blocket visas när parameterns aktuella värde är exakt detta. */
  equals: ParameterValue;
}

export interface ContentBlock {
  id: string;
  title: string;
  type: BlockType;
  placement: BlockPlacement;
  /** HTML med platshållare i formatet {{parameterId}}. */
  content: string;
  order: number;
  /** Valfri typografi som ersätter mallens defaultStyle för blocket. */
  style?: StyleDef;
  /**
   * Valfritt synlighetsvillkor: blocket visas bara när villkoret är
   * uppfyllt. Utelämnat = blocket visas alltid. Gäller både fasta block
   * och fraser (en fras med ouppfyllt villkor kan inte infogas, och döljs
   * om den redan är infogad när villkoret slutar vara uppfyllt).
   */
  visibleWhen?: BlockCondition;
}

export type HeaderFooterFieldKind = "logo" | "organisation" | "text";

export interface HeaderFooterField {
  id: string;
  kind: HeaderFooterFieldKind;
  label?: string;
  defaultText?: string;
  /** Position i 3x3-matrisen; utelämnad = vänster/mitt. */
  position?: HFPosition;
  /** Valfri typografi för fältet. */
  style?: StyleDef;
}

export interface HeaderFooterDefinition {
  headerFields: HeaderFooterField[];
  footerFields: HeaderFooterField[];
}

export type OrgScope =
  | { mode: "all" }
  | { mode: "specific"; organisationId: string }
  | { mode: "selected"; organisationIds: string[] };

export interface CategoryNode {
  id: string;
  name: string;
  children: CategoryNode[];
  templateIds: string[];
}

export interface Mall {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  orgScope: OrgScope;
  /** Standardtypografi för hela dokumentet (kravspec 6.2). */
  defaultStyle?: StyleDef;
  headerFooter: HeaderFooterDefinition;
  parameters: ParameterDef[];
  blocks: ContentBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface UsedBlock {
  instanceId: string;
  blockId: string;
  source: BlockPlacement;
  order: number;
}

export interface DocumentSession {
  id: string;
  templateId: string;
  templateName: string;
  organisationId: string;
  parameterValues: Record<string, ParameterValue>;
  usedBlocks: UsedBlock[];
  /** Aktuellt HTML-innehåll per blockinstans (redigerbara block). */
  userContent: Record<string, string>;
  /** Fritextfält i sidhuvud/sidfot, nyckel = HeaderFooterField-id. */
  headerFooterValues: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export const FRED_SESSION_FILE_MARKER = "fred-session" as const;
export const FRED_CONFIG_FILE_MARKER = "fred-konfiguration" as const;

export interface SessionFile {
  marker: typeof FRED_SESSION_FILE_MARKER;
  version: 1;
  session: DocumentSession;
}

/**
 * Den enhetliga konfigurationsfilen (kravspec V12): organisationer,
 * mallhierarki och samtliga mallar i en och samma fil. Ersätter de
 * tidigare separata filerna för organisationer, hierarki och enskilda
 * mallar - administratören hanterar nu bara en fil.
 */
export interface ConfigFile {
  marker: typeof FRED_CONFIG_FILE_MARKER;
  version: 1;
  organisations: Organisation[];
  hierarchy: CategoryNode;
  mallar: Mall[];
}

export interface ImportParametersFile {
  organisationId?: string;
  values: Record<string, ParameterValue>;
}
