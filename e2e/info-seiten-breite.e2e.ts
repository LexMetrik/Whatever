// @shard-gruppe: 8
import { test, expect } from '@playwright/test';
import { SEITENBREITE } from '../src/components/layout/seitenbreite';

// ─── Info-Seiten: Titelband spannt den Rahmen (W2·31-BILDSCHIRMBREITE B12) ───
//
// Bis 25.9.2026 trugen /ueber, /kontakt und /datenschutz `max-w-reading` am
// Seiten-Container: Titelband und Abschnittslinien standen als 640-px-Spalte
// links im 1120-px-Rahmen (Rand @1920 424 links / 856 rechts), während
// /methodik, /abdeckung, /einstellungen und die Fehlerseite ihr Band über den
// Rahmen spannten. Zusicherung: auf allen Info-Seitenarten fluchtet das
// Titelband (`.ub-kopf`, SeitenKopf) links UND rechts mit dem Inhaltsrahmen
// (`main#inhalt > div` ohne Polsterung, ±1 px). Das Lesemass des Fliesstexts bewacht
// `e2e/seitenbreite.e2e.ts` (≤ 80 Zeichen/Zeile) — hier nur die Kanten.
// Beispielrouten der Arten aus `SEITENBREITE` (§5), dazu die zwei weiteren
// Routen der Art `info`.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit): `max-w-reading` zurück an den
// Seiten-Container von Ueber.tsx → Band endet 432 px vor der rechten Kante.

const ROUTEN = [
  SEITENBREITE.info.beispielPfad, '/kontakt', '/datenschutz',
  SEITENBREITE.methodik.beispielPfad, SEITENBREITE.abdeckung.beispielPfad,
  SEITENBREITE.einstellungen.beispielPfad, SEITENBREITE.fehlerseite.beispielPfad,
];

for (const breite of [1920, 1280]) {
  for (const pfad of ROUTEN) {
    test(`${pfad} @${breite}: Titelband fluchtet mit dem Inhaltsrahmen`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 900 });
      await page.goto(pfad);
      const band = page.locator('main#inhalt .ub-kopf').first();
      await expect(band).toBeVisible();
      const m = await band.evaluate((b) => {
        // Inhaltskante = Rahmen abzüglich seiner Polsterung (px-6).
        const rahmen = document.querySelector('main#inhalt > div') as HTMLElement;
        const r = rahmen.getBoundingClientRect();
        const s = getComputedStyle(rahmen);
        const k = b.getBoundingClientRect();
        return { l: k.left - (r.left + parseFloat(s.paddingLeft)), r: (r.right - parseFloat(s.paddingRight)) - k.right };
      });
      expect(Math.abs(m.l), 'linke Kante').toBeLessThanOrEqual(1);
      expect(Math.abs(m.r), 'rechte Kante').toBeLessThanOrEqual(1);
    });
  }
}
