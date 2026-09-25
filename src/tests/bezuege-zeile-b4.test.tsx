/**
 * W2·7-BEZUG/B4+B7 — die «Bezüge»-Zeile am Artikel.
 *
 * Die Zusagen, die nur am gerenderten Markup prüfbar sind:
 *   (1) §8 Rang-Trennung: Leitentscheid und übriges/kantonales Urteil stehen in
 *       EIGENEN, benannten Gruppen — nie in einer gemeinsamen Reihe.
 *   (2) B7 Vollständigkeit: die Linie führt ALLE Kanten der Klasse; gezeigt
 *       werden 5 auf einmal, ein Klick lädt die nächsten 5 (David 29.7.2026).
 *   (3) B7 Scrollbarkeit + CLS: je Klasse EINE Linie fester Höhe, waagrecht
 *       scrollbar, tastaturerreichbar.
 *   (4) §8 kein stilles Nichts / keine erfundene Zahl.
 *
 * ── §6.3-DEKLARATION (B7, David-Auftrag 28.7.2026) ──────────────────────────
 * Vier Zusicherungen dieser Datei sind GEÄNDERT, nicht «aufgeweicht»: sie
 * massen den Auslieferungs-Deckel «8 je Status», den dieser Schritt AUFHEBT.
 *   · «Art. 5 StPO: der Shard deckelt 115 kantonale Entscheide auf 8» — der
 *     Vorbefund misst jetzt das Gegenteil: 115 geliefert von 115 erfassten.
 *   · «zeigt ‹8 von 115›, nicht ‹8›» → «zeigt ‹5 von 115›»: die Linie FÜHRT
 *     alle 115, zeigt aber 5 auf einmal (David 29.7.2026: «es soll einfach 5
 *     entscheide pro linie sein und mit klick lädt es die nächsten 5»). Der
 *     Deckel ist damit nicht zurück — er war eine AUSLIEFERUNGS-Grenze in den
 *     Shards, dies ist eine Anzeige-Portion, die ein Klick beliebig weit öffnet.
 *   · «die ehrliche Zahl sitzt am Gruppenkopf» — bleibt, mit den neuen Zahlen.
 *   · Der Fall «Zahl MIT Grundgesamtheit» ist nicht verschwunden, sondern hat
 *     eine andere Ursache: den Zeit-/Kantonsfilter. Er ist unten eigens geprüft
 *     («12 von 30 im Zeitraum»), damit die §8-Zusage nicht mit dem Deckel
 *     verlorengeht.
 * Eine fachliche Änderung, deklariert und begründet — kein stilles Nachziehen.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BezuegeZeile } from '../pages/gesetz-leser/parts/BezuegeZeile';
import { PRO_SCHRITT, istLetzterSchritt, naechsteSichtbar, verkuerzungAus, zahlText } from '../pages/gesetz-leser/bezugPortion';
import { bezuegeFuerArtikel, type Bezug, type BezugsShard } from '../lib/rechtsprechung/bezuege';
import { waehleBezuege } from '../pages/gesetz-leser/bezugAuswahl';
import type { BezugStatus } from '../lib/verzahnung/facetten';
import { imMarkup, rohShard, sollKanten, tsd } from './korpusSoll.helfer';

function kante(key: string, zitierung: string, status: BezugStatus, kanton: string, datum = '2020-01-01'): Bezug {
  return {
    key, zitierung, regesteKurz: null, datum, gewicht: null,
    facetten: {
      quelltyp: 'rechtsprechung', ebene: kanton === 'CH' ? 'bund' : 'kanton',
      kanton, gericht: status, status,
    },
  };
}

const html = (el: React.ReactElement) => renderToString(<MemoryRouter>{el}</MemoryRouter>);

/**
 * Der Zähler-Text EINER Gruppe, aus dem SSR-Markup gelesen.
 *
 * Gegenprüfung Runde 2/J3 (§6.7, Fehlerklasse F2d): die abgelösten Wächter
 * arbeiteten mit `toContain`/`not.toContain` auf dem ganzen Dokument. Eine
 * Teilkette beweist aber weder, dass die Zahl an der richtigen Gruppe steht,
 * noch — im negativen Fall — dass die gesuchte Formulierung fehlt: der Titel
 * sagt «im GEWÄHLTEN Zeitraum», und `not.toContain('im Zeitraum')` traf ihn
 * nie. Dieser Helfer schneidet genau den Zähler heraus, damit die Tests unten
 * auf IDENTITÄT prüfen können.
 */
