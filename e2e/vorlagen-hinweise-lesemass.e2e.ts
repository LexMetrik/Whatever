// @shard-gruppe: 4
import { test, expect, type Page } from '@playwright/test';
import tailwindConfig from '../tailwind.config.js';

// ─── Lesemass der Vorlagen-Hinweise (W2·31-BILDSCHIRMBREITE Bündel F, 30.9.2026) ─
//
// Posten `archiv/posten/2026-09-26-vorlagen-26-zeilen-ueber-80-zeichen-in-hinweisen-
// text-xs-tex.md`: 26 freistehende Absätze/Listenpunkte (text-xs/text-body-s) in
// den Vorlagen-Prüf-Schritten liefen ohne Deckel bis 116 Zeichen/Zeile (WCAG
// 1.4.8, Deckel 80) — der Wächter `e2e/seitenbreite.e2e.ts` prüft nur EINEN
// Schritt EINER Vorlage (testament S0) und übersah die anderen 29 Vorlagen.
// EIGENE Spec-Datei (nicht seitenbreite.e2e.ts): das Bündel E dieses Schritts
// ändert seitenbreite.e2e.ts parallel (Kollisionsvermeidung §5 Dispatch-Regeln).
//
// Fix: `src/components/vorlagen/wizard.tsx` markiert den Schritt-Inhalt-Rahmen
// mit `.lc-vorlagen-schritt` (EINE Stelle, alle Vorlagen laufen darüber);
// `src/index.css` deckelt `p/li/dd/blockquote/figcaption.text-xs` auf
// `max-w-kleintext` und `…text-body-s` auf `max-w-reading-s` — EIN Deckel an
// der Klasse statt an 26 Einzelstellen (§5/§10).
//
// Nachbesserung Gegenprüfung (30.9.2026): `.lc-notice`/-warn/-danger bekommt
// KEINEN Lesemass-Deckel (weder hier noch in index.css) — die Klasse sitzt in
// 83 Aufrufstellen auf der BOX selbst (Hintergrund, Registerstrich), ein
// Deckel dort verschmälerte die Box statt nur ihren Fliesstext (119 Boxen
// betroffen, u. a. /rechner/verjaehrung-board 1008→480px @1280). Der
// `.lc-vorlagen-schritt`-Selektor schliesst darum Elemente mit
// `[class*="lc-notice"]` aus (mehrere Vorlagen setzen `text-body-s` direkt auf
// ein `<p class="lc-notice …">`) — `sammleFunde()` unten spiegelt denselben
// Ausschluss, sonst misst der Test einen Deckel, den die Box bewusst nicht
// mehr trägt.
//
// Zusicherung je Fall: (1) mindestens ein Fund (sonst prüft der Test nichts —
// ein Tor, das nicht scheitern kann, ist gefährlicher als keines, §6.7);
// (2) Zeichen/Zeile ≤ 80 (WCAG 1.4.8, dieselbe Zeilen-Methode wie
// seitenbreite.e2e.ts messeLesemass: Wort-Rects nach y geclustert, Mittel der
// vollen Zeilen); (3) die WIRKSAME Deckel-Breite (`getComputedStyle().maxWidth`
// der Zeile, nicht ihre gerenderte Box-Breite — die hängt zusätzlich vom
// jeweiligen Feld/Spalten-Layout ab und ist bei kurzen Feld-Hinweisen legitim
// schmaler als der Deckel, z. B. testament «genaue Personalien – keine
// Kosenamen» 180px in einer schmalen Feld-Spalte, ohne dass der Deckel
// betroffen ist) liegt zwischen `MIN_DECKEL_PX` (Untergrenze — ein Deckel, der
// auf 0/eine kaputte Kaskade kollabiert, ist kein Fix, sondern ein neuer
// Defekt) und der für die Schriftstufe erwarteten Zahl aus
// `tailwind.config.js` (Obergrenze — kein zweiter, abweichender Wert).
//
// ROT ZU BEKOMMEN (§6.7, Beweis im PR-Bericht): den Deckel in index.css
// entfernen (bzw. `.lc-vorlagen-schritt` in wizard.tsx streichen) → (2)
// schlägt mit den Original-Werten (93/95/83 ch) fehl UND (3) misst keinen
// `max-width` mehr (deckelPx → 0/`none`).

const MAX_CH = 80;
const MIN_DECKEL_PX = 200; // klar unter beiden Stufen (384/480px) — meldet nur eine kaputte/leere Kaskade

const maxWidth = (tailwindConfig as { theme: { extend: { maxWidth: Record<string, string> } } })
  .theme.extend.maxWidth;
