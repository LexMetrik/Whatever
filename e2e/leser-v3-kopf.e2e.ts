// @shard-gruppe: 1
// ═══ DER V3-KOPF: BEDIENUNG UND WEGE ════════════════════════════════════════
//
// ZUSAMMENGELEGT 31.8.2026 (Ent-Regulierung Runde 2 / Batch A, QS-EFFIZIENZ) aus
// vier Specs der Kopf-Familie — `leser-kopf-g2b`, `leser-v3-h4-kopfwege`,
// `leser-kopf-a9` und `leser-kopf-paritaet`. ALLE 22 FÄLLE BLEIBEN, jeder mit
// seinem Wortlaut, seinen Selektoren und seinen Belegen; zusammengeführt sind
// allein die Import-Zeilen. Keine Assertion entfernt, keine gelockert (§6.3).
//
// WARUM DIESE VIER UND NICHT ALLE ACHT. `leser-kopf-cls-s3` bleibt eigenständig
// (eigene CLS-Vorfalls-Provenienz, Auflage des Batch-Auftrags).
// `leser-kopf-v2` bleibt ebenfalls: der Name meint NICHT den Leser V2, sondern
// die Fahrplan-Etappe GESETZESDARSTELLUNG-V2 — die Datei prüft den heute
// ausgelieferten V3-Stand (ihr B-1-Fall greift `[data-v3-panel]`). Die Fälle zu
// Kopfzeile und Bündigkeit stehen in `leser-v3-kopfzeile.e2e.ts`, getrennt
// gehalten aus Shard-Gründen (unten).
//
// SHARD-WAHL, GEMESSEN STATT GERATEN (§0 Ziff. 3). Lokal, kalt, `--workers=1`,
// `vite preview` aus dist/, 31.8.2026: g2b 7.7 s · h4-kopfwege 27.4 s · a9 9.5 s
// · paritaet 5.8 s = 50.4 s. Sie kamen aus Gruppe 4 (35.1 s) und Gruppe 2
// (15.3 s). Gegen die zuletzt dokumentierten Gruppen-Summen (Lastprobe
// 18.8.2026 im `_kommentar` von `e2e/shard-gruppen.json`: G1 114.8 · G7 127.0 ·
// G6 127.3 · G2 136.9 · G3 201.3 · G5 203.9 · G4 239.4 · G8 267.1 s) ist Gruppe 1
// die leichteste — dorthin. Gruppe 4 verliert 35 s, Gruppe 1 nimmt 50 s auf; die
// schwerste Gruppe (8) bleibt unberührt. Weil CI `workers: 1` je Shard fährt
// (`playwright.config.ts`), ist die Wandzeit die SCHWERSTE Gruppen-Summe — eine
// Zusammenlegung, die eine schwere Gruppe weiter belädt, verschlechtert sie.
// Beleg: bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §1.
import { test, expect, type Page } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'
import { ANSICHT_PANEL, VERMERKE_SCHALTER_NAME, WAHL_ROLLE } from './helpers/leserBeschriftung'
import { DROSSEL, REAKTIONS_BUDGET, REAKTIONS_LATTE, CONTAINER_BUDGET_CI, CONTAINER_LOKAL_READER } from './helpers/budgets'

// ═══════════════════════════════════════════════════════════════════════════
// TEIL 1 · W2·5d G2b — Kopf-Zusammenführung, Ansicht-Dropdown, Standausweis
// Wortlaut übernommen aus `e2e/leser-kopf-g2b.e2e.ts` (31.8.2026, Runde 2 / Batch A);
// Datei-Kopf und Fälle unverändert, nur die Import-Zeilen sind oben
// zusammengeführt.
// ═══════════════════════════════════════════════════════════════════════════


// W2·5d G2b — Kopf-Zusammenführung + «Zitat kopieren» (A27: Sticky Section-
// Kontextkopf entfernt — Orientierung im Inhalts-Kopf, Zitat je Artikel).
// Der Reader liefert prerendertes Crawler-HTML → auf den Client-Takeover warten
// (die Options-Leiste existiert NUR im React-DOM), bevor geprüft wird. BV ist ein
// kleiner, ABER geschachtelter Erlass (2-Spalten-Lesemodus) — CI-fest.
//
// ── H4-UMHÄNGUNG (Flip 18.8.2026, Kontaktbogen H4 §7) ───────────────────────
// Drei Nachführungen, alle gemessen, keine davon eine Lockerung (§6.3):
//
// (1) `.lc-leser > header` → `.lc-leser header`. Beide Hüllen rendern DENSELBEN
//     `<header>` (`parts/ErlassLeserKopf.tsx`, §5); V3 hängt ihn nur eine Zone
//     tiefer (`v3/LeserErlassKopfZone`). Gemessen 18.8.2026 an BV @1440:
//     direktes Kind 0 (V3) / 1 (V1), Nachfahre 1 in BEIDEN.
// (2) Die «immer sichtbare Positionsleiste» heisst in V3 anders: die Krume
//     trug dort `aria-label="Ort im Gesetz"` statt `"Brotkrümel"` (gemessen:
//     V1 → Brotkrümel, V3 → Ort im Gesetz). Der Selektor nennt beide Namen; die
//     AUSSAGE — der Ansicht-Öffner steht in der klebenden Ortsleiste und NICHT
//     im wegscrollenden Erlass-Kopf (A26) — bleibt Wort für Wort dieselbe.
//     §6.3-NACHZUG D27 (David 6.9.2026): in V3 gibt es die `nav` nicht mehr,
//     die Ortsangabe ist in den Reiter gezogen. Die klebende Zone selbst gibt
//     es weiterhin (`[data-v3-kopf-ort]`) — der Selektor nennt sie als dritte
//     Alternative, die A26-Aussage bleibt damit unverändert prüfbar.
// (3) `aria-controls` setzt V3 bewusst nur im GEÖFFNETEN Zustand
//     (`v3/LeserAnsichtV3.tsx`: «kein Sprung, der ins Leere führt», §8). Die
//     Prüfung wandert deshalb hinter das Öffnen — und wird dort STRENGER: statt
//     «irgendein nichtleerer Wert» verlangt sie jetzt, dass die Kennung auf das
//     wirklich vorhandene Optionen-Panel zeigt. Ob das Attribut im
//     GESCHLOSSENEN Zustand steht, bleibt bewusst ungeprüft — genau darin
//     unterscheiden sich die Hüllen, und beide Wege sind vertretbar.
//
// Damit ist die Datei wieder paritätsfähig und steht seit H4 in `N_SPECS`.
const KOPF = '.lc-leser header';
/** Die klebende Ortsleiste, in beiden Hüllen (A26). */
const ORTSLEISTE = 'nav[aria-label="Brotkrümel"], nav[aria-label="Ort im Gesetz"], [data-v3-kopf-ort]';

async function warteReader(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#art-1').first()).toBeVisible({ timeout: 20000 });
}

