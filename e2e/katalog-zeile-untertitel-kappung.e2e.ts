// @shard-gruppe: 6
import { test, expect } from '@playwright/test';

// ─── Katalog-Zeile: Untertitel auf zwei Zeilen gekappt (W2·31 B) ────────────
//
// Posten 2026-09-26 («Rechner-Untertitel im Katalog ungekappt bis 7 Zeilen»):
// `ui/TrefferZeile.tsx` kommentiert die Untertitel-Kappung als `line-clamp-2`
// (C-4), griff in der Katalog-Zeile (`Katalog.tsx::ListenZeile`) aber nicht —
// der Untertitel-Span trug ZUSÄTZLICH die Klasse `block`. Tailwind reiht
// `.line-clamp-2 { display: -webkit-box }` VOR `.block { display: block }`
// im generierten CSS; bei gleicher Spezifität gewinnt die spätere Regel, das
// stellte `display: block` wieder her und `-webkit-line-clamp` griff ohne den
// `-webkit-box`-Kontext nicht mehr (B10 mass bis zu 7 Zeilen @1920 dreispaltig
// gegen /rechner). Fix: `block` entfernt (line-clamp liefert den
// Block-Kontext selbst), `title` hält den vollen Wortlaut zugänglich.
//
// ROT ZU BEKOMMEN (§6.7): die Klasse `block` neben `line-clamp-2` an der
// Untertitel-Zeile in `TrefferZeile.tsx` zurückstellen → Test 1 schlägt fehl
// (Höhe > 2 Zeilen bei den betroffenen Fristen-/Gebühren-Zeilen). `title`
// entfernen → Test 2 schlägt fehl.

test('/rechner @1920: kein Katalog-Untertitel läuft über zwei Zeilen', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('/rechner');
  await expect(page.locator('.kt-raster').first()).toBeVisible();

  const funde = await page.evaluate(() => {
    const aus: { titel: string; zeilen: number }[] = [];
    for (const zeile of document.querySelectorAll('.kt-zeile')) {
      const wrap = zeile.querySelector(':scope > .min-w-0.flex-1, :scope span.min-w-0.flex-1');
      if (!wrap) continue;
      const spans = wrap.querySelectorAll(':scope > span');
      const titel = spans[0]?.textContent?.trim() ?? '';
      const unter = spans[1] as HTMLElement | undefined;
      if (!unter) continue;
      const cs = getComputedStyle(unter);
      const lineHeight = parseFloat(cs.lineHeight) || 19;
      const zeilen = unter.getBoundingClientRect().height / lineHeight;
      if (zeilen > 2.1) aus.push({ titel, zeilen: Math.round(zeilen * 10) / 10 });
    }
    return aus;
  });
  expect(funde).toEqual([]);
});

test('/rechner @1920: Katalog-Untertitel trägt den vollen Wortlaut als title (KEIN title-ERSATZ, nur Ergänzung)', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('/rechner');
  await expect(page.locator('.kt-raster').first()).toBeVisible();

  const fehlend = await page.evaluate(() => {
    const aus: string[] = [];
    for (const zeile of document.querySelectorAll('.kt-zeile')) {
      const wrap = zeile.querySelector(':scope > .min-w-0.flex-1, :scope span.min-w-0.flex-1');
      if (!wrap) continue;
      const spans = wrap.querySelectorAll(':scope > span');
      const unter = spans[1] as HTMLElement | undefined;
      if (!unter) continue;
      const text = unter.textContent?.trim() ?? '';
      if (!text) continue;
      if (unter.getAttribute('title') !== text) aus.push(text.slice(0, 40));
    }
    return aus;
  });
  expect(fehlend).toEqual([]);
});
