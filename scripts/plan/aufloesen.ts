// scripts/plan/aufloesen.ts — resolve() nebenwirkungsfrei.
// Ausgelagert aus next.ts (24.7.2026), damit check.ts (Regel 8.4 prüft die Prosa
// gegen die echte plan:next-Ausgabe) resolve importieren kann, ohne dass der
// next-CLI-Block als Import-Nebenwirkung mitläuft (vite-node trägt den Skriptpfad
// nicht in argv — Entry-Erkennung dort ist unmöglich, gemessen 24.7.2026).
import { type Einheit } from './parse';

export interface Buckets {
  readyNow: string[];
  lanes: string[][];
  wartetDep: { id: string; offen: string[] }[];
  blockiert: { id: string; blocker: string }[];
  geparkt: string[];
  inArbeit: string[];
  /** ready-Schritte, deren `feld` gerade von einem `wip`-Schritt belegt ist —
   *  die Kollisionswarnung von plan:next (Steuerungs-Diät 29.8.2026: früher
   *  aus `kollision:`-Globs gegen den 26×-Slot, jetzt aus dem Baufeld). */
  feldBelegt: { id: string; feld: string; durch: string }[];
}

/**
 * Kollidieren zwei Schritte?
 *
 * Ja, wenn sie **dasselbe Baufeld** tragen — und konservativ auch dann, wenn bei
 * einem das Feld FEHLT: ein undeklarierter Schritt kann überall liegen, also gilt
 * er als «kollidiert mit allem» und bekommt eine eigene Lane. Das ist wörtlich
 * dieselbe konservative Regel wie zuvor bei leerer `kollision:`-Liste; nur die
 * Datenquelle ist von einer Pfadliste auf ein Wort geschrumpft.
 */
export function kollidiert(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return true;
  return a === b;
}

/**
 * @param chronikDone IDs, die `ROADMAP-CHRONIK.md` als `done` archiviert
 *   (`chronikErledigte(...).done`). Ein `dep` auf eine solche ID ist ERFÜLLT —
 *   sonst hinge jeder Schritt, dessen Vorgänger in die Chronik überführt wurde,
 *   für immer in `wartetDep` und `plan:next` meldete ihn nie als baubar.
 *   Default leer: `resolve` bleibt damit rein und ohne Dateisystem prüfbar.
 */
export function resolve(
  einheiten: Einheit[],
  queue: string[] = [],
  chronikDone: ReadonlySet<string> = new Set(),
): Buckets {
  // Dokumentreihenfolge = Bau-Reihenfolge. Vorher wurde lexikografisch nach ID
  // sortiert; damit waren alle ready-Einheiten gleichrangig und die Frage nach
  // dem «obersten offenen Schritt» (Ausführungs-Protokoll) nicht beantwortbar.
  //
  // Der frühere Querschnitt-Filter («Querschnitt-Band»-Sektion läuft begleitend,
  // konkurriert nie um den obersten Platz) ist mit dem Plan-Neuschnitt vom
  // 29.8.2026 entfallen: die ROADMAP gliedert nicht mehr nach Auftrags-Herkunft,
  // sondern nach den sieben Baufeldern, und eine «Querschnitt»-Sektion gibt es
  // nicht mehr. Sein Anlass (24.7.2026: ein Querschnitt-Schritt gewann den
  // obersten Platz gegen zwei David-Dekrete) wird seither doppelt gedeckt — von
  // der `@queue` als SSoT der Reihenfolge (deren Rang hier VOR der pos-Ordnung
  // greift) und von check.ts Regel 8.4, die die Prosa gegen diese Ausgabe hält.
  // Dazu kommt der Schnitt selbst: `betrieb` steht als letzte Sektion im
  // Dokument, also gewinnt auch bei LEERER Queue ein Produkt-Schritt.
  const sortiert = [...einheiten].sort((a, b) => a.pos - b.pos);
  const done = new Set(sortiert.filter((e) => e.etikett.status === 'done').map((e) => e.id));
  // Archivierte Erledigungen zählen mit. ROADMAP.md gewinnt trotzdem: steht die ID
  // dort, hat der Schleifendurchlauf oben bereits entschieden — ein in der ROADMAP
  // OFFENER Schritt bleibt offen, auch wenn die Chronik einen alten `done`-Wortlaut
  // desselben Namens trägt (Bestandsform, s. chronikErledigte in parse.ts).
  const inRoadmap = new Set(sortiert.map((e) => e.id));
  for (const id of chronikDone) if (!inRoadmap.has(id)) done.add(id);

  const readyNow: string[] = [];
  const wartetDep: { id: string; offen: string[] }[] = [];
  const blockiert: { id: string; blocker: string }[] = [];
  const geparkt: string[] = [];
  const inArbeit: string[] = [];

  for (const e of sortiert) {
    const t = e.etikett;
    if (t.status === 'done') continue;
    if (t.status === 'wip') { inArbeit.push(e.id); continue; }
    if (t.status === 'parked') { geparkt.push(e.id); continue; }
    if (t.status === 'blocked') { blockiert.push({ id: e.id, blocker: t.blocker ?? '?' }); continue; }
    // status === 'ready'
    const offen = t.dep.filter((d) => !done.has(d));
    if (offen.length) { wartetDep.push({ id: e.id, offen }); continue; }
    readyNow.push(e.id);
  }

  // @queue-Rang VOR der Lane-Bildung: gequeuete IDs führen in Queue-Reihenfolge,
  // alle übrigen behalten (stabiler Sort, Node ≥ 12) ihre pos-Ordnung dahinter.
  if (queue.length) {
    const qrang = new Map(queue.map((id, i) => [id, i]));
    readyNow.sort((a, b) => (qrang.get(a) ?? Infinity) - (qrang.get(b) ?? Infinity));
  }

  // Lanes: greedy in readyNow-Reihenfolge. Ein Schritt steigt in die erste Lane,
  // in der niemand sein Baufeld hält; ein Schritt OHNE Feld bekommt immer eine
  // eigene (konservativ, s. `kollidiert`).
  const feldOf = new Map(sortiert.map((e) => [e.id, e.etikett.feld]));
  const lanes: string[][] = [];
  for (const id of readyNow) {
    const meins = feldOf.get(id) ?? null;
    let platziert = false;
    for (const lane of lanes) {
      if (!lane.some((other) => kollidiert(meins, feldOf.get(other) ?? null))) { lane.push(id); platziert = true; break; }
    }
    if (!platziert) lanes.push([id]);
  }

  // Kollisionswarnung: ein baubarer Schritt, dessen Feld gerade ein `wip`-Schritt
  // hält. Das ist die Nachfolge der 26×-Slot-Sperre — nur greift sie jetzt für
  // JEDE Fläche statt nur für Datenassets, und sie SPERRT nicht, sondern warnt:
  // wer trotzdem baut, tut es in einem eigenen Worktree (§12). Eine harte Sperre
  // wäre hier falsch, weil ein Feld sieben statt hunderter Flächen bündelt.
  const feldBelegt: { id: string; feld: string; durch: string }[] = [];
  for (const id of readyNow) {
    const meins = feldOf.get(id) ?? null;
    if (meins === null) continue;
    const durch = inArbeit.find((w) => feldOf.get(w) === meins);
    if (durch) feldBelegt.push({ id, feld: meins, durch });
  }

  return { readyNow, lanes, wartetDep, blockiert, geparkt, inArbeit, feldBelegt };
}
