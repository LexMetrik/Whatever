// @shard-gruppe: 2
// ═══ D16/D15 · REITER UMORDNEN, ÜBER ALLE ARTEN HINWEG ══════════════════════
//
// GEMESSENER ANLASS (David 6.9.2026, Dev-Server d284a1fd8): «per drag and drop
// soll man register verschieben können … in der reiter liste, analog browser» —
// und: «es geht nur wenn nur gesetze offen sind — bug». Nachgestellt am
// 6.9.2026 über acht Kombinationen (Repro-Skript `d16-repro.mjs`): mit
// gemischten Reitern (Gesetz + Entscheid/Rechner/Vorlage) blieb die sichtbare
// Reihenfolge stehen, obwohl der Speicher sich änderte.
//
// URSACHE (Diagnose 6.9.2026): `layout/Reiterleiste.tsx` baute die sichtbare
// `ordnung` aus dem Speicher NEU auf — gebündelt nach `KAT_ORDER` und innerhalb
// «gesetze» nach `HERKUNFT_ORDER`. `lib/tabs.ordneTabsUm` verschiebt aber den
// FLACHEN Speicher; jede Verschiebung über eine Kategoriegrenze hinweg wurde
// vom Bucketing sofort wieder eingesammelt und war nie zu sehen.
//
// ENTSCHEID: die Arbeitsleiste zeigt die reine SPEICHERREIHENFOLGE (analog
// Browser — man ordnet, was man sieht). Die Gruppierung nach Art bleibt dort,
// wo sie eine Liste ordnet und niemand zieht: im Überlauf-Blatt (`TabPanel`).
//
// ROT ZU BEKOMMEN (§6.7 — einmal gefahren, 6.9.2026 gegen `f4ea09ff1`): in
// `layout/Reiterleiste.tsx` die `ordnung` wieder über `KAT_ORDER`/
// `HERKUNFT_ORDER` bündeln ⇒ die sieben art-gemischten Fälle unten werden rot,
// der reine Gesetze-Fall bleibt grün (genau Davids Beobachtung).
import { test, expect, type Page } from '@playwright/test'

/** Reiter-Pfade der vier Arten. Alle gegen den committeten Korpus geprüft
 *  (dieselben, mit denen der Befund reproduziert wurde). */
const G1 = '/gesetze/bund/OR#art-336_c'
const G2 = '/gesetze/bund/ZGB#art-1'
const E1 = '/rechtsprechung/bs_appellationsgericht_BEZ.2022.42'
const R1 = '/rechner/tagerechner'
const V1 = '/vorlagen/arbeitsvertrag'

/** Reiter-Identität, wie `lib/tabs.tabSchluessel` sie bildet (ohne #Anker). */
const schluessel = (p: string) => p.split('#')[0].split('?')[0]

// Startroute BEWUSST ohne eigenen Reiter (`lib/tabs.istReiterPfad` ist für
// /kontakt falsch): sonst legte der TabTracker beim Laden einen zusätzlichen
// Reiter an und verfälschte jede Reihenfolge-Messung.
// ── DEKLARIERTE SONDEN-ÄNDERUNG (§6.3) · R14b, 7.9.2026 ─────────────────────
// `/kontakt` war die Startroute, WEIL sie keinen Reiter trug. Seit R14b trägt
// JEDE Route einen (`lib/tabs.ts`, Block «R14b»; `istReiterPfad` ist ersatzlos
// gestrichen) — der Seed landet darum auf dem ZULETZT geseedeten Reiter statt
// auf einer reiterlosen Meta-Route. Damit bleibt die Reiterzahl exakt die
// geseedete, und keine Zählung dieser Datei verschiebt sich. `/kontakt` bleibt
// nur noch der Ort, an dem der Speicher überhaupt erreichbar ist (localStorage
// braucht eine geladene Herkunft), bevor er überschrieben wird.
const START = '/kontakt'

async function setzeReiter(page: Page, pfade: string[]): Promise<void> {
  await page.goto(START)
  await page.evaluate((p) => localStorage.setItem('lexmetrik-tabs',
    JSON.stringify(p.map((path) => ({ path })))), pfade)
  // R14b: statt `page.reload()` (das auf /kontakt einen zusätzlichen Reiter
  // anlegte) auf den letzten geseedeten Reiter — Dublette, also keine Änderung
  // an Zahl und Reihenfolge.
  await page.goto(pfade[pfade.length - 1] ?? '/')
  await expect(page.locator('[data-reiter-streifen] [data-reiter-schluessel]').first())
    .toBeVisible({ timeout: 20_000 })
}

