// @shard-gruppe: 5
import { test, expect, type Page } from '@playwright/test';
import { F_MARKE } from './helpers/fassungsRubrik';
import {
  ANSICHT_PANEL, AUS_WAHL_NAME, RECHTSPRECHUNG_SCHALTER_NAME, SCHALTER_ROLLE,
  VERMERKE_SCHALTER_NAME, WAHL_ROLLE,
} from './helpers/leserBeschriftung';

// W2·5d G2a — Leser-Options-Leiste: reine data-*-/CSS-Toggles am <html>,
// persistent (localStorage) + Pre-Paint (main.tsx, CSP-konform ohne
// Inline-Script). Belegt R6 (Grundzustand = heutige Darstellung, Toggle rein CSS)
// und R9/A1 (Fussnoten-«AUS» lässt Marker und Apparat VERSCHWINDEN, löscht sie
// nie — der Text bleibt im DOM). Positiv UND negativ (AN sichtbar ↔ AUS weg).
//
// Der Reader liefert prerendertes Crawler-HTML → auf den Client-Takeover warten
// (die Options-Leiste existiert NUR im React-DOM = App-Ready-Marker), bevor
// geklickt wird. Erlass-Wahl: die Toggle-Semantik ist seitengrössen-unabhängig
// (Attribut + CSS) — die Toggles laufen darum auf dem KLEINEN BGBM
// (~22 KB Snapshot, 25 Fussnoten-Marker, 62 Verweis-Links), NICHT auf dem
// 1686-Artikel-OR: dessen Voll-Re-Render (Apparat-Toggle) + Ganzseiten-Style-
// Recalc starvten den gedrosselten CI-Runner ins 30s-Test-Timeout (CI-Befund
// 4.7.2026, Run 28711156193 — lokal auch mit 20×-CPU-Throttle nicht
// reproduzierbar).
//
// LINIEN-RÜCKBAU V1 (16.8.2026, Entscheid David 13.8.2026 «ja linien ganz
// entfernen»): der frühere dritte Schalter «Linien» und sein eigener Toggle-Fall
// (Guide sichtbar → transparent, Einzug kollabiert) sind ersatzlos gestrichen —
// sie prüften genau das entfernte Verhalten (§6.3: deklariert, kein Refactoring).
// Dass im Lesetext KEINE Gliederungslinie mehr erscheint, hält jetzt
// `leser-ohne-gliederungslinie.e2e.ts` fest.
//
// ── S1 · OPTIONEN-RÜCKBAU (deklarierte fachliche Änderung, §6.3) ─────────────
// Entscheid David F2 «ja» (16.8.2026): der Schalter «Verweise» ist ERSATZLOS
// GESTRICHEN. Sein Toggle-Fall («AUS unterdrückt die dotted Unterstreichung»)
// fällt mit ihm — er prüfte genau das entfernte Verhalten. Was der Schalter
// NICHT betraf, war ohnehin nie hier gedeckt und bleibt unverändert: Farbe,
// href, Klickbarkeit und Ctrl+F der Verweis-Links (`verweis-u.e2e.ts`).
// An seine Stelle im Menü tritt der zweiwertige Schalter «Änderungsvermerke»
// (F1) — die Zahl der Schalter bleibt damit ZWEI, ihre NAMEN ändern sich. Der
// Vertrag dieses Schalters liegt vollständig unter `hist-ansicht-w25i.e2e.ts`;
// hier wird nur die Bestückung des Menüs festgehalten.
//
// ── H4-UMHÄNGUNG (Flip 18.8.2026, Kontaktbogen H4 §7) ───────────────────────
// Drei Nachführungen, alle gemessen, keine davon eine Lockerung (§6.3):
//
// (1) Die Bestückung ist in V3 DREI Schalter, nicht zwei: dazu kommt
//     «Rechtsprechung anzeigen» (F8-Entscheid David 16.8.2026; seit dem
//     H4-Nachzug 18.8.2026 nach seiner Wirkung benannt, B2,
//     `v3/LeserAnsichtV3.tsx`). Statt einer blossen Zahl nennt der Fall jetzt
//     die Schalter beim NAMEN und prüft die Zahl zusätzlich — eine Zahl allein
//     wäre auch dann grün, wenn ein Schalter gegen einen anderen getauscht
//     würde.
// (2) Das B3-Paar («Erlass MIT / OHNE Änderungsvermerken») ist GELÖSCHT, nicht
//     umgehängt. NICHTTRAGE-NACHWEIS: `leser-v3-umschalten.e2e.ts` prüft
//     dieselbe Aussage an denselben Erlassen (StPO positiv, BS-640.100 negativ)
//     und zusätzlich am `null`-Fall ZH-211.11, den es hier nie gab — die
//     Löschung nimmt keine Abdeckung weg, sie beendet eine Doppelung (§5).
// (3) Die Fussnotenmarke fasste `.lc-leser button[aria-label^="Fussnote"]`.
//     Nach dem Flip greift dieser Selektor den MENÜ-SCHALTER «Fussnoten (26)»
//     statt der Marke im Text (gemessen: 24 × auf `role=switch` aufgelöst) —
//     der Fall hätte geprüft, ob sich der Schalter selbst versteckt. Ziel ist
//     `[data-fn-ref]`, die Marke selbst.

