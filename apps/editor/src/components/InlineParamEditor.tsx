import { useEffect, useRef } from "react";
import { ParameterDef } from "@fred/shared";
import { useEditorStore } from "../store";
import { ParamInput } from "./ParameterPanel";

/**
 * Flytande redigerare för inline-parameterläget (kravspec 2.2, V11):
 * öppnas när användaren klickar på en parameter-chip i dokumentet och
 * redigerar värdet på plats. Ändringen går genom samma globala
 * uppdatering som panelen, så alla förekomster i dokumentet uppdateras.
 */
export default function InlineParamEditor({
  def,
  anchor,
  onClose,
}: {
  def: ParameterDef;
  anchor: { x: number; y: number };
  onClose: () => void;
}) {
  const value = useEditorStore((s) => s.session?.parameterValues[def.id] ?? null);
  const updateParameterValue = useEditorStore((s) => s.updateParameterValue);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  useEffect(() => {
    // Fokusera fältet direkt så att man kan börja skriva.
    ref.current?.querySelector<HTMLElement>("input, select")?.focus();
  }, [def.id]);

  // Håll popovern inom fönstret.
  const left = Math.min(anchor.x, window.innerWidth - 280);
  const top = Math.min(anchor.y + 6, window.innerHeight - 120);

  return (
    <div ref={ref} className="inline-param-editor" style={{ left, top }}>
      <label>{def.label}</label>
      <ParamInput def={def} value={value} onChange={(v) => updateParameterValue(def.id, v)} />
    </div>
  );
}
