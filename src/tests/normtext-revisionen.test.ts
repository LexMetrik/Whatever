import { describe, it, expect } from 'vitest';
import {
  baueRevisionen, roFundstelleAusOc, fundstelle, liveLink, botschaftIndex, serialisiere,
  belegtImXml, baueOcZuRectifiesSr, MARKER_CUTOFF, type ErlassMeta,
} from '../../scripts/normtext/revisionen-generieren';
import { revisionenFuerNorm, revisionTitel, type RevisionBezug } from '../lib/normtext/revisionen';
import { istReinerDatumsChurn } from '../../scripts/normtext/churn-reset';
import type { SparqlBinding } from '../../scripts/fedlex-sparql';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ausnahmeGueltig, extrahiereHeadlineZitate, findeNichtKonsumierteAusnahmen, findeTreffendenBlock,
  formatiereBefundDetail, klassifiziereBerichtigung, type RectifiesAusnahme,
} from '../../scripts/normtext/rectifies-berichtigung';

// Paket 5 (W2·6-REV): reine Generator-Logik (dedupe/Sortierung/Determinismus/
// RO-Fundstelle/Botschafts-Join/Sammelerlass-Cross-Check/nichtKonsolidiert) + die
// Lese-Brücken-Projektion. Netz-Kette prüft die Live-Daten separat.

const OC = (s: string) => `https://fedlex.data.admin.ch/eli/oc/${s}`;
const ERLASS: ErlassMeta = { key: 'DSG', sr: '235.1' };

function bind(o: Record<string, string | undefined>): SparqlBinding {
  const b: SparqlBinding = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) b[k] = { value: v };
  return b;
}

describe('roFundstelleAusOc', () => {
  it('leitet die moderne AS-Fundstelle aus der oc-URI ab', () => {
    expect(roFundstelleAusOc(OC('2022/491'))).toBe('AS 2022 491');
  });
  it('behandelt die Alt-AS-Band-Nummerierung (vor 1948)', () => {
    expect(roFundstelleAusOc(OC('63/837_843_843'))).toBe('AS 63 837');
  });
  it('gibt undefined bei unerwarteter URI', () => {
    expect(roFundstelleAusOc('https://example.org/foo')).toBeUndefined();
  });
});

describe('fundstelle — massgebliche AS-Fundstelle (§7, gelesen statt fabriziert)', () => {
  it('nimmt bei Einzel-Segment-ELI die historicalId-Seite (digitale AS vor 2019, Sequenz ≠ Seite)', () => {
    // Regressionsanker Gegenprüfung 11.7.2026: oc/2005/566 ⇒ real AS 2005 4395 (NICHT «AS 2005 566»).
    expect(fundstelle(OC('2005/566'), 'RO 2005 4395')).toBe('AS 2005 4395');
    expect(fundstelle(OC('2014/245'), 'RO 2014 1119')).toBe('AS 2014 1119');
  });
  it('bevorzugt bei Multi-Segment-ELI die DE-Ableitung (erstes Segment), nicht die FR-historicalId', () => {
    expect(fundstelle(OC('1973/348_347_349'), 'RO 1973 347')).toBe('AS 1973 348');
  });
  it('leitet ohne historicalId ab (Einzel-Segment seit der AS-Reform 2019: Sequenz == Seite)', () => {
    expect(fundstelle(OC('2024/487'))).toBe('AS 2024 487');
  });
  it('nimmt unerwartetes historicalId-Format verbatim (nie fabrizieren)', () => {
    expect(fundstelle(OC('2005/1'), 'BS 8 123')).toBe('BS 8 123');
    expect(fundstelle(OC('2005/1'), 'Sonderfall')).toBe('Sonderfall');
  });
});

describe('belegtImXml — Finding 4b (AS-Fundstelle bereits im Konsolidierungstext zitiert)', () => {
  it('erkennt eine oc-URI, deren href-Zitat NEBEN «angewendet ab» steht (FZA-Muster)', () => {
    const xml = '<authorialNote><p>… Art. 1 des Beschlusses Nr. 1/2020 …, in Kraft seit 15. Dez. 2020 und angewendet ab 1. Jan. 2021 (<ref href="https://fedlex.data.admin.ch/eli/oc/2021/12">AS <b>2021</b> 12</ref>).</p></authorialNote>';
    expect(belegtImXml(xml, OC('2021/12'))).toBe(true);
  });
  it('gibt false, wenn die oc-URI nicht vorkommt', () => {
    expect(belegtImXml('<authorialNote><p>kein Verweis hier</p></authorialNote>', OC('2024/100'))).toBe(false);
  });
  it('gibt false ausserhalb jeder <authorialNote> (kein Fussnoten-Kontext — konservativ)', () => {
    const ohneNote = '<p>… und angewendet ab 1. Jan. 2021 (<ref href="https://fedlex.data.admin.ch/eli/oc/2021/12">AS 2021 12</ref>).</p>';
    expect(belegtImXml(ohneNote, OC('2021/12'))).toBe(false);
  });
  it('gibt false bei blosser href-Nennung OHNE «angewendet ab» (KLV-Gegenbeleg: Historie-Aufzählung / Teil-Inkrafttreten)', () => {
    // Live-Gegenprobe 12.9.2026: KLV zitiert Amendment-ocs in Änderungs-Historien und bei
    // Teil-Inkrafttreten («Abs. 1 Bst. a und c in Kraft seit …, die anderen Bestimmungen
    // treten später in Kraft») — dort bleibt der Marker korrekt bestehen, obwohl die href
    // vorkommt. Kein «angewendet ab» im Dokument ⇒ kein Beleg.
    const historie = '<authorialNote><p>Fassung gemäss … vom 2. Dez. 2025 (<ref href="https://fedlex.data.admin.ch/eli/oc/2025/852">852</ref>) und Ziff. II vom 9. Juni 2026, in Kraft seit 1. Juli 2026 (<ref href="https://fedlex.data.admin.ch/eli/oc/2026/336">AS 2026 336</ref>).</p></authorialNote>';
    expect(belegtImXml(historie, OC('2025/852'))).toBe(false);
    const teilInKraft = '<authorialNote><p>Eingefügt durch Ziff. I der V des EDI vom 12. Juni 2026, Abs. 1 Bst. a und c in Kraft seit 1. Aug. 2026 (<ref href="https://fedlex.data.admin.ch/eli/oc/2026/348">AS 2026 348</ref>). Die anderen Bestimmungen treten zu einem späteren Zeitpunkt in Kraft.</p></authorialNote>';
    expect(belegtImXml(teilInKraft, OC('2026/348'))).toBe(false);
  });
  it('Sammelnote mit ZWEI Einträgen — «angewendet ab» des einen entwarnt NICHT den anderen href (§6.7-Auflage Gegenprüfung PR #820)', () => {
    // Eine EINZIGE Fussnote listet zwei Änderungserlasse auf; nur der zweite trägt
    // «angewendet ab» in seinem eigenen Segment. Ein blosses Zeichenfenster um ref A
    // würde «angewendet ab» (das zu ref B gehört) fälschlich miterfassen — die
    // Element-/Segment-Bindung (vorheriger </ref> als Grenze) darf das nicht tun.
    const sammelnote = '<authorialNote><p>Fassung gemäss Ziff. I der V vom 1. Jan. 2020 (<ref href="https://fedlex.data.admin.ch/eli/oc/2020/1">AS 2020 1</ref>) und Art. 5 des Beschlusses vom 15. Dez. 2020, in Kraft seit 15. Dez. 2020 und angewendet ab 1. Jan. 2021 (<ref href="https://fedlex.data.admin.ch/eli/oc/2021/12">AS 2021 12</ref>).</p></authorialNote>';
    expect(belegtImXml(sammelnote, OC('2020/1'))).toBe(false); // fremdes «angewendet ab» entwarnt NICHT
    expect(belegtImXml(sammelnote, OC('2021/12'))).toBe(true); // eigenes Segment trägt die Wendung
  });
});

