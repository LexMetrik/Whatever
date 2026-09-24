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
// ═══ §6.3-DEKLARATION · S6 W1f (Entscheid David 24.9.2026) ══════════════════
// Wörtlich: «die zeile soll ganz weg. infos sollen alle im blatt erscheinen».
// Die Zeile ist gefallen. (d) bleibt Wort für Wort (der Lesefluss lädt keinen
// schweren Shard) — nur die Vorbedingung «die Zahl steht» fällt mit der Zeile.
// (a)+(b) sind gestrichen: sie prüften die Zeilen-Zahl gegen die Zeilen-Liste;
// die Entscheide des Artikels stehen im Reiter «Entscheide» des Blatts, dessen
// Zählung `leser-v3-panel-*` bewacht. (c) zieht ins Blatt um: die
// Erläuterungen DIESES Artikels stehen oben im Reiter «Erläuterungen»
// (`v3/BlattArtikel.tsx`, Gruppe `data-v3-blatt-artikelgruppe`).
import { test, expect, type Page } from '@playwright/test';
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';


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
test.describe('D30 · Bezüge-Zeile: was gezählt wird, wird auch gezeigt', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(d) zugeklappt geht kein schwerer Shard über die Leitung', async ({ page }) => {
    const schwer = shardSonde(page);
    await page.goto('/gesetze/bund/OR#art-336_c');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#art-336_c')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1_500);
    expect(schwer, `schwere Shards ohne Aufklappen geladen: ${schwer.join(', ')}`).toEqual([]);
    // Und im Lesekörper steht keine einzige Entscheid-Zeile (Pos. 12).
    expect(await page.locator('#lc-lesespalte [data-bezug-gruppe]').count()).toBe(0);
  });

  // §6.3-DEKLARATION (S6, 23.9.2026): die Rubrik `m` heisst seit dem Entscheid
  // David (AN-10/AN-11) «Erläuterungen» wie ihr Blatt-Reiter; Register, Zahl,
  // Liste und `data-bez-material` sind unverändert — nur das Wort am Griff.
  test('(c) ARG 15a: die Erläuterungen dieses Artikels stehen oben im Blatt-Reiter', async ({ page }) => {
    await page.goto('/gesetze/bund/ARG#art-15_a');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
    await blattFuerArtikel(page.locator('#art-15_a'), 20_000);
    await blattReiter(page, 'erlaeuterungen');
    const gruppe = page.locator('[data-v3-blatt-artikelgruppe="erlaeuterungen"][data-v3-blatt-artikel="15_a"]');
    const mat = gruppe.locator('li[data-bez-material]');
    await expect(mat.first(), 'die Artikelgruppe «Erläuterungen» zeigt nichts').toBeVisible({ timeout: 25_000 });
    // Jede Zeile führt zu ihrem Dokument (kein toter Eintrag, §8).
    const n = await mat.count();
    await expect(gruppe.locator('li[data-bez-material] a[href^="/materialien/"]')).toHaveCount(n);
  });
});