function pxVon(token: string): number {
  const m = /^([\d.]+)rem$/.exec(maxWidth[token] ?? '');
  if (!m) throw new Error(`maxWidth.${token} ist kein rem-Wert: ${maxWidth[token]}`);
  return Number(m[1]) * 16;
}
const MAX_PX = { 'text-xs': pxVon('kleintext'), 'text-body-s': pxVon('reading-s') };

interface Fund { ch: number; px: number; deckelPx: number; stufe: 'text-xs' | 'text-body-s'; zeile: string }

async function bereit(page: Page): Promise<void> {
  await expect(page.locator('main#inhalt h1').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
}

async function oeffneDetails(page: Page): Promise<void> {
  await page.evaluate(() => document.querySelectorAll('details:not([open])').forEach((d) => { (d as HTMLDetailsElement).open = true; }));
}

/** Misst NUR innerhalb des Vorlagen-Schritt-Rahmens (`.lc-vorlagen-schritt`,
 *  wizard.tsx) — derselbe Scope wie der Produktions-Deckel in index.css. */
async function sammleFunde(page: Page): Promise<Fund[]> {
  return page.evaluate(() => {
    const wortRe = /\S+/g;
    const range = document.createRange();
    const funde: { ch: number; px: number; deckelPx: number; stufe: 'text-xs' | 'text-body-s'; zeile: string }[] = [];
    for (const el of document.querySelectorAll('.lc-vorlagen-schritt :where(p, li, dd, blockquote, figcaption):not([class*="lc-notice"]).text-xs, .lc-vorlagen-schritt :where(p, li, dd, blockquote, figcaption):not([class*="lc-notice"]).text-body-s')) {
      const stufe: 'text-xs' | 'text-body-s' = el.classList.contains('text-xs') ? 'text-xs' : 'text-body-s';
      const eb = el.getBoundingClientRect();
      const deckelPx = parseFloat(getComputedStyle(el).maxWidth) || 0;
      if (eb.width <= 1 || eb.height <= 1) continue;
      type Wort = { t: string; weiss: boolean; x: number; cy: number; h: number };
      const woerter: Wort[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent ?? '';
        if (!text.trim()) continue;
        for (const m of text.matchAll(wortRe)) {
          range.setStart(n, m.index!);
          range.setEnd(n, m.index! + m[0].length);
          const rs = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          if (!rs.length) continue;
          const davor = m.index! > 0 ? text[m.index! - 1] : ' ';
          for (const r of rs) woerter.push({ t: m[0], weiss: /\s/.test(davor), x: r.left, cy: (r.top + r.bottom) / 2, h: r.height });
        }
      }
      if (woerter.length < 2) continue;
      woerter.sort((a, b) => a.cy - b.cy || a.x - b.x);
      const zeilen: Wort[][] = [];
      for (const w of woerter) {
        const z = zeilen[zeilen.length - 1];
        if (z && Math.abs(w.cy - z[0].cy) < z[0].h / 2) z.push(w); else zeilen.push([w]);
      }
      if (zeilen.length < 2) continue;
      const laengen = zeilen.map((z) => z.reduce((s, w) => s + w.t.length + (w.weiss ? 1 : 0), 0));
      const zeilenText = zeilen.map((z) => z.map((w) => w.t).join(' '));
      const voll = laengen.slice(0, -1);
      const ch = Math.round((voll.reduce((s, v) => s + v, 0) / voll.length) * 10) / 10;
      const iMax = voll.indexOf(Math.max(...voll));
      funde.push({ ch, px: Math.round(eb.width), deckelPx: Math.round(deckelPx), stufe, zeile: zeilenText[iMax].slice(0, 100) });
    }
    return funde;
  });
}

async function musterdatenFuellen(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: 'Mit Musterdaten füllen' });
  if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(150); }
}

async function weiter(page: Page, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    const w = page.getByRole('button', { name: /^Weiter(?!lesen)/ });
    await expect(w, `Weiter-Klick ${i + 1}/${n}`).toBeEnabled();
    await w.click();
    await page.waitForTimeout(100);
  }
}

interface Fall { name: string; pfad: string; vorbereiten: (page: Page) => Promise<void>; }

