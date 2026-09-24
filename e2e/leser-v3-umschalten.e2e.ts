// @shard-gruppe: 5
// Ansicht-Menü im Leser: D1 (bedingtes Angebot des Vermerke-Schalters) und
// B3 (aria-controls erst, wenn das Panel wirklich da ist).
//
// GELÖSCHT 21.8.2026 (H5): die Fälle (a), (a2), (b), (c) dieser Datei
// prüften FL-6 «Umschalten V1↔V3 verliert nichts» — den `?leser=v1`-Rückweg
// und den geteilten Options-Store beim Hüllenwechsel. Mit der Ist-Hülle
// fällt der Rückweg selbst; es gibt nichts mehr, wohin man umschalten
// könnte. Verbleiben (a3) und (b2), umbenannt — sie prüften schon vorher
// ausschliesslich V3-eigenes Verhalten, ohne je nach V1 zu wechseln.
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { FUSSNOTEN_WAHL_NAME, SCHALTER_ROLLE, WAHL_ROLLE } from './helpers/leserBeschriftung';

test.describe('Ansicht-Menü — D1/B3', () => {
  // ── D1 (S1-Rest, gebaut im H3-Nachzug 17.8.2026) ──────────────────────────
  // «Änderungsvermerke» wird nur ANGEBOTEN, wenn der Erlass Vermerke trägt.
  // V3 zieht dieselbe Funktion `bieteAenderungsvermerkeSchalter` aus
  // `../berechnungen`, die die frühere Ist-Hülle ebenfalls zog (§5) — Regel,
  // drei Zustände und Korpus-Messung stehen dort und in
  // `src/tests/aenderungsvermerke-schalter.test.ts`.
  test('D1: «Änderungsvermerke» nur bei Erlassen, die Vermerke tragen', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    const panel = page.locator('[data-v3-ansicht-panel]')
    const oeffne = async (pfad: string) => {
      await page.goto(pfad)
      await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
      // Vorbedingung: die Artikel sind da. Sonst prüfte die Sonde den
      // Lade-Zustand, in dem die Funktion bewusst KONSERVATIV anbietet
      // (`erlassGeladen === false`, Herleitung in `../berechnungen`) — und
      // wäre je nach Laufzeit einmal grün und einmal rot.
      await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 })
      await page.locator('[data-v3-ansicht]').click()
      await expect(panel).toBeVisible()
    }

    // ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ─────────────────
    // Die Aussage des Falls ist unverändert («die Historie-Bedienung erscheint
    // NUR an Erlassen, die Vermerke tragen»); ihr Griff ist neu: aus zwei
    // Checkboxen ist EINE Radiogruppe mit drei Stellungen geworden. Die
    // Rechtsprechungs-Checkbox bleibt, was sie war.
    //
    // WAS SICH FACHLICH ÄNDERT — und warum das richtig ist: auf einem Erlass
    // OHNE Klassifikation fällt jetzt die GANZE Wahl weg, nicht nur ihre
    // «Fassung»-Stellung. Bis 7.9. blieb dort der Fussnoten-Schalter stehen,
    // weil er die 16 klassenlosen Fussnoten wirklich ausblendete; genau dieses
    // Ausblenden gibt es nicht mehr (verlustfrei). Drei Stellungen mit
    // identischer Wirkung anzubieten wäre das tote Steuerelement, das D1
    // abgeschafft hat (§8).
    //
    // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ─────────────────
    // Die EINE `menuitemcheckbox` war «Rechtsprechung im Kopf». Sie ist mit
    // Variante A ersatzlos gefallen; an ihrer Stelle stehen die FÜNF Schalter
    // der Rubriken-Wahl. Die Aussage des Falls bleibt Wort für Wort dieselbe —
    // die Historie-Bedienung erscheint nur an Erlassen mit Vermerken, und der
    // Rest des Menüs steht unabhängig davon —, nur die Zahl der Nachbarn
    // wechselt von 1 auf 5. Sie ist bewusst als LITERAL geprüft und nicht aus
    // `FUSS_RUBRIKEN` abgeleitet: ein Wächter, der seine Erwartung aus dem
    // Prüfling zieht, prüft nichts (§6.7).

    // POSITIV — StPO: 187 von 283 Fussnoten sind `kl:'A'`, dazu ein
    // Historie-Shard. Die Wahl steht vollzählig, dazu die eine Checkbox.
    await oeffne('/gesetze/bund/STPO')
    // §6.3-DEKLARATION (S6 W1f, Entscheid David 24.9.2026): die Dreier-Wahl ist
    // EIN Schalter «Fussnoten» (`menuitemcheckbox`, dieselbe Rolle wie
    // SCHALTER_ROLLE), die sechs Rubriken-Schalter sind mit der Funktionszeile
    // gefallen. Aussage unverändert: die Bedienung steht genau dort, wo sie wirkt.
    await expect(panel.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME })).toHaveCount(1)
    // W2·5m (14.9.2026): in der EIGENEN Gruppe gezählt. Seit der Lesart-Wahl
    // (Kap. 15.3) trägt das Menü ZWEI Radiogruppen; eine Zählung über das ganze
    // Panel sprang damit auf 5, ohne dass an dieser Wahl etwas anders wäre.
    // Schärfung, kein Nachgeben — die Zeile misst jetzt, was sie behauptet.
    await expect(panel.locator('[data-v3-vermerke-wahl]').getByRole(WAHL_ROLLE)).toHaveCount(1)
    // §6.3-DEKLARATION (D40, 7.9.2026): SECHS Rubriken-Schalter — «Fassung» ist
    // dazugekommen (David: «und wieso ist fassung nicht auch unten am
    // artikel?»). Die Aussage bleibt: die Wahl steht vollzählig.
    // S6 W1f: die Rubriken-Schalter sind gefallen — genau EIN Schalter im Menü.
    await expect(panel.getByRole(SCHALTER_ROLLE)).toHaveCount(1)

    // ── §6.3-DEKLARATION (W2·26/Z8, Mandat David 11.9.2026) ────────────────
    // BS-640.100 (StG BS) stand hier als NEGATIV-Fall: 16 Fussnoten, KEINE
    // klassifiziert, kein Historie-Shard — die Wahl hätte nichts zu schalten
    // gehabt, also wurde sie nicht angeboten (D1, kein totes Steuerelement).
    // Das war richtig, solange die Wahl nur `kl:'A'` anfasste (§0 Ziff. 2b).
    //
    // SEIT Z8 nimmt «Fassung»/«aus» den Apparat KLASSENBLIND: an genau diesen
    // 16 Fussnoten hat die Wahl jetzt eine Wirkung. Sie MUSS darum angeboten
    // werden — sonst versteckte die Vorgabestellung «Fassung» den Apparat und
    // böte keinen Weg zurück (§8; dieselbe Falle wie der Treuebruch vom
    // 16.8.2026, nur eine Ebene höher). Die AUSSAGE des Falls ist unverändert:
    // die Wahl erscheint genau dort, wo sie etwas bewirkt.
    await oeffne('/gesetze/kanton/BS-640.100')
    await expect(panel.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME })).toHaveCount(1)
    // W2·5m: in der eigenen Gruppe gezählt (s. oben, Zeile 66).
    await expect(panel.locator('[data-v3-vermerke-wahl]').getByRole(WAHL_ROLLE)).toHaveCount(1)
    await expect(panel.getByRole(SCHALTER_ROLLE)).toHaveCount(1)
    // §8: es gibt hier wirklich keine Fassungs-Zeile — die Wahl trägt an diesem
    // Erlass allein über den Apparat, und der folgt ihr vollständig.
    await expect(page.locator('[data-historie-zeile]')).toHaveCount(0)
    await expect(page.locator('.lc-leser [data-fn-apparat]').first()).toBeAttached()
    await expect(page.locator('.lc-leser [data-fn-apparat]').first()).toBeHidden()
    await panel.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME }).click()
    await expect(page.locator('.lc-leser [data-fn-apparat]').first()).toBeVisible()

    // NEGATIV 2 — ZH-211.11: gar KEIN Struktur-Sidecar (404 → `null`). Der
    // zweideutige `null`-Fall, an dem eine naive Fassung scheitert: bei
    // geladenem Erlass heisst kein Sidecar «keine Fussnoten, also auch keine
    // Vermerke». Er zählt Paragraphen, nicht Artikel — darum eigener Anker.
    await page.goto('/gesetze/kanton/ZH-211.11')
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('.lc-leser article').first()).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-ansicht]').click()
    await expect(panel).toBeVisible()
    // W2·5m: die Aussage ist «die ÄNDERUNGS-Wahl wird hier nicht angeboten» —
    // gemessen an ihrer Gruppe. Die Lesart-Wahl (Kap. 15.3) steht unabhängig
    // davon immer, sie hängt an keinem Erlass-Merkmal; über das ganze Panel
    // gezählt läse die Zeile sonst «keine Radiogruppe», was nie gemeint war.
    await expect(panel.locator('[data-v3-vermerke-wahl]').getByRole(WAHL_ROLLE)).toHaveCount(0)
    // S6 W1f: ohne Fussnoten-Schalter steht kein einziger Schalter mehr im Menü.
    await expect(panel.getByRole(SCHALTER_ROLLE)).toHaveCount(0)

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('B3: Ansicht-Öffner trägt `aria-controls` erst, wenn das Panel wirklich da ist', async ({ page }) => {
    // Bug-Check 16.8.2026: der Öffner trug `aria-controls` auch im Ruhezustand,
    // in dem das Panel gar nicht gerendert wird — eine Id-Referenz ins Leere
    // (axe `aria-valid-attr-value`; ein Screenreader bietet einen Sprung an,
    // der nirgends landet, §8). Geprüft wird der VERTRAG in beiden Zuständen,
    // nicht nur die Abwesenheit des Attributs: im offenen Zustand muss die
    // referenzierte Id auch wirklich existieren, sonst wäre «weg damit» ein
    // Fix, der die Verbindung ganz zerstört.
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/BGFA')
    await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })

    const oeffner = page.locator('[data-v3-ansicht]')
    await expect(oeffner).toHaveAttribute('aria-expanded', 'false')
    await expect(oeffner).not.toHaveAttribute('aria-controls', /./)

    await oeffner.click()
    await expect(page.locator('[data-v3-ansicht-panel]')).toBeVisible()
    await expect(oeffner).toHaveAttribute('aria-expanded', 'true')
    const ziel = await oeffner.getAttribute('aria-controls')
    expect(ziel, 'offen ohne aria-controls — die Verbindung fehlt ganz').toBeTruthy()
    await expect(
      page.locator(`[id="${ziel}"]`),
      `aria-controls zeigt auf «${ziel}» — kein solches Element im DOM`,
    ).toHaveCount(1)

    expect(fehler).toEqual([])
  })
})