test('Kopf-Zusammenführung + A26: EIN <header> (Overline/Titel), «Ansicht»-Dropdown in der immer sichtbaren Positionsleiste', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BV');
  // Genau EIN Leser-Kopf (kein duplizierter Block): der <header> mit der Overline.
  const header = page.locator(KOPF);
  await expect(header).toHaveCount(1);
  await expect(header.getByText('Bundesverfassung', { exact: false }).first()).toBeTruthy();
  // A26 (David 11.7.2026): das «Ansicht»-Dropdown ist AUS dem weggescrollenden
  // Erlass-Kopf in die IMMER sichtbare Positions-/Kontextleiste (Inhalts-Kopf mit
  // Brotkrümel) gewandert — damit die Darstellungsoptionen jederzeit erreichbar
  // sind, während man im Gesetz ist. Im Kopf steht es daher nicht mehr.
  await expect(header.getByRole('button', { name: 'Ansicht' })).toHaveCount(0);
  const leiste = page.locator('div.sticky', { has: page.locator(ORTSLEISTE) });
  const ansicht = leiste.getByRole('button', { name: 'Ansicht' });
  await expect(ansicht).toBeVisible();
  await expect(ansicht).toHaveAttribute('aria-expanded', 'false');
  await ansicht.click();
  await expect(ansicht).toHaveAttribute('aria-expanded', 'true');
  await expect(leiste.locator(ANSICHT_PANEL)).toBeVisible();
});

// U-KOPF/A4 a11y: das «Ansicht»-Dropdown ist eine ehrliche Disclosure (kein
// role=menu) mit Fokus-Falle, Escape-Schliessen und Fokus-Rückgabe an den
// Auslöser (useDialogFokus). Der Trigger trägt aria-expanded + aria-controls.
test('A4 «Ansicht»-Dropdown: Öffnen fokussiert den Inhalt, Escape schliesst + gibt Fokus zurück', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BV');
  const trigger = page.getByRole('button', { name: 'Ansicht' }).first();
  await trigger.click();
  const gruppe = page.locator(ANSICHT_PANEL).first();
  await expect(gruppe).toBeVisible();
  // `aria-controls` im GEÖFFNETEN Zustand — und die Kennung zeigt auf das
  // Panel, das wirklich da ist (H4: V3 setzt das Attribut bewusst nur, solange
  // es ein Ziel gibt; ein Sprung ins Leere wäre §8-widrig). Vorher stand die
  // Prüfung vor dem Klick und verlangte nur «irgendein nichtleerer Wert».
  const ziel = await trigger.getAttribute('aria-controls');
  expect(ziel, 'Auslöser nennt das Panel, das er aufzieht').toBeTruthy();
  // Ä114 (18.8.2026): V3 nennt das Panel «Ansicht», V1 weiter
  // «Darstellungsoptionen» — dieselbe Fläche, zwei Hüllen (helpers/leserBeschriftung).
  await expect(page.locator(`#${ziel}`)).toHaveAttribute('aria-label', /^(Ansicht|Darstellungsoptionen)$/);
  // Fokus ist beim Öffnen in das Panel gewandert (erstes fokussierbares Element).
  // Der Selektor wird HINEINGEREICHT — im Browser-Kontext gibt es die
  // Helper-Konstante nicht (sie lebt im Node-Prozess des Testläufers).
  const fokusImPanel = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    return g != null && g.contains(document.activeElement);
  }, ANSICHT_PANEL);
  expect(fokusImPanel).toBe(true);
  // Escape schliesst und gibt den Fokus an den Auslöser zurück.
  await page.keyboard.press('Escape');
  await expect(gruppe).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await trigger.evaluate((el) => el === document.activeElement)).toBe(true);
});

// A27 (David 12.7.2026): die Tests des Sticky Section-Kontextkopfs (Standort-
// Anzeige, klickbare A3-Breadcrumbs, @1024-Overflow-Schutz) sind entfernt — die
// Komponente wurde gestrichen. Die Orientierung trägt seit A26 der immer
// sichtbare Inhalts-Kopf (siehe Test oben: nav[aria-label="Brotkrümel"]); die
// «Zitat kopieren»-Aktion lebt je Artikel im ArtikelLeser (unten geprüft).

// P1-d — Currency-Aussagen im Leser-Kopf (Moat-Hebel 3). Sie stehen schon im
// prerenderten Kopf (CLS=0) UND im React-Kopf (geteilte Komponente ErlassLeserKopf,
// beide Leser-Instanzen). BV ist aktuell + hat eine künftige Fassung → beide
// Angaben; BKV ist aktuell ohne künftige Fassung → nur der Standausweis.
//
// NEU GEFASST W2·5m-LESER-V3/S3 (Entscheid F5, David 16.8.2026): der Standausweis
// heisst nicht mehr «geltend geprüft am …», sondern «gegen Fedlex-Konsolidierung
// geprüft am … (maschinell)», und er steht nicht mehr in einem Chip, sondern in
// der Stand-Zeile. Deklarierte FACHLICHE Änderung, kein Refactoring (§6.3): die
// Erwartung wird angepasst, nicht der Code gebogen. Die §8-Zusagen bleiben WÖRTLICH
// stehen — «(maschinell)» tragend, kein «gültig»/«verifiziert» — und werden zur
// Sicherheit zusätzlich um den ALTEN Wortlaut ergänzt, damit ein Rückfall auffällt.
test('Standausweis F5 + «nächste Fassung ab …» (BV)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BV');
  const header = page.locator(KOPF);
  await expect(header.getByText(/gegen Fedlex-Konsolidierung geprüft am \d{2}\.\d{2}\.\d{4} \(maschinell\)/)).toBeVisible();
  await expect(header.getByText(/nächste Fassung ab \d{2}\.\d{2}\.\d{4}/)).toBeVisible();
  // §8: kein «gültig»/«verifiziert» als eigenes Wort ausserhalb der zugelassenen Formel.
  await expect(header.getByText(/\bgültig\b/)).toHaveCount(0);
  await expect(header.getByText(/\bverifiziert\b/)).toHaveCount(0);
  // F5: der alte, irreführende Wortlaut darf nicht zurückkommen.
  await expect(header.getByText(/geltend geprüft am/)).toHaveCount(0);
});

test('Standausweis ohne künftige Fassung (BKV)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BKV');
  const header = page.locator(KOPF);
  await expect(header.getByText(/gegen Fedlex-Konsolidierung geprüft am \d{2}\.\d{2}\.\d{4} \(maschinell\)/)).toBeVisible();
  await expect(header.getByText(/nächste Fassung ab/)).toHaveCount(0);
});

test('Stand-Zeile bricht mobil @390 um — kein horizontaler Seiten-Overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await warteReader(page, '/gesetze/bund/BV');
  await expect(page.locator(KOPF).getByText(/Fedlex-Konsolidierung geprüft am/)).toBeVisible();
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});

// S3 · F5-Warnzeile im KLARTEXT — der Kern des Positions-11-Befunds. STPO trägt
// eine in Kraft getretene, nicht konsolidierte Änderung; der Satz muss VOR dem
// Lesen sichtbar sein (nicht bloss im `title`) und ein Datum nennen.
test('S3/F5: nicht konsolidierte Änderung steht im Klartext im Kopf (STPO)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/STPO');
  const header = page.locator(KOPF);
  await expect(
    header.getByText(/Fedlex hat eine seit \d{2}\.\d{2}\.\d{4} geltende Änderung noch nicht in den Text eingearbeitet/),
  ).toBeVisible();
  await expect(header.getByText(/massgeblich ist die amtliche Fassung/)).toBeVisible();
});

