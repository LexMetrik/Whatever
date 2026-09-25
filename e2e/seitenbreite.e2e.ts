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
];
//
// ROT ZU BEKOMMEN (§6.7, Beweise im Commit-Bericht B1c):
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
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
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
  return page.evaluate(() => {
    const box = (el: Element) => { const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, w: r.width }; };
    const main = document.querySelector('main#inhalt')!;
    const innen = main.querySelector(':scope > div')!;
    const footer = [...document.querySelectorAll('footer > div.mx-auto, footer > div > div.mx-auto')].map(box);
    return {
      rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
      mainPx: main.getBoundingClientRect().width,
      innen: box(innen),
      footer,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    };
  });
}

interface LesemassFund { ch: number; zeile: string; tag: string; px: number; anker: string }

async function messeLesemass(page: Page): Promise<LesemassFund[]> {
  const ausnahmen = LESEMASS_AUSNAHMEN.map(([s]) => s).join(', ');
  return page.evaluate(({ ausnahmen, maxCh, minZeichen }) => {
    const funde: LesemassFund[] = [];
    const wortRe = /\S+/g;
    for (const el of document.querySelectorAll('main p, main li, main dd, main blockquote, main figcaption, footer p, footer li')) {
      if (el.closest(ausnahmen)) continue;
      if (!(el as HTMLElement).checkVisibility?.()) continue;
      // Wörter mit Rect sammeln (nur sichtbarer Text).
      // `weiss`: steht im Quelltext Leerraum vor dem Wort? Nur dann zählt die
      // Lücke als Zeichen — sonst würden Fussnoten-/Link-Knoten, die ohne
      // Leerschlag am Vorwort kleben, die Zeile künstlich verlängern.
      const woerter: Array<{ t: string; weiss: boolean; x: number; r: number; cy: number; h: number }> = [];
      let vorher = '';
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const eltern = n.parentElement!;
        if (eltern.closest(ausnahmen)) continue;
        const eb = eltern.getBoundingClientRect();
        if (eb.width <= 1 || eb.height <= 1) continue; // sr-only / weggeklappt
        const text = n.textContent ?? '';
        const vorKnoten = vorher;
        vorher = text.slice(-1) || vorher;
        for (const m of text.matchAll(wortRe)) {
          range.setStart(n, m.index!);
          range.setEnd(n, m.index! + m[0].length);
          const rs = range.getClientRects();
          if (!rs.length) continue;
          const r0 = rs[0];
          if (r0.width <= 0 || r0.height <= 0) continue;
          const davor = m.index! > 0 ? text[m.index! - 1] : vorKnoten;
          woerter.push({ t: m[0], weiss: davor === '' || /\s/.test(davor), x: r0.left, r: r0.right, cy: (r0.top + r0.bottom) / 2, h: r0.height });
        }
      }
      const zeichen = woerter.reduce((s, w) => s + w.t.length + (w.weiss ? 1 : 0), 0);
      if (zeichen < minZeichen) continue;
      // Zeilen: nach Mitte-y clustern (Toleranz halbe Wort-Höhe), dann nach x.
      woerter.sort((a, b) => a.cy - b.cy || a.x - b.x);
      const zeilen: (typeof woerter)[] = [];
      for (const w of woerter) {
        const z = zeilen[zeilen.length - 1];
        if (z && Math.abs(w.cy - z[0].cy) < z[0].h / 2) z.push(w); else zeilen.push([w]);
      }
      if (zeilen.length < 2) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      for (const z of zeilen) {
        z.sort((a, b) => a.x - b.x);
        let stueck: typeof z = [];
        let rechts = -Infinity;
        const pruefe = () => {
          const s = stueck.map((w, i) => (i > 0 && w.weiss ? ' ' : '') + w.t).join('');
          if (s.length > maxCh) {
            funde.push({ ch: s.length, zeile: s.slice(0, 100), tag: `${el.tagName.toLowerCase()}.${(el as HTMLElement).className}`.slice(0, 120), px: Math.round(el.getBoundingClientRect().width), anker: el.parentElement?.closest('[id]')?.id ?? '' });
          }
        };
        for (const w of z) {
          if (stueck.length && w.x - rechts > 3 * fs) { pruefe(); stueck = []; }
          stueck.push(w);
          rechts = w.r;
        }
        pruefe();
      }
    }
    // Pro Element nur der schlimmste Fund, sortiert.
    return funde.sort((a, b) => b.ch - a.ch).slice(0, 12);
  }, { ausnahmen, maxCh: MAX_CH, minZeichen: MIN_ZEICHEN });
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

/** (5) Rahmen (Inhalt + beide Footer-Container) auf 90rem erzwingen. */
async function simuliereWeit(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `main#inhalt > div, footer > div.mx-auto, footer > div > div.mx-auto { max-width: ${REM_WEIT}rem !important; }`,
  });
}

const ARTEN = Object.entries(SEITENBREITE) as Array<[Seitenart, { stufe: Breitenstufe; beispielPfad: string }]>;

test.describe('Seitenbreite je Seitenart (W2·31-BILDSCHIRMBREITE B1c)', () => {
  for (const [art, { stufe, beispielPfad }] of ARTEN) {
    test(`${art} ${beispielPfad}: Rahmen, Flucht, Scroll, Lesemass @1280–1920 + Weit-Simulation`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.setViewportSize(VIEWPORTS[0]);
      await lade(page, beispielPfad);
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        const ort = `${art} @${vp.width}`;
        pruefeRahmen(await messeRahmen(page), stufe, ort);
        await pruefeLesemass(page, ort);
      }
      // (5) Weit-Simulation @1920 (Viewport steht schon auf 1920).
      expect(page.viewportSize()?.width).toBe(BREIT.width);
      await simuliereWeit(page);
      const sim = await messeRahmen(page);
      const ort = `${art} @1920 weit-simuliert`;
      expect(sim.innen.w, `${ort}: Simulation greift (${sim.innen.w}px)`).toBeCloseTo(Math.min(REM_WEIT * sim.rootPx, sim.mainPx), 0);
      pruefeFlucht(sim, ort);
      await pruefeLesemass(page, ort);
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
  }
});
