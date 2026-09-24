// ─── Die eine generische Bezugs-Schicht (W2·7-BEZUG, B1+B2+B3) ──────────────
//
// EIN Bau, zwei Projektionen (§5):
//
//   baueBezugsIndex(auswahl)
//        ├── projiziereBundesgericht()  → proNormArtikel / norm-index-Shards
//        │                                (BESTANDS-Artefakte, byte-gleich)
//        └── baueBezugsShards()         → public/rechtsprechung/bezuege/<key>.json
//                                         (alle Facetten-Klassen, B4-Nutzlast)
//
// Es gibt keinen zweiten Rechenweg. Dass die Bundesgerichts-Projektion mit dem
// Bestand übereinstimmt, ist darum keine Behauptung, sondern der byte-gleiche
// Regen von norm-index.json — und zusätzlich eine eigene Prüfung im Tor
// check:bezuege (§6.7: das Tor kann scheitern, und es zeigt, woran).
//
// ── WAS DIESER SCHRITT AM BESTAND ÄNDERT — und was nicht (§8) ───────────────
// NICHT geändert: `normKeys`, `proNorm`, `proNormArtikel`, die 156 norm-index-
// Shards, register.json, richter.json. Alle bleiben byte-gleich.
// NEU: die bezuege-Shards. Sie enthalten dieselben Bundesgerichts-Kanten PLUS
// die kantonalen Kanten PLUS die Facetten. Die Doppelung der Bundes-Kanten auf
// der Platte ist bewusst: die Laufzeit-Last des ArtikelLesers (§15) darf nicht
// steigen, solange die Filter-UI (B4) sie gar nicht abruft — der bestehende
// Shard bleibt darum exakt so schwer wie vorher, und der neue wird erst geladen,
// wenn jemand die Facetten einschaltet.
//
// ── BENANNTE FUNDSTELLE, NICHT HIER GEFIXT (Gegenprüfung Runde 5/F3) ────────
// `bezuege/BETMG.json` führt an Art. 305bis den Basler Entscheid SB.2020.92 —
// das BetmG hat keinen Art. 305bis (das ist die Geldwäscherei-Norm des StGB).
// Ursache liegt NICHT in dieser Bau-Einheit: der vorbestehende Kanal
// `artikelSchluesselMitBefund` (W2·6-NKEY) erzeugt aus einer Nennung der Form
// «Art. 305bis … StGB» im selben Glied BEIDE Register-keys, STGB und BETMG.
// Der Fix gehört in diesen Kanal und ändert `proNormArtikel` — also ein eigener,
// deklarierter Schritt (§14/§6.3), wie EPG/IRSG und die Literatur-Phantome des
// `zitierteNormen`-Zweigs. Sichtbar bleibt er über den Bundes-Existenz-Abgleich
// in check:bezuege; die 26 ausschliesslich-kantonalen Buckets stehen dort.
//
// ── FLIESSTEXT-LITERATUR-PHANTOME, benannt (Runde 7/H3, §8) ─────────────────
// 39 der NEUEN kantonalen Kanten auf Bundes-Shards stehen an einem Artikel, der
// im Entscheidtext nur als ANFANG eines Bereichszitats im Literatur-Kontext
// vorkommt: ZGB/1 ← ZB.2023.65 («Handkommentar …, Art. 1-456 ZGB») · DBG/102 ·
// OR/253 («vor Art. 253-273c OR N 4»). Die Spannen-Regel der Literatur-Klasse
// fängt sie nicht (kein «zu Art.»-Anker), und der Existenz-Abgleich sieht sie
// nicht, weil der Artikel real existiert.
// ABGRENZUNG, weil hier schon einmal falsch attribuiert wurde: diese 39 stammen
// aus dem FLIESSTEXT-Zweig und sind neu — nicht aus dem `zitierteNormen`-Zweig
// (bei ZB.2023.65 ist `zitierteNormen` leer) und nicht Teil der 158 Phantome auf
// main. Es ist eine SCHÄRFUNG derselben benannten Klasse, kein neuer Defekt.
// Nicht gefixt: ein Marker auf den blossen Werktitel hätte keine verlässliche
// Spannen-Grenze (Begründung bei LITERATUR_MARKER in entscheide-mapping.ts) —
// eigener Schritt, gleiche Behandlung wie die übrigen benannten Klassen.
//
// ── B7: DER AUSLIEFERUNGS-DECKEL «8 JE STATUS» IST WEG ──────────────────────
// `baueBezugsShards` liefert seit B7 JEDE Kante eines Artikels aus; die
// Anzeige-Ordnung innerhalb einer Status-Klasse ist rein CHRONOLOGISCH
// (neu → alt), nicht mehr «gewicht, dann Datum». Begründung, Abgrenzung zur
// Bundesgerichts-Projektion und die Herkunft des Auftrags stehen an den beiden
// Stellen, die es angeht: `vergleicheDatumAbsteigend` (facetten.ts) für die
// Ordnung, der Kommentarblock anstelle von `DECKEL_JE_STATUS` (ebenda) für den
// Deckel. Die Bundesgerichts-Projektion (`projiziereBundesgericht`) ist davon
// UNBERÜHRT — sie sortiert die gefilterte Menge selbst mit der Bestands-Ordnung
// und kappt weiterhin auf acht; norm-index.json bleibt byte-gleich.
//
// ── DREI GRÖSSEN, DIE MAN NICHT VERWECHSELN DARF ────────────────────────────
//  · `status`         — die Facetten-Klasse einer Kante (bge/bger/eidg/kantonal).
//                       Sie steuert die Gruppierung und die Anzeige-Ordnung.
//  · `gewichtsGruppe` — innerhalb welcher Menge die topische In-degree gezählt
//                       wird. NICHT dasselbe wie `status`: bge und bger zählen
//                       GEMEINSAM (beide sind das Bundesgericht, und ein BGE, der
//                       von einem unpublizierten Urteil zitiert wird, ist dadurch
//                       zentral). Trennte man sie, änderte sich `gewicht` im
//                       Bestand — der Umbau wäre nicht mehr verhaltensneutral.
//  · `leitcharakter`  — das Bestandsfeld ('leitentscheid'|'routine'). Es speist
//                       `status`, ersetzt ihn aber nicht (§8, siehe facetten.ts).

import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';
import type { LeitfallRef } from '../../src/lib/rechtsprechung/norm-index';
import {
  STATUS_RANG, facettenFuerEntscheid, vergleicheDatumAbsteigend,
  type BezugStatus, type BezugsFacetten,
} from '../../src/lib/verzahnung/facetten';
import { artikelSchluesselMitBefund, artikelSchluesselVonSnapshot, fliesstextOhneApparat, fremdDefinierteKeys } from './entscheide-mapping';
import { keyVon, kanonZitat, selbstTokens } from './entscheide-identitaet';
import { baueNummernDominanz, ladeKantonBestand, ladeKantonTitel, loeseKantonZitate, type KantonBestand } from './kanton-norm-resolver';