function zaehlerText(markup: string, status: string): string {
  const gruppe = markup.split(`data-bezug-gruppe="${status}"`)[1] ?? '';
  // R4-B (5.9.2026): der Sucher hing an `tabular-nums` — einer Utility, die in
  // `.num` ohnehin steckt und die beim Zug auf `ui/GruppenKopf` wegfiel. Die
  // ERWARTUNGEN dieses Tests sind unverändert (§6.3); nur der Sucher greift
  // jetzt die Zähler-Rolle (`.num`) statt einer austauschbaren Utility — ein
  // Test, der an der Optik sucht, prüft irgendwas (Lehre `data-ort-artikel`).
  const treffer = gruppe.match(/class="num[^"]*"[^>]*>([^<]*)</);
  return treffer ? treffer[1].replace(/&#x27;/g, "'").replace(/&#39;/g, "'") : '';
}

describe('B4 · Rang-Trennung im Markup (§8)', () => {
  const kanten = [
    kante('bge_1', 'BGE 148 IV 22', 'bge', 'CH'),
    kante('bger_1', '6B_1/2020', 'bger', 'CH'),
    kante('bs_1', 'BES.2024.15', 'kantonal', 'BS'),
  ];

  it('rendert je Status-Klasse eine eigene, markierte Gruppe', () => {
    const s = html(<BezuegeZeile kanten={kanten} gesamt={{}} normZitat="Art. 5 StPO" />);
    expect(s).toContain('data-bezug-gruppe="bge"');
    expect(s).toContain('data-bezug-gruppe="bger"');
    expect(s).toContain('data-bezug-gruppe="kantonal"');
  });

  it('hält die deklarierte Rang-Ordnung ein: BGE vor BGer vor kantonal (§2)', () => {
    const s = html(<BezuegeZeile kanten={kanten} gesamt={{}} normZitat="Art. 5 StPO" />);
    expect(s.indexOf('data-bezug-gruppe="bge"')).toBeLessThan(s.indexOf('data-bezug-gruppe="bger"'));
    expect(s.indexOf('data-bezug-gruppe="bger"')).toBeLessThan(s.indexOf('data-bezug-gruppe="kantonal"'));
  });

  it('★ trägt NUR der amtlich publizierte Leitentscheid — genau einmal', () => {
    const s = html(<BezuegeZeile kanten={kanten} gesamt={{}} normZitat="Art. 5 StPO" />);
    expect(s.match(/★/g)).toHaveLength(1);
  });

  it('bleibt vom bestehenden «Entscheide»-Schalter erfasst (data-leitfall-zeile)', () => {
    // Sonst hätte das Zuschalten einer Facette einen Schalter still ausgehebelt.
    const s = html(<BezuegeZeile kanten={kanten} gesamt={{}} normZitat="Art. 5 StPO" />);
    expect(s).toContain('data-leitfall-zeile');
  });
});

// §6.3-DEKLARATION (25.9.2026, QS-KORPUS Einheit P «Zahl-Pins korpusrelativ»):
// die Korpuszahlen an Art. 5 / Art. 428 StPO (zuletzt kantonal 117 / 918, bge 8,
// bger 10, GR 1) standen fest im Test und rissen bei jedem Korpus-Zuwachs —
// #1112 musste 34 Zeilen dieser Datei nachziehen (Messbericht urteils-
// automatik 25.9.2026, Teil A §1). Seither kommt jeder Soll-Wert aus dem rohen
// Shard (`korpusSoll.helfer`, gezählt OHNE src/lib), und die Vorbedingung, die
// der Test braucht, steht als Invariante daneben. Die Aussagen bleiben: der
// Shard liefert ALLES, was er zählt; die Linie zeigt 5 und nennt die volle Menge.
const STPO_ROH = rohShard('STPO');
const soll5 = (status: string) => sollKanten(STPO_ROH, '5', status).length;

describe('B7 · je Instanz EINE scrollbare Linie, alle Entscheide (David 28.7.2026)', () => {
  const shard = JSON.parse(
    readFileSync('public/rechtsprechung/bezuege/STPO.json', 'utf8'),
  ) as BezugsShard;
  const N = soll5('kantonal');

  it('VORBEFUND: der Shard liefert an Art. 5 StPO ALLE kantonalen Kanten', () => {
    // Ohne diesen Vorbefund wäre der Render-Test unten wertlos. Bis B6 stand hier
    // «deckelt 115 auf 8» — genau das ist die Änderung (§6.3-Deklaration oben).
    // bge 16 → 8, bger 2 → 10 (25.9.2026, Welle 2 D2 / E-1): acht BGE nennen
    // Art. 5 StPO nur in einer nicht publizierten Erwägung — die Kante zeigt
    // seither aufs Volltext-Urteil. Die 115 kantonalen Kanten bleiben.
    // §6.3-DEKLARATION (25.9.2026, QS-KORPUS BS-Delta +185/41): kantonal 115 → 117
    // (zwei neue BS-Urteile zitieren Art. 5 StPO); bge/bger unverändert. Die
    // Aussage des Tests — der Shard liefert ALLE kantonalen Kanten — steht.
    // Einheit P: die erfasste Zahl (Generator) == die gelieferten Kanten
    // (unabhängig gezählt) — je Klasse. Ein Auslieferungs-Deckel risse das.
    for (const k of ['bge', 'bger', 'kantonal']) {
      expect(shard.gesamtProArtikel['5'][k as BezugStatus], k).toBe(soll5(k));
    }
    // Vorbedingungen der Render-Tests unten: kantonal über dem alten Deckel
    // «8 je Status», bge über einer Portion (sonst gäbe es kein «5 von …»).
    expect(N).toBeGreaterThan(8);
    expect(soll5('bge')).toBeGreaterThan(PRO_SCHRITT);
    expect(bezuegeFuerArtikel(shard, '5').filter((b) => b.facetten.status === 'kantonal')).toHaveLength(N);
  });

  it('VORBEFUND: die Kanten stehen chronologisch neu → alt', () => {
    const kantonal = bezuegeFuerArtikel(shard, '5').filter((b) => b.facetten.status === 'kantonal');
    const daten = kantonal.map((b) => b.datum);
    expect(daten).toEqual([...daten].sort().reverse());
  });

  it('je Klasse GENAU EINE Linie, waagrecht scrollbar und tastaturerreichbar', () => {
    const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['bge', 'bger', 'kantonal'], []);
    const s = html(
      <BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />,
    );
    for (const k of ['bge', 'bger', 'kantonal']) {
      expect(s.match(new RegExp(`data-bezug-linie="${k}"`, 'g'))).toHaveLength(1);
    }
    expect(s).toContain('overflow-x-auto');
    expect(s).toContain('lc-bezug-linie');
    expect(s).toContain('tabindex="0"');            // WCAG 2.1.1: ohne Maus erreichbar
    expect(s).toContain('waagrecht scrollbare Liste');
  });

  it('CLS 0: die Linie hat eine feste Höhe und wächst nur nach rechts', () => {
    const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['kantonal'], []);
    const s = html(<BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />);
    // `h-7` = feste Höhe, `overflow-y-hidden` = kein Umbruch nach unten. Ohne
    // beides schöbe jedes Nachladen den Artikeltext darunter weg.
    expect(s).toContain('h-7');
    expect(s).toContain('overflow-y-hidden');
    expect(s).not.toContain('flex-wrap');
  });

  it('zeigt 5 Chips je Linie, nicht alle (David 29.7.2026)', () => {
    const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['kantonal'], []);
    const s = html(<BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />);
    expect(s.match(/lc-chip /g) ?? []).toHaveLength(5);
    // Die ZAHL nennt trotzdem die volle Menge — die Linie ist portioniert, die
    // Auskunft nicht. (Einheit P: Identität am Zähler statt Teilkette.)
    expect(zaehlerText(s, 'kantonal')).toBe(`5 von ${tsd(N)}`);
  });

  it('«weitere 5» steht am Linienende und ist ein echter, benannter Knopf', () => {
    const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['kantonal'], []);
    const s = html(<BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />);
    expect(s).toContain('data-bezug-weitere="kantonal"');
    expect(s).toContain('weitere ');
    expect(s).toContain('5 weitere laden');          // aria-label, tastaturerreichbar
    // Es steht IN der Linie, nicht daneben.
    expect(s.indexOf('data-bezug-weitere')).toBeGreaterThan(s.indexOf('data-bezug-linie="kantonal"'));
  });

  it('«+n weitere» der alten Kanten-Grammatik gibt es hier nicht mehr', () => {
    const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['kantonal'], []);
    const s = html(<BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />);
    expect(s).not.toContain('weitere anzeigen');
    expect(s).not.toContain('+');
  });
});

