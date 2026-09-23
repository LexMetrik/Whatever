// ─── B4: Facetten-Auswahl der Bezüge am Artikel — reine Darstellungslogik ─────
//
// W2·7-BEZUG/B4 (FAHRPLAN-VERZAHNUNG-UI §9). Die Datenschicht (B1,
// `lib/rechtsprechung/bezuege.ts` + `lib/verzahnung/facetten.ts`) kennt
// bewusst KEINE Voreinstellung — «welche Facetten voreingestellt sind und wie
// sie bedient werden, entscheidet die Filter-UI (B4) und nicht diese Datei».
// Genau das steht hier: Default, Normalisierung, Abbildung auf `FacettenAuswahl`
// und die kurzen Anzeige-Labels. Rein und deterministisch (§2), kein JSX, kein
// Zustand — der Zustand lebt im Leser-Options-Store (`leserOptionen.ts`).
//
// ── WARUM DER DEFAULT NUR `bge` KENNT (§8, konservativ) ─────────────────────
// Der Bezugs-Shard ist die OBERMENGE des schlanken `norm-index/<Erlass>.json`
// (siehe Abgrenzungs-Kommentar in `bezuege.ts`) und mit 717 KB am grössten
// Erlass deutlich schwerer. Ein Default, der ALLE Instanzen einschaltet, machte
// die erste Ansicht des Panels teurer und lauter, um Kanten zu zeigen, nach
// denen niemand gefragt hat. Der Grundzustand ist darum genau `{bge}`, und alles
// Weitere ist zuschaltbar (§9/B4 «Default konservativ»).
//
// ── ABGELÖST: ENTSCHEID DAVID 23.9.2026 (S6-W1b) ────────────────────────────
// Der Absatz darüber bleibt als Beleg seines Stands (§0 Ziff. 2b). Am 23.9.2026
// hat der Audit des Erlass-Blatts die Kosten dieses Defaults gemessen: an
// kantonalen Erlassen zeigte der Reiter «kein Entscheid erfasst», obwohl der
// Shard 65 kantonale Kanten trug (BS-154.100 § 44, B-3/E-4), und «im Blatt
// öffnen» zeigte an OR Art. 257d 2 statt der 10 Entscheide der Funktionszeile
// (D-2). David hat entschieden (wörtlich): «zuerst bge aber nur die 5 neusten
// und dann kantonal jeweils 5 und dann der rest». Der Grundzustand ist darum
// ALLE bedienbaren Klassen; die Ordnung und die Fünfer-Portion leistet die
// Anzeige (`v3/entscheideOrdnung.ts`), nicht das Filter. Das Filter bleibt zum
// Eingrenzen. §15 ist davon nicht berührt: der Shard ist ohnehin EIN Fetch mit
// allen Klassen, der Default entscheidet nur, was gerendert wird — und das
// deckelt die Portion.
//
// ── WO DIE LADEWEICHE WIRKLICH STEHT (W2·7-VZUI, nachgemessen 31.8.2026) ────
// Bis hierher behauptete dieser Kopf: «Grundzustand ⇒ heutiger Shard, heutige
// Darstellung — byte-gleich, kein zusätzlicher Fetch», und: «`istErweitert` ist
// die eine Stelle, die diese Weiche stellt». Beides trifft am Ist-Stand NICHT
// zu, und die Zusage war damit eine zweite Wahrheit (§5) an einer §15-Stelle:
//
//   · `istErweitert` (seit S6-W1b `istEingegrenzt`) stellt KEINE Ladeweiche. Ihr einziger Konsument ist
//     `BezugFacettenWahl.tsx:106` — sie wählt dort den Hinweistext unter den
//     Schaltern, sonst nichts. Der Lader (`bezuegeLaden.ts`) fragt sie nie.
//   · Die Weiche ist das PANEL-GATE: `panelModell.usePanelBezuege` reicht den
//     Erlass-Key erst durch, nachdem das Panel einmal offen war (`jeGeoeffnet`).
//     Vor der Nutzer-Geste geht kein Byte über die Leitung — auch nicht im
//     Grundzustand `{bge}`, in dem der alte Kommentar den Shard für «heutigen
//     Pfad» hielt.
//   · Der SCHLANKE Shard wird im Gesetz-Leser überhaupt nicht mehr geholt: die
//     Lesespalte reicht seit H3 weder `bezuege` noch `leitfaelle` an den Kern
//     (`v3/LeserLesespalte.tsx:64–88`), und die V3-Hülle ist seit dem H4-Flip
//     die einzige (`GesetzLeser.tsx:83`). Der «Ersetzungs»-Satz beschrieb eine
//     Umschaltung zwischen zwei Shards, von denen nur noch einer geladen wird.
//
// Das §15-Versprechen ist damit STRENGER eingelöst als der alte Kommentar
// behauptete — nur an einer anderen Stelle. Beweis nicht in Prosa, sondern als
// Tor: `e2e/leser-v3-prerender-bezuege.e2e.ts` (b) misst am laufenden Leser,
// dass beim Seitenaufruf WEDER `rechtsprechung/bezuege/` NOCH
// `rechtsprechung/norm-index` angefragt wird und erst das Öffnen genau einen
// Fetch auslöst.
//
// ── WARUM ES KEINEN EIGENEN «EBENE»-SCHALTER GIBT (§5) ──────────────────────
// `BezugsFacetten.ebene` ist aus `status` ableitbar: bge/bger/eidg sind
// Bundesebene, `kantonal` ist Kantonsebene. Ein zweiter Schalter für dieselbe
// Unterscheidung wäre ein Steuerelement, das entweder nichts tut oder dem
// Status-Schalter widerspricht — beides schlechter als einer. Die vier
// Status-Klassen SIND die Instanz-/Ebenen-Achse; die Kanton-Achse verfeinert
// die kantonale Klasse. `FacettenAuswahl.ebene` bleibt in der Datenschicht
// bestehen (andere Konsumenten dürfen sie nutzen), die Leser-UI setzt sie nicht.

