/**
 * W2·29-WERKBANK-REST S1 (25.9.2026) · Entscheid-Leser auf der Werkbank-Hülle.
 *
 * Sichert die Zusagen des Umbaus, die weder die Kern-Probe (Körper byte-gleich)
 * noch die Flächen-Ratsche (sichtbarer Text, keine Klassen) sehen:
 *   (1) Titelblatt-Band: `register="r"` setzt das Register NUR am Band; ohne
 *       Angabe bleibt das Erlass-Band zeichengleich (Gesetzes-Leser unberührt);
 *       `nachBand` steht nach den Fakten, aber AUSSERHALB der Fläche.
 *   (2) StatusBadge `variant="text"`: dasselbe Wort, dieselbe Ansage, kein Kasten.
 *   (3) «maschinell» steht in Karte UND Zeile fest hinter dem Sachgebiet.
 *   (4) D8a: die Entscheid-Chrome greift die Rollen-Schicht, keine Messing-Stufen.
 *   (5) Ladeanzeige und SchalterGruppe sind geteilte Bausteine, keine Kopien.
 * DOM-Sonden per SSR-Render, Bezugs-Sonden per Quelltext (Muster
 * `kopf-geruest-b4.test.tsx`). Rot-Beweise: PR-Body / Bau-Bericht.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LeserKopfGeruest } from '../components/layout/LeserKopfGeruest';
import { StatusBadge } from '../components/verzahnung/StatusBadge';
import { EntscheidKarte } from '../components/rechtsprechung/EntscheidKarte';
import { EntscheidZeile } from '../components/rechtsprechung/EntscheidZeile';
import type { BrowseEntscheid } from '../lib/rechtsprechung/register';

const quelle = (p: string) => readFileSync(p, 'utf8');

describe('(1) Titelblatt-Band mit Register und nachBand', () => {
  const basis = {
    form: 'titelblatt' as const,
    overline: 'O', titel: <h1>T</h1>, fakten: ['F1'],
  };
  it('ohne register: Band ohne data-reg (Erlass-Kopf zeichengleich)', () => {
    const html = renderToStaticMarkup(<LeserKopfGeruest {...basis} />);
    expect(html).toContain('<div data-titelblatt-band="true" class="lc-titelblatt-band space-y-2">');
  });
  it('register="r": data-reg am Band, nachBand nach dem Band auf dem Papier', () => {
    const html = renderToStaticMarkup(
      <LeserKopfGeruest {...basis} register="r" nachBand={<p className="nb">N</p>} stand={['S']} />,
    );
    expect(html).toContain('<div data-titelblatt-band="true" data-reg="r" class="lc-titelblatt-band space-y-2">');
    const bandEnde = html.indexOf('</div>', html.indexOf('data-titelblatt-band'));
    const nb = html.indexOf('<p class="nb">');
    expect(nb).toBeGreaterThan(html.indexOf('F1'));
    expect(nb, 'nachBand liegt ausserhalb der Registerfläche').toBeGreaterThan(bandEnde);
    expect(nb, 'nachBand steht vor dem Stand-Band').toBeLessThan(html.indexOf('>S<'));
  });
  it('das Rezept liest das Register «r» und hebt die Overline auf ink-600', () => {
    const css = quelle('src/index.css');
    expect(css).toMatch(/\.lc-titelblatt-band\[data-reg="r"\]\s*\{[^}]*--reg-r-flaeche[^}]*--reg-r\)/);
    expect(css).toContain('.lc-titelblatt-band[data-reg] .lc-overline { color: var(--ink-600); }');
  });
  it('der Entscheid-Leser nutzt das Band mit Register «r»', () => {
    const q = quelle('src/pages/EntscheidLeser.tsx');
    expect(q).toContain('form="titelblatt"');
    expect(q).toContain('register="r"');
    expect(q).toContain('nachBand={');
  });
});

describe('(2) StatusBadge variant="text"', () => {
  it('Randnotiz ohne Kasten, Wortlaut und Ansage wie das Badge', () => {
    const text = renderToStaticMarkup(<StatusBadge praedikat="maschinell" variant="text" />);
    const voll = renderToStaticMarkup(<StatusBadge praedikat="maschinell" />);
    expect(text).not.toContain('lc-badge');
    expect(text).toContain('lc-marke-text');
    expect(text).toMatch(/>maschinell<\/span>$/);
    const aria = (h: string) => h.match(/aria-label="([^"]+)"/)?.[1];
    expect(aria(text)).toBe(aria(voll));
    expect(aria(text)).toBe('maschinell zugeordnet — keine redaktionell erfasste Angabe');
  });
  it('die Randnotiz ist gepunktet unterstrichen (Form, nicht nur Farbe)', () => {
    expect(quelle('src/index.css')).toMatch(/\.lc-marke-text\s*\{[^}]*text-decoration:\s*underline dotted/);
  });
});

const entscheid: BrowseEntscheid = {
  key: 'bund/bger/x', gericht: 'bger', gerichtName: 'Bundesgericht', gerichtstyp: 'bundesgericht',
  kanton: 'CH', nummer: '1C_1/2025', bgeReferenz: null, datum: '2025-03-17',
  zitierung: 'BGer 1C_1/2025 vom 17. März 2025', leitcharakter: 'routine',
  regesteVorhanden: false, regesteKurz: null, sachgebiet: 'oeffentlich', sprache: 'de',
  normKeys: ['OR'], bestand: 'snapshot', kuratierung: 'maschinell',
  datei: 'bund/bger/x.json', quelle: 'opencaselaw', quelleUrl: 'https://x', fassungsToken: 't',
  quarantaene: 'BGE 150 I 1',
};

describe('(3) «maschinell» fest hinter dem Sachgebiet', () => {
  for (const [name, el] of [
    ['Karte', <EntscheidKarte key="k" e={entscheid} onNorm={() => {}} />],
    ['Zeile', <EntscheidZeile key="z" e={entscheid} onNorm={() => {}} />],
  ] as const) {
    it(`${name}: Sachgebiet, dann unmittelbar die Randnotiz — vor «Volltext nicht verfügbar»`, () => {
      const html = renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);
      const gebiet = html.indexOf('>Öffentliches Recht</span>');
      const marke = html.indexOf('lc-marke-text');
      const quar = html.indexOf('Volltext nicht verfügbar');
      expect(gebiet).toBeGreaterThan(-1);
      expect(marke).toBeGreaterThan(gebiet);
      const zwischen = html.slice(gebiet + '>Öffentliches Recht</span>'.length, marke);
      expect(zwischen, 'kein Text zwischen Sachgebiet und Randnotiz').not.toMatch(/>[^<]+</);
      expect(quar).toBeGreaterThan(marke);
      expect(html).not.toContain('lc-badge lc-badge-soft" aria-label="maschinell');
    });
  }
});

describe('(4) D8a — Entscheid-Chrome auf der Rollen-Schicht', () => {
  for (const p of [
    'src/pages/EntscheidLeser.tsx',
    'src/components/rechtsprechung/LesemodusOverlay.tsx',
    'src/components/rechtsprechung/ErwaegungsRail.tsx',
    'src/components/rechtsprechung/EntscheidVerzahnung.tsx',
    'src/components/rechtsprechung/EntscheidKopfTeile.tsx',
  ]) {
    it(`${p}: keine Messing-Stufe als Klasse`, () => {
      // Nur Code zählt, Herleitungs-Kommentare dürfen den Vorzustand weiter
      // zitieren (§2b): Kommentarzeilen fallen weg, geprüft werden alle
      // String-Literale (className, Ternär-Zweige, Klassen-Konstanten).
      const code = quelle(p).split('\n')
        .filter((z) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(z)).join('\n');
      const literale = [...code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`\n]*)`/g)]
        .map((m) => m[1] ?? m[2] ?? m[3]);
      expect(literale.filter((l) => /\bbrass-\d/.test(l))).toEqual([]);
    });
  }
  it('der aktive Sprung-Reiter trägt die Registerfarbe «Rechtsprechung»', () => {
    expect(quelle('src/pages/EntscheidLeser.tsx')).toContain("? 'border-reg-r text-ink-900'");
  });
});

describe('(5) geteilte Bausteine statt Kopien', () => {
  it('Entscheid-Leser lädt mit `ui/Ladeanzeige`, keine eigene Ablesekante', () => {
    const q = quelle('src/pages/EntscheidLeser.tsx');
    expect(q).toContain('<Ladeanzeige text="Der Entscheid wird abgerufen …"');
    expect(q).not.toContain('scale-rule max-w-[200px]');
  });
  it('SchalterGruppe lebt in ui/ und trägt die Rechtsprechungs-Schalter', () => {
    expect(quelle('src/components/ui/SchalterGruppe.tsx')).toContain('export function SchalterGruppe');
    expect(quelle('src/components/normtext/GesetzeGliederung.tsx')).not.toContain('export function SchalterGruppe');
    for (const p of ['src/components/rechtsprechung/EntscheidFilter.tsx', 'src/components/rechtsprechung/LiveSuche.tsx']) {
      const q = quelle(p);
      expect(q, p).toContain('<SchalterGruppe ');
      expect(q, `${p}: handgebaute Schalter-Gruppe`).not.toMatch(/role="group" aria-label="(Ansicht|Sortierung)"/);
    }
  });
});