// Gegenprobe zum §7-Stichtagsfilter, im echten Browser. BV ist der scharfe Fall:
// es TRÄGT den `nichtKonsolidiert`-Marker, aber für eine Änderung, die erst
// 2029 in Kraft tritt. Es darf darum KEINE Warnung zeigen — «Fedlex hat eine
// seit 01.01.2029 geltende Änderung noch nicht eingearbeitet» wäre eine falsche
// Tatsachenbehauptung (§1/§8). Angekündigtes trägt stattdessen sein eigenes,
// korrektes Wortfeld «nächste Fassung ab …», das der BV-Test oben prüft.
//
// (Zuerst stand hier OR. Das war ein Fehlgriff: OR ist mit 2038 Artikeln der
// schwerste Snapshot im Bestand, der Lade-Helfer lief unter Parallellast in
// 2 von 5 Läufen in den Timeout. Kein Timeout hochgesetzt, sondern der Fall
// gewechselt — BV ist leichter, in dieser Spec ohnehin schon geladen UND
// beweist mehr als OR es konnte, §17.)
test('S3/§7: künftig in Kraft tretende Änderung erzeugt KEINE Warnung (BV)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BV');
  const header = page.locator(KOPF);
  await expect(header.getByText(/noch nicht in den Text eingearbeitet/)).toHaveCount(0);
  // Ä-Rest der Live-Prüfung (18.8.2026): der Grundhinweis beginnt nicht mehr mit
  // dem englischen «Snapshot», sondern mit «Kopie vom <Stand>» — Klartext an der
  // Stelle, die einem Juristen sagt, WAS er vor sich hat (Glossar, Design-
  // Grundlage Kap. 11). Die Ist-Hülle sagt weiter «Snapshot»; darum ein Muster,
  // das beide Hüllen deckt — geprüft ist der Satz, nicht sein erstes Wort.
  await expect(header.getByText(/(Kopie vom \d{2}\.\d{2}\.\d{4}|Snapshot) — massgeblich ist die amtliche Fassung/)).toBeVisible();
});

test('«Zitat kopieren»: deterministisches Zitat (Kürzel + SR + Stand) in die Zwischenablage', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 900 });
  await warteReader(page, '/gesetze/bund/BV#art-8');
  await page.locator('#art-8').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  // A27: die «Zitat kopieren»-Aktion steht je Artikel in der Artikelnummer-Zeile
  // (ArtikelLeser) — identisches baueZitat-Voll-Zitat wie zuvor im Kontextkopf.
  // §6.3-DEKLARATION (W2·26/Z6, 11.9.2026): die Aktion steht in der
  // Funktionszeile am Artikelende und wird erst gerendert, wenn der Artikel
  // Hover/Fokus hat oder eine Rubrik offen ist (auf Geräten ohne Hover immer;
  // Anlass: 13 532 Knöpfe im OR-Leser, §15). Die Zusage dieses Falls — das
  // deterministische Zitat in der Zwischenablage — ist unverändert; nur die
  // Vorbedingung ist jetzt ausgesprochen.
  await page.locator('#art-8 .lr7-bez').hover();
  await page.locator('#art-8').getByRole('button', { name: /Zitat kopieren:/ }).click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  // Deterministisches Format: «… BV, SR 101 (Stand dd.mm.yyyy)».
  expect(clip).toContain('BV');
  expect(clip).toContain('SR 101');
  expect(clip).toMatch(/\(Stand \d{2}\.\d{2}\.\d{4}\)/);
});


// ═══════════════════════════════════════════════════════════════════════════
// TEIL 2 · H4-II — ein Weg je Handlung aus der V3-Kopfzeile
// Wortlaut übernommen aus `e2e/leser-v3-h4-kopfwege.e2e.ts` (31.8.2026, Runde 2 / Batch A);
// Datei-Kopf und Fälle unverändert, nur die Import-Zeilen sind oben
// zusammengeführt.
// ═══════════════════════════════════════════════════════════════════════════
// ─── H4-Vorbereitung II · die drei Wege aus der Kopfzeile ────────────────────
//
// Drei Befunde des Kontaktbogens H4 (`docs/ux-audit-2026-07/reader/leser-v3-h4/`),
// die alle dieselbe Frage stellen: **führt von der Kopfzeile aus genau EIN
// sichtbarer Weg zu jeder Handlung — und führt er überhaupt?**
//
//   (a) NM-2   Rechtsprechung: auf `mini` (@390) stand im Ruhezustand KEIN
//              Öffner in der Kopfzeile (gemessen 17.8.2026:
//              `[data-v3-panel-oeffner]` count 0). Der Weg über «···» →
//              «Entscheide & Kontext …» existierte, kostete aber ZWEI Taps
//              gegen einen auf D/S.
//   (b) Ä46    Schliessen: im Split-View trug jedes Pane ZWEI ✕ (Griffleiste
//              «Pane schliessen» y = 69, V3-Kopf «zur Gesetzesübersicht»
//              y = 113), unterscheidbar nur am Accessible Name.
//   (c) Ä79    Gliederung: @1440 mit eingeklappter Gliederung standen ZWEI ☰
//              für dieselbe Handlung (Kopf x = 1117, Schiene x = 184).
//
// ── ROT GESEHEN (§6.7), gemessen vor dem Fix am Stand 6ca1609b3 ─────────────
//  · (a) @390: «Erwartet mindestens 1 sichtbaren Öffner, gezählt 0».
//  · (b) Split: «✕ je Pane: 2, erwartet 1» (beide Panes).
//  · (c) @1440 eingeklappt: «☰ für ‹Gliederung öffnen›: 2, erwartet 1».
// Wieder rot zu bekommen ist jeder Fall an genau einer Stelle:
//  · (a) in `v3/kopfStufen.ts` `panel` auf `mini` wieder auf «weg» setzen,
//  · (b) in `v3/LeserKopf.tsx` das ✕ wieder einsetzen (H4-Nachzug 18.8.2026:
//        `zeigeSchliessKreuz` ist gestrichen, siehe (d) unten),
//  · (c) in `v3/LeserRahmenV3.tsx` den `schieneSteht`-Term aus `gliederungKnopf`
//        entfernen.

async function warteLeser(page: Page): Promise<void> {
  await expect(page.locator('[data-v3-kopf]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#art-1')).toBeAttached({ timeout: 20_000 })
}

/** Sichtbare ✕-Knöpfe je Pane. Gefasst am sichtbaren ZEICHEN, nicht an einer
 *  der drei Beschriftungen — genau darum ging Ä46: die Namen unterschieden
 *  sich, das Bild nicht (dieselbe Fassung wie in `leser-v3-eine-kopfzeile`). */
async function kreuzeJePane(page: Page): Promise<Record<string, string[]>> {
  return page.evaluate(() => {
    const sicht = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const raus: Record<string, string[]> = { primaer: [], sekundaer: [] }
    for (const b of document.querySelectorAll('button')) {
      if ((b.textContent ?? '').trim() !== '✕' || !sicht(b)) continue
      const kopf = b.closest('[data-pane-kopf]')
      const rolle = kopf?.getAttribute('data-pane-rolle')
        ?? b.closest('[data-pane]')?.getAttribute('data-pane')
      if (rolle && rolle in raus) raus[rolle].push(b.getAttribute('aria-label') ?? '?')
    }
    return raus
  })
}

