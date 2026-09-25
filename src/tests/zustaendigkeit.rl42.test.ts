import { describe, it, expect } from 'vitest';
import {
  bestimmeZustaendigkeit, bestimmeRechtsmittel, zustaendigkeitErgebnis, ZPO_SCHWELLEN,
  type ZustaendigkeitInput,
} from '../lib/zustaendigkeit';
import * as erstinstanz from '../lib/zustaendigkeit/erstinstanz';
import { fahrplanSchritte } from '../lib/zustaendigkeitFahrplan';
import * as schkg from '../lib/schkgZustaendigkeit';
import { geld } from './zustaendigkeit.helfer';

// RL-42 Gruppe B (Prüfung Rechtslogik 23.9.2026, Z1-03/Z1-04/Z1-05/Z1-06/
// VS3-19). Wortlaute aus den Fedlex-Filestore-Fassungen, abgerufen 25.9.2026:
// ZPO SR 272 Fassung 1.7.2026 (eli/cc/2010/262/20260701), BGG SR 173.110
// Fassung 1.4.2026 (eli/cc/2006/218/20260401), SchKG SR 281.1 Fassung
// 1.1.2026 (eli/cc/11/529_488_529/20260101).

const SCHLICHTUNG_FREIWILLIG = (erstinstanz as Record<string, unknown>).SCHLICHTUNG_FREIWILLIG_199_3 as string | undefined;

describe('Z1-03 — Art. 199 Abs. 3 ZPO: Klägerin KANN direkt klagen, Schlichtung «entfällt» nicht', () => {
  // Art. 199 Abs. 3 ZPO: «Bei Streitigkeiten, für die nach den Artikeln 5, 6
  // und 8 eine einzige kantonale Instanz zuständig ist, kann die klagende
  // Partei die Klage direkt beim Gericht einreichen.» — Art. 198 lit. f nennt
  // nur noch Art. 7.
  it('ein einziger, einmal definierter Satz (§5)', () => {
    expect(typeof SCHLICHTUNG_FREIWILLIG).toBe('string');
    expect(SCHLICHTUNG_FREIWILLIG).toContain('Art. 199 Abs. 3 ZPO');
    expect(SCHLICHTUNG_FREIWILLIG).toContain('kann');
    expect(SCHLICHTUNG_FREIWILLIG).not.toContain('entfällt');
  });
  it('Art. 5 (einzige Instanz): Rechenweg, Kopfzeile und Fahrplan sagen «nicht zwingend», nicht «entfällt»', () => {
    const input: ZustaendigkeitInput = { streitsache: 'ip_wettbewerb', vermoegensrechtlich: true, streitwertCHF: 500_000 };
    const r = bestimmeZustaendigkeit(input);
    expect(r.schlichtung.obligatorisch).toBe(false);
    const schritt3 = r.rechenweg.find((s) => s.beschreibung.startsWith('3 ·'))!;
    expect(schritt3.beschreibung).not.toContain('Schlichtung entfällt');
    expect(schritt3.beschreibung).toContain(SCHLICHTUNG_FREIWILLIG!);
    expect(schritt3.normen.some((n) => n.artikel === 'Art. 199 ZPO')).toBe(true);
    const e = zustaendigkeitErgebnis(input);
    expect(e.ergebnis).not.toContain('Schlichtung entfällt');
    expect(e.ergebnis).toContain('Schlichtung nicht zwingend');
    const fp = fahrplanSchritte(r, { vorlageVerfuegbar: false, stelleBekannt: false });
    expect(fp.some((s) => s.text.includes('Keine Schlichtung'))).toBe(false);
    expect(fp.some((s) => s.text.includes(SCHLICHTUNG_FREIWILLIG!))).toBe(true);
  });
  it('Weichen Handelsgericht (Art. 6) und Direktklage (Art. 8) tragen denselben Satz', () => {
    const hg = bestimmeZustaendigkeit(geld({ streitwertCHF: 200_000, geschaeftlicheTaetigkeit: true, beklagteImHR: true, klaegerImHR: true }));
    const w6 = hg.weichen.find((w) => w.startsWith('Handelsgericht prüfen: handelsrechtliche'))!;
    expect(w6).toContain(SCHLICHTUNG_FREIWILLIG!);
    expect(w6).not.toContain('Schlichtung entfällt');
    const w8 = bestimmeZustaendigkeit(geld({ streitwertCHF: 150_000 })).weichen.find((w) => w.startsWith('Direkte Klage ans obere Gericht'))!;
    expect(w8).toContain(SCHLICHTUNG_FREIWILLIG!);
    expect(w8).not.toContain('Schlichtung entfällt');
  });
  it('echte Ausnahmen nach Art. 198 bleiben «entfällt» (Scheidung lit. c, Widerklage lit. g)', () => {
    const w = bestimmeZustaendigkeit(geld({ widerklageOderGerichtlicheFrist: true }));
    expect(w.rechenweg.find((s) => s.beschreibung.startsWith('3 ·'))!.beschreibung).toContain('Schlichtung entfällt');
    expect(zustaendigkeitErgebnis(geld({ widerklageOderGerichtlicheFrist: true })).ergebnis).toContain('Schlichtung entfällt');
  });
});