/** EINE Kante Norm-Artikel → Dokument, mit ihren Facetten (B1). */
export interface BezugsKante {
  key: string;
  zitierung: string;
  regesteKurz: string | null;
  datum: string;
  /**
   * Topische In-degree INNERHALB der Gewichts-Gruppe (siehe Modul-Kopf). Nie
   * «Autorität», nie ein Ranking über Gruppen hinweg — die Zahl eines kantonalen
   * Entscheids und die eines BGE sind nicht vergleichbar und werden darum auch
   * nie gegeneinander sortiert (§8).
   *
   * `null` = NICHT MESSBAR, nicht «null Zitierungen» (Gegenprüfung Runde 1/B3).
   * Der Zitier-Graph wird über `kanonZitat` gebildet, und das kennt genau zwei
   * Formen: BGE-Fundstellen («150 I 17») und Bundesgerichts-Aktenzeichen
   * («1C_641/2022»). Kantonale Geschäftsnummern («BES.2026.15», «VD.2025.133»)
   * und die Nummern der übrigen eidg. Gerichte treffen keine davon — die
   * Token-Map dieser Gruppen bleibt leer, und JEDE Kante bekäme rechnerisch 0.
   * GEMESSEN am committeten Korpus: kantonal 12'316 Kanten, davon gewicht > 0
   * in genau 0 Fällen; eidg 164 Kanten, ebenfalls 0. Zum Vergleich bge: 2'594
   * von 11'433 über 0, Maximum 83.
   * Eine 0 auszuliefern hiesse zu behaupten, diese Entscheide würden von
   * niemandem zitiert. Das ist keine Messung, sondern eine Lücke in der
   * Messvorrichtung — und Lücken werden ausgewiesen, nicht als Messwert
   * verkauft (§8). Die Sortierung fällt in diesen Klassen damit sichtbar auf den
   * nachrangigen Schlüssel (Datum ↓, dann key) zurück.
   */
  gewicht: number | null;
  facetten: BezugsFacetten;
  /**
   * B-1 (W2·29-WERKBANK-LESER D2): das Datum ist ein Platzhalter (<Jahr>-01-01),
   * die Quelle nennt kein Entscheiddatum. Nur gesetzt, wenn wahr — sonst fehlt
   * das Feld (Bestand byte-gleich). Ordnet die Kante ans ENDE ihrer Klasse.
   */
  datumUnbekannt?: true;
  /**
   * E-1: der Artikel steht NUR in einer nicht in der amtlichen Sammlung
   * publizierten Erwägung des Urteils. Die Kante zeigt dann nicht auf den BGE,
   * sondern auf das vollständige Urteil (`<bge-key>__voll`, Register-Verweis mit
   * Voll-Ansicht) — siehe `unpublizierteSchluessel`.
   */
  unpubliziert?: { bge: string; urteil: string };
  /** E-1: Erwägungs-Marken des Volltexts, in denen der Artikel steht («E. 3.2»). */
  erwaegungen?: string[];
}

/** Dokument-Kopf im Shard — EINMAL je Dokument, nicht je Artikel (§15). */
export interface BezugsDokument {
  zitierung: string;
  regesteKurz: string | null;
  datum: string;
  facetten: BezugsFacetten;
  /** Nur gesetzt, wenn wahr (B-1): Platzhalter-Datum, Quelle ohne Entscheiddatum. */
  datumUnbekannt?: true;
  /** Nur gesetzt bei E-1-Kanten: BGE-Fundstelle und Aktenzeichen des Volltext-Urteils. */
  unpubliziert?: { bge: string; urteil: string };
}

/**
 * Kanten-Eintrag: Verweis auf den Dokument-Kopf + das artikel-lokale Gewicht.
 * `gewicht: null` = in dieser Facetten-Klasse nicht messbar (Begründung bei
 * `BezugsKante.gewicht`) — nicht «null Zitierungen».
 */
export interface BezugsEintrag {
  key: string;
  gewicht: number | null;
  /** Nur bei E-1-Kanten: die Erwägungen des Volltexts, in denen DIESER Artikel steht. */
  erwaegungen?: string[];
}

/**
 * Ein Bezugs-Shard je Erlass — Bundes- wie Kantonserlass.
 *
 * ── WARUM DIE DOKUMENT-KÖPFE AUSGELAGERT SIND (§15, Logikverlust: keiner) ───
 * In der ersten Fassung trug jede Kante ihren vollen Kopf (Zitierung, Kurzzeile,
 * Datum, fünf Facetten-Felder). GEMESSEN am STPO-Shard: 3'207 Kanten, aber nur
 * 957 verschiedene Dokumente — jedes stand im Schnitt 3,4-mal vollständig da,
 * die Datei 1'676 KB. Ein Dokument, das zu 20 Artikeln eines Erlasses etwas
 * sagt, ist trotzdem EIN Dokument.
 * Die Auslagerung ist reine Serialisierung: dieselben Kanten, dieselbe
 * Reihenfolge, dieselben Facetten, dieselben Gewichte — nur einmal statt n-mal
 * geschrieben. Keine Regel, keine Frist, keine Zuordnung ändert sich (§15-Pflicht
 * zur Logikverlust-Bewertung: null).
 */
export interface BezugsShard {
  erzeugt: string;
  /** Erlass-key: Bundes-Register-key ('OR') oder kantonaler Snapshot-key ('BS-154.100'). */
  erlass: string;
  /** Ebene des ERLASSES (nicht des Dokuments) — 'BS-154.100' ist kantonal. */
  erlassEbene: 'bund' | 'kanton';
  /** Dokument-key → Kopf. Enthält genau die im Shard referenzierten Dokumente. */
  dokumente: Record<string, BezugsDokument>;
  /** Artikel-Token → ALLE Kanten in Anzeige-Ordnung (Status-Rang, dann Datum ↓). */
  proArtikel: Record<string, BezugsEintrag[]>;
  /**
   * Kanten je Artikel und Status. Seit B7 (Deckel aufgehoben) ist die Zahl
   * IDENTISCH mit der Länge der ausgelieferten Liste dieser Klasse — und genau
   * so prüft sie das Tor check:bezuege: `gelieferte Kanten je Status ==
   * gesamtProArtikel`. Eine Abweichung heisst, dass irgendwo doch wieder
   * ausgesiebt wird, und das soll rot werden, nicht still bleiben (§6.7).
   *
   * WARUM DAS FELD TROTZDEM BLEIBT, obwohl es nichts mehr einschränkt:
   *  1. Es ist die GEGENRECHNUNG zur Liste — eine Vollständigkeits-Behauptung,
   *     die sich prüfen lässt, statt einer, die man glauben muss (§6).
   *  2. Es ist die BEZUGSGRÖSSE der UI-Zähler, sobald ein Zeit- oder
   *     Kantonsfilter die Anzeige verkürzt: «12 von 30 im Zeitraum» braucht die
   *     30, und die 30 darf nicht mit dem Filter mitschrumpfen (§8).
   */
  gesamtProArtikel: Record<string, Partial<Record<BezugStatus, number>>>;
}

/** Rohbau: Artikel-Schlüssel → ALLE Kanten (ungedeckelt), plus Bilanz. */
export interface BezugsIndex {
  /** Schlüssel 'ERLASS/artikel' → Kanten, je Status sortiert, UNGEDECKELT. */
  proArtikel: Map<string, BezugsKante[]>;
  /**
   * N0a — die GEGENRICHTUNG von `proArtikel` auf Erlass-Ebene: Entscheid-key →
   * zitierte kantonale Erlass-keys ('BS-154.100'), sortiert, dedupliziert.
   * Nur Entscheide mit mindestens einem Treffer stehen drin (§8: kein leerer
   * Eintrag, der Abdeckung vortäuscht).
   *
   * WARUM EIGENE PROJEKTION UND NICHT `register.json`. Gemessen 31.8.2026:
   * `public/rechtsprechung/register.json` steht bei 775'070 B gzip-6 gegen die
   * 780-KB-Schranke (97.0 %, 23'650 B Luft); die Projektion kostet ~15.1 KB
   * gzip und liesse 1 % übrig. Der Kommentar an `DATEN_BUDGET`
   * (scripts/check-perf-budget.ts) benennt genau diesen Ausweg als die
   * vorgesehene Folgearbeit — die Schranke anzuheben, weil man an sie stösst,
   * wäre ihr Gegenteil (§8).
   */
  kantonNormKeys: Map<string, string[]>;
  befund: BezugsBefund;
}