/** Sichtbare Reihenfolge der Arbeitsleiste — das, was David sieht. */
const sichtbareOrdnung = (page: Page) => page.$$eval(
  '[data-reiter-streifen] [data-reiter-schluessel]',
  (els) => els.map((e) => e.getAttribute('data-reiter-schluessel')!))

/** Gespeicherte Reihenfolge — das, was den Neustart überlebt. */
const gespeicherteOrdnung = (page: Page) => page.evaluate(() =>
  (JSON.parse(localStorage.getItem('lexmetrik-tabs') ?? '[]') as { path: string }[])
    .map((t) => t.path.split('#')[0].split('?')[0]))

/**
 * Ein vollständiger HTML5-Ziehvorgang zwischen zwei Reitern, synthetisch.
 *
 * Playwrights `dragTo`/Maus erzeugt in Chromium KEINE nativen HTML5-DnD-Events
 * (dragstart/dragover/drop) — das ist eine bekannte Grenze des Protokolls, kein
 * Mangel der App. Gefahren wird darum die Ereignisfolge selbst, mit EINEM
 * `DataTransfer` über alle Schritte (so wie der Browser es tut) und mit einem
 * `clientX`, das in die linke bzw. rechte Hälfte des Ziels fällt — daraus liest
 * die Leiste, ob DAVOR oder DAHINTER eingefügt wird.
 */
async function ziehe(page: Page, von: string, nach: string, davor: boolean): Promise<void> {
  await page.evaluate(([vonK, nachK, links]) => {
    const el = (k: string) => document.querySelector<HTMLElement>(
      `[data-reiter-streifen] [data-reiter-schluessel="${k}"]`)!
    const q = el(vonK); const z = el(nachK)
    const r = z.getBoundingClientRect()
    const x = Math.round(links ? r.left + r.width * 0.25 : r.left + r.width * 0.75)
    const y = Math.round(r.top + r.height / 2)
    const dt = new DataTransfer()
    const feuer = (ziel: HTMLElement, typ: string) => ziel.dispatchEvent(
      new DragEvent(typ, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }))
    feuer(q, 'dragstart')
    feuer(z, 'dragenter')
    feuer(z, 'dragover')
    feuer(z, 'drop')
    feuer(q, 'dragend')
  }, [schluessel(von), schluessel(nach), davor] as [string, string, boolean])
  // Der Schreibweg ist synchron (localStorage + TABS_EVENT); der Re-Render
  // braucht einen Tick.
  await page.waitForTimeout(150)
}

