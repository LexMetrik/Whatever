// ─── Feiertage nach geltendem kantonalem Recht (RL-22, W2·30-RL-W2A) ───────
//
// Soll-Fälle aus der Prüfung Rechtslogik 23.9.2026 (Befunde R1-02, R1-03,
// R1-04/NE), hergeleitet aus dem Normtext, NICHT aus zpoFeiertage.ts
// (Gegenmittel zu R1-06: die Gegenprobe gegen date-holidays begründete ihre
// Ausnahmen mit dem Code selbst). Summarisches Verfahren: kein Stillstand
// (Art. 145 Abs. 2 lit. b ZPO), das Fristende hängt allein an Art. 142 Abs. 3
// ZPO und dem Feiertagsrecht am Gerichtsort.
// RL-22-Nachzug (25.9.2026): istFeiertag kennt einen Feiertags-Kontext; die
// SO-/NE-Sonderregeln gelten nur für bestimmte Verfahren, daher hier 'zpo'
// (Geltungsbereich je Engine: rl22-geltungsbereich.test.ts).

import { describe, expect, it } from 'vitest';
import { berechneFrist } from '../lib/zpoFristen';
import { istFeiertag } from '../data/zpoFeiertage';
import type { ZpoInput } from '../types/zpo';
import type { Kanton } from '../types/legal';

const summarisch10 = (ereignis: string, kanton: Kanton): ZpoInput => ({
  ereignis,
  einheit: 'tage',
  laenge: 10,
  verfahren: 'summarisch',
  kanton,
  fristnatur: 'gesetzlich',
});

describe('SO: 1. Mai ist Feiertag für Art. 142 ZPO (EG ZPO SO § 22 Abs. 2, BGS 221.2) — R1-02', () => {
  it('istFeiertag(1.5.2026, SO, zpo) = true', () => {
    expect(istFeiertag(new Date(2026, 4, 1), 'SO', 'zpo')).toBe(true);
  });
  it('Zustellung 21.4.2026 + 10 Tage → Fr 1.5. Feiertag, Sa/So → Mo 4.5.2026', () => {
    expect(berechneFrist(summarisch10('2026-04-21', 'SO')).diesAdQuem).toBe('04.05.2026');
  });
  it('Kontrolle: 8.12. bleibt in SO kein Feiertag (§ 22 Abs. 2 nennt ihn nicht)', () => {
    expect(istFeiertag(new Date(2026, 11, 8), 'SO', 'zpo')).toBe(false);
  });
});

describe('UR: Stephanstag unbedingt (Ruhetagsgesetz UR Art. 9 lit. b, RB 70.1421) — R1-03', () => {
  it('istFeiertag(26.12.2028, UR) = true, obwohl Weihnachten 2028 ein Montag ist', () => {
    expect(new Date(2028, 11, 25).getDay()).toBe(1);
    expect(istFeiertag(new Date(2028, 11, 26), 'UR')).toBe(true);
  });
  it('Zustellung 16.12.2028 + 10 Tage → Di 26.12. Feiertag → Mi 27.12.2028', () => {
    expect(berechneFrist(summarisch10('2028-12-16', 'UR')).diesAdQuem).toBe('27.12.2028');
  });
  it('Kontrolle: Weihnachten am Donnerstag (2025) → 26.12.2025 Feiertag (war schon vorher so)', () => {
    expect(istFeiertag(new Date(2025, 11, 26), 'UR')).toBe(true);
  });
});

describe('NE: Schliesstage der Kantonsverwaltung gelten als Feiertag (LI-CPC Art. 10a, RSN 251.1) — R1-04, W-10 (a)', () => {
  it('Zustellung 21.12.2026 + 10 Tage → Do 31.12. geschlossen, 1.1. Neujahr, Sa/So → Mo 4.1.2027', () => {
    expect(berechneFrist(summarisch10('2026-12-21', 'NE')).diesAdQuem).toBe('04.01.2027');
  });
  it('istFeiertag(31.12.2026, NE, zpo) = true', () => {
    expect(istFeiertag(new Date(2026, 11, 31), 'NE', 'zpo')).toBe(true);
  });
});

describe('NE 2026: weitere amtlich publizierte Schliesstage (LI-CPC Art. 10a) — R1-04', () => {
  it('Zustellung 5.5.2026 + 10 Tage → Fr 15.5. (Freitag nach Auffahrt, Verwaltung zu) → Mo 18.5.2026', () => {
    expect(berechneFrist(summarisch10('2026-05-05', 'NE')).diesAdQuem).toBe('18.05.2026');
  });
  it('Zustellung 14.12.2026 + 10 Tage → Do 24.12. zu, 25.12. Weihnachten, Sa/So → Mo 28.12.2026', () => {
    expect(berechneFrist(summarisch10('2026-12-14', 'NE')).diesAdQuem).toBe('28.12.2026');
  });
  it('Ostermontag, Pfingstmontag, Lundi du Jeûne 2026 in NE Feiertag', () => {
    expect(istFeiertag(new Date(2026, 3, 6), 'NE', 'zpo')).toBe(true);
    expect(istFeiertag(new Date(2026, 4, 25), 'NE', 'zpo')).toBe(true);
    expect(istFeiertag(new Date(2026, 8, 21), 'NE', 'zpo')).toBe(true);
  });
});
