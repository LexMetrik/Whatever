// @shard-gruppe: 1
import { test, expect, type Page } from '@playwright/test';
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls';
import { F_BLOCK, blattFuerArtikel, blattReiter, fassungAufklappen, fassungsMarke } from './helpers/fassungsRubrik';

// ── §6.3-DEKLARATION · S6 W1f (Entscheid David 24.9.2026) · DER ORT WECHSELT ──
// Wörtlich: «die zeile soll ganz weg. infos sollen alle im blatt erscheinen».
// Die Fassung steht seither als Klappzeile «Fassung dieses Artikels» oben im
// Reiter «Änderungen» des Erlass-Blatts (`v3/BlattArtikel.tsx`). Diese Sonde
// folgt dem Ort ein zweites Mal; die Zusagen bleiben: Stand-Text, Zeitleiste,
// kein Eintrag ohne Historie, keiner ohne Shard, kein CLS beim Aufklappen,
// kein Sprung am Artikel beim Eintreffen des Shards. Der Positiv-Beleg des
// Einwuchs-Falls ist jetzt die Druck-Projektion `[data-hist-druck]` — das
// einzige, was am Artikel noch mit dem Shard einwächst.

// ── §6.3-DEKLARATION · W2·24-D40 (David 7.9.2026) · DER ORT HAT GEWECHSELT ──
// Wörtlich: «und wieso ist fassung nicht auch unten am artikel?». Die Auskunft
// steht seither in der Funktionszeile am Artikelende, als Rubrik «n Fassungen ›»
// (`helpers/fassungsRubrik.ts`); der Kopf-Slot `[data-hist-slot]` samt seiner
// 24-px-Reserve ist ersatzlos gefallen. Diese Sonde folgt dem Ort — jede ZUSAGE
// darunter bleibt dieselbe: Badge-Text, Zeitleiste, kein Badge ohne Eintrag,
// kein Badge ohne Shard, kein CLS beim Aufklappen, kein Sprung beim Einwuchs.
//
// EINE Zusage ist SCHÄRFER geworden, nicht schwächer: der Einwuchs-Test misst
// jetzt die Geometrie beim Eintreffen der MARKE (und nicht mehr die einer
// Reservierung, die es nicht mehr gibt). Gemessen 7.9.2026 an fünf Erlassen
// @1440 (BGBM/ZPO/OR/StPO/ZGB): 0 verschobene Artikel, CLS 0.00000.
//
// G-HIST-UI — «Gilt seit»-Badge + aufklappbare Fassungs-Timeline aus dem erlass-
// lokalen Historie-Shard (public/normtext/historie/<KEY>.json, G-HIST #286).
//   · Badge zeigt das In-Kraft-Datum der aktuellen Fassung eines Artikels mit
//     bekannter Historie (BGBM Art. 2 → «Gilt seit 01.01.2025»).
//   · Timeline klappt auf und listet die amtlichen Fassungs-Ereignisse.
//   · Artikel ohne Historie-Eintrag (BGBM Art. 6) → KEIN Badge (§8).
//   · Erlass ohne Shard (CISG, Staatsvertrag) → nirgends ein Badge.
//   · CLS: Timeline-Aufklappen (echter Input) verursacht keinen Shift.
//   · Der Badge-Einwuchs am Artikel-Fuss verschiebt nichts (§15.2, Reservierung)
//     — geprüft an der GEOMETRIE, nicht am CLS-Budget (S1-Nachzug, s. u.).
//
// ── FLAKE-WURZEL (S1, 17.8.2026 — Fahrplan Kap. 14 weist diese Datei S1 zu) ───
// Die Datei stand als Flake auf der Liste. KEIN Timeout, KEINE Retry-Erhöhung —
// hier die Diagnose und der Wurzel-Fix (§17).
//
// REPRODUKTION (Messbedingung genannt, §0 Ziff. 3): lokal, macOS, 10 Kerne, WARM
// (dist gebaut, `vite preview` wiederverwendet).
//   · ganze Datei, volle Parallelität (5 Tests / 5 Worker):  1 von 10 Läufen ROT
//   · NUR dieser Test, isoliert:                             0 von 20 Läufen ROT
//   · isoliert unter CPU-Drossel 1× / 4× / 8×:               0 von 13, CLS stabil
//                                                            0.0058–0.0075
// Der Treiber ist also PARALLEL-LAST, nicht CPU-Tempo — und die Streuung ist
// bimodal (≈0.006 gegen 0.119), keine Wolke um die Schwelle.
//
// URSACHE (aus dem roten Lauf, Diagnose-Bericht des CLS-Helfers): der Test
// installierte den Beobachter mit `buffered: true` und rechnete damit ALLE
// Layout-Shifts seit der Navigation dem Badge zu. Der dominante Shift ist aber
// nicht der Badge, sondern der Reader-Kopf, der nach dem Client-Takeover seinen
// Inhalt einträgt: `⇑Wachser: header +161px→238, h1 +49px→75`, Quelle
// `div.flex.shrink-0 1121,71·135×24→680,71·576×24`. Dieser Reflow passiert in
// JEDEM Lauf (in 20 Sonden-Läufen als Δ0.0052 messbar). Er wird nur dann zu
// Δ0.1190, wenn die Artikelliste zu diesem Zeitpunkt SCHON GEMALT ist — dann
// liegt das 976×312 grosse Lese-Grid in seiner Wirkfläche. Ob sie gemalt ist,
// entscheidet die Parallel-Last. Der Badge selbst tauchte in keinem der Läufe
// unter den Top-Quellen auf: seine Höhe ist reserviert (`mt-4 min-h-beiwerk`,
// ArtikelHistorie.tsx), er trägt ~0 bei.
//
// Das ist DIESELBE Fehlerklasse, die `helpers/cls.ts` am 20.7.2026 schon einmal
// behoben hat (Messfenster-Korrektur, `nurAbInstall`) — dort ausdrücklich für die
// A9-Interaktions-Tests, und für DIESEN Test damals bewusst NICHT: «für einen
// LADE-CLS-Test ist das genau richtig». Der Satz stimmt für ein Seiten-Budget,
// nicht für einen Badge-Test. Ein Tor, das das Falsche misst, ist schlimmer als
// keines (§6.7).
//
// WURZEL-FIX: die Messung deckt sich jetzt mit dem Prüfgegenstand. Der
// Historie-Shard wird per `page.route` ANGEHALTEN, bis der Reader fertig steht;
// erst dann wird der Shard freigegeben. Gemessen wird also genau der
// Badge-Einwuchs, und zwar an der Reservierung selbst: die y-Position der
// folgenden Artikel und die Seitenhöhe müssen EXAKT gleich bleiben.
//
// ── S1-NACHZUG (17.8.2026): die CLS-Zusicherung dieses Tests ist GESTRICHEN ───
// Bis hierher stand unter den Geometrie-Zeilen zusätzlich
// `expect(cls).toBeLessThan(0.05)` mit dem Satz «die Zusicherung ist NICHT
// gelockert». Der Bug-Check-Prüfer hat sie als nicht-scheiterbar gemeldet; die
// Mutations-Sonde (§6.7) bestätigt das. Gemessen, alles WARM, chromium:
//
//   Mutation: `min-h-beiwerk` am Slot entfernt (ArtikelLeser.tsx) —
//   also genau der Defekt, den der Satz benennt («die Reservierung greift nicht»).
//     · GEOMETRIE  → ROT: «Artikel 2 verschoben: 1516 → 1552»,
//                    Seitenhöhe 10735 → 10807.
//     · CLS        → 0.00000, Zusicherung GRÜN. Grund: alle hist-Slots von BGBM
//                    liegen below-fold (art-2 bei y≈1516, Ausschnitt 720 px),
//                    und CLS zählt nur Verschiebungen IM Ausschnitt.
//
//   Gegenprobe, damit die Streichung nicht auf einem Messaufbau-Zufall beruht:
//   dieselbe Mutation mit dem Slot IM Ausschnitt (auf art-1s Slot gescrollt,
//   > 500 ms Abstand zum hadRecentInput-Fenster) ergibt CLS 0.0118515625 —
//   3/3 Läufe bitgleich, Scroll-Anchoring greift nicht ein. Auch das reisst die
//   Schwelle 0.05 NICHT. Die Zeile kann den Defekt, den sie benennt, in keinem
//   Aufbau melden; erst eine andere, engere Schwelle könnte es, und die wäre
//   nicht mehr die des Lighthouse-Tors.
//
// Also: gestrichen statt bewacht (§17-Rückbau, Präzedenz `seq-hart`). Der Test
// wird von den drei Geometrie-Zeilen getragen — sie sind SCHÄRFER als das
// Budget (exakte Gleichheit statt Schwelle) und unter der Mutation rot gezeigt.
// Mit der Zusicherung fällt auch der von Hand gerollte PerformanceObserver: er
// hatte keinen Verbraucher mehr.
//
// Das SEITEN-Lade-CLS bleibt gedeckt, und zwar dort, wo es hingehört: im
// Lighthouse-Tor `check:perf-lighthouse` (`scripts/perf/lighthouse-budget.ts`,
// `clsMax: 0.05` auf /gesetze/bund/OR UND Startseite).
//
// KORREKTUR derselben Runde (Bug-Check B1): hier stand «Lighthouse-Tor
// `check:perf-budget`» — falsch, zwei Fehler in einem Satz.
// `check:perf-budget` (`scripts/check-perf-budget.ts`) ist bewusst Chrome-frei
// und misst gzip-BYTES der Bundle-Topologie; eine CLS-Schranke kennt es nicht.
// Und das Lighthouse-Tor ist KEIN Merge-Blocker: der ci.yml-Job `perf` trägt
// `if: github.event_name != 'pull_request' && needs.diff.outputs.art == 'code'`,
// läuft also erst nach dem Merge auf main/merge_group. Die Deckung ist real,
// aber nachgelagert.
//
// Der Kopf-Reflow ist damit weiter bewacht — nur nicht mehr unter dem Namen des
// Badges. Er ist ein echter Befund und steht als eigene Zeile im
// Roadmap-Schritt QS-PERF (S1-Nachzug, §17), nicht in S1.