import type { BezugStatus } from '../../lib/verzahnung/facetten';
import { STATUS_RANG } from '../../lib/verzahnung/facetten';
import { entscheidPraezision } from '../../lib/verzahnung/artikel-revisionen';
import { imBereich, istBereichOffen, type Zeitbereich } from './bezugZeit';

/**
 * Die im Gesetz-Leser bedienbaren Klassen, in Anzeige-Reihenfolge (§2:
 * deklariert, nie aus Zählern abgeleitet).
 *
 * `material` fehlt BEWUSST: der Bezugs-Korpus trägt heute ausschliesslich
 * `quelltyp:'rechtsprechung'` (verifiziert 28.7.2026 über alle 311 Shards —
 * 9922 Dokumente, davon 0 Materialien). Ein Schalter für eine Klasse, die es
 * im Bestand nicht gibt, wäre ein totes Steuerelement (§13 F4) und zugleich
 * eine Bestandsbehauptung, die die Daten nicht decken (§8). Er kommt mit
 * W2·6a-MAT — die Datenschicht (`facettenFuerMaterial`) trägt ihn bereits.
 */
export const BEDIENBARE_KLASSEN: readonly BezugStatus[] = ['bge', 'bger', 'eidg', 'kantonal'];

/**
 * Grundeinstellung: ALLE bedienbaren Klassen (Entscheid David 23.9.2026,
 * Herleitung im Dateikopf). Bis dahin: nur Leitentscheide (§9 B4 «Default
 * konservativ»).
 */
export const DEFAULT_KLASSEN: readonly BezugStatus[] = BEDIENBARE_KLASSEN;

