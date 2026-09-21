// scripts/plan/lage.ts — Lage-Block für `plan:next`.
//
// Zweck (Bauplan-Review 4.8.2026, Umsetzungs-Ziff. 4a in
// fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md): Jede startende Session soll sehen,
// WAS gerade im Bau ist, ohne dass dafür ein SessionStart-Hook nötig wäre — der
// wäre git-zustandsabhängig und zerstörte den Prompt-Cache (Entscheid QS-TOK/T19).
// `plan:next` ist laut CLAUDE.md ohnehin der Pflicht-Einstieg jeder Session.
//
// Drei Bauregeln dieser Datei:
//
//  * **Nie crashen, immer degradieren (§8).** git/gh können fehlen, hängen oder
//    ohne Netz scheitern. Jeder Ausfall wird eingesammelt und als EINE
//    Hinweiszeile gezeigt — der Rest der Ausgabe bleibt stehen.
//  * **Netzfrei per Default.** `gh pr list` läuft nur mit `--prs`.
//  * **Nichts Bestehendes verschieben.** Der Block wird an die vorhandene
//    `plan:next`-Ausgabe angehängt; zieht man die neuen Zeilen ab, ist sie
//    byte-identisch zu vorher.
//
// Seit 5.8.2026 (`QS-PLAN-WIP-FRISCHE`) beantwortet der Block eine zweite Frage:
// nicht nur «was ist im Bau», sondern «stimmt das noch» — s. `staleWip()` unten.
// Die drei Bauregeln gelten dort unverändert, insbesondere die erste: eine nicht
// abfragbare git-Lage erzeugt KEINE Warnung, nur die Hinweiszeile.
//
// Warum eigener Kommando-Runner statt `sh()` aus bildDaten.ts: (a) dieser Block
// braucht ein hartes Timeout (`gh` ohne Netz hängt sonst am Pflicht-Einstieg),
// das `sh()` nicht kennt; (b) `plan:next` bliebe sonst nicht mehr importfrei
// gegenüber dem `src/lib/startseiteConfig`-Graphen, den bildDaten mitzieht —
// ein Defekt dort dürfte den Pflicht-Einstieg nicht mitreissen. Geteilt wird
// hier nur fachneutrale Infrastruktur, keine Plan-Wahrheit (§4/§5): die
// Schritt-Daten kommen unverändert aus parse.ts/aufloesen.ts.

import { execFileSync } from 'node:child_process';
import { type Einheit } from './parse';
import { parseWorktreeFakten, platzName } from './gitFlaechen';
import { idTrifft } from './specBindung';

/** Ein `wip`-Schritt mit dem von ihm belegten Baufeld (`feld:`). */
export interface WipFlaeche {
  id: string;
  /** `null` = Schritt trägt kein `feld:` — dann gilt konservativ die GESAMTE Fläche. */
  feld: string | null;
}

/** Ein Bau-Platz aus `git worktree list --porcelain`. */
export interface BauPlatz {
  /** Letztes Pfadsegment — so heisst der Platz im Alltag. */
  name: string;
  /** Ausgecheckter Branch, `null` bei detached HEAD. */
  branch: string | null;
  /** Erster Eintrag der Porcelain-Ausgabe = das Haupt-Repo, kein Bau-Platz. */
  haupt: boolean;
}

export interface PrKurz {
  number: number;
  headRefName: string;
  titel: string;
}

/** Rohdaten des Lage-Blocks. `null` heisst «Quelle ausgefallen», nie «leer». */
export interface LageRoh {
  wip: WipFlaeche[];
  worktrees: BauPlatz[] | null;
  branches: string[] | null;
  prs: PrKurz[] | null;
  /** War `--prs` gesetzt? Trennt «nicht gefragt» von «gefragt, ausgefallen». */
  prsGewuenscht: boolean;
  /** Namen der ausgefallenen Quellen, für die eine Hinweiszeile. */
  ausfaelle: string[];
}

/**
 * Kommando-Ausführung; wirft bei Fehler, Timeout oder fehlendem Programm.
 *
 * `cwd` ist optional und seit 21.9.2026 dabei (Schritt «Git-Flächen abräumen»):
 * `git status` muss je Worktree in DESSEN Verzeichnis laufen, und der
 * Integrationstest fährt den Sammler gegen ein temporäres Repo. Bestehende
 * Aufrufer sind unberührt — sie lassen den Parameter weg.
 */
