// @shard-gruppe: 6
// ── W2·26-FUNKTIONSZEILE-ZAEHLER · DIE ZEILE ZÄHLT OHNE EIGENEN FETCH ───────
//
// Diese Datei ERSETZT `e2e/leser-bezuege-zaehler.e2e.ts` (W2·24-R6c). Deren
// drei Zusagen stehen unverändert weiter unten — sie sind nicht weggefallen,
// sie haben nur eine vierte dazubekommen, und zwei Browser-Läufe für dieselbe
// Seite wären reine Kosten (§17-Gegengewicht). Der Befund von R6 bleibt für
// seinen Stand richtig (§0 Ziff. 2b); W2·26 löst ihn eine Ebene tiefer.
//
// BEFUND R6 (Prüfer, 6.9.2026, «ZÄHL-DATEI»): die Bezüge-Zeile nannte ihre
// Entscheid-Zahl erst, wenn der volle Bezugs-Shard geladen war (OR 2.2 MB roh),
// und die Rubrik «Materialien» gar nicht — deren Shard kommt im Leser nicht
// vor, und eine Rubrik ohne Zahl wäre eine Zusage ohne Deckung gewesen (§8).
// R6c beantwortete das mit einer eigenen Zähl-Datei je Erlass
// (`public/verzahnung/bezuege-zaehler/<KEY>.json`, ø 289 B), geholt IM LEERLAUF.
//
// BEFUND D34-NACHFIX (ROADMAP `W2·26-FUNKTIONSZEILE-ZAEHLER`): genau dieser
// eigene, aufgeschobene Fetch ist der Rest des Problems. Er kommt NACH der
// Artikelliste, und im OR wachsen dadurch Funktionszeilen in einer zweiten
// Render-Runde in den fertigen Lesekörper (ROADMAP nennt 145; NACHGEMESSEN am
// Bestand 11.9.2026 tragen 469 OR-Artikel Zahlen — die Roadmap-Zahl bleibt für
// ihren Stand stehen, §0 Ziff. 2b, gemessen ist die grössere). GEBAUT: die Zahlen reisen im
// Struktur-Sidecar mit (`public/normtext/struktur/<ebene>/<KEY>.json`,
// Schlüssel `zaehler`) — der Datei, die der Leser ohnehin holt und die er VOR
// den Einträgen bekommt.
//
// VIER ZUSAGEN (die vierte zusätzlich auf dem Kanton-Pfad, s. dort):
//  (a) Die Zahl steht da — und sie ist die richtige (OR 336c: 11 Entscheide,
//      dieselbe Zahl, die der Shard ungefiltert führt).                 [R6c a]
//  (b) Die Rubrik «Materialie» ist da, wo es eine gibt (ARG 15a).       [R6c b]
//  (c) DER PREIS: dafür geht KEIN Bezugs- und KEIN Materialien-Shard über
//      die Leitung. Ohne (c) wäre der ganze Bau sinnlos.                [R6c c]
//  (d) KEIN ZWEITER FETCH, und die Zahl steht in der ERSTEN Runde: über die
//      ganze Sitzung geht keine Anfrage an `/verzahnung/bezuege-zaehler/`
//      (den Pfad gibt es nicht mehr), und in demselben Moment, in dem der
//      erste Artikel sichtbar ist, steht die Marke schon da — ohne dass der
//      Test darauf wartet.
//
// ROT ZU BEKOMMEN (§6.7): den Stand vor diesem Bau (efc7129b8) nehmen — (d)
// reisst dort an beiden Erlassen mit «Zähl-Fetches:
// http://localhost:4503/verzahnung/bezuege-zaehler/{OR,ARG}.json»; der Lauf ist
// im PR belegt. EHRLICH DAZU (§8): auf dem warmen lokalen Preview-Server gewann
// der Leerlauf-Fetch das Rennen gegen die 1.9-MB-Artikelliste, die
// ERSTE-RUNDE-Hälfte von (d) war dort also schon grün. Was rot war und jetzt
// baulich unmöglich ist, ist das Rennen selbst samt seiner zweiten Anfrage.
// Im laufenden Bau reisst (d) ausserdem, sobald `useBezuegeZaehler` wieder eine
// andere Quelle als das Sidecar liest.
import { test, expect, type Page } from '@playwright/test';

/** Welche schweren Shards hat die Seite angefasst? [R6c (c)] */
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

/** Anfragen an die abgeschaffte eigene Zähl-Datei. [(d)] */
function zaehlSonde(page: Page): string[] {
  const gesehen: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/verzahnung/bezuege-zaehler/')) gesehen.push(r.url());
  });
  return gesehen;
}

async function zeile(page: Page, artikel: string): Promise<string> {
  const el = page.locator(`#art-${artikel} .lr7-bez-zeile`);
  await expect(el, `keine Bezüge-Zeile an Art. ${artikel}`).toHaveCount(1, { timeout: 20_000 });
  return (await el.innerText()).replace(/\s+/g, ' ').trim();
}

