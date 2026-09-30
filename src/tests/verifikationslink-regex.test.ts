// Regex-Äquivalenz alt↔neu und Laufzeit für AMTLICHER_NAMENS_ANKER (Posten 30.9.2026, W2·27-BUND-FERTIG).
//
// Der Regex in src/lib/normtext/verifikationslink.ts wurde von der backtrackenden Form
// /^t*a\d+[a-z]*(?:\d+[a-z]*)*$/ auf die lineare /^t*a\d[a-z0-9]*$/ umgestellt.
// Formaler Beweis (Kommentar am Regex): (\d+[a-z]*)(\d+[a-z]*)* = (\d+[a-z]*)+ ist die Menge der
// nichtleeren Wörter über [0-9a-z], die mit einer Ziffer beginnen, = \d[a-z0-9]*.
// Hier der empirische Gegenbeweis über die öffentliche Schnittstelle (der Regex ist nicht
// exportiert): bei «__N»-Token gibt verifizierLinkArtikel das Fragment genau dann frei, wenn der
// Namens-Anker-Regex passt.
import { describe, it, expect } from 'vitest';
import { verifizierLinkArtikel } from '../lib/normtext/verifikationslink';

const ALT = /^t*a\d+[a-z]*(?:\d+[a-z]*)*$/; // frühere, katastrophal backtrackende Fassung (NUR kurze Eingaben!)
const BASIS = 'https://www.fedlex.admin.ch/eli/cc/2006/859/de';
const GELTEND = { aufgehoben: false };

/** Produktiv-Verhalten: Freigabe eines «__N»-Tokens mit Fragment `f` (= Regex trifft). */
const neu = (f: string): boolean =>
  verifizierLinkArtikel({ ebene: 'bund', artikel: 'x__2', quelleUrl: `${BASIS}#${f}` }, GELTEND) != null;

/** Regex-freie Zeichen-Schleife derselben Sprache (zweite Implementierung, kein Regex-Dialekt-Risiko). */
function schleife(f: string): boolean {
  let i = 0;
  while (f[i] === 't') i += 1;
  if (f[i] !== 'a') return false;
  i += 1;
  if (f[i] === undefined || f[i] < '0' || f[i] > '9') return false;
  for (; i < f.length; i += 1) {
    const c = f[i];
    if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'z'))) return false;
  }
  return true;
}

describe('AMTLICHER_NAMENS_ANKER — Äquivalenz alte/neue Form und lineare Laufzeit', () => {
  it('erschöpfend: alle Wörter 1–8 Zeichen über {t,a,0,b,_} — alt = neu = Zeichen-Schleife', () => {
    const alpha = ['t', 'a', '0', 'b', '_'];
    let n = 0;
    let treffer = 0;
    const gen = (wort: string, rest: number): void => {
      if (wort !== '') {
        n += 1;
        const a = ALT.test(wort);
        if (a) treffer += 1;
        expect(neu(wort), wort).toBe(a);
        expect(schleife(wort), wort).toBe(a);
      }
      if (rest === 0) return;
      for (const c of alpha) gen(wort + c, rest - 1);
    };
    gen('', 8);
    expect(n).toBe(5 + 25 + 125 + 625 + 3125 + 15625 + 78125 + 390625);
    expect(treffer).toBeGreaterThan(1000); // Sabotage-Schutz: weder leer noch alles (§6.7b)
    expect(treffer).toBeLessThan(n);
  });

  it('Zufall: 100 000 Wörter aus {t,a,0-9,a-z,A-C,Z,_,/,#,-,ä,Leer} plus Grenzfälle — 0 Abweichung', () => {
    const alphabet = 'taaa0123456789abcdefghijklmnopqrstuvwxyzABCZ_/#-ä ';
    let s = 12345; // deterministischer LCG (§2): gleiche Eingabe → gleiche Ausgabe
    const zufall = (m: number): number => {
      s = (Math.imul(s, 1103515245) + 12345) >>> 0;
      return (s >>> 8) % m;
    };
    const grenzfaelle = [
      'ta', 'ta1', 'a1', 'a', 't', 'tta1', 'Ta1', 'tA1', 'ta1A', 'ta1 ', ' ta1', 'ta1\n', 'ta١', 'ta1ä',
      'a1b2c3', 'a1b2c', 'ab1', 'ta126z', 'ta126z_x', 'a28d28f', 'a28d_28f', 'tta', 'tta0',
    ];
    let abweichungen = 0;
    let treffer = 0;
    const pruefe = (w: string): void => {
      const a = ALT.test(w);
      if (a) treffer += 1;
      if (neu(w) !== a || schleife(w) !== a) abweichungen += 1;
    };
    grenzfaelle.forEach(pruefe);
    for (let k = 0; k < 100_000; k += 1) {
      let w = 't'.repeat(zufall(3)) + (zufall(3) === 0 ? '' : 'a');
      const len = 1 + zufall(12);
      for (let j = 0; j < len; j += 1) w += alphabet[zufall(alphabet.length)];
      pruefe(w);
    }
    expect(abweichungen).toBe(0);
    expect(treffer).toBeGreaterThan(1000); // Sabotage-Schutz: genug echte Treffer im Zufallsstrom
    expect(ALT.test('ta1')).toBe(true); // Grenzfälle tragen Treffer und Nichttreffer
    expect(ALT.test('Ta1')).toBe(false);
  });

  it('Laufzeit: lange Nicht-Treffer-Eingaben (Ziffernketten + Fremdzeichen) in linearer Zeit', () => {
    const t0 = performance.now();
    for (const n of [28, 1_000, 100_000]) {
      expect(neu(`ta${'1'.repeat(n)}_`)).toBe(false);
      expect(neu(`ta${'1a'.repeat(n)}/`)).toBe(false);
      expect(neu(`ta${'1'.repeat(n)}`)).toBe(true);
    }
    // Alt: bereits n=28 ≈ 1,6 s (exponentiell), n=100 000 praktisch unendlich. Neu: Millisekunden.
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
