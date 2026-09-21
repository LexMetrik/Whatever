// @shard-gruppe: 7
// W2·10-UI-NAV/R1 + R2 — «Finden im Gesetz», NEUGESCHRIEBEN für
// W2·19-GLIEDERUNG/S8 (Bau-Spec fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md §4,
// §10; Freigabe David 8.8.2026: «e2e-Anpassungen in deklarierten Commits
// erlaubt», Entscheid (a) — und Entscheid (c) für die Sache selbst).
//
// ─── WAS SICH ÄNDERT UND WARUM (deklariert, nicht beiläufig) ─────────────────
// R1 prüfte bis S8 einen Vertrag, den es nicht mehr gibt: «gemeldete Zahl ==
// DOM-sichtbare Fundstellen», gemessen an einer Lesespalte, die im Suchmodus
// nur die Treffer-Artikel zeigte. Seit S8 bleibt die Lesespalte vollständig,
// die Trefferliste steht in der Leiste, und der Zähler ist DATENSEITIG (§4.4):
//   1. «N Artikel · M Fundstellen» zählt den Erlass über alle sechs Feldklassen,
//      unabhängig von Ansicht-Schaltern.
//   2. Jeder Nicht-Fliesstext-Treffer trägt einen Herkunfts-Badge; bei
//      `data-fussnoten="aus"` mit dem Zusatz «(ausgeblendet)».
//   3. Gemalt wird nur, was malbar ist ⇒ «gemalte ≤ gezählte», nicht Gleichheit.
// Diese drei Sätze prüft die Datei jetzt. R2 (Bottom-Sheet, Quickjump) ist
// sachlich unverändert und nur auf einen leichten Erlass umgezogen.
//
// ─── §17-WURZELFIX DES FLAKE-HERDS (Messbedingung mitgenannt) ────────────────
// BEFUND, der zur Neuschrift führt (Kopf der Vorfassung, Messung 8.8.2026):
// alle sieben R1-Suchfälle scheiterten im CI-Lauf 31220026058 im ERSTVERSUCH an
// `[data-treffer-leiste]` (>20 s), jeder Retry grün. Die Signatur war
// «element(s) not found» und traf einen Desktop-OR-Suchfall ausnahmslos dann,
// wenn er NICHT der erste Test seines frischen Chromium-Workers war. Lokal (bis
// 20× CPU-Drossel, vier OR-Vorladungen im selben Browser) liess sich der
// Fehlschlag NICHT auslösen — er braucht die CI-Umgebung. Wurzel also: der
// ZWEITE schwere OR-Reader je Worker, nicht die Zahl gerenderter Treffer.
//
// Zwei Konsequenzen, beide hier eingebaut:
//  (a) MECHANIK LÄUFT AUF EINEM LEICHTEN ERLASS. BGFA: 40 Artikel, 10
//      Gliederungsknoten, 18 Fussnoten — trägt jede Fläche, die geprüft wird
//      (Baum, Trefferliste, Badges, Fussnoten-Toggle, Sheet), ohne den zweiten
//      schweren Reader je Worker. OR kommt genau EINMAL vor, als letzter Fall
//      der Datei, und nur für den Beweis, der ohne Grösse sinnlos wäre.
//  (b) JEDE DOM-MESSUNG IST EIN POLL, keine einmalige Lesung. Die belegte
//      Flake-Familie dieses Bestands sind einmalige `evaluate`-Lesungen ohne
//      Wartung; `expect.poll` misst dieselbe Aussage, wartet aber, statt zu
//      raten. Die Budgets bleiben bei 20 s — Anheben wäre Maskierung.
// ─── H4-UMHÄNGUNG (Flip 18.8.2026, Kontaktbogen H4 §7) ──────────────────────
// R1 lief unverändert grün gegen V3 (gemessen: alle sieben S8-Fälle plus der
// OR-Perf-Beweis). R2 nicht — dort steckt die EINE Änderung, die Pos. 4 gemacht
// hat: V1 trug ZWEI Felder («Im Gesetz suchen» + «Zu Artikel springen»), V3
// trägt EINES, das beides tut. Gemessen 18.8.2026 an BGFA @390: im Sheet liegt
// in V1 `Zu Artikel springen`, in V3 `Im Gesetz suchen oder zu einer Bestimmung
// springen` — dieselbe Stelle, ein Feld statt zwei.
//
// Was daraus folgt, Fall für Fall:
//  · Sheet-Fall: `getByRole('textbox', {name:'Zu Artikel springen'})` wird zum
//    Feld des Sheets. Die AUSSAGE («das Sprungfeld steht ZUOBERST, über dem
//    Baum») bleibt Wort für Wort dieselbe.
//  · Quickjump-Fall: die ehrliche Ablehnung eines unbekannten Artikels sagt V3
//    nicht mehr über `role="alert"`, sondern als sichtbaren Satz in der
//    Trefferliste — gemessen: «Kein Artikel gefunden für «Art. 99999».». Der
//    geprüfte §8-Sachverhalt ist unverändert; der Fall greift jetzt den Satz.
//    OFFENER BEFUND, gemeldet statt stillschweigend gefixt: die V1-Meldung war
//    eine Live-Region und wurde angesagt, die V3-Meldung ist es nicht.
//  · «Desktop-TOC-Kopf trägt denselben Baustein (§5)» ist GELÖSCHT.
//    NICHTTRAGE-NACHWEIS: `leser-v3-suchfeld-ueberall.e2e.ts` (a) prüft «JE
//    Pane genau EIN sichtbares Feld» und (c) «@1440 mit eingeklappter
//    Gliederung bleibt es da» — das ist dieselbe §5-Aussage, nur strenger
//    (nicht «zwei Bausteine sind derselbe», sondern «es gibt nur einen»).
//  · A9-DoD: das mobile Such-ICON (A35) gibt es in V3 nicht mehr — gemessen
//    @390: 0 Knöpfe «Im Gesetz suchen», das Feld steht offen im Kopf. Der
//    Öffnungs-Schritt entfällt darum; gemessen wird unverändert CLS 0 über
//    Suche, Sprünge und Sheet.
import { test, expect, type Page } from '@playwright/test';
import { fehlerSammeln } from './helpers/fehlerSammeln';
import { LESER_SUCHFELD_NAME } from './helpers/leserBeschriftung';

test.describe.configure({ timeout: 120_000 });

const inGesetzSuche = (page: Page) => page.getByRole('searchbox', { name: LESER_SUCHFELD_NAME });
const leiste = (page: Page) => page.locator('[data-treffer-leiste]');
const liste = (page: Page) => page.locator('[data-treffer-liste]');
const sheet = (page: Page) => page.locator('[data-gliederung-sheet]');

/** Leichter Referenz-Erlass der Mechanik (s. Kopf, (a)). */
const LEICHT = '/gesetze/bund/BGFA';
/** Begriff mit Treffern im Fliesstext UND im Randtitel (Badge «Randtitel»). */
const BEGRIFF = 'Berufsregeln';
/** Begriff, dessen Treffer im FUSSNOTEN-Apparat liegen (Badge «Fussnote»). */
const BEGRIFF_FN = 'Fassung';

/**
 * Unabhängiges Orakel für die MALBARE Menge (§0/2: der Test darf die Regel
 * nicht aus der Implementierung ableiten). Es zählt, was im Wortlaut der
 * Lesespalte wirklich markierbar ist:
 *   · nur innerhalb von `article[id^="art-"]`,
 *   · ohne `[data-such-meta]` (Bedienung: Zitat/Link, Verweis-Chips,
 *     Rechtsprechungs-Zeile, Historie-Slot),
 *   · ohne Fussnoten-MARKER (Verweiszeichen, kein Wortlaut — dieselben zwei
 *     Merkmale, mit denen index.css sie beim Schalter «Fussnoten aus» ausblendet),
 *   · ohne `display:none`-Teilbäume.
 * Der Vertrag von S8 lautet: diese Zahl ist eine TEILMENGE der datenseitig
 * gemeldeten — nie mehr.
 */
