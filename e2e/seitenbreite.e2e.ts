// @shard-gruppe: 7
import { test, expect, type Page } from '@playwright/test';
import { SEITENBREITE, type Breitenstufe, type Seitenart } from '../src/components/layout/seitenbreite';
import tailwindConfig from '../tailwind.config.js';

// ─── Breitenwächter je Seitenart (W2·31-BILDSCHIRMBREITE B1c, 25.9.2026) ─────
//
// Grundsatz David 25.9.2026: Fliesstext wächst NIE mit der Bildschirmbreite;
// breiter werden dürfen nur Raster, Tabellen und Beiwerk. Die Rahmenbreite
// jeder Seitenart steht an EINER Stelle (`src/components/layout/seitenbreite.ts`,
// `SEITENBREITE`); dieser Wächter liest Arten, Stufen und Beispielrouten von
// dort (§5 — keine abgeschriebene Routenliste). Schaltet ein späterer Posten
// (B2–B12) eine Art auf `weit`, zieht der Wächter ohne Änderung mit.
// Vorbild: `e2e/leser-lesemass.e2e.ts`; Ideen aus dem archivierten Entwurf
// `archiv/w2-29-werkbank-rest-breite-voll-2026-09-25:e2e/startseite-breite.e2e.ts`
// (dessen Startseiten-Sonderregel ist durch die Tabelle überholt).
//
// Zusicherungen je Seitenart (hell, Viewports unten):
//  (0) Mindestzusicherung (Gegenprüfung 30.9.2026, Befund 1 zu Bündel E): h1
//      ist nicht die Fehler-/404-Fläche (`ui/FehlSeite.tsx`, immer «… nicht
//      gefunden») — ein toter Pfad klassifiziert sonst still auf seine Art
//      und der Wächter misst die Fehlerseite, ohne es zu merken. Für Suche,
//      Material, Rechner, Vorlage zusätzlich seitenart-spezifischer
//      Mindestinhalt (Trefferliste/Textblock/Formularfeld).
//  (1) Rahmen: Breite des Innencontainers `main#inhalt > div` = Stufen-Deckel
//      (content 70rem; weit ab 2xl = 1536 px Viewport 90rem) × Root-font-size,
//      höchstens die verfügbare `<main>`-Breite. rem-Werte aus
//      `tailwind.config.js` (maxWidth), nicht als px-Literal.
//  (2) Fusszeile fluchtet: beide Footer-Innencontainer haben dieselbe linke und
//      rechte Kante wie der Inhaltsrahmen (±1 px).
//  (3) Keine horizontale Seiten-Scrollbar (scrollWidth ≤ innerWidth).
//  (4) Lesemass WCAG 1.4.8: in keinem Fliesstextblock (p, li, dd, blockquote,
//      figcaption; ≥ 120 sichtbare Zeichen, ≥ 2 Zeilen) steht eine Zeile mit
//      mehr als 80 Zeichen. Gezählt wird WORTGENAU je Zeile (nicht Textlänge /
//      Zeilenzahl: der Durchschnitt versteckt eine lange Zeile neben einer
//      kurzen Schlusszeile). Zeilen = Wort-Rects nach y gruppiert; ein grosser
//      x-Sprung in derselben Zeile (Spalten nebeneinander) beginnt ein neues
//      Stück. Nur sichtbarer Text zählt (sr-only, display:none fallen weg);
//      zugeklappte `<details>` werden vorher geöffnet.
//  (5) WEIT-SIMULATION @1920: derselbe Stand mit per CSS auf 90rem erzwungenem
//      Rahmen (Inhalt + Footer) — Zusicherung 4 muss auch dort halten. So fällt
//      jeder Fliesstext auf, der beim späteren Umschalten der Art auf `weit`
//      mitwachsen würde, BEVOR die Tabelle umgestellt wird.
//  (6) Schriftskala 1.4 (`useSchriftskala.ts`, localStorage + Neuladen) @1280
//      und @1920: 1 (rem-Rechnung), 2, 3, 4 gelten weiter.
//
// AUSNAHMEN von (4), benannt und begründet (Selektor → Grund):
const LESEMASS_AUSNAHMEN: ReadonlyArray<readonly [string, string]> = [
  ['[id^="art-"]', 'Normtext im Gesetzes-Leser — eigenes Tor e2e/leser-lesemass.e2e.ts (max-w-normtext, S2/R5)'],
  ['pre, code', 'Code/Rechenweg in Mono — kein Fliesstext'],
  ['.min-h-kopf-stand', 'Stand-Ausweis im Leser-Kopf (LeserKopfGeruest): Segmentzeile «Stand · in Kraft · geprüft» (Beiwerk); ihre CLS-Reserve `min-h-kopf-stand*` ist auf die heutige Zeilenzahl geeicht — ein Deckel verschöbe die Reserve (offen, eigener Posten)'],
  ['.tb-zeile', 'Erlass-Register /gesetze: Tabellenzeile (Kürzel · Titel · SR-Nr.), der Titel ist eine Zelle, kein Absatz — Tabellen dürfen wachsen (Grundsatz David 25.9.2026)'],
];
//
// ROT ZU BEKOMMEN (§6.7, Beweise im Commit-Bericht B1c):
//  (0) einen `variantenPfad` auf einen toten Schlüssel setzen (z. B.
//      `/materialien/DOES-NOT-EXIST`) → fällt auf `FehlSeite` zurück, h1 endet
//      auf «nicht gefunden» → rot (Nachbesserung Gegenprüfung 30.9.2026,
//      Rot-Beweis im PR-Bericht).
//  (1) `KLASSE.weit.fenster` in seitenbreite.ts auf 'max-w-content' und eine
//      Art auf `weit` → @1680/@1920 misst 1120 statt 1440 px.
//  (2) Footer-Innencontainer hart `max-w-content` bei einer Art auf `weit`.
//  (3) ein Element breiter als der Viewport.
//  (4)/(5) den `max-w-reading-s`-Deckel am PflichtDisclaimer entfernen.
//  (6) Footer auf `max-w-[1120px]` (px statt rem) — nur unter Skala 1.4 rot.

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1680, height: 1050 },
  { width: 1920, height: 1080 },
] as const;
const BREIT = VIEWPORTS[3];
const BP_2XL = 1536; // Tailwind-Standard `2xl` (px, von der Schriftskala unberührt)
const MAX_CH = 80;
// Die Seiten-Fusszeile (Footer.tsx) — nicht ein <footer> INNERHALB einer Seite
// (z. B. Entscheid-Leser), sonst zählte deren Text doppelt.
const SEITENFUSS = 'footer:not(main footer)';
const FUSS_RAHMEN = `${SEITENFUSS} > div.mx-auto, ${SEITENFUSS} > div > div.mx-auto`;
const MIN_ZEICHEN = 120;
const SKALA_KEY = 'lexmetrik-schriftskala'; // useSchriftskala.ts
const SKALA = '1.4';

