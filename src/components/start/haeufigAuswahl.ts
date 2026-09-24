import { ERLASS_REGISTER, type ErlassRegistereintrag } from '../../lib/normtext/register';

// ─── «Häufig gebraucht» — die Auswahl (U4, David 24.9.2026) ──────────────────
// Nur die sieben KÜRZEL stehen hier; Titel, Schlüssel und Adresse liefert das
// Erlass-Register (§5). Darstellung: `HaeufigGebraucht.tsx`; Wächter:
// `src/tests/haeufig-gebraucht.test.tsx` (jedes Kürzel genau einmal im Bund).

export const HAEUFIG_KUERZEL = ['BV', 'ZGB', 'OR', 'StGB', 'ZPO', 'StPO', 'SchKG'] as const;

/** Register-Eintrag je Kürzel — nur Bundeserlasse (das Register trägt den Bund). */
export function haeufigeErlasse(): ErlassRegistereintrag[] {
  return HAEUFIG_KUERZEL.map((k) => ERLASS_REGISTER.find((e) => e.ebene === 'bund' && e.kuerzel === k))
    .filter((e): e is ErlassRegistereintrag => !!e);
}
