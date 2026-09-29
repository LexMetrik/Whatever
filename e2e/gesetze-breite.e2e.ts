// @shard-gruppe: 3
import { test, expect } from '@playwright/test';

// ─── /gesetze auf Stufe `weit` (W2·31-BILDSCHIRMBREITE B4, 25.9.2026) ────────
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN der Seitenart (1440 px ab 2xl).
// Was die Breite dort NUTZT, prüft nur dieser Wächter:
//  (1) Das Erlass-Register der Rechtsgebiet-Übersicht bleibt zweispaltig —
//      die Breite geht an die Titel-Spur, nicht an eine dritte Spalte
//      (Begründung am `.tb-raster-2` in index.css). Gemessen (dev, 25.9.2026):
//      @1920 zwei Spalten à 660 px, 20 von 241 Titeln gekappt; vorher 500 px
//      und 93 gekappt; eine dritte Spalte (CSS-Probe) kappte 156. Schwelle:
//      Spalten ≥ 600 px und höchstens ein Fünftel der Titel gekappt (vorher
//      39 %). Anteil statt Zahl, damit der wachsende Korpus nicht pinnt.
//  (2) @1440 (Stufe content) wie vor B4: zwei Spalten unter 520 px.
//  (3) @1536 mit offener Seitenleiste (460 px): die Liste hängt an ihrem
//      Container (`.tb-huelle`), nicht am Viewport — weiter zwei Spalten.
//  (4) Das Filterfeld läuft nicht über die weite Breite: ≤ 70rem.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) `gesetze` in seitenbreite.ts
// zurück auf `content` → 500 px / 39 % gekappt; (4) `max-w-content` an
// `.ub-filter` in Gesetze.tsx streichen → 1392 px.

const LISTE = '#rechtsgebiete-uebersicht .tb-raster';

async function messe(page: import('@playwright/test').Page) {
  await expect(page.locator(`${LISTE} .tb-zeile`).first()).toBeVisible();
  return page.evaluate((sel) => {
    const ul = document.querySelector(sel) as HTMLElement;
    const cols = getComputedStyle(ul).gridTemplateColumns.split(' ').map(parseFloat);
    const titel = [...document.querySelectorAll('#rechtsgebiete-uebersicht .tb-titel')] as HTMLElement[];
    const gekappt = titel.filter((t) => t.scrollHeight > t.clientHeight + 1).length;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const filter = (document.querySelector('.ub-filter') as HTMLElement).getBoundingClientRect().width;
    return { cols, anteil: gekappt / titel.length, filterRem: filter / rem };
  }, LISTE);
}

test('/gesetze @1920 (weit): Register zweispaltig mit breiter Titel-Spur, Filterfeld ≤ 70rem', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(600);
  expect(m.anteil).toBeLessThanOrEqual(0.2);
  expect(m.filterRem).toBeLessThanOrEqual(70 + 0.1);
});

test('/gesetze @1440 (content): Register wie vor B4 — zwei Spalten unter 520 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeLessThan(520);
});

test('/gesetze @1536 mit Seitenleiste 460 px: Register folgt dem Container, zwei Spalten', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
    localStorage.setItem('lexmetrik-seitenleiste-breite', '460');
  });
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto('/gesetze');
  const m = await messe(page);
  expect(m.cols).toHaveLength(2);
  for (const c of m.cols) expect(c).toBeGreaterThanOrEqual(440);
});

// ─── Neuansatz 30.9.2026 (Entscheid Orchestrator, Gegenprüfung PR #1156) ─────
//
// Bündel C (29.9.2026) hatte einen Breiten-DECKEL auf die Titel-Spur gesetzt
// (`minmax(0,30rem) auto 1fr` bei `.tb-link`/`.tb-voll .tb-link`), um die
// Lücke Titelende→Zahl auf breiten, einspaltigen Rubriken (`?ebene=
// international`/`?ebene=bund`, wenige Zeilen je Gruppe, `spaltig={false}`)
// klein zu halten. Zwei Gegenprüfungs-Runden zeigten: derselbe Deckel trifft
// KURZE und LANGE Titel in DERSELBEN Spur gegenläufig — er hielt die Lücke
// klein, kappte dafür zwangsläufig MEHR Titel (GEMESSEN, PR-Kopf 50ec54c vs.
// main: International 0→7 von 37, Bund 9→11 von 204 @1920). Lesbarkeit hat
// Vorrang (§8, Grundsatz W2·31 «Lesemass wächst nie, aber nichts wird unnötig
// abgeschnitten») — der Deckel ist vollständig zurückgenommen, `.tb-link`/
// `.tb-voll .tb-link` stehen wieder auf `minmax(0, 1fr)` wie `main`.
//
// Statt die Spur zu verengen, überbrückt ein gepunkteter Leader (Background-
// Image auf `.tb-titel`, Schweizer-Fahrplan-Vorbild Ort … Zeit) die Lücke rein
// dekorativ — KEINE Breiten-, Umbruch- oder Kappungs-Änderung, nur ab
// `@container (width >= 80rem)`. Schwelle GEMESSEN (`.tb-huelle`-Breite):
// bis 1072 px Container (Viewport 1024–1440) moderate Lücke (International
// med 46/max 196, Bund med 73/max 507 @1280, dev-Messung), ab 1392 px
// Container (Viewport ab 1536) «real gross» (International med 260/max 516,
// Bund med 223/max 827 @1920) — 80rem (1280 px) trennt sauber dazwischen.

