// @shard-gruppe: 2
// ═══ D23 · KOPF-SUCHE IST EIN OBJEKT (David 6.9.2026) ═══════════════════════
//
// Davids Wortlaut zum Bild des Leerzustands nach «+»: «schau mal wie das
// aussieht mit der suche. sehr unästhetisch». Drei der Befunde sind
// GEOMETRISCH und darum hier bewacht, statt nur im Bericht behauptet:
//   (a) Panelkante = Feldkante (links UND rechts, Δ 0) — das Panel hatte einen
//       eigenen Breiten-Boden (`min-w-[22rem]`) und war überall dort breiter
//       als das Feld, wo das Feld schmaler ist.
//   (b) kein Spalt zwischen Feld und Panel (`mt-1.5` = 6 px sind weg).
//   (c) das Panel liegt ÜBER der Reiterleiste — beide trugen `z-leiste` (20)
//       als Geschwister, das spätere DOM-Element gewann, und das Etikett
//       «Zuletzt geöffnet» war schlicht übermalt.
// Dazu (d): der «Einstiege»-Block ist weg (er wiederholte die Seitenleiste).
//
// ROT GEFAHREN (§6.7 — 6.9.2026, alle sechs Fälle einmal rot gesehen):
//   Lauf 1 (Mutationen a/b/c/d zusammen): 5 failed · 1 passed.
//     rot: Kanten @1024 (Δ links −32) · Spalt @1024 und @1440 (je 6 px) ·
//          «Panel über der Reiterleiste» · «kein Einstiege-Block».
//     grün blieb «Kanten @1440»: dort ist das Feld 384 px breit und damit
//     ohnehin breiter als der Vorher-Boden von 22 rem = 352 px — der Fall
//     kann an DIESER Mutation nicht scheitern.
//   Lauf 2 (nur `min-w-[26rem]` = 416 px): «Kanten @1440» rot (Δ links −32).
//   Danach zurückgenommen; alle sechs grün.
// DIE MUTATIONEN:
//   (a)/(b) in `HeaderSuche.tsx` die Hülle auf den Vorher-Stand zurücksetzen
//       (`absolute right-0 top-full mt-1.5 w-full min-w-[22rem]`) ⇒ «Kanten»
//       wird rot (@1024 Δ links 176 px) und «kein Spalt» wird rot (6 px).
//   (c) `z-dropdown` am `<header>` in `Topbar.tsx` auf `z-leiste` zurück ⇒
//       «Panel über der Reiterleiste» wird rot (elementFromPoint trifft die
//       Reiterleiste statt das Panel).
//   (d) den `EINSTIEGE`-Block in `SucheLeerzustand.tsx` wieder rendern ⇒
//       «kein Einstiege-Block» wird rot.
import { test, expect, type Page } from '@playwright/test'

const feld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })

/** Verlauf anlegen (der Leerzustand zeigt sonst nur die ehrliche Leerzeile). */
async function mitVerlauf(page: Page) {
  await page.goto('/rechner/tagerechner')
  await expect(page.locator('h1').first()).toBeVisible()
  await page.goto('/gesetze')
  await expect(page.locator('h1').first()).toBeVisible()
}

async function oeffneLeer(page: Page) {
  await feld(page).click()
  await expect(page.locator('header [role="search"] .lc-suchpanel-huelle')).toBeVisible()
}

/** Kanten von Feld und Panel in Viewport-Koordinaten. */
async function kanten(page: Page) {
  return page.evaluate(() => {
    const s = document.querySelector('header [role="search"]')!
    const f = s.querySelector('input')!.getBoundingClientRect()
    const p = s.querySelector('.lc-suchpanel-huelle')!.getBoundingClientRect()
    const r = (n: number) => Math.round(n)
    return { fl: r(f.left), fr: r(f.right), fb: r(f.bottom), pl: r(p.left), pr: r(p.right), pt: r(p.top) }
  })
}

for (const breite of [1024, 1440]) {
  test(`D23 · Panelkante = Feldkante @${breite}`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 })
    await mitVerlauf(page)
    await oeffneLeer(page)
    const k = await kanten(page)
    // Δ 0 links UND rechts: das Panel kann seine Breite gar nicht mehr selbst
    // wählen, sie IST die Feldbreite (`inset-x-0` am `role="search"`-Anker).
    expect(k.pl - k.fl, `linke Kante @${breite}`).toBe(0)
    expect(k.pr - k.fr, `rechte Kante @${breite}`).toBe(0)
  })

  test(`D23 · kein Spalt zwischen Feld und Panel @${breite}`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 })
    await mitVerlauf(page)
    await oeffneLeer(page)
    const k = await kanten(page)
    // Die Unterkante des Feldes (`.lc-input`, 1 px `--rule`) IST die Oberkante
    // des Panels — kein `mt`, keine Luft.
    expect(k.pt - k.fb, `Spalt @${breite}`).toBe(0)
  })
}

