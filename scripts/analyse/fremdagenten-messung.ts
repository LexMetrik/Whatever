// scripts/analyse/fremdagenten-messung.ts — Jules-Messwerte automatisch ziehen
// (Fix 8, Abnahme QS-FREMDAGENTEN 4.9.2026, Skill `auftrag` Ziff. 4 Punkt 7).
//
// Bisher wurden Ticket→PR-Zeiten von Hand aus GitHub abgelesen und in
// `fahrplaene/FAHRPLAN-FREMDAGENTEN.md` §5 eingetragen — fehleranfällig und
// Handarbeit bei jedem neuen Pilot. Dieses Skript zieht dieselben Werte
// deterministisch aus `gh`.
//
// KEIN CHECK, KEIN CI-SCHRITT: reiner Netzdienst (GitHub API über `gh`),
// darum bewusst ohne «check» im Namen (sonst griffe die Prüflogik-Ausnahme,
// FAHRPLAN §2 Phase 2) und nicht in `.github/workflows/ci.yml` verdrahtet.
//
// Ablauf: `gh pr list --state merged --limit 200 --json
// number,headRefName,createdAt,mergedAt,body,title` liefert die gemergten
// PRs; Jules-Branches per Muster (identisch mit Skill `landung`
// §«Fremde PRs» (`referenz-jules.md`) und CI-Step «Fremd-PR-Tor», 4.9.2026): 19-stellige Task-ID
// irgendwo im Branch-Namen ODER Präfix `jules-`/`jules/`. Aus dem PR-Body
// wird die referenzierte Issue-Nummer gelesen (`Fixes #N` / `Closes #N` /
// nackte `#N`), `gh issue view N --json createdAt` liefert den
// Issue-Zeitpunkt, die Differenz zu `pr.createdAt` ist die Ticket→PR-Dauer
// in Minuten. Spalte «Nacharbeit» bleibt manuell (kein automatisch
// prüfbares Merkmal) — Hinweiszeile am Tabellenende.
//
// Aufruf: npm run fremdagenten:messung -- [--seit YYYY-MM-DD]
//   --seit filtert auf PRs, die an/nach diesem Datum gemergt wurden (UTC).
//   Der npm-Alias setzt FREMDAGENTEN_CLI=1 — das ist Pflicht (s. Fussnote der
//   Datei zu `main()`): ein blosser `npx vite-node …` OHNE diese Variable
//   führt seit QS-FREMDAGENTEN (4.9.2026) NICHTS aus und meldet Exit 0 ohne
//   Ausgabe, weil derselbe Aufruf-Weg auch der Bibliotheks-Import von
//   `erhebeJules()` durch `scripts/plan/selbstopt-erheben.ts` ist.
//
// Exit 0 immer bei technisch gelungenem Lauf (auch bei 0 Treffern) — dies ist
// ein Mess-, kein Prüfwerkzeug. Exit 1 bei Aufruffehler (z. B. `gh` fehlt)
// oder ungültigem `--seit`.
//
// --kontingent (Auftrag QS-FREMDAGENTEN «Kontingent-Alarm», 4.9.2026):
// eigener Modus, misst NICHT gemergte PRs, sondern ob eines der beiden
// Fremd-Werkzeuge GERADE an seiner Grenze hängt (Fahrplan §4 «Limite
// erkennen», §5 «Kontingent-Ereignisse»):
//   (a) Jules — `gh issue list --label jules --state all --limit 100 --json
//       number,createdAt,comments,state`, Ausschnitt letzte 24 h: Anzahl,
//       Annahmequote («Jules is on it»), laufende Sessions (on it, aber kein
//       «Ready for a review! A PR …») gegen die unbelegte 15er-Parallel-
//       grenze, und ein Alarm je Issue, das seit > 10 min ohne Annahme ist
//       (deutet auf einen Tages-/Parallel-Stopp oder ein App-Problem hin).
//   (b) Antigravity — ein trivialer `agy`-Ping, klassiert über die geteilte
//       Musterprüfung in `agy-status.ts`.
// Exit 0 = beides unauffällig, Exit 3 = Kontingent-Alarm (Jules-Stopp-
// Verdacht ODER agy gesperrt), Exit 2 = Werkzeugfehler (z. B. `gh` schlägt
// fehl). Diese drei Ausgänge sind bewusst unterscheidbar (§14.7: ein
// Erfolgsbericht ohne prüfbaren Exit-Code gilt als nicht erfolgt).
//
// Modell-/Versions-Drift (Ergänzung QS-FREMDAGENTEN, 4.9.2026): `--kontingent`
// vergleicht zusätzlich `agy --version` und die Modell-Slugs aus `agy models`
// gegen die Momentaufnahme in `bibliothek/register/antigravity-stand.json` und
// druckt bei Abweichung Hinweiszeilen («Antigravity-Version: agy alt→neu» /
// «NEU: Modell X») — KEIN Alarm, eine neue Modellversion ist kein Kontingent-
// Vorfall. Die Vergleichslogik selbst (`pruefeAntigravityDrift`) ist rein und
// braucht kein `agy`; nur das Ziehen des aktuellen Stands ruft den Prozess auf.
// Das Register wird nie automatisch geschrieben (§2, Muster wie
// `schlankheit:update`): erst `--kontingent --snapshot` aktualisiert es, nach
// Sichtung durch die Session. Bleibt die letzte Sichtung > 30 Tage zurück,
// schlug bis 20.9.2026 `retro:17` (Regel h, `scripts/plan/retro17Kern.ts`)
// eine Google-Ökosystem-Sichtung vor (Fahrplan §7) — mit `retro:17` entfallen
// (Entscheid David, Rückbau QS-EFFIZIENZ); die Wiedervorlage dafür bucht die
// Haupt-Session in den Fahrplan.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { klassiereAgyFehler, KONTINGENT_MELDUNG } from './agy-status.ts';

