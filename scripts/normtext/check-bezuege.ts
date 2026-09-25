// ─── Tor: Bezugs-Schicht (W2·7-BEZUG, B1–B3) ────────────────────────────────
//
// Prüft die neuen Artefakte public/rechtsprechung/bezuege/*.json gegen die drei
// Dinge, die sie tragen müssen:
//
//  T1 · PROJEKTIONS-GLEICHHEIT (§5/§6). Aus den Bundesgerichts-Kanten eines
//       Bezugs-Shards muss sich die bestehende Artikel-Ebene (norm-index.json
//       proNormArtikel) ZEICHENGLEICH nachrechnen lassen. Das ist der Beweis,
//       dass es EINEN Rechenweg gibt und nicht zwei, die zufällig ähnlich
//       aussehen.
//
//       WAS «PROJEKTION» HIER GENAU HEISST — die erste Fassung dieses Tors hat
//       es falsch gefasst und ist beim ersten Lauf an 78 Artikeln rot geworden;
//       die Zahl war richtig, die erwartete Gleichheit falsch. Die beiden
//       Artefakte DECKELN VERSCHIEDEN, und zwar mit Absicht:
//         · norm-index: EIN Topf «Bundesgericht», Deckel 8. Ein unpubliziertes
//           Urteil steht darin nur, wenn es sich gegen acht BGE durchsetzt —
//           praktisch nie (Ist: 61 von 11'491 Kanten).
//         · bezuege: bis B6 Deckel 8 JE STATUS, SEIT B7 GAR KEIN DECKEL.
//       Die Invariante lautet darum: bge- und bger-Kanten des Shards
//       zusammengeworfen, nach der BESTANDS-Ordnung sortiert und auf 8 gekappt
//       == norm-index.
//
//       B7 MACHT DIESE PRÜFUNG SCHÄRFER, nicht schwächer — und das ist der
//       Punkt, an dem man sich täuschen könnte. Bis B6 stützte sie sich auf ein
//       Teilfolgen-Argument: der Shard enthielt nur je acht bge und acht bger,
//       die gemeinsamen Top-8 konnten aber nie einen Eintrag brauchen, der in
//       seiner eigenen Klasse hinter Platz 8 lag. Das Argument war richtig, aber
//       es war ein Argument. Seit B7 liegen ALLE bundesgerichtlichen Kanten im
//       Shard; die Prüfung rechnet damit buchstäblich dieselbe Menge durch
//       dieselbe totale Ordnung wie der Schreiber. Sie braucht keine Annahme
//       mehr — und dass die CHRONOLOGISCHE Vorsortierung des Shards die
//       Projektion nicht verschiebt, ist genau das, was sie mitprüft.
//  T2 · REFERENZIELLE INTEGRITÄT (§7). Jeder Dokument-key existiert im
//       Entscheid-Manifest; jeder kantonale Erlass-key hat einen Normtext-
//       Snapshot. Ein Chip, der ins Leere zeigt, ist schlimmer als kein Chip.
//  T3 · FACETTEN- UND AUSLIEFERUNGS-VOLLSTÄNDIGKEIT (§8). Jede Kante trägt alle
//       fünf Facetten, `status` ist konsistent mit `ebene`/`kanton`, die
//       Status-Klassen sind nicht verschränkt, INNERHALB der Klasse läuft die
//       Ordnung chronologisch neu→alt (B7), und die gelieferten Kanten je Status
//       sind GENAU `gesamtProArtikel` — nicht «höchstens», sondern gleich. Die
//       frühere Deckel-Prüfung («nicht mehr als 8») ist durch diese
//       Gleichheits-Prüfung ERSETZT: sie ist die Umkehrung derselben Frage und
//       fängt zusätzlich den Fall, dass eine Kante verloren geht.
//  T6 · BILANZ-GLEICHHEIT (§5, B7/c). `bezuege-bilanz.json` wird aus den Shards
//       neu gerechnet und verglichen. Die Datei speist die korpusweiten Zahlen
//       im Rechtsprechungs-Dropdown; driftete sie, behauptete die Bedienfläche
//       eine Bestandslage, die die Shards nicht decken.
//
// Dazu ein Grössen-Deckel je Shard (§15) und die ehrliche Facetten-Bilanz im
// Protokoll (§8: Zahlen mit Grundgesamtheit, nicht bloss «grün»).
//
// ── §6.7-SABOTAGE-PROBE (28.7.2026, B1–B3) ─────────────────────────────────
// Jede der vier damaligen Prüfungen wurde einmal ROT gesehen; hier steht der
// WÖRTLICHE Befund des Laufs, nicht eine Beschreibung davon (§7):
//  · T1 — erste Kante an STGB/1 aus dem Shard entfernt:
//    «T1 STGB/1: Bundesgerichts-Projektion weicht ab — norm-index
//     [bge_147_IV_274, bge_148_IV_329, …] vs. bezuege [bge_148_IV_329, …]»
//  · T2 — erfundener Dokument-key in BS-154.100:
//    «BS-154.100/3: Dokument-key 'bs_x_Y.2020.1' nicht im Entscheid-Manifest (§7).»
//  · T3 — OR/41 auf 11 bge-Kanten aufgebläht, Grundgesamtheit auf 1 gesetzt:
//    «OR/41: Deckel bge überschritten (11 > 8).» +
//    «OR/41: Grundgesamtheit bge=1 kleiner als das Gezeigte (11).»
//  · Grössen-Deckel — SHARD_BUDGET_KB testweise auf 100: 12 Shards rot
//    (STPO 711, STGB 539, ZPO 432, ZGB 385, OR 367, BV 316, BGG 292, ATSG 223,
//     SCHKG 171, AIG 139, IVG 137, DBG 103 KB).
//
// ── §6.7-SABOTAGE-PROBE DER NEUEN PRÜFUNGEN (29.7.2026, B7) ────────────────
// Ein Tor, das nicht scheitern kann, ist gefährlicher als keines. Die drei mit
// B7 hinzugekommenen bzw. umgestellten Prüfungen wurden je einmal rot gesehen;
// wörtliche Befunde des Laufs:
//  · T3e (Vollständigkeit statt Deckel) — an OR/41 die letzten drei kantonalen
//    Kanten aus `proArtikel` entfernt (51 → 48), `gesamtProArtikel` unverändert:
//    «OR/41: kantonal — 18 Kanten geliefert, gesamtProArtikel sagt 21. Seit B7
//     wird JEDE Kante ausgeliefert; eine Differenz heisst, dass wieder gesiebt
//     wird (§8).»
//    Im selben Lauf schlug T6 mit an — gewollt: eine fehlende Kante verschiebt
//    auch die Korpus-Bilanz («kantenJeStatus.kantonal = 50341, aus den Shards
//    gerechnet 50338»).
//  · T3g (chronologische Ordnung) — an OR/41 die ersten beiden bge-Kanten
//    vertauscht:
//    «OR/41: Ordnung innerhalb 'bge' nicht chronologisch — 'bge_152_III_7'
//     (2025-03-13) steht vor 'bge_151_IV_265' (2025-04-07), das jünger ist
//     (B7: neu→alt).»
//  · T6 (Bilanz) — `kantenJeStatus.eidg` in bezuege-bilanz.json von 164 auf 99
//    von Hand verstellt:
//    «bezuege-bilanz.json: kantenJeStatus.eidg = 99, aus den Shards gerechnet
//     164 — die Bilanz ist eine Projektion der Shards, keine zweite Wahrheit (§5).»
//  · Grössen-Deckel neu — SHARD_BUDGET_KB testweise auf 700: 5 Shards rot
//    (BGG 2504, STPO 1194, BS-154.100 1083, BV 746, STGB 714 KB).
//
// ── T3g/B-1 (25.9.2026, BS-Delta): Platzhalter-Datum ans Klassenende ────────
//  · Vorher-Rot (Tor ohne B-1, echter Korpus mit dem ersten datumUnbekannt-
//    Entscheid): 12 Verstösse, z.B. «STPO/21: Ordnung innerhalb 'kantonal' nicht
//    chronologisch — 'bs_appellationsgericht_DGS.2022.30' (2022-12-20) steht vor
//    'bs_appellationsgericht_DGS.2025.13' (2025-01-01), das jünger ist».
//  · Sabotage der neuen Regel — DGS.2025.13 in STPO/21 an den Anfang der Klasse
//    'kantonal' verschoben: «STPO/21: Ordnung innerhalb 'kantonal' — datierte
//    Kante 'bs_appellationsgericht_DGS.2025.33' (2026-01-13) steht nach
//    'bs_appellationsgericht_DGS.2025.13' mit unbekanntem Datum (B-1: unbekannt
//    ans Klassenende).»

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { EntscheidManifest } from '../../src/lib/rechtsprechung/register';
import type { NormEntscheidIndex } from '../../src/lib/rechtsprechung/norm-index';
import { normArtikelToken } from '../../src/lib/rechtsprechung/norm-index';
import { baueBezugsBilanz, type BezugsBilanz, type BezugsShard } from './bezuege-bauen';
import {
  STATUS_RANG, bezugStatusFuerEntscheid, vergleicheDatumAbsteigend,
  type BezugStatus,
} from '../../src/lib/verzahnung/facetten';
import { SYSTEMATIK_PRAEFIX } from './kanton-norm-resolver';

