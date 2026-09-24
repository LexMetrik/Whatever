// @shard-gruppe: 5
import { test, expect, type Page } from '@playwright/test';
import { fassungAufklappen, fassungsMarke } from './helpers/fassungsRubrik';
import AxeBuilder from '@axe-core/playwright';
import {
  ANSICHT_PANEL, FUSSNOTEN_WAHL_NAME, WAHL_ROLLE,
} from './helpers/leserBeschriftung';

// ═══ §6.3-DEKLARATION · S6 W1f (Entscheid David 24.9.2026) ══════════════════
// Wörtlich: «die zeile soll ganz weg. infos sollen alle im blatt erscheinen.
// einzige ausnahme sind wenn fussnoten aktiviert sind die sollen unten am
// artikel erschienen». Die Dreier-Wahl wird ein SCHALTER «Fussnoten» (an =
// `fussnoten`, aus = `aus`); die Stellung «Fassung» fällt, ihr Gegenstand (die
// Rubrik «Gilt seit …» am Artikelende) steht im Erlass-Blatt. Diese Datei folgt:
//   · `waehle(page, 'fussnoten' | 'aus')` stellt den Schalter; jede Schleife
//     über «fassung»/«aus» läuft nur noch über «aus» — die Apparat-Zusagen
//     (ganz weg, ganz zurück, DOM vollständig) bleiben Wort für Wort.
//   · Die Vorgabe heisst «aus» (dieselbe Fussnoten-Sicht wie «Fassung» seit Z8).
//   · Der Fall «Fassung zeigt die Fassungs-Spur …» wird zur Gegenprobe «der
//     Schalter rührt die Fassung im Blatt NICHT an» — sie hängt an keiner
//     Stellung mehr.
//   · Die Matrix verliert ihre Spalte `fassung` (keine Spur mehr im Lesetext).
// Die Blöcke unten, die von drei Stellungen sprechen, sind Belege ihres Datums.