async function warteReader(page: Page, url: string, artId: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator(`#${artId}`)).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
}

test('Badge zeigt das In-Kraft-Datum der aktuellen Fassung (BGBM Art. 2)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BGBM', 'art-2');
  const art = page.locator('#art-2');
  await art.scrollIntoViewIfNeeded();
  // D40: die Marke wächst mit dem idle-Shard-Resolve in die Funktionszeile ein
  // und nennt die Zahl der Fassungen; das Datum steht im Block darunter.
  // §6.3-DEKLARATION (W2·26/Z2, Mandat David 11.9.2026): «Fassung soll nur
  // ‹gilt seit XXX› zeigen, erst beim Aufklappen erscheinen die Angaben». Die
  // Marke liest zugeklappt darum den STAND, aufgeklappt die ZAHL. Die Zusage
  // dieses Falls — das In-Kraft-Datum der aktuellen Fassung steht am Artikel —
  // ist unverändert und wird jetzt an BEIDEN Zuständen geprüft, also strenger.
  // S6 W1f: zugeklappt nennt die Klappzeile den Stand, aufgeklappt steht die
  // Zeile «Fassung · Gilt seit …» samt Zeitleiste darunter.
  const marke = await fassungsMarke(art);
  await expect(marke).toContainText(/Gilt seit\s+01\.01\.2025/);
  const zeile = await fassungAufklappen(art);
  await expect(marke).toHaveAttribute('aria-expanded', 'true');
  await expect(zeile.getByText('Fassung', { exact: true })).toBeVisible();
  await expect(zeile.getByText(/Gilt seit\s+01\.01\.2025/)).toBeVisible();
});