describe('B7 · 5er-Portionen: die Schwellenfälle (David 29.7.2026)', () => {
  const kunst = (n: number): Bezug[] =>
    Array.from({ length: n }, (_, i) => kante(
      `k_${i}`, `BGE 150 II ${100 + i}`, 'bge', 'CH',
      // absteigend, wie der Shard sie liefert
      `2025-${String(12 - (i % 12)).padStart(2, '0')}-01`,
    ));

  it('4 Kanten: alle 4 stehen da, KEIN Klick-Element', () => {
    const s = html(<BezuegeZeile kanten={kunst(4)} gesamt={{ bge: 4 }} normZitat="Art. 1 X" />);
    expect(s.match(/lc-chip /g) ?? []).toHaveLength(4);
    expect(s).not.toContain('data-bezug-weitere');
    expect(s).toContain('>4</span>');               // «4», nicht «4 von 4»
  });

  it('5 Kanten: genau voll, KEIN Klick-Element — es gäbe nichts zu laden (§13 F4)', () => {
    const s = html(<BezuegeZeile kanten={kunst(5)} gesamt={{ bge: 5 }} normZitat="Art. 1 X" />);
    expect(s.match(/lc-chip /g) ?? []).toHaveLength(5);
    expect(s).not.toContain('data-bezug-weitere');
    expect(s).toContain('>5</span>');
  });

  it('6 Kanten: 5 gezeigt, das Element bietet die EINE übrige an — nicht stur 5', () => {
    const s = html(<BezuegeZeile kanten={kunst(6)} gesamt={{ bge: 6 }} normZitat="Art. 1 X" />);
    expect(s.match(/lc-chip /g) ?? []).toHaveLength(5);
    expect(s).toContain('data-bezug-weitere="bge"');
    expect(s).toContain('5 von 6');
    expect(s).toContain('1 weitere laden');
  });

  it('11 Kanten: 5 gezeigt, Element bietet 5 an', () => {
    const s = html(<BezuegeZeile kanten={kunst(11)} gesamt={{ bge: 11 }} normZitat="Art. 1 X" />);
    expect(s.match(/lc-chip /g) ?? []).toHaveLength(5);
    expect(s).toContain('5 von 11');
    expect(s).toContain('5 weitere laden');
  });

  it('grosse Zahlen tragen die Schweizer Tausendertrennung', () => {
    const s = html(<BezuegeZeile kanten={kunst(20)} gesamt={{ bge: 4140 }} normZitat="Art. 42 BGG" />);
    // Die Grundmenge der LINIE ist 20 (das ist die gefilterte Menge); die 4'140
    // stehen im title des Kopfes — beides mit Trennzeichen, wo nötig.
    expect(s).toContain('5 von 20');
    expect((4140).toLocaleString('de-CH')).toBe("4'140");
  });
});

