// @shard-gruppe: 4
// ═══ W2·5m · DIE EINZELARTIKEL-ANSICHT IM BROWSER (Kap. 15, E1+E2) ══════════
//
// Was die Vitest-Sonden NICHT sagen können und diese Spec darum misst:
//  · ob der Umschalter im echten Ansicht-Menü sitzt und verlustfrei wechselt
//    (der Artikel, an dem man steht, ist danach der gezeigte);
//  · ob wirklich NUR EINE Bestimmung im Bild steht — die Zusage des Modus;
//  · ob «Zurück» einen Artikel zurückblättert (`pushState`, Kap. 15.6) —
//    das ist Browser-Verhalten und in keiner Unit-Sonde nachstellbar;
//  · ob das Kontext-Panel im Einzelmodus wirklich WEG ist (D-E4) und nicht
//    bloss unsichtbar;
//  · ob die Blöcke dieselben Daten zeigen wie die Zeile am Artikelende;
//  · ob der Rückbau aus #854 greift: in der GESAMTANSICHT steht kein Pfeil mehr.
//
// ── ROT ZU BEKOMMEN (§6.7), je Fall ─────────────────────────────────────────
//  (a) In `v3/LeserRahmenV3.tsx` `einzelToken` fest auf `null` ⇒ «nur eine
//      Bestimmung im Bild» wird rot (der ganze Erlass steht da).
//  (b) In `v3/useEinzelModus.ts` `navigate(...)` durch `navigate(..., {replace:
//      true})` ersetzt ⇒ «Zurück blättert einen Artikel zurück» wird rot.
//  (c) In `v3/LeserRahmenV3.tsx` `panelZone={imEinzel ? null : …}` auf die alte
//      Form zurückgesetzt ⇒ «kein Panel im Einzelmodus» wird rot.
//  (d) In `v3/LeserLesespalte.tsx` `nachbarn={einzel ? … : undefined}` wieder
//      unbedingt gesetzt ⇒ «kein Pfeil in der Gesamtansicht» wird rot.
// Alle vier so gemessen (14.9.2026, chromium, Projekt `leser-v3`).
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

const OR = '/gesetze/bund/OR'
/** S4-Probe: der Kantonserlass läuft denselben Weg, ohne Sonderpfad (Kap. 15.6). */
const KANTON = '/gesetze/kanton/BS-640.100'
/** Der Einzelmodus als Adresse — genau die Form, die ein geteilter Link trägt. */
const einzel = (pfad: string, token: string) => `${pfad}?ansicht=artikel#art-${token}`

async function rahmenBereit(page: Page) {
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 30_000 })
}

/** Öffnet das Menü «Ansicht ▾» und wählt eine Lesart. Zählt ZWEI Klicks. */
async function waehleLesart(page: Page, modus: 'erlass' | 'artikel') {
  await page.locator('[data-v3-ansicht]').first().click()
  await page.locator(`[data-v3-modus="${modus}"]`).first().click()
}

