// @shard-gruppe: 1
import { test, expect } from '@playwright/test';
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls';

// ─── /materialien: Lade-CLS (W2·31-BILDSCHIRMBREITE P10b, 30.9.2026) ─────────
//
// Gemessen am Preview-Build vor dem Fix (headless Chromium, 3 Läufe je Breite,
// Beobachter vor dem ersten Paint): CLS 0.4117 @1920 und 0.33–0.35 @375. Einzige
// Quelle war `<footer>`: beim kurzen Ladezustand ragte er in den Fold
// (Shift 0.098), beim Einwachsen der Liste sprang er wieder heraus (0.313).
// Fix: der Ladezustand reserviert `min-h-inhalt-region` (Hausmuster /gesetze).
// Nachher 0.0000–0.0001 (beide Breiten, je 3 Läufe).
//
// Der Beobachter ist der geteilte aus `helpers/cls.ts`, mit `buffered: true`
// (Lade-CLS-Muster wie gesetze-historie-badge; A9 in rechtsprechung.e2e.ts misst
// dagegen bewusst nur die Interaktion). Latte 0.05 wie die übrigen A9-Budgets: weit über dem Messrauschen
// (≈ 0.0001), weit unter dem Fehler (≥ 0.33).
// ROT ZU BEKOMMEN (§6.7): in `pages/Materialien.tsx` `min-h-inhalt-region` am
// `<Ladeanzeige …>` streichen, `npm run build` → CLS ≈ 0.41 @1920.
//
// NACHSCHÄRFUNG 0.05 → 0.01 (W2·31 P13, 30.9.2026; Hausmuster gesetze-footer-cls
// toBe(0), d21 ≤ 0.01): Streuung vor der Schärfung, Preview-Build, headless
// Chromium, lokal warm, 10 Läufe je Breite, Beobachter `buffered` wie unten:
// @1920 0.0000–0.0001 (Mittel 0.0000, sd 0.0000), @375 0.0000 (10/10); dazu
// 5× die Spec selbst grün. Fehlerwert ≥ 0.33 — Abstand zur Latte > Faktor 30.
// Unter 2-vCPU-CI-Last nicht gemessen (kein Vorfall, Nachmessung bei Flake).

const LATTE = 0.01;

for (const breite of [1920, 375]) {
  test(`/materialien @${breite}: Lade-CLS unter ${LATTE} (Footer springt nicht aus dem Bild)`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: breite > 800 ? 1000 : 812 });
    await page.goto('/materialien');
    await expect(page.locator('a.lc-card').first()).toBeVisible({ timeout: 15000 });
    // `buffered: true` (wie gesetze-historie-badge): zieht die Shifts der ganzen
    // Ladephase nach — genau die, um die es hier geht. Eine Sekunde Nachlauf für späte Shifts.
    await clsBeobachtenInstallieren(page, true);
    // Messfenster statt Zustand (kein Marker für «späte Shifts durch»); ungedrosselt,
    // ohne `reducedMotion` — Verschärfung wie in `leser-lade-cls.e2e.ts` (P13b) steht aus.
    await page.waitForTimeout(1000);
    const { cls, bericht } = await clsAuslesen(page);
    expect(cls, `Lade-CLS ${cls.toFixed(4)} @${breite} — ${bericht}`).toBeLessThanOrEqual(LATTE);
  });
}