test('D23 · das Panel liegt über der Reiterleiste', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mitVerlauf(page)
  await oeffneLeer(page)
  const treffer = await page.evaluate(() => {
    const s = document.querySelector('header [role="search"]')!
    const panel = s.querySelector('.lc-suchpanel-huelle')!
    const reiter = document.querySelector('nav[aria-label="Offene Reiter"]')
    if (!reiter) return { ueberlappt: false, imPanel: false }
    const p = panel.getBoundingClientRect(), r = reiter.getBoundingClientRect()
    const y = (Math.max(p.top, r.top) + Math.min(p.bottom, r.bottom)) / 2
    const x = (p.left + p.right) / 2
    const oben = document.elementFromPoint(x, y)
    return {
      ueberlappt: Math.min(p.bottom, r.bottom) > Math.max(p.top, r.top),
      imPanel: !!oben && panel.contains(oben),
    }
  })
  // Vorbedingung der Messung: die beiden Flächen überlappen überhaupt.
  expect(treffer.ueberlappt, 'Panel und Reiterleiste überlappen (Vorbedingung)').toBe(true)
  expect(treffer.imPanel, 'in der Überlappung liegt das Panel obenauf').toBe(true)
})

test('D23 · kein «Einstiege»-Block mehr im Leerzustand', async ({ page }) => {
  await mitVerlauf(page)
  await oeffneLeer(page)
  const panel = page.locator('header [role="search"] .lc-suchpanel-huelle')
  await expect(panel.getByText('Zuletzt geöffnet', { exact: true })).toBeVisible()
  await expect(panel.getByText('Einstiege', { exact: true })).toHaveCount(0)
  // Die fünf Bereichs-Routen erscheinen im leeren Panel nicht mehr als
  // Optionen — sie stehen in der Seitenleiste (D17).
  for (const name of ['Gesetze', 'Rechtsprechung', 'Materialien', 'Rechner', 'Vorlagen']) {
    await expect(panel.getByRole('option', { name, exact: true })).toHaveCount(0)
  }
})

// ═══ F1–F6 (Prüfer D23, 6.9.2026) · DER TREFFERZUSTAND ══════════════════════
//
// Die Fälle oben bewachen die HÜLLE des Panels (Kanten, Spalt, Ebene, kein
// «Einstiege»-Block). Diese hier bewachen seinen INHALT im Trefferzustand —
// den Zustand, den D23 offen gelassen hatte und den der Prüfer am 6.9.2026 als
// «nicht bestanden» gemessen hat.

/** Panel im TREFFER-Zustand öffnen. «OR 257» trifft Norm-Sprung, Erlasse und
 *  Artikel zugleich — also gerade die Gruppen mit den langen Volltiteln. */
async function oeffneTreffer(page: Page, q = 'OR 257', fertig = false) {
  await page.goto('/gesetze')
  const f = feld(page)
  await f.click()
  await f.fill(q)
  await expect(page.locator('header [role="search"] [role="option"]').first()).toBeVisible({ timeout: 30_000 })
  // `fertig`: erst wenn JEDE Suchgruppe geladen ist, steht die volle Liste da
  // (die sichtbare Zählzeile ist bis dahin `invisible` — dieselbe Marke, die
  // `e2e/gesetze-ia-v2-walks.e2e.ts` als Lade-Synchronisation verwendet).
  if (fertig) {
    await expect(page.locator('header [role="search"] p[aria-hidden="true"]', { hasText: /\d+ Treffer/ }))
      .toBeVisible({ timeout: 60_000 })
  }
}

const OPTIONEN = 'header [role="search"] [role="option"]'

/** Höhen aller Treffer-Optionen, auf ganze Pixel gerundet. */
async function zeilenHoehen(page: Page): Promise<number[]> {
  return page.$$eval(OPTIONEN, (els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))
}

test('F2 · jede Trefferzeile ist gleich hoch — und so hoch wie eine Zeile des Leerzustands', async ({ page }) => {
  // GEMESSEN am Stand `c91541617`: 37 bis 266 px in DERSELBEN Liste, weil die
  // Zeile Volltitel plus mehrzeiliges Snippet trug. Die Panel-Höhe ist ein
  // CLS-Versprechen (§15.2) — sie kann keines sein, wenn die Zeile atmet.
  await page.setViewportSize({ width: 1440, height: 900 })
  await mitVerlauf(page)

  await oeffneLeer(page)
  const leer = await zeilenHoehen(page)
  expect(leer.length, 'Vorbedingung: der Leerzustand zeigt Verlauf-Zeilen').toBeGreaterThan(0)
  const leerHoehe = leer[0]

  await oeffneTreffer(page, 'Miete', true)
  const treffer = await zeilenHoehen(page)
  expect(treffer.length, 'Vorbedingung: es gibt Treffer').toBeGreaterThan(1)
  expect([...new Set(treffer)], `Treffer-Zeilenhöhen: ${treffer.join('/')}`).toEqual([leerHoehe])

  // ROT-BEWEIS (§6.7): derselbe Ausdruck auf den gemessenen Vorher-Werten.
  // Wäre er blind gegen Höhenstreuung, wäre der Fall wertlos.
  expect([...new Set([37, 37, 266, 58])]).not.toEqual([37])
})

