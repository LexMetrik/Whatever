/**
 * W2·18-FEHLERBUCH — die Artikel-Ebene der Gliederung (Auftrag David 13.8.2026).
 *
 * AUFTRAG, wörtlich: «Die Gliederung muss in JEDEM Erlass bis zum einzelnen
 * Artikel aufklappbar sein.» Einzige Ausnahme: Erlasse, deren Baum die
 * Artikel-Granularität schon erreicht (OR/ZGB über ihre Randtitel-Knoten) —
 * dort wird nichts gedoppelt, und der Baum darf sich nicht ändern.
 *
 * WARUM GEGEN DEN ECHTEN KORPUS (Muster: gliederung-modell-w219.test.ts): die
 * Regel entscheidet an Verhältnissen, die nur die committeten Snapshots kennen.
 * Ein erfundener Baum prüfte die eigene Fantasie.
 *
 * DIE TYPEN-BREITE IST PFLICHT, nicht Kür (Auftrag David 13.8.2026, Ziff. 2):
 * Staatsverträge (RBUE) und Kantonserlasse (BS-…) dürfen nach dem Umbau keine
 * kaputte oder leere Artikel-Ebene zeigen. Darum laufen die Kernfälle über
 * dieselbe Neuner-Liste wie S3 — OR · AIG · VwVG · NHG · RBUE · BS-211.100 ·
 * BS-730.110 · ZH-243 · SG-3849 —, ergänzt um ZGB (zweiter Ausnahmefall), ZPO
 * (der Anlassfall) und BV (b1-offen: Start-Sichtbarkeit).
 */
import { describe, it, expect } from 'vitest';
import { baueGliederungsbaum, type StrukturMap, type Sektion } from '../lib/normtext/browse';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import type { NormSnapshot } from '../lib/normtext/typen';
import { kuratiereTocSektionen } from '../pages/gesetz-leser/berechnungen';
import { pfadZu } from '../pages/gesetz-leser/helpers';
import { klappZeile } from '../pages/gesetz-leser/tocAutoZuklappen';
import { artikelSachtitel } from '../lib/normtext/darstellung';
import {
  baueGliederungsModell, flacheZeilen, zeileIstOffen, artikelKinderOffen, findeMarke,
  findeSynthPfad, uebersetzeRohPfad, artikelRandtitel, istAnhangEintrag,
  ARTIKEL_EBENE_MAX_BLATT_DECKUNG, ID_ARTIKEL,
  type GliederungsModell, type GliederungsKnoten,
} from '../pages/gesetz-leser/gliederungsModell';

function lade(ebene: 'bund' | 'kanton', key: string, go = true): GliederungsModell & {
  eintraege: NormSnapshot[]; struktur: StrukturMap | null; sektionen: Sektion[];
} {
  const { eintraege, struktur } = ladeNormFixture(ebene, key);
  const roh = baueGliederungsbaum(eintraege, struktur);
  const sektionen = kuratiereTocSektionen(roh.sektionen);
  // `startSichtbarGo: true` = die Reader-Einstellung (inhalt.tsx) — nur so
  // prüft der Start-Zustands-Fall unten, was der Nutzer wirklich sieht.
  const modell = baueGliederungsModell({
    sektionen, ohneGliederung: roh.ohneGliederung, eintraege, struktur, startSichtbarGo: go,
  });
  return { ...modell, eintraege, struktur, sektionen };
}

/** Ist die Zeile `id` direktes Kind eines GEMISCHTEN Knotens (Sektions- und Artikel-Kinder)? */
const unterGemischtem = (knoten: GliederungsKnoten[], id: string): boolean =>
  flacheZeilen(knoten).some((k) => k.kinder.some((kk) => kk.id === id)
    && k.kinder.some((kk) => kk.art !== 'artikel') && k.kinder.some((kk) => kk.art === 'artikel'));

const artikelZeilen = (m: { knoten: GliederungsKnoten[] }): GliederungsKnoten[] =>
  flacheZeilen(m.knoten).filter((k) => k.art === 'artikel');

/** Die Zeilen, die der Nutzer OHNE eigenes Zutun sieht (Klapp-Karte leer). */
const sichtbarBeimStart = (knoten: GliederungsKnoten[], tiefe: number, offen: Record<string, boolean> = {}): GliederungsKnoten[] =>
  knoten.flatMap((k) => {
    if (!zeileIstOffen(k, offen, tiefe)) return [k];
    // Dieselbe Auswahl wie im Renderer (SektionBaumTOC): Artikel-Kinder nur,
    // wenn die Zeile ausdrücklich geöffnet wurde (F1).
    const artikelAuf = artikelKinderOffen(k, offen, tiefe);
    const kinder = k.kinder.filter((kk) => kk.art !== 'artikel' || artikelAuf);
    return [k, ...sichtbarBeimStart(kinder, tiefe, offen)];
  });