test.describe('H4-II — ein Weg je Handlung aus der V3-Kopfzeile', () => {
  // ── (a) NM-2 · der Finger-Weg zur Rechtsprechung, auf JEDER Breite ────────
  for (const [tag, w, h] of [['H', 390, 844], ['S', 720, 900], ['D', 1280, 800]] as const) {
    test(`(a) NM-2 · ${tag} @${w}: die Kopfzeile trägt einen tapbaren Panel-Öffner`, async ({ page }) => {
      const fehler = fehlerSammeln(page)
      await page.setViewportSize({ width: w, height: h })
      await page.goto('/gesetze/bund/STPO#art-429')
      await warteLeser(page)
      await expect(page.locator('#art-429')).toBeAttached({ timeout: 20_000 })

      // DIE ZUSAGE: im RUHEZUSTAND steht mindestens ein sichtbarer, klickbarer
      // Öffner — kein Menü, das man erst aufziehen muss (das war der
      // NM-2-Verlust auf H: zwei Taps statt einem).
      const oeffner = page.locator('[data-v3-panel-oeffner]:visible')
      const anzahl = await oeffner.count()
      expect(anzahl, `@${w}: sichtbare Panel-Öffner im Ruhezustand`).toBeGreaterThanOrEqual(1)
      // Und höchstens einer — zwei Öffner für dieselbe Fläche waren Ä56.
      expect(anzahl, `@${w}: mehr als ein Öffner in der Kopfzeile`).toBeLessThanOrEqual(1)
      await expect(oeffner.first()).toBeEnabled()

      // EIN Tap führt zu den Entscheiden — nicht bloss zum Panel-Rahmen.
      await oeffner.first().click()
      await expect(page.locator('[data-v3-panel]')).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('[data-v3-panel] [data-v3-panel-gruppe]').first())
        .toBeVisible({ timeout: 20_000 })

      expect(fehler, fehler.join(' | ')).toEqual([])
    })
  }

  test('(a2) NM-2 · @390 bleibt die Kopfzeile bei vier Elementen', async ({ page }) => {
    // Design-Grundlage Kap. 6 («Kopfzeile im Ruhezustand ≤ 4 Elemente, davon
    // ≤ 2 reine Icons»). Der neue Zähler-Chip darf den Deckel nicht sprengen —
    // gemessen: Ort · ⚖ N · ☰ · ··· .
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    const m = await page.evaluate(() => {
      const zeile = document.querySelector('[data-v3-kopf]')!.firstElementChild!
      const griffe = zeile.lastElementChild!
      return {
        elemente: 1 /* Ort-Zone */ + griffe.children.length,
        breiteZeile: Math.round(zeile.getBoundingClientRect().width),
        breiteGriffe: Math.round(griffe.getBoundingClientRect().width),
      }
    })
    expect(m.elemente, `Kopfzeile @390 trägt ${m.elemente} Elemente`).toBeLessThanOrEqual(4)
    // Positiv-Sonde: die Zeile ist wirklich die gemessene 390-px-Zeile, sonst
    // wäre die Zählung oben grundlos grün (§6.7 b).
    expect(m.breiteZeile).toBeLessThanOrEqual(390)
    expect(m.breiteGriffe).toBeLessThan(m.breiteZeile)
  })

  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ───────────────────
  // Der Fall hiess «(a3) NM-2 · F8-Regel unberührt: Schalter aus ⇒ kein Zähler,
  // Menü-Weg bleibt» und legte dafür den Schalter «Rechtsprechung im Kopf» um.
  // Davids F8-Regel vom 16.8.2026 und ihre Messung bleiben als Beleg ihres
  // Datums stehen (§0 Ziff. 2b); der Schalter ist mit Variante A ERSATZLOS
  // gefallen, weil der Kopf keine Artikel-Zahl mehr trägt, die er hätte
  // verbergen können (`v3/leserOptionen.ts`, `v3/panelModell.ts`).
  // Was die NM-2-Sorge wirklich meinte — «auf `mini` führt ein Weg aus der
  // Kopfzeile zur Rechtsprechung» —, ist damit STÄRKER eingelöst: der Griff
  // steht dort unbedingt. Genau das prüft der Fall jetzt, und zusätzlich, dass
  // der tastaturlose Weg («r») unverändert daneben besteht.
  test('(a3) NM-2 · @390 steht der Weg zum Blatt unbedingt in der Kopfzeile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await expect(page.locator('[data-v3-panel-zaehler]')).toHaveCount(1)
    // Ein Tap, nicht zwei (der NM-2-Blocker war der Zwei-Tap-Weg übers Menü).
    await page.locator('[data-v3-panel-zaehler]').click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible({ timeout: 20_000 })
    await page.locator('[data-v3-panel-zu]').click()

    // Und im Menü steht kein ZWEITER Öffner daneben (Ä92, jetzt trivial erfüllt).
    await page.locator('[data-v3-ansicht]').click()
    await expect(page.locator('[data-v3-ansicht-panel]')).toBeVisible()
    await expect(page.locator('[data-v3-ansicht-panel-auf]')).toHaveCount(0)
    await page.keyboard.press('Escape')
  })

  // ── (b) Ä46 · ein ✕ je Pane ───────────────────────────────────────────────
  test('(b) Ä46 · Split-View: ein ✕ je Pane, die Rücksprung-Handlung bleibt sichtbar', async ({ page }) => {
    test.slow() // zwei volle Leser-Instanzen
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1600, height: 900 })
    await page.goto('/gesetze/bund/STPO?leser=v3&p=/gesetze/bund/BGFA%3Fleser%3Dv3')
    await expect(page.locator('[data-pane="sekundaer"] [data-v3-kopf]')).toBeVisible({ timeout: 25_000 })
    await page.waitForTimeout(800)

    const kreuze = await kreuzeJePane(page)
    for (const rolle of ['primaer', 'sekundaer'] as const) {
      expect(kreuze[rolle].length, `Pane «${rolle}» trägt ${kreuze[rolle].length} ✕: ${kreuze[rolle].join(' | ')}`).toBe(1)
      // Und das eine ist das der FENSTER-Steuerung — eine Inhaltsseite kann ihr
      // eigenes Fenster nicht schliessen, also gehört das ✕ der Griffleiste.
      expect(kreuze[rolle][0]).toMatch(/schliessen/)
    }

    // DIE HANDLUNG IST NICHT VERLOREN, sie steht sichtbar und BENANNT — seit
    // D27 (David 6.9.2026) nicht mehr als «‹ Gesetze» in der Ort-Zone des
    // Kopfes, sondern EINMAL für die ganze App in der Hauptnavigation. Das ist
    // die §6.3-Deklaration zu diesem Fall: dieselbe Zusage («der Weg zurück ist
    // benannt und da»), an dem Ort, an dem sie seither eingelöst wird — und
    // nicht mehr je Pane doppelt.
    await expect(page.locator('[data-v3-kopf-krume-kurz]'),
      'die Kopfzeile trägt wieder eine Brotkrume (D27)').toHaveCount(0)
    // ── D27 · WO DER WEG ZURÜCK JETZT STEHT (gemessen 6.9.2026) ─────────────
    // Die Hauptnavigation ist auf einer Leser-Seite EINGEKLAPPT (Vorgabe
    // `useSeitenleiste({ vorgabeEingeklappt: istGesetzLeserPfad })`) — gemessen
    // @1440 auf `/gesetze/bund/STPO`: `nav[aria-label="Hauptnavigation"]` count
    // **0**, der Umschalter in der Topbar count **1**, und nach einem Klick
    // darauf steht der Link `/gesetze` (count 1). Der Weg zurück ist also da und
    // ist einen Klick entfernt; die Krume war es auf `mini` faktisch auch (dort
    // stand nur noch «‹ Gesetze»). Geprüft wird beides, damit der Fall nicht
    // stumm grün wird, wenn eine Seite den Umschalter verliert.
    const umschalter = page.getByRole('button', { name: 'Seitenleiste ein- und ausblenden' }).first()
    await expect(umschalter, 'ohne Umschalter gibt es keinen Weg in die Hauptnavigation').toHaveCount(1)
    await umschalter.click()
    await expect(page.locator('nav[aria-label="Hauptnavigation"] a[href="/gesetze"]').first(),
      'der Weg zurück zur Gesetzes-Übersicht fehlt in der Hauptnavigation').toBeVisible({ timeout: 15_000 })
    await umschalter.click()

    expect(fehler, fehler.join(' | ')).toEqual([])
  })

  // ── (c) Ä79 · ein ☰ für die Gliederung ────────────────────────────────────
  test('(c) Ä79 · @1440 eingeklappt: ein ☰ für die Gliederung, und es ist die Schiene', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await page.waitForTimeout(400)

    await page.locator('[data-v3-gliederung-zu]').click()
    await expect(page.locator('[data-v3-gliederung-schiene]')).toBeVisible()

    // Die Schiene ist der Ort, an dem die Gliederung WAR und wieder erscheint —
    // der Kopf-☰ auf der Gegenseite des Fensters ist damit ein zweiter Knopf
    // für dieselbe Handlung (Ä79). Er tritt erst wieder auf, wenn es keine
    // Schiene gibt (unter der Schienen-Schwelle, Fall unten).
    await expect(page.locator('[data-v3-gliederung-auf]')).toHaveCount(0)

    // Und die Schiene TUT es auch — sonst wäre die Abwesenheit oben ein Verlust
    // statt einer Aufräumung (§6.7 b).
    await page.locator('[data-v3-gliederung-schiene]').click()
    await expect(page.locator('[data-v3-aside]')).toBeVisible({ timeout: 10_000 })
    expect(fehler, fehler.join(' | ')).toEqual([])
  })

  // ══ H4-NACHZUG (18.8.2026) · Ä87 · Ä91 · Ä90 · Ä92 ═══════════════════════
  //
  // Vier Befunde derselben Zeile, alle am gebauten H4-Stand gemessen
  // (`scratchpad/a-mess.cjs`, StPO Art. 429):
  //   Ä87  @1440 mit offenem Blatt ZWEI ✕, 47 px übereinander (Kopf y = 80,
  //        Blatt y = 127).
  //   Ä91  @720 FÜNF Elemente in der Zeile (Ort · ⚖ · ☰ · Ansicht · ✕) gegen
  //        einen Deckel von vier; und der Ansicht-Öffner trug drei Gesichter
  //        («···» · «◧▾» · «◧ Ansicht ▾»), weil das Wort an einem `lg:`-Präfix
  //        hing, also am Viewport statt am gemessenen Zuschnitt (Kap. 10).
  //   Ä90  @390 drei Bauformen (⚖ Chip 24 px · ☰ nackt 24 px · ··· Pille 28 px).
  //   Ä92  Chip UND Menü-Eintrag zugleich: zwei Öffner für eine Fläche.
  //
  // WIEDER ROT ZU BEKOMMEN — je Fall an genau einer Stelle:
  //   (d) in `v3/LeserKopf.tsx` das ✕ wieder einsetzen;
  //   (e) in `v3/LeserAnsichtV3.tsx` das Wort «Ansicht» wieder mit
  //       `className="hidden lg:inline"` versehen;
  //   (f) in `v3/kopfStufen.ts` `kopfGriffKlassen` auf `lc-leiste-griff`
  //       zurücksetzen (dann fehlt dem ☰ der Chip-Umriss und das 32-px-Ziel);
  //   (g) in `v3/LeserRahmenV3.tsx` `onPanelOeffnen` wieder unbedingt setzen.
  test('(d) Ä87 · @1440 mit offenem Blatt steht genau EIN ✕ — das des Blatts', async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/gesetze/bund/STPO#art-429')
    await warteLeser(page)
    await page.waitForTimeout(400)
    // Ruhezustand: gar kein ✕. D27 (§6.3): der Rücksprung steht seit 6.9.2026
    // nicht mehr in der Ort-Zone des Kopfes, sondern in der Hauptnavigation —
    // dieselbe Zusage, ein Ort statt je Lesefläche einer.
    await expect(page.locator('[data-v3-kopf-schliessen]')).toHaveCount(0)
    await expect(page.locator('[data-v3-kopf]').getByRole('link', { name: 'Gesetze' }))
      .toHaveCount(0)
    // ── D27 · WO DER WEG ZURÜCK JETZT STEHT (gemessen 6.9.2026) ─────────────
    // Die Hauptnavigation ist auf einer Leser-Seite EINGEKLAPPT (Vorgabe
    // `useSeitenleiste({ vorgabeEingeklappt: istGesetzLeserPfad })`) — gemessen
    // @1440 auf `/gesetze/bund/STPO`: `nav[aria-label="Hauptnavigation"]` count
    // **0**, der Umschalter in der Topbar count **1**, und nach einem Klick
    // darauf steht der Link `/gesetze` (count 1). Der Weg zurück ist also da und
    // ist einen Klick entfernt; die Krume war es auf `mini` faktisch auch (dort
    // stand nur noch «‹ Gesetze»). Geprüft wird beides, damit der Fall nicht
    // stumm grün wird, wenn eine Seite den Umschalter verliert.
    const umschalter = page.getByRole('button', { name: 'Seitenleiste ein- und ausblenden' }).first()
    await expect(umschalter, 'ohne Umschalter gibt es keinen Weg in die Hauptnavigation').toHaveCount(1)
    await umschalter.click()
    await expect(page.locator('nav[aria-label="Hauptnavigation"] a[href="/gesetze"]').first(),
      'der Weg zurück zur Gesetzes-Übersicht fehlt in der Hauptnavigation').toBeVisible({ timeout: 15_000 })
    await umschalter.click()


    await page.locator('[data-v3-panel-zaehler]').click()
    await expect(page.locator('[data-v3-panel]')).toBeVisible({ timeout: 20_000 })
    // Und mit offenem Blatt: genau eines, und zwar das des Blatts.
    // ── §6.3-DEKLARATION (W2·24-R6c, 6.9.2026) · OHNE DAS ✕ DER REITER ──────
    // Seit R2/D19 trägt jeder Reiter der Arbeitsleiste sein eigenes ✕ («Reiter
    // «Art. 429 StPO» schliessen», in `[data-reiter-streifen]`). Das schliesst
    // nicht den Leser oder sein Blatt, sondern das Register-Blatt, das ihn
    // zeigt — ein anderes Objekt, ausdrücklich bestellt (David 6.9.2026, D19).
    // Die Aussage dieses Falls — «mit offenem Blatt steht GENAU EIN ✕, und es
    // gehört dem Blatt» — bleibt Wort für Wort dieselbe und würde jedes
    // zurückkehrende Kopf-✕ unverändert melden.
    const kreuze = await page.evaluate(() => [...document.querySelectorAll('button')]
      .filter((b) => (b.textContent ?? '').trim() === '✕'
        && b.getBoundingClientRect().width > 0
        && !b.closest('[data-reiter-streifen], nav[aria-label="Offene Reiter"]'))
      .map((b) => ({ name: b.getAttribute('aria-label') ?? '?', y: Math.round(b.getBoundingClientRect().y) })))
    expect(kreuze.length, `✕ @1440 mit offenem Blatt: ${JSON.stringify(kreuze)}`).toBe(1)
    // §6.3-DEKLARATION (S6-W1a, 23.9.2026): das Blatt heisst seit C-1/D-5
    // überall «Erlass-Blatt» (bis dahin «Rechtsprechung und Kontext») — gewollte
    // Umbenennung; die Aussage «das eine ✕ gehört dem Blatt» bleibt dieselbe.
    expect(kreuze[0].name).toMatch(/^Erlass-Blatt schliessen$/)
    expect(fehler, fehler.join(' | ')).toEqual([])
  })

  test('(e) Ä91 · der Ansicht-Öffner hat ZWEI Gesichter, nicht drei — und @720 hält der Deckel', async ({ page }) => {
    // Ein Gesicht je Zuschnitt: «Ansicht ▾» auf `mini`, «◧ Ansicht ▾» sonst. Die
    // frühere dritte Gestalt «◧▾» trat genau zwischen 640 und 1023 px auf; die
    // Breiten unten liegen darum beidseits dieser Lücke.
    // ── NACHZUG G14 (Gesamtprüfung W2·24, 7.9.2026) ─────────────────────────
    // Das Handy-Gesicht war bis zu diesem Datum «···» — DREI Punkte ohne ein
    // Wort, gemessen am Vorstand `72b39d50c` neben «⚖ 163» und «☰» als dritte
    // nackte Glyphe der Zeile. Die ZUSAGE dieses Falls ist unberührt und wird
    // hier nicht gelockert: ZWEI Gesichter, nie drei, und «Ansicht» steht auf
    // jeder Breite über 640 px. Neu ist, dass das Wort auch DARUNTER steht —
    // die Erwartung @390 wandert deshalb von «···» auf «Ansicht▾» (fachliche
    // Änderung, §6.3: deklariert, nicht beiläufig). Herleitung, Messreihe und
    // die §7-Abweichung zum Auftragswortlaut: `v3/LeserPanelOeffner.tsx`;
    // der eigene Wächter steht in `e2e/leser-w224-g.e2e.ts` (G14).
    const gesichter = new Map<number, string>()
    for (const [w, h] of [[390, 844], [720, 900], [900, 900], [1024, 800], [1440, 900]] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.goto('/gesetze/bund/STPO')
      await warteLeser(page)
      await page.waitForTimeout(300)
      const m = await page.evaluate(() => {
        const zeile = document.querySelector('[data-v3-kopf]')!.firstElementChild!
        const griffe = zeile.lastElementChild!
        const oeffner = document.querySelector('[data-v3-ansicht]')!
        return {
          gesicht: (oeffner.textContent ?? '').replace(/\s+/g, ''),
          elemente: 1 /* Ort-Zone */ + griffe.children.length,
          ueberlauf: zeile.scrollWidth - zeile.clientWidth,
        }
      })
      gesichter.set(w, m.gesicht)
      expect(m.elemente, `Kopfzeile @${w} trägt ${m.elemente} Elemente`).toBeLessThanOrEqual(4)
      expect(m.ueberlauf, `Kopfzeile @${w} läuft über (${m.ueberlauf} px)`).toBeLessThanOrEqual(0)
    }
    const verschiedene = new Set(gesichter.values())
    expect(verschiedene.size,
      `Ansicht-Öffner zeigt ${verschiedene.size} Gesichter: ${JSON.stringify([...gesichter])}`).toBe(2)
    expect(gesichter.get(390)).toBe('Ansicht▾')
    // Und das Wort steht ÜBERALL sonst — auch unter 1024 px, wo das `lg:`-Präfix
    // es verschluckte (das ist der Kern von Ä91).
    for (const w of [720, 900, 1024, 1440]) {
      expect(gesichter.get(w), `@${w}: der Öffner zeigt «${gesichter.get(w)}»`).toContain('Ansicht')
    }
    // G14: … und seit 7.9.2026 auch @390 — dort ohne das ◧, das die zwei
    // Gesichter weiterhin unterscheidet.
    expect(gesichter.get(390), 'auch @390 steht das Wort').toContain('Ansicht')
  })

  test('(f) Ä90 · @390 tragen alle Kopf-Griffe EINE Bauform und ein 32-px-Ziel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO#art-429')
    await warteLeser(page)
    await page.waitForTimeout(400)
    const griffe = await page.evaluate(() => [...document.querySelectorAll(
      '[data-v3-kopf-griffe] > *, [data-v3-kopf-griffe] > div > button')]
      .filter((e) => e.tagName === 'BUTTON')
      .map((e) => {
        const r = e.getBoundingClientRect()
        const cs = getComputedStyle(e)
        return { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderTopLeftRadius }
      }))
    // G14 (7.9.2026): die drei heissen seither «Rechtsprechung N» · «Gliederung»
    // · «Ansicht ▾». Ihre ZAHL ist unverändert drei — nur die Beschriftung fiel
    // vorher weg (Wächter `e2e/leser-w224-g.e2e.ts`).
    // D35-F2 (7.9.2026, ERGÄNZUNG): der erste heisst seither «Erlass ▾» und
    // trägt keine Zahl mehr; die Zahl DREI ist unverändert.
    expect(griffe.length, 'auf `mini` stehen drei Griffe').toBe(3)
    // EINE Bauform: gleiche Fläche, gleiche Rundung, gleiche Höhe.
    expect(new Set(griffe.map((g) => g.bg)).size, `Flächen: ${griffe.map((g) => g.bg).join(' | ')}`).toBe(1)
    expect(new Set(griffe.map((g) => g.radius)).size).toBe(1)
    expect(new Set(griffe.map((g) => g.h)).size).toBe(1)
    // Und ein Ziel, das ein Finger trifft (32 px; WCAG 2.5.8 verlangt 24).
    for (const g of griffe) {
      expect(g.h, `Griff ${g.w}×${g.h}`).toBeGreaterThanOrEqual(32)
      expect(g.w, `Griff ${g.w}×${g.h}`).toBeGreaterThanOrEqual(32)
    }
  })

  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ───────────────────
  // Der Fall hiess «Chip ODER Menü-Eintrag, nie beide» und schaltete dafür
  // zwischen den zwei Lagen hin und her. Die Ä92-Messung vom 18.8.2026 (chip 1
  // UND Eintrag 1 = zwei Öffner für eine Fläche) bleibt stehen (§0 Ziff. 2b).
  // Mit D35-F2 gibt es nur noch EINE Lage: der Griff steht auf jeder Breite,
  // der Menü-Eintrag «Entscheide & Kontext …» ist ersatzlos gestrichen. Die
  // Zusage «ein Öffner je Breite» wird damit strenger geprüft als vorher —
  // «genau einer», ohne Fallunterscheidung.
  test('(g) Ä92 · genau EIN Öffner je Breite, ohne Fallunterscheidung', async ({ page }) => {
    for (const [w, h] of [[390, 844], [1440, 900]] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.goto('/gesetze/bund/STPO')
      await warteLeser(page)
      await page.waitForTimeout(300)
      await expect(page.locator('[data-v3-panel-zaehler]')).toHaveCount(1)
      await page.locator('[data-v3-ansicht]').click()
      await expect(page.locator('[data-v3-ansicht-panel]')).toBeVisible()
      await expect(page.locator('[data-v3-ansicht-panel-auf]'),
        `@${w}: Menü-Eintrag steht neben dem Griff`).toHaveCount(0)
      await page.keyboard.press('Escape')
      // Der Sammel-Marker zählt ALLE Öffner (`OEFFNER_SELEKTOR`, `panelModell`)
      // — er ist der Grund, aus dem ein dritter nicht unbemerkt entstehen kann.
      await expect(page.locator('[data-v3-panel-oeffner]'),
        `@${w}: mehr als ein Öffner für dieselbe Fläche`).toHaveCount(1)
      await page.locator('[data-v3-panel-zaehler]').click()
      await expect(page.locator('[data-v3-panel]')).toBeVisible({ timeout: 20_000 })
      await page.locator('[data-v3-panel-zu]').click()
    }
  })

  test('(c2) Ä79 · @390 gibt es keine Schiene — dort bleibt der Kopf-☰', async ({ page }) => {
    // Die Gegenprobe: der Kopf-☰ wird nicht generell gestrichen, sondern nur
    // dort, wo die Schiene dieselbe Handlung sichtbar trägt.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/gesetze/bund/STPO')
    await warteLeser(page)
    await expect(page.locator('[data-v3-gliederung-schiene]')).toHaveCount(0)
    await expect(page.locator('[data-v3-gliederung-auf]')).toBeVisible()
  })
})


