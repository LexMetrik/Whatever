// @shard-gruppe: 8
// ─── Scroll-Blur an der Lesespalte (Auftrag David 21.8.2026) ────────────────
//
// Zwei dezente Verlaufskanten (CSS-Gradient, `bg-paper` → transparent) am
// Kopf-Unterrand (wo `--nt-stick` endet) und am unteren Viewport-Rand der
// Lesespalte — Text verschwindet sanft unter dem klebenden Kopf statt hart zu
// schneiden (LeserLeseZeile.tsx). Reines CSS (§15, keine Scroll-Handler):
// `position: sticky` folgt automatisch dem jeweils näheren Scroll-Container
// (Fenster in der Einzelansicht, `overflow-y-auto`-Pane im Split-View).
import { test, expect } from '@playwright/test'

test.describe('Scroll-Blur an der Lesespalte (V3)', () => {
  test('obere/untere Verlaufskante: sticky, korrekt verankert, Gradient auf `paper`, kein Layout-Einfluss', async ({ page }) => {
    test.slow() // volle Leser-Instanz am schweren Erlass OR, 1686 Artikel (Muster leser-v3-eine-kopfzeile.e2e.ts)
    await page.goto('/gesetze/bund/OR')
    const spalte = page.locator('#lc-lesespalte')
    await expect(spalte).toBeVisible({ timeout: 20_000 })
    // Anker VOR jedem evaluate: der Leser ist erst fertig gemountet, wenn der
    // erste Artikel im DOM steht — sonst evaluiert die Spec auf einem Träger,
    // der im parallelen Voll-Lauf unter Last noch nicht (fertig) gerendert ist
    // (Muster leser-v3-eine-kopfzeile.e2e.ts: toBeVisible + toBeAttached #art-1).
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })

    // Die beiden Träger tragen ein Datenattribut (LeserLeseZeile.tsx) — robuster
    // als die frühere DOM-Positions-Kette (#lc-lesespalte → ../.. → > div), die
    // im parallelen Voll-Lauf sporadisch nicht auflöste (Timeout, 21.8.2026).
    const oben = page.locator('[data-v3-blur="oben"]')
    const unten = page.locator('[data-v3-blur="unten"]')
    await expect(oben).toBeAttached({ timeout: 20_000 })
    await expect(unten).toBeAttached({ timeout: 20_000 })

    // Kein Layout-Einfluss (kein CLS): beide Träger nehmen im Fluss 0 Höhe ein.
    await expect(oben).toHaveCSS('height', '0px')
    await expect(unten).toHaveCSS('height', '0px')
    await expect(oben).toHaveCSS('position', 'sticky')
    await expect(unten).toHaveCSS('position', 'sticky')
    await expect(unten).toHaveCSS('bottom', '0px')
    // `top` folgt `--nt-stick` — dieselbe Grösse, an der der Kopf klebt (nie
    // 0, sonst läge der Streifen unter statt am Kopf-Unterrand). `evaluate()`
    // hat — anders als `expect(...).toHaveCSS(...)` — kein eigenes Retry; der
    // vorangehende `toHaveCSS`-Block hat `oben` bereits stabil aufgelöst.
    const obenTop = await oben.evaluate((el) => parseFloat(getComputedStyle(el).top))
    expect(obenTop).toBeGreaterThan(0)

    // Beide Streifen sind reine Dekoration: nicht klickbar, für Screenreader
    // unsichtbar, im Druck ganz weg.
    await expect(oben).toHaveAttribute('aria-hidden', 'true')
    await expect(oben).toHaveCSS('pointer-events', 'none')
    await expect(oben).toHaveClass(/print:hidden/)
    await expect(unten).toHaveClass(/print:hidden/)

    // Gradient auf dem Token `paper`, nicht auf einem Hex-Literal — beide
    // Themes prüft die Sichtprüfung (Scratchpad-Screenshots), hier nur die
    // strukturelle Zusicherung: ein Gradient ist gesetzt. Anker VOR dem
    // evaluate (Wurzel-Fix, Vollauf-Rot 21.8.2026): `.locator('> div')` ist
    // eine neue Sub-Locator-Auflösung ohne das Retry, das `expect` mitbringt.
    const obenGradientDiv = oben.locator('> div').first()
    await expect(obenGradientDiv).toBeAttached({ timeout: 20_000 })
    const obenGradient = await obenGradientDiv.evaluate((el) => getComputedStyle(el).backgroundImage)
    expect(obenGradient).toContain('gradient')
  })

  test('Split-View: derselbe Streifen funktioniert im Pane (eigener Scroll-Container)', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen (Muster leser-v3-eine-kopfzeile.e2e.ts)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/STPO?leser=v3&p=/gesetze/bund/BGFA%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"] #lc-lesespalte')).toBeVisible({ timeout: 20_000 })
    const oben = page.locator('[data-pane="sekundaer"] [data-v3-blur="oben"]')
    await expect(oben).toHaveCSS('position', 'sticky')
    await expect(oben).toHaveCSS('height', '0px')
  })
})
