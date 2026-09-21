// @shard-gruppe: 7
// IA-7 · Sidebar-Kantonsliste-Badges (FAHRPLAN-GESETZES-UX §11.5-IA-7, W2·5d):
// Erlass-Zahl an den 26 Sidebar-Kantonslinks — Zahl aus dem build-time
// Zähler-SSoT (kantonErlassZahlen, kein Client-Fetch §15.3), Zustands-Wort aus
// der IA-2-SSoT erfassungsgrad.ts. Beweise dieser Spec:
//   – Desktop: Gruppe «Kantone» aufklappen → 26 Links, Badge-Zahl SICHTBAR,
//     aria-label = Name + Zahl + Zustands-Wort (O4-Muster, §11.6.8 — nie nur
//     Farbe/Zahl); Badge-Zahl aria-hidden (kein Doppel-Vorlesen).
//   – Erwartungswerte werden aus DERSELBEN SSoT abgeleitet (startseiteZaehler
//     .generated + erfassungsgrad) — die Spec bricht also bei SSoT-Drift der
//     Sidebar, NICHT bei blossem Korpus-Wachstum (keine zweite Zähl-Wahrheit §5).
//   – Mobil 390: dieselben Badges in der Off-Canvas-Schublade (§3.1).
// Läuft gegen `vite preview` (dist).
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { seitenleisteOeffnen } from './helpers/seitenleiste'
import { STARTSEITE_ZAEHLER } from '../src/data/startseiteZaehler.generated'
import { erfassungsgrad, STUFE_WORT } from '../src/lib/normtext/erfassungsgrad'

// Erwarteter Accessible Name eines Kantonslinks — Wortlaut-identisch zur
// Ableitung in src/lib/navigation.ts (Identitäts-Treffer, §7).
function erwarteterName(kt: string, name: string): { label: string; n: number } {
  const n = STARTSEITE_ZAEHLER.kantonErlassZahlen[kt] ?? 0
  const wort = STUFE_WORT[erfassungsgrad(kt, n).stufe]
  const mengen = n === 0 ? 'keine Erlasse' : `${n} ${n === 1 ? 'Erlass' : 'Erlasse'}`
  return { label: `${name} — ${mengen}, ${wort}`, n }
}

test.describe('IA-7 · Erlass-Zahl-Badges an den Sidebar-Kantonslinks', () => {
  test('Desktop: 26 Kantonslinks mit sichtbarer Badge-Zahl + vollem aria-label', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/')
    // D25 (deklariert, §6.3): die Leiste startet eingeklappt — Vorbedingung
    // herstellen, gemessen wird danach unverändert.
    await seitenleisteOeffnen(page)
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' })
    // D37 (deklariert, §6.3): der Abschnitt «Gesetze» startet jetzt selbst zu
    // (nur der Abschnitt der aktiven Route startet offen) — Vorbedingung
    // herstellen, damit «Kantone» überhaupt im DOM steht.
    await nav.getByRole('button', { name: 'Gesetze aufklappen' }).click()
    await nav.getByRole('button', { name: 'Kantone aufklappen' }).click()

    // Alle 26 Kantonslinks tragen den vollen Accessible Name (Name+Zahl+Wort).
    // D26 (deklariert, §6.3): Zahlen tragen seit D26 auch die Sachgebiete der
    // Rechtsprechung und die Behörden der Materialien — die Zählung wird darum
    // auf die KANTONSGRUPPE eingegrenzt statt auf die ganze Leiste. Die Aussage
    // («jeder der 26 Kantone trägt eine Badge-Zahl») ist unverändert.
    const kantonListe = nav.locator('div.flex.flex-col').filter({
      has: page.getByRole('link', { name: /^Zürich —/ }),
    }).last()
    const kantonLinks = kantonListe.getByRole('link').filter({ has: page.locator('span.num') })
    await expect(kantonLinks).toHaveCount(26)

    // Stichproben quer über die Stufen (aus der SSoT abgeleitet, nie hartcodiert):
    // ZH (dünn heute), BS (großer Bestand), AR (mittlerer Bestand).
    for (const [kt, name] of [['ZH', 'Zürich'], ['BS', 'Basel-Stadt'], ['AR', 'Appenzell A.Rh.']] as const) {
      const { label, n } = erwarteterName(kt, name)
      const link = nav.getByRole('link', { name: label, exact: true })
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', `/gesetze?ebene=kanton&kt=${kt}`)
      // Badge-Zahl ist SICHTBARER Text (nie nur Farbe, §11.6.8) …
      const badge = link.locator('span.num')
      await expect(badge).toHaveText(String(n))
      // … aber für Screenreader stumm (der Link-Name trägt Zahl + Wort schon).
      await expect(badge).toHaveAttribute('aria-hidden', 'true')
    }

    // Badge navigiert mit: Klick auf den Link landet auf der Kantons-Säule.
    await nav.getByRole('link', { name: erwarteterName('ZH', 'Zürich').label, exact: true }).click()
    await expect(page).toHaveURL(/\/gesetze\?ebene=kanton&kt=ZH$/)
    expect(fehler).toEqual([])
  })

  test('Mobil 390: Badges auch in der Off-Canvas-Schublade sichtbar', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Navigation öffnen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Navigation' })
    await expect(dialog).toBeVisible()
    // D37 (deklariert, §6.3): s. o. — «Gesetze» erst öffnen, dann «Kantone».
    await dialog.getByRole('button', { name: 'Gesetze aufklappen' }).click()
    await dialog.getByRole('button', { name: 'Kantone aufklappen' }).click()

    const { label, n } = erwarteterName('ZH', 'Zürich')
    const link = dialog.getByRole('link', { name: label, exact: true })
    await link.scrollIntoViewIfNeeded()
    await expect(link).toBeVisible()
    await expect(link.locator('span.num')).toHaveText(String(n))
    // Kein horizontaler Überlauf der Schublade durch die Badges (§3.1).
    const passt = await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
    expect(passt).toBe(true)
    expect(fehler).toEqual([])
  })
})
