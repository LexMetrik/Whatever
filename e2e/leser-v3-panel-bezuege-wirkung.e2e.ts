// @shard-gruppe: 6
// ─── §7b-Deckungslücke geschlossen (21.8.2026, Kontaktbogen H4 §7b Pos. 2) ───
//
// Deckt die WIRKUNG von `BezugFacettenWahl`/`BezugZeitWahl` AM V3-PANEL —
// `bezuege-facetten-b4.e2e.ts` und `bezuege-zeitstrahl-b5.e2e.ts` prüfen
// dieselben, UNVERÄNDERTEN geteilten Bausteine (§5) nur am alten Montagepunkt
// (Kopf-Dropdown «Rechtsprechung ▾»). Diese Datei stellt dieselbe Zusicherung
// für den neuen Montagepunkt her (`PanelFilterZeile`, hinter den Klappen
// «Instanzen»/«Zeitraum»), damit H5 die Ist-Hüllen-Dateien löschen darf.
//
// WAS NICHT PORTIERT WIRD, UND WARUM (deklarierte Abweichung, keine neue
// Entscheidung — der Befund steht bereits datiert im Code):
//   `PanelEntscheide.tsx` (H3, Kommentar dort) verzichtet BEWUSST auf die
//   Portionierung der Ist-Hülle («KEINE Portionierung, kein ‹weitere 5›: die
//   Liste im Panel darf senkrecht wachsen, das Panel scrollt ohnehin»). Die
//   V1-Zähler-Formulierung «5 von 16» / «weitere laden» hat damit am Panel
//   KEIN Gegenstück — sie mass eine Kappung, die V3 architektonisch nicht hat.
//   Was bleibt und hier geprüft wird: dass die Instanz-/Kanton-/Zeit-Wahl die
//   ANGEZEIGTE Liste korrekt schneidet, dass der Kanton-Feinschnitt die
//   Bundes-Kanten nicht mitlöscht, dass die Wahl einen Neuladen übersteht, und
//   dass die einmalige Alt-Stufen-Migration («5 J.» → Von-Datum) unabhängig
//   von der Hülle greift (der Store `lm.leser.optionen` ist hüllenneutral).
//
// Träger: StPO Art. 5 (wie B4/B5) — 16 Leitentscheide (seit D2/E-1: 8, siehe unten), Shard verifiziert
// 29.7.2026 nach B7 (Kopf von `bezuege-facetten-b4.e2e.ts`).
//
// §6.3-DEKLARATION (S6-W1b, Entscheid David 23.9.2026 — fachliche Änderung,
// kein Refactoring): (1) Der Grundzustand ist seither ALLE Instanzen, nicht nur
// BGE — ein Klick auf «kantonal» schaltet also AB, und «alles aus» heisst vier
// Klicks. (2) Der Absatz «WAS NICHT PORTIERT WIRD» oben ist mit S6-W1b
// überholt: das Blatt portioniert wieder (je Gruppe fünf, dann «weitere N»).
// Die gerenderten Zeilen sind darum nicht mehr die Grundmenge; gezählt wird
// die GRUPPEN-Zahl (`data-v3-panel-gruppe-zahl`, dieselbe Zahl wie am
// Gruppenkopf). Der geprüfte Sachverhalt — die Wahl schneidet die Menge
// korrekt — bleibt unverändert, gemessen an der BGE-Gruppe mit denselben
// Erwartungswerten (16 / 5 / 3 / 2).
//
// §6.3-DEKLARATION (W2·29-WERKBANK-LESER D2/E-1, 25.9.2026 — fachliche
// Änderung, kein Refactoring): acht der 16 BGE nennen Art. 5 StPO nur in einer
// nicht publizierten Erwägung ihres Volltext-Urteils; die Kante zeigt seither
// aufs Urteil (Klasse bger). Die BGE-Gruppe zählt darum 8 statt 16
// (Vorbefund `bezuege-zeile-b4.test.tsx`: bge 8, bger 10). Die acht Daten
// (Shard `public/rechtsprechung/bezuege/STPO.json`, gemessen 25.9.2026):
// 2020-03-23, 2020-07-06, 2020-10-14, 2021-04-27, 2022-09-09, 2023-02-17,
// 2024-04-25, 2024-09-04. Die alten Grenzen trügen nicht mehr (ab 2024 und
// «nur 2024» ergäben beide 2 — «bis grenzt weiter ein» wäre unprüfbar; ab
// 2025 ergäbe 0 und die Gruppe verschwände). Neue Grenzen mit derselben
// Zählkette: ab 2021-01-01 → 5, bis 2023-12-31 → 3, ab 2024-01-01 → 2.
import { test, expect, type Page } from '@playwright/test'
import { panelAufziehen } from './helpers/panelOeffnen'
import { rohShard, sollImFenster, sollKanten } from '../src/tests/korpusSoll.helfer'