async function warteReader(page: Page, url: string, artId: string): Promise<void> {
  await page.goto(url);
  // App-Ready: der «Ansicht»-Trigger (U-KOPF/A4) rendert nur der Client (nicht im
  // Crawler-HTML) — erst danach hängen die React-Handler.
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator(`#${artId}`)).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
}

// W2·5d U-KOPF/A4: die Switches liegen jetzt im «Ansicht»-Dropdown — vor jedem
// Switch-Zugriff öffnen. Das Panel (role=group) ist absolut positioniert (kein
// Layout-Shift der Seite); sein Name heisst seit Ä114 in V3 «Ansicht» und in
// der Ist-Hülle weiter «Darstellungsoptionen» — beide Fälle deckt
// `ANSICHT_PANEL` (helpers/leserBeschriftung).
// IDEMPOTENT (D35-F3): ein Klick auf eine Menü-Zeile schliesst das Panel NICHT.
// Ein zweiter blinder Klick auf «Ansicht» klappte es darum zu, und die folgende
// Zusicherung scheiterte am fehlenden Panel — ein Fehlschlag der Prüfmechanik,
// nicht der Sache (derselbe Befund wie in `hist-ansicht-w25i.e2e.ts`).
async function ansichtOeffnen(page: Page): Promise<void> {
  const panel = page.locator(ANSICHT_PANEL).first();
  if (!(await panel.isVisible())) {
    await page.getByRole('button', { name: 'Ansicht' }).first().click();
  }
  await expect(panel).toBeVisible();
}