/**
 * Kurzlabel für die Chip-Gruppen und Schalter.
 *
 * Bewusst NEBEN `STATUS_LABEL` (facetten.ts) statt an dessen Stelle: das
 * dortige Label ist der ausgeschriebene FACHNAME («Eidg. Gericht
 * (BVGer/BStGer/BPatGer)») und bleibt die massgebliche Bezeichnung — es speist
 * hier jeden `title`/`aria-label`. Diese Tabelle liefert nur die gekürzte
 * Sichtform für enge Chip-Reihen. Ein Test hält beide Tabellen vollständig
 * (jede bedienbare Klasse hat beides), damit sie nicht auseinanderlaufen.
 */
export const KLASSE_KURZ: Readonly<Record<BezugStatus, string>> = {
  bge: 'Leitentscheide',
  bger: 'Bundesgericht, übrige',
  eidg: 'Eidg. Gerichte',
  kantonal: 'Kantonal',
  material: 'Materialien',
};

/** Noch kürzer — für den Schalter-Streifen im engen «Ansicht ▾»-Panel. */
export const KLASSE_SCHALTER: Readonly<Record<BezugStatus, string>> = {
  bge: 'BGE',
  bger: 'BGer',
  eidg: 'Eidg.',
  kantonal: 'Kantonal',
  material: 'Mat.',
};

/**
 * Ist die Auswahl vom Grundzustand abgewichen? «Abgewichen» heisst: die Menge
 * ist nicht GENAU `DEFAULT_KLASSEN` (bis S6-W1b: `{bge}`, seither alle vier).
 * Jedes Abwählen zählt dazu — wer nur kantonale Entscheide sehen will, hat
 * eingegrenzt. Rein (§2).
 *
 * ── WAS SIE NICHT (MEHR) TUT: LADEN ENTSCHEIDEN ────────────────────────────
 * Die frühere Zusage «nur dann tritt der grössere Bezugs-Shard an die Stelle des
 * schlanken» ist gestrichen, nicht umformuliert: sie beschrieb eine Weiche, die
 * hier nie stand (Herleitung im Dateikopf). Einziger Konsument ist der
 * Hinweistext unter den Instanz-Schaltern (`BezugFacettenWahl.tsx:106`) — er
 * sagt im Grundzustand etwas anderes als in der eingegrenzten Wahl. (Bis
 * S6-W1b hiess die Funktion `istErweitert` — der Grundzustand war `{bge}`, jede
 * Abweichung also eine Erweiterung; seit der Grundzustand alle Klassen trägt, ist
 * jede Abweichung eine Eingrenzung, und der Name sagt das.)
 *
 * BEHALTEN STATT GESTRICHEN (§17-Rückbau-Prüfung 31.8.2026): eine Funktion mit
 * genau einem Konsumenten ist ein Streich-Kandidat. Sie bleibt, weil der
 * Unterschied «Grundzustand ↔ abgewichen» eine echte Aussage über die Auswahl
 * ist, die der Text braucht, und weil sie als reine Funktion getestet ist
 * (`src/tests/bezug-auswahl.test.ts`), während die Inline-Bedingung im JSX es
 * nicht wäre.
 */
export function istEingegrenzt(klassen: readonly BezugStatus[]): boolean {
  const norm = normalisiereKlassen(klassen);
  return !(norm.length === DEFAULT_KLASSEN.length && norm.every((k, i) => k === DEFAULT_KLASSEN[i]));
}

/**
 * Auswahl normalisieren: unbekannte Werte fallen weg, Doppelte fallen weg,
 * die Reihenfolge folgt dem deklarierten `STATUS_RANG` (§2 — die Anzeige darf
 * nie von der Klick-Reihenfolge des Nutzers abhängen).
 *
 * Die LEERE Menge bleibt erlaubt und wird NICHT stillschweigend auf den
 * Default zurückgesetzt: «alles abgewählt» ist eine legitime Nutzerabsicht,
 * und die Zeile weist sie sichtbar aus («n ausgeblendet · alle zeigen») statt
 * kommentarlos zu verschwinden (§8, gleiches Muster wie der Zeit-Bereich, dessen
 * offene Enden ebenfalls nie stillschweigend zu Grenzwerten werden).
 */