const ROOT = process.cwd();
const PUB = join(ROOT, 'public', 'rechtsprechung');
const BEZ = join(PUB, 'bezuege');

/**
 * Grössen-Deckel je Bezugs-Shard (§15).
 *
 * MESSVERFAHREN, damit die Zahlen nachprüfbar sind (§7): Dateigrösse in Bytes
 * (`stat -f%z`), daneben KiB = Bytes/1024, gzip mit Stufe -6 (`gzip -6 -c … | wc -c`).
 *
 * ── B7 HAT DIE SHARDS WACHSEN LASSEN, UND ZWAR ABSICHTLICH ─────────────────
 * Der Auslieferungs-Deckel «8 je Status» ist aufgehoben (David-Auftrag
 * 28.7.2026): statt 24'173 stehen jetzt 75'365 Kanten in den Shards. Das Budget
 * wird deshalb angehoben — NICHT weil man an eine Schranke gestossen ist,
 * sondern weil die Schranke für eine andere Datenmenge bemessen war. Der
 * Unterschied ist der ganze §8-Punkt: eine Schranke anzuheben, weil man sie
 * reisst, ist keine Massnahme; eine Schranke einem deklarierten
 * Umfangs-Entscheid nachzuziehen, ist eine.
 *
 * IST-WERTE, MESSLAUF vom 29.7.2026 — roh (`stat -f%z`, KiB = B/1024) und
 * gzip -6, die B1–B6-Werte aus `git show origin/main:<pfad>` durch dieselbe
 * Pipe. NICHT aus Erinnerung: die erste Fassung dieser Tabelle nannte für BGG
 * «291.9» und für BS-154.100 «139.6»; beide liessen sich nicht reproduzieren
 * (Gegenprüfung Runde 1/I2 und Runde 2/J5 — zweimal dieselbe Klasse, darum
 * steht das Messkommando jetzt hier und die Bytes daneben):
 *   BGG         299'226 B =   292.2 KiB /  44.1 gzip  →  2'564'602 B = 2'504.5 KiB / 300.2
 *   STPO        734'056 B =   716.9     /  63.6       →  1'222'589 B = 1'193.9     / 102.0
 *   BS-154.100   87'539 B =    85.5     /   —         →  1'108'953 B = 1'083.0     /  97.0
 *   BV          324'851 B =   317.2     /  46.8       →    764'047 B =   746.1     / 123.3
 *   STGB        555'835 B =   542.8     /  56.3       →    731'389 B =   714.2     /  77.8
 *   ATSG        229'326 B =   224.0                   →    560'469 B =   547.3
 *   ZPO         445'690 B =   435.2                   →    541'025 B =   528.3
 *   ZGB         396'695 B =   387.4                   →    388'167 B =   379.1
 *   OR          376'991 B =   368.2                   →    290'514 B =   283.7
 * ZGB und OR SCHRUMPFEN trotz aufgehobenem Deckel — dort spart die kompaktere
 * Serialisierung mehr, als die zusätzlichen Kanten kosten. Verzeichnis gesamt
 * 13 MB (vorher 7.5 MB) über 311 Shards. Ohne `serialisiereShard` (Begründung
 * dort) stünde BGG bei 3'578.5 KiB.
 * (Die aktuellen Werte gibt jeder Lauf dieses Tors aus — die Liste ist der
 * Stand bei der Festlegung, nicht die laufende Wahrheit.)
 *
 * 3200 KB = grösster Ist-Wert (BGG) + ~28 % Reserve — etwas knapper als die
 * bisherigen 43 %, und zwar mit Absicht: BGG ist der Ausreisser, nicht der
 * Normalfall (Art. 42 BGG allein trägt 4'140 Kanten, weil ihn praktisch jedes
 * Bundesgerichtsurteil zur Beschwerdebegründung zitiert). Bei diesem Artefakt
 * SOLL das Tor früh anschlagen und eine Entscheidung erzwingen, statt weiter
 * mitzuwachsen. Fliessend nachzuziehen wie die übrigen Korpus-Deckel
 * (Freigabe-Logik David 26.6.2026), aber nicht stillschweigend.
 *
 * WARUM DAS TRAGBAR IST (§15, Logikverlust-Bewertung: KEINER): der Bezugs-Shard
 * liegt nicht auf dem kritischen Pfad. Er wird nur geladen, wenn überhaupt eine
 * Instanz-Facette aktiv ist, dann im Leerlauf und AN DER STELLE des schlanken
 * norm-index-Shards (`bezuegeLaden.ts`), nie zusätzlich. Gemessen zählt für den
 * Nutzer der gzip-Wert seines EINEN Erlasses, nicht die Summe.
 *
 * Der Wert ist damit NICHT mehr derselbe wie `SHARD_BUDGET_KB` in
 * check-entscheide.ts (dort 1024). Die frühere Begründung — «beide Shards
 * liegen auf demselben Lade-Pfad, zwei Deckel wären eine Behauptung über einen
 * Unterschied, den es nicht gibt» — trägt seit B7 nicht mehr: der Unterschied
 * IST jetzt da. Der Entscheid-Shard ist eine gedeckelte Auswahl, der
 * Bezugs-Shard eine Vollliste. Sie gleich zu deckeln hiesse, die Vollliste an
 * einer Zahl zu messen, die für eine Auswahl bemessen wurde.
 */
