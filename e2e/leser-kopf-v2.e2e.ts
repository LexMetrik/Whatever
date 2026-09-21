// @shard-gruppe: 8
import { test, expect, type Page } from '@playwright/test';
import { ANSICHT_PANEL, VERMERKE_SCHALTER_NAME, WAHL_ROLLE } from './helpers/leserBeschriftung';

// ⚠ DER DATEINAME MEINT NICHT DEN LESER V2 (Vermerk 31.8.2026, Runde 2 / Batch A).
// «V2» ist hier die FAHRPLAN-Etappe GESETZESDARSTELLUNG-V2, nicht die alte
// Leser-Hülle. Alle vier Fälle unten prüfen den heute ausgelieferten V3-Stand —
// B-1 greift ausdrücklich `[data-v3-panel]`-Selektoren. Der Ent-Regulierungs-
// Auftrag vom 31.8.2026 führte diese Datei als «V2-Erbe, streichen»; die
// Ist-Prüfung am Code hat das WIDERLEGT, sie bleibt vollständig erhalten.
// Beleg: bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §7 Ziff. 2.
//
// FAHRPLAN-GESETZESDARSTELLUNG-V2 — koordinierter Kopf-PR (A22/A23, David 10.7.2026):
//   · K-1  «in Kraft seit …» in der Meta-Zeile (Ur-Inkrafttreten, Fedlex
//          dateEntryInForce, build-time projiziert ⇒ CLS 0); nur Bund.
//   · K-2  Fussnoten-Bedienung — seit A26 (David 11.7.2026) EINTRAG im «Ansicht»-
//          Dropdown (Zähler N im Accessible-Name, role=switch); CLS 0 beim Toggle.
//   · B-1  «Entscheide»-Schalter im Ansicht-Dropdown blendet die BGE-Leitfall-
//          Auflistung aus (Facetten-Wahl im Dropdown «Rechtsprechung ▾»).
//   · B-2  Zeitraum-Wahl «alle · 20 · 10 · 5 J.» — ENTFALLEN mit W2·7-BEZUG/B5
//          (David 28.7.2026). An ihre Stelle tritt der Zeitstrahl mit
//          Von-Bis-Datum im Dropdown «Rechtsprechung ▾»
//          (`bezuege-zeitstrahl-b5.e2e.ts`); der Test unten prüft jetzt die
//          ABWESENHEIT der Alt-Steuerung — §6.3-Deklaration an Ort.
//
// ── H4-UMHÄNGUNG (Flip 18.8.2026, Kontaktbogen H4 §7) ───────────────────────
// Zwei Nachführungen, beide gemessen:
//
// (1) K-2 fasste die Fussnotenmarke über `.lc-leser button[aria-label^=
//     "Fussnote"]`. Nach dem Flip greift dieser Selektor den MENÜ-SCHALTER
//     «Fussnoten (26)» statt der Marke im Text (gemessen 18.8.2026: 24 × auf
//     `role=switch` aufgelöst) — der Test hätte dann geprüft, ob sich der
//     Schalter selbst versteckt. Ziel ist `[data-fn-ref]`, die Marke selbst;
//     dieselbe Korrektur hat `leser-v3-umschalten` schon vollzogen.
// (2) B-1 mass die Facetten-Wirkung an der Bezüge-Zeile UNTER dem Artikel. Die
//     gibt es in V3 nicht mehr — H3 hat sie bewusst entfernt (Pos. 12,
//     Entscheid F4), die Entscheide stehen im Panel. Der Test misst die
//     GLEICHE Sache am neuen Ort: Facette ab ⇒ keine Auflistung, Facette an ⇒
//     wieder da. Ein blosses Löschen wäre falsch gewesen — keine `leser-v3-*`-
//     Spec prüfte diese Wirkung (nachgesehen in `leser-v3-panel-facetten`,
//     `-panel-zaehler`, `-panel-nachzug`: dort steht die ANWESENHEIT der
//     Facetten, nicht ihre Wirkung auf die Liste).
//
// ── P1-3 (Bug-Check 18.8.2026) · DIE ERHÖHTEN WARTEZEITEN, DEKLARIERT ───────
// Derselbe Umhäng-Commit (`b92a5956c`) hat in B-1 zwei Wartezeiten von 15 000 auf
// 20 000 ms gesetzt und für das Panel eine dritte mit 20 000 ms neu angelegt —
// still, ohne Vermerk. Das wird hier nachgeholt: eine unbegründet verlängerte
// Wartezeit ist von einer LOCKERUNG nicht zu unterscheiden (§6.3).
//
// SIE IST KEINE LOCKERUNG, sondern die Folge des UMZUGS. B-1 mass die
// Facetten-Wirkung früher an der Bezüge-Zeile, die MIT dem Artikel gerendert
// wurde; sie misst sie jetzt im Kontext-Panel, das erst auf Nutzer-Geste öffnet
// und seine Sidecars DANN nachlädt (`v3/panelKontextLaden.ts`: Fetch erst, wenn
// das Panel einmal offen war — ausdrücklich nicht beim Seitenaufruf). Die
// Wartezeit deckt jetzt einen Netzweg mit, den es an der alten Stelle nicht gab.
// 20 000 ms ist dabei kein neuer Wert, sondern genau der, den die beiden
// Reader-Wartungen dieser Datei (`warteReader`) schon vorher trugen.
// GEPRÜFTE AUSSAGE UNVERÄNDERT: Facette ab ⇒ keine Auflistung, Facette an ⇒
// wieder da. Keine Assertion entfernt, keine aufgeweicht.
//
// NICHT BETROFFEN ist `gesetze-ux-g3a`: der Bug-Check nannte sie in einem Atemzug
// mit dieser Datei; nachgesehen 18.8.2026 (`git show b92a5956c -- …`) hat der
// Commit dort KEINE Wartezeit angefasst — ihr einziger 20 000er
// (`warteVerweiskarte`) stand schon vorher so da, nur mit einem anderen Selektor.

