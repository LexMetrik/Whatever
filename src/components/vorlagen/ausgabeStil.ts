import { useSyncExternalStore } from 'react';
import type { AusgabeStil } from '../../lib/vorlagen/formatvorlagen';
import { lokalSpeicher } from '../../lib/sichererSpeicher';

// ─── Ausgabe-Stil-Wahl (nüchtern ⇄ modern) – geteilte UI-Präferenz ───────────
//
// Der Stil betrifft NUR die Darstellung (welche Schriftbild-Variante PDF/DOCX/
// Vorschau zeigen), nie den Rechtsinhalt (§3/§6: Assemble unberührt, golden
// byte-gleich). Damit Vorschau UND beide Export-Knöpfe (DirektExportZeile,
// ExportLeiste) ohne Plumbing über ~30 Seiten denselben Wert sehen, liegt die
// Wahl in einem winzigen Modul-Store statt im Props-Baum. Persistiert in
// localStorage, sodass die Wahl über Vorlagen/Sitzungen hinweg hält.

const KEY = 'lexmetrik.ausgabeStil';

let aktuell: AusgabeStil = leseGespeichert();

function leseGespeichert(): AusgabeStil {
  try {
    return lokalSpeicher.lies(KEY) === 'nuechtern' ? 'nuechtern' : 'modern';
  } catch {
    return 'modern';
  }
}

const hoerer = new Set<() => void>();

export const getAusgabeStil = (): AusgabeStil => aktuell;

export const setAusgabeStil = (stil: AusgabeStil): void => {
  aktuell = stil;
  lokalSpeicher.schreib(KEY, stil); // SSR / privat-Modus
  hoerer.forEach((f) => f());
};

const abonniere = (f: () => void): (() => void) => {
  hoerer.add(f);
  return () => hoerer.delete(f);
};

/** React-Hook: liest die aktuelle Stilwahl und re-rendert bei Wechsel.
 *  Server-Snapshot = 'modern' (Default des prerenderten Schriftbilds). */
export const useAusgabeStil = (): AusgabeStil =>
  useSyncExternalStore(abonniere, getAusgabeStil, () => 'modern');
