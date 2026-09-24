// @shard-gruppe: 4
import { blattFuerArtikel } from './helpers/fassungsRubrik';
import { test, expect } from '@playwright/test';
import { fehlerSammeln } from './helpers/fehlerSammeln';
import { DROSSEL } from './helpers/budgets';
import { vollerApparat } from './helpers/vollerApparat';

// ─── W2·5d U-VERWEIS (A7 + A10 + A11 + A13) — Browser-Beweise ────────────────
// P2 (§10.2): (1) MWSTG Art. 5 verbatim = 5 Links (art_31/35/37/38/45);
// (2) bounded — kein Link über den Fliesstext hinaus; (3) Fremdgesetz-Signal
// geroutet; (4) Präambel-Test an BV-zitierenden Ingressen (Singular MWSTG +
// Plural DSG; aBV-Schutz-Negativfall ArG). A7: strukturiertes Verweis-Popover
// (Wortlaut → massgebliche
// Entscheide → klar abgetrennte Materialien). A9: Flüssigkeit unter CPU-Throttle
// (Drossel aus `./helpers/budgets`, §5), CLS 0. Läuft gegen `vite preview` (dist).

// ELI-Diskriminator der BV (aus src/lib/fedlex.ts FEDLEX): SR 101.
const BV_ELI = '1999/404';

test.describe('A10 — Plural-Linker «in den Artikeln …» (MWSTG Art. 5)', () => {
  test('MWSTG Art. 5: GENAU 5 interne Sprung-Links (31/35/37/38/45), bounded', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/gesetze/bund/MWSTG#art-5');
    const art5 = page.locator('#art-5');
    await expect(art5).toBeAttached();

    // Alle 5 Aufzählungs-Glieder als interne Self-Sprünge (Reader-Anker art-N).
    for (const n of ['31', '35', '37', '38', '45']) {
      const link = art5.locator(`a[href="/gesetze/bund/MWSTG#art-${n}"]`);
      await expect(link.first()).toBeVisible({ timeout: 10_000 });
      await expect(link.first()).toHaveText(n); // Anzeige = exakter Quelltext (§1)
    }
    // Bounded: GENAU 5 Verweis-Links im Artikeltext — «30 Prozent», Passus-Ketten
    // und der Fliesstext danach bleiben unverlinkt.
    await expect(art5.locator('p a[href^="/gesetze/bund/MWSTG#art-"]')).toHaveCount(5);

    // Klick auf ein Glied springt zum Zielartikel (Anker existiert im DOM).
    await art5.locator('a[href="/gesetze/bund/MWSTG#art-31"]').first().click();
    await expect(page.locator('#art-31')).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'e2e-shots/verweis-u-mwstg5.png', fullPage: false });
    expect(fehler).toEqual([]);
  });
});

test.describe('A11 — Verweise in Präambel/Ingress', () => {
  test('MWSTG-Ingress: «Artikel 130 der Bundesverfassung» → BV art_130 (Genitiv-Map)', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/gesetze/bund/MWSTG');
    const ingress = page.locator('section[aria-label="Ingress"]');
    await expect(ingress).toBeVisible({ timeout: 15_000 });
    const bv130 = ingress.locator(`a[href*="${BV_ELI}"][href*="#art_130"]`);
    await expect(bv130.first()).toBeVisible({ timeout: 10_000 });
    await expect(bv130.first()).toHaveText(/Artikel\s*130/);
    expect(fehler).toEqual([]);
  });

  test('DSG-Ingress (Plural, Erlass 2020): «die Artikel 95 Absatz 1, 97 Absatz 1, 122 Absatz 1 und 173 Absatz 2 der Bundesverfassung» → BV-Glieder einzeln', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/gesetze/bund/DSG');
    const ingress = page.locator('section[aria-label="Ingress"]');
    await expect(ingress).toBeVisible({ timeout: 15_000 });
    // Alle 4 Glieder der Aufzählung zeigen auf die (heutige) BV.
    for (const n of ['95', '97', '122', '173']) {
      await expect(ingress.locator(`a[href*="${BV_ELI}"][href*="#art_${n}"]`).first()).toBeVisible({ timeout: 10_000 });
    }
    await page.screenshot({ path: 'e2e-shots/verweis-u-praeambel-dsg.png', fullPage: false });
    expect(fehler).toEqual([]);
  });

  test('aBV-Schutz (§1): ArG-Ingress (1964, zitiert die BV von 1874) bleibt UNVERLINKT', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/gesetze/bund/ARG');
    const ingress = page.locator('section[aria-label="Ingress"]');
    await expect(ingress).toBeVisible({ timeout: 15_000 });
    // «Artikel 26 … der Bundesverfassung» meint aBV 26, NICHT die heutige
    // Eigentumsgarantie — ein SR-101-Link wäre plausibel-falsch (§1).
    await expect(ingress.getByText(/der Bundesverfassung/)).toBeVisible();
    // Keine Inline-Verweis-Links in den PRÄAMBEL-Zeilen (font-serif); der
    // Fussnoten-Apparat darunter (M11-«SR 101»-Link u. a.) ist davon unberührt.
    await expect(ingress.locator('.font-serif a')).toHaveCount(0);
    expect(fehler).toEqual([]);
  });
});

