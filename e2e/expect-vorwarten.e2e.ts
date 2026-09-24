// @shard-gruppe: 8
// Stolperdraht und Aussage-Gleichheit für `e2e/helpers/expectVorwarten.ts`
// (W2·29-WERKBANK-LESER, QS-Nebenfund 23.9.2026).
//
// WARUM ES DIESE SPEC GIBT (§6.7): Das Vorwarten hängt an zwei Playwright-
// Interna — `expect.extend()` schreibt in die GLOBALE expect-Instanz, und die
// Worker laden `playwright.config.ts` vor den Specs. Fällt eines bei einem
// Upgrade weg, liefe die Suite wieder mit Aria-Snapshot je Poll, ohne dass es
// jemand merkt. Test 1 wird dann ROT. Diese Datei importiert den Helfer
// ABSICHTLICH NICHT — ein Import würde die Registrierung selbst auslösen und den
// Draht blind machen; sie liest nur die globale Marke.
//
// Rot-Beweis (23.9.2026): Import in `playwright.config.ts` auskommentiert →
// Test 1 rot («Registrierung fehlt»); wieder aktiv → grün.
//
// Tests 2 und 3 halten fest, dass die Aussage gleich bleibt: dieselben Zustände
// erfüllen, dieselben scheitern — und die Meldung nennt beim Scheitern die
// Schranke der Aufrufstelle, nicht die Restfrist der Nachprüfung.
import { test, expect } from '@playwright/test'

const MARKE = Symbol.for('lexmetrik.e2e.expectVorwarten')
type Marke = { registriert: true; aufrufe: number }
const marke = (): Marke | undefined => (globalThis as unknown as Record<symbol, Marke | undefined>)[MARKE]

/** Seite, auf der `#spaet` nach 300 ms erscheint und `#weg` nach 300 ms verschwindet. */
const SEITE = `
  <p id="da">da</p>
  <p id="versteckt" style="display:none">versteckt</p>
  <p id="weg">weg</p>
  <input id="feld" value="Wert">
  <div id="ziel"></div>
  <script>
    setTimeout(() => {
      const p = document.createElement('p')
      p.id = 'spaet'
      p.setAttribute('data-zustand', 'fertig')
      p.textContent = 'Erwägung 2.3.1'
      document.getElementById('ziel').appendChild(p)
      document.getElementById('weg').remove()
      document.getElementById('feld').focus()
    }, 300)
  </script>`

