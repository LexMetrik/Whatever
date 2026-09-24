/**
 * gen:abk-aliase — amtliche DE/FR/IT-Abkürzungen der Register-Erlasse als
 * generiertes Alias-Artefakt (W2·6-NKEY Baustein b).
 *
 * ANLASS. Die normKeys-Zuordnung kennt bisher nur die DEUTSCHE Anzeige-
 * Abkürzung aus dem ERLASS_REGISTER. Ein Bundesgerichtsentscheid in der
 * Amtssprache Französisch zitiert aber «art. 42 LTF», nicht «Art. 42 BGG» —
 * dasselbe Bundesgesetz, ein anderes amtliches Kürzel. Das Sichtbarkeits-Tor
 * check:normkeys hat diese Lücke gemessen: 34 FR/IT-Amtskürzel über der
 * Schwelle von 20 Snapshots, alle desselben Bundesrechts (LTF/CST/COST, CP/CPP/
 * CPC/CC/CO, LP/LEF, CEDH/CEDU …). Sie sind keine Register-Lücke, sondern eine
 * fehlende Alias-Ebene.
 *
 * QUELLE (§7, amtlich): Fedlex-SPARQL-Endpoint, Prädikat `jolux:titleShort` am
 * sprachlichen Ausdruck (`jolux:isRealizedBy`) des Konsolidierungs-Abstracts.
 * Das ist die amtliche Kurzbezeichnung des Erlasses je Amtssprache — nicht
 * geraten, nicht übersetzt, nicht aus Modellwissen.
 *
 * ── Die fünf Regeln, ohne die das Artefakt falsch wird ──────────────────────
 *
 * (1) DATENTYP-IRI AN DER NOTATION IST PFLICHT. `?e skos:notation "220"` trifft
 *     ohne den Typ-IRI auch die Notationstypen `id` und `id-amt` — also fremde
 *     Erlasse mit derselben Zeichenkette. Nur
 *     `"220"^^<…/vocabulary/notation-type/id-systematique>` ist die SR-Nummer.
 *
 * (2) CURRENCY-FENSTER GEGEN SCHATTEN-ABSTRACTS. Zu einer SR-Nummer hängen
 *     historische Konsolidierungs-Abstracts abgelöster Erlasse (SR 173.110
 *     trägt BGG *und* OG; SR 101 trägt BV *und* BV 1874). Ohne Fenster liefert
 *     dieselbe (sr, sprache) zwei verschiedene Kürzel. Fenster =
 *     `dateEntryInForce <= Stichtag` UND kein `dateNoLongerInForce <= Stichtag`.
 *     Empirisch (27.7.2026, 227 SR): mit Fenster 0 Konfliktgruppen.
 *
 * (3) TRIM + LEERSTRING-VERWURF. Der Endpoint liefert 42 Zeilen mit führendem
 *     Leerzeichen (z.B. ' LRD') und 761 Zeilen mit leerem `titleShort`. Beides
 *     wird in der Abfrage bereinigt und in TS ein zweites Mal geprüft (billig,
 *     und es hält das Artefakt sauber, falls der Endpoint sich ändert).
 *
 * (4) STILLE TEILERGEBNISSE — DER GEFÄHRLICHSTE BEFUND. Der Endpoint antwortet
 *     gelegentlich (≈2 von 20 Läufen) mit HTTP 200 und FEHLENDEN Zeilen. Ein
 *     Generator ohne Gegenprobe schriebe dann ein stillschweigend
 *     unvollständiges Artefakt — und niemand bemerkte die fehlenden Kürzel
 *     (§6.7). Darum je Batch ZUERST eine COUNT(*)-Abfrage über dieselbe
 *     DISTINCT-Projektion, dann die Zeilen; bei Abweichung bis zu vier
 *     Wiederholungen, danach ABBRUCH ohne Schreiben. Zusätzlich global: sinkt
 *     die Zeilenzahl unter die des committeten Artefakts, bricht der Generator
 *     ab (Regressions-Tor, §6.7) — ein Netz-Ausfall darf Bestand nicht löschen.
 *
 * (5) DIE KAPPUNG HÄNGT AN DER ZUSAMMENSETZUNG DER ABFRAGE, NICHT AN IHRER GRÖSSE.
 *     Korrigierte Fassung 28.7.2026 nach adversarialer Gegenprüfung; die frühere
 *     Formulierung («Ein-Element-Batches liefern 0») war in BEIDEN Hälften falsch
 *     und stand hier nur, weil zwei Einzelmessungen zufällig zusammenpassten.
 *
 *     Gemessen (je 5–6 Läufe, deterministisch, HTTP 200, COUNT stets = Zeilenzahl):
 *       · `{281.1}` allein  ⇒ 3/3 Zeilen — ein Ein-Element-VALUES ist also NICHT
 *         per se kaputt.
 *       · `{0.142.30}` allein ⇒ 0/0 — obwohl `dateEntryInForce` = 1955-04-21 und
 *         der Filter `?von <= 2026-07-28` logisch nicht greifen KANN. Stufenweise:
 *         Notation 1 → +Abstract 25 → +dateEntryInForce 25 → +Datums-FILTER 0.
 *       · `{0.142.30, 281.1}` ⇒ 6× hintereinander 3/3 — die FK-Zeile fehlt STILL,
 *         zwei treffende Werte helfen also auch nicht.
 *       · `{0.142.30, 281.1, 220}` ⇒ 7/7, FK wieder da.
 *       · `{0.101, X}` für X ∈ {221.213.11, 221.411.1, 955.033.0} ⇒ je 5/5 Läufe
 *         3/3 Zeilen, X still verschwunden, 0.101 vollständig da; im 4er-Batch
 *         jeweils 12/12 mit X.
 *
 *     Es ist also eine daten- und planabhängige Endpoint-Pathologie: WELCHE
 *     Werte zusammen in der VALUES-Liste stehen, entscheidet, ob eine SR ihre
 *     Zeilen bekommt. Regel 4 kann das prinzipiell nicht fangen (beide Abfragen
 *     sind gleich falsch), und keine Batch-Grösse ist beweisbar sicher.
 *
 *     NACHTRAG RUNDE 2 (28.7.2026), eigene Nachmessung: die Pathologie ist NICHT
 *     auf «nur 0.*-Füller» beschränkt — auch `{0.101, 220}` und `{220, 210}`
 *     kappen SR 251 (je 6/6). Und die feste Füllung `fremde.slice(0, 3)` =
 *     `{0.101, 0.142.112.681, 0.142.30}` kappt deterministisch SECHS SR:
 *     142.204 · 161.1 · 170.512 · 211.412.411 · 251 · 946.512 (je 5/5 Läufe MISS
 *     bei 7/7 Zeilen/COUNT; in einer anderen Zusammensetzung derselben SR HIT
 *     12/12). Es gibt also keine «gesunde» Wertemenge, die man einmal festlegen
 *     könnte. Die REIHENFOLGE ist ebenfalls kein Wirkmittel: dieselbe Wertemenge
 *     kappt vorwärts wie rückwärts identisch (7/7, X beide Male weg).
 *
 *     URTEILSMITTEL EINZELABFRAGE (Nachtrag 31.8.2026). Anlass: `check:fedlex-abk-netz`
 *     rot in zwei Monitor-Läufen (33339658668, 33340145194) — SR 812.121.1 lieferte im
 *     Hauptlauf deterministisch KEINE Zeile ⇒ Regel-(4)-Pfad ⇒ «kein Urteil», Exit 1.
 *     Handprüfung am Endpoint (Einzelabfrage ohne Datums-FILTER): geltender Abstract
 *     cc/2011/362, Kürzel de `BetmKV` · fr/it `OCStup` — das Artefakt ist korrekt,
 *     gekappt hat die veränderte VALUES-Zusammensetzung nach dem Register-Zuwachs
 *     (Staatsverträge, #571). Weil die Messung oben zeigt, dass erst der Datums-FILTER
 *     die Zeilen wegnimmt (`{0.142.30}`: +dateEntryInForce 25 → +FILTER 0), gibt es
 *     jetzt ein letztes Prüfmittel: EINE Abfrage nur dieser SR, ohne Datums-FILTER,
 *     Currency-Fenster clientseitig (`imCurrencyFenster` in ./abk-einzelurteil.ts).
 *     KEINE Lockerung — COUNT-Tor und Konflikt-Riegel identisch, Vergleich über den
 *     NORMALEN Pfad, und liefert die Einzelabfrage nichts, bleibt es bei «kein
 *     Urteil» und Exit 1 (fail-closed).
 *
 *     Konsequenz für den Bau: ein Verlust-Befund darf NIE aus EINER Abfrage-
 *     Zusammensetzung geschlossen werden. `batchListe()` hält Batches bei ≥ 3 SR
 *     (billiger Gürtel, keine Garantie); tragend ist die Verlust-Gegenprobe, die
 *     MEHRERE gestreute Zusammensetzungen versucht und jede mit Positivkontrollen
 *     DERSELBEN SR absichert (siehe `verlustGegenprobe`).
 *
 * KONFLIKTE WERDEN NICHT GERATEN (§8). Trägt eine (sr, sprache) trotz Fenster
 * zwei verschiedene Kürzel, bricht der Generator mit Fehler ab statt still zu
 * tiebreaken. Ein automatisch gewähltes Kürzel wäre eine zweite Wahrheit.
 *
 * Aufruf: npm run gen:abk-aliase -- --datum=YYYY-MM-DD
 *   Der Stichtag ist PFLICHT (§2): er geht in das Currency-Fenster ein, ist im
 *   Datei-Kopf dokumentiert und macht den Lauf reproduzierbar. Kein Date.now().
 *
 * ── DRIFT-TOR: npm run check:fedlex-abk-netz  (= dieses Skript mit --check) ──
 *
 * ANLASS (28.7.2026). Das Artefakt trug bis hierher KEINE Drift-Erkennung. Damit
 * fehlte ihm das vierte Merkmal der Zitat-Ausnahme (§7 lit. d): ändert Fedlex
 * eine amtliche Kurzbezeichnung, wird ein Erlass abgelöst oder kommt ein Kürzel
 * hinzu, blieb die committete Abschrift still falsch — eine zweite Wahrheit (§5),
 * die niemand meldet. `--check` schliesst genau diese Lücke: dieselbe Abfrage,
 * dieselben fünf Regeln, aber statt zu schreiben wird VERGLICHEN.
 *
 * WARUM ALS MODUS UND NICHT ALS ZWEITES SKRIPT (§5): Prüfling und Prüfer müssen
 * dieselbe SPARQL-Kette benutzen. Ein Parallel-Skript mit eigener Abfrage prüfte
 * am Ende die Übereinstimmung zweier Abfragen und nicht die des Artefakts mit der
 * Amtsquelle — und driftete unbemerkt vom Generator weg (§6.7).
 *
 * DREI EIGENSCHAFTEN, DIE DAS TOR TRAGEN:
 *  (a) Ein STILL PARTIELLES ODER LEERES SPARQL-Resultat kann nie grün werden.
 *      Erstens greift auch im Prüf-Modus je Batch das COUNT-Tor mit frischem
 *      Paar (Regel 4). Zweitens ist jede fehlende Zeile per Konstruktion ROT:
 *      der Vergleich ist mengengleich in BEIDE Richtungen, ein Teilergebnis
 *      erscheint also als «weggefallen» und nicht als «kein Drift». Drittens
 *      bricht ein Resultat von 0 Zeilen sofort ab, statt 597 Weggefallene zu
 *      melden — die ehrlichere Diagnose (Endpoint, nicht Recht). Und weil ein
 *      Verlust-Befund und ein gekapptes Resultat gleich AUSSEHEN, wird jeder
 *      Verlust vor der Meldung zweimal unterschiedlich nachgefragt
 *      (`verlustGegenprobe`, Regel 5): so behauptet das Tor nie eine
 *      Rechtsänderung, die es nicht gesehen hat.
 *  (b) Ein NETZFEHLER ist ein eigener Fehlerpfad, nie grün: die einzige I/O-
 *      Strecke (der Batch-Abruf) liegt in einem try/catch, das über
 *      `netzAbbruch()` Ursache UND Nicht-Aussage ausspricht und mit 1 endet.
 *      Belegt am 28.7.2026 gegen einen unerreichbaren Host («fetch failed») und
 *      gegen eine falsche Endpoint-Adresse («antwortet 405»).
 *  (c) Der Stichtag ist im Prüf-Modus OPTIONAL und dann der heutige Tag (UTC).
 *      Das ist bewusst: ein Drift-Tor, das gegen den EINGEFRORENEN Stichtag des
 *      Artefakts prüfte, könnte die wichtigste Drift-Art gar nicht sehen — eine
 *      Konsolidierung, die NACH dem Artefakt-Stand in Kraft trat. Wanduhr steckt
 *      damit nur im Prüf-Pfad (Frage: «gilt das heute noch?»), nie im
 *      Schreib-Pfad und nie in der Rechenlogik (§2).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ERLASS_REGISTER } from '../../src/lib/normtext/register';
import { sparqlSelect, type SparqlBinding } from '../fedlex-sparql';
import {
  einzelUrteilFuerGekappte, RANG, SPRACHE, type AliasZeile,
  DATENZEILE_PRAEFIX, artefaktKopf, artefaktLeib,
} from './abk-einzelurteil';
import { vergleiche } from './vergleich';

export type { AliasZeile };

/**
 * Ziel-Artefakt, aufgelöst RELATIV ZU DIESER DATEI — nicht zum cwd (Härtung
 * Linse 2, 28.7.2026).
 *
 * Vorher stand hier der cwd-relative Pfad 'src/lib/normtext/…'. Bei einem Lauf
 * ausserhalb des Repo-Roots (Worktree-Unterordner, CI-Schritt mit anderem
 * working-directory, `vite-node` aus scripts/) zeigte er ins Leere. Die Folge
 * war nicht etwa ein Fehler, sondern etwas Schlimmeres: `existsSync` lieferte
 * false, `bestandZeilen()` gab 0 zurück, und weil das Regressions-Tor nur bei
 * `alt > 0` greift, war es STILL ABGESCHALTET — genau die Konstellation aus
 * §6.7 (ein Tor, das nicht scheitern kann). Geschrieben worden wäre dann auch
 * noch an den falschen Ort.
 *
 * `import.meta.url` ist unabhängig vom cwd; von scripts/normtext/ sind es zwei
 * Ebenen zum Repo-Root.
 */