const FAELLE: Fall[] = [
  {
    name: 'schlichtungsgesuch-bs S0 «Streitgegenstand & Vorprüfung»',
    pfad: '/vorlagen/schlichtungsgesuch-bs',
    vorbereiten: async () => {},
  },
  {
    name: 'klage-ordentlich S3 «Begründung (Pflicht)»',
    pfad: '/vorlagen/klage-ordentlich',
    vorbereiten: async (page) => { await musterdatenFuellen(page); await weiter(page, 3); },
  },
  {
    name: 'patientenverfuegung S2 «Situationen & Ziel»',
    pfad: '/vorlagen/patientenverfuegung',
    vorbereiten: async (page) => { await musterdatenFuellen(page); await weiter(page, 2); },
  },
  {
    name: 'testament «Erbeinsetzung»',
    pfad: '/vorlagen/testament',
    // Schritte: Person(0) → Familie(1) → Erbeinsetzung(2).
    vorbereiten: async (page) => { await musterdatenFuellen(page); await weiter(page, 2); },
  },
  {
    name: 'vorsorgeauftrag «Beauftragte & Ersatz»',
    pfad: '/vorlagen/vorsorgeauftrag',
    // Schritte: Voraussetzungen(0) → Person(1) → Beauftragte & Ersatz(2).
    vorbereiten: async (page) => { await musterdatenFuellen(page); await weiter(page, 2); },
  },
];

test.describe('Vorlagen-Hinweise: Lesemass (WCAG 1.4.8, ≤ 80 Zeichen/Zeile)', () => {
  for (const vp of [1280, 1920]) {
    for (const fall of FAELLE) {
      test(`${fall.name} @${vp}: Hinweise ≤ 80 ch/Zeile, Deckel wirksam`, async ({ page }) => {
        await page.setViewportSize({ width: vp, height: 900 });
        await page.goto(fall.pfad);
        await bereit(page);
        await oeffneDetails(page);
        await fall.vorbereiten(page);
        await oeffneDetails(page);
        const funde = await sammleFunde(page);
        expect(funde.length, `${fall.name}: mindestens ein Hinweis-Fund erwartet (sonst prüft der Test nichts, §6.7)`).toBeGreaterThan(0);
        for (const f of funde) {
          expect(f.ch, `${fall.name} @${vp}: "${f.zeile}" (${f.stufe}, Box ${f.px}px, Deckel ${f.deckelPx}px)`).toBeLessThanOrEqual(MAX_CH);
          expect(f.deckelPx, `${fall.name} @${vp}: Deckel kollabiert (${f.stufe})`).toBeGreaterThan(MIN_DECKEL_PX);
          expect(f.deckelPx, `${fall.name} @${vp}: Deckel weicht von der Stufen-Zahl ab (${f.stufe})`).toBeLessThanOrEqual(MAX_PX[f.stufe] + 1);
        }
      });
    }
  }
});

// ─── Notice-Box-Breite (Nachbesserung Gegenprüfung 30.9.2026, Ziff. 3) ───────
//
// Der Befund, der zu dieser Nachbesserung führte: der frühere Lesemass-Deckel
// an `.lc-notice`/-warn/-danger deckelte die BOX selbst (83 Aufrufstellen
// setzen `text-body-s`/`text-xs` direkt auf das Element, das auch `lc-notice`
// trägt) — 119 Boxen liefen dadurch schmaler als ihre Spalte, u. a.
// /rechner/verjaehrung-board «Internationaler Warenkauf» 1008→480px @1280,
// 1328→480px @1920. Der obige Lesemass-Test prüft nur Zeichen/Zeile und
// `getComputedStyle().maxWidth` der TEXT-Elemente — er hätte diesen Befund
// nicht gefangen (eine Box kann schmal UND unter 80 ch/Zeile sein). Diese
// Zusicherung misst darum zusätzlich die BOX-Breite gegen ihren unmittelbaren
// Eltern-Container (die Spalte, in der die Box liegt): Unter- UND Obergrenze
// (±2 px), damit weder ein Kollaps noch ein Überlauf gegenüber der Spalte
// durchrutscht.
//
// Scope-Wahl: NICHT alle `[class*="lc-notice"]`-Fundstellen der Seite — eine
// Box, die bewusst in einer Mehrspalten-/Grid-Zelle sitzt (z. B. der
// «Rechtlicher Hinweis»-Kasten in GewaehrleistungForm, der bei 1920px in
// einer von zwei Grid-Spalten steht, 640px Box in 1328px Eltern-Grid), ist
// dort schmaler als ihr DOM-`parentElement` NICHT als Bug, sondern als
// Grid-Zellen-Breite — eine blinde 1:1-Prüfung hätte dort falsch Rot gegeben.
// Die vier Fälle unten sind eigens gegen die reale Seite geprüft (Playwright,
// 30.9.2026): einspaltige Notice-Boxen, deren Elternteil exakt die Spalte ist.
//
// ROT ZU BEKOMMEN (§6.7, Beweis im PR-Bericht): die `.lc-notice`-Lesemass-
// Regel aus der Nachbesserung wiederherstellen (Kopf vor dieser Nachbesserung)
// → die verjaehrung-board-Fälle schlagen fehl (Box 480px statt 1008/1328px
// Eltern-Breite).