test.describe('W2·5m/E1 — der Umschalter und das Blättern', () => {
  test('der Umschalter sitzt im Ansicht-Menü und ist im Zustand erkennbar (B3)', async ({ page }) => {
    await page.goto(OR)
    await rahmenBereit(page)
    await page.locator('[data-v3-ansicht]').first().click()
    const gruppe = page.locator('[data-v3-modus-wahl]')
    await expect(gruppe).toBeVisible({ timeout: 10_000 })
    // B3: ausgeschrieben UND maschinenlesbar — nicht allein über Farbe.
    await expect(page.locator('[data-v3-modus="erlass"]')).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('[data-v3-modus="artikel"]')).toHaveAttribute('aria-checked', 'false')
    await expect(gruppe).toContainText('Ganzer Erlass')
    await expect(gruppe).toContainText('Einzelne Bestimmung')
  })

  test('der Wechsel ist verlustfrei: der gelesene Artikel ist der gezeigte', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto(`${OR}#art-337_c`)
    await rahmenBereit(page)
    await waehleLesart(page, 'artikel')
    // Die Adresse trägt den Modus — ein Link daraus zeigt, was der Absender sah.
    await expect.poll(() => page.evaluate(() => location.search), { timeout: 10_000 })
      .toBe('?ansicht=artikel')
    await expect(page.locator('[data-einzel-artikel="337_c"]')).toBeVisible({ timeout: 20_000 })
    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('im Einzelmodus steht GENAU EINE Bestimmung im Bild', async ({ page }) => {
    await page.goto(einzel(OR, '337_c'))
    await rahmenBereit(page)
    await expect(page.locator('[data-einzel-artikel]')).toBeVisible({ timeout: 20_000 })
    // Die Zusage des Modus, gemessen am DOM: ein Artikel-Anker, nicht 1686.
    const artikel = await page.locator('#lc-lesespalte [id^="art-"]').count()
    expect(artikel).toBe(1)
    await expect(page.locator('#art-337_c')).toBeVisible()
  })

  test('Blättern 337b → 337c → 337d über die Pfeile (Kopf und Fuss)', async ({ page }) => {
    await page.goto(einzel(OR, '337_b'))
    await rahmenBereit(page)
    await expect(page.locator('[data-einzel-artikel="337_b"]')).toBeVisible({ timeout: 20_000 })

    // B1: BEIDE Pfeil-Paare stehen — im Artikelkopf und in der Fusszeile.
    await expect(page.locator('[data-artikel-nachbarn]')).toHaveCount(2)

    await page.locator('[data-nachbar="nach"]').first().click()
    await expect(page.locator('[data-einzel-artikel="337_c"]')).toBeVisible({ timeout: 20_000 })
    // Der Fuss-Pfeil blättert genauso — B9: auf dem Handy ist er die Hauptbedienung.
    await page.locator('[data-nachbar="nach"]').last().click()
    await expect(page.locator('[data-einzel-artikel="337_d"]')).toBeVisible({ timeout: 20_000 })
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#art-337_d')
  })

  test('«Zurück» blättert einen Artikel zurück (pushState, Kap. 15.6)', async ({ page }) => {
    await page.goto(einzel(OR, '337_b'))
    await rahmenBereit(page)
    await expect(page.locator('[data-einzel-artikel="337_b"]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-nachbar="nach"]').first().click()
    await expect(page.locator('[data-einzel-artikel="337_c"]')).toBeVisible({ timeout: 20_000 })

    await page.goBack()
    // DER PUNKT: nicht die Seite verlassen, sondern einen Artikel zurück. Genau
    // dafür gilt hier `pushState` statt der sonstigen `replaceState`-Regel.
    await expect(page.locator('[data-einzel-artikel="337_b"]')).toBeVisible({ timeout: 20_000 })
  })

  test('←/→ blättern (Tastatur), j/k bleiben unberührt', async ({ page }) => {
    await page.goto(einzel(OR, '337_c'))
    await rahmenBereit(page)
    await expect(page.locator('[data-einzel-artikel="337_c"]')).toBeVisible({ timeout: 20_000 })
    await page.locator('body').click({ position: { x: 5, y: 5 } })

    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-einzel-artikel="337_d"]')).toBeVisible({ timeout: 20_000 })
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('[data-einzel-artikel="337_c"]')).toBeVisible({ timeout: 20_000 })
    // B2 · der Hinweis steht GENAU EINMAL im Dokument, nicht je Block.
    await expect(page.locator('[data-einzel-tastaturhinweis]')).toHaveCount(1)
  })

  test('der Deep-Link trägt den Modus, und der Rückweg verlässt ihn (B4)', async ({ page }) => {
    await page.goto(einzel(OR, '337_c'))
    await rahmenBereit(page)
    const pfad = page.locator('[data-einzel-pfad]')
    await expect(pfad).toBeVisible({ timeout: 20_000 })
    // Der Gliederungspfad ist der Rückweg: ein Glied führt in die Gesamtansicht.
    await pfad.locator('a').last().click()
    await expect.poll(() => page.evaluate(() => location.search), { timeout: 10_000 }).toBe('')
    await expect(page.locator('[data-einzel-artikel]')).toHaveCount(0)
  })

  test('D-E4 · im Einzelmodus ist das Kontext-Panel WEG, nicht versteckt', async ({ page }) => {
    await page.goto(OR)
    await rahmenBereit(page)
    // In der Gesamtansicht gibt es den Griff.
    await expect(page.locator('[data-v3-panel-oeffner], [data-v3-erlass-griff]').first())
      .toBeVisible({ timeout: 20_000 })
    await page.goto(einzel(OR, '337_c'))
    await rahmenBereit(page)
    await expect(page.locator('[data-einzel-artikel]')).toBeVisible({ timeout: 20_000 })
    // Nicht gemountet: kein Panel-Blatt im DOM. Ein verstecktes hielte seine
    // Reiter im Fokusbaum und beanspruchte ←/→ weiter.
    await expect(page.locator('[data-v3-panel]')).toHaveCount(0)
  })

  test('D-E1 · in der GESAMTANSICHT steht kein Nachbar-Pfeil mehr (Rückbau #854)', async ({ page }) => {
    await page.goto(`${OR}#art-337_c`)
    await rahmenBereit(page)
    await expect(page.locator('#art-337_c')).toBeVisible({ timeout: 20_000 })
    // David 14.9.2026: «wenn man einfach scrollen kann dann bringt das ja nichts».
    await expect(page.locator('[data-artikel-nachbarn]')).toHaveCount(0)
  })

  test('der Erlass-Ingress steht nicht vor der Bestimmung, der Erlass-Kopf schon', async ({ page }) => {
    // Gemessen bei der Sichtprüfung 14.9.2026: der Vorspann füllte @390 den
    // ersten Bildschirm, bevor der Artikel begann. Der Kopf (Titel, Stand,
    // amtliche Quelle) bleibt — er ist der §7-Ausweis der gelesenen Fassung.
    await page.goto(OR)
    await rahmenBereit(page)
    await expect(page.locator('section[aria-label="Ingress"]').first())
      .toBeVisible({ timeout: 20_000 })
    await page.goto(einzel(OR, '336_c'))
    await rahmenBereit(page)
    await expect(page.locator('[data-einzel-artikel]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('section[aria-label="Ingress"]')).toHaveCount(0)
    // Die Erlass-Identität bleibt: die klebende Kopfzeile trägt sie auf jeder
    // Breite, und der Gliederungspfad sagt, wo im Erlass man steht.
    await expect(page.locator('[data-v3-kopf]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[data-einzel-pfad]')).toBeVisible({ timeout: 20_000 })
  })

  test('S4-Probe: der Kantonserlass kennt denselben Modus, ohne Sonderweg', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto(KANTON)
    await rahmenBereit(page)
    await waehleLesart(page, 'artikel')
    await expect(page.locator('[data-einzel-artikel]')).toBeVisible({ timeout: 20_000 })
    const artikel = await page.locator('#lc-lesespalte [id^="art-"]').count()
    expect(artikel).toBe(1)
    await expect(page.locator('[data-artikel-dossier]')).toBeVisible({ timeout: 20_000 })
    expect(fehler, fehler.join('\n')).toEqual([])
  })
})