const maxWidth = (tailwindConfig as { theme: { extend: { maxWidth: Record<string, string> } } })
  .theme.extend.maxWidth;
function remVon(token: string): number {
  const m = /^([\d.]+)rem$/.exec(maxWidth[token] ?? '');
  if (!m) throw new Error(`maxWidth.${token} ist kein rem-Wert: ${maxWidth[token]}`);
  return Number(m[1]);
}
const REM_CONTENT = remVon('content');
const REM_WEIT = remVon('weit');

function erwarteteRem(stufe: Breitenstufe, viewport: number): number {
  return stufe === 'weit' && viewport >= BP_2XL ? REM_WEIT : REM_CONTENT;
}

async function bereit(page: Page): Promise<void> {
  await expect(page.locator('main#inhalt h1').first()).toBeVisible();
  // W2·19 DK-B: der Fallback des Schnellwerkzeugs ist die eine Ladeanzeige
  // (`role="status"` + Ablesekante) statt `<p aria-busy>` — die Wartebedingung zieht mit.
  await expect(page.locator('[aria-busy="true"], [role="status"]:has(.scale-rule)')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts?.ready);
}

async function lade(page: Page, pfad: string): Promise<void> {
  await page.goto(pfad);
  await bereit(page);
  // Zugeklappte Blöcke öffnen, sonst misst (4) ihren Text nicht (Auftrag B1c).
  await page.evaluate(() => document.querySelectorAll('details:not([open])').forEach((d) => { (d as HTMLDetailsElement).open = true; }));
}

interface Rahmen {
  rootPx: number; mainPx: number; innen: { l: number; r: number; w: number };
  footer: Array<{ l: number; r: number }>; scrollW: number; innerW: number;
}

async function messeRahmen(page: Page): Promise<Rahmen> {
  return page.evaluate((fussRahmen) => {
    const box = (el: Element) => { const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, w: r.width }; };
    const main = document.querySelector('main#inhalt')!;
    const innen = main.querySelector(':scope > div')!;
    const footer = [...document.querySelectorAll(fussRahmen)].map(box);
    return {
      rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
      mainPx: main.getBoundingClientRect().width,
      innen: box(innen),
      footer,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    };
  }, FUSS_RAHMEN);
}

interface LesemassFund { ch: number; zeile: string; tag: string; px: number; anker: string }