// ÄNDERUNGSVERMERKE — zweiwertig seit S1, ENTKOPPELT seit Ä68 (Entscheid David
// 17.8.2026), EINE DREIER-WAHL seit D35-F3 (Entscheid David 7.9.2026).
//
// ── STUFE 1 (§6.3), 17.8.2026 · Ä68 ─────────────────────────────────────────
// DAVIDS BEFUND, wörtlich: «wenn änderungsvermerke abgewählt wird dann
// verschwinden auch fussnoten.» Er traf zu. Gemessen 17.8.2026 @1440 in der
// Stellung Fussnoten = an · Änderungsvermerke = aus:
//
//   StPO   Apparat-Einträge sichtbar 285 → 98   · Marker 285 → 105
//   ZGB    Apparat-Einträge sichtbar 809 → 90   · Marker 809 → 173
//
// Ursache waren die beiden CSS-Regeln auf `[data-fn-klasse="A"]` und auf den
// A-only-Apparat: weil `kl:'A'` beim Bundesrecht die REGEL ist (ZGB 719/809), war
// «Änderungsvermerke aus» faktisch ein zweiter, versteckter Fussnoten-Schalter.
// Die Zahlen bleiben stehen, was auch immer später gemessen wird (§0 Ziff. 2b).
//
// ── STUFE 2 (§6.3), 7.9.2026 · D35-F3 ───────────────────────────────────────
// DAVIDS BEFUND, wörtlich: «es soll entweder fassung oder fussnoten angezeigt
// werden. also entweder fassung, fussnoten oder aus.» Gemessen (D35-Bericht
// Teil 3, ZPO @1440) waren alle VIER Kombinationen der zwei Schalter erreichbar.
// Sein Entscheid dazu: «A und verlustfrei».
//
// DIE NEUE, EINE WAHRHEIT — ein Attribut, drei Stellungen:
//   fassung    Fassungs-Zeile («Gilt seit …» + Zeitleiste) DA · `kl:'A'` gedämpft
//   fussnoten  voller amtlicher Apparat inkl. `kl:'A'` · Fassungs-Zeile aus
//   aus        weder noch
// In JEDER Stellung sichtbar: `kl:'V'/'G'/'Z'/'U'` und jede Fussnote OHNE Klasse.
//
// WAS DAS FÜR DIESE DATEI HEISST: die Ä68-Zusicherung «der Vermerke-Schalter
// fasst den Apparat gar nicht an» ist durch eine ENGERE ersetzt — «die Wahl
// fasst ausschliesslich `kl:'A'` an». Der Vertrag ist damit nicht schwächer:
// jede Zusicherung bleibt ZWEISEITIG (A verschwindet in «fassung»/«aus» UND
// steht in «fussnoten»), und die Drei-Stellungs-Matrix unten prüft alle
// Stellungen gegen alle Klassen zugleich.
//
// ── STUFE 3 (§6.3), 11.9.2026 · W2·26/Z8 ────────────────────────────────────
// DAVIDS BEFUND, wörtlich: «Fussnoten, die z. B. nur eine SR-Nummer enthalten,
// müssen ebenfalls weg sein, wenn Fussnoten abgewählt sind.» NULLPROBE dazu
// (OR-Leser, Vorgabestellung «Fassung», 11.9.2026): 215 von 847 Markern und 194
// von 595 Apparat-Kästen standen sichtbar da — darunter 75 Einträge der Klasse
// `V`, die nichts als «SR 943.03» tragen, und 97 Marker aus dem Erlass-Kopf und
// den Randtiteln, die gar kein `data-fn-klasse` setzen und darum von keiner
// Klassen-Regel je erreicht wurden.
//
// DIE MATRIX SEITHER — die Wahl kennt KEINE Klassen mehr:
//   fassung    Fassungs-Zeile DA · Apparat und Marker am Bildschirm AUS
//   fussnoten  voller amtlicher Apparat (alle Klassen) · Fassungs-Zeile aus
//   aus        weder noch
// Am Bildschirm; der AUSDRUCK behält den Apparat in jeder Stellung (@media
// screen, §7/§8), und nichts verlässt das DOM (A1-Mechanik).
//
// WAS DAS FÜR DIESE DATEI HEISST: die Zusage «verlustfrei» ist für die zwei
// Nicht-Fussnoten-Stellungen aufgehoben — sie wird nicht weggelassen, sondern
// UMGEKEHRT geprüft (ein Tor, das nur noch weniger behauptet, prüfte weniger,
// §6.7). Jede Zusicherung bleibt ZWEISEITIG: der Apparat verschwindet in
// «fassung»/«aus» UND kehrt in «fussnoten» vollständig zurück.
//
// ── DIE NICHT VERHANDELBARE AUFLAGE ─────────────────────────────────────────
// H0-Auflage 1 (Vollbericht `bibliothek/normen/hist-ansicht-h0-trennbarkeit.md`,
// Nachtrag 17.8.2026): `A` ist die EINZIGE Klasse, welche die Änderungs-Ansicht
// dämpfen darf — echte Verweise (V), Grauzone (G), Publikationsnachweise (Z),
// Unklares (U) und alles OHNE Klasse bleiben unberührt. Genau das ist seit
// D35-F3 die Verlustfreiheit, und geprüft wird darum nicht nur, DASS eine
// Stellung etwas dämpft, sondern dass sie NUR `A` dämpft.
// [W2·26/Z8, 11.9.2026 — ERGÄNZUNG: H0-Auflage 1 ist nicht verletzt, sondern
//  GEGENSTANDSLOS geworden. Sie bindet die ÄNDERUNGS-Ansicht an die Klasse `A`;
//  seit Z8 dämpft keine Klasse mehr etwas — der Schalter fasst den Apparat als
//  Ganzes, und genau dafür hat H0 ihn vorgesehen («wer auch den nicht sehen
//  will, hat den Fussnoten-Schalter»). Der Wächter dazu ist strenger geworden:
//  `src/tests/fussnoten-toggle-huellenneutral.test.ts` verlangt, dass KEIN
//  Selektor in `src/index.css` eine `kl`-Klasse nennt — auch `A` nicht.]
//
// Erlass-Wahl BGBM (16 Artikel, ~21 KB Snapshot) = derselbe kleine Träger wie in
// `leser-optionen.e2e.ts`: die Semantik ist seitengrössen-unabhängig (Attribut +
// CSS), und der 1686-Artikel-OR starvte den gedrosselten CI-Runner (Befund 4.7.2026).
//
// Die Fixtures sind am Bestand VERIFIZIERT (Sidecar public/normtext/struktur/bund/
// BGBM.json, Stand 26.7.2026):
//   · Art. 2  → trägt einen Historie-Shard-Eintrag ⇒ «Fassung»-Zeile «Gilt seit 01.01.2025»
//   · Art. 4  → fn 12 kl=A · fn 13 kl=V («SR 0.142.112.681») · fn 14 kl=A
//   · Art. 5  → fn 15 kl=Z («BBl 2017 2175») · fn 16 kl=V · fn 17 kl=A
//   · Art. 9  → fn 25/26/27/28, ALLE kl=A ⇒ Apparat ohne nicht-A-Zeile

async function warteReader(page: Page, url: string, artId: string): Promise<void> {
  await page.goto(url);
  // App-Ready: der «Ansicht»-Trigger rendert nur der Client (nicht im Crawler-HTML).
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator(`#${artId}`)).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => document.fonts?.ready);
  // Die Fussnoten kommen aus dem lazy geladenen Struktur-Sidecar — erst wenn der
  // Apparat steht, sind die Klassen im DOM.
  await expect(page.locator('.lc-leser [data-fn-apparat]').first()).toBeAttached({ timeout: 20000 });
  await page.waitForTimeout(200);
}

