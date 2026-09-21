// @shard-gruppe: 8
// ─── §7b-Deckungslücke geschlossen (21.8.2026, Kontaktbogen H4 §7b Pos. 5) ───
//
// V3-Mirror von `split-view-a34.e2e.ts` (A34/Bug1, A34/Bug2) — derselbe
// Sachverhalt, ANDERER Einstieg: der ⧉ «nebeneinander öffnen» sitzt in V3 nicht
// mehr an der Bezüge-Zeile unter dem Artikel (Pos. 12 hat sie aufgegeben),
// sondern am Panel-Chip (`KanteMitVorschau`, §7b Pos. 3, seit PR #558). Der
// alte Fall blieb bis H5 (PR #560, 21.8.2026) auf `leser-v1` gepinnt
// (Kontaktbogen H4 §7); diese Datei liefert das V3-Gegenstück, das dort als
// offene Lücke vermerkt war.
//
//  Bug 1: Öffnet man aus dem Gesetz einen verlinkten BGE im Split-View, darf
//         das Gesetz-Pane NICHT auf einen früher angeklickten Artikel
//         zurückspringen (Scroll-Verlust).
//  Bug 2: Im Split-View bleibt «Ansicht» erreichbar UND wirksam — V3 löst das
//         strukturell (der Öffner sitzt im STICKY `[data-v3-kopf]`, der mit
//         KEINEM Scroll wegwandert), aber das ist eine Behauptung, die ein
//         Test einlösen muss, keine, die aus dem Bauplan folgt.
//
// Läuft gegen `vite preview` (dist). Reine UI-Einheit (golden-neutral).
import { test, expect, type Page } from '@playwright/test'
import { WAHL_ROLLE } from './helpers/leserBeschriftung'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { panelAufziehen } from './helpers/panelOeffnen'

// Split-View aus dem V3-Panel heraus öffnen: ⧉ am ersten Panel-Eintrag.
async function oeffnePanelEintragDaneben(page: Page): Promise<void> {
  await panelAufziehen(page)
  const eintrag = page.locator('[data-v3-panel] [data-v3-panel-entscheid]').first()
  await expect(eintrag).toBeVisible({ timeout: 20_000 })
  await eintrag.getByRole('button', { name: /nebeneinander öffnen/ }).click()
  await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 10_000 })
}

// ── Bug 1: kein Rücksprung auf den früher angeklickten Artikel ────────────────
test('V3/A34/Bug1 (≥lg): Split-View öffnen erhält die Leseposition, springt NICHT auf den früheren Artikel', async ({ page }) => {
  test.slow() // schwere Split-View-Interaktion (Panes + idle-Shards + Scroll) — 3× Budget gegen CI-CPU-Starvation
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  // Früher Artikel als aktiver `#art-`-Hash (Deep-Link springt dorthin) …
  await page.goto('/gesetze/bund/ZGB#art-1')
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached()
  // … dann weit nach unten zu Art. 684 lesen (Hash bleibt #art-1).
  //
  // ── SETUP-NACHZUG W2·24-D35-F1 (7.9.2026, §6.3 deklariert) ────────────────
  // Der Einstieg unten braucht den Panel-Eintrag des AKTIVEN Artikels, und
  // «aktiv» ist der Artikel AN der Bezugslinie (`ankerLandepunkt`, gemessen
  // 154 px unter der Container-Oberkante — `inhalt-hooks.tsx`, Zwischenraum-
  // Regel: Artikel, die oberhalb der Linie bereits geendet haben, fallen aus
  // dem Kandidatensatz). `scrollIntoViewIfNeeded` scrollt MINIMAL: es sagt nur
  // zu, dass Art. 684 SICHTBAR ist — WELCHER Artikel dann an der Linie steht,
  // hängt an der Höhe des VORGÄNGERS. Genau das war bisher Zufall, nicht Zusage.
  //   GEMESSEN 7.9.2026 (ZGB @1440, Preview aus eigenem `dist/`):
  //   · main 8d398874e — Art. 683 = y −24…108, endet ÜBER der Linie, fällt aus
  //     dem Satz; Art. 684 (y 205) wird aktiv. Der Test lief grün.
  //   · mit der Funktionszeile am Artikelende (D35-F1, +43 px je Artikel) —
  //     Art. 683 = y 24…199, steht damit AN der Linie und ist aktiv. Sein Panel
  //     ist leer («Zu Art. 683 ist kein Entscheid … erfasst»), der Einstieg fand
  //     keinen Chip: «element(s) not found» (CI 34134684969, Shard 8).
  // Der Fall prüft den SPLIT-EINSTIEG und die Leseposition, nicht die
  // Höhenzufälligkeit des Vorgänger-Artikels. Er stellt Art. 684 darum
  // ausdrücklich an die Linie: `block: 'start'` landet über die
  // `.nt-anker`-`scroll-margin-top` (= derselbe `ankerLandepunkt`) genau dort.
  // KEINE Assertion und keine Zusage berührt (§6.3) — nur die Vorbedingung, die
  // der Fall immer schon MEINTE, steht jetzt da, statt sich zu ergeben.
  const ziel = page.locator('#art-684')
  await ziel.evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await page.waitForTimeout(400)
  const scrollVor = await page.evaluate(() => window.scrollY)
  expect(scrollVor).toBeGreaterThan(5000) // wirklich tief im Erlass
  // BGE daneben öffnen, über den ⧉ am Panel-Chip (V3-Einstieg) → Gesetz wird
  // Primär-Pane. Art. 684 trägt Bezüge (verzahnung.e2e.ts «Fundstelle A»).
  await oeffnePanelEintragDaneben(page)
  await page.waitForTimeout(1200)
  const info = await page.evaluate(() => {
    const p = document.querySelector('[data-pane="primaer"]') as HTMLElement | null
    const el1 = p?.querySelector('#art-1') as HTMLElement | null
    const pr = p?.getBoundingClientRect()
    return {
      scrollTop: p?.scrollTop ?? -1,
      top1: el1 && pr ? Math.round(el1.getBoundingClientRect().top - pr.top) : null,
    }
  })
  // (a) Der übergebene Scroll (Fenster → Pane-Container) bleibt erhalten.
  expect(Math.abs(info.scrollTop - scrollVor)).toBeLessThan(400)
  // (b) Art. 1 steht NICHT an der oberen Lese-Bezugslinie (kein Rücksprung).
  expect(info.top1 === null || info.top1 < -1000).toBeTruthy()
  expect(fehler).toEqual([])
})