export type Laufe = (cmd: string, args: string[], cwd?: string) => string;

const TIMEOUT_MS = 5000;

export const laufeEcht: Laufe = (cmd, args, cwd) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: TIMEOUT_MS, cwd });

/**
 * Schritt-ID → Namensbestandteil für Branches und Worktrees.
 *
 * Namenskonvention seit 5.8.2026 (Dispatch-§0 Ziff. 5, Skill `auftrag` Ziff. 2):
 * Branch bzw. Worktree trägt den Slug seines Schritts. Deckungsgleich mit der
 * Slug-Bildung der wip-Verstoss-Sonde in bildSeiten.ts; die Rand-Trimmung ist
 * zusätzlich, greift bei den bestehenden IDs aber nie (keine ID beginnt oder
 * endet mit einem Nicht-Alphanumerischen).
 */
export function slug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Ordnet einem Branch-/Worktree-/PR-Namen einen Schritt zu — `null`, wenn
 * keiner passt («ohne Schritt-Bezug»; genau das ist das Signal für
 * unangemeldeten Bau).
 *
 * Der LÄNGSTE passende Slug gewinnt, bei Gleichstand der lexikografisch
 * kleinere: sonst entschiede die Reihenfolge der ROADMAP darüber, ob
 * `feat/qs-code-turso` als `QS-CODE` oder `QS-CODE-TURSO` gilt.
 */
export function schrittFuerNamen(name: string, ids: string[]): string | null {
  const n = name.toLowerCase();
  let treffer: string | null = null;
  let laenge = -1;
  for (const id of ids) {
    const s = slug(id);
    if (!s || !n.includes(s)) continue;
    if (s.length > laenge || (s.length === laenge && treffer !== null && id < treffer)) {
      treffer = id;
      laenge = s.length;
    }
  }
  return treffer;
}

/**
 * `git worktree list --porcelain` → Bau-Plätze. Erster Block ist das Haupt-Repo.
 *
 * Seit 21.9.2026 nur noch eine Sicht auf `parseWorktreeFakten` aus
 * gitFlaechen.ts statt eines zweiten Porcelain-Regex (§5). Verhaltensneutral —
 * die Tests in plan-lage.test.ts blieben unverändert (§6.3).
 */
export function parseWorktrees(porcelain: string): BauPlatz[] {
  return parseWorktreeFakten(porcelain).map((w) => ({
    name: platzName(w.pfad),
    branch: w.branch,
    haupt: w.haupt,
  }));
}

/** wip-Schritte des Resolvers mit ihren Flächen anreichern. */
export function wipFlaechen(einheiten: Einheit[], inArbeit: string[]): WipFlaeche[] {
  return inArbeit.map((id) => ({
    id,
    feld: einheiten.find((e) => e.id === id)?.etikett.feld ?? null,
  }));
}

/** Erhebt die Lage. Kein Wurf nach aussen — Ausfälle landen in `ausfaelle`. */
export function sammleLage(
  wip: WipFlaeche[],
  opt: { prs: boolean; laufe?: Laufe } = { prs: false },
): LageRoh {
  const laufe = opt.laufe ?? laufeEcht;
  const ausfaelle: string[] = [];

  let worktrees: BauPlatz[] | null = null;
  try {
    worktrees = parseWorktrees(laufe('git', ['worktree', 'list', '--porcelain']));
  } catch {
    ausfaelle.push('git worktree list');
  }

  let branches: string[] | null = null;
  try {
    branches = laufe('git', ['branch', '--format=%(refname:short)']).split('\n').map((b) => b.trim()).filter(Boolean);
  } catch {
    ausfaelle.push('git branch');
  }

  let prs: PrKurz[] | null = null;
  if (opt.prs) {
    try {
      const roh = laufe('gh', ['pr', 'list', '--state', 'open', '--json', 'number,headRefName,title', '--limit', '30']);
      prs = (JSON.parse(roh) as { number: number; headRefName: string; title: string }[])
        .map((p) => ({ number: p.number, headRefName: p.headRefName, titel: p.title }));
    } catch {
      prs = null;
      ausfaelle.push('gh pr list');
    }
  }

  return { wip, worktrees, branches, prs, prsGewuenscht: opt.prs, ausfaelle };
}

