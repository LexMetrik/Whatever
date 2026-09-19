// scripts/ci/diff-klassieren.ts — Klasse `code-fern` für den `diff`-Job in
// ci.yml (QS-PLAN-EINFACH, 14.8.2026, Punkt 3).
//
// KONTEXT: `.github/workflows/ci.yml` klassiert jeden Diff als `doku` (reine
// .md-Änderung) oder `code` (alles andere) — die 8 Playwright-Browser-Shards
// laufen nur bei `art == 'code'` und sind gemessen 78 % der CI-Zeit. Diese
// Datei ergänzt eine DRITTE Klasse `code-fern`: Flächen, die zwar keine reine
// .md-Änderung sind, aber die AUSGELIEFERTE APP nachweislich nicht berühren —
// Plan-Werkzeuge, Cowork-Skripte, Agenten-Konfiguration, Doku-Verzeichnisse.
// `code-fern` fährt Bau + alle Node-Tore VOLL (nur die 8 Browser-Shards werden
// übersprungen, gleiches Skip-Muster wie bei `doku` — Required-Check-Semantik
// bleibt identisch). `Merge-Schutz` läuft für JEDE Klasse unverändert echt.
//
// WARUM EINE EIGENE, TESTBARE DATEI statt mehr Bash: die bestehende Doku-
// Klassierung in ci.yml unterscheidet sich bewusst zwischen `push` (leerer
// Diff ⇒ `code`, Sicherheitsseite) und `pull_request` (leerer Diff ⇒ `doku`,
// Kommentar K3) — dieses asymmetrische Verhalten bleibt in ci.yml unverändert
// (§6.7-Fehlerseite: jede Unsicherheit fällt auf `code`, nicht auf `code-fern`
// oder `doku`). Diese Datei entscheidet NUR die Frage "ist eine gegebene,
// bereits nicht-leere Dateiliste app-fern?" — eine reine Funktion ohne die
// Sonderfälle drumherum, darum ohne Verhaltensänderung für `doku`/`code`
// herausziehbar und mit den vier Testfällen des Auftrags belegt.
//
// FEHLERSEITE (§6.7, wie im Rest der Datei): jede Datei, die KEINEM der
// Muster unten entspricht, kippt die gesamte Klassierung auf `code` — auch
// wenn alle anderen Dateien app-fern wären. Eine einzelne App-Datei genügt.

/** Flächen, die die ausgelieferte App nachweislich nicht berühren (Anlass
 * QS-PLAN-EINFACH 14.8.2026, Punkt 3 — 78 %-Messwert der Browser-Shards).
 * KONSERVATIV: jede andere Datei (auch package.json, e2e/**, scripts/** sonst)
 * bleibt `code`. */
export const CODE_FERNE_MUSTER: readonly RegExp[] = [
  /\.md$/,
  /^scripts\/plan\//,
  /^scripts\/cowork\//,
  /^\.claude\//,
  /^docs\//,
  /^bibliothek\//,
  /^messwerte\//,
  /^archiv\//,
];

/** Tragen die Endung `.md`, sind aber generierte Werkzeug-Konfiguration statt
 * Doku — eine Änderung MUSS den Tore-Job (u. a. `check:dispatch-klausel`)
 * durchlaufen. Anlass PR #619 (2.9.2026): `.claude/agents/lex-bau.md` wurde
 * von Hand geändert, der reine-.md-Kurzschluss (unten) stufte den Diff als
 * `doku` ein, der Tore-Job lief nicht — die Drift wurde erst auf fremden PRs
 * rot (§6.7: ein Tor, das für genau den verursachenden Diff nicht läuft, kann
 * nicht scheitern). Diese Dateien fallen dadurch NICHT aus `code-fern` heraus
 * (sie bleiben über `CODE_FERNE_MUSTER` — `.claude/`/`docs/` — code-fern,
 * Bau + alle Node-Tore laufen weiter voll), nur der `doku`-Kurzschluss greift
 * für sie nicht mehr. */
export const WERKZEUG_TROTZ_MD_MUSTER: readonly RegExp[] = [
  /^\.claude\/agents\//,
  /^docs\/token-oekonomie\/dispatch-template\.md$/,
];

