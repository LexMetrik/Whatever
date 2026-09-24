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
//         [Ergänzt 24.9.2026, Nachzug #1016 (D6/AN-6): die ArG-Zuordnung zur
//         Lohnfortzahlung war fachlich falsch und ist entfernt; seither ARG
//         erlass-weit 0 verfügbare Werkzeuge, 1 geplantes (Überzeit-Zuschlag,
//         Art. 12/13 ArG). Die grobe Liste prüft (a3) an der VMWG.]
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
//
// ── S6 (23.9.2026) · «ANWENDUNG» IST GETEILT — §6.3-DEKLARATION ───────────
// Entscheid David 23.9.2026 (AN-11), wörtlich: «es soll werkzeuge und
// behördliche erläuterungen heissen. nicht dass es mit materialien verwechselt
// wird die gesetzgebung darstellen», auf Nachfrage «Zwei eigene Reiter». Die
// Datei hiess `leser-v3-panel-anwendung.e2e.ts` und ist umbenannt; ihre
// Zusagen gelten weiter, je auf dem Reiter, der den Bestand jetzt trägt:
//   (a)  ARG — Behörden-Praxis im Reiter «Erläuterungen» (die artikelweise
//        SECO-Wegleitung als EIN Posten, AN-8), die grobe Werkzeug-Zuordnung
//        im Reiter «Werkzeuge» («dem Erlass als Ganzem zugeordnet»).
//        [Seit #1016 (24.9.2026): am ArG kein verfügbares Werkzeug mehr, nur
//        der geplante Überzeit-Zuschlag «In Vorbereitung»; die grobe
//        Zuordnung MIT verfügbarem Werkzeug misst (a3) an der VMWG.]
//   (a2) DBG — Erläuterungen da; «Werkzeuge» zeigt keine leere Überschrift
//        (heute: nur «In Vorbereitung», AN-12 — geplante Karten ohne Link).
//   (b)  Kopf nennt den ERLASS, Pfeiltasten laufen bis «Werkzeuge».
//   (c)  OR — genau EINE Werkzeug-Antwort (artikelscharf), je Werkzeug eine
//        Zeile (AN-7): der Verjährungsrechner steht einmal.
//   (d)  §15 unverändert — der Kanten-Shard erst nach dem Öffnen.
// Die Rot-Belege oben gelten ihrem Datum (§0 Ziff. 2b); der Rot-Beweis der
// S6-Regeln steht in `src/tests/leser-blatt-reiter-s6.test.tsx`.
import { test, expect, type Page } from '@playwright/test'

const KANTEN_MUSTER = /\/materialien\/kanten\//

async function panelOeffnen(page: Page, pfad: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(pfad)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await page.locator('[data-v3-panel-zaehler]').click()
  await expect(page.locator('[data-v3-panel]')).toBeVisible()
}

async function reiter(page: Page, id: 'erlaeuterungen' | 'werkzeuge'): Promise<void> {
  const r = page.locator(`[data-v3-panel-reiter="${id}"]`)
  await r.click()
  await expect(r).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator(`[data-v3-panel-reiter-inhalt="${id}"]`)).toBeVisible({ timeout: 20_000 })
}

