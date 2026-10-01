// ─── W2·6c-SYNOPSE-LESER · der Fassungsvergleich als reine Funktion ──────────
//
// Geprüft wird `src/lib/entstehung/synopse-diff.ts` — die Auswahl (welcher
// Alt-Block gehört zu welchem Punkt der Fassungsleiste, und was ist sein «Neu»)
// und der Diff (wo genau unterscheiden sich zwei Wortlaute). Beides ist rein
// und deterministisch (§2); die Darstellung steht woanders (§3).
//
// DIE FÄLLE SIND GEMESSEN, NICHT ERFUNDEN: die Wortlaute stammen aus den
// ausgelieferten Shards (`public/materialien/synopse/**`, Stand 11.9.2026) —
// DBG 5 (Grenzgänger-Besteuerung, 1.1.2025), AHVG 21 (Referenzalter, 1.1.2024),
// AHVG 87 (Strafnorm ohne Absatzzählung) und AHVG 103 (Absatzzählung fällt weg).
// Genau an den letzten beiden ist der Bau zweimal falsch gewesen; die Fälle
// stehen hier, damit er es nicht wieder wird.
import { describe, it, expect } from 'vitest';
import {
  geltendeBloecke, lageFuerEreignis, ohneEreignisFuerArtikel, quellLueckenFuerArtikel, synopseZeilen,
  tokenAusLabel, wortDiff, hatUnterschied, vergleichsform, leerDiffVerletzungen, phantomVerletzungen, nurTitelGeaendert, AEHNLICH_MIN,
  type SynopseZeile,
} from '../lib/entstehung/synopse-diff';
import type { SynopseBlock, SynopseShard } from '../lib/entstehung/synopse';

/** Die Verkettung der Stücke je Seite MUSS das Original ergeben (§7: kein Wort geht verloren). */
function verkettet(zeile: SynopseZeile, seite: 'alt' | 'neu'): string {
  return (zeile[seite] ?? []).map((s) => s.text).join('');
}
function markiert(zeile: SynopseZeile, seite: 'alt' | 'neu'): string {
  return (zeile[seite] ?? []).filter((s) => s.marke !== 'gleich').map((s) => s.text.trim()).join('|');
}

const B = (absatz: string, num: string, text: string): SynopseBlock => [absatz, num, text];

/** Minimaler Shard mit zwei Schritten am selben Artikel. */
const SHARD: SynopseShard = {
  erlass: 'TEST', eli: 'cc/2000/1', normProfil: 'entstehung-norm/4', erzeugt: '2026-09-11',
  fensterAb: '2021-01-01', kuenftigeStaende: [],
  staende: [
    { datum: '2021-01-01', xmlUrl: 'x1', liveUrl: 'l1', sha: 's1', bytes: 1, abgerufen: '2026-09-11', artikelZahl: 1 },
    { datum: '2022-01-01', xmlUrl: 'x2', liveUrl: 'l2', sha: 's2', bytes: 1, abgerufen: '2026-09-11', artikelZahl: 1 },
    { datum: '2023-01-01', xmlUrl: 'x3', liveUrl: 'l3', sha: 's3', bytes: 1, abgerufen: '2026-09-11', artikelZahl: 1 },
  ],
  schritte: [
    {
      von: '2021-01-01', bis: '2022-01-01', ereignisOhneAenderung: ['9'],
      artikel: [{
        eId: 'art_5', token: '5', label: 'Art. 5', art: 'geaendert',
        alt: [B('1', '', 'Erste Fassung des Absatzes.')], shaNorm: 'a', zustand: 'belegt', oc: ['oc/2021/1'],
      }],
    },
    {
      von: '2022-01-01', bis: '2023-01-01',
      artikel: [
        {
          eId: 'art_5', token: '5', label: 'Art. 5', art: 'geaendert',
          alt: [B('1', '', 'Zweite Fassung des Absatzes.')], shaNorm: 'b', zustand: 'belegt', oc: ['oc/2022/2'],
        },
        {
          eId: 'art_7', token: '7', label: 'Art. 7', art: 'geaendert',
          alt: [B('1', '', 'Text ohne Fussnoten-Ereignis.')], shaNorm: 'c', zustand: 'ohne_ereignis',
        },
      ],
    },
  ],
};

const GELTEND = [B('1', '', 'Dritte Fassung des Absatzes.')];

