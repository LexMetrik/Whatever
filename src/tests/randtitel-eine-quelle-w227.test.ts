/**
 * W2·27-BUND-FERTIG · WP-D — Randtitel-Doppelmodell auflösen, Phase-1-Schnitt.
 *
 * Entscheid David 14.9.2026 (Fahrplan §4c, Option i): `struktur.marginalie`
 * ist die eine Quelle des Randtitels; `NormSnapshot.titel` wird zur
 * KANTON-Übergangs-Projektion (LexWork article_title) bis zur Phase-2-
 * Migration und bleibt für den Bund immer leer (0/25 601 im Korpus,
 * Recherche-Befund 15.9.2026).
 *
 * WAS DIESER TEST BEWEIST, in zwei Teilen:
 *  1. Die beiden Inline-Kopien der Fallback-Kette in `leserSuche.ts`
 *     (`baueLeserSuchIndex`, vormals Z.230 und Z.246) sind durch den
 *     kanonischen Accessor `artikelRandtitel` (`gliederungsArtikel.ts`)
 *     ersetzt — EINE Stelle für die Regel (§5), nicht mehr zwei. Geprüft wird
 *     das nicht durch Code-Lesen, sondern durch Verhaltensgleichheit: die
 *     ALTE Formel (`artikelSachtitel(marginalie) ?? (titel?.trim() || null)`),
 *     hier unabhängig nachgebaut, liefert an einem 3-Artikel-Fixture exakt
 *     dieselben Werte wie der NEUE `baueLeserSuchIndex`-Output.
 *  2. Wächter: der Bund-Korpus (`public/normtext/bund/*.json`) trägt am
 *     Snapshot-Feld `titel` weiterhin NICHTS — ein Zuwachs verletzt das
 *     Sollbild aus Ziff. 3 des Typ-Kommentars (`src/lib/normtext/typen.ts`).
 *
 * §6.7-Rot-Probe (Bericht, nicht Teil dieses Files): der Accessor
 * `artikelRandtitel` wurde einmal testweise umgestellt (`marginalie` und
 * `titel`-Zweig vertauscht) — Test 1 wurde rot, danach zurückgenommen.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { baueLeserSuchIndex } from '../pages/gesetz-leser/leserSuche';
import { artikelRandtitel } from '../pages/gesetz-leser/gliederungsArtikel';
import { artikelSachtitel } from '../lib/normtext/darstellung';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { StrukturMap } from '../lib/normtext/browse';

// Ein handgebauter Mini-Erlass mit genau den drei Fällen, die die Fallback-
// Kette unterscheidet: nur marginalie, nur titel, beides (marginalie gewinnt).
function dreiArtikelFixture(): { eintraege: NormSnapshot[]; struktur: StrukturMap } {
  const basis = {
    ebene: 'bund' as const, quelle: 'W227X', erlass: 'W227X',
    stand: '2026-01-01', quelleUrl: 'https://example.invalid', abgerufen: '2026-01-01',
    fassungsToken: '20260101', sha: 'w227x',
  };
  const eintraege: NormSnapshot[] = [
    // BUND-artig: Randtitel ausschliesslich im Sidecar (`marginalie`), Snapshot
    // trägt `titel` nie — Regelfall Bund.
    { ...basis, id: 'w227x/1', artikel: '1', artikelLabel: 'Art. 1',
      bloecke: [{ absatz: '1', text: 'Dieses Gesetz gilt für alle.' }] },
    // KANTON-artig ohne Sidecar-Marginalie: `titel` ist die einzige Quelle
    // (LexWork article_title, Übergangs-Projektion).
    { ...basis, id: 'w227x/2', artikel: '2', artikelLabel: 'Art. 2', titel: 'Zweck',
      bloecke: [{ absatz: '1', text: 'Dieses Gesetz bezweckt den Schutz.' }] },
    // Beide gesetzt (in echten Daten der Kanton-Sidecar-Fall, s. struktur-lexwork.ts):
    // `marginalie` gewinnt, `titel` wird verworfen.
    { ...basis, id: 'w227x/3', artikel: '3', artikelLabel: 'Art. 3', titel: 'Ignorierter Titel',
      bloecke: [{ absatz: '1', text: 'Dritte Bestimmung.' }] },
  ];
  const struktur: StrukturMap = {
    '1': { gliederung: [], marginalie: ['Geltungsbereich'] },
    '2': { gliederung: [], marginalie: [] },
    '3': { gliederung: [], marginalie: ['Vorrang'] },
  };
  return { eintraege, struktur };
}

/** Die ALTE Fallback-Formel, unabhängig vom Accessor nachgebaut (Referenz). */
function alteFormel(e: NormSnapshot, struktur: StrukturMap | null): string | null {
  const marginalie = struktur?.[e.artikel]?.marginalie ?? [];
  return artikelSachtitel(marginalie) ?? (e.titel?.trim() || null);
}

