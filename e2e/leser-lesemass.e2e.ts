// @shard-gruppe: 6
import { test, expect, type Page } from '@playwright/test';
import {
  ANSICHT_PANEL, AUS_WAHL_NAME, FUSSNOTEN_WAHL_NAME, VERMERKE_SCHALTER_NAME, WAHL_ROLLE,
} from './helpers/leserBeschriftung';

// ══ WELCHE HÜLLE PRÜFT DIESE DATEI? (Nachzug 17.8.2026, Arch-Prüfer 7;
//    KORRIGIERT 21.8.2026 nach dem H4-Flip) ═══════════════════════════════════
//
// `ladeReader` navigiert nach `/gesetze/bund/<KEY>` OHNE `?leser=v3` — bis
// 18.8.2026 traf das damit die IST-HÜLLE (V1), weil V1 der ausgelieferte
// Default war. Seit dem H4-Flip (PR #552, 18.8.2026) ist **V3 der Standard**
// (`?leser=v1` erreichte die alte Hülle noch, bis H5 [PR #560, 21.8.2026]
// sie entfernte) — dieselbe
// Navigation trifft seither also V3. Der folgende Absatz galt VOR dem Flip und
// steht als Beleg dafür, dass die Fliesstext-STUFE (Schriftgrösse/Zeilenhöhe)
// in beiden Hüllen identisch war; für das LESEMASS (diese Datei) gilt das seit
// dem Auftrag David 21.8.2026 («LESEMASS_MAX», `pages/gesetz-leser/v3/
// rahmenSpalten.ts`) NICHT mehr — V3 setzt seither einen höheren Deckel als V1.
//
// Das ist für die R5-Fälle nicht mehr «egal, welche Hülle», sondern deren
// Kern: die Zahlen unten sind V3-Zahlen. Gemessen war vor dem Flip bestätigt,
// dass die Fliesstext-STUFE in V1 dieselben 17.00 px / 26.35 px liefert wie in
// V3 — das bleibt unverändert wahr, nur bindet das Lesemass jetzt zusätzlich
// an `LESEMASS_MAX` (nur V3). V3-gegated war bis dahin allein der
// SCHRIFTREGLER (index.css: `.lc-leser[data-leser-v3="rahmen"] … [data-lese]`).
//
// Damit die Zusage der Etappe aber nicht nur AM RANDE der neuen Hülle geprüft ist,
// steht unten EIN Fall ausdrücklich unter `?leser=v3` (StPO 429). Der Query-
// Parameter ist der in `playwright.config.ts` beschriebene Weg, V3 im Projekt
// `chromium` einzuschalten; das Umhängen dieser Datei in das Projekt `leser-v3`
// gehört zu H4 (dort werden die B-Specs geschlossen umgehängt) und wird hier NICHT
// vorgezogen.
//
// R5 (W2·5d G1 / DESIGN-REGLEMENT-NORMTEXT §Typo-Skala): die Lesespalte hält ein
// komfortables Zeilenmass — Desktop ≤ 80 ch @ 1440px (Herleitung der Zahl unten,
// «DIE 80-ch-SCHWELLE»), Mobil hinreichend breit @ 390px.
// Der frühere Ist-Fehler: arbitrary max-w-[52/56rem] (zu breit) + auf Mobil ~16 ch
// (5 gestapelte Guide-Linien à ~24px = ~120px Fraß). Fix: max-w-reading (Token) +
// Guide-/Einzug-Kollaps mobil → gemessen ~32–34 ch (2× der ~16-ch-Basis).
//
// OFFENGELEGTE ABWEICHUNG (§7/§8) vom aspirativen «≥ 40 ch @ 390» der Spec:
// empirisch physikalisch gedeckelt. Bei 390px bleiben nach dem Shell-Seitensteg
// (px-5 = 40px) und der amtstreuen Absatznummer-Rinne (`pl-9` = 36px hängender
// Einzug) ~314px Textbreite; bei der 18px-Lese-Serife (Signatur «über Fedlex»,
// D-B) sind das ~32–34 ch. 40 ch bräuchten ~392px Text (breiter als der Viewport)
// oder eine Schrift < 16px bzw. das Schrumpfen der Absatznummer-Rinne / des
// globalen Seitenstegs — alle drei ausserhalb G1 (D-A…D-E). Floor daher auf die
// robust erreichte, deutlich verbesserte Marke gesetzt; zusätzlich strikt: KEIN
// horizontaler Overflow @390 (der eigentliche Mobil-Gesundheitscheck).
//
// Messmethode (aus docs/ux-audit-2026-07/reader/measure.mjs): der längste
// mehrzeilige Fliesstext-<p> im Volltext; charsPerLine = Textlänge / Zeilenkästen
// (range.getClientRects()). Der Reader liefert PRERENDERTES HTML, React ersetzt es
// nach dem Fetch (render-then-replace) → erst auf #art-1 warten.
// ── DER MOBIL-BODEN STEIGT 30 → 34 (Entscheid David 29.8.2026, deklarierte
//    fachliche Änderung nach §6.3 — kein stilles Anpassen an neue Zahlen) ────
// Die Abweichungsnotiz oben nennt als Engstelle ausdrücklich «5 gestapelte
// Guide-Linien à ~24px = ~120px Frass». Die Guide-Linien sind am 16.8.2026
// gefallen, ihr EINZUG (`pl-einzug-mobil`, 12 px je Tiefe, bis 5 Stufen) blieb
// und frass @390 weiter bis zu 60 px — die tiefsten Stellen des OR standen auf
// 290 px statt 350 px Textkörperbreite. Mit der Aufhebung der Staffelung
// (David 29.8.2026, «alles auf der selben höhe … analog zu fedlex») ist die
// Engstelle FORT: jeder Artikel jedes Erlasses bekommt @390 dieselben 350 px.
//
// NEUE UNTERGRENZE AUS DER MESSUNG, SCHLECHTFALL-BASIERT (nicht Bestfall):
// gemessen am Preview-Build @390 mit der Methode dieser Datei —
//   ERLASSE:  OR 37 · ZGB 37 · VMWG 35 ch   (vorher OR 33 · ZGB 37 · VMWG 35)
//   ausserhalb der Torliste: StGB 41 · StPO 36 · BS-640.100 33 ch
// Massgeblich ist der schlechteste Fall der GEGATETEN Liste (VMWG 35), der
// Boden liegt mit 1 ch Reserve darunter. Nicht auf 33 gesetzt (der frühere
// Schlechtfall OR): dieser Wert existiert nicht mehr, und ein Boden unter dem
// erreichten Schlechtfall bewacht nichts (§6.7).
// ── §6.3-DEKLARATION (W2·24-R6c, 6.9.2026): 34 → 31 ─────────────────────────
// KEINE Aufweichung, sondern die rechnerische Folge von D20 (c): die
// Fliesstext-Stufe steigt 17 → 18 px, die Textkörperbreite @390 bleibt bei
// physikalisch unveränderten 350 px. Grössere Buchstaben auf derselben Spalte
// heissen zwangsläufig WENIGER Zeichen je Zeile — und genau das ist der
// Lesekomfort, den David bestellt hat (D12/D20), nicht ein Verlust.
// GEMESSEN am Preview-Build dieses Nachzugs @390 (Methode dieser Datei):
//   ERLASSE:  ZGB 37 → 37 · OR 35 → 35 · VMWG 35 → 32 ch
//   ausserhalb der Torliste: StGB 41 · StPO 34 · BS-640.100 33 ch
// Massgeblich bleibt der Schlechtfall der GEGATETEN Liste (VMWG 32), der Boden
// liegt mit 1 ch Reserve darunter — dieselbe Regel, nach der 34 entstanden ist.
// Die eigentliche Mobil-Zusage (KEIN horizontaler Überlauf) ist unberührt.
const MOBIL_MIN_CH = 31;