export interface BezugsBefund {
  /** Snapshots je Status-Klasse (Grundgesamtheit der Extraktion). */
  snapshotsJeStatus: Record<string, number>;
  /** Kanten je Status-Klasse, VOR dem Deckel. */
  kantenJeStatus: Record<string, number>;
  /** Kantonale (Erlass, Artikel)-Zitate je Auflösungskanal. */
  kantonalJeKanal: Record<string, number>;
  /** §-Gruppen ohne auflösbare Erlass-Seite (benannte Lücke, §8). */
  kantonalOhneErlass: number;
  /** Dokumentlokale Abkürzungen, die wegen Bundes-Namensvetter NICHT gebunden wurden. */
  abkAusgeschlossen: string[];
  /** Systematik-Nummern, deren Erlass nicht im Normtext-Bestand steht. */
  nummerOhneBestand: string[];
  /** Kantone mit Entscheiden, aber ohne deklarierten Systematik-Präfix. */
  kantoneOhneResolver: string[];
  /** Als Quell-Tippfehler verworfene Systematik-Nummern (B2-Riegel). */
  nummerMinderheit: string[];
  /** Register-keys, die das Dokument selbst anders definiert (B1-Riegel). */
  fremdVerworfen: string[];
  /** Literatur-Verwurf über die NICHT-bundesgerichtlichen Snapshots (Ergänzung zu §6.7). */
  literaturVerwurfUebrige: { paare: number; nennungen: number; spannen: number };
  /** E-7: als textgleiche Dublette verworfene Snapshots («verworfen ← behalten»). */
  dublettenVerworfen: string[];
  /** E-1: (Artikel-Schlüssel, BGE)-Paare, die auf das Volltext-Urteil umgelenkt wurden. */
  unpubliziertUmgelenkt: number;
}

/**
 * Gewichts-Gruppe eines Snapshots — die Menge, innerhalb derer Zitierungen
 * gezählt werden. Bundesgericht als EINE Gruppe (Begründung im Modul-Kopf), die
 * übrigen eidg. Gerichte als eine, jeder Kanton für sich: ein Zürcher
 * Obergerichtsurteil sagt nichts über die Zentralität eines Basler Entscheids.
 */
function gewichtsGruppe(s: { gerichtstyp: string; kanton: string }): string {
  if (s.gerichtstyp === 'bundesgericht') return 'bundesgericht';
  if (s.kanton === 'CH') return 'eidg';
  return `kanton:${s.kanton}`;
}

/**
 * Ist die topische In-degree in dieser Gruppe überhaupt MESSBAR?
 *
 * Nur für das Bundesgericht: `kanonZitat` erkennt BGE-Fundstellen und
 * Bundesgerichts-Aktenzeichen, sonst nichts. In allen anderen Gruppen bleibt die
 * Token-Map leer, und ein berechnetes Gewicht wäre für jede Kante 0 — eine Zahl,
 * die wie ein Messergebnis aussieht und keines ist (§8, Begründung bei
 * `BezugsKante.gewicht`).
 *
 * DIE ALTERNATIVE, bewusst nicht gewählt: die Geschäftsnummern-Formen der
 * Kantone in `kanonZitat` aufnehmen. Das ist ein eigener fachlicher Schritt —
 * die Formen sind kantonal verschieden («BES.2026.15», «VB.2018.00411»,
 * «ZR12024196»), kollidieren mit den bestehenden Docket-Mustern und brauchen
 * ihre eigene FP-Analyse. Bis dahin ist `null` die ehrliche Auskunft.
 */
function gewichtMessbar(gruppe: string): boolean {
  return gruppe === 'bundesgericht';
}

/**
 * Totale Ordnung INNERHALB einer Status-Klasse (§2). Identisch zu
 * `vergleicheLeitfaelle` in entscheide-schreiben.ts — dort ist sie exportiert und
 * wird hier per Parameter hereingereicht, statt sie zu kopieren (§5). Der Import
 * läuft in diese Richtung, weil entscheide-schreiben.ts der Schreiber ist und
 * dieses Modul der Rechner: der Rechner darf den Schreiber nicht importieren
 * (Zyklus, check:zyklen).
 */
export type KantenOrdnung = (a: LeitfallRef, b: LeitfallRef) => number;

// ── E-7: TEXTGLEICHE DUBLETTEN (W2·29-WERKBANK-LESER D2, gemessen 23.9.2026) ──
//
// BEFUND: das BS-Portal publiziert einzelne Entscheide ZWEIMAL — zwei Dokumente
// (eigener nF30_KEY, eigene AG-Nummer), gleiche Geschäftsnummer, gleiches Datum,
// derselbe Text bis auf Weissraum. Beleg: VD.2025.54, nF30_KEY 78498 (AG.2025.342)
// und 78499 (AG.2025.343). Der Import führt beide korrekt (ein Snapshot je
// Portal-Dokument, Count-Gate check:bs-entscheide), die Bezugs-Linie am Artikel
// zeigte denselben Entscheid aber doppelt.
//
// DIE REGEL (Identität, keine Ähnlichkeit, §1): gleiches Gericht, gleiche
// Nummer, gleiches Datum UND derselbe Text nach Weissraum-Normalisierung (NBSP,
// U+202F, Soft-Hyphen, Zeilenumbruch → ein Leerzeichen). Behalten wird der
// Snapshot mit der kleinsten id (bei BS das Dokument mit der blanken GN nach der
// Kollisionsregel §3.2), die übrigen tragen keine Artikel-Kante. Ihre eigene
// Seite, ihr Register-Eintrag und ihre Kantons-Erlass-Liste bleiben — nur die
// Bezugs-Linie zeigt den Entscheid einmal.
//
// BEWUSST NICHT ZUSAMMENGEFÜHRT: Dokumente gleicher Nummer und gleichen Datums
// mit ABWEICHENDEM Text (gemessen: BEZ.2023.46, HB.2023.48, SB.2024.12 —
// Fassungen mit geändertem Dispositiv bzw. Ziffern; SB.2022.97 — verschiedene
// Beschuldigte). Welche Fassung gilt, ist eine fachliche Frage, keine
// Identitätsfrage; beide bleiben sichtbar (§8).
const weissraum = (t: string): string => t.replace(/[\s\u00a0\u202f\u00ad]+/g, ' ').trim();

function textIdentitaet(s: EntscheidSnapshot): string {
  const bl = [...(s.abschnitte ?? []), ...(s.auszugAbschnitte ?? [])]
    .flatMap((a) => a.bloecke.map((b) => weissraum(b.text)));
  return `${s.gericht}\u0000${s.nummer}\u0000${s.datum}\u0000${bl.join('\u0001')}`;
}

