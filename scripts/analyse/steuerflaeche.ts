// scripts/analyse/steuerflaeche.ts — Sperrklinke über die Steuerungs-Fläche.
//
// ANLASS (Messung + Entscheid David 20.9.2026). Die Steuerung wuchs schneller
// als das Produkt: `messwerte/prozess-kennzahlen.csv` zeigt 1.7.→20.9.2026
// Skills 1492→3897 Zeilen, Tore 25→90, Commits/30 T −71 %. Bestehende
// Byte-Deckel gab es, aber nur auf ZWEI Globs (`FLAECHEN_BUDGET` in
// `.claude/hooks/struktur-rotieren.py`: `.claude/hooks/*.py`,
// `scripts/check-*.ts`) — und genau daran wurde vorbeigebaut: am 19./20.9.2026
// wich neue Steuerungs-Logik zweimal in Nachbar-Ordner aus. Ein Deckel auf
// einzelnen Globs verschiebt Zuwachs, er bremst ihn nicht.
//
// WAS DIESES TOR TUT — und was ausdrücklich nicht.
//   · Es summiert die BYTES der git-getrackten Steuerungs-Dateien und hält sie
//     gegen `messwerte/steuerflaeche.json`. Über dem Deckel ⇒ ROT, mit den zehn
//     grössten Zuwächsen gegenüber `origin/main`.
//   · SPERRKLINKE: die Grenze darf sinken, nie steigen. Eine Anhebung gegenüber
//     `origin/main` ist ROT, ausser `anhebungen` trägt einen NEUEN Eintrag mit
//     nicht-leerem `entscheid`. Das ist bewusst Reibung, keine Kryptografie —
//     wer die Zeile schreibt, kann sie auch fälschen; er kann es nur nicht mehr
//     versehentlich und nicht mehr unbemerkt (§8).
//   · Es bewertet NICHTS inhaltlich, es schlägt nichts vor und es misst nicht je
//     Session. Kein Bericht, keine KI-Deutung — der frühere Weg (`retro:17`)
//     konnte nur hinzufügen und wird gerade abgebaut.
//
// RECHTSSCHUTZ IST AUSGENOMMEN (CLAUDE.md §1, Weisung David 20.9.2026).
// Prüfungen, deren Gegenstand Rechtslogik oder Rechtsdaten ist, zählen NICHT zur
// Fläche — sonst erzeugte der Deckel Druck genau dort, wo Prüftiefe nie gedrückt
// werden darf. Die Liste steht unten bei RECHTSSCHUTZ, jede Zeile mit Grund; im
// Zweifel wird ausgenommen, nicht mitgezählt.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

export const GRENZ_DATEI = 'messwerte/steuerflaeche.json';
/** Startwert und `--nachziehen`-Ziel: Ist + 5 %, auf volle KB aufgerundet. */
export const LUFT_FAKTOR = 1.05;

export type Anhebung = {
  datum: string; von: number; auf: number; grund: string; entscheid: string;
};
export type Grenze = { grenze_bytes: number; gesetzt: string; anhebungen: Anhebung[] };
export type Datei = { pfad: string; bytes: number };

