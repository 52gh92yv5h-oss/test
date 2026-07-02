import { DocumentSession } from "@fred/shared";

const PREFIX = "fred-autosave:";

export function autosaveKey(sessionId: string): string {
  return `${PREFIX}${sessionId}`;
}

export function saveAutosave(session: DocumentSession): void {
  try {
    localStorage.setItem(autosaveKey(session.id), JSON.stringify(session));
  } catch {
    // localStorage kan sakna utrymme eller vara avstängt - autosparning är best-effort.
  }
}

export function listAutosaves(): DocumentSession[] {
  const out: DocumentSession[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw) out.push(JSON.parse(raw) as DocumentSession);
    } catch {
      // hoppa över korrupt post
    }
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function clearAutosave(sessionId: string): void {
  localStorage.removeItem(autosaveKey(sessionId));
}
