import { describe, it, expect } from 'vitest';
import {
  baueRevisionen, roFundstelleAusOc, fundstelle, liveLink, botschaftIndex, serialisiere,
  belegtImXml, baueOcZuRectifiesSr, MARKER_CUTOFF, fassungsUrl, ocWurzel, wirkungAusTyp,
  inkrafttretenDerAuswirkung, REICHWEITE, type ErlassMeta, type RevisionsKontext,
} from '../../scripts/normtext/revisionen-generieren';
import { revisionenFuerNorm, revisionSchluessel, revisionTitel, type RevisionBezug } from '../lib/normtext/revisionen';
import { istReinerDatumsChurn } from '../../scripts/normtext/churn-reset';
import type { SparqlBinding } from '../../scripts/fedlex-sparql';

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
    // S6-D1 (AE-2, 23.9.2026): ein Marker braucht das Abstract für einen gültigen Link — bis
    // 22.9.2026 verlinkte er `/eli/cc/<SR>` (Fedlex «page-not-found»).
    const kontext = { abstractEli: 'cc/2022/491', auswirkungen: [], ocStamm: {} };
    const s = baueRevisionen(ERLASS, bindings, aStaende, '2025-01-01', new Map(), '2026-07-10', new Set(), new Map(), kontext);
    const marker = s.revisionen.filter((r) => r.art === 'sammelerlass-marker');
    expect(marker).toHaveLength(1);
    expect(marker[0].dateEntryInForce).toBe('2022-06-01');
    expect(marker[0].ocUri).toBeUndefined();
    expect(marker[0].quelleUrl).toBe('https://www.fedlex.admin.ch/eli/cc/2022/491/20220601/de');
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
      // S6-D1 (AE-2): der Marker braucht das Abstract für seinen Fassungs-Link.
      const kontext = { abstractEli: 'cc/2002/243', auswirkungen: [], ocStamm: {} };
      const s = baueRevisionen(ERLASS, bindings, aStaende, '2025-01-01', new Map(), '2026-07-10', new Set(), new Map(), kontext);
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