async function warteReader(page: Page, url: string, artId: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator(`#${artId}`)).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
}

// IDEMPOTENT (D35-F3): ein Klick auf eine Menü-Zeile schliesst das Panel NICHT —
// ein zweiter blinder Klick auf «Ansicht» klappte es zu.
async function ansichtOeffnen(page: Page): Promise<void> {
  const panel = page.locator(ANSICHT_PANEL).first();
  if (!(await panel.isVisible())) {
    await page.getByRole('button', { name: 'Ansicht' }).first().click();
  }
  await expect(panel).toBeVisible();
}

test('K-1: «in Kraft seit» in der Meta-Zeile (Bund), nicht beim Kanton', async ({ page }) => {
  // Bund BGBM: Ur-Inkrafttreten 01.07.1996 (Fedlex dateEntryInForce), distinkt vom Stand.
  await warteReader(page, '/gesetze/bund/BGBM', 'art-1');
  const zeile = page.getByText(/in Kraft seit\s+01\.07\.1996/);
  await expect(zeile).toBeVisible({ timeout: 15000 });
});

test('K-2 (A26): Fussnoten-Eintrag im «Ansicht»-Dropdown — Zähler + Toggle (aria-checked), CLS 0', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BGBM', 'art-1');
  // A26 (David 11.7.2026): der frühere separate Fussnoten-Chip ist als EINTRAG ins
  // «Ansicht»-Dropdown gewandert — mit dem Zähler N im Accessible-Name
  // («Fussnoten (N)»). Rollen-Historie: bis D4/7.9.2026 `switch`, dann
  // `menuitemcheckbox`, seit D35-F3 (Entscheid David 7.9.2026) `menuitemradio` —
  // «Fussnoten» ist eine der drei Stellungen der Änderungs-Wahl geworden
  // (§6.3-Deklaration; DER ZÄHLER selbst ist unangetastet, A26 gilt Wort für
  // Wort weiter). Menü öffnen und darauf zugreifen.
  await ansichtOeffnen(page);
  const gruppe = page.locator(ANSICHT_PANEL).first();
  // LM-025 (B8, 31.8.2026): der Accessible Name erklärt die Zahl jetzt —
  // «Fussnoten (932 im Erlass)» statt der unerklärten «(932)».
  const fn = gruppe.getByRole(WAHL_ROLLE, { name: /^Fussnoten \(\d+ im Erlass\)$/ });
  await expect(fn).toBeVisible({ timeout: 15000 });
  // Vorgabe ist «Fassung» — der Zähler-Eintrag steht also NICHT gewählt da.
  await expect(fn).toHaveAttribute('aria-checked', 'false');

  const marker = page.locator('.lc-leser [data-fn-klasse="A"] [data-fn-ref]').first();
  await expect(marker).toBeHidden();

  // CLS-Beobachter (nur künftige Shifts): der toggle-getriebene Reflow liegt binnen
  // 500 ms nach dem Klick (input-exkludiert) und darf 0 bleiben.
  await page.evaluate(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as PerformanceEntry[]) {
        const s = e as unknown as { value: number; hadRecentInput: boolean };
        if (!s.hadRecentInput) (window as unknown as { __cls: number }).__cls += s.value;
      }
    }).observe({ type: 'layout-shift' });
  });

  // «Fussnoten» wählen: aria-checked=true, data-vermerke=fussnoten, A-Marker da.
  await fn.click();
  await expect(fn).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');
  await expect(marker).toBeVisible();

  // Zurück auf «Fassung»: der A-Marker verschwindet wieder (display:none).
  await ansichtOeffnen(page);
  await gruppe.getByRole(WAHL_ROLLE, { name: VERMERKE_SCHALTER_NAME }).click();
  await expect(fn).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fassung');
  await expect(marker).toBeHidden();

  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  expect(cls, 'CLS über die Änderungs-Wahl muss 0 sein').toBe(0);
});