test.describe('D16 · Reiter lassen sich über ALLE Arten hinweg umordnen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  // Die acht Kombinationen des Repro-Skripts. Gezogen wird jeweils der LETZTE
  // Reiter auf die linke Hälfte des ERSTEN — er muss danach vorne stehen.
  const FAELLE: { name: string; tabs: string[] }[] = [
    { name: 'G→G (nur Gesetze — der EINE Fall, der schon ging)', tabs: [G1, G2] },
    { name: 'E→G (Entscheid vor Gesetz)', tabs: [G1, E1] },
    { name: 'G→E (Gesetz vor Entscheid)', tabs: [E1, G1] },
    { name: 'R→G (Rechner vor Gesetz)', tabs: [G1, R1] },
    { name: 'G→R (Gesetz vor Rechner)', tabs: [R1, G1] },
    { name: 'R→E (Rechner vor Entscheid)', tabs: [E1, R1] },
    { name: 'V→G (Vorlage vor Gesetz)', tabs: [G1, V1] },
  ]

  for (const f of FAELLE) {
    test(`${f.name}: der letzte Reiter landet vorn — sichtbar UND gespeichert`, async ({ page }) => {
      await setzeReiter(page, f.tabs)
      const vorher = f.tabs.map(schluessel)
      expect(await sichtbareOrdnung(page), 'Ausgangsordnung = Speicherordnung').toEqual(vorher)

      await ziehe(page, f.tabs[f.tabs.length - 1], f.tabs[0], true)

      const erwartet = [vorher[vorher.length - 1], ...vorher.slice(0, -1)]
      expect(await sichtbareOrdnung(page), 'die SICHTBARE Reihenfolge folgt dem Zug').toEqual(erwartet)
      expect(await gespeicherteOrdnung(page), 'und sie überlebt (Persistenz)').toEqual(erwartet)
    })
  }

  // Achter Fall: alle vier Arten zugleich, und der Zug geht nach HINTEN (rechte
  // Hälfte des Ziels) — die zweite Richtung, die das Zeiger-X entscheidet.
  test('gemischt G/E/R/V: der erste Reiter lässt sich ans Ende ziehen', async ({ page }) => {
    const tabs = [G1, E1, R1, V1]
    await setzeReiter(page, tabs)
    await ziehe(page, G1, V1, false)
    const erwartet = [schluessel(E1), schluessel(R1), schluessel(V1), schluessel(G1)]
    expect(await sichtbareOrdnung(page)).toEqual(erwartet)
    expect(await gespeicherteOrdnung(page)).toEqual(erwartet)
  })

  // ── D15 · DIE AFFORDANZ (David: «analog browser») ─────────────────────────
  // ROT ZU BEKOMMEN: `cursor-grab` an der Reiter-Hülle streichen bzw. die
  // Einfügemarke (`[data-reiter-marke]`) nicht rendern.
  test('D15 · Zeiger zeigt «greifbar», und die Einfügemarke steht auf der Zeigerseite', async ({ page }) => {
    const tabs = [G1, E1, R1]
    await setzeReiter(page, tabs)
    const erster = page.locator(`[data-reiter-schluessel="${schluessel(G1)}"]`)
    expect(await erster.evaluate((el) => getComputedStyle(el).cursor)).toBe('grab')

    // Ziehen beginnen und über der RECHTEN Hälfte des dritten Reiters stehen
    // bleiben (kein Drop) — die Marke muss dort rechts erscheinen.
    await page.evaluate(([vonK, nachK]) => {
      const el = (k: string) => document.querySelector<HTMLElement>(`[data-reiter-schluessel="${k}"]`)!
      const q = el(vonK); const z = el(nachK)
      const r = z.getBoundingClientRect()
      const dt = new DataTransfer()
      const feuer = (ziel: HTMLElement, typ: string) => ziel.dispatchEvent(new DragEvent(typ, {
        bubbles: true, cancelable: true, dataTransfer: dt,
        clientX: Math.round(r.left + r.width * 0.8), clientY: Math.round(r.top + r.height / 2),
      }))
      feuer(q, 'dragstart'); feuer(z, 'dragenter'); feuer(z, 'dragover')
    }, [schluessel(G1), schluessel(R1)] as [string, string])
    const marke = page.locator(`[data-reiter-schluessel="${schluessel(R1)}"] [data-reiter-marke]`)
    await expect(marke).toHaveCount(1)
    expect(await marke.getAttribute('data-reiter-marke')).toBe('dahinter')
  })

  // ── D15 · TASTATUR ────────────────────────────────────────────────────────
  // ROT ZU BEKOMMEN: den Alt+Shift-Zweig in `Reiterleiste.tsx` streichen.
  test('D15 · Alt+Shift+←/→ verschiebt den aktiven Reiter', async ({ page }) => {
    // Der aktive Reiter ist der, dessen Adresse gerade offen ist.
    await page.goto(START)
    await page.evaluate(([a, b, c]) => localStorage.setItem('lexmetrik-tabs',
      JSON.stringify([a, b, c].map((path) => ({ path })))), [G1, E1, R1] as [string, string, string])
    await page.goto(R1)
    await expect(page.locator(`[data-reiter-schluessel="${schluessel(R1)}"][data-reiter-aktiv="true"]`))
      .toBeVisible({ timeout: 20_000 })

    await page.keyboard.press('Alt+Shift+ArrowLeft')
    await page.waitForTimeout(150)
    expect(await sichtbareOrdnung(page))
      .toEqual([schluessel(G1), schluessel(R1), schluessel(E1)])

    await page.keyboard.press('Alt+Shift+ArrowLeft')
    await page.waitForTimeout(150)
    expect(await sichtbareOrdnung(page))
      .toEqual([schluessel(R1), schluessel(G1), schluessel(E1)])

    // Am linken Rand passiert nichts (kein Umlauf — der Reiter fiele sonst
    // unbemerkt ans andere Ende).
    await page.keyboard.press('Alt+Shift+ArrowLeft')
    await page.waitForTimeout(150)
    expect(await sichtbareOrdnung(page))
      .toEqual([schluessel(R1), schluessel(G1), schluessel(E1)])

    await page.keyboard.press('Alt+Shift+ArrowRight')
    await page.waitForTimeout(150)
    expect(await sichtbareOrdnung(page))
      .toEqual([schluessel(G1), schluessel(R1), schluessel(E1)])
  })
})

