import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  kopfEntscheiddatum, kopfBereich, pdfKopfNormalisieren,
} from '../../scripts/normtext/entscheid-kopfdatum';
import { mappeEntscheidOCL, type OclDecision } from '../../scripts/normtext/adapter-entscheide';
import { kantonsEntscheiddatum } from '../../scripts/normtext/entscheid-kantonsdatum';
import { kopfdatumRefresh } from '../../scripts/normtext/entscheide-kopfdatum-refresh';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

// Echte Urteilsköpfe (OCL full_text, abgerufen 25.9.2026), Soll-Datum identitäts-
// geprüft gegen den Kopf des amtlichen PDF/HTML (QS-KORPUS, Entscheid David 25.9.2026).
const FIX = JSON.parse(readFileSync(join(process.cwd(), 'src', 'tests', 'fixtures', 'entscheid-kopfdatum-auszuege.json'), 'utf8')) as {
  auszuege: Array<{ kanton: string; nummer: string; oclDecisionDate: string | null; amtlich: string; kopf: string }>;
};

describe('kopfEntscheiddatum — echte Köpfe je Kanton', () => {
  for (const a of FIX.auszuege) {
    it(`${a.kanton} ${a.nummer} → ${a.amtlich}`, () => {
      const k = kopfEntscheiddatum(a.kopf, a.nummer);
      expect(k.status).toBe('ok');
      if (k.status === 'ok') expect(k.datum).toBe(a.amtlich);
    });
  }
  it('deckt GR, BE, SG, AG, ZH, BS ab', () => {
    expect([...new Set(FIX.auszuege.map((a) => a.kanton))].sort()).toEqual(['AG', 'BE', 'BS', 'GR', 'SG', 'ZH']);
  });
  it('die Fixture belegt den Quirk: OCL-decision_date weicht bei ≥ 6 Auszügen ab', () => {
    const ab = FIX.auszuege.filter((a) => a.oclDecisionDate && a.oclDecisionDate !== a.amtlich);
    expect(ab.length).toBeGreaterThanOrEqual(6);
  });
});