/**
 * Jules-Kennzahlen eines Snapshots. Bis 20.9.2026 aus
 * `scripts/plan/selbstoptKern.ts` importiert (§5, EINE Definition dort, wo
 * das Schema der Selbstopt-Zeitreihe lebt) — mit `retro:17`/
 * `selbstopt:erheben` entfallen (Entscheid David, Rückbau QS-EFFIZIENZ).
 * Diese Datei ist seither die einzige Erzeugerin von Werten dieses Typs und
 * damit sein natürlicher Wohnort.
 */
export interface JulesMessung {
  /** Jules-PRs, in den letzten 7 Tagen GEMERGED. */
  prs_gemerged_7d: number;
  /**
   * Jules-PRs, in den letzten 7 Tagen GESCHLOSSEN ohne Merge — **ohne Proben**
   * (s. `proben_7d`). Das ist der Nenner-Anteil der Landungsquote und misst
   * Ablehnung, NICHT Nacharbeit: ein PR kann gemergt werden und trotzdem
   * Nacharbeit gekostet haben.
   */
  prs_geschlossen_7d: number;
  /**
   * Jules-PRs im selben Fenster mit Label `probe` — Werkzeug-Proben (etwa der
   * Erstfilter-Test PR #642), die weder Bau noch Ablehnung sind und darum aus
   * Zähler UND Nenner der Landungsquote fallen. Sie bleiben sichtbar, statt
   * zu verschwinden: eine Quote, die still Fälle weglässt, ist nicht prüfbar.
   *
   * `null` = diese Messung unterschied noch keine Proben (Schema < 4), nicht
   * «keine Proben gefunden».
   */
  proben_7d: number | null;
  /**
   * Jules-PRs im selben Fenster mit Label `entwurf-antwort` (ANLASS 5.9.2026,
   * PR #707: gültige Entwurf-Antwort auf Feldabweichung) — weder Bau noch
   * Ablehnung, darum wie `proben_7d` aus Zähler UND Nenner der Landungsquote
   * ausgeschlossen und getrennt ausgewiesen statt zu verschwinden.
   *
   * `null` = diese Messung unterschied noch keine Entwurf-Antworten
   * (Schema < 5), nicht «keine gefunden».
   */
  entwurf_antworten_7d: number | null;
  /**
   * Nummern der geschlossenen (nicht-Proben-)PRs. Trägt die Entdopplung der
   * Retro-Regel «Lehre verankern»: derselbe abgelehnte PR steht sieben Tage
   * lang in jedem Snapshot, die Lehre ist aber einmal zu ziehen.
   *
   * `null` = Nummern nicht mitgeführt (Schema < 4).
   */
  prs_geschlossen_nummern: number[] | null;
  /** Median Ticket→PR-Dauer der gemergten PRs, `null` ohne auflösbare Issue-Referenz. */
  median_dauer_min: number | null;
  /** Jules-Issues (Label `jules`), angelegt in den letzten 24 h. */
  tickets_24h: number;
  /** Mindestens ein Issue der letzten 24 h seit > 10 min ohne «Jules is on it» (Fahrplan §4 «Limite erkennen»). */
  alarm: boolean;
}

