// @shard-gruppe: 1
// ═══ W2·6c-SYNOPSE-LESER · DER WORTLAUT VON DAMALS ══════════════════════════
//
// Die Fassungs-Rubrik sagte seit E3, WARUM sich ein Artikel geändert hat. Sie
// sagt jetzt auch, WAS sich geändert hat: zu jedem Punkt der Fassungsleiste
// den Wortlaut vorher neben dem Wortlaut nachher (FAHRPLAN-MATERIALIEN-
// VERZAHNUNG §11.5 (3), Daten aus E5/E6, PR #794).
//
// SECHS ZUSAGEN, je einzeln messbar:
//
//  (a) NICHTS LÄDT VOR DEM KLICK. Aufgeklappte Rubrik: NULL Abrufe unter
//      `/materialien/synopse/`. Erst «Alt/Neu» holt den Shard — genau EINEN,
//      den des geöffneten Erlasses, und auch für den zweiten Artikel keinen
//      zweiten (Auflage David 6.9.2026, §15).
//
//  (b) DER VERGLEICH ZEIGT DIE WÖRTER. DBG 5 lit. a zum 1.1.2025: aus «eine
//      Erwerbstätigkeit» wurde «eine selbstständige oder unselbstständige
//      Erwerbstätigkeit» — genau diese drei Wörter stehen als `<ins>` da, der
//      Rest des Satzes nicht. Und §7 steht im Fuss JEDER Karte: Stand beider
//      Fassungen, amtliche Quelle, Live-Link, Abrufdatum, Profil-ID.
//
//  (c) WO NICHTS IST, SAGT SIE DAS. Derselbe Artikel führt einen Punkt von
//      2013 — davor gibt es keinen maschinenlesbaren Volltext, und die Karte
//      sagt «erst für Stände ab 01.01.2021» statt zu schweigen (§8). Und die
//      Alt-Fassungen, die an keinem Punkt hängen (BGÖ 13: Wortlaut-Unterschied
//      ohne Fussnoten-Ereignis), stehen als eigener Abschnitt da.
//
//  (f) EINE LÜCKE DER QUELLE HEISST NICHT «AUFGEHOBEN». CHEMRRV Art. 9: die
//      amtlichen Konsolidierungen vom 1.5.2022 und 1.10.2022 führen die Artikel
//      4–24 nur in einem Änderungsanhang, ab 6.10.2022 wieder normal und
//      wortgleich. Die Karte sagt genau das — und NICHT «entfallen» (§8;
//      Gegenprüfungs-Befund A6 zu PR #798, W2·6c-ENTSTEHUNG-QUELLLUECKE).
//
//  (d) KEIN SPRUNG, KEIN ÜBERLAUF @320 px. Zwei Spalten werden dort zu einer;
//      die Artikel ÜBER dem geöffneten dürfen sich beim Aufbau nicht bewegen.
//
//  (e) TASTATUR. «Alt/Neu» ist ein echter Knopf mit `aria-expanded` und
//      `aria-controls` auf die Karte, die wirklich im DOM steht (WCAG 4.1.2).
//
// ROT ZU BEKOMMEN (§6.7) — je einzeln gefahren, Protokoll im PR-Body:
//  · in `EntstehungsBlock.tsx` die Bedingung `synOffen === null` aus dem
//    Lade-Effekt streichen (lädt dann beim Aufklappen)            ⇒ (a) rot
//  · in `SynopseKarte.tsx` `<ins>`/`<del>` durch `<span>` ersetzen ⇒ (b) rot
//  · dort den Satz für `vor_fenster` leeren                       ⇒ (c) rot
//  · in `src/index.css` `.lr8-syn-zeile` fest auf zwei Spalten zwingen
//    und `white-space: nowrap` setzen                             ⇒ (d) rot
//    (seit REST S2, 25.9.2026: dieselbe Form steht in `SynopseKarte.tsx`,
//    Konstante `S.zeile` — dort `md:` streichen und `whitespace-nowrap` setzen)
//  · am Griff `aria-expanded` weglassen                           ⇒ (e) rot
//  · in `synopse-run.ts` die Umbuchung auf `quelle_unvollstaendig`
//    auslassen (Shards neu erzeugen)                               ⇒ (f) rot
import { test, expect, type Page } from '@playwright/test';
import { fassungsMarke } from './helpers/fassungsRubrik';

