// @shard-gruppe: 2
// ═══ W2·24 GB · «NICHT TRIST»: DIE REGISTERFARBE STEHT IN DER SEITE ═════════
//
// BEFUND G1 der Gesamtprüfung «Ästhetik + Kopf-/Ortsprüfung» (6./7.9.2026,
// 56 Messungen): ausserhalb der Startseite trug im ERSTEN BILD fast nur noch
// der Unterstrich der Arbeitsleiste eine Registerfarbe — Erlass-Leser 2 Träger,
// /gesetze 3, Entscheid 4, Rechner 5, Vorlage 6, /rechtsprechung 7; in sieben
// von neun Fällen war der einzige Träger `SPAN.absolute inset-x-0`, also die
// Leiste, nicht die Seite. Referenz «/»: 14. David 6.9.2026: «achte darauf,
// dass es nicht zu trist wirkt.»
//
// DIESE SONDE MISST DIE SEITE, NICHT DIE LEISTE. Gezählt wird nur, was in
// `main` (bzw. im Leser-`header`) im ersten Bild steht; Arbeitsleiste,
// Seitenleiste und Reiter-Streifen sind ausdrücklich ausgeschlossen — sonst
// bestünde die Auflage schon durch das, was G1 gerade rügt.
//
// SCHWELLE ≥ 3 (Auflage des Bau-Auftrags). Sie gilt für jede Route MIT
// Register; Meta-Seiten ohne Register (`/suche`, `/einstellungen`, statische
// Seiten) tragen bewusst KEINE Farbe — `layout/bereiche.registerVonPfad` gibt
// dort `null` zurück, und eine geratene Farbe wäre eine Behauptung (§8). Die
// Sonde prüft darum zweiseitig: mit Register ≥ 3, ohne Register exakt 0 an
// `data-reg`.
//
// ROT ZU BEKOMMEN (§6.7, am 7.9.2026 gesehen — Protokoll in
// `abnahme/design-identitaet/GB-LEBEN.md` §Rot-Proben):
//   · in `components/layout/RouteHuelle.tsx` das `data-reg={…}` streichen
//     ⇒ alle Rezepte in `src/index.css` §GB-1/GB-1b laufen ins Leere,
//     gemessen: Erlass-Leser 0 · Entscheid 0 · Rechner 0 · Vorlage 0 ·
//     /gesetze 1 · /rechtsprechung 5 — vier Routen unter der Schwelle.
//   · in `src/index.css` die Zeile `.lc-badge { text-transform: none; }`
//     streichen ⇒ die Versal-Probe zählt wieder 53 Sprach-Badges auf
//     /rechtsprechung.
import { test, expect, type Page } from '@playwright/test'

test.describe.configure({ timeout: 120_000 })

/** Routen mit Register (Bereich-Präfix in `layout/bereiche`). */
const MIT_REGISTER: [string, string][] = [
  ['/gesetze', 'g'],
  ['/gesetze/bund/OR', 'g'],
  ['/rechtsprechung', 'r'],
  ['/rechtsprechung/ag_gerichte_HOR_2024_19', 'r'],
  ['/materialien', 'm'],
  ['/rechner/tagerechner', 'w'],
  ['/vorlagen/kuendigung-arbeitgeber', 'w'],
]
/** Routen ohne Register — sie dürfen KEINE tragen (§8, keine geratene Farbe). */
const OHNE_REGISTER = ['/einstellungen', '/kontakt']

/**
 * Zählt sichtbare Elemente im ersten Bild, deren berechnete Farbe (Tinte,
 * Fläche, Kante, Umriss, Unterstreichung — auch an ::before/::after) exakt
 * einer der vier Registerfarben entspricht. Ausgeschlossen: alles unter der
 * Arbeits-/Seitenleiste.
 */
