/**
 * W2·27-BUND-FERTIG · P2 · Posten #12 «AbrufFehler: Variante klein» (GP #1181).
 *
 * BEFUND: `AbrufFehler` setzte `text-body-s` fest; im 11-px-Kasten des `EntstehungsBlock`
 * (Schrift `text-micro`) sprang die Praxis-Fehlerzeile gegenüber ihrer Nachbarzeile
 * («Praxis: lädt …», `E.praxis`) in der Grösse, und `className` konnte das nicht übersteuern
 * (zwei Tailwind-Schriftgrad-Klassen am selben Element: die Reihenfolge im CSS entscheidet,
 * nicht die im Attribut).
 *
 * ENTSCHEID (Fundstelle: DESIGN-REGLEMENT §F0.12 «Dichte-Variante»): additive Bool-Prop
 * `klein`, wie `GruppenKopf dicht` und `RubrikKachel kompakt` — Standard bleibt `text-body-s`
 * (alle Bestands-Konsumenten byte-gleich).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbrufFehler } from '../components/ui/AbrufFehler';

const absatz = (html: string) => html.match(/<p [^>]*class="([^"]*)"/)?.[1] ?? '';

describe('P2 #12 · AbrufFehler «klein»', () => {
  it('Standard unverändert: text-body-s (Bestands-Konsumenten byte-gleich)', () => {
    const html = renderToStaticMarkup(<AbrufFehler gegenstand="Materialien" mehrzahl onErneut={() => {}} />);
    expect(absatz(html)).toBe('text-body-s text-warn-700');
    expect(html).toContain('class="lc-btn-mini text-body-s"');
  });

  it('klein: text-micro mit der Zeilenhöhe der Nachbarzeile — und KEIN text-body-s daneben', () => {
    const html = renderToStaticMarkup(<AbrufFehler gegenstand="Praxis-Angaben" mehrzahl klein onErneut={() => {}} />);
    expect(absatz(html)).toBe('text-micro leading-[1.35] text-warn-700');
    expect(html).not.toContain('text-body-s');
    expect(html).toContain('class="lc-btn-mini text-micro"');
  });

  it('klein trägt className weiter durch (Polsterung der Fläche)', () => {
    expect(absatz(renderToStaticMarkup(<AbrufFehler gegenstand="X" klein className="mt-0.5" />)))
      .toBe('text-micro leading-[1.35] text-warn-700 mt-0.5');
  });

  it('der EntstehungsBlock setzt die Praxis-Fehlerzeile in klein (Quellsonde)', () => {
    const q = readFileSync(resolve(import.meta.dirname ?? '.', '../components/entstehung/EntstehungsBlock.tsx'), 'utf8');
    expect(q).toMatch(/<AbrufFehler gegenstand="Praxis-Angaben" mehrzahl klein /);
  });
});