/** Snapshot-id → id des behaltenen Zwillings, nur für verworfene Dubletten. Rein (§2). */
export function textgleicheDubletten(auswahl: readonly EntscheidSnapshot[]): Map<string, string> {
  const gruppen = new Map<string, string[]>();
  for (const s of auswahl) {
    const k = textIdentitaet(s);
    const g = gruppen.get(k) ?? (gruppen.set(k, []), gruppen.get(k)!);
    g.push(s.id);
  }
  const out = new Map<string, string>();
  for (const ids of gruppen.values()) {
    if (ids.length < 2) continue;
    const sortiert = [...ids].sort();
    for (const id of sortiert.slice(1)) out.set(id, sortiert[0]);
  }
  return out;
}

// ── E-1: ARTIKEL NUR IN EINER NICHT PUBLIZIERTEN ERWÄGUNG ────────────────────
//
// BEFUND (Prüfrunde 1, reproduziert 23.9.2026): BGE 152 III 23 stand als
// «Leitentscheid» an Art. 336c OR. Art. 336c steht aber weder in der Regeste
// noch im publizierten Auszug (E. 2), sondern nur in E. 3 des vollständigen
// Urteils 4A_221/2025 — einer Erwägung, die NICHT in die amtliche Sammlung
// aufgenommen wurde. Die Extraktion las bisher Volltext und Auszug gemeinsam.
//
// DIE REGEL: für einen BGE mit getrenntem Volltext (`azaUrteil` + `auszugAbschnitte`
// — genau die BGE, für die das Register einen `<key>__voll`-Verweis führt) gilt
// ein Artikel als PUBLIZIERT, wenn ihn Regeste oder Auszug nennen, und als
// NUR-UNPUBLIZIERT, wenn ihn ausschliesslich der Volltext nennt. Nur-unpublizierte
// Kanten zeigen auf das vollständige Urteil: key `<bge-key>__voll` (der Register-
// Verweis leitet mit Voll-Ansicht und ?norm= auf die Detailseite), Klasse 'bger',
// Zitierung «Urteil <Aktenzeichen> (nicht publ. in BGE <Fundstelle>)», keine
// BGE-Regeste als Kurzzeile (die gehört zum publizierten Teil). Die
// Erwägungs-Marken stehen je Artikel an der Kante (`erwaegungen`).
// Ein Artikel, den `zitierteNormen` trägt, der aber in KEINEM Text steht, bleibt
// unverändert am BGE — dort ist nicht belegbar, wo er steht (§7).
//
// GEWICHT: die In-degree wird für das Urteil als Ganzes gemessen (der Zitier-Graph
// führt BGE-Fundstelle und Aktenzeichen auf denselben Snapshot); sie gilt für
// beide Kanten. Eine Trennung nach Zitierform ist ein eigener Schritt.
export function unpublizierteSchluessel(
  s: EntscheidSnapshot,
  schluessel: ReadonlySet<string>,
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  if (s.gericht !== 'bge' || !s.azaUrteil || !s.auszugAbschnitte?.length || !s.bgeReferenz) return out;
  // Nur wenn der Auszug überhaupt Erwägungen trägt. GEMESSEN 23.9.2026: bei 32
  // der 1'252 BGE mit getrenntem Volltext enthält `auszugAbschnitte` nur den
  // Sachverhalt (z. B. 151 II 312: 1'620 Zeichen, keine Erwägung) — der Auszug
  // ist dort unvollständig erfasst, nicht der BGE ohne Erwägungen. «Nicht im
  // Auszug» wäre dann keine Aussage über die Publikation; die Kanten bleiben am
  // BGE (§7: nur umlenken, was belegt ist).
  if (!s.auszugAbschnitte.some((a) => a.typ === 'erwaegung')) return out;
  const publiziert = artikelSchluesselVonSnapshot({ ...s, zitierteNormen: [], abschnitte: [] });
  const volltext = artikelSchluesselVonSnapshot({ ...s, zitierteNormen: [], regeste: null, auszugAbschnitte: [] });
  const kandidaten = [...schluessel].filter((k) => !publiziert.has(k) && volltext.has(k)).sort();
  if (!kandidaten.length) return out;
  for (const k of kandidaten) out.set(k, []);
  // Erwägungs-Marken: je Block des Volltexts dieselbe Extraktion (§5), nur auf
  // diesen einen Block beschränkt.
  for (const a of s.abschnitte) {
    if (a.typ !== 'erwaegung') continue;
    for (const b of a.bloecke) {
      if (!b.marke) continue;
      const imBlock = artikelSchluesselVonSnapshot({
        ...s, zitierteNormen: [], regeste: null, auszugAbschnitte: [], abschnitte: [{ typ: a.typ, bloecke: [b] }],
      });
      for (const k of kandidaten) {
        const liste = out.get(k)!;
        if (imBlock.has(k) && !liste.includes(b.marke)) liste.push(b.marke);
      }
    }
  }
  return out;
}

/**
 * Der EINE Bau. Rein und deterministisch (§2): gleiche Snapshot-Folge + gleicher
 * kantonaler Erlass-Bestand → gleiche Ausgabe, in stabiler Ordnung.
 *
 * `kantonBestaende` wird hereingereicht statt hier geladen, damit die Funktion
 * ohne Dateisystem testbar bleibt (die Lade-Funktion steht im Resolver).
 */
