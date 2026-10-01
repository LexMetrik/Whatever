import { describe, it, expect } from 'vitest';
import { kanonischerAnkerToken, normArtEingabe, loeseArtikelEingabe, pfadLabels } from '../pages/gesetz-leser/suchTreffer';
import type { Sektion } from '../lib/normtext/browse';

// W2·10-UI-NAV/R1+R2: die reinen Ableitungen der Reader-Navigation. Die DOM-
// nahen Teile (TreeWalker-Fundstellen, Highlight-API, Sheet-Bedienung) deckt
// e2e/leser-r1-r2.e2e.ts in Chromium ab — das Vitest-Env ist `node` (kein jsdom).

// Token-Map wie der Reader sie baut (internRefs): Normalform → echter Token.
const TOKEN_MAP = new Map<string, string>([
  ['1', '1'],
  ['6a', '6_a'],
  ['110', '110'],
  ['annex1', 'annex_1'],
]);

describe('normArtEingabe — Normalisierung der Quickjump-Eingabe', () => {
  it('schneidet «Art.»/«Artikel»/«§» ab und normalisiert', () => {
    expect(normArtEingabe('Art. 6a')).toBe('6a');
    expect(normArtEingabe('Artikel 6 a')).toBe('6a');
    expect(normArtEingabe('§ 110')).toBe('110');
    expect(normArtEingabe('ART.6A')).toBe('6a');
  });

  it('lässt eine blosse Nummer unverändert', () => {
    expect(normArtEingabe('6a')).toBe('6a');
    expect(normArtEingabe(' 110 ')).toBe('110');
  });

  it('leere/zeichenlose Eingabe ⇒ leere Normalform', () => {
    expect(normArtEingabe('')).toBe('');
    expect(normArtEingabe('   ')).toBe('');
    expect(normArtEingabe('Art.')).toBe('');
  });

  it('schneidet «art» NICHT aus der Mitte (kein Wort-Zerreissen)', () => {
    // «12art» ist keine Artikel-Präfix-Form — der Präfix greift nur am Anfang.
    expect(normArtEingabe('12art')).toBe('12art');
  });
});

describe('loeseArtikelEingabe — deterministisch gegen die geladenen Token', () => {
  it('löst die vier Schreibweisen desselben Artikels auf denselben Token auf', () => {
    for (const e of ['Art. 6a', 'artikel 6 a', '6A', ' 6a ']) {
      expect(loeseArtikelEingabe(e, TOKEN_MAP)).toBe('6_a');
    }
  });

  it('löst einen einfachen Artikel auf', () => {
    expect(loeseArtikelEingabe('Art. 1', TOKEN_MAP)).toBe('1');
  });

  it('unbekannter Artikel ⇒ null (kein «ungefährer» Sprung, §8)', () => {
    expect(loeseArtikelEingabe('Art. 999', TOKEN_MAP)).toBeNull();
    // KEIN Präfix-/Fuzzy-Treffer: «11» ist nicht «110».
    expect(loeseArtikelEingabe('11', TOKEN_MAP)).toBeNull();
  });

  it('leere Eingabe ⇒ null', () => {
    expect(loeseArtikelEingabe('', TOKEN_MAP)).toBeNull();
    expect(loeseArtikelEingabe('Art.', TOKEN_MAP)).toBeNull();
  });

  it('leere Token-Map ⇒ null (kein Erlass geladen)', () => {
    expect(loeseArtikelEingabe('Art. 1', new Map())).toBeNull();
  });
});

// Minimaler Gliederungsbaum (nur die von pfadLabels gelesenen Felder).
function sek(id: string, label: string, kinder: Sektion[] = []): Sektion {
  return { id, ebene: 0, label, kinder, artikel: [] };
}
const BAUM: Sektion[] = [
  sek('sek-1', 'Erster Titel: Die Entstehung', [
    sek('sek-2', 'Erster Abschnitt: Vertrag', [sek('sek-3', 'A. Abschluss')]),
  ]),
  sek('sek-9', 'Zweiter Titel: Wirkung'),
];

