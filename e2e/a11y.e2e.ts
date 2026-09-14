// @shard-gruppe: 1
// axe-core-Stichprobe (FAHRPLAN-DESIGN 3.7, Zielniveau WCAG 2.1 AA aus
// Etappe 3): Startseite (zu + mit offenem Register-Panel), ein Rechner
// (Tagerechner: DatumsFeld/FristenKalender — grösste A11y-Posten, auch mit
// offenem Kalender-Popover), eine Vorlage (Arbeitsvertrag: Wizard/
// SelectionGrid) und die Zuständigkeit (deckt die PLZ-Auswahl-Kacheln ab).
//
// Tor-Politik (§8): Verstösse mit Impact critical/serious brechen den Test;
// moderate/minor werden als Anhang dokumentiert (Abnahmegrundlage für David,
// abnahme/design-2026-06/BERICHT.md), gaten aber nicht. Bekannte, im Bericht
// begründete Befunde stehen in BEKANNTE_BEFUNDE (Muster BEKANNTER_OVERFLOW,
// smoke.e2e.ts) — nie still erweitern, immer mit Bericht-Eintrag.
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Ohne reduzierte Bewegung misst axe die lc-reveal-Einblendung mitten in der
// Animation (halbtransparenter Text → falsche Kontrast-Befunde, empirisch
// fg #78786f statt ink-500). Die CSS respektiert prefers-reduced-motion
// (index.css); test.use({reducedMotion}) griff hier nicht → explizit
// emulieren, VOR der Interaktion, die die Animation auslöst.
// Theme DETERMINISTISCH pinnen (26.6.2026; Default seit 8.8.2026 systembasiert,
// LM-174): ohne gespeicherte Wahl folgt die App prefers-color-scheme der
// Prüfmaschine → axe mass je nach Maschine hell ODER dunkel, also
// flaky. Wir setzen die Wahl per localStorage VOR dem ersten Skript-Lauf und
// emulieren das passende color-scheme. Default 'hell' (Referenzmodus); die
// Reader-Prüfpunkte laufen zusätzlich in 'dunkel' (Kontrast in BEIDEN Modi, §13/F2).
async function oeffnen(page: Page, url: string, thema: 'hell' | 'dunkel' = 'hell') {
  await page.addInitScript((t) => {
    try { localStorage.setItem('lexmetrik-thema', t) } catch { /* privater Modus */ }
  }, thema)
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: thema === 'dunkel' ? 'dark' : 'light' })
  await page.goto(url)
}

// Regel-IDs, die als bekannt/begründet NICHT gaten (je Prüfpunkt).
// Eintrag NUR mit zugehörigem Befund-Eintrag im BERICHT.md.
// - link-in-text-block: Inline-Links (brass-700) sind nur farblich vom
//   Fliesstext unterschieden — `no-underline` ist Markenentscheid; Hebung
//   (Unterstreichung o. Ä.) = Entscheid David (BERICHT.md B-2).
// - color-contrast (nur tagerechner): FristenKalender Sa/So/arbeitsfrei in
//   ink-400 = dokumentierter E3-Kompromiss (FAHRPLAN-DESIGN 3.5,
//   «Abschwächung ist Gestaltungsabsicht; Info zusätzlich in title+Legende»);
//   Hebung = Entscheid David (BERICHT.md B-1).
const BEKANNTE_BEFUNDE: Record<string, string[]> = {
  // R3-NACHZUG 6.9.2026 (W2·24, Befund R3-F1): 'startseite' und
  // 'startseite-suche' standen hier mit 'link-in-text-block' — dem
  // B-2-Markenentscheid «Inline-Links ohne Unterstreichung». Dieser Entscheid
  // ist mit dem Design-Identitäts-Umbau AUFGEHOBEN (§5 des Fahrplans: «Links
  // unterstrichen»), die Startseiten-Verweise sind unterstrichen — der Freibrief
  // ist damit gegenstandslos und GESTRICHEN, nicht umgeschrieben. Ab jetzt gatet
  // die Regel auf «/» wieder (verifiziert: mit Freibrief grün, ohne Freibrief
  // grün — der Befund ist behoben, nicht versteckt).
  'tagerechner': ['link-in-text-block'],
  'tagerechner-kalender': ['link-in-text-block'],
  'vorlage-arbeitsvertrag': ['link-in-text-block'],
  'zustaendigkeit-plz-wahl': ['link-in-text-block'],
  // W3.6 (25.6.2026): die früher hier dokumentierten color-contrast-Befunde
  // (gedämpftes «aufgehoben»/Zitiermarke/Meta in ink-400) sind GEFIXT — der
  // gesamte faintest-Text-Tier wurde ink-400→ink-500 gehoben (AA ≥4.5:1 in hell
  // UND dunkel, per axe in beiden Modi auf 0 verifiziert). 'color-contrast' ist
  // daher hier NICHT mehr whitelisted; ein neuer Kontrast-Verstoss gatet wieder.
  // Bleibt: link-in-text-block = Inline-SR/Norm-Link-Marken ohne Unterstreichung
  // (B-2 Markenentscheid, scheme-unabhängig).
  'gesetze-kanton-BS': ['link-in-text-block'],
  'gesetze-leser-BS': ['link-in-text-block'],
  'gesetze-leser-bund': ['link-in-text-block'],
  // /suche (UI-NAV S5): Inline-Links (Abdeckung/«Was ist durchsuchbar») + die
  // brass-Trefferlinks tragen denselben Markenentscheid (B-2, no-underline).
  'suche-seite': ['link-in-text-block'],
  'rechtsprechung-uebersicht': ['link-in-text-block'],
  // BS-Facette/-Reader (W2·6-BS Block B): dieselben Inline-Link-Marken (B-2).
  'rechtsprechung-uebersicht-bs': ['link-in-text-block'],
  'rechtsprechung-leser': ['link-in-text-block'],
  'rechtsprechung-leser-bs': ['link-in-text-block'],
  'international': ['link-in-text-block'],
  // Tab-Streifen-Prüfpunkt lädt /rechner/tagerechner: derselbe dokumentierte
  // Inline-Link-Marken-Entscheid (B-2) der Seite. Der Streifen SELBST ist
  // a11y-sauber (keine tablist/tab-Rollen, Kontraste auf ink-500/600 gehoben).
  'tab-streifen': ['link-in-text-block'],
}