// ═══════════════════════════════════════════════════════════════════════════
// TEIL 3 · W2·5d U-KOPF/A9 — Bedienbarkeit unter CPU-Drossel, CLS 0
// Wortlaut übernommen aus `e2e/leser-kopf-a9.e2e.ts` (31.8.2026, Runde 2 / Batch A);
// Datei-Kopf und Fälle unverändert, nur die Import-Zeilen sind oben
// zusammengeführt.
// ═══════════════════════════════════════════════════════════════════════════


// W2·5d U-KOPF — A9-Querschnitt (Bedienbarkeit + Flüssigkeit unter CPU-Throttle).
// Beweist, dass die Kopf-Interaktionen (A4 «Ansicht»-Dropdown öffnen +
// Switches togglen, Gliederungs-/TOC-Sprung) auch gedrosselt ohne spürbaren Lag
// laufen und KEINEN Layout-Shift verursachen (CLS 0). BV#art-8: klein, aber
// geschachtelt (2-Spalten-Lesemodus mit TOC) → deckt die A-Punkte ab.
// A27: der In-Erlass-Kontextkopf/Breadcrumb ist entfernt, der Sprung-Schritt
// nutzt die TOC.
//
// Drossel, Reaktions-Budget, Latte und Container-Deckel kommen aus
// `./helpers/budgets` — dort steht auch die Kalibrierungs-Empirie, die bis zum
// 14.8.2026 hier lag und in drei weiteren Specs als blosser Verweis stand (§5).