test.describe('S6 — Reiter «Erläuterungen» und «Werkzeuge» im Erlass-Blatt', () => {
  test('(a) ARG: Erläuterungen gebündelt, Werkzeuge ehrlich ohne verfügbaren Rechner', async ({ page }) => {
    await panelOeffnen(page, '/gesetze/bund/ARG')
    await expect(page.locator('[data-v3-panel-reiter="erlaeuterungen"]')).toHaveAttribute('title', /Behördliche Erläuterungen/)
    await reiter(page, 'erlaeuterungen')
    const erl = page.locator('[data-v3-erlaeuterungen]')
    await expect(erl).toContainText('kein Gesetzesrang')
    // AN-8: die artikelweise Wegleitung ist EIN Posten, nicht 71 Zeilen.
    await expect(page.locator('[data-v3-erlaeuterung-reihe]')).toHaveCount(1)
    expect(await page.locator('[data-v3-erlaeuterungen] > ul > li').count()).toBeLessThan(20)
    // §6.3-DEKLARATION (Fachkorrektur #1016, 24.9.2026, Befund AN-6): das ArG
    // trägt keine OR-Rechner mehr. Die frühere erlass-weite Zuordnung
    // «Lohnfortzahlung (kantonale Skala)» war falsch — die Regel steht in
    // Art. 324a/324b OR, nicht im ArG (Fedlex AKN SR 822.11, Fassung 1.9.2023;
    // Beleg in src/lib/normtext/werkzeuge.ts). Gemessen 24.9.2026
    // (`werkzeugAnsicht('ARG')`): verfügbar 0, geplant 1 (ueberstunden-zuschlag,
    // Art. 12/13 ArG). Der Reiter sagt das ehrlich: kein Link, der Überzeit-
    // Zuschlag nur «In Vorbereitung». Die grobe Liste MIT Werkzeug: (a3).
    await reiter(page, 'werkzeuge')
    await expect(page.locator('[data-v3-werkzeuge="erlass"]')).toContainText('nicht einzelnen Artikeln')
    await expect(page.locator('[data-v3-werkzeug]')).toHaveCount(0)
    await expect(page.locator('[data-v3-werkzeug-geplant="ueberstunden-zuschlag"]')).toHaveCount(1)
    await expect(page.locator('[data-v3-werkzeug-geplant] a')).toHaveCount(0)
  })

  test('(a3) VMWG: grobe Werkzeug-Zuordnung sagt, dass sie grob ist', async ({ page }) => {
    // Ersatz-Fixture für den Grob-Pfad aus (a), übernommen aus #1016 (D6,
    // 23.9.2026) auf die S6-Selektoren: die VMWG (SR 221.213.11) hat keine
    // artikelscharfe Kante, aber auf Erlass-Ebene den verfügbaren
    // Miet-Kündigungsrechner (Art. 9 VMWG «Kündigungen»).
    await panelOeffnen(page, '/gesetze/bund/VMWG')
    await reiter(page, 'werkzeuge')
    // Die grobe Erlass-Zuordnung SAGT, dass sie grob ist, statt eine
    // Artikel-Genauigkeit zu suggerieren, die es nicht gibt (§8).
    const grob = page.locator('[data-v3-werkzeuge="erlass"]')
    await expect(grob, 'Werkzeug-Abschnitt fehlt an der VMWG').toBeVisible()
    await expect(grob).toContainText('nicht einzelnen Artikeln')
    expect(await grob.locator('[data-v3-werkzeug]').count()).toBeGreaterThan(0)
    await expect(page.locator('[data-v3-werkzeuge="artikel"]')).toHaveCount(0)
  })

  test('(a2) DBG: Erläuterungen da, Werkzeuge ohne leere Überschrift', async ({ page }) => {
    await panelOeffnen(page, '/gesetze/bund/DBG')
    await reiter(page, 'erlaeuterungen')
    expect(await page.locator('[data-v3-erlaeuterung]').count()).toBeGreaterThan(0)
    await reiter(page, 'werkzeuge')
    const tafel = page.locator('[data-v3-panel-reiter-inhalt="werkzeuge"]')
    // Entweder ein ehrlicher Leersatz oder Einträge — nie ein Kopf ohne Zeile.
    const zeilen = await page.locator('[data-v3-werkzeug], [data-v3-werkzeug-geplant]').count()
    if (zeilen === 0) await expect(tafel).toContainText('keinen Rechner und keine Vorlage')
    await expect(page.locator('[data-v3-werkzeug]').first().locator('a[href="#"]')).toHaveCount(0)
  })

  test('(b) der Panel-Kopf nennt den ERLASS, Pfeiltasten bis «Werkzeuge»', async ({ page }) => {
    await panelOeffnen(page, '/gesetze/bund/DBG')
    await reiter(page, 'erlaeuterungen')
    const kopf = page.locator('[data-v3-panel] p').first()
    await expect(kopf).toContainText('DBG')
    await expect(kopf).not.toContainText('Art.')
    await page.locator('[data-v3-panel-reiter="erlaeuterungen"]').press('ArrowLeft')
    await expect(page.locator('[data-v3-panel-reiter="materialien"]')).toHaveAttribute('aria-selected', 'true')
    await page.locator('[data-v3-panel-reiter="materialien"]').press('End')
    await expect(page.locator('[data-v3-panel-reiter="werkzeuge"]')).toHaveAttribute('aria-selected', 'true')
  })

  test('(c) OR: genau EINE Werkzeug-Antwort, jedes Werkzeug einmal', async ({ page }) => {
    await panelOeffnen(page, '/gesetze/bund/OR')
    await reiter(page, 'werkzeuge')
    await expect(page.locator('[data-v3-werkzeuge="artikel"]')).toBeVisible()
    await expect(page.locator('[data-v3-werkzeuge="erlass"]')).toHaveCount(0)
    await expect(page.locator('[data-v3-werkzeug="verjaehrung"]')).toHaveCount(1)
    await expect(page.locator('[data-v3-werkzeug="verjaehrung"]')).toContainText('Art. 127')
  })

  test('(d) §15: der Kanten-Shard geht erst nach dem Öffnen über die Leitung', async ({ page }) => {
    const anfragen: string[] = []
    page.on('request', (r) => { if (KANTEN_MUSTER.test(r.url())) anfragen.push(r.url()) })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/DBG')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(2500)
    expect(anfragen, `Kanten-Shard schon beim Seitenaufruf: ${anfragen.join(', ')}`).toEqual([])
    await page.locator('[data-v3-panel-zaehler]').click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible()
    await reiter(page, 'erlaeuterungen')
    await expect(page.locator('[data-v3-erlaeuterungen]')).toBeVisible({ timeout: 20_000 })
    expect(anfragen.length, 'nach dem Öffnen kam kein Kanten-Shard').toBeGreaterThan(0)
  })
})
