// @shard-gruppe: 3
// W2·17-UI-BEFUNDE · PE-H1-D01/D02 + Erlass-Blatt — Tab in modalen Leser-Flächen.
//
// ── DER BEFUND (Inventar-Lauf 1.10.2026, gemessen am gebauten Stand) ─────────
//  · Gliederungs-Sheet (<1024 px, `[data-gliederung-sheet]`) mit zugeklappter
//    Übersichts-Box (Standardzustand): ab dem Suchfeld blieb der Fokus bei
//    JEDEM Tab 5× im Suchfeld hängen; der Baum war per Tab nie erreichbar.
//  · Erlass-Blatt des Rechtsprechungs-Panels (375/768 px, `role=dialog`,
//    `data-v3-panel-modal="ja"`): Tab blieb auf «Erlass-Blatt schliessen»
//    stehen (OR Art. 41, BGG Art. 42), Shift+Tab ging.
//  · `<summary>` der Box war per Tab nicht erreichbar (fehlte im Selektor).
// URSACHE (beide Flächen, EINE Stelle): `useDialogFokus` zählte die drei Links
// der zugeklappten `<details>` als Fokusziele — in Chromium bleibt ihr
// `offsetParent` ungleich null, `focus()` wirkt aber nicht (Inhalt ist
// `content-visibility`-versteckt). Tab ruft `focus()` auf ein totes Ziel, der
// Fokus bleibt, wo er ist.
//
// ── WAS DIESE SPEC BEWACHT ──────────────────────────────────────────────────
// Die ECHTE Tab-Taste, nicht den Selektor: der Fokus (a) bewegt sich bei jedem
// Tab, (b) bleibt in der Fläche (Falle), (c) landet nie auf einem Element in
// einer zugeklappten `<details>` ausser deren `<summary>`, (d) erreicht die
// `<summary>`, (e) läuft bei aufgeklappter Box durch deren Links weiter.
// Die Auswahlregel selbst steht unit-seitig in `src/tests/dialog-fokus-ziele`.
// Läuft gegen `vite preview` (dist).
import { test, expect, type Locator, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

type Schritt = { tag: string; name: string; innen: boolean; totesZiel: boolean }

/** Beschreibt das aktuell fokussierte Element relativ zur Fläche `selektor`. */
async function aktiv(page: Page, selektor: string): Promise<Schritt> {
  return page.evaluate((sel) => {
    const el = document.activeElement as HTMLElement | null
    const flaeche = document.querySelector(sel)
    if (el == null) return { tag: 'NONE', name: '', innen: false, totesZiel: false }
    const zu = el.closest('details:not([open])')
    return {
      tag: el.tagName,
      name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40),
      innen: flaeche != null && flaeche.contains(el),
      // Fokus in einer zugeklappten Klappe, aber nicht auf deren eigenem <summary>.
      totesZiel: zu != null && !(el.tagName === 'SUMMARY' && el.parentElement === zu),
    }
  }, selektor)
}

async function tabLauf(page: Page, selektor: string, schritte: number, rueckwaerts = false): Promise<Schritt[]> {
  const lauf: Schritt[] = [await aktiv(page, selektor)]
  for (let i = 0; i < schritte; i++) {
    await page.keyboard.press(rueckwaerts ? 'Shift+Tab' : 'Tab')
    lauf.push(await aktiv(page, selektor))
  }
  return lauf
}

/** Das Gemeinsame beider Flächen: jeder Tab bewegt, bleibt drin, trifft nichts Totes. */
function pruefeLauf(lauf: Schritt[], was: string) {
  const text = JSON.stringify(lauf.map((s) => `${s.tag}:${s.name}`))
  lauf.forEach((s, i) => {
    expect(s.innen, `${was}: Schritt ${i} liegt ausserhalb der Fläche — ${text}`).toBe(true)
    expect(s.totesZiel, `${was}: Schritt ${i} (${s.tag} «${s.name}») liegt in zugeklappter Klappe — ${text}`).toBe(false)
    if (i > 0) {
      const gleich = s.tag === lauf[i - 1].tag && s.name === lauf[i - 1].name
      expect(gleich, `${was}: Tab hängt bei Schritt ${i} auf ${s.tag} «${s.name}» — ${text}`).toBe(false)
    }
  })
}