describe('kopfEntscheiddatum — Fallen', () => {
  it('GR: «mitgeteilt am» ist nicht das Entscheiddatum', () => {
    const k = kopfEntscheiddatum('Obergericht des Kantons Graubünden Urteil vom 25. April 2026 mitgeteilt am 5. Mai 2026 Referenz ZR1 24 196', 'ZR1 24 196');
    expect(k).toMatchObject({ status: 'ok', datum: '2026-04-25', regel: 'titel-vom' });
  });
  it('Vorinstanz-Datum hinter «betreffend» liegt ausserhalb des Kopfs', () => {
    const t = 'Verwaltungsgericht des Kantons Bern A.____ Beschwerdeführer gegen Suva Beschwerdegegnerin betreffend Verfügung vom 13. Januar 2026';
    expect(kopfBereich(t)).not.toMatch(/Verfügung/);
    expect(kopfEntscheiddatum(t, '200 2026 94').status).toBe('fehlt');
  });
  it('Anfechtungsobjekt «Verfügung vom» im Portal-Titel ist nicht das Entscheiddatum (BS IV.2021.50)', () => {
    const t = 'Geschäftsnummer: IV.2021.50 (SVG.2022.58) Instanz: Sozialversicherungsgericht Titel: IVG Verfügung vom 22. März 2021 Geburtsgebrechen; medizinische Massnahmen Sozialversicherungsgericht des Kantons Basel-Stadt URTEIL vom 3. Februar 2022 Mitwirkende Dr. A. Pfleiderer (Vorsitz)';
    expect(kopfEntscheiddatum(t, 'IV.2021.50')).toMatchObject({ status: 'ok', datum: '2022-02-03', regel: 'titel-vom' });
  });
  it('«Einspracheentscheid vom» ist kein eigener Titel', () => {
    expect(kopfEntscheiddatum('Verwaltungsgericht Einspracheentscheid vom 25. März 2026', null).status).toBe('fehlt');
  });
  it('fremder Titel («Urteil des Bundesgerichts vom») greift nicht', () => {
    expect(kopfEntscheiddatum('Obergericht Urteil des Bundesgerichts vom 3. Mai 2024', null).status).toBe('fehlt');
  });
  it('Zitat «wurde mit Urteil vom …» / «(Urteil vom …» ist nicht der eigene Titel', () => {
    expect(kopfEntscheiddatum('Die Beschwerde wurde mit Urteil vom 22. Dezember 2025 abgewiesen', null).status).toBe('fehlt');
    expect(kopfEntscheiddatum('Regeste (Urteil vom 3. Mai 2024, 9C_1/2024)', null).status).toBe('fehlt');
  });
  it('Mitteilung/Versand/Publikation sind keine Entscheid-Titel', () => {
    expect(kopfEntscheiddatum('Mitteilung vom 5. Mai 2026 Versand vom 6. Mai 2026 Publikationsdatum: 27.02.2025', null).status).toBe('fehlt');
  });
  it('SG-Deckblatt: «Publikationsdatum» verliert gegen «Entscheiddatum»', () => {
    const k = kopfEntscheiddatum('Fall-Nr.: B 2023/225 Publikationsdatum: 27.02.2025 Entscheiddatum: 08.01.2025', 'B 2023/225');
    expect(k).toMatchObject({ status: 'ok', datum: '2025-01-08', regel: 'feld-entscheiddatum' });
  });
  it('SG: Kopfzeile gilt nur mit dem EIGENEN Aktenzeichen dahinter', () => {
    expect(kopfEntscheiddatum('St.Gallen Verwaltungsgericht 08.01.2025 B 2023/226', 'B 2023/225').status).toBe('fehlt');
  });
  it('eigener Titel MIT Identitätsbeleg schlägt abweichende Plattform-Angabe und meldet sie (SG BV 2024/21)', () => {
    // Seit Gegenprüfung #1126 nur mit Beleg (eigenes Aktenzeichen, hier die Regeste-Zitierung);
    // ohne Beleg ⇒ widerspruch (entscheid-kopfdatum-identitaet.test.ts).
    const k = kopfEntscheiddatum('Entscheiddatum: 04.07.2025 (Entscheid des Versicherungsgerichts des Kantons St. Gallen vom 4. August 2025, BV 2024/21). Versicherungsgericht Abteilung III Entscheid vom 4. August 2025 Besetzung', 'BV 2024/21');
    expect(k).toMatchObject({ status: 'ok', datum: '2025-08-04', regel: 'titel-vom' });
    if (k.status === 'ok') expect(k.abweichung.map((x) => x.datum)).toEqual(['2025-07-04']);
  });
  it('widersprüchliche Plattform-Angaben ohne eigenen Titel ⇒ widerspruch (nie raten)', () => {
    expect(kopfEntscheiddatum('Entscheiddatum: 04.07.2025 St.Gallen Versicherungsgericht 05.07.2025 BV 2024/21', 'BV 2024/21').status).toBe('widerspruch');
  });
  it('fehlendes Datum, leerer und null-Text ⇒ fehlt', () => {
    expect(kopfEntscheiddatum('Obergericht des Kantons Zürich II. Zivilkammer Geschäfts-Nr.: PS260264-O/U', 'PS260264').status).toBe('fehlt');
    expect(kopfEntscheiddatum('', 'x').status).toBe('fehlt');
    expect(kopfEntscheiddatum(null, 'x').status).toBe('fehlt');
  });
  it('Kalender-Gegenprobe: «31. April» ist kein Datum', () => {
    expect(kopfEntscheiddatum('Urteil vom 31. April 2026', null).status).toBe('fehlt');
  });
  it('Datum tief im Fliesstext (jenseits des Kopf-Fensters) zählt nicht', () => {
    expect(kopfEntscheiddatum(`${'x '.repeat(900)}Urteil vom 2. Juni 2026`, null).status).toBe('fehlt');
  });
});