async function sammleNoticeBreiten(page: Page): Promise<{ box: number; eltern: number; text: string }[]> {
  return page.evaluate(() => {
    const funde: { box: number; eltern: number; text: string }[] = [];
    for (const el of document.querySelectorAll('[class*="lc-notice"]')) {
      const parent = el.parentElement;
      if (!parent) continue;
      // Eine Box, deren unmittelbarer Elternteil selbst ein Mehrspalten-Layout
      // ist (`display: grid`/`flex`, z. B. `.lc-rechner-spalten` bei breiten
      // Rechner-Seiten oder das PflichtDisclaimer-Gefäss in GewaehrleistungForm),
      // MUSS nicht die volle Eltern-Breite füllen — sie füllt ihre GRID-/FLEX-
      // ZELLE, das prüft der Grid-/Flex-Algorithmus, nicht diese Zusicherung.
      // Ohne diesen Ausschluss meldete diese Probe an genau so einer Stelle
      // (PflichtDisclaimer in GewaehrleistungForm, 30.9.2026 empirisch
      // gemessen: Box 640px in einer `grid-cols-2`-Zelle, Eltern 1328px) einen
      // FALSCHEN Befund — die Box war korrekt, nicht der frühere Bug.
      const parentDisplay = getComputedStyle(parent).display;
      if (parentDisplay === 'grid' || parentDisplay === 'inline-grid' || parentDisplay === 'flex' || parentDisplay === 'inline-flex') continue;
      const eb = (el as HTMLElement).getBoundingClientRect();
      const pb = parent.getBoundingClientRect();
      if (eb.width <= 1 || eb.height <= 1) continue;
      funde.push({ box: Math.round(eb.width), eltern: Math.round(pb.width), text: (el.textContent ?? '').trim().slice(0, 60) });
    }
    return funde;
  });
}

async function bisZumEnde(page: Page): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const w = page.getByRole('button', { name: /^Weiter(?!lesen)/ });
    if (!(await w.count()) || !(await w.isEnabled())) break;
    await w.click();
    await page.waitForTimeout(100);
  }
}

const NOTICE_BOX_MAX_ABW_PX = 2;

interface NoticeFall { name: string; pfad: string; vorbereiten: (page: Page) => Promise<void>; }

const NOTICE_FAELLE: NoticeFall[] = [
  { name: 'verjaehrung-board', pfad: '/rechner/verjaehrung-board', vorbereiten: async () => {} },
  {
    name: 'testament «Prüfen & Download»',
    pfad: '/vorlagen/testament',
    vorbereiten: async (page) => { await musterdatenFuellen(page); await bisZumEnde(page); },
  },
  {
    name: 'vorsorgeauftrag «Prüfen & Download»',
    pfad: '/vorlagen/vorsorgeauftrag',
    vorbereiten: async (page) => { await musterdatenFuellen(page); await bisZumEnde(page); },
  },
];