const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ZIEL = resolve(WURZEL, 'src/lib/normtext/abk-aliase.generated.ts');

/** VALUES-Batchgrösse. Verifiziert an 227 SR in 6 Batches (27.7.2026). */
const BATCH = 40;
/** Wiederholungen je Batch, wenn COUNT ≠ Zeilenzahl (stille Teilergebnisse). */
const VERSUCHE = 5;

/** Datentyp-IRI der SR-Nummer. OHNE ihn treffen auch `id`/`id-amt` (Regel 1). */
const NOTATION_TYP = 'https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique';

// ── Argumente ───────────────────────────────────────────────────────────────
/** `--check`: nicht schreiben, sondern gegen die Amtsquelle vergleichen (Drift-Tor). */
const NUR_PRUEFEN = process.argv.includes('--check');
const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const STICHTAG = datumArg
  ? datumArg.slice('--datum='.length)
  // Prüf-Modus ohne --datum: heute (UTC). Begründung (c) im Datei-Kopf.
  : (NUR_PRUEFEN ? new Date().toISOString().slice(0, 10) : '');
function pruefeStichtag(): void {
  if (/^\d{4}-\d{2}-\d{2}$/.test(STICHTAG)) return;
  console.error('--datum=YYYY-MM-DD ist Pflicht (§2: reproduzierbarer Stand, kein Date.now()).');
  process.exit(1);
}