describe('Auswahl: welcher Alt-Block gehört zu diesem Punkt?', () => {
  it('«neu» ist die Alt-Fassung des FOLGESTANDS, nicht der geltende Text', () => {
    // Der Kern von §1 an dieser Karte: sonst schriebe die Synopse dem Erlass von
    // 2022 die Wörter zu, die 2023 eingefügt wurden.
    const lage = lageFuerEreignis(SHARD, '5', '2022-01-01', ['oc/2021/1'], GELTEND);
    expect(lage.art).toBe('vergleich');
    if (lage.art !== 'vergleich') return;
    expect(lage.treffer.neuHerkunft).toBe('folgestand');
    expect(lage.treffer.neu?.[0][2]).toBe('Zweite Fassung des Absatzes.');
    expect(lage.treffer.mehrdeutig).toBe(false);
  });

  it('ohne Folgestand ist «neu» der geltende Wortlaut', () => {
    const lage = lageFuerEreignis(SHARD, '5', '2023-01-01', ['oc/2022/2'], GELTEND);
    expect(lage.art).toBe('vergleich');
    if (lage.art !== 'vergleich') return;
    expect(lage.treffer.neuHerkunft).toBe('geltend');
    expect(lage.treffer.neu?.[0][2]).toBe('Dritte Fassung des Absatzes.');
  });

  it('jeder Nicht-Treffer hat einen eigenen, benannten Zustand (§8)', () => {
    expect(lageFuerEreignis(SHARD, '5', null, [], GELTEND).art).toBe('ohne_datum');
    expect(lageFuerEreignis(null, '5', '2022-01-01', [], GELTEND).art).toBe('kein_shard');
    expect(lageFuerEreignis(SHARD, '5', '2013-01-01', [], GELTEND)).toEqual({ art: 'vor_fenster', ab: '2021-01-01' });
    expect(lageFuerEreignis(SHARD, '5', '2026-06-01', [], GELTEND)).toEqual({ art: 'kein_stand', stand: '2026-06-01' });
    // Stand ausgewertet, dieser Artikel darin unverändert — und die Fussnote
    // behauptet trotzdem ein Ereignis: der Widerspruch wird angezeigt (§11.6).
    expect(lageFuerEreignis(SHARD, '9', '2022-01-01', [], GELTEND))
      .toEqual({ art: 'ohne_unterschied', stand: '2022-01-01', konflikt: true });
    expect(lageFuerEreignis(SHARD, '8', '2022-01-01', [], GELTEND))
      .toEqual({ art: 'ohne_unterschied', stand: '2022-01-01', konflikt: false });
  });

  it('mehrere Änderungserlasse am selben Stand werden als mehrdeutig markiert (§8)', () => {
    // Gemessen: 122 Fälle «zwei Erlasse am selben Datum im selben Artikel». Der
    // Unterschied gehört dann dem STAND, nicht sicher diesem einen Erlass.
    const lage = lageFuerEreignis(SHARD, '5', '2022-01-01', ['oc/2099/9'], GELTEND);
    expect(lage.art === 'vergleich' && lage.treffer.mehrdeutig).toBe(true);
  });

  it('Alt-Blöcke ohne Fussnoten-Ereignis hängen an keinem Punkt und werden eigens geliefert', () => {
    // 1175 solcher Blöcke im Bestand, 0 davon auf einem Datum mit Ereignis
    // (Messung 11.9.2026) — ohne diese Liste wäre der Zustand unerreichbar.
    const treffer = ohneEreignisFuerArtikel(SHARD, '7', GELTEND);
    expect(treffer).toHaveLength(1);
    expect(treffer[0].artikel.zustand).toBe('ohne_ereignis');
    expect(ohneEreignisFuerArtikel(SHARD, '5', GELTEND)).toHaveLength(0);
  });
});

/**
 * Die zweite Ursache der Ausnahmeliste (W2·6c-ENTSTEHUNG-QUELLLUECKE, ROADMAP):
 * ein Artikel entfällt WIRKLICH, und dieselbe eId trägt Jahre später wieder Text.
 * Gemessen an AVIV Art. 57b: am 2021-07-01 wird die COVID-Bestimmung zur textlosen
 * Hülse (korrekt «entfallen»), am 2025-11-01 trägt dieselbe eId wieder Text — der
 * zufällig wortgleich ist («sechs Abrechnungsperioden»).
 */
