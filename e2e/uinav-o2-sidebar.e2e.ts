// @shard-gruppe: 8
// O2 · Sidebar-Konsistenz (W2·10-UI-NAV-O). Drei Versprechen, die nur im echten
// Browser beweisbar sind (SSR führt keine Effekte aus, kennt keine Klicks):
//   1. Das Label einer Rechner-/Vorlagen-Gruppe NAVIGIERT (und landet auf dem
//      Übersichtsanker), der Chevron daneben KLAPPT — zwei getrennte Gesten in
//      einer Zeile, wie schon bei Bund/Kantone.
//   2. Auto-Expandieren bei Navigation: wechselt der Standort auf ein Werkzeug,
//      dessen Sidebar-Eintrag in einer ZUGEKLAPPTEN Gruppe liegt, klappt die
//      Gruppe auf und die Aktiv-Markierung wird sichtbar. Das ist der
//      Effekt-Pfad ohne Remount — der Fall, den der Mount-Anfangszustand nicht
//      abdeckte.
//   3. Davids Auflage bleibt gewahrt: eine bewusst zugeklappte Gruppe bleibt
//      zu, auch wenn ein Kind aktiv ist (nur die steigende Flanke expandiert).
// Läuft gegen `vite preview` (dist).
//
// TIMING-REGEL dieser Spec (Lehre aus der Gegenprüfung zu W2·10-UI-NAV-O):
// Die Flanken-Erkennung der Seitenleiste vergleicht den aktuellen mit dem
// zuletzt COMMITTETEN Standort. Eine Adress-Zusicherung (`toHaveURL`) ist
// darum kein Beleg dafür, dass die Zwischenseite je gerendert wurde — sie
// erfüllt sich bereits beim pushState. Wo diese Spec einen Zwischenschritt
// braucht, riegelt sie ihn mit einem gerenderten Merkmal ab (`aria-current`).
// Gemessen 7.8.2026 mit einem MutationObserver auf der Seitenleiste: ohne
// Riegel verzeichnet der Beobachter für die ganze Hin-und-Zurück-Folge KEINE
// einzige Mutation — React committet die Zwischen-Fassung nie.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { seitenleisteOeffnen } from './helpers/seitenleiste'

const nav = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' })

// ── D25/D26 (David 6.9.2026), DEKLARIERTE FACHLICHE ÄNDERUNG (§6.3) ──────────
//
// Zwei Vorbedingungen dieser Spec haben sich geändert, ihre AUSSAGEN nicht:
//
//  1. D25 — die Seitenleiste startet eingeklappt. Jeder Fall blendet sie darum
//     zuerst ein (`seitenleisteOeffnen`, e2e/helpers/seitenleiste.ts). Das ist
//     eine Vorbedingung, keine Abschwächung: gemessen wird danach dasselbe.
//  2. D26 — die Rechner-Oberkategorien («Fristen») sind keine Sidebar-Gruppen
//     mehr, und die Meta-Ziele («Methodik») stehen im Seitenfuss. Die O2-Zusagen
//     («Label navigiert, Chevron klappt», «Auto-Expandieren», «bewusst
//     zugeklappt bleibt zu») gelten unverändert für JEDE Gruppe der Leiste;
//     belegt werden sie jetzt an der Vorlagen-Gruppe «Behördeneingaben» und
//     ihrem Kind «Fristerstreckungsgesuch». Für den «fremde Seite»-Sprung tritt
//     der Sidebar-Eintrag «Alle Rechner» an die Stelle von «Methodik».
const GRUPPE = 'Behördeneingaben'
const GRUPPEN_ANKER = 'vorlage-eingaben'
const KIND = 'Fristerstreckungsgesuch'
const KIND_PFAD = '/vorlagen/fristerstreckung'

