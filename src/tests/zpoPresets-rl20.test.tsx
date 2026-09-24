// ─── RL-20 · ZPO-Presets (W2·30-RL-W2A) ──────────────────────────────────────
//
// Prüfung Rechtslogik 23.9.2026, Befunde R5-01 (mittel nach V14), R5-04,
// R5-05, F1-04, R1-08 (Bündel A-B4c).
// Wortlaut: Fedlex SR 272 (ZPO), Konsolidierung 1.7.2026
//   https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2010/262/20260701/de/xml/fedlex-data-admin-ch-eli-cc-2010-262-20260701-de-xml-1.xml
// und SR 281.1 (SchKG), Konsolidierung 1.1.2026 (…/eli/cc/11/529_488_529/20260101/…-de-xml-3.xml),
// SPARQL-Abgleich 24.9.2026 = jüngste Konsolidierung je Erlass.
//   · Art. 145 Abs. 2 lit. b ZPO: kein Stillstand im summarischen Verfahren;
//     Abs. 3: Hinweispflicht (Gültigkeitsvorschrift, BGE 139 III 78 E. 5).
//   · Art. 314 Abs. 1 ZPO: gegen Summarentscheide beträgt die Frist «zur
//     Einreichung der Berufung und zur Berufungsantwort je zehn Tage»;
//     Anschlussberufung unzulässig (Satz 2, seit 1.1.2025).
//   · Art. 148 Abs. 1 ZPO: Wiederherstellung nur bei «kein oder nur ein
//     leichtes Verschulden».
//   · BGE 138 III 615 (Regeste): Klagefrist nach Klagebewilligung (Art. 209
//     Abs. 3 und 4 ZPO) steht während der Gerichtsferien still.
//
// Soll-Fälle von Hand (Eröffnung Fr 10.7.2026, Gerichtsort ZH):
//   · summarisch, 10 Tage: Beginn Sa 11.7. (Art. 142 Abs. 1), kein Stillstand
//     → Tag 10 = Mo 20.7.2026 (Werktag, kein Feiertag ZH).
//   · ordentlich (Ist der Presets): 11.–14.7. = 4 Tage, Stillstand 15.7.–15.8.
//     (Art. 145 Abs. 1 lit. b), weiter ab 16.8. → Tag 10 = Fr 21.8.2026.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PRESETS } from '../lib/zpoPresets';
import { berechneFrist } from '../lib/zpoFristen';
import type { ZpoInput } from '../types/zpo';
import { ZpoFristenForm } from '../components/forms/ZpoFristenForm';
import { LocaleProvider } from '../components/locale';

const preset = (key: string) => {
  const p = PRESETS.find((x) => x.key === key);
  if (!p) throw new Error(`Preset fehlt: ${key}`);
  return p;
};

const ausPreset = (key: string, extra: Partial<ZpoInput> = {}): ZpoInput => {
  const p = preset(key);
  return {
    ereignis: '2026-07-10', einheit: p.einheit, laenge: p.laenge ?? 10,
    verfahren: p.verfahren, kanton: 'ZH', fristnatur: p.fristnatur, ...extra,
  };
};

const leer = (html: string) => html.replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

