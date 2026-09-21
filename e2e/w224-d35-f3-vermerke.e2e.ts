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
// WAS DIESE SPEC BEWACHT — und was sie bewusst NICHT doppelt:
//   HIER   die BEDIENUNG: genau eine Stellung steht, die Marke ist ein Kreis,
//          ↑/↓ erreichen sie, die vier Bestands-Kombinationen migrieren im
//          Browser, und ein Erlass ohne `kl`-Klassifikation sagt das hin (§8).
//   DORT   die WIRKUNG am Apparat (A weg, V/G/Z/U bleiben, DOM vollständig,
//          CLS 0, Kanton): `e2e/hist-ansicht-w25i.e2e.ts`. Zwei Kopien
//          derselben Zusage liefen beim ersten Nachjustieren auseinander (§5).
//
// ROT ZU BEKOMMEN (§6.7 — einmal gegen diesen Zweig gefahren, Protokoll
// `abnahme/design-identitaet/D35-F3-FASSUNG.md`):
//   · in `v3/LeserAenderungsWahl.tsx` `role: 'menuitemradio'` auf
//     `'menuitemcheckbox'` zurückstellen ⇒ «drei Stellungen, genau eine
//     gesetzt» und «↑/↓ erreichen die Wahl» werden rot;
//   · in `leserOptionen.ts` in `ausAltenSchaltern` die zwei Zeilen tauschen
//     ⇒ die Migrations-Tabelle wird rot;
//   · (bis W2·26/Z8: `ohneKlassifikation` fest auf `false` — Prop gestrichen)
//     ⇒ der MONTREAL-Fall wird rot.
import { test, expect, type Page } from '@playwright/test';
import { F_MARKE } from './helpers/fassungsRubrik';
import {
  ANSICHT_PANEL, AUS_WAHL_NAME, FUSSNOTEN_WAHL_NAME, VERMERKE_SCHALTER_NAME, WAHL_ROLLE,
} from './helpers/leserBeschriftung';

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

test.describe('D35-F3 — eine Wahl, drei Stellungen, genau eine gesetzt', () => {
  test('@1440: menuitemradio, Kreis-Marke, Gruppentitel, exklusiv', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await leser(page, '/gesetze/bund/BGBM', 'art-1');
    await ansichtAuf(page);
    const panel = page.locator(ANSICHT_PANEL).first();

    // Die Gruppe trägt Rolle und Namen — sonst wäre sie für assistive Technik
    // eine namenlose Knopf-Sammlung (derselbe Befund, an dem D4 das Menü
    // gerichtet hat).
    const gruppe = panel.locator('[data-v3-vermerke-wahl]');
    await expect(gruppe).toHaveAttribute('role', 'group');
    await expect(gruppe).toHaveAttribute('aria-label', 'Änderungen anzeigen als');
    await expect(gruppe.getByText('Änderungen anzeigen als')).toBeVisible();

    // W2·5m (14.9.2026): in der EIGENEN Gruppe gezählt. Seit der Lesart-Wahl
    // (Kap. 15.3) trägt das Menü ZWEI Radiogruppen; eine Zählung über das ganze
    // Panel sprang damit auf 5, ohne dass an dieser Wahl etwas anders wäre.
    // Schärfung, kein Nachgeben — die Zeile misst jetzt, was sie behauptet.
    const stellungen = gruppe.getByRole(WAHL_ROLLE);
    await expect(stellungen).toHaveCount(3);
    for (const name of [VERMERKE_SCHALTER_NAME, FUSSNOTEN_WAHL_NAME, AUS_WAHL_NAME]) {
      await expect(panel.getByRole(WAHL_ROLLE, { name })).toHaveCount(1);
    }

    // DIE ZUSAGE EINER RADIOGRUPPE: genau eine steht. Eine Checkbox-Gruppe wäre
    // hier mit zwei Haken grün — diese Zeile IST Davids «entweder … oder».
    const gesetzt = async () => stellungen.evaluateAll(
      (els) => els.filter((e) => e.getAttribute('aria-checked') === 'true').length,
    );
    expect(await gesetzt()).toBe(1);

    // Die Marke ist ein KREIS, nicht ein Kästchen (D35-F4 hat die Form für
    // genau diesen Fall vorgesehen) — und sie steht in BEIDEN Stellungen da.
    const marken = await stellungen.evaluateAll((els) => els.map((e) => {
      const m = e.querySelector<HTMLElement>('[data-menu-marke]');
      const r = m?.getBoundingClientRect();
      return {
        form: m?.getAttribute('data-menu-marke'),
        an: e.getAttribute('aria-checked'),
        rund: m ? getComputedStyle(m).borderTopLeftRadius : '',
        b: Math.round(r?.width ?? 0),
      };
    }));
    for (const m of marken) {
      expect(m.form, `Markenform (aria-checked=${m.an})`).toBe('punkt');
      expect(m.b, `Markenbreite (aria-checked=${m.an})`).toBeGreaterThanOrEqual(10);
      expect(m.rund, `Marke ist rund (aria-checked=${m.an})`).not.toBe('0px');
    }

    // Jede Stellung lässt sich wählen, und danach steht IMMER noch genau eine.
    for (const [name, wert] of [
      [FUSSNOTEN_WAHL_NAME, 'fussnoten'], [AUS_WAHL_NAME, 'aus'], [VERMERKE_SCHALTER_NAME, 'fassung'],
    ] as const) {
      await ansichtAuf(page);
      await panel.getByRole(WAHL_ROLLE, { name }).click();
      await expect(page.locator('html')).toHaveAttribute('data-vermerke', wert);
      expect(await gesetzt(), `nach «${wert}» steht nicht genau eine Stellung`).toBe(1);
    }

    // Idempotent: die gesetzte Stellung noch einmal anklicken schaltet sie NICHT
    // ab — sonst gäbe es einen vierten, unbenannten Zustand.
    await ansichtAuf(page);
    await panel.getByRole(WAHL_ROLLE, { name: VERMERKE_SCHALTER_NAME }).click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fassung');
    expect(await gesetzt()).toBe(1);
  });

  test('@1440: ↑/↓ erreichen die Wahl — sie ist Teil des Menüs, kein Anhängsel', async ({ page }) => {
    // M-4 des D35-Berichts: der Schriftregler war nach Rolle, Höhe und Kasten
    // dreifach «nicht Teil des Menüs». Eine Radiogruppe, die die Pfeiltasten
    // überspringt, wäre derselbe Fehler an anderer Stelle.
    await page.setViewportSize({ width: 1440, height: 900 });
    await leser(page, '/gesetze/bund/BGBM', 'art-1');
    await ansichtAuf(page);
    const panel = page.locator(ANSICHT_PANEL).first();
    await panel.locator('[data-v3-ansicht-menue]').focus();

    const besucht = new Set<string>();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowDown');
      besucht.add(await page.evaluate(() => document.activeElement?.getAttribute('role') ?? '(ohne)'));
    }
    expect([...besucht].sort(), 'die Pfeiltaste überspringt die Radiogruppe')
      .toContain('menuitemradio');
  });
});

