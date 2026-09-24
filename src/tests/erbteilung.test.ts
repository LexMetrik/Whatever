import { describe, it, expect } from 'vitest';
import { berechneErbteilung } from '../lib/erbteilung';
import { fmtB } from '../lib/bruch';
import type { ErbteilungInput } from '../types/erbrecht';

const base = (over: Partial<ErbteilungInput>): ErbteilungInput => ({
  todesdatum: '2025-06-01',
  zivilstand: 'ledig',
  kinderLebend: 0,
  ...over,
});

// Kurzzugriff: { Bezeichnung → [Erbteil, Pflichtteil] }
function quoten(input: ErbteilungInput): Record<string, [string, string]> {
  const r = berechneErbteilung(input);
  const out: Record<string, [string, string]> = {};
  r.erben.forEach((e) => { out[e.bezeichnung] = [fmtB(e.erbteil), fmtB(e.pflichtteil)]; });
  return out;
}
const vq = (input: ErbteilungInput) => fmtB(berechneErbteilung(input).verfuegbareQuote);

describe('Erbteilung & Pflichtteil – Übersichtstabelle (neues Recht, Tod ab 1.1.2023)', () => {
  it('Ehegatte + 2 Kinder: EG 1/2 (PT 1/4), Kinder je 1/4 (PT je 1/8), VQ 1/2', () => {
    const inp = base({ zivilstand: 'verheiratet', kinderLebend: 2 });
    const q = quoten(inp);
    expect(q['Ehegatte/Partner']).toEqual(['1/2', '1/4']);
    expect(q['Kind 1']).toEqual(['1/4', '1/8']);
    expect(q['Kind 2']).toEqual(['1/4', '1/8']);
    expect(vq(inp)).toBe('1/2');
  });

  it('Nur Nachkommen (3 Kinder): je 1/3 (PT je 1/6), VQ 1/2', () => {
    const inp = base({ kinderLebend: 3 });
    const q = quoten(inp);
    expect(q['Kind 1']).toEqual(['1/3', '1/6']);
    expect(vq(inp)).toBe('1/2');
  });

  it('Ehegatte + beide Eltern: EG 3/4 (PT 3/8), Eltern je 1/8 (PT 0), VQ 5/8', () => {
    const inp = base({ zivilstand: 'verheiratet', vater: { lebt: true }, mutter: { lebt: true } });
    const q = quoten(inp);
    expect(q['Ehegatte/Partner']).toEqual(['3/4', '3/8']);
    expect(q['Vater']).toEqual(['1/8', '0']);
    expect(q['Mutter']).toEqual(['1/8', '0']);
    expect(vq(inp)).toBe('5/8');
  });

  it('Ehegatte + Geschwister (beide Eltern vorverstorben mit Nachkommen): EG 3/4 (PT 3/8), VQ 5/8', () => {
    const inp = base({
      zivilstand: 'verheiratet',
      vater: { lebt: false, stammNachkommen: true },
      mutter: { lebt: false, stammNachkommen: true },
    });
    const q = quoten(inp);
    expect(q['Ehegatte/Partner']).toEqual(['3/4', '3/8']);
    expect(q['Nachkommen des Vaters (Geschwister/Nichten/Neffen, zusammen)']).toEqual(['1/8', '0']);
    expect(vq(inp)).toBe('5/8');
  });

  it('Ehegatte allein (keine 1./2. Parentel): 1/1, PT 1/2, VQ 1/2 – 3. Parentel verdrängt', () => {
    const inp = base({ zivilstand: 'verheiratet', dritteParentelVorhanden: true });
    const q = quoten(inp);
    expect(q['Ehegatte/Partner']).toEqual(['1', '1/2']);
    expect(vq(inp)).toBe('1/2');
  });

  it('Nur Eltern: VQ 1/1 (kein Pflichtteil mehr)', () => {
    const inp = base({ vater: { lebt: true }, mutter: { lebt: true } });
    const q = quoten(inp);
    expect(q['Vater']).toEqual(['1/2', '0']);
    expect(vq(inp)).toBe('1');
  });

  it('Nur Geschwister: VQ 1/1', () => {
    const inp = base({ vater: { lebt: false, stammNachkommen: true }, mutter: { lebt: false, stammNachkommen: true } });
    expect(vq(inp)).toBe('1');
  });

  it('Nur 3. Parentel: VQ 1/1', () => {
    const inp = base({ dritteParentelVorhanden: true });
    const q = quoten(inp);
    expect(q['Stamm der Grosseltern (3. Parentel, zusammen)']).toEqual(['1', '0']);
    expect(vq(inp)).toBe('1');
  });

  it('Keine Erben: Gemeinwesen (Art. 466 ZGB)', () => {
    const q = quoten(base({}));
    expect(q['Gemeinwesen (Kanton/Gemeinde)']).toEqual(['1', '0']);
  });
});

