// @shard-gruppe: 5
// W2·17-UI-BEFUNDE-B2 · Los G — History und Scroll im Gesetzes-Leser.
//
// LM-199: «Zurück» mit stehendem #hash in der URL. Der Einstiegs-Anker (Deep-
// Link) ist nach dem ersten Sprung VERBRAUCHT — kehrt man per Browser-Zurück aus
// einer anderen Route auf den Eintrag zurück, muss die A16-Anker-Restauration
// (letzte Leseposition) gewinnen, nicht der alte Hash. Prod-Messung 2.8.2026:
// mit stehendem Hash landete «Zurück» ~149'000 px daneben (am Hash-Artikel).
// Ohne Hash war A16 korrekt — der Fall hier ergänzt die bestehenden A16-Tests
// (leser-position-u.e2e.ts), er ersetzt sie nicht.
//
// LM-201: Wechsel auf eine kürzere Seite ohne anstehende Restauration beginnt
// oben — SYNCHRON vor dem ersten Paint, ohne Zwischenzustand «neues (kurzes)
// Dokument + alte/geklemmte Scrollposition» (Prod-Messung: Ankunft bei y=2'520
// auf 3'249 px Dokumenthöhe, +15 ms Zwischenzustand belegt).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// ── LM-199: Zurück auf einen Eintrag MIT stehendem #hash ⇒ Anker gewinnt ─────
test.describe('LM-199 — Zurück mit stehendem #hash: Leseposition, nicht Einstiegs-Anker', () => {
  test('AIG#art-90 → zu Art. 5 gescrollt → StGB → Zurück ⇒ Art. 5 im Viewport (nicht Art. 90)', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })

    // Einstieg per Deep-Link: der Hash-Sprung selbst muss funktionieren (Wächter
    // gegen Über-Unterdrückung — ein frischer Deep-Link bleibt ein Sprungziel).
    await page.goto('/gesetze/bund/AIG#art-90')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AIG')
    await expect(page.locator('#art-90')).toBeInViewport({ timeout: 20000 })

    // Organisch weg vom Einstiegs-Anker zu Art. 5 scrollen (Anker-Erfassung).
    const art5 = page.locator('#art-5')
    await expect(art5).toBeAttached({ timeout: 20000 })
    await art5.scrollIntoViewIfNeeded()
    await page.waitForTimeout(250) // Anker-Scroll-Listener (rAF) erfassen lassen
    await expect(art5).toBeInViewport()

    // Cross-Erlass-Navigation wie im A16-Bestandstest: Fremdverweis-Popover
    // (StGB) → «Im Gesetz öffnen» (SPA-Navigation, echter History-Eintrag).
    const stgbLink = art5.locator('a[href*="54/757_781_799"][href*="#art_66_a"]:not([href*="66_a_bis"])').first()
    await expect(stgbLink).toBeVisible({ timeout: 10000 })
    await stgbLink.click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    const oeffnen = dialog.getByRole('link', { name: /Im Gesetz öffnen/ })
    await expect(oeffnen).toBeVisible()
    await oeffnen.click()
    await expect(page).toHaveURL(/\/gesetze\/bund\/STGB/i, { timeout: 15000 })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('StGB', { timeout: 15000 })

    // ZURÜCK: der History-Eintrag trägt noch «#art-90» — der ist verbraucht.
    // Massgeblich ist die verlassene Leseposition (Art. 5), nicht der Einstieg.
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AIG', { timeout: 15000 })
    await expect(page.locator('#art-5')).toBeInViewport({ timeout: 15000 })
    await expect(page.locator('#art-90')).not.toBeInViewport()
    // Kein Hash-Sync (§Z Ziff. 7): die URL wird dabei NICHT umgeschrieben.
    await expect(page).toHaveURL(/#art-90$/)
    expect(fehler).toEqual([])
  })

  test('Intra-Dokument-Zurück (MWSTG Art. 5 → 31 → zurück) bleibt ein Hash-Sprung', async ({ page }) => {
    // Wächter: die LM-199-Unterdrückung gilt NUR beim Rückweg aus einer ANDEREN
    // Route. Innerhalb desselben Dokuments (gleiche Reiter-Identität) bleibt der
    // Hash beim Zurück das Sprungziel (deckungsgleich mit A16, leser-position-u).
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/MWSTG#art-5')
    await expect(page.locator('#art-5')).toBeInViewport({ timeout: 20000 })
    const link31 = page.locator('a[href="/gesetze/bund/MWSTG#art-31"]').first()
    await expect(link31).toBeVisible({ timeout: 10000 })
    await link31.click()
    await expect(page.locator('#art-31')).toBeInViewport({ timeout: 10000 })
    await page.goBack()
    await expect(page.locator('#art-5')).toBeInViewport({ timeout: 10000 })
    expect(fehler).toEqual([])
  })
})

