// ─── BS: Entscheiddatum aus dem Urteilskopf, nicht aus dem Portal-Metadatum ───
//
// ANLASS (Gegenprüfung Opus von PR #1295, 4.10.2026; Entscheid David 4.10.2026,
// «Variante A», Regel wie für die OCL-Kantone am 25.9.2026): Der Import führte
// das Portal-Feld «Entscheiddatum» als `datum`, obwohl das Datum im Urteilskopf
// («ENTSCHEID/URTEIL vom …») amtlich massgeblich ist. Belegt an acht echten
// Portal-Dokumenten (Abruf 4.10.2026, Fixtures bs-kopfdatum-*.html, rohbytes).
// Kopf-Datum gewinnt; Portal-Datum bleibt als `datumPortal` erhalten (§8-Hinweis).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBsDokument, baueSnapshot, waehleBsDatum, kopfDatumFund } from '../../scripts/rechtsprechung/bs-parse';
import { abweichungen } from '../../scripts/rechtsprechung/bs-delta';
import { dekodiereBs } from '../../scripts/rechtsprechung/bs-client';
import { pruefeBs } from '../../scripts/rechtsprechung/wochenlauf-kern';
import { formatiereDatumBericht } from '../../scripts/rechtsprechung/bs-datum-bericht';
import type { InventarZeile } from '../../scripts/rechtsprechung/bs-inventar';

const FIX = join(process.cwd(), 'scripts', 'rechtsprechung', 'fixtures');
const fix = (gn: string): Buffer => readFileSync(join(FIX, `bs-kopfdatum-${gn.toLowerCase().replace(/\./g, '-')}.html`));

/** [Geschäftsnummer, Portal-Metadatum, Kopf-Datum] — Messung 4.10.2026 am Portal. */
const BELEGE: Array<[string, string, string]> = [
  ['AUS.2026.85', '2026-09-30', '2026-10-01'],
  ['BES.2025.105', '2026-03-04', '2026-04-01'],
  ['BES.2025.117', '2026-04-08', '2026-05-06'],
  ['VD.2025.146', '2026-05-06', '2026-04-06'],
  ['AUS.2022.46', '2022-09-16', '2022-09-21'],
  ['AUS.2022.57', '2022-12-19', '2022-12-21'],
  ['BES.2023.14', '2023-09-05', '2023-10-05'],
  ['BEZ.2025.33', '2025-06-10', '2025-06-12'],
];

const zeileVon = (p: ReturnType<typeof parseBsDokument>): InventarZeile => ({
  key: 1, gn: p.gn, gnSekundaer: p.gnSekundaer, datum: p.datum, titel: p.titel,
  erstpublikation: p.erstpublikation, aktualisiert: p.aktualisiert,
});

describe('BS-Entscheiddatum: Kopf vor Portal-Metadatum (Variante A)', () => {
  for (const [gn, meta, kopf] of BELEGE) {
    it(`${gn}: Portal ${meta}, Kopf ${kopf} → datum = Kopf, Portal-Datum bleibt erhalten`, () => {
      const p = parseBsDokument(fix(gn));
      expect(p.datum).toBe(meta);          // Portal-Metadatum unverändert gelesen
      expect(p.datumKopf).toBe(kopf);      // Kopf wird seit B-1 gelesen
      const s = baueSnapshot(p, zeileVon(p), p.gn, '2026-10-04');
      expect(s.datum).toBe(kopf);
      const [y, m, d] = kopf.split('-');
      expect(s.zitierung.endsWith(` vom ${d}.${m}.${y}`)).toBe(true);
      expect(s.datumPortal).toBe(meta);
      expect(s.datumUnbekannt).toBeUndefined();
    });
  }
});