describe('liveLink', () => {
  it('baut den DE-Live-Link auf www.fedlex', () => {
    expect(liveLink(OC('2022/491'))).toBe('https://www.fedlex.admin.ch/eli/oc/2022/491/de');
  });
});

describe('baueRevisionen — Kern-Logik', () => {
  const ocZuBotschaft = new Map([[OC('2022/491'), 'BOTSCHAFT-2017-2057']]);

  it('dedupliziert je oc auf das früheste Inkrafttreten, Sprachen kollabieren', () => {
    const bindings = [
      bind({ oc: OC('2022/491'), dateForce: '2023-09-01', dateDoc: '2020-09-25', titleDe: 'DE', titleFr: 'FR', titleIt: 'IT' }),
      bind({ oc: OC('2022/491'), dateForce: '2024-01-01' }), // späteres Teil-Inkrafttreten
    ];
    const s = baueRevisionen(ERLASS, bindings, [], '2025-01-01', ocZuBotschaft, '2026-07-10');
    const ae = s.revisionen.filter((r) => r.art === 'aenderung');
    expect(ae).toHaveLength(1);
    expect(ae[0].dateEntryInForce).toBe('2023-09-01'); // min
    expect(ae[0].titelDe).toBe('DE');
    expect(ae[0].roFundstelle).toBe('AS 2022 491');
    expect(ae[0].botschaftKey).toBe('BOTSCHAFT-2017-2057');
  });

  it('setzt nichtKonsolidiert gdw. dateEntryInForce > Korpus-Stand', () => {
    const bindings = [
      bind({ oc: OC('2026/500'), dateForce: '2026-10-01', titleDe: 'Künftig' }),
      bind({ oc: OC('2024/100'), dateForce: '2024-05-01', titleDe: 'Alt' }),
    ];
    const s = baueRevisionen(ERLASS, bindings, [], '2025-01-01', new Map(), '2026-07-10');
    const nk = s.revisionen.find((r) => r.ocUri === OC('2026/500'));
    const alt = s.revisionen.find((r) => r.ocUri === OC('2024/100'));
    expect(nk?.nichtKonsolidiert).toBe(true);
    expect(alt?.nichtKonsolidiert).toBeUndefined();
  });

  it('nichtKonsolidiert bleibt weg, wenn die oc-URI im Konsolidierungs-XML bereits zitiert ist (Finding 4b, FZA)', () => {
    // Gegenprüfung 16.8.2026: Fedlex modelliert `jolux:dateEntryInForce` bei gewissen
    // Staatsvertrags-Beschlüssen als «angewendet ab»-Datum, nicht als «in Kraft für die
    // Schweiz»-Datum. Live-Beleg FZA/AS 2021 12: Konsolidierung 2020-12-15 zitiert die
    // oc-URI bereits per <ref href> — der Marker wäre sonst falsch-positiv.
    const bindings = [
      bind({ oc: OC('2021/12'), dateForce: '2021-01-01', titleDe: 'Beschluss Nr. 1/2020' }),
      bind({ oc: OC('2024/100'), dateForce: '2024-05-01', titleDe: 'Echt künftig' }),
    ];
    const belegteOcs = new Set([OC('2021/12')]);
    const s = baueRevisionen(ERLASS, bindings, [], '2020-12-15', new Map(), '2026-07-10', belegteOcs);
    const belegt = s.revisionen.find((r) => r.ocUri === OC('2021/12'));
    const echtKuenftig = s.revisionen.find((r) => r.ocUri === OC('2024/100'));
    expect(belegt?.nichtKonsolidiert).toBeUndefined();
    expect(echtKuenftig?.nichtKonsolidiert).toBe(true); // ohne Text-Beleg bleibt die Warnung
  });

  it('erzeugt Sammelerlass-Marker für Pfad-(a)-Stände ohne (b)-Erlass, ab Cutoff', () => {
    const bindings = [bind({ oc: OC('2020/1'), dateForce: '2020-01-01', titleDe: 'Basis' })];
    // Pfad-(a)-Geltungsstände: einer deckungsgleich (2020-01-01), einer Mantelerlass (2022-06-01),
    // einer VOR dem Cutoff (1998-01-01, muss ignoriert werden).
    const aStaende = ['1998-01-01', '2020-01-01', '2022-06-01'];
    const s = baueRevisionen(ERLASS, bindings, aStaende, '2025-01-01', new Map(), '2026-07-10');
    const marker = s.revisionen.filter((r) => r.art === 'sammelerlass-marker');
    expect(marker).toHaveLength(1);
    expect(marker[0].dateEntryInForce).toBe('2022-06-01');
    expect(marker[0].ocUri).toBeUndefined();
    expect(MARKER_CUTOFF).toBe('2000-01-01');
  });

  // Finding 4b, ZWEITE STUFE (W2·18-FEHLERBUCH, Auftrag 12.9.2026): dateEntryInForce trägt
  // bei FZA/AS 2021 12 nur «angewendet ab» — «in Kraft für die Schweiz seit 15.12.2020»
  // stand bislang nur unauffällig als eigenständiger, unzusammenhängend wirkender
  // Sammelerlass-Marker in der Timeline (§8: unvollständig). Whitelist auf den EINEN
  // live verifizierten Fall (s. `IN_KRAFT_FUER_CH_WHITELIST` im Generator).
  describe('baueRevisionen — Finding 4b, zweite Stufe (dateInKraftFuerCh-Whitelist)', () => {
    // Eine ältere (b)-Änderung schiebt `aeltesterB` vor 2020-12-15 — sonst würde der
    // bestehende «Erstpublikation»-Ausschluss (§356ff. im Generator) den Pfad-(a)-Stand
    // schon VOR jeder Whitelist-Logik wegfiltern und der Test bewiese nichts (Rot-Beweis
    // an genau diesem Fixture-Fehler geführt).
    const AELTERE_BINDING = bind({ oc: OC('2019/1'), dateForce: '2019-01-01', titleDe: 'Ältere Änderung' });

    it('setzt dateInKraftFuerCh auf der FZA/AS-2021-12-aenderung und schluckt den doppelten Sammelerlass-Marker', () => {
      const bindings = [AELTERE_BINDING, bind({ oc: OC('2021/12'), dateForce: '2021-01-01', titleDe: 'Beschluss Nr. 1/2020' })];
      const aStaende = ['2020-12-15']; // Pfad-(a)-Geltungsstand — ohne die Whitelist würde er einen Marker erzeugen
      const s = baueRevisionen(ERLASS, bindings, aStaende, '2025-01-01', new Map(), '2026-07-10');
      const ae = s.revisionen.find((r) => r.ocUri === OC('2021/12'));
      expect(ae?.dateInKraftFuerCh).toBe('2020-12-15');
      expect(s.revisionen.filter((r) => r.art === 'sammelerlass-marker')).toHaveLength(0);
    });

    it('lässt dateInKraftFuerCh weg, wenn die oc-URI NICHT in der Whitelist steht (kein genereller Switch) — der Marker bleibt bestehen', () => {
      const bindings = [AELTERE_BINDING, bind({ oc: OC('2020/841'), dateForce: '2021-01-01', titleDe: 'Andere Änderung' })];
      const aStaende = ['2020-12-15']; // zeitlich benachbart, aber unbelegt — bleibt eigenständiger Marker
      const s = baueRevisionen(ERLASS, bindings, aStaende, '2025-01-01', new Map(), '2026-07-10');
      const ae = s.revisionen.find((r) => r.ocUri === OC('2020/841'));
      expect(ae?.dateInKraftFuerCh).toBeUndefined();
      expect(s.revisionen.filter((r) => r.art === 'sammelerlass-marker')).toHaveLength(1);
    });

    it('unterdrückt dateInKraftFuerCh, wenn das Whitelist-Datum NICHT früher als dateEntryInForce läge (Schutz gegen einen Whitelist-Fehler, §7)', () => {
      // dateForce liegt VOR dem Whitelist-Datum 2020-12-15 — dann wäre «in Kraft seit …
      // angewendet ab …» widersinnig; die Whitelist darf das nicht blind anwenden.
      const bindings = [bind({ oc: OC('2021/12'), dateForce: '2020-01-01', titleDe: 'Hypothetisch' })];
      const s = baueRevisionen(ERLASS, bindings, [], '2025-01-01', new Map(), '2026-07-10');
      const ae = s.revisionen.find((r) => r.ocUri === OC('2021/12'));
      expect(ae?.dateInKraftFuerCh).toBeUndefined();
    });
  });

  it('sortiert Datum absteigend und ist byte-deterministisch', () => {
    const bindings = [
      bind({ oc: OC('2019/111'), dateForce: '2019-03-01', titleDe: 'A' }),
      bind({ oc: OC('2022/491'), dateForce: '2023-09-01', titleDe: 'B' }),
    ];
    const a = serialisiere(baueRevisionen(ERLASS, bindings, [], '2025-01-01', new Map(), '2026-07-10'));
    const b = serialisiere(baueRevisionen(ERLASS, [...bindings].reverse(), [], '2025-01-01', new Map(), '2026-07-10'));
    expect(a).toBe(b); // reihenfolge-unabhängig
    const s = JSON.parse(a) as { revisionen: RevisionBezug[] };
    expect(s.revisionen.map((r) => r.dateEntryInForce)).toEqual(['2023-09-01', '2019-03-01']);
  });
});

