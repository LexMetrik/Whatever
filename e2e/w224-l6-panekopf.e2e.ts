// @shard-gruppe: 2
// ═══ L6 · JEDES FENSTER NENNT SEIN DOKUMENT — GENAU EINMAL ══════════════════
//
// Befund L6 (Ästhetik-Review 17.8.2026, offen bis zum Entscheid David 7.9.2026
// «alles wie empfohlen»): «primäres Pane ohne eigenen Namen, Platzhalter
// ‹(aktuelle Adresse)›».
//
// GEMESSEN vor dem Fix (Preview 4423, dist, @1440,
// `/gesetze/bund/OR?p=/gesetze/bund/ZGB`) — der Befund war sogar untertrieben,
// es traf BEIDE Fenster:
//   primär    innerText «⠿ (aktuelle Adresse) ▸ ✕»
//   sekundär  innerText «⠿ ◂ ▸ ⇱ ⧉ ✕»
// Zwei Erlasse nebeneinander, keine der zwei Titelleisten sagt welcher —
// während der Reiterstreifen darüber «OR» und «ZGB» nennt. Ursache ist A-2
// (`layout/PaneKopf.tsx`): meldet die Inhaltsseite `kopfzeileSelbst`, gibt die
// Leiste ihren GANZEN Identitäts-Teil ab, also auch den blossen Namen.
//
// ── WAS DIESE SONDE FESTHÄLT ───────────────────────────────────────────────
// (1) JEDE Pane-Titelleiste nennt ihr Dokument — entweder über den Namen
//     (`[data-pane-name]`, der neue Fall) oder über die Ortsangabe, wenn die
//     Leiste ihren Identitäts-Teil behalten hat.
// (2) NIE über beide zugleich: das ist D4 («jede Angabe genau einmal im
//     Pane-Kopf») und zugleich der Entscheid vom 17.8.2026 («keine
//     Doppelkrume»), den L6 ausdrücklich nicht aufhebt. Eine Leiste mit Namen
//     trägt darum auch KEINE Brotkrümel-Landmark.
// (3) Der Name ist WORTGLEICH mit der Beschriftung des Reiters desselben
//     Fensters — inklusive der Lesestellung (D27): nach dem Scrollen steht in
//     beiden «Art. 9 OR». Das ist die §5-Aussage des Entscheids («dieselbe
//     Quelle wie die Reiter-Beschriftung»), und sie ist nur als Vergleich
//     zweier gerenderter Texte beweisbar, nicht als Code-Lektüre.
// (4) R8: der Name kappt per `truncate`, also trägt er einen `title` mit dem
//     vollen Wortlaut — kein stiller Anschnitt.
//
// ── ROT GEFAHREN (§6.7), 7.9.2026 ──────────────────────────────────────────
// Mutation: in `layout/PaneKopf.tsx` die Zeile `{!zeigeIdentitaet && kurzform}`
// entfernen (= der Stand vor L6).
//   4 failed · 0 passed — alle vier an derselben Wurzel:
//     Locator: '[data-pane-kopf][data-pane-rolle="primaer"] [data-pane-name]'
//     Expected: "OR" · «Error: element(s) not found» (Timeout 10 000 ms)
//   in «@1440 … genau einmal» (Z. 104), «@1440 … Lesestellung inbegriffen»
//   (Z. 127), «@1024 … schmale Spalte» (Z. 146) und «Rechner/Entscheid daneben»
//   (Z. 163). Zurückgenommen; danach 4 passed (28.3 s).
//
// ZWEITE MUTATION, gegen den D4-Teil: in `PaneKopf.tsx` `{!zeigeIdentitaet &&
// kurzform}` zu `{kurzform}` machen — der Name stünde dann NEBEN der Ortsangabe.
//   3 failed · 1 passed (45.4 s) —
//     «… genau einmal»            «primaer: Name UND Brotkrume in einer Leiste»
//                                 (die Leiste trägt beides, solange der lazy
//                                 geladene Leser `kopfzeileSelbst` noch nicht
//                                 gemeldet hat)
//     «Rechner/Entscheid daneben» «zweiter Name neben der Ortsangabe» —
//                                 erwartet "", erhalten "ZPO-Fristen"
//     «… Lesestellung inbegriffen» Muster /^Art\. \S+ OR$/, erhalten "OR"
//   Grün blieb nur «@1024 … schmale Spalte». Zurückgenommen; danach 4 passed.
import { test, expect, type Page } from '@playwright/test'

