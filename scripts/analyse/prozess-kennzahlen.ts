// scripts/analyse/prozess-kennzahlen.ts — Zeitreihe der Prozess-Masse
// (ROADMAP-Schritt `QS-BEWAEHRUNG`, Teil A Ziff. 3).
//
// ANLASS. Dossier `bibliothek/betrieb/rekursive-selbstverbesserung-
// gegenueberstellung-2026-09-15.md` §6 («Gedächtnis wird Rauschen»): die
// Prozess-Masse sind Momentwerte, ohne Trend ist offen, ob Verbesserung oder
// Umlauf. §8 Ziff. 3: Kennzahlen je Chronik-Überführung, mit Trend.
//
// AUFRUF:
//   npm run prozess:kennzahlen                   nur anzeigen (Stand HEAD)
//   npm run prozess:kennzahlen -- --schreiben    Zeile an die CSV anhängen
//   npm run prozess:kennzahlen -- --seed         Verlauf rückwirkend erzeugen
//
// KEIN TOR. Hier wird gezählt, nicht bewertet. Keine Zahl dieser Datei
// entscheidet je über Grün/Rot; ohne Trend ist eine steigende Zeilenzahl
// weder gut noch schlecht — darum steht die Zeitreihe daneben.
//
// ── DIE NEUN SPALTEN ─────────────────────────────────────────────────────
//   datum                 ISO-Tag der Messung (bei --seed: der Stichtag)
//   claude_md_zeilen      Zeilen der Projekt-CLAUDE.md
//   skills_zeilen         Summe aller `.claude/skills/**/*.md`
//   rules_zeilen          Summe aller `.claude/rules/*.md`
//   tore                  Anzahl `check:*`-Einträge in package.json
//   hooks                 Anzahl `.claude/hooks/*.py`
//   commits_30d           Commits in den 30 Tagen vor dem Stichtag
//   prozess_commits_30d   davon Prozess-Commits (Pfad-Regel, s. unten)
//   roadmap_bytes         Bytes der ROADMAP.md
//   steuerflaeche_bytes   Bytes der GESAMTEN Steuerungs-Fläche (Definition in
//                         steuerflaecheKern.ts, ab 20.9.2026 — rückwirkend auf
//                         ältere Bäume nachgerechnet, damit die Klinke einen
//                         Trend hat statt nur einen Momentwert)
//
// ── REGEL `prozess_commits_30d` — Pfad-Regel ────────────────────────────
// Ein «Prozess-Commit» ist ein Commit mit mindestens einer geänderten Datei,
// dessen geänderte Pfade ALLE Prozess-Pfade sind (`istProzessPfad`): die
// Steuerungs-Fläche (`FLAECHE` aus steuerflaecheKern.ts, importiert, nicht
// kopiert; bewusst OHNE die RECHTSSCHUTZ-Ausnahme von `istFlaeche`, die ist
// Byte-Druck-Schutz und beantwortet nicht «ist das Prozessarbeit?»), die
// Plan-Doku (ROADMAP, Chronik, STRUKTUR, fahrplaene/, plan/, archiv/, .claude/,
// drei messwerte-Dateien, bibliothek/betrieb/), scripts/{landung,ci,gegenpruefung}/
// und die Tests der Prozess-Werkzeuge (abschliessende Präfix-Liste PROZESS_TESTS).
//
// OFFENLEGUNG (§7). Seit 5.10.2026 Pfad-Regel statt Betreff-Muster (Auftrag
// David 5.10.2026): der Bauplan-Umstieg entfernte die `QS-`-Präfixe aus den
// Betreffen, 6 von 8 Umstieg-Commits fielen heraus. Die ganze Reihe ist nach
// der Pfad-Regel neu erhoben; alte Werte nur in git. Grenzen der Zahl:
//  · Gemischte Commits (Prozess- UND Produkt-Pfad, z. B. Feature + ROADMAP) zählen
//    als Produkt; Anteil im Fenster bis 25.9.2026: 217 von 546 (40 %,
//    gemessen 5.10.2026) — die Zahl ist eine Untergrenze der Prozessarbeit.
//  · Die Liste ist abschliessend und gilt rückwirkend für alte Commits: wer
//    `FLAECHE`, PLAN_DOKU oder PROZESS_TESTS ändert, verschiebt die ganze Reihe.
//  · Stichtag = UTC-Mitternacht (`<tag>T00:00:00Z`), Fenster [tag−30 T, tag T):
//    jeder Wert ist unabhängig von der Uhrzeit des Laufs reproduzierbar.
// Beobachtungsgrösse, kein Urteil: sie speist nie ein Tor (§2).
//
// ── SEEDING OHNE CHECKOUT ────────────────────────────────────────────────
// `--seed` erzeugt Zeilen für den 1. und 15. jedes Monats seit 2026-07-01 (volle
// Erhebung). Daten, die schon in der CSV stehen, behalten ihre Live-Messung und
// erhalten NUR neu `commits_30d` und `prozess_commits_30d` (eine Regel für die
// Reihe; die übrigen Spalten waren zum Messtag erhoben und sind nicht
// rekonstruierbar). Je Stichtag: `git rev-list -1 --before=<tag>T00:00:00Z
// origin/main` (sonst `main`) liefert den letzten Commit davor, alle Kennzahlen
// kommen aus `git ls-tree` und `git show <sha>:<pfad>`. KEIN Checkout — ein `git checkout` im Worktree würde fremde
// Sessions und den laufenden Bau zerschiessen (§12).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { FLAECHE, flaecheImCommit } from './steuerflaecheKern';