// B-1/B-2 laufen bewusst auf dem KLEINEN ELG (~78 KB Snapshot, Leitfall-Shard mit
// BGE an Art. 10) statt auf dem 1686-Artikel-OR: dessen Client-Takeover starvte den
// gedrosselten 2-Kern-CI-Runner ins 30s-Timeout (CI-Run 29139277748, dieselbe Lehre
// wie leser-optionen → BGBM, CI-Befund 4.7.2026). Die Toggle-/Filter-Semantik ist
// seitengrössen-unabhängig (Attribut + CSS bzw. Store).
// §6.3-DEKLARATION (28.7.2026, W2·7-BEZUG/B4 — Vorgabe David «bezüge kann weg, nur
// auflistung wenn aktiviert»): Die V1a-Chip-Reihe mit der Overline «Leitfälle» und
// der Schalter «Entscheide» im Ansicht-Menü sind ENTFALLEN. Der Artikelfuss zeigt
// die facettierte Auflistung (Gruppenkopf «LEITENTSCHEIDE n von m»), gesteuert vom
// Dropdown «Rechtsprechung ▾»; ohne aktive Facette steht dort nichts. Die
// Nachführung ist Teil dieser deklarierten fachlichen Änderung — der geprüfte
// Sachverhalt bleibt, nur die Darstellung, an der er gemessen wird, ist neu.
test('B-1: die Facetten-Wahl blendet die Entscheid-Auflistung aus und wieder ein', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/ELG', 'art-1');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#art-10').scrollIntoViewIfNeeded();

  // Der Ort der Auflistung ist seit H3 das Panel, nicht der Artikelfuss (Pos. 12).
  await page.locator('[data-v3-panel-zaehler]').first().click();
  const panel = page.locator('[data-v3-panel]');
  await expect(panel).toBeVisible({ timeout: 20000 });

  // Grundzustand: eine Facette aktiv (Leitentscheide) ⇒ die Auflistung steht da.
  const gruppe = panel.locator('[data-v3-panel-gruppe="bge"]');
  await expect(gruppe).toBeVisible({ timeout: 20000 });
  await expect(panel.locator('[data-v3-panel-entscheid]').first()).toBeVisible();

  // AUS: letzte Facette abwählen ⇒ KEINE Auflistung mehr. Anders als der frühere
  // CSS-Schalter versteckt das nicht bloss — es wird auch nichts geladen.
  const filter = panel.locator('[data-v3-panel-filter]');
  await filter.locator('[data-v3-panel-klappe]').first().click();
  const bge = filter.locator('[data-bezug-klasse="bge"]');
  await expect(bge).toHaveAttribute('aria-pressed', 'true'); // Default an
  await bge.click();
  await expect(panel.locator('[data-v3-panel-gruppe="bge"]')).toHaveCount(0);
  await expect(panel.locator('[data-v3-panel-entscheid]')).toHaveCount(0);

  // AN zurück: Auflistung wieder da.
  await bge.click();
  await expect(gruppe).toBeVisible({ timeout: 20000 });
  await expect(panel.locator('[data-v3-panel-entscheid]').first()).toBeVisible();
});

