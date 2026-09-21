// scripts/plan/gitFlaechen.ts — reiner Kern: welche Git-Fläche darf weg?
//
// ANLASS (gemessen 21.9.2026, Haupt-Checkout): 5 Worktrees, 20 lokale Branches.
// 18 Branches waren leere Hüllen — 7 mit gelandetem PR (GitHub löscht beim
// Squash-Merge nur den REMOTE-Branch; lokal verweigert `git branch -d`, weil
// die Squash-Spitze kein Vorfahre von main ist), 5 `claude/<zufallsname>` (legt
// die Desktop-App je Session an), 6 `worktree-agent-<hash>` (legt das
// Agenten-Werkzeug an). 2 Branches trugen ECHTE ungelandete Arbeit ohne PR,
// einer davon mit 9 uncommitteten Dateien im Worktree — und fielen niemandem
// auf. Die bestehende Regel war Prosa (Skill `landung`, «Session-Ende»,
// Lehre 8.9.2026) und erfasst nur die EIGENEN Flächen einer Session; App- und
// Agenten-Branches sowie Sessions, die vor der Landung enden, fielen durch.
// Zweiter Vorfall trotz Gegenmittel ⇒ Form eskalieren Prosa → Maschine
// (Skill `lehren`, Ablage-Regel 5).
//
// BEWUSST KEIN TOR (§17-Gegengewicht, §12): ein rotes Tor wegen eines fremden
// Worktrees würde Parallel-Sessions blockieren. Gebaut ist stattdessen
// Anzeige (`plan:next`) + Befehl (`npm run aufraeumen:git`).
//
// Drei Bauregeln dieser Datei:
//
//  * **Rein und deterministisch (§2).** Kein git, kein gh, kein `Date.now()`.
//    Rohe Fakten rein, Klassierung raus. Die Uhrzeit für die Alters-Anzeige
//    wird der Formatierung von aussen gereicht.
//  * **Fail-closed.** Jede Unsicherheit — gh fehlt, PR-Head lokal unbekannt,
//    `git status` nicht abfragbar — endet in «nicht abräumbar». Ein
//    übersehener Alt-Branch kostet Aufräumzeit, ein gelöschter Branch mit
//    ungelandeter Arbeit kostet die Arbeit.
//  * **Reihenfolge statt Ringschluss.** Die KLASSE eines Branches hängt nie
//    vom Worktree ab; die Abräumbarkeit eines Worktrees hängt von der Klasse
//    seines Branches ab; die Abräumbarkeit eines Branches hängt davon, ob sein
//    Worktree abräumbar ist. In dieser Reihenfolge — sonst beisst sich die
//    Regel in den Schwanz.

/** Klasse eines lokalen Branches. Nur `leer` und `gelandet` dürfen weg. */
export type BranchKlasse = 'leer' | 'gelandet' | 'offen';

/** Der zu einem Branch gefundene PR — roh, wie `gh pr list` ihn liefert. */
export interface PrFakt {
  number: number;
  zustand: 'MERGED' | 'OPEN' | 'CLOSED';
  headRefOid: string;
  /**
   * Zielzweig des PR. Nur `main` ist eine Landung (§9: Merge nach main IST
   * der Deploy) — ein PR, der in einen Feature-Zweig gemergt wurde, beweist
   * nichts über den Auslieferungsstand (Bug-Check 21.9.2026, Auflage 3).
   */
  basis: string;
}

