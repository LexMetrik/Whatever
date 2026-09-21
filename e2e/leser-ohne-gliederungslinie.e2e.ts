// @shard-gruppe: 7
import { test, expect, type Page } from '@playwright/test';
import { ANSICHT_OEFFNER, warteLeserBereit } from './helpers/leserBereit';
import { ANSICHT_PANEL, SCHALTER_ROLLE } from './helpers/leserBeschriftung';

// LINIEN-RÜCKBAU V1 — die Gliederungslinie im Lesetext bleibt weg.
//
// Entscheid David 13.8.2026 im Wortlaut: «ja linien ganz entfernen» (Variante V1,
// FAHRPLAN-GESETZESDARSTELLUNG-V2 §9.3 e). Vorgeschichte: die Linie wurde DREIMAL
// gebaut und DREIMAL live verworfen — A8 (5.7.2026), A28 (12.7.2026: «das mit den
// linien funktioniert überhaupt nicht»), PR #423 (3.8.2026: «eine einzige linie und
// unbrauchbar»). Jeder Anlauf drehte an der Schalter-/Schwellen-Logik über einer
// Mechanik, die strukturell nur EINE Linie auf EINER Ebene zeigen konnte.
//
// Diese Spec ist der Wächter gegen den vierten Anlauf. Sie deckt DREI Aussagen,
// jede einzeln rot zu bekommen:
//   1. NEGATIV — im Lesetext rendert keine Gliederungs-Sektion mehr eine linke
//      Kante, auch nicht am tiefsten Punkt des Korpus (ZGB Art. 684, Tiefe 5).
//   2. NEGATIV — die Steuer-Attribute der alten Mechanik sind fort: kein
//      `data-linien` am <html>, kein `data-guide-auto` am `.lc-leser`-Root.
//   3. NEGATIV (bis 29.8.2026 POSITIV) — auch der EINZUG staffelt nicht mehr:
//      keine Gliederungs-Sektion trägt noch ein `padding-left`.
//
// ── ZIFF. 3 IST AM 29.8.2026 GEKIPPT (deklarierte fachliche Änderung, §6.3) ──
// Hier stand die Gegenprobe «der Einzug staffelt die Verschachtelung weiter
// (§4b Rang 2)» — sie hielt fest, was der Linien-Rückbau vom 16.8.2026 bewusst
// stehen liess. David hat am 29.8.2026 auch das aufgehoben, wörtlich: «wichtige
// änderung … im gesetz die staffelung aufzuheben. es soll alles auf der selben
// höhe stehen. … analog zu fedlex». Die Zeile wird darum nicht gelöscht,
// sondern UMGEKEHRT — und ihre Aussage wandert von der Sektion (wo sie nur ein
// CSS-Wert war) auf das, worum es geht: die WIRKUNG am Lesetext. Ohne den
// zweiten Teil wäre der Fall ein Schein-Tor (§6.7), denn `padding-left: 0`
// liesse sich mit `margin-left` oder einem Wrapper folgenlos umgehen.
//
//   3a. keine Sektion trägt einen Einzug (die Mechanik ist fort);
//   3b. ALLE Artikel-Textkörper der Seite stehen auf EINER linken Kante und
//       haben EINE Breite (die Zusage, die David gegeben wurde).
// Gemessen vor dem Entscheid @1440: ZGB 5 Kanten (574…654 px) / 5 Breiten
// (540…620 px), OR 6 / 6, StGB 4 / 4. Danach je genau eine.
// Der Deckel «≤ 70 ch» derselben Entscheidung liegt in
// `e2e/leser-lesemass.e2e.ts` (Block T-1C) — dort steht die Messmethode.

async function warteReader(page: Page, url: string, artId: string): Promise<void> {
  await page.goto(url);
  // App-Ready: der «Ansicht»-Trigger rendert nur der Client (nicht im Crawler-HTML).
  // Seit 17.8.2026 über die geteilte ATTRIBUT-Wartung: die frühere Rolle+Name-
  // Abfrage rechnete für jeden der 13 518 OR-Knöpfe den zugänglichen Namen aus
  // und riss unter 4× CPU-Drossel dieses 20-s-Budget 5/5 (Wurzel von Ä24).
  // Messreihe und Herleitung: `e2e/helpers/leserBereit.ts`. Budget und
  // Sachaussage unverändert (§6.3).
  await warteLeserBereit(page);
  await expect(page.locator(`#${artId}`)).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(300);
}

/** Gliederungs-Sektionen über einem Artikel: wie viele tragen eine gerenderte
 *  linke Kante, wie viele einen Einzug? Gezählt werden nur `section`-Vorfahren
 *  innerhalb von `.lc-leser` — die Spalten-Trennlinien des 2-Spalten-Grids sind
 *  `div`s und bleiben aussen vor. */
async function sektionsKanten(page: Page, artId: string): Promise<{ sektionen: number; mitKante: number; mitEinzug: number }> {
  return page.evaluate((id) => {
    const wurzel = document.querySelector('.lc-leser');
    let el: HTMLElement | null = document.getElementById(id)?.parentElement ?? null;
    let sektionen = 0;
    let mitKante = 0;
    let mitEinzug = 0;
    while (el && wurzel?.contains(el)) {
      if (el.tagName === 'SECTION') {
        sektionen++;
        const cs = getComputedStyle(el);
        const breite = parseFloat(cs.borderLeftWidth);
        if (cs.borderLeftStyle !== 'none' && breite > 0) mitKante++;
        if (parseFloat(cs.paddingLeft) > 0) mitEinzug++;
      }
      el = el.parentElement;
    }
    return { sektionen, mitKante, mitEinzug };
  }, artId);
}