// ═══ 1 · Der Anlassfall und die Typen-Breite ════════════════════════════════
describe('W2·18 — jeder Artikel ist über die Gliederung erreichbar', () => {
  // Erlasse im Baum-Modus (B1), quer durch die Typen-Matrix: Bundesgesetz mit
  // Kapitel-Gliederung (ZPO/AIG), Staatsvertrag (RBUE), Kantonserlasse mit
  // Feingliederung (BS-730.110) und mit gemischten Knoten (BS-211.100).
  const baumFaelle = [
    ['bund', 'ZPO', 430], ['bund', 'AIG', 261], ['bund', 'RBUE', 49], ['bund', 'BV', 232],
    ['kanton', 'BS-730.110', 129],
  ] as const;

  for (const [ebene, key, anzahl] of baumFaelle) {
    it(`${key}: alle ${anzahl} Artikel haben eine eigene Zeile`, () => {
      const m = lade(ebene, key);
      expect(m.artikelEbene).toBe('voll');
      expect(m.kennzahlen.artikelAnzahl).toBe(anzahl);
      // Jede Zeile, die genau EINEN Artikel deckt — die neuen Artikel-Zeilen
      // UND die Anhang-Einträge, die `baueAnhangAst` schon vorher je Eintrag
      // erzeugt hat (dort wäre eine zweite Zeile die verbotene Doppelung).
      const gedeckt = new Set(
        flacheZeilen(m.knoten)
          .filter((k) => k.art === 'artikel' || k.art === 'anhang')
          .flatMap((k) => k.tokens ?? []),
      );
      const fehlend = m.eintraege.filter((e) => !gedeckt.has(e.artikel));
      expect(fehlend.map((e) => e.artikelLabel), `${key}: kein Artikel ohne Zeile`).toEqual([]);
    });
  }

  it('ZPO (Anlassfall): Sachtitel stehen an der Zeile, wo das Sidecar einen führt', () => {
    const m = lade('bund', 'ZPO');
    const zeilen = artikelZeilen(m);
    expect(zeilen.length).toBe(430);
    const eins = zeilen.find((k) => k.ersterArtikel === '1');
    expect(eins?.label).toBe('Art. 1 — Gegenstand');
    expect(eins?.sachtitel).toBe('Gegenstand');
    // Übergangsbestimmung — sie ist kein Sonderfall, sondern eine Zeile wie jede
    // andere (Auftrag Ziff. 3 «Sonderstrukturen respektieren»).
    expect(zeilen.find((k) => k.ersterArtikel === '404')?.label)
      .toBe('Art. 404 — Weitergelten des bisherigen Rechts');
    // §8: wo das Sidecar KEINEN artikel-eigenen Sachtitel führt (ZPO Art. 257 —
    // dort trägt ihn der Abschnitts-Knoten), bleibt die Zeile bei der blossen
    // Nummer. Nichts wird aus dem Nachbarn geliehen.
    const ohne = zeilen.find((k) => k.ersterArtikel === '257');
    expect(ohne?.label).toBe('Art. 257');
    expect(ohne?.sachtitel).toBeUndefined();
    expect(zeilen.filter((k) => k.sachtitel).length).toBe(403);
  });

  it('§5: der Sachtitel der Baum-Zeile ist derselbe wie im flachen Artikel-Index', () => {
    // Zwei Modi, EINE Quelle (`artikelRandtitel`) — sonst zeigte derselbe
    // Artikel je nach Erlass-Typ zwei verschiedene Überschriften.
    const m = lade('bund', 'ZPO');
    for (const z of artikelZeilen(m).slice(0, 60)) {
      const e = m.eintraege.find((x) => x.artikel === z.ersterArtikel)!;
      expect(z.sachtitel ?? null).toBe(artikelRandtitel(e, m.struktur));
      expect(z.sachtitel ?? null).toBe(artikelSachtitel(m.struktur?.[e.artikel]?.marginalie ?? []));
    }
  });

  it('RBUE (Staatsvertrag): auch der Vorspann öffnet bis zum Artikel', () => {
    // T9: 47 von 49 Artikeln liegen ohne Gliederungs-Zuordnung vor dem ersten
    // Sidecar-Knoten. Die Sammelzeile «Ohne Abschnitt (Art. 1–38)» ist kein
    // Zugang zu Art. 23 — erst ihre Artikel-Kinder sind es.
    const m = lade('bund', 'RBUE');
    const vorspann = m.knoten.find((k) => k.art === 'vorspann');
    expect(vorspann).toBeDefined();
    expect(vorspann!.kinder.length).toBe(47);
    expect(vorspann!.kinder.every((k) => k.art === 'artikel')).toBe(true);
    expect(vorspann!.kinder[0].label).toBe('Art. 1');
  });

  it('AIG: die Anhang-Sektionen bekommen die Ebene, die Anhang-EINTRÄGE nicht doppelt', () => {
    const m = lade('bund', 'AIG');
    const anhangWurzel = m.knoten.find((k) => k.art === 'anhang');
    expect(anhangWurzel).toBeDefined();
    // Kein Anhang-Eintrag trägt eine zusätzliche Artikel-Kind-Zeile: seine
    // Zeile IST schon der Eintrag (§5).
    for (const k of flacheZeilen([anhangWurzel!]).filter((x) => x.art === 'anhang')) {
      expect(k.kinder.every((kk) => kk.art !== 'artikel')).toBe(true);
    }
    // Die Anhang-SEKTIONEN darunter haben ihre Artikel dagegen als Zeilen.
    const artikelImAnhang = flacheZeilen([anhangWurzel!]).filter((k) => k.art === 'artikel');
    expect(artikelImAnhang.length).toBeGreaterThan(0);
  });

  it('BS-211.100 (T8): Artikel-Zeilen stehen in Dokumentreihenfolge zwischen den Untersektionen', () => {
    const m = lade('kanton', 'BS-211.100');
    expect(m.artikelEbene).toBe('voll');
    const pos = new Map(m.eintraege.map((e, i) => [e.artikel, i]));
    const ersteArt = (k: GliederungsKnoten): number => {
      const eigene = k.ersterArtikel !== undefined ? pos.get(k.ersterArtikel) ?? Infinity : Infinity;
      return Math.min(eigene, ...k.kinder.map(ersteArt));
    };
    const pruefe = (k: GliederungsKnoten): void => {
      // Nur die Stämme der amtlichen Gliederung: die Anhang-Wurzel sammelt
      // bewusst quer eingehängte Äste (Modell-Doku `umhaengPraefix`).
      if (k.art !== 'anhang') {
        const folge = k.kinder.filter((x) => x.art !== 'anhang').map(ersteArt).filter((n) => Number.isFinite(n));
        const sortiert = [...folge].sort((a, b) => a - b);
        expect(folge, `${k.id}: Kinder in Dokumentreihenfolge`).toEqual(sortiert);
      }
      k.kinder.forEach(pruefe);
    };
    m.knoten.forEach(pruefe);
  });

  it('aufgehobene Artikel behalten ihren Platzhalter in der Gliederung', () => {
    // §8: eine Lücke in der Artikel-Folge, die es im Erlass nicht gibt, wäre
    // eine Falschaussage. BS-211.100 führt 153 aufgehobene Bestimmungen.
    const m = lade('kanton', 'BS-211.100');
    const aufgehoben = artikelZeilen(m).filter((k) => k.aufgehoben);
    expect(aufgehoben.length).toBe(153);
    expect(aufgehoben.length).toBe(m.eintraege.filter((e) => e.aufgehoben === true && !istAnhangEintrag(e)
      && artikelZeilen(m).some((z) => z.ersterArtikel === e.artikel)).length);
  });

  it('BS-730.110: die Einzelkind-Verdichtung bleibt intakt, die Artikel hängen am Blatt', () => {
    const m = lade('kanton', 'BS-730.110');
    const verdichtet = flacheZeilen(m.knoten).filter((k) => k.labelKette.length > 1);
    // T7 ist der belegte NULLFALL der Verdichtung (s. gliederungsModell.ts) —
    // geprüft wird darum die Regel, nicht eine Zahl: eine verdichtete Zeile
    // trägt mehrere Ids, aber nie eine Artikel-Zeile als Ketten-Glied.
    for (const k of verdichtet) expect(k.ids.length).toBe(k.labelKette.length);
    expect(artikelZeilen(m).every((k) => k.ids.length === 1 && k.labelKette.length === 1)).toBe(true);
    expect(artikelZeilen(m).length).toBe(129);
  });

  it('Ids sind eindeutig (React-Key-Vertrag) und kollidieren nie mit sek-N', () => {
    for (const [ebene, key] of [['bund', 'ZPO'], ['bund', 'AIG'], ['kanton', 'BS-211.100']] as const) {
      const alle = flacheZeilen(lade(ebene, key).knoten);
      expect(new Set(alle.map((k) => k.id)).size, `${key}: doppelte Zeilen-Id`).toBe(alle.length);
      for (const k of alle.filter((x) => x.art === 'artikel')) expect(k.id.startsWith(`${ID_ARTIKEL}:`)).toBe(true);
    }
  });
});

