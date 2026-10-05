// @shard-gruppe: 4
// Regressionsschutz für 6b (Auftrag David 26.6.2026): die Randtitel-/Buchstaben-
// Ebenen («A. … → II. … → 2. …») sind — analog Fedlex — eigene, einklappbare
// Gliederungs-Knoten (nicht mehr nur Artikel-Marginalien). Geprüft am echten
// ZGB-Reader: Knoten existieren, klappen ein/aus, mischen direkte Artikel und
// Untergruppen in Dokument-Reihenfolge, und ein aufgehobener Artikel mit leerem
// Blatt bleibt in seiner Gruppe (keine eigene, doppelte Überschrift).
import { test, expect } from '@playwright/test'

test('Randtitel-Gruppierungen sind einklappbare Sektions-Knoten (ZGB)', async ({ page }) => {
  await page.goto('/gesetze/bund/ZGB')
  await expect(page.locator('#art-11')).toBeVisible()

  // Promotete Randtitel-Stufen erscheinen als Fliesstext-Sektionsköpfe (data-sek
  // mit einklappbarem aria-expanded-Knopf) — sowohl die Buchstaben- («II.») als
  // auch die Ziffern-Ebene.
  //
  // §6.3-Anpassung 29.6.2026 (B1 / G11 änderte das DOM, Verhalten verifiziert
  // unverändert): Der Titel-Knopf liegt seit G11 in einem <span> (damit der
  // Fussnoten-Marker Geschwister statt verschachtelter Button ist), ist also NICHT
  // mehr direktes Kind von [data-sek]. Darum Nachkomme-Selektor `[data-sek] button`
  // statt `[data-sek] > button`. Den Kopf-Text lesen wir aus dem [data-sek] OHNE
  // verschachtelte Untersektionen/Artikel (clone + strip), unabhängig davon, wie
  // roman-/Ziffern-Präfix und Resttitel in Knöpfe aufgeteilt sind.
  const sekHeads = await page.evaluate(() =>
    [...document.querySelectorAll('[data-sek]')]
      .filter((s) => s.querySelector('button[aria-expanded]'))
      .map((s) => {
        const c = s.cloneNode(true) as HTMLElement
        c.querySelectorAll('[data-sek], [id^="art-"]').forEach((x) => x.remove())
        return (c.textContent ?? '').replace(/\s+/g, ' ').trim()
      }),
  )
  expect(sekHeads.some((t) => /II\.\s*Handlungsf/.test(t)), 'II. Handlungsfähigkeit').toBe(true)
  expect(sekHeads.some((t) => /2\.\s*Voraussetzungen/.test(t)), '2. Voraussetzungen (verschachtelt)').toBe(true)

  // Einklappen der verschachtelten Gruppe «2. Voraussetzungen» blendet Art. 13–16
  // aus; der direkt unter «II.» liegende Art. 12 bleibt sichtbar (Reihenfolge).
  await expect(page.locator('#art-13')).toBeVisible()
  const kopf = page.locator('[data-sek] button', { hasText: '2. Voraussetzungen' }).first()
  await kopf.scrollIntoViewIfNeeded()
  await kopf.click()
  await expect(page.locator('#art-13')).toHaveCount(0)
  await expect(page.locator('#art-12')).toBeVisible()
  await kopf.click()
  await expect(page.locator('#art-13')).toBeVisible()

  // Dokument-Reihenfolge: direkter Artikel (12) steht VOR der verschachtelten
  // Untergruppe (13); der aufgehobene Art. 15 bleibt zwischen 14 und 16.
  const folge = await page.evaluate(() => {
    const idx = (id: string) => {
      const el = document.getElementById(id)
      if (!el) return -1
      return [...document.querySelectorAll('[id^="art-"]')].indexOf(el)
    }
    return [idx('art-12'), idx('art-13'), idx('art-14'), idx('art-15'), idx('art-16')]
  })
  expect(folge.every((v) => v >= 0), 'Art. 12–16 alle im DOM').toBe(true)
  expect([...folge].sort((a, b) => a - b), 'Art. 12<13<14<15<16 in Dokument-Reihenfolge').toEqual(folge)
})
