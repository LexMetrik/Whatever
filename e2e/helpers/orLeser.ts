// e2e/helpers/orLeser.ts — DIE EINE Frist für Wartepunkte auf den geladenen
// OR-Leser (§17-Wurzelfix, FAHRPLAN-OFFENE-BEFUNDE «OR-Leser-e2e auf
// 60-s-Budget härten», 12.9.2026).
//
// ── WOFÜR ─────────────────────────────────────────────────────────────────
// `/gesetze/bund/OR` ist die schwerste Leser-Seite (OR.json ~1.9 MB, ~1'700
// Artikel). Die Detailseite liefert nur prerendertes Volltext-HTML OHNE
// `id="art-1"`; React ersetzt es clientseitig erst NACH Fetch+Parse
// (render-then-replace, §15.5, kein hydrateRoot). `#art-1` ist darum das
// etablierte Client-Takeover-Signal — bis dahin wartet jede Spec, die danach
// etwas im Reader prüft.
//
// #682 (5.9.2026) hatte genau diese Wartung für zwei Specs schon auf 20-45 s
// gehärtet, aber je Datei mit einer LOKAL DUPLIZIERTEN Konstante
// (`norm-sprung.e2e.ts`: 30 s, `leser-suche-a35-a40-a41.e2e.ts`: 45 s) —
// «#682 härtete nur norm-sprung/leser-suche» (Fahrplan-Eintrag). Diese Datei
// zieht die Frist an EINER Stelle zusammen, statt sie ein drittes Mal zu
// kopieren.
//
// ── ROT-/GRÜN-BEWEIS (12.9.2026, CDP-CPU-Drossel wie `leserBereit.ts`) ──────
// Playwright-Default-Timeout ist 10 s (`playwright.config.ts` `expect.timeout`).
// A/B auf `/gesetze/bund/OR`, `page.waitForSelector('#art-1', {visible:true})`,
// frischer Browser-Kontext je Lauf:
//
//   Drossel   Timeout    n    ROT     tatsächliche Dauer
//   10x       10 000 ms  8    8/8     10.7–10.9 s (reisst KNAPP über die Frist)
//   10x       60 000 ms  8    0/8     12.1–12.9 s (deutlich unter der Frist)
//
// Der 2-vCPU-CI-Runner unter Parallel-Last (mehrere Shards/Worker) entspricht
// dieser Grössenordnung (vgl. `leserBereit.ts`, dieselbe Drossel-Methodik).
// Das ENGSTE Glied ist die 10-s-Default-Frist, nicht die Software — dieselbe
// Diagnose wie #682 (norm-sprung.e2e.ts, leser-suche-a35-a40-a41.e2e.ts) und
// wie `leser-*`-Specs, die bereits 20–40 s tragen.
//
// ── WAS HIER NICHT PASSIERT (§6.3) ──────────────────────────────────────────
// Keine Assertion gelockert — nach wie vor `toBeVisible`, dieselbe Sachaussage
// (`#art-1` bzw. der Ziel-Anker steht im DOM und ist sichtbar). Der Timeout
// greift nur bei Überschreitung und bremst grüne Läufe nicht.
/** Budget für Wartepunkte, die auf den geladenen/hydratisierten OR-Leser
 *  warten (Rot-/Grün-Beweis oben). Ersetzt die bisherigen Datei-lokalen
 *  Konstanten (30 s / 45 s) durch EINEN Wert. */
export const OR_LESER_FRIST = 60_000
