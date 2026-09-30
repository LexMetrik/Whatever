// @shard-gruppe: 5
// ═══ FLÄCHEN-ROLLE «TINTE LEISE» — DIE KASKADE, GEMESSEN (W2·19 DK-16) ═══════
//
// Gegenprüfung 30.9.2026 (PR #1177): die Rolle in `index.css` ist ungeschichtet
// und schlägt damit jede Farb-Utility. Sie darf darum nur Overlines ohne eigene
// Farbe treffen — `lc-overline text-danger-700` auf einer Registerfläche muss
// seine Warnfarbe behalten (§8). Die Vitest-Sonde
// (`src/tests/design-dk-c-farbe-kontrast.test.tsx`) liest nur den Quelltext und
// sieht die Kaskade nicht; dieser Fall misst die berechnete Farbe im Browser,
// hell UND dunkel.
//
// ROT ZU BEKOMMEN (§6.7): in `index.css` den Overline-Zweig der Rolle zurück
// auf `.lc-overline` (ohne `:where(:not(…))`) ⇒ der Fall «eigene Farbe bleibt»
// rot (danger-700 wird ink-600). Gegen den QUELLCODE gefahren (nicht dist/).
import { test, expect } from '@playwright/test'

for (const schema of ['light', 'dark'] as const) {
  test(`Rolle «Tinte leise»: ohne eigene Farbe ink-600, mit eigener Farbe unberührt (${schema === 'light' ? 'hell' : 'dunkel'})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: schema })
    await page.goto('/')
    await expect(page.locator('main').first()).toBeVisible({ timeout: 45_000 })

    const r = await page.evaluate(() => {
      const farbe = (el: Element) => getComputedStyle(el).color
      // Sollwerte aus den Tokens, ausserhalb jeder Registerfläche gemessen.
      const probe = (cls: string, stil = '') => {
        const e = document.createElement('span')
        e.className = cls; e.style.cssText = stil
        document.body.appendChild(e)
        const f = farbe(e); e.remove(); return f
      }
      const ink600 = probe('', 'color:var(--ink-600)')
      const ink500 = probe('', 'color:var(--ink-500)')
      const danger = probe('text-danger-700')
      const brass = probe('text-brass-700')

      const flaeche = document.createElement('div')
      flaeche.className = 'bg-reg-g-flaeche'
      flaeche.innerHTML = [
        '<p class="lc-overline" id="a">ohne Farbe</p>',
        '<p class="lc-overline text-danger-700" id="b">eigene Farbe danger</p>',
        '<p class="text-ink-500" id="c">Utility ink-500</p>',
        '<p class="lc-overline text-ink-500" id="d">Overline mit ink-500</p>',
        '<p class="lc-overline mb-1 text-brass-700" id="e">eigene Farbe brass, hinten</p>',
        '<p class="lc-overline hover:text-ink-900" id="f">Variante hover</p>',
      ].join('')
      document.body.appendChild(flaeche)
      const m = Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f'].map((k) => [k, farbe(flaeche.querySelector('#' + k)!)]))
      flaeche.remove()

      // Echte Overlines auf echten Registerflächen der Startseite.
      const echt = [...document.querySelectorAll('.bg-reg-g-flaeche .lc-overline, .bg-reg-w-flaeche .lc-overline, .bg-reg-r-flaeche .lc-overline, .bg-reg-m-flaeche .lc-overline')]
        .filter((e) => !/(^|[\s:])text-/.test(e.getAttribute('class') ?? ''))
        .map((e) => farbe(e))
      return { ink600, ink500, danger, brass, m, echt }
    })

    expect(r.ink600, 'Sollwert ink-600 ≠ ink-500').not.toBe(r.ink500)
    expect(r.danger, 'Sollwert danger-700 ≠ ink-600').not.toBe(r.ink600)
    expect(r.m.a, 'Overline ohne Farbe → ink-600').toBe(r.ink600)
    expect(r.m.c, 'text-ink-500 → ink-600').toBe(r.ink600)
    expect(r.m.d, 'Overline mit text-ink-500 → ink-600').toBe(r.ink600)
    expect(r.m.b, 'Overline mit text-danger-700 behält die Warnfarbe').toBe(r.danger)
    expect(r.m.e, 'Overline mit text-brass-700 behält ihre Farbe').toBe(r.brass)
    expect(r.m.f, 'Overline mit Varianten-Farbe (hover:text-…) zählt als eigene Farbe: bleibt ink-500').toBe(r.ink500)
    for (const f of r.echt) expect(f, 'echter Overline auf Registerfläche ohne eigene Farbe → ink-600').toBe(r.ink600)
  })
}
