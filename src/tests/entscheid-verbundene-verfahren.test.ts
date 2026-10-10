import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { erstesAktenzeichen, verbundenesAktenzeichen, zitierungMitVerbundenemAz } from '../lib/rechtsprechung/verbundene-verfahren';
import { minteEcliFuerSnapshot } from '../lib/rechtsprechung/ecli';
import { mappeEntscheidOCL, type OclDecision } from '../../scripts/normtext/adapter-entscheide';
import { aktenzeichenRefresh } from '../../scripts/normtext/entscheide-aktenzeichen-refresh';
import { pruefeText, type RegEintrag } from '../../scripts/rechtsprechung/wochenlauf-kern';
import type { EntscheidSnapshot, EntscheidSnapshotDatei } from '../lib/rechtsprechung/typen';

// U-25 (plan/FEHLERBESTAND.md): BStGer RR.2025.198-199 stand nur als RR.2025.198. Beleg: Urteilskopf des Bundesstrafgerichts
// «Numéros de dossiers: RR.2025.198-199» (Arrêt du 26 août 2026, https://bstger.weblaw.ch/api/getDocumentContent/6f1f1186-…) und
// «Numero dell'incarto: BV.2026.10-11» (Decisione del 21 agosto 2026), beide abgerufen 11.10.2026; 20 von 20 BStGer-Köpfen im
// Bestand geprüft, nur diese zwei sind verbunden («Procédure secondaire: BP.2026.65» u. ä. ist eine eigene Sache, keine Verbindung).

const KOPF_RR = 'Arrêt du 26 août 2026\nCour des plaintes\nComposition\n\nObjet\n\nEntraide\n\nNuméros de dossiers: RR.2025.198-199\n\n\n\nRR.2025.198-199\n\n2\nFaits:';
const KOPF_BV = 'Decisione del 21 agosto 2026\nNumero dell’incarto: BV.2026.10-11\nProcedura secondaria: BP.2026.51-52\n';

describe('verbundenesAktenzeichen', () => {
  it('liest die erweiterte Nummer hinter dem Etikett des Urteilskopfs', () => {
    expect(verbundenesAktenzeichen('RR.2025.198', KOPF_RR)).toBe('RR.2025.198-199');
    expect(verbundenesAktenzeichen('BV.2026.10', KOPF_BV)).toBe('BV.2026.10-11');
  });
  it('nie ein Präfix, nie ohne Etikett, nie eine Nebensache', () => {
    expect(verbundenesAktenzeichen('RR.2025.19', KOPF_RR)).toBe('RR.2025.19');
    expect(verbundenesAktenzeichen('BP.2026.51', KOPF_BV)).toBe('BP.2026.51');   // steht nur nach «Procedura secondaria», nicht hinter dem Nummern-Etikett
    expect(verbundenesAktenzeichen('RR.2025.198', 'Im Urteil RR.2025.198-199 wird ausgeführt …')).toBe('RR.2025.198');
    expect(verbundenesAktenzeichen('RR.2026.110', 'Numéro de dossier: RR.2026.110\nProcédure secondaire: RP.2026.45')).toBe('RR.2026.110');
    expect(verbundenesAktenzeichen('5A_1/2025', 'Numéros de dossiers: 5A_1/2025-2')).toBe('5A_1/2025');
    expect(verbundenesAktenzeichen('RR.2025.198', null)).toBe('RR.2025.198');
  });
  it('erstesAktenzeichen und Zitierung', () => {
    expect(erstesAktenzeichen('RR.2025.198-199')).toBe('RR.2025.198');
    expect(erstesAktenzeichen('RR.2025.198')).toBe('RR.2025.198');
    expect(zitierungMitVerbundenemAz('BStGer RR.2025.198 vom 26. August 2026', 'RR.2025.198', 'RR.2025.198-199')).toBe('BStGer RR.2025.198-199 vom 26. August 2026');
    expect(zitierungMitVerbundenemAz('BStGer RR.2025.1980 vom 1. Mai 2026', 'RR.2025.198', 'RR.2025.198-199')).toBe('BStGer RR.2025.1980 vom 1. Mai 2026');
  });
});

