// scripts/plan/gitFlaechenSammeln.ts — die unreine Hälfte von gitFlaechen.ts:
// git/gh befragen und (nur auf Geheiss) abräumen.
//
// Warum getrennt: der Kern muss ohne Repo und ohne Netz prüfbar sein (§2/§3 —
// Logik ≠ Beschaffung). Hier steht ausschliesslich Beschaffung; jede
// Entscheidung fällt drüben in `klassiere`. Der Kommando-Runner ist
// injizierbar (`Laufe` aus lage.ts, seit 21.9.2026 mit `cwd`), damit der
// Integrationstest gegen ein temporäres Repo fahren kann.
//
// Fail-closed an jeder Ausfallstelle: was nicht sicher gemessen werden konnte,
// wird als «nicht abräumbar» gemeldet, nie als «weg damit» (s. Kopf von
// gitFlaechen.ts).

import { realpathSync } from 'node:fs';
import { laufeEcht, type Laufe } from './lage';
import {
  klassiere,
  parseWorktreeFakten,
  platzName,
  type BranchFakt,
  type Befunde,
  type Fakten,
  type PrFakt,
  type WorktreeFakt,
} from './gitFlaechen';

/** Ein PR, wie `gh pr list --json number,headRefName,headRefOid,state` ihn liefert. */
export interface PrRoh {
  number: number;
  headRefName: string;
  headRefOid: string;
  state: string;
  /** Zielzweig — nur `main` ist eine Landung (Auflage 3, Bug-Check 21.9.2026). */
  baseRefName: string;
}

export interface SammelOpt {
  laufe?: Laufe;
  /** Verzeichnis, aus dem gemessen wird (Default: `process.cwd()`). */
  cwd?: string;
  /** `gh` befragen? `false` ⇒ nur lokale Signale, alles Nicht-Leere bleibt stehen. */
  mitGh?: boolean;
  /**
   * Commits vor `main` je Branch zählen (ein `git rev-list` pro Branch)?
   *
   * Default `true`. `plan:next` setzt `false`: die Zahl steht dort in keiner
   * Zeile, und bei zwanzig Alt-Branches wären es zwanzig Prozessstarts am
   * Pflicht-Einstieg. Die ENTSCHEIDUNG hängt nicht daran — «leer ja/nein»
   * liefert ein einziges `git branch --merged`.
   */
  zaehlen?: boolean;
  /**
   * Worktrees tief prüfen — `git status --porcelain --ignored` je Platz plus
   * EIN globales `lsof` für die Belegung?
   *
   * Default `true`. `plan:next` setzt `false` — gemessen 21.9.2026 im
   * Haupt-Repo: mit Tiefprüfung 137 ms, ohne 37–53 ms (4 Worktrees), bei
   * einer Gesamtlaufzeit von ~540 ms. Ohne Tiefprüfung gelten Belegung und
   * Sauberkeit als «nicht gemessen» ⇒ kein Worktree ist abräumbar
   * (fail-closed). In der Zeile fehlt dann höchstens ein abräumbarer Platz;
   * es wird nie einer zu viel gemeldet.
   */
  tiefPruefen?: boolean;
  /** Test-Naht: PR-Liste direkt einspeisen statt `gh` zu rufen (dann gilt gh als verfügbar). */
  prs?: PrRoh[];
  /**
   * Test-Naht: cwd-Pfade laufender Prozesse direkt einspeisen statt `lsof` zu
   * rufen. `[]` heisst ausdrücklich «nichts belegt». Nötig, weil `lsof` nicht
   * auf jedem Läufer installiert ist — ohne diese Naht hinge der
   * Integrationstest an einem Programm, das nichts mit der Regel zu tun hat.
   */
  belegtePfade?: string[];
}

/** Obergrenze der PR-Abfrage. Ein älterer gemergter PR fällt fail-closed in «offen». */
const PR_LIMIT = '200';