async function messeLesemass(page: Page): Promise<LesemassFund[]> {
  const ausnahmen = LESEMASS_AUSNAHMEN.map(([s]) => s).join(', ');
  return page.evaluate(({ ausnahmen, maxCh, minZeichen, SEITENFUSS }) => {
    const funde: LesemassFund[] = [];
    const wortRe = /\S+/g;
    // Gemessen wird je ABSATZ-BLOCK: jeder Textknoten gehört zu seinem nächsten
    // nicht-inline Vorfahren (block, list-item, Flex-/Grid-Kind …). So zählt
    // eine Tabellen-/Rasterzeile aus Zellen (flex) je Zelle, und ein <li> mit
    // Titel und Unterzeile in verschiedenen Schriftstufen wird nicht gemischt.
    // Fliesstext ist ein Block, der selbst oder dessen Vorfahr p/li/dd/
    // blockquote/figcaption ist.
    type Wort = { t: string; weiss: boolean; x: number; r: number; cy: number; h: number };
    const bloecke = new Map<Element, { woerter: Wort[]; vorher: string }>();
    const blockVon = new Map<Element, Element | null>();
    const findeBlock = (e: Element): Element | null => {
      if (blockVon.has(e)) return blockVon.get(e)!;
      const d = getComputedStyle(e).display;
      const b = d.startsWith('inline') || d === 'contents' ? (e.parentElement ? findeBlock(e.parentElement) : null) : e;
      blockVon.set(e, b);
      return b;
    };
    const range = document.createRange();
    for (const wurzel of document.querySelectorAll(`main#inhalt, ${SEITENFUSS}`)) {
      const walker = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const eltern = n.parentElement!;
        const text = n.textContent ?? '';
        if (!text.trim()) {
          const b = findeBlock(eltern);
          const g = b && bloecke.get(b);
          if (g) g.vorher = ' ';
          continue;
        }
        if (eltern.closest(ausnahmen)) continue;
        const block = findeBlock(eltern);
        if (!block || !block.closest('p, li, dd, blockquote, figcaption')) continue;
        const eb = eltern.getBoundingClientRect();
        if (eb.width <= 1 || eb.height <= 1) continue; // sr-only / weggeklappt
        let g = bloecke.get(block);
        if (!g) { g = { woerter: [], vorher: '' }; bloecke.set(block, g); }
        // `weiss`: steht im Quelltext Leerraum vor dem Wort? Nur dann zählt die
        // Lücke als Zeichen — sonst würden Fussnoten-/Link-Knoten, die ohne
        // Leerschlag am Vorwort kleben, die Zeile künstlich verlängern.
        const vorKnoten = g.vorher;
        g.vorher = text.slice(-1);
        for (const m of text.matchAll(wortRe)) {
          range.setStart(n, m.index!);
          range.setEnd(n, m.index! + m[0].length);
          const rs = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          if (!rs.length) continue;
          const davor = m.index! > 0 ? text[m.index! - 1] : vorKnoten;
          // Ein am Zeilenende getrenntes Wort («UNO-|Behinderten…», hyphens)
          // hat ein Rect je Zeile: Zeichen anteilig nach Breite verteilen,
          // sonst zählte das ganze Wort in die erste Zeile.
          const summe = rs.reduce((acc, r) => acc + r.width, 0);
          let ab = 0;
          rs.forEach((r, i) => {
            const bis = i === rs.length - 1 ? m[0].length : Math.round(m[0].length * (rs.slice(0, i + 1).reduce((acc, q) => acc + q.width, 0) / summe));
            g!.woerter.push({ t: m[0].slice(ab, bis), weiss: i === 0 && (davor === '' || /\s/.test(davor)), x: r.left, r: r.right, cy: (r.top + r.bottom) / 2, h: r.height });
            ab = bis;
          });
        }
      }
    }
    for (const [el, { woerter }] of bloecke) {
      const zeichen = woerter.reduce((s, w) => s + w.t.length + (w.weiss ? 1 : 0), 0);
      if (zeichen < minZeichen) continue;
      // Zeilen: nach Mitte-y clustern (Toleranz halbe Wort-Höhe), dann nach x.
      woerter.sort((a, b) => a.cy - b.cy || a.x - b.x);
      const zeilen: Wort[][] = [];
      for (const w of woerter) {
        const z = zeilen[zeilen.length - 1];
        if (z && Math.abs(w.cy - z[0].cy) < z[0].h / 2) z.push(w); else zeilen.push([w]);
      }
      if (zeilen.length < 2) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      // Je Zeile das längste Stück (Spalten nebeneinander = eigene Stücke).
      const laengen = zeilen.map((z) => {
        z.sort((a, b) => a.x - b.x);
        let best = '';
        let stueck: typeof z = [];
        let rechts = -Infinity;
        const schliesse = () => {
          const s = stueck.map((w, i) => (i > 0 && w.weiss ? ' ' : '') + w.t).join('');
          if (s.length > best.length) best = s;
        };
        for (const w of z) {
          if (stueck.length && w.x - rechts > 3 * fs) { schliesse(); stueck = []; }
          stueck.push(w);
          rechts = w.r;
        }
        schliesse();
        return best;
      });
      // Zeichen/Zeile = Mittel der VOLLEN Zeilen (alle ausser der letzten):
      // die kurze Schlusszeile drückt den Schnitt nicht, ein einzelnes langes
      // Kompositum macht aber auch keinen Fund — gemessen wird die Kapazität
      // der Spalte in Zeichen, wie WCAG 1.4.8 sie meint.
      const voll = laengen.slice(0, -1);
      const ch = Math.round((voll.reduce((s, z) => s + z.length, 0) / voll.length) * 10) / 10;
      if (ch > maxCh) {
        const laengste = voll.reduce((a, b) => (b.length > a.length ? b : a));
        funde.push({ ch, zeile: laengste.slice(0, 100), tag: `${el.tagName.toLowerCase()}.${(el as HTMLElement).className}`.slice(0, 120), px: Math.round(el.getBoundingClientRect().width), anker: el.parentElement?.closest('[id]')?.id ?? '' });
      }
    }
    return funde.sort((a, b) => b.ch - a.ch).slice(0, 15);
  }, { ausnahmen, maxCh: MAX_CH, minZeichen: MIN_ZEICHEN, SEITENFUSS });
}

function pruefeRahmen(m: Rahmen, stufe: Breitenstufe, ort: string): void {
  const soll = Math.min(erwarteteRem(stufe, m.innerW) * m.rootPx, m.mainPx);
  expect(m.innen.w, `${ort} (1) Rahmenbreite: ${m.innen.w}px, Soll ${soll}px (Stufe ${stufe}, root ${m.rootPx}px, main ${m.mainPx}px)`)
    .toBeCloseTo(soll, 0);
  pruefeFlucht(m, ort);
}

function pruefeFlucht(m: Rahmen, ort: string): void {
  expect(m.footer.length, `${ort} (2) zwei Footer-Innencontainer gefunden`).toBe(2);
  for (const f of m.footer) {
    expect(Math.abs(f.l - m.innen.l), `${ort} (2) Footer links ${f.l} vs. Inhalt ${m.innen.l}`).toBeLessThanOrEqual(1);
    expect(Math.abs(f.r - m.innen.r), `${ort} (2) Footer rechts ${f.r} vs. Inhalt ${m.innen.r}`).toBeLessThanOrEqual(1);
  }
  expect(m.scrollW, `${ort} (3) horizontale Scrollbar: scrollWidth ${m.scrollW} > innerWidth ${m.innerW}`)
    .toBeLessThanOrEqual(m.innerW);
}

