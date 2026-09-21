// @shard-gruppe: 6
// ─── W2·7-VZUI · Der Reiter «Anwendung»: die dritte und vierte Sache ─────────
//
// WAS HIER BEWACHT WIRD. Die V3-Hülle löste das `KontextPanel` mit drei Reitern
// ab und liess dabei zwei Bestände zurück: die Behörden-Ressourcen
// (`kontextSoftLaw`) und die «Passenden Werkzeuge». Beide gehören nach dem
// fachlichen Schnitt NICHT in «Materialien» (dort steht die Entstehung des
// Erlasses) — der Dateikopf von `PanelMaterialien.tsx` hat das seit H3 als
// offenen Punkt geführt. Sie haben jetzt einen eigenen Reiter, und diese Datei
// misst, dass er trägt statt nur zu existieren.
//
// ── DREI ERLASSE, WEIL DER REITER DREI ABSCHNITTE KENNT ────────────────────
// Die Abschnitte kommen aus VERSCHIEDENEN Quellen mit verschiedenen Beständen;
// ein Erlass allein verdeckte je zwei davon. Die Auswahl ist am Bestand
// gemessen, nicht geraten (31.8.2026, `artikelWerkzeugGruppen`/`werkzeugeFuerNorm`
// über alle Erlasse mit Kanten-Shard):
//   ARG — Kanten-Shard JA, artikelscharfe Gruppen 0, grobe Zuordnung 1
//         («Lohnfortzahlung (kantonale Skala)»). Der Vollfall aus
//         Behörden-Praxis + grober Werkzeug-Liste.
//   DBG — Kanten-Shard JA, Werkzeuge 0 (die Karten dazu sind geplant, also nach
//         §8 ausgeblendet). Der Fall, in dem der Werkzeug-Abschnitt ehrlich
//         entfällt statt eine leere Überschrift zu setzen.
//   OR  — Kanten-Shard NEIN, artikelscharfe Gruppen 15 (u. a. Art. 127–142 ⇒
//         Verjährungsrechner). Der umgekehrte Fall — und zugleich die Probe,
//         dass die grobe Liste NICHT neben der artikelscharfen steht (§5).
//
// ── §15/CLS: DER REITER LÄDT NICHT BEIM SEITENAUFRUF ───────────────────────
// (d) misst dieselbe Zusage wie `leser-v3-prerender-bezuege` (b), nur für die
// vierte Quelle: der Material-Kanten-Shard geht erst über die Leitung, nachdem
// das Panel offen war. Ohne diese Zeile hätte der neue Reiter die §15-Zusage des
// Panels stillschweigend aufgeweicht — er ist der erste seit H3, der eine neue
// Netzquelle mitbringt.
//
// ROT GESEHEN (§6.7, 31.8.2026):
//  (a)/(b) rot, indem `anwendung` aus `PANEL_REITER` (`v3/panelModell.ts`)
//          entfernt wird ⇒ «Reiter ‹Anwendung› fehlt in der Leiste».
//  (c)     rot, indem in `PanelAnwendung.tsx` `grob` unbedingt statt nur bei
//          leeren `gruppen` gefüllt wird ⇒ beide Werkzeug-Abschnitte stehen
//          gleichzeitig da (die zwei Antworten auf dieselbe Frage, §5).
//  (d)     rot, indem `useSoftLaw` in `LeserPanelZone.tsx` `true` statt
//          `zustand.jeGeoeffnet` bekommt ⇒ Kanten-Shard schon beim Seitenaufruf.
import { test, expect, type Page } from '@playwright/test'

const KANTEN_MUSTER = /\/materialien\/kanten\//

async function panelOeffnen(page: Page, pfad: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(pfad)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await page.locator('[data-v3-panel-zaehler]').click()
  await expect(page.locator('[data-v3-panel]')).toBeVisible()
}