describe('Eintritt, Anwachsung, Sonderfälle', () => {
  it('Stammesteilung: Sohn 1/2 (PT 1/4), 2 Enkel des vorverstorbenen Kindes je 1/4 (PT je 1/8)', () => {
    const inp = base({ kinderLebend: 1, kinderVorverstorben: [{ enkel: 2 }] });
    const q = quoten(inp);
    expect(q['Kind']).toEqual(['1/2', '1/4']);
    expect(q['Nachkommen des vorverstorbenen Kindes 2 (je)']).toEqual(['1/4', '1/8']);
    expect(vq(inp)).toBe('1/2');
  });

  it('Anwachsung 2. Parentel: nur Mutter lebt, Vater vorverstorben ohne Nachkommen → Mutter 1/4 neben Ehegatte', () => {
    const inp = base({ zivilstand: 'verheiratet', mutter: { lebt: true }, vater: { lebt: false, stammNachkommen: false } });
    const q = quoten(inp);
    expect(q['Mutter']).toEqual(['1/4', '0']);
    expect(q['Ehegatte/Partner']).toEqual(['3/4', '3/8']);
  });

  it('Vorverstorbenes Kind ohne Nachkommen zählt nicht als Stamm', () => {
    const inp = base({ kinderLebend: 2, kinderVorverstorben: [{ enkel: 0 }] });
    const q = quoten(inp);
    expect(q['Kind 1']).toEqual(['1/2', '1/4']);
  });

  it('Eingetragene Partnerschaft = Ehe (Art. 462 ZGB)', () => {
    const inp = base({ zivilstand: 'eingetragene_partnerschaft', kinderLebend: 1 });
    expect(quoten(inp)['Ehegatte/Partner']).toEqual(['1/2', '1/4']);
  });
});

describe('Altes Recht (Tod bis 31.12.2022)', () => {
  it('Ehegatte + Kinder: Kinder-PT zusammen 3/8, VQ 3/8', () => {
    const inp = base({ todesdatum: '2022-06-01', zivilstand: 'verheiratet', kinderLebend: 1 });
    const q = quoten(inp);
    expect(q['Ehegatte/Partner']).toEqual(['1/2', '1/4']);
    expect(q['Kind']).toEqual(['1/2', '3/8']); // 1/2 × 3/4
    expect(vq(inp)).toBe('3/8');
  });

  it('Nur Kinder: VQ 1/4', () => {
    expect(vq(base({ todesdatum: '2022-06-01', kinderLebend: 2 }))).toBe('1/4');
  });

  it('Ehegatte + Eltern: Eltern-PT je 1/16, VQ 1/2', () => {
    const inp = base({ todesdatum: '2022-06-01', zivilstand: 'verheiratet', vater: { lebt: true }, mutter: { lebt: true } });
    const q = quoten(inp);
    expect(q['Vater']).toEqual(['1/8', '1/16']); // 1/8 × 1/2 (alt)
    expect(vq(inp)).toBe('1/2');
  });

  it('Geschwister hatten auch altrechtlich keinen Pflichtteil', () => {
    const inp = base({ todesdatum: '2022-06-01', vater: { lebt: false, stammNachkommen: true }, mutter: { lebt: false, stammNachkommen: true } });
    expect(vq(inp)).toBe('1');
  });
});

