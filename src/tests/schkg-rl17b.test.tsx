// ─── RL-17b · SchKG-Presets RR-12 / RR-13 (W2·30-RL-W2A) ─────────────────────
//
// Herz-und-Nieren-Prüfung 24.9.2026, Befunde rechtslogik-rest-12 (Preset
// `rechtsvorschlag_nachtraeglich`) und rechtslogik-rest-13 (Preset
// `schuldenruf_nachlass`), UMSETZUNGSPLAN HN-23.
//
// Wortlaut (amtliche Fedlex-Filestore-Kopien, abgerufen 25.9.2026; Fassung
// per SPARQL dateApplicability als heute geltend bestimmt):
//   SR 281.1 (SchKG), Konsolidierung 1.1.2026,
//     https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/11/529_488_529/20260101/de/xml/fedlex-data-admin-ch-eli-cc-11-529_488_529-20260101-de-xml-3.xml
//   SR 272 (ZPO), Konsolidierung 1.7.2026,
//     https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2010/262/20260701/de/xml/fedlex-data-admin-ch-eli-cc-2010-262-20260701-de-xml-1.xml
//   · Art. 77 Abs. 2 SchKG: Rechtsvorschlag «innert zehn Tagen, nachdem er vom
//     Gläubigerwechsel Kenntnis erhalten hat, beim Richter des Betreibungsortes
//     schriftlich und begründet anbringen».
//   · Art. 251 lit. b ZPO: summarisches Verfahren für die «Bewilligung des
//     nachträglichen Rechtsvorschlages (Art. 77 Abs. 3 SchKG)».
//   · Art. 56 Abs. 2 SchKG: «Für die Klagen nach diesem Gesetz, die vor einem
//     Gericht einzureichen sind, sind ausschliesslich die Bestimmungen der ZPO
//     über den Stillstand der Fristen anwendbar.»
//   · Art. 145 Abs. 2 lit. b ZPO: kein Fristenstillstand im summarischen Verfahren.
//   · Art. 300 Abs. 1 SchKG: Der Sachwalter fordert «durch öffentliche
//     Bekanntmachung (Art. 35 und 296) die Gläubiger auf, ihre Forderungen innert
//     eines Monats einzugeben», sonst bei den Verhandlungen über den
//     Nachlassvertrag «nicht stimmberechtigt».
//   · Art. 35 Abs. 1 SchKG: für die Fristberechnung ist die Veröffentlichung im
//     Schweizerischen Handelsamtsblatt massgebend.
//   · BGE 73 III 91 (Regeste, Scan der amtlichen Sammlung via entscheidsuche.ch,
//     CH_BGB_005_BGE-73-III-84): Betreibungsferien/Rechtsstillstand (Art. 56,
//     57 ff., 63 SchKG) sind auf Verfügungen des Sachwalters im
//     Nachlassverfahren nicht anwendbar.
//
// Soll-Fälle von Hand (Kanton ZH; Betreibungsferien Sommer 15.–31.7.):
//   · Art. 77 Abs. 2 SchKG, Kenntnis Fr 10.7.2026 + 10 Tage = Mo 20.7.2026.
//       Voreinstellung (ohne Stillstand, sichere Seite): 20.07.2026.
//       Override Betreibungsferien: Ende in den Ferien → Art. 63 → 3. Werktag
//       nach 31.7. (1.8. Sa/Bundesfeier, 2.8. So; 3./4./5.8.) → 05.08.2026.
//   · Art. 300 Abs. 1 SchKG, 1 Monat ab SHAB-Publikation (Art. 31 SchKG i.V.m.
//     Art. 142 Abs. 2 ZPO):
//       Di 13.10.2026 → Fr 13.11.2026.
//       Di 31.3.2026 → kein 31.4. → letzter Tag des Monats Do 30.04.2026.
//       Sa 20.6.2026 → Mo 20.07.2026 (in den Betreibungsferien, aber keine
//       Verlängerung nach Art. 63: Sachwalter-Handlung, BGE 73 III 91).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PRESETS_SCHKG } from '../lib/schkgPresets';
import { berechneSchkgFrist } from '../lib/schkgFristen';
import type { SchkgInput } from '../types/schkg';
import { SchkgFristenForm } from '../components/forms/SchkgFristenForm';
import { LocaleProvider } from '../components/locale';

const preset = (key: string) => {
  const p = PRESETS_SCHKG.find((x) => x.key === key);
  if (!p) throw new Error(`SchKG-Preset fehlt: ${key}`);
  return p;
};

const ausPreset = (key: string, ereignis: string, extra: Partial<SchkgInput> = {}): SchkgInput => {
  const p = preset(key);
  return {
    ereignis, einheit: p.einheit!, laenge: p.laenge!, modus: p.modus,
    fristnatur: p.fristnatur, kanton: 'ZH', ausloeser: p.ausloeser, ...extra,
  };
};

const leer = (html: string) => html.replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