test('A9: «Ansicht»-Dropdown + Gliederungs-Sprung flüssig unter CPU-Throttle, CLS 0', async ({ page }) => {
  test.setTimeout(CONTAINER_BUDGET_CI ?? CONTAINER_LOKAL_READER);
  const fehler = fehlerSammeln(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: DROSSEL });

  await page.goto('/gesetze/bund/BV#art-8');
  const trigger = page.getByRole('button', { name: 'Ansicht' }).first();
  await expect(trigger).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#art-8')).toBeVisible({ timeout: 20000 });
  await page.locator('#art-8').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400); // Scroll-Spy den Pfad setzen lassen

  // CLS-Beobachter für den GESAMTEN Interaktionsfluss (nur künftige Shifts; jede
  // toggle-/klick-getriebene Verschiebung liegt binnen 500 ms nach Input =
  // input-exkludiert → darf 0 bleiben).
  await page.evaluate(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as PerformanceEntry[]) {
        const s = e as unknown as { value: number; hadRecentInput: boolean };
        if (!s.hadRecentInput) (window as unknown as { __cls: number }).__cls += s.value;
      }
    }).observe({ type: 'layout-shift' });
  });

  // A4: Dropdown öffnen (Budget grosszügig, gedrosselt).
  let t0 = Date.now();
  await trigger.click();
  const gruppe = page.locator(ANSICHT_PANEL).first();
  await expect(gruppe).toBeVisible({ timeout: REAKTIONS_LATTE });
  expect(Date.now() - t0, 'Dropdown öffnen zu langsam').toBeLessThan(REAKTIONS_BUDGET);

  // A4: die Switches togglen — jeder reagiert ohne Hänger. «Linien» ist mit dem
  // Linien-Rückbau V1 (16.8.2026, Entscheid David 13.8.2026) aus dem Menü
  // entfallen, «Verweise» mit dem Optionen-Rückbau S1 (17.8.2026, Entscheid
  // David F2); an seine Stelle tritt der zweite verbliebene Schalter
  // «Änderungsvermerke». Geprüfter Sachverhalt (Reaktionszeit je Schalter unter
  // Drossel) unverändert (§6.3: deklariert). Der Testerlass BV trägt 131
  // `kl:'A'`-Fussnoten, der Schalter ist dort also angeboten (S1-Nachzug B3).
  // Ä116 (18.8.2026): der zweite Schalter heisst in V3 «Fassung», in der
  // Ist-Hülle weiter «Änderungsvermerke» (helpers/leserBeschriftung).
  // D35-F3 (§6.3, Entscheid David 7.9.2026): die beiden sind Stellungen EINER
  // Radiogruppe geworden (`menuitemradio`). Geprüfter Sachverhalt unverändert —
  // Reaktionszeit je Bedienung unter Drossel.
  for (const name of [/^Fussnoten/, VERMERKE_SCHALTER_NAME] as const) {
    t0 = Date.now();
    const sw = gruppe.getByRole(WAHL_ROLLE, { name });
    const vorher = await sw.getAttribute('aria-checked');
    await sw.click();
    await expect(sw).not.toHaveAttribute('aria-checked', vorher ?? '', { timeout: REAKTIONS_LATTE });
    expect(Date.now() - t0, `Stellung «${name}» zu langsam`).toBeLessThan(REAKTIONS_BUDGET);
  }

  // Dropdown schliessen (Escape), dann Gliederungs-Sprung: TOC-Klick springt
  // flüssig (A27: der In-Erlass-Kontextkopf/Breadcrumb ist entfernt — der
  // verbliebene In-Seiten-Sprung ist die TOC-Gliederung, springeZuSektion).
  await page.keyboard.press('Escape');
  await expect(gruppe).toBeHidden();
  const glied = page.locator('[data-toc] [data-toc-aktiv]').first();
  await expect(glied).toBeVisible();
  t0 = Date.now();
  await glied.click();
  await page.waitForTimeout(600);
  expect(Date.now() - t0, 'Gliederungs-Sprung zu langsam').toBeLessThan(REAKTIONS_BUDGET);

  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  // CLS über den gesamten Fluss == 0.
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  expect(cls, 'CLS über Dropdown/Toggle/Breadcrumb muss 0 sein').toBe(0);
  // Keine Konsolen-/Laufzeitfehler.
  expect(fehler).toEqual([]);
});