describe('W2·27 WP-D — eine Quelle für den Randtitel in leserSuche.ts', () => {
  it('(a) Trefferzeile: Bund aus marginalie, Kanton-ohne-Sidecar aus titel, bei beiden gewinnt marginalie', () => {
    const { eintraege, struktur } = dreiArtikelFixture();
    const index = baueLeserSuchIndex('W227X', eintraege, struktur);
    const randtitelVon = (token: string) => index.artikel.find((a) => a.token === token)?.randtitel;

    expect(randtitelVon('1')).toBe('Geltungsbereich');
    expect(randtitelVon('2')).toBe('Zweck');
    expect(randtitelVon('3')).toBe('Vorrang');
  });

  it('(a) Trefferzeile stimmt mit dem kanonischen Accessor `artikelRandtitel` überein (eine Quelle, §5)', () => {
    const { eintraege, struktur } = dreiArtikelFixture();
    const index = baueLeserSuchIndex('W227X', eintraege, struktur);
    for (const e of eintraege) {
      const randtitel = index.artikel.find((a) => a.token === e.artikel)?.randtitel ?? null;
      expect(randtitel).toBe(artikelRandtitel(e, struktur));
    }
  });

  it('(b) Verhaltensgleichheit alt/neu: die entfernte Inline-Formel liefert dieselben Werte wie der neue Accessor-Pfad', () => {
    const { eintraege, struktur } = dreiArtikelFixture();
    const index = baueLeserSuchIndex('W227X', eintraege, struktur);
    for (const e of eintraege) {
      const randtitel = index.artikel.find((a) => a.token === e.artikel)?.randtitel ?? null;
      expect(randtitel).toBe(alteFormel(e, struktur));
    }
  });
});

describe('W2·27 WP-D — Wächter: Bund schreibt NormSnapshot.titel nie', () => {
  it('kein Bund-Artikel im Korpus trägt das Feld `titel` (Sollbild: struktur.marginalie ist die eine Quelle)', () => {
    const dir = join(process.cwd(), 'public/normtext/bund');
    const dateien = readdirSync(dir).filter((f) => f.endsWith('.json'));
    // Kein stilles Grün (§6.7b): ohne Dateien im Ordner wäre die Prüfung leer
    // und immer grün — das Korpus hat 231 Bund-Erlasse (Stand 15.9.2026).
    expect(dateien.length).toBeGreaterThan(100);

    let geprueft = 0;
    let treffer = 0;
    for (const datei of dateien) {
      const doc = JSON.parse(readFileSync(join(dir, datei), 'utf8')) as
        { eintraege?: Array<Record<string, unknown>> };
      for (const e of doc.eintraege ?? []) {
        geprueft += 1;
        if (Object.prototype.hasOwnProperty.call(e, 'titel')) treffer += 1;
      }
    }
    // Kein stilles Grün (§6.7b): die Ist-Kennzahl der geprüften Menge gehört
    // in den Beweis, nicht nur das 0-Ergebnis (§7-Kennzahl-Regel bei
    // Teilbedingungen, refactoring/SKILL.md Ziff. 7).
    expect(geprueft).toBeGreaterThan(20000);
    expect(treffer).toBe(0);
  });
});