// IDEMPOTENT (Befund beim ersten Lauf der S1-Fassung): ein Klick auf eine
// Stellung schliesst das Panel NICHT. Ein zweiter blinder Klick auf «Ansicht»
// hätte es darum zugeklappt, und die folgende Zusicherung wäre am fehlenden Panel
// gescheitert — ein Fehlschlag der Prüfmechanik, nicht der Sache.
async function ansichtOeffnen(page: Page): Promise<void> {
  const panel = page.locator(ANSICHT_PANEL).first();
  if (!(await panel.isVisible())) {
    await page.getByRole('button', { name: 'Ansicht' }).first().click();
  }
  await expect(panel).toBeVisible();
}

/** S6 W1f · Schalter-Stellung setzen (an = «fussnoten», aus = «aus») und
 *  warten, bis das Attribut am <html> steht. Idempotent: steht er schon, kein Klick. */
async function waehle(page: Page, wert: 'fussnoten' | 'aus'): Promise<void> {
  await ansichtOeffnen(page);
  const schalter = page.locator(ANSICHT_PANEL).getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME });
  const soll = wert === 'fussnoten' ? 'true' : 'false';
  if (await schalter.getAttribute('aria-checked') !== soll) await schalter.click();
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', wert);
}

/** Apparat-Zeile einer Fussnote dieses Artikels (id = fn-<artikel>-<nr>). */
function apparatZeile(page: Page, artikel: string, nr: string) {
  return page.locator(`#fn-${artikel}-${nr}`);
}

test('Grundzustand: «aus» ist Vorgabe, Attribut am <html>, EIN Schalter', async ({ page }) => {
  // S6 W1f: bis 24.9.2026 «Fassung ist Vorgabe, DREI Stellungen» (Radiogruppe).
  await warteReader(page, '/gesetze/bund/BGBM', 'art-4');
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
  await ansichtOeffnen(page);
  const gruppe = page.locator('[data-v3-vermerke-wahl]');
  await expect(gruppe.getByRole(WAHL_ROLLE), 'genau ein Schalter').toHaveCount(1);
  await expect(gruppe.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME }))
    .toHaveAttribute('aria-checked', 'false');
  // Die Radiogruppe (D35-F3) ist weg — sonst stünde die gefallene Stellung
  // «Fassung» wieder im Menü, ohne Gegenstand am Artikel.
  await expect(page.locator(`${ANSICHT_PANEL} [role="menuitemradio"][data-v3-vermerke]`)).toHaveCount(0);
  // S1: der dreiwertige Streifen von vor 17.8.2026 ist ebenfalls restlos weg.
  await expect(page.locator('[aria-label="Darstellung der Änderungshistorie"]')).toHaveCount(0);
  await expect(page.locator('[data-hist-wahl]')).toHaveCount(0);
});