const SHARD_BUDGET_KB = 3200;

/**
 * Deckel der Bestands-Artikel-Ebene. NACHGEBILDET statt importiert: der Wert
 * lebt als Modul-Konstante in entscheide-schreiben.ts, und den Schreiber zu
 * importieren zöge die halbe Pipeline (Besetzungs-Kanonisierung, ECLI, fs) in
 * ein Lese-Tor. Dass beide übereinstimmen, prüft das Tor selbst: stünde hier
 * eine andere Zahl, wäre T1 sofort rot — das ist die schärfere Sicherung als
 * ein geteilter Import (§6.7).
 */
const LEITFAELLE_PRO_ARTIKEL = 8;

/** Bundesgerichts-Kante in der Form, die die Bestands-Ordnung braucht. */
interface BgKante { key: string; gewicht: number; datum: string; leit: boolean }

/**
 * Die Bestands-Ordnung (`vergleicheLeitfaelle`), nachgebildet wie der Deckel und
 * aus demselben Grund: gewicht ↓, Leitentscheid vor Routine, Datum ↓, key als
 * totaler Tiebreaker. Eine Abweichung macht T1 rot statt still.
 */
function bestandsOrdnung(a: BgKante, b: BgKante): number {
  return b.gewicht - a.gewicht
    || (a.leit ? 0 : 1) - (b.leit ? 0 : 1)
    || (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0)
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

const fehler: string[] = [];
const warn: string[] = [];

/**
 * Artikel-Tokens EINES kantonalen Erlass-Snapshots, in Shard-Normalform.
 *
 * Gelesen wird das Feld `artikel` der Einträge, und zwar UNVERÄNDERT durch
 * `normArtikelToken` — dieselbe Normalisierung, mit der die Shard-Tokens
 * gebildet werden (§5). Kein eigener Zerleger.
 *
 * DASS DAS SO SEIN MUSS, ist gemessen und nicht überlegt: die erste Fassung
 * zerlegte den Wert mit einem eigenen Regex und schnitt dabei die
 * Buchstaben-Artikel ab — der Snapshot führt sie als `'30_b'`, `'7_a'`,
 * `'30 l'`, der Regex machte daraus `'30'` bzw. `'7'`. Das Ergebnis waren 51
 * Hinweise, von denen 47 nur besagten, dass das Prüfwerkzeug seine eigene
 * Schreibweise nicht kennt. Ein Abgleich, der die häufigste Form seiner
 * Vergleichsseite nicht lesen kann, misst nicht den Bestand, sondern sich
 * selbst (§6.7) — und eine Hinweisliste, die zu 92 % aus Eigenrauschen besteht,
 * wird nach dem zweiten Lauf nicht mehr gelesen.
 */
function artikelTokensVonErlass(pfad: string): Set<string> {
  const out = new Set<string>();
  try {
    const roh = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege?: Array<{ artikel?: unknown }> };
    for (const e of roh.eintraege ?? []) {
      if (typeof e?.artikel === 'string' && e.artikel) out.add(normArtikelToken(e.artikel));
    }
  } catch { return new Set(); }
  return out;
}