// ═══════════════════════════════════════════════════════════════════════════
// TEIL 4 · H1 — ein Vertrag für drei Breiten (Pane-Parität)
// Wortlaut übernommen aus `e2e/leser-kopf-paritaet.e2e.ts` (31.8.2026, Runde 2 / Batch A);
// Datei-Kopf und Fälle unverändert, nur die Import-Zeilen sind oben
// zusammengeführt.
//
// ⚠ «PARITÄT» MEINT NICHT V2↔V3 (Vermerk 31.8.2026). Der Ent-Regulierungs-
// Auftrag führte `leser-kopf-paritaet` als «V2-Erbe, Paritäts-Zweck entfällt»;
// die Ist-Prüfung am Code hat das WIDERLEGT. Geprüft wird die PANE-Parität —
// Einzelansicht, primäres und sekundäres Split-Pane tragen denselben V3-Kopf.
// Das ist eine reine V3-Eigenschaft und war nie ein Hüllen-Vergleich. Beleg:
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §7 Ziff. 2.
// ═══════════════════════════════════════════════════════════════════════════
// FAHRPLAN-LESER-V3, Etappe H1 — die zentrale H1-Zusicherung (siehe
// LeserKopf.tsx-Kopf): «EIN VERTRAG FÜR DREI BREITEN» — dieselbe Komponente,
// dieselben Bedienelemente in der Einzelansicht, im primären UND im
// sekundären Pane. `LeserKopf` kennt keine `imPane`-Verzweigung; wäre das
// falsch, bräuchte jede Etappe eine zweite Umschalt-Stelle (Kap. 10, Ziel
// «Kopf-/Layout-Verzweigungen 21 → 0»).
//
// WEG ZUM SPLIT-VIEW: das A16-Idiom aus `leser-position-u.e2e.ts` (AIG Art. 5
// → Fremdverweis-Popover → StGB) — hier NICHT «Im Gesetz öffnen» (echte
// Navigation), sondern «nebeneinander öffnen» (NormPopover.tsx), damit das
// Hauptfenster ein GESETZ bleibt (AIG in V3) und das Pane ein zweites Gesetz
// (StGB in V3) daneben aufschlägt — beide zugleich in V3, weil FL-1 dasselbe
// Flag ohne zweite Umschalt-Stelle in beide Panes trägt.
//
// GEPRÜFT WIRD DAS ELEMENT-INVENTAR, NICHT PIXEL: beide `[data-v3-kopf]`
// tragen Kürzel, Ansicht-Öffner und den Rücksprung zur Übersicht — unabhängig
// von der (unterschiedlichen) gemessenen Breite jedes Panes
// (`kopfElemente(stufe)` lässt nur Volltitel fallen, nie diese drei, und die
// Krume schrumpft, statt zu verschwinden — `./kopfStufen.ts`).
//
// ── Ä46 (H4-II, 17./18.8.2026) · DER RÜCKSPRUNG STATT DES ✕ ────────────────
// Bis hierher stand in dieser Liste das ✕ des V3-Kopfes. Gemessen im Split
// @1600 trug jedes Pane damit ZWEI sichtbare ✕, 44 px übereinander: die
// Pane-Griffleiste («Hauptfenster schliessen» / «‹BGFA› schliessen», y = 69)
// und dieser Kopf («Gesetz schliessen — zur Gesetzesübersicht», y = 113).
// Gleiches Zeichen, gleiche Ecke, verschiedene Wirkung, unterscheidbar allein
// am Accessible Name — genau der Befund Ä46.
// DIE PARITÄTS-AUSSAGE IST UNVERÄNDERT (§6.3): geprüft wird weiter, dass beide
// Panes DENSELBEN Kopf mit DENSELBEN Bedienelementen tragen. Nur trägt die
// Rücksprung-Handlung im Pane jetzt ihren Namen («‹ Gesetze») statt ein zweites
// Mal dasselbe Zeichen; das Ziel `/gesetze` und die pane-lokale Auflösung sind
// dieselben. Dass je Pane genau EIN ✕ übrig ist, misst
// `leser-v3-h4-kopfwege` (b).

