// @shard-gruppe: 8
import { test, expect, type Page } from '@playwright/test';

// W2·5d G3b — Anhang-Rendering (③ ERLASS_MIT_ANHANG + ⑤ STAATSVERTRAG-Protokolle),
// FAHRPLAN-GESETZES-UX.md §2.2. Reine Darstellung (§3): Anhänge (`annex_*`) und
// Staatsvertrags-Protokolle (`lvl_*`, LugÜ) rendern als eigenständig erkennbare,
// klar abgesetzte Blöcke (Struktur-Trenner + Struktur-Überschrift «Anhang N»/
// «Protokoll N …»), Tabellen in einem overflow-x-Container ohne Seiten-H-Overflow.
// Reader = prerendertes Crawler-HTML → auf den Client-Takeover warten.
async function warteReader(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
}

// ── ③ GSchV: Anhang als abgesetzter Block mit «Anhang N»-Struktur-Überschrift ──
test('③ GSchV: Anhänge rendern als abgesetzte data-anhang-Blöcke mit «Anhang N»-Überschrift', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/GSCHV');
  // Anhang-Block existiert (eigenständig erkennbar am data-anhang-Marker) …
  const anhang = page.locator('.lc-leser article[data-anhang]');
  await expect(anhang.first()).toBeVisible({ timeout: 20000 });
  expect(await anhang.count()).toBeGreaterThanOrEqual(9);
  // … der Anker bleibt #art-<token> (R8, kein neuer Anker-Namespace) …
  const ersterAnhang = page.locator('#art-annex_1');
  await expect(ersterAnhang).toHaveAttribute('data-anhang', '');
  // … und trägt «Anhang 1» als verlinkte Struktur-Überschrift (Accessible Name).
  await expect(ersterAnhang.getByRole('link', { name: /^Anhang 1$/ })).toBeVisible();
});

test('③ GSchV: die «Anhänge»-Sektion ist im Gliederungs-TOC verlinkt', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/GSCHV');
  // «Anhänge» als eigene Top-Sektion in der Gliederung (Struktur-Trenner, im TOC).
  await expect(page.locator('[data-toc]').getByRole('button', { name: /Anhänge/ }).first()).toBeVisible({ timeout: 20000 });
});

// ── ⑤ LugÜ: Protokolle als abgesetzte Struktur-Sektionen ──────────────────────
// P1-a/b Kanonik-Re-Pin (11.7.2026, amtlich deklariert): der alte Alias-Dump
// exponierte die Protokolle als GENERIERTE lvl_dXeY-Sektionen (#art-lvl_d1141e112);
// die kanonische isExemplifiedBy-Fassung (html-12) trägt sie unter dem stabilen
// eId `annex_u1` («Protokoll 1 über …» als Sektions-Titel). Gleiches Verhalten
// (data-anhang-Block + verlinkte Überschrift), kanonischer Anker.
test('⑤ LugÜ: Protokolle rendern als abgesetzte data-anhang-Blöcke (kanonisch annex_u1)', async ({ page }) => {
  await warteReader(page, '/gesetze/international/LUGUE');
  const protokoll = page.locator('#art-annex_u1');
  await expect(protokoll).toBeVisible({ timeout: 20000 });
  await expect(protokoll).toHaveAttribute('data-anhang', '');
  await expect(protokoll.getByRole('link', { name: /^Protokoll 1 über/ })).toBeVisible();
});

// ── ⑤ LugÜ: CH-Erklärungen (decl_u2) — P1-a/b-Extraktions-Nachzug ─────────────
// Die kanonische Fassung trägt Geltungsbereich (scope_u1) und «Vorbehalte und
// Erklärungen» (decl_u2) als eigene Sektionen; der Extraktor erfasst sie seit
// dem decl/scope-Nachzug (vorher nur zufällig via Alt-Dump-lvl_-Ids). Neben der
// INHALTS-Präsenz (Snapshot → DOM) ist seit dem istAnhangToken-Nachzug
// (berechnungen.ts: decl|scope) auch die abgesetzte Anhang-Optik gesichert
// (data-anhang-Block, identisch zu annex_u1).
test('⑤ LugÜ: «Vorbehalte und Erklärungen» (decl_u2) rendern als abgesetzter data-anhang-Block', async ({ page }) => {
  await warteReader(page, '/gesetze/international/LUGUE');
  const erklaerungen = page.locator('#art-decl_u2');
  await expect(erklaerungen).toBeVisible({ timeout: 20000 });
  // decl/scope-Nachzug: abgesetzte Anhang-Optik wie annex_u1 (istAnhangToken).
  await expect(erklaerungen).toHaveAttribute('data-anhang', '');
  await expect(page.locator('#art-scope_u1')).toHaveAttribute('data-anhang', '');
  // EID-2-Nachzug (deklarierte Test-Anpassung, §6.3): seit dem Verifizier-Deep-Link
  // trägt der Block ZWEI Links mit «Vorbehalte und Erklärungen» im Accessible Name
  // (Titel-Anker + «amtliche Fassung ↗», dessen aria-label den Titel zitiert).
  // Gemeint ist hier der TITEL-Anker → exact-Name (Identität statt Substring, §7).
  await expect(erklaerungen.getByRole('link', { name: 'Vorbehalte und Erklärungen', exact: true })).toBeVisible();
  // Kerninhalt (CH-Zustellungs-Vorbehalt nach Art. I Abs. 2 Protokoll 1) ist da.
  await expect(erklaerungen.getByText(/behält sich das in Artikel I Absatz 2/)).toBeVisible();
});

// ── ⑤ LugÜ Ratifikations-Tabelle: overflow-x-Container, KEIN Seiten-H-Overflow ─
test('⑤ LugÜ @390: Ratifikations-Tabelle scrollt im Container, kein Seiten-H-Overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await warteReader(page, '/gesetze/international/LUGUE');
  // Die Ratifikations-Tabelle sitzt in einem seitlich scrollbaren overflow-x-Container.
  const tabelle = page.locator('[data-mehrspaltig][role="group"]').first();
  await expect(tabelle).toBeVisible({ timeout: 20000 });
  const overflowX = await tabelle.evaluate((el) => getComputedStyle(el).overflowX);
  expect(['auto', 'scroll']).toContain(overflowX);
  // KRITISCH (G3b-Overflow-Fix): die Seite läuft @390 NICHT horizontal über
  // (baseline war scrollWidth 790 — der Bereich-Badge der Anhang-Sektion).
  const doc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(doc.sw, 'kein horizontaler Seiten-Overflow @390').toBeLessThanOrEqual(doc.cw + 1);
});

// ── ⑤ LugÜ @1440: ebenfalls kein H-Overflow (Desktop-Regression) ──────────────
test('⑤ LugÜ @1440: kein horizontaler Seiten-Overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await warteReader(page, '/gesetze/international/LUGUE');
  await expect(page.locator('article[data-anhang]').first()).toBeVisible({ timeout: 20000 });
  const doc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(doc.sw).toBeLessThanOrEqual(doc.cw + 1);
});
