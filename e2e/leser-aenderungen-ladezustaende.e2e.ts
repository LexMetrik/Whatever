// @shard-gruppe: 4
// ═══ LESER-NAV · Reiter «Änderungen»: Ladefehler ≠ «nicht erfasst», Datenstand (O-26, O-03) ═══
//
// Zwei Lagen im echten Browser (`vite dev` liefert für fehlende Dateien die App mit 200 text/html,
// `vite preview` ebenso; in Prod gibt es den echten 404 — beides gilt als «Datei fehlt»):
//  (a) Der Revisions-Sidecar ist NICHT ERREICHBAR (Netz): der Reiter sagt «konnte nicht geladen
//      werden» mit «Erneut laden», NICHT «Zu Art. 2 nichts erfasst.»; nach dem Netz-Wiederkehr holt
//      «Erneut laden» die Liste (Fehlschläge werden nicht gecacht).
//  (b) Datenstand: der Reiter nennt das Abrufdatum des Sidecars (O-03), wie «Entscheide» seinen.
//
// NICHT hier: «nicht erfasst» statt Fehler (PA-13-B03, 404/SPA-Rückfall) und die Kanton-Sperren
// (PE-F10-B04, PE-F12-B03) — die 10 Bund-Erlasse ohne Sidecar (PRHG, DSGVO, …, per Skript gegen
// `public/normtext/register.json` gezählt) haben nur die Live-Link-Ansicht ohne Blatt, und die
// Kanton-Fälle bestehen im Browser auch auf dem Stand vor dem Fix (Flackern ist Timing): ein
// e2e-Fall, der nicht rot werden kann, wäre ein Tor ohne Aussage (§6.7). Beide deckt der Unit-Test ab
// (`leser-panel-aenderungen-ladefehler-w217`, `normtext-revisionen-ladefehler`), dort rot gezeigt.
//
// ROT ZU BEKOMMEN (§6.7): `PanelTafeln.tsx` `aenderungenLadefehler` fest `false` → (a) rot;
// `datenstand`-Zeile in `PanelAenderungen.tsx` streichen → (b) rot. Beide gegen den Stand vor dem
// Fix rot gesehen (16.10.2026, `vite dev`, headless).
import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';

async function oeffne(page: Page, pfad: string, token: string): Promise<void> {
  await page.goto(`${pfad}#art-${token}`);
  await expect(page.locator(`#art-${token}`)).toBeVisible({ timeout: 20_000 });
  await blattFuerArtikel(page.locator(`#art-${token}`), 20_000);
  await blattReiter(page, 'aenderungen');
}

const datumCh = (iso: string) => iso.split('-').reverse().join('.');

test.describe('LESER-NAV · Reiter «Änderungen»: Lade-Zustände und Datenstand', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) Sidecar nicht erreichbar: Fehlertext + «Erneut laden», kein «nichts erfasst»; danach die Liste', async ({ page }) => {
    let netzDa = false;
    await page.route('**/normtext/revisionen/BGBM.json', (route) => (netzDa ? route.continue() : route.abort('failed')));
    await oeffne(page, '/gesetze/bund/BGBM', '2');
    const fehler = page.locator('[data-v3-panel-fehler]');
    await expect(fehler).toContainText('Änderungsverlauf konnte nicht geladen werden', { timeout: 20_000 });
    await expect(page.locator('[data-v3-blatt-artikelgruppe="aenderungen"][data-v3-blatt-leer]'), 'Falschaussage «Zu Art. 2 nichts erfasst.»').toHaveCount(0);
    netzDa = true;
    await fehler.locator('[data-abruf-erneut]').click();
    await expect(fehler).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-v3-blatt-erlassteil="aenderungen"] > button')).toBeVisible();
  });

  // O-72 (16.10.2026): beim Laden stand nur «▸ Alle Änderungen/Materialien des Erlasses», kein
  // Wort vom Laden (ohne Zahl ist die Erlass-Tafel zugeklappt, ihr «… werden geladen …» dahinter).
  // Abruf um 2,5 s verzögert; ROT ZU BEKOMMEN: die Zeilen `aenderungenLaedt &&`/`materialienLaedt &&`
  // in `PanelTafeln.tsx` streichen.
  test('(c) Änderungen laden: eine Ladezeile über der Klappzeile, danach mit Zahl', async ({ page }) => {
    await page.route('**/normtext/revisionen/BGBM.json', async (route) => { await new Promise((r) => setTimeout(r, 2_500)); await route.continue(); });
    await oeffne(page, '/gesetze/bund/BGBM', '2');
    await expect(page.locator('[data-v3-aenderungen-laedt]')).toHaveText('Änderungen werden geladen …');
    await expect(page.locator('[data-v3-aenderungen-laedt]')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-v3-blatt-erlassteil="aenderungen"] > button')).toBeVisible();
  });

  test('(d) Materialien laden: eine Ladezeile über der Klappzeile, danach weg', async ({ page }) => {
    await page.route('**/materialien/register.json', async (route) => { await new Promise((r) => setTimeout(r, 2_500)); await route.continue(); });
    await oeffne(page, '/gesetze/bund/BGBM', '2');
    await blattReiter(page, 'materialien');
    await expect(page.locator('[data-v3-materialien-laedt]')).toHaveText('Materialien werden geladen …');
    await expect(page.locator('[data-v3-materialien-laedt]')).toHaveCount(0, { timeout: 20_000 });
  });

  test('(b) Datenstand: das Abrufdatum des Sidecars steht im Reiter', async ({ page }) => {
    const roh = JSON.parse(readFileSync('public/normtext/revisionen/BGBM.json', 'utf8')) as { abgerufen: string };
    await oeffne(page, '/gesetze/bund/BGBM', '2');
    await page.locator('[data-v3-blatt-erlassteil="aenderungen"] > button').click();
    await expect(page.locator('[data-v3-panel-aenderungen-datenstand]')).toHaveText(`Datenstand ${datumCh(roh.abgerufen)}`, { timeout: 20_000 });
  });
});