const SHARD_LINEAGE: SynopseShard = {
  erlass: 'TESTL', eli: 'cc/2000/2', normProfil: 'entstehung-norm/4', erzeugt: '2026-09-12',
  fensterAb: '2021-01-01', kuenftigeStaende: [],
  staende: [
    { datum: '2021-04-01', xmlUrl: 'x1', liveUrl: 'l1', sha: 's1', bytes: 1, abgerufen: '2026-09-12', artikelZahl: 1 },
    { datum: '2021-07-01', xmlUrl: 'x2', liveUrl: 'l2', sha: 's2', bytes: 1, abgerufen: '2026-09-12', artikelZahl: 1 },
    { datum: '2025-11-01', xmlUrl: 'x3', liveUrl: 'l3', sha: 's3', bytes: 1, abgerufen: '2026-09-12', artikelZahl: 1 },
    { datum: '2026-01-01', xmlUrl: 'x4', liveUrl: 'l4', sha: 's4', bytes: 1, abgerufen: '2026-09-12', artikelZahl: 1 },
  ],
  schritte: [
    {
      von: '2021-04-01', bis: '2021-07-01',
      artikel: [{
        eId: 'art_57_b', token: '57_b', label: 'Art. 57b', art: 'entfallen',
        alt: [B('1', '', 'Die Höchstdauer beträgt sechs Abrechnungsperioden.')],
        shaNorm: 'a', zustand: 'ohne_ereignis',
      }],
    },
    { von: '2021-07-01', bis: '2025-11-01', neuEIds: ['art_57_b'], artikel: [] },
    {
      von: '2025-11-01', bis: '2026-01-01',
      artikel: [{
        eId: 'art_57_b', token: '57_b', label: 'Art. 57b', art: 'geaendert',
        alt: [B('1', '', 'Die Höchstdauer beträgt sechs Abrechnungsperioden.')],
        shaNorm: 'b', zustand: 'belegt', oc: ['oc/2025/9'],
      }],
    },
  ],
};

describe('Lineage: «Neu» folgt der Kette, nicht dem nächsten Token-Treffer', () => {
  it('ein entfallener Artikel hat KEIN «Neu» — auch wenn dieselbe eId später wiederkehrt', () => {
    // Vor dem Fix stellte `neuNach` den Wortlaut von 2026 neben den von 2021 und
    // erzeugte damit einen Leer-Diff (Ausnahme AVIV 57_b @2021-07-01, Register
    // `bibliothek/register/entstehung-leerdiff-ausnahmen.json`). Was zwischen den
    // beiden Ständen liegt, ist eine NEUE Bestimmung unter derselben Nummer — der
    // Leser darf sie nicht als Fortsetzung der alten lesen (§1).
    const treffer = ohneEreignisFuerArtikel(SHARD_LINEAGE, '57_b', GELTEND);
    expect(treffer).toHaveLength(1);
    expect(treffer[0].neuHerkunft).toBe('entfallen');
    expect(treffer[0].neu).toBeNull();
  });

  it('und der Leer-Diff-Wächter hat damit nichts mehr zu beanstanden', () => {
    expect(leerDiffVerletzungen(SHARD_LINEAGE, () => GELTEND)).toEqual([]);
  });
});

/**
 * Die Quelllücke im Leser (W2·6c-ENTSTEHUNG-QUELLLUECKE) — nachgebaut nach dem
 * gemessenen Fall CHEMRRV Art. 9: Stand 2022-04-01 führt den Artikel, 2022-05-01 und
 * 2022-10-01 führen ihn nur im Änderungsanhang, 2022-10-06 wieder normal und wortgleich.
 */
const SHARD_LUECKE: SynopseShard = {
  erlass: 'TESTQ', eli: 'cc/2005/478', normProfil: 'entstehung-norm/4', erzeugt: '2026-09-12',
  fensterAb: '2021-01-01', kuenftigeStaende: [],
  staende: [
    { datum: '2022-04-01', xmlUrl: 'x1', liveUrl: 'l1', sha: 's1', bytes: 700027, abgerufen: '2026-09-12', artikelZahl: 25 },
    { datum: '2022-05-01', xmlUrl: 'x2', liveUrl: 'l2', sha: 's2', bytes: 708599, abgerufen: '2026-09-12', artikelZahl: 3 },
    { datum: '2022-10-01', xmlUrl: 'x3', liveUrl: 'l3', sha: 's3', bytes: 717322, abgerufen: '2026-09-12', artikelZahl: 3 },
    { datum: '2022-10-06', xmlUrl: 'x4', liveUrl: 'l4', sha: 's4', bytes: 711735, abgerufen: '2026-09-12', artikelZahl: 27 },
  ],
  schritte: [
    {
      von: '2022-04-01', bis: '2022-05-01',
      artikel: [{
        eId: 'art_9', token: '9', label: 'Art. 9', ueberschrift: 'Örtlicher Geltungsbereich',
        art: 'entfallen', alt: [], shaNorm: 'q', zustand: 'quelle_unvollstaendig',
        zurueckAb: '2022-10-06', imAnhang: true,
      }],
    },
    { von: '2022-05-01', bis: '2022-10-01', artikel: [] },
    { von: '2022-10-01', bis: '2022-10-06', artikel: [] },
  ],
};