async function pruefeLesemass(page: Page, ort: string): Promise<void> {
  const funde = await messeLesemass(page);
  expect(funde, `${ort} (4) Zeilen über ${MAX_CH} Zeichen:\n${funde.map((f) => `  ${f.ch} ch · ${f.px}px · <${f.tag}> in #${f.anker} «${f.zeile}»`).join('\n')}`)
    .toEqual([]);
}

// ─── (0) Mindestzusicherung je Pfad (Gegenprüfung 30.9.2026, Befund 1) ───────
//
// `bereit()` verlangt nur ein SICHTBARES `main#inhalt h1` — das hat die
// Fehler-/404-Fläche auch. Probe am unbehobenen Stand: `/materialien/
// BOTSCHAFT-9999-0000` (toter Schlüssel) und ein toter `/rechner/:slug`
// klassifizieren zwar richtig auf ihre Art (`seitenartVon`), rendern aber
// `NotFound`/die geteilte `FehlSeite` (`src/components/ui/FehlSeite.tsx`) —
// der Wächter mass Rahmen und Lesemass der FEHLERSEITE, hielt sie aber für
// die Seitenart. Zwei zusätzliche, günstige Prüfungen VOR der teuren
// Viewport-Schleife schliessen das:

/** `ui/FehlSeite.tsx` setzt AUSNAHMSLOS `titel={\`${objekt} nicht gefunden\`}`
 *  als h1 (über `SeitenKopf` → `ui/SeitenTitel`) — die einzige Stelle im Haus,
 *  die diesen Wortlaut trägt (`NotFound`, `MaterialLeser`-Fehlzweig,
 *  `EntscheidLeser`-Fehlzweig, `gesetz-leser/FehlSeite`, alle über denselben
 *  Baustein). Aus dem Code ermittelt, nicht geraten. */
const FEHLERSEITE_H1_ENDE = 'nicht gefunden';

async function pruefeKeineFehlerseite(page: Page, art: Seitenart, ort: string): Promise<void> {
  if (art === 'fehlerseite') return; // diese Art IST bewusst die Fehlerseite (Kontrollroute /gibt-es-nicht)
  const h1 = (await page.locator('main#inhalt h1').first().textContent())?.trim() ?? '';
  expect(h1.endsWith(FEHLERSEITE_H1_ENDE), `${ort}: h1 «${h1}» — sieht wie die Fehlerseite aus (FehlSeite.tsx setzt immer «… nicht gefunden»); Pfad prüfen`)
    .toBe(false);
}

/** Seitenart-spezifischer Mindestinhalt: «h1 ist nicht die Fehlerseite»
 *  allein übersieht eine Fläche, deren PRERENDERTES h1 stimmt, deren Körper
 *  aber leer bleibt (z. B. eine Trefferliste, die nie füllt). Nur für die
 *  vier Arten geprüft, die heute `variantenPfade` tragen — an genau denen
 *  fand B8 die Lücke. */
async function pruefeSeitenartInhalt(page: Page, art: Seitenart, pfad: string, ort: string): Promise<void> {
  switch (art) {
    case 'suche': {
      // `beispielPfad` (`/suche`, ohne `q=`) zeigt bewusst den Tipp-Block statt
      // einer Trefferliste (Suche.tsx) — dort ist 0 kein Fund. Auf `/suche`
      // selbst läuft `SuchResultate` OHNE `listboxId` (nur `sektionsRollen`,
      // Suche.tsx:198) — jede Trefferzeile ist dort ein schlichtes
      // `<li><Link>` (SuchResultate.tsx `alsOption` false), kein
      // `role="option"` (das trägt nur der Listbox-Modus des Header-Dropdowns).
      // Die Skelett-Zeilen (`SkelettListe`) sitzen in einem `<ul aria-hidden>`
      // ohne inneren Link — `a[href]` zählt darum nur echte Treffer.
      if (!pfad.includes('q=')) return;
      const n = await page.locator('[data-suche-lesespalte] ul li a[href]').count();
      expect(n, `${ort}: Trefferliste leer (0 Treffer-Links) bei ${pfad}`).toBeGreaterThan(0);
      break;
    }
    case 'material-leser': {
      // `data-material-lesespalte` steht nur im Gefunden-Zweig von
      // MaterialLeser.tsx (der Fehlzweig kehrt vorher mit `<FehlSeite>` zurück).
      const n = await page.locator('main#inhalt article [data-material-lesespalte]').count();
      expect(n, `${ort}: Textblock (Kontext-Panel) fehlt`).toBeGreaterThan(0);
      break;
    }
    case 'rechner':
    case 'vorlage': {
      const n = await page.locator('main#inhalt input, main#inhalt select, main#inhalt textarea').count();
      expect(n, `${ort}: kein Formularfeld gefunden`).toBeGreaterThan(0);
      break;
    }
    default:
      break;
  }
}

/** (5) Rahmen (Inhalt + beide Footer-Container) auf 90rem erzwingen. */
async function simuliereWeit(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `main#inhalt > div, ${FUSS_RAHMEN} { max-width: ${REM_WEIT}rem !important; }`,
  });
}

const ARTEN = Object.entries(SEITENBREITE) as Array<
  [Seitenart, { stufe: Breitenstufe; beispielPfad: string; variantenPfade?: readonly string[] }]
>;

/** (0) Fehlerseiten-/Mindestinhalt-Check + Rahmen + Flucht + Scroll + Lesemass
 *  @1280–1920 + Weit-Simulation — die volle Batterie aus (0)–(5), parametrisiert
 *  über Art und Pfad. Gemeinsame Grundlage für `beispielPfad` UND jeden
 *  `variantenPfad` (Folgeposten 30.9.2026, Bündel E) — dieselbe Prüfung auf
 *  einer zweiten Route derselben Art, kein zweiter Mechanismus (§5/§10). */
async function pruefeRahmenUndLesemassVoll(page: Page, ort0: string, art: Seitenart, stufe: Breitenstufe, pfad: string): Promise<void> {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize(VIEWPORTS[0]);
  await lade(page, pfad);
  await pruefeKeineFehlerseite(page, art, ort0);
  await pruefeSeitenartInhalt(page, art, pfad, ort0);
  for (const vp of VIEWPORTS) {
    await page.setViewportSize(vp);
    const ort = `${ort0} @${vp.width}`;
    pruefeRahmen(await messeRahmen(page), stufe, ort);
    await pruefeLesemass(page, ort);
  }
  // (5) Weit-Simulation @1920 (Viewport steht schon auf 1920).
  expect(page.viewportSize()?.width).toBe(BREIT.width);
  await simuliereWeit(page);
  const sim = await messeRahmen(page);
  const ort = `${ort0} @1920 weit-simuliert`;
  expect(sim.innen.w, `${ort}: Simulation greift (${sim.innen.w}px)`).toBeCloseTo(Math.min(REM_WEIT * sim.rootPx, sim.mainPx), 0);
  pruefeFlucht(sim, ort);
  await pruefeLesemass(page, ort);
}

