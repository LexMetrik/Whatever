// @shard-gruppe: 7
// IA-6 · International-Kanonik STUFE 2 (FAHRPLAN-GESETZES-UX §11.4 Ziff. 3,
// §11.8 Y-C, W2·5d — David-Go 3.8.2026): /international ist keine Alias-Seite
// mehr, sondern ein echter Redirect auf die Säule /gesetze?ebene=international.
// Beweise dieser Spec:
//   – Deep-Link-REGRESSION 5/5: jede der fünf Alt-Anker-URLs landet auf der
//     Säule UND mit der Ziel-Sektion im Viewport (Hash-Mapping, nicht nur
//     Pfad-Umleitung).
//   – Alte Bookmark-URL OHNE Hash landet auf der nackten Säule.
//   – `replace`: der Alias hinterlässt keinen History-Eintrag (kein Zurück-Loop).
//   – Interne Nav zeigt direkt auf die Säule (R-SCOPE-4) — kein Umweg über den
//     Alias, und der Klick landet mit der Sektion im Viewport.
//   – Gegenprobe /gesetze: Self-Canonical unverändert; /suche unangetastet (§11.7).
//
// GRENZE DIESER SUITE (ehrlich, §8): sie läuft gegen `vite preview` (dist) —
// der SERVER-Redirect (vercel.json 308) ist hier NICHT wirksam, geprüft wird der
// Client-Redirect (src/pages/InternationalRedirect.tsx). Die vercel-Ebene deckt
// src/tests/international-redirect.test.ts ab (Konfig-Tor), prod deckt
// scripts/betrieb/prod-smoke.ts ab (308 gegen die Live-Domain).
import { test, expect, type Page } from '@playwright/test'
import { seitenleisteOeffnen } from './helpers/seitenleiste'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const SITE_URL = 'https://lexmetrik.vercel.app'
const SAEULE_PFAD = '/gesetze'
const SAEULE_QUERY = 'ebene=international'

// Die 5 Anker — Wortlaut-identisch zu src/lib/navigation.ts (Spec §11.4 Ziff. 3).
const ANKER = ['menschenrechte', 'privat-zivil', 'rechtshilfe', 'schweiz-eu', 'eu-verordnungen']

/** Prüft: URL steht auf der Säule, mit erwartetem Hash. */
async function erwarteSaeule(page: Page, hash: string) {
  await expect(page).toHaveURL(new RegExp(`\\${SAEULE_PFAD}\\?${SAEULE_QUERY}${hash ? `#${hash}` : '$'}`))
  const url = new URL(page.url())
  expect(url.pathname).toBe(SAEULE_PFAD)
  expect(url.searchParams.get('ebene')).toBe('international')
  expect(url.hash).toBe(hash ? `#${hash}` : '')
}

test.describe('IA-6 Stufe 2 · Deep-Link-Regression: alle 5 Alt-Anker', () => {
  for (const anker of ANKER) {
    test(`/international#${anker} landet auf der Säule mit der Sektion im Viewport`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.goto(`/international#${anker}`)
      await erwarteSaeule(page, anker)
      const sektion = page.locator(`section#${anker}`)
      await expect(sektion).toBeVisible()
      await expect(sektion.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(sektion).toBeInViewport()
      expect(fehler).toEqual([])
    })
  }
})

test.describe('IA-6 Stufe 2 · Alt-Bookmarks ohne Hash & History', () => {
  test('/international ohne Hash landet auf der nackten Säule (International-Inhalt)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/international')
    await erwarteSaeule(page, '')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Die Säule zeigt wirklich die International-Rubriken (nicht Bund/Kantone).
    await expect(page.locator('section#menschenrechte')).toBeVisible()
    expect(fehler).toEqual([])
  })

  test('unbekannter Alt-Anker landet auf der Säule statt auf einem toten Anker', async ({ page }) => {
    await page.goto('/international#gibt-es-nicht')
    await erwarteSaeule(page, '')
  })

  test('replace: «Zurück» führt zur Herkunftsseite, nicht in den Alias zurück', async ({ page }) => {
    await page.goto('/')
    await page.goto('/international#rechtshilfe')
    await erwarteSaeule(page, 'rechtshilfe')
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    expect(new URL(page.url()).pathname).toBe('/')
  })
})

test.describe('IA-6 Stufe 2 · Interne Nav zeigt direkt auf die Säule (R-SCOPE-4)', () => {
  test('Gruppen-Kopf und alle 5 Anker-Kinder verlinken die Säule; der Klick scrollt zur Sektion', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/')
    // §6.3-DEKLARATION 6.9.2026 (W2·24 · D25): die persistente Seitenleiste
    // startet seit «seitenleiste soll als default zuerst eingeklappt sein»
    // eingeklappt — die Hauptnavigation ist damit nicht mehr ohne Zutun im DOM.
    // Der Wächter macht sie darum erst auf (Vorbedingung, eine Stelle:
    // `helpers/seitenleiste`); GEPRÜFT wird unverändert dasselbe — dass die
    // interne Navigation auf die SÄULE zeigt und nicht auf den Alias.
    await seitenleisteOeffnen(page)
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' })
    // D37 (deklariert, §6.3): der Abschnitt «Gesetze» startet jetzt selbst zu
    // (nur der Abschnitt der aktiven Route startet offen, auf «/» keiner) —
    // Vorbedingung herstellen, damit «International» überhaupt im DOM steht.
    await nav.getByRole('button', { name: 'Gesetze aufklappen' }).click()
    const kopf = nav.getByRole('link', { name: 'International', exact: true })
    await expect(kopf).toHaveAttribute('href', '/gesetze?ebene=international')
    await nav.getByRole('button', { name: 'International aufklappen' }).click()
    for (const [label, anker] of [
      ['Menschenrechte', 'menschenrechte'],
      ['Int. Privat- & Zivilrecht', 'privat-zivil'],
      ['Rechtshilfe (Haager)', 'rechtshilfe'],
      ['Schweiz–EU', 'schweiz-eu'],
      ['EU-Verordnungen (DSGVO u. a.)', 'eu-verordnungen'],
    ] as const) {
      await expect(nav.getByRole('link', { name: label }))
        .toHaveAttribute('href', `/gesetze?ebene=international#${anker}`)
    }
    await nav.getByRole('link', { name: 'Schweiz–EU' }).click()
    await erwarteSaeule(page, 'schweiz-eu')
    await expect(page.locator('section#schweiz-eu')).toBeInViewport()
    expect(fehler).toEqual([])
  })
})

test.describe('IA-6 Stufe 2 · Gegenproben', () => {
  test('/gesetze bleibt Self-Canonical (die Säule ist eine Sicht dieser Seite)', async ({ page }) => {
    await page.goto('/gesetze')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}/gesetze`)
  })

  test('/suche ist unangetastet — kein Redirect (§11.7, S5-Errungenschaft)', async ({ page }) => {
    await page.goto('/suche?q=OR')
    expect(new URL(page.url()).pathname).toBe('/suche')
  })
})