describe('Quelllücke: ein fehlender Stand ist keine Aufhebung (§8)', () => {
  it('liefert die betroffenen Stände samt Quell-Beleg — abgeleitet, nicht zweitgespeichert', () => {
    const treffer = quellLueckenFuerArtikel(SHARD_LUECKE, '9');
    expect(treffer).toHaveLength(1);
    expect(treffer[0].staende).toEqual(['2022-05-01', '2022-10-01']);
    expect(treffer[0].belege.map((b) => b.liveUrl)).toEqual(['l2', 'l3']);
    expect(treffer[0].artikel.imAnhang).toBe(true);
  });

  it('hängt am Fassungspunkt, wenn der Apparat zum Lücken-Stand doch ein Ereignis führt', () => {
    const lage = lageFuerEreignis(SHARD_LUECKE, '9', '2022-05-01', ['oc/2022/220'], GELTEND);
    expect(lage.art).toBe('quelle_unvollstaendig');
    if (lage.art !== 'quelle_unvollstaendig') return;
    expect(lage.treffer.staende).toEqual(['2022-05-01', '2022-10-01']);
  });

  it('steht NICHT in der Liste «ohne Fussnoten-Ereignis» — zwei verschiedene Aussagen', () => {
    expect(ohneEreignisFuerArtikel(SHARD_LUECKE, '9', GELTEND)).toHaveLength(0);
  });

  it('und beide Wächter lassen sie in Ruhe: es gibt keinen behaupteten Unterschied', () => {
    expect(leerDiffVerletzungen(SHARD_LUECKE, () => GELTEND)).toEqual([]);
    expect(phantomVerletzungen(SHARD_LUECKE, () => GELTEND)).toEqual([]);
  });
});

describe('geltendeBloecke: der Korpus-Wortlaut in Synopse-Gestalt', () => {
  it('macht aus Absatz + Aufzählung die Tupel-Folge, ohne etwas zu erfinden', () => {
    expect(geltendeBloecke([
      { absatz: '1', text: 'Einleitung:', items: [{ marke: 'a', text: 'erstens;' }, { marke: 'b', text: 'zweitens.' }] },
      { absatz: '2', text: 'Zweiter Absatz.' },
      { absatz: null, text: '   ' },
    ])).toEqual([
      ['1', '', 'Einleitung:'], ['1', 'a', 'erstens;'], ['1', 'b', 'zweitens.'], ['2', '', 'Zweiter Absatz.'],
    ]);
    expect(geltendeBloecke(undefined)).toEqual([]);
  });
});

describe('wortDiff', () => {
  it('markiert nur die geänderten Wörter — und verliert kein Zeichen', () => {
    const alt = 'Der Anspruch auf die Altersrente entsteht am ersten Tag.';
    const neu = 'Der Anspruch entsteht am ersten Tag.';
    const d = wortDiff(alt, neu);
    expect(d.alt.map((s) => s.text).join('')).toBe(alt);
    expect(d.neu.map((s) => s.text).join('')).toBe(neu);
    expect(d.alt.filter((s) => s.marke === 'weg').map((s) => s.text.trim()).join('|')).toBe('auf die Altersrente');
    expect(d.neu.every((s) => s.marke === 'gleich')).toBe(true);
  });

  it('eskaliert auf den ganzen Block, wo nichts mehr wiederzuerkennen ist', () => {
    const d = wortDiff('Männer, welche das 65. Altersjahr vollendet haben;', 'Die Kasse erhebt eine Gebühr von zwanzig Franken.');
    expect(d.alt).toHaveLength(1);
    expect(d.alt[0].marke).toBe('weg');
    expect(d.neu).toHaveLength(1);
    expect(d.neu[0].marke).toBe('neu');
    expect(AEHNLICH_MIN).toBeGreaterThan(0);
  });

  it('sieht durch Satz hindurch: geschütztes Leerzeichen ist keine Gesetzesänderung (BGÖ 13)', () => {
    // Gemessen 11.9.2026: AKN schreibt «Artikel\u00a011», der Korpus «Artikel 11».
    // Ohne diese Gleichsetzung stellte die Karte zweimal denselben Satz als
    // «geändert» nebeneinander (§1).
    const a = 'die nach Artikel\u00a011 angehört worden ist.';
    const b = 'die nach Artikel 11 angehört worden ist.';
    expect(vergleichsform(a)).toBe(vergleichsform(b));
    expect(hatUnterschied(synopseZeilen([B('1', 'c.', a)], [B('1', 'c', b)]))).toBe(false);
  });

  it('setzt «a.» und «a» gleich — aber nie «Vertrag.» und «Vertrag»', () => {
    const mitMarke = wortDiff('a. das Verbot;', 'a das Verbot;');
    expect(mitMarke.alt.every((x) => x.marke === 'gleich')).toBe(true);
    const satzende = wortDiff('Es gilt der Vertrag.', 'Es gilt der Vertrag');
    expect(satzende.alt.some((x) => x.marke === 'weg')).toBe(true);
  });

  it('ist deterministisch (§2): zweimal dieselbe Eingabe, zweimal dasselbe Ergebnis', () => {
    const a = 'Wer durch unwahre Angaben eine Leistung erwirkt, wird bestraft.';
    const b = 'Wer durch unwahre oder unvollständige Angaben eine Leistung erwirkt, wird bestraft.';
    expect(wortDiff(a, b)).toEqual(wortDiff(a, b));
  });
});

