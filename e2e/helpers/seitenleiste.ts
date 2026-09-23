import { expect, type Page } from '@playwright/test'

// ── DIE SEITENLEISTE AUFMACHEN (D25, David 6.9.2026) ─────────────────────────
//
// «seitenleiste soll als default zuerst eingeklappt sein». Seit D25 startet die
// Desktop-Leiste auf JEDER Route eingeklappt — der Vorgabewert lebt in
// `src/components/layout/useSeitenleiste.ts`, die Nutzerwahl bleibt persistent.
//
// Damit hat jeder Wächter, der die Leiste MISST, eine neue Vorbedingung: sie
// muss erst eingeblendet werden. Diese Vorbedingung hat genau EINE Stelle (§5)
// — sonst steht der Klick auf den Titelblatt-Schalter in einem Dutzend Specs
// und wandert beim nächsten Umbau nur zur Hälfte mit.
//
// Der Helfer prüft NICHTS weg: er stellt die Vorbedingung her, auf der die
// aufrufenden Specs ihre eigene Zusage messen, und besteht darauf, dass die
// Leiste danach WIRKLICH steht. Ein toter Schalter (Knopf da, Leiste bleibt weg)
// lässt ihn scheitern — nicht erst die Assertion des Aufrufers.
//
// NUR DESKTOP. Unter `lg` gibt es die persistente Leiste gar nicht; dort trägt
// die Off-Canvas-Schublade dieselbe `Sidebar` (Shell.tsx), und die geht über
// «Navigation öffnen» auf. Der Schalter im Titelblatt ist selbst `hidden lg:…`.

/** Die persistente App-Seitenleiste (nicht die V3-Gliederung des Lesers). */
const appSeitenleiste = (page: Page) => page.locator('aside[data-app-seitenleiste]')

/** Der Schalter im Titelblatt — konstanter Name, Zustand in `aria-pressed`. */
export const seitenleistenSchalter = (page: Page) =>
  page.getByRole('button', { name: 'Seitenleiste ein- und ausblenden' })

/**
 * Blendet die Desktop-Seitenleiste ein und gibt sie zurück. Steht sie schon
 * (Nutzerwahl aus einem früheren Schritt derselben Sitzung), passiert nichts.
 */
export async function seitenleisteOeffnen(page: Page, timeout = 20_000) {
  const leiste = appSeitenleiste(page)
  const schalter = seitenleistenSchalter(page)
  // Erst auf die Hydration warten: der Schalter existiert im prerenderten HTML
  // noch nicht bedienbar, ein Klick davor liefe ins Leere.
  await expect(schalter).toBeVisible({ timeout })
  if ((await leiste.count()) === 0) await schalter.click()
  await expect(leiste).toBeVisible({ timeout })
  return leiste
}