test('GANZ ODER GAR NICHT: in «aus» geht der Apparat vollständig — auch V und Z', async ({ page }) => {
  // ── DEKLARIERTE ÄNDERUNG (§6.3, Entscheid David 7.9.2026) ──────────────────
  // Bis 7.9. prüfte dieser Fall, dass der VERMERKE-Schalter gar keine Fussnote
  // anfasst und der FUSSNOTEN-Schalter alle. Den zweiten gibt es nicht mehr:
  // amtlicher Nicht-Änderungs-Apparat wird nie versteckt. Geprüft wird jetzt die
  // engere Zusage — `A` wechselt mit der Stellung, V und Z nie.
  //
  // ── DEKLARIERTE ÄNDERUNG (§6.3, Mandat David 11.9.2026 · W2·26/Z8) ─────────
  // Beide Sätze oben bleiben als Beleg ihres Standes stehen (§0 Ziff. 2b). Seit
  // dem Mandat geht der Apparat GANZ: «Fussnoten, die z. B. nur eine SR-Nummer
  // enthalten» — das ist genau die Klasse `V`, im BGBM die Zeile fn 13 mit
  // «SR 0.142.112.681» — «müssen ebenfalls weg sein». Der Fall prüft darum
  // dasselbe Element mit umgekehrtem Vorzeichen, und ZWEISEITIG: alles weg in
  // «fassung»/«aus», alles zurück in «fussnoten», nichts je aus dem DOM.
  await warteReader(page, '/gesetze/bund/BGBM', 'art-4');

  const a12 = apparatZeile(page, '4', '12');       // A — Änderungsvermerk
  const v13 = apparatZeile(page, '4', '13');       // V — «SR 0.142.112.681»
  const a14 = apparatZeile(page, '4', '14');       // A — Änderungsvermerk
  const z15 = apparatZeile(page, '5', '15');       // Z — «BBl 2017 2175»
  const v16 = apparatZeile(page, '5', '16');       // V — «SR 0.632.231.422»

  // Vorbedingung: die Klassifikation ist im DOM angekommen (sonst prüfte der Test
  // nichts — ein Tor, das nicht scheitern kann, §6.7).
  await expect(a12).toHaveAttribute('data-fn-klasse', 'A');
  await expect(v13).toHaveAttribute('data-fn-klasse', 'V');
  await expect(z15).toHaveAttribute('data-fn-klasse', 'Z');

  // Stellung «Fussnoten»: alles sichtbar — der volle amtliche Apparat.
  await waehle(page, 'fussnoten');
  for (const l of [a12, v13, a14, z15, v16]) {
    await l.scrollIntoViewIfNeeded();
    await expect(l).toBeVisible();
  }
  expect((await v13.textContent())?.trim() ?? '').toContain('0.142.112.681');

  // ── DER CLS-BEWEIS STEHT NICHT HIER (§5/§6.7, Befund beim Voll-Lauf 7.9.2026)
  // Er stand bis hierher mitten in dieser Schleife und mass 0.000153 statt 0 —
  // NICHT vom Umschalten: die Schleife scrollt zwischen den Stellungen, und der
  // idle nachgeladene Historie-Shard wächst dabei ein. Ein Beobachter, der über
  // drei Umschaltungen samt Scroll-Fahrten läuft, misst Nachlade-Shifts mit und
  // sagt darum über den Klick nichts aus. Der enge, aussagekräftige Fall — ein
  // Beobachter, EIN Umschaltvorgang, kein Scroll dazwischen — steht in
  // `e2e/leser-optionen.e2e.ts` («A1-Mechanik … kein CLS»). Zwei Kopien
  // derselben Zusage sind ohnehin eine zu viel.

  for (const stellung of ['aus'] as const) {
    await waehle(page, stellung);
    // DER KERN VON Z8: der Apparat geht GANZ — die reine SR-Zeile mit.
    await expect(v13, `${stellung}: V-Eintrag steht weiter da`).toBeHidden();
    await expect(z15, `${stellung}: Z-Eintrag steht weiter da`).toBeHidden();
    await expect(v16, `${stellung}: V-Eintrag steht weiter da`).toBeHidden();
    await expect(a12, `${stellung}: A-Eintrag steht weiter da`).toBeHidden();
    await expect(a14, `${stellung}: A-Eintrag steht weiter da`).toBeHidden();
    // R9/§8-DOM-Beweis: nicht gelöscht, nur weggeschaltet (Popover-Quelle,
    // Ctrl+F-Neutralität, vollständige Wiederherstellung).
    expect((await a12.textContent())?.trim() ?? '').toContain('Aufgehoben durch');
    expect(await a12.count()).toBe(1);
    expect((await v13.textContent())?.trim() ?? '').toContain('0.142.112.681');
    expect(await v13.count()).toBe(1);
  }

  // Und der NORMTEXT ist von keiner Regel erfasst — das ist die Grenze, die
  // auch Z8 nicht überschreitet (§1/R9): der amtliche Wortlaut des Artikels
  // bleibt sichtbar und findbar, in JEDER Stellung.
  const artikel = page.locator('#art-4');
  await expect(artikel).toBeVisible();
  const sichtbarerText = await artikel.evaluate((el) => (el as HTMLElement).innerText);
  expect(sichtbarerText.length).toBeGreaterThan(20);

  // POSITIV zurück: «Fussnoten» stellt den Apparat vollständig wieder her —
  // ohne diese Hälfte wäre die Zusage oben mit «alles ist immer weg» erfüllbar.
  await waehle(page, 'fussnoten');
  for (const l of [a12, v13, a14, z15, v16]) {
    await l.scrollIntoViewIfNeeded();
    await expect(l).toBeVisible();
  }
  expect((await artikel.evaluate((el) => (el as HTMLElement).innerText)))
    .toContain('0.142.112.681');
});

