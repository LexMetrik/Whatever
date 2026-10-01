// scripts/check-ci-laeufe.ts — Wächter über die geplanten Workflow-Läufe (F2c).
//
// VORFALL 13.–20.7.2026: `turso-sync.yml` lief sechsmal je exakt in den
// 20-Minuten-Timeout und endete als `cancelled`. GitHub färbt einen
// abgebrochenen Lauf GRAU, nicht rot — in der Lauf-Liste sieht das aus wie
// «nichts Besonderes». Der Suchindex veraltete eine ganze Woche unbemerkt.
//
// WARUM EIN TOR UND KEIN SATZ IN EINEM SKILL: Der erste Anlauf verankerte die
// Regel «cancelled und skipped zählen als ROT» im Skill »landung« (Schritt 5).
// Die adversariale Prüfung (20.7.2026) hat das zu Recht als unwirksam
// beanstandet: der Skill wird nur geladen, wenn zufällig jemand gerade einen PR
// landet. Ein Ausfall, der niemanden zum Landen bringt, bleibt genau so
// unentdeckt wie am 13.7. Der Auslöser war falsch gewählt — Landung statt
// Zeitablauf. Dieses Tor hängt an der Zeit: es fragt den tatsächlichen Zustand
// der geplanten Workflows ab, unabhängig davon, was jemand gerade tut.
//
// PRÜFUNG je Workflow mit `schedule:`-Trigger:
//   (1) Der JÜNGSTE abgeschlossene Lauf ist `success`. `cancelled`, `skipped`,
//       `failure`, `timed_out` zählen als ROT — nicht als «grau».
//   (2) Er liegt nicht länger zurück als das Doppelte seines Intervalls
//       (Kulanz für Verzögerungen). Ein Workflow, der gar nicht mehr startet,
//       ist genau so defekt wie einer, der scheitert — und fällt sonst
//       niemandem auf, weil es keinen roten Lauf zu sehen gibt.
//
// KEIN STILLER SKIP (§6 Ziff. 7 lit. b): fehlt `gh` oder die Authentisierung,
// meldet das Tor das sichtbar als SKIP mit Exit 0 — nie still grün, und nie
// rot wegen einer fehlenden Voraussetzung, die nichts über den Zustand aussagt.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

type Lauf = { conclusion: string | null; status: string; createdAt: string; url: string };

const DIR = '.github/workflows';
const STUNDE = 3_600_000;

// ─── SELBSTAUSSCHLUSS (Reparatur 3.8.2026, Fehlerklasse K6) ──────────────────
// Dieses Tor läuft SELBST als cron-Workflow (waechter.yml) und fand sich in der
// eigenen Prüfmenge wieder: der GERADE LAUFENDE Lauf ist `in_progress` und fällt
// aus der `completed`-Filterung, beurteilt wird also stets der VORIGE. War der
// rot, wurde das Tor dadurch selbst rot und lieferte der nächsten Ausführung
// erneut ein rotes Vorbild. BELEG: seit Anlage am 20.7.2026 fünfzehn Läufe,
// fünfzehnmal `failure` (Lauf 30803981348). Der Ausschluss kostet keine
// Abdeckung: scheitert dieser Workflow, steht sein roter Lauf in der Actions-
// Liste — Fremdüberwachung des Wächters bliebe zirkulär, egal wer sie ausspricht.
const SELBST = 'waechter.yml';

/** Cron-Intervall grob in Stunden — reicht für die Kulanz-Schwelle. */
export function intervallStunden(cron: string): number {
  const [, stunde, tag, monat, wochentag] = cron.trim().split(/\s+/);
  if (wochentag !== '*') return 24 * 7;                   // wöchentlich
  if (tag !== '*' || monat !== '*') return 24 * 31;       // monatlich (Tag/Monat fix)
  if (stunde.includes('/')) return Number(stunde.split('/')[1]) || 6;
  return stunde === '*' ? 1 : 24;                         // stündlich : täglich
}

/** Ein Workflow mit mehreren Crons gilt als so häufig wie sein häufigster. */
export const intervallDerCrons = (crons: string[]): number => Math.min(...crons.map(intervallStunden));