const ERLASSE = ['ZGB', 'OR', 'VMWG'] as const;

async function ladeReader(page: Page, key: string): Promise<void> {
  await page.goto(`/gesetze/bund/${key}`);
  await expect(page.locator('#art-1')).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  // Etwas Inhalt in den Viewport bringen, damit content-visibility-Artikel
  // Layout bekommen (die obersten sind ohnehin sichtbar).
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(300);
}

async function messeMaxCharsPerLine(page: Page): Promise<{ ch: number; px: number } | null> {
  return page.evaluate(() => {
    let best: { ch: number; px: number } | null = null;
    document.querySelectorAll('[id^="art-"] p').forEach((p) => {
      const text = (p.textContent ?? '').trim();
      if (text.length < 40) return; // zu kurz für eine belastbare Messung
      const range = document.createRange();
      range.selectNodeContents(p);
      const rects = range.getClientRects();
      if (rects.length < 3) return; // nur echt umbrechende Absätze
      const ch = Math.round(text.length / rects.length);
      const px = Math.round((p as HTMLElement).getBoundingClientRect().width);
      if (!best || ch > best.ch) best = { ch, px };
    });
    return best;
  });
}

// ═══ S2 (W2·5m-LESER-V3, Pos. 19 · F3 = V2, David 17.8.2026 am Bildbogen) ═══
//
// Der Fliesstext läuft auf der Token-Stufe `leser-text` (1.0625 rem / lh 1.55)
// statt auf `text-body-l` + rohem `leading-[1.65]`-Override. Was hier festgehalten
// wird, ist die WCAG-Zusage der Etappe (SC 1.4.8 «Visual Presentation»: Zeile
// ≤ 80 Zeichen, Zeilenabstand ≥ 1.5) — und zwar an ALLEN drei Bogen-Breiten, nicht
// nur an der Desktop-Breite, die die Fälle oben schon prüfen.
//
// ROT ZU BEKOMMEN (§6.7): in `ArtikelLeser.tsx` `text-leser-text` durch
// `text-body-l` ersetzen (lh fällt auf 1.5 → der lh-Fall bleibt knapp grün, der
// px-Fall reisst), oder in `tailwind.config.js` die Stufe `leser-text` auf
// lineHeight 1.4 setzen (lh-Fall rot), oder `max-w-normtext` aufweiten (ch-Fall).
const BOGEN_BREITEN = [390, 720, 1440] as const;

