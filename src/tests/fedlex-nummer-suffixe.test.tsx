import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ART_SUFFIXE, artikelToken, fedlexLinkFuerArtikel } from '../lib/fedlex';
import { N2_ARTNR } from '../lib/fedlex/parser';
import { NormText, type InternRefs } from '../components/NormText';
import { LocaleProvider } from '../components/locale';

// ═══ W2·22-VERWEIS-FEDLEX · Z6 a — Suffix-Reihe der Artikelnummern ══════════
//
// BEFUND (Messung 2.9.2026, bestätigt 14.9.2026): die lateinische Ordnungsreihe
// endete in JEDER der elf Hand-Kopien bei «sexies». Artikelnummern darüber
// («Artikel 29septies AHVG», «Artikel 179octies StGB», «Art. 80dduodecies
// IRSG») kannte die Nummern-Grammatik nicht. Das war nicht bloss ein fehlender
// Link: hätte man EINEN der vier Konsumenten allein geweitet, wäre ein FALSCHER
// Anker entstanden — «#art_29septies» statt «#art_29_septies», denn nur
// `artikelToken` zerlegt Nummer/Buchstabe/Suffix.
//
// FIX: EINE Reihe (`src/lib/fedlex/nummer.ts`, §5), gelesen von allen vier
// Konsumenten. Dieser Test hält jeden einzeln fest — sonst könnte einer still
// zurückfallen und genau den falschen Anker wieder erzeugen.
//
// KORPUS-BESTAND (14.9.2026, `public/normtext/**`, Feld `artikel`):
//   septies 20 · octies 17 · novies 8 · decies 5 · undecies 2 · duodecies 2.
// Höhere Glieder (terdecies …) führt der Korpus NICHT — sie bleiben draussen
// und dienen hier als Negativfall (§7: nur Gemessenes).

const NORMTEXT = join(process.cwd(), 'public/normtext');
type Snapshot = { eintraege: Array<{ artikel: string }> };
const lade = (rel: string): Snapshot =>
  JSON.parse(readFileSync(join(NORMTEXT, `${rel}.json`), 'utf8')) as Snapshot;

describe('Z6 a · geteilte Suffix-Reihe (nummer.ts)', () => {
  it('trägt die im Korpus belegten Glieder — und nur die', () => {
    expect([...ART_SUFFIXE]).toEqual([
      'bis', 'ter', 'quater', 'quinquies', 'sexies',
      'septies', 'octies', 'novies', 'decies', 'undecies', 'duodecies',
    ]);
  });

  it('jedes Glied ist am Snapshot-Korpus belegt (§7: kein geratenes Suffix)', () => {
    // Gegenprobe zur Liste oben: ein Glied, das kein einziger Artikel führt,
    // wäre eine Erfindung — und erzeugte Anker auf Bestimmungen, die es nicht
    // gibt. Gezählt wird über die Bund-Erlasse, die die hohen Glieder tragen.
    const tokens = new Set<string>();
    for (const key of ['AHVG', 'AHVV', 'STGB', 'IVG', 'IVV', 'IRSG', 'KKV', 'USG', 'OR']) {
      for (const e of lade(`bund/${key}`).eintraege) tokens.add(e.artikel);
    }
    const belegt = new Set<string>();
    for (const t of tokens) {
      const m = /_([a-z]+)$/.exec(t);
      if (m && (ART_SUFFIXE as readonly string[]).includes(m[1])) belegt.add(m[1]);
    }
    expect([...belegt].sort()).toEqual([...ART_SUFFIXE].sort());
  });
});

describe('Z6 a · Konsument 1: artikelToken (Anker-Form)', () => {
  it.each([
    ['29septies', '29_septies'],
    ['179octies', '179_octies'],
    ['4novies', '4_novies'],
    ['3decies', '3_decies'],
    ['2undecies', '2_undecies'],
    ['80dduodecies', '80_d_duodecies'],
  ])('«%s» → «%s»', (nummer, token) => {
    expect(artikelToken(nummer)).toBe(token);
  });

  it('die erzeugten Token sind die des Snapshots (nicht bloss plausibel)', () => {
    // Der Anker ist nur richtig, wenn er DEM Token entspricht, das der Erlass
    // wirklich führt — darum gegen die Datei geprüft, nicht gegen eine Annahme.
    for (const [rel, nummer] of [
      ['bund/AHVG', '29septies'], ['bund/STGB', '179octies'],
      ['bund/IVV', '21septies'], ['bund/IRSG', '80dduodecies'],
    ] as const) {
      expect(lade(rel).eintraege.some((e) => e.artikel === artikelToken(nummer)),
        `${rel} führt «${artikelToken(nummer)}» nicht`).toBe(true);
    }
  });

  it('Negativ: unbekanntes Suffix wird NICHT zerlegt («29terdecies»)', () => {
    expect(artikelToken('29terdecies')).toBe('29terdecies');
  });
});

