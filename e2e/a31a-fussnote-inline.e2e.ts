// @shard-gruppe: 3
// A31a (David-Befund 16.7.2026 Ziff. 3): Die SR-Fussnote 667 in ZGB Art. 798a
// gehört INLINE in den Fliesstext nach «1991» (so rendert Fedlex), nicht an die
// Artikelebene/Marginalie. fn 666 («Eingefügt durch …») bleibt an der Marginalie.
// Prüft das am echten ZGB-Reader (gebautes dist via vite preview).
import { test, expect } from '@playwright/test'
import { vollerApparat } from './helpers/vollerApparat'

// ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ─────────────────────
// Die Vorgabe der Ansicht ist seither «Fassung», und dort sind die als `kl:'A'`
// klassifizierten Änderungs-Fussnoten samt ihren Markern gedämpft (beim
// Bundesrecht die Mehrheit: ZGB 719 von 809, StPO 187 von 283). Diese Sonde
// prüft die EXTRAKTION, nicht die Ansicht — sie stellt darum den vollen
// Apparat ein. Die geprüfte Aussage ist Wort für Wort unverändert.
test.beforeEach(async ({ page }) => { await vollerApparat(page) })


test('ZGB 798a: fn 667 steht INLINE im Fliesstext-Absatz, fn 666 bleibt Artikelebene', async ({ page }) => {
  await page.goto('/gesetze/bund/ZGB')
  // Zielartikel sichtbar machen (content-visibility → in den Viewport scrollen).
  await page.goto('/gesetze/bund/ZGB#art-798_a')
  const art = page.locator('#art-798_a')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  const fn666 = art.getByRole('button', { name: 'Fussnote 666' })
  const fn667 = art.getByRole('button', { name: 'Fussnote 667' })
  await expect(fn666).toBeVisible()
  await expect(fn667).toBeVisible()

  // fn 667 sitzt im FLIESSTEXT-Absatz (dem <p>, das mit «Für die Verpfändung»
  // beginnt) — eindeutig, nicht der Fussnoten-Apparat, der denselben Wortlaut zitiert.
  const fliessAbsatz = art.locator('p', { hasText: 'Für die Verpfändung' })
  await expect(fliessAbsatz).toHaveCount(1)
  await expect(fliessAbsatz.getByRole('button', { name: 'Fussnote 667' })).toHaveCount(1)
  // fn 666 sitzt NICHT im Fliesstext-Absatz (sondern an der Marginalie/Artikelkopf).
  await expect(fliessAbsatz.getByRole('button', { name: 'Fussnote 666' })).toHaveCount(0)

  // Positionsbeleg: fn 667 rendert NACH dem Wort «1991» im selben Absatz.
  const boxWort = await fliessAbsatz.evaluate((el) => {
    const t = el.textContent ?? ''
    return t.includes('1991') && t.includes('bäuerliche Bodenrecht')
  })
  expect(boxWort, 'Fliesstext trägt «1991» und «bäuerliche Bodenrecht»').toBeTruthy()
})

// A43 (David-Befund 16.7.): Die Fussnoten-Reihenfolge im Apparat folgt der
// Fedlex-Dokumentreihenfolge (laufende Nummer). Bei SchKG Art. 56 gehört die
// Randtitel-/Section-Fussnote 95 («III. Geschlossene Zeiten …», steht ÜBER dem
// Artikel) VOR die artikel-eigenen 96–98 — vorher wurde sie ans Ende gehängt.
test('SchKG 56: Fussnoten-Apparat in Fedlex-Reihenfolge (95 vor 96–98)', async ({ page }) => {
  await page.goto('/gesetze/bund/SCHKG#art-56')
  const art = page.locator('#art-56')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()
  const order = await art.locator('[data-fn-apparat]').evaluate((el) =>
    [...el.querySelectorAll('p')].map((p) => p.querySelector('.num')?.textContent?.trim()).filter(Boolean),
  )
  expect(order).toEqual(['95', '96', '97', '98'])
})