// ═══ 2 · Artikel-granulare Bäume: Lücken schliessen, nichts doppeln ═════════
//
// GEÄNDERTE ERWARTUNG, deklariert (Nutzer-Turn David 13.8.2026: «die ganze
// Gliederung bis zum einzelnen Artikel in ALLEN Gesetzen»). Dieser Block prüfte
// bis zum Nachtrag «OR/ZGB bleiben unangetastet» — eine Zusicherung aus dem
// Auftrags-Rahmen, die Davids Anforderung nachgeordnet ist. Sie fiel, als die
// eigene Lane den Preis gemessen hat: in OR waren 83 von 1686 Artikeln über die
// Gliederung NICHT anspringbar, im ZGB 48 (plus 74 aus der A36-Kuration, die
// bewusst nicht im Baum stehen), dazu LFG 17 · KOV 8 ·
// SchKG 7 · ENTG 6 · IPRG 5 · VZG 5 · VSTG 4 · VSTV 1 · VSTRR 1. Der Grund ist
// mechanisch: eine Zeile hat genau EIN Sprungziel, ein Knoten mit mehreren
// Artikeln erreicht also nur den ersten.
//
// Was NICHT fällt: das Doppelungs-Verbot (§5). Die 1568 Randtitel-Blätter des
// OR bekommen weiterhin keine Kind-Zeile — nur Knoten, die ihre Artikel nicht
// selbst anspringen.
describe('W2·18 — artikel-granulare Bäume: jeder Artikel erreichbar, keine Doppelung', () => {
  /**
   * Anspringbare Artikel: jede Zeile führt zu genau EINEM Artikel
   * (`ersterArtikel`, s. SektionBaumTOC — Sektionszeilen über `onSprung`,
   * Artikel- und Synth-Zeilen über `onSprungArtikel`). Der flache Index zählt
   * mit, wo ein Modus ihn zeigt.
   */
  const anspringbar = (m: GliederungsModell): Set<string> => {
    const ziel = new Set<string>(
      flacheZeilen(m.knoten).map((k) => k.ersterArtikel).filter((t): t is string => t !== undefined),
    );
    for (const g of m.artikelIndex) for (const z of g.zeilen) ziel.add(z.token);
    return ziel;
  };

  const sammleTokens = (s: Sektion, aus: Set<string>): void => {
    s.artikel.forEach((a) => aus.add(a.artikel));
    s.kinder.forEach((k) => sammleTokens(k, aus));
  };

  // Zahlen aus der Korpus-Sonde 13.8.2026, gemessen am Stand VOR diesem Commit
  // (Sabotage `luecken → keine`): Artikel im kuratierten Baum-Eingang ohne
  // anspringbare Zeile. Beim ZGB sind es 48 — die im GESAMT-Snapshot gezählten
  // 122 enthalten zusätzlich die 74 Artikel der A36-Kuration, die absichtlich
  // nicht im Baum stehen (eigener Fall unten).
  const granular = [
    ['bund', 'OR', 83], ['bund', 'ZGB', 48], ['bund', 'SCHKG', 7],
    ['bund', 'IPRG', 5], ['bund', 'LFG', 17], ['bund', 'KOV', 8],
  ] as const;

  for (const [ebene, key, vorher] of granular) {
    it(`${key}: ${vorher} vorher unerreichbare Artikel → 0`, () => {
      const m = lade(ebene, key);
      expect(m.artikelEbene).toBe('luecken');
      expect(m.kennzahlen.artikelBlattDeckung).toBeGreaterThan(ARTIKEL_EBENE_MAX_BLATT_DECKUNG);

      // (a) Erreichbarkeit, gemessen am KURATIERTEN Baum-Eingang, den das Modell
      // bekommt. Das ist kein Weichspüler: `kuratiereTocSektionen` nimmt beim
      // ZGB die 74 Artikel des Anhangs «Wortlaut der früheren Bestimmungen des
      // sechsten Titels» bewusst aus der Gliederung (A36, Bau-Spec §3.4 «bleibt
      // UNVERÄNDERT») — sie stehen vollständig in der Lesespalte samt Anker.
      // Ein Test, der sie hier einforderte, verlangte die Rücknahme eines
      // anderen, begründeten Entscheids. Der Fall darunter zählt sie einzeln.
      const imEingang = new Set<string>();
      m.sektionen.forEach((s) => sammleTokens(s, imEingang));
      const ziel = anspringbar(m);
      expect([...imEingang].filter((t) => !ziel.has(t)), `${key}: nicht anspringbare Artikel`).toEqual([]);

      // (b) Die Lücken sind wirklich über NEUE Zeilen geschlossen, nicht durch
      // eine weichere Messung: mindestens so viele Artikel-Zeilen wie vorher
      // fehlende Artikel.
      const artikelZeilen = flacheZeilen(m.knoten).filter((k) => k.art === 'artikel');
      expect(artikelZeilen.length).toBeGreaterThanOrEqual(vorher);

      // (c) KEINE DOPPELUNG: keine Zeile, die ihren einzigen Artikel schon
      // selbst anspringt, hat eine Kind-Zeile bekommen.
      for (const t of flacheZeilen(m.knoten).filter((k) => k.kinder.some((kk) => kk.art === 'artikel'))) {
        const eigene = t.kinder.filter((kk) => kk.art === 'artikel');
        const waereDieselbeZeile = t.kinder.length === 1 && eigene.length === 1
          && t.ersterArtikel === eigene[0].ersterArtikel;
        expect(waereDieselbeZeile, `${key}/${t.id}: Zeile und Artikel-Zeile wären dieselbe`).toBe(false);
      }
    });
  }

  it('ZGB: die 74 verbleibenden Artikel sind die deklarierte A36-Kuration, kein Leck', () => {
    // Ehrlichkeit statt runder Null (§8): korpusweit bleibt nach dem Umbau
    // GENAU dieser eine Block ohne Gliederungs-Zeile — der Alt-Güterrecht-
    // Anhang, den `kuratiereTocSektionen` absichtlich aus dem Baum nimmt.
    const { eintraege, struktur } = ladeNormFixture('bund', 'ZGB');
    const roh = baueGliederungsbaum(eintraege, struktur);
    const kuratiert = roh.sektionen.find((s) => s.label === 'Wortlaut der früheren Bestimmungen des sechsten Titels');
    expect(kuratiert, 'A36-Kurationsziel muss im Rohbaum existieren').toBeDefined();
    const inKuration = new Set<string>();
    sammleTokens(kuratiert!, inKuration);
    expect(inKuration.size).toBe(74);

    const m = lade('bund', 'ZGB');
    const ziel = anspringbar(m);
    const fehlt = eintraege.filter((a) => !ziel.has(a.artikel));
    expect(fehlt.length).toBe(74);
    expect(fehlt.every((a) => inKuration.has(a.artikel))).toBe(true);
  });

  it('B2 mit Anhang-Sektionen: auch dort schliesst die Lücken-Regel auf (ASYLV3, RDV)', () => {
    // Zweiter Fund derselben Mechanik: in b2-index rendert der Baum-Renderer NUR
    // den Anhang-Ast, und der flache Index lässt Anhang-Einträge bewusst aus
    // (§5). Eine Anhang-SEKTION mit mehreren Artikeln erreichte damit nur ihren
    // ersten — ASYLV3 5 von 51, RDV 3 von 37 waren über die Leiste nirgends zu
    // finden. Ohne diesen Fall wäre der Umbau auf halbem Weg stehen geblieben.
    for (const [key, anzahl] of [['ASYLV3', 51], ['RDV', 37]] as const) {
      const m = lade('bund', key);
      expect(m.modus).toBe('b2-index');
      const ziel = anspringbar(m);
      expect(m.eintraege.filter((a) => !ziel.has(a.artikel)).map((a) => a.artikelLabel),
        `${key}: nicht anspringbare Artikel`).toEqual([]);
      expect(m.kennzahlen.artikelAnzahl).toBe(anzahl);
      // Die Zeilen entstehen NUR im Anhang-Ast — der übrige Baum wird in diesem
      // Modus gar nicht gezeigt, dort wäre jede gebaute Zeile Verschnitt (§15).
      const anhangAst = m.knoten.filter((k) => k.art === 'anhang');
      expect(flacheZeilen(anhangAst).filter((k) => k.art === 'artikel').length).toBeGreaterThan(0);
      expect(flacheZeilen(m.knoten.filter((k) => k.art !== 'anhang')).some((k) => k.art === 'artikel')).toBe(false);
    }
  });

  it('OR: das Doppelungs-Verbot trägt — 115 Artikel-Zeilen, nicht 1686', () => {
    const m = lade('bund', 'OR');
    const artikelZeilen = flacheZeilen(m.knoten).filter((k) => k.art === 'artikel').length;
    // 115 Zeilen schliessen 83 Lücken: ein Knoten mit mehreren Artikeln gibt
    // auch seinem ERSTEN eine Zeile — eine Teilliste «alle ausser dem ersten»
    // wäre die verwirrendere Wahl. Weit entfernt von den 1686 Zeilen, die eine
    // Ebene ohne Lücken-Regel erzeugt hätte.
    expect(artikelZeilen).toBe(115);
    expect(artikelZeilen).toBeLessThan(m.kennzahlen.artikelAnzahl / 10);
    expect(flacheZeilen(m.knoten).filter((k) => k.id.startsWith(`${ID_ARTIKEL}:`)).length).toBe(115);
  });

  it('die 20 artikel-granularen Erlasse, namentlich (F4 des §9-Bug-Checks)', () => {
    // Der Kommentar an ARTIKEL_EBENE_MAX_BLATT_DECKUNG verweist auf «die Liste
    // im Unit-Test» — bis zum Bug-Check gab es sie nicht. Hier ist sie:
    // korpusweit gemessen (1458 Snapshots, 13.8.2026) fallen genau diese
    // Erlasse in den Umfang `luecken`. Der Fall ist bewusst eine feste Liste
    // und keine Schwellen-Rechnung: verschiebt ein Korpus-Nachzug einen Erlass
    // über die Schwelle, wird das SICHTBAR statt still.
    const erwartet = [
      'BS-730.120', 'BS-740.110', 'BS-782.100', 'BS-783.200', 'BS-783.410', 'BS-813.400',
      'BS-819.410', 'BS-832.200', 'ENTG', 'IPRG', 'KOV', 'LFG', 'OR', 'SCHKG',
      'VSTG', 'VSTRR', 'VSTV', 'VZG', 'ZG-641.1', 'ZGB',
    ];
    const gemessen: string[] = [];
    for (const key of erwartet) {
      const ebene = /^[A-Z]{2}-/.test(key) ? 'kanton' : 'bund';
      const m = lade(ebene as 'bund' | 'kanton', key);
      if (m.artikelEbene === 'luecken') gemessen.push(key);
    }
    expect(gemessen.sort()).toEqual([...erwartet].sort());
  });

  it('die Schwelle trennt die beiden Lager mit Abstand (§0-3: Verteilung, nicht Einzelwert)', () => {
    // Korpus-Sonde 13.8.2026: unterhalb endet die Verteilung bei 0.793, oberhalb
    // beginnt sie bei 0.800; OR/ZGB haben 12 bzw. 8 Prozentpunkte Luft. Die
    // Zahlen hier sind die Ränder dieser Lücke, gemessen an den Snapshots.
    expect(lade('bund', 'OR').kennzahlen.artikelBlattDeckung).toBeCloseTo(0.919, 2);
    expect(lade('bund', 'ZGB').kennzahlen.artikelBlattDeckung).toBeCloseTo(0.881, 2);
    for (const [ebene, key] of [['bund', 'ZPO'], ['bund', 'AIG'], ['kanton', 'BS-730.110']] as const) {
      expect(lade(ebene, key).kennzahlen.artikelBlattDeckung).toBeLessThan(0.2);
    }
  });
});

