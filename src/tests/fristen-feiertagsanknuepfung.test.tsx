// ─── RL-07 · Feiertags-Anknüpfung der Rechtsmittelfristen (W2·30-RL-W1) ─────
//
// Prüfung Rechtslogik 23.9.2026, Befunde F1-01 (schwer), F3-04, Q8-01…03.
// Drei GETRENNTE Anknüpfungsregeln (§1/§4 — nie vereinheitlichen):
//   · Art. 142 Abs. 3 ZPO: Feiertag «am Gerichtsort».
//   · Art. 45 Abs. 2 BGG / Art. 20 Abs. 3 Satz 2 VwVG: Recht des Kantons, in
//     dem «die Partei oder ihr Vertreter» Wohnsitz oder Sitz hat.
//   · Art. 90 Abs. 2 Satz 2 StPO: Kanton, in dem «die Partei oder ihr
//     Rechtsbeistand» Wohnsitz oder Sitz hat; Art. 89 Abs. 2 StPO: keine
//     Gerichtsferien.
// Wortlaut: Fedlex SR 173.110 (Konsolidierung 1.4.2026), SR 272 (1.7.2026),
// SR 312.0 (1.4.2025), SR 172.021 (1.7.2022) — SPARQL-Abgleich 24.9.2026,
// jüngste Konsolidierung je Erlass = Stand der Snapshots public/normtext/bund.
//
// Soll F1-01 (von Hand hergeleitet): Eröffnung Fr 21.8.2026, 30 Tage
// (Art. 100 Abs. 1 BGG i.V.m. Art. 77 BGG / Art. 389 ZPO). Beginn 22.8.
// (Art. 44 Abs. 1 BGG); kein Stillstand berührt (Art. 46 Abs. 1 lit. b endet
// 15.8.). Tag 30 = So 20.9.2026 (Bettag) → nächster Werktag. Vertretung in ZH:
// Mo 21.9.2026 ist Werktag → 21.9.2026. Das BGer sitzt in Lausanne (VD); dort
// ist der 21.9.2026 Bettagsmontag — wer (wie das ZPO-Formular verlangte) den
// Gerichtsort VD eingibt, erhält 22.9.2026, einen Tag zu spät.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PRESETS } from '../lib/zpoPresets';
import { berechneBggVwvgFrist } from '../lib/bggVwvgFristen';
import { berechneAllgemeineFrist, ALLG_FRIST_HINWEIS, STPO_FRIST_HINWEIS } from '../lib/allgemeineFrist';
import { kantonFeldLabel } from '../components/forms/einfacheFristTexte';
import { ZpoFristenForm } from '../components/forms/ZpoFristenForm';
import { EinfacheFristForm } from '../components/forms/EinfacheFristForm';
import { LocaleProvider } from '../components/locale';

const leer = (html: string) => html.replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

