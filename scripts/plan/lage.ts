// scripts/plan/lage.ts — Lage-Block für `plan:next` (Bauplan-Review 4.8.2026,
// Ziff. 4a in fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md): jede Session sieht, WAS im
// Bau ist — ohne SessionStart-Hook (zerstörte den Prompt-Cache; QS-TOK/T19).
//
// Bauregeln: (1) Nie crashen, immer degradieren (§8): Ausfälle = EINE Hinweiszeile.
// (2) Netzfrei per Default, `gh` nur mit `--prs`. (3) Nichts Bestehendes
// verschieben. Seit 5.8.2026 (`QS-PLAN-WIP-FRISCHE`) auch «stimmt das noch»
// (`staleWip()`); nicht abfragbare git-Lage erzeugt dort KEINE Warnung.
//
// Eigener Runner statt `sh()` aus bildDaten.ts: hartes Timeout (`gh` ohne Netz
// hängt sonst am Pflicht-Einstieg) und `plan:next` bleibt importfrei gegenüber dem
// `startseiteConfig`-Graphen von bildDaten. Schritt-Daten: parse.ts/aufloesen.ts.

import { execFileSync } from 'node:child_process';
import { type Einheit } from './parse';
import { parseWorktreeFakten, platzName, schmutz, type WorktreeRoh } from './gitFlaechen';
import { idTrifft } from './specBindung';

/** Ein `wip`-Schritt mit dem von ihm belegten Baufeld; `feld` `null` = gilt konservativ als GESAMTE Fläche. */
export interface WipFlaeche {
  id: string;
  feld: string | null;
}

/** Ein Bau-Platz aus `git worktree list --porcelain`: `name` = letztes Pfadsegment, `branch` `null` = detached, `haupt` = Haupt-Repo (kein Bau-Platz). */
export interface BauPlatz {
  name: string;
  branch: string | null;
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
  /**
   * Branches mit nur gelandeter Arbeit. Fehlt der Branch, gilt er als echte
   * Bau-Spur — «nicht gemessen» ist nie «gelandet» (fail-closed, W2·27-BUND-FERTIG).
   */
  gelandet?: ReadonlySet<string>;
}

/**
 * Kommando-Ausführung; wirft bei Fehler, Timeout oder fehlendem Programm. `cwd`
 * optional (seit 21.9.2026): `git status` läuft je Worktree in DESSEN Verzeichnis.
 */
export type Laufe = (cmd: string, args: string[], cwd?: string) => string;

const TIMEOUT_MS = 5000;

export const laufeEcht: Laufe = (cmd, args, cwd) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: TIMEOUT_MS, cwd });

/** Wie `laufe`, aber `null` statt Wurf — geteilt mit gitFlaechenSammeln.ts (§5). */
export function stillLaufen(laufe: Laufe, cmd: string, args: string[], cwd?: string): string | null {
  try {
    return laufe(cmd, args, cwd);
  } catch {
    return null;
  }
}

/**
 * Schritt-ID → Namensbestandteil für Branches und Worktrees (Namenskonvention
 * seit 5.8.2026: Dispatch-§0 Ziff. 5, Skill `auftrag` Ziff. 2). Deckungsgleich mit
 * der Slug-Bildung der wip-Verstoss-Sonde in bildSeiten.ts.
 */
export function slug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Ordnet einem Branch-/Worktree-/PR-Namen einen Schritt zu — `null` = «ohne
 * Schritt-Bezug» (Signal für unangemeldeten Bau). Der LÄNGSTE passende Slug
 * gewinnt, bei Gleichstand der lexikografisch kleinere (sonst entschiede die
 * ROADMAP-Reihenfolge, ob `feat/qs-code-turso` als `QS-CODE` oder `QS-CODE-TURSO` gilt).
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

/** `git worktree list --porcelain` → Bau-Plätze; seit 21.9.2026 Sicht auf `parseWorktreeFakten` (§5). */
export function parseWorktrees(porcelain: string): BauPlatz[] {
  return parseWorktreeFakten(porcelain).map(bauPlatz);
}

const bauPlatz = (w: WorktreeRoh): BauPlatz => ({ name: platzName(w.pfad), branch: w.branch, haupt: w.haupt });

/** wip-Schritte des Resolvers mit ihren Flächen anreichern. */
export function wipFlaechen(einheiten: Einheit[], inArbeit: string[]): WipFlaeche[] {
  return inArbeit.map((id) => ({
    id,
    feld: einheiten.find((e) => e.id === id)?.etikett.feld ?? null,
  }));
}