test.describe('S2 · WCAG 1.4.8 am Fliesstext (≤ 80 ch, lh ≥ 1.5)', () => {
  for (const width of BOGEN_BREITEN) {
    test(`StPO @${width}: Fliesstext ≤ 80 ch und lh ≥ 1.5`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await ladeReader(page, 'STPO');
      const m = await messeMaxCharsPerLine(page);
      expect(m, `@${width}: mehrzeiliger Fliesstext-Absatz gefunden`).not.toBeNull();
      expect(m!.ch, `@${width}: ${m!.ch} ch (${m!.px}px) muss ≤ 80 sein (SC 1.4.8)`)
        .toBeLessThanOrEqual(80);

      // Zeilenabstand am GERECHNETEN Stil, nicht an der Klasse: nur so fällt der
      // Fall auch dann, wenn ein Override die Stufe später wieder überschreibt
      // (genau das tat `leading-[1.65]` bis S2).
      const typo = await page.evaluate(() => {
        const p = document.querySelector('[id^="art-"] [data-lese] p');
        if (!p) return null;
        const s = getComputedStyle(p);
        return { fs: parseFloat(s.fontSize), lh: parseFloat(s.lineHeight) };
      });
      expect(typo, `@${width}: Fliesstext-Absatz im Lese-Container gefunden`).not.toBeNull();
      const quotient = typo!.lh / typo!.fs;
      expect(quotient, `@${width}: lh ${typo!.lh}px / fs ${typo!.fs}px = ${quotient.toFixed(3)} muss ≥ 1.5 sein (SC 1.4.8)`)
        .toBeGreaterThanOrEqual(1.5);
      // ── §6.3-DEKLARATION (W2·24-R6c, 6.9.2026) ──────────────────────────
      // 17 → 18 px. D20 (c) «Lesetext 18 px» hebt die Stufe `leser-text` in
      // `tailwind.config.js` auf 1.125 rem; die Zusage dieses Falls ist
      // unverändert «die Grösse kommt AUS DER STUFE, nicht aus einem Override»
      // und bleibt exakt so streng — nur die Zahl ist entschieden worden.
      // Und die Stufe selbst: 1.125 rem = 18 px bei 16-px-Wurzel.
      expect(typo!.fs, `@${width}: Fliesstext-Grösse (D20 (c): 18 px)`).toBeCloseTo(18, 1);
    });
  }

  // ── DER EINE FALL IN DER NEUEN HÜLLE (Nachzug 17.8.2026, Arch-Prüfer 7) ─────
  // Alle Fälle oben laufen gegen die Ist-Hülle (s. Kopf der Datei). Die Etappe
  // verspricht die V2-Stufe aber für den LESER, und die neue Hülle ist sein
  // Zielzustand — also wird sie hier ausdrücklich gemessen, statt sie aus der
  // Kern-Zugehörigkeit zu folgern. Erwartung sind DIESELBEN Werte wie in V1
  // (18.00 px / 29.16 px = lh 1.62, s. Deklaration unten): V3 gated nur den Schriftregler, nicht die
  // Grundstufe. Genau das macht den Fall wertvoll — er würde rot, sobald die neue
  // Hülle die Stufe eigenmächtig verstellt oder ein V3-Override sie überschreibt.
  //
  // ROT ZU BEKOMMEN (§6.7): in `index.css` die Regler-Regel auf `[data-leser-v3]`
  // ohne `:not([data-leserschrift="normal"])` legen (V3 bekäme eine andere
  // Grundgrösse als V1) oder in `LeserRahmenV3` eine eigene Textstufe setzen.
  // ── §6.3-DEKLARATION (Nachzug W2·24-R4, gebucht in R6 am 6.9.2026) ────────
  // Die erwartete Zeilenhöhe ist 29.16 px (= 18 × 1.62); bis R6c 27.54 (17 × 1.62),
  // bis R4 26.35 (17 × 1.55).
  // Die Stufe `leser-text` steht seit R4 auf **1.62** (`tailwind.config.js`,
  // Wert aus dem freigegebenen Referenzbild); R4 hat den Unit-Wächter
  // `leser-typo-tokens.test.ts` deklariert nachgezogen, diesen Fall aber nicht —
  // er ist seit dem R4-Merge rot und lag bereits auf dem R6-Basis-Commit
  // 0834cbd7b so vor (dort gegengelesen: `tailwind.config.js:195` führt
  // `'leser-text': ['1.0625rem', { lineHeight: '1.62' }]`). Kein R6-Bau hat ihn
  // verursacht; er wird hier nur nachgeführt, weil ein rotes Tor, das niemand
  // bucht, beim nächsten Lauf als Rauschen gilt (§17).
  // Die ABSICHT bleibt unangetastet: Grösse UND Zeilenhöhe kommen aus der
  // Typo-Stufe, nicht aus einem Override in der V3-Hülle; die SC-1.4.8-Zusage
  // (lh-Quotient ≥ 1.5) steht unverändert darunter und wird durch 1.62 sogar
  // komfortabler erfüllt.
  test('StPO @1440 unter ?leser=v3: dieselbe Stufe wie in der Ist-Hülle (18.00 / 29.16 px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gesetze/bund/STPO');
    await expect(page.locator('#art-1')).toBeVisible();
    await page.evaluate(() => document.fonts?.ready);
    // Positiv-Sicherung: der Fall muss WIRKLICH in V3 stehen, sonst prüft er die
    // Ist-Hülle ein viertes Mal (§6.7 — «ein Tor, das nicht scheitern kann»).
    await expect(page.locator('.lc-leser[data-leser-v3="rahmen"]')).toHaveCount(1);
    // Und der Mess-Artikel der Etappe: StPO Art. 429 (Bildbogen-Fall).
    await page.evaluate(() => document.getElementById('art-429')?.scrollIntoView());
    await page.waitForTimeout(400);
    const typo = await page.evaluate(() => {
      const p = document.querySelector('#art-429 [data-lese] p') ?? document.querySelector('[id^="art-"] [data-lese] p');
      if (!p) return null;
      const s = getComputedStyle(p);
      return { fs: parseFloat(s.fontSize), lh: parseFloat(s.lineHeight) };
    });
    expect(typo, 'Fliesstext-Absatz im V3-Lese-Container gefunden').not.toBeNull();
    // §6.3-DEKLARATION (R6c): 17.00/27.54 → 18.00/29.16 px. Dieselbe Stufe,
    // dieselbe Zeilenhöhe 1.62 — nur die Basis ist von 1.0625 auf 1.125 rem
    // gehoben (D20 (c)). Die ABSICHT «V3 setzt keine eigene Grundgrösse» ist
    // unberührt: der Fall stünde weiter rot, sobald die Hülle eigenmächtig
    // verstellt.
    expect(typo!.fs, 'V3: Fliesstext-Grösse 18 px (D20 (c))').toBeCloseTo(18, 1);
    expect(typo!.lh, 'V3: Zeilenhöhe 29.16 px = lh 1.62 (R4-Stufe)').toBeCloseTo(29.16, 1);
    expect(typo!.lh / typo!.fs, 'V3: lh-Quotient ≥ 1.5 (SC 1.4.8)').toBeGreaterThanOrEqual(1.5);
  });
});

