// scripts/perf/lighthouse-budget.ts — Lighthouse-Metrik-Schranken des QS-PERF-Tors.
//
// Ergänzt den Chrome-freien Bundle-Teil (scripts/check-perf-budget.ts) um die in
// CLAUDE.md §15 / FAHRPLAN-PERFORMANCE.md geforderten Lighthouse-Schranken:
// CLS/LCP/TBT/TTI/Score auf `/gesetze/bund/OR` (die schwerste Leser-Seite) + der
// Startseite, gemessen im **Lighthouse-Mobil-Preset** (= 4× CPU-Drosselung +
// langsames 4G — exakt das im Audit 30.6.2026 gemessene Worst-Case-Geräteprofil).
//
// Bewusst NICHT im schnellen `npm run gate` (der nicht baut). Es liest ein
// bereits gebautes `dist/` und startet dafür `vite preview` selbst — es gehört
// in den DEPLOY-/CI-Pfad NACH `npm run build` und NACH den Treue-Toren
// (golden/normtext/struktur-konsistenz/suchindex + Reader-e2e). Die
// Gegenkopplung (§15: «Tempo zählt nur, wenn die Treue grün bleibt») wird durch
// die CI-Schritt-Reihenfolge erzwungen: laufen die Treue-Tore rot, bricht der
// Job, bevor dieses Script überhaupt startet.
//
// Chrome-Auflösung (CI reproduzierbar): CHROME_PATH → Playwright-Chromium
// (in CI ohnehin installiert) → chrome-launcher-Default (lokal System-Chrome).
//
// Schwellen sind **Regressions-Deckel mit Kopffreiheit über dem Ist** (siehe
// SCHWELLEN unten), nicht das Endziel — der erste Eintritt soll Rückschritte
// fangen, nicht sofort rot sein. Verschärfung ist dokumentierter Folgeschritt.

import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { erlassPfadVonKey } from '../../src/lib/normtext/erlassAdresse';

const requireCJS = createRequire(import.meta.url);

// ── Konfiguration ──────────────────────────────────────────────────────────

/**
 * Zahl aus einer Umgebungsvariablen — LEERE Variable zählt als «nicht gesetzt».
 * `Number(process.env.X ?? default)` reicht dafür NICHT: `??` greift nur bei
 * `undefined`, und `Number('')` ist `0`. Genau daran ist die erste Messreihe
 * gescheitert — GitHub setzt `${{ github.event.inputs.* }}` bei einem
 * push-Event als LEEREN String, damit wurde PERF_RUNS=0 und das Script mass
 * null Läufe (Median über die leere Liste ⇒ `null` in allen Feldern).
 */
function zahlAusUmgebung(name: string, vorgabe: number): number {
  const roh = process.env[name];
  if (roh === undefined || roh.trim() === '') return vorgabe;
  const n = Number(roh);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name}='${roh}' ist keine brauchbare positive Zahl.`);
  }
  return n;
}

const PORT = zahlAusUmgebung('PERF_PORT', 4319);
const BASE = process.env.PERF_BASE_URL ?? `http://localhost:${PORT}`;
const MESSEN_NUR = process.argv.includes('--messen'); // nur messen + drucken, keine Assertion
// Lighthouse-Einzelläufe streuen auf einem geteilten CI-Runner stark (v. a. TBT/
// Score/CLS unter der 4×-CPU-Drossel). Darum je Seite N Läufe → **Median** je
// Metrik (der Standard-Ansatz von Lighthouse-CI gegen Ausreisser-Flake). CI: 3,
// lokal 1 (schnell). Override über PERF_RUNS.
//
// ── Chrome-Isolation je Lauf (NEU 20.7.2026, Baustelle A1) ──────────────────
// Vorher teilte dieses Script EINE Chrome-Instanz über ALLE Läufe BEIDER Seiten.
// Die Instanz driftete über die Läufe, und die zuletzt gemessene Seite erbte die
// Drift: ein Probelauf mit RUNS=5 liess die Startseite (misst als zweite, nach
// allen OR-Läufen) von historisch 143–237 ms TBT auf **1543 ms** springen und
// OR-LCP von ~3.5 s auf 11.3 s — ohne jede Änderung am App-Code. Mehr Läufe
// machten die Messung damit nicht ruhiger, sondern die späteren Werte schlechter;
// zusätzlich mass Lauf 1 kalt und Lauf 2+ warm (LCP 11.3 s gegen 3.5 s im selben Job).
//
// Jetzt startet `einLauf()` je Messung eine **frische Chrome-Instanz** und killt
// sie danach (Kosten ~1–2 s je Lauf, in CI ~9 Läufe ⇒ ~15 s). Damit ist jeder
// Lauf gleich kalt, die Reihenfolge der Seiten ist ohne Einfluss, und der Median
// mittelt echte Instanz-Streuung statt kumulativer Drift.
const RUNS = zahlAusUmgebung('PERF_RUNS', process.env.CI ? 3 : 1);