/** Rohe Fakten zu einem lokalen Branch. Alles Gemessene, nichts Gedeutetes. */
export interface BranchFakt {
  name: string;
  /** SHA der Branch-Spitze — die Wiederherstell-Adresse nach dem Löschen. */
  spitze: string;
  /** 0 Commits vor `main`? Entspricht `git branch --merged refs/heads/main`. */
  leer: boolean;
  /** Zahl der Commits vor `main`; `null` = nicht gezählt (nur Anzeige). */
  vorMain: number | null;
  /** Unix-Sekunden des letzten Commits; `null` = nicht erhoben (nur Anzeige). */
  letzterCommitUnix: number | null;
  /** Gibt es den Upstream-Branch auf dem Remote noch? */
  remote: boolean;
  /** Pfad des Worktrees, in dem der Branch ausgecheckt ist; `null` = keiner. */
  imWorktree: string | null;
  /**
   * Commits auf dem Branch, die vom PR-Head aus NICHT erreichbar sind
   * (`git rev-list --count <headRefOid>..<branch>`).
   *
   * `0` heisst: Spitze == PR-Head oder Vorfahre davon — die gelandete Arbeit
   * ist vollständig. `> 0` heisst: nach dem PR wurde weitergebaut, der Branch
   * bleibt stehen. `null` heisst «nicht bestimmbar» und zählt wie `> 0`.
   */
  nachPrHead: number | null;
  pr: PrFakt | null;
}

/** Rohe Fakten zu einem Worktree aus `git worktree list --porcelain` + Sonden. */
export interface WorktreeFakt {
  pfad: string;
  /** Letztes Pfadsegment — so heisst der Platz im Alltag. */
  name: string;
  /** Erster Block der Porcelain-Ausgabe = das Haupt-Repo. */
  haupt: boolean;
  /** Der Worktree, aus dem der Befehl gerade läuft. */
  aktuell: boolean;
  gelockt: boolean;
  /**
   * Läuft im Worktree ein Prozess (cwd eines lebenden Prozesses)?
   *
   * `null` = nicht gemessen oder nicht messbar ⇒ fail-closed nicht abräumbar.
   * Anlass (Bug-Check 21.9.2026, Blocker 1): der Trockenlauf hielt
   * `.claude/worktrees/angry-bartik-e40d69` für abräumbar, während dort vier
   * Prozesse einer LEBENDEN Desktop-App-Session liefen (`claude`, `zsh`,
   * `python3`, `disclaime`) — sauber, ungelockt, 0 Commits. Kein Zeitstempel-
   * Kriterium: eine offene, gerade untätige Session altert sonst aus dem Schutz.
   */
  belegt: boolean | null;
  /**
   * Rohzeilen aus `git status --porcelain --ignored`; `null` = nicht gemessen
   * oder nicht abfragbar. Was davon «schmutzig» heisst, entscheidet `schmutz()`
   * unten — das ist eine Regel und gehört darum in den Kern, nicht in die
   * Beschaffung.
   */
  statusZeilen: string[] | null;
  /** Ausgecheckter Branch; `null` bei detached HEAD. */
  branch: string | null;
  head: string;
  /** Nur bei detached HEAD relevant: ist `head` von `main` aus erreichbar? */
  headVonMain: boolean;
  /** Nur bei detached HEAD relevant: ist `head` der Head eines MERGED-PR? */
  headIstPrHead: boolean;
}

export interface Fakten {
  /** `false` = `gh` fehlt oder scheiterte ⇒ nur `leer` ist abräumbar. */
  ghVerfuegbar: boolean;
  /** Branch des aktuellen Worktrees; `null` bei detached HEAD. */
  aktuellerBranch: string | null;
  branches: BranchFakt[];
  worktrees: WorktreeFakt[];
}

export interface BranchBefund {
  name: string;
  klasse: BranchKlasse;
  abraeumbar: boolean;
  /** Löschflagge für den Ausführ-Lauf; `null`, wenn nicht abräumbar. */
  flagge: '-d' | '-D' | null;
  spitze: string;
  vorMain: number | null;
  letzterCommitUnix: number | null;
  remote: boolean;
  pr: PrFakt | null;
  /** Begründung — steht im Trockenlauf hinter jeder Zeile. */
  grund: string;
  /** `main` und der aktuell ausgecheckte Branch werden nicht gemeldet. */
  stumm: boolean;
}

export interface WorktreeBefund {
  pfad: string;
  name: string;
  abraeumbar: boolean;
  head: string;
  branch: string | null;
  grund: string;
  /** Haupt-Checkout und der aktuelle Worktree werden nicht gemeldet. */
  stumm: boolean;
}