test('Timeline klappt auf und listet Fassungs-Ereignisse; Aufklappen ohne CLS', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BGBM', 'art-2');
  const art = page.locator('#art-2');
  await art.scrollIntoViewIfNeeded();
  // D40: der Griff ist die Rubrik-Marke, nicht mehr ein Knopf IN der Zeile —
  // ein zweiter Knopf im aufgeklappten Block täte dasselbe noch einmal (§5).
  // S6 W1f: der Griff ist die Klappzeile im Blatt (Helfer), der Block ihr Inhalt.
  const badge = await fassungsMarke(art);
  await expect(badge).toHaveAttribute('aria-expanded', 'false');

  // CLS-Beobachter NUR für den Toggle (input-exkludiert → muss 0 bleiben, wie K-2).
  //
  // S1-NACHZUG (17.8.2026, Bug-Check B2): hier stand ein von Hand gerollter
  // PerformanceObserver, obwohl `helpers/cls.ts` genau diesen Beobachter führt —
  // eine zweite Wahrheit für dieselbe Messung (§5), und die Messfenster-Lehre vom
  // 20.7.2026 (`nurAbInstall`) lag nur im Helfer. `nurAbInstall: true` zählt ab
  // dem Install-Zeitpunkt, also genau das Toggle-Fenster; `buffered: false`
  // schliesst den Seitenaufbau aus. Verhalten identisch zum ersetzten Code — der
  // Gewinn ist der Quellen-`bericht` unten, der bei einem roten Lauf sagt, WELCHES
  // Element geschoben hat (Diagnosewerkzeug, keine Zusicherung).
  await clsBeobachtenInstallieren(page, false, true);

  await badge.click();
  await expect(badge).toHaveAttribute('aria-expanded', 'true');
  // Aufgeklappte Timeline: die Ereignis-Liste ist da und trägt ≥1 datierten Eintrag.
  const liste = page.locator(`${F_BLOCK}[data-v3-blatt-fassung="2"] ol`);
  await expect(liste).toBeVisible();
  await expect(liste.locator('li').first()).toBeVisible();
  await expect(liste.getByText(/in Kraft seit\s+01\.01\.2025/).first()).toBeVisible();

  // Wieder einklappen.
  await badge.click();
  await expect(badge).toHaveAttribute('aria-expanded', 'false');
  // D40: eine zugeklappte Rubrik rendert ihren Inhalt GAR NICHT (D35-F1) — das
  // ist schärfer als `toBeHidden` und zugleich der Grund, warum das Aufklappen
  // nichts kosten kann, solange niemand klickt.
  await expect(liste).toHaveCount(0);

  const { cls, bericht } = await clsAuslesen(page);
  expect(cls, `CLS über das Timeline-Auf-/Zuklappen muss 0 sein · ${bericht}`).toBe(0);
});

