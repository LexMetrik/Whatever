// R12A (D22 Ziff. 5) · Kernerlasse der Übersicht /gesetze — Daten, kein JSX.
// Eigene Datei, weil `pages/Gesetze.tsx` nur Komponenten exportieren darf
// (eslint react-refresh/only-export-components) und der Wächter
// `src/tests/gesetze-kernerlasse.test.ts` die Liste direkt greifen muss.
import { erlassPfadVonKey } from '../../lib/normtext/erlassAdresse';
import { ERLASS_REGISTER } from '../../lib/normtext/register';

// ─── R12A (D22 Ziff. 5) · KERNERLASSE IN EINEM KLICK ────────────────────────
//
// R12 «Wege verkürzen» (David 6.9.2026: «bei startseite auf gesetze klicken
// viele ebenen bis wir endlich im gesetz landen»). Die zehn Erlasse, die eine
// Kanzlei täglich aufschlägt, stehen darum direkt unter dem Filter — eine
// Zeile Links, keine Kacheln, kein Zwischenschritt.
//
// KEINE ZWEITE ERLASS-LISTE: geführt werden nur die SCHLÜSSEL; Kürzel und
// Adresse kommen aus dem Register bzw. aus `erlassPfadVonKey` (§5). Ein
// Schlüssel, den das Register nicht kennt, verschwindet still aus der Zeile
// statt ins Leere zu verlinken — dass keiner der zehn verschwindet, hält der
// Wächter `src/tests/gesetze-kernerlasse.test.ts` fest (§8/§6.7).
const KERNERLASS_KEYS = ['OR', 'ZGB', 'ZPO', 'STGB', 'STPO', 'SCHKG', 'BV', 'DBG', 'VWVG', 'BGG'] as const;

export function kernerlasse(): { key: string; kuerzel: string; titel: string; pfad: string }[] {
  return KERNERLASS_KEYS.flatMap((k) => {
    const e = ERLASS_REGISTER.find((r) => r.key === k);
    return e ? [{ key: k, kuerzel: e.kuerzel, titel: e.titel, pfad: erlassPfadVonKey(k) }] : [];
  });
}