// ── LM-201: Wechsel auf kürzere Seite beginnt oben, ohne Zwischenzustand ─────
test.describe('LM-201 — Routenwechsel auf kürzere Seite: kein Frame mit alter Scrollposition', () => {
  test('SCHKG (tief) → Startseite: jeder Frame mit neuem (kurzem) Dokument hat scrollY 0', async ({ page }) => {
    test.slow()
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    // CPU-Drossel weitet das Zeitfenster zwischen Commit und nachlaufendem
    // Effekt — genau dort sass der Prod-Zwischenzustand (+15 ms).
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

    // Tief in einem langen Erlass stehen (SCHKG Art. 312, weit unten).
    await page.goto('/gesetze/bund/SCHKG#art-312')
    await expect(page.locator('#art-312')).toBeInViewport({ timeout: 20000 })
    const yVorher = await page.evaluate(() => window.scrollY)
    expect(yVorher, `Ausgangs-scrollY ${yVorher}`).toBeGreaterThan(100_000)

    // Frame-Sampler scharf schalten: je rAF-Frame (= unmittelbar vor dem Paint)
    // scrollY + Dokumenthöhe festhalten, sobald das Dokument auf die neue, kurze
    // Seite gewechselt hat (< 30 % der alten Höhe). Ein Frame mit kurzem Dokument
    // UND alter/geklemmter Scrollposition IST der LM-201-Zwischenzustand.
    await page.evaluate(() => {
      const w = window as unknown as { __lm201: { y: number; h: number }[] }
      w.__lm201 = []
      const alteHoehe = document.documentElement.scrollHeight
      let frames = 0
      const tick = () => {
        const h = document.documentElement.scrollHeight
        if (h < alteHoehe * 0.3) w.__lm201.push({ y: window.scrollY, h })
        if (w.__lm201.length < 8 && frames++ < 900) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    // Navigation auf eine kürzere, nie besuchte Seite (Startseite) — per Klick
    // (echte SPA-Navigation), nicht per goto (Vollreload hätte keine alte Position).
    //
    // Ä1c (H2b, fachliche Änderung): im Gesetz-Leser startet die App-Seitenleiste
    // eingeklappt (istGesetzLeserPfad, useSeitenleiste/Shell.tsx) — die Sidebar
    // (und mit ihr `nav[aria-label="Hauptnavigation"]`) ist dann gar nicht im DOM
    // (Shell.tsx: `{!seitenleiste.eingeklappt && (<Sidebar />…)}`). Auf Desktop
    // (ab `lg`, dieser Test läuft auf 1440×900) trägt NUR die Sidebar das Logo als
    // Startseiten-Link — Topbar.tsx Zeile 111 ist bewusst `lg:hidden` ("Logo nur
    // unterhalb lg — ab lg trägt die Seitenleiste die Marke"). Der reale,
    // immer sichtbare Nutzerweg ist der Topbar-Schalter der Seitenleiste
    // (Topbar.tsx, unabhängig vom Leser-Pfad gerendert): er öffnet die Sidebar,
    // danach ist der Startseiten-Link da und klickbar — das prüft DOM-Probe
    // (isVisible/boundingBox) vor diesem Fix belegt.
    // §6.3-ANPASSUNG 5.9.2026 (deklarierte fachliche Änderung, QS-UI
    // Folgeschritt): der Knopf hiess zustandsabhängig «Seitenleiste einblenden»
    // / «Seitenleiste ausblenden» — ein Name, der den Zustand mitführt und beim
    // Klick wechselt (WCAG 4.1.2, Tor ARIA_ZUSTANDSNAME). Er heisst jetzt
    // konstant «Seitenleiste ein- und ausblenden»; den Zustand trägt
    // `aria-pressed`. Die Sache dieser Spec (LM-201) ist unverändert: erst den
    // Schalter, dann den Startseiten-Link. `pressed: false` hält zusätzlich
    // fest, WAS hier vorausgesetzt wird — die Leiste ist im Leser eingeklappt
    // (Ä1c); vorher steckte diese Vorbedingung stillschweigend im Namen.
    // DEKLARIERTE ANPASSUNG W2·24-DESIGN-IDENTITAET R2 (6.9.2026, §6.3): seit der
    // Titelblatt-Zeile trägt die Marke im `header` auf JEDER Breite den
    // Startseiten-Link (Topbar.tsx); der Seitenleisten-Logo-Link lebt nur noch in
    // der mobilen Schublade (`hidden max-[480px]:flex`). Der Umweg über den
    // Seitenleisten-Schalter entfällt — die Sache (SPA-Navigation per Klick auf
    // eine kürzere Seite) ist unverändert.
    await page.locator('header a[aria-label="LexMetrik – Startseite"]').first().click()
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
    await page.waitForFunction(() => (window as unknown as { __lm201?: unknown[] }).__lm201!.length >= 4, undefined, { timeout: 15000 })

    const proben = await page.evaluate(() => (window as unknown as { __lm201: { y: number; h: number }[] }).__lm201)
    for (const p of proben) {
      expect(p.y, `Frame mit kurzem Dokument (h=${p.h}) bei scrollY=${p.y} — Zwischenzustand sichtbar`).toBeLessThanOrEqual(2)
    }
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    expect(fehler).toEqual([])
  })
})