test('Artikel ohne Historie-Eintrag zeigt kein Badge (BGBM Art. 6)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BGBM', 'art-6');
  const art = page.locator('#art-6');
  await art.scrollIntoViewIfNeeded();
  // Shard ist geladen (Art. 2 trägt seine Klappzeile), aber Art. 6 hat keinen Eintrag.
  await fassungsMarke(page.locator('#art-2'));
  // S6 W1f: WEDER eine Klappzeile im Blatt (§8 — keine Auskunft ohne echten
  // Eintrag) NOCH eine Druck-Projektion am Artikel.
  await blattFuerArtikel(art);
  await blattReiter(page, 'aenderungen');
  await expect(page.locator(F_BLOCK)).toHaveCount(0);
  await expect(art.locator('[data-historie-zeile]')).toHaveCount(0);
});

test('Erlass ohne Historie-Shard zeigt nirgends ein Badge (CISG)', async ({ page }) => {
  await warteReader(page, '/gesetze/international/CISG', 'art-1');
  // Kurz warten, damit ein etwaiger (hier 404-) Shard-Fetch sicher durch ist.
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-historie-zeile]')).toHaveCount(0);
});

test('Marken-Einwuchs verschiebt nichts (§15.2)', async ({ page }) => {
  // Wurzel-Fix des bekannten Flakes — Diagnose und Messreihen am Datei-Kopf.
  //
  // Der Shard wird angehalten, damit der Einwuchs ein KONTROLLIERTES Ereignis ist
  // und nicht ein Rennen gegen den Seitenaufbau. Ohne dieses Anhalten kann der
  // Test nicht wissen, ob er den Badge oder den Kopf-Reflow gemessen hat.
  let freigabe: () => void = () => {};
  const angehalten = new Promise<void>((res) => { freigabe = res; });
  await page.route('**/normtext/historie/*.json', async (route) => {
    await angehalten;
    await route.continue();
  });

  await page.goto('/gesetze/bund/BGBM');
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => document.fonts?.ready);
  // Den Seitenaufbau ausklingen lassen: erst danach ist alles, was noch shiftet,
  // wirklich der Badge. `networkidle` deckt die übrigen Sidecars ab — mit KURZEM
  // eigenem Zeitfenster, denn der angehaltene Historie-Shard zählt als offene
  // Anfrage und lässt den Zustand nie eintreten. Ohne diese Grenze lief der Test
  // in den 30-s-Test-Timeout (Befund beim ersten Lauf dieser Fassung); der
  // `catch` allein fängt einen HÄNGER nicht, nur eine Ablehnung.
  await page.waitForLoadState('networkidle', { timeout: 3000 })
    .catch(() => { /* der Shard hängt absichtlich — erwarteter Fall */ });
  await page.waitForTimeout(700);

  // Die Marke ist NOCH NICHT da — sonst prüfte der Test einen bereits
  // abgeschlossenen Einwuchs (§6.7: ein Tor, das nicht scheitern kann).
  // S6 W1f: Positiv-Anker ist die Druck-Projektion am Artikel (s. Kopf).
  const druck = page.locator('#art-2 [data-hist-druck] [data-historie-zeile]');
  await expect(druck).toHaveCount(0);

  // Referenzgeometrie: die y-Position zweier FOLGENDER Artikel und die Seitenhöhe.
  // Genau sie darf der Einwuchs nicht bewegen — exakt prüfbar statt budgetiert.
  //
  // D40 · WAS DIESE ZEILEN SEITHER BEWACHEN. Bis D40 war es die Reservierung
  // (`mt-4 min-h-beiwerk`) am Kopf-Slot. Der Slot ist gefallen, die Zusage
  // nicht: die Marke wächst in eine Zeile hinein, die es schon gibt, und darf
  // sie nicht umbrechen lassen. Gemessen 7.9.2026 @1440 an BGBM · ZPO · OR ·
  // StPO · ZGB: 0 verschobene Artikel, Seitenhöhe unverändert, CLS 0.00000.
  //
  // BEFUND, benannt statt versteckt (§8): @390 bricht die Zeile auf dem BGBM
  // sehr wohl um (art-2 2041→2073, Seite +64 px) — aber NICHT wegen D40. Die
  // Gegenprobe auf demselben Stand, mit angehaltener Zähl-Datei statt
  // angehaltenem Historie-Shard, zeigt denselben Umbruch aus den Marken
  // «Entscheide»/«Materialien» (BGBM +64 px, ZPO +70, StPO +102). Das ist die
  // Bauart der Funktionszeile seit D35-F1 und ein eigener Befund; CLS bleibt in
  // allen Fällen 0.00000, weil die Stellen below-fold liegen.
  const geometrie = () => page.evaluate(() => ({
    art2: Math.round(document.querySelector('#art-2')!.getBoundingClientRect().y),
    art3: Math.round(document.querySelector('#art-3')!.getBoundingClientRect().y),
    hoehe: Math.round(document.body.scrollHeight),
  }));
  const vorher = await geometrie();

  freigabe();
  // POSITIV: der Einwuchs hat wirklich stattgefunden (sonst messen wir Stillstand).
  await expect(druck).toHaveCount(1, { timeout: 15000 });
  await page.waitForTimeout(600);

  const nachher = await geometrie();
  expect(nachher.art2, `Artikel 2 verschoben: ${vorher.art2} → ${nachher.art2}`).toBe(vorher.art2);
  expect(nachher.art3, `Artikel 3 verschoben: ${vorher.art3} → ${nachher.art3}`).toBe(vorher.art3);
  expect(nachher.hoehe, `Seitenhöhe gewachsen: ${vorher.hoehe} → ${nachher.hoehe}`).toBe(vorher.hoehe);
  // KEINE CLS-Zeile mehr: sie konnte den Defekt nicht melden, den sie benannte
  // (Mutations-Sonde am Datei-Kopf). Die drei Zeilen oben sind die scharfe
  // Fassung derselben Zusage — exakte Gleichheit statt Schwelle.
});
