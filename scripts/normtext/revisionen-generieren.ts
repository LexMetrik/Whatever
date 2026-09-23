/**
 * Paket 5 (FAHRPLAN-FEDLEX-PORTFOLIO §Paket 5, W2·6-REV): generiert je Bund-Volltext-
 * Erlass eine «Änderungen / Revisionen»-Timeline — welche AS/RO-Änderungserlasse
 * (`eli/oc`) haben das Gesetz wann geändert. Ausgabe: ein Sidecar je Erlass unter
 * public/normtext/revisionen/<KEY>.json (lazy vom Reader geladen, kein Monolith).
 *
 * ── ÜBERGANGSLÖSUNG (Fundament-Plan §4.4/§7, David 3.7.2026, VERBINDLICH) ──
 * Der File-Sidecar ist eine Übergangslösung. Zielsenke ist ab E1 die Tabelle
 * `erlass_fassungen` (FAHRPLAN-DATENHALTUNG §3; §5 «nie zwei Wahrheiten»). Wird
 * Paket 5 VOR E1 gebaut, bleibt der Sidecar zulässig; ab E1 schreibt der Writer in
 * `erlass_fassungen`, der Sidecar wird dann Projektion. Fundstellen-Rohstoff
 * (`jolux:dateEntryInForce`, AS-Fundstelle) ist deckungsgleich.
 *
 * ── Quelle (POC 10.7.2026 live an DSG SR 235.1 + korpusweit verifiziert) ──
 * Pfad (b) — Änderungs-Erlasse über die SR-Taxonomie (der verlässliche, dubletten-
 * freie Lieferant der «wann wurde was geändert»-Liste):
 *   ?tax skos:notation "<SR>"^^<…id-systematique>              # TYPISIERT (sonst Timeout)
 *   ?oc  jolux:classifiedByTaxonomyEntry ?tax ;
 *        jolux:legalResourceFamilyType <…resource-family/oc> ; # NICHT cc (consolidated)
 *        jolux:dateEntryInForce ?dateForce .
 * §0c-Fallen vermieden: kein UNION (700-statt-alle), VALUES-Batching; `resource-family/oc`
 * filtert die cc-Abstract-Dubletten heraus; Sprach-Realisierungen (isRealizedBy) kollabieren
 * über die Gruppierung nach ?oc.
 *
 * POC-Befund (Finding 6): die Spec-OPTIONALs `jolux:historicalId`/`jolux:botschaftDate`
 * (jolux-Namespace) liefern am oc-Knoten NICHTS. Die massgebliche AS-Fundstelle steht aber
 * unter dem FEDLEX-INTERNEN Prädikat `<http://cogni.internal.system/model#historicalId>`
 * («RO <jahr> <seite>»; live belegt: `oc/2005/566` → «RO 2005 4395»). Deshalb:
 *   - AS-Fundstelle = `historicalId` bei Einzel-Segment-ELI (digitale AS); sonst aus der
 *     oc-URI abgeleitet (Multi-Segment-Alt-AS = DE-Seite im ersten Segment; Einzel-Segment
 *     seit der AS-Reform 2019, wo Sequenz == Seite). Warum je Fall in `fundstelle()`.
 *     Die reine ELI-Ableitung WAR für Einzel-Segment vor 2019 falsch (Sequenz ≠ Seite) —
 *     durch `historicalId` geheilt (Gegenprüfung 11.7.2026).
 *   - Der Botschafts-Join läuft über die von Paket 2 persistierten `ocUris`
 *     (revision.ocUri ∈ botschaft.ocUris → botschaftKey), NICHT über botschaftDate.
 *
 * ── Mantel-/Sammelerlass-Lücke (strukturell, §8-Ehrlichkeit) ──
 * Pfad (b) listet nur Erlasse, die PRIMÄR unter dieser SR klassifiziert sind.
 * Änderungen über Mantel-/Sammelerlasse anderer SR erzeugen einen Geltungsstand,
 * den nur Pfad (a) (Konsolidierungs-`dateApplicability` am gepinnten Abstract) als
 * Datum sieht. Cross-Check: wo (a) einen Stand ohne passenden (b)-Erlass zeigt →
 * synthetischer «sammelerlass-marker» statt stiller Lücke.
 *
 * ── Pfad (c) Rechtsanalyse «Auswirkungen» (S6-D1, W2·29-WERKBANK-LESER, 23.9.2026) ──
 * ERGÄNZT 23.9.2026 (die Absätze oben bleiben als Stand 10.7.2026 stehen). Pfad (b)
 * allein erzeugte vier gemessene Fehlerklassen (Befunde AE-2..AE-5, Ist-Messung
 * 23.9.2026 über 231 Sidecars): (AE-3) 359 Einträge in 107 Sidecars VOR dem
 * Inkrafttreten des geltenden Erlasses — Änderungen von VORGÄNGER-Erlassen gleicher SR
 * (ZPO ← GestG AS 2000 2355) und der Stammerlass selbst; (AE-4) Sammelerlass-Änderungen
 * nur als Datums-Marker und nur, wo am selben Tag kein (b)-Erlass lag; (AE-5) gestaffelte
 * Inkrafttreten (OR 1.5.2021 = AS 2019 3161) als «Sammelerlass»; (AE-2) 1978 Marker-
 * Links auf `/eli/cc/<SR>` (Fedlex «page-not-found»).
 *
 * Die höchste strukturierte Quelle dafür ist Fedlex' eigene Rechtsanalyse (live
 * erhoben 23.9.2026): `<oc>/legal-analysis/LegalResourceImpact/<n>` mit
 *   jolux:impactFromLegalResource  <oc>/<teil>        (ändernder Erlass bzw. dessen Ziffer)
 *   jolux:impactToLegalResource    <cc-Abstract>/<teil> (Artikel/`text` DIESES Erlasses;
 *                                  jeder Teil ist `legalResourceSubdivisionIsPartOf` Abstract —
 *                                  am OR 997 Auswirkungen, Präfix-Zählung == Teil-Join)
 *   jolux:legalResourceImpactHasType  vocabulary/impact-type/<n>  (1 Änderung, 2 Aufhebung …)
 *   jolux:legalResourceImpactHasDateEntryInForce  Inkrafttreten DIESER Auswirkung
 * Weil das Ziel das Abstract DES GELTENDEN Erlasses ist, gehören Vorgänger-Erlasse
 * gleicher SR (anderes Abstract) nicht dazu; Sammelerlasse anderer SR schon; und je
 * Auswirkung steht das eigene Inkrafttretensdatum (Etappen). Pfad (b) bleibt als
 * Ergänzung für Erlasse, die Fedlex (noch) keiner Auswirkung zuordnet (gemessen: 11 von
 * 3232, u. a. künftige wie PatV AS 2026 338), jetzt aber begrenzt auf das Geltungsfenster
 * [Inkrafttreten, Aufhebung] des Abstracts; der Stammerlass (`jolux:basicAct`) ist
 * nie ein Eintrag. Detail und Messreihe: `baueRevisionen`, Kontext `RevisionsKontext`.
 *
 * §2/§0b Regel 5: reine parse-Funktionen (baueRevisionen, injizierbar/testbar) getrennt
 * vom Fetch/Writer (revisionen-generieren-run.ts); --datum aus der Shell, kein Date.now.
 * Aufruf: npm run normtext:revisionen -- --datum=$(date +%F) [--nur=DSG,OR]
 */
import { createHash } from 'node:crypto';
import { sparqlBatch, sparqlSelect, type SparqlBinding, type FetchImpl } from '../fedlex-sparql.ts';
import { ERLASS_REGISTER } from '../../src/lib/normtext/register.ts';
import { BOTSCHAFTEN } from '../../src/lib/materialien/botschaften.generated.ts';

const NOTATION_TYPE = '<https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique>';
const LANG = {
  de: '<http://publications.europa.eu/resource/authority/language/DEU>',
  fr: '<http://publications.europa.eu/resource/authority/language/FRA>',
  it: '<http://publications.europa.eu/resource/authority/language/ITA>',
};

/** Grundmenge: Bund-Volltext-Erlasse (register.json, ebene=bund & status=snapshot). */
export interface ErlassMeta { key: string; sr: string; }