describe('synopseZeilen: die Gegenüberstellung', () => {
  it('richtet über die amtlichen Etiketten aus, nicht über Textähnlichkeit', () => {
    // DBG 5 zum Stand 1.1.2025 (gemessen): lit. a geändert, lit. abis eingefügt.
    const alt = [B('1', '', 'Natürliche Personen sind steuerpflichtig, wenn sie:'), B('1', 'a.', 'in der Schweiz eine Erwerbstätigkeit ausüben;'), B('1', 'b.', 'Tantiemen beziehen;')];
    const neu = [B('1', '', 'Natürliche Personen sind steuerpflichtig, wenn sie:'), B('1', 'a', 'in der Schweiz eine selbstständige oder unselbstständige Erwerbstätigkeit ausüben;'), B('1', 'abis', 'eine unselbstständige Erwerbstätigkeit für einen Arbeitgeber ausüben;'), B('1', 'b', 'Tantiemen beziehen;')];
    const z = synopseZeilen(alt, neu);
    expect(z.map((x) => x.art)).toEqual(['gleich', 'geaendert', 'eingefuegt', 'gleich']);
    // «a.» und «a» sind dieselbe amtliche Marke in zwei Schreibweisen — die
    // Normalisierung gilt nur fürs Matching, angezeigt wird der Originalwert.
    expect(markiert(z[1], 'neu')).toBe('selbstständige oder unselbstständige');
    expect(verkettet(z[1], 'alt')).toBe(alt[1][2]);
    expect(z[3].art).toBe('gleich');
  });

  it('verdichtet Blöcke ohne Etikett, statt eine Änderung zu erfinden (AHVG 87)', () => {
    // Die AKN-Konsolidierung hält die Strafnorm als EINEN Block, der
    // Korpus-Adapter als drei. Ohne Verdichtung meldete die Karte zwei
    // Einfügungen, die es nie gegeben hat (§1).
    const alt = [B('', '', 'Wer unwahre Angaben macht,\nwer die Meldepflicht verletzt,\nwird bestraft.')];
    const neu = [B('', '', 'Wer unwahre Angaben macht,'), B('', '', 'wer die Meldepflicht verletzt,'), B('', '', 'wird bestraft.')];
    const z = synopseZeilen(alt, neu);
    expect(z).toHaveLength(1);
    expect(z[0].art).toBe('gleich');
    expect(hatUnterschied(z)).toBe(false);
  });

  it('vergleicht über den ganzen Artikel, wenn eine Seite keine Etiketten führt (AHVG 103)', () => {
    const alt = [B('1', '', 'Der Bundesbeitrag beläuft sich auf 19,55 Prozent der Ausgaben.'), B('1bis', '', 'Der Beitrag wird erhöht.')];
    const neu = [B('', '', 'Der Bundesbeitrag beläuft sich auf 20,2 Prozent der Ausgaben.')];
    const z = synopseZeilen(alt, neu);
    expect(z).toHaveLength(1);
    expect(z[0].ganzerArtikel).toBe(true);
    expect(markiert(z[0], 'alt')).toContain('19,55');
    expect(markiert(z[0], 'neu')).toContain('20,2');
  });

  it('nennt eine Streichung eine Streichung, statt «…» als neuen Wortlaut zu zeigen (ZPO 176)', () => {
    const alt = [B('3', '', 'Werden die Aussagen aufgezeichnet, so kann das Gericht darauf verzichten.')];
    const neu = [B('3', '', '…')];
    const z = synopseZeilen(alt, neu);
    expect(z[0].art).toBe('entfernt');
    expect(z[0].neu).toBeNull();
  });

  it('P2 #40: die entfernte Zeile behält den Ersatztext ihrer rechten Seite (`neu` bleibt null) — «…» wie «Aufgehoben»', () => {
    // Vorher verwarf `synopseZeilen` den rechten Text bei `entfernt`; die Karte konnte die Zeile
    // darum nicht blockgenau beschriften (gemischte rechte Spalte «…» + «Aufgehoben»).
    const alt = [B('1', '', 'Wortlaut eins.'), B('2', '', 'Wortlaut zwei.')];
    const z = synopseZeilen(alt, [B('1', '', '…'), B('2', '', 'Aufgehoben')]);
    expect(z.map((x) => [x.art, x.neu, x.neuErsatz])).toEqual([
      ['entfernt', null, '…'],
      ['entfernt', null, 'Aufgehoben'],
    ]);
  });

  it('P2 #40: ohne Gegenblock (Alt-Block ganz weg) und bei anderen Zeilenarten gibt es keinen Ersatztext', () => {
    const z = synopseZeilen([B('1', '', 'Bleibt.'), B('2', '', 'Fällt weg.')], [B('1', '', 'Bleibt.')]);
    expect(z.map((x) => [x.art, x.neuErsatz])).toEqual([['gleich', undefined], ['entfernt', undefined]]);
    const e = synopseZeilen([B('1', '', '…')], [B('1', '', 'Neuer Wortlaut.')]);
    expect(e.map((x) => [x.art, x.neuErsatz])).toEqual([['eingefuegt', undefined]]);
  });

  it('meldet ehrlich, wenn zwischen zwei Ständen kein Unterschied erkennbar ist (§8)', () => {
    const gleich = [B('1', '', 'Unveränderter Wortlaut.')];
    expect(hatUnterschied(synopseZeilen(gleich, gleich))).toBe(false);
  });

  it('dokumentiert die Grenze: identischer Wortlaut mit gewechseltem Etikett gilt als entfernt+eingefügt (Gegenprüfung PR #796)', () => {
    // Kein Bug, dokumentiertes Verhalten (`schluessel`, §11.6): Identität ist
    // das AMTLICHE Etikett, nie Textähnlichkeit. Wechselt nur die Ziffer
    // (Abs. 2 → Abs. 1) bei sonst identischem Wortlaut, findet die Ausrichtung
    // keinen gemeinsamen Schlüssel und zeigt Streichung + Einfügung statt
    // «gleich» — dieser Test hält das aktuelle Verhalten fest, damit eine
    // künftige Änderung daran bewusst getroffen wird.
    const alt = [B('1', '', 'Einleitung.'), B('1', '2', 'Identischer Wortlaut.')];
    const neu = [B('1', '', 'Einleitung.'), B('1', '1', 'Identischer Wortlaut.')];
    const z = synopseZeilen(alt, neu);
    expect(z.map((x) => x.art)).toEqual(['gleich', 'entfernt', 'eingefuegt']);
    expect(verkettet(z[1], 'alt')).toBe('Identischer Wortlaut.');
    expect(verkettet(z[2], 'neu')).toBe('Identischer Wortlaut.');
  });
});