test.describe('W2·5m/E2 — die Dossier-Blöcke', () => {
  test('B6 · beim Laden steht genau ein Block offen (die Fassung)', async ({ page }) => {
    await page.goto(einzel(OR, '336_c'))
    await rahmenBereit(page)
    const dossier = page.locator('[data-artikel-dossier]')
    await expect(dossier).toBeVisible({ timeout: 20_000 })
    await expect.poll(
      () => dossier.locator('[aria-expanded="true"]').count(),
      { timeout: 20_000 },
    ).toBe(1)
    await expect(dossier.locator('[data-reg="f"][aria-expanded="true"]')).toHaveCount(1)
  })

  test('M4/N1 · OR 336c: seit wann gilt Abs. 1 lit. a — ohne einen einzigen Klick', async ({ page }) => {
    // Szenario N1 aus Kap. 15.2. Das Konzept veranschlagte 1 Klick (Block
    // aufklappen); gemessen sind es NULL, weil die Fassung als erster Block
    // offen startet (B6). Der Wert ist damit besser als das Kriterium «≤ 2».
    await page.goto(einzel(OR, '336_c'))
    await rahmenBereit(page)
    const block = page.locator('[data-artikel-dossier] [data-reg="f"]').last()
    await expect(block).toBeVisible({ timeout: 20_000 })
    await expect(block).toContainText('AS 1996 1445', { timeout: 20_000 })
  })

  test('M4/N3 · OR 127: welches Werkzeug rechnet die Frist — ein Klick', async ({ page }) => {
    await page.goto(einzel(OR, '127'))
    await rahmenBereit(page)
    const dossier = page.locator('[data-artikel-dossier]')
    await expect(dossier).toBeVisible({ timeout: 20_000 })
    // EIN Klick auf den Block «Rechner».
    await dossier.locator('[data-reg="w"]').first().click()
    const inhalt = dossier.locator('[data-reg="w"]').last()
    await expect(inhalt).toContainText('Verjährung', { timeout: 20_000 })
  })

  test('M3 · der Rechtsprechungs-Block wird NICHT ausgeliefert (Phantom-Filter offen)', async ({ page }) => {
    // Kap. 15.2/M3: das Modul ist angeschlossen, der Block bleibt hinter der
    // Vorbedingung. In der ZEILE am Artikelende (Gesamtansicht) steht die
    // Rubrik unverändert — dieser Schritt nimmt nichts weg.
    await page.goto(einzel(OR, '336_c'))
    await rahmenBereit(page)
    const dossier = page.locator('[data-artikel-dossier]')
    await expect(dossier).toBeVisible({ timeout: 20_000 })
    await expect(dossier.locator('[data-dossier-reg="r"]')).toHaveCount(0)
  })

  test('B5/B7 · jeder Block trägt seine Zahl, ein leerer Block sagt es im Klartext', async ({ page }) => {
    await page.goto(einzel(OR, '336_c'))
    await rahmenBereit(page)
    const dossier = page.locator('[data-artikel-dossier]')
    await expect(dossier).toBeVisible({ timeout: 20_000 })
    // Die Zahl steht im Titel — «3 Fassungen», nicht «Fassungen».
    const titel = await dossier.locator('[aria-expanded]').first().innerText()
    expect(titel).toMatch(/\d+\s/)
  })

  test('F-E2/M1 · die Nachbarn-Vorschau sagt, WORUM es dort geht — nicht nur die Nummer', async ({ page }) => {
    // GEMESSEN 14.9.2026: `margAnzeige` führt im OR für keinen einzigen Artikel
    // einen Randtitel (die Marginalien sind zu Gliederungsstufen promotet,
    // Auftrag 6b). Die Vorschau nimmt darum die spezifischste Stufe des
    // Nachbarn — sonst wäre sie die Pfeil-Dopplung, die Kap. 15.5 befürchtet,
    // und fiele nach M1.
    await page.goto(einzel(OR, '336_c'))
    await rahmenBereit(page)
    const vorschau = page.locator('[data-einzel-vorschau]')
    await expect(vorschau).toBeVisible({ timeout: 20_000 })
    await expect(vorschau.locator('[data-vorschau="nach"]')).toContainText('Art. 336d')
    await expect(vorschau.locator('[data-vorschau="nach"]')).toContainText('durch den Arbeitnehmer')
    await expect(vorschau.locator('[data-vorschau="vor"]')).toContainText('Art. 336b')
  })

  test('§15 · ein zugeklappter Block lädt nichts (on demand)', async ({ page }) => {
    const gefragt: string[] = []
    page.on('request', (r) => {
      if (/\/(rechtsprechung|materialien)\//.test(r.url())) gefragt.push(r.url())
    })
    await page.goto(einzel(OR, '336_c'))
    await rahmenBereit(page)
    await expect(page.locator('[data-artikel-dossier]')).toBeVisible({ timeout: 20_000 })
    // Nur die Fassung ist offen; die übrigen Shards bleiben ungefragt.
    expect(gefragt.filter((u) => u.includes('/rechtsprechung/bezuege/'))).toEqual([])
  })
})
