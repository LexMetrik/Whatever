/**
 * W2·19-DESIGN-KONSISTENZ P2 — Befund DK-15, Entscheid David 1.10.2026 (W-HN-2 a):
 * die Registerfarbe (`--reg-g/r/m/w`) ist als SCHRIFT nur eng erlaubt —
 * Gruppentitel und Listenlinks auf Papier. Zähler und Kleintext bleiben Tinte
 * (`ink-*`); auf einer Registerfläche steht nie Registerfarbe als Text (F0.2).
 *
 * BEFUND (Prüfung 24.9.2026, DK-15): die Tafeln färbten Zähler, Metazeilen und
 * Kennungen in der Registerfarbe, das Reglement kannte das nicht.
 *
 * QUELLTEXT-SONDE (Bauart `design-r9-link-form.test.ts`): bewacht wird «die
 * Form kommt ausserhalb der erlaubten Rollen nicht vor». Die Rolle liest die
 * Sonde am Quelltext selbst, nicht aus einer Datei-Liste:
 *   · Gruppentitel  = Klassenzeile mit den Token `font-display` UND `text-h3`
 *                     (die Gliederungsnummer im `GruppenKopf`-Marke-Platz, so
 *                     tragen sie BundSystematik/KantonSystematik/GesetzeGliederung;
 *                     ein blosses `text-h3` ist auch ein Zähler) oder Überschrift
 *                     `<h2>`–`<h4>`;
 *   · Listenlink    = Klassenzeile mit dem ECHTEN Token `underline` im Ruhezustand
 *                     (F0.8: Links tragen den Strich) an einem Nicht-Knopf — nicht
 *                     `no-underline`, nicht `underline-offset-*`, nicht
 *                     `hover:underline` (Strich erst beim Überfahren ist kein Strich);
 *                     ein `<button>` ist ein Bedienknopf, kein Listenlink («Alle
 *                     auf-/einklappen» steht darum in Tinte, Nachzug 1.10.2026).
 * Im CSS gilt eine Selektor-Liste (unten) — jede Farb-Deklaration aus
 * `--reg-*` oder `--reg-marke` ausserhalb davon ist ein Verstoss.
 *
 * Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { alleTsx, APP_WURZEL, liesRoh, ohneKommentare, rel } from './appDateien';

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** Ganzes Klassen-Token (ohne Variante, ohne Bindestrich-Nachbarn): `x` ≠ `no-x`, `x-offset-4`, `hover:x`. */
const token = (zeile: string, name: string): boolean =>
  new RegExp(`(?<![-:\\w])${name}(?![-\\w])`).test(zeile);

/** Alle `text-reg-*`-Fundstellen (auch mit Variante) ausserhalb der erlaubten Rollen. */
function verstoesseTsx(quelle: string): string[] {
  const out: string[] = [];
  const re = /text-reg-[grmw]\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(quelle))) {
    const links = Math.max(
      quelle.lastIndexOf('"', m.index), quelle.lastIndexOf("'", m.index), quelle.lastIndexOf('`', m.index),
    );
    const rechts = [quelle.indexOf('"', m.index), quelle.indexOf("'", m.index), quelle.indexOf('`', m.index)]
      .filter((i) => i >= 0).reduce((a, b) => Math.min(a, b), Infinity);
    const zeile = quelle.slice(links + 1, rechts);
    const davor = quelle.slice(Math.max(0, m.index - 160), m.index);
    const gruppentitel = (token(zeile, 'font-display') && token(zeile, 'text-h3')) || /<h[2-4]\b[^<>]*$/.test(davor);
    const knopf = /^<button\b/.test(quelle.slice(quelle.lastIndexOf('<', links)));
    const listenlink = token(zeile, 'underline') && !knopf;
    if (!gruppentitel && !listenlink) out.push(`…${norm(zeile)}…`);
  }
  return out;
}

/**
 * Selektoren, deren `color` aus der Registerfarbe kommt — jeder mit seiner Rolle.
 * `.lc-wahl-kachel…::after` ist das Häkchen-ZEICHEN der gewählten Kachel (Marke
 * neben dem 3-px-Strich, kein Text); die Zeilen mit `:hover`/`:focus-visible`
 * sind der Zustand eines Listenlinks.
 */
const CSS_ERLAUBT: Record<string, string> = {
  '.lc-wahl-kachel[aria-pressed="true"]::after': 'Zeichen/Marke',
  '.lc-route[data-reg] .lc-randtitel': 'Gruppentitel',
  '.lc-route[data-reg] header .lc-overline': 'Gruppentitel (Randtitel)',
  '.lc-route[data-reg] legend.lc-overline': 'Gruppentitel (Randtitel)',
  '.ub-kern a': 'Listenlink (Kernerlasse)',
  '.kt-einstieg a': 'Listenlink',
  '.kt-weiter': 'Listenlink',
  '.lc-normzeile [role="button"].lc-chip:hover': 'Listenlink-Zustand',
  '.lc-normzeile [role="button"].lc-chip:focus-visible': 'Listenlink-Zustand',
  '.lc-normzeile button.lc-chip:hover': 'Listenlink-Zustand',
  '.lc-normzeile button.lc-chip:focus-visible': 'Listenlink-Zustand',
  '.ab-link:hover': 'Listenlink-Zustand',
};

