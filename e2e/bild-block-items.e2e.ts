// @shard-gruppe: 6
// Wächter (FN-5-Gegenprüfung R2, 26.7.2026): Bild-/Kachel-Blöcke, die zusätzlich
// `items` tragen, müssen Bild UND Aufzählung rendern. Vorbestehender main-Defekt:
// ArtikelBody kehrte bei bb.bild/bb.bildKacheln früh zurück und verschluckte die
// items — bei DBG Art. 22 und STHG Art. 7 hing die amtliche <dl> («Ist diese
// Rendite negativ oder null, so beträgt der Ertragsanteil null Prozent.») am
// Formelbild-Block und war im Reader unsichtbar (§1/§8: amtliche Substanz fehlt).
// Prüft am echten Reader (gebautes dist via vite preview).
import { test, expect } from '@playwright/test'
import { vollerApparat } from './helpers/vollerApparat'

// ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ─────────────────────
// Die Vorgabe der Ansicht ist seither «Fassung», und dort sind die als `kl:'A'`
// klassifizierten Änderungs-Fussnoten samt ihren Markern gedämpft (beim
// Bundesrecht die Mehrheit: ZGB 719 von 809, StPO 187 von 283). Diese Sonde
// prüft die EXTRAKTION, nicht die Ansicht — sie stellt darum den vollen
// Apparat ein. Die geprüfte Aussage ist Wort für Wort unverändert.
test.beforeEach(async ({ page }) => { await vollerApparat(page) })


test('DBG 22: Formelbild-Block zeigt Bild UND seine lit./Ziff.-Items', async ({ page }) => {
  await page.goto('/gesetze/bund/DBG#art-22')
  const art = page.locator('#art-22')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  // Das Formelbild bleibt da (kein Regressions-Tausch Bild gegen Items).
  await expect(art.locator('img[src*="bilder/dbg/image2"]')).toBeVisible()

  // Amtlicher Item-Wortlaut am zweiten Formelbild-Block (Ziff. 2 der Staffel).
  await expect(
    art.getByText('Ist diese Rendite negativ oder null, so beträgt der Ertragsanteil null Prozent.'),
  ).toBeVisible()
  // Item am ersten Formelbild-Block (Ziff. 2 zur Zinssatz-Formel).
  await expect(
    art.getByText('Ist dieser Zinssatz negativ oder null, so beträgt der Ertragsanteil null Prozent.'),
  ).toBeVisible()
})

test('DBG 22: fn 57 sitzt IM Rendite-Item des Formelbild-Blocks (B1-Riegel-Lockerung)', async ({ page }) => {
  // Nach der Riegel-Lockerung (Item-Slot existiert seit dem itemListe-Fix auch
  // auf Bild-Blöcken) routet pos {b:4,it:0,o:79} wieder inline: der Marker
  // klebt am Rendite-Item selbst — nicht mehr via Legacy-Fallback (absatz='3')
  // am Ende des Abs.-3-Fliesstexts, zwei Blöcke über der Zielstelle.
  // Genau EIN Marker im Artikel (kein Doppel-Rendering).
  await page.goto('/gesetze/bund/DBG#art-22')
  const art = page.locator('#art-22')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()
  const fn57 = art.getByRole('button', { name: 'Fussnote 57' })
  await expect(fn57).toHaveCount(1)
  const renditeItem = art.locator('li', { hasText: 'Ist diese Rendite negativ oder null' })
  await expect(renditeItem).toHaveCount(1)
  await expect(renditeItem.getByRole('button', { name: 'Fussnote 57' })).toHaveCount(1)
})

test('DBG 22: Bild-Block-Items tragen die blockübergreifende Fundstelle (Abs. 3 lit. a/c)', async ({ page }) => {
  // Fortsetzungs-Kette (26.7.2026): die Zitier-Marken der vom Formelbild
  // unterbrochenen Ziffern zeigen die PRÄZISE amtliche Fundstelle — Kette über
  // Anker-Absatz (Abs. 3) und die lit. des Vorgängerblocks. Vorher waren die
  // Marken unterdrückt (lokales Zitat wäre «Art. 22 Ziff. 2 DBG» gewesen, eine
  // Fundstelle, die es amtlich nicht gibt).
  await page.goto('/gesetze/bund/DBG#art-22')
  const art = page.locator('#art-22')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  const zinssatzItem = art.locator('li', { hasText: 'Ist dieser Zinssatz negativ oder null' })
  await expect(zinssatzItem.locator('button[title="Art. 22 Abs. 3 lit. a Ziff. 2 DBG — kopieren"]')).toHaveCount(1)

  const renditeItem = art.locator('li', { hasText: 'Ist diese Rendite negativ oder null' })
  await expect(renditeItem.locator('button[title="Art. 22 Abs. 3 lit. c Ziff. 2 DBG — kopieren"]')).toHaveCount(1)

  // Die beiden «2.»-Marken sind damit UNTERSCHEIDBAR (lit. a vs. lit. c) —
  // exakt der Befund-3-Fall der Gegenprüfung.
})

test('STHG 7: Rendite-Item trägt die Fundstelle Abs. 2 lit. c Ziff. 2', async ({ page }) => {
  await page.goto('/gesetze/bund/STHG#art-7')
  const art = page.locator('#art-7')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()
  const renditeItem = art.locator('li', { hasText: 'Ist diese Rendite negativ oder null' })
  await expect(renditeItem.locator('button[title="Art. 7 Abs. 2 lit. c Ziff. 2 StHG — kopieren"]')).toHaveCount(1)
})

test('STHG 7: Formelbild-Block zeigt Bild UND seine Items', async ({ page }) => {
  await page.goto('/gesetze/bund/STHG#art-7')
  const art = page.locator('#art-7')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  await expect(
    art.getByText('Ist diese Rendite negativ oder null, so beträgt der Ertragsanteil null Prozent.'),
  ).toBeVisible()
  // fn 27 (pos {b:5,it:0,o:79}) routet nach der Riegel-Lockerung inline ins
  // Rendite-Item — genau einmal, kein Verlust, kein Doppel.
  const fn27 = art.getByRole('button', { name: 'Fussnote 27' })
  await expect(fn27).toHaveCount(1)
  await expect(
    art.locator('li', { hasText: 'Ist diese Rendite negativ oder null' }).getByRole('button', { name: 'Fussnote 27' }),
  ).toHaveCount(1)
})