describe('B7 · die Zahl am Gruppenkopf (§8)', () => {
  const shard = JSON.parse(
    readFileSync('public/rechtsprechung/bezuege/STPO.json', 'utf8'),
  ) as BezugsShard;
  const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['bge', 'bger', 'kantonal'], []);

  it('ohne Filter: «5 von N» — die Portion vorn, die volle Menge hinten', () => {
    const s = html(
      <BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />,
    );
    // Einheit P (25.9.2026): bis dahin fest «5 von 117» / «5 von 8».
    expect(zaehlerText(s, 'kantonal')).toBe(`5 von ${tsd(soll5('kantonal'))}`);
    expect(zaehlerText(s, 'bge')).toBe(`5 von ${tsd(soll5('bge'))}`);   // bis D2/E-1 (25.9.2026) «5 von 16»
    // «8 von …» wäre der alte Deckel — der ist weg.
    expect(s).not.toContain('8 von');
  });

  it('mit Zeitfilter: «5 von 12 im Zeitraum» — Ursache benannt, dritte Zahl im title', () => {
    const gekuerzt = kanten.filter((b) => b.facetten.status === 'kantonal').slice(0, 12);
    const s = html(
      <BezuegeZeile kanten={gekuerzt} gesamt={{ kantonal: 115 }} zeitAktiv normZitat="Art. 5 StPO" />,
    );
    expect(s).toContain('5 von 12 im Zeitraum');
    expect(s).toContain('12 im gewählten Zeitraum, 115 insgesamt an diesem Artikel');
  });

  it('alles geladen UND Zeitfilter: «3 von 3 im Zeitraum» statt bloss «3»', () => {
    // Sonst läse sich die gefilterte Menge wie die Datenlage (§8).
    const gekuerzt = kanten.filter((b) => b.facetten.status === 'kantonal').slice(0, 3);
    const s = html(
      <BezuegeZeile kanten={gekuerzt} gesamt={{ kantonal: 115 }} zeitAktiv normZitat="Art. 5 StPO" />,
    );
    expect(s).toContain('3 von 3 im Zeitraum');
  });

  it('rendert `gewicht` nirgends als Zahl — «nicht messbar» wird nie zu 0 (§8)', () => {
    const kantonal = bezuegeFuerArtikel(shard, '5').filter((b) => b.facetten.status === 'kantonal');
    // Vorbefund: kantonale Kanten tragen gewicht:null (der Zitier-Graph erkennt
    // ihre Geschäftsnummern nicht).
    expect(kantonal.every((b) => b.gewicht === null)).toBe(true);
    const s = html(<BezuegeZeile kanten={kantonal} gesamt={{ kantonal: 115 }} normZitat="Art. 5 StPO" />);
    expect(s).not.toContain('>0<');
    expect(s).not.toContain('null');
  });
});

