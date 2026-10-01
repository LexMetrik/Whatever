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
//
// NACHZUG P13b (1.10.2026, Prüfer-Auflage 1+2): «deterministisch» galt nur für
// den UNGEDROSSELTEN Lauf OHNE `reducedMotion` (lokal, warm, `--workers=1`): dort
// maskiert der Opacity-Einblender von `.lc-route` (index.css) die Ladeanzeige, solange
// sie noch unsichtbar steht. Unter CPU-Drosselung (CDP `Emulation.setCPUThrottlingRate`,
// wie die 2-vCPU-CI-Runner) ist sie lang genug sichtbar, und ein Shift zählt:
// Entscheid @375 0.0176 (Quelle `div.lc-route` y 167→187; beim Prüfer 6/6 bei 2–3×,
// in meinen Diagnoseläufen bei 3×/4× nur in 4 von 8 — zeitabhängig, daher flaky-rot
// auf CI). `reducedMotion: 'reduce'` (F2g) schaltet den Einblender ab und macht den
// Shift reproduzierbar: VOR dem Fix 9/10 rot (5/5 ungedrosselt, 4/5 bei 4×), Wert
// 0.0176. WURZEL: der Kopf des Entscheid-Lesers trug 20 px `margin-top` (Tailwind-3-
// `space-y` zählt das `<style>` als Geschwister), der durch den Wrapper und `.lc-route`
// hinaus kollabierte und die Hülle um 20 px verschob. Fix: `flow-root` am Wrapper
// (`pages/EntscheidLeser.tsx`), der Kopf steht pixelgleich. NACHHER (je 5 Läufe,
// `--workers=1`, lokal warm): Entscheid @375 0.0000–0.0001 (ungedrosselt, 2×, 4×),
// @1920 0.0001–0.0002, Material @375 0.0003 — 30/30 grün. Jede Zelle läuft ungedrosselt
// UND 4× gedrosselt (Messbedingung im Testtitel); 4× statt 2×, weil es die stärkere Probe
// ist. ROT ZU BEKOMMEN: `flow-root` streichen, `npm run build` → 0.0176.
//
// NACHZUG P18 (1.10.2026, Wurzel statt Klammer): `flow-root` fing den Rand nur ab. Jetzt
// steht das `<style>` des Wrappers als LETZTES Kind (kein Geschwister vor dem Kopf, also
// kein `space-y`-Rand), die 20 px Luft über dem Kopf als `pt-5` (Padding kollabiert nicht).
// Beleg: `flow-root` weg OHNE Umzug → Entscheid @375 ungedrosselt 0.0176 (y 167→187, rot);
// mit Umzug + `pt-5` Layout in 24 Zellen (4 Entscheide/Ansichten × 375/1280/1920 × Bildschirm/
// Druck, 9281 Elementkästen) identisch zum Stand mit `flow-root`.

const LATTE = 0.01;
// Drosselstufen je Zelle: 1 = ungedrosselt, 4 = `Emulation.setCPUThrottlingRate` 4
// (stärkere Probe als die 2× der Prüfer-Auflage; Begründung im Kopf).
const DROSSELN = [1, 4];

const ZELLEN: { name: string; pfad: string; breite: number; hoehe: number }[] = [
  { name: 'Entscheid', pfad: '/rechtsprechung/bger_1B_278_2022', breite: 375, hoehe: 812 },
  { name: 'Entscheid', pfad: '/rechtsprechung/bger_1B_278_2022', breite: 1920, hoehe: 1000 },
  { name: 'Material', pfad: '/materialien/ESTV-MWST-INFO-02', breite: 375, hoehe: 812 },
];

for (const z of ZELLEN) {
  for (const drossel of DROSSELN) {
    const bedingung = drossel > 1 ? `${drossel}× CPU gedrosselt` : 'ungedrosselt';
    test(`${z.name}-Leser @${z.breite} (${bedingung}): Lade-CLS unter ${LATTE} (Footer springt nicht aus dem Bild)`, async ({ page }) => {
      // F2g: die Route blendet per Opacity-Animation ein (`.lc-route`); die hat keinen
      // Layout-Anteil, würde aber unter Drosselung Frames ziehen — die Messung gilt
      // dem Lade-Layout, nicht der Bewegung.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      if (drossel > 1) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: drossel });
      }
      await page.setViewportSize({ width: z.breite, height: z.hoehe });
      await page.goto(z.pfad);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
      await clsBeobachtenInstallieren(page, true);
      // Messfenster statt Zustand: es gibt keinen Marker für «alle späten Shifts sind
      // durch» — `buffered: true` zieht die Ladephase bis hierher nach, die Sekunde
      // fängt Nachzügler (z. B. asynchron nachladende Panels) ab.
      await page.waitForTimeout(1000);
      const { cls, bericht } = await clsAuslesen(page);
      expect(cls, `Lade-CLS ${cls.toFixed(4)} @${z.breite} ${z.pfad} (${bedingung}) — ${bericht}`).toBeLessThanOrEqual(LATTE);
    });
  }
}
