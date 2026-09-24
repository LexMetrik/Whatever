// @shard-gruppe: 2
// ── W2·24-R5-F1K · D31 · EIN POPOVER MUSS DECKEN ───────────────────────────
//
// BEFUND David 6.9.2026, wörtlich: das Hover-Popover über einem Artikel-/
// Norm-Verweis «ist nicht lesbar — hebt sich nicht vom Hintergrund ab,
// überlappt mit dem Text dahinter».
//
// WURZEL, gemessen am Stand `8cfbc521e`: alle Vorschau-Flächen des Hauses
// trugen `.lc-card`, und die steht seit dem «Kästen zu Linien»-Umbau auf
// `background: transparent; border: 0` (index.css). Für eine Karte IM FLUSS der
// Seite ist das richtig; für eine Fläche ÜBER laufendem Text heisst es: der
// Artikel steht durch die Vorschau hindurch.
//
// GEBAUT: EIN Rezept `.lc-popover` (`--paper-raised`, 1 px `--rule`, kein
// Radius, kein Schatten, eigener Stapelkontext), alle Konsumenten darauf.
//
// DREI ZUSAGEN, in beiden Themes:
//  (a) DECKUNG — der berechnete Hintergrund ist nicht transparent, und der
//      Alpha-Wert ist 1 (eine 0.9-Fläche liesse den Text weiter durchscheinen).
//  (b) OBENAUF — `elementFromPoint` in der Mitte des Popovers trifft das
//      Popover selbst, nicht den Lesetext dahinter. Das ist die Sonde, die
//      Davids Symptom EXAKT trifft: ein z-Index-Zahlenvergleich täte es nicht,
//      weil ein Stapelkontext ihn aushebeln kann.
//  (c) LESBAR — der Kontrast von Popover-Text zu Popover-Fläche liegt über
//      4.5 : 1 (WCAG AA), gemessen an den tatsächlich berechneten Farben.
//
// ROT ZU BEKOMMEN (§6.7): in `src/index.css` bei `.lc-popover` die Zeile
// `background: var(--paper-raised)` auf `transparent` setzen (= der Ist-Zustand
// vor dem Fix) ⇒ (a) und (b) fallen in beiden Themes. Belegt in
// `abnahme/design-identitaet/R5-F1K.md`.
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';
import { test, expect, type Locator } from '@playwright/test';
import { vollerApparat } from './helpers/vollerApparat';

/** rgb(a)-Zeichenkette → Kanäle + Alpha. */
function kanaele(farbe: string): { r: number; g: number; b: number; a: number } {
  const m = farbe.match(/[\d.]+/g) ?? [];
  return { r: Number(m[0] ?? 0), g: Number(m[1] ?? 0), b: Number(m[2] ?? 0), a: m[3] === undefined ? 1 : Number(m[3]) };
}