// D4 (7.9.2026): die drei hiessen bis dahin `role=switch`. Seit das Menü
// `role="menu"` trägt, verlangt ARIA dort `menuitemcheckbox` — dieselbe
// Auskunft, derselbe `aria-checked`, derselbe Name (`SCHALTER_ROLLE`).
test('Options-Leiste: die Änderungs-Wahl + sechs Rubriken-Schalter — «Linien» und «Verweise» entfallen', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BGBM', 'art-1');
  await ansichtOeffnen(page);
  const gruppe = page.locator(ANSICHT_PANEL).first();
  await expect(gruppe).toBeVisible();
  // W2·7-BEZUG/B4 (Vorgabe David 28.7.2026): der frühere Schalter «Entscheide» ist
  // entfallen — er steuerte dieselbe Sache wie das Dropdown «Rechtsprechung ▾».
  // LINIEN-RÜCKBAU V1 (Entscheid David 13.8.2026): «Linien» ist ebenfalls entfallen,
  // die Gliederungslinie im Lesetext gibt es nicht mehr.
  // S1 (Entscheid David F2, 16.8.2026): «Verweise» ist gestrichen; an seine Stelle
  // tritt der zweiwertige «Änderungsvermerke». Bleiben zwei Schalter.
  // H4: die drei beim NAMEN, die Zahl als Deckel dahinter — so fällt auch ein
  // Tausch auf, nicht nur ein Zuwachs.
  // B2 (H4-Nachzug 18.8.2026), §6.3-DEKLARATION — fachliche Änderung, nicht
  // Anpassung an den Bau: der dritte Schalter hiess «Rechtsprechung im Text» und
  // versprach damit eine Wirkung auf den LESETEXT. Gemessen sind es in V3 **0**
  // Bezugs-/Leitfall-Zeilen vor UND nach dem Umlegen — was wirklich wechselt,
  // ist der Zugang in der Kopfzeile (Zähler 1 → 0). Der Name folgt jetzt der
  // Wirkung; die geprüfte Aussage («genau diese drei, keine mehr, keine
  // weniger») ist unverändert. Herleitung: `v3/LeserAnsichtV3.tsx`.
  // Ä115/Ä116: zwei der drei Namen sind in V3 gewechselt (helpers/leserBeschriftung).
  // ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ────────────────────
  // «Fussnoten» und «Fassung» waren zwei unabhängige `menuitemcheckbox`; sie
  // sind zwei von drei Stellungen EINER Radiogruppe geworden. Die geprüfte
  // Aussage bleibt dieselbe («genau diese Bedienungen, keine mehr, keine
  // weniger»), nur die Rollen trennen sich: EINE Checkbox (Rechtsprechung) und
  // DREI Radios (die Änderungs-Wahl). Herleitung: `v3/LeserAenderungsWahl.tsx`.
  // ── §6.3-DEKLARATION (D35-F2, Entscheid David 7.9.2026) ────────────────────
  // Die eine verbliebene Checkbox war «Rechtsprechung im Kopf». Sie ist mit
  // Variante A ERSATZLOS gefallen: der Kopf trägt keine Artikel-Zahl mehr, die
  // sie hätte verbergen können (Herleitung in `v3/LeserAnsichtV3.tsx` und
  // `v3/panelModell.ts`). An ihre Stelle treten FÜNF Checkboxen — die
  // Rubriken-Wahl «An diesem Artikel zeigen» (Davids Nachtrag «man soll mittels
  // ansicht alles einzelne abwählen können»). Die geprüfte Aussage ist
  // unverändert der Deckel: genau diese Bedienungen, keine mehr, keine weniger.
  await expect(gruppe.getByRole(SCHALTER_ROLLE, { name: RECHTSPRECHUNG_SCHALTER_NAME }))
    .toHaveCount(0);
  // §6.3-DEKLARATION (D40, 7.9.2026): «Fassung» ist die sechste Rubrik — sie
  // steht ZUERST, weil sie in der Zeile zuerst steht (§5). Der Deckel selbst
  // ist die unveränderte Aussage: genau diese Bedienungen, keine mehr.
  // §6.3-DEKLARATION (S6 W1cd AN-10, Entscheid David 23.9.2026, PR #1006): die
  // Rubriken `m` und `w` heissen wie die Blatt-Reiter, die sie öffnen —
  // «Materialien» → «Erläuterungen» (die Rubrik zeigt Kreisschreiben,
  // Wegleitungen, Leitfäden; «Materialien» ist seit S6 der Reiter für
  // Gesetzgebung) und «Rechner» → «Werkzeuge». Zahl und Reihenfolge der sechs
  // Rubriken unverändert; Herleitung: `v3/LeserRubrikenWahl.tsx` (RUBRIKEN).
  for (const name of [/^Fassung$/, /^Entscheide$/, /^Erläuterungen$/, /^Verweise$/, /^Werkzeuge$/, /^Aktionen$/]) {
    await expect(gruppe.getByRole(SCHALTER_ROLLE, { name })).toHaveAttribute('aria-checked', 'true');
  }
  await expect(gruppe.getByRole(SCHALTER_ROLLE)).toHaveCount(6);
  for (const name of [/^Fussnoten/, VERMERKE_SCHALTER_NAME, AUS_WAHL_NAME]) {
    await expect(gruppe.getByRole(WAHL_ROLLE, { name })).toHaveCount(1);
  }
  // W2·5m (14.9.2026): in der EIGENEN Gruppe gezählt — seit der Lesart-Wahl
  // (Kap. 15.3) trägt das Menü zwei Radiogruppen, und `gruppe` ist hier das
  // ganze Panel. Schärfung, kein Nachgeben: die Zeile misst jetzt die Wahl,
  // über die sie spricht.
  await expect(gruppe.locator('[data-v3-vermerke-wahl]').getByRole(WAHL_ROLLE)).toHaveCount(3);
  await expect(gruppe.getByRole(SCHALTER_ROLLE, { name: 'Linien' })).toHaveCount(0);
  // Negativ-Sonde gegen die Rückkehr: eine entfernte Steuerung, die niemand
  // vermisst, schleicht sich beim nächsten Merge sonst wieder ein.
  // D35-F2: der Name «Verweise» ist seither VERGEBEN — an eine Rubrik der
  // Funktionszeile, nicht an den gestrichenen S1-Schalter. Die Negativ-Sonde
  // greift darum am Attribut `data-verweise` unten, das der Alt-Schalter
  // schaltete und die Rubrik nicht kennt; eine Namensprüfung wäre hier seit
  // D35-F2 mehrdeutig (§7: Identität, nicht Substring).
  const html = page.locator('html');
  // Kein `data-linien` mehr am <html> — das Attribut existierte nur für die Linie.
  await expect(html).not.toHaveAttribute('data-linien', /.*/);
  // Und kein `data-verweise`: der Schalter ist weg, also darf auch die Weiche weg
  // sein — ein zurückgelassenes Attribut wäre der stille Rest, an dem eine
  // CSS-Regel später wieder anwachsen könnte.
  await expect(html).not.toHaveAttribute('data-verweise', /.*/);
  // D35-F3: EIN Attribut für die eine Frage; die zwei alten sind weg — ein
  // zurückgelassenes Attribut wäre der stille Rest, an dem eine CSS-Regel später
  // wieder anwachsen könnte (dieselbe Sorge wie bei `data-verweise` oben).
  await expect(html).toHaveAttribute('data-vermerke', 'fassung');
  await expect(html).not.toHaveAttribute('data-fussnoten', /.*/);
  await expect(html).not.toHaveAttribute('data-histansicht', /.*/);
  // D35-F2: dieselbe Sorge am gestrichenen `leitfaelle` — und das eine neue
  // Attribut steht im Grundzustand LEER, emittiert also keine Regel (R6/§6).
  await expect(html).not.toHaveAttribute('data-leitfaelle', /.*/);
  await expect(html).toHaveAttribute('data-fuss-aus', '');
});