// §6.3-DEKLARATION (QS-KORPUS Einheit P «Zahl-Pins korpusrelativ», 25.9.2026):
// die Zählkette 8 / 5 / 3 / 2 stand fest im Test und riss mit jedem neuen BGE
// zu Art. 5 StPO (Messbericht urteils-automatik 25.9.2026, Teil A §1). Seither
// wird sie aus den Daten des rohen Shards gezählt (korpusSoll.helfer, ohne
// src/lib — der Zeitfilter der App wird geprüft, nicht nachgebaut; die Grenzen
// sind Jahresgrenzen, dort decken sich Tages- und Bandjahr-Vergleich). Die
// Aussage «von schneidet, bis grenzt WEITER ein» hängt an einer echten
// Abstufung; die steht als Invariante: 0 < bis-Fenster < von-Fenster < alle.
// Das geschlossene Fenster 2021–2023 ist gegen neue Bände ohnehin immun.
const BGE_DATEN = sollKanten(rohShard('STPO'), '5', 'bge').map((k) => k.datum)
const SOLL = {
  alle: BGE_DATEN.length,
  ab2021: sollImFenster(BGE_DATEN, '2021-01-01', ''),
  fenster2021bis2023: sollImFenster(BGE_DATEN, '2021-01-01', '2023-12-31'),
  ab2024: sollImFenster(BGE_DATEN, '2024-01-01', ''),
}

const STPO = '/gesetze/bund/STPO#art-5'

async function panelMitFilterOeffnen(page: Page): Promise<void> {
  await page.goto(STPO)
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await panelAufziehen(page)
  await expect(page.locator('#art-5')).toBeAttached()
}

function panel(page: Page) {
  return page.locator('[data-v3-panel]').first()
}

async function instanzenKlappeOeffnen(page: Page): Promise<void> {
  const klappen = panel(page).locator('[data-v3-panel-klappe]')
  const offen = panel(page).locator('[data-v3-panel-klappe-inhalt]')
  if (await offen.count() > 0) return
  await klappen.first().click()
}

async function zeitKlappeOeffnen(page: Page): Promise<void> {
  const offen = panel(page).locator('[data-v3-panel-klappe-inhalt]')
  if (await offen.count() > 0) {
    // Eine Klappe ist bereits offen (Instanzen) — schliessen, dann Zeit öffnen.
    await panel(page).locator('[data-v3-panel-klappe]').first().click()
  }
  await panel(page).locator('[data-v3-panel-klappe]').nth(1).click()
}

function entscheide(page: Page) {
  return panel(page).locator('[data-v3-panel-entscheid]')
}

/** Grundmenge der BGE-Gruppe (S6-W1b: die Zeilen sind portioniert). */
function bgeZahl(page: Page) {
  return panel(page).locator('[data-v3-panel-gruppe="bge"]')
}
async function erwarteBge(page: Page, n: number): Promise<void> {
  await expect(bgeZahl(page)).toHaveAttribute('data-v3-panel-gruppe-zahl', String(n), { timeout: 20_000 })
}

