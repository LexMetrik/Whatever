// ─── RL-15 · BGG: Fristende kurz vor dem Stillstand (W2·30-RL-W2A) ─────────
//
// Prüfung Rechtslogik 23.9.2026, Befunde F3-OFFEN A16 (Entscheid David 23.9.:
// Warnhinweis bauen; W-07 (a): nur BGG), F3-05, F3-07, F3-08.
//
// Wortlaut Fedlex SR 173.110 (BGG), Konsolidierung 1.4.2026
// (https://fedlex.data.admin.ch/eli/cc/2006/218/20260401), abgerufen 24.9.2026:
//   · Art. 44 Abs. 1: Beginn am folgenden Tag; Abs. 2: Mitteilung gegen
//     Unterschrift gilt «spätestens am siebenten Tag nach dem ersten
//     erfolglosen Zustellungsversuch als erfolgt».
//   · Art. 45 Abs. 1: letzter Tag Sa/So/Feiertag → «am nächstfolgenden Werktag».
//   · Art. 46 Abs. 1 lit. a: Stillstand «vom siebenten Tag vor Ostern bis und
//     mit dem siebenten Tag nach Ostern».
// VwVG SR 172.021, Konsolidierung 1.7.2022: Art. 20 Abs. 2bis gleichlautend.
//
// Soll A16 (von Hand hergeleitet): Ostern 2026 = So 5.4. → Stillstand
// So 29.3.–So 12.4.2026. Ereignis Mi 18.3.2026, 10 Tage: Beginn Do 19.3.
// (Art. 44 Abs. 1), Tag 10 = Sa 28.3.2026 (kein Stillstandstag dazwischen).
// Art. 45 Abs. 1 wörtlich: nächstfolgender Werktag = Mo 30.3.2026 — der liegt
// aber schon im Stillstand. Die Engine (Endregel «ruhen_weiter») schiebt über
// den Stillstand hinaus auf Mo 13.4.2026 (nutzergünstig, Praxis amtlich nicht
// belegt). Der 30.3.2026 ist damit die «sichere Variante»: das Fristende, das
// sich ergibt, wenn die Werktagsverschiebung den Stillstand NICHT überspringt.
//
// Zweiter Fall (Sommer): 15.7.2029 ist ein Sonntag. Ereignis Mi 4.7.2029,
// 10 Tage → Tag 10 = Sa 14.7.2029; nächster Werktag ohne Stillstand
// Mo 16.7.2029 (im Stillstand 15.7.–15.8.); Engine → Do 16.8.2029.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { berechneBggVwvgFrist, bvZustellfiktionSatz } from '../lib/bggVwvgFristen';
import { ZpoFristenForm } from '../components/forms/ZpoFristenForm';
import { LocaleProvider } from '../components/locale';

// Identitäts-Treffer mit Wortgrenze (CLAUDE.md §7), keine Substring-Präsenz.
const datumRe = (d: string) => new RegExp(`(^|[^\\d.])${d.replace(/\./g, '\\.')}([^\\d]|$)`);
const stillstandsWarnung = (w: string[]) => w.filter((z) => /Fristende kurz vor dem Stillstand/.test(z));

afterEach(() => { vi.unstubAllGlobals(); });