function stillLaufen(laufe: Laufe, cmd: string, args: string[], cwd?: string): string | null {
  try {
    return laufe(cmd, args, cwd);
  } catch {
    return null;
  }
}

/**
 * Wie `stillLaufen`, aber ein Programm, das mit Code ≠ 0 endet UND etwas
 * ausgegeben hat, gilt als geglückt.
 *
 * Nötig für `lsof`: es endet regelmässig mit Status 1, obwohl es Treffer
 * gedruckt hat (gemessen 21.9.2026: 4 Treffer, Exit 1). Würde man den
 * Exit-Code werten, hiesse jeder belegte Worktree «nicht prüfbar» — und
 * jeder unbelegte auch. `null` bleibt dem echten Ausfall vorbehalten:
 * Programm fehlt, Timeout, kein `stdout` am Fehler.
 */
function laufenDuldsam(laufe: Laufe, cmd: string, args: string[], cwd?: string): string | null {
  try {
    return laufe(cmd, args, cwd);
  } catch (e) {
    const aus = (e as { stdout?: unknown }).stdout;
    return typeof aus === 'string' ? aus : null;
  }
}

/**
 * EIN globales `lsof` statt eines `+D`-Laufs je Worktree.
 *
 * Messung 21.9.2026 (4 Worktrees, macOS): `lsof -a -d cwd +D <pfad>` je Platz
 * = 257/274/1680/2143 ms, Summe 4354 ms — `+D` läuft den ganzen Baum ab und
 * reisst an `node_modules` über eine Sekunde. `lsof -a -d cwd -Fn` einmal
 * global = 76 ms (3 von 3 Läufen), 406 cwd-Pfade, gleiche Treffer. Darum die
 * globale Variante mit Filterung im Code.
 *
 * `null` = lsof nicht verfügbar ⇒ jede Belegung gilt als unbekannt.
 */
export function belegtePfade(laufe: Laufe, cwd?: string): string[] | null {
  const roh = laufenDuldsam(laufe, 'lsof', ['-a', '-d', 'cwd', '-Fn'], cwd);
  if (roh === null) return null;
  // `-Fn` druckt Datensätze als `p<pid>` / `f<fd>` / `n<pfad>` je Zeile.
  return roh.split('\n').filter((z) => z.startsWith('n')).map((z) => z.slice(1)).filter(Boolean);
}

function zahl(roh: string | null): number | null {
  if (roh === null) return null;
  const n = Number.parseInt(roh.trim(), 10);
  return Number.isNaN(n) ? null : n;
}

function echterPfad(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
}

/**
 * Erhebt alle Fakten. Wirft nicht — jeder Ausfall wird zu einem
 * fail-closed-Fakt (`sauber: null`, `ghVerfuegbar: false`, `nachPrHead: null`).
 */