describe('Z6 a · Konsument 2: fedlexLinkFuerArtikel (Fedlex-Anker)', () => {
  it.each([
    ['Art. 29septies AHVG', '#art_29_septies'],
    ['Art. 179octies StGB', '#art_179_octies'],
    ['Art. 3decies AHVV', '#art_3_decies'],
    ['Art. 80dduodecies IRSG', '#art_80_d_duodecies'],
  ])('«%s» endet auf «%s»', (zitat, anker) => {
    expect(fedlexLinkFuerArtikel(zitat)?.endsWith(anker)).toBe(true);
  });

  it('Negativ (§1): unbekanntes Suffix ⇒ Erlass-URL OHNE Anker, nie ein halber', () => {
    // Die Falle, um die es geht: «29terdecies» darf weder zu «#art_29_ter»
    // (halbes Suffix, falscher Artikel) noch zu «#art_29terdecies» (Anker, den
    // kein Snapshot führt) werden. Kein Anker ist die richtige Antwort.
    const url = fedlexLinkFuerArtikel('Art. 29terdecies AHVG');
    expect(url).toBeTruthy();
    expect(url).not.toContain('#');
  });
});

describe('Z6 a · Konsument 3: N2_ARTNR (Fremdgesetz-Erkennung)', () => {
  const voll = new RegExp(`^${N2_ARTNR}(?![0-9a-zäöü])`);
  it.each(['29septies', '179octies', '4novies', '3decies', '2undecies', '80dduodecies'])(
    'erfasst «%s» VOLLSTÄNDIG (nie halb)', (nummer) => {
      expect(voll.exec(nummer)?.[0]).toBe(nummer);
    });

  it('Negativ: «29terdecies» matcht gar nicht statt als «29t»', () => {
    expect(voll.exec('29terdecies')).toBeNull();
  });
});

describe('Z6 a · Konsument 4: ART_INTERN (Inline-Linker im Leser)', () => {
  const ssr = (el: React.ReactElement) => renderToString(<LocaleProvider>{el}</LocaleProvider>);
  function refs(rel: string): InternRefs {
    const tokenMap = new Map<string, string>();
    for (const e of lade(rel).eintraege) {
      tokenMap.set(e.artikel.toLowerCase().replace(/[^a-z0-9]/g, ''), e.artikel);
    }
    const [ebene, key] = rel.split('/');
    return { tokenMap, basisPfad: `/gesetze/${ebene}/${key}`, springeZu: () => {} };
  }

  it('StGB Art. 321ter: «Artikel 179octies» springt auf art-179_octies', () => {
    const html = ssr(
      <NormText text="Vorbehalten bleiben Artikel 179octies sowie die Bestimmungen." intern={refs('bund/STGB')} />,
    );
    expect(html).toContain('/gesetze/bund/STGB#art-179_octies');
  });

  it('IVV Art. 21octies: «Artikel 21septies» springt auf art-21_septies', () => {
    const html = ssr(
      <NormText text="Wird das Taggeld zudem nach Artikel 21septies gekürzt, so erfolgt der Abzug." intern={refs('bund/IVV')} />,
    );
    expect(html).toContain('/gesetze/bund/IVV#art-21_septies');
  });

  it('Negativ (§8): «Artikel 29septies» im StGB bleibt Text — der Erlass führt es nicht', () => {
    const html = ssr(
      <NormText text="Vorbehalten bleiben Artikel 29septies sowie die Bestimmungen." intern={refs('bund/STGB')} />,
    );
    expect(html).not.toContain('#art-29');
    expect(html.replace(/<[^>]*>/g, '')).toContain('Artikel 29septies');
  });

  it('Negativ (§1): unbekanntes Suffix erzeugt keinen halben Sprung', () => {
    const html = ssr(
      <NormText text="Vorbehalten bleiben Artikel 179terdecies sowie die Bestimmungen." intern={refs('bund/STGB')} />,
    );
    expect(html).not.toContain('#art-179');
    expect(html.replace(/<[^>]*>/g, '')).toContain('Artikel 179terdecies');
  });
});