// §8-Marker (Gegenprüfung #703, Nullprobe 12.9.2026 live gegen
// https://fedlex.data.admin.ch/sparqlendpoint, abgerufen 12.9.2026): AS 2026 448
// (eli/oc/2026/448) ist per jolux:classifiedByTaxonomyEntry unter SR 642.11 (DBG)
// klassiert; jolux:rectifies nennt eli/oc/1996/1445_1445_1445, welches unter SR 824.0
// (ZDG, nicht im Korpus) klassiert ist.
//
// FALSIFIZIERT 12.9.2026, ZWEIMAL (Gegenprüfung PR #827): (1) «ein Fedlex-interner
// Widerspruch» — widerlegt, `jolux:rectifies` ist kein Fehlerindiz. (2) Die Korrektur
// behauptete ihrerseits «erstpubliziert»/«Anhangs-Änderung» als Tatsache — auch das trägt
// das Tripel nicht: Gegenbeleg AS 2025 686 (SKV) berichtigt LAUT TEXT den eigenen Erlass
// (SR 741.013, AS 2025 644), Fedlex' `jolux:rectifies` zeigt aber FÄLSCHLICH auf
// `eli/oc/2025/648` (TAFV 2, SR 741.413) — ein belegter Fedlex-Datenfehler, keine
// Anhangs-Konstellation. Der Marker (dritte, konservative Fassung) berichtet deshalb NUR
// das Tripel selbst: Verknüpfung mit einem AS-Dokument unter Fremd-SR — ohne Interpretation.
describe('baueRevisionen — §8-Marker (Berichtigung mit rectifies-Verknüpfung zu fremder SR, Gegenprüfung #703/#827)', () => {
  const DBG: ErlassMeta = { key: 'DBG', sr: '642.11' };
  const ZIEL_OC = OC('1996/1445_1445_1445');
  const RECT_OC = OC('2026/448');

  it('markiert eine Berichtigung als berichtigung-fremdes-as-dokument und nennt Fremd-SR + Ziel-Fundstelle, wenn ihr rectifies-Ziel unter einer ANDEREN SR klassiert ist', () => {
    const bindings = [bind({ oc: RECT_OC, dateForce: '2026-09-02', titleDe: 'Berichtigung', rectifies: ZIEL_OC })];
    const rectifiesInfoProOc = new Map([[RECT_OC, { fremdeSr: '824.0', zielOc: ZIEL_OC, zielFundstelle: 'AS 1996 1445' }]]);
    const s = baueRevisionen(DBG, bindings, [], '2026-09-01', new Map(), '2026-09-12', new Set(), rectifiesInfoProOc);
    const e = s.revisionen.find((r) => r.ocUri === RECT_OC);
    expect(e?.plausibilitaet).toBe('berichtigung-fremdes-as-dokument');
    expect(e?.plausibilitaetsGrund).toMatch(/824\.0/);
    expect(e?.plausibilitaetsGrund).toMatch(/AS 1996 1445/); // Auflage f: Ziel-Fundstelle im Text
    expect(e?.plausibilitaetsGrund).not.toMatch(/[Ww]iderspr/); // nie "Widerspruch"
    expect(e?.plausibilitaetsGrund).not.toMatch(/erstpubliziert/i); // Auflage f: keine Provenienz-Behauptung
    expect(e?.plausibilitaetsGrund).not.toMatch(/Änderung bisherigen Rechts/); // Auflage f: keine Tatsachenbehauptung
  });

  it('fällt bei fehlender Ziel-Fundstelle ehrlich auf die Ziel-oc-URI zurück (§7: nie fabrizieren)', () => {
    const bindings = [bind({ oc: RECT_OC, dateForce: '2026-09-02', titleDe: 'Berichtigung', rectifies: ZIEL_OC })];
    const rectifiesInfoProOc = new Map([[RECT_OC, { fremdeSr: '824.0', zielOc: ZIEL_OC }]]); // keine zielFundstelle
    const s = baueRevisionen(DBG, bindings, [], '2026-09-01', new Map(), '2026-09-12', new Set(), rectifiesInfoProOc);
    const e = s.revisionen.find((r) => r.ocUri === RECT_OC);
    expect(e?.plausibilitaetsGrund).toContain(ZIEL_OC);
  });

  it('setzt KEINEN Marker, wenn die rectifies-SR mit der eigenen SR übereinstimmt (Regelfall: eigene Berichtigung)', () => {
    const bindings = [bind({ oc: RECT_OC, dateForce: '2026-09-02', titleDe: 'Berichtigung', rectifies: ZIEL_OC })];
    const rectifiesInfoProOc = new Map([[RECT_OC, { fremdeSr: '642.11', zielOc: ZIEL_OC }]]); // gleiche SR wie DBG
    const s = baueRevisionen(DBG, bindings, [], '2026-09-01', new Map(), '2026-09-12', new Set(), rectifiesInfoProOc);
    const e = s.revisionen.find((r) => r.ocUri === RECT_OC);
    expect(e?.plausibilitaet).toBeUndefined();
    expect(e?.plausibilitaetsGrund).toBeUndefined();
  });

  it('setzt KEINEN Marker ohne rectifies-Bindung oder ohne aufgelöste Ziel-Info (Standardfall, kein Netz)', () => {
    const bindings = [bind({ oc: OC('2024/1'), dateForce: '2024-01-01', titleDe: 'Normale Änderung' })];
    const s = baueRevisionen(DBG, bindings, [], '2023-01-01', new Map(), '2026-09-12');
    expect(s.revisionen[0].plausibilitaet).toBeUndefined();
  });

  it('lässt die sha unbetroffener Einträge unverändert (§6.7: additiv, kein globaler Diff)', () => {
    // Derselbe Eintrag OHNE Ziel-Info-Auflösung (Default-Map) muss byte-identisch bleiben zur
    // Fassung, die es vor dem Marker gab — sonst würde die Vollerhebung ALLE 226
    // unbetroffenen Sidecars unnötig anfassen (§703-Auflage).
    const bindings = [bind({ oc: RECT_OC, dateForce: '2026-09-02', titleDe: 'Berichtigung' })];
    const ohneMarker = baueRevisionen(DBG, bindings, [], '2026-09-01', new Map(), '2026-09-12');
    const mitLeererMap = baueRevisionen(DBG, bindings, [], '2026-09-01', new Map(), '2026-09-12', new Set(), new Map());
    expect(serialisiere(ohneMarker)).toBe(serialisiere(mitLeererMap));
  });
});