describe('waehleBsDatum — Regel und Plausibilitäts-Wächter', () => {
  it('Kopf gewinnt; Portal bleibt als datumPortal, wo es abweicht', () => {
    expect(waehleBsDatum('2022-09-16', '2022-09-21', 2022, '2022-09-24', '2026-10-04'))
      .toEqual({ datum: '2022-09-21', quelle: 'kopf', datumPortal: '2022-09-16', verdacht: null, datumKopfAbweichend: null });
  });
  it('Kopf == Portal: kein datumPortal', () => {
    expect(waehleBsDatum('2023-05-05', '2023-05-05', 2022, null, null).datumPortal).toBeNull();
  });
  it('kein Kopf-Datum lesbar: Rückfall auf das Portal-Metadatum (wie bisher)', () => {
    expect(waehleBsDatum('2023-05-05', null, 2022, null, null)).toEqual({ datum: '2023-05-05', quelle: 'portal', datumPortal: null, verdacht: null, datumKopfAbweichend: null });
  });
  it('weder Kopf noch Portal: ehrlicher Platzhalter <GN-Jahr>-01-01 (wie bisher)', () => {
    expect(waehleBsDatum(null, null, 2024, null, null)).toMatchObject({ datum: '2024-01-01', quelle: 'platzhalter' });
  });
  it('nur Kopf (Portal ohne Datum): Kopf (B-1 unverändert)', () => {
    expect(waehleBsDatum(null, '2025-09-15', 2024, '2026-04-10', null)).toMatchObject({ datum: '2025-09-15', quelle: 'kopf', datumPortal: null });
  });
  it('Verdacht, nicht still übernommen: > 60 Tage vom Portal, Zukunft, vor GN-Jahr, nach Erstpublikation', () => {
    const fern = waehleBsDatum('2025-01-10', '2025-04-01', 2025, null, '2026-10-04');
    expect(fern).toMatchObject({ datum: '2025-01-10', quelle: 'portal', datumPortal: null });
    expect(fern.verdacht).toMatch(/Tage vom Portal-Datum/);
    expect(waehleBsDatum('2026-09-30', '2026-12-01', 2026, null, '2026-10-04').verdacht).toMatch(/Zukunft/);
    expect(waehleBsDatum('2024-01-02', '2023-12-31', 2024, null, null).verdacht).toMatch(/unplausibel/);
    expect(waehleBsDatum('2024-01-02', '2024-01-05', 2024, '2024-01-04', null).verdacht).toMatch(/unplausibel/);
  });
  it('Grenze: genau 60 Tage Abstand wird übernommen, 61 nicht', () => {
    expect(waehleBsDatum('2025-01-01', '2025-03-02', 2025, null, null).quelle).toBe('kopf');
    expect(waehleBsDatum('2025-01-01', '2025-03-03', 2025, null, null).quelle).toBe('portal');
  });
});

describe('Kopf-Fundstelle, Delta, Stichprobe, Liste', () => {
  it('kopfDatumFund nennt Titelzeile, Datumszeile und Einheit', () => {
    const f = kopfDatumFund([{ text: 'Appellationsgericht' }, { text: 'BES.2024.88' }, { text: 'ENTSCHEID' }, { text: 'vom 15. September 2025' }]);
    expect(f).toEqual({ iso: '2025-09-15', einheit: 3, titel: 'ENTSCHEID', text: 'vom 15. September 2025', rektifikat: false });
  });
  it('Delta: ein Snapshot mit Kopf-Datum und datumPortal weicht NICHT vom Inventar ab', () => {
    const p = parseBsDokument(fix('AUS.2022.46'));
    const z = zeileVon(p);
    const s = baueSnapshot(p, z, p.gn, '2026-10-04');
    expect(s.datum).toBe('2022-09-21');
    expect(abweichungen(z, s)).toEqual([]);
    expect(abweichungen({ ...z, datum: '2022-09-17' }, s)).toEqual(['datum 2022-09-16→2022-09-17']);
  });
  it('Stichprobe pruefeBs: Soll = Kopf-Datum; das Portal-Metadatum im Korpus ist jetzt ein Fehltreffer', () => {
    const html = dekodiereBs(fix('BES.2025.117'));
    const e = (datum: string) => ({ key: 'k', gericht: 'bs_appellationsgericht', datum, nummer: 'BES.2025.117', quelle: 'gerichte-bs' }) as never;
    expect(pruefeBs(html, e('2026-05-06')).treffer).toBe(true);
    const alt = pruefeBs(html, e('2026-04-08'));
    expect(alt.treffer).toBe(false);
    expect(alt.detail).toContain('2026-05-06');
  });
  it('Liste: jede Änderung trägt ihre Kopf-Fundstelle und den Portal-Link', () => {
    const p = parseBsDokument(fix('BEZ.2025.33'));
    const md = formatiereDatumBericht({
      geprueft: 1, kopfGleich: 0, ohneKopf: 0, portalOhneDatum: 0, geschrieben: 1, uebersprungen: [], verdacht: [],
      aenderungen: [{ id: 'kanton/BS/x/BEZ.2025.33', gn: p.gn, key: 78501, alt: '2025-06-10', neu: '2025-06-12', tage: 2, fund: p.kopfFund ?? null, url: 'https://rechtsprechung.gerichte.bs.ch/x' }],
    }, '2026-10-04', '2026-09-28');
    expect(md).toContain('| BEZ.2025.33 | 10.06.2025 | 12.06.2025 | +2 |');
    expect(md).toMatch(/«[A-ZÄÖÜ ]+» \/ «vom 12\. Juni 2025» \(E \d+\)/);
  });
});

