// Informationsmodell enligt Fred-kravspecifikationen, avsnitt 6.

export interface Organisation {
  id: string;
  name: string;
  /** Data-URL (base64) till logotypen, lagras lokalt i JSON. */
  logoDataUrl?: string;
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

export interface ContentBlock {
  id: string;
  title: string;
  type: BlockType;
  placement: BlockPlacement;
  /** HTML med platshållare i formatet {{parameterId}}. */
  content: string;
  order: number;
}

export type HeaderFooterFieldKind = "logo" | "organisation" | "text";

export interface HeaderFooterField {
  id: string;
  kind: HeaderFooterFieldKind;
  label?: string;
  defaultText?: string;
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

export const FRED_MALL_FILE_MARKER = "fred-mall" as const;
export const FRED_SESSION_FILE_MARKER = "fred-session" as const;
export const FRED_ORG_FILE_MARKER = "fred-organisationer" as const;
export const FRED_HIERARCHY_FILE_MARKER = "fred-hierarki" as const;

export interface MallFile {
  marker: typeof FRED_MALL_FILE_MARKER;
  version: 1;
  mall: Mall;
}

export interface SessionFile {
  marker: typeof FRED_SESSION_FILE_MARKER;
  version: 1;
  session: DocumentSession;
}

export interface OrganisationsFile {
  marker: typeof FRED_ORG_FILE_MARKER;
  version: 1;
  organisations: Organisation[];
}

export interface HierarchyFile {
  marker: typeof FRED_HIERARCHY_FILE_MARKER;
  version: 1;
  root: CategoryNode;
}

export interface ImportParametersFile {
  organisationId?: string;
  values: Record<string, ParameterValue>;
}
