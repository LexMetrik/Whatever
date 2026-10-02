import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kontrast, type Mode } from '../../scripts/farbwelt-messung';
import { kuerzelHinterModal } from '../components/suche/fruehesSuchKuerzel';

// ─── W2·17-UI-BEFUNDE · Suchfeld und Such-Hervorhebung des Gesetzesleser ─────
//
// (1) C2-B01/B02 · das Such-Kürzel (⌘K, Ctrl+K, «/») gehört nie einem Feld
//     HINTER einem offenen modalen Dialog. Die ENTSCHEIDUNG ist rein
//     (`kuerzelHinterModal`) und wird hier an jeder Lage geprüft; dass alle
//     DREI Empfänger sie befragen, steht als Quellensonde da (Vitest läuft ohne
//     DOM, `environment: 'node'`). Das Verhalten im Browser beweist
//     `e2e/leser-suchfeld.e2e.ts` (c)/(d).
// (2) C1-B01 · Enter sucht mit dem aktuellen Feldinhalt (Quellensonde; das
//     Verhalten beweist e2e (a)/(b)).
// (3) Such-Hervorhebung ≥ 3:1 gegen das Papier, Text darauf ≥ 4.5:1, der
//     Sprung-Blink hebt sich ab (Entscheid David 2.10.2026) — GERECHNET mit
//     derselben Quelle wie das Farbwelt-Tor (`scripts/farbwelt-messung.ts`).

const lies = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf8');

type Modal = { contains: (n: unknown) => boolean };
const modal = (enthaelt: unknown[]): Modal => ({ contains: (n) => enthaelt.includes(n) });
const feld = { id: 'feld' };
const fremd = { id: 'fremdes-feld' };

describe('kuerzelHinterModal — liegt das Suchfeld hinter einem offenen modalen Dialog?', () => {
  it('ohne modalen Dialog: nie', () => {
    expect(kuerzelHinterModal(feld, [])).toBe(false);
    expect(kuerzelHinterModal(null, [])).toBe(false);
  });

  it('offener Dialog, Feld NICHT darin: ja (der Befund — Fokus würde hinter den Dialog springen)', () => {
    expect(kuerzelHinterModal(feld, [modal([fremd])])).toBe(true);
  });

  it('offener Dialog, Feld fehlt (noch nicht gerendert): ja — nichts, was dahinter wartet, wird bedient', () => {
    expect(kuerzelHinterModal(null, [modal([fremd])])).toBe(true);
  });

  it('das Feld steht IM Dialog (Gliederungs-Sheet, A2): nein — dort bleibt das Kürzel bedienbar', () => {
    expect(kuerzelHinterModal(feld, [modal([feld])])).toBe(false);
  });

  it('zwei Dialoge, das Feld nur in einem: ja — der andere läge über dem Feld', () => {
    expect(kuerzelHinterModal(feld, [modal([feld]), modal([fremd])])).toBe(true);
  });
});

describe('alle drei Empfänger des Such-Kürzels befragen dieselbe Entscheidung (§5)', () => {
  const empfaenger: Array<[string, string]> = [
    ['Vorlauf vor dem ersten React-Commit', 'components/suche/fruehesSuchKuerzel.ts'],
    ['Kopfleisten-Suche (C2-B02)', 'components/layout/HeaderSuche.tsx'],
    ['V3-Leser-Feld (C2-B01)', 'pages/gesetz-leser/v3/suchKuerzel.ts'],
  ];
  for (const [name, datei] of empfaenger) {
    it(`${name} — ${datei}`, () => {
      const q = lies(datei).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      // Nicht nur importiert, sondern aufgerufen — und VOR dem preventDefault.
      const aufruf = q.search(/kuerzelHinterModal\(/);
      expect(aufruf, `${datei} ruft kuerzelHinterModal nicht auf`).toBeGreaterThan(-1);
      const erstesPrevent = q.search(/preventDefault\(\)/);
      if (erstesPrevent > -1) {
        // Die Sperre kommt vor dem ersten Beanspruchen des Tastendrucks, sonst
        // schluckte der Empfänger die Taste und täte dennoch nichts.
        const ersteSperre = q.search(/if \(kuerzelHinterModal\(|kuerzelHinterModal\([^)]*\)\) return/);
        expect(ersteSperre, `${datei}: Sperre fehlt vor dem preventDefault`).toBeGreaterThan(-1);
        expect(ersteSperre).toBeLessThan(erstesPrevent);
      }
    });
  }
});

describe('C1-B01 · Enter sucht mit dem aktuellen Feldinhalt (Quellensonde)', () => {
  it('SuchSprungFeld liest den Wert beim Enter aus dem Feld und bestätigt ihn vor dem Schritt', () => {
    const q = lies('pages/gesetz-leser/v3/SuchSprungFeld.tsx').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const enter = q.slice(q.indexOf("e.key === 'Enter'"));
    expect(enter, 'Enter-Zweig liest nicht den Feldinhalt (ref.current.value)').toMatch(/ref\.current\?\.value/);
    expect(enter, 'Enter-Zweig bestätigt den Wert nicht (setzeWert)').toMatch(/setzeWert\(/);
  });

  it('der Suchzustand zieht den entprellten Wert bei einer Bestätigung sofort nach', () => {
    const q = lies('pages/gesetz-leser/inhalt-zustand.tsx').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(q, 'setSuche ist nicht mehr der nackte State-Setter').not.toMatch(/const \[suche, setSuche\] = useState/);
    expect(q, 'kein Sofort-Nachzug von sucheDebounced').toMatch(/setSucheDebounced\(/);
  });
});

describe('Such-Hervorhebung ≥ 3:1 — hell UND dunkel (Entscheid David 2.10.2026)', () => {
  const modi: Mode[] = ['hell', 'dunkel'];

  for (const modus of modi) {
    it(`${modus}: die Markierungsfläche trägt ≥ 3:1 gegen das Papier`, () => {
      expect(kontrast('such-treffer', 'paper', modus)).toBeGreaterThanOrEqual(3);
    });

    it(`${modus}: der Text auf der Markierung behält ≥ 4.5:1`, () => {
      expect(kontrast('such-treffer-tinte', 'such-treffer', modus)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${modus}: der Sprung-Blink ist sichtbar (≥ 1.5:1 gegen das Papier) und bleibt schwächer als der Treffer`, () => {
      const sprung = kontrast('such-sprung', 'paper', modus);
      expect(sprung).toBeGreaterThanOrEqual(1.5);
      expect(sprung).toBeLessThan(kontrast('such-treffer', 'paper', modus));
    });

    it(`${modus}: ein Treffer INNERHALB des blinkenden Artikels hebt sich ab (≥ 1.5:1 gegen die Blink-Fläche)`, () => {
      expect(kontrast('such-treffer', 'such-sprung', modus)).toBeGreaterThanOrEqual(1.5);
    });

    it(`${modus}: der Text auf der Blink-Fläche behält ≥ 4.5:1`, () => {
      expect(kontrast('ink-900', 'such-sprung', modus)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('die Regeln in index.css lesen genau diese Tokens', () => {
    const css = lies('index.css');
    expect(css).toMatch(/::highlight\(lc-such-treffer\)\s*\{\s*background-color:\s*var\(--such-treffer\);\s*color:\s*var\(--such-treffer-tinte\);\s*\}/);
    expect(css).toMatch(/@keyframes lc-ziel-blink\s*\{\s*0%\s*\{\s*background:\s*var\(--such-sprung\);/);
  });
});
