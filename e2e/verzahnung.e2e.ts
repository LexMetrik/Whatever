// @shard-gruppe: 6
// Verzahnungs-UI V1a (W2·7-VZUI): die 5 Magic-Moment-Leitfälle aus
// FAHRPLAN-VERZAHNUNG-UI §4 + die Zusatzaufträge David 3.7.2026 (Fundstellen-
// Landung je Linkquelle, Popover-Verankerung am Link) + a11y-Stichprobe auf den
// neuen Flächen. Läuft gegen `vite preview` (dist).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import AxeBuilder from '@axe-core/playwright'

// ── MM1 GELÖSCHT 21.8.2026 (H5) ─────────────────────────────────────────────
// «DBG-Fuss trägt ≥2 Kontextgruppen mit Overline + Zähler + Hinweis; CLS ≈ 0»
// prüfte `section[aria-labelledby="kontext-titel"]` — den Ist-Hüllen-
// Kontextabschnitt, den H5 mit `components/kontext/KontextPanel.tsx` löscht.
// V3-Deckung stand bereits vorher: `leser-v3-kontext-cls` für die CLS-Zusage,
// `leser-v3-panel-facetten`/`-nachzug` für die Gruppen im Panel.

// ── MM2: Anwältin im Leitentscheid — beide Richtungen am Fuss, kein Gütesiegel ─
test('MM2: Entscheid-Fuss trägt «Zitierte Normen» artikelscharf; kein «gültig»/«geprüft»', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.goto('/rechtsprechung/bge_151_III_377')
  await expect(page.getByRole('heading', { level: 1, name: /151 III 377/ })).toBeVisible()
  const kontext = page.locator('section[aria-labelledby="kontext-titel"]')
  await kontext.scrollIntoViewIfNeeded()
  await expect(kontext.getByText('Zitierte Normen', { exact: false }).first()).toBeVisible({ timeout: 10_000 })
  // artikelscharfe Chips (Art.-Buttons) statt grober Erlass-Gruppe (§2.2):
  expect(await kontext.getByRole('button', { name: /^Art\./ }).count()).toBeGreaterThanOrEqual(2)
  await expect(kontext.getByText('Wendet an', { exact: false }).first()).toBeVisible()
  // §8-rote Linie: nirgends ein Gültigkeits-/Prüf-Siegel.
  const text = (await kontext.textContent()) ?? ''
  expect(text).not.toMatch(/gültig|geprüft|verifiziert/)
  expect(fehler).toEqual([])
})

// ── MM3: Gericht liest Entscheid, schlägt Norm daneben auf (Split-View) ───────
test('MM3 (≥lg): NormPopover-⧉ öffnet die Norm im Pane, der Entscheid bleibt offen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/rechtsprechung/bge_152_V_52')
  await expect(page.getByRole('heading', { level: 1, name: /152 V 52/ })).toBeVisible()
  const link = page.getByRole('link', { name: 'Art. 18 UVG', exact: true }).first()
  await link.scrollIntoViewIfNeeded()
  const scrollVor = await page.evaluate(() => window.scrollY)
  await link.click()
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  const daneben = dialog.getByRole('button', { name: /nebeneinander öffnen/ })
  await expect(daneben).toBeVisible()
  await daneben.click()
  // Pane offen (Split-View), Entscheid bleibt Hauptfenster + Lese-Position
  // erhalten: der Scroll wandert vom window in den PRIMÄR-Pane-Container
  // (Split-View-Architektur) — der Betrag bleibt derselbe.
  await expect(page.locator('[data-pane="sekundaer"]')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('heading', { level: 1, name: /152 V 52/ })).toBeVisible()
  const primaerScroll = await page.evaluate(() =>
    document.querySelector('[data-pane="primaer"]')?.scrollTop ?? -1)
  expect(Math.abs(primaerScroll - scrollVor)).toBeLessThan(150)
})

test('MM3 (Mobile): kein ⧉ im NormPopover unter lg', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/rechtsprechung/bge_152_V_52')
  const link = page.getByRole('link', { name: 'Art. 18 UVG', exact: true }).first()
  await link.scrollIntoViewIfNeeded()
  await link.click()
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: /nebeneinander öffnen/ })).toHaveCount(0)
})

// ── MM4/MM5 GELÖSCHT 21.8.2026 (H5) ─────────────────────────────────────────
// MM4 (★-aria-label an vier Orten inkl. Leitfall-Zeile im Leser) und MM5
// («via Art. N»-Sublabel am Kontext-Panel) prüften Ist-Hüllen-Struktur, die
// mit `KontextPanel.tsx` fällt. Beides dokumentierte V3-Produktentscheide,
// kein Bau-Rückstand (Kontaktbogen H4 §7b, geprüft 21.8.2026): MM4 — der
// Vier-Orte-Vergleich verliert sein drittes Bein absichtlich (Ä106,
// `PanelEntscheide.tsx`, «DAS ★ IST GESTRICHEN»); MM5 — architektonisch
// entfallen, das V3-Panel ist immer artikelscharf gescopet, nie erlass-weit
// aggregiert, also gibt es kein Sublabel-Ziel mehr.