// ── S1-NACHZUG B3 · GELÖSCHT IN H4 (Flip 18.8.2026) ─────────────────────────
// Hier stand das Paar «Erlass MIT / OHNE Änderungsvermerke bietet den Schalter»
// (StPO positiv, BS-640.100 negativ). Es ist mit dem Flip ENTFALLEN, weil es
// eine Doppelung war (§5): `leser-v3-umschalten.e2e.ts` prüft dieselbe Aussage
// an denselben zwei Erlassen und zusätzlich am zweideutigen `null`-Fall
// ZH-211.11 (kein Struktur-Sidecar), den es hier nie gab. Die Regel selbst und
// ihre Korpus-Messung liegen unverändert in
// `src/tests/aenderungsvermerke-schalter.test.ts`. Gelöscht wurde also die
// zweite Kopie, nicht die Abdeckung.

// ── Ä69 · DER Ä27-HINWEIS IST WEG, UND DAS IST DER PUNKT ────────────────────
// DEKLARIERTE UMKEHR (§6.3, Entscheid David 17.8.2026 abends). Hier stand «Ä27:
// Hinweis am Änderungsvermerke-Schalter NUR bei ‹Fussnoten: aus›» — die
// Unterzeile «Marker und Apparat sind mit den Fussnoten ausgeblendet». Sie
// erklärte eine KREUZ-ABHÄNGIGKEIT: der Vermerke-Schalter stand auf «an», zeigte
// aber nichts, weil Marker und Apparat der A-Klasse am Fussnoten-Schalter hingen.
//
// Mit Ä68 gibt es diese Abhängigkeit nicht mehr — der Vermerke-Schalter steuert
// nur noch die abgeleitete Fassungs-Zeile, und die folgt `data-fussnoten` nicht.
// Der Hinweis würde jetzt eine Teil-Unwirksamkeit behaupten, die es nicht gibt
// (§8, umgekehrt), und ist darum gestrichen (§17: kein Anlass mehr, keine Zeile).
//
// Der Test bleibt, mit gedrehter Aussage: KEIN Hinweis in KEINER Stellung — und
// statt der erklärten Abhängigkeit wird die Unabhängigkeit selbst gemessen. Ohne
// diese zweite Hälfte wäre es eine reine Negativ-Sonde, die auch bei einem
// kaputten Menü grün bliebe (§6.7).
test('Ä69/D35-F3: keine Hinweiszeile an einem Erlass MIT klassifizierter Historie', async ({ page }) => {
  // ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ────────────────────
  // Der Fall prüfte die UNABHÄNGIGKEIT der zwei Schalter (Ä69: kein Hinweis
  // nötig, weil es keine Kreuz-Abhängigkeit mehr gibt). Zwei Schalter gibt es
  // nicht mehr, also auch keine Kreuz-Abhängigkeit — die Aussage ist damit
  // strukturell erfüllt statt geprüft. Was BLEIBT und hier geprüft wird: der
  // Alt-Hinweis ist restlos weg, UND die einzige Hinweiszeile, die es heute
  // gibt (§8, Erlasse ohne `kl`-Klassifikation), erscheint an einem Erlass MIT
  // Klassifikation nicht. Ohne diese zweite Hälfte wäre es eine reine
  // Negativ-Sonde, die auch bei einem kaputten Menü grün bliebe (§6.7); die
  // positive Hälfte — der Hinweis IST da, wo er hingehört — steht in
  // `e2e/w224-d35-f3-vermerke.e2e.ts` an MONTREAL.
  const ALT_HINWEIS = 'Marker und Apparat sind mit den Fussnoten ausgeblendet';
  await warteReader(page, '/gesetze/bund/BGBM', 'art-1');
  await ansichtOeffnen(page);
  const gruppe = page.locator(ANSICHT_PANEL).first();
  const fassung = gruppe.getByRole(WAHL_ROLLE, { name: VERMERKE_SCHALTER_NAME });
  await expect(fassung).toHaveCount(1);
  await expect(gruppe.getByText(ALT_HINWEIS)).toHaveCount(0);
  await expect(gruppe.getByText('keine klassifizierten Änderungs-Fussnoten')).toHaveCount(0);
  // Die Wahl-Gruppe trägt an einem klassifizierten Erlass keine Beschreibung —
  // ein verwaistes `aria-describedby` zeigte auf ein Element, das es nicht gibt.
  expect(
    await gruppe.locator('[data-v3-vermerke-wahl]').getAttribute('aria-describedby'),
    'die Wahl trägt an BGBM noch eine Beschreibung',
  ).toBeNull();

  // Und die Stellung WIRKT: «Fassung» zeigt den Slot, «aus» nimmt ihn.
  await expect(fassung).toHaveAttribute('aria-checked', 'true');
  // §6.3-DEKLARATION (D40, 7.9.2026): der Kopf-Slot ist gefallen; die Wirkung
  // der Stellung zeigt sich an der Rubrik-Marke der Funktionszeile.
  const slot = page.locator(`.lc-leser ${F_MARKE}`).first();
  await expect(slot).toBeVisible({ timeout: 15000 });
  await gruppe.getByRole(WAHL_ROLLE, { name: AUS_WAHL_NAME }).click();
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
  await expect(slot, '«aus» nimmt die Fassungs-Rubrik nicht').toBeHidden();
});