// ── TBT-Normierung je Job: seit 3.8.2026 die BEWERTETE Grösse (A2) ──────────
//
// Die Idee: die TBT-Streuung sitzt ZWISCHEN den Jobs (heterogener Runner-Pool),
// nicht innerhalb. Ein absoluter Deckel auf dem Rohwert kann daher nicht zwischen
// «Software langsamer» und «langsamen Runner erwischt» unterscheiden. Gegenmittel
// ist eine Referenzmessung mit demselben Instrument im selben Job: eine synthetische,
// deterministische CPU-Last (`dist/_perf-kalibrier.html`, kein App-Code, kein
// Netz), über dieselbe Lighthouse-Kette gemessen, als Divisor —
//
//   faktor = tbtKalibrier / KALIBRIER_BASIS ;  TBT normiert = TBT roh / faktor
//
// ERST VERWORFEN (20.7.2026), DANN ANGENOMMEN (3.8.2026). Beide Messreihen stehen
// hier, weil die zweite die erste nicht widerlegt, sondern ergänzt (§8).
//
// (1) 20.7.2026 — zwei Messreihen zu je 8 unabhängigen Runnern (Läufe 29765490018
//     und 29766507765, identischer App-Code) ergaben ein UNEINHEITLICHES Bild:
//
//                        OR-TBT roh        OR-TBT normiert    Korrelation kalib↔TBT
//   Reihe 1 (n=8)        CV 31.2 %         CV 16.5 %          roh +0.83 → norm −0.21
//   Reihe 2 (n=8)        CV 22.7 %         CV 29.9 %          roh −0.43 → norm −0.80
//   gepoolt (n=16)       CV 26.8 %         CV 23.3 %          roh +0.49 → norm −0.39
//
//     Reihe 1 sah nach klarem Erfolg aus; Reihe 2 kehrte das Vorzeichen um (dort
//     VERSCHLECHTERT das Normieren die Streuung). Gepoolt blieb nur 26.8 → 23.3 %.
//     Auch eine abgeschwächte Korrektur `norm = roh · (BASIS/kalib)^α` rettete es
//     nicht: bestes gepooltes α = 0.70 (CV 22.5 %), aber mit gegenläufiger Wirkung
//     je Reihe (31.2 → 17.7 % gegen 22.7 → 27.1 %). Darum wurde damals weiter auf
//     dem ROHWERT assertiert und die Kalibrierung lief als reine Diagnose mit.
//
// (2) 3.8.2026 — Lauf 30830332128, erneut 8 unabhängige Runner (je Median aus 3),
//     identischer App-Code (main d864a9caa):
//
//                     min    Median     max   Mittel     sd      CV     > 6500
//   OR-TBT roh       3236     5679     7223     5290    1376   26.0 %     1/8
//   OR-TBT normiert  4583     5478     5967     5303     508    9.6 %     0/8
//
//     Der Runner-Pool ist gegenüber der 16er-Basis von Juli MERKLICH langsamer
//     geworden — ohne jede Änderung am App-Code: Roh-Mittel 4489 → 5290 ms
//     (+17.8 %), Roh-Max 5940 → 7223 ms (+21.6 %). Am selben Tag rissen vier
//     CI-Läufe den 6500er-Deckel, ebenfalls auf Ständen, die kein src/ berührten.
//     Die Normierung senkt die Streuung hier auf gut ein Drittel (CV 26.0 → 9.6 %)
//     und zieht auch das Maximum unter den Deckel.
//
// ENTSCHEID DAVID 3.8.2026 («Option normiert»): Assertiert wird ab hier der
// NORMIERTE Wert; die Budget-ZAHL bleibt unverändert bei 6500 — gleiches
// Qualitätsversprechen, runner-geschwindigkeits-bereinigt, KEINE Anhebung. Der
// Rohwert wird weiterhin gedruckt und im PERF-MESSPUNKT-JSON geführt (§8).
//
// EHRLICHE GRENZE (§8: lieber ein ehrliches Nein als eine hübsche Zahl): Die
// Wirkung der Normierung bleibt stichprobenabhängig — Reihe 2 vom 20.7. hat sie
// verschlechtert. Die Regressions-Steigung log(TBT)~log(kalib) beträgt 0.65, nicht
// 1: eine reine Integer-Schleife misst die Kernfrequenz, die OR-TBT hängt daneben
// an Speicherbandbreite, Cache und Nachbar-Last auf dem geteilten Host. Der
// Normierer entfernt also die GROBE Runner-Geschwindigkeit, nicht das Rauschen.
// Genau deshalb wird der Deckel NICHT auf die engere normierte Streuung
// nachgezogen, sondern bleibt bei 6500.
//
// FALLBACK: Ist die Kalibrierung unplausibel (Band unten) oder per PERF_NORMIEREN=0
// abgeschaltet, wird gegen denselben Deckel der ROHWERT assertiert. Das ist die
// konservativere Richtung — auf einem langsamen Runner ist der Rohwert der höhere,
// das Tor wird dadurch nie stiller. Kein Durchwinken ohne Messung (§8).
// Abschaltbar über PERF_NORMIEREN=0.
const NORMIEREN = process.env.PERF_NORMIEREN !== '0';
// Blockzahl × Iterationen je Block der Kalibrier-Last. Bewusst in ~8 mittellange
// Tasks zerlegt (statt eines Riesen-Tasks): so ähnelt das Lastprofil einer echten
// Seite (viele Long Tasks), TBT summiert über alle, und die TTI-Erkennung von
// Lighthouse bleibt stabil.
const KALIBRIER_BLOECKE = 8;
// Grösse empirisch gewählt (20.7.2026): 8 Blöcke à 5 Mio Iterationen ergeben
// lokal (Apple Silicon, 4×-Drossel) ~0.5 s Kalibrier-TBT und auf dem 2-vCPU-CI-
// Runner ~2 s — also dieselbe Grössenordnung wie die zu normierende OR-TBT.
// Zu klein ⇒ Referenz verschwindet im Messrauschen; zu gross ⇒ der Kalibrier-
// Lauf kostet mehr Zeit, als das Tor spart.
const KALIBRIER_ITER = 5_000_000;
// Kalibrier-Läufe je Job → Median (die Referenz soll selbst nicht flackern).
const KALIBRIER_RUNS = zahlAusUmgebung('PERF_KALIBRIER_RUNS', process.env.CI ? 3 : 1);
// Bezugsgrösse: Median-TBT der Kalibrier-Seite über die CI-Messreihe (Werte und
// Herleitung im SCHWELLEN-Block unten). Ein Runner mit genau diesem Wert bekommt
// Faktor 1.000, d. h. normiert == roh; die normierten Deckel bleiben damit auf
// derselben Grössenordnung wie die bisherigen Absolutwerte und sind direkt lesbar.
const KALIBRIER_BASIS = zahlAusUmgebung('PERF_KALIBRIER_BASIS', 1120);
// Plausibilitätsband: ausserhalb gilt die Kalibrierung als gescheitert (Instrument
// defekt / Seite nicht ausgeliefert / Runner pathologisch) → keine Normierung.
// Bewusst weit: es soll nur Instrument-Ausfall fangen, nicht langsame Runner
// aussortieren — genau die soll die Normierung ja einfangen.
const KALIBRIER_MIN = 150;
const KALIBRIER_MAX = 20_000;

// ── Kanton-Leser-Route (K-11, 31.8.2026) ────────────────────────────────────
// Als Konstante, weil derselbe Erlass-Schlüssel an ZWEI Stellen gebraucht wird:
// in der Schwellen-Tabelle und in der Existenz-Sonde unten. Ein Tor, dessen
// Messobjekt still verschwinden kann, ist ein Tor, das nicht scheitern kann
// (§6.7) — der kantonale Korpus wird in `W2·13-KANTONE-DATEN` neu erzeugt, und
// eine 404-/Fehlseite hat ein makelloses CLS. Darum die Sonde.
const KANTON_LESER_SCHLUESSEL = 'SO-614.11';
// Adresse über den EINEN Formatierer (§5-Tor `erlass-adresse.test.ts`) —
// die Ebene liefert die Kantonskürzel-Regel aus `routenEbeneVonKey`.
const KANTON_LESER_PFAD = erlassPfadVonKey(KANTON_LESER_SCHLUESSEL);

