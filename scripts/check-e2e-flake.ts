// scripts/check-e2e-flake.ts — Flacker-Wächter für die Playwright-Shards.
//
// PROBLEM (Beleg 8.9.2026, Lauf 34209371435, Shard 8/8): unter `retries: 2`
// zählt ein erst im zweiten Versuch grüner Test als `flaky`, der Prozess endet
// mit Exit 0, GitHub meldet grün — so verdeckt beim echten Defekt
// `a-ueberlauf-ohne-scroller`. Bis 5.10.2026 machte dieser Wächter Flackern
// ROT (Entscheid David 8.9.2026, #779; Ausnahmeliste `e2e/flake-ausnahmen.json`
// mit 30-Tage-Verfall, Melde-Modus über `e2e/flake-modus.json`).
//
// REGEL SEIT 5.10.2026 (Entscheid David, Chat: «Wackel-Regel dort lockern»,
// QS-CI-ZEIT E2; Messbasis 300 Queue-Läufe: 7 von 10 Browser-Röten in der
// Queue waren Flacker-Wächter-Rot, 0 echte Zusammenstösse):
//   · Retry-Grün macht den Shard NICHT mehr rot. Es wird SICHTBAR gemeldet:
//     `::warning::FLACKERT …` im Log und in der Step-Summary, dazu eine
//     Fund-Datei (`E2E_FLAKE_FUNDE`), aus der ci.yml je Spec einen
//     Reparatur-Zettel (GitHub-Issue, Label `flake`) anlegt oder kommentiert.
//     Der Zettel ersetzt den Verfall der Ausnahmeliste als «Erinnerung» —
//     Ausnahmeliste und Modus-Datei sind darum zurückgebaut (§17-Gegengewicht:
//     ohne Rot hätten sie nichts mehr zu dulden).
//   · HART ROT bleibt: ein Test, der in ALLEN Versuchen rot ist
//     (`stats.unexpected > 0`) — zusätzlich zum ohnehin roten Playwright-
//     Schritt, damit der Wächter allein schon nie ein Dauer-Rot durchwinkt.
//   · FEHLERSEITE (§6.7 lit. b) — jede Unklarheit ist rot: Report fehlt/
//     unlesbar · ohne `stats.flaky`/`stats.unexpected` · `stats.flaky > 0`
//     ohne auffindbaren `flaky`-Test. Nicht gelaufene Specs fängt der
//     Union-Wächter `check:e2e-shards` (Gruppen == `playwright --list`).
// Format-Beleg: Playwright 1.60.0, `JSONReport.stats.{flaky,unexpected}` und
// `JSONReportTest.status … | 'flaky' | 'unexpected'`. Der JSON-Reporter ist
// nur unter `CI` verdrahtet — darum steht das Tor begründet auf
// `ALLOWLIST_NUR_CI` (scripts/check-tor-paritaet.ts).
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

/** Flackernde Spec: Summe der Wiederholungen und Testtitel. */
export type FlackerFund = { spec: string; retries: number; titel: string[] };

/** `meldungen` inkl. GitHub-Annotationen (`::error`/`::warning`), Schlusszeile zuletzt. */
export type Verdikt = {
  rot: boolean;
  funde: FlackerFund[];
  /** Titel der in allen Versuchen roten Tests (je `spec › titel`). */
  dauerRot: string[];
  meldungen: string[];
  zusammenfassung: string;
};

/** `./e2e/x.e2e.ts`, `e2e/x.e2e.ts`, `x.e2e.ts` ⇒ `x.e2e.ts`. */
export function specNormalisieren(pfad: string): string {
  return pfad.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^e2e\//, '');
}

type RohTest = { status?: unknown; results?: unknown };
type RohSpec = { file?: unknown; title?: unknown; tests?: unknown };
type RohSuite = { file?: unknown; specs?: unknown; suites?: unknown };
type Sammlung = { flaky: Map<string, { retries: number; titel: string[] }>; dauerRot: string[] };

/** Suiten-Baum abgehen: `flaky`-Tests je Spec-Datei und `unexpected`-Tests sammeln. */
function sammeln(suites: unknown, aus: Sammlung): void {
  if (!Array.isArray(suites)) return;
  for (const s of suites as RohSuite[]) {
    if (typeof s !== 'object' || s === null) continue;
    for (const spec of (Array.isArray(s.specs) ? s.specs : []) as RohSpec[]) {
      if (typeof spec !== 'object' || spec === null) continue;
      const datei = specNormalisieren(
        typeof spec.file === 'string' ? spec.file : typeof s.file === 'string' ? s.file : '(unbekannt)',
      );
      const titel = typeof spec.title === 'string' ? spec.title : '(ohne Titel)';
      for (const t of (Array.isArray(spec.tests) ? spec.tests : []) as RohTest[]) {
        if (typeof t !== 'object' || t === null) continue;
        if (t.status === 'unexpected') {
          const eintrag = `${datei} › ${titel}`;
          if (!aus.dauerRot.includes(eintrag)) aus.dauerRot.push(eintrag);
          continue;
        }
        if (t.status !== 'flaky') continue;
        const eintrag = aus.flaky.get(datei) ?? { retries: 0, titel: [] };
        eintrag.retries += Math.max(0, (Array.isArray(t.results) ? t.results.length : 1) - 1);
        if (!eintrag.titel.includes(titel)) eintrag.titel.push(titel);
        aus.flaky.set(datei, eintrag);
      }
    }
    sammeln(s.suites, aus);
  }
}

type BerichtErgebnis =
  | { fehler: string }
  | { fehler: null; stats: { flaky: number; unexpected: number }; suites: unknown };