export function baueBezugsIndex(
  auswahl: readonly EntscheidSnapshot[],
  kantonBestaende: ReadonlyMap<string, KantonBestand>,
  ordnung: KantenOrdnung,
  /**
   * Kurzzeile eines Snapshots. Wird hereingereicht statt hier gerechnet, weil
   * die Regel (amtliche Regeste, sonst BS-Betreff) EINE Stelle hat und die ist
   * `manifestRegesteKurz` im Schreiber (§5) — sie hier nachzubauen hätte schon
   * einmal alle 3765 BS-Kurzzeilen gelöscht.
   */
  kurzzeile: (s: EntscheidSnapshot) => string | null,
  /** Repo-Wurzel — für die amtlichen Erlass-Titel der kantonalen Riegel (B1/B2). */
  wurzel: string = process.cwd(),
): BezugsIndex {
  const snapshotsJeStatus: Record<string, number> = {};
  const kantenJeStatus: Record<string, number> = {};
  const kantonalJeKanal: Record<string, number> = {};
  const abkAusgeschlossen = new Set<string>();
  const nummerOhneBestand = new Set<string>();
  const nummerMinderheit = new Set<string>();
  const fremdVerworfen = new Set<string>();
  const kantonNormKeys = new Map<string, string[]>();
  let kantonalOhneErlass = 0;
  const literaturVerwurfUebrige = { paare: 0, nennungen: 0, spannen: 0 };

  // Korpus-dominante Abkürzung→Nummer-Bindung je Kanton, VOR dem Einzeldurchgang
  // (Tippfehler-Riegel B2). Zwei Durchgänge, weil «mehrheitlich» eine Aussage
  // über den Korpus ist und kein Dokument sie allein treffen kann.
  const dominanz = new Map<string, Map<string, string>>();
  const kantonTitel = new Map<string, Map<string, string>>();
  for (const kanton of kantonBestaende.keys()) {
    const texte: string[] = [];
    for (const s of auswahl) if (s.kanton === kanton) texte.push(fliesstextOhneApparat(s));
    dominanz.set(kanton, baueNummernDominanz(texte, kanton));
    kantonTitel.set(kanton, ladeKantonTitel(wurzel, kanton));
  }

  // ── Durchgang 1: je Snapshot Facetten, Artikel-Schlüssel und Selbst-Tokens ──
  interface Eintrag {
    key: string;
    /** Snapshot-key, unter dem die In-degree gezählt wird (bei `__voll` der BGE). */
    gewichtKey: string;
    ref: Omit<BezugsKante, 'gewicht' | 'erwaegungen'>;
    gruppe: string;
    status: BezugStatus;
    schluessel: Set<string>;
    /** E-1: Erwägungs-Marken je Artikel-Schlüssel (nur `__voll`-Einträge). */
    erwaegungen?: Map<string, string[]>;
  }
  const eintraege: Eintrag[] = [];
  const dubletten = textgleicheDubletten(auswahl);
  const dublettenVerworfen: string[] = [];
  let unpubliziertUmgelenkt = 0;
  for (const s of auswahl) {
    const facetten = facettenFuerEntscheid(s);
    const status = facetten.status;
    snapshotsJeStatus[status] = (snapshotsJeStatus[status] ?? 0) + 1;

    // BUNDESRECHTLICHE Artikel-Schlüssel — für JEDEN Snapshot, auch kantonale.
    // Genau das ist der Kern von B2: ein Basler Entscheid, der Art. 41 OR
    // anwendet, gehört an Art. 41 OR. Dass er das aus kantonaler Instanz tut,
    // steht in der Facette, nicht in einem Ausschluss.
    const befund = artikelSchluesselMitBefund(s);
    // B1-RIEGEL (Gegenprüfung Runde 1): Register-keys, die DIESES Dokument selbst
    // als anderen Erlass definiert, fallen weg. Begründung, Methode und Messung
    // stehen bei `fremdDefinierteKeys` (entscheide-mapping.ts). Auf der
    // Bundesseite gemessen folgenlos (0 Fälle) — darum bleibt die
    // Bundesgerichts-Projektion byte-gleich.
    //
    // NUR AUF NICHT-BUNDESGERICHTLICHEN SNAPSHOTS — und das ist eine
    // SCOPE-Entscheidung, keine fachliche (§8, offen gelegt statt kaschiert):
    // Die Regel greift auch auf Bundesgerichts-Text, und dort GENAU ZWEIMAL,
    // beide Male zu Recht (gemessen 28.7.2026):
    //   · bge/149_I_161 «(LEP; BLV 340.01)» — waadtländisches Gesetz; der
    //     Register-key EPG ist das eidg. Epidemiengesetz, dessen fr. Alias «LEp»
    //     lautet. Namensvetter.
    //   · bge/150_II_105 «(AIMP; BLV 726.91)» — die interkantonale Vereinbarung
    //     über das öffentliche Beschaffungswesen; der Register-key IRSG ist das
    //     Rechtshilfegesetz, dessen fr./it. Alias ebenfalls «AIMP» ist.
    // Sie hier mitzufiltern hiesse, `proNormArtikel` und damit ein
    // AUSGELIEFERTES Bestands-Artefakt zu verändern. Das ist eine fachliche
    // Korrektur am W2·6-NKEY-Kanal, nicht Teil dieser Bau-Einheit — sie gehört
    // in einen eigenen, deklarierten Schritt mit eigenem Nachweis (§14/§6.3),
    // sonst wandert eine Inhaltsänderung als Nebenwirkung eines
    // Struktur-Schritts nach main. Die beiden Fundstellen vom 28.7.2026 sind
    // hier benannt; der dritte Fall (Nachtrag 18.9.2026) folgt unten.
    //
    // Nachtrag (gemessen 18.9.2026, Nachzug QS-MONITOR-ROT, Nach-Verdikt
    // Opus): ohne die Alias-Sperre 'LC' (ABK_AUSSCHLUSS, entscheide-mapping.ts)
    // feuert `fremdDefinierteKeys` auf Bundesgerichts-Text DREIMAL statt
    // zweimal — bge/149_I_161 «(LEP; BLV 340.01)»→EPG, bge/149_I_343
    // «(LC; BLV 175.11)»→AVG, bge/150_II_105 «(AIMP; BLV 726.91)»→IRSG; mit
    // Sperre bleiben es die oben gemessenen zwei. BGE 149 I 343 gehört zur
    // selben Fehlerklasse «(ABK; BLV nnn.nn)» wie die beiden obigen Fälle und
    // ist seit der LC-Sperre für diesen Riegel unsichtbar — dritter Fall für
    // den oben beauftragten Folge-Schritt. Präzisierung: der dritte Treffer
    // entsteht nur über die Publikations-Schicht «BLV» (`auszugAbschnitte`)
    // — der Volltext (`abschnitte`) trägt «rs/VD 175.11», das die Riegel-
    // Regex (Sigel-Token ohne Trennzeichen) strukturell nicht erfasst.
    const gesperrt = s.gerichtstyp === 'bundesgericht' ? new Set<string>() : fremdDefinierteKeys(s);
    const schluessel = new Set<string>();
    for (const k of befund.schluessel) {
      const erlass = k.slice(0, k.indexOf('/'));
      if (gesperrt.has(erlass)) { fremdVerworfen.add(`${erlass} ← ${s.id}`); continue; }
      schluessel.add(k);
    }
    if (s.gerichtstyp !== 'bundesgericht') {
      literaturVerwurfUebrige.paare += befund.literaturVerworfen.length;
      literaturVerwurfUebrige.nennungen += befund.literaturNennungen;
      literaturVerwurfUebrige.spannen += befund.literaturSpannenZahl;
    }

    // KANTONALE Artikel-Schlüssel («§ 93 … SG 154.100» → 'BS-154.100/93').
    // Nur für kantonale Entscheide: ein Bundesgerichtsurteil zitiert kantonales
    // Recht zwar auch, aber dann in der Regel als fremdes Recht mit Kantons-
    // Bezeichnung — dafür fehlt die FP-Analyse, also bleibt es hier bewusst
    // aussen vor (§7: benannte Lücke statt ungeprüfter Ausweitung).
    const bestand = s.kanton !== 'CH' ? kantonBestaende.get(s.kanton) : undefined;
    // N0a: die ERLASS-Ebene derselben Auflösung, je Entscheid gesammelt. Nicht
    // aus `schluessel` zurückgerechnet — dort stehen Bundes- und Kantons-Keys
    // gemischt, und ein Muster-Filter darüber wäre eine zweite, ratende
    // Identitäts-Regel (§5/§7). Hier ist die Herkunft strukturell eindeutig:
    // was `loeseKantonZitate` liefert, IST kantonal.
    const kantonErlasse = new Set<string>();
    if (bestand && bestand.size) {
      const kb = loeseKantonZitate(
        fliesstextOhneApparat(s), s.kanton, bestand,
        dominanz.get(s.kanton), kantonTitel.get(s.kanton),
      );
      for (const z of kb.zitate) {
        schluessel.add(`${z.erlass}/${z.artikel}`);
        kantonErlasse.add(z.erlass);
        kantonalJeKanal[z.kanal] = (kantonalJeKanal[z.kanal] ?? 0) + 1;
      }
      kantonalOhneErlass += kb.ohneErlass;
      for (const a of kb.abkAusgeschlossen) abkAusgeschlossen.add(a);
      for (const n of kb.nummerOhneBestand) nummerOhneBestand.add(n);
      for (const n of kb.nummerMinderheit) nummerMinderheit.add(n);
    }

    const { key } = keyVon(s);
    if (kantonErlasse.size) kantonNormKeys.set(key, [...kantonErlasse].sort());
    // E-7: eine textgleiche Dublette trägt keine Artikel-Kante (ihre Kantons-
    // Erlass-Liste oben bleibt — die gehört zur eigenen Entscheid-Seite).
    const zwilling = dubletten.get(s.id);
    if (zwilling) {
      dublettenVerworfen.push(`${s.id} ← ${zwilling}`);
      continue;
    }
    // E-1: nur-unpublizierte Artikel wandern auf das Volltext-Urteil.
    const unpubl = unpublizierteSchluessel(s, schluessel);
    for (const k of unpubl.keys()) schluessel.delete(k);
    eintraege.push({
      key,
      gewichtKey: key,
      ref: {
        key,
        zitierung: s.zitierung,
        regesteKurz: kurzzeile(s),
        datum: s.datum,
        facetten,
        ...(s.datumUnbekannt ? { datumUnbekannt: true as const } : {}),
      },
      gruppe: gewichtsGruppe(s),
      status,
      schluessel,
    });
    if (unpubl.size) {
      unpubliziertUmgelenkt += unpubl.size;
      const vollKey = `${key}__voll`;
      // Facetten wie der Register-Verweis `__voll` (entscheide-schreiben.ts):
      // Bundesgericht, gericht 'bger', leitcharakter 'routine' → Klasse 'bger'.
      const vollFacetten = facettenFuerEntscheid({
        gericht: 'bger', gerichtstyp: 'bundesgericht', leitcharakter: 'routine', kanton: s.kanton,
      });
      eintraege.push({
        key: vollKey,
        gewichtKey: key,
        ref: {
          key: vollKey,
          zitierung: `Urteil ${s.azaUrteil!.aktenzeichen} (nicht publ. in BGE ${s.bgeReferenz})`,
          regesteKurz: null,
          datum: s.datum,
          facetten: vollFacetten,
          unpubliziert: { bge: s.bgeReferenz!, urteil: s.azaUrteil!.aktenzeichen },
        },
        gruppe: gewichtsGruppe(s),
        status: vollFacetten.status,
        schluessel: new Set(unpubl.keys()),
        erwaegungen: unpubl,
      });
    }
  }

  // ── Durchgang 2: Zitier-Graph JE GEWICHTS-GRUPPE ───────────────────────────
  const tokenZuKey = new Map<string, Map<string, string>>();   // gruppe → token → key
  for (const s of auswahl) {
    const g = gewichtsGruppe(s);
    const map = tokenZuKey.get(g) ?? (tokenZuKey.set(g, new Map()), tokenZuKey.get(g)!);
    const { key } = keyVon(s);
    for (const t of selbstTokens(s)) if (!map.has(t)) map.set(t, key);
  }
  const zitiertKeys = new Map<string, Set<string>>();          // key → zitierte keys (gruppenintern)
  for (const s of auswahl) {
    const g = gewichtsGruppe(s);
    const map = tokenZuKey.get(g)!;
    const { key } = keyVon(s);
    const cited = new Set<string>();
    for (const z of s.zitierteEntscheide ?? []) {
      const tok = kanonZitat(z);
      if (!tok) continue;
      const ck = map.get(tok);
      if (ck && ck !== key) cited.add(ck);      // Selbstzitat nie zählen
    }
    zitiertKeys.set(key, cited);
  }

  // ── Durchgang 3: nach Artikel gruppieren, gewichten, je Status ordnen ──────
  const proArtikelRoh = new Map<string, Eintrag[]>();
  for (const e of eintraege) {
    for (const a of e.schluessel) {
      const liste = proArtikelRoh.get(a) ?? (proArtikelRoh.set(a, []), proArtikelRoh.get(a)!);
      liste.push(e);
    }
  }

  const proArtikel = new Map<string, BezugsKante[]>();
  for (const artikel of [...proArtikelRoh.keys()].sort()) {
    const liste = proArtikelRoh.get(artikel)!;
    // Gewicht je Gruppe: nur Zitierungen von d' ∈ S_A∩Gruppe auf d ∈ S_A∩Gruppe.
    // Gewichte über `gewichtKey` (= Snapshot-key): eine `__voll`-Kante zählt als
    // das Urteil, zu dem sie gehört (E-1, Begründung bei `unpublizierteSchluessel`).
    const inGruppe = new Map<string, Set<string>>();
    for (const e of liste) {
      const set = inGruppe.get(e.gruppe) ?? (inGruppe.set(e.gruppe, new Set()), inGruppe.get(e.gruppe)!);
      set.add(e.gewichtKey);
    }
    const gewicht = new Map<string, number>(liste.map((e) => [e.gewichtKey, 0]));
    for (const e of liste) {
      const set = inGruppe.get(e.gruppe)!;
      for (const c of zitiertKeys.get(e.gewichtKey) ?? []) {
        if (set.has(c)) gewicht.set(c, (gewicht.get(c) ?? 0) + 1);
      }
    }
    const kanten: BezugsKante[] = liste.map((e) => {
      const erw = e.erwaegungen?.get(artikel);
      return {
        ...e.ref,
        gewicht: gewichtMessbar(e.gruppe) ? (gewicht.get(e.gewichtKey) ?? 0) : null,
        ...(erw && erw.length ? { erwaegungen: erw } : {}),
      };
    });
    // Erst Status-Klasse (deklarierte Rangordnung), dann CHRONOLOGISCH neu→alt
    // INNERHALB der Klasse (B7), Gleichstand über die bestehende Bestands-Ordnung
    // — so bleibt die Ordnung total (§2) und der Tiebreak hat genau EINE Stelle
    // (§5: `vergleicheLeitfaelle`, hereingereicht als `ordnung`).
    // Nie über Klassen hinweg sortieren (§8) — die Klassentrennung ist der Punkt.
    // B-1: eine Kante mit Platzhalter-Datum (`datumUnbekannt`) hat KEINEN Ort auf
    // der Zeitachse — sie steht am Ende ihrer Klasse, statt mit einem erfundenen
    // 1. Januar mitten in der Linie (Befund B-1, 23.9.2026).
    kanten.sort((a, b) =>
      STATUS_RANG[a.facetten.status] - STATUS_RANG[b.facetten.status]
      || (a.datumUnbekannt ? 1 : 0) - (b.datumUnbekannt ? 1 : 0)
      || vergleicheDatumAbsteigend(a.datum, b.datum)
      || ordnung(alsLeitfall(a), alsLeitfall(b)));
    for (const k of kanten) kantenJeStatus[k.facetten.status] = (kantenJeStatus[k.facetten.status] ?? 0) + 1;
    proArtikel.set(artikel, kanten);
  }

  return {
    proArtikel,
    kantonNormKeys,
    befund: {
      snapshotsJeStatus, kantenJeStatus, kantonalJeKanal, kantonalOhneErlass,
      abkAusgeschlossen: [...abkAusgeschlossen].sort(),
      nummerOhneBestand: [...nummerOhneBestand].sort(),
      kantoneOhneResolver: [],   // setzt der Aufrufer (kennt die Kantons-Menge)
      nummerMinderheit: [...nummerMinderheit].sort(),
      fremdVerworfen: [...fremdVerworfen].sort(),
      literaturVerwurfUebrige,
      dublettenVerworfen: dublettenVerworfen.sort(),
      unpubliziertUmgelenkt,
    },
  };
}

