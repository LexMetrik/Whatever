// scripts/analyse/prozess-kennzahlen.ts — Zeitreihe der Prozess-Masse
// (ROADMAP-Schritt `QS-BEWAEHRUNG`, Teil A Ziff. 3).
//
// ANLASS. Dossier `bibliothek/betrieb/rekursive-selbstverbesserung-
// gegenueberstellung-2026-09-15.md` §6, Zeile «Gedächtnis wird Rauschen»:
// unsere Deckung sei «konzeptionell gut gedeckt, aber OHNE TREND GEMESSEN —
// 226 Zeilen CLAUDE.md, 290 Zeilen lehren, 9 Hooks, 88 Tore, ~48 % Prozess-
// Commits sind Momentwerte. Ob das Verbesserung ist oder Umlauf, ist offen.»
// §8 Ziff. 3 zieht daraus: Kennzahlen je Chronik-Überführung, mit Trend.
//
// AUFRUF:
//   npm run prozess:kennzahlen                   nur anzeigen (Stand HEAD)
//   npm run prozess:kennzahlen -- --schreiben    Zeile an die CSV anhängen
//   npm run prozess:kennzahlen -- --seed         Verlauf rückwirkend erzeugen
//
// KEIN TOR. Hier wird gezählt, nicht bewertet. Keine Zahl dieser Datei
// entscheidet je über Grün/Rot; eine steigende Zeilenzahl ist weder gut noch
// schlecht, solange niemand den Trend gegen etwas hält. Genau deshalb steht
// die Zeitreihe daneben und nicht die Momentaufnahme allein.
//
// ── DIE NEUN SPALTEN ─────────────────────────────────────────────────────
//   datum                 ISO-Tag der Messung (bei --seed: der Stichtag)
//   claude_md_zeilen      Zeilen der Projekt-CLAUDE.md
//   skills_zeilen         Summe aller `.claude/skills/**/*.md`
//   rules_zeilen          Summe aller `.claude/rules/*.md`
//   tore                  Anzahl `check:*`-Einträge in package.json
//   hooks                 Anzahl `.claude/hooks/*.py`
//   commits_30d           Commits in den 30 Tagen vor dem Stichtag
//   prozess_commits_30d   davon Prozess-Commits (HEURISTIK, s. unten)
//   roadmap_bytes         Bytes der ROADMAP.md
//
// ── HEURISTIK `prozess_commits_30d` — ausdrücklich gekennzeichnet ────────
// Ein «Prozess-Commit» ist nicht messbar, er ist geschätzt: gezählt wird ein
// Commit, dessen BETREFF `QS-`, `lehre`, `tor`, `hook` oder `check:` enthält.
// Die Zahl ist eine Beobachtungsgrösse, kein Urteil — sie darf nie ein Tor
// speisen und nie in einer Aussage stehen, die ohne sie falsch wäre (§2).
//
// ABWEICHUNG VOM AUFTRAG, offengelegt (§7). Der Auftrag schrieb
// `grep -iE 'QS-|lehre|tor|hook|check:'` vor, also SUBSTRING-Präsenz. `tor`
// als Substring trifft aber «refac__tor__», «His__tor__ie», «direc__tor__y»,
// «Au__tor__», «Genera__tor__». GEMESSEN am Bestand 15.9.2026 über alle 3094
// Commit-Betreffe: Substring 680 Treffer, Wortgrenze 552 — 128 Commits (19 %
// der Substring-Treffer) hängen allein an einem `tor` im Wortinneren,
// darunter systematisch jeder `refactor(`-Commit, also ausgerechnet die
// Klasse, die §6.3 vom Prozess-Bau trennt. Gezählt wird darum mit Wortgrenze
// um `tor` (CLAUDE.md §7: Identitäts-Treffer mit Wortgrenze, nie
// Substring-Präsenz). Die Substring-Variante bleibt als `--roh-heuristik`
// abrufbar, damit der Unterschied nachmessbar bleibt statt bloss behauptet.
//
// ── SEEDING OHNE CHECKOUT ────────────────────────────────────────────────
// `--seed` erzeugt Zeilen für den 1. und 15. jedes Monats seit 2026-07-01.
// Je Stichtag: `git rev-list -1 --before=<tag> main` liefert den letzten
// Commit davor, alle Kennzahlen kommen aus `git ls-tree` und `git show
// <sha>:<pfad>`. KEIN Checkout — ein `git checkout` im Worktree würde fremde
// Sessions und den laufenden Bau zerschiessen (§12).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

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
] as const;