test.describe('expect-Vorwarten (zentral registriert aus playwright.config.ts)', () => {
  test('ist im Worker registriert und greift bei expect(locator)', async ({ page }) => {
    expect(
      marke()?.registriert,
      'Registrierung fehlt — playwright.config.ts importiert e2e/helpers/expectVorwarten.ts nicht mehr, ' +
        'oder Playwright lädt die Config nicht mehr im Worker',
    ).toBe(true)
    await page.setContent('<p id="da">x</p>')
    const vorher = marke()!.aufrufe
    await expect(page.locator('#da')).toBeVisible()
    expect(
      marke()!.aufrufe,
      'der Matcher lief am Vorwarten vorbei — expect.extend() wirkt nicht mehr auf die globale Instanz',
    ).toBe(vorher + 1)
  })

  test('gleiche Aussage: erfüllt, was vorher erfüllte', async ({ page }) => {
    await page.setContent(SEITE)
    // Gruppe A — Zustand, auch negiert und über die Optionen-Form.
    await expect(page.locator('#spaet')).toBeVisible()
    await expect(page.locator('#da')).not.toBeHidden()
    await expect(page.locator('#versteckt')).toBeHidden()
    await expect(page.locator('#versteckt')).not.toBeVisible()
    await expect(page.locator('#versteckt')).toBeVisible({ visible: false })
    await expect(page.locator('#versteckt')).toBeAttached()
    await expect(page.locator('#weg')).not.toBeAttached()
    await expect(page.locator('#weg')).toBeAttached({ attached: false })
    await expect(page.locator('#fehlt')).toBeHidden()
    // Gruppe B — erst im DOM, dann die eingebaute Prüfung.
    await expect(page.locator('#spaet')).toHaveText('Erwägung 2.3.1')
    await expect(page.locator('#spaet')).toContainText('2.3')
    await expect(page.locator('#spaet')).toHaveAttribute('data-zustand', 'fertig')
    await expect(page.locator('#spaet')).toHaveAttribute('data-zustand')
    await expect(page.locator('#spaet')).toHaveAttribute('data-zustand', { timeout: 2000 })
    await expect(page.locator('#spaet')).toBeInViewport()
    await expect(page.locator('#feld')).toBeFocused()
    await expect(page.locator('#feld')).toHaveValue('Wert')
    await expect(page.locator('p')).toHaveText(['da', 'versteckt', 'Erwägung 2.3.1'])
    // Negiert: `#da` erfüllt; ein fehlendes Element erfüllt nur bei toBeInViewport.
    await expect(page.locator('#da')).not.toHaveText('x')
    await expect(page.locator('#da')).not.toHaveAttribute('data-zustand')
    await expect(page.locator('#da')).not.toBeFocused()
    await expect(page.locator('#fehlt')).not.toBeInViewport()
  })

  test('Scheitern bleibt Scheitern — mit der Schranke der Aufrufstelle', async ({ page }) => {
    await page.setContent(SEITE)
    await expect(page.locator('#spaet')).toBeVisible()
    const faelle: Array<[string, () => Promise<void>, string]> = [
      ['toBeVisible, fehlt', () => expect(page.locator('#fehlt')).toBeVisible({ timeout: 400 }), 'Expected: visible'],
      ['not.toBeVisible, sichtbar', () => expect(page.locator('#da')).not.toBeVisible({ timeout: 400 }), 'Expected: not visible'],
      ['toBeHidden, sichtbar', () => expect(page.locator('#da')).toBeHidden({ timeout: 400 }), 'Expected: hidden'],
      ['toBeAttached, fehlt', () => expect(page.locator('#fehlt')).toBeAttached({ timeout: 400 }), 'Expected: attached'],
      ['toHaveText, fehlt', () => expect(page.locator('#fehlt')).toHaveText('x', { timeout: 400 }), 'Expected'],
      ['toHaveText, falscher Text', () => expect(page.locator('#da')).toHaveText('nein', { timeout: 400 }), 'Expected'],
      ['toBeInViewport, fehlt', () => expect(page.locator('#fehlt')).toBeInViewport({ timeout: 400 }), 'in viewport'],
      // Eingebaut scheitert ein fehlendes Element auch NEGIERT (Injected Script:
      // `matches: options.isNot, missingReceived: true`) — das bleibt so.
      ['not.toHaveText, fehlt', () => expect(page.locator('#fehlt')).not.toHaveText('x', { timeout: 400 }), 'element(s) not found'],
      ['not.toHaveAttribute, fehlt', () => expect(page.locator('#fehlt')).not.toHaveAttribute('a', { timeout: 400 }), 'element(s) not found'],
    ]
    for (const [name, aufruf, erwartet] of faelle) {
      let fehler: (Error & { matcherResult?: { ariaSnapshot?: unknown } }) | null = null
      try {
        await aufruf()
      } catch (e) {
        fehler = e as Error
      }
      expect(fehler, `${name}: hätte scheitern müssen`).not.toBeNull()
      expect(fehler!.message, `${name}: Meldung`).toContain(erwartet)
      const fristen = [...fehler!.message.matchAll(/Timeout:\s+(\d+)ms/g)].map((m) => m[1])
      expect(fristen, `${name}: Meldung nennt die Schranke der Aufrufstelle, keine Restfrist`).toEqual(['400'])
      expect(typeof fehler!.matcherResult?.ariaSnapshot, `${name}: error-context bleibt`).toBe('string')
    }
  })
})