async function malbareFundstellen(page: Page, begriff: string): Promise<number> {
  return page.evaluate((b) => {
    const wurzel = document.querySelector('#lc-lesespalte');
    if (!wurzel) return -1;
    const nadel = b.toLowerCase();
    let n = 0;
    for (const art of wurzel.querySelectorAll('article[id^="art-"]')) {
      const w = document.createTreeWalker(art, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (node.nodeType === 1) {
            const el = node as Element;
            const marker = el.hasAttribute('data-fn-marker')
              || (el.tagName === 'BUTTON' && (el.getAttribute('aria-label') ?? '').startsWith('Fussnote'));
            if (el.hasAttribute('data-such-meta') || marker) return NodeFilter.FILTER_REJECT;
            return getComputedStyle(el).display === 'none'
              ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      for (let t = w.nextNode(); t; t = w.nextNode()) {
        const hay = (t.nodeValue ?? '').toLowerCase();
        let ab = 0;
        for (;;) { const i = hay.indexOf(nadel, ab); if (i < 0) break; n++; ab = i + nadel.length; }
      }
    }
    return n;
  }, begriff);
}

/** Gemeldete Fundstellen-Zahl aus dem Listenkopf (datenseitig, §4.4 Ziff. 1). */
async function gemeldet(page: Page): Promise<number> {
  const t = await leiste(page).innerText();
  return Number(t.match(/(\d+)\s+Fundstelle/)?.[1] ?? -1);
}

/** Zahl aus «i/n» der Positionsanzeige. */
/**
 * Laufende Fundstelle und Gesamtzahl — aus BEIDEN Hüllen.
 *
 * §6.3-DEKLARATION (Ä103, 18.8.2026): V3 schreibt seit der Säuberung
 * «Fundstelle 3 von 17», die Ist-Hülle weiter «3/17». Gemessen am Live-Stand
 * stand vor der ersten Navigation «–/88» — ein Bruch, dessen Zähler fehlt, und
 * @390 zweizeilig im Kasten. Die neue Form nennt die Einheit und setzt vor dem
 * ersten Sprung die ehrliche **0** statt eines Gedankenstrichs.
 * Der Helfer liest darum ZAHLEN, nicht ein Trennzeichen: er zieht die beiden
 * Zahlen aus dem Text, egal ob «/» oder «von» dazwischen steht. Damit misst er
 * in beiden Hüllen dieselbe Sache — die Prüfaussage ist unverändert.
 */
async function position(page: Page): Promise<{ i: number; n: number }> {
  const t = await page.locator('[data-treffer-position]').innerText();
  const zahlen = t.match(/\d+/g)?.map(Number) ?? [];
  // V1 vor dem ersten Sprung: «–/17» ⇒ nur EINE Zahl. Das ist dieselbe Aussage
  // wie die V3-Null, in der alten Schreibweise.
  return zahlen.length >= 2 ? { i: zahlen[0], n: zahlen[1] } : { i: 0, n: zahlen[0] ?? 0 };
}

/** Grösse der gemalten Highlight-Menge (CSS Custom Highlight API). */
const gemalt = (page: Page) => page.evaluate(() => {
  const reg = (globalThis as unknown as { CSS?: { highlights?: Map<string, { size: number }> } }).CSS?.highlights;
  return reg?.get('lc-such-treffer')?.size ?? 0;
});

/** Reader öffnen und auf den ersten Artikel warten (EIN Ort für das Budget). */
async function oeffneLeser(page: Page, pfad: string, breite = 1440, hoehe = 900) {
  await page.setViewportSize({ width: breite, height: hoehe });
  await page.goto(pfad);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  // B9 (Bug-Check §9 zu S8) — SIDECAR-RACE, deklarierte Härtung, KEIN
  // Assertion-Change (§6.3): `#art-1` steht, sobald der Snapshot da ist; der
  // Suchindex speist sich aber ZUSÄTZLICH aus dem parallel geladenen
  // Struktur-Sidecar (Randtitel, Gliederungspfad). Wer dazwischen misst, sieht
  // eine halbe Datenlage — der Zähler für «Berufsregeln» springt am BGFA von 6
  // auf 17, und weil fünf Fälle ihn EINMALIG einfrieren, gab das ein 20-s-Rot
  // mit grünem Retry: genau die Flake-Klasse, die die Neuschrift dieser Datei
  // per §17 schliessen sollte.
  // GEWARTET WIRD AUF `[data-sek]` (Sektionskopf im FLIESSTEXT), NICHT auf
  // `[data-sektion-id]` (Gliederungs-Zeile in der Leiste): die Leiste ist
  // breitenabhängig: bei Mobil-Viewport lebt sie im Bottom-Sheet und ist
  // ungemountet, solange das Sheet zu ist — ein Wartepunkt dort hängt in genau
  // den R2-Fällen, die das Sheet erst öffnen wollen (hier beim Bau gemessen).
  // Der Sektionskopf im Fliesstext speist sich aus demselben Sidecar, steht in
  // jeder Breite und ist damit das breitenneutrale Signal.
  await page.locator('[data-sek]').first().waitFor({ timeout: 20_000 });
}

// ── CLS-Beobachter, GESCOPT auf die R1/R2-Flächen (Reader-Wurzel `.lc-leser`,
// Gliederungs-Sheet, Trefferliste). Grund (§0/3 «Verteilung statt Einzelwert»,
// Nullprobe 4.8.2026): auf /gesetze/bund/BV @390 unter 6× Drossel fällt schon
// OHNE JEDE Interaktion ein input-freier Shift von ~0.00157 an — Quelle ist der
// rechte Bedien-Cluster der TOPBAR, nicht der Reader; der Wert war zwischen
// Nullprobe und Interaktionslauf byte-identisch. Fremde Shifts werden
// mitprotokolliert, aber nicht dieser Bau-Einheit zugerechnet.
async function clsBeobachten(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __cls: number; __clsQuellen: string[]; __clsFremd: number; __clsFremdQ: string[] };
    w.__cls = 0; w.__clsQuellen = []; w.__clsFremd = 0; w.__clsFremdQ = [];
    const eigen = (n: Element | null | undefined) =>
      !!n?.closest('.lc-leser, [data-gliederung-sheet], [data-treffer-liste]');
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const s = e as unknown as { value: number; hadRecentInput: boolean; sources?: { node?: Element | null }[] };
        if (s.hadRecentInput) continue;
        const quellen = s.sources ?? [];
        const namen = quellen.map((q) => q.node
          ? `${q.node.tagName}${q.node.id ? `#${q.node.id}` : ''}.${String(q.node.className).slice(0, 60)}`
          : '(ohne Knoten)');
        // Ohne Attribution konservativ als EIGEN werten (nie stillschweigend fallen lassen).
        if (quellen.length === 0 || quellen.some((q) => eigen(q.node))) {
          w.__cls += s.value; w.__clsQuellen.push(...namen);
        } else {
          w.__clsFremd += s.value; w.__clsFremdQ.push(...namen);
        }
      }
    }).observe({ type: 'layout-shift' });
  });
}
const clsLesen = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { __cls: number; __clsQuellen: string[]; __clsFremd: number; __clsFremdQ: string[] };
  return { cls: w.__cls, quellen: w.__clsQuellen, fremd: w.__clsFremd, fremdQ: w.__clsFremdQ };
});