// ═══ 3 · Die anderen Modi: warum sie die Ebene nicht tragen ═════════════════
describe('W2·18 — Modi ohne Artikel-Ebene, jeder aus eigenem Grund', () => {
  for (const [ebene, key] of [['bund', 'VWVG'], ['bund', 'NHG']] as const) {
    it(`${key} (b2-index): die Artikel stehen flach im Index, nicht zweimal`, () => {
      const m = lade(ebene, key);
      expect(m.modus).toBe('b2-index');
      expect(m.artikelEbene).toBe('keine');
      const imIndex = m.artikelIndex.flatMap((g) => g.zeilen.map((z) => z.token));
      const anhang = m.eintraege.filter(istAnhangEintrag).length;
      expect(imIndex.length).toBe(m.eintraege.length - anhang);
      expect(flacheZeilen(m.knoten).some((k) => k.art === 'artikel')).toBe(false);
    });
  }

  // ── Die 68er-Familie: Snapshots OHNE Sidecar und OHNE Randtitel ────────────
  // Befund der parallelen Korpus-Lane (13.8.2026): bei diesen Erlassen zeigte
  // die Leiste eine LEERE Gliederung — die Modus-Kette fiel auf «leer», weil
  // sie ohne Randtitel keinen Index zutraute. Gemessen am Korpus sind es 68
  // Erlasse (40 ohne Sidecar, 28 mit sidecar-losem Inhalt), alle ohne
  // Sektionen und mit Dichte 0, im Mittel 22 Artikel, der grösste 607.
  // Sie tragen die Artikel-Folge trotzdem im Snapshot — nur eben ohne
  // Überschriften.
  const ohneSidecar = [
    ['kanton', 'ZH-243', 150], ['kanton', 'SG-3849', 607], ['kanton', 'VD-vd-105539', 118],
    ['kanton', 'GE-rsg_d3_30', 194], ['kanton', 'SZ-173.111', 40],
  ] as const;

  for (const [ebene, key, anzahl] of ohneSidecar) {
    it(`${key}: keine leere Leiste mehr — jeder der ${anzahl} Artikel steht im Index`, () => {
      const m = lade(ebene, key);
      expect(m.modus).toBe('b2-index');
      expect(m.kennzahlen.artikelAnzahl).toBe(anzahl);
      // Die Artikel-Ebene des BAUMS bleibt aus — es gibt keinen Baum. Der
      // flache Index ist hier der ganze Zugang (§5: nicht beides).
      expect(m.artikelEbene).toBe('keine');
      const imIndex = m.artikelIndex.flatMap((g) => g.zeilen.map((z) => z.token));
      const imAnhang = flacheZeilen(m.knoten).filter((k) => k.art === 'anhang').flatMap((k) => k.tokens ?? []);
      const gedeckt = new Set([...imIndex, ...imAnhang]);
      expect(m.eintraege.filter((e) => !gedeckt.has(e.artikel)).map((e) => e.artikelLabel)).toEqual([]);
      // Ohne Randtitel trägt die Zeile nur ihr amtliches Etikett — «Art. N»
      // bzw. «§ N», je nach Designator des Erlasses (aus `artikelLabel`, nie
      // geraten). Genau dieser Fall war vorher gesperrt.
      const alle = m.artikelIndex.flatMap((g) => g.zeilen);
      expect(alle.every((z) => /^(Art\.|§)\s*\S/.test(z.label))).toBe(true);
    });
  }

  it('b3-leer bleibt für den einen ehrlichen Fall: ein Erlass ohne jeden Artikel', () => {
    const m = baueGliederungsModell({ sektionen: [], ohneGliederung: [], eintraege: [], struktur: null });
    expect(m.modus).toBe('b3-leer');
    expect(m.knoten).toEqual([]);
    expect(m.artikelIndex).toEqual([]);
  });
});