test('ALLE Marker im Wortlaut folgen der Wahl — A wie V', async ({ page }) => {
  // ── DEKLARIERTE ÄNDERUNG (§6.3) ───────────────────────────────────────────
  // Bis 7.9. hingen ALLE Marker am Fussnoten-Schalter und keiner am
  // Vermerke-Schalter. Jetzt hängt genau die A-Marke an der Wahl — sie ist der
  // Zeiger auf die Änderungshistorie, und ihn stehen zu lassen, während der
  // Eintrag gedämpft ist, wäre ein Zeiger ins Nichts (§8).
  //
  // ── DEKLARIERTE ÄNDERUNG (§6.3, W2·26/Z8, 11.9.2026) ──────────────────────
  // Der Satz oben bleibt stehen (§0 Ziff. 2b) und gilt seither für JEDE Marke:
  // ein Zeiger auf einen ausgeblendeten Eintrag ist ein Zeiger ins Nichts,
  // gleich welcher Klasse. Die Zusicherung ist damit dieselbe, nur ohne
  // Klassen-Ausnahme.
  await warteReader(page, '/gesetze/bund/BGBM', 'art-4');
  const aMarker = page.locator('.lc-leser [data-fn-klasse="A"] [data-fn-ref]');
  const vMarker = page.locator('.lc-leser [data-fn-klasse="V"] [data-fn-ref]');
  const aAnzahl = await aMarker.count();
  const vAnzahl = await vMarker.count();
  expect(aAnzahl, 'BGBM trägt A-Marker im Wortlaut').toBeGreaterThan(0);
  expect(vAnzahl, 'BGBM trägt V-Marker im Wortlaut').toBeGreaterThan(0);

  await waehle(page, 'fussnoten');
  for (let i = 0; i < aAnzahl; i++) {
    await expect(aMarker.nth(i), `A-Marker ${i} fehlt in der Stellung «Fussnoten»`).toBeVisible();
  }
  await expect(vMarker.first()).toBeVisible();

  await waehle(page, 'aus');
  await expect(aMarker.first(), '«aus» lässt die A-Marke stehen').toBeHidden();
  await expect(vMarker.first(), '«aus» lässt die V-Marke stehen').toBeHidden();
  // DOM unverändert vollständig (A1-Mechanik).
  expect(await aMarker.count()).toBe(aAnzahl);
  expect(await vMarker.count()).toBe(vAnzahl);
});

test('STELLUNGS-MATRIX: Bund mit Klassen · Kanton ohne Klassifikation', async ({ page }) => {
  // DIE Sonde der Verlustfreiheit. Sie prüft jede Stellung gegen die eine Regel:
  // die Wahl trägt `kl:'A'` und die Fassungs-Zeile — und sonst nichts.
  //
  // Zwei Erlasse, weil die KLASSEN sich unterscheiden: BGBM (Bund) trägt A/V/Z,
  // BS-640.100 (Kanton) trägt Fussnoten OHNE Klasse. Eine Regel, die nur bei
  // gesetzter Klasse richtig greift, fiele nur auf dem Kanton auf.
  //
  // KANTON, §8: dort gibt es weder `kl` (`lib/normtext/browse.ts`) noch einen
  // Historie-Shard (gemessen 7.9.2026: 0 von 209 Shards sind kantonal) — die
  // Wahl wird darum gar nicht erst angeboten (D1), und der Apparat steht
  // vollständig. Drei Stellungen mit identischer Wirkung anzubieten wäre genau
  // das tote Steuerelement, das D1 abgeschafft hat.
  //
  // ── DEKLARIERTE ÄNDERUNG (§6.3, W2·26/Z8, 11.9.2026) ──────────────────────
  // Beide Absätze bleiben als Beleg ihres Standes stehen (§0 Ziff. 2b). Seit dem
  // Mandat gilt: (1) die Wahl nimmt den Apparat GANZ, nicht nur die A-Zeilen;
  // (2) sie wird auch auf dem klassenlosen Kanton ANGEBOTEN — dort hat sie jetzt
  // eine Wirkung, und eine Vorgabestellung, die den Apparat versteckt, ohne den
  // Weg zurück anzubieten, wäre der §8-Bruch (Herleitung an
  // `bieteAenderungsvermerkeSchalter`). Die Matrix prüft darum BEIDE Erlasse
  // gegen dieselbe Regel — das ist strenger als vorher, nicht lockerer.
  for (const [pfad, artId, name, mitWahl] of [
    ['/gesetze/bund/BGBM', 'art-4', 'BGBM (Bund, mit Klassen)', true],
    ['/gesetze/kanton/BS-640.100', 'art-1', 'BS-640.100 (Kanton, klassenlos)', true],
  ] as const) {
    await warteReader(page, pfad, artId);

    const zaehle = () => page.evaluate(() => {
      const sicht = (e: Element) => (e as HTMLElement).checkVisibility();
      const n = (s: string) => [...document.querySelectorAll(s)].filter(sicht).length;
      return {
        apparat: n('.lc-leser [data-fn-apparat] > p'),
        nichtA: n('.lc-leser [data-fn-apparat] > p:not([data-fn-klasse="A"])'),
        marker: n('.lc-leser [data-fn-ref]'),
        // S6 W1f: hier stand die Spalte `fassung` (Rubrik-Marke am
        // Artikelende). Die Fassung steht im Blatt und an keiner Stellung.
      };
    });

    await ansichtOeffnen(page);
    const wahlDa = (await page.locator(ANSICHT_PANEL).getByRole(WAHL_ROLLE).count()) > 0;
    expect(wahlDa, `${name}: Wahl angeboten?`).toBe(mitWahl);

    // W2·26/Z8: hier stand der Zweig `if (!mitWahl)` für den klassenlosen
    // Kanton — «ohne Wahl kann nichts gedämpft sein, der Apparat steht
    // vollständig». Er ist gegenstandslos, seit die Wahl auf JEDEM Erlass mit
    // Fussnoten angeboten wird; die Vorbedingung `mitWahl` bleibt als
    // Zusicherung oben stehen und ist für beide Erlasse `true`.

    // Stellung «Fussnoten» = der volle Apparat. POSITIV-Vorbedingung: ohne
    // Apparat und Marker prüfte die Matrix nichts (§6.7).
    await waehle(page, 'fussnoten');
    const voll = await zaehle();
    expect(voll.apparat, `${name}: keine Apparat-Zeilen sichtbar`).toBeGreaterThan(0);
    expect(voll.marker, `${name}: keine Marker sichtbar`).toBeGreaterThan(0);

    for (const stellung of ['aus'] as const) {
      await waehle(page, stellung);
      const m = await zaehle();
      // W2·26/Z8: der Apparat geht GANZ — keine Zeile, kein Marker, gleich
      // welcher Klasse. Das ist die Matrix als Zahl.
      expect(m.apparat, `${name}/${stellung}: Apparat-Zeilen stehen weiter da`).toBe(0);
      expect(m.nichtA, `${name}/${stellung}: nicht-A-Zeilen stehen weiter da`).toBe(0);
      expect(m.marker, `${name}/${stellung}: Marker stehen weiter da`).toBe(0);
    }

    // Zurück auf «Fussnoten»: vollständige Wiederherstellung (A1).
    await waehle(page, 'fussnoten');
    const zurueck = await zaehle();
    expect(zurueck.apparat, `${name}: Apparat nicht vollständig wiederhergestellt`).toBe(voll.apparat);
    expect(zurueck.marker, `${name}: Marker nicht vollständig wiederhergestellt`).toBe(voll.marker);
  }
});