// ── Gegenprüfung #1303, A2: zusammengesetzte Titel («ZWISCHENENTSCHEID», «TEILENTSCHEID») ──
describe('Kopf-Titel: Komposita werden erkannt (A2)', () => {
  /** [Geschäftsnummer, Fixture-Titel, Portal-Metadatum, Kopf-Datum] — Rohdaten-Messung 4.10.2026. */
  const KOMPOSITA: Array<[string, string, string, string]> = [
    ['SB.2021.100', 'ZWISCHENENTSCHEID', '2022-01-04', '2022-02-23'],
    ['ZK.2020.3', 'TEILENTSCHEID', '2024-04-23', '2024-04-25'],
    ['SB.2025.50', 'ZWISCHENENTSCHEID', '2025-09-15', '2025-09-16'],
  ];
  for (const [gn, titel, portal, kopf] of KOMPOSITA) {
    it(`${gn}: «${titel}» → Kopf ${kopf} statt Portal ${portal}`, () => {
      const p = parseBsDokument(fix(gn));
      expect(p.datum).toBe(portal);
      expect(p.datumKopf).toBe(kopf);
      expect(p.kopfFund?.titel).toBe(titel);
      const s = baueSnapshot(p, zeileVon(p), p.gn, '2026-10-04');
      expect(s.datum).toBe(kopf);
      expect(s.datumPortal).toBe(portal);
    });
  }
  it('Titel-Absätze: Komposita und Plain-Titel in Gross-/Kleinschrift; Fremdes nicht', () => {
    const f = (titel: string) => kopfDatumFund([{ text: 'GN' }, { text: titel }, { text: 'vom 3. Mai 2024' }])?.iso ?? null;
    for (const t of ['ZWISCHENENTSCHEID', 'ZWISCHEN-ENTSCHEID', '(ZWISCHEN-)ENTSCHEID', 'ZWISCHEN-URTEIL', 'TEILURTEIL', 'ABWESENHEITS-URTEIL', 'ERLÄUTERUNGSENTSCHEID', 'Zwischenentscheid', 'Urteil', 'Beschluss']) {
      expect(f(t), t).toBe('2024-05-03');
    }
    for (const t of ['Einspracheentscheid', 'Verfügungen', 'Mit Urteil']) expect(f(t), t).toBeNull();
  });
});

// ── Gegenprüfung #1303, A1: Verdacht trägt trotzdem den Hinweis auf das Kopf-Datum ──
describe('Verdachtsfälle: Portal-Datum bleibt, Hinweis nennt den Kopf (A1)', () => {
  it('waehleBsDatum: datumKopfAbweichend bei Verdacht, nie zusammen mit datumPortal', () => {
    const w = waehleBsDatum('2025-01-10', '2025-04-01', 2025, null, '2026-10-04');
    expect(w).toMatchObject({ datum: '2025-01-10', quelle: 'portal', datumPortal: null, datumKopfAbweichend: '2025-04-01' });
    expect(waehleBsDatum('2025-01-10', '2025-01-12', 2025, null, null)).toMatchObject({ datumPortal: '2025-01-10', datumKopfAbweichend: null });
    expect(waehleBsDatum('2025-01-10', null, 2025, null, null).datumKopfAbweichend).toBeNull();
  });
  for (const [gn, portal, kopf] of [['VD.2023.151', '2024-03-08', '2023-03-08'], ['SB.2021.107', '2022-03-29', '2023-03-29']]) {
    it(`${gn}: Portal ${portal} bleibt, Hinweis Kopf ${kopf}`, () => {
      const p = parseBsDokument(fix(gn));
      const s = baueSnapshot(p, zeileVon(p), p.gn, '2026-10-04');
      expect(s.datum).toBe(portal);
      expect(s.datumKopfAbweichend).toBe(kopf);
      expect(s.datumPortal).toBeUndefined();
      expect(abweichungen(zeileVon(p), s)).toEqual([]);
    });
  }
});

// ── Delta-Gegenprüfung #1303, R1: Rektifikat-Köpfe lesen, Datum NICHT übernehmen, bei Abweichung Hinweis ──
describe('Rektifikat-Köpfe (R1)', () => {
  it('DGZ.2026.2 «REKTIFIKAT vom 21. April 2026» ↔ Portal 30.04.2026: Portal bleibt, Hinweis auf den Kopf', () => {
    const p = parseBsDokument(fix('DGZ.2026.2'));
    expect(p.datum).toBe('2026-04-30');
    expect(p.kopfFund).toMatchObject({ iso: '2026-04-21', rektifikat: true });
    const s = baueSnapshot(p, zeileVon(p), p.gn, '2026-10-04');
    expect(s.datum).toBe('2026-04-30');
    expect(s.datumPortal).toBeUndefined();
    expect(s.datumKopfAbweichend).toBe('2026-04-21');
  });
  it('IV.2020.165 «URTEIL (Rektifikat vom 13.1.23)» nennt das Entscheid-Datum = Portal: kein Hinweis', () => {
    const p = parseBsDokument(fix('IV.2020.165'));
    expect(p.kopfFund).toMatchObject({ iso: '2022-12-01', rektifikat: true });
    const s = baueSnapshot(p, zeileVon(p), p.gn, '2026-10-04');
    expect(s.datum).toBe('2022-12-01');
    expect(s.datumKopfAbweichend).toBeUndefined();
    expect(s.datumPortal).toBeUndefined();
  });
  it('waehleBsDatum mit Rektifikat-Kopf: nie als Kopf-Datum gewählt', () => {
    expect(waehleBsDatum('2026-04-30', '2026-04-21', 2026, null, null, true))
      .toMatchObject({ datum: '2026-04-30', quelle: 'portal', datumPortal: null, datumKopfAbweichend: '2026-04-21' });
    expect(waehleBsDatum('2022-12-01', '2022-12-01', 2020, null, null, true)).toMatchObject({ datum: '2022-12-01', datumKopfAbweichend: null, verdacht: null });
  });
});