test.describe('Notice-Boxen: Breite = Breite ihres Spalten-Elternteils', () => {
  for (const vp of [1280, 1920]) {
    for (const fall of NOTICE_FAELLE) {
      test(`${fall.name} @${vp}: Notice-Box so breit wie ihr Elternteil (±${NOTICE_BOX_MAX_ABW_PX}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp, height: 900 });
        await page.goto(fall.pfad);
        await bereit(page);
        await oeffneDetails(page);
        await fall.vorbereiten(page);
        await oeffneDetails(page);
        const funde = await sammleNoticeBreiten(page);
        expect(funde.length, `${fall.name} @${vp}: mindestens eine Notice-Box erwartet (sonst prüft der Test nichts, §6.7)`).toBeGreaterThan(0);
        for (const f of funde) {
          expect(f.box, `${fall.name} @${vp}: "${f.text}" Box ${f.box}px, Eltern ${f.eltern}px (Untergrenze)`).toBeGreaterThanOrEqual(f.eltern - NOTICE_BOX_MAX_ABW_PX);
          expect(f.box, `${fall.name} @${vp}: "${f.text}" Box ${f.box}px, Eltern ${f.eltern}px (Obergrenze)`).toBeLessThanOrEqual(f.eltern + NOTICE_BOX_MAX_ABW_PX);
        }
      });
    }
  }
});

// ─── Lesemass-Rest der Vorlagen-Schritte (Bündel K, 30.9.2026) ───────────────
//
// Posten `2026-09-30-vorlagen-640-51-zeilen-80-ch-aus-klauseltexten-ohne-classnam`
// und `2026-09-30-vorlagen-hinweise-nach-1159-4-span-hinweise-80-ch-vorlagewer`.
// Der Vollsweep (30 Vorlagen × alle Schritte) fand die Lücke im einspaltigen
// Bereich 640–767 px (ab 768 steht das Formular in der halben Spalte, ≤ 520 px):
// Hinweis-Box-TEXT bis 106 ch (@700), Kontrollkästchen-Text bis 101 ch,
// Checkbox-Hinweis (`span.block.text-xs`) bis 111 ch, `ul.text-body-s > li` bis
// 96 ch und — @640 — die Begründungstexte des Bausteinprotokolls (`p` ohne
// Klasse, aus den Schemas in src/lib/vorlagen, dort nicht änderbar) bis 88 ch.
// Fünf Klassen, je ein Deckel an der Darstellung (index.css `.lc-vorlagen-schritt
// …`, wizard.tsx VorschauPanel), nie an einer gerahmten Box:
//   notice     Box-Breite bleibt (= Eltern, ±2 px); der TEXT wird über den
//              rechten Innenabstand auf 30 rem gehalten (innere Breite 240…480 px)
//   cbText/cbHint/ulLi/protokoll   max-width 30 rem bzw. 24 rem (Hinweis)
// Zusicherung je Fall: (1) mindestens ein mehrzeiliger Fund (§6.7); (2) Mittel
// der vollen Zeilen ≤ 80 und längste Zeile ≤ 85 (+5 ch Toleranz für Zeilen aus
// schmalen Glyphen: ein 30-rem-Deckel kann einzelne Zeilen auf 81 bringen, der
// Mittelwert ist das Mass wie oben); (3) Unter- UND Obergrenze der wirksamen
// Breite (Deckel kollabiert nicht, weicht nicht von tailwind.config.js ab).
//
// ROT ZU BEKOMMEN (§6.7, Beweis im PR-Bericht): die Regeln nach dem Kommentar
// «Lesemass-Rest der Vorlagen-Schritte» in index.css und `max-w-reading-s` an der
// Protokoll-Liste (wizard.tsx) entfernen → (2) schlägt mit den Original-Werten
// (88/93/101/106/111 ch) fehl, (3) misst keinen Deckel.

type Klasse = 'notice' | 'cbText' | 'cbHint' | 'ulLi' | 'protokoll' | 'feldlabel' | 'blockerKnopf' | 'platzLi' | 'cbZeile';

const REST_SELEKTOR: Record<Klasse, string> = {
  notice: '.lc-vorlagen-schritt [class*="lc-notice"]',
  cbText: '.lc-vorlagen-schritt label.flex > span',
  cbHint: '.lc-vorlagen-schritt span.block.text-xs',
  ulLi: '.lc-vorlagen-schritt :is(ul, ol, dl).text-body-s > :is(li, dd)',
  protokoll: '[data-vorschau-panel] details.lc-card > summary + ul > li',
  // Paket P2 (30.9.2026): Feldbeschriftung, Sprungknöpfe der Offen-Liste, Leerzustand-Liste.
  // Bewusst NICHT über die Fix-Klasse `lc-feldlabel` gewählt (sonst fände der Test
  // ohne den Fix nichts und wäre «rot» nur durch Abwesenheit, nicht durch das Mass).
  feldlabel: '.lc-vorlagen-schritt label[id$="-label"]',
  // Ganze Kontrollkästchen-Zeile (Label-Kasten, Text direkt oder im span): misst
  // nur Zeichen/Zeile, unabhängig davon, WO der Deckel sitzt.
  cbZeile: '.lc-vorlagen-schritt label.flex',
  blockerKnopf: '.lc-vorlagen-schritt details > div > button.block',
  platzLi: '[data-dokument-platz] ul > li',
};
// Obergrenze des Deckels je Klasse in rem (Token aus tailwind.config.js).
const REST_REM: Record<Klasse, number> = {
  notice: pxVon('reading-s') / 16, cbText: pxVon('reading-s') / 16, cbHint: pxVon('kleintext') / 16,
  ulLi: pxVon('reading-s') / 16, protokoll: pxVon('reading-s') / 16,
  feldlabel: pxVon('reading-s') / 16, cbZeile: pxVon('reading-s') / 16, blockerKnopf: pxVon('reading-s') / 16, platzLi: pxVon('kleintext') / 16,
};
const MAX_CH_SPITZE = 85;
const MIN_INNEN_PX = 240; // innere Text-Breite der Notice — darunter kollabiert die Zeile

interface RestFund {
  ch: number; max: number; zeilen: number; zeile: string;
  deckelPx: number; innenPx: number; boxPx: number; elternPx: number; rootPx: number;
}

async function sammleRest(page: Page, klasse: Klasse, selektor?: string): Promise<RestFund[]> {
  return page.evaluate(({ sel, klasse: k }) => {
    const wortRe = /\S+/g;
    const range = document.createRange();
    const funde: RestFund[] = [];
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    for (const el of document.querySelectorAll(sel)) {
      const eb = el.getBoundingClientRect();
      if (eb.width <= 1 || eb.height <= 1) continue;
      type Wort = { t: string; weiss: boolean; x: number; cy: number; h: number };
      const woerter: Wort[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      // `weiss`: steht im Quelltext Leerraum vor dem Wort? Nur dann zählt die Lücke
      // als Zeichen (Textknoten, die ohne Leerschlag am Vorknoten kleben — Links,
      // Normchips — sonst verlängerten sie die Zeile künstlich; wie messeLesemass).
      let vorher = ' ';
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent ?? '';
        if (!text.trim()) { if (text) vorher = ' '; continue; }
        const vorKnoten = vorher;
        vorher = text.slice(-1);
        for (const m of text.matchAll(wortRe)) {
          range.setStart(n, m.index!);
          range.setEnd(n, m.index! + m[0].length);
          const rs = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          const davor = m.index! > 0 ? text[m.index! - 1] : vorKnoten;
          if (!rs.length) continue;
          // Ein am Zeilenende getrenntes Wort («(Praxis-|Standard)») hat ein Rect je
          // Zeile: Zeichen anteilig nach Breite verteilen, sonst zählte das ganze
          // Wort in JEDE Zeile (wie messeLesemass in seitenbreite.e2e.ts).
          const summe = rs.reduce((acc, r) => acc + r.width, 0);
          let ab = 0;
          rs.forEach((r, i) => {
            const bis = i === rs.length - 1 ? m[0].length : Math.round(m[0].length * (rs.slice(0, i + 1).reduce((acc, q) => acc + q.width, 0) / summe));
            woerter.push({ t: m[0].slice(ab, bis), weiss: i === 0 && (davor === '' || /\s/.test(davor)), x: r.left, cy: (r.top + r.bottom) / 2, h: r.height });
            ab = bis;
          });
        }
      }
      if (woerter.length < 2) continue;
      woerter.sort((a, b) => a.cy - b.cy || a.x - b.x);
      const zeilen: Wort[][] = [];
      for (const w of woerter) {
        const z = zeilen[zeilen.length - 1];
        if (z && Math.abs(w.cy - z[0].cy) < z[0].h / 2) z.push(w); else zeilen.push([w]);
      }
      if (zeilen.length < 2) continue;
      // Zeilenlänge: Zeichen + Lücken ZWISCHEN den Wörtern (kein Leerzeichen vor dem ersten).
      const laengen = zeilen.map((z) => { z.sort((a, b) => a.x - b.x); return z.reduce((s, w, i) => s + w.t.length + (i > 0 && w.weiss ? 1 : 0), 0); });
      const voll = laengen.slice(0, -1);
      const cs = getComputedStyle(el);
      const deckelEl = k === 'protokoll' || k === 'platzLi' ? (el.parentElement as Element) : el;
      const pb = (el.parentElement as Element).getBoundingClientRect();
      const iMax = voll.indexOf(Math.max(...voll));
      funde.push({
        ch: Math.round((voll.reduce((s, v) => s + v, 0) / voll.length) * 10) / 10,
        max: Math.max(...voll), zeilen: zeilen.length,
        zeile: zeilen[iMax].map((w) => w.t).join(' ').slice(0, 90),
        deckelPx: Math.round(parseFloat(getComputedStyle(deckelEl).maxWidth) || 0),
        innenPx: Math.round((el as HTMLElement).clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)),
        boxPx: Math.round(eb.width), elternPx: Math.round(pb.width), rootPx,
      });
    }
    return funde;
  }, { sel: selektor ?? REST_SELEKTOR[klasse], klasse });
}

interface RestFall { klasse: Klasse; slug: string; schritt: number; vps: number[]; skala?: string; ohneMuster?: boolean; selektor?: string; }

// Stellen aus dem Vollsweep (Schritt = Anzahl «Weiter» nach «Mit Musterdaten füllen»).
const REST_FAELLE: RestFall[] = [
  { klasse: 'notice', slug: 'rubrum', schritt: 3, vps: [640, 700, 1280] },
  { klasse: 'notice', slug: 'kuendigung-arbeitnehmer', schritt: 4, vps: [640, 700] },
  { klasse: 'notice', slug: 'forderungsabtretung', schritt: 0, vps: [700] },
  { klasse: 'notice', slug: 'forderungsabtretung', schritt: 0, vps: [1920], skala: '1.4' },
  { klasse: 'cbText', slug: 'klage-ordentlich', schritt: 0, vps: [640, 700] },
  { klasse: 'cbText', slug: 'schlichtungsgesuch-bs', schritt: 4, vps: [700] },
  { klasse: 'cbText', slug: 'vorsorgeauftrag', schritt: 0, vps: [700] },
  { klasse: 'cbText', slug: 'verjaehrungsverzicht', schritt: 1, vps: [1280] },
  { klasse: 'cbHint', slug: 'werkvertrag', schritt: 1, vps: [640, 700, 1280] },
  { klasse: 'ulLi', slug: 'verjaehrungsverzicht', schritt: 2, vps: [640, 700] },
  { klasse: 'protokoll', slug: 'klage-ordentlich', schritt: 0, vps: [640] },
  { klasse: 'protokoll', slug: 'verjaehrungsverzicht', schritt: 0, vps: [1280] },
  // Paket P2 (30.9.2026, Posten ag-gruendung / gmbh-gruendung): die Stellen, die
  // #1164 als Nebenfund offen liess. Werte vorher (Vorlagen-Mittel/Längste ch):
  // feldlabel 86 @640, cbText AG-Grundstück 83 @760, gmbh Checkbox 88 @640 /
  // 101 @700 (Seite ohne Wizard-Rahmen), AG-Offen-Liste 82-104 ch.
  { klasse: 'feldlabel', slug: 'ag-gruendung', schritt: 2, vps: [640] },
  { klasse: 'cbZeile', slug: 'ag-gruendung', schritt: 2, vps: [760] },
  // gmbh-gruendung liegt ohne Wizard-Rahmen: Selektor ohne Scope-Anker wählen, sonst
  // fände der Test vor dem Fix (Seite ohne `.lc-vorlagen-schritt`) gar nichts.
  { klasse: 'cbText', slug: 'gmbh-gruendung', schritt: 0, vps: [640, 700], selektor: 'main#inhalt label.flex > span' },
  { klasse: 'blockerKnopf', slug: 'ag-gruendung', schritt: 0, vps: [700, 760], ohneMuster: true },
  { klasse: 'platzLi', slug: 'ag-gruendung', schritt: 0, vps: [700, 760], ohneMuster: true },
];

test.describe('Vorlagen-Schritte: Lesemass-Rest (Bündel K)', () => {
  for (const fall of REST_FAELLE) {
    for (const vp of fall.vps) {
      const skalaTxt = fall.skala ? `, Schriftskala ${fall.skala}` : '';
      test(`${fall.klasse} ${fall.slug} S${fall.schritt} @${vp}${skalaTxt}: Mittel ≤ 80 ch, Deckel/Box in Grenzen`, async ({ page }) => {
        if (fall.skala) await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* ohne Speicher */ } }, ['lexmetrik-schriftskala', fall.skala]);
        await page.setViewportSize({ width: vp, height: 900 });
        await page.goto(`/vorlagen/${fall.slug}`);
        await bereit(page);
        if (!fall.ohneMuster) await musterdatenFuellen(page);
        await weiter(page, fall.schritt);
        await oeffneDetails(page);
        const funde = await sammleRest(page, fall.klasse, fall.selektor);
        const wo = `${fall.klasse} ${fall.slug} S${fall.schritt} @${vp}${skalaTxt}`;
        expect(funde.length, `${wo}: mindestens ein mehrzeiliger Fund erwartet (sonst prüft der Test nichts, §6.7)`).toBeGreaterThan(0);
        for (const f of funde) {
          const was = `${wo}: "${f.zeile}" (Mittel ${f.ch}, längste ${f.max}, Box ${f.boxPx}px, Deckel ${f.deckelPx}px, innen ${f.innenPx}px)`;
          expect(f.ch, `${was} Mittel`).toBeLessThanOrEqual(MAX_CH);
          expect(f.max, `${was} längste Zeile`).toBeLessThanOrEqual(MAX_CH_SPITZE);
          const obergrenze = REST_REM[fall.klasse] * f.rootPx + 1;
          if (fall.klasse === 'notice') {
            // Box bleibt so breit wie ihr Block-Elternteil (±2 px), der Text liegt im Deckel.
            expect(f.boxPx, `${was} Box-Untergrenze (Eltern ${f.elternPx}px)`).toBeGreaterThanOrEqual(f.elternPx - NOTICE_BOX_MAX_ABW_PX);
            expect(f.boxPx, `${was} Box-Obergrenze (Eltern ${f.elternPx}px)`).toBeLessThanOrEqual(f.elternPx + NOTICE_BOX_MAX_ABW_PX);
            expect(f.innenPx, `${was} Textbreite Untergrenze`).toBeGreaterThan(MIN_INNEN_PX);
            expect(f.innenPx, `${was} Textbreite Obergrenze`).toBeLessThanOrEqual(obergrenze);
          } else if (fall.klasse !== 'cbZeile') {
            expect(f.deckelPx, `${was} Deckel kollabiert`).toBeGreaterThan(MIN_DECKEL_PX);
            expect(f.deckelPx, `${was} Deckel weicht von der Token-Zahl ab`).toBeLessThanOrEqual(obergrenze);
          }
        }
      });
    }
  }
});

// ─── Kontrollkästchen/Radios behalten ihre Grösse (Paket P2, 30.9.2026) ─────
//
// Posten `2026-09-30-vorlagen-kontrollkaestchen-ohne-shrink-0-werden-zusammengedr`:
// ein rohes `<input type=checkbox|radio>` als Flex-Kind mit umbrechendem Label
// schrumpfte auf sein Eigenmass (Chromium ~13 px statt 1.1 rem = 17.6 px) —
// nur der Baustein `Checkbox` trug `shrink-0`. Vollsweep vorher (30 Vorlagen,
// alle Schritte, Musterdaten, 320/375/640/700/760/1024/1280): 27 von 1571
// Kästchen zu klein, u. a. fristerstreckung S2 @375 (13 px), schlichtungsgesuch-bs
// S4 @375 (13), ag-gruendung S2 @640…1280 (13–16), testament S2 @320 (14.6).
// Fix EINMAL an der globalen Regel `input[type=checkbox], input[type=radio]`
// (index.css: `flex-shrink: 0`). Zusicherung: JEDES sichtbare Kästchen/Radio der
// Seite ist so breit und hoch wie 1.1 rem (−0.5 px Rundung), und es gibt
// mindestens eines (sonst prüft der Test nichts, §6.7).
//
// ROT ZU BEKOMMEN (§6.7): `flex-shrink: 0` in index.css entfernen → die Fälle
// unten melden 13…15 px statt 17.6 px.

interface KastenFall { slug: string; schritt: number; vps: number[]; }
const KASTEN_FAELLE: KastenFall[] = [
  { slug: 'fristerstreckung', schritt: 1, vps: [375, 1024] },
  { slug: 'schlichtungsgesuch-bs', schritt: 3, vps: [375, 1024] },
  { slug: 'schlichtungsgesuch-bs', schritt: 5, vps: [375, 1024] },
  { slug: 'ag-gruendung', schritt: 2, vps: [640, 1280] },
  { slug: 'testament', schritt: 1, vps: [320] },
];

test.describe('Vorlagen: Kontrollkästchen und Radios behalten ihre Grösse (P2)', () => {
  for (const fall of KASTEN_FAELLE) {
    for (const vp of fall.vps) {
      test(`${fall.slug} S${fall.schritt} @${vp}: Kästchen/Radios ≥ 1.1 rem`, async ({ page }) => {
        await page.setViewportSize({ width: vp, height: 900 });
        await page.goto(`/vorlagen/${fall.slug}`);
        await bereit(page);
        await musterdatenFuellen(page);
        await weiter(page, fall.schritt);
        await oeffneDetails(page);
        const r = await page.evaluate(() => {
          const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
          const kleine: string[] = [];
          let n = 0;
          for (const i of document.querySelectorAll('main#inhalt input[type="checkbox"], main#inhalt input[type="radio"]')) {
            const b = i.getBoundingClientRect();
            if (b.width < 1) continue;
            n++;
            if (b.width < 1.1 * root - 0.5 || b.height < 1.1 * root - 0.5) {
              kleine.push(`${(i as HTMLInputElement).type} ${b.width.toFixed(1)}×${b.height.toFixed(1)} px «${(i.closest('label')?.textContent ?? '').trim().slice(0, 50)}»`);
            }
          }
          return { n, kleine, soll: 1.1 * root };
        });
        expect(r.n, `${fall.slug} S${fall.schritt} @${vp}: mindestens ein Kästchen/Radio erwartet (sonst prüft der Test nichts, §6.7)`).toBeGreaterThan(0);
        expect(r.kleine, `${fall.slug} S${fall.schritt} @${vp}: zusammengedrückt (Soll ${r.soll} px)`).toEqual([]);
      });
    }
  }
});