const SPLIT = '/gesetze/bund/OR?p=/gesetze/bund/ZGB'
/** Der Name des LINKEN Fensters. Rollen-genau statt `.first()`: der Leser wird
 *  lazy geladen und meldet `kopfzeileSelbst` erst beim Mount — bis dahin trägt
 *  die Leiste ihre Ortsangabe, und ein `.first()` fasste je nach Reihenfolge
 *  das falsche Fenster (gemessen 7.9.2026 als Flake im vierten Fall). */
const PRIMAER_NAME = '[data-pane-kopf][data-pane-rolle="primaer"] [data-pane-name]'

interface KopfBefund {
  rolle: string | null
  /** Sichtbarer Text der ganzen Leiste (Griffe inbegriffen). */
  text: string
  /** `[data-pane-name]` — der neue Fall. '' = nicht vorhanden. */
  name: string
  title: string | null
  /** Blatt-Krume der Ortsangabe — der Fall, in dem die Leiste die Identität behielt. */
  ortBlatt: string
  hatKrume: boolean
}

/** Titelleisten und Reiter einer Split-Ansicht, in Fenster-Reihenfolge. */
async function lies(page: Page): Promise<{ koepfe: KopfBefund[]; reiter: string[] }> {
  return page.evaluate(() => {
    const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
    const koepfe = [...document.querySelectorAll('[data-pane-kopf]')].map((k) => {
      const nameEl = k.querySelector('[data-pane-name]')
      const krumen = [...k.querySelectorAll('nav[aria-label^="Brotkr"] button, nav[aria-label^="Brotkr"] a, nav[aria-label^="Brotkr"] > span > span')]
      return {
        rolle: k.getAttribute('data-pane-rolle'),
        text: norm((k as HTMLElement).innerText),
        name: norm(nameEl?.textContent),
        title: nameEl?.getAttribute('title') ?? null,
        ortBlatt: norm(krumen[krumen.length - 1]?.textContent),
        hatKrume: krumen.length > 0,
      }
    })
    // Reiter-Beschriftung OHNE die sr-only-Fensterangabe («(Fenster links)»):
    // verglichen wird der sichtbare Text, den der Anwalt liest.
    const reiter = [...document.querySelectorAll('[data-reiter-schluessel]')].map((e) => {
      const klon = e.querySelector('a')?.cloneNode(true) as HTMLElement | undefined
      klon?.querySelectorAll('.sr-only').forEach((s) => s.remove())
      return norm(klon?.textContent)
    })
    return { koepfe, reiter }
  })
}

/** Der Dokumentname, den eine Leiste trägt — egal auf welchem der zwei Wege. */
function genannt(k: KopfBefund): string {
  return k.name || k.ortBlatt
}