describe('baueOcZuRectifiesSr — reine Komposition (§703, deterministisch nach Auflage e, angereichert nach Auflage f, Gegenprüfung PR #827)', () => {
  it('bildet oc → RectifiesInfo (Fremd-SR + Ziel-Fundstelle) des rectifies-Ziels, nur wenn beide bekannt sind', () => {
    const zielOc = OC('1996/1445_1445_1445');
    const bindings = [
      bind({ oc: OC('2026/448'), rectifies: zielOc }),
      bind({ oc: OC('2024/1') }), // keine rectifies-Bindung
      bind({ oc: OC('2024/2'), rectifies: OC('unbekannt/1') }), // Ziel-Info nicht aufgelöst
    ];
    const zielInfoProOc = new Map([[zielOc, { sr: '824.0', roId: undefined }]]);
    const m = baueOcZuRectifiesSr(bindings, zielInfoProOc);
    expect(m.get(OC('2026/448'))).toEqual({ fremdeSr: '824.0', zielOc, zielFundstelle: roFundstelleAusOc(zielOc) });
    expect(m.has(OC('2024/1'))).toBe(false);
    expect(m.has(OC('2024/2'))).toBe(false);
  });

  it('wählt bei mehreren rectifies-Zielen für dasselbe oc IMMER das lexikografisch kleinste — unabhängig von der Bindungsreihenfolge', () => {
    // Auflage e (Gegenprüfung PR #827, §2): vorher «erstes gesehenes Ziel gewinnt» — abhängig
    // von der (Netz-)Reihenfolge in bBindings, also nicht deterministisch reproduzierbar.
    const oc = OC('2026/448');
    const bindingsA = [
      bind({ oc, rectifies: OC('2000/999') }),
      bind({ oc, rectifies: OC('1990/1') }),
    ];
    const bindingsB = [...bindingsA].reverse();
    const zielInfoProOc = new Map([[OC('2000/999'), { sr: '111.1' }], [OC('1990/1'), { sr: '222.2' }]]);
    const mA = baueOcZuRectifiesSr(bindingsA, zielInfoProOc);
    const mB = baueOcZuRectifiesSr(bindingsB, zielInfoProOc);
    expect(mA.get(oc)).toEqual(mB.get(oc)); // reihenfolge-unabhängig
    expect(mA.get(oc)?.fremdeSr).toBe('222.2'); // OC('1990/1') < OC('2000/999') lexikografisch
  });
});