/**
 * Branches der wip-Schritte mit NUR gelandeter Arbeit (W2·27-BUND-FERTIG; Vorfall
 * 25.–30.9.2026: `QS-KORPUS` stand fünf Tage auf wip, weil `docs/qs-korpus-posten-
 * rest-2` als Spur zählte, obwohl sein einziger Commit per Squash gelandet war).
 * `git cherry origin/main` (Fallback `main`) ohne `+`-Zeile; ausgecheckt nur bei
 * sauberem Worktree (`schmutz()`, §5). Vorfilter mit der wip-Liste = Obermenge der
 * Zuordnung. Fail-closed: jede Messlücke lässt den Branch aus der Karte = Spur.
 */
function messeGelandet(laufe: Laufe, wipIds: string[], raw: WorktreeRoh[], branches: string[]): Set<string> {
  const karte = new Set<string>();
  const pfadVon = new Map<string, string>();
  const kand = new Set<string>();
  for (const w of raw) {
    if (!w.branch) continue;
    pfadVon.set(w.branch, w.pfad);
    if (schrittFuerNamen(w.haupt ? w.branch : `${platzName(w.pfad)} [${w.branch}]`, wipIds)) kand.add(w.branch);
  }
  for (const b of branches) if (schrittFuerNamen(b, wipIds)) kand.add(b);
  kand.delete('main');
  if (kand.size === 0) return karte;
  const basis = stillLaufen(laufe, 'git', ['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/main']) === null
    ? 'refs/heads/main'
    : 'refs/remotes/origin/main';
  for (const b of kand) {
    const ref = `refs/heads/${b}`;
    const cherry = stillLaufen(laufe, 'git', ['cherry', basis, ref]);
    if (cherry === null || cherry.split('\n').some((z) => z.startsWith('+'))) continue;
    const pfad = pfadVon.get(b);
    if (pfad !== undefined) {
      const st = stillLaufen(laufe, 'git', ['status', '--porcelain', '--ignored'], pfad);
      if (st === null || schmutz(st.split('\n')) !== null) continue;
    }
    karte.add(b);
  }
  return karte;
}

/**
 * Erhebt die Lage. Kein Wurf nach aussen — Ausfälle landen in `ausfaelle`.
 */
export function sammleLage(
  wip: WipFlaeche[],
  opt: { prs: boolean; laufe?: Laufe } = { prs: false },
): LageRoh {
  const laufe = opt.laufe ?? laufeEcht;
  const ausfaelle: string[] = [];

  let roh: WorktreeRoh[] | null = null;
  try {
    roh = parseWorktreeFakten(laufe('git', ['worktree', 'list', '--porcelain']));
  } catch {
    ausfaelle.push('git worktree list');
  }
  const worktrees = roh?.map(bauPlatz) ?? null;

  let branches: string[] | null = null;
  try {
    branches = laufe('git', ['branch', '--format=%(refname:short)']).split('\n').map((b) => b.trim()).filter(Boolean);
  } catch {
    ausfaelle.push('git branch');
  }

  let prs: PrKurz[] | null = null;
  if (opt.prs) {
    try {
      const pr = laufe('gh', ['pr', 'list', '--state', 'open', '--json', 'number,headRefName,title', '--limit', '30']);
      prs = (JSON.parse(pr) as { number: number; headRefName: string; title: string }[])
        .map((p) => ({ number: p.number, headRefName: p.headRefName, titel: p.title }));
    } catch {
      prs = null;
      ausfaelle.push('gh pr list');
    }
  }

  const gelandet = roh && branches ? messeGelandet(laufe, wip.map((w) => w.id), roh, branches) : undefined;
  return {
    wip, worktrees, branches, prs, prsGewuenscht: opt.prs, ausfaelle,
    ...(gelandet?.size ? { gelandet } : {}),
  };
}

const TRENNER = ' · ';

/**
 * **Frische-Prüfung «stale wip»** (`QS-PLAN-WIP-FRISCHE`): die `wip`-Schritte
 * OHNE Bau-Spur, sortiert. Anlass (5.8.2026, zweiter Fall nach dem 10-wip-Vorfall
 * ~20.7.2026): eine Session landete `QS-TOK`/`QS-TOK-AUFRAEUMEN` und endete, ohne
 * die wip-Marke freizugeben; Prosa half zweimal nicht (Skill `lehren` Regel 5).
 *
 * **Bau-Spur** = ein Name, den `schrittFuerNamen` auf DIESEN Schritt abbildet:
 * Bau-Platz (Name UND Branch), lokaler Branch, oder — nur mit `--prs` — ein offener
 * PR über `headRefName` bzw. Titel (Wortgrenze `idTrifft`, §5: «QS-TOK» in
 * «QS-TOK-AUFRAEUMEN» ist keine Spur).
 *
 * **Nur gelandete Arbeit ist keine Spur** (30.9.2026): ein Branch aus
 * `roh.gelandet` belegt den Schritt nicht und wird im Befund genannt. Ohne Messung
 * gilt der Namenstreffer wie bisher; ein detached Bau-Platz bleibt immer Spur.
 *
 * **«Nicht prüfbar» ist nicht «stale»:** fällt `git worktree list` ODER `git
 * branch` aus, wird NICHT gewarnt (Freigabe-Aufforderung aus fehlenden Daten).
 */
