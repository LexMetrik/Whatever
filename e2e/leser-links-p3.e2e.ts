// @shard-gruppe: 2
// ── P3 · TEXTLINKS IM GESETZESLESER TRAGEN EINEN UNTERSTRICH ────────────────
//
// BEFUND (Prüfer R6, 6.9.2026, Bau-Runde W2·24-DESIGN-IDENTITAET): von 6'291
// Links im Gesetzesleser trugen 3'673 keinen Unterstrich — «Amtliche Fassung ↗»
// im Erlasskopf, «⬇ Amtliches PDF», die Links der Bezüge. Ein Link, den allein
// die Farbe ausweist, ist für Farbfehlsichtige kein Link (WCAG 1.4.1 «Use of
// Color»). Derselbe Befund traf auf der Startseite als R3-F1 auf.
//
// DIE REGEL STEHT EINMAL, in `src/index.css` («TEXTLINKS IM LESER»):
// `.lc-leser :where(a[href])` unterstreicht als VORGABE. Weil sie in einer
// Cascade-Layer liegt und `:where()` die Spezifität auf null hält, gewinnt die
// Tailwind-Utility `no-underline` immer — wer ohne Strich stehen soll, sagt es
// im Markup.
//
// WAS DIESER FALL ZUSICHERT — zwei Hälften, die einander decken:
//  (a) NEGATIV: kein Link ohne Strich, der nicht ausdrücklich `no-underline`
//      trägt. Ohne (b) wäre das trivial erfüllbar, indem man überall
//      `no-underline` schreibt.
//  (b) POSITIV: die drei Textlink-Sorten, die der Befund benannt hat, tragen
//      den Strich WIRKLICH — die Fedlex-Links im Erlasskopf und die Links der
//      Bezüge-Zeile.
//
// WER OHNE STRICH STEHEN DARF (erklärt, nicht bloss geduldet): Brotkrume und
// Gliederung (Navigation), die Artikelnummer-Anker (`num … no-underline` in
// `ArtikelLeser` — die Zahl IST die Überschrift), sowie alles mit `.lc-chip`
// oder `.lc-btn-mini`: beide sind bordierte Bedienformen, deren Affordanz die
// Linie ist, nicht die Farbe. WCAG 1.4.1 verlangt ein NICHT-farbliches
// Unterscheidungsmerkmal, keinen Unterstrich im Besonderen.
//
// ROT ZU BEKOMMEN (§6.7): in `src/index.css` den Block «TEXTLINKS IM LESER»
// entfernen — Fall (b) reisst sofort mit den Bezüge-Links. Belegt am
// 6.9.2026 im Bau von R6c.
//
// ── (b) GRIFF BIS ZUM 7.9.2026 AM FALSCHEN ELEMENT ──────────────────────────
// Der Absatz darüber bleibt stehen, wie er am 6.9. geschrieben wurde — er
// beschreibt den damaligen Stand richtig (§0 Ziff. 2b). Seit D30 stimmt seine
// STELLE nicht mehr:
//   GEMESSEN 7.9.2026 (Preview 4410, `/gesetze/bund/OR#art-336_c` @1440,
//   Bezüge-Zeile aufgeklappt): 9 Links in `.lr7-bez`, davon 8 im Block
//   `data-reg="r"` mit `class="lc-chip lc-chip-entscheid num no-underline"`
//   («BGE 152 III 23★» usw.) und `text-decoration-line: none`. Der erste
//   `a[href]` der Zone — und damit das, was (b) mass — war also ein CHIP.
// Chips sind die im Kopf dieser Datei AUSDRÜCKLICH erklärte Ausnahme: ihre
// Affordanz ist die Kante, nicht die Farbe (WCAG 1.4.1 verlangt ein
// nicht-farbliches Merkmal, keinen Unterstrich im Besonderen). (b) verlangte
// von ihnen einen Strich, den (a) ihnen im selben Atemzug erlässt — der Fall
// widersprach sich selbst, sobald D30 die Entscheide als Chips in die Zone
// stellte (Reihenfolge der Blöcke: r · m · g · w).
// KEINE LOCKERUNG: (b) wählt jetzt denselben Ausschluss wie (a) und misst den
// ersten TEXTLINK der Zone. Für OR 336c ist das genau einer — der
// Rechnen-Eintrag «Kündigung & Fristen im Arbeitsverhältnis» (Block
// `data-reg="w"`), gemessen `underline`. Bleibt die Zone ohne Textlink, wird
// `bezugDa` rot; der Leer-Treffer-Schutz ist also schärfer als vorher, nicht
// weicher.
// ROT ZU BEKOMMEN (dieselbe Zeile wie oben): den `index.css`-Block entfernen —
// der Rechnen-Eintrag verliert seinen Strich, (b) reisst.
import { test, expect } from '@playwright/test';
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';

const ORT = '/gesetze/bund/OR#art-336_c';

