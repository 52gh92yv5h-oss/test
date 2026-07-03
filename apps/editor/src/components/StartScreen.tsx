import { useState } from "react";
import {
  FRED_HIERARCHY_FILE_MARKER,
  FRED_MALL_FILE_MARKER,
  FRED_ORG_FILE_MARKER,
  FRED_SESSION_FILE_MARKER,
  FRED_VERSION,
  HierarchyFile,
  Mall,
  MallFile,
  OrganisationsFile,
  SessionFile,
  flattenCategories,
  openJsonFromLocalFile,
} from "@fred/shared";
import { useEditorStore } from "../store";
import { listAutosaves } from "../autosave";

function templateAllowedForOrg(mall: Mall, organisationId: string | undefined): boolean {
  if (mall.orgScope.mode === "all") return true;
  if (!organisationId) return true;
  if (mall.orgScope.mode === "specific") return mall.orgScope.organisationId === organisationId;
  return mall.orgScope.organisationIds.includes(organisationId);
}

export default function StartScreen() {
  const organisations = useEditorStore((s) => s.organisations);
  const templates = useEditorStore((s) => s.templates);
  const hierarchy = useEditorStore((s) => s.hierarchy);
  const loadOrganisations = useEditorStore((s) => s.loadOrganisations);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadHierarchy = useEditorStore((s) => s.loadHierarchy);
  const startNewSession = useEditorStore((s) => s.startNewSession);
  const openSession = useEditorStore((s) => s.openSession);
  const [selectedOrgByTemplate, setSelectedOrgByTemplate] = useState<Record<string, string>>({});

  const handleOpenOrgs = async () => {
    const data = await openJsonFromLocalFile<OrganisationsFile>();
    if (data?.marker === FRED_ORG_FILE_MARKER) loadOrganisations(data.organisations);
  };

  const handleOpenHierarchy = async () => {
    const data = await openJsonFromLocalFile<HierarchyFile>();
    if (data?.marker === FRED_HIERARCHY_FILE_MARKER) loadHierarchy(data.root);
  };

  const handleOpenTemplate = async () => {
    const data = await openJsonFromLocalFile<MallFile>();
    if (data?.marker === FRED_MALL_FILE_MARKER) loadTemplate(data.mall);
  };

  const handleOpenSession = async () => {
    const data = await openJsonFromLocalFile<SessionFile>();
    if (data?.marker === FRED_SESSION_FILE_MARKER) openSession(data.session);
  };

  const templateList = Object.values(templates);
  const autosaves = listAutosaves();

  const orgIdFor = (templateId: string) =>
    selectedOrgByTemplate[templateId] ?? organisations[0]?.id ?? "";

  const renderTemplateItem = (mall: Mall) => {
    const eligibleOrgs = organisations.filter((o) => templateAllowedForOrg(mall, o.id));
    return (
      <div className="template-item" key={mall.id}>
        <div>
          <strong>{mall.name}</strong>
          <div className="muted" style={{ fontSize: 12 }}>{mall.description}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {organisations.length > 0 && (
            <select
              value={orgIdFor(mall.id)}
              onChange={(e) => setSelectedOrgByTemplate((s) => ({ ...s, [mall.id]: e.target.value }))}
            >
              {eligibleOrgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
          <button className="primary" onClick={() => startNewSession(mall.id, orgIdFor(mall.id))}>
            Skapa nytt dokument
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="start-screen">
      <h1>
        Fred Editor <span className="app-version">v{FRED_VERSION}</span>
      </h1>
      <p className="muted">Fristående, offline ordbehandling baserad på lokala mallar.</p>

      <div className="card">
        <h2>1. Ladda in lokala filer</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleOpenOrgs}>Öppna organisationer.json</button>
          <button onClick={handleOpenHierarchy}>Öppna hierarki.json</button>
          <button onClick={handleOpenTemplate}>Öppna mall.json</button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Organisationer: {organisations.length} · Mallar inlästa: {templateList.length}
        </p>
      </div>

      <div className="card">
        <h2>2. Välj mall och skapa dokument</h2>
        {templateList.length === 0 && <p className="muted">Inga mallar inlästa ännu.</p>}
        {hierarchy
          ? flattenCategories(hierarchy).map((cat) => {
              const inCat = templateList.filter((m) => m.categoryId === cat.id);
              if (inCat.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div className="category-heading">{"— ".repeat(cat.depth)}{cat.name}</div>
                  {inCat.map(renderTemplateItem)}
                </div>
              );
            })
          : templateList.map(renderTemplateItem)}
      </div>

      <div className="card">
        <h2>3. Fortsätt ett pågående dokument</h2>
        <button onClick={handleOpenSession}>Öppna sparad dokumentfil (.json)</button>
        {autosaves.length > 0 && (
          <>
            <p className="muted" style={{ marginTop: 12 }}>Autosparade dokument i denna webbläsare:</p>
            {autosaves.map((s) => {
              const hasTemplate = Boolean(templates[s.templateId]);
              return (
                <div className="template-item" key={s.id}>
                  <div>
                    <strong>{s.templateName}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Senast ändrad {new Date(s.updatedAt).toLocaleString("sv-SE")}
                    </div>
                  </div>
                  <button
                    disabled={!hasTemplate}
                    title={hasTemplate ? "" : "Ladda motsvarande mall.json först"}
                    onClick={() => openSession(s)}
                  >
                    Fortsätt redigera
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
