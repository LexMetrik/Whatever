// @shard-gruppe: 2
// ── W2·24-R5-F1K · D30 · DIE BEZÜGE-ZEILE ZEIGT, WAS SIE ZÄHLT ──────────────
//
// BEFUND David 6.9.2026, wörtlich: die Zeile «Bezüge · 11 Entscheide · 1 Rechner ›»
// klappt auf, «zeigt aber NUR ‹Rechnen › Kündigung & Fristen …› (57 px); die 11
// Entscheide (und Materialien) werden nicht gerendert/geladen».
//
// WURZEL: seit H3 lädt der Leser den Bezugs-Shard erst beim Öffnen des PANELS
// (`v3/panelModell.ts`), und `v3/LeserLesespalte.tsx` liess die `bezuege`-Prop
// des Kerns bewusst weg (Pos. 12). Die ZAHL kam aus der Zähl-Datei (R6c), die
// LISTE hatte keinen Weg mehr in die Zeile. Die Materialien-Rubrik hatte im
// Leser überhaupt nie eine Liste.
//
// VIER ZUSAGEN:
//  (a) Aufklappen zeigt Entscheid-Zeilen — mit Zitierung, Leitentscheide zuerst.
//  (b) Der Zähler der Zeile ist die Länge der geladenen Liste, nicht eine
//      zweite Zahl daneben (§8): Zähler == Summe der Gruppen-Gesamtzahlen.
//  (c) Die Materialien-Rubrik zeigt ihre Dokumente (ARG 15a).
//  (d) DER PREIS BLEIBT BEZAHLT: solange niemand aufklappt, geht kein schwerer
//      Shard über die Leitung (H3/Pos. 12) — ohne (d) wäre der Fix ein Rückbau.
//
// ROT ZU BEKOMMEN (§6.7), je einzeln belegt in `abnahme/design-identitaet/R5-F1K.md`:
//  · in `v3/LeserLesespalte.tsx` `onBezuegeOeffnen` weglassen  ⇒ (a)(b)(c) rot
//  · in `parts/Funktionszeile.tsx` den `ref`-Ruf entfernen        ⇒ (a) rot bei
//    gemerkt offener Zeile
//    (D35-F1, 7.9.2026: dieser Rot-Weg ist GEGENSTANDSLOS geworden — der
//    gemerkte Zustand `lm.leser.bezuege-offen` ist ersatzlos gelöscht, die
//    Zeile steht beim Laden immer zu. Der Beleg bleibt als Beleg SEINES
//    Datums stehen (§2b); die Rot-Wege für (a) sind heute die beiden anderen
//    hier genannten und der neue Wächter `leser-d35-f1-funktionszeile`.)
//  · in `parts/ArtikelLeser.tsx` den Zähler wieder auf `zaehler` vorziehen ⇒ (b) rot
import { test, expect, type Page, type Locator } from '@playwright/test';

/** Schwere Shards, die der Leser NICHT ungefragt holen darf. */
function shardSonde(page: Page): string[] {
  const gesehen: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('/rechtsprechung/bezuege/') || u.includes('/materialien/kanten/')) {
      gesehen.push(u.slice(u.indexOf('/', 8)));
    }
  });
  return gesehen;
}

/** Die Zahl einer Rubrik der Zeile («11 Entscheide» → 11). */
async function marke(page: Page, artikel: string, reg: 'r' | 'm' | 'g' | 'w'): Promise<number | null> {
  const el = page.locator(`#art-${artikel} .lr7-bez-marke[data-reg="${reg}"]`);
  if (await el.count() === 0) return null;
  const t = (await el.innerText()).replace(/\u00a0/g, ' ');
  const m = /(\d+)/.exec(t);
  return m ? Number(m[1]) : null;
}

/**
 * EINE Rubrik der Funktionszeile aufklappen (idempotent).
 *
 * ── DEKLARIERTE ANPASSUNG (W2·24-D35-F1, 7.9.2026 — §6.3) ──────────────────
 * Bis D34 war die Zeile EIN `<details>`: ein Klick auf die `<summary>` öffnete
 * alle vier Rubriken zugleich. Seit D35-F1 trägt jede Rubrik ihren eigenen
 * Griff (David: «das alles soll dann nur auf klick aufklappbar sein») — der
 * Helfer nennt darum die Rubrik, die er will. Die vier ZUSAGEN (a)–(d) unten
 * sind unverändert; nur der Weg zum Aufklappen ist ein anderer.
 */
