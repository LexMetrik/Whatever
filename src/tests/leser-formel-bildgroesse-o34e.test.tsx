/**
 * LESER-NAV/O-34e · «Formeln winzig» (ED5-D01).
 *
 * Befund (15.10.2026, Dev-Server, Playwright-Chromium 1440, `/gesetze/bund/DBG#art-22`):
 * die Formel-PNG (1136×141 px natürlich) wurde mit den HTML-Attributen
 * width=58/height=7 gesetzt und stand 58×9 CSS-px klein (unlesbar). `breite`/`hoehe`
 * stammen aus Fedlex `data-scaled-width/-height` und sind PHYSISCHE Satzmasse in mm,
 * nicht Pixel: 1136 px / 58 mm = 19.6 px/mm (≈ 498 dpi). Fedlex trägt am <img> zusätzlich
 * `data-original-page-width` (148 = A5 bzw. 210 = A4) und `data-original-text-width`
 * (124/108/187) und rendert die Breite als Prozent der Textspalte (scaled-width /
 * original-text-width × 100 %; Fedlex-Frontend chunk-46JVRAFU.js, scaledElementWidthHeight).
 * Diese Prozent-Darstellung braucht den Extraktor (Risiko-Pfad, `text-width` wird nicht
 * mitgeführt, s. FB); BildFigur setzt die Breite darum in mm als Näherung, die Attribute
 * bleiben als Seitenverhältnis-Reserve (CLS = 0), `max-w-full` fängt breite Bilder ab.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BildFigur } from '../components/normtext/BildElemente';

const html = (bild: Parameters<typeof BildFigur>[0]['bild']) => renderToStaticMarkup(createElement(BildFigur, { bild }));

describe('BildFigur · Grösse aus Fedlex-Massen (mm)', () => {
  it('Formel DBG Art. 22: Breite 58 mm statt 58 px', () => {
    const h = html({ datei: 'bilder/dbg/image1.png', alt: 'Amtliche Abbildung', formel: true, breite: 58, hoehe: 7 });
    expect(h).toContain('width:58mm');
    expect(h).toContain('max-w-full');
    expect(h).toContain('Amtliche Formel');
  });
  it('Seitenverhältnis-Reserve bleibt (width/height-Attribute, CLS)', () => {
    const h = html({ datei: 'bilder/dbg/image1.png', alt: 'x', formel: true, breite: 58, hoehe: 7 });
    expect(h).toContain('width="58"');
    expect(h).toContain('height="7"');
  });
  it('Randfall ohne Masse (KKG annex_1): keine Breitenvorgabe, kein «undefinedmm»', () => {
    const h = html({ datei: 'bilder/kkg/image1.png', alt: 'x', formel: true });
    expect(h).not.toContain('mm');
    expect(h).not.toContain('undefined');
  });
  it('Randfall Abbildung (nicht Formel): gleiche Grössenregel, andere Beschriftung', () => {
    const h = html({ datei: 'bilder/mepv/image1.png', alt: 'x', breite: 56, hoehe: 21 });
    expect(h).toContain('width:56mm');
    expect(h).toContain('Amtliche Abbildung');
  });
});