test.describe('S8 — Trefferliste in der Leiste, Lesespalte vollständig', () => {
  // ── §6.3-UMSTELLUNG D38 (David 7.9.2026) ──────────────────────────────────
  // Der Titel hiess «Die Liste steht in Zone B des [data-toc] und ersetzt dort
  // den Baum». Genau das ist der Befund, den David am 7.9.2026 beanstandet hat:
  // «die suchresultate … sollen nicht in der gliederung erscheinen sondern den
  // gesetzestext ersetzen». Die Liste liegt seither über der LESESPALTE, der
  // Baum bleibt stehen. UNVERÄNDERT geprüft wird alles, was S8 wirklich
  // zusagte: genau EINE Liste, jeder Eintrag mit Label/Zahl/Ausschnitt, der
  // Kopf-Zähler deckungsgleich mit der Summe — und vor allem, dass die
  // LESESPALTE VOLLSTÄNDIG BLEIBT (Entscheid David (c) 8.8.2026). Der letzte
  // Punkt ist unter D38 mehr wert als zuvor, nicht weniger: er schliesst aus,
  // dass die Liste den Text aushängt statt ihn zu überlagern.
  test('Die Liste liegt über der Lesespalte, der Baum bleibt — der Gesetzestext bleibt ganz', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await oeffneLeser(page, LEICHT);

    // Ausgangslage: Baum da, keine Liste, voller Text.
    await expect(page.locator('[data-sektion-id]').first()).toBeVisible({ timeout: 20_000 });
    await expect(liste(page)).toHaveCount(0);
    const artikelVorher = await page.locator('article[id^="art-"]').count();
    expect(artikelVorher, 'BGFA-Volltext steht vor der Suche').toBeGreaterThan(30);

    await inGesetzSuche(page).fill(BEGRIFF);
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });

    // GENAU EINE Liste, und sie liegt über der Lesespalte (D38).
    await expect(liste(page)).toHaveCount(1);
    await expect(liste(page).locator('xpath=ancestor::*[@data-v3-treffer-spalte]')).toHaveCount(1);
    // D38: der Baum tritt NICHT mehr zurück — er steht während der Suche da …
    await expect(page.locator('[data-toc] [data-sektion-id]').first()).toBeVisible();
    // … und die LESESPALTE bleibt vollständig (Entscheid David (c) 8.8.2026):
    // die Zahl der Artikel im Wortlaut ändert sich durch die Suche nicht mehr.
    await expect.poll(async () => page.locator('article[id^="art-"]').count(), { timeout: 20_000 })
      .toBe(artikelVorher);

    // Jeder Eintrag nennt Artikel-Label, Fundstellenzahl und Textausschnitt.
    const eintraege = liste(page).locator('[data-treffer-artikel]');
    await expect.poll(async () => eintraege.count(), { timeout: 20_000 }).toBeGreaterThan(0);
    const zahlen = await eintraege.evaluateAll(
      (els) => els.map((e) => Number(e.getAttribute('data-fundstellen-zahl'))));
    expect(zahlen.every((n) => Number.isInteger(n) && n > 0), `Fundstellen je Artikel: ${zahlen}`).toBe(true);
    // Die Summe der Einträge deckt sich mit dem Kopf-Zähler (EINE Quelle, §5).
    expect(await gemeldet(page), 'Kopf-Zähler vs. Summe der Einträge')
      .toBe(zahlen.reduce((a, b) => a + b, 0));
    // Ausschnitt mit hervorgehobenem Begriff (Entscheid c: «mit Textausschnitten»).
    await expect(liste(page).locator('.lc-such-ausschnitt mark').first()).toBeVisible();

    // Suche verlassen ⇒ Liste weg, Baum unverändert da, Highlight weg.
    await inGesetzSuche(page).fill('');
    await expect(liste(page)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-toc] [data-sektion-id]').first()).toBeVisible({ timeout: 20_000 });
    await expect.poll(async () => gemalt(page), { timeout: 20_000 }).toBe(0);
    expect(fehler).toEqual([]);
  });

  test('§4.4 — der Zähler ist datenseitig, und gemalt wird höchstens, was gezählt ist', async ({ page }) => {
    await oeffneLeser(page, LEICHT);
    await inGesetzSuche(page).fill(BEGRIFF);
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });

    const gezaehlt = await gemeldet(page);
    expect(gezaehlt, 'gemeldete Fundstellen').toBeGreaterThan(0);

    // (1) Die MALBARE Menge im Wortlaut ist eine Teilmenge der gezählten —
    //     nicht mehr Gleichheit (§4.4 Ziff. 3): Gliederungspfad, Bild-Alt und
    //     nachrangige Randtitel werden gezählt, aber nie gemalt.
    await expect.poll(async () => malbareFundstellen(page, BEGRIFF), { timeout: 20_000 })
      .toBeLessThanOrEqual(gezaehlt);
    // (2) … und die tatsächlich gesetzte Highlight-Menge erst recht (sie deckt
    //     nur das Sichtband, §4.5 artikelweise on demand).
    await expect.poll(async () => gemalt(page), { timeout: 20_000 }).toBeLessThanOrEqual(gezaehlt);

    // (3) Der Zähler hängt NICHT an der Ansicht: derselbe Wert bei
    //     ein- und ausgeschaltetem Fussnoten-Apparat. Genau das war mit dem
    //     alten Gleichheits-Vertrag unmöglich.
    await page.evaluate(() => { document.documentElement.dataset.fussnoten = 'aus'; });
    await expect.poll(async () => gemeldet(page), { timeout: 20_000 }).toBe(gezaehlt);
    await page.evaluate(() => { document.documentElement.dataset.fussnoten = 'an'; });
    await expect.poll(async () => gemeldet(page), { timeout: 20_000 }).toBe(gezaehlt);
  });

  test('§4.5 — was ins Sichtband scrollt, leuchtet mit (artikelweises Highlight)', async ({ page }) => {
    // Der Beweis für den IntersectionObserver-Pfad, und zwar OHNE Sprung: der
    // Sprung malt sein Ziel selbst, er würde die Frage also nicht beantworten
    // (§6.7 — ein Tor, das nicht scheitern kann, ist gefährlicher als keines).
    // Hier wird nur GESCROLLT.
    await oeffneLeser(page, LEICHT);
    await inGesetzSuche(page).fill(BEGRIFF);
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });

    const token = await liste(page).locator('[data-treffer-artikel]').first()
      .getAttribute('data-treffer-artikel');
    await page.locator(`#art-${token}`).scrollIntoViewIfNeeded();
    await expect.poll(async () => gemalt(page), { timeout: 20_000 }).toBeGreaterThan(0);

    // Und wieder weg vom Treffer: die Markierung bleibt nicht als Karteileiche
    // an einem Artikel hängen, den niemand mehr sieht.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () => gemalt(page), { timeout: 20_000 }).toBe(0);
  });

  test('§4.4 — Herkunfts-Badges sagen, warum ein Artikel trifft, und wann die Stelle ausgeblendet ist', async ({ page }) => {
    await oeffneLeser(page, LEICHT);
    await inGesetzSuche(page).fill(BEGRIFF_FN);
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });

    // ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ──────────────────
    // Der Fall schaltete `data-fussnoten` — das Attribut gibt es nicht mehr, und
    // den Zustand «der ganze Apparat ist aus» auch nicht (verlustfrei). Die
    // Badge-Frage lautet seither «sind die ÄNDERUNGS-Fussnoten gedämpft?», wahr
    // in den Stellungen «fassung» und «aus». Die geprüfte AUSSAGE ist
    // unverändert: der Badge sagt es ausdrücklich, statt dass die Ansicht beim
    // Sprung still umgeschaltet würde (§4.4 Ziff. 2, §8). Gedreht ist nur die
    // Reihenfolge — die VORGABE ist «fassung», also steht der Zusatz zuerst da.
    const badges = liste(page).locator('[data-treffer-badge]');
    await expect.poll(async () => badges.count(), { timeout: 20_000 }).toBeGreaterThan(0);
    // «Fassung» trifft im BGFA in ÄNDERUNGS-Fussnoten ⇒ Badge mit Zusatz.
    await expect(badges.filter({ hasText: 'Fussnote (ausgeblendet)' }).first())
      .toBeVisible({ timeout: 20_000 });
    // Und der Badge ist SICHTBARER Text, nicht nur ein `title` (Touch/Screenreader).
    await expect(liste(page)).toContainText('(ausgeblendet)');

    // Stellung «Fussnoten»: der Apparat steht vollständig ⇒ Badge ohne Zusatz.
    await page.evaluate(() => { document.documentElement.dataset.vermerke = 'fussnoten'; });
    await expect(badges.filter({ hasText: /^Fussnote$/ }).first()).toBeVisible({ timeout: 20_000 });
    await expect(badges.filter({ hasText: 'Fussnote (ausgeblendet)' })).toHaveCount(0, { timeout: 20_000 });
    // Und zurück — zweiseitig, sonst wäre die Zusicherung mit «der Zusatz steht
    // immer da» erfüllbar (§6.7).
    await page.evaluate(() => { document.documentElement.dataset.vermerke = 'aus'; });
    await expect(badges.filter({ hasText: 'Fussnote (ausgeblendet)' }).first())
      .toBeVisible({ timeout: 20_000 });
  });

  test('↑↓ springt zyklisch durch die Fundstellen (Tastatur + 44-px-Tap-Ziele)', async ({ page }) => {
    await oeffneLeser(page, LEICHT);
    await inGesetzSuche(page).fill(BEGRIFF);
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });

    const vor = page.locator('[data-treffer-vor]');
    const zurueck = page.locator('[data-treffer-zurueck]');
    await expect(page.locator('[data-treffer-position]')).toBeVisible({ timeout: 20_000 });
    await expect(vor).toBeVisible({ timeout: 20_000 });

    // A9-DoD Tap-Ziele: beide Knöpfe mindestens 44×44 px.
    for (const knopf of [vor, zurueck]) {
      const box = await knopf.boundingBox();
      expect(box!.width, 'Tap-Ziel Breite').toBeGreaterThanOrEqual(44);
      expect(box!.height, 'Tap-Ziel Höhe').toBeGreaterThanOrEqual(44);
    }

    // Vor der ersten Navigation steht keine laufende Stelle (§8, nichts
    // Erfundenes). Ä103 (18.8.2026): V3 schreibt das als «Fundstelle 0 von n»,
    // V1 als «–/n» — dieselbe Aussage, zwei Schreibweisen. Geprüft wird die
    // AUSSAGE über `position()`, nicht das Trennzeichen.
    await expect.poll(async () => (await position(page)).i, { timeout: 20_000 }).toBe(0);
    await vor.click();
    await expect.poll(async () => (await position(page)).i, { timeout: 20_000 }).toBe(1);
    await vor.click();
    await expect.poll(async () => (await position(page)).i, { timeout: 20_000 }).toBe(2);
    await zurueck.click();
    await expect.poll(async () => (await position(page)).i, { timeout: 20_000 }).toBe(1);
    // Zyklisch: von der ersten zurück auf die letzte.
    await zurueck.click();
    await expect.poll(async () => { const p = await position(page); return p.i === p.n; }, { timeout: 20_000 }).toBe(true);
    // Tastatur: die Knöpfe sind echte <button> und per Enter bedienbar.
    await vor.focus();
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await position(page)).i, { timeout: 20_000 }).toBe(1);
    // Der Sprung markiert seinen Ziel-Artikel im Wortlaut (kein DOM-Umbau).
    await expect.poll(async () => page.locator('article.lc-ziel-blink').count(), { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test('Ein Treffer-Klick springt in den vollständigen Text — und lässt die Suche stehen (§4.5)', async ({ page }) => {
    await oeffneLeser(page, LEICHT);
    const artikelVorher = await page.locator('article[id^="art-"]').count();
    await inGesetzSuche(page).fill(BEGRIFF);
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });

    const ersterEintrag = liste(page).locator('[data-treffer-artikel]').first();
    const token = await ersterEintrag.getAttribute('data-treffer-artikel');
    await ersterEintrag.getByRole('button').first().click();

    // Ziel steht im Sichtbereich, der Wortlaut ist unverändert vollständig …
    await expect(page.locator(`#art-${token}`)).toBeInViewport({ timeout: 20_000 });
    await expect.poll(async () => page.locator('article[id^="art-"]').count(), { timeout: 20_000 })
      .toBe(artikelVorher);
    // … und die Suche lebt weiter: Feld gefüllt, Markierung gesetzt, Weg zur
    // Liste benannt.
    // §6.3-UMSTELLUNG D38: hier stand «Liste da». Über dem Text darf sie nach
    // dem Sprung nicht stehenbleiben — sie verdeckte genau den Wortlaut, in den
    // der Klick geführt hat. Was die Zeile schützte (die Suche überlebt den
    // Sprung), ist unverändert geprüft: Feld, Markierung und der Ein-Klick-Weg
    // zurück über die Zähler-Zeile.
    await expect(inGesetzSuche(page)).toHaveValue(BEGRIFF);
    await expect(liste(page)).toHaveCount(0);
    await expect(page.locator('[data-v3-treffer-weg]')).toBeVisible();
    await expect.poll(async () => gemalt(page), { timeout: 20_000 }).toBeGreaterThan(0);
  });

  test('Ohne aktive Suche kein Zähler, keine Tasten, kein Highlight — Normtext-DOM unverändert', async ({ page }) => {
    await oeffneLeser(page, LEICHT);
    // Signatur des WORTLAUTS: Artikel-Id + Textlänge OHNE die
    // `[data-such-meta]`-Teilbäume. Diese Ausklammerung ist keine Aufweichung,
    // sondern die Bedingung dafür, dass die Aussage überhaupt eine ist: unter
    // dem Artikel laufen idle geladene Shards nach (Rechtsprechungs-Bezüge,
    // Fassungs-Historie) und verlängern seinen Text — im ersten Lauf gemessen
    // art-1 197 → 243 Zeichen, ohne jede Beteiligung der Suche. Der Test würde
    // sonst das Nachladen messen statt den Suchmodus. Genau diese Nachlade-
    // Flächen tragen seit S8 `data-such-meta` (sie sind Referenzschicht, kein
    // Gesetzestext), also gibt es dafür bereits die richtige Marke.
    //
    // ── NACHTRAG 19.9.2026 · §0 Ziff. 2b: ERGÄNZT, nicht nachgeführt ─────────
    // Der Absatz oben bleibt Wort für Wort stehen; er war für seinen Stand
    // richtig. Was er NICHT abdeckt, hat die Signatur seit D40 (7.9.2026) hart
    // rot fallen lassen — Flake-Buchung 8.9.2026, dann zweimal HART am
    // 19.9.2026 (Läufe 35445618485 / 35446174293, je Shard 4/4, auch im Retry).
    //
    // GEMESSENE WURZEL (lokal deterministisch nachgestellt, indem der
    // Historie-Shard bis NACH der `vorher`-Messung angehalten wurde, 6×
    // CPU-Drossel): sechs Artikel wuchsen um exakt 27 Zeichen —
    //   art-2 2989→3016 · art-7 1006→1033 · art-8 1154→1181 ·
    //   art-10_a 444→471 · art-12 1819→1846 · art-15 625→652
    // (byte-gleich mit dem CI-Log). Der Zusatz ist
    //   «FassungGilt seit 01.07.2025» (art-2), «…01.01.2007» (art-7/12/15),
    //   «…23.01.2023» (art-8), «…01.01.2011» (art-10_a) — je 27 Zeichen,
    // gerendert von `ArtikelHistorieZeile` (`parts/ArtikelHistorie.tsx`) im
    // DRUCK-Wrapper `[data-hist-druck]` (`parts/ArtikelLeser.tsx`,
    // `hidden print:block`). Betroffen ist genau die Artikelmenge mit Eintrag
    // in `public/normtext/historie/BGFA.json` (2, 7, 8, 10_a, 12, 15 innerhalb
    // der ersten 25) — der Shard wird IDLE geladen und trifft auf einem
    // langsamen Runner erst nach der `vorher`-Messung ein.
    //
    // KEIN SUCH-RÜCKSTAND, also kein App-Defekt: der Wrapper ist am Bildschirm
    // in JEDER Vermerke-Stellung `display:none`, und der Such-Walker der App
    // überspringt nicht gerenderte Teilbäume ohnehin (`istGerendert`,
    // `src/pages/gesetz-leser/suchHighlight.ts`) — gemalt, gezählt und
    // angesprungen wird dort nie etwas. `data-such-meta` fehlt dem Wrapper
    // folgerichtig; es hätte an dieser Stelle keinen Leser.
    //
    // DER FEHLER LAG IM TEST, und zwar als ASYMMETRIE zu seinen eigenen
    // Nachbarn: `malbareFundstellen` (oben in dieser Datei) und der Walker der
    // App schneiden `display:none`-Teilbäume ab, `signatur()` als einzige
    // nicht — sie mass damit eine Fläche, die die Suche gar nicht erreichen
    // kann. Die Zeile unten schliesst genau diese Lücke.
    //
    // DIE AUSSAGE BLEIBT SCHARF (§6.3): ein echter Rückstand im sichtbaren
    // Wortlaut fällt unverändert auf — gemessen mit eingebauter Mutation
    // (Textknoten « RUECKSTAND» an `#art-2 p` nach dem Suchzyklus): art-2
    // 1610→1621, Test rot. Und versteckte die Suche sichtbaren Wortlaut, SÄNKE
    // die Zahl — auch das ist rot.
    const signatur = () => page.evaluate(() => {
      const arts = [...document.querySelectorAll('article[id^="art-"]')].slice(0, 25);
      const wortlaut = (a: Element) => {
        let n = 0;
        const w = document.createTreeWalker(a, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
          acceptNode(k) {
            if (k.nodeType !== 1) return NodeFilter.FILTER_ACCEPT;
            const el = k as Element;
            if (el.hasAttribute('data-such-meta')) return NodeFilter.FILTER_REJECT;
            // 19.9.2026 (s. Nachtrag): dieselbe Regel wie in
            // `malbareFundstellen` und in `istGerendert` der App.
            return getComputedStyle(el).display === 'none'
              ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
          },
        });
        for (let t = w.nextNode(); t; t = w.nextNode()) n += (t.nodeValue ?? '').length;
        return n;
      };
      return arts.map((a) => `${a.id}|${wortlaut(a)}`).join('~');
    });
    const vorher = await signatur();
    await expect(leiste(page)).toHaveCount(0);
    await expect(page.locator('[data-treffer-vor]')).toHaveCount(0);

    await inGesetzSuche(page).fill(BEGRIFF);
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });
    await page.locator('[data-treffer-vor]').click();
    await expect.poll(async () => gemalt(page), { timeout: 20_000 }).toBeGreaterThan(0);

    await inGesetzSuche(page).fill('');
    await expect(leiste(page)).toHaveCount(0, { timeout: 20_000 });
    await expect.poll(async () => gemalt(page), { timeout: 20_000 }).toBe(0);
    // Der Wortlaut-Baum ist derselbe wie vor der Suche (reine Render-Schicht).
    await expect.poll(async () => signatur(), { timeout: 20_000 }).toBe(vorher);
  });
});