test.describe('Seitenbreite je Seitenart (W2·31-BILDSCHIRMBREITE B1c)', () => {
  for (const [art, { stufe, beispielPfad, variantenPfade }] of ARTEN) {
    test(`${art} ${beispielPfad}: Rahmen, Flucht, Scroll, Lesemass @1280–1920 + Weit-Simulation`, async ({ page }) => {
      await pruefeRahmenUndLesemassVoll(page, art, art, stufe, beispielPfad);
    });

    test(`${art} ${beispielPfad}: Schriftskala ${SKALA} @1280 und @1920`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, SKALA]);
      await page.setViewportSize(VIEWPORTS[0]);
      await lade(page, beispielPfad);
      const root = await page.evaluate(() => document.documentElement.style.fontSize);
      expect(root, 'Schriftskala am <html> angewandt').toBe(`${Number(SKALA) * 100}%`);
      for (const vp of [VIEWPORTS[0], BREIT]) {
        await page.setViewportSize(vp);
        const ort = `${art} @${vp.width} Skala ${SKALA}`;
        pruefeRahmen(await messeRahmen(page), stufe, ort);
        await pruefeLesemass(page, ort);
      }
    });

    // Variantenpfade (Folgeposten 30.9.2026, Bündel E — Lehre B8: derselbe
    // Deckel kann auf einer inhaltlich anderen Route derselben Art reissen,
    // ohne dass `beispielPfad` es je sieht) — dieselbe volle Batterie, ohne
    // die Schriftskala-Zusicherung (Laufzeit; Skala ist artenweit geprüft).
    for (const variante of variantenPfade ?? []) {
      test(`${art} ${variante} (Variante): Rahmen, Flucht, Scroll, Lesemass @1280–1920 + Weit-Simulation`, async ({ page }) => {
        await pruefeRahmenUndLesemassVoll(page, `${art} ${variante}`, art, stufe, variante);
      });
    }
  }
});

// ─── Vorlage in einem späteren Prüf-Schritt (Folgeposten 30.9.2026, Bündel E) ─
//
// `beispielPfad` der Art `vorlage` misst nur Schritt 0 (leeres Formular, keine
// Vorschau-Inhalte). Ab Schritt 3 («Erbeinsetzung», nach «Mit Musterdaten
// füllen») trägt die Vorschau echten, variabel langen Text (Erben-Absätze,
// Bausteinprotokoll) — genau die Art Inhalt, an der ein Lesemass-Deckel reisst
// (B8-Lehre). Eigener Ladeweg statt `lade()`, weil er Interaktion statt eines
// blossen `goto` braucht — misst mit denselben `pruefeRahmen`/`messeLesemass`
// wie der Rest der Datei (kein zweiter Mechanismus).
//
// Fund beim ersten Lauf (30.9.2026, Rot-Beweis): der «Tipp:»-Hinweistext
// unter der Erben-Liste (`VorlageTestament.tsx`) lief mit 99 ch @1280 über den
// Deckel — einer der 26 bereits erfassten Vorlagen-Hinweis-Funde aus
// `plan/posten/2026-09-26-vorlagen-26-zeilen-ueber-80-zeichen-in-hinweisen-text-xs-tex.md`
// («vorbestehend, Breitenwächter prüft nur Schritt 0 von testament» — genau
// die Lücke, die dieser spätere Prüf-Schritt hier schliesst). Der Posten lief
// zunächst im PARALLELEN Bündel F (eigener Worktree
// `feat/w2-31-vorlagen-hinweise`, `.lc-vorlagen-schritt`-Deckel in
// `index.css`/`wizard.tsx`, PR #1159) — bis zu dessen Landung (30.9.2026, mit
// main gemergt) stand hier eine namentliche Ausnahme für genau diesen einen
// Fund («Tipp: Decken Sie den ganzen Nachlass ab»). Nachbesserung
// Gegenprüfung (30.9.2026, Befund 2): Bündel F ist gelandet, die Ausnahme
// entfernt — der Fund ist jetzt durch den `.lc-vorlagen-schritt`-Deckel
// mitbehoben (Messung im PR-Bericht), kein Ausnahme-Bedarf mehr.

test('vorlage /vorlagen/testament Schritt 3 (Musterdaten, später Prüf-Schritt statt nur Schritt 0): Rahmen, Lesemass @1280 und @1920', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize(VIEWPORTS[0]);
  await page.goto('/vorlagen/testament');
  await bereit(page);
  await page.getByRole('button', { name: 'Mit Musterdaten füllen' }).click();
  const weiter = page.getByRole('button', { name: 'Weiter →' });
  await weiter.click(); // Schritt 1 (Person) → 2 (Familie)
  await weiter.click(); // Schritt 2 (Familie) → 3 (Erbeinsetzung)
  await expect(page.getByRole('heading', { name: 'Erbeinsetzung' })).toBeVisible();
  for (const vp of [VIEWPORTS[0], BREIT]) {
    await page.setViewportSize(vp);
    const ort = `vorlage /vorlagen/testament Schritt 3 @${vp.width}`;
    pruefeRahmen(await messeRahmen(page), SEITENBREITE.vorlage.stufe, ort);
    const funde = await messeLesemass(page);
    expect(funde, `${ort} (4) Zeilen über ${MAX_CH} Zeichen:\n${funde.map((f) => `  ${f.ch} ch · ${f.px}px · <${f.tag}> in #${f.anker} «${f.zeile}»`).join('\n')}`)
      .toEqual([]);
  }
});