// ─── V2·FN-3 — Präambel-Fussnoten inline (A20, David 10.7.2026) ──────────────
// Auf dem A11-NormText-Unterbau: die Ingress-/Präambel-Zeilen tragen jetzt den
// FnRef-Marker (data-fn-marker, `artikel="kopf"`) HINTER dem Zeilentext; der
// Kopf-Apparat trägt den Sprunganker `#fn-kopf-${nr}`. Wirkt für OR sofort, für
// VZG (Alt-Form) nach FN-1. VRK als Kurz-Ingress-Testfall. Daten additiv aus
// FN-1/FN-2 (fnNrs je Zeile + numerierter Kopf-Apparat), reine Darstellung.
test.describe('FN-3 — Präambel-Fussnoten inline (Marker + Kopf-Apparat-Anker)', () => {
  for (const { key, nr, apparatText } of [
    { key: 'OR', nr: '1', apparatText: /BBl/ },      // Kronjuwel, Ingress-Note 1
    { key: 'VZG', nr: '2', apparatText: /SR/ },       // Alt-Form (nach FN-1), Note 2
    { key: 'VRK', nr: '2', apparatText: /SR/ },       // Staatsvertrags-Kurz-Ingress
  ]) {
    test(`${key}-Ingress: Marker ${nr} verlinkt auf Kopf-Apparat #fn-kopf-${nr}`, async ({ page }) => {
      const fehler = fehlerSammeln(page);
      // §6.3-DEKLARATION (W2·26/Z8, 11.9.2026): die Vorgabestellung «Fassung»
      // nimmt seither den GANZEN Fussnoten-Apparat, auch den des Erlass-Kopfs
      // (der bis dahin als einziger Pfad überhaupt keine Regel traf — er setzt
      // kein `data-fn-klasse`; gemessen 97 sichtbare Kopf-/Randtitel-Marker im
      // OR). Diese Sonde prüft die EXTRAKTION («sitzt der Marker in der
      // Präambel-Zeile, zeigt er auf `#fn-kopf-n`?»), nicht die Ansicht — sie
      // stellt den vollen Apparat darum über den Haus-Weg her. Zusage, Anker
      // und Popover-Prüfung unverändert.
      await vollerApparat(page);
      await page.goto(`/gesetze/bund/${key}`);
      const ingress = page.locator('section[aria-label="Ingress"]');
      await expect(ingress).toBeVisible({ timeout: 15_000 });
      // (1) Marker sitzt in einer Präambel-Zeile (data-fn-marker), nicht im Apparat.
      const marker = ingress.locator(`[data-fn-marker] button[aria-label="Fussnote ${nr}"]`);
      await expect(marker.first()).toBeVisible({ timeout: 10_000 });
      // (2) Sprunganker existiert am Kopf-Apparat mit dem passenden Text.
      const anker = ingress.locator(`#fn-kopf-${nr}`);
      await expect(anker).toHaveCount(1);
      await expect(anker).toHaveText(apparatText);
      // (3) Klick öffnet das Popover DIREKT an der Stelle (aus #fn-kopf-nr gespeist).
      await marker.first().click();
      const popover = page.locator('[role="note"]');
      await expect(popover.first()).toBeVisible({ timeout: 5_000 });
      await expect(popover.first()).toHaveText(apparatText);
      expect(fehler).toEqual([]);
    });
  }

  test('R9/§8: Marker folgt dem Fussnoten-Toggle (Substanz bleibt im DOM)', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/gesetze/bund/OR');
    const ingress = page.locator('section[aria-label="Ingress"]');
    await expect(ingress).toBeVisible({ timeout: 15_000 });
    // Marker UND Apparat-Anker liegen IMMER im DOM (data-fn-marker/-apparat) —
    // die Prominenz steuert allein der data-fussnoten-CSS-Toggle (nie display:none
    // am Substanz-Träger). Ctrl+F/Print/Screenreader bleiben vollständig.
    await expect(ingress.locator('[data-fn-marker]').first()).toHaveCount(1);
    await expect(ingress.locator('[data-fn-apparat] #fn-kopf-1')).toHaveCount(1);
    expect(fehler).toEqual([]);
  });
});

