import { createContext, useContext, useMemo } from 'react';
import { bekannteFehlerFuer, type BekannterFehler } from '../lib/bekannteFehler';

// ─── Welches Werkzeug rechnet hier? (WARNHINWEIS) ────────────────────────────
// Die Seite setzt `BekannteFehlerRahmen werkzeug="<Karten-id>"`; Ergebnisblock,
// PDF, Kopie und Kalender lesen daraus die bekannten Fehler (`lib/bekannteFehler`,
// §5). Verschachtelte Rahmen VEREINIGEN sich (Tagerechner bettet die ZPO- und
// SchKG-Rechner ein) — nie ein Wegfiltern. Ohne Rahmen: leere Liste, alles wie
// bisher. Eigene Datei, weil Komponenten-Dateien nur Komponenten exportieren
// (react-refresh).
export const BekannteFehlerKontext = createContext<readonly string[]>([]);

export function useBekannteFehler(): BekannterFehler[] {
  const werkzeuge = useContext(BekannteFehlerKontext);
  return useMemo(() => bekannteFehlerFuer(werkzeuge), [werkzeuge]);
}