export type Zeile = Record<(typeof SPALTEN)[number], string | number>;

/** Prozess-Commit mit Wortgrenze um `tor` (s. Kopf — Abweichung vom Auftrag). */
export const PROZESS_MUSTER = /qs-|lehre|(^|[^a-z])tor(e|en|s)?([^a-z]|$)|hook|check:/i;
/** Die wörtliche Auftrags-Variante, nur für den Vergleich `--roh-heuristik`. */
export const PROZESS_MUSTER_ROH = /QS-|lehre|tor|hook|check:/i;

export function istProzessCommit(betreff: string, roh = false): boolean {
  return (roh ? PROZESS_MUSTER_ROH : PROZESS_MUSTER).test(betreff);
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

/** Alle Kennzahlen eines Commits, ohne Checkout (s. Kopf). */
export function erhebe(sha: string, datum: string, roh = false): Zeile {
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

  const seit = tagMinus(datum, FENSTER_TAGE);
  const betreffe = (git(['log', sha, `--since=${seit}`, `--until=${datum}`, '--no-merges', '--format=%s']) ?? '')
    .split('\n')
    .filter(Boolean);

  return {
    datum,
    claude_md_zeilen: zaehleZeilen(zeige(sha, 'CLAUDE.md')),
    skills_zeilen: summe(skills),
    rules_zeilen: summe(rules),
    tore,
    hooks: hooks.length,
    commits_30d: betreffe.length,
    prozess_commits_30d: betreffe.filter((b) => istProzessCommit(b, roh)).length,
    roadmap_bytes: Buffer.byteLength(zeige(sha, 'ROADMAP.md') ?? '', 'utf8'),
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
        [delta('claude_md_zeilen'), delta('skills_zeilen'), delta('rules_zeilen'), delta('tore'), delta('hooks'), delta('roadmap_bytes')].join(' · '),
      'Kein Urteil: Wachstum ist nicht per se Verfall, Schrumpfen nicht per se Gewinn.',
      '`prozess_commits_30d` ist eine gekennzeichnete Heuristik (Kopf des Skripts), keine Messung.',
    );
  }
  return aus;
}

// ─────────────────────────────────── CLI ───────────────────────────────────

function main(): void {
  const argv = process.argv.slice(2);
  const roh = argv.includes('--roh-heuristik');
  const heute = new Date().toISOString().slice(0, 10);

  const vorhanden = existsSync(CSV_DATEI) ? parseCsv(readFileSync(CSV_DATEI, 'utf8')) : [];
  const neu: Zeile[] = [];

  if (argv.includes('--seed')) {
    for (const tag of stichtage(SEED_START, heute)) {
      const sha = git(['rev-list', '-1', `--before=${tag}`, 'main'])?.trim();
      if (!sha) {
        console.log(`  ${tag}: kein Commit davor auf main — übersprungen`);
        continue;
      }
      neu.push(erhebe(sha, tag, roh));
    }
  }

  const head = git(['rev-parse', 'HEAD'])?.trim();
  if (!head) {
    console.error('git rev-parse HEAD fehlgeschlagen — ohne Commit keine Kennzahl.');
    process.exit(1);
  }
  neu.push(erhebe(head, heute, roh));

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
  if (roh) console.log('HINWEIS: `--roh-heuristik` aktiv — Substring-Variante des Auftrags, s. Skript-Kopf.');
}

// CLI-Teil nicht unter vitest ausführen (Muster wie kommentar-bilanz.ts;
// `process.argv[1]` zeigt unter vite-node auf das vite-node-Binary, nie hierher).
if (!process.env.VITEST) main();