const TRENNER = ' · ';

/**
 * **Frische-Prüfung «stale wip»** (Schritt `QS-PLAN-WIP-FRISCHE`).
 *
 * Liefert die `wip`-Schritte OHNE Bau-Spur, sortiert — leer, wenn die Lage
 * dazu nichts hergibt.
 *
 * Anlass (Realfall 5.8.2026, zweiter seines Musters nach dem 10-wip-Vorfall vom
 * ~20.7.2026): Eine Session baute `QS-TOK` und `QS-TOK-AUFRAEUMEN` fertig,
 * landete die PRs und endete, ohne die wip-Marke freizugeben. Das Lagebild zeigte
 * stundenlang «im Bau», was nicht mehr im Bau war — jede Folge-Session las eine
 * belegte Fläche, die frei war. Prosa hat das zweimal nicht verhindert, also
 * prüft es jetzt die Maschine (Eskalation Prosa→Maschine, Skill `lehren` Regel 5).
 *
 * **Bau-Spur** ist ein Name, den die bestehende Zuordnungs-Mechanik
 * (`schrittFuerNamen`) auf DIESEN Schritt abbildet: ein Bau-Platz (Worktree,
 * über Platzname UND Branch — genau wie in der Worktree-Zeile), ein lokaler
 * Branch, oder — nur mit `--prs` — ein offener PR über `headRefName` bzw. seinen
 * Titel. Beim Titel entscheidet ein Wortgrenzen-Treffer der ID (`idTrifft`,
 * geteilt mit Regel 11 statt kopiert, §5): blosse Substring-Präsenz liesse
 * «QS-TOK» in «QS-TOK-AUFRAEUMEN» als Spur durchgehen.
 *
 * **«Nicht prüfbar» ist nicht «stale».** Fallen `git worktree list` ODER
 * `git branch` aus, ist über die Branch-Lage nichts bekannt — dann wird NICHT
 * gewarnt (die vorhandene Ausfall-Hinweiszeile sagt bereits, dass die Lage
 * unvollständig ist). Eine Warnung aus fehlenden Daten wäre schlimmer als keine:
 * sie fordert zum Freigeben einer Fläche auf, die belegt sein kann.
 */
export function staleWip(roh: LageRoh, ids: string[]): string[] {
  if (roh.worktrees === null || roh.branches === null) return [];
  const spuren = new Set<string>();
  for (const w of roh.worktrees) {
    if (w.haupt) continue;
    const t = schrittFuerNamen(`${w.name}${w.branch ? ` [${w.branch}]` : ''}`, ids);
    if (t) spuren.add(t);
  }
  for (const b of roh.branches) {
    const t = schrittFuerNamen(b, ids);
    if (t) spuren.add(t);
  }
  for (const p of roh.prs ?? []) {
    const t = schrittFuerNamen(p.headRefName, ids);
    if (t) spuren.add(t);
    for (const id of ids) if (idTrifft(p.titel, id)) spuren.add(id);
  }
  // Stabile Reihenfolge ohne Locale-Abhängigkeit (§2): `sort()` vergleicht
  // Code-Einheiten, `localeCompare` das Gebietsschema der Maschine.
  return roh.wip.map((w) => w.id).filter((id) => !spuren.has(id)).sort();
}

function bezug(name: string, ids: string[]): string {
  const id = schrittFuerNamen(name, ids);
  return id ? `${name} → ${id}` : `${name} → ohne Schritt-Bezug`;
}

/**
 * Formatiert den Lage-Block. Reine Funktion über `LageRoh` — deshalb im Test
 * ohne git/gh prüfbar.
 */