test.describe('A7 — strukturiertes Verweis-Popover (Wortlaut → Entscheide → Materialien)', () => {
  test('MWSTV → «Art. 18 Abs. 2 MWSTG»: Popover mit Wortlaut + abgetrennten Materialien (Behörde · Stand)', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/gesetze/bund/MWSTV#art-165');
    const art = page.locator('#art-165');
    await expect(art).toBeAttached();
    const chip = art.getByRole('link', { name: /Art\. 18 Abs\. 2 MWSTG/ }).first();
    await expect(chip).toBeVisible({ timeout: 10_000 });
    await chip.click();

    const dialog = page.getByRole('dialog', { name: /Art\. 18 MWSTG/ });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // (1) Artikel-Wortlaut + Provenienz-Fuss (§7 a–d).
    await expect(dialog.getByText('Norm-Vorschau')).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Amtliche Fassung/ })).toBeVisible();
    // (3) klar abgetrennte Materialien-Gruppe (lazy) mit Behörden-Kürzel + Stand (A13).
    const matGruppe = dialog.getByRole('heading', { name: /Amtliche Materialien/ });
    await expect(matGruppe).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(/Legt aus/)).toBeVisible();
    await expect(dialog.getByText(/Stand \d{2}\.\d{2}\.\d{4}/).first()).toBeVisible();

    await page.screenshot({ path: 'e2e-shots/verweis-u-popover-materialien.png', fullPage: false });
    expect(fehler).toEqual([]);
  });

  test('SchKG → «Art. 20 OR»: Popover mit massgeblichen Entscheiden (Leitfall-Kanten)', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/gesetze/bund/SCHKG#art-312');
    const art = page.locator('#art-312');
    await expect(art).toBeAttached();
    // ── §6.3-DEKLARATION (W2·24-R6b, 6.9.2026) · DIE BEZÜGE STEHEN GEFALTET ──
    // Der Verweis-Chip stand bis R6b offen am Artikelfuss bzw. in der
    // Randspalte. Auf Auftrag David 6.9.2026 («der platz rechts und links neben
    // dem gesetz … nimmt viel platz vom gesetzestext weg») sind beide Randspuren
    // gefallen; die Bezüge stehen seither als EINE aufklappbare Zeile unter dem
    // Artikelkopf (`parts/Funktionszeile.tsx`, `<details>`). Eingeklappt ist der
    // Chip nicht gerendert — `getByRole` fand darum nichts (gemessen: 0 statt 1;
    // der zweite Treffer «Art. 20 OR» im Fliesstext ist der EXTERNE Fedlex-Link
    // und trägt über `.lc-verweis-aussen::after` ein «↗» im Namen, passt also
    // bewusst nicht auf `/^Art\. 20 OR$/`).
    // Der Prüfpunkt bleibt Wort für Wort derselbe: der interne Verweis-Chip
    // öffnet das strukturierte Popover mit den Leitfall-Kanten. Neu ist EIN
    // Handgriff davor — genau der, den ein Leser seit R6b auch tut.
    // D35-F1 (7.9.2026, §6.3): die Zeile klappt je RUBRIK auf. Der Verweis-Chip
    // «Art. 20 OR» hängt an der Rubrik «Verweise» (`data-reg="g"`) — genau die
    // wird hier geöffnet, nicht mehr die ganze Zeile.
    // S6 W1f (§6.3, Entscheid David 24.9.2026: «verweise soll auch in blatt»):
    // die Rubrik «Verweise» am Artikelende ist gefallen; die Chips stehen in der
    // Klappzeile «Verweise dieses Artikels» oben im Erlass-Blatt. Der Prüfpunkt
    // (der Chip öffnet das strukturierte Popover) bleibt Wort für Wort.
    await blattFuerArtikel(art);
    const verweise = page.locator('[data-v3-blatt-verweise="312"]');
    const klapp = verweise.locator('> button');
    if (await klapp.getAttribute('aria-expanded') !== 'true') await klapp.click();
    const chip = verweise.getByRole('link', { name: /^Art\. 20 OR$/ }).first();
    await expect(chip).toBeVisible({ timeout: 10_000 });
    await chip.click();

    const dialog = page.getByRole('dialog', { name: /Art\. 20 OR/ });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // (2) massgebliche Entscheide unter dem Wortlaut (Richtung als TEXT).
    await expect(dialog.getByRole('heading', { name: /Massgebliche Entscheide/ })).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(/Wird zitiert von/)).toBeVisible();
    // Entscheid-Zeile verlinkt in den Entscheid-Reader mit ?norm=-Fundstellen-Sprung.
    const eLink = dialog.locator('a[href*="/rechtsprechung/"][href*="norm="]').first();
    await expect(eLink).toBeVisible();

    // Esc schliesst das Popover (Tastatur-Bedienbarkeit, A9).
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(fehler).toEqual([]);
  });
});

