import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  AG_PRAEFIX_GERICHT, SG_PRAEFIX_GERICHT, agPraefix, amtlicherGerichtName, amtlichesAktenzeichen,
  oclAktenzeichen, sgPraefix, zitierungNachKorrektur,
} from '../lib/rechtsprechung/kantonale-gerichte';
import { mappeEntscheidOCL } from '../../scripts/normtext/adapter-entscheide';
import type { EntscheidSnapshot, EntscheidSnapshotDatei } from '../lib/rechtsprechung/typen';

// U-24 (Gerichtsname) und U-16 (GR-Aktenzeichen), plan/FEHLERBESTAND.md. Amtliche Belege (abgerufen 11.10.2026):
//  · GR: Kopf aller 18 Entscheide im Bestand «Obergericht des Kantons Graubünden», «Referenz SBK 26 88»
//    (https://entscheidsuche.gr.ch/tribunavtplus/ServletDownload/SBK_2026_88_… — PDF-Kopf); Obergericht ab 1.1.2025
//    (KJS-Bericht Grosser Rat GR: «… das Kantons- und das Verwaltungsgericht – und ab 2025 auch das Obergericht»).
//  · AG: PDF-Köpfe decwork.ag.ch — HOR.2024.19 «Handelsgericht», VBE.* «Versicherungsgericht», SBE/SST/XBE/ZOR/ZSU «Obergericht».
//  · SG: publikationen.sg.ch «Stelle: Verwaltungsgericht» (B), «Stelle: Versicherungsgericht» (BV), «Verwaltungsrekurskommission» (I/1).

describe('amtlicher Gerichtsname', () => {
  it('GR: ab 1.1.2025 Obergericht, davor Kantonsgericht (Grenztag eingeschlossen)', () => {
    expect(amtlicherGerichtName('gr_gerichte', 'SBK 2026 88', '2026-09-21')).toBe('Obergericht GR');
    expect(amtlicherGerichtName('gr_gerichte', 'ZR1 2024 196', '2025-01-01')).toBe('Obergericht GR');
    expect(amtlicherGerichtName('gr_gerichte', 'ZK1 2024 5', '2024-12-31')).toBe('Kantonsgericht GR');
    expect(amtlicherGerichtName('gr_gerichte', 'SBK 2026 88', '')).toBeNull();
  });
  it('AG: das Gericht hängt am Präfix, unbekannte Präfixe liefern null (nicht raten)', () => {
    expect(amtlicherGerichtName('ag_gerichte', 'HOR.2024.19', '2025-12-02')).toBe('Handelsgericht AG');
    expect(amtlicherGerichtName('ag_gerichte', 'VBE.2024.399', '2025-02-25')).toBe('Versicherungsgericht AG');
    expect(amtlicherGerichtName('ag_gerichte', 'ZOR.2024.64', '2025-08-20')).toBe('Obergericht AG');
    expect(amtlicherGerichtName('ag_gerichte', 'WBE.2024.1', '2025-08-20')).toBeNull();
    expect(agPraefix('HOR.2024.19')).toBe('HOR');
  });
  it('SG: B Verwaltungsgericht, BV/UV Versicherungsgericht, I/ Verwaltungsrekurskommission', () => {
    expect(amtlicherGerichtName('sg_gerichte', 'B 2024/58, B 2024/59', '2025-02-03')).toBe('Verwaltungsgericht SG');
    expect(amtlicherGerichtName('sg_gerichte', 'BV 2024/21', '2025-08-04')).toBe('Versicherungsgericht SG');
    expect(amtlicherGerichtName('sg_gerichte', 'UV 2025/14', '2025-10-21')).toBe('Versicherungsgericht SG');
    expect(amtlicherGerichtName('sg_gerichte', 'I/1-2023/157, 158', '2024-05-30')).toBe('Verwaltungsrekurskommission SG');
    expect(amtlicherGerichtName('sg_gerichte', 'IV 2025/1', '2025-10-21')).toBeNull();
    expect(sgPraefix('I/1-2023/157, 158')).toBe('I/');
  });
  it('andere Court-Codes bleiben unberührt', () => {
    expect(amtlicherGerichtName('zh_obergericht', 'LB250001', '2026-01-01')).toBeNull();
  });
});

describe('amtliches Aktenzeichen (GR zweistelliges Jahr)', () => {
  it('rechnet in beide Richtungen und ist idempotent', () => {
    expect(amtlichesAktenzeichen('gr_gerichte', 'SBK 2026 88')).toBe('SBK 26 88');
    expect(amtlichesAktenzeichen('gr_gerichte', 'ZR1 2024 196')).toBe('ZR1 24 196');
    expect(amtlichesAktenzeichen('gr_gerichte', 'SBK 26 88')).toBe('SBK 26 88');
    expect(oclAktenzeichen('gr_gerichte', 'SBK 26 88')).toBe('SBK 2026 88');
    expect(oclAktenzeichen('gr_gerichte', 'SBK 2026 88')).toBe('SBK 2026 88');
    expect(amtlichesAktenzeichen('ag_gerichte', 'HOR.2024.19')).toBe('HOR.2024.19');
  });
  it('Zitierung wird nur bei passendem Präfix umgeschrieben', () => {
    const alt = { name: 'Kantonsgericht GR', nummer: 'SBK 2026 88' };
    const neu = { name: 'Obergericht GR', nummer: 'SBK 26 88' };
    expect(zitierungNachKorrektur('Kantonsgericht GR SBK 2026 88 vom 21.09.2026', alt, neu)).toBe('Obergericht GR SBK 26 88 vom 21.09.2026');
    expect(zitierungNachKorrektur('Anderes 1 vom 21.09.2026', alt, neu)).toBe('Anderes 1 vom 21.09.2026');
  });
});