describe('pdfKopfNormalisieren', () => {
  it('fügt gesperrte Tagesziffern vor «. Monat» zusammen (AG-PDF)', () => {
    expect(pdfKopfNormalisieren('Entscheid vom 2 1 . August 2025')).toBe('Entscheid vom 21. August 2025');
    expect(pdfKopfNormalisieren('Urteil vom 1 1. September 2025')).toBe('Urteil vom 11. September 2025');
  });
  it('lässt Aktenzeichen und sonstige Ziffernfolgen unberührt', () => {
    expect(pdfKopfNormalisieren('BV 200 2024 417 Art. 6 1')).toBe('BV 200 2024 417 Art. 6 1');
  });
});

describe('mappeEntscheidOCL — Entscheiddatum aus dem Kopf (kantonal) ', () => {
  const basis = (over: Partial<OclDecision>): OclDecision => ({
    decision_id: 'x', court: 'ag_gerichte', canton: 'AG', language: 'de',
    docket_number: 'XBE.2025.10', decision_date: '2025-10-21',
    full_text: 'Obergericht Kammer für Kindes- und Erwachsenenschutz XBE.2025.10 Entscheid vom 21. August 2025 Besetzung Oberrichterin Merkofer\n\nDas Obergericht entnimmt den Akten: 1. Die Beschwerde ist begründet und wird gutgeheissen.',
    ...over,
  } as OclDecision);
  it('kantonal: Kopfdatum gewinnt über decision_date, Zitierung folgt', () => {
    const s = mappeEntscheidOCL(basis({}), null, '2026-09-25')!;
    expect(s.datum).toBe('2025-08-21');
    expect(s.zitierung).toMatch(/ vom 21\.08\.2025$/);
  });
  it('kantonal ohne Kopfdatum: decision_date bleibt', () => {
    const s = mappeEntscheidOCL(basis({ full_text: 'Obergericht XBE.2025.10 Besetzung Oberrichterin Merkofer. Die Beschwerde wird gutgeheissen.' }), null, '2026-09-25')!;
    expect(s.datum).toBe('2025-10-21');
  });
  it('SG-Deckblatt ohne eigenen Kopf: Titel im amtlichen PDF gewinnt (UV 2025/14)', () => {
    const det = basis({
      court: 'sg_gerichte', canton: 'SG', docket_number: 'UV 2025/14', decision_date: '2025-10-23',
      full_text: 'St.Gallen Versicherungsgericht 23.10.2025 UV 2025/14 Saint-Gall Versicherungsgericht 23.10.2025 UV 2025/14 Art. 6 Abs. 1 UVG; Leistungspflicht der Unfallversicherung.',
    });
    expect(kantonsEntscheiddatum(det).datum).toBe('2025-10-23');
    const seiten = ['Publikationsplattform St.Galler Gerichte Fall-Nr.: UV 2025/14 Entscheiddatum: 23.10.2025', 'Kanton St.Gallen Gerichte 1/16 Versicherungsgericht Abteilung III Entscheid vom 2 1 . Oktober 2025 Besetzung'];
    const r = kantonsEntscheiddatum(det, seiten);
    expect(r).toMatchObject({ datum: '2025-10-21', quelle: 'kopf-amtliches-pdf' });
    expect(mappeEntscheidOCL(det, null, '2026-09-25', { amtlicheKopfSeiten: seiten })!.datum).toBe('2025-10-21');
  });
  it('Zukunfts-Riegel greift auf das Kopfdatum (kantonal)', () => {
    expect(mappeEntscheidOCL(basis({ decision_date: '2025-01-01' }), null, '2025-08-01')).toBeNull();
  });
  it('Bund (CH): decision_date unverändert (Pfad byte-gleich)', () => {
    const s = mappeEntscheidOCL(basis({ court: 'bger', canton: 'CH', docket_number: '5A_1/2025', full_text: 'Bundesgericht Urteil vom 3. März 2025 Besetzung. Erwägungen folgen hier im Text.' }), null, '2026-09-25')!;
    expect(s.datum).toBe('2025-10-21');
  });
});