describe('leerDiffVerletzungen — der Leer-Diff-Wächter von check:entstehung (Befund #796)', () => {
  it('meldet KEINE Verletzung, solange jeder gespeicherte Alt-Block einen echten Unterschied zu seinem «Neu» trägt', () => {
    expect(leerDiffVerletzungen(SHARD, () => GELTEND)).toEqual([]);
  });

  it('Rot-Beweis: ein Alt-Block, dessen Wortlaut (nach Vergleichsform) mit seinem «Neu» übereinstimmt, wird gemeldet', () => {
    // Manipulierte Kopie von SHARD (§6.7): art_7 (`ohne_ereignis`) bekommt denselben
    // Wortlaut wie der geltende Text — genau das Symptom aus Befund #796 (Generator
    // speichert «geändert», Leser sieht «kein Unterschied»).
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 1 ? s : {
        ...s,
        artikel: s.artikel.map((a) => (a.eId !== 'art_7' ? a : { ...a, alt: [B('1', '', 'Dritte Fassung des Absatzes.')] })),
      })),
    };
    const verletzungen = leerDiffVerletzungen(manipuliert, () => GELTEND);
    expect(verletzungen).toEqual([{ token: '7', stand: '2023-01-01', zustand: 'ohne_ereignis' }]);
  });

  it('prüft auch `belegt`-Blöcke, nicht nur `ohne_ereignis`', () => {
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 0 ? s : {
        ...s,
        artikel: s.artikel.map((a) => ({ ...a, alt: [B('1', '', 'Zweite Fassung des Absatzes.')] })),
      })),
    };
    const verletzungen = leerDiffVerletzungen(manipuliert, () => GELTEND);
    expect(verletzungen).toEqual([{ token: '5', stand: '2022-01-01', zustand: 'belegt' }]);
  });

  // §6.3-DEKLARATION, ZWEITE RUNDE (W2·6c-ENTSTEHUNG-QUELLLUECKE, 12.9.2026) — die
  // Erwartung dieses Tests ist erneut FACHLICH umgedreht, nicht «angepasst»:
  //
  //  · Bis Profil `/3` stand hier `toEqual([])`, weil der Wächter `art: entfallen` ganz
  //    ausliess. Die Gegenprüfung zu PR #798 (Auflage A4) hat das als Tor-Lücke
  //    beanstandet — 160 Alt-Blöcke waren gerade zu «entfallen» gewechselt (§6.7).
  //  · Seit der LINEAGE-REGEL in `neuNach` (siehe dort) hat ein entfallener Artikel kein
  //    «Neu» mehr, auch wenn dieselbe eId Jahre später wiederkehrt. Der konstruierte Fall
  //    ist damit kein Leer-Diff mehr, sondern das, was er immer war: ein Artikel, der in
  //    diesem Schritt entfällt — linke Spalte Wortlaut, rechte Spalte «aufgehoben».
  //  · Der Wächter meldet ihn deshalb NICHT mehr, und das ist kein Zahn weniger: was er
  //    hier prüfte, ist strukturell unmöglich geworden. Dass die Karte einen Unterschied
  //    ZEIGT, prüft die zweite Erwartung unten; dass ein Alt-Block überhaupt Wortlaut
  //    trägt, prüft `check:entstehung` («Alt-Block ohne Wortlaut»).
  it('ein entfallener Artikel mit späterem Token-Treffer ist kein Leer-Diff mehr (Lineage-Regel)', () => {
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 0 ? s : {
        ...s,
        artikel: s.artikel.map((a) => ({
          ...a, art: 'entfallen' as const, alt: [B('1', '', 'Zweite Fassung des Absatzes.')],
        })),
      })),
    };
    expect(leerDiffVerletzungen(manipuliert, () => GELTEND)).toEqual([]);
    // Und der Leser sieht sehr wohl einen Unterschied: Wortlaut gegen nichts.
    expect(hatUnterschied(synopseZeilen([B('1', '', 'Zweite Fassung des Absatzes.')], [])))
      .toBe(true);
  });

  it('meldet einen entfallenen Artikel OHNE Folgeschritt nicht — «entfallen» ist selbst der Unterschied', () => {
    // `neuNach` liefert dort `neu === null`; die Karte sagt «Der Artikel ist mit diesem
    // Stand entfallen». Ein Textvergleich muss diesen Unterschied nicht tragen.
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 1 ? s : {
        ...s,
        artikel: s.artikel.map((a) => (a.eId !== 'art_7' ? a : {
          ...a, art: 'entfallen' as const, alt: [B('1', '', 'Dritte Fassung des Absatzes.')],
        })),
      })),
    };
    expect(leerDiffVerletzungen(manipuliert, () => GELTEND)).toEqual([]);
  });

  it('meldet einen Block mit geänderter Sachüberschrift nicht — der Titel IST der Unterschied (Auflage A2)', () => {
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 1 ? s : {
        ...s,
        artikel: s.artikel.map((a) => (a.eId !== 'art_7' ? a : {
          ...a,
          ueberschrift: 'Erwerbstätigkeit nach dem ordentlichen Rentenalter',
          ueberschriftNeu: 'Erwerbstätigkeit nach dem Referenzalter',
          alt: [B('1', '', 'Dritte Fassung des Absatzes.')],
        })),
      })),
    };
    expect(leerDiffVerletzungen(manipuliert, () => GELTEND)).toEqual([]);
  });
});

