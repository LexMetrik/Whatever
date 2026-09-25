// @shard-gruppe: 7
import { test, expect, type Page } from '@playwright/test';

// ─── Rechtsprechung auf Stufe `weit` (W2·31-BILDSCHIRMBREITE B6, 25.9.2026) ──
//
// `e2e/seitenbreite.e2e.ts` prüft den RAHMEN (1440 px ab 2xl). Was die Breite
// auf /rechtsprechung NUTZT, prüft nur dieser Wächter:
//  (1) Ab 68 rem Listenbreite (`@container/rspliste`, @1920 = 1144 px) stehen
//      die Trefferzeilen in ZWEI Spalten à ≥ 33 rem, die Bezeichnung (Regeste/
//      Thema) bricht auf höchstens drei Zeilen um statt nach einer zu kappen.
//  (2) Darunter (Stufe content @1440, 824 px; @1536 mit offener Seitenleiste,
//      780 px) EINE Spalte, Bezeichnung einzeilig gekappt wie vor B6. Die
//      Schwelle hängt an der Liste, nicht am Viewport (Lehre B2).
// Gemessen vorher → nachher @1920: 26'739 → 17'640 px Dokumenthöhe (24.8 →
// 16.3 Bildschirme), gekappte Bezeichnungen 65 → 25 von 354.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): (1) `@[68rem]/rspliste:grid-cols-2`
// in Rechtsprechung.tsx streichen → eine Spalte @1920; (2) die Container-
// Varianten durch `2xl:` ersetzen → zwei Spalten à 378 px @1536 mit Leiste.

const REM = 16;

async function listenForm(page: Page) {
  await expect(page.locator('main#inhalt div.group.relative').first()).toBeVisible();
  return page.locator('main#inhalt div.group.relative').first().evaluate((zeile) => {
    const liste = zeile.parentElement!;
    const cols = getComputedStyle(liste).gridTemplateColumns;
    const bez = zeile.querySelector('span[title]') as HTMLElement;
    const s = getComputedStyle(bez);
    return {
      spalten: cols === 'none' ? [] : cols.split(' ').map(parseFloat),
      clamp: s.webkitLineClamp, umbruch: s.whiteSpace,
    };
  });
}

const FAELLE = [
  { breite: 1920, leiste: 0, spalten: 2, clamp: '3', umbruch: 'normal' },
  { breite: 1440, leiste: 0, spalten: 0, clamp: 'none', umbruch: 'nowrap' },
  { breite: 1536, leiste: 460, spalten: 0, clamp: 'none', umbruch: 'nowrap' },
] as const;

for (const { breite, leiste, spalten, clamp, umbruch } of FAELLE) {
  test(`/rechtsprechung @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''}: ${spalten || 1} Zeilenspalte(n)`, async ({ page }) => {
    if (leiste) {
      await page.addInitScript((b) => {
        localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
        localStorage.setItem('lexmetrik-seitenleiste-breite', String(b));
      }, leiste);
    }
    await page.setViewportSize({ width: breite, height: 1000 });
    await page.goto('/rechtsprechung');
    const m = await listenForm(page);
    expect(m.spalten, `Spalten ${JSON.stringify(m.spalten)}`).toHaveLength(spalten);
    for (const c of m.spalten) expect(c).toBeGreaterThanOrEqual(33 * REM);
    expect(m.clamp).toBe(clamp);
    expect(m.umbruch).toBe(umbruch);
  });
}