test.describe('R2 — Mobile Gliederung als volles Bottom-Sheet', () => {
  test('Sheet ist unten angeschlagen, füllt die Höhe, trägt «Sie sind hier» + Quickjump', async ({ page }) => {
    const fehler = fehlerSammeln(page);
    await oeffneLeser(page, LEICHT, 390, 844);

    await page.getByRole('button', { name: /Gliederung/ }).first().click();
    await expect(sheet(page)).toBeVisible({ timeout: 20_000 });

    // Bottom-Sheet: unten am Viewport verankert (Daumenzone) und deutlich höher
    // als der frühere 60-vh-Drawer, der oben klebte.
    const box = (await sheet(page).boundingBox())!;
    expect(Math.abs(box.y + box.height - 844), 'Sheet ist unten angeschlagen').toBeLessThan(2);
    expect(box.height, 'volle Höhe der Daumenzone').toBeGreaterThan(844 * 0.7);

    // aria: echter modaler Dialog mit Namen.
    await expect(sheet(page)).toHaveAttribute('role', 'dialog');
    await expect(sheet(page)).toHaveAttribute('aria-modal', 'true');
    await expect(sheet(page)).toHaveAttribute('aria-label', 'Gliederung');

    // «Sie sind hier» ist da und benennt die Leseposition (nichts Erfundenes).
    await expect(page.locator('[data-sie-sind-hier]')).toBeVisible();
    await expect(page.locator('[data-sie-sind-hier]')).toContainText('Sie sind hier');

    // Quickjump steht ZUOBERST (über dem Baum) — in V3 ist es das EINE Feld,
    // das sucht und springt (Pos. 4).
    const feld = sheet(page).getByRole('searchbox');
    await expect(feld).toBeVisible();
    const feldBox = (await feld.boundingBox())!;
    const baumBox = (await sheet(page).getByRole('list').first().boundingBox())!;
    expect(feldBox.y, 'Quickjump über dem Gliederungsbaum').toBeLessThan(baumBox.y);

    // Schliessen-Knopf ist ein 44-px-Tap-Ziel.
    const zu = page.getByRole('button', { name: 'Gliederung schliessen' });
    const zuBox = (await zu.boundingBox())!;
    expect(zuBox.width).toBeGreaterThanOrEqual(44);
    expect(zuBox.height).toBeGreaterThanOrEqual(44);

    // Esc schliesst (Tastatur-Bedienbarkeit, useDialogFokus).
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0, { timeout: 10_000 });
    expect(fehler).toEqual([]);
  });

  test('Quickjump springt deterministisch zum Artikel — Unbekanntes wird ehrlich abgelehnt', async ({ page }) => {
    await oeffneLeser(page, LEICHT, 390, 844);
    await page.getByRole('button', { name: /Gliederung/ }).first().click();
    await expect(sheet(page)).toBeVisible({ timeout: 20_000 });

    const feld = sheet(page).getByRole('searchbox');
    // Unbekannter Artikel: KEIN Sprung, sondern ein ehrlicher Hinweis (§8).
    await feld.fill('Art. 99999');
    await feld.press('Enter');
    await expect(page.getByText(/Kein Artikel gefunden für/)).toBeVisible({ timeout: 20_000 });
    // ── P1-4 (Bug-Check 18.8.2026) · UND SIE WIRD ANGESAGT ──────────────────
    // Der Flip hat die Absage von einer Live-Region (V1: `role="alert"`) auf
    // stummen Text umgestellt — oben im Kopf als offener Befund gemeldet, nicht
    // weggeglättet. Jetzt behoben: `role="status"` an der immer gemounteten
    // Meldezelle (`v3/LeserTrefferListe.tsx`, gleiche Fassung in
    // `parts/TrefferListe.tsx`). `status` statt `alert`, weil eine Auskunft die
    // laufende Ansage nicht unterbrechen soll — beim Tippen wäre das jede Taste.
    // ROT ZU BEKOMMEN (§6.7): das `role="status"` dort entfernen.
    const meldung = page.locator('[data-treffer-leer]');
    await expect(meldung).toHaveAttribute('role', 'status');
    await expect(meldung).toContainText(/Kein Artikel gefunden für/);
    await expect(page.locator('#art-1')).not.toBeInViewport();

    // Bekannter Artikel (mit «Art.»-Präfix + Punkt): Sprung + Sheet zu.
    await feld.fill('Art. 12');
    await feld.press('Enter');
    await expect(page.locator('#art-12')).toBeInViewport({ timeout: 20_000 });
  });

  // ── «Desktop-TOC-Kopf trägt denselben Quickjump-Baustein (§5)» ────────────
  // GELÖSCHT IN H4 (Flip 18.8.2026). Der Fall bewies, dass Sheet und Spalte
  // DENSELBEN Baustein tragen — eine §5-Aussage über zwei Felder. Seit Pos. 4
  // gibt es nur noch EINES, und dass es überall genau einmal steht, prüft
  // `leser-v3-suchfeld-ueberall.e2e.ts` (a)/(b)/(c) strenger, als dieser Fall
  // es je konnte. Kein Verlust an Abdeckung, ein Wegfall der Doppelung.
  //
  // P3-8 (Architektur-Gegenprüfung 18.8.2026) verlangte hier DATEI:ZEILE statt
  // eines blossen Dateinamens — ein Nachweis, den man erst suchen muss, ist
  // keiner. Nachgetragen, Stand 18.8.2026 (Zeilen wandern; massgeblich bleiben
  // die Fall-Buchstaben, die Nummern sind die Abkürzung):
  //   (a) e2e/leser-v3-suchfeld-ueberall.e2e.ts:51  — Split: JE Pane genau EIN
  //       sichtbares Feld, ohne eine Geste.
  //   (b) e2e/leser-v3-suchfeld-ueberall.e2e.ts:83  — @390 steht es im klebenden
  //       Kopf-Block, nicht im Blatt.
  //   (c) e2e/leser-v3-suchfeld-ueberall.e2e.ts:119 — @1440 mit eingeklappter
  //       Gliederung bleibt es da.
  // NICHT in `V1_GEMISCHT` gepinnt (playwright.config.ts), und das ist der
  // Entscheid, nicht das Versäumnis: gepinnt gehört, was NUR V1 kann. Der
  // gelöschte Fall prüfte eine Doppelung, die V1 aus einem MANGEL hatte (zwei
  // Felder für eine Absicht, Fehler K2) — sie in V1 einzufrieren hiesse, einen
  // behobenen Mangel als Vertrag weiterzuführen.
});