test.describe('S2 · Fussnotenmarke: hochgestellt, ohne Klammern (Entscheid David 17.8.2026)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('StPO: Marke ist hochgestellt und kleiner als der Fliesstext — kein «(» im Markentext', async ({ page }) => {
    await ladeReader(page, 'STPO');
    // ENTSCHEID DAVID 17.8.2026 am Bildbogen, Wortlaut «v2 gefällt mir besser aber
    // fussnoten hochgestellt»: der V2-Satzspiegel gilt, die Marke behält aber die
    // hochgestellte, klammerlose V1-Form. Die V2-Spalte des Fahrplans (Kap. 8) sah
    // runde Klammern vor — dieser Fall hält die Abweichung fest, damit ein späterer
    // «Nachzug auf V2» sie nicht stillschweigend zurückdreht.
    const marke = await page.evaluate(() => {
      const el = document.querySelector('[id^="art-"] [data-fn-marker] a, [id^="art-"] [data-fn-marker] button');
      if (!el) return null;
      const s = getComputedStyle(el);
      // `--fn-marke` ist em-relativ, und `em` bezieht sich auf den ELTERNKNOTEN —
      // gegen den wird darum gemessen, nicht gegen einen beliebigen Fliesstext-
      // Absatz. (Die Marke sitzt je nach Fundort im Fliesstext ODER an der
      // Marginalie; ein `[data-lese] p` gibt es im zweiten Fall nicht.)
      const eltern = el.parentElement;
      return {
        text: (el.textContent ?? '').trim(),
        va: s.verticalAlign,
        fs: parseFloat(s.fontSize),
        basis: eltern ? parseFloat(getComputedStyle(eltern).fontSize) : null,
      };
    });
    expect(marke, 'Fussnoten-Marke im Fliesstext gefunden').not.toBeNull();
    expect(marke!.text, 'Marke trägt eine Klammer — Entscheid David 17.8.2026 verlangt die klammerlose Form')
      .not.toContain('(');
    expect(marke!.text, 'Marke trägt eine schliessende Klammer').not.toContain(')');
    expect(marke!.va, 'Marke ist nicht hochgestellt (align-super)').toBe('super');
    // Kleiner als der Fliesstext, aber nicht winzig: `--fn-marke` = 0.72 em.
    expect(marke!.fs).toBeLessThan(marke!.basis!);
    expect(marke!.fs / marke!.basis!).toBeCloseTo(0.72, 1);
  });
});

// ── §17-RÜCKBAU · W2·24-D40 (David 7.9.2026) · HIER STAND DAS Ä26-TOR ───────
//
// Es bewachte die Beiwerk-RESERVE des Fassungs-Slots: «§ 20 (mit Fussnoten)
// reserviert 24 px, § 1 (ohne) reserviert nicht» — die artikelweise Regel, mit
// der der Ästhetik-Prüfer am 17.8.2026 die Phantom-Lücke unter 292 von 292
// Artikeln des BS-640.100 abgeräumt hat.
//
// DER GEGENSTAND IST WEG, ALSO GEHT DAS TOR MIT. Davids Frage «und wieso ist
// fassung nicht auch unten am artikel?» hat den Slot in die Funktionszeile am
// Artikelende verlegt; mit ihm ist seine Reserve (`mt-4 min-h-beiwerk`)
// ersatzlos gefallen, und ein Tor ohne Gegenstand kann nicht mehr scheitern
// (§6.7/§17-Gegengewicht — gestrichen statt bewacht). Es misst heute nichts:
// `[data-hist-slot]` existiert im DOM nicht mehr, beide Fälle wären still grün.
//
// DER BELEG BLEIBT STEHEN (§0 Ziff. 2b): die Messreihe vom 17.8.2026 und die
// Herleitung «die Reserve folgt dem Datenmodell, nicht der Erlass-Ebene» sind
// im Commit dieses Tors und in `ArtikelLeser.tsx` unverändert nachlesbar. Sie
// waren richtig für ihren Stand.
//
// WAS AN SEINE STELLE TRITT: `e2e/gesetze-historie-badge` misst den
// Marken-Einwuchs jetzt an der Geometrie der FOLGENDEN Artikel (exakte
// Gleichheit, kein Budget), und `e2e/w224-d40-fassung` misst dieselbe Zusage
// am gelesenen Artikel. Beide sind schärfer als eine `min-height`-Ablesung.