// `null` heisst: **gemessen und gedruckt, aber NICHT assertiert** — für eine
// Route, die (noch) keine Runner-Kalibrierung hat. Ein aus der Luft gegriffener
// Deckel auf einer runner-abhängigen Metrik ist entweder so weit, dass er nichts
// fängt (§17: bewachen statt streichen), oder so eng, dass er Rausch-Rot
// produziert; beides ist schlechter als eine ehrlich als «unkalibriert»
// deklarierte Zahl im Bericht (§8). Eingeführt 29.8.2026 mit `/gesetze`.
type Schwelle = {
  clsMax: number;          // Cumulative Layout Shift (geräteunabhängig — der harte Regressions-Fänger)
  lcpMax: number | null;   // Largest Contentful Paint (ms) — CPU-abhängig, grosszügiger Deckel
  tbtMax: number | null;   // Total Blocking Time (ms) — bewertet auf dem NORMIERTEN Wert (3.8.2026)
  ttiMax: number | null;   // Time To Interactive (ms)
  scoreMin: number | null; // Performance-Score 0..100
};

// ── Schwellen-Kalibrierung (NEU 20.7.2026, neues Messregime) ────────────────
//
// Binding ist der **CI-Runner** (dort läuft das Tor), nicht die lokale Maschine.
//
// WARUM NEU ERHOBEN: Die Chrome-Isolation (A1) ändert das Messregime — jeder Lauf
// ist jetzt Kalt-Last statt einer Mischung aus warm und kalt. Die 27-Lauf-Historie
// des alten Regimes ist als Bezug damit entwertet und wurde NICHT übernommen.
// Grundlage sind **16 Messpunkte auf 16 unabhängigen Runner-Zuteilungen**
// (`.github/workflows/perf-kalibrierung.yml`, zwei 8er-Matrizen, je Median aus 3;
// Läufe 29765490018 + 29766507765, identischer App-Code).
//
//   Metrik            min      Mittel     max       sd     Deckel   Rausch-Rot
//   OR TBT          2551      4489      5940     1204     6500        ~4.7 %
//   OR CLS         0.0056    0.0074    0.0093   0.0013    0.05        ~0
//   OR LCP          3508      7484     11613     4098    13500      s. u.
//   OR TTI          9368     10701     11613      864    13000        ~0.4 %
//   OR Score          37        46        53        7       25        ~0
//   Start TBT         98       224       292       57      400        ~0.1 %
//   Start LCP       9141      9225      9275       37    10000        ~0
//   Start Score       65        67        70        2       55        ~0
//   (Rausch-Rot = einseitige Normal-Approximation; beobachtet 0/16 bei ALLEN Deckeln.)
//
// ── NACHMESSUNG 3.8.2026: die 16er-Tabelle beschreibt den Pool NICHT mehr ──────
// Lauf 30830332128 (8 unabhängige Runner, je Median aus 3, App-Code d864a9caa)
// gegen dieselben Deckel. Der Pool ist langsamer geworden; die Tabelle oben bleibt
// als Herleitung der Deckel stehen, ist als Ist-Bezug aber überholt:
//
//   Metrik            min      Mittel     max       sd     Deckel   Kopffreiheit ab max
//   OR TBT roh       3236      5290      7223     1376     6500      −10 %  (1/8 rot)
//   OR TBT norm      4583      5303      5967      508     6500      +9 %   (0/8 rot)
//   OR CLS         0.0054    0.0062    0.0066   0.0006     0.05      +657 %
//   OR LCP           3507      8774     12064     4355    13500      +12 %
//   OR TTI           9795     11304     12064      931    13000      +8 %
//   OR Score           37        43        53        8       25      (min 37 > 25)
//   Start TBT         138       224       281       46      400      +42 %
//   Start LCP        9339      9392      9459       37    10000      +6 %
//   Start Score        65        67        69        1       55      (min 65 > 55)
//   Kalibrier-TBT     744      1116      1424      268   (Basis 1120 — weiterhin mittig)
//
// WAS DAS HEISST — und was bewusst NICHT geändert wurde (kein Anlass, §14):
//   • **OR TBT** ist die einzige gerissene Metrik und wird deshalb hier umgestellt.
//   • **OR TTI** trägt dieselbe Runner-Abhängigkeit (sd 931 ms, Kopffreiheit von
//     ehemals 2.7 sd auf 1.8 sd geschrumpft ⇒ Rausch-Rot ~3 % statt ~0.4 %). Sie ist
//     der nächste Kandidat, hat aber KEINEN belegten Fehlschlag — darum unverändert
//     auf dem Rohwert. Wird sie rot, ist dieser Block die Vorlage.
//   • **OR LCP** bleibt bimodal (3× ~3.5 s, 5× ~11.6–12.1 s) und ist damit NICHT
//     runner-geschwindigkeits-getrieben — Normieren würde hier nichts bereinigen,
//     sondern den niedrigen Modus verzerren. Ursache weiterhin offen (unten).
//   • **Start-TBT/-LCP/-Score und OR CLS** sind runner-robust geblieben.
//
// WAS VERSCHÄRFT WURDE — und was nicht (§8):
//   • **Start TBT 1500 → 400.** Der alte Deckel lag 571 % über dem Ist und fing
//     faktisch nichts; 400 liegt 79 % darüber bei ~0.1 % Rausch-Rot. Echte Schärfe.
//   • **Start LCP 11000 → 10000.** Diese Metrik ist erstaunlich stabil: 9141…9275 ms,
//     sd 37 ms über alle 16 Runner (netzgebunden, runner-unabhängig). 10000 liegt
//     8 % über dem Maximum — das sind ~21 sd.
//   • **OR TTI 15000 → 13000** (12 % über dem Maximum) und **Start Score 40 → 55**
//     (min beobachtet 65). Beides echte Verschärfung ohne Flake-Risiko.
//   • **OR TBT bleibt 6500** — im Juli-Regime war die Verschärfung NICHT gelungen:
//     der Wert streut über die Runner mit CV 26.8 %, und der erste Versuch, das per
//     Job-Normierung herauszurechnen, war gemessen gescheitert (Block oben). 6500
//     lag 45 % über dem Ist bei ~4.7 % Rausch-Rot und 0/16 Überschreitungen.
//     Seit 3.8.2026 gilt die Zahl 6500 unverändert, aber für den NORMIERTEN Wert
//     (siehe Nachmessung unten) — die Schwelle wurde nicht bewegt, nur die
//     Messgrösse vom Runner-Zufall bereinigt.
//   • **OR CLS bleibt 0.05** (5× über dem Ist). CLS ist weiterhin der schärfste
//     geräteunabhängige Fänger — aber nicht mehr der einzige.
//
// OFFEN, bewusst nicht weggedeckelt: **OR-LCP ist bimodal** — 8× ~3.5 s und 8×
// ~11.3–11.6 s, nichts dazwischen, unabhängig von der Runner-Geschwindigkeit. Die
// naheliegende Erklärung (warm/kalt geladen) ist durch die Chrome-Isolation
// ausgeschlossen; vermutlich wählt Lighthouse je nach Timing ein anderes
// LCP-Element. Die sd von 4098 ms ist deshalb ein Artefakt der Zwei-Gipfel-Form,
// nicht echte Streuung: der hohe Modus ist in sich eng (11299…11613 ms, Spanne
// 314 ms), und 13500 liegt 16 % darüber. Der Deckel bleibt, bis die Ursache
// verstanden ist — als offener Schritt in ROADMAP/QS-PERF geführt.
const SCHWELLEN: Record<string, { url: string; label: string; s: Schwelle }> = {
  or: {
    url: `${BASE}/gesetze/bund/OR`,
    label: '/gesetze/bund/OR (≈930 KB HTML)',
    s: { clsMax: 0.05, lcpMax: 13500, tbtMax: 6500, ttiMax: 13000, scoreMin: 25 },
  },
  start: {
    url: `${BASE}/`,
    label: 'Startseite',
    s: { clsMax: 0.05, lcpMax: 10000, tbtMax: 400, ttiMax: 12000, scoreMin: 55 },
  },
  // ── DRITTE ROUTE: /gesetze (Übersicht) — neu 29.8.2026, Schritt W2·15-CLS ──
  //
  // WARUM SIE FEHLTE UND WAS DAS GEKOSTET HAT: der CLS-Deckel lief auf
  // `/gesetze/bund/OR` (Leser) und der Startseite — die ÜBERSICHT `/gesetze`
  // war in keinem Budget. Genau dort sass ein Lade-CLS von **0.4385** (Desktop
  // 1440×900, @8× und @4×, n=5, input-freie Shifts; mobil 412×823: 0.3364), und
  // er ist an jedem Tor vorbeigelaufen. Ein Defekt, den kein Tor beobachtet,
  // kommt wieder (§17) — darum ist die Verdrahtung hier der zweite, gleich
  // wichtige Teil des Schritts, nicht Beiwerk.
  //
  // WAS ASSERTIERT WIRD — und warum nur das (§8, §6.7):
  //   • **CLS 0.05** wie auf den beiden anderen Routen. CLS ist die
  //     geräteunabhängige Metrik (der Block oben: «weiterhin der schärfste
  //     geräteunabhängige Fänger»), sie braucht keine Runner-Kalibrierung, und
  //     sie ist die Metrik der gefundenen Defekt-Klasse. Der Deckel KANN
  //     scheitern und tut es nachweislich: gegen den ungefixten Stand
  //     (main 7ab30ea9e, PERF_BASE_URL auf dessen dist) meldet dieses Script
  //     «/gesetze (Übersicht): CLS 0.331 > 0.05» — Rot-Beweis 29.8.2026.
  //   • **LCP/TBT/TTI/Score: `null` = gemessen, gedruckt, NICHT assertiert.**
  //     Für diese vier ist der CI-Runner die bindende Grösse (Block oben), und
  //     dafür fehlt hier die Erhebung: es gibt keine 8er-/16er-Matrix auf
  //     unabhängigen Runnern für diese Route. Lokal (3 Läufe, 29.8.2026,
  //     Faktor 0.661) misst sie Score 76 · LCP 5.02 s · TBT roh 2 ms ·
  //     TTI 5.02 s; zum Vergleich lag die Startseite lokal bei TBT roh 22 ms
  //     gegen 138–281 ms auf CI — der Lokal-CI-Abstand ist metrikweise 7–10×
  //     und damit als Deckel-Grundlage untauglich. Ein geratener Deckel wäre
  //     entweder so weit, dass er nichts fängt, oder so eng, dass er
  //     Rausch-Rot erzeugt. Lieber eine ehrlich als «unkalibriert» gedruckte
  //     Zahl als eine hübsche (§8).
  //     NACHZUG: `perf-kalibrierung.yml` einmal über diese Route laufen lassen
  //     (die druckt den Messpunkt bereits mit, Schlüssel `uebersicht`), dann
  //     die vier Deckel nach dem Muster der 3.8.-Nachmessung setzen. Als
  //     offener Posten in FAHRPLAN-PERFORMANCE.md §2 vermerkt.
  uebersicht: {
    url: `${BASE}/gesetze`,
    label: '/gesetze (Übersicht)',
    s: { clsMax: 0.05, lcpMax: null, tbtMax: null, ttiMax: null, scoreMin: null },
  },
  // ── VIERTE ROUTE: Kanton-Leser — neu 31.8.2026, Schritt W2·13-KANTONE/K-11 ──
  //
  // WARUM SIE FEHLTE: die drei Routen oben decken Bund-Leser, Startseite und
  // Übersicht ab. Der KANTONALE Leserpfad — 1231 Erlasse, der wachsende Teil
  // des Korpus — stand in keinem Budget. Das Profil vom 31.8.2026
  // (bibliothek/seo/kanton-reader-profil-2026-08-31.md) hat genau dort die
  // teuerste Achse gemessen; ein Defekt, den kein Tor beobachtet, kommt
  // wieder (§17).
  //
  // WELCHER ERLASS: `SO-614.11` (Steuergesetz SO, 347 Artikel) ist mit **281 KB
  // Prerender-HTML** die schwerste kantonale Leserseite im Bestand (gemessen
  // 31.8.2026, `ls -lS dist/gesetze/kanton/*.html`). Dieselbe Logik, nach der
  // oben `/gesetze/bund/OR` als «die schwerste Leser-Seite» steht: ein Wächter
  // auf dem Normalfall bewacht den Ausreisser nicht mit, umgekehrt schon.
  //   EHRLICHE EINSCHRÄNKUNG (§8): «schwerste» heisst hier **nach HTML-Masse**,
  //   und das ist die für CLS/LCP bindende Grösse — Lighthouse lädt die Seite,
  //   nicht den Artikelbaum. Nach ARTIKELZAHL führt `SG-3849` mit 607 gegen 347
  //   (gemessen über `eintraege.length` aller 1232 Kanton-Snapshots), bei nur
  //   214 KB HTML. Wer den Wächter eines Tages um eine render-lastige Metrik
  //   erweitert, prüft zuerst, ob dafür SG-3849 die richtigere Route wäre.
  //
  // WAS ASSERTIERT WIRD — und warum nur das (§8, §6.7):
  //   • **CLS 0.05** wie auf den drei anderen Routen: geräteunabhängig, ohne
  //     Runner-Kalibrierung belastbar, und die Metrik der Defekt-Klasse, die
  //     `/gesetze` am 29.8.2026 unbemerkt passiert hat.
  //     KALIBRIERUNG DER ZAHL (K-11-Auflage «konservativ am Ist»): lokal
  //     gemessen 0.0143 (Median aus 3) bzw. 0.0155 (n=1) — der Deckel liegt
  //     also 3.2–3.5× über dem Ist. Das ist NICHT enger als bei den Nachbarn
  //     (OR misst 0.0014–0.0026 gegen denselben Deckel) und bleibt bewusst auf
  //     der Klassen-Zahl: 0.05 ist hier die Grenze zwischen «ruhiger Aufbau»
  //     und «sichtbarer Sprung», nicht ein aus dem Ist hochgerechneter Wert.
  //     Ein enger geschnittener Deckel (etwa 0.02) hätte auf einer Metrik, die
  //     lokal schon zwischen 0.0143 und 0.0155 wandert, Rausch-Rot-Potenzial,
  //     ohne eine Defekt-Klasse zusätzlich zu fangen.
  //   • **LCP/TBT/TTI/Score: `null` = gemessen, gedruckt, NICHT assertiert.**
  //     Für diese vier ist der CI-Runner die bindende Grösse (Block oben), und
  //     dafür fehlt hier — wie bei `uebersicht` — die Erhebung auf unabhängigen
  //     Runnern. Lokal gemessen 31.8.2026 (`PERF_RUNS=3 npm run
  //     check:perf-lighthouse -- --messen`, Normier-Faktor 0.468):
  //     Score 68 · CLS 0.014 · LCP 9.91 s · TBT roh 153 ms / normiert 327 ms ·
  //     TTI 9.91 s. Ein aus dem Lokalwert gegriffener Deckel wäre 7–10× neben
  //     dem CI-Ist (dieselbe Begründung wie bei `uebersicht`) — lieber eine
  //     ehrlich als «unkalibriert» gedruckte Zahl als eine hübsche (§8).
  //     NACHZUG: `perf-kalibrierung.yml` einmal über diese Route laufen lassen
  //     (Schlüssel `kantonleser`), dann die vier Deckel nach dem Muster der
  //     3.8.-Nachmessung setzen.
  //
  // ROT-BEWEIS (§6.7, 31.8.2026, beide lokal geführt):
  //   1. Schwelle testweise auf `clsMax: 0.005` → «check:perf-lighthouse ROT:
  //      ✗ /gesetze/kanton/SO-614.11 …: CLS 0.016 > 0.005», Exit 1, die drei
  //      Bestandsrouten blieben grün.
  //   2. `dist/gesetze/kanton/SO-614.11.html` weggeschoben → die Existenz-Sonde
  //      unten bricht mit Exit 1, BEVOR Lighthouse eine Fehlseite als CLS 0
  //      grün melden kann.
  //
  // KEINE Änderung an den drei Routen darüber (additiv, K-11-Auflage).
  kantonleser: {
    url: `${BASE}${KANTON_LESER_PFAD}`,
    label: `${KANTON_LESER_PFAD} (schwerste Kanton-Leserseite, 281 KB HTML)`,
    s: { clsMax: 0.05, lcpMax: null, tbtMax: null, ttiMax: null, scoreMin: null },
  },
};

