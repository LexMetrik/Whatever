// @shard-gruppe: 5
// ═══ KONTRAST DER FRIST-MARKEN (W2·29-WERKBANK-REST S3, 25.9.2026) ═══════════
//
// Posten 19.9./20.9.2026 (blockieren Dependabot #918 = axe 4.13): axe meldete
// `color-contrast (serious)` an den beiden gefüllten Tagzahl-Marken des
// Fristenkalenders — Fristende `.text-auf-sage.bg-ok-solid.lc-termin-ring`
// 4.45:1 und Fristbeginn `.text-auf-gold.bg-brass-500` 3.46:1.
//
// WARUM `e2e/a11y.e2e.ts` DAS HEUTE NICHT MEHR SIEHT: axe überspringt
// einstellige Tagzahlen («Element content is too short to determine if it is
// actual text content» → `incomplete`, nicht `violations`). Der Tagerechner
// zeigt als Vorgabe 5. Juni → 6. Juni → 6. Juli, also nur «6» — der Befund
// hing am Kalenderdatum des Laufs. Dieser Fall setzt die Tagzahl der ECHTEN
// Marken (Klassen aus `components/FristenKalender.tsx`, nichts nachgebaut)
// auf zwei Stellen und prüft sie gezielt, hell UND dunkel.
//
// ROT ZU BEKOMMEN (§6.7): in `FristenKalender.tsx` die a-quo-Marke zurück auf
// `text-auf-gold` ⇒ «hell» rot (3.47:1). GEFAHREN 25.9.2026 gegen dist/ vor
// dem Fix: mit @axe-core/playwright 4.13.0 (temporär, --no-save) hell 1
// Verstoss «.text-auf-gold … 3.46 (#25231f auf #7a766e)», dunkel 0; mit dem
// Stand 4.11 rot über die eigene Messung (s. unten): hell 3.37:1 (Tinte
// `auf-gold` auf der abgedunkelten Füllung #78746C), dunkel 4.93:1.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const MARKEN = '.lc-termin-ring.bg-ok-solid, .bg-brass-500.rounded-full.font-semibold'

for (const schema of ['light', 'dark'] as const) {
  test(`Frist-Marken ≥ 4,5:1 (${schema === 'light' ? 'hell' : 'dunkel'})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: schema })
    await page.goto('/rechner/tagerechner')
    const marken = page.locator(`main :is(${MARKEN})`).filter({ hasText: /\d/ })
    await expect(marken.first()).toBeVisible({ timeout: 45_000 })
    const n = await marken.count()
    expect(n, 'Fristbeginn- und Fristende-Marke gefunden').toBeGreaterThanOrEqual(2)
    // Zweistellige Tagzahl, damit axe die Marke als Text bewertet (s. Kopf).
    await marken.evaluateAll((els) => els.forEach((e, i) => { e.textContent = String(16 + i) }))
    // Mittig, nicht an den Rand: am oberen Rand liegt die klebende Kopfzeile
    // über der Marke, und axe meldet «overlapped by another element».
    await marken.first().evaluate((e) => e.scrollIntoView({ block: 'center' }))
    const r = await new AxeBuilder({ page }).include(`main :is(${MARKEN})`).withRules(['color-contrast']).analyze()
    const befunde = r.violations.flatMap((v) => v.nodes.map((k) => `${k.target.join(' ')} — ${k.any.map((a) => a.message).join(' | ')}`))
    expect(befunde, befunde.join('\n')).toEqual([])
    // Eigene Messung, unabhängig von der axe-Version: @axe-core 4.11 (Stand
    // package.json) stuft dieselben Marken als `incomplete` ein («overlapped
    // by another element» — das Fristband liegt in derselben Zelle), erst
    // 4.13 bewertet sie. Die Marke trägt ihre Füllung selbst, also misst der
    // Fall Tinte gegen EIGENE Hintergrundfarbe (Canvas-normalisiert).
    const werte = await marken.evaluateAll((els) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1
      const cx = cv.getContext('2d', { willReadFrequently: true })!
      const rgb = (f: string) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = f; cx.fillRect(0, 0, 1, 1); return Array.from(cx.getImageData(0, 0, 1, 1).data).slice(0, 3) }
      const lum = (c: number[]) => { const [r, g, b] = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
      return els.map((e) => {
        const s = getComputedStyle(e); const [a, b] = [lum(rgb(s.color)), lum(rgb(s.backgroundColor))].sort((x, y) => y - x)
        return { klasse: (e.getAttribute('class') ?? '').split(' ').filter((k) => /^(text|bg)-/.test(k)).join(' '), fg: s.color, bg: s.backgroundColor, kontrast: Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100 }
      })
    })
    console.log(`Frist-Marken ${schema}`, JSON.stringify(werte))
    for (const w of werte) expect(w.kontrast, `${w.klasse}: ${w.fg} auf ${w.bg}`).toBeGreaterThanOrEqual(4.5)
  })
}