// ── S6-D1 (W2·29-WERKBANK-LESER, 23.9.2026): Pfad (c) Rechtsanalyse «Auswirkungen» ──────
// Fixtures nach live erhobenen Fällen (Fedlex-SPARQL 23.9.2026): ZPO ← GestG AS 2000 2355
// (Vorgänger gleicher SR, AE-3), OR ← AS 2022 732 (Sammelerlass, AE-4), OR ← AS 2020 4005
// (Aktienrecht, Etappen 2021-01-01/2023-01-01, AE-5), Marker-Link (AE-2), GebV-HReg
// (einziger Stand = Inkrafttreten), ZPO ← AS 2010 281 (Beschluss- statt Inkrafttretensdatum).
describe('baueRevisionen — Pfad (c) Auswirkungen (S6-D1, AE-2..AE-5)', () => {
  const ZPO: ErlassMeta = { key: 'ZPO', sr: '272' };
  const OR: ErlassMeta = { key: 'OR', sr: '220' };
  const kontextZpo: RevisionsKontext = {
    abstractEli: 'cc/2010/262', basicAct: OC('2010/262'), inkrafttreten: '2011-01-01',
    auswirkungen: [], ocStamm: {},
  };

  it('AE-3: nimmt weder Vorgänger-Erlasse gleicher SR noch den Stammerlass auf', () => {
    const bindings = [
      bind({ oc: OC('2000/2355'), dateForce: '2001-01-01', titleDe: 'GestG' }), // Vorgänger
      bind({ oc: OC('2010/262'), dateForce: '2011-01-01', titleDe: 'ZPO' }), // Stammerlass
      bind({ oc: OC('2024/100'), dateForce: '2025-01-01', titleDe: 'ZPO-Änderung' }),
    ];
    const s = baueRevisionen(ZPO, bindings, [], '2026-07-01', new Map(), '2026-09-23', new Set(), new Map(), kontextZpo);
    expect(s.revisionen.map((r) => r.ocUri)).toEqual([OC('2024/100')]);
  });

  it('AE-3/AE-6: schliesst Pfad-(b)-Erlasse nach der Aufhebung des Abstracts aus (Nachfolger gleicher SR)', () => {
    const bindings = [
      bind({ oc: OC('2025/408'), dateForce: '2026-03-01', titleDe: 'Aufhebend' }),
      bind({ oc: OC('2026/9'), dateForce: '2026-07-01', titleDe: 'Änderung der Nachfolgerin' }),
    ];
    const k: RevisionsKontext = { abstractEli: 'cc/2009/423', basicAct: OC('2009/423'), inkrafttreten: '2009-08-01', aufhebung: '2026-03-01', auswirkungen: [], ocStamm: {} };
    const s = baueRevisionen({ key: 'BMV', sr: '412.103.1' }, bindings, [], '2016-08-23', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen.map((r) => r.ocUri)).toEqual([OC('2025/408')]);
  });

  it('AE-4: Sammelerlass anderer SR wird eigener Eintrag mit Titel und Fundstelle, auch am Tag eines eigenen Erlasses', () => {
    const bindings = [bind({ oc: OC('2022/109'), dateForce: '2023-01-01', titleDe: 'Inkraftsetzung' })];
    const k: RevisionsKontext = {
      abstractEli: 'cc/27/317_321_377', basicAct: OC('27/317_321_377'), inkrafttreten: '1912-01-01',
      auswirkungen: [
        { oc: OC('2022/109'), typ: 5, datum: '2023-01-01' },
        { oc: OC('2022/732'), typ: 1, datum: '2023-01-01' },
      ],
      ocStamm: { [OC('2022/732')]: { dateForce: '2023-01-01', dateDoc: '2022-06-17', titelDe: 'Bankengesetz (Sammelerlass)' } },
    };
    const s = baueRevisionen(OR, bindings, ['2023-01-01'], '2026-01-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    const sammel = s.revisionen.find((r) => r.ocUri === OC('2022/732'));
    expect(sammel?.art).toBe('aenderung');
    expect(sammel?.roFundstelle).toBe('AS 2022 732');
    expect(sammel?.titelDe).toBe('Bankengesetz (Sammelerlass)');
    expect(sammel?.wirkungen).toEqual(['aenderung']);
    expect(s.revisionen.find((r) => r.ocUri === OC('2022/109'))?.wirkungen).toEqual(['inkrafttreten']);
    expect(s.revisionen.filter((r) => r.art === 'sammelerlass-marker')).toHaveLength(0);
  });

  it('AE-5: gestaffeltes Inkrafttreten = je Etappe ein Eintrag desselben Erlasses, nichtKonsolidiert je Etappe', () => {
    const bindings = [bind({ oc: OC('2020/746'), dateForce: '2021-01-01', titleDe: 'Obligationenrecht (Aktienrecht)' })];
    const k: RevisionsKontext = {
      abstractEli: 'cc/27/317_321_377', basicAct: OC('27/317_321_377'), inkrafttreten: '1912-01-01',
      auswirkungen: [
        { oc: OC('2020/746'), typ: 1, datum: '2021-01-01' },
        { oc: OC('2020/746'), typ: 1, datum: '2023-01-01' },
        { oc: OC('2020/746'), typ: 2, datum: '2023-01-01' },
      ],
      ocStamm: {},
    };
    const s = baueRevisionen(OR, bindings, ['2021-01-01', '2023-01-01'], '2022-01-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen.map((r) => [r.dateEntryInForce, r.ocUri, r.wirkungen])).toEqual([
      ['2023-01-01', OC('2020/746'), ['aenderung', 'aufhebung']],
      ['2021-01-01', OC('2020/746'), ['aenderung']],
    ]);
    for (const r of s.revisionen) expect(r.etappen).toEqual(['2021-01-01', '2023-01-01']);
    expect(s.revisionen[0].nichtKonsolidiert).toBe(true); // 2023 > Korpus-Stand 2022
    expect(s.revisionen[1].nichtKonsolidiert).toBeUndefined();
    expect(s.revisionen.filter((r) => r.art === 'sammelerlass-marker')).toHaveLength(0); // kein «Sammelerlass» mehr
    // Lese-Brücke: beide Etappen behalten unterscheidbare Schlüssel (Dedupe/React-key).
    expect(new Set(s.revisionen.map((r) => revisionSchluessel(r))).size).toBe(2);
  });

  it('AE-2: Marker verlinkt die Fassung seines Datums, nie /eli/cc/<SR>; ohne Abstract Abbruch statt totem Link', () => {
    const k: RevisionsKontext = { abstractEli: 'cc/27/317_321_377', inkrafttreten: '1912-01-01', auswirkungen: [], ocStamm: {} };
    const bindings = [bind({ oc: OC('2020/1'), dateForce: '2020-01-01' })];
    const s = baueRevisionen(OR, bindings, ['2021-05-01'], '2026-01-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    const marker = s.revisionen.filter((r) => r.art === 'sammelerlass-marker');
    expect(marker.map((r) => r.quelleUrl)).toEqual(['https://www.fedlex.admin.ch/eli/cc/27/317_321_377/20210501/de']);
    expect(marker[0].quelleUrl.endsWith('/eli/cc/220')).toBe(false);
    expect(() => baueRevisionen(OR, bindings, ['2021-05-01'], '2026-01-01', new Map(), '2026-09-23')).toThrow(/Abstract-ELI/);
    expect(fassungsUrl('cc/2010/262', '2026-07-01')).toBe('https://www.fedlex.admin.ch/eli/cc/2010/262/20260701/de');
    expect(() => fassungsUrl('220', '2026-07-01')).toThrow();
  });

  it('die Fassung zum Inkrafttreten ist Erstpublikation, kein Marker (GebV-HReg 2021-01-01)', () => {
    const k: RevisionsKontext = { abstractEli: 'cc/2020/180', basicAct: OC('2020/180'), inkrafttreten: '2021-01-01', auswirkungen: [], ocStamm: {} };
    const bindings = [bind({ oc: OC('2020/180'), dateForce: '2021-01-01' })];
    const s = baueRevisionen({ key: 'GEBV_HREG', sr: '221.411.1' }, bindings, ['2021-01-01'], '2021-01-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen).toEqual([]);
  });

  it('Beschluss- statt Inkrafttretensdatum: nur korrigiert, wenn am Datum keine Fassung besteht', () => {
    const oc = { dateForce: '2010-02-01', dateDoc: '2009-09-25' };
    expect(inkrafttretenDerAuswirkung('2009-09-25', oc)).toBe('2010-02-01'); // ZPO ← AS 2010 281
    expect(inkrafttretenDerAuswirkung('2009-09-25', oc, new Set(['2009-09-25']))).toBe('2009-09-25'); // Fassung belegt das Datum
    expect(inkrafttretenDerAuswirkung('2021-01-01', { dateForce: '2021-03-20', dateDoc: '2021-03-19' })).toBe('2021-01-01'); // rückwirkend, bleibt
    expect(inkrafttretenDerAuswirkung('2023-01-01', undefined)).toBe('2023-01-01');
  });

  it('undatierte Auswirkung zählt nur ohne datierte und nur mit amtlichem Eigen-Datum', () => {
    const k: RevisionsKontext = {
      abstractEli: 'cc/2011/505', basicAct: OC('2011/505'), inkrafttreten: '2012-01-01',
      auswirkungen: [
        { oc: OC('2011/598'), typ: 6 }, // undatiert, kein Eigen-Datum → kein Eintrag
        { oc: OC('2022/698'), typ: 1 }, // undatiert, Eigen-Datum aus ocStamm
        { oc: OC('2011/505'), typ: 5, datum: '2012-01-01' }, // Stammerlass → nie
      ],
      ocStamm: { [OC('2022/698')]: { dateForce: '2023-01-23' } },
    };
    const s = baueRevisionen({ key: 'ADOV', sr: '211.221.36' }, [], [], '2023-01-23', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen.map((r) => [r.ocUri, r.dateEntryInForce])).toEqual([[OC('2022/698'), '2023-01-23']]);
  });

  it('Auswirkungsdatum NACH der einarbeitenden Fassung erzeugt keine Etappe (AVIG/AS 1991 2125 «2023», AHVG/AS 1965 537 «2066»)', () => {
    const k: RevisionsKontext = {
      abstractEli: 'cc/63/837_843_843', basicAct: OC('63/837_843_843'), inkrafttreten: '1948-01-01',
      auswirkungen: [
        { oc: OC('1965/537_541_535'), typ: 1, datum: '1966-01-01', fassung: '1966-01-01' },
        { oc: OC('1965/537_541_535'), typ: 2, datum: '2066-01-01', fassung: '2021-01-01' }, // Widerspruch
        { oc: OC('2020/713'), typ: 1, datum: '2020-09-26', fassung: '2021-03-20' }, // Fassung danach: bleibt (Nachkonsolidierung/rückwirkend)
        { oc: OC('2099/1'), typ: 1, datum: '2030-01-01', fassung: '2021-01-01' }, // nur widersprüchlich datiert → Eigen-Datum
      ],
      ocStamm: { [OC('2099/1')]: { dateForce: '2029-01-01' } },
    };
    // Fedlex führt für AHVG tatsächlich eine Fassung 2066-01-01 — sie darf nicht als Marker
    // «tritt am 01.01.2066 in Kraft» erscheinen (Artefakt-Datum, s. Generator).
    const s = baueRevisionen({ key: 'AHVG', sr: '831.10' }, [], ['1966-01-01', '2066-01-01'], '2026-01-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen.filter((r) => r.art === 'sammelerlass-marker')).toEqual([]);
    expect(s.revisionen.map((r) => [r.ocUri, r.dateEntryInForce, r.etappen])).toEqual([
      [OC('2099/1'), '2029-01-01', undefined],
      [OC('2020/713'), '2020-09-26', undefined],
      [OC('1965/537_541_535'), '1966-01-01', undefined],
    ]);
  });

  it('§8 datumAusErlass: markiert Daten, die nicht aus einer eigenen Auswirkung stammen (ZPO ← FINIG AS 2018 5247)', () => {
    const k: RevisionsKontext = {
      abstractEli: 'cc/2010/262', basicAct: OC('2010/262'), inkrafttreten: '2011-01-01',
      auswirkungen: [
        { oc: OC('2018/801'), typ: 1, datum: '2018-06-15', fassung: '2021-01-01' }, // Beschlussdatum
        { oc: OC('2024/1'), typ: 1, datum: '2025-01-01', fassung: '2025-01-01' }, // echt
      ],
      ocStamm: { [OC('2018/801')]: { dateForce: '2019-01-01', dateDoc: '2018-06-15' }, [OC('2024/1')]: { dateForce: '2025-01-01' } },
    };
    const bindings = [bind({ oc: OC('2023/5'), dateForce: '2023-07-01', titleDe: 'nur Pfad (b)' })];
    const s = baueRevisionen(ZPO, bindings, [], '2026-07-01', new Map(), '2026-09-23', new Set(), new Map(), k);
    expect(s.revisionen.map((r) => [r.ocUri, r.dateEntryInForce, r.datumAusErlass])).toEqual([
      [OC('2024/1'), '2025-01-01', undefined],
      [OC('2023/5'), '2023-07-01', true],
      [OC('2018/801'), '2019-01-01', true],
    ]);
  });

  it('unbekannter Auswirkungs-Typ bricht ab (nie still einsortieren)', () => {
    expect(wirkungAusTyp(1)).toBe('aenderung');
    expect(() => wirkungAusTyp(99)).toThrow(/impact-type.99/);
  });

  it('ocWurzel: oc-Teil-URI → oc-Erlass; alles ausserhalb eli/oc → undefined', () => {
    expect(ocWurzel('https://fedlex.data.admin.ch/eli/oc/2020/746/lvl_I')).toBe(OC('2020/746'));
    expect(ocWurzel('https://fedlex.data.admin.ch/eli/oc/2021/846/lvl_I%2C+III/lvl_1')).toBe(OC('2021/846'));
    expect(ocWurzel('https://fedlex.data.admin.ch/eli/cc/27/317_321_377/art_1')).toBeUndefined();
  });

  it('AE-4: der Reichweiten-Satz behauptet keine Marker-Kennzeichnung der Sammelerlasse mehr', () => {
    expect(REICHWEITE).not.toMatch(/Sammelerlasse anderer SR sind als Marker/);
    expect(REICHWEITE).toMatch(/Sammel- und Mantelerlasse/);
  });
});