// ── Preview-Server (falls nicht via PERF_BASE_URL extern gestellt) ───────────

async function warteAufPort(url: string, timeoutMs = 30_000): Promise<void> {
  const bis = Date.now() + timeoutMs;
  while (Date.now() < bis) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok || r.status === 404) return; // Server antwortet (404 = SPA-Route ok)
    } catch { /* noch nicht oben */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Preview-Server unter ${url} nicht erreichbar (Timeout ${timeoutMs} ms).`);
}

async function startePreview(): Promise<ChildProcess> {
  const p = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: false,
  });
  await warteAufPort(BASE);
  return p;
}

// ── Chrome-Auflösung ─────────────────────────────────────────────────────────

function chromePfad(): string | undefined {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    // Playwright-Chromium (in CI installiert) — hält die Messumgebung reproduzierbar.
    const { chromium } = requireCJS('@playwright/test');
    const p = chromium.executablePath();
    if (p && existsSync(p)) return p;
  } catch { /* Playwright nicht auflösbar → chrome-launcher-Default */ }
  return undefined; // chrome-launcher findet System-Chrome
}

// ── Lighthouse-Lauf ──────────────────────────────────────────────────────────

type Metrik = { cls: number; lcp: number; tbt: number; tti: number; score: number; lcpElement: string | null };

/**
 * LCP-Element-Attribution (AUFGABE A, QS-PERF 15.9.2026, reine Diagnose zur
 * OR-LCP-Bimodalität 3.5 s/11.4 s — Ursache oben als offen geführt).
 *
 * Im installierten Paket (lighthouse@13.4.1) heisst das Companion-Audit NICHT
 * mehr `largest-contentful-paint-element` — dieser Audit-Id ist mit
 * Lighthouse ≥10 entfallen (node_modules/lighthouse/changelog-pre10.md).
 * Beide Nachfolge-Insights liefern ihr Node-Detail über dieselbe Helferkette
 * (`makeNodeItemForNodeId` → `Audit.makeNodeItem`, insight-audit.js /
 * audit.js) als FLACHES Listen-Item mit `type:'node'` — NICHT als
 * `items[0].items[0].node`.
 *
 * NACHBESSERUNG (Bug-Check PR #874): `lcp-discovery-insight` allein liefert
 * bei Text-LCP (Startseiten-h1 — genau unser Diagnosefall) IMMER `details:
 * undefined`. Grund, geprüft im Quellcode:
 *   - node_modules/@paulirish/trace_engine/models/trace/insights/
 *     LCPDiscovery.js:79-129 (`generateInsight`) setzt `checklist` NUR, wenn
 *     ein `lcpRequest` existiert — das ist der Bild-Ladevorgang. Bei Text-LCP
 *     gibt es keinen `lcpRequest`, `finalize({ lcpEvent })` liefert also ein
 *     Modell OHNE `checklist`.
 *   - node_modules/lighthouse/core/audits/insights/lcp-discovery-insight.js:
 *     `if (!insight.checklist) { return; }` — der Audit liefert dann gar
 *     keine Details, `insight-audit.js` reicht `details: undefined` durch.
 *
 * Zuverlässige Quelle für BEIDE LCP-Arten ist `lcp-breakdown-insight`
 * (`replacesAudits: ['largest-contentful-paint-element']`, guidanceLevel 3):
 *   - node_modules/@paulirish/trace_engine/models/trace/insights/
 *     LCPBreakdown.js:76-77 («If the LCP is text, we don't have a request,
 *     so just 2 subparts») — `subparts` (und damit `details`) wird für
 *     Text-LCP MIT NUR 2 statt 4 Teilstrecken gesetzt, nicht weggelassen.
 *   - node_modules/lighthouse/core/audits/insights/lcp-breakdown-insight.js
 *     baut `details` als `Audit.makeListDetails([subpartsTable,
 *     makeNodeItemForNodeId(...)])` — dieselbe flache `type:'node'`-Item-Form
 *     wie bei `lcp-discovery-insight`, der bestehende Scan über `items` greift
 *     also unverändert.
 * Primärquelle daher `lcp-breakdown-insight`, Rückfall auf
 * `lcp-discovery-insight` (deckt den Sonderfall ab, dass Breakdown zwar läuft,
 * aber `makeNodeItemForNodeId` keinen Knoten findet und die Liste dadurch nur
 * die Tabelle ohne Node-Item enthält), sonst `null`.
 */
function lcpElementAusInsight(
  audits: Record<string, { details?: unknown }>,
  auditId: string,
): string | null {
  const details = audits[auditId]?.details as { items?: unknown[] } | undefined;
  const items = Array.isArray(details?.items) ? details.items : [];
  const nodeItem = items.find((i): i is { nodeLabel?: unknown; selector?: unknown } =>
    !!i && typeof i === 'object' && (i as { type?: unknown }).type === 'node');
  if (!nodeItem) return null;
  const label = typeof nodeItem.nodeLabel === 'string' ? nodeItem.nodeLabel.trim() : '';
  const selector = typeof nodeItem.selector === 'string' ? nodeItem.selector : '';
  return label || selector || null;
}

function lcpElementAus(audits: Record<string, { details?: unknown }>): string | null {
  return (
    lcpElementAusInsight(audits, 'lcp-breakdown-insight') ??
    lcpElementAusInsight(audits, 'lcp-discovery-insight')
  );
}

/** Zeile auf ≤ `max` Zeichen kürzen (Konsolen-Lesbarkeit, Auflage der Aufgabe). */
const kurz = (zeile: string, max = 80): string => (zeile.length <= max ? zeile : `${zeile.slice(0, max - 1)}…`);

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Frische Chrome-Instanz je Messung (Baustelle A1). Vorher teilte das Script EINE
 * Instanz über alle Läufe beider Seiten; sie driftete, und die zuletzt gemessene
 * Seite erbte die Drift (Beleg im RUNS-Kommentar oben). Kosten der Isolation:
 * ~1–2 s je Lauf — der Preis dafür, dass jeder Lauf dieselbe Ausgangslage hat.
 */
async function mitFrischemChrome<T>(fn: (port: number) => Promise<T>): Promise<T> {
  const chrome = await chromeLauncher.launch({
    chromePath: chromePfad(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  try {
    return await fn(chrome.port);
  } finally {
    await chrome.kill();
  }
}

async function einLauf(url: string): Promise<Metrik> {
  return mitFrischemChrome(async (port) => {
  // Default = Mobil-Preset: cpuSlowdownMultiplier 4 + langsames 4G (das Audit-Profil).
  const runner = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance'],
  });
  if (!runner) throw new Error(`Lighthouse lieferte kein Ergebnis für ${url}.`);
  const lhr = runner.lhr;
  const num = (id: string): number => Number(lhr.audits[id]?.numericValue ?? NaN);
  return {
    cls: num('cumulative-layout-shift'),
    lcp: num('largest-contentful-paint'),
    tbt: num('total-blocking-time'),
    tti: num('interactive'),
    score: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    lcpElement: lcpElementAus(lhr.audits),
  };
  });
}

// ── Kalibrier-Referenz je Job (Baustelle A2) ─────────────────────────────────

/**
 * Schreibt die synthetische Kalibrier-Seite nach `dist/`. Sie enthält KEINEN
 * App-Code, kein Netz, keine Bilder — nur eine deterministische Integer-Schleife
 * in KALIBRIER_BLOECKE gleich grossen Tasks, gestartet nach dem ersten Paint
 * (damit die Blockzeit im TBT-Fenster FCP→TTI liegt). Ihr TBT hängt damit
 * ausschliesslich an der Rechenleistung des Runners.
 *
 * Die Seite wird zur Laufzeit erzeugt (nicht committet): sie ist Messinstrument,
 * kein Produkt-Inhalt, und darf nie im ausgelieferten Build landen. `dist/` wird
 * in CI ohnehin je Lauf frisch aus dem Artefakt gezogen.
 */
function schreibeKalibrierSeite(): string {
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Perf-Kalibrierung (Messinstrument, kein Inhalt)</title></head>
<body><h1>Kalibrier-Last</h1>
<p>Synthetische, deterministische CPU-Last zur Job-Normierung des Perf-Tors.</p>
<script>
(function () {
  var bloecke = ${KALIBRIER_BLOECKE}, iter = ${KALIBRIER_ITER}, x = 1, n = 0;
  function block() {
    for (var i = 0; i < iter; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; }
    if (++n < bloecke) setTimeout(block, 0);
    else document.title = 'kalibriert ' + x;
  }
  addEventListener('load', function () { setTimeout(block, 0); });
})();
</script>
</body></html>
`;
  const pfad = join(process.cwd(), 'dist', '_perf-kalibrier.html');
  writeFileSync(pfad, html);
  return `${BASE}/_perf-kalibrier.html`;
}