// ═══ W2·18 WELLE 3 PUNKT 2 · UMORDNEN ÜBER DIE FENSTERGRENZE HINAUS ═════════
//
// SPEC-KORREKTUR VORWEG (Fahrplan §4.R3 Punkt 2, datiert 13.9.2026): der
// Fahrplan verlangte «beim Ziehen an den Rand scrollt der Streifen automatisch
// (~8 px je Frame)». GEMESSEN auf DIESEM Stand (gebautes dist/, Chromium,
// 15 Reiter, aktiv Nr. 12): der Streifen SCROLLT NIE —
//   @1024  scrollWidth 859 == clientWidth 859, Fenster 4/8/15
//   @1440  scrollWidth 1275 == clientWidth 1275, Fenster 0/12/15
//   @390   scrollWidth 241 == clientWidth 241, Fenster 11/1/15
// Seit R13-2 ist der Überlauf kein Scrollen mehr, sondern ein FENSTER: was
// nicht nebeneinander passt, steht im «+N»-Blatt. Ein Auto-Scroll wäre damit
// eine Mechanik, die nicht feuern kann (§6.7, §17-Gegengewicht).
// GEBAUT ist darum das, was an dieser Stelle dieselbe Aufgabe löst: am Rand
// SCHIEBT der gezogene Reiter sich selbst durch die Speicherordnung, einen
// Platz je Takt — er wandert also über die Fenstergrenze hinaus, und das
// Fenster folgt ihm (R13-3). Ohne Bewegung, ohne Animation; `reduced motion`
// hat hier nichts zu beruhigen.
test.describe('W2·18 Welle 3 Punkt 2 — der gezogene Reiter kommt über die Fenstergrenze', () => {
  const FUENFZEHN = ['/gesetze/bund/OR', '/gesetze/bund/ZGB', '/gesetze/bund/ZPO',
    '/gesetze/bund/STGB', '/gesetze/bund/SCHKG', '/gesetze/bund/BV', '/gesetze/bund/DSG',
    '/gesetze/bund/ARG', '/gesetze/bund/URG', '/gesetze/bund/STPO', '/gesetze/bund/BGG',
    '/gesetze/bund/VWVG', '/gesetze/bund/IPRG', '/gesetze/bund/KKG', '/gesetze/bund/KVG']

  /** Ziehen beginnen und am linken bzw. rechten Rand des Streifens STEHEN
   *  BLEIBEN — kein Drop. Der Takt läuft danach von selbst weiter, genau wie
   *  beim ruhenden Zeiger im Browser. */
  async function haltAmRand(page: Page, von: string, links: boolean): Promise<void> {
    await page.evaluate(([vonK, l]) => {
      const s = document.querySelector<HTMLElement>('[data-reiter-streifen]')!
      const q = document.querySelector<HTMLElement>(
        `[data-reiter-streifen] [data-reiter-schluessel="${vonK}"]`)!
      const r = s.getBoundingClientRect()
      const x = Math.round(l ? r.left + 4 : r.right - 4)
      const y = Math.round(r.top + r.height / 2)
      const dt = new DataTransfer()
      const feuer = (ziel: HTMLElement, typ: string) => ziel.dispatchEvent(
        new DragEvent(typ, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }))
      feuer(q, 'dragstart')
      feuer(s, 'dragover')
    }, [schluessel(von), links] as [string, boolean])
  }

  test('@1024: Reiter 12 wandert am linken Rand bis auf Platz 1', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await setzeReiter(page, FUENFZEHN)
    await page.goto(FUENFZEHN[11])
    await expect(page.locator(`[data-reiter-schluessel="${FUENFZEHN[11]}"][data-reiter-aktiv="true"]`))
      .toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(1200)
    // Ausgangslage: Reiter 12 steht NICHT am Anfang, und der erste Reiter ist
    // gar nicht im Bild — genau die Fenstergrenze, um die es geht.
    expect((await gespeicherteOrdnung(page)).indexOf(FUENFZEHN[11])).toBe(11)
    expect(await sichtbareOrdnung(page)).not.toContain(FUENFZEHN[0])

    await haltAmRand(page, FUENFZEHN[11], true)
    await expect.poll(async () => (await gespeicherteOrdnung(page)).indexOf(FUENFZEHN[11]),
      { timeout: 15_000, message: 'der gezogene Reiter muss bis auf Platz 1 wandern' }).toBe(0)

    // Die übrigen vierzehn behalten ihre Reihenfolge — geschoben wird EINER.
    const rest = (await gespeicherteOrdnung(page)).slice(1)
    expect(rest).toEqual(FUENFZEHN.filter((p) => p !== FUENFZEHN[11]))
  })

  test('@1024: am rechten Rand wandert er ans Ende — und der Takt hält am Anschlag', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await setzeReiter(page, FUENFZEHN)
    await page.goto(FUENFZEHN[11])
    await expect(page.locator(`[data-reiter-schluessel="${FUENFZEHN[11]}"][data-reiter-aktiv="true"]`))
      .toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(1200)

    await haltAmRand(page, FUENFZEHN[11], false)
    await expect.poll(async () => (await gespeicherteOrdnung(page)).indexOf(FUENFZEHN[11]),
      { timeout: 15_000, message: 'der gezogene Reiter muss ans Ende wandern' }).toBe(14)
    // Am Anschlag steht der Takt still statt zu rotieren (kein Umlauf — der
    // Reiter fiele sonst unbemerkt ans andere Ende, dieselbe Regel wie bei
    // Alt+Shift+←/→ oben).
    await page.waitForTimeout(1500)
    expect((await gespeicherteOrdnung(page)).indexOf(FUENFZEHN[11])).toBe(14)
  })

  // ── ABLEGEN AUF DEM «+N»-KNOPF ────────────────────────────────────────────
  // Der Knopf ist der sichtbare Ort des Restes; ihn als Ablage zu nehmen, ist
  // der kurze Weg für «diesen Reiter brauche ich jetzt nicht im Bild».
  test('@1024: Ablegen auf «+N» hängt den Reiter ans Ende der Ordnung', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await setzeReiter(page, FUENFZEHN)
    await page.goto(FUENFZEHN[11])
    await expect(page.locator(`[data-reiter-schluessel="${FUENFZEHN[11]}"][data-reiter-aktiv="true"]`))
      .toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(1200)

    await page.evaluate((vonK) => {
      const q = document.querySelector<HTMLElement>(
        `[data-reiter-streifen] [data-reiter-schluessel="${vonK}"]`)!
      const knopf = [...document.querySelectorAll<HTMLElement>('nav[aria-label="Offene Reiter"] button')]
        .find((b) => /Alle \d+ offenen Reiter/.test(b.getAttribute('aria-label') ?? ''))!
      const r = knopf.getBoundingClientRect()
      const dt = new DataTransfer()
      const feuer = (ziel: HTMLElement, typ: string) => ziel.dispatchEvent(new DragEvent(typ, {
        bubbles: true, cancelable: true, dataTransfer: dt,
        clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2),
      }))
      feuer(q, 'dragstart'); feuer(knopf, 'dragenter'); feuer(knopf, 'dragover')
      feuer(knopf, 'drop'); feuer(q, 'dragend')
    }, schluessel(FUENFZEHN[11]))
    await page.waitForTimeout(250)

    const ordnung = await gespeicherteOrdnung(page)
    expect(ordnung[ordnung.length - 1], 'der abgelegte Reiter steht zuhinterst').toBe(FUENFZEHN[11])
    expect(ordnung.length, 'abgelegt heisst umgeordnet, nicht geschlossen').toBe(15)
  })
})