describe('kopfdatumRefresh — Bestand über den Generator (nur datum + zitierung)', () => {
  const snap = (over: Partial<EntscheidSnapshot>): EntscheidSnapshot => ({
    id: 'kanton/GR/gr_gerichte/SBK202638', gericht: 'gr_gerichte', gerichtName: 'Kantonsgericht GR', kanton: 'GR',
    nummer: 'SBK 2026 38', datum: '2026-06-24', zitierung: 'Kantonsgericht GR SBK 2026 38 vom 24.06.2026',
    quelle: 'opencaselaw', quelleUrl: 'https://entscheidsuche.gr.ch/x', abgerufen: '2026-06-26', fassungsToken: 'h', sha: 's',
    abschnitte: [], ...over,
  } as EntscheidSnapshot);
  const det = (over: Partial<OclDecision> = {}): OclDecision => ({
    decision_id: 'gr_gerichte_SBK 2026 38', court: 'gr_gerichte', canton: 'GR', docket_number: 'SBK 2026 38',
    decision_date: '2026-06-24', content_hash: 'h',
    full_text: 'Obergericht des Kantons Graubünden Entscheid vom 28. April 2026 mitgeteilt am 28. Mai 2026 Referenz SBK 26 38 Instanz Besetzung',
    ...over,
  } as OclDecision);
  const keineSeiten = async () => null;

  it('korrigiert datum + zitierung, lässt Text/sha/abgerufen und Bund/BS unberührt', async () => {
    const gr = snap({});
    const bund = snap({ id: 'bund/bger/x', kanton: 'CH', gericht: 'bger', nummer: 'x' });
    const bs = snap({ id: 'kanton/BS/bs_appellationsgericht/x', kanton: 'BS', quelle: 'gerichte-bs' as EntscheidSnapshot['quelle'] });
    const vorher = JSON.stringify([bund, bs]);
    const z = await kopfdatumRefresh([gr, bund, bs], { holeDecision: async () => det(), holeSeiten: keineSeiten });
    expect(z).toHaveLength(1);
    expect(gr.datum).toBe('2026-04-28');
    expect(gr.zitierung).toBe('Kantonsgericht GR SBK 2026 38 vom 28.04.2026');
    expect([gr.sha, gr.abgerufen, gr.fassungsToken]).toEqual(['s', '2026-06-26', 'h']);
    expect(JSON.stringify([bund, bs])).toBe(vorher);
  });
  it('Identitäts-Tor: fremdes Aktenzeichen ⇒ Abbruch, nichts geändert', async () => {
    const gr = snap({});
    await expect(kopfdatumRefresh([gr], { holeDecision: async () => det({ docket_number: 'SBK 2026 388' }), holeSeiten: keineSeiten })).rejects.toThrow(/ABBRUCH/);
    expect(gr.datum).toBe('2026-06-24');
  });
  it('ohne Kopfdatum bleibt der Bestandswert (ehrlich gemeldet)', async () => {
    const gr = snap({});
    const z = await kopfdatumRefresh([gr], { holeDecision: async () => det({ full_text: 'Obergericht Referenz SBK 26 38 Besetzung' }), holeSeiten: keineSeiten });
    expect(gr.datum).toBe('2026-06-24');
    expect(z[0].quelle).toBe('ocl-decision_date');
  });
  it('Kopfdatum nach dem Abrufdatum ⇒ Abbruch (Zukunfts-Riegel des Mappers), nichts geändert', async () => {
    const gr = snap({ abgerufen: '2026-04-01' });
    await expect(kopfdatumRefresh([gr], { holeDecision: async () => det(), holeSeiten: keineSeiten })).rejects.toThrow(/ABBRUCH/);
    expect(gr.datum).toBe('2026-06-24');
  });
});