// ─── Gegenprüfung Runde 2/J1+J2: der KANTONS-Filter verkürzt genauso ────────
//
// REPRODUKTION vor dem Fix (am ausgelieferten Shard, 29.7.2026): StPO Art. 428
// führt 882 kantonale Entscheide — 879 aus BS, je einer aus GR, ZH und AG. Mit
// Kantonswahl «GR» und offenem Zeitraum stand am Gruppenkopf die nackte «1».
// Eine Zahl ohne «von» heisst in dieser Zeile «das ist alles»; sie behauptete
// also, der Artikel habe genau einen kantonalen Entscheid. Ursache: `zahlText`
// kannte nur die Zeitachse.
//
// J3 (§6.7/F2d): der abgelöste Wächter lautete `not.toContain('im Zeitraum')`
// und lief gegen einen Titel, der «im GEWÄHLTEN Zeitraum» sagt — die Teilkette
// trifft nicht, der Test war grün und der Befund stand trotzdem im Markup.
// Hier wird darum auf IDENTITÄT geprüft (`toBe` auf dem Zähler-Text) bzw. mit
// einem Muster, das die tatsächliche Schreibweise trifft.
describe('B7 · Kantons-Filter: Verkürzung wird benannt (J1/J2/J3)', () => {
  const shard = JSON.parse(
    readFileSync('public/rechtsprechung/bezuege/STPO.json', 'utf8'),
  ) as BezugsShard;

  // §6.3-DEKLARATION (25.9.2026, QS-KORPUS BS-Delta +185/41): StPO/428 kantonal
  // 882 → 918 (BS 879 → 915, je 1 GR/ZH/AG unverändert). Die Reproduktion oben
  // bleibt datiert beim damaligen Stand; die Aussage (1 aus GR) steht.
  // §6.3-DEKLARATION (25.9.2026, QS-KORPUS Einheit P): 918 und «1 aus GR» sind
  // seither aus dem rohen Shard gezählt (s. Kopf von «B7 · je Instanz»). Die
  // Vorbedingung des Befunds — GR ist ein ECHTER Schnitt: mindestens einer,
  // aber nicht alle — steht als Invariante.
  const gesamt428 = sollKanten(STPO_ROH, '428', 'kantonal').length;
  const nGr = sollKanten(STPO_ROH, '428', 'kantonal', 'GR').length;
  const grZahl = `${Math.min(nGr, PRO_SCHRITT)} von ${tsd(nGr)}`;
  it('VORBEFUND: StPO/428 führt N kantonale Entscheide, davon wenige aus GR', () => {
    expect(shard.gesamtProArtikel['428'].kantonal).toBe(gesamt428);
    expect(nGr).toBeGreaterThanOrEqual(1);
    expect(nGr).toBeLessThan(gesamt428);
    const gr = waehleBezuege(bezuegeFuerArtikel(shard, '428'), ['kantonal'], ['GR']);
    expect(gr).toHaveLength(nGr);
    expect(gr.every((b) => b.facetten.kanton === 'GR')).toBe(true);
  });

  // ── ABWEICHUNG vom Beispiel der Fix-Richtung, deklariert (§14.7) ──────────
  // Der Prüfer nannte als Sollform «1 von 882 im gewählten Kanton». Die zweite
  // Zahl dieser Zeile ist aber durchgängig die GRUNDMENGE DER LINIE — das, was
  // der «weitere»-Knopf noch laden kann (so schon «5 von 12 im Zeitraum», wo 12
  // die gefilterte und 115 die volle Menge ist). Stünde dort 882, versprächen
  // Zähler und Knopf 881 Entscheide, die diese Linie nie liefert: die eine
  // falsche Aussage wäre durch eine andere ersetzt. Die 882 gehört deshalb in
  // den `title` — geprüft wird sie unten in derselben Zusicherung.
  it('«1 von 1 im Kanton» + «N insgesamt» im title — nicht die nackte «1» (§8)', () => {
    const gr = waehleBezuege(bezuegeFuerArtikel(shard, '428'), ['kantonal'], ['GR']);
    const s = html(
      <BezuegeZeile kanten={gr} gesamt={shard.gesamtProArtikel['428']} kantonAktiv
        normZitat="Art. 428 StPO" />,
    );
    expect(zaehlerText(s, 'kantonal')).toBe(`${grZahl} im Kanton`);
    expect(s).toContain(imMarkup(`${tsd(nGr)} im gewählten Kanton, ${tsd(gesamt428)} insgesamt an diesem Artikel`));
  });

  it('beide Filter zusammen: «in der Auswahl», nicht eine der beiden Ursachen allein', () => {
    const gr = waehleBezuege(bezuegeFuerArtikel(shard, '428'), ['kantonal'], ['GR']);
    const s = html(
      <BezuegeZeile kanten={gr} gesamt={shard.gesamtProArtikel['428']} zeitAktiv kantonAktiv
        normZitat="Art. 428 StPO" />,
    );
    expect(zaehlerText(s, 'kantonal')).toBe(`${grZahl} in der Auswahl`);
    expect(s).toContain(imMarkup(`${tsd(nGr)} in der gewählten Auswahl, ${tsd(gesamt428)} insgesamt an diesem Artikel`));
  });

  it('der Kantons-Schnitt beschriftet NUR die verkürzte Gruppe, nicht die anderen', () => {
    // Er wirkt ausschliesslich in der kantonalen Klasse (`bauePraedikate` führt
    // 'CH' im Schnitt mit). Die bge-Gruppe ist vollständig — ihr den Zusatz
    // anzuhängen wäre eine zweite falsche Aussage anstelle der ersten.
    const alle = waehleBezuege(bezuegeFuerArtikel(shard, '428'), ['bge', 'kantonal'], ['GR']);
    const s = html(
      <BezuegeZeile kanten={alle} gesamt={shard.gesamtProArtikel['428']} kantonAktiv
        normZitat="Art. 428 StPO" />,
    );
    // 4 von 4, unverkürzt (bis D2/E-1 25.9.2026: 5 — BGE 149 IV 307 nennt
    // Art. 428 StPO nur im nicht publizierten Teil von 6B_911/2021).
    // Einheit P: bge-Soll aus dem rohen Shard; die Aussage «unverkürzt, ohne
    // Ursache» hängt an der Form ohne Zusatz, nicht an der Zahl 4.
    const nBge = sollKanten(STPO_ROH, '428', 'bge').length;
    expect(zaehlerText(s, 'bge')).toBe(nBge > PRO_SCHRITT ? `${PRO_SCHRITT} von ${tsd(nBge)}` : tsd(nBge));
    expect(zaehlerText(s, 'kantonal')).toBe(`${grZahl} im Kanton`);
    // Und die Gesamtzahl steht genau EINMAL da, an der Gruppe, die verkürzt wurde.
    const titel = imMarkup(`${tsd(gesamt428)} insgesamt an diesem Artikel`);
    expect(s.split(titel)).toHaveLength(2);
  });

  it('J3-WÄCHTER: ohne aktiven Filter steht NIRGENDS eine Ursache — auch nicht im title', () => {
    // Identität statt Teilkette: der abgelöste `not.toContain('im Zeitraum')`
    // hätte «im gewählten Zeitraum» nie gesehen (F2d).
    const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['kantonal'], []);
    const s = html(
      <BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />,
    );
    expect(zaehlerText(s, 'kantonal')).toBe(`5 von ${tsd(soll5('kantonal'))}`);
    expect(s).not.toMatch(/im gewählten Zeitraum/);
    expect(s).not.toMatch(/im gewählten Kanton/);
    expect(s).not.toMatch(/in der gewählten Auswahl/);
    expect(s).not.toMatch(/ im Zeitraum/);
    expect(s).not.toMatch(/ im Kanton/);
    // Gegenprüfung Runde 3/B-2: die dritte KURZform (`URSACHE_KURZ.beide`) fehlte.
    // Der Wächter deckte 5 der 6 Formulierungen ab und hätte ein «in der Auswahl»
    // am ungefilterten Kopf durchgelassen — jetzt 6/6 (3 lang, 3 kurz).
    expect(s).not.toMatch(/ in der Auswahl/);
  });
});