/** Median-TBT der Kalibrier-Seite = Geschwindigkeits-Fingerabdruck dieses Jobs. */
async function kalibriere(): Promise<number> {
  const url = schreibeKalibrierSeite();
  const werte: number[] = [];
  for (let i = 0; i < KALIBRIER_RUNS; i++) werte.push((await einLauf(url)).tbt);
  const m = median(werte);
  console.log(
    `  Kalibrier-Referenz (synthetische CPU-Last, ${KALIBRIER_BLOECKE}×${KALIBRIER_ITER.toLocaleString('de-CH')} Iter.)\n` +
    `    Einzelläufe TBT: ${werte.map((v) => Math.round(v)).join(' · ')} ms  →  Median ${Math.round(m)} ms`,
  );
  return m;
}

// N Läufe → Median je Metrik (Ausreisser-Flake auf geteiltem CI-Runner dämpfen).
// Die Einzelwerte werden mitgedruckt (Diagnose, ändert nichts am Verdikt): nur so
// ist im CI-Log unterscheidbar, ob ein roter Median echte Last ist oder ein über
// die Läufe driftender Messaufbau (siehe RUNS-Kommentar oben) — sonst diskutiert
// die nächste Session wieder über eine einzelne Zahl ohne Streuung (§8).
async function messe(url: string): Promise<{ cls: number; lcp: number; tbt: number; tti: number; score: number; lcpElement: Array<string | null> }> {
  const laeufe: Metrik[] = [];
  for (let i = 0; i < RUNS; i++) laeufe.push(await einLauf(url));
  console.log(`    Einzelläufe TBT: ${laeufe.map((m) => Math.round(m.tbt)).join(' · ')} ms`
    + `  |  LCP: ${laeufe.map((m) => (m.lcp / 1000).toFixed(1)).join(' · ')} s`);
  // LCP-Element je Lauf (AUFGABE A): eigene Zeile statt in die Zahlen-Zeile
  // gemischt — damit bleibt die Bimodalität (OR 3.5 s/11.4 s) auf einen Blick
  // einem LAUF zuordenbar, nicht nur einer gemittelten Zahl. `?? 'unbekannt'`
  // ist nie stumm: fehlt das Audit, steht das ausdrücklich in der Zeile.
  laeufe.forEach((m, i) => {
    const lauf = RUNS > 1 ? ` (Lauf ${i + 1}/${RUNS})` : '';
    console.log(kurz(`    LCP-Element${lauf}: ${m.lcpElement ?? 'unbekannt'}`));
  });
  return {
    cls: median(laeufe.map((m) => m.cls)),
    lcp: median(laeufe.map((m) => m.lcp)),
    tbt: median(laeufe.map((m) => m.tbt)),
    tti: median(laeufe.map((m) => m.tti)),
    score: median(laeufe.map((m) => m.score)),
    lcpElement: laeufe.map((m) => m.lcpElement),
  };
}