// ─── Schriftskala 1.4 im schmalen Band 640–768 px (W2·31 Bündel H, 30.9.2026) ─
//
// BEFUND (Posten 2026-09-30 «/gesetze … Schriftskala 1.4 @640» und «/rechner/
// tagerechner Nebenleiste … 640–768»): die Schriftskala skaliert rem, die
// Medienabfragen (`sm` = 640 px) sehen sie nicht. @640 lief der Kopfstreifen
// (`layout/Topbar`) mit Wortmarke, 9-rem-Suchfeld-Boden und drei Werkzeug-
// Griffen über den Rand: +26 px ohne, +88 px mit Verlauf-Knopf, +28 px @700 —
// auf JEDER Seite, nicht nur auf /gesetze und dem Tagerechner. Fix:
// `.lc-topbar-wortmarke` (index.css) zeigt die Wortmarke nur, wenn der Streifen
// 35 rem breit ist (Containerabfrage, wächst mit der Skala; Nachbesserung
// Gegenprüfung 30.9.2026: Schwelle 36.25 rem, siehe index.css).
//
// Gemessen wird in zwei Weisen, beide nötig:
//  (a) Seiten-Querscroll: scrollWidth ≤ innerWidth.
//  (b) Der Streifen passt in sein eigenes Polster: der rechte Rand des letzten
//      Streifen-Kindes liegt nicht hinter dem inneren Rand (Polster 1.5 rem).
//      Zwischen 728 und 762 px frass der Streifen @1.4 das rechte Polster auf,
//      ohne dass scrollWidth es zeigte — (a) allein ist dort grün.
// Vorbedingung: der Verlauf-Knopf steht im Streifen (der Vorlauf öffnet den
// Tagerechner, `useZuletzt` trägt ihn ein) — der breiteste Zustand; ohne ihn
// wäre der Wächter zu gnädig. Pfade: alle `beispielPfad`/`variantenPfade`
// aus `SEITENBREITE` plus die in den Posten genannten Fälle.
//
// ROT ZU BEKOMMEN (§6.7): in `Topbar.tsx` die Wortmarke wieder
// `className="hidden sm:block text-h3"` statt `lc-topbar-wortmarke` → (a) und
// (b) schlagen @640 an (Beweis im PR-Bericht).
// W2·31 L (30.9.2026): 560 und 520 kommen dazu — Skala 1.4 + Verlauf-Knopf liess den
// Streifen zwischen 481 und 567 px überlaufen (+64 px Seiten-Querscroll @481, +25 @520,
// 7.1 px im Polster @560; `.lc-topbar-verlauf`, index.css). ABSICHTLICH NICHT 481–496:
// dort ragt der 9-rem-Suchfeldboden bei Skala 1.4 noch ≤ 16 px ins Polster (offen,
// Designentscheid). Die Vorbedingung «Verlauf-Knopf im Streifen» gilt am ERSTEN Wert
// (640); @520/@560 weicht der Knopf bewusst — der Streifen ohne ihn muss passen.
// ROT ZU BEKOMMEN (§6.7, gegen `src/`): in `Topbar.tsx` `lc-topbar-verlauf` durch
// `max-[480px]:hidden` ersetzen → @520 und @560 schlagen an (Beweis im PR-Bericht).
const SKALA_SCHMAL_BREITEN = [640, 700, 750, 768, 560, 520] as const; // 750: im Polster-Fenster 728–762 (b)
const SKALA_SCHMAL_EXTRA = [
  '/gesetze?ebene=bund', '/gesetze?ebene=international', '/gesetze?q=vertrag',
  '/gesetze?ebene=kanton&kt=BS', '/rechner/tagerechner',
] as const;
const SKALA_SCHMAL_PFADE = [...new Set([
  ...ARTEN.flatMap(([, { beispielPfad, variantenPfade }]) => [beispielPfad, ...(variantenPfade ?? [])]),
  ...SKALA_SCHMAL_EXTRA,
])];