describe('Z1-04 — Art. 51 Abs. 1 BGG: Streitwert-Zitat je Anfechtungsobjekt', () => {
  // Art. 51 Abs. 1 BGG: «a. bei Beschwerden gegen Endentscheide nach den
  // Begehren, die vor der Vorinstanz streitig geblieben waren; … c. bei
  // Beschwerden gegen Vor- und Zwischenentscheide nach den Begehren, die vor
  // der Instanz streitig sind, wo die Hauptsache hängig ist;»
  const basis = (extra: Partial<ZustaendigkeitInput> = {}): ZustaendigkeitInput => ({
    streitsache: 'geldforderung', vermoegensrechtlich: true, streitwertCHF: 50_000, ...extra,
  });
  it('Endentscheid → lit. a', () => {
    expect(bestimmeRechtsmittel(basis()).bgerText).toContain('Art. 51 Abs. 1 lit. a BGG');
  });
  it('Zwischenentscheid und prozessleitende Verfügung → lit. c, nicht lit. a', () => {
    for (const rmObjekt of ['zwischenentscheid', 'prozessleitende_verfuegung'] as const) {
      const t = bestimmeRechtsmittel(basis({ rmObjekt })).bgerText;
      expect(t).toContain('Art. 51 Abs. 1 lit. c BGG');
      expect(t).not.toContain('lit. a BGG');
      expect(t).toContain('wo die Hauptsache hängig ist');
    }
  });
});

describe('Z1-05 — mehrere Beklagte (Art. 15 Abs. 1 ZPO) offengelegt', () => {
  // Art. 15 Abs. 1 ZPO: «Richtet sich die Klage gegen mehrere Streitgenossen,
  // so ist das für eine beklagte Partei zuständige Gericht für alle beklagten
  // Parteien zuständig, sofern diese Zuständigkeit nicht nur auf einer
  // Gerichtsstandsvereinbarung beruht.»
  it('Annahme «eine beklagte Partei» mit Art.-15-Hinweis', () => {
    const a = zustaendigkeitErgebnis(geld()).annahmen.find((x) => x.includes('Art. 15 Abs. 1 ZPO'));
    expect(a).toBeDefined();
    expect(a).toContain('Gerichtsstandsvereinbarung');
  });
});

describe('Z1-06 — SchKG-Fristen mit Stillstand-Hinweis (Art. 56 Abs. 2 SchKG / Art. 145 Abs. 4 ZPO)', () => {
  // Art. 145 Abs. 4 ZPO: «Die Bestimmungen dieses Gesetzes über den Stillstand
  // der Fristen sind für alle Klagen nach dem SchKG, die vor einem Gericht
  // einzureichen sind, anwendbar. Sie sind für die Beschwerde vor der
  // Aufsichtsbehörde nicht anwendbar.» Art. 56 Abs. 2 SchKG: «Für die Klagen
  // nach diesem Gesetz, die vor einem Gericht einzureichen sind, sind
  // ausschliesslich die Bestimmungen der ZPO über den Stillstand der Fristen
  // anwendbar.»
  const hinweis = (f: { label: string; frist: string; norm: string; kritisch: boolean }) =>
    (schkg as Record<string, unknown>).schkgFristStillstand
      ? ((schkg as Record<string, unknown>).schkgFristStillstand as (x: typeof f) => string | null)(f)
      : null;
  it('gerichtliche Klagefristen: ZPO-Stillstand (Aberkennung, Widerspruch, Kollokation)', () => {
    const faelle: schkg.SchkgInput[] = [
      { anliegen: 'aberkennungsklage', schuldnerTyp: 'natuerlich_wohnsitz', forderungCHF: 30_000 },
      { anliegen: 'kollokation', schuldnerTyp: 'jur_person_hr', kollokationIn: 'konkurs', forderungCHF: 120_000 },
      { anliegen: 'kollokation', schuldnerTyp: 'natuerlich_wohnsitz', kollokationIn: 'pfaendung', forderungCHF: 20_000 },
      { anliegen: 'widerspruch', schuldnerTyp: 'natuerlich_wohnsitz', widerspruchKonstellation: 'gewahrsam_dritter_ch' },
    ];
    for (const i of faelle) {
      const r = schkg.bestimmeSchkgZustaendigkeit(i);
      const k = r.fristen.find((f) => f.label === 'Klagefrist')!;
      const h = hinweis(k);
      expect(h).toContain('Art. 56 Abs. 2 SchKG');
      expect(h).toContain('Art. 145 Abs. 4 Satz 1 ZPO');
      // Bericht (PDF/Anzeige) trägt den Hinweis
      const b = schkg.schkgZustaendigkeitBericht(r).rechenweg.find((s) => s.beschreibung.startsWith('Frist: Klagefrist'))!;
      expect(b.zwischenergebnis).toContain(h!);
    }
  });
  it('Aufsichtsbeschwerde (Art. 17 Abs. 2): KEIN ZPO-Stillstand (Art. 145 Abs. 4 Satz 2 ZPO), Art. 63 nur bei Betreibungshandlung', () => {
    const r = schkg.bestimmeSchkgZustaendigkeit({ anliegen: 'beschwerde_amt', schuldnerTyp: 'natuerlich_wohnsitz' });
    const h = hinweis(r.fristen.find((f) => f.norm === 'Art. 17 Abs. 2 SchKG')!);
    expect(h).toContain('Art. 145 Abs. 4 Satz 2 ZPO');
    expect(h).toContain('Art. 63 SchKG');
    expect(h).toContain('Betreibungshandlung');
  });
  it('übrige Fristen ohne Pauschal-Hinweis (eigene Regime: Art. 88 Abs. 2, 74, 86 …)', () => {
    const r = schkg.bestimmeSchkgZustaendigkeit({ anliegen: 'rueckforderung', schuldnerTyp: 'natuerlich_wohnsitz', forderungCHF: 8_000 });
    expect(typeof (schkg as Record<string, unknown>).schkgFristStillstand).toBe('function');
    expect(hinweis(r.fristen[0])).toBeNull();
  });
});
