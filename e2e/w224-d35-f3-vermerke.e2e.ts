// @shard-gruppe: 8
// ═══ W2·24 · D35-F3 — «ÄNDERUNGEN ANZEIGEN ALS» IST EINE WAHL ═══════════════
//
// DAVIDS BEFUND (7.9.2026, am Ansicht-Menü des Lesers): «es soll entweder
// fassung oder fussnoten angezeigt werden. also entweder fassung, fussnoten
// oder aus.» Sein Entscheid dazu: «A und verlustfrei».
//
// GEMESSEN am Vorstand (D35-Bericht Teil 3, ZPO @1440, 7.9.2026): «Fussnoten»
// und «Fassung» waren zwei unabhängige Schalter, alle VIER Kombinationen
// erreichbar; im ZPO-Apparat stehen `kl:A` 212, `kl:V` 96, `kl:U` 3 — 99 von
// 311 Einträgen (32 %) sind keine Änderungsvermerke. Die Zahlen bleiben stehen,
// was auch immer später gemessen wird (§0 Ziff. 2b).
//
// ═══ §6.3-DEKLARATION · S6 W1f (Entscheid David 24.9.2026) ══════════════════
// Wörtlich: «die zeile soll ganz weg. infos sollen alle im blatt erscheinen.
// einzige ausnahme sind wenn fussnoten aktiviert sind die sollen unten am
// artikel erschienen». Die Stellung «Fassung» hatte ihren Gegenstand am
// Artikelende (Rubrik «Gilt seit …») — der steht seither im Erlass-Blatt. Aus
// der Dreier-Wahl wird EIN Schalter «Fussnoten» (`menuitemcheckbox`, Gruppe
// «Im Gesetzestext»). Diese Spec folgt: die Radiogruppen-Fälle (drei
// Stellungen, genau eine gesetzt, Kreis-Marke) werden zu Schalter-Fällen, die
// Migrations-Tabelle bekommt die dritte Stufe «fassung → aus» (Herleitung am
// `aufZweiwertig` in `leserOptionen.ts`: «Fassung» zeigte seit W2·26/Z8 keinen
// Apparat), und der MONTREAL-Fall verliert seine Fassungs-Hälfte — die
// Fassung hängt an keiner Stellung mehr.
//
// WAS DIESE SPEC BEWACHT — und was sie bewusst NICHT doppelt:
//   HIER   die BEDIENUNG: ein Schalter, ↑/↓ erreichen ihn, gespeicherte
//          Stellungen migrieren im Browser, und der klassenlose Apparat folgt
//          ihm ganz.
//   DORT   die WIRKUNG am Apparat (Marker, Klassen, DOM vollständig, CLS 0,
//          Kanton): `e2e/hist-ansicht-w25i.e2e.ts`.
//
// ROT ZU BEKOMMEN (§6.7):
//   · in `v3/LeserAenderungsWahl.tsx` `role: 'menuitemcheckbox'` auf
//     `'menuitemradio'` stellen ⇒ «ein Schalter» und «↑/↓» werden rot;
//   · in `leserOptionen.ts` `aufZweiwertig` 'fassung' auf 'fussnoten' drehen
//     ⇒ die Migrations-Zeilen «fassung» werden rot.
import { test, expect, type Page } from '@playwright/test';
import { ANSICHT_PANEL, FUSSNOTEN_WAHL_NAME, WAHL_ROLLE } from './helpers/leserBeschriftung';

const KEY = 'lm.leser.optionen';

async function leser(page: Page, pfad: string, artId: string): Promise<void> {
  await page.goto(pfad);
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`#${artId}`)).toBeVisible({ timeout: 20_000 });
}

async function ansichtAuf(page: Page): Promise<void> {
  const panel = page.locator(ANSICHT_PANEL).first();
  if (!(await panel.isVisible())) {
    await page.getByRole('button', { name: 'Ansicht' }).first().click();
  }
  await expect(panel).toBeVisible();
}