// ── SR-Liste aus dem Register (§5: das Register ist die eine Quelle) ─────────
//
// ALLE Bund-Einträge mit sr-Feld — Volltext-Snapshots, pdf-embed (EMRK 0.101,
// NYÜ 0.277.12) und nur-live-link-Stubs gleichermassen; auch Staatsverträge
// (SR 0.*). KANTONALE Einträge bleiben aussen vor: ihr `sr` ist eine kantonale
// Systematiknummer, keine SR-Nummer — «161.12» aus dem Kanton BE würde am
// Bundes-Endpoint einen fremden Erlass treffen (§1).
function srListe(): string[] {
  const srs = new Set<string>();
  for (const e of ERLASS_REGISTER) {
    if (e.ebene !== 'bund' || !e.sr) continue;
    if (!/^[0-9][0-9.]*$/.test(e.sr)) {
      console.error(`SR-Nummer '${e.sr}' (key ${e.key}) hat unerwartete Form — Abbruch.`);
      process.exit(1);
    }
    srs.add(e.sr);
  }
  return [...srs].sort(vergleiche);
}

// ── Abfrage ─────────────────────────────────────────────────────────────────

const PREFIXE = `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>`;

/**
 * Gemeinsamer Rumpf von Zähl- und Zeilen-Abfrage. Beide MÜSSEN denselben Rumpf
 * benutzen — eine COUNT-Abfrage über eine andere Projektion zählte etwas
 * anderes als sie absichern soll (§6.7, dieselbe Falle wie eine zweite
 * Zerlegung im Tor).
 */
function rumpf(srs: string[], fenster: 'sparql' | 'clientseitig' = 'sparql'): string {
  const vals = srs.map((s) => `"${s}"^^<${NOTATION_TYP}>`).join(' ');
  const datum = fenster === 'sparql'
    ? `?cc jolux:dateEntryInForce ?von .
  FILTER(?von <= "${STICHTAG}"^^xsd:date)
  FILTER NOT EXISTS { ?cc jolux:dateNoLongerInForce ?bis . FILTER(?bis <= "${STICHTAG}"^^xsd:date) }`
    : `OPTIONAL { ?cc jolux:dateEntryInForce ?von }
  OPTIONAL { ?cc jolux:dateNoLongerInForce ?bis }`;
  return `{
  VALUES ?sr { ${vals} }
  ?e skos:notation ?sr .
  ?cc a jolux:ConsolidationAbstract ; jolux:classifiedByTaxonomyEntry ?e .
  ${datum}
  ?cc jolux:isRealizedBy ?ex .
  ?ex jolux:language ?lu ; jolux:titleShort ?roh .
  BIND(REPLACE(REPLACE(str(?roh), "^\\\\s+", ""), "\\\\s+$", "") AS ?abk)
  FILTER(?abk != "")
  BIND(REPLACE(str(?lu), "^.*/", "") AS ?sprache)
  FILTER(?sprache IN ("DEU", "FRA", "ITA"))
}`;
}

const PROJEKTION = 'SELECT DISTINCT ?sr ?sprache ?abk ?cc WHERE';
/** Einzelabfrage: dieselbe Projektion plus die beiden ungefilterten Datums-Variablen. */
const EINZEL_PROJEKTION = 'SELECT DISTINCT ?sr ?sprache ?abk ?cc ?von ?bis WHERE';

/**
 * Zeilen- UND Zählabfrage aus EINEM Rumpf (Regel 4: eine COUNT-Abfrage über eine
 * andere Projektion zählt etwas anderes, als sie absichern soll). `einzel` schaltet
 * BEIDE zugleich um — Prüfling und Referenz können nicht auseinanderlaufen.
 */
function abfragen(srs: string[], einzel: boolean): { zeilen: string; zaehl: string } {
  const p = einzel ? EINZEL_PROJEKTION : PROJEKTION;
  const r = rumpf(srs, einzel ? 'clientseitig' : 'sparql');
  return {
    zeilen: `${PREFIXE}\n${p} ${r} ORDER BY ?sr ?sprache ?abk`,
    zaehl: `${PREFIXE}\nSELECT (COUNT(*) AS ?n) WHERE { ${p} ${r} }`,
  };
}

/** Untergrenze für jede Abfrage-Zusammensetzung (Gürtel, keine Garantie — Regel 5). */
const MIN_BATCH = 3;

/**
 * Batch-Aufteilung, die keinen Batch unter `MIN_BATCH` SR erzeugt.
 *
 * WAS DAS IST UND WAS NICHT: ein billiger Gürtel, kein Beweis. Kleine
 * Zusammensetzungen sind empirisch besonders anfällig für die Kappung aus Regel 5
 * (`{0.142.30}` ⇒ 0/0, `{0.101, X}` ⇒ X still weg), aber die Kappung hängt an den
 * WERTEN, nicht an der Anzahl — eine Mindestgrösse kann sie darum nicht
 * ausschliessen. Tragend gegen falsche Verlust-Urteile ist `verlustGegenprobe()`.
 *
 * Ein Rest unter der Grenze wandert in den vorherigen Batch. Bleibt die Gesamtzahl
 * darunter, bricht der Lauf ab, statt einem Ergebnis zu trauen, für das es keine
 * Erfahrung gibt.
 */
function batchListe(srs: string[]): string[][] {
  if (srs.length < MIN_BATCH) {
    console.error(
      `Nur ${srs.length} SR-Nummer(n): unter ${MIN_BATCH} ist keine Abfrage-Zusammensetzung `
      + 'erprobt, und die Kappung aus Regel 5 trifft gerade kleine Mengen — Abbruch statt '
      + 'eines Ergebnisses, dem nicht zu trauen ist.',
    );
    process.exit(1);
  }
  const batches: string[][] = [];
  for (let i = 0; i < srs.length; i += BATCH) batches.push(srs.slice(i, i + BATCH));
  const letzter = batches[batches.length - 1];
  if (batches.length > 1 && letzter.length < MIN_BATCH) {
    batches[batches.length - 2].push(...letzter);
    batches.pop();
  }
  return batches;
}

/**
 * Ein Batch mit COUNT-Gegenprobe (Regel 4). Gibt die Bindings zurück, sobald
 * Zeilenzahl == COUNT; sonst Abbruch nach `VERSUCHE` Anläufen — lieber gar kein
 * Artefakt als ein stillschweigend unvollständiges.
 *
 * BEIDE SEITEN WERDEN WIEDERHOLT (Härtung Linse 2, 28.7.2026). Vorher wurde der
 * COUNT genau EINMAL geholt und danach nur die Zeilen-Abfrage wiederholt. Das
 * unterstellt, dass ausgerechnet die COUNT-Antwort nie vom Teilergebnis-Fehler
 * betroffen ist — wofür es keinen Grund gibt: derselbe Endpoint, dasselbe
 * Verhalten (Regel 4 nennt ≈2 von 20 Läufen). War der ERSTE COUNT der
 * verstümmelte, verglich der Generator vier weitere Male gegen eine zu kleine
 * Sollzahl; im ungünstigsten Fall stimmte ein ebenfalls verstümmeltes
 * Zeilen-Ergebnis mit ihr überein und das «Tor» bestätigte ein Teilergebnis.
 * Ein Vergleich, dessen Referenz denselben Fehler haben kann wie der Prüfling,
 * prüft nichts (§6.7). Darum je Anlauf ein FRISCHES Paar (COUNT + Zeilen); nur
 * ein Paar aus demselben Anlauf zählt als Übereinstimmung.
 */
async function batchMitZaehltor(
  srs: string[], nr: number | string, einzel = false,
): Promise<SparqlBinding[]> {
  const gesehen: string[] = [];
  for (let versuch = 1; versuch <= VERSUCHE; versuch += 1) {
    const q = abfragen(srs, einzel);
    const zaehl = await sparqlSelect(q.zaehl);
    const soll = Number(zaehl[0]?.n?.value ?? 'NaN');
    if (!Number.isFinite(soll)) {
      console.error(`Batch ${nr}: COUNT-Abfrage lieferte keinen Wert — Abbruch.`);
      process.exit(1);
    }
    const zeilen = await sparqlSelect(q.zeilen);
    if (zeilen.length === soll) {
      const hinweis = versuch > 1 ? ` (nach ${versuch} Anläufen)` : '';
      console.log(`  Batch ${nr}: ${srs.length} SR → ${zeilen.length}/${soll} Zeilen${hinweis}`);
      return zeilen;
    }
    gesehen.push(`${versuch}: ${zeilen.length}/${soll}`);
    console.log(`  Batch ${nr}: Teilergebnis ${zeilen.length}/${soll} (Zeilen/COUNT) — Anlauf ${versuch + 1}`);
  }
  console.error(
    `Batch ${nr}: Zeilen- und COUNT-Abfrage stimmen nach ${VERSUCHE} Anläufen mit je frisch `
    + `geholtem Paar nicht überein [${gesehen.join(', ')}]. Schwankt auch die Sollzahl, liefert `
    + 'der Endpoint auf BEIDEN Abfragen Teilergebnisse. Kein Artefakt geschrieben — später '
    + 'erneut fahren.',
  );
  process.exit(1);
}