describe('Neuzug und Bestand', () => {
  const det = (full_text: string): OclDecision => ({
    decision_id: 'bstger_RR.2025.198', court: 'bstger', canton: 'CH', docket_number: 'RR.2025.198', decision_date: '2026-08-26',
    citation_string_de: 'BStGer RR.2025.198 vom 26. August 2026', language: 'fr', full_text, content_hash: 'h',
  } as OclDecision);
  const text = `${KOPF_RR}\nA. Le 10 juillet 2020, les autorités ukrainiennes ont adressé une demande d’entraide à la Suisse.`;

  it('Adapter: nummer + zitierung erweitert, id und ECLI auf der ersten Nummer', () => {
    const s = mappeEntscheidOCL(det(text), null, '2026-10-01')!;
    expect(s.nummer).toBe('RR.2025.198-199');
    expect(s.zitierung).toBe('BStGer RR.2025.198-199 vom 26. August 2026');
    expect(s.id).toBe('bund/bstger/RR_2025_198');
    expect(minteEcliFuerSnapshot(s)).toBe('ECLI:CH:BSTGER:2026:RR.2025.198');
  });
  it('Refresh: erweitert nur mit Kopf-Beleg und bricht bei fremdem Datensatz ab, ohne etwas zu ändern', async () => {
    const s = mappeEntscheidOCL(det('Arrêt du 26 août 2026 ohne Etikett. A. Le 10 juillet 2020, les autorités ukrainiennes ont adressé une demande.'), null, '2026-10-01') as EntscheidSnapshot;
    expect(s.nummer).toBe('RR.2025.198');
    const z = await aktenzeichenRefresh([s], { holeDecision: async () => det(text) });
    expect(z).toEqual([{ id: s.id, alt: 'RR.2025.198', neu: 'RR.2025.198-199' }]);
    expect(s.zitierung).toBe('BStGer RR.2025.198-199 vom 26. August 2026');
    expect(await aktenzeichenRefresh([s], { holeDecision: async () => det(text) })).toEqual([]);   // idempotent
    const t = mappeEntscheidOCL(det('x'.repeat(300)), null, '2026-10-01') as EntscheidSnapshot;
    await expect(aktenzeichenRefresh([t], { holeDecision: async () => ({ ...det(text), docket_number: 'RR.2025.999' }) })).rejects.toThrow(/ABBRUCH/);
    expect(t.nummer).toBe('RR.2025.198');
  });
  it('Wochenlauf-Identität erkennt das erweiterte Aktenzeichen im PDF-Kopf', () => {
    const fueller = `\n${'Erwägung '.repeat(80)}`;
    const e = (nummer: string): RegEintrag => ({ key: 'bstger_RR_2025_198', gericht: 'bstger', datum: '2026-08-26', nummer });
    expect(pruefeText(`${KOPF_RR}${fueller}`, e('RR.2025.198-199'), 'pdf')).toMatchObject({ treffer: true, akz: true, datum: true });
    expect(pruefeText(`${KOPF_RR}${fueller}`, e('RR.2025.198-200'), 'pdf')).toMatchObject({ akz: false });
  });
});

describe('Korpus: BStGer-Verbindungen', () => {
  const lade = (name: string) => (JSON.parse(readFileSync(join(process.cwd(), 'public/rechtsprechung/bund/bstger', name), 'utf8')) as EntscheidSnapshotDatei).eintraege[0];
  it('RR.2025.198-199 und BV.2026.10-11 tragen das amtliche Aktenzeichen, die Adresse bleibt', () => {
    const rr = lade('RR_2025_198.json');
    expect([rr.nummer, rr.zitierung, rr.id]).toEqual(['RR.2025.198-199', 'BStGer RR.2025.198-199 vom 26. August 2026', 'bund/bstger/RR_2025_198']);
    const bv = lade('BV_2026_10.json');
    expect([bv.nummer, bv.zitierung, bv.id]).toEqual(['BV.2026.10-11', 'BStGer BV.2026.10-11 vom 21. August 2026', 'bund/bstger/BV_2026_10']);
    expect(rr.ecli).toBe('ECLI:CH:BSTGER:2026:RR.2025.198');
  });
});