// ── §6.3-DEKLARATION · S6 W1f (Entscheid David 24.9.2026, «die zeile soll ganz
// weg. infos sollen alle im blatt erscheinen») ────────────────────────────────
// Der Fassungsvergleich steht seither in der Klappzeile «Fassung dieses
// Artikels» im Reiter «Änderungen» des Erlass-Blatts. Die Sonde folgt dem Ort
// (`helpers/fassungsRubrik.ts`, Block `[data-v3-blatt-fassung="<token>"]`); ihre
// Zusagen bleiben Wort für Wort — nur das Register zählt (a) als ZUWACHS ab dem
// ersten Klick, weil das offene Blatt es für seine Reiter ohnehin holt.
/** Der Fassungs-Block eines Artikels im Blatt. */
const blockVon = (art: string) => `[data-v3-blatt-fassung="${art}"]`;

// DBG 5 ist der einzige Artikel im Bestand, der alle drei Schichten an EINEM
// Punkt trägt (gemessen 11.9.2026): Alt-Fassung ab 2021, erfasste Botschaft UND
// einen Entwurfs-Shard der Vorlage. Dazu ein Punkt von 2013 vor dem Fenster.
const ORT = '/gesetze/bund/DBG';
const ART = '5';
const BLOCK = blockVon(ART);
const GRIFF = `${BLOCK} [data-synopse-griff]`;
const KARTE = `${BLOCK} [data-synopse-karte]`;

async function oeffneRubrik(page: Page, ort = ORT, art = ART): Promise<void> {
  await page.goto(ort);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  const marke = await fassungsMarke(page.locator(`#art-${art}`), 20_000);
  await marke.click();
  await expect(page.locator(`${blockVon(art)} [data-historie-zeile]`)).toBeVisible();
}

/** Alle Abrufe zählen, die dieser Griff auslösen könnte. */
function abrufe(page: Page): { synopse: string[]; entwurf: string[]; register: string[] } {
  const gezaehlt = { synopse: [] as string[], entwurf: [] as string[], register: [] as string[] };
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('/materialien/synopse/')) gezaehlt.synopse.push(u);
    if (u.includes('/materialien/synopse-entwurf/')) gezaehlt.entwurf.push(u);
    if (u.includes('/materialien/register.json')) gezaehlt.register.push(u);
  });
  return gezaehlt;
}