// §6.3-DEKLARATION (deklarierte fachliche Änderung, kein Refactoring):
// Dieser Test mass die Stufen-Wahl «alle · 20 · 10 · 5 J.» im «Ansicht ▾»-Menü —
// eine Steuerung, die David am 28.7.2026 ausdrücklich ersetzt hat («zeitstrahl
// und datumseingabe anstatt 5 jahre 10 jahre usw.») und die seit B4 ohnehin auf
// nichts mehr wirkte: ihre einzige Verbraucherin, die `LeitfallZeile`, wird vom
// Reader nicht mehr bedient. Der Test wurde NICHT angepasst, damit er grün wird,
// sondern UMGEDREHT, weil sein Prüfgegenstand entfernt wurde. Was er einst
// sachlich absicherte (Auswahl wirkt, Auswahl persistiert), prüft jetzt
// `bezuege-zeitstrahl-b5.e2e.ts` am Nachfolger — strenger, weil dort auch die
// Wirkung auf die Auflistung und die Ehrlichkeit der Zähler mitläuft.
//
// Was hier BLEIBT, ist der Wächter gegen die Rückkehr: eine entfernte Steuerung,
// die niemand vermisst, schleicht sich beim nächsten Merge sonst wieder ein.
test('B-2: die Alt-Zeitraum-Wahl ist aus dem Ansicht-Menü ENTFERNT (B5)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/ELG', 'art-1');
  await ansichtOeffnen(page);
  const panel = page.locator(ANSICHT_PANEL).first();
  await expect(panel).toBeVisible();
  await expect(page.locator('[aria-label="Zeitraum der Entscheide"]')).toHaveCount(0);
  for (const label of ['20 J.', '10 J.', '5 J.']) {
    await expect(panel.getByRole('button', { name: label, exact: true })).toHaveCount(0);
  }
  // Die übrigen Steuerungen des Menüs stehen unverändert da — entfernt wurde genau
  // eine, nicht das Menü.
  //
  // S1 (deklarierte fachliche Änderung, §6.3): hier stand der dreiwertige Streifen
  // `[aria-label="Darstellung der Änderungshistorie"]`. Er ist mit dem
  // Optionen-Rückbau (Entscheid David F1 «ja») ein zweiwertiger `role="switch"`
  // geworden. Die AUSSAGE der Zeile ist unverändert — «das Menü trägt weiter seine
  // Historie-Bedienung» — nur ihr Griff ist der neue; der Vertrag des Schalters
  // selbst liegt unter `hist-ansicht-w25i.e2e.ts`.
  // D35-F3 (§6.3): aus dem zweiwertigen `switch` ist eine Stellung der
  // Dreier-Wahl geworden (`menuitemradio`). Die AUSSAGE der Zeile ist
  // unverändert — «das Menü trägt weiter seine Historie-Bedienung».
  await expect(panel.getByRole(WAHL_ROLLE, { name: VERMERKE_SCHALTER_NAME })).toBeVisible();
});