// ── Fundstelle A GELÖSCHT 21.8.2026 (H5) ────────────────────────────────────
// «ZGB Art. 684 → BGE 151 III 377 landet auf der Erwägung» prüfte den
// Entscheid-Chip an der Ist-Hüllen-Bezüge-Zeile als Einstieg. V3-Deckung:
// e2e/leser-v3-panel-erwaegungssprung.e2e.ts (21.8.2026, §7b Pos. 4).

// ── Fundstellen-Landung je Linkquelle (Zusatzauftrag David 3.7.2026) ──────────
test('Fundstelle B (Zitiert-Gruppe): ↳ E.-Sprung erreicht die zitierende Erwägung; Chip löst ins Korpus auf', async ({ page }) => {
  await page.goto('/rechtsprechung/bger_8C_559_2025')
  const kontext = page.locator('section[aria-labelledby="kontext-titel"]')
  await kontext.scrollIntoViewIfNeeded()
  await expect(kontext.getByText('Zitierte Entscheide', { exact: false }).first()).toBeVisible({ timeout: 10_000 })
  // Ehrlicher Zähler: «… davon n im Korpus» + Hinweissatz zum Rest.
  await expect(kontext.getByText(/davon\s+\d+\s+im\s*Korpus/).first()).toBeVisible()
  await expect(kontext.getByText('im Korpus (noch) nicht erfasst', { exact: false }).first()).toBeVisible()
  // Aufgelöster Treffer als Link-Chip (BGE 150 II 346) — kein grauer Nicht-Link.
  const chipZeile = kontext.locator('li', { has: page.locator('a[href*="bge_150_II_346"]') })
  await expect(chipZeile).toBeVisible()
  // In-Text-Sprung zur zitierenden Stelle: der ↳-Sprung-Button, der ZU DIESEM Chip
  // gehört (dieselbe <li>-Zeile), landet an dessen erster Fundstelle (E. 1.1 = #e-1-1).
  // NICHT `.first()` der ganzen Gruppe: seit O-4 (#263, de-Filter gehoben) lösen auch
  // BGE 148 I 104 / 148 V 321 auf, deren erste Fundstelle (E. 4.3.3 / E. 3.2) VOR E. 1.1
  // steht — `.first()` zeigte damit auf E. 4.3.3, nicht mehr auf die hier verifizierte
  // Kante. Zeilen-scharf gebunden bleibt der Test robust gegen weiteres Kanten-Wachstum.
  const sprung = chipZeile.getByRole('button', { name: /zitierende.*springen/i })
  await expect(sprung).toBeVisible()
  await sprung.click()
  await expect(page.locator('#e-1-1')).toBeInViewport({ timeout: 10_000 })
})