// ── Bestehendes Artefakt (Regressions-Tor) ──────────────────────────────────

/**
 * Zeilenzahl des committeten Artefakts; 0 NUR, wenn es nachweislich noch nicht
 * existiert (Erstlauf).
 *
 * Jeder andere Grund, den Bestand nicht lesen zu können — Leserechte, defekte
 * Datei, unerwartetes Format —, führt zum ABBRUCH statt zur stillen 0 (Härtung
 * Linse 2). Eine 0 schaltet das Regressions-Tor unten ab (`alt > 0`); ein
 * Generator, der wegen eines Lesefehlers plötzlich jede Zeilenzahl akzeptiert,
 * ist gefährlicher als einer, der gar nicht läuft (§6.7). Existiert die Datei
 * und enthält sie KEINE Alias-Zeile, ist das ebenfalls kein Erstlauf, sondern
 * ein kaputtes Artefakt — auch das bricht ab.
 */
function bestandZeilen(): number {
  if (!existsSync(ZIEL)) {
    console.log(`  Erstlauf: ${ZIEL} existiert noch nicht — Regressions-Tor greift ab dem nächsten Lauf.`);
    return 0;
  }
  let inhalt: string;
  try {
    inhalt = readFileSync(ZIEL, 'utf8');
  } catch (e) {
    console.error(
      `Bestand ${ZIEL} existiert, ist aber nicht lesbar (${String(e)}) — Abbruch. `
      + 'Ohne gelesenen Bestand wäre das Zeilen-Regressions-Tor still abgeschaltet (§6.7).',
    );
    process.exit(1);
  }
  const n = (inhalt.match(/^ {2}\{ sr: /gm) ?? []).length;
  if (n === 0) {
    console.error(
      `Bestand ${ZIEL} existiert, enthält aber KEINE Alias-Zeile im erwarteten Format — `
      + 'Abbruch. Entweder ist die Datei beschädigt oder das Zeilen-Format hat sich '
      + 'geändert; in beiden Fällen misst das Regressions-Tor nichts mehr (§6.7).',
    );
    process.exit(1);
  }
  return n;
}

/** Eine Artefakt-Zeile, exakt so wie `schreibeArtefakt()` sie rendert. */
const ZEILEN_MUSTER = /^ {2}\{ sr: "([^"]+)", sprache: '(de|fr|it)', abk: ("(?:[^"\\]|\\.)*") \},$/;

/**
 * Die committeten Alias-Zeilen — die PRÜFLING-Seite des Drift-Tors.
 *
 * Anders als `bestandZeilen()` ist ein FEHLENDES Artefakt hier kein Erstlauf,
 * sondern rot: ohne committete Seite gibt es nichts zu vergleichen, und ein Tor,
 * das ohne Prüfling grün meldet, ist genau das Tor aus §6.7. Ebenso rot ist eine
 * Zeile, die das Muster nicht trifft: dann hat entweder eine Hand-Edition das
 * Artefakt verändert (verboten) oder das Render-Format des Generators hat sich
 * geändert, ohne dass der Parser mitgezogen wurde — in beiden Fällen verglich
 * das Tor sonst gegen eine Teilmenge und schwiege über den Rest.
 */
function bestandLesen(): AliasZeile[] {
  if (!existsSync(ZIEL)) {
    console.error(
      `PRÜFUNG UNMÖGLICH: ${ZIEL} existiert nicht. Ohne committetes Artefakt gibt es keinen `
      + 'Prüfling — erst `npm run gen:abk-aliase -- --datum=$(date +%F)` fahren.',
    );
    process.exit(1);
  }
  const inhalt = readFileSync(ZIEL, 'utf8');
  const kandidaten = inhalt.split('\n').filter((z) => z.startsWith(DATENZEILE_PRAEFIX));
  const zeilen: AliasZeile[] = [];
  for (const z of kandidaten) {
    const m = ZEILEN_MUSTER.exec(z);
    if (!m) {
      console.error(
        `Artefakt-Zeile trifft das erwartete Format NICHT: ${z}\n`
        + `  → ${ZIEL} von Hand editiert oder Render-Format geändert. Abbruch statt Teilvergleich (§6.7).`,
      );
      process.exit(1);
    }
    zeilen.push({ sr: m[1], sprache: m[2] as 'de' | 'fr' | 'it', abk: JSON.parse(m[3]) as string });
  }
  if (zeilen.length === 0) {
    console.error(`Artefakt ${ZIEL} enthält KEINE Alias-Zeile — Abbruch (kaputtes Artefakt, §6.7).`);
    process.exit(1);
  }
  return zeilen;
}

/**
 * Netzfehler sind ein EIGENER, ehrlicher Fehlerpfad — nie grün und nie stumm
 * (§8). Ohne diesen Riegel entschied die Laufzeit, was ein nicht erreichbarer
 * Endpoint bedeutet; ein Prüf-Modus, der bei DNS-Fehler oder HTTP 500 mit
 * unklarem Stack endet, wird im Cron-Log leicht als «rot wegen Infrastruktur,
 * schon gut» weggelesen. Darum wird hier ausgesprochen, was der Lauf NICHT
 * aussagt: er ist keine Entlastung des Artefakts.
 */
function netzAbbruch(e: unknown): never {
  console.error(
    `\nNETZFEHLER gegen die Amtsquelle: ${e instanceof Error ? e.message : String(e)}\n`
    + '  → Der Lauf hat NICHTS festgestellt: kein Drift-Freispruch und '
    + `${NUR_PRUEFEN ? 'keine Abnahme' : 'kein geschriebenes Artefakt'}. `
    + 'Ein unerreichbarer Endpoint darf nie grün werden (§6.7/§8) — später erneut fahren.',
  );
  process.exit(1);
}

// ── Einzelurteil gegen die Kappung (Regel 5, Nachtrag 31.8.2026) ────────────
//
// Die Rechenlogik (Currency-Fenster, Fensterung der Bindings, Anläufe) steht in
// scripts/normtext/abk-einzelurteil.ts — netzfrei und darum unter Unit-Test. HIER
// bleibt nur die I/O-Strecke: dieselbe `batchMitZaehltor`-Kette wie der Hauptlauf
// (COUNT-Tor, Regel 4), nur mit `einzel = true`, und derselbe Netzfehler-Riegel.

/** Adapter Modul → Endpoint: EINE SR, ohne Datums-FILTER, mit COUNT-Zähltor. */
const holeEinzel = async (sr: string, etikett: string): Promise<SparqlBinding[]> => {
  try {
    return await batchMitZaehltor([sr], etikett, true);
  } catch (e) {
    netzAbbruch(e);
  }
};

/** Konflikt-Abbruch des Urteilsmittels — zwei Kürzel werden nie getiebreakt (§8). */
const einzelKonflikt = (meldung: string): never => {
  console.error(`\n${meldung}`);
  process.exit(1);
};

// ── Drift-Vergleich (nur --check) ───────────────────────────────────────────