function renderSchkg(search: string): string {
  vi.stubGlobal('window', { location: { search, hash: '', pathname: '/rechner/schkg-fristen', origin: 'https://lexmetrik.ch' } });
  return leer(renderToString(
    <MemoryRouter initialEntries={['/rechner/schkg-fristen' + search]}>
      <LocaleProvider><SchkgFristenForm /></LocaleProvider>
    </MemoryRouter>,
  ));
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('RR-12 · Nachträglicher Rechtsvorschlag (Art. 77 Abs. 2 SchKG): umstrittenes Regime, sichere Voreinstellung', () => {
  it('Voreinstellung ohne Stillstand → 20.07.2026', () => {
    const p = preset('rechtsvorschlag_nachtraeglich');
    expect(p.modus).toBe('kein');
    expect(berechneSchkgFrist(ausPreset('rechtsvorschlag_nachtraeglich', '2026-07-10')).diesAdQuem).toBe('20.07.2026');
  });

  it('Spätere Lesart (Betreibungsferien + Art. 63) über den Override wählbar → 05.08.2026', () => {
    expect(preset('rechtsvorschlag_nachtraeglich').modusUmstritten).toBe(true);
    const r = berechneSchkgFrist(ausPreset('rechtsvorschlag_nachtraeglich', '2026-07-10', { modusOverride: 'schkg_betreibungsferien' }));
    expect(r.diesAdQuem).toBe('05.08.2026');
  });

  it('Hinweis legt Einreichungsort, Verfahrensart und die offene Frage seit 1.1.2025 offen', () => {
    const h = preset('rechtsvorschlag_nachtraeglich').hinweis ?? '';
    expect(h).toMatch(/\bRichter des Betreibungsortes\b/);
    expect(h).toMatch(/\bArt\. 251 lit\. b ZPO\b/);
    expect(h).toMatch(/\b1\.1\.2025\b/);
    expect(h).toMatch(/\bArt\. 56 Abs\. 2 SchKG\b/);
    expect(h).toMatch(/\bArt\. 145 Abs\. 2 lit\. b ZPO\b/);
    expect(h).toMatch(/\bArt\. 63 SchKG\b/);
  });

  it('Formular: Override-Feld erscheint; ohne Override 20.07.2026, mit Override 05.08.2026', () => {
    const basis = '?p=rechtsvorschlag_nachtraeglich&ph=einleitung&e=2026-07-10&u=tage&l=10&m=kein&n=frist&k=ZH';
    const ohne = renderSchkg(basis);
    expect(ohne).toMatch(/Override/);
    expect(ohne).toMatch(/20\.07\.2026/);
    expect(ohne).not.toMatch(/05\.08\.2026/);
    expect(renderSchkg(basis + '&o=schkg_betreibungsferien')).toMatch(/05\.08\.2026/);
  });
});

describe('RR-13 · Schuldenruf im Nachlass (Art. 300 Abs. 1 SchKG): gesetzliche Monatsfrist ab SHAB-Publikation', () => {
  it('Preset rechnet 1 Monat (nicht mehr reine Info), Label ohne «richterlich»', () => {
    const p = preset('schuldenruf_nachlass');
    expect(p.infoOnly).toBeFalsy();
    expect(p.einheit).toBe('monate');
    expect(p.laenge).toBe(1);
    expect(p.modus).toBe('kein');
    expect(p.norm).toMatch(/\bArt\. 300 Abs\. 1 SchKG\b/);
    expect(p.label).not.toMatch(/richterlich/);
    expect(p.label).toMatch(/\b1 Monat\b/);
    expect(p.ausloeser).toMatch(/\bSHAB\b/);
  });

  it('Publikation 13.10.2026 → 13.11.2026', () => {
    expect(berechneSchkgFrist(ausPreset('schuldenruf_nachlass', '2026-10-13')).diesAdQuem).toBe('13.11.2026');
  });

  it('Publikation 31.3.2026 → letzter Tag des Monats 30.04.2026 (Art. 142 Abs. 2 ZPO)', () => {
    expect(berechneSchkgFrist(ausPreset('schuldenruf_nachlass', '2026-03-31')).diesAdQuem).toBe('30.04.2026');
  });

  it('Ende in den Betreibungsferien: keine Verlängerung nach Art. 63 SchKG → 20.07.2026', () => {
    expect(berechneSchkgFrist(ausPreset('schuldenruf_nachlass', '2026-06-20')).diesAdQuem).toBe('20.07.2026');
  });

  it('Hinweis: gesetzliche Frist, Rechtsfolge Stimmrecht, SHAB massgebend, kein Art. 63', () => {
    const h = preset('schuldenruf_nachlass').hinweis ?? '';
    expect(h).not.toMatch(/Vom Sachwalter angesetzte Frist/);
    expect(h).toMatch(/\bnicht stimmberechtigt\b/);
    expect(h).toMatch(/\bArt\. 35 Abs\. 1 SchKG\b/);
    expect(h).toMatch(/\bBGE 73 III 91\b/);
    expect(h).toMatch(/\bArt\. 63 SchKG\b/);
  });

  it('Formular zeigt ein berechnetes Fristende statt nur Info', () => {
    const html = renderSchkg('?p=schuldenruf_nachlass&ph=nachlass&e=2026-10-13&u=monate&l=1&m=kein&n=frist&k=ZH');
    expect(html).toMatch(/13\.11\.2026/);
  });
});
