// @shard-gruppe: nacht
import { test, expect } from '@playwright/test';

// ─── Themenleiste /rechner: sticky ab dem Spalten-Breakpoint (W2·31 B) ──────
//
// Posten 2026-09-26 («Katalog-Themenleiste /rechner, /vorlagen nicht
// sticky»): `ZweiachsigerEinstieg` («Einstieg nach Rechtsgebiet») steht ab
// 1100 px als linke Spalte neben dem Register (`.kt-werkbank > .kt-einstieg`,
// index.css). Ohne `position: sticky` lief sie beim Scrollen mit — ab dem
// ersten Bildschirm blieb die linke Spalte leer. Fix: `sticky`, Offset/Deckel
// wie die Facettenspalte auf `/suche` (`--app-kopf-h` + 1.5rem, dieselbe Luft
// als Rest-Deckel), eigene Scrollfläche via `overflow-y: auto`.
//
// ABWEICHUNG vom Posten-Wortlaut (§7, offengelegt): Der Posten nennt auch
// /vorlagen. `VorlagenUebersicht.tsx` bindet `ZweiachsigerEinstieg` NICHT ein
// (kein `.kt-werkbank`/`.kt-einstieg` im DOM, nur die volle Rechtsgebiet-
// Filterzeile `.ub-filter`) — es gibt dort keine linke Themenleiste, die
// sticky werden könnte. Der Fix bleibt auf /rechner beschränkt.
//
// ROT ZU BEKOMMEN (§6.7): `position: sticky` an `.kt-werkbank > .kt-einstieg`
// (index.css) auf `static`/entfernt → Test 1 schlägt fehl (Element scrollt
// mit aus dem Viewport statt am Kopf-Anschlag zu bleiben).

async function oeffneMitLeiste(page: import('@playwright/test').Page, breite: number) {
  await page.setViewportSize({ width: breite, height: 900 });
  await page.goto('/rechner');
  await expect(page.locator('.kt-einstieg')).toBeVisible();
}

for (const breite of [1280, 1440, 1920]) {
  test(`/rechner @${breite}: Themenleiste bleibt beim Scrollen am Kopf-Anschlag stehen`, async ({ page }) => {
    await oeffneMitLeiste(page, breite);
    const einstieg = page.locator('.kt-einstieg');

    const vorher = await einstieg.evaluate((el) => ({
      position: getComputedStyle(el).position,
      top: el.getBoundingClientRect().top,
    }));
    expect(vorher.position).toBe('sticky');
    // Ungescrollt beginnt die Spalte unterhalb der Kopfzeile (kein
    // Übereinanderlegen) — grober Sanity-Check, kein exaktes Mass.
    expect(vorher.top).toBeGreaterThan(0);

    // Weit genug scrollen, dass eine NICHT-sticky Spalte den Viewport oben
    // längst verlassen hätte (Registerinhalt ist > 1000 px hoch).
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(50);

    const nachher = await einstieg.evaluate((el) => {
      const kopfH = getComputedStyle(document.documentElement).getPropertyValue('--app-kopf-h');
      return { top: el.getBoundingClientRect().top, kopfH };
    });
    // Der Anschlag ist `--app-kopf-h` + 1.5rem (24 px) — mit 4 px Toleranz für
    // Rundung/Scrollbar-Effekte, nie negativ (nie unter den Kopf gerutscht)
    // und nie mehr als ein paar Pixel unter dem ungescrollten Startwert (sonst
    // scrollt die Spalte weiterhin mit, statt zu kleben).
    expect(nachher.top).toBeGreaterThan(-4);
    expect(nachher.top).toBeLessThan(vorher.top + 4);
  });
}

test('/rechner @375: Themenleiste bleibt unverändert (kein sticky, Handy-Stapel)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/rechner');
  await expect(page.locator('.kt-einstieg')).toBeVisible();
  const position = await page.locator('.kt-einstieg').evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe('static');
});
