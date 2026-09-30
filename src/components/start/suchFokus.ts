import { useCallback, useRef } from 'react';

/** Fokus-Rückgabe an das Suchfeld des Blatts. W2·19 DK-B, Gegenprüfung 30.9.2026:
 *  der Weiterweg «Suche leeren»/«Filter zurücksetzen» des Leerzustands ist ein
 *  Knopf, der mit dem Leerzustand selbst aus dem DOM fällt — der Tastaturfokus
 *  stand danach auf `body` (Escape schloss das Blatt nicht mehr, der nächste
 *  Tab übersprang das Suchfeld). Eine Quelle für alle Such-Blätter (§5/§10):
 *  `feldRef` an `BlattSuchFeld` (BlattBausteine.tsx), `zumFeld()` in den Rücksetz-Callback.
 *  Eigene Datei: react-refresh erlaubt in Komponenten-Dateien nur Komponenten. */
export function useSuchFokus() {
  const feldRef = useRef<HTMLInputElement | null>(null);
  const zumFeld = useCallback(() => { feldRef.current?.focus(); }, []);
  return { feldRef, zumFeld };
}