export function normalisiereKlassen(roh: readonly unknown[]): BezugStatus[] {
  const erlaubt = new Set<string>(BEDIENBARE_KLASSEN);
  const aus = new Set<BezugStatus>();
  for (const w of roh) if (typeof w === 'string' && erlaubt.has(w)) aus.add(w as BezugStatus);
  return [...aus].sort((a, b) => STATUS_RANG[a] - STATUS_RANG[b]);
}

/** Kantons-Auswahl normalisieren: ISO-Kürzel (2 Grossbuchstaben), dedupliziert,
 *  alphabetisch. Leer = KEINE Einschränkung (Konvention der Datenschicht:
 *  «Leere/fehlende Achse = keine Einschränkung», siehe `FacettenAuswahl`). */
export function normalisiereKantone(roh: readonly unknown[]): string[] {
  const aus = new Set<string>();
  for (const w of roh) if (typeof w === 'string' && /^[A-Z]{2}$/.test(w)) aus.add(w);
  return [...aus].sort();
}

/**
 * Was eine Kante mindestens tragen muss, um auswählbar zu sein. Bewusst
 * strukturell und nicht `Bezug`: derselbe Filter soll auf die aufgelöste Kante
 * UND auf jede spätere Projektion passen, ohne dass eine Seite die andere
 * importiert (Muster wie `EntscheidFacettenQuelle` in facetten.ts).
 *
 * `datum` ist seit B5 gelesen (Zeit-Bereichsfilter, s. u.); B4 hatte es bereits
 * in den Vertrag gelegt, damit dieser Andockpunkt keinen Umbau kostete.
 *
 * `facetten.gericht` ist OPTIONAL und dient allein der Q1-Präzision: nur mit dem
 * Gericht lässt sich ein BGE-Bandjahr-Platzhalter (YYYY-01-01) von einem echten
 * Urteilsdatum unterscheiden (`entscheidPraezision`). Fehlt es, gilt das Datum
 * als tagesgenau — für jede Projektion, die kein Gericht führt, ist das die
 * einzige Aussage, die die Daten decken.
 */
export interface WaehlbareKante {
  facetten: { status: BezugStatus; kanton: string; gericht?: string };
  datum?: string;
}

/** Ein Auswahl-Prädikat: nimmt eine Kante, sagt behalten/verwerfen. Rein (§2). */
export type BezugsPraedikat = (kante: WaehlbareKante) => boolean;

/**
 * Die aktive Auswahl in eine LISTE von Prädikaten übersetzen, die alle erfüllt
 * sein müssen (UND-Verknüpfung über die Achsen, ODER innerhalb einer Achse).
 *
 * ── WARUM EINE LISTE UND NICHT DREI FESTE `if`s ────────────────────────────
 * Vorgabe David 28.7.2026: die Zeit-Filterung wird NICHT mit B4 gebaut, sondern
 * kommt zentral mit B5 (eigenes Header-Dropdown, Zeitstrahl + Von-Bis-Datum
 * statt grober Perioden). Damit sie andocken kann, ohne diese Funktion
 * aufzuschneiden, ist die Achsen-Menge OFFEN: eine weitere Facette ist ein
 * weiterer Eintrag in dieser Liste, kein weiterer Zweig in einem gewachsenen
 * Bedingungs-Block. `WaehlbareKante.datum` lag dafür schon im Vertrag.
 *
 * B5 hat diesen Punkt eingelöst: die Zeit-Achse ist EIN weiteres Prädikat am
 * Ende der Liste, keine Zeile der bestehenden zwei hat sich geändert. Die
 * Q1-Auflage (BGE-Bandjahr-Platzhalter jahr-genau, nie tagesgenau) liegt in
 * `imBereich` — an einer Stelle, samt Begründung (§5).
 *
 * Der offene Bereich fügt GAR KEIN Prädikat hinzu (statt eines, das immer wahr
 * ist): so läuft der Grundzustand durch genau dieselben zwei Prüfungen wie vor
 * B5 — messbar gleiches Verhalten, nicht bloss behauptet (§6).
 */