export interface Befunde {
  branches: BranchBefund[];
  worktrees: WorktreeBefund[];
  ghVerfuegbar: boolean;
}

/**
 * `git worktree list --porcelain` → rohe Blöcke.
 *
 * Eine Quelle für die Porcelain-Zerlegung (§5): `parseWorktrees` in lage.ts
 * setzt seit 21.9.2026 auf dieser Funktion auf statt auf einem zweiten Regex.
 */
export interface WorktreeRoh {
  pfad: string;
  branch: string | null;
  head: string;
  gelockt: boolean;
  haupt: boolean;
}

export function parseWorktreeFakten(porcelain: string): WorktreeRoh[] {
  return porcelain
    .split('\n\n')
    .map((block) => ({ pfad: block.match(/^worktree (.+)$/m)?.[1] ?? '', block }))
    .filter((x) => x.pfad !== '')
    .map(({ pfad, block }, lfd) => ({
      pfad,
      branch: block.match(/^branch refs\/heads\/(.+)$/m)?.[1] ?? null,
      head: block.match(/^HEAD ([0-9a-f]+)$/m)?.[1] ?? '',
      gelockt: /^locked( .*)?$/m.test(block),
      haupt: lfd === 0,
    }));
}

/** Letztes Pfadsegment eines Worktree-Pfads. */
export function platzName(pfad: string): string {
  return pfad.split('/').filter(Boolean).pop() ?? pfad;
}

/**
 * Ignorierte Einträge, die einen Worktree NICHT schmutzig machen.
 *
 * Anlass (Bug-Check 21.9.2026, Blocker 2): `git worktree remove` löscht
 * gitignorte Dateien klaglos, OHNE `--force` — empirisch belegt am 21.9.2026
 * in einem Wegwerf-Repo: `git status --porcelain` leer, `--ignored` zeigt
 * `!! ignoriert/`, `git worktree remove` beendet sich mit 0 und die Datei ist
 * weg. Betroffen wären u. a. Davids Pflicht-Notizen unter `.claude/notizen/`
 * (.gitignore). Darum zählt seither JEDER ignorierte Eintrag als schmutzig —
 * ausser diesen, die ein einziger Befehl wiederherstellt:
 *
 *   node_modules/ → `npm ci` · dist/ → `npm run build` · .vite/ → Vite-Cache
 *   coverage/, playwright-report/, test-results/ → der jeweilige Testlauf
 *   .gate/ → Logs von `gate.sh`
 *
 * Die Liste ist bewusst eine Aufzählung exakter Namen, kein Muster: ein
 * `*.log`-Muster hätte irgendwann eine echte Messreihe mitgelöscht. Alles
 * andere — auch `.selbstopt-ereignisse.jsonl` oder ein lokales `.env` —
 * hält den Platz stehen.
 *
 * Ohne Schrägstrich notiert, weil git denselben Eintrag mal als
 * `!! node_modules/` (echtes Verzeichnis) und mal als `!! node_modules`
 * (Symlink auf das Haupt-Checkout) druckt — beides real gemessen am
 * 21.9.2026 in zwei Worktrees desselben Repos.
 */
export const IGNORIERT_ERLAUBT: readonly string[] = [
  'node_modules',
  'dist',
  '.vite',
  'coverage',
  'playwright-report',
  'test-results',
  '.gate',
];

const MAX_NAMEN = 3;

function undSoWeiter(namen: string[]): string {
  const gezeigt = namen.slice(0, MAX_NAMEN).join(', ');
  return namen.length > MAX_NAMEN ? `${gezeigt} +${namen.length - MAX_NAMEN}` : gezeigt;
}

/**
 * Prüft die `git status --porcelain --ignored`-Zeilen: `null` = sauber,
 * sonst der Grund, warum der Platz stehen bleibt.
 */