test.describe('V3-Panel · Bezüge-Facetten/Zeit — WIRKUNG (§7b Pos. 2)', () => {
  test('VORBEDINGUNG: die Zählkette an Art. 5 StPO ist echt abgestuft', () => {
    expect(SOLL.fenster2021bis2023, JSON.stringify(SOLL)).toBeGreaterThan(0)
    expect(SOLL.fenster2021bis2023, JSON.stringify(SOLL)).toBeLessThan(SOLL.ab2021)
    expect(SOLL.ab2021, JSON.stringify(SOLL)).toBeLessThan(SOLL.alle)
    expect(SOLL.ab2024, JSON.stringify(SOLL)).toBeGreaterThan(0)
    expect(SOLL.ab2024, JSON.stringify(SOLL)).toBeLessThan(SOLL.alle)
  })

  test('Kanton-Schnitt löscht die Bundes-Kanten nicht', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await instanzenKlappeOeffnen(page)
    // S6-W1b: «kantonal» ist im Grundzustand AN — der Feinschnitt steht ohne Klick.
    await expect(panel(page).locator('[data-bezug-klasse="kantonal"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(panel(page).locator('[data-bezug-kanton]').first()).toBeVisible({ timeout: 20_000 })
    await panel(page).locator('[data-bezug-kanton="BS"]').click()
    // Der teure Denkfehler (wie B4): BGer-Kanten tragen kanton='CH' und fielen
    // aus einer naiven Kantons-Auswahl heraus. Beide Gruppen bleiben da (die
    // kantonale heisst seit S6-W1b nach ihrem Gericht, darum am Hook geprüft).
    await expect(panel(page)).toContainText('Leitentscheide')
    await expect(panel(page).locator('[data-v3-panel-gruppe="kantonal"]').first()).toBeVisible({ timeout: 20_000 })
    await expect(entscheide(page).first()).toBeVisible({ timeout: 20_000 })
  })

  test('Instanz-Wahl übersteht einen Neuladen (Persistenz, hüllenneutraler Store)', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await instanzenKlappeOeffnen(page)
    // S6-W1b: der Klick schaltet «kantonal» AB (Grundzustand: alle an).
    await panel(page).locator('[data-bezug-klasse="kantonal"]').click()
    await expect(panel(page).locator('[data-bezug-kanton]')).toHaveCount(0)
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    await instanzenKlappeOeffnen(page)
    await expect(panel(page).locator('[data-bezug-klasse="kantonal"]')).toHaveAttribute('aria-pressed', 'false')
    await expect(panel(page).locator('[data-bezug-klasse="bge"]')).toHaveAttribute('aria-pressed', 'true')
  })

  test('alle Facetten aus ⇒ keine Entscheide-Liste im Panel', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await expect(entscheide(page).first()).toBeVisible({ timeout: 20_000 })
    await instanzenKlappeOeffnen(page)
    // S6-W1b: «alles aus» heisst alle vier Klassen abwählen.
    for (const k of ['bge', 'bger', 'eidg', 'kantonal']) {
      await panel(page).locator(`[data-bezug-klasse="${k}"]`).click()
    }
    await expect(page.locator('[data-v3-panel-lage="bedienung"]')).toBeVisible({ timeout: 20_000 })
    await expect(entscheide(page)).toHaveCount(0)
  })

  test('Datumsfeld «von» schneidet die Liste, «bis» grenzt weiter ein', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await erwarteBge(page, SOLL.alle)
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="von"]').fill('2021-01-01')
    // Damals (D2/E-1): 5 der 8 Leitentscheide zu Art. 5 von 2021 oder jünger.
    await erwarteBge(page, SOLL.ab2021)
    await panel(page).locator('[data-zeit-feld="bis"]').fill('2023-12-31')
    await erwarteBge(page, SOLL.fenster2021bis2023)
  })

  test('verdrehte Eingabe wird getauscht, nicht als leere Menge gedeutet', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="bis"]').fill('2021-01-01')
    await panel(page).locator('[data-zeit-feld="von"]').fill('2023-12-31')
    await erwarteBge(page, SOLL.fenster2021bis2023)
  })

  test('Zurücksetzen hebt den Zeitraum auf', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="von"]').fill('2024-01-01')
    await erwarteBge(page, SOLL.ab2024)
    await page.getByTitle('Zeitraum aufheben — wieder alle Entscheide zeigen').click()
    await erwarteBge(page, SOLL.alle)
    await expect(panel(page).locator('[data-zeit-feld="von"]')).toHaveValue('')
  })

  test('der Zeitraum übersteht einen Neuladen', async ({ page }) => {
    await panelMitFilterOeffnen(page)
    await zeitKlappeOeffnen(page)
    await panel(page).locator('[data-zeit-feld="von"]').fill('2021-01-01')
    await erwarteBge(page, SOLL.ab2021)
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    await erwarteBge(page, SOLL.ab2021)
    await zeitKlappeOeffnen(page)
    await expect(panel(page).locator('[data-zeit-feld="von"]')).toHaveValue('2021-01-01')
  })

  test('MIGRATION: eine gespeicherte Alt-Stufe «5 J.» wird EINMALIG zum Von-Datum', async ({ page }) => {
    // Derselbe hüllenneutrale Store (`lm.leser.optionen`) wie B5 — die
    // Migration lebt ausserhalb der Hülle und muss darum auch unter V3 greifen.
    await page.goto(STPO)
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.evaluate(() => {
      localStorage.setItem('lm.leser.optionen', JSON.stringify({
        fussnoten: 'an', verweise: 'an', leitfaelle: 'an',
        zeitraum: '5', hist: 'fussnoten',
      }))
    })
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    const stand = await page.evaluate(() => JSON.parse(localStorage.getItem('lm.leser.optionen') ?? '{}'))
    expect(stand.zeitraum).toBeUndefined()
    expect(stand.bezugBis).toBe('')
    const erwartet = await page.evaluate(() => {
      const h = new Date()
      const j = h.getUTCFullYear() - 5
      const rest = h.toISOString().slice(4, 10)
      const schalt = (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0
      return `${j}${rest === '-02-29' && !schalt ? '-02-28' : rest}`
    })
    expect(stand.bezugVon).toBe(erwartet)
  })

  test('MIGRATION: «alle» bleibt offen — keine erfundene Einschränkung', async ({ page }) => {
    await page.goto(STPO)
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await page.evaluate(() => {
      localStorage.setItem('lm.leser.optionen', JSON.stringify({
        fussnoten: 'an', verweise: 'an', leitfaelle: 'an',
        zeitraum: 'alle', hist: 'fussnoten',
      }))
    })
    await page.reload()
    await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
    await panelAufziehen(page)
    await erwarteBge(page, SOLL.alle)
    await zeitKlappeOeffnen(page)
    await expect(panel(page).locator('[data-zeit-feld="von"]')).toHaveValue('')
    await expect(page.getByTitle('Zeitraum aufheben — wieder alle Entscheide zeigen')).toHaveCount(0)
  })
})