test.describe('W2·6c-SYNOPSE-LESER · Fassungsvergleich am Artikel', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) aufgeklappt null Abrufe, erst «Alt/Neu» holt genau einen Shard', async ({ page }) => {
    const gezaehlt = abrufe(page);
    await oeffneRubrik(page);
    // Die Rubrik steht offen, die Entstehungs-Projektion ist unterwegs — und der
    // Synopse-Shard (DBG: 132 KB) trotzdem nicht angefasst.
    await page.waitForTimeout(1200);
    expect(gezaehlt.synopse, `vor dem Klick geladen: ${gezaehlt.synopse.join(' · ')}`).toHaveLength(0);
    expect(gezaehlt.entwurf, `Entwurf vor dem Klick geladen: ${gezaehlt.entwurf.join(' · ')}`).toHaveLength(0);
    const registerVorher = gezaehlt.register.length;

    // Playwright-Falle (Auflage): den Griff EINMAL auflösen und festhalten.
    const griffe = page.locator(GRIFF);
    await expect(griffe.first()).toBeVisible({ timeout: 10_000 });
    const ersterGriff = griffe.nth(0);
    await ersterGriff.click();
    await expect(page.locator(KARTE)).toHaveCount(1);
    await expect
      .poll(() => gezaehlt.synopse.length, { timeout: 10_000, message: 'der Shard wurde nie geholt' })
      .toBeGreaterThan(0);
    await page.waitForTimeout(600);
    expect(gezaehlt.synopse).toHaveLength(1);
    expect(gezaehlt.synopse[0]).toContain('/materialien/synopse/DBG.json');
    expect(gezaehlt.register.length - registerVorher, 'das 2,1-MB-Register ist nicht der Kanal dieser Karte').toBe(0);

    // Ein zweiter Punkt und ein zweiter Artikel holen NICHTS nach (gecachte
    // Promise). DBG 9 ist der nächste Artikel mit Fassungs-Rubrik — sie steht
    // nur, wo der Historie-Shard einen Eintrag führt (§8), nicht an jedem Artikel.
    await griffe.nth(1).click();
    await (await fassungsMarke(page.locator('#art-9'))).click();
    const zweiterGriff = page.locator(`${blockVon('9')} [data-synopse-griff]`).nth(0);
    await expect(zweiterGriff).toBeVisible({ timeout: 10_000 });
    await zweiterGriff.click();
    await page.waitForTimeout(800);
    expect(gezaehlt.synopse).toHaveLength(1);
  });

  test('(b) der Vergleich zeigt die geänderten Wörter — und seinen Zitat-Nachweis', async ({ page }) => {
    await oeffneRubrik(page);
    const griffe = page.locator(GRIFF);
    await expect(griffe.first()).toBeVisible({ timeout: 10_000 });
    await griffe.nth(0).click();
    const karte = page.locator(KARTE);
    await expect(karte).toHaveCount(1);
    await expect(karte).toContainText('Fassungsvergleich');
    // Beide Stände stehen im Kopf — nie nur einer (§7a).
    await expect(karte).toContainText(/Stand\s+16\.05\.2024 gegenüber\s+01\.01\.2025/);

    // Die drei eingefügten Wörter, und NUR sie.
    const zeile = karte.locator('[data-synopse-zeile="geaendert"]').first();
    await expect(zeile.locator('ins')).toContainText('selbstständige oder unselbstständige');
    // REST S2 (25.9.2026): Selektor zieht mit dem gelöschten Alt-Block
    // `.lr8-syn-text` auf den Sonden-Anker `data-synopse-text` um (§4b).
    await expect(zeile.locator('[data-synopse-text]').first())
      .toContainText('in der Schweiz eine Erwerbstätigkeit ausüben;');

    // §7 a–d im Fuss: Stand beider Fassungen, Quelle, Live-Link, Abruf, Profil.
    const fuss = karte.locator('[data-synopse-fuss]').first();
    // §6.3-DEKLARATION (Gegenprüfung PR #798, 12.9.2026): das DATENPROFIL ist gehoben
    // worden — `/2` → `/3` → `/4` (Auflagen A1/A2/A4/A5). Die Zusage dieser Zeile ist
    // unverändert «im Fuss steht, unter welchem Profil die Prüfsumme gebildet wurde»;
    // geprüft wird darum die Profil-ZEILE, nicht eine eingefrorene Nummer — die Nummer
    // selbst bewacht `check:entstehung` byte-genau gegen `NORM_PROFIL`.
    await expect(fuss).toContainText(/Normalisierung\s+entstehung-norm\/\d+/);
    await expect(fuss).toContainText(/Abruf\s+\d{2}\.\d{2}\.\d{4}/);
    await expect(fuss).toContainText('massgeblich bleibt');
    await expect(fuss.locator('a[href*="fedlex.admin.ch"]').first()).toBeVisible();

    // E6 · «stand das im Entwurf auch schon so?» — nur wo eine Vorlage erfasst ist.
    const entwurf = karte.locator('[data-synopse-entwurf]');
    await expect(entwurf).toHaveCount(1);
    await expect(entwurf).toContainText('Entwurf des Bundesrats');
    await expect(entwurf).toContainText('fga/2024/651');
  });

  test('(c) vor 2021 und ohne Fussnoten-Ereignis sagt die Karte genau das', async ({ page }) => {
    await oeffneRubrik(page);
    const griffe = page.locator(GRIFF);
    await expect(griffe.first()).toBeVisible({ timeout: 10_000 });
    // Der dritte Punkt von DBG 5 datiert auf den 1.1.2013 — vor dem Fenster.
    await griffe.nth(2).click();
    const karte = page.locator(KARTE);
    await expect(karte).toHaveCount(1);
    await expect(karte.locator('[data-synopse-lage="vor_fenster"]'))
      .toContainText(/Fassungsvergleich erst für Stände ab\s+01\.01\.2021/);

    // §6.3-DEKLARATION (Gegenprüfung PR #798, 12.9.2026): hier stand bis Profil `/2`
    // BGÖ Art. 13. Dieser Fall war ein FALSCHTREFFER — der «Wortlaut-Unterschied» war
    // eine Fussnote, die sich in EINER Fedlex-Generation zwischen Satzzeichen und
    // `</listIntroduction>` schob (Befund #796, Klasse 2). Seit `/3` bucht der Generator
    // ihn zu Recht nicht mehr, und BGÖ trägt korpusweit KEINEN `ohne_ereignis`-Block
    // mehr (gemessen 12.9.2026: 0). Die ZUSAGE ist unverändert; sie braucht nur einen
    // Artikel, an dem der Zustand wirklich vorkommt: DBG Art. 26 führt genau EINEN
    // solchen Block (Stand 2023-01-01, `public/materialien/synopse/DBG.json`) — ein
    // Wortlaut-Unterschied, den der amtliche Fussnoten-Apparat nicht führt. Er hängt an
    // keinem Punkt der Leiste und steht darum eigens da (§8).
    await oeffneRubrik(page, ORT, '26');
    const block = page.locator(blockVon('26'));
    const dbg26Griffe = block.locator('[data-synopse-griff]');
    await expect(dbg26Griffe.first()).toBeVisible({ timeout: 10_000 });
    await dbg26Griffe.nth(0).click();
    const abschnitt = block.locator('[data-entstehung-ohne-ereignis]');
    await expect(abschnitt).toHaveCount(1);
    await expect(abschnitt).toContainText('ohne Fussnoten-Ereignis im amtlichen Apparat');
    const ohneGriff = abschnitt.locator('[data-synopse-griff]').nth(0);
    await ohneGriff.click();
    await expect(abschnitt.locator('[data-synopse-ohne-ereignis]')).toContainText('kein Änderungs-Ereignis');
  });

  test('(f) Quelllücke: die Karte sagt «Quelle unvollständig», nicht «entfallen»', async ({ page }) => {
    // CHEMRRV Art. 9 ist einer von 22 Blöcken, die der Generator bis 12.9.2026 als
    // «entfallen» + «neu eingefügt» buchte, obwohl der Artikel nie aufgehoben war.
    await oeffneRubrik(page, '/gesetze/bund/CHEMRRV', '9');
    const block = page.locator(blockVon('9'));
    // Der Shard lädt erst auf Klick (Zusage (a)) — und damit auch diese Liste. Also
    // zuerst den Griff am Fassungspunkt, dann steht der Abschnitt da.
    const punktGriff = block.locator('[data-synopse-griff]').nth(0);
    await expect(punktGriff).toBeVisible({ timeout: 10_000 });
    await punktGriff.click();
    const abschnitt = block.locator('[data-entstehung-quellluecke]');
    await expect(abschnitt).toHaveCount(1, { timeout: 15_000 });
    await expect(abschnitt).toContainText('Stände, in denen die amtliche Quelle diesen Artikel nicht führt');

    const griff = abschnitt.locator('[data-synopse-griff]').nth(0);
    await griff.click();
    const karte = block.locator('[data-synopse-lage="quelle_unvollstaendig"]');
    await expect(karte).toHaveCount(1);
    const satz = karte.locator('[data-synopse-quellluecke]');
    await expect(satz).toContainText('Quelle unvollständig');
    await expect(satz).toContainText('01.05.2022');
    await expect(satz).toContainText('nur in einem Änderungsanhang');
    await expect(satz).toContainText('massgeblich bleibt');
    // Das Gegenteil der alten, falschen Aussage — und der Live-Link auf die
    // amtliche Fassung des betroffenen Stands (§7c).
    await expect(karte).not.toContainText('entfallen');
    await expect(karte.locator('a[href*="fedlex.admin.ch"]').first()).toBeVisible();
  });

  test('(d) @320 px: eine Spalte, kein Überlauf, kein Sprung der Artikel darüber', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await oeffneRubrik(page);
    const griffe = page.locator(GRIFF);
    await expect(griffe.first()).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(400);

    // NUR die Artikel ÜBER dem geöffneten: die Karte wächst nach unten in den
    // offenen Block hinein, und dass der nächste Artikel dabei nachrückt, ist
    // kein Layout-Sprung, sondern der Sinn eines Aufklapp-Blocks. Gemessen wird,
    // was der Leser gerade liest — und das steht darüber.
    //
    // §6.3-DEKLARATION (Gegenprüfung PR #798, 12.9.2026): gemessen wird seither die
    // DOKUMENT-Position (`rect.y + scrollY`), nicht die Viewport-Position. Grund, lokal
    // reproduziert: ein Klick FOKUSSIERT den Griff, und liegt der Griff auch nur knapp
    // unter der Falzkante, scrollt der Browser ihn sichtbar — dann wandern ALLE
    // Viewport-Werte um exakt denselben Betrag, ohne dass sich am Layout etwas ändert
    // (Sonde 12.9.2026: scrollY +16, art-1 Viewport −16, art-1 Dokument ±0; in der CI
    // dasselbe Muster mit 477 px, Lauf 34658704141). Die Viewport-Messung hätte damit
    // das Scrollen des Browsers als Layout-Sprung gemeldet — die Zusage «kein Sprung»
    // meint aber das Layout (CLS zählt Scroll-Verschiebungen ebenfalls nicht mit).
    // Die Schärfe bleibt: ein ECHTER Sprung verschiebt die Dokument-Position, und die
    // zweite Erwartung unten bindet jede Viewport-Verschiebung an genau den
    // Scroll-Betrag — eine Verschiebung ohne Scroll bleibt rot.
    const geometrie = () => page.evaluate(() => {
      const o: Record<string, number> = { scrollY: Math.round(window.scrollY) };
      for (const a of [...document.querySelectorAll('article[id^="art-"]')].slice(0, 4)) {
        o[`${a.id}_dokument`] = Math.round(a.getBoundingClientRect().y + window.scrollY);
        o[`${a.id}_viewport`] = Math.round(a.getBoundingClientRect().y);
      }
      return o;
    });
    const vorher = await geometrie();
    await griffe.nth(0).click();
    await expect(page.locator(KARTE)).toHaveCount(1);
    await page.waitForTimeout(500);
    const nachher = await geometrie();
    const dokument = (m: Record<string, number>) => Object.fromEntries(
      Object.entries(m).filter(([k]) => k.endsWith('_dokument')),
    );
    expect(dokument(nachher), 'die Artikel über dem geöffneten haben ihre Layout-Position verlassen')
      .toEqual(dokument(vorher));
    const scrollDelta = nachher.scrollY - vorher.scrollY;
    for (const [k, v] of Object.entries(vorher)) {
      if (!k.endsWith('_viewport')) continue;
      // Summe statt Vergleich mit `-scrollDelta`: bei 0 unterscheidet `Object.is`
      // zwischen 0 und -0, und das ist keine Aussage über die Seite.
      expect(nachher[k] - v + scrollDelta, `${k} ist um mehr verschoben, als der Browser gescrollt hat`)
        .toBe(0);
    }

    // Untereinander, nicht nebeneinander: eine Spalte im Raster.
    const spalten = await page.locator(`${KARTE} [data-synopse-zeile]`).first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(spalten, 'die Synopse steht bei 320 px zweispaltig').toBe(1);

    // DREI Messungen (Herleitung in `entstehung-karte-e3`): Seite, Kastenrand
    // und INHALT — die ersten beiden verschlucken einen echten Überlauf.
    const ueberlauf = await page.evaluate(() => {
      const breite = document.documentElement.clientWidth;
      const k = document.querySelector('[data-synopse-karte]');
      let innen = 0;
      let schuldig = '';
      for (const el of k ? [k, ...k.querySelectorAll('*')] : []) {
        const d = el.scrollWidth - el.clientWidth;
        if (d > innen) { innen = d; schuldig = el.className || el.tagName; }
      }
      return {
        seite: document.documentElement.scrollWidth - breite,
        karte: k ? Math.round(k.getBoundingClientRect().right - breite) : -1,
        innen, schuldig,
      };
    });
    expect(ueberlauf.seite, 'die Seite scrollt waagrecht').toBeLessThanOrEqual(1);
    expect(ueberlauf.karte, 'die Karte ragt aus dem Viewport').toBeLessThanOrEqual(1);
    expect(ueberlauf.innen, `Inhalt ragt aus «${ueberlauf.schuldig}»`).toBeLessThanOrEqual(1);
  });

  test('(e) Tastatur: Enter öffnet, aria sagt den Zustand und zeigt auf die Karte', async ({ page }) => {
    await oeffneRubrik(page);
    const griff = page.locator(GRIFF).nth(0);
    await expect(griff).toBeVisible({ timeout: 10_000 });
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
    await griff.focus();
    await page.keyboard.press('Enter');
    await expect(griff).toHaveAttribute('aria-expanded', 'true');

    const ziel = await griff.getAttribute('aria-controls');
    expect(ziel, 'kein aria-controls am geöffneten Griff').toBeTruthy();
    // Attribut-Selektor statt `#id`: `useId()` vergibt Namen mit Doppelpunkten.
    await expect(page.locator(`[id="${ziel}"]`)).toHaveCount(1);

    await page.keyboard.press('Enter');
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(KARTE)).toHaveCount(0);
  });
});