describe('Art. 472 ZGB – hängiges Scheidungsverfahren', () => {
  it('Voraussetzungen erfüllt: EG-PT 0, Kind-PT wie unverheiratet (1/2), gesetzlicher Erbteil EG bleibt 1/2', () => {
    const inp = base({ zivilstand: 'verheiratet', kinderLebend: 1, scheidungHaengig: true, scheidung472Erfuellt: true });
    const q = quoten(inp);
    expect(q['Ehegatte/Partner']).toEqual(['1/2', '0']);   // Erbteil bleibt, PT entfällt
    expect(q['Kind']).toEqual(['1/2', '1/2']);             // PT = 1/1 × 1/2 (wie unverheiratet)
    expect(vq(inp)).toBe('1/2');
  });

  it('Voraussetzungen NICHT erfüllt: alles unverändert + Warnung', () => {
    const inp = base({ zivilstand: 'verheiratet', kinderLebend: 1, scheidungHaengig: true, scheidung472Erfuellt: false });
    const r = berechneErbteilung(inp);
    expect(quoten(inp)['Ehegatte/Partner']).toEqual(['1/2', '1/4']);
    expect(r.warnungen.some((w) => w.includes('Art. 472'))).toBe(true);
  });

  // A5-1: Art. 472 ZGB nF gilt erst für Todesfälle ab 1.1.2023 (Art. 15/16 SchlT ZGB).
  // Bei altrechtlichem Tod darf der automatische Pflichtteilsverlust NICHT greifen.
  it('altrechtlicher Tod (≤ 31.12.2022): Art. 472 greift NICHT – Ehegatte behält Pflichtteil 1/4 + Hinweis', () => {
    const inp = base({ todesdatum: '2022-06-01', zivilstand: 'verheiratet', kinderLebend: 1, scheidungHaengig: true, scheidung472Erfuellt: true });
    const r = berechneErbteilung(inp);
    expect(quoten(inp)['Ehegatte/Partner']).toEqual(['1/2', '1/4']); // PT NICHT 0
    expect(r.annahmen.some((a) => a.includes('Art. 472') && a.includes('ab 1.1.2023'))).toBe(true);
  });
});

describe('Güterrechtliche Vorstufe', () => {
  it('Errungenschaftsbeteiligung: Eigengut 200k + 1/2×100k + 1/2×60k = 280k', () => {
    const r = berechneErbteilung(base({
      zivilstand: 'verheiratet', kinderLebend: 1,
      gueterstand: 'errungenschaftsbeteiligung',
      eigengutErblasser: 200_000, vorschlagErblasser: 100_000, vorschlagUeberlebender: 60_000,
    }));
    expect(r.nachlassChf).toBe(280_000);
  });

  it('Rückschlag wird nicht geteilt, aber vom Erblasser selbst getragen (Art. 210 Abs. 2, 209 Abs. 2, 474 Abs. 2 ZGB)', () => {
    // B3-01 (Fachänderung, Freigabe David Q7 Nr. 6): 100k − 50k + 1/2 × 40k = 70k.
    const r = berechneErbteilung(base({
      zivilstand: 'verheiratet', kinderLebend: 1,
      gueterstand: 'errungenschaftsbeteiligung',
      eigengutErblasser: 100_000, vorschlagErblasser: -50_000, vorschlagUeberlebender: 40_000,
    }));
    expect(r.nachlassChf).toBe(70_000);
  });

  it('Gütertrennung: ganzes Vermögen; Gütergemeinschaft: Eigengut + halbes Gesamtgut', () => {
    expect(berechneErbteilung(base({ zivilstand: 'verheiratet', kinderLebend: 1, gueterstand: 'guetertrennung', vermoegenErblasser: 99_000 })).nachlassChf).toBe(99_000);
    expect(berechneErbteilung(base({ zivilstand: 'verheiratet', kinderLebend: 1, gueterstand: 'guetergemeinschaft', eigengutErblasser: 50_000, gesamtgut: 300_000 })).nachlassChf).toBe(200_000);
  });
});