export function grundmenge(): ErlassMeta[] {
  return ERLASS_REGISTER
    .filter((e) => e.ebene === 'bund' && e.status === 'snapshot' && e.sr)
    .map((e) => ({ key: e.key, sr: e.sr as string }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/** Ein Timeline-Eintrag (JSON-Feld-Namen = geplante erlass_fassungen-Spalten, camelCase). */
export interface RevisionEintrag {
  /** 'aenderung' = realer AS/oc-Änderungserlass · 'sammelerlass-marker' = Pfad-(a)-
   *  Geltungsstand ohne passenden (b)-Erlass (Mantelerlass-Lücke, §8). */
  art: 'aenderung' | 'sammelerlass-marker';
  /** In-Kraft-Datum ISO (Sortier-/Anzeige-Schlüssel). */
  dateEntryInForce: string;
  /** oc-URI (nur bei art='aenderung'); der synthetische Marker trägt keinen. */
  ocUri?: string;
  /** Erlass-/Beschluss-Datum ISO (nur art='aenderung'). */
  dateDocument?: string;
  /** AS/RO-Fundstelle «AS 2019 625», aus der oc-URI abgeleitet (art='aenderung'). */
  roFundstelle?: string;
  titelDe?: string;
  titelFr?: string;
  titelIt?: string;
  /** Verknüpfte Paket-2-Botschaft (nur bei belegtem ocUri-Match; sonst weg — kein toter Link). */
  botschaftKey?: string;
  /** true, wenn das Amendment nach dem Korpus-Stand in Kraft trat → noch nicht in den
   *  geltenden (gepinnten) Normtext konsolidiert (Finding 4, user-sichtbar). */
  nichtKonsolidiert?: boolean;
  /**
   * FALSIFIZIERT 12.9.2026, ERSTE FASSUNG (Gegenprüfung PR #827, live nachgerechnet 4/4): die
   * ursprüngliche Lesart hier lautete «Fedlex-interner Widerspruch, wenn `jolux:rectifies`
   * einen unter ANDERER SR klassierten Erlass nennt». Widerlegt: `jolux:rectifies` ist kein
   * Fehlerindiz, sondern eine Verknüpfung zu einem AS-Dokument anderer SR-Klassierung —
   * belegt an AS 2026 448 (ZDG-Enactment AS 1996 1445 → DBG Art. 124/133), AS 2023 739
   * (OR → StGB Art. 154), AS 2026 284 (MG → MStG Art. 3), AS 2024 144 (SSV/NSV → SSV Art. 98).
   *
   * FALSIFIZIERT 12.9.2026, ZWEITE FASSUNG (Gegenprüfung PR #827, Auflage f): die zweite
   * Fassung behauptete dafür ihrerseits zu viel — «erstpubliziert» und «Anhangs-Änderung
   * Änderung bisherigen Rechts» als FAKTUM, obwohl das Tripel das nicht trägt. Gegenbeleg
   * AS 2025 686 (SKV, Fedlex-Filestore, 12.9.2026 abgerufen): der Berichtigungstext nennt
   * wörtlich «SKV Änderung vom 15. Oktober 2025 (AS 2025 644; SR 741.013) Art. 24 Abs. 1
   * Bst. b Ziff. 2» — SKV berichtigt hier den EIGENEN Erlass. Fedlex' `jolux:rectifies`
   * zeigt für AS 2025 686 aber FÄLSCHLICH auf `eli/oc/2025/648` (TAFV 2, SR 741.413) statt auf
   * `eli/oc/2025/644` (die im Text genannte Fundstelle) — ein BELEGTER FEDLEX-DATENFEHLER
   * (Ziel-oc ≠ tatsächlich berichtigter Erlass laut Berichtigungstext), nicht nur eine
   * andersartige, aber korrekte Verknüpfung. AS 2024 144 (SSV) berichtigt zudem ZWEI Stellen
   * (SSV direkt + NSV-Anhang) — ein Grund-Satz kann das nicht vollständig abbilden.
   *
   * Marker (§8, DRITTE — konservative — Fassung): berichtet NUR, was das Tripel selbst sagt
   * (`jolux:rectifies` verknüpft mit einem AS-Dokument unter einer ANDEREN SR als der eigenen)
   * — OHNE Interpretation, WARUM (Anhangs-Änderung, Fedlex-Fehler oder anderes bleibt offen;
   * SKV-Fall zeigt, dass die Verknüpfung selbst fehlerhaft sein kann). §7: Fedlex bleibt
   * Quelle, der Eintrag wird NIE umgehängt. Einziger bekannter Wert; kein Enum-Ausbau ohne
   * neuen Befund.
   *
   * ── Wächter rectifies-Ziel vs. Berichtigungstext (ROADMAP W2·18-FEHLERBUCH) ──
   * Was HIER fehlt: eine Prüfung, ob das `jolux:rectifies`-Tripel selbst mit dem amtlichen
   * Berichtigungstext übereinstimmt (`check:revisionen` prüft nur den Marker GEGEN das
   * gespeicherte Tripel, nicht das Tripel gegen die Quelle). Dafür der separate Netz-Arm
   * `check:revisionen-rectifies` (`scripts/normtext/check-revisionen-rectifies.ts`,
   * `rectifies-berichtigung.ts`): holt je rectifies-Kante den Filestore-HTML-Berichtigungstext
   * und misst dessen Headline-Zitat gegen `zielFundstelle`/`fremdeSr`. Klassen: uebereinstimmend ·
   * abweichend (SKV ist der erste dokumentierte Fund, `bibliothek/normtext/rectifies-ausnahmen.json`) ·
   * sammelberichtigung · nicht-abrufbar. Läuft in `check:netz:kette` (Schedule/`workflow_dispatch`),
   * blockiert daher keinen PR-Merge.
   */
  plausibilitaet?: 'berichtigung-fremdes-as-dokument';
  /** Begründungstext zum Marker (nur gesetzt, wenn `plausibilitaet` gesetzt ist). */
  plausibilitaetsGrund?: string;
  /** Finding 4b, zweite Stufe (W2·18-FEHLERBUCH, s. `IN_KRAFT_FUER_CH_WHITELIST`): das
   *  amtlich belegte «in Kraft für die Schweiz seit»-Datum, wenn es VOR `dateEntryInForce`
   *  («angewendet ab») liegt UND vom Konsolidierungstext bezeugt ist — nur art='aenderung',
   *  nur für die whitelisteten ocUris (kein generischer Switch, s. Docstring dort). */
  dateInKraftFuerCh?: string;
  /** Pfad (c): die amtlichen Auswirkungs-Typen dieses Erlasses auf DIESES Erlass zum
   *  Datum `dateEntryInForce` (Fedlex `vocabulary/impact-type`, feste Reihenfolge
   *  `WIRKUNGEN`). Fehlt, wenn der Eintrag nur aus Pfad (b) stammt (Fedlex ordnet ihm
   *  keine Auswirkung zu — dann keine Aussage, §8). */
  wirkungen?: Wirkung[];
  /** Pfad (c): ALLE Inkrafttretensdaten dieses Änderungserlasses für dieses Erlass,
   *  aufsteigend — nur gesetzt, wenn es mehr als eines sind (gestaffeltes Inkrafttreten,
   *  AE-5). Jede Etappe ist ein eigener Eintrag mit demselben `ocUri`. */
  etappen?: string[];
  /** Fedlex-Live-Link auf den AS-Text (art='aenderung') bzw. — beim Marker — auf die
   *  Fassung dieses Datums (`/eli/cc/<abstract>/<YYYYMMDD>/de`, AE-2). */
  quelleUrl: string;
  /** sha-256 über die Identitätsfelder (Drift-Token, §7d). */
  sha: string;
}

/** Sidecar-Objekt je Erlass (public/normtext/revisionen/<KEY>.json). */
export interface RevisionSidecar {
  erlassKey: string;
  sr: string;
  /** Abrufdatum (§7 Stand). */
  abgerufen: string;
  /** Ehrlichkeits-/Reichweiten-Hinweis (§8). */
  reichweite: string;
  revisionen: RevisionEintrag[];
  /** sha-256 über alle Eintrags-shas + Identität (Sidecar-Drift-Token). */
  sha: string;
}

// AE-4 (23.9.2026): der frühere Satz «Änderungen über Sammelerlasse anderer SR sind als
// Marker gekennzeichnet» war falsch — ein Marker entstand nur an Daten OHNE eigenen
// (b)-Eintrag, Sammelerlasse am selben Tag fehlten still (OR: AS 2022 468, 2022 732,
// 2021 758). Seit Pfad (c) stehen Sammelerlasse als eigene Einträge; der Marker bleibt
// nur für Fassungen, denen Fedlex keinen Erlass zuordnet.
export const REICHWEITE =
  'Maschinell aus dem amtlichen Fedlex-Graphen zusammengestellt: die Erlasse, die Fedlex ' +
  'diesem Erlass als Änderung zuordnet (auch Sammel- und Mantelerlasse), ergänzt um weitere ' +
  'Erlasse derselben SR-Nummer seit dem Inkrafttreten. Wer gestaffelt in Kraft trat, steht ' +
  'je Inkrafttretensdatum. Fassungen ohne zugeordneten Änderungserlass sind als Marker ' +
  'gekennzeichnet. Massgeblich bleibt die amtliche Sammlung (AS/RO).';

/**
 * Pfad (c): Fedlex-Auswirkungs-Typen (`https://fedlex.data.admin.ch/vocabulary/impact-type/<n>`,
 * `skos:prefLabel`@de live gelesen 23.9.2026) → stabiler Schlüssel. Feste Reihenfolge = Anzeige-
 * und Sortier-Reihenfolge. Nur die im Korpus beobachteten Typen (Vollerhebung 23.9.2026 über
 * 231 Abstracts, 15 515 Auswirkungen: 1, 2, 3, 5, 6, 7, 9, 12, 27, 30). Ein UNBEKANNTER Typ
 * bricht den Lauf ab (`wirkungAusTyp` wirft) — nie still einsortieren (§7, §6.7).
 */
export const WIRKUNGEN = [
  'aenderung', 'aufhebung', 'vollstaendige-aufhebung', 'inkrafttreten', 'teilinkraftsetzung',
  'berichtigung', 'genehmigung', 'verlaengerung', 'geltungsbereich', 'zweite-fundstelle',
] as const;
export type Wirkung = typeof WIRKUNGEN[number];
const WIRKUNG_NACH_TYP: ReadonlyMap<number, Wirkung> = new Map([
  [1, 'aenderung'], // «Änderung»
  [2, 'aufhebung'], // «Aufhebung»
  [3, 'genehmigung'], // «Genehmigung»
  [5, 'inkrafttreten'], // «Inkrafttreten»
  [6, 'berichtigung'], // «Berichtigung»
  [7, 'verlaengerung'], // «Verlängerung»
  [9, 'geltungsbereich'], // «Geltungsbereich»
  [12, 'zweite-fundstelle'], // «2. Fundstelle»
  [27, 'vollstaendige-aufhebung'], // «Vollständige Aufhebung»
  [30, 'teilinkraftsetzung'], // «Teilinkraftsetzung»
]);
export function wirkungAusTyp(typ: number): Wirkung {
  const w = WIRKUNG_NACH_TYP.get(typ);
  if (!w) throw new Error(`Unbekannter Fedlex-Auswirkungs-Typ impact-type/${typ} — erst in WIRKUNG_NACH_TYP abbilden (§7).`);
  return w;
}

/** Eine Auswirkung (Pfad c) auf das gepinnte Abstract, reduziert auf den ändernden Erlass. */
export interface AuswirkungZeile {
  /** oc-URI des ändernden Erlasses (voll, `https://fedlex.data.admin.ch/eli/oc/<jahr>/<nr>`). */
  oc: string;
  /** Fedlex impact-type-Nummer. */
  typ: number;
  /** `legalResourceImpactHasDateEntryInForce` ISO; fehlt bei undatierten Auswirkungen. */
  datum?: string;
  /** Datum der Fassung, die Fedlex als einarbeitend nennt (`jolux:impactConsolidatedBy`,
   *  `…/<YYYYMMDD>`), ISO; fehlt bei noch nicht konsolidierten Auswirkungen. */
  fassung?: string;
}

/** Stammdaten eines oc-Erlasses, den nur Pfad (c) kennt (Pfad (b) liefert sie selbst). */
export interface OcStamm {
  dateForce?: string; dateDoc?: string; roId?: string; titelDe?: string; titelFr?: string; titelIt?: string;
}

/**
 * Pfad (c) + Geltungsfenster eines Erlasses (alles aus dem amtlichen Graphen am gepinnten
 * Abstract, im store-raw persistiert → `check:revisionen` baut offline nach).
 */
export interface RevisionsKontext {
  /** Gepinntes Abstract, z. B. `cc/27/317_321_377` (Marker-Link AE-2). */
  abstractEli: string;
  /** `jolux:basicAct` des Abstracts = Stammerlass — nie ein Eintrag (AE-3). */
  basicAct?: string;
  /** `jolux:dateEntryInForce` des Abstracts (Ur-Inkrafttreten des geltenden Erlasses). */
  inkrafttreten?: string;
  /** `jolux:dateNoLongerInForce` des Abstracts (aufgehobener Erlass, z. B. BMV 2026-03-01). */
  aufhebung?: string;
  auswirkungen: AuswirkungZeile[];
  /** Stammdaten je oc, das NUR aus Pfad (c) stammt. */
  ocStamm: Readonly<Record<string, OcStamm>>;
}

/**
 * Inkrafttretensdatum einer Auswirkung (Pfad c). Fedlex' Alt-Bestand (Informationsquelle
 * «data-from-geschaeftsstaende») trägt als `legalResourceImpactHasDateEntryInForce` teils das
 * BESCHLUSSDATUM des ändernden Erlasses. Messung 23.9.2026 über alle 7509 Einträge: 131
 * Auswirkungsdaten liegen VOR dem eigenen `dateEntryInForce` des ändernden Erlasses, 81 davon
 * sind exakt dessen `dateDocument` — z. B. ZPO ← AS 2010 281 (oc/2010/37): Auswirkung
 * «2009-09-25» = Beschluss, der Erlass trat am 2010-02-01 in Kraft; AHVG ← AS 2019 2395
 * (STAF): «2018-09-28» = Schlussabstimmung. Ein Beschlussdatum ist kein Inkrafttreten (§1).
 * Regel (deterministisch, eng): NUR wenn Auswirkungsdatum == `dateDocument` UND <
 * `dateEntryInForce` des ändernden Erlasses UND das Abstract an diesem Datum KEINE Fassung
 * hat (Pfad a), gilt dessen `dateEntryInForce`. Die Fassungs-Bedingung ist gemessen, nicht
 * vorsorglich: an 4 Fällen besteht am Beschlussdatum eine amtliche Fassung, das Datum ist
 * dort also echt (AVG ← AS 2018 223 Berichtigung, Fassung 2018-04-17; AVIV ← oc/2020/524,
 * Fassung 2020-07-01; KLV ← oc/2018/432; KVV ← oc/2012/61) — ohne sie wurden daraus 4
 * falsche Marker. Die übrigen 50 frühen Daten (z. B. rückwirkende Inkraftsetzung AVIG ←
 * AS 2021 153, 2021-01-01 vor 2021-03-20) bleiben unangetastet — Fedlex bleibt Quelle (§7).
 */
export function inkrafttretenDerAuswirkung(
  datum: string, oc?: { dateForce?: string; dateDoc?: string }, fassungsDaten: ReadonlySet<string> = new Set(),
): string {
  const beschluss = oc?.dateDoc?.slice(0, 10);
  const eigen = oc?.dateForce?.slice(0, 10);
  return beschluss && eigen && datum === beschluss && datum < eigen && !fassungsDaten.has(datum) ? eigen : datum;
}

/** Fedlex-Web-Adresse der Fassung eines Abstracts an einem Datum (Repo-Form, s.
 *  `fassungsLink` in src/pages/gesetz-leser/zukunftsfassungen.ts; AE-2). */
export function fassungsUrl(abstractEli: string, datumIso: string): string {
  if (!/^cc\/[0-9a-z_/]+$/.test(abstractEli) || !/^\d{4}-\d{2}-\d{2}$/.test(datumIso)) {
    throw new Error(`fassungsUrl: ungültiges Abstract «${abstractEli}» oder Datum «${datumIso}».`);
  }
  return `https://www.fedlex.admin.ch/eli/${abstractEli}/${datumIso.replace(/-/g, '')}/de`;
}

/** oc-Wurzel aus einer Auswirkungs-Quelle (`…/eli/oc/2020/746/lvl_I` → `…/eli/oc/2020/746`);
 *  `undefined` für alles, was nicht unter `eli/oc/` liegt (nie raten). */
export function ocWurzel(uri: string): string | undefined {
  return /^(https:\/\/fedlex\.data\.admin\.ch\/eli\/oc\/[^/]+\/[^/]+)/.exec(uri)?.[1];
}

// Sammelerlass-Marker (Pfad-(a)-Geltungsstände ohne primären oc-Erlass) NUR ab dieser
// Grenze — sie ist die dokumentierte Verlässlichkeits-Schwelle (§8 «ab ~2000»). Frühere
// Konsolidierungsstände tragen keine Erlass-Identität und wären reines Rauschen unterhalb
// der Reichweite; die primäre (b)-Timeline reicht dagegen weiter zurück. Die primären
// Änderungs-Erlasse (art='aenderung') werden NIE beschnitten (Vollständigkeit vor Kürze).
export const MARKER_CUTOFF = '2000-01-01';

/**
 * Finding 4b, ZWEITE STUFE (W2·18-FEHLERBUCH, Auftrag 12.9.2026): `belegtImXml`/
 * `belegteOcs` oben lösen nur, OB ein Amendment schon im Konsolidierungstext zitiert ist
 * (→ `nichtKonsolidiert` unterdrücken) — nicht, WELCHES frühere Datum der Text daneben
 * nennt. Für FZA/AS 2021 12 lautet der amtliche Wortlaut (live 12.9.2026, `eli/cc/2002/243/
 * 20201215`, DE-XML): «… in Kraft für die Schweiz seit 15. Dez. 2020 und angewendet ab
 * 1. Jan. 2021 …» — `dateEntryInForce` bildet nur Letzteres ab (§8: sonst unvollständig).
 *
 * Dieses frühere Datum trägt KEIN strukturiertes Fedlex-Prädikat: live geprüft (SPARQL
 * `DESCRIBE`-Äquivalent auf `eli/oc/2021/12`, 12.9.2026) — der oc-Knoten hat `dateDocument`
 * (2020-12-15) und `dateEntryInForce` (2021-01-01), aber KEIN `jolux:dateApplicability`.
 * Und `dateDocument` ist KEIN verlässlicher Proxy für «in Kraft für die Schweiz» im
 * Allgemeinen — Gegenprobe an vier weiteren Fällen mit ähnlich knappem Datums-Abstand
 * (`oc/2017/653`: dateDocument 2017-10-25 ≠ Text-Datum 2017-12-31; `oc/2021/429` und
 * `oc/2019/317`: dateDocument == dateEntryInForce, kein zweites Datum; `oc/2020/841`:
 * dateDocument 2020-10-14 ≠ Text-Datum 2020-12-15) — eine allgemeine Ableitung würde also
 * in den meisten Fällen ein FALSCHES zweites Datum erfinden (§1/§7). Eine Vollerhebung über
 * alle 228 Sidecars fand 757 Fälle, in denen ein `sammelerlass-marker` unmittelbar vor einer
 * `aenderung` steht (Lücke 1 Tag bis 13 Jahre, Median 214 Tage) — die überwiegende Mehrheit
 * sind eigenständige, zeitlich zufällig benachbarte Sammelerlass-Änderungen (§8-Regelfall),
 * KEIN zweites Datum desselben Ereignisses.
 *
 * Deshalb — wie beim `plausibilitaet`-Marker oben — eine WHITELIST auf den einen amtlich
 * verifizierten Fall, keine Herleitung: jeder weitere Eintrag braucht dieselbe Live-
 * Verifikation am Konsolidierungstext (Muster `belegtImXml`), bevor er hier landet.
 */
const IN_KRAFT_FUER_CH_WHITELIST: ReadonlyMap<string, string> = new Map([
  ['https://fedlex.data.admin.ch/eli/oc/2021/12', '2020-12-15'], // FZA, Beschluss Nr. 1/2020
]);

/** oc-URI → «AS <jahr/band> <num>» aus dem ELI-Pfad. NUR korrekt, wenn die ELI-Nummer
 *  die AS-Seite IST: (1) Multi-Segment-ELI (Alt-AS, `DE_FR_IT`-Seiten) → erstes Segment =
 *  DE-Seite, z. B. `eli/oc/1973/348_347_349` → «AS 1973 348»; (2) Einzel-Segment SEIT der
 *  AS-Reform 1.1.2019, wo `sequenceInTheYearOfPublication` == Seite, z. B. `eli/oc/2022/491`
 *  → «AS 2022 491». Für Einzel-Segment-ELI VOR 2019 ist die ELI-Nummer die laufende
 *  Sequenz, NICHT die Seite (→ `fundstelle()` nimmt dort `historicalId`, sonst wäre die
 *  Fundstelle fabriziert und falsch — belegt: `oc/2005/566` ⇒ real AS 2005 4395). */
export function roFundstelleAusOc(ocUri: string): string | undefined {
  const m = /\/eli\/oc\/(\d+)\/(\d+)/.exec(ocUri);
  return m ? `AS ${m[1]} ${m[2]}` : undefined;
}

/** Massgebliche AS-Fundstelle eines oc-Erlasses (§7-Treue: gelesen, nie fabriziert).
 *  - Einzel-Segment-ELI mit `historicalId` (cogni-Prädikat, digitale AS vor 2019):
 *    `historicalId` («RO 2005 4395») trägt die echte AS-Seite → normalisiert auf die
 *    DE-Etikette «AS 2005 4395» (AS=RO=RU dieselbe Sammlung; die digitale AS ist
 *    sprach-einheitlich paginiert, Nummer == DE-Seite, live gegen die amtliche Seite belegt).
 *  - Multi-Segment-ELI (Alt-AS): `historicalId` nennt die FR-Seite, das erste ELI-Segment
 *    die DE-Seite → Ableitung bevorzugen (DE-treu).
 *  - Einzel-Segment ohne `historicalId` (seit 2019): Ableitung (Sequenz == Seite). */
export function fundstelle(ocUri: string, historicalId?: string): string | undefined {
  const seg = /\/eli\/oc\/\d+\/([^/?#]+)/.exec(ocUri)?.[1] ?? '';
  const multiSegment = seg.includes('_');
  if (!multiSegment && historicalId) {
    const m = /(\d{4})\s+(\d+)\s*$/.exec(historicalId.trim());
    return m ? `AS ${m[1]} ${m[2]}` : historicalId.trim(); // unerwartetes Format: verbatim, nie fabrizieren
  }
  return roFundstelleAusOc(ocUri);
}

/**
 * Grenzen des `<authorialNote>`, das die Position `index` umschliesst — `null`, wenn
 * `index` in keiner Fussnote liegt (z. B. Fliesstext) oder die Note nicht sauber
 * schliesst. Ein einfacher `lastIndexOf`/`indexOf` genügt hier bewusst NICHT (könnte in
 * eine FREMDE, spätere Note hineingreifen) — deshalb die Sanity-Prüfung: schliesst
 * zwischen `noteStart` und `index` bereits eine ANDERE Note, liegt `index` gar nicht in
 * dieser.
 */
function findeAuthorialNote(xmlText: string, index: number): { start: number; end: number } | null {
  const start = xmlText.lastIndexOf('<authorialNote', index);
  if (start === -1) return null;
  const end = xmlText.indexOf('</authorialNote>', index);
  if (end === -1) return null;
  const fremdesEndeDazwischen = xmlText.indexOf('</authorialNote>', start);
  if (fremdesEndeDazwischen !== -1 && fremdesEndeDazwischen < index) return null;
  return { start, end: end + '</authorialNote>'.length };
}

/**
 * Finding 4b (Gegenprüfung 16.8.2026, W2·18-FEHLERBUCH #19, live an FZA/SR 0.142.112.681
 * verifiziert; §6.7-Auflage Gegenprüfung PR #820, 12.9.2026: Element-Bindung statt
 * Zeichenfenster). Fedlex modelliert `jolux:dateEntryInForce` bei gewissen Staatsvertrags-
 * Beschlüssen (Gemischter-Ausschuss-Entscheide) als «angewendet ab»-Datum, NICHT als
 * «in Kraft für die Schweiz seit»-Datum. Beleg live (`eli/cc/2002/243/20201215`,
 * DE-XML, Art. 1 des Beschlusses Nr. 1/2020, abgerufen 12.9.2026): der Konsolidierungs-
 * text vom 15.12.2020 zitiert bereits die oc-URI `eli/oc/2021/12` per `<ref href>`, DIREKT
 * neben der Wendung «in Kraft für die Schweiz seit 15. Dez. 2020 und **angewendet ab**
 * 1. Jan. 2021» — obwohl deren `dateEntryInForce` erst 2021-01-01 ist.
 *
 * Eine BLOSSE href-Präsenz reicht NICHT (Gegenprobe live an KLV/SR 832.112.31, 12.9.2026):
 * dieselbe oc-URI kann in einer reinen Änderungs-HISTORIE auftauchen (Aufzählung aller
 * früheren Fassungen einer Bestimmung) oder ein Amendment kann NUR TEILWEISE in Kraft sein
 * («Abs. 1 Bst. a und c in Kraft seit 1. Aug. 2026 … Die anderen Bestimmungen treten zu
 * einem späteren Zeitpunkt in Kraft.») — in beiden Fällen ist der Marker weiterhin
 * KORREKT `nichtKonsolidiert`, obwohl die href vorkommt.
 *
 * Ein blosses Zeichenfenster reicht ABER AUCH NICHT (§6.7-Auflage): eine Fedlex-
 * Sammelnote listet oft MEHRERE Änderungserlasse in EINER `<authorialNote>` auf
 * («… vom X (ref A) … und angewendet ab Y (ref B) …») — ein Fenster um `ref A` kann dann
 * das «angewendet ab» erfassen, das eigentlich zu `ref B` gehört, und `ref A` fälschlich
 * entwarnen. Massgeblich ist deshalb NUR das Segment INNERHALB derselben Fussnote
 * zwischen dem vorhergehenden `</ref>` (oder Notenanfang) und der gesuchten href — das
 * ist exakt die Wortfolge, die sich strukturell auf DIESEN Erlass bezieht, live
 * verifiziert an FZA (Segment endet unmittelbar vor der href, «angewendet ab» direkt
 * davor) und an KLV (Segment enthält «angewendet ab» in KEINEM der beiden Fälle).
 */
export function belegtImXml(xmlText: string, ocUri: string): boolean {
  const href = `href="${ocUri}"`;
  const i = xmlText.indexOf(href);
  if (i === -1) return false;
  const note = findeAuthorialNote(xmlText, i);
  if (!note) return false; // kein Fussnoten-Kontext auffindbar — kein Beleg (konservativ)
  const noteText = xmlText.slice(note.start, note.end);
  const relIndex = i - note.start;
  const vorherigerRefEnde = noteText.lastIndexOf('</ref>', relIndex);
  const segmentStart = vorherigerRefEnde === -1 ? 0 : vorherigerRefEnde + '</ref>'.length;
  return noteText.slice(segmentStart, relIndex).includes('angewendet ab');
}

/** oc-URI → Fedlex-Live-Link (DE-Rendering des AS-Textes). */
export function liveLink(ocUri: string): string {
  return ocUri.replace('https://fedlex.data.admin.ch', 'https://www.fedlex.admin.ch') + '/de';
}

/** Titel-Bereinigung: Fedlex-Titel können HTML tragen; die UI rendert Text. */
function titelText(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Baut EINMAL den ocUri→botschaftKey-Index aus den Paket-2-Botschaften (Finding 1). */
export function botschaftIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const b of BOTSCHAFTEN) {
    for (const oc of b.ocUris ?? []) {
      // Deterministisch: kleinster Key gewinnt, falls mehrere Botschaften denselben oc nennen.
      const vorhanden = idx.get(oc);
      if (!vorhanden || b.key < vorhanden) idx.set(oc, b.key);
    }
  }
  return idx;
}

function shaEintrag(e: Omit<RevisionEintrag, 'sha'>): string {
  const felder = [
    e.art, e.dateEntryInForce, e.ocUri ?? '', e.dateDocument ?? '', e.roFundstelle ?? '',
    e.titelDe ?? '', e.titelFr ?? '', e.titelIt ?? '', e.botschaftKey ?? '',
    e.nichtKonsolidiert ? '1' : '', e.quelleUrl,
  ];
  // Additiv NUR bei gesetztem Marker angehängt (§6.7 Auflage): so bleibt die sha jedes
  // unbetroffenen Eintrags — und damit der ganze Sidecar — byte-gleich (§703-Vollerhebung
  // verlangt ausdrücklich nur betroffene Sidecars neu; ein bedingungslos angehängtes Feld
  // hätte JEDE sha im Korpus verändert).
  if (e.plausibilitaet) felder.push(e.plausibilitaet, e.plausibilitaetsGrund ?? '');
  if (e.dateInKraftFuerCh) felder.push(e.dateInKraftFuerCh);
  // Pfad (c), 23.9.2026 — ebenfalls nur additiv bei gesetztem Feld (gleiche Begründung).
  if (e.wirkungen) felder.push(`w:${e.wirkungen.join(',')}`);
  if (e.etappen) felder.push(`e:${e.etappen.join(',')}`);
  return createHash('sha256').update(felder.join('|'), 'utf8').digest('hex');
}

/**
 * REINE parse-Funktion (§2, testbar): Pfad-(b)-Bindings + Pfad-(a)-Geltungsstände (des
 * gepinnten Abstracts) + Pfad-(c)-Auswirkungen (`kontext`) + Korpus-Stand → deterministisch
 * sortierte Timeline EINES Erlasses.
 * - Pfad (c), wenn `kontext` da ist (Generator-Normalfall seit 23.9.2026): je ändernder oc
 *   und je Inkrafttretensdatum SEINER Auswirkungen auf dieses Abstract ein Eintrag (AE-4/AE-5);
 *   `wirkungen` = die amtlichen Typen an diesem Datum; `etappen` bei mehr als einem Datum.
 *   Undatierte Auswirkungen zählen nur, wenn der oc KEINE datierte hat — dann gilt sein
 *   eigenes `dateEntryInForce` (Pfad b bzw. `ocStamm`); fehlt auch das, kein Eintrag (nie
 *   ein Datum erfinden, §7).
 * - Pfad (b) ergänzt oc ohne Auswirkung, aber NUR im Geltungsfenster des Abstracts
 *   [`inkrafttreten`, `aufhebung`] (AE-3: Vorgänger-Erlasse gleicher SR fallen heraus);
 *   dedupe je oc (min dateEntryInForce; Sprachen kollabieren). Ohne `kontext` (Alt-Aufruf,
 *   Tests) bleibt Pfad (b) ungefiltert wie bis 22.9.2026.
 * - Der Stammerlass (`kontext.basicAct`) ist nie ein Eintrag (AE-3).
 * - RO-Fundstelle aus oc-URI/historicalId; Botschafts-Join über ocUri-Index;
 * - nichtKonsolidiert wenn dateEntryInForce > korpusStand UND die oc-URI NICHT bereits im
 *   Konsolidierungstext zitiert ist (Finding 4, verfeinert um Finding 4b: `belegteOcs`,
 *   ausserhalb ermittelt via `belegtImXml` — s. dort);
 * - Pfad-(a)-Cross-Check: Geltungsstände ohne Eintrag gleichen Datums → Marker, verlinkt
 *   auf DIESE Fassung (`fassungsUrl`, AE-2). Ohne `kontext.abstractEli` kein gültiger Link →
 *   Abbruch statt toter Link.
 * Kein Netz, kein Date.now — `belegteOcs`/`kontext` werden injiziert (Netz lebt im Runner).
 */
export function baueRevisionen(
  erlass: ErlassMeta,
  bBindings: SparqlBinding[],
  aStaende: string[],
  korpusStand: string,
  ocZuBotschaft: Map<string, string>,
  abgerufen: string,
  belegteOcs: ReadonlySet<string> = new Set(),
  rectifiesInfoProOc: ReadonlyMap<string, RectifiesInfo> = new Map(),
  kontext?: RevisionsKontext,
): RevisionSidecar {
  interface Roh {
    oc: string; dateForce: string; dateDoc?: string; roId?: string; de?: string; fr?: string; it?: string;
  }
  const proOc = new Map<string, Roh>();
  for (const b of bBindings) {
    const oc = b.oc?.value;
    const dateForce = b.dateForce?.value;
    if (!oc || !dateForce) continue;
    let r = proOc.get(oc);
    if (!r) { r = { oc, dateForce }; proOc.set(oc, r); }
    // min dateEntryInForce (erstes Inkrafttreten) — deterministisch, unabhängig der Bindungsreihenfolge.
    if (dateForce < r.dateForce) r.dateForce = dateForce;
    if (!r.dateDoc && b.dateDoc?.value) r.dateDoc = b.dateDoc.value;
    if (!r.roId && b.roId?.value) r.roId = b.roId.value;
    if (!r.de && b.titleDe?.value) r.de = b.titleDe.value;
    if (!r.fr && b.titleFr?.value) r.fr = b.titleFr.value;
    if (!r.it && b.titleIt?.value) r.it = b.titleIt.value;
  }

  // ── Zeilen bestimmen: je (oc, Datum) die Wirkungen ──────────────────────────────
  // Map oc → Map datum → Set<Wirkung> (leeres Set = Pfad (b) ohne Auswirkungs-Aussage).
  const zeilen = new Map<string, Map<string, Set<Wirkung>>>();
  // Daten, die als Erfassungsartefakt erkannt sind (Auswirkungsdatum NACH der einarbeitenden
  // Fassung, s. unten) — an ihnen entsteht auch kein Marker (s. Pfad-(a)-Cross-Check).
  const artefaktDaten = new Set<string>();
  const basicAct = kontext?.basicAct;
  if (kontext) {
    const fassungsDaten = new Set(aStaende);
    const datiert = new Map<string, Map<string, Set<Wirkung>>>();
    const undatiert = new Map<string, Set<Wirkung>>();
    for (const a of kontext.auswirkungen) {
      if (a.oc === basicAct) continue;
      const w = wirkungAusTyp(a.typ);
      // Widerspruch Auswirkungsdatum ↔ einarbeitende Fassung (Messung 23.9.2026 über 15 515
      // Roh-Auswirkungen: 14 643 gleich, 614 mit Fassung VOR dem Datum, 126 danach, 81 ohne
      // Fassung, 51 undatiert). Eine Fassung kann keine Änderung enthalten, die erst NACH ihr
      // in Kraft tritt — das Datum ist dann ein Erfassungsartefakt: AVIG ← AS 1991 2125 u. v. a.
      // tragen eine zweite «Etappe» 2023-01-01, eingearbeitet aber in die Fassung 1992-01-01;
      // AHVG ← AS 1965 537 (oc/1965/537_541_535, Auswirkung 12) «2066-01-01», eingearbeitet in
      // 2021-01-01. Solche Daten erzeugen KEINE Etappe; die Auswirkung zählt wie eine
      // undatierte (nie ein Datum erfinden, §7). Der umgekehrte Fall (Fassung NACH dem Datum)
      // bleibt: rückwirkende Inkraftsetzung und Nachkonsolidierung sind echt.
      const widerspruch = !!(a.datum && a.fassung && a.fassung < a.datum);
      if (widerspruch) artefaktDaten.add(a.datum!);
      if (a.datum && !widerspruch) {
        const datum = inkrafttretenDerAuswirkung(a.datum, proOc.get(a.oc) ?? kontext.ocStamm[a.oc], fassungsDaten);
        const proDatum = datiert.get(a.oc) ?? new Map<string, Set<Wirkung>>();
        const s = proDatum.get(datum) ?? new Set<Wirkung>();
        s.add(w); proDatum.set(datum, s); datiert.set(a.oc, proDatum);
      } else {
        const s = undatiert.get(a.oc) ?? new Set<Wirkung>();
        s.add(w); undatiert.set(a.oc, s);
      }
    }
    for (const [oc, proDatum] of datiert) zeilen.set(oc, proDatum);
    for (const [oc, w] of undatiert) {
      if (zeilen.has(oc)) continue; // datierte Auswirkungen gehen vor
      const eigen = proOc.get(oc)?.dateForce ?? kontext.ocStamm[oc]?.dateForce;
      if (!eigen) continue; // kein amtliches Datum → kein Eintrag (nie erfinden, §7)
      zeilen.set(oc, new Map([[eigen, w]]));
    }
    for (const r of proOc.values()) {
      if (zeilen.has(r.oc) || r.oc === basicAct) continue;
      if (kontext.inkrafttreten && r.dateForce < kontext.inkrafttreten) continue; // Vorgänger gleicher SR (AE-3)
      if (kontext.aufhebung && r.dateForce > kontext.aufhebung) continue; // Nachfolger gleicher SR (AE-6)
      zeilen.set(r.oc, new Map([[r.dateForce, new Set<Wirkung>()]]));
    }
  } else {
    for (const r of proOc.values()) zeilen.set(r.oc, new Map([[r.dateForce, new Set<Wirkung>()]]));
  }

  const eintraege: RevisionEintrag[] = [];
  const bStaende = new Set<string>();
  for (const [oc, proDatum] of zeilen) {
    const r = proOc.get(oc);
    const stamm = kontext?.ocStamm[oc];
    const dateDoc = r?.dateDoc ?? stamm?.dateDoc;
    const roId = r?.roId ?? stamm?.roId;
    const de = r?.de ?? stamm?.titelDe;
    const fr = r?.fr ?? stamm?.titelFr;
    const it = r?.it ?? stamm?.titelIt;
    const daten = [...proDatum.keys()].sort();
    const botschaftKey = ocZuBotschaft.get(oc);
    // §8-Marker (Gegenprüfung #703, korrigiert nach Gegenprüfung PR #827 Auflage f — s.
    // Docstring `RevisionEintrag.plausibilitaet`): `rectifiesInfoProOc` trägt bereits NUR
    // aufgelöste, deterministisch (kleinste SR-Notation bzw. -Ziel-URI) ausgewählte
    // Fremd-SR + Ziel-Fundstelle je oc (s. `baueOcZuRectifiesSr`/`holeRectifiesSr`) — direkter
    // Lookup, kein Ordnungs-abhängiges Gate (Auflage e). Der Grund-Text berichtet NUR das
    // Tripel selbst (Verknüpfung + Ziel-SR/-Fundstelle), OHNE Interpretation («erstpubliziert»,
    // «Anhangs-Änderung») — der SKV-Fall (AS 2025 686, s. Docstring) zeigt live, dass die
    // Verknüpfung selbst ein Fedlex-Datenfehler sein kann.
    const info = rectifiesInfoProOc.get(oc);
    const fremdesAsDokument = info !== undefined && info.fremdeSr !== erlass.sr;
    for (const datum of daten) {
      bStaende.add(datum);
      const wirkungen = [...proDatum.get(datum)!].sort((x, y) => WIRKUNGEN.indexOf(x) - WIRKUNGEN.indexOf(y));
      // Finding 4b, zweite Stufe: NUR aus der Whitelist, NUR wenn das Datum tatsächlich VOR
      // dateEntryInForce liegt (sonst wäre «in Kraft seit» nach «angewendet ab» widersinnig —
      // ein Schutz gegen einen künftigen Whitelist-Tippfehler, §7).
      const inKraftFuerCh = IN_KRAFT_FUER_CH_WHITELIST.get(oc);
      const dateInKraftFuerCh = inKraftFuerCh && inKraftFuerCh < datum ? inKraftFuerCh : undefined;
      const roh: Omit<RevisionEintrag, 'sha'> = {
        art: 'aenderung',
        dateEntryInForce: datum,
        ocUri: oc,
        dateDocument: dateDoc?.slice(0, 10),
        roFundstelle: fundstelle(oc, roId),
        titelDe: de ? titelText(de) : undefined,
        titelFr: fr ? titelText(fr) : undefined,
        titelIt: it ? titelText(it) : undefined,
        botschaftKey,
        nichtKonsolidiert: (datum > korpusStand && !belegteOcs.has(oc)) ? true : undefined,
        plausibilitaet: fremdesAsDokument ? 'berichtigung-fremdes-as-dokument' : undefined,
        plausibilitaetsGrund: fremdesAsDokument
          ? `Fedlex verknüpft diese Berichtigung (jolux:rectifies) mit dem AS-Dokument `
            + `${info.zielFundstelle ?? info.zielOc}, das unter SR ${info.fremdeSr} klassiert ist `
            + '— häufig, weil die berichtigte Bestimmung im Anhang eines anderen Erlasses geändert '
            + 'wurde; massgeblich ist die amtliche Sammlung (§7/§8).'
          : undefined,
        dateInKraftFuerCh,
        wirkungen: wirkungen.length ? wirkungen : undefined,
        etappen: daten.length > 1 ? daten : undefined,
        quelleUrl: liveLink(oc),
      };
      eintraege.push({ ...roh, sha: shaEintrag(roh) });
    }
  }

  // Finding 4b, zweite Stufe: Pfad-(a)-Stände, die bereits als `dateInKraftFuerCh` auf einer
  // `aenderung` erscheinen, sind KEIN eigenständiger Sammelerlass-Marker mehr (sonst zeigt
  // die Timeline dasselbe Ereignis zweimal — einmal korrekt zugeordnet, einmal als
  // unzusammenhängend wirkender Marker, §8-Ehrlichkeit).
  const belegteFruehereDaten = new Set(
    eintraege.map((e) => e.dateInKraftFuerCh).filter((d): d is string => !!d),
  );

  // Pfad-(a)-Cross-Check: Geltungsstände des gepinnten Abstracts ohne Eintrag gleichen
  // Datums → Marker (§8, nie stille Lücke). Nur Stände, die NACH dem ältesten Eintrag liegen
  // (frühere Stände = Erstpublikation, kein «weiterer» Erlass).
  const aeltesterB = [...bStaende].sort()[0];
  for (const stand of [...new Set(aStaende)].sort()) {
    if (bStaende.has(stand)) continue;
    if (aeltesterB && stand < aeltesterB) continue;
    // Seit der Stammerlass kein Eintrag mehr ist (AE-3), trägt `aeltesterB` die Erstfassung
    // nicht mehr: die Fassung zum Inkrafttreten des Abstracts ist die Erstpublikation, keine
    // Änderung (Rot-Beleg 23.9.2026: GebV-HReg, einziger Stand 2021-01-01 = Inkrafttreten,
    // wurde ohne diese Zeile zum Marker).
    if (kontext?.inkrafttreten && stand <= kontext.inkrafttreten) continue;
    if (stand < MARKER_CUTOFF) continue; // unterhalb der Verlässlichkeits-Schwelle (§8)
    if (belegteFruehereDaten.has(stand)) continue; // bereits als dateInKraftFuerCh gezeigt
    // Eine Fassung an einem als Artefakt erkannten Auswirkungsdatum ist KEINE «Fassung ohne
    // zugeordneten Änderungserlass» — Fedlex ordnet sie zu, nur mit widersprüchlichem Datum.
    // Beleg 23.9.2026: AHVG trägt eine Fassung 2066-01-01 (dateApplicability), erzeugt von
    // der Auswirkung oc/1965/537_541_535 «2066-01-01», eingearbeitet 2021-01-01; als Marker
    // hiesse sie «tritt am 01.01.2066 in Kraft». Fedlex-Datenfehler, bleibt dort gemeldet (§8).
    if (artefaktDaten.has(stand)) continue;
    if (!kontext?.abstractEli) {
      // AE-2: bis 22.9.2026 hier `https://www.fedlex.admin.ch/eli/cc/${erlass.sr}` — die SR-
      // Nummer ist kein ELI-Pfad (Fedlex «page-not-found», 1978 Links in 196 Sidecars).
      throw new Error(`baueRevisionen(${erlass.key}): Marker ${stand} ohne Abstract-ELI — kein gültiger Fedlex-Link möglich.`);
    }
    const roh: Omit<RevisionEintrag, 'sha'> = {
      art: 'sammelerlass-marker',
      dateEntryInForce: stand,
      nichtKonsolidiert: stand > korpusStand ? true : undefined,
      quelleUrl: fassungsUrl(kontext.abstractEli, stand),
    };
    eintraege.push({ ...roh, sha: shaEintrag(roh) });
  }

  // Deterministische Sortierung: Datum absteigend → art (aenderung vor marker) → ocUri.
  eintraege.sort((a, b) =>
    a.dateEntryInForce < b.dateEntryInForce ? 1
    : a.dateEntryInForce > b.dateEntryInForce ? -1
    : a.art < b.art ? -1 : a.art > b.art ? 1
    : (a.ocUri ?? '') < (b.ocUri ?? '') ? -1 : (a.ocUri ?? '') > (b.ocUri ?? '') ? 1 : 0);

  const sidecarSha = createHash('sha256')
    .update([erlass.key, erlass.sr, ...eintraege.map((e) => e.sha)].join('|'), 'utf8')
    .digest('hex');

  return {
    erlassKey: erlass.key,
    sr: erlass.sr,
    abgerufen,
    reichweite: REICHWEITE,
    revisionen: eintraege,
    sha: sidecarSha,
  };
}

// ── SPARQL Pfad (b): eine VALUES-Batch über die Grundmenge ───────────────────────
export function baueQueryB(valuesInline: string): string {
  return `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?sr ?oc ?dateForce ?dateDoc ?roId ?titleDe ?titleFr ?titleIt ?rectifies WHERE {
  VALUES ?notation { ${valuesInline} }
  ?tax skos:notation ?notation . BIND(STR(?notation) AS ?sr)
  ?oc jolux:classifiedByTaxonomyEntry ?tax ; jolux:legalResourceFamilyType <https://fedlex.data.admin.ch/vocabulary/resource-family/oc> ; jolux:dateEntryInForce ?dateForce .
  OPTIONAL { ?oc jolux:dateDocument ?dateDoc . }
  OPTIONAL { ?oc <http://cogni.internal.system/model#historicalId> ?roId . }
  OPTIONAL { ?oc jolux:isRealizedBy ?ede . ?ede jolux:language ${LANG.de} ; jolux:title ?titleDe . }
  OPTIONAL { ?oc jolux:isRealizedBy ?efr . ?efr jolux:language ${LANG.fr} ; jolux:title ?titleFr . }
  OPTIONAL { ?oc jolux:isRealizedBy ?eit . ?eit jolux:language ${LANG.it} ; jolux:title ?titleIt . }
  OPTIONAL { ?oc jolux:rectifies ?rectifies . }
}`;
}

/** Zwischenformat von `holeRectifiesSr`: SR-Notation + (wo vorhanden) `historicalId` je
 *  rectifies-Ziel-oc — Rohstoff für die AS-Fundstellen-Ableitung in `baueOcZuRectifiesSr`. */
interface ZielKlassierung { sr: string; roId?: string }

/**
 * Angereicherte Fremd-Info für den §8-Marker (Auflage f Gegenprüfung PR #827, §7): der
 * Grund-Text darf NUR berichten, was das `jolux:rectifies`-Tripel selbst trägt — SR-Notation
 * UND (wo ableitbar) AS-Fundstelle des Ziels, nie eine Interpretation («erstpubliziert»,
 * «Anhangs-Änderung»). `zielFundstelle` fehlt, wenn `fundstelle()` sie nicht ableiten kann
 * (dann fällt der Grund-Text auf `zielOc` zurück — nie fabrizieren, §7).
 */
export interface RectifiesInfo {
  fremdeSr: string;
  zielOc: string;
  zielFundstelle?: string;
}

/**
 * Reine Komposition (§2, testbar): oc → `RectifiesInfo` des per `jolux:rectifies` verknüpften
 * AS-Dokuments, gebildet aus den (bereits je Erlass gefilterten) Pfad-(b)-Bindings + der
 * global aufgelösten Ziel-Klassierungs-Map (`holeRectifiesSr`). Kein Netz hier — Netz-Schritt
 * lebt im Runner (§703-Marker, s. `RevisionEintrag.plausibilitaet`).
 *
 * Deterministisch UNABHÄNGIG von der Bindungsreihenfolge (§2, Auflage e Gegenprüfung PR
 * #827): trägt ein oc mehrere `jolux:rectifies`-Ziele (Mehrfach-Berichtigung — live an AS 2024
 * 144/SSV beobachtet, das ZWEI Stellen berichtigt), wird je oc IMMER das lexikografisch
 * kleinste Ziel gewählt — nicht das zuerst in `bBindings` angetroffene (dessen Reihenfolge vom
 * SPARQL-Endpunkt/Netz abhängt, nicht vom Inhalt). Der Marker bildet damit bewusst nur EINE
 * der ggf. mehreren Verknüpfungen ab — vollständig, aber nicht erschöpfend (§8-Ehrlichkeit).
 */
export function baueOcZuRectifiesSr(
  bBindings: SparqlBinding[], zielInfoProOc: ReadonlyMap<string, ZielKlassierung>,
): Map<string, RectifiesInfo> {
  const zielProOc = new Map<string, string>();
  for (const b of bBindings) {
    const oc = b.oc?.value;
    const ziel = b.rectifies?.value;
    if (!oc || !ziel) continue;
    const vorhanden = zielProOc.get(oc);
    if (!vorhanden || ziel < vorhanden) zielProOc.set(oc, ziel);
  }
  const map = new Map<string, RectifiesInfo>();
  for (const [oc, ziel] of zielProOc) {
    const info = zielInfoProOc.get(ziel);
    if (!info) continue;
    map.set(oc, { fremdeSr: info.sr, zielOc: ziel, zielFundstelle: fundstelle(ziel, info.roId) });
  }
  return map;
}

/**
 * Holt für eine Menge von oc-URIs (Ziele eines `jolux:rectifies`) je deren SR-Notation
 * (`jolux:classifiedByTaxonomyEntry` → `skos:notation`, id-systematique-typisiert — sonst
 * greift dieselbe Timeout-Falle wie bei Pfad (b), §0c) UND `historicalId` (für die
 * AS-Fundstellen-Ableitung, Auflage f Gegenprüfung PR #827). VALUES-Batching wie
 * `holeBindingsB`.
 *
 * Deterministisch UNABHÄNGIG von der SPARQL-Antwortreihenfolge (§2, Auflage e Gegenprüfung
 * PR #827): trägt ein oc mehrere id-systematique-Notationen (selten, aber möglich bei
 * Mehrfachklassierung), wird je oc IMMER die lexikografisch kleinste gewählt; bei mehreren
 * `historicalId`-Werten NUR unter der gewählten kleinsten Notation ebenfalls der kleinste.
 */
export async function holeRectifiesSr(
  ocUris: readonly string[], fetchImpl: FetchImpl = fetch,
): Promise<Map<string, ZielKlassierung>> {
  if (!ocUris.length) return new Map();
  const werte = [...new Set(ocUris)].map((u) => `<${u}>`);
  const baueQuery = (valuesInline: string) => `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?oc ?notation ?roId WHERE {
  VALUES ?oc { ${valuesInline} }
  ?oc jolux:classifiedByTaxonomyEntry ?tax .
  ?tax skos:notation ?notation .
  FILTER(DATATYPE(?notation) = ${NOTATION_TYPE})
  OPTIONAL { ?oc <http://cogni.internal.system/model#historicalId> ?roId . }
}`;
  const bindings = await sparqlBatch(werte, baueQuery, { batchGroesse: 40, fetchImpl });
  const zeilenProOc = new Map<string, { notation: string; roId?: string }[]>();
  for (const b of bindings) {
    const oc = b.oc?.value;
    const notation = b.notation?.value;
    if (!oc || !notation) continue;
    const arr = zeilenProOc.get(oc) ?? [];
    arr.push({ notation, roId: b.roId?.value });
    zeilenProOc.set(oc, arr);
  }
  const map = new Map<string, ZielKlassierung>();
  for (const [oc, zeilen] of zeilenProOc) {
    const minNotation = zeilen.reduce((min, z) => (z.notation < min ? z.notation : min), zeilen[0].notation);
    const roIds = zeilen
      .filter((z) => z.notation === minNotation)
      .map((z) => z.roId)
      .filter((v): v is string => !!v)
      .sort();
    map.set(oc, { sr: minNotation, roId: roIds[0] });
  }
  return map;
}

/** Holt die Pfad-(b)-Bindings für die gesamte Grundmenge (VALUES-Batching, §0c). */
export async function holeBindingsB(
  meta: ErlassMeta[],
  fetchImpl: FetchImpl = fetch,
): Promise<SparqlBinding[]> {
  const werte = meta.map((m) => `"${m.sr}"^^${NOTATION_TYPE}`);
  return sparqlBatch(werte, baueQueryB, { batchGroesse: 40, fetchImpl });
}

/**
 * Löst die DE-XML-Manifestation EINER Konsolidierung über die amtliche
 * `isRealizedBy → isEmbodiedBy → isExemplifiedBy`-Kette auf (Skill
 * `scraping-swiss-official-sources`, Rezept 2 — `isExemplifiedBy` ist PRIMÄR, kein
 * String-Template). `consEli` = `cc/<jahr>/<nr>/<YYYYMMDD>` (Konsolidierungs-ELI,
 * NICHT das blosse Abstract). `null`, wenn keine XML-Manifestation existiert (selten).
 */
export async function loeseKonsolidierungsXmlUrl(
  consEli: string, fetchImpl: FetchImpl = fetch,
): Promise<string | null> {
  const query = `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?file WHERE {
  <https://fedlex.data.admin.ch/eli/${consEli}> jolux:isRealizedBy ?expr .
  ?expr jolux:language ${LANG.de} ; jolux:isEmbodiedBy ?manif .
  ?manif jolux:isExemplifiedBy ?file ;
         jolux:userFormat <https://fedlex.data.admin.ch/vocabulary/user-format/xml> .
}`;
  const bindings = await sparqlSelect(query, fetchImpl);
  return bindings[0]?.file?.value ?? null;
}

/**
 * Finding 4b (Netz-Schritt zu `belegtImXml`, s. dort für die Begründung): holt EINMAL den
 * Konsolidierungstext und gibt die Teilmenge von `kandidatOcs` zurück, die darin bereits
 * als `<ref href>` zitiert ist. `kandidatOcs` = oc-URIs, deren `dateForce > korpusStand`
 * WÄRE (over-inclusive ist harmlos — `baueRevisionen` prüft die Bedingung ohnehin erneut).
 * Wirft bei Netz-/Format-Fehler (nie eine falsch-positive Warnung stumm bestehen lassen,
 * indem ein Fehler als «nicht belegt» durchgeht — Soft-404-Falle, Skill-Rezept 3).
 */
export async function ermittleBelegteOcs(
  consEli: string, kandidatOcs: readonly string[], fetchImpl: FetchImpl = fetch,
): Promise<Set<string>> {
  if (!kandidatOcs.length) return new Set();
  const url = await loeseKonsolidierungsXmlUrl(consEli, fetchImpl);
  if (!url) return new Set(); // keine XML-Manifestation → kein Text-Beleg möglich, Marker bleibt stehen
  const res = await fetchImpl(url);
  const typ = res.headers?.get?.('content-type') ?? null;
  const text = await res.text();
  const istAngularShell = text.startsWith('<!DOCTYPE html') || text.includes('<title>Casemates</title>');
  if (!res.ok || (typ !== null && !typ.includes('xml')) || istAngularShell) {
    throw new Error(`Konsolidierungs-XML ${url} nicht abrufbar (Status ${res.status}, Content-Type «${typ}»).`);
  }
  return new Set(kandidatOcs.filter((oc) => belegtImXml(text, oc)));
}

/** Pfad (a): Geltungsstände (dateApplicability) des gepinnten Abstracts eines Erlasses. */
export async function holeStaendeA(abstractEli: string, fetchImpl: FetchImpl = fetch): Promise<string[]> {
  const query = `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?date WHERE { ?c jolux:isMemberOf <https://fedlex.data.admin.ch/eli/${abstractEli}> ; jolux:dateApplicability ?date . } ORDER BY ?date`;
  const bindings = await sparqlSelect(query, fetchImpl);
  return bindings.map((b) => b.date?.value).filter((d): d is string => !!d);
}

// ── Pfad (c): Rechtsanalyse «Auswirkungen» + Geltungsfenster je Abstract ────────────
// WAF-FALLE (live 23.9.2026): der Endpunkt steht hinter einer Web-Application-Firewall
// des BIT, die SQL-ähnliche Abfragen mit HTTP 400 + HTML-Seite «Web Page Blocked!»
// abweist. Ausgelöst hat es eine Variable `?from` direkt nach `SELECT DISTINCT` (liest
// sich wie SQL `SELECT DISTINCT … FROM … WHERE`); dieselbe Abfrage mit `?quelle` läuft.
// Darum heissen die Variablen hier nie `?from`/`?select`/`?where`.
const B_ELI = 'https://fedlex.data.admin.ch/eli/';
/** Ergebnis-Obergrenze, ab der ein Batch als möglicherweise gekappt gilt (Skill
 *  `scraping-swiss-official-sources`, Falle 4: Teilresultate sehen vollständig aus). */
const KAPPUNG_VERDACHT = 10000;

/** Geltungsfenster + Stammerlass je Abstract (`cc/…`). */
export async function holeAbstractStamm(
  abstractElis: readonly string[], fetchImpl: FetchImpl = fetch,
): Promise<Map<string, { basicAct?: string; inkrafttreten?: string; aufhebung?: string }>> {
  const werte = [...new Set(abstractElis)].map((a) => `<${B_ELI}${a}>`);
  const bindings = await sparqlBatch(werte, (v) => `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?abs ?basic ?inkraft ?aufgehoben WHERE { VALUES ?abs { ${v} }
  OPTIONAL { ?abs jolux:basicAct ?basic . }
  OPTIONAL { ?abs jolux:dateEntryInForce ?inkraft . }
  OPTIONAL { ?abs jolux:dateNoLongerInForce ?aufgehoben . } }`, { batchGroesse: 40, fetchImpl });
  const out = new Map<string, { basicAct?: string; inkrafttreten?: string; aufhebung?: string }>();
  for (const b of bindings) {
    const abs = b.abs?.value?.slice(B_ELI.length);
    if (!abs) continue;
    const e = out.get(abs) ?? {};
    // Deterministisch bei Mehrfachwerten: kleinster Wert (lexikografisch/ISO).
    const min = (alt: string | undefined, neu: string | undefined) => (neu && (!alt || neu < alt) ? neu : alt);
    e.basicAct = min(e.basicAct, b.basic?.value);
    e.inkrafttreten = min(e.inkrafttreten, b.inkraft?.value?.slice(0, 10));
    e.aufhebung = min(e.aufhebung, b.aufgehoben?.value?.slice(0, 10));
    out.set(abs, e);
  }
  return out;
}

/** Alle Auswirkungen auf Teile der Abstracts (Batch ≤ 5 Abstracts; OR allein 997 Zeilen). */
export async function holeAuswirkungen(
  abstractElis: readonly string[], fetchImpl: FetchImpl = fetch,
): Promise<Map<string, AuswirkungZeile[]>> {
  const werte = [...new Set(abstractElis)].sort().map((a) => `<${B_ELI}${a}>`);
  const out = new Map<string, AuswirkungZeile[]>();
  for (let i = 0; i < werte.length; i += 5) {
    const teil = werte.slice(i, i + 5);
    const bindings = await sparqlSelect(`PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?abs ?ausw ?quelle ?typ ?datum ?fassung WHERE { VALUES ?abs { ${teil.join(' ')} }
  ?ziel jolux:legalResourceSubdivisionIsPartOf ?abs .
  ?ausw jolux:impactToLegalResource ?ziel ; jolux:impactFromLegalResource ?quelle ; jolux:legalResourceImpactHasType ?typ .
  OPTIONAL { ?ausw jolux:legalResourceImpactHasDateEntryInForce ?datum . }
  OPTIONAL { ?ausw jolux:impactConsolidatedBy ?fassung . } }`, fetchImpl);
    if (bindings.length >= KAPPUNG_VERDACHT) {
      throw new Error(`holeAuswirkungen: ${bindings.length} Zeilen in einem Batch — Kappungsverdacht, kleiner batchen.`);
    }
    for (const b of bindings) {
      const abs = b.abs?.value?.slice(B_ELI.length);
      const oc = ocWurzel(b.quelle?.value ?? '');
      const typ = Number(/impact-type\/(\d+)$/.exec(b.typ?.value ?? '')?.[1]);
      if (!abs || !oc || !Number.isInteger(typ)) continue;
      const arr = out.get(abs) ?? [];
      const f = /\/(\d{4})(\d{2})(\d{2})$/.exec(b.fassung?.value ?? '');
      const zeile: AuswirkungZeile = { oc, typ, datum: b.datum?.value?.slice(0, 10) };
      if (f) zeile.fassung = `${f[1]}-${f[2]}-${f[3]}`;
      arr.push(zeile);
      out.set(abs, arr);
    }
  }
  // Deterministisch (§2): Duplikate (dieselbe Auswirkung je Sprache/Teil) weg, sortiert.
  for (const [abs, arr] of out) {
    const seen = new Set<string>();
    const schluessel = (a: AuswirkungZeile) => `${a.oc}|${String(a.typ).padStart(3, '0')}|${a.datum ?? ''}|${a.fassung ?? ''}`;
    const uniq = arr.filter((a) => { const k = schluessel(a); if (seen.has(k)) return false; seen.add(k); return true; });
    uniq.sort((x, y) => (schluessel(x) < schluessel(y) ? -1 : schluessel(x) > schluessel(y) ? 1 : 0));
    out.set(abs, uniq);
  }
  return out;
}

/** Stammdaten (Datum, Fundstelle, Titel) für oc, die nur Pfad (c) kennt. */
export async function holeOcStamm(ocUris: readonly string[], fetchImpl: FetchImpl = fetch): Promise<Map<string, OcStamm>> {
  const werte = [...new Set(ocUris)].sort().map((u) => `<${u}>`);
  const bindings = await sparqlBatch(werte, (v) => `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?oc ?dateForce ?dateDoc ?roId ?titleDe ?titleFr ?titleIt WHERE { VALUES ?oc { ${v} }
  OPTIONAL { ?oc jolux:dateEntryInForce ?dateForce . }
  OPTIONAL { ?oc jolux:dateDocument ?dateDoc . }
  OPTIONAL { ?oc <http://cogni.internal.system/model#historicalId> ?roId . }
  OPTIONAL { ?oc jolux:isRealizedBy ?ede . ?ede jolux:language ${LANG.de} ; jolux:title ?titleDe . }
  OPTIONAL { ?oc jolux:isRealizedBy ?efr . ?efr jolux:language ${LANG.fr} ; jolux:title ?titleFr . }
  OPTIONAL { ?oc jolux:isRealizedBy ?eit . ?eit jolux:language ${LANG.it} ; jolux:title ?titleIt . } }`, { batchGroesse: 40, fetchImpl });
  const out = new Map<string, OcStamm>();
  // Deterministisch bei Mehrfachwerten: min dateForce, sonst kleinster Wert je Feld.
  const min = (alt: string | undefined, neu: string | undefined) => (neu && (!alt || neu < alt) ? neu : alt);
  for (const b of bindings) {
    const oc = b.oc?.value;
    if (!oc) continue;
    const s = out.get(oc) ?? {};
    s.dateForce = min(s.dateForce, b.dateForce?.value?.slice(0, 10));
    s.dateDoc = min(s.dateDoc, b.dateDoc?.value);
    s.roId = min(s.roId, b.roId?.value);
    s.titelDe = min(s.titelDe, b.titleDe?.value);
    s.titelFr = min(s.titelFr, b.titleFr?.value);
    s.titelIt = min(s.titelIt, b.titleIt?.value);
    out.set(oc, s);
  }
  return out;
}

/** Byte-deterministische Serialisierung eines Sidecars (2-Space + Trailing-Newline). */
export function serialisiere(sidecar: RevisionSidecar): string {
  return JSON.stringify(sidecar, null, 2) + '\n';
}