// ── OFFENER BEFUND AUS DEM H4-FLIP (18.8.2026) — bewusst NICHT weggeglättet ──
// Dieser Fall ist am Flip-Stand ROT, und zwar an seiner Sachaussage, nicht an
// einem Selektor. Gemessen @390 auf der BV unter 6× Drossel, Beobachter erst
// NACH dem Laden scharf (`nurAbInstall`), Shifts je Schritt gelesen:
//
//   Schritt            CLS-Beitrag   Quelle
//   1 Suche beginnen   0.0202        div 19,178·351×666 → 19,202·351×642
//                      0.0116        drei Textknoten −25 px
//                      0.0028        Griffzone der Kopfzeile (fremd, nicht zugerechnet)
//   2–7 Liste, Sprünge, Sheet, Leeren, Gliederung   je 0
//
// Alles passiert im EINEN Moment, in dem die Suche startet: die Such-Zone wächst
// um 24 px, weil die benannte Zähler-Zeile «… Fundstellen · Treffer anzeigen →»
// erscheint, und schiebt die Lesespalte nach unten. In V1 gab es diesen Sprung
// nicht — dort öffnete das Such-ICON ein Overlay AUS DEM FLUSS (A35).
//
// Warum hier nichts gelockert wird (§6.3/§6.7): das Budget «CLS 0» ist die
// Sachaussage dieses Falls. Ein angehobenes Budget machte den Sprung unsichtbar,
// obwohl ihn der Leser sieht. Der Fix läge in `v3/SuchZone`/`leserGeometrie`
// (Höhe der Zone reservieren, statt sie wachsen zu lassen) — und er widerspricht
// der Zusage von `leser-v3-suchfeld-ueberall` (e) («die ausgelegte Höhe deckt
// ihr Markup — ohne Luft»). Das ist ein ENTSCHEID, keine Nacharbeit, und die
// Fläche `v3/**` gehört in diesem PR einem anderen Bau. Der Befund steht darum
// im Kontaktbogen H4 §1/§8 und wartet dort.
//
// ── NACHGEMESSEN IN DER H4-INTEGRATION (18.8.2026) · DREI ZAHLEN, KEINE FIXE ──
// Reproduziert am Integrationsstand (`vite preview` aus `dist/`, Chromium,
// /gesetze/bund/BV @390, `Emulation.setCPUThrottlingRate` 6, Beobachter nach
// `#art-1`, nur Schritt 1 «Suche beginnen»). Alle drei Messreihen sind
// bit-stabil über ihre Läufe, das ist Geometrie und kein Rauschen:
//
//   (1) URSACHE BESTÄTIGT, punktgenau. `[data-v3-such-zone]` misst im
//       Ruhezustand 44 px und mit laufender Suche 68 px (`SUCH_H_RUHE` 2.75rem
//       → `SUCH_H_AKTIV` 4.25rem). Der protokollierte Shift lautet
//       `DIV 178·666 → 202·642` — dieselben 24 px, eine Ebene tiefer. Der Wert
//       ist Δ0.0202; die zweite Zeile (Δ0.0016, Griffzone der Topbar) ist die
//       bekannte fremde Grundlast und wird nicht zugerechnet.
//
//   (2) NULLPROBE GEGEN DIE ALTE HÜLLE (§0 Ziff. 3), dieselbe Geste, derselbe
//       Build, `?leser=v1`, n=3: **CLS 0.5509–0.5524** (Mittel 0.5519). Der
//       Grossbeitrag Δ0.5436 sind die `.lc-reveal`-Blöcke des V1-Suchmodus.
//       V3 ist an dieser Geste also nicht schlechter als der Ist-Stand, sondern
//       **rund 27× besser** — das Flip-Kriterium «CLS ≤ Ist-Stand» (Kap. 7) ist
//       an dieser Stelle klar erfüllt. Der rote Fall misst kein V3-Defizit, er
//       misst V3 gegen die **Null**, und diese Null hat V1 nie erreicht.
//
//   (3) MESSBEDINGUNG, die den Fall überhaupt erst rot macht: `fill()` setzt
//       den Wert programmatisch. Der Browser sieht keine Nutzereingabe und
//       flaggt den Shift `hadRecentInput = false`. Mit ECHTEM Tippen
//       (`click()` + `pressSequentially`, n=2) verbucht derselbe Shift sich als
//       `hadRecentInput = true`: input-frei bleiben dann 0.0016 (nur die fremde
//       Topbar), die 0.0202 wandern in den Input-Topf. Für einen realen Leser
//       ist dieser Sprung nach der CLS-Definition also **ausgeschlossen** — er
//       ist Folge seiner eigenen Tastatureingabe, genau wie es der Kopf von
//       `v3/SuchZone` seit H2b behauptet («das ist eine Tastatur-Eingabe,
//       CLS-exkludiert, §15.2»).
//
// ── ENTSCHIEDEN 18.8.2026 · WEG 3: DIE GESTE WIRD ECHT, DAS BUDGET BLEIBT 0 ──
// Der Absatz darüber endete bis hierher mit «ist ein Entscheid, kein Handgriff»
// und liess den Fall rot stehen. Der Entscheid ist gefallen. Drei Wege lagen vor
// (Kontaktbogen H4 §7c):
//   Weg 1 — 24 px Höhe im klebenden Kopf-Block dauerhaft reservieren. VERWORFEN:
//     das nimmt jedem Leser, der nie sucht, 24 px Lesehöhe @390, und es
//     widerspricht der Zusage von `leser-v3-suchfeld-ueberall` (e) («die
//     ausgelegte Höhe deckt ihr Markup — ohne Luft»).
//   Weg 2 — Budget anheben oder den Fall überspringen. VERWORFEN nach §6.3/§6.7:
//     ein angehobenes Budget macht JEDEN künftigen Sprung unsichtbar, nicht nur
//     diesen; ein Skip nimmt sechs weitere geprüfte Schritte mit.
//   Weg 3 — GEWÄHLT: das gemessene Verhalten bleibt, wie es ist (die Such-Zone
//     wächst beim Tippen um 24 px — bewusstes Feedback, B9-Regel «die Zonen-Höhe
//     hängt am Such-Zustand»), und die GESTE im Test wird die des Nutzers:
//     `click()` + `pressSequentially` statt `fill()`.
// WARUM DAS KEINE LOCKERUNG IST: Das Budget bleibt **0** für jeden Sprung ohne
// `hadRecentInput` — kein Schwellenwert wird angefasst, keine Zeile übersprungen.
// Geändert wird allein, WIE die Eingabe erzeugt wird, und zwar in Richtung
// Wirklichkeit: `fill()` setzt den Wert programmatisch, der Browser sieht keine
// Nutzereingabe und flaggt den Folge-Shift `hadRecentInput = false`. Die
// CLS-Definition schliesst eingabe-nahe Verschiebungen ausdrücklich aus — der
// Test mass bis hierher also einen Wert, den kein Nutzer je erzeugen kann.
// Nach der Umstellung deckt der Fall unverändert alles ab, was er vorher deckte,
// und zusätzlich den Fall «ein Shift beim Tippen kommt zu SPÄT, um noch als
// eingabe-nah zu gelten» — der wäre mit `fill()` von der Grundlast nicht zu
// unterscheiden gewesen.
// DIE ZAHLEN, auf denen der Entscheid steht:
//   `fill()`      CLS 0.0202  (rot, gemessen 18.8.2026 am Integrationsstand)
//   echt getippt  CLS 0.0016  (nur die fremde Topbar-Griffzone, nicht zugerechnet)
//   Nullprobe V1  CLS 0.5519  (dieselbe Geste, `?leser=v1`, n=3)
// Das Leeren in Schritt 3 bleibt bewusst `fill('')`: dort misst der Fall 0, und
// ein zweiter Wechsel auf echte Tasten machte den Schritt nur nachsichtiger,
// ohne etwas zu beweisen.
// ROT ZU BEKOMMEN (§6.7): in Schritt 1 `pressSequentially` durch `fill()`
// ersetzen ⇒ CLS 0.0202 gegen Budget 0.
// STOPP-RECHT: Vorgelegt wurde David am 18.8.2026 mit allen drei Wegen; er hat
// nicht widersprochen, und Weg 3 ist als der einzige gewählt, der nichts an der
// Oberfläche kostet. Will er stattdessen die 24 px Reserve (Weg 1), ist das ein
// Gestaltungsentscheid, der diesen Fall wieder öffnet — der Vermerk steht dafür
// im Fahrplan Kap. 9 und im Kontaktbogen §7c/§8.
//
// ── WEG 3 IST AUF LANGSAMER CPU FALSIFIZIERT (gemessen 7.9.2026, CI-Fix E) ───
// Die Zahlen vom 18.8.2026 darüber bleiben stehen, wie sie gemessen wurden
// (§0 Ziff. 2b) — sie sind richtig für die Maschine, auf der sie entstanden.
// Der Satz, der sie trug, ist es nicht mehr: «Für einen realen Leser ist dieser
// Sprung nach der CLS-Definition ausgeschlossen — er ist Folge seiner eigenen
// Tastatureingabe». Das gilt nur, solange die Eingabe SCHNELL genug verarbeitet
// wird.
//   BEFUND CI (Lauf 34066539241, Shard 7, 2-vCPU-Runner, Drossel 6×, DIESE
//   Geste mit `pressSequentially`): **CLS 0.019140**, Quelle `DIV.relative
//   min-w-0`, fremd 0.
//   LOKAL NACHGESTELLT (Preview 4406, dieselbe Geste, Drossel auf **20×**
//   gehoben): **CLS 0.01914**, dieselbe Quelle, `hadRecentInput = false` —
//   bit-nah am CI-Wert, also derselbe Vorgang und kein Rauschen. Bei Drossel 6×
//   ist der Fall auf dieser Maschine grün (n=5); die Drossel ist die
//   MESSBEDINGUNG, nicht der Defekt.
//   MECHANIK, punktgenau: `sucheAktiv` hängt am ENTPRELLTEN Wert
//   (`v3/leserV3Modell.ts:394/408` ← `inhalt-zustand.tsx:100 ff.`, 200 ms), und
//   erst er schaltet die Zonenhöhe (`v3/leserGeometrie.ts:118`
//   `SUCH_H_RUHE`→`SUCH_H_AKTIV`, gerendert als `height` in `v3/SuchZone.tsx`).
//   Auf schneller CPU verfällt die Entprellung NACH dem letzten Tastendruck,
//   also innerhalb des 500-ms-Eingabefensters. Auf langsamer CPU dauert die
//   Verarbeitung EINES Tastendrucks länger als 200 ms — die Entprellung feuert
//   dann MITTEN im Tippen, in einer Lücke, in der das Eingabefenster längst
//   abgelaufen ist (gemessen: der Sprung fiel 724 ms VOR dem letzten
//   Tastendruck). Der Browser verbucht ihn folgerichtig als eingabefrei.
//   WAS DAS HEISST: der Fall misst kein Sonden-Problem. Ein Leser auf einem
//   schwachen Telefon SIEHT diesen 24-px-Sprung beim Tippen, und die
//   CLS-Definition schliesst ihn dort nicht aus. Die Sonde bleibt darum
//   unverändert (kein gehobenes Budget, kein Skip, keine weichere Geste) — sie
//   hat recht.
//   OFFEN, und bewusst NICHT hier repariert: der Wurzel-Fix liegt in Dateien,
//   die am 7.9.2026 eine parallele Bau-Einheit hält (`v3/SuchZone.tsx`,
//   `v3/LeserRahmenV3.tsx` — §0 Ziff. 5, kein Doppelbau). Zwei Wege stehen zur
//   Wahl, beide brauchen einen Gestaltungsentscheid:
//     (i) Weg 1 von oben — die 24 px dauerhaft reservieren (kostet jedem Leser
//         @390 Lesehöhe, 18.8.2026 aus genau diesem Grund verworfen);
//     (ii) die ZONENHÖHE vom entprellten Wert lösen und an den ROHEN Feldinhalt
//         hängen (`sucheFeldLeer`, `leserV3Modell.ts:370`), sodass sie in
//         derselben Eingabe-Aufgabe wächst wie der Tastendruck. Kostet keine
//         Lesehöhe, zeigt aber die Trefferansicht 200 ms lang leer, bevor die
//         entprellten Treffer eintreffen — das ist Davids Entscheid, nicht der
//         einer Bau-Einheit.
//   Bis dahin ist dieser Fall auf CI ROT und meldet einen echten Mangel.
//   NACHTRAG 7.9.2026 (W2·24-F, dann D38): Weg (ii) IST gebaut — die Zonenhöhe
//   hängt seither am rohen Feldwert (`zoneHoch` in `v3/leserGeometrie.ts`, dort
//   die Messreihe unter Drossel 20×). D38 hat den Rest genommen: die Höhe wird
//   jetzt für die ganze Dauer einer Eingabe RESERVIERT, unabhängig davon, ob die
//   Zähler-Zeile gerade etwas sagt — damit springt die Zone auch beim Umschalten
//   Text↔Treffer nicht mehr. Der Befund oben bleibt als Befund stehen (§2b: er
//   wird nicht nachgeführt, er ist beantwortet).
test.describe('A9-DoD — Flüssigkeit unter CPU-Drossel 6×', () => {
  test('Suche, Fundstellen-Sprung und Gliederungs-Sheet ohne Layout-Shift (CLS 0)', async ({ page }) => {
    test.slow();
    const fehler = fehlerSammeln(page);
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    // BV statt OR: gemessen wird der LAYOUT-SHIFT der R1/R2-Flächen, nicht die
    // Rebuild-Dauer eines grossen Baums. Die BV trägt dieselben Flächen
    // (Gliederung, Trefferliste, Sheet) in bedienbarer Grösse.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/gesetze/bund/BV');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: 40_000 });
    await clsBeobachten(page);

    // H4: Das mobile Such-ICON (A35, David 19.7.2026) ist mit V3 entfallen — das
    // Feld steht @390 offen im Kopf (gemessen 18.8.2026: 0 Knöpfe «Im Gesetz
    // suchen», 1 searchbox). Es gibt also nichts mehr zu öffnen.

    // 1 · Suchmodus betreten. Seit S8 wächst dabei NICHTS mehr in den Fluss:
    //     Zähler und Ausschnitte kommen datenseitig, die Lesespalte bleibt stehen.
    //     H4: unterhalb von `istXl` steht die Trefferliste NICHT neben dem Feld
    //     (das Blatt ist ein Desktop-Bau, `v3/suchZoneAufbau`: `blattAmFeld =
    //     istXl && sucheAktiv`), sondern hinter der benannten Zähler-Zeile
    //     «… Fundstellen · Treffer anzeigen →». Die ist der mobile Weg zur Liste
    //     — und selbst eine der Flächen, die hier nicht springen darf.
    //     WEG 3 (18.8.2026): getippt wird wie ein Nutzer tippt — Feld anklicken,
    //     dann Zeichen für Zeichen. Nur so trägt der Browser den Folge-Shift in
    //     den Input-Topf, aus dem die CLS-Definition ihn ausschliesst; `fill()`
    //     hat diesen Weg nie genommen (Herleitung im Block über diesem Test).
    //     §6.3-UMSTELLUNG D38 (7.9.2026): der Zeuge ist die LISTE, nicht mehr
    //     die Zähler-Zeile. Sie erscheint mit dem Tippen von selbst über der
    //     Lesespalte; die Zähler-Zeile schweigt dann (sonst stünde ihr Zähler
    //     neben dem der Liste, §5). Die Geste ist unverändert die eines
    //     Nutzers, und die gemessene Fläche ist dieselbe.
    const feld = inGesetzSuche(page);
    await feld.click();
    await feld.pressSequentially('Kanton', { delay: 60 });
    await expect(liste(page)).toBeVisible({ timeout: 40_000 });
    await page.waitForTimeout(900);

    // 2 · Zwei Fundstellen-Sprünge (reines Scrollen, kein Reflow) über die
    //     ↑↓-Griffe in der Werkzeugzeile der Liste.
    await expect(leiste(page)).toBeVisible({ timeout: 40_000 });
    const vor = page.locator('[data-treffer-vor]');
    await vor.click();
    await vor.click();
    await page.waitForTimeout(900);

    // 3 · Suchmodus verlassen — durch Leeren des Feldes, wie der Nutzer es tut.
    await inGesetzSuche(page).fill('');
    await expect(liste(page)).toHaveCount(0, { timeout: 40_000 });
    await page.waitForTimeout(900);

    // 4 · Gliederungs-Sheet auf und zu (Overlay, aus dem Fluss).
    await page.getByRole('button', { name: /Gliederung/ }).first().click();
    await expect(sheet(page)).toBeVisible({ timeout: 40_000 });
    await page.waitForTimeout(900);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0, { timeout: 20_000 });
    await page.waitForTimeout(900);

    const { cls, quellen, fremd, fremdQ } = await clsLesen(page);
    expect(cls, `Input-freier Layout-Shift der R1/R2-Flächen — Quellen: ${quellen.join(' | ') || '—'}`
      + ` (fremd, nicht zugerechnet: ${fremd} · ${fremdQ.join(' | ') || '—'})`).toBe(0);

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    expect(fehler).toEqual([]);
  });
});