test.describe('D35-F3 — Migration: keine Bestands-Stellung kippt still (§8)', () => {
  // Davids Tabelle vom 7.9.2026, Notation `fussnoten`/`histansicht`. Die REGELN
  // liegen DOM-frei unter `src/tests/leser-optionen-migration.test.ts`; hier
  // zählt, dass der Pre-Paint-Pfad (main.tsx → wendeLeserOptionenAn) sie im
  // echten Browser anwendet — genau der Fall, der sich später nicht mehr
  // nachstellen lässt, wenn der Speicher einmal überschrieben ist.
  const TABELLE = [
    { fussnoten: 'an', histansicht: 'an', erwartet: 'fassung' },
    { fussnoten: 'aus', histansicht: 'an', erwartet: 'fassung' },
    { fussnoten: 'an', histansicht: 'aus', erwartet: 'fussnoten' },
    { fussnoten: 'aus', histansicht: 'aus', erwartet: 'aus' },
  ] as const;

  for (const f of TABELLE) {
    test(`fussnoten=${f.fussnoten} · histansicht=${f.histansicht} ⇒ «${f.erwartet}»`, async ({ page }) => {
      await page.addInitScript(([key, fn, hist]) => {
        try {
          localStorage.setItem(key as string, JSON.stringify({
            fussnoten: fn, histansicht: hist, leitfaelle: 'an',
          }));
        } catch { /* privater Modus */ }
      }, [KEY, f.fussnoten, f.histansicht] as const);
      await leser(page, '/gesetze/bund/BGBM', 'art-1');
      await expect(page.locator('html')).toHaveAttribute('data-vermerke', f.erwartet);
      // Und die Stellung steht auch in der Bedienung so da — nicht bloss am
      // <html>. Ohne diese Hälfte wäre eine Attribut-Wahrheit ohne Menü-Wahrheit
      // möglich, also genau die zweite Wahrheit, die D35-F3 abschafft (§5).
      await ansichtAuf(page);
      const name = f.erwartet === 'fassung' ? VERMERKE_SCHALTER_NAME
        : f.erwartet === 'fussnoten' ? FUSSNOTEN_WAHL_NAME : AUS_WAHL_NAME;
      await expect(page.locator(ANSICHT_PANEL).getByRole(WAHL_ROLLE, { name }))
        .toHaveAttribute('aria-checked', 'true');
      // Die Alt-Schlüssel werden beim nächsten Schreiben abgeräumt, und die
      // Alt-Attribute stehen gar nicht erst am <html>.
      await expect(page.locator('html')).not.toHaveAttribute('data-fussnoten', /.*/);
      await expect(page.locator('html')).not.toHaveAttribute('data-histansicht', /.*/);
    });
  }
});