export function schmutz(statusZeilen: string[]): string | null {
  const zeilen = statusZeilen.map((z) => z.trimEnd()).filter((z) => z !== '');
  const ignoriert = zeilen.filter((z) => z.startsWith('!! ')).map((z) => z.slice(3));
  const rest = zeilen.filter((z) => !z.startsWith('!! '));
  const heikel = ignoriert.filter((e) => !IGNORIERT_ERLAUBT.includes(e.replace(/\/$/, '')));
  const teile: string[] = [];
  if (rest.length > 0) teile.push(`${rest.length} Änderung(en)/unversionierte Datei(en)`);
  if (heikel.length > 0) {
    teile.push(`${heikel.length} ignorierte(r) Eintrag/Einträge: ${undSoWeiter(heikel)}`);
  }
  return teile.length === 0 ? null : `nicht sauber — ${teile.join(' · ')}`;
}

/** Klasse eines Branches — hängt bewusst NICHT vom Worktree ab (s. Kopf). */
function klasseVon(b: BranchFakt, ghVerfuegbar: boolean): { klasse: BranchKlasse; grund: string } {
  if (b.leer) return { klasse: 'leer', grund: 'keine Commits vor main' };
  const n = b.vorMain === null ? 'Commits' : `${b.vorMain} Commit${b.vorMain === 1 ? '' : 's'}`;
  if (!ghVerfuegbar) {
    return { klasse: 'offen', grund: `${n} vor main · PR-Lage nicht abfragbar (gh) — fail-closed` };
  }
  if (!b.pr) return { klasse: 'offen', grund: `${n} vor main, kein PR` };
  if (b.pr.zustand !== 'MERGED') {
    return { klasse: 'offen', grund: `${n} vor main · PR #${b.pr.number} ${b.pr.zustand === 'OPEN' ? 'offen' : 'geschlossen, nicht gemergt'}` };
  }
  if (b.pr.basis !== 'main') {
    return { klasse: 'offen', grund: `PR #${b.pr.number} gemergt, aber nach «${b.pr.basis}», nicht nach main` };
  }
  if (b.nachPrHead === null) {
    return { klasse: 'offen', grund: `PR #${b.pr.number} gemergt, aber der Abgleich mit dem PR-Head scheiterte — fail-closed` };
  }
  if (b.nachPrHead > 0) {
    return {
      klasse: 'offen',
      grund: `PR #${b.pr.number} gemergt, aber ${b.nachPrHead} Commit${b.nachPrHead === 1 ? '' : 's'} danach auf dem Branch`,
    };
  }
  return { klasse: 'gelandet', grund: `PR #${b.pr.number} gemergt, Spitze deckungsgleich` };
}

/**
 * Klassiert Branches und Worktrees. Rein — gleiche Fakten, gleiche Befunde.
 *
 * Nie abräumbar: `main`, der aktuell ausgecheckte Branch, jeder Branch in
 * einem nicht abräumbaren Worktree, jeder Worktree, der Haupt-Checkout,
 * aktuell, gelockt oder nicht sauber ist.
 */
