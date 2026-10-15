/**
 * LESER-NAV (15.10.2026) — HN-D2 «Eine Titel- und Abschnittsordnung», Rest
 * «Zwei Band-Rezepte → eines» (FEHLERBESTAND Teil B).
 *
 * Bewacht, dass das Titelblatt-Band EIN Rezept hat: Fläche, 2-px-Strich und
 * Innenabstand stehen in genau EINER Regel (`.ub-kopf, .lc-titelblatt-band`) und
 * lesen die Register-Variablen `--reg-marke-flaeche` / `--reg-marke`. Alles, was
 * das Band sonst am Band selbst setzt, ist ein Modifier und trägt nur diese zwei
 * Variablen (Leser: fest «Gesetze», `data-reg="r"`, Route «m»; Werkzeug: `.wk-kopf`).
 * Vor LESER-NAV standen zwei Kopien (`.ub-kopf` und `.lc-titelblatt-band`, dazu
 * je eine Einzelregel für «r» und «m») — eine Farb- oder Mass-Änderung am Band
 * wäre an einer Stelle angekommen und an der anderen nicht.
 *
 * Ein Tor, das nicht scheitern kann, ist keines (§6.7): die Negativ-Kontrollen
 * lassen die Prüfung an der Vorher-Form (zwei Rezepte) rot werden.
 */
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { APP_WURZEL, liesRoh, ohneKommentare } from './appDateien';

const CSS = ohneKommentare(liesRoh(join(APP_WURZEL, 'index.css')));

/** Das Band selbst ist Subjekt des Selektors (nicht ein Nachfahre davon). */
const BAND_SUBJEKT = /(?:^|[\s>+~])(?:\.ub-kopf|\.lc-titelblatt-band)(?:\[[^\]]*\])*$/;
const REZEPT_PROPS = /^(?:background(?:-color|-image)?|border-top(?:-color|-width|-style)?|padding(?:-top|-bottom|-left|-right)?)$/;

interface Regel { selektoren: string[]; deklarationen: Array<[string, string]> }

function regeln(css: string): Regel[] {
  const aus: Regel[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selektoren = m[1].replace(/@layer[^{;]*$/, '').split(',').map((s) => s.trim()).filter(Boolean);
    const deklarationen = m[2].split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
      const i = d.indexOf(':');
      return [d.slice(0, i).trim(), d.slice(i + 1).trim()] as [string, string];
    });
    aus.push({ selektoren, deklarationen });
  }
  return aus;
}

const IST_REZEPT = (r: Regel) =>
  r.selektoren.length === 2 && r.selektoren.includes('.ub-kopf') && r.selektoren.includes('.lc-titelblatt-band');

/** Befunde: Band-Regeln, die ein Rezept-Mass am Band setzen, ohne DIE Rezept-Regel zu sein. */
export function bandRezeptVerstoesse(css: string): string[] {
  const funde: string[] = [];
  for (const r of regeln(css)) {
    const band = r.selektoren.filter((s) => BAND_SUBJEKT.test(s));
    if (band.length === 0 || IST_REZEPT(r)) continue;
    const eigen = r.deklarationen.filter(([p]) => REZEPT_PROPS.test(p)).map(([p]) => p);
    if (eigen.length > 0) funde.push(`${band.join(', ')} { ${eigen.join(', ')} }`);
  }
  return funde;
}

describe('LESER-NAV — ein Band-Rezept', () => {
  it('genau EINE Regel trägt das Rezept, und sie liest die Register-Variablen', () => {
    const rezepte = regeln(CSS).filter(IST_REZEPT);
    expect(rezepte, 'genau eine Rezept-Regel für `.ub-kopf, .lc-titelblatt-band`').toHaveLength(1);
    const d = Object.fromEntries(rezepte[0].deklarationen);
    expect(d['background']).toBe('var(--reg-marke-flaeche, var(--well))');
    expect(d['border-top']).toBe('2px solid var(--reg-marke, var(--rule))');
    expect(d['padding']).toBe('0.875rem 1rem 1rem');
  });

  it('kein Modifier setzt Fläche, Strich oder Innenabstand am Band (nur die zwei Variablen)', () => {
    expect(bandRezeptVerstoesse(CSS)).toEqual([]);
  });

  it('die Modifier tragen die Register-Wahl: Leser fest «g», `data-reg="r"`, Route «m»; Werkzeug fest «w»', () => {
    const erwartet: Array<[string, string]> = [
      ['.lc-titelblatt-band', 'g'],
      ['.lc-titelblatt-band[data-reg="r"]', 'r'],
      ['.lc-route[data-reg="m"] .lc-titelblatt-band', 'm'],
      ['.wk-kopf', 'w'],
    ];
    for (const [sel, reg] of erwartet) {
      const r = regeln(CSS).find((x) => x.selektoren.length === 1 && x.selektoren[0] === sel);
      expect(r, `Modifier ${sel}`).toBeDefined();
      const d = Object.fromEntries(r!.deklarationen);
      expect(d['--reg-marke'], sel).toBe(`var(--reg-${reg})`);
      expect(d['--reg-marke-flaeche'], sel).toBe(`var(--reg-${reg}-flaeche)`);
      expect(Object.keys(d).sort(), `${sel} setzt nur die zwei Variablen`).toEqual(['--reg-marke', '--reg-marke-flaeche']);
    }
  });

  it('NEGATIV-KONTROLLE: die Vorher-Form (zwei Rezepte) fällt auf', () => {
    const vorher = [
      '.ub-kopf { background: var(--reg-marke-flaeche, var(--well)); border-top: 2px solid var(--reg-marke, var(--rule)); padding: 0.875rem 1rem 1rem; }',
      '.lc-titelblatt-band { background: var(--reg-g-flaeche); border-top: 2px solid var(--reg-g); padding: 0.875rem 1rem 1rem; }',
      '.lc-titelblatt-band[data-reg="r"] { background: var(--reg-r-flaeche); border-top-color: var(--reg-r); }',
      '.lc-route[data-reg="m"] .lc-titelblatt-band { background: var(--reg-m-flaeche); border-top-color: var(--reg-m); }',
    ].join('\n');
    expect(regeln(vorher).filter(IST_REZEPT)).toHaveLength(0);
    expect(bandRezeptVerstoesse(vorher)).toEqual([
      '.ub-kopf { background, border-top, padding }',
      '.lc-titelblatt-band { background, border-top, padding }',
      '.lc-titelblatt-band[data-reg="r"] { background, border-top-color }',
      '.lc-route[data-reg="m"] .lc-titelblatt-band { background, border-top-color }',
    ]);
  });

  it('NEGATIV-KONTROLLE: Nachfahren des Bandes (Overline, H1) gelten nicht als Band', () => {
    expect(bandRezeptVerstoesse('.ub-kopf h1 { padding: 0; }\n.lc-titelblatt-band .lc-overline { color: red; }')).toEqual([]);
    expect(bandRezeptVerstoesse('.ub-kopf { padding: 0; }')).toEqual(['.ub-kopf { padding }']);
  });
});
