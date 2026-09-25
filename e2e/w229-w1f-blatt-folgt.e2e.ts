// @shard-gruppe: 5
// ═══ S6 W1f · JEDER REITER FOLGT DEM ARTIKEL (Auftrag 24.9.2026) ═════════════
//
// Präzisierung zu Davids Meldung «erlassblatt scrollt nicht mit wenn sich
// artikel verändert» (Beispiel KVG, gemessen auf Prod, Stand #1040): nur
// «Entscheide» folgte dem Scroll-Spy; «Werkzeuge», «Materialien»,
// «Erläuterungen», «Änderungen» zeigten den ganzen Erlass, der Kopf nannte
// dort nur das Kürzel. SOLL: jeder Reiter zeigt zuerst den Teil zum aktiven
// Artikel und folgt dem Scroll-Spy; der erlassweite Teil steht darunter
// ZUGEKLAPPT («Standard ist nur der Artikelteil offen»); ohne Artikelbezug
// «Zu Art. N nichts erfasst.»; der Kopf nennt «Art. N» in jedem Reiter.
//
// Je Reiter ZWEI Artikel mit verschiedenem Inhalt (gemessen 24.9.2026 im
// gebauten Stand):
//  · Werkzeuge   OR Art. 324a «Lohnfortzahlung …» · Art. 335c «Kündigung & Fristen …»
//  · Änderungen  BGBM Art. 2 «Gilt seit 01.01.2025» · Art. 5 «Gilt seit 01.01.2021»
//  · Materialien BGBM Art. 2 Botschaft 04.078 · Art. 5 nichts erfasst
//
// ROT ZU BEKOMMEN (§6.7) — gefahren 24.9.2026 gegen den Stand VOR den beiden
// Commits «jeder Blatt-Reiter zuerst zum Artikel» und «der Blatt-Kopf nennt
// in jedem Reiter den Artikel» (beide per `git revert --no-commit` zurück,
// dist neu gebaut): (h) rot «Received … Erlass-Blatt· OR» statt «Art. 324a OR»;
// (i) rot, Erlassteil-Griff fehlt (die Erlass-Liste stand offen); (j) rot,
// keine Materialien-Gruppe zum Artikel. Auf dem gebauten Stand 3/3 grün.
import { test, expect, type Page } from '@playwright/test';
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';

const gruppe = (page: Page, reiter: string) => page.locator(`[data-v3-blatt-artikelgruppe="${reiter}"]`);
const kopf = (page: Page) => page.locator('[data-v3-panel] p[id]').first();

async function leser(page: Page, pfad: string, token: string): Promise<void> {
  await page.goto(`${pfad}#art-${token}`);
  await expect(page.locator(`#art-${token}`)).toBeVisible({ timeout: 20_000 });
}

test.describe('S6 W1f · jeder Reiter folgt dem Artikel', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(h) Werkzeuge: der Artikelteil wechselt mit dem Artikel, der Erlassteil ist zu', async ({ page }) => {
    await leser(page, '/gesetze/bund/OR', '324_a');
    await blattFuerArtikel(page.locator('#art-324_a'), 20_000);
    await blattReiter(page, 'werkzeuge');
    await expect(gruppe(page, 'werkzeuge')).toHaveAttribute('data-v3-blatt-artikel', '324_a');
    await expect(gruppe(page, 'werkzeuge')).toContainText('Lohnfortzahlung');
    await expect(kopf(page)).toContainText('Art. 324a OR');
    const erlass = page.locator('[data-v3-blatt-erlassteil="werkzeuge"] > button');
    await expect(erlass).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-v3-panel-reiter-inhalt="werkzeuge"]'), 'der Erlassteil steht offen').toHaveCount(0);

    await blattFuerArtikel(page.locator('#art-335_c'), 20_000);
    await blattReiter(page, 'werkzeuge');
    await expect(gruppe(page, 'werkzeuge')).toHaveAttribute('data-v3-blatt-artikel', '335_c');
    await expect(gruppe(page, 'werkzeuge')).toContainText('Kündigung');
    await expect(gruppe(page, 'werkzeuge')).not.toContainText('Lohnfortzahlung');
    await expect(kopf(page)).toContainText('Art. 335c OR');
  });

  test('(i) Änderungen: die Fassung wechselt mit dem Artikel, die Erlass-Liste ist zu', async ({ page }) => {
    await leser(page, '/gesetze/bund/BGBM', '2');
    await blattFuerArtikel(page.locator('#art-2'), 20_000);
    await blattReiter(page, 'aenderungen');
    await expect(page.locator('[data-v3-blatt-fassung="2"] > button')).toContainText('Gilt seit 01.01.2025');
    await expect(page.locator('[data-v3-blatt-erlassteil="aenderungen"] > button')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-v3-panel-aenderung]'), 'die Erlass-Liste steht offen').toHaveCount(0);
    await expect(kopf(page)).toContainText('Art. 2 BGBM');

    await blattFuerArtikel(page.locator('#art-5'), 20_000);
    await blattReiter(page, 'aenderungen');
    await expect(page.locator('[data-v3-blatt-fassung="5"] > button')).toContainText('Gilt seit 01.01.2021');
    await expect(page.locator('[data-v3-blatt-fassung="2"]')).toHaveCount(0);
    // Aufgeklappt steht die bisherige Erlass-Liste unverändert.
    await page.locator('[data-v3-blatt-erlassteil="aenderungen"] > button').click();
    await expect(page.locator('[data-v3-panel-aenderung]').first()).toBeVisible({ timeout: 20_000 });
  });

  test('(j) Materialien: die Botschaft zum Artikel — oder ehrlich «nichts erfasst»', async ({ page }) => {
    await leser(page, '/gesetze/bund/BGBM', '2');
    await blattFuerArtikel(page.locator('#art-2'), 20_000);
    await blattReiter(page, 'materialien');
    await expect(gruppe(page, 'materialien')).toHaveAttribute('data-v3-blatt-artikel', '2', { timeout: 20_000 });
    await expect(gruppe(page, 'materialien')).toContainText('04.078');
    await expect(kopf(page)).toContainText('Art. 2 BGBM');
    await expect(page.locator('[data-v3-blatt-erlassteil="materialien"] > button')).toHaveAttribute('aria-expanded', 'false');

    await blattFuerArtikel(page.locator('#art-5'), 20_000);
    await blattReiter(page, 'materialien');
    await expect(gruppe(page, 'materialien')).toHaveAttribute('data-v3-blatt-artikel', '5');
    // Fachänderung 25.9.2026 (#1096, M-5): bis dahin stand hier «Zu Art. 5 nichts
    // erfasst.» — eine Lücke, kein Soll. Seit die Botschaften auch den Erlassen
    // zugeordnet werden, die sie über Fedlex-Auswirkungen ändern, erscheint an
    // Art. 5 BGBM die Botschaft 17.019 (Totalrevision BöB, BBl 2017 1851), deren
    // Erlass AS 2020 641 Art. 5 BGBM per 1.1.2021 neu fasste (vgl. «Gilt seit
    // 01.01.2021» im Fall (i) oben).
    await expect(gruppe(page, 'materialien')).toContainText('17.019');
    await expect(gruppe(page, 'materialien')).toContainText('AS 2020 641');
  });
});