test('A1-Mechanik: die Wahl VERSCHWINDET die A-Spur (display:none), der Text bleibt im DOM, kein CLS', async ({ page }) => {
  // ── §6.3-DEKLARATION (D35-F3) ─────────────────────────────────────────────
  // Hier stand der Toggle-Fall des Apparat-Schalters («AN sichtbar → AUS
  // verschwinden», A1 David 5.7.2026). Den Schalter gibt es nicht mehr —
  // amtlicher Nicht-Änderungs-Apparat wird nie versteckt. Die A1-MECHANIK gilt
  // unverändert und wird hier an dem gemessen, was heute noch verschwinden
  // kann: der Änderungs-Fussnote. Trade-off unverändert: die Marker-Ziffer und
  // der Apparat-Text verlassen Ctrl+F — NUR sie, nie der Normtext; der Text
  // bleibt im DOM (`#fn-…`), und «Fussnoten» stellt alles wieder her.
  await warteReader(page, '/gesetze/bund/BGBM', 'art-4');
  await ansichtOeffnen(page);
  await page.getByRole(WAHL_ROLLE, { name: /^Fussnoten/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');

  const aMarker = page.locator('.lc-leser [data-fn-klasse="A"] [data-fn-ref]').first();
  await expect(aMarker).toBeVisible({ timeout: 15000 });
  const nrText = (await aMarker.textContent())?.trim() ?? '';
  expect(nrText.length).toBeGreaterThan(0);
  const vZeile = page.locator('#fn-4-13');
  await expect(vZeile).toBeVisible();

  // CLS-Beobachter INSTALLIEREN (NUR künftige Shifts, kein `buffered` — die
  // Lade-Shifts sind nicht Gegenstand des Umschalt-Beweises), dann umschalten:
  // ein klick-getriebener Reflow liegt binnen 500 ms nach dem Klick
  // (input-exkludiert) und darf KEINEN CLS beitragen.
  await page.evaluate(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as PerformanceEntry[]) {
        const s = e as unknown as { value: number; hadRecentInput: boolean };
        if (!s.hadRecentInput) (window as unknown as { __cls: number }).__cls += s.value;
      }
    }).observe({ type: 'layout-shift' });
  });

  // NEGATIV: «Fassung» → Marker visuell WEG (display:none am Vorfahren), aber
  // im DOM (Text abfragbar), niemals gelöscht.
  //
  // §6.3-DEKLARATION (W2·26/Z8, Mandat David 11.9.2026): hier stand zusätzlich
  // «die V-Zeile bleibt sichtbar» — die Verlustfreiheits-Hälfte von D35-F3. Sie
  // ist mit dem Mandat aufgehoben: «Fussnoten, die z. B. nur eine SR-Nummer
  // enthalten, müssen ebenfalls weg sein, wenn Fussnoten abgewählt sind.» Die
  // V-Zeile GEHT jetzt mit, und das ist die neue Zusage — sie wird darum
  // umgekehrt geprüft, nicht weggelassen (ein Tor, das nur noch weniger
  // behauptet, prüfte weniger, §6.7).
  // WAS DIESER FALL PRÜFT, BLEIBT: die A1-MECHANIK (David 5.7.2026) —
  // `display:none`, nie gelöscht, vollständige Wiederherstellung, CLS 0.
  await ansichtOeffnen(page);
  await page.getByRole(WAHL_ROLLE, { name: VERMERKE_SCHALTER_NAME }).click();
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fassung');
  await expect(aMarker).toBeHidden();
  // §6.3-DEKLARATION (W2·26/Z8): bis hierher sass `display:none` am
  // KLASSEN-Wrapper (`[data-fn-klasse]`), weil die Regel nach Klasse griff.
  // Seit Z8 greift sie am Marker selbst (`[data-fn-ref]`) und am Träger
  // (`[data-fn-marker]`) — klassenblind. Die Zusage bleibt Wort für Wort:
  // `display:none`, nicht gelöscht, nicht bloss transparent.
  expect(await aMarker.evaluate((el) => getComputedStyle(el).display)).toBe('none');
  expect((await aMarker.textContent())?.trim()).toBe(nrText);
  await expect(vZeile, 'die V-Zeile steht noch — Z8 nimmt den Apparat ganz').toBeHidden();
  // R9/§8: weggeschaltet, nicht gelöscht — der Text der V-Zeile bleibt abfragbar.
  expect(((await vZeile.textContent()) ?? '').trim().length).toBeGreaterThan(0);

  // POSITIV zurück: «Fussnoten» → Marker wieder sichtbar (Wiederherstellung).
  await ansichtOeffnen(page);
  await page.getByRole(WAHL_ROLLE, { name: /^Fussnoten/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');
  await expect(aMarker).toBeVisible();
  await expect(vZeile, 'die V-Zeile kehrt nicht zurück — keine Wiederherstellung').toBeVisible();

  // CLS über beide Umschaltungen == 0 (input-exkludiert): kein Layout-Sprung.
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBe(0);
});