test.describe(`Schriftskala ${SKALA} schmal 640–768 (W2·31 H)`, () => {
  for (const pfad of SKALA_SCHMAL_PFADE) {
    test(`${pfad}: kein Querscroll, Kopfstreifen im Polster @${SKALA_SCHMAL_BREITEN.join('/')}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, SKALA]);
      await page.setViewportSize({ width: SKALA_SCHMAL_BREITEN[0], height: 900 });
      // Vorlauf: ein Rechner-Besuch füllt den Verlauf (breitester Streifen).
      await page.goto('/rechner/tagerechner');
      await bereit(page);
      await page.goto(pfad);
      await bereit(page);
      await expect(page.locator('header [aria-label="Verlauf – zuletzt geöffnet"]').first(), `${pfad}: Vorbedingung Verlauf-Knopf im Streifen`).toBeVisible();
      for (const width of SKALA_SCHMAL_BREITEN) {
        await page.setViewportSize({ width, height: 900 });
        const m = await page.evaluate(() => {
          const de = document.documentElement;
          const streifen = document.querySelector('header > div')!;
          const polster = parseFloat(getComputedStyle(streifen).paddingRight);
          const sichtbar = [...streifen.children].filter((c) => c.getBoundingClientRect().width > 0);
          const letztes = sichtbar[sichtbar.length - 1];
          return {
            scrollW: de.scrollWidth, innerW: window.innerWidth,
            ueberPolster: letztes.getBoundingClientRect().right - (streifen.getBoundingClientRect().right - polster),
          };
        });
        const ort = `${pfad} @${width} Skala ${SKALA}`;
        expect(m.scrollW, `${ort}: Seiten-Querscroll (scrollWidth ${m.scrollW} > innerWidth ${m.innerW})`).toBeLessThanOrEqual(m.innerW);
        expect(m.ueberPolster, `${ort}: Kopfstreifen ragt ${m.ueberPolster.toFixed(1)} px in sein rechtes Polster`).toBeLessThanOrEqual(0.5);
      }
    });
  }
});

// ─── Schriftskala 1.4 auf dem Handy 320–560 px (W2·31 Bündel L, 30.9.2026) ────
//
// BEFUND (Prüfer #1161/#1163, gemessen @375/@320, Skala 1.4, dist): vorbestehende
// Seiten-Querscroller — die rem-skalierte Schrift sprengt Zeilen, die bei Skala 1
// gerade passen. Verursachendes Element und Fix je Fall:
//  · /gesetze?ebene=bund @375 +116 px (@320 +171; @320 Skala 1 schon +31): die Titel der
//    Bund-Kategorien («Zivilprozess- und Zwangsvollstreckungsrecht», ein Wort = 341 px)
//    standen als Flex-Kind OHNE `min-w-0` → `gesetze-teile/BundSystematik.tsx`.
//  · /rechner @375 +32 px (@320 +87): `Katalog.tsx`, Kopfzeile der Kategorie
//    («Titel — Linie — n verfügbar», Titel und Zähler `whitespace-nowrap`); dazu @320
//    drei weitere Quellen: `FristenHauptKarte` (Titel + «Entwurf» + Pfeil) und die
//    Zeiterfassung (Start + Zurücksetzen).
//  · / @320 +3 px: Kachel «Schnellwerkzeug» — die drei nowrap-Reiter (267 px) gegen
//    208 px Kachelinhalt; die Grid-Spur folgte der Mindestbreite.
//  · Streifen @481–567 (Verlauf-Knopf): siehe Block «640–768» oben.
// NICHT BEHOBEN, Designentscheid (mit Messwert gemeldet): /gesetze/bund/OR @320 +5 px —
// die drei Griffe des Erlass-Kopfs («Erlass-Blatt», «Gliederung», «Ansicht ▾») brauchen
// 286 px, die Zeile lässt 264 (+ Kürzel-Zone 0 px); dort ist nur ein Inhalts-Entscheid
// möglich (ein Griff weniger oder Icons). Der Fall steht darum nur @375/@560.
//
// Geprüft: scrollWidth ≤ innerWidth, mit dem obersten überragenden Element in der
// Meldung. Schriftskala wie die App: localStorage `lexmetrik-schriftskala`.
// ROT ZU BEKOMMEN (§6.7, gegen `src/`): in `BundSystematik.tsx` `min-w-0` an Hülle und
// Titel entfernen → bund @320/@375 rot; in `Katalog.tsx` `flex-wrap` der Kopfzeile und
// `whitespace-nowrap` am h2 zurück → /rechner @375 rot; in `Schnellwerkzeug.tsx`
// `flex-wrap @[11rem]:flex-nowrap` → `flex` → `/` @320 rot (Beweise im PR-Bericht).
const HANDY_FAELLE = [
  { pfad: '/', breiten: [320, 375, 560] },
  { pfad: '/gesetze?ebene=bund', breiten: [320, 375, 560] },
  { pfad: '/rechner', breiten: [320, 375, 560] },
  { pfad: '/gesetze/bund/OR', breiten: [375, 560] }, // @320 +5 px: offen (Designentscheid, s. o.)
] as const;

test.describe(`Schriftskala ${SKALA} Handy 320–560 (W2·31 L)`, () => {
  for (const { pfad, breiten } of HANDY_FAELLE) {
    test(`${pfad}: kein Seiten-Querscroll @${breiten.join('/')}`, async ({ page }) => {
      test.setTimeout(90_000); // der Leser (OR) lädt je Breite ~10 s; 30 s sind unter Last zu knapp
      await page.emulateMedia({ colorScheme: 'light' });
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, SKALA]);
      for (const width of breiten) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(pfad);
        await bereit(page);
        const m = await page.evaluate(() => {
          const de = document.documentElement;
          const grenze = de.clientWidth;
          const raus = [...document.body.querySelectorAll('*')].filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.right > grenze + 0.5;
          });
          const oben = raus.filter((el) => !raus.includes(el.parentElement as Element));
          return {
            ueber: de.scrollWidth - grenze,
            quellen: oben.slice(0, 4).map((el) => `${el.tagName}.${String(el.className).trim().split(/\s+/).slice(0, 4).join('.')} «${(el.textContent ?? '').trim().slice(0, 28)}» right=${Math.round(el.getBoundingClientRect().right)}`),
          };
        });
        expect(m.ueber, `${pfad} @${width} Skala ${SKALA}: Seiten-Querscroll +${m.ueber} px — ${m.quellen.join(' | ') || 'keine Quelle'}`).toBeLessThanOrEqual(0);
      }
    });
  }
});

// ─── FristenHauptKarte: Umbruch nur bei echtem Platzmangel (W2·31 L, Gegenprüfung) ─
//
// BEFUND (Prüfer, PR #1174): das reine `flex-wrap` an der Titelzeile der Haupt-
// Karte «Fristenrechner» (`Katalog.tsx`, `.kt-haupt`) schob «Entwurf» + Pfeil
// schon bei STANDARD-Schrift in eine zweite Zeile (@375 Skala 1: Titel 215 → 317 px,
// Karte 151 → 178 px; @414/430 Titel 2 → 1 Zeile): der Umbruch rechnet mit der
// vollen Textbreite, nicht mit der Schrumpfbreite. Fix: Titel `basis-[min-content]
// grow max-w-max` — Umbruch erst, wenn das längste Wort + Marke + Pfeil nicht passt.
// Zwei Zusicherungen, beide nötig:
//  (a) Skala 1, 360–480: Marke und Pfeil stehen in der ZEILE des Titels (Oberkante
//      vor der Titel-Unterkante) und die Karte bleibt ≤ 160 px hoch (vorher 151.3,
//      reines `flex-wrap` 178.4) — UND ≥ 140 px (nicht kaputt gekappt).
//  (b) Skala 1.4 @320/@375: nichts ragt über den Kartenrand (vorher Pfeil R 372 gegen
//      Karte R 347 @375).
// ROT ZU BEKOMMEN (§6.7, gegen `src/`): in `Katalog.tsx` dem Titel `basis-[min-content]
// grow max-w-max` nehmen (reines `flex-wrap`) → (a) rot @360–430; `flex-wrap` ganz
// weg → (b) rot (Beweise im PR-Bericht).
test.describe('FristenHauptKarte Umbruch nur bei Platzmangel (W2·31 L)', () => {
  const messeKarte = (page: Page) => page.evaluate(() => {
    const karte = document.querySelector('.kt-haupt') as HTMLElement;
    const zeile = karte.children[0] as HTMLElement;
    const [titel, ...rest] = [...zeile.children].map((c) => c.getBoundingClientRect());
    const k = karte.getBoundingClientRect();
    return {
      karteH: k.height,
      ueberRand: Math.max(...[titel, ...rest].map((r) => r.right - k.right)),
      beiTitel: rest.every((r) => r.top < titel.bottom),
      marke: rest.length,
    };
  });

  test('Skala 1: «Entwurf» und Pfeil bleiben in der Titelzeile @360–480', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    for (const width of [360, 375, 414, 430, 480]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/rechner');
      await bereit(page);
      const m = await messeKarte(page);
      const ort = `FristenHauptKarte @${width} Skala 1`;
      expect(m.marke, `${ort}: Marke + Pfeil vorhanden`).toBe(2);
      expect(m.beiTitel, `${ort}: Marke/Pfeil rutschten in eine zweite Zeile (Karte ${m.karteH.toFixed(1)} px)`).toBe(true);
      expect(m.karteH, `${ort}: Kartenhöhe ${m.karteH.toFixed(1)} px`).toBeLessThanOrEqual(160);
      expect(m.karteH, `${ort}: Kartenhöhe ${m.karteH.toFixed(1)} px`).toBeGreaterThanOrEqual(140);
    }
  });

  test(`Skala ${SKALA}: nichts ragt über den Kartenrand @320/375`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, SKALA]);
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/rechner');
      await bereit(page);
      const m = await messeKarte(page);
      expect(m.ueberRand, `FristenHauptKarte @${width} Skala ${SKALA}: ${m.ueberRand.toFixed(1)} px über dem Kartenrand`).toBeLessThanOrEqual(0.5);
    }
  });
});