/**
 * Bundesgerichts-Projektion = das bestehende `proNormArtikel`.
 *
 * Sie ist die STELLE, an der die Verhaltensneutralität hängt. Drei Eigenschaften
 * müssen exakt stimmen, sonst driftet der Bestand:
 *  1. nur `status` ∈ {bge, bger} (= `gerichtstyp === 'bundesgericht'`);
 *  2. Ordnung ausschliesslich über `ordnung` (vergleicheLeitfaelle) — die
 *     Status-Vorsortierung des generischen Baus wird hier NICHT übernommen,
 *     sonst stünden erst alle BGE und dann alle BGer statt nach Gewicht;
 *  3. Deckel 8 über die GEMEINSAME Liste, nicht je Status.
 * Artikel ohne bundesgerichtliche Kante entfallen ganz (kein leerer Bucket).
 *
 * B7-VERTRÄGLICHKEIT, weil hier die Verhaltensneutralität hängt: dass der
 * generische Bau seit B7 CHRONOLOGISCH vorsortiert statt nach Gewicht, ist für
 * diese Projektion folgenlos — `bg.sort(ordnung)` sortiert die gefilterte Menge
 * vollständig neu, und `vergleicheLeitfaelle` ist eine TOTALE Ordnung (letzter
 * Schlüssel: key). Bei einer totalen Ordnung ist das Ergebnis von `sort`
 * eindeutig und damit unabhängig von der Eingabereihenfolge. Der Beweis ist
 * nicht dieses Argument, sondern der byte-gleiche Regen von norm-index.json und
 * der 156 Shards (§6).
 */
