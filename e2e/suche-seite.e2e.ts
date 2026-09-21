// @shard-gruppe: 5
// Browser-Smoke der /suche-Ergebnisseite (UI-NAV S5). Kontrakt: die im
// Header-Dropdown gekappten Gesetzestext-Treffer werden hier ungekappt
// zugänglich; der Deep-Link ?q= ist stabil/teilbar; die Inhaltstyp-Facette
// filtert; das Dropdown verlinkt «alle N →» hierher. Läuft gegen `vite preview`.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { warteAufSuchindex } from './helpers/warteAufSuchindex'

const sucheFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })

test.describe('/suche — Volltext-Ergebnisseite (S5)', () => {
  test('Deep-Link ?q=Miete: H1 «Suche», Gesetzestext-Gruppe ungekappt (mehr als das Dropdown)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/suche?q=Miete')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Suche')
    // §17-Wurzelfix (Fixer 1h): auf den lazy Such-Index warten statt auf die
    // Playwright-Standarduhr — vorher flakte `zeilen.count()` unten auf einer
    // kalten/gedrosselten Maschine (`e2e/helpers/warteAufSuchindex.ts`).
    await warteAufSuchindex(page)
    // Die Gesetzestext-Gruppe erscheint und zeigt mietrechtliche OR-Artikel …
    const gesetzestext = page.getByRole('group', { name: 'Gesetzestext' })
    await expect(gesetzestext).toBeVisible()
    // … ungekappt: deutlich mehr als die 6 des Dropdowns (S5-Kernnutzen §8).
    const zeilen = gesetzestext.getByRole('listitem')
    await expect.poll(async () => zeilen.count()).toBeGreaterThan(6)
    // Der definitorische Artikel OR 253 ist unter den Treffern (S4-Ranking).
    await expect(gesetzestext.getByRole('link', { name: /Art\. 253 OR/ }).first()).toBeVisible()
    expect(fehler).toEqual([])
  })

  test('Inhaltstyp-Facette filtert auf eine Gruppe', async ({ page }) => {
    await page.goto('/suche?q=Miete')
    // Die Facette erscheint erst, wenn genug Gruppen geladen sind (§17-Wurzelfix).
    await warteAufSuchindex(page)
    const facette = page.getByRole('group', { name: /Nach Inhaltstyp filtern/ })
    await expect(facette).toBeVisible()
    // Auf «Gesetzestext» filtern → nur diese Gruppe bleibt sichtbar (exact, sonst
    // matcht der Teilstring «Gesetze» auch die «Gesetzestext»-Gruppe).
    // Kanon-Chips (D-1, 31.8.2026): der zugängliche Name folgt der
    // EntscheidFilter-Grammatik «<Gruppe>: <Wert> (<n>)».
    await facette.getByRole('button', { name: /^Inhaltstyp: Gesetzestext/ }).click()
    await expect(page.getByRole('group', { name: 'Gesetzestext', exact: true })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Gesetze', exact: true })).toHaveCount(0)
  })

  test('?q= ist stabil: Tippen spiegelt in die URL, Reload stellt die Query wieder her', async ({ page }) => {
    await page.goto('/suche')
    const feld = page.getByRole('searchbox', { name: /LexMetrik durchsuchen/ })
    await feld.fill('Verjährung')
    await expect(page).toHaveURL(/\/suche\?q=Verj/)
    await page.reload()
    await expect(page.getByRole('searchbox', { name: /LexMetrik durchsuchen/ })).toHaveValue('Verjährung')
  })

  test('Norm-Query auf /suche zeigt den Norm-Sprung', async ({ page }) => {
    await page.goto('/suche?q=OR%20257d')
    await expect(page.getByText('Norm-Sprung', { exact: true })).toBeVisible()
  })

  test('Header-Dropdown verlinkt «alle N →» auf /suche (Gesetzestext-Gruppe)', async ({ page }) => {
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('Miete')
    const box = page.getByRole('listbox', { name: 'Suchtreffer' })
    await expect(box).toBeVisible()
    // §17-Wurzelfix: die «alle N Treffer anzeigen»-Option unten in der
    // Gesetzestext-Gruppe existiert erst, wenn der lazy Index geladen ist.
    await warteAufSuchindex(page)
    // Die Gesetzestext-Gruppe führt nach /suche — seit dem a11y-Fix 19.7.2026
    // nicht mehr als <a> im Gruppenkopf (axe-critical aria-required-children in
    // role=listbox), sondern als echte role=option «alle N Treffer anzeigen»
    // am Gruppenende (SuchResultate.tsx, MEHR_TREFFER_ID).
    const mehrOption = box.getByRole('group', { name: 'Gesetzestext' })
      .getByRole('option', { name: /alle \d+ Treffer anzeigen/ })
    await expect(mehrOption.first()).toBeVisible()
    await mehrOption.first().click()
    await expect(page).toHaveURL(/\/suche\?q=Miete/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Suche')
  })
})