describe('phantomVerletzungen — der erfundene Unterschied (Auflage A5)', () => {
  it('meldet nichts, solange jeder gespeicherte Block wirklich einen anderen Wortlaut trägt', () => {
    expect(phantomVerletzungen(SHARD, () => GELTEND)).toEqual([]);
  });

  it('Rot-Beweis: Alt und Neu identisch nach der Vergleichsform, Titel-Paar gleich ⇒ Phantom', () => {
    // Die Klasse aus der Neuprüfung: der Wortlaut ist derselbe, nur die Blockgrenze wandert
    // (hier: das Ordnungs-Suffix «bis» steht einmal im Etikett, einmal am Textanfang).
    // `synopseZeilen` richtet über die Etiketten aus und zeigt darum einen Unterschied —
    // der Leer-Diff-Ast kann das nicht fangen, dieser Ast schon.
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 1 ? s : {
        ...s,
        artikel: s.artikel.map((a) => (a.eId !== 'art_7' ? a : {
          ...a, alt: [B('1', '', 'bis Dritte Fassung des Absatzes.')],
        })),
      })),
    };
    const geltend = [B('1bis', '', 'Dritte Fassung des Absatzes.')];
    expect(hatUnterschied(synopseZeilen(manipuliert.schritte[1].artikel[1].alt, geltend))).toBe(true);
    expect(phantomVerletzungen(manipuliert, () => geltend))
      .toEqual([{ token: '7', stand: '2023-01-01', zustand: 'ohne_ereignis' }]);
  });

  it('lässt eine ECHTE Absatz-Umbenennung unangetastet (Abs. 2 → Abs. 1, gleicher Wortlaut)', () => {
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 1 ? s : {
        ...s,
        artikel: s.artikel.map((a) => (a.eId !== 'art_7' ? a : {
          ...a, alt: [B('2', '', 'Dritte Fassung des Absatzes.')],
        })),
      })),
    };
    expect(phantomVerletzungen(manipuliert, () => [B('1', '', 'Dritte Fassung des Absatzes.')])).toEqual([]);
  });

  it('meldet nichts, wo sich die Sachüberschrift geändert hat — dann GIBT es eine Änderung', () => {
    const manipuliert = {
      ...SHARD,
      schritte: SHARD.schritte.map((s, i) => (i !== 1 ? s : {
        ...s,
        artikel: s.artikel.map((a) => (a.eId !== 'art_7' ? a : {
          ...a, ueberschrift: 'Alt', ueberschriftNeu: 'Neu', alt: [B('1', '', 'Dritte Fassung des Absatzes.')],
        })),
      })),
    };
    expect(phantomVerletzungen(manipuliert, () => GELTEND)).toEqual([]);
  });
});