export function sammleFakten(opt: SammelOpt = {}): Fakten {
  const laufe = opt.laufe ?? laufeEcht;
  const cwd = opt.cwd ?? process.cwd();
  const leer: Fakten = { ghVerfuegbar: false, aktuellerBranch: null, branches: [], worktrees: [] };

  const porcelain = stillLaufen(laufe, 'git', ['worktree', 'list', '--porcelain'], cwd);
  if (porcelain === null) return leer;
  const roh = parseWorktreeFakten(porcelain);

  // Ein `rev-parse` für beides — jeder Prozessstart kostet am Pflicht-Einstieg.
  const wo = (stillLaufen(laufe, 'git', ['rev-parse', '--show-toplevel', '--abbrev-ref', 'HEAD'], cwd) ?? '')
    .split('\n')
    .map((s) => s.trim());
  const hier = echterPfad(wo[0] || cwd);
  const aktuellerBranch = wo[1] && wo[1] !== 'HEAD' ? wo[1] : null;

  // --- Branches ------------------------------------------------------------
  // Ein Aufruf für Name, Spitze, Upstream und Datum; `git branch --merged`
  // beantwortet «0 Commits vor main» für alle Branches auf einmal.
  const refs = stillLaufen(laufe, 'git', [
    'for-each-ref',
    'refs/heads',
    '--format=%(refname:short)%09%(objectname)%09%(upstream:short)%09%(upstream:track)%09%(committerdate:unix)',
  ], cwd);
  if (refs === null) return { ...leer, aktuellerBranch };
  const zeilen = refs.split('\n').map((z) => z.trim()).filter(Boolean);

  const mergedRoh = stillLaufen(laufe, 'git', ['branch', '--merged', 'refs/heads/main', '--format=%(refname:short)'], cwd);
  // Kein `main`, kein git-Zugriff ⇒ leere Menge ⇒ kein Branch gilt als «leer».
  const merged = new Set((mergedRoh ?? '').split('\n').map((z) => z.trim()).filter(Boolean));

  const worktreeVonBranch = new Map<string, string>();
  for (const w of roh) if (w.branch) worktreeVonBranch.set(w.branch, w.pfad);

  // --- PRs -----------------------------------------------------------------
  let prs: PrRoh[] | null = null;
  if (opt.prs) {
    prs = opt.prs;
  } else if (opt.mitGh) {
    const ghRoh = stillLaufen(laufe, 'gh', [
      'pr', 'list', '--state', 'all', '--limit', PR_LIMIT,
      '--json', 'number,headRefName,headRefOid,state,baseRefName',
    ], cwd);
    if (ghRoh !== null) {
      try {
        prs = JSON.parse(ghRoh) as PrRoh[];
      } catch {
        prs = null;
      }
    }
  }
  const ghVerfuegbar = prs !== null;

  /**
   * Bevorzugt den nach `main` gemergten PR — ein Branch kann mehrere PRs
   * getragen haben, und nur der main-Merge ist eine Landung (Auflage 3).
   */
  const prFuer = (name: string): PrFakt | null => {
    const treffer = (prs ?? []).filter((p) => p.headRefName === name);
    if (treffer.length === 0) return null;
    const p = treffer.find((x) => x.state === 'MERGED' && x.baseRefName === 'main') ?? treffer[0];
    const zustand = p.state === 'MERGED' ? 'MERGED' : p.state === 'OPEN' ? 'OPEN' : 'CLOSED';
    return { number: p.number, zustand, headRefOid: p.headRefOid, basis: p.baseRefName };
  };

  const zaehlen = opt.zaehlen ?? true;
  const branches: BranchFakt[] = zeilen.map((z) => {
    const [name, spitze, upstream, track, datum] = z.split('\t');
    const istLeer = merged.has(name);
    const pr = prFuer(name);
    return {
      name,
      spitze: spitze ?? '',
      leer: istLeer,
      // Zählen lohnt nur, wo es etwas zu zählen gibt — und nur im vollen Lauf.
      vorMain: istLeer ? 0 : zaehlen ? zahl(stillLaufen(laufe, 'git', ['rev-list', '--count', `refs/heads/main..${name}`], cwd)) : null,
      letzterCommitUnix: zahl(datum ?? null),
      remote: (upstream ?? '') !== '' && !(track ?? '').includes('gone'),
      imWorktree: worktreeVonBranch.get(name) ?? null,
      nachPrHead:
        pr && pr.zustand === 'MERGED' && pr.basis === 'main'
          ? zahl(stillLaufen(laufe, 'git', ['rev-list', '--count', `${pr.headRefOid}..${name}`], cwd))
          : null,
      pr,
    };
  });

  // --- Worktrees -----------------------------------------------------------
  const mergedOids = new Set((prs ?? []).filter((p) => p.state === 'MERGED').map((p) => p.headRefOid));
  const tiefPruefen = opt.tiefPruefen ?? true;
  // EIN lsof für alle Plätze (s. `belegtePfade`). Ohne Tiefprüfung gar keins.
  const belegtRoh = opt.belegtePfade ?? (tiefPruefen ? belegtePfade(laufe, cwd) : null);
  const istBelegt = (pfad: string): boolean | null => {
    if (belegtRoh === null) return null;
    const echt = echterPfad(pfad);
    return belegtRoh.some((p) => p === pfad || p.startsWith(`${pfad}/`) || p === echt || p.startsWith(`${echt}/`));
  };

  const worktrees: WorktreeFakt[] = roh.map((w) => {
    // `null` heisst «nicht gemessen ODER nicht messbar» — beides ist
    // fail-closed dasselbe: der Platz bleibt stehen. Der Haupt-Checkout ist
    // ohnehin nie abräumbar, deshalb dort keine Messung.
    const status = w.haupt || !tiefPruefen
      ? null
      : stillLaufen(laufe, 'git', ['status', '--porcelain', '--ignored'], w.pfad);
    return {
      pfad: w.pfad,
      name: platzName(w.pfad),
      haupt: w.haupt,
      aktuell: echterPfad(w.pfad) === hier,
      gelockt: w.gelockt,
      belegt: w.haupt ? true : istBelegt(w.pfad),
      statusZeilen: w.haupt ? [] : status === null ? null : status.split('\n'),
      branch: w.branch,
      head: w.head,
      headVonMain:
        w.branch === null &&
        w.head !== '' &&
        stillLaufen(laufe, 'git', ['merge-base', '--is-ancestor', w.head, 'refs/heads/main'], cwd) !== null,
      headIstPrHead: w.branch === null && mergedOids.has(w.head),
    };
  });

  return { ghVerfuegbar, aktuellerBranch, branches, worktrees };
}