// ═══ 4 · Start-Zustand: Verfügbarkeit, nicht Sichtbarkeit ═══════════════════
describe('W2·18 — die Artikel-Ebene ist verfügbar, aber nie von selbst offen', () => {
  // Auftrag David 13.8.2026: «es geht um VERFÜGBARKEIT der Artikel-Ebene beim
  // Aufklappen, nicht um Start-Sichtbarkeit».
  it('BV (b1-offen, David-Go «sichtbar»): der Start zeigt weiter genau die Sektionszeilen', () => {
    const m = lade('bund', 'BV');
    expect(m.modus).toBe('b1-offen');
    expect(m.startOffeneTiefe).toBe(Number.POSITIVE_INFINITY);
    const sichtbar = sichtbarBeimStart(m.knoten, m.startOffeneTiefe);
    expect(sichtbar.some((k) => k.art === 'artikel')).toBe(false);
    // Ohne die `startOffen: false`-Klemme wären es 39 + 232 = 271 Zeilen.
    expect(sichtbar.length).toBe(m.kennzahlen.zeilenVoll);
    expect(m.kennzahlen.zeilenGesamt).toBe(39 + 232);
  });

  // ── F1 (§9-Bug-Check 13.8.2026): die Klemme darf keine SEKTIONEN verstecken ──
  // Die erste Fassung setzte `startOffen: false` an jedem Knoten mit
  // Artikel-Kindern. An gemischten Knoten (T8) nahm das die Untersektionen mit:
  // korpusweit 58 Erlasse, 257 Start-Zeilen. Die beiden Fälle hier sind die
  // gemessenen Extreme — sie sind gegen den Stand vor dem Fix rot.
  //
  // W2·5m-LESER-V3 (Befund David 19.9.2026, «bei svg art. 26 nicht
  // ersichtlich»; deklarierte fachliche Änderung, §6.3): am GEMISCHTEN Knoten
  // folgen die direkten Artikel jetzt der Zeile — sie stehen im Gesetz vor dem
  // ersten Unterabschnitt, und eine offene Zeile ohne sie war ein halb offener
  // Ast. Die Start-Zahlen steigen darum um genau diese direkten Artikel
  // (BS-257.820 7 → 20, GR-210.370 16 → 25); Artikel UNTER einer Zeile, die nur
  // Artikel trägt, bleiben beim Start weiterhin zu.
  const t8Faelle = [['kanton', 'BS-257.820', 20], ['kanton', 'GR-210.370', 25]] as const;
  for (const [ebene, key, zeilen] of t8Faelle) {
    it(`${key} (T8): der Start zeigt weiterhin ${zeilen} Zeilen, nicht nur den Stamm`, () => {
      const m = lade(ebene, key);
      const sichtbar = sichtbarBeimStart(m.knoten, m.startOffeneTiefe);
      expect(sichtbar.length).toBe(zeilen);
      // Die Sektions-Sicht ist vollständig — jede Zeile, die die Start-Regel
      // öffnet, zeigt ihre Sektions-Kinder.
      for (const k of sichtbar) {
        if (!zeileIstOffen(k, {}, m.startOffeneTiefe)) continue;
        for (const kind of k.kinder.filter((kk) => kk.art !== 'artikel')) {
          expect(sichtbar.some((x) => x.id === kind.id), `${key}: ${kind.id} fehlt in der Start-Sicht`).toBe(true);
        }
      }
      // …und Artikel-Zeilen nur als direkte Kinder gemischter Knoten.
      expect(sichtbar.filter((k) => k.art === 'artikel' && !unterGemischtem(m.knoten, k.id))).toEqual([]);
      expect(sichtbar.some((k) => k.art === 'artikel'), `${key}: Gegenprobe — gemischte Artikel sichtbar`).toBe(true);
    });
  }

  it('gemischter Knoten: seine direkten Artikel folgen der Zeile (W2·5m-LESER-V3)', () => {
    const m = lade('kanton', 'GR-210.370');
    const misch = flacheZeilen(m.knoten).find((k) =>
      k.kinder.some((kk) => kk.art === 'artikel') && k.kinder.some((kk) => kk.art !== 'artikel'));
    expect(misch, 'GR-210.370 muss einen gemischten Knoten haben').toBeDefined();
    // Start: Sektionen UND direkte Artikel (vorher: Artikel nein — Art.-26-Befund).
    expect(zeileIstOffen(misch!, {}, m.startOffeneTiefe)).toBe(true);
    expect(artikelKinderOffen(misch!, {}, m.startOffeneTiefe)).toBe(true);
    // Nach dem Chevron-Klick: beides. Der Klick läuft über `klappZeile` — nur
    // dieser Weg öffnet die Artikel-Ebene (CI-Rot 13.8.2026, s. dort).
    const auf = klappZeile({}, misch!.ids, false);
    expect(artikelKinderOffen(misch!, auf, m.startOffeneTiefe)).toBe(true);
    // Zugeklappt: nichts.
    const zu = klappZeile(auf, misch!.ids, true);
    expect(artikelKinderOffen(misch!, zu, m.startOffeneTiefe)).toBe(false);
    // Und der SPY (schreibt nur die nackte Sektions-Id) öffnet sie mit der Zeile.
    const spy = Object.fromEntries(misch!.ids.map((id) => [id, true]));
    expect(zeileIstOffen(misch!, spy, m.startOffeneTiefe), 'Sektionen: ja').toBe(true);
    expect(artikelKinderOffen(misch!, spy, m.startOffeneTiefe), 'direkte Artikel: ja').toBe(true);
  });

  // ── CI-Rot 13.8.2026 (Lauf 31721564029, Shard 6): der Spy darf die
  //    Artikel-Ebene NICHT öffnen ──────────────────────────────────────────
  // BEFUND: «A9 — Chip … CLS-frei» riss mit CLS 0.0751 gegen Budget 0.05; die
  // Quellen waren drei Baumzeilen der BV, die IM SICHTBAND auf 0×0 kollabieren,
  // die grösste 280×498 px. Der CI-Trace zeigt die BV mit `aria-expanded=false`
  // an den artikel-tragenden Zeilen — geöffnet haben kann sie also nur der
  // Scroll-Spy, und das Auto-Zuklappen hängte den so gewachsenen Ast später
  // wieder aus. Lokal ist der Lauf nicht reproduzierbar (CLS 0 auch bei 20×
  // Drossel und Nachlauf 0), darum steht die Regel hier als Unit-Invariante.
  const spyFaelle = [['bund', 'BV'], ['bund', 'ZPO'], ['kanton', 'GR-210.370']] as const;
  for (const [ebene, key] of spyFaelle) {
    it(`${key}: ein Spy-Öffnen des Aktiv-Pfads bringt KEINE Artikel-Zeile ins Bild`, () => {
      const m = lade(ebene, key);
      // Der Spy schreibt die nackten Sektions-Ids des Aktiv-Pfads in die
      // Klapp-Karte (inhalt-hooks, `aktualisieren`) — hier: ALLE Zeilen offen,
      // der härteste Fall.
      const spy: Record<string, boolean> = {};
      for (const k of flacheZeilen(m.knoten)) for (const id of k.ids) spy[id] = true;
      const sichtbar = sichtbarBeimStart(m.knoten, m.startOffeneTiefe, spy);
      // W2·5m-LESER-V3: ausgenommen die direkten Artikel gemischter Knoten, die
      // der Zeile folgen (höchstens 26 an einem Knoten, AHVV); eine Zeile, die
      // NUR Artikel trägt — der CLS-Fall der BV —, öffnet der Spy weiterhin nie.
      expect(sichtbar.filter((k) => k.art === 'artikel' && !unterGemischtem(m.knoten, k.id)).length,
        `${key}: der Spy hat die Artikel-Ebene aufgerissen`).toBe(0);
      // Gegenprobe: über den Klick-Weg erscheinen sie sehr wohl — sonst prüfte
      // der Fall eine Ebene, die es gar nicht gibt (§6.7).
      // Gegenprobe über den Klick-Weg: ALLE Zeilen aufklappen (bei b1-kompakt
      // sind auch die Vorfahren zu, sonst bliebe die Ebene schon deshalb unsichtbar).
      let klick: Record<string, boolean> = {};
      for (const k of flacheZeilen(m.knoten)) klick = klappZeile(klick, k.ids, false);
      expect(sichtbarBeimStart(m.knoten, m.startOffeneTiefe, klick).some((k) => k.art === 'artikel')).toBe(true);
    });
  }

  it('ZPO (b1-kompakt): der Start bleibt bei den obersten Knoten', () => {
    const m = lade('bund', 'ZPO');
    expect(m.startOffeneTiefe).toBe(0);
    expect(sichtbarBeimStart(m.knoten, m.startOffeneTiefe).some((k) => k.art === 'artikel')).toBe(false);
  });

  it('ein Klick auf die Kapitel-Zeile öffnet die Artikel (Klapp-Karte schlägt Modell)', () => {
    const m = lade('bund', 'ZPO');
    const traeger = flacheZeilen(m.knoten).find((k) => k.kinder.some((kk) => kk.art === 'artikel'))!;
    expect(zeileIstOffen(traeger, {}, m.startOffeneTiefe)).toBe(false);
    const auf = Object.fromEntries(traeger.ids.map((id) => [id, true]));
    expect(zeileIstOffen(traeger, auf, m.startOffeneTiefe)).toBe(true);
  });
});