test('der Schalter rührt die Fassung nicht an — sie steht im Blatt, am Artikel nur im Druck', async ({ page }) => {
  // S6 W1f (Entscheid David 24.9.2026): bis hierher prüfte der Fall «Fassung
  // zeigt die Fassungs-Spur, Fussnoten und aus nehmen sie». Die Spur am
  // Artikelende ist gefallen; die Fassung steht als Klappzeile im Blatt
  // (Reiter «Änderungen») und hängt an KEINER Stellung mehr. Geprüft wird
  // darum die Gegenprobe in beiden Stellungen, dazu das, was vom alten Fall
  // unverändert gilt: die Druck-Projektion am Artikel trägt den Stand in jeder
  // Stellung (§8, «der Ausdruck verliert den Fassungsstand nicht»).
  await warteReader(page, '/gesetze/bund/BGBM', 'art-2');
  const art2 = page.locator('#art-2');
  // Am Artikel steht keine Fassungs-Spur mehr — weder Marke noch Block.
  await expect(page.locator('.lc-leser .lr7-bez-marke, .lc-leser [data-bez-marken]')).toHaveCount(0);
  for (const stellung of ['fussnoten', 'aus'] as const) {
    await waehle(page, stellung);
    await page.keyboard.press('Escape');
    const zeile = await fassungAufklappen(art2);
    await expect(zeile.getByText('Fassung', { exact: true })).toBeVisible();
    await expect(zeile, `${stellung}: die Fassung im Blatt folgt dem Schalter`).toContainText('Gilt seit');
    const imDruck = art2.locator('[data-hist-druck] [data-historie-zeile]');
    await expect(imDruck).toHaveCount(1);
    expect((await imDruck.textContent())?.trim() ?? '').toContain('Gilt seit');
    await page.locator('[data-v3-panel-zu]').first().click();
  }
});