describe('Adapter: Neuzug erzeugt dieselben Werte wie die Bestandsregel', () => {
  const det = (court: string, canton: string, docket: string, date: string) => ({
    decision_id: `${court}_${docket.replace(/\s+/g, '_')}`, court, canton, docket_number: docket, decision_date: date,
    language: 'de', full_text: 'Erwägungen. Text des Entscheids, der lang genug ist, um als Volltext durchzugehen.', content_hash: 'h',
  });
  it('GR SBK 2026 88: Obergericht GR, SBK 26 88, id unverändert', () => {
    const s = mappeEntscheidOCL(det('gr_gerichte', 'GR', 'SBK 2026 88', '2026-09-21'), null, '2026-10-01')!;
    expect(s.gerichtName).toBe('Obergericht GR');
    expect(s.nummer).toBe('SBK 26 88');
    expect(s.zitierung).toBe('Obergericht GR SBK 26 88 vom 21.09.2026');
    expect(s.id).toBe('kanton/GR/gr_gerichte/SBK202688');
  });
  it('AG HOR.2024.19: Handelsgericht AG; SG I/1: Verwaltungsrekurskommission SG', () => {
    expect(mappeEntscheidOCL(det('ag_gerichte', 'AG', 'HOR.2024.19', '2025-12-02'), null, '2026-10-01')!.zitierung)
      .toBe('Handelsgericht AG HOR.2024.19 vom 02.12.2025');
    expect(mappeEntscheidOCL(det('sg_gerichte', 'SG', 'I/1-2023/157, 158', '2024-05-30'), null, '2026-10-01')!.gerichtName)
      .toBe('Verwaltungsrekurskommission SG');
  });
});

// Korpus-Tor «Präfix → Gericht» für ag_/sg_/gr_gerichte. Scheitert, sobald ein Nachzug einen nicht belegten Präfix
// bringt (dann Beleg im PDF-Kopf holen und die Tabelle in kantonale-gerichte.ts ergänzen) oder ein Name von der
// Tabelle abweicht.
describe('Korpus: jeder ag_/sg_/gr_-Entscheid trägt den amtlichen Gerichtsnamen seines Präfixes', () => {
  const wurzel = join(process.cwd(), 'public', 'rechtsprechung', 'kanton');
  const snaps: EntscheidSnapshot[] = [];
  const geh = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) geh(p);
      else if (n.endsWith('.json')) {
        const j = JSON.parse(readFileSync(p, 'utf8')) as EntscheidSnapshotDatei;
        for (const e of j.eintraege ?? []) if (['ag_gerichte', 'sg_gerichte', 'gr_gerichte'].includes(e.gericht)) snaps.push(e);
      }
    }
  };
  geh(wurzel);

  it('Bestand ist nicht leer (das Tor prüft etwas)', () => {
    expect(snaps.length).toBeGreaterThanOrEqual(40);
  });
  it('Gerichtsname == Tabelle; Zitierung beginnt mit «<Name> <Nummer>»', () => {
    const abweichend: string[] = [];
    for (const s of snaps) {
      const soll = amtlicherGerichtName(s.gericht, s.nummer, s.datum);
      if (soll === null || s.gerichtName !== soll || !s.zitierung.startsWith(`${s.gerichtName} ${s.nummer} vom `)) {
        abweichend.push(`${s.id}: ${s.gerichtName} | ${s.nummer} | soll ${soll}`);
      }
    }
    expect(abweichend).toEqual([]);
  });
  it('AG-/SG-Tabellen enthalten nur Präfixe, die im Bestand vorkommen oder belegt sind', () => {
    const ag = new Set(snaps.filter((s) => s.gericht === 'ag_gerichte').map((s) => agPraefix(s.nummer)));
    for (const p of ag) expect(Object.keys(AG_PRAEFIX_GERICHT), `AG-Präfix ${p}`).toContain(p);
    const sg = new Set(snaps.filter((s) => s.gericht === 'sg_gerichte').map((s) => sgPraefix(s.nummer)));
    for (const p of sg) expect(Object.keys(SG_PRAEFIX_GERICHT), `SG-Präfix ${p}`).toContain(p);
  });
  it('GR: amtliches Aktenzeichen (zweistelliges Jahr), ausnahmslos Obergericht (alle Entscheide ab 2025)', () => {
    const gr = snaps.filter((s) => s.gericht === 'gr_gerichte');
    expect(gr.length).toBeGreaterThanOrEqual(18);
    for (const s of gr) {
      expect(s.nummer, s.id).toMatch(/^[A-Z]+\d? \d{2} \d+$/);
      // Vor 2025 hiesse der Name Kantonsgericht/Verwaltungsgericht — eine Zuordnung, die der Bestand nicht belegt.
      expect(s.datum >= '2025-01-01', `${s.id} ${s.datum}`).toBe(true);
      expect(s.gerichtName).toBe('Obergericht GR');
    }
  });
});