test.describe('W2·7-VZUI — Reiter «Anwendung» im Gesetz-Leser-Panel', () => {
  test('(a) ARG: beide Abschnitte tragen — Behörden-Praxis UND Werkzeuge', async ({ page }) => {
    await panelOeffnen(page, '/gesetze/bund/ARG')

    const reiter = page.locator('[data-v3-panel-reiter="anwendung"]')
    await expect(reiter, 'Reiter «Anwendung» fehlt in der Leiste').toBeVisible()
    // Der Reiter trägt seinen erklärenden Titel, nicht nur den Kurznamen.
    await expect(reiter).toHaveAttribute('title', /Behörden-Ressourcen und Werkzeuge/)

    await reiter.click()
    await expect(reiter).toHaveAttribute('aria-selected', 'true')
    const tafel = page.locator('[data-v3-panel-reiter-inhalt="anwendung"]')
    await expect(tafel).toBeVisible({ timeout: 20_000 })

    // Behörden-Praxis: der Abschnitt steht, mit mindestens einer echten Zeile.
    const behoerden = page.locator('[data-v3-anwendung="behoerden"]')
    await expect(behoerden, 'Behörden-Praxis fehlt am ARG').toBeVisible({ timeout: 20_000 })
    expect(await behoerden.locator('li').count(), 'Behörden-Abschnitt ohne Zeile').toBeGreaterThan(0)
    // §8: der Rang wird genannt, nicht vorausgesetzt.
    await expect(behoerden).toContainText('kein Gesetzesrang')

    // Werkzeuge: hier die grobe Erlass-Zuordnung — und sie SAGT, dass sie grob
    // ist, statt eine Artikel-Genauigkeit zu suggerieren, die es nicht gibt (§8).
    const grob = page.locator('[data-v3-anwendung="werkzeuge-grob"]')
    await expect(grob, 'Werkzeug-Abschnitt fehlt am ARG').toBeVisible()
    await expect(grob).toContainText('nicht einzelnen Artikeln')
    expect(await grob.locator('[data-v3-anwendung-werkzeug]').count()).toBeGreaterThan(0)
  })

  test('(a2) DBG: Behörden-Praxis ohne Werkzeuge — keine leere Überschrift', async ({ page }) => {
    // Alle Werkzeug-Karten zum DBG sind geplant, also nach §8 ausgeblendet
    // (`aufloeseWerkzeuge` lässt nicht verfügbare Karten weg — kein toter Link).
    // Der Abschnitt darf dann nicht als leere Überschrift stehen bleiben.
    await panelOeffnen(page, '/gesetze/bund/DBG')
    await page.locator('[data-v3-panel-reiter="anwendung"]').click()
    const tafel = page.locator('[data-v3-panel-reiter-inhalt="anwendung"]')
    await expect(tafel).toBeVisible({ timeout: 20_000 })

    await expect(page.locator('[data-v3-anwendung="behoerden"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-v3-anwendung="werkzeuge"]')).toHaveCount(0)
    await expect(page.locator('[data-v3-anwendung="werkzeuge-grob"]')).toHaveCount(0)
    await expect(tafel).not.toContainText('Werkzeuge')
  })

  test('(b) der Panel-Kopf nennt im Reiter den ERLASS, nicht die Leseposition', async ({ page }) => {
    await panelOeffnen(page, '/gesetze/bund/DBG')
    await page.locator('[data-v3-panel-reiter="anwendung"]').click()
    await expect(page.locator('[data-v3-panel-reiter-inhalt="anwendung"]')).toBeVisible({ timeout: 20_000 })

    // Befund 34: nur «Entscheide» ist artikelscharf. Ein «· Art. 1» über einer
    // erlass-weiten Liste wäre eine irreführende Ortsangabe (§8).
    const kopf = page.locator('[data-v3-panel] p').first()
    await expect(kopf).toContainText('DBG')
    await expect(kopf).not.toContainText('Art.')

    // Pfeiltaste weiter: der vierte Reiter hängt an der Tastatur-Zusage der
    // Leiste (`role="tablist"` verspricht ←/→) und ist kein Maus-Sonderweg.
    await page.locator('[data-v3-panel-reiter="anwendung"]').press('ArrowLeft')
    await expect(page.locator('[data-v3-panel-reiter="materialien"]')).toHaveAttribute('aria-selected', 'true')
    await page.locator('[data-v3-panel-reiter="materialien"]').press('End')
    await expect(page.locator('[data-v3-panel-reiter="anwendung"]')).toHaveAttribute('aria-selected', 'true')
  })

  test('(c) OR: Werkzeuge ohne Behörden-Bestand — genau EINE Werkzeug-Antwort', async ({ page }) => {
    await panelOeffnen(page, '/gesetze/bund/OR')
    await page.locator('[data-v3-panel-reiter="anwendung"]').click()
    const tafel = page.locator('[data-v3-panel-reiter-inhalt="anwendung"]')
    await expect(tafel).toBeVisible({ timeout: 20_000 })

    // Kein Kanten-Shard für OR ⇒ der Abschnitt entfällt. Und er behauptet auch
    // nichts: keine «0 Behördenpublikationen» irgendwo auf der Tafel.
    await expect(page.locator('[data-v3-anwendung="behoerden"]')).toHaveCount(0)
    await expect(tafel).not.toContainText('Behörden-Praxis')

    // Die artikelscharfe Zuordnung trägt (Art. 127–142 ⇒ Verjährungsrechner).
    const werkzeuge = page.locator('[data-v3-anwendung="werkzeuge"]')
    await expect(werkzeuge).toBeVisible()
    await expect(werkzeuge).toContainText('Art. 127')
    // §5: die grobe Erlass-Zuordnung steht NICHT daneben — sie ist der Ersatz
    // für die fehlende artikelscharfe, nicht ihre Ergänzung.
    await expect(page.locator('[data-v3-anwendung="werkzeuge-grob"]')).toHaveCount(0)
  })

  test('(d) §15: der Kanten-Shard geht erst nach dem Öffnen über die Leitung', async ({ page }) => {
    const anfragen: string[] = []
    page.on('request', (r) => { if (KANTEN_MUSTER.test(r.url())) anfragen.push(r.url()) })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/DBG')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    // Der Lader läuft im Leerlauf — es wird bewusst gewartet, statt sofort zu
    // behaupten, es käme nichts.
    await page.waitForTimeout(2500)
    expect(anfragen, `Kanten-Shard schon beim Seitenaufruf: ${anfragen.join(', ')}`).toEqual([])

    await page.locator('[data-v3-panel-zaehler]').click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible()
    await page.locator('[data-v3-panel-reiter="anwendung"]').click()
    await expect(page.locator('[data-v3-anwendung="behoerden"]')).toBeVisible({ timeout: 20_000 })
    expect(anfragen.length, 'nach dem Öffnen kam kein Kanten-Shard').toBeGreaterThan(0)
  })
})