export const CSV_DATEI = 'messwerte/prozess-kennzahlen.csv';
export const SEED_START = '2026-07-01';
export const FENSTER_TAGE = 30;
export const SPALTEN = [
  'datum',
  'claude_md_zeilen',
  'skills_zeilen',
  'rules_zeilen',
  'tore',
  'hooks',
  'commits_30d',
  'prozess_commits_30d',
  'roadmap_bytes',
  'steuerflaeche_bytes',
] as const;

export type Zeile = Record<(typeof SPALTEN)[number], string | number>;

/** Plan-Doku: Pfade, die den Bau steuern, ohne unter `FLAECHE` zu fallen. */
const PLAN_DOKU =
  /^(ROADMAP\.md|ROADMAP-CHRONIK\.md|STRUKTUR\.md|messwerte\/(prozess-kennzahlen\.csv|steuerflaeche\.json|tor-bewaehrung\.json))$|^(fahrplaene|plan|archiv|\.claude|bibliothek\/betrieb|scripts\/(landung|ci|gegenpruefung))\//;

/**
 * Tests der Prozess-Werkzeuge in `src/tests/` — ABSCHLIESSENDE Präfix-Liste,
 * kein Laufzeit-Import-Scan (die Regel muss für alte Commits gelten). Ermittelt
 * 5.10.2026: `src/tests/*.test.ts(x)`, die aus Prozess-Pfaden importieren
 * (scripts/{plan,analyse,check-*,landung,ci,gegenpruefung,dispatch*,fahrplan-slice},
 * .claude/hooks) und aus keinem Produkt-Modul (src/lib|data|components|pages|hooks),
 * dazu die zwei Hook-Tests (Pfad per spawn, kein Import) und gelöschte Alt-Tests
 * (plan-check.*, check-testtreue, ci-diff-klassieren, dispatch-klausel, fahrplanSlice).
 * Bewusst NICHT dabei: fedlex-*, rechtsprechung-*, check-segmente-* (Rechtsdaten;
 * sie importieren nur beiläufig `istRisikoPfad`).
 */
const PROZESS_TESTS =
  /^src\/tests\/(plan-|hooks-wache|hook-mcp-deckung|steuerflaeche|steuerwerkzeuge|ci-laeufe|ci-diff-klassieren|check-lizenzen|check-schlankheit|check-testtreue|dispatch-klausel|e2e-flake-waechter|fachaenderung|fahrplanSlice|gegenpruefung|merge-schutz-|playwright-install-skript|agy-status)/;

export function istProzessPfad(p: string): boolean {
  if (PLAN_DOKU.test(p) || PROZESS_TESTS.test(p)) return true;
  const ohneTest = p.replace(/\.test(\.tsx?)$/, '$1');
  return FLAECHE.some((m) => m.re.test(ohneTest));
}

/** Prozess-Commit: ≥ 1 Datei, und alle geänderten Pfade sind Prozess-Pfade. */
export function istProzessCommit(pfade: string[]): boolean {
  return pfade.length > 0 && pfade.every(istProzessPfad);
}

/** Stichtage: 1. und 15. jedes Monats von `start` bis einschliesslich `bis`. */
export function stichtage(start: string, bis: string): string[] {
  const tage: string[] = [];
  let [jahr, monat] = start.split('-').map(Number);
  for (let schutz = 0; schutz < 600; schutz += 1) {
    for (const tag of ['01', '15']) {
      const iso = `${jahr}-${String(monat).padStart(2, '0')}-${tag}`;
      if (iso < start) continue;
      if (iso > bis) return tage;
      tage.push(iso);
    }
    monat += 1;
    if (monat > 12) {
      monat = 1;
      jahr += 1;
    }
  }
  return tage;
}