test.describe('W2·26 · Funktionszeile zählt aus dem Struktur-Sidecar', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a)+(c)+(d) OR 336c nennt 11 Entscheide, sobald der erste Artikel steht', async ({ page }) => {
    const schwer = shardSonde(page);
    const zaehl = zaehlSonde(page);
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto('/gesetze/bund/OR#art-336_c');
    // Der Lade-Riegel der Lesespalte ist `!erlass || !eintraege`. Sobald der
    // erste Artikel steht, ist die erste Render-Runde vorbei.
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 30_000 });

    // (d) OHNE Wartezeit: die Marke muss JETZT schon dastehen.
    const marke = page.locator('#art-336_c .lr7-bez-marke[data-reg="r"]');
    const sofort = await marke.count();
    const text = sofort > 0 ? (await marke.first().innerText()).replace(/\s+/g, ' ').trim() : '(keine Marke)';
    expect(sofort, `Entscheid-Marke an OR 336c in der ersten Runde: ${text}`).toBe(1);
    // (a) und die Zahl ist die richtige.
    expect(text).toMatch(/11\s*Entscheide/);
    const ganz = await zeile(page, '336_c');
    expect(ganz, `Bezüge-Zeile: «${ganz}»`).toContain('11');

    // (c)+(d) auch nachlaufend darf nichts kommen.
    await page.waitForTimeout(2_000);
    expect(schwer, `schwere Shards geladen: ${schwer.join(', ')}`).toEqual([]);
    expect(zaehl, `Zähl-Fetches: ${zaehl.join(', ')}`).toEqual([]);

    // Kein Layout-Sprung ohne Eingabe — der Nachzug der Zahlen, der ihn hätte
    // auslösen können, existiert nicht mehr.
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls, `CLS ${cls}`).toBeLessThanOrEqual(0.001);
  });

  // Die Kanton-Probe ist KEIN Duplikat der beiden oberen: sie prüft die eine
  // Falle des Umbaus (Kopf von `../src/pages/gesetz-leser/bezuegeZaehler.ts`).
  // Der geteilte Sidecar-Cache greift nur bei ZEICHENGLEICHER URL. Bund und
  // Kanton bilden die Daten-Ebene verschieden ab; nähme der Zähler-Zugriff die
  // falsche, wäre das Ergebnis kein sichtbarer Fehler, sondern ein stiller
  // ZWEITER Fetch — also genau der Zustand, den dieser Bau beseitigt hat.
  test('(d) Kanton: BS-154.100 Art. 92 zählt aus demselben Sidecar-Fetch', async ({ page }) => {
    const zaehl = zaehlSonde(page);
    const strukturFetches: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/normtext/struktur/')) strukturFetches.push(r.url());
    });
    await page.goto('/gesetze/kanton/BS-154.100#art-92');
    await expect(page.locator('#art-92')).toBeVisible({ timeout: 30_000 });
    const marke = page.locator('#art-92 .lr7-bez-marke[data-reg="r"]');
    expect(await marke.count(), 'Entscheid-Marke an BS-154.100 Art. 92 in der ersten Runde').toBe(1);
    expect((await marke.first().innerText()).replace(/\s+/g, ' ')).toMatch(/1312\s*Entscheide/);
    await page.waitForTimeout(1_500);
    expect(zaehl, `Zähl-Fetches: ${zaehl.join(', ')}`).toEqual([]);
    // EIN Sidecar-Fetch, nicht zwei — der Beweis, dass der Zähler am selben
    // Cache-Eintrag hängt wie Gliederung und Erlass-Kopf.
    expect(strukturFetches, `Sidecar-Fetches: ${strukturFetches.join(', ')}`).toHaveLength(1);
  });

  test('(b)+(c)+(d) ARG 15a nennt «1 Materialie» in der ersten Runde', async ({ page }) => {
    const schwer = shardSonde(page);
    const zaehl = zaehlSonde(page);
    await page.goto('/gesetze/bund/ARG#art-15_a');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 30_000 });
    const marke = page.locator('#art-15_a .lr7-bez-marke[data-reg="m"]');
    expect(await marke.count(), 'Materialien-Marke an ARG 15a in der ersten Runde').toBe(1);
    // S6 (23.9.2026, deklariert §6.3): die Rubrik heisst wie ihr Blatt-Reiter
    // «Erläuterungen» (Entscheid David AN-10/AN-11); Zahl und Quelle unverändert.
    expect((await marke.first().innerText()).replace(/\s+/g, ' ')).toMatch(/1\s*Erläuterung/);
    await page.waitForTimeout(1_500);
    expect(schwer, `schwere Shards geladen: ${schwer.join(', ')}`).toEqual([]);
    expect(zaehl, `Zähl-Fetches: ${zaehl.join(', ')}`).toEqual([]);
  });
});