test('Persistenz + Pre-Paint: die Wahl übersteht den Reload ohne Flackern', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/BGBM', 'art-4');
  // S6 W1f: «aus» ist die Vorgabe — damit überhaupt geschrieben wird, einmal
  // an und wieder aus (der Schalter ist idempotent, `waehle`).
  await waehle(page, 'fussnoten');
  await waehle(page, 'aus');
  const ls = await page.evaluate(() => localStorage.getItem('lm.leser.optionen'));
  // D35-F3: der Wert steht unter dem EINEN neuen Schlüssel.
  expect(ls).toContain('"vermerke":"aus"');
  expect(ls, 'Alt-Schlüssel `hist` weiter geschrieben — die Migration griffe bei jedem Laden neu').not.toContain('"hist":');
  expect(ls, 'gestrichener Schalter `verweise` weiter geschrieben').not.toContain('"verweise"');
  expect(ls, 'Alt-Schlüssel `fussnoten` weiter geschrieben').not.toContain('"fussnoten"');
  expect(ls, 'Alt-Schlüssel `histansicht` weiter geschrieben').not.toContain('"histansicht"');

  await page.reload();
  // Pre-Paint (wendeLeserOptionenAn in main.tsx, CSP-konform aus dem Modul-Script):
  // das Attribut steht VOR dem ersten Paint — kein Flash der Fassungs-Zeile.
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
  await expect(page.locator('#art-4')).toBeVisible();
  // §6.3-DEKLARATION (W2·26/Z8, 11.9.2026): hier stand «Verlustfrei auch nach
  // dem Reload: V und Z stehen, A ist gedämpft». Seit dem Mandat nimmt «aus»
  // den Apparat GANZ — geprüft wird darum, dass auch die V-Zeile nach dem
  // Reload weg ist (und beide im DOM bleiben, A1-Mechanik).
  await expect(apparatZeile(page, '4', '13')).toBeHidden();
  await expect(apparatZeile(page, '4', '12')).toBeHidden();
  await expect(apparatZeile(page, '4', '13')).toHaveCount(1);
  // S6 W1f: hier stand die Zusage «aus nimmt die Fassungs-Marken» — die Marken
  // gibt es am Artikel nicht mehr (Fassung im Blatt, Stellung gefallen).
});

test('MIGRATION im Browser: ein gespeichertes «chronologie» steht heute als «aus» da', async ({ page }) => {
  // Der Bestands-Speicher eines Nutzers von VOR S1 — genau der Fall, der sich
  // später nicht mehr nachstellen lässt. Die Regeln selbst liegen DOM-frei unter
  // `src/tests/leser-optionen-migration.test.ts`; hier zählt, dass der Pre-Paint-
  // Pfad (main.tsx → wendeLeserOptionenAn) sie wirklich anwendet und die Wahl
  // danach richtig steht. «chronologie» hiess «Vermerke sichtbar» ⇒ seit D35-F3
  // die Stellung «Fassung», nie «aus» (§8: dem Nutzer nicht wegnehmen, was er
  // ausdrücklich bestellt hat).
  await page.addInitScript(() => {
    try {
      localStorage.setItem('lm.leser.optionen', JSON.stringify({
        fussnoten: 'an', verweise: 'aus', leitfaelle: 'an', hist: 'chronologie',
      }));
    } catch { /* privater Modus */ }
  });
  await warteReader(page, '/gesetze/bund/BGBM', 'art-2');
  // S6 W1f: «Vermerke sichtbar» war seit D35-F3 «Fassung», und «Fassung» zeigte
  // seit Z8 keinen Apparat ⇒ heute «aus» (dieselbe Fussnoten-Sicht, §8).
  await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
  // Die gestrichenen Schalter können nichts mehr bewirken: kein Attribut am <html>.
  await expect(page.locator('html')).not.toHaveAttribute('data-verweise', /.*/);
  await expect(page.locator('html')).not.toHaveAttribute('data-fussnoten', /.*/);
  await expect(page.locator('html')).not.toHaveAttribute('data-histansicht', /.*/);
  await ansichtOeffnen(page);
  await expect(page.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME }))
    .toHaveAttribute('aria-checked', 'false');
  // Und die Fassung ist wirklich da — im Blatt (nicht bloss die Stellung richtig gesetzt).
  await page.keyboard.press('Escape');
  await fassungsMarke(page.locator('#art-2'));
});