// #703 (FAHRPLAN-OFFENE-BEFUNDE.md, Nacht 5.9.2026): der Frische-Reparatur-Arm fuhr
// `normtext:revisionen` nie — Nachzug in fedlex-frische.yml. Der Fund verlangte dazu ein
// eigenes `--nur-geaendert` im Generator gegen die 227 `abgerufen`-Bumps je Netz-Lauf (jeder
// Erlass trägt einen frischen Abrufstempel, auch ohne inhaltliche Änderung — Diff-Bläh-Faktor
// ~20). REUSE statt Duplikat (§10/§17-Gegengewicht): `normtext:churn-reset` (1.9.2026,
// QS-MONITOR-ROT Befund a2, scripts/normtext/churn-reset.ts) entfernt genau die Felder
// `erzeugt`/`abgerufen` rekursiv und erkennt eine reine Datumsänderung bereits generisch für
// JEDE Datei unter `public/normtext` — der Sidecar-Feldname ist wortgleich `abgerufen`. Ein
// zweites, generator-eigenes `--nur-geaendert` wäre dieselbe Prüfung ein zweites Mal (zwei
// Wahrheiten, §5). Diese Tests sind der geforderte Rot-Beweis für die Wiederverwendungs-
// Entscheidung: ein reiner Abrufstempel-Bump gilt als Churn (wird vom Reparatur-Arm
// zurückgesetzt, kein Diff), eine gekürzte Revisionen-Liste (die DBG-54→55-Drift-Klasse aus
// dem Fund) NIE — echte Substanz überlebt den Reset immer. Platzierung im Workflow: NACH
// `normtext:struktur`, VOR `normtext:churn-reset --pfad=public/normtext` (Wortlaut dort).
describe('normtext:revisionen × normtext:churn-reset — Rot-Beweis §703 (Wiederverwendung statt --nur-geaendert)', () => {
  const meta: ErlassMeta = { key: 'DBG', sr: '642.11' };
  const bindings = [
    bind({ oc: OC('2020/1'), dateForce: '2020-01-01', titleDe: 'Alt' }),
    bind({ oc: OC('2026/448'), dateForce: '2026-09-02', titleDe: 'Neu (AS 2026 448)' }),
  ];

  it('ein reiner abgerufen-Bump (jeder Netz-Lauf, ohne Fassungsänderung) gilt als Churn', () => {
    const alt = serialisiere(baueRevisionen(meta, bindings, [], '2026-09-02', new Map(), '2026-09-05'));
    const neu = serialisiere(baueRevisionen(meta, bindings, [], '2026-09-02', new Map(), '2026-09-12'));
    expect(alt).not.toBe(neu); // nur der abgerufen-Zeitstempel unterscheidet
    expect(istReinerDatumsChurn(alt, neu)).toBe(true);
  });

  it('eine gekürzte Revisionen-Liste (DBG-54→55-Drift-Klasse) ist NIE Churn, trotz Bump', () => {
    const alt = serialisiere(baueRevisionen(meta, bindings, [], '2026-09-02', new Map(), '2026-09-05'));
    const gekuerzt = bindings.slice(0, 1); // simuliert eine verlorene Fassung
    const neu = serialisiere(baueRevisionen(meta, gekuerzt, [], '2026-09-02', new Map(), '2026-09-12'));
    expect(istReinerDatumsChurn(alt, neu)).toBe(false);
  });

  it('byte-gleiche Eingabe ohne jede Änderung ist ebenfalls kein Churn-Fall (nichts zu tun)', () => {
    const s = serialisiere(baueRevisionen(meta, bindings, [], '2026-09-02', new Map(), '2026-09-05'));
    expect(istReinerDatumsChurn(s, s)).toBe(false);
  });
});

describe('botschaftIndex', () => {
  it('baut aus den persistierten ocUris einen ocUri→botschaftKey-Index', () => {
    const idx = botschaftIndex();
    expect(idx.size).toBeGreaterThan(0); // Paket 2 hat ocUris persistiert
  });
});