const JULES_MUSTER = /[0-9]{19}|^jules[-/]/;
/**
 * Label, mit dem eine Werkzeug-PROBE gekennzeichnet ist (im Repo gesetzt auf
 * PR #642, PR #638, Issue #640). Eine Probe prüft die Prüfstrasse, nicht den
 * Bau: sie ist weder eine Landung noch eine Ablehnung und gehört darum weder
 * in den Zähler noch in den Nenner der Landungsquote.
 */
const PROBE_LABEL = 'probe';
/**
 * Label einer gültigen Entwurf-Antwort (ANLASS 5.9.2026, PR #707): der
 * Auftrag verlangte bei Feldabweichung einen Entwurfs-PR + Abbruch statt
 * eines fertigen Baus, Jules tat genau das. Ohne Merge geschlossen zählte er
 * bis dahin als Ablehnung — dieselbe Schieflage wie bei `PROBE_LABEL`, nur
 * eine andere Ursache: keine Werkzeug-Probe, sondern ein regelkonformer
 * Abbruch. Fällt darum ebenso aus Zähler UND Nenner der Landungsquote.
 */
const ENTWURF_ANTWORT_LABEL = 'entwurf-antwort';
const ON_IT_MUSTER = /on it/i;
const READY_MUSTER = /ready for a review/i;
const AGY = join(process.env.HOME ?? '', '.local/bin/agy');
/** Steuer-Register (klein, Momentaufnahme) — Schema: `AntigravityStand`. */
const ANTIGRAVITY_REGISTER = 'bibliothek/register/antigravity-stand.json';

type PrRoh = {
  number: number;
  headRefName: string;
  createdAt: string;
  mergedAt: string | null;
  body: string | null;
  title: string;
};

type Messwert = {
  pr: number;
  issue: number | null;
  branch: string;
  issueErstellt: string | null;
  prErstellt: string;
  dauerMin: number | null;
  titel: string;
};

