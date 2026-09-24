// @shard-gruppe: 5
// W2·10-UI-NAV — R3 (zitierfähige Referenz), R5 (Rücksprung-Chip) und R7
// (Deep-Link-Skeleton). Läuft gegen `vite preview` (dist), wie die übrigen
// Reader-Specs. A9-DoD am Schluss: Bedienbarkeit (Tastatur/Touch/aria/Tap-Ziele)
// und Flüssigkeit unter CPU-Drossel 6× mit CLS-Beobachter.
import { test, expect, type Page } from '@playwright/test';
import { fehlerSammeln } from './helpers/fehlerSammeln';
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls';

// Der Reader liefert prerendertes Crawler-HTML → auf den Client-Takeover warten,
// bevor geprüft wird (Muster leser-kopf-g2b).
async function warteReader(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Ansicht' }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('article[id^="art-"]').first()).toBeVisible({ timeout: 20000 });
}

const chip = (page: Page) => page.getByRole('button', { name: /zurück zu/ });

// Die SPRUNG-Knöpfe des Gliederungs-Baums — und nur die. `[data-toc]` enthält
// ausserdem die Klapp-Chevrons und (unterhalb, `data-toc-kontext`) die
// «nebeneinander öffnen»-Knöpfe der Leitfall-Chips; beide tragen ein aria-label,
// der Sprung-Knopf trägt keines. Ohne diese Eingrenzung trifft `.last()` einen
// Leitfall-Chip, der gar nicht springt (Fehlgriff der ersten Fassung).
//
// `:visible` ist seit 7.8.2026 load-bearing und KEINE Abschwächung (QS-E2E-STABIL).
// Die Gliederung startet seit dem 5.8.2026 komplett zugeklappt (Entscheid David,
// SektionBaumTOC.tsx `STANDARD_OFFEN_TIEFE = 0`), die Kinder eines zugeklappten
// Astes bleiben aber im DOM: auf /gesetze/bund/BV sind das 30 von 39 Sprung-
// Knöpfen. `.last()` griff damit einen Knopf, den kein Nutzer klicken kann — und
// Playwright versuchte es bis zum 270-s-Budget (Shard 2/8 am 7.8.2026: 1 h 2 min).
// Der Produkt-Defekt dahinter — unsichtbar, aber bedienbar und in der Tab-Reihen-
// folge — ist im selben Schritt behoben; `:visible` bringt diesen Helfer auf die
// Aussage, die er immer meinte: ein Sprung-Ziel, das die Nutzerin auch anklicken
// kann. Geprüft wird unverändert dasselbe, und `.last()` bleibt der weitest
// entfernte Abschnitt.
// W2·19-GLIEDERUNG/S4 — deklarierte Selektor-Nachführung (Bau-Spec §3.3/§10,
// e2e-Freigabe David 8.8.2026): `:not([aria-label])` unterschied den Sprungknopf
// vom Chevron, weil NUR das Chevron ein `aria-label` trug. Seit S4 trägt auch der
// Sprungknopf eines — er muss es tragen: sein sichtbares Label ist auf zwei
// Zeilen geklammert (`line-clamp-2`, Labels bis 280 Zeichen), und ohne den vollen
// Text im zugänglichen Namen wäre der Rest für Screenreader still verloren (§8).
// Das trennscharfe Merkmal ist jetzt `aria-expanded`: das hat das Chevron (und
// nur das), weil es einen Auf-/Zu-Zustand ansagt. Geprüft wird unverändert
// dasselbe — ein sichtbarer, anklickbarer Sprungknopf einer Baumzeile.
// H4-UMHÄNGUNG (Flip 18.8.2026): `:not([aria-expanded])` trennt in V3 NICHTS
// mehr. Der Titel-Knopf trägt dort seinerseits `aria-expanded` — seit S4 klappt
// er einen geschlossenen Ast beim Sprung mit auf (`SektionBaumTOC`:
// `aria-expanded={hatKinder && titelKlapptAuf ? auf : undefined}`), und
// `titelKlapptAuf` setzt nur die V3-Leiste. Gemessen 18.8.2026 an BV @1440:
// `button:not([aria-expanded])` = 0 (V3) gegen 39 (V1) — der Locator lief in
// sein 90-s-Budget, ohne je etwas zu prüfen.
// Trennscharf in BEIDEN Hüllen ist `title`: der Titel-Knopf trägt ihn (den
// vollen Etikett-Text), das Chevron nicht (es hat nur `aria-label`
// «Auf-/Einklappen»). Gemessen: 39 Treffer in beiden Hüllen, davon 0 Chevrons.
// `:visible` bleibt unverändert load-bearing (s. o.).
const tocSprung = (page: Page) =>
  // §6.3-DEKLARATION (W2·24-R6c, P8): die Sprung-Zeile ist seither ein
  // `<a href="#art-…">`, wo sie eine Adresse hat, und nur sonst ein `<button>`
  // (SektionBaumTOC `TocZeile`). Der Selektor trifft BEIDE; die Absicht des
  // Falls — «die Sprung-Zeilen des Baums und nur die» — ist unverändert.
  page.locator('[data-toc] li[data-sektion-id] :is(a, button)[title]:visible');