describe('pfadLabels — «Sie sind hier» aus dem Scroll-Spy-Zustand', () => {
  it('projiziert die aktiven IDs in Pfad-Reihenfolge auf ihre Labels', () => {
    expect(pfadLabels(BAUM, ['sek-1', 'sek-2', 'sek-3'])).toEqual([
      'Erster Titel: Die Entstehung', 'Erster Abschnitt: Vertrag', 'A. Abschluss',
    ]);
  });

  it('behält die gelieferte Reihenfolge bei (kein Umsortieren)', () => {
    expect(pfadLabels(BAUM, ['sek-9'])).toEqual(['Zweiter Titel: Wirkung']);
  });

  it('überspringt IDs ohne Knoten — nie ein erfundener Platzhalter (§8)', () => {
    expect(pfadLabels(BAUM, ['sek-1', 'sek-weg', 'sek-2'])).toEqual([
      'Erster Titel: Die Entstehung', 'Erster Abschnitt: Vertrag',
    ]);
  });

  it('kein aktiver Pfad ⇒ leere Liste', () => {
    expect(pfadLabels(BAUM, [])).toEqual([]);
    expect(pfadLabels([], ['sek-1'])).toEqual([]);
  });
});

// Nebenfund S6 (Audit E, 23.9.2026): `/gesetze/bund/OR#art-336c` sprang nicht,
// weil der Token `336_c` heisst. Rot zu bekommen: in `kanonischerAnkerToken`
// den unscharfen Zweig streichen.
describe('kanonischerAnkerToken — Anker der Adresse auf den Erlass-Token', () => {
  const TOKENS = ['1', '336', '336_a', '336_c', '257_d', '6a', '6_a_bis'];
  it('exakter Token bleibt, wie er ist', () => {
    expect(kanonischerAnkerToken('336_c', TOKENS)).toBe('336_c');
  });
  it('#art-336c → 336_c, #art-257D → 257_d (Schreibung ohne Unterstrich/Gross)', () => {
    expect(kanonischerAnkerToken('336c', TOKENS)).toBe('336_c');
    expect(kanonischerAnkerToken('257D', TOKENS)).toBe('257_d');
  });
  it('mehrdeutige Normalform ⇒ kein Rate-Sprung, der rohe Token bleibt (§8)', () => {
    // «6a» ist exakt vorhanden; «6_a» träfe unscharf nur «6a» — eindeutig.
    expect(kanonischerAnkerToken('6_a', TOKENS)).toBe('6a');
    expect(kanonischerAnkerToken('9z', TOKENS)).toBe('9z');
    expect(kanonischerAnkerToken('1a', ['1_a', '1a_'])).toBe('1a');
  });
});

// W2·27-BUND-FERTIG P2 #48 (1.10.2026): nach dem Re-Pin 20261001 sind OR Art. 697l und 697m zu EINEM
// Fedlex-Sammelartikel «Art. 697l–697m» (Token `697_l_697_m`) geworden, BBV Art. 77/78 zu `77_78`;
// die alten Anker leben nur noch in der historischen Synopse (`public/materialien/synopse/OR.json`,
// Token `697_l`) und in bereits versendeten Links. `#art-697_l` fand keinen Token ⇒ kein Sprung.
// Der Sammelartikel TRÄGT beide Artikel im Etikett — ihn anzuspringen ist kein Raten (§8).
describe('kanonischerAnkerToken — Endpunkt eines Sammelartikels (P2 #48)', () => {
  const TOKENS = ['1', '77_78', '226_a_226_d', '274_274_g', '627_628', '697_l_697_m', '697_n', '329_g_bis'];
  it('beide Endpunkte führen auf den Sammelartikel (Schreibung mit/ohne Unterstrich)', () => {
    expect(kanonischerAnkerToken('697_l', TOKENS)).toBe('697_l_697_m');
    expect(kanonischerAnkerToken('697m', TOKENS)).toBe('697_l_697_m');
    expect(kanonischerAnkerToken('77', TOKENS)).toBe('77_78');
    expect(kanonischerAnkerToken('78', TOKENS)).toBe('77_78');
    expect(kanonischerAnkerToken('627', TOKENS)).toBe('627_628');
    expect(kanonischerAnkerToken('274_g', TOKENS)).toBe('274_274_g');
  });
  it('die Mitte eines Bereichs wird NICHT geraten (226b liegt zwischen 226a und 226d)', () => {
    expect(kanonischerAnkerToken('226_b', TOKENS)).toBe('226_b');
  });
  it('ein exakter Token schlägt den Sammelartikel; Nicht-Bereiche (329_g_bis) bleiben unberührt', () => {
    expect(kanonischerAnkerToken('77', ['77', '77_78'])).toBe('77');
    expect(kanonischerAnkerToken('329_g', TOKENS)).toBe('329_g');
  });
  it('mehrdeutig (zwei Sammelartikel mit demselben Endpunkt) ⇒ kein Rate-Sprung', () => {
    expect(kanonischerAnkerToken('6', ['5_6', '6_7'])).toBe('6');
  });
});