async function summaryAktiv(page: Page, selektor: string): Promise<boolean> {
  return (await aktiv(page, selektor)).tag === 'SUMMARY'
}

/** Tab, bis die <summary> den Fokus hat (höchstens `max` Schritte). */
async function tabBisSummary(page: Page, selektor: string, max = 12): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await summaryAktiv(page, selektor)) return
    await page.keyboard.press('Tab')
  }
  expect(await summaryAktiv(page, selektor), `<summary> in ${max} Tab-Schritten nicht erreicht`).toBe(true)
}

const sheet = (page: Page) => page.locator('[data-gliederung-sheet]')
const blatt = (page: Page) => page.locator('[data-v3-panel-modal="ja"]')
const klappe = (flaeche: Locator) => flaeche.locator('details').first()

for (const breite of [375, 768]) {
  test.describe(`Dialog-Fokus @${breite}`, () => {
    test.use({ viewport: { width: breite, height: 900 } })

    test(`Gliederungs-Sheet: Tab läuft durch (Box zu), <summary> erreichbar, Box auf → Links, Shift+Tab symmetrisch`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.goto('/gesetze/bund/STPO')
      await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 30_000 })
      await page.getByRole('button', { name: /Gliederung/ }).first().click()
      await expect(sheet(page)).toBeVisible({ timeout: 20_000 })
      const box = klappe(sheet(page))
      await expect(box, 'Übersichts-Box ist im Standardzustand zu').not.toHaveAttribute('open', '')

      // (a)–(c): zwei volle Runden durch ein Sheet mit ~9 Zielen ohne Hänger.
      pruefeLauf(await tabLauf(page, '[data-gliederung-sheet]', 24), 'Sheet Tab')
      pruefeLauf(await tabLauf(page, '[data-gliederung-sheet]', 24, true), 'Sheet Shift+Tab')

      // (d): die Klappe selbst ist per Tab erreichbar …
      await tabBisSummary(page, '[data-gliederung-sheet]')
      // … Enter klappt auf, und Tab läuft in die Links (e) statt zurück zum Anfang.
      await page.keyboard.press('Enter')
      await expect(box).toHaveAttribute('open', '')
      await page.keyboard.press('Tab')
      const nachSummary = await aktiv(page, '[data-gliederung-sheet]')
      expect(nachSummary.tag, `nach <summary> (offen) folgt ein Link, nicht ${nachSummary.tag} «${nachSummary.name}»`).toBe('A')
      pruefeLauf(await tabLauf(page, '[data-gliederung-sheet]', 24), 'Sheet Tab (Box offen)')

      expect(fehler, fehler.join('\n')).toEqual([])
    })

    test(`Erlass-Blatt (Rechtsprechung): Tab hängt nicht auf «schliessen», <summary> erreichbar`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.goto('/gesetze/bund/OR#art-41')
      await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 30_000 })
      await panelAufziehen(page)
      await expect(blatt(page)).toBeVisible({ timeout: 20_000 })
      const box = klappe(blatt(page))
      await expect(box, 'Übersichts-Box im Blatt ist im Standardzustand zu').not.toHaveAttribute('open', '')

      pruefeLauf(await tabLauf(page, '[data-v3-panel-modal="ja"]', 20), 'Blatt Tab')
      pruefeLauf(await tabLauf(page, '[data-v3-panel-modal="ja"]', 20, true), 'Blatt Shift+Tab')

      await tabBisSummary(page, '[data-v3-panel-modal="ja"]', 40)
      await page.keyboard.press('Enter')
      await expect(box).toHaveAttribute('open', '')
      await page.keyboard.press('Tab')
      expect((await aktiv(page, '[data-v3-panel-modal="ja"]')).tag).toBe('A')

      expect(fehler, fehler.join('\n')).toEqual([])
    })
  })
}