// ── S2 · Umschalten hinterlässt keinen Rest (Rundlauf) ───────────────────────
//
// ABGRENZUNG ZUM ABNAHME-KRITERIUM DER ETAPPE, offengelegt (§7): der Auftrag
// verlangte «das Umschalten aller drei Schalter erzeugt an keinem Artikel einen
// Layout-Sprung». Das ist mit dem David-Entscheid A1 (5.7.2026, «AUS» = die
// Fussnoten VERSCHWINDEN, statt gedämpft zu werden) nicht erfüllbar: der Apparat
// misst je Artikel 27–187 px, und ihn höhenfest zu reservieren wäre genau das
// verbotene Dämpfen. Ein Boden fängt nur, was kleiner ist als er selbst.
// (Nebenbefund: es sind seit S1 ZWEI Schalter — «Fussnoten» und
// «Änderungsvermerke» —, «Rechtsprechung» ist ein Dropdown, kein Schalter.)
//
// Erfüllbar und darum hier zugesichert ist die Zusage, die A1 nicht verletzt: das
// Umschalten ist VERLUSTFREI. Nach an→aus→an steht jeder Artikel wieder exakt auf
// seiner Ausgangshöhe — kein zurückgelassener reservierter Rest, keine
// verschluckten Pixel. Genau diese Fehlerklasse hat Ä26 hervorgebracht (eine
// Reserve, die den Schalter überlebt) und S1-K4 davor.
test.describe('S2 · Schalter-Rundlauf ist verlustfrei (A1-konform)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('BGBM: an→aus→an stellt jede Artikel-Höhe exakt wieder her', async ({ page }) => {
    // BGBM wie in `leser-optionen.e2e.ts`: klein (~22 KB), trägt Marker UND
    // Apparat — der grosse OR starvte den gedrosselten CI-Runner (Befund 4.7.2026).
    await page.goto('/gesetze/bund/BGBM');
    await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(300);

    // ROBUSTE SETTLE-BEDINGUNG (§6.3, Anlass: Rot-Beweis 21.8.2026 nach
    // `LESEMASS_MAX`, Diagnose s. u.) ─────────────────────────────────────────
    // Artikel jenseits der ersten Bildschirmseite tragen `content-visibility:
    // auto` (`.nt-art-cv`, index.css) — solange sie NIE echtes Layout hatten,
    // liefert `getBoundingClientRect()` nicht die echte Höhe, sondern den
    // JS-GESCHÄTZTEN Platzhalter (`contain-intrinsic-size`, `schaetzeArtikelHoehe`
    // in `gesetz-leser/berechnungen.ts` — bewusst grosszügig kalibriert auf die
    // SCHMALERE V1-Spalte, «echte Höhe ≤ Schätzung», s. dortiger Kommentar).
    // Seit `LESEMASS_MAX` (V3, 45rem statt ~42rem) klafft diese Schätzung bei
    // nie-gerenderten Artikeln spürbar weiter auseinander (BGBM Art. 4:
    // Schätzung 931px vs. echte 842px — Diagnose-Messung, kein Zufallswert).
    // Ohne diesen Schritt liefert die ERSTE Messung («vorher») die Schätzung,
    // jede Messung NACH dem ersten Schalter-Klick (der wegen einer anderen
    // DOM-Änderung anderswo im Baum ein echtes Layout erzwingt) aber die echte
    // Höhe — der Test verglich also Schätzung mit Wirklichkeit, nicht Wirklichkeit
    // mit Wirklichkeit, und der «Rest» war ein Mess-Artefakt, kein Schalter-Bug
    // (belegt: reines Warten ohne Schalter über 2 s hält die Schätzung stabil bei
    // 931px; einmaliges Durchscrollen OHNE jeden Schalter-Klick senkt sie bereits
    // auf die echten 842px). Fix: vor der Baseline-Messung einmal schrittweise
    // durchscrollen — jeder Artikel bekommt so vor «vorher» ein echtes Layout,
    // exakt wie ein realer Leser es beim Ankommen auf der Seite ohnehin auslöst.
    const gesamt = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < gesamt; y += 850) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(80);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    const hoehen = () => page.evaluate(() => Array.from(document.querySelectorAll('article[id^="art-"]'))
      .map((a) => Math.round(a.getBoundingClientRect().height)));

    const vorher = await hoehen();
    expect(vorher.length, 'keine Artikel gemessen').toBeGreaterThan(3);

    const schalten = async (name: string | RegExp) => {
      await page.getByRole('button', { name: 'Ansicht' }).first().click();
      const gruppe = page.locator(ANSICHT_PANEL).first();
      await expect(gruppe).toBeVisible();
      await gruppe.getByRole(WAHL_ROLLE, { name }).click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    };

    // ── §6.3-DEKLARATION (Nachzug W2·24-R4, gebucht in R6 am 6.9.2026) ──────
    // Die WIRKUNGS-Sonde misst nicht mehr die Artikel-HÖHEN, sondern die Zahl
    // der sichtbaren Beiwerk-Knoten. Grund: R4 hat den Fassungs-Slot im
    // Satzspiegel in die MARGINALIE verlegt (`ArtikelLeser`, `histInRand =
    // spiegel !== 'zeile'`), und dort bestimmt er die Artikelhöhe nicht mehr —
    // die kommt aus der Textspalte. Der Schalter WIRKT also weiterhin, nur
    // nicht mehr in der Grösse, die diese Sonde gelesen hat. Das lag bereits
    // auf dem R6-Basis-Commit 0834cbd7b so vor (dort gegengelesen:
    // `ArtikelLeser.tsx:347` und `SPIEGEL_MIN_MARG` = 45.625 rem = 730 px,
    // während die Lese-Zelle @1280 764 px misst ⇒ Marginalie steht).
    // Die ABSICHT ist unverändert und wird strenger erfüllt: der Schalter muss
    // beweisbar etwas tun (§6.7) — sichtbar/unsichtbar ist die Sache selbst,
    // eine Höhendifferenz war immer nur ihr Nebeneffekt. Die
    // RUNDLAUF-Prüfung darunter misst weiterhin die Höhen, byte-gleich.
    // §6.3-DEKLARATION (D40, 7.9.2026): `[data-hist-slot]` gibt es nicht mehr;
    // die schaltbare Fassungs-Spur ist die Rubrik-Marke der Funktionszeile.
    const beiwerkSichtbar = () => page.evaluate(() => [...document.querySelectorAll(
      '.lr7-bez-marke[data-reg="f"], [data-fn-apparat], [data-fn-marker]')]
      .filter((e) => (e as HTMLElement).checkVisibility()).length);
    // Ä116: V3 «Fassung» (helpers/leserBeschriftung).
    // ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ──────────────────
    // Aus zwei unabhängigen Schaltern ist EINE Radiogruppe geworden; ein
    // «Rundlauf» heisst darum nicht mehr «zweimal denselben Schalter», sondern
    // «weg von der Vorgabe und zurück». Geprüfter Sachverhalt unverändert: die
    // Bedienung WIRKT, und sie lässt keinen Höhen-Rest zurück.
    for (const name of [FUSSNOTEN_WAHL_NAME, AUS_WAHL_NAME]) {
      const wirkungVorher = await beiwerkSichtbar();
      expect(wirkungVorher, `Stellung «${String(name)}»: nichts Sichtbares zum Schalten`).toBeGreaterThan(0);
      await schalten(name);                     // Vorgabe → andere Stellung
      // Die Stellung muss überhaupt WIRKEN — sonst wäre der Rundlauf unten
      // trivial grün (eine Bedienung ohne Wirkung besteht ihn immer, §6.7).
      expect(await beiwerkSichtbar(), `Stellung «${String(name)}» ändert gar nichts`).not.toBe(wirkungVorher);
      await schalten(VERMERKE_SCHALTER_NAME);   // zurück auf die Vorgabe
      expect(await hoehen(), `Stellung «${String(name)}»: Rundlauf lässt einen Rest zurück`).toEqual(vorher);
    }
  });
});