export function lageZeilen(roh: LageRoh, ids: string[]): string[] {
  const z: string[] = ['', '── Lage: was gerade im Bau ist (Sichtbarkeit für Parallel-Sessions) ──'];

  if (roh.wip.length === 0) {
    z.push('🔨 belegte Flächen (wip): — (kein Schritt auf wip)');
  } else {
    z.push('🔨 belegte Flächen (wip):');
    for (const w of roh.wip) {
      const flaechen = w.feld ?? 'kein feld: deklariert → gilt als GESAMTE Fläche';
      z.push(`   ${w.id} → ${flaechen}`);
    }
  }

  // Worktrees: das Haupt-Repo ist kein Bau-Platz. Zugeordnet wird über
  // Platzname UND Branch — der Platz heisst bei Agenten-Worktrees «agent-<hash>»,
  // den Schritt-Slug trägt dann der ausgecheckte Branch.
  const plaetze = (roh.worktrees ?? []).filter((w) => !w.haupt);
  if (roh.worktrees === null) {
    z.push('🌳 Worktrees: — (nicht abfragbar)');
  } else if (plaetze.length === 0) {
    z.push('🌳 Worktrees: — (nur das Haupt-Repo)');
  } else {
    z.push(
      `🌳 Worktrees: ${plaetze
        .map((w) => `${bezug(`${w.name}${w.branch ? ` [${w.branch}]` : ' [detached]'}`, ids)}`)
        .join(TRENNER)}`,
    );
  }

  // Branches, die schon als Worktree-Zeile stehen, hier nicht doppeln.
  const inWorktree = new Set(plaetze.map((w) => w.branch).filter((b): b is string => b !== null));
  const uebrig = (roh.branches ?? []).filter((b) => b !== 'main' && !inWorktree.has(b));
  if (roh.branches === null) {
    z.push('🌿 Branches: — (nicht abfragbar)');
  } else if (uebrig.length === 0) {
    z.push('🌿 weitere Branches (ohne Worktree): —');
  } else {
    z.push(`🌿 weitere Branches (ohne Worktree): ${uebrig.map((b) => bezug(b, ids)).join(TRENNER)}`);
  }

  if (!roh.prsGewuenscht) {
    z.push('🔀 offene PRs: nicht abgefragt (netzfrei per Default — mit `--prs` anfordern)');
  } else if (roh.prs === null) {
    z.push('🔀 offene PRs: — (nicht abfragbar)');
  } else if (roh.prs.length === 0) {
    z.push('🔀 offene PRs: — (keine)');
  } else {
    z.push('🔀 offene PRs:');
    for (const p of roh.prs) z.push(`   #${p.number} ${bezug(p.headRefName, ids)} — ${p.titel}`);
  }

  // Frische-Warnung: die Schlussfolgerung aus allem darüber, deshalb danach —
  // und VOR der Ausfall-Zeile, die den Block abschliesst.
  const stale = staleWip(roh, ids);
  for (const id of stale) {
    z.push(
      `⚠️  Als «in Arbeit» markiert, aber ohne Bau-Spur (kein Branch/Bauplatz): ${id}` +
        ` — freigeben (plan:set ${id} status=ready|done|parked) oder Bau wieder aufnehmen.`,
    );
  }
  if (stale.length && roh.prs === null) {
    // Ehrliche Reichweite (§8): ein offener PR wäre eine Bau-Spur, gesehen hat
    // ihn hier aber niemand. Ohne diesen Zusatz läse sich die Warnung sicherer,
    // als sie ist. Nur bei mindestens einer Warnung — sonst wäre es Rauschen.
    z.push(roh.prsGewuenscht ? '   (offene PRs nicht geprüft — Abfrage ausgefallen)' : '   (offene PRs nicht geprüft — netzfrei)');
  }

  if (roh.ausfaelle.length) {
    z.push(`⚠️  Lage unvollständig — nicht abfragbar: ${roh.ausfaelle.join(TRENNER)} (kein Fehler des Plans)`);
  }
  return z;
}

/**
 * Ein Aufruf für die CLI: erheben und formatieren.
 *
 * Bis 20.9.2026 hängte diese Funktion eine Messreihen-Zeile an (Schritt
 * QS-SELBSTOPT, `selbstoptZeile`/`vorschlagsZeile`/`leseZeitreihe`) — entfallen
 * mit `retro:17`/`selbstopt:erheben` (Entscheid David, Rückbau QS-EFFIZIENZ:
 * die Zeitreihe wurde seit 4.9.2026 nicht mehr erhoben, `retro:17` nie
 * umgesetzt; Nachfolge-Messung `npm run tor:bewaehrung`). `lageBlock` ist damit
 * wieder deckungsgleich mit `lageZeilen`.
 */
export function lageBlock(
  einheiten: Einheit[],
  inArbeit: string[],
  opt: { prs: boolean; laufe?: Laufe },
): string[] {
  const roh = sammleLage(wipFlaechen(einheiten, inArbeit), opt);
  return lageZeilen(roh, einheiten.map((e) => e.id));
}