/**
 * HINWEIS, KEIN TOR: deutsche Anzeige-Abkürzung im ERLASS_REGISTER ≠ amtliches
 * `titleShort` derselben SR-Nummer.
 *
 * Warum sichtbar: eine solche Divergenz ist eine offene FACHLICHE Frage (§7/§8) —
 * das Register führt die im Schrifttum gebräuchliche Anzeigeform, Fedlex die
 * amtliche Kurzbezeichnung; welche im UI stehen soll, entscheidet nicht ein
 * Build-Schritt. Belegter Fall (28.7.2026): SR 0.142.30 — Register «GFK»
 * (Genfer Flüchtlingskonvention), Fedlex «FK».
 *
 * Warum trotzdem kein Tor: rot machen hiesse, eine Antwort zu erzwingen, die nur
 * David geben kann; still lassen hiesse, sie zu vergessen. Darum ausgewiesen mit
 * Verweis auf die Aktenlage — Entscheid offen in
 * bibliothek/recherche/fedlex-abkuerzungen-titleshort.md.
 */
function divergenzHinweis(live: AliasZeile[]): void {
  const amtlichDe = new Map<string, string>();
  for (const z of live) if (z.sprache === 'de') amtlichDe.set(z.sr, z.abk);
  // Vergleich auf Buchstaben/Ziffern reduziert: «BVV 2» vs «BVV2» oder «Cst.» vs
  // «CST» sind Schreibvarianten desselben Kürzels und keine Divergenz.
  const kern = (s: string): string => s.toUpperCase().replace(/[^A-Z0-9ÄÖÜ]/g, '');
  const zeilen: string[] = [];
  for (const e of ERLASS_REGISTER) {
    if (e.ebene !== 'bund' || !e.sr) continue;
    const amtlich = amtlichDe.get(e.sr);
    if (!amtlich || kern(e.kuerzel) === kern(amtlich)) continue;
    zeilen.push(`SR ${e.sr} (key ${e.key}): Register '${e.kuerzel}' ≠ Fedlex '${amtlich}'`);
  }
  if (zeilen.length === 0) return;
  console.log(
    `\n  HINWEIS (kein Tor) — ${zeilen.length} DE-Divergenz(en) Register ↔ amtliches titleShort. `
    + 'Anzeigeform ist ein fachlicher Entscheid (§7/§8), kein Build-Fakt; Aktenlage in '
    + 'bibliothek/recherche/fedlex-abkuerzungen-titleshort.md:',
  );
  for (const z of zeilen.sort(vergleiche)) console.log(`    · ${z}`);
}

/**
 * Vergleicht die LIVE geholten Zeilen mengengleich mit dem committeten Artefakt
 * und endet selbst — grün nur bei Deckungsgleichheit.
 *
 * Der Vergleich läuft in BEIDE Richtungen über das Tripel (sr, sprache, abk).
 * Das ist nicht Kosmetik, sondern das zweite Count-Tor: eine still gekappte
 * SPARQL-Antwort erscheint dann zwingend als «weggefallen» und kann nicht als
 * «kein Drift» durchgehen. Ein Vergleich nur in Richtung live→Artefakt («ist
 * alles Geholte bekannt?») wäre bei jedem Teilergebnis grün — genau der
 * Fehlklassifikator aus §6.7.
 */
/** Wie viele Zusammensetzungen versucht werden, bis «kein Urteil» gilt. */
const KOMPOSITIONEN = 4;
/** Wie viele davon aussagekräftig sein müssen, damit ein Verlust bestätigt wird. */
const NOETIGE_KOMPOSITIONEN = 2;
/** Füll-SR je Nachfrage. Grosse Mengen liefern empirisch zuverlässiger als kleine. */
const FUELLUNG = 12;

/**
 * EINE Nachfrage-Zusammensetzung, abgesichert durch Positivkontrollen.
 *
 * BEENDET DEN PROZESS NICHT (Befund Runde 2). Vorher stand hier bei fehlenden
 * Kontrollen ein `process.exit(1)` — damit war jede weitere Zusammensetzung toter
 * Code, sobald die erste kappte, und sechs SR waren dauerhaft unbeurteilbar. Eine
 * nicht aussagekräftige Zusammensetzung ist kein Endzustand, sondern ein Grund,
 * die nächste zu versuchen.
 *
 * `kontrollen` sind Tripel, die der HAUPTLAUF für SR DIESER Nachfrage geliefert
 * hat; sie müssen wiederkommen, sonst hat die Zusammensetzung selbst gekappt.
 */
async function nachfrage(
  srs: string[], etikett: string, kontrollen: AliasZeile[],
): Promise<{ tripel: Set<string>; stumm: AliasZeile[] }> {
  // KONSTRUKTIONS-ZUSICHERUNG, kein rot gezeigter Riegel (Ehrlichkeit §6.7):
  // `verlustGegenprobe` schliesst SR ohne Live-Zeile vorher aus, darum ist diese
  // Liste heute nie leer — die Bedingung ist unerreichbar und wird auch nicht als
  // Nachweis geführt. Sie bleibt als Absturzsicherung für künftige Umbauten: wer
  // die Reihenfolge ändert, bekommt einen klaren Fehler statt einer Nachfrage,
  // die nichts prüfen kann.
  if (kontrollen.length === 0) {
    throw new Error(
      `Nachfrage ${etikett} ohne Positivkontrolle aufgerufen — programmatisch unmöglich, solange `
      + 'nur absicherbare SR hierher kommen. Kein Urteil ohne Prüfmittel (§6.7).',
    );
  }
  let roh: SparqlBinding[];
  try {
    roh = await batchMitZaehltor(srs, `Nachfrage ${etikett} (${srs.length} SR, ${kontrollen.length} Positivkontrollen)`);
  } catch (e) {
    netzAbbruch(e);
  }
  const tripel = new Set<string>();
  for (const b of roh) {
    const sr = b.sr?.value ?? '';
    const sp = SPRACHE[b.sprache?.value ?? ''];
    const abk = (b.abk?.value ?? '').trim();
    if (!sr || !sp || abk === '') continue;
    tripel.add(`${sr}|${sp}|${abk}`);
  }
  const stumm = kontrollen.filter((z) => !tripel.has(`${z.sr}|${z.sprache}|${z.abk}`));
  if (stumm.length > 0) {
    console.log(
      `    Nachfrage ${etikett} NICHT aussagekräftig: ${stumm.length}/${kontrollen.length} `
      + `Positivkontrollen fehlen (z.B. SR ${stumm[0].sr}/${stumm[0].sprache} '${stumm[0].abk}') — `
      + 'diese Zusammensetzung hat selbst gekappt (Regel 5), nächste versuchen.',
    );
  }
  return { tripel, stumm };
}

/**
 * Füll-SR für Zusammensetzung `nr`, GESTREUT über den SR-Raum.
 *
 * Warum nicht `slice(0, n)`: das nahm immer die codepoint-kleinsten SR und war
 * damit eine feste, nachweislich pathologische Wertemenge — sie kappt sechs der
 * 200 Alias-SR deterministisch (Regel 5, Nachtrag Runde 2). Gleichmässige
 * Schritte mit Offset je Zusammensetzung liefern verschiedene, über den ganzen
 * Raum verteilte Mengen: deterministisch und reproduzierbar, aber nicht immer
 * dieselbe Falle. Eine «gesunde» Auswahl gibt es nicht — wirksam ist nur die
 * Vielfalt plus Positivkontrolle.
 */
function fuellSr(fremde: string[], nr: number, wieViele: number): string[] {
  const n = Math.min(wieViele, fremde.length);
  const schritt = Math.max(1, Math.floor(fremde.length / n));
  const raus: string[] = [];
  for (let j = 0; raus.length < n && j < fremde.length * 2; j += 1) {
    const kandidat = fremde[(nr + j * schritt) % fremde.length];
    if (!raus.includes(kandidat)) raus.push(kandidat);
  }
  return raus.sort(vergleiche);
}