const KAPP_MAIN: Record<string, number> = {
  'international-1920': 0, 'international-1280': 1,
  'bund-1920': 9, 'bund-1280': 38,
};
for (const [ebene, breite] of [
  ['international', 1920], ['international', 1280],
  ['bund', 1920], ['bund', 1280],
] as const) {
  test(`/gesetze?ebene=${ebene} @${breite}: nicht mehr gekappte Titel als main (Neuansatz statt Deckel)`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 1080 });
    await page.goto(`/gesetze?ebene=${ebene}`);
    if (ebene === 'bund') {
      // Bund-Systematik steht standardmässig eingeklappt (Auftrag David
      // 25.6.2026) — «Alle aufklappen» macht die Zeilen sichtbar.
      await page.getByRole('button', { name: 'Alle aufklappen' }).click();
    }
    await expect(page.locator('.tb-zeile').first()).toBeVisible();
    // GEMESSEN (headless Playwright, 30.9.2026): exakt gleich main (0/1/9/38),
    // kein Delta — s. Kopfkommentar. `≤` statt `=` aus demselben Grund wie die
    // Register-Anteilsprobe oben («damit der wachsende Korpus nicht pinnt»),
    // guardet aber dieselbe Regression.
    // ROT ZU BEKOMMEN (§6.7, Beweis im Commit): gegen den PR-Kopf VOR dieser
    // Nachbesserung (50ec54c, Deckel `minmax(0,30rem) auto 1fr`) liefert
    // International @1920 7 (> 0) und Bund @1920 11 (> 9) — beide schlagen
    // dann fehl (GEMESSEN in der Commit-Historie, s. Kopfkommentar).
    const gekappt = await page.locator('.tb-titel').evaluateAll(
      (els) => els.filter((t) => (t as HTMLElement).offsetParent
        && t.scrollHeight > t.clientHeight + 1).length,
    );
    expect(gekappt).toBeLessThanOrEqual(KAPP_MAIN[`${ebene}-${breite}`]);
  });
}

// Blickfeld-Führung: sichtbar ab dem 80rem-Container, darunter (auch @1280,
// wo main schon 1072 px Container trägt) unverändert aus. ROT ZU BEKOMMEN
// (§6.7, gemessen gegen `origin/main` 30.9.2026): main kennt die Führung nie
// — `backgroundImage` bleibt dort bei JEDER Breite `none`, die `@1920`-Probe
// unten schlägt auf main fehl (erwartet ein Gradient, main liefert `none`).
for (const ebene of ['international', 'bund'] as const) {
  test(`/gesetze?ebene=${ebene}: Leader-Führung ab 80rem-Container sichtbar, bei @1280 aus`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/gesetze?ebene=${ebene}`);
    if (ebene === 'bund') await page.getByRole('button', { name: 'Alle aufklappen' }).click();
    const erste = page.locator('.tb-titel').first();
    await expect(erste).toBeVisible();
    await expect(erste).toHaveCSS('background-image', /repeating-linear-gradient/);
    await page.setViewportSize({ width: 1280, height: 1080 });
    await expect(erste).toHaveCSS('background-image', 'none');
  });
}

// Posten «Register-Titel .tb-titel (/gesetze) unter Schriftskala 1.4 @1280
// ~89 ch» — WIEDERERÖFFNET 30.9.2026 (`plan/posten/2026-09-26-register-
// titel-tb-titel-gesetze-unter-schriftskala-1-4-1280.md`): der 30-rem-Deckel
// (59.8 ch, vorher 79.1 ch main) ist mit Bündel C komplett zurückgenommen
// (s. Kopfkommentar oben). GEPRÜFT, ob ein enger gefasster Deckel (z. B.
// `max-width: 62ch` NUR auf `.tb-titel`, Text mit Umbruch statt Klemmung)
// dasselbe Problem OHNE Mehr-Kappung löst: GEMESSEN (headless Playwright,
// 30.9.2026, `/gesetze` @1280 Schriftskala 1.4) — ohne Deckel 79.1 ch / 2 von
// 241 Titeln gekappt, MIT einem 62-ch-Deckel 61.9 ch / 8 von 241 gekappt
// (vierfach). Dieselbe Ursache wie beim Breiten-Deckel: ein Deckel auf
// dieselbe Spur trifft kurze und lange Titel gegenläufig — nicht ohne
// Mehr-Kappung lösbar, also NICHT umgesetzt (§8 Lesbarkeit vor Deckel). Die
// alte Zusage (`chPerLine < 70`) ist darum ENTFERNT statt rot gehalten — sie
// gehörte zum jetzt zurückgenommenen Deckel. Der Posten bleibt offen
// (`plan/posten/...`), Entscheid Titel-Kappung vs. Lesemass liegt bei David.