test.describe('P3 · Links im Gesetzesleser', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('kein Textlink ohne Unterstrich — und die benannten tragen ihn wirklich', async ({ page }) => {
    await page.goto(ORT);
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(400);
    // Die Bezüge-Zeile aufklappen — ihre Links sind der Kern des Befunds und
    // liegen eingeklappt nicht im Layout.
    // D35-F1 (7.9.2026, §6.3): je Rubrik ein eigener Griff — für diesen Befund
    // zählen die Links ALLER Rubriken, also werden alle geöffnet.
    // §6.3 · S6 W1f (Entscheid David 24.9.2026, «infos sollen alle im blatt
    // erscheinen»): die Zeile ist gefallen. Der Positiv-Fall (b) misst den
    // Rechnen-Eintrag «Kündigung & Fristen im Arbeitsverhältnis» jetzt dort,
    // wo er steht: in der Artikelgruppe oben im Blatt-Reiter «Werkzeuge».
    // §6.3 · Runde 2 (24.9.2026, PR #1067): der Werkzeug-Eintrag im
    // Artikelteil ist seither eine LISTENZEILE mit derselben Anatomie wie die
    // Erlass-Liste darunter (`WerkzeugKopf`, Titel `no-underline`, Status-
    // Spalte) — DESIGN-REGLEMENT F0.8 erlaubt Listenzeilen ausdrücklich ohne
    // Strich. GEMESSEN 24.9.2026 (lokal gegen dist, @1440): die Werkzeug-Gruppe
    // von 336c trägt danach genau einen Link, `no-underline`, `none` — kein
    // Textlink mehr, (b) mass dort nichts. Der Positiv-Fall zieht darum in die
    // Materialien-Gruppe desselben Artikels um: dort stehen echte Textlinks
    // ohne Ausnahme-Marke («Fedlex ↗», «Curia Vista ↗» der Botschaft, gemessen
    // `underline`). KEINE LOCKERUNG: dieselbe Auswahl `istText`, derselbe
    // Leer-Treffer-Schutz; der Werkzeug-Reiter wird weiterhin geöffnet, damit
    // (a) seine Zeilen mit sieht.
    await blattFuerArtikel(page.locator('#art-336_c'), 20000);
    await blattReiter(page, 'werkzeuge');
    await expect(page.locator('[data-v3-blatt-artikelgruppe="werkzeuge"] a[href]').first()).toBeVisible();
    await blattReiter(page, 'materialien');
    await expect(page.locator('[data-v3-blatt-artikelgruppe="materialien"][data-v3-blatt-artikel="336_c"] a[href]').first()).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(250);

    const mess = await page.evaluate(() => {
      const nackt: string[] = [];
      let gesamt = 0, unterstrichen = 0;
      document.querySelectorAll('.lc-leser a[href]').forEach((a) => {
        gesamt++;
        if (getComputedStyle(a).textDecorationLine.includes('underline')) { unterstrichen++; return; }
        // Erklärte Ausnahme? Dann ist der fehlende Strich eine Entscheidung.
        const c = a.className || '';
        if (/(^|\s)no-underline(\s|$)/.test(c) || a.closest('.lc-chip, .lc-btn-mini')) return;
        if (nackt.length < 12) nackt.push(`${(a.textContent ?? '').trim().slice(0, 40)} [${c.slice(0, 60)}]`);
      });
      // (b) die benannten Textlinks — mit DEMSELBEN Ausschluss wie (a):
      // Chip und Mini-Knopf sind erklärte Ausnahmen, an ihnen ist ein
      // fehlender Strich kein Befund (Herleitung im Kopf, 7.9.2026).
      const istText = (a: Element) => !/(^|\s)no-underline(\s|$)/.test(String(a.className))
        && !a.closest('.lc-chip, .lc-btn-mini');
      const bezug = [...document.querySelectorAll('[data-v3-blatt-artikelgruppe="materialien"][data-v3-blatt-artikel="336_c"] a[href]')].find(istText);
      const kopf = [...document.querySelectorAll('.lc-leser a[href]')]
        .find((a) => /Amtliche Fassung/.test(a.textContent ?? '') && !a.closest('.lc-chip, .lc-btn-mini'));
      const strich = (el: Element | null | undefined) =>
        el ? getComputedStyle(el).textDecorationLine.includes('underline') : null;
      return { gesamt, unterstrichen, nackt, bezugDa: !!bezug, bezugStrich: strich(bezug), kopfDa: !!kopf, kopfStrich: strich(kopf) };
    });

    // Leer-Treffer-Schutz: der Fall muss überhaupt Links gesehen haben.
    expect(mess.gesamt, 'kein einziger Link im Leser gemessen').toBeGreaterThan(100);
    // (a)
    expect(mess.nackt, `Links ohne Unterstrich und ohne erklärte Ausnahme:\n${mess.nackt.join('\n')}`)
      .toEqual([]);
    // (b) — ohne diese Hälfte wäre (a) mit `no-underline` überall erfüllbar.
    expect(mess.bezugDa, 'kein TEXTLINK in der Materialien-Gruppe von OR 336c im Blatt gefunden — der Positiv-Fall misst nichts').toBe(true);
    expect(mess.bezugStrich, 'die Textlinks im Artikelteil des Blatts stehen wieder ohne Unterstrich').toBe(true);
    expect(mess.kopfDa, 'kein Fedlex-Textlink gefunden — der Positiv-Fall misst nichts').toBe(true);
    expect(mess.kopfStrich, '«Amtliche Fassung ↗» steht wieder ohne Unterstrich').toBe(true);
  });
});