async function klappeAuf(page: Page, artikel: string, reg: 'r' | 'm' | 'g' | 'w' = 'r'): Promise<Locator> {
  const zeile = page.locator(`#art-${artikel} .lr7-bez`);
  await expect(zeile, `keine Funktionszeile an Art. ${artikel}`).toHaveCount(1, { timeout: 20_000 });
  const griff = zeile.locator(`.lr7-bez-marke[data-reg="${reg}"]`);
  await expect(griff, `keine Rubrik «${reg}» an Art. ${artikel}`).toHaveCount(1, { timeout: 20_000 });
  if (await griff.getAttribute('aria-expanded') !== 'true') await griff.click();
  await expect(griff).toHaveAttribute('aria-expanded', 'true', { timeout: 5_000 });
  return zeile;
}

test.describe('D30 · Bezüge-Zeile: was gezählt wird, wird auch gezeigt', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(d) zugeklappt geht kein schwerer Shard über die Leitung', async ({ page }) => {
    const schwer = shardSonde(page);
    await page.goto('/gesetze/bund/OR#art-336_c');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    // Die Zahl steht (Zähl-Datei) — der Apparat nicht.
    await expect(page.locator('#art-336_c .lr7-bez-marke[data-reg="r"]'))
      .toHaveText(/\d+\s*Entscheide?/, { timeout: 20_000 });
    await page.waitForTimeout(1_500);
    expect(schwer, `schwere Shards ohne Aufklappen geladen: ${schwer.join(', ')}`).toEqual([]);
    // Und im Lesekörper steht keine einzige Entscheid-Zeile (Pos. 12).
    expect(await page.locator('#lc-lesespalte [data-bezug-gruppe]').count()).toBe(0);
  });

  test('(a)+(b) OR 336c: Aufklappen zeigt Entscheide, der Zähler ist die Listenlänge', async ({ page }) => {
    await page.goto('/gesetze/bund/OR#art-336_c');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#art-336_c .lr7-bez-marke[data-reg="r"]'))
      .toHaveText(/\d+\s*Entscheide?/, { timeout: 20_000 });
    const details = await klappeAuf(page, '336_c');

    // (a) Der Entscheid-Block steht, mit mindestens einer Gruppe und Zeilen darin.
    const block = details.locator('.lr7-bez-block[data-reg="r"]');
    await expect(block, 'kein Entscheid-Block in der aufgeklappten Zeile').toHaveCount(1, { timeout: 25_000 });
    const gruppen = block.locator('[data-bezug-gruppe]');
    await expect(gruppen.first(), 'keine Entscheid-Gruppe gerendert').toBeVisible({ timeout: 25_000 });
    const zeilen = block.locator('[data-bezug-linie] a[href^="/rechtsprechung/"]');
    const anzahlZeilen = await zeilen.count();
    expect(anzahlZeilen, 'kein einziger Entscheid gerendert — genau Davids Befund').toBeGreaterThan(0);
    // Jede Zeile trägt ihre Zitierung als lesbaren Text (nicht nur ein Symbol).
    await expect(zeilen.first()).toHaveText(/[A-Za-zÄÖÜ]{3}[^]*\d/);
    // D30 «Zitierung + Regeste-Zeile»: die amtliche Kurzregeste steht SICHTBAR
    // unter dem Zitat, nicht nur im `title` (für Tastatur und Touch unsichtbar).
    const regesten = block.locator('.lr7-bez-eintrag .lr7-bez-regeste');
    expect(await regesten.count(), 'kein einziger Eintrag zeigt seine Regeste').toBeGreaterThan(0);
    await expect(regesten.first()).toBeVisible();

    // LEITENTSCHEID ZUERST: die erste Gruppe ist die ranghöchste, im OR die BGE.
    const ersteGruppe = await gruppen.first().getAttribute('data-bezug-gruppe');
    expect(ersteGruppe, `erste Entscheid-Gruppe ist «${ersteGruppe}»`).toBe('bge');

    // (b) DIE ZUSAGE, DIE DAVID FORMULIERT HAT: «Zähler in der Zeile =
    // Listenlänge nach dem Laden.» Die beiden Zahlen kommen aus VERSCHIEDENEN
    // Quellen — die Kopfzahl aus der buildseitigen Zähl-Datei, die Zeilen aus
    // dem Bezugs-Shard — und genau darum ist ihre Gleichheit eine Messung und
    // keine Tautologie. Am Stand `8cfbc521e` war sie verletzt: Kopf 11, Liste 3,
    // weil die Zeile stillschweigend die Panel-Facetten erbte.
    const kopfZahl = await marke(page, '336_c', 'r');
    // Die Zahl springt beim Laden nicht um (R6c-Zusage): OR 336c führt 11.
    expect(kopfZahl, 'OR 336c führt laut Zähl-Datei 11 Entscheide').toBe(11);
    // Die Gruppenköpfe nennen zusammen genau diese Bezugsgrösse — ohne dass ein
    // unsichtbarer Filter etwas abzieht (der Ist-Fehler: Kopf 11, Liste 3).
    const proGruppe = await gruppen.evaluateAll((els) => els.map((el) => {
      const t = (el.querySelector('span')?.textContent ?? '').replace(/ /g, ' ');
      const zahlen = t.match(/\d+/g) ?? [];
      return zahlen.length > 0 ? Number(zahlen[zahlen.length - 1]) : 0;
    }));
    const summe = proGruppe.reduce((a, b) => a + b, 0);
    expect(summe, `Kopfzahl ${kopfZahl} gegen Gruppen-Summe ${summe} (${proGruppe.join('+')})`).toBe(kopfZahl);
    // «ZÄHLER = LISTENLÄNGE NACH DEM LADEN» — der Nachweis, dass die Liste die
    // Kopfzahl auch WIRKLICH hergibt. Sichtbar sind zuerst 5 je Gruppe
    // (`PRO_SCHRITT`, unverändert — die Verteilung erlaubt kein «alles auf
    // einmal»: gemessen 224 Artikel mit über 50 Entscheiden, Schlechtfall
    // BGG 42 mit 4140). Der Rest hängt an «weitere N», und nach dem letzten
    // Klick MUSS die Zeilenzahl der Kopfzahl entsprechen. Fehlte eine Kante,
    // stünde über der Liste eine Zahl, die die Liste nicht einlöst (§8).
    const weitere = block.locator('button[aria-label*="weitere laden"]');
    for (let runde = 0; runde < 40 && await weitere.count() > 0; runde += 1) {
      await weitere.first().click();
    }
    expect(await weitere.count(), '«weitere» lässt sich nicht ausschöpfen').toBe(0);
    const vollZahl = await zeilen.count();
    expect(vollZahl, `Kopfzahl ${kopfZahl} gegen ${vollZahl} ausgeklappte Entscheid-Zeilen`).toBe(kopfZahl);
  });

  // §6.3-DEKLARATION (S6, 23.9.2026): die Rubrik `m` heisst seit dem Entscheid
  // David (AN-10/AN-11) «Erläuterungen» wie ihr Blatt-Reiter; Register, Zahl,
  // Liste und `data-bez-material` sind unverändert — nur das Wort am Griff.
  test('(c) ARG 15a: die Erläuterungen-Rubrik zeigt ihre Dokumente', async ({ page }) => {
    await page.goto('/gesetze/bund/ARG#art-15_a');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#art-15_a .lr7-bez-marke[data-reg="m"]'))
      .toHaveText(/\d+\s*Erläuterung/, { timeout: 20_000 });
    const details = await klappeAuf(page, '15_a', 'm');
    const mat = details.locator('.lr7-bez-block[data-reg="m"] li[data-bez-material]');
    await expect(mat.first(), 'Materialien-Rubrik zählt, zeigt aber nichts').toBeVisible({ timeout: 25_000 });
    const zahl = await marke(page, '15_a', 'm');
    expect(await mat.count(), `Materialien-Zähler ${zahl} gegen ${await mat.count()} Zeilen`).toBe(zahl);
    // Jede Zeile führt zu ihrem Dokument (kein toter Eintrag, §8).
    await expect(mat.first().locator('a[href^="/materialien/"]')).toHaveCount(1);
  });
});