test('H1 — beide Split-View-Panes tragen denselben V3-Kopf (Kürzel, Ansicht-Öffner, Rücksprung)', async ({ page }) => {
  test.slow() // schwere Split-View-Interaktion (Präzedenz A17/FL-1)
  const fehler = fehlerSammeln(page)
  await page.setViewportSize({ width: 1440, height: 900 })

  // Hauptfenster: AIG in V3, an Art. 5 (derselbe Anker-Pfad wie A16).
  await page.goto('/gesetze/bund/AIG')
  await expect(page.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  const art5 = page.locator('#art-5')
  await expect(art5).toBeAttached({ timeout: 20_000 })
  await art5.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)

  // Fremdverweis (StGB) öffnen → Popover mit «nebeneinander öffnen» (NICHT
  // «Im Gesetz öffnen» — das wäre echte Navigation und liesse kein Pane
  // entstehen).
  const stgbLink = art5.locator('a[href*="54/757_781_799"][href*="#art_66_a"]:not([href*="66_a_bis"])').first()
  await expect(stgbLink).toBeVisible({ timeout: 10_000 })
  await stgbLink.click()
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /nebeneinander öffnen/ }).click()

  const pane = page.locator('[data-pane="sekundaer"]')
  await expect(pane).toBeVisible({ timeout: 10_000 })
  await expect(pane.locator('[data-leser-v3="rahmen"]')).toBeVisible({ timeout: 20_000 })
  await expect(pane.locator('#art-66_a')).toBeAttached({ timeout: 20_000 })

  // Primäres Fenster steht jetzt ebenfalls unter `data-pane="primaer"`
  // (Shell.tsx setzt das Attribut erst, sobald ein zweites Pane offen ist).
  const primaer = page.locator('[data-pane="primaer"]')
  await expect(primaer).toBeVisible({ timeout: 10_000 })
  await expect(primaer.locator('[data-v3-kopf]')).toBeVisible()
  await expect(pane.locator('[data-v3-kopf]')).toBeVisible()

  // Das Element-Inventar: Kürzel · Ansicht-Öffner · Such-Zone — in BEIDEN Panes.
  // §6.3-DEKLARATION D27/D28 (David 6.9.2026): der Rücksprung «‹ Gesetze» war
  // bis 6.9. Teil dieses Inventars; er steht seither einmal in der
  // Hauptnavigation (Prüfung unten). An seine Stelle tritt die Erlass-Suche —
  // die ist mit D28 in JEDEM Pane im Kopf-Block, auch mit stehender Gliederung.
  for (const wurzel of [primaer, pane]) {
    const kopf = wurzel.locator('[data-v3-kopf]')
    await expect(kopf.locator('[data-v3-kopf-kuerzel]')).toBeVisible()
    await expect(kopf.locator('[data-v3-ansicht]')).toBeVisible()
    await expect(kopf.locator('[data-v3-such-zone] input')).toBeVisible()
    // D27: keine Brotkrume, keine Lesestellung mehr in dieser Zeile.
    await expect(kopf.locator('[data-v3-kopf-krume-kurz]')).toHaveCount(0)
    await expect(kopf.locator('[data-v3-kopf-artikel]')).toHaveCount(0)
    // Und der V3-Kopf trägt hier kein ✕ mehr — sonst stünden wieder zwei.
    await expect(kopf.locator('[data-v3-kopf-schliessen]')).toHaveCount(0)
  }
  // D27: der Weg zurück steht in der Hauptnavigation, die auf Leser-Seiten
  // eingeklappt startet — der Umschalter in der Topbar ist der eine Griff dahin
  // (Messung im Fall (b) dieser Datei).
  await expect(page.getByRole('button', { name: 'Seitenleiste ein- und ausblenden' }).first())
    .toHaveCount(1)
  // Und die Kürzel unterscheiden sich inhaltlich (zwei verschiedene Gesetze,
  // keine zufällige Doppelung, die den Vergleich entwerten würde).
  const kuerzelPrimaer = (await primaer.locator('[data-v3-kopf-kuerzel]').textContent())?.trim()
  const kuerzelPane = (await pane.locator('[data-v3-kopf-kuerzel]').textContent())?.trim()
  expect(kuerzelPrimaer).toBe('AIG')
  expect(kuerzelPane).toBe('StGB')

  expect(fehler).toEqual([])
})