/**
 * GEGENPROBE GEGEN DAS STILLE TEILERGEBNIS (§0 Ziff. 3: ein Fehlbestand ist ein
 * VERDACHT, keine Ursache).
 *
 * Ein «weggefallenes» Kürzel und ein still gekapptes Resultat sehen im Vergleich
 * IDENTISCH aus, und das COUNT-Tor kann sie nicht trennen (Regel 4 fängt nur den
 * Fall, in dem NUR eine der beiden Abfragen gekappt ist).
 *
 * ── Was die adversariale Gegenprüfung an der ersten Fassung widerlegt hat ─────
 * Fassung 1 fragte die betroffenen SR mit drei «Kanarienvögeln» nach — die aber
 * aus `live.slice(0, 3)` stammten und damit dieselben drei Sprachzeilen EINER
 * fremden SR waren. Ergebnis: eine 2-SR-Nachfrage, in der die fremde SR lebte und
 * die betroffene still gekappt wurde. Empirisch belegt an drei Fällen ({0.101, X}
 * mit X ∈ 221.213.11 / 221.411.1 / 955.033.0, je 5/5 Läufe): das Tor meldete
 * «Verlust in der Gegenprobe bestätigt» für Kürzel, die Fedlex führt — also eine
 * erfundene Rechtsänderung samt Aufforderung, sie ins Artefakt zu übernehmen (§8).
 * Ein Prüfer, dessen Kontrolle systematisch woanders hinschaut als der Prüfling,
 * bestätigt bloss (§6.7).
 *
 * ── Was Runde 2 an Fassung 3 widerlegt hat ───────────────────────────────────
 * Fassung 3 füllte mit `fremde.slice(0, 3)` — immer denselben drei codepoint-
 * kleinsten SR. Diese Wertemenge kappt deterministisch sechs SR (Regel 5,
 * Nachtrag), und weil eine nicht aussagekräftige Nachfrage den Prozess BEENDETE,
 * kam die zweite Zusammensetzung nie zum Zug: für diese sechs SR hätte es niemals
 * ein Urteil gegeben. Echter Drift auf SR 251 (KG) hätte den Wochen-Cron dauerhaft
 * rot gefahren — mit Schuldzuweisung an den Endpoint und ohne Heilungsweg.
 *
 * ── Was jetzt gilt ───────────────────────────────────────────────────────────
 * (1) BIS ZU `KOMPOSITIONEN` Versuche, jeder mit anderer, GESTREUTER Füllung.
 *     Eine nicht aussagekräftige Nachfrage beendet nichts mehr — sie wird
 *     übersprungen und die nächste Wertemenge versucht.
 * (2) Ein Verlust gilt erst als bestätigt, wenn `NOETIGE_KOMPOSITIONEN`
 *     aussagekräftige, VERSCHIEDENE Wertemengen ihn einig vermissen (der
 *     Hauptlauf ist eine weitere, unabhängige Zusammensetzung).
 * (3) JEDE SR der Nachfrage trägt eine Positivkontrolle DERSELBEN SR — Füll-SR
 *     immer, betroffene SR bei Teilverlust (`it` fehlt, `de` lebt). Kein
 *     Fremd-SR-Ersatz: genau daran ist Fassung 2 gescheitert.
 * (4) Eine betroffene SR OHNE jede Live-Zeile ist nicht absicherbar: dann fehlt
 *     das Prüfmittel, und es gibt kein Urteil — nur der Auftrag, von Hand gegen
 *     die amtliche Fassung zu prüfen. Fail-closed statt Rateschluss.
 * (5) Taucht ein Kürzel in IRGENDEINER Nachfrage auf, ist es kein Verlust,
 *     sondern eine Kappung — mit ausdrücklicher Warnung, NICHT zu regenerieren.
 * (6) Zu wenige fremde SR für verschiedene Wertemengen ⇒ ehrlicher Abbruch statt
 *     zweier identischer «unabhängiger» Nachfragen (die Fehlerklasse aus Runde 1).
 */
async function verlustGegenprobe(
  verloren: AliasZeile[], live: AliasZeile[],
): Promise<{ bestaetigt: AliasZeile[]; aufgetaucht: AliasZeile[] }> {
  const schl = (z: AliasZeile): string => `${z.sr}|${z.sprache}|${z.abk}`;
  const betroffen = [...new Set(verloren.map((z) => z.sr))].sort(vergleiche);

  // (3) Absicherbarkeit zuerst — ohne Live-Zeile derselben SR kein Prüfmittel.
  const liveJeSr = new Map<string, AliasZeile[]>();
  for (const z of live) liveJeSr.set(z.sr, [...(liveJeSr.get(z.sr) ?? []), z]);
  const nichtAbsicherbar = betroffen.filter((sr) => !liveJeSr.has(sr));
  if (nichtAbsicherbar.length > 0) {
    console.error(
      `\nKEIN URTEIL MÖGLICH für ${nichtAbsicherbar.length} SR: der Hauptlauf hat für sie GAR `
      + 'keine Zeile geliefert, also gibt es keine Positivkontrolle derselben SR — und ohne die '
      + 'ist «weggefallen» von «still gekappt» nicht zu unterscheiden (Regel 5). Betroffen:',
    );
    for (const sr of nichtAbsicherbar) {
      const artefakt = verloren.filter((z) => z.sr === sr).map((z) => `${z.sprache} '${z.abk}'`).join(', ');
      console.error(`    • SR ${sr}: Artefakt führt ${artefakt}`);
    }
    console.error(
      '\n  → NICHT regenerieren und NICHTS löschen. Von Hand gegen die amtliche Fassung prüfen '
      + '(fedlex.admin.ch, SR-Nummer suchen: trägt der Erlass noch eine Kurzbezeichnung, und gilt '
      + 'er noch?) und den Befund fachlich abnehmen (§7/§8). Lauf danach wiederholen.\n',
    );
    process.exit(1);
  }

  const fremde = [...liveJeSr.keys()].filter((sr) => !betroffen.includes(sr)).sort(vergleiche);
  const kontrollen = (fuell: string[]): AliasZeile[] => [
    ...fuell.map((sr) => liveJeSr.get(sr)![0]),                    // je Füll-SR eine eigene Zeile
    ...betroffen.flatMap((sr) => liveJeSr.get(sr)!.slice(0, 1)),   // Teilverlust: überlebende Zeile
  ];

  // (6) Ohne genügend fremde SR gäbe es keine VERSCHIEDENEN Wertemengen — dann
  // wäre die «unabhängige Bestätigung» dieselbe Abfrage zweimal (Fehlerklasse
  // Runde 1). Lieber ehrlich abbrechen als Unabhängigkeit behaupten.
  const noetigeFremde = NOETIGE_KOMPOSITIONEN * MIN_BATCH;
  if (fremde.length < noetigeFremde) {
    console.error(
      `\nKEIN URTEIL MÖGLICH: nur ${fremde.length} fremde SR mit Live-Zeile, nötig sind `
      + `${noetigeFremde} für ${NOETIGE_KOMPOSITIONEN} wirklich verschiedene Wertemengen. Zwei `
      + 'gleiche Nachfragen wären keine unabhängige Bestätigung (§6.7) — kein Verlust-Urteil.\n',
    );
    process.exit(1);
  }

  // (1)+(2) Mehrere gestreute Zusammensetzungen, bis genügend aussagekräftig sind.
  const aussagekraeftig: Array<Set<string>> = [];
  const wertemengen: string[] = [];
  for (let nr = 0; nr < KOMPOSITIONEN && aussagekraeftig.length < NOETIGE_KOMPOSITIONEN; nr += 1) {
    const fuell = fuellSr(fremde, nr, FUELLUNG);
    const srs = [...new Set([...betroffen, ...fuell])].sort(vergleiche);
    const kennung = srs.join(',');
    if (wertemengen.includes(kennung)) continue;   // identische Wertemenge zählt nicht doppelt
    wertemengen.push(kennung);
    const { tripel, stumm } = await nachfrage(srs, String(nr + 1), kontrollen(fuell));
    if (stumm.length === 0) aussagekraeftig.push(tripel);
  }

  if (aussagekraeftig.length < NOETIGE_KOMPOSITIONEN) {
    console.error(
      `\nKEIN URTEIL MÖGLICH: nur ${aussagekraeftig.length} von ${wertemengen.length} versuchten `
      + `Zusammensetzungen waren aussagekräftig, nötig sind ${NOETIGE_KOMPOSITIONEN}. Der Endpoint `
      + 'kappt derzeit zu breit, um «weggefallen» von «gekappt» zu trennen (Regel 5). Betroffen:',
    );
    for (const sr of betroffen) {
      const artefakt = verloren.filter((z) => z.sr === sr).map((z) => `${z.sprache} '${z.abk}'`).join(', ');
      console.error(`    • SR ${sr}: Artefakt führt ${artefakt}`);
    }
    console.error(
      '\n  → NICHTS löschen und NICHT regenerieren. Lauf später wiederholen; hält der Befund an, '
      + 'von Hand gegen die amtliche Fassung prüfen und fachlich abnehmen (§7/§8).\n',
    );
    process.exit(1);
  }

  const aufgetaucht = verloren.filter((z) => aussagekraeftig.some((t) => t.has(schl(z))));
  const bestaetigt = verloren.filter((z) => aussagekraeftig.every((t) => !t.has(schl(z))));
  return { bestaetigt, aufgetaucht };
}

