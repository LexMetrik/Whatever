// ─── Z6c · Die Token-Normalisierung liegt dreimal im Repo — bewacht sie ─────
//
// ANLASS (Gegenprüfungs-Nebenfund §5 zu PR #856, 14.9.2026): dieselbe
// Normalisierung «Kleinschreibung, alles ausser [a-z0-9] weg» steht an DREI
// Stellen zeichengleich:
//
//   1. `normRef`  src/components/NormText.tsx            — Produktion, tokenMap
//   2. `normRef`  scripts/verweis-inventar-transkription.ts — Tor, Transkription
//   3. `norm`     src/lib/normtext/artikel-bestand.ts    — Produktion, Bestand
//
// Die drei MÜSSEN gleich bleiben, sonst entscheidet die Schreibweise eines
// Zitats über die Auflösung: NormText bildet «92a» → `92a`, der Bestand aber
// «92_a» → `92a` — driftet eine der Definitionen, findet der Bestandsabgleich
// ein lebendes Ziel nicht mehr (falscher Erlass-Fallback) oder ein totes
// fälschlich (toter Anker bleibt stehen). Beides ist §1-relevant und fällt
// heute in KEINEM Tor auf: die Guard-Tabelle der Transkription bindet nur
// (1) ↔ (2), (3) hing bisher frei.
//
// WARUM NICHT ZUSAMMENGEFÜHRT (§1 über DRY): `artikel-bestand.ts` ist
// bewusst ohne Import aus der Darstellungsschicht gebaut (§3 — eine
// Auflösungsschicht zieht keine Komponente), und die Transkription MUSS eine
// eigene Kopie haben: sie ist der Nachbau der Produktion, und ein Nachbau, der
// das Original importiert, prüft nichts mehr (§6.7). Also nicht entdoppeln,
// sondern binden — derselbe Entscheid wie bei der Guard-Tabelle.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { norm } from '../lib/normtext/artikel-bestand';

const WURZEL = process.cwd();
const LITERAL = String.raw`s.toLowerCase().replace(/[^a-z0-9]/g, '')`;

const QUELLEN: readonly [string, string][] = [
  ['src/components/NormText.tsx', 'normRef'],
  ['scripts/verweis-inventar-transkription.ts', 'normRef'],
  ['src/lib/normtext/artikel-bestand.ts', 'norm'],
];

describe('Z6c · Token-Normalisierung, drei Fundstellen', () => {
  it.each(QUELLEN)('%s trägt das Literal zeichengleich (%s)', (datei, name) => {
    const quelle = readFileSync(join(WURZEL, datei), 'utf8');
    const zeile = quelle
      .split('\n')
      .find((z) => new RegExp(`\\b${name}\\b\\s*=`).test(z) && z.includes('toLowerCase'));
    expect(zeile, `${datei}: keine Definition von \`${name}\` mit toLowerCase gefunden`).toBeDefined();
    expect(zeile).toContain(LITERAL);
  });

  // Funktionaler Gegenbeweis: das Literal allein sagt nichts, wenn es niemand
  // ausführt. Die exportierte Fassung muss die Proben auch WIRKLICH so
  // abbilden — inklusive der Fälle, an denen Z6c hängt (Suffix-Schreibweisen,
  // Anhang-Token, Sammelblock-Token).
  it('bildet die Z6c-relevanten Schreibweisen auf dasselbe Token ab', () => {
    expect(norm('92_a')).toBe('92a');
    expect(norm('92a')).toBe('92a');
    expect(norm('92 a')).toBe('92a');
    expect(norm('335_c_bis')).toBe('335cbis');
    expect(norm('335cbis')).toBe('335cbis');
    expect(norm('Art. 876_883')).toBe('art876883');
    expect(norm('annex_u1')).toBe('annexu1');
    // Kein Trimmen, kein Umlaut-Mapping — «ä» fällt weg, nicht zu «a».
    expect(norm('Art. 5ä')).toBe('art5');
  });
});