// ── Der EINZIGE OR-Fall dieser Datei, bewusst am Ende (Kopf, (a)) ────────────
// Er prüft, was nur an einem grossen Erlass prüfbar ist: dass der Suchmodus den
// Volltext-Baum NICHT mehr abräumt. Der Ein- und Ausstieg aus der Suche war bis
// S8 der teuerste Commit des Readers (1686 Artikel-Knoten neu mounten, gemessen
// ~2,4 s ohne Drossel bis 21,9 s bei 8×) — genau die Latenz, an der die
// Vorfassung dieser Datei im CI reihum hängenblieb. Fällt der Beweis, ist die
// Wurzelursache zurück.
test.describe('Perf-Beweis am schweren Erlass (OR)', () => {
  test('Der Suchmodus räumt den Volltext nicht mehr ab — kein Massen-Remount', async ({ page }) => {
    test.slow();
    await oeffneLeser(page, '/gesetze/bund/OR');
    const artikelVorher = await page.locator('article[id^="art-"]').count();
    expect(artikelVorher, 'OR-Volltext steht').toBeGreaterThan(1000);

    await inGesetzSuche(page).fill('Vertrag');
    await expect(leiste(page)).toBeVisible({ timeout: 20_000 });
    // Die Knotenzahl bleibt — der Baum wird weder abgeräumt noch neu gemountet.
    await expect.poll(async () => page.locator('article[id^="art-"]').count(), { timeout: 20_000 })
      .toBe(artikelVorher);

    // Und der Ausstieg ist ebenso billig geworden: kein Wiederaufbau, nur die
    // Liste verschwindet und der Baum kehrt zurück.
    await inGesetzSuche(page).fill('');
    await expect(liste(page)).toHaveCount(0, { timeout: 20_000 });
    await expect.poll(async () => page.locator('article[id^="art-"]').count(), { timeout: 20_000 })
      .toBe(artikelVorher);
    await expect(page.locator('[data-toc] [data-sektion-id]').first()).toBeVisible({ timeout: 20_000 });
  });
});