test('W2·26/Z8: JEDE Klasse folgt der Wahl — A, G und U auf einem Artikel', async ({ page }) => {
  // Gegenprüfungs-Befund B5 (26.7.2026) in seiner D35-F3-Fassung. Die Sonde ist
  // dieselbe, ihre Richtung ist wieder die ursprüngliche: sie bewacht, dass der
  // CSS-Selektor nicht von `[data-fn-klasse="A"]` auf `[data-fn-klasse]`
  // verbreitert wird. Würde er es, wäre die Verlustfreiheit dahin, und genau
  // hier wird es rot.
  //
  // ── §6.3-DEKLARATION (W2·26/Z8, Mandat David 11.9.2026) ───────────────────
  // Der Absatz oben bleibt als Beleg seines Standes stehen (§0 Ziff. 2b). Das
  // Mandat kehrt die Richtung um: «Fussnoten, die z. B. nur eine SR-Nummer
  // enthalten, müssen ebenfalls weg sein». Die Wahl kennt seither keine Klassen
  // — die Sonde bewacht jetzt, dass WIRKLICH jede folgt, an demselben Artikel,
  // der A, G und U zugleich trägt. ZWEISEITIG bleibt sie: «Fussnoten» stellt
  // alle drei wieder her.
  //
  // ELG Art. 10 trägt A, G UND U auf EINEM Artikel (verifiziert am Sidecar
  // 26.7.2026): fn34 = A · fn35 = U («Beträge angepasst gemäss …») · fn41 = G
  // (Revisionsvermerk mit UeB-Zeiger «Siehe auch die UeB …»).
  await warteReader(page, '/gesetze/bund/ELG', 'art-10');
  const a34 = apparatZeile(page, '10', '34');
  const u35 = apparatZeile(page, '10', '35');
  const g41 = apparatZeile(page, '10', '41');

  // Vorbedingung: die Klassen stehen wirklich im DOM (sonst prüft der Test nichts, §6.7).
  await expect(a34).toHaveAttribute('data-fn-klasse', 'A');
  await expect(u35).toHaveAttribute('data-fn-klasse', 'U');
  await expect(g41).toHaveAttribute('data-fn-klasse', 'G');

  for (const stellung of ['aus'] as const) {
    await waehle(page, stellung);
    await expect(u35, `${stellung}: U folgt der Wahl nicht`).toBeHidden();
    await expect(g41, `${stellung}: G folgt der Wahl nicht`).toBeHidden();
    await expect(a34, `${stellung}: A folgt der Wahl nicht`).toBeHidden();
    // R9/§8: weggeschaltet, nicht gelöscht — der Wortlaut bleibt abfragbar.
    expect((await u35.textContent()) ?? '').toContain('Beträge angepasst');
    expect((await g41.textContent()) ?? '').toContain('Siehe auch die UeB');
  }

  // ZWEISEITIG (§6.7): «Fussnoten» stellt alle drei Klassen wieder her — sonst
  // wäre die Zusicherung oben mit «nichts ist je sichtbar» erfüllbar.
  await waehle(page, 'fussnoten');
  await expect(a34).toBeVisible();
  await expect(a34).toContainText('Fassung gemäss');
  await expect(u35).toBeVisible();
  await expect(g41).toBeVisible();
});

test('axe: das offene Panel mit dem Fussnoten-Schalter ist sauber', async ({ page }, testInfo) => {
  // Das Steuerelement lebt in einem Panel, das die a11y.e2e.ts-Stichprobe NICHT
  // öffnet (die scannt den Reader mit geschlossenem Menü) — ohne diesen Scan wäre
  // die axe-Zusage für diesen Schritt leer. Gescannt wird BEIDES: das offene
  // Panel und die Seite in der Stellung «aus» (dort verschwinden Elemente, und
  // ein verwaistes `aria-controls` oder ein leerer Rahmen fiele hier auf).
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
  // Gleiche Determinismus-Vorkehrungen wie a11y.e2e.ts: Theme gepinnt (sonst
  // entscheidet die Uhrzeit über hell/dunkel → flaky Kontraste) und reduzierte
  // Bewegung (sonst misst axe mitten in der Einblende-Animation).
  await page.addInitScript(() => {
    try { localStorage.setItem('lexmetrik-thema', 'hell'); } catch { /* privater Modus */ }
  });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await warteReader(page, '/gesetze/bund/BGBM', 'art-9');
  await waehle(page, 'aus');
  await ansichtOeffnen(page);
  await expect(page.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME })).toBeVisible();

  const ergebnis = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  // Gleiche Tor-Politik wie a11y.e2e.ts: critical/serious gaten. `link-in-text-block`
  // ist der dokumentierte Marken-Entscheid B-2 (Inline-Links ohne Unterstreichung)
  // und gilt für die ganze Reader-Seite, nicht für diese Fläche.
  const bekannt = new Set(['link-in-text-block']);
  const schwer = ergebnis.violations.filter(
    (v) => (v.impact === 'critical' || v.impact === 'serious') && !bekannt.has(v.id),
  );
  if (ergebnis.violations.length > 0) {
    await testInfo.attach('hist-ansicht-befunde.json', {
      body: JSON.stringify(ergebnis.violations.map((v) => ({
        id: v.id, impact: v.impact, help: v.help, knoten: v.nodes.map((n) => n.target.join(' ')),
      })), null, 2),
      contentType: 'application/json',
    });
  }
  expect(
    schwer.map((v) => `${v.id} (${v.impact}): ${v.help} — z. B. ${v.nodes[0]?.target.join(' ')}`),
    'axe hist-ansicht: keine critical/serious-Verstösse',
  ).toEqual([]);
});