test.describe('A9 — Flüssigkeit unter CPU-Throttle + CLS 0', () => {
  test(`Popover-Öffnen + Plural-Sprung gedrosselt (${DROSSEL}×) ohne Lag, CLS < 0.05`, async ({ page }) => {
    test.slow();
    const fehler = fehlerSammeln(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: DROSSEL });

    await page.goto('/gesetze/bund/MWSTV#art-165');
    const art = page.locator('#art-165');
    const chip = art.getByRole('link', { name: /Art\. 18 Abs\. 2 MWSTG/ }).first();
    await expect(chip).toBeVisible({ timeout: 20_000 });

    // CLS-Beobachter (nur input-freie Shifts zählen).
    await page.evaluate(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as PerformanceEntry[]) {
          const s = e as unknown as { value: number; hadRecentInput: boolean };
          if (!s.hadRecentInput) (window as unknown as { __cls: number }).__cls += s.value;
        }
      }).observe({ type: 'layout-shift' });
    });

    // Popover öffnen: Wortlaut + lazy Materialien — ohne Hänger.
    let t0 = Date.now();
    await chip.click();
    const dialog = page.getByRole('dialog', { name: /Art\. 18 MWSTG/ });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    expect(Date.now() - t0, 'Popover öffnen zu langsam').toBeLessThan(8000);
    await expect(dialog.getByRole('heading', { name: /Amtliche Materialien/ })).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // CLS der ersten Seite VOR der Navigation sichern (window-State geht bei
    // goto verloren), auf der zweiten Seite den Beobachter neu installieren.
    const cls1 = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);

    // Plural-Glied-Sprung im MWSTG gedrosselt. Beobachter erst NACH dem
    // eingeschwungenen Reader installieren — gemessen wird die INTERAKTION
    // (A9), nicht der Erst-Load (den deckt check:perf-budget/Lighthouse ab).
    await page.goto('/gesetze/bund/MWSTG#art-5');
    const glied = page.locator('#art-5').locator('a[href="/gesetze/bund/MWSTG#art-31"]').first();
    await expect(glied).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as PerformanceEntry[]) {
          const s = e as unknown as { value: number; hadRecentInput: boolean };
          if (!s.hadRecentInput) (window as unknown as { __cls: number }).__cls += s.value;
        }
      }).observe({ type: 'layout-shift' });
    });
    t0 = Date.now();
    await glied.click();
    await expect(page.locator('#art-31')).toBeVisible({ timeout: 15_000 });
    expect(Date.now() - t0, 'Plural-Glied-Sprung zu langsam').toBeLessThan(8000);

    const cls2 = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls1, 'Layout-Shift Popover-Seite (input-frei)').toBeLessThan(0.05);
    expect(cls2, 'Layout-Shift Plural-Sprung-Seite (input-frei)').toBeLessThan(0.05);

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    expect(fehler).toEqual([]);
  });
});