test.describe('D35-F3 — §8: ein Erlass ohne kl-Klassifikation sagt es hin', () => {
  test('MONTREAL: Wahl angeboten (Fassungs-Zeile da), Hinweis da, Apparat vollständig', async ({ page }) => {
    // MONTREAL trägt eine Fassungs-Zeile (Historie-Shard mit Einträgen zu
    // Art. 21/22), aber KEINE einzige `kl:'A'`-Fussnote — verifiziert am
    // Bestand 7.9.2026: 3 Fussnoten, davon 0 klassifiziert; dieselbe Lage wie
    // PVUE, und die einzigen zwei Erlasse des Korpus mit dieser Kombination
    // (Korpus-Messung 17.8.2026, `berechnungen.ts`).
    // Auf Kantonsrecht liegt dieselbe Ursache vor (kein `kl`), dort fehlt aber
    // AUCH die Fassungs-Zeile — die Wahl wird darum gar nicht erst angeboten
    // (D1); dieser Fall steht in `hist-ansicht-w25i.e2e.ts`.
    await page.setViewportSize({ width: 1440, height: 900 });
    await leser(page, '/gesetze/international/MONTREAL', 'art-21');
    await ansichtAuf(page);
    const panel = page.locator(ANSICHT_PANEL).first();
    const gruppe = panel.locator('[data-v3-vermerke-wahl]');
    await expect(gruppe).toHaveCount(1);

    // ── §6.3-DEKLARATION (W2·26/Z8, Mandat David 11.9.2026) ────────────────
    // HIER STAND DER HINWEIS-TEIL: «Dieser Erlass führt keine klassifizierten
    // Änderungs-Fussnoten; ‹Fassung› und ‹Fussnoten› unterscheiden sich hier
    // nur in der Fassungs-Zeile» — sichtbar UND per `aria-describedby`
    // verknüpft. Der Satz war für seinen Stand richtig (§0 Ziff. 2b) und ist
    // mit Z8 ersatzlos gefallen: seit dem Mandat nimmt «Fassung»/«aus» den
    // Apparat KLASSENBLIND, also auf MONTREAL genau so wie überall sonst. Ein
    // Hinweis auf eine Wirkungs-Gleichheit, die es nicht mehr gibt, wäre eine
    // Behauptung über die Oberfläche (§8) — darum ist er weg, und mit ihm die
    // Durchreiche `aenderungsFussnoten` (`v3/LeserAenderungsWahl.tsx`).
    await expect(
      gruppe.getByText('keine klassifizierten Änderungs-Fussnoten'),
      'der Klassifikations-Hinweis steht noch — er hat seit Z8 keinen Gegenstand',
    ).toHaveCount(0);
    expect(
      await gruppe.getAttribute('aria-describedby'),
      'die Wahl trägt noch eine Beschreibung',
    ).toBeNull();

    // DIE NEUE ZUSAGE: auch der klassenlose Apparat folgt der Wahl — ganz.
    const sichtbar = () => page.evaluate(() => [...document.querySelectorAll(
      '.lc-leser [data-fn-apparat] > p')].filter((e) => (e as HTMLElement).checkVisibility()).length);
    await page.keyboard.press('Escape');
    await ansichtAuf(page);
    await panel.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME }).click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fussnoten');
    const voll = await sichtbar();
    expect(voll, 'MONTREAL zeigt in der Stellung «Fussnoten» keine Apparat-Zeilen')
      .toBeGreaterThan(0);
    for (const [name, wert] of [
      [AUS_WAHL_NAME, 'aus'], [VERMERKE_SCHALTER_NAME, 'fassung'],
    ] as const) {
      await ansichtAuf(page);
      await panel.getByRole(WAHL_ROLLE, { name }).click();
      await expect(page.locator('html')).toHaveAttribute('data-vermerke', wert);
      expect(await sichtbar(), `${wert}: der Apparat steht weiter da`).toBe(0);
    }
    // A1-Mechanik: «Fussnoten» stellt vollständig wieder her.
    await ansichtAuf(page);
    await panel.getByRole(WAHL_ROLLE, { name: FUSSNOTEN_WAHL_NAME }).click();
    expect(await sichtbar(), 'der Apparat kehrt nicht vollständig zurück').toBe(voll);

    // Was die Wahl hier SEHR WOHL tut: die Fassungs-Zeile. Ohne diese Hälfte
    // wäre die Wahl an MONTREAL wirkungslos und dürfte nach D1 gar nicht
    // angeboten werden (§8, kein totes Steuerelement).
    // §6.3-DEKLARATION (D40, 7.9.2026): die Fassungs-Spur ist die Rubrik-Marke
    // der Funktionszeile am Artikelende, nicht mehr der Kopf-Slot. Die Zusage
    // ist unverändert — die Wahl muss an MONTREAL etwas bewirken.
    const slot = page.locator(`.lc-leser ${F_MARKE}`).first();
    // Die Schleife darüber endet in «Fussnoten» — dort ist die Fassungs-Spur
    // per Definition aus. Erst in «Fassung» ist sie der Gegenstand.
    await ansichtAuf(page);
    await panel.getByRole(WAHL_ROLLE, { name: VERMERKE_SCHALTER_NAME }).click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'fassung');
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await ansichtAuf(page);
    await panel.getByRole(WAHL_ROLLE, { name: AUS_WAHL_NAME }).click();
    await expect(page.locator('html')).toHaveAttribute('data-vermerke', 'aus');
    await expect(slot).toBeHidden();
  });
});