test('F1/F4 · Registerstrich, Kurzform, Art als Text — kein Kasten, kein ★', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await oeffneTreffer(page)
  const panel = page.locator('header [role="search"] .lc-suchpanel-huelle')

  // F1 · kein gerahmtes Etikett mehr in der Trefferliste (`.lc-badge*`).
  await expect(panel.locator('.lc-badge, .lc-badge-soft, .lc-badge-ok')).toHaveCount(0)
  // F1 · der Registerstrich steht am Anfang jeder Zeile (3 px, `RegisterMarke`).
  const striche = await page.$$eval(OPTIONEN,
    (els) => els.filter((e) => e.querySelector('span[aria-hidden]')).length)
  expect(striche, 'jede Option beginnt mit einer Marken-Spalte').toBe((await zeilenHoehen(page)).length)
  // F1 · die Kurzform, nicht der Volltitel: «OR», nicht «OR · Bundesgesetz …».
  // Der Volltitel bleibt erreichbar — im `title` derselben Zeile (§8).
  const erlassZeile = panel.getByRole('option', { name: /^OR\b/ }).first()
  if (await erlassZeile.count()) {
    const txt = (await erlassZeile.innerText()).trim()
    expect(txt, `Zeile trägt keinen Volltitel: «${txt}»`).not.toMatch(/Bundesgesetz|Obligationenrecht betreffend/)
    expect(await erlassZeile.locator('[title]').first().getAttribute('title'))
      .toMatch(/\S/)
  }
})

test('F4 · der Leitentscheid steht als WORT da, nicht als ★', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await oeffneTreffer(page, 'BGE 148 III')
  const panel = page.locator('header [role="search"] .lc-suchpanel-huelle')
  const text = await panel.innerText()
  expect(text, 'kein ★-Glyph mehr im Panel').not.toContain('★')
  // Das Vokabular ist unverändert das des StatusBadge — nur ohne Kasten.
  expect(text.includes('Leitentscheid') || text.includes('Entscheid'),
    `Art-Angabe rechts fehlt: «${text.slice(0, 200)}»`).toBe(true)
})

test('F6 · das Panel steht nie auf einer Zeile, während gesucht wird', async ({ page }) => {
  // GEMESSEN am Stand `c91541617`: 2.7 s lang 1 px hoch, dann Sprung auf
  // 729 px, sobald der Artikel-Index kam. Das Skelett reserviert die Höhe
  // einer gekappten Gruppe, also mehrere Zeilen — vom ersten Bild an.
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/gesetze')
  const f = feld(page)
  await f.click()
  const hoehen: number[] = []
  await f.fill('Miete')
  for (let i = 0; i < 12; i++) {
    const h = await page.locator('header [role="search"] .lc-suchpanel-huelle')
      .evaluate((e) => Math.round(e.getBoundingClientRect().height)).catch(() => 0)
    if (h > 0) hoehen.push(h)
    await page.waitForTimeout(120)
  }
  expect(hoehen.length, 'Vorbedingung: das Panel war sichtbar').toBeGreaterThan(0)
  // Vier Zeilen à ~37 px sind die Untergrenze, die das Skelett hält.
  expect(Math.min(...hoehen), `kleinste gemessene Panel-Höhe: ${hoehen.join('/')}`).toBeGreaterThan(120)

  // ROT-BEWEIS (§6.7): der Vorher-Verlauf (1 px, dann 729) fällt durch.
  expect(Math.min(...[1, 1, 729])).not.toBeGreaterThan(120)
})

test('F3 · «Was ist drin?» ohne Pfeil', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await oeffneTreffer(page, 'Miete')
  const link = page.locator('header [role="search"]').getByRole('link', { name: /Was ist drin/ })
  await expect(link).toBeVisible()
  expect((await link.innerText()).trim()).toBe('Was ist drin?')
})

for (const schema of ['light', 'dark'] as const) {
  test(`F5 · Feld-Unterstrich und Panel-Rahmen sind DIESELBE Linie (${schema})`, async ({ page }) => {
    // GEMESSEN dunkel am Stand `c91541617`: Unterstrich rgb(148,144,136) gegen
    // Panel-Rahmen rgb(226,224,220) — zwei Farben an EINER Kante, obwohl D23
    // Feld und Panel als ein Objekt baut. Ursache: `.lc-input:focus` färbt in
    // `--focus`, und das Feld ist immer fokussiert, wenn das Panel offen ist.
    await page.emulateMedia({ colorScheme: schema, reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await mitVerlauf(page)
    await oeffneLeer(page)
    const farben = await page.evaluate(() => {
      const s = document.querySelector('header [role="search"]')!
      const f = getComputedStyle(s.querySelector('input')!)
      const p = getComputedStyle(s.querySelector('.lc-suchpanel-huelle')!)
      return { feld: f.borderBottomColor, panel: p.borderLeftColor }
    })
    expect(farben.feld, `Naht ${schema}: Feld ${farben.feld} · Panel ${farben.panel}`)
      .toBe(farben.panel)
  })
}