// ═══ 5 · Positionsmarke bis auf die Artikel-Zeile (F2 des §9-Bug-Checks) ════
//
// BEFUND (zwei Prüfer unabhängig, 13.8.2026): Die Marke erreichte die neuen
// Artikel-Zeilen NIE. Der Aktiv-Pfad kommt aus `pfadZu` (Rohbaum) bzw.
// `findeSynthPfad` — beide kennen nur Sektions- und Synth-Ids, nie die
// `gm-art:`-Ids. Sichtbar war das an der ZPO: beim Lesen von Art. 404 markierte
// die Leiste das Kapitel, obwohl die Zeile «Art. 404 — Weitergelten des
// bisherigen Rechts» direkt darunter stand. Der flache Artikel-Index (B2/B4)
// markiert seit S9 artikelgenau; die Baum-Ansicht zieht hier nach.
//
// Die Testlücke, die das durchgehen liess: der bestehende Marken-Fall prüfte
// nur `!== null`. Diese Fälle prüfen die ART der getroffenen Zeile.
describe('W2·18/F2 — die Marke findet die Artikel-Zeile, wenn sie sichtbar ist', () => {
  /** Aktiv-Pfad wie im Reader: Rohpfad übersetzt, sonst der Synth-Pfad. */
  const aktivPfadFuer = (m: ReturnType<typeof lade>, token: string): string[] => {
    const roh = pfadZu(m.sektionen, (s) => s.artikel.some((a) => a.artikel === token));
    return roh ? uebersetzeRohPfad(m.umhaengPraefix, roh) : (findeSynthPfad(m.knoten, token) ?? []);
  };

  const faelle = [
    ['bund', 'ZPO', '404', 'Art. 404 — Weitergelten des bisherigen Rechts'],
    ['bund', 'SCHKG', '283', 'Art. 283 — Retentionsverzeichnis'],
    ['bund', 'RBUE', '23', 'Art. 23'],
  ] as const;

  for (const [ebene, key, token, label] of faelle) {
    it(`${key} Art. ${token}: die Marke sitzt auf der Artikel-Zeile, nicht auf dem Kapitel`, () => {
      const m = lade(ebene, key);
      const ids = aktivPfadFuer(m, token);
      expect(ids.length, `${key}: kein Aktiv-Pfad für ${token}`).toBeGreaterThan(0);
      // Der Ast steht offen, wie nach einem Chevron-Klick auf die Trägerzeile:
      // `klappZeile` öffnet Sektions- UND Artikel-Ebene. Der Auto-Akkordeon-Pfad
      // des Spy öffnet die Artikel-Ebene bewusst NICHT (CI-Rot 13.8.2026) —
      // dann bleibt die Marke am Kapitel, s. den Fall darunter.
      const offen = ids.reduce<Record<string, boolean>>((o, id) => klappZeile(o, [id], false), {});
      const marke = findeMarke(m.knoten, ids, offen, m.startOffeneTiefe, token);
      const zeile = flacheZeilen(m.knoten).find((k) => k.id === marke);
      expect(zeile, `${key}: Marke ${String(marke)} zeigt auf keine Zeile`).toBeDefined();
      expect(zeile!.art, `${key}: Marke sitzt auf «${zeile!.label}»`).toBe('artikel');
      expect(zeile!.ersterArtikel).toBe(token);
      expect(zeile!.label).toBe(label);
      // «Genau EINE Marke» bleibt: die Id kommt im ganzen Baum einmal vor.
      expect(flacheZeilen(m.knoten).filter((k) => k.id === marke).length).toBe(1);
    });
  }

  it('zugeklappt bleibt es beim Kapitel — die Marke verschwindet nie (a9-Sprungziel)', () => {
    const m = lade('bund', 'ZPO');
    const ids = aktivPfadFuer(m, '404');
    // Nur die Sektionen offen, die Artikel-Ebene zu: der Zustand direkt nach dem
    // Öffnen der Leiste. Die Marke muss auf der TIEFSTEN SICHTBAREN Zeile sitzen.
    const marke = findeMarke(m.knoten, ids, {}, m.startOffeneTiefe, '404');
    const zeile = flacheZeilen(m.knoten).find((k) => k.id === marke);
    expect(zeile?.art).toBe('sektion');
    expect(marke).toBe(ids[0]);
  });

  it('OR Art. 329gbis: kein Doppel — die Marke sitzt auf dem Randtitel-Blatt, das den Artikel IST', () => {
    // Im Bug-Check als «Marke auf sachfremdem Nachbarknoten» gemeldet; am Modell
    // nachgeprüft trifft das nicht zu: `sek-610` trägt genau diesen einen
    // Artikel, und sein Label «b. Im Falle des Todes der Mutter» IST dessen
    // amtlicher Randtitel. Eine Artikel-Zeile daneben wäre die Doppelung, die
    // §5 verbietet — der Fall hält beides fest, damit die Frage nicht
    // wiederkehrt.
    const m = lade('bund', 'OR');
    const ids = aktivPfadFuer(m, '329_g_bis');
    const offen = ids.reduce<Record<string, boolean>>((o, id) => klappZeile(o, [id], false), {});
    const marke = findeMarke(m.knoten, ids, offen, m.startOffeneTiefe, '329_g_bis');
    const zeile = flacheZeilen(m.knoten).find((k) => k.id === marke)!;
    expect(zeile.art).toBe('sektion');
    expect(zeile.ersterArtikel).toBe('329_g_bis');
    expect(zeile.kinder.some((k) => k.art === 'artikel')).toBe(false);
  });
});