// ── DIE 80-ch-SCHWELLE (Nachzug 17.8.2026, Arch-Prüfer 9; ENTSCHIEDEN
//    21.8.2026, Auftrag David «gesetzestext … breiter») ──────────────────────
//
// Die Schwelle stand hier bis 21.8.2026 auf 75 (HAUSdecke,
// DESIGN-REGLEMENT-NORMTEXT §Typo-Skala) — ENGER als die WCAG-Decke (SC 1.4.8
// = 80 ch, die der S2-Block oben an drei Breiten prüft). Mit F3 = V2 (17 px)
// gemessen war sie schon ohne LESEMASS_MAX knapp: ZGB 68 · OR 71 · StPO 73 ·
// VMWG 74 · StGB 77 ch — VMWG mit 1 ch Luft, StGB (nicht in `ERLASSE`) DARÜBER.
// Der Vollzugsvermerk S2 nannte zwei Auswege («Lesemass schmaler» oder
// «Hausdecke auf WCAG 80 heben») und liess die Wahl offen.
//
// David 21.8.2026 hat den Text ausdrücklich BREITER gemacht (`LESEMASS_MAX`,
// `pages/gesetz-leser/v3/rahmenSpalten.ts` — Auftrag, Erledigung von
// Cowork-Befund 50 und dem offenen Satzspiegel-Punkt), nicht schmaler — die
// erste Option ist damit vom Tisch, die zweite ENTSCHIEDEN: die Hausdecke
// steigt auf die WCAG-Marke, EINE Zahl statt zwei knapp beieinanderliegender.
// NEU GEMESSEN @1440 (V3, `LESEMASS_MAX` = 45 rem = 720 px):
//
//   ZGB 75 ch · OR 77 ch · StPO 75 ch · VMWG 74 ch · StGB 78 ch
//
// `LESEMASS_MAX` selbst ist an StGB (77→81 ch bei einem ersten Versuch mit
// 46 rem) kalibriert, DAMIT die 80-ch-Decke bei jeder Stichprobe Reserve
// behält (Herleitung: `rahmenSpalten.ts`) — sie ist darum weiterhin KEIN
// Schein-Tor: eine künftige Verbreiterung ohne erneute Messung reisst sie.
test.describe('R5 · Lesemass Desktop (≤ 80 ch @ 1440)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const key of ERLASSE) {
    test(`${key}: Lesespalte ≤ 80 ch`, async ({ page }) => {
      await ladeReader(page, key);
      const m = await messeMaxCharsPerLine(page);
      expect(m, `${key}: mehrzeiliger Fliesstext-Absatz gefunden`).not.toBeNull();
      expect(m!.ch, `${key} @1440: ${m!.ch} ch (${m!.px}px) muss ≤ 80 sein (SC 1.4.8, wie S2 oben)`).toBeLessThanOrEqual(80);
    });
  }
});

