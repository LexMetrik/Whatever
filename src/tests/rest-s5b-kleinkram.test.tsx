/**
 * W2·29-WERKBANK-REST S5b (25.9.2026) · Gesetze-/Leser-/Werkzeug-Kleinkram.
 *
 * Sichert die Zusagen der Scheibe, die weder die Flächen-Ratschen (sichtbarer
 * Text, keine Klassen) noch die e2e-Sonden eindeutig sehen. Je Block ein
 * Posten; Rot-Beweise im Bau-Bericht / PR-Body.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const quelle = (p: string) => readFileSync(p, 'utf8');

function tsxDateien(dir: string): string[] {
  const aus: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== 'tests') aus.push(...tsxDateien(p)); }
    else if (p.endsWith('.tsx')) aus.push(p);
  }
  return aus;
}

describe('Ladeanzeige: EIN Baustein, keine Kopie der Ablesekante (Posten #1097-Rest)', () => {
  it('ausser ui/Ladeanzeige trägt keine Datei ein Markup «scale-rule» + «max-w-[200px]» (Klassenfolge egal)', () => {
    const funde: string[] = [];
    for (const p of tsxDateien('src')) {
      if (p.endsWith(join('ui', 'Ladeanzeige.tsx'))) continue;
      quelle(p).split('\n').forEach((z, i) => {
        if (/className=/.test(z) && /\bscale-rule\b/.test(z) && /max-w-\[200px\]/.test(z)) funde.push(`${p}:${i + 1}`);
      });
    }
    expect(funde).toEqual([]);
  });
  it('Gesetze und Rechtsprechung laden mit dem Baustein (Wortlaut unverändert)', () => {
    expect(quelle('src/pages/Gesetze.tsx')).toContain('<Ladeanzeige text="Die Sammlung wird abgerufen …" className="min-h-inhalt-region py-12" />');
    expect(quelle('src/pages/Rechtsprechung.tsx')).toContain('<Ladeanzeige text="Die Sammlung wird abgerufen …"');
  });
});