async function axePruefen(page: Page, testInfo: TestInfo, punkt: string) {
  const ergebnis = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const bekannt = new Set(BEKANNTE_BEFUNDE[punkt] ?? [])
  const schwer = ergebnis.violations.filter(
    (v) => (v.impact === 'critical' || v.impact === 'serious') && !bekannt.has(v.id),
  )
  const dokumentieren = ergebnis.violations.filter((v) => !schwer.includes(v))
  if (dokumentieren.length > 0) {
    await testInfo.attach(`${punkt}-befunde-dokumentiert.json`, {
      body: JSON.stringify(
        dokumentieren.map((v) => ({
          id: v.id, impact: v.impact, help: v.help,
          knoten: v.nodes.map((n) => n.target.join(' ')),
        })),
        null, 2,
      ),
      contentType: 'application/json',
    })
  }
  expect(
    schwer.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} Knoten, z. B. ${v.nodes[0]?.target.join(' ')} | ${(v.nodes[0]?.failureSummary ?? '').replace(/\n/g, ' ').slice(0, 200)}`),
    `axe ${punkt}: keine critical/serious-Verstösse`,
  ).toEqual([])
}

test('Startseite', async ({ page }, testInfo) => {
  await oeffnen(page, '/')
  await expect(page.locator('h1').first()).toBeVisible()
  await axePruefen(page, testInfo, 'startseite')
})

test('Startseite mit offener Kopf-Suche', async ({ page }, testInfo) => {
  // Startseiten-Überarbeitung: der frühere Katalog-«Register-Panel»-Zustand
  // existiert auf «/» nicht mehr (Katalog lebt auf /recherche). Geprüft wird
  // stattdessen der wichtigste interaktive Zustand — die offene Suche mit
  // gruppierter Trefferliste (Katalog-Gruppe rendert synchron, ohne Lazy-Daten,
  // daher sofort sichtbar).
  await oeffnen(page, '/')
  await page.locator('header [role="search"] input[type="search"]').fill('kündigung')
  // §6.3-DEKLARATION (W2·24-R5-F1C, David-Befund D18, 6.9.2026): «insgesamt
  // braucht es auf der startseite keine suche. nur oben reicht» — die
  // Hero-Suche auf «/» ist entfallen, die EINE Suche steht im Titelblatt.
  // Geprüft wird unverändert derselbe Zustand (offene Suche mit gruppierter
  // Trefferliste, dasselbe Panel `.lc-suchpanel`), nur steht das Feld jetzt
  // im `header` statt in einer `section` der Seite. Assertion, Umfang und
  // axe-Regeln unverändert.
  await page.locator('header [role="search"] .lc-suchpanel').waitFor({ state: 'visible' })
  await axePruefen(page, testInfo, 'startseite-suche')
})

// ── W2·24-R5-F1G · DER POPUP, AUF DEN DAS FELD ZEIGT, MUSS ES GEBEN ─────────
//
// GEMESSENER ANLASS (6.9.2026, `e2e-pre-landung.log`): der Fall darüber war
// 6/10 rot mit
//   aria-valid-attr-value (critical) — Invalid ARIA attribute value:
//   aria-controls="_r_0_"  · 1 Knoten, `input`
// In den 120 ms Entprellung zwischen Tastendruck und übernommener Query
// rendert `suche/SuchResultate` ein WARTE-Panel; das trug bis zum Wurzel-Fix
// weder `id` noch `role`, während das Feld bereits `aria-expanded=true` +
// `aria-controls` meldete. Der Fall darüber traf das nur, wenn axe zufällig in
// dieses Fenster fiel — daher die Flatterhaftigkeit.
//
// Dieser Fall misst die INVARIANTE statt des Zufalls: solange das Feld ein
// Popup ankündigt, muss das angekündigte Element existieren — und zwar in
// BEIDEN Zuständen, die es gibt (Warte-Panel und fertige Trefferliste).
//
// ROT ZU BEKOMMEN (§6.7, einmal gefahren): in `suche/SuchResultate` im
// `q === ''`-Zweig `id={listboxId}` streichen ⇒ die erste Messung findet 0
// Knoten mit dieser id.
test('E5 — aria-controls der Kopf-Suche zeigt nie ins Leere (Warte- wie Treffer-Panel)', async ({ page }) => {
  await oeffnen(page, '/')
  const feld = page.locator('header [role="search"] input[type="search"]')
  const ziel = async () => page.evaluate(() => {
    const i = document.querySelector('header [role="search"] input[type="search"]')
    const id = i?.getAttribute('aria-controls')
    if (!id) return { id: null, gefunden: 0, rolle: null as string | null }
    const els = [...document.querySelectorAll(`[id="${CSS.escape(id)}"]`)]
    return { id, gefunden: els.length, rolle: els[0]?.getAttribute('role') ?? null }
  })
  // (1) Das Entprellungs-Fenster: getippt ist schon, die Query noch nicht
  // übernommen — genau der Zustand, der 6/10 rot war. Ohne Warten gemessen.
  await feld.pressSequentially('kündigung', { delay: 0 })
  const sofort = await ziel()
  if (sofort.id !== null) {
    expect(sofort.gefunden, `aria-controls=«${sofort.id}» zeigt auf ${sofort.gefunden} Elemente`).toBe(1)
    expect(sofort.rolle).toBe('listbox')
  }
  // (2) Die fertige Trefferliste.
  await page.locator('header [role="search"] [role="listbox"]').first().waitFor({ state: 'visible' })
  const fertig = await ziel()
  expect(fertig.id, 'das Feld kündigt kein Popup an, obwohl eines offen steht').not.toBeNull()
  expect(fertig.gefunden, `aria-controls=«${fertig.id}» zeigt auf ${fertig.gefunden} Elemente`).toBe(1)
  expect(fertig.rolle).toBe('listbox')
})

test('Tagerechner', async ({ page }, testInfo) => {
  await oeffnen(page, '/rechner/tagerechner')
  await expect(page.locator('h1').first()).toBeVisible()
  await axePruefen(page, testInfo, 'tagerechner')
})

// In-App-Reiter (W2·24-DESIGN-IDENTITAET R2, 6.9.2026): der Topbar-Trigger ☰ +
// Dialog-Panel ist der sichtbaren ARBEITSLEISTE gewichen (`Reiterleiste.tsx`,
// §5a — Wunsch David «analog zum browser die offenen tabs oben»). Geprüft wird
// unverändert BEIDES, nur an seinem neuen Ort: die sichtbare Reiter-Zeile UND
// das geöffnete Blatt (die reiche interaktive Fläche). 10 Reiter vorab seeden
// statt 2 — erst über der Überlauf-Schwelle (8) trägt die Leiste den
// «+N»-Knopf, der auf Desktop-Breite ins Blatt führt; die kleinere Saat prüfte
// den Überlauf gar nicht mit.
test('Arbeitsleiste mit Überlauf-Blatt', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('lexmetrik-tabs', JSON.stringify([
        { path: '/rechner/tagerechner' }, { path: '/rechner/verzugszins' },
        { path: '/rechner/streitwert' }, { path: '/rechner/erbteilung' },
        { path: '/rechner/teuerung' }, { path: '/rechner/prozesskosten' },
        { path: '/vorlagen/testament' }, { path: '/vorlagen/vollmacht' },
        { path: '/vorlagen/mahnung' }, { path: '/vorlagen/nda' },
      ]))
    } catch { /* privater Modus */ }
  })
  await oeffnen(page, '/rechner/tagerechner')
  const trigger = page.getByRole('button', { name: /Alle \d+ offenen Reiter/ })
  await trigger.waitFor({ state: 'visible' })
  await trigger.click()
  await page.getByRole('dialog', { name: 'Alle geöffneten Reiter' }).waitFor({ state: 'visible' })
  await axePruefen(page, testInfo, 'tab-streifen')
})

test('Tagerechner mit offenem Kalender-Popover', async ({ page }, testInfo) => {
  await oeffnen(page, '/rechner/tagerechner')
  await page.getByRole('button', { name: 'Kalender öffnen' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Kalender' })).toBeVisible()
  await axePruefen(page, testInfo, 'tagerechner-kalender')
})

test('Vorlage Arbeitsvertrag', async ({ page }, testInfo) => {
  await oeffnen(page, '/vorlagen/arbeitsvertrag')
  await expect(page.locator('h1').first()).toBeVisible()
  await axePruefen(page, testInfo, 'vorlage-arbeitsvertrag')
})

test('Zuständigkeit mit PLZ-Auswahl-Kacheln', async ({ page }, testInfo) => {
  await oeffnen(page, '/rechner/zustaendigkeit#schkg')
  await page.getByLabel('Postleitzahl des Betreibungsortes').fill('1041')
  await expect(page.getByRole('button', { name: /Bottens/ })).toBeVisible()
  await axePruefen(page, testInfo, 'zustaendigkeit-plz-wahl')
})

// Gesetze-Seite (BS-Audit 23.6.2026, S11): bisher deckte das axe-Tor die Rubrik
// V gar nicht ab — der SR-Nr-Kontrastfehler (S10) konnte ungebremst deployen.
// (1) Kanton-Übersicht BS eingeklappt (Systematik-Köpfe, SR-Nr-Zeilen, Pills),
// (2) ein Reader (BS-640.100) — die beiden Orte der UI-Quick-Wins.
test('Gesetze — Kanton BS (eingeklappt)', async ({ page }, testInfo) => {
  await oeffnen(page, '/gesetze?ebene=kanton&kt=BS')
// ── §6.3-DEKLARATION (W2·24-R6/D11, 6.9.2026) · DIE H1 HEISST «GESETZE» ─────
// David 6.9.2026 zum Bild /gesetze: Overline «Rechtssammlung Schweiz» + H1
// «Schweizer Gesetzessammlung» + Erklär-Absatz sagten dreimal dasselbe. Die H1
// trägt seither den BEREICHSNAMEN — dasselbe Wort wie Reiter und Navigation.
// Deklarierte fachliche Änderung: die ERWARTUNG wandert mit, die ABSICHT des
// Falls (die Seite ist da und trägt eine H1) bleibt unberührt.
  await expect(page.getByRole('heading', { name: 'Gesetze', exact: true })).toBeVisible()
  // Kanton-Header (Wappen + Name) ist da, die Systematik gerendert.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'gesetze-kanton-BS')
})

test('Gesetze — Reader BS-640.100', async ({ page }, testInfo) => {
  await oeffnen(page, '/gesetze/kanton/BS-640.100')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'gesetze-leser-BS')
})

// W1.7 (SEO W1.1-Detailseiten + bisher ungetestete Rubriken): Rechtsprechung +
// International + ein Bund-Reader ins Tor ziehen. Strukturell a11y-sauber
// verifiziert (nur link-in-text-block/B-2; color-contrast nach W3.6 = 0).
// Bund-Reader an einem KLEINEN Erlass (GebV-HReg, 11 Art.) statt OR (1099 Art.,
// axe-Timeout): gleiche GesetzLeser-Komponente, und als Gebührenverordnung mit
// Tarif-/Mehrspalten-Tabelle deckt sie den scrollable-region-Fix (tabIndex) ab.
test('Gesetze — Reader Bund (GebV-HReg, Tarif-Tabelle)', async ({ page }, testInfo) => {
  await oeffnen(page, '/gesetze/bund/GEBV_HREG')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'gesetze-leser-bund')
})

test('Rechtsprechung — Übersicht', async ({ page }, testInfo) => {
  // Budget 120 s statt 60 s (§6.3 INFRASTRUKTUR, kein Assertion-Change): vor dem
  // Listen-DOM-Deckel (BS-Tranche §7.1, Rechtsprechung.tsx LISTE_DECKEL=100)
  // renderte die Übersicht den GESAMTEN Korpus ungeblättert — axe.analyze brauchte
  // lokal ~25 s, auf dem 4×-gedrosselten CI-Runner riss das das 60-s-Budget. Der
  // Deckel begrenzt das DOM jetzt auf ~100 Zeilen je Sektion; die 120 s bleiben
  // als Sicherheitsmarge gegen CI-Starvation stehen (greifen nur bei Überschreitung).
  testInfo.setTimeout(120_000)
  await oeffnen(page, '/rechtsprechung')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'rechtsprechung-uebersicht')
})

// BS-Tranche (W2·6-BS Block B): dieselbe Übersicht mit aktiver BS-Facette —
// deckt die BS-Zeilen (amtl.-Betreff-Marker, «o. D.»-Datumszellen) + den
// «Weitere anzeigen»-Knopf des DOM-Deckels a11y ab.
test('Rechtsprechung — Übersicht, Facette BS', async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000)
  await oeffnen(page, '/rechtsprechung')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: /^Gemeinwesen: BS \(\d+\)$/ }).click()
  await expect(page.locator('a[href^="/rechtsprechung/bs_"]').first()).toBeVisible()
  await axePruefen(page, testInfo, 'rechtsprechung-uebersicht-bs')
})

// BS-Reader (kantonaler Entscheid, Word-Marker-Gliederung): heller UND dunkler
// Modus — Kontrast der neuen Meta-Elemente (Sekundärnummer, Betreff/`o. D.`).
test('Rechtsprechung — BS-Entscheid-Reader', async ({ page }, testInfo) => {
  await oeffnen(page, '/rechtsprechung/bs_appellationsgericht_AUS.2026.54')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'rechtsprechung-leser-bs')
})

test('Rechtsprechung — BS-Entscheid-Reader (dunkel)', async ({ page }, testInfo) => {
  await oeffnen(page, '/rechtsprechung/bs_appellationsgericht_AUS.2026.54', 'dunkel')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'rechtsprechung-leser-bs')
})

// UI-NAV S5: die /suche-Ergebnisseite mit Treffern (Gruppen-Landmarken,
// Facetten-Buttons, Trefferlisten) a11y-sauber.
test('Suche — Ergebnisseite (S5)', async ({ page }, testInfo) => {
  await oeffnen(page, '/suche?q=Miete')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Gesetzestext', exact: true })).toBeVisible()
  await axePruefen(page, testInfo, 'suche-seite')
})

test('Rechtsprechung — Entscheid-Reader', async ({ page }, testInfo) => {
  await oeffnen(page, '/rechtsprechung/bger_1B_278_2022')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'rechtsprechung-leser')
})

// IA-6 Stufe 2 (3.8.2026): Die International-Übersicht ist die Säule
// ?ebene=international; /international leitet nur noch dorthin um. Geprüft wird
// darum direkt die Säule (dieselbe Fläche, ohne Redirect-Zwischenschritt).
test('International — Übersicht', async ({ page }, testInfo) => {
  await oeffnen(page, '/gesetze?ebene=international')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'international')
})

// ═══ QS-UI 8a · Gate-Verschärfung Stufe 1: Dunkelmodus flächendeckend ═══════
//
// FAHRPLAN-UI-QUALITAET.md §4 Ziff. 2 verlangt «axe von Stichprobe auf
// Flächendeckung — alle Hauptrouten in Hell UND Dunkel». Der Bestand prüfte
// dunkel nur DREI Punkte (die zwei Reader unten + BS-Reader oben); die übrigen
// zehn Prüfpunkte liefen ausschliesslich hell. Eine Kontrast-Regression, die
// nur im Dunkelmodus auftritt — genau die Klasse, die W3.6 auf den Readern
// gefunden hat — wäre auf Startseite, Rechnern, Vorlagen, Suche, Gesetzes- und
// Rechtsprechungs-Übersicht ungebremst durchs Tor gegangen.
//
// Die Tabelle spiegelt die Hell-Prüfpunkte 1:1: gleicher `punkt`-Schlüssel,
// gleiche Vorbereitung, gleiche BEKANNTE_BEFUNDE. Neu ist allein das Thema.
// Deshalb KEIN Assertion-Change an den Hell-Tests (§6.3) — die bleiben
// unangetastet daneben stehen.
const DUNKEL_PUNKTE: Array<{
  titel: string
  punkt: string
  url: string
  budget?: number
  /** vor `oeffnen` (addInitScript muss vor dem ersten Skript-Lauf sitzen) */
  seeden?: (page: Page) => Promise<void>
  /** nach `oeffnen` — die Interaktion, die den geprüften Zustand herstellt */
  herstellen?: (page: Page) => Promise<void>
}> = [
  { titel: 'Startseite', punkt: 'startseite', url: '/' },
  {
    titel: 'Startseite mit offener Kopf-Suche', punkt: 'startseite-suche', url: '/',
    herstellen: async (page) => {
      await page.locator('header [role="search"] input[type="search"]').fill('kündigung')
      // §6.3-DEKLARATION (W2·24-R5-F1C, David-Befund D18, 6.9.2026): «insgesamt
      // braucht es auf der startseite keine suche. nur oben reicht» — die
      // Hero-Suche auf «/» ist entfallen, die EINE Suche steht im Titelblatt.
      // Geprüft wird unverändert derselbe Zustand (offene Suche mit gruppierter
      // Trefferliste, dasselbe Panel `.lc-suchpanel`), nur steht das Feld jetzt
      // im `header` statt in einer `section` der Seite. Assertion, Umfang und
      // axe-Regeln unverändert.
      await page.locator('header [role="search"] .lc-suchpanel').waitFor({ state: 'visible' })
    },
  },
  { titel: 'Tagerechner', punkt: 'tagerechner', url: '/rechner/tagerechner' },
  {
    titel: 'Tagerechner mit offenem Kalender-Popover', punkt: 'tagerechner-kalender', url: '/rechner/tagerechner',
    herstellen: async (page) => {
      await page.getByRole('button', { name: 'Kalender öffnen' }).first().click()
      await expect(page.getByRole('dialog', { name: 'Kalender' })).toBeVisible()
    },
  },
  {
    titel: 'Arbeitsleiste mit Überlauf-Blatt', punkt: 'tab-streifen', url: '/rechner/tagerechner',
    seeden: async (page) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('lexmetrik-tabs', JSON.stringify([
            { path: '/rechner/tagerechner' }, { path: '/rechner/verzugszins' },
            { path: '/rechner/streitwert' }, { path: '/rechner/erbteilung' },
            { path: '/rechner/teuerung' }, { path: '/rechner/prozesskosten' },
            { path: '/vorlagen/testament' }, { path: '/vorlagen/vollmacht' },
            { path: '/vorlagen/mahnung' }, { path: '/vorlagen/nda' },
          ]))
        } catch { /* privater Modus */ }
      })
    },
    herstellen: async (page) => {
      const trigger = page.getByRole('button', { name: /Alle \d+ offenen Reiter/ })
      await trigger.waitFor({ state: 'visible' })
      await trigger.click()
      await page.getByRole('dialog', { name: 'Alle geöffneten Reiter' }).waitFor({ state: 'visible' })
    },
  },
  { titel: 'Vorlage Arbeitsvertrag', punkt: 'vorlage-arbeitsvertrag', url: '/vorlagen/arbeitsvertrag' },
  {
    titel: 'Zuständigkeit mit PLZ-Auswahl-Kacheln', punkt: 'zustaendigkeit-plz-wahl', url: '/rechner/zustaendigkeit#schkg',
    herstellen: async (page) => {
      await page.getByLabel('Postleitzahl des Betreibungsortes').fill('1041')
      await expect(page.getByRole('button', { name: /Bottens/ })).toBeVisible()
    },
  },
  { titel: 'Gesetze — Kanton BS (eingeklappt)', punkt: 'gesetze-kanton-BS', url: '/gesetze?ebene=kanton&kt=BS' },
  { titel: 'Gesetze — Reader Bund (GebV-HReg)', punkt: 'gesetze-leser-bund', url: '/gesetze/bund/GEBV_HREG' },
  // W2·5m (Kap. 15.4/B3) · die EINZELARTIKEL-Ansicht ist eine eigene Fläche mit
  // eigenen Bedienelementen (Gliederungspfad, zwei Pfeil-Paare, Dossier-Griffe,
  // Vorschau-Karten) — und sie wird im DUNKELN gemessen, weil genau dort die
  // Tintenstufe der Feinschrift kippt. Die Lehre steht an der Zeile, die sie
  // ausgelöst hat: `parts/ArtikelNachbarn.tsx` («ink-400 misst 3.29:1»,
  // a11y-Sonde 14.9.2026). Ohne diesen Punkt wäre die neue Fläche unbewacht.
  {
    titel: 'Gesetze — Einzelartikel-Ansicht (OR 336c)', punkt: 'gesetze-leser-einzel',
    url: '/gesetze/bund/OR?ansicht=artikel#art-336_c',
    herstellen: async (page) => {
      await expect(page.locator('[data-einzel-artikel]')).toBeVisible({ timeout: 30_000 })
      await expect(page.locator('[data-artikel-dossier]')).toBeVisible({ timeout: 30_000 })
    },
    budget: 120_000,
  },
  // Budget wie beim Hell-Zwilling (Z. 195 ff.): der gedrosselte CI-Runner
  // braucht für axe.analyze auf der Übersicht mehr als die 60-s-Voreinstellung.
  { titel: 'Rechtsprechung — Übersicht', punkt: 'rechtsprechung-uebersicht', url: '/rechtsprechung', budget: 120_000 },
  { titel: 'Suche — Ergebnisseite (S5)', punkt: 'suche-seite', url: '/suche?q=Miete' },
  { titel: 'International — Übersicht', punkt: 'international', url: '/gesetze?ebene=international' },
]

for (const p of DUNKEL_PUNKTE) {
  test(`Dunkel — ${p.titel}`, async ({ page }, testInfo) => {
    if (p.budget) testInfo.setTimeout(p.budget)
    await p.seeden?.(page)
    await oeffnen(page, p.url, 'dunkel')
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await p.herstellen?.(page)
    await axePruefen(page, testInfo, p.punkt)
  })
}

// Dunkelmodus-Abdeckung (§13/F2): dieselben Reader-Prüfpunkte explizit in
// 'dunkel' — fängt Kontrast-Verstösse, die nur im Dunkel auftreten (z. B. der
// gedämpfte «aufgehoben»-Tier), unabhängig von Maschinen-Präferenz/Default.
test('Gesetze — Reader BS-640.100 (dunkel)', async ({ page }, testInfo) => {
  await oeffnen(page, '/gesetze/kanton/BS-640.100', 'dunkel')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'gesetze-leser-BS')
})

test('Rechtsprechung — Entscheid-Reader (dunkel)', async ({ page }, testInfo) => {
  await oeffnen(page, '/rechtsprechung/bger_1B_278_2022', 'dunkel')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await axePruefen(page, testInfo, 'rechtsprechung-leser')
})

// W1.8 (SEO/A11y-Fahrplan): Heading-Hierarchie. heading-order/page-has-heading-
// one/empty-heading sind axe-BEST-PRACTICE-Regeln, die das Haupt-Tor oben
// (withTags wcag2a/aa) NICHT fährt. Diagnose 27.6.2026: 0 Verstösse über alle
// Rubriken → hier als Regressionsschutz festgenagelt. Eigener Lauf mit
// withRules, damit das Haupt-axePruefen nicht das gesamte best-practice-Set
// einzieht (das brächte viele neue, ungeprüfte Regel-IDs ins Tor).
const HEADING_REGELN = ['heading-order', 'page-has-heading-one', 'empty-heading']
const HEADING_ROUTEN: Array<[string, string]> = [
  ['/', 'startseite'],
  ['/rechner/tagerechner', 'tagerechner'],
  ['/vorlagen/arbeitsvertrag', 'vorlage'],
  ['/gesetze?ebene=kanton&kt=BS', 'gesetze-uebersicht'],
  ['/gesetze/kanton/BS-640.100', 'gesetze-leser-BS'],
  ['/gesetze/bund/GEBV_HREG', 'gesetze-leser-bund'],
  ['/rechtsprechung', 'rechtsprechung-uebersicht'],
  ['/rechtsprechung/bger_1B_278_2022', 'entscheid-leser'],
  ['/gesetze?ebene=international', 'international'], // IA-6 Stufe 2: Säule statt Alias
  ['/materialien', 'materialien'],
]
for (const [url, name] of HEADING_ROUTEN) {
  test(`Heading-Hierarchie — ${name}`, async ({ page }) => {
    await oeffnen(page, url)
    await expect(page.locator('h1').first()).toBeVisible()
    const res = await new AxeBuilder({ page }).withRules(HEADING_REGELN).analyze()
    expect(
      res.violations.map((v) => `${v.id}: ${v.nodes.length} Knoten, z. B. ${v.nodes[0]?.target.join(' ')}`),
      `heading ${name}: keine heading-order/h1/empty-heading-Verstösse`,
    ).toEqual([])
  })
}

// ═══ W2·10-UI-NAV-R4 (R6 + E4) — Trefferflächen und Tastatur-a11y ═══════════
//
// axe prüft SC 2.5.8 nicht (die Regel `target-size` ist experimentell und läuft
// unter keinem der oben gefahrenen wcag2*-Tags). Die Trefferfläche muss darum
// GEMESSEN werden — dieser Block ist das Tor zu DESIGN-REGLEMENT F9.
//
// Der Sollwert wird NICHT hier hartkodiert, sondern zur Laufzeit aus dem einen
// Token `--tap-ziel` gelesen (src/index.css). Damit können Token und Tor nicht
// auseinanderlaufen: wer den Token senkt, senkt nicht heimlich auch das Tor —
// die WCAG-Untergrenze steht als eigene Assertion daneben.
//
// GELTUNGSBEREICH (bewusst eng, §14-Grenze der Einheit): gemessen werden die
// W2·10-Bedienflächen, die die Regel schon trägt — die Kopf-Metazeilen
// (`.lc-chip` / `.lc-chip-zeile`) und die Leser-Werkzeugleiste
// (`.lc-leiste-griff`). Der übrige Bestand ist noch NICHT nachgerüstet (gemessen
// 3.8.2026: Zitat/Link 22.2 × 13.2, Fussnoten-Sup 6.7 × 18.1, Gliederungs-
// Chevron 16 × 13.2, Sidebar-Chevron 18 × 18, Breadcrumb 45.2 × 16.8,
// «‹ einklappen» 61.9 × 13.2, A−/A+ EntscheidLeser via rohem min-h-6 [F9-Form,
// WCAG-konform 30.3 × 24.8]) und ist als `W2·17-UI-BEFUNDE-B10` deklariert.
// Die NACHRÜST-Liste hier darf nur SCHRUMPFEN; die TAP_FLAECHEN-Liste darunter
// darf nur WACHSEN: wer eine Fläche nachrüstet, streicht sie oben und nimmt
// ihren Selektor unten auf.
const TAP_FLAECHEN = [
  '.lc-chip',
  '.lc-leiste-griff',
  '.lc-chip-zeile a',
  '.lc-chip-zeile button',
  '.lc-chip-zeile [role="button"]',
  // A3-5 (R3-α, 31.8.2026 — die Liste WÄCHST, wie oben vorgesehen): die
  // Pillen-Variante von `ui/SelectionGrid`. Sie zeichnet bewusst kompakt
  // (30 px) und hebt die TREFFERFLÄCHE über ein unsichtbares `::after` auf
  // `--tap-ziel-komfort` — dieselbe Lösung wie `.lc-chip`. Aufgenommen, weil
  // genau diese Bauart nur dann verlässlich ist, wenn sie gemessen wird:
  // `StreitwertForm` trug die Pille vorher von Hand mit `py-0.5` (18 px) und
  // stand damit unter WCAG 2.5.8, ohne dass eine Sonde es sah.
  '[data-selection-pille]',
].join(', ')

// Sub-Pixel-Toleranz: getBoundingClientRect liefert je nach Zoom/Rundung 23.99
// statt 24.00 für eine korrekt gesetzte 24-px-Box. 0.5 px fängt das ab, ohne
// eine echte Unterschreitung (die nächstkleinere reale Stufe wäre 20/18/16 px)
// durchzulassen.
const TAP_TOLERANZ = 0.5

async function tapZielLesen(page: Page): Promise<number> {
  const roh = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--tap-ziel').trim(),
  )
  const px = Number.parseFloat(roh)
  // WCAG 2.2 SC 2.5.8 «Target Size (Minimum)», Konformitätsstufe AA
  // (w3.org/TR/WCAG22/#target-size-minimum, W3C Recommendation 5.10.2023).
  expect(px, `--tap-ziel ist gesetzt und erfüllt WCAG 2.5.8 (≥24px); gelesen: "${roh}"`)
    .toBeGreaterThanOrEqual(24)
  return px
}

async function tapFlaechenPruefen(page: Page, ziel: number, punkt: string) {
  const zuKlein = await page.evaluate(
    ({ sel, ziel, tol }) => {
      const out: string[] = []
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue          // nicht gerendert
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') continue
        if (r.width + tol < ziel || r.height + tol < ziel) {
          const kl = typeof el.className === 'string' ? el.className : ''
          out.push(`${r.width.toFixed(1)}×${r.height.toFixed(1)} <${el.tagName.toLowerCase()}.${kl.slice(0, 40)}> "${(el.textContent ?? '').trim().slice(0, 24)}"`)
        }
      }
      return out
    },
    { sel: TAP_FLAECHEN, ziel, tol: TAP_TOLERANZ },
  )
  expect(
    zuKlein,
    `Trefferfläche ${punkt}: jede W2·10-Bedienfläche ≥ ${ziel}px in beiden Achsen (F9/WCAG 2.5.8)`,
  ).toEqual([])
}

for (const thema of ['hell', 'dunkel'] as const) {
  test(`Trefferflächen — Gesetz-Reader (${thema})`, async ({ page }) => {
    await oeffnen(page, '/gesetze/bund/GEBV_HREG', thema)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.lc-chip').first()).toBeVisible()
    await tapFlaechenPruefen(page, await tapZielLesen(page), `gesetz-leser-bund/${thema}`)
  })

  test(`Trefferflächen — Entscheid-Reader (${thema})`, async ({ page }) => {
    await oeffnen(page, '/rechtsprechung/bger_1B_278_2022', thema)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.lc-chip').first()).toBeVisible()
    await tapFlaechenPruefen(page, await tapZielLesen(page), `entscheid-leser/${thema}`)
  })
}

// ── E4 · Skip-Link (WCAG 2.4.1 «Bypass Blocks») ────────────────────────────
// Prüfauftrag der Linsen, hier als Regressionsschutz festgenagelt: der
// Skip-Link ist das ERSTE fokussierbare Element, wird beim Fokus sichtbar und
// setzt den Fokus tatsächlich in den Hauptinhalt (nicht bloss den Scroll).
// BEFUND 3.8.2026 (offen, → W2·17-UI-BEFUNDE-B10): fokussiert misst er
// 151.1 × 25.6 px statt der 44 px seiner `lc-btn`-Anatomie — die Utility
// `focus:not-sr-only` setzt `height:auto` und schlägt aus der Utilities-Ebene
// die `height:44px` der Components-Ebene. Über der WCAG-Untergrenze (25.6 ≥ 24),
// aber unter dem Komfort-Ziel; der Fix liegt in `Shell.tsx` und damit ausserhalb
// dieser Einheit. Das Tor prüft darum die Untergrenze, nicht die 44.
test('E4 — Skip-Link führt den Fokus in den Hauptinhalt', async ({ page }) => {
  await oeffnen(page, '/gesetze/bund/GEBV_HREG')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  const ziel = await tapZielLesen(page)
  const aktiv = await page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null
    const r = a?.getBoundingClientRect()
    return { text: (a?.textContent ?? '').trim(), href: a?.getAttribute('href') ?? '', w: r?.width ?? 0, h: r?.height ?? 0 }
  })
  expect(aktiv.text, 'erstes Tab-Ziel ist der Skip-Link').toBe('Zum Inhalt springen')
  expect(aktiv.href, 'Skip-Link zeigt auf den Hauptinhalt').toBe('#inhalt')
  expect(aktiv.w + TAP_TOLERANZ, 'Skip-Link-Breite ≥ --tap-ziel (F9)').toBeGreaterThanOrEqual(ziel)
  expect(aktiv.h + TAP_TOLERANZ, 'Skip-Link-Höhe ≥ --tap-ziel (F9)').toBeGreaterThanOrEqual(ziel)
  await page.keyboard.press('Enter')
  await expect
    .poll(() => page.evaluate(() => `${document.activeElement?.tagName}#${document.activeElement?.id}`),
      { message: 'nach Enter liegt der Fokus auf <main id="inhalt">' })
    .toBe('MAIN#inhalt')
})

// ── E4 · aria-live-Bestätigung «✓ kopiert» ─────────────────────────────────
// Der Entscheid-Leser meldet die Kopier-Bestätigung über eine sr-only
// aria-live-Region (EntscheidBody.tsx) — ohne sie bliebe der Wechsel der
// Knopf-Beschriftung für Screenreader stumm. Hier als Regressionsschutz.
// BEFUND 3.8.2026 (offen, → W2·17-UI-BEFUNDE-B10): der GESETZES-Leser hat
// keine solche Region — `ArtikelLeser.tsx` tauscht nur die Beschriftung
// «Zitat» → «✓ kopiert» in situ. Die Fläche liegt ausserhalb dieser Einheit;
// das Tor nagelt darum den gebauten Teil fest und behauptet nichts über den
// offenen (§8).
test('E4 — Kopier-Bestätigung ist eine aria-live-Region (Entscheid-Leser)', async ({ page }) => {
  await oeffnen(page, '/rechtsprechung/bger_1B_278_2022')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const anzahl = await page.locator('[aria-live="polite"].sr-only').count()
  expect(anzahl, 'Entscheid-Leser hält eine sr-only aria-live-Region für «✓ kopiert» bereit')
    .toBeGreaterThanOrEqual(1)
})