async function pruefeDrift(hauptlauf: AliasZeile[], srAnzahl: number): Promise<never> {
  // Null-Resultat: das ist ein Endpoint-Befund, keine Rechtsänderung. Ohne diesen
  // Riegel meldete das Tor 597 «weggefallene» Kürzel und behauptete damit etwas
  // über das Recht, was in Wahrheit eine Aussage über die Leitung ist (§8).
  if (hauptlauf.length === 0) {
    console.error(
      '\nENDPOINT LIEFERTE 0 ZEILEN bei nicht-leerem Register — das ist ein Quellen-, kein '
      + 'Rechts-Befund. Kein Drift-Urteil (§8): Abfrage/Endpoint prüfen und erneut fahren.',
    );
    process.exit(1);
  }

  // Prüfling ZUERST lesen (billig, und ein fehlendes Artefakt soll vor dem Netz
  // scheitern), dann die im Hauptlauf gekappten SR einzeln nachurteilen — erst
  // danach beginnt der gewöhnliche Vergleich, auf EINEM Zeilenbestand.
  const bestand = bestandLesen();
  const live = [...hauptlauf,
    ...await einzelUrteilFuerGekappte(hauptlauf, bestand, STICHTAG, holeEinzel, einzelKonflikt)];

  divergenzHinweis(live);

  const tripel = (z: AliasZeile): string => `${z.sr}|${z.sprache}|${z.abk}`;
  const paar = (z: AliasZeile): string => `${z.sr}|${z.sprache}`;

  const liveTripel = new Set(live.map(tripel));
  const bestandTripel = new Set(bestand.map(tripel));
  const livePaare = new Map<string, string[]>();
  const bestandPaare = new Map<string, string[]>();
  for (const z of live) livePaare.set(paar(z), [...(livePaare.get(paar(z)) ?? []), z.abk].sort(vergleiche));
  for (const z of bestand) bestandPaare.set(paar(z), [...(bestandPaare.get(paar(z)) ?? []), z.abk].sort(vergleiche));

  const geaendert: string[] = [];
  const neu: string[] = [];
  const weggefallen: string[] = [];

  for (const [p, liveAbk] of livePaare) {
    const bestandAbk = bestandPaare.get(p);
    const [sr, sprache] = p.split('|');
    if (!bestandAbk) {
      neu.push(`SR ${sr} / ${sprache}: Fedlex führt '${liveAbk.join("', '")}' — im Artefakt fehlt die Zeile`);
    } else if (liveAbk.join('\u0000') !== bestandAbk.join('\u0000')) {
      geaendert.push(`SR ${sr} / ${sprache}: Artefakt '${bestandAbk.join("', '")}' → Fedlex '${liveAbk.join("', '")}'`);
    }
  }
  const verloren: AliasZeile[] = [];
  for (const [p, bestandAbk] of bestandPaare) {
    if (livePaare.has(p)) continue;
    const [sr, sprache] = p.split('|');
    for (const abk of bestandAbk) verloren.push({ sr, sprache: sprache as 'de' | 'fr' | 'it', abk });
    weggefallen.push(
      `SR ${sr} / ${sprache}: Artefakt führt '${bestandAbk.join("', '")}', Fedlex führt am ${STICHTAG} `
      + 'KEIN Kürzel mehr (aufgehoben, abgelöst oder titleShort entfernt)',
    );
  }

  // SR-Zahl aus `live` gezählt, nicht aus dem Hauptlauf: sonst zeigte die Zeile
  // 199/230 neben 597 Zeilen, sobald eine SR per Einzelabfrage dazukam.
  const srMitAlias = new Set(live.map((z) => z.sr)).size;
  console.log(`\n  Live:     ${live.length} Zeilen (${srMitAlias}/${srAnzahl} SR mit Alias)`);
  console.log(`  Artefakt: ${bestand.length} Zeilen (${ZIEL})`);

  const summe = geaendert.length + neu.length + weggefallen.length;
  if (summe === 0) {
    console.log(
      `  OK — Artefakt deckungsgleich mit der Amtsquelle (Stand ${STICHTAG}), `
      + `${liveTripel.size} Tripel beidseitig, ${bestandTripel.size} committet.\n`,
    );
    process.exit(0);
  }

  // Verlust-Befund ⇒ zwei verschieden zusammengesetzte Nachfragen, BEVOR er als
  // Rechtsänderung gemeldet wird (Regel 5).
  let gegenprobe = '';
  if (verloren.length > 0) {
    const betroffen = [...new Set(verloren.map((z) => z.sr))].sort(vergleiche);
    console.log(
      `\n  ${verloren.length} Verlust-Befund(e) über ${betroffen.length} SR — Gegenprobe gegen `
      + `stille Kappung: bis zu ${KOMPOSITIONEN} gestreute Zusammensetzungen, ${NOETIGE_KOMPOSITIONEN} müssen aussagekräftig sein:`,
    );
    const { bestaetigt, aufgetaucht } = await verlustGegenprobe(verloren, live);
    if (aufgetaucht.length > 0) {
      console.error(
        `\nSTILLE KAPPUNG statt Drift: ${aufgetaucht.length} der ${verloren.length} angeblich `
        + 'weggefallenen Kürzel liefert die Nachfrage doch — der Hauptlauf war für diese SR '
        + 'gekappt, obwohl COUNT und Zeilenzahl übereinstimmten. Betroffen:',
      );
      for (const z of aufgetaucht.sort((a, b) => vergleiche(a.sr, b.sr) || vergleiche(a.abk, b.abk))) {
        console.error(`    • SR ${z.sr} / ${z.sprache}: '${z.abk}' — in der Nachfrage vorhanden`);
      }
      console.error(
        '\n  → KEIN Drift-Urteil und NICHT regenerieren: das Artefakt ist unverdächtig, die '
        + 'Abfrage war unvollständig (§8). Lauf später wiederholen.\n',
      );
      process.exit(1);
    }
    gegenprobe = ` · Verlust in ${NOETIGE_KOMPOSITIONEN} aussagekräftigen, verschiedenen Zusammensetzungen bestätigt (${bestaetigt.length} Tripel)`;
  }

  console.error(
    `\nDRIFT gegen die amtliche Quelle: ${geaendert.length} geändert · ${neu.length} neu · `
    + `${weggefallen.length} weggefallen (Stichtag ${STICHTAG}, Fedlex-SPARQL jolux:titleShort)`
    + `${gegenprobe}.`,
  );
  const block = (titel: string, zeilen: string[]): void => {
    if (zeilen.length === 0) return;
    console.error(`\n  ${titel} (${zeilen.length}):`);
    for (const z of zeilen.sort(vergleiche)) console.error(`    • ${z}`);
  };
  block('GEÄNDERTE amtliche Abkürzung', geaendert);
  block('NEUE amtliche Abkürzung', neu);
  block('WEGGEFALLENE amtliche Abkürzung', weggefallen);
  console.error(
    '\n  → Artefakt neu erzeugen (`npm run gen:abk-aliase -- --datum=$(date +%F)`), Diff '
    + 'BEWUSST abnehmen (§7: die amtliche Fassung ist massgeblich, nicht das Artefakt), '
    + 'danach `npm run check:normkeys` — eine geänderte Abkürzung kann Zuordnungen '
    + 'verschieben oder neue Kollisionen erzeugen.',
  );
  if (weggefallen.length > 0) {
    console.error(
      '  → WEGGEFALLENE Kürzel zuerst VON HAND gegen die amtliche Fassung prüfen: ein Regen-Lauf '
      + 'löscht sie aus dem Artefakt, und der Endpoint kappt nachweislich still (Regel 5). Zwei '
      + 'unabhängige Zusammensetzungen sind ein starkes Indiz, kein Beweis — die Löschung eines '
      + 'amtlichen Kürzels ist eine fachliche Abnahme, kein Build-Schritt (§7/§8).',
    );
  }
  console.error('');
  process.exit(1);
}