test.describe('O2 · Sidebar-Konsistenz', () => {
  test('Gruppen-Label navigiert auf den Übersichtsanker, der Chevron klappt', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/')
    await seitenleisteOeffnen(page)
    const leiste = nav(page)
    // D37 (deklariert, §6.3): der Abschnitt «Vorlagen» startet jetzt selbst zu
    // (nur der Abschnitt der aktiven Route startet offen, auf «/» keiner) —
    // Vorbedingung herstellen, damit die Gruppe «Behördeneingaben» im DOM steht.
    await leiste.getByRole('button', { name: 'Vorlagen aufklappen' }).click()

    // Die Zeile der Gruppe trägt Link + Chevron.
    const chevron = leiste.getByRole('button', { name: new RegExp(`^${GRUPPE} (auf|ein)klappen$`) })
    await expect(chevron).toHaveAttribute('aria-expanded', 'false')

    // Chevron klappt NUR auf — die Adresse bleibt, wo sie war.
    await chevron.click()
    await expect(chevron).toHaveAttribute('aria-expanded', 'true')
    expect(new URL(page.url()).pathname).toBe('/')

    // Das Label navigiert — auf den Übersichtsanker der Gruppe.
    await leiste.getByRole('link', { name: GRUPPE, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/vorlagen#${GRUPPEN_ANKER}$`))
    // Der Anker existiert wirklich und ist im Blickfeld (kein toter Sprung).
    await expect(page.locator(`#${GRUPPEN_ANKER}`)).toBeVisible()

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('Auto-Expandieren: Navigation in eine zugeklappte Gruppe öffnet sie', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.goto('/')
    await seitenleisteOeffnen(page)
    const leiste = nav(page)
    // D37 (deklariert, §6.3): s. o. — «Vorlagen» erst öffnen, damit die Gruppe
    // «Behördeneingaben» überhaupt existiert (der AUTO-EXPAND-Beweis dieser
    // Zeile gilt weiter der Gruppen-, nicht der Abschnitts-Ebene).
    await leiste.getByRole('button', { name: 'Vorlagen aufklappen' }).click()

    // Ausgangslage: die Gruppe ist zu, ihr Kind darum nicht sichtbar.
    const chevron = leiste.getByRole('button', { name: new RegExp(`^${GRUPPE} (auf|ein)klappen$`) })
    await expect(chevron).toHaveAttribute('aria-expanded', 'false')
    const kind = leiste.getByRole('link', { name: KIND, exact: true })
    await expect(kind).toHaveCount(0)

    // Standortwechsel OHNE Sidebar-Klick (Kopf-Suche/Deep-Link-Ersatz: ein
    // In-App-Link auf der Seite selbst) — hier über die Vorlagen-Übersicht.
    await page.goto('/vorlagen')
    await page.getByRole('link', { name: new RegExp(KIND) }).first().click()
    await expect(page).toHaveURL(new RegExp(KIND_PFAD))

    // Die Gruppe hat sich geöffnet, das aktive Kind ist sichtbar und markiert.
    await expect(chevron).toHaveAttribute('aria-expanded', 'true')
    await expect(kind).toBeVisible()
    await expect(kind).toHaveAttribute('aria-current', 'page')

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  test('bewusst zugeklappt bleibt zu; Zurück/Vorwärts verhalten sich wie erwartet', async ({ page }) => {
    // Alles in EINER Sitzung ohne Vollreload — ein page.goto würde die
    // Seitenleiste remounten und den Nutzer-Entscheid ohnehin verwerfen.
    const fehler = fehlerSammeln(page)
    await page.goto(KIND_PFAD)
    await seitenleisteOeffnen(page)
    const leiste = nav(page)
    const chevron = leiste.getByRole('button', { name: new RegExp(`^${GRUPPE} (auf|ein)klappen$`) })
    // Beim Laden offen (aktives Kind).
    await expect(chevron).toHaveAttribute('aria-expanded', 'true')

    // Nutzer klappt bewusst zu (Auflage David «Kategorien einklappbar») …
    await chevron.click()
    await expect(chevron).toHaveAttribute('aria-expanded', 'false')

    // … ein SPA-Wechsel auf eine fremde Seite lässt sie zu (das aktive Kind
    // verschwindet — keine steigende Flanke, keine Bevormundung).
    // D37 (deklariert, §6.3): «Alle Rechner» hängt im Abschnitt «Rechner», der
    // auf dieser Route (noch) nicht aktiv ist und darum selbst zu startet —
    // erst öffnen, dann den Zielsprung auslösen.
    await leiste.getByRole('button', { name: 'Rechner aufklappen' }).click()
    const fremd = leiste.getByRole('link', { name: 'Alle Rechner', exact: true })
    await fremd.click()
    // COMMIT-BEWEIS, nicht nur Adress-Beweis (Härtung nach Gegenprüfung B1):
    // `toHaveURL` erfüllt sich schon beim pushState. Ohne diesen Riegel liegen
    // Hin- und Rückweg in EINEM React-Batch, die /methodik-Fassung wird nie
    // committet — der Standort kehrt zum Ausgangswert zurück, ohne dass je
    // etwas anderes auf dem Schirm stand. `aria-current` sitzt auf der
    // gerenderten Seitenleiste und beweist damit den vollzogenen Commit.
    await expect(fremd).toHaveAttribute('aria-current', 'page')
    await expect(chevron).toHaveAttribute('aria-expanded', 'false')

    // Zurück-Taste AUF das Werkzeug ist wieder eine steigende Flanke → offen
    // (Back/Forward-Fall, Lehren-Register F7).
    // Adress-Regex OHNE `$` (Härtung nach Gegenprüfung E1): eine Werkzeugseite
    // darf ihren Eingabe-Zustand per replaceState in die Query spiegeln. Der
    // wiederhergestellte History-Eintrag trägt sie je nach Verweildauer mit —
    // der Pfad ist hier das Prüfobjekt, nicht die Query.
    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`${KIND_PFAD}(\\?|$)`))
    await expect(chevron).toHaveAttribute('aria-expanded', 'true')

    expect(fehler, fehler.join('\n')).toEqual([])
  })

  // O5/Beifang derselben Fläche — der sichtbare Beweis, den SSR nicht führen
  // kann (die Filterzeile erscheint erst nach dem Manifest-Ladevorgang).
  test('O5/Beifang: /materialien-Filterfeld erklärt seinen Scope und zoomt mobil nicht', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/materialien')

    // DEKLARIERTE ANPASSUNG (R12A/D22, 6.9.2026): das Feld trägt jetzt das
    // sichtbare Label «Filtern»; der Platzhalter nennt nur noch die Felder und
    // wiederholt das Verb nicht («… suchen …» ist entfallen). Geprüft bleibt
    // dasselbe: Feld sichtbar, Scope-Zeile sichtbar und verknüpft.
    const feld = page.getByPlaceholder('Titel, Nummer oder Behörde …')
    await expect(feld).toBeVisible()
    // Scope-Label sichtbar UND programmatisch verknüpft.
    const beschreibung = page.locator('#materialien-filter-scope')
    await expect(beschreibung).toBeVisible()
    await expect(feld).toHaveAttribute('aria-describedby', 'materialien-filter-scope')
    // DEKLARIERT (R12A/D22): das führende «Nur » ist entfallen — die Zeile sitzt
    // in der Filterhülle unter dem Feld und beschreibt dort nichts anderes.
    await expect(beschreibung).toContainText('Titel, Nummer, Behörde und Dokumenttyp dieser Rubrik')

    // Beifang: iOS Safari zoomt beim Fokus jedes Felds unter 16 px. Auf 390 px
    // muss die effektive Schriftgrösse darum ≥ 16 px sein.
    const px = await feld.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(px, 'unter 16 px zoomt iOS Safari beim Fokus').toBeGreaterThanOrEqual(16)

    // Ab sm bleibt es bei der kompakten Stufe (der Fix ist ein Unter-sm-Zusatz).
    await page.setViewportSize({ width: 1280, height: 900 })
    const pxDesktop = await feld.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(pxDesktop).toBeLessThan(16)

    expect(fehler, fehler.join('\n')).toEqual([])
  })
})