export function bauePraedikate(
  klassen: readonly BezugStatus[],
  kantone: readonly string[],
  bereich?: Zeitbereich,
): BezugsPraedikat[] {
  const aus: BezugsPraedikat[] = [];
  const status = new Set(klassen);
  aus.push((k) => status.has(k.facetten.status));
  if (kantone.length > 0 && klassen.includes('kantonal')) {
    const schnitt = new Set([...kantone, 'CH']);
    aus.push((k) => schnitt.has(k.facetten.kanton));
  }
  if (bereich && !istBereichOffen(bereich)) {
    aus.push((k) => {
      // Kante ohne Datum ⇒ BEHALTEN: ein Entscheid verschwindet nie deshalb,
      // weil sein Datum fehlt (§8, gleiche Richtung wie `imBereich`).
      if (k.datum == null) return true;
      return imBereich(k.datum, entscheidPraezision(k.datum, k.facetten.gericht ?? ''), bereich);
    });
  }
  return aus;
}

/**
 * Kanten nach der UI-Auswahl auswählen — die EINE Stelle, an der aus der
 * Bedienung eine Kantenmenge wird (§5).
 *
 * ── WARUM DER KANTONS-SCHNITT 'CH' MITFÜHRT ────────────────────────────────
 * Er wirkt nur INNERHALB der kantonalen Klasse. Ein Bundesgerichtsentscheid
 * trägt `kanton:'CH'`; ein naiver Kantons-Schnitt liesse ihn durchfallen, und
 * «nur BS» hätte die gesamte bundesgerichtliche Praxis gelöscht — ein Filter
 * für die kantonale Ebene, der die Bundesebene wegnimmt (§1).
 *
 * ── WARUM DAS NICHT `filtereBezuege` ALLEIN KANN (Befund 28.7.2026) ─────────
 * Die Datenschicht liest eine leere Achse als «keine Einschränkung»
 * (`auswahl.status?.size && …` in bezuege.ts) — eine richtige und bewusste
 * Konvention: ein Aufrufer, der eine Achse nicht bedient, will nicht gefiltert
 * werden. Für die BEDIENTE Achse dieser UI heisst dieselbe leere Menge aber das
 * genaue Gegenteil: «ich habe alle Klassen abgewählt». Naiv durchgereicht
 * zeigte das Abwählen der letzten Klasse plötzlich ALLES — die maximale
 * Überraschung genau dort, wo der Nutzer aufräumen wollte. Der Test
 * `bezug-auswahl.test.ts` hat das reproduziert, bevor es je ein Nutzer sah.
 *
 * Die Konvention der Datenschicht bleibt darum unangetastet (§3/§5); die
 * Umdeutung gehört dorthin, wo die Bedienung gedeutet wird: hierher.
 *
 * Rein (§2), ordnungserhaltend.
 */
export function waehleBezuege<T extends WaehlbareKante>(
  alle: readonly T[],
  klassen: readonly BezugStatus[],
  kantone: readonly string[],
  bereich?: Zeitbereich,
): T[] {
  if (klassen.length === 0) return [];
  const praedikate = bauePraedikate(klassen, kantone, bereich);
  return alle.filter((b) => praedikate.every((p) => p(b)));
}

/**
 * Eine Klasse an-/abschalten. Rein — gibt die neue, normalisierte Menge zurück
 * (der Store persistiert sie, diese Funktion kennt keinen Zustand).
 */
export function schalteKlasse(
  klassen: readonly BezugStatus[],
  klasse: BezugStatus,
): BezugStatus[] {
  const drin = klassen.includes(klasse);
  return normalisiereKlassen(drin ? klassen.filter((k) => k !== klasse) : [...klassen, klasse]);
}

/** Einen Kanton an-/abschalten. Rein (siehe `schalteKlasse`). */
export function schalteKanton(kantone: readonly string[], kanton: string): string[] {
  const drin = kantone.includes(kanton);
  return normalisiereKantone(drin ? kantone.filter((k) => k !== kanton) : [...kantone, kanton]);
}