// ── T-1C · ZEILENMASS-DECKEL UND EINE TEXTKANTE (Entscheid David 29.8.2026) ──
//
// Zwei Zusagen desselben Entscheids, die der 80-ch-Fall oben NICHT deckt:
//
//  (a) EINE KANTE. «es soll alles auf der selben höhe stehen … analog zu
//      fedlex» — der Textkörper steht über alle Gliederungstiefen auf derselben
//      linken Kante und hat dieselbe Breite. Gemessen wird an ALLEN gerenderten
//      `.max-w-normtext` der Seite; vor dem Entscheid lieferte allein das OR
//      @1440 SECHS verschiedene Kanten (554…654 px) und sechs Breiten
//      (540…640 px), das ZGB fünf, das StGB vier.
//  (b) ~68 ZEICHEN. Der Deckel `--leser-zeilenmass` (index.css, Variante 1C)
//      hält das Zeilenmass unter der HAUSzahl 68, deutlich unter der
//      WCAG-Decke 80. Gemessen am Preview-Build @1440:
//        OR 67 · ZGB 66 · StGB 66 · StPO 64 · VMWG 63 · BS-640.100 56 ch
//      Schwelle 70 = Schlechtfall 67 + 3 ch Reserve für Rundung und
//      Font-Fallback; sie ist damit KEIN Schein-Tor (§6.7): ohne den Deckel
//      lagen dieselben Erlasse bei 69–74 ch, jede Rücknahme reisst sie.
//
// Bewusst BEIDE Ebenen im selben Fall: die Kante ohne den Deckel liesse den
// Text zu breit werden, der Deckel ohne die Kante wäre wieder tiefenabhängig.
//
// ROT ZU BEKOMMEN (§6.7): in `LeserLesespalte.tsx` das frühere
// `pl-einzug-mobil sm:pl-einzug` an der `section` wiederherstellen (Fall a und,
// über die verengten Spalten, auch die Breiten-Aussage), oder in `index.css`
// `--leser-zeichen` auf 80 setzen bzw. die `min()`-Klammer entfernen (Fall b).
// ── §6.3-DEKLARATION (W2·24-R6c, 6.9.2026): AUS DEM DECKEL WIRD EINE SPANNE ──
//
// D20 (c) verlangt «65–72 CPL». Bis hierher stand nur die OBERE Kante (≤ 70) —
// eine zu SCHMALE Spalte konnte das Tor nie melden, und genau das war der
// Zustand nach R6b (gemessen 63–66 ch, also unter der Spanne). Der Fall wird
// damit STRENGER, nicht weicher: die obere Kante wandert 70 → 72 (die Zahl des
// Entscheids), und darunter kommt eine zweite Kante bei 65.
//
// GEMESSEN am Preview-Build dieses Nachzugs (`--leser-zeichen: 70`, Basis
// 1.125 rem), Methode dieser Datei:
//   @1440  ZGB 67 · OR 67 · StGB 68 · StPO 68 · VMWG 68 · BS-640.100 56 ch
//   @1280  ZGB 67 · OR 67 · StGB 68 · StPO 68 · VMWG 68 · BS-640.100 56 ch
// Die Textkörperbreite ist in ALLEN sechs Fällen dieselbe (640 px @1440,
// 641 px @1280) — die Spalte ist also bei allen sechs gleich gesetzt.
//
// WARUM BS-640.100 KEINE UNTERGRENZE TRÄGT (offengelegt, §8). Seine 56 ch sind
// keine Aussage über die Spalte, sondern über die ABSATZFORM: die Methode
// rechnet `Textlänge / Zeilenkästen`, und kantonale §-Absätze enden häufig mit
// einer halb gefüllten Zeile, die voll in den Nenner zählt. Bei gleicher
// Spaltenbreite (oben gemessen) liefert derselbe Erlass darum systematisch
// weniger. Eine Untergrenze gegen ihn würde die Absatzform bewachen, nicht den
// Satzspiegel — und wäre entweder wirkungslos (bei 50) oder dauerhaft rot (bei
// 65). Stattdessen prüft der Fall bei ihm, dass seine Breite mit der der übrigen
// übereinstimmt: die Zusage «alle sechs stehen auf derselben Spalte» ist damit
// ohne Umweg über die Zeichenzahl gedeckt.
//
// ROT ZU BEKOMMEN (§6.7): `--leser-zeichen` in `index.css` auf 60 senken (alle
// fünf Untergrenzen reissen, Spalte 555 statt 640 px) oder auf 90 heben bzw. die
// `min()`-Klammer entfernen (Obergrenzen reissen) — beides einzeilig.
// [Nachtrag 7.9.2026: es sind seither VIER Untergrenzen — VMWG ist zu BS-640.100
//  gewandert, Herleitung im Block unten. Das Rezept wirkt unverändert; VMWG
//  reisst dann über die Breiten-Zusage statt über die Zeichenzahl.]
// ── §6.3-DEKLARATION (CI-Fix E, 7.9.2026): VMWG VERLIERT SEINE UNTERGRENZE ──
//
// Die Messreihe darüber bleibt unangetastet (§0 Ziff. 2b — datierte Belege
// werden ergänzt, nie nachgeführt): am 6.9.2026 mass VMWG @1440 lokal 68 ch,
// und mit dieser Zahl ist die Untergrenze eingezogen worden. Der erste CI-Lauf,
// der die Datei überhaupt erreichte (34066539241, Shard 2, 6./7.9.2026), hat sie
// falsifiziert — und zwar so, dass die WURZEL mitgeliefert wird:
//
//   VMWG @1280  GRÜN   (Spalte 641 px)
//   VMWG @1440  ROT     63 ch bei Spalte **640 px** — genau der erwartete Wert
//   ZGB/OR/StGB/StPO @1440 und @1280  alle GRÜN (Shard-Bilanz: 230 passed,
//   1 failed, 0 did not run — die anderen elf T-1C-Fälle sind wirklich gelaufen)
//
// DIE SPALTE IST ALSO RICHTIG, und der CI rendert auch nicht pauschal breiter:
// derselbe Erlass fällt bei EINEM Pixel Spaltenunterschied von 68 auf 63 ch.
// Das kann keine Aussage über den Satzspiegel sein.
//
// WARUM DIE ZAHL BEI VMWG KIPPT — dieselbe Mechanik wie bei BS-640.100 oben,
// nur eine Stufe schärfer. Die Methode rechnet `Textlänge / Zeilenkästen`, ein
// MITTEL über alle Zeilen samt der halb gefüllten letzten. Der Wert eines
// Erlasses ist das MAXIMUM über seine Absätze, und er ist damit nur so gut wie
// der glücklichste Absatz: einer, dessen letzte Zeile zufällig fast voll läuft.
// Gemessen 7.9.2026 (Preview 4406, @1440) die fünf höchsten VMWG-Absätze:
//   68 (204 Z. auf 3 Kästen) · 63 (188/3) · 55 (164/3) · 53 (158/3) · 46 (415/9)
// Die 68 hängen an EINEM Absatz. Bricht er eine Zeile später um — und genau das
// tut er auf dem CI-Runner bei 640 statt 641 px —, fällt er auf 204/4 = 51, und
// der Erlass erbt die 63 des Zweitplatzierten. Zum Vergleich die grossen
// Erlasse, gleiche Messung: ZGB 67·67·66·66·66·66, StPO 68·66·64·63·63·60 —
// dort trägt nicht ein Absatz, sondern ein Feld von Absätzen die Zahl.
//
// DER MASSSTAB IST DAMIT BENANNT (und nicht nur VMWG ausgenommen): die
// Untergrenze ist nur für Erlasse mit GROSSEM Absatzbestand aussagekräftig, weil
// erst dort ein Absatz mit voll laufender Schlusszeile sicher vorkommt. Gemessen
// (messbare Absätze mit ≥ 3 Zeilenkästen, 7.9.2026): ZGB 3375 · StPO 1427 —
// gegen VMWG 101. Eine Verordnung mit hundert kurzen Absätzen misst ihre
// Absatzform, nicht ihre Spalte. VMWG steht damit dort, wo BS-640.100 seit R6c
// aus demselben Grund steht.
//
// WAS DER FALL BEI VMWG WEITERHIN ZUSAGT — und warum das keine Lücke ist: die
// Obergrenze (≤ 72 ch) bleibt, die EINE Textkante und die EINE Breite bleiben,
// und die Breiten-Zusage unten bindet VMWG auf **dieselben 640/641 px wie die
// fünf anderen** (`toBeCloseTo(…, -0.5)`, Toleranz ~1.6 px). Genau diese Zusage
// hat der rote Lauf erfüllt gemeldet. Vier von sechs Erlassen tragen die
// Untergrenze unverändert; verloren geht nur eine Zahl, die eine Woche lang
// Zufall gemessen hat.
const T1C_MAX_CH = 72;
const T1C_MIN_CH = 65;
/** Erwartete Textkörperbreite je Fenster (px) — s. Messreihe oben. */
const T1C_BREITE: Readonly<Record<number, number>> = { 1440: 640, 1280: 641 };
const T1C_ERLASSE = [
  ['ZGB', 'bund/ZGB', true], ['OR', 'bund/OR', true], ['StGB', 'bund/STGB', true],
  ['StPO', 'bund/STPO', true],
  // `false` = keine Untergrenze, s. Herleitung oben (BS-640.100 seit R6c,
  // VMWG seit dem CI-Fix vom 7.9.2026 — beide aus demselben Grund).
  ['VMWG', 'bund/VMWG', false],
  ['BS-640.100', 'kanton/BS-640.100', false],
] as const;