// ── R3 · Die Kopie trägt den amtlichen Deep-Link ─────────────────────────────
test.describe('R3 — zitierfähige Referenz', () => {
  test('«Zitat»-Kopie trägt Fundstelle, Stand, Permalink UND die amtliche Fassung', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 1440, height: 900 });
    await warteReader(page, '/gesetze/bund/BV#art-8');
    await page.locator('#art-8').scrollIntoViewIfNeeded();
    // W2·26/Z6 (§6.3): die Aktionen werden erst bei Hover/Fokus/offener Rubrik
    // gerendert (Herleitung in `parts/Funktionszeile.tsx`); die Zusagen dieses
    // Falls — der amtliche Link steht am Artikel, und die Zitat-Kopie trägt ihn
    // — sind unverändert. Der Hover steht VOR der ersten Zusicherung.
    // S6 W1f (§6.3): die Aktionen stehen IMMER am Artikel — kein Hover mehr nötig.
    await expect(page.locator('#art-8 [data-artikel-aktionen]')).toBeVisible();
    // Der Artikel muss den amtlichen Link auch ANBIETEN — sonst prüfte der Test
    // eine Zeile, die es aus gutem Grund (§8) gar nicht geben darf.
    const amtlichLink = page.locator('#art-8').getByRole('link', { name: /Amtliche Fassung/ });
    await expect(amtlichLink).toHaveCount(1);
    const href = await amtlichLink.getAttribute('href');
    expect(href).toBeTruthy();

    await page.locator('#art-8').getByRole('button', { name: /Zitat kopieren:/ }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    // Bestand (B-6) unverändert …
    expect(clip).toContain('SR 101');
    expect(clip).toMatch(/\(Stand \d{2}\.\d{2}\.\d{4}\)/);
    expect(clip).toMatch(/abgerufen am \d{2}\.\d{2}\.\d{4}/);
    expect(clip).toContain('/gesetze/bund/BV#art-8');
    // … und neu die amtliche Quelle, ausdrücklich benannt und ZULETZT (§7:
    // massgeblich ist die amtliche Fassung, nicht unsere Projektion).
    expect(clip).toContain(`amtliche Fassung: ${href}`);
    expect(clip.indexOf('#art-8')).toBeLessThan(clip.indexOf('amtliche Fassung:'));
  });
});