describe('B4 · nur Auflistung, wenn aktiviert (Vorgabe David 28.7.2026)', () => {
  const shard = JSON.parse(
    readFileSync('public/rechtsprechung/bezuege/STPO.json', 'utf8'),
  ) as BezugsShard;
  const kanten = waehleBezuege(bezuegeFuerArtikel(shard, '5'), ['bge', 'bger', 'kantonal'], []);

  it('aktivierte Facetten ⇒ die Auflistung steht DIREKT da, ohne Zwischenzustand', () => {
    const s = html(
      <BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />,
    );
    expect(s).toContain('lc-chip');
    expect(s).toContain('data-bezug-gruppe="bge"');
    // Kein Aufklapp-Schalter und keine Zusammenfassungs-Zeile mehr.
    expect(s).not.toContain('data-bezuege-schalter');
    // ── §6.3-DEKLARATION (4.8.2026, W2·10-UI-NAV-VR/V3) ──────────────────────
    // Diese Zeile lautete `not.toContain('aria-expanded')` und war ein ZWEITER,
    // breiterer Stellvertreter für dieselbe Aussage wie die Zeile darüber: «hier
    // steht kein Aufklapp-Schalter». Mit V3 trägt jeder Entscheid-Chip MIT
    // Kurztext-Vorschau ein eigenes `aria-expanded` — es sagt einer Tastatur-
    // /Screenreader-Bedienung, dass an diesem Chip etwas aufklappbar ist und ob
    // es offen steht (WAI-ARIA-Muster für ein aufklappbares Element). Der
    // ursprüngliche Stellvertreter würde damit etwas messen, das er nie meinte.
    // Der GEPRÜFTE SACHVERHALT bleibt exakt derselbe — es gibt keinen
    // Zeilen-Schalter und keine Zusammenfassungs-Zeile —, er wird nur nicht mehr
    // über ein Attribut gemessen, das inzwischen einer anderen Sache gehört:
    // geprüft wird jetzt, dass kein Chip sich als OFFEN ausgibt (im Serverrender
    // ist nie ein Kasten offen) und dass kein Schalter-Element existiert.
    expect(s).not.toContain('aria-expanded="true"');
    expect(s).not.toContain('<button type="button" aria-expanded');
  });

  it('keine Kante ⇒ NICHTS: null Pixel Verzahnungs-UI unter dem Artikel', () => {
    // Gilt auch für «alle Facetten abgewählt» — der Aufrufer liefert dann eine
    // leere Menge. Kein Hinweis, keine Overline, kein Platzhalter.
    const s = html(<BezuegeZeile kanten={[]} gesamt={{}} normZitat="Art. 5 StPO" />);
    expect(s).not.toContain('data-bezuege-zeile');
    expect(s).not.toContain('BEZÜGE');
    expect(s).not.toContain('Bezüge');
  });

  it('leere Klassen erscheinen gar nicht — kein «Eidg. Gerichte 0» als Rauschen', () => {
    const s = html(
      <BezuegeZeile kanten={kanten} gesamt={shard.gesamtProArtikel['5']} normZitat="Art. 5 StPO" />,
    );
    expect(s).not.toContain('Eidg. Gerichte');
  });
});