/** Workflows mit schedule:-Trigger → Datei + Intervall. */
function geplante(): { datei: string; stunden: number }[] {
  const out: { datei: string; stunden: number }[] = [];
  for (const datei of readdirSync(DIR)) {
    if (!/\.ya?ml$/.test(datei)) continue;
    if (datei === SELBST) continue; // siehe SELBST oben — Selbstverriegelung K6
    const inhalt = readFileSync(`${DIR}/${datei}`, 'utf8');
    const crons = [...inhalt.matchAll(/^\s*-\s*cron:\s*'([^']+)'/gm)].map((m) => m[1]);
    if (!crons.length) continue;
    out.push({ datei, stunden: intervallDerCrons(crons) });
  }
  return out;
}

function skip(grund: string): never {
  console.log(`check:ci-laeufe SKIP — ${grund}. Kein Urteil über die geplanten Läufe.`);
  process.exit(0);
}

let laeufeRoh: string;

function git(...args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** (a) Zustand JEDES Workflows: letzter Lauf, Ergebnis, Alter in Tagen. */
function abschnittWaechter(): void {
  console.log('── (a) Wächter-Zustand — letzter Lauf je Workflow ──────────────────────────');
  const dateien = readdirSync(DIR).filter((d) => /\.ya?ml$/.test(d)).sort();
  for (const datei of dateien) {
    const inhalt = readFileSync(`${DIR}/${datei}`, 'utf8');
    const geplant = /^\s*-\s*cron:/m.test(inhalt) ? 'geplant' : 'ereignisgesteuert';
    let roh: string;
    try {
      roh = execFileSync(
        'gh',
        ['run', 'list', '--workflow', datei, '--limit', '1',
         '--json', 'conclusion,status,createdAt,url'],
        { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', timeout: 60_000 },
      );
    } catch {
      console.log(`  ${datei.padEnd(26)} [${geplant}] Lauf-Liste nicht abrufbar.`);
      continue;
    }
    const l = (JSON.parse(roh) as Lauf[])[0];
    if (!l) {
      console.log(`  ${datei.padEnd(26)} [${geplant}] KEIN EINZIGER LAUF.`);
      continue;
    }
    const tage = (Date.now() - Date.parse(l.createdAt)) / (24 * STUNDE);
    const ergebnis = l.status === 'completed' ? (l.conclusion ?? '?') : l.status;
    console.log(
      `  ${datei.padEnd(26)} [${geplant}] ${ergebnis.padEnd(11)} ` +
      `${l.createdAt.slice(0, 10)} (vor ${tage.toFixed(1)} Tagen)`);
  }
}

/** (b) Verwaiste Worktrees und Zweige — Rückgabe: Zahl der Funde. */
function abschnittVerwaist(): number {
  console.log('\n── (b) Verwaiste Worktrees und Zweige ──────────────────────────────────────');
  const funde: string[] = [];

  const porcelain = git('worktree', 'list', '--porcelain');
  const bloecke = porcelain.split('\n\n').filter(Boolean);
  // Der ERSTE Block ist stets das Haupt-Arbeitsverzeichnis — daran misst sich,
  // was «ausserhalb des Repo-Verzeichnisses» heisst.
  const wurzel = /^worktree (.+)$/m.exec(bloecke[0] ?? '')?.[1] ?? '';
  const mitWorktree = new Set<string>();

  for (const b of bloecke) {
    const pfad = /^worktree (.+)$/m.exec(b)?.[1];
    const zweig = /^branch refs\/heads\/(.+)$/m.exec(b)?.[1];
    if (!pfad) continue;
    if (zweig) mitWorktree.add(zweig);
    if (pfad === wurzel) continue;

    if (wurzel && !pfad.startsWith(wurzel)) {
      funde.push(`  ${pfad}: Worktree AUSSERHALB von ${wurzel} — Scratchpad-Pfad einer beendeten Session?`);
    }
    if (!zweig) {
      funde.push(`  ${pfad}: Worktree ohne Zweig (detached HEAD) — nicht zuordenbar.`);
      continue;
    }
    // Leerer Diff gegen origin/main = der Inhalt steckt bereits in main. Bewusst
    // der DIFF und nicht die Commit-Liste: bei --squash-Landung behält der Zweig
    // seine Commits, sein Inhalt ist aber angekommen.
    const abweichung = git('diff', '--stat', 'origin/main', zweig);
    if (!abweichung) {
      // SPEC-SCHÄRFUNG 15.8.2026 (beim Bau aufgefallen, Fahrplan §3.1 nachgezogen):
      // Der Diff allein genügt nicht. Ein Worktree, in dem GERADE gearbeitet wird,
      // hat vor dem ersten Commit denselben leeren Diff wie ein abgeräumter — der
      // Bericht meldete sich in seinem eigenen Bauverzeichnis als verwaist. Ein
      // Melder, der Falschalarm gibt, wird weggeklickt; dann meldet er nichts mehr.
      const schmutzig = git('-C', pfad, 'status', '--porcelain');
      if (schmutzig) {
        console.log(`  ok: ${zweig} — in Arbeit (${schmutzig.split('\n').length} Datei(en) uncommittet).`);
      } else {
        funde.push(`  ${pfad} (${zweig}): gelandet, nicht abgeräumt — Diff gegen origin/main ist LEER, nichts uncommittet.`);
      }
    } else {
      console.log(`  ok: ${zweig} — eigener Stand gegenüber origin/main (${abweichung.split('\n').length - 1} Datei(en)).`);
    }
  }

  // Zweige OHNE Worktree gegen die offenen PRs: ein Zweig ohne PR und ohne
  // Worktree, dessen Inhalt schon in main steht, ist Rest einer alten Session.
  let prZweige = new Set<string>();
  try {
    const roh = execFileSync('gh', ['pr', 'list', '--state', 'open', '--json', 'headRefName'],
      { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', timeout: 60_000 });
    prZweige = new Set((JSON.parse(roh) as { headRefName: string }[]).map((p) => p.headRefName));
  } catch {
    console.log('  (offene PRs nicht abrufbar — Zweig-Abgleich unvollständig, kein Urteil darüber.)');
  }

  const lokal = git('branch', '--format=%(refname:short)').split('\n').filter(Boolean);
  const entfernt = git('branch', '-r', '--format=%(refname:short)')
    .split('\n').filter((z) => z.startsWith('origin/') && !z.includes('HEAD') && z !== 'origin/main')
    .map((z) => z.slice('origin/'.length));

  for (const [herkunft, zweige] of [['lokal', lokal], ['origin', entfernt]] as const) {
    for (const z of zweige) {
      if (z === 'main' || mitWorktree.has(z) || prZweige.has(z)) continue;
      const ref = herkunft === 'origin' ? `origin/${z}` : z;
      if (!git('diff', '--stat', 'origin/main', ref)) {
        funde.push(`  ${ref}: Zweig ohne Worktree und ohne offenen PR, Diff gegen origin/main LEER — löschbar.`);
      }
    }
  }

  if (!funde.length) console.log('  Keine verwaisten Worktrees oder Zweige.');
  else console.log(funde.join('\n'));
  return funde.length;
}

function bericht(): never {
  abschnittWaechter();
  const verwaist = abschnittVerwaist();
  if (verwaist) {
    console.log(
      `\nbericht:automatik ROT — ${verwaist} verwaiste(r) Worktree/Zweig.\n` +
      `  Abräumen: git worktree remove <pfad> · git branch -D <zweig> · git push origin --delete <zweig>.`);
    process.exit(1);
  }
  console.log('\nbericht:automatik OK — Wächter-Zustand oben, nichts Verwaistes.');
  process.exit(0);
}

/** Hauptlauf — nur bei direktem CLI-Aufruf, nicht beim Import durch den Test. */
function main(): void {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
  } catch {
    skip('`gh` fehlt oder ist nicht authentisiert');
  }

  // ─── UNTERBEFEHL `--bericht` (QS-AUTOMATIK-BERICHT, Fahrplan §3.1) ───────────
  // Neben dem Tor («ist ein geplanter Workflow kaputt?») beantwortet der Bericht,
  // was es bis 15.8.2026 nur als Handarbeit gab: «wie geht es den Wächtern?» und
  // «welche Zweige/Worktrees sind gelandet, aber nicht abgeräumt?». ABGRENZUNG:
  // kein Teil von `check:seriell`/CI (misst eine ARBEITSMASCHINE, auf dem Runner
  // bedeutungslos); findet er Verwaistes, endet er mit Exit 1 (§6.7).
  if (process.argv.includes('--bericht')) bericht();

  // Der Selbstausschluss oben ist ein NAME — wird waechter.yml umbenannt, greift
  // er stillschweigend nicht mehr und die Verriegelung kehrt zurück (§6.7 lit. b:
  // nie still). Darum hier hart: existiert die Datei nicht, ist der Ausschluss
  // ins Leere gelaufen und das Tor sagt es, statt weiterzulaufen.
  if (!readdirSync(DIR).includes(SELBST)) {
    console.log(
      `check:ci-laeufe ROT — der Selbstausschluss zeigt auf '${DIR}/${SELBST}', ` +
      `diese Datei existiert nicht (mehr).\n` +
      `  Wurde der Wächter-Workflow umbenannt, muss SELBST in scripts/check-ci-laeufe.ts ` +
      `mitgezogen werden — sonst prüft das Tor wieder sich selbst und bleibt für immer rot.`);
    process.exit(1);
  }

  const plaene = geplante();
  if (!plaene.length) skip(`keine Workflows mit schedule:-Trigger in ${DIR}`);

  const fehler: string[] = [];
  const ok: string[] = [];

  for (const { datei, stunden } of plaene) {
    try {
      laeufeRoh = execFileSync(
        'gh',
        ['run', 'list', '--workflow', datei, '--limit', '10',
         '--json', 'conclusion,status,createdAt,url'],
        { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', timeout: 60_000 },
      );
    } catch (e) {
      fehler.push(`  ${datei}: Lauf-Liste nicht abrufbar (${(e as Error).message.split('\n')[0]}).`);
      continue;
    }

    const laeufe = (JSON.parse(laeufeRoh) as Lauf[])
      .filter((l) => l.status === 'completed');

    if (!laeufe.length) {
      fehler.push(`  ${datei}: kein einziger abgeschlossener Lauf — der Workflow startet nicht.`);
      continue;
    }

    const juengster = laeufe[0];
    const alterH = (Date.now() - Date.parse(juengster.createdAt)) / STUNDE;

    if (juengster.conclusion !== 'success') {
      const grau = juengster.conclusion === 'cancelled' || juengster.conclusion === 'skipped';
      fehler.push(
        `  ${datei}: jüngster Lauf '${juengster.conclusion}'` +
        (grau ? ' (GitHub färbt das GRAU, nicht rot — genau der Vorfall vom 13.–20.7.2026)' : '') +
        `\n      ${juengster.url}`);
      continue;
    }

    if (alterH > stunden * 2) {
      fehler.push(
        `  ${datei}: jüngster erfolgreicher Lauf ist ${alterH.toFixed(1)} h alt ` +
        `(Intervall ${stunden} h, Kulanz ${stunden * 2} h) — der Zeitplan greift nicht mehr.\n` +
        `      ${juengster.url}`);
      continue;
    }

    ok.push(`${datei} (${alterH.toFixed(1)} h alt, Intervall ${stunden} h)`);
  }

  if (fehler.length) {
    console.log(
      `check:ci-laeufe ROT — ${fehler.length} von ${plaene.length} geplanten ` +
      `Workflow(s) nicht in Ordnung:\n${fehler.join('\n')}\n\n` +
      `  'cancelled' und 'skipped' zählen als ROT (CLAUDE.md §6 Ziff. 7 lit. c).\n` +
      `  Ein grauer Lauf ist kein bestandener Lauf.`);
    process.exit(1);
  }

  console.log(
    `check:ci-laeufe OK — alle ${plaene.length} geplanten Workflows zuletzt ` +
    `erfolgreich und im Zeitfenster: ${ok.join(', ')}.`);
}

// Entry-Erkennung über `VITEST` (vgl. check-e2e-flake.ts): `process.argv[1]`
// zeigt unter vite-node aufs Binary; ein Import darf weder gh rufen noch exiten.
if (!process.env.VITEST) main();