export function klassiere(f: Fakten): Befunde {
  // (1) Klasse je Branch — ohne Worktree-Wissen.
  const klassen = new Map<string, { klasse: BranchKlasse; grund: string }>();
  for (const b of f.branches) klassen.set(b.name, klasseVon(b, f.ghVerfuegbar));

  const geschuetzt = (name: string): string | null => {
    if (name === 'main') return 'main';
    if (f.aktuellerBranch !== null && name === f.aktuellerBranch) return 'aktuell ausgecheckt';
    return null;
  };

  // (2) Worktrees — brauchen die Klasse ihres Branches.
  const worktrees: WorktreeBefund[] = f.worktrees.map((w) => {
    const basis = { pfad: w.pfad, name: w.name, head: w.head, branch: w.branch };
    const nein = (grund: string, stumm = false): WorktreeBefund => ({ ...basis, abraeumbar: false, grund, stumm });
    if (w.haupt) return nein('Haupt-Checkout', true);
    if (w.aktuell) return nein('aktueller Worktree', true);
    if (w.gelockt) return nein('gelockt (nie `git worktree unlock`)');
    // Lebende Session VOR allem anderen: ein belegter Platz bleibt stehen,
    // auch wenn er sauber und sein Branch längst gelandet ist.
    if (w.belegt === true) return nein('laufender Prozess im Worktree (lebende Session)');
    if (w.belegt === null) return nein('Belegung nicht prüfbar (lsof) — fail-closed');
    if (w.statusZeilen === null) return nein('`git status` nicht abfragbar — fail-closed');
    const dreck = schmutz(w.statusZeilen);
    if (dreck !== null) return nein(dreck);
    if (w.branch === null) {
      // detached HEAD
      if (w.headVonMain) return { ...basis, abraeumbar: true, grund: 'detached HEAD, von main erreichbar', stumm: false };
      if (w.headIstPrHead) return { ...basis, abraeumbar: true, grund: 'detached HEAD == Head eines gemergten PR', stumm: false };
      return nein('detached HEAD, weder von main erreichbar noch gelandet — fail-closed');
    }
    const k = klassen.get(w.branch);
    if (!k) return nein(`Branch «${w.branch}» nicht in der Branch-Liste — fail-closed`);
    if (k.klasse === 'offen') return nein(`Branch «${w.branch}»: ${k.grund}`);
    return { ...basis, abraeumbar: true, grund: `sauber · Branch «${w.branch}»: ${k.grund}`, stumm: false };
  });
  const wtAbraeumbar = new Map(worktrees.map((w) => [w.pfad, w.abraeumbar]));

  // (3) Branches — brauchen die Abräumbarkeit ihres Worktrees.
  const branches: BranchBefund[] = f.branches.map((b) => {
    const k = klassen.get(b.name)!;
    const basis = {
      name: b.name,
      klasse: k.klasse,
      spitze: b.spitze,
      vorMain: b.vorMain,
      letzterCommitUnix: b.letzterCommitUnix,
      remote: b.remote,
      pr: b.pr,
    };
    const schutz = geschuetzt(b.name);
    if (schutz !== null) return { ...basis, abraeumbar: false, flagge: null, grund: schutz, stumm: true };
    if (k.klasse === 'offen') return { ...basis, abraeumbar: false, flagge: null, grund: k.grund, stumm: false };
    if (b.imWorktree !== null && wtAbraeumbar.get(b.imWorktree) !== true) {
      return {
        ...basis,
        abraeumbar: false,
        flagge: null,
        grund: `${k.grund}, aber in «${platzName(b.imWorktree)}» ausgecheckt (Worktree bleibt stehen)`,
        stumm: false,
      };
    }
    // `-d` verweigert bei gelandeten Squash-Branches (Spitze ist kein Vorfahre
    // von main) — genau das war der Anlass. Dort ist `-D` richtig UND sicher:
    // der Inhalt liegt nachweislich als gemergter PR auf main.
    return { ...basis, abraeumbar: true, flagge: k.klasse === 'leer' ? '-d' : '-D', grund: k.grund, stumm: false };
  });

  return { branches, worktrees, ghVerfuegbar: f.ghVerfuegbar };
}

const TAG_S = 86_400;

/** Alter in Tagen als Kurztext; `null`-Zeitstempel ⇒ leer. */
export function alter(letzterCommitUnix: number | null, jetztUnix: number): string {
  if (letzterCommitUnix === null) return '';
  const tage = Math.floor((jetztUnix - letzterCommitUnix) / TAG_S);
  if (tage <= 0) return 'heute';
  return `${tage} Tag${tage === 1 ? '' : 'e'} alt`;
}

function mitPunkt(teile: (string | null | false)[]): string {
  return teile.filter((t): t is string => typeof t === 'string' && t !== '').join(' · ');
}

/**
 * Trockenlauf-Bericht: zwei Listen, je Zeile eine Begründung.
 *
 * `jetztUnix` kommt von aussen — der Kern kennt keine Uhr (§2).
 */