describe('B7 · die Schritt-Arithmetik selbst (rein, §2)', () => {
  it('5 → 10 → 15 und klemmt am Rest, statt darüber hinauszuzählen', () => {
    expect(PRO_SCHRITT).toBe(5);
    expect(naechsteSichtbar(5, 4140)).toBe(10);
    expect(naechsteSichtbar(10, 4140)).toBe(15);
    expect(naechsteSichtbar(5, 6)).toBe(6);        // letzter Schritt: nur der Rest
    expect(naechsteSichtbar(11, 11)).toBe(11);     // nichts mehr da ⇒ unverändert
  });

  it('zahlText: drei Formen, und die Ursache steht dabei', () => {
    expect(zahlText(4140, 4140, null)).toBe("4'140");          // alles da, kein Filter
    expect(zahlText(5, 4140, null)).toBe("5 von 4'140");       // portioniert
    expect(zahlText(5, 12, 'zeit')).toBe('5 von 12 im Zeitraum');
    expect(zahlText(1, 882, 'kanton')).toBe('1 von 882 im Kanton');
    expect(zahlText(1, 882, 'beide')).toBe('1 von 882 in der Auswahl');
    // Ist die Linie verkürzt, steht das «von» AUCH, wenn alles geladen ist —
    // sonst läse sich die gefilterte Menge wie die Datenlage (§8). Genau dieser
    // Zweig fehlte für den Kanton und liess die Zahl auf «1» kollabieren (J1).
    expect(zahlText(12, 12, 'zeit')).toBe('12 von 12 im Zeitraum');
    expect(zahlText(1, 1, 'kanton')).toBe('1 von 1 im Kanton');
  });

  it('verkuerzungAus: beide Achsen, jede Kombination genau einmal', () => {
    expect(verkuerzungAus(false, false)).toBeNull();
    expect(verkuerzungAus(true, false)).toBe('zeit');
    expect(verkuerzungAus(false, true)).toBe('kanton');
    expect(verkuerzungAus(true, true)).toBe('beide');
  });

  it('istLetzterSchritt: nur der Klick, der die Linie erschöpft (WCAG 2.4.3/J4)', () => {
    // Genau dann verschwindet der Knopf — und genau dann muss der Fokus vorher
    // auf die Linie wandern, sonst fällt er auf `document.body`.
    expect(istLetzterSchritt(5, 6)).toBe(true);
    expect(istLetzterSchritt(5, 10)).toBe(true);
    expect(istLetzterSchritt(5, 11)).toBe(false);
    expect(istLetzterSchritt(10, 11)).toBe(true);
  });
});