describe('revisionTitel', () => {
  const r: RevisionBezug = { art: 'aenderung', dateEntryInForce: '2023-09-01', titelDe: 'DE', titelFr: 'FR', titelIt: 'IT', quelleUrl: 'https://x' };
  it('wählt die Locale-Sprache mit DE-Fallback', () => {
    expect(revisionTitel(r, 'fr')).toBe('FR');
    expect(revisionTitel(r, 'it')).toBe('IT');
    expect(revisionTitel(r, 'de')).toBe('DE');
    expect(revisionTitel({ ...r, titelFr: undefined }, 'fr')).toBe('DE');
  });
});

describe('revisionenFuerNorm — Lese-Brücke', () => {
  it('gibt null zurück, wenn ALLE Sidecars nicht ladbar sind (Fetch-Fehler ≠ leer)', async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => ({ ok: false })) as unknown as typeof fetch;
    try {
      expect(await revisionenFuerNorm(['NICHTVORHANDEN-KEY'])).toBeNull();
    } finally { globalThis.fetch = orig; }
  });
});

// ── rectifies-Wächter (ROADMAP W2·18-FEHLERBUCH): Extraktion aus zwei gespeicherten
// Filestore-HTML-Fixtures (additiv, kein Netz). Rot-Beweis für `check:revisionen-rectifies`
// liegt in dessen eigenem Docstring (Live-Mass 12.9.2026: 14 uebereinstimmend/2 abweichend/
// 2 sammelberichtigung/7 nicht-abrufbar von 25 Kanten) — hier nur die reine Klassifikation.
// Stand 18.9.2026: 31 Kanten, 19 uebereinstimmend/2 abweichend/2 sammelberichtigung/
// 8 nicht-abrufbar (Modus auto UND netz, identisch; Gegenprüfung Opus Auflagen B1/B2 —
// Klassifikation nach Headline-Blöcken statt roher AS-Anzahl, s. `check-revisionen-rectifies.ts`).
function ladeFixture(datei: string): string {
  return readFileSync(join(__dirname, 'fixtures', datei), 'utf8');
}