/** Report lesen: fehlend, unlesbar oder ohne `stats.flaky`/`stats.unexpected` ist rot. */
function berichtLesen(roh: string | null, pfad: string): BerichtErgebnis {
  if (roh === null) return { fehler: `Flacker-Wächter: Playwright-Report ${pfad} fehlt — ein Lauf ohne Report ist nicht bewertbar (nie stilles Grün).` };
  let report: unknown;
  try {
    report = JSON.parse(roh);
  } catch (e) {
    return { fehler: `Flacker-Wächter: ${pfad} ist kein lesbares JSON — ${(e as Error).message}` };
  }
  const stats = (report as { stats?: unknown })?.stats as { flaky?: unknown; unexpected?: unknown } | undefined;
  if (typeof stats !== 'object' || stats === null || typeof stats.flaky !== 'number' || typeof stats.unexpected !== 'number') {
    return { fehler: `Flacker-Wächter: ${pfad} trägt keine Zähler 'stats.flaky'/'stats.unexpected' — Report-Format geändert? Bis zur Klärung rot.` };
  }
  return {
    fehler: null,
    stats: { flaky: stats.flaky, unexpected: stats.unexpected },
    suites: (report as { suites?: unknown }).suites,
  };
}

/** Reine Verdikt-Funktion (§2). `null` als Rohtext heisst «Report fehlt» und ist rot. */
export function flackerVerdikt(eingabe: { reportRoh: string | null; reportPfad?: string }): Verdikt {
  const reportPfad = eingabe.reportPfad ?? 'playwright-report.json';
  const gelesen = berichtLesen(eingabe.reportRoh, reportPfad);
  if (gelesen.fehler !== null) return abschluss(true, [], [], [`::error::${gelesen.fehler}`]);

  const gesammelt: Sammlung = { flaky: new Map(), dauerRot: [] };
  sammeln(gelesen.suites, gesammelt);
  const meldungen: string[] = [];
  let rot = false;

  if (gelesen.stats.unexpected > 0) {
    rot = true;
    const liste = gesammelt.dauerRot.length ? gesammelt.dauerRot.join(' · ') : '(keinem Test zuordenbar)';
    meldungen.push(
      `::error::Flacker-Wächter: ${gelesen.stats.unexpected} Test(s) in ALLEN Versuchen rot — das ist kein Flackern, sondern ein Defekt: ${liste}`,
    );
  }
  if (gelesen.stats.flaky > 0 && gesammelt.flaky.size === 0) {
    rot = true;
    meldungen.push(
      `::error::Flacker-Wächter: ${reportPfad} meldet stats.flaky=${gelesen.stats.flaky}, aber kein Test trägt den Status 'flaky' — die Zuordnung zur Spec-Datei schlägt fehl. Rot, damit der Fund nicht verloren geht.`,
    );
  }

  const funde: FlackerFund[] = [];
  for (const [spec, { retries, titel }] of [...gesammelt.flaky].sort((a, b) => a[0].localeCompare(b[0]))) {
    funde.push({ spec, retries, titel });
    meldungen.push(
      `::warning file=e2e/${spec}::FLACKERT: ${spec} — ${retries}× Retry (${titel.join(' · ')}) — nur im Wiederholungsversuch grün; Reparatur-Zettel (Issue, Label flake) folgt aus der Warteschlange.`,
    );
  }
  return abschluss(rot, funde, gesammelt.dauerRot, meldungen);
}

function abschluss(rot: boolean, funde: FlackerFund[], dauerRot: string[], meldungen: string[]): Verdikt {
  const zusammenfassung = rot
    ? `Flacker-Wächter: ROT (Dauer-Rot, Report- oder Zuordnungsfehler, s. oben) · ${funde.length} flackern`
    : `Flacker-Wächter: grün · ${funde.length} flackern (Warnung, kein Rot)`;
  return { rot, funde, dauerRot, meldungen: [...meldungen, zusammenfassung], zusammenfassung };
}

/** Markdown für `$GITHUB_STEP_SUMMARY` — nur wenn es etwas zu melden gibt. */
export function stepSummary(v: Verdikt): string {
  if (!v.rot && v.funde.length === 0) return '';
  const zeilen = [`### ${v.zusammenfassung}`, ''];
  for (const f of v.funde) zeilen.push(`- FLACKERT \`e2e/${f.spec}\` — ${f.retries}× Retry (${f.titel.join(' · ')})`);
  for (const d of v.dauerRot) zeilen.push(`- DAUER-ROT \`${d}\``);
  return `${zeilen.join('\n')}\n`;
}

// Entry-Erkennung über `VITEST`, nicht über `process.argv[1]`: unter vite-node
// zeigt das aufs Binary (gemessen 8.9.2026); der Test darf keinen Exit auslösen.
if (!process.env.VITEST) {
  const lies = (p: string): string | null => {
    try {
      return readFileSync(p, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  };
  const reportPfad =
    process.argv.slice(2).filter((a) => !a.startsWith('-'))[0] ?? process.env.E2E_FLAKE_REPORT ?? 'playwright-report.json';
  const verdikt = flackerVerdikt({ reportRoh: lies(reportPfad), reportPfad });
  for (const z of verdikt.meldungen) console.log(z);
  const summary = stepSummary(verdikt);
  if (summary && process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  // Fund-Datei nur bei Funden: ci.yml lädt sie als Artefakt hoch (`if-no-files-found: ignore`)
  // und legt daraus je Spec den Reparatur-Zettel an.
  if (verdikt.funde.length && process.env.E2E_FLAKE_FUNDE) {
    writeFileSync(process.env.E2E_FLAKE_FUNDE, `${JSON.stringify({ funde: verdikt.funde }, null, 2)}\n`);
  }
  process.exit(verdikt.rot ? 1 : 0);
}
