// @shard-gruppe: nacht
// ═══ D2/D3 (W2·24-Gesamtprüfung 7.9.2026) · Esc in der Kopf-Suche ══════════
//
// GEMESSEN am Stand `018b41a37`: Escape leerte das Feld (nativer
// Escape-Löscher von `<input type="search">`), nahm dabei aber den FOKUS
// (`feld.current?.blur()`) — Weitertippen ging ins Leere (D2). Zusätzlich
// blieb `aria-expanded="true"` bei 0 sichtbaren Optionen stehen, weil das
// native Löschen ein eigenes 'input'-Event feuerte, dessen `onChange` im
// SELBEN Tastendruck erneut `setOffen(true)` setzte (D3).
//
// FIX (`src/components/layout/HeaderSuche.tsx`, nur die Esc-Stelle):
// `preventDefault()` unterdrückt die native Löschung, `auswahl()` leert
// Feld/Query/Panel deterministisch über React-State, kein `blur()` mehr —
// Vorbild die Erlass-Suche im Leser (`SuchSprungFeld.tsx`, L5).
import { test, expect } from '@playwright/test'

const feld = (page: import('@playwright/test').Page) =>
  page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })

test('D2/D3 · Esc leert das Feld, hält den Fokus und schliesst das Panel', async ({ page }) => {
  await page.goto('/')
  const f = feld(page)
  await f.click()
  await f.fill('OR 257')
  await expect(page.locator('header [role="search"] [role="option"]').first())
    .toBeVisible({ timeout: 30_000 })

  await page.keyboard.press('Escape')

  await expect(f, 'D1-Rot-Beweis-Analogon: aria-expanded blieb vorher true').toHaveAttribute('aria-expanded', 'false')
  await expect(f).toHaveValue('')
  await expect(f, 'D2: der Fokus verliess vorher das Feld (blur())').toBeFocused()

  // D2-Rot-Beweis (§6.7): weil `blur()` den Fokus vorher nahm, ging Weitertippen
  // ins Leere — hier landet es im Feld, ohne erneuten Klick.
  await page.keyboard.type('ZGB')
  await expect(f).toHaveValue('ZGB')
})

// ═══ Nachzug Zweitprüfung #1188 (30.9.2026) · Esc mit Fokus im Leer-Panel ═══
//
// GEMESSEN am Stand `8474b5c9`: seit P3 trägt das Leer-Panel den fokussierbaren
// Knopf «Verlauf leeren» (`layout/VerlaufLeerenKnopf`). Tab vom Suchfeld auf den
// Knopf, dann Esc ⇒ das Panel schloss, der Knopf verschwand, der Fokus fiel auf
// <body> (derselbe Verlust wie D2, nur über den neuen Knopf). FIX: liegt der
// Fokus beim Esc in der Panel-Hülle, geht er ins Suchfeld zurück.
test('Esc mit Fokus auf «Verlauf leeren» schliesst das Panel und gibt den Fokus ans Feld', async ({ page }) => {
  await page.goto('/rechner/tagerechner')
  await expect(page.locator('h1').first()).toBeVisible()
  await page.goto('/rechner/verjaehrung')
  await expect(page.locator('h1').first()).toBeVisible()

  const f = feld(page)
  const suchBereich = page.getByRole('search').filter({ has: f })
  await f.click()
  const leeren = suchBereich.getByRole('button', { name: 'Verlauf leeren' })
  await expect(leeren).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(leeren, 'Tab vom Feld landet auf «Verlauf leeren»').toBeFocused()

  await page.keyboard.press('Escape')

  await expect(f).toHaveAttribute('aria-expanded', 'false')
  await expect(leeren).toHaveCount(0)
  await expect(f, 'Fokus darf nicht auf <body> fallen').toBeFocused()
})