// ── Popover-Verankerung am Link (Zusatzauftrag David 3.7.2026) ────────────────
test('Popover öffnet AM Link (tief im Dokument), Seite scrollt nicht', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/rechtsprechung/bge_152_V_52')
  const link = page.getByRole('link', { name: 'Art. 18 UVG', exact: true }).first()
  await link.scrollIntoViewIfNeeded()
  const scrollVor = await page.evaluate(() => window.scrollY)
  expect(scrollVor).toBeGreaterThan(500)   // wirklich tief im Dokument
  await link.click()
  const karte = page.locator('[role="dialog"]')
  await expect(karte).toBeVisible()
  // Erst der GELADENE Volltext-Zustand ist der Messgegenstand: die Lade-Hülle
  // wird beim Snapshot-Eintreffen durch ein NEUES role=dialog ersetzt — ein
  // boundingBox() im Swap-Moment liefert null (CI-Race). Der Fuss-Link
  // existiert nur im Volltext-Popover.
  await expect(karte.getByText('Im Gesetz öffnen')).toBeVisible()

  // ── §17-WURZELFIX (9.8.2026, W2·19-GLIEDERUNG) ──────────────────────────────
  // Vorher standen hier ZWEI Messungen mit demselben Defekt:
  //     const linkBox = (await link.boundingBox())!            // vor dem Klick
  //     await expect.poll(… karte.boundingBox() !== null …)
  //     const kBox = (await karte.boundingBox())!
  // Beide `!` behaupten eine Zusicherung, die Playwright nicht gibt:
  // `boundingBox()` liefert `null`, sobald das Element im Messmoment nicht
  // gelayoutet ist — und der Entscheid-Leser lädt seinen Volltext on demand,
  // tauscht also Knoten aus, während `scrollIntoViewIfNeeded()` längst zurück
  // ist. Das `null` lief stumm durch und schlug 17 Zeilen später als
  // `TypeError: Cannot read properties of null (reading 'y')` auf — ein
  // Fehlerbild, das den ECHTEN Ort verschweigt und wie ein Produktdefekt aussieht.
  //
  // GEMESSENE RATE, Bedingung jeweils genannt (Streuung statt Einzelwert,
  // §0 Ziff. 3 — identischer Build):
  //     1 Worker (= CI-Konfiguration)          0 rot / 6 Läufe
  //     5 Worker (lokaler Default)             1 rot / 7 Läufe
  //     8 Worker + repeat-each=3               2 rot / 3 Wiederholungen
  // Lastabhängig ⇒ kein Produktdefekt, sondern fehlende Stabilitäts-Wartung.
  //
  // ERSTER FIX-VERSUCH WAR ZU KURZ und ist hier dokumentiert, damit ihn niemand
  // wiederholt: ein `expect.poll(… !== null)` VOR dem `boundingBox()` behebt
  // nichts, weil Prüfung und Lesung zwei getrennte Zugriffe sind
  // (check-then-act). Der Knoten kann zwischen beiden erneut getauscht werden —
  // der erste Lauf unter Last war grün, der zweite wieder rot (2 × 8 Worker ×
  // repeat-each=3). Ein einzelner grüner Lauf hätte den falschen Fix belegt.
  //
  // RICHTIG: EINE atomare Messung. Der Poll liest beide Boxen im selben Zugriff
  // und BEHÄLT genau die Werte, die die Bedingung erfüllt haben. Zusätzlich
  // werden sie jetzt im SELBEN, gesetzten Zustand genommen (nach dem Volltext-
  // Swap statt davor) — das beseitigt neben dem `null` auch die stille
  // Zweit-Gefahr, die Link-Geometrie von VOR dem Swap gegen die Karten-Geometrie
  // von DANACH zu vergleichen.
  //
  // KEINE ASSERTION ABGESCHWÄCHT: verglichen wird unverändert dieselbe Geometrie
  // mit denselben Toleranzen (≤ 12 px vertikal, ≤ 8 px horizontal); es wird
  // ausschliesslich gewartet, bis die Messwerte überhaupt existieren.
  type Kasten = { x: number; y: number; width: number; height: number }
  const gemessen: { link?: Kasten; karte?: Kasten } = {}
  await expect.poll(async () => {
    const [l, k] = await Promise.all([link.boundingBox(), karte.boundingBox()])
    if (l && k) { gemessen.link = l; gemessen.karte = k }
    return !!(gemessen.link && gemessen.karte)
  }, { message: 'Link- und Karten-Geometrie nie gleichzeitig messbar' }).toBe(true)
  const linkBox = gemessen.link!
  const kBox = gemessen.karte!

  // Kein Seiten-Sprung beim Öffnen.
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollVor)
  // Vertikal unmittelbar unter ODER über dem Link (wenige px Toleranz).
  const vertikalNah = Math.min(
    Math.abs(kBox.y - (linkBox.y + linkBox.height)),
    Math.abs(kBox.y + kBox.height - linkBox.y),
  )
  expect(vertikalNah).toBeLessThanOrEqual(12)
  // Horizontal am Link (Überlappung bzw. Viewport-Klemmung angrenzend).
  expect(kBox.x).toBeLessThanOrEqual(linkBox.x + linkBox.width + 8)
  expect(kBox.x + kBox.width).toBeGreaterThanOrEqual(linkBox.x - 8)
})

// ── a11y-Stichprobe auf den neuen Verzahnungs-Flächen (axe, critical/serious) ─
// `gesetz-panel-ZGB` (Ist-Hüllen-Kontextabschnitt) GELÖSCHT 21.8.2026 (H5) —
// V3-Deckung: `leser-v3-panel-facetten` (e), axe auf dem geöffneten Panel.
for (const [name, url] of [
  ['entscheid-fuss', '/rechtsprechung/bge_151_III_377'],
] as const) {
  test(`a11y: ${name} ohne critical/serious-Verstösse (Kontext-Bereich)`, async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('lexmetrik-thema', 'hell') } catch { /* egal */ } })
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.goto(url)
    const kontext = page.locator('section[aria-labelledby="kontext-titel"]')
    await kontext.scrollIntoViewIfNeeded()
    await expect(kontext.locator('h3').first()).toBeVisible({ timeout: 10_000 })
    const ergebnis = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('section[aria-labelledby="kontext-titel"]')
      // `link-in-text-block` gatet mit (damals abgeschaltet, Marken-Entscheid B-2;
      // seit R3-Nachzug 6.9.2026 Inline-Links unterstrichen, F0.8).
      .analyze()
    const hart = ergebnis.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(hart.map((v) => `${v.id}: ${v.nodes.length}×`)).toEqual([])
  })
}

// ── Mobil: neue Flächen ohne horizontalen Overflow (390px, §13-Schlussprüfpunkt) ─
// `gesetz-artikel` (Ist-Hüllen-Kontextabschnitt) GELÖSCHT 21.8.2026 (H5) —
// V3-Deckung: `leser-v3-panel-nachzug` (e), Bottom-Sheet @390 ohne Overflow.
for (const [name, url] of [
  ['entscheid-fuss', '/rechtsprechung/bger_8C_559_2025'],
] as const) {
  test(`Mobil 390px: ${name} ohne horizontalen Overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(url)
    const kontext = page.locator('section[aria-labelledby="kontext-titel"]')
    await kontext.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(1500)
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}