test.describe('L6 — der Pane-Kopf nennt die Kurzform (Entscheid David 7.9.2026)', () => {
  test('@1440 Split: jedes Fenster nennt sein Dokument, genau einmal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(SPLIT)
    await expect(page.locator('[data-pane-kopf]')).toHaveCount(2)
    await expect(page.locator(PRIMAER_NAME)).toHaveText('OR')

    const { koepfe } = await lies(page)
    expect(koepfe.map((k) => k.rolle)).toEqual(['primaer', 'sekundaer'])
    // (1) beide benannt — der gemessene Vorzustand war ['', ''].
    expect(koepfe.map(genannt), 'ein Fenster ohne Namen').toEqual(['OR', 'ZGB'])
    for (const k of koepfe) {
      // (2) D4: der Name steht einmal, nicht neben einer zweiten Ortsangabe.
      expect(k.name && k.hatKrume, `${k.rolle}: Name UND Brotkrume in einer Leiste`).toBeFalsy()
      // …und der Name kommt im sichtbaren Text der Leiste genau einmal vor.
      const nadel = genannt(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      expect((k.text.match(new RegExp(`\\b${nadel}\\b`, 'g')) ?? []).length,
        `${k.rolle} · Leiste «${k.text}»`).toBe(1)
      // (4) R8: gekappt wird nur, was per `title` abrufbar bleibt.
      if (k.name) expect(k.title, `${k.rolle}: Name ohne title`).toBe(k.name)
    }
    // Der Platzhalter, den der Befund benannt hat, ist weg — auch für Screenreader.
    expect(koepfe.map((k) => k.text).join(' ')).not.toContain('aktuelle Adresse')
  })

  test('@1440 Split: der Name ist der Reiter-Text, Lesestellung inbegriffen', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(SPLIT)
    await expect(page.locator(PRIMAER_NAME)).toHaveText('OR')

    // Kaltstand: beide Fenster stehen am Dokumentanfang.
    const kalt = await lies(page)
    expect(kalt.koepfe.map((k) => k.name)).toEqual(kalt.reiter)

    // D27: der Scroll-Spy schiebt die Lesestellung in den Reiter — und die
    // Titelleiste liest DENSELBEN Eintrag, nicht eine eigene Ableitung.
    //
    // GESCROLLT WIRD IN DER SCHLEIFE, nicht einmal (Flake gemessen 7.9.2026,
    // 1 von 2 Läufen unter `--repeat-each=2 --workers=2`: der Name blieb 14
    // Abfragen lang «OR»). Ein einzelnes `wheel` trifft ins Leere, solange der
    // Snapshot des Erlasses noch lädt — die Spalte ist dann kürzer als der
    // Scrollweg, und danach scrollt niemand mehr. Die Schleife wiederholt die
    // GESTE, nicht bloss die Abfrage; sie ist damit unabhängig von der Ladezeit
    // und misst weiterhin genau eines: dass die Stellung im Kopf ankommt.
    await expect.poll(async () => {
      await page.mouse.move(400, 500)
      await page.mouse.wheel(0, 2000)
      return (await page.locator(PRIMAER_NAME).innerText()).replace(/\s+/g, ' ').trim()
    }, { timeout: 30_000, message: 'die Lesestellung erreicht den Pane-Kopf nicht' })
      .toMatch(/^Art\. \S+ OR$/)
    const warm = await lies(page)
    expect(warm.koepfe.map((k) => k.name), 'Kopf und Reiter driften auseinander (§5)')
      .toEqual(warm.reiter)
  })

  test('@1024 Split: der Name hält auch in der schmalen Spalte', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await page.goto(SPLIT)
    await expect(page.locator(PRIMAER_NAME)).toHaveText('OR')
    await expect(page.locator('[data-pane-kopf]')).toHaveCount(2)
    const { koepfe } = await lies(page)
    expect(koepfe.map(genannt)).toEqual(['OR', 'ZGB'])
    for (const k of koepfe) {
      if (k.name) expect(k.title).toBe(k.name)
    }
  })

  test('Rechner/Entscheid daneben: die Leiste mit Ortsangabe bleibt unberührt', async ({ page }) => {
    // Diese Seiten melden KEIN `kopfzeileSelbst`; ihre Leiste behält die
    // Ortsangabe und darf darum keinen zweiten Namen bekommen (D4). Der
    // primäre Erlass-Kopf trägt seinen Namen trotzdem — die Asymmetrie, die
    // L6 gemeldet hat, ist damit in beide Richtungen aufgelöst.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/OR?p=/rechner/zpo-fristen')
    await expect(page.locator('[data-pane-kopf]')).toHaveCount(2)
    await expect(page.locator(PRIMAER_NAME)).toHaveText('OR')
    const { koepfe } = await lies(page)
    expect(koepfe[0].name, 'primärer Erlass-Kopf ohne Namen').toBe('OR')
    expect(koepfe[1].name, 'zweiter Name neben der Ortsangabe').toBe('')
    expect(koepfe[1].hatKrume, 'Ortsangabe verschwunden').toBe(true)
    expect(genannt(koepfe[1])).toBe('Verfahrens- & Rechtsmittelfristen')
  })
})
