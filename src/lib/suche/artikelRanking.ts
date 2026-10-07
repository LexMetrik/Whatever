// ─── Suchterme + Kernerlasse-Liste (Rest der früheren Client-Relevanz-Schicht) ─
//
// RÜCKBAU 7.10.2026 (A1-FUNDAMENT, Entscheid David «Ja, nur über Server»): die
// deterministische Re-Rangierung der Artikel-Treffer (UI-NAV S4: Stufe 0
// Hauptthema / Stufe 1 Nebenerwähnung / Stufe 2 Texttreffer, dann Kernerlass ↑,
// Ebene ↑, Artikelnummer ↑ — `rangiere`/`bewerte`) lief nur über den Browser-
// Suchindex und ist mit ihm entfallen. Die Rang-Politik lebt seither allein als
// SQL im Server-Weg: scripts/datenhaltung/suche-kern.ts (topische Stufung K2).
//
// Geblieben ist, was noch jemand braucht:
//   · `sucherTerme` — die getippten Terme (+ Vokabular-Synonyme) für die
//     Treffer-Hervorhebung im Snippet (hervorhebung.ts) und den Erlass-Leser
//     (gesetz-leser/leserSuche.ts);
//   · `KERNERLASSE_FUER_SPIEGELPRUEFUNG` — die Kernerlass-Liste, die
//     scripts/datenhaltung/suche-rang.test.ts gegen die SQL-Fassung vergleicht.

import { normalisiereBegriff, expandiereSuchbegriff } from './vokabular';

// Kernerlasse (ROUTEN-Keys, wie der Index sie führt): bewusst KLEIN gehalten und
// begründet — keine abgeleitete «Objektivität», sondern die im juristischen
// Alltag am häufigsten gemeinten Grund-Kodifikationen (Plan S4). OR/ZGB =
// Zivilrecht, StGB/StPO = Strafrecht/-verfahren, ZPO = Zivilverfahren, BV =
// Verfassung, SchKG = Vollstreckung.
const KERNERLASSE: readonly string[] = ['OR', 'ZGB', 'STGB', 'ZPO', 'STPO', 'BV', 'SCHKG'];

/** NUR für die Spiegel-Prüfung exportiert (QS-BASIS (d) K2, 31.8.2026).
 *
 *  Die Rangfolge steht dort als SQL in scripts/datenhaltung/suche-kern.ts, weil
 *  dessen Null-Import-Regel für api/** keinen geteilten Import zulässt. Damit die
 *  beiden Listen nicht auseinanderlaufen, vergleicht
 *  scripts/datenhaltung/suche-rang.test.ts sie gegeneinander. Dieser Export ist
 *  ausschliesslich dafür da. Wer hier etwas ändert, muss suche-kern.ts mitziehen —
 *  sonst läuft der Spiegel-Test rot. */
export const KERNERLASSE_FUER_SPIEGELPRUEFUNG = KERNERLASSE;

/** In vergleichbare Tokens zerlegen (lowercase, ohne Diakritika; nur a–z/0–9-Sequenzen). */
function tokens(s: string): string[] {
  return normalisiereBegriff(s).split(/[^a-z0-9]+/).filter((w) => w.length > 0);
}

/** Vorbereitete Termlisten einer Query (getippte Terme + Vokabular-Synonyme,
 *  entdoppelt). */
export function sucherTerme(q: string): { orig: string[]; syn: string[] } {
  const orig = [...new Set(tokens(q).filter((t) => t.length >= 2))];
  const origSet = new Set(orig);
  const syn = [...new Set(expandiereSuchbegriff(q).filter((t) => t.length >= 2 && !origSet.has(t)))];
  return { orig, syn };
}
