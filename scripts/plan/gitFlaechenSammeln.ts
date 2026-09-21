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
   * `git status --porcelain` je Worktree fahren (ein Prozessstart pro Platz)?
   *
   * Default `true`. `plan:next` setzt `false` — gemessen 21.9.2026 im
   * Haupt-Repo: mit Status 137 ms, ohne 66 ms (4 Worktrees), bei einer
   * Gesamtlaufzeit von ~540 ms. Ohne Status gilt jeder Worktree als
   * «nicht sauber prüfbar» und damit als nicht abräumbar (fail-closed) —
   * in der Zeile fehlt dann höchstens ein abräumbarer Platz, es wird nie
   * einer zu viel gemeldet.
   */
  statusPruefen?: boolean;
  /** Test-Naht: PR-Liste direkt einspeisen statt `gh` zu rufen (dann gilt gh als verfügbar). */
  prs?: PrRoh[];
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
      '--json', 'number,headRefName,headRefOid,state',
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

  /** Bevorzugt den gemergten PR — ein Branch kann mehrere PRs getragen haben. */
  const prFuer = (name: string): PrFakt | null => {
    const treffer = (prs ?? []).filter((p) => p.headRefName === name);
    if (treffer.length === 0) return null;
    const p = treffer.find((x) => x.state === 'MERGED') ?? treffer[0];
    const zustand = p.state === 'MERGED' ? 'MERGED' : p.state === 'OPEN' ? 'OPEN' : 'CLOSED';
    return { number: p.number, zustand, headRefOid: p.headRefOid };
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
        pr && pr.zustand === 'MERGED'
          ? zahl(stillLaufen(laufe, 'git', ['rev-list', '--count', `${pr.headRefOid}..${name}`], cwd))
          : null,
      pr,
    };
  });

  // --- Worktrees -----------------------------------------------------------
  const mergedOids = new Set((prs ?? []).filter((p) => p.state === 'MERGED').map((p) => p.headRefOid));
  const statusPruefen = opt.statusPruefen ?? true;
  const worktrees: WorktreeFakt[] = roh.map((w) => {
    // `null` heisst «nicht gemessen ODER nicht messbar» — beides ist
    // fail-closed dasselbe: der Platz bleibt stehen. Der Haupt-Checkout ist
    // ohnehin nie abräumbar, deshalb dort keine Messung.
    const status = w.haupt ? '' : statusPruefen ? stillLaufen(laufe, 'git', ['status', '--porcelain'], w.pfad) : null;
    return {
      pfad: w.pfad,
      name: platzName(w.pfad),
      haupt: w.haupt,
      aktuell: echterPfad(w.pfad) === hier,
      gelockt: w.gelockt,
      sauber: w.haupt ? true : status === null ? null : status.trim() === '',
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