export function staleWip(roh: LageRoh, ids: string[]): string[] {
  return staleWipBefunde(roh, ids).map((b) => b.id);
}

/** Stale-wip-Schritt mit Grund: `gelandet` leer = gar keine Spur; sonst nur diese Branches. */
export interface StaleBefund {
  id: string;
  gelandet: string[];
}

export function staleWipBefunde(roh: LageRoh, ids: string[]): StaleBefund[] {
  if (roh.worktrees === null || roh.branches === null) return [];
  const spuren = new Set<string>();
  const nurGelandet = new Map<string, Set<string>>();
  const spur = (id: string | null, branch: string | null) => {
    if (!id) return;
    if (branch !== null && roh.gelandet?.has(branch)) nurGelandet.set(id, (nurGelandet.get(id) ?? new Set<string>()).add(branch));
    else spuren.add(id);
  };
  for (const w of roh.worktrees) {
    if (!w.haupt) spur(schrittFuerNamen(`${w.name}${w.branch ? ` [${w.branch}]` : ''}`, ids), w.branch);
  }
  for (const b of roh.branches) spur(schrittFuerNamen(b, ids), b);
  for (const p of roh.prs ?? []) {
    const t = schrittFuerNamen(p.headRefName, ids);
    if (t) spuren.add(t);
    for (const id of ids) if (idTrifft(p.titel, id)) spuren.add(id);
  }
  // `sort()` (Code-Einheiten) statt `localeCompare`: stabil ohne Gebietsschema (§2).
  return roh.wip
    .map((w) => w.id)
    .filter((id) => !spuren.has(id))
    .sort()
    .map((id) => ({ id, gelandet: [...(nurGelandet.get(id) ?? [])].sort() }));
}

function bezug(name: string, ids: string[]): string {
  const id = schrittFuerNamen(name, ids);
  return id ? `${name} → ${id}` : `${name} → ohne Schritt-Bezug`;
}

/** Formatiert den Lage-Block. Reine Funktion über `LageRoh` — im Test ohne git/gh prüfbar. */
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

  // Worktrees: Haupt-Repo ist kein Bau-Platz; Zuordnung über Platzname UND Branch («agent-<hash>» trägt den Slug im Branch).
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

  // Frische-Warnung: Schlussfolgerung aus allem darüber, VOR der Ausfall-Zeile.
  const stale = staleWipBefunde(roh, ids);
  for (const b of stale) {
    const grund = b.gelandet.length ? `Spur nur gelandete Arbeit: ${b.gelandet.join(', ')}` : 'kein Branch/Bauplatz';
    const weg = b.gelandet.length ? 'Branch abräumen (npm run aufraeumen:git), dann freigeben' : 'freigeben';
    z.push(`⚠️  Als «in Arbeit» markiert, aber ohne Bau-Spur (${grund}): ${b.id} — ${weg} (plan:set ${b.id} status=ready|done|parked) oder Bau wieder aufnehmen.`);
  }
  if (stale.length && roh.prs === null) {
    // Ehrliche Reichweite (§8): ein offener PR wäre eine Spur, gesehen hat ihn niemand.
    z.push(roh.prsGewuenscht ? '   (offene PRs nicht geprüft — Abfrage ausgefallen)' : '   (offene PRs nicht geprüft — netzfrei)');
  }

  if (roh.ausfaelle.length) {
    z.push(`⚠️  Lage unvollständig — nicht abfragbar: ${roh.ausfaelle.join(TRENNER)} (kein Fehler des Plans)`);
  }
  return z;
}

/** Ein Aufruf für die CLI: erheben und formatieren (Messreihen-Zeile QS-SELBSTOPT entfiel 20.9.2026). */
export function lageBlock(
  einheiten: Einheit[],
  inArbeit: string[],
  opt: { prs: boolean; laufe?: Laufe },
): string[] {
  const roh = sammleLage(wipFlaechen(einheiten, inArbeit), opt);
  return lageZeilen(roh, einheiten.map((e) => e.id));
}