/** Linke Kanten und Breiten ALLER gerenderten Artikel-Textkörper der Seite. */
async function textkanten(page: Page): Promise<{ kanten: number[]; breiten: number[] }> {
  return page.evaluate(() => {
    const kanten = new Set<number>();
    const breiten = new Set<number>();
    document.querySelectorAll('article[id^="art-"] .max-w-normtext').forEach((d) => {
      const r = d.getBoundingClientRect();
      if (r.width > 0) { kanten.add(Math.round(r.left)); breiten.add(Math.round(r.width)); }
    });
    return { kanten: [...kanten].sort((a, b) => a - b), breiten: [...breiten].sort((a, b) => a - b) };
  });
}

test('ZGB Art. 684 (Tiefe 5): keine Gliederungslinie im Lesetext, EINE Textkante', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/ZGB#art-684', 'art-684');

  const k = await sektionsKanten(page, 'art-684');
  expect(k.sektionen, 'Art. 684 steckt in Gliederungs-Sektionen').toBeGreaterThan(0);
  expect(k.mitKante, 'KEINE Sektion trägt mehr eine vertikale Gliederungslinie').toBe(0);
  // 3a — die Einzug-Mechanik selbst ist fort (Entscheid David 29.8.2026).
  expect(k.mitEinzug, 'eine Gliederungs-Sektion trägt wieder einen Tiefen-Einzug').toBe(0);
  // 3b — und die Wirkung: ein Lesetext, eine Kante, eine Breite.
  const t = await textkanten(page);
  expect(t.kanten.length, 'kein Artikel-Textkörper gemessen').toBeGreaterThan(0);
  expect(t.kanten, `ZGB: mehr als EINE linke Textkante (${t.kanten.join('/')}px)`).toHaveLength(1);
  expect(t.breiten, `ZGB: mehr als EINE Textkörperbreite (${t.breiten.join('/')}px)`).toHaveLength(1);

  // Die Steuer-Attribute der alten Mechanik sind fort.
  await expect(page.locator('html')).not.toHaveAttribute('data-linien', /.*/);
  await expect(page.locator('.lc-leser').first()).not.toHaveAttribute('data-guide-auto', /.*/);
});

test('OR Art. 319 (Tiefe 4): keine Gliederungslinie, kein Schalter «Linien» im Ansicht-Menü', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/OR#art-319', 'art-319');

  expect((await sektionsKanten(page, 'art-319')).mitKante, 'OR ohne Gliederungslinie').toBe(0);
  // Der Erlass mit der TIEFSTEN Staffelung vor dem 29.8.2026 (sechs Kanten
  // 554…654 px @1440) — hier zeigt sich eine Rückkehr des Einzugs zuerst.
  const t = await textkanten(page);
  expect(t.kanten.length, 'kein Artikel-Textkörper gemessen').toBeGreaterThan(0);
  expect(t.kanten, `OR: mehr als EINE linke Textkante (${t.kanten.join('/')}px)`).toHaveLength(1);

  // Auch der KLICK über das Attribut, nicht über Rolle+Name — DERSELBE
  // Mechanismus wie oben: jeder Klick-Versuch löst die Rolle+Name-Abfrage über
  // 13 518 Knöpfe NEU auf. Beobachtet 17.8.2026 in einem Lauf unter 8-Worker-Last:
  // «locator.click: Test timeout of 30000ms exceeded · waiting for
  // getByRole('button', {name: 'Ansicht'})», 7/10.
  // EHRLICHE EINSCHRÄNKUNG ZUR BEWEISLAGE: dieser 7/10-Wert ist KEIN saubereres
  // A/B — auf derselben Maschine liefen gleichzeitig drei fremde
  // Agenten-Sessions (Worktrees `LexMetrik-fix`, `-krume`, `-uebersicht`), und
  // Wiederholungen kippten die Arm-Reihenfolge (18/20 gegen 16/20, danach 10/20
  // gegen 17/20). Belastbar ist allein die prozessinterne Messung mit 4×
  // CPU-Drossel, zweimal gefahren: Rolle+Name 28.2–29.1 s (5/5 über dem
  // 20-s-Budget) gegen Attribut 17.8–19.9 s (0/5 über). Diese Zeile folgt also
  // dem GEMESSENEN Mechanismus, nicht einer Rate ohne Bedingung (§0 Ziff. 3c).
  // Sachaussage unverändert; der zugängliche Name des Öffners ist weiter in
  // `leser-kopf-a9.e2e.ts`/`leser-kopf-g2b.e2e.ts` gedeckt.
  await page.locator(ANSICHT_OEFFNER).first().click();
  const gruppe = page.locator(ANSICHT_PANEL).first();
  await expect(gruppe).toBeVisible();
  await expect(gruppe.getByRole(SCHALTER_ROLLE, { name: 'Linien' })).toHaveCount(0);
});