// ─── Untergrenze der Wortmarke (Nachbesserung Gegenprüfung #1161, 30.9.2026) ──
//
// Die Tests oben sichern nur OBERgrenzen (kein Überlauf). Eine Regression, die
// die Wortmarke immer ausblendet, bliebe dort grün. Hier die Untergrenze: wo
// der Streifen Platz hat, ist `.lc-topbar-wortmarke` SICHTBAR — auch im
// breitesten Zustand (Verlauf-Knopf im Streifen). Schwelle: Streifen 36.25 rem
// (Inhaltsbreite 33.25 rem). Gemessen (Preview, Streifenbreite = Fenster <1024):
// Skala 1.0 @640 = 40.0 rem (sichtbar; mit 17-px-Scrollleiste 623 px = 38.9 rem,
// sichtbar), 1.1 @640 = 36.36 rem (sichtbar) und 1.1 @640 MIT 17-px-Scrollleiste
// = 623 px = 35.4 rem = Bedarf (Reserve 0: weg, kein Überlauf — die Erstfassung
// 32rem hielt sie hier sichtbar, `ueberPolster` 0.5 px), 1.4 @800 = 35.71 rem
// (weg, bewusst: unter der Schwelle) und @830 = 37.05 rem (sichtbar). Die
// Scrollleiste wird als `html{width:calc(100% - 17px)}` nachgestellt (headless
// Chromium blendet Scrollleisten aus; die Medienabfrage `sm` sieht weiter 640).
// ROT ZU BEKOMMEN (§6.7): `.lc-topbar-wortmarke` dauerhaft `display: none`
// (Container-Regel in index.css entfernen) → alle Sichtbar-Fälle schlagen an;
// Schwelle zurück auf 32rem → die Weg-Fälle 1.1 @640+Scrollleiste / 1.4 @800 schlagen an.
const WORTMARKE_FAELLE = [
  { skala: '1.0', width: 640, sichtbar: true },
  { skala: '1.0', width: 1024, sichtbar: true },
  { skala: '1.1', width: 640, sichtbar: true },
  { skala: '1.0', width: 640, sichtbar: true, scrollleiste: 17 },
  { skala: '1.1', width: 640, sichtbar: false, scrollleiste: 17 },
  { skala: '1.4', width: 830, sichtbar: true },
  { skala: '1.4', width: 1280, sichtbar: true },
  { skala: '1.4', width: 800, sichtbar: false },
  { skala: '1.4', width: 640, sichtbar: false },
] as const;

test.describe('Wortmarke Untergrenze (W2·31 H Nachbesserung)', () => {
  for (const fall of WORTMARKE_FAELLE) {
    const { skala, width, sichtbar } = fall;
    const scrollleiste = 'scrollleiste' in fall ? fall.scrollleiste : 0;
    test(`Wortmarke ${sichtbar ? 'sichtbar' : 'weg'} @${width}${scrollleiste ? ` mit ${scrollleiste}-px-Scrollleiste` : ''} Skala ${skala} (Verlauf-Knopf im Streifen)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, skala]);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/rechner/tagerechner'); // Vorlauf: füllt den Verlauf
      await bereit(page);
      await page.goto('/gesetze?ebene=bund');
      await bereit(page);
      await expect(page.locator('header [aria-label="Verlauf – zuletzt geöffnet"]').first(), 'Vorbedingung Verlauf-Knopf (breitester Zustand)').toBeVisible();
      if (scrollleiste) await page.addStyleTag({ content: `html{width:calc(100% - ${scrollleiste}px)}` });
      const wortmarke = page.locator('header .lc-topbar-wortmarke').first();
      if (sichtbar) await expect(wortmarke, `Wortmarke @${width} Skala ${skala}`).toBeVisible();
      else await expect(wortmarke, `Wortmarke @${width} Skala ${skala}`).toBeHidden();
    });
  }
});