// ── Bug 2: «Ansicht»-Menü im Split-View dauerhaft erreichbar ──────────────────
test('V3/A34/Bug2 (≥lg): «Ansicht»-Menü im Split-View bleibt beim Scrollen sichtbar und schaltet', async ({ page }) => {
  test.slow() // schwere Split-View-Interaktion (Panes + Menü-Toggle) — 3× Budget gegen CI-CPU-Starvation
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze/bund/ZGB#art-684')
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await oeffnePanelEintragDaneben(page)
  // Das Panel-Blatt ist im Pane MODAL (LeserPanelZone) und bliebe sonst mit
  // seinem Scrim über der Fläche stehen — Esc schliesst es, wie jedes Blatt.
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
  const primaer = page.locator('[data-pane="primaer"]')
  // Gesetz-Pane mitten in den Text scrollen (Lesen).
  await page.evaluate(() => { const p = document.querySelector('[data-pane="primaer"]') as HTMLElement; p.scrollTop = 4000 })
  await page.waitForTimeout(400)
  // V3: der Öffner sitzt im STICKY Kopf des Panes, nicht in einem separaten
  // Menü — er bleibt darum strukturell im sichtbaren Ausschnitt.
  const ansicht = primaer.locator('[data-v3-ansicht]').first()
  await expect(ansicht).toBeVisible()
  const imBlick = await ansicht.evaluate((el) => {
    const p = el.closest('[data-pane="primaer"]') as HTMLElement
    const pr = p.getBoundingClientRect(); const r = el.getBoundingClientRect()
    return r.top >= pr.top - 2 && r.bottom <= pr.bottom + 2
  })
  expect(imBlick).toBe(true)
  // Es schaltet auch wirklich: Menü öffnen und die Stellung «Fussnoten» wählen —
  // Beweis über den globalen Options-State (<html data-vermerke>, leserOptionen.ts).
  // D35-F3 (§6.3): das Attribut heisst neu, der geprüfte Sachverhalt («der
  // Öffner im Pane bedient wirklich den geteilten Store») ist unverändert.
  await ansicht.click()
  await expect(primaer.locator('[data-v3-ansicht-panel]')).toBeVisible()
  const vorher = await page.evaluate(() => document.documentElement.getAttribute('data-vermerke') ?? 'fassung')
  const ziel = vorher === 'fussnoten' ? 'aus' : 'fussnoten'
  await primaer.getByRole(WAHL_ROLLE, { name: ziel === 'aus' ? /^aus$/ : /^Fussnoten/ }).first().click()
  await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-vermerke') ?? 'fassung'))
    .toBe(ziel)
  expect(fehler).toEqual([])
})