function renderZpo(search: string): string {
  vi.stubGlobal('window', { location: { search, hash: '', pathname: '/rechner/zpo-fristen', origin: 'https://lexmetrik.ch' } });
  return leer(renderToString(
    <MemoryRouter initialEntries={['/rechner/zpo-fristen' + search]}>
      <LocaleProvider><ZpoFristenForm /></LocaleProvider>
    </MemoryRouter>,
  ));
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('F1-01 · Preset «Beschwerde ans Bundesgericht» (Schiedssachen) rechnet nach BGG', () => {
  const p = PRESETS.find((x) => x.key === 'schied_bger')!;

  it('Preset ist dem BGG-Regime zugeordnet, nicht der ZPO-Feiertagsregel', () => {
    expect(p.engine).toBe('bgg');
    expect(p.hinweis).toMatch(/Art\. 45 Abs\. 2 BGG/);
    expect(p.hinweis).not.toMatch(/bildet den ZPO-Stillstand ab/);
  });

  // Vertretung ZH, Gericht (BGer) VD: das Kantonsfeld fragt nach der Partei/
  // Vertretung, gerechnet wird mit ZH → 21.9.2026.
  const LINK = '?p=schied_bger&e=2026-08-21&u=tage&l=30&v=ordentlich&n=gesetzlich';

  it('21.8.2026 + 30 T, Vertretung ZH (BGer in VD) → 21.09.2026, Anknüpfung Art. 45 Abs. 2 BGG', () => {
    const html = renderZpo(LINK + '&k=ZH');
    expect(html).toContain('21.09.2026');
    expect(html).not.toContain('22.09.2026');
    expect(html).toContain('Wohnsitz/Sitz der Partei oder ihrer Vertretung');
    expect(html).toContain('Art. 45 Abs. 2 BGG');
    // Sichtbares Ergebnis aus der BGG-Engine (Annahme Endverschiebung Art. 45 BGG).
    expect(html).toContain('Endverschiebung nach Art. 45 BGG');
    // Das Kantonsfeld fragt NICHT nach dem Gerichtsort (Art. 142 Abs. 3 ZPO
    // gilt hier nicht). Die Annahmen der ZPO-Engine stehen im zugeklappten
    // Bereich und sind im SSR nicht sichtbar — darum prüft die Sonde das Feld.
    expect(html).not.toContain('Gerichtsort (Kanton)');
    expect(html).not.toContain('ZPO-Fristberechnung (Art. 142 ff. ZPO)');
  });

  it('Gegenprobe: Vertretung in VD → 22.09.2026 (Bettagsmontag VD) — der eingegebene Kanton wirkt', () => {
    const html = renderZpo(LINK + '&k=VD');
    expect(html).toContain('22.09.2026');
    expect(html).not.toContain('21.09.2026');
  });

  it('ZPO-Presets ohne BGG-Bezug bleiben bei der ZPO-Anknüpfung (Art. 142 Abs. 3 ZPO)', () => {
    const html = renderZpo('?p=berufung&e=2026-08-21&u=tage&l=30&v=ordentlich&n=gesetzlich&k=ZH');
    expect(html).toContain('Gerichtsort (Kanton)');
    expect(html).toContain('ZPO-Fristberechnung (Art. 142 ff. ZPO)');
    expect(PRESETS.filter((x) => x.engine === 'bgg').map((x) => x.key)).toEqual(['schied_bger']);
  });
});

describe('F3-04 · BGG/VwVG-Annahme nennt Partei ODER Vertretung', () => {
  for (const regime of ['bgg', 'vwvg'] as const) {
    it(`${regime}: Annahme «Wohnsitz/Sitz der Partei oder ihrer Vertretung»`, () => {
      const r = berechneBggVwvgFrist({ regime, ereignis: '2026-08-21', einheit: 'tage', laenge: 30, kanton: 'ZH' });
      expect(r.annahmen.some((a) => a.includes('Wohnsitz/Sitz der Partei oder ihrer Vertretung'))).toBe(true);
    });
  }
});

describe('Q8-01 · Kantonsfeld des Tagerechners sagt, wessen Kanton', () => {
  it('Beschriftung je Regime (getrennte Regeln, §1)', () => {
    expect(kantonFeldLabel('zpo')).toMatch(/Gerichtsort/);
    expect(kantonFeldLabel('bgg')).toMatch(/Wohnsitz\/Sitz der Partei oder ihrer Vertretung/);
    expect(kantonFeldLabel('vwvg')).toMatch(/Wohnsitz\/Sitz der Partei oder ihrer Vertretung/);
    expect(kantonFeldLabel('keine')).toMatch(/Erfüllungsort/);
    expect(kantonFeldLabel('keine')).toMatch(/StPO/);
    // Alle Beschriftungen behalten den Anker «Kanton (Feiertage)» (e2e-Selektor).
    for (const f of ['zpo', 'bgg', 'vwvg', 'keine', 'schkg'] as const) {
      expect(kantonFeldLabel(f).startsWith('Kanton (Feiertage)')).toBe(true);
    }
  });

  it('Voll-Variante zeigt die Regime-Beschriftung und den StPO-Anknüpfungssatz (Art. 90 Abs. 2 StPO)', () => {
    const html = leer(renderToString(
      <MemoryRouter><LocaleProvider><EinfacheFristForm /></LocaleProvider></MemoryRouter>,
    ));
    // Bis 24.9.2026: Default-Regime ZPO (Auftrag David) → «– Gerichtsort». Seit
    // RL-24/UI-07 (W-12 (c)) kein Regime vorgewählt → Grundbeschriftung ohne
    // Anknüpfung; die Regime-Beschriftungen prüft der Test oben.
    expect(html).toContain(`>${kantonFeldLabel(null)}<`);
    expect(html).not.toContain(kantonFeldLabel('zpo'));
    expect(html).toMatch(/Wohnsitz\/Sitz der Partei oder ihres Rechtsbeistands \(Art\. 90 Abs\. 2 StPO\)/);
    expect(html).toMatch(/nicht (?:der|am) Gerichtsort/);
  });
});

describe('Q8-02 · StPO-Hinweis ohne Verweis auf den ZPO-Rechner', () => {
  it('eigener StPO-Satz: keine Gerichtsferien, Anknüpfung Rechtsbeistand, kein «ZPO-Fristenrechner verwenden»', () => {
    expect(STPO_FRIST_HINWEIS).toMatch(/Art\. 89 Abs\. 2 StPO/);
    expect(STPO_FRIST_HINWEIS).toMatch(/Art\. 90 Abs\. 2 StPO/);
    expect(STPO_FRIST_HINWEIS).toMatch(/Rechtsbeistand/);
    expect(STPO_FRIST_HINWEIS).not.toMatch(/ZPO-Fristenrechner/);
  });

  it('Grundtext ALLG_FRIST_HINWEIS unverändert (Golden allg:30t/allg:klemm byte-gleich)', () => {
    expect(ALLG_FRIST_HINWEIS).toBe(
      'Dieser allgemeine Rechner berücksichtigt keine verfahrensspezifischen Stillstände. '
      + 'Für gerichtliche Fristen den ZPO-Fristenrechner, für betreibungsrechtliche den '
      + 'SchKG-Fristenrechner verwenden.',
    );
  });
});

describe('Q8-03 · Fehlertext ohne Kanton ist regimeneutral', () => {
  it('nennt nicht nur den Erfüllungsort (OR), sondern auch die StPO-Anknüpfung', () => {
    expect(() => berechneAllgemeineFrist({ start: '2026-08-21', laenge: 10, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true }))
      .toThrow(/Erfüllungsort.*Rechtsbeistand|Rechtsbeistand.*Erfüllungsort/);
  });
});