function renderZpo(search: string): string {
  vi.stubGlobal('window', { location: { search, hash: '', pathname: '/rechner/zpo-fristen', origin: 'https://lexmetrik.ch' } });
  return leer(renderToString(
    <MemoryRouter initialEntries={['/rechner/zpo-fristen' + search]}>
      <LocaleProvider><ZpoFristenForm /></LocaleProvider>
    </MemoryRouter>,
  ));
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('R5-01 · ordentliche Presets warnen vor dem summarischen Verfahren', () => {
  // Hinweis muss das summarische Verfahren UND die Norm der Ausnahme nennen.
  const SUMMAR = /\bsummarischen Verfahren\b/;
  const AUSNAHME = /\bArt\. 145 Abs\. 2 lit\. b\b/;

  it.each(['begruendung', 'berufungsantwort', 'revision', 'neueinreichung'])('%s: Hinweis nennt summarisches Verfahren + Art. 145 Abs. 2 lit. b', (key) => {
    const p = preset(key);
    expect(p.verfahren).toBe('ordentlich'); // Preset selbst bleibt ordentlich (fristenspiegel §5)
    expect(p.hinweis).toMatch(SUMMAR);
    expect(p.hinweis).toMatch(AUSNAHME);
  });

  it('Begründung nach Summarentscheid, eröffnet 10.7.2026: summarisch → 20.07.2026 (Ist ordentlich 21.08.2026)', () => {
    expect(berechneFrist(ausPreset('begruendung')).diesAdQuem).toBe('21.08.2026');
    expect(berechneFrist(ausPreset('begruendung', { verfahren: 'summarisch' })).diesAdQuem).toBe('20.07.2026');
  });

  it('neues Preset berufungsantwort_summar: 10 Tage, ohne Stillstand (Art. 314 Abs. 1 ZPO) → 20.07.2026', () => {
    const p = preset('berufungsantwort_summar');
    expect(p).toMatchObject({
      phase: 'rechtsmittel', einheit: 'tage', laenge: 10, verfahren: 'rechtsmittel_summarisch',
      fristnatur: 'gesetzlich', norm: 'Art. 314 Abs. 1 ZPO',
    });
    expect(p.hinweis).toMatch(/\bBGE 139 III 78\b/);
    expect(p.hinweis).toMatch(/\bAnschlussberufung\b.*\bunzulässig\b/);
    const r = berechneFrist(ausPreset('berufungsantwort_summar'));
    expect(r.diesAdQuem).toBe('20.07.2026');
    expect(r.stillstandAktiv).toBe(false);
    // Gegenprobe Ist: ordentliches Preset rechnet 30 Tage mit Stillstand.
    expect(berechneFrist(ausPreset('berufungsantwort')).diesAdQuem).toBe('10.09.2026');
  });

  it('Anschlussberufung: Hinweis auf Unzulässigkeit gegen Summarentscheide (Art. 314 Abs. 1 Satz 2)', () => {
    expect(preset('anschlussberufung').hinweis).toMatch(/\bArt\. 314 Abs\. 1\b/);
  });
});

describe('R5-04 · Beschwerde 10 Tage: prozessleitende Verfügung im ordentlichen Verfahren', () => {
  it('Hinweis sagt, dass der Stillstand dort gilt (Ausnahme nur summarisch)', () => {
    const h = preset('beschwerde_summar').hinweis!;
    expect(h).toMatch(/\bprozessleitende\b/);
    expect(h).toMatch(/\bordentlichen\b/);
    expect(h).toMatch(/\bStillstand\b[^.]*\bgilt\b/);
    expect(h).not.toMatch(/^Auch prozessleitende Verfügungen; kein Stillstand/);
  });
});

describe('R5-05 · Klagebewilligung: Stillstand gilt (BGE 138 III 615)', () => {
  it('Hinweis wie klagefrist_miete, kein «nicht abschliessend geklärt» mehr', () => {
    const h = preset('klagebewilligung').hinweis!;
    expect(h).toMatch(/\bBGE 138 III 615\b/);
    expect(h).toMatch(/\bStillstand gilt\b/);
    expect(h).not.toMatch(/nicht abschliessend geklärt/);
  });
});

describe('F1-04 · Arrestprosekution: keine Art.-145-Abs.-3-Warnung', () => {
  const HINWEIS_145_3 = /andernfalls steht die Frist gleichwohl still/;

  it('Preset trägt das Merkmal; Engine unterdrückt die Hinweis-Regel und rechnet ohne Stillstand', () => {
    const p = preset('arrestprosekution');
    expect(p.hinweispflichtEntfaellt).toBe(true);
    const r = berechneFrist(ausPreset('arrestprosekution', { hinweispflichtEntfaellt: true, gerichtshinweisStillstand: false }));
    expect(r.diesAdQuem).toBe('20.07.2026');
    expect(r.stillstandAktiv).toBe(false);
    expect(r.warnungen.join(' ')).not.toMatch(HINWEIS_145_3);
    expect(r.warnungen.join(' ')).toMatch(/\bsichere Seite\b/);
  });

  it('Gegenprobe: ohne Merkmal bleibt die Hinweis-Regel unverändert (summarisches Verfahren)', () => {
    const r = berechneFrist(ausPreset('stellungnahme_summar', { laenge: 10 }));
    expect(r.warnungen.join(' ')).toMatch(HINWEIS_145_3);
    const ohneHinweis = berechneFrist(ausPreset('stellungnahme_summar', { laenge: 10, gerichtshinweisStillstand: false }));
    expect(ohneHinweis.stillstandAktiv).toBe(true);
    expect(ohneHinweis.diesAdQuem).toBe('21.08.2026');
  });

  it('Formular: Arrest-Preset ohne Checkbox «Hinweis des Gerichts», Ergebnis 20.07.2026 auch mit gh=0', () => {
    const html = renderZpo('?p=arrestprosekution&e=2026-07-10&u=tage&l=10&v=summarisch&n=gesetzlich&k=ZH&gh=0');
    expect(html).not.toMatch(/Hinweis des Gerichts auf Nichtgeltung des Stillstands/);
    expect(html).toMatch(/20\.07\.2026/);
    expect(html).not.toMatch(/21\.08\.2026/);
    expect(html).not.toMatch(HINWEIS_145_3);
  });
});

describe('R1-08 · Wiederherstellung nur ausnahmsweise (Art. 148 Abs. 1 ZPO)', () => {
  it('Feiertags-Vorbehalt verspricht keine «regelmässige» Wiederherstellung', () => {
    const w = berechneFrist(ausPreset('berufung')).warnungen.join(' ');
    expect(w).not.toMatch(/\bregelmässig\b/);
    expect(w).toMatch(/\bnur ausnahmsweise\b/);
    expect(w).toMatch(/\bkein oder nur ein leichtes Verschulden\b/);
  });
});