function main(): void {
  if (!existsSync(BEZ)) {
    console.error('[check:bezuege] public/rechtsprechung/bezuege fehlt — Korpus nicht gebaut (npm run entscheide -- --remap).');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(join(PUB, 'register.json'), 'utf8')) as EntscheidManifest;
  const index = JSON.parse(readFileSync(join(PUB, 'norm-index.json'), 'utf8')) as NormEntscheidIndex;

  // Manifest-Nachschlag: key → Facetten-Quelle (für die Status-Gegenrechnung).
  const doks = new Map(manifest.entscheide.map((e) => [e.key, e]));

  // Kantonaler Normtext-Bestand (Erlass-keys), aus den Snapshot-Dateinamen.
  const kantonKeys = new Set<string>();
  const kantonDir = join(ROOT, 'public', 'normtext', 'kanton');
  if (existsSync(kantonDir)) {
    for (const f of readdirSync(kantonDir)) {
      if (f.endsWith('.json')) kantonKeys.add(f.slice(0, -'.json'.length));
    }
  }

  const dateien = readdirSync(BEZ).filter((f) => f.endsWith('.json')).sort();
  if (!dateien.length) fehler.push('bezuege/ ist leer — kein einziger Shard geschrieben.');

  // Facetten-Bilanz über ALLE Shards (nach Deckel = das, was ausgeliefert wird).
  const kantenJeStatus: Record<string, number> = {};
  const kantenJeEbene: Record<string, number> = {};
  const kantenJeKanton: Record<string, number> = {};
  const kantenJeQuelltyp: Record<string, number> = {};
  let shardsBund = 0, shardsKanton = 0, artikelBuckets = 0, kantenGesamt = 0;
  // Kantonale Kanten nach ZIEL-Ebene (Gegenprüfung Runde 4/D4): ein kantonaler
  // Entscheid kann an einem Bundes- ODER an einem Kantonserlass hängen. Der
  // Modulkopf des Resolvers verwies auf genau diese Aufteilung — es gab sie nur
  // nicht. Eine Zahl, auf die verwiesen wird, muss auch ausgegeben werden (§7).
  let kantonalAnBund = 0, kantonalAnKanton = 0;

  // T1: Bundesgerichts-Kanten einsammeln (ungekappt-je-Status), später projizieren.
  const projektion = new Map<string, BgKante[]>();   // 'ERLASS/artikel' → Kanten
  // T6: die gelesenen Shards für die Bilanz-Gegenrechnung. Gehalten statt neu
  // gelesen — sonst gäbe es einen dritten Lesevorgang derselben 311 Dateien.
  const shards = new Map<string, BezugsShard>();

  for (const datei of dateien) {
    const pfad = join(BEZ, datei);
    const kb = statSync(pfad).size / 1024;
    if (kb > SHARD_BUDGET_KB) {
      fehler.push(`${datei}: ${kb.toFixed(0)} KB über dem Shard-Budget (${SHARD_BUDGET_KB} KB, §15).`);
    }
    const shard = JSON.parse(readFileSync(pfad, 'utf8')) as BezugsShard;
    const erlass = datei.slice(0, -'.json'.length);
    if (shard.erlass !== erlass) fehler.push(`${datei}: erlass-Feld '${shard.erlass}' ≠ Dateiname '${erlass}'.`);
    shards.set(erlass, shard);

    if (shard.erlassEbene === 'kanton') {
      shardsKanton++;
      if (!kantonKeys.has(erlass)) {
        fehler.push(`${datei}: kantonaler Erlass-key ohne Normtext-Snapshot (public/normtext/kanton/${erlass}.json fehlt) — der Bezug zeigte ins Leere (§7).`);
      }
    } else {
      shardsBund++;
    }

    for (const [token, eintraege] of Object.entries(shard.proArtikel ?? {})) {
      artikelBuckets++;
      const zaehler: Partial<Record<BezugStatus, number>> = {};
      let letzterRang = -1;
      /** Vorgänger-Kante INNERHALB der laufenden Status-Klasse (T3g, B7). */
      let vorher: { key: string; datum: string; unbekannt: boolean } | null = null;
      const bgProjektion: BgKante[] = [];
      for (const e of eintraege) {
        kantenGesamt++;
        const kopf = shard.dokumente?.[e.key];
        if (!kopf) {
          fehler.push(`${erlass}/${token}: Kanten-key '${e.key}' ohne Dokument-Kopf im Shard.`);
          continue;
        }
        const f = kopf.facetten;
        // T3a: Facetten vollständig.
        if (!f || !f.quelltyp || !f.ebene || !f.kanton || !f.gericht || !f.status) {
          fehler.push(`${erlass}/${token}/${e.key}: unvollständige Facetten — jede Kante trägt alle fünf (§8).`);
          continue;
        }
        // T3b: Status konsistent mit dem Manifest (nicht bloss mit sich selbst).
        const dok = doks.get(e.key);
        if (!dok) {
          fehler.push(`${erlass}/${token}: Dokument-key '${e.key}' nicht im Entscheid-Manifest (§7).`);
        } else {
          const soll = bezugStatusFuerEntscheid(dok);
          if (soll !== f.status) {
            fehler.push(`${erlass}/${token}/${e.key}: status '${f.status}', aus dem Manifest folgt '${soll}'.`);
          }
          if (dok.kanton !== f.kanton) {
            fehler.push(`${erlass}/${token}/${e.key}: kanton '${f.kanton}' ≠ Manifest '${dok.kanton}'.`);
          }
        }
        // T3c: ebene ist Funktion des Kantons — nie unabhängig gesetzt.
        const sollEbene = f.kanton === 'CH' ? 'bund' : 'kanton';
        if (f.ebene !== sollEbene) {
          fehler.push(`${erlass}/${token}/${e.key}: ebene '${f.ebene}', aus kanton '${f.kanton}' folgt '${sollEbene}'.`);
        }
        // T3d: Anzeige-Ordnung — Status-Klassen nie verschränkt.
        const rang = STATUS_RANG[f.status];
        if (rang < letzterRang) {
          fehler.push(`${erlass}/${token}: Status-Klassen verschränkt ('${f.status}' nach Rang ${letzterRang}) — die Klassentrennung wäre damit weg (§8).`);
        }
        // T3g (B7): INNERHALB einer Klasse chronologisch neu→alt. Der Nutzer
        // scrollt seit B7 eine Linie mit allen Entscheiden ab; läuft die Zeit
        // darin nicht monoton, ist die Linie unlesbar, ohne dass irgendetwas
        // sichtbar kaputt wäre — genau die stille Klasse, gegen die §6.7 steht.
        // Geprüft wird nur die Zeit-Achse: der Gleichstand wird vom Generator
        // über die Bestands-Ordnung aufgelöst und ist hier bewusst nicht
        // nachgebildet (eine zweite Kopie derselben Ordnung wäre §5-Doppelung).
        // B-1 (Generator `bezuege-bauen.ts`, 23.9.2026): eine Kante mit Platzhalter-
        // Datum (`datumUnbekannt`) hat keinen Ort auf der Zeitachse und steht AM ENDE
        // ihrer Klasse. Das Tor prüft genau diese Regel — datiert nach unbekannt ist
        // rot, unbekannt untereinander ohne Zeitvergleich. Bis 25.9.2026 verglich es
        // den Platzhalter (1. Januar des GN-Jahrs) wie ein echtes Datum: unsichtbar,
        // solange der Korpus keinen datumUnbekannt-Entscheid trug (main 8cb868caa: 0);
        // der erste (BS DGS.2025.13, BS-Delta 25.9.2026) machte 12 Artikel rot.
        const unbekannt = kopf.datumUnbekannt === true;
        if (rang === letzterRang && vorher) {
          if (vorher.unbekannt && !unbekannt) {
            fehler.push(`${erlass}/${token}: Ordnung innerhalb '${f.status}' — datierte Kante '${e.key}' (${kopf.datum}) `
              + `steht nach '${vorher.key}' mit unbekanntem Datum (B-1: unbekannt ans Klassenende).`);
          } else if (!vorher.unbekannt && !unbekannt && vergleicheDatumAbsteigend(vorher.datum, kopf.datum) > 0) {
            fehler.push(`${erlass}/${token}: Ordnung innerhalb '${f.status}' nicht chronologisch — `
              + `'${vorher.key}' (${vorher.datum}) steht vor '${e.key}' (${kopf.datum}), das jünger ist (B7: neu→alt).`);
          }
        }
        vorher = { key: e.key, datum: kopf.datum, unbekannt };
        letzterRang = rang;

        // T5 — gewicht darf in nicht messbaren Klassen NICHT als Zahl erscheinen
        // (Gegenprüfung Runde 2, Tor-Auflage). Der Zitier-Graph erkennt nur
        // BGE-Fundstellen und Bundesgerichts-Aktenzeichen; für kantonale und
        // eidgenössische Entscheide ist die In-degree strukturell nicht messbar
        // und wird als `null` ausgeliefert. Fiele das je auf 0 zurück, sähe die
        // Zahl wie ein Messergebnis aus und niemand würde es bemerken — genau
        // die stille Rückfall-Klasse, gegen die §6.7 steht.
        const messbar = f.status === 'bge' || f.status === 'bger';
        if (messbar && typeof e.gewicht !== 'number') {
          fehler.push(`${erlass}/${token}/${e.key}: gewicht ist in der Klasse '${f.status}' messbar, aber nicht gesetzt.`);
        }
        if (!messbar && e.gewicht !== null) {
          fehler.push(`${erlass}/${token}/${e.key}: gewicht=${JSON.stringify(e.gewicht)} in der Klasse '${f.status}', wo es NICHT messbar ist — muss null sein (§8).`);
        }

        zaehler[f.status] = (zaehler[f.status] ?? 0) + 1;
        kantenJeStatus[f.status] = (kantenJeStatus[f.status] ?? 0) + 1;
        kantenJeEbene[f.ebene] = (kantenJeEbene[f.ebene] ?? 0) + 1;
        kantenJeKanton[f.kanton] = (kantenJeKanton[f.kanton] ?? 0) + 1;
        kantenJeQuelltyp[f.quelltyp] = (kantenJeQuelltyp[f.quelltyp] ?? 0) + 1;
        if (f.status === 'kantonal') {
          if (shard.erlassEbene === 'bund') kantonalAnBund++; else kantonalAnKanton++;
        }
        if (f.status === 'bge' || f.status === 'bger') {
          // `e.gewicht` ist `number | null`; `BgKante.gewicht` ist `number`. Bis
          // 15.8.2026 (QS-TYP-LUECKE) sah das niemand, weil scripts/ ungeprüft
          // war — ein `null` wäre als Zahl getarnt in `bestandsOrdnung` gelaufen
          // und hätte dort `b.gewicht - a.gewicht` = NaN ergeben: ein Vergleicher,
          // der NaN liefert, macht die Sortierordnung UNDEFINIERT. Die Bestands-
          // ordnung ist aber genau das, was T1 prüft — der Test wäre also aus
          // einem anderen Grund rot geworden als dem echten.
          //
          // Der Fall ist bereits oben (messbar-Prüfung) als Fehler protokolliert,
          // der Lauf endet ohnehin rot. Die Kante wird hier aus der Projektion
          // AUSGELASSEN statt per throw den Sammel-Bericht abzubrechen — ein
          // Abbruch beim ersten Treffer würde alle weiteren Befunde des Laufs
          // verschlucken (Gegenprüfungs-Hinweis 15.8.2026); der Rot-Grund steht
          // bereits im Fehler-Array, die NaN-Ordnung ist so trotzdem ausgeschlossen.
          if (typeof e.gewicht !== 'number') continue;
          bgProjektion.push({ key: e.key, gewicht: e.gewicht, datum: kopf.datum, leit: f.status === 'bge' });
        }
      }

      // ── T3e (B7): VOLLSTÄNDIGKEIT statt Deckel ──────────────────────────
      //
      // Bis B6 stand hier «nicht mehr als DECKEL_JE_STATUS». Seit der Deckel
      // aufgehoben ist, wäre eine Obergrenzen-Prüfung die falsche Frage: zu
      // prüfen ist, dass NICHTS FEHLT. Die Gleichheit gegen `gesamtProArtikel`
      // fängt beide Richtungen — zu viele Kanten (Doppelung) genauso wie zu
      // wenige (irgendwo siebt wieder jemand).
      //
      // Die frühere T3f («Grundgesamtheit nie KLEINER als das Gezeigte») geht
      // darin auf: `g < n` ist ein Sonderfall von `g !== n`. Der Fall
      // «Grundgesamtheit fehlt ganz» bleibt eigenständig gemeldet, weil er eine
      // andere Ursache hat (Alt-Shard ohne das Feld) als ein Zahlen-Auseinander.
      const gesamt = shard.gesamtProArtikel?.[token] ?? {};
      for (const [st, n] of Object.entries(zaehler) as Array<[BezugStatus, number]>) {
        const g = gesamt[st];
        if (g === undefined) {
          fehler.push(`${erlass}/${token}: Grundgesamtheit für '${st}' fehlt — ohne sie ist die Vollständigkeit der Linie nicht gegenzurechnen (§8).`);
        } else if (g !== n) {
          fehler.push(`${erlass}/${token}: ${st} — ${n} Kanten geliefert, gesamtProArtikel sagt ${g}. `
            + 'Seit B7 wird JEDE Kante ausgeliefert; eine Differenz heisst, dass wieder gesiebt wird (§8).');
        }
      }
      // Gegenrichtung: eine Klasse, die in `gesamtProArtikel` steht, aber in der
      // Liste gar nicht vorkommt. Ohne diese Schleife bliebe genau der Fall
      // still, der am meisten wehtut — eine komplett verschwundene Klasse.
      for (const [st, g] of Object.entries(gesamt) as Array<[BezugStatus, number]>) {
        if (zaehler[st] === undefined && g > 0) {
          fehler.push(`${erlass}/${token}: ${st} — 0 Kanten geliefert, gesamtProArtikel sagt ${g} (§8).`);
        }
      }

      if (bgProjektion.length) projektion.set(`${erlass}/${token}`, bgProjektion);
    }
  }

  // ── T1: Projektions-Gleichheit gegen proNormArtikel ────────────────────────
  const bestand = index.proNormArtikel ?? {};
  const bestandKeys = Object.keys(bestand);
  for (const ak of bestandKeys) {
    const soll = bestand[ak].map((r) => r.key);
    const kanten = projektion.get(ak);
    if (!kanten) {
      fehler.push(`T1 ${ak}: im norm-index vorhanden, in den Bezugs-Shards ohne Bundesgerichts-Kante.`);
      continue;
    }
    const ist = [...kanten].sort(bestandsOrdnung).slice(0, LEITFAELLE_PRO_ARTIKEL).map((k) => k.key);
    if (soll.length !== ist.length || soll.some((k, i) => k !== ist[i])) {
      fehler.push(`T1 ${ak}: Bundesgerichts-Projektion weicht ab — norm-index [${soll.join(', ')}] vs. bezuege [${ist.join(', ')}].`);
    }
  }
  for (const ak of projektion.keys()) {
    if (!(ak in bestand)) {
      fehler.push(`T1 ${ak}: Bundesgerichts-Kante in den Bezugs-Shards, aber nicht im norm-index.`);
    }
  }

  // ── T6 (B7/c): bezuege-bilanz.json ist eine PROJEKTION der Shards (§5) ─────
  //
  // Die Datei liefert dem Rechtsprechungs-Dropdown die korpusweiten Zahlen je
  // Instanz-Klasse («Eidg. — korpusweit 164 Kanten an 93 Artikeln»). Genau weil
  // sie eine Aussage über den BESTAND macht, darf sie nicht selbst gepflegt
  // werden: hier wird sie aus den Shards neu gerechnet und zeichengleich
  // verglichen. Fehlt sie, ist das rot — eine Bedienfläche, die eine Zahl
  // erwartet und keine bekommt, zeigt sonst still gar nichts.
  const bilanzPfad = join(PUB, 'bezuege-bilanz.json');
  if (!existsSync(bilanzPfad)) {
    fehler.push('bezuege-bilanz.json fehlt — die korpusweiten Facetten-Zahlen des Dropdowns hätten keine Quelle (§5/§8).');
  } else {
    const ist = JSON.parse(readFileSync(bilanzPfad, 'utf8')) as BezugsBilanz;
    const soll = baueBezugsBilanz(shards, ist.erzeugt);
    for (const feld of ['kantenJeStatus', 'artikelJeStatus', 'erlasseJeStatus'] as const) {
      const a = soll[feld], b = ist[feld] ?? {};
      for (const st of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<BezugStatus>) {
        if (a[st] !== b[st]) {
          fehler.push(`bezuege-bilanz.json: ${feld}.${st} = ${b[st] ?? '–'}, aus den Shards gerechnet ${a[st] ?? '–'} `
            + '— die Bilanz ist eine Projektion der Shards, keine zweite Wahrheit (§5).');
        }
      }
    }
    if (soll.artikelGesamt !== ist.artikelGesamt) {
      fehler.push(`bezuege-bilanz.json: artikelGesamt = ${ist.artikelGesamt}, aus den Shards gerechnet ${soll.artikelGesamt} (§5).`);
    }
    if (soll.erlasseGesamt !== ist.erlasseGesamt) {
      fehler.push(`bezuege-bilanz.json: erlasseGesamt = ${ist.erlasseGesamt}, aus den Shards gerechnet ${soll.erlasseGesamt} (§5).`);
    }
    console.log(`  Korpusweite Facetten-Bilanz (bezuege-bilanz.json, ${ist.artikelGesamt} Artikel-Buckets über ${ist.erlasseGesamt} Erlasse):`);
    for (const st of Object.keys(soll.kantenJeStatus) as BezugStatus[]) {
      console.log(`    ${st.padEnd(9)} ${String(soll.kantenJeStatus[st]).padStart(6)} Kanten an ${soll.artikelJeStatus[st]} Artikeln, ${soll.erlasseJeStatus[st]} Erlassen`);
    }
  }

  // ── Bilanz ins Protokoll: Zahlen mit Grundgesamtheit (§8) ──────────────────
  const zeile = (o: Record<string, number>): string =>
    Object.keys(o).sort().map((k) => `${k} ${o[k]}`).join(' · ') || '–';
  console.log(`check:bezuege — ${dateien.length} Shards (Bund ${shardsBund}, Kanton ${shardsKanton}), ${artikelBuckets} Artikel-Buckets, ${kantenGesamt} ausgelieferte Kanten.`);
  console.log(`  Kanten je Status:   ${zeile(kantenJeStatus)}`);
  console.log(`  Kanten je Ebene:    ${zeile(kantenJeEbene)}`);
  console.log(`  Kanten je Quelltyp: ${zeile(kantenJeQuelltyp)}`);
  console.log(`  Kanten je Kanton:   ${zeile(kantenJeKanton)}`);
  console.log(`  Kantonale Kanten nach Ziel: Bundes-Erlass ${kantonalAnBund} · Kantons-Erlass ${kantonalAnKanton}`);
  console.log(`  Grundgesamtheit der Extraktion: ${manifest.entscheide.filter((e) => !e.verweis).length} Snapshots im Manifest; `
    + `T1-Projektion gegen ${bestandKeys.length} norm-index-Artikel geprüft.`);
  console.log(`  Kantonale Resolver: ${[...SYSTEMATIK_PRAEFIX.keys()].sort().join(', ') || '–'} `
    + `(Kantone ohne deklarierten Systematik-Präfix haben keine kantonalen Erlass-Kanten — benannte Lücke, §8).`);

  // ── T4: Artikel-Existenz-Abgleich, kantonale Erlasse (HINWEIS, nicht rot) ──
  //
  // Zeigt eine kantonale Kante auf einen §, den der gebundene Erlass gar nicht
  // hat, stimmt die Bindung nicht — so sind die Quell-Tippfehler in der
  // Systematik-Nummer überhaupt gefunden worden (Gegenprüfung Runde 1/B2).
  //
  // WARUM HINWEIS UND NICHT ROT: die Klasse hat ZWEI legitime Ursachen, und
  // keine davon ist ein Defekt dieser Pipeline (§7/§8).
  //  (a) ZEITLICH — ein Entscheid von 2019 zitiert die damals geltende Fassung;
  //      der seither aufgehobene § steht im heutigen Snapshot nicht mehr
  //      (BS-154.100 § 56a/§ 82a, BS-253.100 § 35).
  //  (b) QUELL-ZITIERFEHLER DES GERICHTS — der Entscheid nennt einen §, den der
  //      richtig gebundene Erlass nie geführt hat (BS-291.400 § 31, BS-861.540
  //      § 3a). Der Fehler steht im amtlichen Text; ihn stillschweigend zu
  //      korrigieren hiesse, die Quelle zu überschreiben.
  // Rot wäre hier ein Tor, das die falsche Frage stellt; sichtbar muss die Zahl
  // trotzdem sein (§6.7).
  let existenzGeprueft = 0, bundOhneBestand = 0, bundNurKantonal = 0;
  for (const datei of dateien) {
    const shard = JSON.parse(readFileSync(join(BEZ, datei), 'utf8')) as BezugsShard;
    const kantonal = shard.erlassEbene === 'kanton';
    // SPIEGELBILDLICH AUCH FÜR BUNDES-SHARDS (Gegenprüfung Runde 5/F3). Der
    // Abgleich lief nur kantonal — dabei entsteht dieselbe Klasse auf der
    // Bundesseite, und ein Teil davon liefert dieser PR NEU aus (kantonale
    // Entscheide an Bundesartikeln). Ein Abgleich, der nur eine Hälfte seiner
    // Fläche ansieht, misst nicht den Bestand, sondern seine eigene Reichweite.
    const snapPfad = kantonal
      ? join(ROOT, 'public', 'normtext', 'kanton', `${shard.erlass}.json`)
      : join(ROOT, 'public', 'normtext', 'bund', `${shard.erlass}.json`);
    if (!existsSync(snapPfad)) continue;   // T2 meldet fehlende kantonale Snapshots rot
    const vorhanden = artikelTokensVonErlass(snapPfad);
    if (!vorhanden.size) continue;         // Snapshot ohne lesbare Artikel — nichts zu sagen
    existenzGeprueft++;
    for (const token of Object.keys(shard.proArtikel)) {
      if (vorhanden.has(token)) continue;
      const kanten = shard.proArtikel[token] ?? [];
      if (kantonal) {
        warn.push(`${shard.erlass}: § ${token} kommt im Normtext-Snapshot nicht vor `
          + `(${kanten.length} Kante(n)) — Alt-Fassung ODER Zitierfehler der Quelle.`);
      } else {
        bundOhneBestand++;
        // Trennen, was DIESER PR neu ausliefert: Buckets, die ausschliesslich
        // aus kantonalen Kanten bestehen, gab es vorher nicht (§8 — die eigene
        // Zutat nicht im Bestandsrauschen verstecken).
        const nurKantonal = kanten.length > 0
          && kanten.every((e) => shard.dokumente?.[e.key]?.facetten.status === 'kantonal');
        if (nurKantonal) {
          bundNurKantonal++;
          warn.push(`${shard.erlass}: Art. ${token} kommt im Bundes-Snapshot nicht vor `
            + `(${kanten.length} Kante(n), ausschliesslich kantonal) — Zitierfehler der Quelle, `
            + `Kommentar-Apparat ODER Alt-Fassung.`);
        }
      }
    }
  }
  console.log(`  Artikel-Existenz-Abgleich: ${existenzGeprueft} Erlass-Shards (kantonal UND Bund) gegen ihren Normtext-Snapshot geprüft.`);
  console.log(`    Bundes-Shards: ${bundOhneBestand} Artikel-Buckets ohne Entsprechung im Snapshot, `
    + `davon ${bundNurKantonal} ausschliesslich aus kantonalen Kanten (von dieser Bau-Einheit neu geliefert).`);
  console.log('    (UNTERE SCHRANKE, §8: der Abgleich sieht nur Bindungen auf §§, die es im heutigen '
    + 'Snapshot NICHT gibt. Eine Fehlbindung auf einen §, den der falsche Erlass zufällig auch führt, '
    + 'bleibt unsichtbar — so war «HBG → BS-730.110 § 8» nur über § 8b auffällig.)');

  if (warn.length) {
    console.log(`\ncheck:bezuege — ${warn.length} Hinweis(e), kein Fehler:`);
    for (const w of warn.slice(0, 25)) console.log(`  · ${w}`);
    if (warn.length > 25) console.log(`  … und ${warn.length - 25} weitere.`);
  }
  if (fehler.length) {
    console.error(`\ncheck:bezuege ROT — ${fehler.length} Verstoss/Verstösse:`);
    for (const f of fehler.slice(0, 40)) console.error(`  · ${f}`);
    if (fehler.length > 40) console.error(`  … und ${fehler.length - 40} weitere.`);
    process.exit(1);
  }
  console.log('\ncheck:bezuege GRÜN — Projektion gleich, Referenzen aufgelöst, Facetten vollständig, '
    + 'Auslieferung vollständig (keine Kante gesiebt), Ordnung chronologisch, Bilanz deckungsgleich.');
}

main();