// ── DIE FLÄCHE ──────────────────────────────────────────────────────────────
// Alles, was den BAU steuert statt das Produkt zu sein. Die ersten zehn Muster
// sind der Auftragsumfang; die beiden letzten sind begründete ERWEITERUNGEN
// (§7 — abweichend umsetzen und offenlegen), weil ohne sie die Lücke offen
// bliebe, an der die Umgehung vom 19./20.9.2026 hing: gedeckelt war die Hülle
// (`scripts/check-*.ts`), nicht der Helfer daneben.
export const FLAECHE: { re: RegExp; grund: string }[] = [
  { re: /^\.claude\/skills\//, grund: 'Skills — die Prozeduren, die bei jeder Tätigkeit laden' },
  { re: /^\.claude\/rules\//, grund: 'pfad-gescopte Regeln' },
  { re: /^\.claude\/agents\//, grund: 'Agenten-Definitionen (Dispatch-§0)' },
  { re: /^\.claude\/hooks\//, grund: 'Hooks — bisher einziger gedeckelter Glob' },
  { re: /^CLAUDE\.md$/, grund: 'Invarianten, lädt bei jedem Dispatch' },
  { re: /^AGENTS\.md$/, grund: 'Fremdagenten-Anweisung' },
  { re: /^docs\/token-oekonomie\//, grund: 'Dispatch-Vorlagen und Token-Reglement' },
  { re: /^\.github\/workflows\//, grund: 'Prüfstrasse — Tor-Zuwachs sitzt hier' },
  { re: /^scripts\/check-[^/]*\.ts$/, grund: 'Tor-Hüllen — bisher zweiter gedeckelter Glob' },
  { re: /^scripts\/plan\//, grund: 'Plan-Werkzeuge (plan:next, check:plan, Lagebild)' },
  // ERWEITERUNG 1: Prozess-Messung ist Steuerung. Der Ordner enthält
  // ausschliesslich Mess- und Fremdagenten-Werkzeuge (keine Rechtslogik) und ist
  // der nächstliegende Ausweich-Ordner für neue Steuerungs-Logik.
  { re: /^scripts\/analyse\//, grund: 'Prozess-Messung (diese Datei eingeschlossen)' },
  // ERWEITERUNG 2: die Helfer, in die Tor-Hüllen ihre Logik auslagern. Ohne sie
  // wäre der `scripts/check-*.ts`-Deckel per Datei-Umzug jederzeit umgehbar —
  // genau die Bewegung, die `tor-paritaet-sonden.ts` (aus check-tor-paritaet.ts
  // herausgelöst, «Steuerungs-Flächendeckel») dokumentiert. Bewusst eine
  // ABSCHLIESSENDE Liste statt `scripts/*.ts`: dort liegt überwiegend
  // Produkt-/Datenwerkzeug, das nicht zur Steuerung zählt.
  {
    re: /^scripts\/(dispatch|dispatch-cli|dispatch-agents|dispatch-agents-cli|tor-paritaet-sonden|testtreue-kern|fahrplan-slice|fahrplanSlicerKern|run-parallel|repo-map)\.ts$|^scripts\/(gate|ci-log-diaet)\.sh$/,
    grund: 'Steuerungs-Helfer in scripts/ (Dispatch · Tor-Sonden · Gate-Runner)',
  },
];

// ── AUSNAHME RECHTSSCHUTZ ───────────────────────────────────────────────────
// Diese Dateien liegen in der Fläche, zählen aber NICHT mit. Massstab: ihr
// GEGENSTAND ist Rechtslogik oder Rechtsdaten (Normtext · Fedlex · Zitate ·
// Verweise · Entscheide · Besetzung · Tarif · Verfall · Sweep · Golden ·
// Datenhaltung · Gegenprüfung · Merge-Schutz). Im Zweifel ausgenommen.
// Nicht aufgeführt sind Prüfungen, die ohnehin ausserhalb der Muster liegen
// (u. a. `scripts/gegenpruefung/**`, `scripts/gegenpruefung-ok.ts`,
// `scripts/logik-sweep.ts`, `scripts/golden-outputs.ts`, `scripts/normtext/**`,
// `scripts/fedlex-*`, `scripts/rechtsprechung/**`, `scripts/tarif/**`,
// `scripts/datenhaltung/**`, `scripts/materialien/**`) — sie sind gar nicht
// erst Fläche.
export const RECHTSSCHUTZ: Record<string, string> = {
  'scripts/check-gegenpruefung.ts': 'Gegenprüfung auf Risikopfaden',
  'scripts/check-merge-schutz.ts': 'Merge-Sperre bis Gegenprüfungs-Verdikt',
  'scripts/check-golden-normtext.ts': 'Golden-Basis des Normtext-Korpus',
  'scripts/check-ui-normzitate.ts': 'UI-Normzitate gegen den Korpus',
  'scripts/check-verweis-inventar.ts': 'Verweis-Auflösung im Normtext',
  'scripts/check-raw-store.ts': 'Korpus-Rohdaten (Datenhaltung, Pins)',
  'scripts/check-lik-frische.ts': 'LIK-Reihe (BFS) — Rechtsdaten der Teuerung',
  // Paar check-ci-laeufe.ts ↔ waechter.yml: sein Gegenstand ist zwar die
  // Automatik, sein Befund aber die FRISCHE der Normen-/Korpus-Läufe
  // (normen-monitor, turso-sync; Vorfall 13.–20.7.2026, vier Wochen tote
  // Normen-Überwachung). Byte-Druck darauf träfe die Rechtsdaten-Kette — im
  // Zweifel ausgenommen.
  'scripts/check-ci-laeufe.ts': 'Wächter-Motor über die Normen-/Korpus-Läufe',
  '.github/workflows/waechter.yml': 'Wächter über die Normen-/Korpus-Läufe',
  '.github/workflows/fedlex-frische.yml': 'Fedlex-Frische',
  '.github/workflows/normen-monitor.yml': 'Normen-/Verfall-Überwachung',
  '.github/workflows/korpus-raw-release.yml': 'Korpus-Rohdaten-Release',
  '.github/workflows/turso-sync.yml': 'Datenhaltung (DB-Sync)',
};

/** Tests zählen nie — §6.7 verlangt sie; ein Deckel darf sie nicht bestrafen. */
const TEST_RE = /\.test\.tsx?$/;

export function istFlaeche(pfad: string): boolean {
  if (TEST_RE.test(pfad)) return false;
  if (pfad in RECHTSSCHUTZ) return false;
  return FLAECHE.some((m) => m.re.test(pfad));
}

export function summeBytes(dateien: Datei[]): number {
  return dateien.reduce((s, d) => s + d.bytes, 0);
}

/** Ist + 5 %, auf volle KB aufgerundet. */
export function zielGrenze(ist: number): number {
  return Math.ceil((ist * LUFT_FAKTOR) / 1024) * 1024;
}

export const kb = (b: number): string => (b / 1024).toFixed(1);

// ── SPERRKLINKE ─────────────────────────────────────────────────────────────
/**
 * Prüft die Anhebung gegen den Basis-Stand. Rückgabe `null` = in Ordnung,
 * sonst der Fehlertext. `basis === null` heisst: kein Vergleichsstand — dann
 * ist die Klinke NICHT geprüft, und das sagt der Aufrufer ausdrücklich
 * (nie still grün, §6.7 lit. b).
 */
export function klinkeUrteil(jetzt: Grenze, basis: Grenze | null): string | null {
  if (!basis) return null;
  if (jetzt.grenze_bytes <= basis.grenze_bytes) return null;
  const alte = new Set(basis.anhebungen.map((a) => `${a.datum}|${a.von}|${a.auf}`));
  const neu = jetzt.anhebungen.filter((a) => !alte.has(`${a.datum}|${a.von}|${a.auf}`));
  const gueltig = neu.find((a) => a.entscheid?.trim() && a.auf === jetzt.grenze_bytes);
  if (gueltig) return null;
  return (
    `Grenze angehoben: ${kb(basis.grenze_bytes)} KB (origin/main) → ${kb(jetzt.grenze_bytes)} KB — ` +
    `ohne neuen \`anhebungen\`-Eintrag mit nicht-leerem \`entscheid\` und \`auf\`=${jetzt.grenze_bytes}.` +
    (neu.length ? `\n  (${neu.length} neue(r) Eintrag/Einträge gefunden, aber keiner passt.)` : '')
  );
}

export const HEIL_SATZ =
  'erst streichen, dann hinzufügen — oder Anhebung mit datiertem David-Entscheid in `anhebungen` eintragen';

/** Reines Verdikt (alles injiziert) — die Testbarkeit des Tors hängt daran. */
export function urteil(e: {
  ist: number;
  grenze: Grenze;
  basis: Grenze | null;
  basisHinweis?: string;
  zuwaechse: Datei[];
}): { ok: boolean; zeilen: string[] } {
  const z: string[] = [];
  const klinke = klinkeUrteil(e.grenze, e.basis);
  const ueber = e.ist > e.grenze.grenze_bytes;
  if (!ueber && !klinke) {
    z.push(
      `check:steuerflaeche OK — Steuerung ${kb(e.ist)} KB von ${kb(e.grenze.grenze_bytes)} KB ` +
      `(Luft ${kb(e.grenze.grenze_bytes - e.ist)} KB, Grenze gesetzt ${e.grenze.gesetzt}, ` +
      `${e.grenze.anhebungen.length} Anhebung(en)).`);
    if (e.basisHinweis) z.push(`  HINWEIS: ${e.basisHinweis}`);
    return { ok: true, zeilen: z };
  }
  z.push('check:steuerflaeche ROT:');
  if (ueber) {
    z.push(
      `  Steuerungs-Fläche ${kb(e.ist)} KB > Grenze ${kb(e.grenze.grenze_bytes)} KB ` +
      `(+${kb(e.ist - e.grenze.grenze_bytes)} KB).`);
    const top = [...e.zuwaechse].sort((a, b) => b.bytes - a.bytes).slice(0, 10);
    if (top.length) {
      z.push('  Grösste Zuwächse gegenüber origin/main:');
      for (const d of top) z.push(`    +${kb(d.bytes).padStart(7)} KB  ${d.pfad}`);
    } else if (e.basisHinweis) {
      z.push(`  (keine Zuwachs-Liste: ${e.basisHinweis})`);
    }
  }
  if (klinke) z.push(`  SPERRKLINKE: ${klinke}`);
  z.push(`  → ${HEIL_SATZ}.`);
  if (e.basisHinweis && !ueber) z.push(`  HINWEIS: ${e.basisHinweis}`);
  return { ok: false, zeilen: z };
}

// ── IO (nicht im reinen Teil) ───────────────────────────────────────────────
function git(...args: string[]): string {
  // stderr gepiped statt geerbt: `git show origin/main:<neue Datei>` meldet bei
  // der ERSTANLAGE ein erwartetes `fatal: … exists on disk, but not in …`. Das
  // ist hier ein gültiger Zustand (Erstanlage erlaubt) und darf die Tor-Ausgabe
  // nicht mit einer Zeile verschmutzen, die nach Fehler aussieht (§8).
  return execFileSync('git', args, {
    encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * Alle Flächen-Dateien mit ihrer heutigen Byte-Grösse.
 *
 * ABWEICHUNG VOM AUFTRAG, offengelegt (§7): nicht nur `git ls-files`, sondern
 * zusätzlich `--others --exclude-standard` — also auch NEUE, noch nicht
 * committete Dateien (gitignorierte bleiben draussen). Grund: sonst zählte die
 * Datei, die man gerade schreibt, erst NACH dem Commit — das Tor wäre lokal
 * grün und erst in CI rot, genau die Reihenfolge, die §6.1 vermeiden will. In
 * CI gibt es ohnehin nur Getracktes, der Wert ist dort identisch.
 */
export function flaechenDateien(): Datei[] {
  const dateien: Datei[] = [];
  const gesehen = new Set<string>();
  for (const pfad of git('ls-files', '--cached', '--others', '--exclude-standard').split('\n')) {
    if (!pfad || gesehen.has(pfad) || !istFlaeche(pfad)) continue;
    gesehen.add(pfad);
    try {
      dateien.push({ pfad, bytes: statSync(pfad).size });
    } catch {
      // getrackt, aber im Arbeitsbaum entfernt — zählt als 0 Bytes.
    }
  }
  return dateien.sort((a, b) => a.pfad.localeCompare(b.pfad));
}

/**
 * Erster auflösbarer Basis-Ref, sonst `null` (dann nur Summen-Prüfung).
 * `--basis <ref>` überschreibt ihn ausdrücklich — nur für Diagnose und den
 * §6.7-Rot-Beweis der Klinke; die Tor-Zeile in package.json übergibt ihn nicht,
 * eine Umgehung wäre also ein sichtbarer Diff, kein stiller Schalter.
 */
export function basisRef(wunsch?: string | null): string | null {
  for (const ref of wunsch ? [wunsch] : ['origin/main', 'refs/remotes/origin/main', 'main']) {
    try {
      git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
      return ref;
    } catch { /* nächster Kandidat */ }
  }
  return null;
}

function basisGrenze(ref: string): Grenze | null {
  try {
    return JSON.parse(git('show', `${ref}:${GRENZ_DATEI}`)) as Grenze;
  } catch {
    return null; // Erstanlage: die Datei gibt es auf main noch nicht.
  }
}

/** Byte-Zuwachs je Flächen-Datei gegenüber `ref` (nur positive Differenzen). */
function zuwaechse(ref: string, heute: Datei[]): Datei[] {
  const alt = new Map<string, number>();
  for (const zeile of git('ls-tree', '-r', '-l', ref).split('\n')) {
    const m = /^\S+\s+blob\s+\S+\s+(\d+)\t(.+)$/.exec(zeile);
    if (m && istFlaeche(m[2])) alt.set(m[2], Number(m[1]));
  }
  return heute
    .map((d) => ({ pfad: d.pfad, bytes: d.bytes - (alt.get(d.pfad) ?? 0) }))
    .filter((d) => d.bytes > 0);
}

export function leseGrenze(): Grenze {
  return JSON.parse(readFileSync(GRENZ_DATEI, 'utf8')) as Grenze;
}

/** Ist-Summe für Anzeige-Zwecke (plan:next). Wirft, wenn git fehlt. */
export function istSumme(): number {
  return summeBytes(flaechenDateien());
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (!process.env.VITEST) {
  const argv = process.argv.slice(2);
  const dateienJetzt = flaechenDateien();
  const ist = summeBytes(dateienJetzt);
  const grenze = leseGrenze();

  if (argv.includes('--stand')) {
    console.log(`Steuerungs-Fläche: ${kb(ist)} KB · Grenze ${kb(grenze.grenze_bytes)} KB · ` +
      `Luft ${kb(grenze.grenze_bytes - ist)} KB · ${dateienJetzt.length} Dateien`);
    console.log(`Mögliche Absenkung per --nachziehen: ${kb(zielGrenze(ist))} KB`);
    for (const d of [...dateienJetzt].sort((a, b) => b.bytes - a.bytes).slice(0, 10)) {
      console.log(`  ${kb(d.bytes).padStart(7)} KB  ${d.pfad}`);
    }
  } else if (argv.includes('--nachziehen')) {
    const ziel = zielGrenze(ist);
    if (ziel >= grenze.grenze_bytes) {
      console.log(`Keine Absenkung: Ist+5 % = ${kb(ziel)} KB ≥ Grenze ${kb(grenze.grenze_bytes)} KB. ` +
        'Die Klinke hebt nie an.');
    } else {
      writeFileSync(GRENZ_DATEI, `${JSON.stringify({ ...grenze, grenze_bytes: ziel }, null, 2)}\n`);
      console.log(`Klinke nachgezogen: ${kb(grenze.grenze_bytes)} → ${kb(ziel)} KB ` +
        `(Ist ${kb(ist)} KB). ${GRENZ_DATEI} geschrieben.`);
    }
  } else {
    const i = argv.indexOf('--basis');
    const wunsch = i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
    const ref = basisRef(wunsch);
    if (wunsch) console.log(`(Basis ausdrücklich gesetzt: ${wunsch} — Diagnose-/Rot-Beweis-Pfad.)`);
    const e = ref
      ? { ist, grenze, basis: basisGrenze(ref), zuwaechse: zuwaechse(ref, dateienJetzt) }
      : {
          ist, grenze, basis: null, zuwaechse: [] as Datei[],
          basisHinweis: 'kein Vergleichsstand (origin/main nicht auflösbar — flacher Klon?) — ' +
            'die SPERRKLINKE ist in diesem Lauf NICHT geprüft, nur die Summe.',
        };
    const { ok, zeilen } = urteil(e);
    for (const z of zeilen) console.log(z);
    if (!ok) process.exit(1);
  }
}