export function csvZeile(z: Zeile): string {
  return SPALTEN.map((s) => String(z[s])).join(',');
}

/**
 * Anhängen ist IDEMPOTENT JE DATUM: ein zweiter Lauf am selben Tag ersetzt die
 * Zeile, statt eine zweite anzulegen. Ersetzen und nicht überspringen, weil
 * der zweite Lauf am selben Tag der frischere ist (typischer Fall: morgens
 * gemessen, abends nach zehn PRs noch einmal).
 */
export function mischeZeilen(vorhanden: Zeile[], neu: Zeile[]): Zeile[] {
  const nachDatum = new Map(vorhanden.map((z) => [String(z.datum), z] as const));
  for (const z of neu) nachDatum.set(String(z.datum), z);
  return [...nachDatum.values()].sort((a, b) => String(a.datum).localeCompare(String(b.datum)));
}

export function parseCsv(inhalt: string): Zeile[] {
  const zeilen = inhalt.split('\n').map((z) => z.trim()).filter(Boolean);
  if (!zeilen.length) return [];
  const kopf = zeilen[0].split(',');
  return zeilen.slice(1).map((z) => {
    const werte = z.split(',');
    const eintrag = {} as Zeile;
    kopf.forEach((s, i) => {
      (eintrag as Record<string, string>)[s] = werte[i] ?? '';
    });
    return eintrag;
  });
}

// ─────────────────────────── Beschaffung (git) ───────────────────────────

function git(args: string[]): string | null {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

/** Inhalt einer Datei im Commit `sha` — null, wenn es sie dort nicht gab. */
function zeige(sha: string, pfad: string): string | null {
  return git(['show', `${sha}:${pfad}`]);
}

function zaehleZeilen(inhalt: string | null): number {
  if (inhalt === null) return 0;
  const ohneSchluss = inhalt.endsWith('\n') ? inhalt.slice(0, -1) : inhalt;
  return ohneSchluss === '' ? 0 : ohneSchluss.split('\n').length;
}

function tagMinus(iso: string, tage: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) - tage * 86_400_000).toISOString().slice(0, 10);
}

/** Fenstergrenzen eines Stichtags: UTC-Mitternacht, nie die Uhrzeit des Laufs (git nähme sonst «jetzt»). */
export function fensterGrenzen(datum: string): { seit: string; bis: string } {
  return { seit: `${tagMinus(datum, FENSTER_TAGE)}T00:00:00Z`, bis: `${datum}T00:00:00Z` };
}

/** Pfadlisten aller Nicht-Merge-Commits im Fenster [datum−30 T, datum T). */
export function fensterCommits(sha: string, datum: string): string[][] {
  const { seit, bis } = fensterGrenzen(datum);
  // Je Commit eine Pfadliste: `\0<sha>\n\n<pfad>\n…` (--no-renames: Ziel-Pfad genügt).
  return (
    git(['-c', 'core.quotepath=false', 'log', sha, `--since=${seit}`, `--until=${bis}`, '--no-merges', '--no-renames', '--format=%x00%H', '--name-only']) ?? ''
  )
    .split('\0')
    .filter(Boolean)
    .map((block) => block.split('\n').slice(1).filter(Boolean));
}

/** Nur die zwei Commit-Spalten (für schon gemessene Stichtage, s. `--seed`). */
export function erhebeCommitSpalten(sha: string, datum: string): Pick<Zeile, 'commits_30d' | 'prozess_commits_30d'> {
  const commits = fensterCommits(sha, datum);
  return { commits_30d: commits.length, prozess_commits_30d: commits.filter(istProzessCommit).length };
}

/** Alle Kennzahlen eines Commits, ohne Checkout (s. Kopf). */
export function erhebe(sha: string, datum: string): Zeile {
  const baum = (git(['ls-tree', '-r', '--name-only', sha]) ?? '').split('\n').filter(Boolean);
  const summe = (pfade: string[]) => pfade.reduce((n, p) => n + zaehleZeilen(zeige(sha, p)), 0);

  const skills = baum.filter((p) => p.startsWith('.claude/skills/') && p.endsWith('.md'));
  const rules = baum.filter((p) => /^\.claude\/rules\/[^/]+\.md$/.test(p));
  const hooks = baum.filter((p) => /^\.claude\/hooks\/[^/]+\.py$/.test(p));

  let tore = 0;
  const pkgRoh = zeige(sha, 'package.json');
  if (pkgRoh !== null) {
    try {
      const skripte = (JSON.parse(pkgRoh) as { scripts?: Record<string, string> }).scripts ?? {};
      tore = Object.keys(skripte).filter((n) => n.startsWith('check:')).length;
    } catch {
      tore = 0;
    }
  }

  return {
    datum,
    claude_md_zeilen: zaehleZeilen(zeige(sha, 'CLAUDE.md')),
    skills_zeilen: summe(skills),
    rules_zeilen: summe(rules),
    tore,
    hooks: hooks.length,
    ...erhebeCommitSpalten(sha, datum),
    roadmap_bytes: Buffer.byteLength(zeige(sha, 'ROADMAP.md') ?? '', 'utf8'),
    steuerflaeche_bytes: flaecheImCommit(sha),
  };
}

