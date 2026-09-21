// @shard-gruppe: 6
// ─── H3 · SEO-Prüfpunkt: das Nachladen erreicht den Prerender nicht ──────────
//
// ── §7-BEFUND, ABWEICHEND UMGESETZT UND OFFENGELEGT ─────────────────────────
// Der Fahrplan (Kap. 7, «Panel-Nachladen») formuliert den harten SEO-Prüfpunkt
// so: «Der Prerender behält die Bezüge serverseitig im HTML — nur der Browser
// lädt nach.» Beim Bau nachgemessen: **der prerenderte Erlass-HTML trug nie
// Bezüge.** `erlassVolltextHtml` (`src/lib/seo-detail.ts`) schreibt Kopf +
// Artikel-Volltext und sonst nichts; weder `scripts/prerender.ts` noch
// `seo-detail.ts` berühren `rechtsprechung/bezuege` oder `norm-index`
// (Quellensonde in `src/tests/leser-v3-fundament.test.ts`). Die Prämisse des
// Prüfpunkts ist also falsch — es gibt keine Bezüge im Prerender, die das
// Nachladen verlieren könnte.
//
// WAS DER WÄCHTER STATTDESSEN SICHERT — die reale Fassung derselben Sorge:
//  (a) Die SEO-Substanz der Erlass-Seite ist unverändert im ausgelieferten HTML:
//      Artikel-Volltext, ohne JavaScript, im prerenderten Dokument.
//  (b) Das Nachladen wirkt AUSSCHLIESSLICH im Browser und AUSSCHLIESSLICH nach
//      einer Nutzer-Geste: vor dem Öffnen des Panels geht KEIN Byte des
//      Bezugs-Shards über die Leitung, danach genau dieser eine.
//      Das ist zugleich die Messung der Ersparnis — die Zahl steht im
//      Vollzugsvermerk, das VERHALTEN steht hier.
//
// Ohne (b) wäre das Nachladen eine Behauptung: `useBezuege` lädt in ihrem
// EIGENEN Effekt, nicht beim Konsumieren — ein Panel, das die Daten nur nicht
// anzeigt, hätte sie trotzdem geholt.
//
// ROT GESEHEN (§6.7, 17.8.2026): in `v3/leserV3Modell.ts` `bezuegeVorladen:
// false` entfernt ⇒ (b) rot mit «Bezugs-Shard schon beim Seitenaufruf geladen:
// …/rechtsprechung/bezuege/STPO.json». Fall (a) bricht, wenn
// `erlassVolltextHtml` in `src/lib/seo-detail.ts` auf den Kopf gekürzt wird.
//
// DIE ERWEITERUNG AUF `norm-index` EBENFALLS ROT GESEHEN (§6.7, 31.8.2026): mit
// `normtext` versuchsweise ins Muster aufgenommen lief (b) rot und nannte die
// sechs Anfragen, die beim Seitenaufruf tatsächlich gehen (`normtext/register`,
// `currency`, `struktur/bund/STPO`, `bund/STPO`, `revisionen/STPO`,
// `historie/STPO`). Der Beobachter sieht also, was über die Leitung geht — die
// grüne Zeile ist eine Messung, keine Annahme.
import { test, expect, type Page } from '@playwright/test'

// ── BEIDE SHARD-FAMILIEN, NICHT NUR EINE (W2·7-VZUI, 31.8.2026) ─────────────
// Der Wächter beobachtete bis hierher nur `rechtsprechung/bezuege/`. Die Sorge,
// aus der er stammt, war aber ausdrücklich, dass im Grundzustand BEIDE Shards
// unterwegs sind — der schlanke `norm-index/<Erlass>.json` daneben (Befund
// 2.8.2026, FAHRPLAN-VERZAHNUNG-UI §13). Ein Wächter, der die zweite Familie
// nicht sieht, kann die Zusage nicht halten, auf die sich der Kopf von
// `bezugAuswahl.ts` jetzt beruft; er hätte eine Rückkehr des Doppel-Ladens
// stillschweigend durchgelassen. `norm-index` deckt beide Formen ab: den
// Monolithen `norm-index.json` und die Erlass-Shards `norm-index/OR.json`.
const SHARD_MUSTER = /\/rechtsprechung\/(bezuege\/|norm-index)/