export function berichtZeilen(bef: Befunde, jetztUnix: number): string[] {
  const z: string[] = [];
  const wtWeg = bef.worktrees.filter((w) => w.abraeumbar);
  const brWeg = bef.branches.filter((b) => b.abraeumbar);
  const brBleibt = bef.branches.filter((b) => !b.abraeumbar && !b.stumm);
  const wtBleibt = bef.worktrees.filter((w) => !w.abraeumbar && !w.stumm);

  z.push(`🧹 Abräumbar: ${wtWeg.length} Worktree${wtWeg.length === 1 ? '' : 's'} · ${brWeg.length} Branch${brWeg.length === 1 ? '' : 'es'}`);
  if (wtWeg.length === 0 && brWeg.length === 0) z.push('   — nichts');
  for (const w of wtWeg) z.push(`   🌳 ${w.name}  (${w.head.slice(0, 9)})  — ${w.grund}`);
  for (const b of brWeg) {
    z.push(`   🌿 ${b.name}  (${b.spitze.slice(0, 9)}, git branch ${b.flagge})  — ${mitPunkt([b.grund, alter(b.letzterCommitUnix, jetztUnix)])}`);
  }

  z.push('');
  z.push(`⚠️  Ungelandete Arbeit — nicht angefasst: ${wtBleibt.length} Worktree${wtBleibt.length === 1 ? '' : 's'} · ${brBleibt.length} Branch${brBleibt.length === 1 ? '' : 'es'}`);
  if (wtBleibt.length === 0 && brBleibt.length === 0) z.push('   — nichts');
  for (const w of wtBleibt) z.push(`   🌳 ${w.name}  — ${w.grund}`);
  for (const b of brBleibt) {
    z.push(
      `   🌿 ${b.name}  (${b.spitze.slice(0, 9)})  — ` +
        mitPunkt([b.grund, alter(b.letzterCommitUnix, jetztUnix), b.remote ? 'Remote: ja' : 'Remote: nein']),
    );
  }
  return z;
}

/**
 * Die EINE Zeile für `plan:next` — `null`, wenn es nichts zu melden gibt.
 *
 * **Nur Zähler, keine Namen** (Bug-Check 21.9.2026, Auflage 5): der
 * Lage-Block darüber nennt jeden Worktree und jeden Branch bereits beim
 * Namen; eine zweite Namensliste wäre reine Verdopplung (§17-Gegengewicht:
 * wer hinzufügt, ersetzt zuerst die Stelle, die dieselbe Sorge trägt). Der
 * Zähler ist das, was der Lage-Block NICHT sagt — und die kleinere der beiden
 * zulässigen Lösungen: die bestehenden plan-lage-Tests bleiben unberührt
 * (§6.3), weil kein Zeichen am Lage-Block geändert wird.
 *
 * Byte-stabil: keine Uhrzeit, keine Zufallsquelle, keine Pfade. `geprueft`
 * trennt die ehrlichen Wortlaute (§8): ohne gh-Abfrage weiss der Aufrufer
 * nicht, ob ein Branch ungelandet oder nur unbelegt ist — dann heisst es
 * «zu prüfen», nicht «mit ungelandeter Arbeit».
 */
export function flaechenZeile(bef: Befunde, geprueft: boolean): string | null {
  const abr = bef.branches.filter((b) => b.abraeumbar).length + bef.worktrees.filter((w) => w.abraeumbar).length;
  const rest = bef.branches.filter((b) => !b.abraeumbar && !b.stumm).length;
  if (abr === 0 && rest === 0) return null;
  const teile: string[] = [];
  if (abr > 0) teile.push(`${abr} abräumbar`);
  if (rest > 0) teile.push(`${rest} ${geprueft ? 'mit ungelandeter Arbeit' : 'zu prüfen'}`);
  return `🧹 Git-Flächen: ${teile.join(' · ')} — npm run aufraeumen:git`;
}