export type DiffArt = 'code-fern' | 'code';

/**
 * Klassiert eine NICHT-LEERE Liste geänderter Dateien. Enthält sie mindestens
 * eine Datei ausserhalb der code-fernen Muster, ist das Ergebnis `code` — sonst
 * `code-fern`. (Der reine `doku`-Fall — ALLE Dateien `.md` — wird in ci.yml
 * weiterhin VOR dem Aufruf dieser Funktion behandelt, siehe Kommentar oben;
 * diese Funktion liefert für eine solche Liste ebenfalls `code-fern`, weil
 * `.md` selbst eines der code-fernen Muster ist — sie wird für den reinen
 * Doku-Fall nur schlicht nicht gebraucht.)
 */
export function klassifiziereDateien(dateien: readonly string[]): DiffArt {
  const appNah = dateien.filter((d) => !CODE_FERNE_MUSTER.some((re) => re.test(d)));
  return appNah.length === 0 ? 'code-fern' : 'code';
}

/**
 * Bildet die VOLLE Drei-Klassen-Entscheidung nach (`doku`/`code-fern`/`code`)
 * für eine nicht-leere Dateiliste — Modell des PR-Zweigs in ci.yml (der
 * push-Zweig hatte bis 29.8.2026 eine `scripts/plan/inventar.ts`-Sonderregel für
 * `doku`, siehe Kopf-Kommentar; dort bleibt die bestehende Bash-Fallunter-
 * scheidung unverändert bestehen). Dient dem §6.7-Beweis der vier Testfälle
 * des Auftrags — ci.yml selbst ruft weiterhin nur `klassifiziereDateien` auf,
 * NACHDEM sein eigener `.md`-Kurztest den reinen Doku-Fall schon behandelt hat.
 * Seit 19.9.2026 wertet auch der `merge_group`-Zweig in ci.yml dieselbe Regel
 * je Queue-Eintrag aus (base_sha...head_sha); seine Sonderfälle (Gruppierung
 * ≠ ALLGREEN, Bereich nicht «ahead», 0/≥300 Dateien ⇒ `code`) liegen wie die
 * des push-Zweigs bewusst in der Bash, nicht hier.
 */
export function klassifiziereDiff(dateien: readonly string[]): 'doku' | DiffArt {
  if (istReinerDokuDiff(dateien)) return 'doku';
  return klassifiziereDateien(dateien);
}

/** Reiner Doku-Diff: ALLE Dateien enden auf `.md` UND keine davon ist
 * Werkzeug-Konfiguration trotz `.md`-Endung (`WERKZEUG_TROTZ_MD_MUSTER`,
 * Anlass PR #619 oben). Eine einzige Werkzeug-Datei genügt, um den
 * Kurzschluss zu sperren — dieselbe Fehlerseite wie bei `klassifiziereDateien`
 * (§6.7): lieber einmal zu viel geprüft als der auslösende Diff ungeprüft. */
export function istReinerDokuDiff(dateien: readonly string[]): boolean {
  return (
    dateien.every((d) => /\.md$/.test(d)) &&
    !dateien.some((d) => WERKZEUG_TROTZ_MD_MUSTER.some((re) => re.test(d)))
  );
}

// CLI: liest eine Datei je Zeile von stdin (wie `pr-dateien.txt`/
// `push-dateien.txt` in ci.yml), gibt `code-fern` oder `code` auf stdout aus.
// ci.yml ruft dies NUR im bereits-nicht-rein-.md-Zweig auf — darum genügt hier
// `klassifiziereDateien` (zwei Klassen), nicht die volle Drei-Klassen-Variante.
if (!process.env.VITEST) {
  const chunks: Buffer[] = [];
  process.stdin.on('data', (c: Buffer) => chunks.push(c));
  process.stdin.on('end', () => {
    const dateien = Buffer.concat(chunks)
      .toString('utf8')
      .split('\n')
      .map((z) => z.trim())
      .filter(Boolean);
    console.log(klassifiziereDateien(dateien));
  });
}