function verstoesseCss(css: string): string[] {
  const roh = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: string[] = [];
  for (const m of roh.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const farbe = m[2].split(';').map((d) => d.trim())
      .find((d) => /^color\s*:/.test(d) && /var\(--(reg-[grmw]|reg-marke|ab-reg|tafel-reg)\b/.test(d));
    if (!farbe) continue;
    for (const sel of m[1].split(',').map(norm)) {
      if (!(sel in CSS_ERLAUBT)) out.push(`${sel} { ${farbe} }`);
    }
  }
  return out;
}

describe('DK-15 · Registerfarbe als Schrift nur eng (Entscheid David 1.10.2026, W-HN-2 a)', () => {
  it('TSX: kein `text-reg-*` ausserhalb von Gruppentitel und Listenlink', () => {
    const treffer = alleTsx().flatMap((f) => verstoesseTsx(ohneKommentare(liesRoh(f))).map((v) => `${rel(f)}: ${v}`));
    expect(treffer, 'Zähler und Kleintext stehen in Tinte (ink-*), F0.2').toEqual([]);
  });

  it('CSS: `color` aus Registerfarbe nur in der Rollen-Liste', () => {
    expect(verstoesseCss(liesRoh(join(APP_WURZEL, 'index.css')))).toEqual([]);
  });

  it('Kontrolle der Sonde: erkennt Zähler, Kleintext, Flächen-Text und lässt die Rollen durch', () => {
    expect(verstoesseTsx('<span className="num text-xs text-reg-g shrink-0">{n}</span>')).toHaveLength(1);
    expect(verstoesseTsx("<span className={`num ${a ? 'text-reg-w' : ''}`}>1</span>")).toHaveLength(1);
    expect(verstoesseTsx('<span className="lc-overline text-reg-r">Etikett</span>')).toHaveLength(1);
    expect(verstoesseTsx('<span className="font-display text-h3 text-reg-g">0.1</span>')).toEqual([]);
    expect(verstoesseTsx('<Link to="/x" className="text-body-s font-medium text-reg-g underline underline-offset-4">Alle</Link>')).toEqual([]);
    // Nachzug 1.10.2026 (Zweitprüfung): Zähler mit Schein-Merkmalen sind KEINE Rollen.
    expect(verstoesseTsx('<a className="no-underline text-xs text-reg-g">12</a>')).toHaveLength(1);
    expect(verstoesseTsx('<span className="num text-h3 text-reg-r">3</span>')).toHaveLength(1);
    expect(verstoesseTsx('<a className="underline-offset-4 text-reg-g">12</a>')).toHaveLength(1);
    expect(verstoesseTsx('<a className="hover:underline text-reg-g">12</a>')).toHaveLength(1);
    expect(verstoesseTsx('<button type="button" className="text-body-s text-reg-g underline">Alle aufklappen</button>')).toHaveLength(1);
    expect(verstoesseTsx('<h2 className="lc-overline text-reg-r">Live-Suche</h2>')).toEqual([]);
    expect(verstoesseCss('.tb-extern { color: var(--reg-g); }')).toHaveLength(1);
    expect(verstoesseCss('.lc-route[data-reg] .lc-titelblatt-band .lc-overline { color: var(--reg-marke); }')).toHaveLength(1);
    expect(verstoesseCss('.ub-kern a { color: var(--reg-marke, var(--ink-900)); }')).toEqual([]);
    expect(verstoesseCss('.x { border-top-color: var(--reg-g); background: var(--reg-g-flaeche); }')).toEqual([]);
  });

  it('Registerfläche: das Titelblatt-Band trägt für JEDES Register Tinte, nicht Registerfarbe', () => {
    const css = liesRoh(join(APP_WURZEL, 'index.css'));
    expect(css).toMatch(/\.lc-route\[data-reg\]\s+\.lc-titelblatt-band\s+\.lc-overline(:where\(:not\([^{}]*\)\))?\s*\{\s*color:\s*var\(--ink-600\);/);
    // …und lässt eine Overline mit eigener Farb-Utility (`text-danger-*`) in Ruhe (§8), wie DK-16.
    expect(css).toMatch(/\.lc-titelblatt-band\s+\.lc-overline:where\(:not\(\[class\^="text-"\], \[class\*=" text-"\], \[class\*=":text-"\]\)\)\s*\{\s*color:\s*var\(--ink-600\);/);
  });

  it('Reglement F0.2 trägt die Erlaubnis samt Entscheid', () => {
    const regl = liesRoh(join(APP_WURZEL, '..', 'DESIGN-REGLEMENT.md'));
    const f02 = regl.slice(regl.indexOf('**F0.2'), regl.indexOf('**F0.2') + 2600);
    expect(f02).toContain('W-HN-2 a');
  });
});
