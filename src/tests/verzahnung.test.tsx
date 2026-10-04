import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { zeigeKantenDatum, type VerzahnungsKante } from '../lib/verzahnung/typen';
import { GLOSSAR, glossarErklaerung } from '../lib/verzahnung/glossar';
import { StatusBadge } from '../components/verzahnung/StatusBadge';
import { KantenChip } from '../components/verzahnung/KantenChip';

// Reine Darstellung/Datenschicht (§3) — SSR-Rendering (renderToString) genügt für
// den Initialzustand; useEffect (Begriff-Popover) läuft im SSR nicht, was hier
// gewollt ist (geschlossener Grundzustand). Verzahnungs-Fundament V1.1.

const ssr = (el: React.ReactElement) => renderToString(<MemoryRouter>{el}</MemoryRouter>);
const VERBOTEN = /geprüft|gegengeprüft|verifiziert/;

describe('typen — Q1: Bandjahr nie als Tagesdatum', () => {
  it('bandjahr rendert nur den Jahrgang, nie einen Tag', () => {
    const d: VerzahnungsKante['datum'] = { iso: '1995-01-01', praezision: 'bandjahr' };
    expect(zeigeKantenDatum(d)).toBe('1995');
    expect(zeigeKantenDatum(d)).not.toContain('.');   // kein «1.1.1995»
  });
  it('tag rendert DD.MM.YYYY', () => {
    expect(zeigeKantenDatum({ iso: '2025-03-07', praezision: 'tag' })).toBe('07.03.2025');
  });
  it('unbekannt/fehlend rendert leer', () => {
    expect(zeigeKantenDatum({ iso: '2025-03-07', praezision: 'unbekannt' })).toBe('');
    expect(zeigeKantenDatum(undefined)).toBe('');
  });
});

describe('glossar — Vollständigkeit + Wortfeld (§7)', () => {
  it('trägt mindestens 15 Einträge mit begriff + erklärung', () => {
    const keys = Object.keys(GLOSSAR);
    expect(keys.length).toBeGreaterThanOrEqual(15);
    for (const k of keys) {
      const e = GLOSSAR[k as keyof typeof GLOSSAR];
      expect(e.begriff.length).toBeGreaterThan(0);
      expect(e.erklaerung.length).toBeGreaterThan(0);
    }
  });
  it('kein «geprüft/gegengeprüft/verifiziert»-Wortfeld in Erklärtexten', () => {
    for (const k of Object.keys(GLOSSAR) as (keyof typeof GLOSSAR)[]) {
      expect(glossarErklaerung(k)).not.toMatch(VERBOTEN);
    }
  });
});

describe('StatusBadge — geschlossenes Vokabular, nur Abweichungen', () => {
  it('leitentscheid voll: ★ + Label, aria-label + kein Wortfeld', () => {
    const out = ssr(<StatusBadge praedikat="leitentscheid" />);
    expect(out).toContain('★');
    expect(out).toContain('Leitentscheid');
    expect(out).toContain('aria-label="Leitentscheid — amtlich publizierter BGE"');
    expect(out).not.toMatch(VERBOTEN);
  });
  it('maschinell voll: Label, kein ★', () => {
    const out = ssr(<StatusBadge praedikat="maschinell" />);
    expect(out).toContain('maschinell');
    expect(out).not.toContain('★');
    expect(out).not.toMatch(VERBOTEN);
  });
  it('V2-Slot masse trägt (noch) keine Darstellung', () => {
    expect(ssr(<StatusBadge praedikat="masse" />)).toBe('');
  });
  it('nur-verweis (V3 vorgezogen E6a·M5): Label «nur Verweis», kein ★, soft-Ton', () => {
    const out = ssr(<StatusBadge praedikat="nur-verweis" />);
    expect(out).toContain('nur Verweis');
    expect(out).toContain('lc-badge-soft');
    expect(out).not.toContain('★');
    expect(out).not.toMatch(VERBOTEN);
  });
  it('Magic Moment 4: aria-label textgleich in voll- und glyph-Variante', () => {
    const holeAria = (html: string) => html.match(/aria-label="([^"]+)"/)?.[1];
    const voll = holeAria(ssr(<StatusBadge praedikat="leitentscheid" variant="voll" />));
    const glyph = holeAria(ssr(<StatusBadge praedikat="leitentscheid" variant="glyph" />));
    expect(voll).toBeTruthy();
    expect(glyph).toBe(voll);
  });
  it('glyph-Variante ist role=img (Screenreader liest das Label)', () => {
    const out = ssr(<StatusBadge praedikat="leitentscheid" variant="glyph" />);
    expect(out).toContain('role="img"');
    expect(out).toContain('★');
  });
  // Farb-Wörterbuch V2·C-1 (§4b-B): ★ bleibt brass, ↻ trägt warn (echter Vorbehalt).
  it('★-Glyph bleibt brass (Marke/Hervorhebung)', () => {
    const out = ssr(<StatusBadge praedikat="leitentscheid" variant="glyph" />);
    expect(out).toContain('text-brass-700');
    expect(out).not.toContain('text-warn-700');
  });
  it('Revisions-↻-Glyph trägt warn-700, nicht brass', () => {
    const out = ssr(<StatusBadge praedikat="revidiert" variant="glyph" />);
    expect(out).toContain('↻');
    expect(out).toContain('text-warn-700');
    expect(out).not.toContain('text-brass-700');
  });
});