describe('A16 · BGG-Tagesfrist endet Sa/So/Feiertag unmittelbar vor dem Stillstand', () => {
  it('18.3.2026 + 10 T (ZH): Fristende 13.04.2026 unverändert + Warnung mit sicherer Variante 30.03.2026', () => {
    const r = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-03-18', einheit: 'tage', laenge: 10, kanton: 'ZH' });
    expect(r.diesAdQuemISO).toBe('2026-04-13');
    const w = stillstandsWarnung(r.warnungen);
    expect(w).toHaveLength(1);
    expect(w[0]).toMatch(datumRe('30.03.2026'));
    expect(w[0]).toMatch(datumRe('28.03.2026'));
    expect(w[0]).toMatch(datumRe('13.04.2026'));
    expect(w[0]).toMatch(/Art\. 45 Abs\. 1 BGG/);
    expect(w[0]).toMatch(/Art\. 46 Abs\. 1 BGG/);
  });

  it('Sommer: 4.7.2029 + 10 T → 16.08.2029 + Warnung mit sicherer Variante 16.07.2029', () => {
    const r = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2029-07-04', einheit: 'tage', laenge: 10, kanton: 'BE' });
    expect(r.diesAdQuemISO).toBe('2029-08-16');
    const w = stillstandsWarnung(r.warnungen);
    expect(w).toHaveLength(1);
    expect(w[0]).toMatch(datumRe('16.07.2029'));
  });

  it('Gegenprobe: Fristende ohne Stillstandsnähe → keine Warnung', () => {
    // Tag 10 = Do 12.3.2026 (Werktag) → keine Verschiebung.
    const a = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-03-02', einheit: 'tage', laenge: 10, kanton: 'ZH' });
    expect(a.diesAdQuemISO).toBe('2026-03-12');
    expect(stillstandsWarnung(a.warnungen)).toEqual([]);
    // Tag 10 = Sa 14.3.2026 → Mo 16.3.2026, ausserhalb des Stillstands.
    const b = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-03-04', einheit: 'tage', laenge: 10, kanton: 'ZH' });
    expect(b.diesAdQuemISO).toBe('2026-03-16');
    expect(stillstandsWarnung(b.warnungen)).toEqual([]);
  });

  it('Golden-Fälle bgg-tage10-weihnacht / bgg-tage30-ostern bleiben ohne Warnung', () => {
    // 15.12.2026 + 10 T: Ende So 10.1.2027 NACH dem Stillstand → Mo 11.1.2027.
    const w = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-12-15', einheit: 'tage', laenge: 10, kanton: 'ZH' });
    expect(w.diesAdQuemISO).toBe('2027-01-11');
    expect(w.warnungen).toEqual([]);
    // 25.3.2026 + 30 T (TI): Stillstand überspannt, Ende Sa 9.5. → Mo 11.5.2026.
    const o = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-03-25', einheit: 'tage', laenge: 30, kanton: 'TI' });
    expect(o.diesAdQuemISO).toBe('2026-05-11');
    expect(o.warnungen).toEqual([]);
  });

  it('Anzeige: ZPO-Preset «Beschwerde ans Bundesgericht» (BGG-Engine) zeigt die Warnung', () => {
    // Preset ist auf 30 Tage fixiert (linkPreset prüft l=30): 26.2.2026 + 30 T
    // → Tag 30 = Sa 28.3.2026, gleiche Konstellation wie A16.
    const search = '?p=schied_bger&e=2026-02-26&u=tage&l=30&v=ordentlich&n=gesetzlich&k=ZH';
    vi.stubGlobal('window', { location: { search, hash: '', pathname: '/rechner/zpo-fristen', origin: 'https://lexmetrik.ch' } });
    const html = renderToString(
      <MemoryRouter initialEntries={['/rechner/zpo-fristen' + search]}>
        <LocaleProvider><ZpoFristenForm /></LocaleProvider>
      </MemoryRouter>,
    ).replace(/<!-- -->/g, '');
    expect(html).toMatch(/Fristende nach BGG/);
    expect(html).toMatch(datumRe('13.04.2026'));
    expect(html).toMatch(/Fristende kurz vor dem Stillstand/);
    expect(html).toMatch(datumRe('30.03.2026'));
    expect(html).toMatch(/Art\. 44 Abs\. 2 BGG/);
  });
});

describe('F3-05 · Hinweis Zustellfiktion (Art. 44 Abs. 2 BGG / Art. 20 Abs. 2bis VwVG)', () => {
  it('je Regime eigener Norm-Anker, siebenter Tag nach erstem erfolglosem Zustellversuch', () => {
    const bgg = bvZustellfiktionSatz('bgg');
    const vwvg = bvZustellfiktionSatz('vwvg');
    expect(bgg).toMatch(/Art\. 44 Abs\. 2 BGG/);
    expect(vwvg).toMatch(/Art\. 20 Abs\. 2bis VwVG/);
    expect(bgg).not.toMatch(/VwVG/);
    expect(vwvg).not.toMatch(/BGG/);
    for (const s of [bgg, vwvg]) expect(s).toMatch(/siebenten Tag nach dem ersten erfolglosen Zustellungsversuch/);
  });
});

describe('F3-08 · ungültiges Ereignisdatum', () => {
  it('2026-02-30 → klare Meldung statt «konvergiert nicht»', () => {
    const f = () => berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-02-30', einheit: 'tage', laenge: 10, kanton: 'ZH' });
    expect(f).toThrow(/Ungültiges Datum/);
    expect(f).not.toThrow(/konvergiert/);
  });
});