// ── Hauptlauf ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!existsSync(join(process.cwd(), 'dist', 'index.html'))) {
    console.error('check:perf-lighthouse — dist/ fehlt. Zuerst `npm run build`.');
    process.exit(1);
  }
  // Existenz-Sonde für die Kanton-Leser-Route (K-11): fehlt der Prerender, misst
  // Lighthouse die Fehlseite — mit tadellosem CLS, also STILL GRÜN. Lieber hier
  // laut brechen und den Schlüssel bewusst nachziehen (§6.7/§8).
  const kantonPrerender = join(process.cwd(), 'dist', 'gesetze', 'kanton', `${KANTON_LESER_SCHLUESSEL}.html`);
  if (!existsSync(kantonPrerender)) {
    console.error(
      `check:perf-lighthouse — Messobjekt fehlt: ${kantonPrerender}\n` +
      `  Der Kanton-Leser-Wächter (K-11) misst '${KANTON_LESER_PFAD}'. Ist der Erlass aus dem\n` +
      `  Korpus gefallen oder umbenannt, wäre die Messung eine Fehlseite mit CLS 0 — still grün.\n` +
      `  Darum: KANTON_LESER_SCHLUESSEL in dieser Datei auf einen vorhandenen schweren\n` +
      `  Kanton-Erlass ziehen (Kandidaten: \`ls -lS dist/gesetze/kanton/*.html | head\`).`,
    );
    process.exit(1);
  }

  let preview: ChildProcess | undefined;
  const fehler: string[] = [];
  const bericht: Record<string, unknown> = {};

  try {
    if (!process.env.PERF_BASE_URL) preview = await startePreview();

    console.log(`check:perf-lighthouse — Lighthouse-Mobil (4× CPU + langsames 4G), frische Chrome-Instanz je Lauf, Median aus ${RUNS} ${RUNS === 1 ? 'Lauf' : 'Läufen'}:`);

    // Job-Normierung: zuerst die Referenzlast messen (Baustelle A2).
    let faktor: number | undefined;
    let kalib: number | undefined;
    if (NORMIEREN) {
      kalib = await kalibriere();
      if (kalib >= KALIBRIER_MIN && kalib <= KALIBRIER_MAX) {
        faktor = kalib / KALIBRIER_BASIS;
        console.log(
          `    Normier-Faktor ${faktor.toFixed(3)} (Basis ${KALIBRIER_BASIS} ms)` +
          ` — dieser Runner ist ${faktor >= 1 ? `${((faktor - 1) * 100).toFixed(0)} % langsamer` : `${((1 - faktor) * 100).toFixed(0)} % schneller`} als die Basis.`,
        );
      } else {
        console.log(
          `    ⚠ Kalibrierung UNPLAUSIBEL (${Math.round(kalib)} ms ausserhalb ${KALIBRIER_MIN}–${KALIBRIER_MAX} ms).\n` +
          `      Es wird NICHT normiert; assertiert wird nur der weite Roh-Deckel. Kein stilles Durchwinken (§8).`,
        );
      }
    } else {
      console.log('    (Normierung per PERF_NORMIEREN=0 abgeschaltet — nur Roh-Deckel.)');
    }
    bericht.kalibrierTbt = kalib ?? null;
    bericht.kalibrierFaktor = faktor ?? null;

    for (const [key, { url, label, s }] of Object.entries(SCHWELLEN)) {
      const m = await messe(url);
      const tbtNorm = faktor ? m.tbt / faktor : undefined;
      // BEWERTETE TBT (Entscheid David 3.8.2026): der normierte Wert, sofern eine
      // plausible Kalibrierung vorliegt — sonst der Rohwert (konservativer Fallback,
      // Begründung im NORMIEREN-Block oben). Beide Werte gehen in den Bericht.
      const tbtBewertet = tbtNorm ?? m.tbt;
      bericht[key] = { ...m, tbtNorm: tbtNorm ?? null, tbtBewertet };
      // «unkalibriert» statt einer Deckel-Zahl, wo die Schwelle `null` ist —
      // der Wert wird gemessen und gedruckt, aber nicht assertiert (§8).
      const d = (v: number | null, einheit = '') => (v === null ? 'unkalibriert' : `${v}${einheit}`);
      console.log(
        `  ${label}\n` +
        `    Score ${m.score} (≥ ${d(s.scoreMin)})  ` +
        `CLS ${m.cls.toFixed(3)} (≤ ${s.clsMax})  ` +
        `LCP ${(m.lcp / 1000).toFixed(2)} s (≤ ${s.lcpMax === null ? 'unkalibriert' : `${(s.lcpMax / 1000).toFixed(1)} s`})  ` +
        (tbtNorm !== undefined
          ? `TBT ${Math.round(tbtNorm)} ms normiert (≤ ${d(s.tbtMax)}) · roh ${Math.round(m.tbt)} ms [Transparenz]  `
          : `TBT ${Math.round(m.tbt)} ms roh (≤ ${d(s.tbtMax)}, keine Kalibrierung)  `) +
        `TTI ${(m.tti / 1000).toFixed(2)} s (≤ ${s.ttiMax === null ? 'unkalibriert' : `${(s.ttiMax / 1000).toFixed(1)} s`})`,
      );
      if (!MESSEN_NUR) {
        // §6.7-Backstop (Bug-Check #565 B1): liefert Lighthouse keinen numericValue
        // (z.B. NO_FCP), wäre NaN > clsMax === false und die Route STILL grün —
        // bei scoreMin:null (uebersicht) fing das sonst niemand.
        if (!Number.isFinite(m.cls) || m.cls > s.clsMax) fehler.push(`${label}: CLS ${Number.isFinite(m.cls) ? m.cls.toFixed(3) : 'NICHT MESSBAR'} > ${s.clsMax} (Layout-Sprung — §15/2, höchste Prio).`);
        if (s.lcpMax !== null && m.lcp > s.lcpMax) fehler.push(`${label}: LCP ${(m.lcp / 1000).toFixed(2)} s > ${(s.lcpMax / 1000).toFixed(1)} s.`);
        // TBT wird seit 3.8.2026 auf dem NORMIERTEN Wert assertiert (Entscheid David
        // «Option normiert»), der Deckel selbst ist unverändert.
        // §15-LOGIKVERLUST-BEWERTUNG: KEINE. Die Schwelle bleibt bei 6500 ms; es
        // wechselt allein die Messgrösse, und zwar um den Runner-Zufall aus ihr zu
        // entfernen. Ein echtes Seiten-Regress (mehr Skript-Arbeit im Hauptthread)
        // erhöht Roh- und Normwert im selben Verhältnis und schlägt im normierten
        // Wert genauso an — die Normierung teilt durch die Runner-Geschwindigkeit,
        // nicht durch die Seitenlast. Weder Inhalts-, Rechtsregel- noch
        // Funktions-Treue sind berührt (§15: reines Messregime, kein App-Code).
        if (s.tbtMax !== null && tbtBewertet > s.tbtMax) {
          fehler.push(
            tbtNorm !== undefined
              ? `${label}: TBT ${Math.round(tbtNorm)} ms normiert > ${s.tbtMax} ms (roh ${Math.round(m.tbt)} ms).`
              : `${label}: TBT ${Math.round(m.tbt)} ms roh > ${s.tbtMax} ms (keine gültige Kalibrierung — Rohwert-Fallback).`,
          );
        }
        if (s.ttiMax !== null && m.tti > s.ttiMax) fehler.push(`${label}: TTI ${(m.tti / 1000).toFixed(2)} s > ${(s.ttiMax / 1000).toFixed(1)} s.`);
        if (s.scoreMin !== null && m.score < s.scoreMin) fehler.push(`${label}: Score ${m.score} < ${s.scoreMin}.`);
      }
    }

    // Bericht persistieren (Diagnose/Trend, nicht committet).
    const outDir = join(process.cwd(), 'dist', '_perf');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'lighthouse.json'), JSON.stringify(bericht, null, 2));
    // Eine maschinenlesbare Zeile — so lässt sich eine Messreihe über mehrere
    // (Matrix-)Jobs hinweg direkt aus den Logs aggregieren, ohne Artefakte
    // einzusammeln. Wird von `.github/workflows/perf-kalibrierung.yml` genutzt.
    console.log(`PERF-MESSPUNKT ${JSON.stringify(bericht)}`);
  } finally {
    // Chrome-Instanzen werden je Lauf in `mitFrischemChrome` geschlossen (A1).
    if (preview) preview.kill('SIGTERM');
  }

  if (MESSEN_NUR) {
    console.log('check:perf-lighthouse — nur Messung (keine Assertion).');
    return;
  }
  if (fehler.length) {
    console.error('\ncheck:perf-lighthouse ROT:');
    for (const f of fehler) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  // Die Schlusszeile benennt, WORAUF assertiert wurde — im Fallback ist das der
  // Rohwert, und dann darf hier nicht «normiert» stehen (§8).
  console.log(
    `check:perf-lighthouse GRÜN — Metrik-Schranken (CLS/LCP/TBT[${bericht.kalibrierFaktor ? 'normiert' : 'roh, ohne Kalibrierung'}]/TTI/Score) eingehalten.`,
  );
}

main().catch((e) => {
  console.error('check:perf-lighthouse — Fehler:', e instanceof Error ? e.message : e);
  process.exit(1);
});