describe('nurTitelGeaendert — der Leser-Zustand «nur die Sachüberschrift» (Auflage A2, BVG Art. 33b)', () => {
  // BVG Art. 33b, Schritt 2023-01-01 → 2024-01-01 (amtliche Konsolidierungen, Fedlex
  // Filestore, abgerufen 12.9.2026): der Randtitel «Erwerbstätigkeit nach dem
  // ordentlichen Rentenalter» wird zu «Erwerbstätigkeit nach dem Referenzalter»; der
  // Absatzwortlaut bleibt Zeichen für Zeichen derselbe. Mit Profil `/3` sagte die Karte
  // dazu «kein Unterschied erkennbar» — falsch (§8).
  const gleich = [B('', '', 'Der Arbeitgeber kann in Abrede stellen, dass …')];
  it('erkennt den Fall, wenn der Wortlaut gleich bleibt und der Titel wechselt', () => {
    const zeilen = synopseZeilen(gleich, gleich);
    expect(hatUnterschied(zeilen)).toBe(false);
    expect(nurTitelGeaendert({ ueberschriftNeu: 'Erwerbstätigkeit nach dem Referenzalter' }, zeilen)).toBe(true);
  });

  it('sagt nichts über den Titel, wo sich auch der Wortlaut unterscheidet', () => {
    const zeilen = synopseZeilen(gleich, [B('', '', 'Anderer Wortlaut.')]);
    expect(nurTitelGeaendert({ ueberschriftNeu: 'Neuer Titel' }, zeilen)).toBe(false);
  });

  it('bleibt falsch, wo kein neuer Titel gespeichert ist', () => {
    expect(nurTitelGeaendert({}, synopseZeilen(gleich, gleich))).toBe(false);
  });
});

describe('tokenAusLabel (Entwurf ↔ Beschluss)', () => {
  it('liest die Artikelnummer aus dem Bundesblatt-Kopf, nie mehr', () => {
    expect(tokenAusLabel('Art. 107 Abs. 3')).toBe('107');
    expect(tokenAusLabel('Art. 25 Betrieb der Zentren des Bundes')).toBe('25');
    expect(tokenAusLabel('Art. 13a Medizinische Massnahmen')).toBe('13_a');
    expect(tokenAusLabel('Art. 68novies Datenerhebung')).toBe('68_novies');
    expect(tokenAusLabel('Art. 16kbis Abs. 3 und 3bis')).toBe('16_kbis');
  });

  it('rät nicht, wo kein Artikelkopf steht (§2)', () => {
    expect(tokenAusLabel('Gliederungstitel nach Art. 24e')).toBeNull();
    expect(tokenAusLabel('8. Kapitel 5. Abschnitt (Art. 59–61)')).toBeNull();
    expect(tokenAusLabel('Va. (Art. 45a)')).toBeNull();
  });
});
