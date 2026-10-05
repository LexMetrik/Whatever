// @shard-gruppe: nacht
import { test, expect } from '@playwright/test';

// ─── /materialien: DOM-Deckel je Behörde (W2·31-BILDSCHIRMBREITE P6, 30.9.2026)
//
// Vorher rendert die Seite alle Register-Einträge als Karte (1'684; gemessen
// 78'552 px hoch @1920, 17'158 DOM-Knoten). Jetzt höchstens 100 je Behörde, der
// Rest am «Weitere anzeigen»-Knopf (Muster /rechtsprechung). Der Wächter prüft
// im echten Browser, was der Render-Test (src/tests/materialien-deckel-p6.test.tsx)
// nur mit Stub-Daten belegt: die ECHTE Registergrösse, die Sprungziele und den
// Filter über den ganzen Bestand.
// ROT ZU BEKOMMEN: in `MaterialRaster.tsx` `.slice(0, sichtbar)` streichen → die
// grosse Gruppe trägt alle Karten (> 100), der Knopf fehlt.

const DECKEL = 100;

test('/materialien: jede Gruppe ≤ 100 Karten, grosse Gruppen tragen den Knopf mit Restzahl', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/materialien');
  await expect(page.locator('a.lc-card').first()).toBeVisible({ timeout: 15000 });

  const gruppen = await page.locator('section[id^="b-"]').evaluateAll((els) => els.map((s) => ({
    id: s.id,
    karten: s.querySelectorAll('a.lc-card[href^="/materialien/"]').length,
    // Gruppenkopf: die erste `.num` der Sektion ist die Zählung der vollen Gruppe.
    kopfZahl: Number((s.querySelector('.num')?.textContent ?? '').replace(/\D/g, '')),
    knopf: [...s.querySelectorAll('button')].map((b) => b.textContent ?? '').find((t) => /Weitere anzeigen/.test(t)) ?? null,
  })));
  expect(gruppen.length).toBeGreaterThan(5);
  for (const g of gruppen) expect(g.karten, g.id).toBeLessThanOrEqual(DECKEL);

  // Mindestens eine Gruppe ist grösser als der Deckel (das Register hat BUND/BR …):
  // dort zählt der Kopf die VOLLE Gruppe, der Knopf nennt die Differenz.
  const gross = gruppen.filter((g) => g.kopfZahl > DECKEL);
  expect(gross.length, 'keine Gruppe über dem Deckel — Wächter ohne Gegenstand').toBeGreaterThan(0);
  for (const g of gross) {
    expect(g.karten, g.id).toBe(DECKEL);
    expect(g.knopf, g.id).toContain(`(${(g.kopfZahl - DECKEL).toLocaleString('de-CH')} weitere)`);
  }
});

test('/materialien: «Weitere anzeigen» wächst um einen Deckel, Fokus auf der ersten neuen Karte, kein Sprung', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/materialien');
  await expect(page.locator('a.lc-card').first()).toBeVisible({ timeout: 15000 });
  const knopf = page.getByRole('button', { name: /Weitere anzeigen/ }).first();
  // Gruppe über ihre id festhalten: verschwindet der Knopf nach dem Klick (letzter
  // Stapel), löst `first()` sonst auf den Knopf der NÄCHSTEN Gruppe auf.
  const id = await knopf.evaluate((b) => b.closest('section')!.id);
  const gruppe = page.locator(`#${id}`);
  await knopf.scrollIntoViewIfNeeded();
  const vorher = await gruppe.locator('a.lc-card').count();
  const y = await page.evaluate(() => window.scrollY);
  await knopf.click();
  await expect(gruppe.locator('a.lc-card')).toHaveCount(Math.min(vorher + DECKEL, await gruppe.evaluate((s) => Number((s.querySelector('.num')?.textContent ?? '').replace(/\D/g, '')))));
  // Der Inhalt wächst nach unten: die Scrollposition bleibt, der Fokus liegt auf der ersten neuen Karte.
  expect(await page.evaluate(() => window.scrollY)).toBe(y);
  const fokus = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? '');
  expect(fokus).toMatch(/^\/materialien\//);
});

test('/materialien: der Filter findet einen Eintrag hinter dem Deckel; Sprungziel #b-<Behörde> trägt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/materialien#b-SECO');
  await expect(page.locator('a.lc-card').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#b-SECO')).toBeVisible();
  // Sprungziel liegt unter der Arbeitsleiste (lc-sprungziel), nicht verdeckt.
  const top = await page.locator('#b-SECO').evaluate((s) => s.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(300);

  // «ArGV 1 Artikel 32a» steht in der SECO-Gruppe hinter dem Deckel.
  await expect(page.getByText('ArGV 1 Artikel 32a', { exact: false })).toHaveCount(0);
  await page.getByPlaceholder('Titel, Nummer oder Behörde …').fill('ArGV 1 Artikel 32a');
  await expect(page.getByText('ArGV 1 Artikel 32a', { exact: false }).first()).toBeVisible();
});

// B1 (Zweitprüfung #1185): das aufgeklappte Fenster überlebt den Weg in eine
// Detailseite und zurück (Hausmuster /rechtsprechung: `leseFenster` lazy im ersten
// Render). Ohne das ist das Fenster nach «zurück» wieder 100 hoch, das Dokument zu
// kurz, und die Y-basierte Scroll-Wiederherstellung (App.tsx) greift ins Leere.
// ROT ZU BEKOMMEN: in `MaterialRaster.tsx` das lazy `leseFenster` im useState
// durch `MATERIAL_DECKEL` ersetzen → das Fenster ist nach «zurück» wieder 100.
test('/materialien: nach Detailseite und «zurück» steht das aufgeklappte Fenster wieder und die Position trägt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/materialien');
  await expect(page.locator('a.lc-card').first()).toBeVisible({ timeout: 15000 });
  // Die grösste Gruppe (BUND, 831 Einträge) über ihre id festhalten, 3× «Weitere» → 400 Karten.
  const id = await page.locator('section[id^="b-"]').evaluateAll((els) => {
    const zahl = (s: Element) => Number((s.querySelector('.num')?.textContent ?? '').replace(/\D/g, ''));
    return els.reduce((a, b) => (zahl(b) > zahl(a) ? b : a)).id;
  });
  const gruppe = page.locator(`#${id}`);
  for (let i = 1; i <= 3; i++) {
    await gruppe.getByRole('button', { name: /Weitere anzeigen/ }).click();
    await expect(gruppe.locator('a.lc-card')).toHaveCount((i + 1) * DECKEL);
  }
  const karte = gruppe.locator('a.lc-card').nth(350);
  await karte.scrollIntoViewIfNeeded();
  const href = (await karte.getAttribute('href'))!;
  const vorher = await karte.evaluate((a) => a.getBoundingClientRect().top);
  await karte.click();
  await expect(page).toHaveURL(/\/materialien\/[^/]+$/);
  await page.goBack();
  // Das Fenster ist sofort wieder 400 hoch (nicht 100) …
  await expect(gruppe.locator('a.lc-card')).toHaveCount(4 * DECKEL, { timeout: 15000 });
  // … und die Rückkehr landet wieder auf DERSELBEN Karte (Position ±1 Zeile).
  const wieder = page.locator(`a.lc-card[href="${href}"]`);
  await expect(wieder).toBeVisible();
  await expect.poll(async () => Math.abs((await wieder.evaluate((a) => a.getBoundingClientRect().top)) - vorher), { timeout: 10000 }).toBeLessThan(120);
});