export function anzeige(zeilen: Zeile[]): string[] {
  const breiten = SPALTEN.map((s) => Math.max(s.length, ...zeilen.map((z) => String(z[s]).length)));
  const zeile = (werte: string[]) => werte.map((w, i) => w.padStart(breiten[i])).join('  ');
  const aus = [zeile([...SPALTEN]), '─'.repeat(breiten.reduce((a, b) => a + b, 0) + 2 * (SPALTEN.length - 1))];
  for (const z of zeilen) aus.push(zeile(SPALTEN.map((s) => String(z[s]))));
  if (zeilen.length >= 2) {
    const erste = zeilen[0];
    const letzte = zeilen[zeilen.length - 1];
    const delta = (s: (typeof SPALTEN)[number]) => {
      const d = Number(letzte[s]) - Number(erste[s]);
      return `${s} ${d >= 0 ? '+' : ''}${d}`;
    };
    aus.push(
      '',
      `Trend ${erste.datum} → ${letzte.datum}: ` +
        [delta('claude_md_zeilen'), delta('skills_zeilen'), delta('rules_zeilen'), delta('tore'), delta('hooks'), delta('roadmap_bytes'), delta('steuerflaeche_bytes')].join(' · '),
      'Kein Urteil: Wachstum ist nicht per se Verfall, Schrumpfen nicht per se Gewinn.',
      '`prozess_commits_30d` folgt der Pfad-Regel (Kopf des Skripts), keine Bewertung.',
    );
  }
  return aus;
}

// ─────────────────────────────────── CLI ───────────────────────────────────

function main(): void {
  const argv = process.argv.slice(2);
  const heute = new Date().toISOString().slice(0, 10);

  const vorhanden = existsSync(CSV_DATEI) ? parseCsv(readFileSync(CSV_DATEI, 'utf8')) : [];
  const neu: Zeile[] = [];

  if (argv.includes('--seed')) {
    // Lokaler `main` ist in Worktrees oft veraltet: `origin/main` bevorzugen.
    const ref = git(['rev-parse', '--verify', '-q', 'origin/main']) ? 'origin/main' : 'main';
    const tage = [...new Set([...stichtage(SEED_START, heute), ...vorhanden.map((z) => String(z.datum))])].sort();
    for (const tag of tage) {
      const sha = git(['rev-list', '-1', `--before=${fensterGrenzen(tag).bis}`, ref])?.trim();
      if (!sha) {
        console.log(`  ${tag}: kein Commit davor auf ${ref} — übersprungen`);
        continue;
      }
      const alt = vorhanden.find((z) => String(z.datum) === tag);
      // Schon gemessene Stichtage: Live-Spalten bleiben, nur die Commit-Spalten neu.
      neu.push(alt ? { ...alt, ...erhebeCommitSpalten(sha, tag) } : erhebe(sha, tag));
    }
  }

  const head = git(['rev-parse', 'HEAD'])?.trim();
  if (!head) {
    console.error('git rev-parse HEAD fehlgeschlagen — ohne Commit keine Kennzahl.');
    process.exit(1);
  }
  neu.push(erhebe(head, heute));

  const alle = mischeZeilen(vorhanden, neu);
  for (const z of anzeige(alle)) console.log(z);

  if (argv.includes('--schreiben')) {
    writeFileSync(CSV_DATEI, `${[SPALTEN.join(','), ...alle.map(csvZeile)].join('\n')}\n`, 'utf8');
    console.log('');
    console.log(`Geschrieben: ${CSV_DATEI} (${alle.length} Zeilen, ${neu.length} in diesem Lauf erhoben).`);
  } else {
    console.log('');
    console.log('Nur angezeigt. Mit `-- --schreiben` in die CSV übernehmen.');
  }
}

// CLI-Teil nicht unter vitest ausführen (Muster wie kommentar-bilanz.ts;
// `process.argv[1]` zeigt unter vite-node auf das vite-node-Binary, nie hierher).
if (!process.env.VITEST) main();
