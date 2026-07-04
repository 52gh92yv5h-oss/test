import { useEffect } from "react";
import { useEditorStore } from "./store";
import StartScreen from "./components/StartScreen";
import DocumentScreen from "./components/DocumentScreen";

function parseLaunchParam() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("launch");
  if (!raw) return null;
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function App() {
  const screen = useEditorStore((s) => s.screen);
  const setPendingLaunch = useEditorStore((s) => s.setPendingLaunch);

  useEffect(() => {
    const launch = parseLaunchParam();
    if (!launch?.templateId) return;
    setPendingLaunch(launch);
    // Om mallen redan finns (t.ex. den inbyggda standardmallen) startar
    // sessionen direkt — annars väntar pendingLaunch tills mallfilen läses in.
    const existing = useEditorStore.getState().templates[launch.templateId];
    if (existing) useEditorStore.getState().loadTemplate(existing);
  }, [setPendingLaunch]);

  return screen === "start" ? <StartScreen /> : <DocumentScreen />;
}
