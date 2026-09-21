// @shard-gruppe: 4
// W-1 (Architektur-Prüfer, PR #539) — die Trefferliste darf das Suchfeld nicht
// zudecken.
//
// BEFUND, gemessen 16.8.2026: `LeserTrefferListe.tsx` klebt mit
// `top: var(--toc-deckel, 0px)`. Diese Marke ist aus V1 geerbt, wo
// `inhalt-volltext.tsx` sie setzt — in V3 setzte sie NIEMAND. Der Rückfallwert
// 0px griff, und damit klebten der Trefferlisten-Kopf UND Zone A
// (`LeserSeitenleiste.tsx`, mit dem Suchfeld darin) beide bei `top: 0`.
// Scrollte man die Leiste, legte sich die Facetten-Leiste über das Suchfeld:
// `document.elementFromPoint` auf der Feld-Mitte traf `SuchBereichWahl`.
//
// WARUM IM BROWSER: «welches Element liegt an dieser Stelle obenauf» ist eine
// Aussage über die gerechnete Stapelung zweier `position: sticky`-Blöcke in
// einem gemeinsamen Scroller. Kein Unit-Test sieht das; nur ein Treffertest am
// echten Layout tut es.
//
// ROT ZU BEKOMMEN (§6.7): in `LeserSeitenleiste.tsx` den `ref={zoneARef}` an
// `[data-toc-zone-a]` entfernen — die Marke bleibt ungesetzt, der Rückfall 0px
// greift, und der Treffertest findet die Facetten-Leiste statt des Feldes.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test('W-1 — nach 600 px Scroll in der Trefferliste bleibt das Suchfeld sichtbar und fokussierbar', async ({ page }) => {
  test.slow() // grosser Erlass (StPO, 480 Art.), damit die Liste überhaupt scrollt
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/STPO')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })

  const feld = page.locator('[data-v3-suchsprung] input').first()
  await expect(feld).toBeVisible({ timeout: 20_000 })
  await feld.fill('Entschädigung')
  // Auf die Trefferliste warten, nicht auf eine Zeitspanne.
  await expect(page.locator('[data-treffer-liste]')).toBeVisible({ timeout: 20_000 })

  // Die Marke muss überhaupt gesetzt sein — sonst ist der Rest Zufall.
  const deckel = await page.locator('[data-v3-leiste-scroller]').evaluate((el) =>
    getComputedStyle(el).getPropertyValue('--toc-deckel').trim())
  expect(deckel, '--toc-deckel ist in V3 nicht gesetzt (Rückfall 0px)').not.toBe('')
  expect(parseFloat(deckel), '--toc-deckel ist 0 — Trefferliste und Zone A kleben auf derselben Höhe')
    .toBeGreaterThan(0)

  // Jetzt der eigentliche Befund: in der Leiste scrollen und nachsehen, WER an
  // der Stelle des Suchfelds obenauf liegt.
  await page.locator('[data-v3-leiste-scroller]').evaluate((el) => { el.scrollTop = 600 })
  await page.waitForTimeout(300)

  await expect(feld, 'Suchfeld ist nach dem Scrollen nicht mehr sichtbar').toBeVisible()

  const obenauf = await feld.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const treffer = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    return {
      istFeldOderKind: !!treffer && (treffer === el || el.contains(treffer) || treffer.contains(el)),
      tag: treffer?.tagName ?? '(nichts)',
      marker: treffer?.closest('[data-v3-suchbereich], [data-treffer-leiste], [data-treffer-liste]')
        ? 'Trefferliste/Suchbereich liegt darüber'
        : '(kein Trefferlisten-Element)',
    }
  })
  expect(obenauf.istFeldOderKind,
    `Auf der Feld-Mitte liegt <${obenauf.tag}> — ${obenauf.marker}`).toBe(true)

  // Und es ist auch wirklich bedienbar, nicht nur sichtbar.
  await feld.click()
  await expect(feld).toBeFocused()

  expect(fehler, `Konsolen-/Seitenfehler: ${fehler.join(' | ')}`).toEqual([])
})
