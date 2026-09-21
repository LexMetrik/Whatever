// @shard-gruppe: 6
// FN-5/M14 (W2·5d, FAHRPLAN-NORMTEXT-DARSTELLUNG §M14): wortgenaue Fussnoten-
// Marker. Der Marker rendert an der amtlichen Wortstelle IM Satz (Sidecar-`pos`
// aus fussnoten-offsets.ts), nicht mehr pauschal am Absatz-/Item-Ende.
//
// Zeugen (Positionen gegen /tmp-Fedlex-Cache verifiziert, 26.7.2026):
//  · ZGB 798a fn 667 — absatzloser Fliesstext, Marker mitten im Satz nach
//    «…Bundesgesetz vom 4. Oktober 1991», VOR «über das bäuerliche Bodenrecht»
//    (Fedlex: «…1991⁶⁶⁷ über das bäuerliche Bodenrecht»). Der A31a-Fall, der
//    bisher nur block-genau (Marker am Blockende) gerendert wurde.
//  · KKV-FINMA Art. 60 fn 14 — Marker nach der SR-Abkürzung «KKV» mitten im
//    Absatz («…Artikel 72 Absatz 3 KKV¹⁴ das Gesamtengagement …»).
// Kippt die Offset-Pipeline (Sidecar ohne pos, Drift-Riegel, Segmentierung),
// fällt der Marker ans Blockende zurück und die Reihenfolgen-Asserts hier
// werden rot.
import { test, expect } from '@playwright/test'
import { vollerApparat } from './helpers/vollerApparat'

// ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ─────────────────────
// Die Vorgabe der Ansicht ist seither «Fassung», und dort sind die als `kl:'A'`
// klassifizierten Änderungs-Fussnoten samt ihren Markern gedämpft (beim
// Bundesrecht die Mehrheit: ZGB 719 von 809, StPO 187 von 283). Diese Sonde
// prüft die EXTRAKTION, nicht die Ansicht — sie stellt darum den vollen
// Apparat ein. Die geprüfte Aussage ist Wort für Wort unverändert.
test.beforeEach(async ({ page }) => { await vollerApparat(page) })


test('ZGB Art. 798a: fn 667 sitzt nach «1991» mitten im Satz, nicht am Absatzende', async ({ page }) => {
  await page.goto('/gesetze/bund/ZGB#art-798_a')
  const art = page.locator('#art-798_a')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  const abs = art.locator('p', { hasText: 'Für die Verpfändung von landwirtschaftlichen' })
  await expect(abs).toHaveCount(1)
  await expect(abs.getByRole('button', { name: 'Fussnote 667' })).toHaveCount(1)
  // Wortstellen-Beweis: die Marker-Ziffer steht ZWISCHEN «Oktober 1991» und
  // «über das bäuerliche Bodenrecht» (innerText enthält den Button-Text «667»;
  // dazwischen höchstens Word-Joiner/Whitespace).
  const text = (await abs.innerText()).replace(/\s+/g, ' ')
  expect(text).toMatch(/Oktober 1991\W{0,2}667\W{0,2}über das bäuerliche Bodenrecht/)
})

test('DBG Art. 22: fn 57 (pos auf Formelbild-Block) — kein Marker-Verlust (B1)', async ({ page }) => {
  // Gegenprüfungs-Befund B1 (26.7.2026): pos {b:4,it:0} zeigt auf einen
  // Bild-Block. Seit der itemListe-Extraktion (PR #372) rendern Bild-Blöcke
  // ihre items samt Marker-Slots; der B1-Riegel routet Item-pos darum wieder
  // inline (Absatz-Text-pos auf Bild-Blöcken bleibt verworfen). Diese
  // Assertion ist der Verlust-/Doppel-Wächter (genau EIN Marker im Artikel);
  // die genaue Platzierung im Rendite-Item prüft bild-block-items.e2e.ts.
  await page.goto('/gesetze/bund/DBG#art-22')
  const art = page.locator('#art-22')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()
  await expect(art.getByRole('button', { name: 'Fussnote 57' })).toHaveCount(1)
})

test('KKV-FINMA Art. 60: fn 14 sitzt nach «KKV» mitten im Absatz', async ({ page }) => {
  await page.goto('/gesetze/bund/KKV_FINMA#art-60')
  const art = page.locator('#art-60')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  const abs = art.locator('p', { hasText: 'Gesamtengagements gemäss Artikel 72 Absatz 3' })
  await expect(abs.first()).toBeVisible()
  await expect(abs.first().getByRole('button', { name: 'Fussnote 14' })).toHaveCount(1)
  const text = (await abs.first().innerText()).replace(/\s+/g, ' ')
  expect(text).toMatch(/Absatz 3 KKV\W{0,2}14\W{0,2}das Gesamtengagement/)
})
