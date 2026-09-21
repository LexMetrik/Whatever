// @shard-gruppe: 8
// Browser-Smoke der Norm-Chip-Vorschau (W2·10-UI-NAV · V2 Hover / V4 interner
// href). Was hier steht, kann die node-Suite NICHT sehen: die Zeiger-Kette aus
// echtem Hover, portaliertem Kasten und Klick-Fänger — genau die Schicht, in
// der der Blocker B1 der Gegenprüfung sass (Backdrop `fixed inset-0` deckte den
// Chip, der Kasten schoss sich per pointerleave selbst ab und schluckte jeden
// Klick). Läuft gegen `vite preview` (dist), Fläche: `/vorlagen/mahnung`
// (Kopf-Chips «Art. 102/104/107 OR», alle mit Bund-Snapshot).
//
// Tor-Griff ist `[data-norm-vorschau]` — EIN Selektor für beide Ausprägungen,
// damit die Fälle nicht an der role kleben (die ist genau der Unterschied, den
// B2 prüft: Klick ⇒ `dialog`, Hover ⇒ `group`).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const SEITE = '/vorlagen/mahnung'
const CHIP = 'a[href="/gesetze/bund/OR#art-102"]'
const VORSCHAU = '[data-norm-vorschau]'

test.describe('V2/V4 — Norm-Chip: Hover-Vorschau und interner href', () => {
  test('(a) V4: der Kopf-Chip trägt den internen Reader-Pfad, kein target=_blank', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto(SEITE)
    const chip = page.locator(CHIP).first()
    await expect(chip).toBeVisible()
    // Genau dieses Attribut entscheidet, wo Cmd-Klick/«Link kopieren»/Mittelklick
    // landen — es IST der Prüfpunkt, nicht ein Stellvertreter dafür.
    await expect(chip).toHaveAttribute('href', '/gesetze/bund/OR#art-102')
    expect(await chip.getAttribute('target')).toBeNull()
    expect(fehler).toEqual([])
  })

  test('(b) V2: Hover öffnet nach der Verzögerung und bleibt bei ruhendem Zeiger offen', async ({ page }) => {
    // ROTBEWEIS B1: unter dem Stand vor dem Fix deckte der Klick-Fänger
    // (`fixed inset-0`) den Chip, sobald der Kasten stand → `pointerleave` am
    // Chip → 180-ms-Nachlauf → der Kasten schloss sich SELBST wieder. Genau das
    // misst die zweite Hälfte dieses Falls (ruhender Zeiger, dann erneut prüfen).
    const fehler = fehlerSammeln(page)
    await page.goto(SEITE)
    const chip = page.locator(CHIP).first()
    await chip.hover()
    const vorschau = page.locator(VORSCHAU)
    await expect(vorschau).toBeVisible({ timeout: 5_000 })
    // Zeiger bewegt sich NICHT mehr. Deutlich länger als der 180-ms-Nachlauf.
    await page.waitForTimeout(1_500)
    await expect(vorschau).toBeVisible()
    // B2: die Hover-Fläche verspricht keinen Dialog (kein Fokus-Fang, kein
    // inerter Hintergrund) — sie ist eine benannte Gruppe.
    await expect(vorschau).toHaveAttribute('role', 'group')
    expect(await vorschau.getAttribute('aria-modal')).toBeNull()
    expect(fehler).toEqual([])
  })

  test('(c) V2: der Hintergrund bleibt bedienbar, der Zeiger darf in die Karte wandern', async ({ page }) => {
    await page.goto(SEITE)
    await page.locator(CHIP).first().hover()
    const vorschau = page.locator(VORSCHAU)
    await expect(vorschau).toBeVisible({ timeout: 5_000 })
    // Kein Body-Scroll-Lock auf dem Hover-Weg (der Klick-Dialog sperrt weiter).
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    // In die Karte wandern (WCAG 1.4.13 «hoverable») — sie darf dabei nicht
    // zuklappen. Zugleich der Gegenbeweis zum Klick-Fänger: läge er noch über
    // der Seite, wäre die Überschrift der Seite nicht mehr zu treffen.
    await vorschau.hover()
    await page.waitForTimeout(400)
    await expect(vorschau).toBeVisible()
  })

  test('(d) V2/Spec: Klick-Verhalten unverändert — Klick öffnet den Dialog, auch nach Hover', async ({ page }) => {
    // ROTBEWEIS B1, zweite Hälfte: mit dem inset-0-Klick-Fänger über der Seite
    // erreichte der Klick den Chip gar nicht mehr (Playwright: «element is not
    // receiving pointer events»), bzw. traf den Backdrop → onClose.
    const fehler = fehlerSammeln(page)
    await page.goto(SEITE)
    const chip = page.locator(CHIP).first()
    await chip.hover()
    const vorschau = page.locator(VORSCHAU)
    await expect(vorschau).toBeVisible({ timeout: 5_000 })
    await chip.click()
    // Jetzt ist es der ANGEKLICKTE Dialog: role/aria-modal wie eh und je.
    await expect(page.locator(`${VORSCHAU}[role="dialog"]`)).toBeVisible()
    await expect(page.locator(`${VORSCHAU}[aria-modal="true"]`)).toBeVisible()
    // Und er trägt den Wortlaut samt amtlichem Zweitlink (§8).
    await expect(page.locator(VORSCHAU)).toContainText('Amtliche Fassung ↗')
    expect(fehler).toEqual([])
  })

  test('(e) V4: Cmd-/Ctrl-Klick landet intern im eigenen Reader, nicht im Popover', async ({ page }) => {
    // ── §6.3-DEKLARATION (W2·24-R2/D7, 6.9.2026) · WO «DER NEUE TAB» LANDET ──
    // Der Fall wartete auf ein BROWSER-Tab (`context.waitForEvent('page')`).
    // Seit der Arbeitsleiste fängt `components/TabTracker.tsx`
    // (`useNeuerReiterGeste`) die Geste selbst ab und legt einen
    // HINTERGRUND-REITER der App an — der dortige Kopfkommentar sagt es
    // wörtlich: «Der Vorgabe-Weg des Browsers (ein neues BROWSER-Fenster/-Tab)
    // wird dabei unterdrückt». Damit lief der Fall in seine eigene 5-s-Falle:
    // der Zeiger blieb während des vergeblichen Wartens auf dem Chip stehen,
    // die HOVER-Vorschau (V2, Fall (b) — genau so gewollt) ging auf, und die
    // Zeile darunter meldete sie als «Popover nach Modifier-Klick» (gemessen:
    // «24 × locator resolved to 1 element»). Sie mass also V2, nicht V4.
    // Die Zusage von V4 ist unverändert und wird ab hier VOLLSTÄNDIG geprüft,
    // statt nur «sofern die Plattform ihn öffnet»: das Ziel ist intern, es ist
    // nicht Fedlex, es trägt den Anker, die Seite bleibt stehen, und es ist
    // KEIN Klick-Dialog aufgegangen. Das ist strenger als vorher — der interne
    // Pfad war bisher nur bedingt geprüft.
    await page.goto(SEITE)
    const chip = page.locator(CHIP).first()
    await chip.click({ modifiers: ['ControlOrMeta'] })
    // Der Klick-Dialog geht NICHT auf (die Hover-Karte darf, s. Fall (b)).
    await expect(page.locator(`${VORSCHAU}[role="dialog"]`)).toHaveCount(0)
    // Die Ausgangsseite bleibt stehen — der Hintergrund-Reiter navigiert nicht.
    expect(new URL(page.url()).pathname).toBe(SEITE)
    // Und der neue Reiter zeigt in den eigenen Reader, mit dem Anker der Norm.
    const reiter = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path?: string }[] }
      catch { return [] }
    })
    const pfade = reiter.map((r) => r.path ?? '')
    expect(pfade, `Reiter: ${JSON.stringify(pfade)}`).toContain('/gesetze/bund/OR#art-102')
    expect(pfade.join(' ')).not.toContain('fedlex')
  })

  test('(g) V2/B1: die offene Hover-Karte legt NICHTS über die Seite', async ({ page }) => {
    // DETERMINISTISCHER KERN DES BLOCKERS B1 — und der Grund, warum (b)/(d) sich
    // vorher nur SPORADISCH rot zeigten: ob ein eingeschobener Klick-Fänger bei
    // ruhendem Zeiger ein `pointerleave` auslöst, entscheidet Chromium je nach
    // Mikro-Bewegung. Die Ursache ist aber jederzeit messbar: liegt über dem
    // Chip noch der Chip? Unter dem Stand vor dem Fix lieferte
    // stand ein `fixed inset-0 z-50`-<div> mit `onClick={onClose}` über der
    // ganzen Seite — daraus folgten beide Symptome (Flacker-Schleife UND
    // geschluckter Klick). Gemessen wird darum die Ursache, nicht ein Symptom.
    await page.goto(SEITE)
    await page.locator(CHIP).first().hover()
    await expect(page.locator(VORSCHAU)).toBeVisible({ timeout: 5_000 })
    const klickFaenger = await page.evaluate(() => {
      // Ein viewport-füllendes, fixiertes und klick-empfangendes Element ÜBER
      // der Seite — das ist der Backdrop, und er ist auf dem Hover-Weg der
      // Defekt. (Auf dem Klick-Weg ist er richtig und bleibt.)
      return [...document.querySelectorAll('div')].filter((d) => {
        const st = getComputedStyle(d)
        const r = d.getBoundingClientRect()
        return st.position === 'fixed' && st.pointerEvents !== 'none'
          && r.width >= window.innerWidth && r.height >= window.innerHeight
      }).map((d) => (d as HTMLElement).className)
    })
    expect(klickFaenger).toEqual([])
  })

  test('(f) V2: Touch öffnet NICHT per Hover (dort bleibt es beim Klick)', async ({ page }) => {
    await page.goto(SEITE)
    const chip = page.locator(CHIP).first()
    // KONTROLLE ZUERST: derselbe Weg mit pointerType 'mouse' MUSS öffnen. Ohne
    // sie wäre der Touch-Fall ein Schein-Grün — ein Ereignis, das React gar
    // nicht erreicht, öffnet ebenfalls nichts.
    await chip.dispatchEvent('pointerover', { pointerType: 'mouse', bubbles: true })
    await expect(page.locator(VORSCHAU)).toBeVisible({ timeout: 5_000 })
    await page.reload()
    const chip2 = page.locator(CHIP).first()
    await chip2.dispatchEvent('pointerover', { pointerType: 'touch', bubbles: true })
    await page.waitForTimeout(1_200) // deutlich über der Öffnungs-Verzögerung
    await expect(page.locator(VORSCHAU)).toHaveCount(0)
  })
})