// ── Hauptlauf ───────────────────────────────────────────────────────────────

/**
 * Der ganze Lauf in EINER Funktion — damit der Unit-Test dieses Skript importieren
 * kann, ohne dass es dabei losläuft (Muster wie `scripts/check-schlankheit.ts`).
 * `process.argv[1]` taugt als Weiche nicht: unter `vite-node` zeigt es auf den
 * vite-node-Bin, nicht auf dieses Skript — darum die von Vitest selbst gesetzte
 * Umgebungsvariable. Im CLI-Betrieb ist das Verhalten unverändert.
 */
export async function main(): Promise<void> {
  pruefeStichtag();
  const srs = srListe();
  const modus = NUR_PRUEFEN ? 'check:fedlex-abk-netz (Drift-Prüfung, schreibt nicht)' : 'gen:abk-aliase';
  console.log(`\n── ${modus} — Stand ${STICHTAG}, ${srs.length} SR-Nummern aus dem Register ──`);

  const roh: SparqlBinding[] = [];
  try {
    const batches = batchListe(srs);
    for (let i = 0; i < batches.length; i += 1) {
      roh.push(...await batchMitZaehltor(batches[i], i + 1));
    }
  } catch (e) {
    netzAbbruch(e);
  }

  // ── Filter + Konflikt-Prüfung ───────────────────────────────────────────────
  // Der innere Schlüssel ist die Sprache, nicht irgendein String: er stammt
  // ausnahmslos aus SPRACHE[] (Zeile 167) und wird bei Zeile 865 als
  // AliasZeile.sprache weitergereicht. Als `string` deklariert, war der Übergang
  // dorthin ungeprüft (QS-TYP-LUECKE 15.8.2026) — Typ-Enge, kein Verhalten.
  const jeSrSprache = new Map<string, Map<'de' | 'fr' | 'it', Set<string>>>();   // sr → sprache → {abk}
  const ccVon = new Map<string, Set<string>>();                       // "sr|sprache|abk" → {cc}
  let verworfenLeer = 0;

  for (const b of roh) {
    const sr = b.sr?.value ?? '';
    const sp = SPRACHE[b.sprache?.value ?? ''];
    const abk = (b.abk?.value ?? '').trim();          // Trim ein zweites Mal (Regel 3)
    if (!sr || !sp) continue;
    if (abk === '') { verworfenLeer += 1; continue; }
    let proSprache = jeSrSprache.get(sr);
    if (!proSprache) { proSprache = new Map(); jeSrSprache.set(sr, proSprache); }
    let menge = proSprache.get(sp);
    if (!menge) { menge = new Set(); proSprache.set(sp, menge); }
    menge.add(abk);
    const schl = `${sr}|${sp}|${abk}`;
    const ccs = ccVon.get(schl) ?? new Set<string>();
    ccs.add(b.cc?.value ?? '');
    ccVon.set(schl, ccs);
  }

  const konflikte: string[] = [];
  for (const [sr, proSprache] of jeSrSprache) {
    for (const [sp, menge] of proSprache) {
      if (menge.size <= 1) continue;
      const detail = [...menge].sort(vergleiche)
        .map((a) => `${a} [${[...(ccVon.get(`${sr}|${sp}|${a}`) ?? [])].sort(vergleiche).join(', ')}]`)
        .join(' vs. ');
      konflikte.push(`SR ${sr} / ${sp}: ${detail}`);
    }
  }
  if (konflikte.length > 0) {
    console.error(
      `\n${konflikte.length} Konflikt(e) je (sr, sprache) — zwei amtliche Kürzel trotz `
      + 'Currency-Fenster. NICHT automatisch entschieden (§8); Ursache prüfen '
      + '(Schatten-Abstract? Erlass-Ablösung am Stichtag?):',
    );
    for (const k of konflikte.sort(vergleiche)) console.error(`  • ${k}`);
    process.exit(1);
  }

  // ── Zeilen bauen, deterministisch sortiert (sr, sprache, abk) ───────────────
  const zeilen: AliasZeile[] = [];
  for (const [sr, proSprache] of jeSrSprache) {
    for (const [sprache, menge] of proSprache) {
      for (const abk of menge) zeilen.push({ sr, sprache, abk });
    }
  }
  zeilen.sort((a, b) => vergleiche(a.sr, b.sr)
    || RANG[a.sprache] - RANG[b.sprache]
    || vergleiche(a.abk, b.abk));

  // ── Prüf-Modus: vergleichen statt schreiben; endet in pruefeDrift ───────────
  //
  // Der Prüf-Modus verzweigt ERST HIER, nach Abfrage, COUNT-Tor, Trim/Leerstring-
  // Verwurf und Konflikt-Prüfung: er sieht damit genau dieselben Zeilen, die ein
  // Schreib-Lauf schreiben würde. Jede frühere Verzweigung hätte einen zweiten,
  // nur ähnlichen Pfad geschaffen — und ein Prüfer, der etwas anderes berechnet
  // als der Generator, prüft den Generator nicht (§5/§6.7).
  if (NUR_PRUEFEN) await pruefeDrift(zeilen, srs.length);

  // ── Regressions-Tor: weniger Zeilen als committet ⇒ Abbruch (§6.7) ──────────
  const alt = bestandZeilen();
  if (alt > 0 && zeilen.length < alt) {
    console.error(
      `\nREGRESSION: ${zeilen.length} Zeilen neu gegen ${alt} committete. Ein Lauf, der `
      + 'Bestand verliert, wird nicht geschrieben — Endpoint-Ausfall oder Register-Änderung '
      + `prüfen (${ZIEL}).`,
    );
    process.exit(1);
  }

  // ── Schreiben ───────────────────────────────────────────────────────────────
  const proSprache = { de: 0, fr: 0, it: 0 };
  for (const z of zeilen) proSprache[z.sprache] += 1;
  const ohneAlias = srs.filter((sr) => !jeSrSprache.has(sr));

  // Template-Literal AN SPALTE 0 — Gegenprüfungs-Befund 1 (PR #588, 31.8.2026):
  // beim Einrücken in main() wanderten die Literal-Folgezeilen auf Spalte 2,
  // und Template-Literale konservieren führenden Whitespace. Der Schreib-Lauf
  // hätte die erste Datenzeile mit 4 Spaces erzeugt — bestandLesen() filtert
  // exakt auf '  { sr: ' und hätte sie STILL verloren. Darum steht das Literal
  // bewusst unabhängig von der umgebenden Einrückung; Wächter: der
  // Schreibpfad-Test in src/tests/abk-einzelurteil.test.ts.
  writeFileSync(
    ZIEL,
    artefaktKopf(STICHTAG, jeSrSprache.size, srs.length, proSprache) + artefaktLeib(zeilen),
    'utf8',
  );

  console.log(`\n  Zeilen:      ${zeilen.length} (de ${proSprache.de} · fr ${proSprache.fr} · it ${proSprache.it})`);
  console.log(`  SR mit Alias: ${jeSrSprache.size}/${srs.length}`);
  if (verworfenLeer > 0) console.log(`  verworfen (leeres titleShort): ${verworfenLeer}`);
  if (ohneAlias.length > 0) {
    console.log(`  OHNE Alias (${ohneAlias.length}) — kein titleShort in der geltenden Fassung:`);
    console.log(`    ${ohneAlias.join(', ')}`);
  }
  console.log(`  geschrieben: ${ZIEL}${alt > 0 ? ` (vorher ${alt} Zeilen)` : ''}\n`);
}

if (!process.env.VITEST) await main();