export function projiziereBundesgericht(
  index: BezugsIndex,
  ordnung: KantenOrdnung,
  deckel: number,
): Record<string, LeitfallRef[]> {
  const out: Record<string, LeitfallRef[]> = {};
  for (const [artikel, kanten] of index.proArtikel) {
    const bg = kanten
      .filter((k) => k.facetten.status === 'bge' || k.facetten.status === 'bger')
      .map(alsLeitfall);
    if (!bg.length) continue;
    bg.sort(ordnung);
    out[artikel] = bg.slice(0, deckel);
  }
  return out;
}

/**
 * Bezugs-Shards je Erlass — die Nutzlast der Auflistung am Artikel.
 *
 * SEIT B7 OHNE DECKEL: jede Kante des Artikels wird ausgeliefert, in der
 * Anzeige-Ordnung des Index (Status-Rang, dann Datum ↓). `gesamtProArtikel`
 * bleibt als Gegenrechnung und als Bezugsgrösse der UI-Zähler (§8).
 */
export function baueBezugsShards(index: BezugsIndex, datum: string): Map<string, BezugsShard> {
  const proErlass = new Map<string, Map<string, BezugsKante[]>>();
  for (const [ak, kanten] of index.proArtikel) {
    const schraeg = ak.indexOf('/');
    const erlass = ak.slice(0, schraeg);
    const token = ak.slice(schraeg + 1);
    const m = proErlass.get(erlass) ?? (proErlass.set(erlass, new Map()), proErlass.get(erlass)!);
    m.set(token, kanten);
  }

  const out = new Map<string, BezugsShard>();
  for (const erlass of [...proErlass.keys()].sort()) {
    const roh = proErlass.get(erlass)!;
    const proArtikel: Record<string, BezugsEintrag[]> = {};
    const gesamtProArtikel: Record<string, Partial<Record<BezugStatus, number>>> = {};
    const koepfe = new Map<string, BezugsDokument>();
    for (const token of [...roh.keys()].sort()) {
      const kanten = roh.get(token)!;
      const gesamt: Partial<Record<BezugStatus, number>> = {};
      const alle: BezugsEintrag[] = [];
      for (const k of kanten) {
        const st = k.facetten.status;
        gesamt[st] = (gesamt[st] ?? 0) + 1;
        if (!koepfe.has(k.key)) {
          koepfe.set(k.key, {
            zitierung: k.zitierung, regesteKurz: k.regesteKurz,
            datum: k.datum, facetten: k.facetten,
            ...(k.datumUnbekannt ? { datumUnbekannt: true as const } : {}),
            ...(k.unpubliziert ? { unpubliziert: k.unpubliziert } : {}),
          });
        }
        alle.push({ key: k.key, gewicht: k.gewicht, ...(k.erwaegungen ? { erwaegungen: k.erwaegungen } : {}) });
      }
      proArtikel[token] = alle;
      gesamtProArtikel[token] = gesamt;
    }
    // Schlüssel sortiert (§2): sonst hinge die Datei an der Artikel-Reihenfolge,
    // in der ein Dokument zufällig zuerst auftauchte.
    const dokumente: Record<string, BezugsDokument> = {};
    for (const k of [...koepfe.keys()].sort()) dokumente[k] = koepfe.get(k)!;
    out.set(erlass, {
      erzeugt: datum,
      erlass,
      // Kantonale Erlass-keys tragen den Kantons-Präfix ('BS-154.100'); alles
      // andere ist ein Bundes-Register-key. Aus dem SCHLÜSSEL abgeleitet, nicht
      // aus den Kanten: ein Bundeserlass, der nur von kantonalen Entscheiden
      // zitiert wird, bleibt ein Bundeserlass (§1).
      erlassEbene: /^[A-Z]{2}-/.test(erlass) ? 'kanton' : 'bund',
      dokumente,
      proArtikel,
      gesamtProArtikel,
    });
  }
  return out;
}

/**
 * Serialisierung EINES Bezugs-Shards — eine Zeile je Eintrag statt zwei
 * Leerzeichen Einrückung je Feld (§15, Logikverlust-Bewertung: KEINER).
 *
 * ── WARUM DAS MIT B7 NÖTIG WURDE ───────────────────────────────────────────
 * Mit dem aufgehobenen Deckel wächst der grösste Shard von 291.9 auf 3'578.5 KiB
 * (BGG, gemessen 29.7.2026). Rund 30 % davon sind reiner Weissraum der
 * `JSON.stringify(o, null, 2)`-Form: 4'693 Dokument-Köpfe mit je sechs
 * eingerückten Feldern und 18'571 Kanten-Objekte mit je zwei. Kompakt sind es
 * 2'490.4 KiB (gzip 318.3 → 300.2 KiB).
 *
 * VOLLSTÄNDIG KOMPAKT wäre es noch einmal weniger — aber dann stünde eine
 * 2.5-MB-Datei auf EINER Zeile. Diese Artefakte werden committet; ein Diff, der
 * nur «eine Zeile geändert» sagen kann, macht jede Gegenprüfung blind. Eine
 * Zeile JE DOKUMENT und JE ARTIKEL hält den Diff lesbar und holt den Weissraum
 * trotzdem. Der Preis sind ~25 KB Zeilenumbrüche.
 *
 * DIE DATEN SIND IDENTISCH: dieselben Schlüssel, dieselbe Reihenfolge,
 * dieselben Werte — `JSON.parse` liefert das gleiche Objekt wie zuvor. Was sich
 * ändert, ist ausschliesslich der Weissraum zwischen den Zeichen. Der Beweis
 * ist der Test `bezuege-facetten.test.ts` (Rundlauf parse(serialisiere(x)) ≡ x)
 * plus das Tor check:bezuege, das jede Datei wieder einliest.
 *
 * NICHT für die Bestands-Artefakte: `serialisiere` (entscheide-schreiben.ts)
 * bleibt unangetastet, sonst wäre norm-index.json und wären die 156 Shards
 * nicht mehr byte-gleich (§6).
 */