function luminanz(f: { r: number; g: number; b: number }): number {
  const k = [f.r, f.g, f.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}

function kontrast(vorne: string, hinten: string): number {
  const a = luminanz(kanaele(vorne));
  const b = luminanz(kanaele(hinten));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Alles, was die drei Zusagen braucht — in EINER Messung am offenen Popover. */
async function messe(popover: Locator) {
  return popover.evaluate((el) => {
    const stil = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const mx = Math.round(r.left + r.width / 2);
    const my = Math.round(r.top + r.height / 2);
    const getroffen = document.elementFromPoint(mx, my);
    // Textton: der erste Nachfahre mit sichtbarem Text.
    const textKnoten = [...el.querySelectorAll('*')].find(
      (k) => (k.textContent ?? '').trim().length > 3 && k.children.length === 0,
    );
    return {
      hintergrund: stil.backgroundColor,
      rahmen: stil.borderTopWidth + ' ' + stil.borderTopColor,
      textFarbe: textKnoten ? getComputedStyle(textKnoten).color : stil.color,
      trifftSichSelbst: getroffen ? el === getroffen || el.contains(getroffen) : false,
      getroffenKlasse: getroffen ? (getroffen.className?.toString?.() ?? '') : '(nichts)',
      breite: Math.round(r.width), hoehe: Math.round(r.height),
    };
  });
}

for (const thema of ['light', 'dark'] as const) {
  test.describe(`D31 · Popover deckt und ist lesbar (${thema})`, () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: thema });

    // ── (1) FUSSNOTEN-POPOVER IM LESETEXT ──────────────────────────────────
    // Der Fall, den Davids Wortlaut beschreibt: eine Fläche, die MITTEN im
    // laufenden Gesetzestext aufgeht. Sie ist zugleich der schärfste Prüfstein
    // für (b) — hinter ihr liegt garantiert Text.
    test('(a)+(b)+(c) Fussnoten-Popover über dem Gesetzestext', async ({ page }) => {
      // ── §6.3-DEKLARATION (W2·26/Z8, Mandat David 11.9.2026) ────────────
      // Seit dem Mandat nimmt die Vorgabestellung «Fassung» den Fussnoten-
      // Apparat GANZ, nicht mehr nur `kl:'A'` — gemessen im OR-Leser: 215
      // sichtbare Marker vorher, 0 nachher. Der Absatz darunter beschreibt den
      // Stand vom 7.9.2026 und bleibt stehen (§0 Ziff. 2b); seine Lösung
      // («nimm den ersten SICHTBAREN Marker») trägt nicht mehr, weil es im
      // Grundzustand keinen gibt.
      // DIE ZUSAGE DIESER SONDE IST UNVERÄNDERT — «ein Popover deckt und ist
      // lesbar» ist eine Aussage über die FLÄCHE, nicht über die Ansicht.
      // `vollerApparat` ist der Haus-Weg dafür (helpers/vollerApparat.ts, für
      // genau diese Sondenklasse gebaut): eine Stellung, einmal gesetzt, ohne
      // die Sonde an eine Bedienung zu koppeln, die sie nicht prüft.
      await vollerApparat(page);
      await page.goto('/gesetze/bund/OR#art-336_c');
      await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
      // ── D35-F3 (Entscheid David 7.9.2026, §6.3 DEKLARIERT) · DER GRUNDZUSTAND
      //    ZEIGT NICHT MEHR JEDEN MARKER ────────────────────────────────────
      // Bis hierher nahm die Sonde schlicht den ERSTEN Marker der Lesespalte.
      // Das war richtig, solange der Grundzustand den ganzen Apparat zeigte
      // (§0 Ziff. 2b — der damalige Messwert bleibt stehen). Seit D35-F3 ist
      // die Vorgabe die Stellung «Fassung»: die Änderungs-Fussnoten (`kl:'A'`)
      // sind dann samt Markern `display:none`. GEMESSEN am gebauten Stand
      // (OR, @1440, 7.9.2026): 371 Marker in der Lesespalte, davon 100
      // sichtbar; die ersten fünf tragen alle `kl:'A'` und sind unsichtbar —
      // `.first()` griff also einen ausgeblendeten Marker.
      // Die ZUSAGE dieser Sonde ist unverändert («Popover deckt und ist
      // lesbar»), und sie gilt für jede Fussnote: gemessen wird darum der
      // erste SICHTBARE Marker — im Grundzustand, den der Leser wirklich
      // sieht, statt in einer erst herzustellenden Stellung.
      const marker = page.locator('#lc-lesespalte [data-fn-marker] :is(a, button)')
        .filter({ visible: true }).first();
      await expect(marker, 'kein sichtbarer Fussnoten-Marker im Lesetext').toBeVisible({ timeout: 20_000 });
      await marker.scrollIntoViewIfNeeded();
      await marker.click();
      const popover = page.locator('.lc-popover').first();
      await expect(popover, 'Fussnote öffnet kein Popover').toBeVisible({ timeout: 15_000 });
      const m = await messe(popover);

      const bg = kanaele(m.hintergrund);
      expect(m.hintergrund, `Popover-Hintergrund «${m.hintergrund}» — Davids Befund «kein Hintergrund»`)
        .not.toBe('rgba(0, 0, 0, 0)');
      expect(bg.a, `Popover-Hintergrund ist halbdurchsichtig (${m.hintergrund})`).toBe(1);
      expect(m.rahmen, `Popover ohne sichtbaren Rahmen: «${m.rahmen}»`).not.toMatch(/^0px/);
      expect(m.trifftSichSelbst,
        `Mitte des Popovers trifft «${m.getroffenKlasse}» statt das Popover — der Text liegt davor`)
        .toBe(true);
      const k = kontrast(m.textFarbe, m.hintergrund);
      expect(k, `Kontrast Popover-Text ${m.textFarbe} auf ${m.hintergrund} = ${k.toFixed(2)} : 1`)
        .toBeGreaterThanOrEqual(4.5);
      console.log(`[D31/${thema}/fussnote] bg=${m.hintergrund} text=${m.textFarbe} `
        + `kontrast=${k.toFixed(2)} rahmen=${m.rahmen} ${m.breite}×${m.hoehe}px`);
    });

    // ── (2) ENTSCHEID-VORSCHAU AM BEZUGS-CHIP (RegestePopover) ─────────────
    test('(a)+(b)+(c) Entscheid-Vorschau am Bezugs-Chip', async ({ page }) => {
      // MESSBEDINGUNG, nicht Aussage (§0 Ziff. 3): dieser Fall braucht den vollen
      // OR-Bezugs-Shard (2.2 MB roh) — kein anderer geprüfter Erlass führt am
      // Artikel eine Entscheid-Kante mit Regeste (ARG 15a: null, gemessen
      // 7.9.2026). Unter `--repeat-each=2` mit zwei Workern riss er damit das
      // 30-s-Budget, seriell nicht. `test.slow()` verdreifacht das Budget für
      // GENAU diesen Fall, statt das Budget der ganzen Datei zu heben.
      test.slow();
      await page.goto('/gesetze/bund/OR#art-336_c');
      await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
      // D35-F1 (7.9.2026, §6.3): die Funktionszeile klappt je RUBRIK auf —
      // hier gebraucht wird die Rubrik «Entscheide» (`data-reg="r"`).
      // S6 W1f (§6.3, Entscheid David 24.9.2026, «infos sollen alle im blatt
      // erscheinen»): die Rubrik «Entscheide» am Artikelende ist gefallen; die
      // Entscheide DIESES Artikels stehen im Reiter «Entscheide» des Blatts —
      // mit derselben `KanteMitVorschau`. Geprüft wird das Popover dort.
      await blattFuerArtikel(page.locator('#art-336_c'), 20_000);
      await blattReiter(page, 'entscheide');
      const chip = page.locator('[data-v3-panel] [role="tabpanel"] a[href^="/rechtsprechung/"]').first();
      // ── WARTEFENSTER, GEMESSEN (CI-Fix E, 7.9.2026) ───────────────────────
      // Lauf 34066539241/Shard 2 meldete diesen Fall zweimal FLAKY (hell und
      // dunkel), beide Male mit «kein Bezugs-Chip zum Hovern» im ersten Versuch
      // und grün im Retry — kein Deckungs-Defekt, ein zu enges Zeitbudget.
      // URSACHE, nicht Vermutung: der Chip steht seit D30 (a60dd7f75) hinter
      // einem LAZY-Pfad — das Aufklappen ruft `onOeffnen` → `weckeDaten`
      // (`v3/panelModell.ts`), und erst dann wird der OR-Bezugs-Shard (2.2 MB
      // roh) geholt und projiziert. Auf dem 2-vCPU-Free-Runner liegt genau das
      // über den 25 s, die hier bis dahin standen; lokal (Preview 4406) steht
      // der Chip in ~1 s. Die Datei sagt das im Kopf des Falls selbst an
      // («dieser Fall braucht den vollen OR-Bezugs-Shard»), nur das Budget war
      // noch das von vor dem Lazy-Pfad.
      // KEINE LOCKERUNG (§6.3): geändert wird ein TIMEOUT, keine Zusage — die
      // Sichtbarkeit des Chips bleibt Bedingung, und alle Messungen darunter
      // laufen unverändert. Dieselbe Politik wie im `playwright.config.ts`
      // («Test-Timeout-Politik», CI-Zweig 90 s): ein Budget greift nur bei
      // Überschreitung und macht grüne Läufe nicht langsamer.
      await expect(chip, 'kein Bezugs-Chip zum Hovern').toBeVisible({ timeout: 60_000 });
      const popover = page.locator('.lc-popover').first();
      // ZWEI GRÜNDE FÜR DIE SCHLEIFE statt eines einzelnen `hover()` (gemessen
      // 7.9.2026 unter `--repeat-each=2`): die Vorschau öffnet erst, wenn der
      // Zeiger 450 ms RUHT (`HOVER_OEFFNEN_MS`), und die Liste wächst beim
      // Eintreffen des Shards noch unter dem Zeiger weg — dann kam das
      // `pointerenter` nie an. Die Schleife hovert erneut, statt die Zusage
      // aufzuweichen; scheitert sie ganz, ist der Fall zu Recht rot.
      await chip.scrollIntoViewIfNeeded();
      for (let versuch = 0; versuch < 6 && await popover.count() === 0; versuch += 1) {
        await page.mouse.move(0, 0);
        await chip.hover();
        await page.waitForTimeout(900);
      }
      await expect(popover, 'Hover über dem Bezugs-Chip öffnet kein Popover').toBeVisible({ timeout: 15_000 });
      const m = await messe(popover);
      expect(m.hintergrund, `RegestePopover-Hintergrund «${m.hintergrund}»`).not.toBe('rgba(0, 0, 0, 0)');
      expect(kanaele(m.hintergrund).a).toBe(1);
      expect(m.rahmen, `RegestePopover ohne Rahmen: «${m.rahmen}»`).not.toMatch(/^0px/);
      expect(m.trifftSichSelbst, `Mitte des RegestePopovers trifft «${m.getroffenKlasse}»`).toBe(true);
      const k = kontrast(m.textFarbe, m.hintergrund);
      expect(k, `Kontrast ${m.textFarbe} auf ${m.hintergrund} = ${k.toFixed(2)} : 1`).toBeGreaterThanOrEqual(4.5);
      console.log(`[D31/${thema}/regeste] bg=${m.hintergrund} text=${m.textFarbe} `
        + `kontrast=${k.toFixed(2)} ${m.breite}×${m.hoehe}px`);
    });

    // ── (3) NORM-VORSCHAU AM NORM-CHIP (NormPopover / V2-Hover) ────────────
    // Der dritte Konsument des Rezepts. Er lebt nicht im Leser (dort gibt es
    // keine Norm-Chips — gemessen 7.9.2026 an ZGB/ARG/StPO/OR: null), sondern
    // an den Rechtsgrundlagen-Zeilen der Vorlagen. Ohne diesen Fall bliebe
    // `NormPopover`/`NormPopoverHuelle` unbewacht.
    test('(a)+(b) Norm-Vorschau am Norm-Chip (Vorlage)', async ({ page }) => {
      await page.goto('/vorlagen/gmbh-gruendung');
      const chip = page.locator('a.lc-chip').first();
      await expect(chip, 'kein Norm-Chip auf der Vorlagen-Seite').toBeVisible({ timeout: 20_000 });
      await chip.scrollIntoViewIfNeeded();
      await chip.hover();
      const popover = page.locator('.lc-popover').first();
      await expect(popover, 'Hover über dem Norm-Chip öffnet kein Popover').toBeVisible({ timeout: 15_000 });
      const m = await messe(popover);
      expect(m.hintergrund, `NormPopover-Hintergrund «${m.hintergrund}»`).not.toBe('rgba(0, 0, 0, 0)');
      expect(kanaele(m.hintergrund).a).toBe(1);
      expect(m.rahmen, `NormPopover ohne Rahmen: «${m.rahmen}»`).not.toMatch(/^0px/);
      expect(m.trifftSichSelbst, `Mitte des NormPopovers trifft «${m.getroffenKlasse}»`).toBe(true);
      console.log(`[D31/${thema}/norm] bg=${m.hintergrund} rahmen=${m.rahmen} ${m.breite}×${m.hoehe}px`);
    });
  });
}