test.describe('S6 W1f — ein Schalter «Fussnoten» statt der Dreier-Wahl', () => {
  test('@1440: menuitemcheckbox, Gruppentitel, schaltet fussnoten ↔ aus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await leser(page, '/gesetze/bund/BGBM', 'art-1');
    await ansichtAuf(page);
    const panel = page.locator(ANSICHT_PANEL).first();

    // Die Gruppe trägt Rolle und Namen — sonst wäre sie für assistive Technik
    // eine namenlose Knopf-Sammlung (derselbe Befund, an dem D4 das Menü
    // gerichtet hat). «Im Gesetzestext», nicht «Am Artikel»: an einem
    // §-Erlass wäre das Wort falsch (B8/C1).
    const gruppe = panel.locator('[data-v3-vermerke-wahl]');
    await expect(gruppe).toHaveAttribute('role', 'group');
    await expect(gruppe).toHaveAttribute('aria-label', 'Im Gesetzestext');
    await expect(gruppe.getByText('Im Gesetzestext')).toBeVisible();

    // GENAU EIN Schalter, keine Radiogruppe mehr — und die gefallenen
    // Stellungen «Fassung»/«aus» stehen nirgends im Menü.
    await expect(gruppe.getByRole(WAHL_ROLLE)).toHaveCount(1);
    await expect(gruppe.locator('[role="menuitemradio"]')).toHaveCount(0);
    await expect(panel.getByRole('menuitemradio', { name: /^Fassung$/ })).toHaveCount(0);
    await expect(panel.getByRole('menuitemradio', { name: /^aus$/ })).toHaveCount(0);
    // Die Rubriken-Wahl (D35-F2) ist mit der Zeile gefallen.
    await expect(panel.locator('[data-v3-fussrubrik], [data-v3-fussrubriken-alle]')).toHaveCount(0);

    // Vorgabe «aus» (dieselbe Fussnoten-Sicht wie die frühere Vorgabe «Fassung»).
    const schalter = gruppe.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME });
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
    await expect(schalter).toHaveAttribute('aria-checked', 'false');

    // An und wieder aus — Attribut und Bedienung sagen dasselbe (§5).
    await schalter.click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');
    await expect(schalter).toHaveAttribute('aria-checked', 'true');
    await ansichtAuf(page);
    await schalter.click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
    await expect(schalter).toHaveAttribute('aria-checked', 'false');
  });

  test('@1440: ↑/↓ erreichen den Schalter — er ist Teil des Menüs, kein Anhängsel', async ({ page }) => {
    // M-4 des D35-Berichts: der Schriftregler war nach Rolle, Höhe und Kasten
    // dreifach «nicht Teil des Menüs». Ein Schalter, den die Pfeiltasten
    // überspringen, wäre derselbe Fehler an anderer Stelle.
    await page.setViewportSize({ width: 1440, height: 900 });
    await leser(page, '/gesetze/bund/BGBM', 'art-1');
    await ansichtAuf(page);
    const panel = page.locator(ANSICHT_PANEL).first();
    await panel.locator('[data-v3-ansicht-menue]').focus();

    const besucht = new Set<string>();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowDown');
      besucht.add(await page.evaluate(() => (
        document.activeElement?.closest('[data-v3-vermerke-wahl]') ? 'fussnoten-schalter' : 'anderes'
      )));
    }
    expect([...besucht], 'die Pfeiltaste überspringt den Fussnoten-Schalter').toContain('fussnoten-schalter');
  });
});

