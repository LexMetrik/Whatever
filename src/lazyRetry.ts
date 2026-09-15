import { lazy, type ComponentType } from 'react';

// Lazy-Import mit Wiederholung. Ein dynamischer import() einer Routen-Seite kann
// scheitern, (a) transient (Netzwerk-Blip, Dev-Server unter Last) oder (b) weil
// nach einem Deploy der Chunk-Hash wechselte und ein noch offener Tab auf einen
// nicht mehr existierenden Chunk zeigt. Ohne Auffang landet das in der
// ErrorBoundary → beim Seitenwechsel erscheint eine Fehlermeldung, erst ein
// manuelles Neuladen hilft. Hier: einige Male still neu versuchen; hält das
// Scheitern an, ist es fast immer ein veralteter Chunk → EINMAL automatisch neu
// laden (per sessionStorage gegen eine Endlosschleife abgesichert, beim ersten
// Erfolg zurückgesetzt). Reine Ladelogik (CLAUDE.md §3/§6.4) — kein Inhalt,
// keine Reihenfolge der Rechtslogik betroffen.
const RELOAD_FLAG = 'lex-chunk-reload';

function schlummer(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    for (let versuch = 0; versuch < 3; versuch++) {
      try {
        const mod = await factory();
        try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* SSR/Prerender: kein sessionStorage */ }
        return mod;
      } catch (err) {
        if (versuch < 2) { await schlummer(250 * (versuch + 1)); continue; }
        // Mehrfach gescheitert → wahrscheinlich veralteter Chunk nach Deploy.
        try {
          if (!sessionStorage.getItem(RELOAD_FLAG)) {
            sessionStorage.setItem(RELOAD_FLAG, '1');
            window.location.reload();
            // Der Reload übernimmt normalerweise die Anzeige, bevor dieser Timeout
            // greift. Falls der Reload NICHT durchkommt (beforeunload-Abbruch,
            // bfcache-Eigenheit), nicht ewig im Suspense-Fallback hängen, sondern
            // nach kurzer Frist den Fehler an die ErrorBoundary werfen.
            return await new Promise<{ default: T }>((_, reject) => setTimeout(() => reject(err), 4000));
          }
        } catch { /* sessionStorage nicht verfügbar → unten werfen */ }
        throw err;
      }
    }
    // unerreichbar, aber TS braucht einen Rückgabewert
    throw new Error('lazyRetry: unerreichbar');
  });
}