export function serialisiereShard(shard: BezugsShard): string {
  const z = (v: unknown): string => JSON.stringify(v);
  const zeilen: string[] = ['{'];
  zeilen.push(`"erzeugt":${z(shard.erzeugt)},`);
  zeilen.push(`"erlass":${z(shard.erlass)},`);
  zeilen.push(`"erlassEbene":${z(shard.erlassEbene)},`);
  const block = (name: string, obj: Record<string, unknown>, komma: boolean): void => {
    const keys = Object.keys(obj);
    zeilen.push(`"${name}":{`);
    keys.forEach((k, i) => zeilen.push(`${z(k)}:${z(obj[k])}${i < keys.length - 1 ? ',' : ''}`));
    zeilen.push(`}${komma ? ',' : ''}`);
  };
  block('dokumente', shard.dokumente, true);
  block('proArtikel', shard.proArtikel, true);
  block('gesamtProArtikel', shard.gesamtProArtikel, false);
  zeilen.push('}');
  return zeilen.join('\n') + '\n';
}

/**
 * Korpusweite Facetten-Bilanz — die eine Zahl, die eine Facette EHRLICH macht
 * (B7 Teil c, §8).
 *
 * ── DER BEFUND, DER SIE NÖTIG MACHT (reproduziert 28.7.2026) ────────────────
 * David: «Eidg. das scheint keine funktion zu haben?» Gemessen am committeten
 * Korpus: die Klasse `eidg` trägt 164 Kanten an 93 von 6217 Artikel-Buckets,
 * verteilt auf 18 von 311 Erlassen. An Art. 41 OR — dem Artikel, an dem der
 * Befund entstand — sind es null. Der Schalter WAR verdrahtet; er hatte an
 * fast jedem Artikel nur nichts zu zeigen. Ein Steuerelement, das in 98,5 % der
 * Fälle wirkungslos aussieht, ohne zu sagen warum, ist von einem kaputten nicht
 * zu unterscheiden — und der Nutzer schliesst auf «kaputt» (§13 F4).
 *
 * Diese Bilanz gibt der Bedien-Oberfläche die Zahl, mit der sie das sagen kann:
 * «Eidg. 0 — korpusweit 164 Kanten an 93 Artikeln». Sie ist eine reine
 * PROJEKTION der Shards (§5) und wird vom Tor check:bezuege daraus neu
 * gerechnet und verglichen; sie kann also nicht von den Shards wegdriften.
 *
 * Rein und deterministisch (§2): Schlüssel sortiert, Zahlen abgeleitet.
 */
export interface BezugsBilanz {
  erzeugt: string;
  /** Kanten je Status über ALLE Shards. */
  kantenJeStatus: Partial<Record<BezugStatus, number>>;
  /** Artikel-Buckets, an denen die Klasse ÜBERHAUPT eine Kante hat. */
  artikelJeStatus: Partial<Record<BezugStatus, number>>;
  /** Erlasse, in deren Shard die Klasse vorkommt. */
  erlasseJeStatus: Partial<Record<BezugStatus, number>>;
  /** Artikel-Buckets insgesamt — die Bezugsgrösse der drei Zahlen darüber. */
  artikelGesamt: number;
  /** Erlass-Shards insgesamt. */
  erlasseGesamt: number;
}

export function baueBezugsBilanz(shards: ReadonlyMap<string, BezugsShard>, datum: string): BezugsBilanz {
  const kantenJeStatus: Partial<Record<BezugStatus, number>> = {};
  const artikelJeStatus: Partial<Record<BezugStatus, number>> = {};
  const erlasseJeStatus: Partial<Record<BezugStatus, number>> = {};
  let artikelGesamt = 0;
  for (const erlass of [...shards.keys()].sort()) {
    const shard = shards.get(erlass)!;
    const imErlass = new Set<BezugStatus>();
    for (const token of Object.keys(shard.proArtikel).sort()) {
      artikelGesamt++;
      const imArtikel = new Set<BezugStatus>();
      for (const e of shard.proArtikel[token]) {
        const st = shard.dokumente[e.key]?.facetten.status;
        if (!st) continue;
        kantenJeStatus[st] = (kantenJeStatus[st] ?? 0) + 1;
        imArtikel.add(st);
        imErlass.add(st);
      }
      for (const st of imArtikel) artikelJeStatus[st] = (artikelJeStatus[st] ?? 0) + 1;
    }
    for (const st of imErlass) erlasseJeStatus[st] = (erlasseJeStatus[st] ?? 0) + 1;
  }
  const sortiert = (o: Partial<Record<BezugStatus, number>>): Partial<Record<BezugStatus, number>> => {
    const aus: Partial<Record<BezugStatus, number>> = {};
    for (const st of (Object.keys(o) as BezugStatus[]).sort((a, b) => STATUS_RANG[a] - STATUS_RANG[b])) {
      aus[st] = o[st];
    }
    return aus;
  };
  return {
    erzeugt: datum,
    kantenJeStatus: sortiert(kantenJeStatus),
    artikelJeStatus: sortiert(artikelJeStatus),
    erlasseJeStatus: sortiert(erlasseJeStatus),
    artikelGesamt,
    erlasseGesamt: shards.size,
  };
}

/** Kantonale Erlass-Bestände für alle Kantone einer Auswahl laden. */
export function ladeBestaende(
  root: string,
  kantone: Iterable<string>,
): Map<string, KantonBestand> {
  const out = new Map<string, KantonBestand>();
  for (const k of [...new Set(kantone)].sort()) {
    if (k === 'CH') continue;
    out.set(k, ladeKantonBestand(root, k));
  }
  return out;
}

// ── Kleinteile, die sonst zwei Module bräuchten ─────────────────────────────

/** `BezugsKante` → `LeitfallRef`-Form für die Bestands-Ordnung (§5). */
function alsLeitfall(k: BezugsKante): LeitfallRef {
  return {
    key: k.key,
    zitierung: k.zitierung,
    regesteKurz: k.regesteKurz,
    datum: k.datum,
    // `leitcharakter` aus der Facette zurückrechnen: die Ordnung des Bestands
    // liest genau dieses Feld. Die Facette ist die REICHERE Achse — 'bge' ist
    // per Definition der amtlich publizierte Leitentscheid, alles andere nicht.
    leitcharakter: k.facetten.status === 'bge' ? 'leitentscheid' : 'routine',
    gericht: k.facetten.gericht,
    kanton: k.facetten.kanton,
    // Für die Bestands-Ordnung ist ein nicht messbares Gewicht wie 0 zu
    // behandeln: `vergleicheLeitfaelle` rechnet numerisch, und die Ordnung soll
    // hier ausdrücklich auf den nachrangigen Schlüssel (Datum ↓, key) fallen.
    // Die Unterscheidung «0 gemessen» vs. «nicht messbar» gehört ins AUSGELIEFERTE
    // Artefakt, nicht in den Komparator — dort wäre sie folgenlos (§8).
    gewicht: k.gewicht ?? 0,
  };
}