test.describe('D35-F3/W1f — Migration: keine Bestands-Stellung kippt still (§8)', () => {
  // Die REGELN liegen DOM-frei unter `src/tests/leser-optionen-migration.test.ts`;
  // hier zählt, dass der Pre-Paint-Pfad (main.tsx → wendeLeserOptionenAn) sie
  // im echten Browser anwendet — genau der Fall, der sich später nicht mehr
  // nachstellen lässt, wenn der Speicher einmal überschrieben ist.
  // Massgeblich ist die FUSSNOTEN-Sicht: «fassung» zeigte seit Z8 keinen Apparat.
  const TABELLE = [
    { speicher: { fussnoten: 'an', histansicht: 'an' }, erwartet: 'aus' },
    { speicher: { fussnoten: 'aus', histansicht: 'an' }, erwartet: 'aus' },
    { speicher: { fussnoten: 'an', histansicht: 'aus' }, erwartet: 'fussnoten' },
    { speicher: { fussnoten: 'aus', histansicht: 'aus' }, erwartet: 'aus' },
    { speicher: { vermerke: 'fassung', fussRubriken: ['r'], stand: 2 }, erwartet: 'aus' },
    { speicher: { vermerke: 'fussnoten', fussRubriken: [], stand: 2 }, erwartet: 'fussnoten' },
  ] as const;

  for (const f of TABELLE) {
    test(`${JSON.stringify(f.speicher)} ⇒ «${f.erwartet}»`, async ({ page }) => {
      await page.addInitScript(([key, roh]) => {
        try {
          localStorage.setItem(key as string, roh as string);
        } catch { /* privater Modus */ }
      }, [KEY, JSON.stringify(f.speicher)] as const);
      await leser(page, '/gesetze/bund/BGBM', 'art-1');
      await expect(page.locator('html')).toHaveAttribute('data-vermerke', f.erwartet);
      // Und der Schalter steht auch in der Bedienung so da — nicht bloss am
      // <html> (sonst gäbe es eine Attribut- ohne Menü-Wahrheit, §5).
      await ansichtAuf(page);
      await expect(page.locator(ANSICHT_PANEL).getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME }))
        .toHaveAttribute('aria-checked', f.erwartet === 'fussnoten' ? 'true' : 'false');
      // Die Alt-Attribute stehen gar nicht erst am <html> — auch nicht das der
      // gestrichenen Rubriken-Wahl.
      await expect(page.locator('html')).not.toHaveAttribute('data-fussnoten', /.*/);
      await expect(page.locator('html')).not.toHaveAttribute('data-histansicht', /.*/);
      await expect(page.locator('html')).not.toHaveAttribute('data-fuss-aus', /.*/);
    });
  }
});

test.describe('D35-F3 — ein Erlass ohne kl-Klassifikation folgt dem Schalter ganz', () => {
  test('MONTREAL: Schalter angeboten, kein Hinweis, der Apparat geht und kommt vollständig', async ({ page }) => {
    // MONTREAL trägt KEINE einzige `kl:'A'`-Fussnote — verifiziert am Bestand
    // 7.9.2026: 3 Fussnoten, davon 0 klassifiziert.
    await page.setViewportSize({ width: 1440, height: 900 });
    await leser(page, '/gesetze/international/MONTREAL', 'art-21');
    await ansichtAuf(page);
    const panel = page.locator(ANSICHT_PANEL).first();
    const gruppe = panel.locator('[data-v3-vermerke-wahl]');
    await expect(gruppe).toHaveCount(1);

    // W2·26/Z8: der Klassifikations-Hinweis ist ersatzlos gefallen (Herleitung
    // in der Versionsgeschichte dieser Datei, §0 Ziff. 2b).
    await expect(gruppe.getByText('keine klassifizierten Änderungs-Fussnoten')).toHaveCount(0);
    expect(await gruppe.getAttribute('aria-describedby'), 'der Schalter trägt noch eine Beschreibung').toBeNull();

    // Auch der klassenlose Apparat folgt dem Schalter — ganz.
    const sichtbar = () => page.evaluate(() => [...document.querySelectorAll(
      '.lc-leser [data-fn-apparat] > p')].filter((e) => (e as HTMLElement).checkVisibility()).length);
    const schalter = panel.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME });
    await schalter.click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');
    const voll = await sichtbar();
    expect(voll, 'MONTREAL zeigt mit «Fussnoten» keine Apparat-Zeilen').toBeGreaterThan(0);
    await ansichtAuf(page);
    await schalter.click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
    expect(await sichtbar(), 'aus: der Apparat steht weiter da').toBe(0);
    // A1-Mechanik: «an» stellt vollständig wieder her.
    await ansichtAuf(page);
    await schalter.click();
    expect(await sichtbar(), 'der Apparat kehrt nicht vollständig zurück').toBe(voll);
  });
});
