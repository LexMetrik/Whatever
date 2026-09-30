// @shard-gruppe: 1
import { test, expect } from '@playwright/test';
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls';

// ─── Entscheid-/Material-Leser: Lade-CLS (W2·31-BILDSCHIRMBREITE P13, 30.9.2026) ─
//
// Wie /materialien vor #1198: die Ladeanzeige der beiden Leser stand ohne
// Mindesthöhe, der `<footer>` ragte in den Fold und sprang beim Einwachsen
// wieder hinaus. Gemessen am Preview-Build vor dem Fix (headless Chromium,
// Beobachter vor dem ersten Paint, 5 Läufe je Zelle, sd 0.0000 — deterministisch):
//   Entscheid @375 0.9436 · @1920 0.4518 · Material @375 0.9439 · @1920 0.19–0.32.
// Quelle je Shift: `<footer>`. Fix: `min-h-inhalt-region` am `<Ladeanzeige …>`
// beider Leser (Hausmuster `pages/Materialien.tsx`, #1198).
// Nachher (5 Läufe je Zelle): Entscheid @375 0.0001 · @1366 0.0002 · @1440 0.0002
// · @1920 0.0001 (sd ≤ 0.0001); Material @375 0.0004 · @1366 0.0003.
//
// BEWUSST NICHT GEDECKT: Material @≥1440×900. Dort bleibt ein Rest-CLS
// (0.019 @1440×900, 0.032–0.078 @1920) — eine ANDERE Quelle: das
// Verweis-Kontext-Panel («Leitentscheide», `KontextPanel`) wächst nach dem
// asynchronen Laden von ≈ 200 auf ≈ 1170 px und zieht den Footer in den Fold
// (gemessen: `section` 201→1173 px, 32 ms nach dem Kopf). Das ist nicht die
// Ladeanzeige, sondern die Panel-Reserve (W2·27-Fläche, Posten in der Rückgabe).
//
// Beobachter wie `materialien-cls.e2e.ts`: geteilter aus `helpers/cls.ts`,
// `buffered: true` (zieht die Shifts der ganzen Ladephase nach), eine Sekunde
// Nachlauf. Latte 0.01 (Hausmuster d21; Messrauschen ≈ 0.0001–0.0004).
// ROT ZU BEKOMMEN (§6.7): `min-h-inhalt-region` am `<Ladeanzeige …>` in
// `pages/EntscheidLeser.tsx` bzw. `pages/MaterialLeser.tsx` streichen,
// `npm run build` → CLS ≈ 0.94 @375.

const LATTE = 0.01;

const ZELLEN: { name: string; pfad: string; breite: number; hoehe: number }[] = [
  { name: 'Entscheid', pfad: '/rechtsprechung/bger_1B_278_2022', breite: 375, hoehe: 812 },
  { name: 'Entscheid', pfad: '/rechtsprechung/bger_1B_278_2022', breite: 1920, hoehe: 1000 },
  { name: 'Material', pfad: '/materialien/ESTV-MWST-INFO-02', breite: 375, hoehe: 812 },
];

for (const z of ZELLEN) {
  test(`${z.name}-Leser @${z.breite}: Lade-CLS unter ${LATTE} (Footer springt nicht aus dem Bild)`, async ({ page }) => {
    await page.setViewportSize({ width: z.breite, height: z.hoehe });
    await page.goto(z.pfad);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await clsBeobachtenInstallieren(page, true);
    await page.waitForTimeout(1000);
    const { cls, bericht } = await clsAuslesen(page);
    expect(cls, `Lade-CLS ${cls.toFixed(4)} @${z.breite} ${z.pfad} — ${bericht}`).toBeLessThanOrEqual(LATTE);
  });
}
