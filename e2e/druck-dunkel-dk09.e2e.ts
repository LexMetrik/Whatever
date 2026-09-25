// @shard-gruppe: 3
// ═══ DK-09 · DRUCK AUS DEM DUNKELMODUS (W2·29-WERKBANK-REST S3, 25.9.2026) ═══
//
// Befund (Herz-und-Nieren-Prüfung, bestätigt 25.9.2026, Bericht
// `pruefung-herz-nieren-2026-09-24/berichte/design-nachzug-2026-09-25.md`):
// wer im Dunkelmodus druckt, bekommt Fliesstext #E2E0DC auf Weiss — 1.32:1.
// Der Druckblock setzte `body { background: #fff }`, die Tinten-Token blieben
// aber die des `html.dark`-Overrides. Fix: der Dunkel-Override der Token gilt
// nur am Bildschirm (`@media not print` um `html.dark` in `src/index.css`) —
// der Ausdruck steht immer auf den hellen Token, ohne zweite Wertequelle.
//
// ROT ZU BEKOMMEN (§6.7): die Klammer `@media not print { … }` um den
// `html.dark`-Tokenblock entfernen ⇒ beide Fälle rot. GEFAHREN 25.9.2026
// gegen dist/ VOR dem Fix (= ohne Klammer): 2 failed — Gesetz h1
// rgb(226,224,220) 1.32:1, Art. 1 Abs. 1 1.93:1; Entscheid h1 1.32:1,
// Erwägung 1.57:1. Nach dem Fix: 15.68 / 11.68 / 15.68 / 13.17:1.
import { test, expect, type Page } from '@playwright/test'

/** Kontrast jeder Probe gegen PAPIER-WEISS. Nicht gegen die berechnete
 *  Fläche: Browser drucken Hintergründe standardmässig NICHT (Druckdialog
 *  «Hintergrundgrafiken» aus) — die Tinte landet auf weissem Papier, auch wenn
 *  am Schirm ein dunkles `--paper` darunter läge. Genau so misst der Befund
 *  (#E2E0DC auf Weiss = 1.32:1). Farben über ein Canvas normalisiert, damit
 *  oklab/color-mix/Hex gleich gelesen werden. */
async function minKontrast(page: Page, selektoren: string[]) {
  return page.evaluate((sel) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1
    const cx = cv.getContext('2d', { willReadFrequently: true })!
    const rgba = (farbe: string) => {
      cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = farbe; cx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data
      return { r, g, b, a: a / 255 }
    }
    const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const papier = { r: 255, g: 255, b: 255, a: 1 }
    const proben: { was: string; text: string; farbe: string; kontrast: number }[] = []
    for (const s of sel) {
      for (const el of Array.from(document.querySelectorAll(s)).slice(0, 4)) {
        const text = (el.textContent ?? '').trim()
        if (!text) continue
        const vg = rgba(getComputedStyle(el).color); const hg = papier
        const [l1, l2] = [lum(vg), lum(hg)].sort((a, b) => b - a)
        proben.push({ was: s, text: text.slice(0, 30), farbe: getComputedStyle(el).color, kontrast: Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100 })
      }
    }
    return proben
  }, selektoren)
}

async function dunkelDrucken(page: Page, pfad: string, warte: string) {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto(pfad)
  await expect(page.locator(warte).first()).toBeVisible({ timeout: 45_000 })
  // Vorbedingung: der Bildschirm steht wirklich dunkel (unberührter Erstbesuch
  // folgt dem System, `components/thema.ts`).
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  // Gegenprobe: AM SCHIRM gilt der Dunkel-Override weiter — die Titel-Tinte
  // ist hell (gegen Weiss also kontrastarm). Fällt die Klammer zu weit aus,
  // wird der Schirm hell und dieser Satz rot.
  const schirm = await minKontrast(page, ['main h1'])
  expect(schirm[0]?.kontrast, `Schirm dunkel: ${JSON.stringify(schirm[0])}`).toBeLessThan(2)
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' })
}

test.describe('DK-09 · Druck × dunkel', () => {
  test('Gesetzes-Leser: Titel und Artikeltext ≥ 4,5:1 im Ausdruck', async ({ page }) => {
    await dunkelDrucken(page, '/gesetze/bund/OR', '#art-1')
    const proben = await minKontrast(page, ['main h1', '#art-1 p', '#art-2 p'])
    console.log('DK-09 Gesetz', JSON.stringify(proben))
    expect(proben.length, 'Proben gefunden').toBeGreaterThanOrEqual(3)
    for (const p of proben) expect(p.kontrast, `${p.was} «${p.text}» ${p.farbe}`).toBeGreaterThanOrEqual(4.5)
  })

  test('Entscheid-Leser: Titel und Erwägungstext ≥ 4,5:1 im Ausdruck', async ({ page }) => {
    await dunkelDrucken(page, '/rechtsprechung/bge_149_IV_213', '.rsp-prose p')
    const proben = await minKontrast(page, ['main h1', '.rsp-prose p'])
    console.log('DK-09 Entscheid', JSON.stringify(proben))
    expect(proben.length, 'Proben gefunden').toBeGreaterThanOrEqual(3)
    for (const p of proben) expect(p.kontrast, `${p.was} «${p.text}» ${p.farbe}`).toBeGreaterThanOrEqual(4.5)
  })
})
