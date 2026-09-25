// @shard-gruppe: 5
import { test, expect, type Page } from '@playwright/test';

// ─── Material-Leser: Lesespalte + Randspalte (W2·31-BILDSCHIRMBREITE B8, 25.9.2026) ─
//
// `pages/MaterialLeser.tsx` stellt ab 62 rem ARTIKEL-Breite (Container-Query
// `@container/material`) den Kontext in die Lesespalte (40 rem) und das Beiwerk
// — §8-Gattungshinweis, Anker-Liste einer Botschaft — in die Randspalte daneben;
// darunter bleibt die Seite einspaltig mit dem Hinweis ZUERST.
// `e2e/seitenbreite.e2e.ts` wacht über Rahmen und Lesemass, nicht über diese
// Anordnung; ohne diesen Wächter fiele ein Rückfall auf die einspaltige Form
// (Leerfläche 482 px @≥1280) oder ein Spaltenbruch auf dem Handy nicht auf.
//
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit-Bericht B8): die Klasse
// `@[62rem]/material:grid` am Körper entfernen → @1280/@1920 steht der Hinweis
// ÜBER dem Kontext statt daneben; `@[62rem]` auf `@[20rem]` senken → @390
// stehen beide nebeneinander.

async function box(page: Page, sel: string) {
  const b = await page.locator(sel).first().boundingBox();
  expect(b, `${sel} sichtbar`).not.toBeNull();
  return b!;
}

for (const breite of [1280, 1920]) {
  test(`@${breite}: Randhinweis rechts neben der Lesespalte, obenbündig; Lesespalte 40 rem`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/materialien/ESTV-KS-DBG-5A');
    await expect(page.locator('#kontext-titel')).toBeVisible();
    const lese = await box(page, '[data-material-lesespalte]');
    const rand = await box(page, '[data-material-randhinweis]');
    const rem = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(rand.x, 'Randspalte rechts der Lesespalte').toBeGreaterThanOrEqual(lese.x + lese.width + rem);
    expect(Math.abs(rand.y - lese.y), 'obenbündig').toBeLessThanOrEqual(1);
    expect(lese.width, 'Lesespalte = max-w-reading').toBeLessThanOrEqual(40 * rem + 1);
  });
}

test('@1920 Botschaft: Anker-Liste in der Randspalte unter dem Hinweis, xs-Absatz im Kleintext-Deckel', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/materialien/BOTSCHAFT-2025-1478');
  await expect(page.locator('[data-material-entstehung]')).toBeVisible();
  const rand = await box(page, '[data-material-randhinweis]');
  const anker = await box(page, '[data-material-entstehung]');
  expect(Math.abs(anker.x - rand.x), 'gleiche Spalte').toBeLessThanOrEqual(1);
  expect(anker.y, 'unter dem Hinweis').toBeGreaterThan(rand.y + rand.height);
  const rem = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  const p = await box(page, '[data-material-entstehung] > p');
  expect(p.width, 'max-w-kleintext (24 rem)').toBeLessThanOrEqual(24 * rem + 1);
});

test('@390: einspaltig, Hinweis vor dem Kontext, beide gleich breit, kein Querscroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/materialien/ESTV-KS-DBG-5A');
  await expect(page.locator('#kontext-titel')).toBeVisible();
  const lese = await box(page, '[data-material-lesespalte]');
  const rand = await box(page, '[data-material-randhinweis]');
  expect(rand.y + rand.height, 'Hinweis zuerst').toBeLessThanOrEqual(lese.y);
  expect(Math.abs(rand.x - lese.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(rand.width - lese.width)).toBeLessThanOrEqual(1);
  const quer = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(quer).toBeLessThanOrEqual(0);
});
