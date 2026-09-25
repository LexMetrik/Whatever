// @shard-gruppe: 8
import { test, expect } from '@playwright/test'

// ─── W2·29-WERKBANK-REST S5b · Gesetze-Wahl: Spaltenköpfe mit Breitenreserve ──
//
// Posten 24.9.2026 «Bund-Spaltenkopf der Gesetze-Wahl hat nur 7 px
// Breitenreserve — vierstellige Erlasszahl bricht um» (Nebenfund U13, #1077).
// Die drei Köpfe teilen ab `lg` eine Zeile (Subgrid, `WahlSpalte`): bricht in
// EINEM Kopf die Einheit unter die Zahl, werden alle drei ~25 px höher und das
// Blatt läuft über (U13, `startseite-blatt.e2e.ts`). Die Probe setzt darum die
// Zahl im DOM auf die nächste Grössenordnung (Bund «1'203», Kantone «12'339»)
// und verlangt: Zahl und Einheit bleiben auf EINER Zeile, mit Reserve ≥ 8 px.
// Gemessen 25.9.2026 nach dem Fix: Bund 31 px, Kantone 62 px (1280 und 1440);
// vorher Bund mit «203» 6 px, mit «1'203» Umbruch. International (zwei-
// stellig, Einheit «Staatsverträge», Säulen-Wortlaut bei S5a) ist nicht Teil
// dieses Postens. 1024 ist nicht Pflicht (Posten «@1024×768 scrollt 69 px»).

const RESERVE_MIN = 8
const PROBE: Record<string, string> = { Bund: "1'203", Kantone: "12'339" }

for (const [breite, hoehe] of [[1280, 800], [1440, 900]] as const) {
  test(`@${breite}×${hoehe}: Bund/Kantone-Kopf halten Zahl + Einheit auf einer Zeile, auch eine Stelle mehr`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: hoehe })
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Bereiche der Sammlung' }).getByRole('button', { name: /Gesetze/ }).click()
    const blatt = page.locator('#lm-start-blatt')
    await expect(blatt).toHaveAttribute('data-phase', 'offen')
    await expect(blatt.getByRole('button', { name: 'Alle 26 Kantone' })).toBeVisible()
    for (const [titel, zahl] of Object.entries(PROBE)) {
      const kopf = blatt.getByRole('button', { name: new RegExp(`\\b${titel}$`) }).first()
      await expect(kopf).toBeVisible()
      const m = await kopf.evaluate((k, z) => {
        const zeile = k.querySelector('span.flex') as HTMLElement
        const [n, e] = [...zeile.children] as HTMLElement[]
        n.textContent = z
        const cs = getComputedStyle(k)
        const innen = k.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        const rn = n.getBoundingClientRect()
        const re = e.getBoundingClientRect()
        return { eineZeile: Math.abs(rn.top - re.top) < 20, reserve: Math.round(innen - (re.right - rn.left)), einheit: e.textContent }
      }, zahl)
      test.info().annotations.push({ type: `${titel} @${breite}`, description: JSON.stringify(m) })
      expect(m.eineZeile, `${titel}: Einheit bricht unter die Zahl (${JSON.stringify(m)})`).toBe(true)
      expect(m.reserve, `${titel}: Reserve (${JSON.stringify(m)})`).toBeGreaterThanOrEqual(RESERVE_MIN)
    }
  })
}