describe('KantenChip — Dichte-Regel (EIN Zusatz)', () => {
  const ster = (html: string) => (html.match(/★/g) ?? []).length;
  it('Sublabel gewinnt: ★ als Präfix, Sublabel sichtbar, genau EIN ★', () => {
    const out = ssr(<KantenChip to="/x" label="BGE 147 III 209" sublabel="via Art. 257d" leitentscheid />);
    expect(out).toContain('via Art. 257d');
    expect(ster(out)).toBe(1);
    // lastIndexOf = das SICHTBARE Label (das title-Attribut trägt denselben Text davor).
    expect(out.indexOf('★')).toBeLessThan(out.lastIndexOf('BGE 147 III 209'));  // Präfix
  });
  it('nur Leitentscheid: ★ als Suffix, genau EIN ★', () => {
    const out = ssr(<KantenChip to="/x" label="BGE 145 III 63" leitentscheid />);
    expect(ster(out)).toBe(1);
    expect(out.indexOf('★')).toBeGreaterThan(out.lastIndexOf('BGE 145 III 63'));  // Suffix
  });
  it('nur Sublabel: kein ★', () => {
    const out = ssr(<KantenChip to="/x" label="OR" sublabel="via Art. 41" />);
    expect(ster(out)).toBe(0);
    expect(out).toContain('via Art. 41');
  });
  it('nackt: kein ★, kein Sublabel, Link auf `to`', () => {
    const out = ssr(<KantenChip to="/gesetze/bund/OR" label="OR" />);
    expect(ster(out)).toBe(0);
    expect(out).toContain('href="/gesetze/bund/OR"');
  });
  // Farb-Wörterbuch V2·C-1 (§4b-B): Kategorie-Prop steuert die Chip-Farbfamilie.
  it('Default kategorie=norm: brass-Klassenzeile, kein slate (byte-identisch)', () => {
    const out = ssr(<KantenChip to="/x" label="OR" />);
    expect(out).toContain('hover:text-brass-700');
    expect(out).toContain('hover:border-brass-400');
    expect(out).not.toContain('lc-chip-entscheid');
    expect(out).not.toContain('slate');
  });
  it('explizit kategorie=norm ist byte-identisch zum Default', () => {
    const def = ssr(<KantenChip to="/x" label="OR" />);
    const norm = ssr(<KantenChip to="/x" label="OR" kategorie="norm" />);
    expect(norm).toBe(def);
  });
  it('kategorie=entscheid: slate-Tick + slate-Hover, kein brass-Hover', () => {
    const out = ssr(<KantenChip to="/x" label="BGE 145 III 63" kategorie="entscheid" />);
    expect(out).toContain('lc-chip-entscheid');
    expect(out).toContain('hover:text-slate-700');
    expect(out).toContain('hover:border-slate-700');
    expect(out).not.toContain('hover:text-brass-700');
    expect(out).not.toContain('hover:border-brass-400');
  });
});
