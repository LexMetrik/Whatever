// @shard-gruppe: 4
// G6 (W2·5d) — Rechtsgebiets-Sicht als «Gerüst»: die zweite Gliederung quer zum
// Bund-Korpus (Querschnitts-Themen + Auto-Grundgerüst). Prüft Rendern, Deep-Link,
// tolerante Abdeckungs-Angabe, Verzahnung, Rückweg — ohne Console-Fehler/Overflow.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

test.describe('/gesetze — Rechtsgebiets-Sicht (G6)', () => {
  test('Rechtsgebiets-Sicht öffnet Querschnitts-Themen + Grundgerüst, Deep-Link, Rückweg', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/gesetze')
    const main = page.getByRole('main')

    // Y-A (§11.8, David 16.7.2026 Auswahl-Dialog: JA — deklarierte Anpassung des
    // Einstiegs-Pfads): die frühere 4. Landeplatz-Kachel ist zum reinen
    // Gliederungs-Modus demoted; der Zugang lebt im bestehenden A15-Umschalter
    // (Bund-Säule → «Rechtsgebiet»). Alle inhaltlichen Assertions der Sicht
    // bleiben UNVERÄNDERT; die Erreichbarkeits-Pins der Alt-URL
    // (?ansicht=rechtsgebiet — Overflow-Test unten + gesetze-uebersicht-u
    // «G6-Tür bleibt erreichbar») bleiben UNANGEPASST.
    await main.getByRole('button', { name: /Bundesrecht/ }).click()
    await main.getByRole('group', { name: 'Gliederung' }).getByRole('button', { name: 'Rechtsgebiet' }).click()
    // IA-5 (§11.4 Ziff. 2, deklarierte URL-FORM-Anpassung): EIN kanonischer
    // Zustand `?gliederung=rechtsgebiet` (A15-Mechanik) statt `?ansicht=…`.
    await expect(page).toHaveURL(/gliederung=rechtsgebiet/)

    // Beide Ebenen der Sicht sind da: das kuratierte Delta + das Grundgerüst.
    await expect(main.getByRole('heading', { name: 'Querschnitts-Themen' })).toBeVisible()
    await expect(main.getByRole('heading', { name: 'Grundgerüst nach Rechtsgebiet' })).toBeVisible()

    // Ein Thema (Arbeit) rendert mit Entwurf-Marke (§8-Ehrlichkeit).
    const arbeit = main.getByRole('heading', { name: 'Arbeit', level: 3 })
    await expect(arbeit).toBeVisible()

    // Enger Bereich = Deep-Link auf den ersten Artikel (Anker bleibt #art-…, K2/R8).
    const orSpanne = main.getByRole('link', { name: /Art\. 319–362/ }).first()
    await expect(orSpanne).toHaveAttribute('href', /\/gesetze\/bund\/OR#art-319/)

    // Verzahnung: das Thema Arbeit verweist auf einen Rechner + die Rechtsprechung.
    await expect(main.getByRole('link', { name: /Kündigung & Fristen im Arbeitsverhältnis/ }).first())
      .toHaveAttribute('href', /\/rechner\/kuendigung/)
    await expect(main.getByRole('link', { name: /Rechtsprechung · Privatrecht/ }).first())
      .toHaveAttribute('href', /\/rechtsprechung\?rg=privat/)

    // Tolerante Abdeckung (§4.4): ehrlich beziffert, nie «vollständig» behauptet.
    await expect(main.getByText(/einem Querschnitts-Thema\s+zugeordnet/)).toBeVisible()

    // Grundgerüst-Gruppe aufklappen zeigt Erlasse (deckt auch unzugeordnete).
    await main.getByText('Privatrecht', { exact: true }).first().click()
    await expect(main.getByRole('link', { name: /Obligationenrecht/ }).first()).toBeVisible()

    // Rückweg zum Landeplatz. (IA-5, deklarierte URL-FORM-Anpassung: der Zustand
    // liegt jetzt kanonisch in `?ebene=…&gliederung=…` — «zurück» heisst: keine
    // Säule mehr gewählt; die Gliederungs-Wahl bleibt als Deep-Link-Parameter.)
    // DEKLARIERTE ANPASSUNG (R12A/D22, 6.9.2026): der Rückweg heisst «Alle» und
    // ist der erste der vier Ebenen-Text-Schalter — der frühere Extra-Knopf
    // «← Übersicht» neben der Segmented-Control ist entfallen (zwei
    // Bedienelemente für EINE Achse). Zusicherung unverändert: kein `ebene=`
    // mehr in der Adresse, Landeplatz-Kachel «Bundesrecht» wieder sichtbar.
    await main.getByRole('button', { name: 'Alle', exact: true }).click()
    await expect(page).not.toHaveURL(/ebene=/)
    await expect(main.getByRole('button', { name: /Bundesrecht/ })).toBeVisible()

    expect(fehler).toEqual([])
  })

  test('kein horizontaler Overflow bei 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze?ansicht=rechtsgebiet')
    await expect(page.getByRole('heading', { name: 'Querschnitts-Themen' })).toBeVisible()
    const b = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(b.scroll, `scrollWidth ${b.scroll} > ${b.client}`).toBeLessThanOrEqual(b.client + 1)
  })
})
