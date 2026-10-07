// @shard-gruppe: 3
// Browser-Smoke der /suche-Ergebnisseite (UI-NAV S5). Kontrakt: die im
// Header-Dropdown gekappten Volltext-Treffer werden hier ungekappt zugänglich
// (so weit der Server sie je Abfrage ausgibt); der Deep-Link ?q= ist stabil/
// teilbar; die Inhaltstyp-Facette filtert; das Dropdown verlinkt «alle N →»
// hierher. Läuft gegen `vite preview`.
//
// A1-FUNDAMENT (7.10.2026, Entscheid David «Ja, nur über Server»): die Wortsuche
// im Gesetzestext ist die Server-Gruppe «Volltext-Suche (online)» — der Browser
// lädt keinen Artikel-Volltextindex mehr. `vite preview` kennt `/api/suche` nicht;
// die Antwort stellt `helpers/mockApiSuche.ts` nach (Form der echten Funktion).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { warteAufSuchindex } from './helpers/warteAufSuchindex'
import { mockApiSuche, FIXTURE_GESAMT } from './helpers/mockApiSuche'

const VOLLTEXT = 'Volltext-Suche (online)'
const sucheFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })

test.describe('/suche — Volltext-Ergebnisseite (S5)', () => {
  test('Deep-Link ?q=Miete: H1 «Suche», Volltext-Gruppe des Servers ungekappt (mehr als das Dropdown)', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await mockApiSuche(page)
    await page.goto('/suche?q=Miete')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Suche')
    // §17-Wurzelfix (Fixer 1h): auf den Zustand der Suche warten statt auf die
    // Playwright-Standarduhr (`e2e/helpers/warteAufSuchindex.ts`) — jetzt heisst
    // das: die Serverantwort ist da.
    await warteAufSuchindex(page)
    const volltext = page.getByRole('group', { name: VOLLTEXT })
    await expect(volltext).toBeVisible()
    // … ungekappt: deutlich mehr als die 6 des Dropdowns (S5-Kernnutzen §8) — so viele,
    // wie der Server je Abfrage ausgibt (50).
    const zeilen = volltext.getByRole('listitem')
    await expect.poll(async () => zeilen.count()).toBe(50)
    // Der definitorische Artikel OR 253 ist unter den Treffern (Rang kommt vom Server).
    await expect(volltext.getByRole('link', { name: /Art\. 253 OR/ }).first()).toBeVisible()
    // §8: kennt der Server mehr als er ausgibt, sagt die Gruppe das.
    await expect(volltext).toContainText(`die ersten 50 von ${FIXTURE_GESAMT} Treffern`)
    // Eine Gruppe «Gesetzestext» aus einem Browser-Index gibt es nicht mehr.
    await expect(page.getByRole('group', { name: 'Gesetzestext', exact: true })).toHaveCount(0)
    expect(fehler).toEqual([])
  })

  test('Inhaltstyp-Facette filtert auf eine Gruppe', async ({ page }) => {
    await mockApiSuche(page)
    await page.goto('/suche?q=Miete')
    // Die Facette erscheint erst, wenn genug Gruppen geladen sind (§17-Wurzelfix).
    await warteAufSuchindex(page)
    const facette = page.getByRole('group', { name: /Nach Inhaltstyp filtern/ })
    await expect(facette).toBeVisible()
    // Auf die Volltext-Gruppe filtern → nur diese Gruppe bleibt sichtbar.
    // Kanon-Chips (D-1, 31.8.2026): der zugängliche Name folgt der
    // EntscheidFilter-Grammatik «<Gruppe>: <Wert> (<n>)».
    await facette.getByRole('button', { name: /^Inhaltstyp: Volltext-Suche \(online\)/ }).click()
    await expect(page.getByRole('group', { name: VOLLTEXT, exact: true })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Gesetze', exact: true })).toHaveCount(0)
  })

  test('?q= ist stabil: Tippen spiegelt in die URL, Reload stellt die Query wieder her', async ({ page }) => {
    await mockApiSuche(page)
    await page.goto('/suche')
    const feld = page.getByRole('searchbox', { name: /LexMetrik durchsuchen/ })
    await feld.fill('Verjährung')
    await expect(page).toHaveURL(/\/suche\?q=Verj/)
    await page.reload()
    await expect(page.getByRole('searchbox', { name: /LexMetrik durchsuchen/ })).toHaveValue('Verjährung')
  })

  test('Norm-Query auf /suche zeigt den Norm-Sprung', async ({ page }) => {
    await mockApiSuche(page)
    await page.goto('/suche?q=OR%20257d')
    await expect(page.getByText('Norm-Sprung', { exact: true })).toBeVisible()
  })

  test('Header-Dropdown verlinkt «alle N →» auf /suche (Volltext-Gruppe)', async ({ page }) => {
    await mockApiSuche(page)
    await page.goto('/gesetze')
    const feld = sucheFeld(page)
    await feld.click()
    await feld.fill('Miete')
    const box = page.getByRole('listbox', { name: 'Suchtreffer' })
    await expect(box).toBeVisible()
    // §17-Wurzelfix: die «alle N Treffer anzeigen»-Option unten in der Volltext-Gruppe
    // existiert erst, wenn der Server geantwortet hat.
    await warteAufSuchindex(page)
    // Die Volltext-Gruppe führt nach /suche — seit dem a11y-Fix 19.7.2026
    // nicht mehr als <a> im Gruppenkopf (axe-critical aria-required-children in
    // role=listbox), sondern als echte role=option «alle N Treffer anzeigen»
    // am Gruppenende (SuchResultate.tsx, MEHR_TREFFER_ID).
    const mehrOption = box.getByRole('group', { name: VOLLTEXT })
      .getByRole('option', { name: /alle \d+ Treffer anzeigen/ })
    await expect(mehrOption.first()).toBeVisible()
    await mehrOption.first().click()
    await expect(page).toHaveURL(/\/suche\?q=Miete/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Suche')
  })

  // ── A1-FUNDAMENT: was die Suche NICHT mehr tut, und wie sie es sagt ─────────
  test('Server nicht erreichbar (503): Hinweis «Volltextsuche derzeit nicht verfügbar», Gesetze/Werkzeuge bleiben (§8)', async ({ page }) => {
    await mockApiSuche(page, { modus: 'ausfall' })
    await page.goto('/suche?q=Miete')
    await warteAufSuchindex(page)
    const volltext = page.getByRole('group', { name: VOLLTEXT })
    await expect(volltext).toBeVisible()
    await expect(volltext).toContainText('Volltextsuche derzeit nicht verfügbar')
    // Kein Zähler «0», keine Treffer — ein Zähler behauptete «durchsucht, nichts gefunden».
    await expect(volltext.getByRole('listitem')).toHaveCount(0)
    // Die lokalen Gruppen sind davon unberührt.
    await expect(page.getByRole('group', { name: 'Gesetze', exact: true })).toBeVisible()
    // Auch die Ansage für Screenreader trägt den Ausfall.
    await expect(page.getByRole('status').first()).toContainText('Volltextsuche derzeit nicht verfügbar')
  })

  test('Server antwortet, findet aber nichts: «Keine Treffer» (kein Ausfall-Hinweis)', async ({ page }) => {
    await mockApiSuche(page, { modus: 'leer' })
    await page.goto('/suche?q=xqzvbnmplk')
    await warteAufSuchindex(page)
    await expect(page.getByRole('status').first()).toContainText('Keine Treffer')
    await expect(page.getByText('Volltextsuche derzeit nicht verfügbar')).toHaveCount(0)
  })

  test('Suchindex-Stand des Servers steht im Hinweis der Volltext-Gruppe', async ({ page }) => {
    await mockApiSuche(page)
    await page.goto('/suche?q=Miete')
    await warteAufSuchindex(page)
    await expect(page.getByRole('group', { name: VOLLTEXT })).toContainText('Suchindex Stand 05.10.2026')
  })

  test('Entscheide stehen nicht mehr in der Suche — Verweis führt mit dem Suchbegriff in die Rechtsprechung', async ({ page }) => {
    await mockApiSuche(page)
    await page.goto('/suche?q=Miete')
    await warteAufSuchindex(page)
    await expect(page.getByRole('group', { name: 'Rechtsprechung', exact: true })).toHaveCount(0)
    const verweis = page.getByRole('link', { name: /«Miete» in der Rechtsprechung suchen/ })
    await expect(verweis).toBeVisible()
    await verweis.click()
    await expect(page).toHaveURL(/\/rechtsprechung\?q=Miete/)
  })

  test('Netz: nur die Server-Suche (typ=artikel) — kein Suchindex, kein Entscheid-Register für eine gewöhnliche Suche', async ({ page }) => {
    const aufrufe = await mockApiSuche(page)
    const geholt: string[] = []
    page.on('request', (r) => geholt.push(new URL(r.url()).pathname))
    await page.goto('/suche?q=Miete')
    await warteAufSuchindex(page)
    expect(aufrufe.length).toBeGreaterThan(0)
    for (const a of aufrufe) expect(a).toMatch(/typ=artikel/)
    expect(geholt.filter((p) => p.startsWith('/such-index/'))).toEqual([])
    expect(geholt).not.toContain('/rechtsprechung/register.json')
  })
})