test('S1: die Verweis-Links behalten OHNE den Schalter alles, was sie tragen', async ({ page }) => {
  // ── ERSATZ für den gestrichenen «Verweise»-Toggle-Fall (§6.3, deklariert) ──
  // Der Schalter ist weg (F2), sein Toggle-Fall damit gegenstandslos. Was David
  // in F2 ausdrücklich zugesichert bekam, ist NICHT gegenstandslos: «Farbe,
  // Klickbarkeit und Ctrl+F bleiben in jedem Fall.» Genau das hält diese Zeile
  // fest — und sie ist strenger als der alte Fall, weil sie prüft, dass die
  // Unterstreichung bei :hover WEITER ERSCHEINT (der Wegfall der Option darf
  // nicht heissen, dass die Regel «aus» eingebrannt wurde).
  await warteReader(page, '/gesetze/bund/BGBM', 'art-1');
  // `a.decoration-dotted` und nicht `.decoration-dotted`: dieselbe Utility trägt
  // auch der Kopier-Knopf der Artikel-Nummer (`<button>`, kein href) — er stand
  // beim ersten Lauf dieser Fassung als erster Treffer da. Die Zusage aus F2
  // betrifft die VERWEIS-LINKS, also wird auf das Element gezielt, das eine
  // Adresse haben kann.
  // `:visible` (D35-F3, §6.3-Deklaration): in der Vorgabe-Stellung «Fassung»
  // sind die Änderungs-Fussnoten gedämpft, und die tragen ihrerseits
  // Verweis-Links («Aufgehoben durch …»). Der erste Treffer lag danach in einem
  // `display:none`-Teilbaum, und `hover()` wartete 30 s auf ein Element, das es
  // auf dem Schirm nicht gibt. Gemeint war immer der Verweis-Link IM LESETEXT —
  // der ist sichtbar, und genau seine Zusage aus F2 wird hier geprüft.
  const links = page.locator('.lc-leser [id^="art-"] a.decoration-dotted:visible');
  const link = links.first();
  const anzahl = await links.count();
  test.skip(anzahl === 0, 'kein sichtbarer Verweis-Link auf dieser Seite');

  await link.scrollIntoViewIfNeeded();
  // POSITIV: :hover unterstreicht — unverändert das heutige Verhalten.
  await link.hover();
  expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toContain('underline');
  // Klickbarkeit/Anker: der Link trägt weiter ein Ziel.
  await expect(link).toHaveAttribute('href', /.+/);
  // Ctrl+F: der Verweis-Text ist sichtbarer Text, nicht versteckt.
  expect(((await link.textContent()) ?? '').trim().length).toBeGreaterThan(0);
  await expect(link).toBeVisible();
});