function bezugAnfragen(page: Page): string[] {
  const treffer: string[] = []
  page.on('request', (r) => { if (SHARD_MUSTER.test(r.url())) treffer.push(r.url()) })
  return treffer
}

test.describe('H3 — Prerender bleibt unberührt, das Nachladen bleibt im Browser', () => {
  test('(a) das prerenderte Erlass-HTML trägt den Artikel-Volltext', async ({ request }) => {
    // Direkt die vom Prerender geschriebene Datei, nicht die SPA-Route: das ist
    // das Dokument, das ein Crawler bekommt (Vercel matcht es über das
    // Dateisystem, `vite preview` liefert es unter demselben Pfad mit `.html`).
    const antwort = await request.get('/gesetze/bund/STPO.html')
    expect(antwort.status(), 'prerenderte Erlass-Seite fehlt').toBe(200)
    const html = await antwort.text()

    // Kopf-Substanz (§8: Identität + amtliche Quelle).
    expect(html).toContain('SR 312.0')
    expect(html).toContain('amtliche Fassung (geltend)')
    // Artikel-Substanz: Überschrift UND Wortlaut, nicht bloss die Marke.
    expect(html).toContain('Art. 429')
    expect(html).toMatch(/Anspruch/)
    // Genug Artikel, um «thin content» auszuschliessen — die StPO führt 480.
    const artikel = html.match(/<article>/g)?.length ?? 0
    expect(artikel, `nur ${artikel} <article> im prerenderten HTML`).toBeGreaterThan(400)
    // Und KEIN Stück Hüllen-Zustand: der Prerender kennt das Panel nicht.
    expect(html).not.toContain('data-v3-panel')
    expect(html).not.toContain('data-leser-v3')
  })

  test('(b) Bezugs-Shard: null Anfragen beim Seitenaufruf, genau eine nach dem Öffnen', async ({ page }) => {
    const anfragen = bezugAnfragen(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
    // Der Lader läuft im Leerlauf (`beiLeerlauf`) — es wird also bewusst gewartet,
    // statt sofort zu behaupten, es käme nichts.
    await page.waitForTimeout(2500)

    expect(anfragen, `Bezugs-Shard schon beim Seitenaufruf geladen: ${anfragen.join(', ')}`).toEqual([])

    await page.locator('[data-v3-panel-zaehler]').click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible()
    await expect(page.locator('[data-v3-panel] [data-v3-panel-gruppe]').first()).toBeVisible({ timeout: 20_000 })

    expect(anfragen.length, 'nach dem Öffnen wurde kein Shard geladen').toBeGreaterThan(0)
    expect(anfragen.length, `mehr als ein Shard-Fetch: ${anfragen.join(', ')}`).toBe(1)
    expect(anfragen[0]).toMatch(/STPO\.json/)

    // Schliessen und wieder öffnen lädt NICHT erneut (`jeGeoeffnet`, nicht `offen`).
    await page.locator('[data-v3-panel-zu]').click()
    await page.locator('[data-v3-panel-zaehler]').click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible()
    await page.waitForTimeout(1200)
    expect(anfragen.length, `Zweit-Fetch nach Wieder-Öffnen: ${anfragen.join(', ')}`).toBe(1)
  })

  test('(c) ohne JavaScript bleibt die Erlass-Seite lesbar (Crawler-Sicht)', async ({ browser }) => {
    const kontext = await browser.newContext({ javaScriptEnabled: false })
    const seite = await kontext.newPage()
    const anfragen = bezugAnfragen(seite)
    await seite.goto('/gesetze/bund/STPO.html')
    await expect(seite.locator('h1')).toContainText('StPO', { timeout: 20_000 })
    await expect(seite.locator('article').first()).toBeVisible()
    expect(anfragen, 'ohne JS wurde ein Bezugs-Shard geholt').toEqual([])
    await kontext.close()
  })
})