const traeger = (page: Page) => page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement)
  const norm = (s: string) => {
    const m = /^#([0-9a-f]{6})$/i.exec(s.trim())
    if (!m) return s.toLowerCase().replace(/\s/g, '')
    const h = m[1]
    return `rgb(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)})`
  }
  const ziel = new Set(['--reg-g', '--reg-r', '--reg-m', '--reg-w']
    .map((v) => cs.getPropertyValue(v).trim()).filter(Boolean).map(norm))
  const EIG = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
    'borderBottomColor', 'borderLeftColor', 'outlineColor', 'textDecorationColor'] as const
  const h = window.innerHeight
  const funde: string[] = []
  for (const el of document.querySelectorAll<HTMLElement>('main, main *, header, header *')) {
    if (el.closest('nav[aria-label="Offene Reiter"], [data-reiter-streifen], [data-app-seitenleiste]')) continue
    const r = el.getBoundingClientRect()
    if (r.top > h || r.bottom < 0 || r.width === 0 || r.height === 0) continue
    const st = getComputedStyle(el)
    let treffer = EIG.find((e) => ziel.has(norm(st[e] || '')))
    if (!treffer) {
      for (const pe of ['::before', '::after'] as const) {
        const p = getComputedStyle(el, pe)
        if (!p.content || p.content === 'none') continue
        const t = (['backgroundColor', 'color', 'borderTopColor', 'borderLeftColor'] as const)
          .find((e) => ziel.has(norm(p[e] || '')))
        if (t) { treffer = t; break }
      }
    }
    if (treffer) funde.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}[${treffer}]`)
  }
  return funde
})

for (const [breite, hoehe] of [[1440, 900], [390, 844]] as const) {
  for (const schema of ['light', 'dark'] as const) {
    test.describe(`Registerfarbe in der Seite @${breite} ${schema}`, () => {
      test.use({ viewport: { width: breite, height: hoehe }, colorScheme: schema })

      for (const [pfad, reg] of MIT_REGISTER) {
        test(`≥ 3 Träger ausserhalb der Reiterleiste — ${pfad}`, async ({ page }) => {
          await page.goto(pfad)
          await page.waitForLoadState('networkidle')
          await expect(page.locator(`.lc-route[data-reg="${reg}"]`)).toHaveCount(1)
          const funde = await traeger(page)
          expect(funde.length,
            `${pfad} trägt im ersten Bild nur ${funde.length} Registerfarb-Träger: ${funde.join(' · ')}`)
            .toBeGreaterThanOrEqual(3)
        })
      }

      for (const pfad of OHNE_REGISTER) {
        test(`kein geratenes Register — ${pfad}`, async ({ page }) => {
          await page.goto(pfad)
          await page.waitForLoadState('networkidle')
          await expect(page.locator('.lc-route[data-reg]')).toHaveCount(0)
        })
      }
    })
  }
}

test.describe('Etiketten ohne Versalien (F0.7, Befund G13)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })
  // Der ENTSCHEID-LESER steht bewusst mit in der Liste: er ist die einzige
  // Stelle, an der die Utility «uppercase» im Markup noch steht (Datei liegt
  // bei Fixer GA, befristete Ausnahme in `scripts/check-design-tokens.ts`).
  // Nur hier kann diese Sonde die WIRKUNG der CSS-Regel beweisen — an den
  // uebrigen Routen ist das Wort schon aus der Quelle verschwunden, dort
  // koennte der Test auch ohne die Regel nicht rot werden (§6.7).
  for (const pfad of ['/rechtsprechung', '/rechtsprechung/ag_gerichte_HOR_2024_19', '/materialien', '/gesetze']) {
    test(`kein uppercase an .lc-badge — ${pfad}`, async ({ page }) => {
      await page.goto(pfad)
      await page.waitForLoadState('networkidle')
      const versal = await page.$$eval('.lc-badge, [class*="lc-badge-"]',
        (els) => els.filter((e) => getComputedStyle(e).textTransform === 'uppercase')
          .map((e) => e.textContent?.trim() ?? ''))
      expect(versal, `${pfad}: ${versal.length} Versal-Etikett(en): ${versal.slice(0, 6).join(' · ')}`)
        .toEqual([])
    })
  }
})