for (const fenster of [1440, 1280] as const) {
test.describe(`T-1C · Zeilenmass ${T1C_MIN_CH}–${T1C_MAX_CH} ch und EINE Textkante @${fenster}`, () => {
  test.use({ viewport: { width: fenster, height: 900 } });
  for (const [name, pfad, untergrenze] of T1C_ERLASSE) {
    test(`${name} @${fenster}: eine linke Textkante, eine Breite, ${untergrenze ? `${T1C_MIN_CH}–${T1C_MAX_CH}` : `≤ ${T1C_MAX_CH}`} ch`, async ({ page }) => {
      await page.goto(`/gesetze/${pfad}`);
      await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 });
      await page.evaluate(() => document.fonts?.ready);
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(300);

      const geo = await page.evaluate(() => {
        const kanten = new Set<number>();
        const breiten = new Set<number>();
        document.querySelectorAll('article[id^="art-"] .max-w-normtext').forEach((d) => {
          const r = d.getBoundingClientRect();
          if (r.width > 0) { kanten.add(Math.round(r.left)); breiten.add(Math.round(r.width)); }
        });
        return { kanten: [...kanten].sort((a, b) => a - b), breiten: [...breiten].sort((a, b) => a - b) };
      });
      // Positiv-Sicherung: der Fall muss überhaupt Textkörper gemessen haben,
      // sonst wäre «genau eine Kante» durch eine leere Menge trivial erfüllt.
      expect(geo.kanten.length, `${name}: kein Artikel-Textkörper gemessen`).toBeGreaterThan(0);
      expect(geo.kanten, `${name}: mehr als EINE linke Textkante — die Staffelung ist zurück`)
        .toHaveLength(1);
      expect(geo.breiten, `${name}: mehr als EINE Textkörperbreite (${geo.breiten.join('/')}px)`)
        .toHaveLength(1);

      const m = await messeMaxCharsPerLine(page);
      expect(m, `${name}: mehrzeiliger Fliesstext-Absatz gefunden`).not.toBeNull();
      expect(m!.ch, `${name} @${fenster}: ${m!.ch} ch (${m!.px}px) muss ≤ ${T1C_MAX_CH} sein (D20 (c))`)
        .toBeLessThanOrEqual(T1C_MAX_CH);
      if (untergrenze) {
        expect(m!.ch, `${name} @${fenster}: ${m!.ch} ch (${m!.px}px) muss ≥ ${T1C_MIN_CH} sein (D20 (c)) — die Lesespalte ist zu schmal`)
          .toBeGreaterThanOrEqual(T1C_MIN_CH);
      }

      // Die Spalte selbst — die Zusage, die für ALLE sechs gilt (auch dort, wo
      // die Zeichenzahl von der Absatzform verwässert wird). Steht bewusst NACH
      // den Zeichen-Kanten: die Zeichenzahl ist die Zusage des Entscheids, die
      // Breite ihre Erklärung. Reisst der Deckel, soll das Protokoll zuerst die
      // Zahl nennen, über die entschieden wurde.
      expect(geo.breiten[0], `${name} @${fenster}: Textkörperbreite ${geo.breiten[0]}px statt ${T1C_BREITE[fenster]}px`)
        .toBeCloseTo(T1C_BREITE[fenster], -0.5);
    });
  }
});
}

test.describe(`R5 · Lesemass Mobil (≥ ${MOBIL_MIN_CH} ch @ 390, kein H-Overflow)`, () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const key of ERLASSE) {
    test(`${key}: Lesespalte ≥ ${MOBIL_MIN_CH} ch, kein H-Overflow`, async ({ page }) => {
      await ladeReader(page, key);
      const m = await messeMaxCharsPerLine(page);
      expect(m, `${key}: mehrzeiliger Fliesstext-Absatz gefunden`).not.toBeNull();
      expect(m!.ch, `${key} @390: ${m!.ch} ch (${m!.px}px) muss ≥ ${MOBIL_MIN_CH} sein`).toBeGreaterThanOrEqual(MOBIL_MIN_CH);
      // Kein horizontaler Overflow des Dokuments (grid-cols-1-Falle / lange Komposita).
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${key} @390: horizontaler Overflow ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }
});