function gh(args: string[]): string {
  return execFileSync('gh', args, {
    maxBuffer: 1024 * 1024 * 64,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
}

function issueNummerAusBody(body: string | null): number | null {
  if (!body) return null;
  const schluessel = body.match(/(?:fixes|closes|resolves)\s+#(\d+)/i);
  if (schluessel) return Number(schluessel[1]);
  const nackt = body.match(/#(\d+)/);
  return nackt ? Number(nackt[1]) : null;
}

function issueErstellt(nr: number): string | null {
  try {
    const roh = gh(['issue', 'view', String(nr), '--json', 'createdAt']);
    const daten = JSON.parse(roh) as { createdAt: string };
    return daten.createdAt;
  } catch {
    return null;
  }
}

function dauerMinuten(von: string, bis: string): number {
  return Math.round((new Date(bis).getTime() - new Date(von).getTime()) / 60000);
}

function median(werte: number[]): number | null {
  if (werte.length === 0) return null;
  const sortiert = [...werte].sort((a, b) => a - b);
  const mitte = Math.floor(sortiert.length / 2);
  return sortiert.length % 2 === 0
    ? Math.round((sortiert[mitte - 1] + sortiert[mitte]) / 2)
    : sortiert[mitte];
}

type IssueRoh = {
  number: number;
  createdAt: string;
  state: string;
  comments: { body: string; createdAt: string }[];
};

export type PrRohMitStatus = PrRoh & {
  state: string;
  closedAt: string | null;
  /** `gh pr list --json labels`; bei älteren gh-Ausgaben abwesend — nie annehmen, dass die Liste da ist. */
  labels?: { name: string }[];
};

/** Ergebnis von `klassierePrs` — vier disjunkte Töpfe über demselben Fenster. */
export interface PrKlassierung {
  /** Jules-PRs, im Fenster gemergt, ohne Proben/Entwurf-Antworten. */
  gemergt: PrRohMitStatus[];
  /** Jules-PRs, im Fenster ohne Merge geschlossen, ohne Proben/Entwurf-Antworten — das sind die Ablehnungen. */
  geschlossen: PrRohMitStatus[];
  /** Jules-PRs mit Label `probe`, egal ob gemergt oder geschlossen. */
  proben: PrRohMitStatus[];
  /** Jules-PRs mit Label `entwurf-antwort`, egal ob gemergt oder geschlossen (Probe hat Vorrang, s. `klassierePrs`). */
  entwurfAntworten: PrRohMitStatus[];
}

/**
 * Klassiert die rohe `gh`-PR-Liste in gemergt / geschlossen / Proben /
 * Entwurf-Antworten — **reine Funktion**, kein Netz, keine Wanduhr
 * (Bezugszeitpunkt wird hereingegeben). Genau deshalb ausgelagert:
 * `erhebeJules()` selbst ist wegen seines `gh`-Aufrufs nicht prüfbar, diese
 * Entscheidung hier ist es vollständig (`src/tests/plan-fremdagenten.test.ts`).
 *
 * ANLASS (4.9.2026). PR #642 (`jules/relax-min-height-test-…`) trug das Label
 * `probe` — er war ein Test des Erstfilters, kein abgelehnter Bau. Gezählt als
 * Ablehnung drückte er die Landungsquote unter die Rückbau-Schwelle und liess
 * `retro:17` den Rückbau von Jules vorschlagen. Proben fallen darum aus beiden
 * Quoten-Seiten heraus und werden getrennt ausgewiesen, statt zu verschwinden.
 *
 * ANLASS (5.9.2026, `fahrplaene/FAHRPLAN-FREMDAGENTEN.md` §5). PR #707 war
 * eine gültige Entwurf-Antwort: der Auftrag verlangte bei Feldabweichung
 * genau das — Entwurfs-PR + Abbruch —, und Jules tat es. Ohne Merge
 * geschlossen zählte er dennoch als Ablehnung. Analog zu Proben bekommt diese
 * Klasse darum einen eigenen, ausgewiesenen Topf statt in die Ablehnungen zu
 * fallen. Trägt ein PR beide Label, gewinnt `probe` — eine Werkzeug-Probe
 * bleibt auch dann eine Probe, wenn sie zusätzlich als Entwurf beschriftet ist.
 */
export function klassierePrs(prs: PrRohMitStatus[], jetzt: Date): PrKlassierung {
  const grenze = new Date(jetzt.getTime() - JULES_FENSTER_TAGE * 24 * 3_600_000);
  const imFenster = (d: string | null) => d !== null && new Date(d) >= grenze;
  const istProbe = (pr: PrRohMitStatus) => (pr.labels ?? []).some((l) => l.name === PROBE_LABEL);
  const istEntwurfAntwort = (pr: PrRohMitStatus) =>
    (pr.labels ?? []).some((l) => l.name === ENTWURF_ANTWORT_LABEL);

  const out: PrKlassierung = { gemergt: [], geschlossen: [], proben: [], entwurfAntworten: [] };
  for (const pr of prs) {
    if (!JULES_MUSTER.test(pr.headRefName)) continue;
    const gemergt = pr.state === 'MERGED' && imFenster(pr.mergedAt);
    const geschlossen = pr.state === 'CLOSED' && imFenster(pr.closedAt);
    if (!gemergt && !geschlossen) continue;
    if (istProbe(pr)) out.proben.push(pr);
    else if (istEntwurfAntwort(pr)) out.entwurfAntworten.push(pr);
    else if (gemergt) out.gemergt.push(pr);
    else out.geschlossen.push(pr);
  }
  return out;
}

/** Fenster der Stufe-1-Erhebung (Fahrplan §3 «Phase 1 … Anteil PRs ohne Nacharbeit»). */
export const JULES_FENSTER_TAGE = 7;

/**
 * Stufe-1-Erhebung der Jules-Kennzahlen (QS-FREMDAGENTEN,
 * `scripts/plan/selbstopt-erheben.ts`). EIGENE Funktion statt eines Umbaus
 * von `main()`/`kontingentModus()`: jene bleiben unverändert (CLI-Vertrag),
 * diese hier ist das, was Stufe 1 braucht — dieselben Bausteine
 * (`klassierePrs`, `issueNummerAusBody`, `issueErstellt`, `dauerMinuten`,
 * `median`, `holeJulesKontingentDaten`), keine zweite Filter-/Dauer-Logik.
 *
 * Die Klassierung selbst steht in `klassierePrs()` — reine Funktion, damit
 * die Entscheidung «Landung / Ablehnung / Probe» ohne `gh` prüfbar ist.
 *
 * Degradiert auf `null`, NIE werfend (§8) — Stufe 1 vermerkt den Ausfall
 * selbst in `ausfaelle` und macht die Erhebung dafür nicht rot. Scheitert nur
 * einer der beiden `gh`-Aufrufe (PR-Liste oder Issue-Liste), gilt die GANZE
 * Jules-Messung als nicht erhoben — eine Hälfte des Schemas mit erfundenen
 * 0/false zu füllen wäre schlimmer als ehrliches `null`.
 */
export function erhebeJules(jetzt: Date = new Date()): JulesMessung | null {
  let prRoh: PrRohMitStatus[];
  try {
    const ausgabe = gh([
      'pr', 'list', '--state', 'all', '--limit', '200',
      '--json', 'number,headRefName,createdAt,mergedAt,closedAt,state,body,title,labels',
    ]);
    prRoh = JSON.parse(ausgabe) as PrRohMitStatus[];
  } catch {
    return null;
  }

  const { gemergt: gemergte7d, geschlossen: geschlossen7d, proben, entwurfAntworten } = klassierePrs(prRoh, jetzt);
  const dauern = gemergte7d
    .map((pr) => {
      const issueNr = issueNummerAusBody(pr.body);
      const issueZeit = issueNr !== null ? issueErstellt(issueNr) : null;
      return issueZeit ? dauerMinuten(issueZeit, pr.createdAt) : null;
    })
    .filter((d): d is number => d !== null);

  let kontingent: JulesKontingentDaten;
  try {
    kontingent = holeJulesKontingentDaten(jetzt);
  } catch {
    return null;
  }

  return {
    prs_gemerged_7d: gemergte7d.length,
    prs_geschlossen_7d: geschlossen7d.length,
    proben_7d: proben.length,
    entwurf_antworten_7d: entwurfAntworten.length,
    // Aufsteigend sortiert: die Liste geht in einen Vergleich über Snapshots
    // hinweg ein, und eine Reihenfolge, die an der gh-Ausgabe hängt, machte
    // gleiche Messungen ungleich (§2).
    prs_geschlossen_nummern: geschlossen7d.map((pr) => pr.number).sort((a, b) => a - b),
    median_dauer_min: median(dauern),
    tickets_24h: kontingent.heutigeCount,
    alarm: kontingent.alarme.length > 0,
  };
}

interface Teilbefund {
  text: string;
  alarm: boolean;
}

interface JulesKontingentDaten {
  heutigeCount: number;
  angenommenCount: number;
  laufendCount: number;
  alarme: string[];
}

/**
 * Zieht die rohen Jules-Kontingent-Zahlen (Issues der letzten 24 h, Annahme-
 * und Alarm-Signale). EIN `gh`-Aufruf, WIRFT bei Fehlschlag — die beiden
 * Aufrufer (`kontingentJules` für die CLI, `erhebeJules` für Stufe 1)
 * entscheiden je selbst, wie sie einen Fehlschlag behandeln (§5: eine
 * Definition der Jules-Kontingent-Logik, nicht zwei).
 */
function holeJulesKontingentDaten(jetzt: Date): JulesKontingentDaten {
  const roh = gh([
    'issue', 'list', '--label', 'jules', '--state', 'all', '--limit', '100',
    '--json', 'number,createdAt,comments,state',
  ]);
  const issues = JSON.parse(roh) as IssueRoh[];

  const seit24h = new Date(jetzt.getTime() - 24 * 60 * 60 * 1000);
  const heutige = issues.filter((i) => new Date(i.createdAt) >= seit24h);
  const angenommen = heutige.filter((i) => i.comments.some((c) => ON_IT_MUSTER.test(c.body)));
  const fertig = new Set(
    angenommen.filter((i) => i.comments.some((c) => READY_MUSTER.test(c.body))).map((i) => i.number),
  );
  const laufend = angenommen.filter((i) => !fertig.has(i.number));

  const alarme: string[] = [];
  for (const i of heutige) {
    const hatOnIt = i.comments.some((c) => ON_IT_MUSTER.test(c.body));
    if (!hatOnIt) {
      const minuten = Math.round((jetzt.getTime() - new Date(i.createdAt).getTime()) / 60000);
      if (minuten > 10) {
        alarme.push(`möglicher Limit-Stopp oder App-Problem: Issue #${i.number} seit ${minuten} min ohne Annahme`);
      }
    }
  }

  return { heutigeCount: heutige.length, angenommenCount: angenommen.length, laufendCount: laufend.length, alarme };
}

/** Jules-Teil von --kontingent. Bricht mit Exit 2 ab, wenn `gh` selbst scheitert (Werkzeugfehler, nicht Kontingent). */
function kontingentJules(jetzt: Date): Teilbefund {
  let daten: JulesKontingentDaten;
  try {
    daten = holeJulesKontingentDaten(jetzt);
  } catch (fehler) {
    process.stderr.write(`fremdagenten-messung --kontingent: gh issue list fehlgeschlagen — ${String(fehler)}\n`);
    process.exit(2);
  }

  const zeilen = [
    `Jules: heute angelegt ${daten.heutigeCount}/100 · davon angenommen (on it) ${daten.angenommenCount} · ` +
      `laufend (on it, aber kein Ready) ${daten.laufendCount}/15`,
    ...daten.alarme.map((a) => `ALARM: ${a}`),
  ];
  return { text: zeilen.join('\n'), alarm: daten.alarme.length > 0 };
}

/** Antigravity-Teil von --kontingent: ein trivialer Ping, klassiert über agy-status.ts. */
function kontingentAgy(): Teilbefund {
  if (!existsSync(AGY)) {
    return { text: 'Antigravity: nicht installiert', alarm: false };
  }
  let stdout: string;
  try {
    stdout = execFileSync(
      AGY,
      [
        '-p', 'Antworte nur mit PONG.',
        '--model', 'gemini-3.8-flash-low',
        '--output-format', 'json',
        '--print-timeout', '60s',
        '--sandbox',
      ],
      { timeout: 90_000, killSignal: 'SIGKILL', maxBuffer: 16 * 1024 * 1024, encoding: 'utf8' },
    );
  } catch (err) {
    const fehler = err as Error & { killed?: boolean; signal?: string | null; stderr?: string | Buffer };
    if (fehler.killed || fehler.signal === 'SIGKILL') {
      return { text: 'Antigravity: unklar (Timeout)', alarm: false };
    }
    const stderrText = fehler.stderr ? String(fehler.stderr) : '';
    const klass = klassiereAgyFehler(`${fehler.message} ${stderrText}`);
    return klass.art === 'kontingent'
      ? { text: `Antigravity: ${KONTINGENT_MELDUNG} — ${klass.text}`, alarm: true }
      : { text: `Antigravity: agy-Fehler: ${klass.text}`, alarm: false };
  }

  let envelope: { status: string; response?: string; usage?: { total_tokens: number } };
  try {
    envelope = JSON.parse(stdout);
  } catch {
    const klass = klassiereAgyFehler(stdout);
    return klass.art === 'kontingent'
      ? { text: `Antigravity: ${KONTINGENT_MELDUNG} — ${klass.text}`, alarm: true }
      : { text: `Antigravity: agy-Fehler: ${klass.text}`, alarm: false };
  }
  if (envelope.status !== 'SUCCESS') {
    const klass = klassiereAgyFehler(`${envelope.status} ${envelope.response ?? ''}`);
    return klass.art === 'kontingent'
      ? { text: `Antigravity: ${KONTINGENT_MELDUNG} — ${klass.text}`, alarm: true }
      : { text: `Antigravity: agy-Fehler: ${klass.text}`, alarm: false };
  }
  return {
    text: `Antigravity: agy ok (gemini-3.8-flash-low, ${envelope.usage?.total_tokens ?? '?'} Tokens)`,
    alarm: false,
  };
}

/** Schema des Antigravity-Registers (`bibliothek/register/antigravity-stand.json`). */
export interface AntigravityStand {
  version: string;
  /** Modell-Slugs (erste Spalte von `agy models`), nicht die Anzeigenamen. */
  models: string[];
  /** YYYY-MM-DD der letzten Sichtung — Grundlage für Regel (h) in `retro17Kern.ts`. */
  letzte_sichtung: string;
}

/** Zieht die Modell-Slugs aus `agy models` (erste Spalte je Zeile; Kopfzeile «Fetching …» übersprungen). */
export function parseAgyModelSlugs(stdout: string): string[] {
  return stdout
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter((zeile) => zeile.length > 0 && !/^fetching/i.test(zeile))
    .map((zeile) => zeile.split(/\s+/)[0])
    .filter((slug): slug is string => Boolean(slug));
}

/**
 * Reine Vergleichsfunktion (kein `agy`, kein Netz) — testbar ohne Werkzeug.
 * Liefert Hinweiszeilen, KEIN Alarm (§ Kopf: eine neue Modellversion ist kein
 * Kontingent-Vorfall). `register === null` heisst «noch nie geschnappt».
 */
export function pruefeAntigravityDrift(
  register: AntigravityStand | null,
  aktuelleVersion: string,
  aktuelleModelle: string[],
): string[] {
  if (!register) {
    return [`Antigravity-Register fehlt (${ANTIGRAVITY_REGISTER}) — mit --snapshot anlegen.`];
  }
  const hinweise: string[] = [];
  if (register.version !== aktuelleVersion) {
    hinweise.push(`Antigravity-Version: agy ${register.version}→${aktuelleVersion}`);
  }
  const bekannt = new Set(register.models);
  for (const m of aktuelleModelle) {
    if (!bekannt.has(m)) hinweise.push(`NEU: Modell ${m}`);
  }
  return hinweise;
}

function ladeAntigravityRegister(): AntigravityStand | null {
  if (!existsSync(ANTIGRAVITY_REGISTER)) return null;
  try {
    return JSON.parse(readFileSync(ANTIGRAVITY_REGISTER, 'utf8')) as AntigravityStand;
  } catch {
    return null;
  }
}

/** Zieht Version + Modell-Slugs frisch von `agy` — `null` bei fehlendem Werkzeug oder Prozessfehler. */
function agyVersionUndModelle(): { version: string; models: string[] } | null {
  if (!existsSync(AGY)) return null;
  // `stdio: ['ignore', 'pipe', 'pipe']` wie `gh()` oben: `agy models` schreibt
  // seine Fortschrittszeile («Fetching available models…») auf stderr — ohne
  // dieses Capturing liefe sie am execFileSync-Default vorbei direkt auf die
  // Konsole der aufrufenden Session statt kontrolliert verworfen zu werden.
  const opts: { timeout: number; encoding: 'utf8'; stdio: ['ignore', 'pipe', 'pipe'] } = {
    timeout: 30_000,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  };
  try {
    const version = execFileSync(AGY, ['--version'], { ...opts, timeout: 15_000 }).trim();
    const modelleRoh = execFileSync(AGY, ['models'], opts);
    return { version, models: parseAgyModelSlugs(modelleRoh) };
  } catch {
    return null;
  }
}

function kontingentModus(): void {
  const jetzt = new Date();
  const jules = kontingentJules(jetzt);
  const agy = kontingentAgy();
  process.stdout.write('=== Kontingent-Status (fremdagenten-messung --kontingent) ===\n');
  process.stdout.write(jules.text + '\n');
  process.stdout.write(agy.text + '\n');

  const aktuell = agyVersionUndModelle();
  if (aktuell) {
    const drift = pruefeAntigravityDrift(ladeAntigravityRegister(), aktuell.version, aktuell.models);
    for (const zeile of drift) process.stdout.write(`Antigravity-Drift: ${zeile}\n`);
    if (process.argv.includes('--snapshot')) {
      const stand: AntigravityStand = {
        version: aktuell.version,
        models: aktuell.models,
        letzte_sichtung: jetzt.toISOString().slice(0, 10),
      };
      writeFileSync(ANTIGRAVITY_REGISTER, JSON.stringify(stand, null, 2) + '\n', 'utf8');
      process.stdout.write(`Antigravity-Register aktualisiert (${ANTIGRAVITY_REGISTER}).\n`);
    }
  }

  if (jules.alarm || agy.alarm) {
    process.stderr.write('KONTINGENT-ALARM: siehe Zeilen oben — keine neuen Jules-Tickets, Fahrplan §5 protokollieren.\n');
    process.exitCode = 3;
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.includes('--kontingent')) {
    kontingentModus();
    return;
  }
  const seitIdx = argv.indexOf('--seit');
  let seit: Date | null = null;
  if (seitIdx !== -1) {
    const wert = argv[seitIdx + 1];
    seit = wert ? new Date(wert) : null;
    if (!wert || Number.isNaN(seit?.getTime())) {
      process.stderr.write(`fremdagenten-messung: ungültiges --seit "${wert ?? ''}" (Format YYYY-MM-DD)\n`);
      process.exit(1);
    }
  }

  let roh: PrRoh[];
  try {
    const ausgabe = gh([
      'pr', 'list', '--state', 'merged', '--limit', '200',
      '--json', 'number,headRefName,createdAt,mergedAt,body,title',
    ]);
    roh = JSON.parse(ausgabe) as PrRoh[];
  } catch (fehler) {
    process.stderr.write(`fremdagenten-messung: gh pr list fehlgeschlagen — ${String(fehler)}\n`);
    process.exit(1);
    return;
  }

  const julesPrs = roh
    .filter((pr) => JULES_MUSTER.test(pr.headRefName))
    .filter((pr) => !seit || !pr.mergedAt || new Date(pr.mergedAt) >= seit)
    .sort((a, b) => a.number - b.number);

  const messwerte: Messwert[] = julesPrs.map((pr) => {
    const issueNr = issueNummerAusBody(pr.body);
    const issueZeit = issueNr !== null ? issueErstellt(issueNr) : null;
    const dauer = issueZeit ? dauerMinuten(issueZeit, pr.createdAt) : null;
    return {
      pr: pr.number,
      issue: issueNr,
      branch: pr.headRefName,
      issueErstellt: issueZeit,
      prErstellt: pr.createdAt,
      dauerMin: dauer,
      titel: pr.title,
    };
  });

  if (messwerte.length === 0) {
    process.stdout.write('fremdagenten-messung: keine Jules-PRs gefunden (Muster: 19-stellige Task-ID oder Präfix jules-/jules/).\n');
    process.exit(0);
    return;
  }

  process.stdout.write('| PR | Issue | Branch | Issue erstellt | PR erstellt | Dauer (min) | Titel |\n');
  process.stdout.write('|---|---|---|---|---|---|---|\n');
  for (const m of messwerte) {
    process.stdout.write(
      `| #${m.pr} | ${m.issue !== null ? `#${m.issue}` : '?'} | ${m.branch} | ` +
      `${m.issueErstellt ?? '?'} | ${m.prErstellt} | ${m.dauerMin ?? '?'} | ${m.titel} |\n`
    );
  }

  const dauern = messwerte.map((m) => m.dauerMin).filter((d): d is number => d !== null);
  process.stdout.write(
    `\nn = ${messwerte.length} · Median-Dauer = ${median(dauern) ?? '?'} min ` +
    `(${dauern.length}/${messwerte.length} mit auflösbarer Issue-Referenz)\n`
  );
  process.stdout.write('Spalte «Nacharbeit» ist hier nicht enthalten — kein automatisch prüfbares Merkmal, von Hand ins Fahrplan-Register eintragen.\n');
}

// Nur bei direktem CLI-Aufruf ausführen — seit QS-FREMDAGENTEN (4.9.2026)
// importiert `scripts/plan/selbstopt-erheben.ts` `erhebeJules()` aus DIESER
// Datei, und ein blosser Import darf `main()` (gh-Aufrufe, `process.exit`)
// nicht auslösen. `process.env.VITEST` allein reicht nicht mehr — es
// unterscheidet Test von Nicht-Test, aber nicht mehr direkten CLI-Lauf von
// Bibliotheks-Import IM BAU (beides ohne VITEST). Ein Pfadvergleich über
// `process.argv[1]` funktioniert unter `vite-node` nachweislich nicht — es
// zeigt auf den vite-node-Binary-Pfad, nicht auf dieses Skript (identischer
// Befund wie in `scripts/check-schlankheit.ts` dokumentiert) — darum die
// explizite Markierung durch den npm-Alias selbst.
if (!process.env.VITEST && process.env.FREMDAGENTEN_CLI === '1') {
  main();
}
