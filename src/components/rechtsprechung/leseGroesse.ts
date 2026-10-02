import { lokalSpeicher } from '../../lib/sichererSpeicher';
// ─── Lese-Schriftgrösse des Entscheidtexts (R17) ────────────────────────────
//
// Herausgelöst aus `pages/EntscheidLeser.tsx` am 31.8.2026 (§6.6 · Datei-
// Schlankheit, Anlass: `check:schlankheit` ROT nach den B2/BAU-4-Nachzügen).
// Stufen UND Speicherung gehören zusammen — die Migrationslese unten prüft
// gegen `FS_STUFEN.length`; getrennt liefen sie beim nächsten Stufen-Zuwachs
// auseinander (§5). Reine Zustandshaltung, keine Darstellung, keine
// Rechtslogik (§2/§3): dieselbe Eingabe ergibt dieselbe Stufe.
//
// Bewusst eine eigene Datei neben `EntscheidKopfTeile.tsx`: dort stehen nur
// Komponenten (`react-refresh/only-export-components`), hier nur Werte.

// Lese-Schriftgrössen (R17, A−/A+); Index 1 = Default (1.08rem).
export const FS_STUFEN = [1.0, 1.08, 1.18, 1.3];
// QS-CODE-AUSSENKANTEN: der Key hiess bis 4.8.2026 `rsp-fs-idx` — ausserhalb des
// `lexmetrik.`-Präfix-Schemas und darum vom Einstellungen-Reset (RESET_PRAEFIXE)
// nicht sicher erfasst. Neuer Key MIT Migrationslese: bestehende Werte unter dem
// alten Key werden einmalig übernommen, unter dem neuen Key weitergeschrieben und
// der alte Key gelöscht.
const FS_IDX_KEY = 'lexmetrik.rsp-fs-idx';
const FS_IDX_KEY_ALT = 'rsp-fs-idx';
export function ladeFsIdx(): number {
  try {
    // Null-Guard (D-1.1): `Number(null) === 0` liess jeden ERSTBESUCHER still auf
    // Stufe 0 (1.0rem) statt Default 1 (1.08rem) fallen — R2-Bruch ohne Symptom.
    let roh = lokalSpeicher.lies(FS_IDX_KEY);
    if (roh === null) {
      const alt = lokalSpeicher.lies(FS_IDX_KEY_ALT);
      if (alt !== null) {
        roh = alt;
        // Den alten Schlüssel nur löschen, wenn der neue wirklich geschrieben ist —
        // sonst ginge die Wahl bei gesperrtem Speicher/Quota still verloren.
        if (lokalSpeicher.schreib(FS_IDX_KEY, alt)) lokalSpeicher.entferne(FS_IDX_KEY_ALT);
      }
    }
    if (roh !== null) {
      const v = Number(roh);
      if (Number.isInteger(v) && v >= 0 && v < FS_STUFEN.length) return v;
    }
  } catch { /* localStorage nicht verfügbar */ }
  return 1;
}

/**
 * Stufe klemmen UND schreiben. Beim Umzug (31.8.2026) wurde daraus EINE
 * Funktion: der Leser klemmte bisher selbst gegen `FS_STUFEN.length` und
 * schrieb selbst unter `FS_IDX_KEY` — damit lagen Stufen-Wissen und Key
 * ausserhalb dieser Datei, obwohl die Migrationslese oben gegen beides prüft.
 * Der Key bleibt darum modul-privat (§5: EINE Stelle kennt ihn).
 */
export function speichereFsIdx(i: number): number {
  const x = Math.max(0, Math.min(FS_STUFEN.length - 1, i));
  lokalSpeicher.schreib(FS_IDX_KEY, String(x)); // egal
  return x;
}
