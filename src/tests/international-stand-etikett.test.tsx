/**
 * O-02 · «Stand» hatte auf /gesetze?ebene=international zwei Bedeutungen:
 * CISG «Stand 22.05.2026» ist die Nachführung (Fedlex), DSGVO «Stand 27.04.2016»
 * das ERLASSDATUM der Verordnung (EUR-Lex, `euVo`). Die EU-Einträge heissen
 * jetzt «Erlassen <Datum>», die Fedlex-Einträge bleiben «Stand <Datum>».
 *
 * ROT ZU BEKOMMEN: in `ErlassKarte.tsx` `etikett={standEtikett(e)}` streichen →
 * «DSGVO … Erlassen» rot; oder `standEtikett` immer «Erlassen» liefern lassen →
 * der CISG-Fall rot.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ErlassTabelle } from '../components/normtext/ErlassKarte';
import { INTERNATIONAL_EXTERN, standEtikett } from '../lib/normtext/international-extern';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass = (o: Partial<BrowseErlass> & Pick<BrowseErlass, 'key' | 'kuerzel' | 'stand' | 'status'>): BrowseErlass => ({
  ebene: 'bund', kanton: null, titel: `Titel ${o.kuerzel}`, sr: null, rechtsgebiet: 'international', sprache: 'de', rang: 1,
  datei: null, artikelAnzahl: 0, quelleUrl: 'https://example.org/', fassungsToken: '', pdfPfad: null, ...o,
} as BrowseErlass);

const DSGVO = erlass({ key: 'DSGVO', kuerzel: 'DSGVO', stand: '2016-04-27', status: 'nur-live-link' });
const CISG = erlass({ key: 'CISG', kuerzel: 'CISG', sr: '0.221.211.1', stand: '2026-05-22', status: 'snapshot', datei: 'bund/CISG.json', artikelAnzahl: 102 });

const html = (e: BrowseErlass[]) => renderToStaticMarkup(
  <MemoryRouter><ErlassTabelle erlasse={e} voll beschriftung="Test" /></MemoryRouter>,
).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('O-02 · Etikett vor dem Datum der Erlass-Zeile', () => {
  it('EU-Verordnung: «Erlassen 27.04.2016», nicht «Stand»', () => {
    const t = html([DSGVO]);
    expect(t).toContain('Erlassen 27.04.2016');
    expect(t).not.toContain('Stand 27.04.2016');
  });

  it('Fedlex-Eintrag (CISG): «Stand 22.05.2026» bleibt', () => {
    const t = html([CISG]);
    expect(t).toContain('Stand 22.05.2026');
    expect(t).not.toContain('Erlassen');
  });

  it('beide nebeneinander sind unterscheidbar', () => {
    const t = html([CISG, DSGVO]);
    expect(t).toContain('Stand 22.05.2026');
    expect(t).toContain('Erlassen 27.04.2016');
  });

  it('ein kantonaler Erlass mit gleichem Schlüssel wie ein EU-Eintrag bleibt «Stand»', () => {
    expect(standEtikett({ key: 'DSGVO', ebene: 'kanton' })).toBe('Stand');
    expect(standEtikett({ key: 'OR', ebene: 'bund' })).toBe('Stand');
  });

  it('Datenbeleg: bei allen EU-Einträgen ist `stand` das Erlassdatum (Jahr = Jahr der CELEX-Nummer)', () => {
    // CELEX «3<Jahr><Typ><Nr>»: das Jahr des Rechtsakts. Stimmt es mit dem Jahr von
    // `stand` überein, ist `stand` ein Erlass- und kein Nachführungsdatum (eine
    // Nachführung läge Jahre später). Bricht das, ist «Erlassen» neu zu bewerten.
    expect(INTERNATIONAL_EXTERN.length).toBeGreaterThan(0);
    for (const e of INTERNATIONAL_EXTERN) {
      const celexJahr = /CELEX:3(\d{4})/.exec(e.quelleUrl)?.[1];
      expect(e.stand.slice(0, 4), e.key).toBe(celexJahr);
      expect(standEtikett(e)).toBe('Erlassen');
    }
  });
});