describe('extrahiereHeadlineZitate + klassifiziereBerichtigung (rectifies-Wächter)', () => {
  it('SKV/oc-2025-686: Berichtigungstext nennt AS 2025 644 — rectifies-Ziel zeigt aber auf AS 2025 648 (belegter Fedlex-Datenfehler, Ausnahmeliste)', () => {
    const html = ladeFixture('rectifies-skv-oc-2025-686-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2025 644']);
    expect(zitate.sr).toEqual(['741.013']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.413', zielFundstelle: 'AS 2025 648' }))
      .toBe('abweichend');
  });

  it('ChemRRV/oc-2022-560: Berichtigungstext nennt AS 2022 162 — deckt sich mit dem rectifies-Ziel', () => {
    const html = ladeFixture('rectifies-chemrrv-oc-2022-560-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2022 162']);
    expect(zitate.sr).toEqual(['814.81']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '814.81', zielFundstelle: 'AS 2022 162' }))
      .toBe('uebereinstimmend');
  });

  // ── Angepasst 18.9.2026, Gegenprüfung Opus (Auflage B1, TEST-REGEL §6.3/§6.7):
  // die Erst-Fassung dieses Tests behauptete «sammelberichtigung, unabhängig vom Ziel» —
  // seit Auflage B2 (Klassifikation nach Headline-BLÖCKEN statt roher AS-Anzahl) ist das nur
  // noch richtig, WENN das Ziel in der Vereinigung der Blöcke liegt; liegt es NICHT darin,
  // ist das Ergebnis `abweichend` (Gegenstück-Test direkt darunter). Dies ist die deklarierte
  // fachliche Tor-Verschärfung aus B1, keine Refaktorierung (§6.7: «ein Tor, das nicht
  // scheitern kann, ist gefährlicher als keines»).
  it('zwei UNABHÄNGIGE Headline-Blöcke (VVEA-/SSV-Muster), Ziel in der Vereinigung ⇒ sammelberichtigung', () => {
    const zitate = { bloecke: [{ as: ['AS 1979 1961'], sr: '741.21' }, { as: ['AS 2007 5957'] }] };
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.21', zielFundstelle: 'AS 1979 1961' }))
      .toBe('sammelberichtigung');
  });

  it('zwei UNABHÄNGIGE Headline-Blöcke, Ziel NICHT in der Vereinigung ⇒ abweichend (Auflage B1, 18.9.2026)', () => {
    const zitate = { bloecke: [{ as: ['AS 1979 1961'], sr: '741.21' }, { as: ['AS 2007 5957'] }] };
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.21', zielFundstelle: 'AS 1999 1' }))
      .toBe('abweichend');
  });

  // ── Auflage B4 (Gegenprüfung Runde 2, 19.9.2026, TEST-REGEL §6.3/§6.7): die Erst-Fassung
  // dieses Tests fabrizierte einen Zustand, den der Parser NIE liefert (`as: []` bei
  // gesetztem `sr` — Gruppe 2 der Regex ist NICHT optional, ein Regex-Treffer trägt daher
  // IMMER mindestens eine AS-Fundstelle). Ersetzt durch eine echte Extraktion, die den
  // SR-Fallback auf dieselbe Weise auslöst wie im Betrieb (rectifies-Ziel ohne ableitbare
  // zielFundstelle, z. B. weil es auf ein `cc`-Abstract zeigt — Live-Fall VZAE/oc-2026-170).
  it('fällt ohne ableitbare zielFundstelle auf den SR-Abgleich zurück', () => {
    const zitate = extrahiereHeadlineZitate('<p>Änderung vom 1. Januar 2020 (AS 2020 1; SR 220)</p>');
    expect(zitate.bloecke).toEqual([{ as: ['AS 2020 1'], sr: '220' }]);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '220' })).toBe('uebereinstimmend');
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '221' })).toBe('abweichend');
  });

  // ── Dritte Falle, live belegt VTS/oc-2025-691 (Normen-Monitor-Lauf 35353185468,
  // 18.9.2026): DIESELBE Klammer nennt mehrere komma-getrennte AS-Nummern desselben
  // Jahrgangs («AS 2025 646, 665») — die Original-Änderung (646) UND eine vorangehende
  // Berichtigung derselben Änderung (665, selbst Genre 900, dateDocument 2025-10-30,
  // Filestore-Beleg https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/oc/
  // 2025/665/de/html/fedlex-data-admin-ch-eli-oc-2025-665-de-html.html). Ohne Fix: 0
  // Treffer (die Regex liess nach der ersten Nummer nur `;SR…` oder `)` zu). Amtlicher
  // Filestore-Beleg des Fixture-Texts: https://fedlex.data.admin.ch/filestore/fedlex.data.
  // admin.ch/eli/oc/2025/691/de/html/fedlex-data-admin-ch-eli-oc-2025-691-de-html.html
  // (Abruf 18.9.2026).
  it('VTS/oc-2025-691: eine Klammer mit ZWEI komma-getrennten AS-Nummern desselben Jahrgangs liefert beide Fundstellen', () => {
    const html = ladeFixture('rectifies-vts-oc-2025-691-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2025 646', 'AS 2025 665']);
    expect(zitate.sr).toEqual(['741.41']);
    expect(zitate.bloecke).toEqual([{ as: ['AS 2025 646', 'AS 2025 665'], sr: '741.41' }]);
    // Korrigiert 18.9.2026, Gegenprüfung Opus (Auflage B2 — der Präzedenz-Satz der
    // Erst-Fassung «exakt wie bei VVEA/oc-2023-543 und SSV/oc-2024-144» war FALSCH): VTS ist
    // EIN Headline-BLOCK mit zweiteiliger Fundstelle (eine Änderung, zweimal berichtigt),
    // nicht zwei unabhängige Änderungen wie VVEA/SSV (die je ZWEI separate Blöcke tragen).
    // Genau ein Block, Ziel (646) liegt darin ⇒ uebereinstimmend.
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.41', zielFundstelle: 'AS 2025 646' }))
      .toBe('uebereinstimmend');
  });

  it('Schlupfloch geschlossen (Auflage B1, Gegenprüfung Opus 18.9.2026, §6.7): VTS/oc-2025-691 mit einem NICHT genannten Ziel ⇒ abweichend statt fälschlich sammelberichtigung', () => {
    const html = ladeFixture('rectifies-vts-oc-2025-691-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    // Repro der Gegenprüfung: das rectifies-Ziel zeigt auf ein Dokument, dessen Fundstelle
    // der Text gar nicht nennt. Vor B1 lieferte `zitate.as.length > 1` unconditioniert
    // `sammelberichtigung` (still grün trotz echter Abweichung) — nach B1/B2 zählt, ob das
    // Ziel im (einzigen) Block liegt.
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.41', zielFundstelle: 'AS 2025 999' }))
      .toBe('abweichend');
  });

  it('Negativ-Fall: eine Klammer mit nur EINER Nummer liefert weiterhin genau eine Fundstelle (SKV/ChemRRV unverändert)', () => {
    const zitate = extrahiereHeadlineZitate(
      '<p>Änderung vom 15. Oktober 2025 (AS 2025 644; SR 741.013)</p>',
    );
    expect(zitate.as).toEqual(['AS 2025 644']);
    expect(zitate.sr).toEqual(['741.013']);
  });

  // ── Runde 2 (ROADMAP QS-MONITOR-ROT, 19.9.2026): drei weitere Parser-Lücken, live auf dem
  // #909-Datenstand reproduziert (RECTIFIES_CACHE=netz, Rot-Beweis im Bau-Bericht), KEINE davon
  // ein Fedlex-Datenfehler. Fixtures sind die vollständigen, ungekürzten Filestore-HTML
  // (Abruf 19.9.2026).
  it('KRK/oc-2026-314 (Staatsvertrags-Headline): «vom <Datum>» steht im Erlasstitel, die AS-Klammer folgt erst in einem separaten <p> ohne eigenes «vom …» — vorher 0 Treffer', () => {
    const html = ladeFixture('rectifies-krk-oc-2026-314-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2026 214']);
    expect(zitate.sr).toEqual(['0.107']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '0.107', zielFundstelle: 'AS 2026 214' }))
      .toBe('uebereinstimmend');
  });

  it('OR/oc-2023-62 (Fussnotenzeichen-Marker): «(AS 2020 4005<sup><a href="#fn-…">1</a></sup>; SR 220)» — die Fussnoten-Ziffer reisst ohne Fix die Zahl auseinander (vorher 0 Treffer)', () => {
    const html = ladeFixture('rectifies-or-oc-2023-62-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2020 4005']);
    expect(zitate.sr).toEqual(['220']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '220', zielFundstelle: 'AS 2020 4005' }))
      .toBe('uebereinstimmend');
  });

  it('VZAE/oc-2026-170 (Leerzeichen vor dem Semikolon): «(AS 2018 3173 ; SR 142.201 )» — Tag-Fragmentierung erzeugt ein Leerzeichen vor «;» (vorher 0 Treffer); Ziel ist ein cc-Abstract ohne Fundstelle ⇒ SR-Fallback', () => {
    const html = ladeFixture('rectifies-vzae-oc-2026-170-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2018 3173']);
    expect(zitate.sr).toEqual(['142.201']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '142.201' })).toBe('uebereinstimmend');
  });

  it('Footnote-leak-Nebenfalle (BPV/oc-2026-324): der Fussnoten-KÖRPER nennt beiläufig eine ANDERE «vom … (AS …)»-Stelle — ohne Abschneiden ab der ersten Fussnoten-<div> würde die geweitete Klammer-Distanz (Falle KRK) daraus einen erfundenen zweiten Block machen', () => {
    const html = ladeFixture('rectifies-bpv-oc-2026-324-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2026 309']);
    expect(zitate.bloecke).toEqual([{ as: ['AS 2026 309'], sr: '172.220.111.3' }]);
  });
});