// ── R5 · Rücksprung nach einem TOC-Sprung ────────────────────────────────────
test.describe('R5 — Rücksprung-Chip', () => {
  test('TOC-Sprung ⇒ Chip nennt die verlassene Stelle und führt exakt dorthin zurück', async ({ page }) => {
    test.slow();
    const fehler = fehlerSammeln(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await warteReader(page, '/gesetze/bund/BV');

    // Ein Stück weit hineinlesen, damit es überhaupt etwas zu verlassen gibt.
    // H4 (Flip 18.8.2026): danach 60 px WEITERSCHIEBEN. Ohne das landet Art. 8
    // mit seiner Oberkante genau auf der Bezugslinie, und «welcher Artikel wird
    // gerade gelesen» ist eine Grenzentscheidung — V1 (Kopf ~88 px) und V3
    // (Kopf 156 px) fielen dort auseinander (gemessen: Chip sagte «Art. 8»,
    // das Orakel unten rechnete «Art. 7»). Der Schubs macht die Antwort
    // EINDEUTIG, ohne die Aussage des Falls zu berühren.
    await page.locator('#art-8').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 60));
    await page.waitForTimeout(400);
    // Die Bezugslinie ist die Unterkante der klebenden Kopfzeile — was darunter
    // rutscht, liest niemand mehr. Sie wird GEMESSEN statt gesetzt: die 88 px,
    // die hier standen, waren die V1-Kopfhöhe und damit eine Hüllen-Konstante
    // in einem Test, der die Hülle gar nicht meint.
    const vorher = await page.evaluate(() => {
      const kopf = document.querySelector('[data-inhalt-kopf], [data-v3-kopf]');
      const bezug = kopf ? kopf.getBoundingClientRect().bottom : 88;
      const arts = document.querySelectorAll<HTMLElement>('article[id^="art-"]');
      let letzter = '';
      for (const el of arts) { if (el.getBoundingClientRect().top <= bezug) letzter = el.id; else break; }
      return { id: letzter, y: Math.round(window.scrollY) };
    });
    expect(vorher.id, 'vor dem Sprung wird ein Artikel gelesen').not.toBe('');
    expect(vorher.y).toBeGreaterThan(200);

    // Sprung aus dem Gliederungs-Baum — bewusst ein WEIT entfernter Abschnitt.
    await tocSprung(page).last().click();
    await page.waitForTimeout(1200); // Settle-Fenster des Chips (700 ms) + Sprung

    const c = chip(page);
    await expect(c).toBeVisible();
    // Das Etikett kommt WÖRTLICH aus dem Anker der verlassenen Stelle …
    const label = await page.evaluate((id) => {
      const a = document.querySelector<HTMLElement>(`#${CSS.escape(id)} a[href="#${CSS.escape(id)}"]`);
      return a?.textContent?.trim() ?? '';
    }, vorher.id);
    expect(label, 'Anker-Etikett lesbar').not.toBe('');
    await expect(c).toHaveText(new RegExp(`zurück zu ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));

    // … der Sprung selbst hat die Adresse NICHT angefasst (LM-202).
    expect(new URL(page.url()).hash).toBe('');

    // Rückweg: der Klick führt an die verlassene Stelle, und der Chip verfällt.
    await c.click();
    await page.waitForTimeout(400);
    const nachher = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    }, vorher.id);
    expect(nachher, 'verlassener Artikel steht wieder im oberen Lesebereich').not.toBeNull();
    // ── §6.3-DEKLARATION (W2·24, 6.9.2026) · DIE LINIE WIRD GEMESSEN ────────
    // Hier stand `< 140` — eine HÜLLEN-KONSTANTE, genau von der Art, die der
    // Kommentar 30 Zeilen weiter oben schon einmal aus diesem Fall entfernt
    // hat («die 88 px, die hier standen, waren die V1-Kopfhöhe»). Die 140
    // stammen aus einem Kopf ohne Arbeitsleiste; mit ihr (R2, `--app-reiter-h`
    // = 34 px) liegt der Landepunkt eines Sprungs bei `--nt-stick` = 198 px,
    // und GENAU 198 hat der Rückweg gemessen — der Sprung war also exakt
    // richtig, die Latte falsch geeicht.
    // Gemessen wird darum, was die Zusage IST: der verlassene Artikel steht
    // wieder an seinem Landepunkt, also am `scroll-margin-top`, den auch
    // `scrollIntoView` benutzt (dieselbe Quelle wie in `leser-spy-w25d`).
    // Die Toleranz von 24 px ist die Schrifthöhe einer Artikel-Überschrift und
    // damit die Grenze, ab der ein Leser die Abweichung sähe — sie ist ENGER
    // als jede der bisherigen absoluten Latten (140 px Spielraum → 24 px).
    const landepunkt = await page.evaluate(() => {
      const el = document.querySelector('[id^="art-"]');
      return el ? Math.round(parseFloat(getComputedStyle(el).scrollMarginTop) || 0) : 0;
    });
    expect(Math.abs((nachher as number) - landepunkt),
      `verlassener Artikel steht ${nachher} px statt am Landepunkt ${landepunkt} px`)
      .toBeLessThanOrEqual(24);
    await expect(c).toHaveCount(0);
    // Auch der Rückweg ist eine Scroll-Bewegung, keine Navigation.
    expect(new URL(page.url()).hash).toBe('');
    expect(fehler).toEqual([]);
  });

  test('Chip verfällt von selbst — und ein Sprung, der nichts bewegt, erzeugt keinen neuen', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await warteReader(page, '/gesetze/bund/BV');
    await page.locator('#art-8').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const ziel = tocSprung(page).last();
    await ziel.click();
    const c = chip(page);
    await expect(c).toBeVisible({ timeout: 8000 });
    // Lebensdauer 8 s ab Anzeige; grosszügiges Fenster für langsame Runner.
    // Er bleibt nicht als Dauer-Element im Blickfeld stehen.
    await expect(c).toHaveCount(0, { timeout: 25000 });

    // Und jetzt der Leerlauf-Fall: DERSELBE Abschnitt noch einmal. Wir stehen
    // bereits dort, der Sprung bewegt nichts — ein Chip würde eine Rückkehr an
    // die Stelle versprechen, an der man schon steht (§8).
    await ziel.click();
    await page.waitForTimeout(2000);
    await expect(chip(page)).toHaveCount(0);
  });

  // Regression (CI-Rot 30870125582 → Produkt-Defekt, nicht Testartefakt):
  // Der Verfall des ALTEN Chips leerte die Registry bedingungslos und löschte
  // damit das noch schwebende Einschwing-Fenster eines inzwischen vorgemerkten
  // NEUEN Sprungs — wer im ~700-ms-Fenster kurz vor Ablauf erneut sprang, verlor
  // seinen Rückweg ganz. Lokal nachgestellt: Abstand 2000 ms → Chip da,
  // 7300 ms → Chip FEHLTE, 7800 ms → Chip da. Der Test setzt genau in dieses
  // Fenster; die Wartezeit ist darum load-bearing und keine Bequemlichkeit.
  test('Zweiter Sprung kurz vor Ablauf des ersten Chips bekommt trotzdem einen', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await warteReader(page, '/gesetze/bund/BV');
    await page.locator('#art-8').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    await tocSprung(page).last().click();
    await expect(chip(page)).toBeVisible({ timeout: 8000 });
    // Kurz VOR die 8-s-Frist zielen (ab Sichtbarkeit gerechnet, nicht ab Klick).
    await page.waitForTimeout(7300);
    await tocSprung(page).first().click();
    await expect(chip(page), 'neuer Sprung behält seinen Rückweg').toBeVisible({ timeout: 8000 });
  });
});

// ── R7 · Deep-Link-Einsprung ─────────────────────────────────────────────────
test.describe('R7 — Deep-Link-Skeleton', () => {
  test('Einsprung über #art-… zeigt die Zielansage statt des Dokumentanfangs', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    // Drosseln, damit der Einsprung so lang dauert wie im Prod-Re-Audit gemessen
    // (1.8–2.8 s Dokumentanfang) — ungedrosselt wäre das Fenster kaum greifbar,
    // und der Test bewiese nichts über den Fall, für den das Overlay gebaut ist.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    // Das Overlay ist FLÜCHTIG — es lebt genau so lange wie der Einsprung dauert.
    // Eine Messung NACH `toBeVisible()` trifft darum je nach Maschine schon das
    // Nichts (gemessen: Overlay bei t=0 vollständig da, 300 ms später weg). Ein
    // nachgelagerter Poll ist hier konstruktionsbedingt ein Wettlauf, kein Test.
    // Darum dasselbe Mittel, das die Specs für Layout-Shifts nutzen: ein
    // rAF-Sampler ab Dokumentstart protokolliert JEDEN Frame mit; ausgewertet
    // wird hinterher aus dem Protokoll. Deterministisch statt zufallsabhängig.
    //
    // §6.3-DEKLARATION (W2·29 S5, 23.9.2026) · STANDZEIT PER DOM, NICHT PER FRAME.
    // CI-Lauf 35461250166 (Shard 1/4, 19.9.2026) scheiterte mit «Overlay-Frames
    // 2»: der Sampler zählt nur GEMALTE Frames, und während der Reader seinen
    // Text in langen Tasks aufbaut, malt der 2-vCPU-Runner keine — das Overlay
    // stand, der Zähler sah es zweimal. Gemessen wurde die Bildrate, nicht die
    // Zusage. Die Standzeit kommt darum aus dem DOM (MutationObserver: erstes
    // Erscheinen bis Verschwinden der Ansage); die Frames bleiben für die
    // Deckungs-Prüfung (mindestens einer). Rot-Beweis im Commit-Body.
    await page.addInitScript(() => {
      interface P { t: number; top: number; bottom: number; vh: number; scrollY: number }
      const w = window as unknown as { __r7: P[]; __r7an: number | null; __r7aus: number | null };
      w.__r7 = []; w.__r7an = null; w.__r7aus = null;
      const steht = () => Array.from(document.querySelectorAll('[role="status"]'))
        .some((e) => /Springe zu/.test(e.textContent ?? ''));
      new MutationObserver(() => {
        const s = steht();
        if (s && w.__r7an === null) w.__r7an = performance.now();
        if (!s && w.__r7an !== null && w.__r7aus === null) w.__r7aus = performance.now();
      }).observe(document, { childList: true, subtree: true, characterData: true });
      const tick = () => {
        const el = Array.from(document.querySelectorAll('[role="status"]'))
          .find((e) => /Springe zu/.test(e.textContent ?? ''));
        if (el) {
          const r = el.getBoundingClientRect();
          w.__r7.push({
            t: Math.round(performance.now()), top: Math.round(r.top),
            bottom: Math.round(r.bottom), vh: window.innerHeight,
            scrollY: Math.round(window.scrollY),
          });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // BV statt OR (CI-Kosten): das OR ist der grösste Erlass im Korpus, dieser
    // Test brauchte damit auf dem 2-vCPU-Runner 175–275 s und riss einmal das
    // 270-s-Budget. Bewiesen wird hier der EINSPRUNG von aussen, nicht ein
    // bestimmter Erlass — und auch auf BV entsteht der Reader erst im Client
    // (Overlay-Standzeit unter 6×-Drossel gemessen: 1673 ms). Die Aussage bleibt,
    // die Rechnung für den Shard wird ein Vielfaches kleiner.
    await page.goto('/gesetze/bund/BV#art-8');
    const overlay = page.getByRole('status').filter({ hasText: /Springe zu/ });
    // Es verschwindet von selbst, sobald der Sprung gelandet ist.
    await expect(overlay).toHaveCount(0, { timeout: 25000 });

    interface P { t: number; top: number; bottom: number; vh: number; scrollY: number }
    const { proben, an, aus } = await page.evaluate(() => {
      const w = window as unknown as { __r7: P[]; __r7an: number | null; __r7aus: number | null };
      return { proben: w.__r7, an: w.__r7an, aus: w.__r7aus };
    });
    // Es stand überhaupt — und zwar spürbar lang, nicht für einen Frame.
    expect(an, 'Overlay ist erschienen').not.toBeNull();
    expect(aus, 'Overlay ist wieder verschwunden').not.toBeNull();
    const dauerMs = Math.round((aus as number) - (an as number));
    expect(dauerMs, `Overlay-Standzeit ${dauerMs} ms`).toBeGreaterThan(300);
    expect(proben.length, `Overlay-Frames ${proben.length}`).toBeGreaterThan(0);
    // …und in JEDEM dieser Frames deckte es den Lesebereich ab. Genau das ist die
    // Behauptung von R7: statt des Dokumentanfangs steht dort die Zielansage.
    const schlecht = proben.filter((p) => !(p.top < p.vh * 0.4 && p.bottom > p.vh * 0.5));
    expect(schlecht.length, `Frames ohne Deckung: ${JSON.stringify(schlecht.slice(0, 3))}`).toBe(0);
    // … und dann steht das Ziel wirklich oben (der Sprung ist nicht bloss
    // «weg-animiert» worden).
    const top = await page.evaluate(() => {
      const el = document.getElementById('art-8');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    expect(top, 'Ziel im DOM').not.toBeNull();
    // §6.3-DEKLARATION (W2·24, 6.9.2026) — dieselbe Umstellung wie bei R5 oben
    // und aus demselben Grund: `< 220` war die Kopfhöhe VOR der Arbeitsleiste
    // (R2, +34 px). Gemessen wurde 222 px — zwei Pixel über einer Latte, die
    // nichts über den Einsprung aussagt. Geprüft wird jetzt, dass das Ziel an
    // seinem Landepunkt steht (`scroll-margin-top`), mit derselben 24-px-
    // Toleranz; das ist enger als die alte Latte und wandert mit dem Kopf.
    const landepunkt = await page.evaluate(() => {
      const el = document.querySelector('[id^="art-"]');
      return el ? Math.round(parseFloat(getComputedStyle(el).scrollMarginTop) || 0) : 0;
    });
    expect(Math.abs((top as number) - landepunkt),
      `Ziel steht ${top} px statt am Landepunkt ${landepunkt} px`).toBeLessThanOrEqual(24);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  });

  test('Ohne Anker (normaler Aufruf) erscheint KEIN Overlay', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await warteReader(page, '/gesetze/bund/BV');
    await expect(page.getByRole('status').filter({ hasText: /Springe zu/ })).toHaveCount(0);
  });

  test('Eigenes Scrollen beendet das Overlay sofort (keine Falle)', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await page.goto('/gesetze/bund/BV#art-8'); // BV statt OR — Shard-Kosten, s. o.
    const overlay = page.getByRole('status').filter({ hasText: /Springe zu/ });
    await expect(overlay).toBeVisible({ timeout: 10000 });
    await page.mouse.wheel(0, 300); // Nutzer übernimmt
    await expect(overlay).toHaveCount(0, { timeout: 5000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  });

  // ── B1 (§9-Bug-Check zu PR #431) ───────────────────────────────────────────
  // TOTER ANKER. Alt-Permalinks überleben Aufhebungen und Umnummerierungen —
  // genau die Zitate, die dieses Feature erzeugt, liegen jahrelang in fremden
  // Akten. Zeigt so einer ins Leere, kann die Lande-Bedingung NIE eintreten:
  // das Overlay stand bis zur 6000-ms-Kappe als deckender Schleier über der
  // ganzen Lesespalte und versprach eine Landung, die es nicht geben kann (§8) —
  // schlechter als der Zustand ohne das Feature. Sobald der Reader steht, das
  // Ziel aber fehlt, ist die Antwort bekannt: aufhören.
  test('Toter Anker: Overlay gibt auf, sobald der Reader steht — kein 6-s-Schleier', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    // Sampler ab Dokumentstart (Muster wie oben): protokolliert je Frame, ob das
    // Overlay steht und ob der Reader seine Artikel schon gerendert hat.
    await page.addInitScript(() => {
      interface P { t: number; overlay: boolean; artikel: number }
      const w = window as unknown as { __b1: P[] };
      w.__b1 = [];
      const tick = () => {
        const el = Array.from(document.querySelectorAll('[role="status"]'))
          .some((e) => /Springe zu/.test(e.textContent ?? ''));
        w.__b1.push({
          t: Math.round(performance.now()), overlay: el,
          artikel: document.querySelectorAll('article[id^="art-"]').length,
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await page.goto('/gesetze/bund/BV#art-9999');
    const overlay = page.getByRole('status').filter({ hasText: /Springe zu/ });
    // H4 (Flip 18.8.2026): ZUERST warten, bis der Reader wirklich da ist. Die
    // Auswertung unten liest die Frame-Proben; `toHaveCount(0)` allein ist als
    // Gatter untauglich, weil es schon bei t≈0 erfüllt ist — solange das Overlay
    // noch gar nicht erschienen ist. Der Fall lief damit auf die Vorbedingung
    // «Reader hat Artikel gerendert» und meldete `undefined` statt einer
    // Sachaussage. Gemessen am Flip-Stand: Overlay 624–2247 ms, erste Artikel
    // 2247 ms — beide Hüllen tragen das Feature, nur die Messung war ein Rennen.
    await expect(page.locator('article[id^="art-"]').first()).toBeAttached({ timeout: 40000 });
    // Grosszügig über die alte 6000-ms-Kappe hinaus warten: WÜRDE der Schleier
    // wieder so lange stehen, liefe dieser Test in die Assertion unten, nicht in
    // einen Timeout — die Fehlermeldung nennt dann die gemessene Standzeit.
    await expect(overlay).toHaveCount(0, { timeout: 25000 });

    interface P { t: number; overlay: boolean; artikel: number }
    const proben: P[] = await page.evaluate(() => (window as unknown as { __b1: P[] }).__b1);
    const mitOverlay = proben.filter((p) => p.overlay);
    const standzeit = mitOverlay.length
      ? mitOverlay[mitOverlay.length - 1].t - mitOverlay[0].t : 0;
    const ersterMitArtikeln = proben.find((p) => p.artikel > 0);
    expect(ersterMitArtikeln, 'Reader hat Artikel gerendert').toBeTruthy();
    const letzterOverlay = mitOverlay.length ? mitOverlay[mitOverlay.length - 1].t : 0;
    const nachRender = mitOverlay.filter((p) => p.t > (ersterMitArtikeln as P).t);
    const ueberhang = nachRender.length
      ? nachRender[nachRender.length - 1].t - (ersterMitArtikeln as P).t : 0;
    const lage = `Überhang ${ueberhang} ms · Standzeit ${standzeit} ms · Artikel ab `
      + `${(ersterMitArtikeln as P).t} ms · letztes Overlay-Frame ${letzterOverlay} ms`;

    // ── Was hier NICHT geprüft wird, und warum (CI-Rot 30862485462) ───────────
    // Die erste Fassung prüfte zusätzlich die GESAMT-Standzeit gegen 5000 ms. Das
    // war ein Messfehler meinerseits: die Standzeit ist im Kern die LADEZEIT des
    // Readers und damit eine Eigenschaft der Maschine, nicht des Features. Sie
    // skaliert linear mit der Drossel — lokal gemessen 1673 ms (6×), 2814 ms
    // (10×), 3708 ms (14×), auf dem 2-vCPU-Runner 5660/5648/5730 ms in drei
    // Läufen. Eine Verteilungsgrösse gegen einen absoluten Schwellwert zu prüfen
    // erzeugt genau dieses Rot: die Zahl misst den Runner, nicht den Fix.
    //
    // Der Fix wird von den beiden folgenden Grössen gemessen, und die sind
    // maschinen-unabhängig, weil sie am Prüf-Takt hängen statt an der Ladezeit.

    // (1) Das Overlay stand noch, ALS der Reader ankam. Ohne diese Bedingung
    // könnte der Test auch dann grün sein, wenn die harte 6000-ms-Kappe das
    // Overlay beendet hätte — dann bewiese er nichts über den Fix. Lokal über
    // 6×/10×/14× durchgehend erfüllt.
    expect(
      letzterOverlay >= (ersterMitArtikeln as P).t,
      `Overlay lebte beim Artikel-Render (sonst hat die Kappe beendet, nicht der Fix) — ${lage}`,
    ).toBe(true);

    // (2) …und gab dann binnen eines Wimpernschlags auf. Gebunden an den Prüf-
    // Takt (120 ms) plus Render-Commit, darum flach über die Drossel-Stufen:
    // 152/265/326 ms lokal, auf CI unter 1000 ms. Budget 1500 ms lässt dem
    // langsamsten Runner Luft und hält zum Defekt (gemessen 4243 ms) noch immer
    // Faktor 2.8 Abstand — die Regression fiele weiterhin klar durch.
    expect(ueberhang, `Overlay-Überhang nach Artikel-Render — ${lage}`).toBeLessThan(1500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  });
});

// ── A11y-Wächter zum Vorfall vom 7.8.2026 (QS-E2E-STABIL) ────────────────────
// Der Defekt, der Shard 2/8 eine Stunde kostete, war KEIN Testartefakt: die
// Gliederung klappt ihre Äste nur per grid-rows auf 0 Höhe und schneidet den Rest
// mit overflow-hidden ab. Die Knöpfe darin blieben vollwertige Bedienelemente —
// eigene Box, in der Tab-Reihenfolge, im Accessibility-Baum. Gemessen auf
// /gesetze/bund/BV nach dem Zuklapp-Entscheid vom 5.8.: 39 Sprung-Knöpfe, davon
// 30 unsichtbar, und ALLE 39 fokussierbar. Wer mit Tastatur oder Screenreader
// navigiert, lief also durch 30 Bedienelemente, die es für das Auge nicht gibt.
//
// Dieser Wächter prüft die Klasse, nicht den Einzelfall: KEIN unsichtbarer Knopf
// der Gliederung darf erreichbar sein — gleich ob Sprung-Knopf oder Klapp-Chevron,
// gleich welche Technik ihn versteckt. Damit fällt derselbe Fehler künftig als
// gezielte a11y-Aussage durch statt als 270-s-Hänger (§17: die Lehre wird ein Tor,
// keine Prosa). Einmal rot gezeigt (§6.7): gegen das alte Markup (`grid-rows-[0fr]`
// ohne `invisible`) meldet er «37 von 48» — Sprung-Knöpfe UND Klapp-Chevrons.
test('A11y-Wächter: kein unsichtbarer Gliederungs-Knopf liegt in der Tab-Reihenfolge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await warteReader(page, '/gesetze/bund/BV');

  const befund = await page.evaluate(() => {
    // Sichtbare Restfläche NACH allen abschneidenden Vorfahren. `checkVisibility`
    // taugt hier NICHT: es kennt display/visibility/opacity, aber KEIN Clipping
    // durch overflow — und genau damit versteckt die Gliederung ihre Äste. Ein
    // Wächter auf checkVisibility wäre gegen das defekte Markup grün geblieben
    // (ausprobiert am 7.8.2026), also ein Tor, das nicht scheitern kann (§6.7).
    const restflaeche = (el: HTMLElement): number => {
      const r = el.getBoundingClientRect();
      let l = r.left, o = r.top, re = r.right, u = r.bottom;
      for (let a = el.parentElement; a; a = a.parentElement) {
        const st = getComputedStyle(a);
        if (st.overflowX === 'visible' && st.overflowY === 'visible') continue;
        const ar = a.getBoundingClientRect();
        l = Math.max(l, ar.left); o = Math.max(o, ar.top);
        re = Math.min(re, ar.right); u = Math.min(u, ar.bottom);
      }
      return Math.max(0, re - l) * Math.max(0, u - o);
    };

    const knoepfe = Array.from(
      // R6c/P8: s. o. — Sprung-Zeile ist `a`, Chevron bleibt `button`.
      document.querySelectorAll<HTMLElement>('[data-toc] li[data-sektion-id] :is(a, button)'),
    );
    const unsichtbarAberErreichbar: string[] = [];
    for (const el of knoepfe) {
      el.focus();
      // Nicht fokussierbar ⇒ nicht in der Tab-Reihenfolge ⇒ in Ordnung.
      if (document.activeElement !== el) continue;
      // `focus()` scrollt in Chromium selbst an die Stelle. Wer JETZT noch keine
      // Restfläche hat, ist auch durch Scrollen nicht erreichbar — der Fokus steht
      // auf einem Bedienelement, das für das Auge nicht existiert. Ein Knopf, der
      // bloss unterhalb des Gliederungs-Sichtbands liegt, wird durch dieses
      // Scrollen sichtbar und zählt darum korrekt NICHT als Treffer.
      if (restflaeche(el) > 0) continue;
      unsichtbarAberErreichbar.push((el.textContent ?? '').trim().slice(0, 40) || '(Chevron)');
    }
    return { gesamt: knoepfe.length, treffer: unsichtbarAberErreichbar };
  });

  // Der Baum steht überhaupt — sonst prüfte der Wächter die leere Menge und wäre
  // ein Tor, das nicht scheitern kann (§6.7).
  expect(befund.gesamt, 'der Gliederungs-Baum ist gerendert').toBeGreaterThan(10);
  expect(
    befund.treffer,
    `unsichtbar, aber per Tab erreichbar: ${befund.treffer.length} von ${befund.gesamt} — `
      + JSON.stringify(befund.treffer.slice(0, 5)),
  ).toEqual([]);
});

// ── A9-DoD: Bedienbarkeit + Flüssigkeit unter CPU-Drossel ────────────────────
test('A9 — Chip: Tastatur/aria/Tap-Ziel, und der TOC-Sprung bleibt unter 6× Drossel CLS-frei', async ({ page }) => {
  test.slow();
  const fehler = fehlerSammeln(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await warteReader(page, '/gesetze/bund/BV');
  await page.locator('#art-8').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Warmlauf ungedrosselt beendet — danach messen (Messfenster-Politik cls.ts).
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await clsBeobachtenInstallieren(page, true, true);

  await tocSprung(page).last().click();
  await page.waitForTimeout(1400);
  const c = chip(page);
  await expect(c).toBeVisible();

  // aria + Tap-Ziel in EINEM Zugriff. Der Chip ist flüchtig (8 s), darum wird
  // zwischen «er steht» und «wir messen ihn» so wenig Wanduhr wie möglich
  // verbraucht — jeder Playwright-Roundtrip zählt auf einem gesättigten Runner.
  const gemessen = await c.evaluate((el) => ({
    hoehe: Math.round(el.getBoundingClientRect().height),
    imLiveBereich: !!el.closest('[aria-live="polite"]'),
  }));
  // Er erscheint ohne Fokuswechsel → er muss angesagt werden.
  expect(gemessen.imLiveBereich, 'Chip liegt in einer aria-live-Region').toBe(true);
  // Tap-Ziel ≥ 44 px (WCAG 2.5.8 / R6-Mass) — er wird auf dem Daumen bedient.
  expect(gemessen.hoehe, `Chip-Höhe ${gemessen.hoehe}px`).toBeGreaterThanOrEqual(44);

  // Tastatur DIREKT danach, am selben Chip: per Tab erreichbar, mit Enter
  // auslösbar. Die Zwischenfassung holte sich hier einen zweiten, «frischen»
  // Chip, um der 8-s-Frist auszuweichen — das war der falsche Weg (CI-Rot
  // 30870125582) und hat den Test bloss von einer Zeitkopplung in die nächste
  // gehängt. Richtig ist, zwischen «Chip steht» und «wir bedienen ihn» so wenig
  // Wanduhr wie möglich zu verbrauchen: ein evaluate, dann sofort focus.
  await c.focus();
  await expect(c).toBeFocused();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await expect(c).toHaveCount(0);

  const { cls, bericht } = await clsAuslesen(page);
  // Chip und Overlay liegen ausserhalb des Layoutflusses (fixed/absolute) — sie
  // dürfen NICHTS verschieben. Budget wie die übrigen A9-Tests.
  expect(cls, `CLS ${cls} — ${bericht}`).toBeLessThan(0.05);
  expect(fehler).toEqual([]);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});