/** Erheben und klassieren in einem Aufruf. */
export function erhebe(opt: SammelOpt = {}): Befunde {
  return klassiere(sammleFakten(opt));
}

/**
 * Räumt ab — und NUR, was `klassiere` als abräumbar ausgewiesen hat.
 *
 * Reihenfolge: erst Worktrees (`git worktree remove`, nie `--force`), dann
 * Branches, zuletzt `git worktree prune`. Andersherum verweigerte git das
 * Löschen jedes Branches, der noch in einem Worktree ausgecheckt ist.
 *
 * Je Objekt wird der alte SHA gedruckt: damit ist jede Löschung über
 * `git branch <name> <sha>` bzw. `git checkout <sha>` wiederherstellbar,
 * solange das Reflog reicht.
 */
export function raeumeAb(bef: Befunde, opt: SammelOpt = {}): { zeilen: string[]; fehler: number } {
  const laufe = opt.laufe ?? laufeEcht;
  const cwd = opt.cwd ?? process.cwd();
  const zeilen: string[] = [];
  let fehler = 0;

  for (const w of bef.worktrees.filter((x) => x.abraeumbar)) {
    if (stillLaufen(laufe, 'git', ['worktree', 'remove', w.pfad], cwd) === null) {
      zeilen.push(`   ❌ Worktree ${w.name} — git worktree remove scheiterte, bleibt stehen`);
      fehler += 1;
    } else {
      zeilen.push(`   ✅ Worktree ${w.name} entfernt (HEAD war ${w.head})`);
    }
  }
  for (const b of bef.branches.filter((x) => x.abraeumbar)) {
    if (stillLaufen(laufe, 'git', ['branch', b.flagge ?? '-d', b.name], cwd) === null) {
      zeilen.push(`   ❌ Branch ${b.name} — git branch ${b.flagge} scheiterte, bleibt stehen`);
      fehler += 1;
    } else {
      zeilen.push(`   ✅ Branch ${b.name} gelöscht — zurück mit: git branch ${b.name} ${b.spitze}`);
    }
  }
  stillLaufen(laufe, 'git', ['worktree', 'prune'], cwd);
  if (zeilen.length === 0) zeilen.push('   — nichts abzuräumen');
  return { zeilen, fehler };
}