// ── formatiereBefundDetail / findeTreffendenBlock / findeNichtKonsumierteAusnahmen
// (Gegenprüfung Runde 2, 19.9.2026, Auflagen B2/B3/B5 aus Gegenprüfung #908) ──
describe('formatiereBefundDetail — B2 (0-Treffer-Meldung) + B5 (treffender Block statt Vereinigung)', () => {
  it('0-Treffer (keine Headline erkannt): eigene Meldung «zuerst den Parser prüfen», NICHT die alte «Text nennt ∅» (Auflage B2 — genau diese Verwechslung legte am 18.9.2026 die falsche Fedlex-Fehler-Spur)', () => {
    const zitate = { as: [], sr: [], bloecke: [] };
    const detail = formatiereBefundDetail(zitate, { fremdeSr: '220', zielFundstelle: 'AS 2020 1', zielOc: 'x' }, 'abweichend');
    expect(detail).toContain('KEINE Headline erkannt (0 Treffer)');
    expect(detail).toContain('zuerst den Parser prüfen');
    expect(detail).not.toContain('Text nennt ∅');
  });

  it('sammelberichtigung: zeigt den TREFFENDEN Block statt der Vereinigungs-SR (Auflage B5) — zwei unabhängige Blöcke, nur einer trägt das Ziel', () => {
    const zitate = extrahiereHeadlineZitate(
      '<p>Änderung vom 4. Dezember 2015 (AS 2015 5699; SR 814.600)</p>'
      + '<p>Änderung vom 23. Februar 2022 (AS 2022 161; SR 814.600)</p>',
    );
    const ziel = { fremdeSr: '814.600', zielFundstelle: 'AS 2022 161' };
    const klasse = klassifiziereBerichtigung(zitate, ziel);
    expect(klasse).toBe('sammelberichtigung');
    const detail = formatiereBefundDetail(zitate, { ...ziel, zielOc: 'x' }, klasse);
    expect(detail).toContain('Treffender Block: AS 2022 161 (SR 814.600)');
    // Die andere, NICHT treffende Fundstelle bleibt als Kontext sichtbar, aber nicht als
    // „Treffer“ ausgewiesen.
    expect(detail).toContain('AS 2015 5699');
  });

  it('findeTreffendenBlock liefert undefined, wenn kein Block trifft (abweichend)', () => {
    const zitate = extrahiereHeadlineZitate('<p>Änderung vom 1. Januar 2020 (AS 2020 1; SR 220)</p>');
    expect(findeTreffendenBlock(zitate.bloecke, { fremdeSr: '221', zielFundstelle: 'AS 2020 999' })).toBeUndefined();
  });
});

describe('findeNichtKonsumierteAusnahmen — Auflage B3 (§6.7: eine Ausnahme, die nie mehr trifft, ist ein stiller Freibrief)', () => {
  const ausnahme: RectifiesAusnahme = {
    oc: 'https://fedlex.data.admin.ch/eli/oc/2025/999',
    seit: '2026-09-19',
    belegUrl: 'https://example.test/beleg',
    begruendung: 'Test',
    erwartetesZielOc: 'https://fedlex.data.admin.ch/eli/oc/2000/1',
  };
  const ausnahmen = new Map([[ausnahme.oc, ausnahme]]);

  it('meldet KEINE nicht konsumierte Ausnahme, solange ihr oc noch als abweichend auftritt', () => {
    const befunde = [{ oc: ausnahme.oc, klasse: 'abweichend' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([]);
  });

  it('zählt `stale` ebenfalls als konsumiert (die stale-Kante bekommt ihre eigene, spezifischere Rot-Meldung)', () => {
    const befunde = [{ oc: ausnahme.oc, klasse: 'stale' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([]);
  });

  it('meldet die Ausnahme als NICHT konsumiert, wenn ihr oc gar keine rectifies-Kante mehr ist', () => {
    const befunde = [{ oc: 'https://fedlex.data.admin.ch/eli/oc/2026/1', klasse: 'uebereinstimmend' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([ausnahme]);
  });

  it('meldet die Ausnahme als NICHT konsumiert, wenn ihre Kante jetzt uebereinstimmend/sammelberichtigung ist (Rot-Beweis, §6.7: die Ausnahme wäre sonst ein stiller Freibrief)', () => {
    const befunde = [{ oc: ausnahme.oc, klasse: 'sammelberichtigung' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([ausnahme]);
  });
});

// ── Stale-Schutz der Ausnahmeliste (Gegenprüfung PR #834, Auflage 3, §6.7) ──
describe('ausnahmeGueltig — eine Ausnahme gilt nur für das PAAR, das sie ursprünglich belegt hat', () => {
  const skv = {
    erwartetesZielOc: 'https://fedlex.data.admin.ch/eli/oc/2025/648',
    erwarteteZielFundstelle: 'AS 2025 648',
    erwarteteTextFundstelle: 'AS 2025 644',
  };

  it('bleibt gültig, solange Ziel-oc, Ziel-Fundstelle UND Text-Fundstelle wie belegt sind', () => {
    expect(ausnahmeGueltig(skv, {
      zielOc: skv.erwartetesZielOc, zielFundstelle: skv.erwarteteZielFundstelle, textFundstelle: skv.erwarteteTextFundstelle,
    })).toBe(true);
  });

  it('wird stale, wenn Fedlex das rectifies-Tripel auf ein DRITTES Ziel umhängt (Rot-Beweis, §6.7)', () => {
    // Verfälschter Erwartungswert simuliert genau das: das frische Ziel-oc weicht vom
    // dokumentierten ab, obwohl Fundstelle/Text unverändert blieben.
    expect(ausnahmeGueltig(skv, {
      zielOc: 'https://fedlex.data.admin.ch/eli/oc/2099/999', zielFundstelle: skv.erwarteteZielFundstelle, textFundstelle: skv.erwarteteTextFundstelle,
    })).toBe(false);
  });

  it('wird stale, wenn der amtliche Berichtigungstext eine ANDERE Fundstelle nennt als dokumentiert', () => {
    expect(ausnahmeGueltig(skv, {
      zielOc: skv.erwartetesZielOc, zielFundstelle: skv.erwarteteZielFundstelle, textFundstelle: 'AS 2030 1',
    })).toBe(false);
  });

  it('wird stale, wenn Fedlex die abgeleitete Ziel-Fundstelle selbst korrigiert', () => {
    expect(ausnahmeGueltig(skv, {
      zielOc: skv.erwartetesZielOc, zielFundstelle: 'AS 2025 649', textFundstelle: skv.erwarteteTextFundstelle,
    })).toBe(false);
  });
});
